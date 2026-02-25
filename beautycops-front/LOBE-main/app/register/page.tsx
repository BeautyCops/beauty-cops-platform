"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

/* =========================
   Types
   ========================= */

type GCCCountry = {
  key: "SA" | "AE" | "QA" | "KW" | "BH" | "OM";
  nameAr: string;
  dialCode: string;
  flag: string;
};

type FieldErrors = {
  phone?: string;
  form?: string;
};

const GCC_COUNTRIES: GCCCountry[] = [
  { key: "SA", nameAr: "المملكة العربية السعودية", dialCode: "+966", flag: "🇸🇦" },
  { key: "AE", nameAr: "الإمارات", dialCode: "+971", flag: "🇦🇪" },
  { key: "QA", nameAr: "قطر", dialCode: "+974", flag: "🇶🇦" },
  { key: "KW", nameAr: "الكويت", dialCode: "+965", flag: "🇰🇼" },
  { key: "BH", nameAr: "البحرين", dialCode: "+973", flag: "🇧🇭" },
  { key: "OM", nameAr: "عُمان", dialCode: "+968", flag: "🇴🇲" },
];

/* =========================
   Helpers
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

function validatePhoneNational(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  if (!digits) return "الرجاء إدخال رقم الجوال";
  if (digits.length < 7 || digits.length > 12) return "رقم الجوال غير صحيح";
  return null;
}

function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  // DRF / common patterns
  if (typeof d.detail === "string") return d.detail;
  if (typeof d.message === "string") return d.message;

  const phone = d.phone;
  if (Array.isArray(phone) && phone[0]) return String(phone[0]);
  if (typeof phone === "string") return phone;

  return null;
}

/* =========================
   Component
   ========================= */

export default function RegisterPage() {
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [country, setCountry] = useState<GCCCountry>(GCC_COUNTRIES[0]);
  const [nationalNumber, setNationalNumber] = useState<string>("");

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const fullPhone = useMemo(() => {
    const digits = (nationalNumber || "").replace(/\D/g, "");
    return `${country.dialCode}${digits}`;
  }, [country.dialCode, nationalNumber]);

  const handleBack = () => router.push("/");

  // Close dropdown on outside click + ESC
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = dropdownRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setIsOpen(false);
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

  const clearError = (key: keyof FieldErrors) => {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!API_BASE_URL) {
      setErrors({ form: "إعدادات النظام ناقصة: NEXT_PUBLIC_API_BASE_URL غير معرف" });
      return;
    }

    const phoneErr = validatePhoneNational(nationalNumber);
    if (phoneErr) {
      setErrors({ phone: phoneErr });
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/registration/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        const msg = extractErrorMessage(data) || "فشل إنشاء الحساب";
        // إذا كان الخطأ يبدو متعلق بالهاتف نخليه تحت الحقل
        if ((msg || "").toLowerCase().includes("phone") || msg.includes("الجوال") || msg.includes("رقم")) {
          setErrors({ phone: msg });
        } else {
          setErrors({ form: msg });
        }
        return;
      }

      router.push("/verify");
    } catch (err) {
      console.error(err);
      setErrors({ form: "حدث خطأ غير متوقع، الرجاء المحاولة لاحقاً" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-natural-white" dir="rtl">
      {/* Mobile Header */}
      <header className="flex md:hidden w-full items-center justify-center px-4 pt-8 pb-0 flex-shrink-0" role="banner">
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
          <div className="hidden md:flex items-center justify-center relative mb-12 lg:mb-16">
            <h1 className="text-2xl lg:text-3xl font-medium text-natural-primary-text">إنشاء حساب</h1>
            <button
              type="button"
              onClick={handleBack}
              className="absolute right-0 flex h-8 w-8 items-center justify-center text-brand-primary hover:bg-brand-primary-light-bg rounded-lg transition-colors"
              aria-label="العودة"
              title="العودة"
            >
              <Icon name="CaretRight" size={24} category="arrows" className="text-brand-primary stroke-brand-primary md:scale-110" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
            {errors.form && <p className="text-status-error text-sm mb-4 text-right">{errors.form}</p>}

            <div className="w-full">
              <label className="block text-sm md:text-base mb-2 text-right text-natural-primary-text">
                رقم الجوال <span className="text-status-error mr-0.5">*</span>
              </label>

              <div className="relative" ref={dropdownRef}>
                <div
                  className={`flex items-center w-full h-12 border rounded-lg overflow-hidden bg-white ${
                    errors.phone ? "border-status-error" : "border-natural-light-border"
                  }`}
                >
                  {/* input area */}
                  <div className="relative flex-1 h-full">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-natural-helper-text pointer-events-none select-none">
                      {country.dialCode}
                    </span>

                    <input
                      dir="ltr"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      enterKeyHint="done"
                      className="w-full h-full pr-4 pl-20 outline-none text-left"
                      placeholder="أدخل رقم الجوال"
                      value={nationalNumber}
                      onChange={(e) => {
                        setNationalNumber(e.target.value.replace(/\D/g, ""));
                        clearError("phone");
                        clearError("form");
                      }}
                    />
                  </div>

                  {/* dropdown button */}
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

                {errors.phone && <p className="text-status-error text-xs mt-2 text-right">{errors.phone}</p>}

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
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-8 rounded-lg bg-brand-buttons-status-default text-white font-medium disabled:bg-brand-buttons-status-disabled"
            >
              {isLoading ? "جاري الإرسال..." : "التالي"}
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