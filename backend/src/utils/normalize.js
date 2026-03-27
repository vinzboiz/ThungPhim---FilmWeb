/**
 * Chuẩn hóa chuỗi để tìm kiếm: trim, lowercase, bỏ dấu tiếng Việt.
 */
const VI_DIACRITICS = [
  ['à', 'á', 'ả', 'ã', 'ạ', 'ă', 'ằ', 'ắ', 'ẳ', 'ẵ', 'ặ', 'â', 'ầ', 'ấ', 'ẩ', 'ẫ', 'ậ'],
  ['è', 'é', 'ẻ', 'ẽ', 'ẹ', 'ê', 'ề', 'ế', 'ể', 'ễ', 'ệ'],
  ['ì', 'í', 'ỉ', 'ĩ', 'ị'],
  ['ò', 'ó', 'ỏ', 'õ', 'ọ', 'ô', 'ồ', 'ố', 'ổ', 'ỗ', 'ộ', 'ơ', 'ờ', 'ớ', 'ở', 'ỡ', 'ợ'],
  ['ù', 'ú', 'ủ', 'ũ', 'ụ', 'ư', 'ừ', 'ứ', 'ử', 'ữ', 'ự'],
  ['ỳ', 'ý', 'ỷ', 'ỹ', 'ỵ'],
  ['đ'],
];
const REPLACEMENTS = ['a', 'e', 'i', 'o', 'u', 'y', 'd'];

function buildMap() {
  const m = {};
  VI_DIACRITICS.forEach((group, i) => {
    const r = REPLACEMENTS[i];
    group.forEach((c) => { m[c] = r; m[c.toUpperCase()] = r.toUpperCase(); });
  });
  return m;
}

const DIACRITIC_MAP = buildMap();

function normalize(str) {
  if (str == null || typeof str !== 'string') return '';
  let s = str.trim().toLowerCase();
  if (!s) return '';
  return s
    .split('')
    .map((c) => DIACRITIC_MAP[c] ?? c)
    .join('');
}

/** Escape ký tự đặc biệt trong LIKE: % _ \\ */
function escapeLike(str) {
  if (str == null || typeof str !== 'string') return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

module.exports = { normalize, escapeLike };
