import * as XLSX from 'xlsx';

/**
 * Excel 列名转下标（A=0, B=1, ..., Z=25, AA=26, ...）
 */
export function columnNameToIndex(name: string): number {
  let index = 0;
  for (let i = 0; i < name.length; i++) {
    index = index * 26 + (name.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Excel 单元格值转为 JS 类型
 * 支持：数字、布尔、日期、字符串
 */
export function cellValue(raw: XLSX.CellObject | undefined): string | number | boolean | null {
  if (!raw) return null;
  if (raw.t === 's') return String(raw.v ?? '');
  if (raw.t === 'n') return Number(raw.v);
  if (raw.t === 'b') return Boolean(raw.v);
  if (raw.t === 'd') {
    if (typeof raw.v === 'number') {
      return new Date((raw.v - 25569) * 86400 * 1000).toISOString().split('T')[0];
    }
    return String(raw.v ?? '');
  }
  if (raw.t === 'e') return String(raw.v ?? '');
  return String(raw.v ?? '');
}

/**
 * 将 Sheet 数据转为一维对象数组（以首行为字段名）
 * headers: 行索引（0-based）→ 字段名
 */
export function sheetToObjects<T = Record<string, string | number | boolean | null>>(
  sheet: XLSX.WorkSheet,
  headerRow = 0,
): T[] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const result: T[] = [];
  const colCount = range.e.c - range.s.c + 1;

  // 提取字段名（首行）
  const fieldNames: string[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: headerRow, c });
    const raw = sheet[addr];
    const val = cellValue(raw);
    fieldNames.push(String(val || `col_${c}`));
  }

  // 逐行解析
  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const rowObj: Record<string, string | number | boolean | null> = {};
    let isEmpty = true;
    for (let c = range.s.c; c < range.s.c + colCount; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const raw = sheet[addr];
      const val = cellValue(raw);
      rowObj[fieldNames[c - range.s.c]] = val;
      if (val !== null && val !== '') isEmpty = false;
    }
    if (!isEmpty) result.push(rowObj as T);
  }

  return result;
}

/**
 * 生成 Excel 文件并返回 Buffer
 * data: 对象数组
 * sheetName: 工作表名（默认 Sheet1）
 */
export function objectsToSheet<T extends Record<string, unknown>>(
  data: T[],
  sheetName = 'Sheet1',
): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(data as unknown as (string | number | boolean | null | undefined)[]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as unknown as Buffer;
}

/**
 * 生成带样式汇总的 Excel（多 Sheet）
 * sheets: [{name, headers, data}]
 */
export function generateMultiSheetExcel(
  sheets: Array<{
    name: string;
    title?: string;
    headers: string[];
    data: (string | number | boolean | null)[][];
  }>,
): Buffer {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    // 如果有标题行，标题单独作为一行
    const wsData: (string | number | boolean | null)[][] = [];
    if (sheet.title) {
      wsData.push([sheet.title]);
      wsData.push(sheet.headers);
    } else {
      wsData.push(sheet.headers);
    }
    wsData.push(...sheet.data);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // 设置列宽
    ws['!cols'] = sheet.headers.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as unknown as Buffer;
}
