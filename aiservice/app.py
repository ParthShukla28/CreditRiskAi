from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from shap_explain import explain_applicant
from chat_route import router as chat_router   

app = FastAPI(title="Credit Risk AI Microservice")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       
    allow_methods=["*"],
    allow_headers=["*"],
)


class Applicant(BaseModel):
    annual_inc: float
    loan_amnt: float
    int_rate: float
    emp_length: float
    credit_history: float

@app.get("/")
def home():
    return {"message": "CreditRiskAI Microservice is running"}

@app.post("/predict")
def predict(applicant: Applicant):
    input_data = applicant.dict()
    result   = explain_applicant(input_data)
    score      = result["risk_score"]

   
    category = result["risk_label"]

    return {
        "risk_score":   score,
        "risk_category": category,
        "top_factors":  result["top_factors"],
    }


app.include_router(chat_router)