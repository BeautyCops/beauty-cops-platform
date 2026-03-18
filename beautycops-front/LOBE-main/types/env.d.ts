/**
 * Environment variable type definitions
 * Add your environment variables here for type safety
 */

declare namespace NodeJS {
  interface ProcessEnv {
    // متغيّر الـ API اللي نستخدمه في الفرونت
    NEXT_PUBLIC_API_BASE_URL?: string;
    /** Server-only: Django origin for /api proxy (Railway) */
    BACKEND_URL?: string;
    API_BACKEND_URL?: string;

    // مثال لو حبيتي تضيفين أشياء ثانية بعدين:
    // DATABASE_URL?: string;
  }
  
}

