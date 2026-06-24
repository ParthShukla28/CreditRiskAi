const csv = require("csv-parser");
const fs = require("fs");

const REQUIRED_FIELDS = [
  "fullName", "email", "phone", "employmentStatus",
  "annual_inc", "emp_length", "credit_history", "existingDebts",
  "loan_amnt", "int_rate", "loanPurpose", "loanTerm",
];

/**
 * 
 * @param {string} filePath 
 * @returns {Promise<Array>}
 */
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", (err) => reject(err));
  });
};

/**
 * 
 * @param {Object} row
 * @param {number} rowIndex 
 * @returns {{ valid: boolean, errors: string[] }}
 */
const validateRow = (row, rowIndex) => {
  const errors = [];

  REQUIRED_FIELDS.forEach((field) => {
    if (!row[field] && row[field] !== 0) {
      errors.push(`Row ${rowIndex}: missing field "${field}"`);
    }
  });

  const numericFields = ["annual_inc", "emp_length", "credit_history", "loan_amnt", "int_rate", "loanTerm"];
  numericFields.forEach((field) => {
    if (row[field] && isNaN(parseFloat(row[field]))) {
      errors.push(`Row ${rowIndex}: "${field}" must be a number`);
    }
  });

  const validStatuses = ["Employed", "Self-employed", "Unemployed", "Retired", "Student"];
  if (row.employmentStatus && !validStatuses.includes(row.employmentStatus)) {
    errors.push(`Row ${rowIndex}: invalid employmentStatus "${row.employmentStatus}"`);
  }

  return { valid: errors.length === 0, errors };
};

/**
 * 
 * @param {string} filePath
 */
const deleteTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.warn("Warning: could not delete temp file:", filePath);
  }
};

module.exports = { parseCSV, validateRow, deleteTempFile, REQUIRED_FIELDS };
