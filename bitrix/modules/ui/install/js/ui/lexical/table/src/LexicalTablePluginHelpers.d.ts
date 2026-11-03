/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { TableConfig } from './LexicalTableExtension';
import { type NamedSignalsOutput } from 'ui.lexical.extension';
import { type LexicalEditor } from 'ui.lexical.core';
/**
 * Register a transform to ensure that all TableCellNode have a colSpan and rowSpan of 1.
 * This should only be registered when you do not want to support merged cells.
 *
 * @param editor The editor
 * @returns An unregister callback
 */
export declare function registerTableCellUnmergeTransform(editor: LexicalEditor): () => void;
export declare function registerTableSelectionObserver(editor: LexicalEditor, hasTabHandler?: boolean): () => void;
/**
 * Register table command listeners and the table integrity transforms. The
 * table selection observer should be registered separately after this with
 * {@link registerTableSelectionObserver}.
 *
 * @param editor The editor
 * @returns An unregister callback
 */
export declare function registerTablePlugin(editor: LexicalEditor, options?: Pick<NamedSignalsOutput<TableConfig>, 'hasNestedTables'>): () => void;
