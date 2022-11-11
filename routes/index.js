//import { fetch } from "node-fetch";
require("dotenv").config();
var express = require("express");
const fetch = require("node-fetch");
//const { route, response } = require("../app");
var router = express.Router();
var userHelpers = require("../helpers/user-helpers");
var productHelpers = require("../helpers/product-helpers");
const { Db, ObjectId } = require("mongodb");
const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
const serviceId=process.env.serviceId
const client = require("twilio")(accountSid, authToken);
const multer=require('multer')

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/product-images')
  },
  filename: function (req, file, cb) {
    console.log("-------",file);
    cb(null, file.fieldname + '-' + new ObjectId()+'.webp')
  }
})
const upload = multer({ storage: storage })  

//import fetch from 'node-fetch';

var paypal = require("paypal-rest-sdk");
const async = require("hbs/lib/async");
const { response } = require("express");

//const { response } = require("express");

// paypal.configure({
//     'mode': 'sandbox', //sandbox or live
//     'client_id': 'AWNcracQtclmKNKDjTJmizg2RBgA0ofqGlq9kLRGh9ewgPPE5n-E-ZDN8WotcSminDkg3uaibMzBS7G-',
//     'client_secret': 'EDRQZzNn2gCH8fsohfYMxd3cP9NCUE-tV8hipENnGRs8my2kprXnrVy9y4xPxrJDLsCfP1HiCW2YWun7'
// });

// const CLIENT_ID='AWNcracQtclmKNKDjTJmizg2RBgA0ofqGlq9kLRGh9ewgPPE5n-E-ZDN8WotcSminDkg3uaibMzBS7G-'
// const APP_SECRET='EDRQZzNn2gCH8fsohfYMxd3cP9NCUE-tV8hipENnGRs8my2kprXnrVy9y4xPxrJDLsCfP1HiCW2YWun7'
// const base = "https://api-m.sandbox.paypal.com";

/* GET home page. */
router.get("/", function (req, res, next) {
  res.redirect("/dressMart-home");
});

router.get("/dressMart-home", async function (req, res, next) {
  productHelpers.getBanners().then(async (banner) => {
    if (req.session.user) {
      //userHelpers.getOrderedProducts(req.session.user._id)
      let cartCount = await userHelpers.getCartCount(req.session.user._id);
      let wishList=await userHelpers.getWishList(req.session.user._id)
      productHelpers.getHomeProducts().then((products) => {
        res.render("index", {
          pageUser: true,
          uname,
          products,
          cartCount,
          home: true,
          banner,
          wishList
        });
      });
    } else {
      productHelpers.getHomeProducts().then((products) => {
        res.render("index", {
          pageUser: true,
          uname: false,
          products,
          home: true,
          banner,
          wishList:false
        });
      });
    }
  });
});

router.get("/login", function (req, res, next) {
  res.setHeader("Cache-Control", "no-store");
  var user = req.session.user;

  if (user) {
    res.redirect("/");
  } else {
    res.render("user/user-login", {
      title: "User-Login",
      loginError: req.session.loginErr,
      pageUser: true,
    });
    req.session.loginErr = false;
  }
});

router.get("/register", function (req, res, next) {
  res.render("user/signup", { pageUser: true });
});

router.get("/shop/", async function (req, res, next) {
  let totalProductCount = await productHelpers.getTotalProductCount();

  let pagesCount = Math.ceil(totalProductCount / 8);

  let page = parseInt(req.query.page);
  if (page < 1) {
    page = 1;
  }
  if (page > pagesCount) {
    page = pagesCount;
  }

  let limitCount = parseInt(page * 8);
  let skipCount = page * 8 - 8;

  if (req.session.user) {
    let cartCount = await userHelpers.getCartCount(req.session.user._id);
    let products = await productHelpers.getAllProductsPageWise(
      skipCount,
      limitCount
    );
    res.render("user/shop", {
      pageUser: true,
      uname,
      products,
      cartCount,
      shop: true,
      page,
      pagesCount,
    });
  } else {
    productHelpers
      .getAllProductsPageWise(skipCount, limitCount)
      .then((products) => {
        res.render("user/shop", {
          pageUser: true,
          uname: false,
          products,
          shop: true,
          page,
          pagesCount,
        });
      });
  }
});

