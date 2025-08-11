const Offerings = require('../Schema/offerSchema');
const Member = require("../Schema/memberSchema");
const Family = require("../Schema/familySchema");
const PastorMember = require("../Schema/pastorSchema");
const PastorFamilyMember = require("../Schema/pastorFamilyMemberSchema");

// Controller functions
const addOffering = async (req, res) => {
  try {
    const { category, member_id, member_name, date, amount, description } = req.body;
    // console.log(req.body);

    let memberData = null; // Declare memberData at the top

    // Fetch member data separately if category is not "NO_Name_Offerings"
    if (category !== "NO_Name_Offerings") {
      // console.log("memberData enter");

      memberData = await PastorMember.findOne({ member_id })
      .select("member_id member_photo member_name") // Ensure member_tamil_name is selected
      .lean();

    // If not found, search in PastorFamilyMember collection
    if (!memberData) {
      memberData = await PastorFamilyMember.findOne({ member_id })
        .select("member_id member_photo member_name") // Ensure member_tamil_name is selected
        .lean();
    }
    if (!memberData) {
      memberData = await Member.findOne({member_id}).select("member_id member_photo member_name").lean(); // Ensure member_tamil_name is selected
    }
      // console.log(memberData);

      if (!memberData) {
        return res.status(404).json({ message: 'Member not found' });
      }
    }

    const newOffering = new Offerings({ category, member_id, member_name,  date, amount, description });
    await newOffering.save();

    // Construct the response object
    let offeringWithPhoto;
    if (category !== "NO_Name_Offerings") {
      offeringWithPhoto = {
        ...newOffering.toObject(), // Convert Mongoose document to plain object
        member_photo: memberData.member_photo, // Only include member_photo if memberData exists
      };
    } else {
      offeringWithPhoto = {
        ...newOffering.toObject(), // Convert Mongoose document to plain object
      };
    }

    // Respond with the modified object
    return res.status(201).json({ message: 'Offering added successfully', offering: offeringWithPhoto });
  } catch (error) {
    // console.log({ error: error.message, error });
    res.status(400).json({ error: error.message });
  }
};


