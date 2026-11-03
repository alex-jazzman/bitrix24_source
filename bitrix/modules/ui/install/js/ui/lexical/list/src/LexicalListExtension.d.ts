/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export interface ListConfig {
    /**
     * When `true`, enforces strict indentation rules for list items, ensuring consistent structure.
     * When `false` (default), indentation is more flexible.
     */
    hasStrictIndent: boolean;
    shouldPreserveNumbering: boolean;
}
/**
 * Configures {@link ListNode}, {@link ListItemNode} and registers
 * the strict indent transform if `hasStrictIndent` is true (default false).
 */
export declare const ListExtension: import("ui.lexical.core").LexicalExtension<ListConfig, "@lexical/list/List", import("ui.lexical.extension").NamedSignalsOutput<ListConfig>, unknown>;
export interface CheckListConfig {
    disableTakeFocusOnClick: boolean;
}
/**
 * Registers checklist functionality for {@link ListNode} and
 * {@link ListItemNode} with a `INSERT_CHECK_LIST_COMMAND` listener and
 * the expected keyboard and mouse interactions for checkboxes.
 */
export declare const CheckListExtension: import("ui.lexical.core").LexicalExtension<CheckListConfig, "@lexical/list/CheckList", import("ui.lexical.extension").NamedSignalsOutput<CheckListConfig>, unknown>;
/**
 * Bundles {@link ListImportRules} together with the runtime
 * {@link ListExtension}.
 *
 * @experimental
 * @deprecated {@link ListExtension} now registers
 * {@link ListImportRules} (and `CoreImportExtension`) itself — depend on
 * it directly instead.
 */
export declare const ListImportExtension: import("ui.lexical.core").LexicalExtension<import("ui.lexical.core").ExtensionConfigBase, "@lexical/list/Import", unknown, unknown>;
