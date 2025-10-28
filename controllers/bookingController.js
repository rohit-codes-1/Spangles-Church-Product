const Booking = require("../Schema/bookingSchema");
const MarriageHall = require("../Schema/MarriageHall");
const MarriageHallCategory = require("../Schema/MarriageHallCategory");

// ➤ Create new booking
// exports.createBooking = async (req, res) => {
//   try {
//     const {
//       hall,
//       category,
//       date,
//       session,
//       customerName,
//       customerPhone,
//       amount,
//       advanceAmount,
//       payment_status,
//       booking_status,
//     } = req.body;

//     // prevent double booking for same hall+category+date+session
//     const exists = await Booking.findOne({ hall, category, date, session });
//     if (exists) {
//       return res.status(400).json({ status: "Failed", message: "Slot already booked" });
//     }

//     const booking = new Booking({
//       hall,
//       category,
//       date,
//       session,
//       customerName,
//       customerPhone,
//       amount,
//       advanceAmount,
//       payment_status,
//       booking_status,
//     });

//     await booking.save();

//     res.json({ status: "Success", message: "Booking created successfully", data: booking });
//   } catch (err) {
//     res.status(500).json({ status: "Failed", message: err.message });
//   }
// };
// exports.createBooking = async (req, res) => {
//   try {
//     const {
//       hall,
//       category,
//       date,
//       sessions, // now array
//       customerName,
//       customerPhone,
//       amount,
//       advanceAmount,
//       payment_status,
//       booking_status,
//     } = req.body;

//     // Check if customer already has a booking for same hall+date
//     let booking = await Booking.findOne({ hall, category, date: new Date(date), customerPhone });

//     if (booking) {
//       // Merge new sessions with existing ones
//       const newSessions = [...new Set([...booking.sessions, ...sessions])];
//       booking.sessions = newSessions;

//       booking.amount = amount; // update if needed
//       booking.advanceAmount = advanceAmount;
//       booking.payment_status = payment_status;
//       booking.booking_status = booking_status;

//       await booking.save();
//       return res.json({ status: "Success", message: "Booking updated with new sessions", data: booking });
//     }

//     // Otherwise, create a fresh booking
//     booking = new Booking({
//       hall,
//       category,
//       date,
//       sessions,
//       customerName,
//       customerPhone,
//       amount,
//       advanceAmount,
//       payment_status,
//       booking_status,
//     });

//     await booking.save();

//     res.json({ status: "Success", message: "Booking created successfully", data: booking });
//   } catch (err) {
//     res.status(500).json({ status: "Failed", message: err.message });
//   }
// };

exports.createBooking = async (req, res) => {
  try {
    const {
      hall,
      category,
      date,
      sessions, // array of sessions ["morning", "evening"]
      customerName,
      customerPhone,
      amount,
      advanceAmount,
      payment_status,
      booking_status,
    } = req.body;

    if (!hall || !date || !sessions?.length) {
      return res.status(400).json({ status: "Failed", message: "hall, date and sessions are required" });
    }

    // 1. Check if ANY of the requested sessions are already booked for this hall+date
    const conflict = await Booking.findOne({
      hall,
      date: new Date(date),
      sessions: { $in: sessions },
    });

    if (conflict && conflict.customerPhone !== customerPhone) {
      return res.status(400).json({ status: "Failed", message: "One or more sessions already booked" });
    }

    // 2. If the same customer already has a booking for this hall+date → merge sessions
    let booking = await Booking.findOne({ hall, date: new Date(date), customerPhone });

    if (booking) {
      booking.sessions = [...new Set([...booking.sessions, ...sessions])];
      booking.amount = amount;
      booking.advanceAmount = advanceAmount;
      booking.payment_status = payment_status;
      booking.booking_status = booking_status;
      booking.category = category; // keep latest category if you want

      await booking.save();
      return res.json({
        status: "Success",
        message: "Booking updated with new sessions",
        data: booking,
      });
    }

    // 3. Otherwise create new booking
    booking = new Booking({
      hall,
      category,
      date,
      sessions,
      customerName,
      customerPhone,
      amount,
      advanceAmount,
      payment_status,
      booking_status,
    });

    await booking.save();

    res.json({ status: "Success", message: "Booking created successfully", data: booking });
  } catch (err) {
    res.status(500).json({ status: "Failed", message: err.message });
  }
};


exports.getBookings = async (req, res) => {
  try {
    const { hallId, categoryId, date, startDate, endDate, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (hallId) query.hall = hallId;
    if (categoryId) query.category = categoryId;
    if (date) query.date = new Date(date);

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // 🔎 search by name or phone
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;
    const total = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .populate("hall", "hall_name")
      .populate("category", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      status: "Success",
      message: "Bookings fetched successfully",
      data: bookings,
      total,
    });
  } catch (err) {
    res.status(500).json({ status: "Failed", message: err.message });
  }
};

// ➤ Update booking (change status, payment, etc.)
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndUpdate(id, req.body, { new: true });
    if (!booking) {
      return res.status(404).json({ status: "Failed", message: "Booking not found" });
    }
    res.json({ status: "Success", message: "Booking updated", data: booking });
  } catch (err) {
    res.status(500).json({ status: "Failed", message: err.message });
  }
};

// ➤ Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      return res.status(404).json({ status: "Failed", message: "Booking not found" });
    }
    res.json({ status: "Success", message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ status: "Failed", message: err.message });
  }
};


// // ➤ Check availability for a hall+category+date+session
// exports.checkAvailability = async (req, res) => {
//   try {
//     const { hallId, categoryId, date, session } = req.query;

//     if (!hallId || !categoryId || !date || !session) {
//       return res.status(400).json({
//         status: "Failed",
//         message: "hallId, categoryId, date and session are required"
//       });
//     }

//     // const existing = await Booking.findOne({
//     //   hall: hallId,
//     //   category: categoryId,
//     //   date: new Date(date),
//     //   session
//     // });

//     // prevent double booking for same hall+date+session
//     const exists = await Booking.findOne({
//       hall,
//       date: new Date(date),
//       sessions: { $in: Array.isArray(session) ? session : [session] }
//     });
//     if (exists) {
//       return res.status(400).json({ status: "Failed", message: "Slot already booked" });
//     }


   

//     res.json({
//       status: "Success",
//       available: true,
//       message: "Slot is available"
//     });
//   } catch (err) {
//     res.status(500).json({ status: "Failed", message: err.message });
//   }
// };

exports.checkAvailability = async (req, res) => {
  try {
    const { hallId, date, session } = req.query;

    if (!hallId || !date || !session) {
      return res.status(400).json({
        status: "Failed",
        message: "hallId, date and session are required",
      });
    }

    // session can be single string or array
    const sessions = Array.isArray(session) ? session : [session];

    const existing = await Booking.findOne({
      hall: hallId,
      date: new Date(date),
      sessions: { $in: sessions },
    });

    if (existing) {
      return res.json({
        status: "Success",
        available: false,
        message: "Slot already booked",
        booking: existing,
      });
    }

    res.json({
      status: "Success",
      available: true,
      message: "Slot is available",
    });
  } catch (err) {
    res.status(500).json({ status: "Failed", message: err.message });
  }
};
