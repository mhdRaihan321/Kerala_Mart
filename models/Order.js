const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  deliveryDetails: {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  paymentMethod: { type: String, required: true },
  total: { type: Number, required: true },
  products: [
    {
      item: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true }
    }
  ],
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
