import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { WeeklyPlanner, Group } from '../types';
import { exportWeeklyPlannerToHTML } from '../utils/exportUtils';
import { generateNewWeeklyPlanner } from '../utils/plannerUtils';

interface WeeklyPlannerViewProps {
  group: Group;
  trimester: number;
  weeklyPlanners: WeeklyPlanner[];
  onSaveWeeklyPlanner: (planner: WeeklyPlanner) => void;
  teacherInfo: {
    name: string;
    email: string;
    school: string;
    region: string;
  };
}

export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  group,
  trimester,
  weeklyPlanners = [],
  onSaveWeeklyPlanner,
  teacherInfo,
}) => {
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(1);

  const safePlanners = Array.isArray(weeklyPlanners) ? weeklyPlanners : [];

  // Find or generate plan for selected week
  const activePlanner =
    safePlanners.find(
      (w) => w.groupId === group.id && w.trimester === trimester && w.weekNumber === selectedWeekNumber
    ) ||
    safePlanners.find((w) => w.groupId === group.id && w.trimester === trimester) ||
    generateNewWeeklyPlanner(group.id, trimester, selectedWeekNumber);

  const [currentPlan, setCurrentPlan] = useState<WeeklyPlanner>(activePlanner);

  React.useEffect(() => {
    if (activePlanner) {
      setCurrentPlan(activePlanner);
    }
  }, [activePlanner]);

  const handlePrint = () => {
    exportWeeklyPlannerToHTML(teacherInfo as any, group, currentPlan);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveWeeklyPlanner(currentPlan);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-600/20 text-blue-400 font-bold text-xs uppercase tracking-wider border border-blue-500/30">
              MEDUCA • Plan Semanal de Clases
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            Planeamiento Didáctico Semanal
          </h2>
          <p className="text-xs text-slate-400">
            Registro de actividades de inicio, desarrollo y cierre con criterios de evaluación.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Week Selector Tabs */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((wk) => (
              <button
                key={wk}
                type="button"
                onClick={() => setSelectedWeekNumber(wk)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedWeekNumber === wk
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                S{wk}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePrint}
            title="Imprimir formato oficial semanal"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-blue-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Main Weekly Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Título del Tema:</label>
              <input
                type="text"
                value={currentPlan.topic}
                onChange={(e) => setCurrentPlan({ ...currentPlan, topic: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Rango de Fechas:</label>
              <input
                type="text"
                value={currentPlan.datesRange}
                onChange={(e) => setCurrentPlan({ ...currentPlan, datesRange: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Área / Asignatura:</label>
              <input
                type="text"
                value={currentPlan.area}
                onChange={(e) => setCurrentPlan({ ...currentPlan, area: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Horas Semanales:</label>
              <input
                type="number"
                value={currentPlan.weeklyHours}
                onChange={(e) =>
                  setCurrentPlan({ ...currentPlan, weeklyHours: parseInt(e.target.value) || 5 })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Competencias Fundamentales:</label>
              <textarea
                rows={3}
                value={currentPlan.fundamentalCompetencies}
                onChange={(e) =>
                  setCurrentPlan({ ...currentPlan, fundamentalCompetencies: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Logros de Aprendizaje (Learning Outcomes):</label>
              <textarea
                rows={3}
                value={currentPlan.learningAchievements}
                onChange={(e) =>
                  setCurrentPlan({ ...currentPlan, learningAchievements: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Classroom Activities (Inicio, Desarrollo, Cierre) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-base font-black text-white">
            Secuencia Metodológica de Actividades
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-400 mb-1">
                1. Actividades de Inicio (Warm-up / Engagement):
              </label>
              <textarea
                rows={4}
                value={currentPlan.learningActivities.start}
                onChange={(e) =>
                  setCurrentPlan({
                    ...currentPlan,
                    learningActivities: { ...currentPlan.learningActivities, start: e.target.value },
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-400 mb-1">
                2. Actividades de Desarrollo (Modeling / Practice):
              </label>
              <textarea
                rows={4}
                value={currentPlan.learningActivities.development}
                onChange={(e) =>
                  setCurrentPlan({
                    ...currentPlan,
                    learningActivities: { ...currentPlan.learningActivities, development: e.target.value },
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-400 mb-1">
                3. Actividades de Cierre (Wrap-up / Assessment):
              </label>
              <textarea
                rows={4}
                value={currentPlan.learningActivities.closure}
                onChange={(e) =>
                  setCurrentPlan({
                    ...currentPlan,
                    learningActivities: { ...currentPlan.learningActivities, closure: e.target.value },
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Evaluation & Resources */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Evidencias e Instrumentos de Evaluación:
              </label>
              <textarea
                rows={3}
                value={currentPlan.evaluationCriteria}
                onChange={(e) =>
                  setCurrentPlan({ ...currentPlan, evaluationCriteria: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Recursos y Materiales Didácticos:
              </label>
              <textarea
                rows={3}
                value={currentPlan.didacticResources}
                onChange={(e) =>
                  setCurrentPlan({ ...currentPlan, didacticResources: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Plan Semanal</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
