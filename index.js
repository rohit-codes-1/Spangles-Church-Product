const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const auth = require("./models/auth");
const path = require("path");
const fs = require("fs");
const login = require("./router/loginRoutes");
const member_register = require("./router/registerRoutes");
const member = require("./router/memberRouter");
const family_member = require("./router/familyRouter");
const offering = require("./router/offeringsRouter");
const pastor = require("./router/pastorMemberRoutes");
// const bagOfferings = require("./router/bagofferingRouter");
const expense = require("./router/expenseRouter");
const reports = require("./router/reportRouter");
const app = express();
const uploadDir = path.join(__dirname, "uploads/expense");
const sundayClassRoutes = require("./router/sundayClassRoutes");
const SundayClassTagRoutes = require("./router/SundayClassTagRoutes");
const auctionRoutes = require("./router/auctionRoutes");
const memberSearchRoutes = require("./router/memberSearchRoutes");
const studentAuctionRoutes = require("./router/studentAuctionRoutes");
const attendanceRoutes = require("./router/attendanceRoutes");
const endeavourRoutes = require("./router/EndeavourClassRoutes");
const endeavourClassTagRoutes = require("./router/endeavourClassTagRoutes");
const endeavourAuctionRoutes = require("./router/endeavourAuctionRoutes");
const endeavourAttendanceRouter = require("./router/endeavourAttendanceRoutes")
const menFellowshipRoutes = require("./router/menFellowshipRoutes");
const womenFellowshipRoutes = require("./router/womenFellowshipRoutes");
const HarvestItemRoute = require("./router/HarvestItemRoute")
const harvestAuctionRoutes = require("./router/harvestAuctionRoutes");
const subscriptionRoutes = require("./router/subscriptionRoutes");
const categoryRouter = require("./router/categoryRouter");
const bagOfferingRoutes = require('./router/bagOfferingRoutes');
const youthFellowshipRoutes = require("./router/youthFellowshipRoutes");
const couplesFellowshipRoutes = require("./router/couplesFellowshipRoutes");
const menactivityRoutes = require("./router/menactivityRoutes");
const serviceActivityRoutes = require("./router/serviceActivityRoutes");
const womenactivityRoutes = require("./router/womenActivityRoutes");
const menAuctionRoutes = require("./router/menAuctionRoutes");
const womenAuctionRoutes = require("./router/WomenAuctionRoutes");
const youthAuctionRoutes = require("./router/YouthAuctionRoutes");
const choirRoutes = require("./router/choirRoutes");
const choirMasterRoutes = require("./router/choirMasterRoutes");
const regularExpenseRoutes = require("./router/regularExpenseRoutes");
const expenseRoutes = require("./router/expenseRoutes");
const marriageHallRoutes = require("./router/marriageHallRoutes");
const marriageHallCategoryRoutes = require("./router/marriageHallCategoryRoutes");
const bookingRouter = require("./router/bookingRouter");
const sundaySchoolExpenseRoutes = require("./router/sundaySchoolExpenseRoutes");
const endeavourExpenseRoutes = require("./router/endeavourExpenseRoutes");
const menFellowExpenseRoutes = require("./router/menFellowExpenseRoutes");
const womenFellowExpenseRoutes = require("./router/womenFellowExpenseRoutes");
const coupleFellowExpenseRoutes = require("./router/coupleExpenseRoutes");
const youthFellowExpenseRoutes = require("./router/youthExpenseRoutes");
const choirExpenseRoutes = require("./router/choirExpenseRoutes");
const cemeteryRoutes = require("./router/cemeteryRoutes");
const cemeteryBookingRoutes = require("./router/cemeteryBookingRoutes");
const endeavourEventRoutes = require("./router/endeavourEventRoutes");
const endeavourPrize = require("./router/endeavourPrize");
const sundaySchoolEventRoutes = require("./router/sundaySchoolEventRoutes");
const sundaySchoolPrizeRoutes = require("./router/sundayschoolPrize");
const womenEventRoutes = require("./router/womenEventRoutes"); 
const womenEventPrizeRoutes = require("./router/womenPrize");
const sundayschoolexams = require("./router/sundayExamRoutes");
const endeavourExamRoutes = require("./router/endeavourExamRoutes"); 
const dashboardRoutes = require("./router/DashboardRoutes"); 

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
const PORT = process.env.PORT || 5001;
// mongoose
//   .connect(process.env.MONGO_URL)
//   .then(() => console.log("DataBase Connected"))
//   .catch((err) => {
//     console.log(err);
//   });
//   console.log("******** INDEX.JS IS RUNNING AND CHANGED ********"); 

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("✅ DataBase Connected");
    console.log("📦 Connected to MongoDB Database:", mongoose.connection.name);
  })
  .catch((err) => {
    console.log("❌ MongoDB connection error:", err);
  });


