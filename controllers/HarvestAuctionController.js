const HarvestAuction = require("../Schema/HarvestAuction");
const HarvestAuctionPayment = require("../Schema/HarvestAuctionPayment");


// Utility to build buyer-wise report
async function buildBuyerReport({ buyerId, buyerPhone }) {
  const filter = buyerId ? { buyerId } : { buyerPhone };
  const auctions = await HarvestAuction.find(filter).lean();

  const payments = auctions.flatMap(a => a.payments || []);
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
// ➤ Add Harvest Auction
exports.addHarvestAuction = async (req, res) => {
  try {
    const auction = new HarvestAuction(req.body);
    await auction.save();
    res.status(201).json(auction);
  } catch (err) {
    res.status(500).json({ message: "Failed to add Harvest Auction", error: err.message });
  }
};

// ➤ Get Harvest Auctions (with filters + pagination)
exports.getHarvestAuctions = async (req, res) => {
  try {
    const { page = 1, limit = 15, search = "", fromdate, todate } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { sellerName: new RegExp(search, "i") },
        { buyerName: new RegExp(search, "i") },
        { item: new RegExp(search, "i") }
      ];
    }
    if (fromdate && todate) {
      query.date = { $gte: new Date(fromdate), $lte: new Date(todate) };
    }

    const auctions = await HarvestAuction.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    const total = await HarvestAuction.countDocuments(query);

    res.json({
      auctions,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching Harvest Auctions", error: err.message });
  }
};

// ➤ Update Harvest Auction
exports.updateHarvestAuction = async (req, res) => {
  try {
    const auction = await HarvestAuction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: "Failed to update Harvest Auction", error: err.message });
  }
};


// ➤ Buyer Report
exports.getHarvestAuctionReportByBuyer = async (req, res) => {
  try {
    const auctions = await HarvestAuction.find().lean();
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

    const reports = [];
    for (const key in buyersMap) {
      const r = await buildBuyerReport(buyersMap[key]);
      reports.push(r);
    }

    res.json(reports);
  } catch (err) {
    console.error("Harvest Auction Report error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ➤ Add Payment
exports.addHarvestAuctionPayment = async (req, res) => {
  try {
    const { auctionId, amountPaid } = req.body;
    const auction = await HarvestAuction.findById(auctionId);
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    const newTotalPaid = (auction.totalPaid || 0) + amountPaid;
    const newBalance = auction.amount - newTotalPaid;

    auction.totalPaid = newTotalPaid;
    auction.balance = newBalance;
    auction.payment_status = newBalance <= 0 ? "Paid" : "Unpaid";

    auction.payments = auction.payments || [];
    auction.payments.push({ amountPaid, date: new Date(), balanceAfter: newBalance });

    await auction.save();

    // Also save in separate collection
    const payment = new HarvestAuctionPayment({
      harvestAuctionId: auction._id,
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
    console.error("Harvest Auction Payment error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ➤ Add Buyer Payment (distribute across unpaid auctions)
exports.addHarvestAuctionPaymentForBuyer = async (req, res) => {
  try {
    const { buyerId, amountPaid } = req.body;
    if (!buyerId || !amountPaid) {
      return res.status(400).json({ message: "buyerId and amountPaid are required" });
    }

    // get all unpaid auctions for that buyer, sorted by date
    let auctions = await HarvestAuction.find({ 
      buyerId, 
      balance: { $gt: 0 } 
    }).sort({ date: 1 });

    let remaining = amountPaid;
    const paymentsSaved = [];

    for (let auction of auctions) {
      if (remaining <= 0) break;

      const payAmount = Math.min(remaining, auction.balance);
      auction.totalPaid = (auction.totalPaid || 0) + payAmount;
      auction.balance = auction.amount - auction.totalPaid;
      auction.payment_status = auction.balance <= 0 ? "Paid" : "Unpaid";

      auction.payments.push({
        amountPaid: payAmount,
        date: new Date(),
        balanceAfter: auction.balance,
      });

      await auction.save();

      const payment = new HarvestAuctionPayment({
        harvestAuctionId: auction._id,
        buyerId: auction.buyerId,
        buyerName: auction.buyerName,
        buyerPhone: auction.buyerPhone,
        sellerId: auction.sellerId || "",
        sellerName: auction.sellerName || "",
        item: auction.item,
        amountPaid: payAmount,
        balanceAfter: auction.balance,
        date: new Date(),
      });
      await payment.save();

      paymentsSaved.push(payment);
      remaining -= payAmount;
    }

    res.status(201).json({
      message: "Buyer payment applied successfully",
      totalPaid: amountPaid - remaining,
      payments: paymentsSaved,
    });
  } catch (err) {
    console.error("Harvest Auction Buyer Payment error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ➤ Get Harvest Auction Report for a specific member
exports.getHarvestAuctionReportByMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      return res.status(400).json({ message: "Member ID is required" });
    }

    const report = await buildBuyerReport({ buyerId: memberId });

    res.json(report);
  } catch (err) {
    console.error("Harvest Auction Member Report error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
