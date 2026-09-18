import React from 'react';
import {
  X,
  User,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  MessageSquare,
  Copy,
  TrendingUp,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Client, CallRecord, Operator } from '../types';
import { formatDateBR, getDaysSince } from '../utils/dateUtils';
import { calculateClientConstancy } from '../utils/metricsUtils';

interface ClientProfileModalProps {
  client: Client | null;
  calls: CallRecord[];
  operators: Operator[];
  isOpen: boolean;
  onClose: () => void;
  onCopyPhone: (phone: string, label: string) => void;
  onOpenWhatsApp: (client: Client, phone: string) => void;
  onOpenNewCall: (client: Client) => void;
}

export const ClientProfileModal: React.FC<ClientProfileModalProps> = ({
  client,
  calls,
  operators,
  isOpen,
  onClose,
  onCopyPhone,
  onOpenWhatsApp,
  onOpenNewCall,
}) => {
  if (!isOpen || !client) return null;

  // Filter and sort calls for this specific client (newest first)
  const clientCalls = calls
    .filter((c) => c.clientId === client.id)
    .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')).getTime() - new Date(a.date + ' ' + (a.time || '00:00')).getTime());

  const totalCalls = clientCalls.length;
  const latestCall = clientCalls[0] || null;
  const daysSinceLastCall = latestCall ? getDaysSince(latestCall.date) : null;
  const constancy = calculateClientConstancy(clientCalls);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
              {client.code}
            </div>
            <div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Perfil do Cliente
              </div>
              <h2 className="text-base font-extrabold text-slate-900 uppercase">
                {client.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {client.farm} • {client.base}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client Contacts & Quick Stats */}
        <div className="p-5 bg-slate-50/40 border-b border-slate-100 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Contato 1 */}
            <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Contato 1 {client.contact1Role ? `• ${client.contact1Role}` : '(Principal)'}
                </span>
                {client.contact1Name && (
                  <span className="text-xs font-bold text-slate-900 block truncate max-w-[150px]">
                    {client.contact1Name}
                  </span>
                )}
                <span className="text-xs font-mono font-bold text-slate-800">
                  {client.contact1}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onCopyPhone(client.contact1, 'Contato 1')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Copiar número"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onOpenWhatsApp(client, client.contact1)}
                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                  title="Chamar no WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contato 2 */}
            <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Contato 2 {client.contact2Role ? `• ${client.contact2Role}` : '(Secundário)'}
                </span>
                {client.contact2Name && (
                  <span className="text-xs font-bold text-slate-900 block truncate max-w-[150px]">
                    {client.contact2Name}
                  </span>
                )}
                <span className="text-xs font-mono font-bold text-slate-800">
                  {client.contact2 || 'Não informado'}
                </span>
              </div>
              {client.contact2 && client.contact2 !== '-' && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onCopyPhone(client.contact2, 'Contato 2')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    title="Copiar número"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenWhatsApp(client, client.contact2)}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                    title="Chamar no WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Contato 3 (se houver) */}
            {client.contact3 && client.contact3 !== '-' ? (
              <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Contato 3 {client.contact3Role ? `• ${client.contact3Role}` : ''}
                  </span>
                  {client.contact3Name && (
                    <span className="text-xs font-bold text-slate-900 block truncate max-w-[150px]">
                      {client.contact3Name}
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {client.contact3}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onCopyPhone(client.contact3!, 'Contato 3')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    title="Copiar número"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenWhatsApp(client, client.contact3!)}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                    title="Chamar no WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Business & Logistics details bar */}
          {(client.businessType || client.poloName || client.paymentTerm || client.paymentMethod || client.source) && (
            <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center gap-4 flex-wrap text-xs">
              {client.source && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Origem</span>
                  <span className="font-extrabold text-blue-700">
                    {client.source === 'mapa' ? 'Arquivo 1: Mapa' : client.source === 'geradores' ? 'Arquivo 2: Geradores' : 'Manual'}
                  </span>
                </div>
              )}
              {client.businessType && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Tipo de Negócio</span>
                  <span className="font-semibold text-slate-800">{client.businessType}</span>
                </div>
              )}
              {client.poloName && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Polo / Nº</span>
                  <span className="font-semibold text-slate-800">
                    {client.poloName} {client.poloNumber ? `(#${client.poloNumber})` : ''}
                  </span>
                </div>
              )}
              {client.paymentTerm && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Prazo</span>
                  <span className="font-semibold text-slate-800">{client.paymentTerm}</span>
                </div>
              )}
              {client.paymentMethod && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Forma Pagamento</span>
                  <span className="font-semibold text-slate-800">{client.paymentMethod}</span>
                </div>
              )}
            </div>
          )}

          {/* Metrics summary cards */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total de Chamadas
              </span>
              <span className="text-lg font-black text-slate-900">
                {totalCalls}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Último Contato
              </span>
              <span className="text-sm font-bold text-slate-800">
                {latestCall ? formatDateBR(latestCall.date) : 'Nenhum'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {daysSinceLastCall !== null ? `(há ${daysSinceLastCall} dias)` : ''}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Média de Constância
              </span>
              <span className="text-lg font-black text-blue-600">
                {constancy !== null ? `${constancy} dias` : totalCalls === 1 ? '1 chamada' : '-'}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Frequência de envio
              </span>
            </div>
          </div>
        </div>

        {/* Calls History List */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Histórico de Chamadas ({totalCalls})</span>
            </h4>

            <button
              onClick={() => onOpenNewCall(client)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Chamada</span>
            </button>
          </div>

          {clientCalls.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                Nenhuma chamada registrada para este cliente ainda.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Marque no calendário ou clique em "Registrar Chamada" para adicionar.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {clientCalls.map((call) => (
                <div
                  key={call.id}
                  className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{formatDateBR(call.date)}</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            às {call.time || '10:00'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <User className="w-3 h-3 text-blue-600" />
                          <span>
                            Chamado por: <strong className="text-slate-800">{call.operatorName}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase tracking-wide">
                      Realizada
                    </span>
                  </div>

                  {call.notes && (
                    <div className="mt-2 text-xs bg-slate-50 rounded-lg p-2 text-slate-700 border border-slate-100 flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="italic">{call.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Cadastrado em {formatDateBR(client.createdAt)}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
