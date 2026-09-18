import React from 'react';
import {
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Users,
  MapPin,
  Building2,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Client, ClientSource } from '../types';

interface CsvPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  source: ClientSource;
  fileName: string;
  parsedClients: Client[];
  detectedRegionais: string[];
  detectedTerritories: { name: string; code?: string; regional?: string }[];
  currentCountInSystem: number;
}

export const CsvPreviewModal: React.FC<CsvPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  source,
  fileName,
  parsedClients,
  detectedRegionais,
  detectedTerritories,
  currentCountInSystem,
}) => {
  if (!isOpen) return null;

  const fileLabel = source === 'mapa' ? 'Arquivo 1: Mapa' : 'Arquivo 2: Geradores';
  const previewRows = parsedClients.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-600 text-white">
                  {fileLabel}
                </span>
                <span className="text-xs text-slate-500 font-mono truncate max-w-xs">
                  {fileName}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                Confirmar Importação e Substituição de Clientes
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Replacement Warning Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900">Regra de Substituição Ativa</h4>
              <p className="text-amber-800 leading-relaxed">
                Ao confirmar, todos os{' '}
                <strong>{currentCountInSystem} clientes anteriores do {fileLabel}</strong> serão
                substituídos pelos <strong>{parsedClients.length} novos clientes</strong> deste
                arquivo. Os clientes do outro arquivo continuarão intactos na base unificada.
              </p>
            </div>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Total a Importar
              </span>
              <span className="text-base font-black text-blue-700">
                {parsedClients.length} clientes
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Regionais Identificadas
              </span>
              <span className="text-sm font-bold text-slate-800">
                {detectedRegionais.length > 0 ? detectedRegionais.join(', ') : 'Geral'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Territórios Detectados
              </span>
              <span className="text-sm font-bold text-slate-800">
                {detectedTerritories.length} territórios
              </span>
            </div>
          </div>

          {/* Table Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-extrabold uppercase text-[11px] text-slate-700 tracking-wide">
                Prévia dos Primeiros Registros (5 de {parsedClients.length}):
              </h4>
              <span className="text-[10px] text-slate-500">
                Acentos e formatações corrigidos automaticamente
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                    <th className="px-2.5 py-2">Cód.</th>
                    <th className="px-2.5 py-2">Nome do Cliente</th>
                    <th className="px-2.5 py-2">Fazenda</th>
                    <th className="px-2.5 py-2">Território</th>
                    <th className="px-2.5 py-2">Regional</th>
                    <th className="px-2.5 py-2">Contato 1</th>
                    <th className="px-2.5 py-2">Contato 2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewRows.map((cli, idx) => (
                    <tr key={`preview-${cli.id || 'cli'}-${idx}`} className="hover:bg-slate-50">
                      <td className="px-2.5 py-1.5 font-mono font-bold text-slate-500">
                        {cli.code}
                      </td>
                      <td className="px-2.5 py-1.5 font-bold text-slate-900 truncate max-w-[200px]">
                        {cli.name}
                      </td>
                      <td className="px-2.5 py-1.5 text-slate-700 truncate max-w-[150px]">
                        {cli.farm}
                      </td>
                      <td className="px-2.5 py-1.5 text-slate-600 truncate max-w-[130px]">
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                          {cli.territory || '-'}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 text-slate-600">
                        {cli.regional || '-'}
                      </td>
                      <td className="px-2.5 py-1.5 font-mono text-slate-700">
                        <div>{cli.contact1}</div>
                        {cli.contact1Name && (
                          <div className="text-[9px] text-slate-400 truncate">
                            {cli.contact1Name} ({cli.contact1Role || 'Contato'})
                          </div>
                        )}
                      </td>
                      <td className="px-2.5 py-1.5 font-mono text-slate-600">
                        <div>{cli.contact2 || '-'}</div>
                        {cli.contact2Name && (
                          <div className="text-[9px] text-slate-400 truncate">
                            {cli.contact2Name}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar e Substituir {fileLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
