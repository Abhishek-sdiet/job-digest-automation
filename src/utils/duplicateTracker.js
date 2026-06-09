// src/utils/duplicateTracker.js
// =====================================================
// Tracks which job IDs have already been emailed
// Stores in a local JSON file (seenJobs.json)
// On GitHub Actions, this resets each run — 
// but the Google Sheet acts as the persistent record
// =====================================================

const fs = require("fs");
const path = require("path");

const SEEN_FILE = path.join(__dirname, "../../data/seenJobs.json");

function loadSeenJobs() {
  try {
    if (fs.existsSync(SEEN_FILE)) {
      const raw = fs.readFileSync(SEEN_FILE, "utf-8");
      const data = JSON.parse(raw);
      // Only keep jobs seen in the last 7 days
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const fresh = Object.fromEntries(
        Object.entries(data).filter(([, timestamp]) => timestamp > cutoff)
      );
      return fresh;
    }
  } catch (e) {
    console.warn("[DupTracker] Could not load seen jobs, starting fresh:", e.message);
  }
  return {};
}

function saveSeenJobs(seenMap) {
  try {
    const dir = path.dirname(SEEN_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SEEN_FILE, JSON.stringify(seenMap, null, 2));
  } catch (e) {
    console.warn("[DupTracker] Could not save seen jobs:", e.message);
  }
}

function filterNewJobs(jobs) {
  const seenMap = loadSeenJobs();
  const newJobs = jobs.filter((job) => !seenMap[job.id]);

  // Mark all as seen
  const now = Date.now();
  for (const job of newJobs) {
    seenMap[job.id] = now;
  }

  saveSeenJobs(seenMap);
  return newJobs;
}

module.exports = { filterNewJobs };
