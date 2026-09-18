import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  Calendar,
  Users,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart2,
  Activity,
  Flame,
  Clock,
  Sparkles,
  Info,
  Search,
  UserCheck,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { CallRecord, Operator, Client } from '../types';
import { getMonthNamePT, formatDateBR } from '../utils/dateUtils';

interface RendimentoViewProps {
  calls: CallRecord[];
  operators: Operator[];
  clients: Client[];
  currentYear: number;
  currentMonth: number; // 0-11
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onResetToToday: () => void;
}

// Distinct high-contrast colors for operator lines
const OPERATOR_COLORS = [
  { stroke: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-500', lightBg: 'bg-blue-50' },
  { stroke: '#059669', bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-500', lightBg: 'bg-emerald-50' },
  { stroke: '#d97706', bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-500', lightBg: 'bg-amber-50' },
  { stroke: '#7c3aed', bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-500', lightBg: 'bg-purple-50' },
  { stroke: '#e11d48', bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-500', lightBg: 'bg-rose-50' },
  { stroke: '#0891b2', bg: 'bg-cyan-600', text: 'text-cyan-600', border: 'border-cyan-500', lightBg: 'bg-cyan-50' },
];

export const RendimentoView: React.FC<RendimentoViewProps> = ({
  calls,
  operators,
  clients,
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onResetToToday,
}) => {
  // User filter state (selected user or 'ALL')
  const [selectedUserFilter, setSelectedUserFilter] = useState<'ALL' | string>('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Map operator IDs to consistent color profiles
  const operatorColorMap = useMemo(() => {
    const map = new Map<string, typeof OPERATOR_COLORS[0]>();
    operators.forEach((op, index) => {
      map.set(op.id, OPERATOR_COLORS[index % OPERATOR_COLORS.length]);
    });
    return map;
  }, [operators]);

  // View state: filtered operators in line chart
  const [visibleOperatorIds, setVisibleOperatorIds] = useState<string[]>(() =>
    operators.map((op) => op.id)
  );

  // Sync visibleOperatorIds when a single user is selected
  const effectiveVisibleOperatorIds = useMemo(() => {
    if (selectedUserFilter !== 'ALL') {
      return [selectedUserFilter];
    }
    if (visibleOperatorIds.length === 0) return operators.map((o) => o.id);
    return visibleOperatorIds;
  }, [selectedUserFilter, visibleOperatorIds, operators]);

  const toggleOperatorVisibility = (opId: string) => {
    if (selectedUserFilter !== 'ALL') {
      // If a specific user is selected, toggling switches back to ALL or that user
      setSelectedUserFilter('ALL');
      setVisibleOperatorIds([opId]);
      return;
    }

    setVisibleOperatorIds((prev) => {
      if (prev.includes(opId)) {
        if (prev.length === 1) return operators.map((o) => o.id);
        return prev.filter((id) => id !== opId);
      } else {
        return [...prev, opId];
      }
    });
  };

  const showAllOperators = () => {
    setSelectedUserFilter('ALL');
    setVisibleOperatorIds(operators.map((o) => o.id));
  };

  // Calculate days in the currently selected month
  const daysInMonth = useMemo(() => {
    const date = new Date(currentYear, currentMonth + 1, 0);
    return date.getDate();
  }, [currentYear, currentMonth]);

  // Format month prefix YYYY-MM
  const monthPrefix = useMemo(() => {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    return `${currentYear}-${mStr}`;
  }, [currentYear, currentMonth]);

  // Filter calls for this month
  const monthCalls = useMemo(() => {
    return calls.filter((c) => c.date.startsWith(monthPrefix));
  }, [calls, monthPrefix]);

  // Today string for comparison
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Daily line chart dataset
  const chartData = useMemo(() => {
    const data: Array<{
      dayNumber: number;
      dayLabel: string;
      dateStr: string;
      dayOfWeek: string;
      totalTeam: number;
      [key: string]: number | string;
    }> = [];

    const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayFormatted = String(day).padStart(2, '0');
      const dateStr = `${monthPrefix}-${dayFormatted}`;
      const dObj = new Date(currentYear, currentMonth, day);
      const dayOfWeek = weekDayNames[dObj.getDay()];

      const dayCalls = monthCalls.filter((c) => c.date === dateStr);

      const entry: {
        dayNumber: number;
        dayLabel: string;
        dateStr: string;
        dayOfWeek: string;
        totalTeam: number;
        [key: string]: number | string;
      } = {
        dayNumber: day,
        dayLabel: `${dayFormatted}/${String(currentMonth + 1).padStart(2, '0')}`,
        dateStr,
        dayOfWeek,
        totalTeam: dayCalls.length,
      };

      operators.forEach((op) => {
        const opCount = dayCalls.filter((c) => c.operatorId === op.id).length;
        entry[op.id] = opCount;
      });

      data.push(entry);
    }

    return data;
  }, [daysInMonth, monthPrefix, currentYear, currentMonth, monthCalls, operators]);

  // Operator aggregated stats
  const operatorMetrics = useMemo(() => {
    const totalMonthCalls = monthCalls.length;

    return operators.map((op) => {
      const opCalls = monthCalls.filter((c) => c.operatorId === op.id);

      // Active days count
      const activeDays = new Set(opCalls.map((c) => c.date));
      const activeDaysCount = activeDays.size;

      // Average per active day
      const avgPerActiveDay =
        activeDaysCount > 0 ? (opCalls.length / activeDaysCount).toFixed(1) : '0.0';

      // Peak calls in a single day
      const callsByDateMap = new Map<string, number>();
      opCalls.forEach((c) => {
        callsByDateMap.set(c.date, (callsByDateMap.get(c.date) || 0) + 1);
      });

      let peakCount = 0;
      let peakDate = '';
      callsByDateMap.forEach((count, date) => {
        if (count > peakCount) {
          peakCount = count;
          peakDate = date;
        }
      });

      // Distinct clients reached
      const uniqueClients = new Set(opCalls.map((c) => c.clientId));

      // Calls today
      const callsToday = opCalls.filter((c) => c.date === todayStr).length;

      // Share of total
      const sharePercentage =
        totalMonthCalls > 0 ? Math.round((opCalls.length / totalMonthCalls) * 100) : 0;

      const color = operatorColorMap.get(op.id) || OPERATOR_COLORS[0];

      return {
        operator: op,
        totalCalls: opCalls.length,
        activeDaysCount,
        avgPerActiveDay,
        peakCount,
        peakDate,
        uniqueClientsCount: uniqueClients.size,
        callsToday,
        sharePercentage,
        color,
      };
    });
  }, [operators, monthCalls, todayStr, operatorColorMap]);

  // Ranked operators
  const rankedOperators = useMemo(() => {
    return [...operatorMetrics].sort((a, b) => b.totalCalls - a.totalCalls);
  }, [operatorMetrics]);

  const topOperator = rankedOperators[0];

  // Specific selected operator metrics if filtered
  const selectedOperatorMetric = useMemo(() => {
    if (selectedUserFilter === 'ALL') return null;
    return operatorMetrics.find((m) => m.operator.id === selectedUserFilter) || null;
  }, [selectedUserFilter, operatorMetrics]);

  // Filtered operator list based on search query
  const filteredOperatorsList = useMemo(() => {
    if (!userSearchQuery.trim()) return operators;
    const q = userSearchQuery.toLowerCase();
    return operators.filter(
      (op) =>
        op.name.toLowerCase().includes(q) ||
        op.role.toLowerCase().includes(q) ||
        (op.email && op.email.toLowerCase().includes(q))
    );
  }, [operators, userSearchQuery]);

  // Dynamic KPI numbers depending on whether user filter is active
  const kpiTotalCalls = useMemo(() => {
    if (selectedOperatorMetric) {
      return selectedOperatorMetric.totalCalls;
    }
    return monthCalls.length;
  }, [selectedOperatorMetric, monthCalls]);

  const kpiActiveDays = useMemo(() => {
    if (selectedOperatorMetric) {
      return selectedOperatorMetric.activeDaysCount;
    }
    const uniqueDates = new Set(monthCalls.map((c) => c.date));
    return uniqueDates.size;
  }, [selectedOperatorMetric, monthCalls]);

  const kpiAverageDaily = useMemo(() => {
    if (selectedOperatorMetric) {
      return selectedOperatorMetric.avgPerActiveDay;
    }
    if (kpiActiveDays === 0) return '0.0';
    return (monthCalls.length / kpiActiveDays).toFixed(1);
  }, [selectedOperatorMetric, monthCalls.length, kpiActiveDays]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Filters for Rendimento */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">
                Rendimento dos Usuários
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Acompanhamento de chamadas diárias por operador. Indicadores e gráficos calculados em tempo real.
            </p>
          </div>

          {/* Month Selector for Rendimento */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
              <button
                onClick={onPrevMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-4 text-center min-w-[140px]">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {getMonthNamePT(currentMonth)} {currentYear}
                </div>
                <div className="text-[10px] text-slate-500">Período de Análise</div>
              </div>
              <button
                onClick={onNextMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onResetToToday}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-2xs cursor-pointer"
              title="Voltar ao mês atual"
            >
              Mês Atual
            </button>
          </div>
        </div>

        {/* User Search and Filter Bar (Requested by user) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* User selector dropdown & quick search */}
          <div className="flex flex-col sm:flex-row items-center gap-2 flex-1">
            <div className="relative w-full sm:w-64">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-8 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-2xs"
              >
                <option value="ALL">Todos os Usuários (Visão da Equipe)</option>
                {operators.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.name} ({op.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick search input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Buscar usuário por nome ou cargo..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              {userSearchQuery && (
                <button
                  onClick={() => setUserSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick User Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedUserFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                selectedUserFilter === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todos
            </button>
            {filteredOperatorsList.map((op) => {
              const isSelected = selectedUserFilter === op.id;
              const color = operatorColorMap.get(op.id) || OPERATOR_COLORS[0];

              return (
                <button
                  key={op.id}
                  onClick={() => setSelectedUserFilter(isSelected ? 'ALL' : op.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? `${color.bg} text-white border-transparent shadow-xs`
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : ''}`}
                    style={{ backgroundColor: isSelected ? '#ffffff' : color.stroke }}
                  />
                  <span>{op.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected User Notice Banner */}
        {selectedOperatorMetric && (
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg text-white font-bold flex items-center justify-center text-[10px]"
                style={{ backgroundColor: selectedOperatorMetric.color.stroke }}
              >
                {selectedOperatorMetric.operator.name[0]}
              </div>
              <div>
                <span className="font-bold text-blue-900">
                  Visualizando indicadores e gráfico individual de: {selectedOperatorMetric.operator.name}
                </span>
                <span className="text-blue-700 ml-2">({selectedOperatorMetric.operator.role})</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedUserFilter('ALL')}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
            >
              Voltar para Todos os Usuários
            </button>
          </div>
        )}
      </div>

      {/* 4 Summary KPI Indicator Cards (Dynamically adapted to user or team) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total de Chamadas */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {selectedOperatorMetric ? 'Chamadas do Usuário' : 'Total de Chamadas'}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {kpiTotalCalls}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {selectedOperatorMetric
                  ? `${selectedOperatorMetric.sharePercentage}% de todas as chamadas da equipe`
                  : 'Checks de chamadas marcados no mês'}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Destaque / Posição */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>{selectedOperatorMetric ? 'Desempenho no Período' : 'Operador Destaque'}</span>
            </div>
            <div className="text-base font-extrabold text-slate-900 truncate mt-0.5">
              {selectedOperatorMetric
                ? `${selectedOperatorMetric.totalCalls} chamadas registradas`
                : topOperator && topOperator.totalCalls > 0
                ? topOperator.operator.name
                : 'Nenhum'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {selectedOperatorMetric ? (
                <span className="font-semibold text-emerald-700">
                  {selectedOperatorMetric.uniqueClientsCount} clientes distintos contatados
                </span>
              ) : topOperator && topOperator.totalCalls > 0 ? (
                <span className="font-semibold text-emerald-700">
                  {topOperator.totalCalls} chamadas ({topOperator.sharePercentage}% da equipe)
                </span>
              ) : (
                'Sem registros no mês'
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Média por Dia Ativo */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Média por Dia Ativo
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {kpiAverageDaily}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Chamadas / dia trabalhado</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shrink-0">
            <BarChart2 className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Dias com Chamadas */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Dias com Chamadas
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {kpiActiveDays} <span className="text-xs font-normal text-slate-400">/ {daysInMonth} dias</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {selectedOperatorMetric
                  ? selectedOperatorMetric.callsToday > 0
                    ? `${selectedOperatorMetric.callsToday} chamadas hoje`
                    : 'Sem chamadas hoje'
                  : 'Dias com checks ativos na equipe'}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* MAIN FEATURE: Gráfico de Linhas por Dia */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        {/* Header of Chart with Operator Visibility Toggles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                Gráfico de Linhas: Chamadas por Dia
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                {getMonthNamePT(currentMonth)} {currentYear}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cada linha representa as mensagens e chamadas enviadas por dia. Nos dias sem envio, a linha permanece no zero (0).
            </p>
          </div>

          {/* Operator Legend & Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Exibir Linhas:</span>
            </span>

            {operators.map((op) => {
              const color = operatorColorMap.get(op.id) || OPERATOR_COLORS[0];
              const isVisible = effectiveVisibleOperatorIds.includes(op.id);

              return (
                <button
                  key={op.id}
                  onClick={() => toggleOperatorVisibility(op.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isVisible
                      ? `${color.lightBg} ${color.text} ${color.border} shadow-2xs`
                      : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60'
                  }`}
                  title={`Clique para ${isVisible ? 'ocultar' : 'exibir'} a linha de ${op.name}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: isVisible ? color.stroke : '#94a3b8' }}
                  />
                  <span>{op.name}</span>
                </button>
              );
            })}

            {effectiveVisibleOperatorIds.length < operators.length && (
              <button
                onClick={showAllOperators}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline px-1 cursor-pointer"
              >
                Exibir Todos
              </button>
            )}
          </div>
        </div>

        {/* Recharts Line Chart Container */}
        <div className="pt-6 pb-2 w-full h-[360px] select-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 25, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              
              <XAxis
                dataKey="dayNumber"
                stroke="#64748b"
                tick={{ fontSize: 11, fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `${val}`}
              />

              <YAxis
                allowDecimals={false}
                stroke="#64748b"
                tick={{ fontSize: 11, fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                domain={[0, 'dataMax + 1']}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0]?.payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-xs rounded-xl shadow-xl border border-slate-200 p-3 text-xs min-w-[210px]">
                        <div className="font-extrabold text-slate-900 border-b border-slate-100 pb-1.5 mb-2 flex items-center justify-between">
                          <span>
                            Dia {label} ({dataPoint?.dayOfWeek}) - {dataPoint?.dateStr}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            Total: {dataPoint?.totalTeam}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {payload.map((entry: any) => {
                            const opName = entry.name;
                            const count = entry.value;
                            return (
                              <div
                                key={entry.dataKey}
                                className="flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: entry.stroke }}
                                  />
                                  <span className="font-semibold text-slate-700 truncate">
                                    {opName}
                                  </span>
                                </div>
                                <span
                                  className={`font-mono font-bold ${
                                    count > 0 ? 'text-slate-900' : 'text-slate-400'
                                  }`}
                                >
                                  {count} {count === 1 ? 'chamada' : 'chamadas'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Render one Line for each visible operator */}
              {operators
                .filter((op) => effectiveVisibleOperatorIds.includes(op.id))
                .map((op) => {
                  const color = operatorColorMap.get(op.id) || OPERATOR_COLORS[0];
                  const isFilteredSingle = selectedUserFilter === op.id;

                  return (
                    <Line
                      key={op.id}
                      type="monotone"
                      dataKey={op.id}
                      name={op.name}
                      stroke={color.stroke}
                      strokeWidth={isFilteredSingle ? 3.5 : 2.5}
                      dot={{ r: isFilteredSingle ? 4 : 3, fill: color.stroke, strokeWidth: 1, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: color.stroke, stroke: '#ffffff', strokeWidth: 2 }}
                      connectNulls={false}
                    />
                  );
                })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Footer Note */}
        <div className="mt-2 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              O gráfico reflete em tempo real os checks de mensagens e chamadas marcados.
            </span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span>Eixo horizontal: Dias do mês (1 a {daysInMonth})</span>
          </div>
        </div>
      </div>

      {/* Operator Individual Performance Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>
              {selectedUserFilter !== 'ALL'
                ? 'Card de Desempenho do Usuário Selecionado'
                : 'Detalhamento por Usuário'}
            </span>
          </h3>

          {selectedUserFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedUserFilter('ALL')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              Ver todos os usuários
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankedOperators
            .filter((metric) => {
              if (selectedUserFilter !== 'ALL') {
                return metric.operator.id === selectedUserFilter;
              }
              if (!userSearchQuery.trim()) return true;
              const q = userSearchQuery.toLowerCase();
              return (
                metric.operator.name.toLowerCase().includes(q) ||
                metric.operator.role.toLowerCase().includes(q)
              );
            })
            .map((metric, idx) => {
              const isLeader = idx === 0 && metric.totalCalls > 0 && selectedUserFilter === 'ALL';

              return (
                <div
                  key={metric.operator.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                >
                  {/* Top highlight strip */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: metric.color.stroke }}
                  />

                  <div>
                    {/* Operator Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl text-white font-black flex items-center justify-center text-sm shadow-xs"
                          style={{ backgroundColor: metric.color.stroke }}
                        >
                          {metric.operator.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-slate-900 truncate">
                              {metric.operator.name}
                            </h4>
                            {isLeader && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase flex items-center gap-0.5">
                                <Award className="w-3 h-3" />
                                1º Lugar
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {metric.operator.role}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-black text-slate-900">
                          {metric.totalCalls}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">
                          Chamadas
                        </div>
                      </div>
                    </div>

                    {/* Share Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                        <span>Participação na equipe</span>
                        <span className="font-bold text-slate-900">{metric.sharePercentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${metric.sharePercentage}%`,
                            backgroundColor: metric.color.stroke,
                          }}
                        />
                      </div>
                    </div>

                    {/* Grid of Sub-metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">
                          Média / Dia Ativo
                        </div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                          {metric.avgPerActiveDay} <span className="text-[10px] font-normal text-slate-400">chamadas</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">
                          Melhor Dia (Pico)
                        </div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                          {metric.peakCount > 0 ? (
                            <span>
                              {metric.peakCount} <span className="text-[10px] font-normal text-slate-500">({formatDateBR(metric.peakDate).slice(0, 5)})</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">
                          Clientes Distintos
                        </div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                          {metric.uniqueClientsCount} clientes
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">
                          Atividade Hoje
                        </div>
                        <div className="text-sm font-bold mt-0.5 flex items-center gap-1">
                          {metric.callsToday > 0 ? (
                            <span className="text-emerald-700 font-bold">
                              {metric.callsToday} hoje
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">Nenhuma hoje</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer status pill */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Dias com chamadas registradas:</span>
                    <span className="font-bold text-slate-800">
                      {metric.activeDaysCount} {metric.activeDaysCount === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
              Tabela Diária de Rendimento ({getMonthNamePT(currentMonth)} {currentYear})
            </h4>
            <p className="text-[11px] text-slate-500">
              Visualização dia a dia com a contagem exata de chamadas de cada usuário.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            {daysInMonth} dias analisados
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 select-none">
              <tr>
                <th className="px-4 py-2.5">Data</th>
                <th className="px-3 py-2.5">Dia da Semana</th>
                {operators
                  .filter((op) => selectedUserFilter === 'ALL' || op.id === selectedUserFilter)
                  .map((op) => {
                    const color = operatorColorMap.get(op.id) || OPERATOR_COLORS[0];
                    return (
                      <th key={op.id} className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color.stroke }}
                          />
                          <span>{op.name}</span>
                        </div>
                      </th>
                    );
                  })}
                <th className="px-4 py-2.5 text-center font-black">
                  {selectedUserFilter === 'ALL' ? 'Total do Dia' : 'Total do Usuário'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chartData
                .slice()
                .reverse() // show latest days first
                .map((row) => {
                  const isWeekend = row.dayOfWeek === 'Sáb' || row.dayOfWeek === 'Dom';
                  const isToday = row.dateStr === todayStr;
                  const relevantOperators = operators.filter(
                    (op) => selectedUserFilter === 'ALL' || op.id === selectedUserFilter
                  );
                  const rowDayTotal =
                    selectedUserFilter === 'ALL'
                      ? row.totalTeam
                      : (row[selectedUserFilter] as number) || 0;

                  return (
                    <tr
                      key={row.dateStr}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isToday
                          ? 'bg-blue-50/60 font-semibold'
                          : isWeekend
                          ? 'bg-slate-50/40 text-slate-500'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 font-mono text-slate-800 flex items-center gap-2">
                        <span>{row.dayLabel}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[9px] font-bold uppercase">
                            Hoje
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium">
                        {row.dayOfWeek}
                      </td>
                      {relevantOperators.map((op) => {
                        const count = (row[op.id] as number) || 0;
                        const color = operatorColorMap.get(op.id) || OPERATOR_COLORS[0];

                        return (
                          <td key={op.id} className="px-3 py-2.5 text-center">
                            {count > 0 ? (
                              <span
                                className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-extrabold"
                                style={{
                                  backgroundColor: color.stroke + '15',
                                  color: color.stroke,
                                }}
                              >
                                {count}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono">0</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2.5 text-center font-bold">
                        {rowDayTotal > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-xs">
                            {rowDayTotal}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
