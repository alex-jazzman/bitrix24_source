/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { EditorConfig } from 'ui.lexical.core';
import { ElementNode } from './LexicalElementNode';
/** @internal */
export declare class ArtificialNode__DO_NOT_USE extends ElementNode {
    $config(): import("ui.lexical.core").BaseStaticNodeConfig & {
        readonly artificial?: {
            readonly extends: typeof ElementNode;
        } | undefined;
    } & import("ui.lexical.core").StaticNodeTypeAccessor<"artificial"> & import("ui.lexical.core").StaticNodeConfigAccessor<{
        readonly extends: typeof ElementNode;
    }>;
    createDOM(config: EditorConfig): HTMLElement;
}
