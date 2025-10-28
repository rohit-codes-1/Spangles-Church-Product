const EndeavourAuction = require("../Schema/EndeavourAuction");
const EndeavourAuctionPayment = require("../Schema/EndeavourAuctionPayment");
const SundayClass = require("../Schema/EndeavourClass");

// Utility to build buyer-wise report
async function buildBuyerReport({ buyerId, buyerPhone }) {
  const filter = buyerId
    ? { "buyer.member_id": buyerId }
    : { "buyer.phone": buyerPhone };
  const auctions = await EndeavourAuction.find(filter).lean();

  const paymentFilter = buyerId ? { buyerId } : { buyerPhone };
  const payments = await EndeavourAuctionPayment.find(paymentFilter)
    .sort({ date: 1 })
    .lean();

  const totalAuctionAmount = auctions.reduce(
    (sum, a) => sum + (a.amount || 0),
    0
  );
  const totalPayments = payments.reduce(
    (sum, p) => sum + (p.amountPaid || 0),
    0
  );
  const overallUnpaid = totalAuctionAmount - totalPayments;

  const auctionDetails = auctions.map((a) => ({
    _id: a._id,
    date: a.date,
    item: a.item,
    amount: a.amount,
    sellerId: a.seller?.member_id || "",
    sellerName: a.seller?.name || "",
    payment_status: overallUnpaid <= 0 ? "Paid" : "Unpaid",
  }));

  return {
    key: buyerId || `PHONE:${buyerPhone}`,
    isMember: !!buyerId,
    buyerId: buyerId || "",
    buyerName:
      auctions[0]?.buyer?.name || payments[0]?.buyerName || "Unknown",
    buyerPhone:
      buyerPhone ||
      auctions[0]?.buyer?.phone ||
      payments[0]?.buyerPhone ||
      "",
    auctions: auctionDetails,
    payments: payments.map((p) => ({
      date: p.date,
      amount: p.amountPaid,
    })),
    overallUnpaid,
  };
}

// ➤ Add Endeavour Auction
const addEndeavourAuction = async (req, res) => {
  try {
    const auction = new EndeavourAuction(req.body);
    await auction.save();
    res.status(201).json(auction);
  } catch (err) {
    res.status(500).json({ message: "Error adding auction", error: err.message });
  }
};

// ➤ Get All
// const getEndeavourAuctions = async (req, res) => {
//   try {
//     const auctions = await EndeavourAuction.find().sort({ createdAt: -1 });
//     res.json(auctions);
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching auctions", error: err.message });
//   }
// };

// ✅ GET /api/endeavour-auctions
const getEndeavourAuctions = async (req, res) => {
  try {
    // 🔍 Query Parameters
    const {
      query = "",
      page = 1,
      limit = 10,
      from,
      to,
    } = req.query;

    const filter = {};

    // 🔎 Search filter (matches seller name, buyer name, or item)
    if (query) {
      filter.$or = [
        { "seller.name": { $regex: query, $options: "i" } },
        { "buyer.name": { $regex: query, $options: "i" } },
        { item: { $regex: query, $options: "i" } },
      ];
    }

    // 📅 Date filter
    if (from && to) {
      filter.date = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    } else if (from) {
      filter.date = { $gte: new Date(from) };
    } else if (to) {
      filter.date = { $lte: new Date(to) };
    }

    // 🧾 Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // 📦 Fetch filtered auctions
    const [auctions, totalCount] = await Promise.all([
      EndeavourAuction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      EndeavourAuction.countDocuments(filter),
    ]);

    // 📤 Response
    res.json({
      status: "success",
      total: totalCount,
      totalPages: Math.ceil(totalCount / limitNumber),
      currentPage: pageNumber,
      results: auctions.length,
      auctions,
    });

  } catch (err) {
    console.error("Error fetching Endeavour auctions:", err);
    res.status(500).json({
      status: "error",
      message: "Error fetching auctions",
      error: err.message,
    });
  }
};

// ➤ Single
const getEndeavourAuctionById = async (req, res) => {
  try {
    const auction = await EndeavourAuction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: "Auction not found" });
    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: "Error fetching auction", error: err.message });
  }
};

