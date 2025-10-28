const Auction = require("../Schema/auctionSchema");
const AuctionPayment = require("../Schema/auctionPaymentSchema");

// ✅ Create new auction
exports.createAuction = async (req, res) => {
  try {
    const auction = new Auction(req.body);
    await auction.save();
    res.status(201).json({ message: "Auction created successfully", auction });
  } catch (err) {
    console.error("Error creating auction:", err);
    res.status(500).json({ message: "Error creating auction", error: err.message });
  }
};

// ✅ Get all auctions
exports.getAuctions = async (req, res) => {
  try {
    let { page = 1, limit = 10, search, fromdate, todate } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};

    // Date filter
    if (fromdate || todate) {
      filter.date = {};
      if (fromdate) filter.date.$gte = new Date(fromdate);
      if (todate) filter.date.$lte = new Date(todate);
    }

    // Search filter
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { item: regex },
        { buyerName: regex },
        { buyerPhone: regex },
        { buyerId: regex },
        { sellerName: regex },
        { sellerPhone: regex },
        { sellerId: regex },
        { payment_status: regex }
      ];
    }

    const total = await Auction.countDocuments(filter);
    const auctions = await Auction.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      auctions,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching auctions", error: err.message });
  }
};


// ✅ Get single auction by ID
exports.getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: "Auction not found" });
    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: "Error fetching auction", error: err.message });
  }
};

// ✅ Get auctions grouped by seller for reports
// ✅ Get auctions grouped by seller for reports
exports.getAuctionReport = async (req, res) => {
  try {
    const auctions = await Auction.find().lean();

    const buyerMap = new Map();

    auctions.forEach((a) => {
      const isMember = a.buyerId && a.buyerId.trim();
      const buyerKey = isMember ? a.buyerId : `PHONE:${a.buyerPhone || "UNKNOWN"}`;

      if (!buyerMap.has(buyerKey)) {
        buyerMap.set(buyerKey, {
          key: buyerKey,
          isMember: !!isMember,
          buyerId: isMember ? a.buyerId : "",
          buyerName: a.buyerName || "",
          buyerPhone: a.buyerPhone || "",
          auctions: [],
          payments: [],
          overallUnpaid: 0,
        });
      }

      const buyer = buyerMap.get(buyerKey);

      // ✅ use real values from DB (not reset)
      buyer.auctions.push({
        _id: a._id,
        date: a.date,
        item: a.item,
        amount: a.amount,
        balance: a.balance,              // ← actual remaining balance
        sellerId: a.sellerId || "",
        sellerName: a.sellerName || "",
        sellerPhone: a.sellerPhone || "",
        payment_status: a.payment_status,
        totalPaid: a.totalPaid || 0,     // ← include total paid
        payments: a.payments || []       // ← include payment history
      });

      // ✅ calculate unpaid correctly
      buyer.overallUnpaid += Math.max(0, a.balance || 0);

      // ✅ also attach payments into global buyer.payments
      if (a.payments && a.payments.length > 0) {
        a.payments.forEach((p) => {
          buyer.payments.push({
            auctionId: a._id,
            date: p.date,
            amountPaid: p.amountPaid,
            item: a.item,
            sellerName: a.sellerName,
            sellerPhone: a.sellerPhone,
          });
        });
      }
    });

    res.json(Array.from(buyerMap.values()));
  } catch (err) {
    console.error("Error in getAuctionReport:", err);
    res.status(500).json({ error: "Server error" });
  }
};



