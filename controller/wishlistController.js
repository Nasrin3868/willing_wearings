const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const collection = require("../model/mongodb");
const Products = require("../model/productmodel");
const CategoryCollection = require("../model/categorymodel");
const Address = require("../model/addressmodel");
const { Collection } = require("mongoose");
const Orders = require("../model/ordermodel");
const userHelper = require("../helper/razorPay");
const CouponCollection = require("../model/couponmodel");
const ReferralCollection = require("../model/referralmodel");

const wishlist = async (req, res) => {
  try {
    discount = "";
    coupon_code = "";
    const isAuthenticated = true;
    const categories = await CategoryCollection.find({ blocked: false });
    const user = await collection
      .findById(req.session.user._id)
      .populate("wishlist")
      .populate("cart.product");
    res.render("user/wishlist", {
      isAuthenticated,
      categories,
      userdata: user,
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const updateWishlist = async (req, res) => {
  try {
    const productId = req.params.id;
    const user = await collection
      .findById(req.session.user._id)
      .populate("wishlist");
    const index = user.wishlist.findIndex((item) => item._id.equals(productId)); // Check if the product is in the wishlist
    if (index === -1) {
      user.wishlist.push(productId);
    } else {
      user.wishlist.splice(index, 1);
    }
    await user.save();
    return res.json({ status: true });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const wishlistToCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Products.findById(productId);
    const userId = req.session.user._id;
    const user = await collection.findOne({ _id: userId });
    const existingCartItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    // Update the cart based on whether the product exists or not
    if (existingCartItem) {
      if (product.stock > existingCartItem.quantity) {
        existingCartItem.quantity++;
        const index = user.wishlist.findIndex((item) =>
          item._id.equals(productId)
        );
        user.wishlist.splice(index, 1);
      } else {
        existingCartItem.quantity = existingCartItem.quantity;
        const index = user.wishlist.findIndex((item) =>
          item._id.equals(productId)
        );
        user.wishlist.splice(index, 1);
      }
    } else {
      if (product.stock === 0) {
        user.cart.push({
          product: productId,
          quantity: 0,
        });
      } else {
        user.cart.push({
          product: productId,
          quantity: 1,
        });
        const index = user.wishlist.findIndex((item) =>
          item._id.equals(productId)
        );
        user.wishlist.splice(index, 1);
      }
    }
    await user.save();
    res.json({ status: true });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const wishlistProductDelete = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user._id;
    const user = await collection.findOne({ _id: userId }).populate("wishlist");
    const productIndex = user.wishlist.findIndex(
      (item) => item.toString() === productId
    );
    user.wishlist.splice(productIndex, 1);
    await user.save();
    res.redirect("/wishlist");
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

module.exports = {
  wishlist,
  updateWishlist,
  wishlistToCart,
  wishlistProductDelete,
};
