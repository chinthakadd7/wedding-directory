import React from "react";
import { FiCheckSquare } from "react-icons/fi";
import ActionButton from "../common/ActionButton";
import EmptyStateDisplay from "../common/EmptyStateDisplay";

interface ChecklistWidgetProps {
  completedTasks: number;
  totalTasks: number;
  checklistProgress: number;
  visitorId: string | undefined;
}

const ChecklistWidget: React.FC<ChecklistWidgetProps> = ({
  completedTasks,
  totalTasks,
  checklistProgress,
  visitorId,
}) => {
  return (
    <div className="bg-white dark:bg-darkSurface rounded-2xl border border-orange/20 shadow-sm hover:shadow-md hover:border-orange/30 transition-all duration-300 overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="px-4 md:px-5 lg:px-6 py-3.5 lg:py-4 border-b border-orange/15 dark:border-orange/20 bg-orange/[0.02] dark:bg-orange/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange/10 dark:bg-orange/20 text-orange flex items-center justify-center shrink-0 border border-orange/15 dark:border-orange/30 shadow-xs">
            <FiCheckSquare className="h-5 w-5" />
          </div>
          <h3 className="font-title text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-100">
            Wedding Checklist
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 md:p-5 lg:p-6 flex-1 flex flex-col justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mb-3.5 font-body">
            Stay on track with your wedding planning tasks.
          </p>

          {totalTasks > 0 ? (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs sm:text-sm font-body">
                <span className="text-gray-500 dark:text-zinc-400">Progress</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange/10 dark:bg-orange/20 text-orange border border-orange/20 dark:border-orange/30 font-body">
                  {checklistProgress}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-orange/10 dark:bg-zinc-800 rounded-full h-2.5 p-0.5 border border-orange/15 dark:border-zinc-700">
                <div
                  className="bg-orange h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(checklistProgress, 100)}%` }}
                />
              </div>

              <div className="text-center pt-0.5">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 font-body">
                  <span className="font-bold text-orange font-title">
                    {completedTasks}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-gray-800 dark:text-zinc-200 font-title">
                    {totalTasks}
                  </span>{" "}
                  tasks completed
                </p>
              </div>
            </div>
          ) : (
            <EmptyStateDisplay Icon={FiCheckSquare} message="No tasks added yet" />
          )}
        </div>

        <div className="pt-3.5 border-t border-orange/10 dark:border-zinc-800">
          <ActionButton
            href={`/visitor-dashboard/checklist/${visitorId}`}
            label="View checklist"
          />
        </div>
      </div>
    </div>
  );
};

export default ChecklistWidget;
