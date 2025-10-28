const mongoose = require("mongoose");

const auctionPaymentSchema = new mongoose.Schema(
  {
    buyerId: { type: String, default: "" },
    buyerName: { type: String,  },
    buyerPhone: { type: String,  },

    auctionId: { type: mongoose.Schema.Types.ObjectId, ref: "Auction" },
    item: { type: String, required: true },

    sellerId: { type: String, default: "" },
    sellerName: { type: String,  },
    sellerPhone: { type: String,  },

    amountPaid: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    balanceAfter : { type: Number } ,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuctionPayment", auctionPaymentSchema);
