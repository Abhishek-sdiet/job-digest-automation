// src/utils/jobFilter.js
// =====================================================
// Filters and deduplicates job listings based on
// your preferences in config/jobConfig.js
// =====================================================

const config = require("../../config/jobConfig");
const { isWithinLookback } = require("./helpers");

/**
 * Main filter pipeline:
 * 1. Remove jobs with excluded keywords
 * 2. Keep only jobs with at least one must-have keyword (or matching title)
 * 3. Deduplicate by job ID
 * 4. Sort by recency
 * 5. Cap at maxJobsPerEmail
 */
function filterJobs(jobs) {
  const { excludeKeywords, mustHaveKeywords } = config.search;
  const seen = new Set();
  let filtered = [];

  for (const job of jobs) {
    const searchText = `${job.title} ${job.company} ${job.location}`.toLowerCase();

    if (!isAllowedLocation(job.location)) continue;
    if (!isFreshEnough(job.postedDate)) continue;

    // 1. Skip if excluded keyword found
    const isExcluded = excludeKeywords.some((kw) => searchText.includes(kw.toLowerCase()));
    if (isExcluded) continue;

    // 2. Must have at least one relevant keyword OR matching role title
    const hasRelevantKeyword = mustHaveKeywords.some((kw) =>
      searchText.includes(kw.toLowerCase())
    );
    const hasRelevantTitle = config.search.roles.some((role) =>
      job.title.toLowerCase().includes(role.toLowerCase().split(" ")[0])
    );
    if (!hasRelevantKeyword && !hasRelevantTitle) continue;

    // 3. Deduplicate
    if (seen.has(job.id)) continue;
    seen.add(job.id);

    filtered.push(job);
  }

  // 4. Sort: "Just now" / "X hours ago" first, then "Today", then others
  filtered.sort((a, b) => recencyScore(b.postedDate) - recencyScore(a.postedDate));

  // 5. Cap
  return filtered.slice(0, config.search.maxJobsPerEmail);
}

function normalize(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function termMatchesLocation(location, term) {
  const normalizedLocation = normalize(location);
  const normalizedTerm = normalize(term);
  if (!normalizedLocation || !normalizedTerm) return false;
  return new RegExp(`(^|\\s)${escapeRegExp(normalizedTerm)}(\\s|$)`).test(normalizedLocation);
}

function isAllowedLocation(location) {
  if (!config.search.strictLocationFilter) return true;

  const text = normalize(location);
  if (!text) return false;

  const excludedTerms = config.search.excludedLocationTerms || [];
  if (excludedTerms.some((term) => termMatchesLocation(text, term))) return false;

  const configuredLocations = new Set(config.search.locations || []);
  const allowedTerms = new Set(
    [...configuredLocations].filter((location) => normalize(location) !== "remote")
  );
  const aliases = config.search.locationAliases || {};
  for (const [locationName, terms] of Object.entries(aliases)) {
    if (configuredLocations.has(locationName)) {
      for (const term of terms) allowedTerms.add(term);
    }
  }

  return [...allowedTerms].some((term) => termMatchesLocation(text, term));
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isFreshEnough(postedDate) {
  const text = (postedDate || "").toLowerCase();
  if (!text || text.includes("recently")) return true;
  return isWithinLookback(text, config.search.lookbackHours);
}

function recencyScore(postedDate) {
  const d = (postedDate || "").toLowerCase();
  if (d.includes("just now") || d.includes("minutes")) return 1000;
  const hoursMatch = d.match(/(\d+)\s+hour/);
  if (hoursMatch) return 1000 - parseInt(hoursMatch[1]);
  if (d.includes("today")) return 900;
  if (d.includes("yesterday") || d.includes("1 day")) return 800;
  return 500;
}

/**
 * Groups jobs by their source platform
 */
function groupBySource(jobs) {
  const groups = {};
  for (const job of jobs) {
    if (!groups[job.source]) groups[job.source] = [];
    groups[job.source].push(job);
  }
  return groups;
}

module.exports = { filterJobs, groupBySource, isAllowedLocation, isFreshEnough };
