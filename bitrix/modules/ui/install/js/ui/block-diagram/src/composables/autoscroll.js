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
	let activeCallback = null;

	// Re-measured every frame: layout may shift or the page may scroll mid-gesture.
	const getCanvasRect = (): DOMRect | null => {
		return toValue(state.canvasRef)?.getBoundingClientRect() ?? null;
	};

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
		const rect = getCanvasRect();
		if (!rect || !activeCallback)
		{
			// Leaving the loop must clear the frame id, otherwise the next start sees it as running.
			rafId = null;

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
			actions.panCamera(dx, dy);
			activeCallback(dx, dy);
		}

		rafId = requestAnimationFrame(scrollLoop);
	};

	// The press only arms the autoscroll: the loop is left to the first move of the pointer.
	// Started here it would pan the camera under a gesture that has not begun - a plain click on a
	// block standing in the edge threshold carries the canvas away with the mouse never moving.
	// When the gesture begins is for the gesture to say, and it says it by reporting the pointer:
	// a drag reports it past its threshold, a selection frame or a resize from the first move.
	const start = (event: MouseEvent, callback: AutoScrollCallback): void => {
		mouseX = event.clientX;
		mouseY = event.clientY;
		activeCallback = callback;
	};

	const stop = (): void => {
		if (rafId)
		{
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		activeCallback = null;
	};

	const updateMousePosition = (event: MouseEvent): void => {
		mouseX = event.clientX;
		mouseY = event.clientY;

		if (!activeCallback || rafId)
		{
			return;
		}

		// Nothing to measure against yet: a later move arms the loop.
		if (!toValue(state.canvasRef))
		{
			return;
		}

		rafId = requestAnimationFrame(scrollLoop);
	};

	return {
		start,
		stop,
		updateMousePosition,
	};
}
