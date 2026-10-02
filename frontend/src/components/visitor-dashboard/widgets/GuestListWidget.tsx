import React from "react";
import { FiUsers } from "react-icons/fi";
import ActionButton from "../common/ActionButton";
import EmptyStateDisplay from "../common/EmptyStateDisplay";

interface GuestListWidgetProps {
  attendingGuests: number;
  declinedGuests: number;
  invitedGuests: number;
  notInvitedGuests: number;
  totalGuests: number;
}

const GuestListWidget: React.FC<GuestListWidgetProps> = ({
  attendingGuests,
  declinedGuests,
  invitedGuests,
  notInvitedGuests,
  totalGuests,
}) => {
  return (
    <div className="bg-white dark:bg-darkSurface rounded-2xl border border-orange/20 shadow-sm hover:shadow-md hover:border-orange/30 transition-all duration-300 overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="px-4 md:px-5 lg:px-6 py-3.5 lg:py-4 border-b border-orange/15 dark:border-orange/20 bg-orange/[0.02] dark:bg-orange/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange/10 dark:bg-orange/20 text-orange flex items-center justify-center shrink-0 border border-orange/15 dark:border-orange/30 shadow-xs">
            <FiUsers className="h-5 w-5" />
          </div>
          <h3 className="font-title text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-100">
            Guest List
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 md:p-5 lg:p-6 flex-1 flex flex-col justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mb-3.5 font-body">
            Manage your wedding guest list with {totalGuests || 0} total guests across all categories.
          </p>

          {totalGuests > 0 ? (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Attending guests */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl p-2.5 text-center border border-emerald-200/80 dark:border-emerald-800/40 shadow-xs">
                <p className="font-title font-bold text-emerald-700 dark:text-emerald-400 text-lg sm:text-xl leading-tight">
                  {attendingGuests || 0}
                </p>
                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 font-body mt-0.5">Attending</p>
              </div>

              {/* Declined guests */}
              <div className="bg-rose-50/70 dark:bg-rose-950/30 rounded-xl p-2.5 text-center border border-rose-200/80 dark:border-rose-800/40 shadow-xs">
                <p className="font-title font-bold text-rose-600 dark:text-rose-400 text-lg sm:text-xl leading-tight">
                  {declinedGuests || 0}
                </p>
                <p className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 font-body mt-0.5">Declined</p>
              </div>

              {/* Invited guests */}
              <div className="bg-orange/5 dark:bg-orange/10 rounded-xl p-2.5 text-center border border-orange/20 dark:border-orange/30 shadow-xs">
                <p className="font-title font-bold text-orange text-lg sm:text-xl leading-tight">
                  {invitedGuests || 0}
                </p>
                <p className="text-[11px] font-semibold text-orange/90 dark:text-orange font-body mt-0.5">Invited</p>
              </div>

              {/* Not Invited guests */}
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-2.5 text-center border border-gray-200/80 dark:border-zinc-700 shadow-xs">
                <p className="font-title font-bold text-gray-700 dark:text-zinc-300 text-lg sm:text-xl leading-tight">
                  {notInvitedGuests || 0}
                </p>
                <p className="text-[11px] font-semibold text-gray-600 dark:text-zinc-400 font-body mt-0.5">Not Invited</p>
              </div>
            </div>
          ) : (
            <EmptyStateDisplay Icon={FiUsers} message="No guests added yet" />
          )}
        </div>

        <div className="pt-3.5 border-t border-orange/10 dark:border-zinc-800">
          <ActionButton href="/guest-list" label="Manage guest list" />
        </div>
      </div>
    </div>
  );
};

export default GuestListWidget;
