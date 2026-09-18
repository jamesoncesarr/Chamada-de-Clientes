/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ClientCallsTable } from './components/ClientCallsTable';
import { DashboardView } from './components/DashboardView';
import { RendimentoView } from './components/RendimentoView';
import { SettingsView } from './components/SettingsView';
import { ControleUsuariosView } from './components/ControleUsuariosView';
import { LoginView } from './components/LoginView';
import { CallModal } from './components/CallModal';
import { ClientProfileModal } from './components/ClientProfileModal';
import { NewClientModal } from './components/NewClientModal';
import { ToastContainer } from './components/Toast';
import {
  INITIAL_CLIENTS,
  INITIAL_CALLS,
  INITIAL_OPERATORS,
  INITIAL_SETTINGS,
} from './data/initialData';
import { INITIAL_REGIONAIS, INITIAL_TERRITORIES } from './data/territoriesData';
import {
  Client,
  CallRecord,
  Operator,
  AppSettings,
  ActiveTab,
  ToastMessage,
  Regional,
  Territory,
  ClientSource,
  CsvUploadMeta,
} from './types';
import { getMonthDays, getCustomPeriodDays } from './utils/dateUtils';
import { ensureUniqueClients } from './utils/csvClientParser';
import { FirestoreService } from './services/firestoreService';

