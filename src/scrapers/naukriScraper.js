// src/scrapers/naukriScraper.js
// ============================================
// Scrapes Naukri.com for fresh job listings
// Uses their public search endpoint
// ============================================

const axios = require("axios");
const { cleanText, buildJobId } = require("../utils/helpers");

async function scrapeNaukri(roles, locations, lookbackHours) {
  const allJobs = [];
  const seen = new Set();

  const searchTerms = [
    "full stack developer",
    "mern stack developer",
    "react developer",
    "node js developer",
    "frontend developer",
    "software engineer fresher",
  ];

  for (const term of searchTerms) {
    try {
      const jobs = await fetchNaukriJobs(term, lookbackHours, seen);
      allJobs.push(...jobs);
      await sleep(2500);
    } catch (err) {
      console.error(`[Naukri] Error for "${term}":`, err.message);
    }
  }

  return allJobs;
}

async function fetchNaukriJobs(searchTerm, lookbackHours, seen) {
  const jobs = [];

  // Naukri public search API
  const url = `https://www.naukri.com/jobapi/v3/search`;
  const params = {
    noOfResults: 20,
    urlType: "search_by_keyword",
    searchType: "adv",
    keyword: searchTerm,
    location: "delhi ncr, gurugram, noida, remote",
    experience: "0,3",
    k: searchTerm,
    l: "delhi-ncr",
    sort: "1", // sort by date
    industries: "",
    functionAreaIdGid: "",
    "seoKey": `${searchTerm.replace(/\s+/g, "-")}-jobs`,
    "src": "jobsearchDesk",
    "latLong": "",
    "type": 2,
  };

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "appid": "109",
    "systemid": "109",
    "Content-Type": "application/json",
    "Referer": "https://www.naukri.com/",
  };

  try {
    const response = await axios.get(url, { params, headers, timeout: 15000 });
    const data = response.data;

    if (!data?.jobDetails) return jobs;

    for (const job of data.jobDetails) {
      try {
        const title = cleanText(job.title || job.jobTitle);
        const company = cleanText(job.companyName);
        const location = cleanText(
          Array.isArray(job.placeholders)
            ? job.placeholders.find((p) => p.type === "location")?.label
            : job.location
        );
        const applyLink = job.jdURL
          ? `https://www.naukri.com${job.jdURL}`
          : `https://www.naukri.com/job-listings-${job.jobId}`;

        const postedMillis = job.footerPlaceholderLabel || job.createdDate;
        const postedDate = parseNaukriDate(job);

        if (!title || !company) continue;

        // Filter: only jobs posted in last 24h
        if (!isRecentNaukriJob(job)) continue;

        const jobId = buildJobId("naukri", title, company);
        if (seen.has(jobId)) continue;
        seen.add(jobId);

        jobs.push({
          id: jobId,
          title,
          company,
          location: location || "Delhi NCR",
          postedDate,
          applyLink,
          source: "Naukri.com",
          sourceIcon: "🟠",
        });
      } catch (e) {
        // skip malformed
      }
    }
  } catch (err) {
    // Try fallback HTML scrape approach
    console.error(`[Naukri] API failed, skipping: ${err.message}`);
  }

  return jobs;
}

function isRecentNaukriJob(job) {
  // Naukri provides createdDate as unix timestamp (ms) or a label
  try {
    if (job.createdDate) {
      const posted = new Date(job.createdDate);
      const diff = (Date.now() - posted.getTime()) / (1000 * 60 * 60);
      return diff <= 24;
    }
    // fallback: check label
    const label = (job.footerPlaceholderLabel || "").toLowerCase();
    if (label.includes("today") || label.includes("just now") || label.includes("few hours")) return true;
    if (label.includes("1 day") || label.includes("yesterday")) return true;
  } catch (e) {}
  return true; // if we can't determine, include it
}

function parseNaukriDate(job) {
  try {
    if (job.createdDate) {
      const posted = new Date(job.createdDate);
      const diff = Math.floor((Date.now() - posted.getTime()) / (1000 * 60 * 60));
      if (diff < 1) return "Just now";
      if (diff < 24) return `${diff} hours ago`;
      return "Today";
    }
    return job.footerPlaceholderLabel || "Recently";
  } catch {
    return "Recently";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { scrapeNaukri };
