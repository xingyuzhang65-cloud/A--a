import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import { Waybill } from '../types';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (waybill: Waybill) => void;
  editingWaybill: Waybill | null;
}

const createEmptyWaybill = (): Waybill => ({
  id: `wb-${Date.now()}`,
  idx: 0,
  waybillNo: '',
  groupNo: '',
  mark: '',
  createTime: new Date().toISOString().slice(0, 10),
  pickTime: '',
  outboundNo: '',
  clientName: '',
  extraFeeRequest: '',
  zipCode: '',
  operator: '深圳天图',
  clientType: '基础价格',
  service: '',
  warehouseCode: '',
  country: '美国',
  trackingTemplate: '',
  pieces: '0/1',
  declarationValue: 0,
  declarationType: '买单报关',
  status: '已下单',
  fbaNo: '',
  destination: '美国',
  tradeMode: '9610',
  eta: '',
  etd: '',
  vesselVoyage: '',
  productName: '',
  attachments: 0,
  issueType: '无异常',
  courierCompany: '卡派',
  channel: '',
  clientRemark: '',
  internalRemark: '',
  merchandiser: '',
  label: '',
  taxPayment: 'DDP',
  trackingNo: '',
  invoiceMade: '未制作',
  salesman: '',
  customerService: '',
  waybillType: 'FBA',
  hasInsurance: '无',
  hasDocs: '有',
  customsRoom: '无',
});

export default function AddEditModal({ isOpen, onClose, onSave, editingWaybill }: AddEditModalProps) {
  const [formData, setFormData] = useState<Waybill>(createEmptyWaybill());

  useEffect(() => {
    setFormData(editingWaybill ?? createEmptyWaybill());
  }, [editingWaybill, isOpen]);

  if (!isOpen) return null;

  const update = (key: keyof Waybill, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <form
        className="h-full w-[520px] bg-white shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(formData);
        }}
      >
        <div className="h-14 border-b border-[#edf1f6] px-5 flex items-center justify-between">
          <strong className="text-[14px] text-[#263548]">{editingWaybill ? '编辑运单' : '新增运单'}</strong>
          <button type="button" onClick={onClose} className="top-icon">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4 text-[12px]">
          <label className="space-y-1">
            <span className="font-bold text-[#596a7d]">运单号</span>
            <input className="h-8 w-full border border-[#d8e0ea] px-2 outline-none" value={formData.waybillNo} onChange={(event) => update('waybillNo', event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="font-bold text-[#596a7d]">客户</span>
            <input className="h-8 w-full border border-[#d8e0ea] px-2 outline-none" value={formData.clientName} onChange={(event) => update('clientName', event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="font-bold text-[#596a7d]">集团单号</span>
            <input className="h-8 w-full border border-[#d8e0ea] px-2 outline-none" value={formData.groupNo} onChange={(event) => update('groupNo', event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="font-bold text-[#596a7d]">经营单位</span>
            <input className="h-8 w-full border border-[#d8e0ea] px-2 outline-none" value={formData.operator} onChange={(event) => update('operator', event.target.value)} />
          </label>
          <label className="col-span-2 space-y-1">
            <span className="font-bold text-[#596a7d]">服务</span>
            <input className="h-8 w-full border border-[#d8e0ea] px-2 outline-none" value={formData.service} onChange={(event) => update('service', event.target.value)} />
          </label>
        </div>

        <div className="absolute bottom-0 right-0 w-[520px] h-14 border-t border-[#edf1f6] px-5 flex items-center justify-end gap-2 bg-white">
          <button type="button" onClick={onClose} className="plain-btn">取消</button>
          <button type="submit" className="primary-btn">
            <Save className="h-3.5 w-3.5" />
            保存
          </button>
        </div>
      </form>
    </div>
  );
}
