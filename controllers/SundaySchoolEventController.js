const { SundaySchoolEvent, SundaySchoolEventBy } = require("../Schema/sundaysclEventSchema");
const SundaySchoolClass = require("../Schema/SundayClass");
const mongoose = require("mongoose");



// exports.addEvent = async (req, res) => {
//   try {
//     let {
//       eventBy,
//       eventName,
//       eventDate,
//       registerBefore,
//       venue,
//       description,
//       studentCompetitions = [],
//       teacherCompetitions = [],
//       classEvents = [],
//       teacherCompEvents = [],
//     } = req.body;

//     // ✅ Clean class events: remove invalid competitions
//     classEvents = classEvents
//       .map((cls) => ({
//         ...cls,
//         competitions: (cls.competitions || []).filter(
//           (c) => c.competition && c.title
//         ),
//       }))
//       .filter((cls) => cls.className && cls.competitions.length > 0);

//     // ✅ Clean teacher competitions (already flattened, just remove invalid entries)
//     teacherCompEvents = (teacherCompEvents || []).filter(
//       (t) => t.competition && t.title
//     );

//     // ✅ Validate required fields
//     if (!eventBy || !eventName || !eventDate || !registerBefore || !venue || !description) {
//       return res.status(400).json({
//         status: "Failed",
//         message: "All required fields must be provided",
//       });
//     }

//     // ✅ Create and save event
//     const event = new SundaySchoolEvent({
//       eventBy,
//       eventName,
//       eventDate,
//       registerBefore,
//       venue,
//       description,
//       studentCompetitions,
//       teacherCompetitions,
//       classEvents,
//       teacherCompEvents,
//     });

//     await event.save();

//     res.status(201).json({
//       status: "Success",
//       message: "Event created successfully",
//       event,
//     });
//   } catch (err) {
//     console.error("Error adding event:", err);
//     res.status(500).json({
//       status: "Failed",
//       message: "Internal Server Error",
//     });
//   }
// };


// ✅ Add Event


exports.addEvent = async (req, res) => {
  try {
    let {
      eventBy,
      eventName,
      eventDate,
      registerBefore,
      venue,
      description,
      studentCompetitions = [],
      teacherCompetitions = [],
      classEvents = [],
      teacherCompEvents = [],
    } = req.body;

    // ✅ Clean class events: remove invalid competitions
    classEvents = classEvents
      .map((cls) => ({
        ...cls,
        competitions: (cls.competitions || []).filter(
          (c) => c.competition && c.title
        ),
      }))
      .filter((cls) => cls.className && cls.competitions.length > 0);

    // ✅ Clean teacher competitions
    teacherCompEvents = (teacherCompEvents || []).filter(
      (t) => t.competition && t.title
    );

    // ✅ Validate required fields
    if (
      !eventBy ||
      !eventName ||
      !eventDate ||
      !registerBefore ||
      !venue ||
      !description
    ) {
      return res.status(400).json({
        status: "Failed",
        message: "All required fields must be provided",
      });
    }

    // ✅ Expand grouped class names to actual sections (like Endeavour)
    let expandedClassEvents = [];

    for (const cls of classEvents) {
      const sections = await SundaySchoolClass.find({ class_name: cls.className });

      if (sections.length === 0) {
        // No sections found, use class as is
        expandedClassEvents.push(cls);
      } else {
        sections.forEach((sec) => {
          expandedClassEvents.push({
            className: `${sec.class_name}${sec.section_name ? ` - ${sec.section_name}` : ""}`,
            competitions: cls.competitions,
          });
        });
      }
    }

    // ✅ Create and save event
    const event = new SundaySchoolEvent({
      eventBy,
      eventName,
      eventDate,
      registerBefore,
      venue,
      description,
      studentCompetitions,
      teacherCompetitions,
      classEvents: expandedClassEvents,
      teacherCompEvents,
    });

    await event.save();

    res.status(201).json({
      status: "Success",
      message: "Event created successfully for all sections",
      event,
    });
  } catch (err) {
    console.error("Error adding Sunday School event:", err);
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

    if (search) {
      filter.eventName = { $regex: search, $options: "i" }; // case-insensitive search
    }

    if (startDate && endDate) {
      filter.eventDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      filter.eventDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.eventDate = { $lte: new Date(endDate) };
    }

    const total = await SundaySchoolEvent.countDocuments(filter);

    const events = await SundaySchoolEvent.find(filter)
      .populate("eventBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      status: "Success",
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      events,
    });
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};


