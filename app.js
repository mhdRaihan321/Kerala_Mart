// Load environment variables from .env file
require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fileUpload = require('express-fileupload');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const emailOtpRoutes = require('./routes/emailverifyer');
const hbs = require('express-handlebars');
const db = require('./config/connection');
const app = express();

// View engine setup
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views', 'layout'), // Corrected directory path
  partialsDir: path.join(__dirname, 'views', 'partials') // Corrected directory path
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

// Configure sessions using MongoDB as session store
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URL || 'mongodb+srv://mhdraihan383:KTif7xvCBa3FM2G9@keralamart.pw7bdim.mongodb.net/Shopping?retryWrites=true&w=majority'
  }),
<<<<<<< HEAD
  cookie: { maxAge: 600000 }
=======
  cookie: { maxAge: 6000000 }
>>>>>>> 55e6d591a43294ca140fd77dc2b6b8f6888b273b
}));

// Connect to MongoDB
db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Database connected successfully");
  }
});

// Define routes
app.use('/', userRouter);
app.use('/0a0d0m0i0n0', adminRouter); // Assuming admin routes are prefixed with '/admin'
app.use('/emailOtp', emailOtpRoutes);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
