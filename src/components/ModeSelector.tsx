import React from 'react';
import { PickMode } from '../types';
import { Compass, Zap, Gift } from 'lucide-react';

interface ModeSelectorProps {
  activeMode: PickMode;
  onChangeMode: (mode: PickMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onChangeMode }) => {
  const modes: { id: PickMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'wheel',
      label: 'VÒNG QUAY',
      icon: <Compass className="w-5 h-5" />,
      desc: 'Quay thưởng bánh xe sinh động',
    },
    {
      id: 'picker',
      label: 'MÁY CHỌN TÊN',
      icon: <Zap className="w-5 h-5" />,
      desc: 'Xáo trộn thẻ tên tốc độ cao',
    },
    {
      id: 'mystery',
      label: 'HỘP QUÀ BÍ MẬT',
      icon: <Gift className="w-5 h-5" />,
      desc: 'Mở hộp quà ngẫu nhiên hồi hộp',
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto my-3 px-4">
      <div className="grid grid-cols-3 p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl border border-slate-300/40 dark:border-slate-700/50">
        {modes.map((m) => {
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChangeMode(m.id)}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300/30 dark:hover:bg-slate-700/40'
              }`}
            >
              <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}>
                {m.icon}
              </span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
