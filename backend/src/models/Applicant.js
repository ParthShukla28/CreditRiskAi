const mongoose = require("mongoose");

const applicantSchema = new mongoose.Schema(
  {
    fullName:      { type: String, required: true, trim: true },
    email:          { type: String, required: true, lowercase: true, trim: true },
    phone:       { type: String, trim: true },
    age:       { type: Number },

    
    employmentStatus: {
      type: String,
      enum: ["Employed", "Self-employed", "Unemployed", "Retired", "Student"],
      required: true,
    },
  
    empLength:        { type: Number, required: true, min: 0 },

    
    annualIncome:  { type: Number, required: true },  
    creditHistory:   { type: Number, required: true },  
    existingDebts:  { type: Number, default: 0 },

    address:          { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Applicant", applicantSchema);
