
const Subscription = require("../Schema/Subscription");
const HarvestAuction = require("../Schema/HarvestAuction");
const HarvestAuctionPayment = require("../Schema/HarvestAuctionPayment");

// ➤ Add or Update Subscription (per month inside year doc)
// exports.addSubscription = async (req, res) => {
//   try {
//     const { member_id, member_name, date, contributions } = req.body;
//     if (!member_id || !member_name || !date) {
//       return res.status(400).json({ message: "Member ID, Name, and Date are required" });
//     }

//     const d = new Date(date);
//     const month = d.toLocaleString("en-US", { month: "long" }).toLowerCase(); // e.g. "july"
//     const year = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1; 
//     // If Apr–Dec → same year, if Jan–Mar → previous year (financial year start)

//     // 1️⃣ Find or create subscription doc for this member/year
//     let subscription = await Subscription.findOne({ member_id, year });
//     if (!subscription) {
//       subscription = new Subscription({ member_id, member_name, year });
//     }

//     // 2️⃣ Set that month’s contributions
//     subscription[month] = { date: d, ...contributions };
//     await subscription.save();

//     // 3️⃣ Handle Harvest Auction if any
//     const harvestAmount = Number(contributions.harvestAuction || 0);
//     if (harvestAmount > 0) {
//       const unpaidAuctions = await HarvestAuction.find({
//         buyerId: member_id,
//         balance: { $gt: 0 },
//       }).sort({ date: 1 });

//       let remainingAmount = harvestAmount;
//       for (const auction of unpaidAuctions) {
//         if (remainingAmount <= 0) break;

//         const payAmount = Math.min(remainingAmount, auction.balance);

//         auction.totalPaid = (auction.totalPaid || 0) + payAmount;
//         auction.balance = auction.amount - auction.totalPaid;
//         auction.payment_status = auction.balance <= 0 ? "Paid" : "Unpaid";
//         auction.payments = auction.payments || [];
//         auction.payments.push({
//           amountPaid: payAmount,
//           date: new Date(),
//           balanceAfter: auction.balance,
//         });

//         await auction.save();

//         const paymentRecord = new HarvestAuctionPayment({
//           harvestAuctionId: auction._id,
//           buyerId: auction.buyerId,
//           buyerName: auction.buyerName,
//           buyerPhone: auction.buyerPhone || "N/A",
//           sellerId: auction.sellerId || "",
//           sellerName: auction.sellerName || "",
//           item: auction.item,
//           amountPaid: payAmount,
//           balanceAfter: auction.balance,
//           date: new Date(),
//         });

//         await paymentRecord.save();
//         remainingAmount -= payAmount;
//       }
//     }

//     res.status(201).json({ message: "Subscription saved successfully", subscription });
//   } catch (err) {
//     console.error("Subscription error:", err);
//     res.status(500).json({ message: "Failed to save subscription", error: err.message });
//   }
// };

// ➤ Add or Update Subscription (per month inside year doc)
exports.addSubscription = async (req, res) => {
  try {
    const { member_id, member_name, date, contributions } = req.body;
    if (!member_id || !member_name || !date) {
      return res.status(400).json({ message: "Member ID, Name, and Date are required" });
    }

    const d = new Date(date);
    const month = d.toLocaleString("en-US", { month: "long" }).toLowerCase(); // e.g. "july"
    const year = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1; 
    // Financial year (Apr–Mar)

    // 1️⃣ Find or create subscription doc for this member/year
    let subscription = await Subscription.findOne({ member_id, year });

    // 🧠 Check if already exists for that month
    if (subscription && subscription[month] && Object.keys(subscription[month]).length > 0) {
      return res.status(400).json({
        message: `Subscription for ${month.charAt(0).toUpperCase() + month.slice(1)} ${year} is already added for this member.`,
      });
    }

    // 2️⃣ If not found, create new subscription record
    if (!subscription) {
      subscription = new Subscription({ member_id, member_name, year });
    }

    // 3️⃣ Add the new month’s contribution
    subscription[month] = { date: d, ...contributions };
    await subscription.save();

    // 4️⃣ Handle Harvest Auction if any
    const harvestAmount = Number(contributions.harvestAuction || 0);
    if (harvestAmount > 0) {
      const unpaidAuctions = await HarvestAuction.find({
        buyerId: member_id,
        balance: { $gt: 0 },
      }).sort({ date: 1 });

      let remainingAmount = harvestAmount;
      for (const auction of unpaidAuctions) {
        if (remainingAmount <= 0) break;

        const payAmount = Math.min(remainingAmount, auction.balance);

        auction.totalPaid = (auction.totalPaid || 0) + payAmount;
        auction.balance = auction.amount - auction.totalPaid;
        auction.payment_status = auction.balance <= 0 ? "Paid" : "Unpaid";
        auction.payments = auction.payments || [];
        auction.payments.push({
          amountPaid: payAmount,
          date: new Date(),
          balanceAfter: auction.balance,
        });

        await auction.save();

        const paymentRecord = new HarvestAuctionPayment({
          harvestAuctionId: auction._id,
          buyerId: auction.buyerId,
          buyerName: auction.buyerName,
          buyerPhone: auction.buyerPhone || "N/A",
          sellerId: auction.sellerId || "",
          sellerName: auction.sellerName || "",
          item: auction.item,
          amountPaid: payAmount,
          balanceAfter: auction.balance,
          date: new Date(),
        });

        await paymentRecord.save();
        remainingAmount -= payAmount;
      }
    }

    res.status(201).json({
      message: `Subscription for ${month.charAt(0).toUpperCase() + month.slice(1)} ${year} saved successfully`,
      subscription,
    });
  } catch (err) {
    console.error("Subscription error:", err);
    res.status(500).json({
      message: "Failed to save subscription",
      error: err.message,
    });
  }
};

