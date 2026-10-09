import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { Student } from '../types';
import { secureRandomInt } from '../utils/random';
import { soundManager } from '../utils/audio';

interface PickerModeProps {
  students: Student[];
  eligibleStudents: Student[];
  noRepeat: boolean;
  reducedMotion: boolean;
  onStudentSelected: (student: Student) => void;
  onResetRound: () => void;
}

export const PickerMode: React.FC<PickerModeProps> = ({
  students,
  eligibleStudents,
  noRepeat,
  reducedMotion,
  onStudentSelected,
  onResetRound,
}) => {
  const displayStudents = noRepeat ? eligibleStudents : students;
  const count = displayStudents.length;

  const [isRunning, setIsRunning] = useState(false);
  const [isDecelerating, setIsDecelerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Dọn dẹp interval
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Đảm bảo currentIndex không vượt quá giới hạn
  useEffect(() => {
    if (currentIndex >= count && count > 0) {
      setCurrentIndex(0);
    }
  }, [count, currentIndex]);

  // Bắt đầu nhảy tên nhanh
  const handleStart = () => {
    if (isRunning || isDecelerating || count === 0) return;
    setIsRunning(true);

    const stepSpeed = reducedMotion ? 120 : 60; // ms
    const runStep = () => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % count;
        soundManager.playTick(1.2);
        return next;
      });
      timerRef.current = window.setTimeout(runStep, stepSpeed);
    };

    runStep();
  };

  // Bấm dừng: Chọn trước kết quả công bằng, giảm tốc và dừng chuẩn xác
  const handleStop = () => {
    if (!isRunning || isDecelerating || count === 0) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsRunning(false);
    setIsDecelerating(true);

    // 1. Chọn trước học sinh chiến thắng bằng secureRandomInt
    const winnerIdx = secureRandomInt(count);
    const targetStudent = displayStudents[winnerIdx];

    if (reducedMotion) {
      // Dừng ngay nếu bật reducedMotion
      setCurrentIndex(winnerIdx);
      setIsDecelerating(false);
      onStudentSelected(targetStudent);
      return;
    }

    // Tạo các bước giảm tốc (delays tăng dần)
    const stepsCount = 10;
    const delays = [80, 110, 150, 200, 260, 340, 440, 560, 700, 850];
    let step = 0;

    const decelerateStep = () => {
      step++;
      if (step < stepsCount) {
        setCurrentIndex((prev) => (prev + 1) % count);
        soundManager.playTick(1.0 - (step / stepsCount) * 0.4);
        timerRef.current = window.setTimeout(decelerateStep, delays[step]);
      } else {
        // Bước cuối cùng: dừng chính xác vào vị trí của winner
        setCurrentIndex(winnerIdx);
        setIsDecelerating(false);
        onStudentSelected(targetStudent);
      }
    };

    timerRef.current = window.setTimeout(decelerateStep, delays[0]);
  };

  if (count === 0 && students.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[460px] max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 ring-8 ring-emerald-50 dark:ring-emerald-900/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          ĐÃ GỌI HẾT HỌC SINH TRONG LỚP!
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
          Tất cả {students.length} học sinh trong lớp đã được gọi trong vòng này.
        </p>
        <button
          onClick={onResetRound}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>BẮT ĐẦU VÒNG MỚI</span>
        </button>
      </div>
    );
  }

  const currentDisplayName = displayStudents[currentIndex]?.name || 'Chưa có dữ liệu';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto py-6 px-4">
      {/* Thẻ hiển thị tên lớn trung tâm */}
      <div className="relative w-full overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-8 sm:p-12 text-center shadow-xl border border-slate-200/80 dark:border-slate-800 transition-all">
        {/* Subtle decorative glowing corner */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isRunning
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                : isDecelerating
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {isRunning ? 'Đang xáo trộn tên...' : isDecelerating ? 'Đang giảm tốc...' : 'Sẵn sàng chọn'}
          </span>
        </div>

        {/* Tên học sinh hiển thị siêu lớn, nổi bật */}
        <div className="min-h-[160px] flex items-center justify-center py-6 px-4">
          <div
            className={`text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight transition-transform duration-75 text-slate-900 dark:text-white ${
              isRunning ? 'scale-105 opacity-90' : 'scale-100'
            }`}
          >
            {currentDisplayName}
          </div>
        </div>

        {/* Thông tin số thứ tự hiện tại */}
        <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          {count > 0 ? `Học sinh ${currentIndex + 1} / ${count}` : '0 học sinh'}
        </div>
      </div>

      {/* Bộ nút điều khiển BẮT ĐẦU / DỪNG LẠI */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        {!isRunning && !isDecelerating ? (
          <button
            onClick={handleStart}
            disabled={count === 0}
            className={`inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl text-lg font-bold text-white shadow-xl transition-all duration-150 ${
              count === 0
                ? 'bg-slate-400 cursor-not-allowed opacity-75'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-600/30'
            }`}
          >
            <Play className="w-6 h-6 fill-current" />
            <span>BẮT ĐẦU</span>
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={isDecelerating}
            className={`inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl text-lg font-bold text-white shadow-xl transition-all duration-150 ${
              isDecelerating
                ? 'bg-slate-500 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-rose-600/30'
            }`}
          >
            <Square className="w-6 h-6 fill-current" />
            <span>{isDecelerating ? 'ĐANG CHỌN...' : 'DỪNG LẠI'}</span>
          </button>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
        Nhấn <strong>BẮT ĐẦU</strong> để xáo trộn, sau đó nhấn <strong>DỪNG LẠI</strong> để hệ thống chọn học sinh ngẫu nhiên công bằng.
      </p>
    </div>
  );
};
