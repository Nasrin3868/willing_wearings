// email:admin@gmail.com 
// password: Admin@123

const multer = require("multer");
const easyimg = require("easyimage");
const fs = require("fs");
const Product = require("../model/productmodel");
const collection = require("../model/mongodb");
const Address = require("../model/addressmodel");
const Orders = require("../model/ordermodel");
const sharp = require("sharp");

const admincollection = require("../model/admincollection");
const CategoryCollection = require("../model/categorymodel");
const CouponCollection = require("../model/couponmodel");
const path = require("path");
const { log } = require("sharp/lib/libvips");
const ReferralCollection = require("../model/referralmodel");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const dashboard = async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const orders = await Orders.find()
      .populate("address")
      .populate("items.product_id")
      .populate("user_id");
    const paidOrders = await Orders.aggregate([
      {
        $match: { payment_status: { $in: ["paid", "Pending"] } },
      },
      {
        $group: { _id: null, totalAmount: { $sum: "$finalAmount" } },
      },
    ]);
    // Calculate the total no. of orders in the collection
    const totalOrdersCount = await Orders.countDocuments();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // Month is 0-indexed (0 = January, 1 = February, ...)
    const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 1); // Set to the beginning of the current month (midnight on the 1st)
    const endOfMonth = new Date(
      currentYear,
      currentMonth + 1,
      0,
      23,
      59,
      59,
      999
    );

    const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const monthlyOrders = await Orders.aggregate([
      {
        $match: {
          created_on: { $gte: startOfMonth, $lte: endOfMonth },
          payment_status: { $in: ["paid", "Pending"] },
        },
      },
      {
        $group: { _id: null, totalAmount: { $sum: "$finalAmount" } },
      },
    ]);
    const monthlyOrderStats = await Orders.aggregate([
      {
        $match: {
          created_on: {
            $gte: startOfYear, // Start of the current year
            $lte: endOfYear, // End of the current year
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$created_on" }, // Extract the year from the date
            month: { $month: "$created_on" }, // Extract the month from the date
          },
          count: { $sum: 1 }, // Count orders for each month
        },
      },
      {
        $sort: {
          "_id.year": 1, // Sort by year
          "_id.month": 1, // Sort by month
        },
      },
    ]);

    //     // Extract the calculated values from the aggregation results
    const monthlyOrdersTotal =
      monthlyOrders.length > 0
        ? monthlyOrders.reduce((total, order) => total + order.totalAmount, 0)
        : 0;
    const paidOrdersTotal =
      paidOrders.length > 0 ? paidOrders[0].totalAmount : 0;

    // Render the dashboard view with the calculated values
    res.render("admin/dashboard.ejs", {
      paidOrdersTotal,
      productCount,
      totalOrdersCount,
      monthlyOrdersTotal,
      monthlyOrderStats,
    });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const addproductpage = async (req, res) => {
  try {
    const categories = await CategoryCollection.find();
    res.render("admin/addproduct.ejs", { categories });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const addproduct = async (req, res) => {
  try {
    const name = req.body.name;
    const description = req.body.description;
    const price = req.body.price;
    const discount = req.body.discount;
    const sellingprice = (price - (discount / 100) * price).toFixed(0);
    const categoryname = req.body.category;
    const categories = await CategoryCollection.find({ name: categoryname });

    const category = categories[0]._id;

    const size = req.body.size;
    const brand = req.body.brand;
    const stock = req.body.stock;
    const status = req.body.status;
    const colour = req.body.colour;

    let imageUrls = [];

    // Define the desired crop dimensions (width, height)
    const width = 700;
    const height = 600;

    // Handle each file individually
    for (const file of req.files) {
      const filePath = path.join("uploads", file.filename);

      // Check if the file exists before processing
      if (fs.existsSync(filePath)) {
        // Use Sharp to resize and crop the image
        const croppedBuffer = await sharp(filePath)
          .resize(width, height)
          .toBuffer();

        // Save the cropped image
        const croppedFilename = "cropped-" + file.filename;
        const croppedFilePath = path.join("uploads", croppedFilename);
        fs.writeFileSync(croppedFilePath, croppedBuffer);

        imageUrls.push(`/uploads/${croppedFilename}`);
      } else {
        imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
      }
    }


    const product = new Product({
      name,
      description,
      price,
      discount,
      sellingprice,
      category,
      size,
      brand,
      status,
      colour,
      stock,
      images: imageUrls,
    });


    await product.save();
    const products = await Product.find();
    res.redirect("/admin/productredirection");
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const productredirection = async (req, res) => {
  try {
    const products = await Product.find();
    res.render("admin/product_list.ejs", { products });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const signin = async (req, res) => {
  try {
    req.session.admin = null;
    res.render("admin/adminsignup", { errmessage: "", message: "" });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const dosignin = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const data = await admincollection.find({ email: email });
    if (data.length > 0) {
      if (data[0].password === password) {
        req.session.admin = data[0]._id;
        res.redirect("/admin/");
      } else if (data[0].password !== password) {
        res.render("admin/adminsignup", { errmessage: "incorrect password" });
      }
    } else {
      res.render("admin/adminsignup", { errmessage: "incorrect email" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editproductpage = async (req, res) => {
  try {
    const productId = req.params.id;
    const categories = await CategoryCollection.find();
    const product = await Product.findById(productId).populate("category");
    res.render("admin/editproduct.ejs", { product, categories });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const editproduct = async (req, res) => {
  try {
    const productId = req.body.id;
    const name = req.body.name;
    const description = req.body.description;
    const price = req.body.price;
    const discount = req.body.discount;
    const sellingprice = (price - (discount / 100) * price).toFixed(0);

    const categoryname = req.body.category;
    const categories = await CategoryCollection.find({ name: categoryname });

    const category = categories[0]._id;

    const size = req.body.size;
    const brand = req.body.brand;
    const stock = req.body.stock;
    const colour = req.body.colour;

    const product = await Product.findById(productId);
    let imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
    if (imageUrls.length === 0) {
      imageUrls = product.images;
    }
    if (req.files && req.files.length > 0) {
      let imageUrls = [];

      // Define the desired crop dimensions (width, height)
      const width = 700;
      const height = 600;

      // Handle each file individually
      for (const file of req.files) {
        const filePath = path.join("uploads", file.filename);

        // Check if the file exists before processing
        if (fs.existsSync(filePath)) {
          // Use Sharp to resize and crop the image
          const croppedBuffer = await sharp(filePath)
            .resize(width, height)
            .toBuffer();

          // Save the cropped image
          const croppedFilename = "cropped-" + file.filename;
          const croppedFilePath = path.join("uploads", croppedFilename);
          fs.writeFileSync(croppedFilePath, croppedBuffer);

          imageUrls.push(`/uploads/${croppedFilename}`);
        } else {
          imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
        }
      }
    }
    if (product) {
      await Product.findOneAndUpdate(
        { _id: productId },
        {
          name,
          description,
          price,
          discount,
          sellingprice,
          category,
          size,
          brand,
          stock,
          colour,
          images: imageUrls, // Update the image URLs
        }
      );

      res.redirect("/admin/productredirection");
    } else {
      // Handle product not found error
      res.status(404).send("Product not found.");
    }
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const deleteImage = async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(productId, { $set: { images: [] } });
    res.redirect(`/admin/edit-product/${productId}`);
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const userlist = async (req, res) => {
  try {
    const users = await collection.find();
    res.render("admin/userlist", { users });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const user_block = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await collection.findById(userId);
    if (user.blocked == true) {
      user.blocked = false;
    } else {
      user.blocked = true;
    }
    await user.save();
    res.redirect("/admin/user_list");
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const toaddcategory = async (req, res) => {
  try {
    const category = req.body.name;
    const categorytype = req.body.category;
    const discount_percentage = req.body.category_percentage;
    const valid_from = new Date(req.body.valid_from);
    valid_from.setHours(0, 0, 0, 1);
    const valid_to = new Date(req.body.valid_to);
    valid_to.setHours(23, 59, 59, 999);
    const data = await CategoryCollection.findOne({ name: category });
    if (data) {
      const categories = await CategoryCollection.find();
      const create = true;
      res.render("admin/categorylist", {
        categories,
        errmessage: "Category already exists",
        create,
      });
    } else {
      const newCategory = new CategoryCollection({
        name: category,
        type: categorytype,
        discount_percentage,
        valid_from,
        valid_to,
      });
      await newCategory.save();
      const categories = await CategoryCollection.find();
      const create = true;
      res.redirect("/admin/categoryredirection");
    }
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
  // res.redirect('/admin/categoryredirection')
};

const categoryredirection = async (req, res) => {
  try {
    const categories = await CategoryCollection.find();
    const create = true;
    res.render("admin/categorylist.ejs", {
      categories,
      errmessage: "",
      create,
    });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const category_block = async (req, res) => {
  try {
    const categoryid = req.params.id;
    const category = await CategoryCollection.findById(categoryid);
    if (category.blocked == true) {
      category.blocked = false;
    } else {
      category.blocked = true;
    }
    await category.save();
    res.redirect("/admin/categorylist");
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const editcategorypage = async (req, res) => {
  try {
    const name = req.body.name;
    const id = req.body.editCategoryId;
    const categoryType = req.body.editcategory;
    const discount_percentage = req.body.editcategory_percentage;
    const valid_from = new Date(req.body.editvalid_from);
    valid_from.setHours(0, 0, 0, 1);
    const valid_to = new Date(req.body.editvalid_to);
    valid_to.setHours(23, 59, 59, 999);
    const data = await CategoryCollection.findOne({ name: name });
    {
      await CategoryCollection.findOneAndUpdate(
        { _id: id },
        {
          name: name,
          type: categoryType,
          discount_percentage,
          valid_from,
          valid_to,
        }
      );
      res.redirect("/admin/categorylist");
    }
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const couponlistredirection = async (req, res) => {
  try {
    const Coupon = await CouponCollection.find();
    const create = true;
    res.render("admin/couponlist.ejs", { Coupon, errmessage: "", create });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const addcoupon = async (req, res) => {
  try {
    const coupon_code = req.body.coupon_code;
    const coupon_description = req.body.coupon_description;
    const discount_percentage = req.body.coupon_percentage;
    const min_order = req.body.min_order;
    const max_discount = req.body.max_discount;
    const valid_from = new Date(req.body.valid_from);
    valid_from.setHours(0, 0, 0, 1);
    const valid_to = new Date(req.body.valid_to);
    valid_to.setHours(23, 59, 59, 999);
    const data = await CouponCollection.findOne({ coupon_code: coupon_code });
    if (data) {
      const Coupon = await CouponCollection.find();
      const create = true;
      res.render("admin/couponlist", {
        Coupon,
        errmessage: "Coupon already exists",
        create,
      });
    } else {
      const newCoupon = new CouponCollection({
        coupon_code,
        coupon_description,
        discount_percentage,
        min_order,
        max_discount,
        valid_from,
        valid_to,
      });
      await newCoupon.save();
      res.redirect("/admin/couponlist");
    }
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const updateCoupon = async (req, res) => {
  try {

    const couponId = req.body.editCouponId;
    const coupon_code = req.body.editcoupon_code;
    const coupon_description = req.body.editcoupon_description;
    const discount_percentage = req.body.editcoupon_percentage;
    const min_order = req.body.editmin_order;
    const max_discount = req.body.editmax_discount;
    const valid_from = new Date(req.body.editvalid_from);
    valid_from.setHours(0, 0, 0, 1);
    const valid_to = new Date(req.body.editvalid_to);
    valid_to.setHours(23, 59, 59, 999);
    const data = await CouponCollection.findOne({ coupon_code: coupon_code });
    {
      await CouponCollection.findByIdAndUpdate(couponId, {
        coupon_code,
        coupon_description,
        discount_percentage,
        min_order,
        max_discount,
        valid_from,
        valid_to,
      });
      res.redirect("/admin/couponlist");
    }
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const couponblock = async (req, res) => {
  try {
    const coupon = await CouponCollection.findById(req.params.id);
    if (coupon.blocked == false) {
      await CouponCollection.findByIdAndUpdate(req.params.id, {
        blocked: true,
      });
    } else {
      await CouponCollection.findByIdAndUpdate(req.params.id, {
        blocked: false,
      });
    }
    res.redirect("/admin/couponlist");
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const product_block = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (product.blocked == true) {
      product.blocked = false;
    } else {
      product.blocked = true;
    }
    await product.save();
    res.redirect("/admin/product_list");
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const logout = async (req, res) => {
  try {
    if (req.session.admin) {
      req.session.admin = null;
      res.redirect("/admin/adminsignin");
    }
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const orderManagement = async (req, res) => {
  try {
    const orders = await Orders.find()
      .populate("address")
      .populate("items.product_id")
      .populate("user_id");
    res.render("admin/orderManagement", { orders });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const orderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const orders = await Orders.findById(orderId)
      .populate("address")
      .populate("items.product_id")
      .populate("user_id");
    res.render("admin/orderDetails", { orders });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const changestatus = async (req, res) => {
  try {
    const status = req.params.status;
    const orderId = req.params.id;
    if (status == "delivered") {
      const order = await Orders.findByIdAndUpdate(orderId, {
        order_status: status,
        payment_status: "paid",
      });
    } else if (
      status == "cancel(seller)_defect" ||
      status == "cancel(seller)_incorrect address"
    ) {
      const orders = await Orders.findById(orderId).populate({
        path: "items.product_id",
        model: "productCollection",
      });
      if (orders.payment_method == "Cash On Delivery") {
        await Orders.findByIdAndUpdate(orderId, {
          order_status: status,
          payment_status: "cancelled",
        });
      } else {
        await Orders.findByIdAndUpdate(orderId, {
          order_status: status,
          payment_status: "refunded",
        });
      }
      for (const cartItem of orders.items) {
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
    } else {
      const order = await Orders.findByIdAndUpdate(orderId, {
        order_status: status,
      });
    }
    res.redirect(`/admin/orderDetails/${orderId}`);
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const UpdateOrderByDateForm = async (req, res) => {
  try {
    const startOfDay = new Date(req.body.orderFrom);
    startOfDay.setHours(0, 0, 0, 1);
    const endOfDay = new Date(req.body.orderTo);
    endOfDay.setHours(23, 59, 59, 999);
    const orders = await Orders.find({
      created_on: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("address")
      .populate("items.product_id")
      .populate("user_id");
    req.session.order = orders;
    res.render("admin/salesReport.ejs", { orders });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const salesReport = async (req, res) => {
  try {
    const orders = await Orders.find()
      .populate("address")
      .populate("items.product_id")
      .populate("user_id");
    req.session.order = orders;
    res.render("admin/salesReport.ejs", { orders });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const dailyOrder = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 1);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const orders = await Orders.find({
      created_on: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("address")
      .populate("items.product_id")
      .populate("user_id");
    req.session.order = orders;
    res.render("admin/salesReport.ejs", { orders });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const weeklyOrder = async (req, res) => {
  try {
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(
      now.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1)
    );
    startOfWeek.setHours(0, 0, 0, 1);
    const endOfWeek = new Date(now);
    // Set the end of the week to Sunday (end of the day)
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const orders = await Orders.find({
      created_on: { $gte: startOfWeek, $lte: endOfWeek },
    })
      .populate("address")
      .populate("items.product_id")
      .populate("user_id");
    req.session.order = orders;
    res.render("admin/salesReport.ejs", { orders });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const yearlyOrder = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 1);
    const endOfYear = new Date(currentYear, 12, 31, 23, 59, 59, 999);
    const orders = await Orders.find({
      created_on: { $gte: startOfYear, $lte: endOfYear },
    })
      .populate("address")
      .populate("items.product_id")
      .populate("user_id");
    req.session.order = orders;
    res.render("admin/salesReport.ejs", { orders });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const invoice = async (req, res) => {
  try {
    const orders = req.session.order;
    // console.log("orders:",orders);
    const totalFinalAmount = orders.reduce(
      (total, order) => total + order.finalAmount,
      0
    );
    console.log("totalFinalAmount:",totalFinalAmount);
    res.render("admin/invoice.ejs", { orders, totalFinalAmount });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const referrallist = async (req, res) => {
  try {
    const referrals = await ReferralCollection.find();
    if (referrals.length == 0) {
      const referrals = new ReferralCollection({
        referrer: 0,
        referee: 0,
      });
      await referrals.save();
    }
    const referral = await ReferralCollection.findOne();
    const user = await collection.find();
    res.render("admin/referrallist", { errmessage: "", referral, user });
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

const editreferral = async (req, res) => {
  try {
    const referrer = req.body.referrer;
    const referee = req.body.referee;
    await ReferralCollection.findOneAndUpdate(
      {},
      { $set: { referrer, referee } }
    );
    const referral = await ReferralCollection.find();
    res.redirect("/admin/referrallist");
  } catch (error) {
    console.log(error.message);
    res.render("admin/page404error");
  }
};

module.exports = {
  dashboard,
  addproductpage,
  addproduct,
  productredirection,
  signin,
  dosignin,
  editproductpage,
  userlist,
  user_block,
  toaddcategory,
  categoryredirection,
  category_block,
  editcategorypage,
  product_block,
  editproduct,
  logout,
  orderManagement,
  orderDetails,
  changestatus,
  salesReport,
  dailyOrder,
  weeklyOrder,
  yearlyOrder,
  deleteImage,
  couponlistredirection,
  addcoupon,
  updateCoupon,
  couponblock,
  UpdateOrderByDateForm,
  referrallist,
  editreferral,
  invoice,
};
