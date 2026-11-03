/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
/** Whether a browser DOM environment is available. */
export declare const CAN_USE_DOM: boolean;
declare global {
    interface Document {
        documentMode?: unknown;
    }
    interface Window {
        MSStream?: unknown;
    }
}
/** Whether the current platform is Apple (macOS, iOS, iPadOS, iPod). */
export declare const IS_APPLE: boolean;
/** Whether the current browser is Firefox (excludes SeaMonkey). */
export declare const IS_FIREFOX: boolean;
/** Whether the browser supports the `beforeinput` event via `InputEvent.getTargetRanges()`. */
export declare const CAN_USE_BEFORE_INPUT: boolean;
/** Whether the current platform is iOS or iPadOS (iPhone, iPad, iPod). */
export declare const IS_IOS: boolean;
/** Whether the current platform is Android. */
export declare const IS_ANDROID: boolean;
/** Whether the current browser is Safari (excludes Android WebView which has a similar UA string). */
export declare const IS_SAFARI: boolean;
/** Whether the current browser is Chrome (or Chromium-based). */
export declare const IS_CHROME: boolean;
/** Whether the current browser is Chrome on Android. */
export declare const IS_ANDROID_CHROME: boolean;
/** Whether the current browser is Apple WebKit (Safari on macOS/iOS, excludes Chrome). */
export declare const IS_APPLE_WEBKIT: boolean;
