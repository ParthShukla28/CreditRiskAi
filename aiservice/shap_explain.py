import pandas as pd
import joblib
import shap
import numpy as np

# ─────────────────────────────────────────
# Load model & scaler once at startup
# ─────────────────────────────────────────
model   = joblib.load("model.pkl")
scaler  = joblib.load("scaler.pkl")

# ─────────────────────────────────────────
# Feature definitions
# ─────────────────────────────────────────
RAW_FEATURES = [
    "annual_inc", "loan_amnt", "int_rate", "emp_length", "credit_history"
]

ALL_FEATURES = [
    "annual_inc", "loan_amnt", "int_rate", "emp_length", "credit_history",
    "debt_to_income", "monthly_payment_est", "risk_ratio", "income_per_year_exp"
]

FEATURE_LABELS = {
    "annual_inc"         : "Annual Income",
    "loan_amnt"          : "Loan Amount",
    "int_rate"           : "Interest Rate",
    "emp_length"         : "Employment Length",
    "credit_history"     : "Credit History",
    "debt_to_income"     : "Debt to Income Ratio",
    "monthly_payment_est": "Estimated Monthly Payment",
    "risk_ratio"         : "Risk Ratio",
    "income_per_year_exp": "Income per Year of Experience"
}

# ─────────────────────────────────────────
# SHAP explainer — created once at startup
# ─────────────────────────────────────────
explainer = shap.TreeExplainer(model)


def _engineer_features(X: pd.DataFrame) -> pd.DataFrame:
    """Add engineered features to raw input DataFrame."""
    X = X.copy()
    X["debt_to_income"]      = X["loan_amnt"]  / (X["annual_inc"] + 1)
    X["monthly_payment_est"] = (X["loan_amnt"] * X["int_rate"]) / 1200
    X["risk_ratio"]          = X["int_rate"]   / (X["credit_history"] + 1)
    X["income_per_year_exp"] = X["annual_inc"] / (X["emp_length"] + 1)
    return X[ALL_FEATURES]


def _get_risk_label(score: float) -> str:
    """Convert risk score to human-readable label."""
    if score < 0.33:
        return "Low"
    elif score < 0.66:
        return "Medium"
    else:
        return "High"


def explain_applicant(input_data: dict) -> dict:
    """
    Predict loan default risk and explain top 5 contributing factors.

    Args:
        input_data: dict with keys:
            - annual_inc     (float): annual income in USD
            - loan_amnt      (float): loan amount requested
            - int_rate       (float): interest rate (%)
            - emp_length     (float): years of employment
            - credit_history (float): years of credit history

    Returns:
        dict with:
            - risk_score  : float (0.00 → 1.00)
            - risk_label  : str   ("Low" / "Medium" / "High")
            - confidence  : str   (e.g. "73%")
            - top_factors : list of top 5 contributing features
    """

    # ── Step 1: Validate input keys ──────────────────────────────
    missing = [f for f in RAW_FEATURES if f not in input_data]
    if missing:
        raise ValueError(f"Missing required fields: {missing}")

    # ── Step 2: Build & engineer features ────────────────────────
    X = pd.DataFrame([input_data])
    X = _engineer_features(X)

    # ── Step 3: Scale ─────────────────────────────────────────────
    X_scaled = scaler.transform(X)

    # ── Step 4: Predict risk score ────────────────────────────────
    risk_score = float(model.predict_proba(X_scaled)[0][1])

    # ── Step 5: SHAP explanation ──────────────────────────────────
    # shap_values() return shape depends on the shap/xgboost version:
    #   - newer versions (verified locally: shap 0.52, xgboost 3.3): a
    #     single (n_samples, n_features) array for the positive class
    #     directly.
    #   - older versions can instead return a LIST of two arrays,
    #     [class_0_values, class_1_values] — in that case the old code's
    #     shap_values[0] would silently become "probability of NOT
    #     defaulting" instead of "probability of defaulting," flipping
    #     every increases/decreases-risk label with no error raised.
    # This handles both shapes explicitly instead of assuming one.
    shap_values = explainer.shap_values(X_scaled)
    if isinstance(shap_values, list):
        # list form: index 1 = positive class = "Charged Off" / default risk
        shap_array = np.array(shap_values[1])[0]
    else:
        # array form: already aligned to the positive class
        shap_array = np.array(shap_values)[0]
    abs_shap = np.abs(shap_array)

    # ── Step 6: Top 5 factors ─────────────────────────────────────
    top_idx = abs_shap.argsort()[::-1][:5]

    top_factors = [
        {
            "feature"   : ALL_FEATURES[i],
            "label"     : FEATURE_LABELS[ALL_FEATURES[i]],
            "importance": round(float(abs_shap[i]), 4)
        }
        for i in top_idx
    ]

    return {
        "risk_score" : round(risk_score, 2),
        "risk_label" : _get_risk_label(risk_score),
        "confidence" : f"{round(risk_score * 100)}%",
        "top_factors": top_factors
    }