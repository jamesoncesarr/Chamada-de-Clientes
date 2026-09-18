import { Client, CallRecord, Operator } from '../types';
import { getDaysSince, formatDateBR } from './dateUtils';

export interface ClientMetrics {
  client: Client;
  totalCalls: number;
  lastCallDate: string | null;
  lastCallTime?: string;
  lastCallOperator?: string;
  daysSinceLastCall: number;
  constancyAverageDays: number | null; // e.g. 5.2
  status: 'good' | 'warning' | 'critical';
  allCalls: CallRecord[];
}

export interface DashboardOverview {
  totalClients: number;
  totalCalls: number;
  callsThisMonth: number;
  callsToday: number;
  longestUncalledClient: ClientMetrics | null;
  fleetAverageConstancyDays: number; // overall average constancy (e.g., 5.3 days)
  clientsNeedingCallCount: number;
  operatorStats: {
    operator: Operator;
    count: number;
    percentage: number;
  }[];
  clientMetricsList: ClientMetrics[];
}

/**
 * Calculates constancy for a single client:
 * The average interval in days between successive calls.
 * e.g., called on 03/09, 08/09, 13/09, 18/09 -> intervals [5, 5, 5] -> avg = 5 days.
 */
export function calculateClientConstancy(clientCalls: CallRecord[]): number | null {
  if (clientCalls.length < 2) return null;

  // Sort calls chronologically
  const sorted = [...clientCalls].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].date + 'T00:00:00');
    const currDate = new Date(sorted[i].date + 'T00:00:00');
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      intervals.push(diffDays);
    }
  }

  if (intervals.length === 0) return null;
  const sum = intervals.reduce((acc, val) => acc + val, 0);
  return Number((sum / intervals.length).toFixed(1));
}

export function computeDashboardOverview(
  clients: Client[],
  calls: CallRecord[],
  operators: Operator[],
  alertDaysThreshold: number = 7
): DashboardOverview {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonth = todayStr.substring(0, 7); // YYYY-MM

  // Pre-index calls by clientId for O(1) instant lookup (prevents freezing on large datasets)
  const callsByClientId = new Map<string, CallRecord[]>();
  for (let i = 0; i < calls.length; i++) {
    const c = calls[i];
    const list = callsByClientId.get(c.clientId);
    if (list) {
      list.push(c);
    } else {
      callsByClientId.set(c.clientId, [c]);
    }
  }

  const clientMetricsList: ClientMetrics[] = clients.map((client) => {
    const clientCalls = callsByClientId.get(client.id) || [];

    // Sort calls descending (latest first)
    const sortedDesc = clientCalls.length > 1
      ? [...clientCalls].sort((a, b) => {
          return new Date(b.date + ' ' + (b.time || '00:00')).getTime() -
                 new Date(a.date + ' ' + (a.time || '00:00')).getTime();
        })
      : clientCalls;

    const latestCall = sortedDesc[0] || null;
    const daysSince = latestCall ? getDaysSince(latestCall.date) : 9999;
    const constancy = calculateClientConstancy(clientCalls);

    let status: 'good' | 'warning' | 'critical' = 'good';
    if (daysSince > alertDaysThreshold || !latestCall) {
      status = 'critical';
    } else if (daysSince > 3) {
      status = 'warning';
    }

    return {
      client,
      totalCalls: clientCalls.length,
      lastCallDate: latestCall ? latestCall.date : null,
      lastCallTime: latestCall?.time,
      lastCallOperator: latestCall?.operatorName,
      daysSinceLastCall: daysSince,
      constancyAverageDays: constancy,
      status,
      allCalls: sortedDesc,
    };
  });

  // Sort to find the client with the longest time without a call
  const sortedByDaysWithoutCall = [...clientMetricsList].sort((a, b) => {
    return b.daysSinceLastCall - a.daysSinceLastCall;
  });

  const longestUncalledClient = sortedByDaysWithoutCall[0] || null;

  // Calculate fleet-wide average constancy
  const clientsWithConstancy = clientMetricsList.filter(
    (c) => c.constancyAverageDays !== null && c.constancyAverageDays > 0
  );
  const fleetAverageConstancyDays =
    clientsWithConstancy.length > 0
      ? Number(
          (
            clientsWithConstancy.reduce((acc, c) => acc + (c.constancyAverageDays || 0), 0) /
            clientsWithConstancy.length
          ).toFixed(1)
        )
      : 5.0; // fallback standard 5 days

  const callsThisMonth = calls.filter((c) => c.date.startsWith(currentMonth)).length;
  const callsToday = calls.filter((c) => c.date === todayStr).length;

  // Calls by operator
  const totalCalls = calls.length;
  const operatorStats = operators.map((op) => {
    const count = calls.filter((c) => c.operatorId === op.id || c.operatorName === op.name).length;
    const percentage = totalCalls > 0 ? Math.round((count / totalCalls) * 100) : 0;
    return {
      operator: op,
      count,
      percentage,
    };
  });

  const clientsNeedingCallCount = clientMetricsList.filter((c) => c.status === 'critical').length;

  return {
    totalClients: clients.length,
    totalCalls,
    callsThisMonth,
    callsToday,
    longestUncalledClient,
    fleetAverageConstancyDays,
    clientsNeedingCallCount,
    operatorStats,
    clientMetricsList,
  };
}
