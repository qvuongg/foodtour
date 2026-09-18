/** Integrated velocity: ease in, cruise, then a long, gentle deceleration.
 * Presentation only; never used to choose the winning dish.
 */
export function spotlightProgress(progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  const acceleration = 0.12,
    cruise = 0.24,
    deceleration = 0.64;
  const total = acceleration / 2 + cruise + deceleration / 4;
  if (t < acceleration) {
    const u = t / acceleration;
    return (acceleration * (u ** 3 - 0.5 * u ** 4)) / total;
  }
  if (t < acceleration + cruise)
    return (acceleration / 2 + t - acceleration) / total;
  const u = (t - acceleration - cruise) / deceleration;
  return (
    (acceleration / 2 + cruise + (deceleration * (1 - (1 - u) ** 4)) / 4) /
    total
  );
}
