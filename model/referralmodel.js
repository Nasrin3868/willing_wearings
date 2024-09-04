const mongoose=require ("mongoose")

const referralschema = new mongoose.Schema({
    referrer:{
        type: Number,
        default:0
    },
    referee:{
        type:Number,
        default:0
    }
})


module.exports = mongoose.model("ReferralCollection", referralschema);