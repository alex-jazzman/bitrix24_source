/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { type RangeSelection, type TextNode } from '.';
export declare function $normalizeTextNode(textNode: TextNode): void;
/** Descends element-type anchor and focus points of a RangeSelection toward the deepest text-type points, stopping at non-element leaf nodes. */
export declare function $normalizeSelection(selection: RangeSelection): RangeSelection;
