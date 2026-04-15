/**
 * Аналог MySQL: FLOOR(DATEDIFF(NOW(), career_start_date)) / 365.
 * Не хранится в БД, отдаётся в API как yearsInCurrentRole.
 */
export function computeYearsInCurrentRole(
  careerStartDate: Date | string | null | undefined
): number | null {
  if (careerStartDate == null) return null;
  const start = new Date(careerStartDate);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((now.getTime() - start.getTime()) / msPerDay);
  if (diffDays < 0) return null;
  return diffDays / 365;
}
