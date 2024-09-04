const Razorpay = require('razorpay');
const Crypto = require('crypto');
const Orders=require("../model/ordermodel")
require('dotenv').config()


var instance = new Razorpay({
   key_id: process.env.razor_key_id,
   key_secret:  process.env.razor_key_secret,
 });
const generateRazorPay = async(orderId,total)=>{
   return new Promise((resolve,reject)=>{
      var options = {
         amount: total *100,
         currency:"INR",
         receipt:orderId,
      };
      instance.orders.create(options,function(err,order){
         console.log("New order from razorpay :",order);
         resolve(order)
      }); 
   })
}


const verifyOnlinePayment = async(details)=>{
   console.log('VerifyOnlinPayment: ',details);
   return new Promise((resolve,reject)=>{
      let hmac = Crypto.createHmac('sha256',process.env.razor_key_secret);
      // Merging the two id's that come from the client side
      // console.log('Razorpay order Id : ',details.payment.razorpay_order_id);
      // console.log('Razorpay Payment Id : ',details.payment.razorpay_payment_id);
      hmac.update(details.payment.razorpay_order_id+'|'+details.payment.razorpay_payment_id);
      // Converted to string format
      hmac = hmac.digest('hex');
      // console.log(hmac);
      // Compare the two hex code that come from the razorpay signature and created hex
      // console.log(details.payment.razorpay_signature)
      if(hmac == details.payment.razorpay_signature){
         // If it matches we resolve it 
         resolve();
      }else{
         // Doesn't match we reject
         reject();
      }
   })
}

const updatePaymentStatus = (orderId,paymentStatus)=>{
    console.log(paymentStatus);
   return new Promise(async(resolve,reject)=>{
      try {
         if(paymentStatus){
            const orderUpdate = await Orders.findByIdAndUpdate({_id:orderId},{$set:{order_status:'Placed',payment_status:'paid',payment_method:'online payment'}})
            .then(()=>{
               resolve();
            });
         }else{
            const orderUpdate = await Orders.findByIdAndUpdate({_id:orderId},{$set:{order_status:'Failed',payment_status:'failed',payment_method:'online payment'}})
            .then(()=>{
               resolve()
            });
         }
      } catch (error) {
         reject(error);
         console.log(error.message);
      }
   })
}

module.exports ={
   generateRazorPay,
   verifyOnlinePayment,
   updatePaymentStatus,
}