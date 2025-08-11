const Member = require("../Schema/memberSchema");
const Family = require("../Schema/familySchema");
const generateMemberCode = require("../util/MemberCodeGenerate");
const generateFamilyCode = require("../util/FamilyId");
const path = require("path");

exports.SingleGetMemberById = async (req, res) => {
  try {
    const member = await Member.findOne({ member_id: req.params.id }).lean();

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    let familyMembers;
    if (member.secondary_family_id !== null) {
      familyMembers = await Family.findOne({
        family_id: member.secondary_family_id,
      }).select("head members");
    } else if (member.primary_family_id !== null) {
      familyMembers = await Family.findOne({
        family_id: member.primary_family_id,
      }).select("head members");
    }

    if (familyMembers !== null) {
      if (familyMembers.head === req.params.id) {
        member.family_head = true;
      } else {
        for (const family of familyMembers.members) {
          if (family.ref_id === req.params.id) {
            member.relationship_with_family_head =
              family.relationship_with_family_head;
          }
        }
        const member_head = await Member.findOne({
          member_id: familyMembers.head,
        })
          .select("member_name")
          .lean();
        if (!member_head) {
          return res.status(404).json({ message: "Member Head not found" });
        }
        member.family_head_name = member_head.member_name;
      }
    }
    return res.status(200).json(member);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch member", error: error.message });
  }
};


exports.UpdateMemberById = async (req, res) => {
  const id = req.params.id;

  try {
    const member = await Member.findOne({ member_id: id }).lean();
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Handle member photo update
    if (req.file) {
      req.body.member_photo = `/uploads/${req.file.filename}`;
    } else {
      delete req.body.member_photo;
    }

    // Check and handle marriage date and family head
    if (req.body.marriage_date) {
      if (req.body.gender !== "Female") {
        const familyMembers = await Family.find({ head: id });

        if (familyMembers.length === 0) {
          const family_id = await generateFamilyCode();
          const newFamily = new Family({ family_id, head: id, members: [] });
          await newFamily.save();

          req.body.secondary_family_id = family_id;
        }

        await Member.findOneAndUpdate({ member_id: id }, { ...req.body });
      } else if (req.body.new_family === "true") {
        const familyMembers = await Family.find({ head: id });

        if (familyMembers.length === 0) {
          const family_id = await generateFamilyCode();
          const newFamily = new Family({ family_id, head: id, members: [] });
          await newFamily.save();

          req.body.left_date = null;
          req.body.reason_for_inactive = null;
          req.body.description = null;
          req.body.secondary_family_id = family_id;
        }
      }
    }

    await Member.findOneAndUpdate({ member_id: id }, { ...req.body });

    return res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Error updating member:", error);
    return res.status(500).json({ message: "Failed to update member", error: error.message });
  }
};



