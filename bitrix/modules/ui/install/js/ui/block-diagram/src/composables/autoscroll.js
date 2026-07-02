import { toValue } from 'ui.vue3';

const SCROLL_THRESHOLD = 80;
const BASE_SPEED = 8;
const HARD_CAP = 20;

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

	const getAxisSpeed = (penetration: number): number => {
		if (penetration <= 0)
		{
			return 0;
		}

		const t = penetration / SCROLL_THRESHOLD;
		const speed = BASE_SPEED * t * t;

		return Math.min(speed, HARD_CAP);
	};

	const scrollLoop = () => {
		if (!rect || !activeCallback)
		{
			return;
		}

		let dx = 0;
		let dy = 0;

		const leftPenetration = (rect.left + SCROLL_THRESHOLD) - mouseX;
		const rightPenetration = mouseX - (rect.right - SCROLL_THRESHOLD);
		const topPenetration = (rect.top + SCROLL_THRESHOLD) - mouseY;
		const bottomPenetration = mouseY - (rect.bottom - SCROLL_THRESHOLD);

		if (leftPenetration > 0)
		{
			dx = -getAxisSpeed(leftPenetration);
		}
		else if (rightPenetration > 0)
		{
			dx = getAxisSpeed(rightPenetration);
		}

		if (topPenetration > 0)
		{
			dy = -getAxisSpeed(topPenetration);
		}
		else if (bottomPenetration > 0)
		{
			dy = getAxisSpeed(bottomPenetration);
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
