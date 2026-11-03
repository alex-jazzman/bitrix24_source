/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { type EditorState, type LexicalEditor, type NodeKey, type SerializedLexicalNode } from 'ui.lexical.core';
/**
 * A family of EditorStates is a set of versions of one document — the current
 * state of an editor and the entries of its undo and redo stacks, say.
 *
 * Serializing each of those states on its own (with `toJSON()`) and parsing
 * each one back (with `parseEditorState`) is lossy in two ways that matter:
 *
 * - **Structural sharing is lost.** Lexical clones only the nodes an update
 *   touches, so consecutive versions of a document share nearly all of their
 *   node objects. Independently parsed states share none, so the restored
 *   history costs memory proportional to its depth times the size of the
 *   document, where the original cost the size of the document plus its edits.
 * - **Key stability is lost.** `parseEditorState` mints a fresh NodeKey for
 *   every node, so independently parsed versions have disjoint key spaces.
 *   Reconciliation is a diff over NodeKeys, so undoing to such a state rebuilds
 *   the whole DOM and remounts every decorator instead of touching what
 *   actually changed.
 *
 * This module serializes a family as one payload instead: a table of the
 * distinct node *versions* across all of the states (a node that several
 * states share appears once), plus, per state, the list of versions its node
 * map is built from. Restoring rebuilds each version once and assembles the
 * node maps from those shared objects, so both properties survive: a node that
 * two states shared before is one object in both again, and every version of a
 * node answers to the same key.
 *
 * The payload is plain data — no `LexicalNode`s, no class references — so it
 * can be handed to another instance of the same module, which is what makes it
 * usable across a hot reload that replaced the node classes.
 *
 * @internal
 */
export interface SerializedEditorStateFamily {
    /** Every distinct node version across the family, in no particular order. */
    nodes: SerializedNodeVersion[];
    /** One entry per state, in the order the states were given. */
    states: SerializedFamilyState[];
}
/**
 * One version of one node: its own serialized form, with the tree links kept
 * beside it rather than nested. `exportJSON()` describes a node's own data and
 * leaves `children` empty — the recursive walk lives in `EditorState.toJSON`,
 * not in the node — and every link Lexical stores is a NodeKey, so a version
 * can be described, and restored, without touching any other node.
 */
interface SerializedNodeVersion {
    json: SerializedLexicalNode;
    key: NodeKey;
    parent: null | NodeKey;
    prev: null | NodeKey;
    next: null | NodeKey;
    /** Elements only. */
    first?: null | NodeKey;
    last?: null | NodeKey;
    size?: number;
    /** Slot hosts only. */
    slots?: [string, NodeKey][];
    /** Slot children only: the up-link that takes the place of `parent`. */
    slotHost?: null | NodeKey;
}
interface SerializedFamilyPoint {
    key: NodeKey;
    offset: number;
    type: 'element' | 'text';
}
type SerializedFamilySelection = {
    anchor: SerializedFamilyPoint;
    focus: SerializedFamilyPoint;
    format: number;
    style: string;
    type: 'range';
} | {
    keys: NodeKey[];
    type: 'node';
};
interface SerializedFamilyState {
    /** Indices into {@link SerializedEditorStateFamily.nodes}. */
    nodes: number[];
    selection: SerializedFamilySelection | null;
}
/**
 * Serializes `states` into a single payload of plain data, sharing one node
 * table across all of them.
 *
 * @internal
 */
export declare function serializeEditorStateFamily(states: readonly EditorState[]): SerializedEditorStateFamily;
/**
 * Whether `raw` is a payload this build can rebuild.
 *
 * Checked field by field rather than at the surface: the payload comes from
 * whichever build of this module wrote it, and one that describes a node
 * version or a selection differently would otherwise be found out partway
 * through rebuilding, where a throw costs the caller the whole document
 * instead of being reported as a payload it cannot read.
 *
 * @internal
 */
export declare function isSerializedEditorStateFamily(raw: unknown): raw is SerializedEditorStateFamily;
/**
 * Rebuilds the states of a family for `editor`, preserving the sharing and the
 * key relationships they had when they were serialized.
 *
 * The keys are new ones minted by this editor rather than the keys the
 * previous editor used — what matters is that every version of a node, in
 * every state, answers to the *same* key, and freshly minted keys cannot
 * collide with the keys this editor goes on to mint.
 *
 * Returns one entry per state, in the order they were serialized. A state
 * whose nodes cannot all be rebuilt — a node class the new editor no longer
 * registers, say — comes back as `null` rather than failing the whole family.
 *
 * The states come back with `_parsed` false, like the live states they
 * reproduce. A caller that hydrates one of them into an editor — where the
 * node classes are seeing this JSON for the first time — should set the flag
 * on that one state, so that `setEditorState` normalizes it. Leaving it set on
 * the others would make every `setEditorState` of them (each undo into a
 * history entry, over and over) dirty-mark the whole document and re-run every
 * transform on it.
 *
 * @internal
 */
export declare function deserializeEditorStateFamily(family: SerializedEditorStateFamily, editor: LexicalEditor): (EditorState | null)[];
export {};
