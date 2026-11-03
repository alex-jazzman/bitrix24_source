/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { type ChildSchema } from 'ui.lexical.html';
/**
 * A {@link ChildSchema} that enforces ListNode invariants: only
 * `ListItemNode` and (immediately-nested) `ListNode` children are
 * accepted; runs of other children get wrapped in a fresh
 * `ListItemNode`.
 *
 * @experimental
 */
export declare const ListSchema: ChildSchema;
/**
 * Import rules for {@link ListNode} and {@link ListItemNode}, including
 * GitHub task-list and Joplin checkbox heuristics.
 *
 * Registered by {@link ListExtension} itself (together with
 * `CoreImportExtension`), so any editor that uses the list extension can
 * import these tags through the `DOMImportExtension` pipeline without
 * further configuration.
 *
 * @experimental
 */
export declare const ListImportRules: (import("ui.lexical.html").DOMImportRule<import("ui.lexical.html").ElementSelectorBuilder<HTMLOListElement | HTMLUListElement, Record<string, never>>> | import("ui.lexical.html").DOMImportRule<import("ui.lexical.html").ElementSelectorBuilder<HTMLLIElement, Record<string, never>>>)[];
