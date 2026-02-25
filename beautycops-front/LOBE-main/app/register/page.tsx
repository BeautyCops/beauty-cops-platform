"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

/* =========================
   Types / Constants
   ========================= */

type GCCCountry = {
  key: "SA" | "AE" | "QA" | "KW" | "BH" | "OM";
  nameAr: string;
  dialCode: string;
  flag: string;
};

const GCC_COUNTRIES: GCCCountry[] = [
  { key: "SA", nameAr: "المملكة العربية السعودية", dialCode: "+966", flag: "🇸🇦" },
  { key: "AE", nameAr: "الإمارات", dialCode: "+971", flag: "🇦🇪" },
  { key: "QA", nameAr: "قطر", dialCode: "+974", flag: "🇶🇦" },
  { key: "KW", nameAr: "الكويت", dialCode: "+965", flag: "🇰🇼" },
  { key: "BH", nameAr: "البحرين", dialCode: "+973", flag: "🇧🇭" },
  { key: "OM", nameAr: "عُمان", dialCode: "+968", flag: "🇴🇲" },
];

type FieldErrors = {
  phone?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  form?: string;
};

type TouchedState = {
  phone?: boolean;
  email?: boolean;
  password?: boolean;
  passwordConfirm?: boolean;
};

/* =========================
   Helpers: Safe JSON parsing
   ========================= */

async function safeJson(res: Response): Promise<unknown | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/* =========================
   Helpers: Email normalization + validation
   ========================= */

function normalizeEmail(input: string): string {
  return (input || "")
    .trim()
    .replace(/\s+/g, "") // no spaces inside emails
    .replace(/。/g, ".")
    .replace(/،/g, ".")
    .replace(/＠/g, "@");
}

function validateEmail(input: string): string | null {
  const email = normalizeEmail(input);

  if (!email) return "الرجاء إدخال البريد الإلكتروني";
  if (email.length > 254) return "البريد الإلكتروني طويل جدًا";
  if (email.includes("..")) return "البريد الإلكتروني غير صحيح (نقطتان متتاليتان)";
  if (email.startsWith(".") || email.endsWith(".")) return "البريد الإلكتروني غير صحيح (النقطة في مكان خاطئ)";
  if (!email.includes("@")) return "البريد الإلكتروني غير صحيح (لا يوجد @)";
  if (email.split("@").length !== 2) return "البريد الإلكتروني غير صحيح";

  const [local, domain] = email.split("@");

  if (!local) return "البريد الإلكتروني غير صحيح (قبل @ مفقود)";
  if (!domain) return "البريد الإلكتروني غير صحيح (بعد @ مفقود)";
  if (local.length > 64) return "البريد الإلكتروني غير صحيح (الجزء قبل @ طويل)";
  if (!domain.includes(".")) return "البريد الإلكتروني غير صحيح (الدومين ناقص)";

  const parts = domain.split(".");
  const tld = parts[parts.length - 1] || "";
  if (tld.length < 2) return "البريد الإلكتروني غير صحيح (امتداد الدومين ناقص)";

  const basic =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
  if (!basic.test(email)) return "البريد الإلكتروني غير صحيح";

  return null;
}

/* =========================
   Helpers: Friendly server messages
   ========================= */

function mapServerEmailMessage(msg: string): string {
  const m = (msg || "").toLowerCase();

  if (m.includes("enter a valid email") || m.includes("valid email")) return "البريد الإلكتروني غير صحيح";
  if (m.includes("already") && (m.includes("email") || m.includes("exists"))) return "هذا البريد مستخدم مسبقًا";
  if (m.includes("required")) return "الرجاء إدخال البريد الإلكتروني";

  return msg;
}

/* =========================
   Helpers: Extract API errors
   ========================= */

