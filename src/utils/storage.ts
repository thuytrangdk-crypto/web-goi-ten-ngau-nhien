import { AppSettings, ClassRoom, Student } from '../types';
import { generateUniqueId } from './random';

export const STORAGE_KEYS = {
  CLASSES: 'gtnn_classes_v2',
  ACTIVE_CLASS_ID: 'gtnn_active_class_id_v2',
  SETTINGS: 'gtnn_settings_v2',
  // legacy key to migrate from if exists
  LEGACY_CLASSES: 'random_picker_classes',
  LEGACY_STUDENTS: 'random_picker_students',
};

export const SAMPLE_STUDENTS = [
  'Nguyễn Văn An',
  'Trần Thị Bình',
  'Lê Minh Châu',
  'Phạm Quốc Dũng',
  'Hoàng Thu Hà',
  'Đỗ Ngọc Hạnh',
  'Vũ Đức Huy',
  'Nguyễn Thị Lan',
  'Trần Khánh Linh',
  'Lê Hoàng Minh',
  'Phạm Văn Nam',
  'Bùi Thảo Phương',
];

export const DEFAULT_SETTINGS: AppSettings = {
  noRepeat: true,
  reducedMotion: false,
  audio: {
    sfxEnabled: true,
    bgmEnabled: false,
    volume: 0.7,
  },
  theme: 'light',
  activeMode: 'wheel',
};

/**
 * Tạo lớp học mặc định với dữ liệu mẫu nếu chưa có dữ liệu nào
 */
export function createDefaultClass(): ClassRoom {
  const students: Student[] = SAMPLE_STUDENTS.map((name, index) => ({
    id: `student_init_${index + 1}_${Date.now().toString(36)}`,
    name,
    createdAt: Date.now() + index,
  }));

  return {
    id: 'class_default_10a1',
    name: 'Lớp 10A1',
    students,
    calledStudentIds: [],
    history: [],
    createdAt: Date.now(),
  };
}

/**
 * Tải danh sách lớp từ localStorage kèm cơ chế migration an toàn
 */
export function loadStoredClasses(): { classes: ClassRoom[]; activeId: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (raw) {
      const parsed = JSON.parse(raw) as ClassRoom[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const storedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLASS_ID);
        const activeId = parsed.find(c => c.id === storedActiveId)?.id || parsed[0].id;
        return { classes: parsed, activeId };
      }
    }

    // Kiểm tra dữ liệu phiên bản cũ nếu có
    const legacyClassesRaw = localStorage.getItem(STORAGE_KEYS.LEGACY_CLASSES);
    if (legacyClassesRaw) {
      try {
        const legacyParsed = JSON.parse(legacyClassesRaw);
        if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
          const migrated: ClassRoom[] = legacyParsed.map((item: any) => ({
            id: item.id || generateUniqueId(),
            name: item.name || 'Lớp học',
            students: Array.isArray(item.students)
              ? item.students.map((s: any, idx: number) => ({
                  id: s.id || generateUniqueId() + idx,
                  name: typeof s === 'string' ? s : s.name || `Học sinh ${idx + 1}`,
                }))
              : [],
            calledStudentIds: Array.isArray(item.calledStudentIds) ? item.calledStudentIds : [],
            history: Array.isArray(item.history) ? item.history : [],
            createdAt: item.createdAt || Date.now(),
          }));

          saveClasses(migrated);
          return { classes: migrated, activeId: migrated[0].id };
        }
      } catch {
        // Migration failed, proceed to default
      }
    }
  } catch (err) {
    console.error('Lỗi khi đọc dữ liệu từ localStorage:', err);
  }

  // Khởi tạo lớp mẫu đầu tiên
  const defaultClass = createDefaultClass();
  const classes = [defaultClass];
  saveClasses(classes);
  saveActiveClassId(defaultClass.id);
  return { classes, activeId: defaultClass.id };
}

export function saveClasses(classes: ClassRoom[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  } catch (err) {
    console.error('Không thể lưu classes vào localStorage:', err);
  }
}

export function saveActiveClassId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS_ID, id);
  } catch (err) {
    console.error('Không thể lưu activeClassId:', err);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        audio: { ...DEFAULT_SETTINGS.audio, ...(parsed.audio || {}) },
      };
    }
  } catch (err) {
    console.error('Lỗi khi tải settings:', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Không thể lưu settings:', err);
  }
}

/**
 * Xuất dữ liệu ra file sao lưu JSON
 */
export function exportBackupJSON(classes: ClassRoom[], settings: AppSettings) {
  const data = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    classes,
    settings,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Sao_Luu_Goi_Ten_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Xuất danh sách học sinh ra file CSV (có UTF-8 BOM để Excel hiển thị tiếng Việt không bị lỗi)
 */
export function exportStudentsToCSV(className: string, students: Student[]) {
  // \uFEFF là BOM UTF-8 giúp Excel tự động nhận diện tiếng Việt
  const header = 'STT,Họ và tên\n';
  const rows = students.map((s, idx) => `${idx + 1},"${s.name.replace(/"/g, '""')}"`).join('\n');
  const csvContent = '\uFEFF' + header + rows;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Danh_sach_${className.replace(/\s+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Phân tích danh sách học sinh từ chuỗi văn bản (dán từ Excel, Word hoặc CSV)
 */
export function parsePastedStudentNames(rawText: string): string[] {
  if (!rawText) return [];
  const lines = rawText.split(/\r?\n/);
  const names: string[] = [];

  for (const line of lines) {
    let clean = line.trim();
    if (!clean) continue;

    // Nếu người dùng dán cả cột STT + Tên (hoặc dạng CSV "1, Nguyễn Văn A")
    if (clean.includes('\t')) {
      const parts = clean.split('\t');
      // Lấy phần tử có chữ (bỏ qua số thứ tự nếu có)
      const namePart = parts.find(p => isNaN(Number(p.trim())) && p.trim().length > 0) || parts[parts.length - 1];
      clean = namePart.trim();
    } else if (clean.includes(',')) {
      const parts = clean.split(',');
      const namePart = parts.find(p => isNaN(Number(p.trim().replace(/"/g, ''))) && p.trim().length > 0) || parts[parts.length - 1];
      clean = namePart.replace(/"/g, '').trim();
    } else {
      // Loại bỏ số thứ tự ở đầu ví dụ "1. Nguyễn Văn A" hoặc "1 - Nguyễn Văn A"
      clean = clean.replace(/^\d+[\.\-\)\s]+/, '').trim();
    }

    // Bỏ qua dòng tiêu đề nếu người dùng copy cả "STT", "Họ và tên"
    const lower = clean.toLowerCase();
    if (lower === 'họ và tên' || lower === 'ho va ten' || lower === 'tên' || lower === 'stt' || lower === 'name') {
      continue;
    }

    if (clean.length > 0) {
      names.push(clean);
    }
  }

  return names;
}
