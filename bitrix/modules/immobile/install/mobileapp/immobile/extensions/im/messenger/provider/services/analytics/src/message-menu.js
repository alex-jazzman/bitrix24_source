/**
 * @module im/messenger/provider/services/analytics/src/message-menu
 */
jn.define('im/messenger/provider/services/analytics/src/message-menu', (require, exports, module) => {
	const { Type } = require('type');
	const { AnalyticsEvent } = require('analytics');
	const { Analytics, MessageMenuActionType, DialogType } = require('im/messenger/const');

	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { MessageHelper, DialogHelper } = require('im/messenger/lib/helper');

	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	const actionIdByEventIdCollection = {
		[MessageMenuActionType.reply]: Analytics.Event.clickReply,
		[MessageMenuActionType.copy]: Analytics.Event.copyMessage,
		[MessageMenuActionType.copyLink]: Analytics.Event.copyLink,
		[MessageMenuActionType.multiselect]: Analytics.Event.select,
		[MessageMenuActionType.edit]: Analytics.Event.clickEdit,
		[MessageMenuActionType.create]: Analytics.Event.clickCreate,
		[MessageMenuActionType.forward]: Analytics.Event.clickShare,
		[MessageMenuActionType.askCopilot]: Analytics.Event.askCopilot,
		[MessageMenuActionType.feedback]: Analytics.Event.addFeedback,
		[MessageMenuActionType.createTask]: Analytics.Event.clickCreateTask,
		[MessageMenuActionType.createEvent]: Analytics.Event.clickCreateEvent,
	};

	class MessageMenu
	{
		constructor()
		{
			/**
			 * @type {MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();
		}

		/**
		 * @param {string} messageId
		 * @param {SendMessageMenuCommonAnalyticsParams} params
		 */
		sendMessageMenuCommonTap(messageId, params)
		{
			const dialogModel = this.store.getters['dialoguesModel/getById'](params.dialogId);
			if (!dialogModel)
			{
				return;
			}

			const category = AnalyticsHelper.getCategoryByChatType(dialogModel.type);
			const event = actionIdByEventIdCollection[params.actionId];
			const p1 = AnalyticsHelper.getP1ByDialog(dialogModel);

			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(event)
				.setSection(Analytics.Section.chatWindow)
				.setSubSection(Analytics.SubSection.contextMenu)
				.setP1(p1)
			;

			if (params.isNestedSection)
			{
				analytics.setElement(Analytics.Element.more);
			}

			analytics.send();
		}

		/**
		 * @param {string} messageId
		 * @param {SendMessageMenuCommonAnalyticsParams} params
		 */
		sendMessageMenuForwardTap(messageId, params)
		{
			const dialogModel = this.store.getters['dialoguesModel/getById'](params.dialogId);
			if (!dialogModel)
			{
				return;
			}

			const category = AnalyticsHelper.getCategoryByChatType(dialogModel.type);
			const event = actionIdByEventIdCollection[params.actionId];
			const p1 = AnalyticsHelper.getP1ByDialog(dialogModel);

			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(event)
				.setSection(Analytics.Section.chatWindow)
				.setSubSection(Analytics.SubSection.contextMenu)
				.setP1(p1)
				.setP2(AnalyticsHelper.getP2ByUserType())
				;

			if (params.isNestedSection)
			{
				analytics.setElement(Analytics.Element.more);
			}

			analytics.send();
		}

		/**
		 * @param {string} messageId
		 * @param {SendMessageMenuCommonAnalyticsParams} params
		 */
		sendMessageMenuFeedbackTap(messageId, params)
		{
			const dialogModel = this.store.getters['dialoguesModel/getById'](params.dialogId);
			if (!dialogModel)
			{
				return;
			}

			const category = dialogModel.type === DialogType.copilot ? Analytics.Category.copilot : Analytics.Category.chat;

			const event = actionIdByEventIdCollection[params.actionId];
			const p1 = AnalyticsHelper.getP1ByDialog(dialogModel);

			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(event)
				.setSection(AnalyticsHelper.getSectionCode())
				.setSubSection(Analytics.SubSection.contextMenu)
				.setP1(p1)
				;

			if (params.isNestedSection)
			{
				analytics.setElement(Analytics.Element.more);
			}

			if (dialogModel.type === DialogType.copilot)
			{
				this.#setCopilotAnalyticsParams(analytics, params.dialogId);
			}

			analytics.send();
		}

		/**
		 * @param {string} messageId
		 * @param {SendMessageMenuCommonAnalyticsParams} params
		 */
		sendMessageMenuCopyTap(messageId, params)
		{
			const dialogModel = this.store.getters['dialoguesModel/getById'](params.dialogId);
			if (!dialogModel)
			{
				return;
			}

			const messageHelper = MessageHelper.createById(messageId);
			if (Type.isNull(messageHelper))
			{
				return;
			}

			const category = AnalyticsHelper.getCategoryByChatType(dialogModel.type);
			const event = actionIdByEventIdCollection[params.actionId];
			const type = messageHelper.getComponentId();
			const p1 = AnalyticsHelper.getP1ByDialog(dialogModel);

			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(event)
				.setType(type)
				.setSection(Analytics.Section.chatWindow)
				.setSubSection(Analytics.SubSection.contextMenu)
				.setP1(p1)
				.setP5(AnalyticsHelper.getFormattedChatId(dialogModel.chatId))
				;

			if (params.isNestedSection)
			{
				analytics.setElement(Analytics.Element.more);
			}

			if (dialogModel.type === DialogType.copilot)
			{
				this.#setCopilotAnalyticsParams(analytics, params.dialogId);
				analytics.setSection(AnalyticsHelper.getSectionCode());
			}

			analytics.send();
		}

		/**
		 * @param {string} messageId
		 * @param {SendMessageMenuCommonAnalyticsParams} params
		 */
		sendMessageMenuCreateActionTap(messageId, params)
		{
			const dialogModel = this.store.getters['dialoguesModel/getById'](params.dialogId);
			if (!dialogModel)
			{
				return;
			}
			const event = actionIdByEventIdCollection[params.actionId];

			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(AnalyticsHelper.getCategoryByChatType(dialogModel.type))
				.setEvent(event)
				.setSection(Analytics.Section.chatWindow)
				.setSubSection(Analytics.SubSection.fromContextMenu)
				.setP1(AnalyticsHelper.getP1ByDialog(dialogModel))
				.setP2(AnalyticsHelper.getP2ByUserType());

			const isCollab = DialogHelper.createByDialogId(dialogModel.dialogId)?.isCollab;
			if (isCollab)
			{
				analytics.setP4(AnalyticsHelper.getFormattedCollabIdByDialogId(dialogModel.dialogId));
			}

			if (params.isNestedSection)
			{
				analytics.setElement(Analytics.Element.more);
			}

			analytics.send();
		}

		/**
		 * @param {AnalyticsEvent} analytics
		 * @param {string} dialogId
		 */
		#setCopilotAnalyticsParams(analytics, dialogId)
		{
			const copilotMainRole = this.store.getters['dialoguesModel/copilotModel/getMainRoleByDialogId'](dialogId);
			if (copilotMainRole)
			{
				analytics.setP4(AnalyticsHelper.getCopilotRole(copilotMainRole.code));
			}

			const copilotModel = this.store.getters['dialoguesModel/copilotModel/getByDialogId'](dialogId);
			if (copilotModel)
			{
				const engineCode = copilotModel.engine.code;
				const engine = MessengerParams.getCopilotAvailableEngines().find((item) => item.code === engineCode);
				if (Type.isStringFilled(engine?.name))
				{
					analytics.setP2(`provider_${engine.name}`);
				}
			}
		}
	}

	module.exports = { MessageMenu };
});
