import { toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import type { DiagramBlock, DiagramBlockId } from '../types';

export type UseCanvas = {
	zoomIn: (zoomStep: number) => void,
	zoomOut: (zoomStep: number) => void,
	setCamera: (params: { x: number, y: number, zoom: number}) => void,
	goToBlock: (block: DiagramBlock) => void,
	goToBlockById: (id: DiagramBlockId) => void,
};

export function useCanvas(): UseCanvas
{
	const {
		zoom,
		blocks,
		canvasWidth,
		canvasHeight,
		blockDiagramTop,
		blockDiagramLeft,
		canvasInstance,
	} = useBlockDiagram();

	function zoomIn(zoomStep: number): void
	{
		toValue(canvasInstance)?.zoomIn(zoomStep);
	}

	function zoomOut(zoomStep: number): void
	{
		toValue(canvasInstance)?.zoomOut(zoomStep);
	}

	function setZoom(zoomValue: number): void
	{
		toValue(canvasInstance)?.setZoom(zoomValue);
	}

	function setCamera(params: { x: number, y: number, zoom: number}): void
	{
		toValue(canvasInstance)?.setCamera(params);
	}

	function goToBlock(block: DiagramBlock): void
	{
		if (!block?.position || !block?.dimensions)
		{
			return;
		}

		const { x, y } = block.position;
		const { width, height } = block.dimensions;
		const centerX = x + (width / 2);
		const centerY = y + (height / 2);

		setCamera({
			x: centerX - (toValue(canvasWidth) / 2 / toValue(zoom)) - toValue(blockDiagramLeft) / toValue(zoom),
			y: centerY - (toValue(canvasHeight) / 2 / toValue(zoom)) - toValue(blockDiagramTop) / toValue(zoom),
		});
	}

	function goToBlockById(id: DiagramBlockId): void
	{
		goToBlock(toValue(blocks).find((block) => block.id === id));
	}

	return {
		zoomIn,
		zoomOut,
		setZoom,
		setCamera,
		goToBlock,
		goToBlockById,
	};
}
