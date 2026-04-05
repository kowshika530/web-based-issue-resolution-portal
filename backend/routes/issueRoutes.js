const express = require("express");
const router = express.Router();
const { 
  createIssue, 
  getIssues, 
  getPublicIssues,
  getMyIssues,
  getIssueById, 
  updateIssue, 
  voteIssue, 
  addComment, 
  deleteIssue,
  toggleBookmark
} = require("../controllers/issueController");
const { protect, admin, adminOrFaculty } = require("../middleware/authMiddleware");

router.route("/all").get(protect, adminOrFaculty, getIssues);
router.route("/public").get(protect, getPublicIssues);
router.route("/my").get(protect, getMyIssues);
router.route("/create").post(protect, createIssue);

router.route("/:id")
  .get(protect, getIssueById)
  .put(protect, adminOrFaculty, updateIssue) // admin or faculty can update status/assignment
  .delete(protect, deleteIssue);

router.route("/:id/vote").put(protect, voteIssue);
router.route("/:id/bookmark").put(protect, toggleBookmark);
router.route("/:id/comment").post(protect, addComment);

module.exports = router;