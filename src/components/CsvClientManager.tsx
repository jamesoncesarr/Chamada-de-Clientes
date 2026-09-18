import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  FileText,
  Info,
  Layers,
  Clock,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Client, ClientSource, CsvUploadMeta } from '../types';
import { parseClientCsv, generateSampleCsv, ParseCsvResult } from '../utils/csvClientParser';
import { CsvPreviewModal } from './CsvPreviewModal';

interface CsvClientManagerProps {
  clients: Client[];
  mapaUploadMeta: CsvUploadMeta | null;
  geradoresUploadMeta: CsvUploadMeta | null;
  onImportCsvClients: (
    source: ClientSource,
    newClients: Client[],
    meta: CsvUploadMeta,
    detectedRegionais: string[],
    detectedTerritories: { name: string; code?: string; regional?: string }[]
  ) => void;
  onClearSourceClients: (source: ClientSource) => void;
}

export const CsvClientManager: React.FC<CsvClientManagerProps> = ({
  clients,
  mapaUploadMeta,
  geradoresUploadMeta,
  onImportCsvClients,
  onClearSourceClients,
}) => {
  const [activeUploadSource, setActiveUploadSource] = useState<'mapa' | 'geradores' | null>(null);
  const [pendingParseResult, setPendingParseResult] = useState<ParseCsvResult | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [clearSourceConfirm, setClearSourceConfirm] = useState<ClientSource | null>(null);

  const mapaInputRef = useRef<HTMLInputElement>(null);
  const geradoresInputRef = useRef<HTMLInputElement>(null);

  // Counts by source
  const mapaCount = clients.filter((c) => c.source === 'mapa').length;
  const geradoresCount = clients.filter((c) => c.source === 'geradores').length;
  const manualCount = clients.filter((c) => c.source !== 'mapa' && c.source !== 'geradores').length;

  const handleFileSelect = (source: 'mapa' | 'geradores', file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      alert('Por favor, selecione um arquivo em formato CSV (.csv).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = parseClientCsv(content, source);

      if (!result.success) {
        alert(`Erro ao processar CSV: ${result.error || 'Verifique o formato das colunas.'}`);
        return;
      }

      if (result.clients.length === 0) {
        alert('Nenhum registro de cliente válido foi identificado no arquivo CSV.');
        return;
      }

      setActiveUploadSource(source);
      setPendingParseResult(result);
      setPendingFileName(file.name);
      setIsPreviewOpen(true);
    };

    reader.onerror = () => {
      alert('Falha ao ler o arquivo selecionado.');
    };

    // Read as UTF-8 (mojibake corrector handles non-UTF8 gracefully)
    reader.readAsText(file, 'utf-8');
  };

  const handleConfirmImport = () => {
    if (!activeUploadSource || !pendingParseResult) return;

    const meta: CsvUploadMeta = {
      source: activeUploadSource,
      fileName: pendingFileName,
      uploadedAt: new Date().toISOString(),
      totalRecords: pendingParseResult.clients.length,
    };

    onImportCsvClients(
      activeUploadSource,
      pendingParseResult.clients,
      meta,
      pendingParseResult.detectedRegionais,
      pendingParseResult.detectedTerritories
    );

    setIsPreviewOpen(false);
    setPendingParseResult(null);
    setActiveUploadSource(null);
  };

  const handleDownloadTemplate = (source: 'mapa' | 'geradores') => {
    const csvContent = generateSampleCsv(source);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      source === 'mapa' ? 'modelo_clientes_mapa.csv' : 'modelo_clientes_geradores.csv'
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDateTimeBR = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={mapaInputRef}
        accept=".csv,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect('mapa', file);
          e.target.value = '';
        }}
      />

      <input
        type="file"
        ref={geradoresInputRef}
        accept=".csv,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect('geradores', file);
          e.target.value = '';
        }}
      />

      {/* Unified Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Base Unificada de Clientes
                </h3>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                  {clients.length} Clientes Ativos
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                O sistema consolida automaticamente os clientes de <strong>ambos os arquivos</strong>{' '}
                em uma lista única para chamadas, pastas de territórios e relatórios. Ao subir um novo
                arquivo, ele <strong>substitui apenas os clientes daquele mesmo arquivo</strong>,
                mantendo os outros preservados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-blue-200 text-slate-700 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Arquivo 1 (Mapa)</span>
              <span className="font-black text-blue-900">{mapaCount} clientes</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-indigo-200 text-slate-700 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Arquivo 2 (Geradores)</span>
              <span className="font-black text-indigo-900">{geradoresCount} clientes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Upload Cards Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Arquivo 1 - Mapa */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-blue-700 uppercase tracking-wide">
                      Arquivo 1
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">• Mapa</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Tabela de clientes do agronegócio e rotas mapeadas
                  </p>
                </div>
              </div>

              {mapaCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  Carregado ({mapaCount})
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  Não enviado
                </span>
              )}
            </div>

            {/* Status & Meta */}
            {mapaUploadMeta ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-4 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Arquivo atual:</span>
                  <span className="font-mono font-bold text-slate-800 truncate max-w-[200px]">
                    {mapaUploadMeta.fileName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Último envio:</span>
                  <span className="flex items-center gap-1 text-slate-700">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatDateTimeBR(mapaUploadMeta.uploadedAt)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 mb-4 text-xs text-slate-500">
                Ainda não há envio do Arquivo 1 (Mapa). Faça o upload do arquivo CSV para alimentar a base.
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => mapaInputRef.current?.click()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{mapaCount > 0 ? 'Substituir CSV Mapa' : 'Subir CSV Mapa'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadTemplate('mapa')}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Baixar planilha modelo com as colunas oficiais"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Modelo</span>
              </button>

              {mapaCount > 0 && (
                <button
                  type="button"
                  onClick={() => setClearSourceConfirm('mapa')}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Limpar apenas clientes do Mapa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Substitui os clientes antigos do Mapa mantendo o Arquivo Geradores intacto.
            </p>
          </div>
        </div>

        {/* Card 2: Arquivo 2 - Geradores */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wide">
                      Arquivo 2
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">• Geradores</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Tabela de clientes geradores e polos de atendimento
                  </p>
                </div>
              </div>

              {geradoresCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  Carregado ({geradoresCount})
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  Não enviado
                </span>
              )}
            </div>

            {/* Status & Meta */}
            {geradoresUploadMeta ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-4 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Arquivo atual:</span>
                  <span className="font-mono font-bold text-slate-800 truncate max-w-[200px]">
                    {geradoresUploadMeta.fileName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Último envio:</span>
                  <span className="flex items-center gap-1 text-slate-700">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatDateTimeBR(geradoresUploadMeta.uploadedAt)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 mb-4 text-xs text-slate-500">
                Ainda não há envio do Arquivo 2 (Geradores). Faça o upload do arquivo CSV para alimentar a base.
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => geradoresInputRef.current?.click()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{geradoresCount > 0 ? 'Substituir CSV Geradores' : 'Subir CSV Geradores'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadTemplate('geradores')}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Baixar planilha modelo com as colunas oficiais"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Modelo</span>
              </button>

              {geradoresCount > 0 && (
                <button
                  type="button"
                  onClick={() => setClearSourceConfirm('geradores')}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Limpar apenas clientes de Geradores"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Substitui os clientes antigos de Geradores mantendo o Arquivo Mapa intacto.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação para Limpar Fonte de Dados CSV */}
      {clearSourceConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setClearSourceConfirm(null)}
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
                    Limpar Clientes{' '}
                    {clearSourceConfirm === 'mapa' ? 'do Arquivo 1 (Mapa)' : 'do Arquivo 2 (Geradores)'}?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Remoção de registros importados
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClearSourceConfirm(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Deseja realmente limpar todos os clientes cadastrados provenientes do{' '}
              <strong>
                {clearSourceConfirm === 'mapa'
                  ? `Arquivo 1 (Mapa - ${mapaCount} clientes)`
                  : `Arquivo 2 (Geradores - ${geradoresCount} clientes)`}
              </strong>
              ? O outro arquivo e cadastros manuais serão mantidos.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClearSourceConfirm(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Não, Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearSourceClients(clearSourceConfirm);
                  setClearSourceConfirm(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Limpar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Preview Modal */}
      {isPreviewOpen && pendingParseResult && activeUploadSource && (
        <CsvPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPendingParseResult(null);
            setActiveUploadSource(null);
          }}
          onConfirm={handleConfirmImport}
          source={activeUploadSource}
          fileName={pendingFileName}
          parsedClients={pendingParseResult.clients}
          detectedRegionais={pendingParseResult.detectedRegionais}
          detectedTerritories={pendingParseResult.detectedTerritories}
          currentCountInSystem={
            activeUploadSource === 'mapa' ? mapaCount : geradoresCount
          }
        />
      )}
    </div>
  );
};