// ✅ Get auctions grouped by buyer (with payments aggregated)
exports.getAuctionReportByBuyer = async (req, res) => {
  try {
    const { fromdate, todate, search } = req.query;

    const filter = {};
    if (fromdate || todate) {
      filter.date = {};
      if (fromdate) filter.date.$gte = new Date(fromdate);
      if (todate) filter.date.$lte = new Date(todate);
    }

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { item: regex },
        { buyerName: regex },
        { buyerId: regex },
        { buyerPhone: regex },
        { sellerName: regex },
        { sellerId: regex },
        { sellerPhone: regex },
        { payment_status: regex },
      ];
    }

    const auctions = await Auction.find(filter).lean();
    const buyersMap = {};

    auctions.forEach((a) => {
      const key = a.buyerId ? a.buyerId : `PHONE:${a.buyerPhone}`;

      if (!buyersMap[key]) {
        buyersMap[key] = {
          key,
          isMember: !!a.buyerId,
          buyerId: a.buyerId || "",
          buyerName: a.buyerName || "",
          buyerPhone: a.buyerPhone || "",
          auctions: [],
          payments: [],
          overallUnpaid: 0,
        };
      }

      // ✅ push real auction details (with payments + balance)
      buyersMap[key].auctions.push({
        _id: a._id,
        date: a.date,
        item: a.item,
        amount: a.amount,
        balance: a.balance,
        sellerId: a.sellerId,
        sellerName: a.sellerName,
        sellerPhone: a.sellerPhone,
        payment_status: a.payment_status,
        totalPaid: a.totalPaid || 0,
        payments: a.payments || [],
      });

      // ✅ use balance instead of full amount
      buyersMap[key].overallUnpaid += Math.max(0, a.balance || 0);

      // ✅ flatten payments into global buyer.payments
      if (a.payments && a.payments.length > 0) {
        a.payments.forEach((p) => {
          buyersMap[key].payments.push({
            auctionId: a._id,
            date: p.date,
            amountPaid: p.amountPaid,
            item: a.item,
            sellerName: a.sellerName,
            sellerPhone: a.sellerPhone,
          });
        });
      }
    });

    res.json(Object.values(buyersMap));
  } catch (err) {
    console.error("Error in getAuctionReportByBuyer:", err);
    res.status(500).json({ message: "Server error" });
  }
};









