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

const addAddress = async (req, res) => {
  try {
    const org = req.query.org;
    const categories = await CategoryCollection.find({ blocked: false });
    res.render("user/addAddress", { isAuthenticated: true, categories, org });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const newAddress = async (req, res) => {
  try {
    const msg = req.query.org;
    const name = req.body.username;
    const address = req.body.address;
    const state = req.body.state;
    const district = req.body.district;
    const city = req.body.city;
    const pincode = req.body.pincode;
    const mobile = req.body.mobileno;
    const userId = req.session.user._id;

    const data = new Address({
      name,
      address,
      state,
      district,
      city,
      pincode,
      mobile,
      userId,
    });
    // const newAddress=new Address(data)
    await data.save();
    let saveAddress = await collection.findByIdAndUpdate(userId, {
      $push: { address: data.userId },
    });
    if (msg == "account") {
      res.redirect("/myaccount");
    } else if (saveAddress) {
      res.redirect(`/checkout?err=${""}&msg=New address added successfully`);
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const editAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const editaddress = await Address.findById(addressId);
    const categories = await CategoryCollection.find({ blocked: false });
    const org = req.query.org;
    res.render("user/editAddress", {
      isAuthenticated: true,
      categories,
      editaddress,
      org,
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const editedAddress = async (req, res) => {
  try {
    const msg = req.query.org;
    const addressId = req.params.id;
    const name = req.body.username;
    const address = req.body.address;
    const state = req.body.state;
    const district = req.body.district;
    const city = req.body.city;
    const pincode = req.body.pincode;
    const mobile = req.body.mobileno;
    await Address.findOneAndUpdate(
      { _id: addressId },
      {
        name: name,
        address: address,
        state: state,
        district: district,
        city: city,
        pincode: pincode,
        mobile: mobile,
      }
    );
    if (msg == "account") {
      res.redirect("/myaccount");
    } else {
      res.redirect("/checkout");
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};
const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const orderWithAddress = await Orders.findOne({ address: addressId });
    if (orderWithAddress) {
      await Address.findOneAndUpdate({ _id: addressId }, { blocked: true });
    } else {
      await Address.findByIdAndRemove(addressId);
      const userId = req.session.user._id;
      await collection.updateOne({ _id: userId }, { $pop: { address: 1 } });
    }
    res.redirect("/myaccount");
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

module.exports = {
  addAddress,
  newAddress,
  editAddress,
  editedAddress,
  deleteAddress,
};
