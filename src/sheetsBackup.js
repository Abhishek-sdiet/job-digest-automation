// src/sheetsBackup.js
// =====================================================
// Backs up all found jobs to Google Sheets
// Creates a new sheet tab for each day
// Skips duplicate rows automatically
// =====================================================

const { google } = require("googleapis");
require("dotenv").config();

async function backupToSheets(jobs) {
  if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    console.log("[Sheets] Google Sheets not configured, skipping backup.");
    return;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Get or create today's sheet tab
    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
    const sheetName = `Jobs - ${today}`;

    await ensureSheetTab(sheets, spreadsheetId, sheetName);

    // Check existing rows to avoid duplicates
    const existing = await getExistingApplyLinks(sheets, spreadsheetId, sheetName);

    // Filter out already-backed-up jobs
    const newJobs = jobs.filter((job) => !existing.has(job.applyLink));

    if (newJobs.length === 0) {
      console.log("[Sheets] No new jobs to add (all already backed up)");
      return;
    }

    // Prepare rows
    const rows = newJobs.map((job) => [
      new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
      job.title,
      job.company,
      job.location,
      job.source,
      job.postedDate,
      job.applyLink,
      "Not Applied", // Status column
    ]);

    // Append rows
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:H`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: rows },
    });

    console.log(`[Sheets] Backed up ${newJobs.length} jobs to "${sheetName}" ✓`);
  } catch (err) {
    console.error("[Sheets] Backup failed:", err.message);
    // Don't throw — sheet backup is non-critical
  }
}

async function ensureSheetTab(sheets, spreadsheetId, sheetName) {
  // Get existing sheets
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = meta.data.sheets.map((s) => s.properties.title);

  if (existingSheets.includes(sheetName)) return;

  // Create new tab
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    },
  });

  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:H1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [["Date Found", "Job Title", "Company", "Location", "Source", "Posted Date", "Apply Link", "Status"]],
    },
  });

  // Bold headers
  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = sheetMeta.data.sheets.find((s) => s.properties.title === sheetName);
  if (sheet) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          repeatCell: {
            range: { sheetId: sheet.properties.sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: "userEnteredFormat.textFormat.bold",
          },
        }],
      },
    });
  }
}

async function getExistingApplyLinks(sheets, spreadsheetId, sheetName) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!G:G`, // Apply Link column
    });
    const values = res.data.values || [];
    return new Set(values.flat());
  } catch {
    return new Set();
  }
}

module.exports = { backupToSheets };
