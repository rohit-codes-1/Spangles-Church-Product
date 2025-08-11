const Member = require("../Schema/memberSchema");
const Family = require("../Schema/familySchema");
const generateMemberCode = require("../util/MemberCodeGenerate");
const generateFamilyCode = require("../util/FamilyId");
require("dotenv").config();


// exports.getMembers = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 15;
//   const status = req.query.status || ""; // Get the status from query params
//   const search = req.query.search || "";

//   try {
//     if (search === "") {
//       // If there's no search query, filter by status and paginate the results
//       const familyData = await Family.find()
//         .sort({ _id: 1 })
//         .select("family_id head")
//         .skip((page - 1) * limit)
//         .limit(limit);

//       let RegisteredData = [];

//       // Loop through each registered family and fetch corresponding members
//       for (const family of familyData) {
//         const familyMembers = await Member.findOne({
//           member_id: family.head,
//           ...(status && { status }), // Apply status filter if provided
//         }).select(
//           "member_id primary_family_id secondary_family_id member_name member_tamil_name status" // <-- ADDED 'member_tamil_name' here
//         );

//         // Combine the family and member information
//         if (familyMembers) {
//           RegisteredData.push({
//             _id: familyMembers._id,
//             family_id: family.family_id,
//             head: family.head,
//             member_name: familyMembers.member_name,
//             member_tamil_name: familyMembers.member_tamil_name, // <-- ADDED this line
//             status: familyMembers.status,
//           });
//         }
//       }

//       const totalItems = await Family.countDocuments();
//       const TotalPages = Math.ceil(totalItems / limit);

//       return res.json({
//         message: "Get Member Data Successful",
//         RegisteredData,
//         totalItems,
//         TotalPages,
//         currentPage: page,
//       });
//     } else {
//       // Define the filter for the search query
//       const familyFilter = {};

//       if (search) {
//         const searchRegex = new RegExp(search.replace(/\s/g, ""), "i");

//         familyFilter.$or = [
//           { member_name: { $regex: searchRegex } },
//           { member_tamil_name: { $regex: searchRegex } }, // <-- ADDED for search
//           { member_id: { $regex: searchRegex } },
//           { primary_family_id: { $regex: searchRegex } },
//           { secondary_family_id: { $regex: searchRegex } },
//         ];
//       }

//       if (status) {
//         familyFilter.status = status; // Apply status filter
//       }

//       // Fetch registered family data with pagination and search filters
//       const familyData = await Member.aggregate([
//         {
//           $addFields: {
//             member_name_no_space: {
//               $replaceAll: {
//                 input: "$member_name",
//                 find: " ",
//                 replacement: "",
//               },
//             },
//               member_tamil_name_no_space: { // <-- ADDED for search by tamil name
//                 $replaceAll: {
//                   input: "$member_tamil_name",
//                   find: " ",
//                   replacement: "",
//                 },
//               },
//           },
//         },
//         {
//           $match: familyFilter,
//         },
//         {
//           $sort: { _id: 1 },
//         },
//         {
//           $skip: (page - 1) * limit,
//         },
//         {
//           $limit: limit,
//         },
//         {
//           $lookup: {
//             from: "familylists", // Ensure the correct collection name
//             localField: "member_id",
//             foreignField: "head",
//             as: "familyDetails",
//           },
//         },
//         {
//           $unwind: "$familyDetails",
//         },
//         {
//           $project: {
//             member_id: 1,
//             member_name: 1,
//             member_tamil_name: 1, // <-- ADDED here
//             status: 1,
//             "familyDetails.family_id": 1,
//             "familyDetails.head": 1,
//           },
//         },
//       ]);

//       // Prepare the registered data
//       const RegisteredData = familyData.map((family) => ({
//         _id: family._id,
//         family_id: family.familyDetails.family_id,
//         head: family.familyDetails.head,
//         member_name: family.member_name,
//         member_tamil_name: family.member_tamil_name, // <-- ADDED here
//         status: family.status,
//       }));

//       const totalItems = await Member.countDocuments(familyFilter);
//       const TotalPages = Math.ceil(totalItems / limit);

//       return res.json({
//         message: "Get Family Data Successful",
//         RegisteredData,
//         totalItems,
//         TotalPages,
//         currentPage: page,
//       });
//     }
//   } catch (error) {
//     console.error("Error:", error.message);
//     return res
//       .status(500)
//       .json({ message: "Failed to fetch members", error: error.message });
//   }
// };

