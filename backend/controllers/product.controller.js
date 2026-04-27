const Product = require("../models/Product");

// GET ALL PRODUCTS (with optional scale filter)
exports.getProducts = async (req, res) => {
  try {
    const { scale } = req.query;

    let filter = {};
    if (scale) {
      // ✅ Validate scale value
      const validScales = ["1:64", "1:32", "1:18"];
      if (!validScales.includes(scale)) {
        return res.status(400).json({ message: "Invalid scale. Use 1:64, 1:32, or 1:18" });
      }
      filter.scale = scale;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    console.error("Get products error:", error.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// GET SINGLE PRODUCT
exports.getProductById = async (req, res) => {
  try {
    // ✅ FIXED: Validate MongoDB ID format
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Get product error:", error.message);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// CREATE PRODUCT
exports.createProduct = async (req, res) => {
  try {
    const { name, brand, scale, price, image, stock, description } = req.body;

    // ✅ FIXED: Added input validation
    if (!name || !brand || !scale || !price) {
      return res.status(400).json({ message: "Name, brand, scale and price are required" });
    }

    // Validate scale
    const validScales = ["1:64", "1:32", "1:18"];
    if (!validScales.includes(scale)) {
      return res.status(400).json({ message: "Invalid scale. Use 1:64, 1:32, or 1:18" });
    }

    // Validate price
    if (price <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }

    const product = await Product.create({
      name,
      brand,
      scale,
      price,
      image: image || "",
      stock: stock || 0,
      description: description || ""
    });

    res.status(201).json({
      message: "Product created successfully",
      product
    });
  } catch (error) {
    console.error("Create product error:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// SEARCH PRODUCTS
exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.q;

    // ✅ FIXED: Return empty array with message if no query
    if (!query || query.trim() === "") {
      return res.json({
        count: 0,
        products: [],
        message: "Please provide a search term"
      });
    }

    const keyword = query.trim();

    const products = await Product.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { brand: { $regex: keyword, $options: "i" } },
        { scale: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      count: products.length,
      products,
      query: keyword
    });
  } catch (error) {
    console.error("Search error:", error.message);
    res.status(500).json({ message: "Search failed" });
  }
};