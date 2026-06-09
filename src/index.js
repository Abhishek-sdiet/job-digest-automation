// src/index.js
// =====================================================
// MAIN ENTRY POINT — Job Digest Automation
// Orchestrates all scrapers, filters, and sends email
//
// Run manually:  node src/index.js
// GitHub Actions runs this at 7:00 AM IST daily
// =====================================================

require("dotenv").config();
const config = require("../config/jobConfig");
const { scrapeIndeed } = require("./scrapers/indeedScraper");
const { scrapeNaukri } = require("./scrapers/naukriScraper");
const { scrapeInternshala } = require("./scrapers/internScraper");
const { scrapeLinkedIn } = require("./scrapers/linkedinScraper");
const { scrapeCompanyCareers } = require("./scrapers/companyScraper");
const { filterJobs } = require("./utils/jobFilter");
const { filterNewJobs } = require("./utils/duplicateTracker");
const { buildEmailHTML, buildEmailSubject } = require("./emailTemplate");
const { sendDigestEmail } = require("./emailSender");
const { backupToSheets } = require("./sheetsBackup");

async function runJobDigest() {
  console.log("\n========================================");
  console.log("🚀 Job Digest Automation Starting...");
  console.log(`⏰ Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`);
  console.log("========================================\n");

  const allJobs = [];

  // ─── Step 1: Run all scrapers in parallel-ish ───────────────────
  console.log("📡 Scraping job sources...\n");

  const scraperResults = await Promise.allSettled([
    runScraper("LinkedIn", () =>
      scrapeLinkedIn(config.search.roles, config.search.lookbackHours)
    ),
    runScraper("Indeed India", () =>
      scrapeIndeed(config.search.roles, config.search.locations, config.search.lookbackHours)
    ),
    runScraper("Naukri.com", () =>
      scrapeNaukri(config.search.roles, config.search.locations, config.search.lookbackHours)
    ),
    runScraper("Internshala", () =>
      scrapeInternshala(config.search.lookbackHours)
    ),
    runScraper("Dream Companies", () =>
      scrapeCompanyCareers(config.dreamCompanies)
    ),
  ]);

  for (const result of scraperResults) {
    if (result.status === "fulfilled" && result.value) {
      allJobs.push(...result.value);
    }
  }

  console.log(`\n✅ Total raw jobs scraped: ${allJobs.length}`);

  // ─── Step 2: Filter by relevance ────────────────────────────────
  const filtered = filterJobs(allJobs);
  console.log(`🔍 After relevance filter: ${filtered.length} jobs`);

  // ─── Step 3: Remove duplicates seen in last 7 days ───────────────
  const freshJobs = filterNewJobs(filtered);
  console.log(`🆕 After deduplication: ${freshJobs.length} new jobs`);

  // ─── Step 4: Backup to Google Sheets ────────────────────────────
  if (freshJobs.length > 0) {
    console.log("\n📊 Backing up to Google Sheets...");
    await backupToSheets(freshJobs);
  }

  // ─── Step 5: Build and send email ───────────────────────────────
  console.log("\n📧 Building email digest...");
  const html = buildEmailHTML(freshJobs);
  const subject = buildEmailSubject(freshJobs);

  try {
    await sendDigestEmail(subject, html, config.candidate.email);
    console.log(`\n🎉 Digest sent to ${config.candidate.email} with ${freshJobs.length} jobs!`);
  } catch (emailErr) {
    console.error("\n❌ Failed to send email:", emailErr.message);
    console.log("💡 Check your GMAIL_USER and GMAIL_APP_PASSWORD in .env");
    process.exit(1);
  }

  console.log("\n========================================");
  console.log("✅ Job Digest Complete!");
  console.log("========================================\n");
}

async function runScraper(name, fn) {
  try {
    console.log(`  ⏳ ${name}...`);
    const jobs = await fn();
    console.log(`  ✓  ${name}: ${jobs.length} jobs found`);
    return jobs;
  } catch (err) {
    console.error(`  ✗  ${name} failed: ${err.message}`);
    return [];
  }
}

// Run it!
runJobDigest().catch((err) => {
  console.error("💥 Fatal error:", err);
  process.exit(1);
});
