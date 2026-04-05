const express = require("express");
const router = express.Router();
const { getNotifications, markAsRead, createNotification } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getNotifications).post(protect, createNotification);
router.route("/:id/read").put(protect, markAsRead);

module.exports = router;
