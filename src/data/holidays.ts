import { isSameDay } from 'date-fns';

interface Holiday {
  date: Date;
  name: string;
}

// South African Public Holidays for 2025
export const holidays: Holiday[] = [
  { date: new Date(2025, 0, 1), name: 'New Year\'s Day' },
  { date: new Date(2025, 2, 21), name: 'Human Rights Day' },
  { date: new Date(2025, 3, 18), name: 'Good Friday' },
  { date: new Date(2025, 3, 21), name: 'Family Day' },
  { date: new Date(2025, 3, 27), name: 'Freedom Day' },
  { date: new Date(2025, 4, 1), name: 'Workers\' Day' },
  { date: new Date(2025, 5, 16), name: 'Youth Day' },
  { date: new Date(2025, 7, 9), name: 'National Women\'s Day' },
  { date: new Date(2025, 8, 24), name: 'Heritage Day' },
  { date: new Date(2025, 11, 16), name: 'Day of Reconciliation' },
  { date: new Date(2025, 11, 25), name: 'Christmas Day' },
  { date: new Date(2025, 11, 26), name: 'Day of Goodwill' }
];

export function isHoliday(date: Date): Holiday | undefined {
  return holidays.find(holiday => isSameDay(holiday.date, date));
}
