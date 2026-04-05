const cron = require("node-cron");
const Issue = require("../models/Issue");
const Notification = require("../models/Notification");

// Runs every minute to check if faculty hasn't opened an assigned issue in 15 minutes
const scheduleReminders = (app) => {
  cron.schedule("* * * * *", async () => {
    try {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

      // Find issues assigned more than 15 mins ago, but still in "Assigned" status
      const unacknowledgedIssues = await Issue.find({
        status: "Assigned",
        assignedAt: { $lte: fifteenMinsAgo },
        assignedFacultyId: { $exists: true }
      });

      for (const issue of unacknowledgedIssues) {
        // Check if we already sent a reminder for this issue recently
        // To prevent spamming every minute, we can look for a recent reminder notification
        const recentReminder = await Notification.findOne({
          userId: issue.assignedFacultyId,
          issueId: issue._id,
          title: "SLA Reminder: Unopened Issue",
          createdAt: { $gte: new Date(Date.now() - 14 * 60 * 1000) } // Sent in the last 14 mins
        });

        if (!recentReminder) {
          // Send reminder to faculty
          const facultyNotif = await Notification.create({
            userId: issue.assignedFacultyId,
            issueId: issue._id,
            title: "SLA Reminder: Unopened Issue",
            message: `URGENT: Issue "${issue.title}" has been assigned to you for over 15 minutes! Please acknowledge.`,
            type: "warning"
          });

          // Also notify Admin (assuming Admin is role="ADMIN", we can broadcast or save generic admin notifs)
          // Based on current schema, Admin doesn't have a single userId.
          // But we can create a notification for "Admin" if there is a specific admin user, or log it.
          // For now, emit it to the faculty member
          
          if (app) {
              const io = app.get("io");
              if (io) {
                io.to(issue.assignedFacultyId.toString()).emit("reminder_notification", {
                  issue: issue,
                  notification: facultyNotif
                });
                
                // Optional: Broadcast to an admin room if they joined one
                io.emit("admin_alert", {
                  message: `Faculty missed 15-min SLA for issue: ${issue.title}`
                });
              }
          }
        }
      }
    } catch (error) {
      console.error("Error running reminder cron job: ", error);
    }
  });
};

module.exports = scheduleReminders;
