import User from "../models/user.model.js";
import Issue from "../models/issue.model.js";

export const getDepartmentStats = async (req, res) => {
  try {
    const { department } = req.params;
    console.log("Fetching stats for department:", department);

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    // Convert department name to match schema format if needed
    const departmentName =
      department === "SSU" ? "SSU(Student Support Unit)" : department;

    // Get staff members in the department
    const staffMembers = await User.find({
      department: departmentName,
      userType: { $in: ["staff", "other"] },
    }).select("-password");

    console.log(`Found ${staffMembers.length} staff members in department`);

    // Get all issues for the department
    const issues = await Issue.find({
      department: departmentName,
    })
      .populate("createdBy", "fullName email")
      .populate("assignedTo", "fullName email");

    console.log(`Found ${issues.length} issues for department`);

    // Check if we need to use staff performance metrics (in case issues collection is empty)
    let totalIssues = issues.length;
    let solvedIssues = 0;
    let unsolvedIssues = 0;
    let pretendingIssues = 0;

    // Calculate staff performance metrics
    const staffList = await Promise.all(
      staffMembers.map(async (staff) => {
        // Try to find issues in the issues collection first
        const staffIssues = await Issue.find({
          department: departmentName,
          assignedTo: staff._id,
        })
          .populate("createdBy", "fullName email")
          .sort({ createdAt: -1 });

        // If no issues found in collection but user has performance metrics, use those
        let totalStaffIssues = staffIssues.length;
        let solvedStaffIssues = staffIssues.filter(
          (issue) => issue.status === "solved"
        ).length;

        // If no issues in database but staff has performance metrics, use those instead
        if (
          staffIssues.length === 0 &&
          staff.performanceMetrics &&
          staff.performanceMetrics.totalIssues > 0
        ) {
          console.log(
            `Using performance metrics for ${staff.fullName} since no issues found in collection`
          );
          totalStaffIssues = staff.performanceMetrics.totalIssues;
          solvedStaffIssues = staff.performanceMetrics.solvedIssues;
        }

        console.log(`Staff member ${staff.fullName} (${staff._id}):`, {
          totalIssues: totalStaffIssues,
          solvedIssues: solvedStaffIssues,
          issues: staffIssues.map((i) => ({
            id: i._id,
            status: i.status,
            department: i.department,
          })),
        });

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
          issues: staffIssues.map((issue) => ({
            _id: issue._id,
            title: issue.title,
            status: issue.status,
            priority: issue.priority,
            createdAt: issue.createdAt,
            createdBy: issue.createdBy ? issue.createdBy.fullName : "Unknown",
          })),
        };
      })
    );

    // Recalculate department totals if issues collection is empty but staff have metrics
    if (issues.length === 0) {
      // Sum up performance metrics from staff members
      totalIssues = staffList.reduce(
        (sum, staff) => sum + staff.performanceMetrics.totalIssues,
        0
      );
      solvedIssues = staffList.reduce(
        (sum, staff) => sum + staff.performanceMetrics.solvedIssues,
        0
      );
      unsolvedIssues = totalIssues - solvedIssues;

      console.log("Using staff performance metrics for department totals:", {
        totalIssues,
        solvedIssues,
        unsolvedIssues,
      });

      // Create placeholder issues for UI display based on staff performance metrics
      const placeholderIssues = [];

      staffList.forEach((staff) => {
        // Add placeholder solved issues
        for (let i = 0; i < staff.performanceMetrics.solvedIssues; i++) {
          placeholderIssues.push({
            _id: `placeholder-solved-${staff._id}-${i}`,
            title: `Example Solved Issue ${i + 1} for ${staff.fullName}`,
            description:
              "This is a placeholder issue created from staff performance metrics.",
            status: "solved",
            priority: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
            createdAt: new Date(
              Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
            ), // Random time in last week
            createdBy: {
              _id: "placeholder",
              fullName: "Student User",
              email: "student@example.com",
            },
            assignedTo: {
              _id: staff._id,
              fullName: staff.fullName,
              email: staff.email,
            },
            commentsCount: Math.floor(Math.random() * 5),
          });
        }

        // Add placeholder unsolved issues
        const staffUnsolvedIssues =
          staff.performanceMetrics.totalIssues -
          staff.performanceMetrics.solvedIssues;
        for (let i = 0; i < staffUnsolvedIssues; i++) {
          placeholderIssues.push({
            _id: `placeholder-unsolved-${staff._id}-${i}`,
            title: `Example Unsolved Issue ${i + 1} for ${staff.fullName}`,
            description:
              "This is a placeholder issue created from staff performance metrics.",
            status: "unsolved",
            priority: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
            createdAt: new Date(
              Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
            ), // Random time in last week
            createdBy: {
              _id: "placeholder",
              fullName: "Student User",
              email: "student@example.com",
            },
            assignedTo: {
              _id: staff._id,
              fullName: staff.fullName,
              email: staff.email,
            },
            commentsCount: Math.floor(Math.random() * 3),
          });
        }
      });

      // Add placeholders to the response
      const response = {
        totalStaff: staffMembers.length,
        totalIssues,
        solvedIssues,
        unsolvedIssues,
        pretendingIssues,
        performanceHistory,
        staffList,
        detailedIssues: placeholderIssues,
      };

      console.log(
        "Sending department stats response with placeholder issues:",
        {
          totalStaff: response.totalStaff,
          totalIssues: response.totalIssues,
          placeholderIssuesCount: placeholderIssues.length,
        }
      );

      res.json(response);
      return;
    } else {
      // Calculate total issues stats from the issues collection
      totalIssues = issues.length;
      solvedIssues = issues.filter((issue) => issue.status === "solved").length;
      unsolvedIssues = issues.filter(
        (issue) => issue.status === "unsolved"
      ).length;
      pretendingIssues = issues.filter(
        (issue) => issue.status === "pretending"
      ).length;
    }

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
          department: departmentName,
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

    // Sort staff list by performance percentage in descending order
    staffList.sort(
      (a, b) =>
        b.performanceMetrics.percentage - a.performanceMetrics.percentage
    );

    const response = {
      totalStaff: staffMembers.length,
      totalIssues,
      solvedIssues,
      unsolvedIssues,
      pretendingIssues,
      performanceHistory,
      staffList,
      detailedIssues: issues.map((issue) => ({
        _id: issue._id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        createdAt: issue.createdAt,
        createdBy: issue.createdBy
          ? {
              _id: issue.createdBy._id,
              fullName: issue.createdBy.fullName,
              email: issue.createdBy.email,
            }
          : null,
        assignedTo: issue.assignedTo
          ? {
              _id: issue.assignedTo._id,
              fullName: issue.assignedTo.fullName,
              email: issue.assignedTo.email,
            }
          : null,
        commentsCount: issue.comments?.length || 0,
      })),
    };

    console.log("Department stats details:", {
      department: departmentName,
      totalStaff: staffMembers.length,
      staffMembers: staffMembers.map((s) => ({
        id: s._id,
        name: s.fullName,
        department: s.department,
      })),
      totalIssues,
      issues: issues.map((i) => ({
        id: i._id,
        status: i.status,
        department: i.department,
        assignedTo: i.assignedTo,
      })),
    });

    console.log("Sending department stats response:", response);
    res.json(response);
  } catch (error) {
    console.error("Error in getDepartmentStats:", error);
    res.status(500).json({ message: "Error fetching department statistics" });
  }
};
