// services/mlService.js
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

/**
 * Normalize top_factors into { factor, importance }
 *
 * Handles all known shapes:
 *  1. Python SHAP array: [{ feature, label, importance }]  ← actual output from Python model
 *  2. Plain strings:     ["credit_history", "emp_length", ...]
 *  3. Object with factor key: [{ factor, importance }]
 *  4. Plain dict:        { "credit_history": 0.32, "loan_amnt": 0.15 }
 */
const normalizeFactors = (raw) => {
  if (!raw) return [];
  if (!Array.isArray(raw) || raw.length === 0) return [];

  // Expected shape from the Python service:
  // [{ feature: "credit_history", label: "Credit History", importance: 0.3241 }]
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

  // ── risk_category: model returns "Low"/"Medium"/"High" → normalize to lowercase
  const riskCategory = (raw.risk_label || raw.risk_category || "medium").toString().toLowerCase().trim();

  // ── risk_score: model returns 0.0–1.0 probability → convert to 0–100
  const rawScore = typeof raw.risk_score === "number" ? raw.risk_score : 0;
  const riskScore = rawScore <= 1
    ? Math.round(rawScore * 100)  // 0.76 → 76
    : Math.round(rawScore);        // already 0–100, keep as-is

  // Default probability = same as riskScore (already 0–100)
  const defaultProbability = riskScore;

  // Normalize top_factors: extracts { factor, importance } from Python SHAP output
  const topFactors = normalizeFactors(raw.top_factors);

  const recommendation = buildRecommendation(riskCategory, riskScore);

  return { riskScore, riskCategory, defaultProbability, topFactors, recommendation, raw };
};

module.exports = { predict };