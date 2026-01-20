import { BLOCK_TYPES } from '../../../shared/constants';

export const DRAG_ITEM_SLOT_NAMES: { [string]: string } = {
	default: 'drag-item',
	[BLOCK_TYPES.SIMPLE]: `drag-item:${BLOCK_TYPES.SIMPLE}`,
	[BLOCK_TYPES.TRIGGER]: `drag-item:${BLOCK_TYPES.TRIGGER}`,
	[BLOCK_TYPES.COMPLEX]: `drag-item:${BLOCK_TYPES.COMPLEX}`,
	[BLOCK_TYPES.FRAME]: `drag-item:${BLOCK_TYPES.FRAME}`,
	[BLOCK_TYPES.TOOL]: `drag-item:${BLOCK_TYPES.TOOL}`,
};
