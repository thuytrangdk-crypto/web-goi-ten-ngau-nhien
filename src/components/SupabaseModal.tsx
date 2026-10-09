import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { ClassRoom } from '../types';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  uploadClassesToSupabase,
  fetchClassesFromSupabase,
  SUPABASE_SETUP_SQL,
  ConnectionStatus,
  SupabaseConfig,
} from '../utils/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  classes: ClassRoom[];
  onClose: () => void;
  onClassesUpdated: (classes: ClassRoom[]) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  classes,
  onClose,
  onClassesUpdated,
}) => {
  const [config, setConfig] = useState<SupabaseConfig>(getSupabaseConfig());
  const [status, setStatus] = useState<ConnectionStatus>('disabled');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isCopiedSQL, setIsCopiedSQL] = useState(false);
  const [showSQLBox, setShowSQLBox] = useState(false);

  // Kiểm tra kết nối khi mở modal
  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    setIsChecking(true);
    setSyncFeedback(null);
    try {
      const res = await testSupabaseConnection();
      setStatus(res.status);
      setStatusMessage(res.message);
      if (res.status === 'missing_tables') {
        setShowSQLBox(true);
      }
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.message || 'Lỗi không xác định');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveConfig = () => {
    saveSupabaseConfig(config);
    checkStatus();
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setIsCopiedSQL(true);
    setTimeout(() => setIsCopiedSQL(false), 3000);
  };

  // Đồng bộ lên Supabase
  const handleUpload = async () => {
    if (classes.length === 0) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await uploadClassesToSupabase(classes);
      setSyncFeedback({
        type: 'success',
        text: `Đã lưu trữ thành công ${classes.length} lớp học và toàn bộ học sinh lên đám mây Supabase!`,
      });
      checkStatus();
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        text: `Lỗi tải lên: ${err.message || 'Vui lòng kiểm tra quyền truy cập hoặc bảng dữ liệu trên Supabase.'}`,
      });
      if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
        setShowSQLBox(true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Tải về từ Supabase
  const handleDownload = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const remoteClasses = await fetchClassesFromSupabase();
      if (remoteClasses && remoteClasses.length > 0) {
        onClassesUpdated(remoteClasses);
        setSyncFeedback({
          type: 'success',
          text: `Đã tải về thành công ${remoteClasses.length} lớp học từ đám mây Supabase!`,
        });
      } else {
        setSyncFeedback({
          type: 'error',
          text: 'Trên Supabase hiện chưa có dữ liệu lớp học nào được lưu.',
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        text: `Lỗi tải về: ${err.message || 'Không thể đọc dữ liệu từ Supabase.'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Kết nối Cơ sở dữ liệu Supabase</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lưu trữ và đồng bộ danh sách lớp học trực tuyến trên đám mây
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Trạng thái kết nối hiện tại */}
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
              status === 'connected'
                ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : status === 'missing_tables'
                ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : status === 'error'
                ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {status === 'connected' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : status === 'missing_tables' ? (
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-bold">
                  {status === 'connected'
                    ? 'Đã kết nối thành công với Supabase'
                    : status === 'missing_tables'
                    ? 'Cần tạo các bảng dữ liệu trên Supabase'
                    : status === 'error'
                    ? 'Chưa kết nối được'
                    : 'Chưa kiểm tra'}
                </h4>
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{statusMessage}</p>
              </div>
            </div>

            <button
              onClick={checkStatus}
              disabled={isChecking}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
              title="Kiểm tra lại kết nối"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Thông báo thao tác tải lên / tải về */}
          {syncFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                syncFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
              }`}
            >
              {syncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{syncFeedback.text}</span>
            </div>
          )}

          {/* Nút hành động Đồng bộ dữ liệu */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đồng bộ dữ liệu lớp học
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nút Đẩy lên đám mây */}
              <button
                onClick={handleUpload}
                disabled={isSyncing || status === 'missing_tables'}
                className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all"
              >
                <CloudUpload className="w-5 h-5" />
                <span>
                  {isSyncing ? 'Đang xử lý...' : `Lưu ${classes.length} lớp lên Supabase`}
                </span>
              </button>

              {/* Nút Tải về máy này */}
              <button
                onClick={handleDownload}
                disabled={isSyncing || status === 'missing_tables'}
                className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold text-sm border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50"
              >
                <CloudDownload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Tải dữ liệu từ Supabase về</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Dữ liệu luôn được lưu offline an toàn trên máy bạn. Bấm "Lưu lên Supabase" để đồng bộ sang các máy tính khác.
            </p>
          </div>

          {/* Hướng dẫn tạo bảng SQL (Nếu chưa tạo bảng trên Supabase) */}
          {(status === 'missing_tables' || showSQLBox) && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                    Hướng dẫn khởi tạo bảng trên Supabase (Chỉ làm 1 lần)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mở Supabase $\rightarrow$ vào mục <strong>SQL Editor</strong> $\rightarrow$ dán đoạn mã bên dưới và bấm <strong>Run</strong>:
                  </p>
                </div>

                <button
                  onClick={handleCopySQL}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0"
                >
                  {isCopiedSQL ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedSQL ? 'Đã sao chép!' : 'Sao chép mã SQL'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono max-h-40 overflow-y-auto overflow-x-auto scrollbar-thin">
                {SUPABASE_SETUP_SQL}
              </pre>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <a
                  href="https://supabase.com/dashboard/project/sohuavueougdlsqerwuk/sql"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  <span>Mở Supabase SQL Editor trong tab mới</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={checkStatus}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Tôi đã chạy mã xong, kiểm tra lại
                </button>
              </div>
            </div>
          )}

          {/* Chi tiết thông tin cấu hình URL & Key */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Thông tin cấu hình Supabase
            </span>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  SUPABASE URL
                </label>
                <input
                  type="text"
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value.trim() })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  SUPABASE ANON KEY
                </label>
                <input
                  type="text"
                  value={config.anonKey}
                  onChange={(e) => setConfig({ ...config, anonKey: e.target.value.trim() })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