const getDistinctCategories = async (req, res) => {
  try {
    const categories = await Offerings.distinct('category', {
      category: { $ne: "MarriageOfferings"} // Exclude 'MarriageOfferings' category
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getMonthlyTotals = async (req, res) => {
  const { year } = req.query;
// console.log(req.query.year);
  if (!year) {
    return res.status(400).json({ message: 'Year is required' });
  }

  try {
    const pipeline = [
      {
        $match: {
          date: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(Number(year) + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$date' },
          totalAmount: { $sum: '$amount' },
        },
      },
    ];
    
    const expenses = await Offerings.aggregate(pipeline);

    // Create an array to hold the monthly totals
    const monthlyTotals = Array.from({ length: 12 }, (_, i) => ({ month: new Date(year, i, 1).toLocaleString('default', { month: 'short' }), amount: 0 }));

    // Update the monthlyTotals array with aggregated data
    expenses.forEach(expense => {
      const monthIndex = expense._id - 1; // MongoDB months are 1-based
      monthlyTotals[monthIndex].amount = expense.totalAmount;
    });

    res.status(200).json({chartData:monthlyTotals});
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
};


const verifyMember = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Member ID is required" });
    }

    // Search in PastorMember collection
    let member = await PastorMember.findOne({ member_id: id })
      .select("member_id member_photo member_name ") // Ensure member_tamil_name is selected
      .lean();

    // If not found, search in PastorFamilyMember collection
    if (!member) {
      member = await PastorFamilyMember.findOne({ member_id: id })
        .select("member_id member_photo member_name ") // Ensure member_tamil_name is selected
        .lean();
    }
    if (!member) {
       member = await Member.findOne({member_id:id}).select("member_id member_photo member_name ").lean(); // Ensure member_tamil_name is selected
    }

    if (!member) {
      return res
        .status(404)
        .json({ message: "Member not found or details do not match" });
    }

    res.status(200).json({ message: "Member verified successfully", member });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to verify member", error: error.message });
  }
};


const getOfferingsByCategoryAndDate = async (req, res) => {
  try {
    const { category, fromdate, todate, page = 1, limit = 10, search = "", download } = req.query;

    const query = {}; 
    // Filtering by category
    if (category) query.category = category;

    // Filtering by date range
    if (fromdate) query.date = { ...query.date, $gte: new Date(fromdate) };
    if (todate) query.date = { ...query.date, $lte: new Date(todate) };

    const skip = (page - 1) * limit;

    // Get total count of offerings before pagination
    const totalData = await Offerings.countDocuments(query);

    // Query for offerings with sorting
    let offeringsQuery = Offerings.find(query).sort({ createdAt: -1 });

    // If not downloading, apply pagination
    if (!download) {
      offeringsQuery = offeringsQuery.skip(skip).limit(parseInt(limit));
    }

    // Fetch offerings
    let offerings = await offeringsQuery.lean();
    // ✅ Enrich offerings with member_tamil_name if missing
for (let offering of offerings) {
  if (!offering.member_tamil_name) {
    const memberData = await Member.findOne({ member_id: offering.member_id }).select("member_tamil_name");
    if (memberData) {
      offering.member_tamil_name = memberData.member_tamil_name;
    }
  }
}


    // **Calculate totalAmount for all offerings matching the category (without pagination or search)**
    const totalAmount = await Offerings.aggregate([
      { $match: query }, // Match the same query (category and date range)
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }, // Group and sum up the amounts
    ]).then(result => (result[0] ? result[0].totalAmount : 0)); // Get totalAmount or default to 0

    // Apply search on the fetched data
    if (search) {
      const searchNormalized = search.replace(/\s+/g, '').toLowerCase();

      offerings = offerings.filter(item => {
        const memberNameNormalized = item.member_name?.replace(/\s+/g, '').toLowerCase() || "";
        const memberIdNormalized = item.member_id?.toLowerCase() || "";
        const memberTamilNameNormalized = item.member_tamil_name?.replace(/\s+/g, '').toLowerCase() || ""; // NEW: Normalize Tamil name

        return (
          memberIdNormalized.includes(searchNormalized) || 
          memberNameNormalized.includes(searchNormalized) ||
          memberTamilNameNormalized.includes(searchNormalized) // NEW: Include Tamil name in search
        );
      });
    }

    // Count total after search
    const total = offerings.length;

    // Adjust pagination based on filtered results
    if (!download) {
      offerings = offerings.slice(0, limit); // Always return the first `limit` items from filtered results
    }

    // Calculate total pages based on `totalData`
    const totalPages = download ? 1 : Math.ceil(totalData / limit);

    // Return the response
    res.status(200).json({
      offerings,
      total, // Total offerings after search
      totalData, // Total offerings before search
      totalAmount, // Total amount for all offerings matching the category
      currentPage: download ? 1 : parseInt(page),
      totalPages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getMarriageOfferingsByCategoryAndDate = async (req, res) => {
  try {
    const { category, fromdate, todate, page = 1, limit = 10, search = "", download } = req.query;

    const query = {}; 

    // Filtering by category
    if (category) query.category = category;

    // Filtering by date range
    if (fromdate) query.date = { ...query.date, $gte: new Date(fromdate) };
    if (todate) query.date = { ...query.date, $lte: new Date(todate) };

    const skip = (page - 1) * limit;

    // Get total count of offerings before pagination
    const totalData = await Offerings.countDocuments(query);

    // Query for offerings with sorting
    let offeringsQuery = Offerings.find(query).sort({ createdAt: -1 });

    // If not downloading, apply pagination
    if (!download) {
      offeringsQuery = offeringsQuery.skip(skip).limit(parseInt(limit));
    }

    // Fetch offerings already written earlier
    // let offerings = await offeringsQuery.lean();

    // // **Find and add the wife’s name and Tamil name for each offering**
    // for (let offering of offerings) {
    //   const family = await Family.findOne({ head: offering.member_id },);

    //   if (family) {
    //     const wife = family.members.find(member => member.relationship_with_family_head === "Wife");

    //     if (wife) {
    //       const wifeDetails = await Member.findOne({ member_id: wife.ref_id })
    //             .select("member_name member_tamil_name"); // <--- CRITICAL: Ensure member_tamil_name is selected here

    //       if (wifeDetails) {
    //         offering.member_wife = wifeDetails.member_name; 
    //         offering.member_wife_tamil_name = wifeDetails.member_tamil_name; // Assign wife's Tamil name
    //       }
    //     }
    //   }
    // }



let offerings = await offeringsQuery.lean();

// ✅ Enrich each offering with both wife and husband Tamil names
for (let offering of offerings) {
  // 🔍 Fetch family and find wife
  const family = await Family.findOne({ head: offering.member_id });

  if (family) {
    const wife = family.members.find(member => member.relationship_with_family_head === "Wife");

    if (wife) {
      const wifeDetails = await Member.findOne({ member_id: wife.ref_id })
        .select("member_name member_tamil_name");

      if (wifeDetails) {
        offering.member_wife = wifeDetails.member_name;
        offering.member_wife_tamil_name = wifeDetails.member_tamil_name;
      }
    }
  }

  // ✅ Ensure husband's Tamil name is populated
  if (!offering.member_tamil_name) {
    const husband = await Member.findOne({ member_id: offering.member_id }).select("member_tamil_name");
    if (husband) {
      offering.member_tamil_name = husband.member_tamil_name;
    }
  }

  // ✅ Optionally ensure husband's English name too
  if (!offering.member_name) {
    const husband = await Member.findOne({ member_id: offering.member_id }).select("member_name");
    if (husband) {
      offering.member_name = husband.member_name;
    }
  }
}




    // **Calculate totalAmount for all offerings matching the category (without pagination or search)**
    const totalAmount = await Offerings.aggregate([
      { $match: query }, 
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }, 
    ]).then(result => (result[0] ? result[0].totalAmount : 0)); 

    // Apply search on the fetched data
    if (search) {
      const searchNormalized = search.replace(/\s+/g, '').toLowerCase();

      offerings = offerings.filter(item => {
        const memberNameNormalized = item.member_name?.replace(/\s+/g, '').toLowerCase() || "";
        const memberIdNormalized = item.member_id?.toLowerCase() || "";
        const memberTamilNameNormalized = item.member_tamil_name?.replace(/\s+/g, '').toLowerCase() || ""; 
        const memberWifeNameNormalized = item.member_wife?.replace(/\s+/g, '').toLowerCase() || ""; 
        const memberWifeTamilNameNormalized = item.member_wife_tamil_name?.replace(/\s+/g, '').toLowerCase() || ""; 

        return (
          memberIdNormalized.includes(searchNormalized) || 
          memberNameNormalized.includes(searchNormalized) ||
          memberTamilNameNormalized.includes(searchNormalized) || 
          memberWifeNameNormalized.includes(searchNormalized) || 
          memberWifeTamilNameNormalized.includes(searchNormalized) 
        );
      });
    }

    // Count total after search
    const total = offerings.length;

    // Adjust pagination based on filtered results
    if (!download) {
      offerings = offerings.slice(0, limit); 
    }

    // Calculate total pages based on `totalData`
    const totalPages = download ? 1 : Math.ceil(totalData / limit);

    // Return the response
    res.status(200).json({
      offerings,
      total, 
      totalData, 
      totalAmount, 
      currentPage: download ? 1 : parseInt(page),
      totalPages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ Get all offerings by an array of member_ids (used in BillPreview)
const getOfferingsByMemberIds = async (req, res) => {
  try {
    const { memberIds } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "memberIds must be a non-empty array" });
    }

    // Fetch all offerings for the given members
    const offerings = await Offerings.find({ member_id: { $in: memberIds } }).lean();

    // Optionally: Enrich each offering with Tamil name if missing
    for (let offering of offerings) {
      if (!offering.member_tamil_name) {
        const member = await Member.findOne({ member_id: offering.member_id }).select("member_tamil_name");
        if (member) {
          offering.member_tamil_name = member.member_tamil_name;
        }
      }
    }

    res.json(offerings);
  } catch (error) {
    console.error("Error in getOfferingsByMemberIds:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const getFamilyHeadsWithOfferings = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 15, fromdate, todate } = req.query;
    const skip = (page - 1) * limit;

    let dateFilter = {};
    if (fromdate) dateFilter.$gte = new Date(fromdate);
    if (todate) dateFilter.$lte = new Date(todate);

    const familyFilter = {};
    if (search) {
      const regex = new RegExp(search, "i");
      familyFilter["$or"] = [
        { "head": { $regex: regex } },
        { "family_id": { $regex: regex } },
        { "members.member_name": { $regex: regex } },
        { "members.member_tamil_name": { $regex: regex } }
      ];
    }

    // Aggregate families with at least one offering by any member
    // const families = await Family.aggregate([
    //   { $unwind: "$members" },
    //   {
    //     $lookup: {
    //       from: "offerings",
    //       localField: "members.ref_id",
    //       foreignField: "member_id",
    //       as: "member_offerings"
    //     }
    //   },
    //   { $match: { "member_offerings.0": { $exists: true } } },
    //   { $match: familyFilter },
    //   {
    //     $group: {
    //       _id: "$family_id",
    //       head: { $first: "$head" },
    //       family_id: { $first: "$family_id" },
    //       latestOfferingDate: { $max: "$member_offerings.date" } ,
    //     }
    //   },
    //   { $sort: { latestOfferingDate: -1 } },
    //   { $skip: skip },
    //   { $limit: Number(limit) },
    // ]);
    const families = await Family.aggregate([
  { $unwind: "$members" },
  {
        $lookup: {
          from: "offerings",
          let: { refId: "$members.ref_id" },
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: { $eq: ["$member_id", "$$refId"] } },
                  ...(fromdate || todate ? [{ date: dateFilter }] : [])
                ]
              }
            },
            { $sort: { createdAt: -1 } }
          ],
          as: "member_offerings"
        }
      },
      { $match: { "member_offerings.0": { $exists: true } } },
      { $match: familyFilter },
  {
    $addFields: {
      latestCreatedOffering: { $first: "$member_offerings" }
    }
  },
  {
    $group: {
      _id: "$family_id",
      head: { $first: "$head" },
      family_id: { $first: "$family_id" },
      latestOfferingCreatedAt: { $max: "$latestCreatedOffering.createdAt" }
    }
  },
  { $sort: { latestOfferingCreatedAt: -1 } },
  { $skip: skip },
  { $limit: Number(limit) }
]);


    const headIds = families.map(f => f.head);
    const headMembers = await Member.find({ member_id: { $in: headIds } })
      .select("member_id member_name member_tamil_name");

    const headMap = {};
    headMembers.forEach(h => {
      headMap[h.member_id] = h;
    });

    const familyHeads = families.map(fam => {
  const headInfo = headMap[fam.head] || {};
  return {
    family_id: fam.family_id,
    head: fam.head,
    member_id: headInfo.member_id || "",
    member_name: headInfo.member_name || "",
    member_tamil_name: headInfo.member_tamil_name || "",
    latestOfferingDate: fam.latestOfferingCreatedAt || null,
  };
});


    const total = await Family.aggregate([
      { $unwind: "$members" },
      {
        $lookup: {
          from: "offerings",
          localField: "members.ref_id",
          foreignField: "member_id",
          as: "member_offerings"
        }
      },
      { $match: { "member_offerings.0": { $exists: true } } },
      { $match: familyFilter },
      {
        $group: {
          _id: "$family_id"
        }
      }
    ]).then(res => res.length);

    return res.status(200).json({
      familyHeads,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    console.error("Error fetching family heads:", error);
    res.status(500).json({ error: error.message });
  }
};


const getSortedFamilyHeads = async (req, res) => {
  try {
    const { page = 1, limit = 15, search = "" } = req.query;
    const skip = (page - 1) * limit;

    // Step 1: Get latest offering date for each family
    const latestOfferings = await Offerings.aggregate([
      {
        $sort: { date: -1 }
      },
      {
        $group: {
          _id: "$family_id",
          latestDate: { $first: "$date" }
        }
      },
      {
        $sort: { latestDate: -1 }
      }
    ]);

    const sortedFamilyIds = latestOfferings.map(item => item._id);

    // Step 2: Fetch family heads (with optional search)
    const query = search
      ? {
          $or: [
            { member_name: { $regex: search, $options: "i" } },
            { member_tamil_name: { $regex: search, $options: "i" } },
            { family_id: { $regex: search, $options: "i" } },
          ],
          relation: "Head",
        }
      : { relation: "Head" };

    const allHeads = await Members.find(query).lean();

    // Step 3: Join offering dates
    const enrichedHeads = allHeads.map((head) => {
      const offer = latestOfferings.find((o) => o._id === head.family_id);
      return {
        ...head,
        latestOfferingDate: offer ? offer.latestDate : null,
      };
    });

    // Step 4: Sort again in case some heads were not in latestOfferings
    enrichedHeads.sort((a, b) => {
      const dateA = new Date(a.latestOfferingDate || 0);
      const dateB = new Date(b.latestOfferingDate || 0);
      return dateB - dateA;
    });

    // Step 5: Pagination
    const paginated = enrichedHeads.slice(skip, skip + parseInt(limit));

    res.json({
      familyHeads: paginated,
      total: enrichedHeads.length,
      totalPages: Math.ceil(enrichedHeads.length / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error("Error in getSortedFamilyHeads:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


// ✅ Get Overall Offerings Grouped by Family
// controllers/Offerings.js

// const getOverallFamilyOfferings = async (req, res) => {
//   try {
//     const { page = 1, limit = 15, fromdate, todate, search = "" } = req.query;
//     const skip = (page - 1) * limit;

//     let dateFilter = {};
//     if (fromdate) dateFilter.$gte = new Date(fromdate);
//     if (todate) dateFilter.$lte = new Date(todate);


//     const familyQuery = search
//   ? {
//       $or: [
//         { family_id: { $regex: search, $options: "i" } },
//         { head: { $regex: search, $options: "i" } }
//       ]
//     }
//   : {};

// const allFamilies = await Family.find(familyQuery).lean();

//     const filteredFamilies = [];

//     for (const family of allFamilies) {
//       const headId = family.head;

//       const headDetails = await Member.findOne({ member_id: headId }).lean();
//       if (!headDetails) continue;

//       const memberIds = [headId, ...family.members.map((m) => m.ref_id)];

//       const allMembers = await Member.find({
//         member_id: { $in: memberIds },
//       }).lean();

//       // ✅ Get the most recent offering based on createdAt
//       const latestOffering = await Offerings.findOne({
//         member_id: { $in: memberIds },
//         ...(fromdate || todate ? { date: dateFilter } : {})
//       })
//         .sort({ createdAt: -1 }) // Most precise timestamp-based sorting
//         .lean();

//       if (!latestOffering) continue;

//       const latestOfferingDate = latestOffering.createdAt;

//       // ✅ Fetch all offerings for members
//       const offerings = await Offerings.find({
//         member_id: { $in: memberIds },
//         ...(fromdate || todate ? { date: dateFilter } : {})
//       }).lean();

      
//       // const memberOfferingMap = {};
//       // for (const member of allMembers) {
//       //   memberOfferingMap[member.member_id] = {
//       //     ...member,
//       //     offerings: offerings.filter(
//       //       (o) => o.member_id === member.member_id
//       //     ),
//       //   };
//       // }

//       const memberOfferingMap = {};
//       for (const member of allMembers) {
//         const relationEntry = family.members.find(m => m.ref_id === member.member_id);
//         const relation = headId === member.member_id ? "Head" : relationEntry?.relationship_with_family_head || "";

//         memberOfferingMap[member.member_id] = {
//           ...member,
//           relation,
//           offerings: offerings.filter(
//             (o) => o.member_id === member.member_id
//           ),
//         };
//       }

//       filteredFamilies.push({
//         family_id: family.family_id,
//         head: headDetails.member_id,
//         member_name: headDetails.member_name,
//         member_tamil_name: headDetails.member_tamil_name,
//         latestOfferingDate,
//         members: Object.values(memberOfferingMap),
//       });
//     }

//     // ✅ Sort all families globally BEFORE pagination
//     filteredFamilies.sort(
//       (a, b) =>
//         new Date(b.latestOfferingDate) - new Date(a.latestOfferingDate)
//     );

//     // ✅ Now paginate
//     const total = filteredFamilies.length;
//     const totalPages = Math.ceil(total / limit);
//     const paginatedData = filteredFamilies.slice(
//       skip,
//       skip + parseInt(limit)
//     );

//     res.status(200).json({
//       data: paginatedData,
//       total,
//       totalPages,
//       currentPage: parseInt(page),
//     });
//   } catch (err) {
//     console.error("Error in getOverallFamilyOfferings:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };


const getOverallFamilyOfferings = async (req, res) => {
  try {
    const { page = 1, limit = 15, fromdate, todate, search = "" } = req.query;
    const skip = (page - 1) * limit;

    let dateFilter = {};
    if (fromdate) dateFilter.$gte = new Date(fromdate);
    if (todate) dateFilter.$lte = new Date(todate);

    const familyQuery = search
      ? {
          $or: [
            { family_id: { $regex: search, $options: "i" } },
            { head: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // ✅ Get all families and all family heads
    const allFamilies = await Family.find(familyQuery).lean();
    const allFamilyHeads = await Family.find().lean();
    const allFamilyHeadIds = allFamilyHeads.map(f => f.head); // list of member_ids who are now heads

    const filteredFamilies = [];

    for (const family of allFamilies) {
      const headId = family.head;

      const headDetails = await Member.findOne({ member_id: headId }).lean();
      if (!headDetails) continue;

      // ✅ Filter out members who are now heads of other families
      const validMembers = family.members
        .map(m => m.ref_id)
        .filter(refId => !allFamilyHeadIds.includes(refId)); // remove future heads

      const memberIds = [headId, ...validMembers];

      const allMembers = await Member.find({
        member_id: { $in: memberIds },
      }).lean();

      const latestOffering = await Offerings.findOne({
        member_id: { $in: memberIds },
        ...(fromdate || todate ? { date: dateFilter } : {})
      })
        .sort({ createdAt: -1 })
        .lean();

      if (!latestOffering) continue;

      const latestOfferingDate = latestOffering.createdAt;

      const offerings = await Offerings.find({
        member_id: { $in: memberIds },
        ...(fromdate || todate ? { date: dateFilter } : {})
      }).lean();

      const memberOfferingMap = {};
      for (const member of allMembers) {
        const relationEntry = family.members.find(m => m.ref_id === member.member_id);
        const relation = headId === member.member_id ? "Head" : relationEntry?.relationship_with_family_head || "";

        memberOfferingMap[member.member_id] = {
          ...member,
          relation,
          offerings: offerings.filter(o => o.member_id === member.member_id),
        };
      }

      filteredFamilies.push({
        family_id: family.family_id,
        head: headDetails.member_id,
        member_name: headDetails.member_name,
        member_tamil_name: headDetails.member_tamil_name,
        latestOfferingDate,
        members: Object.values(memberOfferingMap),
      });
    }

    filteredFamilies.sort((a, b) => new Date(b.latestOfferingDate) - new Date(a.latestOfferingDate));

    const total = filteredFamilies.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedData = filteredFamilies.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      data: paginatedData,
      total,
      totalPages,
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error("Error in getOverallFamilyOfferings:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};










module.exports = {
  addOffering,
  getMonthlyTotals,
  getDistinctCategories,
  getMarriageOfferingsByCategoryAndDate,
  verifyMember,
  getOfferingsByCategoryAndDate,
  getOfferingsByMemberIds,
  getFamilyHeadsWithOfferings,
  getSortedFamilyHeads,
  getOverallFamilyOfferings,

};
