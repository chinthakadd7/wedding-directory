import React from "react";
import { FiDollarSign } from "react-icons/fi";
import ActionButton from "../common/ActionButton";
import EmptyStateDisplay from "../common/EmptyStateDisplay";

interface BudgetWidgetProps {
  budgetTotal: number;
  budgetSpent: number;
  budgetPercentage: number;
  visitorId: string | undefined;
}

const BudgetWidget: React.FC<BudgetWidgetProps> = ({
  budgetTotal,
  budgetSpent,
  budgetPercentage,
  visitorId,
}) => {
  return (
    <div className="bg-white dark:bg-darkSurface rounded-2xl border border-orange/20 shadow-sm hover:shadow-md hover:border-orange/30 transition-all duration-300 overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="px-4 md:px-5 lg:px-6 py-3.5 lg:py-4 border-b border-orange/15 dark:border-orange/20 bg-orange/[0.02] dark:bg-orange/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange/10 dark:bg-orange/20 text-orange flex items-center justify-center shrink-0 border border-orange/15 dark:border-orange/30 shadow-xs">
            <FiDollarSign className="h-5 w-5" />
          </div>
          <h3 className="font-title text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-100">
            Budget Tracker
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 md:p-5 lg:p-6 flex-1 flex flex-col justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mb-3.5 font-body">
            Track your wedding expenses and stay on budget.
          </p>

          {budgetTotal > 0 ? (
            <div className="space-y-2.5">
              <div className="flex justify-between items-baseline text-xs sm:text-sm font-body">
                <span className="text-gray-500 dark:text-zinc-400">
                  Spent:{" "}
                  <span className="font-bold font-title text-orange text-sm sm:text-base ml-1">
                    LKR {budgetSpent.toLocaleString()}
                  </span>
                </span>
                <span className="text-gray-500 dark:text-zinc-400">
                  Total:{" "}
                  <span className="font-bold font-title text-gray-800 dark:text-zinc-200 text-sm sm:text-base ml-1">
                    LKR {budgetTotal.toLocaleString()}
                  </span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-orange/10 dark:bg-zinc-800 rounded-full h-2.5 p-0.5 border border-orange/15 dark:border-zinc-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetPercentage > 90 ? "bg-rose-500" : "bg-orange"
                  }`}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>

              <div className="text-center pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange/10 dark:bg-orange/20 text-orange border border-orange/20 dark:border-orange/30 font-body">
                  <span>Budget used:</span>
                  <span className="font-bold">{budgetPercentage}%</span>
                </span>
              </div>
            </div>
          ) : (
            <EmptyStateDisplay Icon={FiDollarSign} message="No budget set up yet" />
          )}
        </div>

        <div className="pt-3.5 border-t border-orange/10 dark:border-zinc-800">
          <ActionButton
            href={`/visitor-dashboard/budgeter/${visitorId}`}
            label="Manage budget"
          />
        </div>
      </div>
    </div>
  );
};

export default BudgetWidget;
