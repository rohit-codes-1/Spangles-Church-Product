console.log("ChildMemberCode.js loaded");

const Family = require("../Schema/familySchema");

async function generateChildMemberCode(familyId) {
    console.log("generateChildMemberCode called for family:", familyId);

  const family = await Family.findOne({ family_id: familyId });
  if (!family) throw new Error("Family not found");

  const headId = family.head;

  // Get existing children
  const children = family.members.filter(m =>
    ["Son", "Daughter"].includes(m.relationship_with_family_head)
  );

  // Extract suffixes like A, B, C
  const suffixes = children
    .map(c => {
      const match = c.ref_id.match(/-(\w)$/);
      return match ? match[1] : null;
    }) 
    .filter(Boolean);

  // Find next suffix
  let nextChar = "A";
  if (suffixes.length > 0) {
    const lastChar = suffixes.sort().pop(); // e.g. "C"
    nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
  }

  return `${headId}-${nextChar}`;
}

module.exports = generateChildMemberCode;
