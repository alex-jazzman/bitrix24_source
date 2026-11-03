/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { type LexicalEditor, type NodeKey, type TextFormatType } from 'ui.lexical.core';
import { type TableCellNode } from './LexicalTableCellNode';
import { type TableNode } from './LexicalTableNode';
import { type TableSelection } from './LexicalTableSelection';
import { type HTMLTableElementWithWithTableSelectionState } from './LexicalTableSelectionHelpers';
export type TableDOMCell = {
    elem: HTMLElement;
    highlighted: boolean;
    hasBackgroundColor: boolean;
    x: number;
    y: number;
};
export type TableDOMRows = ((TableDOMCell | undefined)[] | undefined)[];
export type TableDOMTable = {
    domRows: TableDOMRows;
    columns: number;
    rows: number;
};
export declare function $getTableAndElementByKey(tableNodeKey: NodeKey, editor?: LexicalEditor): {
    tableNode: TableNode;
    tableElement: HTMLTableElementWithWithTableSelectionState;
};
export type TableNextFocus = {
    tableKey: NodeKey;
    focusCell: TableDOMCell;
    override: boolean;
};
/**
 * Tracks table selection state that sits across all tables.
 */
export declare class TableObservers {
    observers: Map<NodeKey, [
        TableObserver,
        HTMLTableElementWithWithTableSelectionState
    ]>;
    nextFocus: TableNextFocus | null;
    shouldCheckSelectionForTable: NodeKey | null;
    constructor();
    /**
     * @internal
     * When handling mousemove events we track what the focus cell should be, but
     * the DOM selection may end up somewhere else entirely. We don't have an elegant
     * way to handle this after the DOM selection has been resolved in a
     * SELECTION_CHANGE_COMMAND callback.
     */
    setNextFocus(nextFocus: TableNextFocus | null): void;
    /** @internal */
    getAndClearNextFocus(): TableNextFocus | null;
    /**
     * @internal
     * Firefox has a strange behavior where pressing the down arrow key from
     * above the table will move the caret after the table and then lexical
     * will select the last cell instead of the first.
     * We do still want to let the browser handle caret movement but we will
     * use this property to "tag" the update so that we can recheck the
     * selection after the event is processed.
     */
    setShouldCheckSelectionForTable(tableKey: NodeKey): void;
    /**
     * @internal
     */
    getAndClearShouldCheckSelectionForTable(): NodeKey | null;
    /**
     * @internal
     * Remove the observer for tableKey from the registry and unregister all
     * of its listeners, e.g. because the table was removed from the document
     * or its DOM was recreated.
     *
     * @returns true if an observer was registered for tableKey
     */
    removeObserver(tableKey: NodeKey): boolean;
    /**
     * @internal
     * Remove all observers from the registry and unregister their listeners,
     * e.g. because the table selection observer is being unregistered.
     */
    removeAllObservers(): void;
    /**
     * @internal
     * Get a snapshot of the registry as [TableNode, TableObserver] pairs for
     * the current editor state. A table's destroyed mutation can be missed
     * entirely (e.g. when it is removed during an update while the editor's
     * root element is detached), so any entry whose table no longer exists
     * is removed from the registry instead of being returned, otherwise such
     * an entry would poison the registry and break every subsequent
     * selection change.
     *
     * Must be called within an editor read or update.
     */
    $getTableNodesAndObservers(): [TableNode, TableObserver][];
}
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
    /**
     * Whether the pointer gesture currently in progress has travelled beyond
     * the tap slop box, i.e. it is a drag rather than a tap. Only a drag may
     * start a table selection from touch input. Set by the pointermove handler
     * and reset whenever the gesture ends.
     */
    isPointerDrag: boolean;
    /**
     * The cell the pointer gesture currently in progress started on, null when
     * no gesture is in progress. A drag that never leaves this cell is
     * selecting text within it, not selecting cells.
     */
    pointerStartCell: TableDOMCell | null;
    pointerType: string | null;
    abortController: AbortController;
    listenerOptions: {
        signal: AbortSignal;
    };
    constructor(editor: LexicalEditor, tableNodeKey: string);
    getTable(): TableDOMTable;
    removeListeners(): void;
    $lookup(): {
        tableNode: TableNode;
        tableElement: HTMLTableElementWithWithTableSelectionState;
    };
    trackTable(): void;
    $clearHighlight(setEmptySelection?: boolean): void;
    $enableHighlightStyle(): void;
    $disableHighlightStyle(): void;
    $updateTableTableSelection(selection: TableSelection | null): void;
    /** @internal */
    updateDOMSelection(): void;
    $setFocusCellForSelection(cell: TableDOMCell, ignoreStart?: boolean): boolean;
    $getAnchorTableCell(): TableCellNode | null;
    $getAnchorTableCellOrThrow(): TableCellNode;
    $getFocusTableCell(): TableCellNode | null;
    $getFocusTableCellOrThrow(): TableCellNode;
    $setAnchorCellForSelection(cell: TableDOMCell): void;
    $formatCells(type: TextFormatType): void;
    $clearText(): void;
}
