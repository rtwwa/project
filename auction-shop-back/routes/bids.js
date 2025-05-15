const express = require("express");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

const router = express.Router();

// Get user's active bids
router.get("/active", auth, async (req, res) => {
  try {
    const products = await Product.find({
      "bids.bidder": req.user._id,
      status: "active",
    })
      .populate("seller", "name")
      .sort({ endTime: 1 });

    res.json(products);
  } catch (error) {
    res.status(400).json({ message: "Ошибка при получении активных ставок" });
  }
});

// Get user's won auctions
router.get("/won", auth, async (req, res) => {
  try {
    const products = await Product.find({
      winner: req.user._id,
      status: { $in: ["ended", "sold"] },
    })
      .populate("seller", "name")
      .sort({ endTime: -1 });

    res.json(products);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Ошибка при получении выигранных аукционов" });
  }
});

// Get bid history for a product
router.get("/history/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate("bids.bidder", "name")
      .select("bids");

    if (!product) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    const bids = product.bids.sort((a, b) => b.timestamp - a.timestamp);
    res.json(bids);
  } catch (error) {
    res.status(400).json({ message: "Ошибка при получении истории ставок" });
  }
});

// Create a new bid
router.post("/:productId", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    // Проверки
    if (product.status !== "active") {
      return res.status(400).json({ message: "Аукцион завершен" });
    }
    if (product.seller.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Вы не можете делать ставки на свой товар" });
    }
    if (new Date(product.endTime) < new Date()) {
      return res.status(400).json({ message: "Время аукциона истекло" });
    }
    if (req.body.amount <= product.currentPrice) {
      return res
        .status(400)
        .json({ message: "Ставка должна быть выше текущей цены" });
    }

    // Создаем ставку
    product.bids.push({
      bidder: req.user._id,
      amount: req.body.amount,
      timestamp: new Date(),
    });
    product.currentPrice = req.body.amount;

    await product.save();

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: "Ошибка при создании ставки" });
  }
});

module.exports = router;
