import { toValue, computed } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import type { DiagramBlockId, DiagramPortId } from '../types';
import { PORT_POSITION } from '../constants';

type UsePortState = {
	isDisabled: boolean;
	onMountedPort: () => void;
	onUnmountedPort: () => void;
};

// eslint-disable-next-line max-lines-per-function
export function usePortState(options): UsePortState
{
	const {
		portRef,
		block,
		port,
		position = PORT_POSITION.LEFT,
		index = 0,
	} = options;

	const {
		waitAllBlocksMounted,
		portsElMap,
		portsRectMap,
		zoom,
		transformX,
		transformY,
		blockDiagramTop,
		blockDiagramLeft,
		isDisabledBlockDiagram,
		updatePortSegmentSizes,
		portMounted,
		waitForTransformEnd,
	} = useBlockDiagram();

	const isDisabled = computed((): boolean => {
		return toValue(isDisabledBlockDiagram);
	});

	function addPortElement(blockId: DiagramBlockId, portId: DiagramPortId, portEl: HTMLElement): void
	{
		if (!toValue(portsElMap).has(blockId))
		{
			toValue(portsElMap).set(blockId, new Map());
		}

		toValue(portsElMap)
			.get(blockId)
			.set(portId, toValue(portEl));
	}

	function deletePortElement(blockId: DiagramBlockId, portId: DiagramPortId): void
	{
		if (!toValue(portsElMap).has(blockId))
		{
			return;
		}

		toValue(portsElMap)
			.get(blockId)
			.delete(portId);
	}

	function addPortRect(
		blockId: DiagramBlockId,
		portId: DiagramPortId,
		portEl: HTMLElement,
	): void
	{
		if (!(blockId in toValue(portsRectMap)))
		{
			toValue(portsRectMap)[blockId] = {};
		}

		const {
			x = 0,
			y = 0,
			width = 0,
			height = 0,
		} = toValue(portEl)?.getBoundingClientRect() ?? {};

		toValue(portsRectMap)[blockId][portId] = {
			x: (x / toValue(zoom)) + toValue(transformX) - (toValue(blockDiagramLeft) / toValue(zoom)),
			y: (y / toValue(zoom)) + toValue(transformY) - (toValue(blockDiagramTop) / toValue(zoom)),
			width,
			height,
			position,
			firstSegmentSize: 0,
			secondSegmentSize: 0,
			secondSegmentSizeWithoutOffset: 0,
		};
	}

	function deletePortRect(blockId: DiagramBlockId, portId: DiagramPortId): void
	{
		if (!(blockId in toValue(portsRectMap)))
		{
			return;
		}

		const portsMap = toValue(portsRectMap)[blockId];

		if (Object.keys(portsMap).length === 1)
		{
			delete toValue(portsRectMap)[blockId];
		}
		else
		{
			delete toValue(portsMap)[portId];
		}
	}

	async function onMountedPort(): Promise<void>
	{
		// Workaround to fix connections render after they are in viewport. Should be removed later
		await waitForTransformEnd.value?.promise;

		addPortElement(
			toValue(block).id,
			toValue(port).id,
			portRef,
		);
		addPortRect(
			toValue(block).id,
			toValue(port).id,
			portRef,
		);

		waitAllBlocksMounted.value?.promise
			.then(() => {
				if (!(toValue(block).id in toValue(portsRectMap)))
				{
					return;
				}

				updatePortSegmentSizes(
					toValue(block).id,
					toValue(port).id,
					index,
				);
				portMounted(toValue(block).id, toValue(port).id);
			});
	}

	async function onUnmountedPort(): Promise<void>
	{
		// Workaround to fix connections render after they are in viewport. Should be removed later
		await waitForTransformEnd.value?.promise;
		deletePortElement(toValue(block).id, toValue(port).id);
		deletePortRect(toValue(block).id, toValue(port).id);
	}

	return {
		isDisabled,
		onMountedPort,
		onUnmountedPort,
	};
}
