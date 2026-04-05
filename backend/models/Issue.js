const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  role: { type: String, enum: ["STUDENT", "ADMIN"], required: true }
});

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  priority: { type: String, required: true },
  status: { type: String, default: "Submitted" },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  assignedTo: { type: String },
  assignedFacultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  attachments: [{ type: String }],
  isAnonymous: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  locationValidated: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  staffNotes: { type: String, default: "" },
  history: [{
    status: String,
    changedBy: String,
    timestamp: { type: Date, default: Date.now }
  }],
  comments: [commentSchema]
});

module.exports = mongoose.model("Issue", issueSchema);