// userAddress.js

const mongoose = require('mongoose');

const userAddressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true },
  pincode: { type: String, required: true }
});

const UserAddress = mongoose.model('UserAddress', userAddressSchema);

module.exports = UserAddress;