// ✅ Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

// app.use(cors());
app.get("/", (req, res) => {
  res.send(" Server Running ");
});
app.use("/api/reports", reports);
app.use("/api/pastor", pastor);

app.use("/api", login);
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/", auth.authenticateUser);
app.use("/api/member", member);
app.use("/api/family", family_member);
app.use("/api/offerings", offering);
// app.use("/api/expense", expense);
// app.use("/api/bagOfferings", bagOfferings);
app.use("/api/sunday-classes", sundayClassRoutes);
app.use("/api/sunday-class-tags", SundayClassTagRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/member-search", memberSearchRoutes);
app.use("/api/student-auctions", studentAuctionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/endeavour-classes", endeavourRoutes);
app.use("/api/endeavour-class-tags", endeavourClassTagRoutes);
app.use("/api/endeavour-auctions", endeavourAuctionRoutes);
app.use("/api/endeavour-attendance", endeavourAttendanceRouter);
app.use("/api/mens-fellowship", menFellowshipRoutes);
app.use("/api/womens-fellowship", womenFellowshipRoutes);
app.use("/api/harvest-items", HarvestItemRoute);
app.use("/api/harvest-auctions", harvestAuctionRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/categories", categoryRouter);
app.use('/api/bagOfferings', bagOfferingRoutes);
app.use("/api/youth-fellowship", youthFellowshipRoutes);
app.use("/api/couples-fellowship", couplesFellowshipRoutes);
app.use("/api/men-activities", menactivityRoutes);
app.use("/api/serviceactivity", serviceActivityRoutes);
app.use("/api/women-activities", womenactivityRoutes);
app.use("/api/men-auctions", menAuctionRoutes);
app.use("/api/women-auctions", womenAuctionRoutes);
app.use("/api/youth-auctions", youthAuctionRoutes);
app.use("/api/choir-members", choirRoutes);
app.use("/api/choir-masters", choirMasterRoutes);
app.use("/api/regular-expenses", regularExpenseRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/marriage-halls", marriageHallRoutes);
app.use("/api/marriage-hall-categories", marriageHallCategoryRoutes);
app.use("/api/bookings", bookingRouter);
app.use("/api/sundayschool-expenses", sundaySchoolExpenseRoutes);
app.use("/api/endeavour-expenses", endeavourExpenseRoutes);
app.use("/api/menfellow-expenses", menFellowExpenseRoutes);
app.use("/api/womenfellow-expenses", womenFellowExpenseRoutes);
app.use("/api/couplefellow-expenses", coupleFellowExpenseRoutes);
app.use("/api/youthfellow-expenses", youthFellowExpenseRoutes);
app.use("/api/choir-expenses", choirExpenseRoutes);
app.use("/api/cemeteries", cemeteryRoutes);
app.use("/api/cemetery-bookings", cemeteryBookingRoutes);
app.use("/api/endeavour-events", endeavourEventRoutes);
app.use("/api/endeavour/prizes", endeavourPrize);
app.use("/api/sundayschool-events", sundaySchoolEventRoutes);
app.use("/api/sundayschool/prizes", sundaySchoolPrizeRoutes);
app.use("/api/women-events", womenEventRoutes);
app.use("/api/women/prizes", womenEventPrizeRoutes);
app.use("/api/sundayschool-exams", sundayschoolexams);
app.use("/api/endeavour-exams", endeavourExamRoutes); 
app.use("/api/dashboard", dashboardRoutes);


// Connect to MongoDB
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
 