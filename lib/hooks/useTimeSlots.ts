import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getStartOfDay, getEndOfDay } from '../utils/date';

/**
 * Custom hook to fetch time slots for a specific date
 */
export function useTimeSlots(date: Date) {
  const dayStart = getStartOfDay(date).getTime();
  const dayEnd = getEndOfDay(date).getTime();

  return useLiveQuery(
    () => db.timeslots.where('start').between(dayStart, dayEnd, true, true).toArray(),
    [dayStart, dayEnd]
  );
}

/**
 * Custom hook to fetch time slots for a date range
 */
export function useTimeSlotsRange(startDate: Date, endDate: Date) {
  const start = startDate.getTime();
  const end = endDate.getTime();

  return useLiveQuery(
    () => db.timeslots.where('start').between(start, end, true, true).toArray(),
    [start, end]
  );
}
