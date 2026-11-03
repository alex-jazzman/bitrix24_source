/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { InsertTableCommandPayloadHeaders } from '.';
import type { TableDOMTable } from './LexicalTableObserver';
import { type LexicalNode, type PointType, type RangeSelection } from 'ui.lexical.core';
import { TableCellNode } from './LexicalTableCellNode';
import { type TableNode } from './LexicalTableNode';
import { type TableRowNode } from './LexicalTableRowNode';
import { type TableMapType, type TableMapValueType, type TableSelection } from './LexicalTableSelection';
export declare function $createTableNodeWithDimensions(rowCount: number, columnCount: number, includeHeaders?: InsertTableCommandPayloadHeaders): TableNode;
export declare function $getTableCellNodeFromLexicalNode(startingNode: LexicalNode): TableCellNode | null;
export declare function $getTableRowNodeFromTableCellNodeOrThrow(startingNode: LexicalNode): TableRowNode;
export declare function $getTableNodeFromLexicalNodeOrThrow(startingNode: LexicalNode): TableNode;
export declare function $getTableRowIndexFromTableCellNode(tableCellNode: TableCellNode): number;
export declare function $getTableColumnIndexFromTableCellNode(tableCellNode: TableCellNode): number;
export type TableCellSiblings = {
    above: TableCellNode | null | undefined;
    below: TableCellNode | null | undefined;
    left: TableCellNode | null | undefined;
    right: TableCellNode | null | undefined;
};
export declare function $getTableCellSiblingsFromTableCellNode(tableCellNode: TableCellNode, table: TableDOMTable): TableCellSiblings;
export declare function $removeTableRowAtIndex(tableNode: TableNode, indexToDelete: number): TableNode;
/**
 * @deprecated This function does not support merged cells. Use {@link $insertTableRowAtSelection} or {@link $insertTableRowAtNode} instead.
 */
export declare function $insertTableRow(tableNode: TableNode, targetIndex: number, shouldInsertAfter: boolean | undefined, rowCount: number, table: TableDOMTable): TableNode;
/**
 * Inserts a table row before or after the current focus cell node,
 * taking into account any spans. If successful, returns the
 * inserted table row node.
 */
export declare function $insertTableRowAtSelection(insertAfter?: boolean): TableRowNode | null;
/**
 * @deprecated renamed to {@link $insertTableRowAtSelection}
 */
export declare const $insertTableRow__EXPERIMENTAL: typeof $insertTableRowAtSelection;
/**
 * Inserts a table row before or after the given cell node,
 * taking into account any spans. If successful, returns the
 * inserted table row node.
 */
export declare function $insertTableRowAtNode(cellNode: TableCellNode, insertAfter?: boolean): TableRowNode | null;
/**
 * @deprecated This function does not support merged cells. Use {@link $insertTableColumnAtSelection} or {@link $insertTableColumnAtNode} instead.
 */
export declare function $insertTableColumn(tableNode: TableNode, targetIndex: number, shouldInsertAfter: boolean | undefined, columnCount: number, table: TableDOMTable): TableNode;
/**
 * Inserts a column before or after the current focus cell node,
 * taking into account any spans. If successful, returns the
 * first inserted cell node.
 */
export declare function $insertTableColumnAtSelection(insertAfter?: boolean): TableCellNode | null;
/**
 * @deprecated renamed to {@link $insertTableColumnAtSelection}
 */
export declare const $insertTableColumn__EXPERIMENTAL: typeof $insertTableColumnAtSelection;
/**
 * Inserts a column before or after the given cell node,
 * taking into account any spans. If successful, returns the
 * first inserted cell node.
 */
export declare function $insertTableColumnAtNode(cellNode: TableCellNode, insertAfter?: boolean, shouldSetSelection?: boolean): TableCellNode | null;
/**
 * @deprecated This function does not support merged cells. Use {@link $deleteTableColumnAtSelection} instead.
 */
export declare function $deleteTableColumn(tableNode: TableNode, targetIndex: number): TableNode;
export declare function $deleteTableRowAtSelection(): void;
/**
 * @deprecated renamed to {@link $deleteTableRowAtSelection}
 */
export declare const $deleteTableRow__EXPERIMENTAL: typeof $deleteTableRowAtSelection;
export declare function $deleteTableColumnAtSelection(): void;
/**
 * @deprecated renamed to {@link $deleteTableColumnAtSelection}
 */
export declare const $deleteTableColumn__EXPERIMENTAL: typeof $deleteTableColumnAtSelection;
export declare function $mergeCells(cellNodes: TableCellNode[]): TableCellNode | null;
export declare function $unmergeCell(): void;
/**
 * Unmerges the given cell, splitting it back into individual cells.
 * Unlike {@link $unmergeCell}, this does not depend on the current
 * selection. No-op if the cell is not merged.
 *
 * @param cellNode The merged cell to split.
 */
export declare function $unmergeCellNode(cellNode: TableCellNode): void;
export declare function $computeTableMap(tableNode: TableNode, cellA: TableCellNode, cellB: TableCellNode): [TableMapType, TableMapValueType, TableMapValueType];
export declare function $computeTableMapSkipCellCheck(tableNode: TableNode, cellA: null | TableCellNode, cellB: null | TableCellNode): [
    tableMap: TableMapType,
    cellAValue: TableMapValueType | null,
    cellBValue: TableMapValueType | null
];
export declare function $getNodeTriplet(source: PointType | LexicalNode | TableCellNode): [TableCellNode, TableRowNode, TableNode];
export interface TableCellRectBoundary {
    minColumn: number;
    minRow: number;
    maxColumn: number;
    maxRow: number;
}
export interface TableCellRectSpans {
    topSpan: number;
    leftSpan: number;
    rightSpan: number;
    bottomSpan: number;
}
export declare function $computeTableCellRectSpans(map: TableMapType, boundary: TableCellRectBoundary): TableCellRectSpans;
/**
 * Compute the bounding rectangle of two table cells in a table map,
 * expanding iteratively to include any merged cells that overlap the boundary.
 */
export declare function $computeTableCellRectBoundary(map: TableMapType, cellAMap: TableMapValueType, cellBMap: TableMapValueType): TableCellRectBoundary;
/**
 * Checks if the table does not have any merged cells.
 *
 * @param table Table to check for if it has any merged cells.
 * @returns True if the table does not have any merged cells, false otherwise.
 */
export declare function $isSimpleTable(table: TableNode): boolean;
/**
 * Moves a column from one position to another within a simple (non-merged) table.
 *
 * @param tableNode The table node to modify.
 * @param originColumn The index of the column to move.
 * @param targetColumn The index to move the column to.
 */
export declare function $moveTableColumn(tableNode: TableNode, originColumn: number, targetColumn: number): void;
/**
 * Moves a row from one position to another within a simple (non-merged) table.
 *
 * @param tableNode The table node to modify.
 * @param originRow The index of the row to move.
 * @param targetRow The index to move the row to.
 */
export declare function $moveTableRow(tableNode: TableNode, originRow: number, targetRow: number): void;
export declare function $getTableCellNodeRect(tableCellNode: TableCellNode): {
    rowIndex: number;
    columnIndex: number;
    rowSpan: number;
    colSpan: number;
} | null;
export declare function $insertTableIntoGrid(tableNode: TableNode, selection: RangeSelection | TableSelection): boolean;
export declare function $setTableRowIsHeader(tableNode: TableNode, rowIndex: number, isHeader: boolean): void;
export declare function $setTableColumnIsHeader(tableNode: TableNode, columnIndex: number, isHeader: boolean): void;
