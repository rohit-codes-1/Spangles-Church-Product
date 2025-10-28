// controllers/studentAuctionController.js
const StudentAuction = require("../Schema/StudentAuction");
const SundayClass = require("../Schema/SundayClass");
const StudentAuctionPayment = require("../Schema/StudentAuctionPayment");
const Member = require("../Schema/memberSchema");

async function buildBuyerReport({ buyerId, buyerPhone }) {
  // 1. Find auctions
  const filter = buyerId ? { "buyer.member_id": buyerId } : { "buyer.phone": buyerPhone };
  const auctions = await StudentAuction.find(filter).lean();

  // 2. Find payments
  const paymentFilter = buyerId ? { buyerId } : { buyerPhone };
  const payments = await StudentAuctionPayment.find(paymentFilter).sort({ date: 1 }).lean();

  // 3. Totals
  const totalAuctionAmount = auctions.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalPayments = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const overallUnpaid = totalAuctionAmount - totalPayments;

  // 4. Build auctions summary
  const auctionDetails = auctions.map((a) => ({
    _id: a._id,
    date: a.date,
    item: a.item,
    amount: a.amount,
    sellerId: a.seller?.member_id || "",
    sellerName: a.seller?.name || "",
    sellerPhone: a.seller?.phone || "",
    payment_status: overallUnpaid <= 0 ? "Paid" : "Unpaid", // overall only
  }));

  return {
    key: buyerId || `PHONE:${buyerPhone}`,
    isMember: !!buyerId,
    buyerId: buyerId || "",
    buyerName: auctions[0]?.buyer?.name || payments[0]?.buyerName || "Unknown",
    buyerPhone: buyerPhone || auctions[0]?.buyer?.phone || payments[0]?.buyerPhone || "",
    auctions: auctionDetails,
    payments: payments.map((p) => ({
      date: p.date,
      amount: p.amountPaid,
    })),
    overallUnpaid,
  };
}


// ➤ Add Student Auction
const addStudentAuction = async (req, res) => {
  try {
    const auction = new StudentAuction(req.body);
    await auction.save();
    res.status(201).json(auction);
  } catch (err) {
    res.status(500).json({ message: "Error adding auction", error: err.message });
  }
};

// ➤ Get All Student Auctions
const getStudentAuctions = async (req, res) => {
  try {
    let { page = 1, limit = 10, query = "", from = "", to = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};

    // Search filter (item, buyer, seller)
    if (query) {
      const regex = new RegExp(query, "i");
      filter.$or = [
        { item: regex },
        { "buyer.name": regex },
        { "buyer.member_id": regex },
        { "seller.name": regex },
        { "seller.member_id": regex },
      ];
    }

    // Date filter (createdAt)
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const total = await StudentAuction.countDocuments(filter);
    const auctions = await StudentAuction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      auctions,
      totalPages: Math.ceil(total / limit),
      total,
      page
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching auctions", error: err.message });
  }
};


// ➤ Get Single Auction by ID
const getStudentAuctionById = async (req, res) => {
  try {
    const auction = await StudentAuction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: "Auction not found" });
    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: "Error fetching auction", error: err.message });
  }
};

// ➤ Update Student Auction
const updateStudentAuction = async (req, res) => {
  try {
    const auction = await StudentAuction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!auction) return res.status(404).json({ message: "Auction not found" });
    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: "Error updating auction", error: err.message });
  }
};

// ➤ Delete Student Auction
const deleteStudentAuction = async (req, res) => {
  try {
    const auction = await StudentAuction.findByIdAndDelete(req.params.id);
    if (!auction) return res.status(404).json({ message: "Auction not found" });
    res.json({ message: "Auction deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting auction", error: err.message });
  }
};

