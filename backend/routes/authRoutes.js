const express = require("express");
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getMe, 
  updateProfile, 
  getLeaderboard, 
  getAllUsers,
  getAllStaff
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/users", protect, getAllUsers);
router.get("/staff", protect, getAllStaff);

module.exports = router;
