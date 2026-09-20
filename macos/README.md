# macOS Native Clipboard Manager

A lightweight, native macOS menu bar clipboard manager built with **SwiftUI**, **AppKit**, and **NSPasteboard**.

## Features
- **Menu Bar Accessory (`LSUIElement`)**: Runs unobtrusively in the macOS menu bar without polluting your Dock.
- **Auto-Paste into Active Application**: Automatically hides the menu and synthesizes `Command + V` to insert selected snippets right into your focused app (TextEdit, VS Code, Slack, Terminal, Notes, etc.).
- **Quick Number Shortcuts**: Press `1` through `9` on your keyboard to instantly choose and paste a clip.
- **Search & Filter**: Live instant filtering through your last N copied items.
- **Pin / Favorite Clips**: Pin important code snippets, keys, or links to keep them at the top.
- **History Size Configuration**: Dynamically select between 5, 10, 15, 25, or 50 items.

---

## How to Run in Xcode

### Method 1: Open the Xcode Project (Direct)
1. Double-click `ClipboardManager.xcodeproj` to open it in **Xcode**.
2. Press **`Cmd + R`** (or click the **Play** button) to build and run.
3. The clipboard icon (`doc.on.clipboard`) will appear in your top macOS menu bar!

### Method 2: Open with Swift Package Manager
In Terminal:
```bash
open Package.swift
# Or directly compile and run from command line:
swift run
```

---

## Important macOS Permission: Accessibility
To paste selected clips into whatever application was active before opening the menu, macOS requires **Accessibility permission**:
1. When prompted on first launch, click **Grant**.
2. Alternatively, go to **System Settings** → **Privacy & Security** → **Accessibility** and ensure `ClipboardManager` is checked.
