var db = require('../config/connection')
var collection = require('../config/collections');
const { response } = require('../app');
var ObjectId = require('mongodb').ObjectId
var Razorpay = require('razorpay');
const { resolve } = require('path');
var paypal = require('paypal-rest-sdk');
const { OrderedBulkOperation } = require('mongodb');
const RazorpayKeyId=process.env.razorPay_KeyId
const RazorpaySecretKey=process.env.razorPay_SecretKey

  
   
var instance = new Razorpay({
    key_id: RazorpayKeyId,
    key_secret: RazorpaySecretKey, 
}); 
   
paypal.configure({ 
    'mode': 'sandbox', //sandbox   or live
    'client_id': process.env.paypal_Id,
    'client_secret': process.env.paypal_Secret
  });


module.exports = {

    addProduct: (product, callback) => {
        db.get().collection('product').insertOne(product).then((data) => {
            console.log(data)
            callback(data.insertedId)
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            products=products.reverse() 
            resolve(products)
        })
    },

    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            console.log(prodId);
            console.log(ObjectId(prodId));
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: ObjectId(prodId) }).then((response) => {
                //console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(prodId) }).then((product) => {
                resolve(product)
            })
        })
    },
    updateProduct: (prodId, proDetails) => {
        return new Promise((resolve, reject) => {
            //console.log("-------------++++++++--------" + prodId);
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(prodId) }, {
                $set: {
                    Name: proDetails.Name,
                    Category: proDetails.Category,
                    Price: proDetails.Price,
                    Offer:proDetails.Offer,
                    finalPrice:proDetails.finalPrice,
                    Description: proDetails.Description,
                    quantity: proDetails.quantity
                }
            }).then((response) => {
                resolve()
            })
        })
    },

    blockUser: (blkid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(blkid) }, {
                $set: {
                    status: false
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    unBlockUser: (blkid) => {
        console.log("-------------++++/////++++--------" + blkid);
        return new Promise((resolve, reject) => {

            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(blkid) }, {
                $set: {
                    status: true
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },


    categoryWiseProducts: (category) => {
        return new Promise(async (resolve, reject) => {
            console.log(category);
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: category }).toArray()
            console.log(products);
            resolve(products)
        })
    },

    ProductDetails: (productId) => {
        return new Promise(async (resolve, reject) => {
            let ProductInDet = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(productId) })
            console.log(ProductInDet);
            resolve(ProductInDet)
        })
    },


    addToOrders: (order) => {

        let userId=order.userId
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).insertOne({
                _id:ObjectId(order._id),
                userId:ObjectId(userId),
                date:order.date,
                totalAmount:order.totalAmount,
                paymentMode:order.paymentMode,
                productDetails:order.productDetails,
                addressDetails:order.addressDetails
            })
            .then((response)=>{
                //console.log(response);
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},
                {
                    $unset:{cart:1}
                })
                .then((response)=>{
                    //console.log(response);
                    resolve(response)
                })
            })
        })
    },

    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orderList = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            //orderList=orderList.reverse();
            console.log(orderList);
            resolve(orderList)
        })

    },

    addBanner: (name) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.BANNER_COLLECTION).insertOne({ name: name }).then((data) => {
                resolve({ id: data.insertedId })
            })
        })
    },
    getBanners: () => {
        return new Promise(async (resolve, reject) => {
            let banner = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(banner)
        })
    },
    deleteBanner: (bannerId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.BANNER_COLLECTION).deleteOne({ _id: ObjectId(bannerId) }).then((response) => {
                resolve(response)
            })
        })
    },
    multiImage: (name) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.MULTI_IMAGE).insertOne({ name: name }).then((data) => {
                resolve({ id: data.insertedId })
            })
        })
    },
    getmult: () => {
        return new Promise(async (resolve, reject) => {
            let multImages = await db.get().collection(collection.MULTI_IMAGE).find().toArray()
            resolve(multImages)
        })
    },
    deleteProductCategory: (name) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).deleteMany({ Category: name }).then((response) => {
                //console.log(response);
                resolve(response)
            })
        })
    },
 
    changeOrderStatus: (userId,orderId,productId,status) => {
        return new Promise(async (resolve, reject) => {
            
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId),'productDetails._id':ObjectId(productId)},
                {
                    $set: {
                        [`productDetails.$[element].status`]: status
                    },
                },
                {
                    arrayFilters:[{'element._id':{$eq:ObjectId(productId)}}]
                }
                ).then((response) => {
                    if (status != false) {
                        status = true
                    }
                    console.log(status);
                    resolve({ status })
                })
            if (status != false) {
                status = true
            }
            console.log(status);
            resolve({ status })

        })

    },
    generateRazorpay: (orderId, totalAmount) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: totalAmount * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                //console.log("New order", order);
                resolve(order)
            });
        })
    },
    verifyPayment: (details) => {

        return new Promise((resolve,reject)=>{
            var generated_signature = details['payment[razorpay_signature]']

            let body = details['payment[razorpay_order_id]'] + "|" + details['payment[razorpay_payment_id]'];
            console.log(body);
            var crypto = require("crypto");
            var expectedSignature = crypto.createHmac('sha256', 'HEMzIgJgGCnoU43EBo8cTGsd').update(body.toString()).digest('hex');
            console.log("sig received  ", generated_signature);
            console.log("sig generated ", expectedSignature);
    
    
            if (generated_signature == expectedSignature) {
                resolve({status:true})
            }
            else{
                resolve({status:false})
            }
        })
   

    },
    onlinePaymentPlaced:(orderArray,userId)=>{
        return new Promise(async (resolve,reject)=>{

            await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(userId)},
            {
                $push:{orders:orderArray}
            }).then(async (response)=>{
                await db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},
                {
                    $push:{orders:orderArray}
                })            
            }).then((response)=>{
                console.log("Success");
                resolve(response)
            })
         
        })
    },
    addCoupon:(data)=>{
        return new Promise(async (resolve, reject) => {
            let coupon=await db.get().collection(collection.COUPON_COLLECTION).findOne({name:data.name})
            if(coupon){
               resolve({status:false})
            }
            else{
                await db.get().collection(collection.COUPON_COLLECTION).insertOne(data).then((response)=>{
                    resolve({status:true})
                })
            }
        })
    },
    getAllCoupons:()=>{
        return new Promise(async (resolve, reject) => {
            let couponCollect=await db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((couponCollect)=>{
                //console.log(couponCollect);
                resolve(couponCollect)
            })
        })
    },
    deleteCoupon:(id)=>{
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:ObjectId(id)}).then((response)=>{
                resolve(response)
            })
        })
    },
    verifyCoupon:(couponCode)=>{
        return new Promise(async (resolve, reject) => {
            let couponDetails=await db.get().collection(collection.COUPON_COLLECTION).findOne({name:couponCode})
                resolve({couponDetails})
        })
    },
    consumeCoupon:(couponCode)=>{
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.COUPON_COLLECTION).updateOne({name:couponCode},{$set:{status:'used'}})
            console.log(response);
            resolve(response)
        })
    },
    getCategory:(categoryname)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({Name:categoryname}).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },
    getTotalProductCount:()=>{
        return new Promise(async (resolve, reject) => {
            let totalProductCount=await db.get().collection(collection.PRODUCT_COLLECTION).count()
            resolve(totalProductCount)
        })
    },
    getAllProductsPageWise:(skipCount,limitCount)=>{
        console.log(skipCount,limitCount);
        return new Promise(async (resolve, reject) => {
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([{$skip:skipCount}]).limit(limitCount).toArray()
//            console.log(products);
            resolve(products)
        })
    },
    getHomeProducts:()=>{
        return new Promise(async (resolve, reject) => {
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().limit(4).toArray()
            console.log(products);
            resolve(products)
        })
    }
}

