const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: Number, required: true },
  password: { type: String, required: true },
  emailVerified: { type: Boolean, default: false }, // New field for email verification
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

// Pre-save hook to reset emailVerified if the email is changed
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.emailVerified = false; // Reset emailVerified
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
