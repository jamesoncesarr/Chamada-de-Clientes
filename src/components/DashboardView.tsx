import React, { useState, useMemo } from 'react';
import {
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  PhoneCall,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  ArrowUpDown,
  MessageSquare,
  Copy,
  ExternalLink,
  Flame,
  Award,
  Filter,
  MapPin,
  Folder,
  X,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Client, CallRecord, Operator, Regional, Territory } from '../types';
import { computeDashboardOverview, ClientMetrics } from '../utils/metricsUtils';
import { formatDateBR } from '../utils/dateUtils';
import { INITIAL_REGIONAIS, INITIAL_TERRITORIES } from '../data/territoriesData';

interface DashboardViewProps {
  clients: Client[];
  calls: CallRecord[];
  operators: Operator[];
  alertDaysThreshold: number;
  regionais?: Regional[];
  territories?: Territory[];
  onSelectClient: (client: Client) => void;
  onCopyPhone: (phone: string, label: string) => void;
  onOpenWhatsApp: (client: Client, phone: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clients,
  calls,
  operators,
  alertDaysThreshold,
  regionais = INITIAL_REGIONAIS,
  territories = INITIAL_TERRITORIES,
  onSelectClient,
  onCopyPhone,
  onOpenWhatsApp,
}) => {
  // Filters
  const [selectedUser, setSelectedUser] = useState<'ALL' | string>('ALL');
  const [selectedRegional, setSelectedRegional] = useState<'ALL' | string>('ALL');
  const [selectedTerritory, setSelectedTerritory] = useState<'ALL' | string>('ALL');
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'critical' | 'warning' | 'good'>('ALL');
  const [sortBy, setSortBy] = useState<'longest_uncalled' | 'most_calls' | 'name' | 'constancy'>('longest_uncalled');

  // Available territories based on selected regional
  const availableTerritories = useMemo(() => {
    if (selectedRegional === 'ALL') return territories;
    return territories.filter((t) => t.regional === selectedRegional);
  }, [selectedRegional, territories]);

  // Handle changing regional (reset territory if incompatible)
  const handleRegionalChange = (newRegional: string) => {
    setSelectedRegional(newRegional);
    if (newRegional !== 'ALL') {
      const match = territories.find(
        (t) => t.regional === newRegional && t.name === selectedTerritory
      );
      if (!match) {
        setSelectedTerritory('ALL');
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedUser('ALL');
    setSelectedRegional('ALL');
    setSelectedTerritory('ALL');
    setTableSearch('');
    setStatusFilter('ALL');
  };

  const isAnyFilterActive =
    selectedUser !== 'ALL' || selectedRegional !== 'ALL' || selectedTerritory !== 'ALL';

  // Filter clients by Regional and Territory
  const scopedClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesRegional =
        selectedRegional === 'ALL' || (c.regional && c.regional === selectedRegional);
      const targetTer = territories.find((t) => t.name === selectedTerritory);
      const matchesTerritory =
        selectedTerritory === 'ALL' ||
        (c.territory && c.territory === selectedTerritory) ||
        (targetTer && targetTer.code && c.territoryCode === targetTer.code);
      return matchesRegional && matchesTerritory;
    });
  }, [clients, selectedRegional, selectedTerritory, territories]);

  // Filter calls by Operator and scoped clients
  const scopedCalls = useMemo(() => {
    const scopedClientIds = new Set(scopedClients.map((c) => c.id));
    return calls.filter((c) => {
      const matchesClient = scopedClientIds.has(c.clientId);
      const matchesOperator = selectedUser === 'ALL' || c.operatorId === selectedUser;
      return matchesClient && matchesOperator;
    });
  }, [calls, scopedClients, selectedUser]);

  // Compute overview based on filtered scope
  const overview = useMemo(() => {
    return computeDashboardOverview(scopedClients, scopedCalls, operators, alertDaysThreshold);
  }, [scopedClients, scopedCalls, operators, alertDaysThreshold]);

  // Performance data by Territory
  const territoryPerformance = useMemo(() => {
    return territories
      .filter((t) => selectedRegional === 'ALL' || t.regional === selectedRegional)
      .map((t) => {
        const territoryClients = clients.filter((c) => c.territory === t.name);
        const territoryClientIds = new Set(territoryClients.map((c) => c.id));
        const territoryCalls = calls.filter((c) => {
          const inClient = territoryClientIds.has(c.clientId);
          const inOperator = selectedUser === 'ALL' || c.operatorId === selectedUser;
          return inClient && inOperator;
        });

        // Clients called at least once
        const calledClientIds = new Set(territoryCalls.map((c) => c.clientId));
        const coveragePercent =
          territoryClients.length > 0
            ? Math.round((calledClientIds.size / territoryClients.length) * 100)
            : 0;

        return {
          territory: t,
          totalClients: territoryClients.length,
          calledClientsCount: calledClientIds.size,
          totalCalls: territoryCalls.length,
          coveragePercent,
        };
      });
  }, [territories, selectedRegional, clients, calls, selectedUser]);

  // Filter and sort client metrics list for table
  const filteredList = useMemo(() => {
    const list = overview.clientMetricsList.filter((item) => {
      const matchesSearch =
        item.client.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        item.client.farm.toLowerCase().includes(tableSearch.toLowerCase()) ||
        item.client.code.toLowerCase().includes(tableSearch.toLowerCase()) ||
        (item.client.territory &&
          item.client.territory.toLowerCase().includes(tableSearch.toLowerCase())) ||
        (item.client.regional &&
          item.client.regional.toLowerCase().includes(tableSearch.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    list.sort((a, b) => {
      if (sortBy === 'longest_uncalled') {
        return b.daysSinceLastCall - a.daysSinceLastCall;
      }
      if (sortBy === 'most_calls') {
        return b.totalCalls - a.totalCalls;
      }
      if (sortBy === 'constancy') {
        const aVal = a.constancyAverageDays || 999;
        const bVal = b.constancyAverageDays || 999;
        return aVal - bVal;
      }
      return a.client.name.localeCompare(b.client.name);
    });

    return list;
  }, [overview.clientMetricsList, tableSearch, statusFilter, sortBy]);

  // High performance pagination for dashboard client table
  const [dashPageSize, setDashPageSize] = useState<number>(50);
  const [dashCurrentPage, setDashCurrentPage] = useState<number>(1);

  React.useEffect(() => {
    setDashCurrentPage(1);
  }, [tableSearch, statusFilter, sortBy, selectedRegional, selectedTerritory, selectedUser, dashPageSize]);

  const dashTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredList.length / dashPageSize));
  }, [filteredList.length, dashPageSize]);

  const paginatedDashboardList = useMemo(() => {
    const start = (dashCurrentPage - 1) * dashPageSize;
    return filteredList.slice(start, start + dashPageSize);
  }, [filteredList, dashCurrentPage, dashPageSize]);

  const dashStartRecord = filteredList.length === 0 ? 0 : (dashCurrentPage - 1) * dashPageSize + 1;
  const dashEndRecord = Math.min(dashCurrentPage * dashPageSize, filteredList.length);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Global Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Dashboard de Gestão & Métricas</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtre indicadores por Usuário, Regional e Território para acompanhar o atendimento da carteira de clientes.
            </p>
          </div>

          {isAnyFilterActive && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer self-start md:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        {/* 3 Main Filters: Usuário, Regional, Território */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Filter 1: Usuário / Assessor */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Filtrar por Usuário / Assessor</span>
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">Todos os Usuários</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name} ({op.role})
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Regional */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-emerald-600" />
              <span>Filtrar por Regional</span>
            </label>
            <select
              value={selectedRegional}
              onChange={(e) => handleRegionalChange(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">Todas as Regionais ({regionais.length})</option>
              {regionais.map((reg) => (
                <option key={reg.id} value={reg.name}>
                  {reg.name} ({reg.state})
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Território */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Filtrar por Território</span>
            </label>
            <select
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">
                {selectedRegional === 'ALL'
                  ? `Todos os Territórios (${territories.length})`
                  : `Todos de ${selectedRegional} (${availableTerritories.length})`}
              </option>
              {availableTerritories.map((ter) => (
                <option key={ter.id} value={ter.name}>
                  {ter.name} {ter.code ? `(Cód. ${ter.code})` : ''} - {ter.regional}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Scope Pill Summary */}
        {isAnyFilterActive && (
          <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-500 font-medium">Escopo Ativo:</span>
            {selectedUser !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">
                <span>Usuário: {operators.find((o) => o.id === selectedUser)?.name}</span>
                <button
                  onClick={() => setSelectedUser('ALL')}
                  className="hover:text-blue-950 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedRegional !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                <span>Regional: {selectedRegional}</span>
                <button
                  onClick={() => handleRegionalChange('ALL')}
                  className="hover:text-emerald-950 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTerritory !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">
                <span>Território: {selectedTerritory}</span>
                <button
                  onClick={() => setSelectedTerritory('ALL')}
                  className="hover:text-amber-950 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <span className="text-slate-400">
              • Exibindo {overview.totalClients} clientes e {overview.totalCalls} chamadas
            </span>
          </div>
        )}
      </div>

      {/* 4 Main Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1: Total de Clientes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total de Clientes
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {overview.totalClients}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Clientes no filtro selecionado
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Sem chamadas pendentes:</span>
            <span className="font-bold text-emerald-600">
              {overview.totalClients - overview.clientsNeedingCallCount} clientes
            </span>
          </div>
        </div>

        {/* Metric 2: Cliente com Mais Tempo Sem Chamada */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Maior Tempo Sem Chamada
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            {overview.longestUncalledClient ? (
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-red-600">
                    {overview.longestUncalledClient.daysSinceLastCall}
                  </span>
                  <span className="text-sm font-extrabold text-slate-700">
                    dias sem contato
                  </span>
                </div>
                <div
                  onClick={() => onSelectClient(overview.longestUncalledClient!.client)}
                  className="mt-1 cursor-pointer group flex items-center gap-1 truncate text-xs font-bold text-slate-800 hover:text-blue-600"
                >
                  <span className="truncate">
                    {overview.longestUncalledClient.client.name}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-1">
                Nenhum cliente cadastrado neste filtro.
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Fazenda:</span>
            <span className="font-semibold text-slate-700 truncate max-w-[120px]">
              {overview.longestUncalledClient?.client.farm || '-'}
            </span>
          </div>
        </div>

        {/* Metric 3: Média Geral de Constância */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Média de Constância
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-indigo-700">
                {overview.fleetAverageConstancyDays}
              </span>
              <span className="text-sm font-extrabold text-slate-700">
                dias
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Intervalo médio entre mensagens/chamadas de cada cliente
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Meta recomendada:</span>
            <span className="font-bold text-emerald-600">A cada 5 dias</span>
          </div>
        </div>

        {/* Metric 4: Volume de Chamadas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Volume de Chamadas
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {overview.totalCalls}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Chamadas e contatos registrados no período
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Chamados hoje:</span>
            <span className="font-bold text-blue-700">{overview.callsToday} clientes</span>
          </div>
        </div>
      </div>

      {/* NEW SECTION: Desempenho por Território & Regional */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Desempenho por Território & Regional</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Acompanhamento do volume de clientes e cobertura de atendimento em cada território.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg self-start sm:self-auto">
            {territoryPerformance.length} Territórios Monitorados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {territoryPerformance.map((item) => {
            const isSelected = selectedTerritory === item.territory.name;

            return (
              <div
                key={item.territory.id}
                onClick={() =>
                  setSelectedTerritory(isSelected ? 'ALL' : item.territory.name)
                }
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:bg-slate-50/80 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {item.territory.regional}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                        {item.territory.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Vendedor: <span className="font-semibold text-slate-700">{item.territory.externalSeller}</span>
                      </p>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Coverage Progress Bar */}
                  <div className="my-3">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Cobertura de Clientes</span>
                      <span className="font-bold text-slate-900">{item.coveragePercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${item.coveragePercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Carteira
                      </div>
                      <div className="font-extrabold text-slate-800">
                        {item.totalClients} clientes
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Chamadas Feitas
                      </div>
                      <div className="font-extrabold text-slate-800">
                        {item.totalCalls} chamadas
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[11px] font-bold text-emerald-700 flex items-center justify-between">
                  <span>{isSelected ? 'Filtrando este território' : 'Clique para filtrar'}</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Operadores / Quem fez as chamadas & Status de Atenção */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Calls by User / Operator Profile */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                Chamadas por Perfil / Usuário
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Identificação de quem realizou cada chamada no filtro selecionado
              </p>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
              {overview.operatorStats.length} Operadores Ativos
            </div>
          </div>

          <div className="space-y-4">
            {overview.operatorStats.map((item) => (
              <div
                key={item.operator.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full ${item.operator.avatarColor || 'bg-blue-600'} text-white font-bold flex items-center justify-center text-xs shadow-xs`}
                    >
                      {item.operator.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {item.operator.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.operator.role}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-800">
                      {item.count} chamadas
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {item.percentage}% do total
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(item.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Urgent Attention Alert Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                Radar de Atenção
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Clientes que ultrapassaram {alertDaysThreshold} dias sem receber mensagem ou chamada.
            </p>

            <div className="space-y-2.5">
              {overview.clientMetricsList
                .filter((c) => c.status === 'critical')
                .slice(0, 4)
                .map((metric, idx) => (
                  <div
                    key={`radar-${metric.client.id}___${idx}`}
                    onClick={() => onSelectClient(metric.client)}
                    className="p-2.5 rounded-xl border border-red-100 bg-red-50/40 hover:bg-red-50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {metric.client.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {metric.client.farm} • {metric.client.territory || 'Sem Território'}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                      {metric.daysSinceLastCall}d sem contato
                    </span>
                  </div>
                ))}

              {overview.clientsNeedingCallCount === 0 && (
                <div className="p-6 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl font-medium">
                  Excelente! Nenhum cliente em situação crítica.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Clientes em alerta:</span>
            <span className="font-bold text-red-600">
              {overview.clientsNeedingCallCount} de {overview.totalClients}
            </span>
          </div>
        </div>
      </div>

      {/* Comprehensive Client Constancy & Call History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Acompanhamento de Constância e Chamadas</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clique em qualquer cliente para abrir o perfil, histórico detalhado de datas e quem realizou cada chamada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Buscar cliente, fazenda, território..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="ALL">Todos os status</option>
              <option value="critical">Crítico (&gt; {alertDaysThreshold} dias)</option>
              <option value="warning">Atenção (4-7 dias)</option>
              <option value="good">Em dia (≤ 3 dias)</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="longest_uncalled">Mais tempo sem chamada</option>
              <option value="constancy">Melhor constância</option>
              <option value="most_calls">Mais chamadas</option>
              <option value="name">Nome (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                <th className="px-3 py-2.5 w-14">CÓD.</th>
                <th className="px-3 py-2.5">NOME DO CLIENTE</th>
                <th className="px-3 py-2.5">TERRITÓRIO & REGIONAL</th>
                <th className="px-3 py-2.5">FAZENDA</th>
                <th className="px-3 py-2.5 text-center">TOTAL CHAMADAS</th>
                <th className="px-3 py-2.5">ÚLTIMA CHAMADA</th>
                <th className="px-3 py-2.5">QUEM CHAMOU</th>
                <th className="px-3 py-2.5 text-center">DIAS SEM CHAMADA</th>
                <th className="px-3 py-2.5 text-center">CONSTÂNCIA MÉDIA</th>
                <th className="px-3 py-2.5 text-center">STATUS</th>
                <th className="px-3 py-2.5 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDashboardList.map((item, idx) => {
                const globalIndex = (dashCurrentPage - 1) * dashPageSize + idx;
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={`dash-${item.client.id}___${globalIndex}`}
                    className={`${
                      isEven ? 'bg-white' : 'bg-slate-50/40'
                    } hover:bg-blue-50/40 transition-colors group`}
                  >
                    {/* CÓD */}
                    <td className="px-3 py-3 font-mono font-bold text-slate-500 text-[11px]">
                      {item.client.code}
                    </td>

                    {/* NOME */}
                    <td className="px-3 py-3 font-bold text-slate-900">
                      <div
                        onClick={() => onSelectClient(item.client)}
                        className="cursor-pointer hover:text-blue-600 transition-colors"
                      >
                        {item.client.name}
                      </div>
                    </td>

                    {/* TERRITÓRIO & REGIONAL */}
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-800 text-[11px]">
                        {item.client.territory || 'Geral'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.client.regional || '-'}
                      </div>
                    </td>

                    {/* FAZENDA */}
                    <td className="px-3 py-3 text-slate-600 font-medium">
                      {item.client.farm}
                    </td>

                    {/* TOTAL CHAMADAS */}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                        {item.totalCalls}
                      </span>
                    </td>

                    {/* ÚLTIMA CHAMADA */}
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                      {item.lastCallDate ? (
                        <span>
                          {formatDateBR(item.lastCallDate)}
                          {item.lastCallTime && (
                            <span className="text-[10px] text-slate-400 ml-1">
                              às {item.lastCallTime}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Nunca chamado</span>
                      )}
                    </td>

                    {/* QUEM CHAMOU */}
                    <td className="px-3 py-3 text-slate-700 font-medium">
                      {item.lastCallOperator ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          <span>{item.lastCallOperator}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* DIAS SEM CHAMADA */}
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                          item.status === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : item.status === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.daysSinceLastCall} {item.daysSinceLastCall === 1 ? 'dia' : 'dias'}
                      </span>
                    </td>

                    {/* CONSTÂNCIA MÉDIA */}
                    <td className="px-3 py-3 text-center font-mono">
                      {item.constancyAverageDays !== null ? (
                        <span className="font-bold text-slate-700 text-xs">
                          {item.constancyAverageDays}d
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">-</span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.status === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : item.status === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.status === 'critical'
                          ? 'Crítico'
                          : item.status === 'warning'
                          ? 'Atenção'
                          : 'Em Dia'}
                      </span>
                    </td>

                    {/* AÇÕES */}
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onCopyPhone(item.client.contact1, 'Contato 1')}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Copiar Contato 1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenWhatsApp(item.client, item.client.contact1)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Abrir WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectClient(item.client)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Ver Perfil Completo"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* High performance Pagination Bar */}
        {filteredList.length > 0 && (
          <div className="px-4 py-3 bg-white border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Exibindo <strong className="text-slate-900">{dashStartRecord}</strong> a{' '}
                <strong className="text-slate-900">{dashEndRecord}</strong> de{' '}
                <strong className="text-slate-900">{filteredList.length}</strong> clientes
              </span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Por página:</span>
                <select
                  value={dashPageSize}
                  onChange={(e) => setDashPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>

            {dashTotalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDashCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={dashCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-700 cursor-pointer"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                  <span>Página {dashCurrentPage} de {dashTotalPages}</span>
                </div>

                <button
                  onClick={() => setDashCurrentPage((p) => Math.min(dashTotalPages, p + 1))}
                  disabled={dashCurrentPage === dashTotalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-700 cursor-pointer"
                  title="Próxima página"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
