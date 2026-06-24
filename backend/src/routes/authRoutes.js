const express = require("express");
const router = express.Router();
const { login, register, getMe, logout } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");

router.post("/login", login);
router.post("/register", protect, authorize("admin"), register);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

module.exports = router;
