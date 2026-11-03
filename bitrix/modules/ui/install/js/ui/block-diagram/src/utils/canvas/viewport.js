import { vec2 } from '../../lib/gl-matrix';

export function viewportToCanvas(
	{ x, y }: { x: number, y: number },
	{ width, height }: { width: number, height: number },
	viewProjectionMatrixInv: Float32Array,
): { x: number, y: number }
{
	const canvas = vec2.transformMat3(
		vec2.create(),
		[(x / width) * 2 - 1, (1 - y / height) * 2 - 1],
		viewProjectionMatrixInv,
	);

	return { x: canvas[0], y: canvas[1] };
}
