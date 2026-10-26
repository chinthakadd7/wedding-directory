import React from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { calculatePercentage } from '@/utils/budgeter';

const BudgetHeader = ({ budget = 0.00, totalCost = 0.00 }) => {
  const utilizationPercentage = calculatePercentage(totalCost, budget, 1);

  return (
    <div className="bg-white dark:bg-darkSurface rounded-3xl border-2 border-orange/20 shadow-sm p-6 sm:p-8 relative overflow-hidden w-full">
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="mb-4">
            <Link
              href="/visitor-dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-2 sm:py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:text-orange dark:hover:text-orange bg-orange/5 dark:bg-darkElevated hover:bg-orange/15 dark:hover:bg-orange/15 border border-orange/20 dark:border-zinc-800 transition-all duration-200 active:scale-95 group w-fit"
            >
              <FiArrowLeft className="text-base sm:text-sm transition-transform group-hover:-translate-x-1 text-orange" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="font-title text-3xl sm:text-4xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
            My Budgeting Tool
          </h1>
          <p className="font-body text-gray-600 dark:text-zinc-400 text-sm sm:text-base mt-1.5 max-w-xl">
            Plan your wedding expenses effectively, track payments, and stay comfortably within budget.
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end bg-orange/[0.05] dark:bg-orange/[0.08] border-2 border-orange/20 rounded-2xl p-4 sm:p-5 shrink-0 min-w-[200px]">
          <p className="font-body text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Budget Utilized</p>
          <p className="font-title text-3xl sm:text-4xl font-bold text-orange my-0.5">{utilizationPercentage}%</p>
          <p className="font-body text-xs text-gray-500 dark:text-zinc-400">of your total budget</p>
        </div>
      </div>
    </div>
  );
};

export default BudgetHeader;
