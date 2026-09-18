import React, { useState, useEffect } from 'react';
import { X, Check, Building2, User, Phone, MapPin, FileText } from 'lucide-react';
import { Client } from '../types';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveClient: (clientData: Omit<Client, 'id' | 'createdAt'>, clientIdToEdit?: string) => void;
  clientToEdit?: Client | null;
  suggestedCode: string;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onSaveClient,
  clientToEdit,
  suggestedCode,
}) => {
  const [code, setCode] = useState(suggestedCode);
  const [name, setName] = useState('');
  const [farm, setFarm] = useState('');
  const [base, setBase] = useState('');
  const [contact1, setContact1] = useState('');
  const [contact2, setContact2] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (clientToEdit) {
      setCode(clientToEdit.code);
      setName(clientToEdit.name);
      setFarm(clientToEdit.farm);
      setBase(clientToEdit.base);
      setContact1(clientToEdit.contact1);
      setContact2(clientToEdit.contact2 || '');
      setNotes(clientToEdit.notes || '');
    } else {
      setCode(suggestedCode);
      setName('');
      setFarm('');
      setBase('Teresina - PI');
      setContact1('');
      setContact2('');
      setNotes('');
    }
  }, [clientToEdit, suggestedCode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact1.trim()) {
      alert('Por favor, informe pelo menos o Nome do Cliente e o Contato 1.');
      return;
    }

    onSaveClient(
      {
        code: code.trim() || suggestedCode,
        name: name.trim().toUpperCase(),
        farm: farm.trim() || 'Fazenda Principal',
        base: base.trim() || 'Geral',
        contact1: contact1.trim(),
        contact2: contact2.trim() || '-',
        notes: notes.trim(),
      },
      clientToEdit ? clientToEdit.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase">
              {clientToEdit ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
            </h3>
            <p className="text-xs text-slate-500">
              Preencha os dados cadastrais e telefones de contato
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cód.
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo do Cliente *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: JOÃO CARLOS DA SILVA"
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs uppercase font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fazenda *
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={farm}
                  onChange={(e) => setFarm(e.target.value)}
                  placeholder="Ex: Fazenda Boa Esperança"
                  required
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base / Cidade - UF
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={base}
                  onChange={(e) => setBase(e.target.value)}
                  placeholder="Ex: Teresina - PI"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contato 1 (Principal) *
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={contact1}
                  onChange={(e) => setContact1(e.target.value)}
                  placeholder="Ex: (86) 99812-3456"
                  required
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contato 2 (Secundário)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={contact2}
                  onChange={(e) => setContact2(e.target.value)}
                  placeholder="Ex: (86) 98123-4567"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Preferências
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: Horário preferido após as 15h, caminhões caçamba..."
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{clientToEdit ? 'Atualizar Dados' : 'Cadastrar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