// 🟢 Get single event by ID
exports.getEventById = async (req, res) => {
  try {
    const event = await SundaySchoolEvent.findById(req.params.id)
      .populate("eventBy", "name");

    if (!event)
      return res.status(404).json({ status: "Failed", message: "Event not found" });

    res.status(200).json({ status: "Success", event });
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
}; 



// 🟣 Add new Event By
exports.addEventBy = async (req, res) => {
  try {
    let { name } = req.body;

    // ✅ Normalize input: allow single string or array
    const names = Array.isArray(name)
      ? name.map((n) => n.trim()).filter(Boolean)
      : [name.trim()].filter(Boolean);

    if (names.length === 0) {
      return res.status(400).json({ status: "Failed", message: "Event By name(s) required" });
    }

    // ✅ Find duplicates (existing in DB)
    const existingDocs = await SundaySchoolEventBy.find({ name: { $in: names } });
    const existingNames = existingDocs.map((d) => d.name);
    const newNames = names.filter((n) => !existingNames.includes(n));

    if (newNames.length === 0) {
      return res.status(400).json({ status: "Failed", message: "All provided Event Bys already exist" });
    }

    // ✅ Insert all new EventBys
    const eventBys = await SundaySchoolEventBy.insertMany(
      newNames.map((n) => ({ name: n }))
    );

    res.status(201).json({
      status: "Success",
      message: `Added ${eventBys.length} new Event By record(s)`,
      eventBys,
      duplicates: existingNames, // optional: send back skipped ones
    });
  } catch (err) {
    console.error("Error adding Event By:", err);
    res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};


// 🟣 Get all Event Bys
exports.getAllEventBys = async (req, res) => {
  try {
    const eventBys = await SundaySchoolEventBy.find().sort({ name: 1 });
    res.status(200).json({ status: "Success", eventBys });
  } catch (err) {
    console.error("Error fetching Event Bys:", err);
    res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};


// exports.updateEvent = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       eventBy,
//       eventName,
//       eventDate,
//       registerBefore,
//       venue,
//       description,
//       studentCompetitions,
//       teacherCompetitions,
//       classEvents,
//       teacherCompEvents,
//     } = req.body;

//     // Find event by ID
//     const event = await SundaySchoolEvent.findById(id);
//     if (!event) {
//       return res.status(404).json({ status: "Failed", message: "Event not found" });
//     }

//     // Update fields
//     event.eventBy = eventBy || event.eventBy;
//     event.eventName = eventName || event.eventName;
//     event.eventDate = eventDate || event.eventDate;
//     event.registerBefore = registerBefore || event.registerBefore;
//     event.venue = venue || event.venue;
//     event.description = description || event.description;
//     event.studentCompetitions = studentCompetitions || [];
//     event.teacherCompetitions = teacherCompetitions || [];
//     event.classEvents = classEvents || [];
//     event.teacherCompEvents = teacherCompEvents || [];

//     await event.save();

//     res.json({ status: "Success", message: "Event updated successfully", event });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ status: "Failed", message: "Server error while updating event" });
//   }
// };


exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      eventBy,
      eventName,
      eventDate,
      registerBefore,
      venue,
      description,
      studentCompetitions = [],
      teacherCompetitions = [],
      classEvents = [],
      teacherCompEvents = [],
    } = req.body;

    // ✅ Clean class events
    classEvents = classEvents
      .map((cls) => ({
        ...cls,
        competitions: (cls.competitions || []).filter(
          (c) => c.competition && c.title
        ),
      }))
      .filter((cls) => cls.className && cls.competitions.length > 0);

    // ✅ Clean teacher competitions
    teacherCompEvents = (teacherCompEvents || []).filter(
      (t) => t.competition && t.title
    );

    // ✅ Validate required fields
    if (
      !eventBy ||
      !eventName ||
      !eventDate ||
      !registerBefore ||
      !venue ||
      !description
    ) {
      return res.status(400).json({
        status: "Failed",
        message: "All required fields must be provided",
      });
    }

    // ✅ Expand grouped class names to actual sections
    let expandedClassEvents = [];
    for (const cls of classEvents) {
      const sections = await SundaySchoolClass.find({ class_name: cls.className });
      if (sections.length === 0) {
        expandedClassEvents.push(cls);
      } else {
        sections.forEach((sec) => {
          expandedClassEvents.push({
            className: `${sec.class_name}${sec.section_name ? ` - ${sec.section_name}` : ""}`,
            competitions: cls.competitions,
          });
        });
      }
    }

    // ✅ Update the event
    const updatedEvent = await SundaySchoolEvent.findByIdAndUpdate(
      id,
      {
        eventBy,
        eventName,
        eventDate,
        registerBefore,
        venue,
        description,
        studentCompetitions,
        teacherCompetitions,
        classEvents: expandedClassEvents,
        teacherCompEvents,
      },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ status: "Failed", message: "Event not found" });
    }

    res.json({
      status: "Success",
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (err) {
    console.error("Error updating Sunday School event:", err);
    res.status(500).json({
      status: "Failed",
      message: "Internal Server Error",
    });
  }
};


exports.getEventsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { search = "", startDate, endDate, page = 1, limit = 10 } = req.query;

    // 1️⃣ Find all classes this teacher handles
    const classes = await SundaySchoolClass.find({
      "teacher.member_id": teacherId,
    }).lean();

    if (!classes || classes.length === 0) {
      return res.status(200).json({
        success: true,
        total: 0,
        totalPages: 1,
        events: [],
      });
    }

    // 2️⃣ Combine class_name + section_name to match classEvents.className
    const classNames = classes.map(
      (c) => `${c.class_name} - ${c.section_name}`
    );

    // 3️⃣ Build filter
    const filter = {
      classEvents: { $elemMatch: { className: { $in: classNames } } },
    };

    if (search) {
      filter.$or = [
        { eventName: { $regex: search, $options: "i" } },
        { venue: { $regex: search, $options: "i" } },
        { "eventBy.name": { $regex: search, $options: "i" } },
      ];
    }

    if (startDate && endDate) {
      filter.eventDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // 4️⃣ Pagination setup
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 5️⃣ Fetch filtered events
    const total = await SundaySchoolEvent.countDocuments(filter);

    const events = await SundaySchoolEvent.find(filter)
      .populate("eventBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 6️⃣ Filter each event’s classEvents array to include only teacher’s classes
    const filteredEvents = events.map((event) => ({
      ...event,
      classEvents: event.classEvents.filter((ce) =>
        classNames.includes(ce.className)
      ),
    }));

    return res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit),
      events: filteredEvents,
    });
  } catch (error) {
    console.error("Error fetching events for teacher:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching teacher's events",
      error: error.message,
    });
  }
};




