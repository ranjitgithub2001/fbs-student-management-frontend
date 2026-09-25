import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { formatDate } from "../../utils/dateUtils";
import axiosInstance from "../../api/axiosInstance";
import {
  ClipboardList,
  Check,
  X,
  Loader2,
  Eye,
  ZoomIn,
  User,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Clock,
  BadgeCheck,
  XCircle,
} from "lucide-react";

const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

export default function AdmissionRequestsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING");
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [actionType, setActionType] = useState("");
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showAction, setShowAction] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/admin/admissions");
      setSubmissions(res.data);
    } catch {
      setError("Failed to load admission requests");
    } finally {
      setLoading(false);
    }
  }

  const filtered = submissions.filter((s) =>
    activeTab === "ALL" ? true : s.status === activeTab,
  );

  const counts = {
    ALL: submissions.length,
    PENDING: submissions.filter((s) => s.status === "PENDING").length,
    APPROVED: submissions.filter((s) => s.status === "APPROVED").length,
    REJECTED: submissions.filter((s) => s.status === "REJECTED").length,
  };

  function openDetail(submission) {
    setSelected(submission);
    setShowDetail(true);
    setLightbox(false);
  }

  function openAction(submission, type) {
    setSelected(submission);
    setActionType(type);
    setRemarks("");
    setActionError("");
    setShowAction(true);
  }

  async function handleAction() {
    if (actionType === "reject" && !remarks.trim()) {
      setActionError("Please provide a reason for rejection");
      return;
    }
    setActionLoading(true);
    setActionError("");
    try {
      await axiosInstance.put(
        `/admin/admissions/${selected.id}/${actionType}`,
        { remarks: remarks.trim() },
      );
      setShowAction(false);
      setShowDetail(false);
      fetchSubmissions();
    } catch (err) {
      setActionError(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  const statusBadge = (status) => {
    const styles = {
      PENDING: "bg-yellow-900/30 border-yellow-700/50 text-yellow-400",
      APPROVED: "bg-green-900/30 border-green-700/50 text-fbs-green",
      REJECTED: "bg-red-900/30 border-red-700/50 text-red-400",
    };
    const icons = {
      PENDING: <Clock className="w-3 h-3" />,
      APPROVED: <BadgeCheck className="w-3 h-3" />,
      REJECTED: <XCircle className="w-3 h-3" />,
    };
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${styles[status]}`}>
        {icons[status]} {status}
      </span>
    );
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2 border-b border-fbs-border/50">
      <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-white">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-white">
            Admission Requests
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Review and approve student admission submissions
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", count: counts.ALL, color: "text-white" },
            {
              label: "Pending",
              count: counts.PENDING,
              color: "text-yellow-400",
            },
            {
              label: "Approved",
              count: counts.APPROVED,
              color: "text-fbs-green",
            },
            {
              label: "Rejected",
              count: counts.REJECTED,
              color: "text-red-400",
            },
          ].map(({ label, count, color }) => (
            <div
              key={label}
              className="bg-fbs-darker border border-fbs-border rounded-2xl p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-fbs-darker border border-fbs-border rounded-xl p-1 mb-4 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab
                  ? "bg-fbs-card text-fbs-green border border-fbs-border"
                  : "text-gray-500 hover:text-gray-300"
              }`}>
              {tab} {counts[tab] > 0 && `(${counts[tab]})`}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-fbs-darker border border-fbs-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-fbs-green" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                No {activeTab.toLowerCase()} admission requests
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-fbs-border">
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">
                    Student
                  </th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">
                    FRN
                  </th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">
                    Batch
                  </th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">
                    Mobile
                  </th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">
                    Submitted
                  </th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-b border-fbs-border/50 hover:bg-fbs-card/30 transition ${i % 2 === 0 ? "" : "bg-fbs-dark/20"}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {s.photoUrl ? (
                          <img
                            src={s.photoUrl}
                            alt={s.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-fbs-border"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-fbs-card border border-fbs-border flex items-center justify-center flex-shrink-0">
                            <span className="text-fbs-green text-xs font-semibold">
                              {s.fullName
                                ?.split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-white font-medium">
                            {s.fullName}
                          </p>
                          <p className="text-xs text-gray-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-fbs-green">
                        {s.frn}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs bg-fbs-card border border-fbs-border px-2 py-1 rounded-full text-gray-300">
                        {s.batchName || s.batchCode}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">
                      {s.mobile}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {formatDate(s.submittedAt)}
                    </td>
                    <td className="px-5 py-3">{statusBadge(s.status)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetail(s)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-fbs-card border border-fbs-border text-gray-300 rounded-lg text-xs hover:border-fbs-green hover:text-fbs-green transition">
                          <Eye className="w-3 h-3" /> View
                        </button>
                        {s.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => openAction(s, "approve")}
                              className="flex items-center gap-1 px-2.5 py-1 bg-fbs-green/10 border border-fbs-green/30 text-fbs-green rounded-lg text-xs font-semibold hover:bg-fbs-green/20 transition">
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => openAction(s, "reject")}
                              className="flex items-center gap-1 px-2.5 py-1 bg-red-900/20 border border-red-700/30 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-900/30 transition">
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────────────── */}
      {showDetail && selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-fbs-darker border border-fbs-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-fbs-border sticky top-0 bg-fbs-darker z-10">
              <div className="flex items-center gap-4">
                {/* Avatar with zoom */}
                <div className="relative group flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-fbs-card border-2 border-fbs-border flex items-center justify-center">
                    {selected.photoUrl ? (
                      <img
                        src={selected.photoUrl}
                        alt={selected.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-fbs-green font-bold text-lg">
                        {selected.fullName
                          ?.split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Zoom overlay */}
                  {selected.photoUrl && (
                    <button
                      onClick={() => setLightbox(true)}
                      className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>

                <div>
                  <div className="font-mono text-xs text-fbs-green mb-1">
                    {selected.frn}
                  </div>
                  <h2 className="font-heading text-xl font-bold">
                    {selected.fullName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-fbs-card border border-fbs-border px-2 py-0.5 rounded-full text-gray-400">
                      {selected.batchName || selected.batchCode}
                    </span>
                    {statusBadge(selected.status)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View full photo link */}
                {selected.photoUrl && (
                  <button
                    onClick={() => setLightbox(true)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-fbs-green transition px-2 py-1.5 rounded-lg border border-fbs-border hover:border-fbs-green">
                    <ZoomIn className="w-3.5 h-3.5" /> View Photo
                  </button>
                )}
                <button
                  onClick={() => setShowDetail(false)}
                  className="p-2 hover:bg-fbs-card rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-xs font-semibold text-fbs-green uppercase tracking-widest mb-2">
                  Personal Info
                </p>
                <InfoRow icon={Mail} label="Email" value={selected.email} />
                <InfoRow icon={Phone} label="Mobile" value={selected.mobile} />
                <InfoRow
                  icon={Phone}
                  label="WhatsApp"
                  value={selected.whatsapp}
                />
                <InfoRow
                  icon={User}
                  label="Date of Birth"
                  value={formatDate(selected.dob)}
                />
                <InfoRow icon={User} label="Gender" value={selected.gender} />
                <InfoRow
                  icon={User}
                  label="Employed"
                  value={selected.employed ? "Yes" : "No"}
                />
                {selected.instagramId && (
                  <InfoRow
                    icon={User}
                    label="Instagram"
                    value={`@${selected.instagramId}`}
                  />
                )}
                {selected.linkedinId && (
                  <div className="flex items-start gap-3 py-2 border-b border-fbs-border/50">
                    <User className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">LinkedIn</p>
                      <a
                        href={
                          selected.linkedinId.startsWith("http")
                            ? selected.linkedinId
                            : `https://${selected.linkedinId}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-fbs-green hover:text-fbs-yellow transition truncate block">
                        {selected.linkedinId}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-fbs-green uppercase tracking-widest mb-2">
                  Education
                </p>
                <InfoRow
                  icon={GraduationCap}
                  label="Graduation"
                  value={
                    selected.graduationCompleted ? "Completed" : "Pursuing"
                  }
                />
                <InfoRow
                  icon={GraduationCap}
                  label="Degree"
                  value={selected.degreeDetails}
                />
                <InfoRow
                  icon={Building}
                  label="College"
                  value={selected.collegeName}
                />
                <InfoRow
                  icon={Building}
                  label="University"
                  value={selected.universityName}
                />
                <InfoRow
                  icon={Building}
                  label="Location"
                  value={selected.collegeLocation}
                />
              </div>

              {selected.contacts?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-fbs-green uppercase tracking-widest mb-2">
                    Contacts
                  </p>
                  {selected.contacts.map((c, i) => (
                    <div
                      key={i}
                      className="bg-fbs-dark border border-fbs-border rounded-xl p-4 mb-2">
                      <div className="flex gap-2 mb-2">
                        <span className="text-xs font-semibold text-fbs-yellow">
                          {c.contactType}
                        </span>
                        <span className="text-xs text-gray-500">
                          — {c.relation}
                        </span>
                      </div>
                      <InfoRow icon={User} label="Name" value={c.name} />
                      <InfoRow icon={Phone} label="Phone" value={c.phone} />
                      <InfoRow icon={Mail} label="Email" value={c.email} />
                    </div>
                  ))}
                </div>
              )}

              {selected.adminRemarks && (
                <div className="bg-fbs-dark border border-fbs-border rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                    Admin Remarks
                  </p>
                  <p className="text-sm text-white">{selected.adminRemarks}</p>
                </div>
              )}

              {selected.status === "PENDING" && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      openAction(selected, "reject");
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-900/20 border border-red-700/30 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-900/30 transition">
                    <X className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      openAction(selected, "approve");
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-fbs-green hover:bg-fbs-yellow text-black font-semibold rounded-lg text-sm transition">
                    <Check className="w-4 h-4" /> Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────────── */}
      {lightbox && selected?.photoUrl && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4"
          onClick={() => setLightbox(false)}>
          <div
            className="relative max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(false)}
              className="absolute -top-10 right-0 text-gray-400 hover:text-white transition flex items-center gap-1 text-sm">
              <X className="w-4 h-4" /> Close
            </button>
            <img
              src={selected.photoUrl}
              alt={selected.fullName}
              className="w-full rounded-2xl border border-fbs-border shadow-2xl"
            />
            <div className="text-center mt-3">
              <p className="text-white font-semibold">{selected.fullName}</p>
              <p className="text-fbs-green text-xs font-mono mt-0.5">
                {selected.frn}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Action Modal ─────────────────────────────────────────────────────── */}
      {showAction && selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-fbs-darker border border-fbs-border rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-fbs-border">
              <div>
                <h2 className="font-heading text-xl font-bold">
                  {actionType === "approve"
                    ? "✅ Approve Admission"
                    : "❌ Reject Admission"}
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  {actionType === "approve"
                    ? "Student record will be created and email sent"
                    : "Student will be notified with rejection reason"}
                </p>
              </div>
              <button
                onClick={() => setShowAction(false)}
                className="p-2 hover:bg-fbs-card rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-fbs-dark border border-fbs-border rounded-xl p-4 mb-4">
                <p className="text-sm font-medium text-white">
                  {selected.fullName}
                </p>
                <p className="text-xs text-fbs-green font-mono mt-0.5">
                  {selected.frn}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {selected.batchName || selected.batchCode}
                </p>
              </div>

              {actionError && (
                <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
                  {actionError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                  {actionType === "reject"
                    ? "Rejection Reason *"
                    : "Remarks (optional)"}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder={
                    actionType === "reject"
                      ? "Please provide reason for rejection..."
                      : "Any remarks for this approval..."
                  }
                  className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAction(false)}
                  className="flex-1 py-2.5 border border-fbs-border rounded-lg text-sm text-gray-400 hover:bg-fbs-card transition">
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionLoading}
                  className={`flex-1 py-2.5 font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2 ${
                    actionType === "approve"
                      ? "bg-fbs-green hover:bg-fbs-yellow text-black"
                      : "bg-red-700 hover:bg-red-600 text-white"
                  }`}>
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : actionType === "approve" ? (
                    "Approve & Create Student"
                  ) : (
                    "Reject & Notify"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
