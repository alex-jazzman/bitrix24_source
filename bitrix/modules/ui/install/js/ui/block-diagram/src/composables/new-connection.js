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
} from '../types';

export type UseNewConnection = {
	isSourcePort: boolean;
	isValid: boolean;
	onMouseDownPort: (event: MouseEvent) => void;
	onMouseOverPort: () => void;
	onMouseLeavePort: () => void;
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
		isValidNewConnection,
		portsRectMap,
		blockDiagramTop,
		blockDiagramLeft,
		zoom,
		transformX,
		transformY,
		addConnection,
	} = useBlockDiagram();
	const {
		block,
		port,
		position,
		validationRules = null,
		normalyzeConnectionFn = null,
	} = options;
	const isSourcePort = ref(false);

	const isValid = computed((): boolean => {
		if (toValue(newConnection) === null)
		{
			return true;
		}

		const {
			sourceBlockId,
			sourcePortId,
			targetBlockId,
			targetPortId,
		} = toValue(newConnection);

		if (targetPortId === null)
		{
			return true;
		}

		const isSource = toValue(block).id === sourceBlockId && toValue(port).id === sourcePortId;
		const isTarget = toValue(block).id === targetBlockId && toValue(port).id === targetPortId;

		if (isSource || isTarget)
		{
			return toValue(isValidNewConnection);
		}

		return true;
	});

	function validateNewConnection(
		rules: Array<DiagramValidationPortRuleFn> | DiagramValidationPortRuleFn | null,
	): boolean
	{
		if (rules === null)
		{
			return true;
		}

		if (Type.isArray(rules))
		{
			return rules.every((rule) => rule(toValue(newConnection)));
		}

		if (!Type.isFunction(rules))
		{
			return true;
		}

		return rules(toValue(newConnection));
	}

	function normalyzeNewConnection(
		newConnection: DiagramNewConnection,
		normalyzeFn: DiagramNormalyzeConnectionFn | null = null,
	): DiagramAddConnection
	{
		if (Type.isFunction(normalyzeFn))
		{
			return normalyzeFn(newConnection);
		}

		return {
			id: newConnection.id,
			sourceBlockId: newConnection.sourceBlockId,
			sourcePortId: newConnection.sourcePortId,
			targetBlockId: newConnection.targetBlockId,
			targetPortId: newConnection.targetPortId,
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
		const startPosition = {
			x: portRect.x + (portRect.width / 2),
			y: portRect.y + (portRect.height / 2),
		};

		newConnection.value = {
			id: Text.getRandom(),
			sourceBlockId: toValue(block).id,
			sourcePortId: toValue(port).id,
			sourcePort: { ...toValue(port) },
			sourcePortPosition: position,
			targetBlockId: null,
			targetPortId: null,
			targetPort: null,
			start: startPosition,
			end: startPosition,
		};

		Event.bind(document, 'mousemove', onMouseMove);
		Event.bind(document, 'mouseup', onMouseUp);
	}

	function onMouseMove(event: MouseEvent): void
	{
		if (!toValue(newConnection) || toValue(isDisabledBlockDiagram))
		{
			return;
		}

		const x: number = event.clientX / toValue(zoom);
		const y: number = event.clientY / toValue(zoom);

		newConnection.value.end = {
			x: x + toValue(transformX) - (toValue(blockDiagramLeft) / toValue(zoom)),
			y: y + toValue(transformY) - (toValue(blockDiagramTop) / toValue(zoom)),
		};
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

		if (!isSamePort && hasSourceIds && hasTargetIds && toValue(isValidNewConnection))
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

	function onMouseOverPort(): void
	{
		if (toValue(isDisabledBlockDiagram))
		{
			return;
		}

		if (toValue(newConnection) !== null)
		{
			newConnection.value.targetBlockId = toValue(block).id;
			newConnection.value.targetPortId = toValue(port).id;
			newConnection.value.targetPort = { ...toValue(port) };
			isValidNewConnection.value = validateNewConnection(toValue(validationRules));
		}
	}

	function onMouseLeavePort(): void
	{
		if (toValue(isDisabledBlockDiagram))
		{
			return;
		}

		if (toValue(newConnection) !== null)
		{
			newConnection.value.targetBlockId = null;
			newConnection.value.targetPortId = null;
			newConnection.value.targetPort = null;
			isValidNewConnection.value = true;
		}
	}

	return {
		isSourcePort,
		isValid,
		onMouseDownPort,
		onMouseOverPort,
		onMouseLeavePort,
	};
}
