const mongoose = require("mongoose");

const CATEGORIES = [
  "jdm-legends",
  "motorsport",
  "hypercars",
  "muscle-cars",
  "suvs"
];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    brand: {
      type: String,
      required: true
    },
    scale: {
      type: String,
      enum: ["1:64", "1:32", "1:18"],
      required: true
    },
    category: {
      type: String,
      enum: [...CATEGORIES, ""],
      default: ""
    },
    price: {
      type: Number,
      required: true
    },
    image: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" }
    },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true }
      }
    ],
    stock: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      default: ""
    },
    isBestSeller: {
      type: Boolean,
      default: false
    },
    isNewArrival: {
      type: Boolean,
      default: false
    },
    isLimitedEdition: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      default: 0
    },
    numReviews: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

productSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model("Product", productSchema);