router.get("/contact", function (req, res, next) {
  if (req.session.user) {
    res.render("user/contact", { pageUser: true, uname });
  } else {
    res.render("user/contact", { pageUser: true, uname: false });
  }
});

router.get("/admin-login", function (req, res, next) {
  res.render("admin/admin-login");
});

router.get("/admin-index", function (req, res, next) {
  res.render("admin/admin-index", { pageAdmin: true, tabIndex: true });
});

router.post("/logIn", function (req, res, next) {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      if (response.block) {
        loginErr = true;
        loginBlock = true;
        req.session.loginErr =
          "You are blocked, Kindly request admin to unblock";
        res.redirect("/login");
      } else {
        req.session.loggedIn = true;
        req.session.user = response.user;
        uname = response.user.name;
        res.redirect("/dressMart-home");
      }
    } else {
      if (response.noUser) {
        loginErr = false;
        req.session.loginErr = "No Userfound, Kindly register to Login";
        res.redirect("/login");
      } else {
        loginErr = false;
        req.session.loginErr = "Invalid Login name or Password";
        res.redirect("/login");
      }
    }
  });
});

router.post("/register", (req, res) => {
  userHelpers.verifyUserRegistration(req.body).then((response) => {
    if (response.status) {
      // userHelpers.addUsers(req.body).then((response) => {
      //   res.redirect('/login');

      // })

      req.session.user = req.body;
      mob = req.body.contact;

      client.verify.v2
        .services(serviceId)
        .verifications.create({ to: `+91${mob}`, channel: "sms" })
        .then((verification) => {
          res.render("user/verifyMobileOTP", { pageUser: true, mob: mob });
        })
        .catch((err) => {
          res.redirect("/otp-login");
        });
    } else {
      if (response.findByEmail) {
        res.render("user/signup", { loginError: "Email is already found!" });
      }
      if (response.findMobile) {
        res.render("user/signup", {
          loginError: "Mobile No. is already found!",
        });
      }
    }
  });
});

router.post("/verify-Mobile", (req, res) => {
  if (req.session.user) {
    mobile = req.session.user.contact;

    otp = req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4;

    client.verify.v2
      .services(serviceId)
      .verificationChecks.create({ to: `+91${mobile}`, code: `${otp}` })
      .then((verification_check) => {
        if (verification_check.status) {
          req.session.user.status = true;

          userHelpers.addUsers(req.session.user).then((response) => {
            loginErr = true;
            res.render("user/user-login", {
              pageUser: true,
              loginErr: "Registration Success, Kindly Login",
            });
          });
        } else {
        }
      });
  } else {
    res.render("user/signup", {
      pageUser: true,
      loginErr: "Request Timed out!",
    });
  }
});

router.post("/admin-login", function (req, res, next) {
  userHelpers.doAdminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin;
      res.redirect("/admin-index");
    } else {
      req.session.loginErr = "Invalid Login name or Password";
      res.redirect("/admin-login");
    }
  });
});

router.get("/list-products/", async (req, res, next) => {
  let totalProductCount = await productHelpers.getTotalProductCount();
  let totalPages = Math.ceil(totalProductCount / 10);

  let page = parseInt(req.query.page);
  if (page < 1) {
    page = 1;
  }
  if (page > totalPages) {
    page = totalPages;
  }

  let limitCount = parseInt(page * 10);
  let skipCount = page * 10 - 10;
  let products = await productHelpers.getAllProductsPageWise(
    skipCount,
    limitCount
  );
  // productHelpers.getAllProducts().then((products) => {
  res.render("admin/list-products", {
    pageAdmin: true,
    products,
    tabProducts: true,
    totalPages,
    page,
    // });
  });
});

