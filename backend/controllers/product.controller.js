const Product = require("../models/Product");

// GET ALL PRODUCTS (with optional scale filter)
exports.getProducts = async (req, res) => {
  try {
    const { scale } = req.query;

    let filter = {};
    if (scale) {
      filter.scale = scale;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE PRODUCT
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE PRODUCT (TEMP — ADMIN LATER)
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.json({
        count: 0,
        products: []
      });
    }

    const keyword = query.toLowerCase();

    // MongoDB search (LIKE Amazon style)
    const products = await Product.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { brand: { $regex: keyword, $options: "i" } },
        { scale: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } }
      ]
    });

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
};
