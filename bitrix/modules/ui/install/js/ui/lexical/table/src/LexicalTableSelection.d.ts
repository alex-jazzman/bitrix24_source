/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { type BaseSelection, type LexicalNode, type NodeKey, type PointType, type TextFormatType } from 'ui.lexical.core';
import { type TableCellNode } from './LexicalTableCellNode';
import { type TableNode } from './LexicalTableNode';
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
export type TableMapType = TableMapValueType[][];
export declare class TableSelection implements BaseSelection {
    tableKey: NodeKey;
    anchor: PointType;
    focus: PointType;
    _cachedNodes: LexicalNode[] | null;
    dirty: boolean;
    constructor(tableKey: NodeKey, anchor: PointType, focus: PointType);
    getStartEndPoints(): [PointType, PointType];
    /**
     * {@link $createTableSelection} unfortunately makes it very easy to create
     * nonsense selections, so we have a method to see if the selection probably
     * makes sense.
     *
     * @returns true if the TableSelection is (probably) valid
     */
    isValid(): boolean;
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
    extract(): LexicalNode[];
    insertRawText(text: string): void;
    insertText(): void;
    /**
     * Returns whether the provided TextFormatType is present on the Selection.
     * This will be true if any paragraph in table cells has the specified format.
     *
     * @param type the TextFormatType to check for.
     * @returns true if the provided format is currently toggled on the Selection, false otherwise.
     */
    hasFormat(type: TextFormatType): boolean;
    insertNodes(nodes: LexicalNode[]): void;
    /** @deprecated Use {@link $computeTableMap} and {@link $computeTableCellRectBoundary} directly. */
    getShape(): TableSelectionShape;
    getNodes(): LexicalNode[];
    getTextContent(): string;
}
/** Type guard for {@link TableSelection}. */
export declare function $isTableSelection(x: unknown): x is TableSelection;
/** @deprecated Use {@link $createTableSelectionFrom} instead. */
export declare function $createTableSelection(): TableSelection;
/**
 * Creates a {@link TableSelection} spanning from `anchorCell` to `focusCell`
 * within `tableNode`. In `__DEV__` mode, validates that both cells belong to
 * the given table and that the table is attached to the editor state.
 *
 * If the current selection is already a TableSelection, it clones and
 * re-targets it (preserving identity for dirty-checking); otherwise it
 * constructs a fresh one.
 */
export declare function $createTableSelectionFrom(tableNode: TableNode, anchorCell: TableCellNode, focusCell: TableCellNode): TableSelection;
/**
 * Depth first visitor
 * @param node The starting node
 * @param $visit The function to call for each node. If the function returns false, then children of this node will not be explored
 */
export declare function $visitRecursively(node: LexicalNode, $visit: (childNode: LexicalNode) => boolean | undefined | void): void;
