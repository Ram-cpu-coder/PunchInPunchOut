const express = require("express");
const Week = require("../models/Week");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDefaultDays(weekStart) {
  const start = new Date(`${weekStart}T00:00:00`);

  return dayKeys.map((key, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      key,
      label: labels[index],
      date: toDateString(date),
      start: "",
      end: "",
      breakMinutes: 0,
      notes: ""
    };
  });
}

function normalizeWeek(payload, userId) {
  const weekStart = payload.weekStart;
  const incomingDays = Array.isArray(payload.days) ? payload.days : [];
  const defaults = createDefaultDays(weekStart);

  return {
    userId,
    weekStart,
    hourlyRate: payload.hourlyRate === "" || payload.hourlyRate == null ? null : Number(payload.hourlyRate),
    isPaid: Boolean(payload.isPaid),
    days: defaults.map((day) => {
      const match = incomingDays.find((entry) => entry.key === day.key) || {};

      return {
        ...day,
        start: match.start || "",
        end: match.end || "",
        breakMinutes: Number(match.breakMinutes || 0),
        notes: match.notes || ""
      };
    })
  };
}

router.get("/", async (_req, res, next) => {
  try {
    const weeks = await Week.find({ userId: _req.user._id }).sort({ weekStart: -1 }).lean();
    res.json(weeks.map((week) => normalizeWeek(week, _req.user._id)));
  } catch (error) {
    next(error);
  }
});

router.get("/:weekStart", async (req, res, next) => {
  try {
    const existing = await Week.findOne({ userId: req.user._id, weekStart: req.params.weekStart }).lean();
    res.json(normalizeWeek(existing || { weekStart: req.params.weekStart }, req.user._id));
  } catch (error) {
    next(error);
  }
});

router.put("/:weekStart", async (req, res, next) => {
  try {
    const normalized = normalizeWeek({ ...req.body, weekStart: req.params.weekStart }, req.user._id);
    const week = await Week.findOneAndUpdate({ userId: req.user._id, weekStart: req.params.weekStart }, normalized, {
      new: true,
      upsert: true,
      runValidators: true
    }).lean();

    res.json(week);
  } catch (error) {
    next(error);
  }
});

router.delete("/:weekStart", async (req, res, next) => {
  try {
    await Week.deleteOne({ userId: req.user._id, weekStart: req.params.weekStart });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  res.status(400).json({ message: error.message || "Something went wrong" });
});

module.exports = router;
