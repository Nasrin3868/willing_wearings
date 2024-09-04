const collection = require("../model/mongodb");
const Products = require("../model/productmodel");
const CategoryCollection = require("../model/categorymodel");

const searchProducts = async (req, res) => {
  try {
    const searchname = req.body.search;
    res.redirect(`/searchCategory?searchname=${searchname}`);
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const searchProduct = async (req, res) => {
  try {
    const name = req.query.searchname;
    // const name = req.query.name;
    const regex = new RegExp(`^${name}`, "i");
    const products = await Products.find({ name: { $regex: regex } });
    const categories = await CategoryCollection.find({ blocked: false });
    if (req.query.range) {
      if (req.query.range == "high") {
        products.sort((a, b) => b.sellingprice - a.sellingprice);
      } else if (req.query.range == "low") {
        products.sort((a, b) => a.sellingprice - b.sellingprice);
      }
    }
    if (req.session.user) {
      const user = await collection
        .findById(req.session.user)
        .populate("cart.product");
      res.render("user/searchProduct", {
        isAuthenticated: true,
        products,
        categories,
        user,
        value: "all",
        name,
      });
    } else {
      res.render("user/searchProduct", {
        isAuthenticated: false,
        products,
        categories,
        user: "",
        value: "all",
        name,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const allpage = async (req, res) => {
  try {
    discount = "";
    coupon_code = "";
    const categories = await CategoryCollection.find({ blocked: false });
    const products = await Products.find({ blocked: false });
    if (req.query.range) {
      if (req.query.range == "high") {
        products.sort((a, b) => b.sellingprice - a.sellingprice);
      } else if (req.query.range == "low") {
        products.sort((a, b) => a.sellingprice - b.sellingprice);
      }
    }
    if (req.session.user) {
      const user = await collection
        .findById(req.session.user)
        .populate("cart.product");
      res.render("user/all", {
        isAuthenticated: true,
        products,
        categories,
        user,
        value: "all",
      });
    } else {
      res.render("user/all", {
        isAuthenticated: false,
        products,
        categories,
        user: "",
        value: "all",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const showbycategory = async (req, res) => {
  try {
    const categoryname = req.params.name;
    const category = await CategoryCollection.findOne({
      name: categoryname,
      blocked: false,
    });
    const categoryId = category._id;
    const products = await Products.find({
      blocked: false,
      category: categoryId,
    });
    const categories = await CategoryCollection.find({ blocked: false });
    if (req.query.range) {
      if (req.query.range == "high") {
        products.sort((a, b) => b.sellingprice - a.sellingprice);
      } else if (req.query.range == "low") {
        products.sort((a, b) => a.sellingprice - b.sellingprice);
      }
    }
    if (req.session.user) {
      const user = await collection
        .findById(req.session.user)
        .populate("cart.product");
      res.render("user/all", {
        isAuthenticated: true,
        products,
        categories,
        user,
        value: "all_cat",
        categoryname,
      });
    } else {
      res.render("user/all", {
        isAuthenticated: false,
        products,
        categories,
        user: "",
        value: "all_cat",
        categoryname,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const ethinicpage = async (req, res) => {
  try {
    discount = "";
    coupon_code = "";
    const type = "Ethinic"; // Change 'dress' to 'type'
    const categories = await CategoryCollection.find({ blocked: false, type });
    const categoryIds = categories.map((category) => category._id);
    const products = await Products.find({
      blocked: false,
      category: { $in: categoryIds },
    });
    if (req.query.range) {
      if (req.query.range == "high") {
        products.sort((a, b) => b.sellingprice - a.sellingprice);
      } else if (req.query.range == "low") {
        products.sort((a, b) => a.sellingprice - b.sellingprice);
      }
    }
    if (req.session.user) {
      const user = await collection
        .findById(req.session.user)
        .populate("cart.product");
      res.render("user/ethinic", {
        isAuthenticated: true,
        products,
        categories,
        user,
        value: "all",
      });
    } else {
      res.render("user/ethinic", {
        isAuthenticated: false,
        products,
        categories,
        user: "",
        value: "all",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const ethinicshowbycategory = async (req, res) => {
  try {
    const categoryname = req.params.name;
    const type = "Ethinic";
    const category = await CategoryCollection.findOne({
      name: categoryname,
      type,
      blocked: false,
    });
    const categoryId = category._id;
    const products = await Products.find({
      blocked: false,
      category: categoryId,
      type,
    });
    const categories = await CategoryCollection.find({ blocked: false, type });
    if (req.query.range) {
      if (req.query.range == "high") {
        products.sort((a, b) => b.sellingprice - a.sellingprice);
      } else if (req.query.range == "low") {
        products.sort((a, b) => a.sellingprice - b.sellingprice);
      }
    }
    if (req.session.user) {
      const user = await collection
        .findById(req.session.user)
        .populate("cart.product");
      res.render("user/ethinic", {
        isAuthenticated: true,
        products,
        categories,
        user,
        categoryname,
        value: "all_cat",
      });
    } else {
      res.render("user/ethinic", {
        isAuthenticated: false,
        products,
        categories,
        user: "",
        categoryname,
        value: "all_cat",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const westernpage = async (req, res) => {
  try {
    discount = "";
    coupon_code = "";
    const type = "Western"; // Change 'dress' to 'type'
    const categories = await CategoryCollection.find({ blocked: false, type });
    const categoryIds = categories.map((category) => category._id);
    const products = await Products.find({
      blocked: false,
      category: { $in: categoryIds },
    });
    if (req.query.range) {
      if (req.query.range == "high") {
        products.sort((a, b) => b.sellingprice - a.sellingprice);
      } else if (req.query.range == "low") {
        products.sort((a, b) => a.sellingprice - b.sellingprice);
      }
    }
    if (req.session.user) {
      const user = await collection
        .findById(req.session.user)
        .populate("cart.product");
      res.render("user/western", {
        isAuthenticated: true,
        products,
        categories,
        user,
        value: "all",
      });
    } else {
      res.render("user/western", {
        isAuthenticated: false,
        products,
        categories,
        user: "",
        value: "all",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const westernshowbycategory = async (req, res) => {
  try {
    const categoryname = req.params.name;
    const type = "Western";
    const category = await CategoryCollection.findOne({
      name: categoryname,
      type,
      blocked: false,
    });
    const categoryId = category._id;
    const products = await Products.find({
      blocked: false,
      category: categoryId,
      type,
    });
    const categories = await CategoryCollection.find({ blocked: false, type });
    if (req.query.range) {
      if (req.query.range == "high") {
        products.sort((a, b) => b.sellingprice - a.sellingprice);
      } else if (req.query.range == "low") {
        products.sort((a, b) => a.sellingprice - b.sellingprice);
      }
    }
    if (req.session.user) {
      const user = await collection
        .findById(req.session.user)
        .populate("cart.product");
      res.render("user/western", {
        isAuthenticated: true,
        products,
        categories,
        user,
        categoryname,
        value: "all_cat",
      });
    } else {
      const isAuthenticated = false;
      res.render("user/western", {
        isAuthenticated: false,
        products,
        categories,
        user: "",
        categoryname,
        value: "all_cat",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const sportspage = async (req, res) => {
  try {
    discount = "";
    coupon_code = "";
    const type = "Sports"; // Change 'dress' to 'type'
    const categories = await CategoryCollection.find({ blocked: false, type });
    const categoryIds = categories.map((category) => category._id);
    const products = await Products.find({
      blocked: false,
      category: { $in: categoryIds },
    });
    if (req.query.range) {
      if (req.query.range == "high") {
        products.sort((a, b) => b.sellingprice - a.sellingprice);
      } else if (req.query.range == "low") {
        products.sort((a, b) => a.sellingprice - b.sellingprice);
      }
    }
    if (req.session.user) {
      const user = await collection
        .findById(req.session.user)
        .populate("cart.product");
      res.render("user/sports", {
        isAuthenticated: true,
        products,
        categories,
        user,
        value: "all",
      });
    } else {
      const isAuthenticated = false;
      res.render("user/sports", {
        isAuthenticated: false,
        products,
        categories,
        user: "",
        value: "all",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const Sportsshowbycategory = async (req, res) => {
  try {
    const categoryname = req.params.name;
    const type = "Sports";
    const category = await CategoryCollection.findOne({
      name: categoryname,
      type,
      blocked: false,
    });
    const categoryId = category._id;
    const products = await Products.find({
      blocked: false,
      category: categoryId,
      type,
    });
    const categories = await CategoryCollection.find({ blocked: false, type });
    if (req.query.range) {
      if (req.query.range == "high") {
        products.sort((a, b) => b.sellingprice - a.sellingprice);
      } else if (req.query.range == "low") {
        products.sort((a, b) => a.sellingprice - b.sellingprice);
      }
    }
    if (req.session.user) {
      const user = await collection
        .findById(req.session.user)
        .populate("cart.product");
      res.render("user/sports", {
        isAuthenticated: true,
        products,
        categories,
        user,
        categoryname,
        value: "all_cat",
      });
    } else {
      res.render("user/sports", {
        isAuthenticated: false,
        products,
        categories,
        user: "",
        categoryname,
        value: "all_cat",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const productview = async (req, res) => {
  try {
    if (req.session.user) {
      const id = req.params.id;
      const isAuthenticated = true;
      const categories = await CategoryCollection.find({ blocked: false });
      const product = await Products.findOne({ _id: id })
      const user = await collection
        .findById(req.session.user._id)
        .populate("wishlist")
        .populate("cart.product");
      res.render("user/productview", {
        isAuthenticated,
        product,
        categories,
        user,
      });
    } else {
      const isAuthenticated = false;
      const id = req.params.id;
      const categories = await CategoryCollection.find({ blocked: false });
      const product = await Products.findOne({ _id: id }).populate("category");
      res.render("user/productview", {
        isAuthenticated,
        product,
        categories,
        user: "",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

module.exports = {
  allpage,
  showbycategory,
  ethinicpage,
  ethinicshowbycategory,
  westernpage,
  westernshowbycategory,
  sportspage,
  Sportsshowbycategory,
  productview,
  searchProducts,
  searchProduct,
};
