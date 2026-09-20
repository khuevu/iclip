export type ContentType = 'text' | 'code' | 'url' | 'json' | 'email' | 'color';

export interface ClipboardItem {
  id: string;
  text: string;
  copiedAt: number;
  sourceApp: string; // e.g. 'Xcode', 'Safari', 'Slack', 'Notes', 'Terminal', 'VS Code'
  type: ContentType;
  pinned: boolean;
  charCount: number;
  wordCount: number;
  lineCount: number;
}

export type ActiveAppId = 'notes' | 'vscode' | 'slack' | 'terminal';

export interface ActiveApp {
  id: ActiveAppId;
  name: string;
  icon: string;
  title: string;
}

export interface ShortcutConfig {
  metaKey: boolean; // ⌘
  shiftKey: boolean; // ⇧
  altKey: boolean; // ⌥
  ctrlKey: boolean; // ⌃
  key: string; // e.g. 'v', 'V'
}

export interface AppSettings {
  maxHistoryItems: number; // N items (e.g. 5, 10, 15, 25, 50)
  shortcut: ShortcutConfig;
  soundEffects: boolean;
  pasteDirectly: boolean; // paste into active app immediately on selection
  closeOnPaste: boolean; // dismiss HUD after pasting
  stripFormatting: boolean;
  theme: 'dark' | 'light' | 'auto';
  listenToSystemClipboard: boolean;
  ignorePasswordManagers: boolean;
}
