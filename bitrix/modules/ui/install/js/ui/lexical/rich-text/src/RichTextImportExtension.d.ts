/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
/**
 * Opt-in replacement for the default `<blockquote>` rule that imports the
 * quote as a shadow root {@link QuoteNode} (see `quoteShadowRootState`).
 * Block-level children such as `<p>` are preserved as blocks and runs of
 * inline content are wrapped in paragraphs (`BlockSchema`), so structured
 * blockquote HTML round-trips faithfully instead of being flattened to
 * inline content.
 *
 * Not part of {@link RichTextImportRules}; without it `<blockquote>`
 * import behavior is unchanged. To opt in, contribute it from somewhere
 * that outranks {@link RichTextImportRules} in the compiled rule list —
 * either directly to the editor builder:
 * ```ts
 * buildEditorFromExtensions(
 *   MyExtension,
 *   configExtension(DOMImportExtension, {rules: [ShadowRootQuoteRule]}),
 * )
 * ```
 * or from an extension that depends on {@link RichTextExtension}:
 * ```ts
 * defineExtension({
 *   dependencies: [
 *     RichTextExtension,
 *     configExtension(DOMImportExtension, {rules: [ShadowRootQuoteRule]}),
 *   ],
 *   name: '@app/quotes',
 * })
 * ```
 * Either way the contribution is merged after rich-text's and therefore
 * prepended in front of it, so this rule is reached first and shadows the
 * default `@lexical/rich-text/blockquote` rule.
 *
 * @experimental
 */
export declare const ShadowRootQuoteRule: import("ui.lexical.html").DOMImportRule<import("ui.lexical.html").ElementSelectorBuilder<HTMLQuoteElement, Record<string, never>>>;
/**
 * Import rules for {@link HeadingNode} and {@link QuoteNode}, including
 * the Google Docs title heuristic that the legacy `HeadingNode.importDOM`
 * declared. This whole array is contributed by {@link RichTextExtension},
 * which depends on `CoreImportExtension`, so it is prepended in front of
 * {@link CoreImportRules}: the Google-Docs `<p>` / `<span>` rules here are
 * reached before the generic `<p>` and `<span>` rules from core, and defer
 * to them via `$next()` when the Google-Docs heuristic doesn't match.
 *
 * Registered by {@link RichTextExtension} itself (together with
 * `CoreImportExtension`), so any editor that uses the rich-text
 * extension can import these tags through the `DOMImportExtension`
 * pipeline without further configuration.
 *
 * @experimental
 */
export declare const RichTextImportRules: import("ui.lexical.html").DOMImportRule<import("ui.lexical.html").ElementSelectorBuilder<HTMLSpanElement, Record<string, never>>>[];
