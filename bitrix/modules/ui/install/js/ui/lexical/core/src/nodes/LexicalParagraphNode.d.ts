/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { EditorConfig, KlassConstructor, LexicalEditor, Spread } from '../LexicalEditor';
import type { DOMConversionMap, DOMExportOutput, LexicalNode, NodeKey } from '../LexicalNode';
import type { SerializedElementNode } from './LexicalElementNode';
import type { RangeSelection } from 'ui.lexical.core';
import { ElementNode } from './LexicalElementNode';
import { TextFormatType } from './LexicalTextNode';
export type SerializedParagraphNode = Spread<{
    textFormat: number;
    textStyle: string;
}, SerializedElementNode>;
/** @noInheritDoc */
export declare class ParagraphNode extends ElementNode {
    ['constructor']: KlassConstructor<typeof ParagraphNode>;
    /** @internal */
    __textFormat: number;
    __textStyle: string;
    constructor(key?: NodeKey);
    static getType(): string;
    getTextFormat(): number;
    setTextFormat(type: number): this;
    hasTextFormat(type: TextFormatType): boolean;
    getTextStyle(): string;
    setTextStyle(style: string): this;
    static clone(node: ParagraphNode): ParagraphNode;
    afterCloneFrom(prevNode: this): void;
    createDOM(config: EditorConfig): HTMLElement;
    updateDOM(prevNode: ParagraphNode, dom: HTMLElement, config: EditorConfig): boolean;
    static importDOM(): DOMConversionMap | null;
    exportDOM(editor: LexicalEditor): DOMExportOutput;
    static importJSON(serializedNode: SerializedParagraphNode): ParagraphNode;
    exportJSON(): SerializedParagraphNode;
    insertNewAfter(rangeSelection: RangeSelection, restoreSelection: boolean): ParagraphNode;
    collapseAtStart(): boolean;
}
export declare function $createParagraphNode(): ParagraphNode;
export declare function $isParagraphNode(node: LexicalNode | null | undefined): node is ParagraphNode;
