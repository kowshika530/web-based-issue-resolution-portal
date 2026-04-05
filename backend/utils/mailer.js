const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Assuming gmail for simplicity, adjust if using another provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an email notification to Department Admins
 * @param {Array<string>} toEmails Array of admin email addresses
 * @param {Object} issueData The new issue document details
 */
const sendIssueNotification = async (toEmails, issueData) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not provided. Skipping email notification.");
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmails.join(","),
    subject: `New Issue Reported - [${issueData.category}]`,
    html: `
      <h2>New Issue Requires Attention</h2>
      <p>A new issue has been logged under the <strong>${issueData.category}</strong> category.</p>
      
      <table border="1" cellpadding="8" style="border-collapse: collapse; margin-top: 15px;">
        <tr>
          <td><strong>Issue Title</strong></td>
          <td>${issueData.title}</td>
        </tr>
        <tr>
          <td><strong>Student Name</strong></td>
          <td>${issueData.studentName || "Anonymous User"}</td>
        </tr>
        <tr>
          <td><strong>Location</strong></td>
          <td>${issueData.location}</td>
        </tr>
        <tr>
          <td><strong>Priority</strong></td>
          <td>${issueData.priority}</td>
        </tr>
        <tr>
          <td><strong>Date & Time</strong></td>
          <td>${new Date(issueData.createdAt).toLocaleString()}</td>
        </tr>
      </table>
      
      <div style="margin-top: 20px;">
        <strong>Description:</strong>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${issueData.description}</p>
      </div>

      <p style="margin-top: 20px;">
        <a href="http://localhost:5173/admin" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View in Admin Dashboard
        </a>
      </p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Notification email sent successfully: " + info.response);
  } catch (error) {
    console.error("Error sending notification email: ", error);
  }
};

/**
 * Sends an escalation reminder email
 */
const sendEscalationEmail = async (toEmails, issueData, isAuthority = false) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const subjectPrefix = isAuthority ? "URGENT ESCALATION" : "REMINDER";
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmails.join(","),
    subject: `[${subjectPrefix}] Unresolved Issue: ${issueData.title}`,
    text: `The issue "${issueData.title}" in category ${issueData.category} remains unresolved.\n\nPriority: ${issueData.priority}\nSubmitted on: ${new Date(issueData.createdAt).toLocaleString()}\n\nPlease address this immediately.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Escalation email (${subjectPrefix}) sent successfully.`);
  } catch (error) {
    console.error("Error sending escalation email: ", error);
  }
};

module.exports = {
  sendIssueNotification,
  sendEscalationEmail
};
