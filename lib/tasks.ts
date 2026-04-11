export type TaskRepeatType = "none" | "daily" | "weekly" | "monthly" | "custom";

export function computeNextDueDate(
  dueDate: Date,
  repeatType: TaskRepeatType,
  repeatInterval?: number | null
): Date | null {
  if (repeatType === "none") {
    return null;
  }

  const next = new Date(dueDate);
  const safeInterval = repeatInterval && repeatInterval > 0 ? repeatInterval : 1;

  if (repeatType === "daily") {
    next.setDate(next.getDate() + safeInterval);
    return next;
  }

  if (repeatType === "weekly") {
    next.setDate(next.getDate() + safeInterval * 7);
    return next;
  }

  if (repeatType === "monthly") {
    next.setMonth(next.getMonth() + safeInterval);
    return next;
  }

  next.setDate(next.getDate() + safeInterval);
  return next;
}
