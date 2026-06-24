
const path = require("path");
const Applicant = require("../models/Applicant");
const LoanApplication = require("../models/LoanApplication");
const RiskAssessment = require("../models/RiskAssessment");
const mlService = require("../services/mlService");
const { parseCSV, validateRow, deleteTempFile } = require("../services/csvService");


const uploadCSV = async (req, res, next) => {
  const filePath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Please upload a CSV file." });
    }

   
    const rows = await parseCSV(filePath);
    if (rows.length === 0) {
      deleteTempFile(filePath);
      return res.status(400).json({ error: "CSV file is empty." });
    }

    const results = { success: 0, failed: 0, errors: [], created: [] };
    const batchId = `BATCH_${Date.now()}`;

    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; 

      
      const { valid, errors } = validateRow(row, rowNum);
      if (!valid) {
        results.failed++;
        results.errors.push(...errors);
        continue;
      }

      try {
     
        let applicant = await Applicant.findOne({ email: row.email });
        if (!applicant) {
          applicant = await Applicant.create({
            fullName: row.fullName,
            email: row.email,
            phone: row.phone || "",
            employmentStatus: row.employmentStatus,
            empLength: parseFloat(row.emp_length),
            annualIncome: parseFloat(row.annual_inc),
            creditHistory: parseFloat(row.credit_history),
            existingDebts: parseFloat(row.existingDebts) || 0,
          });
        }

       
        const principal = parseFloat(row.loan_amnt);
        const monthlyRate = parseFloat(row.int_rate) / 100 / 12;
        const n = parseInt(row.loanTerm) || 36;
        const monthlyPayment = monthlyRate > 0
          ? (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
            (Math.pow(1 + monthlyRate, n) - 1)
          : principal / n;

        
        const loan = await LoanApplication.create({
          applicant: applicant._id,
          loanAmount: principal,
          intRate: parseFloat(row.int_rate),
          loanPurpose: row.loanPurpose || "other",
          loanTerm: n,
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          status: "pending",
          submittedBy: req.user._id,
          batchId,
        });

        
        const mlResult = await mlService.predict({
          annual_inc: parseFloat(row.annual_inc),
          loan_amnt: principal,
          int_rate: parseFloat(row.int_rate),
          emp_length: parseFloat(row.emp_length),
          credit_history: parseFloat(row.credit_history),
        });

       
        const riskAssessment = await RiskAssessment.create({
          loanApplication: loan._id,
          riskScore: mlResult.riskScore,
          riskCategory: mlResult.riskCategory,
          defaultProbability: mlResult.defaultProbability,
          topFactors: mlResult.topFactors,
          recommendation: mlResult.recommendation,
          mlModelResponse: mlResult.raw,
        });

        loan.riskAssessment = riskAssessment._id;
        await loan.save();

        results.success++;
        results.created.push({
          row: rowNum,
          applicantName: row.fullName,
          loanId: loan._id,
          riskCategory: mlResult.riskCategory,
          riskScore: mlResult.riskScore,
        });
      } catch (rowErr) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: ${rowErr.message}`);
      }
    }

    deleteTempFile(filePath);

    res.json({
      message: `Batch processed: ${results.success} succeeded, ${results.failed} failed.`,
      batchId,
      results,
    });
  } catch (err) {
    deleteTempFile(filePath);
    next(err);
  }
};


const downloadTemplate = (req, res) => {
  const headers = [
    "fullName", "email", "phone", "employmentStatus",
    "annual_inc", "emp_length", "credit_history", "existingDebts",
    "loan_amnt", "int_rate", "loanPurpose", "loanTerm",
  ].join(",");

  const example = [
    "John Smith", "john@example.com", "555-1234", "employed",
    "75000", "5", "8", "5000",
    "150000", "7.5", "home_purchase", "36",
  ].join(",");

  const csv = `${headers}\n${example}\n`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=loan_upload_template.csv");
  res.send(csv);
};

module.exports = { uploadCSV, downloadTemplate };


