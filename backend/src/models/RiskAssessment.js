const mongoose = require("mongoose");

const factorSchema = new mongoose.Schema(
  {
    factor: { type: String },  
    impact:  { type: Number },   
    direction: { type: String },  
  },
  { _id: false }
);

const riskAssessmentSchema = new mongoose.Schema(
  {
    loanApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoanApplication",
      required: true,
    },

   
    riskScore:     { type: Number, required: true, min: 0, max: 100 },
   
    riskCategory:    { type: String, enum: ["low", "medium", "high"], required: true },

    defaultProbability: { type: Number, min: 0, max: 100 },
    
    topFactors:    { type: [factorSchema], default: [] },
   
    recommendation:   { type: String },

   
    mlModelResponse:   { type: mongoose.Schema.Types.Mixed },
    modelVersion:   { type: String, default: "1.0" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RiskAssessment", riskAssessmentSchema);
