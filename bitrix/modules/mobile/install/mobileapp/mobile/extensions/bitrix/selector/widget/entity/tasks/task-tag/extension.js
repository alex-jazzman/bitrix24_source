/**
 * @module selector/widget/entity/tasks/task-tag
 */
jn.define('selector/widget/entity/tasks/task-tag', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseSelectorEntity } = require('selector/widget/entity');

	/**
	 * @class TaskTagSelector
	 */
	class TaskTagSelector extends BaseSelectorEntity
	{
		static getEntityId()
		{
			return 'task-tag';
		}

		static getContext()
		{
			return null;
		}

		static getStartTypingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_START_TYPING_TO_SEARCH_TASK_TAG');
		}

		static isCreationEnabled()
		{
			return true;
		}

		static getCreateText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_CREATE_TASK_TAG');
		}

		static getCreatingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_CREATING_TASK_TAG');
		}

		static getCreateEntityHandler(providerOptions)
		{
			return (text) => {
				return BX.ajax.runAction(
					'tasks.task.tag.create',
					{
						data: {
							tag: text,
							groupId: providerOptions.groupId,
						},
					},
				).then(
					(response) => ({
						id: response.data.id,
						entityId: this.getEntityId(),
						title: text,
					}),
					(response) => {
						console.error(response);
						Notify.showMessage(response.errors[0].message);
					},
				).catch((response) => console.error(response));
			};
		}

		static getTitle()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_PICK_TASK_TAG_2');
		}
	}

	module.exports = {
		TaskTagSelector,
	};
});

(() => {
	const require = (ext) => jn.require(ext);
	const { TaskTagSelector } = require('selector/widget/entity/tasks/task-tag');

	this.TaskTagSelector = TaskTagSelector;
})();
