const collection = require("../model/mongodb");

const islogin=async(req,res,next)=>{
    if(req.session.user){
        next()
    }else{
        res.redirect("/")
    }
    
}
const iflogin=async(req,res,next)=>{
    if(req.session.user){
        res.redirect("/home")
    }else{
        next()
    }
}

const islogout=async(req,res,next)=>{
    req.session.user=null;
    next()
}

const cartAuth=async(req,res,next)=>{
    if(req.session.user){
        const user=await collection.findOne({_id:req.session.user._id})
        if(user.blocked==false){
            next()
        }else{
            req.session.user=null
            res.redirect("/login")
        }
    }else{
        res.redirect("/login")
    }
}

module.exports={islogout,islogin,cartAuth,iflogin}