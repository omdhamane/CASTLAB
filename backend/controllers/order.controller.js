const Order = require("../models/Order");
const Product = require("../models/Product");
const generateInvoice = require("../utils/invoiceGenerator");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    // ✅ FIXED: Validate items exist
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must have at least one item" });
    }

    let totalAmount = 0;
    let populatedItems = [];
    let errors = [];

    for (let item of items) {
      // ✅ FIXED: Validate each item has productId and quantity
      if (!item.productId || !item.quantity) {
        errors.push("Each item must have productId and quantity");
        continue;
      }

      // ✅ FIXED: Validate MongoDB ID
      if (!item.productId.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push(`Invalid product ID: ${item.productId}`);
        continue;
      }

      const product = await Product.findById(item.productId);

      // ✅ FIXED: Better product not found handling
      if (!product) {
        errors.push(`Product not found: ${item.productId}`);
        continue;
      }

      // ✅ FIXED: Check stock availability
      if (product.stock < item.quantity) {
        errors.push(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        continue;
      }

      // ✅ FIXED: Validate quantity is positive
      if (item.quantity <= 0) {
        errors.push(`Quantity must be greater than 0 for ${product.name}`);
        continue;
      }

      totalAmount += product.price * item.quantity;

      populatedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Return errors if any items failed
    if (errors.length > 0) {
      return res.status(400).json({ message: "Order issues found", errors });
    }

    if (populatedItems.length === 0) {
      return res.status(400).json({ message: "No valid items in order" });
    }

    // Create order
    const order = await Order.create({
      user: req.user,
      items: populatedItems,
      totalAmount
    });

    // ✅ FIXED: Update stock after order
    for (let item of populatedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // ✅ FIXED: Populate order before generating invoice
    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.product", "name price brand scale");

    // Generate invoice
    let invoicePath = null;
    try {
      invoicePath = await generateInvoice(populatedOrder);
    } catch (invoiceError) {
      console.error("Invoice generation failed:", invoiceError.message);
      // Don't fail the order if invoice fails
    }

    res.status(201).json({
      message: "Order placed successfully ✅",
      order: {
        id: order._id,
        totalAmount: order.totalAmount,
        status: order.status,
        items: populatedOrder.items
      },
      invoice: invoicePath
    });
  } catch (error) {
    console.error("Create order error:", error.message);
    res.status(500).json({ message: error.message });
  }
};