import type { BlockDescriptor, NodeBlockType } from './types';
import { NODE_BLOCK_TYPES } from './types';
import type { AvailableBlocks } from '../types';

/** Internal registry: type → BlockDescriptor */
const _registry: Map<NodeBlockType, BlockDescriptor> = new Map();

/**
 * registerBlock — additive block registration in the registry.
 */
export const registerBlock = (descriptor: BlockDescriptor): void => {
	_registry.set(descriptor.type, descriptor);
};

/**
 * getBlockDescriptor — retrieve a descriptor by type.
 */
export const getBlockDescriptor = (type: NodeBlockType): ?BlockDescriptor => {
	return _registry.get(type) ?? null;
};

/**
 * getAvailableBlockDescriptors — intersection of:
 *   registered ∩ available:true ∩ surface ∩ applies(ctx)
 * Result is sorted by sort.
 * An unregistered but available:true type is silently ignored — the frontend does not crash.
 */
export const getAvailableBlockDescriptors = (
	availableBlocks: AvailableBlocks,
	ctx: { surface: 'rules' | 'basic', currentRuleType?: string },
): BlockDescriptor[] => {
	const { surface, currentRuleType = '' } = ctx;
	const result: BlockDescriptor[] = [];

	_registry.forEach((descriptor) => {
		// Check availability against the server descriptor
		const blockEntry = availableBlocks[descriptor.type];
		if (!blockEntry?.available)
		{
			return;
		}

		// Check surface
		if (!descriptor.surfaces.includes(surface))
		{
			return;
		}

		// Check the applies predicate
		if (descriptor.applies && !descriptor.applies({ currentRuleType }))
		{
			return;
		}

		result.push(descriptor);
	});

	result.sort((a, b) => a.sort - b.sort);

	return result;
};

/**
 * normalizeAvailableBlocks — builds AvailableBlocks from the loaded descriptor, or falls back to
 * the legacy default when the server did not send availableBlocks (transition period).
 *
 * Legacy default:
 *   condition + action + output = true
 *   filter = filterSupported
 *   relations = complexNodeConnections (gated via fallbackCtx)
 *   everything else = false
 */
export const normalizeAvailableBlocks = (
	loaded: ?AvailableBlocks,
	fallbackCtx: {
		filterSupported?: boolean,
		complexNodeConnections?: boolean,
	} = {},
): AvailableBlocks => {
	if (loaded && typeof loaded === 'object' && Object.keys(loaded).length > 0)
	{
		return loaded;
	}

	// Legacy default: preserve the prior node behaviour until the server descriptor arrives
	const { filterSupported = false, complexNodeConnections = false } = fallbackCtx;

	return {
		[NODE_BLOCK_TYPES.BASE_SETTINGS]: { available: false, constraints: null },
		[NODE_BLOCK_TYPES.CONDITION]: { available: true, constraints: null },
		[NODE_BLOCK_TYPES.ACTION]: { available: true, constraints: null },
		[NODE_BLOCK_TYPES.FILTER]: { available: filterSupported, constraints: null },
		[NODE_BLOCK_TYPES.OUTPUT]: { available: true, constraints: null },
		[NODE_BLOCK_TYPES.GROUP]: { available: false, constraints: null },
		[NODE_BLOCK_TYPES.RELATIONS]: { available: complexNodeConnections, constraints: null },
		[NODE_BLOCK_TYPES.STORAGES]: { available: false, constraints: null },
	};
};
