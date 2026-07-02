import { computed, toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { getLinePath } from '../utils';
import type { PathInfo, Rect, DiagramNewConnection } from '../utils';

export type UseNewConnectionState = {
	hasNewConnection: boolean;
	hasSourcePort: boolean;
	hasTargetPort: boolean;
	sourcePortLayoutRect: Rect;
	targetPortLayoutRect: Rect;
	newConnectionPathInfo: PathInfo;
	newTmpConnectionPathInfo: PathInfo;
	newConnection: DiagramNewConnection;
};

const DEFAULT_PATH_INFO: PathInfo = {
	path: '',
	center: {
		x: 0,
		y: 0,
	},
};

export function useNewConnectionState(): UseNewConnectionState
{
	const {
		newConnection,
		portsRectMap,
	} = useBlockDiagram();

	const hasNewConnection = computed((): boolean => {
		return toValue(newConnection) !== null;
	});

	const hasSourcePort = computed((): boolean => {
		return toValue(hasNewConnection)
            && toValue(newConnection).sourceBlockId !== null
            && toValue(newConnection).sourcePortId !== null;
	});

	const hasTargetPort = computed((): boolean => {
		return toValue(hasNewConnection)
            && toValue(newConnection).targetBlockId !== null
            && toValue(newConnection).targetPortId !== null;
	});

	const sourcePortLayoutRect = computed((): Rect => {
		const { x = 0, y = 0, width = 0, height = 0 } = toValue(portsRectMap)
			?.[toValue(newConnection)?.sourceBlockId]
			?.[toValue(newConnection)?.sourcePortId] ?? {};

		return { x, y, width, height };
	});

	const targetPortLayoutRect = computed((): Rect => {
		const { x = 0, y = 0, width = 0, height = 0 } = toValue(portsRectMap)
			?.[toValue(newConnection)?.targetBlockId]
			?.[toValue(newConnection)?.targetPortId] ?? {};

		return { x, y, width, height };
	});

	const newConnectionPathInfo = computed((): PathInfo => {
		if (!toValue(hasNewConnection))
		{
			return DEFAULT_PATH_INFO;
		}

		return getLinePath(
			toValue(newConnection).start,
			toValue(newConnection).center,
		);
	});

	const newTmpConnectionPathInfo = computed((): PathInfo => {
		if (toValue(newConnection) === null || toValue(newConnection).end === null)
		{
			return DEFAULT_PATH_INFO;
		}

		return getLinePath(
			toValue(newConnection).center,
			toValue(newConnection).end,
		);
	});

	return {
		hasNewConnection,
		hasSourcePort,
		hasTargetPort,
		sourcePortLayoutRect,
		targetPortLayoutRect,
		newConnectionPathInfo,
		newTmpConnectionPathInfo,
		newConnection,
	};
}
