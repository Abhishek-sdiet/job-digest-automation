// src/utils/jobFilter.js
// =====================================================
// Filters and deduplicates job listings based on
// your preferences in config/jobConfig.js
// =====================================================

const config = require("../../config/jobConfig");

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

module.exports = { filterJobs, groupBySource };
