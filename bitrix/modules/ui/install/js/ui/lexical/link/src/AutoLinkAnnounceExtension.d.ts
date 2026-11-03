/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export interface AutoLinkAnnounceExtensionConfig {
    /** Announced when typing turns text into a link. */
    created: string;
    /**
     * Announced when several links appear at once, as pasting a block of text
     * can. `%s` is replaced with how many.
     */
    createdMany: string;
    /** Announced when an automatic link stops being a link. */
    destroyed: string;
    /**
     * Announced when several links go at once, as deleting a selection that
     * spans them does. `%s` is replaced with how many.
     */
    destroyedMany: string;
    /**
     * When `true`, automatic links are not announced. Toggle at runtime via the
     * output signal. Default `false`.
     */
    disabled: boolean;
}
/**
 * Announces automatic links through the {@link AriaLiveRegionExtension} sink.
 *
 * Typing a web address turns it into a link on its own, partway through typing
 * it, with no keystroke to confirm and nothing inserted. A screen reader says
 * nothing, so the user has no way to know a link now exists.
 *
 * A creation paired with a destruction in the same update is not announced.
 * Every keystroke that extends an address rebuilds the link — the old node
 * destroyed and a new one created at once — so announcing every creation would
 * say "Link" at `www.example.c`, again at `o`, and again at `m`. Only a
 * creation on its own is a link that was not there a moment ago.
 */
export declare const AutoLinkAnnounceExtension: import("ui.lexical.core").LexicalExtension<AutoLinkAnnounceExtensionConfig, "@lexical/link/AutoLinkAnnounce", import("ui.lexical.extension").NamedSignalsOutput<AutoLinkAnnounceExtensionConfig>, unknown>;
