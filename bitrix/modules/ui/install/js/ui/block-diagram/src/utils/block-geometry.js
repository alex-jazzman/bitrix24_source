import { Type } from 'main.core';
import { toValue } from 'ui.vue3';

import { getOwnRecord } from './own-record';
import { type DiagramBlock, type Point } from '../types';

export type BlockSize = {
	width: number,
	height: number,
};

// A node whose model position is unusable is left out: one non-finite coordinate spreads NaN over
// the whole box.
export function getUsablePosition(block: DiagramBlock): Point | null
{
	const position = toValue(block)?.position;

	if (!Type.isObjectLike(position))
	{
		return null;
	}

	const x = Number(position.x);
	const y = Number(position.y);

	if (!Number.isFinite(x) || !Number.isFinite(y))
	{
		return null;
	}

	return { x, y };
}

// Size of a node for the geometry of the selection: the geometry measured on its mount, then the
// dimensions of the model, then the default size of the diagram. Reading it off the cache instead
// of the markup keeps a frame of a gesture free of synchronous layout.
export function getSelectionBlockSize(
	block: DiagramBlock,
	blocksRectMap: Object,
	defaultBlockSize: BlockSize,
): BlockSize
{
	const measured = getOwnRecord(blocksRectMap, toValue(block).id);

	if (Type.isObjectLike(measured)
		&& Number.isFinite(measured.width)
		&& Number.isFinite(measured.height))
	{
		return { width: measured.width, height: measured.height };
	}

	const dimensions = toValue(block).dimensions;

	return {
		width: dimensions?.width || defaultBlockSize.width,
		height: dimensions?.height || defaultBlockSize.height,
	};
}
