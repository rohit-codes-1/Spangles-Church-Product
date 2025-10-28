const Offerings = require('../Schema/offerSchema');
const Member = require("../Schema/memberSchema");
const Family = require("../Schema/familySchema");
const Pastor = require("../Schema/pastorSchema");
const PastorFamilyMember = require("../Schema/pastorFamilyMemberSchema");
const Subscription = require("../Schema/Subscription");

exports.getOfferingsByMember = async (req, res) => {
  try {
    const { member_id } = req.params;
    if (!member_id) {
      return res.status(400).json({ error: "Member ID is required" });
    }

    // Check if the member exists in any of the collections
    const normalMember = await Member.findOne({ member_id });
    const pastorMember = await Pastor.findOne({ member_id });
    const pastorFamilyMember = await PastorFamilyMember.findOne({ member_id });

    let offerings = [];

    if (normalMember) {
      // Normal church member
      offerings = await Offerings.find({ member_id })
        .sort({ date: -1 })
        .select("category date amount");
    } else if (pastorMember) {
      // Pastor's personal offerings
      offerings = await Offerings.find({ member_id })
        .sort({ date: -1 })
        .select("category date amount");
    } else if (pastorFamilyMember) {
      // Pastor's family member offerings
      offerings = await Offerings.find({ member_id })
        .sort({ date: -1 })
        .select("category date amount");
    } else {
      // Check if belongs to a family (normal member family)
      const family = await Family.findOne({ "members.member_id": member_id });
      if (family) {
        offerings = await Offerings.find({
          member_id: { $in: family.members.map(m => m.member_id) },
        })
          .sort({ date: -1 })
          .select("category date amount");
      } else {
        return res.status(404).json({ error: "No member or offerings found" });
      }
    }

    return res.status(200).json(offerings);
  } catch (error) {
    console.error("Error fetching offerings:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMemberName = async (req, res) => {
  try {
    const { member_id } = req.params;
    if (!member_id) {
      return res.status(400).json({ error: "Member ID is required" });
    }

    // Check in member, pastor, or pastor family
    const member =
      (await Member.findOne({ member_id }).select("member_name")) ||
      (await Pastor.findOne({ member_id }).select("member_name")) ||
      (await PastorFamilyMember.findOne({ member_id }).select("member_name"));

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.status(200).json({ name: member.member_name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFamilyIfHead = async (req, res) => {
  try {
    const { memberId } = req.params;

    // Find the family where this member is the head
    const family = await Family.findOne({ head: memberId });
    if (!family) {
      return res.status(200).json({ isHead: false, message: "Not a family head" });
    }

    // Get all member IDs in the family (head + members)
    const memberIds = [family.head, ...family.members.map((m) => m.ref_id)];

    // Fetch member details
    const membersData = await Member.find(
      { member_id: { $in: memberIds } },
      { member_id: 1, member_name: 1, _id: 0 }
    );

    // Get the head’s name
    const headData = membersData.find((m) => m.member_id === family.head);
    const headName = headData ? headData.member_name : "Unknown";

    // 🔹 Find all member_ids who are heads of their own families
    const otherHeads = await Family.find(
      { head: { $in: memberIds } },
      { head: 1, _id: 0 }
    );

    // Get those member_ids (excluding the current family head)
    const excludeIds = otherHeads
      .map((f) => f.head)
      .filter((id) => id !== family.head);

    // 🔹 Filter out members who are heads of other families
    const membersWithNames = family.members
      .filter((m) => !excludeIds.includes(m.ref_id))
      .map((m) => {
        const matchedMember = membersData.find((mem) => mem.member_id === m.ref_id);
        return {
          ref_id: m.ref_id,
          relationship_with_family_head: m.relationship_with_family_head,
          member_name: matchedMember ? matchedMember.member_name : "Unknown",
        };
      });

    // Send response
    res.status(200).json({
      isHead: true,
      family: {
        family_id: family.family_id,
        head: family.head,
        head_name: headName,
        members: membersWithNames,
      },
    });
  } catch (error) {
    console.error("Error fetching family info:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getFamilyByMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    // Check if the member is head first
    const familyAsHead = await Family.findOne({ head: memberId });
    if (familyAsHead) {
      return res.status(200).json({
        isHead: true,
        family_id: familyAsHead.family_id,
      });
    }

    // Else check if the member is part of any family
    const familyAsMember = await Family.findOne({ "members.ref_id": memberId });
    if (familyAsMember) {
      return res.status(200).json({
        isHead: false,
        family_id: familyAsMember.family_id,
      });
    }

    res.status(200).json({ isHead: false, family_id: null });
  } catch (error) {
    console.error("Error fetching family info:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSubscriptionsByMember = async (req, res) => {
  try {
    const { member_id } = req.params;
    if (!member_id) {
      return res.status(400).json({ error: "Member ID is required" });
    }

    // Check if member exists
    const normalMember = await Member.findOne({ member_id });
    const pastorMember = await Pastor.findOne({ member_id });
    const pastorFamilyMember = await PastorFamilyMember.findOne({ member_id });

    let subscriptions = [];

    if (normalMember || pastorMember || pastorFamilyMember) {
      subscriptions = await Subscription.find({ member_id }).sort({ year: -1 });
    } else {
      // If member is part of a family
      const family = await Family.findOne({ "members.member_id": member_id });
      if (family) {
        const familyMemberIds = family.members.map((m) => m.member_id);
        subscriptions = await Subscription.find({
          member_id: { $in: familyMemberIds },
        }).sort({ year: -1 });
      } else {
        return res.status(404).json({ error: "No subscriptions found for this member" });
      }
    }

    if (!subscriptions.length) {
      return res.status(404).json({ message: "No subscriptions found" });
    }

    // Define all 12 months
    const allMonths = [
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
      "january",
      "february",
      "march",
    ];

    // Default object for months without data
    const defaultMonth = { harvestAuction: 0 };

    // Format data
    const formatted = subscriptions.map((sub) => {
      const months = {};
      allMonths.forEach((month) => {
        months[month] = sub[month] ? sub[month] : defaultMonth;
      });

      return {
        year: sub.year,
        member_id: sub.member_id,
        member_name: sub.member_name,
        months,
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ error: error.message });
  }
};
