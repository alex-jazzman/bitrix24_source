import { toValue } from 'ui.vue3';

const SCROLL_THRESHOLD = 80;
const MAX_SPEED = 4;

type AutoScrollCallback = (dx: number, dy: number) => void;

export type UseAutoScroll = {
	start: (event: MouseEvent, callback: AutoScrollCallback) => void,
	stop: () => void,
	updateMousePosition: (event: MouseEvent) => void,
};

export function useAutoScroll(state: any, actions: any): UseAutoScroll
{
	let rafId = null;
	let mouseX = 0;
	let mouseY = 0;
	let rect = null;
	let activeCallback = null;

	const scrollLoop = () => {
		if (!rect || !activeCallback)
		{
			return;
		}

		let dx = 0;
		let dy = 0;

		if (mouseX < rect.left + SCROLL_THRESHOLD)
		{
			dx = -MAX_SPEED;
		}
		else if (mouseX > rect.right - SCROLL_THRESHOLD)
		{
			dx = MAX_SPEED;
		}

		if (mouseY < rect.top + SCROLL_THRESHOLD)
		{
			dy = -MAX_SPEED;
		}
		else if (mouseY > rect.bottom - SCROLL_THRESHOLD)
		{
			dy = MAX_SPEED;
		}

		if (dx !== 0 || dy !== 0)
		{
			const currentZoom = toValue(state.zoom);

			actions.setCamera({
				x: toValue(state.transformX) + (dx / currentZoom),
				y: toValue(state.transformY) + (dy / currentZoom),
				zoom: currentZoom,
			});
			activeCallback(dx, dy);
		}

		rafId = requestAnimationFrame(scrollLoop);
	};

	const start = (event: MouseEvent, callback: AutoScrollCallback): void => {
		const el = toValue(state.canvasRef);
		if (el)
		{
			rect = el.getBoundingClientRect();
		}

		mouseX = event.clientX;
		mouseY = event.clientY;
		activeCallback = callback;

		if (!rafId)
		{
			rafId = requestAnimationFrame(scrollLoop);
		}
	};

	const stop = (): void => {
		if (rafId)
		{
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		rect = null;
		activeCallback = null;
	};

	const updateMousePosition = (event: MouseEvent): void => {
		mouseX = event.clientX;
		mouseY = event.clientY;
	};

	return {
		start,
		stop,
		updateMousePosition,
	};
}
