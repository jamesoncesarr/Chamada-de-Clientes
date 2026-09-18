import React, { useState } from 'react';
import {
  Bell,
  Sliders,
  Users,
  MessageSquare,
  Volume2,
  Trash2,
  Edit2,
  Plus,
  RotateCcw,
  Download,
  CheckCircle,
  Save,
  UserCheck,
  AlertTriangle,
  X,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { AppSettings, Client, Operator, CsvUploadMeta, ClientSource } from '../types';
import { CsvClientManager } from './CsvClientManager';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  clients: Client[];
  operators: Operator[];
  mapaUploadMeta: CsvUploadMeta | null;
  geradoresUploadMeta: CsvUploadMeta | null;
  onOpenAddClient?: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onAddOperator: (operator: Omit<Operator, 'id' | 'avatarColor'>) => void;
  onResetData: () => void;
  onExportData: () => void;
  onSyncAllToCloud?: () => Promise<void>;
  isSyncingToCloud?: boolean;
  onImportCsvClients: (
    source: ClientSource,
    newClients: Client[],
    meta: CsvUploadMeta,
    detectedRegionais: string[],
    detectedTerritories: { name: string; code?: string; regional?: string }[]
  ) => void;
  onClearSourceClients: (source: ClientSource) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  clients,
  operators,
  mapaUploadMeta,
  geradoresUploadMeta,
  onOpenAddClient,
  onEditClient,
  onDeleteClient,
  onAddOperator,
  onResetData,
  onExportData,
  onSyncAllToCloud,
  isSyncingToCloud = false,
  onImportCsvClients,
  onClearSourceClients,
}) => {
  const [uncalledDays, setUncalledDays] = useState(settings.uncalledAlertDays);
  const [whatsappTemplate, setWhatsappTemplate] = useState(settings.whatsappTemplate);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [activeOperatorId, setActiveOperatorId] = useState(settings.activeOperatorId);

  // New Operator Form State
  const [newOpName, setNewOpName] = useState('');
  const [newOpRole, setNewOpRole] = useState('');
  const [showAddOp, setShowAddOp] = useState(false);

  // Client search filter in settings
  const [clientSearch, setClientSearch] = useState('');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<'ALL' | 'mapa' | 'geradores' | 'manual'>('ALL');

  // Confirmation dialog states
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  const handleSaveNotificationSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      uncalledAlertDays: Number(uncalledDays),
      whatsappTemplate,
      soundEnabled,
      activeOperatorId,
    });
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 3000);
  };

  const handleCreateOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName.trim()) return;
    onAddOperator({
      name: newOpName.trim(),
      role: newOpRole.trim() || 'Operador',
      permissionMode: 'edit',
      allowedTabs: ['chamadas', 'dashboard', 'rendimento'],
      assignedTerritories: [],
      isAdmin: false,
    });
    setNewOpName('');
    setNewOpRole('');
    setShowAddOp(false);
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.farm.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.territory && c.territory.toLowerCase().includes(clientSearch.toLowerCase())) ||
      (c.regional && c.regional.toLowerCase().includes(clientSearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedSourceFilter === 'mapa') return c.source === 'mapa';
    if (selectedSourceFilter === 'geradores') return c.source === 'geradores';
    if (selectedSourceFilter === 'manual') return c.source !== 'mapa' && c.source !== 'geradores';
    return true;
  });

  const totalMapa = clients.filter((c) => c.source === 'mapa').length;
  const totalGeradores = clients.filter((c) => c.source === 'geradores').length;
  const totalManual = clients.filter((c) => c.source !== 'mapa' && c.source !== 'geradores').length;

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* 1. Ajustes de Notificações e Comunicação */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
              Ajustes de Notificações e Alertas
            </h2>
            <p className="text-xs text-slate-500">
              Configure regras de periodicidade, limites para atenção e modelos de mensagem rápida
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveNotificationSettings} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dias sem chamada */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                Alerta de Cliente Sem Chamada (Dias)
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                Quando um cliente ficar mais do que este número de dias sem chamada, ele será destacado em vermelho no Dashboard.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={uncalledDays}
                  onChange={(e) => setUncalledDays(Number(e.target.value))}
                  className="flex-1 cursor-pointer"
                />
                <span className="w-16 text-center font-extrabold text-sm px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-blue-700">
                  {uncalledDays} dias
                </span>
              </div>
            </div>

            {/* Sons e Feedback */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                  Sons e Feedback Interativo
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Emitir confirmação sonora e feedback ao marcar chamadas no calendário.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  <span>Sons de marcação ativados</span>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Mensagem Padrão de WhatsApp */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Modelo Padrão de Mensagem para WhatsApp</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Variáveis disponíveis: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">{'{cliente}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">{'{fazenda}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">{'{operador}'}</code>
              </span>
            </div>
            <textarea
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplate(e.target.value)}
              rows={3}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Notificações</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Gerenciamento de Operadores / Perfis */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                Perfis e Operadores
              </h2>
              <p className="text-xs text-slate-500">
                Gerencie quem registra as chamadas para visualização precisa no Dashboard
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddOp(!showAddOp)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Operador</span>
          </button>
        </div>

        {/* Add Operator Form */}
        {showAddOp && (
          <form
            onSubmit={handleCreateOperator}
            className="p-4 mb-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in"
          >
            <div className="text-xs font-bold text-slate-800 uppercase">
              Novo Perfil de Operador
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={newOpName}
                  onChange={(e) => setNewOpName(e.target.value)}
                  placeholder="Ex: João Vitor"
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Cargo / Função</label>
                <input
                  type="text"
                  value={newOpRole}
                  onChange={(e) => setNewOpRole(e.target.value)}
                  placeholder="Ex: Operador Logístico"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddOp(false)}
                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
              >
                Salvar Perfil
              </button>
            </div>
          </form>
        )}

        {/* Operators List */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {operators.map((op) => {
            const isCurrent = op.id === settings.activeOperatorId;
            return (
              <div
                key={op.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50/50 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full ${op.avatarColor} text-white font-bold flex items-center justify-center text-xs`}
                  >
                    {op.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{op.name}</div>
                    <div className="text-[11px] text-slate-500">{op.role}</div>
                  </div>
                </div>

                {isCurrent ? (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-600 text-white">
                    Ativo
                  </span>
                ) : (
                  <button
                    onClick={() => onUpdateSettings({ activeOperatorId: op.id })}
                    className="text-xs text-slate-500 hover:text-blue-600 font-semibold cursor-pointer"
                  >
                    Ativar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Gerenciamento de Contatos (Cadastros de Clientes) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                Gerenciamento de Contatos ({clients.length} Clientes)
              </h2>
              <p className="text-xs text-slate-500">
                Edite dados cadastrais, telefones ou adicione novos clientes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSyncAllToCloud && (
              <button
                type="button"
                onClick={onSyncAllToCloud}
                disabled={isSyncingToCloud}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Sincronizar base completa para o banco na nuvem Firebase"
              >
                {isSyncingToCloud ? (
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{isSyncingToCloud ? 'Enviando p/ Nuvem...' : 'Sincronizar c/ Nuvem'}</span>
              </button>
            )}

            <button
              onClick={onExportData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer"
              title="Exportar dados em JSON / Backup"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Backup</span>
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer"
              title="Restaurar dados iniciais de demonstração"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Restaurar Padrão</span>
            </button>
          </div>
        </div>

        {/* CSV Client Manager (Upload, Replace and Templates for Arquivo 1: Mapa and Arquivo 2: Geradores) */}
        <div className="mb-6">
          <CsvClientManager
            clients={clients}
            mapaUploadMeta={mapaUploadMeta}
            geradoresUploadMeta={geradoresUploadMeta}
            onImportCsvClients={onImportCsvClients}
            onClearSourceClients={onClearSourceClients}
          />
        </div>

        {/* Client Search and Source Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <input
            type="text"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder="Buscar por código, cliente, fazenda, território..."
            className="w-full sm:w-80 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />

          {/* Source Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setSelectedSourceFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSourceFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({clients.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedSourceFilter('mapa')}
              className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSourceFilter === 'mapa'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Mapa ({totalMapa})
            </button>
            <button
              type="button"
              onClick={() => setSelectedSourceFilter('geradores')}
              className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSourceFilter === 'geradores'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-indigo-700'
              }`}
            >
              Geradores ({totalGeradores})
            </button>
            {totalManual > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSourceFilter('manual')}
                className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedSourceFilter === 'manual'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Manuais ({totalManual})
              </button>
            )}
          </div>
        </div>

        {/* Client Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                <th className="px-3 py-2.5 w-16">CÓD.</th>
                <th className="px-3 py-2.5">ORIGEM</th>
                <th className="px-3 py-2.5">CLIENTE</th>
                <th className="px-3 py-2.5">TERRITÓRIO / REGIONAL</th>
                <th className="px-3 py-2.5">FAZENDA / BASE</th>
                <th className="px-3 py-2.5">CONTATO 1</th>
                <th className="px-3 py-2.5">CONTATO 2</th>
                <th className="px-3 py-2.5 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 text-xs">
                    Nenhum cliente encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const isMapa = client.source === 'mapa';
                  const isGeradores = client.source === 'geradores';

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-500">
                        {client.code}
                      </td>
                      <td className="px-3 py-2.5">
                        {isMapa ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800">
                            Mapa
                          </span>
                        ) : isGeradores ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                            Geradores
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-900 uppercase">
                        <div>{client.name}</div>
                        {client.businessType && (
                          <span className="text-[10px] font-normal text-slate-400">
                            {client.businessType}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        <span className="font-semibold text-slate-800 block">
                          {client.territory || '-'}
                        </span>
                        <span className="text-slate-400 block text-[10px]">
                          {client.regional || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        <span className="font-semibold">{client.farm}</span>
                        <span className="text-slate-400 block text-[10px]">{client.base}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-800">
                        <div>{client.contact1}</div>
                        {client.contact1Name && (
                          <div className="text-[9px] text-slate-400 font-sans truncate">
                            {client.contact1Name} {client.contact1Role ? `(${client.contact1Role})` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">
                        <div>{client.contact2 || '-'}</div>
                        {client.contact2Name && (
                          <div className="text-[9px] text-slate-400 font-sans truncate">
                            {client.contact2Name}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditClient(client)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Editar Dados do Cliente"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setClientToDelete(client)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Excluir Cliente"
                            aria-label={`Excluir cliente ${client.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Caixa de Diálogo para Confirmação de Exclusão de Cliente */}
      {clientToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setClientToDelete(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-delete-client-title"
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            id="dialog-confirm-delete-client"
          >
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="dialog-delete-client-title"
                    className="text-base font-extrabold text-slate-900"
                  >
                    Excluir Cliente?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confirmação de exclusão permanente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Informações do Cliente */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 mb-4 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Código:</span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  #{clientToDelete.code}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium text-[11px] block">Nome do Cliente:</span>
                <span className="font-extrabold text-slate-900 uppercase text-sm block truncate">
                  {clientToDelete.name}
                </span>
              </div>
              {clientToDelete.farm && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Fazenda / Base:</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[240px]">
                    {clientToDelete.farm} {clientToDelete.base ? `(${clientToDelete.base})` : ''}
                  </span>
                </div>
              )}
              {clientToDelete.territory && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Território / Regional:</span>
                  <span className="font-semibold text-slate-700">
                    {clientToDelete.territory} {clientToDelete.regional ? `• ${clientToDelete.regional}` : ''}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                <span className="text-slate-500 font-medium">Origem do Cadastro:</span>
                <span className="font-bold text-slate-700">
                  {clientToDelete.source === 'mapa'
                    ? 'Arquivo 1 (Mapa)'
                    : clientToDelete.source === 'geradores'
                    ? 'Arquivo 2 (Geradores)'
                    : 'Cadastro Manual'}
                </span>
              </div>
            </div>

            {/* Aviso de Alerta */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5 mb-5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Tem certeza que deseja excluir <strong>{clientToDelete.name}</strong>? Todo o histórico de chamadas vinculado a este cliente também será apagado.
              </p>
            </div>

            {/* Botões de Ação: Sim / Não */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                id="btn-dialog-cancel-delete"
              >
                Não, Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteClient(clientToDelete.id);
                  setClientToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1.5 active:scale-98"
                id="btn-dialog-confirm-delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Caixa de Diálogo para Confirmação de Reset de Dados */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowResetConfirm(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            id="dialog-confirm-reset-data"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Restaurar Dados Originais?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Retornar aos dados padrão de demonstração
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Deseja restaurar todos os clientes, chamadas e configurações para os dados originais? As alterações atuais da carteira serão substituídas.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Não, Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetData();
                  setShowResetConfirm(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sim, Restaurar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
