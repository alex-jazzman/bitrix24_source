import RBush from '../../lib/r-bush/r-bush';
import { toValue } from 'ui.vue3';
import type { DiagramBlock } from '../../types';

type BBox = {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export class BlockRBush extends RBush
{
	toBBox({ position, dimensions }: DiagramBlock): BBox
	{
		return {
			minX: toValue(position).x,
			minY: toValue(position).y,
			maxX: toValue(position).x + toValue(dimensions).width,
			maxY: toValue(position).y + toValue(dimensions).height,
		};
	}

	compareMinX(
		{ position: positionA }: DiagramBlock,
		{ position: positionB }: DiagramBlock,
	): number
	{
		return toValue(positionA).x - toValue(positionB).x;
	}

	compareMinY(
		{ position: positionA }: DiagramBlock,
		{ position: positionB }: DiagramBlock,
	): number
	{
		return toValue(positionA).y - toValue(positionB).y;
	}
}
