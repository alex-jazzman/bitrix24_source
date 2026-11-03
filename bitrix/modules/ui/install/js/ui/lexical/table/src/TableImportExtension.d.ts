/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { type ChildSchema } from 'ui.lexical.html';
/**
 * A {@link ChildSchema} that enforces TableNode invariants: only
 * `TableRowNode` children are accepted; orphan `TableCellNode` runs are
 * wrapped in a synthesized row.
 *
 * @experimental
 */
export declare const TableSchema: ChildSchema;
/**
 * A {@link ChildSchema} that enforces TableRowNode invariants: only
 * `TableCellNode` children are accepted; non-cell children are dropped
 * (the legacy converter does the same via `$descendantsMatching`).
 *
 * @experimental
 */
export declare const TableRowSchema: ChildSchema;
/**
 * Import rules for {@link TableNode}, {@link TableRowNode}, and
 * {@link TableCellNode}.
 *
 * Registered by {@link TableExtension} itself (together with
 * `CoreImportExtension`), so any editor that uses the table extension can
 * import these tags through the `DOMImportExtension` pipeline without
 * further configuration.
 *
 * @experimental
 */
export declare const TableImportRules: (import("ui.lexical.html").DOMImportRule<import("ui.lexical.html").ElementSelectorBuilder<HTMLTableElement, Record<string, never>>> | import("ui.lexical.html").DOMImportRule<import("ui.lexical.html").ElementSelectorBuilder<HTMLTableCellElement, Record<string, never>>> | import("ui.lexical.html").DOMImportRule<import("ui.lexical.html").ElementSelectorBuilder<HTMLTableRowElement, Record<string, never>>>)[];
