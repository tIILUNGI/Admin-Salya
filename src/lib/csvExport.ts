/**
 * SALYA Admin — Utilitário de Exportação CSV Profissional
 * 
 * Gera CSVs bem formatados, compatíveis com Excel e ferramentas de análise de dados.
 * - BOM UTF-8 para caracteres especiais (acentos, ç, etc.)
 * - Delimitador ponto-e-vírgula (;) para compatibilidade Excel PT
 * - Todas as células entre aspas para evitar problemas com vírgulas
 * - Linha de metadados no topo (nome do relatório, data, total de registos)
 * - Headers descritivos e profissionais
 */

type CellValue = string | number | boolean | null | undefined;

interface ExportOptions {
  /** Nome do ficheiro (sem extensão) */
  filename: string;
  /** Título do relatório (aparece na primeira linha do CSV) */
  reportTitle: string;
  /** Headers das colunas */
  headers: string[];
  /** Dados: array de arrays */
  rows: CellValue[][];
  /** Incluir metadados no topo (data, Nº registos) — default: true */
  includeMetadata?: boolean;
  /** Incluir linha de totais (para colunas numéricas) — default: false */
  includeTotals?: boolean;
  /** Índices das colunas que são valores monetários (Kz) */
  currencyColumns?: number[];
}

/** Escapa uma célula para CSV — envolve em aspas e escapa aspas internas */
const escapeCell = (value: CellValue): string => {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
};

/** Formata valor monetário com separador de milhares */
const formatCurrencyValue = (value: number): string => {
  return value.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/** Formata data ISO para formato legível dd/mm/aaaa HH:mm */
export const formatDateForCSV = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
};

/** Gera e faz download do CSV */
export const exportCSV = (options: ExportOptions): void => {
  const {
    filename,
    reportTitle,
    headers,
    rows,
    includeMetadata = true,
    includeTotals = false,
    currencyColumns = [],
  } = options;

  const DELIMITER = ';';
  const lines: string[] = [];

  // ── Metadados no topo ──────────────────────────────────────────
  if (includeMetadata) {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    lines.push(escapeCell(`SALYA Admin — ${reportTitle}`));
    lines.push(escapeCell(`Data de Exportação: ${dateStr}`));
    lines.push(escapeCell(`Total de Registos: ${rows.length}`));
    lines.push(''); // Linha em branco separadora
  }

  // ── Headers ────────────────────────────────────────────────────
  lines.push(headers.map(h => escapeCell(h)).join(DELIMITER));

  // ── Dados ──────────────────────────────────────────────────────
  rows.forEach(row => {
    const formattedRow = row.map((cell, idx) => {
      if (currencyColumns.includes(idx) && typeof cell === 'number') {
        return escapeCell(formatCurrencyValue(cell));
      }
      return escapeCell(cell);
    });
    lines.push(formattedRow.join(DELIMITER));
  });

  // ── Linha de Totais ────────────────────────────────────────────
  if (includeTotals && rows.length > 0) {
    lines.push(''); // Linha em branco
    const totalsRow = headers.map((_, idx) => {
      if (idx === 0) return escapeCell('TOTAL');
      if (currencyColumns.includes(idx)) {
        const total = rows.reduce((sum, row) => {
          const val = Number(row[idx]) || 0;
          return sum + val;
        }, 0);
        return escapeCell(formatCurrencyValue(total));
      }
      // Para colunas numéricas não-monetárias, somar se todos os valores são números
      const allNumeric = rows.every(row => typeof row[idx] === 'number' || !isNaN(Number(row[idx])));
      if (allNumeric && rows.length > 0 && typeof rows[0][idx] === 'number') {
        const total = rows.reduce((sum, row) => sum + (Number(row[idx]) || 0), 0);
        return escapeCell(total);
      }
      return escapeCell('');
    });
    lines.push(totalsRow.join(DELIMITER));
  }

  // ── Download ───────────────────────────────────────────────────
  const BOM = '\uFEFF'; // UTF-8 BOM para Excel reconhecer caracteres especiais
  const csvContent = BOM + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateSuffix = new Date().toISOString().split('T')[0];
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${dateSuffix}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
