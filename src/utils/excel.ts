import * as XLSX from 'xlsx';

/**
 * Kiểm tra xem một chuỗi có phải là tiêu đề cột họ và tên không
 */
function isFullNameHeader(text: string): boolean {
  const norm = text.toLowerCase().trim().normalize('NFC');
  return (
    norm === 'họ và tên' ||
    norm === 'họ tên' ||
    norm === 'họ và tên học sinh' ||
    norm === 'tên học sinh' ||
    norm === 'học sinh' ||
    norm === 'ho va ten' ||
    norm === 'ho ten' ||
    norm === 'full name' ||
    norm === 'fullname' ||
    norm === 'student name'
  );
}

/**
 * Kiểm tra xem cột có phải là cột Họ / Họ đệm (để ghép với cột Tên) không
 */
function isLastNameHeader(text: string): boolean {
  const norm = text.toLowerCase().trim().normalize('NFC');
  return (
    norm === 'họ' ||
    norm === 'họ đệm' ||
    norm === 'họ và đệm' ||
    norm === 'họ và chữ đệm' ||
    norm === 'họ và tên lót' ||
    norm === 'họ tên lót' ||
    norm === 'họ lót' ||
    norm === 'ho dem' ||
    norm === 'ho' ||
    norm === 'last name'
  );
}

/**
 * Kiểm tra xem cột có phải là cột Tên không
 */
function isFirstNameHeader(text: string): boolean {
  const norm = text.toLowerCase().trim().normalize('NFC');
  return (
    norm === 'tên' ||
    norm === 'tên gọi' ||
    norm === 'ten' ||
    norm === 'first name'
  );
}

/**
 * Kiểm tra xem một dòng có phải là dòng tiêu đề báo cáo / thông tin trường học không
 */
function isMetadataOrHeaderRow(text: string): boolean {
  const norm = text.toLowerCase().trim().normalize('NFC');
  if (!norm) return true;
  if (norm.startsWith('sở gd') || norm.startsWith('phòng gd') || norm.startsWith('trường ')) return true;
  if (norm.startsWith('danh sách') || norm.startsWith('bảng điểm') || norm.startsWith('sổ theo dõi')) return true;
  if (norm.startsWith('năm học') || norm.startsWith('học kỳ') || norm.startsWith('giáo viên')) return true;
  if (norm.startsWith('lớp:') || norm.startsWith('lớp ')) return true;
  if (norm === 'stt' || norm === 'mã hs' || norm === 'mã học sinh' || norm === 'ngày sinh' || norm === 'giới tính' || norm === 'nữ') return true;
  return false;
}

/**
 * Làm sạch và chuẩn hóa tên học sinh (chữ hoa chữ thường, khoảng trắng)
 */
