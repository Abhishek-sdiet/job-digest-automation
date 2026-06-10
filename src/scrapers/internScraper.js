// src/scrapers/internScraper.js
// ============================================
// Scrapes Internshala for internship + 
// fresher job listings (MERN / full stack)
// ============================================

const axios = require("axios");
const cheerio = require("cheerio");
const { cleanText, buildJobId } = require("../utils/helpers");

const BASE_URL = "https://internshala.com";

async function scrapeInternshala(locations, lookbackHours) {
  const allJobs = [];
  const seen = new Set();

  const searches = [
    { path: "/internships/web-development-internship", label: "Web Dev" },
    { path: "/internships/javascript-internship", label: "JavaScript" },
    { path: "/internships/nodejs-internship", label: "Node.js" },
    { path: "/internships/reactjs-internship", label: "React" },
    { path: "/internships/full-stack-development-internship", label: "Full Stack" },
    { path: "/jobs/web-development-jobs", label: "Web Dev Jobs" },
    { path: "/jobs/software-development-jobs", label: "Software Dev Jobs" },
  ];

  for (const search of searches) {
    try {
      const jobs = await fetchInternshalaListings(search, seen);
      allJobs.push(...jobs);
      await sleep(2000);
    } catch (err) {
      console.error(`[Internshala] Error for "${search.label}":`, err.message);
    }
  }

  return allJobs;
}

async function fetchInternshalaListings(search, seen) {
  const jobs = [];
  const url = `${BASE_URL}${search.path}`;
  const isJob = search.path.includes("/jobs/");

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://internshala.com/",
  };

  const response = await axios.get(url, { headers, timeout: 15000 });
  const $ = cheerio.load(response.data);

  const cards = isJob
    ? $(".individual_internship, .internship_meta")
    : $(".internship_meta, .individual_internship");

  cards.each((_, el) => {
    try {
      const titleEl = $(el).find(".job-title-href, .job-title, .profile, h3 a").first();
      const title = cleanText(titleEl.text());
      const company = cleanText(
        $(el).find(".company-name a, .company_name a, .company-name, .company_name").first().text()
      ).replace(/\s+Actively hiring.*$/i, "");
      const location = cleanText($(el).find(".locations span, .location_link").text());
      const postedDate = cleanText($(el).find(".status-inactive, .posted_by_time_mobile").text()) || "Recently";
      const linkPath = $(el).find("a.job-title-href, a.job-title, a.profile").first().attr("href") ||
                       $(el).closest("a").attr("href");
      const applyLink = linkPath
        ? linkPath.startsWith("http") ? linkPath : `${BASE_URL}${linkPath}`
        : url;

      if (!title || !company) return;

      const jobId = buildJobId("internshala", title, company);
      if (seen.has(jobId)) return;
      seen.add(jobId);

      jobs.push({
        id: jobId,
        title: title + (isJob ? "" : " (Internship)"),
        company,
        location,
        postedDate: formatInternshalaDate(postedDate),
        applyLink,
        source: "Internshala",
        sourceIcon: "🟢",
      });
    } catch (e) {
      // skip
    }
  });

  return jobs;
}

function formatInternshalaDate(dateText) {
  const lower = (dateText || "").toLowerCase();
  if (lower.includes("today") || lower.includes("just")) return "Today";
  if (lower.includes("yesterday") || lower.includes("1 day")) return "Yesterday";
  if (lower.includes("few days") || lower.includes("2 day") || lower.includes("3 day")) return "2-3 days ago";
  return dateText || "Recently";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { scrapeInternshala };
