import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  School,
  Sparkles,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  Filter,
  Check,
  HelpCircle,
} from 'lucide-react';
import { Group, Student } from '../types';

interface GroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  onAddGroup: (group: Group, sampleStudents?: Student[]) => void;
  onUpdateGroup: (group: Group) => void;
  onDeleteGroup: (groupId: string) => void;
}

export const GroupsModal: React.FC<GroupsModalProps> = ({
  isOpen,
  onClose,
  groups,
  selectedGroupId,
  onSelectGroup,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
}) => {
  const [levelFilter, setLevelFilter] = useState<'all' | 'Primaria' | 'Premedia' | 'Media'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Form State
  const [formLevel, setFormLevel] = useState<'Primaria' | 'Premedia' | 'Media'>('Primaria');
  const [formGrade, setFormGrade] = useState('3° Grado');
  const [formName, setFormName] = useState('3° Grado A');
  const [formSubject, setFormSubject] = useState('Inglés (English)');
  const [formTrack, setFormTrack] = useState('Educación General');
  const [formRoom, setFormRoom] = useState('Aula 05');
  const [formShift, setFormShift] = useState<'Matutino' | 'Vespertino' | 'Completa'>('Matutino');
  const [formYear, setFormYear] = useState(2026);
  const [includeSampleStudents, setIncludeSampleStudents] = useState(true);

  if (!isOpen) return null;

  const filteredGroups = groups.filter((g) => {
    if (levelFilter === 'all') return true;
    return g.educationLevel === levelFilter;
  });

  const getLevelBadge = (level?: 'Primaria' | 'Premedia' | 'Media') => {
    switch (level) {
      case 'Primaria':
        return {
          label: 'Primaria (Elementary)',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <School className="w-3 h-3 text-emerald-400" />,
        };
      case 'Media':
        return {
          label: 'Media (High School)',
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: <GraduationCap className="w-3 h-3 text-purple-400" />,
        };
      case 'Premedia':
      default:
        return {
          label: 'Premedia (Middle School)',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: <BookOpen className="w-3 h-3 text-blue-400" />,
        };
    }
  };

  const handleLevelChange = (lvl: 'Primaria' | 'Premedia' | 'Media') => {
    setFormLevel(lvl);
    if (lvl === 'Primaria') {
      setFormGrade('3° Grado');
      setFormName('3° Grado A');
      setFormTrack('Educación General Primaria');
      setFormRoom('Aula 04');
    } else if (lvl === 'Premedia') {
      setFormGrade('7mo Grado');
      setFormName('7° Grado A');
      setFormTrack('Premedia General');
      setFormRoom('Aula 12');
    } else {
      setFormGrade('10° Grado');
      setFormName('10° Ciencias A');
      setFormTrack('Bachillerato en Ciencias');
      setFormRoom('Aula 21');
    }
  };

  const startEditGroup = (g: Group) => {
    setEditingGroupId(g.id);
    setFormLevel(g.educationLevel || 'Premedia');
    setFormGrade(g.grade || g.gradeLevel || '7mo Grado');
    setFormName(g.name);
    setFormSubject(g.subject || 'Inglés (English)');
    setFormTrack(g.track || 'Educación General');
    setFormRoom(g.roomNumber || 'Aula 01');
    setFormShift(g.shift || 'Matutino');
    setFormYear(g.academicYear || 2026);
    setIsCreating(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroupId) return;

    const existing = groups.find((g) => g.id === editingGroupId);
    if (!existing) return;

    const updated: Group = {
      ...existing,
      name: formName.trim(),
      grade: formGrade,
      gradeLevel: formGrade,
      subject: formSubject.trim(),
      educationLevel: formLevel,
      track: formTrack.trim(),
      roomNumber: formRoom.trim(),
      shift: formShift,
      academicYear: formYear,
    };

    onUpdateGroup(updated);
    setEditingGroupId(null);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newGroupId = `grp-${formLevel.toLowerCase().slice(0, 3)}-${Date.now().toString(36)}`;
    
    // Generate 8 sample students if requested
    let sampleStudents: Student[] | undefined = undefined;
    if (includeSampleStudents) {
      const sampleNames = formLevel === 'Primaria'
        ? [
            { last: 'Álvarez Rios', first: 'Sofía Isabel', gender: 'F' as const },
            { last: 'Barrios Castillo', first: 'Mateo Alejandro', gender: 'M' as const },
            { last: 'Cárdenas Vega', first: 'Valentina Lucía', gender: 'F' as const },
            { last: 'Díaz Morales', first: 'Santiago José', gender: 'M' as const },
            { last: 'González Pinto', first: 'Camila Victoria', gender: 'F' as const },
            { last: 'Navarro Samudio', first: 'Lucas Gabriel', gender: 'M' as const },
            { last: 'Quintero Pittí', first: 'Emma Celeste', gender: 'F' as const },
            { last: 'Villarreal Cruz', first: 'Daniel Andrés', gender: 'M' as const },
          ]
        : formLevel === 'Media'
        ? [
            { last: 'Aparicio Batista', first: 'Carlos Eduardo', gender: 'M' as const },
            { last: 'Bermúdez Chen', first: 'Mariana Nicole', gender: 'F' as const },
            { last: 'Castillo Serrano', first: 'Jorge Alberto', gender: 'M' as const },
            { last: 'De León Miranda', first: 'Adriana Gabriela', gender: 'F' as const },
            { last: 'Espinosa Ortega', first: 'Fernando José', gender: 'M' as const },
            { last: 'Guerra Pimentel', first: 'Valeria Stephanie', gender: 'F' as const },
            { last: 'Lasso Montenegro', first: 'Diego Alonso', gender: 'M' as const },
            { last: 'Santamaría Ríos', first: 'Paola Cristina', gender: 'F' as const },
          ]
        : [
            { last: 'Ábrego Miranda', first: 'Carlos Andrés', gender: 'M' as const },
            { last: 'Araúz Villarreal', first: 'Valeria Sofía', gender: 'F' as const },
            { last: 'Bejerano Santos', first: 'Erick Javier', gender: 'M' as const },
            { last: 'Castillo Pinzón', first: 'Ana Gabriela', gender: 'F' as const },
            { last: 'De Gracia Pittí', first: 'Mateo Alejandro', gender: 'M' as const },
            { last: 'Espinosa Morales', first: 'Daniela Lucia', gender: 'F' as const },
          ];

      sampleStudents = sampleNames.map((s, idx) => {
        const generatedCedula = `4-${Math.floor(700 + Math.random() * 200)}-${Math.floor(1000 + Math.random() * 9000)}`;
        return {
          id: `std-${newGroupId}-${idx + 1}`,
          groupId: newGroupId,
          listNumber: idx + 1,
          cedula: generatedCedula,
          documentId: generatedCedula,
          lastName: s.last,
          firstName: s.first,
          gender: s.gender,
          guardianName: `Acudiente de ${s.first}`,
          guardianPhone: `+507 6${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'Activo',
          active: true,
          notes: `Estudiante registrado en ${formName}.`,
          createdAt: new Date().toISOString(),
        };
      });
    }

    const newGroup: Group = {
      id: newGroupId,
      name: formName.trim(),
      grade: formGrade,
      gradeLevel: formGrade,
      subject: formSubject.trim(),
      educationLevel: formLevel,
      track: formTrack.trim(),
      academicYear: formYear,
      roomNumber: formRoom.trim(),
      shift: formShift,
      studentsCount: sampleStudents ? sampleStudents.length : 0,
      studentCount: sampleStudents ? sampleStudents.length : 0,
    };

    onAddGroup(newGroup, sampleStudents);
    onSelectGroup(newGroupId);
    setIsCreating(false);
  };

  const quickSubjects = [
    'Inglés (English)',
    'Español / Lengua',
    'Matemáticas',
    'Ciencias Naturales',
    'Ciencias Sociales',
    'Biología',
    'Química',
    'Física',
    'Informática / Tecnología',
    'Comercio / Contabilidad',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl space-y-6 max-h-[92vh] flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-lg tracking-tight">
                  Gestión de Grupos y Grados Académicos
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 text-[10px] font-bold uppercase">
                  Primaria • Premedia • Media
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Administra tus salones y materias para Primaria (1°-6°), Premedia (7°-9°) y Media / Bachillerato (10°-12°).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Level Tabs & Create Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setLevelFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                levelFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({groups.length})
            </button>
            <button
              type="button"
              onClick={() => setLevelFilter('Primaria')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                levelFilter === 'Primaria'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Primaria (Elementary)</span>
            </button>
            <button
              type="button"
              onClick={() => setLevelFilter('Premedia')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                levelFilter === 'Premedia'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-blue-400'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Premedia (7°-9°)</span>
            </button>
            <button
              type="button"
              onClick={() => setLevelFilter('Media')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                levelFilter === 'Media'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-purple-400'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Media (High School)</span>
            </button>
          </div>

          {!isCreating && !editingGroupId && (
            <button
              type="button"
              onClick={() => {
                setIsCreating(true);
                handleLevelChange('Primaria');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Grupo</span>
            </button>
          )}
        </div>

        {/* Create / Edit Form Modal Segment */}
        {(isCreating || editingGroupId) && (
          <form
            onSubmit={editingGroupId ? handleSaveEdit : handleCreateGroup}
            className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-inner"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h4 className="font-bold text-white text-sm">
                  {editingGroupId ? 'Editar Grupo / Grado' : 'Configurar y Registrar Nuevo Grupo'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingGroupId(null);
                }}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            {/* Level Selector Segment */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Nivel Educativo MEDUCA:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleLevelChange('Primaria')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    formLevel === 'Primaria'
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs mb-1">
                    <School className="w-4 h-4 text-emerald-400" />
                    <span>Primaria</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Elementary (1° a 6° Grado)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLevelChange('Premedia')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    formLevel === 'Premedia'
                      ? 'bg-blue-950/70 border-blue-500 text-blue-200 ring-1 ring-blue-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs mb-1">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>Premedia</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Middle School (7°, 8°, 9°)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLevelChange('Media')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    formLevel === 'Media'
                      ? 'bg-purple-950/70 border-purple-500 text-purple-200 ring-1 ring-purple-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs mb-1">
                    <GraduationCap className="w-4 h-4 text-purple-400" />
                    <span>Media / Bachiller</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    High School (10°, 11°, 12°)
                  </div>
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Specific Grade Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Grado Específico *
                </label>
                <select
                  value={formGrade}
                  onChange={(e) => {
                    setFormGrade(e.target.value);
                    if (!editingGroupId) {
                      setFormName(`${e.target.value} ${formLevel === 'Media' ? 'Ciencias A' : 'A'}`);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {formLevel === 'Primaria' && (
                    <>
                      <option value="1° Grado">1° Grado (Primaria)</option>
                      <option value="2° Grado">2° Grado (Primaria)</option>
                      <option value="3° Grado">3° Grado (Primaria)</option>
                      <option value="4° Grado">4° Grado (Primaria)</option>
                      <option value="5° Grado">5° Grado (Primaria)</option>
                      <option value="6° Grado">6° Grado (Primaria)</option>
                    </>
                  )}
                  {formLevel === 'Premedia' && (
                    <>
                      <option value="7mo Grado">7mo Grado (Premedia)</option>
                      <option value="8vo Grado">8vo Grado (Premedia)</option>
                      <option value="9no Grado">9no Grado (Premedia)</option>
                    </>
                  )}
                  {formLevel === 'Media' && (
                    <>
                      <option value="10° Grado">10° Grado (Media / 4to Año)</option>
                      <option value="11° Grado">11° Grado (Media / 5to Año)</option>
                      <option value="12° Grado">12° Grado (Media / 6to Año)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Group / Section Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Nombre del Salón / Sección *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. 3° Grado A, 10° Ciencias B"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Track / Bachillerato */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Modalidad / Bachillerato
                </label>
                <input
                  type="text"
                  placeholder="ej. Bachillerato en Ciencias / General"
                  value={formTrack}
                  onChange={(e) => setFormTrack(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Subject */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Materia / Asignatura *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Inglés (English Language)"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {/* Quick Subject Chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {quickSubjects.slice(0, 5).map((qs) => (
                    <button
                      key={qs}
                      type="button"
                      onClick={() => setFormSubject(qs)}
                      className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors"
                    >
                      {qs}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room & Shift */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Aula / Salón
                  </label>
                  <input
                    type="text"
                    placeholder="Aula 05"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Jornada
                  </label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Completa">Jornada Completa</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Checkbox for Sample Students when creating */}
            {!editingGroupId && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sampleStudentsCheck"
                  checked={includeSampleStudents}
                  onChange={(e) => setIncludeSampleStudents(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 h-4 w-4 bg-slate-900 cursor-pointer"
                />
                <label htmlFor="sampleStudentsCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Generar automáticamente lista de estudiantes de ejemplo adaptada a este nivel ({formLevel})
                </label>
              </div>
            )}

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingGroupId(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingGroupId ? 'Guardar Cambios' : 'Registrar Grupo'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Groups Cards List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl p-6">
              <Layers className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-300">
                No hay grupos en la categoría seleccionada
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Haz clic en "Crear Nuevo Grupo" para añadir salones de Primaria o High School.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredGroups.map((group) => {
                const badge = getLevelBadge(group.educationLevel);
                const isSelected = group.id === selectedGroupId;

                return (
                  <div
                    key={group.id}
                    className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/70 shadow-lg shadow-blue-950/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Badge & Action Buttons */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${badge.color}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditGroup(group)}
                            title="Editar detalles del grupo"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {groups.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `¿Seguro que deseas eliminar el grupo "${group.name}"? Esta acción no se puede deshacer.`
                                  )
                                ) {
                                  onDeleteGroup(group.id);
                                }
                              }}
                              title="Eliminar grupo"
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Group Name & Subject */}
                      <h4 className="font-extrabold text-white text-base tracking-tight">
                        {group.name}
                      </h4>
                      <p className="text-xs text-slate-300 font-medium">
                        {group.subject || 'Inglés'}
                      </p>
                      {group.track && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {group.track}
                        </p>
                      )}

                      {/* Metadata Chips */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                          <Users className="w-3 h-3 text-blue-400" />
                          <span>{group.studentsCount || 0} estudiantes</span>
                        </span>
                        {group.roomNumber && (
                          <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span>{group.roomNumber}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                          <Clock className="w-3 h-3 text-purple-400" />
                          <span>{group.shift || 'Matutino'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action: Select as Active */}
                    <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                      {isSelected ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Grupo Activo</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectGroup(group.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Seleccionar Grupo</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Total de grupos registrados: <strong className="text-white">{groups.length}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition shadow-md shadow-blue-600/20"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
