const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const userHelper = require('../models/user-helper');
const Handlebars = require('handlebars');

const authenticateUser = (req, res, next) => {
  if (req.session.user && req.session.user) {
    req.user = req.session.user; // Make user information available in the request object
    console.log(req.session.user._id);
    next();
  } else {
    res.redirect('/login');
  }
};


/* GET home page. */
router.get('/',async (req, res) => {
  let user = req.session.user;
  console.log('User : ' + user);
  let cartCount = null
  if (req.session.user) {
    cartCount= await userHelper.getCartCount(req.session.user._id)
  }
  Product.getAllProducts()
    .then(products => {
      res.render('user/view-products', { products, admin: false, user , cartCount});
    })
    .catch(error => {
      console.error('Error fetching products:', error);
      res.status(500).send('Error fetching products');
    });
});


router.get('/signup', (req, res) => {
  res.render('user/signup');
});

router.post('/signup', async (req, res) => {
  try {
    console.log('Received signup data:', req.body);
    const response = await userHelper.doSignup(req.body);

    req.session.user = response; // Store the entire user object
    req.session.user.loggedIn = true;
    console.log(req.session.user._id); // Should log the user ID
    res.redirect('/');
  } catch (error) {
    let errorMessage = error.message || 'An error occurred during signup';
    if (errorMessage.includes('Path `name` is required')) {
      errorMessage = 'Enter Your Name';
    }
    console.error('Error during user signup:', error);
    res.render('user/signup', { error: errorMessage });
  }
});
  
  router.get('/login', (req, res) => {
    if (req.session.user) {
      res.redirect('/');
    } else {
      res.render('user/login', { "LoginErr": req.session.LoginErr });
      req.session.LoginErr = false;
    }
  });

router.post('/login', (req, res) => {
  console.log('Received login data:', req.body);
  userHelper.doLogin(req.body)
    .then(response => {
      if (response) {
        req.session.user = response; // Store the entire user object
        req.session.user.loggedIn = true;
        console.log(req.session.user._id); // Should log the user ID
        res.redirect('/');
      } else {
        req.session.LoginErr = true;
        res.render('user/login', { error: 'Invalid email or password' });
      }
    })
    .catch(error => {
      console.error('Error during user login:', error);
      res.render('user/login', { error: 'Invalid email or password' });
    });
});



router.get('/logout', (req, res) => {
  req.session.user = null
    res.redirect('/');
});

router.get('/cart', authenticateUser, async (req, res) => {
  let user = req.session.user;
  cartCount= await userHelper.getCartCount(req.session.user._id)
  try {
    let products = await userHelper.getCartProducts(req.session.user._id);
    
    if (products.emptyCart) {
      console.log('100  Cart Have No Products');
      products = [];
    }

    let total = 0;
    if (products.length > 0) {
      total = await userHelper.getTotalAmount(req.session.user._id);
    }

    console.log('User Id Using Sessions ' + req.session.user._id);
    console.log('User Id ' + req.user._id);
    let userId = req.user._id; // Access user ID from the user object in the request
    console.log('Products: ' + JSON.stringify(products)); // Debugging line to log products
    
    res.render('user/cart', { products, user, total , cartCount});
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});





router.get('/add-to-cart/:id',  (req, res) => {
  console.log('Session data:', req.session); // Add this line to debug the session data
console.log('Api');
  let userId = req.session.user._id; // Access the user ID correctly
  let userName = req.session.user.name; // Access the user name
  let productId = req.params.id;

  console.log(userId);

  userHelper.addToCart(productId, userId)
    .then(() => {
      console.log('User added this item: ' + productId, 'User Id Is: ' + userId, 'User Name: ' + userName);
      res.json({status:true})
    })
    .catch(error => {
      console.error('Error adding to cart:', error);
      res.status(500).send('Error adding to cart');
    });
});


router.post('/change-product-quantity/', async (req, res, next) => {
  try {
    console.log(' 141 Request body:', req.body);
    const { cart, product, count } = req.body;

    if(count === 0){
      console.log('Cart Item Is Zero From 145 : ');
    }

    // Call helper function to change product quantity
    const response = await userHelper.changeProductQuantity({ cart, product, count });
    let total = await userHelper.getTotalAmount(req.body.user);
    console.log('Response:', response);
    res.json({ status: true, total });
  } catch (error) {
    console.error('Error changing product quantity:', error);
    res.status(500).json({ status: false, error: 'Internal server error' });
  }
});


// POST endpoint to remove product from cart
router.post('/remove-from-cart', async (req, res, next) => {
  try {
    const { cart, product } = req.body;
    const response = await userHelper.removeFromCart(cart, product);
    res.json({ status: true });
  } catch (error) {
    console.error('Error removing product from cart:', error);
    res.status(500).json({ status: false, error: 'Internal server error' });
  }
});

router.get('/place-order', authenticateUser, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const total = await userHelper.getTotalAmount(userId);
    const products = await userHelper.getCartProducts(userId);
    
    res.render('user/place-order', { total, cartProducts: products, user: req.session.user });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/place-order', async (req, res) => {
  try {
    const products = await userHelper.getCartProductList(req.body.userId);
    const totalPrice = await userHelper.getTotalAmount(req.body.userId);

    const orderId = await userHelper.placeOrder(req.body, products, totalPrice);

    if (req.body['paymethod'] === 'COD') {
      res.json({ CodSuccess: true });
    } else if (req.body['paymethod'] === 'ONLINE') {
      const response = await userHelper.generateRazorPay(orderId, totalPrice);
      res.json(response);
    } else {
      console.log('Select One Option');
      res.status(400).json({ error: 'Invalid payment method selected' });
    }
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/0o0r0d0e0r0P0l0a0c0e0d',authenticateUser ,(req,res)=>{
  res.render('user/success_placed')
})


router.get('/orders', authenticateUser, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const orders = await userHelper.getUserOrders(userId);
    const cancelledOrders = orders.filter(order => order.status === 'cancelled');
    const cartCount = await userHelper.getCartCount(userId);
    
    console.log('User Orders in user.js:', JSON.stringify(orders, null, 2));
    res.render('user/orders', {
      user: req.session.user,
      orders,
      cancelledOrders,
      cartCount
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).send('Internal Server Error');
  }
});




