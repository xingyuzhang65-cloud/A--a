import { useState } from 'react';

export default function FeeUnitPriceEditor({ value, label, onSave, onCancel }: {
  value: number; label: string; onSave: (value: number) => boolean; onCancel: () => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');
  return <form className="operation-instruction-price-editor" noValidate onSubmit={event => {
    event.preventDefault(); event.stopPropagation();
    const price = Number(draft);
    if (!draft.trim() || !Number.isFinite(price) || price < 0) {
      setError('请输入大于或等于0的有效单价'); return;
    }
    if (!onSave(price)) setError('保存失败，请检查金额或本地存储后重试');
  }} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCancel(); }
  }}>
    <input autoFocus aria-label={label} aria-invalid={!!error} type="number" min="0" step="any" value={draft} onChange={event => { setDraft(event.target.value); setError(''); }} />
    <span><button type="submit">保存</button><button type="button" onClick={onCancel}>取消</button></span>
    {error && <small role="alert">{error}</small>}
  </form>;
}