// ✅ Add buyer payment (partial or full)
exports.addPayment = async (req, res) => {
  try {
    const { buyerKey, amount } = req.body;

    if (!buyerKey || !amount) {
      return res.status(400).json({ message: "buyerKey and amount are required" });
    }

    // Identify buyer type
    let query;
    if (buyerKey.startsWith("PHONE:")) {
      const phone = buyerKey.replace("PHONE:", "");
      query = { buyerPhone: phone };
    } else {
      query = { buyerId: buyerKey };
    }

    // Get unpaid auctions (oldest first)
    const auctions = await Auction.find({
      ...query,
      payment_status: { $ne: "Paid" }
    }).sort({ date: 1 });

    if (!auctions.length) {
      return res.status(404).json({ message: "No unpaid auctions found for this buyer" });
    }

    let remainingAmount = Number(amount);

    const savedPayments = []; // collect new payments to store in AuctionPayment

    for (const auction of auctions) {
      if (remainingAmount <= 0) break;

      const auctionBalance = Number(auction.balance) || 0;
      const payAmount = Math.min(auctionBalance, remainingAmount);

      if (payAmount <= 0) continue;

      // push into auction payments
      const newPayment = {
        amountPaid: payAmount,
        date: new Date(),
        balanceAfter: auctionBalance - payAmount,
      };
      auction.payments.push(newPayment);

      auction.totalPaid = Number(auction.totalPaid || 0) + payAmount;
      auction.balance = auctionBalance - payAmount;
      remainingAmount -= payAmount;

      if (auction.balance <= 0) {
        auction.payment_status = "Paid";
        auction.balance = 0;
      }

      await auction.save();

      // ✅ also save into AuctionPayment collection
      const paymentDoc = new AuctionPayment({
        buyerId: auction.buyerId,
        buyerName: auction.buyerName,
        buyerPhone: auction.buyerPhone,
        auctionId: auction._id,
        item: auction.item,
        sellerId: auction.sellerId,
        sellerName: auction.sellerName,
        sellerPhone: auction.sellerPhone,
        amountPaid: payAmount,
        date: newPayment.date,
        balanceAfter: auctionBalance - payAmount,
      });
      const saved = await paymentDoc.save();
      savedPayments.push(saved);
    }

    // Fetch updated auctions
    const updatedAuctions = await Auction.find(query).sort({ date: 1 });

    // Fetch all buyer payments from AuctionPayment (so history persists)
    const buyerPayments = await AuctionPayment.find(query).sort({ date: -1 });

    // Build buyer response
    const buyer = {
      key: buyerKey,
      isMember: !buyerKey.startsWith("PHONE:"),
      buyerId: updatedAuctions[0]?.buyerId || "",
      buyerName: updatedAuctions[0]?.buyerName || "",
      buyerPhone: updatedAuctions[0]?.buyerPhone || "",
      auctions: [],
      payments: [],
      overallUnpaid: 0
    };

    for (const a of updatedAuctions) {
      buyer.auctions.push({
        _id: a._id,
        date: a.date,
        item: a.item,
        amount: a.amount,
        balance: a.balance,
        sellerId: a.sellerId,
        sellerName: a.sellerName,
        sellerPhone: a.sellerPhone,
        payment_status: a.payment_status,
        totalPaid: a.totalPaid,
        payments: a.payments
      });

      buyer.overallUnpaid += Math.max(0, a.balance);
    }

    // payments from AuctionPayment collection
    for (const p of buyerPayments) {
      buyer.payments.push({
        auctionId: p.auctionId,
        date: p.date,
        amountPaid: p.amountPaid,
        balanceAfter: p.balanceAfter ?? null,
        item: p.item,
        sellerName: p.sellerName,
        sellerPhone: p.sellerPhone,
      });
    }

    res.json(buyer);

  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};







// ✅ Get full payment history for a buyer
exports.getBuyerPaymentHistory = async (req, res) => {
  try {
    const { buyerId, buyerPhone } = req.query;
    if (!buyerId && !buyerPhone) {
      return res.status(400).json({ message: "buyerId or buyerPhone is required" });
    }

    const query = buyerId ? { buyerId } : { buyerPhone };
    const auctions = await Auction.find(query).sort({ date: 1 });

    if (!auctions.length) {
      return res.status(404).json({ message: "No auctions found for this buyer" });
    }

    const paymentHistory = auctions.flatMap(a =>
      (a.payments || []).map(p => ({
        auctionId: a._id,
        date: p.date,
        paidAmount: p.amountPaid,
        item: a.item,
        sellerId: a.sellerId,
        sellerName: a.sellerName,
        sellerPhone: a.sellerPhone,
        amount: a.amount,
        totalPaid: a.totalPaid,
        balance: a.balance,
        payment_status: a.payment_status,
      }))
    ).sort((x, y) => new Date(x.date) - new Date(y.date));

    res.json({
      buyer: {
        buyerId: auctions[0].buyerId || "",
        buyerName: auctions[0].buyerName || "",
        buyerPhone: auctions[0].buyerPhone || "",
      },
      totalAmount: auctions.reduce((s, a) => s + Number(a.amount || 0), 0),
      totalPaid: auctions.reduce((s, a) => s + Number(a.totalPaid || 0), 0),
      balance: auctions.reduce((s, a) => s + Math.max(0, a.balance), 0),
      auctions: auctions.map(a => ({
        _id: a._id,
        date: a.date,
        item: a.item,
        sellerId: a.sellerId,
        sellerName: a.sellerName,
        sellerPhone: a.sellerPhone,
        amount: a.amount,
        totalPaid: a.totalPaid,
        balance: a.balance,
        payment_status: a.payment_status,
        payments: a.payments || [],
      })),
      paymentHistory
    });
  } catch (err) {
    console.error("Error fetching buyer payment history:", err);
    res.status(500).json({ message: "Error fetching buyer payment history", error: err.message });
  }
};





