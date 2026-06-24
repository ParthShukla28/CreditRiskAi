const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { uploadCSV, downloadTemplate } = require("../controllers/uploadController");
const { protect } = require("../middleware/auth");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `upload_${Date.now()}_${file.originalname}`);
  },
});


const fileFilter = (req, file, cb) => {
  if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const fs = require("fs");
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

router.use(protect);
router.post("/csv", upload.single("file"), uploadCSV);
router.get("/template", downloadTemplate);

module.exports = router;
