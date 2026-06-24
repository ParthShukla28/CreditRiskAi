const User = require("../models/User");
const { generateToken } = require("../config/jwt");
const AuditLog = require("../models/AuditLog");


const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

  
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

  
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

   
    await AuditLog.create({
      user: user._id,
      action: "LOGIN",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};


const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const user = await User.create({ firstName, lastName, email, password, role });
    const token = generateToken(user._id);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};


const getMe = async (req, res) => {
  res.json({ user: req.user });
};


const logout = async (req, res) => {
  try {
    await AuditLog.create({
      user: req.user._id,
      action: "LOGOUT",
      ipAddress: req.ip,
    });
  } catch (_) {}
  res.json({ message: "Logged out successfully." });
};

module.exports = { login, register, getMe, logout };
