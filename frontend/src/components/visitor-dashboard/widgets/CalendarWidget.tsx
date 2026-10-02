"use client";

import React from "react";
import { FiCalendar, FiClock, FiMapPin } from "react-icons/fi";
import { useQuery } from "@apollo/client";
import { GET_VISITOR_BOOKINGS } from "@/graphql/queries";
import { format, isValid } from "date-fns";
import ActionButton from "../common/ActionButton";
import EmptyStateDisplay from "../common/EmptyStateDisplay";

interface Booking {
  id: string;
  title: string;
  date: string;
  time?: string;
  status: string;
  location?: string;
  serviceProvider?: {
    id: string;
    name: string;
  };
  packageName?: string;
  offeringName?: string;
}

interface CalendarWidgetProps {
  visitorId: string | undefined;
}

const formatDateBadge = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (!isValid(d)) return { month: "DATE", day: "--", full: dateStr };
    return {
      month: format(d, "MMM").toUpperCase(),
      day: format(d, "d"),
      full: format(d, "MMM d, yyyy"),
    };
  } catch {
    return { month: "DATE", day: "--", full: dateStr };
  }
};

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ visitorId }) => {
  const { data, loading } = useQuery(GET_VISITOR_BOOKINGS, {
    variables: { visitorId },
    skip: !visitorId,
  });

  const bookings: Booking[] = data?.getVisitorBookings || [];

  // Confirmed bookings with valid dates
  const confirmedBookings = bookings
    .filter((b) => Boolean(b.date) && b.status?.toLowerCase() === "confirmed")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="bg-white dark:bg-darkSurface rounded-2xl border border-orange/20 shadow-sm hover:shadow-md hover:border-orange/30 transition-all duration-300 overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="px-4 md:px-5 lg:px-6 py-3.5 lg:py-4 border-b border-orange/15 dark:border-orange/20 bg-orange/[0.02] dark:bg-orange/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange/10 dark:bg-orange/20 text-orange flex items-center justify-center shrink-0 border border-orange/15 dark:border-orange/30 shadow-xs">
            <FiCalendar className="h-5 w-5" />
          </div>
          <h3 className="font-title text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-100">
            Wedding Calendar
          </h3>
        </div>

        {confirmedBookings.length > 0 && (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange/10 dark:bg-orange/20 text-orange border border-orange/20 dark:border-orange/30 font-body">
            {confirmedBookings.length} Booked
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 md:p-5 lg:p-6 flex-1 flex flex-col justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mb-3.5 font-body">
            Upcoming appointments and booked wedding services.
          </p>

          {loading ? (
            <div className="py-6 flex justify-center items-center">
              <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 font-body">
                Loading calendar...
              </span>
            </div>
          ) : confirmedBookings.length > 0 ? (
            <div className="space-y-2.5">
              {confirmedBookings.slice(0, 2).map((booking) => {
                const dateInfo = formatDateBadge(booking.date);
                const title =
                  booking.title ||
                  booking.offeringName ||
                  booking.packageName ||
                  "Vendor Appointment";
                const vendorName =
                  booking.serviceProvider?.name || "Wedding Vendor";

                return (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 pb-2.5 border-b border-orange/10 dark:border-zinc-800 last:border-b-0 last:pb-0"
                  >
                    {/* Date Badge */}
                    <div className="w-11 h-11 rounded-xl bg-orange/10 dark:bg-orange/20 text-orange flex flex-col items-center justify-center border border-orange/20 dark:border-orange/30 shadow-xs shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                        {dateInfo.month}
                      </span>
                      <span className="text-base font-bold font-title leading-tight">
                        {dateInfo.day}
                      </span>
                    </div>

                    {/* Booking Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-title text-xs sm:text-sm font-bold text-gray-900 dark:text-zinc-200 truncate">
                        {title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 font-body truncate flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium text-gray-700 dark:text-zinc-300">
                          {vendorName}
                        </span>
                        {booking.time && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FiClock size={11} className="text-gray-400 dark:text-zinc-500" />
                              {booking.time}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Status Pill */}
                    <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 shrink-0 font-body">
                      Confirmed
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyStateDisplay
              Icon={FiCalendar}
              message="No upcoming appointments booked yet."
            />
          )}
        </div>

        {/* Bottom Action Button */}
        <div className="pt-3.5 border-t border-orange/10 dark:border-zinc-800 flex justify-end">
          <ActionButton
            href="/visitor-dashboard?tab=calendar"
            label="View calendar"
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;
