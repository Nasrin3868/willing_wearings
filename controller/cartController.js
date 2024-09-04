const collection = require("../model/mongodb");
const Products = require("../model/productmodel");
const CategoryCollection = require("../model/categorymodel");

const doCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Products.findById(productId);

    const userId = req.session.user._id;
    const user = await collection.findOne({ _id: userId });
    const existingCartItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingCartItem) {
      if (product.stock > existingCartItem.quantity) {
        existingCartItem.quantity++;
      } else {
        existingCartItem.quantity = existingCartItem.quantity;
      }
    } else {
      if (product.stock == 0) {
        user.cart.push({
          product: productId,
          quantity: 0,
        });
      } else {
        user.cart.push({
          product: productId,
          quantity: 1,
        });
      }
    }
    await user.save();
    const userdata = await collection.findById(userId).populate("cart.product");
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const productQuantityUpdate = async (req, res) => {
  try {

    if (req.session.user) {
      const userId = req.session.user._id;
      const cartItem = req.body;
      const user = await collection.findOne({ _id: userId });
      const CartItem = user.cart.find(
        (item) => item.product.toString() === cartItem
      );

      if (CartItem) {
        CartItem.quantity++;
        await user.save();
        const msg = "Product updated successfully";
        return res.json({ msg });
      } else {
        const msg = "Product not updated";
        return res.json({ msg });
      }
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const cartUpdate = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { productid, quantity, total } = req.body;
    const user = await collection.findOne({ _id: userId });
    const CartItem = user.cart.find(
      (item) => item.product.toString() === productid
    );
    CartItem.quantity = quantity;
    let cartSubtotal = 0;
    user.cart.forEach((cartItem) => {
      cartSubtotal += cartItem.product.sellingprice * cartItem.quantity;
    });
    await user.save();
    return res.status(200).json({ message: "Cart updated successfully" });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const calculateCartSubtotal = (user) => {
  try {
    let cartSubtotal = 0;
    user.cart.forEach((cartItem) => {
      cartSubtotal += cartItem.product.sellingprice * cartItem.quantity;
    });
    return cartSubtotal;
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const calculateCartTotal = (user) => {
  try {
    let cartTotal = 0;
    user.cart.forEach((cartItem) => {
      cartTotal += cartItem.product.price * cartItem.quantity;
    });
    return cartTotal;
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const cart = async (req, res) => {
  try {
    discount = "";
    coupon_code = "";
    const userId = req.session.user._id;
    const user = await collection.findById(userId).populate("cart.product");
    const categories = await CategoryCollection.find({ blocked: false });

    // Calculate the cart subtotal using calculateCartSubtotal function
    const cartSubtotal = calculateCartSubtotal(user);
    res.render("user/cart", {
      isAuthenticated: true,
      categories,
      userdata: user,
      cartSubtotal: cartSubtotal,
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const quantityIncrease = async (req, res) => {
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
      } else {
        existingCartItem.quantity = existingCartItem.quantity;
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
      }
    }
    await user.save();
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

const cartproductdelete = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user._id;
    const user = await collection.findOne({ _id: userId });
    const productIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );
    user.cart.splice(productIndex, 1);
    await user.save();
    res.redirect("/cart");
  } catch (error) {
    console.log(error.message);
    res.render("user/page404error")
  }
};

module.exports = {
  productQuantityUpdate,
  cartUpdate,
  doCart,
  calculateCartSubtotal,
  calculateCartTotal,
  cartproductdelete,
  cart,
  quantityIncrease,
};