// // ➤ Get subscriber overview (latest financial year record)
// exports.getSubscribers = async (req, res) => {
//   try {
//     const subscribers = await Subscription.aggregate([
//       { $sort: { updatedAt: -1 } },
//       {
//         $group: {
//           _id: "$member_id",
//           member_id: { $first: "$member_id" },
//           member_name: { $first: "$member_name" },
//           year: { $first: "$year" },
//         },
//       },
//       { $project: { _id: 0, member_id: 1, member_name: 1, year: 1 } },
//       { $sort: { member_name: 1 } },
//     ]);

//     res.json(subscribers);
//   } catch (err) {
//     console.error("Get Subscribers error:", err);
//     res.status(500).json({ message: "Failed to fetch subscribers", error: err.message });
//   }
// };


exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscription.aggregate([
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: "$member_id",
          member_id: { $first: "$member_id" },
          member_name: { $first: "$member_name" },
          year: { $first: "$year" },
        },
      },
      // ✅ Lookup from Members collection
      {
        $lookup: {
          from: "members",               // collection name in MongoDB
          localField: "member_id",
          foreignField: "member_id",
          as: "memberInfo"
        }
      },
      { $unwind: { path: "$memberInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          member_id: 1,
          member_name: 1,
          year: 1,
          member_type: "$memberInfo.member_type" // ✅ include member_type
        }
      },
      { $sort: { member_name: 1 } },
    ]);

    res.json(subscribers);
  } catch (err) {
    console.error("Get Subscribers error:", err);
    res.status(500).json({ message: "Failed to fetch subscribers", error: err.message });
  }
};

// ➤ Get all subscriptions for a member (Apr–Mar for selected year)
exports.getMemberSubscriptions = async (req, res) => {
  try {
    const { member_id } = req.query;
    if (!member_id) {
      return res.status(400).json({ message: "member_id is required" });
    }

    // fetch all subscriptions for this member across years
    const subscriptions = await Subscription.find({ member_id }).sort({ year: 1 });

    if (!subscriptions.length) {
      return res.json({
        member_id,
        member_name: "Unknown",
        years: [],
      });
    }

    const months = [
      "april","may","june","july","august","september",
      "october","november","december","january","february","march"
    ];

    const result = subscriptions.map((sub) => {
      const yearData = {};
      months.forEach((month) => {
        yearData[month] = sub[month] || { harvestAuction: 0 };
      });
      return {
        year: sub.year,
        member_id: sub.member_id,
        member_name: sub.member_name,
        months: yearData,
      };
    });

    res.json(result);

  } catch (err) {
    console.error("Get Member Subscriptions error:", err);
    res.status(500).json({ message: "Failed to fetch member subscriptions", error: err.message });
  }
};


exports.checkSubscription = async (req, res) => {
  try {
    const { member_id, date } = req.body;
    if (!member_id || !date) return res.status(400).json({ message: "Member ID and Date are required" });

    const d = new Date(date);
    const month = d.toLocaleString("en-US", { month: "long" }).toLowerCase();
    const year = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;

    const subscription = await Subscription.findOne({ member_id, year });
    const exists = subscription && subscription[month];
    const monthName = d.toLocaleString("en-US", { month: "long" });

    res.json({ exists: !!exists, month: monthName, year });
  } catch (err) {
    console.error("Check subscription error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
