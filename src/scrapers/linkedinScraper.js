// src/scrapers/linkedinScraper.js
// =====================================================
// Scrapes LinkedIn public job search (no login needed)
// Uses the public jobs/search endpoint
// =====================================================

const axios = require("axios");
const cheerio = require("cheerio");
const { cleanText, buildJobId } = require("../utils/helpers");

const BASE_URL = "https://www.linkedin.com";

async function scrapeLinkedIn(roles, lookbackHours) {
  const allJobs = [];
  const seen = new Set();

  // LinkedIn public search - combine roles for efficiency
  const searchTerms = [
    "full stack developer",
    "MERN stack developer",
    "frontend developer react",
    "SDE-1 software engineer",
    "nodejs developer",
    "junior software engineer",
  ];

  const locationCodes = [
    { name: "Delhi NCR", geoId: "102713980" },
    { name: "Remote", geoId: "" },
  ];

  for (const term of searchTerms.slice(0, 4)) {
    for (const loc of locationCodes) {
      try {
        const jobs = await fetchLinkedInJobs(term, loc, seen);
        allJobs.push(...jobs);
        await sleep(3000); // LinkedIn is stricter — longer delay
      } catch (err) {
        console.error(`[LinkedIn] Error for "${term}" in "${loc.name}":`, err.message);
      }
    }
  }

  return allJobs;
}

async function fetchLinkedInJobs(keyword, location, seen) {
  const jobs = [];

  // LinkedIn public job search (no auth)
  const params = new URLSearchParams({
    keywords: keyword,
    location: location.name,
    f_TPR: "r86400", // last 24 hours
    f_E: "1,2",      // entry level + associate
    sortBy: "DD",    // date descending
    position: 1,
    pageNum: 0,
  });

  if (location.geoId) {
    params.append("geoId", location.geoId);
  }

  const url = `${BASE_URL}/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.linkedin.com/jobs/",
    "Cache-Control": "no-cache",
  };

  const response = await axios.get(url, { headers, timeout: 20000 });
  const $ = cheerio.load(response.data);

  $("li").each((_, el) => {
    try {
      const card = $(el);
      const title = cleanText(card.find(".base-search-card__title, h3").text());
      const company = cleanText(card.find(".base-search-card__subtitle, h4").text());
      const locationText = cleanText(card.find(".job-search-card__location").text());
      const timeAgo = cleanText(card.find("time").attr("datetime") || card.find(".job-search-card__listdate").text());
      const linkEl = card.find("a.base-card__full-link, a[data-tracking-id]").first();
      const applyLink = linkEl.attr("href") || "";

      if (!title || !company || !applyLink) return;
      if (!isWithin24Hours(timeAgo)) return;

      const jobId = buildJobId("linkedin", title, company);
      if (seen.has(jobId)) return;
      seen.add(jobId);

      jobs.push({
        id: jobId,
        title,
        company,
        location: locationText || location.name,
        postedDate: formatLinkedInDate(timeAgo),
        applyLink: applyLink.split("?")[0], // clean tracking params
        source: "LinkedIn",
        sourceIcon: "🔷",
      });
    } catch (e) {
      // skip
    }
  });

  return jobs;
}

function isWithin24Hours(datetime) {
  if (!datetime) return true; // include if unknown
  try {
    // datetime is ISO string like "2024-01-15T10:30:00.000Z"
    const posted = new Date(datetime);
    const diff = (Date.now() - posted.getTime()) / (1000 * 60 * 60);
    return diff <= 24;
  } catch {
    return true;
  }
}

function formatLinkedInDate(datetime) {
  if (!datetime) return "Recently";
  try {
    const posted = new Date(datetime);
    const diff = Math.floor((Date.now() - posted.getTime()) / (1000 * 60 * 60));
    if (diff < 1) return "Just now";
    if (diff < 24) return `${diff} hours ago`;
    return "Today";
  } catch {
    return "Recently";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { scrapeLinkedIn };
