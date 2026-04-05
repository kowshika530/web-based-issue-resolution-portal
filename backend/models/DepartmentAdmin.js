const mongoose = require("mongoose");

const departmentAdminSchema = new mongoose.Schema({
  categoryName: { 
    type: String, 
    required: true, 
    unique: true 
  },
  adminName: { 
    type: String, 
    required: true 
  },
  adminEmail: [{ 
    type: String, 
    required: true 
  }],
  escalationEmail: { 
    type: String // Sent after a certain threshold is crossed
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("DepartmentAdmin", departmentAdminSchema);
