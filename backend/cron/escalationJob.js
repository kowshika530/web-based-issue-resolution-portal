const cron = require("node-cron");
const Issue = require("../models/Issue");
const DepartmentAdmin = require("../models/DepartmentAdmin");
const { sendEscalationEmail } = require("../utils/mailer");

// Runs every day at 10:00 AM to check for SLA breaches
const scheduleEscalations = () => {
  cron.schedule("0 10 * * *", async () => {
    console.log("Running SLA Escalation Check...");
    
    try {
      // Find issues that are unresolved (Submitted, Assigned, In Progress)
      const unresolvedIssues = await Issue.find({
        status: { $in: ["Submitted", "Assigned", "In Progress"] },
      });

      const now = new Date();

      for (const issue of unresolvedIssues) {
        const hoursPassed = (now - new Date(issue.createdAt)) / (1000 * 60 * 60);

        // Escalation thresholds (e.g., Reminder at 24 hours, Authority at 48 hours)
        if (hoursPassed >= 24) {
          const deptAdmin = await DepartmentAdmin.findOne({ categoryName: issue.category });
          
          if (deptAdmin) {
            if (hoursPassed >= 48 && deptAdmin.escalationEmail) {
              // Trigger Authority Escalation
              await sendEscalationEmail([deptAdmin.escalationEmail], issue, true);
            } else if (hoursPassed >= 24 && hoursPassed < 48) {
              // Trigger Reminder
              await sendEscalationEmail(deptAdmin.adminEmail, issue, false);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error running SLA escalation cron job: ", error);
    }
  });
};

module.exports = scheduleEscalations;
