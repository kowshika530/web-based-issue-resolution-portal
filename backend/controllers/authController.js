const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "fallback_secret_key", {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department, studentId, year } = req.body;

    if (!name || !studentId || !password) {
      return res.status(400).json({ message: "Please enter Student ID, name and password" });
    }

    const userExists = await User.findOne({ studentId });

    if (userExists) {
      return res.status(400).json({ message: "User already exists with this Student ID" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email: email || `${studentId}@edusolve.local`, // Fallback to avoid legacy unique index crashes
      studentId,
      password: hashedPassword,
      role: role || "STUDENT",
      department,
      year
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
        department: user.department,
        year: user.year,
        reputationScore: user.reputationScore,
        trustScore: user.trustScore,
        achievements: user.achievements,
        totalIssuesRaised: user.totalIssuesRaised,
        totalIssuesResolved: user.totalIssuesResolved,
        fakeIssuesCount: user.fakeIssuesCount,
        bookmarks: user.bookmarks,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { studentId, password } = req.body;

    // Check for user studentId
    const user = await User.findOne({ studentId });

    if (!user) {
      return res.status(401).json({ message: `User with ID ${studentId} not found. Please register first.` });
    }

    if (await bcrypt.compare(password, user.password)) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
        department: user.department,
        year: user.year,
        reputationScore: user.reputationScore,
        trustScore: user.trustScore,
        achievements: user.achievements,
        totalIssuesRaised: user.totalIssuesRaised,
        totalIssuesResolved: user.totalIssuesResolved,
        fakeIssuesCount: user.fakeIssuesCount,
        bookmarks: user.bookmarks,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: "Incorrect password. Please try again." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get top users by reputation
// @route   GET /api/auth/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    const leaders = await User.find({ role: 'STUDENT' })
      .select('name department reputationScore achievements trustScore totalIssuesResolved')
      .sort({ reputationScore: -1 })
      .limit(5);
    res.json(leaders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users for Admin
// @route   GET /api/auth/users
// @access  Private (Admin only logic applied at UI/controller)
const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Not authorized as admin" });
    }
    const users = await User.find({ role: 'STUDENT' })
      .select('name email studentId department reputationScore achievements trustScore totalIssuesRaised totalIssuesResolved fakeIssuesCount')
      .sort({ fakeIssuesCount: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all staff/faculty for Admin
// @route   GET /api/auth/staff
// @access  Private
const getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'FACULTY' })
      .select('name department role _id');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.name !== undefined) user.name = req.body.name;
      if (req.body.department !== undefined) user.department = req.body.department;
      if (req.body.year !== undefined) user.year = req.body.year;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        studentId: updatedUser.studentId,
        role: updatedUser.role,
        department: updatedUser.department,
        year: updatedUser.year,
        reputationScore: updatedUser.reputationScore,
        trustScore: updatedUser.trustScore,
        achievements: updatedUser.achievements,
        totalIssuesRaised: updatedUser.totalIssuesRaised,
        totalIssuesResolved: updatedUser.totalIssuesResolved,
        fakeIssuesCount: updatedUser.fakeIssuesCount,
        bookmarks: updatedUser.bookmarks,
        token: generateToken(updatedUser._id, updatedUser.role),
      });
    } else {
      console.log("updateProfile error: User not found for id", req.user._id);
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("updateProfile CRASH:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  getLeaderboard,
  getAllUsers,
  getAllStaff
};
