"use client";
import React, { Fragment, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { IoIosNotificationsOutline } from "react-icons/io";
import { BiMessageRounded } from "react-icons/bi";
import { FiCalendar, FiSettings, FiLogOut, FiSun, FiMoon } from "react-icons/fi";
import Image from "next/image";
import { useVendorAuth } from "@/contexts/VendorAuthContext"; // Added vendor auth context
import { useTheme } from "@/contexts/ThemeContext";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useQuery } from "@apollo/client";
import { GET_VENDOR_BY_ID, GET_VENDOR_APPROVAL_REQUESTS } from "@/graphql/queries";
import toast from "react-hot-toast";
import { formatCoupleName } from "@/utils/formatCoupleName";

const VendorHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, vendor } = useVendorAuth(); // Added logout function from vendor auth context
  const { theme, toggleTheme } = useTheme();
  const isSignupForm =
    pathname === "/vendor-onboarding" ||
    pathname.startsWith("/vendor-onboarding") ||
    pathname === "/sign-up" ||
    pathname === "/vendor-signup";
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef<number | null>(null);

  const navLinks = [
    {
      name: "Dashboard",
      href: "/vendor-dashboard",
      isActive: (path: string) => path === "/vendor-dashboard",
    },
    {
      name: "My Services",
      href: "/vendor-dashboard/services",
      isActive: (path: string) =>
        path.startsWith("/vendor-dashboard/services") ||
        path.startsWith("/vendor-dashboard/new-service") ||
        path.startsWith("/services/edit"),
    },
    {
      name: "Analytics",
      href: "/vendor-dashboard/analytics",
      isActive: (path: string) => path.startsWith("/vendor-dashboard/analytics"),
    },
    {
      name: "Payments",
      href: "/vendor-dashboard/payments",
      isActive: (path: string) => path.startsWith("/vendor-dashboard/payments"),
    },
    {
      name: "Settings",
      href: "/vendor-dashboard/settings",
      isActive: (path: string) => path.startsWith("/vendor-dashboard/settings"),
    },
    {
      name: "Help",
      href: "/vendor-dashboard/help",
      isActive: (path: string) => path === "/vendor-dashboard/help" || path === "/help",
    },
  ];

  const { data } = useQuery(GET_VENDOR_BY_ID, {
    variables: { id: vendor?.id },
    skip: !vendor?.id,
    onError: (err) => {
      console.warn("Failed to load vendor header info:", err.message);
    },
  });

  // Query approval requests with polling for real-time notification
  const { data: approvalData } = useQuery(GET_VENDOR_APPROVAL_REQUESTS, {
    variables: { vendorId: vendor?.id },
    skip: !vendor?.id || isSignupForm,
    pollInterval: 10000,
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
    onError: (err) => {
      console.warn("Failed to load vendor approval notifications:", err.message);
    },
  });

  const approvalRequests = approvalData?.getVendorApprovalRequests || [];
  const pendingRequests = approvalRequests.filter(
    (r: any) => r.status === "pending"
  );
  const pendingCount = pendingRequests.length;

  // Real-time toast alert when a new approval request arrives
  useEffect(() => {
    if (previousCountRef.current !== null && pendingCount > previousCountRef.current) {
      const latest = pendingRequests[0];
      const visitorName = formatCoupleName(latest?.visitor, "A couple");
      const pkgName = latest?.package?.name || "Package";

      toast.custom(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              router.push("/vendor-dashboard?tab=approvals");
            }}
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex cursor-pointer hover:bg-orange/5 transition-all p-4 border-l-4 border-orange border border-gray-100`}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="w-9 h-9 rounded-full bg-orange/10 text-orange flex items-center justify-center flex-shrink-0">
                <IoIosNotificationsOutline size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">
                  New Package Approval Request!
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className="font-semibold text-gray-800">{visitorName}</span> requested{" "}
                  <span className="font-semibold text-gray-800">{pkgName}</span>. Click to review.
                </p>
              </div>
            </div>
          </div>
        ),
        { duration: 6000 }
      );
    }
    previousCountRef.current = pendingCount;
  }, [pendingCount, pendingRequests, router]);

  const profilePic = data?.findVendorById?.profile_pic_url || "/images/visitorPlaceholder.png";

  // WebSocket hook for unread count
  const { unreadCount } = useChatSocket(vendor?.id, "vendor");

  // Handle dropdown toggle
  const handleProfileClick = () => {
    setShowProfileMenu((prev) => !prev);
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false); // Close the menu after logging out
  };

  // Close the dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setShowNotificationMenu(false);
      }
    };

    if (showProfileMenu || showNotificationMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu, showNotificationMenu]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  return (
    <Fragment>
      <header className="sticky top-0 z-30 py-3 xl:py-4 text-black dark:text-white bg-lightYellow/95 dark:bg-darkBg/95 backdrop-blur-md border-b border-orange/15 dark:border-orange/20 transition-all duration-200 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 w-full gap-2">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-1 rounded-xl text-gray-700 dark:text-zinc-300 hover:bg-orange/10 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
            aria-label="Open navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Left section: Logo - click disabled for logged-in vendor */}
          <div className="flex items-start justify-start select-none cursor-default shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 font-title">
                Say I Do
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange -mt-0.5">Vendors</p>
            </div>
          </div>

          {/* Center section: Navigation - desktop only */}
          <nav className="hidden md:flex justify-center items-center gap-1 lg:gap-2 font-title">
            {navLinks.map((link) => {
              const active = link.isActive(pathname);
              if (isSignupForm) {
                return (
                  <span
                    key={link.name}
                    className="px-3 lg:px-4 py-2 rounded-xl text-sm lg:text-[16px] tracking-wide whitespace-nowrap transition-all text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-400 hover:bg-gray-100/80 dark:hover:bg-zinc-800/60 font-semibold cursor-not-allowed select-none"
                    title="Complete sign up to access"
                  >
                    {link.name}
                  </span>
                );
              }
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 lg:px-4 py-2 rounded-xl text-sm lg:text-[16px] tracking-wide whitespace-nowrap transition-all ${
                    active
                      ? "bg-orange text-white shadow-xs font-bold"
                      : "text-gray-700 dark:text-zinc-300 hover:text-orange hover:bg-orange/10 dark:hover:bg-zinc-800 font-semibold"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right section: Notifications and Profile dropdown */}
          <div className="flex items-center justify-end gap-3 sm:gap-4 shrink-0">
            {/* Update the message icon section */}
            {isSignupForm ? (
              <span
                className="relative p-2 rounded-xl transition-all flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-400 hover:bg-gray-100/80 dark:hover:bg-zinc-800/60 font-semibold cursor-not-allowed select-none"
                title="Complete sign up to access"
              >
                <BiMessageRounded className="w-[26px] h-[26px]" />
              </span>
            ) : (
              <Link
                href="/vendor-dashboard/chats"
                className={`relative p-2 rounded-xl transition-all flex items-center justify-center ${
                  pathname.startsWith("/vendor-dashboard/chats")
                    ? "bg-orange text-white shadow-xs font-bold"
                    : "text-gray-700 dark:text-zinc-300 hover:text-orange hover:bg-orange/10 dark:hover:bg-zinc-800 font-semibold"
                }`}
                title="Messages"
              >
                <BiMessageRounded className="w-[26px] h-[26px]" />
                {unreadCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-xs ${
                      pathname.startsWith("/vendor-dashboard/chats")
                        ? "bg-white text-orange"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Notification bell dropdown */}
            <div className="relative" ref={notificationMenuRef}>
              {isSignupForm ? (
                <span
                  className="relative p-2 rounded-xl transition-all flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-400 hover:bg-gray-100/80 dark:hover:bg-zinc-800/60 font-semibold cursor-not-allowed select-none"
                  title="Complete setup to access"
                >
                  <IoIosNotificationsOutline className="w-[28px] h-[28px]" />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNotificationMenu((prev) => !prev)}
                  className="relative p-2 rounded-xl hover:bg-orange/10 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center text-gray-700 dark:text-zinc-300 hover:text-orange cursor-pointer"
                  title={pendingCount > 0 ? `${pendingCount} new notification${pendingCount === 1 ? "" : "s"}` : "Notifications"}
                  aria-label="Notifications"
                >
                  <IoIosNotificationsOutline className="w-[28px] h-[28px]" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-xs">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </button>
              )}

              {!isSignupForm && showNotificationMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-darkSurface shadow-2xl rounded-2xl py-2 z-50 border border-gray-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-title font-bold text-base text-gray-900 dark:text-zinc-100">Notifications</span>
                      {pendingCount > 0 && (
                        <span className="bg-orange/10 text-orange text-xs font-bold px-2 py-0.5 rounded-full">
                          {pendingCount} new
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-zinc-800">
                    {pendingRequests.length === 0 ? (
                      <div className="py-10 px-4 text-center">
                        <IoIosNotificationsOutline className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-2.5" />
                        <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">No new notifications</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">You are all caught up!</p>
                      </div>
                    ) : (
                      pendingRequests.map((req: any) => {
                        const visitorName = formatCoupleName(req.visitor, "A couple");
                        return (
                          <Link
                            key={req.id}
                            href="/vendor-dashboard?tab=approvals"
                            onClick={() => setShowNotificationMenu(false)}
                            className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors block"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange/10 dark:bg-orange/20 text-orange flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                                {visitorName.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">
                                  {visitorName} requested a booking
                                </p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                                  {req.package?.name || "Service Package"} • {req.bookingDate}
                                </p>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-700 dark:text-zinc-300 hover:text-orange hover:bg-orange/10 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              <FiSun className="hidden dark:block w-[24px] h-[24px] text-amber-400 hover:rotate-45 transition-transform" />
              <FiMoon className="block dark:hidden w-[24px] h-[24px] text-gray-700 dark:text-zinc-300 hover:text-orange transition-transform" />
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={handleProfileClick}
                className="relative block rounded-full focus:outline-none focus:ring-2 focus:ring-orange/40 transition-all cursor-pointer"
                aria-label="Vendor profile menu"
              >
                <Image
                  src={profilePic}
                  alt="vendor-profile-image"
                  className={`w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-full object-cover transition-all border-2 ${
                    showProfileMenu
                      ? "border-orange ring-2 ring-orange/30 shadow-sm"
                      : "border-orange/25 dark:border-orange/40 hover:border-orange shadow-xs"
                  }`}
                  width={50}
                  height={50}
                />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-darkSurface rounded-2xl shadow-xl border border-orange/20 dark:border-orange/30 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Vendor info header */}
                  <div className="px-4 py-2.5 border-b border-orange/15 dark:border-orange/20">
                    <p className="font-title text-sm font-bold text-gray-900 dark:text-zinc-100 truncate">
                      {data?.findVendorById?.busname ||
                        `${data?.findVendorById?.fname || ""} ${data?.findVendorById?.lname || ""}`.trim() ||
                        "Vendor Partner"}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5 space-y-1">
                    {isSignupForm ? (
                      <div
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 dark:text-zinc-500 opacity-60 cursor-not-allowed select-none"
                        title="Complete setup to access settings"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 flex items-center justify-center flex-shrink-0">
                          <FiSettings size={15} />
                        </div>
                        <span className="font-title text-sm font-semibold text-gray-400 dark:text-zinc-500">
                          Settings
                        </span>
                      </div>
                    ) : (
                      <Link
                        href="/vendor-dashboard/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-700 dark:text-zinc-200 hover:text-orange hover:bg-orange/5 dark:hover:bg-orange/15 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange/10 dark:bg-orange/20 border border-orange/20 text-orange flex items-center justify-center transition-colors group-hover:bg-orange group-hover:text-white flex-shrink-0">
                          <FiSettings size={15} />
                        </div>
                        <span className="font-title text-sm font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-orange transition-colors">
                          Settings
                        </span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-700 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-950/40 transition-all group text-left cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200/60 dark:border-red-900/40 text-red-500 flex items-center justify-center transition-colors group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500 flex-shrink-0">
                        <FiLogOut size={15} />
                      </div>
                      <span className="font-title text-sm font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        Logout
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile slide-in drawer */}
      <div className={`md:hidden ${isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div
          className={`fixed inset-0 bg-black z-40 transition-all duration-300 ${isMobileMenuOpen ? "opacity-40" : "opacity-0"}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div
          className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white dark:bg-darkSurface border-r border-gray-100 dark:border-zinc-800 shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col"
          style={{ transform: isMobileMenuOpen ? "translateX(0)" : "translateX(-100%)" }}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
            <div>
              <p className="font-title text-base font-bold text-gray-900 dark:text-zinc-100">Say I Do</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange">Vendors</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {navLinks.map((link) => {
              const active = link.isActive(pathname);
              return (
                <Link
                  key={link.name}
                  href={isSignupForm ? "#" : link.href}
                  onClick={() => !isSignupForm && setIsMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3.5 rounded-xl font-title text-sm font-semibold transition-all ${
                    active
                      ? "bg-orange text-white"
                      : isSignupForm
                        ? "text-gray-400 dark:text-zinc-600 cursor-not-allowed"
                        : "text-gray-700 dark:text-zinc-300 hover:bg-orange/10 hover:text-orange dark:hover:bg-zinc-800 dark:hover:text-orange"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Drawer footer */}
          <div className="px-3 py-4 border-t border-gray-100 dark:border-zinc-800 space-y-1 shrink-0">
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl">
              <span className="font-title text-sm font-semibold text-gray-700 dark:text-zinc-300">Dark Mode</span>
              <button type="button" onClick={toggleTheme} className="p-2 rounded-xl text-gray-700 dark:text-zinc-300 hover:bg-orange/10 dark:hover:bg-zinc-800 transition-colors" aria-label="Toggle theme">
                <FiSun className="hidden dark:block w-5 h-5 text-amber-400" />
                <FiMoon className="block dark:hidden w-5 h-5" />
              </button>
            </div>
            {!isSignupForm && (
              <Link href="/vendor-dashboard/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-zinc-200 hover:bg-orange/5 dark:hover:bg-orange/15 transition-all">
                <FiSettings size={15} className="text-orange" />
                <span className="font-title text-sm font-semibold">Settings</span>
              </Link>
            )}
            <button type="button" onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all text-left">
              <FiLogOut size={15} />
              <span className="font-title text-sm font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default VendorHeader;
