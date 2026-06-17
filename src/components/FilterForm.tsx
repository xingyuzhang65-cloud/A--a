import React, { useState } from 'react';
import { FilterParams } from '../types';
import { Search, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

export default function FilterForm({ onSearch, onReset }: FilterFormProps) {
  const [filters, setFilters] = useState<FilterParams>(initialFilters);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

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

  return (
    <div className="bg-white p-5 rounded-lg border border-[#e2e8f0] shadow-sm mb-6 transition-all">
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Core Quick Filters (Always visible as Row 1) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center">
              关键字
            </label>
            <input
              type="text"
              name="keyword"
              placeholder="支持批量(空格/逗号分)"
              value={filters.keyword}
              onChange={handleInputChange}
              className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:ring-1 focus:ring-[#5c67f2]/20 focus:outline-none transition-all placeholder:text-slate-400 bg-slate-50 hover:bg-slate-50/50"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1.5">客户简称</label>
            <input
              type="text"
              name="clientName"
              placeholder="客户姓名/简称"
              value={filters.clientName}
              onChange={handleInputChange}
              className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1.5">仓库代码</label>
            <input
              type="text"
              name="warehouseCode"
              placeholder="仓库代码,如SZ01"
              value={filters.warehouseCode}
              onChange={handleInputChange}
              className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1.5">邮编</label>
            <input
              type="text"
              name="zipCode"
              placeholder="目的邮编"
              value={filters.zipCode}
              onChange={handleInputChange}
              className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1.5">跟单员</label>
            <input
              type="text"
              name="merchandiser"
              placeholder="跟单员姓名"
              value={filters.merchandiser}
              onChange={handleInputChange}
              className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1.5">标签</label>
            <input
              type="text"
              name="label"
              placeholder="危险品/高价值/重货"
              value={filters.label}
              onChange={handleInputChange}
              className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Expandable Advanced Filters Portion with smooth animation */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden space-y-4 pt-1"
            >
              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">运单号</label>
                  <input
                    type="text"
                    name="waybillNo"
                    placeholder="批量空格隔开"
                    value={filters.waybillNo}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">制作发票</label>
                  <select
                    name="invoiceMade"
                    value={filters.invoiceMade}
                    onChange={handleInputChange}
                    className="px-2.5 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 cursor-pointer"
                  >
                    <option value="全部">全部类型</option>
                    <option value="已制作">已制作发票</option>
                    <option value="未制作">未制作发票</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">目的地</label>
                  <input
                    type="text"
                    name="destination"
                    placeholder="FBA仓库代码"
                    value={filters.destination}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">报关方式</label>
                  <select
                    name="declarationType"
                    value={filters.declarationType}
                    onChange={handleInputChange}
                    className="px-2.5 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 cursor-pointer"
                  >
                    <option value="全部">全部方式</option>
                    <option value="买单报关">买单报关</option>
                    <option value="一般贸易">一般贸易</option>
                    <option value="自单报关">自单报关</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">交税方式</label>
                  <input
                    type="text"
                    name="taxPayment"
                    placeholder="如 DDP/DDU"
                    value={filters.taxPayment}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">经营单位</label>
                  <input
                    type="text"
                    name="operator"
                    placeholder="如安速货运"
                    value={filters.operator}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">转单号</label>
                  <input
                    type="text"
                    name="trackingNo"
                    placeholder="海外快递面单号"
                    value={filters.trackingNo}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">客户备注</label>
                  <input
                    type="text"
                    name="clientRemark"
                    placeholder="全模糊查询"
                    value={filters.clientRemark}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">下单时间范围</label>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded p-1">
                    <input
                      type="date"
                      name="createTimeStart"
                      value={filters.createTimeStart}
                      onChange={handleInputChange}
                      className="w-full text-xs bg-transparent border-0 focus:outline-none focus:ring-0 p-1"
                    />
                    <span className="text-slate-400 text-xs shrink-0 px-1">→</span>
                    <input
                      type="date"
                      name="createTimeEnd"
                      value={filters.createTimeEnd}
                      onChange={handleInputChange}
                      className="w-full text-xs bg-transparent border-0 focus:outline-none focus:ring-0 p-1"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">FBA单号</label>
                  <input
                    type="text"
                    name="fbaNo"
                    placeholder="支持批量模糊"
                    value={filters.fbaNo}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">渠道</label>
                  <input
                    type="text"
                    name="channel"
                    placeholder="美森 / 以星 / 铁路"
                    value={filters.channel}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">内部备注</label>
                  <input
                    type="text"
                    name="internalRemark"
                    placeholder="内部备注查询"
                    value={filters.internalRemark}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">业务员</label>
                  <input
                    type="text"
                    name="salesman"
                    placeholder="业务员姓名"
                    value={filters.salesman}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">客服</label>
                  <input
                    type="text"
                    name="customerService"
                    placeholder="客服指派"
                    value={filters.customerService}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">有无退运保</label>
                  <select
                    name="hasInsurance"
                    value={filters.hasInsurance}
                    onChange={handleInputChange}
                    className="px-2.5 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 cursor-pointer"
                  >
                    <option value="全部">全部</option>
                    <option value="有">有</option>
                    <option value="无">无</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">有无报关资料</label>
                  <select
                    name="hasDocs"
                    value={filters.hasDocs}
                    onChange={handleInputChange}
                    className="px-2.5 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 cursor-pointer"
                  >
                    <option value="全部">全部</option>
                    <option value="有">有</option>
                    <option value="无">无</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">国内查验室</label>
                  <select
                    name="customsRoom"
                    value={filters.customsRoom}
                    onChange={handleInputChange}
                    className="px-2.5 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 cursor-pointer"
                  >
                    <option value="全部">全部</option>
                    <option value="一号查验室">一号查验室</option>
                    <option value="二号查验室">二号查验室</option>
                    <option value="无">无</option>
                  </select>
                </div>
              </div>

              {/* Row 5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col md:col-span-2 lg:col-span-1">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5">品名 (全模糊，空格为AND)</label>
                  <input
                    type="text"
                    name="productName"
                    placeholder="如: LED 钢 管"
                    value={filters.productName}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-xs border border-slate-200 rounded focus:border-[#5c67f2] focus:outline-none bg-slate-50 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Form Action Buttons */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 flex-wrap gap-2">
          <div className="text-xs text-slate-400">
            * 提示：高级过滤条件输入后，点击 “<strong>搜索</strong>” 按钮统一提交筛选。
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-[#5c67f2] hover:bg-[#4a55e0] active:bg-[#3f4bd0] text-white rounded text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              搜索
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  收起高级条件
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  展开高级条件
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
