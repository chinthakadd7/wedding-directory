"use client";
import Link from "next/link";
import { Fragment, useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { IoIosNotificationsOutline } from "react-icons/io";
import { BiMessageRounded } from "react-icons/bi";
import {
  FiCalendar,
  FiUser,
  FiLogOut,
  FiSun,
  FiMoon,
  FiMenu,
  FiX,
} from "react-icons/fi";
import Image from "next/image";
import { useAuth } from "@/contexts/VisitorAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import SearchBar from "../SearchBar";
import { useQuery } from "@apollo/client";
import {
  GET_VISITOR_BY_ID,
  GET_VISITOR_APPROVAL_REQUESTS,
} from "@/graphql/queries";
import { useChatSocket } from "@/hooks/useChatSocket";
import toast from "react-hot-toast";
import { matchSriLankaDistrict } from "@/utils/geolocation";

const VisitorHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { visitor, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isSignupForm =
    pathname === "/visitor-onboarding" ||
    pathname.startsWith("/visitor-onboarding") ||
    pathname === "/visitor-signup";
  const [profilePic, setProfilePic] = useState<string>(
    "/images/visitorPlaceholder.png",
  ); // Default placeholder
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const previousApprovedCountRef = useRef<number | null>(null);

  // WebSocket hook for unread count
  const { unreadCount } = useChatSocket(visitor?.id, "visitor");

  // Fetch visitor data including profile_pic_url on component load
  const { data: visitorProfileData } = useQuery(GET_VISITOR_BY_ID, {
    variables: { id: visitor?.id },
    skip: !visitor?.id,
    onError: (err) => {
      console.warn("Failed to load visitor profile picture:", err.message);
    },
  });

  useEffect(() => {
    if (visitorProfileData?.findVisitorById?.profile_pic_url) {
      setProfilePic(visitorProfileData.findVisitorById.profile_pic_url);
    }
  }, [visitorProfileData?.findVisitorById?.profile_pic_url]);

  const visitorInfo = visitorProfileData?.findVisitorById;
  const visitorDistrict = matchSriLankaDistrict(
    visitorInfo?.city || visitorInfo?.wed_venue,
  );

  const navLinks = [
    {
      name: "Dashboard",
      href: "/visitor-dashboard",
      isActive: (path: string) =>
        path.startsWith("/visitor-dashboard") &&
        !path.startsWith("/visitor-dashboard/help") &&
        !path.startsWith("/visitor-dashboard/chats"),
    },
    {
      name: "Services",
      href: visitorDistrict
        ? `/services?city=${encodeURIComponent(visitorDistrict)}`
        : "/services",
      isActive: (path: string) =>
        path.startsWith("/services") || path.startsWith("/vendor-search"),
    },
    {
      name: "Blog",
      href: "/blog",
      isActive: (path: string) => path.startsWith("/blog"),
    },
    {
      name: "Help",
      href: "/visitor-dashboard/help",
      isActive: (path: string) =>
        path === "/visitor-dashboard/help" || path === "/help",
    },
  ];

  // Query visitor approval requests with polling for real-time notifications
  const { data: approvalData } = useQuery(GET_VISITOR_APPROVAL_REQUESTS, {
    variables: { visitorId: visitor?.id },
    skip: !visitor?.id || isSignupForm,
    pollInterval: 10000,
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
    onError: (err) => {
      console.warn(
        "Failed to load visitor approval notifications:",
        err.message,
      );
    },
  });

  const approvalRequests = approvalData?.getVisitorApprovalRequests || [];
  const activeRequests = approvalRequests.filter(
    (r: any) =>
      (r.status === "approved" && !r.isExpired) || r.status === "pending",
  );
  const notificationCount = activeRequests.length;

  const sortedRequests = [...approvalRequests].sort((a: any, b: any) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  // Real-time toast alert when a booking request is approved
  useEffect(() => {
    const approvedRequests = approvalRequests.filter(
      (r: any) => r.status === "approved" && !r.isExpired,
    );
    const approvedCount = approvedRequests.length;

    if (
      previousApprovedCountRef.current !== null &&
      approvedCount > previousApprovedCountRef.current
    ) {
      const latest = approvedRequests[0];
      const vendorName =
        latest?.package?.service?.vendor?.busname ||
        latest?.package?.service?.name ||
        "The vendor";
      const pkgName = latest?.package?.name || "Package";

      toast.custom(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              if (latest?.package?.service?.id) {
                router.push(`/services/${latest.package.service.id}`);
              }
            }}
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex cursor-pointer hover:bg-orange/5 transition-all p-4 border-l-4 border-emerald-500 border border-gray-100`}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <IoIosNotificationsOutline size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">
                  Booking Request Approved! 🎉
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className="font-semibold text-gray-800">
                    {vendorName}
                  </span>{" "}
                  approved your request for{" "}
                  <span className="font-semibold text-gray-800">{pkgName}</span>
                  . Click to complete booking!
                </p>
              </div>
            </div>
          </div>
        ),
        { duration: 6000 },
      );
    }
    previousApprovedCountRef.current = approvedCount;
  }, [approvalRequests, router]);

  // Handle dropdown toggle
  const handleProfileClick = () => {
    setShowProfileMenu((prev) => !prev);
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
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

  return (
    <Fragment>
      <header
        className="sticky top-0 z-30 text-black dark:text-white backdrop-blur-md transition-colors duration-200"
        style={{
          background: "var(--sid-nav)",
          borderBottom: "1px solid var(--sid-line)",
        }}
      >
        <div className="max-w-[1540px] mx-auto flex min-h-[76px] items-center gap-4 px-4 sm:px-8 lg:px-12">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full lg:hidden transition-colors hover:bg-[var(--sid-panel)]"
            style={{ color: "var(--sid-ink)" }}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <FiX size={21} /> : <FiMenu size={21} />}
          </button>

          <Link
            href="/visitor-dashboard"
            className="shrink-0 select-none font-josefin text-lg font-normal uppercase tracking-[0.28em] sm:text-xl"
            style={{ color: "var(--sid-ink)" }}
            aria-label="Go to visitor dashboard"
          >
            Say I Do
          </Link>

          {/* Search bar */}
          <div className="hidden flex-1 justify-center px-4 md:flex lg:px-8">
            <SearchBar
              showIcon={false}
              className="max-w-[540px]"
              placehHolderText={
                isSignupForm
                  ? "Search disabled during sign up"
                  : "search venues, caterers, etc."
              }
              disabled={isSignupForm}
            />
          </div>

          {/* Dashboard, Notifications, and Profile dropdown */}
          <div className="ml-auto flex items-center justify-end gap-1.5 sm:gap-3 font-josefin text-text dark:text-zinc-200">
            <nav className="hidden items-center gap-5 lg:flex xl:gap-7">
              {navLinks.map((link) => {
                const active = link.isActive(pathname);
                if (isSignupForm) {
                  return (
                    <span
                      key={link.name}
                      className="min-h-11 border-b border-transparent px-1 py-3 text-[11px] uppercase tracking-[0.24em] text-gray-400 dark:text-zinc-500 cursor-not-allowed select-none"
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
                    className={`min-h-11 border-b px-1 py-3 text-[11px] uppercase tracking-[0.24em] transition-colors ${
                      active
                        ? "border-[var(--sid-gold)] font-semibold"
                        : "border-transparent text-gray-600 dark:text-zinc-300 hover:border-[var(--sid-gold)] hover:text-[var(--sid-goldt)]"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Chat icon with unread badge */}
            {isSignupForm ? (
              <span
                className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-gray-400 dark:text-zinc-500 cursor-not-allowed select-none"
                title="Complete sign up to access"
              >
                <BiMessageRounded className="w-[26px] h-[26px]" />
              </span>
            ) : (
              <Link
                href={`/visitor-dashboard/chats/${visitor?.id}`}
                className={`relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors ${
                  pathname.startsWith("/visitor-dashboard/chats")
                    ? "text-[var(--sid-goldt)]"
                    : "text-gray-600 dark:text-zinc-300 hover:bg-[var(--sid-panel)] hover:text-[var(--sid-goldt)]"
                }`}
                title="Messages"
              >
                <BiMessageRounded className="w-[26px] h-[26px]" />
                {unreadCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-xs ${
                      pathname.startsWith("/visitor-dashboard/chats")
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
                  title="Complete sign up to access"
                >
                  <IoIosNotificationsOutline className="w-[28px] h-[28px]" />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNotificationMenu((prev) => !prev)}
                  className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors text-gray-600 dark:text-zinc-300 hover:bg-[var(--sid-panel)] hover:text-[var(--sid-goldt)]"
                  title={
                    notificationCount > 0
                      ? `${notificationCount} notification${notificationCount === 1 ? "" : "s"}`
                      : "Notifications"
                  }
                  aria-label="Notifications"
                >
                  <IoIosNotificationsOutline className="w-[28px] h-[28px]" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-xs">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </button>
              )}

              {!isSignupForm && showNotificationMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-darkSurface shadow-2xl rounded-2xl py-2 z-50 border border-gray-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-title font-bold text-base text-gray-900 dark:text-zinc-100">
                        Notifications
                      </span>
                      {notificationCount > 0 && (
                        <span className="bg-orange/10 text-orange text-xs font-bold px-2 py-0.5 rounded-full">
                          {notificationCount} new
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-zinc-800">
                    {sortedRequests.length === 0 ? (
                      <div className="py-10 px-4 text-center">
                        <IoIosNotificationsOutline className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-2.5" />
                        <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                          No new notifications
                        </p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                          You are all caught up!
                        </p>
                      </div>
                    ) : (
                      sortedRequests.map((req: any) => {
                        const vendorName =
                          req.package?.service?.vendor?.busname ||
                          req.package?.service?.name ||
                          "Vendor";
                        const pkgName = req.package?.name || "Package";
                        const isApproved =
                          req.status === "approved" && !req.isExpired;
                        const isRejected = req.status === "rejected";
                        const isPending = req.status === "pending";
                        const isExpired =
                          req.status === "approved" && req.isExpired;
                        const serviceId = req.package?.service?.id;
                        const targetUrl = serviceId
                          ? `/services/${serviceId}`
                          : "/visitor-dashboard";

                        return (
                          <Link
                            key={req.id}
                            href={targetUrl}
                            onClick={() => setShowNotificationMenu(false)}
                            className="block p-3.5 hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 ${
                                  isApproved
                                    ? "bg-emerald-100 text-emerald-600"
                                    : isRejected
                                      ? "bg-rose-100 text-rose-600"
                                      : isExpired
                                        ? "bg-gray-100 text-gray-500"
                                        : "bg-orange/10 text-orange"
                                }`}
                              >
                                {vendorName.charAt(0).toUpperCase() || "V"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate">
                                    {vendorName}
                                  </p>
                                  {isApproved && (
                                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                                      Approved
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                      Pending
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                                      Declined
                                    </span>
                                  )}
                                  {isExpired && (
                                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                      Expired
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">
                                  {isApproved
                                    ? `Approved your request for ${pkgName}!`
                                    : isRejected
                                      ? `Declined booking request for ${pkgName}`
                                      : isExpired
                                        ? `Approval expired for ${pkgName}`
                                        : `Pending approval for ${pkgName}`}
                                </p>
                                {req.vendorMessage && (
                                  <p className="text-[11px] text-gray-500 italic mt-0.5 truncate">
                                    &ldquo;{req.vendorMessage}&rdquo;
                                  </p>
                                )}
                                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-gray-400 font-medium">
                                  <FiCalendar
                                    size={12}
                                    className="text-orange"
                                  />
                                  <span>{req.bookingDate}</span>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-orange font-semibold">
                                    {isApproved
                                      ? "Book now →"
                                      : "View service →"}
                                  </span>
                                </div>
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
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-gray-600 dark:text-zinc-300 hover:bg-[var(--sid-panel)] hover:text-[var(--sid-goldt)] transition-colors cursor-pointer"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              <FiSun className="hidden dark:block w-[21px] h-[21px] text-[var(--sid-goldt)]" />
              <FiMoon className="block dark:hidden w-[21px] h-[21px]" />
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={handleProfileClick}
                className="relative block rounded-full focus:outline-none focus:ring-2 focus:ring-orange/40 transition-all cursor-pointer"
                aria-label="Couple profile menu"
              >
                <Image
                  src={profilePic}
                  alt="profile picture"
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
                  {/* User info banner */}
                  <div className="px-4 py-2.5 border-b border-orange/15 dark:border-orange/20">
                    <p className="font-title text-sm font-bold text-gray-900 dark:text-zinc-100 truncate">
                      {visitorInfo?.visitor_fname
                        ? `${visitorInfo.visitor_fname}${visitorInfo.partner_fname ? ` & ${visitorInfo.partner_fname}` : ""}`
                        : "Wedding Couple"}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5 space-y-1">
                    {isSignupForm ? (
                      <div
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 dark:text-zinc-500 opacity-60 cursor-not-allowed select-none"
                        title="Complete setup to access profile"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 flex items-center justify-center flex-shrink-0">
                          <FiUser size={15} />
                        </div>
                        <span className="font-title text-sm font-semibold text-gray-400 dark:text-zinc-500">
                          Profile
                        </span>
                      </div>
                    ) : (
                      <Link
                        href="/visitor-profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-700 dark:text-zinc-200 hover:text-orange hover:bg-orange/5 dark:hover:bg-orange/15 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange/10 dark:bg-orange/20 border border-orange/20 text-orange flex items-center justify-center transition-colors group-hover:bg-orange group-hover:text-white flex-shrink-0">
                          <FiUser size={15} />
                        </div>
                        <span className="font-title text-sm font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-orange transition-colors">
                          Profile
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

        <div className="border-t px-4 py-3 md:hidden" style={{ borderColor: "var(--sid-line)" }}>
          <SearchBar
            showIcon={false}
            className="max-w-none"
            placehHolderText={
              isSignupForm
                ? "Search disabled during sign up"
                : "Search venues, caterers, etc."
            }
            disabled={isSignupForm}
          />
        </div>

        {isMobileMenuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 top-[133px] z-40 bg-black/25 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation menu"
            />
            <div
              className="absolute left-0 right-0 top-full z-50 border-t px-4 py-4 shadow-lg lg:hidden"
              style={{ background: "var(--sid-bg)", borderColor: "var(--sid-line)" }}
            >
              <nav className="grid gap-1" aria-label="Mobile visitor navigation">
                {navLinks.map((link) => {
                  const active = link.isActive(pathname);

                  if (isSignupForm) {
                    return (
                      <span
                        key={link.name}
                        className="min-h-11 px-3 py-3 text-xs uppercase tracking-[0.2em] opacity-50"
                      >
                        {link.name}
                      </span>
                    );
                  }

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="min-h-11 border-b px-3 py-3 text-xs uppercase tracking-[0.2em] transition-colors"
                      style={{
                        color: active ? "var(--sid-goldt)" : "var(--sid-ink)",
                        borderColor: active ? "var(--sid-gold)" : "var(--sid-line)",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </>
        )}
      </header>
    </Fragment>
  );
};

export default VisitorHeader;
