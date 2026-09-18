export interface DayColumn {
  dateString: string; // "YYYY-MM-DD"
  dayNumber: string;  // "01", "02", "16"
  dayOfWeekShort: string; // "SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"
  isWeekend: boolean;
  isToday: boolean;
  fullDate: Date;
}

const WEEKDAYS_PT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const MONTHS_SHORT_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export function getMonthDays(year: number, month: number): DayColumn[] {
  // month: 0-11
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = formatDateToISO(today);

  const days: DayColumn[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const current = new Date(year, month, d);
    const dayOfWeek = current.getDay(); // 0 = DOM, 6 = SÁB
    const dateStr = formatDateToISO(current);

    days.push({
      dateString: dateStr,
      dayNumber: String(d).padStart(2, '0'),
      dayOfWeekShort: WEEKDAYS_PT[dayOfWeek],
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isToday: dateStr === todayStr,
      fullDate: current,
    });
  }

  return days;
}

/**
 * Returns a 30-day sliding window or cycle period, like the 16/09 to 15/10 shown in the screenshot
 */
export function getCustomPeriodDays(startDate: Date, countDays: number = 30): DayColumn[] {
  const days: DayColumn[] = [];
  const today = new Date();
  const todayStr = formatDateToISO(today);

  for (let i = 0; i < countDays; i++) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    const dayOfWeek = current.getDay();
    const dateStr = formatDateToISO(current);

    days.push({
      dateString: dateStr,
      dayNumber: String(current.getDate()).padStart(2, '0'),
      dayOfWeekShort: WEEKDAYS_PT[dayOfWeek],
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isToday: dateStr === todayStr,
      fullDate: current,
    });
  }

  return days;
}

export function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatDateTimeBR(dateStr: string, timeStr?: string): string {
  const brDate = formatDateBR(dateStr);
  return timeStr ? `${brDate} às ${timeStr}` : brDate;
}

export function getMonthNamePT(monthIndex: number): string {
  return MONTHS_PT[monthIndex] || '';
}

export function getMonthShortNamePT(monthIndex: number): string {
  return MONTHS_SHORT_PT[monthIndex] || '';
}

export function getDaysDifference(dateStrA: string, dateStrB: string): number {
  const dateA = new Date(dateStrA + 'T00:00:00');
  const dateB = new Date(dateStrB + 'T00:00:00');
  const diffTime = Math.abs(dateB.getTime() - dateA.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getDaysSince(dateStr: string): number {
  if (!dateStr) return 9999;
  const targetDate = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - targetDate.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}
