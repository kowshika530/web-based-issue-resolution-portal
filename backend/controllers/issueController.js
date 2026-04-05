const User = require("../models/User");
const Issue = require("../models/Issue");
const DepartmentAdmin = require("../models/DepartmentAdmin");
const Notification = require("../models/Notification");
const { sendIssueNotification } = require("../utils/mailer");

const evaluateAchievements = async (user) => {
  const newAchievements = new Set(user.achievements || []);
  
  if (user.totalIssuesRaised >= 1) newAchievements.add("First Report");
  if (user.totalIssuesRaised >= 5) newAchievements.add("Active Reporter");
  if (user.totalIssuesResolved >= 5) newAchievements.add("Problem Solver");
  if (user.reputationScore > 50) newAchievements.add("Trusted User");
  
  if (user.totalIssuesRaised > 0 && user.fakeIssuesCount === 0) {
     newAchievements.add("Smart Reporter");
  } else if (user.fakeIssuesCount > 0) {
     newAchievements.delete("Smart Reporter");
  }

  user.achievements = Array.from(newAchievements);
  await user.save();
};
// @desc    Create new issue
// @route   POST /api/issues/create
// @access  Private
const createIssue = async (req, res) => {
  try {
    const { title, description, category, location, priority, isAnonymous, attachments, locationValidated } = req.body;

    const userDoc = await User.findById(req.user._id);
    const assignedPriority = (userDoc && userDoc.trustScore < 50) ? "LOW" : priority;

    const issue = new Issue({
      title,
      description,
      category,
      location,
      priority: assignedPriority,
      isAnonymous: isAnonymous || false,
      attachments: attachments || [],
      studentId: req.user._id,
      studentName: isAnonymous ? "Anonymous User" : req.user.name,
      status: "Submitted",
      isVerified: false,
      isFlagged: false,
      locationValidated: locationValidated || false,
      votes: [],
      comments: [],
      history: [{ status: "Submitted", changedBy: isAnonymous ? "Anonymous User" : req.user.name, timestamp: Date.now() }]
    });

    const savedIssue = await issue.save();

    if (userDoc) {
       userDoc.totalIssuesRaised = (userDoc.totalIssuesRaised || 0) + 1;
       userDoc.reputationScore = (userDoc.reputationScore || 0) + 10;
       
       if ((attachments && attachments.length > 0) || locationValidated) {
          userDoc.reputationScore += 5;
       }
       
       await evaluateAchievements(userDoc);
    }

    // Fetch matching department admin and trigger email asynchronously
    const deptAdmin = await DepartmentAdmin.findOne({ categoryName: category });
    if (deptAdmin && deptAdmin.adminEmail && deptAdmin.adminEmail.length > 0) {
       sendIssueNotification(deptAdmin.adminEmail, savedIssue).catch(err => console.error("Failed to send async email:", err));
    }

    res.status(201).json(savedIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all issues
// @route   GET /api/issues/all
// @access  Private (Admin only)
const getIssues = async (req, res) => {
  try {
    let issues = await Issue.find()
      .populate('studentId', 'trustScore')
      .sort({ createdAt: -1 })
      .lean();
      
    issues = issues.map(issue => ({
       ...issue,
       trustScore: issue.studentId ? issue.studentId.trustScore : 80,
       studentId: issue.studentId ? issue.studentId._id : null
    }));
    
    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get public issues for students (used for voting and duplicate detection)
// @route   GET /api/issues/public
// @access  Private
const getPublicIssues = async (req, res) => {
  try {
    // Only fetch issues that are not rejected
    let issues = await Issue.find({ status: { $ne: 'Rejected' } })
      .populate('studentId', 'trustScore')
      .sort({ createdAt: -1 })
      .lean();
      
    issues = issues.map(issue => ({
       ...issue,
       trustScore: issue.studentId ? issue.studentId.trustScore : 80,
       studentId: issue.studentId ? issue.studentId._id : null,
       // Anonymize the original student name if explicitly anonymous
       studentName: issue.isAnonymous ? "Anonymous User" : issue.studentName
    }));
    
    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my issues

// @route   GET /api/issues/my
// @access  Private
const getMyIssues = async (req, res) => {
  try {
    let issues = await Issue.find({ studentId: req.user._id })
      .populate('studentId', 'trustScore')
      .sort({ createdAt: -1 })
      .lean();
      
    issues = issues.map(issue => ({
       ...issue,
       trustScore: issue.studentId ? issue.studentId.trustScore : 80,
       studentId: issue.studentId ? issue.studentId._id : null
    }));
    
    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single issue
// @route   GET /api/issues/:id
// @access  Private
const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (issue) {
      res.json(issue);
    } else {
      res.status(404).json({ message: "Issue not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update issue (Status / AssignedTo / Verification / StaffNotes / isPinned)
// @route   PUT /api/issues/:id
// @access  Private/Admin
const updateIssue = async (req, res) => {
  try {
    const { status, assignedTo, isVerified, isFlagged, staffNotes, isPinned } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (issue) {
      if (status && issue.status !== status) {
        issue.history.push({
          status: status,
          changedBy: req.user.name,
          timestamp: Date.now()
        });
        issue.status = status;
        if (status === 'Resolved') {
          issue.resolvedAt = Date.now();
          // Increase trust & reputation score for genuine issue
          if (issue.isVerified || !issue.isFlagged) {
             const student = await User.findById(issue.studentId);
             if (student) {
                student.trustScore = Math.min(100, student.trustScore + 5);
                student.reputationScore = (student.reputationScore || 0) + 15;
                student.totalIssuesResolved = (student.totalIssuesResolved || 0) + 1;
                await evaluateAchievements(student);
             }
          }
        }
        if (status === 'Rejected' && isFlagged) {
           // Admin marked as fake
           const student = await User.findById(issue.studentId);
           if (student) {
               student.trustScore = Math.max(0, student.trustScore - 20);
               student.reputationScore = (student.reputationScore || 0) - 15;
               student.fakeIssuesCount = (student.fakeIssuesCount || 0) + 1;
               await evaluateAchievements(student);
           }
           issue.priority = "LOW";
        }
      }
      if (assignedTo && issue.assignedTo !== assignedTo) {
        if (req.user.role !== 'ADMIN') {
          return res.status(403).json({ message: "Not authorized to assign issues" });
        }
        issue.assignedTo = assignedTo;
        // In our plan: assume assignedTo is the faculty ID string, or assignedFacultyId is properly set from frontend.
        // Let's also accept an `assignedFacultyId` from req.body if provided.
        if (req.body.assignedFacultyId) {
           issue.assignedFacultyId = req.body.assignedFacultyId;
           issue.assignedAt = Date.now();
           
           // Create Notification for the assigned faculty
           const notif = await Notification.create({
              userId: req.body.assignedFacultyId,
              issueId: issue._id,
              title: "New Issue Assigned",
              message: `You have been assigned a new issue: ${issue.title}`,
              type: "info"
           });
           
           // Emit socket event to the faculty member's specific room
           const io = req.app.get("io");
           if (io) {
             io.to(req.body.assignedFacultyId).emit("issue_assigned", {
                 issue: issue,
                 notification: notif
             });
           }
        }

        issue.history.push({
          status: `Assigned to ${assignedTo}`,
          changedBy: req.user.name,
          timestamp: Date.now()
        });
      }
      if (isVerified !== undefined) {
        if (req.user.role !== 'ADMIN') {
          return res.status(403).json({ message: "Not authorized to verify issues" });
        }
        issue.isVerified = isVerified;
        if (isVerified) issue.priority = "HIGH";
      }
      if (isFlagged !== undefined) {
        if (req.user.role !== 'ADMIN') {
          return res.status(403).json({ message: "Not authorized to flag issues" });
        }
        issue.isFlagged = isFlagged;
      }
      if (staffNotes !== undefined) {
        issue.staffNotes = staffNotes;
      }
      if (isPinned !== undefined) {
        if (req.user.role !== 'ADMIN') {
          return res.status(403).json({ message: "Not authorized to pin issues" });
        }
        issue.isPinned = isPinned;
      }

      issue.updatedAt = Date.now();
      const updatedIssue = await issue.save();
      res.json(updatedIssue);
    } else {
      res.status(404).json({ message: "Issue not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Vote on an issue
// @route   PUT /api/issues/:id/vote
// @access  Private
const voteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.trustScore < 30) {
        return res.status(403).json({ message: "Your trust score is too low to vote." });
    }

    // Check if user has already voted
    const hasVoted = issue.votes.includes(req.user._id);

    if (hasVoted) {
      // Remove vote
      issue.votes = issue.votes.filter(
        v => v.toString() !== req.user._id.toString()
      );
    } else {
      // Add vote
      issue.votes.push(req.user._id);
      
      // Spam Detection: Multiple likes in short time
      const timeSinceCreation = (Date.now() - new Date(issue.createdAt).getTime()) / 60000; // minutes
      if (issue.votes.length >= 5 && timeSinceCreation < 5 && !issue.isVerified) {
          issue.isFlagged = true;
          issue.priority = 'LOW';
          // Penalize author for suspected vote manipulation or duplicate spam
          const author = await User.findById(issue.studentId);
          if (author) {
             author.reputationScore = (author.reputationScore || 0) - 10;
             await evaluateAchievements(author);
          }
      }
    }

    await issue.save();
    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add comment to issue
// @route   POST /api/issues/:id/comment
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (issue) {
      const comment = {
        authorId: req.user._id,
        authorName: req.user.name,
        role: req.user.role,
        text,
        timestamp: Date.now()
      };

      issue.comments.push(comment);
      issue.updatedAt = Date.now();
      await issue.save();
      
      res.status(201).json(issue);
    } else {
      res.status(404).json({ message: "Issue not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete issue
// @route   DELETE /api/issues/:id
// @access  Private (Owner or Admin)
const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (issue) {
      if (issue.studentId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Not authorized to delete this issue" });
      }
      await Issue.deleteOne({ _id: issue._id });
      res.json({ message: "Issue removed" });
    } else {
      res.status(404).json({ message: "Issue not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle bookmark for an issue
// @route   PUT /api/issues/:id/bookmark
// @access  Private
const toggleBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const issueId = req.params.id;
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const index = user.bookmarks.indexOf(issueId);
    if (index === -1) {
      user.bookmarks.push(issueId);
    } else {
      user.bookmarks.splice(index, 1);
    }
    await user.save();
    res.json(user.bookmarks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createIssue,
  getIssues,
  getPublicIssues,
  getMyIssues,
  getIssueById,
  updateIssue,
  voteIssue,
  addComment,
  deleteIssue,
  toggleBookmark
};