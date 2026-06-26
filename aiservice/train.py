import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
from xgboost import XGBClassifier

from shap_explain import _engineer_features, RAW_FEATURES, ALL_FEATURES

raw = pd.read_csv("cleaned_loans.csv")

df = _engineer_features(raw[RAW_FEATURES])
df["loan_status"] = raw["loan_status"]

X = df[ALL_FEATURES]
y = df["loan_status"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
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


