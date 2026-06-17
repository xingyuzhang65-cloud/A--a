import React, { useState, useEffect } from 'react';
import { Waybill } from '../types';
import { X, Plus, AlertCircle, Sparkles, Check, CheckSquare, Square } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  waybill: Waybill | null;
  onClose: () => void;
  onSave: (waybillId: string, updatedFields: Partial<Waybill>) => void;
}

interface PackingItem {
  fbaBoxNo: string;
  poNumber: string;
  engName: string;
  chnName: string;
  unitPrice: string;
  quantity: string;
  totalPrice: string;
  material: string;
  customsCode: string;
  usage: string;
  brand: string;
  model: string;
}

export default function InvoiceModal({ isOpen, waybill, onClose, onSave }: InvoiceModalProps) {
  if (!isOpen || !waybill) return null;

  // Recipient address state
  const [recipientType, setRecipientType] = useState<string>('TIKTOK');
  const [zipCode, setZipCode] = useState<string>(waybill.zipCode || '18031-1533');
  const [city, setCity] = useState<string>('Goodyear');
  const [company, setCompany] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('XD01_ONT1');
  const [stateCode, setStateCode] = useState<string>('CA');
  const [addressDetails, setAddressDetails] = useState<string>('Parc dActivites des Pierres Blanches 59220 Denain');

  // Declaration info state
  const [vatTaxNo, setVatTaxNo] = useState<string>('');
  const [declMethod, setDeclMethod] = useState<string>('报关退税');
  const [taxMethod, setTaxMethod] = useState<string>('包税');
  const [tradeMethod, setTradeMethod] = useState<string>(waybill.tradeMode || '9610');

  // Checkbox Materials state
  const [materials, setMaterials] = useState<string[]>(['玩具']);

  // Table items state
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);

  // Initialize data on mount / waybill change
  useEffect(() => {
    if (waybill) {
      setZipCode(waybill.zipCode || '18031-1533');
      
      // Determine default city & state based on destination (like ONT8 / LAX etc.)
      const dest = (waybill.destination || '').toUpperCase();
      if (dest.includes('LAX') || dest.includes('ONT') || dest.includes('LGB')) {
        setCity('Goodyear');
        setStateCode('CA');
        setRecipientName('XD01_ONT1');
      } else if (dest.includes('FTW')) {
        setCity('Dallas');
        setStateCode('TX');
        setRecipientName('XD02_FTW1');
      } else if (dest.includes('IND')) {
        setCity('Indianapolis');
        setStateCode('IN');
        setRecipientName('XD03_IND9');
      } else {
        setCity('Goodyear');
        setStateCode('CA');
        setRecipientName('XD01_ONT1');
      }

      setAddressDetails('Parc dActivites des Pierres Blanches 59220 Denain');

      // Sync tradeMode from waybill
      setTradeMethod(waybill.tradeMode || '9610');
      
      // Initialize checkboxes
      if (waybill.productName.toLowerCase().includes('玩具') || waybill.productName.toLowerCase().includes('toy')) {
        setMaterials(['玩具']);
      } else if (waybill.productName.toLowerCase().includes('衣服') || waybill.productName.toLowerCase().includes('纺织')) {
        setMaterials(['纺织品']);
      } else if (waybill.productName.toLowerCase().includes('电') || waybill.productName.toLowerCase().includes('机')) {
        setMaterials(['带电', '电子类']);
      } else {
        setMaterials(['普货']);
      }

      // Initialize packing items (11 rows matching the mockup)
      const initialItems: PackingItem[] = [];
      
      // Row 1: Prepopulated from waybill's live metadata
      const defaultUnitPrice = (waybill.declarationValue / 150).toFixed(2);
      initialItems.push({
        fbaBoxNo: waybill.fbaNo || 'US-FBA-BOX-01',
        poNumber: 'PO2026' + waybill.waybillNo.substring(waybill.waybillNo.length - 6),
        engName: getEngNameSuggestion(waybill.productName),
        chnName: waybill.productName,
        unitPrice: String(defaultUnitPrice),
        quantity: '150',
        totalPrice: String(Number(defaultUnitPrice) * 150),
        material: '塑料 / 织物',
        customsCode: '9503.00.0000',
        usage: '儿童娱乐 / 装饰',
        brand: '无品牌',
        model: 'XS-M1'
      });

      // Add 10 additional blank rows (making 11 rows total as seen in the mockup)
      for (let i = 0; i < 10; i++) {
        initialItems.push({
          fbaBoxNo: '',
          poNumber: '',
          engName: '',
          chnName: '',
          unitPrice: '',
          quantity: '',
          totalPrice: '',
          material: '',
          customsCode: '',
          usage: '',
          brand: '',
          model: ''
        });
      }

      setPackingItems(initialItems);
    }
  }, [waybill]);

  const getEngNameSuggestion = (chnName: string) => {
    if (chnName.includes('玩具')) return 'Children Plastic Toys';
    if (chnName.includes('家居')) return 'Home Wooden Chair';
    if (chnName.includes('服') || chnName.includes('纺织')) return 'Polyester T-Shirt';
    if (chnName.includes('电子') || chnName.includes('电')) return 'USB Charging Cables';
    return 'General Commodities';
  };

  // Add 10 lines to table
  const handleAddTenLines = () => {
    const extraRows: PackingItem[] = Array.from({ length: 10 }).map(() => ({
      fbaBoxNo: '',
      poNumber: '',
      engName: '',
      chnName: '',
      unitPrice: '',
      quantity: '',
      totalPrice: '',
      material: '',
      customsCode: '',
      usage: '',
      brand: '',
      model: ''
    }));
    setPackingItems(prev => [...prev, ...extraRows]);
  };

  // Handle cell edits
  const handleCellChange = (rowIndex: number, field: keyof PackingItem, value: string) => {
    setPackingItems(prev => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [field]: value };

      // Dynamically calculate total price if price or quantity changes
      if (field === 'unitPrice' || field === 'quantity') {
        const uPrice = parseFloat(updated[rowIndex].unitPrice) || 0;
        const qty = parseInt(updated[rowIndex].quantity) || 0;
        if (uPrice && qty) {
          updated[rowIndex].totalPrice = (uPrice * qty).toFixed(2);
        } else {
          updated[rowIndex].totalPrice = '';
        }
      }
      return updated;
    });
  };

  // Checkbox operations
  const handleToggleMaterial = (mat: string) => {
    setMaterials(prev => 
      prev.includes(mat) ? prev.filter(m => m !== mat) : [...prev, mat]
    );
  };

  // Calculate aggregation totals
  const totalQty = packingItems.reduce((acc, curr) => {
    const qCount = parseInt(curr.quantity);
    return acc + (isNaN(qCount) ? 0 : qCount);
  }, 0);

  const totalValue = packingItems.reduce((acc, curr) => {
    const val = parseFloat(curr.totalPrice);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  // Quick preset loader when clicking "选择非FBA地址" (Select non-FBA address)
  const handleSelectNonFBA = (e: React.MouseEvent) => {
    e.preventDefault();
    setRecipientName('Smith Cargo Hub');
    setZipCode('90045');
    setCity('Los Angeles');
    setStateCode('CA');
    setAddressDetails('102 South Aviation Blvd, Gateway El Segundo, Suite 800');
    setCompany('West-Pacific Fulfillment Corp');
  };

  // Submit form handler
  const handleSubmit = (isDraft: boolean) => {
    if (!zipCode.trim()) {
      alert('请输入必填的邮政编码！');
      return;
    }
    if (!addressDetails.trim()) {
      alert('请输入必填的具体收货地址详情！');
      return;
    }

    // Save fields back
    onSave(waybill.id, {
      invoiceMade: isDraft ? '草稿录入中' : '已制作',
      zipCode: zipCode,
      destination: city || waybill.destination,
      declarationValue: totalValue > 0 ? totalValue : waybill.declarationValue,
      tradeMode: tradeMethod
    });

    const statusMsg = isDraft ? '发票草稿保存成功！' : '发票制作完成并成功提交提交业务系统！';
    alert(`🎉 【${waybill.waybillNo}】 ${statusMsg}\n\n• 收件人: ${recipientName}\n• 总申报价值: $${(totalValue > 0 ? totalValue : waybill.declarationValue).toLocaleString()}\n• 总申报数量: ${totalQty || 150} 个\n• 材质选择: ${materials.join(', ')}`);
    onClose();
  };

  const materialOptions = [
    '带磁', '带电', '纺织品', '玻璃制品', '普货', '玩具', 
    'FDA产品', '成人用品', '木制品', '钢铁铝类', '冲货类', 
    '电子类', '灯类', '自行车类', '粉末', '液体'
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 overflow-y-auto flex items-start justify-center p-4">
      <div className="bg-slate-50 w-full max-w-[97vw] rounded-xl shadow-2xl overflow-hidden my-4 border border-slate-200 animate-fadeIn flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
              title="关闭窗口"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="font-bold text-slate-800 text-sm tracking-wide">制作发票</span>
          </div>
          <div className="text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded font-medium">
            安速精细发票工作台 v2.3
          </div>
        </div>

        {/* Modal Body Scroll Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Top Info Strip */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-6 flex-wrap">
              <button className="px-3.5 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded text-xs tracking-wider cursor-pointer shadow-sm">
                导入发票
              </button>
              
              <div className="text-xs space-y-1.5">
                <div className="flex items-center gap-6 flex-wrap">
                  <span>
                    <strong className="text-slate-400 font-medium">运单号：</strong>
                    <strong className="text-orange-500 font-extrabold font-mono text-xs">{waybill.waybillNo}</strong>
                  </span>
                  <span>
                    <strong className="text-slate-400 font-medium">目的地：</strong>
                    <strong className="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px]">{waybill.destination || '美国'}</strong>
                  </span>
                  <span>
                    <strong className="text-slate-400 font-medium">渠道：</strong>
                    <strong className="text-slate-800 font-semibold">{waybill.channel}</strong>
                  </span>
                  <span>
                    <strong className="text-slate-400 font-medium">件数：</strong>
                    <strong className="text-[#3b82f6] font-bold font-mono">{waybill.attachments || 1}</strong>
                  </span>
                </div>
                <div>
                  <strong className="text-slate-400 font-medium">客户简称：</strong>
                  <span className="text-slate-800 font-bold">{waybill.clientName}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left Block: 收件地址信息 (8 columns) */}
            <div className="lg:col-span-9 bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-3.5 bg-[#3b82f6] rounded-full"></span>
                  收件地址信息
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                
                {/* Column 1 */}
                <div className="space-y-3.5">
                  {/* Waybill Type Radio Group */}
                  <div className="text-xs">
                    <label className="text-slate-500 font-semibold mb-1 w-full block">
                      <span className="text-red-500 mr-0.5 font-bold">*</span> 运单类型：
                    </label>
                    <div className="flex items-center gap-3.5 flex-wrap pt-1 select-none">
                      {['亚马逊', '沃尔玛', '私人地址', '邮政小包', 'TIKTOK'].map(type => (
                        <label key={type} className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 transition-colors">
                          <input
                            type="radio"
                            name="recipientType"
                            checked={recipientType === type}
                            onChange={() => setRecipientType(type)}
                            className="w-3.5 h-3.5 text-[#3b82f6] border-slate-300 focus:ring-[#3b82f6] accent-[#3b82f6] cursor-pointer"
                          />
                          <span className="font-medium text-slate-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Zip Code */}
                  <div className="text-xs">
                    <label className="text-slate-500 font-semibold mb-1 block">
                      <span className="text-red-500 mr-0.5 font-bold">*</span> 邮编：
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-350 bg-white rounded p-2 text-xs focus:ring-1 focus:ring-[#3b82f6] focus:outline-none placeholder-slate-400 font-mono tracking-wide"
                      placeholder="请填写目的国邮编信息"
                      value={zipCode}
                      onChange={e => setZipCode(e.target.value)}
                    />
                  </div>

                  {/* City */}
                  <div className="text-xs">
                    <label className="text-slate-500 font-semibold mb-1 block">城市：</label>
                    <input
                      type="text"
                      className="w-full border border-slate-350 bg-white rounded p-2 text-xs focus:ring-1 focus:ring-[#3b82f6] focus:outline-none placeholder-slate-400 font-mono"
                      placeholder="Goodyear"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    />
                  </div>

                  {/* Company */}
                  <div className="text-xs">
                    <label className="text-slate-400 font-medium mb-1 block">公司：</label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 bg-white rounded p-2 text-xs focus:ring-1 focus:ring-[#3b82f6] focus:outline-none placeholder-slate-400"
                      placeholder="请填写公司"
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                    />
                  </div>

                  {/* Remarks */}
                  <div className="text-xs relative">
                    <label className="text-slate-400 font-medium mb-1 block">备注：</label>
                    <textarea
                      rows={2.5}
                      maxLength={200}
                      className="w-full border border-slate-200 bg-white rounded p-2 text-xs focus:ring-1 focus:ring-[#3b82f6] focus:outline-none placeholder-slate-400 resize-none"
                      placeholder="请填写发票备注"
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                    ></textarea>
                    <span className="absolute bottom-2.5 right-2 py-0.5 px-1 bg-white/80 text-[10px] text-slate-400 font-mono rounded">
                      {remarks.length} / 200
                    </span>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-3.5">
                  
                  {/* Recipient / Consignee */}
                  <div className="text-xs">
                    <label className="text-slate-500 font-semibold mb-1 block">收件人：</label>
                    <input
                      type="text"
                      className="w-full border border-slate-350 bg-white rounded p-2 text-xs focus:ring-1 focus:ring-[#3b82f6] focus:outline-none font-mono"
                      placeholder="XD01_ONT1"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                    />
                    <div className="mt-1">
                      <a 
                        href="#non-fba" 
                        onClick={handleSelectNonFBA} 
                        className="text-[#3b82f6] hover:underline hover:text-[#2563eb] text-[10px] font-bold"
                      >
                        选择非FBA地址
                      </a>
                    </div>
                  </div>

                  {/* State */}
                  <div className="text-xs">
                    <label className="text-slate-500 font-semibold mb-1 block">州：</label>
                    <input
                      type="text"
                      className="w-full border border-slate-350 bg-white rounded p-2 text-xs focus:ring-1 focus:ring-[#3b82f6] focus:outline-none font-mono font-bold"
                      placeholder="CA"
                      value={stateCode}
                      onChange={e => setStateCode(e.target.value)}
                    />
                  </div>

                  {/* Address Details */}
                  <div className="text-xs relative">
                    <label className="text-slate-500 font-semibold mb-1 block">
                      <span className="text-red-500 mr-0.5 font-bold">*</span> 地址详情：
                    </label>
                    <textarea
                      rows={4.5}
                      maxLength={200}
                      className="w-full border border-slate-350 bg-white rounded p-2 text-xs focus:ring-1 focus:ring-[#3b82f6] focus:outline-none resize-none leading-relaxed font-sans"
                      placeholder="地址详情"
                      value={addressDetails}
                      onChange={e => setAddressDetails(e.target.value)}
                    ></textarea>
                    <span className="absolute bottom-2.5 right-2 py-0.5 px-1 bg-white/80 text-[10px] text-slate-400 font-mono rounded">
                      {addressDetails.length} / 200
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Block: 报关信息 (3 columns) */}
            <div className="lg:col-span-3 bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-3.5 bg-[#3b82f6] rounded-full"></span>
                  报关信息
                </h4>
              </div>

              <div className="space-y-3.5">
                {/* VAT No */}
                <div className="text-xs">
                  <label className="text-slate-400 font-medium mb-1 block">VAT税号：</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 bg-white rounded p-2 text-xs focus:ring-1 focus:ring-[#3b82f6] focus:outline-none placeholder-slate-350 font-mono"
                    placeholder="请填写VAT税号"
                    value={vatTaxNo}
                    onChange={e => setVatTaxNo(e.target.value)}
                  />
                </div>

                {/* Declaration Method */}
                <div className="text-xs">
                  <label className="text-slate-500 font-semibold mb-1 block">
                    <span className="text-red-500 mr-0.5 font-bold">*</span> 报关方式：
                  </label>
                  <div className="flex items-center gap-3.5 pt-0.5">
                    {['报关退税', '托管报关'].map(m => (
                      <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="declMethod"
                          checked={declMethod === m}
                          onChange={() => setDeclMethod(m)}
                          className="w-3.5 h-3.5 text-[#3b82f6] border-slate-300 accent-[#3b82f6] cursor-pointer"
                        />
                        <span className="text-slate-700 font-medium">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Trade Mode — only visible when 报关退税 is selected */}
                {declMethod === '报关退税' && (
                  <div className="text-xs">
                    <label className="text-slate-500 font-semibold mb-1 block">贸易方式：</label>
                    <select
                      className="w-full border border-slate-200 bg-white rounded p-2 text-xs focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer font-mono"
                      value={tradeMethod}
                      onChange={e => setTradeMethod(e.target.value)}
                    >
                      <option value="9610">9610</option>
                      <option value="9710">9710</option>
                      <option value="9810">9810</option>
                      <option value="0110">0110</option>
                      <option value="1039">1039</option>
                    </select>
                  </div>
                )}

                {/* Tax Payment Method */}
                <div className="text-xs">
                  <label className="text-slate-500 font-semibold mb-1 block">
                    <span className="text-red-500 mr-0.5 font-bold">*</span> 交税方式：
                  </label>
                  <div className="flex items-center gap-3.5 pt-0.5">
                    {['包税', '非包税'].map(m => (
                      <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="taxMethod"
                          checked={taxMethod === m}
                          onChange={() => setTaxMethod(m)}
                          className="w-3.5 h-3.5 text-[#3b82f6] border-slate-300 accent-[#3b82f6] cursor-pointer"
                        />
                        <span className="text-slate-700 font-medium">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Block Area: 装箱信息 & Material checkboxes */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-150 pb-2.5 flex items-center justify-between gap-4 flex-wrap">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-3.5 bg-[#3b82f6] rounded-full"></span>
                装箱信息
              </h4>
              <div className="text-xs bg-orange-50 text-orange-600 font-bold px-3 py-1 rounded-full border border-orange-100 flex items-center gap-4">
                <span>申报币种：<strong className="font-mono text-[13px] text-orange-700">USD</strong></span>
                <span>总申报数量：<strong className="font-mono text-[13px] text-orange-700">{totalQty || 150}</strong></span>
                <span>总申报价值：<strong className="font-mono text-[13px] text-orange-700">${totalValue > 0 ? totalValue.toLocaleString(undefined, {minimumFractionDigits: 2}) : Number(waybill.declarationValue).toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Materials Checkbox Grid */}
            <div className="text-xs space-y-1.5">
              <div className="text-slate-500 font-semibold">
                <span className="text-red-500 font-bold mr-0.5">*</span> 材质：
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 bg-slate-50 p-3 rounded border border-slate-100">
                {materialOptions.map(opt => {
                  const isChecked = materials.includes(opt);
                  return (
                    <label 
                      key={opt} 
                      className={`flex items-center gap-1.5 cursor-pointer text-slate-700 select-none hover:text-slate-900 transition-colors ${
                        isChecked ? 'font-bold text-[#3b82f6]' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMaterial(opt)}
                        className="rounded border-slate-300 text-[#3b82f6] focus:ring-[#3b82f6] w-3.5 h-3.5 accent-[#3b82f6] cursor-pointer"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Packing Rows Action and Interactive Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleAddTenLines}
                  className="px-3 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> 新增10行
                </button>
                <span className="text-[10px] text-slate-400">
                  提示：您可以双击或点击格项单元格直接编辑，表格将实时演算汇总
                </span>
              </div>

              {/* Table wrapper with robust horizontal scrolling */}
              <div className="w-full overflow-x-auto border border-slate-200 rounded">
                <table className="w-full border-collapse text-left min-w-[1250px] text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] whitespace-nowrap">
                      <th className="px-3 py-2 text-center font-mono text-slate-400 w-8">#</th>
                      <th className="px-3 py-2 border-r border-slate-200 min-w-[120px]">FBA箱号</th>
                      <th className="px-3 py-2 border-r border-slate-200 min-w-[110px]">PO Number</th>
                      <th className="px-3 py-2 border-r border-slate-200 min-w-[130px]">产品英文名</th>
                      <th className="px-3 py-2 border-r border-slate-200 min-w-[120px]">产品中文名</th>
                      <th className="px-3 py-2 border-r border-slate-200 min-w-[90px]">产品申报单价</th>
                      <th className="px-3 py-2 border-r border-slate-200 min-w-[90px]">产品申报数量</th>
                      <th className="px-3 py-2 border-r border-slate-200 min-w-[100px]">产品申报总价</th>
                      <th className="px-3 py-2 border-r border-slate-200 min-w-[100px]">产品材质</th>
                      <th className="px-3 py-2 border-r border-slate-200 min-w-[110px]">产品海关编码</th>
                      <th className="px-3 py-2 border-r border-slate-200 min-w-[110px]">产品用途</th>
                      <th className="px-3 py-2 border-r border-slate-200 min-w-[90px]">产品品牌</th>
                      <th className="px-3 py-2">产品型号</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 bg-white">
                    {packingItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-1.5 text-center font-mono text-slate-400 font-bold bg-slate-50">
                          {idx + 1}
                        </td>
                        
                        {/* FBA Box No */}
                        <td className="p-0.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.fbaBoxNo}
                            onChange={e => handleCellChange(idx, 'fbaBoxNo', e.target.value)}
                            className="w-full bg-transparent p-1 border border-transparent rounded focus:border-blue-400 focus:bg-white text-xs outline-none font-mono"
                            placeholder="请输入箱号"
                          />
                        </td>

                        {/* PO Number */}
                        <td className="p-0.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.poNumber}
                            onChange={e => handleCellChange(idx, 'poNumber', e.target.value)}
                            className="w-full bg-transparent p-1 border border-transparent rounded focus:border-blue-400 focus:bg-white text-xs outline-none font-mono"
                            placeholder="填写PO"
                          />
                        </td>

                        {/* English Name */}
                        <td className="p-0.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.engName}
                            onChange={e => handleCellChange(idx, 'engName', e.target.value)}
                            className="w-full bg-transparent p-1 border border-transparent rounded focus:border-blue-400 focus:bg-white text-xs outline-none"
                            placeholder="English Name"
                          />
                        </td>

                        {/* Chinese Name */}
                        <td className="p-0.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.chnName}
                            onChange={e => handleCellChange(idx, 'chnName', e.target.value)}
                            className="w-full bg-transparent p-1 border border-transparent rounded focus:border-blue-400 focus:bg-white text-xs outline-none font-medium"
                            placeholder="产品中文品名"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="p-0.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.unitPrice}
                            onChange={e => handleCellChange(idx, 'unitPrice', e.target.value)}
                            className="w-full bg-transparent p-1 border border-transparent rounded focus:border-blue-400 focus:bg-white text-xs outline-none font-mono font-semibold"
                            placeholder="0.00"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="p-0.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={e => handleCellChange(idx, 'quantity', e.target.value)}
                            className="w-full bg-transparent p-1 border border-transparent rounded focus:border-blue-400 focus:bg-white text-xs outline-none font-mono font-bold text-blue-600"
                            placeholder="0"
                          />
                        </td>

                        {/* Total Price (Derived / Editable for overriding) */}
                        <td className="p-1 border-r border-slate-200 font-mono text-[11px] font-bold text-slate-800 bg-slate-50/70 text-right">
                          {item.totalPrice ? `$${parseFloat(item.totalPrice).toFixed(2)}` : '-'}
                        </td>

                        {/* Material details */}
                        <td className="p-0.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.material}
                            onChange={e => handleCellChange(idx, 'material', e.target.value)}
                            className="w-full bg-transparent p-1 border border-transparent rounded focus:border-blue-400 focus:bg-white text-xs outline-none"
                            placeholder="材质细则如 塑料"
                          />
                        </td>

                        {/* Customs HS Code */}
                        <td className="p-0.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.customsCode}
                            onChange={e => handleCellChange(idx, 'customsCode', e.target.value)}
                            className="w-full bg-transparent p-1 border border-transparent rounded focus:border-blue-400 focus:bg-white text-xs outline-none font-mono"
                            placeholder="9503.00.*"
                          />
                        </td>

                        {/* Usage */}
                        <td className="p-0.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.usage}
                            onChange={e => handleCellChange(idx, 'usage', e.target.value)}
                            className="w-full bg-transparent p-1 border border-transparent rounded focus:border-blue-400 focus:bg-white text-xs outline-none"
                            placeholder="主要用途"
                          />
                        </td>

                        {/* Brand */}
                        <td className="p-0.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.brand}
                            onChange={e => handleCellChange(idx, 'brand', e.target.value)}
                            className="w-full bg-transparent p-1 border border-transparent rounded focus:border-blue-400 focus:bg-white text-xs outline-none"
                            placeholder="牌子"
                          />
                        </td>

                        {/* Model */}
                        <td className="p-0.5">
                          <input
                            type="text"
                            value={item.model}
                            onChange={e => handleCellChange(idx, 'model', e.target.value)}
                            className="w-full bg-transparent p-1 border border-transparent rounded focus:border-blue-400 focus:bg-white text-xs outline-none font-mono"
                            placeholder="型号规格"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="h-16 bg-white border-t border-slate-200 px-6 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={() => handleSubmit(true)}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-md transition-all cursor-pointer shadow-xs"
          >
            保存草稿
          </button>
          
          <button
            onClick={() => handleSubmit(false)}
            className="px-6 py-2 bg-[#3b82f6] hover:bg-[#2563eb] active:bg-[#1d4ed8] text-white text-xs font-extrabold rounded-md transition-all cursor-pointer shadow-md tracking-wide"
          >
            提交发票
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-xs font-semibold rounded-md transition-all cursor-pointer"
          >
            取消
          </button>
        </div>

      </div>
    </div>
  );
}
