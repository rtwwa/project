const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

const router = express.Router();

// Create new order (auth required)
router.post("/", auth, async (req, res) => {
  try {
    const {
      product: productId,
      amount,
      shippingAddress,
      paymentMethod,
    } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    // Allow order creation for both instant buy and auction winners
    if (
      product.winner &&
      product.winner.toString() !== req.user._id.toString() &&
      !product.instantBuyEnabled
    ) {
      return res
        .status(403)
        .json({ message: "Вы не можете оформить заказ на этот товар" });
    }

    // Validate instant buy price if applicable
    if (
      !product.winner &&
      product.instantBuyEnabled &&
      amount !== product.instantBuyPrice
    ) {
      return res
        .status(400)
        .json({ message: "Неверная цена мгновенной покупки" });
    }

    const order = new Order({
      buyer: req.user._id,
      product: productId,
      amount: amount || product.currentPrice,
      shippingAddress,
      paymentMethod,
    });

    await order.save();

    // Update product status
    product.status = "sold";
    if (!product.winner) {
      product.winner = req.user._id;
    }
    await product.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: "Ошибка при создании заказа" });
  }
});

// Get user orders (auth required)
router.get("/me", auth, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(400).json({ message: "Ошибка при получении заказов" });
  }
});

// Get single order (auth required)
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("product")
      .populate("buyer", "name email");

    if (!order) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    if (order.buyer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Доступ запрещен" });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: "Ошибка при получении заказа" });
  }
});

// Update order status (payment confirmation simulation)
router.post("/:id/pay", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Доступ запрещен" });
    }

    // Simulate payment processing
    order.paymentStatus = "completed";
    order.status = "paid";

    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: "Ошибка при обработке оплаты" });
  }
});

module.exports = router;
