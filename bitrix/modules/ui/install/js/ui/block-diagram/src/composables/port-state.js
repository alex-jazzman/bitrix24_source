import { toValue, computed } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { PORT_POSITION } from '../constants';
import type { DiagramBlockId, DiagramPortId } from '../types';

type UsePortState = {
	isDisabled: boolean;
	isMaybePortForNewConnection: boolean;
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
		validationRules = [],
		index = 0,
	} = options;

	const {
		isMakeNewConnection,
		waitAllBlocksMounted,
		portsElMap,
		portsRectMap,
		portsValidationsFnMap,
		zoom,
		transformX,
		transformY,
		blockDiagramTop,
		blockDiagramLeft,
		highlitedBlockIds,
		movingBlockId,
		isDisabledBlockDiagram,
		updatePortSegmentSizes,
		portMounted,
		validPortsMap,
		waitForTransformEnd,
	} = useBlockDiagram();

	const isMaybePortForNewConnection = computed((): boolean => {
		const hasBlock = toValue(validPortsMap).has(toValue(block).id);
		const hasPort = toValue(validPortsMap)
			?.get(toValue(block).id)
			?.has(toValue(port).id) ?? false;

		return toValue(isMakeNewConnection) && hasBlock && hasPort;
	});

	const isDisabled = computed((): boolean => {
		return toValue(isDisabledBlockDiagram);
	});

	const isIncludedPortInSelectedBlock = computed((): boolean => {
		return toValue(highlitedBlockIds).includes(toValue(block).id);
	});

	const isIncludedPortInMovingBlock = computed((): boolean => {
		return toValue(movingBlockId) !== null && toValue(movingBlockId) === toValue(block).id;
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
			width: width / toValue(zoom),
			height: height / toValue(zoom),
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

	function addValidationFn(): void
	{
		if (!toValue(portsValidationsFnMap).has(toValue(block).id))
		{
			toValue(portsValidationsFnMap).set(toValue(block).id, new Map());
		}

		toValue(portsValidationsFnMap)
			.get(toValue(block).id)
			.set(toValue(port.id), toValue(validationRules));
	}

	function deleteValidationFn(): void
	{
		const portsCount = toValue(portsValidationsFnMap)
			?.get(toValue(block).id)
			?.size ?? 0;

		if (portsCount === 1)
		{
			toValue(portsValidationsFnMap).delete(toValue(block).id);
		}

		toValue(portsValidationsFnMap)
			?.get(toValue(block).id)
			?.delete(toValue(port).id);
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
		addValidationFn();

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
		deleteValidationFn();
	}

	return {
		isDisabled,
		isMaybePortForNewConnection,
		isIncludedPortInSelectedBlock,
		isIncludedPortInMovingBlock,
		onMountedPort,
		onUnmountedPort,
	};
}
