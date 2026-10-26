import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

import { AmountPaidProps, PaidPercentage } from '@/types/budgeterTypes';
import { useTheme } from '@/contexts/ThemeContext';
import { calculatePercentage, calculateRemaining, formatBudgetAmount } from '@/utils/budgeter';

ChartJS.register(ArcElement, Tooltip, Legend);

const AmountPaid: React.FC<AmountPaidProps> = ({ amountPaid = 0.00, totalCost = 0.00 }) => {
  const { isDark } = useTheme();
  const paidPercentage: PaidPercentage = calculatePercentage(amountPaid, totalCost);

  const data = {
    datasets: [
      {
        data: [Number(paidPercentage), Math.max(0, 100 - Number(paidPercentage))],
        backgroundColor: ['#FC7B54', isDark ? '#2A2523' : '#FFEFEB'],
        borderWidth: 0,
        circumference: 360,
        rotation: -90,
      },
    ],
  };

  const options = {
    cutout: '82%',
    plugins: {
      tooltip: { enabled: false },
      legend: { display: false },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <div className="bg-white dark:bg-darkSurface rounded-3xl border-2 border-orange/20 dark:border-zinc-800 hover:border-orange dark:hover:border-orange shadow-xs hover:shadow-md transition-all p-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
      <div className="relative h-32 w-32 shrink-0">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-title text-2xl sm:text-3xl font-bold text-orange">
            {paidPercentage}%
          </span>
        </div>
      </div>
      <div className="text-center sm:text-left">
        <span className="text-xs font-bold uppercase tracking-wider text-orange">Settled</span>
        <h2 className="font-title text-xl sm:text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-0.5 mb-1">Amount Paid</h2>
        <p className="font-title text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
          {formatBudgetAmount(amountPaid)} <span className="text-sm font-semibold text-gray-500 dark:text-zinc-400">LKR</span>
        </p>
        <div className="text-xs text-gray-500 dark:text-zinc-400 font-body bg-orange/[0.04] dark:bg-darkElevated border border-orange/15 dark:border-zinc-700 rounded-xl px-3 py-1.5 inline-block">
          <span>Remaining: </span>
          <strong className="text-gray-800 dark:text-zinc-200 font-bold">{formatBudgetAmount(calculateRemaining(totalCost, amountPaid))} LKR</strong>
        </div>
      </div>
    </div>
  );
};

export default AmountPaid;