import React, { useState } from 'react';
import { FilterParams } from '../types';
import { Search, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterFormProps {
  onSearch: (filters: FilterParams) => void;
  onReset: () => void;
}

const initialFilters: FilterParams = {
  keyword: '',
  clientName: '',
  warehouseCode: '',
  zipCode: '',
  merchandiser: '',
  label: '',
  waybillNo: '',
  invoiceMade: '全部',
  destination: '',
  unlabelled: '全部',
  taxPayment: '',
  operator: '',
  trackingNo: '',
  declarationType: '全部',
  tradeMode: '全部',
  clientRemark: '',
  warehouseAttr: '',
  createTimeStart: '',
  createTimeEnd: '',
  pickTimeStart: '',
  pickTimeEnd: '',
  fbaNo: '',
  channel: '',
  internalRemark: '',
  outTimeStart: '',
  outTimeEnd: '',
  pickWarehouse: '',
  salesman: '',
  customerService: '',
  waybillType: '',
  hasInsurance: '全部',
  hasDocs: '全部',
  customsRoom: '全部',
  productName: ''
};

type FieldConfig = {
  label: string;
  name: keyof FilterParams;
  placeholder?: string;
  type?: 'text' | 'select' | 'date-range';
  options?: string[];
  endName?: keyof FilterParams;
};

const visibleFields: FieldConfig[] = [
  { label: '关键字', name: 'keyword', placeholder: '支持批量(空格/逗号隔开)' },
  { label: '客户简称', name: 'clientName', placeholder: '客户简称' },
  { label: '仓库代码', name: 'warehouseCode', placeholder: '仓库代码' },
  { label: '邮编', name: 'zipCode', placeholder: '邮编' },
  { label: '跟单员', name: 'merchandiser', placeholder: '跟单员' },
  { label: '标签', name: 'label', placeholder: '标签' },
  { label: '运单号', name: 'waybillNo', placeholder: '支持批量(空格/逗号隔开)' },
  { label: '制作发票', name: 'invoiceMade', type: 'select', options: ['全部', '已制作', '未制作'] },
  { label: '目的地', name: 'destination', placeholder: '目的地' },
  { label: '报关方式', name: 'declarationType', type: 'select', options: ['全部', '买单报关', '一般贸易', '自单报关'] },
  { label: '贸易方式', name: 'tradeMode', type: 'select', options: ['全部', '9610', '9710', '9810', '0110', '1039'] },
  { label: '客户备注', name: 'clientRemark', placeholder: '客户备注' },
  { label: 'FBA单号', name: 'fbaNo', placeholder: '支持批量(空格/逗号隔开)' },
  { label: '渠道', name: 'channel', placeholder: '渠道' },
  { label: '内部备注', name: 'internalRemark', placeholder: '内部备注' },
  { label: '下单时间', name: 'createTimeStart', endName: 'createTimeEnd', type: 'date-range' },
  { label: '拣货时间', name: 'pickTimeStart', endName: 'pickTimeEnd', type: 'date-range' },
  { label: '业务员', name: 'salesman', placeholder: '业务员' }
];

const advancedFields: FieldConfig[] = [
  { label: '转单号', name: 'trackingNo', placeholder: '转单号' },
  { label: '经营单位', name: 'operator', placeholder: '经营单位' },
  { label: '交税方式', name: 'taxPayment', placeholder: 'DDP/DDU' },
  { label: '拣货仓库', name: 'pickWarehouse', placeholder: '拣货仓库' },
  { label: '出仓时间', name: 'outTimeStart', endName: 'outTimeEnd', type: 'date-range' },
  { label: '客服', name: 'customerService', placeholder: '客服' },
  { label: '运单类型', name: 'waybillType', placeholder: '运单类型' },
  { label: '有无退运保', name: 'hasInsurance', type: 'select', options: ['全部', '有', '无'] },
  { label: '有无报关资料', name: 'hasDocs', type: 'select', options: ['全部', '有', '无'] },
  { label: '国内查验室', name: 'customsRoom', type: 'select', options: ['全部', '一号查验室', '二号查验室', '无'] },
  { label: '品名', name: 'productName', placeholder: '空格表示 AND 查询' },
  { label: '仓库属性', name: 'warehouseAttr', placeholder: '仓库属性' }
];

const inputClass = 'h-[32px] w-full border border-[#dcdfe6] bg-white px-3 text-[12px] text-[#344255] outline-none placeholder:text-[#b6beca] focus:border-[#1890ff]';

export default function FilterForm({ onSearch, onReset }: FilterFormProps) {
  const [filters, setFilters] = useState<FilterParams>(initialFilters);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    onReset();
  };

  const renderField = (field: FieldConfig) => {
    if (field.type === 'select') {
      return (
        <label key={field.name} className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2">
          <span className="text-right text-[12px] font-semibold text-[#344255]">{field.label}</span>
          <select
            name={field.name}
            value={filters[field.name]}
            onChange={handleInputChange}
            className={`${inputClass} cursor-pointer`}
          >
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      );
    }

    if (field.type === 'date-range' && field.endName) {
      return (
        <label key={field.name} className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2">
          <span className="text-right text-[12px] font-semibold text-[#344255]">{field.label}</span>
          <div className="grid grid-cols-[1fr_18px_1fr] items-center border border-[#dcdfe6] bg-white">
            <input
              type="date"
              name={field.name}
              value={filters[field.name]}
              onChange={handleInputChange}
              className="h-[30px] min-w-0 border-0 bg-transparent px-2 text-[12px] outline-none"
            />
            <span className="text-center text-[#9aa5b1]">→</span>
            <input
              type="date"
              name={field.endName}
              value={filters[field.endName]}
              onChange={handleInputChange}
              className="h-[30px] min-w-0 border-0 bg-transparent px-2 text-[12px] outline-none"
            />
          </div>
        </label>
      );
    }

    return (
      <label key={field.name} className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2">
        <span className="text-right text-[12px] font-semibold text-[#344255]">{field.label}</span>
        <input
          type="text"
          name={field.name}
          placeholder={field.placeholder}
          value={filters[field.name]}
          onChange={handleInputChange}
          className={inputClass}
        />
      </label>
    );
  };

  return (
    <section className="rounded-[4px] border border-[#e5e9f0] bg-white p-[10px] shadow-[0_2px_8px_rgba(31,45,61,0.08)]">
      <form onSubmit={handleSearch}>
        <div className="grid grid-cols-3 2xl:grid-cols-4 gap-x-5 gap-y-[6px]">
          {visibleFields.map(renderField)}
          {isExpanded && advancedFields.map(renderField)}
        </div>

        <div className="mt-[10px] flex items-center gap-2 pl-[82px]">
          <button
            type="submit"
            className="h-[32px] px-5 bg-[#1890ff] hover:bg-[#087fe7] text-white rounded-[2px] text-[12px] font-semibold flex items-center gap-1.5"
          >
            <Search className="h-3.5 w-3.5" />
            搜索
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="h-[32px] px-5 border border-[#dcdfe6] bg-white hover:bg-[#f7f9fc] text-[#344255] rounded-[2px] text-[12px] font-semibold flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重置
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-[32px] px-5 border border-[#dcdfe6] bg-white hover:bg-[#f7f9fc] text-[#344255] rounded-[2px] text-[12px] font-semibold flex items-center gap-1.5"
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {isExpanded ? '收起' : '展开'}
          </button>
        </div>
      </form>
    </section>
  );
}
