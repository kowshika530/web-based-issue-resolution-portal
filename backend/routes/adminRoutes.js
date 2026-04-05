const express = require("express");
const router = express.Router();
const { getCategoryEmails } = require("../controllers/adminController");
const { protect, admin } = require("../middleware/authMiddleware");

router.route("/category-emails").get(protect, admin, getCategoryEmails);

module.exports = router;
