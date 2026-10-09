import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, RefreshCw, AlertCircle, Shuffle } from 'lucide-react';
import { Student } from '../types';
import { secureShuffle } from '../utils/random';
import { soundManager } from '../utils/audio';

interface MysteryBoxModeProps {
  students: Student[];
  eligibleStudents: Student[];
  noRepeat: boolean;
  reducedMotion: boolean;
  onStudentSelected: (student: Student) => void;
  onResetRound: () => void;
}

interface BoxItem {
  boxNumber: number;
  studentId: string;
}

export const MysteryBoxMode: React.FC<MysteryBoxModeProps> = ({
  students,
  eligibleStudents,
  noRepeat,
  reducedMotion,
  onStudentSelected,
  onResetRound,
}) => {
  const displayStudents = noRepeat ? eligibleStudents : students;
  const count = displayStudents.length;

  // Ánh xạ bí mật: hộp số X chứa học sinh nào
  // Lưu ý: Tuyệt đối KHÔNG render tên học sinh vào DOM trước khi click!
  const [boxMappings, setBoxMappings] = useState<BoxItem[]>([]);
  const [openingBoxNumber, setOpeningBoxNumber] = useState<number | null>(null);

  // Khởi tạo ánh xạ ngẫu nhiên khi danh sách học sinh thay đổi
  useEffect(() => {
    if (count > 0) {
      const shuffledStudents = secureShuffle(displayStudents);
      const mappings: BoxItem[] = shuffledStudents.map((st, idx) => ({
        boxNumber: idx + 1,
        studentId: st.id,
      }));
      setBoxMappings(mappings);
      setOpeningBoxNumber(null);
    } else {
      setBoxMappings([]);
    }
  }, [count, noRepeat, displayStudents]);

  // Xáo trộn lại vị trí các hộp
  const handleReshuffle = () => {
    if (count > 0) {
      const shuffledStudents = secureShuffle(displayStudents);
      const mappings: BoxItem[] = shuffledStudents.map((st, idx) => ({
        boxNumber: idx + 1,
        studentId: st.id,
      }));
      setBoxMappings(mappings);
      soundManager.playTick();
    }
  };

  // Mở một hộp quà
  const handleOpenBox = (box: BoxItem) => {
    if (openingBoxNumber !== null) return; // Đang trong hoạt ảnh

    const targetStudent = displayStudents.find((s) => s.id === box.studentId);
    if (!targetStudent) return;

    setOpeningBoxNumber(box.boxNumber);
    soundManager.playBoxOpen();

    const delay = reducedMotion ? 250 : 800;
    setTimeout(() => {
      setOpeningBoxNumber(null);
      onStudentSelected(targetStudent);
    }, delay);
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
          Tất cả {students.length} hộp quà bí mật đã được mở hết trong vòng này.
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

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto py-4 px-2">
      {/* Thanh tiện ích phụ */}
      <div className="w-full flex items-center justify-between mb-6 px-2">
        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Còn <span className="font-bold text-blue-600 dark:text-blue-400">{boxMappings.length}</span> hộp bí mật
        </div>

        <button
          onClick={handleReshuffle}
          disabled={openingBoxNumber !== null || count === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          title="Xáo trộn lại vị trí các hộp"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Xáo lại hộp</span>
        </button>
      </div>

      {/* Lưới các hộp quà */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 w-full max-h-[62vh] overflow-y-auto p-2 scrollbar-thin">
        {boxMappings.map((box) => {
          const isOpening = openingBoxNumber === box.boxNumber;

          return (
            <button
              key={box.boxNumber}
              onClick={() => handleOpenBox(box)}
              disabled={openingBoxNumber !== null}
              className={`group relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-200 aspect-square ${
                isOpening
                  ? 'scale-105 bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl shadow-blue-500/30 border-blue-400 animate-pulse'
                  : 'bg-white hover:bg-blue-50/50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md active:scale-95'
              }`}
            >
              {/* Số thứ tự hộp */}
              <span className={`absolute top-2.5 left-3 text-xs font-bold ${
                isOpening ? 'text-white/90' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'
              }`}>
                #{box.boxNumber}
              </span>

              {/* Icon hộp quà */}
              <div className={`p-3 rounded-2xl transition-transform duration-200 ${
                isOpening
                  ? 'bg-white/20 text-white rotate-12 scale-110'
                  : 'bg-slate-100 dark:bg-slate-700/50 text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/60'
              }`}>
                {isOpening ? (
                  <Sparkles className="w-8 h-8 animate-spin" />
                ) : (
                  <Gift className="w-8 h-8" />
                )}
              </div>

              {/* Nhãn gợi ý */}
              <span className={`mt-2.5 text-xs font-semibold ${
                isOpening ? 'text-white' : 'text-slate-600 dark:text-slate-400'
              }`}>
                {isOpening ? 'Đang mở...' : 'Hộp quà'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
