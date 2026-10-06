// Register existing blocks on first module import
import './blocks';

export { isNodeRuleType } from './blocks';

export { NODE_BLOCK_TYPES } from './types';
export type { NodeBlockType, BlockDescriptor } from './types';

export {
	registerBlock,
	getBlockDescriptor,
	getAvailableBlockDescriptors,
	normalizeAvailableBlocks,
} from './registry';
