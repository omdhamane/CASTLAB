const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");

const {
  createReview,
  getReviewsForProduct,
  deleteReview,
  voteHelpful
} = require("../controllers/review.controller");

// Product specific reviews
router.route("/:productId")
  .get(getReviewsForProduct)
  .post(protect, createReview);

// Specific review actions
router.route("/:id")
  .delete(protect, deleteReview);

router.route("/:id/helpful")
  .put(protect, voteHelpful);

module.exports = router;
