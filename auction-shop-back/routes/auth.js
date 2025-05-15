const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Введите корректный email" });
    }

    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ message: "Пароль должен содержать не менее 8 символов" });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Имя не может быть пустым" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Пользователь с таким email уже существует" });
    }

    const user = new User({ email, password, name });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(400).json({ message: "Ошибка при регистрации" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(400).json({ message: "Ошибка при входе" });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
      },
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Ошибка при получении данных пользователя" });
  }
});

router.put("/profile", auth, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const user = req.user;

    if (newPassword || (email && email !== user.email)) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Неверный текущий пароль" });
      }
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Пользователь с таким email уже существует" });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    if (newPassword) {
      user.password = newPassword;
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(400).json({ message: "Ошибка при обновлении профиля" });
  }
});

module.exports = router;
