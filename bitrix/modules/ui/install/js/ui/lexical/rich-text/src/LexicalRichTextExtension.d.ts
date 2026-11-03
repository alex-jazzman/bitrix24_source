/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { type EscapeFormatTriggerConfig, type ShouldHandlePasteAsFiles } from './index';
/**
 * Configuration for {@link RichTextExtension}.
 *
 * @property escapeFormatTriggers - Per-format trigger configuration that
 *   controls which text formats are automatically cleared from the selection
 *   on specific user interactions.
 *
 *   Defaults to:
 *   ```ts
 *   {
 *     capitalize: {enter: true, space: true, tab: true},
 *     lowercase: {enter: true, space: true, tab: true},
 *     uppercase: {enter: true, space: true, tab: true},
 *   }
 *   ```
 *
 *   To opt in to escaping `code` formatting at text node boundaries:
 *   ```ts
 *   configExtension(RichTextExtension, {
 *     escapeFormatTriggers: {
 *       code: {onlyAtBoundary: true, enter: true, click: true, arrow: true},
 *     },
 *   })
 *   ```
 */
export interface RichTextConfig {
    escapeFormatTriggers: EscapeFormatTriggerConfig;
    shouldHandlePasteAsFiles: ShouldHandlePasteAsFiles;
}
export declare const RichTextExtension: import("ui.lexical.core").LexicalExtension<RichTextConfig, "@lexical/rich-text", import("ui.lexical.extension").NamedSignalsOutput<RichTextConfig>, unknown>;
/**
 * Bundles {@link RichTextImportRules} together with the runtime
 * {@link RichTextExtension}.
 *
 * @experimental
 * @deprecated {@link RichTextExtension} now registers
 * {@link RichTextImportRules} (and `CoreImportExtension`) itself —
 * depend on it directly instead.
 */
export declare const RichTextImportExtension: import("ui.lexical.core").LexicalExtension<import("ui.lexical.core").ExtensionConfigBase, "@lexical/rich-text/Import", unknown, unknown>;
