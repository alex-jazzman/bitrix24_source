/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_const, im_v2_lib_analytics, im_v2_provider_service_chat, im_v2_application_core, im_v2_provider_service_recent) {
	'use strict';

	class CopilotChatService {
		async createChat({
			roleCode
		}) {
			const chatService = new im_v2_provider_service_chat.ChatService();
			try {
				const {
					newDialogId,
					newChatId
				} = await chatService.createChat({
					type: im_v2_const.ChatType.copilot,
					copilotMainRole: roleCode
				});
				this.#sendAnalytics({
					chatId: newChatId,
					dialogId: newDialogId
				});
				await chatService.loadChatWithMessages(newDialogId);
				return newDialogId;
			} catch (error) {
				console.error('CopilotChatService: create chat error', error);
				throw error;
			}
		}
		createDefaultChat() {
			const COPILOT_UNIVERSAL_ROLE = 'copilot_assistant';
			return this.createChat({
				roleCode: COPILOT_UNIVERSAL_ROLE
			});
		}
		#sendAnalytics({
			chatId,
			dialogId
		}) {
			im_v2_lib_analytics.Analytics.getInstance().copilot.onCreateChat(chatId);
			im_v2_lib_analytics.Analytics.getInstance().ignoreNextChatOpen(dialogId);
		}
	}

	class CopilotRecentService extends im_v2_provider_service_recent.LegacyRecentService {
		getQueryParams(firstPage) {
			return {
				ONLY_COPILOT: 'Y',
				LIMIT: this.itemsPerPage,
				LAST_MESSAGE_DATE: firstPage ? null : this.lastMessageDate,
				GET_ORIGINAL_TEXT: 'Y',
				PARSE_TEXT: 'Y'
			};
		}
		saveRecentItems(recentItems) {
			return im_v2_application_core.Core.getStore().dispatch('recent/setCollection', {
				type: im_v2_const.RecentType.copilot,
				items: recentItems
			});
		}
		getExtractorOptions() {
			return {
				withBirthdays: false
			};
		}
	}

	exports.CopilotChatService = CopilotChatService;
	exports.CopilotRecentService = CopilotRecentService;

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Application, BX.Messenger.v2.Service);
//# sourceMappingURL=copilot.bundle.js.map