exports.getMembers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const status = req.query.status || "";
  const search = req.query.search || "";

  try {
    if (search === "") {
      const familyData = await Family.find()
        .sort({ _id: 1 })
        .select("family_id head")
        .skip((page - 1) * limit)
        .limit(limit);

      let RegisteredData = [];

      for (const family of familyData) {
        // --- DEBUGGING LINE 1 ---
        console.log("DEBUG: Processing family:", family.family_id, "with head:", family.head);

        const familyMembers = await Member.findOne({
          member_id: family.head,
          ...(status && { status }),
        }).select(
          "member_id primary_family_id secondary_family_id member_name member_tamil_name status"
        );

        // --- DEBUGGING LINE 2 ---
        // This is the MOST IMPORTANT line. It shows what Mongoose found for the head member.
        console.log("DEBUG: Found familyMembers for head " + family.head + ":", familyMembers);

        if (familyMembers) {
          RegisteredData.push({
            _id: familyMembers._id,
            family_id: family.family_id,
            head: family.head,
            member_name: familyMembers.member_name,
            member_tamil_name: familyMembers.member_tamil_name,
            status: familyMembers.status,
          });
        }
        // --- DEBUGGING LINE 3 ---
        console.log("DEBUG: Added to RegisteredData:", RegisteredData[RegisteredData.length - 1]);
      }

      const totalItems = await Family.countDocuments();
      const TotalPages = Math.ceil(totalItems / limit);

      // --- DEBUGGING LINE 4 ---
      console.log("DEBUG: Final RegisteredData array before sending:", RegisteredData);

      return res.json({
        message: "Get Member Data Successful",
        RegisteredData,
        totalItems,
        TotalPages,
        currentPage: page,
      });
    } else {
      // --- If you're actively using the search bar, we need to add logs here too ---
      // For now, let's focus on the no-search path.
      // ... (your existing search path code)
      const familyFilter = {};
      if (search) {
        const searchRegex = new RegExp(search.replace(/\s/g, ""), "i");
        familyFilter.$or = [
          { member_name: { $regex: searchRegex } },
          { member_tamil_name: { $regex: searchRegex } },
          { member_id: { $regex: searchRegex } },
          { primary_family_id: { $regex: searchRegex } },
          { secondary_family_id: { $regex: searchRegex } },
        ];
      }
      if (status) {
        familyFilter.status = status;
      }

      const familyData = await Member.aggregate([
        { $addFields: {
            member_name_no_space: { $replaceAll: { input: "$member_name", find: " ", replacement: "", }, },
            member_tamil_name_no_space: { $replaceAll: { input: "$member_tamil_name", find: " ", replacement: "", }, },
          },
        },
        { $match: familyFilter },
        { $sort: { _id: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $lookup: {
            from: "familylists",
            localField: "member_id",
            foreignField: "head",
            as: "familyDetails",
          },
        },
        { $unwind: "$familyDetails" },
        { $project: {
            member_id: 1,
            member_name: 1,
            member_tamil_name: 1,
            status: 1,
            "familyDetails.family_id": 1,
            "familyDetails.head": 1,
          },
        },
      ]);

      // --- DEBUGGING LINE 5 (for search path) ---
      console.log("DEBUG: Aggregated familyData (search path):", familyData);

      const RegisteredData = familyData.map((family) => ({
        _id: family._id,
        family_id: family.familyDetails.family_id,
        head: family.familyDetails.head,
        member_name: family.member_name,
        member_tamil_name: family.member_tamil_name,
        status: family.status,
      }));

      // --- DEBUGGING LINE 6 (for search path) ---
      console.log("DEBUG: Final RegisteredData array before sending (search path):", RegisteredData);


      const totalItems = await Member.countDocuments(familyFilter);
      const TotalPages = Math.ceil(totalItems / limit);

      return res.json({
        message: "Get Family Data Successful",
        RegisteredData,
        totalItems,
        TotalPages,
        currentPage: page,
      });
    }
  } catch (error) {
    console.error("Error in getMembers:", error.message, error.stack); // More detailed error log
    return res
      .status(500)
      .json({ message: "Failed to fetch members", error: error.message });
  }
};


