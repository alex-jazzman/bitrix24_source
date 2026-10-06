import { computed, toValue } from 'ui.vue3';
import { CONNECTION_GROUP_DEFAULT_NAME } from '../constants';
import { GRID_SUBDIVISION } from '../utils';
import type {
	Getters,
	GroupedConnections,
	ConnectionGroupNames,
	DiagramBlockId,
	Transform,
} from '../types';

// eslint-disable-next-line max-lines-per-function
export function useGetters(state): Getters
{
	const transform = computed((): Transform => ({
		x: state.transformX,
		y: state.transformY,
		zoom: state.zoom,
		viewportX: state.viewportX,
		viewportY: state.viewportY,
	}));

	const canvasId = computed((): string | null => {
		return state.canvasRef?.canvasId ?? null;
	});

	const isMakeNewConnection = computed((): boolean => {
		return state.newConnection !== null;
	});

	const groupedConnections = computed((): GroupedConnections => {
		return state.connections
			.reduce((acc, connection) => {
				const type = connection?.type ?? CONNECTION_GROUP_DEFAULT_NAME;

				if (type in acc)
				{
					acc[type] = [...acc[type], connection];
				}
				else
				{
					acc[type] = [connection];
				}

				return acc;
			}, { [CONNECTION_GROUP_DEFAULT_NAME]: [] });
	});

	const connectionGroupNames = computed((): ConnectionGroupNames => {
		return Object.keys(toValue(groupedConnections));
	});

	const blockIdsInModel = computed((): Set<DiagramBlockId> => {
		return new Set(state.blocks.map((block) => block.id));
	});

	const isAnimate = computed((): boolean => {
		return state.animationQueue !== null;
	});

	const isDisabledBlockDiagram = computed((): boolean => {
		return state.isDisabled || toValue(isAnimate);
	});

	// The only place deciding which snap step is in effect. A step other than null merely permits
	// snapping; whether a gesture applies it is decided by the caller together with the Shift
	// modifier (`isSnapApplied`).
	// Counted from the base grid size (`canvasStyle.size`), so the step ignores zoom by design.
	// The default zoom ladder derives its finest level from the same divisor, so the step is a
	// line the canvas draws rather than a value of its own; a consumer passing a ladder of its
	// own has to keep that agreement. `snapSize` sets the step explicitly.
	const snapStep = computed((): number | null => {
		if (!state.snapToGrid)
		{
			return null;
		}

		if (Number.isFinite(state.snapSize) && state.snapSize > 0)
		{
			return state.snapSize;
		}

		return state.canvasGridSize / GRID_SUBDIVISION;
	});

	return {
		transform,
		canvasId,
		groupedConnections,
		connectionGroupNames,
		blockIdsInModel,
		isAnimate,
		isDisabledBlockDiagram,
		isMakeNewConnection,
		snapStep,
	};
}