router.get("/users", function (req, res, next) {
  userHelpers.getAllUsers().then((users) => {
    res.render("admin/list-users", { pageAdmin: true, users, tabUsers: true });
  });
});
router.get("/admin-logout", function (req, res, next) {
  req.session.admin = false;
  res.redirect("/admin-login");
});

router.get("/add-Products",  (req, res, next) =>{
  userHelpers.getCategory().then((catCollect) => {
    res.render("admin/add-products", {
      pageAdmin: true,
      tabProductsAdd: true,
      tabProducts: true,
      catCollect,
    });
  });
});

router.post("/product-add", upload.array('Image',12), (req, res, next) =>{
  const body = Object.assign({},req.body)
  body.Price = parseInt(body.Price);
  body.Offer = parseInt(body.Offer);
  body.finalPrice = parseInt(body.finalPrice);
  body.quantity = parseInt(body.quantity);
  console.log(body);
  console.log(req.files);
  productHelpers.addProduct(body, req.files).then((response) => {
    //let image = req.files.Image;
    res.redirect("/list-products?page=1");
  });
});

router.get("/delete/", (req, res) => {
  let prodId = req.query.id;

  productHelpers.deleteProduct(prodId).then((response) => {
    res.redirect("/list-products?page=1");
  });
});

router.get("/edit/", async (req, res) => {
  let prodId = req.query.id;
  let product = await productHelpers.getProductDetails(prodId);
  res.render("admin/update-products", {
    pageAdmin: true,
    tabProducts: true,
    product,
    prodId,
  });
});

router.post("/product-update/:id",upload.array('Image',12), (req, res) => {
  let prodId = req.params.id;
  console.log("prod ID: ",prodId);
  const body=Object.assign({},req.body)
  productHelpers.updateProduct(prodId, body,req.files).then(() => {
    res.redirect("/list-products?page=1");
  });
});
router.get("/orders", async function (req, res, next) {
  // if(req.session.admin)
  // {
  let orderList = await productHelpers.getAllOrders();
  // let count=1;
  // req.session.admin.indexCount=count
  res.render("admin/orders", { pageAdmin: true, tabOrder: true, orderList });
  // }
  // else{
  //   res.redirect("/admin-login");
  // }
});

router.get("/category", function (req, res, next) {
  userHelpers.getCategory().then((catCollect) => {
    res.render("admin/category", {
      pageAdmin: true,
      tabCategory: true,
      catCollect,
      add: true,
    });
  });
});

router.get("/unblock", (req, res) => {
  let blkid = req.query.id;
  productHelpers.unBlockUser(blkid).then(() => {
    res.redirect("/users");
  });
});
router.get("/block", (req, res) => {
  let blkid = req.query.id;

  productHelpers.blockUser(blkid).then(() => {
    res.redirect("/users");
  });
});

router.get("/product-detail/", async (req, res, next) => {
  let prodId = req.query.id;
  let category = req.query.category;

  await productHelpers.ProductDetails(prodId).then((ProductInDet) => {
    productHelpers.categoryWiseProducts(category).then(async (products) => {
      if (req.session.user) {
        let cartCount = await userHelpers.getCartCount(req.session.user._id);
        res.render("user/product-details", {
          pageUser: true,
          ProductInDet,
          products,
          uname,
          cartCount,
        });
      } else {
        res.render("user/product-details", {
          pageUser: true,
          ProductInDet,
          products,
        });
      }
    });
  });
});

router.post("/category-add", (req, res, next) => {
  userHelpers.addCategory(req.body).then((response) => {
    res.redirect("/category");
  });
});

