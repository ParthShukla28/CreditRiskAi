const express = require("express");
const router = express.Router();
const {
  getLoans, getLoanById, createLoan, updateLoanStatus, deleteLoan,
} = require("../controllers/loanController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", getLoans);
router.get("/:id", getLoanById);
router.post("/", createLoan);
router.patch("/:id/status", updateLoanStatus);
router.delete("/:id", deleteLoan);

module.exports = router;
