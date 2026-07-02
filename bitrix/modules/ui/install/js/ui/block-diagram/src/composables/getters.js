import { computed, toValue } from 'ui.vue3';
import { CONNECTION_GROUP_DEFAULT_NAME } from '../constants';
import type {
	Getters,
	GroupedConnections,
	ConnectionGroupNames,
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

	const isAnimate = computed((): boolean => {
		return state.animationQueue !== null;
	});

	const isDisabledBlockDiagram = computed((): boolean => {
		return state.isDisabled || toValue(isAnimate);
	});

	return {
		transform,
		canvasId,
		groupedConnections,
		connectionGroupNames,
		isAnimate,
		isDisabledBlockDiagram,
		isMakeNewConnection,
	};
}
