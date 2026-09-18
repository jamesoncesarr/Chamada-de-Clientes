import React, { useState, useMemo } from 'react';
import {
  Phone,
  Copy,
  Check,
  MessageSquare,
  User,
  CalendarCheck,
  Info,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Folder,
  FolderOpen,
  MapPin,
  Star,
  Users,
  ShieldAlert,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Client, CallRecord, Operator, Territory, Regional } from '../types';
import { DayColumn } from '../utils/dateUtils';
import { INITIAL_TERRITORIES, INITIAL_REGIONAIS } from '../data/territoriesData';

interface ClientCallsTableProps {
  clients: Client[];
  calls: CallRecord[];
  dayColumns: DayColumn[];
  operators: Operator[];
  activeOperatorId: string;
  territories?: Territory[];
  regionais?: Regional[];
  onToggleCallCheck: (clientId: string, dateStr: string) => void;
  onOpenCallModal: (client: Client, dateStr: string, existingCall: CallRecord | null) => void;
  onCopyPhone: (phone: string, label: string) => void;
  onOpenWhatsApp: (client: Client, phone: string) => void;
  onSelectClientProfile: (client: Client) => void;
}

export const ClientCallsTable: React.FC<ClientCallsTableProps> = ({
  clients,
  calls,
  dayColumns,
  operators,
  activeOperatorId,
  territories = INITIAL_TERRITORIES,
  regionais = INITIAL_REGIONAIS,
  onToggleCallCheck,
  onOpenCallModal,
  onCopyPhone,
  onOpenWhatsApp,
  onSelectClientProfile,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ clientId: string; dateStr: string } | null>(null);
  const [recentlyCopiedPhone, setRecentlyCopiedPhone] = useState<string | null>(null);

  // Active operator info
  const activeOperator = useMemo(
    () => operators.find((op) => op.id === activeOperatorId) || operators[0],
    [operators, activeOperatorId]
  );

  const isViewOnly = activeOperator?.permissionMode === 'view_only';

  // Territórios que o usuário logado tem permissão para acessar
  const userTerritories = useMemo(() => {
    if (activeOperator?.isAdmin || !activeOperator?.assignedTerritories || activeOperator.assignedTerritories.length === 0) {
      return territories;
    }
    const assignedSet = new Set(activeOperator.assignedTerritories);
    return territories.filter((t) => assignedSet.has(t.name));
  }, [territories, activeOperator]);

  // Selected territory folder tab (defaults to 'ALL')
  const [selectedTerritoryFolder, setSelectedTerritoryFolder] = useState<string>('ALL');

  const handlePhoneClick = (phone: string, label: string) => {
    if (!phone || phone === '-') return;
    onCopyPhone(phone, label);
    setRecentlyCopiedPhone(phone);
    setTimeout(() => setRecentlyCopiedPhone(null), 2000);
  };

  // Map calls for fast O(1) cell lookup: `${clientId}_${dateStr}` => CallRecord
  const callsMap = useMemo(() => {
    const map = new Map<string, CallRecord>();
    for (const call of calls) {
      map.set(`${call.clientId}_${call.date}`, call);
    }
    return map;
  }, [calls]);

  // Clientes aos quais o usuário logado tem permissão
  const accessibleClients = useMemo(() => {
    if (activeOperator?.isAdmin || !activeOperator?.assignedTerritories || activeOperator.assignedTerritories.length === 0) {
      return clients;
    }
    const assignedSet = new Set(activeOperator.assignedTerritories);
    return clients.filter((c) => {
      if (c.territory && assignedSet.has(c.territory)) return true;
      if (c.territoryCode) {
        return territories.some((t) => t.code === c.territoryCode && assignedSet.has(t.name));
      }
      return false;
    });
  }, [clients, activeOperator, territories]);

  // Clientes filtrados pela pasta selecionada
  const displayedClients = useMemo(() => {
    if (selectedTerritoryFolder === 'ALL') {
      return accessibleClients;
    }

    const targetTer = userTerritories.find((t) => t.name === selectedTerritoryFolder);
    return accessibleClients.filter(
      (c) =>
        c.territory === selectedTerritoryFolder ||
        (targetTer && targetTer.code && c.territoryCode === targetTer.code)
    );
  }, [accessibleClients, selectedTerritoryFolder, userTerritories]);

  // High-performance pagination to eliminate browser freezes on large CSV uploads (1000+ clients)
  const [pageSize, setPageSize] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(displayedClients.length / pageSize));
  }, [displayedClients.length, pageSize]);

  // Reset to page 1 whenever filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedTerritoryFolder, displayedClients.length, pageSize]);

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedClients.slice(start, start + pageSize);
  }, [displayedClients, currentPage, pageSize]);

  const startRecord = displayedClients.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, displayedClients.length);

  // Current folder info
  const currentFolderTerritory = useMemo(() => {
    if (selectedTerritoryFolder === 'ALL') {
      return null;
    }
    return userTerritories.find((t) => t.name === selectedTerritoryFolder) || null;
  }, [userTerritories, selectedTerritoryFolder]);

  // Count calls in displayed clients for current month
  const folderCallsCount = useMemo(() => {
    const clientIds = new Set(displayedClients.map((c) => c.id));
    const monthDateStrings = new Set(dayColumns.map((d) => d.dateString));
    return calls.filter((c) => clientIds.has(c.clientId) && monthDateStrings.has(c.date)).length;
  }, [calls, displayedClients, dayColumns]);

  // Handle clicking client name: opens call details
  const handleClientNameClick = (client: Client) => {
    const clientCalls = calls.filter((c) => c.clientId === client.id);
    clientCalls.sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));

    const todayStr = new Date().toISOString().split('T')[0];
    const callToday = clientCalls.find((c) => c.date === todayStr);
    const callInCurrentMonth = clientCalls.find((c) =>
      dayColumns.some((d) => d.dateString === c.date)
    );

    const targetCall = callToday || callInCurrentMonth || clientCalls[0] || null;
    const targetDate = targetCall ? targetCall.date : (dayColumns[0]?.dateString || todayStr);

    onOpenCallModal(client, targetDate, targetCall);
  };

  const handleCellCheckClick = (clientId: string, dateStr: string) => {
    if (isViewOnly) {
      alert(
        'Modo Somente Visualização: Seu usuário não possui permissão para marcar chamadas. Solicite acesso ao Administrador na aba Controle de Usuários.'
      );
      return;
    }
    onToggleCallCheck(clientId, dateStr);
  };

  return (
    <div className="space-y-4">
      {/* Territory Folders Bar (Aba Chamada de Clientes com Pastas) */}
      <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-[#1a2336] shadow-2xs p-3.5 select-none">
        <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-slate-100 dark:border-[#1a2336]">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-blue-600 dark:text-[#60a5fa]" />
            <span className="text-xs font-extrabold text-slate-800 dark:text-[#f1f5f9] uppercase tracking-wide">
              Pastas de Territórios (Carteiras)
            </span>
            <span className="text-[10px] text-slate-500 dark:text-[#7d8ea5] font-medium hidden md:inline">
              • Cada pasta reúne os clientes atendidos pelo vendedor externo correspondente.
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-[#7d8ea5] bg-slate-50 dark:bg-[#0c101a] border border-slate-200 dark:border-[#1c273c] px-2.5 py-1 rounded-lg">
            {userTerritories.length} {userTerritories.length === 1 ? 'pasta disponível' : 'pastas disponíveis'}
          </span>
        </div>

        {/* Scrollable Folder Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {/* Tab: Todos os Clientes (Geral / Carteira do Usuário) */}
          <button
            onClick={() => setSelectedTerritoryFolder('ALL')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
              selectedTerritoryFolder === 'ALL'
                ? 'bg-blue-600 dark:bg-[#132247] text-white dark:text-[#60a5fa] border-blue-600 dark:border-blue-500/40 shadow-xs'
                : 'bg-slate-50 dark:bg-[#0c101a] text-slate-700 dark:text-[#cbd5e1] border-slate-200 dark:border-[#1c273c] hover:bg-slate-100 dark:hover:bg-[#162136]'
            }`}
          >
            {selectedTerritoryFolder === 'ALL' ? (
              <FolderOpen className="w-3.5 h-3.5" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-blue-500 dark:text-[#60a5fa]" />
            )}
            <span>Todos os Clientes</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedTerritoryFolder === 'ALL'
                  ? 'bg-blue-700 dark:bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-[#1a253d] text-slate-700 dark:text-slate-300'
              }`}
            >
              {accessibleClients.length}
            </span>
          </button>

          {/* Individual Territory Folder Tabs (Somente as pastas que o usuário tem acesso) */}
          {userTerritories.map((ter) => {
            const isSelected = selectedTerritoryFolder === ter.name;
            const isAssignedToMe =
              activeOperator?.assignedTerritories &&
              activeOperator.assignedTerritories.includes(ter.name);
            const clientCountInFolder = accessibleClients.filter(
              (c) => c.territory === ter.name || (ter.code && c.territoryCode === ter.code)
            ).length;

            return (
              <button
                key={ter.id}
                onClick={() => setSelectedTerritoryFolder(ter.name)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-[#132247] text-white dark:text-[#60a5fa] border-slate-900 dark:border-blue-500/40 shadow-xs'
                    : 'bg-slate-50 dark:bg-[#0c101a] text-slate-700 dark:text-[#cbd5e1] border-slate-200 dark:border-[#1c273c] hover:bg-slate-100 dark:hover:bg-[#162136]'
                }`}
              >
                {isSelected ? (
                  <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-slate-400 dark:text-[#7d8ea5]" />
                )}
                <span>{ter.name}</span>
                {ter.code && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      isSelected
                        ? 'bg-slate-800 dark:bg-[#1a2b4f] text-slate-200 dark:text-blue-200 border border-slate-700 dark:border-blue-600/30'
                        : 'bg-slate-200/80 dark:bg-[#1a253d] text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {ter.code}
                  </span>
                )}
                {isAssignedToMe && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Atribuído a você" />
                )}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-slate-800 dark:bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-[#1a253d] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {clientCountInFolder}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Folder Header Banner */}
      <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200/90 dark:border-[#1a2336] shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#132247] text-blue-700 dark:text-[#60a5fa] flex items-center justify-center font-bold shrink-0">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-[#f1f5f9]">
                {selectedTerritoryFolder === 'ALL'
                  ? activeOperator?.isAdmin
                    ? 'Pasta Geral: Todos os Territórios'
                    : 'Pasta Geral: Minha Carteira Atribuída'
                  : `Pasta: ${currentFolderTerritory?.name}`}
              </h3>
              {currentFolderTerritory && (
                <>
                  {currentFolderTerritory.code && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#131b2c] text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-[#1a2336]">
                      Cód. {currentFolderTerritory.code}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 border border-transparent dark:border-emerald-800/40">
                    Regional {currentFolderTerritory.regional}
                  </span>
                </>
              )}
              {isViewOnly && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 border border-transparent dark:border-amber-800/40 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Somente Visualização
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-[#8b9cb5] mt-0.5">
              {currentFolderTerritory ? (
                <>
                  Vendedor Externo Responsável:{' '}
                  <strong className="text-slate-800 dark:text-[#e2e8f0]">{currentFolderTerritory.externalSeller}</strong>
                </>
              ) : activeOperator?.isAdmin ? (
                'Exibindo carteira consolidada de clientes de todos os territórios.'
              ) : (
                'Exibindo carteira consolidada de clientes dos seus territórios com acesso.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0c101a] border border-slate-200 dark:border-[#1c273c]">
            <span className="text-slate-400 dark:text-[#7d8ea5] font-semibold block text-[10px] uppercase">
              Clientes na Pasta
            </span>
            <span className="font-extrabold text-slate-900 dark:text-[#f1f5f9]">
              {displayedClients.length} clientes
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-[#132247] border border-blue-200 dark:border-blue-500/30">
            <span className="text-blue-500 dark:text-[#93c5fd] font-semibold block text-[10px] uppercase">
              Chamadas no Mês
            </span>
            <span className="font-extrabold text-blue-900 dark:text-[#60a5fa]">
              {folderCallsCount} chamadas
            </span>
          </div>
        </div>
      </div>

      {displayedClients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhum cliente nesta pasta</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não há clientes cadastrados para este território ou os filtros atuais não retornaram dados.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Scrollable Container with Custom Scrollbar */}
          <div className="overflow-x-auto custom-scrollbar max-h-[calc(100vh-250px)] min-h-[450px]">
            <table className="w-full border-separate border-spacing-0 text-left text-xs">
              {/* Table Header */}
              <thead className="sticky top-0 z-30 shadow-2xs select-none">
                {/* Row 1: Weekday names & Column Headers */}
                <tr>
                  {/* Frozen Left Columns with solid opaque backgrounds */}
                  <th
                    scope="col"
                    className="sticky left-0 z-30 bg-slate-100 dark:bg-[#131b2c] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[60px] min-w-[60px] max-w-[60px] border-b border-r border-slate-200 dark:border-[#1a2336]"
                  >
                    CÓD.
                  </th>

                  <th
                    scope="col"
                    className="sticky left-[60px] z-30 bg-slate-100 dark:bg-[#131b2c] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[220px] min-w-[220px] max-w-[220px] border-b border-r border-slate-200 dark:border-[#1a2336]"
                  >
                    NOME DO CLIENTE
                  </th>

                  <th
                    scope="col"
                    className="sticky left-[280px] z-30 bg-slate-100 dark:bg-[#131b2c] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[180px] min-w-[180px] max-w-[180px] border-b border-r border-slate-200 dark:border-[#1a2336]"
                  >
                    FAZENDA
                  </th>

                  <th
                    scope="col"
                    className="sticky left-[460px] z-30 bg-slate-100 dark:bg-[#131b2c] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[145px] min-w-[145px] max-w-[145px] border-b border-r border-slate-200 dark:border-[#1a2336]"
                  >
                    CONTATO 1
                  </th>

                  <th
                    scope="col"
                    className="sticky left-[605px] z-30 bg-slate-100 dark:bg-[#131b2c] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[145px] min-w-[145px] max-w-[145px] border-b border-r-2 border-slate-300 dark:border-[#1f2b42] shadow-[6px_0_12px_-2px_rgba(0,0,0,0.12)] dark:shadow-[6px_0_12px_-2px_rgba(0,0,0,0.4)]"
                  >
                    CONTATO 2
                  </th>

                  {/* Dynamic Calendar Day Columns */}
                  {dayColumns.map((col) => (
                    <th
                      key={`wd-${col.dateString}`}
                      scope="col"
                      className={`px-1 py-1 text-center font-bold text-[10px] w-10 min-w-10 border-b border-r border-slate-200/80 dark:border-[#1a2336] transition-colors ${
                        col.isWeekend
                          ? 'bg-slate-200/70 dark:bg-[#080c14] text-slate-600 dark:text-[#5a6c85]'
                          : col.isToday
                          ? 'bg-blue-100 dark:bg-[#132247] text-blue-800 dark:text-[#60a5fa]'
                          : 'bg-slate-50 dark:bg-[#131b2c] text-slate-600 dark:text-[#8b9cb5]'
                      }`}
                      title={`${col.dayOfWeekShort} - ${col.dateString}`}
                    >
                      <div className="uppercase">{col.dayOfWeekShort}</div>
                      <div
                        className={`inline-block text-[11px] font-extrabold px-1 rounded ${
                          col.isToday
                            ? 'bg-blue-600 text-white font-mono'
                            : col.isWeekend
                            ? 'text-slate-700 dark:text-[#5a6c85]'
                            : 'text-slate-800 dark:text-[#f1f5f9]'
                        }`}
                      >
                        {col.dayNumber}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {paginatedClients.map((client, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx;
                  const isEven = idx % 2 === 0;
                  const stickyBg = isEven
                    ? 'bg-white dark:bg-[#101726] group-hover:bg-slate-50 dark:group-hover:bg-[#162136]'
                    : 'bg-[#f8fafc] dark:bg-[#0c121f] group-hover:bg-slate-100 dark:group-hover:bg-[#162136]';

                  return (
                    <tr
                      key={`${client.id}___${globalIdx}`}
                      className="group transition-colors"
                    >
                      {/* CÓD. - 100% Solid background */}
                      <td
                        className={`sticky left-0 z-20 ${stickyBg} px-3 py-2.5 font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 border-b border-r border-slate-200/80 dark:border-[#1a2336] w-[60px] min-w-[60px] max-w-[60px]`}
                      >
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#162136] text-slate-700 dark:text-slate-300 border border-transparent dark:border-[#1d273c]">
                          {client.code}
                        </span>
                      </td>

                      {/* NOME DO CLIENTE - 100% Solid background */}
                      <td
                        className={`sticky left-[60px] z-20 ${stickyBg} px-3 py-2.5 border-b border-r border-slate-200/80 dark:border-[#1a2336] w-[220px] min-w-[220px] max-w-[220px]`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <button
                            onClick={() => handleClientNameClick(client)}
                            className="text-left font-bold text-slate-900 dark:text-[#f1f5f9] uppercase tracking-tight hover:text-blue-600 dark:hover:text-blue-400 truncate transition-colors cursor-pointer group/name flex items-center gap-1.5"
                            title="Clique para ver os Detalhes da Chamada deste cliente"
                          >
                            <span className="truncate">{client.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 opacity-0 group-hover/name:opacity-100 shrink-0 transition-opacity" />
                          </button>

                          {/* Botão de atalho para perfil completo no dashboard */}
                          <button
                            onClick={() => onSelectClientProfile(client)}
                            className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-[#162136] transition-colors shrink-0"
                            title="Ver estatísticas e constância no Dashboard"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* FAZENDA - 100% Solid background */}
                      <td
                        className={`sticky left-[280px] z-20 ${stickyBg} px-3 py-2.5 border-b border-r border-slate-200/80 dark:border-[#1a2336] w-[180px] min-w-[180px] max-w-[180px]`}
                      >
                        <div className="font-semibold text-slate-800 dark:text-[#e2e8f0] truncate text-[11px]">
                          {client.farm}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-[#7d8ea5] truncate font-medium">
                          {client.territory ? `${client.territory} • ` : ''}{client.base}
                        </div>
                      </td>

                      {/* CONTATO 1 - 100% Solid background */}
                      <td
                        className={`sticky left-[460px] z-20 ${stickyBg} px-3 py-2.5 border-b border-r border-slate-200/80 dark:border-[#1a2336] w-[145px] min-w-[145px] max-w-[145px]`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <button
                            onClick={() => handlePhoneClick(client.contact1, 'Contato 1')}
                            className={`font-mono text-[11px] px-1.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer truncate ${
                              recentlyCopiedPhone === client.contact1
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#162136] hover:text-blue-700 dark:hover:text-blue-400'
                            }`}
                            title="Clique para copiar o número do cliente"
                          >
                            {recentlyCopiedPhone === client.contact1 ? (
                              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                            )}
                            <span className="truncate">{client.contact1}</span>
                          </button>

                          {/* Quick WhatsApp icon */}
                          <button
                            onClick={() => onOpenWhatsApp(client, client.contact1)}
                            className="p-1 rounded text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors shrink-0"
                            title="Abrir no WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* CONTATO 2 - 100% Solid background with Right Divider Shadow */}
                      <td
                        className={`sticky left-[605px] z-20 ${stickyBg} px-3 py-2.5 border-b border-r-2 border-slate-300 dark:border-[#1f2b42] shadow-[6px_0_12px_-2px_rgba(0,0,0,0.12)] dark:shadow-[6px_0_12px_-2px_rgba(0,0,0,0.4)] w-[145px] min-w-[145px] max-w-[145px]`}
                      >
                        {client.contact2 && client.contact2 !== '-' ? (
                          <div className="flex items-center justify-between gap-1">
                            <button
                              onClick={() => handlePhoneClick(client.contact2, 'Contato 2')}
                              className={`font-mono text-[11px] px-1.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer truncate ${
                                recentlyCopiedPhone === client.contact2
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#162136] hover:text-blue-700 dark:hover:text-blue-400'
                              }`}
                              title="Clique para copiar o número do cliente"
                            >
                              {recentlyCopiedPhone === client.contact2 ? (
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                              )}
                              <span className="truncate">{client.contact2}</span>
                            </button>

                            <button
                              onClick={() => onOpenWhatsApp(client, client.contact2)}
                              className="p-1 rounded text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors shrink-0"
                              title="Abrir no WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-[11px] italic px-1">-</span>
                        )}
                      </td>

                      {/* Dynamic Calendar Day Cells - slide beneath z-20 smoothly */}
                      {dayColumns.map((col) => {
                        const call = callsMap.get(`${client.id}_${col.dateString}`);
                        const isChecked = !!call;
                        const isWeekend = col.isWeekend;

                        return (
                          <td
                            key={`cell-${client.id}-${col.dateString}-${idx}`}
                            onMouseEnter={() =>
                              setHoveredCell({ clientId: client.id, dateStr: col.dateString })
                            }
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`p-1 text-center border-b border-r border-slate-200/70 dark:border-[#172133] transition-colors ${
                              isWeekend
                                ? 'bg-slate-100/60 dark:bg-[#080c14]'
                                : isEven
                                ? 'bg-white dark:bg-[#101726]'
                                : 'bg-[#fafafa] dark:bg-[#0c121f]'
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              {isChecked ? (
                                /* Already Checked Cell */
                                <button
                                  onClick={() => onOpenCallModal(client, col.dateString, call)}
                                  className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all shadow-xs transform hover:scale-105 cursor-pointer group/check"
                                  title={`Chamado por: ${call.operatorName} em ${col.dayNumber}/${col.dateString.substring(5, 7)} às ${call.time || '10:00'}${call.notes ? `\nNota: ${call.notes}` : ''}\n(Clique para ver detalhes ou desmarcar)`}
                                >
                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                </button>
                              ) : (
                                /* Empty Cell to Check */
                                <button
                                  onClick={() => handleCellCheckClick(client.id, col.dateString)}
                                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                                    isViewOnly
                                      ? 'border-transparent text-slate-300 dark:text-slate-700 opacity-40 cursor-not-allowed'
                                      : 'border-transparent hover:border-blue-400 dark:hover:border-blue-500/40 hover:bg-blue-50/80 dark:hover:bg-[#18253d] text-transparent hover:text-blue-600 dark:hover:text-blue-400'
                                  }`}
                                  title={
                                    isViewOnly
                                      ? 'Modo Somente Visualização'
                                      : `Marcar check de chamada em ${col.dayNumber}/${col.dateString.substring(5, 7)}`
                                  }
                                >
                                  <Check className="w-3.5 h-3.5 opacity-0 hover:opacity-100 transition-opacity stroke-[2]" />
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* High-performance Pagination Bar */}
          {displayedClients.length > 0 && (
            <div className="px-4 py-2.5 bg-white border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>
                  Exibindo <strong className="text-slate-900">{startRecord}</strong> a{' '}
                  <strong className="text-slate-900">{endRecord}</strong> de{' '}
                  <strong className="text-slate-900">{displayedClients.length}</strong> clientes
                </span>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Por página:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-700 cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                    <span>Página {currentPage} de {totalPages}</span>
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-700 cursor-pointer"
                    title="Próxima página"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Legend & Summary Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 flex items-center justify-center text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span>Chamada Realizada</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-white" />
                <span>Sem Chamada</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-200/90" />
                <span>Final de Semana</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[9px]">
                  HJ
                </span>
                <span>Dia Atual</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>
                Dica: Clique no número para copiar ou no ícone do WhatsApp para enviar mensagem diretamente.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
