import SwiftUI
import AppKit

@main
struct ClipboardManagerApp: App {
    @StateObject private var store = ClipboardStore()
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        MenuBarExtra("Clipboard", systemImage: "doc.on.clipboard") {
            ClipboardHUDView(store: store)
        }
        .menuBarExtraStyle(.window)
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    private var globalEventMonitor: Any?

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Prevent dock icon from showing
        NSApp.setActivationPolicy(.accessory)

        // Register global keyboard monitor for Command+Shift+V or Option+V
        setupGlobalShortcut()
    }

    private func setupGlobalShortcut() {
        // Monitors key events while another app is active
        globalEventMonitor = NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { event in
            // Check for Command + Shift + V (KeyCode 9 is V)
            let flags = event.modifierFlags.intersection(.deviceIndependentFlagsMask)
            if flags == [.command, .shift] && event.keyCode == 9 {
                DispatchQueue.main.async {
                    NSApp.activate(ignoringOtherApps: true)
                }
            }
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        if let monitor = globalEventMonitor {
            NSEvent.removeMonitor(monitor)
        }
    }
}
