"use client";

import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_VISITOR_BOOKINGS } from "@/graphql/queries";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiMessageSquare,
  FiShoppingBag,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";

interface Booking {
  id: string;
  title: string;
  date: string;
  time?: string;
  status: "Confirmed" | "Pending" | "Cancelled" | string;
  location?: string;
  serviceProvider?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  packageName?: string;
  offeringName?: string;
  amount?: number;
  createdAt?: string;
}

interface VisitorBookingCalendarProps {
  visitorId: string;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const VisitorBookingCalendar: React.FC<VisitorBookingCalendarProps> = ({
  visitorId,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_VISITOR_BOOKINGS, {
    variables: { visitorId },
    skip: !visitorId,
  });

  const bookings: Booking[] = data?.getVisitorBookings || [];

  // Filter ONLY confirmed bookings with valid dates (exclude failed, cancelled, or pending attempts)
  const bookingsWithDates = bookings.filter(
    (b) => Boolean(b.date) && b.status?.toLowerCase() === "confirmed"
  );

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    return bookingsWithDates.filter((b) => {
      const bookingDate = new Date(b.date);
      return bookingDate.toDateString() === date.toDateString();
    });
  };

  // Get status for a date (only confirmed bookings are tracked on the calendar)
  const getDateStatus = (date: Date) => {
    const dateBookings = getBookingsForDate(date);
    return dateBookings.length > 0 ? "confirmed" : null;
  };

