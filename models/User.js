const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: Number, required: true },
  password: { type: String, required: true },
  emailVerified: { type: Boolean, default: false }, // New field for email verification
});

const User = mongoose.model('User', userSchema);

module.exports = User;
