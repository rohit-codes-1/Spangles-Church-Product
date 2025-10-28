const Member = require("../Schema/memberSchema");
const Family = require("../Schema/familySchema");
const generateMemberCode = require("../util/MemberCodeGenerate");
const generateFamilyCode = require("../util/FamilyId");
const generateNextMemberCode = require("../util/generateMemberCode");
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
    let member = await Member.findOne({ member_id: id });
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Handle photo upload
    if (req.file) {
      req.body.member_photo = `/uploads/${req.file.filename}`;
    } else {
      delete req.body.member_photo;
    }

    let newMemberId = member.member_id; // default stays the same

    // ✅ Case 1: Promote Half → Full Member
    if (
      member.member_type === "Half Member" &&
      req.body.member_type === "Full Member"
    ) {
      const latestFull = await Member.find({ member_id: /^MBR\d{6}$/ })
        .sort({ member_id: -1 })
        .limit(1);

      let nextNum = 1;
      if (latestFull.length > 0) {
        const latestId = latestFull[0].member_id;
        const latestNum = parseInt(latestId.replace("MBR", ""), 10);
        nextNum = latestNum + 1;
      }

      newMemberId = "MBR" + String(nextNum).padStart(6, "0");
      req.body.member_id = newMemberId;

      // 🔗 update family refs so child stays inside family
      await Family.updateMany(
        { "members.ref_id": member.member_id },
        { $set: { "members.$.ref_id": newMemberId } }
      );
    }

    // ✅ Case 2: Marriage → Create new family
    // if (
    //   req.body.marital_status === "Married" &&
    //   req.body.new_family === true
    // ) {
    if (
  req.body.marital_status === "Married" &&
  (!member.secondary_family_id || req.body.new_family === true)
) {

      // check if already head of a family
      let existingFamily = await Family.findOne({ head: newMemberId });

      if (!existingFamily) {
        const newFamilyId = await generateFamilyCode();

        // create new family with this member as head
        const newFamily = new Family({
          family_id: newFamilyId,
          head: newMemberId,
          members: [],
        });
        await newFamily.save();

        // update member with secondary_family_id
        req.body.secondary_family_id = newFamilyId;

        console.log(
          `✅ New family ${newFamilyId} created for married member ${newMemberId}`
        );
      }
    }

    // Final update of member record
    await Member.findOneAndUpdate({ member_id: id }, req.body, { new: true });

    return res.status(200).json({
      message: "Updated successfully",
      new_member_id: newMemberId, // frontend uses this for redirect
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return res.status(500).json({
      message: "Failed to update member",
      error: error.message,
    });
  }
};

exports.getMembers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const search = req.query.search || "";
  const status = req.query.status?.trim(); // clean value

  try {
    const filter = {};

    // Search filter
    if (search) {
      filter.$or = [
        { member_name: new RegExp(search, "i") },
        { member_tamil_name: new RegExp(search, "i") },
        { member_id: new RegExp(search, "i") },
        { family_head_name: new RegExp(search, "i") },
        { primary_family_id: new RegExp(search, "i") },
        { secondary_family_id: new RegExp(search, "i") },
        { status: new RegExp(search, "i") },
      ];
    }

    // Status filter (skip if All or empty)
    if (status && status !== "All") {
      filter.status = status;
    }

    const memberData = await Member.find(filter)
      .sort({ _id: 1 })
      .select("member_id primary_family_id secondary_family_id member_name member_tamil_name status email")
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

      if (!familyMembers) {
        continue; // skip if no family found
      }

      const familyHead = await Member.findOne({
        member_id: familyMembers.head,
      }).select("member_name");

      RegisteredData.push({
        member_id: member.member_id,
        member_name: member.member_name,
        member_tamil_name: member.member_tamil_name,
        family_id: familyMembers.family_id,
        family_head_name: familyHead?.member_name || "", // safe access
        status: member.status,
        email: member.email,
      });
    }

    return res.json({
      message: "Get Member Data Successful",
      RegisteredData,
      totalItems,
      TotalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error in Member.getMembers:", error.message, error.stack);
    return res
      .status(500)
      .json({ message: "Failed to fetch members", error: error.message });
  }
};

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
      .select("member_id primary_family_id secondary_family_id member_name member_tamil_name status email"); // <-- ADDED 'member_tamil_name' here

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
        email: member.email,
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




exports.promoteMember = async (req, res) => {
  const id = req.params.id; // old member_id like MBR000001-B

  try {
    const member = await Member.findOne({ member_id: id });
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    if (member.member_type !== "Half Member") {
      return res.status(400).json({ message: "Only Half Members can be promoted" });
    }

    // Generate new sequential ID (no suffix)
    const newMemberId = await generateMemberCode();

    // Save old id for updating references
    const oldMemberId = member.member_id;

    // Update the member itself
    member.member_type = "Full Member";
    member.member_id = newMemberId;
    Object.assign(member, req.body);
    await member.save();

    // ✅ Update ALL Family.members[].ref_id occurrences
    await Family.updateMany(
      { "members.ref_id": oldMemberId },
      { $set: { "members.$.ref_id": newMemberId } }
    );

    console.log(`Updated family ref_id from ${oldMemberId} → ${newMemberId}`);

    return res.status(200).json({
      message: "Member promoted to Full Member successfully",
      new_member_id: newMemberId,
    });
  } catch (error) {
    console.error("Error promoting member:", error);
    return res.status(500).json({
      message: "Failed to promote member",
      error: error.message,
    });
  }
};



