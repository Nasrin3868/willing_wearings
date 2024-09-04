const collection = require("../model/mongodb");
const CategoryCollection = require("../model/categorymodel");
const Address = require("../model/addressmodel");
const Orders = require("../model/ordermodel");
const userHelper = require("../helper/razorPay");
const CouponCollection = require("../model/couponmodel");
const Products = require("../model/productmodel");
const cartController = require("../controller/cartController");
const { log } = require("sharp/lib/libvips");

let categoryDiscount = "";

const placeorder = async (req, res) => {
  try {
    discount = "";
    coupon_code = "";
    const userId = req.session.user._id;
    let offer = req.query.offer;
    const errmessage = req.query.errmessage;
    const msg = req.query.msg;
    const user = await collection.findById(userId).populate({
      path: "cart.product",
      populate: {
        path: "category",
        model: "CategoryCollection",
      },
    });
    // Create a map to track category discounts
    const categoryDiscountMap = new Map();

    // Iterate through the user's cart to calculate the category discount
    user.cart.forEach((cartItem) => {
      const categoryId = cartItem.product.category._id;
      const discountPercentage = cartItem.product.category.discount_percentage;
      const sales_price = cartItem.product.sellingprice;
      const from = cartItem.product.category.valid_from;
      const to = cartItem.product.category.valid_to;
      const today = new Date();
      if (today >= from && today <= to) {
        categoryDiscountMap.set(categoryId, {
          discountPercentage,
          sales_price,
        });
      }
    });
    // Sum the unique category discounts
    categoryDiscount = parseFloat(
      Array.from(categoryDiscountMap.values())
        .reduce(
          (acc, { discountPercentage, sales_price }) =>
            acc + (discountPercentage / 100) * sales_price,
          0
        )
        .toFixed(2)
    );

    const categories = await CategoryCollection.find({ blocked: false });
    const cartSubtotal = cartController.calculateCartSubtotal(user);

    res.render("user/placeorder", {
      isAuthenticated: true,
      categories,
      total: cartSubtotal,
      categoryDiscount,
      offer,
      errmessage,
      msg,
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const coupon = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const unredeemedCoupons = await CouponCollection.find({
      redeemed_users: { $ne: userId },
      blocked: false,
    });
    const categories = await CategoryCollection.find({ blocked: false });
    res.render("user/coupon", {
      Coupon: unredeemedCoupons,
      categories,
      isAuthenticated: true,
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const applyCoupon = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await collection.findById(userId).populate("cart.product");
    const categories = await CategoryCollection.find({ blocked: false });
    // Calculate the cart subtotal using the defined function
    const cartSubtotal = cartController.calculateCartSubtotal(user);
    coupon_code = req.body.Coupon;
    const today = new Date();
    const coupon = await CouponCollection.find({ coupon_code: coupon_code });
    if (coupon[0].min_order > cartSubtotal) {
      res.redirect(
        "/placeorder?offer=0&&errmessage=Can't apply this coupon.Your Ordered amount is low&&msg"
      );
    } else if (coupon[0].valid_to < today) {
      res.redirect("/placeorder?offer=0&&errmessage=Coupon expired&&msg");
    } else {
      // await CouponCollection.findOneAndUpdate({ coupon_code: coupon_code }, { $push: { redeemed_users: userId } });
      const amount = (coupon[0].discount_percentage / 100) * cartSubtotal;
      if (amount > coupon[0].max_discount) {
        discount = coupon[0].max_discount;
        res.render("user/placeorder", {
          isAuthenticated: true,
          categories,
          total: cartSubtotal,
          offer: "",
          discount,
          categoryDiscount,
          errmessage: "",
          msg: "Coupon applied Successfully",
        });
      } else {
        discount = amount;
        res.render("user/placeorder", {
          isAuthenticated: true,
          categories,
          total: cartSubtotal,
          offer: "",
          discount,
          categoryDiscount,
          errmessage: "",
          msg: "Coupon applied Successfully",
        });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const checkout = async (req, res) => {
  try {
    const err = req.query.err;
    const msg = req.query.msg;
    let coupondiscount = discount;
    if (discount == "") {
      coupondiscount = 0;
    }

    const userId = req.session.user._id;
    const user = await collection
      .findById(userId)
      .populate("cart.product")
      .populate({
        path: "cart.product",
        populate: {
          path: "category",
          model: "CategoryCollection",
        },
      });
    const today = new Date();
    const useraddress = await Address.find({ userId, blocked: false });
    const categories = await CategoryCollection.find({ blocked: false });
    const cartSubtotal = cartController.calculateCartSubtotal(user);
    if (err === "true") {
      res.render("user/checkout", {
        errmessage: msg,
        message: "",
        isAuthenticated: true,
        categories,
        user,
        cartSubtotal,
        categoryDiscount,
        today,
        coupondiscount,
        useraddress,
      });
    } else {
      res.render("user/checkout", {
        errmessage: "",
        message: msg,
        isAuthenticated: true,
        categories,
        user,
        cartSubtotal,
        categoryDiscount,
        today,
        coupondiscount,
        useraddress,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const placedOrder = async (req, res) => {
  try {
    const orderId=req.query.orderId
    const categories = await CategoryCollection.find({ blocked: false });
    const userId = req.session.user._id;
    const user = await collection.findById(userId).populate("cart.product");
    await CouponCollection.findOneAndUpdate(
      { coupon_code: coupon_code },
      { $push: { redeemed_users: userId } }
    );
    // await collection.findByIdAndUpdate(userId, { $set: { cart: [] } });
    res.render("user/orderPlacedSuccessfully", {
      isAuthenticated: true,
      categories,
      errmessage: "",
      orderId,
      message: "Order Placed Successfully..!",
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

let orderId = "";
const OrderSubmit = async (req, res) => {
  try {
    let Discount;
    const userId = req.session.user._id;
    const user = await collection
      .findById(userId)
      .populate("cart.product")
      .populate({
        path: "cart.product",
        populate: {
          path: "category",
          model: "CategoryCollection",
        },
      });
    const cartSubtotal = cartController.calculateCartSubtotal(user);
    if (discount == "") {
      Discount = 0;
    } else {
      Discount = discount;
    }

    const cartTotal = cartController.calculateCartTotal(user);
    // Create an array of items from the user's cart
    const items = user.cart.map((cartItem) => ({
      product_id: cartItem.product._id,
      images: cartItem.product.images,
      sellingprice: cartItem.product.sellingprice,
      quantity: cartItem.quantity,
      sales_price: cartItem.quantity * cartItem.product.sellingprice,
      category_discount: (
        (cartItem.product.category.discount_percentage / 100) *
        cartItem.product.sellingprice
      ).toFixed(2),
    }));
    const address = {
      name: req.body.name,
      address: req.body.address,
      state: req.body.state,
      district: req.body.district,
      city: req.body.city,
      pincode: req.body.pincode,
      mobileno: req.body.mobileno,
    };
    let newOrder;
    if (Discount == 0) {
      newOrder = new Orders({
        user_id: userId,
        address,
        items,
        totalAmount: cartTotal,
        actualTotalAmount: cartSubtotal,
        couponDiscount: Discount,
        categoryDiscount,
        finalAmount: (cartSubtotal - categoryDiscount).toFixed(2),
      });
    } else {
      newOrder = new Orders({
        user_id: userId,
        address,
        items,
        totalAmount: cartTotal,
        actualTotalAmount: cartSubtotal,
        couponDiscount: Discount,
        categoryDiscount,
        finalAmount: (cartSubtotal - Discount - categoryDiscount).toFixed(2),
      });
    }
    if (newOrder.actualTotalAmount == 0) {
      const response = {
        message: "Something went wrong, go to checkoutpage",
        redirectUrl: `/checkout`,
      };
      return res.status(200).json(response);
    } else {
      const cod = "COD";
      const onlinepayment = "onlinePayment";
      if (req.body.paymentType == cod) {
        for (const cartItem of user.cart) {
          const product = cartItem.product;
          const orderedQuantity = cartItem.quantity;
          const newStock = product.stock - orderedQuantity;
          if (newStock < 0) {
            return res.redirect(
              "/checkout?err=true&msg=Insufficient stock for " + product.name
            );
          }
          product.stock = newStock;
          await product.save();
        }
        await newOrder.save();
        orderId = newOrder._id;
        user.cart = [];
        await user.save();
        return res.json({
          status: "COD",
          redirectUrl: `/placedOrder?orderId=${orderId}`,
        });
      } else if (req.body.paymentType == "WalletPayment") {
        for (const cartItem of user.cart) {
          const product = cartItem.product;
          const orderedQuantity = cartItem.quantity;
          const newStock = product.stock - orderedQuantity;
          if (newStock < 0) {
            return res.redirect(
              "/checkout?err=true&msg=Insufficient stock for " + product.name
            );
          }
          product.stock = newStock;
          await product.save();
        }
        await newOrder.save();
        orderId = newOrder._id;
        user.cart = [];
        await user.save();
        await collection.findByIdAndUpdate(userId, {
          wallet: user.wallet - newOrder.finalAmount,
        });
        await Orders.findByIdAndUpdate(orderId, {
          $set: { payment_status: "paid", payment_method: "wallet payment" },
        });
        return res.json({
          status: "COD",
          redirectUrl: `/placedOrder?orderId=${orderId}`,
        });
      } else {
        await newOrder.save();
        await Orders.findByIdAndUpdate(newOrder._id, {
          $set: { payment_method: "online payment" },
        });
        const finalAmount = newOrder.finalAmount; //amount have to pay for the order
        orderId = newOrder._id; //order id of the newest order that done right now
        userHelper
          .generateRazorPay(newOrder._id, finalAmount)
          .then((response) => {
            return res.json({ status: "RAZORPAY", response: response });
          });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const closepayment = async (req, res) => {
  try {
    await Orders.updateMany(
      {
        $and: [
          { payment_method: "online payment" },
          { payment_status: "Pending" },
        ],
      },
      { $set: { payment_status: "canceled payment" } }
    );
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const verifyOnlinePayment = async (req, res) => {
  try {
    let data = req.body;
    const userId = req.session.user._id;
    const user = await collection.findById(userId).populate("cart.product");
    for (const cartItem of user.cart) {
      const product = cartItem.product;
      const orderedQuantity = cartItem.quantity;
      const newStock = product.stock - orderedQuantity;
      if (newStock < 0) {
        return res.redirect(
          "/checkout?err=true&msg=Insufficient stock for " + product.name
        );
      }
      product.stock = newStock;
      await product.save();
    }
    user.cart = [];
    await user.save();
    let receiptId = data.order.receipt;
    userHelper
      .verifyOnlinePayment(data)
      .then(() => {
        let paymentSuccess = true;
        userHelper.updatePaymentStatus(receiptId, paymentSuccess).then(() => {
          res.json({ status: "paymentSuccess", placedOrderId: receiptId });
        });
      })
      .catch((err) => {
        if (err) {
          let paymentSuccess = false;
          userHelper.updatePaymentStatus(receiptId, paymentSuccess);
        }
      });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const paymentFailureHandler = async (req, res) => {
  try {
    // let data=await Order.findOne({_id:orderId});
    const userId = req.session.user._id;

    let data = await Orders.findOneAndUpdate(
      { _id: orderId }, // Query to find the document
      { $set: { order_status: "payment Failed" } },
      { new: true }
    );

    return res.status(200).json({
      redirectUrl: `/paymentFailure`, // Specify the desired redirect URL here
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const paymentFailure = async (req, res) => {
  try {
    const categories = await CategoryCollection.find({ blocked: false });
    const orderUpdate = await Orders.findByIdAndUpdate(
      { _id: orderId },
      {
        $set: {
          order_status: "Failed",
          payment_method: "online payment",
          payment_status: "failed",
        },
      }
    );
    res.render("user/paymentFailure", {
      isAuthenticated: true,
      categories,
      errmessage: "Payment Failed...",
      message: "",
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const orderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const orders = await Orders.findById({ _id: orderId })
      .populate("address")
      .populate("items.product_id")
      .populate("user_id");
    const categories = await CategoryCollection.find({ blocked: false });
    res.render("user/orderDetails", {
      isAuthenticated: true,
      categories,
      orders,
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const cancelOrder = async (req, res) => {
  try {
    const user = await collection.findById(req.session.user._id);
    const orderId = req.params.id;
    const orders = await Orders.findById(orderId);
    if (orders.payment_method == "Cash On Delivery") {
      await Orders.findByIdAndUpdate(orderId, {
        order_status: "cancelled",
        payment_status: "cancelled",
      });
    } else {
      await collection.findByIdAndUpdate(req.session.user._id, {
        wallet: orders.finalAmount,
      });
      await Orders.findByIdAndUpdate(orderId, {
        order_status: "cancelled",
        payment_status: "refunded",
      });
    }
    const userId = req.session.user._id;
    const order = await Orders.findById(orderId).populate({
      path: "items.product_id",
      model: "productCollection",
    });
    for (const cartItem of order.items) {
      const product = cartItem.product_id;
      const orderedQuantity = cartItem.quantity;
      const newStock = product.stock + orderedQuantity;
      if (newStock < 0) {
        return res.redirect(
          "/checkout?err=true&msg=Insufficient stock for " + product.name
        );
      }
      product.stock = newStock;
      await product.save();
    }
    res.redirect(`/orderDetails/${orderId}`);
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const returnOrder = async (req, res) => {
  try {

    const orderId = req.params.id;
    const returnReason = req.params.reason;
    const orders = await Orders.findById(orderId);
    await collection.findByIdAndUpdate(req.session.user._id, {
      wallet: orders.finalAmount,
    });
    await Orders.findByIdAndUpdate(orderId, {
      order_status: "returned",
      return_Reason: returnReason,
      payment_status: "refunded",
    });
    const userId = req.session.user._id;
    const order = await Orders.findById(orderId).populate({
      path: "items.product_id",
      model: "productCollection",
    });
    for (const cartItem of order.items) {
      const product = cartItem.product_id;
      const orderedQuantity = cartItem.quantity;
      const newStock = product.stock + orderedQuantity;
      if (newStock < 0) {
        return res.redirect(
          "/checkout?err=true&msg=Insufficient stock for " + product.name
        );
      }
      product.stock = newStock;
      await product.save();
    }
    res.redirect(`/orderDetails/${orderId}`);
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

module.exports = {
  placeorder,
  checkout,
  OrderSubmit,
  placedOrder,
  orderDetails,
  cancelOrder,
  returnOrder,
  paymentFailure,
  paymentFailureHandler,
  verifyOnlinePayment,
  closepayment,
  coupon,
  applyCoupon,
};
