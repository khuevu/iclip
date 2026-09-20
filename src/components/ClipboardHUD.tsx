import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Pin,
  Trash2,
  Copy,
  ExternalLink,
  Code,
  Link,
  FileCode,
  FileText,
  Mail,
  Palette,
  Check,
  CornerDownLeft,
  X,
  Sparkles,
  Sliders,
  ArrowUpDown,
  Command,
  HelpCircle
} from 'lucide-react';
import { ClipboardItem, ContentType, AppSettings, ActiveApp } from '../types';
import { formatTimeAgo, transformText } from '../utils/clipboardHelper';
import { playMacSound } from '../utils/audio';

interface ClipboardHUDProps {
  isOpen: boolean;
  onClose: () => void;
  items: ClipboardItem[];
  settings: AppSettings;
  activeApp: ActiveApp;
  onPasteItem: (item: ClipboardItem) => void;
  onCopyItem: (item: ClipboardItem) => void;
  onTogglePin: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onOpenSettings: () => void;
}

export const ClipboardHUD: React.FC<ClipboardHUDProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  activeApp,
  onPasteItem,
  onCopyItem,
  onTogglePin,
  onDeleteItem,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pinned' | ContentType>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copySuccessToast, setCopySuccessToast] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Focus input and reset selection when HUD opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Restrict to last N items as specified by settings.maxHistoryItems
  const limitedItems = useMemo(() => {
    return items.slice(0, settings.maxHistoryItems);
  }, [items, settings.maxHistoryItems]);

  // Filter based on search and type filter
  const filteredItems = useMemo(() => {
    let result = limitedItems;

    if (activeFilter === 'pinned') {
      result = result.filter((item) => item.pinned);
    } else if (activeFilter !== 'all') {
      result = result.filter((item) => item.type === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.text.toLowerCase().includes(q) ||
          item.sourceApp.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
      );
    }

    return result;
  }, [limitedItems, activeFilter, searchQuery]);

  // Selected item
  const selectedItem = filteredItems[selectedIndex] || filteredItems[0] || null;

  // Ensure selected index is within bounds
  useEffect(() => {
    if (selectedIndex >= filteredItems.length && filteredItems.length > 0) {
      setSelectedIndex(filteredItems.length - 1);
    }
  }, [filteredItems.length, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (listContainerRef.current) {
      const activeEl = listContainerRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation inside HUD:
  // ↑ / ↓, 1-9 quick paste, Enter to paste, Esc to close, Backspace to delete, ⌥P to pin
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Close on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // 2. Quick numeric paste keys 1..9 (if not searching text)
      // When alt/cmd or even bare number pressed outside or while focusing
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 9 && (e.metaKey || e.altKey || (!searchQuery && document.activeElement !== searchInputRef.current))) {
        const targetIndex = num - 1;
        if (targetIndex < filteredItems.length) {
          e.preventDefault();
          const item = filteredItems[targetIndex];
          onPasteItem(item);
          return;
        }
      }

      // 3. Arrow Down
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
        playMacSound('switch');
        return;
      }

      // 4. Arrow Up
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, filteredItems.length - 1)));
        playMacSound('switch');
        return;
      }

      // 5. Enter to Paste into Active App
      if (e.key === 'Enter' && selectedItem) {
        e.preventDefault();
        onPasteItem(selectedItem);
        return;
      }

      // 6. Delete / Backspace to remove
      if ((e.key === 'Delete' || (e.key === 'Backspace' && (e.metaKey || e.altKey))) && selectedItem) {
        e.preventDefault();
        onDeleteItem(selectedItem.id);
        playMacSound('trash');
        return;
      }

      // 7. Toggle Pin: Alt+P or Cmd+P
      if ((e.key === 'p' || e.key === 'P') && (e.altKey || e.metaKey) && selectedItem) {
        e.preventDefault();
        onTogglePin(selectedItem.id);
        playMacSound('pop');
        return;
      }

      // 8. Cmd+C copy without pasting
      if ((e.key === 'c' || e.key === 'C') && (e.metaKey || e.ctrlKey) && selectedItem && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        onCopyItem(selectedItem);
        setCopySuccessToast(true);
        setTimeout(() => setCopySuccessToast(false), 1500);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, selectedItem, onPasteItem, onClose, onDeleteItem, onTogglePin, onCopyItem, searchQuery]);

  if (!isOpen) return null;

  // Icon selector based on content type
  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'code':
        return <Code className="w-3.5 h-3.5 text-blue-400" />;
      case 'url':
        return <Link className="w-3.5 h-3.5 text-sky-400" />;
      case 'json':
        return <FileCode className="w-3.5 h-3.5 text-amber-400" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-purple-400" />;
      case 'color':
        return <Palette className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  // Quick text transform action
  const handleApplyTransform = (format: 'uppercase' | 'lowercase' | 'titlecase' | 'trim' | 'json' | 'slug') => {
    if (!selectedItem) return;
    const transformed = transformText(selectedItem.text, format);
    onPasteItem({
      ...selectedItem,
      text: transformed,
    });
  };

  return (
    <div
      id="macos-clipboard-hud-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Spotlight / Raycast Style Floating Glass Window */}
      <div
        id="macos-clipboard-hud-window"
        className="w-full max-w-4xl bg-neutral-900/95 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] animate-in zoom-in-95 duration-150"
      >
        {/* Window Top Bar: Search & Traffic Lights */}
        <div className="h-14 border-b border-white/10 px-4 flex items-center gap-3 shrink-0 bg-neutral-950/60">
          {/* Traffic lights / Close */}
          <div className="flex items-center gap-2 pr-2">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center group border border-red-600/50"
              title="Close (Esc)"
            >
              <X className="w-2 h-2 text-red-950 opacity-0 group-hover:opacity-100" />
            </button>
            <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/50" />
          </div>

          {/* Search Icon & Input */}
          <div className="flex-1 flex items-center gap-2.5">
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              ref={searchInputRef}
              id="clipboard-hud-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder={`Search last ${settings.maxHistoryItems} copied texts... (type or press 1-9 to paste)`}
              className="w-full bg-transparent border-none text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-0 font-medium"
            />
          </div>

          {/* Filter Pills */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              All ({limitedItems.length})
            </button>
            <button
              onClick={() => setActiveFilter('pinned')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                activeFilter === 'pinned'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Pin className="w-3 h-3" />
              <span>Pinned</span>
            </button>
            <button
              onClick={() => setActiveFilter('code')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === 'code'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setActiveFilter('url')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === 'url'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              URLs
            </button>
          </div>
        </div>

        {/* Two-Column Layout: Left List of Last N Items, Right Detail & Paste Inspector */}
        <div className="flex-1 flex min-h-[380px] overflow-hidden">
          {/* Left Column: List of items */}
          <div
            ref={listContainerRef}
            className="w-full md:w-7/12 border-r border-white/10 overflow-y-auto p-2 space-y-1 select-none"
          >
            {filteredItems.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 text-xs flex flex-col items-center gap-2">
                <Search className="w-8 h-8 opacity-40 text-neutral-400" />
                <p>No copied items found matching "{searchQuery}"</p>
                <p className="text-neutral-600 text-[11px]">Copy any text in an app to add it to history</p>
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = selectedIndex === index;
                const quickKeyNumber = index < 9 ? index + 1 : null;

                return (
                  <div
                    key={item.id}
                    data-index={index}
                    onClick={() => {
                      setSelectedIndex(index);
                      playMacSound('switch');
                    }}
                    onDoubleClick={() => onPasteItem(item)}
                    className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'hover:bg-white/5 text-neutral-200'
                    }`}
                  >
                    {/* Left: Quick key badge + Type icon + Text snippet */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      {/* Number shortcut key badge 1..9 */}
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-mono font-bold shrink-0 border ${
                          isSelected
                            ? 'bg-blue-700 text-white border-blue-400/40'
                            : 'bg-neutral-800 text-neutral-400 border-white/10 group-hover:text-white'
                        }`}
                        title={quickKeyNumber ? `Press ${quickKeyNumber} to paste immediately` : ''}
                      >
                        {quickKeyNumber ? quickKeyNumber : '•'}
                      </span>

                      {/* Content Type Icon */}
                      <div className="shrink-0">{getTypeIcon(item.type)}</div>

                      {/* Snippet text */}
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-xs font-mono truncate ${
                            isSelected ? 'text-white' : 'text-neutral-200'
                          }`}
                        >
                          {item.text.replace(/\s+/g, ' ')}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                          <span
                            className={
                              isSelected ? 'text-blue-200' : 'text-neutral-400'
                            }
                          >
                            {item.sourceApp}
                          </span>
                          <span
                            className={
                              isSelected ? 'text-blue-300' : 'text-neutral-500'
                            }
                          >
                            •
                          </span>
                          <span
                            className={
                              isSelected ? 'text-blue-200' : 'text-neutral-500'
                            }
                          >
                            {formatTimeAgo(item.copiedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Badges, Pin, and Paste trigger */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.pinned && (
                        <Pin
                          className={`w-3.5 h-3.5 fill-current ${
                            isSelected ? 'text-amber-300' : 'text-amber-400'
                          }`}
                        />
                      )}

                      {/* Quick Paste button on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPasteItem(item);
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-opacity ${
                          isSelected
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'opacity-0 group-hover:opacity-100 bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                        }`}
                        title="Paste into active application"
                      >
                        <CornerDownLeft className="w-3 h-3" />
                        <span className="hidden sm:inline">Paste</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Active Preview & Action Inspector */}
          <div className="hidden md:flex md:w-5/12 flex-col bg-neutral-950/40 p-4 justify-between">
            {selectedItem ? (
              <>
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Item Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(selectedItem.type)}
                      <span className="text-xs font-semibold text-white capitalize">
                        {selectedItem.type}
                      </span>
                      <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-mono">
                        {selectedItem.sourceApp}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onTogglePin(selectedItem.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          selectedItem.pinned
                            ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                            : 'hover:bg-white/10 border-transparent text-neutral-400'
                        }`}
                        title={selectedItem.pinned ? 'Unpin (⌥P)' : 'Pin to top (⌥P)'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(selectedItem.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-neutral-400 transition-colors"
                        title="Delete from history (⌫)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Item Text Full Preview */}
                  <div className="flex-1 my-3 bg-neutral-900/80 border border-white/10 rounded-xl p-3 overflow-y-auto font-mono text-xs text-neutral-100 whitespace-pre-wrap break-words leading-relaxed select-text shadow-inner">
                    {selectedItem.text}
                  </div>

                  {/* Character & Word Metrics */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-white/10 text-center text-xs">
                    <div className="bg-neutral-900/60 p-1.5 rounded-lg border border-white/5">
                      <div className="text-[10px] text-neutral-400 uppercase">Characters</div>
                      <div className="font-semibold text-white font-mono">{selectedItem.charCount}</div>
                    </div>
                    <div className="bg-neutral-900/60 p-1.5 rounded-lg border border-white/5">
                      <div className="text-[10px] text-neutral-400 uppercase">Words</div>
                      <div className="font-semibold text-white font-mono">{selectedItem.wordCount}</div>
                    </div>
                    <div className="bg-neutral-900/60 p-1.5 rounded-lg border border-white/5">
                      <div className="text-[10px] text-neutral-400 uppercase">Lines</div>
                      <div className="font-semibold text-white font-mono">{selectedItem.lineCount}</div>
                    </div>
                  </div>

                  {/* Text Transformation / Clean Tools */}
                  <div className="py-2">
                    <div className="text-[11px] font-medium text-neutral-400 mb-1.5 flex items-center justify-between">
                      <span>Quick Transformations:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => handleApplyTransform('uppercase')}
                        className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] font-mono"
                      >
                        UPPERCASE
                      </button>
                      <button
                        onClick={() => handleApplyTransform('lowercase')}
                        className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] font-mono"
                      >
                        lowercase
                      </button>
                      <button
                        onClick={() => handleApplyTransform('titlecase')}
                        className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                      >
                        Title Case
                      </button>
                      <button
                        onClick={() => handleApplyTransform('trim')}
                        className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                      >
                        Trim
                      </button>
                      {selectedItem.type === 'json' && (
                        <button
                          onClick={() => handleApplyTransform('json')}
                          className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px]"
                        >
                          Beautify JSON
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <button
                    id="hud-paste-primary-btn"
                    onClick={() => onPasteItem(selectedItem)}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg shadow-blue-600/30 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <CornerDownLeft className="w-4 h-4" />
                      Paste to {activeApp.name}
                    </span>
                    <kbd className="px-2 py-0.5 bg-blue-700 rounded text-[10px] font-mono">⏎ Enter</kbd>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onCopyItem(selectedItem);
                        setCopySuccessToast(true);
                        setTimeout(() => setCopySuccessToast(false), 1500);
                      }}
                      className="flex-1 py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
                    >
                      {copySuccessToast ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy (⌘C)</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={onOpenSettings}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium flex items-center gap-1 border border-white/10"
                      title="Preferences"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-500 text-xs">
                Select an item to inspect
              </div>
            )}
          </div>
        </div>

        {/* HUD Bottom Bar: Keyboard Shortcuts Guide */}
        <div className="h-9 bg-neutral-950 border-t border-white/10 px-4 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 bg-neutral-800 text-neutral-300 rounded text-[10px] font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 bg-neutral-800 text-neutral-300 rounded text-[10px] font-mono">⏎</kbd>
              Paste to {activeApp.name}
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 bg-neutral-800 text-neutral-300 rounded text-[10px] font-mono">1..9</kbd>
              Quick Paste
            </span>
            <span className="hidden md:flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 bg-neutral-800 text-neutral-300 rounded text-[10px] font-mono">⌥P</kbd>
              Pin
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-500">
              Showing last <strong className="text-neutral-300 font-mono">{settings.maxHistoryItems}</strong> clips
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 bg-neutral-800 text-neutral-300 rounded text-[10px] font-mono">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
