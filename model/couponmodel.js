const mongoose = require("mongoose");

// function generateRandomCouponCode() {
//     const length = 12;
//     const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//     let couponCode = "";
//     for (let i = 0; i < length; i++) {
//         const randomIndex = Math.floor(Math.random() * charset.length);
//         couponCode += charset.charAt(randomIndex);
//     }
//     return couponCode;
// }

const couponschema = new mongoose.Schema({
    coupon_code: {
        type: String,
        // default: generateRandomCouponCode, // Use the function to generate the default value
        required: true,
    },coupon_description: {
        type: String,
        required: true,
    },
    discount_percentage: {
        type: Number,
        required: true,
    },
    min_order: {
        type: Number,
        required: true,
    },
    max_discount:{
        type: Number,
        required: true,
    },
    valid_from: {
        type: Date,
        required: true,
    },
    valid_to: {
        type: Date,
        required: true,
    },
    redeemed_users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "logincollection",
        }
    ],
    blocked: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model("CouponCollection", couponschema);