  // Month navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for offset
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const calendarDays = getDaysInMonth(currentMonth);
  const selectedDateBookings = selectedDate
    ? getBookingsForDate(selectedDate)
    : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loading) {
    return (
      <div className="bg-white dark:bg-darkSurface rounded-2xl shadow-sm border border-orange/20 dark:border-zinc-800 p-4 sm:p-5 lg:p-7 flex flex-col h-full space-y-5 lg:space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-44 rounded-lg" />
            <Skeleton className="h-3.5 w-64 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-xl" />
            <div className="flex gap-1">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-5 w-full rounded" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-16 sm:h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-darkSurface rounded-2xl shadow-sm border border-red-200 dark:border-red-900/50 p-8 text-center text-red-500 dark:text-red-400 text-sm">
        <FiAlertCircle size={24} className="mx-auto mb-2 text-red-400" />
        <p className="font-semibold">Unable to load booking calendar</p>
        <button
          onClick={() => refetch()}
          className="mt-3 text-xs bg-orange text-white px-3.5 py-1.5 rounded-xl font-semibold hover:bg-orange/90 transition-all shadow-xs"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-darkSurface rounded-2xl shadow-sm border border-orange/20 p-4 sm:p-5 lg:p-7 flex flex-col h-full min-w-0">
      {/* Top Header & Legend matching vendor calendar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-orange animate-pulse"></span>
            <span className="text-[11px] font-semibold text-orange uppercase tracking-wider">
              Appointments & Event Schedule
            </span>
          </div>
          <h2 className="font-title text-xl sm:text-2xl font-bold text-gray-900 dark:text-zinc-100">
            Wedding Booking Calendar
          </h2>
          <p className="text-gray-400 dark:text-zinc-400 text-xs mt-0.5">
            Track confirmed vendor bookings and your wedding event schedule
          </p>
        </div>

        {/* Status Legend */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Confirmed Bookings
          </span>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToPreviousMonth}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 dark:bg-darkElevated hover:bg-orange/10 dark:hover:bg-orange/20 hover:text-orange border border-gray-200 dark:border-zinc-700 hover:border-orange/30 rounded-xl text-xs font-semibold text-gray-700 dark:text-zinc-200 transition-colors"
          title="Previous Month"
        >
          <FiChevronLeft size={16} />
          <span>Prev</span>
        </button>
        <h3 className="text-base sm:text-lg font-title font-bold text-gray-900 dark:text-zinc-100">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={goToNextMonth}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 dark:bg-darkElevated hover:bg-orange/10 dark:hover:bg-orange/20 hover:text-orange border border-gray-200 dark:border-zinc-700 hover:border-orange/30 rounded-xl text-xs font-semibold text-gray-700 dark:text-zinc-200 transition-colors"
          title="Next Month"
        >
          <span>Next</span>
          <FiChevronRight size={16} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-5 sm:gap-1.5 sm:mb-6">
        {/* Day Header Row */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-gray-400 dark:text-zinc-500 py-1.5 text-xs uppercase tracking-wider"
          >
            {day}
          </div>
        ))}

        {/* Day Cells */}
        {calendarDays.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="h-14 sm:h-16" />;
          }

          const isToday = day.getTime() === today.getTime();
          const isSelected =
            selectedDate && day.toDateString() === selectedDate.toDateString();
          const status = getDateStatus(day);
          const dayBookings = getBookingsForDate(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(isSelected ? null : day)}
              className={`h-14 sm:h-16 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 relative ${
                isSelected
                  ? "border-2 border-orange bg-orange/5 dark:bg-orange/10 shadow-xs"
                  : isToday
                  ? "border-orange/40 bg-orange/[0.02] dark:bg-orange/[0.08]"
                  : status
                  ? "border-gray-200 dark:border-zinc-700 hover:border-orange/40 bg-white dark:bg-darkElevated hover:bg-gray-50/80 dark:hover:bg-zinc-800"
                  : "border-gray-100 dark:border-zinc-800/80 hover:border-gray-200 dark:hover:border-zinc-700 bg-white dark:bg-darkSurface hover:bg-gray-50/50 dark:hover:bg-zinc-800/40"
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span
                  className={`text-xs font-semibold rounded-md w-5 h-5 flex items-center justify-center ${
                    isToday
                      ? "bg-orange text-white"
                      : isSelected
                      ? "text-orange font-bold"
                      : "text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  {day.getDate()}
                </span>
                {status && (
                  <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400">
                    {dayBookings.length}
                  </span>
                )}
              </div>

              {/* Status Indicator Dot */}
              {status && (
                <div className="flex items-center gap-1 mt-auto">
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-500"
                    title="Confirmed Booking"
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Details Panel */}
      {selectedDate && (
        <div className="mt-2 pt-5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-darkElevated/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-orange" size={16} />
              <h4 className="font-title font-bold text-gray-900 dark:text-zinc-100 text-sm sm:text-base">
                Bookings for {monthNames[selectedDate.getMonth()]}{" "}
                {selectedDate.getDate()}, {selectedDate.getFullYear()}
              </h4>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-gray-400 hover:text-gray-600 dark:text-zinc-400 dark:hover:text-zinc-200 p-1"
            >
              <FiX size={16} />
            </button>
          </div>

          {selectedDateBookings.length > 0 ? (
            <div className="space-y-3">
              {selectedDateBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white dark:bg-darkSurface rounded-xl p-4 border border-gray-200/80 dark:border-zinc-700/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    {b.packageName && (
                      <div className="mb-1.5">
                        <span className="inline-block bg-orange/10 text-orange text-xs font-semibold px-2.5 py-0.5 rounded-md">
                          {b.packageName}
                        </span>
                      </div>
                    )}

                    <h5 className="font-title font-bold text-gray-900 dark:text-zinc-100 text-base">
                      {b.title || b.offeringName || "Wedding Service"}
                    </h5>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-zinc-400 mt-1">
                      {b.serviceProvider?.name && (
                        <span className="flex items-center gap-1">
                          <FiShoppingBag size={12} className="text-orange" />
                          {b.serviceProvider.name}
                        </span>
                      )}
                      {b.time && (
                        <span className="flex items-center gap-1">
                          <FiClock size={12} className="text-orange" />
                          {b.time}
                        </span>
                      )}
                      {b.location && (
                        <span className="flex items-center gap-1">
                          <FiMapPin size={12} className="text-orange" />
                          {b.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-zinc-800 w-full sm:w-auto justify-between sm:justify-end">
                    {typeof b.amount === "number" && (
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium uppercase">
                          Total Price
                        </p>
                        <p className="font-title font-bold text-gray-900 dark:text-zinc-100 text-sm">
                          LKR {b.amount.toLocaleString()}
                        </p>
                      </div>
                    )}

                    <Link
                      href={`/visitor-dashboard/chats/${visitorId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange/10 hover:bg-orange text-orange hover:text-white dark:bg-orange/20 dark:text-orange dark:hover:bg-orange dark:hover:text-white font-semibold text-xs transition-all"
                    >
                      <FiMessageSquare size={13} />
                      <span>Chat</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-darkSurface rounded-xl p-6 text-center border border-gray-100 dark:border-zinc-800">
              <p className="text-gray-500 dark:text-zinc-400 text-xs mb-3">
                No vendor appointments or bookings scheduled on this date.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange hover:underline"
              >
                <span>Browse services available on this date &rarr;</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Summary Footer when no date selected */}
      {!selectedDate && (
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-zinc-400 gap-2">
          <span>
            {bookingsWithDates.length === 0
              ? "No scheduled bookings yet."
              : `${bookingsWithDates.length} confirmed booking${
                  bookingsWithDates.length === 1 ? "" : "s"
                } recorded on your wedding schedule.`}
          </span>
          <Link
            href="/services"
            className="text-orange font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Book more wedding services</span>
            <span>&rarr;</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default VisitorBookingCalendar;
