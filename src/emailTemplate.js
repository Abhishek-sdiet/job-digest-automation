// src/emailTemplate.js
// =====================================================
// Generates a clean, mobile-friendly HTML email
// with jobs grouped by source platform
// =====================================================

const { getTodayFormatted, getISTTime } = require("./utils/helpers");
const { groupBySource } = require("./utils/jobFilter");

function buildEmailHTML(jobs) {
  const grouped = groupBySource(jobs);
  const today = getTodayFormatted();
  const totalCount = jobs.length;

  const sourceSections = Object.entries(grouped)
    .map(([source, sourceJobs]) => buildSourceSection(source, sourceJobs))
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Job Digest – ${today}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f4f8; color: #2d3748; }
  .wrapper { max-width: 680px; margin: 0 auto; background: #fff; }
  
  /* Header */
  .header { background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%); padding: 32px 40px; }
  .header-top { display: flex; align-items: center; justify-content: space-between; }
  .logo { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
  .logo span { color: #68d391; }
  .date-badge { background: rgba(255,255,255,0.1); padding: 6px 14px; border-radius: 20px; font-size: 12px; color: #e2e8f0; }
  .header-title { margin-top: 20px; font-size: 28px; font-weight: 700; color: #fff; line-height: 1.3; }
  .header-sub { margin-top: 8px; font-size: 14px; color: #a0aec0; }
  .stats-row { display: flex; gap: 20px; margin-top: 20px; }
  .stat { background: rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 16px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 700; color: #68d391; }
  .stat-label { font-size: 11px; color: #a0aec0; margin-top: 2px; }
  
  /* Content */
  .content { padding: 32px 40px; }
  
  /* Source Section */
  .source-section { margin-bottom: 36px; }
  .source-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #f7fafc; border-left: 4px solid #4299e1; border-radius: 0 8px 8px 0; margin-bottom: 16px; }
  .source-icon { font-size: 18px; }
  .source-name { font-size: 15px; font-weight: 600; color: #2d3748; }
  .source-count { margin-left: auto; background: #ebf8ff; color: #2b6cb0; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 12px; }
  
  /* Job Card */
  .job-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin-bottom: 12px; transition: all 0.2s; }
  .job-card:hover { border-color: #4299e1; box-shadow: 0 2px 8px rgba(66,153,225,0.15); }
  .job-title { font-size: 15px; font-weight: 600; color: #2d3748; line-height: 1.4; margin-bottom: 6px; }
  .job-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; color: #718096; margin-bottom: 14px; }
  .meta-item { display: flex; align-items: center; gap: 4px; }
  .job-footer { display: flex; align-items: center; justify-content: space-between; }
  .posted-badge { font-size: 11px; color: #68d391; background: #f0fff4; padding: 4px 10px; border-radius: 12px; font-weight: 500; }
  .apply-btn { display: inline-block; background: #4299e1; color: #fff !important; text-decoration: none; padding: 8px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px; }
  .apply-btn:hover { background: #3182ce; }
  
  /* Footer */
  .footer { background: #f7fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center; }
  .footer-text { font-size: 12px; color: #a0aec0; line-height: 1.8; }
  .footer-link { color: #4299e1; text-decoration: none; }
  .divider { height: 1px; background: #e2e8f0; margin: 8px 0; }
  .empty-state { text-align: center; padding: 40px; color: #a0aec0; font-size: 14px; }
  
  @media (max-width: 600px) {
    .content, .header { padding: 20px; }
    .stats-row { gap: 10px; }
    .job-footer { flex-direction: column; align-items: flex-start; gap: 10px; }
  }
</style>
</head>
<body>
<div class="wrapper">

  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div class="logo">Job<span>Digest</span></div>
      <div class="date-badge">📅 ${today}</div>
    </div>
    <div class="header-title">Good morning, Abhishek! 👋</div>
    <div class="header-sub">Here are today's freshest Software Engineering opportunities</div>
    <div class="stats-row">
      <div class="stat">
        <div class="stat-num">${totalCount}</div>
        <div class="stat-label">New Jobs</div>
      </div>
      <div class="stat">
        <div class="stat-num">${Object.keys(grouped).length}</div>
        <div class="stat-label">Sources</div>
      </div>
      <div class="stat">
        <div class="stat-num">24h</div>
        <div class="stat-label">Freshness</div>
      </div>
    </div>
  </div>

  <!-- CONTENT -->
  <div class="content">
    ${totalCount === 0 ? `<div class="empty-state">😴 No new jobs found in the last 24 hours.<br/>Check back tomorrow!</div>` : sourceSections}
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-text">
      This digest was generated automatically at 7:00 AM IST for <strong>Abhishek Kumar</strong><br/>
      Roles: Full Stack • MERN • SDE-1 • Frontend | Locations: Delhi NCR • Remote • Gurugram • Noida<br/>
      <div class="divider"></div>
      Jobs are also backed up to your <a href="#" class="footer-link">Google Sheet</a> •
      Want to change preferences? Edit <code>config/jobConfig.js</code>
    </div>
  </div>

</div>
</body>
</html>`;
}

function buildSourceSection(source, jobs) {
  const icon = jobs[0]?.sourceIcon || "📌";
  const jobCards = jobs.map(buildJobCard).join("\n");

  return `
<div class="source-section">
  <div class="source-header">
    <span class="source-icon">${icon}</span>
    <span class="source-name">${source}</span>
    <span class="source-count">${jobs.length} job${jobs.length !== 1 ? "s" : ""}</span>
  </div>
  ${jobCards}
</div>`;
}

function buildJobCard(job) {
  return `
<div class="job-card">
  <div class="job-title">${escapeHtml(job.title)}</div>
  <div class="job-meta">
    <span class="meta-item">🏢 ${escapeHtml(job.company)}</span>
    <span class="meta-item">📍 ${escapeHtml(job.location)}</span>
  </div>
  <div class="job-footer">
    <span class="posted-badge">🕐 ${escapeHtml(job.postedDate)}</span>
    <a href="${job.applyLink}" class="apply-btn" target="_blank">Apply Now →</a>
  </div>
</div>`;
}

function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailSubject(jobs) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
  return `🚀 ${jobs.length} New Tech Jobs — ${today} | LinkedIn, Naukri, Indeed & More`;
}

module.exports = { buildEmailHTML, buildEmailSubject };
