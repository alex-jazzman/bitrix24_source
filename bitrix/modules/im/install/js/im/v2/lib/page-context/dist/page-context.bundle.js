/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, ui_pageContext, im_v2_application_core, im_v2_const, im_v2_lib_layout) {
	'use strict';

	const MODULE_ID = 'im';
	const CONTEXT_KEY = 'currentChat';
	class ChatPageContextManager {
		static #instance;
		static init() {
			ChatPageContextManager.getInstance();
		}
		static getInstance() {
			if (!ChatPageContextManager.#instance) {
				ChatPageContextManager.#instance = new ChatPageContextManager();
			}
			return ChatPageContextManager.#instance;
		}
		constructor() {
			this.#subscribe();
		}
		#subscribe() {
			const watcher = (state, getters) => {
				const layout = getters['application/getLayout'];
				const chat = layout.entityId ? getters['chats/get'](layout.entityId) : null;
				return [layout.name, layout.entityId, chat?.inited ? '1' : '0', chat?.type ?? '', chat?.name ?? '', chat?.entityLink?.id ?? ''].join('|');
			};
			im_v2_application_core.Core.getStore().watch(watcher, () => this.#syncContext());
			this.#syncContext();
		}
		#syncContext() {
			const layout = im_v2_application_core.Core.getStore().getters['application/getLayout'];
			const isChatLayout = im_v2_lib_layout.LayoutManager.getInstance().isChatLayout(layout.name) && main_core.Type.isStringFilled(layout.entityId);
			const chat = isChatLayout ? im_v2_application_core.Core.getStore().getters['chats/get'](layout.entityId) : null;
			if (!chat?.inited) {
				ui_pageContext.PageContext.delete(MODULE_ID, CONTEXT_KEY);
				return;
			}
			ui_pageContext.PageContext.set(MODULE_ID, CONTEXT_KEY, {
				dialogId: chat.dialogId,
				chatId: chat.chatId,
				type: this.#getChatCategory(chat.type),
				title: chat.name,
				entityLink: chat.entityLink?.id ? chat.entityLink : null
			});
		}
		#getChatCategory(type) {
			switch (type) {
				case im_v2_const.ChatType.channel:
				case im_v2_const.ChatType.openChannel:
				case im_v2_const.ChatType.generalChannel:
					return 'Channel';
				case im_v2_const.ChatType.tasks:
				case im_v2_const.ChatType.taskComments:
					return 'Task Chat';
				case im_v2_const.ChatType.crm:
					return 'CRM Chat';
				case im_v2_const.ChatType.calendar:
					return 'Calendar Chat';
				case im_v2_const.ChatType.copilot:
					return 'AI Chat';
				case im_v2_const.ChatType.lines:
					return 'OpenLines Chat';
				case im_v2_const.ChatType.thread:
				case im_v2_const.ChatType.comment:
					return 'Thread';
				case im_v2_const.ChatType.support24Notifier:
				case im_v2_const.ChatType.support24Question:
					return 'Support Chat';
				default:
					return 'Chat';
			}
		}
	}

	exports.ChatPageContextManager = ChatPageContextManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.UI.PageContext, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib);
//# sourceMappingURL=page-context.bundle.js.map
