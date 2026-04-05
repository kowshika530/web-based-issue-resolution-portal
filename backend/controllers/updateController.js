const CampusUpdate = require("../models/CampusUpdate");

// @desc    Get all updates
// @route   GET /api/updates
// @access  Public
const getUpdates = async (req, res) => {
  try {
    const updates = await CampusUpdate.find().sort({ createdAt: -1 }).limit(10);
    res.json(updates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an update
// @route   POST /api/updates
// @access  Private/Admin
const createUpdate = async (req, res) => {
  try {
    const { title, date, type } = req.body;
    
    if (!title || !date || !type) {
      return res.status(400).json({ message: "Please provide title, date, and type" });
    }

    const update = new CampusUpdate({
      title,
      date,
      type
    });

    const savedUpdate = await update.save();
    res.status(201).json(savedUpdate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUpdates,
  createUpdate,
};
