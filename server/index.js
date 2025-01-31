require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;

// 1) DB connection
const pool = new Pool({
  user: "myuser",
  host: "localhost",
  database: "pricelab",
  password: "ktkr8658",
  port: 5432,
});

// 2) Enable CORS and JSON
app.use(cors());
app.use(express.json());

// 3) Multer for file uploads
const upload = multer({ dest: "uploads/" });

// 4) File upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "❌ No file uploaded" });
    }

    const filePath = path.join(__dirname, "uploads", req.file.filename);
    console.log(`✅ File received: ${req.file.originalname}`);

    // Rename to .xlsx
    const newFilePath = `${filePath}.xlsx`;
    fs.renameSync(filePath, newFilePath);
    console.log(`📂 File saved as: ${newFilePath}`);

    // Path to python script
    const pythonScriptPath = path.join(__dirname, "../processor/process_excel.py");
    // We assume you have python installed globally or a venv somewhere:
    // for local usage, maybe just "python"
    const pythonExecutable = "python"; 

    console.log("📢 Calling process_excel.py...");
    exec(`"${pythonExecutable}" "${pythonScriptPath}" "${newFilePath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error executing Python script: ${error.message}`);
        return res.status(500).json({ message: "❌ Processing failed", error: error.message });
      }
      if (stderr) {
        console.error(`⚠️ Python stderr: ${stderr}`);
      }
      console.log(`📜 Python output:\n${stdout}`);
      return res.json({ message: "✅ File uploaded and processed successfully", output: stdout });
    });
  } catch (err) {
    console.error("❌ Upload route failed:", err);
    return res.status(500).json({ message: "❌ Internal server error", error: err.message });
  }
});

// 5) Get all tables
app.get("/tables", async (req, res) => {
  try {
    const sql = `
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    const { rows } = await pool.query(sql);
    const tableNames = rows.map((r) => r.tablename);
    res.json({ tables: tableNames });
  } catch (error) {
    console.error("❌ Error fetching tables:", error);
    res.status(500).json({ message: "❌ Error fetching tables" });
  }
});

// 6) Get data from a specific table
app.get("/data/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const sql = `SELECT * FROM "${tableName}"`; 
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching data:", error);
    res.status(500).json({ message: "❌ Error fetching table data" });
  }
});

// 7) Clear database
app.delete("/clear-database", async (req, res) => {
  try {
    const dropAllTables = `
      DO $$
      DECLARE
          r RECORD;
      BEGIN
          FOR r IN (
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
          ) LOOP
              EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE';
          END LOOP;
      END
      $$;
    `;
    await pool.query(dropAllTables);
    return res.json({ message: "All tables deleted successfully" });
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    res.status(500).json({ message: "❌ Error clearing database" });
  }
});

// 8) Serve React build if you want a single server approach
app.use(express.static(path.join(__dirname, "../client/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// 9) Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
