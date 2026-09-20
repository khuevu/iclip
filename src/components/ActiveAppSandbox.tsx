import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Code2,
  MessageSquare,
  Terminal,
  Copy,
  Download,
  Sparkles,
  Send,
  Plus,
  ArrowRight,
  Maximize2,
  Minus,
  X,
  Keyboard
} from 'lucide-react';
import { ActiveApp, ActiveAppId, ClipboardItem } from '../types';
import { playMacSound } from '../utils/audio';

interface ActiveAppSandboxProps {
  activeApp: ActiveApp;
  onSelectApp: (appId: ActiveAppId) => void;
  onAddNewClip: (text: string, sourceApp?: string) => void;
  onOpenHUD: () => void;
  lastPastedItem: ClipboardItem | null;
  lastPasteTimestamp: number;
}

export const ActiveAppSandbox: React.FC<ActiveAppSandboxProps> = ({
  activeApp,
  onSelectApp,
  onAddNewClip,
  onOpenHUD,
  lastPastedItem,
  lastPasteTimestamp,
}) => {
  // Per-application editable content states
  const [notesContent, setNotesContent] = useState(
    `# Engineering Sprint & Daily Notes\n\n- Active clipboard monitor initialized.\n- Shortcuts: ⌘ + Shift + V to trigger clipboard popover.\n- Test cursor position below:\n> Ready to paste here: `
  );

  const [codeContent, setCodeContent] = useState(
    `import Foundation\nimport AppKit\n\n// Paste copied snippet into this function:\nfunc handleUserSelection() {\n    print("Processing active paste event...")\n    // paste here\n}`
  );

  const [slackMessages, setSlackMessages] = useState<Array<{ sender: string; time: string; text: string }>>([
    {
      sender: 'Alex (Product)',
      time: '10:14 AM',
      text: 'Could you share the latest clipboard shortcut specs for the macOS release?',
    },
    {
      sender: 'Taylor (Design)',
      time: '10:18 AM',
      text: 'Defaulting to ⌘+Shift+V looks fantastic! Users can hit 1..9 to paste instantly.',
    },
  ]);
  const [slackInput, setSlackInput] = useState('');

  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'Last login: Sun Sep 20 06:30:12 on ttys001',
    'khue@macbook-pro ~ % sw_vers',
    'ProductName:\t\tmacOS',
    'ProductVersion:\t\t15.0 (Sequoia)',
    'khue@macbook-pro ~ % # Paste terminal command below:',
  ]);
  const [terminalInput, setTerminalInput] = useState('git status');

  // Input for adding custom new clips to test N history
  const [customClipInput, setCustomClipInput] = useState('');
  const [showPasteGlow, setShowPasteGlow] = useState(false);

  // References to active text areas for cursor insertion
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const slackInputRef = useRef<HTMLInputElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  // Trigger visual paste highlight whenever lastPasteTimestamp updates
  useEffect(() => {
    if (lastPasteTimestamp > 0) {
      setShowPasteGlow(true);
      const timer = setTimeout(() => setShowPasteGlow(false), 900);
      return () => clearTimeout(timer);
    }
  }, [lastPasteTimestamp]);

  // Insert text into active application
  const insertPastedText = (text: string) => {
    if (activeApp.id === 'notes') {
      const textarea = notesTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const current = textarea.value;
        const updated = current.substring(0, start) + text + current.substring(end);
        setNotesContent(updated);
        // restore cursor
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + text.length, start + text.length);
        }, 10);
      } else {
        setNotesContent((prev) => prev + '\n' + text);
      }
    } else if (activeApp.id === 'vscode') {
      const textarea = codeTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const current = textarea.value;
        const updated = current.substring(0, start) + text + current.substring(end);
        setCodeContent(updated);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + text.length, start + text.length);
        }, 10);
      } else {
        setCodeContent((prev) => prev + '\n' + text);
      }
    } else if (activeApp.id === 'slack') {
      setSlackInput((prev) => (prev ? prev + ' ' + text : text));
      slackInputRef.current?.focus();
    } else if (activeApp.id === 'terminal') {
      setTerminalInput((prev) => (prev ? prev + ' ' + text : text));
      terminalInputRef.current?.focus();
    }
  };

  // Expose insertion via external window event or prop effect
  useEffect(() => {
    if (lastPastedItem && lastPasteTimestamp > 0) {
      insertPastedText(lastPastedItem.text);
    }
  }, [lastPasteTimestamp]);

  // Handle Slack submit
  const handleSlackSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slackInput.trim()) return;
    setSlackMessages((prev) => [
      ...prev,
      {
        sender: 'You (Khue)',
        time: 'Just now',
        text: slackInput,
      },
    ]);
    setSlackInput('');
    playMacSound('paste');
  };

  // Handle Terminal submit
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput;
    setTerminalHistory((prev) => [
      ...prev,
      `khue@macbook-pro ~ % ${cmd}`,
      cmd.startsWith('git')
        ? 'On branch main. Your branch is up to date with origin/main.'
        : `Executed command: ${cmd}`,
    ]);
    setTerminalInput('');
    playMacSound('pop');
  };

  // Read from real OS clipboard
  const handleReadOSClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          onAddNewClip(text, 'OS Clipboard');
          playMacSound('copy');
        }
      }
    } catch {
      // Browser permission prompt or denied
    }
  };

  const appsList: Array<{ id: ActiveAppId; name: string; icon: React.ReactNode }> = [
    { id: 'notes', name: 'Notes', icon: <FileText className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'vscode', name: 'VS Code', icon: <Code2 className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'slack', name: 'Slack', icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'terminal', name: 'Terminal', icon: <Terminal className="w-3.5 h-3.5 text-neutral-300" /> },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden max-w-6xl mx-auto w-full">
      {/* Top Banner: Explaining active paste flow & shortcut */}
      <div className="mb-4 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">Active Destination Application:</span>
              <span className="bg-blue-600/30 text-blue-300 text-xs px-2 py-0.5 rounded-full border border-blue-500/30 font-medium">
                {activeApp.name} (Focused)
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Press <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-mono text-white text-[11px] border border-white/10">⌘⇧V</kbd> to open clipboard HUD, then choose any item to paste here directly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="active-app-open-hud-btn"
            onClick={onOpenHUD}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium text-xs shadow-md transition-all"
          >
            <span>Show Last Copied</span>
            <kbd className="px-1.5 py-0.2 bg-blue-700/80 rounded font-mono text-[10px]">⌘⇧V</kbd>
          </button>
        </div>
      </div>

      {/* Main Sandbox Window */}
      <div className="flex-1 flex flex-col min-h-0 bg-neutral-900/90 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
        {/* macOS Window Titlebar with Traffic Lights */}
        <div className="h-10 bg-neutral-950/80 border-b border-white/10 px-4 flex items-center justify-between shrink-0 select-none">
          {/* Traffic Lights */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center group cursor-pointer border border-red-600/50">
              <X className="w-2 h-2 text-red-950 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 flex items-center justify-center group cursor-pointer border border-amber-600/50">
              <Minus className="w-2 h-2 text-amber-950 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 flex items-center justify-center group cursor-pointer border border-emerald-600/50">
              <Maximize2 className="w-2 h-2 text-emerald-950 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* App Switcher Tabs */}
          <div className="flex items-center gap-1 bg-neutral-800/80 p-0.5 rounded-lg border border-white/5">
            {appsList.map((app) => {
              const isSelected = activeApp.id === app.id;
              return (
                <button
                  key={app.id}
                  id={`switch-app-${app.id}`}
                  onClick={() => {
                    onSelectApp(app.id);
                    playMacSound('switch');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-neutral-700/90 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  {app.icon}
                  <span>{app.name}</span>
                </button>
              );
            })}
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Cursor Active</span>
          </div>
        </div>

        {/* Application Content View */}
        <div
          className={`flex-1 flex flex-col p-4 overflow-y-auto relative transition-all duration-300 ${
            showPasteGlow ? 'ring-2 ring-blue-500/60 bg-blue-950/10' : ''
          }`}
        >
          {/* Notes Application */}
          {activeApp.id === 'notes' && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2 text-xs text-neutral-400">
                <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Notes — Daily Scratchpad
                </span>
                <span>Plain text / Markdown</span>
              </div>
              <textarea
                ref={notesTextareaRef}
                id="notes-active-textarea"
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                placeholder="Click here to position cursor. When you select an item from the clipboard HUD, it will paste right here!"
                className="flex-1 w-full bg-neutral-950/60 border border-white/10 rounded-xl p-4 text-sm text-neutral-100 font-mono resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 leading-relaxed shadow-inner"
              />
            </div>
          )}

          {/* VS Code Application */}
          {activeApp.id === 'vscode' && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2 text-xs text-neutral-400">
                <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-blue-400" />
                  AppDelegate.swift — Visual Studio Code
                </span>
                <span className="font-mono text-[11px]">UTF-8 • Swift</span>
              </div>
              <div className="flex-1 flex rounded-xl overflow-hidden border border-white/10 bg-neutral-950">
                {/* Line numbers column */}
                <div className="w-10 bg-neutral-900/80 border-r border-white/5 py-4 text-right pr-2 text-neutral-600 font-mono text-xs select-none">
                  {codeContent.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <textarea
                  ref={codeTextareaRef}
                  id="vscode-active-textarea"
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder="// Paste swift or code snippet here..."
                  className="flex-1 p-4 bg-transparent text-sm text-blue-200 font-mono resize-none focus:outline-none focus:ring-0 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Slack Application */}
          {activeApp.id === 'slack' && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="text-xs text-neutral-400 mb-2 flex items-center gap-1.5 border-b border-white/10 pb-2">
                <span className="font-bold text-white">#engineering-general</span>
                <span className="text-neutral-500">• 18 members</span>
              </div>

              {/* Chat history */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
                {slackMessages.map((msg, idx) => (
                  <div key={idx} className="flex flex-col gap-0.5 text-xs bg-neutral-950/40 p-2.5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-400">{msg.sender}</span>
                      <span className="text-[10px] text-neutral-500">{msg.time}</span>
                    </div>
                    <p className="text-neutral-200 mt-1 whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Composer */}
              <form onSubmit={handleSlackSend} className="flex gap-2 items-center">
                <input
                  ref={slackInputRef}
                  id="slack-active-input"
                  type="text"
                  value={slackInput}
                  onChange={(e) => setSlackInput(e.target.value)}
                  placeholder="Message #engineering-general (paste clipboard snippet here)..."
                  className="flex-1 bg-neutral-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* Terminal Application */}
          {activeApp.id === 'terminal' && (
            <div className="flex-1 flex flex-col font-mono text-xs bg-black/90 p-4 rounded-xl border border-white/10 text-emerald-400">
              <div className="flex-1 overflow-y-auto space-y-1 mb-2">
                {terminalHistory.map((line, idx) => (
                  <div key={idx} className={line.startsWith('khue@') ? 'text-neutral-300 font-semibold' : 'text-neutral-400'}>
                    {line}
                  </div>
                ))}
              </div>

              <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 pt-2 border-t border-white/10">
                <span className="text-blue-400 font-bold">khue@macbook-pro ~ %</span>
                <input
                  ref={terminalInputRef}
                  id="terminal-active-input"
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  className="flex-1 bg-transparent border-none text-emerald-300 focus:outline-none font-mono text-xs"
                  placeholder="paste command here and press Enter..."
                />
              </form>
            </div>
          )}
        </div>

        {/* Bottom Quick Test Strip: Copy tools to populate last N copied items */}
        <div className="bg-neutral-950/90 border-t border-white/10 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <input
              id="custom-clip-input"
              type="text"
              value={customClipInput}
              onChange={(e) => setCustomClipInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customClipInput.trim()) {
                  onAddNewClip(customClipInput.trim(), activeApp.name);
                  setCustomClipInput('');
                  playMacSound('copy');
                }
              }}
              placeholder="Type anything to test copying into history (press Enter)..."
              className="flex-1 bg-neutral-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
            />
            <button
              id="copy-custom-clip-btn"
              onClick={() => {
                if (customClipInput.trim()) {
                  onAddNewClip(customClipInput.trim(), activeApp.name);
                  setCustomClipInput('');
                  playMacSound('copy');
                }
              }}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg flex items-center gap-1 font-medium border border-white/10 transition-colors"
            >
              <Copy className="w-3 h-3 text-blue-400" />
              <span>Copy</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 text-[11px] hidden md:inline">Quick Samples:</span>
            <button
              onClick={() => {
                onAddNewClip('https://developer.apple.com/macos/', 'Safari');
                playMacSound('copy');
              }}
              className="px-2 py-1 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] border border-white/5"
            >
              + Apple URL
            </button>
            <button
              onClick={() => {
                onAddNewClip('brew install maccy raycast', 'Terminal');
                playMacSound('copy');
              }}
              className="px-2 py-1 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] border border-white/5"
            >
              + Brew Command
            </button>
            <button
              onClick={handleReadOSClipboard}
              className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded text-[11px] font-medium border border-blue-500/30 flex items-center gap-1"
              title="Reads whatever you currently have copied in your real operating system clipboard"
            >
              <Download className="w-3 h-3" />
              <span>Sync Real OS Clip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
