// utils/generateMemberCode.js
const Member = require("../Schema/memberSchema");

async function generateNextMemberCode() {
  const lastMember = await Member.findOne({ member_type: "Full Member" })
    .sort({ createdAt: -1 })
    .lean();

  let lastCode = lastMember ? lastMember.member_id : "MBR000000";
  let nextNum = parseInt(lastCode.replace("MBR", ""), 10) + 1;
  return `MBR${String(nextNum).padStart(6, "0")}`;
}

module.exports = generateNextMemberCode;
