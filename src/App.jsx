import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import RequestAccessPage from "./pages/RequestAccessPage";
import StudentsPage from "./pages/students/StudentsPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import BatchesPage from "./pages/batches/BatchesPage";
import AccessRequestsPage from "./pages/AccessRequestsPage";
import UsersPage from "./pages/UsersPage";
import AdmissionFormPage from "./pages/admission/AdmissionFormPage";
import AdmissionRequestsPage from "./pages/admission/AdmissionRequestsPage";
import AdmissionFormsPage from "./pages/admission/AdmissionFormsPage";

// All roles that have read-only access to student management
const READ_ONLY_ROLES = ["ADMIN", "VIEWER", "TRAINER", "PLACEMENT", "OFFICE_STAFF"];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/request-access" element={<RequestAccessPage />} />
          <Route path="/admission" element={<AdmissionFormPage />} />

          <Route path="/dashboard" element={
            <PrivateRoute allowedRoles={READ_ONLY_ROLES}>
              <DashboardPage />
            </PrivateRoute>
          } />
          <Route path="/students" element={
            <PrivateRoute allowedRoles={READ_ONLY_ROLES}>
              <StudentsPage />
            </PrivateRoute>
          } />
          <Route path="/batches" element={
            <PrivateRoute allowedRoles={READ_ONLY_ROLES}>
              <BatchesPage />
            </PrivateRoute>
          } />

          {/* Admin only */}
          <Route path="/access-requests" element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AccessRequestsPage />
            </PrivateRoute>
          } />
          <Route path="/admission-requests" element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdmissionRequestsPage />
            </PrivateRoute>
          } />
          <Route path="/admission-forms" element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdmissionFormsPage />
            </PrivateRoute>
          } />
          <Route path="/users" element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <UsersPage />
            </PrivateRoute>
          } />

          {/* Always last */}
          <Route path="*" element={<Navigate to="/students" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}