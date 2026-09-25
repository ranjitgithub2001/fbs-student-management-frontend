import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Clock } from "lucide-react";

export function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { showWarning, logout, resetTimers,clearTimers } = useAuth();
  const navigate = useNavigate();

  function handleStayLoggedIn() {
    resetTimers();
  }

  function handleLogoutNow() {
    clearTimers();
    logout();
    navigate("/login");
  }

  return (
    <div className="flex bg-fbs-dark min-h-screen text-white">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="flex-1 p-6 overflow-auto">{children ?? <Outlet />}</main>

      {/* Inactivity Warning Toast */}
      {showWarning && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-6 right-6 z-50 bg-fbs-darker border border-fbs-yellow/50 rounded-2xl p-5 shadow-xl max-w-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 bg-fbs-yellow/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-fbs-yellow" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">
                Session Expiring Soon
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                You'll be automatically logged out in{" "}
                <span className="text-fbs-yellow font-semibold">5 minutes</span>{" "}
                due to inactivity.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleStayLoggedIn}
              className="flex-1 py-2 bg-fbs-green hover:bg-fbs-yellow text-black text-xs font-semibold rounded-lg transition">
              Stay Logged In
            </button>
            <button
              onClick={handleLogoutNow}
              className="flex items-center gap-1.5 px-3 py-2 border border-fbs-border text-gray-400 hover:text-white text-xs rounded-lg transition">
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;
