import { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, Search } from 'lucide-react';
import { FilterParams } from '../types';

interface FilterFormProps {
  onSearch: (filters: FilterParams) => void;
  onReset: () => void;
}

const initialFilters: FilterParams = {
  keyword: '',
  groupNo: '',
  operator: '',
  clientName: '',
  waybillNo: '',
  warehouseCode: '',
  zipCode: '',
  country: '',
  service: '',
  status: '全部',
  fbaNo: '',
  channel: '',
  declarationType: '全部',
  tradeMode: '全部',
  clientRemark: '',
  internalRemark: '',
  salesman: '',
  customerService: '',
  productName: '',
  merchandiser: '',
  label: '',
  taxPayment: '',
  trackingNo: '',
  invoiceMade: '全部',
  destination: '',
  unlabelled: '全部',
  warehouseAttr: '',
  createTimeStart: '',
  createTimeEnd: '',
  pickTimeStart: '',
  pickTimeEnd: '',
  outTimeStart: '',
  outTimeEnd: '',
  pickWarehouse: '',
  waybillType: '',
  hasInsurance: '全部',
  hasDocs: '全部',
  customsRoom: '全部',
};

type Field = {
  label: string;
  name: keyof FilterParams;
  placeholder?: string;
};

const advancedFields: Field[] = [
  { label: '客户', name: 'clientName', placeholder: '客户简称' },
  { label: '运单号', name: 'waybillNo', placeholder: '支持批量搜索' },
  { label: '仓库代码', name: 'warehouseCode', placeholder: '仓库代码' },
  { label: '国家', name: 'country', placeholder: '目的国家' },
  { label: '服务', name: 'service', placeholder: '渠道/服务' },
  { label: '邮编', name: 'zipCode', placeholder: '邮编' },
  { label: 'FBA单号', name: 'fbaNo', placeholder: 'FBA单号' },
  { label: '销售', name: 'salesman', placeholder: '业务员' },
];

export default function FilterForm({ onSearch, onReset }: FilterFormProps) {
  const [filters, setFilters] = useState<FilterParams>(initialFilters);
  const [expanded, setExpanded] = useState(false);

  const setField = (name: keyof FilterParams, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const reset = () => {
    setFilters(initialFilters);
    onReset();
  };

  return (
    <section className="bg-white border-b border-[#e9eef6] shadow-[0_2px_8px_rgba(31,45,61,0.05)]">
      <form
        className="px-3 py-[10px]"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(filters);
        }}
      >
        <div className="grid grid-cols-[450px_1fr_1fr_136px_136px_136px] gap-4 items-center">
          <div className="flex items-center">
            <select
              className="h-[28px] w-[100px] border border-[#d8e0ea] rounded-l-[2px] bg-[#f7f9fc] px-2 text-[12px] font-semibold text-[#596a7d] outline-none"
              aria-label="关键词类型"
            >
              <option>关键字</option>
              <option>运单号</option>
              <option>客户</option>
            </select>
            <input
              value={filters.keyword}
              onChange={(event) => setField('keyword', event.target.value)}
              placeholder='输入查询单号，多个用 "," 隔开'
              className="h-[28px] min-w-0 flex-1 border-y border-r border-[#d8e0ea] rounded-r-[2px] px-3 text-[12px] outline-none placeholder:text-[#b8c2cf] focus:border-[#0b5db8]"
            />
          </div>

          <label className="filter-inline">
            <span>集团单号</span>
            <input value={filters.groupNo} onChange={(event) => setField('groupNo', event.target.value)} placeholder="支持批量搜索" />
          </label>
          <label className="filter-inline">
            <span>经营单位</span>
            <input value={filters.operator} onChange={(event) => setField('operator', event.target.value)} placeholder="经营单位" />
          </label>
          <button type="submit" className="primary-btn h-[28px] justify-center">
            <Search className="h-3.5 w-3.5" />
            查询
          </button>
          <button type="button" onClick={reset} className="plain-btn h-[28px] justify-center">
            <RotateCcw className="h-3.5 w-3.5" />
            重置
          </button>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="plain-btn h-[28px] justify-center">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            展开
          </button>
        </div>

        {expanded && (
          <div className="mt-3 grid grid-cols-4 gap-x-5 gap-y-2">
            {advancedFields.map((field) => (
              <label key={field.name} className="filter-inline">
                <span>{field.label}</span>
                <input
                  value={filters[field.name]}
                  onChange={(event) => setField(field.name, event.target.value)}
                  placeholder={field.placeholder}
                />
              </label>
            ))}
          </div>
        )}
      </form>
    </section>
  );
}
