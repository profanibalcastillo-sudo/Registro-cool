import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  Printer,
  FileDown,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Brain,
  Clock,
  Award,
  FileText,
  FolderPlus,
} from 'lucide-react';
import { ThemePlanner, Group } from '../types';
import { exportThemePlannerToHTML } from '../utils/exportUtils';
import { createNewThemePlanner } from '../utils/plannerUtils';

interface ThemePlannerViewProps {
  group: Group;
  trimester: number;
  themePlanners: ThemePlanner[];
  onSaveThemePlanner: (planner: ThemePlanner) => void;
  onOpenAiPlanner?: () => void;
  teacherInfo: {
    name: string;
    email: string;
    school: string;
    region: string;
  };
}

export const ThemePlannerView: React.FC<ThemePlannerViewProps> = ({
  group,
  trimester,
  themePlanners = [],
  onSaveThemePlanner,
  onOpenAiPlanner,
  teacherInfo,
}) => {
  const safePlanners = Array.isArray(themePlanners) ? themePlanners : [];

  // Find or create planner for current group & trimester
  const activePlanner =
    safePlanners.find(
      (p) => p.groupId === group.id && p.trimester === trimester
    ) ||
    safePlanners[0] ||
    createNewThemePlanner(group.id, trimester, 1, 'First, I Cut the Paper.', 'Following Instructions at School (S1)', 'A1.3', '7mo Grado');

  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(
    activePlanner.lessons?.[0]?.id || null
  );
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editablePlanner, setEditablePlanner] = useState<ThemePlanner>(activePlanner);

  // Sync if activePlanner changes
  React.useEffect(() => {
    if (activePlanner) {
      setEditablePlanner(activePlanner);
    }
  }, [activePlanner]);

  const handlePrint = () => {
    exportThemePlannerToHTML(teacherInfo as any, group, editablePlanner);
  };

  const handleSaveAll = () => {
    onSaveThemePlanner(editablePlanner);
    setIsEditingHeader(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-600/20 text-purple-400 font-bold text-xs uppercase tracking-wider border border-purple-500/30">
              MEDUCA • Programa Oficial de Inglés
            </span>
            <span className="text-xs text-slate-400">
              Marco Común Europeo (MCER {editablePlanner.cefrLevel || 'A1.3'})
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            Planificación Didáctica por Temas & Competencias
          </h2>
          <p className="text-xs text-slate-400">
            5 Competencias Fundamentales: Listening, Reading, Speaking, Writing y Mediation con neuroeducación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenAiPlanner && (
            <button
              type="button"
              onClick={onOpenAiPlanner}
              title="Generar planeamiento curricular completo con IA Gemini"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/30 animate-pulse"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generar con IA MEDUCA</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            title="Imprimir o exportar a PDF oficial"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-purple-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Plan MEDUCA</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const newPlan = createNewThemePlanner(
                group.id,
                trimester,
                (themePlanners.length || 1) + 1,
                'Our Environment & Nature',
                'Natural Habitats and Climate',
                'A1.3',
                '7mo Grado'
              );
              onSaveThemePlanner(newPlan);
              setEditablePlanner(newPlan);
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Tema</span>
          </button>
        </div>
      </div>

      {/* Theme Meta Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-black">
              T{editablePlanner.themeNumber}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase">
                {editablePlanner.scenario} • {editablePlanner.weeksRange}
              </div>
              <h3 className="text-lg font-black text-white">
                {editablePlanner.themeTitle}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingHeader(!isEditingHeader)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
          >
            {isEditingHeader ? 'Guardar Cambios' : 'Editar Datos Generales'}
          </button>
        </div>

        {/* Editable Form or Read-only Display */}
        {isEditingHeader ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Título del Tema:</label>
              <input
                type="text"
                value={editablePlanner.themeTitle}
                onChange={(e) =>
                  setEditablePlanner({ ...editablePlanner, themeTitle: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Escenario Contextual:</label>
              <input
                type="text"
                value={editablePlanner.scenario}
                onChange={(e) =>
                  setEditablePlanner({ ...editablePlanner, scenario: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Rango de Semanas:</label>
              <input
                type="text"
                value={editablePlanner.weeksRange}
                onChange={(e) =>
                  setEditablePlanner({ ...editablePlanner, weeksRange: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-300 mb-1">Proyecto de Unidad:</label>
              <input
                type="text"
                value={editablePlanner.unitProject.title}
                onChange={(e) =>
                  setEditablePlanner({
                    ...editablePlanner,
                    unitProject: { ...editablePlanner.unitProject, title: e.target.value },
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-purple-400 font-bold uppercase text-[10px]">Gramática Clave</div>
              <p className="text-slate-200">{editablePlanner.competences.linguistic.grammar}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-amber-400 font-bold uppercase text-[10px]">Vocabulario Meta</div>
              <p className="text-slate-200">{editablePlanner.competences.linguistic.vocabulary}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-emerald-400 font-bold uppercase text-[10px]">Proyecto Final</div>
              <p className="text-slate-200 font-semibold">{editablePlanner.unitProject.title}</p>
            </div>
          </div>
        )}
      </div>

      {/* 5 Core Competency Standards Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-base font-black text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-400" />
          5 Competencias Fundamentales MEDUCA
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {editablePlanner.standardsAndOutcomes.map((std, idx) => (
            <div
              key={std.skill}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-white uppercase tracking-wider text-purple-300">
                  {std.skillName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  Comp. {idx + 1}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                <strong className="text-slate-400">Estándar: </strong>
                {std.specificCurriculumStandard}
              </p>
              <p className="text-[11px] text-purple-200/90 font-medium">
                <strong className="text-slate-400">Logro Esperado: </strong>
                {std.expectedLearningOutcome}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 6-Stage Lessons with Neuroscience Insights */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Secuencia Didáctica en 6 Etapas con Neuroeducación
            </h3>
            <p className="text-xs text-slate-400">
              Warm-up, Presentation, Preparation, Performance, Assessment, Reflection.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {editablePlanner.lessons.map((lesson) => {
            const isExpanded = expandedLessonId === lesson.id;

            return (
              <div
                key={lesson.id}
                className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60"
              >
                {/* Lesson Header Accordion */}
                <div
                  onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-300 flex items-center justify-center font-bold text-xs border border-purple-500/30">
                      L{lesson.lessonNumber}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-purple-400 uppercase">
                        {lesson.skillTitle}
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {lesson.specificObjective}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                      {lesson.totalTimeMinutes} min
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Lesson Body: 6 Stages */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-800 bg-slate-900/60 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                        <strong className="text-slate-400">Evaluación Formativa: </strong>
                        <span className="text-slate-200">{lesson.formativeAssessmentStrategy}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                        <strong className="text-slate-400">Tarea / Refuerzo: </strong>
                        <span className="text-slate-200">{lesson.reinforcementHomework}</span>
                      </div>
                    </div>

                    {/* 6 Stages Cards */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Desarrollo de las 6 Etapas de Clase:
                      </div>
                      {lesson.stages.map((stg) => (
                        <div
                          key={stg.stageNumber}
                          className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-purple-300">
                              Etapa {stg.stageNumber}: {stg.shortName}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {stg.durationMinutes} min
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{stg.description}</p>
                          {stg.neuroscienceInsight && (
                            <div className="p-2 rounded bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-200 flex items-start gap-1.5">
                              <Brain className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-purple-300">
                                  {stg.neuroscienceInsight.title}:{' '}
                                </strong>
                                {stg.neuroscienceInsight.description}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
