// src/scrapers/companyScraper.js
// =====================================================
// Scrapes dream company career pages directly
// Uses Playwright for JS-heavy pages
// =====================================================

const { cleanText, buildJobId } = require("../utils/helpers");

async function scrapeCompanyCareers(companies) {
  const allJobs = [];
  let browser = null;

  try {
    const { chromium } = require("playwright");
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });

    for (const company of companies) {
      try {
        console.log(`[Companies] Checking ${company.name}...`);
        const page = await context.newPage();
        await page.goto(company.careersUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(2000);

        const jobs = await extractJobsFromPage(page, company);
        allJobs.push(...jobs);
        await page.close();
        await sleep(2000);
      } catch (err) {
        console.error(`[Companies] Error scraping ${company.name}:`, err.message);
      }
    }

    await context.close();
  } catch (err) {
    console.error("[Companies] Playwright not available:", err.message);
    console.log("[Companies] Skipping company career pages — run `npx playwright install chromium` to enable");
  } finally {
    if (browser) await browser.close();
  }

  return allJobs;
}

async function extractJobsFromPage(page, company) {
  const jobs = [];

  // Generic extraction — finds job-like links with relevant keywords
  const jobLinks = await page.evaluate((keywords) => {
    const results = [];
    const links = document.querySelectorAll("a");

    for (const link of links) {
      const text = (link.textContent || "").toLowerCase().trim();
      const href = link.href || "";

      if (!text || !href || text.length < 5) continue;

      const isJobRelated = keywords.some((kw) => text.includes(kw.toLowerCase()));
      if (!isJobRelated) continue;

      // Skip navigation links
      if (["home", "about", "contact", "login", "blog"].some((nav) => text === nav)) continue;

      results.push({
        title: link.textContent.trim(),
        href,
      });
    }

    return results.slice(0, 15); // max 15 per company
  }, company.keywords);

  for (const link of jobLinks) {
    const jobId = buildJobId("company", link.title, company.name);
    jobs.push({
      id: jobId,
      title: cleanText(link.title),
      company: company.name,
      location: "Check listing",
      postedDate: "Recently",
      applyLink: link.href,
      source: `${company.name} Careers`,
      sourceIcon: "⭐",
    });
  }

  return jobs;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { scrapeCompanyCareers };
