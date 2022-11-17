
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars')
const fetch = require('node-fetch');
var setCookie=require('set-cookie-parser')
const lodAsh = require('lodash');
require('dotenv').config({ path: path.join(__dirname, '.env') });


var session = require('express-session')
// const twilio=require('twilio')
const bodyParser=require('body-parser')
// const MessagingResponse = require('twilio').twiml.MessagingResponse;

var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

var app = express();
var db=require('./config/connection')
//var fileUpload=require('express-fileupload');
const { Cookie } = require('express-session');
const e = require('express');
const { count } = require('console');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/',
helpers:{
  // Function to do basic mathematical operation in handlebar
  math: function(lvalue, operator, rvalue) {
      lvalue = parseFloat(lvalue);
      rvalue = parseFloat(rvalue);
      return {
          "+": lvalue + rvalue,
          "-": lvalue - rvalue,
          "*": lvalue * rvalue,
          "/": lvalue / rvalue,
          "%": lvalue % rvalue
      }[operator];
  },
  stringCompare:function(lvalue,rvalue){
    if(lvalue==rvalue){
      return true
    }
    else{
      return false
    }
  },
  compare:function(left,operator,right){
    switch (operator) {
      case '<': 
        if(left<right)
        {
          return true
        }
      break;
      case '>': 
        if(left>right)
        {
          return true
        }
      break;
      case '==': 
      if(left>right)
      {
        return true
      }
      break; 
      case '!=': 
      if(left>right)
      {
        return true
      }
      break; 
      default:
        return true
      break;
    }
  },
  checkStatus:function(value){
    switch (value) {
      case 'placed':
        return 25;
        break;
      case 'Packed':
        return 50;
        break;
      case 'Shipped':
        return 75;
        break;
      case 'Delivered':
        return 100;
        break;
      default:
        return 25;
        break;
    }
  },
  findInWishList:function (array,value){
    let count=0;
    console.log('-----------------',value);
    (array[0].list).forEach(element => {
      console.log("--------element---------",element);
      var result=lodAsh.isEqual(element,value)
      console.log("result: ",result);
      if(result){
        count=1
      }      
    });
    if(count==1){
      console.log("------1----------")
      return true
    }
    else{
      console.log("------------f---------");
      return false
    }
  }
}}))



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret:"Key",
  cookie:{maxAge:500000, sameSite:'lax',secure:'auto'},
  resave: false,
  saveUninitialized: true,
}))
//Set-Cookie: widget_session=abc123; SameSite=None; Secure

app.get("/set-cookie",(req,res)=>{
  res.setHeader("Set-Cookie", "key=value; Max-Age=60","SameSit=Lax");
  res.send();
});


//app.use(fileUpload())

db.connect((err)=>{
if(err)
console.log("Connection Error");
else
console.log("Db Connected Successfully");
})

app.use('/', indexRouter);
// app.use('/users', usersRouter);

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
