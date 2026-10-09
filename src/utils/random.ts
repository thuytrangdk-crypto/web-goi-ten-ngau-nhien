/**
 * Thuật toán chọn ngẫu nhiên công bằng sử dụng Web Crypto API (crypto.getRandomValues)
 * Có cơ chế Rejection Sampling để loại bỏ hoàn toàn sai lệch modulo (Modulo Bias).
 */

/**
 * Trả về một số nguyên ngẫu nhiên trong khoảng [0, max - 1] với phân phối đều tuyệt đối.
 */
export function secureRandomInt(max: number): number {
  if (max <= 1) return 0;
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    // 32-bit integer range
    const maxUint32 = 0xffffffff;
    const limit = Math.floor(maxUint32 / max) * max;
    const buf = new Uint32Array(1);
    
    let rand = 0;
    do {
      window.crypto.getRandomValues(buf);
      rand = buf[0];
    } while (rand >= limit);
    
    return rand % max;
  }
  
  // Fallback an toàn nếu môi trường không có crypto
  return Math.floor(Math.random() * max);
}

/**
 * Chọn ngẫu nhiên 1 phần tử trong mảng
 */
export function secureChoice<T>(items: T[]): T | null {
  if (!items || items.length === 0) return null;
  const idx = secureRandomInt(items.length);
  return items[idx];
}

/**
 * Xáo trộn mảng theo thuật toán Fisher-Yates sử dụng secureRandomInt
 */
export function secureShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Tạo ID ngẫu nhiên cho học sinh hoặc lớp học
 */
export function generateUniqueId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback below
    }
  }
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}
