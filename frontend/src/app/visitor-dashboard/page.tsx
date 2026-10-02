"use client";

import React, { useState, useEffect, Suspense } from "react";
import VisitorHeader from "@/components/shared/Headers/VisitorHeader";
import Footer from "@/components/shared/Footer";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { useAuth } from "@/contexts/VisitorAuthContext";
import VisitorCoupleBanner from "@/components/visitor-dashboard/VisitorCoupleBanner";
import VisitorBookingCalendar from "@/components/visitor-dashboard/VisitorBookingCalendar";
import DashboardWidgets from "@/components/visitor-dashboard/DashBoardWidgets";
import { VisitorDashboardSkeleton } from "@/components/ui/shimmer";
import { StaticImageData } from "next/image";
import {
  GET_VISITOR_BY_ID,
  FIND_ALL_MY_VENDORS,
  FIND_GUESTLIST_BY_VISITOR,
  GET_BUDGET_TOOL,
  GET_VISITOR_CHECKLISTS,
} from "@/graphql/queries";
import { FiSearch, FiCalendar } from "react-icons/fi";

interface Guest {
  id: string;
  status: string;
}

interface BudgetItem {
  amountPaid?: number;
}

interface Checklist {
  completed: boolean;
}

const VisitorDashboardContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [dashboardTab, setDashboardTab] = useState<"overview" | "calendar">(
    tabParam === "calendar" ? "calendar" : "overview"
  );

  useEffect(() => {
    if (tabParam === "calendar") {
      setDashboardTab("calendar");
    } else {
      setDashboardTab("overview");
    }
  }, [tabParam]);

  const handleTabChange = (tab: "overview" | "calendar") => {
    setDashboardTab(tab);
    if (tab === "calendar") {
      router.push("/visitor-dashboard?tab=calendar", { scroll: false });
    } else {
      router.push("/visitor-dashboard", { scroll: false });
    }
  };

  const { visitor, isInitialized } = useAuth();
  const [profilePic, setProfilePic] = useState<string | StaticImageData>(
    "/images/visitorProfilePic.webp"
  );

  // Get visitor profile data
  const { data, loading, error } = useQuery(GET_VISITOR_BY_ID, {
    variables: { id: visitor?.id },
    skip: !visitor?.id,
    onCompleted: (data) => {
      if (data?.findVisitorById?.profile_pic_url) {
        setProfilePic(data.findVisitorById.profile_pic_url);
      }
    },
  });

  const visitorData = data?.findVisitorById;
  const isMissingName =
    visitorData &&
    (!visitorData.visitor_fname ||
      !visitorData.visitor_fname.trim() ||
      visitorData.visitor_fname === 'Visitor');

  const isProfileIncomplete =
    visitorData &&
    (visitorData.isOnboarded === false ||
      (visitorData.isOnboarded == null &&
        (isMissingName ||
          (!visitorData.city &&
            !visitorData.phone &&
            !visitorData.wed_date &&
            !visitorData.partner_fname))));

  // If visitor profile is incomplete, redirect to onboarding
  useEffect(() => {
    if (isProfileIncomplete) {
      router.replace('/visitor-onboarding');
    }
  }, [isProfileIncomplete, router]);

  // Get my vendors data
  const { data: vendorsData } = useQuery(FIND_ALL_MY_VENDORS, {
    variables: { visitorId: visitor?.id },
    skip: !visitor?.id,
  });

  // Get guest list data
  const { data: guestListData } = useQuery(FIND_GUESTLIST_BY_VISITOR, {
    variables: { id: visitor?.id },
    skip: !visitor?.id,
  });

  // Get budget data
  const { data: budgetData } = useQuery(GET_BUDGET_TOOL, {
    variables: { visitorId: visitor?.id },
    skip: !visitor?.id,
  });

  // Get checklist data
  const { data: checklistData } = useQuery(GET_VISITOR_CHECKLISTS, {
    variables: { visitorId: visitor?.id },
    skip: !visitor?.id,
  });

  // Calculate all metrics
  const myVendors = vendorsData?.findAllMyVendors || [];
  const guestList = guestListData?.findGuestListsByVisitor || [];

  const attendingGuests = guestList.filter(
    (g: Guest) => g.status === "Attending"
  ).length;
  const declinedGuests = guestList.filter(
    (g: Guest) => g.status === "Declined"
  ).length;
  const invitedGuests = guestList.filter(
    (g: Guest) => g.status === "Invited"
  ).length;
  const notInvitedGuests = guestList.filter(
    (g: Guest) => g.status === "Not Invited"
  ).length;

  const budgetTool = budgetData?.budgetTool;
  const budgetTotal = budgetTool?.totalBudget || 0;
  const budgetItems = budgetTool?.budgetItems || [];

  const budgetSpent = budgetItems.reduce(
    (acc: number, item: BudgetItem) => acc + (item.amountPaid || 0),
    0
  );

  const budgetPercentage =
    budgetTotal > 0
      ? Math.min(Math.round((budgetSpent / budgetTotal) * 100 * 100) / 100, 100)
      : 0;

  const checklists = checklistData?.getVisitorChecklists || [];
  const completedTasks = checklists.filter(
    (task: Checklist) => task.completed
  ).length;
  const totalTasks = checklists.length;
  const checklistProgress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (!isInitialized || !visitor?.id || loading || isProfileIncomplete) {
    return <VisitorDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-lightYellow dark:bg-darkBg flex flex-col">
      <VisitorHeader />
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="bg-white dark:bg-darkSurface rounded-2xl p-8 border border-red-100 dark:border-red-900/30 text-center max-w-md shadow-sm">
            <p className="text-red-500 font-semibold mb-2">Error loading profile</p>
            <p className="text-gray-500 dark:text-zinc-400 text-xs">{error.message}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const userFname = visitorData?.visitor_fname?.trim() || "";
  const partnerFname = visitorData?.partner_fname?.trim() || "";
  const welcomeNames =
    userFname && partnerFname
      ? `${userFname} & ${partnerFname}`
      : userFname || "Couple";

  return (
    <div className="min-h-screen bg-lightYellow dark:bg-darkBg flex flex-col font-body transition-colors duration-200">
      <VisitorHeader />

      <main className="flex-grow max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-5 sm:py-6 lg:py-8 w-full">
        {/* Top Header Banner matching Vendor Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="font-title text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100">
              Wedding Dashboard
            </h1>
            <p className="text-gray-500 dark:text-zinc-400 font-body text-sm mt-1">
              Welcome back, {welcomeNames}!
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 bg-orange hover:bg-orange/90 text-white font-semibold px-3.5 sm:px-4 py-2.5 rounded-xl transition-all shadow-sm text-xs w-full sm:w-auto"
            >
              <FiSearch size={15} />
              <span>Explore Services</span>
            </Link>
          </div>
        </div>

        {/* Asymmetric Profile Hub + Booking Calendar Layout (4 cols + 8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 lg:gap-8 mb-8 lg:mb-10 items-stretch min-w-0">
          {/* Left Column (4 cols): Couple Profile & Integrated Planning Hub */}
          <div className="lg:col-span-4 flex flex-col">
            <VisitorCoupleBanner
              visitorData={visitorData}
              visitorId={visitor?.id}
              profilePic={profilePic}
              setProfilePic={setProfilePic}
              completedTasks={completedTasks}
              totalTasks={totalTasks}
              budgetPercentage={budgetPercentage}
              myVendorsCount={myVendors.length}
              attendingGuests={attendingGuests}
            />
          </div>

          {/* Right Column (8 cols): Planning Overview or Booking Calendar */}
          <div className="lg:col-span-8 flex flex-col h-full min-w-0">
            {/* Tab 1: Planning Overview */}
            {dashboardTab === "overview" && (
              <div className="h-full flex flex-col flex-1">
                <DashboardWidgets
                  myVendors={myVendors}
                  attendingGuests={attendingGuests}
                  declinedGuests={declinedGuests}
                  invitedGuests={invitedGuests}
                  notInvitedGuests={notInvitedGuests}
                  totalGuests={guestList.length}
                  budgetTotal={budgetTotal}
                  budgetSpent={budgetSpent}
                  budgetPercentage={budgetPercentage}
                  completedTasks={completedTasks}
                  totalTasks={totalTasks}
                  checklistProgress={checklistProgress}
                  visitorId={visitor?.id}
                />
              </div>
            )}

            {/* Tab 2: Booking Calendar */}
            {dashboardTab === "calendar" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-darkSurface rounded-2xl border border-orange/20 dark:border-zinc-800 px-4 sm:px-5 py-3 shadow-xs">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-zinc-100 font-title">
                    <FiCalendar className="text-orange" size={18} />
                    <span>Booking Calendar</span>
                  </div>
                  <Link
                    href="/visitor-dashboard"
                    className="text-xs font-semibold text-orange hover:underline font-body"
                  >
                    ← Back to Overview
                  </Link>
                </div>
                {visitor?.id ? (
                  <VisitorBookingCalendar visitorId={visitor.id} />
                ) : (
                  <div className="bg-white dark:bg-darkSurface rounded-2xl border border-orange/20 dark:border-zinc-800 p-8 text-center text-gray-500 dark:text-zinc-400 text-sm">
                    Log in to view your wedding calendar.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const VisitorDashboard: React.FC = () => {
  return (
    <Suspense fallback={<VisitorDashboardSkeleton />}>
      <VisitorDashboardContent />
    </Suspense>
  );
};

export default VisitorDashboard;
