/**
 * A/B Test Utility
 * Assigns visitors to a variant (50/50 split) and persists the assignment
 * in sessionStorage so they see the same version throughout their session.
 */

export type Variant = 'A' | 'B';

export const getVariant = (testName: string): Variant => {
  const storageKey = `ab_test_${testName}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing === 'A' || existing === 'B') return existing;

  const variant: Variant = Math.random() < 0.5 ? 'A' : 'B';
  sessionStorage.setItem(storageKey, variant);
  return variant;
};
