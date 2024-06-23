const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const cartSchema = new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  products: [
    {
      item: { type: ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true }
    }
  ]
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
