import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCw, RefreshCw, AlertCircle } from 'lucide-react';
import { Student } from '../types';
import { secureRandomInt } from '../utils/random';
import { soundManager } from '../utils/audio';

interface WheelModeProps {
  students: Student[];
  eligibleStudents: Student[];
  noRepeat: boolean;
  reducedMotion: boolean;
  onStudentSelected: (student: Student) => void;
  onResetRound: () => void;
}

const SLICE_COLORS = [
  '#2563EB', // Blue 600
  '#8B5CF6', // Purple 500
  '#0F172A', // Slate 900
  '#10B981', // Emerald 500
  '#4F46E5', // Indigo 600
  '#0284C7', // Sky 600
  '#7C3AED', // Violet 600
  '#059669', // Emerald 600
  '#3B82F6', // Blue 500
  '#6366F1', // Indigo 500
];

export const WheelMode: React.FC<WheelModeProps> = ({
  students,
  eligibleStudents,
  noRepeat,
  reducedMotion,
  onStudentSelected,
  onResetRound,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const currentRotationRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Danh sách học sinh hiển thị trên vòng quay
  // Nếu bật chống trùng: hiển thị các em chưa được gọi
  const displayStudents = noRepeat ? eligibleStudents : students;
  const count = displayStudents.length;

  // Vẽ vòng quay trên Canvas
  const drawWheel = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 24;

    ctx.clearRect(0, 0, width, height);

    if (count === 0) {
      // Empty state circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#E2E8F0';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#94A3B8';
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Không có học sinh để quay', centerX, centerY);
      return;
    }

    const sliceAngle = (2 * Math.PI) / count;

    // Vẽ từng nan quạt
    for (let i = 0; i < count; i++) {
      const startAngle = rotation + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Màu sắc đan xen
      ctx.fillStyle = SLICE_COLORS[i % SLICE_COLORS.length];
      ctx.fill();

      // Viền nhẹ giữa các nan
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = count > 30 ? 1 : 2;
      ctx.stroke();

      // Vẽ tên học sinh
      ctx.save();
      ctx.translate(centerX, centerY);
      const textAngle = startAngle + sliceAngle / 2;
      ctx.rotate(textAngle);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';

      // Điều chỉnh font size theo số lượng nan
      let fontSize = 16;
      if (count > 40) fontSize = 11;
      else if (count > 25) fontSize = 13;
      else if (count > 15) fontSize = 14;

      ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", -apple-system, sans-serif`;

      let name = displayStudents[i].name;
      // Truncate tên nếu quá dài
      const maxTextWidth = radius * 0.65;
      if (ctx.measureText(name).width > maxTextWidth) {
        while (name.length > 4 && ctx.measureText(name + '..').width > maxTextWidth) {
          name = name.slice(0, -1);
        }
        name += '..';
      }

      ctx.fillText(name, radius - 20, 0);
      ctx.restore();
    }

    // Viền tròn ngoài cùng của vòng quay
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Vòng kim loại trang trí
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 4, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Tâm vòng quay
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Chấm bi nhỏ ở giữa tâm
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#2563EB';
    ctx.fill();
  }, [count, displayStudents]);

  // Vẽ lại khi danh sách hoặc kích thước thay đổi
  useEffect(() => {
    drawWheel(currentRotationRef.current);
  }, [drawWheel]);

  // Hủy animation khi unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Xử lý quay bánh xe
  const spinWheel = () => {
    if (isSpinning || count === 0) return;

    // 1. CHỌN TRƯỚC HỌC SINH CHIẾN THẮNG BẰNG THUẬT TOÁN ĐỒNG ĐỀU
    const winnerIndex = secureRandomInt(count);
    const winnerStudent = displayStudents[winnerIndex];

    setIsSpinning(true);

    const sliceAngle = (2 * Math.PI) / count;
    const POINTER_ANGLE = 1.5 * Math.PI; // Kim ở vị trí 12h (phía trên đỉnh)

    // Góc kết thúc sao cho tâm của slice winnerIndex nằm ngay dưới kim (POINTER_ANGLE)
    // (winnerIndex + 0.5) * sliceAngle + finalAngle === POINTER_ANGLE (mod 2pi)
    let targetOffset = (POINTER_ANGLE - (winnerIndex + 0.5) * sliceAngle) % (2 * Math.PI);
    if (targetOffset < 0) targetOffset += 2 * Math.PI;

    // Thêm số vòng quay ngẫu nhiên từ 5 đến 7 vòng
    const extraRounds = (5 + secureRandomInt(3)) * 2 * Math.PI;
    const startRotation = currentRotationRef.current;
    
    // Tính khoảng cách cần quay từ góc hiện tại
    const currentMod = startRotation % (2 * Math.PI);
    let delta = targetOffset - currentMod;
    if (delta < 0) delta += 2 * Math.PI;
    const totalRotation = delta + extraRounds;
    const finalRotation = startRotation + totalRotation;

    const duration = reducedMotion ? 1200 : 4800; // ms
    const startTime = performance.now();
    let lastTickIndex = -1;

    // Hàm easing tự nhiên (cubic ease-out)
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);

      const currentAngle = startRotation + totalRotation * eased;
      currentRotationRef.current = currentAngle;
      drawWheel(currentAngle);

      // Tính nan nào đang lướt qua kim để phát tiếng tick nhẹ
      const currentPassed = Math.floor(
        ((POINTER_ANGLE - (currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / sliceAngle
      );
      if (currentPassed !== lastTickIndex) {
        lastTickIndex = currentPassed;
        soundManager.playTick();
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Kết thúc chính xác
        currentRotationRef.current = finalRotation;
        drawWheel(finalRotation);
        setIsSpinning(false);
        onStudentSelected(winnerStudent);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Trường hợp hết học sinh
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
          Tất cả {students.length} học sinh trong lớp đã được gọi ít nhất một lần.
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
    <div className="flex flex-col items-center justify-center w-full py-4 px-2">
      {/* Vùng chứa Vòng quay và Kim chỉ cố định ở đỉnh */}
      <div className="relative flex items-center justify-center w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] md:w-[500px] md:h-[500px]">
        {/* Kim chỉ cố định ở phía trên (Top Pointer) */}
        <div className="absolute -top-3 z-30 flex flex-col items-center drop-shadow-md">
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-red-500 filter drop-shadow" />
          <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-red-500 -mt-7" />
        </div>

        {/* Canvas Vòng quay */}
        <canvas
          ref={canvasRef}
          width={540}
          height={540}
          className="w-full h-full max-w-[500px] max-h-[500px] transition-transform select-none"
        />
      </div>

      {/* Nút bấm quay */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          onClick={spinWheel}
          disabled={isSpinning || count === 0}
          className={`inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl text-lg font-bold text-white shadow-xl transition-all duration-200 ${
            isSpinning || count === 0
              ? 'bg-slate-400 cursor-not-allowed opacity-75'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-600/30'
          }`}
        >
          <RotateCw className={`w-6 h-6 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>{isSpinning ? 'ĐANG QUAY...' : 'QUAY NGAY'}</span>
        </button>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          {noRepeat ? `Đang có ${count} học sinh trong vòng này` : `Tất cả ${count} học sinh`}
        </span>
      </div>
    </div>
  );
};
