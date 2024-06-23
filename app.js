var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var hbs = require('express-handlebars')

var app = express();
var fileUpload=require('express-fileupload')
var db=require('./config/connection')
var session= require('express-session')
const Handlebars = require('handlebars');



// view engine setup
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views/layout'),
  partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(session({
  secret: 'raihan',
  resave: true,
  saveUninitialized: true,
  maxAge:60000
}));
db.connect((err) => {
  if (err) {
    console.log("Connection Error: " + err);
  } else {
    console.log("Database Connected to port 27017");
    // Start your server or continue initialization
  }
});

app.use('/', userRouter);
app.use('/0a0d0m0i0n0', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});







module.exports = app;