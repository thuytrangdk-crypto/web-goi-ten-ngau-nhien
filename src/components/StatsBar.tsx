import React from 'react';
import { Users, CheckCircle2, Clock, ShieldCheck, RefreshCw } from 'lucide-react';

interface StatsBarProps {
  totalCount: number;
  calledCount: number;
  remainingCount: number;
  noRepeat: boolean;
  onResetRound: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  totalCount,
  calledCount,
  remainingCount,
  noRepeat,
  onResetRound,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 my-2">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-sm">
        {/* Số liệu thống kê */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Tổng số */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-500 dark:text-slate-400">Tổng:</span>
            <span className="font-bold text-slate-900 dark:text-white">{totalCount}</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" aria-hidden="true">|</span>

          {/* Đã gọi */}
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-500 dark:text-slate-400">Đã gọi:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{calledCount}</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" aria-hidden="true">|</span>

          {/* Chưa gọi */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-slate-500 dark:text-slate-400">Chưa gọi:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{remainingCount}</span>
          </div>
        </div>

        {/* Chế độ chống trùng & Nút Đặt lại vòng */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>{noRepeat ? 'Không gọi trùng' : 'Có thể trùng'}</span>
          </div>

          {noRepeat && calledCount > 0 && (
            <button
              onClick={onResetRound}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition-colors"
              title="Đặt lại vòng gọi để tất cả học sinh có thể được gọi lại"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Vòng mới</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
