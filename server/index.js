const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const weekRoutes = require("./routes/weeks");
const settingsRoutes = require("./routes/settings");
const authRoutes = require("./routes/auth");
const Week = require("./models/Week");
const Settings = require("./models/Settings");

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hour-calculator";

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, database: mongoose.connection.readyState === 1 ? "connected" : "connecting" });
});

app.use("/api/auth", authRoutes);
app.use("/api/weeks", weekRoutes);
app.use("/api/settings", settingsRoutes);

const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));

app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

mongoose
  .connect(mongoUri)
  .then(async () => {
    await Promise.all([
      Week.collection.dropIndex("weekStart_1").catch(() => {}),
      Settings.collection.dropIndex("key_1").catch(() => {})
    ]);
    await Promise.all([Week.syncIndexes(), Settings.syncIndexes()]);

    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
