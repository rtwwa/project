const express = require("express");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all products with filters
router.get("/", async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      status,
      search,
      sort = "endTime",
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (minPrice || maxPrice) {
      query.currentPrice = {};
      if (minPrice) query.currentPrice.$gte = Number(minPrice);
      if (maxPrice) query.currentPrice.$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    const sortOptions = {
      endTime: { endTime: 1 },
      priceAsc: { currentPrice: 1 },
      priceDesc: { currentPrice: -1 },
      newest: { createdAt: -1 },
    };

    const products = await Product.find(query)
      .sort(sortOptions[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("seller", "name")
      .populate("winner", "name");

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(400).json({ message: "Ошибка при получении товаров" });
  }
});

// Get user's products
router.get("/my", auth, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .sort({ createdAt: -1 })
      .populate("seller", "name")
      .populate("winner", "name");

    // Обновляем статус для всех продуктов
    await Promise.all(products.map((product) => product.updateStatus()));

    res.json(products);
  } catch (error) {
    res.status(400).json({ message: "Ошибка при получении ваших товаров" });
  }
});

// Get single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "name")
      .populate("winner", "name")
      .populate("bids.bidder", "name");

    if (!product) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: "Ошибка при получении товара" });
  }
});

// Create new product (auth required)
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      startPrice,
      images,
      endTime,
      instantBuyEnabled,
      instantBuyPrice,
    } = req.body;

    // Validate instant buy price if enabled
    if (
      instantBuyEnabled &&
      (!instantBuyPrice || instantBuyPrice <= startPrice)
    ) {
      return res.status(400).json({
        message: "Цена мгновенной покупки должна быть выше начальной цены",
      });
    }

    const product = new Product({
      title,
      description,
      category,
      startPrice,
      currentPrice: startPrice,
      images,
      endTime,
      seller: req.user._id,
      instantBuyEnabled,
      instantBuyPrice,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: "Ошибка при создании товара" });
  }
});

// Place bid on product (auth required)
router.post("/:id/bid", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    if (product.status !== "active") {
      return res.status(400).json({ message: "Аукцион завершен" });
    }

    if (product.seller.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Вы не можете делать ставки на свой товар" });
    }

    if (amount <= product.currentPrice) {
      return res
        .status(400)
        .json({ message: "Ставка должна быть выше текущей цены" });
    }

    product.bids.push({
      bidder: req.user._id,
      amount,
      timestamp: new Date(),
    });

    product.currentPrice = amount;

    if (new Date() >= new Date(product.endTime)) {
      product.status = "ended";
      product.winner = req.user._id;
    }

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: "Ошибка при размещении ставки" });
  }
});

module.exports = router;
