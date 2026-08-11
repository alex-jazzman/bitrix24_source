/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { BaseSelection, LexicalNode, NodeKey, PointType } from 'ui.lexical.core';
import { TableCellNode } from './LexicalTableCellNode';
export type TableSelectionShape = {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
};
export type TableMapValueType = {
    cell: TableCellNode;
    startRow: number;
    startColumn: number;
};
export type TableMapType = Array<Array<TableMapValueType>>;
export declare class TableSelection implements BaseSelection {
    tableKey: NodeKey;
    anchor: PointType;
    focus: PointType;
    _cachedNodes: Array<LexicalNode> | null;
    dirty: boolean;
    constructor(tableKey: NodeKey, anchor: PointType, focus: PointType);
    getStartEndPoints(): [PointType, PointType];
    /**
     * Returns whether the Selection is "backwards", meaning the focus
     * logically precedes the anchor in the EditorState.
     * @returns true if the Selection is backwards, false otherwise.
     */
    isBackward(): boolean;
    getCachedNodes(): LexicalNode[] | null;
    setCachedNodes(nodes: LexicalNode[] | null): void;
    is(selection: null | BaseSelection): boolean;
    set(tableKey: NodeKey, anchorCellKey: NodeKey, focusCellKey: NodeKey): void;
    clone(): TableSelection;
    isCollapsed(): boolean;
    extract(): Array<LexicalNode>;
    insertRawText(text: string): void;
    insertText(): void;
    insertNodes(nodes: Array<LexicalNode>): void;
    getShape(): TableSelectionShape;
    getNodes(): Array<LexicalNode>;
    getTextContent(): string;
}
export declare function $isTableSelection(x: unknown): x is TableSelection;
export declare function $createTableSelection(): TableSelection;
export declare function $getChildrenRecursively(node: LexicalNode): Array<LexicalNode>;
