import React, { useState, useMemo } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Printer,
  Copy,
  Check,
  AlertTriangle,
  Users,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  Send,
  FileText,
  UserCheck,
  Award,
  Clock,
  BookOpen,
  Filter,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Student, Group, EvaluationColumn, Grade, AttendanceRecord } from '../types';
import {
  calculateStudentTrimesterGrade,
  formatGrade,
  isPrimaryEducation,
} from '../utils/gradeCalculations';
import { exportBatchIndividualReportsToHTML } from '../utils/exportUtils';

export interface FollowUpLog {
  id: string;
  studentId: string;
  date: string;
  channel: 'whatsapp' | 'call' | 'in_person' | 'written_notice';
  reason: string;
  agreements: string;
  status: 'pending' | 'in_progress' | 'resolved';
}

interface ParentReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  students: Student[];
  columns: EvaluationColumn[];
  grades: Record<string, Grade> | Grade[];
  trimester: number;
  teacherInfo: {
    name: string;
    email: string;
    school: string;
    region: string;
    signatureDataUrl?: string;
  };
  attendanceRecords?: Record<string, AttendanceRecord>;
}

export const ParentReportsModal: React.FC<ParentReportsModalProps> = ({
  isOpen,
  onClose,
  group,
  students,
  columns,
  grades,
  trimester,
  teacherInfo,
  attendanceRecords = {},
}) => {
  const isPrimary = isPrimaryEducation(group);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'failing' | 'has_low_eval' | 'all' | 'honor'>('failing');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [messageTemplate, setMessageTemplate] = useState<
    'failing_alert' | 'full_report' | 'congratulations' | 'pending_tasks'
  >('failing_alert');
  const [customMessage, setCustomMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isAnnouncementCopied, setIsAnnouncementCopied] = useState(false);

  // Follow-up interaction logs stored in localStorage
  const [followUpLogs, setFollowUpLogs] = useState<FollowUpLog[]>(() => {
    try {
      const saved = localStorage.getItem(`followup_logs_${group.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newLogChannel, setNewLogChannel] = useState<'whatsapp' | 'call' | 'in_person' | 'written_notice'>('whatsapp');
  const [newLogReason, setNewLogReason] = useState('Bajo rendimiento (< 3.0)');
  const [newLogAgreements, setNewLogAgreements] = useState('');

  // Trimester columns for this group
  const trimesterColumns = useMemo(() => {
    return (columns || []).filter(
      (c) => c.groupId === group.id && Number(c.trimester) === Number(trimester)
    );
  }, [columns, group.id, trimester]);

  // Compute attendance stats per student
  const attendanceStats = useMemo(() => {
    const stats: Record<string, { present: number; absent: number; late: number; justified: number }> = {};
    students.forEach((s) => {
      stats[s.id] = { present: 0, absent: 0, late: 0, justified: 0 };
    });

    (Object.values(attendanceRecords) as AttendanceRecord[]).forEach((rec) => {
      if (rec && rec.studentId && stats[rec.studentId]) {
        const st = rec.status;
        if (st === 'present') stats[rec.studentId].present++;
        else if (st === 'absent') stats[rec.studentId].absent++;
        else if (st === 'late') stats[rec.studentId].late++;
        else if (st === 'justified') stats[rec.studentId].justified++;
      }
    });
    return stats;
  }, [students, attendanceRecords]);

  // Compute grades and summaries for all students
  const studentSummaries = useMemo(() => {
    const map: Record<
      string,
      {
        calc: ReturnType<typeof calculateStudentTrimesterGrade>;
        failedColumns: { column: EvaluationColumn; score: number }[];
        allScores: { column: EvaluationColumn; score: number | null }[];
      }
    > = {};

    students.forEach((s) => {
      const calc = calculateStudentTrimesterGrade(
        s.id,
        trimesterColumns,
        grades,
        trimester,
        undefined,
        isPrimary
      );

      const failedCols: { column: EvaluationColumn; score: number }[] = [];
      const allScores: { column: EvaluationColumn; score: number | null }[] = [];

      trimesterColumns.forEach((col) => {
        let score: number | null = null;
        if (Array.isArray(grades)) {
          const g = grades.find(
            (entry) => entry.studentId === s.id && (entry.activityId === col.id || entry.columnId === col.id)
          );
          if (g && typeof g.score === 'number') score = g.score;
        } else {
          const key1 = `grd-${s.id}-${col.id}`;
          const key2 = `${s.id}-${col.id}`;
          const g = grades[key1] || grades[key2];
          if (g && typeof g.score === 'number') score = g.score;
        }

        allScores.push({ column: col, score });
        if (score !== null && score > 0 && score < 3.0) {
          failedCols.push({ column: col, score });
        }
      });

      map[s.id] = { calc, failedColumns: failedCols, allScores };
    });

    return map;
  }, [students, trimesterColumns, grades, trimester, isPrimary]);

  // Count metrics
  const failingCount = useMemo(() => {
    return students.filter((s) => {
      const summary = studentSummaries[s.id];
      return summary?.calc.trimesterGrade !== null && summary.calc.trimesterGrade < 3.0;
    }).length;
  }, [students, studentSummaries]);

  const hasLowEvalCount = useMemo(() => {
    return students.filter((s) => {
      const summary = studentSummaries[s.id];
      return summary && summary.failedColumns.length > 0;
    }).length;
  }, [students, studentSummaries]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => s.groupId === group.id && s.active !== false)
      .filter((s) => {
        const summary = studentSummaries[s.id];
        const grade = summary?.calc.trimesterGrade;

        if (filterMode === 'failing') {
          return grade !== null && grade < 3.0;
        }
        if (filterMode === 'has_low_eval') {
          return (summary?.failedColumns.length || 0) > 0;
        }
        if (filterMode === 'honor') {
          return grade !== null && grade >= 4.5;
        }
        return true;
      })
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const fullName = `${s.lastName} ${s.firstName}`.toLowerCase();
        const doc = (s.documentId || s.cedula || '').toLowerCase();
        const guardian = (s.guardianName || '').toLowerCase();
        const phone = (s.guardianPhone || '').toLowerCase();
        return fullName.includes(q) || doc.includes(q) || guardian.includes(q) || phone.includes(q);
      })
      .sort((a, b) => {
        // Failing students first
        const sA = studentSummaries[a.id]?.calc.trimesterGrade || 5.0;
        const sB = studentSummaries[b.id]?.calc.trimesterGrade || 5.0;
        return sA - sB;
      });
  }, [students, group.id, filterMode, searchQuery, studentSummaries]);

  // Auto-select first student when list changes
  const activeStudent = useMemo(() => {
    if (selectedStudentId) {
      const found = students.find((s) => s.id === selectedStudentId);
      if (found) return found;
    }
    return filteredStudents[0] || students[0] || null;
  }, [selectedStudentId, filteredStudents, students]);

  // Auto-switch template based on active student
  React.useEffect(() => {
    if (activeStudent) {
      const summary = studentSummaries[activeStudent.id];
      const grade = summary?.calc.trimesterGrade;
      if (grade !== null && grade < 3.0) {
        setMessageTemplate('failing_alert');
      } else if (grade !== null && grade >= 4.5) {
        setMessageTemplate('congratulations');
      } else {
        setMessageTemplate('full_report');
      }
    }
  }, [activeStudent?.id]);

  // Generate WhatsApp formatted text message
  const generatedMessage = useMemo(() => {
    if (!activeStudent) return '';

    const summary = studentSummaries[activeStudent.id];
    const calc = summary?.calc;
    const grade = calc?.trimesterGrade;
    const att = attendanceStats[activeStudent.id];
    const guardian = activeStudent.guardianName?.trim() || 'Estimado(a) Acudiente';
    const studentName = `${activeStudent.firstName} ${activeStudent.lastName}`.trim();
    const school = teacherInfo.school || 'el Centro Educativo';
    const subject = group.subject || 'Inglés';
    const teacher = teacherInfo.name ? `Prof. ${teacherInfo.name}` : 'Docente de la Asignatura';

    // Detailed scores list
    const scoresList = (summary?.allScores || [])
      .map((item, idx) => {
        const scoreStr = item.score !== null ? item.score.toFixed(1) : 'Pendiente';
        const isFail = item.score !== null && item.score < 3.0;
        return `  ▫️ ${item.column.title}: *${scoreStr}* ${isFail ? '⚠️ (Menor a 3.0)' : '✅'}`;
      })
      .join('\n');

    const failingItems = (summary?.failedColumns || [])
      .map((f) => `  ❌ ${f.column.title}: *${f.score.toFixed(1)}*`)
      .join('\n');

    if (messageTemplate === 'failing_alert') {
      return (
        `🚨 *CITACIÓN Y ALERTA PEDAGÓGICA - REPORTE DE CALIFICACIONES*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Estimado(a) *${guardian}*,\n` +
        `Acudiente de: *${studentName}* (Grupo ${group.name})\n` +
        `Plantel: *${school}*\n\n` +
        `Le saluda cordialmente el(la) *${teacher}*, docente de la asignatura de *${subject}*.\n\n` +
        `Le informamos con carácter de *URGENCIA* que al corte del *Trimestre ${trimester} (2026)*, el estudiante presenta un rendimiento en riesgo de reprobación:\n\n` +
        `📊 *PROMEDIO TRIMESTRAL ACTUAL:* *${formatGrade(grade)}* / 5.0\n` +
        `⚠️ *ESTADO MEDUCA:* *DEFICIENTE / EN RIESGO*\n\n` +
        (failingItems ? `📌 *Evaluaciones reprobadas registradas:*\n${failingItems}\n\n` : '') +
        `🤝 *SOLICITUD DE REUNIÓN Y COMPROMISO:*\n` +
        `Solicitamos coordinar a la brevedad una reunión de seguimiento para acordar el plan de nivelación y recuperación académica en casa y en el aula.\n\n` +
        `Favor responder a este mensaje confirmando su recepción. ¡Juntos podemos lograr la mejora de su acudido!`
      );
    }

    if (messageTemplate === 'congratulations') {
      return (
        `🌟 *RECONOCIMIENTO Y REPORTE DE EXCELENCIA ACADÉMICA*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Estimado(a) *${guardian}*,\n` +
        `Acudiente de: *${studentName}* (Grupo ${group.name})\n` +
        `Plantel: *${school}*\n\n` +
        `Le saluda el(la) *${teacher}*, docente de *${subject}*.\n\n` +
        `¡Nos complace felicitarle por el excelente desempeño, responsabilidad y dedicación de su acudido(a) durante el *Trimestre ${trimester}*!\n\n` +
        `🏆 *PROMEDIO TRIMESTRAL ACTUAL:* *${formatGrade(grade)}* / 5.0 (Sobresaliente)\n\n` +
        `📋 *Desglose de Calificaciones:*\n` +
        `${scoresList}\n\n` +
        `Le animamos a continuar brindándole el valioso apoyo en el hogar. ¡Muchas felicidades!`
      );
    }

    if (messageTemplate === 'pending_tasks') {
      return (
        `📝 *AVISO DE EVALUACIONES Y ASIGNACIONES PENDIENTES*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Estimado(a) *${guardian}*,\n` +
        `Acudiente de: *${studentName}* (Grupo ${group.name})\n` +
        `Asignatura: *${subject}* • *${school}*\n\n` +
        `Le saluda el(la) *${teacher}*. Le contactamos para informarle sobre las actividades y evaluaciones en desarrollo para el *Trimestre ${trimester}*.\n\n` +
        `📋 *Estado Actual de Calificaciones:*\n` +
        `${scoresList}\n\n` +
        `📊 *Promedio Acumulado:* *${formatGrade(grade)}*\n\n` +
        `Agradecemos supervisar que el estudiante mantenga sus tareas al día y repase los contenidos para las próximas evaluaciones.`
      );
    }

    // Default: full_report
    return (
      `📊 *INFORME INDIVIDUAL DE RENDIMIENTO ACADÉMICO*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Estimado(a) *${guardian}*,\n` +
      `Acudiente de: *${studentName}*\n` +
      `Grupo: *${group.name}* • Asignatura: *${subject}*\n` +
      `Docente: *${teacher}* • *${school}*\n\n` +
      `Compartimos el reporte oficial de calificaciones correspondiente al *Trimestre ${trimester} (2026)*:\n\n` +
      `📋 *DESGLOSE DE EVALUACIONES:*\n` +
      `${scoresList}\n\n` +
      (!isPrimary
        ? `📈 *Ponderación Oficial:*\n` +
          `  • Apreciación (33%): *${calc?.formativeAvg ? calc.formativeAvg.toFixed(1) : '—'}*\n` +
          `  • Parciales (33%): *${calc?.summativeAvg ? calc.summativeAvg.toFixed(1) : '—'}*\n` +
          `  • Examen Trimestral (34%): *${calc?.examScore ? calc.examScore.toFixed(1) : '—'}*\n\n`
        : '') +
      `🎯 *PROMEDIO TRIMESTRAL FINAL:* *${formatGrade(grade)}* (${calc?.statusLabel || 'Regular'})\n` +
      (att && (att.present > 0 || att.absent > 0)
        ? `🕒 *Asistencia:* ${att.present} asistencias | ${att.absent} ausencias | ${att.late} tardanzas\n\n`
        : '\n') +
      `Quedamos a su disposición para cualquier consulta sobre el avance pedagógico de su acudido(a).`
    );
  }, [
    activeStudent,
    studentSummaries,
    attendanceStats,
    teacherInfo,
    group,
    trimester,
    isPrimary,
    messageTemplate,
  ]);

  // Keep custom message in sync or allow editing
  React.useEffect(() => {
    setCustomMessage(generatedMessage);
  }, [generatedMessage]);

  // Clean phone helper
  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 8) {
      digits = '507' + digits; // Panama code
    }
    return digits;
  };

  const handleSendWhatsApp = () => {
    if (!activeStudent) return;
    const phone = cleanPhone(activeStudent.guardianPhone);
    const text = encodeURIComponent(customMessage);
    if (!phone) {
      // If no phone, just open WhatsApp web so user can choose recipient
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    }

    // Auto add to log
    const autoLog: FollowUpLog = {
      id: `log-${Date.now()}`,
      studentId: activeStudent.id,
      date: new Date().toISOString().split('T')[0],
      channel: 'whatsapp',
      reason:
        messageTemplate === 'failing_alert'
          ? 'Alerta y Citación por Calificación < 3.0'
          : messageTemplate === 'congratulations'
          ? 'Felicitación por Alto Rendimiento'
          : 'Envío de Informe de Calificaciones',
      agreements: 'Notificación enviada por WhatsApp al acudiente.',
      status: 'pending',
    };
    const updated = [autoLog, ...followUpLogs];
    setFollowUpLogs(updated);
    localStorage.setItem(`followup_logs_${group.id}`, JSON.stringify(updated));
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyGroupAnnouncement = () => {
    const text =
      `📢 *COMUNICADO OFICIAL PARA PADRES DE FAMILIA - GRUPO ${group.name}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Estimados Padres de Familia y Acudientes del *${teacherInfo.school || 'Plantel'}*:\n\n` +
      `Les saluda el(la) *Prof. ${teacherInfo.name || 'Docente'}*, profesor(a) de la asignatura de *${group.subject || 'Inglés'}*.\n\n` +
      `Les informamos que se ha completado el registro y consolidación de evaluaciones correspondientes al *Trimestre ${trimester} (2026)*.\n\n` +
      `⚠️ *AVISO IMPORTANTE DE SEGUIMIENTO:*\n` +
      `Estaremos enviando por vía directa los reportes individuales y citaciones especiales para los estudiantes que requieran apoyo prioritario y recuperación académica.\n\n` +
      `Les recordamos la importancia del acompañamiento diario en casa, la revisión de cuadernos y el cumplimiento de las tareas escolares.\n\n` +
      `Atentamente,\n*Prof. ${teacherInfo.name || 'Docente de la Asignatura'}*\n${teacherInfo.school || 'Centro Educativo'}`;

    navigator.clipboard.writeText(text);
    setIsAnnouncementCopied(true);
    setTimeout(() => setIsAnnouncementCopied(false), 2500);
  };

  // Export single student PDF
  const handlePrintSingle = (student: Student) => {
    exportBatchIndividualReportsToHTML(
      group,
      students,
      columns,
      grades,
      trimester,
      teacherInfo,
      {
        specificStudentId: student.id,
        attendanceStats,
      }
    );
  };

  // Export batch PDF (Only failing < 3.0 or all)
  const handlePrintBatch = (onlyFailing: boolean) => {
    exportBatchIndividualReportsToHTML(
      group,
      students,
      columns,
      grades,
      trimester,
      teacherInfo,
      {
        onlyFailing,
        attendanceStats,
      }
    );
  };

  // Add follow up log
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !newLogAgreements.trim()) return;

    const newLog: FollowUpLog = {
      id: `log-${Date.now()}`,
      studentId: activeStudent.id,
      date: new Date().toISOString().split('T')[0],
      channel: newLogChannel,
      reason: newLogReason,
      agreements: newLogAgreements.trim(),
      status: 'in_progress',
    };

    const updated = [newLog, ...followUpLogs];
    setFollowUpLogs(updated);
    localStorage.setItem(`followup_logs_${group.id}`, JSON.stringify(updated));
    setNewLogAgreements('');
  };

  const handleDeleteLog = (id: string) => {
    const updated = followUpLogs.filter((l) => l.id !== id);
    setFollowUpLogs(updated);
    localStorage.setItem(`followup_logs_${group.id}`, JSON.stringify(updated));
  };

  const handleToggleLogStatus = (id: string) => {
    const updated = followUpLogs.map((l) => {
      if (l.id === id) {
        const nextStatus: 'pending' | 'in_progress' | 'resolved' =
          l.status === 'pending'
            ? 'in_progress'
            : l.status === 'in_progress'
            ? 'resolved'
            : 'pending';
        return { ...l, status: nextStatus };
      }
      return l;
    });
    setFollowUpLogs(updated);
    localStorage.setItem(`followup_logs_${group.id}`, JSON.stringify(updated));
  };

  if (!isOpen) return null;

  const activeStudentSummary = activeStudent ? studentSummaries[activeStudent.id] : null;
  const activeStudentGrade = activeStudentSummary?.calc.trimesterGrade;
  const activeStudentIsFailing = activeStudentGrade !== null && activeStudentGrade !== undefined && activeStudentGrade < 3.0;
  const activeStudentLogs = followUpLogs.filter((l) => l.studentId === activeStudent?.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Reportes a Padres & Seguimiento WhatsApp
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-extrabold border border-blue-500/30">
                  {group.name} • T{trimester}
                </span>
                {failingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[11px] font-black border border-rose-500/40 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    {failingCount} en Riesgo (&lt; 3.0)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Informes individualizados para acudientes, alertas para notas menores a 3.0 y boletas en lote PDF.
              </p>
            </div>
          </div>

          {/* Action buttons on header */}
          <div className="flex items-center gap-2">
            {/* Batch PDF Export buttons */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-xl p-1 shadow-sm">
              <button
                type="button"
                onClick={() => handlePrintBatch(true)}
                title="Generar e imprimir boletas PDF individuales solo para estudiantes en riesgo (< 3.0)"
                className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Printer className="w-3.5 h-3.5 text-rose-400" />
                <span>PDF Lote: En Riesgo (&lt; 3.0)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrintBatch(false)}
                title="Generar e imprimir boletas PDF individuales para todo el grupo"
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ml-1"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>PDF Lote: Todos ({students.length})</span>
              </button>
            </div>

            {/* Copy broadcast message */}
            <button
              type="button"
              onClick={handleCopyGroupAnnouncement}
              title="Copiar comunicado general para el grupo de WhatsApp de padres"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isAnnouncementCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Aviso Grupal WhatsApp</span>
                </>
              )}
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Layout */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Column: Student Selector with Filters and Risk Highlights */}
          <div className="w-full md:w-80 lg:w-96 bg-slate-950/60 border-r border-slate-800 flex flex-col shrink-0 min-h-0">
            {/* Filter Tabs */}
            <div className="p-3 border-b border-slate-800 space-y-2.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterMode('failing')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    filterMode === 'failing'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-slate-800/80 text-rose-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    En Riesgo (&lt; 3.0)
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px]">
                    {failingCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode('has_low_eval')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    filterMode === 'has_low_eval'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                      : 'bg-slate-800/80 text-amber-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Notas &lt; 3.0
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px]">
                    {hasLowEvalCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Todos
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px]">
                    {students.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterMode('honor')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    filterMode === 'honor'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-800/80 text-emerald-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Sobresalientes
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px]">
                    {
                      students.filter((s) => {
                        const g = studentSummaries[s.id]?.calc.trimesterGrade;
                        return g !== null && g >= 4.5;
                      }).length
                    }
                  </span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar alumno, cédula o acudiente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500"
                />
              </div>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                  <UserCheck className="w-8 h-8 mx-auto text-slate-600" />
                  <p>No se encontraron estudiantes con este criterio.</p>
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const summary = studentSummaries[student.id];
                  const grade = summary?.calc.trimesterGrade;
                  const isFailing = grade !== null && grade !== undefined && grade < 3.0;
                  const isSelected = activeStudent?.id === student.id;
                  const failedColsCount = summary?.failedColumns.length || 0;

                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500/50 shadow-sm'
                          : isFailing
                          ? 'bg-rose-950/20 hover:bg-rose-950/40 border-rose-900/40'
                          : 'bg-slate-900/40 hover:bg-slate-800/60 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                            isFailing
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {student.listNumber || '•'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                            <span className="truncate">
                              {student.lastName}, {student.firstName}
                            </span>
                            {isFailing && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-2">
                            <span>{student.guardianName || 'Acudiente'}</span>
                            {student.guardianPhone && (
                              <span className="text-emerald-400 font-mono">
                                📞 {student.guardianPhone}
                              </span>
                            )}
                          </div>
                          {failedColsCount > 0 && (
                            <div className="text-[9.5px] text-amber-400 font-semibold mt-0.5">
                              ⚠️ {failedColsCount} eval. &lt; 3.0
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Grade Badge */}
                      <div className="text-right shrink-0">
                        <div
                          className={`px-2 py-0.5 rounded-md font-mono font-black text-xs ${
                            isFailing
                              ? 'bg-rose-600 text-white'
                              : (grade || 0) >= 4.5
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-200 border border-slate-700'
                          }`}
                        >
                          {formatGrade(grade)}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase">
                          {summary?.calc.statusLabel || '—'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Student Workspace (WhatsApp Sender, Detail Matrix, Follow-up Logs) */}
          <div className="flex-1 bg-slate-900 flex flex-col min-h-0 overflow-y-auto">
            {activeStudent ? (
              <div className="p-4 sm:p-6 space-y-6">
                {/* Active Student Info Header Card */}
                <div
                  className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                    activeStudentIsFailing
                      ? 'bg-rose-950/40 border-rose-700/60 text-rose-100 shadow-lg shadow-rose-950/20'
                      : 'bg-slate-950 border-slate-800 text-slate-100'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold text-xs">
                        #{activeStudent.listNumber || 1}
                      </span>
                      <h3 className="text-base font-black text-white tracking-tight">
                        {activeStudent.lastName}, {activeStudent.firstName}
                      </h3>
                      {activeStudentIsFailing && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                          🚨 Atención Prioritaria
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>
                        <strong>Cédula:</strong> {activeStudent.documentId || activeStudent.cedula || 'S/N'}
                      </span>
                      <span>
                        <strong>Acudiente:</strong> {activeStudent.guardianName || 'No registrado'}
                      </span>
                      <span>
                        <strong>Teléfono:</strong>{' '}
                        <span className="font-mono text-emerald-400 font-bold">
                          {activeStudent.guardianPhone || 'Sin número'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Stats */}
                  <div className="flex items-center gap-3">
                    <div className="text-center px-3 py-1.5 rounded-xl bg-black/40 border border-white/10">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Promedio T{trimester}</div>
                      <div
                        className={`text-xl font-mono font-black ${
                          activeStudentIsFailing ? 'text-rose-400' : 'text-blue-400'
                        }`}
                      >
                        {formatGrade(activeStudentGrade)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePrintSingle(activeStudent)}
                      title="Imprimir boleta oficial en PDF para este estudiante"
                      className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Boleta PDF</span>
                    </button>
                  </div>
                </div>

                {/* Evaluations Breakdown Pill List */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Evaluaciones Registradas en el Trimestre {trimester}:</span>
                    <span className="text-slate-500 font-normal">
                      {activeStudentSummary?.allScores.length} actividades
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {activeStudentSummary?.allScores.map((item, idx) => {
                      const isLow = item.score !== null && item.score < 3.0;
                      return (
                        <div
                          key={item.column.id}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                            isLow
                              ? 'bg-rose-950/50 border-rose-600/60 text-rose-200 font-semibold'
                              : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="truncate">
                            <div className="font-bold truncate text-white">{item.column.title}</div>
                            <div className="text-[10px] text-slate-500 capitalize">
                              {item.column.category === 'formative'
                                ? 'Apreciación (33%)'
                                : item.column.category === 'summative'
                                ? 'Parcial (33%)'
                                : 'Examen (34%)'}
                            </div>
                          </div>
                          <span
                            className={`font-mono font-black text-xs px-1.5 py-0.5 rounded ${
                              isLow
                                ? 'bg-rose-600 text-white'
                                : item.score !== null
                                ? 'bg-slate-800 text-slate-200'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {item.score !== null ? item.score.toFixed(1) : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* WhatsApp Message Composer */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-white">
                        Generador de Mensaje WhatsApp para Acudiente
                      </span>
                    </div>

                    {/* Template Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      <button
                        type="button"
                        onClick={() => setMessageTemplate('failing_alert')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          messageTemplate === 'failing_alert'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 text-rose-300 hover:text-white'
                        }`}
                      >
                        🚨 Alerta & Citación (&lt; 3.0)
                      </button>

                      <button
                        type="button"
                        onClick={() => setMessageTemplate('full_report')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          messageTemplate === 'full_report'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        📊 Informe Completo
                      </button>

                      <button
                        type="button"
                        onClick={() => setMessageTemplate('congratulations')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          messageTemplate === 'congratulations'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-emerald-300 hover:text-white'
                        }`}
                      >
                        🌟 Felicitación
                      </button>

                      <button
                        type="button"
                        onClick={() => setMessageTemplate('pending_tasks')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          messageTemplate === 'pending_tasks'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-amber-300 hover:text-white'
                        }`}
                      >
                        📝 Tareas Pendientes
                      </button>
                    </div>
                  </div>

                  {/* Textarea for WhatsApp text */}
                  <div>
                    <textarea
                      rows={8}
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-mono rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Send & Copy Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-slate-400">
                      Destinatario:{' '}
                      <span className="font-semibold text-white">
                        {activeStudent.guardianName || 'Acudiente'}
                      </span>{' '}
                      {activeStudent.guardianPhone ? (
                        <span className="font-mono text-emerald-400">
                          ({activeStudent.guardianPhone})
                        </span>
                      ) : (
                        <span className="text-amber-400">(Sin teléfono registrado)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyMessage}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>¡Texto Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Texto</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendWhatsApp}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Enviar por WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Follow-up / Interaction Log with Parent */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-sm text-white">
                        Bitácora de Seguimiento y Acuerdos con el Acudiente
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {activeStudentLogs.length} registros guardados
                    </span>
                  </div>

                  {/* Add Log Form */}
                  <form onSubmit={handleAddLog} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Canal de Contacto:
                        </label>
                        <select
                          value={newLogChannel}
                          onChange={(e) => setNewLogChannel(e.target.value as any)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        >
                          <option value="whatsapp">📱 Mensaje / Audio de WhatsApp</option>
                          <option value="call">📞 Llamada Telefónica</option>
                          <option value="in_person">🏫 Entrevista Presencial en Plantel</option>
                          <option value="written_notice">✉️ Citación Escrita en Cuaderno</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Motivo del Seguimiento:
                        </label>
                        <input
                          type="text"
                          value={newLogReason}
                          onChange={(e) => setNewLogReason(e.target.value)}
                          placeholder="Ej: Calificación 2.4 en Parcial, Inasistencia..."
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Acuerdos y Compromisos Alcanzados:
                      </label>
                      <input
                        type="text"
                        required
                        value={newLogAgreements}
                        onChange={(e) => setNewLogAgreements(e.target.value)}
                        placeholder="Ej: El acudiente se compromete a revisar tareas diariamente y asistir a tutoría..."
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Guardar Registro</span>
                      </button>
                    </div>
                  </form>

                  {/* Previous logs list */}
                  <div className="space-y-2">
                    {activeStudentLogs.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-500">
                        No hay acuerdos registrados aún para este estudiante.
                      </div>
                    ) : (
                      activeStudentLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-400 text-[10px]">{log.date}</span>
                              <span className="font-bold text-white uppercase text-[10px] px-1.5 py-0.2 rounded bg-slate-800">
                                {log.channel}
                              </span>
                              <span className="font-semibold text-slate-300 truncate">
                                • {log.reason}
                              </span>
                            </div>
                            <p className="text-slate-300 text-xs">{log.agreements}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleLogStatus(log.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                log.status === 'resolved'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : log.status === 'in_progress'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {log.status === 'resolved'
                                ? '✓ Resuelto'
                                : log.status === 'in_progress'
                                ? '⏳ En Curso'
                                : '⚠️ Pendiente'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-600" />
                <p>Seleccione un estudiante de la lista lateral para redactar el reporte.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
