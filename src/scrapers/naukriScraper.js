// src/scrapers/naukriScraper.js
// ============================================
// Scrapes Naukri.com for fresh job listings
// Uses their public search endpoint
// ============================================

const axios = require("axios");
const fs = require("fs");
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
      const jobs = await fetchNaukriJobs(term, locations, lookbackHours, seen);
      allJobs.push(...jobs);
      await sleep(2500);
    } catch (err) {
      console.error(`[Naukri] Error for "${term}":`, err.message);
    }
  }

  if (allJobs.length === 0) {
    const browserJobs = await scrapeNaukriWithBrowser(searchTerms.slice(0, 4), locations, lookbackHours, seen);
    allJobs.push(...browserJobs);
  }

  return allJobs;
}

async function fetchNaukriJobs(searchTerm, locations, lookbackHours, seen) {
  const jobs = [];
  const locationQuery = buildLocationQuery(locations);

  // Naukri public search API
  const url = `https://www.naukri.com/jobapi/v3/search`;
  const params = {
    noOfResults: 20,
    urlType: "search_by_keyword",
    searchType: "adv",
    keyword: searchTerm,
    location: locationQuery,
    experience: "0,3",
    k: searchTerm,
    l: locationQuery.split(",")[0].trim().replace(/\s+/g, "-"),
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

async function scrapeNaukriWithBrowser(searchTerms, locations, lookbackHours, seen) {
  const allJobs = [];
  let browser = null;

  try {
    const { chromium } = require("playwright");
    browser = await chromium.launch(getBrowserLaunchOptions());
    const page = await browser.newPage({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });

    for (const searchTerm of searchTerms) {
      try {
        const url = buildNaukriSearchUrl(searchTerm, locations);
        await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
        const jobs = await extractRenderedNaukriJobs(page, seen, lookbackHours);
        allJobs.push(...jobs);
        await sleep(1500);
      } catch (err) {
        console.error(`[Naukri] Browser fallback failed for "${searchTerm}": ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`[Naukri] Browser fallback unavailable: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }

  return allJobs;
}

function getBrowserLaunchOptions() {
  const edgePath = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
  const options = { headless: true, args: ["--no-sandbox"] };
  if (fs.existsSync(edgePath)) options.executablePath = edgePath;
  return options;
}

function buildNaukriSearchUrl(searchTerm, locations = []) {
  const locationSlug = buildPrimaryLocationSlug(locations);
  const keywordSlug = searchTerm.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const params = new URLSearchParams({
    k: searchTerm,
    l: locationSlug.replace(/-/g, " "),
    experience: "0",
    jobAge: "1",
    sort: "dd",
  });
  return `https://www.naukri.com/${keywordSlug}-jobs-in-${locationSlug}?${params}`;
}

function buildPrimaryLocationSlug(locations = []) {
  const preferred = locations.find((location) => {
    const normalized = String(location || "").toLowerCase();
    return normalized.includes("delhi") || normalized.includes("ncr");
  }) || locations.find((location) => String(location || "").toLowerCase() !== "remote") || "delhi ncr";

  return String(preferred).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function extractRenderedNaukriJobs(page, seen, lookbackHours) {
  const renderedJobs = await page.$$eval(".srp-jobtuple-wrapper", (cards) =>
    cards.map((card) => {
      const text = (selector) => card.querySelector(selector)?.textContent?.trim() || "";
      const titleEl = card.querySelector("a.title");
      const lines = (card.innerText || "").split("\n").map((line) => line.trim()).filter(Boolean);
      const postedDate = text(".job-post-day") || lines.find((line) => /today|few hours|hour|day|week|month/i.test(line)) || "";
      return {
        title: titleEl?.getAttribute("title") || titleEl?.textContent?.trim() || "",
        company: text(".comp-name"),
        location: text(".locWdth"),
        postedDate,
        applyLink: titleEl?.href || "",
      };
    })
  );

  const jobs = [];
  for (const job of renderedJobs) {
    const title = cleanText(job.title);
    const company = cleanText(job.company);
    const location = cleanText(job.location);
    const postedDate = cleanText(job.postedDate);

    if (!title || !company || !job.applyLink) continue;
    if (!isRecentNaukriLabel(postedDate, lookbackHours)) continue;

    const jobId = buildJobId("naukri", title, company);
    if (seen.has(jobId)) continue;
    seen.add(jobId);

    jobs.push({
      id: jobId,
      title,
      company,
      location,
      postedDate: postedDate || "Recently",
      applyLink: job.applyLink,
      source: "Naukri.com",
      sourceIcon: "ðŸŸ ",
    });
  }

  return jobs;
}

function buildLocationQuery(locations = []) {
  const normalized = locations
    .map((location) => String(location || "").trim())
    .filter(Boolean)
    .map((location) => location.toLowerCase() === "remote" ? "remote india" : location.toLowerCase());

  const unique = [...new Set(normalized)];
  return unique.length ? unique.join(", ") : "delhi ncr";
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

function isRecentNaukriLabel(label, lookbackHours = 24) {
  const lower = (label || "").toLowerCase();
  if (!lower) return false;
  if (lower.includes("just now") || lower.includes("today") || lower.includes("few hours")) return true;
  const hours = lower.match(/(\d+)\s*\+?\s*hours?/);
  if (hours) return Number(hours[1]) <= lookbackHours;
  const days = lower.match(/(\d+)\s*\+?\s*days?/);
  if (days) return Number(days[1]) <= Math.ceil(lookbackHours / 24);
  if (lower.includes("1 day") || lower.includes("yesterday")) return lookbackHours >= 24;
  return false;
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
