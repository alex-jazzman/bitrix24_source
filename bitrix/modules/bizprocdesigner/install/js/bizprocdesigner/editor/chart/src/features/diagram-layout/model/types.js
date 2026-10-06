/**
 * Shared contract of the diagram layout core: its immutable snapshot and result shape.
 *
 * The epsilon, the coordinate normalization and the numeric bound live here rather than in the
 * layout modules: every pass has to agree on them, and two copies would silently diverge.
 */

import { Type } from 'main.core';

import type { BlockId, BlockPosition, BlockType } from '../../../shared/types';

/** Positions closer than this are the same position for the automatic layout. */
export const POSITION_EPSILON = 0.01;

/**
 * Upper bound for every input and derived coordinate, size and sum. A quarter of the safe integer
 * range leaves room for adding two rectangles and their gaps without losing precision.
 */
export const MAX_SAFE_LAYOUT_VALUE = Number.MAX_SAFE_INTEGER / 4;

export const LAYOUT_STATUS = Object.freeze({
	ok: 'ok',
	applied: 'applied',
	unchanged: 'unchanged',
	rejected: 'rejected',
});

export const LAYOUT_UNCHANGED_REASON = Object.freeze({
	degenerateInput: 'degenerate-input',
	alreadyArranged: 'already-arranged',
	singleRigidFrame: 'single-rigid-frame',
});

export const LAYOUT_REJECTED_REASON = Object.freeze({
	invalidGraph: 'invalid-graph',
	unsafeGeometry: 'unsafe-geometry',
	invalidFrame: 'invalid-frame',
	groupOverlap: 'group-overlap',
	modelChanged: 'model-changed',
});

export type LayoutUnchangedReason = $Values<typeof LAYOUT_UNCHANGED_REASON>;
export type LayoutRejectedReason = $Values<typeof LAYOUT_REJECTED_REASON>;

export type LayoutRect = {
	+x: number,
	+y: number,
	+width: number,
	+height: number,
};

/** One entry of the canvas `blocksRectMap`. Untrusted: any field may be missing or not a number. */
export type MeasuredRect = {
	+x?: number,
	+y?: number,
	+width?: number,
	+height?: number,
};

/** The canvas `blocksRectMap` as it comes from the diagram composable. */
export type MeasuredBlocksGeometry = { +[blockId: string]: MeasuredRect | null | void };

export type LayoutBlock = {
	+id: BlockId,
	/** Position in the model order of `blocks`; the tiebreaker of every deterministic pass. */
	+index: number,
	+type: BlockType,
	+isFrame: boolean,
	/** Owning frame; null for a frame itself and for a block outside every frame. */
	+frameId: BlockId | null,
	/** Exact model position, never the stored `x`/`y` of a measurement. */
	+position: BlockPosition,
	/** Visual rectangle on the canvas: model position plus the resolved size. */
	+rect: LayoutRect,
};

/**
 * A frame with its members, or a single free block. Members keep their relative positions, so a
 * layout moves the whole group by one delta.
 */
export type PlacementGroup = {
	+index: number,
	+frameId: BlockId | null,
	/** Frame first (when the group has one), then members in model order. */
	+blockIds: $ReadOnlyArray<BlockId>,
	/** Union of the member rectangles. */
	+bounds: LayoutRect,
};

/** A validated connection reduced to its identity: `connection.id` carries no meaning here. */
export type LayoutEdge = {
	+sourceBlockId: BlockId,
	+sourcePortId: string,
	+targetBlockId: BlockId,
	+targetPortId: string,
};

export type LayoutSnapshot = {
	+blocks: $ReadOnlyArray<LayoutBlock>,
	+blockById: $ReadOnlyMap<BlockId, LayoutBlock>,
	+groups: $ReadOnlyArray<PlacementGroup>,
	+groupByBlockId: $ReadOnlyMap<BlockId, PlacementGroup>,
	/** Every validated connection, auxiliary and non-flow ones included. */
	+edges: $ReadOnlyArray<LayoutEdge>,
	/** Active main-flow subset without loops: ranking reads these. */
	+primaryEdges: $ReadOnlyArray<LayoutEdge>,
	/** Active tool attachments, oriented from the owner (`aux` port) to the tool (`topAux` one). */
	+auxEdges: $ReadOnlyArray<LayoutEdge>,
};

export type LayoutAppliedResult = {
	+status: typeof LAYOUT_STATUS.applied,
	+positions: $ReadOnlyMap<BlockId, BlockPosition>,
};

export type LayoutUnchangedResult = {
	+status: typeof LAYOUT_STATUS.unchanged,
	+reason: LayoutUnchangedReason,
};

export type LayoutRejectedResult = {
	+status: typeof LAYOUT_STATUS.rejected,
	+reason: LayoutRejectedReason,
};

export type LayoutResult = LayoutAppliedResult | LayoutUnchangedResult | LayoutRejectedResult;

export type LayoutSnapshotResult =
	| { +status: typeof LAYOUT_STATUS.ok, +snapshot: LayoutSnapshot }
	| LayoutRejectedResult;

export function layoutApplied(positions: $ReadOnlyMap<BlockId, BlockPosition>): LayoutAppliedResult
{
	return Object.freeze({ status: LAYOUT_STATUS.applied, positions });
}

export function layoutUnchanged(reason: LayoutUnchangedReason): LayoutUnchangedResult
{
	return Object.freeze({ status: LAYOUT_STATUS.unchanged, reason });
}

export function layoutRejected(reason: LayoutRejectedReason): LayoutRejectedResult
{
	return Object.freeze({ status: LAYOUT_STATUS.rejected, reason });
}

/** Every number the core stores has to pass this, input and derived alike. */
export function isSafeLayoutValue(value: mixed): boolean
{
	return Type.isNumber(value) && Number.isFinite(value) && Math.abs(value) <= MAX_SAFE_LAYOUT_VALUE;
}

/** Two hundredths of a canvas unit, with `-0` collapsed to `0` so results compare bitwise. */
export function normalizeCoordinate(value: number): number
{
	const normalized = Math.sign(value) * Math.round(Math.abs(value) * 100) / 100;

	return normalized === 0 ? 0 : normalized;
}
