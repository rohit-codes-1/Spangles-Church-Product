// controllers/WomenEventController.js
const { WomenEvent, WomenEventBy } = require("../Schema/womenEventSchema");
const WomenFellowship = require("../Schema/WomenFellowship");
const mongoose = require("mongoose");



exports.addEvent = async (req, res) => {
  try {
    let {
      eventBy,
      eventName,
      eventDate,
      registerBefore,
      venue,
      description,
      competitions = [],
    } = req.body;

    const event = new WomenEvent({
      eventBy,
      eventName,
      eventDate,
      registerBefore,
      venue,
      description,
      womenCompetitions: competitions,
    });

    await event.save();

    res.status(201).json({
      status: "Success",
      message: "Event created successfully",
      event,
    });
  } catch (err) {
    console.error("Error adding women event:", err);
    res.status(500).json({
      status: "Failed",
      message: "Internal Server Error",
    });
  }
};



exports.getAllEvents = async (req, res) => {
  try {
    const { search = "", startDate, endDate, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (search) filter.eventName = { $regex: search, $options: "i" };

    if (startDate && endDate) {
      filter.eventDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      filter.eventDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.eventDate = { $lte: new Date(endDate) };
    }

    const total = await WomenEvent.countDocuments(filter);

    const events = await WomenEvent.find(filter)
      .populate("eventBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      status: "Success",
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: Number(page),
      events,
    });
  } catch (err) {
    console.error("Error fetching women events:", err);
    res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};


exports.getEventById = async (req, res) => {
  try {
    const event = await WomenEvent.findById(req.params.id).populate("eventBy", "name");
    if (!event) return res.status(404).json({ status: "Failed", message: "Event not found" });
    res.status(200).json({ status: "Success", event });
  } catch (err) {
    console.error("Error fetching women event by id:", err);
    res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};


exports.addEventBy = async (req, res) => {
  try {
    let { name } = req.body;

    const names = Array.isArray(name)
      ? name.map((n) => n.trim()).filter(Boolean)
      : [name && name.toString().trim()].filter(Boolean);

    if (names.length === 0) {
      return res.status(400).json({ status: "Failed", message: "Event By name(s) required" });
    }

    const existingDocs = await WomenEventBy.find({ name: { $in: names } });
    const existingNames = existingDocs.map((d) => d.name);
    const newNames = names.filter((n) => !existingNames.includes(n));

    if (newNames.length === 0) {
      return res.status(400).json({ status: "Failed", message: "All provided Event Bys already exist" });
    }

    const eventBys = await WomenEventBy.insertMany(newNames.map((n) => ({ name: n })));

    res.status(201).json({
      status: "Success",
      message: `Added ${eventBys.length} new Event By record(s)`,
      eventBys,
      duplicates: existingNames,
    });
  } catch (err) {
    console.error("Error adding Event By:", err);
    res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};


exports.getAllEventBys = async (req, res) => {
  try {
    const eventBys = await WomenEventBy.find().sort({ name: 1 });
    res.status(200).json({ status: "Success", eventBys });
  } catch (err) {
    console.error("Error fetching Event Bys:", err);
    res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};


exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      eventBy,
      eventName,
      eventDate,
      registerBefore,
      venue,
      description,
      womenCompetitions,
      groupEvents,
    } = req.body;

    const event = await WomenEvent.findById(id);
    if (!event) return res.status(404).json({ status: "Failed", message: "Event not found" });

    event.eventBy = eventBy || event.eventBy;
    event.eventName = eventName || event.eventName;
    event.eventDate = eventDate || event.eventDate;
    event.registerBefore = registerBefore || event.registerBefore;
    event.venue = venue || event.venue;
    event.description = description || event.description;
    event.womenCompetitions = Array.isArray(womenCompetitions) ? womenCompetitions : event.womenCompetitions;
    event.groupEvents = Array.isArray(groupEvents) ? groupEvents : event.groupEvents;

    await event.save();

    res.json({ status: "Success", message: "Event updated successfully", event });
  } catch (err) {
    console.error("Error updating women event:", err);
    res.status(500).json({ status: "Failed", message: "Server error while updating event" });
  }
};



exports.addParticipants = async (req, res) => {
  try {
    const { eventId, participants } = req.body;

    if (!eventId || !Array.isArray(participants)) {
      return res.status(400).json({
        status: "Failed",
        message: "eventId and participants (array) are required.",
      });
    }

    const eventDoc = await WomenEvent.findById(eventId);
    if (!eventDoc) return res.status(404).json({ status: "Failed", message: "Event not found" });

    const errors = [];

    for (const block of participants) {
      const competitionId = block.competitionId;
      const members = Array.isArray(block.members) ? block.members : [];

      if (!competitionId) {
        errors.push({ competitionId: null, message: "Missing competitionId" });
        continue;
      }
      if (!members.length) {
        errors.push({ competitionId, message: "No members provided" });
        continue;
      }

      const comp = eventDoc.womenCompetitions.id(competitionId) ||
                   eventDoc.womenCompetitions.find((c) => String(c._id) === String(competitionId));

      if (!comp) {
        errors.push({ competitionId, message: "Competition not found" });
        continue;
      }

      if (!Array.isArray(comp.participants)) comp.participants = [];

      for (const mem of members) {
        if (!mem || !mem.member_id) continue;
        const already = comp.participants.some((p) => String(p.member_id) === String(mem.member_id));
        if (!already) {
          comp.participants.push({
            member_id: mem.member_id,
            member_name: mem.member_name || "",
            member_tamil_name: mem.member_tamil_name || "",
            prize: mem.prize || "",
          });
        }
      }
    }

    await eventDoc.save();

    const result = { status: "Success", message: errors.length ? "Partial errors" : "Members added successfully" };
    if (errors.length) result.partialErrors = errors;

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in addParticipants (women):", err);
    return res.status(500).json({
      status: "Failed",
      message: "Internal Server Error",
      error: err.message,
    });
  }
};


// exports.updateParticipants = async (req, res) => {
//   try {
//     const { eventId, groupName, competitionId, participants } = req.body;

//     if (!eventId || !groupName || !competitionId || !Array.isArray(participants)) {
//       return res.status(400).json({
//         status: "Failed",
//         message: "eventId, groupName, competitionId and participants are required",
//       });
//     }

//     const eventDoc = await WomenEvent.findById(eventId);
//     if (!eventDoc) return res.status(404).json({ status: "Failed", message: "Event not found" });

//     const groupBlock = eventDoc.groupEvents.find((g) => g.groupName === groupName ||
//       (g.groupName && g.groupName.toString().trim().toLowerCase() === groupName.toString().trim().toLowerCase())
//     );

//     if (!groupBlock) return res.status(404).json({ status: "Failed", message: "Group not found" });

//     const comp = groupBlock.competitions.id(competitionId) ||
//       groupBlock.competitions.find((c) => String(c._id) === String(competitionId));

//     if (!comp) return res.status(404).json({ status: "Failed", message: "Competition not found" });

//     comp.participants = participants.map((p) => ({
//       member_id: p.member_id,
//       member_name: p.member_name,
//       member_tamil_name: p.member_tamil_name || "",
//       prize: p.prize || "None",
//     }));

//     await eventDoc.save();

//     return res.status(200).json({ status: "Success", message: "Participants updated successfully" });
//   } catch (err) {
//     console.error("Error updating members (women):", err);
//     return res.status(500).json({ status: "Failed", message: "Internal Server Error" });
//   }
// };

exports.updateParticipants = async (req, res) => {
  try {
    const { eventId, competitionId, participants } = req.body;

    if (!eventId || !competitionId || !Array.isArray(participants)) {
      return res.status(400).json({
        status: "Failed",
        message: "eventId, competitionId and participants are required",
      });
    }

    const eventDoc = await WomenEvent.findById(eventId);
    if (!eventDoc) return res.status(404).json({ status: "Failed", message: "Event not found" });

    const comp = eventDoc.womenCompetitions.id(competitionId) ||
                 eventDoc.womenCompetitions.find((c) => String(c._id) === String(competitionId));

    if (!comp) return res.status(404).json({ status: "Failed", message: "Competition not found" });

    comp.participants = participants.map((p) => ({
      member_id: p.member_id,
      member_name: p.member_name,
      member_tamil_name: p.member_tamil_name || "",
      prize: p.prize || "",
    }));

    await eventDoc.save();

    return res.status(200).json({ status: "Success", message: "Participants updated successfully", event: eventDoc });
  } catch (err) {
    console.error("Error updating participants (women):", err);
    return res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};


exports.getParticipants = async (req, res) => {
  try {
    const { eventId, groupName, competitionId } = req.query;

    if (!eventId || !groupName || !competitionId) {
      return res.status(400).json({
        status: "Failed",
        message: "eventId, groupName, and competitionId are required",
      });
    }

    const event = await WomenEvent.findById(eventId);
    if (!event) return res.status(404).json({ status: "Failed", message: "Event not found" });

    const groupBlock = event.groupEvents.find((g) => g.groupName === groupName ||
      (g.groupName && g.groupName.toString().trim().toLowerCase() === groupName.toString().trim().toLowerCase())
    );

    if (!groupBlock) return res.status(404).json({ status: "Failed", message: "Group not found in this event" });

    const competition = groupBlock.competitions.id(competitionId) ||
      groupBlock.competitions.find((c) => String(c._id) === String(competitionId));

    if (!competition) return res.status(404).json({ status: "Failed", message: "Competition not found" });

    return res.status(200).json({
      status: "Success",
      participants: competition.participants || [],
      competition,
    });
  } catch (err) {
    console.error("Error fetching participants (women):", err);
    return res.status(500).json({
      status: "Failed",
      message: "Internal Server Error",
    });
  }
};


// exports.addPrizes = async (req, res) => {
//   try {
//     const { eventId, groupName, competitionId, prizes } = req.body;

//     if (!eventId || !groupName || !competitionId || !Array.isArray(prizes)) {
//       return res.status(400).json({
//         status: "Failed",
//         message: "eventId, groupName, competitionId and prizes are required",
//       });
//     }

//     const event = await WomenEvent.findById(eventId);
//     if (!event) return res.status(404).json({ status: "Failed", message: "Event not found" });

//     const groupBlock = event.groupEvents.find((g) => g.groupName === groupName ||
//       (g.groupName && g.groupName.toString().trim().toLowerCase() === groupName.toString().trim().toLowerCase())
//     );
//     if (!groupBlock) return res.status(404).json({ status: "Failed", message: "Group not found" });

//     const competition = groupBlock.competitions.id(competitionId) ||
//       groupBlock.competitions.find((c) => String(c._id) === String(competitionId));
//     if (!competition) return res.status(404).json({ status: "Failed", message: "Competition not found" });

//     prizes.forEach(({ member_id, prize }) => {
//       const participant = competition.participants.find((p) => String(p.member_id) === String(member_id));
//       if (participant) participant.prize = prize || "None";
//     });

//     await event.save();

//     res.status(200).json({
//       status: "Success",
//       message: "Prizes updated successfully",
//       event,
//     });
//   } catch (err) {
//     console.error("Error updating prizes (women):", err);
//     res.status(500).json({
//       status: "Failed",
//       message: "Internal Server Error",
//     });
//   }
// };

exports.addPrizes = async (req, res) => {
  try {
    const { eventId, competitionId, prizes } = req.body;

    if (!eventId || !competitionId || !Array.isArray(prizes)) {
      return res.status(400).json({
        status: "Failed",
        message: "eventId, competitionId and prizes are required",
      });
    }

    const event = await WomenEvent.findById(eventId);
    if (!event) return res.status(404).json({ status: "Failed", message: "Event not found" });

    const competition = event.womenCompetitions.id(competitionId) ||
                        event.womenCompetitions.find((c) => String(c._id) === String(competitionId));

    if (!competition) return res.status(404).json({ status: "Failed", message: "Competition not found" });

    prizes.forEach(({ member_id, prize }) => {
      const participant = competition.participants.find((p) => String(p.member_id) === String(member_id));
      if (participant) participant.prize = prize || "None";
    });

    await event.save();

    res.status(200).json({
      status: "Success",
      message: "Prizes updated successfully",
      event,
    });
  } catch (err) {
    console.error("Error updating prizes (women):", err);
    res.status(500).json({
      status: "Failed",
      message: "Internal Server Error",
    });
  }
};


exports.updateEventBys = async (req, res) => {
  try {
    let { names } = req.body;
    if (!Array.isArray(names)) {
      return res.status(400).json({ status: "Failed", message: "names must be an array" });
    }

    names = names.map((n) => n.trim()).filter(Boolean);

    // Delete eventBys not in the new list
    await WomenEventBy.deleteMany({ name: { $nin: names } });

    // Find existing
    const existingDocs = await WomenEventBy.find({ name: { $in: names } });
    const existingNames = existingDocs.map((d) => d.name);

    // Add new ones
    const newNames = names.filter((n) => !existingNames.includes(n));
    const addedEventBys = newNames.length ? await WomenEventBy.insertMany(newNames.map((n) => ({ name: n }))) : [];

    const allEventBys = await WomenEventBy.find().sort({ name: 1 });

    res.status(200).json({
      status: "Success",
      message: "Event Bys updated successfully",
      eventBys: allEventBys,
    });
  } catch (err) {
    console.error("Error updating Event Bys (women):", err);
    res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};

module.exports = exports;
