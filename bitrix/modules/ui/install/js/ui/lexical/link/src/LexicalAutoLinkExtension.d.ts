/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { type ElementNode, type LexicalEditor } from 'ui.lexical.core';
import { type AutoLinkAttributes } from './LexicalLinkNode';
/**
 * A callback invoked when the auto-link plugin creates, updates, or removes an
 * automatic link. It receives the new `url` and the `prevUrl`; either may be
 * `null` when a link is added or removed.
 */
export type ChangeHandler = (url: string | null, prevUrl: string | null) => void;
export interface LinkMatcherResult {
    attributes?: AutoLinkAttributes;
    index: number;
    length: number;
    text: string;
    url: string;
}
/**
 * A function that inspects a piece of `text` and returns a
 * {@link LinkMatcherResult} for the first URL it recognizes, or `null` if none
 * is found. Used by the auto-link plugin to detect links as the user types.
 */
export type LinkMatcher = (text: string) => LinkMatcherResult | null;
/**
 * Builds a {@link LinkMatcher} from a regular expression. The matched text is
 * used as the link URL, optionally rewritten by `urlTransformer` (for example
 * to prepend a protocol). Pass the result to the auto-link plugin's `matchers`.
 *
 * @returns A matcher that reports the first match of `regExp` in the text.
 */
export declare function createLinkMatcherWithRegExp(regExp: RegExp, urlTransformer?: (text: string) => string): (text: string) => {
    index: number;
    length: number;
    text: string;
    url: string;
} | null;
/**
 * A ready-to-use {@link LinkMatcher} for URLs with full Unicode support
 * (`\\p{L}`, `\\p{N}`). Handles parenthesis balancing so that Wikipedia-style
 * URLs like `https://en.wikipedia.org/wiki/Fish_(disambiguation)` are matched
 * correctly even when wrapped in prose parentheses.
 */
export declare const autoLinkUrlMatcher: LinkMatcher;
/**
 * A ready-to-use {@link LinkMatcher} for email addresses. Bounded quantifiers
 * keep matching linear-time; the limits comfortably exceed RFC 5321 maximums.
 */
export declare const autoLinkEmailMatcher: LinkMatcher;
export interface AutoLinkConfig {
    changeHandlers: ChangeHandler[];
    excludeParents: ((parent: ElementNode) => boolean)[];
    matchers: LinkMatcher[];
    /**
     * The regular expression used to determine whether surrounding
     * characters count as separators when validating auto-link
     * boundaries. Defaults to `/[.,;\s]/`.
     */
    separatorRegex: RegExp;
}
export declare function registerAutoLink(editor: LexicalEditor, config?: Partial<AutoLinkConfig> & Omit<AutoLinkConfig, 'separatorRegex'>): () => void;
/**
 * An extension to automatically create AutoLinkNode from text
 * that matches the configured matchers. For ready-to-use matchers see
 * {@link autoLinkUrlMatcher} (Unicode URL detection with parenthesis
 * balancing) and {@link autoLinkEmailMatcher} (email addresses). To build
 * a custom matcher from a RegExp, see {@link createLinkMatcherWithRegExp}.
 *
 * The given `matchers` and `changeHandlers` will be merged by
 * concatenating the configured arrays.
 */
export declare const AutoLinkExtension: import("ui.lexical.core").LexicalExtension<AutoLinkConfig, "@lexical/link/AutoLink", unknown, unknown>;
