
const LoanApplication = require("../models/LoanApplication");
const RiskAssessment = require("../models/RiskAssessment");

const getOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalApps,
      thisMonthApps,
      lastMonthApps,
      pending,
      approved,
      rejected,
      riskData,
    ] = await Promise.all([
      LoanApplication.countDocuments(),
      LoanApplication.countDocuments({ createdAt: { $gte: startOfMonth } }),
      LoanApplication.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
      }),
      LoanApplication.countDocuments({ status: "pending" }),
      LoanApplication.countDocuments({ status: "approved" }),
      LoanApplication.countDocuments({ status: "rejected" }),
      RiskAssessment.find({}, "riskScore riskCategory"),
    ]);

    const totalReviewed = approved + rejected;
    const approvalRate = totalReviewed > 0
      ? Math.round((approved / totalReviewed) * 100)
      : 0;

    const avgRiskScore = riskData.length > 0
      ? Math.round(riskData.reduce((sum, r) => sum + r.riskScore, 0) / riskData.length)
      : 0;

    const monthOverMonth = lastMonthApps > 0
      ? Math.round(((thisMonthApps - lastMonthApps) / lastMonthApps) * 100)
      : 0;

    res.json({
      totalApplications: { value: totalApps, change: monthOverMonth },
      pendingReviews: { value: pending },
      approvalRate: { value: approvalRate },
      averageRiskScore: { value: avgRiskScore },
    });
  } catch (err) {
    next(err);
  }
};


const getRiskDistribution = async (req, res, next) => {
  try {
    const data = await RiskAssessment.aggregate([
      { $group: { _id: "$riskCategory", count: { $sum: 1 } } },
    ]);
    const distribution = { low: 0, medium: 0, high: 0 };
    data.forEach((d) => { distribution[d._id] = d.count; });
    res.json(distribution);
  } catch (err) {
    next(err);
  }
};


const getTrends = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const loans = await LoanApplication.find(
      { createdAt: { $gte: sixMonthsAgo } },
      "status createdAt"
    );

  
    const months = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short" });
      months[key] = { month: label, total: 0, approved: 0, rejected: 0, pending: 0 };
    }

    loans.forEach((loan) => {
      const d = loan.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (months[key]) {
        months[key].total++;
        months[key][loan.status]++;
      }
    });

    res.json(Object.values(months));
  } catch (err) {
    next(err);
  }
};


const getRecentApplications = async (req, res, next) => {
  try {
    const loans = await LoanApplication.find()
      .populate("applicant", "fullName email")
      .populate("riskAssessment", "riskScore riskCategory")
      .sort({ createdAt: -1 })
      .limit(5);
    res.json({ loans });
  } catch (err) {
    next(err);
  }
};


const exportData = async (req, res, next) => {
  try {
    const loans = await LoanApplication.find()
      .populate("applicant")
      .populate("riskAssessment");

    const headers = [
      "Application ID", "Applicant Name", "Email", "Loan Amount",
      "Interest Rate", "Annual Income", "Risk Score", "Risk Category",
      "Status", "Submitted Date",
    ];

    const rows = loans.map((l) => [
      l._id,
      l.applicant?.fullName || "",
      l.applicant?.email || "",
      l.loanAmount,
      l.intRate,
      l.applicant?.annualIncome || "",
      l.riskAssessment?.riskScore || "",
      l.riskAssessment?.riskCategory || "",
      l.status,
      l.createdAt.toISOString().split("T")[0],
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=loan_applications_export.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = { getOverview, getRiskDistribution, getTrends, getRecentApplications, exportData };
