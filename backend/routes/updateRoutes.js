const express = require("express");
const router = express.Router();
const { getUpdates, createUpdate } = require("../controllers/updateController");
const { protect, admin } = require("../middleware/authMiddleware");

router.route("/").get(getUpdates).post(protect, admin, createUpdate);

module.exports = router;
