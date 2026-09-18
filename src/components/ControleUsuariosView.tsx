import React, { useState } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  CheckCircle2,
  X,
  MapPin,
  Folder,
  Layers,
  Eye,
  Lock,
  Unlock,
  Key,
  KeyRound,
  Sparkles,
  Calendar,
  BarChart3,
  TrendingUp,
  Settings,
  UserCheck,
  ArrowRight,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { Operator, ActiveTab, UserPermissionMode, Regional, Territory } from '../types';

interface ControleUsuariosViewProps {
  operators: Operator[];
  activeOperatorId: string;
  regionais: Regional[];
  territories: Territory[];
  onSelectActiveOperator: (operatorId: string) => void;
  onSaveOperator: (operator: Operator) => void;
  onDeleteOperator: (operatorId: string) => void;
  onAddTerritory?: (territory: Territory) => void;
  onResetPasswordToInitial?: (operatorId: string) => void;
}

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-indigo-600',
  'bg-teal-600',
];

const AVAILABLE_TABS: { id: ActiveTab; label: string; icon: any }[] = [
  { id: 'chamadas', label: 'Chamada de Clientes', icon: Calendar },
  { id: 'dashboard', label: 'Dashboard de Métricas', icon: BarChart3 },
  { id: 'rendimento', label: 'Rendimento da Equipe', icon: TrendingUp },
  { id: 'usuarios', label: 'Controle de Usuários', icon: Users },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];

