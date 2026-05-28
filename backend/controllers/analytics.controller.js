const Order = require("../models/Order");
const Product = require("../models/Product");

// GET DASHBOARD ANALYTICS REPORT
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total Revenue (Sum of totalAmount)
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // 2. Total Orders count
    const totalOrders = await Order.countDocuments({});

    // 3. Best-Selling Models (Top 5 products by quantity sold)
    const bestSellers = await Order.aggregate([
      { $unwind: "$items" },
      { 
        $group: { 
          _id: "$items.product", 
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        } 
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          name: "$product.name",
          brand: "$product.brand",
          scale: "$product.scale",
          price: "$product.price",
          totalSold: 1,
          revenue: 1
        }
      }
    ]);

    // 4. Most Wishlisted Product (Top 1 by wishlistCount)
    const mostWishlisted = await Product.findOne({})
      .sort({ wishlistCount: -1, rating: -1 })
      .select("name brand scale wishlistCount price");

    // 5. Scale Distribution (Sales count per scale)
    const scaleSales = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.scale",
          totalSold: { $sum: "$items.quantity" }
        }
      },
      { $sort: { totalSold: -1 } }
    ]);

    // Dynamic Popular Scale
    const popularScale = scaleSales[0]?._id || "1:64";

    // 6. Monthly Revenue (for chart)
    const monthlyRevenue = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 }
    ]);

    // Format monthlyRevenue for frontend consumption
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedMonthlyStats = monthlyRevenue.map(item => {
      return {
        label: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        revenue: item.revenue,
        orders: item.count
      };
    });

    // 7. Top-Selling Brands (sales count per brand)
    const brandSales = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.brand",
          totalSold: { $sum: "$items.quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // 8. Recent Orders
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email");

    // 9. Top Customers (by total spend)
    const topCustomers = await Order.aggregate([
      {
        $group: {
          _id: "$user",
          totalSpent: { $sum: "$totalAmount" },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          name: "$user.name",
          email: "$user.email",
          totalSpent: 1,
          ordersCount: 1
        }
      }
    ]);

    res.json({
      metrics: {
        totalRevenue,
        totalOrders,
        mostWishlisted,
        popularScale
      },
      charts: {
        monthlyRevenue: formattedMonthlyStats,
        scaleSales: scaleSales.map(s => ({ scale: s._id, count: s.totalSold })),
        brandSales: brandSales.map(b => ({ brand: b._id, count: b.totalSold }))
      },
      bestSellers,
      recentOrders: recentOrders.map(o => ({
        id: o._id,
        user: o.user ? { name: o.user.name, email: o.user.email } : { name: "Guest", email: "N/A" },
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt
      })),
      topCustomers
    });

  } catch (error) {
    console.error("Dashboard stats aggregation error:", error.message);
    res.status(500).json({ message: "Failed to generate analytics dashboard statistics" });
  }
};
