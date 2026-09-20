import React, { useState } from 'react';
import {
  X,
  Sliders,
  Keyboard,
  Shield,
  Code,
  Volume2,
  VolumeX,
  Check,
  Copy,
  Terminal,
  Trash2,
  CornerDownLeft
} from 'lucide-react';
import { AppSettings, ShortcutConfig } from '../types';
import { NATIVE_SWIFT_CODE } from '../data/initialData';
import { playMacSound } from '../utils/audio';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClearHistory: () => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'shortcuts' | 'privacy' | 'swift'>('general');
  const [copiedSwift, setCopiedSwift] = useState(false);
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false);

  if (!isOpen) return null;

  const handleCopySwift = async () => {
    try {
      await navigator.clipboard.writeText(NATIVE_SWIFT_CODE);
      setCopiedSwift(true);
      playMacSound('copy');
      setTimeout(() => setCopiedSwift(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleKeyDownRecord = (e: React.KeyboardEvent) => {
    if (!isRecordingShortcut) return;
    e.preventDefault();

    if (e.key === 'Escape') {
      setIsRecordingShortcut(false);
      return;
    }

    if (e.key === 'Meta' || e.key === 'Shift' || e.key === 'Alt' || e.key === 'Control') {
      return; // wait for letter/symbol
    }

    const newShortcut: ShortcutConfig = {
      metaKey: e.metaKey || true,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      ctrlKey: e.ctrlKey,
      key: e.key.toLowerCase(),
    };

    onUpdateSettings({ shortcut: newShortcut });
    setIsRecordingShortcut(false);
    playMacSound('pop');
  };

  return (
    <div
      id="macos-preferences-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="macos-preferences-window"
        className="w-full max-w-2xl bg-neutral-900/95 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
      >
        {/* Titlebar */}
        <div className="h-12 bg-neutral-950/80 border-b border-white/10 px-4 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center group border border-red-600/50"
            >
              <X className="w-2 h-2 text-red-950 opacity-0 group-hover:opacity-100" />
            </button>
            <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/50" />
            <span className="ml-3 font-semibold text-white text-xs">Settings & Preferences</span>
          </div>

          {/* Tab selector */}
          <div className="flex items-center gap-1 bg-neutral-800/80 p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'general' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>General</span>
            </button>
            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'shortcuts' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'privacy' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Privacy</span>
            </button>
            <button
              onClick={() => setActiveTab('swift')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'swift' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Native Swift</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto text-xs text-neutral-300 space-y-6">
          {/* TAB 1: General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Max History Items N */}
              <div className="bg-neutral-950/60 p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-sm">Number of Copied Texts to Show (N)</div>
                    <p className="text-neutral-400 text-xs mt-0.5">
                      The clipboard HUD will display the last N copied items in your history.
                    </p>
                  </div>
                  <span className="text-lg font-mono font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                    {settings.maxHistoryItems} items
                  </span>
                </div>

                {/* Quick preset buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {[5, 10, 15, 20, 25, 50, 100].map((count) => (
                    <button
                      key={count}
                      onClick={() => {
                        onUpdateSettings({ maxHistoryItems: count });
                        playMacSound('pop');
                      }}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-medium transition-all ${
                        settings.maxHistoryItems === count
                          ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={settings.maxHistoryItems}
                  onChange={(e) => onUpdateSettings({ maxHistoryItems: parseInt(e.target.value, 10) })}
                  className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Toggles */}
              <div className="bg-neutral-950/60 rounded-xl border border-white/10 divide-y divide-white/5">
                {/* Audio Sounds */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
                      {settings.soundEffects ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-white">Audio Feedback</div>
                      <p className="text-neutral-400 text-xs">Play subtle macOS pop and paste sound effects</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEffects}
                    onChange={(e) => onUpdateSettings({ soundEffects: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                {/* Paste directly into active application */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-blue-400">
                      <CornerDownLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Direct Paste into Active App</div>
                      <p className="text-neutral-400 text-xs">
                        When selecting a clip, immediately paste it into the active target app cursor
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.pasteDirectly}
                    onChange={(e) => onUpdateSettings({ pasteDirectly: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                {/* Close on paste */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
                      <Check className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Dismiss HUD Upon Paste</div>
                      <p className="text-neutral-400 text-xs">Automatically close the floating HUD after choosing a text</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.closeOnPaste}
                    onChange={(e) => onUpdateSettings({ closeOnPaste: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Shortcuts */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="bg-neutral-950/60 p-4 rounded-xl border border-white/10 space-y-4">
                <div className="font-semibold text-white text-sm">Global Shortcut Configuration</div>
                <p className="text-neutral-400 text-xs">
                  This shortcut opens the last N clipboard items from anywhere inside the operating system.
                </p>

                <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">Show Clipboard HUD:</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      onKeyDown={handleKeyDownRecord}
                      tabIndex={0}
                      onClick={() => setIsRecordingShortcut(true)}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-semibold cursor-pointer transition-all ${
                        isRecordingShortcut
                          ? 'bg-blue-600/30 border-blue-400 text-blue-300 animate-pulse ring-2 ring-blue-500'
                          : 'bg-neutral-800 border-white/10 text-white hover:border-white/30'
                      }`}
                    >
                      {isRecordingShortcut ? (
                        'Press keys on keyboard...'
                      ) : (
                        <>
                          {settings.shortcut.metaKey && '⌘ '}
                          {settings.shortcut.shiftKey && '⇧ '}
                          {settings.shortcut.altKey && '⌥ '}
                          {settings.shortcut.ctrlKey && '⌃ '}
                          {settings.shortcut.key.toUpperCase()}
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        onUpdateSettings({
                          shortcut: { metaKey: true, shiftKey: true, altKey: false, ctrlKey: false, key: 'v' },
                        });
                        playMacSound('pop');
                      }}
                      className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px]"
                    >
                      Reset Default (⌘⇧V)
                    </button>
                  </div>
                </div>

                {/* Built-in quick navigation keys guide */}
                <div className="pt-2 border-t border-white/10">
                  <div className="font-semibold text-white text-xs mb-2">Built-in Quick Keys:</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center justify-between p-2 bg-neutral-900 rounded-lg">
                      <span className="text-neutral-300">Quick Paste Item 1-9:</span>
                      <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono">1 ... 9</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-neutral-900 rounded-lg">
                      <span className="text-neutral-300">Navigate List:</span>
                      <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono">↑ / ↓</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-neutral-900 rounded-lg">
                      <span className="text-neutral-300">Paste Highlighted:</span>
                      <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono">⏎ Enter</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-neutral-900 rounded-lg">
                      <span className="text-neutral-300">Pin / Unpin Clip:</span>
                      <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-200 font-mono">⌥ + P</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Privacy */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="bg-neutral-950/60 p-4 rounded-xl border border-white/10 space-y-4">
                <div className="font-semibold text-white text-sm">Security & Password Shield</div>
                <p className="text-neutral-400 text-xs">
                  Safeguard sensitive strings and manage clipboard retention.
                </p>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-neutral-900 rounded-xl border border-white/5 cursor-pointer">
                    <div>
                      <div className="font-medium text-white">Ignore Password Managers</div>
                      <p className="text-neutral-400 text-[11px]">
                        Do not record clips copied from 1Password, Bitwarden, Apple Passwords, or Keychain
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.ignorePasswordManagers}
                      onChange={(e) => onUpdateSettings({ ignorePasswordManagers: e.target.checked })}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </label>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-red-400">Clear Clipboard History</div>
                    <p className="text-neutral-500 text-[11px]">Permanently erase all stored clipboard history.</p>
                  </div>
                  <button
                    onClick={() => {
                      onClearHistory();
                      playMacSound('trash');
                    }}
                    className="px-3.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All History</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Native Swift Code */}
          {activeTab === 'swift' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white text-sm">Native macOS Swift Implementation</div>
                  <p className="text-neutral-400 text-xs">
                    Ready to build in Xcode using SwiftUI and <code className="text-blue-300">NSPasteboard</code>.
                  </p>
                </div>
                <button
                  onClick={handleCopySwift}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
                >
                  {copiedSwift ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSwift ? 'Copied to Clipboard' : 'Copy Swift Code'}</span>
                </button>
              </div>

              <div className="bg-black/90 p-3 rounded-xl border border-white/10 font-mono text-[11px] text-blue-200 overflow-x-auto max-h-72 leading-relaxed">
                <pre>{NATIVE_SWIFT_CODE}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 bg-neutral-950 border-t border-white/10 px-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-medium border border-white/10 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
