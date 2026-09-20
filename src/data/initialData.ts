import { ClipboardItem } from '../types';

export const INITIAL_CLIPBOARD_ITEMS: ClipboardItem[] = [
  {
    id: 'clip-1',
    text: `func applicationDidFinishLaunching(_ aNotification: Notification) {\n    let pasteboard = NSPasteboard.general\n    let changeCount = pasteboard.changeCount\n    print("Listening to macOS pasteboard: \\(changeCount)")\n}`,
    copiedAt: Date.now() - 1000 * 60 * 2, // 2m ago
    sourceApp: 'Xcode',
    type: 'code',
    pinned: true,
    charCount: 174,
    wordCount: 16,
    lineCount: 5,
  },
  {
    id: 'clip-2',
    text: 'https://developer.apple.com/documentation/appkit/nspasteboard',
    copiedAt: Date.now() - 1000 * 60 * 8, // 8m ago
    sourceApp: 'Safari',
    type: 'url',
    pinned: true,
    charCount: 58,
    wordCount: 1,
    lineCount: 1,
  },
  {
    id: 'clip-3',
    text: `{\n  "version": "1.4.0",\n  "bundleIdentifier": "com.apple.clipboard.manager",\n  "permissions": ["accessibility", "pasteboard"],\n  "maxHistory": 25\n}`,
    copiedAt: Date.now() - 1000 * 60 * 18, // 18m ago
    sourceApp: 'VS Code',
    type: 'json',
    pinned: false,
    charCount: 139,
    wordCount: 7,
    lineCount: 6,
  },
  {
    id: 'clip-4',
    text: 'git checkout -b feature/clipboard-shortcuts && pnpm run build',
    copiedAt: Date.now() - 1000 * 60 * 32, // 32m ago
    sourceApp: 'Terminal',
    type: 'code',
    pinned: false,
    charCount: 60,
    wordCount: 7,
    lineCount: 1,
  },
  {
    id: 'clip-5',
    text: 'Hey team, the new shortcut for the clipboard HUD is set to ⌘+Shift+V. Press 1-9 to paste immediately!',
    copiedAt: Date.now() - 1000 * 60 * 55, // 55m ago
    sourceApp: 'Slack',
    type: 'text',
    pinned: false,
    charCount: 104,
    wordCount: 18,
    lineCount: 1,
  },
  {
    id: 'clip-6',
    text: '#007AFF',
    copiedAt: Date.now() - 1000 * 60 * 90, // 1.5h ago
    sourceApp: 'Figma',
    type: 'color',
    pinned: false,
    charCount: 7,
    wordCount: 1,
    lineCount: 1,
  },
  {
    id: 'clip-7',
    text: 'sarah.connor@macos-design.studio',
    copiedAt: Date.now() - 1000 * 60 * 140,
    sourceApp: 'Mail',
    type: 'email',
    pinned: false,
    charCount: 32,
    wordCount: 1,
    lineCount: 1,
  },
  {
    id: 'clip-8',
    text: '- Review PR for NSPasteboard observer\n- Add customizable shortcut recorder\n- Verify active application focus restoration\n- Benchmark memory footprint with 100 items',
    copiedAt: Date.now() - 1000 * 60 * 200,
    sourceApp: 'Notes',
    type: 'text',
    pinned: false,
    charCount: 169,
    wordCount: 22,
    lineCount: 4,
  }
];

export const NATIVE_SWIFT_CODE = `//
//  ClipboardManagerApp.swift
//  macOS Native Menu Bar Clipboard Manager
//  Requires macOS 13+ (Ventura / Sonoma / Sequoia)
//

import SwiftUI
import AppKit

@main
struct ClipboardManagerApp: App {
    @StateObject private var clipboard = ClipboardStore()
    
    var body: some Scene {
        MenuBarExtra("Clipboard", systemImage: "doc.on.clipboard") {
            ClipboardMenuView(store: clipboard)
        }
        .menuBarExtraStyle(.window)
    }
}

class ClipboardStore: ObservableObject {
    @Published var history: [String] = []
    private var lastChangeCount = NSPasteboard.general.changeCount
    private var timer: Timer?
    var maxItems: Int = 20
    
    init() {
        startPolling()
    }
    
    func startPolling() {
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
            self?.checkForNewCopies()
        }
    }
    
    func checkForNewCopies() {
        let pasteboard = NSPasteboard.general
        guard pasteboard.changeCount != lastChangeCount else { return }
        lastChangeCount = pasteboard.changeCount
        
        if let newString = pasteboard.string(forType: .string), !newString.isEmpty {
            DispatchQueue.main.async {
                self.history.removeAll { $0 == newString }
                self.history.insert(newString, at: 0)
                if self.history.count > self.maxItems {
                    self.history = Array(self.history.prefix(self.maxItems))
                }
            }
        }
    }
    
    func pasteToActiveApplication(text: String) {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(text, forType: .string)
        
        // Hide window and trigger Command+V keystroke event
        NSApp.hide(nil)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            let src = CGEventSource(stateID: .hidSystemState)
            let vKeyDown = CGEvent(keyboardEventSource: src, virtualKey: 0x09, keyDown: true)
            vKeyDown?.flags = .maskCommand
            vKeyDown?.post(tap: .cghidEventTap)
            
            let vKeyUp = CGEvent(keyboardEventSource: src, virtualKey: 0x09, keyDown: false)
            vKeyUp?.flags = .maskCommand
            vKeyUp?.post(tap: .cghidEventTap)
        }
    }
}
`;
