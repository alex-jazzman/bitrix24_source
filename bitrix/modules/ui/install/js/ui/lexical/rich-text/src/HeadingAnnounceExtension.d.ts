/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export interface HeadingAnnounceExtensionConfig {
    /**
     * Announced when a block becomes a heading. `%s` is replaced with the
     * level (1-6).
     */
    created: string;
    /**
     * Announced when a heading stops being a heading. `%s` is replaced with the
     * level it was.
     */
    destroyed: string;
    /**
     * When `true`, headings are not announced. Toggle at runtime via the output
     * signal. Default `false`.
     */
    disabled: boolean;
}
/**
 * Announces headings through the {@link AriaLiveRegionExtension} sink: a block
 * becoming a heading, and a heading ceasing to be one.
 *
 * The markdown shortcut consumes both keystrokes (`#` then space) and swaps the
 * block type, which is silent to a screen reader — so without this the user has
 * no way to know the transformation happened, or to confirm the level without
 * navigating out of the block and back in.
 *
 * Only those two transitions announce. Typing inside a heading, moving the
 * caret through it, and deleting text while the heading survives are all
 * silent; announcing on every keystroke would make a heading impossible to type
 * into.
 *
 * A destroyed node is gone from the current editor state, so its level is read
 * from the previous state `registerMutationListener` provides.
 */
export declare const HeadingAnnounceExtension: import("ui.lexical.core").LexicalExtension<HeadingAnnounceExtensionConfig, "@lexical/rich-text/HeadingAnnounce", import("ui.lexical.extension").NamedSignalsOutput<HeadingAnnounceExtensionConfig>, unknown>;
