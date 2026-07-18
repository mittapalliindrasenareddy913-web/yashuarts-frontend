import React, { useState, useEffect } from 'react';
import { Terminal, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

let logHistory = [];
const listeners = new Set();

const addLog = (type, args) => {
  const text = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');

  const newLog = {
    id: Math.random().toString(),
    time: new Date().toLocaleTimeString(),
    type,
    text
  };

  logHistory.push(newLog);
  if (logHistory.length > 200) {
    logHistory.shift();
  }
  listeners.forEach(listener => listener([...logHistory]));
};

// Monkey-patch console methods
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
  originalLog.apply(console, args);
  addLog('log', args);
};
console.warn = (...args) => {
  originalWarn.apply(console, args);
  addLog('warn', args);
};
console.error = (...args) => {
  originalError.apply(console, args);
  addLog('error', args);
};

window.addEventListener('error', (event) => {
  addLog('uncaught-error', [event.message, event.filename, event.lineno]);
});

export const DebugConsole = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    setLogs([...logHistory]);
    const listener = (newLogs) => setLogs(newLogs);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const handleClear = () => {
    logHistory = [];
    setLogs([]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-[9999] bg-yellow-500 hover:bg-yellow-600 text-slate-950 p-3.5 rounded-full shadow-2xl flex items-center justify-center border border-yellow-400 active:scale-95 transition-transform"
        title="Open Debug Console"
      >
        <Terminal className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#0A0A0A] border-t border-yellow-500/30 font-mono text-xs text-slate-300 flex flex-col transition-all duration-300" style={{ height: isMinimized ? '40px' : '300px' }}>
      <div className="bg-[#121212] border-b border-yellow-500/20 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-500 font-bold">
          <Terminal className="w-4 h-4" />
          <span>Debug Console ({logs.length})</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:text-white">
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={handleClear} className="p-1 text-slate-400 hover:text-red-500" title="Clear Logs">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-white" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2 select-text">
          {logs.map((log) => (
            <div key={log.id} className="border-b border-white/5 pb-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] text-slate-500">{log.time}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                  log.type === 'error' || log.type === 'uncaught-error' ? 'bg-red-500/20 text-red-400' :
                  log.type === 'warn' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {log.type}
                </span>
              </div>
              <pre className="whitespace-pre-wrap break-all text-[11px] leading-relaxed text-slate-200">
                {log.text}
              </pre>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-600">
              No console logs generated yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebugConsole;
