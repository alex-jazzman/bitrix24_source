/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { TableCellNode } from './LexicalTableCellNode';
import type { DOMConversionMap, DOMConversionOutput, DOMExportOutput, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedElementNode } from 'ui.lexical.core';
import { ElementNode } from 'ui.lexical.core';
import { TableDOMCell, TableDOMTable } from './LexicalTableObserver';
export type SerializedTableNode = SerializedElementNode;
/** @noInheritDoc */
export declare class TableNode extends ElementNode {
    static getType(): string;
    static clone(node: TableNode): TableNode;
    static importDOM(): DOMConversionMap | null;
    static importJSON(_serializedNode: SerializedTableNode): TableNode;
    constructor(key?: NodeKey);
    exportJSON(): SerializedElementNode;
    createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement;
    updateDOM(): boolean;
    exportDOM(editor: LexicalEditor): DOMExportOutput;
    canBeEmpty(): false;
    isShadowRoot(): boolean;
    getCordsFromCellNode(tableCellNode: TableCellNode, table: TableDOMTable): {
        x: number;
        y: number;
    };
    getDOMCellFromCords(x: number, y: number, table: TableDOMTable): null | TableDOMCell;
    getDOMCellFromCordsOrThrow(x: number, y: number, table: TableDOMTable): TableDOMCell;
    getCellNodeFromCords(x: number, y: number, table: TableDOMTable): null | TableCellNode;
    getCellNodeFromCordsOrThrow(x: number, y: number, table: TableDOMTable): TableCellNode;
    canSelectBefore(): true;
    canIndent(): false;
}
export declare function $getElementForTableNode(editor: LexicalEditor, tableNode: TableNode): TableDOMTable;
export declare function $convertTableElement(_domNode: Node): DOMConversionOutput;
export declare function $createTableNode(): TableNode;
export declare function $isTableNode(node: LexicalNode | null | undefined): node is TableNode;
