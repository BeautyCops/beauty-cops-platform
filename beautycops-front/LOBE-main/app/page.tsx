"use client";
import { HomeFooter, MainNavbar } from "@/components";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import Link from "next/link";
import Image from "next/image";
import {
  BellIcon,
  blog2,
  blog4,
  blogImage,
  EyeglassesIcon,
  HairDryerIcon,
  productImage1,
  productImage2,
  SunglassesIcon,
  WineIcon,
} from "@/assets";
import { ChevronLeft } from "lucide-react";
import HeroBanner1 from "@/components/home/HeroBanner1";
import HeroBanner2 from "@/components/home/HeroBanner2";
import BottomNavbar from "@/components/BottomNavbar";

import { apiUrl } from "@/lib/apiBase";

type SearchSuggestion = {
  id: number;
  name: string;
  category: "skincare" | "makeup" | "haircare";
  image_url?: string | null;
};

type Product = {
  id: number;
  name: string;
  brand_name: string | null;
  image_url: string | null;
  safety_score: number | null;
  category: "skincare" | "makeup" | "haircare";
};

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Public: allow searching without login
  const handleSearchFocus = () => {
    setSearchDropdownOpen(true);
  };

  const [activeBanner, setActiveBanner] = useState(0);
  const [isLogin, setIsLogin] = useState(false);
  const [userName, setUserName] = useState("");

  const [mostSearchedProducts, setMostSearchedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Check login status and auto-switch between banners
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      setIsLogin(!!token);

      // Get user name from currentUser
      if (token) {
        const currentUser = localStorage.getItem("currentUser");
        if (currentUser) {
          try {
            const user = JSON.parse(currentUser);
            setUserName(user.name || "المستخدم");
          } catch {
            setUserName("المستخدم");
          }
        }
      }
    }
  }, []);

  // Auto-switch between banners every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner((prev) => (prev === 0 ? 1 : 0));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Fetch most searched products (public)
  useEffect(() => {
    async function fetchMostSearchedProducts() {
      try {
        setProductsLoading(true);

        const targetProducts = [
          { id: 122, category: "makeup" },
          { id: 448, category: "makeup" },
          { id: 18658, category: "skincare" },
          { id: 19596, category: "skincare" },
        ];

        const results = await Promise.all(
          targetProducts.map(async (p) => {
            try {
              const res = await fetch(
                apiUrl(`/api/v1/${p.category}/${p.category}_products/${p.id}/`)
              );
              if (!res.ok) return null;
              const data = await res.json();
              return { ...data, category: p.category };
            } catch {
              return null;
            }
          })
        );

        const validProducts: Product[] = results
          .filter((p) => p !== null)
          .map((p: any) => ({
            id: p.skincare_id || p.makeup_id,
            name: p.name,
            brand_name: p.brand_name,
            image_url: p.image_url,
            safety_score: p.safety_score,
            category: p.category,
          }));

        setMostSearchedProducts(validProducts);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setProductsLoading(false);
      }
    }

    fetchMostSearchedProducts();
  }, [isLogin]);

  // Search suggestions effect (public)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchSuggestions([]);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [skincareRes, makeupRes, haircareRes] = await Promise.all([
          fetch(apiUrl(`/api/v1/skincare/skincare_products/?page=1&size=10&search=${encodeURIComponent(q)}`), { signal: controller.signal }),
          fetch(apiUrl(`/api/v1/makeup/makeup_products/?page=1&size=10&search=${encodeURIComponent(q)}`), { signal: controller.signal }),
          fetch(apiUrl(`/api/v1/haircare/haircare_products/?page=1&size=10&search=${encodeURIComponent(q)}`), { signal: controller.signal }),
        ]);

        const [skincareData, makeupData, haircareData] = await Promise.all([
          skincareRes.json(),
          makeupRes.json(),
          haircareRes.json(),
        ]);

        const suggestions: SearchSuggestion[] = [];

        if (skincareData.results && Array.isArray(skincareData.results)) {
          skincareData.results.forEach((p: any) => {
            if (suggestions.length < 10) {
              suggestions.push({
                id: p.skincare_id,
                name: p.name,
                category: "skincare",
                image_url: p.image_url,
              });
            }
          });
        }

        if (makeupData.results && Array.isArray(makeupData.results)) {
          makeupData.results.forEach((p: any) => {
            if (suggestions.length < 10) {
              suggestions.push({
                id: p.makeup_id,
                name: p.name,
                category: "makeup",
                image_url: p.image_url,
              });
            }
          });
        }

        if (haircareData.results && Array.isArray(haircareData.results)) {
          haircareData.results.forEach((p: any) => {
            if (suggestions.length < 10) {
              suggestions.push({
                id: p.haircare_id,
                name: p.name,
                category: "haircare",
                image_url: p.image_url,
              });
            }
          });
        }

        setSearchSuggestions(suggestions.slice(0, 10));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Search failed:", error);
        setSearchSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery, isLogin]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setSearchDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "skincare": return "العناية";
      case "makeup": return "ميكب";
      case "haircare": return "شعر";
      default: return category;
    }
  };

  const getSafetyColorClass = (score: number | null): string => {
    if (score === null) return "bg-gray-300";
    if (score <= 3) return "bg-green-500";
    if (score <= 7) return "bg-yellow-500";
    return "bg-red-500";
  };

  const categories = [
    {
      name: "العناية",
      icon: EyeglassesIcon,
      category: "commerce",
      href: isLogin ? "/categories/care" : "/login",
    },
    {
      name: "الشعر",
      icon: HairDryerIcon,
      category: "commerce",
      href: isLogin ? "/categories/hair" : "/login",
    },
    {
      name: "المكياج",
      icon: SunglassesIcon,
      category: "commerce",
      href: isLogin ? "/categories/makeup" : "/login",
    },
    {
      name: "العطور",
      icon: WineIcon,
      category: "commerce",
      href: isLogin ? "/categories/perfumes" : "/login",
    },
  ];

  const blogArticles = [
    {
      id: 1,
      title: "النياسيناميد لبشرة أكثر صحة!",
      excerpt:
        "النياسيناميد هو شكل من أشكال فيتامين B3، يستخدم بكثرة في مستحضرات العناية بالبشرة لخصائصه المتعددة. يساعد على تقليل ظهور البقع الداكنة والتصبغات، وتحسين ملمس البشرة، وتقليل المسام الواسعة، كما يعمل على توحيد لون البشرة. يتميز بكونه مناسباً لجميع أنواع البشرة، حتى الحساسة منها، ويمكن استخدامه مع معظم المكونات الأخرى دون مشاكل. اكتشفي كيفية دمجه في روتينك اليومي للحصول على بشرة نضرة ومتوهجة.",
      image: blogImage,
      href: "/blog/niacinamide",
    },
    {
      id: 2,
      title: "المكون الذهبي لمكافحة التجاعيد",
      excerpt:
        'الريتينول يُطلق عليه "المكون الذهبي" في عالم العناية بالبشرة. يدخل في أغلب منتجات مكافحة التجاعيد لأنه يساعد على تجديد الخلايا وتحفيز الكولاجين. يعمل على تقليل الخطوط الدقيقة والتجاعيد، وتحسين نعومة البشرة، وتقليل البقع الداكنة. يجب استخدامه بشكل تدريجي وبتراكيز منخفضة في البداية، مع الحرص على استخدام واقي الشمس يومياً. تعرفي على كيفية بناء التسامح مع الريتينول والطريقة الصحيحة لإضافته إلى روتينك الليلي.',
      image: blog2,
      href: "/blog/retinol",
    },
    {
      id: 3,
      title: "اعرف أكثر عن حمض الهيالورونيك",
      excerpt:
        "تعرفي على فوائد حمض الهيالورونيك للبشرة وكيفية استخدامه بشكل صحيح للحصول على أفضل النتائج. هذا المكون الفريد لديه القدرة على الاحتفاظ بكميات كبيرة من الماء، مما يجعله مرطباً قوياً للبشرة. يساعد على ملء الخطوط الدقيقة، وتحسين مرونة البشرة، وإعطائها مظهراً مشرقاً وممتلئاً. يمكن استخدامه بتركيزات مختلفة حسب احتياجات بشرتك، ويفضل تطبيقه على بشرة رطبة لتعزيز امتصاصه. اكتشفي أفضل المنتجات التي تحتوي عليه ونصائح لاستخدامه بشكل فعال.",
      image: blog4,
      href: "/blog/hyaluronic-acid",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-natural-white" dir="rtl">
      {/* Mobile Header - Visible on mobile only */}
      <nav
        className={`flex w-full items-center ${isLogin ? "justify-center pt-8" : "justify-between"
          } px-4 py-3 md:hidden flex-shrink-0`}
      >
        {/* Logo - Right side in RTL */}
        <Link href="/" className="flex items-center">
          {isLogin ? (
            <Image
              src={"/logo.png"}
              alt={"logo"}
              width={155}
              height={40}
              priority
              unoptimized
            />
          ) : (
            <Image
              src="/minimal-logo.png"
              alt="Beauty Cops"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
              unoptimized
            />
          )}
        </Link>

        {/* Login Button - Left side in RTL */}
        {isLogin ? (
          <></>
        ) : (
          <Link
            href={"/login"}
            className="px-4 py-2 bg-brand-buttons-status-default text-natural-white rounded-lg hover:bg-brand-buttons-status-hover transition-colors text-sm font-medium whitespace-nowrap"
          >
            تسجيل الدخول
          </Link>
        )}
      </nav>

      {/* Desktop/Tablet Top Navigation - Only visible on tablet and desktop */}
      <MainNavbar isLoggedIn={isLogin} />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        {isLogin ? (
          <div className="w-full flex items-center justify-between mb-4 md:mb-6">
            <span className="text-lg font-medium text-brand-primary">
              هلا، {userName}👋
            </span>

            <Link
              href="/notifications"
              className="hover:opacity-75 transition-all"
            >
              <Image
                src={BellIcon}
                alt="bell icon"
                width={18.80649757385254}
                height={20.254146575927734}
              />
            </Link>
          </div>
        ) : null}
        {/* Hero Banner Section with Auto-Switch */}
        <div className="relative mb-4 md:mb-6" style={{ minHeight: "200px" }}>
          <div
            className={`transition-opacity duration-1000 ease-in-out ${activeBanner === 0
              ? "opacity-100 relative"
              : "opacity-0 absolute inset-0 pointer-events-none"
              }`}
          >
            <HeroBanner1 />
          </div>
          <div
            className={`transition-opacity duration-1000 ease-in-out ${activeBanner === 1
              ? "opacity-100 relative"
              : "opacity-0 absolute inset-0 pointer-events-none"
              }`}
          >
            <HeroBanner2 />
          </div>
        </div>
        {/* Search Bar Section */}
        <section className="mb-8 lg:mb-12">
          <div className="relative w-full" ref={searchDropdownRef}>
            {/* Gradient Border Wrapper */}
            <div
              className="w-full rounded-full p-[1px]"
              style={{
                background:
                  "linear-gradient(102.46deg, rgba(190, 92, 144, 0.45) -30.33%, rgba(249, 206, 185, 0.9) 0.3%, rgba(225, 141, 187, 0.9) 45.57%, rgba(159, 215, 234, 0.9) 91.77%",
              }}
            >
              <div className="flex items-center bg-white rounded-full overflow-hidden pl-2 md:pl-2.5">
                {/* Input Field */}
                <input
                  id="home-search-input"
                  type="text"
                  placeholder="ابحث باسم المنتج"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  className="flex-1 bg-transparent border-0 outline-none px-4 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg text-natural-primary-text placeholder:text-natural-input-hint h-14 md:h-16"
                  dir="rtl"
                />

                {/* Circular Search Button - Left side in RTL */}
                <button
                  type="button"
                  onClick={() => !isLogin && router.push('/login')}
                  className="flex-shrink-0 w-[42px] h-[42px] md:w-12 md:h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(190, 92, 144, 1), rgba(225, 141, 187, 1))",
                  }}
                  aria-label="Search"
                >
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search Dropdown */}
            {searchDropdownOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute z-50 mt-2 w-full rounded-2xl border border-natural-light-border bg-white shadow-xl overflow-hidden max-h-96">
                {searchLoading ? (
                  <div className="p-4 text-center text-natural-helper-text">
                    جاري البحث...
                  </div>
                ) : searchSuggestions.length === 0 ? (
                  <div className="p-4 text-center text-natural-helper-text">
                    لا توجد نتائج
                  </div>
                ) : (
                  <div className="max-h-96 overflow-auto">
                    {searchSuggestions.map((suggestion) => (
                      <Link
                        key={`${suggestion.category}-${suggestion.id}`}
                        href={suggestion.category === "haircare" ? "/coming-soon" : `/products/${suggestion.id}?category=${suggestion.category}`}
                        onClick={() => setSearchDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-pink-50 transition border-b border-natural-light-border last:border-b-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-natural-primary-text truncate">
                            {suggestion.name}
                          </div>
                          <div className="text-xs text-natural-helper-text mt-0.5">
                            {getCategoryLabel(suggestion.category)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Categories Section */}
        <section className="mb-8 lg:mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-natural-primary-text">
              تصفح الفئات
            </h2>
            <Link
              href="/products"
              className="text-sm md:text-base text-brand-primary hover:underline"
            >
              عرض المزيد
            </Link>
          </div>

          {/* Categories grid secion */}
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {categories.map((category) => (
              <div
                key={category.name}
                className="flex flex-col items-center group"
              >
                {/* Gradient Border Wrapper */}
                <Link href={category.href} className="w-full relative">
                  <div
                    className="w-full rounded-2xl p-[1px] hover:p-[2px] transition-all duration-300 cursor-pointer"
                    style={{
                      background:
                        "linear-gradient(102.46deg, rgba(190, 92, 144, 0.45) -30.33%, rgba(249, 206, 185, 0.9) 0.3%, rgba(225, 141, 187, 0.9) 45.57%, rgba(159, 215, 234, 0.9) 91.77%",
                    }}
                  >
                    <div className="flex flex-col items-center justify-center aspect-square bg-white rounded-2xl p-2 sm:p-4 md:p-5 lg:p-6 transition-all duration-300">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center">
                        <Image
                          src={category.icon}
                          width={56}
                          height={56}
                          alt={category.name}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                          style={{
                            filter:
                              "brightness(0) saturate(100%) invert(31%) sepia(96%) saturate(1352%) hue-rotate(290deg) brightness(0.85) contrast(0.9)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
                {/* Category Name - Below the card */}
                <span className="text-xs sm:text-base md:text-lg font-medium text-natural-primary-text text-center mt-2 sm:mt-3 md:mt-4 transition-colors duration-300 group-hover:text-brand-primary">
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Most Searched Products Section - ONLY SHOW IF LOGIN */}
        {isLogin && (
          <section className="mb-8 lg:mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-natural-primary-text">
                المنتجات الأكثر بحثاً
              </h2>
              <Link
                href="/products"
                className="text-sm md:text-base text-brand-primary hover:underline"
              >
                عرض الكل
              </Link>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-natural-light-border overflow-hidden animate-pulse">
                    <div className="w-full aspect-[173/166] bg-gray-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {mostSearchedProducts.map((product, index) => (
                  <Link
                    key={`${product.category}-${product.id}`}
                    href={product.category === "haircare" ? "/coming-soon" : `/products/${product.id}?category=${product.category}`}
                    className={`relative bg-white rounded-xl border border-natural-light-border overflow-hidden hover:shadow-lg transition-shadow ${index === 2
                      ? "hidden md:block"
                      : index === 3
                        ? "hidden lg:block"
                        : index === 4
                          ? "hidden lg:block"
                          : ""
                      }`}
                  >
                    <div className="relative w-full aspect-[173/166] border-b border-natural-light-border bg-gradient-to-b from-[#fff9fc] via-[#fff5f9] to-[#ffe9f3]">
                      <div className="absolute inset-0 flex items-center justify-center p-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="object-contain w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded" />
                        )}
                      </div>
                      {/* Safety Score Badge */}
                      {product.safety_score !== null && (
                        <div
                          className={`absolute top-2 left-2 w-8 h-8 ${getSafetyColorClass(
                            product.safety_score
                          )} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg`}
                        >
                          {product.safety_score}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-natural-helper-text truncate mb-1">
                        {product.brand_name || "بدون ماركة"}
                      </p>
                      <p className="text-sm font-medium text-natural-primary-text line-clamp-2">
                        {product.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Blog Section */}
        <section className="mb-6 md:mb-8 lg:mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-natural-primary-text">
              من المدونة
            </h2>
            <Link
              href="/blog"
              className="text-sm md:text-base text-brand-primary hover:underline"
            >
              عرض الكل
            </Link>
          </div>
          <div className="space-y-4 md:space-y-6">
            {blogArticles.map((article) => (
              <Link
                key={article.id}
                href={article.href}
                className="flex flex-row items-start gap-3 sm:gap-4 md:gap-6 bg-white rounded-xl border border-natural-light-border p-4 md:p-6 hover:shadow transition-shadow"
              >
                {/* Image - Right side in RTL */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100">
                  <Image
                    fill
                    src={article.image}
                    alt={article.title}
                    className="object-cover w-full h-full"
                  />
                </div>
                {/* Content - Left side in RTL */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-natural-primary-text mb-2">
                    {article.title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-natural-subtext-description mb-2 sm:mb-3 line-clamp-2 lg:line-clamp-3">
                    {article.excerpt}
                  </p>
                  <span className="text-sm sm:text-base font-medium text-brand-primary inline-flex items-center gap-1">
                    اقرأ المزيد <ChevronLeft className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <HomeFooter />
      {isLogin ? <BottomNavbar /> : null}
    </div>
  );
};

export default Home;
