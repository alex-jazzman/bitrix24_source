import { toValue, ref, computed } from 'ui.vue3';
import { Event, Text, Type } from 'main.core';
import { useBlockDiagram } from './block-diagram';
import type {
	DiagramBlock,
	DiagramPort,
	DiagramAddConnection,
	DiagramNewConnection,
	DiagramValidationPortRuleFn,
	DiagramNormalyzeConnectionFn,
	DiagramPortsMap,
} from '../types';

export type UseNewConnection = {
	isSourcePort: boolean;
	isTargetPort: boolean;
	onMouseDownPort: (event: MouseEvent) => void;
};

export type useNewConnectionOptions = {
	block: DiagramBlock,
	port: DiagramPort,
	position: DiagramPortPosition,
	validationRules: Array<DiagramValidationPortRuleFn> | null,
	normalyzeConnectionFn: DiagramNormalyzeConnectionFn | null,
};

// eslint-disable-next-line max-lines-per-function
export function useNewConnection(options: useNewConnectionOptions): UseNewConnection
{
	const {
		isDisabledBlockDiagram,
		newConnection,
		portsRectMap,
		portsValidationsFnMap,
		validPortsMap,
		addConnection,
		portsNearest,
		blockIntersections,
		transformMouseEventToPoint,
	} = useBlockDiagram();
	const {
		block,
		port,
		position,
		normalyzeConnectionFn = null,
	} = options;
	const isSourcePort = ref(false);

	const isTargetPort = computed((): boolean => {
		const {
			targetBlockId = null,
			targetPortId = null,
		} = toValue(newConnection) ?? {};

		return toValue(block).id === targetBlockId && toValue(port).id === targetPortId;
	});

	function validateConnection(
		rules: Array<DiagramValidationPortRuleFn> | DiagramValidationPortRuleFn | null,
		connection: DiagramNewConnection,
	): boolean
	{
		if (rules === null)
		{
			return true;
		}

		if (Type.isArray(rules))
		{
			return rules.every((rule) => rule(toValue(connection)));
		}

		if (!Type.isFunction(rules))
		{
			return true;
		}

		return rules(toValue(connection));
	}

	function getValidPorts(
		portsMap: DiagramPortsMap,
		connection: DiagramNewConnection,
	): DiagramPortsMap
	{
		const filteredPortsMap = new Map();

		for (const [blockId, ports] of toValue(portsMap).entries())
		{
			for (const [portId, targetPort] of ports.entries())
			{
				const rules = toValue(portsValidationsFnMap).get(blockId).get(portId);
				const isValidConnection = validateConnection(rules, {
					...toValue(connection),
					targetBlockId: blockId,
					targetPortId: portId,
					targetPort: { ...toValue(targetPort) },
				});

				if (!isValidConnection)
				{
					continue;
				}

				if (!filteredPortsMap.has(blockId))
				{
					filteredPortsMap.set(blockId, new Map());
				}

				filteredPortsMap.get(blockId).set(portId, targetPort);
			}
		}

		return filteredPortsMap;
	}

	function normalyzeNewConnection(
		connection: DiagramNewConnection,
		normalyzeFn: DiagramNormalyzeConnectionFn | null = null,
	): DiagramAddConnection
	{
		if (Type.isFunction(normalyzeFn))
		{
			return normalyzeFn(connection);
		}

		return {
			id: connection.id,
			sourceBlockId: connection.sourceBlockId,
			sourcePortId: connection.sourcePortId,
			targetBlockId: connection.targetBlockId,
			targetPortId: connection.targetPortId,
		};
	}

	function onMouseDownPort(event: MouseEvent): void
	{
		event.stopPropagation();

		if (toValue(isDisabledBlockDiagram))
		{
			return;
		}

		isSourcePort.value = true;
		const portRect = toValue(portsRectMap)?.[toValue(block).id]?.[toValue(port).id];
		const start = {
			x: portRect.x + (portRect.width / 2),
			y: portRect.y + (portRect.height / 2),
		};
		const center = transformMouseEventToPoint(event);

		newConnection.value = {
			id: Text.getRandom(),
			sourceBlockId: toValue(block).id,
			sourcePortId: toValue(port).id,
			sourcePort: { ...toValue(port) },
			sourcePortPosition: position,
			targetBlockId: null,
			targetPortId: null,
			targetPort: null,
			start,
			center,
			end: null,
		};

		validPortsMap.value = getValidPorts(
			blockIntersections.visiblePorts,
			newConnection,
		);
		portsNearest.init(toValue(validPortsMap));

		Event.bind(document, 'mousemove', onMouseMove);
		Event.bind(document, 'mouseup', onMouseUp);
	}

	function onMouseMove(event: MouseEvent): void
	{
		if (!toValue(newConnection) || toValue(isDisabledBlockDiagram))
		{
			return;
		}

		const point = transformMouseEventToPoint(event);
		const [nearestPort] = portsNearest.nearest(point, 1, 100)?.[0] ?? [null];
		const isSamePorts = toValue(newConnection).sourceBlockId === nearestPort?.blockId
			&& toValue(newConnection).sourcePortId === nearestPort?.portId;

		if (nearestPort && !isSamePorts)
		{
			const portRect = toValue(portsRectMap)
				?.[nearestPort.blockId]
				?.[nearestPort.portId];

			newConnection.value = {
				...toValue(newConnection),
				targetBlockId: nearestPort.blockId,
				targetPortId: nearestPort.portId,
				targetPort: nearestPort.port,
				center: point,
				end: {
					x: portRect.x + (portRect.width / 2),
					y: portRect.y + (portRect.height / 2),
				},
			};
		}
		else
		{
			newConnection.value = {
				...toValue(newConnection),
				targetBlockId: null,
				targetPortId: null,
				targetPort: null,
				center: point,
				end: null,
			};
		}
	}

	function onMouseUp(event: MouseEvent): void
	{
		if (toValue(newConnection) === null || toValue(isDisabledBlockDiagram))
		{
			return;
		}

		const {
			sourceBlockId = null,
			sourcePortId = null,
			targetBlockId = null,
			targetPortId = null,
		} = toValue(newConnection);

		const isSamePort = sourceBlockId === targetBlockId && sourcePortId === targetPortId;
		const hasSourceIds = sourceBlockId !== null && sourcePortId !== null;
		const hasTargetIds = targetBlockId !== null && targetPortId !== null;

		if (!isSamePort && hasSourceIds && hasTargetIds)
		{
			addConnection(
				normalyzeNewConnection(
					toValue(newConnection),
					normalyzeConnectionFn,
				),
			);
		}

		newConnection.value = null;
		isSourcePort.value = false;
		Event.unbind(document, 'mousemove', onMouseMove);
		Event.unbind(document, 'mouseup', onMouseUp);
	}

	return {
		isSourcePort,
		isTargetPort,
		onMouseDownPort,
	};
}
