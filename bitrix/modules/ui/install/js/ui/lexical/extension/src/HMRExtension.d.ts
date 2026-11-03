/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { type EditorState, type LexicalEditor, type LexicalExtension } from 'ui.lexical.core';
import { type ReadonlySignal, type Signal } from './signals';
/**
 * Minimal interface for bundler HMR contexts. Satisfied by Vite's
 * `ViteHotContext` and similar bundler HMR contexts. Only the `data`
 * property is read and written; other HMR lifecycle methods are not required.
 *
 * Webpack and Parcel expose `module.hot` instead of `import.meta.hot`. Their
 * `module.hot.data` is populated by dispose handlers and is not directly
 * mutable, so `module.hot` cannot be passed here — a custom adapter using
 * `module.hot.addDisposeHandler` is required for those bundlers.
 */
export interface HotContext {
    readonly data: Record<string, unknown>;
}
/** The state {@link HMRExtension} creates before the editor exists. */
interface HMRInit {
    restoreCount: Signal<number>;
}
/** The output of {@link HMRExtension}. */
export interface HMROutput {
    /**
     * Increments every time this editor's state has been restored from the
     * module instance that was replaced.
     *
     * Anything that derives editor state from somewhere else has to run again
     * afterwards, and can depend on this signal to be told when: a nested editor
     * wired up by `SharedHistoryExtension` re-points its `HistoryState` at its
     * parent's, which a restore would otherwise have replaced with one of its
     * own.
     */
    restoreCount: ReadonlySignal<number>;
}
/** Configuration for {@link HMRExtension}. */
export interface HMRConfig {
    /**
     * The bundler's HMR context, typically `import.meta.hot`. Pass `null`
     * in production or when HMR is not available.
     */
    hot: HotContext | null;
    /**
     * Stable identifier for this editor instance. Must be stable across HMR
     * reloads — do not use `useId()`, `Math.random()`, or any per-mount
     * identifier (these generate a new value on every mount and will fail to
     * match the key from the previous HMR cycle, preventing state restoration).
     * Only needed when multiple editors share both the same `import.meta.hot`
     * context and the same `namespace` (set via
     * `defineExtension({ namespace: '...' })` or
     * `createEditor({ namespace: '...' })`); editors with distinct namespaces
     * are isolated automatically, editors with no configured namespace all share
     * one key, and a nested editor shares its parent's namespace and so needs an
     * `id` of its own. Must be a non-empty string when provided;
     * passing `''` triggers a dev warning and is treated as no `id`. Both are
     * escaped into the key, so either may contain any character.
     */
    id?: string;
}
/**
 * The parts of `@lexical/history` this extension touches, declared here rather
 * than imported from it.
 *
 * `@lexical/history` depends on `@lexical/extension`, not the other way
 * around, and importing even a type across that boundary leaves
 * `@lexical/extension` with an undeclared dependency: anyone type-checking it
 * through its `source` export condition without `@lexical/history` installed
 * gets an unresolved import. History is an optional peer here — an editor
 * without it is restored just the same — so the shapes are described locally.
 * The unit tests assert that they still match the real ones.
 *
 * @internal
 */
export interface HMRHistoryStateEntry {
    editor: LexicalEditor;
    editorState: EditorState;
}
/** @internal See {@link HMRHistoryStateEntry}. */
export interface HMRHistoryState {
    current: null | HMRHistoryStateEntry;
    redoStack: HMRHistoryStateEntry[];
    undoStack: HMRHistoryStateEntry[];
}
/**
 * Preserves editor state, the selection, editability, and undo/redo history
 * across Hot Module Replacement (HMR) cycles. When `HistoryExtension` is
 * present as a peer, undo/redo stacks are preserved as well.
 *
 * Passing `hot: null` is a safe no-op, so `import.meta.hot ?? null` works
 * correctly in both development and production without a build-time
 * conditional. If a saved state cannot be parsed, the extension warns in dev
 * and falls back to `$initialEditorState` rather than throwing.
 *
 * Editor updates only stash a reference to the current `EditorState` (and to
 * the `HistoryState`, which `@lexical/history` mutates in place), so the
 * per-update cost does not grow with the size of the document or of the undo
 * stack. Everything is serialized once, by the module instance that replaces
 * this one, when it restores the saved state.
 *
 * The editor state and the history entries are serialized as one family rather
 * than one at a time, so that the nodes they shared come back shared and every
 * version of a node keeps answering to one key — see `editorStateFamily`. That
 * is what makes an undo after a reload a diff of what changed rather than a
 * rebuild of the document, and it is why the selection can be carried by key.
 *
 * @example
 * Basic usage
 * ```ts
 * import {buildEditorFromExtensions, configExtension, defineExtension, HMRExtension} from 'ui.lexical.extension';
 * import {RichTextExtension} from 'ui.lexical.rich-text';
 * import {HistoryExtension} from 'ui.lexical.history';
 *
 * const editor = buildEditorFromExtensions(
 *   defineExtension({
 *     name: '[root]',
 *     namespace: 'my-editor',
 *     dependencies: [
 *       RichTextExtension,
 *       HistoryExtension,
 *       configExtension(HMRExtension, {hot: import.meta.hot ?? null}),
 *     ],
 *   }),
 * );
 * ```
 *
 * @example
 * Multiple editors sharing an HMR context
 * Editors with distinct `namespace` values are isolated automatically. Only
 * add `id` when two editors share both the same `import.meta.hot` context
 * and the same `namespace`.
 * ```ts
 * // Different namespaces — automatic isolation, no `id` needed
 * defineExtension({ name: '[main]', namespace: 'main', dependencies: [configExtension(HMRExtension, {hot: import.meta.hot ?? null})] })
 * defineExtension({ name: '[sidebar]', namespace: 'sidebar', dependencies: [configExtension(HMRExtension, {hot: import.meta.hot ?? null})] })
 *
 * // Same namespace — use `id` to distinguish
 * defineExtension({ name: '[first]', namespace: 'shared', dependencies: [configExtension(HMRExtension, {hot: import.meta.hot ?? null, id: 'first'})] })
 * defineExtension({ name: '[second]', namespace: 'shared', dependencies: [configExtension(HMRExtension, {hot: import.meta.hot ?? null, id: 'second'})] })
 * ```
 *
 * Only the undo/redo entries this editor recorded are preserved. With
 * `SharedHistoryExtension` a nested editor pushes onto its parent's stacks, and
 * an entry can only be applied to the editor that recorded it — editors the
 * reload replaced, so those entries are left behind rather than re-pointed at
 * whichever editor happens to restore the history.
 *
 * A nested editor inherits its parent's namespace, so namespaces do not
 * isolate it from its parent: give it a distinct `id` (or its own
 * `namespace`), which is warned about in dev when both use HMRExtension.
 *
 * An editor that was given no `namespace` at all is keyed without one, because
 * the namespace `createEditor` generates for it is a fresh random string on
 * every reload — a key built from that would never match what the previous
 * instance saved. Such editors all share one key, so give each editor a
 * `namespace` (or an `id`) as soon as a page has more than one.
 *
 * Saved state belongs to the key for as long as the page lives, not to the
 * reload that produced it. An editor that is unmounted and later remounted
 * under the same key during development restores what the previous one had
 * rather than its own `$initialEditorState`, so two editors showing different
 * documents need distinct namespaces (or ids) even when they are never on
 * screen at the same time.
 */
export declare const HMRExtension: LexicalExtension<HMRConfig, "@lexical/extension/HMR", HMROutput, HMRInit>;
export {};
