require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const products = [
  // ===== 1:64 SCALE =====
  {
    name: "Ferrari F40",
    brand: "Bburago",
    scale: "1:64",
    price: 1299,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 50,
    description: "Classic Ferrari F40 Diecast Model"
  },
  {
    name: "Lamborghini Aventador",
    brand: "Maisto",
    scale: "1:64",
    price: 1499,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 30,
    description: "Lamborghini Aventador SVJ Diecast"
  },
  {
    name: "Porsche 911 GT3",
    brand: "Hot Wheels",
    scale: "1:64",
    price: 899,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 100,
    description: "Porsche 911 GT3 RS Diecast"
  },
  {
    name: "BMW M3 Competition",
    brand: "Maisto",
    scale: "1:64",
    price: 1199,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 40,
    description: "BMW M3 Competition Diecast"
  },
  {
    name: "Ford Mustang GT500",
    brand: "Hot Wheels",
    scale: "1:64",
    price: 799,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 60,
    description: "Shelby GT500 Mustang Diecast"
  },

  // ===== 1:32 SCALE =====
  {
    name: "Mercedes AMG GT",
    brand: "Bburago",
    scale: "1:32",
    price: 2499,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 25,
    description: "Mercedes AMG GT Black Series"
  },
  {
    name: "Nissan GT-R R35",
    brand: "AutoArt",
    scale: "1:32",
    price: 3299,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 20,
    description: "Nissan GT-R Nismo Diecast"
  },
  {
    name: "Audi R8 V10",
    brand: "Maisto",
    scale: "1:32",
    price: 2799,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 35,
    description: "Audi R8 V10 Plus Diecast"
  },
  {
    name: "McLaren 720S",
    brand: "Bburago",
    scale: "1:32",
    price: 3499,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 15,
    description: "McLaren 720S Spider Diecast"
  },
  {
    name: "Dodge Challenger SRT",
    brand: "Maisto",
    scale: "1:32",
    price: 2199,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 45,
    description: "Dodge Challenger SRT Hellcat"
  },

  // ===== 1:18 SCALE =====
  {
    name: "Ferrari 488 GTB",
    brand: "Bburago",
    scale: "1:18",
    price: 6999,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 10,
    description: "Ferrari 488 GTB Premium Diecast"
  },
  {
    name: "Lamborghini Huracan",
    brand: "AutoArt",
    scale: "1:18",
    price: 8999,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 8,
    description: "Lamborghini Huracan Performante"
  },
  {
    name: "Porsche 918 Spyder",
    brand: "Maisto",
    scale: "1:18",
    price: 7499,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 12,
    description: "Porsche 918 Spyder Hybrid Diecast"
  },
  {
    name: "BMW M5 Competition",
    brand: "Norev",
    scale: "1:18",
    price: 9999,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 6,
    description: "BMW M5 Competition Premium Model"
  },
  {
    name: "Ford GT 2022",
    brand: "AutoArt",
    scale: "1:18",
    price: 12999,
    image: "https://i.imgur.com/placeholder.jpg",
    stock: 5,
    description: "Ford GT Heritage Edition Diecast"
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // ✅ Clear existing products
    await Product.deleteMany({});
    console.log("🗑️ Cleared existing products");

    // ✅ Insert all products
    const inserted = await Product.insertMany(products);
    console.log(`✅ Added ${inserted.length} products successfully`);

    // ✅ Show inserted products
    inserted.forEach(p => {
      console.log(`   → ${p.name} (${p.scale}) ₹${p.price}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
};

seedDB();