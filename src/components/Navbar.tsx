import React from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Users,
  LogOut,
  Bell,
  Sparkles,
  Cloud,
  CloudUpload,
  Layers,
  Settings,
  FileText,
  Volume2,
} from 'lucide-react';
import { Group, CurrentPeriodInfo } from '../types';

interface NavbarProps {
  activeTab: 'gradebook' | 'attendance' | 'schedule' | 'theme-planner' | 'weekly-planner';
  onTabChange: (tab: 'gradebook' | 'attendance' | 'schedule' | 'theme-planner' | 'weekly-planner') => void;
  groups: Group[];
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  selectedTrimester: number;
  onTrimesterChange: (trimester: number) => void;
  user: any;
  onLogout: () => void;
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  onOpenCalendarModal: () => void;
  onOpenStudentsModal: () => void;
  onOpenSignatureModal: () => void;
  currentPeriodInfo: CurrentPeriodInfo;
  onTriggerBellSound?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  groups,
  selectedGroupId,
  onGroupChange,
  selectedTrimester,
  onTrimesterChange,
  user,
  onLogout,
  syncStatus,
  onOpenCalendarModal,
  onOpenStudentsModal,
  onOpenSignatureModal,
  currentPeriodInfo,
  onTriggerBellSound,
}) => {
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      {/* Top Banner / Teacher Profile & Live Period Status */}
      <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: MEDUCA Badge & Active Period Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <span>MEDUCA Panamá</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 font-normal">Colegio Secundario • Chiriquí</span>
          </div>

          {/* Current Period Badge */}
          {currentPeriodInfo.isSchoolHours && currentPeriodInfo.period ? (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-600/40 text-blue-300 text-[11px] font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {currentPeriodInfo.period.isRecess ? 'Receso: ' : `Período ${currentPeriodInfo.period.periodNumber}: `}
                {currentPeriodInfo.period.name} ({currentPeriodInfo.period.startTime} - {currentPeriodInfo.period.endTime})
              </span>
              {currentPeriodInfo.timeRemaining && (
                <span className="text-amber-300 font-mono">({currentPeriodInfo.timeRemaining} restante)</span>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px]">
              <Clock className="w-3 h-3" />
              <span>Fuera de jornada de clases</span>
            </div>
          )}
        </div>

        {/* Right: Sound Bell, Cloud Sync, Profile & Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Sound Bell Button */}
          {onTriggerBellSound && (
            <button
              type="button"
              onClick={onTriggerBellSound}
              title="Tocar timbre escolar acústico"
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Probar Timbre</span>
            </button>
          )}

          {/* Cloud Sync State */}
          <div className="flex items-center gap-1.5 text-[11px]">
            {syncStatus === 'syncing' ? (
              <span className="flex items-center gap-1 text-amber-400">
                <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span className="hidden md:inline">Guardando...</span>
              </span>
            ) : syncStatus === 'synced' ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="hidden md:inline">Nube Actualizada</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="hidden md:inline">Sin conexión</span>
              </span>
            )}
          </div>

          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* Teacher User Profile */}
          <div className="flex items-center gap-2">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Docente'}
                className="w-6 h-6 rounded-full border border-blue-400/50 object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[10px] text-white">
                AC
              </div>
            )}
            <div className="text-left hidden lg:block">
              <div className="font-bold text-[11px] text-white leading-tight">
                {user?.displayName || 'Prof. Aníbal Castillo'}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                {user?.email || 'profanibalcastillo@gmail.com'}
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Cerrar Sesión / Cambiar Cuenta"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 transition-colors border border-slate-700 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar: Group Selector, Trimester Tabs, View Navigation */}
      <div className="px-4 py-2.5 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: App Title & Group Selector */}
        <div className="w-full md:w-auto flex flex-wrap items-center justify-between md:justify-start gap-3">
          <div>
            <span className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
              Registro Digital
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-blue-600 text-white tracking-wider">
                2026
              </span>
            </span>
          </div>

          {/* Group / Class Selection Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="group-selector" className="text-xs text-slate-400 font-medium hidden sm:inline">
              Grupo:
            </label>
            <select
              id="group-selector"
              value={selectedGroupId}
              onChange={(e) => onGroupChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} - {group.subject} ({group.studentsCount} est.)
                </option>
              ))}
            </select>
          </div>

          {/* Trimester Tabs */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            {[1, 2, 3].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTrimesterChange(t)}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  selectedTrimester === t
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Trim {t}
              </button>
            ))}
          </div>
        </div>

        {/* Center / Right: Navigation Tabs */}
        <nav className="w-full md:w-auto flex items-center justify-start md:justify-end gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {/* 1. Gradebook */}
          <button
            type="button"
            onClick={() => onTabChange('gradebook')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'gradebook'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Calificaciones</span>
          </button>

          {/* 2. Attendance */}
          <button
            type="button"
            onClick={() => onTabChange('attendance')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Asistencia</span>
          </button>

          {/* 3. Schedule & Live Bell */}
          <button
            type="button"
            onClick={() => onTabChange('schedule')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Horario (9 Períodos)</span>
          </button>

          {/* 4. MEDUCA Theme Planner */}
          <button
            type="button"
            onClick={() => onTabChange('theme-planner')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'theme-planner'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Plan Didáctico (5 Comp.)</span>
          </button>

          {/* 5. Weekly Planner */}
          <button
            type="button"
            onClick={() => onTabChange('weekly-planner')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'weekly-planner'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Plan Semanal</span>
          </button>

          {/* Configuration Tools Menu */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-700">
            <button
              type="button"
              onClick={onOpenStudentsModal}
              title="Gestionar lista de estudiantes"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onOpenCalendarModal}
              title="Configurar calendario de 3 trimestres"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onOpenSignatureModal}
              title="Firma Digital y Datos Docente"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
