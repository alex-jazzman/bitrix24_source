// Kept in JS on purpose: chef takes the package language from the entry point (src/index.js), so a
// lone .ts source inside this extension would not resolve.
import { toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { modelBlockRect, shouldRetainGeometry, toRectBounds } from '../utils';
import type { RectBounds } from '../utils';
import type { DiagramBlock, DiagramBlockId } from '../types';

export type GroupableArea = RectBounds;

export type UseGroupable = {
	isGroupableBlock: (blockId: DiagramBlockId) => boolean,
	hasGroupableBlock: (blockIds: DiagramBlockId[]) => boolean,
	captureContainedBlockIds: (container: DiagramBlock) => DiagramBlockId[],
	registerGroupableBlock: () => void,
	unregisterGroupableBlock: () => void,
};

// Alt asks the gesture to leave the content of a container behind, so the container travels alone.
// It is answered from the press event and only from it: the set of a gesture is fixed at the press,
// so a key pressed or released later changes nothing, and the keyboard state of the diagram is not
// consulted - a frame of the autoscroll loop has no event of its own, and there is nothing for it to
// decide anyway.
export function isCaptureCancelModifier(event: MouseEvent | null): boolean
{
	return event?.altKey === true;
}

function modelRect(block: DiagramBlock): GroupableArea | null
{
	const source = toValue(block);
	const rect = modelBlockRect(toValue(source?.position), toValue(source?.dimensions));

	return rect === null ? null : toRectBounds(rect);
}

// The record of a container lives as long as the block lives in the model, not as long as its
// component stays mounted: culling unmounts a block that keeps its record, so a block that left the
// model while unmounted has no other way out of the registry. Called from the props watcher, right
// where the selection is trimmed against the model by the very same rule.
export function pruneGroupableBlocks(groupableBlockIds, blockIdsInModel): void
{
	const registered = toValue(groupableBlockIds) ?? null;
	const modelIds = toValue(blockIdsInModel) ?? null;

	if (registered === null || modelIds === null)
	{
		return;
	}

	for (const blockId of registered)
	{
		if (!modelIds.has(blockId))
		{
			registered.delete(blockId);
		}
	}
}

// `enabled` is what the wrapper of a block answers to a consumer flag: while it is false the block
// is not written into the registry, so an empty registry keeps the diagram exactly as it was before
// this feature.
export function useGroupable(
	block: DiagramBlock | null = null,
	enabled: boolean = true,
): UseGroupable
{
	const {
		groupableBlockIds,
		blockIntersections,
		blockIdsInModel,
		isRenderOptimizationAvailable,
	} = useBlockDiagram();

	function getOwnBlockId(): DiagramBlockId | null
	{
		return toValue(block)?.id ?? null;
	}

	// The node gesture asks this on every press, and it also runs over state a consumer raised
	// itself - state that may predate the registry. No registry means no containers, which is the
	// diagram exactly as it was before this feature.
	function isGroupableBlock(blockId: DiagramBlockId): boolean
	{
		return toValue(groupableBlockIds)?.has(blockId) === true;
	}

	// A container among the participants is what the raise of a drag is for: a gesture leading
	// ordinary nodes alone leaves the canvas as flat as it is today. An empty registry never answers
	// yes, so the rule lives here, beside the registry itself.
	function hasGroupableBlock(blockIds: DiagramBlockId[]): boolean
	{
		return blockIds.some((blockId) => isGroupableBlock(blockId));
	}

	// A block the model does not have is no part of the diagram: the same markup also mounts outside
	// the canvas - a consumer drags a preview of a block from its catalog - and the registry belongs
	// to the whole application. By the time a block of the diagram mounts the model already has it,
	// so the answer here is the state of the model, not a race with it.
	function registerGroupableBlock(): void
	{
		const blockId = getOwnBlockId();

		if (blockId === null)
		{
			return;
		}

		// A mount is the whole declaration of the block, so one that says "no container" takes back
		// the record of an earlier one. Under render optimization the record outlives the component
		// on purpose, and the watcher of the flag goes with that component: a flag switched off
		// while the block was culled has nothing else to answer it.
		if (toValue(enabled) !== true)
		{
			toValue(groupableBlockIds)?.delete(blockId);

			return;
		}

		if (toValue(blockIdsInModel)?.has(blockId) !== true)
		{
			return;
		}

		toValue(groupableBlockIds)?.add(blockId);
	}

	function unregisterGroupableBlock(): void
	{
		const blockId = getOwnBlockId();

		if (blockId === null)
		{
			return;
		}

		// Culling unmounts an offscreen block while it stays in the model, and a frame carried off
		// the screen has to keep carrying its content: the record goes only with the block itself.
		// A block that is no longer a container is another matter - there the record has nothing to
		// wait for and goes at once, whether the block is on screen or not.
		const retain = toValue(enabled) === true && shouldRetainGeometry(
			toValue(isRenderOptimizationAvailable),
			toValue(blockIdsInModel),
			blockId,
		);

		if (retain)
		{
			return;
		}

		toValue(groupableBlockIds)?.delete(blockId);
	}

	function searchArea(area: GroupableArea): DiagramBlock[]
	{
		return blockIntersections.search({
			minX: area.left,
			minY: area.top,
			maxX: area.right,
			maxY: area.bottom,
		});
	}

	// Nodes lying entirely inside the container area, compared in model coordinates with
	// non-strict bounds: a node pressed against the edge counts as inside.
	function captureContainedBlockIds(container: DiagramBlock): DiagramBlockId[]
	{
		const containerId = toValue(container)?.id ?? null;

		if (containerId === null || !isGroupableBlock(containerId))
		{
			return [];
		}

		const area = modelRect(container);

		if (area === null)
		{
			return [];
		}

		const captured: DiagramBlockId[] = [];

		for (const candidate of searchArea(area))
		{
			if (candidate.id === containerId)
			{
				continue;
			}

			if (isGroupableBlock(candidate.id))
			{
				continue;
			}

			const rect = modelRect(candidate);

			if (rect === null)
			{
				continue;
			}

			if (
				rect.left >= area.left
				&& rect.top >= area.top
				&& rect.right <= area.right
				&& rect.bottom <= area.bottom
			)
			{
				captured.push(candidate.id);
			}
		}

		return captured;
	}

	return {
		isGroupableBlock,
		hasGroupableBlock,
		captureContainedBlockIds,
		registerGroupableBlock,
		unregisterGroupableBlock,
	};
}
