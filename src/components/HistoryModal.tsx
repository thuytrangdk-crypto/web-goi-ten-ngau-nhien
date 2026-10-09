import React, { useState } from 'react';
import { X, Trash2, RefreshCw, History, AlertTriangle, Calendar, Tag } from 'lucide-react';
import { CallRecord } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  history: CallRecord[];
  totalStudents: number;
  calledCount: number;
  onClose: () => void;
  onClearHistory: () => void;
  onResetRound: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  history,
  totalStudents,
  calledCount,
  onClose,
  onClearHistory,
  onResetRound,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes}:${seconds} · ${day}/${month}/${year}`;
  };

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'wheel':
        return { label: 'Vòng quay', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' };
      case 'picker':
        return { label: 'Máy chọn tên', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' };
      case 'mystery':
        return { label: 'Hộp quà', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' };
      default:
        return { label: 'Ngẫu nhiên', color: 'bg-slate-50 text-slate-700' };
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Lịch sử gọi tên
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đã gọi {calledCount}/{totalStudents} học sinh trong vòng hiện tại
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh tác vụ: Đặt lại vòng & Xóa lịch sử */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          <button
            onClick={onResetRound}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            title="Đặt lại vòng gọi hiện tại (cho phép gọi lại tất cả học sinh mà không xóa lịch sử)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Đặt lại vòng gọi</span>
          </button>

          {history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Xóa toàn bộ bản ghi lịch sử"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa nhật ký lịch sử</span>
            </button>
          )}
        </div>

        {/* Danh sách lịch sử */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
              <History className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-sm font-medium">Chưa có lượt gọi nào được ghi lại</p>
              <p className="text-xs text-slate-500 mt-1">
                Các lượt gọi tên từ Vòng quay, Máy chọn tên hoặc Hộp quà sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            [...history].reverse().map((record, index) => {
              const displayIndex = history.length - index;
              const badge = getModeBadge(record.mode);

              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                      #{displayIndex}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {record.studentName}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(record.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Popup xác nhận xóa lịch sử */}
        {showClearConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="w-full max-w-sm p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Xóa toàn bộ lịch sử?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Nhật ký các lượt gọi sẽ bị xóa sạch. Danh sách học sinh trong lớp vẫn được giữ nguyên.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    onClearHistory();
                    setShowClearConfirm(false);
                  }}
                  className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
