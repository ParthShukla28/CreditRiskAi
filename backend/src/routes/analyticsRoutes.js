const express = require("express");
const router = express.Router();
const {
  getOverview, getRiskDistribution, getTrends, getRecentApplications, exportData,
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/overview", getOverview);
router.get("/risk-distribution", getRiskDistribution);
router.get("/trends", getTrends);
router.get("/recent", getRecentApplications);
router.get("/export", exportData);

module.exports = router;
