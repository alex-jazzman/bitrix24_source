/**
 * NODE_BLOCK_TYPES — frontend mirror of the server-side NodeBlockType enum, values are 1:1.
 */
export const NODE_BLOCK_TYPES = Object.freeze({
	BASE_SETTINGS: 'base-settings',
	CONDITION: 'condition',
	ACTION: 'action',
	FILTER: 'filter',
	OUTPUT: 'output',
	GROUP: 'group',
	RELATIONS: 'relations',
	STORAGES: 'storages',
});

export type NodeBlockType = $Values<typeof NODE_BLOCK_TYPES>;

/**
 * BlockDescriptor — the registration shape of a block in the registry.
 */
export type BlockDescriptor = {
	// business type of the block (key in the availableBlocks descriptor)
	type: NodeBlockType,
	// surfaces to render on: 'rules' (Settings toolbar) and/or 'basic' (Basic tab)
	surfaces: Array<'rules' | 'basic'>,
	// sort order (stable for existing blocks: condition < action < filter < output)
	sort: number,
	// how to add from the Settings toolbar (optional; absent means the block has no toolbar button)
	toolbar?: {
		// CONSTRUCTION_TYPES value actually written to the store (condition → condition:if)
		constructionType: string,
		// message code for the button label
		labelMessageCode: string,
		className: string,
		testId: string,
		// render position: 'button' (primary button) | 'more' (three-dot menu)
		placement?: 'button' | 'more',
	},
	// availability predicate by context (e.g. filter — input port only)
	applies?: (ctx: { currentRuleType: string }) => boolean,
};
