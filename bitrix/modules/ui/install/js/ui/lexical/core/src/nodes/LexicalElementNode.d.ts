/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { NodeKey, SerializedLexicalNode } from '../LexicalNode';
import type { BaseSelection, RangeSelection } from '../LexicalSelection';
import type { KlassConstructor, Spread } from 'ui.lexical.core';
import { TextNode } from '../index';
import { LexicalNode } from '../LexicalNode';
export type SerializedElementNode<T extends SerializedLexicalNode = SerializedLexicalNode> = Spread<{
    children: Array<T>;
    direction: 'ltr' | 'rtl' | null;
    format: ElementFormatType;
    indent: number;
}, SerializedLexicalNode>;
export type ElementFormatType = 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
export interface ElementNode {
    getTopLevelElement(): ElementNode | null;
    getTopLevelElementOrThrow(): ElementNode;
}
/** @noInheritDoc */
export declare class ElementNode extends LexicalNode {
    ['constructor']: KlassConstructor<typeof ElementNode>;
    /** @internal */
    __first: null | NodeKey;
    /** @internal */
    __last: null | NodeKey;
    /** @internal */
    __size: number;
    /** @internal */
    __format: number;
    /** @internal */
    __style: string;
    /** @internal */
    __indent: number;
    /** @internal */
    __dir: 'ltr' | 'rtl' | null;
    constructor(key?: NodeKey);
    afterCloneFrom(prevNode: this): void;
    getFormat(): number;
    getFormatType(): ElementFormatType;
    getStyle(): string;
    getIndent(): number;
    getChildren<T extends LexicalNode>(): Array<T>;
    getChildrenKeys(): Array<NodeKey>;
    getChildrenSize(): number;
    isEmpty(): boolean;
    isDirty(): boolean;
    isLastChild(): boolean;
    getAllTextNodes(): Array<TextNode>;
    getFirstDescendant<T extends LexicalNode>(): null | T;
    getLastDescendant<T extends LexicalNode>(): null | T;
    getDescendantByIndex<T extends LexicalNode>(index: number): null | T;
    getFirstChild<T extends LexicalNode>(): null | T;
    getFirstChildOrThrow<T extends LexicalNode>(): T;
    getLastChild<T extends LexicalNode>(): null | T;
    getLastChildOrThrow<T extends LexicalNode>(): T;
    getChildAtIndex<T extends LexicalNode>(index: number): null | T;
    getTextContent(): string;
    getTextContentSize(): number;
    getDirection(): 'ltr' | 'rtl' | null;
    hasFormat(type: ElementFormatType): boolean;
    select(_anchorOffset?: number, _focusOffset?: number): RangeSelection;
    selectStart(): RangeSelection;
    selectEnd(): RangeSelection;
    clear(): this;
    append(...nodesToAppend: LexicalNode[]): this;
    setDirection(direction: 'ltr' | 'rtl' | null): this;
    setFormat(type: ElementFormatType): this;
    setStyle(style: string): this;
    setIndent(indentLevel: number): this;
    splice(start: number, deleteCount: number, nodesToInsert: Array<LexicalNode>): this;
    exportJSON(): SerializedElementNode;
    insertNewAfter(selection: RangeSelection, restoreSelection?: boolean): null | LexicalNode;
    canIndent(): boolean;
    collapseAtStart(selection: RangeSelection): boolean;
    excludeFromCopy(destination?: 'clone' | 'html'): boolean;
    /** @deprecated @internal */
    canReplaceWith(replacement: LexicalNode): boolean;
    /** @deprecated @internal */
    canInsertAfter(node: LexicalNode): boolean;
    canBeEmpty(): boolean;
    canInsertTextBefore(): boolean;
    canInsertTextAfter(): boolean;
    isInline(): boolean;
    isShadowRoot(): boolean;
    /** @deprecated @internal */
    canMergeWith(node: ElementNode): boolean;
    extractWithChild(child: LexicalNode, selection: BaseSelection | null, destination: 'clone' | 'html'): boolean;
    /**
     * Determines whether this node, when empty, can merge with a first block
     * of nodes being inserted.
     *
     * This method is specifically called in {@link RangeSelection.insertNodes}
     * to determine merging behavior during nodes insertion.
     *
     * @example
     * // In a ListItemNode or QuoteNode implementation:
     * canMergeWhenEmpty(): true {
     *  return true;
     * }
     */
    canMergeWhenEmpty(): boolean;
}
export declare function $isElementNode(node: LexicalNode | null | undefined): node is ElementNode;
