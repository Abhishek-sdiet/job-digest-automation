// src/scrapers/indeedScraper.js
// =============================================
// Scrapes Indeed India for fresh job listings
// =============================================

const axios = require("axios");
const cheerio = require("cheerio");
const { isWithinLookback, cleanText, buildJobId } = require("../utils/helpers");

const BASE_URL = "https://in.indeed.com";

async function scrapeIndeed(roles, locations, lookbackHours) {
  const allJobs = [];
  const seen = new Set();

  for (const role of roles.slice(0, 5)) { // limit to top 5 roles to avoid rate limiting
    for (const location of ["Delhi NCR", "Remote", "Gurugram", "Noida"]) {
      try {
        const jobs = await fetchIndeedJobs(role, location, lookbackHours, seen);
        allJobs.push(...jobs);
        await sleep(2000); // polite delay
      } catch (err) {
        console.error(`[Indeed] Error for "${role}" in "${location}":`, err.message);
      }
    }
  }

  return allJobs;
}

async function fetchIndeedJobs(role, location, lookbackHours, seen) {
  const jobs = [];
  const query = encodeURIComponent(role);
  const loc = encodeURIComponent(location);
  const url = `${BASE_URL}/jobs?q=${query}&l=${loc}&sort=date&fromage=1&limit=20`;

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  const response = await axios.get(url, { headers, timeout: 15000 });
  const $ = cheerio.load(response.data);

  $("div.job_seen_beacon, div[data-testid='jobListing']").each((_, el) => {
    try {
      const titleEl = $(el).find("h2.jobTitle a, a[data-jk]").first();
      const title = cleanText(titleEl.find("span").text() || titleEl.text());
      const company = cleanText($(el).find("span.companyName, [data-testid='company-name']").text());
      const locationText = cleanText($(el).find("div.companyLocation, [data-testid='text-location']").text());
      const dateText = cleanText($(el).find("span.date, [data-testid='myJobsStateDate']").text());
      const jobKey = $(el).find("a[data-jk]").attr("data-jk") || titleEl.attr("href");
      const applyLink = jobKey
        ? jobKey.startsWith("http")
          ? jobKey
          : `${BASE_URL}/viewjob?jk=${jobKey}`
        : null;

      if (!title || !company || !applyLink) return;

      const jobId = buildJobId("indeed", title, company);
      if (seen.has(jobId)) return;
      seen.add(jobId);

      if (!isRecentIndeedJob(dateText)) return;

      jobs.push({
        id: jobId,
        title,
        company,
        location: locationText || location,
        postedDate: parseIndeedDate(dateText),
        applyLink,
        source: "Indeed India",
        sourceIcon: "🔵",
      });
    } catch (e) {
      // skip malformed listing
    }
  });

  return jobs;
}

function isRecentIndeedJob(dateText) {
  if (!dateText) return false;
  const lower = dateText.toLowerCase();
  // Indeed shows: "Just posted", "Today", "1 day ago", "2 days ago"
  if (lower.includes("just posted") || lower.includes("today")) return true;
  if (lower.includes("1 day ago") || lower.includes("1 days ago")) return true;
  const match = lower.match(/(\d+)\s+day/);
  if (match && parseInt(match[1]) <= 1) return true;
  return false;
}

function parseIndeedDate(dateText) {
  if (!dateText) return "Recently";
  const lower = dateText.toLowerCase();
  if (lower.includes("just posted") || lower.includes("today")) return "Today";
  if (lower.includes("1 day")) return "1 day ago";
  return dateText;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { scrapeIndeed };
