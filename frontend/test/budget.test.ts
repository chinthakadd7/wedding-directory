import {
  calculatePercentage,
  calculateRemaining,
  formatBudgetAmount,
} from '@/utils/budgeter';

describe('budget utilities', () => {
  describe('calculatePercentage', () => {
    it('calculates a percentage with the requested precision', () => {
      expect(calculatePercentage(125, 500, 1)).toBe('25.0');
    });

    it('returns zero when the total is zero or negative', () => {
      expect(calculatePercentage(100, 0)).toBe('0');
      expect(calculatePercentage(100, -500, 1)).toBe('0.0');
    });
  });

  describe('calculateRemaining', () => {
    it('calculates the unpaid balance', () => {
      expect(calculateRemaining(250000, 75000)).toBe(175000);
    });

    it('does not return a negative balance when payments exceed the total', () => {
      expect(calculateRemaining(100000, 125000)).toBe(0);
    });
  });

  describe('formatBudgetAmount', () => {
    it('formats an amount using the locale number format', () => {
      expect(formatBudgetAmount(125000)).toBe((125000).toLocaleString());
    });
  });
});
