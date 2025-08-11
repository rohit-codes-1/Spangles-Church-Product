// createUser.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// === CONFIGURE HERE ===
const MONGO_URL = "mongodb+srv://rohitspanglesinfotech:Z9KtcBAX8UWcDBg9@cluster0.tykfmzm.mongodb.net/church-management-local-spangles?retryWrites=true&w=majority"; // Change if needed
const USERNAME = "Spangles Product";
const PASSWORD = "spangles2016";

// === USER SCHEMA ===
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

// === MAIN FUNCTION ===
(async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB");

    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    const newUser = new User({
      username: USERNAME,
      password: hashedPassword,
    });

    await newUser.save();
    console.log("🎉 User created successfully!");
    console.log({ username: USERNAME, password: PASSWORD });

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating user:", err.message);
    process.exit(1);
  }
})();
