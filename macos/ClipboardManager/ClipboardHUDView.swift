import SwiftUI

public struct ClipboardHUDView: View {
    @ObservedObject var store: ClipboardStore
    @State private var hoveredId: UUID?

    public init(store: ClipboardStore) {
        self.store = store
    }

    public var body: some View {
        VStack(spacing: 0) {
            // Header Search & Filter Bar
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                TextField("Search last \(store.maxItems) clips...", text: $store.searchQuery)
                    .textFieldStyle(.plain)
                    .font(.system(size: 13, weight: .medium))

                if !store.searchQuery.isEmpty {
                    Button(action: { store.searchQuery = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(Color(NSColor.controlBackgroundColor).opacity(0.6))

            Divider()

            // Accessibility Warning Banner if needed
            if !store.hasAccessibilityPermission {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.yellow)
                    Text("Accessibility permission required to paste automatically.")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                    Spacer()
                    Button("Grant") {
                        store.requestAccessibility()
                    }
                    .font(.system(size: 11, weight: .semibold))
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.yellow.opacity(0.12))
                Divider()
            }

            // Clipboard Items List (Last N)
            ScrollView {
                LazyVStack(spacing: 2) {
                    if store.filteredItems.isEmpty {
                        VStack(spacing: 8) {
                            Image(systemName: "doc.on.clipboard")
                                .font(.system(size: 28))
                                .foregroundColor(.secondary)
                            Text("No clips found")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity, minHeight: 180)
                    } else {
                        ForEach(Array(store.filteredItems.enumerated()), id: \.element.id) { index, item in
                            ClipboardRowView(
                                index: index,
                                item: item,
                                isHovered: hoveredId == item.id,
                                onSelect: {
                                    store.pasteToActiveApp(text: item.text)
                                },
                                onTogglePin: {
                                    store.togglePin(id: item.id)
                                },
                                onDelete: {
                                    store.delete(id: item.id)
                                }
                            )
                            .onHover { hovering in
                                hoveredId = hovering ? item.id : nil
                            }
                        }
                    }
                }
                .padding(6)
            }
            .frame(height: 320)

            Divider()

            // Footer Toolbar with Keyboard Hints
            HStack {
                HStack(spacing: 8) {
                    Text("1..9: Paste")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(.secondary)
                    Text("•")
                        .foregroundColor(.secondary)
                    Text("Last \(store.maxItems) Items")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }

                Spacer()

                Menu {
                    Button("Clear Unpinned Clips") {
                        store.clearUnpinned()
                    }
                    Button("Clear All History") {
                        store.clearAll()
                    }
                    Divider()
                    Picker("History Size", selection: $store.maxItems) {
                        Text("Last 5 items").tag(5)
                        Text("Last 10 items").tag(10)
                        Text("Last 15 items").tag(15)
                        Text("Last 25 items").tag(25)
                        Text("Last 50 items").tag(50)
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
                .menuStyle(.borderlessButton)
                .frame(width: 24)

                Button("Quit") {
                    NSApplication.shared.terminate(nil)
                }
                .font(.system(size: 11))
                .buttonStyle(.plain)
                .foregroundColor(.secondary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color(NSColor.windowBackgroundColor))
        }
        .frame(width: 360)
        .background(VisualEffectView(material: .popover, blendingMode: .behindWindow))
    }
}

struct ClipboardRowView: View {
    let index: Int
    let item: ClipboardRecord
    let isHovered: Bool
    let onSelect: () -> Void
    let onTogglePin: () -> Void
    let onDelete: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 8) {
                // Number badge (1..9) for instant shortcut
                Text(index < 9 ? "\(index + 1)" : "•")
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundColor(isHovered ? .white : .secondary)
                    .frame(width: 18, height: 18)
                    .background(isHovered ? Color.blue : Color(NSColor.controlBackgroundColor))
                    .cornerRadius(4)

                // Text preview
                Text(item.text.replacingOccurrences(of: "\n", with: " "))
                    .font(.system(size: 12, design: .default))
                    .lineLimit(1)
                    .foregroundColor(isHovered ? .white : .primary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                // Pin badge
                if item.isPinned {
                    Image(systemName: "pin.fill")
                        .font(.system(size: 10))
                        .foregroundColor(.orange)
                }

                // Hover Actions
                if isHovered {
                    HStack(spacing: 4) {
                        Button(action: onTogglePin) {
                            Image(systemName: item.isPinned ? "pin.slash" : "pin")
                                .font(.system(size: 11))
                                .foregroundColor(.white)
                        }
                        .buttonStyle(.plain)

                        Button(action: onDelete) {
                            Image(systemName: "trash")
                                .font(.system(size: 11))
                                .foregroundColor(.white)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(isHovered ? Color.accentColor : Color.clear)
            .cornerRadius(6)
        }
        .buttonStyle(.plain)
        .keyboardShortcut(index < 9 ? KeyEquivalent(Character("\(index + 1)")) : nil, modifiers: [])
    }
}

// macOS Frosted Glass Background
struct VisualEffectView: NSViewRepresentable {
    let material: NSVisualEffectView.Material
    let blendingMode: NSVisualEffectView.BlendingMode

    func makeNSView(context: Context) -> NSVisualEffectView {
        let visualEffectView = NSVisualEffectView()
        visualEffectView.material = material
        visualEffectView.blendingMode = blendingMode
        visualEffectView.state = .active
        return visualEffectView
    }

    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {
        nsView.material = material
        nsView.blendingMode = blendingMode
    }
}
