export type ClientSource = 'mapa' | 'geradores' | 'manual';

export interface Client {
  id: string;
  code: string; // Código do Cliente
  name: string; // Nome do Cliente
  farm: string; // Nome da Fazenda
  base: string; // Base de Carregamento / Base Carregamento
  regional?: string; // Regional (ex: Araguaína, Norte MAPI)
  territory?: string; // Território (ex: AGRO ARAG 01, Geradores)
  territoryCode?: string; // Cod. Território (ex: 74184, 61300)
  externalSeller?: string; // Vendedor externo responsável pelo território
  businessType?: string; // Tipo de Negócio (ex: AGRONEGÓCIO, GERADOR)
  poloNumber?: string; // Nº Polo (ex: 4018, 5000)
  poloName?: string; // Nome Polo (ex: WANDERLANDIA, GERADOR TERESINA)
  paymentTerm?: string; // Prazo (ex: ANTECIPADO, 30, 10)
  paymentMethod?: string; // Forma (ex: ANTECIPADO, CARTÃO FROTA, BOLETO)
  
  // Contato 1
  contact1: string; // Telefone formatado com DDD
  contact1Name?: string;
  contact1Role?: string;
  contact1Ddd?: string;
  contact1Number?: string;

  // Contato 2
  contact2: string; // Telefone formatado com DDD
  contact2Name?: string;
  contact2Role?: string;
  contact2Ddd?: string;
  contact2Number?: string;

  // Contato 3
  contact3?: string; // Telefone formatado com DDD
  contact3Name?: string;
  contact3Role?: string;
  contact3Ddd?: string;
  contact3Number?: string;

  source?: ClientSource; // 'mapa' | 'geradores' | 'manual'
  notes?: string;
  createdAt: string; // ISO date
}

export interface CsvUploadMeta {
  source: 'mapa' | 'geradores';
  fileName: string;
  uploadedAt: string;
  totalRecords: number;
}

export interface Territory {
  id: string;
  code?: string; // Código do território (ex: "74184")
  name: string; // e.g. "Agro ARAG 01"
  regional: string; // e.g. "ARAGUAÍNA"
  externalSeller?: string; // Vendedor externo
  description?: string;
}

export interface Regional {
  id: string;
  name: string; // e.g. "Regional Sul PI"
  state: string; // "PI", "MA", etc.
}

export interface CallRecord {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  operatorId: string;
  operatorName: string;
  notes?: string;
  status: 'completed' | 'no_answer' | 'rescheduled';
}

export type UserPermissionMode = 'edit' | 'view_only';

export interface Operator {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  email?: string;
  isAdmin?: boolean;
  permissionMode: UserPermissionMode; // 'edit' ou 'view_only'
  allowedTabs: ActiveTab[]; // abas que o usuário pode acessar
  assignedTerritories: string[]; // nomes ou IDs dos territórios
  assignedRegionais?: string[]; // nomes ou IDs das regionais
  password?: string; // Senha cadastrada pelo usuário
  passwordDefined?: boolean; // Se o usuário já definiu sua senha pessoal
  mustChangePassword?: boolean; // Se deve obrigatoriamente trocar a senha no próximo acesso
}

export interface AppSettings {
  uncalledAlertDays: number;
  whatsappTemplate: string;
  soundEnabled: boolean;
  copyFeedbackDuration: number;
  activeOperatorId: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export type ActiveTab = 'chamadas' | 'dashboard' | 'rendimento' | 'usuarios' | 'configuracoes';
