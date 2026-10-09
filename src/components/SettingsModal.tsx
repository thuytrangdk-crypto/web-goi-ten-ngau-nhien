import React, { useRef, useState } from 'react';
import {
  X,
  Settings,
  ShieldCheck,
  Volume2,
  VolumeX,
  Music,
  Download,
  Upload,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { AppSettings, ClassRoom } from '../types';
import { exportBackupJSON } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  classes: ClassRoom[];
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onRestoreBackup: (backupData: { classes: ClassRoom[]; settings: AppSettings }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  classes,
  onClose,
  onUpdateSettings,
  onRestoreBackup,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [restoreConfirmData, setRestoreConfirmData] = useState<{
    classes: ClassRoom[];
    settings: AppSettings;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    exportBackupJSON(classes, settings);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.classes)) {
          setRestoreConfirmData(parsed);
        } else {
          setErrorMessage('File sao lưu không hợp lệ. Vui lòng chọn file JSON được xuất từ ứng dụng này.');
        }
      } catch {
        setErrorMessage('Không thể đọc file JSON này. File có thể bị lỗi định dạng.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmRestore = () => {
    if (restoreConfirmData) {
      onRestoreBackup(restoreConfirmData);
      setRestoreConfirmData(null);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-xl max-h-[85vh] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Cài đặt ứng dụng
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tùy chỉnh chế độ gọi tên, âm thanh và sao lưu dữ liệu
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Chế độ gọi ngẫu nhiên */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cơ chế gọi ngẫu nhiên
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdateSettings({ noRepeat: true })}
                className={`flex flex-col p-4 rounded-2xl text-left border transition-all ${
                  settings.noRepeat
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Không gọi trùng</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mỗi học sinh chỉ được gọi 1 lần trong mỗi vòng cho đến khi hết lớp.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ noRepeat: false })}
                className={`flex flex-col p-4 rounded-2xl text-left border transition-all ${
                  !settings.noRepeat
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Cho phép gọi trùng</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tất cả học sinh luôn có xác suất trúng như nhau ở mỗi lượt quay.
                </p>
              </button>
            </div>
          </div>

          {/* 2. Cài đặt âm thanh */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Âm thanh lớp học
            </span>

            {/* Hiệu ứng âm thanh (SFX) */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  {settings.audio.sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Hiệu ứng âm thanh (SFX)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tiếng quay số, tiếng mở hộp quà và âm thanh chúc mừng
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.audio.sfxEnabled}
                onChange={(e) =>
                  onUpdateSettings({
                    audio: { ...settings.audio, sfxEnabled: e.target.checked },
                  })
                }
                className="w-5 h-5 rounded text-blue-600 cursor-pointer"
              />
            </div>

            {/* Nhạc nền nhẹ (BGM) */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Nhạc nền nhẹ nhàng (BGM)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Giai điệu lofi nhẹ êm dịu giúp tăng sự tập trung trong lớp học
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.audio.bgmEnabled}
                onChange={(e) =>
                  onUpdateSettings({
                    audio: { ...settings.audio, bgmEnabled: e.target.checked },
                  })
                }
                className="w-5 h-5 rounded text-blue-600 cursor-pointer"
              />
            </div>

            {/* Điều chỉnh âm lượng Master */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Âm lượng tổng
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {Math.round(settings.audio.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.audio.volume}
                onChange={(e) =>
                  onUpdateSettings({
                    audio: { ...settings.audio, volume: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* 3. Tùy chọn chuyển động */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Hiển thị & Chuyển động
            </span>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Giảm chuyển động (Reduced Motion)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rút ngắn thời gian quay và tắt pháo hoa giấy chúc mừng
                </p>
              </div>

              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => onUpdateSettings({ reducedMotion: e.target.checked })}
                className="w-5 h-5 rounded text-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* 4. Sao lưu & Khôi phục */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Dữ liệu & Sao lưu Offline
            </span>

            {errorMessage && (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
              >
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Xuất bản sao lưu JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Khôi phục từ JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Modal xác nhận khôi phục */}
        {restoreConfirmData && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="w-full max-w-sm p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Xác nhận khôi phục dữ liệu?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Toàn bộ dữ liệu lớp học hiện tại sẽ được thay thế bằng dữ liệu từ file sao lưu ({restoreConfirmData.classes.length} lớp học).
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setRestoreConfirmData(null)}
                  className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmRestore}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  Khôi phục ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
