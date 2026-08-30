import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  BookOpen,
  CheckCircle2,
  FileText,
  MessageSquare,
  Copy,
  Check,
  Send,
  Loader2,
  AlertCircle,
  Plus,
  Award,
  Layers,
  GraduationCap,
  ChevronRight,
  Info,
  Download,
} from 'lucide-react';
import {
  generateDidacticPlan,
  generateRubric,
  generateStudentFeedback,
  sendChatMessage,
  MeducaPlanResponse,
  MeducaRubricResponse,
  MeducaFeedbackResponse,
} from '../services/geminiService';
import { Group, Student, Grade, EvaluationColumn, ThemePlanner } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups?: Group[];
  group?: Group;
  selectedGroupId?: string;
  selectedTrimester?: number;
  trimester?: number;
  students?: Student[];
  grades?: Record<string, Grade>;
  evaluationColumns?: EvaluationColumn[];
  onInsertThemePlanner?: (plan: Partial<ThemePlanner>) => void;
  onAddEvaluationColumn?: (
    col:
      | {
          title: string;
          category?: 'formative' | 'summative' | 'exam';
          maxScore?: number;
        }
      | string,
    maxScore?: number
  ) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  groups = [],
  group,
  selectedGroupId = '',
  selectedTrimester = 1,
  trimester = 1,
  students = [],
  grades = {},
  evaluationColumns = [],
  onInsertThemePlanner,
  onAddEvaluationColumn,
}) => {
  const effectiveTrimester = selectedTrimester || trimester || 1;
  const currentGroup =
    group ||
    (Array.isArray(groups) && selectedGroupId ? groups.find((g) => g.id === selectedGroupId) : undefined) ||
    (Array.isArray(groups) && groups.length > 0 ? groups[0] : undefined) || {
      id: 'default',
      name: 'Grupo MEDUCA',
      subject: 'Inglés',
      grade: '7mo Grado',
      level: 'secondary',
    };

  const groupStudents = Array.isArray(students)
    ? currentGroup.id && currentGroup.id !== 'default'
      ? students.filter((s) => s.groupId === currentGroup.id)
      : students
    : [];

  const [activeTab, setActiveTab] = useState<'planner' | 'rubric' | 'feedback' | 'chat'>('planner');

  // Copied state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // --- TAB 1: Plan Generator State ---
  const [planSubject, setPlanSubject] = useState(currentGroup?.subject || 'Inglés');
  const [planGrade, setPlanGrade] = useState(currentGroup?.grade || '7mo Grado');
  const [planTopic, setPlanTopic] = useState('Daily Routines & Time Expressions');
  const [planWeeks, setPlanWeeks] = useState<number>(4);
  const [planInstructions, setPlanInstructions] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<MeducaPlanResponse | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [isPlanInserted, setIsPlanInserted] = useState(false);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingPlan(true);
    setPlanError(null);
    setIsPlanInserted(false);

    try {
      const isPrimary = currentGroup?.level === 'primary';
      const result = await generateDidacticPlan({
        subject: planSubject,
        grade: planGrade,
        trimester: effectiveTrimester,
        weeks: planWeeks,
        topic: planTopic,
        levelType: isPrimary ? 'primary' : 'secondary',
        customInstructions: planInstructions,
      });
      setGeneratedPlan(result);
    } catch (err: any) {
      setPlanError(err.message || 'Error al generar el planeamiento.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleInsertPlanToPlanner = () => {
    if (!generatedPlan || !onInsertThemePlanner) return;

    onInsertThemePlanner({
      groupId: currentGroup.id,
      trimester: effectiveTrimester,
      areaName: generatedPlan.area || planSubject,
      subAreaName: generatedPlan.title || planTopic,
      targetHours: planWeeks * 5,
      learningObjective: generatedPlan.objectives.join('\n• '),
      achievementIndicators: generatedPlan.achievementIndicators.join('\n• '),
      conceptualContents: generatedPlan.contents.conceptuales.join('\n• '),
      proceduralContents: generatedPlan.contents.procedimentales.join('\n• '),
      attitudinalContents: generatedPlan.contents.actitudinales.join('\n• '),
      learningActivities: `INICIO:\n${generatedPlan.learningActivities.inicio.join('\n')}\n\nDESARROLLO:\n${generatedPlan.learningActivities.desarrollo.join('\n')}\n\nCIERRE:\n${generatedPlan.learningActivities.cierre.join('\n')}`,
      evaluationEvidences: `DIAGNÓSTICA: ${generatedPlan.evaluation.diagnostica}\nFORMATIVA: ${generatedPlan.evaluation.formativa}\nSUMATIVA: ${generatedPlan.evaluation.sumativa}`,
      didacticResources: generatedPlan.resources.join(', '),
    });

    setIsPlanInserted(true);
  };

  // --- TAB 2: Rubric Generator State ---
  const [rubricTitle, setRubricTitle] = useState('Presentación Oral en Inglés');
  const [rubricCategory, setRubricCategory] = useState<'formative' | 'summative' | 'exam'>('summative');
  const [rubricDetails, setRubricDetails] = useState('');
  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);
  const [generatedRubric, setGeneratedRubric] = useState<MeducaRubricResponse | null>(null);
  const [rubricError, setRubricError] = useState<string | null>(null);
  const [isRubricAddedToGradebook, setIsRubricAddedToGradebook] = useState(false);

  const handleGenerateRubric = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingRubric(true);
    setRubricError(null);
    setIsRubricAddedToGradebook(false);

    try {
      const result = await generateRubric({
        title: rubricTitle,
        subject: currentGroup?.subject || 'Inglés',
        grade: currentGroup?.grade || '7mo Grado',
        evaluationType: rubricCategory,
        criteriaDescription: rubricDetails,
      });
      setGeneratedRubric(result);
    } catch (err: any) {
      setRubricError(err.message || 'Error al generar rúbrica.');
    } finally {
      setIsGeneratingRubric(false);
    }
  };

  const handleAddRubricToGradebook = () => {
    if (!generatedRubric || !onAddEvaluationColumn) return;

    onAddEvaluationColumn({
      title: generatedRubric.rubricTitle || rubricTitle,
      category: rubricCategory,
      maxScore: generatedRubric.maxScore || 5.0,
    });

    setIsRubricAddedToGradebook(true);
  };

  // --- TAB 3: Student Feedback Generator State ---
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    groupStudents[0]?.id || ''
  );
  const [feedbackStrengths, setFeedbackStrengths] = useState('');
  const [feedbackChallenges, setFeedbackChallenges] = useState('');
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [generatedFeedback, setGeneratedFeedback] = useState<MeducaFeedbackResponse | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const targetStudent = groupStudents.find((s) => s.id === selectedStudentId);

  // Compute student grades summary for prompt
  const computeStudentStats = (studentId: string) => {
    const studentCols = evaluationColumns.filter(
      (c) => c.groupId === currentGroup.id && c.trimester === effectiveTrimester
    );
    const scores = studentCols
      .map((c) => {
        const key = `grd-${studentId}-${c.id}`;
        return grades[key]?.score;
      })
      .filter((sc): sc is number => typeof sc === 'number' && sc > 0);

    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 3.5;
    return { avg, count: scores.length };
  };

  const handleGenerateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudent) return;

    setIsGeneratingFeedback(true);
    setFeedbackError(null);

    const { avg } = computeStudentStats(targetStudent.id);

    try {
      const result = await generateStudentFeedback({
        studentName: `${targetStudent.firstName} ${targetStudent.lastName}`,
        subject: currentGroup?.subject || 'Inglés',
        trimester: effectiveTrimester,
        averageGrade: avg,
        formativeAvg: avg,
        summativeAvg: avg,
        examScore: avg,
        attendanceRate: 96,
        absencesCount: 1,
        strengths: feedbackStrengths,
        challenges: feedbackChallenges,
      });
      setGeneratedFeedback(result);
    } catch (err: any) {
      setFeedbackError(err.message || 'Error al generar observaciones.');
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  // --- TAB 4: Copilot Chat State ---
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: `¡Hola colega docente! Soy tu Asistente IA para el Registro Digital MEDUCA Panamá. Puedo ayudarte a elaborar planeamientos, redactar preguntas de exámenes, adaptar actividades según el DUA para estudiantes con NEE, o responder consultas sobre la normativa y escala de evaluación panameña. ¿En qué te apoyo hoy?`,
    },
  ]);
  const [inputChat, setInputChat] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim() || isSendingChat) return;

    const userText = inputChat.trim();
    setInputChat('');
    const newHistory = [...chatMessages, { role: 'user' as const, text: userText }];
    setChatMessages(newHistory);
    setIsSendingChat(true);

    try {
      const reply = await sendChatMessage(
        userText,
        chatMessages,
        {
          subject: currentGroup?.subject,
          groupName: currentGroup?.name,
          trimester: selectedTrimester,
        }
      );
      setChatMessages([...newHistory, { role: 'model', text: reply }]);
    } catch (err: any) {
      setChatMessages([
        ...newHistory,
        {
          role: 'model',
          text: `⚠️ No se pudo conectar con Gemini AI: ${err.message || 'Verifica tu conexión y clave API.'}`,
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Asistente IA Docente MEDUCA
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-bold">
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Grupo: <strong className="text-white">{currentGroup?.name}</strong> • {currentGroup?.subject} • Trimestre {selectedTrimester}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-2 gap-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className={`px-4 py-2.5 rounded-t-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'planner'
                ? 'bg-slate-900 text-blue-400 border-t-2 border-blue-500 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Planeamiento MEDUCA
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rubric')}
            className={`px-4 py-2.5 rounded-t-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rubric'
                ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-500 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            Rúbricas & Evaluaciones
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2.5 rounded-t-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'feedback'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Observaciones de Boletín
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2.5 rounded-t-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-slate-900 text-purple-400 border-t-2 border-purple-500 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            Copiloto Pedagógico
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: PLANEAMIENTO DIDÁCTICO */}
          {activeTab === 'planner' && (
            <div className="space-y-6">
              <div className="bg-blue-950/30 border border-blue-800/40 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-white">Generador Curricular Oficial de MEDUCA</p>
                  <p>
                    Genera planeamientos estructurados por competencias básicas, contenidos (conceptuales, procedimentales, actitudinales), actividades de inicio-desarrollo-cierre e instrumentos de evaluación listos para insertar en el registro digital.
                  </p>
                </div>
              </div>

              <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Asignatura:</label>
                  <input
                    type="text"
                    required
                    value={planSubject}
                    onChange={(e) => setPlanSubject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Nivel / Grado:</label>
                  <input
                    type="text"
                    required
                    value={planGrade}
                    onChange={(e) => setPlanGrade(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Duración (Semanas):</label>
                  <select
                    value={planWeeks}
                    onChange={(e) => setPlanWeeks(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
                  >
                    <option value={1}>1 Semana (Micro-unidad)</option>
                    <option value={2}>2 Semanas</option>
                    <option value={3}>3 Semanas</option>
                    <option value={4}>4 Semanas (1 Mes didáctico)</option>
                    <option value={6}>6 Semanas (Medio Trimestre)</option>
                    <option value={12}>12 Semanas (Trimestre Completo)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Tema Principal / Contenido a Desarrollar:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Simple Present, Daily Routines, Reading Comprehension, Ecosistemas de Panamá..."
                    value={planTopic}
                    onChange={(e) => setPlanTopic(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Instrucciones o Enfoque Específico (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Ej: Incluir dinámicas en parejas, énfasis en vocabulario de profesiones, proyecto final..."
                    value={planInstructions}
                    onChange={(e) => setPlanInstructions(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isGeneratingPlan}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingPlan ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando Planeamiento con Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generar Planeamiento Didáctico</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {planError && (
                <div className="p-4 bg-rose-950/60 border border-rose-700 text-rose-300 text-xs rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{planError}</span>
                </div>
              )}

              {generatedPlan && (
                <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-blue-400 px-2 py-0.5 bg-blue-950 rounded border border-blue-800">
                        {generatedPlan.area}
                      </span>
                      <h3 className="text-lg font-black text-white mt-1">{generatedPlan.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {onInsertThemePlanner && (
                        <button
                          type="button"
                          onClick={handleInsertPlanToPlanner}
                          disabled={isPlanInserted}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            isPlanInserted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                          }`}
                        >
                          {isPlanInserted ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>¡Insertado en Planificador!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Insertar en Planificador de Temas</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopy(JSON.stringify(generatedPlan, null, 2), 'plan-json')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                        title="Copiar contenido"
                      >
                        {copiedKey === 'plan-json' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Objectives & Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">Objetivos de Aprendizaje:</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-200">
                        {generatedPlan.objectives.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Indicadores de Logro:</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-200">
                        {generatedPlan.achievementIndicators.map((ind, i) => (
                          <li key={i}>{ind}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Contents 3 Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <h5 className="font-bold text-blue-300 text-[11px] mb-1">Conceptuales (Saber):</h5>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                        {generatedPlan.contents.conceptuales.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <h5 className="font-bold text-indigo-300 text-[11px] mb-1">Procedimentales (Hacer):</h5>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                        {generatedPlan.contents.procedimentales.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <h5 className="font-bold text-emerald-300 text-[11px] mb-1">Actitudinales (Ser/Convivir):</h5>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                        {generatedPlan.contents.actitudinales.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Learning Activities Sequence */}
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                    <h4 className="font-bold text-purple-300 uppercase tracking-wider text-[11px]">Secuencia Didáctica:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="font-bold text-purple-400 text-[10px] uppercase">1. Inicio (Anticipación):</span>
                        <p className="text-slate-300 text-[11px] mt-1">{generatedPlan.learningActivities.inicio.join('. ')}</p>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="font-bold text-blue-400 text-[10px] uppercase">2. Desarrollo (Construcción):</span>
                        <p className="text-slate-300 text-[11px] mt-1">{generatedPlan.learningActivities.desarrollo.join('. ')}</p>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="font-bold text-emerald-400 text-[10px] uppercase">3. Cierre (Consolidación):</span>
                        <p className="text-slate-300 text-[11px] mt-1">{generatedPlan.learningActivities.cierre.join('. ')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RÚBRICAS & EVALUACIONES */}
          {activeTab === 'rubric' && (
            <div className="space-y-6">
              <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-white">Generador de Rúbricas e Instrumentos de Evaluación (Escala 1.0 a 5.0)</p>
                  <p>
                    Genera rúbricas analíticas con criterios y descriptores según los estándares de evaluación de MEDUCA. Puedes insertar directamente la evaluación como una columna en la libreta.
                  </p>
                </div>
              </div>

              <form onSubmit={handleGenerateRubric} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Nombre de la Evaluación / Tarea:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Diálogo en parejas, Maqueta de células, Examen parcial..."
                    value={rubricTitle}
                    onChange={(e) => setRubricTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Categoría MEDUCA:</label>
                  <select
                    value={rubricCategory}
                    onChange={(e) => setRubricCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
                  >
                    <option value="formative">Apreciación / Formativa (33%)</option>
                    <option value="summative">Parcial / Sumativa (33%)</option>
                    <option value="exam">Examen Trimestral (34%)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Detalles o Criterios Específicos (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Ej: Pronunciación, fluidez, puntualidad, uso de vocabulario, trabajo en equipo..."
                    value={rubricDetails}
                    onChange={(e) => setRubricDetails(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isGeneratingRubric}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingRubric ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando Rúbrica con IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generar Rúbrica Oficial</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {rubricError && (
                <div className="p-4 bg-rose-950/60 border border-rose-700 text-rose-300 text-xs rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{rubricError}</span>
                </div>
              )}

              {generatedRubric && (
                <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-lg font-black text-white">{generatedRubric.rubricTitle}</h3>
                      <p className="text-xs text-slate-400">{generatedRubric.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {onAddEvaluationColumn && (
                        <button
                          type="button"
                          onClick={handleAddRubricToGradebook}
                          disabled={isRubricAddedToGradebook}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            isRubricAddedToGradebook
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                          }`}
                        >
                          {isRubricAddedToGradebook ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>¡Columna Creada en Libreta!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Crear Columna en Libreta</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rubric Criteria Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 text-[11px]">
                          <th className="p-2.5 min-w-[140px]">Criterio</th>
                          <th className="p-2.5 min-w-[130px] bg-emerald-950/40 text-emerald-300">Excelente (5.0)</th>
                          <th className="p-2.5 min-w-[130px] bg-blue-950/40 text-blue-300">Bueno (4.0 - 4.9)</th>
                          <th className="p-2.5 min-w-[130px] bg-amber-950/40 text-amber-300">Regular (3.0 - 3.9)</th>
                          <th className="p-2.5 min-w-[130px] bg-rose-950/40 text-rose-300">Deficiente (1.0 - 2.9)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {generatedRubric.criteria.map((crit, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            <td className="p-2.5 font-bold text-white">
                              {crit.name}
                              <span className="block text-[10px] text-slate-500 font-normal">Ponderación: {crit.weightPercent}%</span>
                            </td>
                            <td className="p-2.5 text-slate-300 text-[11px] bg-emerald-950/10">{crit.levels.excellent.description}</td>
                            <td className="p-2.5 text-slate-300 text-[11px] bg-blue-950/10">{crit.levels.good.description}</td>
                            <td className="p-2.5 text-slate-300 text-[11px] bg-amber-950/10">{crit.levels.regular.description}</td>
                            <td className="p-2.5 text-slate-300 text-[11px] bg-rose-950/10">{crit.levels.insufficient.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {generatedRubric.teacherAdvice && (
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs text-amber-300 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <strong>Consejo de Aplicación Pedagógica:</strong> {generatedRubric.teacherAdvice}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OBSERVACIONES DE BOLETÍN */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-white">Redactor Pedagógico de Observaciones y Recomendaciones Trimestrales</p>
                  <p>
                    Selecciona a un estudiante para analizar automáticamente sus calificaciones y generar comentarios personalizados y respetuosos listos para el boletín o informe de padres de familia.
                  </p>
                </div>
              </div>

              <form onSubmit={handleGenerateFeedback} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Seleccionar Estudiante:</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 cursor-pointer"
                  >
                    {groupStudents.map((s, idx) => (
                      <option key={s.id} value={s.id}>
                        #{s.listNumber || idx + 1} - {s.lastName}, {s.firstName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Fortalezas Observadas en Clase (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Ej: Participativo, creativo, buena pronunciación..."
                    value={feedbackStrengths}
                    onChange={(e) => setFeedbackStrengths(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Áreas de Oportunidad / Refuerzo (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Ej: Debe entregar tareas a tiempo, repasar vocabulario, mayor concentración..."
                    value={feedbackChallenges}
                    onChange={(e) => setFeedbackChallenges(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isGeneratingFeedback || !targetStudent}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingFeedback ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando Observaciones con IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generar Observaciones de Boletín</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {feedbackError && (
                <div className="p-4 bg-rose-950/60 border border-rose-700 text-rose-300 text-xs rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{feedbackError}</span>
                </div>
              )}

              {generatedFeedback && (
                <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 animate-in fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-sm">
                        {targetStudent?.firstName} {targetStudent?.lastName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {generatedFeedback.statusLabel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          `OBSERVACIÓN:\n${generatedFeedback.qualitativeSummary}\n\nRECOMENDACIÓN AL ACUDIENTE:\n${generatedFeedback.parentMessage}`,
                          'fb-copy'
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'fb-copy' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>Copiar Observación</span>
                    </button>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <h5 className="font-bold text-slate-400 uppercase text-[10px]">Síntesis de Desempeño:</h5>
                    <p className="text-slate-200 leading-relaxed">{generatedFeedback.qualitativeSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <h5 className="font-bold text-emerald-400 uppercase text-[10px] mb-1">Fortalezas:</h5>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                        {generatedFeedback.strengthsIdentified.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <h5 className="font-bold text-amber-400 uppercase text-[10px] mb-1">Recomendaciones para el Alumno:</h5>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                        {generatedFeedback.recommendationsForStudent.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-800/40 space-y-1">
                    <h5 className="font-bold text-indigo-300 uppercase text-[10px]">Mensaje Formal para el Acudiente:</h5>
                    <p className="text-slate-300 italic">{generatedFeedback.parentMessage}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CHAT COPILOTO DOCENTE */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[520px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'model' && (
                      <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                          : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none whitespace-pre-wrap'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isSendingChat && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      <span>Gemini AI está pensando...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escribe tu consulta pedagógica, solicitud de examen, dinámica o tema..."
                  value={inputChat}
                  onChange={(e) => setInputChat(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={isSendingChat || !inputChat.trim()}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
