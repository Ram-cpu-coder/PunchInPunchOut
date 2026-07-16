const mongoose = require("mongoose");

const daySchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    date: { type: String, required: true },
    start: { type: String, default: "" },
    end: { type: String, default: "" },
    breakMinutes: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "" }
  },
  { _id: false }
);

const weekSchema = new mongoose.Schema(
  {
    weekStart: { type: String, required: true, unique: true, index: true },
    hourlyRate: { type: Number, default: null, min: 0 },
    isPaid: { type: Boolean, default: false },
    days: { type: [daySchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Week", weekSchema);
