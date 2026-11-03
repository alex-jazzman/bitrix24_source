/** @module tasks/statemanager/redux/slices/checklists/api */
jn.define('tasks/statemanager/redux/slices/checklists/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { ChecklistEntityType } = require('tasks/checklist/enum');

	const TASK = ChecklistEntityType.TASK.getValue();

	/**
	 * @param {RunActionParams} params
	 * @return {Promise<RunActionResponse>}
	 */
	const runAction = ({ action, options, json = false }) => new Promise((resolve) => {
		const executor = new RunActionExecutor(action, options);
		if (json)
		{
			executor.enableJson();
		}

		executor.setHandler(resolve).call(false).catch(console.error);
	});

	/**
	 * @param {'task'|'template'} entityType
	 * @param {string} action
	 * @return {string}
	 */
	const v2Action = (entityType, action) => (
		ChecklistEntityType.isTemplate(entityType)
			? `tasks.v2.Template.CheckList.${action}`
			: `tasks.v2.CheckList.${action}`
	);

	/**
	 * @param {'task'|'template'} entityType
	 * @return {string}
	 */
	const entityKey = (entityType) => (
		ChecklistEntityType.isTemplate(entityType) ? ChecklistEntityType.TEMPLATE.getValue() : TASK
	);

	/**
	 * @param {ChecklistGetParams} params
	 * @return {Promise<RunActionResponse>}
	 */
	const getList = ({ entityType, entityId }) => runAction({
		action: 'tasksmobile.Checklist.get',
		options: {
			entityId,
			entityType,
			// backward compatibility: the proxy accepts taskId when entityType==='task'
			...(ChecklistEntityType.isTask(entityType) ? { taskId: entityId } : {}),
		},
	});

	/**
	 * @param {ChecklistSaveParams} params
	 * @return {Promise<RunActionResponse>}
	 */
	const save = ({ entityType, entityId, payload, skipNotification = false }) => runAction({
		action: v2Action(entityType, 'save'),
		options: {
			[entityKey(entityType)]: { id: entityId, checklist: payload },
			skipNotification,
		},
		json: true,
	});

	/**
	 * @param {ChecklistToggleBatchParams} params
	 * @return {Promise<RunActionResponse>}
	 */
	const toggleItemsBatch = ({ entityType, entityId, serverIds, isComplete }) => runAction({
		action: v2Action(entityType, isComplete ? 'complete' : 'renew'),
		options: {
			[entityKey(entityType)]: {
				id: entityId,
				checklist: serverIds.map((id) => ({ id })),
			},
		},
		json: true,
	});

	/**
	 * @param {ChecklistExpandStateParams} params
	 * @return {Promise<RunActionResponse>}
	 */
	const collapse = ({ entityType, entityId, checklistId }) => runAction({
		action: v2Action(entityType, 'collapse'),
		options: ChecklistEntityType.isTemplate(entityType)
			? { templateId: entityId, checkListId: checklistId }
			: { taskId: entityId, checkListId: checklistId },
		json: true,
	});

	/**
	 * @param {ChecklistExpandStateParams} params
	 * @return {Promise<RunActionResponse>}
	 */
	const expand = ({ entityType, entityId, checklistId }) => runAction({
		action: v2Action(entityType, 'expand'),
		options: ChecklistEntityType.isTemplate(entityType)
			? { templateId: entityId, checkListId: checklistId }
			: { taskId: entityId, checkListId: checklistId },
		json: true,
	});

	module.exports = {
		getList,
		save,
		toggleItemsBatch,
		collapse,
		expand,
	};
});
