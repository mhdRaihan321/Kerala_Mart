const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const userHelper = require('../models/user-helper');
require('dotenv').config();

const authenticateUser = (req, res, next) => {
  if (req.session.user && req.session.user) {
    req.user = req.session.user; // Make user information available in the request object
    next();
  } else {
    res.redirect('/login');
  }
};

const otpStore = {}; // Store OTPs in memory for demonstration. Use a database in production.

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

router.get('/profile/verifyemail', authenticateUser, (req, res) => {
  res.render('user/email-verification');
});

router.post('/send-otp', authenticateUser, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send('Email is required');
  }

  const otp = generateOTP();
  const expires = Date.now() + 300000; // OTP expires in 5 minutes

  otpStore[email] = { otp, expires };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.render('user/otp-verification', { email });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Error sending email');
  }
});

router.post('/verify-otp', authenticateUser, async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).send('Email and OTP are required');
  }

  const storedOtpData = otpStore[email];

  if (!storedOtpData) {
    return res.status(400).send('Invalid or expired OTP');
  }

  const { otp: storedOtp, expires } = storedOtpData;

  if (Date.now() > expires) {
    delete otpStore[email];
    return res.status(400).send('OTP has expired');
  }

  if (storedOtp !== otp) {
    return res.status(400).send('Invalid OTP');
  }

  // Update user email verification status in database
  try {
    await userHelper.verifyUserEmail(req.session.user._id, email);
    delete otpStore[email];
    res.send('OTP verified successfully');
  } catch (error) {
    console.error('Error updating email verification status:', error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