exports.downloadMembers = async (req, res) => {
  try {
    const { status } = req.query;

    // Fetch family data
    const familyData = await Family.find()
      .sort({ _id: 1 })
      .select("family_id head");

    // Extract the family heads for querying the members
    const familyHeads = familyData.map(family => family.head);

    // Build member query
    const memberQuery = { member_id: { $in: familyHeads } };
    if (status) {
      memberQuery.status = status;
    }

    // Fetch all members in one query
    const memberData = await Member.find(memberQuery)
      .select("member_id primary_family_id secondary_family_id member_name member_tamil_name status"); // <-- ADDED 'member_tamil_name' here

    // Create a map of members by member_id for easy lookup
    const memberMap = memberData.reduce((acc, member) => {
      acc[member.member_id] = member;
      return acc;
    }, {});

    // Map family data to include the corresponding member data
    const RegisteredData = familyData.map(family => {
      const member = memberMap[family.head];
      if (member) {
        return {
          _id: member._id,
          family_id: family.family_id,
          family_head_name: member.member_name,
          member_tamil_name: member.member_tamil_name, // <-- ADDED this line
          member_id: family.head,
          status: member.status,
        };
      }
    }).filter(Boolean); // Remove any undefined values if a member doesn't exist

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

exports.treeMembers  = async (req, res) => {
  const { id } = req.params;

  try {
    const FamilyDetails = await Family.findOne({ family_id: id });

    if (!FamilyDetails) {
      return res.status(404).json({ message: "Member not found" });
    } else {
            if (FamilyDetails.members && FamilyDetails.members.length > 0) {
        const Data = await Promise.all(
          FamilyDetails.members.map(async (family) => {
            const MemberDetails = await Member.findOne({ member_id: family.ref_id })
              .select("member_id assigned_member_id member_name member_tamil_name status") // <-- ADDED 'member_tamil_name' here
              .lean();

            MemberDetails.relation = family.relationship_with_family_head;
            return MemberDetails;
          })
        );

        const HeadDetails = await Member.findOne({ member_id: FamilyDetails.head  })
        .select("member_id assigned_member_id member_name member_tamil_name status present_address mobile_number") // <-- ADDED 'member_tamil_name' here
        .lean();
        HeadDetails.relation = "Head";
        Data.unshift(HeadDetails)

        return res.status(200).json({FamilyDetails:Data});
             } else{
            const HeadDetails = await Member.findOne({ member_id: FamilyDetails.head  })
            .select("member_id assigned_member_id member_name member_tamil_name status present_address mobile_number") // <-- ADDED 'member_tamil_name' here
            .lean();
            HeadDetails.relation = "Head";
        return res.status(200).json({FamilyDetails:[HeadDetails]});
            }}
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch member", error: error.message });
  }
};


exports.SingleGetMemberById = async (req, res) => {
  const { id } = req.params;

  try {
    // Array to accumulate all combined family and member data
    const FamilyData = await Family.find({ family_id: id }).select(
      "family_id head"
    );
    let RegisteredData = [];

    // Loop through each registered family and fetch corresponding members
    for (const family of FamilyData) {
      const familyMembers = await Member.findOne({
        member_id: family.head,
      }).select("member_id member_name member_tamil_name permanent_address marriage_date"); // <-- ADDED 'member_tamil_name' here

      // Combine the family and member information
      if (familyMembers) {
        RegisteredData.push({
          family_id: family.family_id,
          family_head_name: familyMembers.member_name,
          member_tamil_name: familyMembers.member_tamil_name, // <-- ADDED this line
          marriage_date: familyMembers.marriage_date,
          permanent_address: familyMembers.permanent_address,
        });
      }
    }
    return res
      .status(200)
      .json({ message: "Data", FamilyData: RegisteredData[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch member", error: error.message });
  }
};


exports.familyTreeMembers = async (req, res) => {
  try {
    // Explicitly select member_tamil_name when fetching all members
    const members = await Member.find({}).select('member_id member_name member_tamil_name member_photo'); // <-- ADDED 'member_tamil_name' here
    const families = await Family.find({});

    const memberMap = members.reduce((acc, member) => {
      acc[member.member_id] = member;
      return acc;
    }, {});

    const findMemberById = (id) => memberMap[id];

    const buildTree = (memberId) => {
      const member = findMemberById(memberId);
      if (!member) return null;

      const children = [];
      const primaryFamily = families.find((fam) => fam.head === memberId);
      if (primaryFamily) {
        primaryFamily.members.forEach((memberRef) => {
          const childNode = buildTree(memberRef.ref_id);
          if (childNode) {
            children.push(childNode);
          }
        });
      }

      return {
        id: member.member_id,
        name: member.member_name, // You might choose member.member_tamil_name here if primary display
        attributes: {
            id: member.member_id,
            member_tamil_name: member.member_tamil_name, // <-- ADDED to attributes for tree
        },
        nodeSvgShape: {
          shape: "image",
          shapeProps: {
            href: `http://localhost:${5000}${member.member_photo}`,
            width: 50,
            height: 50,
          },
        },
        children: children,
      };
    };

    const rootTree = buildTree("VKDMBR000001"); // Replace with your root family head ID

    const formatTree = (node, idCounter) => {
      if (!node) return null;
      node.id = idCounter.current++;
      node.children = node.children.map((child) =>
        formatTree(child, idCounter)
      );
      return node;
    };

    const idCounter = { current: 1 };
    const formattedTree = formatTree(rootTree, idCounter);

    res.json(formattedTree);
  } catch (error) {
    console.error(error);
    // res.status(500).send('Server Error');
  }
};




exports.getFamilyById = async (req, res) => {
  try {
    const family = await Family.findOne({ family_id: req.params.id });
    if (!family) {
      return res.status(404).json({ message: "Family not found" });
    }

    // Populate full member info
    const memberIds = family.members.map(m => m.member_id || m.ref_id); // depending on what you store
    const members = await Member.find({ member_id: { $in: memberIds } });

    res.status(200).json({ members });
  } catch (err) {
    console.error("Error fetching family by ID:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getFullFamilyById = async (req, res) => {
  try {
    const family = await Family.findOne({ family_id: req.params.id });
    if (!family) {
      return res.status(404).json({ message: "Family not found" });
    }

    // 1. Get Head info
    const head = await Member.findOne({ member_id: family.head }).lean();

    // 2. Get Members info
    const memberIds = family.members.map(m => m.ref_id);
    const members = await Member.find({ member_id: { $in: memberIds } }).lean();

    res.status(200).json({
      head,
      members,
      family_id: family.family_id,
    });
  } catch (err) {
    console.error("Error fetching full family:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
