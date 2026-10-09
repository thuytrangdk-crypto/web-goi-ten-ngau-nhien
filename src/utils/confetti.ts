/**
 * Hiệu ứng pháo hoa giấy (Confetti) thuần HTML5 Canvas
 * Tối giản, thanh lịch, 100% offline, tự giải phóng bộ nhớ.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  vRot: number;
  alpha: number;
}

const PALETTE = ['#2563EB', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#38BDF8'];

export function triggerConfetti(canvas: HTMLCanvasElement | null, durationMs = 2500) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  const particles: Particle[] = [];
  const particleCount = 70; // Vừa phải, thanh lịch, không rối mắt

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 120,
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 12 - 4,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      size: Math.random() * 8 + 6,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
      alpha: 1,
    });
  }

  let animationFrameId: number;
  const startTime = performance.now();

  function render(now: number) {
    if (!ctx || !canvas) return;
    const elapsed = now - startTime;
    if (elapsed > durationMs) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // trọng lực nhẹ
      p.vx *= 0.98; // lực cản
      p.rotation += p.vRot;
      p.alpha = Math.max(0, 1 - elapsed / durationMs);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    animationFrameId = requestAnimationFrame(render);
  }

  animationFrameId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animationFrameId);
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
}
