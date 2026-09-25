import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Camera,
  AlertCircle,
  AtSign,
  Link,
} from "lucide-react";
import {
  MAHARASHTRA_DISTRICTS,
  MAHARASHTRA_COLLEGES,
  DEGREE_TYPES,
  BRANCHES,
  INDIAN_STATES,
} from "../../data/maharashtraColleges";
import { BASE_URL as BASE } from "../../config/api";

const STEPS = [
  { number: 1, label: "Identity" },
  { number: 2, label: "Personal" },
  { number: 3, label: "Education" },
  { number: 4, label: "Social" },
  { number: 5, label: "Contacts" },
  { number: 6, label: "Documents" },
];

const RELATIONS = [
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Uncle",
  "Aunt",
  "Other",
];

const Input = ({
  label,
  name,
  required,
  type = "text",
  placeholder,
  value,
  onChange,
  errors = {},
  onPaste,
}) => (
  <div>
    <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
      {label} {required && "*"}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      onPaste={onPaste}
      placeholder={placeholder}
      className={`w-full bg-fbs-dark border ${errors[name] ? "border-red-600" : "border-fbs-border"} rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green transition-colors`}
    />
    {errors[name] && (
      <p className="text-red-400 text-xs mt-1">{errors[name]}</p>
    )}
  </div>
);

