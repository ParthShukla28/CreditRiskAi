const axios = require("axios");

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";
const ML_ENDPOINT = process.env.ML_PREDICT_ENDPOINT || "/predict";

const buildRecommendation = (riskCategory, riskScore) => {
  if (riskCategory === "low") {
    return `Low default risk detected (score: ${riskScore}/100). This applicant demonstrates strong financial indicators. Recommended for approval subject to standard document verification.`;
  }
  if (riskCategory === "medium") {
    return `Moderate default risk detected (score: ${riskScore}/100). This applicant has some risk factors that warrant closer review. Consider additional collateral or a co-signer before approval.`;
  }
  return `High default risk detected (score: ${riskScore}/100). This applicant shows significant financial risk indicators. Recommend rejection or escalation to senior review committee.`;
};

const normalizeFactors = (raw) => {
  if (!raw) return [];
  if (!Array.isArray(raw) || raw.length === 0) return [];

  if (typeof raw[0] === "object" && "feature" in raw[0]) {
    return raw.map((f) => ({
      factor: f.feature,
      impact: Number(f.importance) || 0,
    }));
  }

  return [];
};

const predict = async ({ annual_inc, loan_amnt, int_rate, emp_length, credit_history }) => {
  const payload = { annual_inc, loan_amnt, int_rate, emp_length, credit_history };

  const response = await axios.post(`${ML_API_URL}${ML_ENDPOINT}`, payload, {
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
  });

  const raw = response.data;

  const riskCategory = (raw.risk_label || raw.risk_category || "medium").toString().toLowerCase().trim();

  const rawScore = typeof raw.risk_score === "number" ? raw.risk_score : 0;
  const riskScore = rawScore <= 1
    ? Math.round(rawScore * 100)  
    : Math.round(rawScore);    

  const defaultProbability = riskScore;

  const topFactors = normalizeFactors(raw.top_factors);

  const recommendation = buildRecommendation(riskCategory, riskScore);

  return { riskScore, riskCategory, defaultProbability, topFactors, recommendation, raw };
};

module.exports = { predict };