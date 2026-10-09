export interface Student {
  id: string;
  name: string;
  createdAt?: number;
}

export interface ClassRoom {
  id: string;
  name: string;
  students: Student[];
  calledStudentIds: string[]; // Set of student IDs already picked in current round
  history: CallRecord[];
  createdAt: number;
}

export type PickMode = 'wheel' | 'picker' | 'mystery';

export interface CallRecord {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: number;
  mode: PickMode;
  modeLabel: string;
}

export interface AudioSettings {
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  volume: number; // 0 to 1
}

export interface AppSettings {
  noRepeat: boolean; // true = không gọi trùng trong vòng
  reducedMotion: boolean;
  audio: AudioSettings;
  theme: 'light' | 'dark';
  activeMode: PickMode;
}
