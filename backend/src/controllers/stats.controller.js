const User = require("../models/user.model");
const Issue = require("../models/issue.model");

const getDepartmentStats = async (req, res) => {
  try {
    const { department } = req.params;

    // Get staff members in the department
    const staffMembers = await User.find({
      department,
      userType: { $in: ["staff", "other"] },
    }).select("-password");

    // Get all issues for the department
    const issues = await Issue.find({ department });

    // Calculate total issues stats
    const totalIssues = issues.length;
    const solvedIssues = issues.filter(
      (issue) => issue.status === "solved"
    ).length;
    const unsolvedIssues = issues.filter(
      (issue) => issue.status === "unsolved"
    ).length;
    const pretendingIssues = issues.filter(
      (issue) => issue.status === "pretending"
    ).length;

    // Calculate performance history (last 7 days)
    const last7Days = [...Array(7)]
      .map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split("T")[0];
      })
      .reverse();

    const performanceHistory = await Promise.all(
      last7Days.map(async (date) => {
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const dayIssues = await Issue.find({
          department,
          createdAt: { $gte: startOfDay, $lt: endOfDay },
        });

        const totalDayIssues = dayIssues.length;
        const solvedDayIssues = dayIssues.filter(
          (issue) => issue.status === "solved"
        ).length;
        const performance = totalDayIssues
          ? (solvedDayIssues / totalDayIssues) * 100
          : 0;

        return {
          date,
          performance: Math.round(performance),
        };
      })
    );

    // Calculate staff performance metrics
    const staffList = await Promise.all(
      staffMembers.map(async (staff) => {
        const staffIssues = await Issue.find({
          department,
          assignedTo: staff._id,
        });

        const totalStaffIssues = staffIssues.length;
        const solvedStaffIssues = staffIssues.filter(
          (issue) => issue.status === "solved"
        ).length;
        const performancePercentage = totalStaffIssues
          ? (solvedStaffIssues / totalStaffIssues) * 100
          : 0;

        return {
          _id: staff._id,
          fullName: staff.fullName,
          email: staff.email,
          performanceMetrics: {
            totalIssues: totalStaffIssues,
            solvedIssues: solvedStaffIssues,
            percentage: Math.round(performancePercentage),
          },
        };
      })
    );

    // Sort staff list by performance percentage in descending order
    staffList.sort(
      (a, b) =>
        b.performanceMetrics.percentage - a.performanceMetrics.percentage
    );

    res.json({
      totalStaff: staffMembers.length,
      totalIssues,
      solvedIssues,
      unsolvedIssues,
      pretendingIssues,
      performanceHistory,
      staffList,
    });
  } catch (error) {
    console.error("Error fetching department stats:", error);
    res.status(500).json({ message: "Error fetching department statistics" });
  }
};

module.exports = {
  getDepartmentStats,
};
