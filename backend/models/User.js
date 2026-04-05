const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  studentId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["STUDENT", "ADMIN", "FACULTY"], default: "STUDENT" },
  department: { type: String },
  avatar: { type: String },
  reputationScore: { type: Number, default: 0 },
  trustScore: { type: Number, default: 80 },
  achievements: [{ type: String }],
  totalIssuesRaised: { type: Number, default: 0 },
  totalIssuesResolved: { type: Number, default: 0 },
  fakeIssuesCount: { type: Number, default: 0 },
  year: { type: String },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
