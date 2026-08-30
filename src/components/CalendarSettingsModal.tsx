import React, { useState } from 'react';
import { Calendar, Save, CheckCircle2, X } from 'lucide-react';
import { AcademicCalendarConfig } from '../types';

interface CalendarSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarConfig: AcademicCalendarConfig;
  onSaveCalendarConfig: (config: AcademicCalendarConfig) => void;
}

export const CalendarSettingsModal: React.FC<CalendarSettingsModalProps> = ({
  isOpen,
  onClose,
  calendarConfig,
  onSaveCalendarConfig,
}) => {
  const [config, setConfig] = useState<AcademicCalendarConfig>(calendarConfig);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCalendarConfig(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Calendario Escolar Oficial (3 Trimestres)
              </h3>
              <p className="text-xs text-slate-400">
                Ajusta las fechas de inicio, cierre y recesos lectivos MEDUCA.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Año Lectivo Escolar:</label>
            <input
              type="number"
              value={config.schoolYear}
              onChange={(e) => setConfig({ ...config, schoolYear: parseInt(e.target.value) || 2026 })}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* 3 Trimesters Box */}
          <div className="space-y-3">
            {config.trimesters.map((t, idx) => (
              <div key={t.number} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="font-bold text-xs text-blue-400 flex items-center justify-between">
                  <span>Trimestre {t.number}: {t.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Ponderación Oficial</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Fecha Inicio:</label>
                    <input
                      type="date"
                      value={t.startDate}
                      onChange={(e) => {
                        const copy = [...config.trimesters];
                        copy[idx] = { ...copy[idx], startDate: e.target.value };
                        setConfig({ ...config, trimesters: copy });
                      }}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Fecha Cierre:</label>
                    <input
                      type="date"
                      value={t.endDate}
                      onChange={(e) => {
                        const copy = [...config.trimesters];
                        copy[idx] = { ...copy[idx], endDate: e.target.value };
                        setConfig({ ...config, trimesters: copy });
                      }}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Fechas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
