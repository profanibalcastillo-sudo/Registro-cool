import React, { useState, useEffect, useCallback } from 'react';
import { useFirebaseSync } from './services/useFirebaseSync';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { GradebookView } from './components/GradebookView';
import { AttendanceView } from './components/AttendanceView';
import { ScheduleView } from './components/ScheduleView';
import { ThemePlannerView } from './components/ThemePlannerView';
import { WeeklyPlannerView } from './components/WeeklyPlannerView';
import { ClassroomToolsView } from './components/ClassroomToolsView';
import { CalendarSettingsModal } from './components/CalendarSettingsModal';
import { StudentsModal } from './components/StudentsModal';
import { GroupsModal } from './components/GroupsModal';
import { TeacherSignatureModal } from './components/TeacherSignatureModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { DeployGuideModal } from './components/DeployGuideModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { getCurrentPeriodInfo } from './data/initialData';
import { playSchoolBell, playWarningBell } from './services/soundEffects';
import { CurrentPeriodInfo, ThemePlanner } from './types';

export function App() {
  const {
    user,
    isLoadingUser,
    syncStatus,
    groups,
    selectedGroupId,
    setSelectedGroupId,
    selectedTrimester,
    setSelectedTrimester,
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
    login,
    logout,
    addGroup,
    updateGroup,
    deleteGroup,
    updateGrade,
    addEvaluationColumn,
    deleteEvaluationColumn,
    updateEvaluationColumn,
    updateAttendanceRecord,
    bulkUpdateAttendanceRecords,
    saveThemePlanner,
    saveWeeklyPlanner,
    updateScheduleSlot,
    saveCalendarConfig,
    saveTeacherInfo,
    addStudent,
    updateStudent,
    deleteStudent,
    manualSync,
    exportBackupData,
    downloadBackupJSON,
    importBackupData,
    localSnapshots,
    createLocalSnapshot,
    restoreLocalSnapshot,
    deleteLocalSnapshot,
    getStorageDiagnostics,
  } = useFirebaseSync();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'gradebook' | 'attendance' | 'schedule' | 'theme-planner' | 'weekly-planner' | 'classroom-tools'
  >('gradebook');

  // Modals state
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Audio Bell State & Countdown
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [currentPeriodInfo, setCurrentPeriodInfo] = useState<CurrentPeriodInfo>(() =>
    getCurrentPeriodInfo(schedulePeriods)
  );

  // Timer loop for period info and auto-bell
  useEffect(() => {
    let lastPeriodNumber = currentPeriodInfo.period?.periodNumber || 0;
    let warnedForPeriod = 0;

    const interval = setInterval(() => {
      const info = getCurrentPeriodInfo(schedulePeriods);
      setCurrentPeriodInfo(info);

      // Automated sound alerts during school hours
      if (isSoundEnabled && info.isSchoolHours && info.period) {
        // Period change bell
        if (info.period.periodNumber !== lastPeriodNumber) {
          playSchoolBell(0.6);
          lastPeriodNumber = info.period.periodNumber;
        }

        // 5-minute pre-warning chime
        if (info.minutesRemaining === 5 && warnedForPeriod !== info.period.periodNumber) {
          playWarningBell(0.5);
          warnedForPeriod = info.period.periodNumber;
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [schedulePeriods, isSoundEnabled, currentPeriodInfo.period]);

  // Trigger manual test bell
  const handleTriggerBellSound = useCallback(() => {
    playSchoolBell(0.7);
  }, []);

  // Direct access is active by default; LoginScreen can be rendered optionally if user explicitly clicks logout
  if (!user && !isLoadingUser) {
    const defaultUser = {
      uid: 'anibal-castillo-meduca-chiriqui',
      email: 'profanibalcastillo@gmail.com',
      displayName: 'Prof. Aníbal Castillo',
      photoURL: teacherInfo?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };
    login('safari_ipad');
  }

  // Selected Group Helper
  const selectedGroup =
    groups.find((g) => g.id === selectedGroupId) ||
    groups[0] || {
      id: 'grp-7a',
      name: '7° A',
      grade: '7mo Grado',
      subject: 'English Language',
      academicYear: 2026,
      studentsCount: 28,
    };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        groups={groups}
        selectedGroupId={selectedGroupId}
        onGroupChange={setSelectedGroupId}
        selectedTrimester={selectedTrimester}
        onTrimesterChange={setSelectedTrimester}
        user={user}
        onLogout={logout}
        syncStatus={syncStatus}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
        onOpenStudentsModal={() => setIsStudentsModalOpen(true)}
        onOpenGroupsModal={() => setIsGroupsModalOpen(true)}
        onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenDeployGuide={() => setIsDeployModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        currentPeriodInfo={currentPeriodInfo}
        onTriggerBellSound={handleTriggerBellSound}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'gradebook' && (
          <GradebookView
            group={selectedGroup}
            students={students}
            columns={evaluationColumns}
            grades={grades}
            trimester={selectedTrimester}
            calendarConfig={calendarConfig}
            onUpdateGrade={updateGrade}
            onAddColumn={addEvaluationColumn}
            onDeleteColumn={deleteEvaluationColumn}
            onUpdateColumn={updateEvaluationColumn}
            onOpenAiRubric={() => setIsAiModalOpen(true)}
            onOpenAiObservations={() => setIsAiModalOpen(true)}
            teacherInfo={teacherInfo}
            attendanceRecords={attendanceRecords}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceView
            group={selectedGroup}
            students={students}
            attendanceRecords={attendanceRecords}
            trimester={selectedTrimester}
            onUpdateAttendance={updateAttendanceRecord}
            onBulkUpdateAttendance={bulkUpdateAttendanceRecords}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            periods={schedulePeriods}
            slots={scheduleSlots}
            currentPeriodInfo={currentPeriodInfo}
            onUpdateSlot={updateScheduleSlot}
            isSoundEnabled={isSoundEnabled}
            onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
          />
        )}

        {activeTab === 'theme-planner' && (
          <ThemePlannerView
            group={selectedGroup}
            trimester={selectedTrimester}
            themePlanners={themePlanners}
            onSaveThemePlanner={saveThemePlanner}
            onOpenAiPlanner={() => setIsAiModalOpen(true)}
            teacherInfo={teacherInfo}
          />
        )}

        {activeTab === 'weekly-planner' && (
          <WeeklyPlannerView
            group={selectedGroup}
            trimester={selectedTrimester}
            weeklyPlanners={weeklyPlanners}
            onSaveWeeklyPlanner={saveWeeklyPlanner}
            onOpenAiPlanner={() => setIsAiModalOpen(true)}
            teacherInfo={teacherInfo}
          />
        )}

        {activeTab === 'classroom-tools' && (
          <ClassroomToolsView
            group={selectedGroup}
            students={students}
            teacherInfo={teacherInfo}
          />
        )}
      </main>

      {/* Auxiliary Modals */}
      <GroupsModal
        isOpen={isGroupsModalOpen}
        onClose={() => setIsGroupsModalOpen(false)}
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={(id) => {
          setSelectedGroupId(id);
          setIsGroupsModalOpen(false);
        }}
        onAddGroup={addGroup}
        onUpdateGroup={updateGroup}
        onDeleteGroup={deleteGroup}
      />

      <CalendarSettingsModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        calendarConfig={calendarConfig}
        onSaveCalendarConfig={saveCalendarConfig}
      />

      <StudentsModal
        isOpen={isStudentsModalOpen}
        onClose={() => setIsStudentsModalOpen(false)}
        group={selectedGroup}
        groups={groups}
        onSelectGroup={setSelectedGroupId}
        students={students}
        onAddStudent={addStudent}
        onUpdateStudent={updateStudent}
        onDeleteStudent={deleteStudent}
      />

      <TeacherSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        teacherInfo={teacherInfo}
        onSaveTeacherInfo={saveTeacherInfo}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Backup, Export & Import Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        groups={groups}
        students={students}
        evaluationColumns={evaluationColumns}
        grades={grades}
        attendanceRecords={attendanceRecords}
        themePlanners={themePlanners}
        weeklyPlanners={weeklyPlanners}
        scheduleSlots={scheduleSlots}
        schedulePeriods={schedulePeriods}
        calendarConfig={calendarConfig}
        teacherInfo={teacherInfo}
        exportBackupData={exportBackupData}
        downloadBackupJSON={downloadBackupJSON}
        importBackupData={importBackupData}
        localSnapshots={localSnapshots}
        createLocalSnapshot={createLocalSnapshot}
        restoreLocalSnapshot={restoreLocalSnapshot}
        deleteLocalSnapshot={deleteLocalSnapshot}
        getStorageDiagnostics={getStorageDiagnostics}
        syncStatus={syncStatus}
        onManualCloudSync={manualSync}
      />

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        groups={groups}
        group={selectedGroup}
        selectedGroupId={selectedGroupId}
        selectedTrimester={selectedTrimester}
        trimester={selectedTrimester}
        students={students}
        grades={grades}
        evaluationColumns={evaluationColumns}
        onInsertThemePlanner={(planner) => {
          if (planner) {
            saveThemePlanner(planner as ThemePlanner);
            setActiveTab('theme-planner');
          }
        }}
        onAddEvaluationColumn={(col, maxScore) => {
          const title = typeof col === 'string' ? col : col.title;
          const category = typeof col === 'string' ? 'summative' : (col.category || 'summative');
          const score = typeof col === 'string' ? (maxScore || 5.0) : (col.maxScore || 5.0);
          addEvaluationColumn({
            id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            groupId: selectedGroup.id,
            trimester: selectedTrimester,
            title,
            category,
            maxScore: score,
            weight: 1,
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
          });
          setActiveTab('gradebook');
        }}
      />

      {/* Deploy to GitHub / Vercel Guide Modal */}
      <DeployGuideModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
      />

      {/* App Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500">
        <p>
          © 2026 Registro Pedagógico Digital • Prof. Aníbal Castillo • República de Panamá
          (MEDUCA). Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}

export default App;
