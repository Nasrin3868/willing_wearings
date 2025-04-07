const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const collection = require("../model/mongodb");
const Products = require("../model/productmodel");
const CategoryCollection = require("../model/categorymodel");
const Address = require("../model/addressmodel");
// const { Collection } = require("mongoose");
const Orders = require("../model/ordermodel");
// const userHelper = require("../helper/razorPay");
// const CouponCollection = require("../model/couponmodel");
const ReferralCollection = require("../model/referralmodel");
// const cartController = require("../controller/cartController");
const {verifyPassword,sendOTP}=require("../helper/userHelper")
require("dotenv").config();

let discount = "";
let coupon_code = "";

const home = async (req, res) => {
  try {
    discount = "";
    coupon_code = "";
    const isAuthenticated = false;
    const categories = await CategoryCollection.find({ blocked: false });
    const products = await Products.find({ blocked: false });
    if (req.query.range) {
      if (req.query.range == "high") {
        products.sort((a, b) => b.sellingprice - a.sellingprice);
      } else if (req.query.range == "low") {
        products.sort((a, b) => a.sellingprice - b.sellingprice);
      }
    }
    res.render("user/home", {
      isAuthenticated,
      products,
      categories,
      user: "",
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const loadHomeAfterLogin = async (req, res) => {
  try {
    discount = "";
    coupon_code = "";
    const userId = req.query.userId;
    const value = "home";
    if (req.session.user) {
      const isAuthenticated = true;
      const categories = await CategoryCollection.find({ blocked: false });
      const products = await Products.find({ blocked: false });
      if (req.query.range) {
        if (req.query.range == "high") {
          products.sort((a, b) => b.sellingprice - a.sellingprice);
        } else if (req.query.range == "low") {
          products.sort((a, b) => a.sellingprice - b.sellingprice);
        }
      }
      const user = await collection
        .findById(req.session.user)
        .populate("cart.product");
      res.render("user/home", { isAuthenticated, products, categories, user });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};


const login = async (req, res) => {
  try {
    const categories = await CategoryCollection.find({ blocked: false });
    const isAuthenticated = !!req.session.user; // Converts to true/false
    const err = req.query.err;
    const msg = req.query.msg;

    res.render("user/login", {
      errmessage: err === "true" ? msg : "",
      message: err === "true" ? "" : msg,
      isAuthenticated,
      categories,
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error");
  }
};

const logout = async (req, res) => {
  try {
    res.redirect("/home");
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

var globalEmail = " ";
var otps;

const dologin = async (req, res) => {
  try {
    const emails = req.body.email;
    const password = req.body.password;
    const categories = await CategoryCollection.find({ blocked: false });
    const data = await collection.findOne({ email: emails });
    if (data) {
      otps = data.otp;
    }
    if (data && data.blocked == false) {
      bcrypt.compare(password, data.password, (err, result) => {
        if (result) {
          if (!otps) {
            //loginwithoutotp
            globalEmail = emails;
            const isAuthenticated = false;
            res.render("user/otp", { isAuthenticated, categories });
            const email = globalEmail;
            console.log(email);
            if (!email) {
              res.redirect(`/register?err=${true}&msg=Email is missing`);
            }
            sendOTP(emails,req);
          } else {
            req.session.user = data;
            res.redirect("/home");
          }
        } else {
          res.redirect(`/login?err=${true}&msg=Password donot match`);
        }
      });
    } else if(data && data.blocked == true){
      res.redirect(`/login?err=${true}&msg=This user is blocked`);
    } else {
      res.redirect(`/login?err=${true}&msg=User not found`);
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const signup = async (req, res) => {
  try {
    const err = req.query.err;
    const msg = req.query.msg;
    const categories = await CategoryCollection.find({ blocked: false });
    if (err) {
      const isAuthenticated = false;
      res.render("user/signup", {
        errmessage: msg,
        isAuthenticated,
        categories,
      });
    } else {
      const isAuthenticated = false;
      res.render("user/signup", { isAuthenticated, categories });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const dosignup = async (req, res) => {
  try {
    const user = await collection.findOne({ referral_code: req.body.referral });
    const referral = await ReferralCollection.findOne();
    let data;
    if (user) {
      // const refferal_count=user.refferal_count++
      data = {
        username: req.body.username,
        email: req.body.email,
        mobile: req.body.mobile,
        password: req.body.password,
        wallet: referral.referee,
      };
      await collection.findOneAndUpdate(
        { referral_code: req.body.referral },
        { $inc: { wallet: referral.referee, referral_count: 1 } }
      );
    } else {
      data = {
        username: req.body.username,
        email: req.body.email,
        mobile: req.body.mobile,
        password: req.body.password,
      };
    }
    globalEmail = req.body.email;
    const check = await collection.findOne({ email: data.email });
    const categories = await CategoryCollection.find({ blocked: false });
    const isAuthenticated = false;
    if (check) {
      res.render("user/signup", {
        errordata: "email already exists",
        isAuthenticated,
        categories,
      });
    } else {
      const saltRounds = 10;
      bcrypt.hash(data.password, saltRounds, async (err, hashedpassword) => {
        if (err) {
          console.error("error in hashing password");
          res.status(500).send("error in hashing password");
        } else {
          data.password = hashedpassword;
          const newUser = new collection(data);

          try {
            await newUser.save();
            res.redirect("otp");
          } catch (err) {
            console.error("Error while saving user:", err);
            res.status(500).send("Error while saving user");
          }
        }
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

let generatedOTP = "";

const sendOtp = async (req, res) => {
  const isAuthenticated = false;
  const categories = await CategoryCollection.find({ blocked: false });
  res.render("user/otp", { isAuthenticated, categories });
  try {
    const email = globalEmail;
    console.log(email);
    const my_Mail = process.env.nodemailer_email;
    const my_password = process.env.nodemailer_password; //otpgenerator

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: my_Mail,
        pass: my_password,
      },
    });

    if (!email) {
      res.redirect(`/register?err=${true}&msg=Email is missing`);
    }

    // Function to generate and send OTP
    function sendOTP() {
      //   generatedOTP = otpgenerator.generate(6, {digits: true, upperCase: false, specialChars: false, alphabets: false });
      generatedOTP = randomstring.generate({
        length: 6, // Set the length of your OTP
        charset: "numeric", // Use only numeric characters
      });

      console.log("generatedOTP " + generatedOTP);
      req.session.generatedOTP = generatedOTP;
      console.log("Session Stored OTP " + req.session.generatedOTP);

      const mailOptions = {
        from: my_Mail,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP code is: ${generatedOTP}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending OTP:", error);
        } else {
          console.log("OTP sent:", info.response);
        }
      });

      // Invalidate the OTP after 1 minute
      setTimeout(() => {
        generatedOTP = null;
      }, 1 * 60 * 1000);
    }
    sendOTP();
  } catch (error) {
    console.log(error.message);
  }
};

const validateotp = async (req, res) => {
  try {
    if (generatedOTP === req.body.enterotp) {
      // Save OTP to MongoDB
      const email = globalEmail;
      const save_otp = generatedOTP;
      const isAuthenticated = true;
      const categories = await CategoryCollection.find({ blocked: false });
      const products = await Products.find({ blocked: false });
      await collection.updateOne({ email }, { $set: { otp: save_otp } });
      res.redirect("login");
    } else {
      const isAuthenticated = false;
      res.render("user/otp", {
        errordata: "Invalid OTP",
        message: "",
        isAuthenticated,
        categories,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const resendotp = async (req, res) => {
  try {
    res.redirect("/otp");
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const Toemail = async (req, res) => {
  try {
    const isAuthenticated = false;
    const categories = await CategoryCollection.find({ blocked: false });
    res.render("user/forgetpassword", {
      errmessage: "",
      isAuthenticated,
      categories,
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const checkemail = async (req, res) => {
  try {
    globalEmail = req.body.email;
    const data = await collection.findOne({ email: globalEmail });
    const categories = await CategoryCollection.find({ blocked: false });
    if (data) {
      if (data.blocked == true) {
        const isAuthenticated = false;
        res.render("user/forgetpassword", {
          errmessage: "User not found",
          isAuthenticated,
          categories,
        });
      } else {
        const isAuthenticated = false;
        res.redirect("/otpcheck");
      }
    } else {
      const isAuthenticated = false;
      res.render("user/forgetpassword", {
        errmessage: "Invalid Email",
        isAuthenticated,
        categories,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const otpcheckpage = async (req, res) => {
  const isAuthenticated = false;
  const categories = await CategoryCollection.find({ blocked: false });
  res.render("user/otp_password", { isAuthenticated, categories });
  try {
    console.log(globalEmail);
    const email = globalEmail;
    const my_Mail = process.env.nodemailer_email;
    const my_password = process.env.nodemailer_password; //otpgenerator
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: my_Mail,
        pass: my_password,
      },
    });
    if (!email) {
      res.redirect(`/forgetpassword?err=${true}&msg=Email is missing`);
    }
    // Function to generate and send OTP
    function sendOTP() {
      //   generatedOTP = otpgenerator.generate(6, {digits: true, upperCase: false, specialChars: false, alphabets: false });
      generatedOTP = randomstring.generate({
        length: 6, // Set the length of your OTP
        charset: "numeric", // Use only numeric characters
      });
      console.log("generatedOTP " + generatedOTP);
      req.session.generatedOTP = generatedOTP;
      console.log("Session Stored OTP " + req.session.generatedOTP);
      const mailOptions = {
        from: my_Mail,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP code is: ${generatedOTP}`,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending OTP:", error);
        } else {
          console.log("OTP sent:", info.response);
        }
      });
      // Invalidate the OTP after 1 minute
      setTimeout(() => {
        generatedOTP = null;
      }, 1 * 60 * 1000);
    }
    sendOTP();
  } catch (error) {
    console.log(error.message);
  }
};

const otpchecks = async (req, res) => {
  try {
    const categories = await CategoryCollection.find({ blocked: false });
    if (generatedOTP === req.body.enterotp) {
      res.redirect("/confirmpassword");
    } else {
      const isAuthenticated = false;
      res.render("user/otp_password", {
        errordata: "Invalid OTP",
        message: "",
        isAuthenticated,
        categories,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const resendOTP_for_forgrtpassword = async (req, res) => {
  try {
    res.redirect("/otpcheck");
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const confirmpassword = async (req, res) => {
  try {
    const categories = await CategoryCollection.find({ blocked: false });
    const isAuthenticated = false;
    res.render("user/confirmpassword", { isAuthenticated, categories });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const confirm_password_check = async (req, res) => {
  try {
    const categories = await CategoryCollection.find({ blocked: false });
    const isAuthenticated = false;
    const password = req.body.password;
    const email = globalEmail;
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, async (err, hashedpassword) => {
      if (err) {
        console.error("error in hashing password");
        res.status(500).send("error in hashing password");
      } else {
        // password=hashedpassword
        await collection.updateOne(
          { email: email },
          { $set: { password: hashedpassword } }
        );
        res.render("user/login", {
          isAuthenticated,
          categories,
          errmessage: "",
          message: "",
        });
      }
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const myaccount = async (req, res) => {
  try {
    const categories = await CategoryCollection.find({ blocked: false });
    const userId = req.session.user._id;
    const user = await collection.findById(userId);
    const useraddress = await Address.find({ userId, blocked: false });
    const orders = await Orders.find({ user_id: userId })
      .populate("address")
      .populate("items.product_id");
    // Calculate the total quantity for each order
    const ordersWithQuantity = orders.map((order) => {
      const totalQuantity = order.items.reduce(
        (acc, item) => acc + item.quantity,
        0
      );
      return {
        ...order.toObject(),
        quantity: totalQuantity,
      };
    });
    res.render("user/myaccount", {
      isAuthenticated: true,
      categories,
      Address: useraddress,
      user,
      order: ordersWithQuantity,
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const profileEdit = async (req, res) => {
  try {
    const username = req.body.name;
    const mobile = req.body.mobile;
    const userId = req.session.user._id;
    const user = await collection.findByIdAndUpdate(userId, {
      username: username,
      mobile: mobile,
    });
    res.redirect("/myaccount");
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const changePassword = async (req, res) => {
  try {
    const categories = await CategoryCollection.find({ blocked: false });
    res.render("user/currentPassword", {
      isAuthenticated: true,
      categories,
      errmessage: "",
      message: "",
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const validatePassword = async (req, res) => {
  try {
    const { password, newpassword, confirmpassword } = req.body;
    const userId = req.session.user._id;
    const user = await collection.findById(userId);
    const isMatch = await bcrypt.compare(password, user.password);
    const categories = await CategoryCollection.find({ blocked: false });
    if (isMatch) {
      const hashedPassword = await bcrypt.hash(newpassword, 10); // You can adjust the salt rounds as needed
      user.password = hashedPassword;
      await user.save();
      res.redirect("/myaccount");
    } else {
      res.render("user/currentPassword", {
        isAuthenticated: true,
        categories,
        errmessage: "Current password is not matching",
        message: "",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const error_page = async (req, res) => {
  res.render("user/page404error");
};

module.exports = {
  home,
  login,
  signup,
  logout,
  dosignup,
  sendOtp,
  dologin,
  validateotp,
  resendotp,
  Toemail,
  checkemail,
  otpchecks,
  otpcheckpage,
  resendOTP_for_forgrtpassword,
  confirmpassword,
  confirm_password_check,
  loadHomeAfterLogin,
  myaccount,
  profileEdit,
  changePassword,
  validatePassword,
  error_page,
};
