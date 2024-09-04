
const islogin=async(req,res,next)=>{
    if(!req.session.admin){
        res.redirect("/admin/adminsignin")
    }else{
        next()        
    }
    
}


const isloggedin = (req, res, next) => {
    if (req.session.admin) {
      return res.redirect('/admin/signin');
    }
    next();
  };

const islogout=async(req,res,next)=>{
    if(!req.session.admin){
    next()
    }else{
        res.redirect("/admin")
    } 
}

module.exports={islogout,islogin,isloggedin}