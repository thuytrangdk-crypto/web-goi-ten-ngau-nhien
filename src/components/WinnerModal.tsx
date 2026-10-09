import React, { useEffect, useRef } from 'react';
import { Sparkles, X, ArrowRight, UserCheck } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { soundManager } from '../utils/audio';

interface WinnerModalProps {
  studentName: string | null;
  className: string;
  orderNumber: number;
  reducedMotion: boolean;
  onClose: () => void;
  onCallNext: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  studentName,
  className,
  orderNumber,
  reducedMotion,
  onClose,
  onCallNext,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (studentName) {
      soundManager.playCelebration();
      if (!reducedMotion && canvasRef.current) {
        const cleanup = triggerConfetti(canvasRef.current);
        return cleanup;
      }
    }
  }, [studentName, reducedMotion]);

  if (!studentName) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
    >
      {/* Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 w-full h-full"
      />

      <div className="relative z-20 w-full max-w-xl overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-white/10 dark:text-white transition-all transform scale-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Đóng"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Decorative badge / tag */}
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-400/20 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>CHÚC MỪNG HỌC SINH ĐƯỢC GỌI</span>
        </div>

        {/* Subtitle with Class & Order */}
        <div className="flex items-center justify-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
          <span>{className}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <UserCheck className="w-4 h-4" />
            Lượt #{orderNumber}
          </span>
        </div>

        {/* Huge Student Name - Highly legible from a distance */}
        <div className="my-6 py-4 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white break-words">
            {studentName}
          </h2>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 italic">
          "Mỗi học sinh – Một cơ hội tỏa sáng"
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onCallNext}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-base shadow-lg shadow-blue-600/25 transition-all duration-150"
          >
            <span>GỌI TIẾP</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-base transition-colors"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
};
