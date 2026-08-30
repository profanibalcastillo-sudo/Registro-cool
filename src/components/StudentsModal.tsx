import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Edit2, X, CheckCircle2 } from 'lucide-react';
import { Student, Group } from '../types';

interface StudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  students: Student[];
  onAddStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

export const StudentsModal: React.FC<StudentsModalProps> = ({
  isOpen,
  onClose,
  group,
  students,
  onAddStudent,
  onDeleteStudent,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');

  if (!isOpen) return null;

  const groupStudents = students
    .filter((s) => s.groupId === group.id)
    .sort((a, b) => (a.listNumber || 0) - (b.listNumber || 0));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const generatedCedula = documentId.trim() || `4-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudent: Student = {
      id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      groupId: group.id,
      listNumber: groupStudents.length + 1,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      cedula: generatedCedula,
      documentId: generatedCedula,
      gender,
      guardianName: '',
      guardianPhone: '',
      status: 'Activo',
      active: true,
      createdAt: new Date().toISOString(),
    };

    onAddStudent(newStudent);
    setFirstName('');
    setLastName('');
    setDocumentId('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Gestión de Estudiantes – {group.name}
              </h3>
              <p className="text-xs text-slate-400">
                {groupStudents.length} estudiantes registrados en la lista oficial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Student Quick Form */}
        <form onSubmit={handleCreate} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-blue-400" />
            <span>Registrar Nuevo Estudiante</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div>
              <input
                type="text"
                required
                placeholder="Apellidos..."
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <input
                type="text"
                required
                placeholder="Nombres..."
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Cédula (ej: 4-780-1234)"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
              >
                + Agregar
              </button>
            </div>
          </div>
        </form>

        {/* Students Table */}
        <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold sticky top-0">
              <tr className="border-b border-slate-800">
                <th className="p-2.5 text-center w-12">#</th>
                <th className="p-2.5">Apellidos y Nombres</th>
                <th className="p-2.5">Cédula</th>
                <th className="p-2.5 text-center w-16">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {groupStudents.map((st, idx) => (
                <tr key={st.id} className="hover:bg-slate-800/40">
                  <td className="p-2.5 text-center font-mono text-slate-400 font-bold">
                    {st.listNumber || idx + 1}
                  </td>
                  <td className="p-2.5 font-bold text-white">
                    {st.lastName}, {st.firstName}
                  </td>
                  <td className="p-2.5 text-slate-400 font-mono">
                    {st.documentId}
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteStudent(st.id)}
                      title="Eliminar de la lista"
                      className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
