const mongoose = require("mongoose");

const loanApplicationSchema = new mongoose.Schema(
  {
    applicant:    { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true },

    
    loanAmount:   { type: Number, required: true },   
    intRate:      { type: Number, required: true },   
    loanPurpose: {
      type: String,
      enum: ["home_purchase", "business", "education", "debt_consolidation", "vehicle", "other"],
      default: "other",
    },
    loanTerm:     { type: Number },            
    monthlyPayment: { type: Number },   

  
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "under_review"],
      default: "pending",
    },

   
    submittedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewDate:   { type: Date },
    reviewNotes:  { type: String },

  
    riskAssessment: { type: mongoose.Schema.Types.ObjectId, ref: "RiskAssessment" },

  
    batchId:      { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoanApplication", loanApplicationSchema);
