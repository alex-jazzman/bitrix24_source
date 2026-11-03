/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { type CommandListenerPriority, type CommandListenerPriorityBefore, type KeyboardShortcut, type KeyboardShortcutMatch } from 'ui.lexical.core';
export interface FormatKeyboardShortcutOptions {
    /** Override the platform convention (defaults to the runtime platform) */
    isApple?: boolean;
    /** The separator between segments (default `'+'`) */
    separator?: string;
}
/**
 * Format the key binding of a shortcut as a human readable string for
 * menus, tooltips, and help dialogs (e.g. `'⌘+Shift+K'` on Apple platforms
 * and `'Ctrl+Shift+K'` elsewhere). Modifiers with an `'any'` mask are not
 * displayed.
 */
export declare function formatKeyboardShortcut(shortcut: KeyboardShortcutMatch, options?: FormatKeyboardShortcutOptions): string[];
/**
 * Keyboard shortcuts by name. The names exist so that other extensions and
 * applications can overlay the table: configuring an existing name remaps
 * that shortcut, configuring it to null disables it, and new names add new
 * shortcuts.
 * @experimental
 */
export type NamedKeyboardShortcuts = Record<string, KeyboardShortcut | readonly KeyboardShortcut[] | null>;
/**
 * Configuration for {@link KeyboardShortcutsExtension}.
 * @experiemental
 */
export interface KeyboardShortcutsConfig {
    /** When `true`, the shortcut listener is not registered */
    disabled: boolean;
    /**
     * The `KEY_DOWN_COMMAND` priority (default {@link COMMAND_PRIORITY_NORMAL}).
     *
     * This must be a priority *above* {@link COMMAND_PRIORITY_EDITOR}. Every
     * editor registers the core `$handleKeyDown` at
     * {@link COMMAND_PRIORITY_EDITOR} and it unconditionally reports the event
     * as handled, so a shortcut listener at that priority or later is never
     * reached. That also rules out
     * {@link COMMAND_PRIORITY_BEFORE_EDITOR}: command dispatch walks priorities
     * from {@link COMMAND_PRIORITY_CRITICAL} down to
     * {@link COMMAND_PRIORITY_EDITOR} on the *outside* and the nested editor
     * chain on the inside, so a nested editor's own `$handleKeyDown` ends the
     * dispatch before any listener the parent has in the editor-priority queue —
     * which would make {@link KeyboardShortcut.bubbleFromNestedEditors}
     * impossible to satisfy.
     */
    priority: CommandListenerPriority | CommandListenerPriorityBefore;
    /** The named shortcut table, merged by name across the extension graph */
    shortcuts: NamedKeyboardShortcuts;
}
/**
 * @experimental
 *
 * Dispatches a table of keyboard shortcuts from a single compiled
 * `KEY_DOWN_COMMAND` listener, in O(1) per keypress.
 *
 * The table is merged across the whole extension graph by name: any
 * extension or app config can add shortcuts under new names, remap an
 * existing name to a different key or handler, or disable one by
 * configuring it to null. The output exposes the config as signals, so the
 * table can also be remapped at runtime through the `shortcuts` signal
 * (the listener is recompiled on change).
 *
 * Configuring an existing name always replaces its mapping outright, and a
 * name may be mapped to an array to give it several bindings at once. The
 * overriding names are also matched first, ahead of the names they did not
 * override, when more than one shortcut matches the same keypress.
 */
export declare const KeyboardShortcutsExtension: import("ui.lexical.core").LexicalExtension<KeyboardShortcutsConfig, "@lexical/extension/KeyboardShortcuts", import("./namedSignals").NamedSignalsOutput<KeyboardShortcutsConfig>, unknown>;
