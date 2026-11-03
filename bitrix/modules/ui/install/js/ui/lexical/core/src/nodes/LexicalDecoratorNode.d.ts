/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { KlassConstructor, LexicalEditor } from '../LexicalEditor';
import type { ElementNode } from './LexicalElementNode';
import type { EditorConfig } from 'ui.lexical.core';
import { LexicalNode, type NodeKey, type SlotChildNode, type SlotHostNode } from '../LexicalNode';
export interface DecoratorNode<T> {
    getTopLevelElement(): ElementNode | this | null;
    getTopLevelElementOrThrow(): ElementNode | this;
}
/** @noInheritDoc */
export declare class DecoratorNode<T> extends LexicalNode implements SlotHostNode, SlotChildNode {
    /** @internal */
    ['constructor']: KlassConstructor<typeof DecoratorNode<T>>;
    /** @internal */
    __slotHost: null | NodeKey;
    /** @internal */
    __slots: null | Map<string, NodeKey>;
    constructor(key?: NodeKey);
    afterCloneFrom(prevNode: this): void;
    /**
     * The returned value is added to the LexicalEditor._decorators
     */
    decorate(editor: LexicalEditor, config: EditorConfig): null | T;
    /**
     * Whether this decorator is isolated from caret interaction: an isolated
     * decorator can not be traversed, extended over, selected as a node, or
     * deleted by an adjacent caret operation. A caret that reaches one stops
     * there, so an inline isolated decorator is only reachable by pointer.
     *
     * Defaults to false, which lets the caret step over the decorator (and
     * select it, when {@link DecoratorNode.isKeyboardSelectable} is also true).
     */
    isIsolated(): boolean;
    isInline(): boolean;
    isKeyboardSelectable(): boolean;
}
/** Returns true if the given node is a DecoratorNode. */
export declare function $isDecoratorNode<T>(node: LexicalNode | null | undefined): node is DecoratorNode<T>;
