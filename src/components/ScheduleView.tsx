import React, { useState } from 'react';
import {
  Clock,
  Volume2,
  VolumeX,
  Bell,
  Play,
  Sparkles,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SchedulePeriod, ScheduleSlot, CurrentPeriodInfo } from '../types';
import { playSchoolBell, playWarningBell } from '../services/soundEffects';

interface ScheduleViewProps {
  periods: SchedulePeriod[];
  slots: ScheduleSlot[];
  currentPeriodInfo: CurrentPeriodInfo;
  onUpdateSlot: (slot: ScheduleSlot) => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  periods,
  slots,
  currentPeriodInfo,
  onUpdateSlot,
  isSoundEnabled,
  onToggleSound,
}) => {
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);

  // Helper to find slot
  const getSlot = (dayOfWeek: string, periodNumber: number): ScheduleSlot | undefined => {
    return slots.find((s) => s.dayOfWeek === dayOfWeek && s.periodNumber === periodNumber);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    onUpdateSlot(editingSlot);
    setEditingSlot(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Live Bell & Current Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-600/20 text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/30">
              Jornada Escolar Regular • 9 Períodos
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            Horario de Clases & Timbre en Tiempo Real
          </h2>
          <p className="text-xs text-slate-400">
            Seguimiento de períodos lectivos (7:00 AM – 1:40 PM), avisos sonoros de cambio de hora y recesos.
          </p>
        </div>

        {/* Live Audio Bell Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Audio Bell */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isSoundEnabled
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{isSoundEnabled ? 'Timbre Automático Activado' : 'Timbre Silenciado'}</span>
          </button>

          {/* Test Sound Bell Now */}
          <button
            type="button"
            onClick={() => playSchoolBell(0.6)}
            title="Tocar el timbre escolar de 3 tonos ahora"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span>Tocar Timbre</span>
          </button>

          {/* Test 5-min warning chime */}
          <button
            type="button"
            onClick={() => playWarningBell(0.5)}
            title="Tocar sonido de pre-aviso de 5 minutos"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-blue-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>Pre-Aviso 5m</span>
          </button>
        </div>
      </div>

      {/* Live Active Period Alert Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-600/30 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0 shadow-inner">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Estado Actual de la Jornada
            </div>
            {currentPeriodInfo.isSchoolHours && currentPeriodInfo.period ? (
              <div className="text-base font-bold text-white mt-0.5">
                {currentPeriodInfo.period.isRecess ? (
                  <span className="text-emerald-300">
                    {currentPeriodInfo.period.name} ({currentPeriodInfo.period.startTime} – {currentPeriodInfo.period.endTime})
                  </span>
                ) : (
                  <span>
                    Período {currentPeriodInfo.period.periodNumber}: {currentPeriodInfo.period.name} ({currentPeriodInfo.period.startTime} – {currentPeriodInfo.period.endTime})
                  </span>
                )}
              </div>
            ) : (
              <div className="text-sm font-semibold text-slate-300 mt-0.5">
                Fuera del horario lectivo regular (La jornada es de 7:00 AM a 1:40 PM).
              </div>
            )}
          </div>
        </div>

        {currentPeriodInfo.timeRemaining && (
          <div className="bg-slate-950/70 px-4 py-2 rounded-xl border border-slate-700/80 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Tiempo restante</div>
            <div className="text-lg font-black text-amber-300 font-mono">
              {currentPeriodInfo.timeRemaining}
            </div>
          </div>
        )}
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">
              Malla Horaria Semanal – 9 Períodos
            </h3>
            <p className="text-xs text-slate-400">
              Haz clic en cualquier celda para editar la materia, grupo y aula asignada.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            7:00 AM – 1:40 PM
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3 text-center min-w-[130px] border-r border-slate-800">
                  Período / Hora
                </th>
                {DAYS_OF_WEEK.map((d) => (
                  <th key={d.key} className="p-3 text-center min-w-[150px] border-r border-slate-800 last:border-r-0">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {periods.map((period) => {
                const isCurrent =
                  currentPeriodInfo.period?.periodNumber === period.periodNumber;

                if (period.isRecess) {
                  return (
                    <tr
                      key={`recess-${period.periodNumber}`}
                      className="bg-emerald-950/20 hover:bg-emerald-950/30 transition-colors"
                    >
                      <td className="p-2.5 text-center font-bold text-emerald-400 border-r border-slate-800 font-mono">
                        <div className="text-xs">{period.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {period.startTime} - {period.endTime}
                        </div>
                      </td>
                      <td
                        colSpan={5}
                        className="p-2.5 text-center font-extrabold text-xs uppercase tracking-widest text-emerald-300/80 bg-emerald-950/30"
                      >
                        🔔 RECESO GENERAL Y DESCANSO ESCOLAR
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={`period-${period.periodNumber}`}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isCurrent ? 'bg-blue-950/30 ring-1 ring-blue-500/50' : ''
                    }`}
                  >
                    {/* Period Column */}
                    <td className="p-3 text-center border-r border-slate-800 bg-slate-950/60">
                      <div className="font-extrabold text-white text-xs">
                        {period.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {period.startTime} - {period.endTime}
                      </div>
                      {isCurrent && (
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-blue-500 text-[9px] font-black text-white uppercase">
                          En curso
                        </span>
                      )}
                    </td>

                    {/* Day columns */}
                    {DAYS_OF_WEEK.map((d) => {
                      const slot = getSlot(d.key, period.periodNumber);

                      return (
                        <td
                          key={`${d.key}-${period.periodNumber}`}
                          onClick={() => {
                            setEditingSlot(
                              slot || {
                                id: `slot-${d.key}-${period.periodNumber}`,
                                dayOfWeek: d.key as any,
                                periodNumber: period.periodNumber,
                                subject: 'English Language',
                                groupName: '7° A',
                                classroom: 'Aula 12',
                              }
                            );
                          }}
                          className="p-2 text-center border-r border-slate-800 last:border-r-0 hover:bg-blue-600/10 cursor-pointer transition-colors"
                        >
                          {slot && slot.subject ? (
                            <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700/80 hover:border-blue-500/50 space-y-1 transition-all">
                              <div className="font-extrabold text-white text-xs">
                                {slot.groupName || 'Grupo'}
                              </div>
                              <div className="text-[11px] font-medium text-blue-300 truncate">
                                {slot.subject}
                              </div>
                              {slot.classroom && (
                                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                                  <MapPin className="w-2.5 h-2.5 text-slate-500" />
                                  <span>{slot.classroom}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-2 rounded-xl border border-dashed border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700 text-[11px]">
                              + Asignar
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                Editar Bloque de Clase
              </h3>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Materia / Asignatura:
                </label>
                <input
                  type="text"
                  required
                  value={editingSlot.subject}
                  onChange={(e) =>
                    setEditingSlot({ ...editingSlot, subject: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Grupo / Grado:
                </label>
                <input
                  type="text"
                  required
                  value={editingSlot.groupName}
                  onChange={(e) =>
                    setEditingSlot({ ...editingSlot, groupName: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Aula / Laboratorio:
                </label>
                <input
                  type="text"
                  value={editingSlot.classroom || ''}
                  onChange={(e) =>
                    setEditingSlot({ ...editingSlot, classroom: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  Guardar Horario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
