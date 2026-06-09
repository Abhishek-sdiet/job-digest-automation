// src/utils/helpers.js
// =====================================================
// Shared utility functions for scrapers
// =====================================================

const crypto = require("crypto");

/**
 * Cleans up whitespace and special chars from scraped text
 */
function cleanText(text) {
  if (!text) return "";
  return text.trim().replace(/\s+/g, " ").replace(/[\n\r\t]/g, " ").trim();
}

/**
 * Builds a stable unique ID for a job to enable deduplication
 */
function buildJobId(source, title, company) {
  const raw = `${source}::${(title || "").toLowerCase().trim()}::${(company || "").toLowerCase().trim()}`;
  return crypto.createHash("md5").update(raw).digest("hex").slice(0, 12);
}

/**
 * Checks if a date string represents a recent job (within lookback hours)
 */
function isWithinLookback(dateText, lookbackHours = 24) {
  if (!dateText) return true;
  const lower = dateText.toLowerCase();
  if (lower.includes("just now") || lower.includes("today") || lower.includes("minutes")) return true;
  if (lower.includes("hours ago")) {
    const match = lower.match(/(\d+)\s+hours? ago/);
    if (match && parseInt(match[1]) <= lookbackHours) return true;
  }
  if (lower.includes("1 day ago") || lower.includes("yesterday")) return lookbackHours >= 24;
  return false;
}

/**
 * Formats today's date nicely for the email subject
 */
function getTodayFormatted() {
  const now = new Date();
  return now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Returns IST timestamp
 */
function getISTTime() {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });
}

module.exports = { cleanText, buildJobId, isWithinLookback, getTodayFormatted, getISTTime };