export const ControleUsuariosView: React.FC<ControleUsuariosViewProps> = ({
  operators,
  activeOperatorId,
  regionais,
  territories,
  onSelectActiveOperator,
  onSaveOperator,
  onDeleteOperator,
  onAddTerritory,
  onResetPasswordToInitial,
}) => {
  // Modal state for Add/Edit user
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formAvatarColor, setFormAvatarColor] = useState(AVATAR_COLORS[0]);
  const [formIsAdmin, setFormIsAdmin] = useState(false);
  const [formPermissionMode, setFormPermissionMode] = useState<UserPermissionMode>('edit');
  const [formAllowedTabs, setFormAllowedTabs] = useState<ActiveTab[]>([
    'chamadas',
    'dashboard',
    'rendimento',
  ]);
  const [formAssignedTerritories, setFormAssignedTerritories] = useState<string[]>([]);
  const [formAssignedRegionais, setFormAssignedRegionais] = useState<string[]>([]);

  // Search filter for user list
  const [searchFilter, setSearchFilter] = useState('');
  const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(null);
  const [operatorToResetPassword, setOperatorToResetPassword] = useState<Operator | null>(null);

  // Active user object
  const activeOperator = operators.find((op) => op.id === activeOperatorId) || operators[0];

  const handleOpenAddModal = () => {
    setEditingOperator(null);
    setFormName('');
    setFormEmail('');
    setFormRole('Assessor Interno');
    setFormAvatarColor(AVATAR_COLORS[operators.length % AVATAR_COLORS.length]);
    setFormIsAdmin(false);
    setFormPermissionMode('edit');
    setFormAllowedTabs(['chamadas', 'dashboard', 'rendimento']);
    setFormAssignedTerritories([]);
    setFormAssignedRegionais([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (op: Operator) => {
    setEditingOperator(op);
    setFormName(op.name);
    setFormEmail(op.email || '');
    setFormRole(op.role);
    setFormAvatarColor(op.avatarColor || AVATAR_COLORS[0]);
    setFormIsAdmin(!!op.isAdmin);
    setFormPermissionMode(op.permissionMode || 'edit');
    setFormAllowedTabs(
      op.allowedTabs || ['chamadas', 'dashboard', 'rendimento', 'usuarios', 'configuracoes']
    );
    setFormAssignedTerritories(op.assignedTerritories || []);
    setFormAssignedRegionais(op.assignedRegionais || []);
    setIsModalOpen(true);
  };

  const handleToggleTabPermission = (tabId: ActiveTab) => {
    if (formAllowedTabs.includes(tabId)) {
      if (formAllowedTabs.length === 1) return; // at least 1 tab
      setFormAllowedTabs(formAllowedTabs.filter((t) => t !== tabId));
    } else {
      setFormAllowedTabs([...formAllowedTabs, tabId]);
    }
  };

  const handleToggleTerritory = (territoryName: string) => {
    if (formAssignedTerritories.includes(territoryName)) {
      setFormAssignedTerritories(formAssignedTerritories.filter((t) => t !== territoryName));
    } else {
      setFormAssignedTerritories([...formAssignedTerritories, territoryName]);
    }
  };

  const handleSelectAllInRegional = (regionalName: string) => {
    const regionalTerritoryNames = territories
      .filter((t) => t.regional === regionalName)
      .map((t) => t.name);

    const allSelected = regionalTerritoryNames.every((name) =>
      formAssignedTerritories.includes(name)
    );

    if (allSelected) {
      // Unselect all in this regional
      setFormAssignedTerritories(
        formAssignedTerritories.filter((name) => !regionalTerritoryNames.includes(name))
      );
      setFormAssignedRegionais(formAssignedRegionais.filter((r) => r !== regionalName));
    } else {
      // Select all in this regional
      const newSet = new Set([...formAssignedTerritories, ...regionalTerritoryNames]);
      setFormAssignedTerritories(Array.from(newSet));
      if (!formAssignedRegionais.includes(regionalName)) {
        setFormAssignedRegionais([...formAssignedRegionais, regionalName]);
      }
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Por favor, informe o nome do usuário.');
      return;
    }

    const newOp: Operator = {
      id: editingOperator ? editingOperator.id : `op-${Date.now()}`,
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole.trim(),
      avatarColor: formAvatarColor,
      isAdmin: formIsAdmin,
      permissionMode: formPermissionMode,
      password: editingOperator ? (editingOperator.password || '123') : '123',
      passwordDefined: editingOperator ? (editingOperator.passwordDefined ?? false) : false,
      mustChangePassword: editingOperator ? (editingOperator.mustChangePassword ?? true) : true,
      allowedTabs: formIsAdmin
        ? ['chamadas', 'dashboard', 'rendimento', 'usuarios', 'configuracoes']
        : formAllowedTabs,
      assignedTerritories: formAssignedTerritories,
      assignedRegionais: formAssignedRegionais,
    };

    onSaveOperator(newOp);
    setIsModalOpen(false);
  };

  const filteredOperators = operators.filter((op) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      op.name.toLowerCase().includes(q) ||
      op.role.toLowerCase().includes(q) ||
      (op.email && op.email.toLowerCase().includes(q)) ||
      (op.assignedTerritories && op.assignedTerritories.some((t) => t.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">
                Controle de Usuários & Territórios
              </h2>
              <p className="text-xs text-slate-500">
                Administre os acessos ao sistema, determine permissão de edição ou somente visualização, e atribua a carteira de territórios de cada assessor.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Active Session Info Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-900 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl ${activeOperator?.avatarColor || 'bg-blue-600'} text-white font-black text-base flex items-center justify-center border-2 border-white/20 shadow-md`}
          >
            {activeOperator?.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-200">Sessão Ativa no Navegador:</span>
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-black uppercase">
                {activeOperator?.isAdmin ? 'ADMINISTRADOR' : 'ASSESSOR INTERNO'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                  activeOperator?.permissionMode === 'view_only'
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-emerald-400 text-slate-900'
                }`}
              >
                {activeOperator?.permissionMode === 'view_only' ? 'Somente Leitura' : 'Edição Completa'}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-0.5">
              {activeOperator?.name} <span className="text-xs font-normal text-slate-300">({activeOperator?.role})</span>
            </h3>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Carteira atribuída:{' '}
              {activeOperator?.assignedTerritories && activeOperator.assignedTerritories.length > 0
                ? `${activeOperator.assignedTerritories.length} território(s) vinculados`
                : 'Acesso a todos os territórios (Admin)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-200 hidden sm:inline">Simular outro usuário:</span>
          <select
            value={activeOperatorId}
            onChange={(e) => onSelectActiveOperator(e.target.value)}
            className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden cursor-pointer"
          >
            {operators.map((op) => (
              <option key={op.id} value={op.id} className="text-slate-900">
                {op.name} ({op.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Usuários Cadastrados ({operators.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Cada usuário possui suas próprias permissões de acesso e territórios em sua pasta.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar por nome, cargo ou território..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOperators.map((op) => {
            const isActive = op.id === activeOperatorId;
            const isViewOnly = op.permissionMode === 'view_only';
            const territoryCount = op.assignedTerritories?.length || 0;

            return (
              <div
                key={op.id}
                className={`bg-white rounded-2xl border ${
                  isActive
                    ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200/90 shadow-2xs hover:shadow-md'
                } p-5 transition-all flex flex-col justify-between relative overflow-hidden`}
              >
                {/* Active user badge ribbon */}
                {isActive && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-xs">
                    Usuário Atual
                  </div>
                )}

                <div>
                  {/* Top user header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${op.avatarColor || 'bg-blue-600'} text-white font-black text-base flex items-center justify-center shadow-xs shrink-0`}
                    >
                      {op.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>

                    <div className="min-w-0 pr-6">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">
                          {op.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{op.role}</p>
                      {op.email && (
                        <p className="text-[11px] text-slate-400 truncate">{op.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Badges: Admin / Permission Mode */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {op.isAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                        <Shield className="w-3 h-3" />
                        Admin Total
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                        <UserCheck className="w-3 h-3" />
                        Assessor Interno
                      </span>
                    )}

                    {isViewOnly ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                        <Eye className="w-3 h-3" />
                        Somente Leitura
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        <Edit2 className="w-3 h-3" />
                        Edição Liberada
                      </span>
                    )}

                    {op.passwordDefined && !op.mustChangePassword && op.password !== '123' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold" title="Senha pessoal configurada">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        Senha Pessoal Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold" title="Aguardando primeiro acesso (senha padrão 123)">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Aguardando 1º Acesso (123)
                      </span>
                    )}
                  </div>

                  {/* Section: Permissões de Abas */}
                  <div className="mb-4">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>Abas Autorizadas:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {AVAILABLE_TABS.map((tab) => {
                        const hasAccess =
                          op.isAdmin || (op.allowedTabs && op.allowedTabs.includes(tab.id));
                        return (
                          <span
                            key={tab.id}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              hasAccess
                                ? 'bg-slate-100 text-slate-800 font-bold border border-slate-200'
                                : 'bg-slate-50 text-slate-300 line-through'
                            }`}
                          >
                            {tab.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section: Territórios Atribuídos (Pastas do Usuário) */}
                  <div className="mb-4">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Folder className="w-3 h-3 text-blue-600" />
                        <span>Territórios (Pastas de Carteira):</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {op.isAdmin ? 'Todos' : `${territoryCount} atribuído(s)`}
                      </span>
                    </div>

                    {op.isAdmin ? (
                      <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-900 text-xs font-semibold">
                        Acesso total a todas as pastas de territórios e regionais da empresa.
                      </div>
                    ) : territoryCount > 0 ? (
                      <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto custom-scrollbar p-1">
                        {op.assignedTerritories.map((tName) => (
                          <span
                            key={tName}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200/70"
                          >
                            <MapPin className="w-2.5 h-2.5 text-blue-500" />
                            <span>{tName}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs italic">
                        Nenhum território atribuído ainda. O usuário verá apenas a pasta geral.
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(op)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors border border-slate-200 cursor-pointer"
                      title="Editar permissões e territórios"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {operators.length > 1 && !op.isAdmin && (
                      <button
                        type="button"
                        onClick={() => setOperatorToDelete(op)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-slate-200 cursor-pointer"
                        title="Excluir usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {onResetPasswordToInitial && (
                      <button
                        type="button"
                        onClick={() => setOperatorToResetPassword(op)}
                        className="p-1.5 rounded-lg text-amber-700 hover:text-amber-950 hover:bg-amber-100/80 transition-colors border border-amber-300 bg-amber-50 cursor-pointer"
                        title="Resetar senha para a inicial (123)"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {!isActive ? (
                    <button
                      onClick={() => onSelectActiveOperator(op.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>Alternar para este Usuário</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      Sessão Ativa
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overview of Regionais and Territórios Reference */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Relação de Regionais & Territórios do Sistema</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Territórios disponíveis para vinculação à carteira dos assessores e vendedores externos.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg self-start sm:self-auto">
            {regionais.length} Regionais • {territories.length} Territórios
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regionais.map((reg) => {
            const regTerritories = territories.filter((t) => t.regional === reg.name);
            return (
              <div
                key={reg.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-slate-900 uppercase">
                      {reg.name} ({reg.state})
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {regTerritories.length} territórios
                    </span>
                  </div>

                  <div className="space-y-1.5 mt-3">
                    {regTerritories.map((ter) => (
                      <div
                        key={ter.id}
                        className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-slate-800">{ter.name}</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Vendedor Externo: <strong className="text-slate-700">{ter.externalSeller}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Create or Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingOperator ? 'Editar Usuário & Permissões' : 'Cadastrar Novo Usuário'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure os dados cadastrais, nível de permissão e territórios responsáveis.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Rafael Alencar"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="Ex: Assessor Interno, Coordenador"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="exemplo@cacique.log.br"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Avatar Color */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cor de Identificação (Avatar)
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setFormAvatarColor(color)}
                        className={`w-7 h-7 rounded-xl ${color} transition-all cursor-pointer flex items-center justify-center text-white ${
                          formAvatarColor === color
                            ? 'ring-2 ring-offset-2 ring-slate-800 scale-110'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        {formAvatarColor === color && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Roles & Permissions Section */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Nível de Acesso & Modo de Permissão</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {/* Mode: Edit vs View Only */}
                  <div
                    onClick={() => setFormPermissionMode('edit')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formPermissionMode === 'edit'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                        Edição Completa
                      </span>
                      {formPermissionMode === 'edit' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Pode marcar/desmarcar chamadas, criar clientes e adicionar anotações.
                    </p>
                  </div>

                  <div
                    onClick={() => setFormPermissionMode('view_only')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formPermissionMode === 'view_only'
                        ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-amber-600" />
                        Somente Visualização
                      </span>
                      {formPermissionMode === 'view_only' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Pode consultar a carteira, dashboard e relatórios, mas não pode alterar dados.
                    </p>
                  </div>
                </div>

                {/* Admin toggle */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Acesso Administrador Total
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Permite gerenciar outros usuários, alterar configurações e acessar todos os territórios.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsAdmin}
                    onChange={(e) => setFormIsAdmin(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Tabs Access Control */}
              {!formIsAdmin && (
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Abas com Acesso Permitido</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AVAILABLE_TABS.map((tab) => {
                      const isAllowed = formAllowedTabs.includes(tab.id);
                      return (
                        <label
                          key={tab.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isAllowed
                              ? 'bg-blue-50/70 border-blue-300 text-blue-900'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <tab.icon className="w-4 h-4 text-blue-600" />
                            <span>{tab.label}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => handleToggleTabPermission(tab.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Territory Assignment (Folders) */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-blue-600" />
                    <span>Territórios sob Responsabilidade do Usuário (Pastas)</span>
                  </h4>
                  <span className="text-xs font-bold text-blue-600">
                    {formAssignedTerritories.length} selecionado(s)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Selecione quais territórios farão parte da carteira deste assessor interno. Na tela de chamadas, esses territórios serão organizados como pastas.
                </p>

                <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {regionais.map((reg) => {
                    const regTerritories = territories.filter((t) => t.regional === reg.name);
                    const allInRegSelected = regTerritories.every((t) =>
                      formAssignedTerritories.includes(t.name)
                    );

                    return (
                      <div
                        key={reg.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200"
                      >
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200">
                          <span className="text-xs font-bold text-slate-900 uppercase">
                            {reg.name} ({reg.state})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelectAllInRegional(reg.name)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            {allInRegSelected ? 'Desmarcar Todos' : 'Marcar Todos da Regional'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {regTerritories.map((ter) => {
                            const isChecked = formAssignedTerritories.includes(ter.name);
                            return (
                              <label
                                key={ter.id}
                                className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer text-xs ${
                                  isChecked
                                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div className="truncate flex items-center gap-1.5">
                                    <span>{ter.name}</span>
                                    {ter.code && (
                                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 text-slate-700 rounded font-mono font-bold">
                                        {ter.code}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-normal truncate">
                                    {ter.externalSeller && ter.externalSeller !== 'A Definir'
                                      ? `Vendedor: ${ter.externalSeller}`
                                      : `Regional: ${ter.regional}`}
                                  </div>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleTerritory(ter.name)}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 shrink-0"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs hover:shadow-md cursor-pointer"
                >
                  {editingOperator ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Excluir Usuário */}
      {operatorToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setOperatorToDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Remover Usuário?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confirmação de exclusão do operador
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOperatorToDelete(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-4 space-y-1 text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${operatorToDelete.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                  {operatorToDelete.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{operatorToDelete.name}</div>
                  <div className="text-slate-500 text-[11px]">{operatorToDelete.role} {operatorToDelete.email ? `• ${operatorToDelete.email}` : ''}</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Deseja realmente remover o usuário <strong>{operatorToDelete.name}</strong> do sistema? Suas permissões de acesso e filtros de carteira serão revogados.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOperatorToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Não, Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteOperator(operatorToDelete.id);
                  setOperatorToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Remover</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Reset de Senha */}
      {operatorToResetPassword && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-amber-700 font-extrabold text-base">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h3>Resetar Senha para Inicial (123)</h3>
              </div>
              <button
                onClick={() => setOperatorToResetPassword(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl ${
                    operatorToResetPassword.avatarColor || 'bg-blue-600'
                  } text-white flex items-center justify-center font-bold text-sm shrink-0`}
                >
                  {operatorToResetPassword.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{operatorToResetPassword.name}</div>
                  <div className="text-slate-500 text-[11px]">
                    {operatorToResetPassword.email || 'Sem e-mail'}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Deseja redefinir a senha do usuário <strong>{operatorToResetPassword.name}</strong> para a senha inicial <strong>123</strong>?
              <br />
              <span className="text-amber-800 font-semibold block mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                No próximo login, o usuário deverá usar <strong>123</strong> e o sistema exigirá obrigatoriamente a criação de uma nova senha pessoal.
              </span>
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOperatorToResetPassword(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onResetPasswordToInitial) {
                    onResetPasswordToInitial(operatorToResetPassword.id);
                  }
                  setOperatorToResetPassword(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Confirmar Reset (123)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
