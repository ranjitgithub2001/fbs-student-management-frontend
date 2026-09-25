import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/dateUtils";
import ResponsiveTable from "../../components/ResponsiveTable";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Layers,
  X,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const COURSES = [
  { label: "Java", code: "J" },
  { label: "Python", code: "P" },
  { label: "React", code: "R" },
  { label: "Angular", code: "A" },
  { label: "Other", code: "" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function BatchesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [batches, setBatches] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 9 ;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchName, setSearchName] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editBatch, setEditBatch] = useState(null);

  const [createForm, setCreateForm] = useState({
    course: "",
    courseCode: "",
    customCourseCode: "",
    startMonth: "",
    startYear: new Date().getFullYear(),
    batchName: "",
    startDate: "",
    endDate: "",
    manualBatchCode: "", // ← new field for manual override,
    refundDate: "",
  });
  const [previewCode, setPreviewCode] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewName, setPreviewName] = useState("");

  const [editForm, setEditForm] = useState({
    batchName: "",
    course: "",
    startDate: "",
    endDate: "",
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches(page = 0) {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(
        `/batches/paginated?page=${page}&size=${PAGE_SIZE}`,
      );
      setBatches(res.data.batches);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
      setCurrentPage(page);
    } catch {
      setError("Failed to load batches");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Don't auto-preview if manual code is set
    if (createForm.manualBatchCode.trim()) {
      setPreviewCode(createForm.manualBatchCode.trim().toUpperCase());
      const courseName = createForm.course || createForm.courseCode;
      const monthName = createForm.startMonth
        ? MONTH_SHORT[parseInt(createForm.startMonth) - 1]
        : "";
      setPreviewName(
        monthName && courseName
          ? `${monthName} ${courseName} ${createForm.startYear}`
          : "",
      );
      return;
    }

    const code =
      createForm.courseCode === ""
        ? createForm.customCourseCode
        : createForm.courseCode;
    if (!code || !createForm.startMonth || !createForm.startYear) {
      setPreviewCode("");
      setPreviewName("");
      return;
    }
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await axiosInstance.get(
          `/batches/preview-code?courseCode=${code}&month=${createForm.startMonth}&year=${createForm.startYear}`,
        );
        setPreviewCode(res.data.batchCode);
        const courseName = createForm.course || code;
        const monthName = MONTH_SHORT[parseInt(createForm.startMonth) - 1];
        setPreviewName(`${monthName} ${courseName} ${createForm.startYear}`);
      } catch {
        setPreviewCode("");
      } finally {
        setPreviewLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [
    createForm.courseCode,
    createForm.customCourseCode,
    createForm.startMonth,
    createForm.startYear,
    createForm.course,
    createForm.manualBatchCode,
  ]);

  function openCreate() {
    setEditBatch(null);
    setCreateForm({
      course: "",
      courseCode: "",
      customCourseCode: "",
      startMonth: "",
      startYear: new Date().getFullYear(),
      batchName: "",
      startDate: "",
      endDate: "",
      manualBatchCode: "",
      refundDate: "",
    });
    setPreviewCode("");
    setPreviewName("");
    setFormError("");
    setSuccessMsg("");
    setShowModal(true);
  }

  function openEdit(batch) {
    setEditBatch(batch);
    setEditForm({
      batchName: batch.batchName || "",
      course: batch.course || "",
      startDate: batch.startDate || "",
      endDate: batch.endDate || "",
      refundDate: batch.refundDate || "",
    });
    setFormError("");
    setSuccessMsg("");
    setShowModal(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    const code =
      createForm.courseCode === ""
        ? createForm.customCourseCode
        : createForm.courseCode;
    if (!createForm.course.trim()) {
      setFormError("Course name is required");
      return;
    }
    if (!code.trim()) {
      setFormError("Course code is required");
      return;
    }
    if (!createForm.startMonth) {
      setFormError("Start month is required");
      return;
    }
    if (!createForm.startYear) {
      setFormError("Start year is required");
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      await axiosInstance.post("/batches", {
        course: createForm.course.trim(),
        courseCode: code.trim().toUpperCase(),
        startMonth: parseInt(createForm.startMonth),
        startYear: parseInt(createForm.startYear),
        batchName: createForm.batchName.trim() || previewName,
        startDate: createForm.startDate || null,
        endDate: createForm.endDate || null,
        // Send manual batch code if provided
        manualBatchCode:
          createForm.manualBatchCode.trim().toUpperCase() || null,
      });
      setSuccessMsg("Batch created successfully!");
      fetchBatches();
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg("");
      }, 1000);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create batch");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      await axiosInstance.put(`/batches/${editBatch.id}`, {
        batchName: editForm.batchName,
        course: editForm.course,
        startDate: editForm.startDate || null,
        endDate: editForm.endDate || null,
        refundDate: editForm.refundDate || null,
      });
      setSuccessMsg("Batch updated successfully!");
      fetchBatches();
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg("");
      }, 1000);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update batch");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(batch) {
    if (!confirm(`Delete batch "${batch.batchName || batch.batchCode}"?`))
      return;
    try {
      await axiosInstance.delete(`/batches/${batch.id}`);
      fetchBatches();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete batch");
    }
  }

  const courses = useMemo(() => {
    const set = new Set(batches.map((b) => b.course).filter(Boolean));
    return [...set].sort();
  }, [batches]);

  const years = useMemo(() => {
    const set = new Set(
      batches
        .map(
          (b) =>
            b.startYear?.toString() ||
            (b.startDate
              ? new Date(b.startDate).getFullYear().toString()
              : null),
        )
        .filter(Boolean),
    );
    return [...set].sort().reverse();
  }, [batches]);

  const filtered = useMemo(
    () =>
      batches.filter((b) => {
        const matchName =
          !searchName ||
          b.batchName?.toLowerCase().includes(searchName.toLowerCase()) ||
          b.batchCode?.toLowerCase().includes(searchName.toLowerCase());
        const matchCourse = !filterCourse || b.course === filterCourse;
        const matchYear = !filterYear || b.startYear?.toString() === filterYear;
        return matchName && matchCourse && matchYear;
      }),
    [batches, searchName, filterCourse, filterYear],
  );

  const hasFilters = searchName || filterCourse || filterYear;
  const selectedCourseIsOther = createForm.courseCode === "";
  const isManualCode = createForm.manualBatchCode.trim().length > 0;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-white">
              Batches
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {totalElements} batches
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-fbs-green hover:bg-fbs-yellow text-black font-semibold rounded-lg text-sm transition">
              <Plus className="w-4 h-4" /> New Batch
            </button>
          )}
        </div>

        <div className="bg-fbs-darker border border-fbs-border rounded-2xl p-4 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-0 w-full sm:min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search by batch name or code..."
                className="w-full bg-fbs-dark border border-fbs-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-fbs-green transition"
              />
            </div>
            <div className="relative">
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="appearance-none bg-fbs-dark border border-fbs-border rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-fbs-green cursor-pointer w-full sm:min-w-40 max-w-full">
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="appearance-none bg-fbs-dark border border-fbs-border rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-fbs-green cursor-pointer w-full sm:min-w-32 max-w-full">
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearchName("");
                  setFilterCourse("");
                  setFilterYear("");
                }}
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

        <div className="bg-fbs-darker border border-fbs-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-fbs-green" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {hasFilters
                  ? "No batches match your filters"
                  : "No batches yet"}
              </p>
              {!hasFilters && isAdmin && (
                <button
                  onClick={openCreate}
                  className="mt-3 text-fbs-green hover:text-fbs-yellow text-sm transition">
                  + Create first batch
                </button>
              )}
            </div>
          ) : (
            <>

            <ResponsiveTable>
            <table className="w-full">
              <thead>
                <tr className="border-b border-fbs-border">
                  {[
                    "Batch Code",
                    "Batch Name",
                    "Course",
                    "Start Date",
                    "Students",
                    ...(isAdmin ? ["Actions"] : []),
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => (
                  <tr
                    key={b.id}
                    className={`border-b border-fbs-border/50 hover:bg-fbs-card/30 transition ${i % 2 === 0 ? "" : "bg-fbs-dark/20"}`}>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-fbs-green">
                        {b.batchCode}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-white font-medium">
                      {b.batchName || (
                        <span className="text-gray-600 italic">Not set</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {b.course ? (
                        <span className="text-xs bg-fbs-card border border-fbs-border px-2 py-1 rounded-full text-gray-300">
                          {b.course}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">
                      {formatDate(b.startDate)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${
                          (b.studentCount ?? 0) > 0
                            ? "bg-fbs-green/10 border-fbs-green/30 text-fbs-green"
                            : "bg-fbs-card border-fbs-border text-gray-500"
                        }`}>
                        {b.studentCount ?? 0} students
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(b)}
                            className="p-1.5 text-gray-400 hover:text-fbs-green transition rounded border border-fbs-border hover:border-fbs-green">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(b)}
                            disabled={(b.studentCount ?? 0) > 0}
                            title={
                              (b.studentCount ?? 0) > 0
                                ? "Cannot delete — has students"
                                : "Delete batch"
                            }
                            className="p-1.5 text-gray-400 hover:text-red-400 transition rounded border border-fbs-border hover:border-red-700 disabled:opacity-30 disabled:cursor-not-allowed">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </ResponsiveTable>
            {totalPages > 1 && (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-4 border-t border-fbs-border">
    <p className="text-xs text-gray-500">
      Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of {totalElements} batches
    </p>
    <div className="flex items-center gap-1.5">
      <button onClick={() => fetchBatches(currentPage - 1)} disabled={currentPage === 0}
        className="p-1.5 rounded-lg border border-fbs-border text-gray-400 hover:text-fbs-green hover:border-fbs-green transition disabled:opacity-30 disabled:cursor-not-allowed">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i).map(p => (
        <button key={p} onClick={() => fetchBatches(p)}
          className={`w-8 h-8 rounded-lg text-xs font-semibold transition border ${
            currentPage === p
              ? 'bg-fbs-green text-black border-fbs-green'
              : 'border-fbs-border text-gray-400 hover:border-fbs-green hover:text-fbs-green'
          }`}>
          {p + 1}
        </button>
      ))}
      <button onClick={() => fetchBatches(currentPage + 1)} disabled={currentPage >= totalPages - 1}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-fbs-darker border border-fbs-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-fbs-border sticky top-0 bg-fbs-darker">
              <div>
                <h2 className="font-heading text-xl font-bold">
                  {editBatch ? "Edit Batch" : "New Batch"}
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  {editBatch
                    ? "Update batch details"
                    : "Batch code auto-generated or enter manually"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-fbs-card rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {formError && (
                <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
                  {formError}
                </div>
              )}
              {successMsg && (
                <div className="bg-green-900/30 border border-green-700 text-green-400 text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {successMsg}
                </div>
              )}

              {/* ── Create Form ── */}
              {!editBatch && (
                <form onSubmit={handleCreate} className="space-y-4">
                  {/* Course selection */}
                  <div>
                    <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                      Course *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                      {COURSES.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() =>
                            setCreateForm((f) => ({
                              ...f,
                              course: c.label === "Other" ? f.course : c.label,
                              courseCode: c.code,
                              customCourseCode: "",
                            }))
                          }
                          className={`py-2 rounded-lg text-xs font-semibold border transition ${
                            createForm.courseCode === c.code
                              ? "bg-fbs-green text-black border-fbs-green"
                              : "bg-fbs-dark border-fbs-border text-gray-400 hover:border-fbs-green"
                          }`}>
                          {c.label} {c.code && `(${c.code})`}
                        </button>
                      ))}
                    </div>
                    {selectedCourseIsOther && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        <input
                          value={createForm.course}
                          onChange={(e) =>
                            setCreateForm((f) => ({
                              ...f,
                              course: e.target.value,
                            }))
                          }
                          placeholder="Course name (e.g. Node.js)"
                          className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-fbs-green"
                        />
                        <input
                          value={createForm.customCourseCode}
                          onChange={(e) =>
                            setCreateForm((f) => ({
                              ...f,
                              customCourseCode: e.target.value
                                .toUpperCase()
                                .slice(0, 3),
                            }))
                          }
                          placeholder="Code (e.g. N)"
                          className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-fbs-green font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Month + Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                        Start Month *
                      </label>
                      <div className="relative">
                        <select
                          value={createForm.startMonth}
                          onChange={(e) =>
                            setCreateForm((f) => ({
                              ...f,
                              startMonth: e.target.value,
                            }))
                          }
                          className="w-full appearance-none bg-fbs-dark border border-fbs-border rounded-lg pl-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-fbs-green cursor-pointer">
                          <option value="">Month</option>
                          {MONTHS.map((m, i) => (
                            <option key={i + 1} value={i + 1}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                        Year *
                      </label>
                      <div className="relative">
                        <select
                          value={createForm.startYear}
                          onChange={(e) =>
                            setCreateForm((f) => ({
                              ...f,
                              startYear: e.target.value,
                            }))
                          }
                          className="w-full appearance-none bg-fbs-dark border border-fbs-border rounded-lg pl-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-fbs-green cursor-pointer">
                          {[2024, 2025, 2026, 2027, 2028].map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* ── Manual batch code override ── */}
                  <div>
                    <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                      Batch Code Override{" "}
                      <span className="text-gray-600 font-normal normal-case">
                        (optional — for importing old data)
                      </span>
                    </label>
                    <input
                      value={createForm.manualBatchCode}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          manualBatchCode: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="e.g. 23J1225 — leave blank to auto-generate"
                      className={`w-full bg-fbs-dark border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none transition font-mono ${
                        isManualCode
                          ? "border-fbs-yellow focus:border-fbs-yellow"
                          : "border-fbs-border focus:border-fbs-green"
                      }`}
                    />
                    {isManualCode && (
                      <p className="text-fbs-yellow text-xs mt-1">
                        ⚠ Auto-generation disabled — using manual code
                      </p>
                    )}
                  </div>

                  {/* Batch code preview */}
                  {(previewCode || previewLoading) && (
                    <div
                      className={`border rounded-xl p-4 ${isManualCode ? "bg-fbs-yellow/5 border-fbs-yellow/30" : "bg-fbs-dark border-fbs-green/30"}`}>
                      <p className="text-xs text-gray-500 mb-1">
                        {isManualCode
                          ? "Manual Batch Code"
                          : "Auto-generated Batch Code"}
                      </p>
                      {previewLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-fbs-green" />
                      ) : (
                        <>
                          <p
                            className={`font-mono font-bold text-lg ${isManualCode ? "text-fbs-yellow" : "text-fbs-green"}`}>
                            {previewCode}
                          </p>
                          {previewName && (
                            <p className="text-xs text-gray-400 mt-1">
                              Suggested name:{" "}
                              <span className="text-white">{previewName}</span>
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Batch name */}
                  <div>
                    <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                      Batch Name{" "}
                      <span className="text-gray-600 font-normal normal-case">
                        (optional — auto-generated if empty)
                      </span>
                    </label>
                    <input
                      value={createForm.batchName}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          batchName: e.target.value,
                        }))
                      }
                      placeholder={previewName || "e.g. Jan Java Hybrid 2026"}
                      className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green transition"
                    />
                  </div>

                  {/* Start / End dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={createForm.startDate}
                        onChange={(e) =>
                          setCreateForm((f) => ({
                            ...f,
                            startDate: e.target.value,
                          }))
                        }
                        className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-fbs-green"
                      />
                    </div>
                    <div>
                      <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={createForm.endDate}
                        onChange={(e) =>
                          setCreateForm((f) => ({
                            ...f,
                            endDate: e.target.value,
                          }))
                        }
                        className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-fbs-green"
                      />
                    </div>
                    {/* Refund Date */}
                    <div>
                      <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                        Refund Date
                        <span className="text-gray-600 font-normal normal-case">
                          {" "}
                          (deadline for fee refund)
                        </span>
                      </label>
                      <input
                        type="date"
                        value={createForm.refundDate || ""}
                        onChange={(e) =>
                          setCreateForm((f) => ({
                            ...f,
                            refundDate: e.target.value,
                          }))
                        }
                        className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-fbs-green"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 border border-fbs-border rounded-lg text-sm text-gray-400 hover:bg-fbs-card transition">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 py-2.5 bg-fbs-green hover:bg-fbs-yellow text-black font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2">
                      {formLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Create Batch"
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* ── Edit Form ── */}
              {editBatch && (
                <form onSubmit={handleEdit} className="space-y-4">
                  <div className="bg-fbs-dark border border-fbs-border rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">
                      Batch Code (cannot change)
                    </p>
                    <p className="font-mono text-fbs-green font-bold">
                      {editBatch.batchCode}
                    </p>
                  </div>
                  <div>
                    <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                      Batch Name
                    </label>
                    <input
                      value={editForm.batchName}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          batchName: e.target.value,
                        }))
                      }
                      placeholder="e.g. Jan Java Hybrid 2026"
                      className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green"
                    />
                  </div>
                  <div>
                    <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                      Course
                    </label>
                    <input
                      value={editForm.course}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, course: e.target.value }))
                      }
                      placeholder="e.g. Java Full Stack"
                      className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={editForm.startDate}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            startDate: e.target.value,
                          }))
                        }
                        className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-fbs-green"
                      />
                    </div>
                    <div>
                      <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={editForm.endDate}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            endDate: e.target.value,
                          }))
                        }
                        className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-fbs-green"
                      />
                    </div>
                    <div>
                      <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                        Refund Date
                        <span className="text-gray-600 font-normal normal-case">
                          {" "}
                          (deadline for fee refund)
                        </span>
                      </label>
                      <input
                        type="date"
                        value={editForm.refundDate || ""}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            refundDate: e.target.value,
                          }))
                        }
                        className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-fbs-green"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 border border-fbs-border rounded-lg text-sm text-gray-400 hover:bg-fbs-card transition">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 py-2.5 bg-fbs-green hover:bg-fbs-yellow text-black font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2">
                      {formLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
          
        </div>
      )}
    </DashboardLayout>
  );
}
