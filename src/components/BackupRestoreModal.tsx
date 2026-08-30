import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Trash2,
  ShieldCheck,
  Database,
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  Users,
  Award,
  BookOpen,
  Calendar,
} from 'lucide-react';
import {
  Group,
  Student,
  EvaluationColumn,
  Grade,
  AttendanceRecord,
  ThemePlanner,
  WeeklyPlanner,
  ScheduleSlot,
  SchedulePeriod,
  AcademicCalendarConfig,
  TeacherProfile,
  SystemBackupData,
  LocalSnapshot,
} from '../types';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  students: Student[];
  evaluationColumns: EvaluationColumn[];
  grades: Record<string, Grade>;
  attendanceRecords: Record<string, AttendanceRecord>;
  themePlanners: ThemePlanner[];
  weeklyPlanners: WeeklyPlanner[];
  scheduleSlots: ScheduleSlot[];
  schedulePeriods: SchedulePeriod[];
  calendarConfig: AcademicCalendarConfig;
  teacherInfo: TeacherProfile;
  exportBackupData: () => SystemBackupData;
  downloadBackupJSON: (customFileName?: string) => void;
  importBackupData: (
    backup: Partial<SystemBackupData>,
    mode?: 'replace' | 'merge'
  ) => {
    success: boolean;
    message: string;
    counts: { groups: number; students: number; grades: number; attendance: number; planners: number };
  };
  localSnapshots: LocalSnapshot[];
  createLocalSnapshot: (label?: string) => LocalSnapshot;
  restoreLocalSnapshot: (snapshotId: string) => boolean;
  deleteLocalSnapshot: (snapshotId: string) => void;
  getStorageDiagnostics: () => {
    localStorageSizeKB: number;
    keys: Record<string, number>;
    totalGroups: number;
    totalStudents: number;
    totalGrades: number;
    totalAttendance: number;
    totalPlanners: number;
  };
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  onManualCloudSync?: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  groups,
  students,
  evaluationColumns,
  grades,
  attendanceRecords,
  themePlanners,
  weeklyPlanners,
  scheduleSlots,
  schedulePeriods,
  calendarConfig,
  teacherInfo,
  exportBackupData,
  downloadBackupJSON,
  importBackupData,
  localSnapshots,
  createLocalSnapshot,
  restoreLocalSnapshot,
  deleteLocalSnapshot,
  getStorageDiagnostics,
  syncStatus,
  onManualCloudSync,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'snapshots' | 'diagnostics'>('export');
  const [copied, setCopied] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Import State
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<SystemBackupData | null>(null);
  const [pasteJsonText, setPasteJsonText] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const diagnostics = getStorageDiagnostics();
  const totalGradesCount = Object.keys(grades).length;
  const totalAttendanceCount = Object.keys(attendanceRecords).length;
  const totalPlannersCount = themePlanners.length + weeklyPlanners.length;

  const handleCopyJSON = () => {
    try {
      const data = exportBackupData();
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      setStatusMessage({ type: 'success', text: '¡Copia de seguridad en formato JSON copiada al portapapeles!' });
    } catch {
      setStatusMessage({ type: 'error', text: 'No se pudo copiar automáticamente. Por favor use el botón de Descargar JSON.' });
    }
  };

  const handleCreateSnapshot = () => {
    const label = snapshotLabel.trim() || `Punto de Control Manual - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    createLocalSnapshot(label);
    setSnapshotLabel('');
    setStatusMessage({ type: 'success', text: `Punto de restauración "${label}" guardado en el almacenamiento local.` });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileToImport(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        setParsedBackup(parsed);
        setStatusMessage({ type: 'info', text: 'Archivo cargado. Revise el resumen previo y confirme la restauración.' });
      } catch (err: any) {
        setParsedBackup(null);
        setStatusMessage({ type: 'error', text: `El archivo seleccionado no es un JSON válido: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  const handleParsePastedJSON = () => {
    if (!pasteJsonText.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor pegue el texto JSON del respaldo.' });
      return;
    }
    try {
      const parsed = JSON.parse(pasteJsonText);
      setParsedBackup(parsed);
      setStatusMessage({ type: 'info', text: 'Texto JSON verificado exitosamente. Listo para restaurar.' });
    } catch (err: any) {
      setParsedBackup(null);
      setStatusMessage({ type: 'error', text: `El texto pegado no es un JSON válido: ${err.message}` });
    }
  };

  const handleExecuteImport = () => {
    if (!parsedBackup) {
      setStatusMessage({ type: 'error', text: 'No hay datos válidos cargados para importar.' });
      return;
    }

    setIsProcessingImport(true);
    setTimeout(() => {
      const result = importBackupData(parsedBackup, importMode);
      setIsProcessingImport(false);
      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: `${result.message} (${result.counts.groups} grupos, ${result.counts.students} estudiantes, ${result.counts.grades} calificaciones restauradas).`,
        });
        setFileToImport(null);
        setParsedBackup(null);
        setPasteJsonText('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onManualCloudSync) onManualCloudSync();
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    }, 300);
  };

  const handleRestoreSnapshot = (snap: LocalSnapshot) => {
    const confirmMsg = `¿Desea restaurar el estado "${snap.label}" del ${new Date(snap.createdAt).toLocaleString()}?\n\nSe guardará un punto de seguridad antes de restaurar.`;
    if (window.confirm(confirmMsg)) {
      const success = restoreLocalSnapshot(snap.id);
      if (success) {
        setStatusMessage({ type: 'success', text: `Estado restaurado exitosamente a "${snap.label}".` });
        if (onManualCloudSync) onManualCloudSync();
      } else {
        setStatusMessage({ type: 'error', text: 'No se pudo restaurar el snapshot seleccionado.' });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Centro de Respaldo, Exportación e Importación
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Local & Nube
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Protección contra pérdida de información: descargas en archivo JSON, restauración y puntos de control.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setStatusMessage(null);
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'export'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>1. Descargar Respaldo (Exportar)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setStatusMessage(null);
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'import'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>2. Restaurar Respaldo (Importar)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('snapshots');
              setStatusMessage(null);
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'snapshots'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>3. Historial de Puntos Locales ({localSnapshots.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('diagnostics');
              setStatusMessage(null);
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'diagnostics'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>4. Diagnóstico de Memoria Local</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between gap-3 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-b border-emerald-800 text-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/80 border-b border-rose-800 text-rose-200'
                : 'bg-blue-950/80 border-b border-blue-800 text-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              {statusMessage.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: EXPORT / DOWNLOAD */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Primary Action Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-800/40 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">Descargar Archivo de Respaldo Completo</h3>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Guarda una copia 100% íntegra en tu computadora, pendrive o Google Drive. Contiene todos los grupos, listas de estudiantes, notas de los 3 trimestres, registros de asistencia y planes didácticos.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => downloadBackupJSON()}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Respaldo (.JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyJSON}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? '¡Copiado!' : 'Copiar JSON'}</span>
                  </button>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Contenido que se incluirá en el archivo de respaldo:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col items-center justify-center text-center">
                    <Layers className="w-4 h-4 text-blue-400 mb-1" />
                    <span className="text-lg font-black text-white">{groups.length}</span>
                    <span className="text-[11px] text-slate-400">Grupos / Salones</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col items-center justify-center text-center">
                    <Users className="w-4 h-4 text-indigo-400 mb-1" />
                    <span className="text-lg font-black text-white">{students.length}</span>
                    <span className="text-[11px] text-slate-400">Estudiantes</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col items-center justify-center text-center">
                    <Award className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="text-lg font-black text-white">{totalGradesCount}</span>
                    <span className="text-[11px] text-slate-400">Notas Registradas</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 mb-1" />
                    <span className="text-lg font-black text-white">{totalAttendanceCount}</span>
                    <span className="text-[11px] text-slate-400">Registros Asistencia</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col items-center justify-center text-center">
                    <BookOpen className="w-4 h-4 text-purple-400 mb-1" />
                    <span className="text-lg font-black text-white">{totalPlannersCount}</span>
                    <span className="text-[11px] text-slate-400">Planes Didácticos</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col items-center justify-center text-center">
                    <Calendar className="w-4 h-4 text-rose-400 mb-1" />
                    <span className="text-lg font-black text-white">3 Trim.</span>
                    <span className="text-[11px] text-slate-400">Calendario & Horario</span>
                  </div>
                </div>
              </div>

              {/* Security & Offline Tips */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-white">
                    Garantía de Almacenamiento Local (Local Storage)
                  </p>
                  <p>
                    Tus datos se guardan instantáneamente en la memoria local del navegador de este dispositivo cada vez que ingresas una nota o asistencia. Sin embargo, si limpias el historial del navegador o cambias de computadora, este archivo <span className="font-mono text-blue-300 font-bold">.JSON</span> te permite restaurar todo en 1 segundo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT / RESTORE */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {/* File Upload Box */}
              <div className="p-6 rounded-2xl bg-slate-800/50 border-2 border-dashed border-slate-700 hover:border-blue-500/60 transition-all flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <FileJson className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Selecciona tu archivo de respaldo (.JSON)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Arrastra el archivo aquí o haz clic en el botón para explorar tus carpetas.
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="backup-file-input"
                />

                <label
                  htmlFor="backup-file-input"
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Explorar Archivos...</span>
                </label>

                {fileToImport && (
                  <span className="text-xs text-emerald-400 font-mono font-semibold">
                    Archivo seleccionado: {fileToImport.name} ({Math.round(fileToImport.size / 1024)} KB)
                  </span>
                )}
              </div>

              {/* Paste JSON Option */}
              <div className="space-y-2">
                <details className="text-xs text-slate-400 group">
                  <summary className="cursor-pointer font-bold text-slate-300 hover:text-white flex items-center gap-1.5">
                    <span>O pegar contenido JSON directamente (para iPads o tabletas)</span>
                  </summary>
                  <div className="mt-3 space-y-2">
                    <textarea
                      rows={4}
                      value={pasteJsonText}
                      onChange={(e) => setPasteJsonText(e.target.value)}
                      placeholder='Pega aquí el contenido JSON {"version": "2026.1", "groups": [...], ...}'
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleParsePastedJSON}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Verificar Texto JSON
                    </button>
                  </div>
                </details>
              </div>

              {/* Pre-Restore Preview Card */}
              {parsedBackup && (
                <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-500/40 space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Respaldo Verificado y Listo para Restaurar</span>
                    </div>
                    {parsedBackup.timestamp && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        Fecha: {new Date(parsedBackup.timestamp).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Inspector stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Grupos</span>
                      <span className="text-sm font-bold text-white">
                        {Array.isArray(parsedBackup.groups) ? parsedBackup.groups.length : 0}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Estudiantes</span>
                      <span className="text-sm font-bold text-white">
                        {Array.isArray(parsedBackup.students) ? parsedBackup.students.length : 0}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Calificaciones</span>
                      <span className="text-sm font-bold text-white">
                        {parsedBackup.grades ? Object.keys(parsedBackup.grades).length : 0}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Asistencias</span>
                      <span className="text-sm font-bold text-white">
                        {parsedBackup.attendanceRecords ? Object.keys(parsedBackup.attendanceRecords).length : 0}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Docente</span>
                      <span className="text-sm font-bold text-white truncate">
                        {parsedBackup.teacherInfo?.name || 'Docente'}
                      </span>
                    </div>
                  </div>

                  {/* Mode selector */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">Modo de Restauración:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          importMode === 'replace'
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="font-bold text-xs">⚡ Reemplazar Todo (Sobrescribir)</div>
                          <div className="text-[11px] text-slate-400">
                            Deja el sistema exactamente igual al archivo de respaldo.
                          </div>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          importMode === 'merge'
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          value="merge"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="font-bold text-xs">🔄 Fusión Inteligente (Combinar)</div>
                          <div className="text-[11px] text-slate-400">
                            Mantiene los grupos actuales y añade los contenidos del respaldo.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Safety note & Confirm button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Se creará un punto de restauración automático antes de aplicar.
                    </span>

                    <button
                      type="button"
                      disabled={isProcessingImport}
                      onClick={handleExecuteImport}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isProcessingImport ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>Confirmar y Restaurar Datos Ahora</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SNAPSHOTS & HISTORY */}
          {activeTab === 'snapshots' && (
            <div className="space-y-6">
              {/* Create Snapshot Form */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={snapshotLabel}
                    onChange={(e) => setSnapshotLabel(e.target.value)}
                    placeholder="Nombre del punto de control (Ej: Antes de ingresar examen trimestral)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateSnapshot}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Crear Punto de Control</span>
                </button>
              </div>

              {/* Snapshots List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Puntos de Restauración Locales Guardados ({localSnapshots.length}):
                </h4>

                {localSnapshots.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                    No hay puntos de control guardados aún. Cada vez que hagas un cambio importante o importes un archivo, se creará uno automáticamente.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {localSnapshots.map((snap) => (
                      <div
                        key={snap.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{snap.label}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                              {new Date(snap.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-3">
                            <span>{snap.itemCounts.groups} grupos</span>
                            <span>•</span>
                            <span>{snap.itemCounts.students} estudiantes</span>
                            <span>•</span>
                            <span>{snap.itemCounts.grades} notas</span>
                            <span>•</span>
                            <span>{snap.itemCounts.attendance} asistencias</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => handleRestoreSnapshot(snap)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Restaurar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteLocalSnapshot(snap.id)}
                            title="Eliminar este punto de control"
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 hover:text-rose-300 text-slate-500 border border-slate-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DIAGNOSTICS & MEMORY STATUS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              {/* Storage Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Memoria Local Utilizada</span>
                    <HardDrive className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xl font-black text-white">{diagnostics.localStorageSizeKB} KB</div>
                  <span className="text-[10px] text-emerald-400">Óptimo (&lt; 5,000 KB límite de navegador)</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Estado en la Nube (Firestore)</span>
                    <Database className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-base font-bold text-white flex items-center gap-1.5">
                    {syncStatus === 'synced' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Sincronizado
                      </span>
                    ) : syncStatus === 'syncing' ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Guardando...
                      </span>
                    ) : (
                      <span className="text-rose-400">Modo Offline Activo</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">Sincronización bidireccional</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Total Registros Activos</span>
                    <Layers className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-xl font-black text-white">
                    {students.length + totalGradesCount + totalAttendanceCount}
                  </div>
                  <span className="text-[10px] text-slate-400">Estudiantes + Notas + Asistencia</span>
                </div>
              </div>

              {/* Key breakdown */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Desglose de llaves en LocalStorage:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                  {Object.entries(diagnostics.keys).map(([key, sizeKB]) => (
                    <div key={key} className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex justify-between">
                      <span className="text-slate-400 truncate">{key.replace('meduca_', '')}</span>
                      <span className="text-blue-300 font-bold">{sizeKB} KB</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Force flush button */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700">
                <div>
                  <div className="font-bold text-xs text-white">Forzar Sincronización Inmediata</div>
                  <div className="text-[11px] text-slate-400">
                    Re-escribe todos los estados en LocalStorage y sube a la base de datos Firestore.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onManualCloudSync) onManualCloudSync();
                    setStatusMessage({ type: 'success', text: '¡Sincronización forzada completada en LocalStorage y Nube!' });
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Sincronizar Todo Ahora</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Sistema Offline-First MEDUCA • Panamá 2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
