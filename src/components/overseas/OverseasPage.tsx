import { useState } from 'react';
import { ClipboardList, Warehouse, X } from 'lucide-react';
import InventoryPage from './OverseasStagingInventoryPage';
import InstructionListPage from './InstructionListPage';
import type { Waybill } from '../../types';
import './theme.css';

export default function OverseasPage({ view, waybills }: { view: 'storage' | 'instructions'; waybills: Pick<Waybill, 'waybillNo' | 'clientRemark'>[] }) {
  const [notice, setNotice] = useState('');
  const title = view === 'storage' ? '暂存管理' : '指令列表';
  const Icon = view === 'storage' ? Warehouse : ClipboardList;
  return <div className="ans-overseas-page h-full flex flex-col gap-5 min-h-0">
    <header className="flex items-center gap-3 shrink-0">
      <div className="w-10 h-10 rounded-lg bg-[#5c67f2]/10 text-[#5c67f2] flex items-center justify-center"><Icon className="w-5 h-5" /></div>
      <div><h1 className="text-base font-bold text-slate-800">{title}</h1><p className="text-xs text-slate-400 mt-0.5">海外中转单 / {view === 'storage' ? '海外库存与下单管理' : '指令查询与确认'}</p></div>
    </header>
    {view === 'storage' ? <InventoryPage addToast={setNotice} /> : <InstructionListPage addToast={setNotice} waybills={waybills} />}
    {notice && <div role="status" className="fixed top-28 left-1/2 -translate-x-1/2 z-[300] bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-xs text-slate-700 flex items-center gap-3">{notice}<button type="button" aria-label="关闭提示" onClick={() => setNotice('')} className="text-slate-400 cursor-pointer"><X size={14} /></button></div>}
  </div>;
}
