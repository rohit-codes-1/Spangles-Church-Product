const PastorMember = require("../Schema/pastorSchema");
const PastorCodeGenerate = require("../util/pastorMemberCodeGenerate");
const PastorId = require("../util/PastorId");
const path = require("path");
const fs = require("fs");
const PastorFamilyMember = require("../Schema/pastorFamilyMemberSchema");

const generatePastorFamilyMemberCode = require("../util/pastorFamilyMemberCodeGenerate");

//  createMember 
exports.createMember = async (req, res) => {
  try {
    const code = await PastorCodeGenerate();
    const PastorfamilyId = await PastorId();
    // console.log(PastorfamilyId);
    // console.log(code);
    // return;
    const imagePath = req.file ? `/uploads/pastor/${req.file.filename}` : null;

    if (!req.body.familyId) {
      console.log("if :!req.body.familyhead_id");

      const newMember = new PastorMember({
        familyId: PastorfamilyId,
        familyhead_id: PastorfamilyId,
        member_id: code,
        mobile_number: req.body.mobile_number,
        member_name: req.body.member_name,
        member_tamil_name: req.body.member_tamil_name,
        gender: req.body.gender,
        date_of_birth: req.body.date_of_birth,
        age: req.body.age, 
        aadhar_number: req.body.aadhar_number,
        email: req.body.email,
        member_photo: imagePath,
        permanent_address: req.body.permanent_address,  // ✅ now string
        present_address: req.body.present_address,      // ✅ now string
        pastor_role: req.body.pastor_role,
        marriage_date: req.body.marriage_date,
        joined_date: req.body.joined_date,
        left_date: req.body.left_date,
        reason_for_inactive: req.body.reason_for_inactive,
        description: req.body.description,
        status: req.body.status,
      });

      await newMember.save();
      res
        .status(201)
        .json({ message: "Member created successfully", newMember });
    } else {
      console.log("else :req.body.familyhead_id");
      const newMember = new PastorMember({
        familyId: req.body.familyId,
        member_id: code,
        mobile_number: req.body.mobile_number,
        member_name: req.body.member_name,
        member_tamil_name: req.body.member_tamil_name,
        gender: req.body.gender,
        date_of_birth: req.body.date_of_birth,
        age: req.body.age, 
        aadhar_number: req.body.aadhar_number,
        email: req.body.email,
        occupation: req.body.occupation,
        community: req.body.community,
        nationality: req.body.nationality,
        member_photo: imagePath,
        permanent_address: req.body.permanent_address,  // ✅ now string
        present_address: req.body.present_address,      // ✅ now string
        pastor_role: req.body.pastor_role,
        marriage_date: req.body.marriage_date,
        joined_date: req.body.joined_date,
        left_date: req.body.left_date,
        reason_for_inactive: req.body.reason_for_inactive,
        description: req.body.description,
        status: req.body.status,
      });

      await newMember.save();
      res
        .status(201)
        .json({ message: "Member created successfully", newMember });
    }
  } catch (error) {
    // If an image was uploaded, delete it since an error occurred
    if (req.file) {
      const imagePath = path.join(
        __dirname,
        "..",
        `uploads/pastor/${req.file.filename}`
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    res.status(400).json({ error: error.message });
  }
};

//create a family new member
// exports.createfamilyMember = async (req, res) => {
//   try {
//     // const member_photo = req.file ? `/uploads/${req.file.filename}` : '';
//     console.log(req.body, "first part");
//     const code = await generatePastorFamilyMemberCode();
//     // const PastorfamilyId = await PastorId();
//     // console.log(PastorfamilyId);
//     // console.log(code);
//     // return;
//     const imagePath = req.file ? `/uploads/pastor/${req.file.filename}` : null;
//     console.log(req.body, "req.body")
//     if (!req.body.familyId) {
//       // console.log("if :!req.body.familyhead_id");

//       // const newMember = new PastorFamilyMember({
//       //   familyId: req.body.familyId,
//       //   member_id: code,
//       //   relationship_with_family_head: req.body.relationship_with_family_head,
//       //   assigned_member_id: req.body.assigned_member_id || null,
//       //   mobile_number: req.body.mobile_number,
//       //   member_name: req.body.member_name,
//       //   member_tamil_name: req.body.member_tamil_name,
//       //   gender: req.body.gender,
//       //   date_of_birth: req.body.date_of_birth ? new Date(req.body.date_of_birth) : null,
//       //   age: req.body.age, 
//       //   aadhar_number: req.body.aadhar_number,
//       //   email: req.body.email,
//       //   member_photo: imagePath,

//       //   permanent_address: req.body.permanent_address || "",
//       //   present_address: req.body.present_address || "",
//       //   pastor_role: req.body.pastor_role,


//       //   marriage_date: req.body.marriage_date ? new Date(req.body.marriage_date) : null,
//       //   joined_date: req.body.joined_date ? new Date(req.body.joined_date) : Date.now(),
//       //   left_date: req.body.left_date ? new Date(req.body.left_date) : null,

//       //   reason_for_inactive: req.body.reason_for_inactive || null,
//       //   description: req.body.description || null,
//       //   status: req.body.status || "Active",
//       // });

// // Auto calculate age if DOB is provided
// if (req.body.date_of_birth) {
//       const dob = new Date(req.body.date_of_birth);
//       const today = new Date();
//       let age = today.getFullYear() - dob.getFullYear();
//       const m = today.getMonth() - dob.getMonth();
//       if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
//         age--;
//       }
//       req.body.age = age;
//     }

// // Assign husband_name or father_name based on relationship
// if (req.body.relationship_with_family_head === "Wife") {
//       req.body.husband_name = req.body.husband_name || req.body.head_name;
//     }
//     if (["Son", "Daughter"].includes(req.body.relationship_with_family_head)) {
//       req.body.father_name = req.body.father_name || req.body.head_name;
//     }
// // Before creating new family member

// const head = await PastorMember.findOne({ familyId: req.body.familyId });
//     if (head) {
//       if (!req.body.permanent_address) req.body.permanent_address = head.permanent_address;
//       if (!req.body.present_address) req.body.present_address = head.present_address;
//       if (!req.body.joined_date) req.body.joined_date = head.joined_date;
//       if (!req.body.marriage_date) req.body.marriage_date = head.marriage_date;
//     }

//       //added on 22/08/2025 to add the newer form details
// const newMember = new PastorFamilyMember({
//   familyId: req.body.familyId,
//       member_id: code,
//       relationship_with_family_head: req.body.relationship_with_family_head,
//       assigned_member_id: req.body.assigned_member_id || null,
//       mobile_number: req.body.mobile_number,
//       member_name: req.body.member_name,
//       member_tamil_name: req.body.member_tamil_name,
//       gender: req.body.gender,
//       date_of_birth: req.body.date_of_birth ? new Date(req.body.date_of_birth) : null,
//       age: req.body.age || null,   // ✅ now included
//       aadhar_number: req.body.aadhar_number || null, // ✅ now included
//       email: req.body.email,
//       member_photo: imagePath,
//       husband_name: req.body.husband_name || null, // ✅ now included
//       father_name: req.body.father_name || null,   // ✅ now included

//       permanent_address: req.body.permanent_address || {},
//       present_address: req.body.present_address || {},

//       marriage_date: req.body.marriage_date ? new Date(req.body.marriage_date) : null,
//       joined_date: req.body.joined_date ? new Date(req.body.joined_date) : Date.now(),
//       left_date: req.body.left_date ? new Date(req.body.left_date) : null,

//       reason_for_inactive: req.body.reason_for_inactive || null,
//       description: req.body.description || null,
//       status: req.body.status || "Active",
// });

//       await newMember.save();
//       res
//         .status(201)
//         .json({ message: "Member created successfully", newMember });
//     } else {
//       // console.log("else :req.body.familyhead_id");
//      const newMember = new PastorFamilyMember({
//   familyId: req.body.familyId,
//       member_id: code,
//       relationship_with_family_head: req.body.relationship_with_family_head,
//       assigned_member_id: req.body.assigned_member_id || null,
//       mobile_number: req.body.mobile_number,
//       member_name: req.body.member_name,
//       member_tamil_name: req.body.member_tamil_name,
//       gender: req.body.gender,
//       date_of_birth: req.body.date_of_birth ? new Date(req.body.date_of_birth) : null,
//       age: req.body.age || null,   // ✅ now included
//       aadhar_number: req.body.aadhar_number || null, // ✅ now included
//       email: req.body.email,
//       member_photo: imagePath,
//       husband_name: req.body.husband_name || null, // ✅ now included
//       father_name: req.body.father_name || null,   // ✅ now included

//       permanent_address: req.body.permanent_address || {},
//       present_address: req.body.present_address || {},

//       marriage_date: req.body.marriage_date ? new Date(req.body.marriage_date) : null,
//       joined_date: req.body.joined_date ? new Date(req.body.joined_date) : Date.now(),
//       left_date: req.body.left_date ? new Date(req.body.left_date) : null,

//       reason_for_inactive: req.body.reason_for_inactive || null,
//       description: req.body.description || null,
//       status: req.body.status || "Active",
// });


//       console.log(newMember, "newMember")

//       await newMember.save();
//       res
//         .status(201)
//         .json({ message: "Member created successfully", newMember });
//     }
//   } catch (error) {
//     if (req.file) {
//       const imagePath = path.join(
//         __dirname,
//         "..",
//         `uploads/pastor/${req.file.filename}`
//       );
//       if (fs.existsSync(imagePath)) {
//         fs.unlinkSync(imagePath);
//       }
//     }
//     res.status(400).json({ error: error.message });
//   }
// };


//added on 22/08/2025 to add a new family at 2.30 pm
exports.createfamilyMember = async (req, res) => {
  try {
    const code = await generatePastorFamilyMemberCode();
    const imagePath = req.file ? `/uploads/pastor/${req.file.filename}` : null;

    // Auto-calculate age
    if (req.body.date_of_birth) {
      const dob = new Date(req.body.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      req.body.age = age;
    }

    // Assign husband_name or father_name based on relationship
    if (req.body.relationship_with_family_head === "Wife") {
      req.body.husband_name = req.body.husband_name || req.body.head_name;
    }
    if (["Son", "Daughter"].includes(req.body.relationship_with_family_head)) {
      req.body.father_name = req.body.father_name || req.body.head_name;
    }

    // Inherit data from head if not provided
    const head = await PastorMember.findOne({ familyId: req.body.familyId });
    if (head) {
      if (!req.body.permanent_address) req.body.permanent_address = head.permanent_address;
      if (!req.body.present_address) req.body.present_address = head.present_address;
      if (!req.body.joined_date) req.body.joined_date = head.joined_date;
      if (
        req.body.relationship_with_family_head === "Wife" &&
        !req.body.marriage_date
      ) {
        req.body.marriage_date = head.marriage_date;
      }
    }

    // Create new member
    const newMember = new PastorFamilyMember({
      familyId: req.body.familyId,
      member_id: code,
      relationship_with_family_head: req.body.relationship_with_family_head,
      assigned_member_id: req.body.assigned_member_id || null,


      mobile_number: req.body.mobile_number,
      member_name: req.body.member_name,
      member_tamil_name: req.body.member_tamil_name,
      gender: req.body.gender,


      date_of_birth: req.body.date_of_birth ? new Date(req.body.date_of_birth) : null,
      age: req.body.age || null,   // ✅ now included
      aadhar_number: req.body.aadhar_number || null, // ✅ now included
      email: req.body.email,
      member_photo: imagePath,


      husband_name: req.body.husband_name || null, // ✅ now included
      father_name: req.body.father_name || null,   // ✅ now included

      permanent_address: req.body.permanent_address || "",
      present_address: req.body.present_address || "",

      marriage_date: req.body.marriage_date ? new Date(req.body.marriage_date) : null,
      joined_date: req.body.joined_date ? new Date(req.body.joined_date) : Date.now(),
      left_date: req.body.left_date ? new Date(req.body.left_date) : null,

      reason_for_inactive: req.body.reason_for_inactive || null,
      description: req.body.description || null,
      status: req.body.status || "Active",
    });

    await newMember.save();
    res.status(201).json({ message: "Member created successfully", newMember });
  } catch (error) {
    if (req.file) {
      const imagePath = path.join(__dirname, "..", `uploads/pastor/${req.file.filename}`);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    res.status(400).json({ error: error.message });
  }
};

// Get all members

exports.getAllMembers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 15, status } = req.query;
    const query = {};

    // Filter by status if provided
    if (status && status !== "All") {
      query.status = status;
    }

    // Filter by search term (searching in member_name and family_head_name)
    if (search) {
      query.$or = [
        { member_name: { $regex: search, $options: "i" } }, // Case-insensitive search
        { member_id: { $regex: search, $options: "i" } }, // Case-insensitive search
        { family_head_name: { $regex: search, $options: "i" } },
        { familyId: { $regex: search, $options: "i" } },
      ];
    }

    const totalMembers = await PastorMember.countDocuments(query);
    const totalPages = Math.ceil(totalMembers / limit);

    const members = await PastorMember.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      RegisteredData: members,
      TotalPages: totalPages,
      CurrentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single member by member_id
// exports.getMemberById = async (req, res) => {
//   try {
//     // Find member in PastorMember collection
//     const member = await PastorMember.findOne({
//       member_id: req.params.id,
//     }).select("-createdAt -updatedAt -__v");

//     // If not found in PastorMember, check in PastorFamilyMember
//     if (!member) {
//       // const familyMember = await PastorFamilyMember.findOne({
//       //   member_id: req.params.id,
//       // }).select("-createdAt -updatedAt -__v");
//       const familyMember = await PastorFamilyMember.findOne({ member_id: req.params.id });

//       if (!familyMember) {
//         return res.status(404).json({ message: "Member not found" });
//       }

//       return res.status(200).json(familyMember);
//     }

//     res.status(200).json(member);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };




//newly added 16/07/2025
exports.getMemberById = async (req, res) => {
  try {
    const memberId = req.params.id;
    console.log("🔍 Fetching pastor with ID:", memberId);

    const member = await PastorMember.findOne({ member_id: memberId }).select("-createdAt -updatedAt -__v");

    if (!member) {
      const familyMember = await PastorFamilyMember.findOne({ member_id: memberId }).select("-createdAt -updatedAt -__v");

      if (!familyMember) {
        return res.status(404).json({ message: "Member not found" });
      }

      return res.status(200).json(familyMember);
    }

    res.status(200).json(member);
  } catch (error) {
    console.error("🔥 Error in getMemberById:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};



// Update a member (delete old image and upload new one)



// exports.updateMember = async (req, res) => {
//   try {
//     let member = await PastorMember.findOne({ member_id: req.params.id });

//     if (!member) {
//       member = await PastorFamilyMember.findOne({ member_id: req.params.id });
//     }

//     if (!member) {
//       return res.status(404).json({ message: "Member not found" });
//     }

//     let imagePath = member.member_photo;

//     // ✅ Handle Image Upload: Delete old image if a new one is uploaded
//     if (req.file) {
//       if (
//         member.member_photo &&
//         member.member_photo.startsWith("/uploads/pastor/")
//       ) {
//         const oldImagePath = path.join(__dirname, "..", member.member_photo);
//         if (fs.existsSync(oldImagePath)) {
//           fs.unlinkSync(oldImagePath);
//         }
//       }
//       imagePath = `/uploads/pastor/${req.file.filename}`;
//     } else if (req.body.member_photo) {
//       imagePath = req.body.member_photo; 
//     }

//     let permanentAddress = req.body.permanent_address;
//     let presentAddress = req.body.present_address;

//     if (typeof permanentAddress === "string") {
//       try {
//         permanentAddress = JSON.parse(permanentAddress);
//       } catch (error) {
//         return res
//           .status(400)
//           .json({ message: "Invalid permanent_address format" });
//       }
//     }

//     if (typeof presentAddress === "string") {
//       try {
//         presentAddress = JSON.parse(presentAddress);
//       } catch (error) {
//         return res
//           .status(400)
//           .json({ message: "Invalid present_address format" });
//       }
//     }

//     if ("familyhead_id" in req.body) {
//       delete req.body.familyhead_id;
//     }

//     const updatedMember = await PastorMember.findOneAndUpdate(
//       { member_id: req.params.id }, 
//       {
//         ...req.body, 
//         member_photo: imagePath, // Updated image path
//         permanent_address: permanentAddress, // Store as object
//         present_address: presentAddress, // Store as object
//       },
//       { new: true, runValidators: true } // Return updated doc & validate fields
//     );

//     // ✅ If member is inactive, update all related family members
//     if (updatedMember.status.toLowerCase() === "inactive") {
//       await PastorFamilyMember.updateMany(
//         { familyId: updatedMember.familyId },
//         { $set: { status: "Inactive" } }
//       );
//     }

//     res.status(200).json({
//       message: "Member updated successfully",
//       updatedMember,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };







//newly added 16/07/2025
// exports.updateMember = async (req, res) => {
//   try {
//     // Try finding the member in both collections
//     let member = await PastorMember.findOne({ member_id: req.params.id });
//     let Model = PastorMember;

//     if (!member) {
//       member = await PastorFamilyMember.findOne({ member_id: req.params.id });
//       if (!member) {
//         return res.status(404).json({ message: "Member not found" });
//       }
//       Model = PastorFamilyMember;
//     }

//     // Handle image replacement
//     let imagePath = member.member_photo;

//     if (req.file) {
//       if (member.member_photo?.startsWith("/uploads/pastor/")) {
//         const oldImagePath = path.join(__dirname, "..", member.member_photo);
//         if (fs.existsSync(oldImagePath)) {
//           fs.unlinkSync(oldImagePath);
//         }
//       }
//       imagePath = `/uploads/pastor/${req.file.filename}`;
//     } else if (req.body.member_photo) {
//       imagePath = req.body.member_photo;
//     }

//     // Safely parse nested address objects
//     let permanentAddress = req.body.permanent_address;
//     let presentAddress = req.body.present_address;

//     try {
//       if (typeof permanentAddress === "string") {
//         permanentAddress = JSON.parse(permanentAddress);
//       }
//       if (typeof presentAddress === "string") {
//         presentAddress = JSON.parse(presentAddress);
//       }
//     } catch (error) {
//       return res.status(400).json({ message: "Invalid address format" });
//     }

//     // Remove familyhead_id if accidentally sent
//     if ("familyhead_id" in req.body) {
//       delete req.body.familyhead_id;
//     }

//     // Construct update data
//     const updateData = {
//       ...req.body,
//       member_photo: imagePath,
//       permanent_address: JSON.stringify(permanentAddress || {}),
//       present_address: JSON.stringify(presentAddress || {}),
//     };

//     // Run update on the correct model
//     const updatedMember = await Model.findOneAndUpdate(
//       { member_id: req.params.id },
//       updateData,
//       { new: true, runValidators: true }
//     );

//     // If updated status is "Inactive", update related family members
//     if (
//       updatedMember &&
//       updatedMember.status &&
//       updatedMember.status.toLowerCase() === "inactive" &&
//       Model === PastorMember
//     ) {
//       await PastorFamilyMember.updateMany(
//         { familyId: updatedMember.familyId },
//         { $set: { status: "Inactive" } }
//       );
//     }

//     res.status(200).json({
//       message: "Member updated successfully",
//       updatedMember,
//     });
//   } catch (error) {
//     console.error("🔥 Update error:", error);
//     console.error("🔥 Stack:", error.stack);
//     console.error("🔥 Body received:", req.body); 
//     if (req.file) {
//       console.error("🔥 File received:", req.file.originalname);
//     }
//     res.status(500).json({
//       message: "Internal Server Error",
//       error: error.message,
//       stack: error.stack,
//       body: req.body,
//     });
//   }
// };



//added on 15/09/2025
// controllers/pastorMemberController.js
exports.updateMember = async (req, res) => {
  try {
    // Try finding the member in both collections
    let member = await PastorMember.findOne({ member_id: req.params.id });
    let Model = PastorMember;

    if (!member) {
      member = await PastorFamilyMember.findOne({ member_id: req.params.id });
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      Model = PastorFamilyMember;
    }

    // Handle image replacement
    let imagePath = member.member_photo;

    if (req.file) {
      if (member.member_photo?.startsWith("/uploads/pastor/")) {
        const oldImagePath = path.join(__dirname, "..", member.member_photo);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imagePath = `/uploads/pastor/${req.file.filename}`;
    } else if (req.body.member_photo) {
      imagePath = req.body.member_photo;
    }

    // 🔹 Ensure addresses are stored as JSON strings
    let permanentAddress = req.body.permanent_address;
    let presentAddress = req.body.present_address;

    // If the frontend sends objects → convert to string
    if (typeof permanentAddress === "object") {
      permanentAddress = JSON.stringify(permanentAddress);
    }
    if (typeof presentAddress === "object") {
      presentAddress = JSON.stringify(presentAddress);
    }

    // If the frontend sends empty → keep it as empty string
    if (!permanentAddress) permanentAddress = "";
    if (!presentAddress) presentAddress = "";

    // Remove familyhead_id if accidentally sent
    if ("familyhead_id" in req.body) {
      delete req.body.familyhead_id;
    }

    // Construct update data
    const updateData = {
      ...req.body,
      member_photo: imagePath,
      permanent_address: permanentAddress,
      present_address: presentAddress,
    };

    // Run update on the correct model
    const updatedMember = await Model.findOneAndUpdate(
      { member_id: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );

    // If updated status is "Inactive", update related family members
    if (
      updatedMember &&
      updatedMember.status &&
      updatedMember.status.toLowerCase() === "inactive" &&
      Model === PastorMember
    ) {
      await PastorFamilyMember.updateMany(
        { familyId: updatedMember.familyId },
        { $set: { status: "Inactive" } }
      );
    }

    res.status(200).json({
      message: "Member updated successfully",
      updatedMember,
    });
  } catch (error) {
    console.error("🔥 Update error:", error);
    console.error("🔥 Stack:", error.stack);
    console.error("🔥 Body received:", req.body); 
    if (req.file) {
      console.error("🔥 File received:", req.file.originalname);
    }
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
      stack: error.stack,
      body: req.body,
    });
  }
};



// Delete a member (also delete the image)
exports.deleteMember = async (req, res) => {
  try {
    const member = await PastorMember.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });

    // Delete the image file if it exists
    if (member.member_photo) {
      const imagePath = path.join(__dirname, "..", member.member_photo);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await PastorMember.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Member deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// family data

// exports.getFamilyData = async (req, res) => {
//   try {
//     const { familyId } = req.params; // Extract familyId from request params

//     if (!familyId) {
//       return res.status(400).json({ message: "Family ID is required" });
//     }

//     // Fetch matching records and count total records
//     const familyData = await PastorMember.find({ familyId }).select(
//       "familyId member_id member_name status"
//     );
//     PastorFamilyMember.find
//     console.log(familyData,"familyData")
//     const totalRecords = await PastorMember.countDocuments({ familyId });

//     if (!familyData.length) {
//       return res.status(404).json({ message: "No matching family data found" });
//     }

//     res.status(200).json({
//       success: true,
//       totalRecords, // Include total record count
//       data: familyData,
//     });
//   } catch (error) {
//     console.error("Error fetching family data:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

exports.getFamilyData = async (req, res) => {
  try {
    const { familyId } = req.params; // Extract familyId from request params

    if (!familyId) {
      return res.status(400).json({ message: "Family ID is required" });
    }

    // Fetch data from both collections in parallel
    const [familyData, familyMembers, totalRecords] = await Promise.all([
      PastorMember.find({ familyId }).select("familyId member_id member_name member_tamil_name status relationship_with_family_head"),
      PastorFamilyMember.find({ familyId }),
      PastorMember.countDocuments({ familyId }),
    ]);

    console.log(familyData, "familyData");
    console.log(familyMembers, "familyMembers");

    if (!familyData.length && !familyMembers.length) {
      return res.status(404).json({ message: "No matching family data found" });
    }

    res.status(200).json({
      success: true,
      totalRecords, // Include total record count
      members: familyData,
      familyMembers: familyMembers,
    });
  } catch (error) {
    console.error("Error fetching family data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// Get all member by familyId

exports.getMembersWithFamilyHeadId = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query; // Get query params

    // Base Query: Find all members where `familyhead_id` exists
    let query = { familyhead_id: { $exists: true, $ne: null } };

    // If search is provided, apply search filter
    if (search) {
      query.$or = [
        { familyId: { $regex: search, $options: "i" } }, // Search by familyId
        { member_id: { $regex: search, $options: "i" } }, // Search by member_id
        { member_name: { $regex: search, $options: "i" } }, // Search by member_name
      ];
    }

    // Count total matching documents
    const totalMembers = await PastorMember.countDocuments(query);

    // Fetch filtered & paginated results
    const members = await PastorMember.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      totalMembers,
      TotalPages: Math.ceil(totalMembers / limit),
      currentPage: parseInt(page),
      membersPerPage: members.length,
      members,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


exports.downloadPastorList = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const members = await PastorMember.find(query).sort({ createdAt: -1 });

    return res.status(200).json({ RegisteredData: members });
  } catch (err) {
    console.error("Download error:", err);
    return res.status(500).json({ error: "Failed to generate pastor list." });
  }
};