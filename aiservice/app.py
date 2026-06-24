from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from shap_explain import explain_applicant
from chat_route import router as chat_router   # ← new

app = FastAPI(title="Credit Risk AI Microservice")

# Allow your React dashboard to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Existing /predict endpoint (unchanged) ────────────────────────────────
class Applicant(BaseModel):
    annual_inc: float
    loan_amnt: float
    int_rate: float
    emp_length: float
    credit_history: float

@app.get("/")
def home():
    return {"message": "Credit Risk AI Microservice is running"}

@app.post("/predict")
def predict(applicant: Applicant):
    input_data = applicant.dict()
    result     = explain_applicant(input_data)
    score      = result["risk_score"]

    # Use the SAME Low/Medium/High thresholds as shap_explain.py — this used
    # to be a separate if/elif block here (0.33 / 0.66) duplicated from
    # _get_risk_label() in shap_explain.py. They matched by coincidence, not
    # by design. explain_applicant() already returns this via "risk_label",
    # so we just reuse it — one threshold definition, used everywhere.
    category = result["risk_label"]

    return {
        "risk_score":    score,
        "risk_category": category,
        "top_factors":   result["top_factors"],
    }

# ── Mount the new /chat endpoint ──────────────────────────────────────────
app.include_router(chat_router)