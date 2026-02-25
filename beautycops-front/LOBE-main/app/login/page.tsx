"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

/* =========================
   Types
   ========================= */

type FieldErrors = {
  phone?: string;
  email?: string;
  password?: string;
  form?: string;
};

type TouchedState = {
  phone?: boolean;
  email?: boolean;
  password?: boolean;
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
    .replace(/\s+/g, "")
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

function mapServerLoginMessage(msg: string): string {
  const m = (msg || "").toLowerCase();

  // شائع في dj-rest-auth / DRF / simplejwt
  if (m.includes("unable to log in") || m.includes("invalid") || m.includes("incorrect")) {
    return "بيانات الدخول غير صحيحة";
  }
  if (m.includes("no active account")) return "لا يوجد حساب نشط بهذه البيانات";
  if (m.includes("deactivated") || m.includes("disabled")) return "هذا الحساب غير مفعل";
  if (m.includes("required")) return "الرجاء تعبئة الحقول المطلوبة";

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
  if (out.form) out.form = mapServerLoginMessage(out.form);

  return out;
}

/* =========================
   Phone validation (نفس الريجستر تقريبًا)
   ========================= */

function validatePhoneRaw(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  if (!digits) return "الرجاء إدخال رقم الجوال";
  if (digits.length < 7 || digits.length > 15) return "رقم الجوال غير صحيح";
  return null;
}

/* =========================
   Component
   ========================= */

export default function LoginPage() {
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [mode, setMode] = useState<"phone" | "email">("phone");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [touched, setTouched] = useState<TouchedState>({});
  const [submitted, setSubmitted] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const resetAlerts = () => setErrors({});

  const handleBack = () => router.push("/");

  const handleSwitchMode = (next: "phone" | "email") => {
    setMode(next);
    resetAlerts();
    setTouched({});
    setSubmitted(false);
    // ما نمسح القيم عشان لو رجع/بدّل بسرعة ما ينهبل
  };

  const showPhoneError = (submitted || touched.phone) && !!errors.phone;
  const showEmailError = (submitted || touched.email) && !!errors.email;
  const showPasswordError = (submitted || touched.password) && !!errors.password;

  const payload = useMemo(() => {
    if (mode === "phone") {
      return { phone };
    }
    return { email: normalizeEmail(email), password };
  }, [mode, phone, email, password]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetAlerts();
    setSubmitted(true);

    if (!API_BASE_URL) {
      setErrors({ form: "إعدادات النظام ناقصة: NEXT_PUBLIC_API_BASE_URL غير معرف" });
      return;
    }

    const nextErrors: FieldErrors = {};

    if (mode === "phone") {
      const phoneErr = validatePhoneRaw(phone);
      if (phoneErr) nextErrors.phone = phoneErr;
    } else {
      const emailErr = validateEmail(email);
      if (emailErr) nextErrors.email = emailErr;

      if (!password) nextErrors.password = "الرجاء إدخال كلمة المرور";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        const serverErrors = extractFieldErrors(data);

        // لو السيرفر رجّع رسالة عامة فقط
        if (!Object.keys(serverErrors).length) {
          setErrors({ form: "بيانات الدخول غير صحيحة" });
        } else {
          setErrors(serverErrors);
        }
        return;
      }

      const d = (data ?? {}) as Record<string, unknown>;
      const token = (d.token || d.access_token || d.access) as string | undefined;
      const user = (d.user || d.data) as unknown;

      if (typeof window !== "undefined") {
        if (token) localStorage.setItem("authToken", token);
        if (user) localStorage.setItem("currentUser", JSON.stringify(user));
      }

      router.replace("/");
    } catch (err) {
      console.error(err);
      setErrors({ form: "حدث خطأ غير متوقع. الرجاء المحاولة لاحقًا." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-natural-white" dir="rtl">
      {/* Mobile Header */}
      <header className="flex md:hidden w-full items-center justify-center px-4 pt-8 pb-0 flex-shrink-0" role="banner">
        <div className="w-full max-w-md relative flex items-center justify-center h-16">
          <h1 className="text-xl font-medium text-natural-primary-text">تسجيل الدخول</h1>
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
          <div className="hidden md:flex items-center justify-center relative mb-12 lg:mb-16">
            <h1 className="text-2xl lg:text-3xl font-medium text-natural-primary-text">تسجيل الدخول</h1>
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

            <div className="flex flex-col gap-6 md:gap-7 lg:gap-8">
              {/* PHONE MODE */}
              {mode === "phone" && (
                <div className="w-full">
                  <label className="block text-sm md:text-base mb-2 text-right text-natural-primary-text">
                    رقم الجوال <span className="text-status-error mr-0.5">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="مثال: +9665xxxxxxx"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if ((submitted || touched.phone) && errors.phone) {
                        setErrors((p) => ({ ...p, phone: undefined }));
                      }
                    }}
                    onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                    className={`w-full h-12 px-4 rounded-lg border ${
                      showPhoneError ? "border-status-error" : "border-natural-light-border"
                    }`}
                  />
                  {showPhoneError && <p className="text-status-error text-xs mt-2 text-right">{errors.phone}</p>}
                </div>
              )}

              {/* EMAIL MODE */}
              {mode === "email" && (
                <>
                  <div className="w-full">
                    <label className="block text-sm md:text-base mb-2 text-right text-natural-primary-text">
                      البريد الإلكتروني <span className="text-status-error mr-0.5">*</span>
                    </label>
                    <input
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
                      className={`w-full h-12 px-4 rounded-lg border ${
                        showEmailError ? "border-status-error" : "border-natural-light-border"
                      }`}
                    />
                    {showEmailError && <p className="text-status-error text-xs mt-2 text-right">{errors.email}</p>}
                  </div>

                  <div className="w-full">
                    <label className="block text-sm md:text-base mb-2 text-right text-natural-primary-text">
                      كلمة المرور <span className="text-status-error mr-0.5">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="أدخل كلمة المرور"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if ((submitted || touched.password) && errors.password) {
                          setErrors((p) => ({ ...p, password: undefined }));
                        }
                      }}
                      onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                      className={`w-full h-12 px-4 rounded-lg border ${
                        showPasswordError ? "border-status-error" : "border-natural-light-border"
                      }`}
                    />
                    {showPasswordError && (
                      <p className="text-status-error text-xs mt-2 text-right">{errors.password}</p>
                    )}
                  </div>

                  <a
                    href="/forgot-password"
                    className="text-sm text-brand-primary hover:text-brand-buttons-status-hover -mt-2 text-left"
                  >
                    نسيت كلمة المرور؟
                  </a>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-8 rounded-lg bg-brand-buttons-status-default text-white font-medium disabled:bg-brand-buttons-status-disabled"
            >
              {isLoading ? "جاري التحميل..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-natural-helper-text">
              ليس لديك حساب؟{" "}
              <a href="/register" className="text-brand-primary hover:text-brand-buttons-status-hover">
                أنشئ حسابًا جديدًا
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}