exports.addParticipants = async (req, res) => {
  try {
    const { eventId, className, participants } = req.body;

    // basic validation
    if (!eventId || !className || !Array.isArray(participants)) {
      return res.status(400).json({
        status: "Failed",
        message: "eventId, className and participants (array) are required.",
      });
    }

    // load event
    const event = await SundaySchoolEvent.findById(eventId).lean().exec();
    if (!event) {
      return res.status(404).json({ status: "Failed", message: "Event not found" });
    }

    // find class block in the event (try both exact match and normalized)
    const classBlockIndex = (event.classEvents || []).findIndex((ce) => {
      if (ce.className === className) return true;
      // tolerantly compare normalized labels (trim + lower)
      const normalize = (s = "") => s.toString().trim().toLowerCase();
      return normalize(ce.className) === normalize(className);
    });

    if (classBlockIndex === -1) {
      return res.status(404).json({
        status: "Failed",
        message: `Class "${className}" not found in the event.`,
      });
    }

    // We will operate on a Mongoose document for modifications
    const eventDoc = await SundaySchoolEvent.findById(eventId);
    const classBlock = eventDoc.classEvents[classBlockIndex];

    // Keep track of errors for missing competitions, but still try to apply valid ones
    const errors = [];

    for (const block of participants) {
      const { competitionId, students } = block;

      if (!competitionId) {
        errors.push({ competitionId: null, message: "Missing competitionId" });
        continue;
      }
      if (!Array.isArray(students) || students.length === 0) {
        errors.push({ competitionId, message: "No students provided" });
        continue;
      }

      // find competition by id (tolerant to string/ObjectId)
      let comp = null;
      // try subdocument id() helper (works if competitionId is an ObjectId or string)
      try {
        comp = classBlock.competitions.id(competitionId);
      } catch (e) {
        comp = null;
      }
      // fallback: find by string match
      if (!comp) {
        comp = classBlock.competitions.find(
          (c) => String(c._id) === String(competitionId)
        );
      }

      if (!comp) {
        errors.push({ competitionId, message: "Competition not found in this class block" });
        continue;
      }

      // ensure participants array exists on the competition subdoc
      if (!Array.isArray(comp.participants)) comp.participants = [];

      // add snapshots while preventing duplicates by member_id
      for (const stu of students) {
        if (!stu || !stu.member_id) continue; // ignore invalid student objects
        const already = comp.participants.some((p) => String(p.member_id) === String(stu.member_id));
        if (!already) {
          comp.participants.push({
            member_id: stu.member_id,
            member_name: stu.member_name || "",
            class_name: stu.class_name || "",
            section_name: stu.section_name || "",
          });
        }
      }
    }

    // Save modified event doc
    await eventDoc.save();

    // Build result: success and any non-blocking errors
    const result = { status: "Success", message: "Participants added (partial errors possible)" };
    if (errors.length === 0) {
      result.message = "Participants added successfully";
      return res.status(200).json(result);
    } else {
      result.partialErrors = errors;
      // 207 Multi-Status would be ideal, but many clients expect 200/4xx, so return 200 with details
      return res.status(200).json(result);
    }
  } catch (err) {
    console.error("Error in addParticipants:", err);
    return res.status(500).json({
      status: "Failed",
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

exports.updateParticipants = async (req, res) => {
  try {
    const { eventId, className, competitionId, participants } = req.body;

    if (!eventId || !className || !competitionId || !Array.isArray(participants)) {
      return res.status(400).json({
        status: "Failed",
        message: "eventId, className, competitionId and participants are required",
      });
    }

    const eventDoc = await SundaySchoolEvent.findById(eventId);
    if (!eventDoc) return res.status(404).json({ status: "Failed", message: "Event not found" });

    const classBlock = eventDoc.classEvents.find((c) => c.className === className);
    if (!classBlock) return res.status(404).json({ status: "Failed", message: "Class not found" });

    const comp = classBlock.competitions.id(competitionId) ||
      classBlock.competitions.find((c) => String(c._id) === String(competitionId));

    if (!comp) return res.status(404).json({ status: "Failed", message: "Competition not found" });

    // Replace participants with updated list
    comp.participants = participants.map((p) => ({
      member_id: p.member_id,
      member_name: p.member_name,
      class_name: p.class_name,
      section_name: p.section_name,
      prize: p.prize || "None",
    }));

    await eventDoc.save();

    return res.status(200).json({ status: "Success", message: "Participants updated successfully" });
  } catch (err) {
    console.error("Error updating participants:", err);
    return res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};



exports.getParticipants = async (req, res) => {
  try {
    const { eventId, className, competitionId } = req.query;

    if (!eventId || !className || !competitionId) {
      return res.status(400).json({
        status: "Failed",
        message: "eventId, className, and competitionId are required",
      });
    }

    const event = await SundaySchoolEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ status: "Failed", message: "Event not found" });
    }

    const classBlock = event.classEvents.find(c => c.className === className);
    if (!classBlock) {
      return res.status(404).json({ status: "Failed", message: "Class not found in this event" });
    }

    const competition = classBlock.competitions.id(competitionId) ||
      classBlock.competitions.find(c => String(c._id) === String(competitionId));

    if (!competition) {
      return res.status(404).json({ status: "Failed", message: "Competition not found" });
    }

    return res.status(200).json({
      status: "Success",
      participants: competition.participants || [],
    });
  } catch (err) {
    console.error("Error fetching participants:", err);
    return res.status(500).json({
      status: "Failed",
      message: "Internal Server Error",
    });
  }
};


exports.addPrizes = async (req, res) => {
  try {
    const { eventId, className, competitionId, prizes } = req.body;
    // prizes = [{ member_id: "M101", prize: "First" }, ...]

    if (!eventId || !className || !competitionId || !Array.isArray(prizes)) {
      return res.status(400).json({
        status: "Failed",
        message: "eventId, className, competitionId and prizes are required",
      });
    }

    const event = await SundaySchoolEvent.findById(eventId);
    if (!event)
      return res.status(404).json({ status: "Failed", message: "Event not found" });

    const classBlock = event.classEvents.find(c => c.className === className);
    if (!classBlock)
      return res.status(404).json({ status: "Failed", message: "Class not found" });

    const competition =
      classBlock.competitions.id(competitionId) ||
      classBlock.competitions.find(c => String(c._id) === String(competitionId));

    if (!competition)
      return res.status(404).json({ status: "Failed", message: "Competition not found" });

    // Update prizes
    prizes.forEach(({ member_id, prize }) => {
      const participant = competition.participants.find(p => p.member_id === member_id);
      if (participant) participant.prize = prize || "None";
    });

    await event.save();

    res.status(200).json({
      status: "Success",
      message: "Prizes updated successfully",
      event,
    });
  } catch (err) {
    console.error("Error updating prizes:", err);
    res.status(500).json({
      status: "Failed",
      message: "Internal Server Error",
    });
  }
};

exports.addTeachers = async (req, res) => {
  try {
    const { eventId, teachers } = req.body;

    if (!eventId || !Array.isArray(teachers) || teachers.length === 0) {
      return res.status(400).json({
        status: "Failed",
        message: "eventId and teachers array are required",
      });
    }

    // load event as a Mongoose document (not lean) so we can modify & save
    const event = await SundaySchoolEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ status: "Failed", message: "Event not found" });
    }

    // ensure arrays exist
    if (!Array.isArray(event.teacherCompEvents)) event.teacherCompEvents = [];
    if (!Array.isArray(event.teacherCompetitions)) event.teacherCompetitions = [];

    const errors = [];

    for (const tRaw of teachers) {
      // normalize incoming fields (accept teacherId or teacher_id, teacherName or teacher_name)
      const competition = (tRaw.competition || tRaw.competitionName || "").toString().trim();
      const teacherId = (tRaw.teacherId || tRaw.teacher_id || "").toString().trim();
      const teacherName = (tRaw.teacherName || tRaw.teacher_name || "").toString().trim();
      const className = (tRaw.className || tRaw.class_name || "").toString().trim();
      const title = (tRaw.title || tRaw.compTitle || competition).toString().trim() || competition;

      if (!competition || !teacherId || !teacherName) {
        errors.push({ teacher: tRaw, message: "Missing competition or teacher details" });
        continue;
      }

      // 1) Ensure teacherCompetitions (string list) contains the competition name
      if (!event.teacherCompetitions.includes(competition)) {
        event.teacherCompetitions.push(competition);
      }

      // 2) Find existing teacherCompEvents entry for this competition
      let compEntry = event.teacherCompEvents.find((c) => String(c.competition) === String(competition));

      if (!compEntry) {
        // create new comp entry (title is required in your schema so supply it)
        compEntry = {
          competition,
          title: title || competition,
          participants: [],
        };
        event.teacherCompEvents.push(compEntry);
        // compEntry is a plain object inside Mongoose doc; we'll mutate its participants below
      }

      // ensure participants array exists
      if (!Array.isArray(compEntry.participants)) compEntry.participants = [];

      // prevent duplicate teacher participant by member_id
      const already = compEntry.participants.some((p) => String(p.member_id) === String(teacherId));
      if (!already) {
        compEntry.participants.push({
          member_id: teacherId,
          member_name: teacherName,
          prize: "", // keep prize blank by default
        });
      }
    }

    // Save document
    await event.save();

    const message = errors.length === 0
      ? "Teachers enrolled successfully"
      : "Teachers enrolled (partial errors exist)";

    return res.status(200).json({
      status: "Success",
      message,
      partialErrors: errors.length > 0 ? errors : undefined,
      event,
    });
  } catch (err) {
    console.error("Error enrolling teachers:", err);
    return res.status(500).json({ status: "Failed", message: "Internal Server Error", error: err.message });
  }
};



