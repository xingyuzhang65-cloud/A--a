import React, { useState, useEffect } from 'react';
import { Waybill, WaybillStatus } from '../types';
import { X, Save, Edit } from 'lucide-react';
import { motion } from 'motion/react';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (waybill: Waybill) => void;
  editingWaybill: Waybill | null;
}

const initialWaybill = (): Omit<Waybill, 'id' | 'idx' | 'createTime'> => ({
  clientName: '飞洋电商',
  fbaNo: '',
  waybillNo: '',
  destination: 'US-ONT8',
  declarationType: '买单报关',
  tradeMode: '9610',
  eta: '',
  productName: '',
  etd: '',
  vesselVoyage: '',
  declarationValue: 0,
  attachments: 0,
  issueType: '无',
  courierCompany: '卡派',
  channel: '美森正班-定提',
  status: '入仓',
  clientRemark: '',
  internalRemark: '',
  warehouseCode: 'SZ01',
  zipCode: '',
  merchandiser: '张华',
  label: '普通货物',
  taxPayment: 'DDP',
  operator: '深圳安速货运有限公司',
  trackingNo: '',
  invoiceMade: '未制作',
  salesman: '王涛',
  customerService: '陈静',
  waybillType: '普货',
  hasInsurance: '无',
  hasDocs: '无',
  customsRoom: '无'
});

