// config/jobConfig.js
// ================================================
// ALL YOUR JOB SEARCH PREFERENCES IN ONE PLACE
// Edit this file to update what you're looking for
// ================================================

module.exports = {
  candidate: {
    name: "Abhishek Kumar",
    email: "abhi20040805@gmail.com",
  },

  search: {
    // Roles to search for across all platforms
    roles: [
      "Full Stack Developer",
      "SDE-1",
      "Full Stack Developer Intern",
      "Software Engineer",
      "Software Engineer Trainee",
      "Frontend Developer",
      "MERN Stack Developer",
      "Software Development Engineer",
      "Junior Developer",
      "React Developer",
    ],

    // Location filters. Scrapers and the final relevance filter both use this.
    locations: ["Remote", "Gurugram", "Gurgaon", "Delhi", "Noida", "Delhi NCR"],

    // Keep only jobs in the configured region, plus India-friendly remote roles.
    strictLocationFilter: true,

    // Extra words that count as your target region when a job board uses variants.
    locationAliases: {
      Remote: ["work from home india", "wfh india", "anywhere in india", "remote india"],
      Gurugram: ["gurugram", "gurgaon"],
      Gurgaon: ["gurgaon", "gurugram"],
      Delhi: ["delhi", "new delhi"],
      Noida: ["noida", "greater noida"],
      "Delhi NCR": ["delhi ncr", "ncr", "national capital region"],
    },

    // If one of these appears in a location, reject it even when it also says remote.
    excludedLocationTerms: [
      "united states",
      "usa",
      "us",
      "canada",
      "uk",
      "united kingdom",
      "europe",
      "australia",
      "singapore",
      "dubai",
      "uae",
      "germany",
      "france",
      "netherlands",
      "worldwide",
      "global",
      "bangalore",
      "bengaluru",
      "chennai",
      "hyderabad",
      "mumbai",
      "pune",
      "ahmedabad",
      "kolkata",
      "jaipur",
      "agra",
      "patna",
      "meerut",
      "surat",
      "vadodara",
      "guwahati",
      "lucknow",
      "indore",
      "coimbatore",
      "chandigarh",
      "telangana",
      "maharashtra",
      "karnataka",
      "tamil nadu",
      "gujarat",
      "west bengal",
      "uttarakhand",
      "punjab",
      "kerala",
    ],

    // Keywords that MUST appear (OR logic — any match counts)
    mustHaveKeywords: [
      "javascript",
      "node.js",
      "nodejs",
      "react",
      "reactjs",
      "mongodb",
      "mern",
      "full stack",
      "fullstack",
      "frontend",
      "html",
      "css",
      "express",
    ],

    // Jobs containing these words are EXCLUDED
    excludeKeywords: [
      "unpaid",
      "service based",
      "10+ years",
      "8+ years",
      "7+ years",
      "senior principal",
      "staff engineer",
      "director",
      "manager",
      "lead architect",
    ],

    // Max experience required (in years) — skip jobs requiring more
    maxExperienceRequired: 3,

    // How far back to look (in hours)
    lookbackHours: 24,

    // Max jobs per email digest
    maxJobsPerEmail: 30,
  },

  // Dream company career pages to check directly
  dreamCompanies: [
    {
      name: "Razorpay",
      careersUrl: "https://razorpay.com/jobs/",
      keywords: ["engineer", "developer", "frontend", "backend", "full stack"],
    },
    {
      name: "Zepto",
      careersUrl: "https://jobs.lever.co/zepto",
      keywords: ["engineer", "developer"],
    },
    {
      name: "CRED",
      careersUrl: "https://careers.cred.club/",
      keywords: ["engineer", "developer", "frontend"],
    },
    {
      name: "Groww",
      careersUrl: "https://groww.in/open-positions",
      keywords: ["engineer", "developer"],
    },
    {
      name: "PhonePe",
      careersUrl: "https://www.phonepe.com/en/careers.html",
      keywords: ["engineer", "developer"],
    },
  ],

  // Email digest schedule (for reference — actual schedule is in GitHub Actions)
  schedule: {
    time: "07:00",
    timezone: "Asia/Kolkata",
    cronExpression: "30 1 * * *", // 7:00 AM IST = 1:30 AM UTC
  },

  // Google Sheets column order for backup
  sheets: {
    headers: [
      "Date Found",
      "Job Title",
      "Company",
      "Location",
      "Source",
      "Posted Date",
      "Apply Link",
      "Status",
    ],
  },
};