// ➤ Update
const updateEndeavourAuction = async (req, res) => {
  try {
    const auction = await EndeavourAuction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!auction) return res.status(404).json({ message: "Auction not found" });
    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: "Error updating auction", error: err.message });
  }
};

// ➤ Delete
const deleteEndeavourAuction = async (req, res) => {
  try {
    const auction = await EndeavourAuction.findByIdAndDelete(req.params.id);
    if (!auction) return res.status(404).json({ message: "Auction not found" });
    res.json({ message: "Auction deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting auction", error: err.message });
  }
};

// ➤ Search Students (seller)
const searchStudents = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const sundayClasses = await SundayClass.find({
      "students.member_name": { $regex: query, $options: "i" },
    });

    const students = sundayClasses.flatMap((sc) =>
      sc.students
        .filter((st) => new RegExp(query, "i").test(st.member_name))
        .map((st) => ({
          member_id: st.member_id,
          name: st.member_name,
          tamil_name: st.tamil_name,
          class_name: sc.class_name,
          section_name: sc.section_name,
        }))
    );

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Error searching students", error: err.message });
  }
};

// ➤ Buyer Report
const getEndeavourAuctionReportByBuyer = async (req, res) => {
  try {
    const auctions = await EndeavourAuction.find().lean();
    const buyersMap = {};

    auctions.forEach((a) => {
      const buyer = a.buyer || {};
      const key = buyer.isMember ? buyer.member_id : `PHONE:${buyer.phone}`;
      if (!buyersMap[key]) {
        buyersMap[key] = {
          buyerId: buyer.isMember ? buyer.member_id : null,
          buyerPhone: !buyer.isMember ? buyer.phone : null,
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
    console.error("Endeavour Auction Report error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ➤ Payment
const addEndeavourAuctionPayment = async (req, res) => {
  try {
    const { auctionId, amountPaid } = req.body;

    const auction = await EndeavourAuction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }
 
    const newTotalPaid = (auction.totalPaid || 0) + amountPaid;
    const newBalance = auction.amount - newTotalPaid;

    auction.totalPaid = newTotalPaid;
    auction.balance = newBalance;
    auction.payment_status = newBalance <= 0 ? "Paid" : "Unpaid";

    auction.payments = auction.payments || [];
    auction.payments.push({
      amountPaid,
      date: new Date(),
      balanceAfter: newBalance,
    });

    await auction.save();

    const payment = new EndeavourAuctionPayment({
      endeavourAuctionId: auction._id,
      buyerId: auction.buyer?.member_id || "",
      buyerName: auction.buyer?.name || "Unknown",
      buyerPhone: auction.buyer?.phone || "N/A",
      sellerId: auction.seller?.member_id || "",
      sellerName: auction.seller?.name || "Unknown",
      item: auction.item,
      amountPaid,
      balanceAfter: newBalance,
      date: new Date(),
    });

    await payment.save();

    res.status(201).json({ message: "Payment added successfully", auction, payment });
  } catch (err) {
    console.error("Endeavour Auction Payment error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// const getTeacherAuctionReportByBuyer = async (req, res) => {
//   try {
//     const teacherId = req.params.teacherId; // 👈 get from URL
//     if (!teacherId) {
//       return res.status(401).json({ message: "Unauthorized - no teacher ID" });
//     }

//     // 1. Fetch all students of this teacher
//     const classes = await SundayClass.find({ "teacher.member_id": teacherId });
//     const studentIds = classes.flatMap((cls) =>
//       (cls.students || []).map((s) => s.member_id)
//     );

//     // 2. Fetch all auctions
//     const auctions = await EndeavourAuction.find().lean();

//     // 3. Filter buyers where at least one seller is in teacher’s students
//     const buyersMap = {};
//     auctions.forEach((a) => {
//       if (studentIds.includes(a.seller?.member_id)) {
//         const buyer = a.buyer || {};
//         const key = buyer.isMember ? buyer.member_id : `PHONE:${buyer.phone}`;
//         if (!buyersMap[key]) {
//           buyersMap[key] = {
//             buyerId: buyer.isMember ? buyer.member_id : null,
//             buyerPhone: !buyer.isMember ? buyer.phone : null,
//           };
//         }
//       }
//     });

//     // 4. Build reports only for those filtered buyers
//     const reports = [];
//     for (const key in buyersMap) {
//       const r = await buildBuyerReport(buyersMap[key]);
//       reports.push(r);
//     }

//     res.json(reports);
//   } catch (err) {
//     console.error("Teacher Auction Report error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };





/**
 * Build buyer report for a teacher, including only auctions where seller is in studentIds.
 * @param {{ buyerId?: string, buyerPhone?: string }} buyerInfo
 * @param {string[]} studentIds
 * @returns {Promise<object|null>} report object or null if no matching auctions
 */
async function buildTeacherBuyerReport(buyerInfo, studentIds) {
  // 1) Fetch auctions for this buyer (by member_id or phone)
  const query = [];
  if (buyerInfo.buyerId) query.push({ "buyer.member_id": buyerInfo.buyerId });
  if (buyerInfo.buyerPhone) query.push({ "buyer.phone": buyerInfo.buyerPhone });

  if (query.length === 0) return null;

  const auctions = await EndeavourAuction.find({ $or: query }).lean();

  // 2) Filter auctions to only those where the seller is one of the teacher's students
  const filteredAuctions = auctions.filter((a) =>
    studentIds.includes(a.seller?.member_id)
  );

  // If no auctions remain for this teacher's students, return null so caller can skip it
  if (filteredAuctions.length === 0) return null;

  // 3) Collect auction IDs to limit payments to these auctions
  const auctionIds = filteredAuctions.map((a) => String(a._id));

  // 4) Fetch payments related to these auctions (and optionally filtered by buyer)
  const paymentFilter = {
    endeavourAuctionId: { $in: auctionIds },
  };
  // (buyerId/phone also present in payment docs, but filtering by endeavourAuctionId is most precise)
  const payments = await EndeavourAuctionPayment.find(paymentFilter)
    .sort({ date: 1 })
    .lean();

  // 5) Compute totals (only for filtered auctions & related payments)
  const totalAuctionAmount = filteredAuctions.reduce(
    (sum, a) => sum + (Number(a.amount) || 0),
    0
  );
  const totalPayments = payments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
  const overallUnpaid = totalAuctionAmount - totalPayments;

  // 6) Map auctions for frontend
  const auctionDetails = filteredAuctions.map((a) => ({
    _id: a._id,
    date: a.date,
    item: a.item,
    amount: a.amount,
    sellerId: a.seller?.member_id || "",
    sellerName: a.seller?.member_name || a.seller?.name || "",
    payment_status: a.payment_status || (overallUnpaid <= 0 ? "Paid" : "Unpaid"),
  }));

  // 7) Build buyer display fields (prefer auction buyer info, fallback to payments)
  const buyerName =
    filteredAuctions[0]?.buyer?.name ||
    payments[0]?.buyerName ||
    "Unknown";
  const buyerPhone =
    filteredAuctions[0]?.buyer?.phone ||
    payments[0]?.buyerPhone ||
    buyerInfo.buyerPhone ||
    "";

  return {
    key: buyerInfo.buyerId || `PHONE:${buyerInfo.buyerPhone}`,
    isMember: !!buyerInfo.buyerId,
    buyerId: buyerInfo.buyerId || "",
    buyerName,
    buyerPhone,
    auctions: auctionDetails,
    payments: payments.map((p) => ({
      date: p.date,
      amount: p.amountPaid,
    })),
    overallUnpaid,
  };
}

const getTeacherAuctionReportByBuyer = async (req, res) => {
  try {
    // be flexible: accept teacherId from params (frontend) OR from req.user
    const teacherId = req.params.teacherId || req.user?.member_id;
    if (!teacherId) {
      return res.status(401).json({ message: "Unauthorized - no teacher ID" });
    }

    // 1) Get all students of this teacher
    const classes = await SundayClass.find({ "teacher.member_id": teacherId });
    const studentIds = classes.flatMap((cls) => (cls.students || []).map((s) => s.member_id));

    if (studentIds.length === 0) {
      return res.json([]); // no students -> empty report
    }

    // 2) Fetch all auctions once to discover buyers that bought from these students
    const allAuctions = await EndeavourAuction.find().lean();

    // 3) Build map of buyers who bought from at least one of these students
    const buyersMap = {};
    allAuctions.forEach((a) => {
      if (studentIds.includes(a.seller?.member_id)) {
        const buyer = a.buyer || {};
        const key = buyer.isMember ? buyer.member_id : `PHONE:${buyer.phone}`;
        if (!buyersMap[key]) {
          buyersMap[key] = {
            buyerId: buyer.isMember ? buyer.member_id : null,
            buyerPhone: !buyer.isMember ? buyer.phone : null,
          };
        }
      }
    });

    // 4) Build teacher-specific reports (only auctions/payments related to studentIds)
    const reports = [];
    for (const key in buyersMap) {
      const r = await buildTeacherBuyerReport(buyersMap[key], studentIds);
      if (r) reports.push(r);
    }

    res.json(reports);
  } catch (err) {
    console.error("Teacher Auction Report error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}; 


const getTeacherStudentDues = async (req, res) => {
  try {
    // accept teacherId from params (frontend sends it) or from req.user if you later add middleware
    const teacherId = req.params.teacherId || req.user?.member_id;
    if (!teacherId) {
      return res.status(400).json({ message: "teacherId required" });
    }

    // 1) load classes for this teacher and collect student ids and student meta
    const classes = await SundayClass.find({ "teacher.member_id": teacherId }).lean();
    const studentIds = classes.flatMap((cls) => (cls.students || []).map((s) => s.member_id));

    if (!studentIds.length) return res.json([]);

    // map student -> class/section/name for display
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

    // 2) fetch ALL auctions where buyer is one of these students
    const buyerAuctions = await EndeavourAuction.find({
      "buyer.member_id": { $in: studentIds },
    }).lean();

    if (!buyerAuctions.length) return res.json([]);

    // 3) fetch payments for these auctions (single query)
    const auctionIds = buyerAuctions.map((a) => String(a._id));
    const payments = await EndeavourAuctionPayment.find({
      endeavourAuctionId: { $in: auctionIds },
    }).lean();

    // 4) payments map: sum amountPaid by endeavourAuctionId
    const paymentsByAuction = {};
    payments.forEach((p) => {
      const aid = String(p.endeavourAuctionId);
      paymentsByAuction[aid] = (paymentsByAuction[aid] || 0) + (Number(p.amountPaid) || 0);
    });

    // 5) Build dues grouped by buyer (student). We only include auctions that:
    //    - have a positive balance (amount - paid > 0)
    //    - seller.member_id exists (i.e., seller is a member student)
    //    - seller.member_id is NOT in studentIds (so it's a student of another teacher)
    const duesByBuyer = {};

    buyerAuctions.forEach((a) => {
      const buyerId = a.buyer?.member_id;
      if (!buyerId) return; // skip non-member buyers (we are only listing teacher's students)

      // compute paid amount: prefer auction.totalPaid if present else fall back to payments collection sum
      const totalPaidFromAuction = Number(a.totalPaid || 0);
      const totalPaidFromPayments = paymentsByAuction[String(a._id)] || 0;
      // prefer `totalPaid` if it exists (it should be kept in sync), otherwise use payments sum
      const paid = totalPaidFromAuction > 0 ? totalPaidFromAuction : totalPaidFromPayments;

      const amount = Number(a.amount || 0);
      const balance = amount - paid;
      if (balance <= 0) return; // nothing due here

      const sellerId = a.seller?.member_id || null;
      // require seller to be a student (member) and not a student of the same teacher
      if (!sellerId) return; // seller not a student/member -> skip (you asked for dues to other students)
      if (studentIds.includes(sellerId)) return; // seller is in same teacher's class -> skip

      // ensure buyer entry exists
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

    const result = Object.values(duesByBuyer);

    res.json(result);
  } catch (err) {
    console.error("getTeacherStudentDues error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



module.exports = {
  addEndeavourAuction,
  getEndeavourAuctions,
  getEndeavourAuctionById,
  updateEndeavourAuction,
  deleteEndeavourAuction,
  searchStudents,
  getEndeavourAuctionReportByBuyer,
  addEndeavourAuctionPayment,
  getTeacherAuctionReportByBuyer,
  getTeacherStudentDues,
};