// ➤ Search Students (Seller)
const searchStudents = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const sundayClasses = await SundayClass.find({
      "students.member_name": { $regex: query, $options: "i" }
    });

    const students = sundayClasses.flatMap(sc =>
      sc.students
        .filter(st => new RegExp(query, "i").test(st.member_name))
        .map(st => ({
          member_id: st.member_id,
          name: st.member_name,
          tamil_name: st.tamil_name,
          class_name: sc.class_name,
          section_name: sc.section_name
        }))
    );

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Error searching students", error: err.message });
  }
};

// ➤ Student Auction Report By Buyer
// const getStudentAuctionReportByBuyer = async (req, res) => {
//   try {
//     const auctions = await StudentAuction.find().lean();

//     // Collect unique buyers
//     const buyersMap = {};
//     auctions.forEach((a) => {
//       const buyer = a.buyer || {};
//       const key = buyer.isMember ? buyer.member_id : `PHONE:${buyer.phone}`;
//       if (!buyersMap[key]) {
//         buyersMap[key] = {
//           buyerId: buyer.isMember ? buyer.member_id : null,
//           buyerPhone: !buyer.isMember ? buyer.phone : null,
//         };
//       }
//     });

//     // Build reports for each buyer
//     const reports = [];
//     for (const key in buyersMap) {
//       const r = await buildBuyerReport(buyersMap[key]);
//       reports.push(r);
//     }

//     res.json(reports);
//   } catch (err) {
//     console.error("Student Auction Report error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

