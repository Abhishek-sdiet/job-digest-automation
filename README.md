# 🚀 Job Digest Automation — Abhishek Kumar

A fully automated daily email that scrapes fresh Software Engineering / Tech jobs from LinkedIn, Indeed, Naukri, Internshala, and dream company career pages — and lands in your inbox every morning at **7:00 AM IST**.

---

## 📬 What You Get Every Morning

- ✅ Jobs posted in the **last 24 hours only**
- ✅ Grouped by platform (LinkedIn / Naukri / Indeed / Internshala)
- ✅ Direct **Apply Now** link for each job
- ✅ No duplicates — tracks what you've already seen
- ✅ Backed up to **Google Sheets** automatically
- ✅ Runs free via **GitHub Actions** (no server needed)

---

## 🗂️ Project Structure

```
job-digest/
├── .github/
│   └── workflows/
│       └── job-digest.yml      ← GitHub Actions scheduler (7AM IST)
├── config/
│   └── jobConfig.js            ← ✏️ Edit YOUR preferences here
├── src/
│   ├── index.js                ← Main entry point
│   ├── emailTemplate.js        ← HTML email builder
│   ├── emailSender.js          ← Gmail SMTP sender
│   ├── sheetsBackup.js         ← Google Sheets backup
│   ├── scrapers/
│   │   ├── linkedinScraper.js
│   │   ├── indeedScraper.js
│   │   ├── naukriScraper.js
│   │   ├── internScraper.js
│   │   └── companyScraper.js
│   ├── utils/
│   │   ├── jobFilter.js        ← Filters irrelevant jobs
│   │   ├── duplicateTracker.js ← Tracks seen job IDs
│   │   └── helpers.js
│   └── test-email.js           ← Quick test without scraping
├── .env.example                ← Copy → .env and fill in
├── .gitignore
└── package.json
```

---

## ⚡ Setup Guide (Step by Step)

### Step 1 — Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/job-digest.git
cd job-digest
npm install
npx playwright install chromium   # For company career pages
```

---

### Step 2 — Get Your Gmail App Password

> ⚠️ You **cannot** use your regular Gmail password. You need an **App Password**.

1. Go to your Google Account → **Security**
2. Make sure **2-Step Verification** is ON
3. Go to: https://myaccount.google.com/apppasswords
4. Select **App: Mail**, **Device: Other** → type "JobDigest"
5. Copy the 16-character password shown (e.g. `abcd efgh ijkl mnop`)

---

### Step 3 — Create Your .env File

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
GMAIL_USER=abhi20040805@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop    # your 16-char app password (no spaces)
DIGEST_TO_EMAIL=abhi20040805@gmail.com
```

The Google Sheets fields are optional — leave them blank to skip backup.

---

### Step 4 — Test It Locally

```bash
# Send a test email with dummy jobs to verify Gmail works
node src/test-email.js
```

Check your inbox for the test email. If it arrives → ✅ you're good to go!

If it fails, double-check your App Password and that `GMAIL_USER` is correct.

---

### Step 5 — Run Full Scrape Locally

```bash
node src/index.js
```

You'll see output like:
```
========================================
🚀 Job Digest Automation Starting...
========================================

📡 Scraping job sources...

  ✓ LinkedIn: 8 jobs found
  ✓ Indeed India: 12 jobs found
  ✓ Naukri.com: 7 jobs found
  ✓ Internshala: 5 jobs found
  ✓ Dream Companies: 3 jobs found

✅ Total raw jobs scraped: 35
🔍 After relevance filter: 24 jobs
🆕 After deduplication: 24 new jobs

📊 Backing up to Google Sheets...
📧 Building email digest...
🎉 Digest sent to abhi20040805@gmail.com with 24 jobs!
```

---

### Step 6 — Deploy to GitHub Actions (Free Automation)

1. **Push to GitHub:**
```bash
git add .
git commit -m "Initial job digest setup"
git push origin main
```

2. **Add Secrets to GitHub:**

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these secrets one by one:

| Secret Name | Value |
|---|---|
| `GMAIL_USER` | abhi20040805@gmail.com |
| `GMAIL_APP_PASSWORD` | your 16-char app password |
| `DIGEST_TO_EMAIL` | abhi20040805@gmail.com |
| `GOOGLE_SHEET_ID` | (optional) your sheet ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | (optional) |
| `GOOGLE_PRIVATE_KEY` | (optional) |

3. **Enable GitHub Actions:**
   - Go to your repo → **Actions** tab
   - Click **"I understand my workflows, go ahead and enable them"**

4. **Test it manually:**
   - Go to **Actions → Daily Job Digest → Run workflow**
   - Set `test_mode = true` for a quick test
   - Set `test_mode = false` for full run

5. **It will now run automatically every day at 7:00 AM IST** 🎉

---

## 🔧 Customization

### Change job roles or keywords
Edit **`config/jobConfig.js`** — all your preferences are in one place:
- Add/remove `roles`
- Add/remove `mustHaveKeywords`
- Add to `excludeKeywords`
- Add to `dreamCompanies`

### Change the schedule
Edit **`.github/workflows/job-digest.yml`**:
```yaml
- cron: "30 1 * * *"   # 7:00 AM IST
- cron: "0 2 * * *"    # 7:30 AM IST
- cron: "30 3 * * *"   # 9:00 AM IST
```
IST = UTC + 5:30, so subtract 5:30 from your desired time for the UTC cron.

---

## 🔒 Setting Up Google Sheets Backup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "JobDigest")
3. Enable **Google Sheets API**
4. Go to **Credentials → Create Service Account**
5. Name it `job-digest-bot`, click Create
6. Under **Keys → Add Key → JSON** — download the JSON file
7. Copy `client_email` → paste as `GOOGLE_SERVICE_ACCOUNT_EMAIL`
8. Copy `private_key` → paste as `GOOGLE_PRIVATE_KEY`
9. Create a new Google Sheet
10. Share it with the `client_email` (give Editor access)
11. Copy the Sheet ID from the URL → paste as `GOOGLE_SHEET_ID`

---

## ❓ Troubleshooting

| Problem | Fix |
|---|---|
| "Invalid login" email error | Use App Password, not Gmail password |
| No jobs found | LinkedIn/Naukri may have changed their HTML — check scraper logs |
| GitHub Actions not running | Check Actions tab is enabled in repo settings |
| Jobs repeating | Delete `data/seenJobs.json` to reset |
| Playwright install fails | Run `npx playwright install chromium --with-deps` again |

---

## 🛣️ Upgrade Ideas (Future)

- [ ] Add Telegram/WhatsApp notification alongside email
- [ ] Add salary filter (scrape salary data where available)
- [ ] Build a simple web dashboard to track applications
- [ ] Add `Status` column update via reply-to-email
- [ ] Add Wellfound (AngelList) for startup jobs

---

Built with ❤️ for Abhishek Kumar's job search — May 2025
