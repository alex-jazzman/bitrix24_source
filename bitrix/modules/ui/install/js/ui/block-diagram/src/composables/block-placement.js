// Kept in JS on purpose: chef takes the package language from the entry point (src/index.js), so a
// lone .ts source inside this extension would not resolve.
import { toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { useGroupable } from './groupable';
import { findPlacementDelta, modelBlockRect, toSearchRect } from '../utils';
import type { PlacementRect } from '../utils';
import type { DiagramBlock, DiagramBlockId, Point } from '../types';

// How many candidate corrections one operation may examine. A schema dense enough to exhaust this
// has no free room near the point aimed at, and the answer "nowhere" comes sooner than a search
// over the whole canvas would. The budget belongs to the rule, not to a diagram: a consumer able to
// widen it would be able to trade a frozen canvas for a placement no user waits for.
export const PLACEMENT_SEARCH_BUDGET = 64;

export type PlacementRequest = {
	// Whether the operation asking for the correction is placing its blocks on the grid right now.
	// A step configured in the diagram merely permits snapping - which gesture applies it is decided
	// by the caller together with the Shift modifier (see `snapStep` in getters.js) - so the answer
	// comes from the operation and never from the step alone. Pasting never snaps: a fragment lands
	// exactly where it was aimed at even while snapping is on.
	followsGrid?: boolean,
	// Blocks of this very operation that are containers but are not in the registry yet: it is filled
	// by the wrapper component at mount, and a block asked about before it reaches the model has not
	// mounted either. Left out, the rule knows only the containers already standing on the canvas.
	backdropIds?: Set<DiagramBlockId> | null,
};

export type UseBlockPlacement = {
	resolvePlacementDelta: (participants: PlacementRect[], request?: PlacementRequest) => Point | null,
};

/**
 * The rule of placement over the state of the canvas: it answers where a set of blocks may stand and
 * writes nothing. Participants come in model coordinates, already at the position the operation aims
 * at, and the answer is one shift for the whole set - zero when the set may stay, null when no free
 * room was found within the budget.
 */
export function useBlockPlacement(): UseBlockPlacement
{
	const { blockIntersections, snapStep } = useBlockDiagram();
	const { isGroupableBlock } = useGroupable();

	function obstacleRect(block: DiagramBlock): PlacementRect | null
	{
		const source = toValue(block);
		const rect = modelBlockRect(toValue(source?.position), toValue(source?.dimensions));

		return rect === null ? null : { id: source.id, ...rect };
	}

	// The index is the broad phase alone: it boxes blocks non-strictly, and during a gesture it still
	// holds the pre-gesture boxes of the participants. The strict rule and the filter by participant
	// id run above, over what comes back from here.
	function searchObstacles(rect: PlacementRect): PlacementRect[]
	{
		const obstacles = [];

		for (const block of blockIntersections.search(toSearchRect(rect)))
		{
			const obstacle = obstacleRect(block);

			if (obstacle !== null)
			{
				obstacles.push(obstacle);
			}
		}

		return obstacles;
	}

	function resolvePlacementDelta(
		participants: PlacementRect[],
		request: PlacementRequest = {},
	): Point | null
	{
		const { followsGrid = false, backdropIds = null } = request;

		const isBackdrop = backdropIds === null
			? isGroupableBlock
			: (blockId: DiagramBlockId): boolean => isGroupableBlock(blockId) || backdropIds.has(blockId);

		return findPlacementDelta(
			participants,
			searchObstacles,
			isBackdrop,
			followsGrid ? toValue(snapStep) : null,
			PLACEMENT_SEARCH_BUDGET,
		);
	}

	return {
		resolvePlacementDelta,
	};
}
