const mongoose=require ("mongoose")

const categoryschema = new mongoose.Schema({
    name:{
        type: String,
        required: true        
    },
    type:{
        type: String,
        required: true
    },
    discount_percentage: {
        type: Number,
        default:0,
        required: true,
    },
    valid_from: {
        type: Date,
        default:Date.now,
        required: true,
    },
    valid_to: {
        type: Date,
        default:Date.now,
        required: true,
    },
    blocked:{
        type : Boolean,
        default: false
    }
})


module.exports = mongoose.model("CategoryCollection", categoryschema);

