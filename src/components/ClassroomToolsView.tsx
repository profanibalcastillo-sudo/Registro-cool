import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Volume2,
  Users,
  Shuffle,
  Sparkles,
  Award,
  Maximize2,
  Minimize2,
  CheckCircle2,
  VolumeX,
  Copy,
  Check,
  Megaphone,
  Bell,
  Music,
  Smile,
  Flame,
  FileText,
  Trash2,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { Group, Student } from '../types';
import { playSchoolBell, BellSoundType } from '../services/soundEffects';
import { soundManager } from '../utils/audioUtils';

interface ClassroomToolsViewProps {
  group: Group;
  students: Student[];
  teacherInfo: {
    name: string;
    email: string;
    school: string;
    region: string;
  };
}

const TEAM_NAME_PRESETS = [
  'The Golden Eagles',
  'The Swift Panthers',
  'Thunderbolt English',
  'The Brave Explorers',
  'Future Champions',
  'Creative Masters',
  'Global Citizens',
  'The Apex Achievers',
  'Cosmic Pioneers',
  'Silver Wolves',
];

export const ClassroomToolsView: React.FC<ClassroomToolsViewProps> = ({
  group,
  students = [],
  teacherInfo,
}) => {
  // Filter active students for this group
  const groupStudents = students.filter(
    (s) => s.groupId === group.id && s.status !== 'Retirado' && s.status !== 'Trasladado'
  );

  // Sub-tabs within Classroom Tools
  const [activeSubTab, setActiveSubTab] = useState<'timer' | 'picker' | 'teams' | 'traffic-light' | 'scratchpad'>('timer');

  // ==========================================
  // 1. TIMER & STOPWATCH STATE
  // ==========================================
  const [timerMode, setTimerMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [initialSeconds, setInitialSeconds] = useState<number>(300); // 5 min default
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isFullScreenTimer, setIsFullScreenTimer] = useState<boolean>(false);
  const [timerSound, setTimerSound] = useState<BellSoundType>('school_bell');
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // Stopwatch state
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stopwatchRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (isTimerRunning && secondsRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && secondsRemaining === 0) {
      setIsTimerRunning(false);
      if (!isSoundMuted) {
        playSchoolBell(timerSound, 0.9);
        soundManager.playCelebration();
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isTimerRunning, secondsRemaining, timerSound, isSoundMuted]);

  // Stopwatch effect
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchRef.current = setTimeout(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (stopwatchRef.current) clearTimeout(stopwatchRef.current);
    };
  }, [isStopwatchRunning]);

  const handleStartTimer = () => setIsTimerRunning(true);
  const handlePauseTimer = () => setIsTimerRunning(false);
  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsRemaining(initialSeconds);
  };
  const handleSetPreset = (seconds: number) => {
    setIsTimerRunning(false);
    setInitialSeconds(seconds);
    setSecondsRemaining(seconds);
  };
  const handleAddMinutes = (mins: number) => {
    setSecondsRemaining((prev) => Math.max(0, prev + mins * 60));
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Percentage for countdown ring
  const progressPercent = initialSeconds > 0 ? (secondsRemaining / initialSeconds) * 100 : 0;

  // ==========================================
  // 2. RANDOM STUDENT PICKER STATE
  // ==========================================
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isPicking, setIsPicking] = useState<boolean>(false);
  const [pickedHistory, setPickedHistory] = useState<string[]>([]); // Student IDs
  const [noRepeatMode, setNoRepeatMode] = useState<boolean>(true);
  const [wheelCandidates, setWheelCandidates] = useState<Student[]>([]);

  const handlePickRandomStudent = () => {
    if (groupStudents.length === 0) return;

    let available = groupStudents;
    if (noRepeatMode) {
      const remaining = groupStudents.filter((s) => !pickedHistory.includes(s.id));
      if (remaining.length > 0) {
        available = remaining;
      } else {
        // Reset cycle
        setPickedHistory([]);
        available = groupStudents;
      }
    }

    setIsPicking(true);
    let counter = 0;
    const maxSteps = 22;
    const intervalTime = 80;

    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * available.length);
      setSelectedStudent(available[randomIdx]);
      soundManager.playTick();
      counter++;

      if (counter >= maxSteps) {
        clearInterval(interval);
        const finalWinner = available[Math.floor(Math.random() * available.length)];
        setSelectedStudent(finalWinner);
        setIsPicking(false);
        setPickedHistory((prev) => [...prev, finalWinner.id]);
        soundManager.playCelebration();
      }
    }, intervalTime);
  };

  // ==========================================
  // 3. TEAM & PAIR MAKER STATE
  // ==========================================
  const [teamSize, setTeamSize] = useState<number>(3);
  const [generatedTeams, setGeneratedTeams] = useState<{ id: string; name: string; members: Student[] }[]>([]);
  const [hasCopiedTeams, setHasCopiedTeams] = useState<boolean>(false);

  const handleGenerateTeams = () => {
    if (groupStudents.length === 0) return;

    // Shuffle array
    const shuffled = [...groupStudents].sort(() => 0.5 - Math.random());
    const teamsCount = Math.ceil(shuffled.length / teamSize);
    const newTeams: { id: string; name: string; members: Student[] }[] = [];

    for (let i = 0; i < teamsCount; i++) {
      const members = shuffled.slice(i * teamSize, (i + 1) * teamSize);
      newTeams.push({
        id: `team-${i + 1}`,
        name: TEAM_NAME_PRESETS[i % TEAM_NAME_PRESETS.length] || `Equipo ${i + 1}`,
        members,
      });
    }

    setGeneratedTeams(newTeams);
    soundManager.playCelebration();
  };

  const handleCopyTeams = () => {
    if (generatedTeams.length === 0) return;
    const text = generatedTeams
      .map(
        (t) =>
          `📌 ${t.name} (${t.members.length} estudiantes):\n` +
          t.members.map((m, idx) => `  ${idx + 1}. ${m.lastName}, ${m.firstName}`).join('\n')
      )
      .join('\n\n');

    navigator.clipboard.writeText(`EQUIPOS DE TRABAJO - ${group.name}\n\n${text}`);
    setHasCopiedTeams(true);
    setTimeout(() => setHasCopiedTeams(false), 2500);
  };

  // ==========================================
  // 4. TRAFFIC LIGHT / VOICE LEVEL STATE
  // ==========================================
  const [currentVoiceLevel, setCurrentVoiceLevel] = useState<number>(2); // 0 = Silence, 1 = Whisper, 2 = Table Talk, 3 = Presentation

  const VOICE_LEVELS = [
    {
      level: 0,
      titleEs: 'Nivel 0: Silencio Total',
      titleEn: 'Level 0: Total Silence',
      desc: 'Exámenes, explicaciones magistrales del docente y lectura individual silenciosa.',
      color: 'bg-rose-500',
      border: 'border-rose-400',
      glow: 'shadow-rose-500/40',
      badge: 'bg-rose-950 text-rose-300 border-rose-800',
    },
    {
      level: 1,
      titleEs: 'Nivel 1: Susurro en Parejas',
      titleEn: 'Level 1: Whisper / Pair Work',
      desc: 'Trabajo en parejas (pair work), consultas discretas entre compañeros de asiento.',
      color: 'bg-amber-500',
      border: 'border-amber-400',
      glow: 'shadow-amber-500/40',
      badge: 'bg-amber-950 text-amber-300 border-amber-800',
    },
    {
      level: 2,
      titleEs: 'Nivel 2: Voz de Mesa / Grupal',
      titleEn: 'Level 2: Table Talk / Group Work',
      desc: 'Discusión colaborativa en equipos de 3 a 5 estudiantes; solo los del equipo escuchan.',
      color: 'bg-blue-500',
      border: 'border-blue-400',
      glow: 'shadow-blue-500/40',
      badge: 'bg-blue-950 text-blue-300 border-blue-800',
    },
    {
      level: 3,
      titleEs: 'Nivel 3: Voz de Presentador',
      titleEn: 'Level 3: Presentation / Whole Class',
      desc: 'Exposiciones orales, participación plenaria, preguntas a todo el salón.',
      color: 'bg-emerald-500',
      border: 'border-emerald-400',
      glow: 'shadow-emerald-500/40',
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    },
  ];

  // ==========================================
  // 5. CLASSROOM SCRATCHPAD STATE
  // ==========================================
  const [scratchpadAgenda, setScratchpadAgenda] = useState<string>(() => {
    return (
      localStorage.getItem(`scratchpad_agenda_${group.id}`) ||
      '1. Warm-up: Daily Routine Vocabulary\n2. Pair Work: Dialogues on Page 24\n3. Group Activity: Presentation\n4. Exit Ticket: 3 New Words'
    );
  });
  const [scratchpadWords, setScratchpadWords] = useState<string>(() => {
    return (
      localStorage.getItem(`scratchpad_words_${group.id}`) ||
      'Environment • Pollution • Endangered • Ecosystem • Sustainable'
    );
  });
  const [scratchpadHomework, setScratchpadHomework] = useState<string>(() => {
    return (
      localStorage.getItem(`scratchpad_hw_${group.id}`) ||
      'Workbook Page 28, Exercises 1 to 4. Due next Tuesday.'
    );
  });

  const handleSaveScratchpad = () => {
    localStorage.setItem(`scratchpad_agenda_${group.id}`, scratchpadAgenda);
    localStorage.setItem(`scratchpad_words_${group.id}`, scratchpadWords);
    localStorage.setItem(`scratchpad_hw_${group.id}`, scratchpadHomework);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Gestión Activa de Aula
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Grupo: <b className="text-white">{group.name}</b> ({groupStudents.length} estudiantes)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            Herramientas Interactivas de Aula
          </h2>
          <p className="text-xs text-slate-400">
            Temporizador acústico, selector aleatorio de participación, generador de equipos, semáforo de voz y pizarra rápida de proyección.
          </p>
        </div>

        {/* Quick Sound Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => playSchoolBell('school_bell', 0.8)}
            title="Tocar Timbre Escolar Oficial MEDUCA"
            className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Bell className="w-4 h-4" />
            <span>Timbre Escolar</span>
          </button>

          <button
            type="button"
            onClick={() => playSchoolBell('chime', 0.8)}
            title="Tocar Campana Melódica de Atención"
            className="px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Music className="w-4 h-4" />
            <span>Campana</span>
          </button>

          <button
            type="button"
            onClick={() => soundManager.playCelebration()}
            title="Sonido de Felicitación / Aplausos"
            className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Award className="w-4 h-4" />
            <span>Celebración</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('timer')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'timer'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Temporizador & Cronómetro</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('picker')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'picker'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>Selector Aleatorio ({groupStudents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('teams')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'teams'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Generador de Equipos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('traffic-light')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'traffic-light'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Semáforo de Voz</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('scratchpad')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'scratchpad'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Pizarra & Agenda</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAB: TEMPORIZADOR Y CRONÓMETRO */}
      {/* ========================================================================= */}
      {activeSubTab === 'timer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Timer Display Card */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-between space-y-6 relative overflow-hidden">
            {/* Top Controls */}
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setTimerMode('countdown')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timerMode === 'countdown' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cuenta Regresiva
                </button>
                <button
                  type="button"
                  onClick={() => setTimerMode('stopwatch')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timerMode === 'stopwatch' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cronómetro
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSoundMuted(!isSoundMuted)}
                  title={isSoundMuted ? 'Activar sonido' : 'Silenciar sonido'}
                  className={`p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    isSoundMuted
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullScreenTimer(!isFullScreenTimer)}
                  title="Modo Pantalla Completa para Proyector"
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  {isFullScreenTimer ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Giant Clock Face */}
            <div className="py-6 flex flex-col items-center justify-center relative">
              <div
                className={`font-mono font-black tracking-tight text-center transition-all ${
                  isFullScreenTimer ? 'text-8xl sm:text-9xl' : 'text-6xl sm:text-7xl lg:text-8xl'
                } ${
                  timerMode === 'countdown'
                    ? secondsRemaining <= 30 && secondsRemaining > 0
                      ? 'text-amber-400 animate-pulse'
                      : secondsRemaining === 0
                      ? 'text-rose-500 animate-bounce'
                      : 'text-white'
                    : 'text-emerald-400'
                }`}
              >
                {timerMode === 'countdown' ? formatTime(secondsRemaining) : formatTime(stopwatchSeconds)}
              </div>

              {timerMode === 'countdown' && (
                <div className="w-64 sm:w-80 h-2.5 bg-slate-800 rounded-full mt-4 overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-1000 rounded-full ${
                      secondsRemaining <= 30 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {secondsRemaining === 0 && timerMode === 'countdown' && (
                <div className="mt-3 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500 text-rose-300 font-extrabold text-sm animate-pulse">
                  ¡Tiempo Cumplido! Transición de Clase
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-wrap items-center justify-center gap-3">
              {timerMode === 'countdown' ? (
                <>
                  {!isTimerRunning ? (
                    <button
                      type="button"
                      onClick={handleStartTimer}
                      disabled={secondsRemaining === 0}
                      className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>Iniciar Temporizador</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePauseTimer}
                      className="px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-black text-sm shadow-xl shadow-amber-600/30 flex items-center gap-2 cursor-pointer"
                    >
                      <Pause className="w-5 h-5 fill-current" />
                      <span>Pausar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 cursor-pointer shadow-md"
                    title="Reiniciar"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddMinutes(1)}
                    className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-bold active:scale-95 cursor-pointer"
                  >
                    +1 Minuto
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddMinutes(5)}
                    className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-bold active:scale-95 cursor-pointer"
                  >
                    +5 Minutos
                  </button>
                </>
              ) : (
                <>
                  {!isStopwatchRunning ? (
                    <button
                      type="button"
                      onClick={() => setIsStopwatchRunning(true)}
                      className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>Iniciar Cronómetro</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsStopwatchRunning(false)}
                      className="px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-black text-sm shadow-xl shadow-amber-600/30 flex items-center gap-2 cursor-pointer"
                    >
                      <Pause className="w-5 h-5 fill-current" />
                      <span>Pausar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsStopwatchRunning(false);
                      setStopwatchSeconds(0);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 cursor-pointer shadow-md"
                    title="Reiniciar Cronómetro"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Presets & Sound Configuration Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Tiempos Rápidos para Actividades de Clase</span>
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: '1 min (Warm-up)', secs: 60 },
                  { label: '3 min (Pair Talk)', secs: 180 },
                  { label: '5 min (Review/Quiz)', secs: 300 },
                  { label: '10 min (Reading)', secs: 600 },
                  { label: '15 min (Group Work)', secs: 900 },
                  { label: '20 min (Evaluation)', secs: 1200 },
                  { label: '30 min (Workshop)', secs: 1800 },
                  { label: '45 min (Período)', secs: 2700 },
                ].map((preset) => (
                  <button
                    key={preset.secs}
                    type="button"
                    onClick={() => handleSetPreset(preset.secs)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      initialSeconds === preset.secs && timerMode === 'countdown'
                        ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Alarm Selection */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Sonido de Alerta al Finalizar</span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'school_bell', label: 'Timbre Escolar' },
                  { id: 'chime', label: 'Campana Melódica' },
                  { id: 'digital_gong', label: 'Gong Digital' },
                  { id: 'marimba', label: 'Marimba Suave' },
                ].map((snd) => (
                  <button
                    key={snd.id}
                    type="button"
                    onClick={() => {
                      setTimerSound(snd.id as BellSoundType);
                      playSchoolBell(snd.id as BellSoundType, 0.7);
                    }}
                    className={`p-2 rounded-xl border font-bold flex items-center justify-between cursor-pointer ${
                      timerSound === snd.id
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{snd.label}</span>
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: SELECTOR ALEATORIO DE ESTUDIANTES */}
      {/* ========================================================================= */}
      {activeSubTab === 'picker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-between space-y-6">
            <div className="w-full flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white">Sorteo de Participación en Aula</h3>
                <p className="text-xs text-slate-400">
                  Selecciona al azar un estudiante del grupo para responder preguntas o pasar a la pizarra.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noRepeatMode}
                    onChange={(e) => setNoRepeatMode(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Sin Repetir</span>
                </label>
              </div>
            </div>

            {/* Display of Selected Student */}
            <div className="py-8 flex flex-col items-center justify-center text-center">
              {selectedStudent ? (
                <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-2xl shadow-purple-600/40 border border-purple-400/40">
                    N° {selectedStudent.listNumber || '?'}
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                      {selectedStudent.lastName}, {selectedStudent.firstName}
                    </h2>
                    <p className="text-xs text-purple-300 font-semibold font-mono mt-1">
                      Cédula: {selectedStudent.documentId || selectedStudent.cedula || '---'} • {group.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-slate-500 py-6">
                  <Shuffle className="w-16 h-16 mx-auto opacity-40 animate-pulse" />
                  <p className="text-sm font-semibold">
                    Pulsa el botón abajo para seleccionar al azar un estudiante.
                  </p>
                </div>
              )}
            </div>

            {/* Pick Button */}
            <div className="w-full flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handlePickRandomStudent}
                disabled={isPicking || groupStudents.length === 0}
                className="w-full max-w-sm py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-black text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Shuffle className={`w-5 h-5 ${isPicking ? 'animate-spin' : ''}`} />
                <span>{isPicking ? 'Sorteando Estudiante...' : '¡Elegir Estudiante al Azar!'}</span>
              </button>

              {pickedHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPickedHistory([]);
                    setSelectedStudent(null);
                  }}
                  title="Reiniciar Historial de Participación"
                  className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Participation History & List */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Han Participado ({pickedHistory.length} / {groupStudents.length})</span>
              </h3>
              {pickedHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPickedHistory([])}
                  className="text-[10px] text-purple-400 hover:underline font-bold"
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {groupStudents.map((st) => {
                const hasParticipated = pickedHistory.includes(st.id);
                return (
                  <div
                    key={st.id}
                    className={`p-2 rounded-xl flex items-center justify-between border transition-all ${
                      hasParticipated
                        ? 'bg-purple-950/40 border-purple-800/50 text-purple-200'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-500">#{st.listNumber}</span>
                      <span className="font-semibold text-slate-200">{st.lastName}, {st.firstName}</span>
                    </div>
                    {hasParticipated ? (
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-slate-600 font-semibold">Pendiente</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: GENERADOR DE EQUIPOS DE TRABAJO */}
      {/* ========================================================================= */}
      {activeSubTab === 'teams' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-300">Tamaño del Equipo:</label>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value={2}>Parejas (2 estudiantes por equipo)</option>
                <option value={3}>Tríos (3 estudiantes por equipo)</option>
                <option value={4}>Cuartetos (4 estudiantes por equipo)</option>
                <option value={5}>Grupos de 5 estudiantes</option>
                <option value={6}>Grupos de 6 estudiantes</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateTeams}
                disabled={groupStudents.length === 0}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Shuffle className="w-4 h-4" />
                <span>Mezclar y Formar Equipos</span>
              </button>

              {generatedTeams.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyTeams}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {hasCopiedTeams ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{hasCopiedTeams ? '¡Copiado!' : 'Copiar Lista'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Teams Grid */}
          {generatedTeams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedTeams.map((team, idx) => (
                <div
                  key={team.id}
                  className="bg-slate-900 border border-indigo-900/50 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/40">
                        {idx + 1}
                      </div>
                      <span className="font-extrabold text-sm text-white">{team.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                      {team.members.length} est.
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {team.members.map((m, mIdx) => (
                      <div
                        key={m.id}
                        className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                      >
                        <span className="text-slate-200 font-medium">
                          {mIdx + 1}. {m.lastName}, {m.firstName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">#{m.listNumber}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-3">
              <Users className="w-12 h-12 mx-auto opacity-40" />
              <p className="text-sm font-semibold">
                Haz clic en <b>"Mezclar y Formar Equipos"</b> para agrupar a los {groupStudents.length} estudiantes de {group.name}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: SEMÁFORO DE VOZ Y DINÁMICA DE AULA */}
      {/* ========================================================================= */}
      {activeSubTab === 'traffic-light' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Level Projection Card */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-between space-y-6">
            <div className="w-full text-center">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 font-bold text-xs border border-slate-700">
                Nivel Actual de Ruido y Voz Proyectado en Aula
              </span>
            </div>

            {/* Big Active Voice Indicator */}
            {VOICE_LEVELS.filter((v) => v.level === currentVoiceLevel).map((vl) => (
              <div key={vl.level} className="text-center space-y-4 py-4">
                <div
                  className={`w-28 h-28 mx-auto rounded-full ${vl.color} ${vl.glow} shadow-2xl flex items-center justify-center text-slate-950 font-black text-4xl border-4 border-white/40 animate-pulse`}
                >
                  {vl.level}
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">{vl.titleEs}</h2>
                  <h3 className="text-base font-bold text-slate-400">{vl.titleEn}</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                    {vl.desc}
                  </p>
                </div>
              </div>
            ))}

            <div className="w-full flex items-center justify-center gap-2">
              <span className="text-xs text-slate-400">
                Tip: Proyecta esta pantalla en la televisión o proyector escolar durante actividades de grupo.
              </span>
            </div>
          </div>

          {/* 4 Levels Selector Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-sm font-extrabold text-white">Selecciona el Nivel de Voz:</h3>

            {VOICE_LEVELS.map((vl) => (
              <div
                key={vl.level}
                onClick={() => {
                  setCurrentVoiceLevel(vl.level);
                  soundManager.playTick();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  currentVoiceLevel === vl.level
                    ? `${vl.badge} shadow-lg scale-[1.02]`
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full ${vl.color} shrink-0`} />
                  <div>
                    <div className="font-extrabold text-xs text-white">{vl.titleEs}</div>
                    <div className="text-[11px] text-slate-400 leading-snug mt-0.5">{vl.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: PIZARRA Y AGENDA DE AULA */}
      {/* ========================================================================= */}
      {activeSubTab === 'scratchpad' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white">Pizarra Rápida de Avisos del Día</h3>
              <p className="text-xs text-slate-400">
                Anota la agenda, vocabulario meta y tareas para proyectar durante la clase.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveScratchpad}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Notas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Daily Agenda */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-extrabold text-blue-400 uppercase tracking-wider mb-1">
                  1. Agenda de la Clase / Daily Agenda:
                </label>
                <textarea
                  rows={8}
                  value={scratchpadAgenda}
                  onChange={(e) => setScratchpadAgenda(e.target.value)}
                  placeholder="Escribe aquí los puntos de la clase..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none font-mono"
                />
              </div>
            </div>

            {/* 2. Target Vocabulary */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-extrabold text-purple-400 uppercase tracking-wider mb-1">
                  2. Vocabulario Meta / Target Words:
                </label>
                <textarea
                  rows={8}
                  value={scratchpadWords}
                  onChange={(e) => setScratchpadWords(e.target.value)}
                  placeholder="Palabras clave del día..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none font-mono"
                />
              </div>
            </div>

            {/* 3. Homework & Deadlines */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-extrabold text-amber-400 uppercase tracking-wider mb-1">
                  3. Tareas & Fechas Límite / Homework:
                </label>
                <textarea
                  rows={8}
                  value={scratchpadHomework}
                  onChange={(e) => setScratchpadHomework(e.target.value)}
                  placeholder="Asignaciones pendientes..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
