/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { type ReadonlySignal } from 'ui.lexical.extension';
import { type DOMConversionOutput, type DOMExportOutput, type EditorConfig, ElementNode, type LexicalCommand, type LexicalEditor, type LexicalNode, type LexicalUpdateJSON, type NodeKey, type ParagraphNode, type RangeSelection, type SerializedElementNode, type Spread, type TextFormatType } from 'ui.lexical.core';
export type SerializedHeadingNode = Spread<{
    tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}, SerializedElementNode>;
export declare const DRAG_DROP_PASTE: LexicalCommand<File[]>;
export type SerializedQuoteNode = Spread<{
    /**
     * Present (and `true`) only when the quote has opted in to shadow
     * root behavior via {@link QuoteNode.setIsShadowRoot} or
     * `$createQuoteNode({shadowRoot: true})`. Omitted otherwise, so the
     * serialization of quotes that have not opted in is unchanged.
     */
    shadowRoot?: boolean;
}, SerializedElementNode>;
/**
 * Opt-in state for {@link QuoteNode.isShadowRoot}. When `true`, the quote
 * behaves like a multi-block region (similar to a table cell): it holds
 * block-level children (paragraphs, headings, ...) instead of inline
 * content, which allows more faithful HTML and Markdown import/export of
 * `<blockquote>` content. Defaults to `false`, in which case there is no
 * change to the legacy behavior (and nothing extra is serialized).
 */
export declare const quoteShadowRootState: import("ui.lexical.core").StateConfig<"shadowRoot", boolean>;
/** @noInheritDoc */
export declare class QuoteNode extends ElementNode {
    $config(): import("ui.lexical.core").BaseStaticNodeConfig & {
        readonly quote?: {
            readonly extends: typeof ElementNode;
            readonly importDOM: {
                readonly blockquote: () => {
                    conversion: typeof $convertBlockquoteElement;
                    priority: 0;
                };
            };
            readonly stateConfigs: readonly [{
                readonly flat: true;
                readonly stateConfig: import("ui.lexical.core").StateConfig<"shadowRoot", boolean>;
            }];
        } | undefined;
    } & import("ui.lexical.core").StaticNodeTypeAccessor<"quote"> & import("ui.lexical.core").StaticNodeConfigAccessor<{
        readonly extends: typeof ElementNode;
        readonly importDOM: {
            readonly blockquote: () => {
                conversion: typeof $convertBlockquoteElement;
                priority: 0;
            };
        };
        readonly stateConfigs: readonly [{
            readonly flat: true;
            readonly stateConfig: import("ui.lexical.core").StateConfig<"shadowRoot", boolean>;
        }];
    }>;
    /**
     * `true` when this quote has opted in to shadow root behavior with
     * {@link setIsShadowRoot} or `$createQuoteNode({shadowRoot: true})`,
     * in which case it contains block-level children rather than inline
     * content. `false` (the legacy inline-content behavior) by default.
     */
    isShadowRoot(): boolean;
    /**
     * Opt this quote in to (or out of) shadow root behavior. See
     * {@link quoteShadowRootState}. Note that this does not restructure any
     * existing children; a shadow root quote is expected to contain
     * block-level children (non-element children will be normalized into
     * paragraphs by the built-in shadow root transform).
     */
    setIsShadowRoot(isShadowRoot: boolean): this;
    createDOM(config: EditorConfig): HTMLElement;
    updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean;
    exportDOM(editor: LexicalEditor): DOMExportOutput;
    exportJSON(): SerializedQuoteNode;
    static importJSON(serializedNode: SerializedQuoteNode): QuoteNode;
    insertNewAfter(rangeSelection: RangeSelection, restoreSelection?: boolean): ParagraphNode;
    collapseAtStart(): true;
    canMergeWhenEmpty(): true;
}
export declare function $createQuoteNode(options?: {
    /**
     * When `true` the quote opts in to shadow root behavior
     * (see {@link quoteShadowRootState}). Defaults to `false`.
     */
    shadowRoot?: boolean;
}): QuoteNode;
export declare function $isQuoteNode(node: LexicalNode | null | undefined): node is QuoteNode;
export type HeadingTagType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
/** @noInheritDoc */
export declare class HeadingNode extends ElementNode {
    /** @internal */
    __tag: HeadingTagType;
    $config(): import("ui.lexical.core").BaseStaticNodeConfig & {
        readonly heading?: {
            readonly extends: typeof ElementNode;
            readonly importDOM: {
                readonly h1: () => {
                    conversion: typeof $convertHeadingElement;
                    priority: 0;
                };
                readonly h2: () => {
                    conversion: typeof $convertHeadingElement;
                    priority: 0;
                };
                readonly h3: () => {
                    conversion: typeof $convertHeadingElement;
                    priority: 0;
                };
                readonly h4: () => {
                    conversion: typeof $convertHeadingElement;
                    priority: 0;
                };
                readonly h5: () => {
                    conversion: typeof $convertHeadingElement;
                    priority: 0;
                };
                readonly h6: () => {
                    conversion: typeof $convertHeadingElement;
                    priority: 0;
                };
                readonly p: (node: Node) => {
                    conversion: () => {
                        node: null;
                    };
                    priority: 3;
                } | null;
                readonly span: (node: Node) => {
                    conversion: () => {
                        node: HeadingNode;
                    };
                    priority: 3;
                } | null;
            };
        } | undefined;
    } & import("ui.lexical.core").StaticNodeTypeAccessor<"heading"> & import("ui.lexical.core").StaticNodeConfigAccessor<{
        readonly extends: typeof ElementNode;
        readonly importDOM: {
            readonly h1: () => {
                conversion: typeof $convertHeadingElement;
                priority: 0;
            };
            readonly h2: () => {
                conversion: typeof $convertHeadingElement;
                priority: 0;
            };
            readonly h3: () => {
                conversion: typeof $convertHeadingElement;
                priority: 0;
            };
            readonly h4: () => {
                conversion: typeof $convertHeadingElement;
                priority: 0;
            };
            readonly h5: () => {
                conversion: typeof $convertHeadingElement;
                priority: 0;
            };
            readonly h6: () => {
                conversion: typeof $convertHeadingElement;
                priority: 0;
            };
            readonly p: (node: Node) => {
                conversion: () => {
                    node: null;
                };
                priority: 3;
            } | null;
            readonly span: (node: Node) => {
                conversion: () => {
                    node: HeadingNode;
                };
                priority: 3;
            } | null;
        };
    }>;
    afterCloneFrom(prevNode: this): void;
    constructor(tag?: HeadingTagType, key?: NodeKey);
    getTag(): HeadingTagType;
    setTag(tag: HeadingTagType): this;
    createDOM(config: EditorConfig): HTMLElement;
    updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean;
    exportDOM(editor: LexicalEditor): DOMExportOutput;
    updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedHeadingNode>): this;
    exportJSON(): SerializedHeadingNode;
    insertNewAfter(selection?: RangeSelection, restoreSelection?: boolean): ParagraphNode | HeadingNode;
    collapseAtStart(): true;
    extractWithChild(): boolean;
}
declare function $convertHeadingElement(element: HTMLElement): DOMConversionOutput;
declare function $convertBlockquoteElement(element: HTMLElement): DOMConversionOutput;
export declare function $createHeadingNode(headingTag?: HeadingTagType): HeadingNode;
export declare function $isHeadingNode(node: LexicalNode | null | undefined): node is HeadingNode;
export { eventFiles } from 'ui.lexical.utils';
/**
 * Trigger types that cause format escape at text node boundaries.
 * - `enter`: Escape on Enter key press
 * - `click`: Escape on mouse click
 * - `arrow`: Escape on arrow key navigation (left/right)
 * - `space`: Escape on Space key press
 * - `tab`: Escape on Tab key press
 */