export default function AddEditModal({ isOpen, onClose, onSave, editingWaybill }: AddEditModalProps) {
  const [formData, setFormData] = useState<Omit<Waybill, 'id' | 'idx' | 'createTime'>>(initialWaybill());

  useEffect(() => {
    if (editingWaybill) {
      setFormData({
        clientName: editingWaybill.clientName || '飞洋电商',
        fbaNo: editingWaybill.fbaNo || '',
        waybillNo: editingWaybill.waybillNo || '',
        destination: editingWaybill.destination || 'US-ONT8',
        declarationType: editingWaybill.declarationType || '买单报关',
        tradeMode: editingWaybill.tradeMode || '9610',
        eta: editingWaybill.eta || '',
        productName: editingWaybill.productName || '',
        etd: editingWaybill.etd || '',
        vesselVoyage: editingWaybill.vesselVoyage || '',
        declarationValue: editingWaybill.declarationValue || 0,
        attachments: editingWaybill.attachments || 0,
        issueType: editingWaybill.issueType || '无',
        courierCompany: editingWaybill.courierCompany || '卡派',
        channel: editingWaybill.channel || '美森正班-定提',
        status: editingWaybill.status || '入仓',
        clientRemark: editingWaybill.clientRemark || '',
        internalRemark: editingWaybill.internalRemark || '',
        warehouseCode: editingWaybill.warehouseCode || 'SZ01',
        zipCode: editingWaybill.zipCode || '',
        merchandiser: editingWaybill.merchandiser || '张华',
        label: editingWaybill.label || '普通货物',
        taxPayment: editingWaybill.taxPayment || 'DDP',
        operator: editingWaybill.operator || '深圳安速货运有限公司',
        trackingNo: editingWaybill.trackingNo || '',
        invoiceMade: editingWaybill.invoiceMade || '未制作',
        salesman: editingWaybill.salesman || '王涛',
        customerService: editingWaybill.customerService || '陈静',
        waybillType: editingWaybill.waybillType || '普货',
        hasInsurance: editingWaybill.hasInsurance || '无',
        hasDocs: editingWaybill.hasDocs || '无',
        customsRoom: editingWaybill.customsRoom || '无',
        pickTime: editingWaybill.pickTime || '',
        outTime: editingWaybill.outTime || '',
        pickWarehouse: editingWaybill.pickWarehouse || ''
      });
    } else {
      setFormData(initialWaybill());
    }
  }, [editingWaybill, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'declarationValue' || name === 'attachments' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.waybillNo || !formData.productName) {
      alert('请填写必要字段（客户简称、运单号、品名）。');
      return;
    }

    const payload: Waybill = {
      ...formData,
      id: editingWaybill ? editingWaybill.id : `wb-${Date.now()}`,
      idx: editingWaybill ? editingWaybill.idx : 99, // recalculated or custom
      createTime: editingWaybill ? editingWaybill.createTime : new Date().toISOString().split('T')[0]
    };
    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs select-none">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="w-full max-w-4xl bg-white h-screen shadow-2xl flex flex-col"
      >
        {/* Modal Header */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-[#5c67f2]" />
            <h3 className="font-bold text-slate-800 text-sm">
              {editingWaybill ? `编辑业务运单 - ${editingWaybill.waybillNo}` : '直客下单录单 (新增业务运单)'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Core Shipment Identity */}
          <div>
            <h4 className="text-xs font-bold text-[#5c67f2] uppercase tracking-wider mb-3 border-b border-indigo-100 pb-1.5">
              1. 基础报关和单据信息
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  * 客户简称
                </label>
                <input
                  type="text"
                  name="clientName"
                  required
                  value={formData.clientName}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                  placeholder="如飞洋电商"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  * 运单号
                </label>
                <input
                  type="text"
                  name="waybillNo"
                  required
                  value={formData.waybillNo}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                  placeholder="ANSU2026..."
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  FBA单号
                </label>
                <input
                  type="text"
                  name="fbaNo"
                  value={formData.fbaNo}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                  placeholder="FBA15G..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Product & Value */}
          <div>
            <h4 className="text-xs font-bold text-[#5c67f2] uppercase tracking-wider mb-3 border-b border-indigo-100 pb-1.5">
              2. 品名与商务报关
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col md:col-span-2">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  * 商品申报品名 (中文物料描述，空格隔开)
                </label>
                <input
                  type="text"
                  name="productName"
                  required
                  value={formData.productName}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                  placeholder="LED不锈钢日光灯 / 适配架"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  申报总货值 (USD)
                </label>
                <input
                  type="number"
                  name="declarationValue"
                  min="0"
                  value={formData.declarationValue}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  报关方式
                </label>
                <select
                  name="declarationType"
                  value={formData.declarationType}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                >
                  <option value="买单报关">买单报关</option>
                  <option value="一般贸易">一般贸易</option>
                  <option value="自单报关">自单报关</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  贸易方式
                </label>
                <select
                  name="tradeMode"
                  value={formData.tradeMode}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                >
                  <option value="9610">9610</option>
                  <option value="9710">9710</option>
                  <option value="9810">9810</option>
                  <option value="0110">0110</option>
                  <option value="1039">1039</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  交税方式
                </label>
                <input
                  type="text"
                  name="taxPayment"
                  value={formData.taxPayment}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                  placeholder="DDP"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  国内查验室
                </label>
                <select
                  name="customsRoom"
                  value={formData.customsRoom}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                >
                  <option value="无">无</option>
                  <option value="一号查验室">一号查验室</option>
                  <option value="二号查验室">二号查验室</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Shipping & Logistics Way */}
          <div>
            <h4 className="text-xs font-bold text-[#5c67f2] uppercase tracking-wider mb-3 border-b border-indigo-100 pb-1.5">
              3. 卡班海运与干线渠道信息
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  干线渠道
                </label>
                <input
                  type="text"
                  name="channel"
                  value={formData.channel}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                  placeholder="美森正班-定提"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  目的代号 / 仓库海外目的
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                  placeholder="US-ONT8"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  目的离岸邮编
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                  placeholder="91752"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  船名航次 / 航班号
                </label>
                <input
                  type="text"
                  name="vesselVoyage"
                  value={formData.vesselVoyage}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                  placeholder="COSCO PEKING / 082W"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  预计开船日 (ETD)
                </label>
                <input
                  type="date"
                  name="etd"
                  value={formData.etd}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  预计送达日 (ETA)
                </label>
                <input
                  type="date"
                  name="eta"
                  value={formData.eta}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Operational Status */}
          <div>
            <h4 className="text-xs font-bold text-[#5c67f2] uppercase tracking-wider mb-3 border-b border-indigo-100 pb-1.5">
              4. 运作状态与客服内部指派
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  运单状态
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                >
                  <option value="入仓">入仓</option>
                  <option value="出库">出库</option>
                  <option value="出仓">出仓</option>
                  <option value="运输">运输</option>
                  <option value="签收">签收</option>
                  <option value="扣货">扣货</option>
                  <option value="取消">取消</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  转单号 (海外面单/跟踪条码)
                </label>
                <input
                  type="text"
                  name="trackingNo"
                  value={formData.trackingNo}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                  placeholder="1Z9999..."
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  问题类型
                </label>
                <select
                  name="issueType"
                  value={formData.issueType}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                >
                  <option value="无">无异常</option>
                  <option value="资料缺失">资料缺失</option>
                  <option value="查验扣货">海关直属查验</option>
                  <option value="品名不符">品名不符</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  跟单员
                </label>
                <input
                  type="text"
                  name="merchandiser"
                  value={formData.merchandiser}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  业务员
                </label>
                <input
                  type="text"
                  name="salesman"
                  value={formData.salesman}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  专属客服
                </label>
                <input
                  type="text"
                  name="customerService"
                  value={formData.customerService}
                  onChange={handleChange}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Remarks */}
          <div>
            <h4 className="text-xs font-bold text-[#5c67f2] uppercase tracking-wider mb-3 border-b border-indigo-100 pb-1.5">
              5. 外部/内部双备注体系
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  客户留言 / 外部嘱咐
                </label>
                <textarea
                  name="clientRemark"
                  value={formData.clientRemark}
                  onChange={handleChange}
                  rows={2}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none resize-none"
                  placeholder="展示给客户的备注"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 font-semibold mb-1">
                  内部操作 / 协同备注
                </label>
                <textarea
                  name="internalRemark"
                  value={formData.internalRemark}
                  onChange={handleChange}
                  rows={2}
                  className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none resize-none"
                  placeholder="仅内部操作、跟单、业务可见"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="h-20 border-t border-slate-100 px-6 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="text-[11px] text-slate-400">
            * 确定保存后，将立即同步至本地数据库存储，并重新刷新列表。
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded text-xs text-slate-600 transition-all font-medium cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#5c67f2] hover:bg-[#4a55e0] active:bg-[#3f4bd0] text-white rounded text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              确认保存
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
