const mongoose = require('mongoose');

  const orderSchema = new mongoose.Schema({
    items: [
        {
          product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'productCollection', // Reference to the Product model
            required: true,
          },
          images: [
            {
              type: String  // Assuming you store image URLs as strings
            }
          ],
          sellingprice:{
            type: Number,
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
          },
          sales_price: {
            type: Number,
            required: true,
          },
          category_discount:{
            type: Number,
            default:0,
            required: true
          }
        },
    ],
    payment_method: {
      type: String,
      required: true,
      default:"Cash On Delivery"
    },
    couponDiscount:{
       type: Number,
       default:0
    },
    totalAmount:{
       type: Number,
       required:true,
    },
    actualTotalAmount:{
       type: Number,
       required:true
    },
    couponDiscount:{
       type: Number,
       required:true
    },
    categoryDiscount:{
      type: Number,
      default:0,
      required:true
    },
    finalAmount:{
      type: Number,
      required:true
   },
    payment_status: {
      type: String,
      required: true,
      default:'Pending'
    },
    order_status: {
      type: String,
      required: true,
      default:'Placed'
    },
    created_on:{
      type: Date,
      default:Date.now,
      required:true
    },
    expected_delivery_on: {
      type: Date,
      default: () => {
        const now = new Date();
        now.setDate(now.getDate() + 5);
        return now;
      }
    },
    delivered_on: {
      type: Date,
      default: null
    },
    return_Reason:{
      type: String,
      default:null,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'logincollection', 
      required: true,
    },
    address: {
        name:{
          type: String,
          required:true
        },
        address:{
          type: String,
          required:true
        },
        district:{
          type: String,
          required:true
        },
        state:{
          type: String,
          required:true
        },
        city:{
          type: String,
          required:true
        },
        pincode:{
          type: Number,
          required:true
        },
        mobileno:{
          type: Number,
          required:true
        }
      },
  });

module.exports = mongoose.model("ordercollection", orderSchema);
