// middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");

    req.user = decoded; // 👈 makes `req.user.id` available
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};
