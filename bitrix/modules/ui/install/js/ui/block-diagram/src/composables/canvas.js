import { toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { getDiagramBounds, NATURAL_ZOOM } from '../utils';
import type { CameraLandmark, DiagramBlock, DiagramBlockId, FitToViewParams } from '../types';

export type UseCanvas = {
	zoomIn: (zoomStep: number) => void,
	zoomOut: (zoomStep: number) => void,
	setZoom: (zoomValue: number) => void,
	setCamera: (params: Partial<CameraLandmark>) => void,
	panBy: (dxScreen: number, dyScreen: number) => void,
	goToBlock: (block: DiagramBlock) => void,
	goToBlockById: (id: DiagramBlockId) => void,
	fitToView: (params?: FitToViewParams) => void,
};

export function useCanvas(): UseCanvas
{
	const {
		zoom,
		blocks,
		blocksRectMap,
		canvasWidth,
		canvasHeight,
		canvasGridSize,
		maxZoom,
		viewportInsets,
		blockDiagramTop,
		blockDiagramLeft,
		canvas,
	} = useBlockDiagram();

	function zoomIn(zoomStep: number): void
	{
		canvas.zoomIn(zoomStep);
	}

	function zoomOut(zoomStep: number): void
	{
		canvas.zoomOut(zoomStep);
	}

	function setZoom(zoomValue: number): void
	{
		canvas.setZoom(zoomValue);
	}

	function setCamera(params: Partial<CameraLandmark>): void
	{
		canvas.setCamera(params);
	}

	function panBy(dxScreen: number, dyScreen: number): void
	{
		canvas.panBy(dxScreen, dyScreen);
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

	// Upper bound of the fitted scale: the natural size of the scheme, and never above the bound
	// the consumer set for the camera.
	function resolveMaxFitZoom(requested: number | void): number
	{
		// Checked without a cast: `Number(null)` is a finite zero, and an explicit null would pass
		// for a scale of nothing instead of falling back to the natural size.
		const fitZoom = Number.isFinite(requested) ? requested : NATURAL_ZOOM;
		const consumerZoom = Number(toValue(maxZoom));

		return Number.isFinite(consumerZoom) ? Math.min(fitZoom, consumerZoom) : fitZoom;
	}

	/**
	 * Fits the overview to the whole content of the scheme. Only the overview moves: the model of
	 * the scheme stays as it is and the history of changes is not written.
	 */
	function fitToView(params: FitToViewParams = {}): void
	{
		canvas.fitToView({
			bounds: getDiagramBounds(toValue(blocks), toValue(blocksRectMap)),
			// Read at the moment of the call: a panel of the consumer opens and closes while the
			// diagram stays mounted, and the free part of the screen moves with it.
			insets: params.insets ?? toValue(viewportInsets),
			padding: params.padding ?? toValue(canvasGridSize),
			maxFitZoom: resolveMaxFitZoom(params.maxFitZoom),
		});
	}

	return {
		zoomIn,
		zoomOut,
		setZoom,
		setCamera,
		panBy,
		goToBlock,
		goToBlockById,
		fitToView,
	};
}
