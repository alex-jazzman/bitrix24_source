import { PORT_TYPES, PORTLESS_RULE_TYPE } from '../../../shared/constants';
import { CONSTRUCTION_TYPES } from '../constants';
import { NODE_BLOCK_TYPES } from './types';
import { registerBlock } from './registry';

/**
 * Registration of existing blocks: condition, action, filter, output.
 * Sort order: base-settings=5, condition=10, action=20, filter=30, output=40 —
 * base-settings sorts first but has no toolbar button (re-add is via dedicated UI).
 */

/**
 * Rules the node keeps for itself: those of an input port and those of the reserved container of a
 * node without input ports. Relation rules are the other kind and host neither the base settings
 * nor a filter.
 * Exported because the toolbar asks the very same question about the base-settings chip: two
 * readings of the context would offer a chip for a block the registry does not give out, or the
 * other way round.
 */
export const isNodeRuleType = (ruleType: string): boolean => {
	return ruleType === PORT_TYPES.input || ruleType === PORTLESS_RULE_TYPE;
};

// Base Settings: host-merged block (Variant A), rules of the node itself only.
// No primary toolbar button; re-add is handled by add-construction.js re-add pane.
registerBlock({
	type: NODE_BLOCK_TYPES.BASE_SETTINGS,
	surfaces: ['rules'],
	sort: 5,
	applies: ({ currentRuleType }) => isNodeRuleType(currentRuleType),
});

// Condition — business type 'condition', the toolbar adds condition:if
registerBlock({
	type: NODE_BLOCK_TYPES.CONDITION,
	surfaces: ['rules'],
	sort: 10,
	toolbar: {
		constructionType: CONSTRUCTION_TYPES.CONDITION.IF_CONDITION,
		labelMessageCode: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_TOOLBAR_ITEM',
		className: 'condition',
		testId: 'complexNodeRuleSettingsToolbarItemConstructionIf',
		placement: 'button',
	},
});

// Action
registerBlock({
	type: NODE_BLOCK_TYPES.ACTION,
	surfaces: ['rules'],
	sort: 20,
	toolbar: {
		constructionType: CONSTRUCTION_TYPES.ACTION,
		labelMessageCode: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_TOOLBAR_ITEM',
		className: 'action',
		testId: 'complexNodeRuleSettingsToolbarItemConstructionAction',
		placement: 'button',
	},
});

// Filter: rules of the node itself only (applies predicate); whether the node gets the block
// at all is decided by the server descriptor.
registerBlock({
	type: NODE_BLOCK_TYPES.FILTER,
	surfaces: ['rules'],
	sort: 30,
	toolbar: {
		constructionType: CONSTRUCTION_TYPES.FILTER,
		labelMessageCode: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_TOOLBAR_ITEM',
		className: 'filter',
		testId: 'complexNodeRuleSettingsToolbarItemConstructionFilter',
		placement: 'button',
	},
	applies: ({ currentRuleType }) => isNodeRuleType(currentRuleType),
});

// Output
registerBlock({
	type: NODE_BLOCK_TYPES.OUTPUT,
	surfaces: ['rules'],
	sort: 40,
	toolbar: {
		constructionType: CONSTRUCTION_TYPES.OUTPUT,
		labelMessageCode: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OUTPUT_TOOLBAR_ITEM',
		className: 'output',
		testId: 'complexNodeRuleSettingsToolbarItemConstructionOutput',
		placement: 'button',
	},
});

// Group — RuleCard container, appears in the three-dot 'more' menu, not as a primary button.
// Clicking '+ Group' calls addRuleCard() directly (no constructionType — group is not a construction).
registerBlock({
	type: NODE_BLOCK_TYPES.GROUP,
	surfaces: ['rules'],
	sort: 50,
	toolbar: {
		constructionType: '',
		labelMessageCode: 'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GROUP_TOOLBAR_ITEM',
		className: 'group',
		testId: 'complexNodeRuleSettingsToolbarItemGroup',
		placement: 'more',
	},
});

// Relations — surface 'basic', no toolbar
registerBlock({
	type: NODE_BLOCK_TYPES.RELATIONS,
	surfaces: ['basic'],
	sort: 100,
});
