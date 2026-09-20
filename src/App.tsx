/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MenuBar } from './components/MenuBar';
import { ActiveAppSandbox } from './components/ActiveAppSandbox';
import { ClipboardHUD } from './components/ClipboardHUD';
import { PreferencesModal } from './components/PreferencesModal';
import { Toast } from './components/Toast';
import { ClipboardItem, ActiveApp, ActiveAppId, AppSettings } from './types';
import { INITIAL_CLIPBOARD_ITEMS } from './data/initialData';
import { createClipboardItem } from './utils/clipboardHelper';
import { playMacSound } from './utils/audio';

const STORAGE_KEY_ITEMS = 'macos_clipboard_items_v1';
const STORAGE_KEY_SETTINGS = 'macos_clipboard_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  maxHistoryItems: 15,
  shortcut: {
    metaKey: true,
    shiftKey: true,
    altKey: false,
    ctrlKey: false,
    key: 'v',
  },
  soundEffects: true,
  pasteDirectly: true,
  closeOnPaste: true,
  stripFormatting: false,
  theme: 'dark',
  listenToSystemClipboard: true,
  ignorePasswordManagers: true,
};

export default function App() {
  // Load initial clipboard history from localStorage or defaults
  const [items, setItems] = useState<ClipboardItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_CLIPBOARD_ITEMS;
  });

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Active Destination Application
  const [activeApp, setActiveApp] = useState<ActiveApp>({
    id: 'notes',
    name: 'Notes',
    icon: 'FileText',
    title: 'Notes — Daily Scratchpad',
  });

  // Modal / HUD visibility
  const [isHUDOpen, setIsHUDOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Paste feedback
  const [lastPastedItem, setLastPastedItem] = useState<ClipboardItem | null>(null);
  const [lastPasteTimestamp, setLastPasteTimestamp] = useState<number>(0);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; subMessage?: string; icon?: 'paste' | 'check' | 'copy' } | null>(null);

  const showToast = useCallback((message: string, subMessage?: string, icon: 'paste' | 'check' | 'copy' = 'paste') => {
    setToast({ message, subMessage, icon });
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Save items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch {
      // storage quota or private mode
    }
  }, [items]);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Add new clipboard item with deduplication and N-history retention
  const addNewClip = useCallback(
    (text: string, sourceApp = 'System Clipboard', pinned = false) => {
      if (!text || !text.trim()) return;

      setItems((prev) => {
        // Remove existing duplicate
        const filtered = prev.filter((item) => item.text.trim() !== text.trim());
        const newItem = createClipboardItem(text, sourceApp, pinned);
        const updated = [newItem, ...filtered];

        // Keep pinned items + up to maxHistoryItems unpinned
        const pinnedItems = updated.filter((i) => i.pinned);
        const unpinnedItems = updated.filter((i) => !i.pinned);
        const trimmedUnpinned = unpinnedItems.slice(0, Math.max(1, settings.maxHistoryItems - pinnedItems.length));

        return [...pinnedItems, ...trimmedUnpinned];
      });

      showToast('Copied to Clipboard History', `From ${sourceApp}`, 'copy');
    },
    [settings.maxHistoryItems, showToast]
  );

  // Real copy event listener in browser
  useEffect(() => {
    const handleDocumentCopy = () => {
      // Small timeout so selection is finalized
      setTimeout(() => {
        const selectedText = window.getSelection()?.toString();
        if (selectedText && selectedText.trim()) {
          addNewClip(selectedText, `${activeApp.name} (Selection)`);
        }
      }, 50);
    };

    document.addEventListener('copy', handleDocumentCopy);
    return () => document.removeEventListener('copy', handleDocumentCopy);
  }, [activeApp.name, addNewClip]);

  // Global Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { shortcut } = settings;

      // Check if key matches
      const isKeyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      // On macOS, metaKey is Command; on Windows/Linux, ctrlKey acts similarly
      const isMetaOrCtrl = e.metaKey || e.ctrlKey;
      const metaMatched = shortcut.metaKey ? isMetaOrCtrl : true;
      const shiftMatched = shortcut.shiftKey ? e.shiftKey : true;
      const altMatched = shortcut.altKey ? e.altKey : true;

      // Global shortcut: ⌘+Shift+V (or user configured)
      if (isKeyMatch && metaMatched && shiftMatched && altMatched && (!shortcut.shiftKey || e.shiftKey)) {
        e.preventDefault();
        setIsHUDOpen((prev) => {
          const next = !prev;
          if (settings.soundEffects) {
            playMacSound(next ? 'pop' : 'switch');
          }
          return next;
        });
        return;
      }

      // ⌘ + , to open Preferences
      if (isMetaOrCtrl && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
        if (settings.soundEffects) playMacSound('pop');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings]);

  // Action: Paste Item into Active Application
  const handlePasteItem = useCallback(
    async (item: ClipboardItem) => {
      // 1. Copy to native system clipboard
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(item.text);
        }
      } catch {
        // fallback
      }

      // 2. Play sound effect
      if (settings.soundEffects) {
        playMacSound('paste');
      }

      // 3. Trigger paste in active application
      setLastPastedItem(item);
      setLastPasteTimestamp(Date.now());

      // 4. Toast notification
      showToast(
        `Pasted into ${activeApp.name}`,
        item.text.length > 40 ? `${item.text.slice(0, 40)}...` : item.text,
        'paste'
      );

      // 5. Dismiss HUD if configured
      if (settings.closeOnPaste) {
        setIsHUDOpen(false);
      }
    },
    [activeApp.name, settings.soundEffects, settings.closeOnPaste, showToast]
  );

  // Action: Copy to System Clipboard only
  const handleCopyItem = useCallback(
    async (item: ClipboardItem) => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(item.text);
        }
      } catch {
        // fallback
      }
      if (settings.soundEffects) playMacSound('copy');
      showToast('Copied to System Clipboard', item.text.slice(0, 35), 'check');
    },
    [settings.soundEffects, showToast]
  );

  // Action: Toggle Pin
  const handleTogglePin = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item))
      );
      if (settings.soundEffects) playMacSound('pop');
    },
    [settings.soundEffects]
  );

  // Action: Delete Item
  const handleDeleteItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (settings.soundEffects) playMacSound('trash');
    },
    [settings.soundEffects]
  );

  // Action: Clear Unpinned
  const handleClearUnpinned = useCallback(() => {
    setItems((prev) => prev.filter((item) => item.pinned));
    if (settings.soundEffects) playMacSound('trash');
    showToast('Unpinned History Cleared', 'Pinned items were preserved', 'check');
  }, [settings.soundEffects, showToast]);

  // Action: Clear All
  const handleClearAll = useCallback(() => {
    setItems([]);
    if (settings.soundEffects) playMacSound('trash');
    showToast('All Clipboard History Cleared', '', 'check');
  }, [settings.soundEffects, showToast]);

  // Handle App selection
  const handleSelectApp = (appId: ActiveAppId) => {
    const titles: Record<ActiveAppId, { name: string; title: string; icon: string }> = {
      notes: { name: 'Notes', title: 'Notes — Daily Scratchpad', icon: 'FileText' },
      vscode: { name: 'VS Code', title: 'AppDelegate.swift — Visual Studio Code', icon: 'Code2' },
      slack: { name: 'Slack', title: '#engineering-general — Slack', icon: 'MessageSquare' },
      terminal: { name: 'Terminal', title: 'khue@macbook-pro ~ % (zsh)', icon: 'Terminal' },
    };
    setActiveApp({
      id: appId,
      name: titles[appId].name,
      title: titles[appId].title,
      icon: titles[appId].icon,
    });
  };

  return (
    <div
      id="macos-desktop-root"
      className="w-full h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-neutral-100 overflow-hidden font-sans select-none"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 10%, rgba(37, 99, 235, 0.15), transparent 40%), radial-gradient(circle at 90% 80%, rgba(147, 51, 234, 0.12), transparent 45%)`,
      }}
    >
      {/* 1. Authentic macOS Menu Bar with Status Item & Clock */}
      <MenuBar
        items={items}
        settings={settings}
        activeApp={activeApp}
        onOpenHUD={() => setIsHUDOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearUnpinned={handleClearUnpinned}
        onPasteItem={handlePasteItem}
        copiedCount={items.length}
      />

      {/* 2. Interactive Active Application Desktop Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <ActiveAppSandbox
          activeApp={activeApp}
          onSelectApp={handleSelectApp}
          onAddNewClip={addNewClip}
          onOpenHUD={() => setIsHUDOpen(true)}
          lastPastedItem={lastPastedItem}
          lastPasteTimestamp={lastPasteTimestamp}
        />
      </main>

      {/* 3. Floating macOS Clipboard HUD (Spotlight / Raycast / Maccy Style) */}
      <ClipboardHUD
        isOpen={isHUDOpen}
        onClose={() => setIsHUDOpen(false)}
        items={items}
        settings={settings}
        activeApp={activeApp}
        onPasteItem={handlePasteItem}
        onCopyItem={handleCopyItem}
        onTogglePin={handleTogglePin}
        onDeleteItem={handleDeleteItem}
        onOpenSettings={() => {
          setIsHUDOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      {/* 4. macOS System Preferences Modal */}
      <PreferencesModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        onClearHistory={handleClearAll}
      />

      {/* 5. Subtle Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          subMessage={toast.subMessage}
          icon={toast.icon}
        />
      )}
    </div>
  );
}
