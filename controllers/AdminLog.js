const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../Schema/adminlogSchema');
const Member = require('../Schema/memberSchema'); // to check member_id + email
const Pastor = require("../Schema/pastorSchema")
const nodemailer = require("nodemailer");


const otpStore = {};





//created at 15/09/2025 at 11.02AM
exports.signupRequest = async (req, res) => {
  try {
    const { member_id } = req.body;

    // 1. Find member in Member OR Pastor collection
    let member = await Member.findOne({ member_id });
    if (!member) {
      member = await Pastor.findOne({ member_id });
    }
    if (!member) return res.status(404).json({ message: "Member/Pastor not found" });

    // 2. Check if user already exists
    const existingUser = await User.findOne({ member_id });

    if (existingUser) {
      if (existingUser.isPreCreated || !existingUser.password) {
        // continue → send OTP
      } else {
        return res.status(400).json({ message: "User already exists, please login." });
      }
    }

    // 3. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 3 * 60 * 1000;
    otpStore[member_id] = { otp, expiresAt };

    // 4. Send OTP email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: member.email,
      subject: "Church Management - Signup OTP",
      text: `Hello ${member.member_name},\n\nYour OTP is: ${otp}\n\nThis OTP will expire in 3 minutes.`,
    });

    return res.json({ email: member.email });
  } catch (err) {
    console.error("❌ Signup request error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};





// -------------------- VERIFY OTP & CREATE USER --------------------
exports.verifyOtp = async (req, res) => {
  try {
    const { member_id, otp } = req.body;

    const stored = otpStore[member_id];
    if (!stored) return res.status(400).json({ message: "No OTP found, please request again." });

    if (Date.now() > stored.expiresAt) {
      delete otpStore[member_id];
      return res.status(400).json({ message: "OTP expired, please request again." });
    }

    if (stored.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    // OTP verified, allow frontend to enable password
    delete otpStore[member_id];
    return res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("❌ Verify OTP error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};










//created at 15/09/2025 at 11.02 AM
exports.completeSignup = async (req, res) => {
  try {
    const { member_id, password } = req.body;

    // 1. Find in Member or Pastor collection
    let member = await Member.findOne({ member_id });
    if (!member) {
      member = await Pastor.findOne({ member_id });
    }
    if (!member) return res.status(404).json({ message: "Member/Pastor not found" });

    // 2. Check user
    let user = await User.findOne({ member_id });

    if (user) {
      if (user.isPreCreated || !user.password) {
        user.password = password;
        user.isPreCreated = false;
        await user.save();
        return res.status(200).json({ message: "Signup completed successfully. You can login now." });
      }
      return res.status(400).json({ message: "User already exists, please login." });
    }

    // 3. Create new user
    const newUser = new User({
      member_id,
      member_name: member.member_name,
      email: member.email,
      password: await bcrypt.hash(password, 10),
      roles: ["member"], // default role
      isPreCreated: false,
    });

    await newUser.save();
    return res.status(201).json({ message: "Signup completed successfully. You can login now." });
  } catch (err) {
    console.error("❌ Complete signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};









//created at 15/09/2025 at 11.06 AM
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body; // username = member_id
    const user = await User.findOne({ member_id: username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, member_id: user.member_id, roles: user.roles },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({ message: 'Login successful', token, roles: user.roles });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).send(error);
  }
};








//with pagination and the search
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = {};

    // 🔍 Search by member_name OR roles
    if (search) {
      query.$or = [
        { member_name: { $regex: search, $options: "i" } },
        { roles: { $elemMatch: { $regex: search, $options: "i" } } }
      ];
    }

    // Fetch users with pagination (excluding password)
    const users = await User.find(query, "-password")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // Attach member_name from Member collection if missing
    const usersWithNames = await Promise.all(
      users.map(async (u) => {
        if (!u.member_name) {
          const member = await Member.findOne(
            { member_id: u.member_id },
            "member_name"
          );
          return {
            ...u,
            member_name: member ? member.member_name : null,
          };
        }
        return u;
      })
    );

    // Total count for pagination
    const totalUsers = await User.countDocuments(query);

    res.json({
      users: usersWithNames,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    console.error("❌ Get users error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// -------------------- UPDATE USER ROLE --------------------
exports.updateUserRole = async (req, res) => {
  try {
    const { userId, roles } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { roles },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Roles updated successfully", user });
  } catch (err) {
    console.error("❌ Update user role error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



//created on 15/09/2025 at 9.44 AM to create user including the pastor also
exports.createUserByAdmin = async (req, res) => {
  try {
    const { member_id, roles } = req.body;

    // ✅ Validate input
    if (!member_id) {
      return res.status(400).json({ message: "Member ID is required" });
    }

    // ✅ Try finding in Member collection
    let person = await Member.findOne({ member_id });

    // ✅ If not found, try Pastor collection
    if (!person) {
      person = await Pastor.findOne({ member_id });
    }

    if (!person) {
      return res.status(404).json({ message: "Member/Pastor not found" });
    }

    // ✅ Check if user already exists
    let existingUser = await User.findOne({ member_id });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists for this ID" });
    }

    // ✅ Always include "member" role
    const assignedRoles = Array.from(new Set(["member", ...(roles || [])]));

    // ✅ Create user entry (no password yet → signup will set it)
    const newUser = new User({
      member_id: person.member_id,
      email: person.email || "", // fallback
      member_name: person.member_name,
      roles: assignedRoles,
      isPreCreated: true,
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully by admin",
      user: {
        _id: newUser._id,
        member_id: newUser.member_id,
        member_name: newUser.member_name,
        email: newUser.email,
        roles: newUser.roles,
        isPreCreated: newUser.isPreCreated,
      },
    });
  } catch (err) {
    console.error("❌ createUserByAdmin Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getCemeteryManagers = async (req, res) => {
  try {
    const managers = await User.find(
      { roles: "cemeterymanager" },
      "-password"
    ).lean();

    res.json(managers);
  } catch (err) {
    console.error("❌ Error fetching cemetery managers:", err);
    res.status(500).json({ message: "Server error" });
  }
};
