import Foundation
import AppKit
import Combine

public struct ClipboardRecord: Identifiable, Hashable {
    public let id: UUID
    public let text: String
    public let timestamp: Date
    public var isPinned: Bool

    public init(id: UUID = UUID(), text: String, timestamp: Date = Date(), isPinned: Bool = false) {
        self.id = id
        self.text = text
        self.timestamp = timestamp
        self.isPinned = isPinned
    }
}

public class ClipboardStore: ObservableObject {
    @Published public var items: [ClipboardRecord] = []
    @Published public var searchQuery: String = ""
    @Published public var maxItems: Int = 15
    @Published public var hasAccessibilityPermission: Bool = false

    private var lastChangeCount: Int = NSPasteboard.general.changeCount
    private var timer: Timer?

    public init() {
        checkAccessibility()
        startMonitoring()
        loadSampleData()
    }

    public var filteredItems: [ClipboardRecord] {
        let current = items
        if searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return Array(current.prefix(maxItems))
        }
        return current.filter { $0.text.localizedCaseInsensitiveContains(searchQuery) }
    }

    public func checkAccessibility() {
        let options: NSDictionary = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: false]
        self.hasAccessibilityPermission = AXIsProcessTrustedWithOptions(options)
    }

    public func requestAccessibility() {
        let options: NSDictionary = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true]
        self.hasAccessibilityPermission = AXIsProcessTrustedWithOptions(options)
    }

    private func startMonitoring() {
        timer = Timer.scheduledTimer(withTimeInterval: 0.4, repeats: true) { [weak self] _ in
            self?.checkForNewClips()
        }
    }

    private func checkForNewClips() {
        let pasteboard = NSPasteboard.general
        guard pasteboard.changeCount != lastChangeCount else { return }
        lastChangeCount = pasteboard.changeCount

        guard let newString = pasteboard.string(forType: .string),
              !newString.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            // Remove existing duplicates to bring to front
            self.items.removeAll { $0.text == newString }
            let record = ClipboardRecord(text: newString, timestamp: Date())
            self.items.insert(record, at: 0)

            // Keep pinned items + max items
            let pinned = self.items.filter { $0.isPinned }
            let unpinned = self.items.filter { !$0.isPinned }
            let allowedUnpinned = max(1, self.maxItems - pinned.count)
            self.items = pinned + Array(unpinned.prefix(allowedUnpinned))
        }
    }

    public func pasteToActiveApp(text: String) {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(text, forType: .string)

        // Close our window/menu to yield focus back to the target application
        NSApp.hide(nil)

        // Slight delay to ensure target application regains focus
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
            let src = CGEventSource(stateID: .hidSystemState)
            // Virtual key 0x09 is 'V' on standard US keyboards
            let vDown = CGEvent(keyboardEventSource: src, virtualKey: 0x09, keyDown: true)
            vDown?.flags = .maskCommand
            vDown?.post(tap: .cghidEventTap)

            let vUp = CGEvent(keyboardEventSource: src, virtualKey: 0x09, keyDown: false)
            vUp?.flags = .maskCommand
            vUp?.post(tap: .cghidEventTap)
        }
    }

    public func togglePin(id: UUID) {
        if let index = items.firstIndex(where: { $0.id == id }) {
            items[index].isPinned.toggle()
        }
    }

    public func delete(id: UUID) {
        items.removeAll { $0.id == id }
    }

    public func clearUnpinned() {
        items.removeAll { !$0.isPinned }
    }

    public func clearAll() {
        items.removeAll()
    }

    private func loadSampleData() {
        if items.isEmpty {
            items = [
                ClipboardRecord(text: "https://developer.apple.com/documentation/appkit/nspasteboard", isPinned: true),
                ClipboardRecord(text: "git checkout -b feature/clipboard-shortcuts && pnpm run build"),
                ClipboardRecord(text: "Press 1-9 to paste immediately into the active application!"),
                ClipboardRecord(text: "func pasteToActiveApp(text: String) { ... }")
            ]
        }
    }
}
