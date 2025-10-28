const Cemetery = require("../Schema/cemeterySchema");
const CemeteryBooking = require("../Schema/cemeteryBookingSchema");

// ✅ Book a slot
// exports.bookSlot = async (req, res) => {
//   try {
//     const {
//       cemetery_id,
//       cemetery_name,
//       slot_id,
//       isMember,
//       member,
//       non_member,
//     } = req.body;

//     // 1️⃣ Check if slot already booked
//     const existing = await CemeteryBooking.findOne({
//       cemetery_id,
//       slot_id,
//     });
//     if (existing)
//       return res.status(400).json({ message: "Slot already booked!" });

//     // 2️⃣ Create new booking
//     const booking = new CemeteryBooking({
//       cemetery_id,
//       cemetery_name,
//       slot_id,
//       isMember,
//       member: isMember ? member : null,
//       non_member: !isMember ? non_member : null,
//     });
//     await booking.save();

//     // 3️⃣ Update available slots count in cemetery
//     const cemetery = await Cemetery.findById(cemetery_id);
//     if (cemetery) {
//       const allSlots = cemetery.slots.flat().length;
//       const bookedCount = await CemeteryBooking.countDocuments({
//         cemetery_id,
//       });
//       cemetery.number_of_available_slots = allSlots - bookedCount;
//       await cemetery.save();
//     }

//     return res.status(201).json({
//       message: "Slot booked successfully",
//       booking,
//     });
//   } catch (err) {
//     console.error("Error booking slot:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


exports.bookSlot = async (req, res) => {
  try {
    const {
      cemetery_id,
      cemetery_name,
      slot_id,
      isMember,
      member,
      non_member,
    } = req.body;

    // 1️⃣ Check if slot already booked (Reserved or Buried)
    const existing = await CemeteryBooking.findOne({
      cemetery_id,
      slot_id,
      status: { $in: ["Reserved", "Buried"] },
    });

    if (existing)
      return res.status(400).json({ message: "Slot already booked or occupied!" });

    // 2️⃣ Create new booking with status Reserved
    const booking = new CemeteryBooking({
      cemetery_id,
      cemetery_name,
      slot_id,
      isMember,
      member: isMember ? member : null,
      non_member: !isMember ? non_member : null,
      status: "Reserved", // ✅ matches schema
    });

    await booking.save();

    // 3️⃣ Update available slots count in cemetery
    const cemetery = await Cemetery.findById(cemetery_id);
    if (cemetery) {
      const allSlots = cemetery.slots.flat().length;

      // count only Reserved or Buried slots
      const bookedCount = await CemeteryBooking.countDocuments({
        cemetery_id,
        status: { $in: ["Reserved", "Buried"] },
      });

      cemetery.number_of_available_slots = allSlots - bookedCount;
      await cemetery.save();
    }

    return res.status(201).json({
      message: "Slot booked successfully",
      booking,
    });
  } catch (err) {
    console.error("Error booking slot:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getReservedSlots = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Build search query
    const searchQuery = {
      status: { $in: ["Reserved", "Buried"] }, // only active bookings
      $or: [
        { cemetery_name: { $regex: search, $options: "i" } },
        { "member.member_name": { $regex: search, $options: "i" } },
        { "non_member.name": { $regex: search, $options: "i" } },
        { slot_id: { $regex: search, $options: "i" } },
      ],
    };

    // Count total matching documents
    const totalCount = await CemeteryBooking.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch bookings with pagination
    const bookings = await CemeteryBooking.find(searchQuery)
      .sort({ booked_at: -1 }) // latest first
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      bookings,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error("Error fetching reserved slots:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update slot status (Buried or Cancelled)
exports.updateSlotStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Buried", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Find booking by ID
    const booking = await CemeteryBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // If already buried and trying to change, block it
    if (booking.status === "Buried") {
      return res
        .status(400)
        .json({ message: "Buried slots cannot be modified" });
    }

    // Update status
    booking.status = status;
    await booking.save();

    // Handle cemetery availability changes
    const cemetery = await Cemetery.findById(booking.cemetery_id);

    if (cemetery) {
      if (status === "Cancelled") {
        // Increase available slots
        cemetery.number_of_available_slots =
          (cemetery.number_of_available_slots || 0) + 1;
      } else if (status === "Buried") {
        // Keep the slot occupied (no change)
        cemetery.number_of_available_slots = Math.max(
          (cemetery.number_of_available_slots || 0),
          0
        );
      }
      await cemetery.save();
    }

    return res.status(200).json({
      message: `Slot successfully marked as ${status}`,
      booking,
    });
  } catch (err) {
    console.error("Error updating slot status:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
