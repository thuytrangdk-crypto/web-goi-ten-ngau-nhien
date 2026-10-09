/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  loadStoredClasses,
  saveClasses,
  saveActiveClassId,
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { AppSettings, ClassRoom, PickMode, Student, CallRecord } from './types';
import { generateUniqueId } from './utils/random';
import { soundManager } from './utils/audio';

import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { StatsBar } from './components/StatsBar';
import { WheelMode } from './components/WheelMode';
import { PickerMode } from './components/PickerMode';
import { MysteryBoxMode } from './components/MysteryBoxMode';
import { WinnerModal } from './components/WinnerModal';
import { ClassManagementModal } from './components/ClassManagementModal';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { Users, PlusCircle } from 'lucide-react';

export default function App() {
  // 1. Quản lý State cốt lõi
  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    const { classes } = loadStoredClasses();
    return classes;
  });

  const [activeClassId, setActiveClassId] = useState<string>(() => {
    const { activeId } = loadStoredClasses();
    return activeId;
  });

  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // Modal states
  const [isClassManagerOpen, setIsClassManagerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [recentWinner, setRecentWinner] = useState<{
    student: Student;
    orderNumber: number;
  } | null>(null);

  // 2. Đồng bộ hóa với localStorage và Web Audio API
  useEffect(() => {
    saveClasses(classes);
  }, [classes]);

  useEffect(() => {
    saveActiveClassId(activeClassId);
  }, [activeClassId]);

  useEffect(() => {
    saveSettings(settings);
    soundManager.updateSettings(settings.audio);

    // Dark mode toggle on root html element
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // 3. Lớp học hiện tại
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === activeClassId) || classes[0] || null;
  }, [classes, activeClassId]);

  // Học sinh đủ điều kiện (chưa được gọi nếu bật chống trùng)
  const eligibleStudents = useMemo(() => {
    if (!currentClass) return [];
    if (!settings.noRepeat) return currentClass.students;
    const calledSet = new Set(currentClass.calledStudentIds);
    return currentClass.students.filter((s) => !calledSet.has(s.id));
  }, [currentClass, settings.noRepeat]);

  // 4. Xử lý khi một học sinh được chọn từ bất kỳ chế độ nào
  const handleStudentSelected = useCallback(
    (student: Student) => {
      if (!currentClass) return;

      const modeLabels: Record<PickMode, string> = {
        wheel: 'Vòng quay',
        picker: 'Máy chọn tên',
        mystery: 'Hộp quà bí mật',
      };

      const newRecord: CallRecord = {
        id: generateUniqueId(),
        studentId: student.id,
        studentName: student.name,
        timestamp: Date.now(),
        mode: settings.activeMode,
        modeLabel: modeLabels[settings.activeMode],
      };

      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id !== currentClass.id) return cls;

          const updatedCalled = cls.calledStudentIds.includes(student.id)
            ? cls.calledStudentIds
            : [...cls.calledStudentIds, student.id];

          return {
            ...cls,
            calledStudentIds: updatedCalled,
            history: [...cls.history, newRecord],
          };
        })
      );

      setRecentWinner({
        student,
        orderNumber: currentClass.history.length + 1,
      });
    },
    [currentClass, settings.activeMode]
  );

  // 5. Đặt lại vòng gọi mới (cho phép gọi lại tất cả học sinh mà không xóa lịch sử)
  const handleResetRound = useCallback(() => {
    if (!currentClass) return;
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== currentClass.id) return cls;
        return {
          ...cls,
          calledStudentIds: [],
        };
      })
    );
  }, [currentClass]);

  // 6. Xóa lịch sử gọi
  const handleClearHistory = useCallback(() => {
    if (!currentClass) return;
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== currentClass.id) return cls;
        return {
          ...cls,
          history: [],
        };
      })
    );
  }, [currentClass]);

  // 7. Chuyển đổi theme & âm thanh nhanh từ Header
  const handleToggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };

  const handleToggleSound = () => {
    setSettings((prev) => {
      const nextSfx = !prev.audio.sfxEnabled;
      return {
        ...prev,
        audio: {
          ...prev.audio,
          sfxEnabled: nextSfx,
          bgmEnabled: nextSfx ? prev.audio.bgmEnabled : false,
        },
      };
    });
  };

  const handleUpdateSettings = (newPartial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newPartial }));
  };

  const handleRestoreBackup = (backup: { classes: ClassRoom[]; settings: AppSettings }) => {
    if (backup.classes && backup.classes.length > 0) {
      setClasses(backup.classes);
      setActiveClassId(backup.classes[0].id);
      if (backup.settings) {
        setSettings(backup.settings);
      }
    }
  };

  // 8. Tác vụ quản lý lớp
  const handleCreateClass = (name: string) => {
    const newClass: ClassRoom = {
      id: generateUniqueId(),
      name,
      students: [],
      calledStudentIds: [],
      history: [],
      createdAt: Date.now(),
    };
    setClasses((prev) => [...prev, newClass]);
    setActiveClassId(newClass.id);
  };

  const handleRenameClass = (classId: string, newName: string) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, name: newName } : c))
    );
  };

  const handleDeleteClass = (classId: string) => {
    if (classes.length <= 1) return;
    const remaining = classes.filter((c) => c.id !== classId);
    setClasses(remaining);
    if (activeClassId === classId) {
      setActiveClassId(remaining[0].id);
    }
  };

  const handleAddStudent = (classId: string, name: string) => {
    const newStudent: Student = {
      id: generateUniqueId(),
      name,
      createdAt: Date.now(),
    };
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId ? { ...c, students: [...c.students, newStudent] } : c
      )
    );
  };

  const handleEditStudent = (classId: string, studentId: string, newName: string) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          students: c.students.map((s) =>
            s.id === studentId ? { ...s, name: newName } : s
          ),
        };
      })
    );
  };

  const handleDeleteStudent = (classId: string, studentId: string) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          students: c.students.filter((s) => s.id !== studentId),
          calledStudentIds: c.calledStudentIds.filter((id) => id !== studentId),
        };
      })
    );
  };

  const handleBulkAddStudents = (classId: string, names: string[]) => {
    const baseTime = Date.now();
    const newStudents: Student[] = names.map((name, idx) => ({
      id: `${generateUniqueId()}_${idx}`,
      name,
      createdAt: baseTime + idx,
    }));
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? { ...c, students: [...c.students, ...newStudents] }
          : c
      )
    );
  };

  if (!currentClass) {
    return <div className="p-8 text-center">Đang khởi tạo ứng dụng...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans select-none">
      {/* 1. Header ứng dụng */}
      <Header
        currentClass={currentClass}
        allClasses={classes}
        theme={settings.theme}
        soundEnabled={settings.audio.sfxEnabled}
        onSelectClass={setActiveClassId}
        onToggleTheme={handleToggleTheme}
        onToggleSound={handleToggleSound}
        onOpenClassManager={() => setIsClassManagerOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Thanh chuyển chế độ 3 Tab */}
      <ModeSelector
        activeMode={settings.activeMode}
        onChangeMode={(mode) => handleUpdateSettings({ activeMode: mode })}
      />

      {/* 3. Thanh thống kê lượt gọi */}
      <StatsBar
        totalCount={currentClass.students.length}
        calledCount={currentClass.calledStudentIds.length}
        remainingCount={eligibleStudents.length}
        noRepeat={settings.noRepeat}
        onResetRound={handleResetRound}
      />

      {/* 4. Khu vực trung tâm - Trò chơi tương tác */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 max-w-7xl mx-auto w-full">
        {currentClass.students.length === 0 ? (
          /* Trạng thái lớp chưa có học sinh */
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Lớp {currentClass.name} chưa có học sinh
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Vui lòng thêm học sinh hoặc dán danh sách từ file Excel để bắt đầu gọi tên ngẫu nhiên.
            </p>
            <button
              onClick={() => setIsClassManagerOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Thêm học sinh ngay</span>
            </button>
          </div>
        ) : (
          /* Hiển thị chế độ đang chọn */
          <div className="w-full flex items-center justify-center animate-fade-in">
            {settings.activeMode === 'wheel' && (
              <WheelMode
                students={currentClass.students}
                eligibleStudents={eligibleStudents}
                noRepeat={settings.noRepeat}
                reducedMotion={settings.reducedMotion}
                onStudentSelected={handleStudentSelected}
                onResetRound={handleResetRound}
              />
            )}

            {settings.activeMode === 'picker' && (
              <PickerMode
                students={currentClass.students}
                eligibleStudents={eligibleStudents}
                noRepeat={settings.noRepeat}
                reducedMotion={settings.reducedMotion}
                onStudentSelected={handleStudentSelected}
                onResetRound={handleResetRound}
              />
            )}

            {settings.activeMode === 'mystery' && (
              <MysteryBoxMode
                students={currentClass.students}
                eligibleStudents={eligibleStudents}
                noRepeat={settings.noRepeat}
                reducedMotion={settings.reducedMotion}
                onStudentSelected={handleStudentSelected}
                onResetRound={handleResetRound}
              />
            )}
          </div>
        )}
      </main>

      {/* 5. Modal kết quả chúc mừng */}
      <WinnerModal
        studentName={recentWinner?.student.name || null}
        className={currentClass.name}
        orderNumber={recentWinner?.orderNumber || 1}
        reducedMotion={settings.reducedMotion}
        onClose={() => setRecentWinner(null)}
        onCallNext={() => setRecentWinner(null)}
      />

      {/* 6. Modal Quản lý lớp học */}
      <ClassManagementModal
        isOpen={isClassManagerOpen}
        classes={classes}
        activeClassId={activeClassId}
        onClose={() => setIsClassManagerOpen(false)}
        onSelectClass={setActiveClassId}
        onCreateClass={handleCreateClass}
        onRenameClass={handleRenameClass}
        onDeleteClass={handleDeleteClass}
        onAddStudent={handleAddStudent}
        onEditStudent={handleEditStudent}
        onDeleteStudent={handleDeleteStudent}
        onBulkAddStudents={handleBulkAddStudents}
      />

      {/* 7. Modal Lịch sử */}
      <HistoryModal
        isOpen={isHistoryOpen}
        history={currentClass.history}
        totalStudents={currentClass.students.length}
        calledCount={currentClass.calledStudentIds.length}
        onClose={() => setIsHistoryOpen(false)}
        onClearHistory={handleClearHistory}
        onResetRound={handleResetRound}
      />

      {/* 8. Modal Cài đặt */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        classes={classes}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={handleUpdateSettings}
        onRestoreBackup={handleRestoreBackup}
      />
    </div>
  );
}
