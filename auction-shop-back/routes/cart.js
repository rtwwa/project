const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.product");
    // Преобразуем формат данных для совместимости с фронтендом
    const cartItems = user.cart.map((item) => ({
      ...item.product.toObject(),
      finalPrice: item.finalPrice,
    }));
    res.json(cartItems);
  } catch (error) {
    res.status(400).json({ message: "Ошибка при получении корзины" });
  }
});

router.post("/add/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { finalPrice } = req.body;
    const user = await User.findById(req.user._id);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    if (user.cart.some((item) => item.product.toString() === productId)) {
      return res.status(400).json({ message: "Товар уже в корзине" });
    }

    if (product.status !== "active") {
      return res.status(400).json({ message: "Товар недоступен для покупки" });
    }

    const priceToUse = finalPrice || product.currentPrice;
    if (finalPrice && product.instantBuyEnabled) {
      // Проверка цены мгновенной покупки
      if (finalPrice !== product.instantBuyPrice) {
        return res.status(400).json({
          message: "Неверная цена мгновенной покупки",
          expectedPrice: product.instantBuyPrice,
          receivedPrice: finalPrice,
        });
      }
    } else {
      // Проверка для обычной покупки по текущей цене
      const priceToUse = finalPrice || product.currentPrice;
      if (product.instantBuyEnabled && product.instantBuyPrice < priceToUse) {
        return res
          .status(400)
          .json({ message: "Цена превышает цену мгновенной покупки" });
      }
    }

    user.cart.push({
      product: productId,
      finalPrice: priceToUse,
    });
    await user.save();

    // Получаем обновленную корзину с данными о продуктах
    const updatedUser = await User.findById(req.user._id).populate(
      "cart.product"
    );
    const cartItems = updatedUser.cart.map((item) => ({
      ...item.product.toObject(),
      finalPrice: item.finalPrice,
    }));

    res.json({
      message: "Товар добавлен в корзину",
      items: cartItems,
    });
  } catch (error) {
    res.status(400).json({ message: "Ошибка при добавлении в корзину" });
  }
});

router.delete("/remove/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter(
      (item) => item.product.toString() !== productId
    );
    await user.save();

    // Получаем обновленную корзину с данными о продуктах
    const updatedUser = await User.findById(req.user._id).populate(
      "cart.product"
    );
    const cartItems = updatedUser.cart.map((item) => ({
      ...item.product.toObject(),
      finalPrice: item.finalPrice,
    }));

    res.json({
      message: "Товар удален из корзины",
      items: cartItems,
    });
  } catch (error) {
    res.status(400).json({ message: "Ошибка при удалении из корзины" });
  }
});

router.delete("/clear", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();

    res.json({
      message: "Корзина очищена",
      items: [],
    });
  } catch (error) {
    res.status(400).json({ message: "Ошибка при очистке корзины" });
  }
});

module.exports = router;