router.get("/delete-category/", (req, res) => {
  let catId = req.query.id;
  let name = req.query.name;

  userHelpers.deleteCategory(catId).then((response) => {
    productHelpers.deleteProductCategory(name).then((response) => {
      res.redirect("/category");
    });
  });
});
router.get("/edit-category/", async (req, res) => {
  let catId = req.query.id;
  let thisCat = await userHelpers.detailCategory(catId);
  userHelpers.getCategory().then((catCollect) => {
    res.render("admin/category", {
      pageAdmin: true,
      catId,
      thisCat,
      catCollect,
      tabCategory: true,
    });
  });
});

router.post("/category-update/:id", (req, res) => {
  let catId = req.params.id;
  userHelpers.updateCategory(catId, req.body).then(() => {
    res.redirect("/category");
  });
});

router.get("/add-to-cart/:id", async (req, res, next) => {
  if (req.session.user) {
    let prodId = req.params.id;
    let userId = req.session.user._id;
    let prodQuantity = await productHelpers.findProductQuantity(prodId);
    userHelpers.addToCart(prodId, userId, prodQuantity.quantity).then(() => {
      res.json({ status: true });
    });
  } else {
    res.json({ status: false });
  }
});

router.get("/cart", async (req, res, next) => {
  //res.setHeader('Cache-Control', 'no-store')

  if (req.session.user) {
    try {
      let cartCount = await userHelpers.getCartCount(req.session.user._id);

      if (cartCount > 0) {
        let products = await userHelpers.getCartProducts(req.session.user._id);

        let total, grandTotal;
        await userHelpers
          .getTotalAmount(req.session.user._id)
          .then((response) => {
            total = Math.ceil(response.total);
            grandTotal = Math.ceil(response.grandTotal);
          });
        let offerAmount = grandTotal - total;

        res.render("user/cart", {
          pageUser: true,
          uname,
          products,
          total,
          user: req.session.user._id,
          cartCount,
          grandTotal,
          offerAmount,
        });
      } else {
        res.render("user/cart", { pageUser: true, uname, cartCount });
      }
    } catch (error) {
      res.redirect("/login");
    }
  } else {
    res.redirect("/login");
  }
});

router.post("/change-product-quantity", async (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    if (response.maximumCount) {
      res.json(response);
    } else {
      let cartCount = await userHelpers.getCartCount(req.session.user._id);

      if (cartCount >= 1) {
        await userHelpers.getTotalAmount(req.body.user).then((response) => {
          response.total = Math.ceil(response.total);
          response.grandTotal = Math.ceil(response.grandTotal);
          response.update = true;
          res.json(response);
        });
      } else {
        response.removeProduct = true;
        res.json(response);
      }
    }
  });
});

router.get("/place-order", async (req, res, next) => {
  //res.setHeader('Cache-Control', 'no-store')
  if (req.session.user) {
    userHelpers.getUserDetails(req.session.user._id).then(async (response) => {
      req.session.user = response.user;
      if (req.session.user.cart) {
        let userAddress = await userHelpers.getUserAddress(
          req.session.user._id
        );

        let total = await userHelpers.getTotalAmount(req.session.user._id);
        res.render("user/place-order", {
          pageUser: true,
          uname,
          total,
          userAddress,
        });
      } else {
        res.redirect("/cart");
      }
    });
  } else {
    res.redirect("/login");
  }
});

router.get("/otp-login", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");

  res.render("user/otp-login", { pageUser: true });
});

router.post("/get-otp", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");

  let mobile = req.body.loginMobile;
  userHelpers.findUserMobile(mobile).then((response) => {
    if (response.status) {
      if (response.unBlkStatus) {
        req.session.mobile = mobile;
        client.verify.v2
          .services(serviceId)
          .verifications.create({ to: `+91${mobile}`, channel: "sms" })
          .then((verification) => {
            res.render("user/otp-enter", { pageUser: true, mob: mobile });
          })
          .catch((err) => {
            console.log(err);
            res.redirect("/otp-login");
          });
      } else {
        res.render("user/otp-login", {
          loginError: "User is Blocked. Please ask Admin to unblock",
        });
      }
    } else {
      res.render("user/otp-login", {
        loginError: "User not found. Please Register",
      });
    }
  });
});

