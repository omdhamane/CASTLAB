const Review = require("../models/Review");
const Product = require("../models/Product");

// Helper to update product rating
const updateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });
  const numReviews = reviews.length;
  
  let rating = 0;
  if (numReviews > 0) {
    const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
    rating = totalRating / numReviews;
  }

  await Product.findByIdAndUpdate(productId, { rating, numReviews });
};

// @desc    Create new review
// @route   POST /api/reviews/:productId
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      product: productId,
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: "Product already reviewed by you" });
    }

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating: Number(rating),
      comment,
    });

    await updateProductRating(productId);

    res.status(201).json({ message: "Review added", review });
  } catch (error) {
    console.error("Create review error:", error.message);
    res.status(500).json({ message: "Server error creating review" });
  }
};

// @desc    Get all reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
exports.getReviewsForProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "name")
      .sort("-createdAt");
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Get reviews error:", error.message);
    res.status(500).json({ message: "Server error fetching reviews" });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Only review author or admin can delete
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(401).json({ message: "User not authorized" });
    }

    const productId = review.product;
    await review.deleteOne();
    await updateProductRating(productId);

    res.status(200).json({ message: "Review removed" });
  } catch (error) {
    console.error("Delete review error:", error.message);
    res.status(500).json({ message: "Server error deleting review" });
  }
};

// @desc    Vote review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
exports.voteHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.helpfulVotes += 1;
    await review.save();

    res.status(200).json({ message: "Vote recorded", helpfulVotes: review.helpfulVotes });
  } catch (error) {
    console.error("Vote helpful error:", error.message);
    res.status(500).json({ message: "Server error voting" });
  }
};
