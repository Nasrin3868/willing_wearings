var express=require("express")
const admincollection=require("../model/mongodb")
const collection=require("../model/mongodb")

const router=express.Router()
const controller=require("../controller/adminController")
const path=require("path")
const middleware=require("../middleware/adminAuth")
router.use(express.urlencoded({ extended: true }));

const multer=require("multer")
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads'); 
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));  
    }
  });
 
const upload = multer({ storage: storage });
  
//login
router.get("/",middleware.islogin,controller.dashboard)
router.get("/signin",controller.dashboard)

//productmanagemant
router.get("/addproduct",middleware.islogin,controller.addproductpage)
router.post("/addproduct", upload.array('images', 4),controller.addproduct)
router.get("/productblock/:id",middleware.islogin,controller.product_block)
router.get("/productredirection",middleware.islogin,controller.productredirection)
router.get("/product_list",middleware.islogin,controller.productredirection)
router.get("/edit-product/:id",middleware.islogin,controller.editproductpage)
router.post("/editproduct/:id",controller.editproduct)

router.post("/addproduct", upload.array('images', 4), controller.addproduct);
router.post("/editproduct", upload.array('images', 4), controller.editproduct);

router.get("/adminsignin",middleware.islogout,controller.signin)
router.post("/adminsignin",middleware.islogout,controller.dosignin)
router.get("/adminlogout",middleware.islogin,controller.logout)

router.post("/deleteImage/:id",controller.deleteImage)

//user management
router.get("/user_list",middleware.islogin,controller.userlist)
router.get("/userblock/:id",middleware.islogin,controller.user_block)

//category Management
router.get("/categorylist",middleware.islogin,controller.categoryredirection)
router.post("/addcategory",controller.toaddcategory)
router.get("/categoryredirection",middleware.islogin,controller.categoryredirection)
router.get("/categoryblock/:id",middleware.islogin,controller.category_block)
router.post("/editcategory",controller.editcategorypage)

//coupon Management
router.get("/couponlist",middleware.islogin,controller.couponlistredirection)
router.post("/addcoupon",controller.addcoupon)
router.post("/updateCoupon",controller.updateCoupon)
router.get("/couponblock/:id",middleware.islogin,controller.couponblock)

//order management
router.get("/orderManagement",middleware.islogin,controller.orderManagement)
router.get("/orderDetails/:id",middleware.islogin,controller.orderDetails)
router.post("/changestatus/:id/:status", controller.changestatus);

//sales report
router.get("/sales_report",middleware.islogin,controller.salesReport)
router.post("/UpdateOrderByDateForm",controller.UpdateOrderByDateForm)
router.get("/dailyOrder",middleware.islogin,controller.dailyOrder)
router.get("/weeklyOrder",middleware.islogin,controller.weeklyOrder)
router.get("/yearlyOrder",middleware.islogin,controller.yearlyOrder)
router.get("/invoice",middleware.islogin,controller.invoice)

//referral offer
router.get("/referrallist",middleware.islogin,controller.referrallist)
router.post("/editreferral",controller.editreferral)

module.exports=router
