/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { TableCellNode } from './LexicalTableCellNode';
import type { TableNode } from './LexicalTableNode';
import type { TableDOMCell } from './LexicalTableObserver';
import type { TableSelection } from './LexicalTableSelection';
import type { LexicalEditor, LexicalNode, RangeSelection } from 'ui.lexical.core';
import { TableDOMTable, TableObserver } from './LexicalTableObserver';
declare const LEXICAL_ELEMENT_KEY = "__lexicalTableSelection";
export declare const getDOMSelection: (targetWindow: Window | null) => Selection | null;
export declare function applyTableHandlers(tableNode: TableNode, tableElement: HTMLTableElementWithWithTableSelectionState, editor: LexicalEditor, hasTabHandler: boolean): TableObserver;
export type HTMLTableElementWithWithTableSelectionState = HTMLTableElement & Record<typeof LEXICAL_ELEMENT_KEY, TableObserver>;
export declare function attachTableObserverToTableElement(tableElement: HTMLTableElementWithWithTableSelectionState, tableObserver: TableObserver): void;
export declare function getTableObserverFromTableElement(tableElement: HTMLTableElementWithWithTableSelectionState): TableObserver | null;
export declare function getDOMCellFromTarget(node: Node): TableDOMCell | null;
export declare function doesTargetContainText(node: Node): boolean;
export declare function getTable(tableElement: HTMLElement): TableDOMTable;
export declare function $updateDOMForSelection(editor: LexicalEditor, table: TableDOMTable, selection: TableSelection | RangeSelection | null): void;
export declare function $forEachTableCell(grid: TableDOMTable, cb: (cell: TableDOMCell, lexicalNode: LexicalNode, cords: {
    x: number;
    y: number;
}) => void): void;
export declare function $addHighlightStyleToTable(editor: LexicalEditor, tableSelection: TableObserver): void;
export declare function $removeHighlightStyleToTable(editor: LexicalEditor, tableObserver: TableObserver): void;
export declare function $findCellNode(node: LexicalNode): null | TableCellNode;
export declare function $findTableNode(node: LexicalNode): null | TableNode;
export {};
