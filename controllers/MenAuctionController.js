const MenAuction = require("../Schema/MenAuctionSchema");
const MenAuctionPayment = require("../Schema/MenAuctionPaymentSchema");

// ➤ Add Auction
exports.addAuction = async (req, res) => {
  try {
    const auction = new MenAuction(req.body);
    await auction.save();
    res.status(201).json({ success: true, message: "Auction created", auction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ➤ Get All Auctions (with pagination + filters if needed)
exports.getAuctions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", startDate, endDate, payment_status } = req.query;

    const query = {};

    // ✅ Search (match in sellerName, buyerName, or item)
    if (search) {
      query.$or = [
        { sellerName: { $regex: search, $options: "i" } },
        { buyerName: { $regex: search, $options: "i" } },
        { item: { $regex: search, $options: "i" } },
      ];
    }

    // ✅ Date filter
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (payment_status) query.payment_status = payment_status;

    const auctions = await MenAuction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await MenAuction.countDocuments(query);

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


// ➤ Get Single Auction by ID
exports.getAuctionById = async (req, res) => {
  try {
    const auction = await MenAuction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found" });
    }
    res.status(200).json({ success: true, auction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ➤ Update Auction (e.g., payment status, buyer info, etc.)
exports.updateAuction = async (req, res) => {
  try {
    const auction = await MenAuction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found" });
    }
    res.status(200).json({ success: true, message: "Auction updated", auction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ➤ Delete Auction
exports.deleteAuction = async (req, res) => {
  try {
    const auction = await MenAuction.findByIdAndDelete(req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found" });
    }
    res.status(200).json({ success: true, message: "Auction deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function buildBuyerReport({ buyerId, buyerPhone }) {
  const filter = buyerId ? { buyerId } : { buyerPhone };
  const auctions = await MenAuction.find(filter).lean();
  const payments = await MenAuctionPayment.find(filter).lean(); // ✅ fetch from separate collection

  const totalAuctionAmount = auctions.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalPayments = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const overallUnpaid = totalAuctionAmount - totalPayments;

  const auctionDetails = auctions.map(a => ({
    _id: a._id,
    date: a.date,
    item: a.item,
    amount: a.amount,
    sellerId: a.sellerId || "",
    sellerName: a.sellerName || "",
    payment_status: a.payment_status,
  }));

  return {
    key: buyerId || `PHONE:${buyerPhone}`,
    isMember: !!buyerId,
    buyerId: buyerId || "",
    buyerName: auctions[0]?.buyerName || "Unknown",
    buyerPhone: buyerPhone || auctions[0]?.buyerPhone || "",
    auctions: auctionDetails,
    payments: payments.map(p => ({ date: p.date, amount: p.amountPaid })),
    overallUnpaid,
  };
}



// ➤ Get Men Auction Report (buyer-wise) with Search & Pagination
exports.getMenAuctionReportByBuyer = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const auctions = await MenAuction.find().lean();
    const buyersMap = {};

    auctions.forEach(a => {
      const key = a.buyerId || `PHONE:${a.buyerPhone}`;
      if (!buyersMap[key]) {
        buyersMap[key] = {
          buyerId: a.buyerId || null,
          buyerPhone: !a.buyerId ? a.buyerPhone : null,
        };
      }
    });

    let reports = [];
    for (const key in buyersMap) {
      const r = await buildBuyerReport(buyersMap[key]);
      reports.push(r);
    }

    // 🔍 Apply search filter (by buyerName, buyerId, or phone)
    if (search) {
      const s = search.toLowerCase();
      reports = reports.filter(r =>
        (r.buyerName && r.buyerName.toLowerCase().includes(s)) ||
        (r.buyerId && r.buyerId.toLowerCase().includes(s)) ||
        (r.buyerPhone && r.buyerPhone.includes(s))
      );
    }

    // 📄 Pagination
    const total = reports.length;
    const start = (page - 1) * limit;
    const paginated = reports.slice(start, start + parseInt(limit));

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: paginated
    });
  } catch (err) {
    console.error("Men Auction Report error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ➤ Add Payment to single auction
exports.addMenAuctionPayment = async (req, res) => {
  try {
    const { auctionId, amountPaid } = req.body;
    const auction = await MenAuction.findById(auctionId);
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    const newTotalPaid = (auction.totalPaid || 0) + amountPaid;
    const newBalance = auction.amount - newTotalPaid;

    auction.totalPaid = newTotalPaid;
    auction.balance = newBalance;
    auction.payment_status = newBalance <= 0 ? "Paid" : "Unpaid";

    // ✅ Ensure payments array exists
    auction.payments = auction.payments || [];
    auction.payments.push({
      amountPaid,
      date: new Date(),
      balanceAfter: newBalance,
    });

    await auction.save();

    // Save also in separate collection
    const payment = new MenAuctionPayment({
      menAuctionId: auction._id,
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
    console.error("Men Auction Payment error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

