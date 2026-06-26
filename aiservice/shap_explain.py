import pandas as pd
import joblib
import shap
import numpy as np


model   = joblib.load("model.pkl")
scaler  = joblib.load("scaler.pkl")


RAW_FEATURES = [
    "annual_inc", "loan_amnt", "int_rate", "emp_length", "credit_history"
]

ALL_FEATURES = [
    "annual_inc", "loan_amnt", "int_rate", "emp_length", "credit_history",
    "debt_to_income", "monthly_payment_est", "risk_ratio", "income_per_year_exp"
]

FEATURE_LABELS = {
    "annual_inc"        : "Annual Income",
    "loan_amnt"       : "Loan Amount",
    "int_rate"         : "Interest Rate",
    "emp_length"       : "Employment Length",
    "credit_history"   : "Credit History",
    "debt_to_income"  : "Debt to Income Ratio",
    "monthly_payment_est": "Estimated Monthly Payment",
    "risk_ratio"         : "Risk Ratio",
    "income_per_year_exp": "Income per Year of Experience"
}


explainer = shap.TreeExplainer(model)


def _engineer_features(X: pd.DataFrame) -> pd.DataFrame:
    X = X.copy()
    X["debt_to_income"]      = X["loan_amnt"]  / (X["annual_inc"] + 1)
    X["monthly_payment_est"] = (X["loan_amnt"] * X["int_rate"]) / 1200
    X["risk_ratio"]          = X["int_rate"]   / (X["credit_history"] + 1)
    X["income_per_year_exp"] = X["annual_inc"] / (X["emp_length"] + 1)
    return X[ALL_FEATURES]


def _get_risk_label(score: float) -> str:
    if score < 0.33:
        return "Low"
    elif score < 0.66:
        return "Medium"
    else:
        return "High"


def explain_applicant(input_data: dict) -> dict:

    missing = [f for f in RAW_FEATURES if f not in input_data]
    if missing:
        raise ValueError(f"Missing required fields: {missing}")

    X = pd.DataFrame([input_data])
    X = _engineer_features(X)

    X_scaled = scaler.transform(X)

    risk_score = float(model.predict_proba(X_scaled)[0][1])


    shap_values = explainer.shap_values(X_scaled)
    if isinstance(shap_values, list):
        shap_array = np.array(shap_values[1])[0]
    else:
        shap_array = np.array(shap_values)[0]
    abs_shap = np.abs(shap_array)

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