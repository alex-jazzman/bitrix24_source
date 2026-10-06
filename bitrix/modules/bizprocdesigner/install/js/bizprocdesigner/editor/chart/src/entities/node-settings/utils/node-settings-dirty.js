import { type Port } from '../../../shared/types';
import { type NodeSettings } from '../types';

type NodeSettingsFormState = {
	nodeSettings: NodeSettings | null,
	prevSavedNodeSettings: NodeSettings | null,
	ports: Array<Port> | null,
	blockPorts: Array<Port> | null,
};

const isTextChanged = (value: ?string, prevValue: ?string): boolean => {
	return (value ?? '').trim() !== (prevValue ?? '').trim();
};

/**
 * Order-sensitive fingerprint of the constructions of a rule collection (rules or relations):
 * the construction ids of every card, cards separated. The stored order is what the server turns
 * into the node graph, so moving a construction is a real change even when the set stays the same.
 * Cards without constructions are left out: they are dropped from the save payload anyway, so an
 * empty group added from the "..." menu must not read as an unsaved change.
 */
const constructionsSignature = (settingsItems: ?Map<string, Object>): string => {
	return [...(settingsItems?.values() ?? [])]
		.flatMap((item: Object) => (item.ruleCards ?? []))
		.map((ruleCard: Object) => (ruleCard.constructions ?? []).map((construction) => construction.id).join(','))
		.filter((signature: string) => signature !== '')
		.join('|');
};

const areConstructionsChanged = (
	settingsItems: ?Map<string, Object>,
	prevSettingsItems: ?Map<string, Object>,
): boolean => {
	return constructionsSignature(settingsItems) !== constructionsSignature(prevSettingsItems);
};

/**
 * Tells whether the complex node form holds unsaved changes.
 *
 * The base is prevSavedNodeSettings: the snapshot fetchNodeSettings() takes once the node is fully
 * loaded (after every auto-initialization and after the normalisation of the construction order),
 * and the one discardFormSettings() reverts to, so "dirty" means "discarding would change something".
 *
 * The block itself is not a valid base for the title: node.title keeps the catalog default
 * of the node type and is not rewritten on rename, while nodeSettings.title stays empty
 * while the saved title equals that default.
 *
 * Constructions are compared by identity and order, not by content: that is what tells apart
 * an added, removed or moved block. The order the store normalises at load time is part of the
 * snapshot, so opening a node saved before the fixed section order reads as unchanged and the
 * stored payload keeps its own order until the user really saves the node.
 */
export const areNodeSettingsDirty = ({
	nodeSettings,
	prevSavedNodeSettings,
	ports,
	blockPorts,
}: NodeSettingsFormState): boolean => {
	if (!nodeSettings || !prevSavedNodeSettings)
	{
		return false;
	}

	return (ports ?? []).length !== (blockPorts ?? []).length
		|| isTextChanged(nodeSettings.title, prevSavedNodeSettings.title)
		|| isTextChanged(nodeSettings.description, prevSavedNodeSettings.description)
		|| areConstructionsChanged(nodeSettings.rules, prevSavedNodeSettings.rules)
		|| areConstructionsChanged(nodeSettings.relations, prevSavedNodeSettings.relations);
};
