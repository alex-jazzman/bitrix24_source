/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { type EditorState, type LexicalEditor, type LexicalNode, type RangeSelection } from 'ui.lexical.core';
import { type TableCellNode } from './LexicalTableCellNode';
import { type TableNode } from './LexicalTableNode';
import { type TableDOMCell, type TableDOMTable, TableObserver, type TableObservers } from './LexicalTableObserver';
import { type TableSelection } from './LexicalTableSelection';
declare const LEXICAL_ELEMENT_KEY = "__lexicalTableSelection";
export declare function isHTMLTableElement(el: unknown): el is HTMLTableElement;
export declare function getTableElement<T extends HTMLElement | null>(tableNode: TableNode, dom: T): HTMLTableElementWithWithTableSelectionState | (T & null);
export declare function getEditorWindow(editor: LexicalEditor): Window | null;
export declare function $findParentTableCellNodeInTable(tableNode: LexicalNode, node: LexicalNode | null): TableCellNode | null;
export declare function registerTableWindowHandlers(editor: LexicalEditor, tableObservers: TableObservers): () => void;
export declare function applyTableHandlers(tableNode: TableNode, element: HTMLElement, editor: LexicalEditor, hasTabHandler: boolean, tableObservers: TableObservers): TableObserver;
/** @internal */
export declare function $handleTableSelectionChangeCommand(tableObservers: TableObservers, editor: LexicalEditor): boolean;
export type HTMLTableElementWithWithTableSelectionState = HTMLTableElement & {
    [LEXICAL_ELEMENT_KEY]?: TableObserver | undefined;
};
export declare function detachTableObserverFromTableElement(tableElement: HTMLTableElementWithWithTableSelectionState, tableObserver: TableObserver): void;
export declare function attachTableObserverToTableElement(tableElement: HTMLTableElementWithWithTableSelectionState, tableObserver: TableObserver): void;
export declare function getTableObserverFromTableElement(tableElement: HTMLTableElementWithWithTableSelectionState): TableObserver | null;
export declare function getDOMCellFromTarget(node: null | Node): TableDOMCell | null;
export declare function getDOMCellInTableFromTarget(table: HTMLTableElementWithWithTableSelectionState, node: null | Node): TableDOMCell | null;
export declare function doesTargetContainText(node: Node): boolean;
export declare function getTable(tableNode: TableNode, dom: HTMLElement): TableDOMTable;
export declare function $updateDOMForSelection(editor: LexicalEditor, table: TableDOMTable, selection: TableSelection | RangeSelection | null): void;
export declare function $forEachTableCell(grid: TableDOMTable, cb: (cell: TableDOMCell, lexicalNode: LexicalNode, cords: {
    x: number;
    y: number;
}) => void): void;
export declare function $addHighlightStyleToTable(editor: LexicalEditor, tableSelection: TableObserver): void;
export declare function $removeHighlightStyleToTable(editor: LexicalEditor, tableObserver: TableObserver): void;
export declare function $findCellNode(node: LexicalNode): null | TableCellNode;
export declare function $findTableNode(node: LexicalNode): null | TableNode;
export declare function $getObserverCellFromCellNodeOrThrow(tableObserver: TableObserver, tableCellNode: TableCellNode): TableDOMCell;
export declare function $getNearestTableCellInTableFromDOMNode(tableNode: TableNode, startingDOM: Node, editorState?: EditorState): TableCellNode | null;
export {};