export type EscapeFormatTrigger = 'enter' | 'click' | 'arrow' | 'space' | 'tab';
/**
 * Trigger flags for a single format type. Set a trigger key to `true` to
 * escape that format when the corresponding user interaction occurs.
 *
 * When `onlyAtBoundary` is `true`, the format is only escaped when the cursor
 * is at the start or end of a formatted text node with no adjacent sibling in
 * that direction. When `onlyAtBoundary` is `false` or omitted the format is
 * always escaped regardless of cursor position (matching the legacy
 * `$resetCapitalization` behavior).
 */
export type TriggerConfig = {
    [K in EscapeFormatTrigger]?: boolean;
} & {
    onlyAtBoundary?: boolean;
};
/**
 * Per-format trigger configuration. Each {@link TextFormatType} maps to its
 * own set of triggers, or `null` to explicitly disable escape for that format
 * (useful when overriding defaults via `configExtension`).
 */
export type EscapeFormatTriggerConfig = {
    [K in TextFormatType]?: TriggerConfig | null;
};
/**
 * Decides whether a paste event carrying files should be handled by
 * dispatching {@link DRAG_DROP_PASTE} with those files, rather than falling
 * through to the regular HTML paste handling.
 *
 * @param files - The files present on the clipboard, if any
 * @param hasTextContent - Whether the clipboard also carries text/html or
 * text/plain content
 */
export type ShouldHandlePasteAsFiles = (files: File[], hasTextContent: boolean) => boolean;
/**
 * The historical behavior: files are only handled when the clipboard carries
 * no text content at all. Note that browsers put a text/html fallback on the
 * clipboard alongside the file when an image is copied via the context menu,
 * so this default routes such images through the HTML importer.
 */
export declare function defaultShouldHandlePasteAsFiles(files: File[], hasTextContent: boolean): boolean;
export declare function registerRichText(editor: LexicalEditor, escapeFormatTriggers?: ReadonlySignal<EscapeFormatTriggerConfig>, shouldHandlePasteAsFiles?: ReadonlySignal<ShouldHandlePasteAsFiles>): () => void;
export { HeadingAnnounceExtension, type HeadingAnnounceExtensionConfig, } from './HeadingAnnounceExtension';
export { type RichTextConfig, RichTextExtension, RichTextImportExtension, } from './LexicalRichTextExtension';
export { RichTextImportRules, ShadowRootQuoteRule, } from './RichTextImportExtension';
