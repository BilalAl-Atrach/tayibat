"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import SignupLoginModal from "./SignupLoginModal";
import api from "@/lib/api";

const authStorageEvent = "tayibat-auth-storage";

const getStoredUserName = () => {
  if (typeof window === "undefined") return null;
  if (!localStorage.getItem("authToken")) return null;

  return localStorage.getItem("userName");
};

const getStoredUserRole = () => {
  if (typeof window === "undefined") return null;
  if (!localStorage.getItem("authToken")) return null;

  return localStorage.getItem("userRole");
};

const subscribeToAuthStorage = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(authStorageEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(authStorageEvent, callback);
  };
};

const notifyAuthStorageChanged = () => {
  window.dispatchEvent(new Event(authStorageEvent));
};

const clearAuthCookie = (name: string) => {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const userName = useSyncExternalStore(
    subscribeToAuthStorage,
    getStoredUserName,
    () => null
  );
  const userRole = useSyncExternalStore(
    subscribeToAuthStorage,
    getStoredUserRole,
    () => null
  );
  const isAdmin = userRole === "admin";
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // Local cleanup still logs the browser out if the token is expired.
    }

    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("selectedCondition");
    clearAuthCookie("tayibat_role");
    notifyAuthStorageChanged();
    setMenuOpen(false);
    router.replace("/");
    router.refresh();
  };

  const handleModalClose = () => {
    setShowModal(false);
    notifyAuthStorageChanged();
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/guidance", label: "Guidance" },
    { href: "/contact", label: "Contact Us" },
    { href: "/about", label: "About Us" },
    ...(userName ? [{ href: "/account", label: "My Account" }] : []),
    ...(isAdmin ? [{ href: "/admin/dashboard", label: "Admin Dashboard" }] : []),
  ];

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 bg-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="shrink-0" aria-label="Tayibat home">
            <Image
              src="/tayibat-logo-transparent.png"
              alt="Tayibat"
              width={123}
              height={527}
              priority
              unoptimized
              className="h-14 w-[132px] object-contain sm:h-16 sm:w-[150px]"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8 font-medium text-gray-700">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-green-600 transition">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {userName ? (
              <>
                <span className="max-w-40 truncate text-gray-700 font-medium">
                  Welcome, {userName}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full bg-orange-600 text-white font-semibold hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition"
              >
                Sign Up / Login
              </button>
            )}
          </div>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-green-100 text-green-700 transition hover:bg-green-50 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="max-h-[calc(100dvh-80px)] overflow-y-auto border-t border-gray-200 bg-white px-4 py-4 shadow-lg md:hidden">
            <div className="flex flex-col gap-2 font-medium text-gray-700">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-3 transition hover:bg-green-50 hover:text-green-700"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              {userName ? (
                <div className="grid gap-3">
                  <p className="truncate text-sm font-medium text-gray-700">
                    Welcome, {userName}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="min-h-11 rounded-md bg-red-500 px-4 font-semibold text-white transition hover:bg-red-600"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowModal(true);
                    setMenuOpen(false);
                  }}
                  className="min-h-11 w-full rounded-md bg-green-600 px-4 font-semibold text-white transition hover:bg-green-700"
                >
                  Sign Up / Login
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
      <div className="h-20 sm:h-24" aria-hidden="true" />

      {showModal && <SignupLoginModal onClose={handleModalClose} />}
    </>
  );
}
