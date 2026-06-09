// src/test-email.js
// =====================================================
// Quick test: sends a sample email with dummy jobs
// to verify your Gmail + SMTP setup is working
// Run: node src/test-email.js
// =====================================================

require("dotenv").config();
const { buildEmailHTML, buildEmailSubject } = require("./emailTemplate");
const { sendDigestEmail } = require("./emailSender");

const SAMPLE_JOBS = [
  {
    id: "test001",
    title: "Full Stack Developer (React + Node.js)",
    company: "Razorpay",
    location: "Bengaluru / Remote",
    postedDate: "2 hours ago",
    applyLink: "https://razorpay.com/jobs/",
    source: "LinkedIn",
    sourceIcon: "🔷",
  },
  {
    id: "test002",
    title: "SDE-1 – Frontend (React, TypeScript)",
    company: "CRED",
    location: "Bengaluru",
    postedDate: "Just now",
    applyLink: "https://careers.cred.club/",
    source: "LinkedIn",
    sourceIcon: "🔷",
  },
  {
    id: "test003",
    title: "MERN Stack Developer – Fresher",
    company: "Startup XYZ",
    location: "Gurugram / Hybrid",
    postedDate: "Today",
    applyLink: "https://www.naukri.com",
    source: "Naukri.com",
    sourceIcon: "🟠",
  },
  {
    id: "test004",
    title: "Junior Software Engineer (Node.js + MongoDB)",
    company: "TechCorp India",
    location: "Noida, UP",
    postedDate: "5 hours ago",
    applyLink: "https://in.indeed.com",
    source: "Indeed India",
    sourceIcon: "🔵",
  },
  {
    id: "test005",
    title: "Frontend Developer Intern (React)",
    company: "EdTech Startup",
    location: "Remote",
    postedDate: "Today",
    applyLink: "https://internshala.com",
    source: "Internshala",
    sourceIcon: "🟢",
  },
];

async function runTest() {
  console.log("🧪 Sending test email digest...\n");

  const html = buildEmailHTML(SAMPLE_JOBS);
  const subject = "🧪 [TEST] " + buildEmailSubject(SAMPLE_JOBS);

  try {
    await sendDigestEmail(subject, html);
    console.log("✅ Test email sent successfully!");
    console.log(`📬 Check your inbox: ${process.env.DIGEST_TO_EMAIL}`);
  } catch (err) {
    console.error("❌ Test failed:", err.message);
    console.log("\n💡 Troubleshooting:");
    console.log("  1. Make sure .env file exists with GMAIL_USER and GMAIL_APP_PASSWORD");
    console.log("  2. Use an App Password (not your Gmail password)");
    console.log("  3. Enable 2FA on Gmail first, then generate App Password at:");
    console.log("     https://myaccount.google.com/apppasswords");
  }
}

runTest();