router.get('/view-order-products/:id', authenticateUser, async (req, res) => {
  try {
    const products = await userHelper.getOrderProducts(req.params.id);
    const orderId = req.params.id;
    const order = await userHelper.getOrderById(orderId);
    console.log('Orders The Line From The User 250 :', order);
    const deliveryAddress = await userHelper.getDeveleryAddress(orderId);
    
    console.log('Delivery Address:', deliveryAddress);
    console.log('From The 233 for The orderid',req.params.id);
    console.log("The Order Detils : ", products);
    console.log("The Order Status : ", products.status);
    let orderStatus = order.status
    console.log("The Order Status 2: ", orderStatus );
    let paymentMethod = order.paymentMethod
    console.log("The Order Payment : ",  paymentMethod);
    let ordertotal = order.total
    console.log("Total Amount : ", ordertotal);

    let PaidOrNot = false

    if (paymentMethod === "COD"){
      console.log("It Cash On Delivery");
    }else{
      PaidOrNot = false
      console.log("It Online Payment");
      PaidOrNot = true
    }

    
    let createdAt = order.createdAt;
    let ProId = order._id;
    res.render('user/view-order-products', {  ordertotal, orderStatus,PaidOrNot , user: req.session.user, products, createdAt , deliveryAddress, orderId:req.params.id, ProId});
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Payment initiation
router.post('/payafterplaced', authenticateUser, async (req, res) => {
  const { orderId, ordertotal } = req.body;

  const orderD = userHelper.getOrderById(orderId)
  const deliveryAddress = await userHelper.getDeveleryAddress(orderId);
  try {
    const response = await userHelper.generateRazorPay(orderId, ordertotal);
    console.log("respone Before goinfg back to Html", response);
    console.log("respone Of Amount", response.amount);
    res.json(response);
  } catch (error) {
    console.error('Error generating RazorPay order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.post('/verify-payment', (req,res)=>{
  console.log(req.body);
  userHelper.verifyPayment(req.body).then(()=>{
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("Payment Success");
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false, errMsg : "Failed"})
  })
})

// POST endpoint to cancel an item from an order
router.post('/orders/cancel-item/:orderId/:productId', async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    console.log('Cancel-Item Request:', req.params);
    const success = await userHelper.cancelItem(orderId, productId);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, message: 'Failed to cancel item: Update operation did not modify any documents' });
    }
  } catch (error) {
    console.error('Error cancelling item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// POST endpoint to cancel an entire order
router.post('/orders/cancel-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('Cancel-Order Request:', req.params);
    await userHelper.cancelOrder(orderId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}); 

// user.js (Router)
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    cartCount= await userHelper.getCartCount(req.session.user._id)
    const UserInfo = await userHelper.getUserInfo(req.session.user._id);
    res.render('user/profile', { user: req.session.user, UserInfo ,cartCount });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/edituserinfo/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.params.id;
    const UserInfo = await userHelper.getUserInfo(userId);
    res.render('user/changeuserinfo', { UserInfo, user: req.session.user });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/edituserinfo/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.params.id;
    const UserInfoForUpdate = req.body;
    await userHelper.UpdateUserInfo(userId, UserInfoForUpdate);
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating user info:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/product-details/:id',authenticateUser, async (req,res)=>{
  cartCount= await userHelper.getCartCount(req.session.user._id)
  let proId = req.params.id
  let productDetailsView = await userHelper.getProductDetailsV(proId)
  console.log('Product Detils Got 323', productDetailsView);
  res.render('user/product-details-view',{user:req.session.user , productDetailsView, cartCount})
})

















// Date And Time Management
Handlebars.registerHelper('calculateDeliveryDate', function(orderDate) {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const orderDateObj = new Date(orderDate);
  const deliveryDateObj = new Date(orderDateObj);
  deliveryDateObj.setDate(deliveryDateObj.getDate() + 7); // Adding 7 days to order date

  const dayOfWeek = daysOfWeek[deliveryDateObj.getDay()]; // Get the day of the week
  const date = deliveryDateObj.getDate(); // Get the day of the month
  const month = months[deliveryDateObj.getMonth()]; // Get the month name
  const year = deliveryDateObj.getFullYear(); // Get the full year

  return `${dayOfWeek}, ${date} ${month} ${year}`;
});

Handlebars.registerHelper('formatDate', function(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
});

  // Define a Handlebars helper to check if order status is cancelled
Handlebars.registerHelper('isCancelled', function (status) {
    return status === 'cancelled';
  });


  Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});


module.exports = router;