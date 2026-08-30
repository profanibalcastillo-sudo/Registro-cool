import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Sparkles,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, Group } from '../types';

interface AttendanceViewProps {
  group: Group;
  students: Student[];
  attendanceRecords: Record<string, AttendanceRecord>;
  trimester: number;
  onUpdateAttendance: (record: AttendanceRecord) => void;
  onBulkUpdateAttendance: (records: AttendanceRecord[]) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  group,
  students,
  attendanceRecords,
  trimester,
  onUpdateAttendance,
  onBulkUpdateAttendance,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [viewTab, setViewTab] = useState<'daily' | 'monthly'>('daily');

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => s.groupId === group.id && s.active)
      .sort((a, b) => (a.listNumber || 0) - (b.listNumber || 0));
  }, [students, group.id]);

  // Handle single attendance toggle
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    const key = `${selectedDate}-${studentId}`;
    const record: AttendanceRecord = {
      id: key,
      studentId,
      groupId: group.id,
      date: selectedDate,
      status,
      periodNumber: 1,
      createdAt: new Date().toISOString(),
    };
    onUpdateAttendance(record);
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    const updates: AttendanceRecord[] = filteredStudents.map((s) => ({
      id: `${selectedDate}-${s.id}`,
      studentId: s.id,
      groupId: group.id,
      date: selectedDate,
      status: 'present',
      periodNumber: 1,
      createdAt: new Date().toISOString(),
    }));
    onBulkUpdateAttendance(updates);
  };

  // Daily stats for selected date
  const dailyStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let justified = 0;

    filteredStudents.forEach((student) => {
      const key = `${selectedDate}-${student.id}`;
      const rec = attendanceRecords[key];
      const status = rec?.status || 'unrecorded';
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else if (status === 'justified') justified++;
    });

    const total = filteredStudents.length;
    const recorded = present + absent + late + justified;
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { present, absent, late, justified, total, recorded, attendanceRate };
  }, [filteredStudents, selectedDate, attendanceRecords]);

  // Navigate date by +/- 1 day
  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-600/20 text-emerald-400 font-bold text-xs uppercase tracking-wider border border-emerald-500/30">
              {group.name} • Control Diario de Asistencia
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            Registro de Asistencia
          </h2>
          <p className="text-xs text-slate-400">
            Control de puntualidad, faltas justificadas y porcentajes de permanencia escolar.
          </p>
        </div>

        {/* Date Selector and Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Quick Date Switcher */}
          <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-1">
            <button
              type="button"
              onClick={() => changeDate(-1)}
              title="Día anterior"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-xs font-bold px-2 py-1 focus:outline-none cursor-pointer"
            />
            <button
              type="button"
              onClick={() => changeDate(1)}
              title="Día siguiente"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mark All Present */}
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Marcar Todos Presentes</span>
          </button>
        </div>
      </div>

      {/* Daily Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Matrícula</div>
            <div className="text-xl font-black text-white mt-0.5">{dailyStats.total}</div>
          </div>
          <Users className="w-6 h-6 text-slate-600" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-emerald-400 uppercase">Presentes</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{dailyStats.present}</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500/40" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-rose-400 uppercase">Ausentes</div>
            <div className="text-xl font-black text-rose-400 mt-0.5">{dailyStats.absent}</div>
          </div>
          <XCircle className="w-6 h-6 text-rose-500/40" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-amber-400 uppercase">Tardanzas</div>
            <div className="text-xl font-black text-amber-400 mt-0.5">{dailyStats.late}</div>
          </div>
          <Clock className="w-6 h-6 text-amber-500/40" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <div className="text-[10px] font-bold text-blue-400 uppercase">% Asistencia</div>
            <div className="text-xl font-black text-blue-300 mt-0.5">{dailyStats.attendanceRate}%</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs">
            %
          </div>
        </div>
      </div>

      {/* Attendance List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">
              Listado del Día: {selectedDate}
            </h3>
            <p className="text-xs text-slate-400">
              Selecciona el estado con un clic directo para registrar la asistencia.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/> Presente</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"/> Ausente</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"/> Tardanza</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"/> Justificada</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3 min-w-[240px]">Estudiante</th>
                <th className="p-3 text-center min-w-[320px]">Estado de Asistencia</th>
                <th className="p-3 text-center min-w-[120px]">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredStudents.map((student, idx) => {
                const key = `${selectedDate}-${student.id}`;
                const record = attendanceRecords[key];
                const currentStatus: AttendanceStatus = record?.status || 'unrecorded';

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
                        Cédula: {student.documentId}
                      </div>
                    </td>

                    {/* Interactive Buttons */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'present')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                              : 'bg-slate-800 text-slate-400 hover:text-emerald-300 hover:bg-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>P</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'absent')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                              : 'bg-slate-800 text-slate-400 hover:text-rose-300 hover:bg-slate-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>A</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'late')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                            currentStatus === 'late'
                              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                              : 'bg-slate-800 text-slate-400 hover:text-amber-300 hover:bg-slate-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>T</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'justified')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                            currentStatus === 'justified'
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                              : 'bg-slate-800 text-slate-400 hover:text-blue-300 hover:bg-slate-700'
                          }`}
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>J</span>
                        </button>
                      </div>
                    </td>

                    {/* Note input */}
                    <td className="p-2 text-center">
                      <input
                        type="text"
                        placeholder="Nota o excusa..."
                        value={record?.notes || ''}
                        onChange={(e) => {
                          const updatedRecord: AttendanceRecord = {
                            id: key,
                            studentId: student.id,
                            groupId: group.id,
                            date: selectedDate,
                            status: currentStatus === 'unrecorded' ? 'present' : currentStatus,
                            notes: e.target.value,
                            periodNumber: 1,
                            createdAt: record?.createdAt || new Date().toISOString(),
                          };
                          onUpdateAttendance(updatedRecord);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
