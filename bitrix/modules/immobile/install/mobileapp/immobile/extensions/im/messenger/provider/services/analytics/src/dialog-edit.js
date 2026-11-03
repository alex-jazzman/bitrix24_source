/**
 * @module im/messenger/provider/services/analytics/dialog-edit
 */
jn.define('im/messenger/provider/services/analytics/dialog-edit', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Type } = require('type');

	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper } = require('im/messenger/lib/helper');

	const { AnalyticsHelper} = require('im/messenger/provider/services/analytics/helper');

	class DialogEdit
	{
		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
		}

		/**
		 * @param {DialogId} dialogId
		 */
		sendDialogEditHeaderMenuClick(dialogId)
		{
			if (Type.isNull(dialogId))
			{
				return;
			}

			const dialogModelState = this.store.getters['dialoguesModel/getById'](dialogId);
			const dialogHelper = DialogHelper.createByModel(dialogModelState);

			if (!dialogHelper)
			{
				return;
			}

			const category = AnalyticsHelper.getCategoryByChat(dialogModelState);
			const analyticsEvent = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(Analytics.Event.clickEdit)
				.setSection(Analytics.Section.sidebar)
				.setSubSection(Analytics.SubSection.contextMenu)
				.setP1(AnalyticsHelper.getP1ByDialog(dialogModelState))
				.setP5(AnalyticsHelper.getFormattedChatId(dialogModelState.chatId))
			;

			if (category === Analytics.Category.project)
			{
				const projectId = AnalyticsHelper.getFormattedProjectId(dialogModelState);
				if (projectId)
				{
					analyticsEvent.setP4(projectId);
				}
			}

			analyticsEvent.send();
		}

		/**
		 * @param {DialogId|DialoguesModelState} dialog
		 */
		sendDialogEditButtonDoneDialogInfoClick(dialog)
		{
			if (Type.isNull(dialog))
			{
				return;
			}
			let dialogModelState = dialog;
			if (Type.isStringFilled(dialog))
			{
				dialogModelState = this.store.getters['dialoguesModel/getById'](dialog);
			}

			const dialogHelper = DialogHelper.createByModel(dialogModelState);
			if (!dialogHelper)
			{
				return;
			}

			const category = AnalyticsHelper.getCategoryByChat(dialogModelState);
			const analyticsEvent = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(Analytics.Event.submitEdit)
				.setSection(Analytics.Section.editor)
				.setP1(AnalyticsHelper.getP1ByDialog(dialogModelState))
				.setP2(AnalyticsHelper.getP2ByUserType())
				.setP5(AnalyticsHelper.getFormattedChatId(dialogModelState?.chatId))
			;

			if (category === Analytics.Category.project)
			{
				const projectId = AnalyticsHelper.getFormattedProjectId(dialogModelState);
				if (projectId)
				{
					analyticsEvent.setP4(projectId);
				}
			}

			analyticsEvent.send();
		}
	}

	module.exports = { DialogEdit };
});