router.post("/otp-submit", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  mobile = req.session.mobile;
  otp = req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4;

  if (mobile) {
    client.verify.v2
      .services(serviceId)
      .verificationChecks.create({ to: `+91${mobile}`, code: `${otp}` })
      .then((verification_check) => {
        if (verification_check.status) {
          userHelpers.getuserDetailByMbile(mobile).then((response) => {
            req.session.loggedIn = true;
            req.session.user = response.user;
            uname = response.user.name;
            res.redirect("/dressMart-home");
          });
        } else {
          res.redirect("/login");
        }
      })
      .catch((err) => {});
  } else {
    res.render("user/otp-login", {
      loginError: "Request Timed Out, Try again",
    });
  }
});

router.get("/account", (req, res, next) => {
  if (req.session.user) {
    userHelpers.getUserDetails(req.session.user._id).then((response) => {
      userDetails = [];
      userDetails = response.user;
      userHelpers.getUserOrders(req.session.user._id,0,1).then((orders) => {
        res.render("user/account", {
          pageUser: true,
          uname,
          userDetails,
          orders,
        });
      });
    });
  } else {
    res.redirect("/login");
  }
});

router.get("/logout-user", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  req.session.user = false;
  res.redirect("/");
});

router.post("/update-address", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  userHelpers.updateAddress(req.body).then((response) => {
    res.json(response);
  });
});

router.get("/product-category-view/", (req, res) => {
  let name = req.query.name;
  productHelpers.categoryWiseProducts(name).then((products) => {
    userHelpers.getCategory().then((catCollect) => {
      res.render("admin/category-wise-products", {
        pageAdmin: true,
        tabCategory: true,
        products,
        catCollect,
      });
    });
  });
});

router.post("/order-complete", async (req, res) => {
  //res.setHeader('Cache-Control', 'no-store')
  if (req.session.user) {
    let date_ob = new Date();
    let date =
      date_ob.getDate() +
      "-" +
      (date_ob.getMonth() + 1) +
      "-" +
      date_ob.getFullYear();
    let paymentMode = req.body.paymentMethod;
    let totalAmount = parseInt(req.body.totalCost);
    let addressDetails = {
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      pinCode: req.body.pinCode,
      contact: req.body.contact,
    };

    let cartOrderList = await userHelpers.getOrderedProducts(
      req.session.user._id
    );

    let orderId = new ObjectId();

    let order = {
      _id: orderId,
      userId: req.session.user._id,
      date: date,
      totalAmount: totalAmount,
      paymentMode: paymentMode,
      productDetails: cartOrderList,
      addressDetails: addressDetails,
    };

    if (paymentMode == "COD") {
      await productHelpers.addToOrders(order).then(async (response) => {
        if (response) {
          await userHelpers
            .removeFromCart(req.session.user._id)
            .then((response) => {
              if (response) {
                res.json({ status: true, cod: true });
              }
            });
        }
      });
    } else if (paymentMode == "RazorPay") {
      req.session.user.purchase = order;
      productHelpers.generateRazorpay(orderId, totalAmount).then((order) => {
        res.json({ order, status: true, razorpay: true });
      });
    } else if (paymentMode == "PayPal") {
      //   const create_payment_json = {
      //     "intent": "sale",
      //     "payer": {
      //         "payment_method": "paypal"
      //     },
      //     "redirect_urls": {
      //         "return_url": "http://localhost:4000/order-success",
      //         "cancel_url": "http://localhost:4000/cart"
      //     },
      //     "transactions": [{
      //         "item_list": {
      //             "items": [{
      //                 "name": "Red Sox Hat",
      //                 "sku": "001",
      //                 "price": "25.00",
      //                 "currency": "USD",
      //                 "quantity": 1
      //             }]
      //         },
      //         "amount": {
      //             "currency": "USD",
      //             "total": "25.00"
      //         },
      //         "description": "Hat for the best team ever"
      //     }]
      // };
      // let link;
      // paypal.payment.create(create_payment_json, function (error, payment) {
      //   if (error) {
      //       res.json({status:false})
      //   } else {
      //       for(let i = 0;i < payment.links.length;i++){
      //         if(payment.links[i].rel === 'approval_url'){
      //         link=payment.links[i].href
      //         res.json({status:true,paypal:true,link:link})
      //         }
      //       }
      //   }
      // });
    } else {
      res.json({ status: false });
    }
  } else {
    res.json({ status: false });
  }
});

