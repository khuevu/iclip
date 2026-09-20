import React, { useState, useEffect, useRef } from 'react';
import { Clipboard, Wifi, Battery, Search, Settings, Trash2, ExternalLink, Command, ShieldCheck, Check } from 'lucide-react';
import { ClipboardItem, AppSettings, ActiveApp } from '../types';
import { playMacSound } from '../utils/audio';

interface MenuBarProps {
  items: ClipboardItem[];
  settings: AppSettings;
  activeApp: ActiveApp;
  onOpenHUD: () => void;
  onOpenSettings: () => void;
  onClearUnpinned: () => void;
  onPasteItem: (item: ClipboardItem) => void;
  copiedCount: number;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  items,
  settings,
  activeApp,
  onOpenHUD,
  onOpenSettings,
  onClearUnpinned,
  onPasteItem,
  copiedCount,
}) => {
  const [timeString, setTimeString] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [appleMenuOpen, setAppleMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const appleRef = useRef<HTMLDivElement>(null);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      };
      setTimeString(now.toLocaleDateString('en-US', options).replace(/,/g, ''));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (appleRef.current && !appleRef.current.contains(e.target as Node)) {
        setAppleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleItems = items.slice(0, 5);

  return (
    <header className="relative z-50 select-none bg-neutral-900/80 backdrop-blur-xl text-neutral-200 text-xs font-medium border-b border-white/10 px-3 h-8 flex items-center justify-between shadow-sm">
      {/* Left side: Apple icon & Menus */}
      <div className="flex items-center gap-1">
        {/* Apple Menu */}
        <div className="relative" ref={appleRef}>
          <button
            id="macos-apple-menu-btn"
            onClick={() => {
              setAppleMenuOpen(!appleMenuOpen);
              setMenuOpen(false);
              playMacSound('pop');
            }}
            className="px-2 py-0.5 rounded hover:bg-white/10 active:bg-white/20 transition-colors flex items-center cursor-default"
            aria-label="Apple menu"
          >
            {/* Apple vector logo */}
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.07-7.65-7.79-11.87-14.15-5.87-8.87-10.4-19.14-13.6-30.82-3.19-11.68-4.79-22.75-4.79-33.2 0-14.36 3.65-26.39 10.96-36.1 7.31-9.7 16.59-14.65 27.84-14.85 4.8.12 10.04 1.34 15.74 3.66 5.7 2.33 9.49 3.55 11.37 3.66 1.49-.11 5.37-1.38 11.64-3.8 6.28-2.42 11.67-3.52 16.18-3.3 12.27.91 22.08 5.65 29.41 14.22-10.74 6.53-15.99 15.44-15.75 26.74.24 9.17 3.86 16.89 10.85 23.16 7 6.27 15.19 9.87 24.58 10.8-2.12 6.54-4.82 13.57-8.11 21.09zM119.22 33.56c0-6.97 2.5-13.5 7.5-19.58 5-6.08 11.19-10.02 18.57-11.83.64 6.86-1.57 13.37-6.62 19.53-5.06 6.16-11.53 9.94-19.45 11.88z" />
            </svg>
          </button>

          {appleMenuOpen && (
            <div className="absolute left-0 mt-1 w-56 bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-lg shadow-2xl py-1 text-[13px] z-50 text-neutral-200 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 font-semibold text-white">About Clipboard Manager</div>
              <div className="h-px bg-white/10 my-1" />
              <button
                onClick={() => {
                  setAppleMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white flex items-center justify-between"
              >
                <span>System Settings...</span>
                <span className="text-neutral-400 text-xs">⌘,</span>
              </button>
              <div className="h-px bg-white/10 my-1" />
              <div className="px-3 py-1 text-neutral-400 text-xs">Active: {activeApp.name}</div>
            </div>
          )}
        </div>

        {/* App Name */}
        <span className="font-semibold text-white px-2 cursor-default">Clipboard</span>

        <button
          onClick={onOpenHUD}
          className="hidden sm:inline-block px-2 py-0.5 rounded hover:bg-white/10 text-neutral-300 transition-colors cursor-default"
        >
          History
        </button>

        <button
          onClick={onOpenSettings}
          className="hidden sm:inline-block px-2 py-0.5 rounded hover:bg-white/10 text-neutral-300 transition-colors cursor-default"
        >
          Preferences
        </button>

        <button
          onClick={onClearUnpinned}
          className="hidden md:inline-block px-2 py-0.5 rounded hover:bg-white/10 text-neutral-300 transition-colors cursor-default"
        >
          Clear History
        </button>
      </div>

      {/* Center: Global HUD Trigger badge */}
      <div className="flex items-center gap-2">
        <button
          id="macos-global-shortcut-pill"
          onClick={() => {
            playMacSound('pop');
            onOpenHUD();
          }}
          className="group flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 hover:border-blue-400/50 shadow-inner transition-all duration-150"
          title="Click or press shortcut anywhere to toggle Clipboard HUD"
        >
          <Clipboard className="w-3 h-3 text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-[11px]">Show Last {settings.maxHistoryItems}:</span>
          <span className="bg-neutral-800/80 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold tracking-wider text-white border border-white/10">
            {settings.shortcut.metaKey ? '⌘' : ''}
            {settings.shortcut.shiftKey ? '⇧' : ''}
            {settings.shortcut.altKey ? '⌥' : ''}
            {settings.shortcut.ctrlKey ? '⌃' : ''}
            {settings.shortcut.key.toUpperCase()}
          </span>
        </button>
      </div>

      {/* Right side: Status Tray & Clock */}
      <div className="flex items-center gap-2">
        {/* Status Item: Clipboard Tray Popover */}
        <div className="relative" ref={menuRef}>
          <button
            id="macos-tray-clipboard-btn"
            onClick={() => {
              setMenuOpen(!menuOpen);
              setAppleMenuOpen(false);
              playMacSound('pop');
            }}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-default ${
              menuOpen ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-neutral-200'
            }`}
            title="Clipboard Menu"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono bg-blue-500 text-white px-1.5 py-0.2 rounded-full font-bold">
              {items.length}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-80 bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl py-1.5 text-[13px] z-50 text-neutral-200 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 flex items-center justify-between text-neutral-400 text-xs border-b border-white/10 pb-2">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Clipboard className="w-3.5 h-3.5 text-blue-400" />
                  Clipboard History
                </span>
                <span className="text-[11px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-300 font-mono">
                  {items.length} / {settings.maxHistoryItems} items
                </span>
              </div>

              {/* Quick action to open full HUD */}
              <div className="p-1">
                <button
                  id="macos-tray-open-hud"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenHUD();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white flex items-center justify-between group transition-colors"
                >
                  <span className="font-medium flex items-center gap-2">
                    <Command className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
                    Open Spotlight HUD...
                  </span>
                  <kbd className="text-[10px] bg-neutral-800 group-hover:bg-blue-700 px-1.5 py-0.5 rounded text-neutral-300 group-hover:text-white font-mono">
                    ⌘⇧V
                  </kbd>
                </button>
              </div>

              {/* Quick list of top 5 items */}
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Recent Clips
              </div>
              <div className="max-h-56 overflow-y-auto px-1 space-y-0.5">
                {visibleItems.length === 0 ? (
                  <div className="px-3 py-4 text-center text-neutral-500 text-xs">No items in clipboard</div>
                ) : (
                  visibleItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onPasteItem(item);
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between gap-2 group transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-neutral-500 group-hover:text-neutral-300 w-3">
                          {index + 1}
                        </span>
                        <span className="truncate text-xs text-neutral-200">
                          {item.text.replace(/\n/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                        {item.sourceApp}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="h-px bg-white/10 my-1.5" />

              <div className="p-1 space-y-0.5">
                <button
                  id="macos-tray-clear-history"
                  onClick={() => {
                    onClearUnpinned();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 text-neutral-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Unpinned History</span>
                </button>
                <button
                  id="macos-tray-preferences"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 text-neutral-300 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Preferences...</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wi-Fi & Battery */}
        <div className="hidden sm:flex items-center gap-2 text-neutral-300">
          <Wifi className="w-3.5 h-3.5" />
          <Battery className="w-4 h-4" />
        </div>

        {/* Date & Time */}
        <span className="text-neutral-200 text-xs px-1 font-normal cursor-default">
          {timeString || 'Sun Sep 20 6:34 AM'}
        </span>
      </div>
    </header>
  );
};
