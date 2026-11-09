import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CatalogFeeDrawer, { type CatalogFeeDrawerRow } from './CatalogFeeDrawer';
import InstructionFeeEditDialog from './InstructionFeeEditDialog';
import OperationInstructionTable from './OperationInstructionTable';
import { loadInstructionCatalog } from './instructionManagementCatalog';
import { getInventoryFeeCatalog, type StorageFeeLine } from './overseasStorageInventoryData';
import { nowText, uid } from './interceptData';
import './reference-detail-base.css';
import './InstructionDetailPage.css';

type Props = {
  key?: number;
  rows: StorageFeeLine[];
  onSave: (rows: StorageFeeLine[], action: string) => boolean;
};
type FeeDraft = CatalogFeeDrawerRow & { source: StorageFeeLine };
type Modal = 'add' | 'edit' | 'processing' | 'delete' | null;
const displayCurrency = (value: string) => ({ CNY: '人民币', RMB: '人民币', USD: '美元', EUR: '欧元', GBP: '英镑' }[value] || value);
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function toDraft(fee: StorageFeeLine): FeeDraft {
  return { ...fee, currency: displayCurrency(fee.currency), remark: fee.feeRemark, source: fee };
}

export default function InterceptFeesPanel({ rows, onSave }: Props) {
  const catalog = useMemo(getInventoryFeeCatalog, []);
  const [selected, setSelected] = useState<string[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [drafts, setDrafts] = useState<FeeDraft[]>([]);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'待处理' | '已处理'>('已处理');
  const [error, setError] = useState('');
  const portalRef = useRef<HTMLDivElement>(null);
  const selectedRows = rows.filter(row => selected.includes(row.id));
  const done = rows.filter(row => row.status === '已处理').length;
  const total = round(rows.reduce((sum, row) => sum + round(row.unitPrice * row.quantity * row.exchangeRate), 0));
  const editing = drafts[0];
  const editedCost = useMemo(() => {
    if (!editing) return undefined;
    const original = loadInstructionCatalog().find(item => item.code === editing.code || item.name === editing.name);
    try {
      const saved = JSON.parse(localStorage.getItem('ans-overseas-instruction-management-reference-v1') || 'null');
      const item = saved?.rows?.find((item: { code: string; name: string }) => item.code === editing.code || item.name === editing.name);
      if (typeof item?.cost === 'number' && Number.isFinite(item.cost) && item.cost >= 0) return item.cost;
    } catch { /* Use the shared catalog when there is no saved dictionary. */ }
    return original?.cost;
  }, [editing]);

  useEffect(() => {
    if (!modal || modal === 'add') return;
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    portalRef.current?.querySelector<HTMLElement>('input:not([readonly]), select:not([disabled]), button')?.focus();
    return () => { if (origin?.isConnected) origin.focus({ preventScroll: true }); };
  }, [modal]);

  function close() { setModal(null); setError(''); }
  function emptyDraft(): FeeDraft {
    return toDraft({ id: uid(), code: '', name: '', type: '', unit: '', currency: '', exchangeRate: 1,
      unitPrice: 0, quantity: 1, feeRemark: '', instructionRemark: '', billingTime: nowText(),
      addedAt: nowText(), addedBy: '仓库-李明', status: '待处理', images: [] });
  }
  function openAdd() {
    setDrafts([{ ...emptyDraft(), unitPrice: '' }]); setTargetId(null); setError(''); setModal('add');
  }
  function openEdit(id: string) {
    const row = rows.find(row => row.id === id);
    if (!row) return;
    const draft = toDraft(row);
    draft.code ||= catalog.find(item => item.name === row.name)?.code || '';
    setDrafts([draft]); setTargetId(id); setError(''); setModal('edit');
  }
  function selectFee(id: string, code: string) {
    const item = catalog.find(item => item.code === code);
    setError('');
    setDrafts(current => current.map(draft => draft.id !== id ? draft : {
      ...draft, code, name: item?.name || '', type: item?.type || '', unit: item?.unit || '',
      unitPrice: item ? String(item.unitPrice) : '', currency: item ? displayCurrency(item.currency) : '',
      source: { ...draft.source, exchangeRate: item?.exchangeRate || 1, currency: item?.currency || '',
        instructionRemark: item?.instructionRemark || '' },
    }));
  }
  function updateFee(id: string, field: 'unitPrice' | 'quantity' | 'remark', value: string) {
    setError(''); setDrafts(current => current.map(row => row.id === id ? { ...row, [field]: value } : row));
  }
  function save(next: StorageFeeLine[], action: string) {
    if (onSave(next, action)) { setSelected(current => current.filter(id => next.some(row => row.id === id))); close(); }
    else setError('保存失败，本地存储空间不足或不可用，请保留当前内容后重试。');
  }
  function saveFees() {
    if (!drafts.length) { setError('请添加至少一条费用'); return; }
    const invalid = drafts.some(row => !row.name.trim() || !row.unit.trim() || !row.currency
      || !String(row.unitPrice).trim() || !Number.isFinite(Number(row.unitPrice)) || Number(row.unitPrice) < 0
      || !String(row.quantity).trim() || !Number.isFinite(Number(row.quantity)) || Number(row.quantity) <= 0
      || !Number.isFinite(row.source.exchangeRate) || row.source.exchangeRate <= 0
      || !Number.isFinite(Number(row.unitPrice) * Number(row.quantity) * row.source.exchangeRate * 100));
    if (invalid) { setError('请选择费用名称，单价须为大于或等于0的有效数字，数量须大于0。'); return; }
    const fees = drafts.map(row => ({ ...row.source, id: row.id, code: row.code, name: row.name, type: row.type,
      unit: row.unit, unitPrice: Number(row.unitPrice), quantity: Number(row.quantity), feeRemark: row.remark.trim() }));
    save(targetId ? rows.map(row => row.id === targetId ? fees[0] : row) : [...rows, ...fees], '更新费用信息');
  }

  return <>
    <div className="icm-panel-heading"><h3>操作指令</h3><button type="button" className="icm-btn primary" onClick={openAdd}>新增费用</button></div>
    <div className="instruction-processing-toolbar">
      <span className="instruction-processing-count">待处理 {rows.length - done} 项，已处理 {done} 项</span>
      <button type="button" className="icm-btn primary" disabled={!selectedRows.length} onClick={() => { setProcessingStatus('已处理'); setError(''); setModal('processing'); }}>处理</button>
      <span>已选 {selectedRows.length} 项</span>
    </div>
    <OperationInstructionTable rows={rows} selectedIds={selected} onSelectionChange={setSelected} onEdit={openEdit}
      onRemove={id => { setTargetId(id); setError(''); setModal('delete'); }} emptyText="暂无费用记录" />
    <div className="oi-fee-summary"><span>共 {rows.length} 条</span><strong>人民币合计 {total.toFixed(2)}</strong></div>

    {modal && createPortal(<div ref={portalRef} className="instruction-detail-portal icm-fees-portal" onKeyDown={event => {
      if (modal === 'add') return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
      if (event.key === 'Tab') {
        const items = Array.from(portalRef.current?.querySelectorAll('button:not([disabled]), input:not([readonly]), textarea, select:not([disabled])') || []) as HTMLElement[];
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
      {modal === 'add' && <CatalogFeeDrawer rows={drafts} catalogRows={catalog} error={error}
        onAdd={() => { setError(''); setDrafts(current => [...current, { ...emptyDraft(), unitPrice: '' }]); }}
        onSelect={selectFee} onUpdate={updateFee} onRemove={id => { setError(''); setDrafts(current => current.filter(row => row.id !== id)); }}
        onCancel={close} onConfirm={saveFees} />}
      {modal === 'edit' && editing && <InstructionFeeEditDialog row={editing} cost={editedCost} error={error}
        onUpdate={(field, value) => updateFee(editing.id, field, value)} onCancel={close} onConfirm={saveFees} />}
      {(modal === 'processing' || modal === 'delete') && <div className="mc-intercept-overlay mc-intercept-feedback-overlay mc-intercept-attachment-overlay instruction-processing-overlay" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
        <section className="mc-intercept-attachment-modal instruction-processing-modal" role="dialog" aria-modal="true" aria-label={modal === 'processing' ? '处理操作指令' : '删除费用'} tabIndex={-1}>
          <header><h2>{modal === 'processing' ? '处理操作指令' : '删除费用'}</h2><button type="button" className="mc-intercept-close" aria-label="关闭费用操作" onClick={close}>×</button></header>
          <div className="instruction-processing-form">
            {modal === 'processing' ? <><p>已选择 {selectedRows.length} 项操作指令</p><label><span>处理状态：</span><select aria-label="处理状态" value={processingStatus} onChange={event => setProcessingStatus(event.target.value as '待处理' | '已处理')}><option>已处理</option><option>待处理</option></select></label><p className="instruction-processing-hint">仅修改所选操作指令的处理状态。</p></> : <p>确定删除费用“{rows.find(row => row.id === targetId)?.name}”吗？</p>}
            {error && <p role="alert" className="instruction-fee-edit-error">{error}</p>}
          </div>
          <footer><button type="button" className="mc-btn primary" disabled={modal === 'processing' && !selectedRows.length} onClick={() => {
            if (modal === 'delete') save(rows.filter(row => row.id !== targetId), '删除费用');
            else if (selectedRows.length && onSave(rows.map(row => selected.includes(row.id) ? { ...row, status: processingStatus } : row), '处理费用信息')) { setSelected([]); close(); }
            else setError('保存失败，请保留当前内容后重试。');
          }}>{modal === 'processing' ? '保存' : '确定删除'}</button><button type="button" className="mc-btn" onClick={close}>取消</button></footer>
        </section>
      </div>}
    </div>, document.body)}
  </>;
}