// 🟣 Update Event Bys: Add new & remove deleted
exports.updateEventBys = async (req, res) => {
  try {
    let { names } = req.body; // array of tags to keep
    if (!Array.isArray(names)) {
      return res.status(400).json({ status: "Failed", message: "names must be an array" });
    }

    // Trim and remove empty strings
    names = names.map((n) => n.trim()).filter(Boolean);

    // 1️⃣ Delete Event Bys that are NOT in the new list
    await SundaySchoolEventBy.deleteMany({ name: { $nin: names } });

    // 2️⃣ Find existing Event Bys in the DB
    const existingDocs = await SundaySchoolEventBy.find({ name: { $in: names } });
    const existingNames = existingDocs.map((d) => d.name);

    // 3️⃣ Add new Event Bys that do not exist yet
    const newNames = names.filter((n) => !existingNames.includes(n));
    const addedEventBys = await SundaySchoolEventBy.insertMany(
      newNames.map((n) => ({ name: n }))
    );

    // 4️⃣ Return updated list
    const allEventBys = await SundaySchoolEventBy.find().sort({ name: 1 });

    res.status(200).json({
      status: "Success",
      message: "Event Bys updated successfully",
      eventBys: allEventBys,
    });
  } catch (err) {
    console.error("Error updating Event Bys:", err);
    res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};


// Get teacher competition participants
exports.getTeacherParticipants = async (req, res) => {
  try {
    const { eventId, competitionId } = req.query;
    if (!eventId || !competitionId) {
      return res.status(400).json({ status: "Failed", message: "eventId and competitionId are required" });
    }

    const event = await SundaySchoolEvent.findById(eventId);
    if (!event) return res.status(404).json({ status: "Failed", message: "Event not found" });

    const comp = event.teacherCompEvents.id(competitionId) ||
      event.teacherCompEvents.find(c => String(c._id) === String(competitionId));

    if (!comp) return res.status(404).json({ status: "Failed", message: "Teacher competition not found" });

    return res.status(200).json({ status: "Success", participants: comp.participants || [], competition: comp });
  } catch (err) {
    console.error("Error fetching teacher participants:", err);
    return res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};

// Update teacher competition participants (replace list)
exports.updateTeacherParticipants = async (req, res) => {
  try {
    const { eventId, competitionId, participants } = req.body;
    // participants = [{ member_id, member_name, prize? }, ...]

    if (!eventId || !competitionId || !Array.isArray(participants)) {
      return res.status(400).json({
        status: "Failed",
        message: "eventId, competitionId and participants are required",
      });
    }

    const eventDoc = await SundaySchoolEvent.findById(eventId);
    if (!eventDoc) return res.status(404).json({ status: "Failed", message: "Event not found" });

    const comp = eventDoc.teacherCompEvents.id(competitionId) ||
      eventDoc.teacherCompEvents.find((c) => String(c._id) === String(competitionId));

    if (!comp) return res.status(404).json({ status: "Failed", message: "Teacher competition not found" });

    comp.participants = participants.map((p) => ({
      member_id: p.member_id,
      member_name: p.member_name,
      prize: p.prize || "",
    }));

    await eventDoc.save();

    return res.status(200).json({ status: "Success", message: "Teacher participants updated successfully", event: eventDoc });
  } catch (err) {
    console.error("Error updating teacher participants:", err);
    return res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};

// Update prizes for teacher competition (partial update by member_id)
exports.addPrizesForTeacher = async (req, res) => {
  try {
    const { eventId, competitionId, prizes } = req.body;
    // prizes = [{ member_id, prize }, ...]

    if (!eventId || !competitionId || !Array.isArray(prizes)) {
      return res.status(400).json({
        status: "Failed",
        message: "eventId, competitionId and prizes are required",
      });
    }

    const event = await SundaySchoolEvent.findById(eventId);
    if (!event) return res.status(404).json({ status: "Failed", message: "Event not found" });

    const competition =
      event.teacherCompEvents.id(competitionId) ||
      event.teacherCompEvents.find(c => String(c._id) === String(competitionId));

    if (!competition)
      return res.status(404).json({ status: "Failed", message: "Teacher competition not found" });

    // Update prizes for participants
    prizes.forEach(({ member_id, prize }) => {
      const participant = competition.participants.find(p => String(p.member_id) === String(member_id));
      if (participant) participant.prize = prize || "";
    });

    await event.save();

    res.status(200).json({
      status: "Success",
      message: "Teacher prizes updated successfully",
      event,
    });
  } catch (err) {
    console.error("Error updating teacher prizes:", err);
    res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};
