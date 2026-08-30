import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Search,
  FileText,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Layers,
  ArrowRight,
  Check,
  ClipboardList,
} from 'lucide-react';
import { Student, Group } from '../types';

interface StudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  groups?: Group[];
  onSelectGroup?: (groupId: string) => void;
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent?: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

export const StudentsModal: React.FC<StudentsModalProps> = ({
  isOpen,
  onClose,
  group,
  groups,
  onSelectGroup,
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'add' | 'batch'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Activo' | 'Retirado' | 'Trasladado'>('all');

  // Single Add Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Batch Add Form
  const [batchText, setBatchText] = useState('');

  // Edit Student Form State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  if (!isOpen) return null;

  const currentGroupId = group.id;

  const groupStudents = students
    .filter((s) => s.groupId === currentGroupId)
    .sort((a, b) => (a.listNumber || 0) - (b.listNumber || 0));

  const filteredStudents = groupStudents.filter((st) => {
    const matchesSearch =
      st.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.documentId && st.documentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (st.cedula && st.cedula.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || st.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = groupStudents.filter((s) => s.status === 'Activo' || s.active !== false).length;
  const boysCount = groupStudents.filter((s) => s.gender === 'M').length;
  const girlsCount = groupStudents.filter((s) => s.gender === 'F').length;

  const handleCreateSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const generatedCedula =
      documentId.trim() ||
      `4-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newStudent: Student = {
      id: `std-${currentGroupId}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
      groupId: currentGroupId,
      listNumber: groupStudents.length + 1,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      cedula: generatedCedula,
      documentId: generatedCedula,
      gender,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      guardianEmail: guardianEmail.trim(),
      notes: notes.trim(),
      status: 'Activo',
      active: true,
      createdAt: new Date().toISOString(),
    };

    onAddStudent(newStudent);
    setFirstName('');
    setLastName('');
    setDocumentId('');
    setGuardianName('');
    setGuardianPhone('');
    setGuardianEmail('');
    setNotes('');
    setActiveSubTab('list');
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchText.trim()) return;

    // Split lines or commas
    const lines = batchText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let startListNumber = groupStudents.length + 1;

    lines.forEach((line, index) => {
      // Check if format is "LastName, FirstName" or "FirstName LastName"
      let lName = '';
      let fName = '';
      let ced = '';

      if (line.includes(',')) {
        const parts = line.split(',');
        lName = parts[0].trim();
        fName = (parts[1] || '').trim();
      } else {
        const words = line.split(' ');
        if (words.length >= 2) {
          fName = words[0];
          lName = words.slice(1).join(' ');
        } else {
          fName = line;
          lName = 'Estudiante';
        }
      }

      const generatedCedula = `4-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newStudent: Student = {
        id: `std-${currentGroupId}-${Date.now().toString(36)}-${index}`,
        groupId: currentGroupId,
        listNumber: startListNumber + index,
        firstName: fName,
        lastName: lName,
        cedula: generatedCedula,
        documentId: generatedCedula,
        gender: index % 2 === 0 ? 'M' : 'F',
        guardianName: '',
        guardianPhone: '',
        status: 'Activo',
        active: true,
        createdAt: new Date().toISOString(),
      };

      onAddStudent(newStudent);
    });

    setBatchText('');
    setActiveSubTab('list');
  };

  const startEdit = (st: Student) => {
    setEditingStudent({ ...st });
  };

  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !onUpdateStudent) return;
    onUpdateStudent(editingStudent);
    setEditingStudent(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] flex flex-col text-slate-100">
        
        {/* Header & Group Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">
                  Matrícula y Lista de Estudiantes
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-blue-400 border border-slate-700 text-[11px] font-bold">
                  {group.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {group.educationLevel || 'Premedia'} • {group.subject || 'Inglés'} • {groupStudents.length} estudiantes registrados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Quick Group Switcher if provided */}
            {groups && groups.length > 1 && onSelectGroup && (
              <select
                value={group.id}
                onChange={(e) => onSelectGroup(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.educationLevel || 'General'})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation: List, Add Single, Batch Paste */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('list');
                setEditingStudent(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'list' && !editingStudent
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Lista Oficial ({groupStudents.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('add');
                setEditingStudent(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'add'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Nuevo Estudiante</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('batch');
                setEditingStudent(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'batch'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Pegar Lista / Rápido</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
              Activos: {activeCount}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-950/60 border border-blue-500/30 text-blue-300">
              M: {boysCount}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-pink-950/60 border border-pink-500/30 text-pink-300">
              F: {girlsCount}
            </span>
          </div>
        </div>

        {/* 1. EDIT STUDENT MODAL VIEW */}
        {editingStudent && (
          <form
            onSubmit={handleSaveStudentEdit}
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-white text-xs">
                  Editar Datos del Estudiante: {editingStudent.lastName}, {editingStudent.firstName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer underline"
              >
                Cerrar edición
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.lastName}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, lastName: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.firstName}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, firstName: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Cédula / Documento
                </label>
                <input
                  type="text"
                  value={editingStudent.documentId || editingStudent.cedula}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      documentId: e.target.value,
                      cedula: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Género
                </label>
                <select
                  value={editingStudent.gender}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, gender: e.target.value as any })
                  }
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="M">Masculino (M)</option>
                  <option value="F">Femenino (F)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Estado Matrícula
                </label>
                <select
                  value={editingStudent.status || 'Activo'}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      status: e.target.value as any,
                      active: e.target.value === 'Activo',
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Activo">Activo</option>
                  <option value="Retirado">Retirado</option>
                  <option value="Trasladado">Trasladado</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Nombre de Acudiente
                </label>
                <input
                  type="text"
                  value={editingStudent.guardianName || ''}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, guardianName: e.target.value })
                  }
                  placeholder="ej. María Morales"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Teléfono de Contacto / Celular
                </label>
                <input
                  type="text"
                  value={editingStudent.guardianPhone || ''}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, guardianPhone: e.target.value })
                  }
                  placeholder="+507 6789-0123"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Observaciones
                </label>
                <input
                  type="text"
                  value={editingStudent.notes || ''}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, notes: e.target.value })
                  }
                  placeholder="Notas pedagógicas..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. ADD SINGLE STUDENT VIEW */}
        {activeSubTab === 'add' && !editingStudent && (
          <form
            onSubmit={handleCreateSingle}
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-1">
              <UserPlus className="w-4 h-4 text-blue-400" />
              <span>Registrar Estudiante Individual en {group.name}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Castillo Miranda"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Carlos Alberto"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Cédula / Documento (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. 4-823-1102"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Género
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="M">Masculino (M)</option>
                  <option value="F">Femenino (F)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Acudiente (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Nombre de tutor"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  placeholder="+507 6xxx-xxxx"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveSubTab('list')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Registrar en Lista</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. BATCH PASTE VIEW */}
        {activeSubTab === 'batch' && !editingStudent && (
          <form
            onSubmit={handleCreateBatch}
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300 mb-1">
              <ClipboardList className="w-4 h-4 text-purple-400" />
              <span>Pegar Lista de Estudiantes (Importación Rápida)</span>
            </div>
            <p className="text-xs text-slate-400">
              Pega una lista de nombres de Word o Excel (un estudiante por línea o separados por comas como "Apellidos, Nombres").
            </p>

            <textarea
              required
              rows={6}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder="Ábrego Miranda, Carlos Andrés&#10;Araúz Villarreal, Valeria Sofía&#10;Bejerano Santos, Erick Javier&#10;Castillo Pinzón, Ana Gabriela&#10;De Gracia Pittí, Mateo Alejandro"
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder:text-slate-600"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveSubTab('list')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Procesar e Insertar Estudiantes</span>
              </button>
            </div>
          </form>
        )}

        {/* 4. STUDENTS TABLE LIST */}
        <div className="flex-1 flex flex-col space-y-2.5 overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o cédula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Activo')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  statusFilter === 'Activo'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                Activos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Retirado')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  statusFilter === 'Retirado'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                Retirados
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No se encontraron estudiantes para los criterios seleccionados.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 text-center w-12">#</th>
                    <th className="p-2.5">Apellidos y Nombres</th>
                    <th className="p-2.5">Cédula</th>
                    <th className="p-2.5 text-center w-12">Gen</th>
                    <th className="p-2.5">Acudiente / Contacto</th>
                    <th className="p-2.5 text-center w-20">Estado</th>
                    <th className="p-2.5 text-center w-20">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredStudents.map((st, idx) => (
                    <tr
                      key={st.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-2.5 text-center font-mono text-slate-400 font-bold">
                        {st.listNumber || idx + 1}
                      </td>
                      <td className="p-2.5">
                        <div className="font-bold text-white">
                          {st.lastName}, {st.firstName}
                        </div>
                        {st.notes && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">
                            {st.notes}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-300 font-mono">
                        {st.documentId || st.cedula}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            st.gender === 'F'
                              ? 'bg-pink-500/20 text-pink-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {st.gender || 'M'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-300">
                        {st.guardianName ? (
                          <div>
                            <div className="text-slate-200 font-medium text-[11px]">
                              {st.guardianName}
                            </div>
                            {st.guardianPhone && (
                              <div className="text-slate-400 text-[10px] flex items-center gap-1 font-mono">
                                <Phone className="w-2.5 h-2.5" />
                                <span>{st.guardianPhone}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[10px]">Sin acudiente</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            st.status === 'Retirado'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : st.status === 'Trasladado'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {st.status || 'Activo'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(st)}
                            title="Editar estudiante"
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Eliminar al estudiante ${st.lastName}, ${st.firstName}?`
                                )
                              ) {
                                onDeleteStudent(st.id);
                              }
                            }}
                            title="Eliminar de la lista"
                            className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Total en {group.name}: <strong className="text-white">{groupStudents.length}</strong> estudiantes
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition shadow-md shadow-blue-600/30"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
