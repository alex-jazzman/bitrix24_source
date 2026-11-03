/** @module tasks/checklist/utils/src/open */
jn.define('tasks/checklist/utils/src/open', (require, exports, module) => {
	const { ChecklistController } = require('tasks/checklist/controller');
	const { Loc } = require('loc');
	const { requireLazy } = require('require-lazy');
	const { showToast } = require('toast');

	/**
	 * @param {ChecklistOpenPreparedParams} params
	 * @returns {void}
	 */
	const openChecklistWithPreparedData = async (params) => {
		const {
			taskId,
			userId,
			checklistServerId,
			parentWidget = PageManager,
			inLayout = false,
			onChange = () => {},
			groupId = null,
			diskConfig = null,
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
			parentWidget,
			diskConfig,
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

		// no tree is passed - init() loads the task's checklists from V2 (tasksmobile.Checklist.get)
		await checklistController.init();

		const checklist = checklistController.getChecklistByServerId(checklistServerId);

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
			parentWidget: checklistController.getParentWidgetByChecklistId(checklist.getId()),
		});
	};

	module.exports = {
		openChecklistWithPreparedData,
	};
});
