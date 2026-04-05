const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
         return res.status(401).json({ message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "ADMIN") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

const adminOrFaculty = (req, res, next) => {
  if (req.user && (req.user.role === "ADMIN" || req.user.role === "FACULTY")) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin or faculty" });
  }
};

module.exports = { protect, admin, adminOrFaculty };
