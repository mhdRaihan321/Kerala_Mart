// config/initAdmin.js
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

async function initAdmin() {
    try {
        const adminExists = await Admin.findOne({ username: 'Admin' });
    
        if (!adminExists) {
          const admin = new Admin({ username: 'Admin', password: 'Adminstart' });
          await admin.save();
          console.log('Admin user created');
        } else {
          console.log('Admin user already exists');
        }
      } catch (error) {
        console.error('Error creating admin user:', error);
      }
    };

module.exports = initAdmin;
