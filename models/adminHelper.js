const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const User = require("./User"); // Adjust the path as necessary
const Cart = require("./Cart"); // Adjust the path as necessary
const Order = require("./Order"); // Adjust the path as necessary
const collection = require("../config/collection"); // Adjust the path as necessary
const bcrypt = require("bcrypt");
const Admin = require("./Admin"); // Adjust the path as necessary

module.exports = {
  async createAdmin(adminData) {
    const admin = new Admin(adminData);
    await admin.save();
    return admin;
  },

  async doAdminLogin(identifier, password) {
    const admin = await Admin.findOne({
      $or: [{ name: identifier }, { email: identifier }, { mobile: identifier }],
    });

    if (!admin) {
      throw new Error('Admin not found');
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid password');
    }

    return admin;
  },
};