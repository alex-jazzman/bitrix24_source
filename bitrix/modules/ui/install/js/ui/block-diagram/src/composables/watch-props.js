import { watch, effectScope, toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { pruneGroupableBlocks } from './groupable';
import { replaceSelection } from './highlighted-blocks';
import { isValidMinZoom } from '../utils';
import { ZOOM_FLOOR } from '../constants';

export type UseWatchProps = {
	dispose: () => void,
};

function blockGeometryKey(block): string
{
	const { x = 0, y = 0 } = toValue(block.position) ?? {};
	const { width = 0, height = 0 } = toValue(block.dimensions) ?? {};
	const ports = toValue(block.ports) ?? [];

	return JSON.stringify({ x, y, width, height, ports });
}

function buildBlockModel(list): Map<string, string>
{
	return new Map(toValue(list ?? []).map((block) => [block.id, blockGeometryKey(block)]));
}

// Free geometry that the model no longer backs: (a) blocks removed from the model,
// (b) unmounted (culled) blocks whose position/size changed — their retained
// coordinates are now stale and no unmount will fire to clear them.
function purgeStaleGeometry(previousModel, newModel, blockElMap, purgeBlockGeometry): void
{
	for (const blockId of previousModel.keys())
	{
		if (!newModel.has(blockId))
		{
			purgeBlockGeometry(blockId);
		}
	}

	for (const [blockId, geometry] of newModel)
	{
		if (toValue(blockElMap)?.has(blockId) ?? false)
		{
			continue;
		}

		const previous = previousModel.get(blockId);
		if (previous !== undefined && previous !== geometry)
		{
			purgeBlockGeometry(blockId);
		}
	}
}

// Selection is model state, not markup state: under render optimization a node culled out of
// the viewport unmounts and must stay selected, while a node the model no longer has must not.
// Unmount cannot tell the two apart, so the selection is trimmed here against the model, the
// only source that knows a node is really gone. Shared with the slow revert path of the
// history, which restores the selection it kept and trims it by the very same rule.
export function pruneSelection(highlitedBlockIds, blockIdsInModel): void
{
	const selected = toValue(highlitedBlockIds) ?? [];
	const modelIds = toValue(blockIdsInModel);
	const retained = selected.filter((blockId) => modelIds.has(blockId));

	if (retained.length !== selected.length)
	{
		replaceSelection(highlitedBlockIds, retained);
	}
}

// Reports a broken pair of bounds, it does not repair one: the state keeps mirroring what the
// consumer set, and the camera clamps to its own floor. The property validator sees a single
// value, so the pair can only be judged here, where both are visible at once.
function warnOnInvalidZoomBounds(minZoom: number, maxZoom: number): void
{
	if (!isValidMinZoom(minZoom))
	{
		console.error(
			`ui.block-diagram: minZoom has to be a finite number not below ${ZOOM_FLOOR}`,
			{ minZoom, maxZoom },
		);

		return;
	}

	// Infinity is a legal upper bound: it is what the camera itself falls back to for an unreadable
	// one, and it means the very thing a consumer asks for by it — not limited from above.
	if (!Number.isFinite(maxZoom) && maxZoom !== Number.POSITIVE_INFINITY)
	{
		console.error('ui.block-diagram: maxZoom has to be a finite number or Infinity', { minZoom, maxZoom });

		return;
	}

	if (minZoom > maxZoom)
	{
		console.error('ui.block-diagram: minZoom has to be not above maxZoom', { minZoom, maxZoom });
	}
}

export function useWatchProps(props): UseWatchProps
{
	const {
		blocks,
		connections,
		camera,
		transformX,
		transformY,
		minZoom,
		maxZoom,
		snapToGrid,
		snapSize,
		canvasGridSize,
		isDisabled,
		connectionOffset,
		connectionBendOffset,
		connectionBorderRadius,
		setUnmountedBlocks,
		setUnmountedPorts,
		setConnectionsOffsets,
		setHistoryBlocksCurrentState,
		setHistoryConnectionsCurrentState,
		blockIntersections,
		connectionPreview,
		clearConnectionPreview,
		isRunUpdateBlocksCommand,
		purgeBlockGeometry,
		blockElMap,
		isRenderOptimizationAvailable,
		highlitedBlockIds,
		blockIdsInModel,
		groupableBlockIds,
		connectionRouteHitTestEnabled,
	} = useBlockDiagram();
	const scope = effectScope(true);
	const clearCurrentConnectionPreview = (): void => {
		clearConnectionPreview(toValue(connectionPreview)?.activationKey);
	};

	// Own snapshot of the previous block model (id → geometry key). Independent of the
	// watcher's oldValue, which is unreliable: props.blocks mutated in place yields
	// oldBlocks === newBlocks, so a diff against it sees no change.
	let previousBlockModel = new Map();

	scope.run(() => {
		// Enabling builds the index right here instead of through the coalesced rAF path: a consumer
		// switches the hit test on at the start of a gesture, and the first frame of that gesture
		// already asks for hits. Watchers flush before the frame, so a synchronous build is ready in
		// time, while a scheduled one would miss exactly that frame. Disabling stays coalesced —
		// loadConnections frees the index when nothing maintains it any more.
		watch(() => props.connectionRouteHitTestEnabled, (enabled: boolean) => {
			connectionRouteHitTestEnabled.value = enabled;

			if (enabled)
			{
				blockIntersections.loadConnectionsFromSnapshot(toValue(props.connections), toValue(props.blocks));

				return;
			}

			blockIntersections.loadConnections();
		}, { immediate: true });

		watch([
			() => props.blocks,
			() => props.blocks.length,
		], ([newBlocks = [], newLength = 0], [oldBlocks = [], oldLength = 0]) => {
			clearCurrentConnectionPreview();

			if (newBlocks && Array.isArray(newBlocks))
			{
				setHistoryBlocksCurrentState(newBlocks);
				setUnmountedPorts(newBlocks, oldBlocks);
				setUnmountedBlocks(newBlocks, oldBlocks);
				blocks.value = newBlocks;
				pruneSelection(highlitedBlockIds, blockIdsInModel);
				pruneGroupableBlocks(groupableBlockIds, blockIdsInModel);

				const optimizationEnabled = toValue(isRenderOptimizationAvailable);
				const newBlockModel = optimizationEnabled ? buildBlockModel(newBlocks) : null;

				if (!toValue(isRunUpdateBlocksCommand))
				{
					// Direct props.blocks mutation bypasses DELETE_BLOCK hooks, so retained
					// geometry of removed or shifted culled nodes would leak: purge via the
					// own snapshot instead of the unreliable oldBlocks diff.
					if (optimizationEnabled)
					{
						purgeStaleGeometry(previousBlockModel, newBlockModel, blockElMap, purgeBlockGeometry);
					}

					blockIntersections.clear();
					blockIntersections.load(blocks.value);
				}

				if (optimizationEnabled)
				{
					previousBlockModel = newBlockModel;
				}

				isRunUpdateBlocksCommand.value = false;

				// Connection boxes derive from block positions, so any block change
				// (move/add/delete) must rebuild the connection index too.
				blockIntersections.loadConnections();
			}
		}, { immediate: true, deep: true });

		watch([() => props.connections, () => props.connections.length], ([newConnections]) => {
			clearCurrentConnectionPreview();
			setConnectionsOffsets(newConnections);
			setHistoryConnectionsCurrentState(newConnections);
			connections.value = [...newConnections];
			blockIntersections.loadConnections();
		}, { immediate: true, deep: true });

		// The bounds go before the scale below: the camera reads them from the state on every clamp,
		// so the scale has to meet the bounds of the consumer rather than the defaults of the state.
		// The diagnostics close the callback because they decide nothing — they must not stand
		// between the bounds and the state.
		watch([() => props.minZoom, () => props.maxZoom], ([newMinZoom, newMaxZoom]) => {
			minZoom.value = newMinZoom;
			maxZoom.value = newMaxZoom;
			warnOnInvalidZoomBounds(newMinZoom, newMaxZoom);
		}, { immediate: true });

		// The scale belongs to the camera, and the state only ever mirrors what the camera
		// publishes. Writing the property into the state alone would leave the camera at a scale
		// of its own until the first gesture, and everything counted off the camera - the frame
		// of the current view on the map, the shift of a camera move - would be counted at the
		// wrong one. The landmark carries the transform of the state along so that a consumer
		// which set it up before mounting does not lose it to the publication.
		watch(() => props.zoom, (newZoom: number) => {
			camera.applyLandmark(camera.createLandmark({
				x: toValue(transformX),
				y: toValue(transformY),
				zoom: newZoom,
			}));
		}, { immediate: true });

		watch(() => props.snapToGrid, (newSnapToGrid: boolean) => {
			snapToGrid.value = newSnapToGrid;
		}, { immediate: true });

		watch(() => props.snapSize, (newSnapSize: number | null) => {
			snapSize.value = newSnapSize;
		}, { immediate: true });

		// The base size the snap step is counted from (see `snapStep` in getters.js for how that
		// step relates to the drawn grid).
		watch(() => props.canvasStyle?.size, (newCanvasGridSize: number) => {
			// A broken grid size would turn the snap step into NaN and silently disable
			// snapping, so keep the last valid size instead.
			if (Number.isFinite(newCanvasGridSize) && newCanvasGridSize > 0)
			{
				canvasGridSize.value = newCanvasGridSize;
			}
		}, { immediate: true });

		watch(() => props.connectionOffset, (newConnectionOffset: number): void => {
			connectionOffset.value = newConnectionOffset;
			// Routing param feeds connection bbox padding: rebuild the index to match.
			blockIntersections.loadConnections();
		}, { immediate: true });

		watch(() => props.connectionBendOffset, (newConnectionOffsetBend: number): void => {
			connectionBendOffset.value = newConnectionOffsetBend;
			// Routing param feeds connection bbox padding: rebuild the index to match.
			blockIntersections.loadConnections();
		}, { immediate: true });

		watch(() => props.connectionBorderRadius, (newConnectionBorderRadius: number): void => {
			connectionBorderRadius.value = newConnectionBorderRadius;
			// Routing param feeds connection bbox padding: rebuild the index to match.
			blockIntersections.loadConnections();
		}, { immediate: true });

		watch(() => props.disabled, (disabled: boolean) => {
			isDisabled.value = disabled;

			if (disabled)
			{
				clearCurrentConnectionPreview();
			}
		}, { immediate: true });
	});

	function dispose(): void
	{
		scope.stop();
	}

	return {
		dispose,
	};
}
