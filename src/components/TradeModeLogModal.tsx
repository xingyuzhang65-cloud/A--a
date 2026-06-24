import React, { useEffect, useState } from 'react';
import { X, Clock, ArrowRight } from 'lucide-react';
import { Waybill } from '../types';

export interface TradeModeLogEntry {
  waybillId: string;
  waybillNo: string;
  from: string;
  to: string;
  timestamp: string;
  operator: string;
}

const STORAGE_KEY = 'ans_trade_mode_logs';
const SEEDED_FLAG = 'ans_trade_mode_logs_seeded';

export function seedTradeModeLogs() {
  if (localStorage.getItem(SEEDED_FLAG)) return;
  localStorage.setItem(SEEDED_FLAG, '1');

  const seedData: TradeModeLogEntry[] = [
    // wb-001: 飞洋电商 LED灯 — 0110 → 9610
    { waybillId: 'wb-001', waybillNo: 'ANSU2026060101', from: '无', to: '0110', timestamp: '2026-06-15 10:22:18', operator: '张华' },
    { waybillId: 'wb-001', waybillNo: 'ANSU2026060101', from: '0110', to: '9610', timestamp: '2026-06-16 14:05:33', operator: '陈静' },

    // wb-002: 智创科技 扫地机器人 — 9810 → 9710
    { waybillId: 'wb-002', waybillNo: 'ANSU2026060102', from: '无', to: '9810', timestamp: '2026-06-16 09:15:44', operator: '李明' },
    { waybillId: 'wb-002', waybillNo: 'ANSU2026060102', from: '9810', to: '9710', timestamp: '2026-06-17 16:30:07', operator: '王涛' },

    // wb-003: 浩宇外贸 床单 — 1039 → 9810
    { waybillId: 'wb-003', waybillNo: 'ANSU2026060103', from: '无', to: '1039', timestamp: '2026-06-14 11:08:52', operator: '王晶' },
    { waybillId: 'wb-003', waybillNo: 'ANSU2026060103', from: '1039', to: '9810', timestamp: '2026-06-18 08:45:21', operator: '赵磊' },

    // wb-004: 云想服饰 连衣裙 — 无 → 0110 (单一变更)
    { waybillId: 'wb-004', waybillNo: 'ANSU2026060104', from: '无', to: '0110', timestamp: '2026-06-12 15:33:10', operator: '张华' },

    // wb-006: 嘉诚数码 蓝牙音箱 — 9710 → 9610
    { waybillId: 'wb-006', waybillNo: 'ANSU2026060106', from: '无', to: '9710', timestamp: '2026-06-08 10:12:05', operator: '张华' },
    { waybillId: 'wb-006', waybillNo: 'ANSU2026060106', from: '9710', to: '9610', timestamp: '2026-06-09 13:47:39', operator: '王涛' },

    // wb-008: 凯旋玩具 磁力片 — 9610 → 9810 (多次反复变更)
    { waybillId: 'wb-008', waybillNo: 'ANSU2026060108', from: '无', to: '9610', timestamp: '2026-06-05 09:30:22', operator: '王晶' },
    { waybillId: 'wb-008', waybillNo: 'ANSU2026060108', from: '9610', to: '9710', timestamp: '2026-06-06 11:15:48', operator: '孙洋' },
    { waybillId: 'wb-008', waybillNo: 'ANSU2026060108', from: '9710', to: '9810', timestamp: '2026-06-07 17:02:33', operator: '陈静' },

    // wb-005: 恒通货运 露营椅 — 9610 → 1039
    { waybillId: 'wb-005', waybillNo: 'ANSU2026060105', from: '无', to: '9610', timestamp: '2026-06-10 08:50:11', operator: '李明' },
    { waybillId: 'wb-005', waybillNo: 'ANSU2026060105', from: '9610', to: '1039', timestamp: '2026-06-12 10:28:56', operator: '孙洋' },

    // wb-009: 飞洋电商 自行车模型 — 1039 → 0110
    { waybillId: 'wb-009', waybillNo: 'ANSU2026060109', from: '无', to: '1039', timestamp: '2026-06-15 13:18:40', operator: '张华' },
    { waybillId: 'wb-009', waybillNo: 'ANSU2026060109', from: '1039', to: '0110', timestamp: '2026-06-17 09:55:27', operator: '陈静' },

    // wb-011: 智创科技 额温枪 — 0110 → 9610
    { waybillId: 'wb-011', waybillNo: 'ANSU2026060111', from: '无', to: '0110', timestamp: '2026-06-13 14:22:08', operator: '李明' },
    { waybillId: 'wb-011', waybillNo: 'ANSU2026060111', from: '0110', to: '9610', timestamp: '2026-06-15 11:36:19', operator: '王涛' },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
}

export function getTradeModeLogs(): TradeModeLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendTradeModeLog(entry: TradeModeLogEntry) {
  const logs = getTradeModeLogs();
  logs.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

interface TradeModeLogModalProps {
  isOpen: boolean;
  waybill: Waybill;
  onClose: () => void;
}

export default function TradeModeLogModal({ isOpen, waybill, onClose }: TradeModeLogModalProps) {
  const [logs, setLogs] = useState<TradeModeLogEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      const allLogs = getTradeModeLogs();
      setLogs(allLogs.filter(l => l.waybillId === waybill.id));
    }
  }, [isOpen, waybill.id]);

  if (!isOpen) return null;

  const filteredLogs = logs;

  return (
    <div className="fixed inset-0 z-[75] flex items-start justify-center bg-slate-950/50 pt-16">
      <div className="w-[680px] max-h-[80vh] rounded-sm bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              贸易方式变更日志
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              运单号：<span className="font-mono font-semibold text-indigo-600">{waybill.waybillNo}</span>
              <span className="mx-2">|</span>
              当前贸易方式：<span className="font-mono font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{waybill.tradeMode || '-'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium">暂无贸易方式变更记录</p>
              <p className="text-xs mt-1 text-slate-400">该运单尚未发生过贸易方式变更</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="px-3 py-2.5 w-12 text-center">#</th>
                  <th className="px-3 py-2.5">变更时间</th>
                  <th className="px-3 py-2.5">原贸易方式</th>
                  <th className="px-3 py-2.5 w-8"></th>
                  <th className="px-3 py-2.5">新贸易方式</th>
                  <th className="px-3 py-2.5">操作人</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 text-slate-700">
                    <td className="px-3 py-2.5 text-center text-slate-400 font-mono">{filteredLogs.length - idx}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-500">{log.timestamp}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                        {log.from || '无'}
                      </span>
                    </td>
                    <td className="px-0 py-2.5 text-center">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 inline" />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 font-mono font-semibold">
                        {log.to}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{log.operator || '系统'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t border-slate-100 px-5 py-3 bg-slate-50 shrink-0">
          <span className="text-xs text-slate-400">
            共 <strong className="text-slate-600">{filteredLogs.length}</strong> 条变更记录
          </span>
          <button
            onClick={onClose}
            className="rounded border border-slate-300 bg-white px-5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
