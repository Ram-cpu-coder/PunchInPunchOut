const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    key: { type: String, required: true, default: "default" },
    hourlyRate: { type: Number, default: null, min: 0 },
    activeTimer: {
      weekStart: { type: String, default: "" },
      dayIndex: { type: Number, default: null, min: 0, max: 6 },
      startedAt: { type: Date, default: null },
      startTime: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
