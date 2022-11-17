var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
//const { response } = require("../app");
const { ObjectId } = require("mongodb");
const { response } = require("express");
// const {
//   PRODUCT_COLLECTION,
//   ORDER_COLLECTION,
// } = require("../config/collections");
//const { response } = require("../app");
module.exports = {
  addUsers: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.Password = await bcrypt.hash(userData.Password, 10);
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(data);
        });
    });
  },
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      //let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.uname });

      if (user) {
        if (user.status) {
          bcrypt.compare(userData.pass, user.Password).then((status) => {
            if (status) {
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              resolve({ status: false });
            }
          });
        } else {
          resolve({ status: true, block: true });
        }
      } else {
        resolve({ status: false, noUser: true });
      }
    });
  },
  doAdminLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      //let loginStatus = false;
      let response = {};
      let admin = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ name: adminData.uname });
      if (admin) {
        bcrypt.compare(adminData.password, admin.password).then((status) => {
          if (status) {
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false });
          }
        });
      } else {
        resolve({ status: false });
      }
    });
  },

  deleteUser: (dataId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .remove({ _id: ObjectId(dataId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getUserDetails: (dataId) => {
    //let response = {};
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(dataId) });

      resolve({ user });
    });
  },
  updateUser: (userId, userDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $set: {
              name: userDetails.name,
              UserName: userDetails.UserName,
              email: userDetails.email,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  addCategory: (catDetail) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .insertOne(catDetail)
        .then((data) => {
          resolve(data);
        });
    });
  },
  getCategory: () => {
    return new Promise(async (resolve, reject) => {
      let catCollect = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .toArray();
      catCollect = catCollect.reverse();
      resolve(catCollect);
    });
  },
  deleteCategory: (catId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .deleteOne({ _id: ObjectId(catId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  detailCategory: (catId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ _id: ObjectId(catId) })
        .then((catCollect) => {
          resolve(catCollect);
        });
    });
  },
  updateCategory: (catId, catCollect) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { _id: ObjectId(catId) },
          {
            $set: {
              Name: catCollect.Name,
              Description: catCollect.Description,
              offer: catCollect.offer,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  addToCart: (prodId, userId, productQuantity) => {
    let proObj = {
      item: ObjectId(prodId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });

      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == prodId
        );

        if (proExist != -1) {
          let cartProductQuantity = await db
            .get()
            .collection(collection.CART_COLLECTION)
            .aggregate([
              {
                $match: {
                  user: new ObjectId(userId),
                },
              },
              {
                $project: {
                  _id: 0,
                  products: "$products",
                },
              },
              {
                $unwind: {
                  path: "$products",
                },
              },
              {
                $match: {
                  "products.item": new ObjectId(prodId),
                },
              },
              {
                $project: {
                  count: "$products.quantity",
                },
              },
            ])
            .toArray();
          console.log(
            "------------cartProductQuantity------",
            cartProductQuantity[0].count,
            "--qty--",
            productQuantity
          );
          if (cartProductQuantity[0].count < productQuantity) {
            await db
              .get()
              .collection(collection.CART_COLLECTION)
              .updateOne(
                { user: ObjectId(userId), "products.item": ObjectId(prodId) },
                {
                  $inc: { "products.$.quantity": 1 },
                }
              )
              .then(async (response) => {
                await db
                  .get()
                  .collection(collection.USER_COLLECTION)
                  .updateOne(
                    { _id: ObjectId(userId), "cart.item": ObjectId(prodId) },
                    {
                      $inc: { "cart.$.quantity": 1 },
                    }
                  )
                  .then((response) => {
                    resolve();
                  });
              });
          } else {
            resolve({ extremeReach: true });
          }
        } else {
          await db
            .get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then(async (response) => {
              await db
                .get()
                .collection(collection.USER_COLLECTION)
                .updateOne(
                  { _id: ObjectId(userId) },
                  {
                    $push: { cart: proObj },
                  }
                )
                .then((response) => {
                  resolve();
                });
            });
        }
      } else {
        let cartObj = {
          user: ObjectId(userId),
          products: [proObj],
        };

        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            db.get()
              .collection(collection.USER_COLLECTION)
              .update(
                { _id: ObjectId(userId) },
                {
                  $push: {
                    cart: proObj,
                  },
                }
              )
              .then((response) => {
                resolve();
              });
          });
      }
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              products: { $arrayElemAt: ["$products", 0] },
            },
          },
        ])
        .toArray();

      resolve(cartItems);
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      if (cart) {
        count = cart.products.length;
        resolve(count);
      } else {
        count = 0;

        resolve(cart);
      }
    });
  },

  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    return new Promise(async (resolve, reject) => {
      let ProductItem = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(details.product) });
      console.log(details.quantity, ProductItem.quantity);
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: ObjectId(details.cart) },
            {
              $pull: {
                products: { item: ObjectId(details.product) },
              },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else if (
        details.count == 1 &&
        parseInt(details.quantity) == ProductItem.quantity
      ) {
        console.log("This---------------else if---");
        let response = {};
        response.maximumCount = true;
        response.update = false;
        console.log(response);
        resolve(response);
      } else {
        console.log("This------------------");
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: ObjectId(details.cart),
              "products.item": ObjectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ update: true });
          });
      }
      console.log(response);
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $lookup: {
              from: collection.CATEGORY_COLLECTION,
              localField: "products.Category",
              foreignField: "Name",
              as: "category",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              products: { $arrayElemAt: ["$products", 0] },
              category: { $arrayElemAt: ["$category", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $subtract: [
                    {
                      $multiply: [
                        "$quantity",
                        { $toInt: "$products.finalPrice" },
                      ],
                    },
                    {
                      $multiply: [
                        "$quantity",
                        { $toInt: "$products.finalPrice" },
                        { $toInt: "$category.offer" },
                        0.01,
                      ],
                    },
                  ],
                },
              },
              grandTotal: {
                $sum: {
                  $multiply: ["$quantity", { $toInt: "$products.finalPrice" }],
                },
              },
            },
          },
        ])
        .toArray();

      resolve({ total: total[0].total, grandTotal: total[0].grandTotal });
    });
  },

  findUserMobile: (mob) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ contact: mob });

      if (user) {
        if (user.status) {
          resolve({ status: true, unBlkStatus: true });
        } else {
          resolve({ status: true, unBlkStatus: false });
        }
      } else {
        resolve({ status: false });
      }
    });
  },

  getuserDetailByMbile: (mobile) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ contact: mobile });

      response.user = user;

      resolve(response);
    });
  },
  verifyUserRegistration: (regDeatils) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let findByContact = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ contact: regDeatils.contact });
      let findByEmail = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: regDeatils.email });
      if (findByContact) {
        resolve({ status: false, findMobile: true });
      } else if (findByEmail) {
        resolve({ status: false, findByEmail: true });
      } else {
        resolve({ status: true });
      }
    });
  },
  updateAddress: (userDetails) => {
    return new Promise(async (resolve, reject) => {
      let user = db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userDetails.userId) });

      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userDetails.userId) },
          {
            $push: {
              address: {
                address: userDetails.address,
                city: userDetails.city,
                state: userDetails.state,
                country: userDetails.country,
                pincode: userDetails.pincode,
              },
            },
          }
        )
        .then((response) => {
          resolve({ updateAddress: true });
        });
    });
  },
  getUserAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      let UserAddress = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .aggregate([
          {
            $match: { _id: ObjectId(userId) },
          },
          {
            $project: { _id: 0, address: 1 },
          },
          {
            $unwind: "$address",
          },
        ])
        .toArray();
      resolve(UserAddress);
    });
  },

  getOrderedProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartOrdered = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              _id: "$product._id",
              name: "$product.Name",
              price: "$product.finalPrice",
              quantity: "$quantity",
              status: "placed",
            },
          },
          {
            $unwind: "$name",
          },
          {
            $unwind: "$price",
          },
          {
            $unwind: "$_id",
          },
          {
            $project: {
              _id: 1,
              quantity: 1,
              name: 1,
              price: 1,
              status: 1,
            },
          },
        ])
        .toArray();

      resolve(cartOrdered);
    });
  },

  removeFromCart: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { user: ObjectId(userId) },
          {
            $set: { products: [] },
          }
        )
        .then((response) => {
          db.get()
            .collection(collection.USER_COLLECTION)
            .updateOne(
              { _id: ObjectId(userId) },
              {
                $unset: { cart: "" },
              }
            )
            .then((response) => {
              resolve(response);
            });
        });
    });
  },
  updatePassword: (userId, pass) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne({ _id: ObjectId(userId) }, { $set: { Password: pass } })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getUserOrders: (userId, skip, limit) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: ObjectId(userId) })
        .skip(skip)
        .limit(limit)
        .sort({ $natural: -1 })
        .toArray();
      //orders=orders.reverse()
      resolve(orders);
    });
  },
  getTotalOrderCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orderCount = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .estimatedDocumentCount({ userId: ObjectId(userId) });

      console.log(orderCount);
      resolve(orderCount);
    });
  },
  addtoWishList:(userId,prodId)=>{
    return new Promise(async (resolve, reject) => {
      let userWishList = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: ObjectId(userId) });

        if(userWishList){
          db.get().collection(collection.WISHLIST_COLLECTION).updateOne({user:ObjectId(userId)},
          {
            $push:{list:ObjectId(prodId)}
          }
          ).then((response)=>{
            resolve(response)
          })
        }
        else{
          db.get().collection(collection.WISHLIST_COLLECTION).insertOne({user:ObjectId(userId),list:[ObjectId(prodId)]}).then((response)=>{
            resolve(response)
          })
        }
    })
  },
  getWishList:(userId)=>{
    return new Promise(async(resolve, reject) => {
      let wishList=await db.get().collection(collection.WISHLIST_COLLECTION).find({user:ObjectId(userId)}).toArray()
      if(wishList){
        console.log("WishList");
        if(wishList[0].list){
          console.log(wishList[0].list);
          // console.log("WishList.list");
          {
            if(((wishList[0].list).length)<1){
              wishList=false
              resolve(wishList)
            }
            else{
              resolve(wishList)
            }
          }
        }
        else{
          wishList=false
          resolve(wishList)
        }
      }
      else{
        wishList=false
        resolve(wishList)
      }
    })
  },
  removeFromWishList:(userId,prodId)=>{
    return new Promise((resolve, reject) => {
      db.get().collection(collection.WISHLIST_COLLECTION).updateOne({user:ObjectId(userId)},
      {
        $pull:{
          list:{
            $in:[ObjectId(prodId)]
          }
        }
      }
      ).then((response)=>{
        resolve(response)
      })
    })
  }
};
