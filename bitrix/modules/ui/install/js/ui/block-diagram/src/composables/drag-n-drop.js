import { toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { isSnapModifier } from './snap-modifier';
import type { DiagramBlock } from '../types';

export function useDragAndDrop(): {...}
{
	const {
		zoom,
		blockDiagramRef,
		transformX,
		transformY,
		addBlock,
		snapPoint,
		hooks,
	} = useBlockDiagram();

	function onDrop(event: DragEvent): void
	{
		event.preventDefault();

		const dataString = event.dataTransfer.getData('text/plain');
		const receivedData = JSON.parse(dataString);

		const { width, height } = receivedData.dimensions;

		const el = toValue(blockDiagramRef);
		const { left, top } = el?.getBoundingClientRect() ?? { left: 0, top: 0 };

		receivedData.position.x = (event.clientX - (width * toValue(zoom) / 2)) / toValue(zoom);
		receivedData.position.y = (event.clientY - (height * toValue(zoom) / 2)) / toValue(zoom);

		receivedData.position.x += toValue(transformX);
		receivedData.position.y += toValue(transformY);

		receivedData.position.x -= left / toValue(zoom);
		receivedData.position.y -= top / toValue(zoom);

		// Rounded before snapping: the divisions above leave fractions, and the model keeps
		// whole-pixel coordinates even when the drop is not snapped.
		receivedData.position = snapPoint({
			x: Math.round(receivedData.position.x),
			y: Math.round(receivedData.position.y),
		}, isSnapModifier(event));

		addBlock(receivedData);
		hooks.dropNewBlock.trigger(receivedData);
	}

	function setBlockData(event, addedBlock: DiagramBlock): void
	{
		event.dataTransfer.setData('text/plain', JSON.stringify(addedBlock));
	}

	return {
		setBlockData,
		onDrop,
	};
}
