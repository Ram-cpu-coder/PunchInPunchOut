const express = require("express");
const Settings = require("../models/Settings");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function normalizeTimer(payload) {
  if (!payload || payload.weekStart == null || payload.dayIndex == null || !payload.startedAt || !payload.startTime) {
    return null;
  }

  return {
    weekStart: String(payload.weekStart),
    dayIndex: Number(payload.dayIndex),
    startedAt: new Date(payload.startedAt),
    startTime: String(payload.startTime)
  };
}

function normalizeSettings(payload = {}, existing = {}) {
  existing = existing || {};
  const timer = Object.prototype.hasOwnProperty.call(payload, "activeTimer")
    ? normalizeTimer(payload.activeTimer)
    : existing.activeTimer || null;
  const hourlyRate = Object.prototype.hasOwnProperty.call(payload, "hourlyRate")
    ? payload.hourlyRate === "" || payload.hourlyRate == null
      ? null
      : Number(payload.hourlyRate)
    : existing.hourlyRate ?? null;

  return {
    userId: existing.userId || payload.userId,
    key: "default",
    hourlyRate,
    activeTimer: timer
  };
}

router.get("/", async (_req, res, next) => {
  try {
    const settings = await Settings.findOne({ userId: _req.user._id }).lean();
    res.json(settings || normalizeSettings({ userId: _req.user._id }));
  } catch (error) {
    next(error);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const existing = await Settings.findOne({ userId: req.user._id }).lean();
    const settings = await Settings.findOneAndUpdate({ userId: req.user._id }, normalizeSettings({ ...req.body, userId: req.user._id }, existing), {
      new: true,
      upsert: true,
      runValidators: true
    }).lean();

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

router.put("/timer", async (req, res, next) => {
  try {
    const existing = await Settings.findOne({ userId: req.user._id }).lean();
    const settings = await Settings.findOneAndUpdate(
      { userId: req.user._id },
      normalizeSettings({ ...existing, userId: req.user._id, activeTimer: req.body }, existing),
      { new: true, upsert: true, runValidators: true }
    ).lean();

    res.json(settings.activeTimer);
  } catch (error) {
    next(error);
  }
});

router.delete("/timer", async (_req, res, next) => {
  try {
    await Settings.findOneAndUpdate(
      { userId: _req.user._id },
      { $set: { activeTimer: null }, $setOnInsert: { userId: _req.user._id, key: "default" } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.use((error, _req, res, _next) => {
  res.status(400).json({ message: error.message || "Something went wrong" });
});

module.exports = router;
