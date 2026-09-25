import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import AddStudentModal from "./AddStudentModal";
import BulkUploadModal from "./BulkUploadModal";
import StudentDetailModal from "./StudentDetailModal";
import ResponsiveTable from "../../components/ResponsiveTable";
import { formatDate } from "../../utils/dateUtils";
import {
  Search,
  Plus,
  Upload,
  GraduationCap,
  ChevronDown,
  X,
  Loader2,
  Trash2,
  Pencil,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 9;

export default function StudentsPage() {
  const { user } = useAuth();

 
  const isAdmin = user?.role === "ADMIN";

  const [students, setStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); // DB pagination is 0-based
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchType, setSearchType] = useState("name");
  const [searchValue, setSearchValue] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [rollNumber, setRollNumber] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Export modal
  const [showExport, setShowExport] = useState(false);
  const [exportFilter, setExportFilter] = useState("current");
  const [exportBatchId, setExportBatchId] = useState("");
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    axiosInstance
      .get("/batches")
      .then((r) => setBatches(r.data))
      .catch(() => {});
    fetchStudents(0);
  }, []);


  const fetchStudents = useCallback(async (page = 0) => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(
        `/students/paginated?page=${page}&size=${PAGE_SIZE}`,
      );
      setStudents(res.data.students);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
      setCurrentPage(page);
    } catch {
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  const doSearch = useCallback(
    async (type, value, batch, roll) => {
      if (!value.trim() && !batch && !roll.trim()) {
        fetchStudents();
        return;
      }
      setLoading(true);
      setError("");
      try {
        let url = "/students/search?";
        if (type === "name" && value.trim())
          url += `name=${encodeURIComponent(value)}`;
        else if (type === "frn" && value.trim())
          url += `frn=${encodeURIComponent(value)}`;
        else if (type === "batch" && batch) {
          url += `batchCode=${encodeURIComponent(batch)}`;
          if (roll.trim()) url += `&rollNumber=${encodeURIComponent(roll)}`;
        } else {
          fetchStudents();
          return;
        }
        const res = await axiosInstance.get(url);
        setStudents(res.data);
        setTotalPages(0); // disable pagination during search
        setTotalElements(res.data.length);
        setCurrentPage(0);
      } catch {
        setError("Search failed");
      } finally {
        setLoading(false);
      }
    },
    [fetchStudents],
  );

  function triggerSearch(type, value, batch, roll) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => doSearch(type, value, batch, roll),
      400,
    );
  }

  function handleSearchValueChange(val) {
    setSearchValue(val);
    triggerSearch(searchType, val, selectedBatch, rollNumber);
  }
  function handleBatchChange(val) {
    setSelectedBatch(val);
    triggerSearch(searchType, searchValue, val, rollNumber);
  }
  function handleRollChange(val) {
    setRollNumber(val);
    triggerSearch(searchType, searchValue, selectedBatch, val);
  }
  function handleTypeChange(val) {
    setSearchType(val);
    setSearchValue("");
    setSelectedBatch("");
    setRollNumber("");
    fetchStudents();
  }
  function clearSearch() {
    setSearchValue("");
    setSelectedBatch("");
    setRollNumber("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchStudents(0);
  }

  async function handleDelete(id, frn) {
    if (!confirm(`Deactivate student ${frn}?`)) return;
    try {
      await axiosInstance.delete(`/students/${id}`);
      fetchStudents();
    } catch {
      alert("Failed to deactivate student");
    }
  }

  async function handleViewDetail(frn) {
    try {
      const res = await axiosInstance.get(
        `/students/frn?frn=${encodeURIComponent(frn)}`,
      );
      setSelectedStudent(res.data);
    } catch {
      alert("Failed to load student details");
    }
  }

  // ── CSV Export ────────────────────────────────────────────────────────────
  function generateCSV(data) {
    const headers = [
      "FRN",
      "Full Name",
      "Email",
      "Phone",
      "Date of Birth",
      "Batch Code",
      "Batch Name",
      "College",
      "College Location",
      "Current Year",
      "Graduation Year",
      "Instagram",
      "LinkedIn",
    ];
    const rows = data.map((s) => [
      s.frn || "",
      s.fullName || "",
      s.email || "",
      s.phone || "",
      s.dob ? formatDate(s.dob) : "",
      s.batchCode || "",
      s.batchName || "",
      s.collegeName || "",
      s.collegeLocation || "",
      s.currentYear || "",
      s.graduationYear || "",
      s.instagramId || "",
      s.linkedinId || "",
    ]);
    return [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
  }

  function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleExport() {
    setExportLoading(true);
    try {
      let data = [],
        filename = `students_${new Date().toISOString().split("T")[0]}.csv`;
      if (exportFilter === "current") {
        data = students;
        filename = `students_current_${new Date().toISOString().split("T")[0]}.csv`;
      } else if (exportFilter === "batch" && exportBatchId) {
        const batch = batches.find((b) => b.id === parseInt(exportBatchId));
        const res = await axiosInstance.get(
          `/students/search?batchCode=${batch.batchCode}`,
        );
        data = res.data;
        filename = `students_${batch.batchCode}_${new Date().toISOString().split("T")[0]}.csv`;
      } else if (exportFilter === "daterange") {
        const res = await axiosInstance.get("/students");
        data = res.data.filter((s) => {
          if (!s.createdAt) return true;
          const d = new Date(s.createdAt);
          const from = exportFromDate ? new Date(exportFromDate) : null;
          const to = exportToDate ? new Date(exportToDate) : null;
          if (from && d < from) return false;
          if (to && d > to) return false;
          return true;
        });
        filename = `students_${exportFromDate || "start"}_to_${exportToDate || "end"}.csv`;
      } else {
        const res = await axiosInstance.get("/students");
        data = res.data;
        filename = `students_all_${new Date().toISOString().split("T")[0]}.csv`;
      }
      if (data.length === 0) {
        alert("No students found");
        return;
      }
      downloadCSV(generateCSV(data), filename);
      setShowExport(false);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExportLoading(false);
    }
  }

  function StudentAvatar({ name, photoUrl }) {
    const initials = name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return (
      <div className="w-8 h-8 rounded-full overflow-hidden bg-fbs-card border border-fbs-border flex items-center justify-center flex-shrink-0">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-fbs-green font-semibold text-xs">
            {initials}
          </span>
        )}
      </div>
    );
  }

  
  
  const hasSearch = searchValue.trim() || selectedBatch || rollNumber.trim();

  return (
    
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-white">
              Students
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {totalElements} active students
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowExport(true)}
              disabled={students.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-fbs-card border border-fbs-border rounded-lg text-sm hover:bg-fbs-border transition disabled:opacity-40">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowBulk(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-fbs-card border border-fbs-border rounded-lg text-sm hover:bg-fbs-border transition">
                  <Upload className="w-4 h-4" /> Bulk Upload
                </button>
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-fbs-green hover:bg-fbs-yellow text-black font-semibold rounded-lg text-sm transition">
                  <Plus className="w-4 h-4" /> Add Student
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="bg-fbs-darker border border-fbs-border rounded-2xl p-4 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative">
              <select
                value={searchType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="appearance-none bg-fbs-dark border border-fbs-border rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-fbs-green cursor-pointer">
                <option value="name">By Name</option>
                <option value="frn">By FRN</option>
                <option value="batch">By Batch</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>

            {searchType !== "batch" && (
              <div className="relative flex-1 min-w-0 w-full sm:min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => handleSearchValueChange(e.target.value)}
                  placeholder={
                    searchType === "name"
                      ? "Type to search by name..."
                      : "Type FRN or last 3 digits..."
                  }
                  className="w-full bg-fbs-dark border border-fbs-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-fbs-green transition"
                />
              </div>
            )}

            {searchType === "batch" && (
              <>
                <div className="relative">
                  <select
                    value={selectedBatch}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    className="appearance-none bg-fbs-dark border border-fbs-border rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-fbs-green cursor-pointer w-full sm:min-w-48 max-w-full">
                    <option value="">Select batch...</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.batchCode}>
                        {b.batchName || b.batchCode}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
                <input
                  type="text"
                  maxLength={3}
                  value={rollNumber}
                  onChange={(e) => handleRollChange(e.target.value)}
                  placeholder="Roll no (optional)"
                  className="bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-fbs-green transition w-36"
                />
              </>
            )}

            {loading && (
              <Loader2 className="w-4 h-4 animate-spin text-fbs-green flex-shrink-0" />
            )}

            {hasSearch && (
              <button
                onClick={clearSearch}
                className="flex items-center gap-1 px-3 py-2 bg-fbs-card border border-fbs-border rounded-lg text-sm text-gray-400 hover:bg-fbs-border transition">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-fbs-darker border border-fbs-border rounded-2xl overflow-hidden">
          {loading && students.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-fbs-green" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No students found</p>
            </div>
          ) : (
            <>
              <ResponsiveTable>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-fbs-border">
                    <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3 w-12"></th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">
                      FRN
                    </th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">
                      Name
                    </th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">
                      Email
                    </th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">
                      Phone
                    </th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">
                      Batch
                    </th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr
                      key={s.id}
                      className={`border-b border-fbs-border/50 hover:bg-fbs-card/30 transition ${i % 2 === 0 ? "" : "bg-fbs-dark/20"}`}>
                      <td className="px-5 py-3">
                        <StudentAvatar
                          name={s.fullName}
                          photoUrl={s.photoUrl}
                        />
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-fbs-green">
                        {s.frn}
                      </td>
                      <td className="px-5 py-3 text-sm text-white font-medium">
                        {s.fullName}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-400">
                        {s.email || "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-400">
                        {s.phone}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-fbs-card border border-fbs-border px-2 py-1 rounded-full text-gray-300">
                          {s.batchName || s.batchCode}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetail(s.frn)}
                            className="text-xs text-fbs-green hover:text-fbs-yellow transition px-2 py-1 rounded border border-fbs-border hover:border-fbs-green">
                            View
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleViewDetail(s.frn)}
                                className="p-1.5 text-gray-400 hover:text-fbs-green transition rounded border border-fbs-border hover:border-fbs-green">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(s.id, s.frn)}
                                className="p-1.5 text-gray-400 hover:text-red-400 transition rounded border border-fbs-border hover:border-red-700">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </ResponsiveTable>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-4 border-t border-fbs-border">
                  <p className="text-xs text-gray-500">
                    Showing {currentPage * PAGE_SIZE + 1}–
                    {Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of{" "}
                    {totalElements} students
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => fetchStudents(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="p-1.5 rounded-lg border border-fbs-border text-gray-400 hover:text-fbs-green hover:border-fbs-green transition disabled:opacity-30 disabled:cursor-not-allowed">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - (currentPage + 1)) <= 2,
                      )
                      .reduce((acc, p, i, arr) => {
                        if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, i) =>
                        item === "..." ? (
                          <span
                            key={`dots-${i}`}
                            className="text-gray-600 px-1">
                            ...
                          </span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => fetchStudents(item - 1)}
                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition border ${
                              currentPage === item - 1
                                ? "bg-fbs-green text-black border-fbs-green"
                                : "border-fbs-border text-gray-400 hover:border-fbs-green hover:text-fbs-green"
                            }`}>
                            {item}
                          </button>
                        ),
                      )}
                    <button
                      onClick={() => fetchStudents(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="p-1.5 rounded-lg border border-fbs-border text-gray-400 hover:text-fbs-green hover:border-fbs-green transition disabled:opacity-30 disabled:cursor-not-allowed">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-fbs-darker border border-fbs-border rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-fbs-border">
              <div>
                <h2 className="font-heading text-xl font-bold">
                  Export Students
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  Choose what to export as CSV
                </p>
              </div>
              <button
                onClick={() => setShowExport(false)}
                className="p-2 hover:bg-fbs-card rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-3">
              {[
                {
                  value: "current",
                  label: "Current view",
                  desc: `Export ${students.length} students currently showing`,
                },
                {
                  value: "all",
                  label: "All students",
                  desc: "Export complete student database",
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                    exportFilter === opt.value
                      ? "border-fbs-green bg-fbs-green/5"
                      : "border-fbs-border hover:border-fbs-green/50"
                  }`}>
                  <input
                    type="radio"
                    name="exportFilter"
                    value={opt.value}
                    checked={exportFilter === opt.value}
                    onChange={() => setExportFilter(opt.value)}
                    className="mt-0.5 accent-fbs-green"
                  />
                  <div>
                    <p className="text-sm text-white font-medium">
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}

              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                  exportFilter === "batch"
                    ? "border-fbs-green bg-fbs-green/5"
                    : "border-fbs-border hover:border-fbs-green/50"
                }`}>
                <input
                  type="radio"
                  name="exportFilter"
                  value="batch"
                  checked={exportFilter === "batch"}
                  onChange={() => setExportFilter("batch")}
                  className="mt-0.5 accent-fbs-green"
                />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">By batch</p>
                  <p className="text-xs text-gray-500 mt-0.5 mb-2">
                    Export all students from a specific batch
                  </p>
                  {exportFilter === "batch" && (
                    <div className="relative">
                      <select
                        value={exportBatchId}
                        onChange={(e) => setExportBatchId(e.target.value)}
                        className="w-full appearance-none bg-fbs-dark border border-fbs-border rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-fbs-green">
                        <option value="">Select batch...</option>
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.batchName || b.batchCode}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                  exportFilter === "daterange"
                    ? "border-fbs-green bg-fbs-green/5"
                    : "border-fbs-border hover:border-fbs-green/50"
                }`}>
                <input
                  type="radio"
                  name="exportFilter"
                  value="daterange"
                  checked={exportFilter === "daterange"}
                  onChange={() => setExportFilter("daterange")}
                  className="mt-0.5 accent-fbs-green"
                />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">
                    By date range
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 mb-2">
                    Export students added within a date range
                  </p>
                  {exportFilter === "daterange" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">
                          From
                        </label>
                        <input
                          type="date"
                          value={exportFromDate}
                          onChange={(e) => setExportFromDate(e.target.value)}
                          className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-fbs-green"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">
                          To
                        </label>
                        <input
                          type="date"
                          value={exportToDate}
                          onChange={(e) => setExportToDate(e.target.value)}
                          className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-fbs-green"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowExport(false)}
                  className="flex-1 py-2.5 border border-fbs-border rounded-lg text-sm text-gray-400 hover:bg-fbs-card transition">
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={
                    exportLoading ||
                    (exportFilter === "batch" && !exportBatchId)
                  }
                  className="flex-1 py-2.5 bg-fbs-green hover:bg-fbs-yellow text-black font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {exportLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Download CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <AddStudentModal
          batches={batches}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            fetchStudents();
          }}
        />
      )}
      {showBulk && (
        <BulkUploadModal
          onClose={() => setShowBulk(false)}
          onSuccess={() => {
            setShowBulk(false);
            fetchStudents();
          }}
        />
      )}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          isAdmin={isAdmin}
          onClose={() => setSelectedStudent(null)}
          onUpdate={() => {
            setSelectedStudent(null);
            fetchStudents();
          }}
        />
      )}
    </DashboardLayout>
  );
}
