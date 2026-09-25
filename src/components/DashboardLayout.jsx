import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Clock, Menu, GraduationCap } from "lucide-react";

export function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showWarning, logout, resetTimers, clearTimers } = useAuth();
  const navigate = useNavigate();

  function handleStayLoggedIn() {
    resetTimers();
  }

  function handleLogoutNow() {
    clearTimers();
    logout();
    navigate("/login");
  }

  function closeMobileNav() {
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-fbs-dark text-white overflow-x-hidden">
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-fbs-darker border-b border-fbs-border flex items-center gap-3 px-4">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="h-10 w-10 flex items-center justify-center rounded-lg bg-fbs-card hover:bg-fbs-border transition"
          aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 bg-fbs-card rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-4 h-4 text-fbs-green" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">FBS</p>
          <p className="text-xs text-gray-400 truncate">Student Management</p>
        </div>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          aria-label="Close menu"
          onClick={closeMobileNav}
        />
      )}

      <div className="flex min-h-screen min-w-0">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          onClose={closeMobileNav}
        />
        <main className="flex-1 min-w-0 w-full overflow-x-hidden px-4 pt-16 pb-4 md:px-6 md:pb-6 lg:pt-6">
          {children ?? <Outlet />}
        </main>
      </div>

      {showWarning && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed z-[60] bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm bg-fbs-darker border border-fbs-yellow/50 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 bg-fbs-yellow/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-fbs-yellow" />
            </div>
            <div className="min-w-0">
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
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <button
              onClick={handleStayLoggedIn}
              className="flex-1 py-2.5 sm:py-2 bg-fbs-green hover:bg-fbs-yellow text-black text-xs font-semibold rounded-lg transition">
              Stay Logged In
            </button>
            <button
              onClick={handleLogoutNow}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 border border-fbs-border text-gray-400 hover:text-white text-xs rounded-lg transition">
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;