const getStudentAuctionReportByBuyer = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const auctions = await StudentAuction.find().lean();

    // Collect unique buyers
    const buyersMap = {};
    auctions.forEach((a) => {
      const buyer = a.buyer || {};
      const key = buyer.isMember ? buyer.member_id : `PHONE:${buyer.phone}`;
      if (!buyersMap[key]) {
        buyersMap[key] = {
          key,                       // unique key for frontend reference
          buyerId: buyer.isMember ? buyer.member_id : null,
          buyerPhone: !buyer.isMember ? buyer.phone : null,
          buyerName: buyer.name || "", 
        };
      }
    });

    let uniqueBuyers = Object.values(buyersMap);

    // Search filter by ID, phone, or name
    if (search) {
      const lowerSearch = search.toLowerCase();
      uniqueBuyers = uniqueBuyers.filter((b) =>
        (b.buyerId && b.buyerId.toLowerCase().includes(lowerSearch)) ||
        (b.buyerPhone && b.buyerPhone.includes(lowerSearch)) ||
        (b.buyerName && b.buyerName.toLowerCase().includes(lowerSearch))
      );
    }

    const total = uniqueBuyers.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const buyersPage = uniqueBuyers.slice(start, end);

    // Build report for paginated buyers
    const reports = await Promise.all(
      buyersPage.map((b) => buildBuyerReport(b))
    );

    res.json({
      reports,
      totalPages,
      total,
      page
    });
  } catch (err) {
    console.error("Student Auction Report error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};





const addStudentAuctionPayment = async (req, res) => {
  try {
    const { auctionId, amountPaid } = req.body;

    // find auction
    const auction = await StudentAuction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    // calculate totals
    const newTotalPaid = (auction.totalPaid || 0) + amountPaid;
    const newBalance = auction.amount - newTotalPaid;

    // update auction fields
    auction.totalPaid = newTotalPaid;
    auction.balance = newBalance;
    auction.payment_status = newBalance <= 0 ? "Paid" : "Unpaid";

    // push to embedded payments array
    auction.payments = auction.payments || [];
    auction.payments.push({
      amountPaid,
      date: new Date(),
      balanceAfter: newBalance
    });

    await auction.save();

    // save flat payment history
const payment = new StudentAuctionPayment({
  studentAuctionId: auction._id,

  buyerId: auction.buyer?.member_id || auction.buyerId || "",
  buyerName: auction.buyer?.name || auction.buyerName || "Unknown",
  buyerPhone: auction.buyer?.phone || auction.buyerPhone || "N/A",

  sellerId: auction.seller?.member_id || auction.sellerId || "",
  sellerName: auction.seller?.name || auction.sellerName || "Unknown",

  item: auction.item,
  amountPaid,
  balanceAfter: newBalance,
  date: new Date()
});


    await payment.save();

    res.status(201).json({
      message: "Payment added successfully",
      auction,
      payment
    });
  } catch (err) {
    console.error("Student Auction Payment error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


const getTeacherStudentDues = async (req, res) => {
  try {
    const teacherId = req.params.teacherId || req.user?.member_id;
    if (!teacherId) {
      return res.status(400).json({ message: "teacherId required" });
    }

    // 1) load classes for this teacher and collect student ids + meta
    const classes = await SundayClass.find({ "teacher.member_id": teacherId }).lean();
    const studentIds = classes.flatMap((cls) => (cls.students || []).map((s) => s.member_id));

    if (!studentIds.length) return res.json([]);

    // map student -> class/section/name
    const studentMeta = {};
    classes.forEach((cls) => {
      (cls.students || []).forEach((s) => {
        studentMeta[s.member_id] = {
          member_name: s.member_name || s.name || "",
          class_name: cls.class_name,
          section_name: cls.section_name,
        };
      });
    });

    // 2) fetch all auctions where buyer is one of these students
    const buyerAuctions = await StudentAuction.find({
      "buyer.member_id": { $in: studentIds },
    }).lean();

    if (!buyerAuctions.length) return res.json([]);

    // 3) fetch payments for these auctions
    const auctionIds = buyerAuctions.map((a) => String(a._id));
    const payments = await StudentAuctionPayment.find({
      studentAuctionId: { $in: auctionIds },
    }).lean();

    // 4) build payments map
    const paymentsByAuction = {};
    payments.forEach((p) => {
      const aid = String(p.studentAuctionId);
      paymentsByAuction[aid] = (paymentsByAuction[aid] || 0) + (Number(p.amountPaid) || 0);
    });

    // 5) Build dues grouped by buyer
    const duesByBuyer = {};
    buyerAuctions.forEach((a) => {
      const buyerId = a.buyer?.member_id;
      if (!buyerId) return; // skip non-member buyers

      const totalPaidFromAuction = Number(a.totalPaid || 0);
      const totalPaidFromPayments = paymentsByAuction[String(a._id)] || 0;
      const paid = totalPaidFromAuction > 0 ? totalPaidFromAuction : totalPaidFromPayments;

      const amount = Number(a.amount || 0);
      const balance = amount - paid;
      if (balance <= 0) return; // nothing due

      const sellerId = a.seller?.member_id || null;
      if (!sellerId) return; // seller not a student
      if (studentIds.includes(sellerId)) return; // seller is from same teacher → skip

      if (!duesByBuyer[buyerId]) {
        duesByBuyer[buyerId] = {
          buyerId,
          buyerName: a.buyer?.name || studentMeta[buyerId]?.member_name || "",
          buyerPhone: a.buyer?.phone || "",
          class_name: studentMeta[buyerId]?.class_name || "",
          section_name: studentMeta[buyerId]?.section_name || "",
          dues: [],
          totalDue: 0,
        };
      }

      duesByBuyer[buyerId].dues.push({
        auctionId: a._id,
        date: a.date,
        item: a.item,
        amount,
        paid,
        balance,
        sellerId,
        sellerName: a.seller?.member_name || a.seller?.name || "",
      });

      duesByBuyer[buyerId].totalDue += balance;
    });

    res.json(Object.values(duesByBuyer));
  } catch (err) {
    console.error("getTeacherStudentDues error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};








module.exports = {
  addStudentAuction,
  getStudentAuctions,
  getStudentAuctionById,
  updateStudentAuction,
  deleteStudentAuction,
  searchStudents,
  getStudentAuctionReportByBuyer,
  addStudentAuctionPayment,
  getTeacherStudentDues,
};