router.post("/verify-payment", (req, res) => {
  let orderArray = req.session.user.purchase;
  userId = req.session.user._id;

  productHelpers.verifyPayment(req.body).then(async (response) => {
    if (response.status) {
      await productHelpers.addToOrders(orderArray).then(async (response) => {
        await userHelpers
          .removeFromCart(req.session.user._id)
          .then((response) => {
            if (response) {
              res.json({ status: true });
            }
          });
      });
    } else {
      res.json({ status: false });
    }
  });
});
router.get("/order-success", (req, res) => {
  userHelpers.getUserDetails(req.session.user._id).then((response) => {
    req.session.user = response.user;
    res.render("user/order-success");
  });
});

router.get("/banner-management", (req, res) => {
  productHelpers.getBanners().then((banner) => {
    res.render("admin/banner-management", {
      pageAdmin: true,
      tabBanner: true,
      banner,
    });
  });
});

router.post("/add-banner", (req, res) => {
  productHelpers.addBanner(req.body.Name).then((response) => {
    id = response.id;

    let image = req.files.Image; 

    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.redirect("/banner-management");
      }
    });
  });
});

router.get("/delete-banner/", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  bannerId = req.query.id;
  productHelpers.deleteBanner(bannerId).then((response) => {
    res.redirect("/banner-management");
  });
});

router.get("/multi-image", (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  productHelpers.getmult().then((multImages) => {
    console.log(multImages);
    res.render("admin/multiple-image", { multImages });
  });
});

router.post("/multi-image-upload", upload.array('image',12), (req, res) => {
  // res.setHeader('Cache-Control', 'no-store')

  // const obj = JSON.parse(JSON.stringify(req.body));
  const obj = Object.assign({},req.body)

  productHelpers.multiImage(obj.Name,req.files).then((response) => {

        res.redirect("/multi-image");

  });
});

router.get("/order-update/", async (req, res) => {
  //res.setHeader('Cache-Control', 'no-store')

  let orderId = req.query.orderId;
  let productId = req.query.productId;
  let userId = req.query.userId;
  let orderStatus = req.query.status;

  if (orderStatus == "Cancel") {
    orderStatus = Boolean(false);
  }
  await productHelpers
    .changeOrderStatus(userId, orderId, productId, orderStatus)
    .then((response) => {
      if (response.status) {
        res.json({ status: true });
      } else {
        res.json({ status: false });
      }
    })
    .catch((error) => {
      res.json(error);
    });
});

// // use the orders api to create an order
// async function createOrder() {
//   const accessToken = await generateAccessToken();
//   const url = `${base}/v2/checkout/orders`;
//   const response = await fetch(url, {
//     method: "post",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${accessToken}`,
//     },
//     body: JSON.stringify({
//       intent: "CAPTURE",
//       purchase_units: [
//         {
//           amount: {
//             currency_code: "USD",
//             value: "100.00",
//           },
//         },
//       ],
//     }),
//   });
//   const data = await response.json();
//   return data;
// }

// // generate an access token using client id and app secret
// async function generateAccessToken() {

//   const auth = Buffer.from("AWNcracQtclmKNKDjTJmizg2RBgA0ofqGlq9kLRGh9ewgPPE5n-E-ZDN8WotcSminDkg3uaibMzBS7G-" + ":" + "EDRQZzNn2gCH8fsohfYMxd3cP9NCUE-tV8hipENnGRs8my2kprXnrVy9y4xPxrJDLsCfP1HiCW2YWun7").toString("base64")

