/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export interface TableConfig {
    /**
     * When `false` (default `true`), merged cell support (colspan and rowspan) will be disabled and all
     * tables will be forced into a regular grid with 1x1 table cells.
     */
    hasCellMerge: boolean;
    /**
     * When `false` (default `true`), the background color of TableCellNode will always be removed.
     */
    hasCellBackgroundColor: boolean;
    /**
     * When `true` (default `true`), the tab key can be used to navigate table cells.
     */
    hasTabHandler: boolean;
    /**
     * When `true` (default `true`), tables will be wrapped in a `<div>` to enable horizontal scrolling
     */
    hasHorizontalScroll: boolean;
    /**
     * When `true` (default `false`), a sticky scrollbar is rendered below each table that overflows horizontally.
     * Requires `hasHorizontalScroll` to be `true`. The native scrollbar is hidden via inline
     * `scrollbar-width: none` (Firefox/Chromium). Themed consumers providing a `tableScrollableWrapper`
     * class should also add `::-webkit-scrollbar { display: none }` for Safari/WebKit.
     * A themed scrollbar is expected to guarantee its own visible height (the
     * playground does this with `::-webkit-scrollbar { height: ... }`); the
     * unthemed fallback depends on classic native scrollbars, so on platforms
     * where those render with no thickness (overlay scrollbars, and non-layout
     * environments like jsdom) it is disabled at runtime and the wrapper's
     * native scrollbar is restored.
     */
    hasStickyScrollbar: boolean;
    /**
     * When `true` (default `false`), nested tables will be allowed.
     *
     * @experimental Nested tables are not officially supported.
     */
    hasNestedTables: boolean;
}
/**
 * Configures {@link TableNode}, {@link TableRowNode}, {@link TableCellNode} and
 * registers table behaviors (see {@link TableConfig})
 */
export declare const TableExtension: import("ui.lexical.core").LexicalExtension<TableConfig, "@lexical/table/Table", import("ui.lexical.extension").NamedSignalsOutput<TableConfig>, unknown>;
/**
 * Bundles {@link TableImportRules} together with the runtime
 * {@link TableExtension}.
 *
 * @experimental
 * @deprecated {@link TableExtension} now registers
 * {@link TableImportRules} (and `CoreImportExtension`) itself — depend on
 * it directly instead.
 */
export declare const TableImportExtension: import("ui.lexical.core").LexicalExtension<import("ui.lexical.core").ExtensionConfigBase, "@lexical/table/Import", unknown, unknown>;
