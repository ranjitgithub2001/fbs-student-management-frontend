import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext(null);

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
const WARNING_AT =  25 * 60 * 1000;        // warn at 25 minutes

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [showWarning, setShowWarning] = useState(false);

  const logoutTimer = useRef(null);
  const warningTimer = useRef(null);

  function login(token, userData) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowWarning(false);
    clearTimers();
  }

  function clearTimers() {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
  }

  const resetTimers = useCallback(() => {
    if (!user) return;
    setShowWarning(false);
    clearTimers();

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
    }, WARNING_AT);

    logoutTimer.current = setTimeout(() => {
      logout();
      window.location.href = '/login';
    }, INACTIVITY_LIMIT);
  }, [user]);

  // Start timers when user logs in
  useEffect(() => {
    if (!user) { clearTimers(); return; }
    resetTimers();
    return () => clearTimers();
  }, [user]);

  // Track user activity
  useEffect(() => {
    if (!user) return;
    const events = [ 'mousedown', 'keypress', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimers));
    return () => events.forEach(e => window.removeEventListener(e, resetTimers));
  }, [user, resetTimers]);

  function isAdmin() { return user?.role === 'ADMIN'; }
  function isReadOnly() { return user?.role !== 'ADMIN'; }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isReadOnly, showWarning, resetTimers,clearTimers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  // return true
  return useContext(AuthContext);
}