function extractFieldErrors(data: unknown): FieldErrors {
  const out: FieldErrors = {};
  if (!data || typeof data !== "object") return out;

  const d = data as Record<string, unknown>;

  if (typeof d.detail === "string") out.form = d.detail;

  for (const key of ["phone", "email", "password"] as const) {
    const v = d[key];
    if (Array.isArray(v) && v[0]) out[key] = String(v[0]);
    else if (typeof v === "string") out[key] = v;
  }

  const nonField = d.non_field_errors;
  if (Array.isArray(nonField) && nonField[0]) out.form = String(nonField[0]);

  if (!out.form && typeof d.message === "string") out.form = d.message;

  if (out.email) out.email = mapServerEmailMessage(out.email);

  return out;
}

/* =========================
   Password rules
   ========================= */

type PasswordRuleKey = "minLen" | "latin" | "number" | "allowed";

function getPasswordRuleStatus(pwd: string): Record<PasswordRuleKey, boolean> {
  const value = pwd ?? "";
  return {
    minLen: value.length >= 8,
    latin: /[A-Za-z]/.test(value),
    number: /\d/.test(value),
    allowed: /^[A-Za-z0-9@!#$%^&*()_+\-=[\]{};:'"\\|,.<>/?]+$/.test(value),
  };
}

function getPasswordFirstError(pwd: string): string | null {
  const s = getPasswordRuleStatus(pwd);
  if (!s.minLen) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  if (!s.latin) return "كلمة المرور يجب أن تحتوي على أحرف إنجليزية (A-Z أو a-z)";
  if (!s.number) return "كلمة المرور يجب أن تحتوي على أرقام (0-9)";
  if (!s.allowed) return "كلمة المرور تحتوي على أحرف غير مسموحة";
  return null;
}

function validatePasswordConfirm(password: string, confirm: string): string | null {
  if (!confirm) return "الرجاء تأكيد كلمة المرور";
  if (password !== confirm) return "كلمتا المرور غير متطابقتين";
  return null;
}

/* =========================
   Component
   ========================= */

export default function RegisterPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"phone" | "email">("phone");

  // Phone mode
  const [country, setCountry] = useState<GCCCountry>(GCC_COUNTRIES[0]);
  const [nationalNumber, setNationalNumber] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Email mode
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [touched, setTouched] = useState<TouchedState>({});
  const [submitted, setSubmitted] = useState(false);

  const showPwdHints = submitted || !!touched.password;

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleBack = () => router.push("/");

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const fullPhone = useMemo(() => {
    const digits = (nationalNumber || "").replace(/\D/g, "");
    return `${country.dialCode}${digits}`;
  }, [country.dialCode, nationalNumber]);

  const validatePhone = (): string | null => {
    const digits = (nationalNumber || "").replace(/\D/g, "");
    if (!digits) return "الرجاء إدخال رقم الجوال";
    if (digits.length < 7 || digits.length > 12) return "رقم الجوال غير صحيح";
    return null;
  };

  const resetAlerts = () => {
    setErrors({});
    setSuccess(null);
  };

  const handleSwitchMode = (next: "phone" | "email") => {
    setMode(next);
    resetAlerts();
    setIsOpen(false);

    setTouched({});
    setSubmitted(false);

    setShowPassword(false);
    setShowPasswordConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetAlerts();
    setSubmitted(true);

    if (!API_BASE_URL) {
      setErrors({ form: "إعدادات النظام ناقصة: NEXT_PUBLIC_API_BASE_URL غير معرف" });
      return;
    }

    const nextErrors: FieldErrors = {};
    const payload: Record<string, unknown> = {};

    if (mode === "phone") {
      const phoneError = validatePhone();
      if (phoneError) nextErrors.phone = phoneError;
      payload.phone = fullPhone;
    } else {
      const emailErr = validateEmail(email);
      if (emailErr) nextErrors.email = emailErr;

      const pwdErr = getPasswordFirstError(password);
      if (pwdErr) nextErrors.password = pwdErr;

      const pwdConfirmErr = validatePasswordConfirm(password, passwordConfirm);
      if (pwdConfirmErr) nextErrors.passwordConfirm = pwdConfirmErr;

      payload.email = normalizeEmail(email);
      payload.password = password;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/registration/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(response);

      if (!response.ok) {
        const serverErrors = extractFieldErrors(data);
        setErrors(Object.keys(serverErrors).length ? serverErrors : { form: "فشل إنشاء الحساب" });
        return;
      }

      const d = (data ?? {}) as Record<string, unknown>;
      const token = (d.token || d.access_token || d.access) as string | undefined;
      const user = (d.user || d.data) as unknown;

      if (token) {
        localStorage.setItem("authToken", token);
        if (user) localStorage.setItem("currentUser", JSON.stringify(user));
        router.replace("/");
        return;
      }

      setSuccess("تم إنشاء الحساب بنجاح، سيتم تحويلك للمتابعة");
      redirectTimerRef.current = setTimeout(() => {
        router.push(mode === "phone" ? "/verify" : "/login");
      }, 900);
    } catch (err) {
      console.error(err);
      setErrors({ form: "حدث خطأ غير متوقع، الرجاء المحاولة لاحقاً" });
    } finally {
      setIsLoading(false);
    }
  };

  const pwdStatus = useMemo(() => getPasswordRuleStatus(password), [password]);
  const isPwdAllValid = useMemo(() => Object.values(pwdStatus).every(Boolean), [pwdStatus]);

  const showPhoneError = (submitted || touched.phone) && !!errors.phone;
  const showEmailError = (submitted || touched.email) && !!errors.email;
  const showPasswordError = (submitted || touched.password) && !!errors.password;
  const showPasswordConfirmError = (submitted || touched.passwordConfirm) && !!errors.passwordConfirm;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-natural-white" dir="rtl">
      {/* Mobile Header */}
      <header className="flex md:hidden w-full items-center justify-center px-4 pt-8 pb-0 flex-shrink-0">
        <div className="w-full max-w-md relative flex items-center justify-center h-16">
          <h1 className="text-xl font-medium text-natural-primary-text">إنشاء حساب</h1>
          <button
            type="button"
            onClick={handleBack}
            className="absolute right-0 flex h-6 w-6 items-center justify-center text-brand-primary hover:bg-brand-primary-light-bg rounded-lg transition-colors"
            aria-label="العودة"
            title="العودة"
          >
            <Icon name="CaretRight" size={24} category="arrows" className="text-brand-primary stroke-brand-primary" />
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-start md:items-center justify-center px-4 md:px-6 lg:px-8 pt-24 md:pt-0 pb-8 overflow-y-auto">
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-center relative mb-10 lg:mb-12">
            <h1 className="text-2xl lg:text-3xl font-medium text-natural-primary-text">إنشاء حساب جديد</h1>
            <button
              type="button"
              onClick={handleBack}
              className="absolute right-0 flex h-8 w-8 items-center justify-center text-brand-primary hover:bg-brand-primary-light-bg rounded-lg transition-colors"
              aria-label="العودة"
              title="العودة"
            >
              <Icon
                name="CaretRight"
                size={24}
                category="arrows"
                className="text-brand-primary stroke-brand-primary md:scale-110"
              />
            </button>
          </div>

          {/* Mode Switch */}
          <div className="mb-6">
            <div className="flex w-full rounded-lg border border-natural-light-border bg-white p-1">
              <button
                type="button"
                onClick={() => handleSwitchMode("phone")}
                aria-pressed={mode === "phone"}
                className={`flex-1 h-10 text-sm font-medium transition-colors rounded-md ${
                  mode === "phone"
                    ? "bg-brand-buttons-status-default text-white"
                    : "bg-transparent text-natural-primary-text hover:bg-brand-primary-light-bg"
                }`}
              >
                رقم الجوال
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode("email")}
                aria-pressed={mode === "email"}
                className={`flex-1 h-10 text-sm font-medium transition-colors rounded-md ${
                  mode === "email"
                    ? "bg-brand-buttons-status-default text-white"
                    : "bg-transparent text-natural-primary-text hover:bg-brand-primary-light-bg"
                }`}
              >
                البريد الإلكتروني
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
            {errors.form && <p className="text-status-error text-sm mb-4 text-right">{errors.form}</p>}
            {success && <p className="text-status-success text-sm mb-4 text-right">{success}</p>}

            <div className="flex flex-col gap-4 md:gap-5 lg:gap-6">
              {/* PHONE MODE */}
              {mode === "phone" && (
                <div className="w-full">
                  <label htmlFor="phone" className="block text-sm md:text-base mb-2 text-right text-natural-primary-text">
                    رقم الجوال <span className="text-status-error mr-0.5">*</span>
                  </label>

                  <div className="relative" ref={dropdownRef}>
                    <div
                      className={`flex items-center w-full h-12 border rounded-lg overflow-hidden bg-white ${
                        showPhoneError ? "border-status-error" : "border-natural-light-border"
                      }`}
                    >
                      <div className="relative flex-1 h-full">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-natural-helper-text pointer-events-none select-none">
                          {country.dialCode}
                        </span>

                        <input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          className="w-full h-full pr-4 pl-20 outline-none"
                          placeholder="أدخل رقم الجوال"
                          value={nationalNumber}
                          onChange={(e) => {
                            setNationalNumber(e.target.value.replace(/\D/g, ""));
                            if ((submitted || touched.phone) && errors.phone) {
                              setErrors((p) => ({ ...p, phone: undefined }));
                            }
                          }}
                          onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                          required
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsOpen((v) => !v)}
                        className="h-full px-3 flex items-center gap-2 border-r border-natural-light-border bg-natural-white hover:bg-brand-primary-light-bg transition-colors"
                        aria-haspopup="listbox"
                        aria-expanded={isOpen}
                        aria-controls="country-listbox"
                        aria-label="اختيار الدولة"
                        title="اختيار الدولة"
                      >
                        <Icon
                          name="CaretDown"
                          size={18}
                          category="arrows"
                          className={`text-natural-helper-text transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                        <span className="text-base leading-none">{country.flag}</span>
                      </button>
                    </div>

                    {isOpen && (
                      <div
                        id="country-listbox"
                        role="listbox"
                        aria-label="اختر الدولة"
                        className="absolute z-50 mt-2 w-full rounded-xl border border-natural-light-border bg-white shadow-lg overflow-hidden"
                      >
                        {GCC_COUNTRIES.map((c) => (
                          <button
                            key={c.key}
                            type="button"
                            role="option"
                            aria-selected={c.key === country.key}
                            onClick={() => {
                              setCountry(c);
                              setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-natural-white transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-base leading-none">{c.flag}</span>
                              <span className="text-sm text-natural-primary-text">{c.nameAr}</span>
                            </div>
                            <span className="text-sm text-natural-helper-text">{c.dialCode}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {showPhoneError && <p className="text-status-error text-xs mt-2 text-right">{errors.phone}</p>}
                </div>
              )}

              {/* EMAIL MODE */}
              {mode === "email" && (
                <>
                  <div className="w-full">
                    <label htmlFor="email" className="block text-sm md:text-base mb-2 text-right text-natural-primary-text">
                      البريد الإلكتروني <span className="text-status-error mr-0.5">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="أدخل بريدك الإلكتروني"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if ((submitted || touched.email) && errors.email) {
                          setErrors((p) => ({ ...p, email: undefined }));
                        }
                      }}
                      onBlur={() => {
                        setTouched((p) => ({ ...p, email: true }));
                        const err = validateEmail(email);
                        if (err) setErrors((p) => ({ ...p, email: err }));
                      }}
                      required
                      className={`w-full h-12 px-4 rounded-lg border ${
                        showEmailError ? "border-status-error" : "border-natural-light-border"
                      }`}
                    />
                    {showEmailError && <p className="text-status-error text-xs mt-2 text-right">{errors.email}</p>}
                  </div>

                  <div className="w-full">
                    <label htmlFor="password" className="block text-sm md:text-base mb-2 text-right text-natural-primary-text">
                      كلمة المرور <span className="text-status-error mr-0.5">*</span>
                    </label>

                    <div
                      className={`flex items-center w-full h-12 rounded-lg border overflow-hidden bg-white ${
                        showPasswordError ? "border-status-error" : "border-natural-light-border"
                      }`}
                    >
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="أدخل كلمة المرور"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if ((submitted || touched.password) && errors.password) {
                            setErrors((p) => ({ ...p, password: undefined }));
                          }
                          if (passwordConfirm && errors.passwordConfirm) {
                            const err = validatePasswordConfirm(e.target.value, passwordConfirm);
                            setErrors((p) => ({ ...p, passwordConfirm: err ?? undefined }));
                          }
                        }}
                        onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                        required
                        className="w-full h-full px-4 outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="h-full px-3 flex items-center justify-center border-r border-natural-light-border bg-natural-white hover:bg-brand-primary-light-bg transition-colors"
                        aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                        title={showPassword ? "إخفاء" : "إظهار"}
                      >
                        <Icon
                          name={showPassword ? "EyeSlash" : "Eye"}
                          size={20}
                          category="security"
                          className="text-natural-helper-text"
                        />
                      </button>
                    </div>

                    {showPwdHints && !isPwdAllValid && (
                      <div className="mt-2 text-right text-xs leading-6">
                        <p className={pwdStatus.minLen ? "text-natural-helper-text" : "text-status-error"}>* 8 أحرف على الأقل</p>
                        <p className={pwdStatus.latin ? "text-natural-helper-text" : "text-status-error"}>* تحتوي على أحرف إنجليزية (A–Z أو a–z)</p>
                        <p className={pwdStatus.number ? "text-natural-helper-text" : "text-status-error"}>* تحتوي على رقم واحد على الأقل (0–9)</p>
                        <p className={pwdStatus.allowed ? "text-natural-helper-text" : "text-status-error"}>* أحرف مسموحة فقط (A-Z, 0-9, والرموز الشائعة)</p>
                      </div>
                    )}

                    {showPasswordError && <p className="text-status-error text-xs mt-2 text-right">{errors.password}</p>}
                  </div>

                  <div className="w-full">
                    <label
                      htmlFor="passwordConfirm"
                      className="block text-sm md:text-base mb-2 text-right text-natural-primary-text"
                    >
                      تأكيد كلمة المرور <span className="text-status-error mr-0.5">*</span>
                    </label>

                    <div
                      className={`flex items-center w-full h-12 rounded-lg border overflow-hidden bg-white ${
                        showPasswordConfirmError ? "border-status-error" : "border-natural-light-border"
                      }`}
                    >
                      <input
                        id="passwordConfirm"
                        type={showPasswordConfirm ? "text" : "password"}
                        placeholder="أعد إدخال كلمة المرور"
                        value={passwordConfirm}
                        onChange={(e) => {
                          setPasswordConfirm(e.target.value);
                          if ((submitted || touched.passwordConfirm) && errors.passwordConfirm) {
                            setErrors((p) => ({ ...p, passwordConfirm: undefined }));
                          }
                        }}
                        onBlur={() => {
                          setTouched((p) => ({ ...p, passwordConfirm: true }));
                          const err = validatePasswordConfirm(password, passwordConfirm);
                          if (err) setErrors((p) => ({ ...p, passwordConfirm: err }));
                        }}
                        required
                        className="w-full h-full px-4 outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPasswordConfirm((v) => !v)}
                        className="h-full px-3 flex items-center justify-center border-r border-natural-light-border bg-natural-white hover:bg-brand-primary-light-bg transition-colors"
                        aria-label={showPasswordConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                        title={showPasswordConfirm ? "إخفاء" : "إظهار"}
                      >
                        <Icon
                          name={showPasswordConfirm ? "EyeSlash" : "Eye"}
                          size={20}
                          category="security"
                          className="text-natural-helper-text"
                        />
                      </button>
                    </div>

                    {showPasswordConfirmError && (
                      <p className="text-status-error text-xs mt-2 text-right">{errors.passwordConfirm}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-8 rounded-lg bg-brand-buttons-status-default text-white font-medium disabled:bg-brand-buttons-status-disabled"
            >
              {isLoading ? "جاري إنشاء الحساب..." : mode === "phone" ? "التالي" : "إنشاء حساب"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-natural-helper-text">
              لديك حساب بالفعل؟{" "}
              <a href="/login" className="text-brand-primary hover:text-brand-buttons-status-hover">
                تسجيل الدخول
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}