const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const User = require("./User"); // Adjust the path as necessary
const Cart = require("./Cart"); // Adjust the path as necessary
const Product = require("./Product"); // Adjust the path as necessary
const Order = require("./Order"); // Adjust the path as necessary
const collection = require("../config/collection"); // Adjust the path as necessary
const { response } = require("express");
const Razorpay = require('razorpay');



var instance = new Razorpay({
  key_id: 'rzp_test_HSGXHXFayRD319',
  key_secret: 'I1kTu4mh1y11bd5SGf97DQZA',
});



module.exports ={
    doSignup: async (userData) => {
      try {
        // Validate input data
        if (!userData || !userData.name || !userData.email || !userData.password) {
          throw new Error("Name, email, and password are required");
        }
  
        const hashedPassword = await bcrypt.hash(userData.password, 10); // Ensure to use userData.password
        userData.password = hashedPassword;
  
        const user = new User({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          mobile: userData.mobile, // Optional: Ensure mobile is validated if required
        });
  
        const savedUser = await user.save();
        return savedUser.toObject(); // Convert to plain JavaScript object
      } catch (error) {
        console.error("Error during user signup:", error);
        throw error;
      }
    },
  doLogin: async (userData) => {
    try {
      const email = userData.email;
      const password = userData.password || userData.Password;

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const user = await User.findOne({ email: email });
      if (!user) {
        throw new Error("Invalid email or password");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid Email or Password");
      }

      return user.toObject(); // Ensure the entire user object is returned
    } catch (error) {
      console.error("Error during user login:", error);
      throw error;
    }
  },

  addToCart: async (proId, userId) => {
    try {
      // Convert proId to ObjectId
      let productId = new ObjectId(proId);

      // Check if the user already has a cart
      let userCart = await Cart.findOne({ user: new ObjectId(userId) });

      if (userCart) {
        // Check if the product already exists in the cart
        let existingProductIndex = userCart.products.findIndex(product => product.item.equals(productId));

        if (existingProductIndex !== -1) {
          // If product exists, update its quantity
          await Cart.updateOne(
            { 'user': new ObjectId(userId), 'products.item': productId },
            { $inc: { 'products.$.quantity': 1 } }
          );
        } else {
          // If product does not exist, push new product to array
          await Cart.updateOne(
            { 'user': new ObjectId(userId) },
            { $push: { 'products': { item: productId, quantity: 1 } } }
          );
        }
      } else {
        // If cart does not exist, create new cart
        let cartObj = {
          user: new ObjectId(userId),
          products: [{ item: productId, quantity: 1 }]
        };
        await Cart.create(cartObj);
      }

      return; // Return successfully
    } catch (error) {
      throw new Error("Error adding to cart: " + error.message);
    }
  },

  getCartProducts: (userId) => {
    return new Promise((resolve, reject) => {
      // Validate userId
      if (!ObjectId.isValid(userId)) {
        console.error('Invalid user ID:', userId); // Log invalid userId for debugging
        return reject(new Error('Invalid user ID format'));
      }

      Cart.aggregate([
        { $match: { user: new ObjectId(userId) } },
        { $unwind: '$products' },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        {
          $unwind: {
            path: '$productDetails',
            preserveNullAndEmptyArrays: true // Preserve empty arrays to handle dummy items
          }
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            productDetails: 1
          }
        }
      ]).exec()
        .then(cartItems => {
          console.log('Cart Items:', JSON.stringify(cartItems, null, 2)); // Log the full structure

          // Filter out invalid items (e.g., where productDetails is null)
          const validCartItems = cartItems.filter(item => item.productDetails);

          if (validCartItems.length > 0) {
            resolve(validCartItems); // Resolve with valid cart items
          } else {
            console.log('No valid cart items found');
            resolve({ emptyCart: true }); // Resolve with an empty cart indicator
          }
        })
        .catch(error => {
          reject(new Error('Error fetching cart products: ' + error.message));
        });
    });
  },


  getCartCount: async (userId) => {
    let count = 0;
    try {
      let cart = await Cart.findOne({ user: new ObjectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      return count;
    } catch (error) {
      console.error("Error fetching cart count:", error);
      throw error;
    }
  },
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    return new Promise((resolve, reject) => {
      Cart.updateOne(
        { _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) },
        { $inc: { 'products.$.quantity': details.count } }
      ).then((response) => {
        if (response.modifiedCount > -1 && details.count < 1) {
          // Check if the quantity of the product is now 0 or less
          Cart.updateOne(
            { _id: new ObjectId(details.cart) },
            { $pull: { products: { item: new ObjectId(details.product), quantity: { $lte: 0 } } } }
          ).then((removeResponse) => {
            resolve(removeResponse);
          }).catch((err) => {
            console.error('Error removing product with zero quantity:', err);
            reject(err);
          });
        } else {
          resolve(response);
        }
      }).catch((err) => {
        console.error('Error updating product quantity:', err);
        reject(err);
      });
    });
  },
  removeFromCart: async (cartId, productId) => {
    try {
      const result = await Cart.updateOne(
        { _id: cartId },
        { $pull: { products: { item: productId } } }
      );
      return result;
    } catch (error) {
      throw new Error('Error removing product from cart: ' + error.message);
    }
  },
  getTotalAmount: (userId) => {
    return new Promise((resolve, reject) => {
      // Validate userId
      if (!ObjectId.isValid(userId)) {
        console.error('Invalid user ID:', userId); // Log invalid userId for debugging
        return reject(new Error('Invalid user ID format'));
      }

      Cart.aggregate([
        { $match: { user: new ObjectId(userId) } },
        { $unwind: '$products' },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        {
          $unwind: '$productDetails'
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$quantity', '$productDetails.price'] } }
          }
        }
      ]).exec().then(total => {
        if (total && total.length > 0) {
          resolve(total[0].total); // Resolve with the total amount
        } else {
          resolve(0); // Resolve with 0 if no items found
        }
      }).catch(error => {
        console.error('Error calculating total amount:', error);
        reject(new Error('Error calculating total amount'));
      });
    });
  },

  placeOrder: (order, products, total) => {
    return new Promise(async (resolve, reject) => {
      try {
        let status = order.paymethod === 'COD' ? 'Placed' : 'Pending';

        // Get current date and extract only day, month, and year
        let orderObj = {
          deliveryDetails: {
            name: order.name,
            mobile: order.mobile,
            address: order.address,
            pincode: order.pincode
          },
          userId: new ObjectId(order.userId),
          paymentMethod: order.paymethod,
          total: total,
          products: products.map(product => ({
            item: new ObjectId(product.item),
            quantity: product.quantity
          })),
          status: status,
          createdAt: new Date(), // Save only the date part
        };

        const newOrder = new Order(orderObj);
        const savedOrder = await newOrder.save();

        // Remove the cart after placing the order
        await Cart.deleteOne({ user: new ObjectId(order.userId) });

        resolve(savedOrder._id.toString()); // Return the order ID as a string
      } catch (error) {
        reject(error);
      }
    });
  },


  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let Carts = await Cart.findOne({ user: new ObjectId(userId) })
      resolve(Carts.products)
    })
  },
  getUserOrders : (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const orders = await Order.aggregate([
          { $match: { userId: new ObjectId(userId) } },
          { $sort: { createdAt: -1 } },
          { $unwind: "$products" },
          {
            $lookup: {
              from: 'products',
              localField: 'products.item',
              foreignField: '_id',
              as: 'productDetails'
            }
          },
          { $unwind: "$productDetails" },
          {
            $group: {
              _id: "$_id",
              deliveryDetails: { $first: "$deliveryDetails" },
              userId: { $first: "$userId" },
              paymentMethod: { $first: "$paymentMethod" },
              total: { $first: "$total" },
              status: { $first: "$status" },
              createdAt: { $first: "$createdAt" },
              products: {
                $push: {
                  productId: "$products.item",
                  quantity: "$products.quantity",
                  productName: "$productDetails.name"
                }
              }
            }
          }
        ]).exec();
        console.log("Orders of the User in getUserOrders: ", JSON.stringify(orders, null, 2));
        const order = await Order.find({ userId: new ObjectId(userId) }).exec();
        console.log("Direct Database Query:", order);
        resolve(orders);
      } catch (error) {
        console.error("Error fetching user orders:", error);
        reject(error);
      }
    });
  },   
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let orderItems = await Order.aggregate([
                { $match: { _id: new ObjectId(orderId) } },
                { $unwind: "$products" },
                {
                    $lookup: {
                        from: "products",
                        localField: "products.item",
                        foreignField: "_id",
                        as: "productDetails",
                    },
                },
                { $unwind: "$productDetails" },
                {
                    $project: {
                        item: "$products.item",
                        quantity: "$products.quantity",
                        createdAt: "$createdAt",
                        productName: "$productDetails.name",
                        productPrice: "$productDetails.price",
                        productImageUrl: "$productDetails.imageUrl",
                        productDescription: "$productDetails.description",
                        productQuantity: "$productDetails.quantity",
                        productDname: "$productDetails.dname", // Include dname
                        productMainName: "$productDetails.mainname", // Include dname
                        productBrandInfo: "$productDetails.brandinfo", // Include brandinfo
                        status: "$status", // Include brandinfo
                        deliveryDetails: {
                            name: "$deliveryDetails.name",
                            mobile: "$deliveryDetails.mobile",
                            address: "$deliveryDetails.address",
                            pincode: "$deliveryDetails.pincode"
                        }
                    },
                },
            ]).exec();

            resolve(orderItems);
        } catch (error) {
            reject(error);
        }
    });
},

  getOrderById: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let order = await Order.findById(orderId).exec();
        resolve(order);
      } catch (error) {
        reject(error);
      }
    });
  },
  generateRazorPay: (orderId, totalPrice) => {
    return new Promise((resolve, reject) => {
      try {

        var options = {
          amount: totalPrice * 100,  // amount in the smallest currency unit (e.g., paise)
          currency: "INR",
          receipt: "" + orderId
        };

        instance.orders.create(options, function (err, order) {
          if (err) {
            console.error('Error creating Razorpay order:', err);
            reject(err);
          } else {
            console.log('New Order:', order);
            resolve(order);
          }
        });
      } catch (error) {
        console.error('Exception in generateRazorPay:', error);
        reject(error);
      }
    });
  },
  cancelItem : async (orderId, productId) => {
    try {
      const order = await Order.findOne({ _id: orderId }).lean();
      if (!order) {
        throw new Error('Order not found');
      }
  
      console.log('Order Products:', JSON.stringify(order.products, null, 2));
  
      const productExists = order.products.some(product => product.item.toString() === productId);
      if (!productExists) {
        throw new Error('Product not found in order');
      }
  
      const updateResult = await Order.updateOne(
        { _id: orderId },
        { $pull: { products: { item: productId } } }
      );
  
      console.log('Update Result:', JSON.stringify(updateResult, null, 2));
  
      if (updateResult.nModified > 0) {
        const updatedOrder = await Order.findOne({ _id: orderId }).lean();
        console.log('Updated Order:', JSON.stringify(updatedOrder, null, 2));
        return true;
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      console.error('Error in cancelItem function:', error);
      throw new Error('Failed to cancel item: ' + error.message);
    }
  },
  


  cancelOrder: async (orderId) => {
    try {
      const order = await Order.findOne({ _id: orderId }).lean();
      if (!order) {
        throw new Error('Order not found');
      }

      const result = await Order.updateOne(
        { _id: orderId },
        { $set: { status: 'cancelled' } }
      ).lean();

      return result.nModified > 0;
    } catch (error) {
      throw new Error('Failed to cancel order: ' + error.message);
    }
  },


  verifyPayment: (detils) => {
    return new Promise((resolve, reject) => {
      const crypto = require('crypto');
      let hmac = crypto.createHmac('sha256', 'I1kTu4mh1y11bd5SGf97DQZA');
      hmac.update(detils['payment[razorpay_order_id]'] + '|' + detils['payment[razorpay_payment_id]'])
      hmac = hmac.digest('hex')
      if (hmac == detils['payment[razorpay_signature]']) {
        resolve()
      }
      else {
        reject()
      }
    })
  },
  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      Order.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            status: 'placed',
            paymentMethod: 'ONLINE'
          }
        }
      ).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  },
  
  getAllOrderIds: async () => {
    try {
      // Fetch only the order IDs from the orders collection
      const orders = await Order.find({}, '_id');
      return orders.map(order => order._id);
    } catch (error) {
      console.error('Error fetching order IDs:', error);
      throw error;
    }
  },
  
    getAllOrders: async () => {
      try {
        const orders = await Order.find()
          .sort({ createdAt: -1 })
          .lean()
          .populate('products.item', 'productImageUrl productName productMainName');
        console.log("All Orders for Admin Panel:", orders);
        return orders;
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
    },
  
    getproductbyOrderId: async (orderId) => {
      try {
        const order = await Order.findById(orderId)
          .populate('products.item', 'productImageUrl productName productMainName');
          console.log("order products : for Admin All Orders",order.products.item);
          const proD = await Product.findById(order.products.item)
          console.log('Product D', proD);
          return order ? order.products : null;
      } catch (error) {
        console.error('Error fetching product by order ID:', error);
        throw error;
      }
    },


  
  updateOrderStatus: async (orderId, status) => {
    try {
      const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true }).lean().exec();
      if (!updatedOrder) {
        throw new Error(`Order with ID ${orderId} not found`);
      }
      return updatedOrder;
    } catch (error) {
      throw new Error(`Error updating order status: ${error.message}`);
    }
  },
  getUserInfo: async (userId) => {
    try {
      const UserD = await User.findOne({ _id: new ObjectId(userId) }).lean()
      if (!UserD) {
        throw new Error(`User with ID ${userId} not found`);
      }
      console.log(UserD, "USer Info In 515");
      return UserD;
    } catch (error) {
      throw new Error(`Error While Finding User Info: ${error.message}`);
    }
  },
  // user-helper.js (Helper Function)
  UpdateUserInfo: async (userId, UserDetails) => {
    try {
      const updateResult = await User.updateOne(
        { _id: new ObjectId(userId) },
        { $set: UserDetails }
      ).lean();

      if (updateResult.nModified === 0) {
        throw new Error('User info not found or no changes made');
      }

      console.log('User updated successfully');
      return updateResult;
    } catch (error) {
      throw new Error(`Error while updating user info: ${error.message}`);
    }
  },
  getProductDetailsV: async (ProId) => {
    try{
      const getProDetails = await Product.findOne({_id:new ObjectId(ProId)}).lean()
      if(!getProDetails){
        throw ('Not Found a Product WIth The Product Id')
      }
      console.log('ProDuct Details : 543', getProDetails);
      return getProDetails;
    }catch(error){
      throw new Error(`Error while Geting Product Details: ${error.message}`);
    }
  }, 
  getDeveleryAddress :async (orderId) => {
    try {
      const order = await Order.findById(orderId).lean(); // Lean for plain JavaScript object
      if (!order) {
        throw new Error('Order not found');
      }
      const deliveryDetails = order.deliveryDetails;
      return deliveryDetails;
    } catch (error) {
      console.error('Error fetching delivery details:', error);
      throw error; // Propagate the error to handle in calling function
    }
  },


};