export default function AdmissionFormPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [step, setStep] = useState(1);
  const [batchInfo, setBatchInfo] = useState(null);
  const [tokenError, setTokenError] = useState("");
  const [tokenLoading, setTokenLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [showCustomCollege, setShowCustomCollege] = useState(false);
  const [showCustomBranch, setShowCustomBranch] = useState(false);

  const [form, setForm] = useState({
    frn: "",
    email: "",
    confirmEmail: "",
    fullName: "",
    mobile: "",
    whatsapp: "",
    dob: "",
    gender: "",
    employed: "",
    graduationCompleted: "",
    degreeDetails: "",
    collegeName: "",
    universityName: "",
    collegeLocation: "",
    instagramId: "",
    linkedinId: "",
    contacts: [
      {
        contactType: "PARENT",
        relation: "Father",
        name: "",
        phone: "",
        email: "",
      },
    ],
    photoUrl: "",
    termsAccepted: false,
    degreeType: "",
    branch: "",
    graduationYear: "",
    collegeState: "",
    collegeDistrict: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!token) {
      setTokenError(
        "Invalid link — no token found. Please use the link provided by admin.",
      );
      setTokenLoading(false);
      return;
    }
    axios
      .get(`${BASE}/admission/validate?token=${token}`)
      .then((res) => {
        setBatchInfo(res.data);
        setTokenLoading(false);
      })
      .catch((err) => {
        setTokenError(
          err.response?.data?.message || "Invalid or expired form link.",
        );
        setTokenLoading(false);
      });
  }, [token]);
  async function sendOtp() {
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrors((e) => ({ ...e, email: "Enter a valid email first" }));
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      await axios.post(`${BASE}/admission/verify-email/send`, {
        email: form.email.trim(),
      });
      setOtpSent(true);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  }

  async function verifyOtp() {
    if (!otpValue.trim()) {
      setOtpError("Enter the OTP");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      await axios.post(`${BASE}/admission/verify-email/verify`, {
        email: form.email.trim(),
        otp: otpValue.trim(),
      });
      setOtpVerified(true);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  }
  function validate(currentStep) {
    const e = {};
    if (currentStep === 1) {
      // FRN validation
      if (!form.frn.trim()) {
        e.frn = "FRN is required";
      } else if (!/^FRN-[A-Z0-9]+\/\d{3}$/i.test(form.frn.trim())) {
        e.frn = "Invalid FRN format. Expected: FRN-BATCHCODE/NNN";
      } else if (batchInfo?.batchCode) {
        // Cross-check FRN with batch code
        const frnBatchCode = form.frn
          .trim()
          .toUpperCase()
          .replace("FRN-", "")
          .split("/")[0];
        if (frnBatchCode !== batchInfo.batchCode.toUpperCase()) {
          e.frn = `This FRN does not belong to batch ${batchInfo.batchName}. Please check with admin.`;
        }
      }

      if (!form.email.trim()) e.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = "Invalid email address";
      if (!otpVerified) e.emailOtp = "Please verify your email with OTP";
    }
    if (currentStep === 2) {
      if (!form.fullName.trim()) e.fullName = "Full name is required";
      if (!form.mobile.trim()) e.mobile = "Mobile is required";
      else if (!/^[6-9]\d{9}$/.test(form.mobile))
        e.mobile = "Invalid Indian mobile number";
      if (!form.whatsapp.trim()) e.whatsapp = "WhatsApp number is required";
      else if (!/^[6-9]\d{9}$/.test(form.whatsapp))
        e.whatsapp = "Invalid WhatsApp number";
      if (!form.dob) e.dob = "Date of birth is required";
      if (!form.gender) e.gender = "Gender is required";
      if (form.employed === "") e.employed = "Please select employment status";
    }
    if (currentStep === 3) {
      if (form.graduationCompleted === "")
        e.graduationCompleted = "Please select graduation status";
      if (!form.degreeType) e.degreeType = "Degree is required";
      if (!form.branch) e.branch = "Branch is required";
      if (!form.graduationYear)
        e.graduationYear = "Graduation year is required";
      if (!form.collegeState) e.collegeState = "State is required";
      if (form.collegeState === "Maharashtra" && !form.collegeDistrict)
        e.collegeDistrict = "District is required";
      if (!form.collegeName?.trim()) e.collegeName = "College name is required";
      if (!form.universityName.trim())
        e.universityName = "University name is required";
      if (!form.collegeLocation.trim())
        e.collegeLocation = "College location is required";
    }
    if (currentStep === 5) {
      form.contacts.forEach((c, i) => {
        if (!c.name.trim()) e[`contact_${i}_name`] = "Name is required";
        if (!c.phone.trim()) e[`contact_${i}_phone`] = "Phone is required";
        else if (!/^[6-9]\d{9}$/.test(c.phone))
          e[`contact_${i}_phone`] = "Invalid phone number";
        if (!c.relation) e[`contact_${i}_relation`] = "Relation is required";
      });
    }
    if (currentStep === 6) {
      if (!form.photoUrl) e.photo = "Please upload your photograph";
      if (!form.termsAccepted)
        e.terms = "You must accept the terms and conditions";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (validate(step)) setStep((s) => s + 1);
  }
  function prevStep() {
    setErrors({});
    setStep((s) => s - 1);
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((er) => ({ ...er, photo: "Only image files allowed" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((er) => ({ ...er, photo: "Photo must be under 5MB" }));
      return;
    }
    setPhotoLoading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      fd.append("frn", form.frn.toUpperCase());
      const res = await axios.post(`${BASE}/admission/upload-photo`, fd);
      setForm((f) => ({ ...f, photoUrl: res.data.photoUrl }));
      setPhotoPreview(URL.createObjectURL(file));
      setErrors((er) => {
        const e = { ...er };
        delete e.photo;
        return e;
      });
    } catch (err) {
      setErrors((er) => ({
        ...er,
        photo: err.response?.data?.error || "Upload failed",
      }));
    } finally {
      setPhotoLoading(false);
    }
  }

  function addContact() {
    setForm((f) => ({
      ...f,
      contacts: [
        ...f.contacts,
        {
          contactType: "PARENT",
          relation: "Father",
          name: "",
          phone: "",
          email: "",
        },
      ],
    }));
  }
  function removeContact(i) {
    setForm((f) => ({
      ...f,
      contacts: f.contacts.filter((_, idx) => idx !== i),
    }));
  }
  function updateContact(i, field, val) {
    setForm((f) => ({
      ...f,
      contacts: f.contacts.map((c, idx) =>
        idx === i ? { ...c, [field]: val } : c,
      ),
    }));
  }
  async function sendOtp() {
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrors((e) => ({ ...e, email: "Enter a valid email first" }));
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      await axios.post(`${BASE}/admission/verify-email/send`, {
        email: form.email.trim(),
      });
      setOtpSent(true);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  }

  async function verifyOtp() {
    if (!otpValue.trim()) {
      setOtpError("Enter the OTP");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      await axios.post(`${BASE}/admission/verify-email/verify`, {
        email: form.email.trim(),
        otp: otpValue.trim(),
      });
      setOtpVerified(true);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleSubmit() {
    if (!validate(6)) return;
    setSubmitLoading(true);
    setSubmitError("");
    try {
      await axios.post(`${BASE}/admission/submit`, {
        token,
        frn: form.frn.trim().toUpperCase(),
        email: form.email.trim().toLowerCase(),
        fullName: form.fullName.trim(),
        mobile: form.mobile.trim(),
        whatsapp: form.whatsapp.trim(),
        dob: form.dob,
        gender: form.gender,
        employed: form.employed === "true",
        graduationCompleted: form.graduationCompleted === "true",
        degreeDetails: form.degreeDetails.trim(),
        collegeName: form.collegeName.trim(),
        universityName: form.universityName.trim(),
        collegeLocation: form.collegeLocation.trim(),
        instagramId: form.instagramId.trim() || null,
        linkedinId: form.linkedinId.trim() || null,
        photoUrl: form.photoUrl,
        termsAccepted: form.termsAccepted,
        contacts: form.contacts,
        degreeType: form.degreeType,
        branch: form.branch,
        graduationYear: form.graduationYear,
        collegeState: form.collegeState,
        collegeDistrict: form.collegeDistrict,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Submission failed. Please try again.",
      );
    } finally {
      setSubmitLoading(false);
    }
  }

  if (tokenLoading)
    return (
      <div className="min-h-screen bg-fbs-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-fbs-green" />
      </div>
    );

  if (tokenError)
    return (
      <div className="min-h-screen bg-fbs-dark flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-white mb-2">
            Invalid Form Link
          </h2>
          <p className="text-gray-400 text-sm">{tokenError}</p>
        </div>
      </div>
    );

  if (submitted)
    return (
      <div
        className="min-h-screen bg-fbs-dark flex items-center justify-center p-4"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-fbs-green/10 border-2 border-fbs-green/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-fbs-green" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-white mb-3">
            Form Submitted!
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            Your admission form has been submitted successfully.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            A confirmation email has been sent to{" "}
            <span className="text-fbs-green">{form.email}</span>. You will be
            notified once your admission is reviewed.
          </p>
          <div className="bg-fbs-darker border border-fbs-border rounded-xl p-4 text-left mb-6">
            <p className="text-xs text-gray-500 mb-1">Your FRN</p>
            <p className="font-mono text-fbs-green font-semibold">
              {form.frn.toUpperCase()}
            </p>
            <p className="text-xs text-gray-500 mt-2 mb-1">Batch</p>
            <p className="text-white text-sm">{batchInfo?.batchName}</p>
          </div>
          <p className="text-xs text-gray-600">
            Questions? Contact us at{" "}
            <a
              href="mailto:firstbit.training@gmail.com"
              className="text-fbs-green">
              firstbit.training@gmail.com
            </a>
          </p>
        </div>
      </div>
    );

  return (
    <div
      className="min-h-screen bg-fbs-dark overflow-x-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}>
      {/* Top bar */}
      <div className="bg-fbs-darker border-b border-fbs-border px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-fbs-card rounded-lg flex items-center justify-center border border-fbs-border">
            <span className="text-fbs-green font-bold text-xs">FB</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold">
              FirstBit Solutions
            </p>
            <p className="text-fbs-green text-xs break-words">
              {batchInfo?.batchName} — Admission Form
            </p>
          </div>
        </div>
        <p className="text-gray-500 text-xs flex-shrink-0">
          Step {step} of {STEPS.length}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      step > s.number
                        ? "bg-fbs-green border-fbs-green text-black"
                        : step === s.number
                          ? "border-fbs-green text-fbs-green bg-transparent"
                          : "border-fbs-border text-gray-600 bg-transparent"
                    }`}>
                    {step > s.number ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      s.number
                    )}
                  </div>
                  <p
                    className={`text-xs mt-1 hidden sm:block ${step >= s.number ? "text-fbs-green" : "text-gray-600"}`}>
                    {s.label}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 sm:mx-2 mt-[-16px] transition-all ${step > s.number ? "bg-fbs-green" : "bg-fbs-border"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-fbs-darker border border-fbs-border rounded-2xl px-4 py-6 sm:px-8 sm:py-8 max-h-[75vh] overflow-y-auto">
          {/* ── Step 1 — Identity ── */}
          {step === 1 && (
            <div>
              <h2 className="font-heading text-xl font-bold text-white mb-1">
                Verify Your Identity
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Enter the FRN shared by FirstBit admin
              </p>
              <div className="space-y-4">
                {/* FRN */}
                <div>
                  <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                    FRN Number *
                  </label>
                  <input
                    value={form.frn}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        frn: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="FRN-01J0126/001"
                    className={`w-full bg-fbs-dark border ${errors.frn ? "border-red-600" : "border-fbs-border"} rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green transition-colors font-mono`}
                  />
                  {errors.frn && (
                    <p className="text-red-400 text-xs mt-1">{errors.frn}</p>
                  )}
                  {form.frn &&
                    !errors.frn &&
                    batchInfo?.batchCode &&
                    form.frn
                      .toUpperCase()
                      .includes(batchInfo.batchCode.toUpperCase()) && (
                      <p className="text-xs text-fbs-green mt-1">
                        ✓ FRN matches batch {batchInfo.batchName}
                      </p>
                    )}
                </div>

                {/* Email + OTP */}
                <div>
                  <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                    Email Address *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, email: e.target.value }));
                        setOtpSent(false);
                        setOtpVerified(false);
                        setOtpValue("");
                      }}
                      placeholder="your@email.com"
                      disabled={otpVerified}
                      className={`flex-1 bg-fbs-dark border ${errors.email ? "border-red-600" : otpVerified ? "border-fbs-green" : "border-fbs-border"} rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green transition-colors disabled:opacity-60`}
                    />
                    {!otpVerified && (
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={otpLoading}
                        className="w-full sm:w-auto px-4 py-2.5 bg-fbs-green hover:bg-fbs-yellow text-black text-xs font-semibold rounded-lg transition disabled:opacity-50 whitespace-nowrap">
                        {otpLoading
                          ? "Sending..."
                          : otpSent
                            ? "Resend OTP"
                            : "Send OTP"}
                      </button>
                    )}
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                  )}
                  {otpVerified && (
                    <p className="text-fbs-green text-xs mt-1">
                      ✓ Email verified successfully
                    </p>
                  )}
                  {errors.emailOtp && !otpVerified && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.emailOtp}
                    </p>
                  )}
                </div>

                {otpSent && !otpVerified && (
                  <div>
                    <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                      Enter OTP *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={otpValue}
                        maxLength={6}
                        onChange={(e) => setOtpValue(e.target.value)}
                        placeholder="6-digit OTP"
                        className="flex-1 bg-fbs-dark border border-fbs-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green tracking-widest text-center text-lg"
                      />
                      <button
                        type="button"
                        onClick={verifyOtp}
                        disabled={otpLoading}
                        className="w-full sm:w-auto px-4 py-2.5 bg-fbs-green hover:bg-fbs-yellow text-black text-xs font-semibold rounded-lg transition disabled:opacity-50">
                        {otpLoading ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      OTP sent to{" "}
                      <span className="text-fbs-green">{form.email}</span>
                    </p>
                    {otpError && (
                      <p className="text-red-400 text-xs mt-1">{otpError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2 — Personal ── */}
          {step === 2 && (
            <div>
              <h2 className="font-heading text-xl font-bold text-white mb-1">
                Personal Details
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Fill in your personal information
              </p>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  name="fullName"
                  required
                  errors={errors}
                  placeholder="First Name - Middle Name - Last Name"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Mobile Number"
                    name="mobile"
                    required
                    errors={errors}
                    placeholder="9876543210"
                    value={form.mobile}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, mobile: e.target.value }))
                    }
                  />
                  <Input
                    label="WhatsApp Number"
                    name="whatsapp"
                    required
                    errors={errors}
                    placeholder="9876543210"
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, whatsapp: e.target.value }))
                    }
                  />
                </div>
                <Input
                  label="Date of Birth"
                  name="dob"
                  required
                  type="date"
                  errors={errors}
                  value={form.dob}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dob: e.target.value }))
                  }
                />

                {/* Gender — Male and Female only */}
                <div>
                  <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                    Gender *
                  </label>
                  <div className="flex gap-3">
                    {["MALE", "FEMALE"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, gender: g }))}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition ${
                          form.gender === g
                            ? "bg-fbs-green text-black border-fbs-green"
                            : "bg-fbs-dark border-fbs-border text-gray-400 hover:border-fbs-green"
                        }`}>
                        {g.charAt(0) + g.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                  {errors.gender && (
                    <p className="text-red-400 text-xs mt-1">{errors.gender}</p>
                  )}
                </div>

                <div>
                  <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                    Are you currently employed? *
                  </label>
                  <div className="flex gap-3">
                    {[
                      { label: "Yes", value: "true" },
                      { label: "No", value: "false" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, employed: opt.value }))
                        }
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition ${
                          form.employed === opt.value
                            ? "bg-fbs-green text-black border-fbs-green"
                            : "bg-fbs-dark border-fbs-border text-gray-400 hover:border-fbs-green"
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {errors.employed && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.employed}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3 — Education ── */}
          {/* Step 3 — Education */}
          {step === 3 && (
            <div>
              <h2 className="font-heading text-xl font-bold text-white mb-1">
                Education Details
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Tell us about your academic background
              </p>
              <div className="space-y-4">
                {/* Graduation Status */}
                <div>
                  <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                    Have you completed your graduation? *
                  </label>
                  <div className="flex gap-3">
                    {[
                      { label: "Yes", value: "true" },
                      { label: "No, still pursuing", value: "false" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            graduationCompleted: opt.value,
                          }))
                        }
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition ${
                          form.graduationCompleted === opt.value
                            ? "bg-fbs-green text-black border-fbs-green"
                            : "bg-fbs-dark border-fbs-border text-gray-400 hover:border-fbs-green"
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {errors.graduationCompleted && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.graduationCompleted}
                    </p>
                  )}
                </div>

                {/* Degree Type */}
                <div>
                  <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                    Degree *
                  </label>
                  <select
                    value={form.degreeType || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, degreeType: e.target.value }))
                    }
                    className={`w-full bg-fbs-dark border ${errors.degreeType ? "border-red-600" : "border-fbs-border"} rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-fbs-green`}>
                    <option value="">Select degree...</option>
                    {DEGREE_TYPES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {errors.degreeType && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.degreeType}
                    </p>
                  )}
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                    Branch / Specialization *
                  </label>
                  <select
                    value={showCustomBranch ? "Other" : form.branch || ""}
                    onChange={(e) => {
                      if (e.target.value === "Other") {
                        setShowCustomBranch(true);
                        setForm((f) => ({ ...f, branch: "" }));
                      } else {
                        setShowCustomBranch(false);
                        setForm((f) => ({ ...f, branch: e.target.value }));
                      }
                    }}
                    className={`w-full bg-fbs-dark border ${errors.branch ? "border-red-600" : "border-fbs-border"} rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-fbs-green`}>
                    <option value="">Select branch...</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  {showCustomBranch && (
                    <input
                      value={form.branch}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, branch: e.target.value }))
                      }
                      placeholder="Enter your branch/specialization"
                      className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green mt-2"
                    />
                  )}
                  {errors.branch && (
                    <p className="text-red-400 text-xs mt-1">{errors.branch}</p>
                  )}
                </div>

                {/* Graduation Year */}
                <div>
                  <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                    {form.graduationCompleted === "true"
                      ? "Graduation Year *"
                      : "Expected Graduation Year *"}
                  </label>
                  <select
                    value={form.graduationYear || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, graduationYear: e.target.value }))
                    }
                    className={`w-full bg-fbs-dark border ${errors.graduationYear ? "border-red-600" : "border-fbs-border"} rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-fbs-green`}>
                    <option value="">Select year...</option>
                    {Array.from({ length: 12 }, (_, i) => 2018 + i).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  {errors.graduationYear && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.graduationYear}
                    </p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                    State *
                  </label>
                  <select
                    value={form.collegeState || ""}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        collegeState: e.target.value,
                        collegeDistrict: "",
                        collegeName: "",
                      }));
                      setCollegeSearch("");
                      setShowCustomCollege(false);
                    }}
                    className={`w-full bg-fbs-dark border ${errors.collegeState ? "border-red-600" : "border-fbs-border"} rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-fbs-green`}>
                    <option value="">Select state...</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.collegeState && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.collegeState}
                    </p>
                  )}
                </div>

                {/* District — Maharashtra only */}
                {form.collegeState === "Maharashtra" && (
                  <div>
                    <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                      District *
                    </label>
                    <select
                      value={form.collegeDistrict || ""}
                      onChange={(e) => {
                        setForm((f) => ({
                          ...f,
                          collegeDistrict: e.target.value,
                          collegeName: "",
                        }));
                        setCollegeSearch("");
                        setShowCustomCollege(false);
                      }}
                      className={`w-full bg-fbs-dark border ${errors.collegeDistrict ? "border-red-600" : "border-fbs-border"} rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-fbs-green`}>
                      <option value="">Select district...</option>
                      {MAHARASHTRA_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    {errors.collegeDistrict && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.collegeDistrict}
                      </p>
                    )}
                  </div>
                )}

                {/* College Search */}
                {(form.collegeState === "Maharashtra"
                  ? form.collegeDistrict
                  : form.collegeState) && (
                  <div>
                    <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                      College Name *
                    </label>
                    {!showCustomCollege ? (
                      <>
                        <input
                          value={collegeSearch}
                          onChange={(e) => {
                            setCollegeSearch(e.target.value);
                            setForm((f) => ({ ...f, collegeName: "" }));
                          }}
                          placeholder="Type to search college..."
                          className={`w-full bg-fbs-dark border ${errors.collegeName ? "border-red-600" : "border-fbs-border"} rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green`}
                        />
                        {/* College suggestions */}
                        {collegeSearch.trim().length >= 2 && (
                          <div className="mt-1 bg-fbs-dark border border-fbs-border rounded-lg max-h-48 overflow-y-auto">
                            {(() => {
                              const list =
                                form.collegeState === "Maharashtra"
                                  ? MAHARASHTRA_COLLEGES[
                                      form.collegeDistrict
                                    ] || []
                                  : [];
                              const filtered = list.filter((c) =>
                                c
                                  .toLowerCase()
                                  .includes(collegeSearch.toLowerCase()),
                              );
                              return filtered.length > 0 ? (
                                <>
                                  {filtered.map((c) => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => {
                                        setForm((f) => ({
                                          ...f,
                                          collegeName: c,
                                        }));
                                        setCollegeSearch(c);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-fbs-card transition border-b border-fbs-border/50 last:border-0">
                                      {c}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowCustomCollege(true);
                                      setCollegeSearch("");
                                      setForm((f) => ({
                                        ...f,
                                        collegeName: "",
                                      }));
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-fbs-yellow hover:bg-fbs-card transition">
                                    + My college is not listed — enter manually
                                  </button>
                                </>
                              ) : (
                                <div className="px-4 py-3">
                                  <p className="text-gray-500 text-sm mb-2">
                                    No colleges found
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowCustomCollege(true);
                                      setCollegeSearch("");
                                      setForm((f) => ({
                                        ...f,
                                        collegeName: "",
                                      }));
                                    }}
                                    className="text-fbs-yellow text-sm hover:text-fbs-green transition">
                                    + Enter college name manually
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        {form.collegeName && (
                          <p className="text-fbs-green text-xs mt-1">
                            ✓ Selected: {form.collegeName}
                          </p>
                        )}
                        {/* Show manual option upfront for non-Maharashtra */}
                        {form.collegeState !== "Maharashtra" && (
                          <button
                            type="button"
                            onClick={() => setShowCustomCollege(true)}
                            className="text-xs text-gray-500 hover:text-fbs-yellow mt-1 transition">
                            Enter college name manually instead
                          </button>
                        )}
                      </>
                    ) : (
                      <div>
                        <input
                          value={form.collegeName}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              collegeName: e.target.value,
                            }))
                          }
                          placeholder="Enter your college name"
                          className={`w-full bg-fbs-dark border ${errors.collegeName ? "border-red-600" : "border-fbs-border"} rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomCollege(false);
                            setForm((f) => ({ ...f, collegeName: "" }));
                            setCollegeSearch("");
                          }}
                          className="text-xs text-gray-500 hover:text-fbs-green mt-1 transition">
                          ← Search from list instead
                        </button>
                      </div>
                    )}
                    {errors.collegeName && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.collegeName}
                      </p>
                    )}
                  </div>
                )}

                {/* University */}
                <div>
                  <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                    University Name *
                  </label>
                  <input
                    value={form.universityName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, universityName: e.target.value }))
                    }
                    placeholder="e.g. Savitribai Phule Pune University"
                    className={`w-full bg-fbs-dark border ${errors.universityName ? "border-red-600" : "border-fbs-border"} rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green`}
                  />
                  {errors.universityName && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.universityName}
                    </p>
                  )}
                </div>

                {/* College Location */}
                <div>
                  <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2">
                    College Location *
                  </label>
                  <input
                    value={form.collegeLocation}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        collegeLocation: e.target.value,
                      }))
                    }
                    placeholder="e.g. Pune, Maharashtra"
                    className={`w-full bg-fbs-dark border ${errors.collegeLocation ? "border-red-600" : "border-fbs-border"} rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green`}
                  />
                  {errors.collegeLocation && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.collegeLocation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4 — Social ── */}
          {step === 4 && (
            <div>
              <h2 className="font-heading text-xl font-bold text-white mb-1">
                Social Profiles
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Share your social media handles (optional)
              </p>

              {/* Consent notice */}
              <div className="bg-fbs-green/5 border border-fbs-green/20 rounded-xl px-4 py-4 mb-6">
                <p className="text-xs text-white font-semibold mb-1">
                  📢 Placement Tagging Consent
                </p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  By sharing your social media handles, you give FirstBit
                  Solutions consent to tag you in placement announcements,
                  success stories, and promotional posts — including your video
                  bytes and testimonials — on our official social media
                  channels. This helps showcase your achievement and builds your
                  professional visibility.
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Both fields are optional. You may skip if you prefer not to be
                  tagged.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5" /> Instagram ID
                    <span className="text-gray-600 font-normal normal-case">
                      (optional)
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      @
                    </span>
                    <input
                      value={form.instagramId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          instagramId: e.target.value.replace("@", ""),
                        }))
                      }
                      placeholder="your_instagram_handle"
                      className="w-full bg-fbs-dark border border-fbs-border rounded-lg pl-8 pr-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-fbs-green text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5" /> LinkedIn Profile URL
                    <span className="text-gray-600 font-normal normal-case">
                      (optional)
                    </span>
                  </label>
                  <input
                    value={form.linkedinId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, linkedinId: e.target.value }))
                    }
                    placeholder="https://linkedin.com/in/yourname"
                    className="w-full bg-fbs-dark border border-fbs-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green transition-colors"
                  />
                </div>
                <div className="bg-fbs-dark border border-fbs-border rounded-xl px-4 py-3 mt-2">
                  <p className="text-xs text-gray-500">
                    You can skip this step if you don't have these profiles yet
                    or prefer not to share. Click{" "}
                    <span className="text-fbs-green">Next</span> to continue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5 — Contacts ── */}
          {step === 5 && (
            <div>
              <h2 className="font-heading text-xl font-bold text-white mb-1">
                Emergency Contact Details
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Add at least one parent or guardian contact
              </p>

              {/* Emergency contact notice */}
              <div className="bg-fbs-yellow/5 border border-fbs-yellow/20 rounded-xl px-4 py-4 mb-6">
                <p className="text-xs text-fbs-yellow font-semibold mb-1">
                  ⚠ Important — Emergency Contact
                </p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  The contact number you provide here will be used as an{" "}
                  <span className="text-white font-medium">
                    emergency contact
                  </span>
                  . Please ensure this is a person who is:
                </p>
                <ul className="text-xs text-gray-400 mt-2 space-y-1 list-none pl-2">
                  <li>• Reachable at all times</li>
                  <li>
                    • Authorized to make decisions on your behalf in any
                    critical situation
                  </li>
                  <li>
                    • Aware that they are listed as your emergency contact at
                    FirstBit Solutions
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                {form.contacts.map((contact, i) => (
                  <div
                    key={i}
                    className="bg-fbs-dark border border-fbs-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-fbs-yellow uppercase tracking-widest">
                        Contact {i + 1}
                      </span>
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() => removeContact(i)}
                          className="text-red-400 hover:text-red-300 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-1.5">
                            Contact Type
                          </label>
                          <select
                            value={contact.contactType}
                            onChange={(e) =>
                              updateContact(i, "contactType", e.target.value)
                            }
                            className="w-full bg-fbs-darker border border-fbs-border rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-fbs-green">
                            <option value="PARENT">Parent</option>
                            <option value="GUARDIAN">Guardian</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-1.5">
                            Relation *
                          </label>
                          <select
                            value={contact.relation}
                            onChange={(e) =>
                              updateContact(i, "relation", e.target.value)
                            }
                            className={`w-full bg-fbs-darker border ${errors[`contact_${i}_relation`] ? "border-red-600" : "border-fbs-border"} rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-fbs-green`}>
                            <option value="">Select...</option>
                            {RELATIONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          {errors[`contact_${i}_relation`] && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors[`contact_${i}_relation`]}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-1.5">
                          Name *
                        </label>
                        <input
                          value={contact.name}
                          onChange={(e) =>
                            updateContact(i, "name", e.target.value)
                          }
                          placeholder="Full name"
                          className={`w-full bg-fbs-darker border ${errors[`contact_${i}_name`] ? "border-red-600" : "border-fbs-border"} rounded-lg px-4 py-2 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green`}
                        />
                        {errors[`contact_${i}_name`] && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors[`contact_${i}_name`]}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-1.5">
                            Phone *
                          </label>
                          <input
                            value={contact.phone}
                            onChange={(e) =>
                              updateContact(i, "phone", e.target.value)
                            }
                            placeholder="9876543210"
                            className={`w-full bg-fbs-darker border ${errors[`contact_${i}_phone`] ? "border-red-600" : "border-fbs-border"} rounded-lg px-4 py-2 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green`}
                          />
                          {errors[`contact_${i}_phone`] && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors[`contact_${i}_phone`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-1.5">
                            Email
                          </label>
                          <input
                            value={contact.email}
                            onChange={(e) =>
                              updateContact(i, "email", e.target.value)
                            }
                            placeholder="optional"
                            className="w-full bg-fbs-darker border border-fbs-border rounded-lg px-4 py-2 text-white text-sm placeholder-gray-600 outline-none focus:border-fbs-green"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addContact}
                  className="w-full py-2.5 border border-dashed border-fbs-border rounded-xl text-sm text-gray-400 hover:border-fbs-green hover:text-fbs-green transition flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add Another Contact
                </button>
              </div>
            </div>
          )}

          {/* ── Step 6 — Documents & Terms ── */}
          {step === 6 && (
            <div>
              <h2 className="font-heading text-xl font-bold text-white mb-1">
                Documents & Declaration
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Upload your photo and accept the terms
              </p>
              <div className="space-y-6">
                {/* Photo upload */}
                <div>
                  <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-3">
                    Recent Photograph *
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-fbs-dark border-2 border-dashed border-fbs-border flex items-center justify-center flex-shrink-0">
                      {photoLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-fbs-green" />
                      ) : photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer">
                        <div
                          className={`w-full py-2.5 border ${errors.photo ? "border-red-600" : "border-fbs-border"} rounded-lg text-sm text-center text-gray-400 hover:border-fbs-green hover:text-fbs-green transition`}>
                          {form.photoUrl
                            ? "✓ Photo uploaded — click to change"
                            : "Click to upload photo"}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                      <p className="text-xs text-gray-600 mt-1.5">
                        JPG, PNG up to 5MB. Recent passport-size photo
                        preferred.
                      </p>
                      {errors.photo && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.photo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div>
                  <label className="block text-fbs-green text-xs font-semibold uppercase tracking-widest mb-3">
                    Terms & Conditions *
                  </label>
                  <div className="bg-fbs-dark border border-fbs-border rounded-xl p-4 max-h-64 overflow-y-auto text-xs text-gray-400 leading-relaxed space-y-3 mb-4">
                    <p className="font-bold text-white text-sm">
                      Terms & Conditions – FirstBit Solutions
                    </p>

                    <div>
                      <p className="text-fbs-green font-semibold mb-1">
                        1. Fee Refund & Internship Policy
                      </p>
                      <p>
                        Fees are non-refundable after{" "}
                        {batchInfo?.refundDate
                          ? new Date(batchInfo.refundDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )
                          : "the refund deadline"}
                        , regardless of circumstances (exams, medical, personal
                        reasons, etc.).
                      </p>
                      <p className="text-fbs-yellow mt-1 font-medium">
                        IMPORTANT: If you enroll for Internship, the Money
                        Refund Policy will not be applicable to you.
                      </p>
                    </div>

                    <div>
                      <p className="text-fbs-green font-semibold mb-1">
                        2. Admission & Batch Changes
                      </p>
                      <p>• Admission/seat replacement is not allowed.</p>
                      <p>
                        • Shifting to an online batch is only permitted until
                        22nd April 2026, subject to Training + Accounts team
                        decision.
                      </p>
                      <p>
                        • Moving from offline to online forfeits any discounts
                        or concessions.
                      </p>
                    </div>

                    <div>
                      <p className="text-fbs-green font-semibold mb-1">
                        3. Training & Placement
                      </p>
                      <p>
                        FirstBit Solutions focuses on training. Placement
                        assistance is a privilege extended to deserving students
                        — it is not a guarantee.
                      </p>
                    </div>

                    <div>
                      <p className="text-fbs-green font-semibold mb-1">
                        4. Student Conduct
                      </p>
                      <p>
                        Misconduct, indiscipline, or improper behavior with
                        faculty or peers will result in immediate admission
                        cancellation without any refund.
                      </p>
                    </div>

                    <div>
                      <p className="text-fbs-green font-semibold mb-1">
                        5. Batch Shifting Policy
                      </p>
                      <p>
                        Batch shifting is permitted only during the refund
                        policy period and is subject to Training Team approval.
                        After the refund period ends, batch shifting will not be
                        allowed under any circumstances. Students may only
                        attend revision sessions, subject to availability and
                        Training Team discretion. No permanent batch change will
                        be granted.
                      </p>
                    </div>

                    <div>
                      <p className="text-fbs-green font-semibold mb-1">
                        6. Course Materials
                      </p>
                      <p>
                        All course materials are the intellectual property of
                        FirstBit Solutions. Sharing or republishing in any form
                        is a legal offense.
                      </p>
                    </div>

                    <div>
                      <p className="text-fbs-green font-semibold mb-1">
                        7. Social Media & Promotional Content
                      </p>
                      <p>
                        FirstBit Solutions may use your placement success,
                        feedback, photographs, and video bytes for promotional
                        and institutional purposes on social media and other
                        channels.
                      </p>
                    </div>

                    <div>
                      <p className="text-fbs-green font-semibold mb-1">
                        8. WhatsApp Group Conduct
                      </p>
                      <p>
                        Respect for all group members is mandatory.
                        Misbehaviour, harassment, or spamming will not be
                        tolerated and may result in admission cancellation
                        without refund.
                      </p>
                    </div>

                    <div className="border-t border-fbs-border pt-3">
                      <p className="font-semibold text-white mb-2">
                        Self-Declaration
                      </p>
                      <p>
                        • I confirm that all information provided in this form
                        is accurate and true.
                      </p>
                      <p>
                        • I acknowledge that all official communication will be
                        sent to my registered email address.
                      </p>
                      <p>
                        • I agree to abide by all current and future policies of
                        FirstBit Solutions.
                      </p>
                      <p>
                        • By accepting these terms, I voluntarily waive any
                        objections or disputes regarding the stated conditions.
                      </p>
                    </div>
                  </div>

                  <label
                    className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition ${
                      form.termsAccepted
                        ? "border-fbs-green bg-fbs-green/5"
                        : errors.terms
                          ? "border-red-600"
                          : "border-fbs-border"
                    }`}>
                    <input
                      type="checkbox"
                      checked={form.termsAccepted}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          termsAccepted: e.target.checked,
                        }))
                      }
                      className="mt-0.5 accent-fbs-green w-4 h-4 flex-shrink-0"
                    />
                    <span className="text-sm text-gray-300 leading-relaxed">
                      I have read and understood all Terms & Conditions above. I
                      confirm that the information provided is accurate and I
                      voluntarily agree to abide by all policies of FirstBit
                      Solutions. I understand that submitting this form
                      constitutes a binding agreement between me and FirstBit
                      Solutions.
                    </span>
                  </label>
                  {errors.terms && (
                    <p className="text-red-400 text-xs mt-1">{errors.terms}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mt-4 bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3">
              {submitError}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-5 py-2.5 border border-fbs-border rounded-lg text-sm text-gray-400 hover:bg-fbs-card transition">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={step === 1 && !otpVerified}
                className="flex-1 flex items-center justify-center gap-2 bg-fbs-green hover:bg-fbs-yellow text-black font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-fbs-green hover:bg-fbs-yellow text-black font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50">
                {submitLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          FirstBit Solutions • Admission Form • {batchInfo?.batchName}
        </p>
      </div>
    </div>
  );
}
