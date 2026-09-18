import React, { useState } from 'react';
import {
  X,
  Check,
  Trash2,
  Clock,
  UserCheck,
  FileText,
  Phone,
  MessageSquare,
  Lock,
  Calendar,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Client, CallRecord, Operator } from '../types';
import { formatDateBR } from '../utils/dateUtils';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  dateStr: string;
  existingCall: CallRecord | null;
  unmarkCount: number;
  onSaveCall: (callData: { notes?: string }) => void;
  onDeleteCall: (callId: string, clientId: string, dateStr: string) => void;
  activeOperator: Operator;
  onCopyPhone: (phone: string, label: string) => void;
  onOpenWhatsApp: (client: Client, phone: string) => void;
  onViewProfile?: (client: Client) => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  client,
  dateStr,
  existingCall,
  unmarkCount,
  onSaveCall,
  onDeleteCall,
  activeOperator,
  onCopyPhone,
  onOpenWhatsApp,
  onViewProfile,
}) => {
  if (!isOpen || !client) return null;

  const nowTime = new Date().toTimeString().substring(0, 5);
  const recordedTime = existingCall?.time || nowTime;
  const recordedOperatorName = existingCall?.operatorName || activeOperator?.name || 'Operador';
  const [notes, setNotes] = useState<string>(existingCall?.notes || '');
  const [showConfirmUnmark, setShowConfirmUnmark] = useState(false);

  const isViewOnly = activeOperator?.permissionMode === 'view_only';
  const canUnmark = !isViewOnly && existingCall && unmarkCount === 0;
  const isUnmarkBlocked = !isViewOnly && existingCall && unmarkCount >= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) {
      alert('Modo Somente Visualização: seu usuário não possui permissão para editar.');
      return;
    }
    onSaveCall({
      notes,
    });
    onClose();
  };

  const handleExecuteUnmark = () => {
    if (!existingCall || isViewOnly) return;
    onDeleteCall(existingCall.id, client.id, dateStr);
    setShowConfirmUnmark(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="text-[11px] font-extrabold tracking-wider text-blue-600 uppercase">
              {existingCall ? 'Detalhes da Chamada' : 'Confirmar Chamada'}
            </div>
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {client.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client quick info */}
        <div className="px-4 py-3 bg-blue-50/50 border-b border-blue-100/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Fazenda: </span>
            <span className="font-semibold text-slate-800">{client.farm}</span>
            <span className="text-slate-400 mx-1">•</span>
            <span className="text-slate-600">{client.base}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onCopyPhone(client.contact1, 'Contato 1')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-mono text-[11px] cursor-pointer shadow-2xs"
              title="Copiar Contato 1"
            >
              <Phone className="w-3 h-3 text-emerald-600" />
              <span>{client.contact1}</span>
            </button>

            <button
              onClick={() => onOpenWhatsApp(client, client.contact1)}
              className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs"
              title="Abrir WhatsApp com mensagem pronta"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Data e Hora - Imutáveis / Bloqueados conforme solicitado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Data Marcada</span>
              </label>
              <div
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between select-none"
                title="Data bloqueada para edição"
              >
                <span>{formatDateBR(dateStr)}</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Horário da Ligação</span>
              </label>
              <div
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 flex items-center justify-between select-none"
                title="Horário registrado no momento do clique"
              >
                <span>{recordedTime}</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Operador Auditado - Imutável conforme solicitado */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Operador / Quem Chamou</span>
            </label>
            <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  {recordedOperatorName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {recordedOperatorName}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {existingCall
                      ? 'Operador registrado no momento da marcação'
                      : 'Será registrado pelo operador ativo atual'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-200/80 text-slate-600 text-[10px] font-bold shrink-0">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Fixo</span>
              </div>
            </div>
          </div>

          {/* Observações da Chamada */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Observações da Chamada (Opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ex: Alinhado carregamento de 2 carretas, retorno agendado..."
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Alerta de Desmarcação Única */}
          {isUnmarkBlocked && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <span className="font-bold">Limite de desmarcação atingido:</span> Este check já foi retirado 1 vez anteriormente. Conforme a regra do sistema, não é mais possível desmarcar.
              </div>
            </div>
          )}

          {/* Link para Perfil Completo */}
          {onViewProfile && (
            <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewProfile(client);
                }}
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Ver histórico completo do cliente</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
            {existingCall ? (
              canUnmark ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmUnmark(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Permitido desmarcar apenas 1 vez em caso de marcação errada"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Desmarcar Check</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-xl cursor-not-allowed opacity-75"
                  title="Limite de 1 desmarcação já utilizado para esta data"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Desmarcado (1/1)</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{existingCall ? 'Salvar Alterações' : 'Confirmar Chamada'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Caixa de Diálogo de Confirmação para Desmarcar Check */}
      {showConfirmUnmark && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowConfirmUnmark(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Desmarcar Chamada?
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {formatDateBR(dateStr)} • {client?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmUnmark(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Permitido desmarcar apenas <strong>1 vez</strong> para correção de erro. Deseja realmente remover este check?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmUnmark(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Não, Manter
              </button>
              <button
                type="button"
                onClick={handleExecuteUnmark}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Desmarcar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
