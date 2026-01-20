/**
 * @module tasks/checklist/utils/src/open
 */
jn.define('tasks/checklist/utils/src/open', (require, exports, module) => {
	const { ChecklistController } = require('tasks/checklist/controller');
	const { Loc } = require('loc');
	const { showToast } = require('toast');

	/**
	 * @param params
	 * @param {number} params.taskId
	 * @param {number} params.userId
	 * @param {Object} params.checklistTree
	 * @param {number} params.checklistId
	 * @param {Object} [params.parentWidget=PageManager]
	 * @param {boolean} [params.inLayout=true]
	 * @param {boolean} [params.hideCompleted=false]
	 * @param {Function} [params.onChange=()=>{}]
	 * @param {number|null} [params.groupId=null]
	 * @returns {void}
	 */
	const openChecklistWithPreparedData = async (params) => {
		const {
			taskId,
			userId,
			checklistTree,
			checklistId,
			parentWidget = PageManager,
			inLayout = false,
			hideCompleted = false,
			onChange = () => {},
			groupId = null,
		} = params || {};

		if (!taskId || !userId)
		{
			return;
		}

		const checklistController = new ChecklistController({
			taskId,
			userId,
			groupId,
			inLayout,
			hideCompleted,
			parentWidget,
			checklistTree,
			onChange: () => {
				if (typeof onChange === 'function')
				{
					onChange(checklistController);
				}
			},
		});

		const { getDiskFolderId } = await requireLazy('tasks:disk');

		if (groupId)
		{
			checklistController.setGroupId(groupId);
			await getDiskFolderId(groupId).then(({ diskFolderId }) => {
				checklistController.setDiskConfig({ folderId: diskFolderId });
			}).catch(console.error);
		}

		const checklist = checklistController.getChecklistById(checklistId);

		if (!checklist)
		{
			void showToast({
				message: Loc.getMessage('TASKSMOBILE_CHECKLIST_CONTROLLER_DELETE_CHECKLIST'),
				layoutWidget: parentWidget,
			});

			return;
		}

		void checklistController.openChecklist({
			checklist,
			parentWidget: checklistController.getParentWidgetByChecklistId(checklistId),
		});
	};

	module.exports = {
		openChecklistWithPreparedData,
	};
});
