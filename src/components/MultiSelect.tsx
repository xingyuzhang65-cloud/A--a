import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface MultiSelectProps {
  name: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  allLabel?: string;
}

export default function MultiSelect({
  name,
  options,
  selected,
  onChange,
  placeholder = '全部',
  allLabel = '全部'
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const displayText = selected.length === 0
    ? <span className="text-slate-400">{placeholder}</span>
    : (
      <div className="flex flex-wrap gap-1 items-center overflow-hidden" style={{ maxHeight: '24px' }}>
        {selected.slice(0, 2).map(s => (
          <span key={s} className="inline-flex items-center gap-0.5 px-1.5 py-px rounded bg-[#5c67f2]/10 text-[#5c67f2] text-[10px] font-semibold whitespace-nowrap">
            {s}
          </span>
        ))}
        {selected.length > 2 && (
          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">+{selected.length - 2}</span>
        )}
      </div>
    );

  return (
    <div ref={containerRef} className="relative" data-name={name}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-2.5 py-2 text-xs border rounded flex items-center justify-between gap-1 transition-all focus:outline-none ${
          isOpen
            ? 'border-[#5c67f2] ring-1 ring-[#5c67f2]/20'
            : 'border-slate-200'
        } bg-slate-50 hover:bg-slate-50/50 cursor-pointer min-h-[36px]`}
      >
        <div className="flex-1 text-left overflow-hidden">
          {displayText}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {selected.length > 0 && (
            <span
              onClick={clearAll}
              className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg py-1 max-h-60 overflow-y-auto">
          {/* 全选 / 取消全选 */}
          <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-xs text-[#5c67f2] font-semibold border-b border-slate-100">
            <input
              type="checkbox"
              checked={selected.length === options.length}
              ref={(el) => { if (el) el.indeterminate = selected.length > 0 && selected.length < options.length; }}
              onChange={() => {
                if (selected.length === options.length) {
                  onChange([]);
                } else {
                  onChange([...options]);
                }
              }}
              className="w-3.5 h-3.5 rounded border-slate-300 text-[#5c67f2] focus:ring-[#5c67f2]/30 accent-[#5c67f2] cursor-pointer"
            />
            <span>全选</span>
            {selected.length > 0 && (
              <span className="ml-auto text-[10px] text-slate-400">{selected.length}/{options.length}</span>
            )}
          </label>
          {options.map(opt => (
            <label
              key={opt}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-xs text-slate-700"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggleOption(opt)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#5c67f2] focus:ring-[#5c67f2]/30 accent-[#5c67f2] cursor-pointer"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
