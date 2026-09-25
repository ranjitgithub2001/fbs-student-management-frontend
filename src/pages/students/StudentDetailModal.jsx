import { useState, useRef, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { formatDate } from "../../utils/dateUtils";
import {
  X,
  Loader2,
  Mail,
  Phone,
  GraduationCap,
  User,
  Building,
  Camera,
  Trash2,
  Link,
  ZoomIn,
} from "lucide-react";

export default function StudentDetailModal({
  student,
  isAdmin,
  onClose,
  onUpdate,
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: student.fullName || "",
    email: student.email || "",
    phone: student.phone || "",
    dob: student.dob || "",
    collegeName: student.collegeName || "",
    collegeLocation: student.collegeLocation || "",
    currentYear: student.currentYear || "",
    graduationYear: student.graduationYear || "",
    instagramId: student.instagramId || "",
    linkedinId: student.linkedinId || "",
    contacts: student.contacts || [],
  });

  const [photoUrl, setPhotoUrl] = useState(student.photoUrl || null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [lightbox, setLightbox] = useState(false); // ← lightbox state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();
  const [batches, setBatches] = useState([]);
  const [frnSequence, setFrnSequence] = useState("");
  const [lastSequence, setLastSequence] = useState(null);
  const originalBatchId = student.batchId; // to detect if batch actually changed

  useEffect(() => {
    axiosInstance
      .get("/batches")
      .then((r) => setBatches(r.data))
      .catch(() => {});
  }, []);
  function getFrnPrefix(batch) {
    if (!batch) return "";
    const yy = String(batch.startYear).slice(-2);
    return `FRN-${String(batch.batchNumber).padStart(2, "0")}${batch.courseCode}${String(batch.startMonth).padStart(2, "0")}${yy}`;
  }

  // ── Photo: file upload ────────────────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB");
      return;
    }
    setPhotoLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await axiosInstance.post(
        `/students/${student.id}/photo/file`,
        fd,
      );
      setPhotoUrl(res.data.photoUrl);
    } catch (err) {
      setError(err.response?.data?.message || "Photo upload failed");
    } finally {
      setPhotoLoading(false);
    }
  }

  // ── Photo: URL upload ─────────────────────────────────────────────────────
  async function handleUrlUpload(e) {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setPhotoLoading(true);
    setError("");
    try {
      const res = await axiosInstance.post(
        `/students/${student.id}/photo/url`,
        {
          photoUrl: urlInput.trim(),
        },
      );
      setPhotoUrl(res.data.photoUrl);
      setShowUrlInput(false);
      setUrlInput("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload from URL");
    } finally {
      setPhotoLoading(false);
    }
  }
  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB");
      return;
    }
    setPhotoLoading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      fd.append("frn", form.frn.toUpperCase());
      const res = await axiosInstance.post("/admission/upload-photo", fd);
      setPhotoUrl(res.data.photoUrl);
      setForm((f) => ({ ...f, photoUrl: res.data.photoUrl }));
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setPhotoLoading(false);
    }
  }

  // ── Photo: delete ─────────────────────────────────────────────────────────
  async function handlePhotoDelete() {
    if (!confirm("Remove this student photo?")) return;
    setPhotoLoading(true);
    setError("");
    try {
      await axiosInstance.delete(`/students/${student.id}/photo`);
      setPhotoUrl(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete photo");
    } finally {
      setPhotoLoading(false);
    }
  }
    // ── Contact update ────────────────────────────────────────────────────────

  function updateContact(i, field, val) {
    setForm((f) => ({
      ...f,
      contacts: f.contacts.map((c, idx) =>
        idx === i ? { ...c, [field]: val } : c,
      ),
    }));
  }

  // ── Student update ────────────────────────────────────────────────────────
  async function handleUpdate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const batchChanged =
        form.batchId && String(form.batchId) !== String(originalBatchId);
      const selectedBatch = batchChanged
        ? batches.find((b) => String(b.id) === String(form.batchId))
        : null;

      await axiosInstance.put(`/students/${student.id}`, {
        ...form,
        currentYear: form.currentYear ? parseInt(form.currentYear) : null,
        graduationYear: form.graduationYear
          ? parseInt(form.graduationYear)
          : null,
        dob: form.dob || null,
        frn: batchChanged
          ? `${getFrnPrefix(selectedBatch)}/${frnSequence}`
          : undefined,
      });
      onUpdate();
    } catch (err) {
      let msg = err.response?.data?.message || "Update failed";
      msg = msg
        .replace(/^DUPLICATE_FRN:\s*/, "")
        .replace(/^Invalid FRN:\s*/, "");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const initials = student.fullName
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-fbs-border/50">
      <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
      <div>
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className="text-sm text-white">{value || "—"}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Main Modal ─────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-fbs-darker border border-fbs-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-fbs-border sticky top-0 bg-fbs-darker z-10">
            <div className="flex items-center gap-4">
              {/* Avatar / Photo */}
              <div className="relative group flex-shrink-0">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-fbs-card border-2 border-fbs-border flex items-center justify-center">
                  {photoLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-fbs-green" />
                  ) : photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={student.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-fbs-green font-bold text-lg">
                      {initials}
                    </span>
                  )}
                </div>

                {/* Overlay buttons on hover */}
                {!photoLoading && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {/* View full photo */}
                    {photoUrl && (
                      <button
                        onClick={() => setLightbox(true)}
                        className="p-1 text-white hover:text-fbs-green transition"
                        title="View full photo">
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    )}
                    {/* Upload new photo — admin only */}
                    {isAdmin && (
                      <button
                        onClick={() => fileRef.current.click()}
                        className="p-1 text-white hover:text-fbs-green transition"
                        title="Upload photo">
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              <div>
                <div className="font-mono text-xs text-fbs-green mb-1">
                  {student.frn}
                </div>
                <h2 className="font-heading text-xl font-bold">
                  {student.fullName}
                </h2>
                <span className="text-xs bg-fbs-card border border-fbs-border px-2 py-0.5 rounded-full text-gray-400 mt-1 inline-block">
                  {student.batchName || student.batchCode}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && photoUrl && !photoLoading && (
                <button
                  onClick={handlePhotoDelete}
                  title="Remove photo"
                  className="p-2 text-gray-500 hover:text-red-400 transition rounded-lg border border-fbs-border hover:border-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {isAdmin && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1.5 bg-fbs-card border border-fbs-border rounded-lg text-sm hover:bg-fbs-border transition">
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-fbs-card rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            {/* Photo action links — admin only, view mode */}
            {isAdmin && !editing && (
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => fileRef.current.click()}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-fbs-green transition">
                  <Camera className="w-3.5 h-3.5" />
                  {photoUrl ? "Change photo" : "Upload photo"}
                </button>
                <span className="text-gray-700">|</span>
                <button
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-fbs-green transition">
                  <Link className="w-3.5 h-3.5" />
                  Use Google Form URL
                </button>
                {photoUrl && (
                  <>
                    <span className="text-gray-700">|</span>
                    <button
                      onClick={() => setLightbox(true)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-fbs-green transition">
                      <ZoomIn className="w-3.5 h-3.5" />
                      View full photo
                    </button>
                  </>
                )}
              </div>
            )}

            {/* View full photo link for non-admin too */}
            {!isAdmin && photoUrl && !editing && (
              <button
                onClick={() => setLightbox(true)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-fbs-green transition mb-4">
                <ZoomIn className="w-3.5 h-3.5" />
                View full photo
              </button>
            )}

            {/* URL input */}
            {showUrlInput && isAdmin && (
              <form onSubmit={handleUrlUpload} className="flex gap-2 mb-4">
                <input
                  type="url"
                  required
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste Google Drive or image URL..."
                  className="flex-1 bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-fbs-green transition"
                />
                <button
                  type="submit"
                  disabled={photoLoading}
                  className="px-3 py-2 bg-fbs-green hover:bg-fbs-yellow text-black text-xs font-semibold rounded-lg transition flex items-center gap-1">
                  {photoLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Upload"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="px-3 py-2 border border-fbs-border rounded-lg text-xs text-gray-400 hover:bg-fbs-card transition">
                  Cancel
                </button>
              </form>
            )}

            {/* View mode */}
            {!editing ? (
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-semibold text-fbs-green uppercase tracking-widest mb-2">
                    Basic Info
                  </div>
                  <InfoRow
                    icon={User}
                    label="Full Name"
                    value={student.fullName}
                  />
                  <InfoRow icon={Mail} label="Email" value={student.email} />
                  <InfoRow icon={Phone} label="Phone" value={student.phone} />
                  <InfoRow
                    icon={User}
                    label="Date of Birth"
                    value={formatDate(student.dob)}
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-fbs-green uppercase tracking-widest mb-2">
                    Education
                  </div>
                  <InfoRow
                    icon={Building}
                    label="College"
                    value={student.collegeName}
                  />
                  <InfoRow
                    icon={Building}
                    label="Location"
                    value={student.collegeLocation}
                  />
                  <InfoRow
                    icon={GraduationCap}
                    label="Current Year"
                    value={student.currentYear}
                  />
                  <InfoRow
                    icon={GraduationCap}
                    label="Graduation Year"
                    value={student.graduationYear}
                  />
                </div>
                {(student.instagramId || student.linkedinId) && (
                  <div>
                    <div className="text-xs font-semibold text-fbs-green uppercase tracking-widest mb-2">
                      Social
                    </div>
                    {student.instagramId && (
                      <InfoRow
                        icon={User}
                        label="Instagram"
                        value={`@${student.instagramId}`}
                      />
                    )}
                    {student.linkedinId && (
                      <div className="flex items-start gap-3 py-2.5 border-b border-fbs-border/50">
                        <Link className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">
                            LinkedIn
                          </div>
                          <a
                            href={
                              student.linkedinId.startsWith("http")
                                ? student.linkedinId
                                : `https://${student.linkedinId}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-fbs-green hover:text-fbs-yellow transition">
                            {student.linkedinId}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {student.contacts?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-fbs-green uppercase tracking-widest mb-2">
                      Contacts
                    </div>
                    {student.contacts.map((c, i) => (
                      <div
                        key={i}
                        className="bg-fbs-dark border border-fbs-border rounded-xl p-4 mb-2">
                        <div className="text-xs font-semibold text-fbs-yellow mb-2">
                          {c.contactType}
                        </div>
                        <InfoRow icon={User} label="Name" value={c.name} />
                        <InfoRow icon={Phone} label="Phone" value={c.phone} />
                        <InfoRow icon={Mail} label="Email" value={c.email} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Edit mode
              <form onSubmit={handleUpdate} className="space-y-5">
                {/* Photo */}
               

                {/* Basic Info */}
                <div>
                  <div className="text-xs font-semibold text-fbs-green uppercase tracking-widest mb-3">
                    Basic Info
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { field: "fullName", label: "Full Name" },
                      { field: "email", label: "Email", type: "email" },
                      { field: "phone", label: "Phone" },
                      { field: "dob", label: "Date of Birth", type: "date" },
                    ].map(({ field, label, type = "text" }) => (
                      <div key={field}>
                        <label className="text-xs text-gray-400 mb-1 block">
                          {label}
                        </label>
                        <input
                          type={type}
                          value={form[field]}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, [field]: e.target.value }))
                          }
                          className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fbs-green transition"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">
                        Batch
                      </label>
                      <select
                        value={form.batchId || ""}
                        onChange={(e) => {
                          const newBatchId = e.target.value;
                          setForm((f) => ({ ...f, batchId: newBatchId }));
                          if (
                            newBatchId &&
                            newBatchId !== String(originalBatchId)
                          ) {
                            axiosInstance
                              .get(`/batches/${newBatchId}/last-sequence`)
                              .then((r) => {
                                setLastSequence(r.data);
                                setFrnSequence(
                                  String(r.data + 1).padStart(3, "0"),
                                );
                              })
                              .catch(() => setLastSequence(null));
                          } else {
                            setLastSequence(null);
                            setFrnSequence("");
                          }
                        }}
                        className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fbs-green transition">
                        <option value="">Select batch</option>
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.batchName} ({b.course})
                          </option>
                        ))}
                      </select>
                    </div>
                    {form.batchId &&
                      String(form.batchId) !== String(originalBatchId) && (
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">
                            New FRN{" "}
                            {lastSequence !== null &&
                              `(last used: ${String(lastSequence).padStart(3, "0")})`}
                          </label>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-400 bg-fbs-dark border border-r-0 border-fbs-border rounded-l-lg px-3 py-2">
                              {getFrnPrefix(
                                batches.find(
                                  (b) => String(b.id) === String(form.batchId),
                                ),
                              )}
                              /
                            </span>
                            <input
                              type="text"
                              value={frnSequence}
                              onChange={(e) => setFrnSequence(e.target.value)}
                              className="flex-1 bg-fbs-dark border border-fbs-border rounded-r-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fbs-green transition"
                              placeholder="003"
                            />
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <div className="text-xs font-semibold text-fbs-green uppercase tracking-widest mb-3">
                    Education
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { field: "collegeName", label: "College Name" },
                      { field: "collegeLocation", label: "College Location" },
                      {
                        field: "currentYear",
                        label: "Current Year",
                        type: "number",
                      },
                      {
                        field: "graduationYear",
                        label: "Graduation Year",
                        type: "number",
                      },
                      { field: "instagramId", label: "Instagram ID" },
                      { field: "linkedinId", label: "LinkedIn ID" },
                    ].map(({ field, label, type = "text" }) => (
                      <div key={field}>
                        <label className="text-xs text-gray-400 mb-1 block">
                          {label}
                        </label>
                        <input
                          type={type}
                          value={form[field]}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, [field]: e.target.value }))
                          }
                          className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fbs-green transition"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contacts */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-fbs-green uppercase tracking-widest">
                      Contacts
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          contacts: [
                            ...(f.contacts || []),
                            {
                              name: "",
                              phone: "",
                              email: "",
                              contactType: "",
                              relation: "",
                            },
                          ],
                        }))
                      }
                      className="text-xs px-2.5 py-1 border border-fbs-green text-fbs-green rounded-lg hover:bg-fbs-green hover:text-black transition">
                      + Add Contact
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(form.contacts || []).map((contact, i) => (
                      <div
                        key={i}
                        className="border border-fbs-border rounded-lg p-3 grid grid-cols-2 gap-3 relative">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              contacts: f.contacts.filter(
                                (_, idx) => idx !== i,
                              ),
                            }))
                          }
                          className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-300">
                          Remove
                        </button>

                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">
                            Name
                          </label>
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) =>
                              updateContact(i, "name", e.target.value)
                            }
                            className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fbs-green transition"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">
                            Phone
                          </label>
                          <input
                            type="text"
                            value={contact.phone}
                            onChange={(e) =>
                              updateContact(i, "phone", e.target.value)
                            }
                            className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fbs-green transition"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">
                            Email
                          </label>
                          <input
                            type="email"
                            value={contact.email}
                            onChange={(e) =>
                              updateContact(i, "email", e.target.value)
                            }
                            className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fbs-green transition"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">
                            Relation
                          </label>
                          <select
                            value={contact.contactType}
                            onChange={(e) =>
                              updateContact(i, "contactType", e.target.value)
                            }
                            className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fbs-green transition">
                            <option value="">Select</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Guardian">Guardian</option>
                            <option value="Emergency">Emergency</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {(!form.contacts || form.contacts.length === 0) && (
                      <p className="text-xs text-gray-500">
                        No contacts added yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 py-2.5 border border-fbs-border rounded-lg text-sm text-gray-400 hover:bg-fbs-card transition">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-fbs-green hover:bg-fbs-yellow text-black font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2">
                    {loading ? (
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

      {/* ── Lightbox ────────────────────────────────────────────────────────── */}
      {lightbox && photoUrl && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setLightbox(false)}>
          <div
            className="relative max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setLightbox(false)}
              className="absolute -top-10 right-0 text-gray-400 hover:text-white transition flex items-center gap-1 text-sm">
              <X className="w-4 h-4" /> Close
            </button>

            {/* Full size photo */}
            <img
              src={photoUrl}
              alt={student.fullName}
              className="w-full rounded-2xl border border-fbs-border shadow-2xl"
            />

            {/* Student name below photo */}
            <div className="text-center mt-3">
              <p className="text-white font-semibold">{student.fullName}</p>
              <p className="text-fbs-green text-xs font-mono mt-0.5">
                {student.frn}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
