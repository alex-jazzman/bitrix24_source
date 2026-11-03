/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { TableDOMCell, TableDOMTable } from './LexicalTableObserver';
import { type BaseSelection, type DOMConversionOutput, type DOMExportOutput, type EditorConfig, type ElementDOMSlot, ElementNode, type LexicalEditor, type LexicalNode, type LexicalUpdateJSON, type SerializedElementNode, type Spread } from 'ui.lexical.core';
import { type TableCellNode } from './LexicalTableCellNode';
export type SerializedTableNode = Spread<{
    colWidths?: readonly number[];
    rowStriping?: boolean;
    frozenColumnCount?: number;
    frozenRowCount?: number;
}, SerializedElementNode>;
export interface StickyScrollbarElements {
    scrollable: HTMLDivElement;
    scrollbar: HTMLDivElement;
    tableElement: HTMLTableElement;
}
export declare function attachStickyScrollbarListeners(elements: StickyScrollbarElements): () => void;
export declare function syncStickyScrollbar(scrollable: HTMLDivElement, scrollbar: HTMLDivElement): void;
export declare function findStickyScrollbarElements(dom: HTMLElement): StickyScrollbarElements | null;
export declare function $isScrollableTablesActive(editor?: LexicalEditor): boolean;
export declare function $isStickyScrollbarActive(editor?: LexicalEditor): boolean;
export declare function setScrollableTablesActive(editor: LexicalEditor, active: boolean): void;
/** @noInheritDoc */
export declare class TableNode extends ElementNode {
    /** @internal */
    __rowStriping: boolean;
    __frozenColumnCount: number;
    __frozenRowCount: number;
    __colWidths: readonly number[] | undefined;
    $config(): import("ui.lexical.core").BaseStaticNodeConfig & {
        readonly table?: {
            readonly extends: typeof ElementNode;
            readonly importDOM: {
                readonly table: () => {
                    conversion: typeof $convertTableElement;
                    priority: 1;
                };
            };
        } | undefined;
    } & import("ui.lexical.core").StaticNodeTypeAccessor<"table"> & import("ui.lexical.core").StaticNodeConfigAccessor<{
        readonly extends: typeof ElementNode;
        readonly importDOM: {
            readonly table: () => {
                conversion: typeof $convertTableElement;
                priority: 1;
            };
        };
    }>;
    getColWidths(): readonly number[] | undefined;
    setColWidths(colWidths: readonly number[] | undefined): this;
    afterCloneFrom(prevNode: this): void;
    updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedTableNode>): this;
    exportJSON(): SerializedTableNode;
    extractWithChild(child: LexicalNode, selection: BaseSelection | null, destination: 'clone' | 'html'): boolean;
    getDOMSlot(element: HTMLElement): ElementDOMSlot<HTMLTableElement>;
    createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement;
    updateTableWrapper(prevNode: this | null, tableWrapper: HTMLDivElement, tableElement: HTMLTableElement, config: EditorConfig): void;
    updateTableElement(prevNode: this | null, tableElement: HTMLTableElement, config: EditorConfig): void;
    updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean;
    scaleDOMColWidths(dom: HTMLElement, scale: number): void;
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
    getRowStriping(): boolean;
    setRowStriping(newRowStriping: boolean): this;
    setFrozenColumns(columnCount: number): this;
    getFrozenColumns(): number;
    setFrozenRows(rowCount: number): this;
    getFrozenRows(): number;
    canSelectBefore(): true;
    canIndent(): false;
    getColumnCount(): number;
}
export declare function $getElementForTableNode(editor: LexicalEditor, tableNode: TableNode): TableDOMTable;
export declare function $convertTableElement(domNode: HTMLElement): DOMConversionOutput;
export declare function $createTableNode(): TableNode;
export declare function $isTableNode(node: LexicalNode | null | undefined): node is TableNode;
