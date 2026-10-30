import type { Schema, Dialect } from '../features/designer/types';
import { generateSql } from './sqlGenerator';

export async function copySqlToClipboard(schema: Schema, dialect: Dialect): Promise<boolean> {
  const sql = generateSql(schema, dialect);
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(sql);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = sql;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch {
    return false;
  }
}

export function downloadSqlFile(schema: Schema, dialect: Dialect, schemaName?: string): void {
  const sql = generateSql(schema, dialect);
  const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const base = schemaName
    ? schemaName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    : 'schema';
  a.href = url;
  a.download = `${base}-${dialect}.sql`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJsonFile(schema: Schema, schemaName?: string): void {
  const jsonStr = JSON.stringify(schema, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const base = schemaName
    ? schemaName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    : 'schema';
  a.href = url;
  a.download = `${base}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
