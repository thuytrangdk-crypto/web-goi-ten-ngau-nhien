/**
 * Hệ thống âm thanh Web Audio API thuần (100% Offline, không phụ thuộc file mạng hay CDN)
 * Tạo âm thanh nhẹ nhàng, hiện đại, phù hợp môi trường lớp học THCS/THPT.
 */

import { AudioSettings } from '../types';

class SoundManager {
  private ctx: AudioContext | null = null;
  private bgmGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private bgmIntervalId: number | null = null;
  private isBgmPlaying = false;
  private settings: AudioSettings = {
    sfxEnabled: true,
    bgmEnabled: false,
    volume: 0.7,
  };

  constructor() {
    // AudioContext will be initialized upon user gesture
  }

  public updateSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (this.masterGainNode && this.ctx) {
      this.masterGainNode.gain.setValueAtTime(this.settings.volume, this.ctx.currentTime);
    }
    if (this.bgmGainNode && this.ctx) {
      this.bgmGainNode.gain.setValueAtTime(this.settings.bgmEnabled ? 0.25 : 0, this.ctx.currentTime);
    }

    if (this.settings.bgmEnabled && !this.isBgmPlaying) {
      this.startBgm();
    } else if (!this.settings.bgmEnabled && this.isBgmPlaying) {
      this.stopBgm();
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        
        // Master Gain
        this.masterGainNode = this.ctx.createGain();
        this.masterGainNode.gain.value = this.settings.volume;
        this.masterGainNode.connect(this.ctx.destination);

        // SFX Gain
        this.sfxGainNode = this.ctx.createGain();
        this.sfxGainNode.gain.value = 1.0;
        this.sfxGainNode.connect(this.masterGainNode);

        // BGM Gain
        this.bgmGainNode = this.ctx.createGain();
        this.bgmGainNode.gain.value = this.settings.bgmEnabled ? 0.25 : 0;
        this.bgmGainNode.connect(this.masterGainNode);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Âm thanh tick cơ học nhẹ khi vòng quay lướt qua nan hoặc máy nhảy tên
   */
  public playTick(pitchMultiplier = 1) {
    if (!this.settings.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }

  /**
   * Âm thanh mở hộp quà bí mật: tiếng "pop" và chuông ấm vui tươi
   */
  public playBoxOpen() {
    if (!this.settings.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    try {
      const now = this.ctx.currentTime;
      
      // Chime ấm
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        if (!this.ctx || !this.sfxGainNode) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + i * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGainNode);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Âm thanh chúc mừng nhẹ nhàng, sang trọng khi có kết quả
   * Hợp âm C-E-G-B-C vui tươi nhưng không ồn ào chói tai
   */
  public playCelebration() {
    if (!this.settings.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGainNode) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = now + idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        // Chuông ngân nhẹ
        gain.gain.setValueAtTime(0.28, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.7);

        osc.connect(gain);
        gain.connect(this.sfxGainNode);

        osc.start(noteTime);
        osc.stop(noteTime + 0.75);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Nhạc nền Ambient Lo-fi lặp nhẹ nhàng, tạo sự tập trung trong lớp học
   */
  public startBgm() {
    if (!this.settings.bgmEnabled) return;
    this.initContext();
    if (this.isBgmPlaying || !this.ctx || !this.bgmGainNode) return;

    this.isBgmPlaying = true;
    
    // Giai điệu pentatonic êm dịu: F3, A3, C4, E4, G4, A4
    const scale = [174.61, 220.0, 261.63, 329.63, 392.0, 440.0];
    let step = 0;

    const playBgmStep = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGainNode) return;
      try {
        const now = this.ctx.currentTime;
        const freq = scale[step % scale.length];
        step = (step + 1) % scale.length;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.bgmGainNode);

        osc.start(now);
        osc.stop(now + 1.25);
      } catch {
        // ignore
      }
    };

    playBgmStep();
    this.bgmIntervalId = window.setInterval(playBgmStep, 1000);
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }
}

export const soundManager = new SoundManager();
