export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

// One rounding rule everywhere: per unit, half away from zero, to the cent.
export function percentOf(cents: number, percent: number): number {
  return Math.round((cents * percent) / 100);
}
