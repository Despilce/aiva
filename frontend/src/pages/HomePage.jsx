import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import ManagerDashboard from "../components/ManagerDashboard";
import { LayoutDashboard } from "lucide-react";

const HomePage = () => {
  const { authUser } = useAuthStore();
  const { selectedUser, isMobileView } = useChatStore();
  const [showDashboard, setShowDashboard] = useState(() => {
    const saved = localStorage.getItem("showDashboard");
    return saved ? JSON.parse(saved) : false;
  });
  const isManager = authUser?.userType === "manager";

  useEffect(() => {
    localStorage.setItem("showDashboard", JSON.stringify(showDashboard));
  }, [showDashboard]);

  useEffect(() => {
    console.log("Current user:", {
      user: authUser,
      userType: authUser?.userType,
      department: authUser?.department,
      isManager,
    });
  }, [authUser, isManager]);

  // Reset dashboard view if user is not a manager
  useEffect(() => {
    if (!isManager) {
      setShowDashboard(false);
    }
  }, [isManager]);

  return (
    <div className="h-screen bg-base-200">
      <div className="relative">
        {showDashboard ? (
          <ManagerDashboard />
        ) : (
          <div className="flex items-center justify-center pt-20 px-4">
            <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-7xl h-[calc(100vh-6rem)]">
              <div className="flex h-full rounded-lg overflow-hidden">
                <Sidebar />
                {!isMobileView && !selectedUser && <NoChatSelected />}
                {selectedUser && <ChatContainer />}
              </div>
            </div>
          </div>
        )}

        {isManager && (
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className="fixed bottom-6 right-6 btn btn-circle btn-primary"
            title={showDashboard ? "Close Dashboard" : "Open Dashboard"}
          >
            <LayoutDashboard className="size-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default HomePage;
