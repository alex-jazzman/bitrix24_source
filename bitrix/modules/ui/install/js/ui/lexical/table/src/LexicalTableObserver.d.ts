/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { LexicalEditor, NodeKey, TextFormatType } from 'ui.lexical.core';
import { type TableSelection } from './LexicalTableSelection';
export type TableDOMCell = {
    elem: HTMLElement;
    highlighted: boolean;
    hasBackgroundColor: boolean;
    x: number;
    y: number;
};
export type TableDOMRows = Array<Array<TableDOMCell | undefined> | undefined>;
export type TableDOMTable = {
    domRows: TableDOMRows;
    columns: number;
    rows: number;
};
export declare class TableObserver {
    focusX: number;
    focusY: number;
    listenersToRemove: Set<() => void>;
    table: TableDOMTable;
    isHighlightingCells: boolean;
    anchorX: number;
    anchorY: number;
    tableNodeKey: NodeKey;
    anchorCell: TableDOMCell | null;
    focusCell: TableDOMCell | null;
    anchorCellNodeKey: NodeKey | null;
    focusCellNodeKey: NodeKey | null;
    editor: LexicalEditor;
    tableSelection: TableSelection | null;
    hasHijackedSelectionStyles: boolean;
    isSelecting: boolean;
    constructor(editor: LexicalEditor, tableNodeKey: string);
    getTable(): TableDOMTable;
    removeListeners(): void;
    trackTable(): void;
    clearHighlight(): void;
    enableHighlightStyle(): void;
    disableHighlightStyle(): void;
    updateTableTableSelection(selection: TableSelection | null): void;
    setFocusCellForSelection(cell: TableDOMCell, ignoreStart?: boolean): void;
    setAnchorCellForSelection(cell: TableDOMCell): void;
    formatCells(type: TextFormatType): void;
    clearText(): void;
}
