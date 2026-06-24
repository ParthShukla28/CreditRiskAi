
const LoanApplication = require("../models/LoanApplication");
const Applicant = require("../models/Applicant");
const RiskAssessment = require("../models/RiskAssessment");
const AuditLog = require("../models/AuditLog");
const mlService = require("../services/mlService");


const getLoans = async (req, res, next) => {
  try {
    const {
      status, riskLevel, search,
      page = 1, limit = 10,
      sortBy = "createdAt", sortOrder = "desc",
    } = req.query;

    const query = {};
    if (status) query.status = status;

    let loans = await LoanApplication.find(query)
      .populate("applicant", "fullName email phone")
      .populate("riskAssessment", "riskScore riskCategory defaultProbability")
      .populate("submittedBy", "firstName lastName")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 });

    if (riskLevel) {
      loans = loans.filter((l) => l.riskAssessment?.riskCategory === riskLevel);
    }

    if (search) {
      const s = search.toLowerCase();
      loans = loans.filter((l) =>
        l.applicant?.fullName?.toLowerCase().includes(s)
      );
    }

    const total = loans.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginated = loans.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      loans: paginated,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};


const getLoanById = async (req, res, next) => {
  try {
    const loan = await LoanApplication.findById(req.params.id)
      .populate("applicant")
      .populate("riskAssessment")
      .populate("submittedBy", "firstName lastName email")
      .populate("reviewedBy", "firstName lastName email");

    if (!loan) return res.status(404).json({ error: "Loan application not found." });

    res.json({ loan });
  } catch (err) {
    next(err);
  }
};


const createLoan = async (req, res, next) => {
  try {
    const {
      fullName, email, phone, age,
      employmentStatus, existingDebts, address,
      annual_inc, emp_length, credit_history,
      loan_amnt, int_rate, loanPurpose, loanTerm,
    } = req.body;

   
    const applicant = await Applicant.create({
      fullName, email, phone, age,
      employmentStatus,
      empLength: parseFloat(emp_length),
      annualIncome: parseFloat(annual_inc),
      creditHistory: parseFloat(credit_history),
      existingDebts: parseFloat(existingDebts) || 0,
      address,
    });

  
    const principal = parseFloat(loan_amnt);
    const monthlyRate = parseFloat(int_rate) / 100 / 12;
    const n = parseInt(loanTerm) || 36;
    const monthlyPayment = monthlyRate > 0
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
        (Math.pow(1 + monthlyRate, n) - 1)
      : principal / n;

  
    const loan = await LoanApplication.create({
      applicant: applicant._id,
      loanAmount: principal,
      intRate: parseFloat(int_rate),
      loanPurpose: loanPurpose || "other",
      loanTerm: n,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      status: "pending",
      submittedBy: req.user._id,
    });


    const mlResult = await mlService.predict({
      annual_inc: parseFloat(annual_inc),
      loan_amnt: principal,
      int_rate: parseFloat(int_rate),
      emp_length: parseFloat(emp_length),
      credit_history: parseFloat(credit_history),
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


    await AuditLog.create({
      user: req.user._id,
      action: "CREATE_LOAN",
      resource: "LoanApplication",
      resourceId: loan._id,
      details: { applicantEmail: email, riskCategory: mlResult.riskCategory },
    });

    res.status(201).json({
      message: "Loan application submitted and risk assessed successfully.",
      loan,
      riskAssessment,
    });
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
      return res.status(503).json({
        error: "ML model is unavailable. Please ensure your FastAPI service is running on port 8000.",
      });
    }
    next(err);
  }
};


const updateLoanStatus = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    const validStatuses = ["approved", "rejected", "under_review"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const loan = await LoanApplication.findById(req.params.id);
    if (!loan) return res.status(404).json({ error: "Loan application not found." });

    if (loan.status !== "pending" && loan.status !== "under_review") {
      return res.status(400).json({
        error: `Cannot update a loan that is already ${loan.status}.`,
      });
    }

    loan.status = status;
    loan.reviewedBy = req.user._id;
    loan.reviewDate = new Date();
    loan.reviewNotes = reviewNotes || "";
    await loan.save();

   
    await AuditLog.create({
      user: req.user._id,
      action: status === "approved" ? "APPROVE_LOAN" : "REJECT_LOAN",
      resource: "LoanApplication",
      resourceId: loan._id,
      details: { status, reviewNotes },
    });

    const updated = await LoanApplication.findById(loan._id)
      .populate("applicant", "fullName email")
      .populate("riskAssessment");

    res.json({ message: `Loan ${status} successfully.`, loan: updated });
  } catch (err) {
    next(err);
  }
};


const deleteLoan = async (req, res, next) => {
  try {
    const loan = await LoanApplication.findByIdAndDelete(req.params.id);
    if (!loan) return res.status(404).json({ error: "Loan not found." });
    await RiskAssessment.findOneAndDelete({ loanApplication: req.params.id });
    res.json({ message: "Loan application deleted." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLoans, getLoanById, createLoan, updateLoanStatus, deleteLoan };