import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  GraduationCap,
  Layers,
  Users,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Link2
} from "lucide-react";

const ADMIN_NAV = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Students", path: "/students", icon: GraduationCap },
      { label: "Batches", path: "/batches", icon: Layers },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Access Requests", path: "/access-requests", icon: ClipboardList },
      { label: "Users", path: "/users", icon: Users },
      { label: "Admission Forms", path: "/admission-forms", icon: Link2 },
      { label: "Admission Requests", path: "/admission-requests", icon: ClipboardList },
    ],
  },
];

// All non-admin roles see the same read-only nav
const READ_ONLY_NAV = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Students", path: "/students", icon: GraduationCap },
      { label: "Batches", path: "/batches", icon: Layers },
    ],
  },
];

// Role display labels
const ROLE_LABELS = {
  ADMIN: "Admin",
  TRAINER: "Trainer",
  PLACEMENT: "Placement",
  OFFICE_STAFF: "Office Staff",
  VIEWER: "Viewer",
};

export function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navSections = user?.role === "ADMIN" ? ADMIN_NAV : READ_ONLY_NAV;

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "FB";

  function handleSignOut() {
    logout();
    navigate("/login");
  }

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-52"} h-screen bg-fbs-darker text-white flex flex-col justify-between transition-all duration-300 overflow-hidden flex-shrink-0`}>
      <div>
        <div className={`${collapsed ? "px-2" : "px-5"} pt-6 pb-4`}>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-fbs-card rounded-xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-fbs-green" />
            </div>
            {!collapsed && (
              <div>
                <div className="text-sm font-semibold font-heading">FBS</div>
                <div className="text-xs text-gray-400">Student Management</div>
              </div>
            )}
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full h-9 flex items-center justify-center rounded-lg bg-fbs-card hover:bg-fbs-border transition mb-5">
            <Menu className="w-4 h-4" />
          </button>

          {/* Nav */}
          {navSections.map((sec) => (
            <div key={sec.label} className="mb-4">
              {!collapsed && (
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2 px-1">
                  {sec.label}
                </div>
              )}
              <nav className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end
                      className={({ isActive }) =>
                        `flex items-center ${collapsed ? "justify-center px-0" : "gap-3 px-3"} py-2 rounded-lg text-sm transition-all duration-200 ${
                          isActive
                            ? "bg-fbs-green text-black font-semibold"
                            : "text-white hover:bg-fbs-card"
                        }`
                      }>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* User + Signout */}
      <div className={`${collapsed ? "px-2" : "px-5"} pb-6`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} mb-3`}>
          <div className="w-9 h-9 bg-fbs-green rounded-full flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{user?.fullName ?? "User"}</div>
              <div className="text-xs text-gray-400">
                {ROLE_LABELS[user?.role] ?? user?.role}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className={`w-full text-sm border border-fbs-border rounded-lg py-2 hover:bg-fbs-card transition flex items-center gap-2 ${collapsed ? "justify-center px-0" : "px-3"}`}>
          <LogOut className="w-4 h-4" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;