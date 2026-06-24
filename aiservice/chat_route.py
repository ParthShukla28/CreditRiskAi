from fastapi import APIRouter
from pydantic import BaseModel
from shap_explain import explain_applicant

router = APIRouter()

# ── Input / Output schemas ────────────────────────────────────────────────
# The dashboard panel (LoanAdvisorChat.tsx) always sends all 5 fields as
# structured JSON — there is no free-text chat UI in this app, so this
# schema no longer needs a `message` field or any text-parsing fallback.
class ChatRequest(BaseModel):
    loan_amnt:      float
    annual_inc:     float
    int_rate:       float
    emp_length:     float
    credit_history: float

class ChatResponse(BaseModel):
    reply: str
    risk_score: float | None = None
    risk_category: str | None = None
    top_factors: list | None = None
    parsed: dict | None = None

# ── Plain-English verdict builder ─────────────────────────────────────────
def _build_verdict(score: float, category: str, top_factors: list, parsed: dict) -> str:
    loan    = parsed["loan_amnt"]
    income  = parsed["annual_inc"]
    rate    = parsed["int_rate"]

    # Header line
    emoji = {"Low": "", "Medium": "", "High": ""}.get(category, "")
    header = f"{emoji} **{category} risk** — default probability {round(score * 100, 1)}%"

    # Plain-English reason from top SHAP factors
    factor_lines = []
    # "+ 1" guard mirrors shap_explain.py's _engineer_features — avoids a
    # ZeroDivisionError if income is ever 0.
    factor_map = {
        "debt_to_income":      f"your debt-to-income ratio ({round(loan / (income + 1), 2)}) is "
                               + ("high" if loan / (income + 1) > 0.3 else "manageable"),
        "int_rate":            f"the interest rate ({rate}%) is "
                               + ("elevated" if rate > 12 else "reasonable"),
        "risk_ratio":          "the risk-to-credit ratio stands out",
        "credit_history":      f"your credit history ({parsed['credit_history']} yrs) is "
                               + ("short" if parsed["credit_history"] < 3 else "solid"),
        "income_per_year_exp": f"your income relative to experience is "
                               + ("strong" if income / (parsed["emp_length"] + 1) > 30000 else "a concern"),
        "monthly_payment_est": "estimated monthly payment is high relative to the loan",
        "annual_inc":          f"your annual income (₹{int(income):,}) is "
                               + ("on the lower side" if income < 400000 else "healthy"),
    }
    for f in (top_factors or []):
        fname = f.get("feature", "")
        label = factor_map.get(fname)
        if label:
            factor_lines.append(f"• {label}")

    factors_text = "\n".join(factor_lines) if factor_lines else "• Overall profile assessed across all features"

    # Advice
    if category == "Low":
        advice = "This loan looks good. You're likely to qualify with standard terms."
    elif category == "Medium":
        advice = (
            "Borderline case. Consider increasing your down-payment, "
            "reducing the loan amount, or negotiating a lower rate."
        )
    else:
        advice = (
            "High default risk detected. We recommend reducing the loan amount, "
            "improving your credit history, or applying with a co-applicant."
        )

    return f"{header}\n\n**Key drivers:**\n{factors_text}\n\n{advice}"

# ── /chat endpoint ────────────────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    parsed = req.dict()

    try:
        result      = explain_applicant(parsed)
        score       = result["risk_score"]
        top_factors = result.get("top_factors", [])

        # Same fix as app.py's /predict: reuse explain_applicant()'s own
        # risk_label instead of a third copy of the 0.33/0.66 thresholds.
        # One definition (in shap_explain.py's _get_risk_label), used by
        # both endpoints — they can no longer silently disagree.
        category = result["risk_label"]

        reply = _build_verdict(score, category, top_factors, parsed)

        return ChatResponse(
            reply=reply,
            risk_score=round(score, 4),
            risk_category=category,
            top_factors=top_factors,
            parsed=parsed,
        )

    except Exception as e:
        return ChatResponse(
            reply=f"Sorry, the risk model ran into an issue: {str(e)}. Please try again.",
        )