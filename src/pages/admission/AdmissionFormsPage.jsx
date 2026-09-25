import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import axiosInstance from "../../api/axiosInstance";
import {
  Link2,
  Plus,
  Copy,
  Loader2,
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Hash,
  Pencil,
  ToggleRight,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ResponsiveTable from "../../components/ResponsiveTable";

const PAGE_SIZE = 8;

export default function AdmissionFormsPage() {
  const [links, setLinks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Generate link
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // FRN Generator
  const [frnBatchId, setFrnBatchId] = useState("");
  const [nextFrn, setNextFrn] = useState("");
  const [editedFrn, setEditedFrn] = useState("");
  const [frnLoading, setFrnLoading] = useState(false);
  const [frnCopied, setFrnCopied] = useState(false);
  const [frnError, setFrnError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("active"); // "active" | "inactive"

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);
  useEffect(() => {
    fetchLinks();
    axiosInstance
      .get("/batches")
      .then((r) => setBatches(r.data))
      .catch(() => {});
  }, []);

  async function fetchLinks() {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/admin/admission-links");
      setLinks(res.data);
      setCurrentPage(1);
    } catch {
      setError("Failed to load admission form links");
    } finally {
      setLoading(false);
    }
  }

  async function generateLink() {
    if (!selectedBatchId) {
      setGenerateError("Please select a batch");
      return;
    }
    setGenerating(true);
    setGenerateError("");
    try {
      await axiosInstance.post(
        `/admin/admission-links?batchId=${selectedBatchId}`,
      );
      setSelectedBatchId("");
      fetchLinks();
    } catch (err) {
      setGenerateError(
        err.response?.data?.message || "Failed to generate link",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function deactivateLink(id) {
    try {
      await axiosInstance.put(`/admin/admission-links/${id}/deactivate`);
      fetchLinks();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to deactivate link");
    }
  }

  async function deleteLink(id, batchName) {
    if (!confirm(`Delete form link for "${batchName}"? This cannot be undone.`))
      return;
    try {
      await axiosInstance.delete(`/admin/admission-links/${id}`);
      fetchLinks();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete link");
    }
  }

  function copyLink(link) {
    navigator.clipboard.writeText(link.formUrl);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function loadNextFrn(batchId) {
    setFrnBatchId(batchId);
    setNextFrn("");
    setEditedFrn("");
    setFrnError("");
    if (!batchId) return;
    setFrnLoading(true);
    try {
      const res = await axiosInstance.get(`/batches/${batchId}/next-frn`);
      setNextFrn(res.data.frn);
      setEditedFrn(res.data.frn);
    } catch {
      setFrnError("Failed to load next FRN");
    } finally {
      setFrnLoading(false);
    }
  }

  const activeLinkForBatch = links.find(
    (l) => l.batchId === parseInt(frnBatchId) && l.active,
  );

  function getWhatsAppMessage() {
    const batch = batches.find((b) => b.id === parseInt(frnBatchId));
    const formUrl =
      activeLinkForBatch?.formUrl || "[Form link not generated yet]";
    return encodeURIComponent(
      `Hello Student,\n\nYou are required to complete the admission process for the *${batch?.batchName || batch?.batchCode}* batch.\n\n` +
        `📋 *Your FRN Number:* ${editedFrn}\n\n📝 *Admission Form:* ${formUrl}\n\n` +
        `Please fill in the admission form using your FRN number mentioned above.\n\n` +
        `If you face any issues, contact us at:\n📞 +91 83905 77707\n📧 firstbit.training@gmail.com\n\n` +
        `Regards,\nTraining & Administration Team\nFirstBit Solutions`,
    );
  }

  function copyFrnAndLink() {
    const formUrl =
      activeLinkForBatch?.formUrl || "[Form link not generated yet]";
    navigator.clipboard.writeText(`FRN: ${editedFrn}\nForm: ${formUrl}`);
    setFrnCopied(true);
    setTimeout(() => setFrnCopied(false), 2000);
  }

  function getWhatsAppLinkForTable(link) {
    return encodeURIComponent(
      `Hello Student,\n\nPlease fill out the admission form for *${link.batchName || link.batchCode}* batch:\n\n` +
        `📝 Admission Form: ${link.formUrl}\n\nPlease fill in all details including your FRN number.\n\n` +
        `If you face any issues, contact us at +91 83905 77707\n\nRegards,\nFirstBit Solutions`,
    );
  }
  const filteredLinks = useMemo(() => {
    return links.filter((l) => (activeTab === "active" ? l.active : !l.active));
  }, [links, activeTab]);

  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLinks.slice(start, start + PAGE_SIZE);
  }, [filteredLinks, currentPage]);
  const totalPages = Math.ceil(filteredLinks.length / PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="font-heading text-2xl font-bold text-white">
            Admission Forms
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Generate form links and share FRNs with students
          </p>
        </div>

        {/* ── Top row: FRN Generator + Generate Link side by side ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* FRN Generator */}
          <div className="bg-fbs-darker border border-fbs-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="w-4 h-4 text-fbs-green" />
              <h2 className="text-sm font-semibold text-white">
                FRN Generator
              </h2>
            </div>

            <div className="relative mb-3">
              <select
                value={frnBatchId}
                onChange={(e) => loadNextFrn(e.target.value)}
                className="w-full appearance-none bg-fbs-dark border border-fbs-border rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-fbs-green cursor-pointer">
                <option value="">Select batch...</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchName || b.batchCode}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {frnError && (
              <p className="text-red-400 text-xs mb-2">{frnError}</p>
            )}

            {frnLoading && (
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Loader2 className="w-3 h-3 animate-spin text-fbs-green" />{" "}
                Loading...
              </div>
            )}

            {nextFrn && !frnLoading && (
              <div className="bg-fbs-dark border border-fbs-green/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    value={editedFrn}
                    onChange={(e) => setEditedFrn(e.target.value.toUpperCase())}
                    className="flex-1 bg-fbs-darker border border-fbs-green/30 rounded-lg px-3 py-1.5 font-mono text-fbs-green font-bold text-sm focus:outline-none focus:border-fbs-green"
                  />
                  <button
                    onClick={() => loadNextFrn(frnBatchId)}
                    className="text-xs text-gray-500 hover:text-fbs-green transition px-2 py-1.5 border border-fbs-border rounded-lg">
                    Reset
                  </button>
                </div>

                {!activeLinkForBatch && (
                  <p className="text-xs text-yellow-400 mb-2">
                    ⚠️ No active form link for this batch
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={copyFrnAndLink}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-fbs-card border border-fbs-border text-gray-300 rounded-lg text-xs hover:border-fbs-green hover:text-fbs-green transition">
                    {frnCopied ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-fbs-green" />{" "}
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                  <a
                    href={`https://wa.me/?text=${getWhatsAppMessage()}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-green-900/20 border border-green-700/30 text-green-400 rounded-lg text-xs hover:bg-green-900/30 transition">
                    WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Generate Form Link */}
          <div className="bg-fbs-darker border border-fbs-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-fbs-green" />
              <h2 className="text-sm font-semibold text-white">
                Generate Form Link
              </h2>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Generate a unique admission form link per batch to share with
              students.
            </p>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <select
                  value={selectedBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                    setGenerateError("");
                  }}
                  className="w-full appearance-none bg-fbs-dark border border-fbs-border rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-fbs-green cursor-pointer">
                  <option value="">Select a batch...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchName || b.batchCode}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={generateLink}
                disabled={generating}
                className="flex items-center gap-1.5 px-3 py-2 bg-fbs-green hover:bg-fbs-yellow text-black font-semibold rounded-lg text-sm transition disabled:opacity-50 flex-shrink-0">
                {generating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> Generate
                  </>
                )}
              </button>
            </div>
            {generateError && (
              <p className="text-red-400 text-xs mb-2">{generateError}</p>
            )}
            <p className="text-xs text-gray-600 bg-fbs-dark border border-fbs-border rounded-lg px-3 py-2">
              💡 New link{" "}
              <span className="text-yellow-400">deactivates previous link</span>{" "}
              for that batch
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* ── All Links Table ── */}
        <div className="bg-fbs-darker border border-fbs-border rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-fbs-border flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-white">All Form Links</h2>
            <span className="text-xs text-gray-500">{links.length} total</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-fbs-green" />
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-10">
              <Link2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                No form links generated yet
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab("active")}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                    activeTab === "active"
                      ? "bg-fbs-green/10 border-fbs-green/30 text-fbs-green"
                      : "bg-fbs-card border-fbs-border text-gray-400 hover:text-gray-200"
                  }`}>
                  Active ({links.filter((l) => l.active).length})
                </button>
                <button
                  onClick={() => setActiveTab("inactive")}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                    activeTab === "inactive"
                      ? "bg-fbs-green/10 border-fbs-green/30 text-fbs-green"
                      : "bg-fbs-card border-fbs-border text-gray-400 hover:text-gray-200"
                  }`}>
                  Inactive ({links.filter((l) => !l.active).length})
                </button>
              </div>
              <ResponsiveTable>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-fbs-border">
                    <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-4 py-2.5">
                      Batch
                    </th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-4 py-2.5">
                      Form URL
                    </th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-4 py-2.5">
                      Pending
                    </th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-4 py-2.5">
                      Status
                    </th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-widest px-4 py-2.5">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLinks.map((link, i) => (
                    <tr
                      key={link.id}
                      className={`border-b border-fbs-border/50 hover:bg-fbs-card/30 transition ${i % 2 === 0 ? "" : "bg-fbs-dark/20"}`}>
                      <td className="px-4 py-3">
                        <p className="text-sm text-white font-medium">
                          {link.batchName || link.batchCode}
                        </p>
                        <p className="text-xs font-mono text-fbs-green">
                          {link.batchCode}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500 font-mono truncate max-w-40">
                            {link.formUrl}
                          </span>
                          <a
                            href={link.formUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-500 hover:text-fbs-green transition flex-shrink-0">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {link.pendingCount > 0 ? (
                          <span className="text-xs bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 px-2 py-0.5 rounded-full">
                            {link.pendingCount}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            link.active
                              ? "bg-fbs-green/10 border-fbs-green/30 text-fbs-green"
                              : "bg-fbs-card border-fbs-border text-gray-500"
                          }`}>
                          {link.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => copyLink(link)}
                            className="flex items-center gap-1 px-2 py-1 bg-fbs-card border border-fbs-border text-gray-300 rounded-lg text-xs hover:border-fbs-green hover:text-fbs-green transition">
                            {copiedId === link.id ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-fbs-green" />{" "}
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copy
                              </>
                            )}
                          </button>
                          {link.active && (
                            <a
                              href={`https://wa.me/?text=${getWhatsAppLinkForTable(link)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1 bg-green-900/20 border border-green-700/30 text-green-400 rounded-lg text-xs hover:bg-green-900/30 transition">
                              WhatsApp
                            </a>
                          )}
                          {link.active && (
                            <button
                              onClick={() => deactivateLink(link.id)}
                              className="flex items-center gap-1 px-2 py-1 bg-yellow-900/20 border border-yellow-700/30 text-yellow-400 rounded-lg text-xs hover:bg-yellow-900/30 transition">
                              <>
                                <ToggleRight className="w-3 h-3" /> Deactivate
                              </>
                            </button>
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
                <div className="flex items-center justify-between px-4 py-3 border-t border-fbs-border">
                  <p className="text-xs text-gray-500">
                    {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, links.length)} of{" "}
                    {links.length}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => p - 1)}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-fbs-border text-gray-400 hover:text-fbs-green hover:border-fbs-green transition disabled:opacity-30 disabled:cursor-not-allowed">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded-lg text-xs font-semibold transition border ${
                            currentPage === page
                              ? "bg-fbs-green text-black border-fbs-green"
                              : "border-fbs-border text-gray-400 hover:border-fbs-green hover:text-fbs-green"
                          }`}>
                          {page}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-fbs-border text-gray-400 hover:text-fbs-green hover:border-fbs-green transition disabled:opacity-30 disabled:cursor-not-allowed">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}