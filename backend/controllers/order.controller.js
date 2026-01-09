const Order = require("../models/Order");
const Product = require("../models/Product");
const generateInvoice = require("../utils/invoiceGenerator");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    let totalAmount = 0;
    let populatedItems = [];

    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      totalAmount += product.price * item.quantity;

      populatedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    const order = await Order.create({
      user: req.user,
      items: populatedItems,
      totalAmount
    });

    const invoicePath = await generateInvoice(order);

    res.status(201).json({
      message: "Order placed successfully",
      invoice: invoicePath
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
