const mongoose = require("mongoose");

const campusUpdateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true }, // Keeping as string to match frontend 'Today, 9:00 AM' or similar format, or we can use Date and format on frontend. Frontend uses string.
  type: { type: String, enum: ['maintenance', 'event', 'info'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CampusUpdate", campusUpdateSchema);
