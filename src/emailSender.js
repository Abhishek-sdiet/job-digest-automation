// src/emailSender.js
// =====================================================
// Sends the job digest email via Gmail SMTP
// Uses App Password (not your regular Gmail password)
// =====================================================

const nodemailer = require("nodemailer");
require("dotenv").config();

async function sendDigestEmail(subject, htmlContent, recipientEmail) {
  // Create Gmail SMTP transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // 16-char App Password
    },
  });

  // Verify connection before sending
  await transporter.verify();
  console.log("[Email] SMTP connection verified ✓");

  const mailOptions = {
    from: `"JobDigest Bot 🤖" <${process.env.GMAIL_USER}>`,
    to: recipientEmail || process.env.DIGEST_TO_EMAIL,
    subject,
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email] Sent successfully! Message ID: ${info.messageId}`);
  return info;
}

module.exports = { sendDigestEmail };
