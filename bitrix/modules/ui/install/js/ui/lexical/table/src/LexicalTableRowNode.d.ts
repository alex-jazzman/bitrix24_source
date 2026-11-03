/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { type BaseSelection, type DOMConversionOutput, type EditorConfig, ElementNode, type LexicalNode, type LexicalUpdateJSON, type NodeKey, type SerializedElementNode, type Spread } from 'ui.lexical.core';
export type SerializedTableRowNode = Spread<{
    height?: number;
}, SerializedElementNode>;
/** @noInheritDoc */
export declare class TableRowNode extends ElementNode {
    /** @internal */
    __height?: number;
    $config(): import("ui.lexical.core").BaseStaticNodeConfig & {
        readonly tablerow?: {
            readonly extends: typeof ElementNode;
            readonly importDOM: {
                readonly tr: () => {
                    conversion: typeof $convertTableRowElement;
                    priority: 0;
                };
            };
        } | undefined;
    } & import("ui.lexical.core").StaticNodeTypeAccessor<"tablerow"> & import("ui.lexical.core").StaticNodeConfigAccessor<{
        readonly extends: typeof ElementNode;
        readonly importDOM: {
            readonly tr: () => {
                conversion: typeof $convertTableRowElement;
                priority: 0;
            };
        };
    }>;
    afterCloneFrom(prevNode: this): void;
    updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedTableRowNode>): this;
    constructor(height?: number | undefined, key?: NodeKey);
    exportJSON(): SerializedTableRowNode;
    createDOM(config: EditorConfig): HTMLElement;
    extractWithChild(child: LexicalNode, selection: BaseSelection | null, destination: 'clone' | 'html'): boolean;
    isShadowRoot(): boolean;
    setHeight(height?: number | undefined): this;
    getHeight(): number | undefined;
    updateDOM(prevNode: this): boolean;
    canBeEmpty(): false;
    canIndent(): false;
}
export declare function $convertTableRowElement(domNode: Node): DOMConversionOutput;
export declare function $createTableRowNode(height?: number): TableRowNode;
export declare function $isTableRowNode(node: LexicalNode | null | undefined): node is TableRowNode;
