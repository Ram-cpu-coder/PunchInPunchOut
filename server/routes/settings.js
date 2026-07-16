const express = require("express");
const Settings = require("../models/Settings");

const router = express.Router();

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
  const timer = Object.prototype.hasOwnProperty.call(payload, "activeTimer")
    ? normalizeTimer(payload.activeTimer)
    : existing.activeTimer || null;
  const hourlyRate = Object.prototype.hasOwnProperty.call(payload, "hourlyRate")
    ? payload.hourlyRate === "" || payload.hourlyRate == null
      ? null
      : Number(payload.hourlyRate)
    : existing.hourlyRate ?? null;

  return {
    key: "default",
    hourlyRate,
    activeTimer: timer
  };
}

router.get("/", async (_req, res, next) => {
  try {
    const settings = await Settings.findOne({ key: "default" }).lean();
    res.json(settings || normalizeSettings());
  } catch (error) {
    next(error);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const existing = await Settings.findOne({ key: "default" }).lean();
    const settings = await Settings.findOneAndUpdate({ key: "default" }, normalizeSettings(req.body, existing), {
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
    const existing = await Settings.findOne({ key: "default" }).lean();
    const settings = await Settings.findOneAndUpdate(
      { key: "default" },
      normalizeSettings({ ...existing, activeTimer: req.body }, existing),
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
      { key: "default" },
      { $set: { activeTimer: null } },
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