export function cleanStudentName(name: string): string {
  if (!name) return '';
  // Bỏ ngoặc kép, khoảng trắng thừa
  let clean = name.replace(/["'\\]/g, '').trim();
  // Bỏ số thứ tự đầu dòng (VD: "1. Nguyễn Văn A", "1 - Nguyễn Văn A", "01/ Nguyễn Văn A")
  clean = clean.replace(/^\d+[\.\-\)\/\s]+/, '').trim();
  // Thu gọn khoảng trắng giữa các từ
  clean = clean.replace(/\s+/g, ' ');
  return clean;
}

/**
 * Trích xuất danh sách học sinh từ mảng 2D (sau khi đọc từ file Excel hoặc TSV)
 */
export function extractStudentNamesFrom2DArray(rows: any[][]): string[] {
  if (!rows || rows.length === 0) return [];

  // Tìm dòng tiêu đề nếu có
  let headerRowIdx = -1;
  let fullNameColIdx = -1;
  let lastNameColIdx = -1;
  let firstNameColIdx = -1;

  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] || '').trim();
      if (isFullNameHeader(cellVal)) {
        headerRowIdx = r;
        fullNameColIdx = c;
        break;
      } else if (isLastNameHeader(cellVal)) {
        lastNameColIdx = c;
        headerRowIdx = r;
      } else if (isFirstNameHeader(cellVal)) {
        firstNameColIdx = c;
        headerRowIdx = r;
      }
    }

    if (fullNameColIdx !== -1 || (lastNameColIdx !== -1 && firstNameColIdx !== -1)) {
      break;
    }
  }

  const results: string[] = [];

  // TRƯỜNG HỢP 1: Có cột Họ và tên gộp chung
  if (fullNameColIdx !== -1 && headerRowIdx !== -1) {
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const cell = rows[r]?.[fullNameColIdx];
      if (cell !== undefined && cell !== null) {
        const name = cleanStudentName(String(cell));
        if (name && name.length >= 2 && !isMetadataOrHeaderRow(name)) {
          // Bỏ qua nếu là số
          if (isNaN(Number(name))) {
            results.push(name);
          }
        }
      }
    }
    if (results.length > 0) return results;
  }

  // TRƯỜNG HỢP 2: Có 2 cột tách biệt: [Họ đệm] và [Tên] (vnEdu, SMAS, CSDL Bộ GD)
  if (lastNameColIdx !== -1 && firstNameColIdx !== -1 && headerRowIdx !== -1) {
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const lastName = cleanStudentName(String(row[lastNameColIdx] || ''));
      const firstName = cleanStudentName(String(row[firstNameColIdx] || ''));

      if (firstName && !isMetadataOrHeaderRow(firstName) && isNaN(Number(firstName))) {
        const full = lastName ? `${lastName} ${firstName}` : firstName;
        results.push(full);
      }
    }
    if (results.length > 0) return results;
  }

  // TRƯỜNG HỢP 3: Không tìm thấy tiêu đề chuẩn -> Thuật toán nhận diện cột chứa tên
  // Đếm số dòng hợp lệ có cấu trúc tên người Việt Nam (từ 2 đến 5 từ, không chứa ngày tháng, không phải số)
  const colStats = new Map<number, { validNames: string[]; score: number }>();

  for (let c = 0; c < 20; c++) {
    const validNames: string[] = [];
    let score = 0;

    for (let r = 0; r < rows.length; r++) {
      const val = rows[r]?.[c];
      if (val === undefined || val === null) continue;
      const str = cleanStudentName(String(val));
      if (!str || isMetadataOrHeaderRow(str) || !isNaN(Number(str))) continue;

      // Chuỗi ngày tháng (VD: 15/04/2010 hoặc 2010-04-15)
      if (str.match(/^\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}$/)) continue;
      // Chuỗi giới tính (Nam, Nữ)
      if (str.toLowerCase() === 'nam' || str.toLowerCase() === 'nữ' || str.toLowerCase() === 'nu') continue;

      const words = str.split(' ');
      // Tên tiếng Việt thường có 2 - 5 từ, mỗi từ viết hoa chữ đầu
      if (words.length >= 2 && words.length <= 6) {
        validNames.push(str);
        score += 2;
      } else if (words.length === 1 && str.length >= 2) {
        validNames.push(str);
        score += 1;
      }
    }

    if (validNames.length > 0) {
      colStats.set(c, { validNames, score });
    }
  }

  // Tìm cột có điểm số cao nhất
  let bestCol = -1;
  let maxScore = -1;
  colStats.forEach((stat, col) => {
    if (stat.score > maxScore) {
      maxScore = stat.score;
      bestCol = col;
    }
  });

  if (bestCol !== -1) {
    const candidate = colStats.get(bestCol)?.validNames || [];
    if (candidate.length > 0) return candidate;
  }

  // Phương án cuối cùng: Lấy tất cả chuỗi văn bản hợp lệ
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    for (const cell of row) {
      const str = cleanStudentName(String(cell || ''));
      if (str && str.length >= 2 && isNaN(Number(str)) && !isMetadataOrHeaderRow(str)) {
        results.push(str);
        break;
      }
    }
  }

  return results;
}

/**
 * Đọc và phân tích file Excel (.xlsx, .xls) hoặc CSV trực tiếp từ đối tượng File
 */
export async function parseExcelOrCsvFile(file: File): Promise<string[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  // Đọc bằng FileReader dưới dạng ArrayBuffer
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          resolve([]);
          return;
        }

        // Đọc workbook với codepage tiếng Việt
        const workbook = XLSX.read(buffer, {
          type: 'array',
          codepage: 65001, // UTF-8
        });

        // Lấy sheet đầu tiên
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve([]);
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        // Chuyển sheet sang mảng 2D (header: 1 trả về array of arrays)
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
        });

        const names = extractStudentNamesFrom2DArray(rows);
        resolve(names);
      } catch (err) {
        console.error('Lỗi khi đọc file Excel:', err);
        // Fallback đọc dạng text thông thường nếu là csv/txt
        if (extension === 'csv' || extension === 'txt') {
          const textReader = new FileReader();
          textReader.onload = (te) => {
            const raw = te.target?.result as string;
            resolve(parseExcelOrTextPasted(raw || ''));
          };
          textReader.onerror = () => reject(err);
          textReader.readAsText(file, 'UTF-8');
        } else {
          reject(err);
        }
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Phân tích chuỗi được copy/paste từ Excel hoặc Word
 */
export function parseExcelOrTextPasted(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  // Chuyển các dòng thành mảng 2D
  const rows: string[][] = lines.map((line) => {
    if (line.includes('\t')) {
      return line.split('\t').map((c) => c.trim());
    } else if (line.includes(',')) {
      return line.split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
    } else if (line.includes(';')) {
      return line.split(';').map((c) => c.trim());
    }
    return [line.trim()];
  });

  // Sử dụng thuật toán nhận diện thông minh đa cột
  const parsed = extractStudentNamesFrom2DArray(rows);
  if (parsed.length > 0) return parsed;

  // Fallback xử lý từng dòng đơn giản
  const fallbackResults: string[] = [];
  for (const line of lines) {
    const clean = cleanStudentName(line);
    if (clean && clean.length >= 2 && !isMetadataOrHeaderRow(clean) && isNaN(Number(clean))) {
      fallbackResults.push(clean);
    }
  }

  return fallbackResults;
}
