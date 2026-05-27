const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");

const VALID_SCALES = ["1:64", "1:32", "1:18"];
const VALID_CATEGORIES = Product.CATEGORIES || [
  "jdm-legends",
  "motorsport",
  "hypercars",
  "muscle-cars",
  "suvs"
];
const VALID_FEATURED = ["best-seller", "new-arrival", "limited"];

// GET ALL PRODUCTS (scale, category, featured filters)
exports.getProducts = async (req, res) => {
  try {
    const { scale, category, featured } = req.query;

    let filter = {};

    if (scale) {
      if (!VALID_SCALES.includes(scale)) {
        return res.status(400).json({ message: "Invalid scale. Use 1:64, 1:32, or 1:18" });
      }
      filter.scale = scale;
    }

    if (category) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      filter.category = category;
    }

    if (featured) {
      if (!VALID_FEATURED.includes(featured)) {
        return res.status(400).json({ message: "Invalid featured type" });
      }
      if (featured === "best-seller") filter.isBestSeller = true;
      if (featured === "new-arrival") filter.isNewArrival = true;
      if (featured === "limited") filter.isLimitedEdition = true;
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
    const {
      name,
      brand,
      scale,
      price,
      images,
      stock,
      description,
      category,
      isBestSeller,
      isNewArrival,
      isLimitedEdition
    } = req.body;

    if (!name || !brand || !scale || !price) {
      return res.status(400).json({ message: "Name, brand, scale and price are required" });
    }

    if (!VALID_SCALES.includes(scale)) {
      return res.status(400).json({ message: "Invalid scale. Use 1:64, 1:32, or 1:18" });
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    if (price <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }

    // Determine the product image from file upload or JSON body
    let productImage = { url: "", public_id: "" };
    if (req.file) {
      productImage = {
        url: req.file.path,
        public_id: req.file.filename
      };
    } else if (req.body.image) {
      productImage = typeof req.body.image === "string" 
        ? { url: req.body.image, public_id: "" }
        : req.body.image;
    }

    // Setup fallback images array
    let productImages = [];
    if (productImage.url) {
      productImages.push(productImage);
    }
    if (images && Array.isArray(images)) {
      productImages = [...productImages, ...images];
    }

    const product = await Product.create({
      name,
      brand,
      scale,
      price,
      image: productImage,
      images: productImages,
      stock: stock || 0,
      description: description || "",
      category: category || "",
      isBestSeller: Boolean(isBestSeller),
      isNewArrival: Boolean(isNewArrival),
      isLimitedEdition: Boolean(isLimitedEdition)
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

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const fields = [
      "name",
      "brand",
      "scale",
      "price",
      "stock",
      "description",
      "category",
      "isBestSeller",
      "isNewArrival",
      "isLimitedEdition"
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "isBestSeller" || field === "isNewArrival" || field === "isLimitedEdition") {
          product[field] = Boolean(req.body[field]);
        } else if (field === "stock" || field === "price") {
          product[field] = Number(req.body[field]);
        } else {
          product[field] = req.body[field];
        }
      }
    });

    if (req.body.scale && !VALID_SCALES.includes(req.body.scale)) {
      return res.status(400).json({ message: "Invalid scale" });
    }

    if (req.body.category && !VALID_CATEGORIES.includes(req.body.category) && req.body.category !== "") {
      return res.status(400).json({ message: "Invalid category" });
    }

    // Handle direct image file upload replacement
    if (req.file) {
      // 1. Delete old main image if it exists in Cloudinary
      if (product.image && product.image.public_id) {
        try {
          await cloudinary.uploader.destroy(product.image.public_id);
        } catch (err) {
          console.error("Cloudinary delete error:", err.message);
        }
      }
      // 2. Set new main image
      product.image = {
        url: req.file.path,
        public_id: req.file.filename
      };
      // 3. Keep images array aligned
      product.images = [product.image];

    } else if (req.body.image !== undefined) {
      // Handle JSON body update for image
      const newImage = typeof req.body.image === "string"
        ? { url: req.body.image, public_id: "" }
        : req.body.image;

      if (newImage && newImage.url && product.image && product.image.public_id && product.image.public_id !== newImage.public_id) {
        try {
          await cloudinary.uploader.destroy(product.image.public_id);
        } catch (err) {
          console.error("Cloudinary delete error:", err.message);
        }
      }
      product.image = newImage;
    }

    if (req.body.images !== undefined) {
      product.images = req.body.images;
    }

    await product.save();

    res.json({ message: "Product updated", product });
  } catch (error) {
    console.error("Update product error:", error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 1. Delete main image from Cloudinary
    if (product.image && product.image.public_id) {
      try {
        await cloudinary.uploader.destroy(product.image.public_id);
      } catch (err) {
        console.error("Cloudinary delete error:", err.message);
      }
    }

    // 2. Delete all supplementary images in the images array from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.public_id && img.public_id !== product.image?.public_id) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
          } catch (err) {
            console.error("Cloudinary delete error:", err.message);
          }
        }
      }
    }

    await Product.findByIdAndDelete(id);

    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete product error:", error.message);
    res.status(500).json({ message: "Failed to delete product" });
  }
};