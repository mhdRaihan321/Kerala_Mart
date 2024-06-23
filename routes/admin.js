const express = require('express');
const router = express.Router();
const AdminHelper = require('../models/adminHelper');
const productH = require('../models/Product');
const Product = require('../models/Product');
const { response } = require('../app');
const userHelper = require('../models/user-helper');
const fs = require('fs');
const path = require('path');

// Ensure the directory exists
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const authenticateAdmin = (req, res, next) => {
  if (req.session.admin && req.session.admin._id) {
    req.admin = req.session.admin;
    next();
  } else {
    res.redirect('/0a0d0m0i0n0/login');
  }
};



// Admin Dashboard
router.get('/', authenticateAdmin, (req, res, next) => {
  productH.getAllProducts()
    .then(products => {
      res.render('admin/view-products', { products, admin: true , adminDetils: req.admin });
    })
    .catch(error => {
      console.error('Error fetching products:', error);
      res.status(500).send('Error fetching products');
    });
});

// Admin Signup Page
router.get('/signup', (req, res) => {
  res.render('admin/signup', { signupError: req.session.signupError });
  req.session.signupError = null;
});

// Admin Signup Post Request
router.post('/signup', async (req, res) => {
  const { name, email, mobile, password } = req.body;
  try {
    const adminData = { name, email, mobile, password };
    await AdminHelper.createAdmin(adminData).then((response)=>{
      req.session.admin = response; // Store the entire user object
      req.session.admin.loggedin = true
      res.redirect('/0a0d0m0i0n0/login');
    })
  } catch (error) {
    console.error('Admin signup error:', error);
    req.session.signupError = error.message;
    res.redirect('/0a0d0m0i0n0/signup');
  }
});

// Admin Login Page
router.get('/login', (req, res) => {
  res.render('admin/login', { loginError: req.session.loginError });
  req.session.loginError = null;
});

// Admin Login Post Request
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const admin = await AdminHelper.doAdminLogin(identifier, password);
    req.session.admin = admin; // Store the entire user object
    req.session.admin.loggedin = true
    res.redirect('/0a0d0m0i0n0');
  } catch (error) {
    console.error('Admin login error:', error);
    req.session.loginError = error.message;
    res.redirect('/0a0d0m0i0n0/login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to logout');
    }
    res.redirect('/0a0d0m0i0n0/login');
  });
});


// Add Product Page
router.get('/add-product', authenticateAdmin, (req, res) => {
  res.render('admin/add-product' ,{adminDetils: req.session.admin, admin: true});
});

// Add Product Post Request
router.post('/add-product', authenticateAdmin, async (req, res) => {
  try {
    const productData = req.body;
    const mainImage = req.files.imageUrl;
    const images = req.files.images;

    if (!mainImage) {
      throw new Error('Main image is required');
    }

    const mainImageUrl = `/product-images/${Date.now()}_${mainImage.name}`;
    await mainImage.mv(`./public${mainImageUrl}`);
    productData.imageUrl = mainImageUrl;

    if (images && images.length > 0) {
      const imageUrls = [];
      if (Array.isArray(images)) {
        for (const image of images) {
          const imageUrl = `/product-images/${Date.now()}_${image.name}`;
          await image.mv(`./public${imageUrl}`);
          imageUrls.push(imageUrl);
        }
      } else {
        const imageUrl = `/product-images/${Date.now()}_${images.name}`;
        await images.mv(`./public${imageUrl}`);
        imageUrls.push(imageUrl);
      }
      productData.images = imageUrls;
    } else {
      productData.images = [];
    }

    await Product.create(productData);

    res.render("admin/add-product", { success: "Product added successfully!", adminDetils: req.session.admin });
  } catch (err) {
    console.error('Error', err);
    res.status(500).send('Error occurred while adding product');
  }
});


// Delete Product
router.get('/delete-product/:id', authenticateAdmin, (req, res) => {
  const proId = req.params.id;
  productH.removeById(proId)
    .then(() => {
      res.redirect('/0a0d0m0i0n0');
    })
    .catch(error => {
      console.error('Error deleting product:', error);
      res.status(500).send('Error deleting product');
    });
});

// Edit Product Page
router.get('/edit-product/:id', authenticateAdmin, async (req, res) => {
  const proId = req.params.id;
  try {
    let product = await productH.getProductDetails(proId);
    res.render('admin/edit-product', { product });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).send('Error fetching product details');
  }
});

// Edit Product Post Request
router.post('/edit-product/:id', authenticateAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    const productData = req.body;
    const mainImage = req.files && req.files.imageUrl;
    const images = req.files && req.files.images;

    const uploadDir = path.join(__dirname, '..', 'public', 'product-images');
    ensureDirectoryExists(uploadDir);

    if (mainImage) {
      const mainImageUrl = `/product-images/${Date.now()}_${mainImage.name}`;
      await mainImage.mv(path.join(uploadDir, path.basename(mainImageUrl)));
      productData.imageUrl = mainImageUrl;
    }

    if (images && images.length > 0) {
      const imageUrls = [];
      if (Array.isArray(images)) {
        for (const image of images) {
          const imageUrl = `/product-images/${Date.now()}_${image.name}`;
          await image.mv(path.join(uploadDir, path.basename(imageUrl)));
          imageUrls.push(imageUrl);
        }
      } else {
        const imageUrl = `/product-images/${Date.now()}_${images.name}`;
        await images.mv(path.join(uploadDir, path.basename(imageUrl)));
        imageUrls.push(imageUrl);
      }
      productData.images = imageUrls;
    }

    await Product.updateProduct(productId, productData);

    res.render("admin/edit-product", { success: "Product updated successfully!", product: await Product.findById(productId) , adminDetils: req.admin});
  } catch (err) {
    console.error('Error', err);
    res.status(500).send('Error occurred while updating product');
  }
});


router.get('/allorders', authenticateAdmin, async (req, res) => {
  try {
    const orders = await userHelper.getAllOrders();
    console.log('Orders for Admin:', orders);

    // Fetch product details for each order
    for (const order of orders) {
      const products = await userHelper.getOrderProducts(order._id);
      order.productsInfo = products; // Attach products info to each order
    }

    const admin = req.session.admin; // Retrieve admin information from the request
    res.render('admin/allorders', { orders, admin, adminDetails: req.admin });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).send('Error fetching orders');
  }
});


// New route for viewing more details of products in an order
router.get('/productdetailoforder/:id', authenticateAdmin, async (req, res) => {
  try {
    const orderId = req.params.id;
    const moreInfo = await userHelper.getOrderProducts(orderId);
    console.log("More Info Of Order:", moreInfo);
    res.render('admin/moreinfooforder', { moreInfo, adminDetails: req.session.admin });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).send('Error fetching product details');
  }
});
// Route to update order status
router.post('/update-order/:orderId', authenticateAdmin, async (req, res) => {
  const orderId = req.params.orderId;
  const { status } = req.body;

  try {
    const updatedOrder = await userHelper.updateOrderStatus(orderId, status);
    res.status(200).json({ message: 'Order status updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
