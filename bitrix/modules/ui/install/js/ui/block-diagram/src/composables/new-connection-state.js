import { computed, toValue } from 'ui.vue3';
import { getBeziePath, BEZIER_DIR } from '../utils';
import { PORT_POSITION } from '../constants';
import type { PathInfo } from '../utils';
import { useBlockDiagram } from './block-diagram';

export type UseNewConnectionState = {
	hasNewConnection: boolean;
	newConnectionPathInfo: PathInfo;
	isValid: boolean;
};

export function useNewConnectionState(): UseNewConnectionState
{
	const { newConnection, isValidNewConnection } = useBlockDiagram();

	const hasNewConnection = computed((): boolean => {
		return toValue(newConnection) !== null;
	});

	const newConnectionPathInfo = computed((): PathInfo => {
		if (!toValue(hasNewConnection))
		{
			return {
				path: '',
				center: {
					x: 0,
					y: 0,
				},
			};
		}

		const isHorizontalBezier = ([PORT_POSITION.LEFT, PORT_POSITION.RIGHT])
			.includes(toValue(newConnection).sourcePortPosition);

		return getBeziePath(
			toValue(newConnection).start,
			toValue(newConnection).end,
			isHorizontalBezier ? BEZIER_DIR.HORIZONTAL : BEZIER_DIR.VERTICAL,
		);
	});

	const isValid = computed((): boolean => {
		if (toValue(newConnection) === null)
		{
			return true;
		}

		return toValue(isValidNewConnection);
	});

	return {
		hasNewConnection,
		newConnectionPathInfo,
		isValid,
	};
}
