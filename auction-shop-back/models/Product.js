const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Женская одежда",
        "Мужская одежда",
        "Женская обувь",
        "Мужская обувь",
        "Спортивная одежда",
        "Аксессуары",
        "Детская одежда",
        "Детская обувь",
      ],
    },
    startPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    finalPrice: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          return !value || value >= this.currentPrice;
        },
        message: "Финальная цена должна быть больше или равна текущей цене",
      },
    },
    instantBuyEnabled: {
      type: Boolean,
      default: false,
    },
    instantBuyPrice: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          return !this.instantBuyEnabled || value > this.startPrice;
        },
        message: "Цена мгновенной покупки должна быть выше начальной цены",
      },
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    endTime: {
      type: Date,
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bids: [
      {
        bidder: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        amount: Number,
        timestamp: Date,
      },
    ],
    status: {
      type: String,
      enum: ["active", "ended", "sold"],
      default: "active",
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching and filtering
productSchema.index({ title: "text", description: "text" });

// Метод для проверки и обновления статуса
productSchema.methods.updateStatus = async function () {
  const now = new Date();
  if (this.status === "active" && now > this.endTime) {
    this.status = this.bids.length > 0 ? "sold" : "ended";
    if (this.status === "sold") {
      const winningBid = this.bids.reduce(
        (max, bid) => (bid.amount > max.amount ? bid : max),
        this.bids[0]
      );
      this.winner = winningBid.bidder;
    }
    await this.save();
  }
};

// Middleware для автоматического обновления статуса
productSchema.pre("save", async function (next) {
  if (this.status === "active") {
    await this.updateStatus();
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
