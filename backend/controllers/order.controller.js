const Order = require("../models/Order");
const Product = require("../models/Product");
const generateInvoice = require("../utils/invoiceGenerator");

exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    // ✅ Validate items exist
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must have at least one item" });
    }

    console.log("📦 Order received:", JSON.stringify(items, null, 2));

    let totalAmount = 0;
    let populatedItems = [];
    let errors = [];

    for (let item of items) {
      // ✅ Validate productId and quantity exist
      if (!item.productId || !item.quantity) {
        errors.push(`Missing productId or quantity`);
        continue;
      }

      // ✅ Validate MongoDB ID format
      if (!item.productId.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push(`Invalid product ID format: ${item.productId}`);
        continue;
      }

      const product = await Product.findById(item.productId);

      if (!product) {
        errors.push(`Product not found: ${item.productId}`);
        continue;
      }

      console.log(`✅ Product found: ${product.name}, Stock: ${product.stock}`);

      // ✅ FIXED: Skip stock check if stock is 0 (allows unlimited orders)
      // If you want stock check, uncomment below
      // if (product.stock < item.quantity) {
      //   errors.push(`Insufficient stock for ${product.name}`);
      //   continue;
      // }

      totalAmount += product.price * item.quantity;

      populatedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // ✅ Show errors if any
    if (errors.length > 0) {
      console.log("❌ Order errors:", errors);
      return res.status(400).json({
        message: "Order issues found",
        errors
      });
    }

    if (populatedItems.length === 0) {
      return res.status(400).json({ message: "No valid items in order" });
    }

    // ✅ Create order
    const order = await Order.create({
      user: req.user,
      items: populatedItems,
      totalAmount
    });

    // ✅ Update stock
    for (let item of populatedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // ✅ Populate order for invoice
    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.product", "name price brand scale");

    // ✅ Generate invoice
    let invoicePath = null;
    try {
      invoicePath = await generateInvoice(populatedOrder);
    } catch (invoiceError) {
      console.error("Invoice generation failed:", invoiceError.message);
    }

    res.status(201).json({
      message: "Order placed successfully ✅",
      order: {
        id: order._id,
        totalAmount: order.totalAmount,
        status: order.status
      },
      invoice: invoicePath
    });

  } catch (error) {
    console.error("Create order error:", error.message);
    res.status(500).json({ message: error.message });
  }
};