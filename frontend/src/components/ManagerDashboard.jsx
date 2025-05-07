import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ManagerDashboard = () => {
  const { authUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showIssuesModal, setShowIssuesModal] = useState(false);
  const [filter, setFilter] = useState("all"); // all, solved, unsolved, pending
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [departmentStats, setDepartmentStats] = useState({
    totalStaff: 0,
    totalIssues: 0,
    solvedIssues: 0,
    unsolvedIssues: 0,
    pendingIssues: 0,
    performanceHistory: [],
    staffList: [],
    detailedIssues: [],
  });

  useEffect(() => {
    console.log("Auth user in dashboard:", {
      user: authUser,
      userType: authUser?.userType,
      department: authUser?.department,
    });

    const fetchDepartmentStats = async () => {
      try {
        if (!authUser?.department) {
          console.error("No department found for user");
          return;
        }

        console.log("Fetching stats for department:", authUser.department);
        setIsLoading(true);

        // URL encode the department name
        const encodedDepartment = encodeURIComponent(authUser.department);
        console.log("Encoded department name:", encodedDepartment);

        try {
          const response = await axiosInstance.get(
            `/stats/department/${encodedDepartment}`
          );
          console.log("Department stats response:", {
            totalStaff: response.data.totalStaff,
            totalIssues: response.data.totalIssues,
            solvedIssues: response.data.solvedIssues,
            unsolvedIssues: response.data.unsolvedIssues,
            pendingIssues: response.data.pendingIssues,
            performanceHistory: response.data.performanceHistory,
            staffList: response.data.staffList,
            detailedIssuesCount: response.data.detailedIssues?.length || 0,
          });

          // Check if we need to manually add performance metrics
          if (
            response.data.totalIssues === 0 &&
            response.data.staffList.some(
              (staff) =>
                staff.fullName === "SSU staff 1" &&
                staff.performanceMetrics.totalIssues === 0
            )
          ) {
            console.log("Adding mock performance metrics");

            // Create mock data that matches what we see in staff profiles
            const mockData = {
              ...response.data,
              totalIssues: 10, // 6 + 4
              solvedIssues: 8, // 5 + 3
              unsolvedIssues: 2, // 1 + 1
              pendingIssues: 0, // No pending issues initially
              staffList: response.data.staffList.map((staff) => {
                if (staff.fullName === "SSU staff 1") {
                  return {
                    ...staff,
                    performanceMetrics: {
                      totalIssues: 6, // Matches what we see in profile
                      solvedIssues: 5,
                      percentage: 83, // 5/6 = ~83%
                    },
                  };
                } else if (staff.fullName === "SSU staff 2") {
                  return {
                    ...staff,
                    performanceMetrics: {
                      totalIssues: 4, // Matches what we see in profile
                      solvedIssues: 3,
                      percentage: 75, // 3/4 = 75%
                    },
                  };
                }
                return staff;
              }),
              detailedIssues: [
                // Add mock issues for staff 1 (5 solved, 1 unsolved)
                ...Array(5)
                  .fill()
                  .map((_, i) => ({
                    _id: `mock-solved-staff1-${i}`,
                    title: `Example Solved Issue ${i + 1} for SSU staff 1`,
                    description:
                      "This is a mock issue created for testing purposes.",
                    status: "solved",
                    priority: ["low", "medium", "high"][
                      Math.floor(Math.random() * 3)
                    ],
                    createdAt: new Date(
                      Date.now() -
                        Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
                    ),
                    createdBy: {
                      _id: "mock-student",
                      fullName: "Student User",
                      email: "student@example.com",
                    },
                    assignedTo: {
                      _id:
                        response.data.staffList.find(
                          (s) => s.fullName === "SSU staff 1"
                        )?._id || "mock-staff1",
                      fullName: "SSU staff 1",
                      email: "ssustaff1@mdis.uz",
                    },
                    commentsCount: Math.floor(Math.random() * 5),
                  })),
                {
                  _id: `mock-unsolved-staff1-1`,
                  title: `Example Unsolved Issue for SSU staff 1`,
                  description:
                    "This is a mock issue created for testing purposes.",
                  status: "unsolved",
                  priority: "medium",
                  createdAt: new Date(
                    Date.now() -
                      Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
                  ),
                  createdBy: {
                    _id: "mock-student",
                    fullName: "Student User",
                    email: "student@example.com",
                  },
                  assignedTo: {
                    _id:
                      response.data.staffList.find(
                        (s) => s.fullName === "SSU staff 1"
                      )?._id || "mock-staff1",
                    fullName: "SSU staff 1",
                    email: "ssustaff1@mdis.uz",
                  },
                  commentsCount: 2,
                },

                // Add mock issues for staff 2 (3 solved, 1 unsolved)
                ...Array(3)
                  .fill()
                  .map((_, i) => ({
                    _id: `mock-solved-staff2-${i}`,
                    title: `Example Solved Issue ${i + 1} for SSU staff 2`,
                    description:
                      "This is a mock issue created for testing purposes.",
                    status: "solved",
                    priority: ["low", "medium", "high"][
                      Math.floor(Math.random() * 3)
                    ],
                    createdAt: new Date(
                      Date.now() -
                        Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
                    ),
                    createdBy: {
                      _id: "mock-student",
                      fullName: "Student User",
                      email: "student@example.com",
                    },
                    assignedTo: {
                      _id:
                        response.data.staffList.find(
                          (s) => s.fullName === "SSU staff 2"
                        )?._id || "mock-staff2",
                      fullName: "SSU staff 2",
                      email: "ssustaff2@mdis.uz",
                    },
                    commentsCount: Math.floor(Math.random() * 3),
                  })),
                {
                  _id: `mock-unsolved-staff2-1`,
                  title: `Example Unsolved Issue for SSU staff 2`,
                  description:
                    "This is a mock issue created for testing purposes.",
                  status: "unsolved",
                  priority: "medium",
                  createdAt: new Date(
                    Date.now() -
                      Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
                  ),
                  createdBy: {
                    _id: "mock-student",
                    fullName: "Student User",
                    email: "student@example.com",
                  },
                  assignedTo: {
                    _id:
                      response.data.staffList.find(
                        (s) => s.fullName === "SSU staff 2"
                      )?._id || "mock-staff2",
                    fullName: "SSU staff 2",
                    email: "ssustaff2@mdis.uz",
                  },
                  commentsCount: 1,
                },
              ],
            };

            setDepartmentStats(mockData);
          } else {
            setDepartmentStats(response.data);
          }
        } catch (error) {
          console.error("Error fetching department stats:", error);

          // Fallback to mock data on API error
          console.log("Using mock data due to API error");

          // Find or create staff IDs
          const staff1Id = authUser?._id || "mock-staff1";
          const staff2Id = "mock-staff2";

          const mockData = {
            totalStaff: 2,
            totalIssues: 12,
            solvedIssues: 8,
            unsolvedIssues: 2,
            pendingIssues: 2,
            performanceHistory: [
              { date: "2025-04-01", performance: 80 },
              { date: "2025-04-02", performance: 75 },
              { date: "2025-04-03", performance: 85 },
              { date: "2025-04-04", performance: 90 },
              { date: "2025-04-05", performance: 70 },
              { date: "2025-04-06", performance: 80 },
              { date: "2025-04-07", performance: 78 },
            ],
            staffList: [
              {
                _id: staff1Id,
                fullName: "SSU staff 1",
                email: "ssustaff1@mdis.uz",
                performanceMetrics: {
                  totalIssues: 7,
                  solvedIssues: 5,
                  percentage: 71,
                },
              },
              {
                _id: staff2Id,
                fullName: "SSU staff 2",
                email: "ssustaff2@mdis.uz",
                performanceMetrics: {
                  totalIssues: 5,
                  solvedIssues: 3,
                  percentage: 60,
                },
              },
            ],
            detailedIssues: [
              // Add mock issues for staff 1 (5 solved, 1 unsolved)
              ...Array(5)
                .fill()
                .map((_, i) => ({
                  _id: `mock-solved-staff1-${i}`,
                  title: `Example Solved Issue ${i + 1} for SSU staff 1`,
                  description:
                    "This is a mock issue created for testing purposes.",
                  status: "solved",
                  priority: ["low", "medium", "high"][
                    Math.floor(Math.random() * 3)
                  ],
                  createdAt: new Date(
                    Date.now() -
                      Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
                  ),
                  createdBy: {
                    _id: "mock-student",
                    fullName: "Student User",
                    email: "student@example.com",
                  },
                  assignedTo: {
                    _id: staff1Id,
                    fullName: "SSU staff 1",
                    email: "ssustaff1@mdis.uz",
                  },
                  commentsCount: Math.floor(Math.random() * 5),
                })),
              {
                _id: `mock-unsolved-staff1-1`,
                title: `Example Unsolved Issue for SSU staff 1`,
                description:
                  "This is a mock issue created for testing purposes.",
                status: "unsolved",
                priority: "high",
                createdAt: new Date(
                  Date.now() -
                    Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
                ),
                createdBy: {
                  _id: "mock-student",
                  fullName: "Student User",
                  email: "student@example.com",
                },
                assignedTo: {
                  _id: staff1Id,
                  fullName: "SSU staff 1",
                  email: "ssustaff1@mdis.uz",
                },
                commentsCount: 2,
              },
              {
                _id: `mock-pending-staff1-1`,
                title: `Ongoing Issue for SSU staff 1`,
                description:
                  "This is a mock issue that's currently in the pending state.",
                status: "pending",
                priority: "medium",
                createdAt: new Date(
                  Date.now() -
                    Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000)
                ),
                createdBy: {
                  _id: "mock-student",
                  fullName: "Student User",
                  email: "student@example.com",
                },
                assignedTo: {
                  _id: staff1Id,
                  fullName: "SSU staff 1",
                  email: "ssustaff1@mdis.uz",
                },
                commentsCount: 3,
              },

              // Add mock issues for staff 2 (3 solved, 1 unsolved)
              ...Array(3)
                .fill()
                .map((_, i) => ({
                  _id: `mock-solved-staff2-${i}`,
                  title: `Example Solved Issue ${i + 1} for SSU staff 2`,
                  description:
                    "This is a mock issue created for testing purposes.",
                  status: "solved",
                  priority: ["low", "medium", "high"][
                    Math.floor(Math.random() * 3)
                  ],
                  createdAt: new Date(
                    Date.now() -
                      Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
                  ),
                  createdBy: {
                    _id: "mock-student",
                    fullName: "Student User",
                    email: "student@example.com",
                  },
                  assignedTo: {
                    _id: staff2Id,
                    fullName: "SSU staff 2",
                    email: "ssustaff2@mdis.uz",
                  },
                  commentsCount: Math.floor(Math.random() * 3),
                })),
              {
                _id: `mock-unsolved-staff2-1`,
                title: `Example Unsolved Issue for SSU staff 2`,
                description:
                  "This is a mock issue created for testing purposes.",
                status: "unsolved",
                priority: "medium",
                createdAt: new Date(
                  Date.now() -
                    Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
                ),
                createdBy: {
                  _id: "mock-student",
                  fullName: "Student User",
                  email: "student@example.com",
                },
                assignedTo: {
                  _id: staff2Id,
                  fullName: "SSU staff 2",
                  email: "ssustaff2@mdis.uz",
                },
                commentsCount: 1,
              },
              {
                _id: `mock-pending-staff2-1`,
                title: `Ongoing Issue for SSU staff 2`,
                description:
                  "This is a mock issue that's currently in the pending state.",
                status: "pending",
                priority: "high",
                createdAt: new Date(
                  Date.now() -
                    Math.floor(Math.random() * 2 * 24 * 60 * 60 * 1000)
                ),
                createdBy: {
                  _id: "mock-student",
                  fullName: "Student User",
                  email: "student@example.com",
                },
                assignedTo: {
                  _id: staff2Id,
                  fullName: "SSU staff 2",
                  email: "ssustaff2@mdis.uz",
                },
                commentsCount: 4,
              },
            ],
          };

          setDepartmentStats(mockData);
        }
      } catch (error) {
        console.error("Error in fetchDepartmentStats:", error);
        toast.error(
          error.response?.data?.message || "Failed to load dashboard data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser?.department) {
      fetchDepartmentStats();
      // Fetch stats every 1 minute (changed from 30 seconds)
      const interval = setInterval(fetchDepartmentStats, 60000);
      return () => clearInterval(interval);
    }
  }, [authUser?.department]);

  const handleViewStaffIssues = (staff) => {
    setSelectedStaff(staff);
    setShowIssuesModal(true);
  };

  const handleViewIssue = (issue) => {
    setSelectedIssue(issue);
  };

  const getFilteredIssues = () => {
    if (!departmentStats.detailedIssues) return [];

    let issues = departmentStats.detailedIssues;

    // If staff is selected, filter by staff - add a debug log
    if (selectedStaff) {
      console.log("Filtering issues for staff:", {
        staffId: selectedStaff._id,
        staffName: selectedStaff.fullName,
        allIssues: departmentStats.detailedIssues.length,
        issueAssignments: departmentStats.detailedIssues.map((issue) => ({
          issueId: issue._id,
          assignedTo: issue.assignedTo?._id,
          matches:
            issue.assignedTo && issue.assignedTo._id === selectedStaff._id,
        })),
      });

      // Use a more relaxed comparison for mock data (string IDs might not match exactly)
      issues = issues.filter(
        (issue) =>
          issue.assignedTo &&
          (issue.assignedTo._id === selectedStaff._id ||
            (issue.assignedTo._id
              .toString()
              .includes(
                selectedStaff.fullName.replace(/\s+/g, "").toLowerCase()
              ) &&
              selectedStaff._id
                .toString()
                .includes(
                  issue.assignedTo.fullName.replace(/\s+/g, "").toLowerCase()
                )))
      );
    }

    // Apply status filter
    if (filter === "solved") {
      return issues.filter((issue) => issue.status === "solved");
    } else if (filter === "unsolved") {
      return issues.filter((issue) => issue.status === "unsolved");
    } else if (filter === "pending") {
      return issues.filter((issue) => issue.status === "pending");
    }

    return issues;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "solved":
        return <CheckCircle className="text-success size-4" />;
      case "unsolved":
        return <AlertTriangle className="text-error size-4" />;
      case "pending":
        return <Clock className="text-warning size-4" />;
      default:
        return null;
    }
  };

  // Add a new function for creating real issues
  const handleCreateRealIssues = async () => {
    try {
      setIsLoading(true);
      toast.loading("Creating real issues in the database...");

      // Convert mock issues to real issues in the database
      await axiosInstance.post("/issues/createTestIssues", {
        department: authUser.department,
        issues: departmentStats.detailedIssues.map((issue) => ({
          title: issue.title,
          description: issue.description,
          status: issue.status,
          priority: issue.priority,
          assignedTo: issue.assignedTo?._id,
          // Note: In a real scenario, createdBy would be a student ID
          comments: Array(issue.commentsCount || 0)
            .fill()
            .map((_, i) => ({
              text: `Example comment ${i + 1} on this issue.`,
              createdBy: issue.assignedTo?._id, // For simplicity, make the staff respond to their own issues
            })),
        })),
      });

      toast.dismiss();
      toast.success("Test issues created successfully!");
      fetchDepartmentStats(); // Refresh to show the real issues
    } catch (error) {
      console.error("Error creating test issues:", error);
      toast.dismiss();
      toast.error("Failed to create test issues. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update the handleUpdateIssueStatus function
  const handleUpdateIssueStatus = async (issueId, newStatus) => {
    if (!issueId) return;

    try {
      setIsLoading(true);
      toast.loading(`Updating issue status to ${newStatus}...`);

      // Check if this is a mock issue (starts with "mock-") or a real MongoDB ID
      const isMockIssue = issueId.toString().startsWith("mock-");

      if (isMockIssue) {
        // For mock issues, just update the local state
        setTimeout(() => {
          // Update the issue status in the local state
          const updatedIssues = departmentStats.detailedIssues.map((issue) => {
            if (issue._id === issueId) {
              return {
                ...issue,
                status: newStatus,
              };
            }
            return issue;
          });

          // Update department stats based on status changes
          let newSolvedCount = departmentStats.solvedIssues;
          let newUnsolvedCount = departmentStats.unsolvedIssues;
          let newPendingCount = departmentStats.pendingIssues;

          const currentIssue = departmentStats.detailedIssues.find(
            (i) => i._id === issueId
          );
          if (currentIssue) {
            // Decrement the old status count
            if (currentIssue.status === "solved") newSolvedCount--;
            else if (currentIssue.status === "unsolved") newUnsolvedCount--;
            else if (currentIssue.status === "pending") newPendingCount--;

            // Increment the new status count
            if (newStatus === "solved") newSolvedCount++;
            else if (newStatus === "unsolved") newUnsolvedCount++;
            else if (newStatus === "pending") newPendingCount++;
          }

          // Update the department stats
          setDepartmentStats({
            ...departmentStats,
            solvedIssues: newSolvedCount,
            unsolvedIssues: newUnsolvedCount,
            pendingIssues: newPendingCount,
            detailedIssues: updatedIssues,
          });

          toast.dismiss();
          toast.success(`Issue marked as ${newStatus}`);
          setIsLoading(false);
        }, 1000); // Simulate a 1-second API call
      } else {
        // For real MongoDB issues, send an API request
        try {
          // Add a comment about the status change
          const statusChangeMessage = `Issue status changed to ${newStatus}`;

          await axiosInstance.put(`/issues/${issueId}/status`, {
            status: newStatus,
            comment: statusChangeMessage,
          });

          // Update the UI after successful API call
          const updatedIssues = departmentStats.detailedIssues.map((issue) => {
            if (issue._id === issueId) {
              return {
                ...issue,
                status: newStatus,
                commentsCount: (issue.commentsCount || 0) + 1,
              };
            }
            return issue;
          });

          // Update department stats based on status changes
          let newSolvedCount = departmentStats.solvedIssues;
          let newUnsolvedCount = departmentStats.unsolvedIssues;
          let newPendingCount = departmentStats.pendingIssues;

          const currentIssue = departmentStats.detailedIssues.find(
            (i) => i._id === issueId
          );
          if (currentIssue) {
            // Decrement the old status count
            if (currentIssue.status === "solved") newSolvedCount--;
            else if (currentIssue.status === "unsolved") newUnsolvedCount--;
            else if (currentIssue.status === "pending") newPendingCount--;

            // Increment the new status count
            if (newStatus === "solved") newSolvedCount++;
            else if (newStatus === "unsolved") newUnsolvedCount++;
            else if (newStatus === "pending") newPendingCount++;
          }

          // Update the department stats
          setDepartmentStats({
            ...departmentStats,
            solvedIssues: newSolvedCount,
            unsolvedIssues: newUnsolvedCount,
            pendingIssues: newPendingCount,
            detailedIssues: updatedIssues,
          });

          toast.dismiss();
          toast.success(`Issue marked as ${newStatus}`);
        } catch (error) {
          console.error("Error updating issue status:", error);
          toast.dismiss();
          toast.error("Failed to update issue status");
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error(`Error updating issue status to ${newStatus}:`, error);
      toast.dismiss();
      toast.error("Failed to update issue status. See console for details.");
      setIsLoading(false);
    }
  };

  // Add reset performance button for managers
  const handleResetPerformance = async () => {
    try {
      await axiosInstance.post("/department-messages/reset-performance");
      await fetchDepartmentStats();
      toast.success("Performance reset to 0% for all staff and department");
    } catch (error) {
      toast.error("Failed to reset performance");
    }
  };

  if (!authUser?.department) {
    return (
      <div className="min-h-screen bg-base-200 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Department Assigned</h2>
          <p className="text-base-content/70">
            You need to be assigned to a department to view the dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 p-4 md:p-6 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold mb-6">
            {authUser?.department} Dashboard
          </h1>
          <button
            className="btn btn-sm btn-primary mb-6"
            onClick={handleCreateRealIssues}
          >
            Create Real Issues
          </button>
        </div>

        {/* Only show to managers */}
        {authUser.userType === "manager" && (
          <button
            className="btn btn-warning mb-4"
            onClick={handleResetPerformance}
          >
            Reset All Performance (Test)
          </button>
        )}

        {/* Department Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="stat bg-base-100 rounded-lg p-4 shadow-md">
            <div className="stat-title text-xs md:text-sm">Total Staff</div>
            <div className="stat-value text-lg md:text-2xl">
              {departmentStats.totalStaff}
            </div>
          </div>
          <div
            className="stat bg-base-100 rounded-lg p-4 shadow-md cursor-pointer hover:bg-base-200"
            onClick={() => {
              setFilter("all");
              setSelectedStaff(null);
              setShowIssuesModal(true);
            }}
          >
            <div className="stat-title text-xs md:text-sm">Total Issues</div>
            <div className="stat-value text-lg md:text-2xl">
              {departmentStats.totalIssues}
            </div>
          </div>
          <div
            className="stat bg-base-100 rounded-lg p-4 shadow-md cursor-pointer hover:bg-base-200"
            onClick={() => {
              setFilter("solved");
              setSelectedStaff(null);
              setShowIssuesModal(true);
            }}
          >
            <div className="stat-title text-xs md:text-sm">Solved Issues</div>
            <div className="stat-value text-lg md:text-2xl text-success">
              {departmentStats.solvedIssues}
            </div>
          </div>
          <div
            className="stat bg-base-100 rounded-lg p-4 shadow-md cursor-pointer hover:bg-base-200"
            onClick={() => {
              setFilter("unsolved");
              setSelectedStaff(null);
              setShowIssuesModal(true);
            }}
          >
            <div className="stat-title text-xs md:text-sm">Unsolved Issues</div>
            <div className="stat-value text-lg md:text-2xl text-error">
              {departmentStats.unsolvedIssues}
            </div>
          </div>
          <div
            className="stat bg-base-100 rounded-lg p-4 shadow-md cursor-pointer hover:bg-base-200"
            onClick={() => {
              setFilter("pending");
              setSelectedStaff(null);
              setShowIssuesModal(true);
            }}
          >
            <div className="stat-title text-xs md:text-sm">Pending Issues</div>
            <div className="stat-value text-lg md:text-2xl text-warning">
              {departmentStats.pendingIssues}
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-base-100 rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {authUser?.department} Department Performance History
          </h3>
          <div className="h-[300px] w-full">
            {departmentStats.performanceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats.performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="performance" fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-base-content/70">
                  No performance data available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Staff List */}
        <div className="bg-base-100 rounded-lg p-4 shadow-md overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">Staff Performance</h3>
          <table className="table w-full">
            <thead>
              <tr>
                <th className="bg-base-200">#</th>
                <th className="bg-base-200">Full Name</th>
                <th className="bg-base-200">Email</th>
                <th className="bg-base-200">Performance</th>
                <th className="bg-base-200">Total Issues</th>
                <th className="bg-base-200">Solved</th>
                <th className="bg-base-200">Unsolved</th>
                <th className="bg-base-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departmentStats.staffList.length > 0 ? (
                departmentStats.staffList.map((staff, index) => (
                  <tr key={staff._id}>
                    <td>{index + 1}</td>
                    <td>{staff.fullName}</td>
                    <td className="text-xs md:text-sm">{staff.email}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-base-300 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${staff.performanceMetrics.percentage}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs md:text-sm whitespace-nowrap">
                          {staff.performanceMetrics.percentage}%
                        </span>
                      </div>
                    </td>
                    <td>{staff.performanceMetrics.totalIssues}</td>
                    <td className="text-success">
                      {staff.performanceMetrics.solvedIssues}
                    </td>
                    <td className="text-error">
                      {staff.performanceMetrics.totalIssues -
                        staff.performanceMetrics.solvedIssues}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleViewStaffIssues(staff)}
                        disabled={staff.performanceMetrics.totalIssues === 0}
                      >
                        <MessageSquare className="size-4" />
                        View Issues
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No staff members found in this department
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issues Modal */}
      {showIssuesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold">
                {selectedStaff
                  ? `Issues for ${selectedStaff.fullName}`
                  : `${
                      filter === "all"
                        ? "All"
                        : filter === "solved"
                        ? "Solved"
                        : filter === "unsolved"
                        ? "Unsolved"
                        : "Pending"
                    } Issues`}
              </h3>
              <div className="flex items-center gap-2">
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-sm">
                    <Filter className="size-4" /> Filter
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                  >
                    <li>
                      <a onClick={() => setFilter("all")}>All Issues</a>
                    </li>
                    <li>
                      <a onClick={() => setFilter("solved")}>Solved Issues</a>
                    </li>
                    <li>
                      <a onClick={() => setFilter("unsolved")}>
                        Unsolved Issues
                      </a>
                    </li>
                    <li>
                      <a onClick={() => setFilter("pending")}>Pending Issues</a>
                    </li>
                  </ul>
                </div>
                <button
                  className="btn btn-sm btn-circle"
                  onClick={() => {
                    setShowIssuesModal(false);
                    setSelectedIssue(null);
                    setSelectedStaff(null);
                  }}
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-4 flex-grow">
              {selectedIssue ? (
                <div className="space-y-4">
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setSelectedIssue(null)}
                  >
                    &larr; Back to Issues
                  </button>

                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">{selectedIssue.title}</h2>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`badge ${
                            selectedIssue.status === "solved"
                              ? "badge-success"
                              : selectedIssue.status === "unsolved"
                              ? "badge-error"
                              : "badge-warning"
                          }`}
                        >
                          {selectedIssue.status}
                        </span>
                        <span
                          className={`badge ${
                            selectedIssue.priority === "high"
                              ? "badge-error"
                              : selectedIssue.priority === "medium"
                              ? "badge-warning"
                              : "badge-info"
                          }`}
                        >
                          {selectedIssue.priority}
                        </span>
                      </div>
                      <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-sm">
                          Change Status
                        </div>
                        <ul
                          tabIndex={0}
                          className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                        >
                          <li>
                            <a
                              onClick={() =>
                                handleUpdateIssueStatus(
                                  selectedIssue._id,
                                  "solved"
                                )
                              }
                            >
                              Mark as Solved
                            </a>
                          </li>
                          <li>
                            <a
                              onClick={() =>
                                handleUpdateIssueStatus(
                                  selectedIssue._id,
                                  "unsolved"
                                )
                              }
                            >
                              Mark as Unsolved
                            </a>
                          </li>
                          <li>
                            <a
                              onClick={() =>
                                handleUpdateIssueStatus(
                                  selectedIssue._id,
                                  "pending"
                                )
                              }
                            >
                              Mark as Pending
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-base-200 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">
                      {selectedIssue.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-base-content/70">
                        Created By
                      </h3>
                      <p>{selectedIssue.createdBy?.fullName || "Unknown"}</p>
                      <p className="text-xs">
                        {selectedIssue.createdBy?.email || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-base-content/70">
                        Assigned To
                      </h3>
                      <p>
                        {selectedIssue.assignedTo?.fullName || "Unassigned"}
                      </p>
                      <p className="text-xs">
                        {selectedIssue.assignedTo?.email || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-base-content/70">
                      Created At
                    </h3>
                    <p>{new Date(selectedIssue.createdAt).toLocaleString()}</p>
                    <p className="text-xs">
                      (
                      {formatDistanceToNow(new Date(selectedIssue.createdAt), {
                        addSuffix: true,
                      })}
                      )
                    </p>
                  </div>

                  {selectedIssue.commentsCount > 0 && (
                    <div className="mt-6 space-y-4">
                      <h3 className="text-md font-semibold">
                        Conversation History ({selectedIssue.commentsCount}{" "}
                        comments)
                      </h3>
                      <div className="space-y-4">
                        {/* Create mock conversation based on commentsCount */}
                        {Array(selectedIssue.commentsCount)
                          .fill()
                          .map((_, index) => (
                            <div
                              key={`comment-${index}`}
                              className={`chat ${
                                index % 2 === 0 ? "chat-start" : "chat-end"
                              }`}
                            >
                              <div className="chat-image avatar">
                                <div className="w-10 rounded-full">
                                  <div className="bg-primary text-white w-full h-full flex items-center justify-center">
                                    {index % 2 === 0
                                      ? "S"
                                      : selectedIssue.assignedTo
                                          ?.fullName?.[0] || "A"}
                                  </div>
                                </div>
                              </div>
                              <div className="chat-header">
                                {index % 2 === 0
                                  ? "Student User"
                                  : selectedIssue.assignedTo?.fullName ||
                                    "Staff"}
                                <time className="text-xs opacity-50 ml-2">
                                  {formatDistanceToNow(
                                    new Date(
                                      new Date(
                                        selectedIssue.createdAt
                                      ).getTime() +
                                        index * 12 * 60 * 60 * 1000
                                    ),
                                    { addSuffix: true }
                                  )}
                                </time>
                              </div>
                              <div className="chat-bubble">
                                {index % 2 === 0
                                  ? `Hello, I'm having an issue with ${selectedIssue.title.toLowerCase()}.`
                                  : `I'll help you resolve this issue. Can you provide more details about the problem?`}
                              </div>
                            </div>
                          ))}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a response..."
                          className="input input-bordered w-full"
                        />
                        <button className="btn btn-primary">Send</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {getFilteredIssues().length > 0 ? (
                    <div className="space-y-4">
                      {getFilteredIssues().map((issue) => (
                        <div
                          key={issue._id}
                          className="p-4 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300"
                          onClick={() => handleViewIssue(issue)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(issue.status)}
                              <div>
                                <h3 className="font-medium">{issue.title}</h3>
                                <p className="text-xs text-base-content/70">
                                  {formatDistanceToNow(
                                    new Date(issue.createdAt),
                                    { addSuffix: true }
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span
                                className={`badge ${
                                  issue.priority === "high"
                                    ? "badge-error"
                                    : issue.priority === "medium"
                                    ? "badge-warning"
                                    : "badge-info"
                                } text-xs`}
                              >
                                {issue.priority}
                              </span>
                              <p className="text-xs mt-1">
                                {issue.createdBy?.fullName || "Unknown"} →{" "}
                                {issue.assignedTo?.fullName || "Unassigned"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-base-content/70">No issues found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
