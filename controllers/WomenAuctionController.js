const WomenAuction = require("../Schema/WomenAuctionSchema");
const WomenAuctionPayment = require("../Schema/WomenAuctionPaymentSchema");

// ➤ Add Auction
exports.addAuction = async (req, res) => {
  try {
    const auction = new WomenAuction(req.body);
    await auction.save();
    res.status(201).json({ success: true, message: "Auction created", auction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ➤ Get All Auctions
exports.getAuctions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", startDate, endDate, payment_status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { sellerName: { $regex: search, $options: "i" } },
        { buyerName: { $regex: search, $options: "i" } },
        { item: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (payment_status) query.payment_status = payment_status;

    const auctions = await WomenAuction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await WomenAuction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: auctions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ➤ Get Auction by ID
exports.getAuctionById = async (req, res) => {
  try {
    const auction = await WomenAuction.findById(req.params.id);
    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });
    res.status(200).json({ success: true, auction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ➤ Update Auction
exports.updateAuction = async (req, res) => {
  try {
    const auction = await WomenAuction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });
    res.status(200).json({ success: true, message: "Auction updated", auction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ➤ Delete Auction
exports.deleteAuction = async (req, res) => {
  try {
    const auction = await WomenAuction.findByIdAndDelete(req.params.id);
    if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });
    res.status(200).json({ success: true, message: "Auction deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal helper
async function buildBuyerReport({ buyerId, buyerPhone }) {
  const filter = buyerId ? { buyerId } : { buyerPhone };
  const auctions = await WomenAuction.find(filter).lean();
  const payments = await WomenAuctionPayment.find(filter).lean();

  const totalAuctionAmount = auctions.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalPayments = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const overallUnpaid = totalAuctionAmount - totalPayments;

  return {
    key: buyerId || `PHONE:${buyerPhone}`,
    isMember: !!buyerId,
    buyerId: buyerId || "",
    buyerName: auctions[0]?.buyerName || "Unknown",
    buyerPhone: buyerPhone || auctions[0]?.buyerPhone || "",
    auctions: auctions.map(a => ({
      _id: a._id,
      date: a.date,
      item: a.item,
      amount: a.amount,
      sellerId: a.sellerId || "",
      sellerName: a.sellerName || "",
      payment_status: a.payment_status,
    })),
    payments: payments.map(p => ({ date: p.date, amount: p.amountPaid })),
    overallUnpaid,
  };
}

// ➤ Get Women Auction Report
exports.getWomenAuctionReportByBuyer = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const auctions = await WomenAuction.find().lean();

    const buyersMap = {};
    auctions.forEach(a => {
      const key = a.buyerId || `PHONE:${a.buyerPhone}`;
      if (!buyersMap[key]) {
        buyersMap[key] = { buyerId: a.buyerId || null, buyerPhone: !a.buyerId ? a.buyerPhone : null };
      }
    });

    let reports = [];
    for (const key in buyersMap) {
      reports.push(await buildBuyerReport(buyersMap[key]));
    }

    if (search) {
      const s = search.toLowerCase();
      reports = reports.filter(r =>
        (r.buyerName && r.buyerName.toLowerCase().includes(s)) ||
        (r.buyerId && r.buyerId.toLowerCase().includes(s)) ||
        (r.buyerPhone && r.buyerPhone.includes(s))
      );
    }

    const total = reports.length;
    const start = (page - 1) * limit;
    const paginated = reports.slice(start, start + parseInt(limit));

    res.json({ total, page: parseInt(page), totalPages: Math.ceil(total / limit), data: paginated });
  } catch (err) {
    console.error("Women Auction Report error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ➤ Add Payment
exports.addWomenAuctionPayment = async (req, res) => {
  try {
    const { auctionId, amountPaid } = req.body;
    const auction = await WomenAuction.findById(auctionId);
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    const newTotalPaid = (auction.totalPaid || 0) + amountPaid;
    const newBalance = auction.amount - newTotalPaid;

    auction.totalPaid = newTotalPaid;
    auction.balance = newBalance;
    auction.payment_status = newBalance <= 0 ? "Paid" : "Unpaid";

    auction.payments = auction.payments || [];
    auction.payments.push({ amountPaid, date: new Date(), balanceAfter: newBalance });

    await auction.save();

    const payment = new WomenAuctionPayment({
      womenAuctionId: auction._id,
      buyerId: auction.buyerId || "",
      buyerName: auction.buyerName || "Unknown",
      buyerPhone: auction.buyerPhone || "N/A",
      sellerId: auction.sellerId || "",
      sellerName: auction.sellerName || "Unknown",
      item: auction.item,
      amountPaid,
      balanceAfter: newBalance,
      date: new Date(),
    });

    await payment.save();

    res.status(201).json({ message: "Payment added successfully", auction, payment });
  } catch (err) {
    console.error("Women Auction Payment error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
