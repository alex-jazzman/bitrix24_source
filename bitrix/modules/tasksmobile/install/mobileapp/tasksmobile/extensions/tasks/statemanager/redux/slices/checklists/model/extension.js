/** @module tasks/statemanager/redux/slices/checklists/model */
jn.define('tasks/statemanager/redux/slices/checklists/model', (require, exports, module) => {
	const {
		ROOT_PARENT_ID,
		makeStoreId,
		makeEntityKey,
		serverItemIds,
		isRootRaw,
	} = require('tasks/statemanager/redux/slices/checklists/model/src/common');
	const {
		makeChecklistFromRaw,
		makeItemFromRaw,
		makeNewChecklist,
		makeNewItem,
	} = require('tasks/statemanager/redux/slices/checklists/model/src/factory');
	const {
		splitFlatList,
		buildDisplayIndexes,
		buildFetchMergeMaps,
		isKnownServerEntity,
	} = require('tasks/statemanager/redux/slices/checklists/model/src/tree');
	const {
		collectCompletionCascade,
		computeAncestorCompletion,
		calcCounters,
	} = require('tasks/statemanager/redux/slices/checklists/model/src/completion');
	const {
		collectSubtreeIds,
		nextSortIndex,
		buildLocalAttachmentIndex,
	} = require('tasks/statemanager/redux/slices/checklists/model/src/entities');
	const {
		mergeServerModelsIntoSlice,
	} = require('tasks/statemanager/redux/slices/checklists/model/src/merge');
	const {
		rekeyStoreId,
		rekeyEntityRecords,
	} = require('tasks/statemanager/redux/slices/checklists/model/src/rekey');
	const {
		markEntityDirty,
		clearEntityDirty,
		isEntityDirty,
		moveEntityDirty,
	} = require('tasks/statemanager/redux/slices/checklists/model/src/dirty');
	const {
		itemToSaveDTO,
		checklistToSaveDTO,
		buildSavePayload,
		mapMembersUppercase,
		toDodRequestData,
	} = require('tasks/statemanager/redux/slices/checklists/model/src/serializer');

	module.exports = {
		ROOT_PARENT_ID,
		makeStoreId,
		makeEntityKey,
		serverItemIds,
		isRootRaw,
		makeChecklistFromRaw,
		makeItemFromRaw,
		makeNewChecklist,
		makeNewItem,
		splitFlatList,
		buildDisplayIndexes,
		collectCompletionCascade,
		computeAncestorCompletion,
		collectSubtreeIds,
		nextSortIndex,
		buildLocalAttachmentIndex,
		buildFetchMergeMaps,
		isKnownServerEntity,
		mergeServerModelsIntoSlice,
		rekeyStoreId,
		rekeyEntityRecords,
		markEntityDirty,
		clearEntityDirty,
		isEntityDirty,
		moveEntityDirty,
		calcCounters,
		itemToSaveDTO,
		checklistToSaveDTO,
		buildSavePayload,
		mapMembersUppercase,
		toDodRequestData,
	};
});