//   const response = await fetch(`${base}/v1/oauth2/token`, {
//     method: "post",
//     body: "grant_type=client_credentials",
//     headers: {
//       Authorization: `Basic ${auth}`,
//     },
//   });
//   const data = await response.json();
//   return data.access_token;
// }

router.post("/update-password", async (req, res) => {
  const bcrypt = require("bcrypt");
  let password = req.body.password;

  password = await bcrypt.hash(password, 10);

  userHelpers
    .updatePassword(req.session.user._id, password)
    .then((response) => {
      res.json({ status: true });
    });
});

router.get("/coupon-management", async (req, res) => {
  if (req.session.admin) {
    await productHelpers.getAllCoupons().then((couponCollect) => {
      res.render("admin/coupon-management", {
        pageAdmin: true,
        tabCoupon: true,
        couponCollect,
        err: req.session.admin.err,
      });
    });
  } else {
    res.redirect("/admin-login");
  }
});
router.post("/coupon-add", (req, res) => {
  productHelpers.addCoupon(req.body).then((response) => {
    if (response.status) {
      req.session.admin.err = false;
      res.redirect("/coupon-management");
    } else {
      req.session.admin.err = "Coupon Already Exsist";
      res.redirect("/coupon-management");
    }
  });
});
router.get("/delete-couon/", (req, res) => {
  let id = req.query.id;
  productHelpers.deleteCoupon(id).then((response) => {
    res.redirect("/coupon-management");
  });
});

router.post("/verify-coupon", (req, res) => {
  let couponCode = req.body.couponCode;
  let totalAmount = req.body.totalAmount;
  productHelpers.verifyCoupon(couponCode).then((response) => {
    if (response.couponDetails) {
      totalAmount =
        parseFloat(totalAmount) - parseFloat(response.couponDetails.price);
      res.json({
        status: true,
        totalAmount: totalAmount,
        price: response.couponDetails.price,
      });
    } else {
      res.json({ status: false });
    }
  });
});

router.get("/get-offer-price/", async (req, res) => {
  await productHelpers.getCategory(req.query.name).then((response) => {
    res.json({ status: true, offer: response.offer });
  });
});
router.post("/removeSingleartProduct/", async (req, res) => {
  await productHelpers
    .removeSingleartProductFromCart(req.query.cartId, req.query.prodId)
    .then((response) => {
      res.json({ status: true });
    });
});
router.get('/view-more-orders/',async(req,res)=>{
  let page=parseInt(req.query.page)
  if(req.session.user){
    console.log(req.session.user._id);
    let totalOrdersCount=await userHelpers.getTotalOrderCount(req.session.user._id)
    console.log(page,"-------",totalOrdersCount);
    let skip=(page*1)-1
    if(page<totalOrdersCount){
      let order=await userHelpers.getUserOrders(req.session.user._id,skip,1)
      res.json({order,status:true})
    }
    else{
      res.json({status:false})
    }
  }else
  {
    res.redirect('/login')
  }
})
router.get('/addtoWishList/',async(req,res)=>{
  if(req.session.user){
  console.log("addtoWishList")
  let prodId=req.query.prodId
  let userId=req.session.user._id
  await userHelpers.addtoWishList(userId,prodId).then((response)=>{
    res.json({status:true})
  })
  }
  else{
    console.log("logot");
    res.json({loginError:true})
  }
})
router.get('/removeFromWishList/',async(req,res)=>{
  if(req.session.user){
    console.log("RemtoWishList")
    let prodId=req.query.prodId
    let userId=req.session.user._id
    await userHelpers.removeFromWishList(userId,prodId).then((response)=>{
      res.json({status:true})
    })
    }
    else{
      console.log("logot");
      res.json({loginError:true})
    }

})
module.exports = router;