export default function App() {
  // Persistence state in localStorage
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('cacique_clients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = ensureUniqueClients(parsed);
          if (sanitized !== parsed) {
            localStorage.setItem('cacique_clients', JSON.stringify(sanitized));
          }
          return sanitized;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return ensureUniqueClients(INITIAL_CLIENTS);
  });

  const [mapaUploadMeta, setMapaUploadMeta] = useState<CsvUploadMeta | null>(() => {
    const saved = localStorage.getItem('cacique_csv_meta_mapa');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  const [geradoresUploadMeta, setGeradoresUploadMeta] = useState<CsvUploadMeta | null>(() => {
    const saved = localStorage.getItem('cacique_csv_meta_geradores');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  const [calls, setCalls] = useState<CallRecord[]>(() => {
    const saved = localStorage.getItem('cacique_calls');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_CALLS;
  });

  const [operators, setOperators] = useState<Operator[]>(() => {
    const saved = localStorage.getItem('cacique_operators');
    if (saved) {
      try {
        const parsed: Operator[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize and ensure login credentials & security flags exist
          const migrated: Operator[] = parsed.map((op) => {
            const isJameson =
              op.id === 'op-1' ||
              op.email === 'contatojamesoncesar@gmail.com' ||
              op.name.toLowerCase().includes('jameson');

            return {
              ...op,
              email: isJameson
                ? 'contatojamesoncesar@gmail.com'
                : op.email || `${op.name.toLowerCase().replace(/\s+/g, '')}@empresa.com`,
              isAdmin: isJameson ? true : (op.isAdmin ?? false),
              password: op.password || '123',
              passwordDefined: op.passwordDefined ?? false,
              mustChangePassword: op.mustChangePassword ?? (op.password === '123' || !op.passwordDefined),
            };
          });

          // Ensure Jameson Cesar exists in the operators array
          const hasJameson = migrated.some((op) => op.email === 'contatojamesoncesar@gmail.com');
          if (!hasJameson) {
            migrated.unshift(INITIAL_OPERATORS[0]);
          }

          return migrated;
        }
      } catch (e) {
        console.error('Falha ao carregar operadores do localStorage', e);
      }
    }
    return INITIAL_OPERATORS;
  });

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('cacique_is_logged_in') === 'true';
  });

  const [loggedUserEmail, setLoggedUserEmail] = useState<string>(() => {
    return localStorage.getItem('cacique_logged_email') || '';
  });

  const [regionais, setRegionais] = useState<Regional[]>(() => {
    const version = localStorage.getItem('cacique_territories_version');
    if (version !== '3.0') {
      localStorage.setItem('cacique_regionais', JSON.stringify(INITIAL_REGIONAIS));
      return INITIAL_REGIONAIS;
    }
    const saved = localStorage.getItem('cacique_regionais');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_REGIONAIS.length) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_REGIONAIS;
  });

  const [territories, setTerritories] = useState<Territory[]>(() => {
    const version = localStorage.getItem('cacique_territories_version');
    if (version !== '3.0') {
      localStorage.setItem('cacique_territories', JSON.stringify(INITIAL_TERRITORIES));
      return INITIAL_TERRITORIES;
    }
    const saved = localStorage.getItem('cacique_territories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_TERRITORIES.length) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_TERRITORIES;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('cacique_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_SETTINGS;
  });

  // Track how many times a check has been unmarked (key: `${clientId}_${dateStr}`)
  // Rule: only 1 unmark allowed per client per date
  const [unmarkHistory, setUnmarkHistory] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('cacique_unmark_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  // Cloud Synchronization State
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'syncing' | 'synced' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isSyncingToCloud, setIsSyncingToCloud] = useState<boolean>(false);

  // Real-time Cloud Listeners: sync data whenever anyone changes it on any device
  useEffect(() => {
    let isInitialLoad = true;

    // Listen to Operators
    const unsubOperators = FirestoreService.listenOperators((cloudOps) => {
      if (cloudOps && cloudOps.length > 0) {
        setOperators(cloudOps);
      } else if (isInitialLoad) {
        // If cloud empty on start, seed initial operators to cloud
        INITIAL_OPERATORS.forEach((op) => FirestoreService.saveOperator(op));
      }
    });

    // Listen to Calls
    const unsubCalls = FirestoreService.listenCalls((cloudCalls) => {
      if (cloudCalls) {
        setCalls(cloudCalls);
        const now = new Date();
        setLastSyncTime(
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        );
      }
    });

    // Listen to Clients
    const unsubClients = FirestoreService.listenClients((cloudClients) => {
      if (cloudClients && cloudClients.length > 0) {
        setClients(ensureUniqueClients(cloudClients));
        const now = new Date();
        setLastSyncTime(
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        );
      }
    });

    // Listen to Territories
    const unsubTerritories = FirestoreService.listenTerritories((cloudTerrs) => {
      if (cloudTerrs && cloudTerrs.length > 0) {
        setTerritories(cloudTerrs);
      }
    });

    // Listen to Regionais
    const unsubRegionais = FirestoreService.listenRegionais((cloudRegs) => {
      if (cloudRegs && cloudRegs.length > 0) {
        setRegionais(cloudRegs);
      }
    });

    isInitialLoad = false;

    return () => {
      unsubOperators();
      unsubCalls();
      unsubClients();
      unsubTerritories();
      unsubRegionais();
    };
  }, []);

  // Sync all current data to Cloud Firestore
  const handleSyncAllToCloud = async () => {
    setIsSyncingToCloud(true);
    setCloudSyncStatus('syncing');
    try {
      // 1. Sync Operators
      for (const op of operators) {
        await FirestoreService.saveOperator(op);
      }
      // 2. Sync Regionais & Territories
      await FirestoreService.saveRegionais(regionais);
      await FirestoreService.saveTerritories(territories);
      // 3. Sync Settings
      await FirestoreService.saveSettings(settings);
      // 4. Sync Calls
      for (const call of calls) {
        await FirestoreService.saveCall(call);
      }
      // 5. Sync Clients in batches
      await FirestoreService.batchSaveClients(clients);

      setCloudSyncStatus('synced');
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setLastSyncTime(timeStr);
      addToast(
        'Nuvem Sincronizada',
        `Toda a base (${clients.length} clientes, ${calls.length} chamadas e ${operators.length} operadores) foi sincronizada no Firebase Firestore!`,
        'success'
      );
    } catch (e) {
      console.error('Falha ao sincronizar com a nuvem:', e);
      setCloudSyncStatus('error');
      addToast(
        'Erro na Sincronização',
        'Não foi possível concluir o envio para a nuvem. Verifique sua conexão.',
        'warning'
      );
    } finally {
      setIsSyncingToCloud(false);
    }
  };

  // Sync state to localStorage (offline cache fallback)
  useEffect(() => {
    localStorage.setItem('cacique_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('cacique_calls', JSON.stringify(calls));
  }, [calls]);

  useEffect(() => {
    localStorage.setItem('cacique_operators', JSON.stringify(operators));
  }, [operators]);

  useEffect(() => {
    localStorage.setItem('cacique_regionais', JSON.stringify(regionais));
  }, [regionais]);

  useEffect(() => {
    localStorage.setItem('cacique_territories', JSON.stringify(territories));
  }, [territories]);

  useEffect(() => {
    localStorage.setItem('cacique_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('cacique_unmark_history', JSON.stringify(unmarkHistory));
  }, [unmarkHistory]);

  useEffect(() => {
    if (mapaUploadMeta) {
      localStorage.setItem('cacique_csv_meta_mapa', JSON.stringify(mapaUploadMeta));
    } else {
      localStorage.removeItem('cacique_csv_meta_mapa');
    }
  }, [mapaUploadMeta]);

  useEffect(() => {
    if (geradoresUploadMeta) {
      localStorage.setItem('cacique_csv_meta_geradores', JSON.stringify(geradoresUploadMeta));
    } else {
      localStorage.removeItem('cacique_csv_meta_geradores');
    }
  }, [geradoresUploadMeta]);

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('chamadas');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('cacique_theme') === 'dark';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBase, setSelectedBase] = useState('ALL');

  // Synchronize Dark Theme class on root document (ONLY when logged in)
  useEffect(() => {
    localStorage.setItem('cacique_theme', isDarkMode ? 'dark' : 'light');
    if (isLoggedIn) {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode, isLoggedIn]);

  // Calendar Period (Defaulting to September 2026, matching user's reference screenshot)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 = September

  // Modals & Drawers
  const [selectedCallTarget, setSelectedCallTarget] = useState<{
    client: Client;
    dateStr: string;
    existingCall: CallRecord | null;
  } | null>(null);

  const [profileModalClient, setProfileModalClient] = useState<Client | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, settings.copyFeedbackDuration || 2500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Play subtle feedback chime using Web Audio API
  const playFeedbackChime = () => {
    if (!settings.soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) {
      // Audio context might be suspended by browser policy until interaction
    }
  };

  // Active Operator
  const activeOperator = useMemo(() => {
    return operators.find((op) => op.id === settings.activeOperatorId) || operators[0];
  }, [operators, settings.activeOperatorId]);

  // Unique bases for filter
  const availableBases = useMemo(() => {
    const bases = new Set<string>();
    clients.forEach((c) => {
      if (c.base) bases.add(c.base);
    });
    return Array.from(bases).sort();
  }, [clients]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        searchTerm === '' ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.farm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contact1.includes(searchTerm) ||
        c.contact2.includes(searchTerm);

      const matchesBase = selectedBase === 'ALL' || c.base === selectedBase;

      return matchesSearch && matchesBase;
    });
  }, [clients, searchTerm, selectedBase]);

  // Calendar Day Columns for the chosen period
  const dayColumns = useMemo(() => {
    // Generates the 30/31 days of the selected month
    return getMonthDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Calendar Navigation Handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleResetToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Quick Copy Phone
  const handleCopyPhone = (phone: string, label: string) => {
    if (!phone || phone === '-') return;
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cleanPhone).catch(() => {
        // Fallback
      });
    }

    addToast(
      'Contato Copiado',
      `${label}: ${phone} copiado para a área de transferência!`,
      'success'
    );
  };

  // Open WhatsApp with prefilled message
  const handleOpenWhatsApp = (client: Client, rawPhone: string) => {
    if (!rawPhone || rawPhone === '-') return;
    let cleanPhone = rawPhone.replace(/\D/g, '');
    // Ensure Brazilian country code 55
    if (cleanPhone.length >= 10 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }

    const message = settings.whatsappTemplate
      .replace('{cliente}', client.name)
      .replace('{fazenda}', client.farm)
      .replace('{operador}', activeOperator?.name || 'Cacique');

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    addToast('WhatsApp Aberto', `Iniciando conversa com ${client.name}...`, 'info');
  };

  // Toggle call checkmark in table
  const handleToggleCallCheck = (clientId: string, dateStr: string) => {
    if (activeOperator?.permissionMode === 'view_only') {
      addToast(
        'Modo Somente Visualização',
        'Seu perfil possui permissão de apenas consulta.',
        'warning'
      );
      return;
    }

    const existingIndex = calls.findIndex(
      (c) => c.clientId === clientId && c.date === dateStr
    );

    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    if (existingIndex >= 0) {
      // If already checked, open modal to inspect or remove
      setSelectedCallTarget({
        client,
        dateStr,
        existingCall: calls[existingIndex],
      });
    } else {
      // Mark checked immediately with active operator!
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      const newCall: CallRecord = {
        id: 'call-' + Date.now() + Math.random().toString(36).substring(2, 6),
        clientId,
        date: dateStr,
        time: timeStr,
        operatorId: activeOperator.id,
        operatorName: activeOperator.name,
        notes: '',
        status: 'completed',
      };

      setCalls((prev) => [...prev, newCall]);
      FirestoreService.saveCall(newCall).catch((err) => console.error('Erro ao salvar chamada na nuvem:', err));
      playFeedbackChime();

      addToast(
        'Chamada Registrada',
        `Check marcado para ${client.name} por ${activeOperator.name}!`,
        'success'
      );
    }
  };

  // Save Operator (Add or update from Controle de Usuários)
  const handleSaveOperator = (updatedOp: Operator) => {
    let finalOp = updatedOp;
    setOperators((prev) => {
      const exists = prev.some((o) => o.id === updatedOp.id);
      if (exists) {
        return prev.map((o) => (o.id === updatedOp.id ? updatedOp : o));
      } else {
        // Novo usuário cadastrado pelo Admin: senha inicial 123, deve definir nova senha no primeiro acesso
        finalOp = {
          ...updatedOp,
          password: updatedOp.password || '123',
          passwordDefined: false,
          mustChangePassword: true,
        };
        return [...prev, finalOp];
      }
    });
    FirestoreService.saveOperator(finalOp).catch((err) => console.error('Erro ao salvar operador na nuvem:', err));
    addToast(
      'Usuário Salvo',
      `O usuário ${updatedOp.name} foi configurado com sucesso! Senha inicial: 123.`,
      'success'
    );
  };

  // Reset de Senha para Inicial (123) executado apenas pelo Admin
  const handleResetPasswordToInitial = (operatorId: string) => {
    let updatedOpTarget: Operator | null = null;
    setOperators((prev) =>
      prev.map((op) => {
        if (op.id === operatorId) {
          updatedOpTarget = {
            ...op,
            password: '123',
            passwordDefined: false,
            mustChangePassword: true,
          };
          return updatedOpTarget;
        }
        return op;
      })
    );
    if (updatedOpTarget) {
      FirestoreService.saveOperator(updatedOpTarget).catch((err) => console.error('Erro ao resetar senha na nuvem:', err));
    }
    const target = operators.find((o) => o.id === operatorId);
    addToast(
      'Senha Redefinida (123)',
      `A senha de ${target?.name || 'usuário'} foi resetada para a inicial "123". No próximo login será exigida a criação de uma nova senha pessoal.`,
      'info'
    );
  };

  // Login Handlers
  const handleLoginSuccess = (operator: Operator) => {
    const email = operator.email || '';
    setIsLoggedIn(true);
    setLoggedUserEmail(email);
    localStorage.setItem('cacique_is_logged_in', 'true');
    localStorage.setItem('cacique_logged_email', email);
    setSettings((prev) => ({ ...prev, activeOperatorId: operator.id }));
    addToast(
      'Login Realizado',
      `Bem-vindo(a) ao sistema Cacique, ${operator.name}!`,
      'success'
    );
  };

  const handleSetPasswordAndLogin = (operatorId: string, newPassword: string) => {
    setOperators((prev) =>
      prev.map((op) => {
        if (op.id === operatorId) {
          return {
            ...op,
            password: newPassword,
            passwordDefined: true,
            mustChangePassword: false,
          };
        }
        return op;
      })
    );
    const op = operators.find((o) => o.id === operatorId);
    if (op) {
      const email = op.email || '';
      setIsLoggedIn(true);
      setLoggedUserEmail(email);
      localStorage.setItem('cacique_is_logged_in', 'true');
      localStorage.setItem('cacique_logged_email', email);
      setSettings((prev) => ({ ...prev, activeOperatorId: op.id }));
      FirestoreService.saveOperator({
        ...op,
        password: newPassword,
        passwordDefined: true,
        mustChangePassword: false,
      }).catch((err) => console.error('Erro ao atualizar senha na nuvem:', err));
      addToast(
        'Nova Senha Configurada',
        `Senha definida com sucesso! Bem-vindo(a), ${op.name}!`,
        'success'
      );
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedUserEmail('');
    localStorage.removeItem('cacique_is_logged_in');
    localStorage.removeItem('cacique_logged_email');
    addToast('Sessão Encerrada', 'Você saiu do sistema com segurança.', 'info');
  };

  // Delete Operator
  const handleDeleteOperator = (operatorId: string) => {
    const opToDelete = operators.find((o) => o.id === operatorId);
    setOperators((prev) => prev.filter((o) => o.id !== operatorId));
    FirestoreService.deleteOperator(operatorId).catch((err) =>
      console.error('Erro ao excluir operador na nuvem:', err)
    );
    if (settings.activeOperatorId === operatorId) {
      const remaining = operators.filter((o) => o.id !== operatorId);
      if (remaining.length > 0) {
        setSettings((prev) => ({ ...prev, activeOperatorId: remaining[0].id }));
      }
    }
    addToast(
      'Usuário Removido',
      `O usuário ${opToDelete?.name || ''} foi removido.`,
      'info'
    );
  };

  // Select Active Operator Session
  const handleSelectActiveOperator = (operatorId: string) => {
    setSettings((prev) => ({ ...prev, activeOperatorId: operatorId }));
    const chosen = operators.find((o) => o.id === operatorId);
    addToast(
      'Sessão Alterada',
      `Você agora está operando como ${chosen?.name || 'Operador'} (${chosen?.role || ''}).`,
      'info'
    );
  };

  // Tab change with permission verification
  const handleTabChange = (targetTab: ActiveTab) => {
    if (activeOperator && !activeOperator.isAdmin && activeOperator.allowedTabs) {
      if (!activeOperator.allowedTabs.includes(targetTab)) {
        addToast(
          'Acesso Restrito',
          `Seu perfil (${activeOperator.name}) não tem acesso à aba selecionada. Solicite liberação ao Administrador.`,
          'warning'
        );
        return;
      }
    }
    setActiveTab(targetTab);
  };

  // Import CSV Clients with automatic source replacement logic:
  // "sempre que subir um arquivo novo, deve substituir o antigo.
  // se subi o arquivo 1, ele substitui o arquivo 1 antigo
  // se subi o arquivo 2, ele substitui o arquivo 2 antigo
  // no final, os dois arquivos, devem ser um só dentro do sistema, ambos são de clientes."
  const handleImportCsvClients = (
    source: ClientSource,
    newClients: Client[],
    meta: CsvUploadMeta,
    detectedRegionais: string[],
    detectedTerritories: { name: string; code?: string; regional?: string }[]
  ) => {
    // 1. Replace only clients from this source
    let finalUnifiedClients: Client[] = [];
    setClients((prev) => {
      const remaining = prev.filter((c) => c.source !== source);
      finalUnifiedClients = ensureUniqueClients([...remaining, ...newClients]);
      return finalUnifiedClients;
    });

    // Sync to Cloud Firestore in batches
    FirestoreService.batchSaveClients(finalUnifiedClients).catch((err) =>
      console.error('Erro ao enviar clientes para nuvem após importação:', err)
    );

    // 2. Update upload metadata for this source
    if (source === 'mapa') {
      setMapaUploadMeta(meta);
    } else if (source === 'geradores') {
      setGeradoresUploadMeta(meta);
    }

    // 3. Auto-register new Regionais from CSV if not already present
    if (detectedRegionais.length > 0) {
      setRegionais((prev) => {
        const existingNames = new Set(prev.map((r) => r.name.toLowerCase()));
        const toAdd: Regional[] = [];
        detectedRegionais.forEach((regName) => {
          if (!existingNames.has(regName.toLowerCase())) {
            toAdd.push({
              id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: regName,
              state: regName.includes('PI') ? 'PI' : regName.includes('MA') ? 'MA' : 'TO',
            });
            existingNames.add(regName.toLowerCase());
          }
        });
        const updated = toAdd.length > 0 ? [...prev, ...toAdd] : prev;
        if (toAdd.length > 0) {
          FirestoreService.saveRegionais(updated).catch((err) => console.error('Erro ao salvar regionais na nuvem:', err));
        }
        return updated;
      });
    }

    // 4. Auto-register new Territories from CSV if not already present
    if (detectedTerritories.length > 0) {
      setTerritories((prev) => {
        const existingNames = new Set(prev.map((t) => t.name.toLowerCase()));
        const toAdd: Territory[] = [];
        detectedTerritories.forEach((dt) => {
          if (!existingNames.has(dt.name.toLowerCase())) {
            toAdd.push({
              id: `terr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: dt.name,
              regional: dt.regional || 'Geral',
              externalSeller: 'A definir',
              description: dt.code ? `Código do Território: ${dt.code}` : undefined,
            });
            existingNames.add(dt.name.toLowerCase());
          }
        });
        const updated = toAdd.length > 0 ? [...prev, ...toAdd] : prev;
        if (toAdd.length > 0) {
          FirestoreService.saveTerritories(updated).catch((err) => console.error('Erro ao salvar territórios na nuvem:', err));
        }
        return updated;
      });
    }

    const sourceTitle = source === 'mapa' ? 'Arquivo 1 (Mapa)' : 'Arquivo 2 (Geradores)';
    addToast(
      `${sourceTitle} Atualizado`,
      `${newClients.length} clientes carregados com sucesso. A base anterior deste arquivo foi substituída mantendo os demais cadastros unificados.`,
      'success'
    );
  };

  // Clear specific CSV source clients
  const handleClearSourceClients = (source: ClientSource) => {
    let remainingClients: Client[] = [];
    setClients((prev) => {
      remainingClients = prev.filter((c) => c.source !== source);
      return remainingClients;
    });
    FirestoreService.batchSaveClients(remainingClients).catch((err) =>
      console.error('Erro ao atualizar nuvem após limpeza de fonte:', err)
    );
    if (source === 'mapa') {
      setMapaUploadMeta(null);
    } else if (source === 'geradores') {
      setGeradoresUploadMeta(null);
    }
    const sourceTitle = source === 'mapa' ? 'Arquivo 1 (Mapa)' : 'Arquivo 2 (Geradores)';
    addToast('Base Limpa', `Os clientes do ${sourceTitle} foram removidos da carteira unificada.`, 'info');
  };

  // Save Call from Modal (Only notes are editable; time and operator are recorded at check time)
  const handleSaveCallModal = (callData: { notes?: string }) => {
    if (!selectedCallTarget) return;
    const { client, dateStr, existingCall } = selectedCallTarget;

    if (existingCall) {
      // Update existing call notes only
      const updatedCall: CallRecord = {
        ...existingCall,
        notes: callData.notes,
      };
      setCalls((prev) =>
        prev.map((c) =>
          c.id === existingCall.id
            ? updatedCall
            : c
        )
      );
      FirestoreService.saveCall(updatedCall).catch((err) => console.error('Erro ao salvar chamada na nuvem:', err));
      addToast('Chamada Atualizada', `Observações de ${client.name} salvas com sucesso!`, 'success');
    } else {
      // Create new call with current exact clock time and active operator
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      const newCall: CallRecord = {
        id: 'call-' + Date.now() + Math.random().toString(36).substring(2, 6),
        clientId: client.id,
        date: dateStr,
        time: timeStr,
        operatorId: activeOperator.id,
        operatorName: activeOperator.name,
        notes: callData.notes,
        status: 'completed',
      };
      setCalls((prev) => [...prev, newCall]);
      FirestoreService.saveCall(newCall).catch((err) => console.error('Erro ao salvar chamada na nuvem:', err));
      playFeedbackChime();
      addToast('Chamada Confirmada', `Chamada registrada para ${client.name} por ${activeOperator.name}!`, 'success');
    }
  };

  // Delete Call with single-use restriction per client & date
  const handleDeleteCall = (callId: string, clientId: string, dateStr: string) => {
    const key = `${clientId}_${dateStr}`;
    const previousUnmarks = unmarkHistory[key] || 0;

    if (previousUnmarks >= 1) {
      addToast(
        'Ação Bloqueada',
        'Limite de 1 desmarcação atingido para esta data. Não é permitido desmarcar novamente.',
        'warning'
      );
      return;
    }

    setUnmarkHistory((prev) => ({
      ...prev,
      [key]: previousUnmarks + 1,
    }));

    setCalls((prev) => prev.filter((c) => c.id !== callId));
    FirestoreService.deleteCall(callId).catch((err) => console.error('Erro ao remover chamada na nuvem:', err));
    addToast(
      'Check Desmarcado',
      'Marcação de chamada desmarcada com sucesso (1/1 correção utilizada).',
      'info'
    );
  };

  // Client Management: Save New or Edit
  const handleSaveClient = (
    clientData: Omit<Client, 'id' | 'createdAt'>,
    clientIdToEdit?: string
  ) => {
    if (clientIdToEdit) {
      let updatedClient: Client | null = null;
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === clientIdToEdit) {
            updatedClient = { ...c, ...clientData };
            return updatedClient;
          }
          return c;
        })
      );
      if (updatedClient) {
        FirestoreService.saveClient(updatedClient).catch((err) => console.error('Erro ao salvar cliente na nuvem:', err));
      }
      addToast('Cliente Atualizado', `Cadastro de ${clientData.name} salvo com sucesso!`, 'success');
    } else {
      const newClient: Client = {
        id: 'cli-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        ...clientData,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setClients((prev) => ensureUniqueClients([...prev, newClient]));
      FirestoreService.saveClient(newClient).catch((err) => console.error('Erro ao salvar novo cliente na nuvem:', err));
      addToast('Novo Cliente Cadastrado', `${clientData.name} inserido no sistema!`, 'success');
    }
  };

  const handleDeleteClient = (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    setCalls((prev) => prev.filter((c) => c.clientId !== clientId));
    FirestoreService.deleteClient(clientId).catch((err) => console.error('Erro ao excluir cliente na nuvem:', err));
    addToast('Cliente Removido', 'O cliente e seu histórico de chamadas foram excluídos.', 'warning');
  };

  // Reset to Factory Default Data
  const handleResetData = () => {
    setClients(INITIAL_CLIENTS);
    setCalls(INITIAL_CALLS);
    setOperators(INITIAL_OPERATORS);
    setSettings(INITIAL_SETTINGS);
    localStorage.clear();
    addToast('Dados Restaurados', 'O banco de dados foi resetado para os dados de demonstração.', 'info');
  };

  // Export Data JSON
  const handleExportData = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      clients,
      calls,
      operators,
      settings,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cacique_chamadas_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Backup Exportado', 'Download do arquivo de backup realizado com sucesso.', 'success');
  };

  // Next suggested code
  const suggestedCode = String(clients.length + 1).padStart(3, '0');

  // If user is not authenticated, display Login Screen (Access Gatekeeper)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white">
        <LoginView
          operators={operators}
          onLoginSuccess={handleLoginSuccess}
          onSetPasswordAndLogin={handleSetPasswordAndLogin}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-row ${isDarkMode ? 'dark bg-[#0a0e17] text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      {/* 1. Left Vertical Icon Sidebar (matching screenshot layout) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        activeOperator={activeOperator}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header with Month Navigator, Search, Filters & Tab Pills */}
        <Header
          activeTab={activeTab}
          onTabChange={handleTabChange}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedBase={selectedBase}
          onBaseChange={setSelectedBase}
          availableBases={availableBases}
          totalClientsCount={clients.length}
          currentYear={currentYear}
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onResetToToday={handleResetToToday}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onOpenNewClientModal={() => {
            setClientToEdit(null);
            setIsNewClientModalOpen(true);
          }}
          operators={operators}
          activeOperatorId={settings.activeOperatorId}
          onSelectOperator={(id) => handleSelectActiveOperator(id)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          cloudSyncStatus={cloudSyncStatus}
          lastSyncTime={lastSyncTime}
        />

        {/* Tab Views */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activeTab === 'chamadas' && (
            <div className="space-y-4">
              <ClientCallsTable
                clients={filteredClients}
                calls={calls}
                dayColumns={dayColumns}
                operators={operators}
                activeOperatorId={settings.activeOperatorId}
                territories={territories}
                regionais={regionais}
                onToggleCallCheck={handleToggleCallCheck}
                onOpenCallModal={(client, dateStr, existingCall) =>
                  setSelectedCallTarget({ client, dateStr, existingCall })
                }
                onCopyPhone={handleCopyPhone}
                onOpenWhatsApp={handleOpenWhatsApp}
                onSelectClientProfile={(client) => setProfileModalClient(client)}
              />
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              clients={clients}
              calls={calls}
              operators={operators}
              alertDaysThreshold={settings.uncalledAlertDays}
              regionais={regionais}
              territories={territories}
              onSelectClient={(client) => setProfileModalClient(client)}
              onCopyPhone={handleCopyPhone}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          )}

          {activeTab === 'rendimento' && (
            <RendimentoView
              calls={calls}
              operators={operators}
              clients={clients}
              currentYear={currentYear}
              currentMonth={currentMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onResetToToday={handleResetToToday}
            />
          )}

          {activeTab === 'usuarios' && (
            <ControleUsuariosView
              operators={operators}
              activeOperatorId={settings.activeOperatorId}
              regionais={regionais}
              territories={territories}
              onSelectActiveOperator={handleSelectActiveOperator}
              onSaveOperator={handleSaveOperator}
              onDeleteOperator={handleDeleteOperator}
              onResetPasswordToInitial={handleResetPasswordToInitial}
            />
          )}

          {activeTab === 'configuracoes' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={(newSettings) =>
                setSettings((prev) => ({ ...prev, ...newSettings }))
              }
              clients={clients}
              operators={operators}
              mapaUploadMeta={mapaUploadMeta}
              geradoresUploadMeta={geradoresUploadMeta}
              onOpenAddClient={() => {
                setClientToEdit(null);
                setIsNewClientModalOpen(true);
              }}
              onEditClient={(client) => {
                setClientToEdit(client);
                setIsNewClientModalOpen(true);
              }}
              onDeleteClient={handleDeleteClient}
              onAddOperator={(newOp) => {
                const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600', 'bg-rose-600'];
                const op: Operator = {
                  id: 'op-' + Date.now(),
                  ...newOp,
                  avatarColor: colors[operators.length % colors.length],
                };
                setOperators((prev) => [...prev, op]);
                addToast('Operador Criado', `Perfil de ${newOp.name} registrado!`, 'success');
              }}
              onResetData={handleResetData}
              onExportData={handleExportData}
              onSyncAllToCloud={handleSyncAllToCloud}
              isSyncingToCloud={isSyncingToCloud}
              onImportCsvClients={handleImportCsvClients}
              onClearSourceClients={handleClearSourceClients}
            />
          )}
        </main>

        {/* Enterprise Bottom Footer matching the screenshot */}
        <footer className="px-6 py-3 bg-white dark:bg-[#080c14] border-t border-slate-200/80 dark:border-[#141c2c] text-xs text-slate-500 dark:text-[#7d8ea5] flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="font-semibold text-slate-700 dark:text-[#cbd5e1]">
            Desenvolvimento Cacique
          </div>
          <div className="text-[11px] text-slate-400 dark:text-[#5a6c85]">
            © 2026 CACIQUE - Sistema de Chamada de Clientes. Todos os direitos reservados.
          </div>
        </footer>
      </div>

      {/* Interactive Modals */}
      {/* 1. Call Details / Check Modal */}
      <CallModal
        isOpen={!!selectedCallTarget}
        onClose={() => setSelectedCallTarget(null)}
        client={selectedCallTarget?.client || null}
        dateStr={selectedCallTarget?.dateStr || ''}
        existingCall={selectedCallTarget?.existingCall || null}
        unmarkCount={
          selectedCallTarget
            ? unmarkHistory[`${selectedCallTarget.client.id}_${selectedCallTarget.dateStr}`] || 0
            : 0
        }
        onSaveCall={handleSaveCallModal}
        onDeleteCall={handleDeleteCall}
        activeOperator={activeOperator}
        onCopyPhone={handleCopyPhone}
        onOpenWhatsApp={handleOpenWhatsApp}
        onViewProfile={(client) => setProfileModalClient(client)}
      />

      {/* 2. Client Profile Modal (Deep dive requested for Dashboard) */}
      <ClientProfileModal
        isOpen={!!profileModalClient}
        onClose={() => setProfileModalClient(null)}
        client={profileModalClient}
        calls={calls}
        operators={operators}
        onCopyPhone={handleCopyPhone}
        onOpenWhatsApp={handleOpenWhatsApp}
        onOpenNewCall={(client) => {
          const todayStr = new Date().toISOString().split('T')[0];
          const existing = calls.find((c) => c.clientId === client.id && c.date === todayStr) || null;
          setSelectedCallTarget({
            client,
            dateStr: todayStr,
            existingCall: existing,
          });
          setProfileModalClient(null);
        }}
      />

      {/* 3. New / Edit Client Modal */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onSaveClient={handleSaveClient}
        clientToEdit={clientToEdit}
        suggestedCode={suggestedCode}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
