const mongoose = require("mongoose");
const User = require("./Schema/adminlogSchema"); // adjust path
require("dotenv").config();

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

async function addAdminRole() {
  try {
    const user = await User.findOne({ member_id: "MBR000001" });
    if (!user) return console.log("User not found");

    // Add admin role if not already present
    if (!user.roles.includes("admin")) {
      user.roles.push("admin");
      await user.save();
      console.log("Admin role added successfully!");
    } else {
      console.log("User already has admin role");
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

addAdminRole();
