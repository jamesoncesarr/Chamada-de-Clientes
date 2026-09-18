import React from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Search,
  ChevronDown,
  Moon,
  Sun,
  CalendarDays,
  BarChart3,
  Settings,
  Users,
  Plus,
  User,
  RefreshCw,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { ActiveTab, Operator } from '../types';
import { getMonthNamePT, getMonthShortNamePT, formatDateBR } from '../utils/dateUtils';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedBase: string;
  onBaseChange: (base: string) => void;
  availableBases: string[];
  totalClientsCount: number;
  currentYear: number;
  currentMonth: number; // 0-11
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onResetToToday: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenNewClientModal?: () => void;
  operators: Operator[];
  activeOperatorId: string;
  onSelectOperator: (id: string) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  cloudSyncStatus?: 'syncing' | 'synced' | 'error';
  lastSyncTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  selectedBase,
  onBaseChange,
  availableBases,
  totalClientsCount,
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onResetToToday,
  isDarkMode,
  onToggleDarkMode,
  onOpenNewClientModal,
  operators,
  activeOperatorId,
  onSelectOperator,
  sidebarCollapsed,
  onToggleSidebar,
  cloudSyncStatus = 'synced',
  lastSyncTime,
}) => {
  const currentMonthName = getMonthNamePT(currentMonth);
  const nextMonthName = getMonthShortNamePT((currentMonth + 1) % 12);
  const currentMonthShort = getMonthShortNamePT(currentMonth);

  return (
    <header className="w-full shrink-0">
      {/* Topmost Brand Strip */}
      <div className="bg-white dark:bg-[#080c14] border-b border-slate-200/80 dark:border-[#141c2c] px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Botão de Recolher/Expandir Menu Lateral fora do menu */}
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-600 dark:text-[#8b9cb5] hover:text-slate-900 dark:hover:text-[#f1f5f9] hover:bg-slate-100 dark:hover:bg-[#121929] border border-slate-200 dark:border-[#1c273c] bg-white dark:bg-[#101726] transition-all cursor-pointer flex items-center justify-center shadow-2xs hover:shadow-xs active:scale-95"
            title={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            id="btn-toggle-sidebar"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-700 dark:text-[#cbd5e1]" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-[#cbd5e1]" />
            )}
          </button>

          {/* Active Operator Switcher */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-[#8b9cb5] bg-slate-50 dark:bg-[#101726] border border-slate-200 dark:border-[#1c273c] rounded-xl px-2.5 py-1.5 shadow-2xs">
            <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <select
              value={activeOperatorId}
              onChange={(e) => onSelectOperator(e.target.value)}
              className="bg-transparent font-semibold text-blue-700 dark:text-blue-400 cursor-pointer focus:outline-hidden pr-1 text-xs"
              title="Operador Ativo"
            >
              {operators.map((op) => (
                <option key={op.id} value={op.id} className="dark:bg-[#101726] dark:text-[#f1f5f9]">
                  {op.name} ({op.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-2">
          {/* Cloud Synchronization Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              cloudSyncStatus === 'syncing'
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                : cloudSyncStatus === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
            }`}
            title={
              cloudSyncStatus === 'syncing'
                ? 'Sincronizando com a Nuvem Firebase...'
                : cloudSyncStatus === 'error'
                ? 'Falha na conexão com a nuvem'
                : `Nuvem Sincronizada em Tempo Real ${lastSyncTime ? `(${lastSyncTime})` : ''}`
            }
          >
            {cloudSyncStatus === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
            ) : cloudSyncStatus === 'error' ? (
              <CloudOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="hidden sm:inline">
              {cloudSyncStatus === 'syncing'
                ? 'Sincronizando...'
                : cloudSyncStatus === 'error'
                ? 'Offline'
                : 'Nuvem Conectada'}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl transition-all border cursor-pointer ${
              isDarkMode
                ? 'text-amber-400 bg-slate-800 dark:bg-[#101726] border-slate-700 dark:border-[#1c273c] hover:bg-slate-700 dark:hover:bg-[#18243a]'
                : 'text-slate-600 bg-white hover:text-slate-900 hover:bg-slate-100 border-slate-200 shadow-2xs'
            }`}
            title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Noturno'}
            aria-label={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Noturno'}
            id="btn-toggle-theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Main Subheader Panel - Only shown on 'chamadas' tab */}
      {activeTab === 'chamadas' && (
        <div className="bg-gradient-to-b from-blue-50/80 via-blue-50/40 to-white dark:from-[#0e1424] dark:via-[#0b101c] dark:to-[#0a0e17] px-6 pt-5 pb-4 border-b border-slate-200/70 dark:border-[#1a2336]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            {/* Title with Clock Icon */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100/90 dark:bg-[#132247] text-blue-700 dark:text-[#60a5fa] flex items-center justify-center shadow-xs border border-blue-200/60 dark:border-blue-500/30">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-900 dark:text-[#f1f5f9]">
                  CHAMADA DE CLIENTES
                </h1>
                <p className="text-xs text-slate-500 dark:text-[#8b9cb5] font-medium">
                  Controle diário de ligações, acompanhamento por fazenda e constância de mensagens
                </p>
              </div>
            </div>

            {/* Center Month Navigator matching screenshot: < Set/Out 2026 > */}
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <div className="flex items-center bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-[#1c273c] rounded-2xl shadow-xs px-2 py-1">
                <button
                  onClick={onPrevMonth}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-[#8b9cb5] hover:text-slate-900 dark:hover:text-[#f1f5f9] hover:bg-slate-100 dark:hover:bg-[#162136] transition-colors cursor-pointer"
                  title="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-4 text-center min-w-[170px]">
                  <div className="text-xs font-bold text-slate-800 dark:text-[#f1f5f9] uppercase tracking-wide">
                    {currentMonthShort}/{nextMonthName} {currentYear}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-[#7d8ea5] font-medium">
                    Visão Mensal do Calendário
                  </div>
                </div>

                <button
                  onClick={onNextMonth}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-[#8b9cb5] hover:text-slate-900 dark:hover:text-[#f1f5f9] hover:bg-slate-100 dark:hover:bg-[#162136] transition-colors cursor-pointer"
                  title="Próximo mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={onResetToToday}
                className="p-2 rounded-xl text-slate-500 dark:text-[#8b9cb5] hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-[#101726] border border-slate-200 dark:border-[#1c273c] hover:bg-blue-50 dark:hover:bg-[#162136] transition-colors shadow-xs cursor-pointer"
                title="Voltar para a data atual"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Total Clients Pill */}
            <div className="flex items-center gap-2.5">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#131b2c] border border-slate-200 dark:border-[#1a2336] text-slate-700 dark:text-slate-300 text-xs font-bold">
                {totalClientsCount} clientes
              </div>
            </div>
          </div>

          {/* Search Bar & Base Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#5a6c85] pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar cliente, fazenda, contato..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-[#1c273c] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#f1f5f9] placeholder-slate-400 dark:placeholder-[#50617a] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-[#8b9cb5] hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-[#162136] hover:bg-slate-200 dark:hover:bg-[#1c2842] px-1.5 py-0.5 rounded-md"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Filter dropdown */}
            <div className="relative w-full sm:w-64">
              <select
                value={selectedBase}
                onChange={(e) => onBaseChange(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-[#1c273c] rounded-xl pl-3.5 pr-8 py-2 text-xs sm:text-sm text-slate-700 dark:text-[#e2e8f0] font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs cursor-pointer"
              >
                <option value="ALL" className="dark:bg-[#0c101a] dark:text-[#f1f5f9]">Todas as fazendas / bases</option>
                {availableBases.map((base) => (
                  <option key={base} value={base} className="dark:bg-[#0c101a] dark:text-[#f1f5f9]">
                    {base}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#5a6c85] pointer-events-none" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
