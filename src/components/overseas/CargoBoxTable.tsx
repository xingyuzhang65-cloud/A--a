import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import './CargoBoxTable.css';

export interface CargoBoxDisplayRow {
  id: string;
  boxNo: string;
  weight?: number;
  dimensions?: string;
  systemWeight?: number;
}

type Selection<T> = {
  selectedIds: readonly string[];
  onChange?: (ids: string[]) => void;
  isDisabled?: (row: T) => boolean;
  allLabel: string;
  rowLabel: (row: T, index: number) => string;
};

export function formatCargoWeight(value?: number): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${Number(value.toFixed(3)).toLocaleString('zh-CN')} KG` : '—';
}

export function formatCargoDimensions(value?: string): string {
  const text = value?.trim();
  if (!text || text === '-' || text === '—') return '—';
  const dimensions = /^(\d+(?:\.\d+)?)\s*[×xX*]\s*(\d+(?:\.\d+)?)\s*[×xX*]\s*(\d+(?:\.\d+)?)\s*(?:cm|厘米)?$/i.exec(text);
  return dimensions ? `${dimensions.slice(1, 4).join('*')} CM` : text;
}

export default function CargoBoxTable<T extends CargoBoxDisplayRow>({ rows, selection, trailingColumn }: {
  rows: readonly T[];
  selection?: Selection<T>;
  trailingColumn?: { label: string; render: (row: T, index: number) => ReactNode };
}) {
  const allRef = useRef<HTMLInputElement>(null);
  const selected = new Set(selection?.selectedIds || []);
  const eligible = rows.filter(row => !selection?.isDisabled?.(row));
  const all = eligible.length > 0 && eligible.every(row => selected.has(row.id));
  const some = eligible.some(row => selected.has(row.id));
  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = some && !all;
  }, [some, all]);

  function toggleAll(checked: boolean) {
    const eligibleIds = new Set(eligible.map(row => row.id));
    const retained = (selection?.selectedIds || []).filter(id => !eligibleIds.has(id));
    selection?.onChange?.(checked ? [...retained, ...eligibleIds] : retained);
  }

  return <div className="overseas-cargo-wrap" tabIndex={0} role="region" aria-label="货箱信息表格">
    <table className={`overseas-cargo-table${trailingColumn ? ' overseas-cargo-with-extra' : ''}`} aria-label="货箱信息">
      <colgroup><col className="overseas-cargo-index"/><col className="overseas-cargo-check"/><col/><col/><col/>{trailingColumn && <col className="overseas-cargo-extra"/>}</colgroup>
      <thead><tr>
        <th scope="col">#</th>
        <th scope="col"><input ref={allRef} type="checkbox" aria-label={selection?.allLabel || '全选货箱'} checked={all} disabled={!selection?.onChange || !eligible.length} onChange={event => toggleAll(event.target.checked)}/></th>
        <th scope="col">货箱号</th><th scope="col">客户数据</th><th scope="col">系统拣货（实重）</th>
        {trailingColumn && <th scope="col">{trailingColumn.label}</th>}
      </tr></thead>
      <tbody>{rows.map((box, index) => <tr key={box.id}>
        <td>{index + 1}</td>
        <td><input type="checkbox" aria-label={selection?.rowLabel(box, index) || `选择货箱${box.boxNo === '—' ? index + 1 : box.boxNo}`} checked={selected.has(box.id)} disabled={!selection?.onChange || selection.isDisabled?.(box)} onChange={event => selection?.onChange?.(event.target.checked ? [...selected, box.id] : [...selected].filter(id => id !== box.id))}/></td>
        <td className="overseas-cargo-number">{box.boxNo?.trim() || '—'}</td>
        <td><div>{formatCargoWeight(box.weight)}</div><div>{formatCargoDimensions(box.dimensions)}</div></td>
        <td>{formatCargoWeight(box.systemWeight)}</td>
        {trailingColumn && <td>{trailingColumn.render(box, index)}</td>}
      </tr>)}{!rows.length && <tr><td colSpan={trailingColumn ? 6 : 5} className="overseas-cargo-empty">暂无货箱信息</td></tr>}</tbody>
    </table>
  </div>;
}
