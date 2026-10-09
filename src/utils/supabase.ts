import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClassRoom, Student, CallRecord } from '../types';

// Lấy thông tin kết nối từ biến môi trường hoặc localStorage
const DEFAULT_SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://sohuavueougdlsqerwuk.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2BcotajR597WKnTP9G0wrg_N8oBj1PM';

const STORAGE_SUPABASE_CONFIG = 'gtnn_supabase_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_SUPABASE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: parsed.url || DEFAULT_SUPABASE_URL,
        anonKey: parsed.anonKey || DEFAULT_SUPABASE_ANON_KEY,
        enabled: parsed.enabled !== undefined ? parsed.enabled : true,
      };
    }
  } catch {
    // fallback
  }

  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    enabled: true,
  };
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  try {
    localStorage.setItem(STORAGE_SUPABASE_CONFIG, JSON.stringify(config));
    // Reset instance to reinitialize
    supabaseInstance = null;
  } catch (err) {
    console.error('Không thể lưu cấu hình Supabase:', err);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.enabled || !config.url || !config.anonKey) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: { persistSession: false },
      });
    } catch (err) {
      console.error('Khởi tạo Supabase client thất bại:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export const SUPABASE_SETUP_SQL = `-- BƯỚC 1: Tạo bảng danh sách các lớp học
create table if not exists classes (
  id text primary key,
  name text not null,
  called_student_ids jsonb default '[]'::jsonb,
  created_at bigint default (extract(epoch from now()) * 1000)::bigint
);

-- BƯỚC 2: Tạo bảng danh sách học sinh
create table if not exists students (
  id text primary key,
  class_id text references classes(id) on delete cascade,
  name text not null,
  created_at bigint default (extract(epoch from now()) * 1000)::bigint
);

-- BƯỚC 3: Tạo bảng lịch sử gọi tên
create table if not exists call_history (
  id text primary key,
  class_id text references classes(id) on delete cascade,
  student_id text,
  student_name text not null,
  mode text not null,
  timestamp bigint default (extract(epoch from now()) * 1000)::bigint
);

-- BƯỚC 4: Bật phân quyền truy cập cho ứng dụng web (anon public key)
alter table classes enable row level security;
alter table students enable row level security;
alter table call_history enable row level security;

-- Xóa policy cũ nếu đã tồn tại để tránh lỗi trùng lặp khi chạy lại
drop policy if exists "Allow all on classes" on classes;
drop policy if exists "Allow all on students" on students;
drop policy if exists "Allow all on call_history" on call_history;

-- Tạo mới policy cho phép đọc / ghi
create policy "Allow all on classes" on classes for all using (true) with check (true);
create policy "Allow all on students" on students for all using (true) with check (true);
create policy "Allow all on call_history" on call_history for all using (true) with check (true);`;

export type ConnectionStatus = 'connected' | 'missing_tables' | 'error' | 'disabled';

/**
 * Kiểm tra kết nối tới Supabase và xác nhận các bảng đã được tạo hay chưa
 */
export async function testSupabaseConnection(): Promise<{
  status: ConnectionStatus;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      status: 'disabled',
      message: 'Chưa cấu hình hoặc chưa bật kết nối Supabase.',
    };
  }

  try {
    const { error } = await client.from('classes').select('id').limit(1);

    if (error) {
      // 42P01: relation "classes" does not exist
      if (
        error.code === '42P01' ||
        error.message?.toLowerCase().includes('relation') ||
        error.message?.toLowerCase().includes('does not exist')
      ) {
        return {
          status: 'missing_tables',
          message:
            'Đã kết nối tới Supabase nhưng chưa tạo các bảng (classes, students, call_history). Vui lòng chạy mã SQL trên Supabase.',
        };
      }

      return {
        status: 'error',
        message: `Lỗi kết nối Supabase: ${error.message} (${error.code || ''})`,
      };
    }

    return {
      status: 'connected',
      message: 'Kết nối Supabase thành công! Dữ liệu đã sẵn sàng đồng bộ đám mây.',
    };
  } catch (err: any) {
    return {
      status: 'error',
      message: `Không thể kết nối tới Supabase: ${err.message || String(err)}`,
    };
  }
}

/**
 * Tải toàn bộ danh sách lớp học và học sinh từ Supabase về
 */
export async function fetchClassesFromSupabase(): Promise<ClassRoom[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: classesData, error: classesError } = await client
      .from('classes')
      .select('*')
      .order('created_at', { ascending: true });

    if (classesError) throw classesError;
    if (!classesData || classesData.length === 0) return [];

    const { data: studentsData, error: studentsError } = await client
      .from('students')
      .select('*')
      .order('created_at', { ascending: true });

    if (studentsError) throw studentsError;

    const { data: historyData } = await client
      .from('call_history')
      .select('*')
      .order('timestamp', { ascending: true });

    // Ghép dữ liệu thành mảng ClassRoom
    const fullClasses: ClassRoom[] = classesData.map((cls) => {
      const classStudents: Student[] = (studentsData || [])
        .filter((s) => s.class_id === cls.id)
        .map((s) => ({
          id: s.id,
          name: s.name,
          createdAt: s.created_at,
        }));

      const classHistory: CallRecord[] = (historyData || [])
        .filter((h) => h.class_id === cls.id)
        .map((h) => ({
          id: h.id,
          studentId: h.student_id,
          studentName: h.student_name,
          timestamp: h.timestamp,
          mode: h.mode,
          modeLabel:
            h.mode === 'wheel'
              ? 'Vòng quay'
              : h.mode === 'picker'
              ? 'Máy chọn tên'
              : 'Hộp quà bí mật',
        }));

      let calledIds: string[] = [];
      if (Array.isArray(cls.called_student_ids)) {
        calledIds = cls.called_student_ids;
      }

      return {
        id: cls.id,
        name: cls.name,
        students: classStudents,
        calledStudentIds: calledIds,
        history: classHistory,
        createdAt: cls.created_at || Date.now(),
      };
    });

    return fullClasses;
  } catch (err) {
    console.error('Lỗi khi tải dữ liệu từ Supabase:', err);
    throw err;
  }
}

/**
 * Đồng bộ toàn bộ danh sách lớp và học sinh hiện tại lên Supabase
 */
export async function uploadClassesToSupabase(classes: ClassRoom[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || classes.length === 0) return false;

  try {
    // 1. Chuẩn bị dữ liệu bảng classes
    const classesPayload = classes.map((c) => ({
      id: c.id,
      name: c.name,
      called_student_ids: c.calledStudentIds,
      created_at: c.createdAt,
    }));

    const { error: classesErr } = await client
      .from('classes')
      .upsert(classesPayload, { onConflict: 'id' });
    if (classesErr) throw classesErr;

    // 2. Chuẩn bị dữ liệu bảng students
    const allStudentsPayload: any[] = [];
    classes.forEach((c) => {
      c.students.forEach((s) => {
        allStudentsPayload.push({
          id: s.id,
          class_id: c.id,
          name: s.name,
          created_at: s.createdAt || Date.now(),
        });
      });
    });

    if (allStudentsPayload.length > 0) {
      const { error: studentsErr } = await client
        .from('students')
        .upsert(allStudentsPayload, { onConflict: 'id' });
      if (studentsErr) throw studentsErr;
    }

    // 3. Chuẩn bị dữ liệu bảng call_history
    const allHistoryPayload: any[] = [];
    classes.forEach((c) => {
      c.history.forEach((h) => {
        allHistoryPayload.push({
          id: h.id,
          class_id: c.id,
          student_id: h.studentId,
          student_name: h.studentName,
          mode: h.mode,
          timestamp: h.timestamp,
        });
      });
    });

    if (allHistoryPayload.length > 0) {
      const { error: historyErr } = await client
        .from('call_history')
        .upsert(allHistoryPayload, { onConflict: 'id' });
      if (historyErr) throw historyErr;
    }

    return true;
  } catch (err) {
    console.error('Lỗi khi tải lên Supabase:', err);
    throw err;
  }
}

/**
 * Xóa một lớp trên Supabase (cascade xóa cả học sinh và lịch sử)
 */
export async function deleteClassOnSupabase(classId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('classes').delete().eq('id', classId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Lỗi khi xóa lớp trên Supabase:', err);
    return false;
  }
}

/**
 * Cập nhật danh sách học sinh đã gọi (called_student_ids) cho 1 lớp
 */
export async function updateCalledStudentsOnSupabase(
  classId: string,
  calledStudentIds: string[]
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client
      .from('classes')
      .update({ called_student_ids: calledStudentIds })
      .eq('id', classId);
  } catch (err) {
    console.error('Lỗi cập nhật called_student_ids trên Supabase:', err);
  }
}

/**
 * Ghi 1 lượt gọi mới vào Supabase
 */
export async function recordCallOnSupabase(
  classId: string,
  record: CallRecord,
  calledStudentIds: string[]
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    // Cập nhật called_student_ids
    await client
      .from('classes')
      .update({ called_student_ids: calledStudentIds })
      .eq('id', classId);

    // Ghi vào call_history
    await client.from('call_history').insert({
      id: record.id,
      class_id: classId,
      student_id: record.studentId,
      student_name: record.studentName,
      mode: record.mode,
      timestamp: record.timestamp,
    });
  } catch (err) {
    console.error('Lỗi ghi lượt gọi vào Supabase:', err);
  }
}
