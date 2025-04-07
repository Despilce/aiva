import Issue from "../models/issue.model.js";
import User from "../models/user.model.js";

export const createTestIssues = async (req, res) => {
  try {
    const { department, issues } = req.body;

    if (
      !department ||
      !issues ||
      !Array.isArray(issues) ||
      issues.length === 0
    ) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    console.log(
      `Creating ${issues.length} test issues for department ${department}`
    );

    // Get all staff members in this department for random assignment if needed
    const staffMembers = await User.find({
      department,
      userType: { $in: ["staff", "manager"] },
    }).select("_id");

    const staffIds = staffMembers.map((staff) => staff._id);

    // Create all issues
    const createdIssues = await Promise.all(
      issues.map(async (issue) => {
        // If no assignedTo is provided, randomly assign to a staff member
        const assignedTo =
          issue.assignedTo ||
          staffIds[Math.floor(Math.random() * staffIds.length)];

        // Create the new issue
        const newIssue = new Issue({
          title: issue.title,
          description: issue.description,
          department,
          status: issue.status || "unsolved",
          priority: issue.priority || "medium",
          createdBy: req.user._id, // Use the authenticated user as creator
          assignedTo,
        });

        // Add comments if provided
        if (issue.comments && Array.isArray(issue.comments)) {
          newIssue.comments = issue.comments.map((comment) => ({
            text: comment.text,
            createdBy: comment.createdBy || req.user._id,
          }));
        }

        // Save the issue
        await newIssue.save();
        return newIssue;
      })
    );

    // Update staff performance metrics
    await Promise.all(
      staffIds.map(async (staffId) => {
        // Count issues assigned to this staff member
        const staffIssues = createdIssues.filter(
          (issue) =>
            issue.assignedTo &&
            issue.assignedTo.toString() === staffId.toString()
        );

        const totalStaffIssues = staffIssues.length;
        const solvedStaffIssues = staffIssues.filter(
          (issue) => issue.status === "solved"
        ).length;

        const performancePercentage = totalStaffIssues
          ? (solvedStaffIssues / totalStaffIssues) * 100
          : 0;

        // Update the staff member's performance metrics
        await User.findByIdAndUpdate(staffId, {
          $set: {
            "performanceMetrics.totalIssues": totalStaffIssues,
            "performanceMetrics.solvedIssues": solvedStaffIssues,
            "performanceMetrics.percentage": Math.round(performancePercentage),
          },
        });
      })
    );

    console.log(`Successfully created ${createdIssues.length} test issues`);
    res.status(201).json({
      message: `Successfully created ${createdIssues.length} test issues`,
      issues: createdIssues.map((issue) => ({
        _id: issue._id,
        title: issue.title,
        status: issue.status,
      })),
    });
  } catch (error) {
    console.error("Error in createTestIssues:", error);
    res.status(500).json({ message: "Error creating test issues" });
  }
};

export const updateIssueStatus = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { status, comment } = req.body;

    if (!issueId || !status) {
      return res
        .status(400)
        .json({ message: "Issue ID and status are required" });
    }

    // Validate the status
    if (!["solved", "unsolved", "pretending"].includes(status)) {
      return res
        .status(400)
        .json({
          message:
            "Invalid status. Must be one of: solved, unsolved, pretending",
        });
    }

    // Find the issue
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Store the old status
    const oldStatus = issue.status;

    // Update the issue status
    issue.status = status;

    // Add a comment if provided
    if (comment) {
      issue.comments.push({
        text: comment,
        createdBy: req.user._id,
      });
    }

    // Save the updated issue
    await issue.save();

    // Update staff performance metrics if status changed
    if (oldStatus !== status && issue.assignedTo) {
      const staffMember = await User.findById(issue.assignedTo);

      if (staffMember) {
        // Calculate new performance metrics
        const staffIssues = await Issue.find({
          assignedTo: staffMember._id,
        });

        const totalIssues = staffIssues.length;
        const solvedIssues = staffIssues.filter(
          (i) => i.status === "solved"
        ).length;
        const percentage = totalIssues
          ? Math.round((solvedIssues / totalIssues) * 100)
          : 0;

        // Update staff performance metrics
        staffMember.performanceMetrics = {
          totalIssues,
          solvedIssues,
          percentage,
        };

        await staffMember.save();
      }
    }

    // Return the updated issue
    res.json({
      message: `Issue status updated to ${status}`,
      issue: {
        _id: issue._id,
        title: issue.title,
        status: issue.status,
        commentsCount: issue.comments.length,
      },
    });
  } catch (error) {
    console.error("Error in updateIssueStatus:", error);
    res.status(500).json({ message: "Error updating issue status" });
  }
};
