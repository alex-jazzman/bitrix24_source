/**
 * Exposes the editor's editable state as a reactive `Signal<boolean>` that
 * mirrors `editor.isEditable()` via an editable listener.
 *
 * Depend on this extension and read its output `Signal` from a signals
 * `effect`/`computed` to react to editability changes without subscribing
 * through React (or any other framework).
 */
export declare const WatchEditableExtension: import("ui.lexical.core").LexicalExtension<import("ui.lexical.core").ExtensionConfigBase, "@lexical/extension/WatchEditable", import("./vendor-types/signals-core").Signal<boolean>, unknown>;
