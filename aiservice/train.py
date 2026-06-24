import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
from xgboost import XGBClassifier

# Import the SAME feature engineering used at inference time (shap_explain.py).
# This is the fix for the train/serve skew risk: previously the 4 engineered
# features (debt_to_income, monthly_payment_est, risk_ratio, income_per_year_exp)
# were written out separately in this file AND in shap_explain.py. They matched
# by luck, not by design — if either copy was ever edited alone, training and
# serving would silently disagree. Now there is exactly one definition.
from shap_explain import _engineer_features, RAW_FEATURES, ALL_FEATURES

raw = pd.read_csv("cleaned_loans.csv")

# ✅ Feature Engineering — single shared implementation (see import above)
df = _engineer_features(raw[RAW_FEATURES])
# _engineer_features returns columns in ALL_FEATURES order, so downstream
# column order is guaranteed to match what shap_explain.py expects at
# inference time (fixes the fragile index/order coupling in SHAP output).
df["loan_status"] = raw["loan_status"]

X = df[ALL_FEATURES]
y = df["loan_status"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
    # stratify=y: keeps the same Fully-Paid/Charged-Off ratio in both
    # train and test splits — matters here because the classes are
    # imbalanced (see scale_pos_weight below), and a random split could
    # otherwise leave the test set under/over-representing defaults.
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

neg = (y_train == 0).sum()
pos = (y_train == 1).sum()

model = XGBClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    scale_pos_weight=neg/pos,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=5,
    random_state=42,
    eval_metric="aucpr"
)
model.fit(X_train_scaled, y_train)

y_pred = model.predict(X_test_scaled)
y_prob = model.predict_proba(X_test_scaled)[:, 1]

print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n", classification_report(y_test, y_pred))
print(f"\nAUC Score: {roc_auc_score(y_test, y_prob):.4f}")

joblib.dump(model,  "model.pkl")
joblib.dump(scaler, "scaler.pkl")


# uvicorn app:app --reload