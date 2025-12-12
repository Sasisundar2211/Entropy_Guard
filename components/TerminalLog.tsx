
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal, AlertCircle, CheckCircle2, Info, Cpu, AlertTriangle, ShieldAlert } from 'lucide-react';

interface Props {
  logs: LogEntry[];
}

export const TerminalLog: React.FC<Props> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getStyle = (type: string) => {
    switch (type) {
        case 'ERROR': 
            return { 
                icon: <ShieldAlert size={14} />, 
                color: 'text-[#FF897D]', 
                bg: 'bg-[#3b0d0d]/50',
                border: 'border-l-2 border-[#FF897D]'
            };
        case 'WARNING': 
            return { 
                icon: <AlertTriangle size={14} />, 
                color: 'text-[#FDD835]', 
                bg: 'bg-[#2a2208]/50',
                border: 'border-l-2 border-[#FDD835]'
            };
        case 'SUCCESS': 
            return { 
                icon: <CheckCircle2 size={14} />, 
                color: 'text-[#6DD58C]', 
                bg: 'bg-[#0d2b15]/50',
                border: 'border-l-2 border-[#6DD58C]'
            };
        case 'AI': 
            return { 
                icon: <Cpu size={14} />, 
                color: 'text-[#A8C7FA]', 
                bg: 'bg-[#0e1b33]/50',
                border: 'border-l-2 border-[#A8C7FA]'
            };
        default: 
            return { 
                icon: <Info size={14} />, 
                color: 'text-[#C4C7C5]', 
                bg: 'hover:bg-[#1E2229]',
                border: 'border-l-2 border-transparent'
            };
    }
  };

  return (
    <div className="h-48 bg-[#0B0D10] border-t border-[#2B2F36] flex flex-col font-mono text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
      <div className="px-4 py-2 bg-[#1E2229] border-b border-[#2B2F36] flex items-center gap-2 text-[#8E918F] text-xs uppercase tracking-widest font-semibold select-none">
        <Terminal size={14} className="text-[#A8C7FA]" /> Session Telemetry
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {logs.map((log) => {
            const style = getStyle(log.type);
            return (
                <div key={log.id} className={`flex items-start gap-3 p-1.5 rounded ${style.bg} ${style.border} transition-colors animate-in fade-in slide-in-from-left-2 duration-300`}>
                    <span className="text-[#555] text-[11px] min-w-[55px] pt-0.5 font-medium">{log.timestamp}</span>
                    <div className={`${style.color} shrink-0 pt-0.5`}>{style.icon}</div>
                    <span className={`${style.color} break-all leading-tight font-medium tracking-tight`}>{log.message}</span>
                </div>
            );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
