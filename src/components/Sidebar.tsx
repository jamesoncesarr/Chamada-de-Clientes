import React from 'react';
import {
  Calendar,
  BarChart3,
  TrendingUp,
  Settings,
  Users,
  LogOut,
  PhoneCall,
} from 'lucide-react';
import { ActiveTab, Operator } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  activeOperator?: Operator;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  activeOperator,
  collapsed,
  onLogout,
}) => {
  return (
    <aside
      className={`h-screen sticky top-0 bg-white dark:bg-[#080c14] border-r border-slate-200/80 dark:border-[#141c2c] flex flex-col justify-between transition-all duration-300 z-30 shrink-0 select-none ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Top Section: User Profile */}
      <div>
        <div
          className={`p-3 border-b border-slate-100 dark:border-[#141c2c] flex items-center transition-all ${
            collapsed ? 'justify-center' : 'gap-2.5 px-3.5'
          }`}
          title={activeOperator?.name || 'Operador'}
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-blue-100 dark:ring-blue-950">
              {activeOperator?.name ? activeOperator.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'JC'}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#080c14]" />
          </div>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <p className="text-xs font-bold text-slate-800 dark:text-[#f1f5f9] truncate">
                {activeOperator?.name || 'James Cesar'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#7d8ea5] truncate">
                {activeOperator?.role || 'Operador'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Items (Exclusive Sidebar Navigation) */}
        <nav className="p-2 space-y-1.5">
          {/* 1. Chamada de Clientes */}
          <button
            onClick={() => onTabChange('chamadas')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'chamadas'
                ? 'bg-blue-600 dark:bg-[#132247] text-white dark:text-[#60a5fa] dark:border dark:border-blue-500/40 shadow-xs font-bold'
                : 'text-slate-600 dark:text-[#8b9cb5] hover:bg-slate-100 dark:hover:bg-[#121929] hover:text-slate-900 dark:hover:text-[#f1f5f9]'
            }`}
            title="Grade de Chamada de Clientes"
          >
            <Calendar className={`w-5 h-5 shrink-0 ${activeTab === 'chamadas' ? 'text-white dark:text-[#60a5fa]' : 'text-slate-500 dark:text-[#7d8ea5]'}`} />
            {!collapsed && <span className="truncate">Chamada de Clientes</span>}
          </button>

          {/* 2. Dashboard */}
          <button
            onClick={() => onTabChange('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 dark:bg-[#132247] text-white dark:text-[#60a5fa] dark:border dark:border-blue-500/40 shadow-xs font-bold'
                : 'text-slate-600 dark:text-[#8b9cb5] hover:bg-slate-100 dark:hover:bg-[#121929] hover:text-slate-900 dark:hover:text-[#f1f5f9]'
            }`}
            title="Dashboard de Métricas & Clientes"
          >
            <BarChart3 className={`w-5 h-5 shrink-0 ${activeTab === 'dashboard' ? 'text-white dark:text-[#60a5fa]' : 'text-slate-500 dark:text-[#7d8ea5]'}`} />
            {!collapsed && <span className="truncate">Dashboard</span>}
          </button>

          {/* 3. Rendimento (Novo Módulo Solicitado) */}
          <button
            onClick={() => onTabChange('rendimento')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'rendimento'
                ? 'bg-blue-600 dark:bg-[#132247] text-white dark:text-[#60a5fa] dark:border dark:border-blue-500/40 shadow-xs font-bold'
                : 'text-slate-600 dark:text-[#8b9cb5] hover:bg-slate-100 dark:hover:bg-[#121929] hover:text-slate-900 dark:hover:text-[#f1f5f9]'
            }`}
            title="Rendimento & Desempenho dos Usuários"
          >
            <TrendingUp className={`w-5 h-5 shrink-0 ${activeTab === 'rendimento' ? 'text-white dark:text-[#60a5fa]' : 'text-slate-500 dark:text-[#7d8ea5]'}`} />
            {!collapsed && (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="truncate">Rendimento</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                  activeTab === 'rendimento'
                    ? 'bg-blue-500 text-white'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400 dark:border dark:border-emerald-800/40'
                }`}>
                  Novo
                </span>
              </div>
            )}
          </button>

          {/* 4. Controle de Usuários (Novo módulo administrativo) */}
          <button
            onClick={() => onTabChange('usuarios')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'usuarios'
                ? 'bg-blue-600 dark:bg-[#132247] text-white dark:text-[#60a5fa] dark:border dark:border-blue-500/40 shadow-xs font-bold'
                : 'text-slate-600 dark:text-[#8b9cb5] hover:bg-slate-100 dark:hover:bg-[#121929] hover:text-slate-900 dark:hover:text-[#f1f5f9]'
            }`}
            title="Controle de Usuários, Acessos e Territórios"
          >
            <Users className={`w-5 h-5 shrink-0 ${activeTab === 'usuarios' ? 'text-white dark:text-[#60a5fa]' : 'text-slate-500 dark:text-[#7d8ea5]'}`} />
            {!collapsed && (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="truncate">Controle de Usuários</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                  activeTab === 'usuarios'
                    ? 'bg-blue-500 text-white'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-400 dark:border dark:border-purple-800/40'
                }`}>
                  Admin
                </span>
              </div>
            )}
          </button>

          {/* 5. Configurações */}
          <button
            onClick={() => onTabChange('configuracoes')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'configuracoes'
                ? 'bg-blue-600 dark:bg-[#132247] text-white dark:text-[#60a5fa] dark:border dark:border-blue-500/40 shadow-xs font-bold'
                : 'text-slate-600 dark:text-[#8b9cb5] hover:bg-slate-100 dark:hover:bg-[#121929] hover:text-slate-900 dark:hover:text-[#f1f5f9]'
            }`}
            title="Configurações do Sistema"
          >
            <Settings className={`w-5 h-5 shrink-0 ${activeTab === 'configuracoes' ? 'text-white dark:text-[#60a5fa]' : 'text-slate-500 dark:text-[#7d8ea5]'}`} />
            {!collapsed && <span className="truncate">Configurações</span>}
          </button>
        </nav>
      </div>

      {/* Bottom section */}
      {onLogout && (
        <div className="p-2.5 border-t border-slate-100 dark:border-[#141c2c]">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#8b9cb5] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-950/30 transition-all cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Encerrar Sessão (Sair)"
          >
            <LogOut className="w-4 h-4 shrink-0 text-slate-400 dark:text-[#7d8ea5] group-hover:text-red-500" />
            {!collapsed && <span>Sair do Sistema</span>}
          </button>
        </div>
      )}
    </aside>
  );
};
