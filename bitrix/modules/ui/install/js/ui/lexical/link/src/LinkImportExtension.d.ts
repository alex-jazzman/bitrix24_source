/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
/**
 * Import rules for {@link LinkNode}.
 *
 * Registered by {@link LinkExtension} itself (together with
 * `CoreImportExtension`), so any editor that uses the link extension can
 * import `<a>` through the `DOMImportExtension` pipeline without further
 * configuration.
 *
 * @experimental
 */
export declare const LinkImportRules: import("ui.lexical.html").DOMImportRule<import("ui.lexical.html").ElementSelectorBuilder<HTMLAnchorElement, Record<string, never>>>[];
