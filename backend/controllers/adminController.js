const DepartmentAdmin = require("../models/DepartmentAdmin");

// @desc    Get all category email mappings
// @route   GET /api/admin/category-emails
// @access  Private/Admin
const getCategoryEmails = async (req, res) => {
  try {
    const categoryEmails = await DepartmentAdmin.find().select("-__v");
    res.json(categoryEmails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategoryEmails,
};
