import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Settings,
  History,
  ChevronDown,
} from 'lucide-react';
import { ClassRoom } from '../types';

interface HeaderProps {
  currentClass: ClassRoom;
  allClasses: ClassRoom[];
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  onSelectClass: (classId: string) => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onOpenClassManager: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentClass,
  allClasses,
  theme,
  soundEnabled,
  onSelectClass,
  onToggleTheme,
  onToggleSound,
  onOpenClassManager,
  onOpenHistory,
  onOpenSettings,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Brand / App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
              GỌI TÊN NGẪU NHIÊN
            </h1>
            <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 leading-none">
              Mỗi học sinh – Một cơ hội
            </p>
          </div>
        </div>

        {/* Center: Current Class Selector Badge */}
        <div className="relative">
          <button
            onClick={() => setShowClassDropdown(!showClassDropdown)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm border border-slate-200/70 dark:border-slate-700/80 transition-all"
          >
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="truncate max-w-[130px] sm:max-w-[180px]">{currentClass.name}</span>
            <span className="text-[11px] font-normal text-slate-400">({currentClass.students.length})</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown danh sách lớp nhanh */}
          {showClassDropdown && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowClassDropdown(false)}
              />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-40 animate-fade-in">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400">
                  Chọn lớp học
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {allClasses.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => {
                        onSelectClass(cls.id);
                        setShowClassDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-left transition-colors ${
                        cls.id === currentClass.id
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{cls.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {cls.students.length} HS
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowClassDropdown(false);
                      onOpenClassManager();
                    }}
                    className="w-full text-center py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl"
                  >
                    + Quản lý lớp & Học sinh
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Actions: Audio, Theme, Fullscreen, History, Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quản lý lớp */}
          <button
            onClick={onOpenClassManager}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors hidden md:inline-flex items-center gap-1.5"
            title="Quản lý lớp học và danh sách học sinh"
          >
            <Users className="w-4 h-4" />
            <span>Lớp học</span>
          </button>

          {/* Âm thanh */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            aria-label="Bật tắt âm thanh"
          >
            {soundEnabled ? (
              <Volume2 className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            ) : (
              <VolumeX className="w-4.5 h-4.5 text-slate-400" />
            )}
          </button>

          {/* Sáng / Tối */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'light' ? 'Chuyển chế độ Tối' : 'Chuyển chế độ Sáng'}
            aria-label="Đổi giao diện"
          >
            {theme === 'light' ? (
              <Moon className="w-4.5 h-4.5 text-slate-600" />
            ) : (
              <Sun className="w-4.5 h-4.5 text-amber-400" />
            )}
          </button>

          {/* Toàn màn hình */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Thu nhỏ màn hình' : 'Toàn màn hình máy chiếu'}
            aria-label="Toàn màn hình"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Maximize2 className="w-4.5 h-4.5" />
            )}
          </button>

          {/* Lịch sử */}
          <button
            onClick={onOpenHistory}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Xem lịch sử các lượt gọi"
            aria-label="Lịch sử"
          >
            <History className="w-4.5 h-4.5" />
          </button>

          {/* Cài đặt */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cài đặt hệ thống"
            aria-label="Cài đặt"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
