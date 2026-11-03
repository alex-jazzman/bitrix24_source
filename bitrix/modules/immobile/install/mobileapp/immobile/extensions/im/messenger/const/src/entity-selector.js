/**
 * @module im/messenger/const/entity-selector
 */
jn.define('im/messenger/const/entity-selector', (require, exports, module) => {
	const EntitySelectorElementType = {
		user: 'user',
		department: 'department',
		structureNode: 'structure-node',
	};

	/**
	 * Element types that stand for a node of the org structure. People and nodes reach a chat by
	 * different methods, so the border between them is a list of its own: an element of a type that
	 * is not on it must not silently fall into either call.
	 *
	 * A team is addressed as `structure-node` and a department as `department`; the composition of a
	 * chat comes back in both forms, so the selection can carry either.
	 */
	const StructureNodeElementTypes = Object.freeze([
		EntitySelectorElementType.department,
		EntitySelectorElementType.structureNode,
	]);

	/**
	 * Contexts the member selector keeps its history of picks in. The server stores the recent by
	 * the pair user + context, so the forms of a chat and the "add members" window share one: a
	 * department or a team picked in one of them stands in the recent tab of the other.
	 */
	const EntitySelectorContext = Object.freeze({
		chatMembers: 'IMMOBILE_UPDATE_GROUP_CHAT_PARTICIPANT',
	});

	module.exports = { EntitySelectorElementType, StructureNodeElementTypes, EntitySelectorContext };
});
