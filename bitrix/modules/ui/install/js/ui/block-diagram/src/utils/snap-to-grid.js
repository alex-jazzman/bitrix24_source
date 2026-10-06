// Divisor turning the base grid cell into the snap step. The default zoom ladder takes its
// finest level from the same constant (src/utils/canvas/grid.js), so the step a block snaps
// to and the finest line the canvas draws stay one and the same value by construction.
export const GRID_SUBDIVISION = 4;

type Point = {
	x: number;
	y: number;
};

export function snapValueToGrid(value: number, step: number): number
{
	// a disabled or broken step keeps the previous free positioning instead of dividing by zero
	if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0)
	{
		return value;
	}

	return Math.round(value / step) * step;
}

export function snapPointToGrid(point: Point, step: number): Point
{
	return {
		x: snapValueToGrid(point.x, step),
		y: snapValueToGrid(point.y, step),
	};
}
