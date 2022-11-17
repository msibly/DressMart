var db = require("../config/connection");
var collection = require("../config/collections");
//const { response } = require("../app");
var ObjectId = require("mongodb").ObjectId;
var Razorpay = require("razorpay");
const { resolve } = require("path");
var paypal = require("paypal-rest-sdk");
require('dotenv').config;
const { OrderedBulkOperation } = require("mongodb");
const { response } = require("express");
const RazorpayKeyId = process.env.razorPay_KeyId;
const RazorpaySecretKey = process.env.razorPay_SecretKey;

var instance = new Razorpay({
  key_id: RazorpayKeyId,
  key_secret: RazorpaySecretKey,
});

paypal.configure({
  mode: "sandbox", //sandbox   or live
  client_id: process.env.paypal_Id,
  client_secret: process.env.paypal_Secret,
});

module.exports = {
  addProduct: (product,image) => {
    return new Promise(async (resolve, reject) => {     
      product.image=image[0].filename
      product.images=[]
      image.forEach(element => {
        console.log(element.filename);
        (product.images).push(element.filename)
      });
      console.log(product);
      await db.get()
        .collection("product")
        .insertOne(product)
        .then((response) => {
          resolve((response))
        });
    })
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      products = products.reverse();
      console.log(products);
      resolve(products);
    });
  },

  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: ObjectId(prodId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getProductDetails: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(prodId) })
        .then((product) => {
          resolve(product);
        });
    });
  },
  updateProduct: (prodId, proDetails,imageArray) => {
    return new Promise((resolve, reject) => {
      if(((imageArray).length)>0){
        proDetails.image=imageArray[0].filename
        proDetails.images=[]
        proDetails.image=imageArray[0].filename
          imageArray.forEach(element => {
            (proDetails.images).push(element.filename)
          });
          console.log(proDetails);
          db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              { _id: ObjectId(prodId) },
              {
                $set: {
                  Name: proDetails.Name,
                  Category: proDetails.Category,
                  Price: parseInt(proDetails.Price),
                  Offer: parseInt(proDetails.Offer),
                  finalPrice: parseInt(proDetails.finalPrice),
                  Description: proDetails.Description,
                  quantity: parseInt(proDetails.quantity),
                  image:proDetails.image,
                  images:proDetails.images
                },
              }
            )
            .then((response) => {
              resolve();
            });
      }
      else{
        db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              { _id: ObjectId(prodId) },
              {
                $set: {
                  Name: proDetails.Name,
                  Category: proDetails.Category,
                  Price: parseInt(proDetails.Price),
                  Offer: parseInt(proDetails.Offer),
                  finalPrice: parseInt(proDetails.finalPrice),
                  Description: proDetails.Description,
                  quantity: parseInt(proDetails.quantity),
                },
              }
            )
            .then((response) => {
              resolve();
            });
      }
    });
  },

  blockUser: (blkid) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(blkid) },
          {
            $set: {
              status: false,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  unBlockUser: (blkid) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(blkid) },
          {
            $set: {
              status: true,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  categoryWiseProducts: (category) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ Category: category })
        .toArray();

      resolve(products);
    });
  },

  ProductDetails: (productId) => {
    return new Promise(async (resolve, reject) => {
      let ProductInDet = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(productId) });

      resolve(ProductInDet);
    });
  },

  addToOrders: (order) => {
    let userId = order.userId;
    return new Promise(async (resolve, reject) => {
      await db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne({
          _id: ObjectId(order._id),
          userId: ObjectId(userId),
          date: order.date,
          totalAmount: order.totalAmount,
          paymentMode: order.paymentMode,
          productDetails: order.productDetails,
          addressDetails: order.addressDetails,
        })
      .then((response) => {
      });
      order.productDetails.forEach(async element => {
        console.log('\nProduct Id : ',element._id)
        let cartQuantity=(element.quantity)*-1
        let id=element._id
        console.log("-----------------",cartQuantity,"--------",id);  
        await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(id)},
        {
          $inc:{quantity:cartQuantity}
        } 
        )
        .then((response)=>{

        })
        //console.log(arra); 
      });
      await db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $unset: { cart: 1 },
          })
        .then((response)=>{
        })  
          // .then((response) => {
            resolve(response);
          // });
    });
  },

  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orderList = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .toArray();
      orderList=orderList.reverse()
      resolve(orderList);
    });
  },

  addBanner: (name) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.BANNER_COLLECTION)
        .insertOne({ name: name })
        .then((data) => {
          resolve({ id: data.insertedId });
        });
    });
  },
  getBanners: () => {
    return new Promise(async (resolve, reject) => {
      let banner = await db
        .get()
        .collection(collection.BANNER_COLLECTION)
        .find()
        .toArray();
      resolve(banner);
    });
  },
  deleteBanner: (bannerId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.BANNER_COLLECTION)
        .deleteOne({ _id: ObjectId(bannerId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  multiImage: (name,img) => {
    return new Promise(async (resolve, reject) => {
      let images=[]
      await img.forEach(element => {
        images.push(element.filename)
      });
      console.log(images);
      await db
        .get()
        .collection(collection.MULTI_IMAGE)
        .insertOne({ name: name,images:images })
        .then((data) => {
          // resolve({ id: data.insertedId });
          resolve({response:true})
        });
    });
  },
  getmult: () => {
    return new Promise(async (resolve, reject) => {
      let multImages = await db
        .get()
        .collection(collection.MULTI_IMAGE)
        .find()
        .toArray();
      resolve(multImages);
    });
  },
  deleteProductCategory: (name) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteMany({ Category: name })
        .then((response) => {
          resolve(response);
        });
    });
  },

  changeOrderStatus: (userId, orderId, productId, status) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderId), "productDetails._id": ObjectId(productId) },
          {
            $set: {
              [`productDetails.$[element].status`]: status,
            },
          },
          {
            arrayFilters: [{ "element._id": { $eq: ObjectId(productId) } }],
          }
        )
        .then((response) => {
          if (status != false) {
            status = true;
          }

          resolve({ status });
        });
      if (status != false) {
        status = true;
      }

      resolve({ status });
    });
  },
  generateRazorpay: (orderId, totalAmount) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalAmount * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        resolve(order);
      });
    });
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      var generated_signature = details["payment[razorpay_signature]"];

      let body =
        details["payment[razorpay_order_id]"] +
        "|" +
        details["payment[razorpay_payment_id]"];

      var crypto = require("crypto");
      var expectedSignature = crypto
        .createHmac("sha256", "HEMzIgJgGCnoU43EBo8cTGsd")
        .update(body.toString())
        .digest("hex");

      if (generated_signature == expectedSignature) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  onlinePaymentPlaced: (orderArray, userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $push: { orders: orderArray },
          }
        )
        .then(async (response) => {
          await db
            .get()
            .collection(collection.USER_COLLECTION)
            .updateOne(
              { _id: ObjectId(userId) },
              {
                $push: { orders: orderArray },
              }
            );
        })
        .then((response) => {
          resolve(response);
        });
    });
  },
  addCoupon: (data) => {
    return new Promise(async (resolve, reject) => {
      let coupon = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ name: data.name });
      if (coupon) {
        resolve({ status: false });
      } else {
        await db
          .get()
          .collection(collection.COUPON_COLLECTION)
          .insertOne(data)
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  getAllCoupons: () => {
    return new Promise(async (resolve, reject) => {
      let couponCollect = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray()
        .then((couponCollect) => {
          resolve(couponCollect);
        });
    });
  },
  deleteCoupon: (id) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .deleteOne({ _id: ObjectId(id) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  verifyCoupon: (couponCode) => {
    return new Promise(async (resolve, reject) => {
      let couponDetails = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ name: couponCode });
      resolve({ couponDetails });
    });
  },
  consumeCoupon: (couponCode) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .updateOne({ name: couponCode }, { $set: { status: "used" } })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getCategory: (categoryname) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ Name: categoryname })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getTotalProductCount: () => {
    return new Promise(async (resolve, reject) => {
      let totalProductCount = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .count({quantity:{$gt:0}});
      resolve(totalProductCount);
    });
  },
  getAllProductsPageWise: (skipCount, limitCount) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .find(
        {
          quantity:{$gt:0}
        }  
      ).skip(skipCount).limit(limitCount).toArray()
      resolve(products);
    });
  },
  getHomeProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({quantity:{$gt:0}})
        .limit(4)
        .toArray();

      resolve(products);
    });
  },
  removeSingleartProductFromCart:(cartId,prodId)=>{
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.CART_COLLECTION).updateOne({
        _id: ObjectId(cartId)
      },
      {
        $pull: {
          products: {
            item: ObjectId(prodId)
          }
        }
      }).then((response)=>{
        console.log(response);
        resolve(response)
      })
    })
  },
  findProductQuantity:(prodId)=>{
    return new Promise(async(resolve, reject) => {
      let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(prodId)})
      resolve(product)
    })
  }
};
