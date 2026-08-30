import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Trash2,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Calendar,
  Sparkles,
  BarChart2,
  ArrowUpDown,
  Filter,
  Info,
} from 'lucide-react';
import { Student, EvaluationColumn, Grade, Group, AcademicCalendarConfig } from '../types';
import {
  calculateStudentTrimesterGrade,
  calculateStudentAnnualSummary,
  calculateGroupStatistics,
  formatGrade,
  getGradeStatus,
  isPrimaryEducation,
} from '../utils/gradeCalculations';
import { exportGradesToCSV, exportToPrintableHTML } from '../utils/exportUtils';

interface GradebookViewProps {
  group: Group;
  students: Student[];
  columns: EvaluationColumn[];
  grades: Record<string, Grade>;
  trimester: number;
  calendarConfig: AcademicCalendarConfig;
  onUpdateGrade: (grade: Grade) => void;
  onAddColumn: (column: EvaluationColumn) => void;
  onDeleteColumn: (columnId: string) => void;
  onUpdateColumn: (column: EvaluationColumn) => void;
  onOpenAiRubric?: () => void;
  onOpenAiObservations?: () => void;
  teacherInfo: {
    name: string;
    email: string;
    school: string;
    region: string;
    signatureDataUrl?: string;
  };
}

export const GradebookView: React.FC<GradebookViewProps> = ({
  group,
  students,
  columns,
  grades,
  trimester,
  calendarConfig,
  onUpdateGrade,
  onAddColumn,
  onDeleteColumn,
  onUpdateColumn,
  onOpenAiRubric,
  onOpenAiObservations,
  teacherInfo,
}) => {
  const isPrimary = useMemo(() => isPrimaryEducation(group), [group]);
  const [viewMode, setViewMode] = useState<'trimester' | 'annual'>('trimester');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'formative' | 'summative' | 'exam'>('all');
  const [isAddingColModalOpen, setIsAddingColModalOpen] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColCategory, setNewColCategory] = useState<'formative' | 'summative' | 'exam'>('summative');
  const [newColMaxScore, setNewColMaxScore] = useState<number>(5.0);
  const [searchFilter, setSearchFilter] = useState('');

  // Always reset to summative for Primaria
  useEffect(() => {
    if (isPrimary) {
      setNewColCategory('summative');
      setActiveCategoryFilter('all');
    }
  }, [isPrimary]);

  // Filter columns for current group & trimester
  const trimesterColumns = useMemo(() => {
    return columns.filter((col) => col.groupId === group.id && col.trimester === trimester);
  }, [columns, group.id, trimester]);

  // Filtered by category if tab is selected
  const displayedColumns = useMemo(() => {
    if (isPrimary || activeCategoryFilter === 'all') return trimesterColumns;
    return trimesterColumns.filter((col) => col.category === activeCategoryFilter);
  }, [trimesterColumns, activeCategoryFilter, isPrimary]);

  // Filter students by name or document
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => s.groupId === group.id && s.active)
      .filter(
        (s) =>
          `${s.lastName} ${s.firstName}`.toLowerCase().includes(searchFilter.toLowerCase()) ||
          s.documentId.toLowerCase().includes(searchFilter.toLowerCase())
      )
      .sort((a, b) => (a.listNumber || 0) - (b.listNumber || 0));
  }, [students, group.id, searchFilter]);

  // Calculations per student
  const studentTrimesterSummaries = useMemo(() => {
    const map: Record<string, ReturnType<typeof calculateStudentTrimesterGrade>> = {};
    filteredStudents.forEach((student) => {
      map[student.id] = calculateStudentTrimesterGrade(student.id, trimester, columns, grades, undefined, isPrimary);
    });
    return map;
  }, [filteredStudents, trimester, columns, grades, isPrimary]);

  // Annual calculation
  const studentAnnualSummaries = useMemo(() => {
    const map: Record<string, ReturnType<typeof calculateStudentAnnualSummary>> = {};
    filteredStudents.forEach((student) => {
      map[student.id] = calculateStudentAnnualSummary(student.id, columns, grades, undefined, isPrimary);
    });
    return map;
  }, [filteredStudents, columns, grades, isPrimary]);

  // Statistics for current trimester
  const groupStats = useMemo(() => {
    return calculateGroupStatistics(filteredStudents, trimester, columns, grades, isPrimary);
  }, [filteredStudents, trimester, columns, grades, isPrimary]);

  // Handle adding new evaluation column
  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;

    const nextParcialNum = trimesterColumns.length + 1;
    const finalTitle = newColTitle.trim();

    const newCol: EvaluationColumn = {
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      groupId: group.id,
      trimester,
      title: finalTitle,
      category: isPrimary ? 'summative' : newColCategory,
      maxScore: newColMaxScore || 5.0,
      weight: isPrimary ? 1 : (newColCategory === 'exam' ? 34 : 33),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    onAddColumn(newCol);
    setNewColTitle('');
    setIsAddingColModalOpen(false);
  };

  // Inline grade editing
  const handleScoreChange = (studentId: string, columnId: string, rawVal: string) => {
    if (rawVal === '') {
      onUpdateGrade({
        id: `grd-${studentId}-${columnId}`,
        studentId,
        columnId,
        score: 0,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    let parsed = parseFloat(rawVal);
    if (isNaN(parsed)) return;
    if (parsed > 5.0) parsed = 5.0;
    if (parsed < 0) parsed = 0;

    onUpdateGrade({
      id: `grd-${studentId}-${columnId}`,
      studentId,
      columnId,
      score: parsed,
      updatedAt: new Date().toISOString(),
    });
  };

  // Helper to get raw score
  const getScore = (studentId: string, columnId: string): number | string => {
    const key = `grd-${studentId}-${columnId}`;
    const grade = grades[key];
    if (!grade || grade.score === 0) return '';
    return grade.score;
  };

  // Export handlers
  const handleExportCSV = () => {
    exportGradesToCSV(group, filteredStudents, trimesterColumns, grades, trimester);
  };

  const handlePrint = () => {
    exportToPrintableHTML(
      group,
      filteredStudents,
      trimesterColumns,
      grades,
      trimester,
      teacherInfo,
      groupStats
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-600/30 text-blue-400 font-black text-xs uppercase tracking-wider border border-blue-500/30">
              {group.name} • {group.subject}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
              isPrimary
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
            }`}>
              {isPrimary ? 'Educación Primaria (1°-6°)' : 'Premedia / Media'}
            </span>
            <span className="text-xs text-slate-400">
              Año Lectivo {calendarConfig.schoolYear}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            Libreta de Calificaciones
            <span className="text-sm font-bold text-slate-400 font-mono">
              (Trimestre {trimester})
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isPrimary ? (
              <span className="text-amber-300/90 font-medium flex items-center gap-1">
                <Info className="w-3.5 h-3.5 inline-block text-amber-400 shrink-0" />
                Régimen MEDUCA Primaria: Solo se utilizan Notas Parciales (promedio aritmético directo). No aplican apreciación ni exámenes trimestrales.
              </span>
            ) : (
              'Escala MEDUCA de 1.0 a 5.0 • Ponderación oficial: Apreciación (33%), Parciales (33%) y Examen Trimestral (34%)'
            )}
          </p>
        </div>

        {/* View switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          {/* Mode Switcher: Trimester vs Annual */}
          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center text-xs">
            <button
              type="button"
              onClick={() => setViewMode('trimester')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'trimester'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Trimestre {trimester}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('annual')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'annual'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Consolidado Anual
            </button>
          </div>

          {/* AI Tools for Gradebook */}
          {onOpenAiRubric && (
            <button
              type="button"
              onClick={onOpenAiRubric}
              title="Generar rúbricas e instrumentos de evaluación con IA"
              className="px-3 py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Rúbrica IA</span>
            </button>
          )}

          {onOpenAiObservations && (
            <button
              type="button"
              onClick={onOpenAiObservations}
              title="Generar observaciones pedagógicas para boletines con IA"
              className="px-3 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Observaciones IA</span>
            </button>
          )}

          {/* Add Activity Button */}
          {viewMode === 'trimester' && (
            <button
              type="button"
              onClick={() => setIsAddingColModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isPrimary ? 'Nuevo Parcial' : 'Nueva Evaluación'}</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Exportar a archivo Excel / CSV"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          {/* Print / Export Official PDF Sheet */}
          <button
            type="button"
            onClick={handlePrint}
            title="Imprimir o generar registro oficial en PDF"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trimester Performance Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Alumnos</div>
            <div className="text-xl font-black text-white mt-0.5">{groupStats.totalStudents}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
            {group.name}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Aprobados (≥ 3.0)</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {groupStats.passedStudents} <span className="text-xs text-slate-500 font-normal">({groupStats.passPercentage}%)</span>
            </div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500/40" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Reprobados (&lt; 3.0)</div>
            <div className="text-xl font-black text-rose-400 mt-0.5">
              {groupStats.failedStudents}
            </div>
          </div>
          <AlertTriangle className="w-6 h-6 text-rose-500/40" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Promedio Grupal</div>
            <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
              {formatGrade(groupStats.averageGrade)}
            </div>
          </div>
          <TrendingUp className="w-6 h-6 text-amber-500/40" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Filters: Only shown for Premedia/Media. For Primaria, show partials information indicator */}
        {viewMode === 'trimester' && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {isPrimary ? (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="font-bold text-white">Notas Parciales registradas:</span>
                <span className="font-mono text-amber-300 font-bold">{trimesterColumns.length}</span>
                <span className="text-slate-500 text-[11px] hidden md:inline">| Promedio Aritmético Directo</span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveCategoryFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeCategoryFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Todas ({trimesterColumns.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategoryFilter('formative')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeCategoryFilter === 'formative'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-emerald-400 hover:text-white'
                  }`}
                >
                  Apreciación / Formativas (33%)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategoryFilter('summative')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeCategoryFilter === 'summative'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-amber-400 hover:text-white'
                  }`}
                >
                  Parciales / Sumativas (33%)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategoryFilter('exam')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeCategoryFilter === 'exam'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-purple-400 hover:text-white'
                  }`}
                >
                  Examen Trimestral (34%)
                </button>
              </>
            )}
          </div>
        )}

        {/* Search student */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500"
          />
        </div>
      </div>

      {/* Main Gradebook Spreadsheet Table */}
      {viewMode === 'trimester' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] relative">
            <table className="w-full text-left border-collapse text-xs">
              {/* Table Header */}
              <thead className="bg-slate-950 text-slate-300 font-bold sticky top-0 z-20 shadow-md">
                <tr className="border-b border-slate-800">
                  <th className="p-3 text-center w-12 sticky left-0 bg-slate-950 z-30">#</th>
                  <th className="p-3 min-w-[200px] sticky left-12 bg-slate-950 z-30">
                    Estudiante (Apellidos, Nombres)
                  </th>
                  
                  {/* Dynamic Evaluation Columns */}
                  {displayedColumns.map((col, cIdx) => {
                    const catBadge = isPrimary
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700/50'
                      : col.category === 'formative'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50'
                      : col.category === 'summative'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700/50'
                      : 'bg-purple-950/80 text-purple-300 border-purple-700/50';

                    const badgeText = isPrimary
                      ? `Parcial ${cIdx + 1}`
                      : col.category === 'formative'
                      ? 'Apreciación'
                      : col.category === 'summative'
                      ? 'Parcial'
                      : 'Examen';

                    return (
                      <th
                        key={col.id}
                        className="p-2.5 text-center min-w-[120px] max-w-[160px] border-l border-slate-800/80 relative group"
                      >
                        <div className="space-y-1">
                          <span
                            className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${catBadge}`}
                          >
                            {badgeText}
                          </span>
                          <div className="font-bold text-white text-xs truncate" title={col.title}>
                            {col.title}
                          </div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            Escala: 1.0 - {col.maxScore.toFixed(1)}
                          </div>
                        </div>

                        {/* Delete column button on hover */}
                        <button
                          type="button"
                          onClick={() => onDeleteColumn(col.id)}
                          title="Eliminar columna de evaluación"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </th>
                    );
                  })}

                  {/* Calculated Category Averages & Final Grade */}
                  {!isPrimary && (
                    <>
                      <th className="p-3 text-center min-w-[90px] bg-emerald-950/40 text-emerald-300 border-l border-slate-800">
                        Prom. Apr.
                      </th>
                      <th className="p-3 text-center min-w-[90px] bg-amber-950/40 text-amber-300 border-l border-slate-800">
                        Prom. Par.
                      </th>
                      <th className="p-3 text-center min-w-[90px] bg-purple-950/40 text-purple-300 border-l border-slate-800">
                        Examen
                      </th>
                    </>
                  )}
                  
                  <th className="p-3 text-center min-w-[110px] bg-blue-950/60 text-blue-300 border-l border-slate-800 font-black">
                    {isPrimary ? `Promedio Trimestral (T${trimester})` : `Nota Trim ${trimester}`}
                  </th>
                  <th className="p-3 text-center min-w-[90px] bg-slate-950 text-slate-400 border-l border-slate-800">
                    Estado
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={displayedColumns.length + (isPrimary ? 4 : 7)} className="p-8 text-center text-slate-400">
                      No se encontraron estudiantes para este grupo.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => {
                    const summary = studentTrimesterSummaries[student.id];
                    const isFailing = summary ? summary.finalGrade < 3.0 : false;

                    return (
                      <tr
                        key={student.id}
                        className={`hover:bg-slate-800/50 transition-colors ${
                          idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/60'
                        }`}
                      >
                        {/* List Number */}
                        <td className="p-3 text-center font-mono text-slate-400 font-bold sticky left-0 bg-inherit z-10 border-r border-slate-800">
                          {student.listNumber || idx + 1}
                        </td>

                        {/* Student Name & Document */}
                        <td className="p-3 font-semibold text-white sticky left-12 bg-inherit z-10 border-r border-slate-800">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-100">
                              {student.lastName}, {student.firstName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Cédula: {student.documentId || 'S/N'}
                            </span>
                          </div>
                        </td>

                        {/* Dynamic Input Cells */}
                        {displayedColumns.map((col) => {
                          const currentScore = getScore(student.id, col.id);
                          const numScore = typeof currentScore === 'number' ? currentScore : 0;
                          const isCellFailing = numScore > 0 && numScore < 3.0;

                          return (
                            <td
                              key={col.id}
                              className="p-1.5 text-center border-l border-slate-800/60"
                            >
                              <input
                                type="number"
                                step="0.1"
                                min="1.0"
                                max="5.0"
                                placeholder="—"
                                value={currentScore}
                                onChange={(e) =>
                                  handleScoreChange(student.id, col.id, e.target.value)
                                }
                                className={`w-16 mx-auto text-center py-1 rounded-md text-xs font-bold font-mono transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                                  isCellFailing
                                    ? 'bg-rose-950/80 text-rose-300 border border-rose-600/70 font-black'
                                    : numScore >= 3.0
                                    ? 'bg-slate-800 text-white border border-slate-700'
                                    : 'bg-slate-800/40 text-slate-400 border border-slate-800'
                                }`}
                              />
                            </td>
                          );
                        })}

                        {/* Averages (Only for Premedia/Media) */}
                        {!isPrimary && (
                          <>
                            <td className="p-3 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20 border-l border-slate-800">
                              {summary && summary.formativeAvg > 0
                                ? formatGrade(summary.formativeAvg)
                                : '—'}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-amber-400 bg-amber-950/20 border-l border-slate-800">
                              {summary && summary.summativeAvg > 0
                                ? formatGrade(summary.summativeAvg)
                                : '—'}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-purple-400 bg-purple-950/20 border-l border-slate-800">
                              {summary && summary.examScore > 0
                                ? formatGrade(summary.examScore)
                                : '—'}
                            </td>
                          </>
                        )}

                        {/* Final Trimester Grade */}
                        <td
                          className={`p-3 text-center font-mono font-black text-sm border-l border-slate-800 ${
                            isFailing
                              ? 'bg-rose-950/50 text-rose-400'
                              : 'bg-blue-950/40 text-blue-300'
                          }`}
                        >
                          {summary && summary.finalGrade > 0
                            ? formatGrade(summary.finalGrade)
                            : '1.0'}
                        </td>

                        {/* Status badge */}
                        <td className="p-3 text-center border-l border-slate-800">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              isFailing
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            }`}
                          >
                            {isFailing ? 'Reprobado' : 'Aprobado'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Consolidated Annual View (Trimestre 1, 2, 3 + Promedio Anual) */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">
                Consolidado de Calificaciones Anuales
              </h3>
              <p className="text-xs text-slate-400">
                {isPrimary
                  ? 'Promedio de los tres trimestres de Primaria (T1 + T2 + T3) ÷ 3'
                  : 'Ponderación final del año escolar (T1 + T2 + T3) ÷ 3'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              MEDUCA Oficial 2026
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3 min-w-[220px]">Estudiante</th>
                  <th className="p-3 text-center min-w-[100px] text-blue-300 border-l border-slate-800">
                    Trimestre 1
                  </th>
                  <th className="p-3 text-center min-w-[100px] text-blue-300 border-l border-slate-800">
                    Trimestre 2
                  </th>
                  <th className="p-3 text-center min-w-[100px] text-blue-300 border-l border-slate-800">
                    Trimestre 3
                  </th>
                  <th className="p-3 text-center min-w-[120px] bg-blue-950/60 text-amber-300 border-l border-slate-800 font-black text-sm">
                    Promedio Anual
                  </th>
                  <th className="p-3 text-center min-w-[110px] border-l border-slate-800">
                    Condición Final
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStudents.map((student, idx) => {
                  const ann = studentAnnualSummaries[student.id];
                  const isFailing = ann ? ann.isFailing : false;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/60'
                      }`}
                    >
                      <td className="p-3 text-center font-mono text-slate-400 font-bold">
                        {student.listNumber || idx + 1}
                      </td>
                      <td className="p-3 font-semibold text-white">
                        <div className="font-bold text-slate-100">
                          {student.lastName}, {student.firstName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {student.documentId}
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-200 border-l border-slate-800">
                        {ann && ann.t1Grade > 0 ? formatGrade(ann.t1Grade) : '—'}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-200 border-l border-slate-800">
                        {ann && ann.t2Grade > 0 ? formatGrade(ann.t2Grade) : '—'}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-200 border-l border-slate-800">
                        {ann && ann.t3Grade > 0 ? formatGrade(ann.t3Grade) : '—'}
                      </td>
                      <td
                        className={`p-3 text-center font-mono font-black text-sm border-l border-slate-800 ${
                          isFailing
                            ? 'bg-rose-950/50 text-rose-400'
                            : 'bg-blue-950/40 text-amber-300'
                        }`}
                      >
                        {ann && ann.annualAverage > 0
                          ? formatGrade(ann.annualAverage)
                          : '1.0'}
                      </td>
                      <td className="p-3 text-center border-l border-slate-800">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${
                            isFailing
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}
                        >
                          {isFailing ? 'Revalida / Reprobado' : 'Promovido'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Evaluation Column */}
      {isAddingColModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                {isPrimary ? 'Nueva Nota Parcial (Primaria)' : 'Nueva Columna de Evaluación'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingColModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isPrimary && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Régimen MEDUCA Primaria:</strong> En Educación Primaria solo se registran <strong>Notas Parciales</strong>. El promedio aritmético directo de los parciales conforma la calificación trimestral. No aplican notas de apreciación ni examen.
                </p>
              </div>
            )}

            <form onSubmit={handleCreateColumn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isPrimary ? 'Título de la Nota Parcial:' : 'Título de la Evaluación:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isPrimary
                      ? `Ej: Parcial ${trimesterColumns.length + 1}: Vocabulario, Lectura, Taller...`
                      : 'Ej: Parcial 1: Simple Present, Vocab Quiz...'
                  }
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {!isPrimary ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoría MEDUCA:
                  </label>
                  <select
                    value={newColCategory}
                    onChange={(e) => setNewColCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="summative">Sumativa / Parcial (Ponderación 33%)</option>
                    <option value="formative">Apreciación / Tareas / Talleres (Ponderación 33%)</option>
                    <option value="exam">Examen Trimestral Oficial (Ponderación 34%)</option>
                  </select>
                </div>
              ) : (
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-300 flex items-center justify-between">
                  <span className="font-semibold text-slate-400">Tipo de Calificación:</span>
                  <span className="font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 text-[11px]">
                    Nota Parcial (Promedio Directo)
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Puntaje Máximo (Escala oficial MEDUCA 1.0 a 5.0):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="100.0"
                  value={newColMaxScore}
                  onChange={(e) => setNewColMaxScore(parseFloat(e.target.value) || 5.0)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingColModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  {isPrimary ? 'Crear Nota Parcial' : 'Crear Columna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

