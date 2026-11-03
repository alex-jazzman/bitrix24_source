/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { type LexicalEditor } from 'ui.lexical.core';
export interface NestedEditorConfig {
    $getParentEditor: () => LexicalEditor;
    inheritEditableFromParent: boolean;
}
export declare const NestedEditorExtension: import("ui.lexical.core").LexicalExtension<NestedEditorConfig, "@lexical/extension/NestedEditor", import("./namedSignals").NamedSignalsOutput<{
    inheritEditableFromParent: boolean;
}>, void>;
