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

const ManagerDashboard = () => {
  const { authUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [departmentStats, setDepartmentStats] = useState({
    totalStaff: 0,
    totalIssues: 0,
    solvedIssues: 0,
    unsolvedIssues: 0,
    pretendingIssues: 0,
    performanceHistory: [],
    staffList: [],
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

        const response = await axiosInstance.get(
          `/stats/department/${encodedDepartment}`
        );
        console.log("Department stats response:", response.data);
        setDepartmentStats(response.data);
      } catch (error) {
        console.error("Error fetching department stats:", error);
        console.error("Error details:", {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });
        toast.error(
          error.response?.data?.message || "Failed to load dashboard data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser?.department) {
      fetchDepartmentStats();
      // Fetch stats every 30 seconds
      const interval = setInterval(fetchDepartmentStats, 30000);
      return () => clearInterval(interval);
    }
  }, [authUser?.department]);

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
        <h1 className="text-2xl font-bold mb-6">
          {authUser?.department} Dashboard
        </h1>

        {/* Department Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="stat bg-base-100 rounded-lg p-4 shadow-md">
            <div className="stat-title text-xs md:text-sm">Total Staff</div>
            <div className="stat-value text-lg md:text-2xl">
              {departmentStats.totalStaff}
            </div>
          </div>
          <div className="stat bg-base-100 rounded-lg p-4 shadow-md">
            <div className="stat-title text-xs md:text-sm">Total Issues</div>
            <div className="stat-value text-lg md:text-2xl">
              {departmentStats.totalIssues}
            </div>
          </div>
          <div className="stat bg-base-100 rounded-lg p-4 shadow-md">
            <div className="stat-title text-xs md:text-sm">Solved Issues</div>
            <div className="stat-value text-lg md:text-2xl text-success">
              {departmentStats.solvedIssues}
            </div>
          </div>
          <div className="stat bg-base-100 rounded-lg p-4 shadow-md">
            <div className="stat-title text-xs md:text-sm">Unsolved Issues</div>
            <div className="stat-value text-lg md:text-2xl text-error">
              {departmentStats.unsolvedIssues}
            </div>
          </div>
          <div className="stat bg-base-100 rounded-lg p-4 shadow-md">
            <div className="stat-title text-xs md:text-sm">
              Pretending Issues
            </div>
            <div className="stat-value text-lg md:text-2xl text-warning">
              {departmentStats.pretendingIssues}
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No staff members found in this department
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
