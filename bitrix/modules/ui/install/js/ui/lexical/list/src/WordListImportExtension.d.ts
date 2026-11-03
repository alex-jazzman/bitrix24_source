/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
/**
 * Word list paste support for {@link ListNode}: opt in by adding this to
 * an editor's dependencies. {@link ListExtension} does not depend on it,
 * so an editor that never pastes from Word does not bundle any of it.
 *
 * ```ts
 * defineExtension({
 *   dependencies: [WordListImportExtension],
 *   name: 'my-editor',
 * });
 * ```
 *
 * @experimental
 */
export declare const WordListImportExtension: import("ui.lexical.core").LexicalExtension<import("ui.lexical.core").ExtensionConfigBase, "@lexical/list/WordListImport", unknown, unknown>;
