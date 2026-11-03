import { ref, toValue, watch } from 'ui.vue3';
import { Dom, Browser } from 'main.core';

import { useBlockDiagram } from './block-diagram';
import { Grid, GRID_DEFAULT_SIZE, GRID_DEFAULT_ZOOM_STEPS } from '../utils';

export type UseCanvasTransform = {
	isDragging: boolean,
	onMounted: () => void,
	onUnmounted: () => void,
	onMouseDown: (event: MouseEvent) => void,
};

export type UseCanvasTransformOptions = {
	canvasRef: HTMLElement,
	transformLayoutRef: HTMLElement,
	canvasStyle: newCanvasStyle,
};

export type CanvasStyleZoomStep = {
	zoom: number,
	size?: number,
	gridColor?: string,
};

const CANVAS_STYLE_DEFAULT_OPTIONS: {...} = {
	grid: {
		options: {
			size: GRID_DEFAULT_SIZE,
			gridColor: '#A1B8D9',
			backgroundColor: '#ECF0F2',
			zoomSteps: GRID_DEFAULT_ZOOM_STEPS,
		},
		instance: Grid,
	},
};

// eslint-disable-next-line max-lines-per-function
export function useCanvasTransfrom(options: UseCanvasTransformOptions): UseCanvasTransform
{
	const {
		canvasRef: newCanvasRef,
		transformLayoutRef: newTransformLayoutRef,
		canvasStyle: newCanvasStyle,
		zoomSensitivity,
		zoomSensitivityMouse,
	} = options;

	const {
		isDisabledBlockDiagram,
		transformX,
		transformY,
		zoom,
		canvasRef,
		transformLayoutRef,
		canvasWidth,
		canvasHeight,
		canvas,
		blockIntersections,
	} = useBlockDiagram();

	const dragOn = ref(false);
	const isDragging = ref(false);
	const zooming = ref(false);

	let requestAnimationId = null;
	// The element the canvas was attached to. The detach names it so that a component unmounted
	// after a later one mounted does not drop the binding that later one made.
	let attachedCanvasElement = null;

	watch(
		[transformX, transformY, zoom, canvasWidth, canvasHeight],
		() => {
			blockIntersections.selectVisibleBlocks();
			blockIntersections.selectVisibleConnections();
		},
	);

	function getCanvasStyleOptions(canvasStyle: CanvasStyle): CanvasStyle | null
	{
		if (canvasStyle && canvasStyle.style in CANVAS_STYLE_DEFAULT_OPTIONS)
		{
			return {
				instance: CANVAS_STYLE_DEFAULT_OPTIONS[canvasStyle.style].instance,
				options: {
					...CANVAS_STYLE_DEFAULT_OPTIONS[canvasStyle.style].options,
					...canvasStyle,
				},
			};
		}

		return null;
	}

	function onMounted(): void
	{
		canvasRef.value = newCanvasRef;
		transformLayoutRef.value = newTransformLayoutRef;

		attachedCanvasElement = toValue(newCanvasRef);
		canvas.attach(
			attachedCanvasElement,
			getCanvasStyleOptions(newCanvasStyle),
		);

		render();
	}

	function onUnmounted(): void
	{
		cancelAnimationFrame(requestAnimationId);
		canvas.detach(attachedCanvasElement);
		attachedCanvasElement = null;
	}

	function onMouseDown(event: MouseEvent): void
	{
		if (toValue(isDisabledBlockDiagram))
		{
			return;
		}

		dragOn.value = true;
		canvas.setCameraPositionByMouseDown(event);
	}

	function onMouseMove(event: MouseEvent): void
	{
		if (!toValue(dragOn) || toValue(isDisabledBlockDiagram))
		{
			return;
		}

		if (event.buttons !== 1 && event.buttons !== 4)
		{
			dragOn.value = false;
			isDragging.value = false;

			return;
		}

		isDragging.value = true;
		canvas.setCameraPositionByMouseMove(event);
	}

	function onMouseUp(): void
	{
		dragOn.value = false;
		isDragging.value = false;
	}

	function onWheel(event: WheelEvent): void
	{
		event.preventDefault();

		if (toValue(isDisabledBlockDiagram))
		{
			return;
		}

		const isTrackpad = event.wheelDeltaY
			? event.wheelDeltaY === -3 * event.deltaY
			: event.deltaMode === 0;

		const isCmd = Browser.isMac() && event.metaKey;
		if (event.ctrlKey || isCmd)
		{
			const zoomChange = isTrackpad
				? -event.deltaY * toValue(zoomSensitivity)
				: -Math.sign(event.deltaY) * toValue(zoomSensitivityMouse);

			zooming.value = true;
			canvas.setCameraZoomByWheel(event, zoomChange);

			setTimeout(() => {
				zooming.value = false;
			}, 200);
		}
		else
		{
			canvas.setCameraPositionByWheel(event);
		}
	}

	// The timestamp of the frame is handed to the canvas: a move of the overview lives in this very
	// loop, and the clock of the loop is the one it has to step by.
	function render(now: number): void
	{
		canvas.render(now);

		const viewMatrix = canvas.viewMatrix;

		Dom.style(
			toValue(transformLayoutRef),
			'transform',
			`
				matrix(
					${viewMatrix[0]}, 0, 0, ${viewMatrix[4]}, ${viewMatrix[6]}, ${viewMatrix[7]}
				)
			`,
		);

		requestAnimationId = requestAnimationFrame(render);
	}

	return {
		isDragging,
		onMounted,
		onUnmounted,
		onMouseDown,
		onMouseMove,
		onMouseUp,
		onWheel,
	};
}