exports.getMembers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const search = req.query.search || "";
  const status = req.query.status || "";


  try {
    const filter = {};
    if (search) {
      filter.$or = [
        { member_name: new RegExp(search, "i") },
        { member_tamil_name: new RegExp(search, "i") }, // Added for search
        { member_id: new RegExp(search, "i") },
        { family_head_name: new RegExp(search, "i") },
        { primary_family_id: new RegExp(search, "i") },
        { secondary_family_id: new RegExp(search, "i") },
        { status: new RegExp(search, "i") },
      ];
    }

    if (status) {
      filter.status = status; // Apply status filtering
    }

    const memberData = await Member.find(filter)
      .sort({ _id: 1 })
      .select(
        "member_id primary_family_id secondary_family_id member_name member_tamil_name status" // <-- ADDED 'member_tamil_name' here
      )
      .skip((page - 1) * limit)
      .limit(limit);

    const totalItems = await Member.countDocuments(filter);
    const TotalPages = Math.ceil(totalItems / limit);

    let RegisteredData = [];

    for (const member of memberData) {
      const familyMembers = await Family.findOne({
        $or: [
          { family_id: member.secondary_family_id },
          { family_id: member.primary_family_id },
        ],
      }).select("family_id head");

      const familyHead = await Member.findOne({
        member_id: familyMembers.head,
      }).select("member_name");

      if (familyMembers && familyHead) {
        RegisteredData.push({
          member_id: member.member_id,
          member_name: member.member_name,
          member_tamil_name: member.member_tamil_name, // <-- ADDED this line
          family_id: familyMembers.family_id,
          family_head_name: familyHead.member_name,
          status: member.status,
        });
      }
    }

    return res.json({
      message: "Get Member Data Successful",
      RegisteredData,
      totalItems,
      TotalPages,
      currentPage: page,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch members", error: error.message });
  }
};


// exports.getMembers = async (req, res) => {
//     console.log("******** getMembers function IS RUNNING ********"); // IMPORTANT: This line should appear!
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 15;
//     const status = req.query.status || "";
//     const search = req.query.search || "";

//     try {
//         if (search === "") {
//             const familyData = await Family.find()
//                 .sort({ _id: 1 })
//                 .select("family_id head")
//                 .skip((page - 1) * limit)
//                 .limit(limit);

//             let RegisteredData = [];

//             for (const family of familyData) {
//                 console.log("DEBUG: Processing family:", family.family_id, "with head:", family.head);

//                 const familyMembers = await Member.findOne({
//                     member_id: family.head,
//                     ...(status && { status }),
//                 }).select(
//                     "member_id primary_family_id secondary_family_id member_name member_tamil_name status"
//                 );

//                 // --- DEBUGGING LINE: This is the MOST IMPORTANT line. Check its output carefully! ---
//                 console.log("DEBUG: Found familyMembers for head " + family.head + ":", familyMembers);

//                 if (familyMembers) {
//                     RegisteredData.push({
//                         _id: familyMembers._id,
//                         family_id: family.family_id,
//                         head: family.head,
//                         member_name: familyMembers.member_name,
//                         member_tamil_name: familyMembers.member_tamil_name,
//                         status: familyMembers.status,
//                     });
//                 }
//                 console.log("DEBUG: Added to RegisteredData (one item):", RegisteredData[RegisteredData.length - 1]);
//             }

//             const totalItems = await Family.countDocuments();
//             const TotalPages = Math.ceil(totalItems / limit);

//             console.log("DEBUG: Final RegisteredData array before sending:", RegisteredData);

//             return res.json({
//                 message: "Get Member Data Successful",
//                 RegisteredData,
//                 totalItems,
//                 TotalPages,
//                 currentPage: page,
//             });
//         } else {
//             // If you are using the search bar, this path will be executed.
//             // We need to add similar console.logs here if the issue is with search.
//             // For now, assume the primary issue is the non-search path.
//             const familyFilter = {};
//             if (search) {
//                 const searchRegex = new RegExp(search.replace(/\s/g, ""), "i");
//                 familyFilter.$or = [
//                     { member_name: { $regex: searchRegex } },
//                     { member_tamil_name: { $regex: searchRegex } },
//                     { member_id: { $regex: searchRegex } },
//                     { primary_family_id: { $regex: searchRegex } },
//                     { secondary_family_id: { $regex: searchRegex } },
//                 ];
//             }
//             if (status) {
//                 familyFilter.status = status;
//             }

//             const familyData = await Member.aggregate([
//                 { $addFields: {
//                     member_name_no_space: { $replaceAll: { input: "$member_name", find: " ", replacement: "", }, },
//                     member_tamil_name_no_space: { $replaceAll: { input: "$member_tamil_name", find: " ", replacement: "", }, },
//                 },
//                 },
//                 { $match: familyFilter },
//                 { $sort: { _id: 1 } },
//                 { $skip: (page - 1) * limit },
//                 { $limit: limit },
//                 { $lookup: {
//                     from: "familylists", // Ensure the correct collection name
//                     localField: "member_id",
//                     foreignField: "head",
//                     as: "familyDetails",
//                 },
//                 },
//                 { $unwind: "$familyDetails" },
//                 { $project: {
//                     member_id: 1,
//                     member_name: 1,
//                     member_tamil_name: 1,
//                     status: 1,
//                     "familyDetails.family_id": 1,
//                     "familyDetails.head": 1,
//                 },
//                 },
//             ]);

//             console.log("DEBUG: Aggregated familyData (search path):", familyData);

//             const RegisteredData = familyData.map((family) => ({
//                 _id: family._id,
//                 family_id: family.familyDetails.family_id,
//                 head: family.familyDetails.head,
//                 member_name: family.member_name,
//                 member_tamil_name: family.member_tamil_name,
//                 status: family.status,
//             }));

//             console.log("DEBUG: Final RegisteredData array before sending (search path):", RegisteredData);

//             const totalItems = await Member.countDocuments(familyFilter);
//             const TotalPages = Math.ceil(totalItems / limit);

//             return res.json({
//                 message: "Get Family Data Successful",
//                 RegisteredData,
//                 totalItems,
//                 TotalPages,
//                 currentPage: page,
//             });
//         }
//     } catch (error) {
//         console.error("Error in getMembers:", error.message, error.stack);
//         return res
//             .status(500)
//             .json({ message: "Failed to fetch members", error: error.message });
//     }
// };

exports.downloadMembers = async (req, res) => {
  try {
    const status = req.query.status || "";
    const filter = {};

    if (status) {
      filter.status = status;
    }

    // Fetch all members based on the filter
    const memberData = await Member.find(filter)
      .sort({ _id: 1 })
      .select("member_id primary_family_id secondary_family_id member_name member_tamil_name status"); // <-- ADDED 'member_tamil_name' here

    // Extract all family IDs and heads for a single batch query
    const familyIds = memberData.reduce((ids, member) => {
      if (member.primary_family_id) ids.push(member.primary_family_id);
      if (member.secondary_family_id) ids.push(member.secondary_family_id);
      return ids;
    }, []);

    const familyData = await Family.find({ family_id: { $in: familyIds } }).select("family_id head");

    const headIds = familyData.map((family) => family.head);
    const familyHeads = await Member.find({ member_id: { $in: headIds } }).select("member_id member_name");

    // Create a map for faster lookup
    const familyMap = familyData.reduce((map, family) => {
      map[family.family_id] = family.head;
      return map;
    }, {});

    const headMap = familyHeads.reduce((map, head) => {
      map[head.member_id] = head.member_name;
      return map;
    }, {});

    // Build the final response
    const RegisteredData = memberData.map((member) => {
      const primaryFamilyId = member.primary_family_id;
      const secondaryFamilyId = member.secondary_family_id;
      const familyHeadId =
        familyMap[primaryFamilyId] || familyMap[secondaryFamilyId] || null;
      const familyHeadName = familyHeadId ? headMap[familyHeadId] : null;

      return {
        member_id: member.member_id,
        member_name: member.member_name,
        member_tamil_name: member.member_tamil_name, // <-- ADDED this line
        family_id: primaryFamilyId || secondaryFamilyId,
        family_head_name: familyHeadName || "N/A",
        status: member.status,
      };
    });

    return res.json({
      message: "Get Member Data Successful",
      RegisteredData,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch members", error: error.message });
  }
};