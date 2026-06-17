import React from 'react';
import { Waybill } from '../types';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Ship, Box } from 'lucide-react';
import { motion } from 'motion/react';

interface StatsPanelProps {
  waybills: Waybill[];
  onClose: () => void;
}

export default function StatsPanel({ waybills, onClose }: StatsPanelProps) {
  // Calculations
  const totalCount = waybills.length;
  const inTransitCount = waybills.filter(w => w.status === '运输').length;
  const receivedCount = waybills.filter(w => w.status === '签收').length;
  const cargoWithIssues = waybills.filter(w => w.issueType !== '无');
  const totalValue = waybills.reduce((sum, w) => sum + w.declarationValue, 0);

  // Group status distribution
  const statusCounts = waybills.reduce((acc, w) => {
    acc[w.status] = (acc[w.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group destination distribution
  const destCounts = waybills.reduce((acc, w) => {
    acc[w.destination] = (acc[w.destination] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedDests = Object.entries(destCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Group issue statistics
  const issueCounts = waybills.reduce((acc, w) => {
    acc[w.issueType] = (acc[w.issueType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="bg-[#0f172a] text-slate-100 p-6 rounded-lg shadow-xl mb-6 border border-slate-800"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#5c67f2]" />
          <h3 className="font-bold text-base text-white">安速货运统计中心 (当前筛选结果)</h3>
        </div>
        <button
          onClick={onClose}
          className="text-xs bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-400 px-3 py-1.5 rounded transition-all cursor-pointer"
        >
          关闭统计
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Stat Card 1 */}
        <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-850 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">总运单数量</span>
            <div className="text-2xl font-bold font-mono text-white">{totalCount} <span className="text-xs font-normal text-slate-400">票</span></div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#5c67f2]/10 flex items-center justify-center text-[#5c67f2]">
            <Box className="w-5 h-5" />
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-850 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">在途运输中</span>
            <div className="text-2xl font-bold font-mono text-cyan-400">{inTransitCount} <span className="text-xs font-normal text-slate-400">票</span></div>
          </div>
          <div className="w-10 h-10 rounded-full bg-cyan-950/40 flex items-center justify-center text-cyan-400">
            <Ship className="w-5 h-5" />
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-850 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium font-medium flex items-center gap-1">
              问题运单
              {cargoWithIssues.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>}
            </span>
            <div className={`text-2xl font-bold font-mono ${cargoWithIssues.length > 0 ? 'text-amber-500' : 'text-emerald-400'}`}>
              {cargoWithIssues.length} <span className="text-xs font-normal text-slate-400">票</span>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            cargoWithIssues.length > 0 ? 'bg-amber-950/40 text-amber-500' : 'bg-emerald-950/40 text-emerald-400'
          }`}>
            {cargoWithIssues.length > 0 ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-850 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">申报总货值</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ${totalValue.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-950/40 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            运单状态监控分布
          </h4>
          <div className="space-y-3">
            {['入仓', '出库', '出仓', '运输', '签收', '扣货', '取消'].map((status) => {
              const count = statusCounts[status] || 0;
              const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{status}</span>
                    <span className="text-slate-400 font-mono font-medium">{count} 手 ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === '扣货' ? 'bg-rose-500' :
                        status === '运输' ? 'bg-cyan-500' :
                        status === '签收' ? 'bg-emerald-500' :
                        status === '取消' ? 'bg-slate-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Destination ports */}
        <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            常用 FBA 送达目的地 (排名前四)
          </h4>
          <div className="space-y-4">
            {sortedDests.map(([dest, count], idx) => {
              const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={dest} className="flex items-center justify-between border-b border-slate-800/30 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-slate-800 text-[#5c67f2] font-mono text-xs font-bold flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-white tracking-wide">{dest}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-indigo-400">{count} 票</div>
                    <div className="text-[10px] text-slate-500">{percent}% 占比</div>
                  </div>
                </div>
              );
            })}
            {sortedDests.length === 0 && (
              <div className="text-slate-500 text-xs text-center py-8">无目的港统计数据</div>
            )}
          </div>
        </div>

        {/* Issues breakdown */}
        <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-slate-800 font-sans">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            异常问题件类型稽查
          </h4>
          <div className="space-y-3">
            {Object.entries(issueCounts).map(([issue, count]) => {
              const matchesIssue = issue !== '无';
              return (
                <div 
                  key={issue} 
                  className={`flex items-center justify-between p-2.5 rounded text-xs ${
                    matchesIssue ? 'bg-amber-950/20 text-amber-300 border border-amber-900/30' : 'bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <span className="font-medium">{issue === '无' ? '正常放行与履约' : issue}</span>
                  <span className="font-mono font-bold bg-[#1e293b] px-2 py-0.5 rounded">{count} 票</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
