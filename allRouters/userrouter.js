var express=require("express")
const collection=require("../model/mongodb")
const router=express.Router()
const controller=require("../controller/userController")
const productController=require("../controller/productController")
const cartController=require("../controller/cartController")
const addressController=require("../controller/addressController")
const wishlistController=require("../controller/wishlistController")
const orderController=require("../controller/orderController")

const middleware=require("../middleware/userAuth")

//home

router.get("/",middleware.iflogin,controller.home)
router.get("/home",middleware.islogin,controller.loadHomeAfterLogin)

//login
router.get("/login",middleware.iflogin,controller.login)
router.post("/login",controller.dologin)
router.post("/login",controller.home)
router.get("/logout",middleware.islogout,controller.logout)

//signup
router.get("/signup",controller.signup)
router.post("/dosignup",controller.dosignup)

//otp
router.get("/otp",controller.sendOtp)
router.post("/otp",controller.sendOtp)
router.post("/validateotp",middleware.iflogin,controller.validateotp)
router.post("/resendOTP",controller.resendotp)

//forget Password
router.get("/forgetpassword",controller.Toemail)
router.post("/emailcheck",controller.checkemail)
router.get("/otpcheck",controller.otpcheckpage)
router.post("/otpcheck",controller.otpchecks)
router.post("/resendOTP_for_forgrtpassword",controller.resendOTP_for_forgrtpassword)
router.get("/confirmpassword",controller.confirmpassword)
router.post("/confirm_password_check",controller.confirm_password_check)

//Page-wise product listing
router.post("/searchCategory",productController.searchProducts)
router.get("/searchCategory",productController.searchProduct)
router.get("/all",productController.allpage)
router.get("/showbycategory/:name",productController.showbycategory)
router.get("/ethinic",productController.ethinicpage)
router.get("/ethinicshowbycategory/:name",productController.ethinicshowbycategory)
router.get("/western",productController.westernpage)
router.get("/westernshowbycategory/:name",productController.westernshowbycategory)
router.get("/sports",productController.sportspage)
router.get("/Sportsshowbycategory/:name",productController.Sportsshowbycategory)
router.get("/productview/:id",productController.productview)

//wishlist
router.get("/wishlist",middleware.cartAuth,wishlistController.wishlist)
router.post("/updateWishlist/:id",middleware.cartAuth,wishlistController.updateWishlist)
router.post("/wishlistToCart/:id",wishlistController.wishlistToCart)
router.get("/wishlistProductDelete/:id",middleware.cartAuth,wishlistController.wishlistProductDelete)

//cart-update
router.post("/productQuantityUpdate",cartController.productQuantityUpdate)
router.get("/doCart/:id",middleware.cartAuth,cartController.doCart)
router.get("/cart",middleware.cartAuth,cartController.cart)
router.post("/quantityIncrease/:id",cartController.quantityIncrease)
router.post("/cartUpdate",cartController.cartUpdate)
router.get("/cart",middleware.cartAuth,cartController.calculateCartSubtotal)
router.get("/cartproductdelete/:id",middleware.cartAuth,cartController.cartproductdelete)

//order
router.get("/placeorder",middleware.cartAuth,orderController.placeorder)
router.get("/checkout",middleware.cartAuth,orderController.checkout)
router.post("/OrderSubmit",orderController.OrderSubmit)
router.get("/placedOrder",middleware.cartAuth,orderController.placedOrder)
router.get("/orderDetails/:id",middleware.cartAuth,orderController.orderDetails)
router.post("/cancelOrder/:id",orderController.cancelOrder)
router.post("/returnOrder/:id/:reason",orderController.returnOrder)

//payment of Order
router.post("/closepayment",middleware.cartAuth,orderController.closepayment);
router.post("/verify-payment",middleware.cartAuth,orderController.verifyOnlinePayment);
router.post("/paymentFailureHandler",orderController.paymentFailureHandler)
router.get("/paymentFailure",middleware.cartAuth,orderController.paymentFailure)

//coupon
router.get("/coupon",middleware.cartAuth,orderController.coupon)
router.post("/applyCoupon",orderController.applyCoupon)

//address
router.get("/addAddress",middleware.cartAuth,addressController.addAddress)
router.post("/newAddress",addressController.newAddress)
router.get("/editAddress/:id",middleware.cartAuth,addressController.editAddress)
router.post("/editedAddress/:id",middleware.cartAuth,addressController.editedAddress)
router.get("/deleteAddress/:id",middleware.cartAuth,addressController.deleteAddress)

//user profile
router.get("/myaccount",middleware.cartAuth,controller.myaccount)
router.post("/profileEdit",controller.profileEdit)
router.get("/changePassword",middleware.cartAuth,controller.changePassword)
router.post("/validatePassword",controller.validatePassword)

//error-page
router.get("*",(req,res)=>{
    res.render("user/page404error")
})

module.exports=router