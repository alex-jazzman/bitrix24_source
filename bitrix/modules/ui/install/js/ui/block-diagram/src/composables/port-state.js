import { toValue, computed } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { useTransientHighlightedBlocks } from './transient-highlighted-blocks';
import { getCanvasRect, shouldRetainPortGeometry, collectModelPortIds } from '../utils';
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
		isVirtual = false,
		onVirtualDrop = null,
	} = options;

	const {
		isMakeNewConnection,
		waitAllBlocksMounted,
		portsElMap,
		portsRectMap,
		portsValidationsFnMap,
		virtualPortsMap,
		movingBlockId,
		isDisabledBlockDiagram,
		updatePortSegmentSizes,
		touchPortsGeometry,
		portMounted,
		validPortsMap,
		isRenderOptimizationAvailable,
		blockIdsInModel,
		getBlockById,
	} = useBlockDiagram();
	const { isBlockVisuallyHighlighted } = useTransientHighlightedBlocks();

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

	// The ports follow the visual highlight of their block through both channels of it, the user
	// selection and the temporary highlight of a block being played back — the same check the block
	// itself uses (block-state.js). The name is kept: it belongs to the public usePortState API.
	const isIncludedPortInSelectedBlock = computed((): boolean => {
		return isBlockVisuallyHighlighted(toValue(block).id);
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
		} = getCanvasRect(toValue(portEl)) ?? {};

		toValue(portsRectMap)[blockId][portId] = {
			x,
			y,
			width,
			height,
			position,
			// The port's fan-out order within its side, captured here so onMountedBlock can
			// recompute the segments with the same order the drawing/promise path uses — under
			// culling that promise path never runs (see block-state.js onMountedBlock).
			order: index,
			firstSegmentSize: 0,
			secondSegmentSize: 0,
			secondSegmentSizeWithoutOffset: 0,
		};

		touchPortsGeometry();
	}

	function deletePortRect(blockId: DiagramBlockId, portId: DiagramPortId): void
	{
		const portsMap = toValue(portsRectMap)[blockId];

		if (!portsMap || !(portId in portsMap))
		{
			return;
		}

		if (Object.keys(portsMap).length === 1)
		{
			delete toValue(portsRectMap)[blockId];
		}
		else
		{
			delete portsMap[portId];
		}

		touchPortsGeometry();
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

	function addVirtualPort(): void
	{
		if (!isVirtual)
		{
			return;
		}

		if (!toValue(virtualPortsMap).has(toValue(block).id))
		{
			toValue(virtualPortsMap).set(toValue(block).id, new Map());
		}

		toValue(virtualPortsMap)
			.get(toValue(block).id)
			.set(toValue(port).id, {
				port: { ...toValue(port) },
				onDrop: onVirtualDrop,
			});
	}

	function deleteVirtualPort(): void
	{
		if (!isVirtual)
		{
			return;
		}

		const ports = toValue(virtualPortsMap).get(toValue(block).id);
		if (!ports)
		{
			return;
		}

		ports.delete(toValue(port).id);
		if (ports.size === 0)
		{
			toValue(virtualPortsMap).delete(toValue(block).id);
		}
	}

	function onMountedPort(): void
	{
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
		addVirtualPort();

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

	function onUnmountedPort(): void
	{
		const blockId = toValue(block).id;
		const portId = toValue(port).id;

		deletePortElement(blockId, portId);
		deleteValidationFn();
		deleteVirtualPort();

		// Under render optimization culling unmounts the offscreen node while it
		// stays in the model: retain measured port coordinates so the connection
		// path can still be resolved. A real removal — the block gone, or this port
		// dropped from a surviving block's ports — clears them (see purgeBlockGeometry).
		// Read the port composition from the CURRENT model (getBlockById), not the prop
		// captured in setup: an immutable setPorts swaps the block, and the stale prop
		// would still list the removed port and wrongly retain its geometry.
		const blockPortIdsInModel = collectModelPortIds(getBlockById, blockId);
		const retain = shouldRetainPortGeometry(
			toValue(isRenderOptimizationAvailable),
			toValue(blockIdsInModel),
			blockId,
			blockPortIdsInModel,
			portId,
		);
		if (!retain)
		{
			deletePortRect(blockId, portId);
		}
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
