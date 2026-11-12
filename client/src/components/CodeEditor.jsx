import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, CheckCircle2, XCircle, Terminal, Copy } from 'lucide-react';

export const CodeEditor = ({
  starterCode = '',
  value = '',
  onChange,
  sampleInput = '',
  sampleOutput = '',
  marks = 5,
  readOnly = false,
}) => {
  const [code, setCode] = useState(value || starterCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (value !== undefined && value !== code) {
      setCode(value);
    }
  }, [value]);

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (onChange) {
      onChange(newCode);
    }
  };

  // Support Tab key indentation inside textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const updated = code.substring(0, start) + '  ' + code.substring(end);
      setCode(updated);
      if (onChange) onChange(updated);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleReset = () => {
    setCode(starterCode);
    if (onChange) onChange(starterCode);
    setOutput('');
    setTestResult(null);
  };

  // Safe client-side JS evaluation sandbox for live student code testing
  const handleRunCode = () => {
    setIsRunning(true);
    setOutput('');
    setTestResult(null);

    const logs = [];
    const customConsole = {
      log: (...args) => logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      error: (...args) => logs.push('[ERROR] ' + args.join(' ')),
      warn: (...args) => logs.push('[WARN] ' + args.join(' ')),
    };

    try {
      // Create isolated runner function
      const runFn = new Function('console', `
        try {
          ${code}
        } catch (err) {
          console.error(err.message);
        }
      `);

      const startTime = performance.now();
      runFn(customConsole);
      const executionTime = Math.round(performance.now() - startTime);

      const capturedOutput = logs.join('\n') || '(Code executed successfully with no output)';
      setOutput(capturedOutput);

      // Check if output matches sample output
      if (sampleOutput && sampleOutput.trim()) {
        const isMatch = capturedOutput.includes(sampleOutput.trim());
        setTestResult({
          passed: isMatch,
          executionTime,
        });
      } else {
        setTestResult({
          passed: true,
          executionTime,
        });
      }
    } catch (err) {
      setOutput(`Syntax / Execution Error: ${err.message}`);
      setTestResult({
        passed: false,
        error: err.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Calculate line numbers
  const lines = code.split('\n');
  const lineCount = Math.max(1, lines.length);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono font-semibold text-slate-400">solution.js</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            JavaScript (Node.js)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={handleReset}
                title="Reset to starter code"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm shadow-emerald-600/30 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'Running...' : 'Run / Test Code'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="relative flex-1 flex min-h-[280px] max-h-[420px] bg-slate-950/90 font-mono text-sm overflow-hidden">
        {/* Line numbers gutter */}
        <div className="select-none py-3 px-3 text-right bg-slate-900/60 border-r border-slate-800/80 text-slate-500 font-mono text-xs leading-6">
          {Array.from({ length: lineCount }).map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
        </div>

        {/* Textarea code input */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck="false"
          placeholder="// Type your code here..."
          className="flex-1 w-full p-3 bg-transparent text-indigo-100 placeholder-slate-600 resize-none outline-none font-mono text-sm leading-6 selection:bg-indigo-600/50"
        />
      </div>

      {/* Sample Input/Output & Console Output Drawer */}
      <div className="bg-slate-950 border-t border-slate-800 p-4 space-y-3">
        {(sampleInput || sampleOutput) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {sampleInput && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Sample Input</span>
                <code className="text-emerald-300 font-mono">{sampleInput}</code>
              </div>
            )}
            {sampleOutput && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Expected Output</span>
                <code className="text-emerald-300 font-mono">{sampleOutput}</code>
              </div>
            )}
          </div>
        )}

        {/* Console Output Result */}
        {output && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-slate-800/60">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Execution Output:</span>
              </div>
              {testResult && (
                <div className="flex items-center space-x-1.5 text-xs font-bold">
                  {testResult.passed ? (
                    <span className="flex items-center space-x-1 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Test Passed ({testResult.executionTime}ms)</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-rose-400">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Output Mismatch</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            <pre className="text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-24">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
