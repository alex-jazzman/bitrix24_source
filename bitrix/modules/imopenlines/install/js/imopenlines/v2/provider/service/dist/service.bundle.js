/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
this.BX.OpenLines.v2.Provider = this.BX.OpenLines.v2.Provider || {};
(function (exports, im_v2_application_core, im_v2_lib_notifier, im_v2_lib_rest, im_v2_lib_logger, imopenlines_v2_const, im_public, im_v2_const, im_v2_lib_layout, im_v2_provider_service_chat, im_v2_provider_service_search, imopenlines_v2_lib_search) {
	'use strict';

	class RecentService {
		firstPageIsLoaded = false;
		#itemsPerPage = 50;
		#isLoading = false;
		#hasMoreItemsToLoad = true;
		#sortPointer = 0;
		#lastStatusGroup = '';
		async loadFirstPage() {
			this.#isLoading = true;
			const result = await this.#requestItems({
				firstPage: true
			});
			this.firstPageIsLoaded = true;
			return result;
		}
		loadNextPage() {
			if (this.#isLoading || !this.#hasMoreItemsToLoad) {
				return Promise.resolve();
			}
			this.#isLoading = true;
			return this.#requestItems();
		}
		hasMoreItemsToLoad() {
			return this.#hasMoreItemsToLoad;
		}
		async #requestItems({
			firstPage = false
		} = {}) {
			const queryParams = {
				data: {
					cursor: {
						sortPointer: firstPage ? null : this.#sortPointer,
						statusGroup: firstPage ? null : this.#lastStatusGroup
					},
					limit: this.#itemsPerPage
				}
			};
			const result = await im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2RecentList, queryParams).catch(error => {
				im_v2_lib_notifier.Notifier.onDefaultError();
				im_v2_lib_logger.Logger.error('Imol.OpenlinesList: page request error', error);
			});
			const {
				messages,
				recentItems,
				sessions,
				hasNextPage
			} = result;
			if (!hasNextPage) {
				this.#hasMoreItemsToLoad = false;
			}
			this.#isLoading = false;
			if (recentItems.length === 0) {
				return Promise.resolve();
			}
			this.#lastStatusGroup = this.#getLastStatusGroup(sessions, recentItems);
			if (this.#lastStatusGroup === imopenlines_v2_const.StatusGroup.answered) {
				this.#sortPointer = this.#getLastDate(messages, recentItems);
			} else {
				this.#sortPointer = recentItems[recentItems.length - 1].sessionId;
			}
			return this.#updateModel(result);
		}
		#updateModel(restResult) {
			const {
				users,
				chats,
				messages,
				files,
				recentItems,
				sessions
			} = restResult;
			const usersPromise = im_v2_application_core.Core.getStore().dispatch('users/set', users);
			const dialoguesPromise = im_v2_application_core.Core.getStore().dispatch('chats/set', chats);
			const messagesPromise = im_v2_application_core.Core.getStore().dispatch('messages/store', messages);
			const filesPromise = im_v2_application_core.Core.getStore().dispatch('files/set', files);
			const openLinesPromise = im_v2_application_core.Core.getStore().dispatch('openLines/recent/set', recentItems);
			const sessionsPromise = im_v2_application_core.Core.getStore().dispatch('openLines/sessions/set', sessions);
			return Promise.all([usersPromise, dialoguesPromise, messagesPromise, filesPromise, openLinesPromise, sessionsPromise]);
		}
		#getLastDate(messages, recentItems) {
			const lastItemMessageId = recentItems[recentItems.length - 1].messageId;
			return messages.find(message => message.id === lastItemMessageId).date;
		}
		#getLastStatusGroup(sessions, recentItems) {
			const lastItemSessionId = recentItems[recentItems.length - 1].sessionId;
			return sessions.find(session => session.id === lastItemSessionId).status;
		}
	}

	class AnswerService {
		requestAnswer(dialogId) {
			const queryParams = {
				data: {
					dialogId
				}
			};
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionAnswer, queryParams).catch(error => {
				im_v2_lib_notifier.Notifier.onDefaultError();
				im_v2_lib_logger.Logger.error('Imol.OperatorAnswer: request error', error);
			});
		}
	}

	class FinishService {
		markSpamChat(dialogId) {
			this.#updateModel(dialogId);
			const queryParams = {
				data: {
					dialogId
				}
			};
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionMarkSpam, queryParams).catch(error => {
				im_v2_lib_notifier.Notifier.onDefaultError();
				im_v2_lib_logger.Logger.error('Imol.MarkSpam: request error', error);
			});
		}
		finishChat(dialogId) {
			this.#updateModel(dialogId);
			const queryParams = {
				data: {
					dialogId
				}
			};
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionFinish, queryParams).catch(error => {
				im_v2_lib_notifier.Notifier.onDefaultError();
				im_v2_lib_logger.Logger.error('Imol.Finish: request error', error);
			});
		}
		#updateModel(dialogId) {
			const chatIsOpened = im_v2_application_core.Core.getStore().getters['application/isLinesChatOpen'](dialogId);
			const chatId = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId).chatId;
			const session = im_v2_application_core.Core.getStore().getters['openLines/sessions/getByChatId'](chatId);
			if (chatIsOpened) {
				void im_public.Messenger.openLines();
				this.#clearLastOpenedElement();
			}
			void im_v2_application_core.Core.getStore().dispatch('openLines/sessions/set', {
				...session,
				isClosed: true
			});
			void im_v2_application_core.Core.getStore().dispatch('openLines/recent/delete', {
				id: dialogId
			});
		}
		#clearLastOpenedElement() {
			im_v2_lib_layout.LayoutManager.getInstance().setLastOpenedElement(im_v2_const.Layout.openlinesV2, '');
		}
	}

	class PinService {
		pinChat(dialogId) {
			return this.#sendRequest({
				dialogId,
				action: true,
				restMethod: imopenlines_v2_const.RestMethod.linesV2SessionPin
			});
		}
		unpinChat(dialogId) {
			return this.#sendRequest({
				dialogId,
				action: false,
				restMethod: imopenlines_v2_const.RestMethod.linesV2SessionUnpin
			});
		}
		#sendRequest(actionParams) {
			const session = im_v2_application_core.Core.getStore().getters['openLines/recent/getSession'](actionParams.dialogId);
			void im_v2_application_core.Core.getStore().dispatch('openLines/sessions/pin', {
				id: session.id,
				chatId: session.chatId,
				action: actionParams.action
			});
			const queryParams = {
				data: {
					dialogId: actionParams.dialogId
				}
			};
			return im_v2_lib_rest.runAction(actionParams.restMethod, queryParams).catch(error => {
				im_v2_lib_logger.Logger.error('Imol.Pin/UnpinDialog: request error', error);
				void im_v2_application_core.Core.getStore().dispatch('openLines/sessions/pin', {
					id: session.id,
					action: !actionParams.action
				});
			});
		}
	}

	class InterceptService {
		interceptDialog(dialogId) {
			const queryParams = {
				data: {
					dialogId
				}
			};
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionIntercept, queryParams).catch(error => {
				im_v2_lib_notifier.Notifier.onDefaultError();
				im_v2_lib_logger.Logger.error('Imol.InterceptDialog: request error', error);
			});
		}
	}

	class SkipService {
		requestSkip(dialogId) {
			const chatIsOpened = im_v2_application_core.Core.getStore().getters['application/isLinesChatOpen'](dialogId);
			if (chatIsOpened) {
				void im_public.Messenger.openLines();
			}
			void im_v2_application_core.Core.getStore().dispatch('openLines/recent/delete', {
				id: dialogId
			});
			im_v2_lib_layout.LayoutManager.getInstance().setLastOpenedElement(im_v2_const.Layout.openlinesV2, '');
			const queryParams = {
				data: {
					dialogId
				}
			};
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionSkip, queryParams).catch(error => {
				im_v2_lib_notifier.Notifier.onDefaultError();
				im_v2_lib_logger.Logger.error('Imol.SkipDialog: request error', error);
			});
		}
	}

	class StartService {
		startDialog(dialogId) {
			const queryParams = {
				data: {
					dialogId
				}
			};
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionStart, queryParams).catch(error => {
				im_v2_lib_notifier.Notifier.onDefaultError();
				im_v2_lib_logger.Logger.error('Imol.start: request error', error);
			});
		}
	}

	class TransferService {
		chatTransfer(dialogId, transferId) {
			void im_public.Messenger.openLines();
			im_v2_lib_layout.LayoutManager.getInstance().setLastOpenedElement(im_v2_const.Layout.openlinesV2, '');
			const queryParams = {
				data: {
					dialogId,
					transferId
				}
			};
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionTransfer, queryParams).catch(error => {
				im_v2_lib_notifier.Notifier.onDefaultError();
				im_v2_lib_logger.Logger.error('Imol.transfer: request error', error);
			});
		}
	}

	class JoinService {
		joinToDialog(dialogId) {
			const queryParams = {
				data: {
					dialogId
				}
			};
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionJoin, queryParams).catch(error => {
				im_v2_lib_notifier.Notifier.onDefaultError();
				im_v2_lib_logger.Logger.error('Imol.join: request error', error);
			});
		}
	}

	class MessageService {
		addSession(dialogId, messageId) {
			const queryParams = {
				data: {
					dialogId,
					messageId
				}
			};
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2MessageAddSession, queryParams).catch(error => {
				im_v2_lib_logger.Logger.error('Imol.StartMultidialog: request error', error);
				im_v2_lib_notifier.Notifier.onDefaultError();
			});
		}
	}

	class OpenLinesDataExtractor {
		#restResult;
		constructor(restResult) {
			this.#restResult = restResult;
		}
		getDialogId() {
			return this.#restResult.chat.dialogId;
		}
		getSession() {
			return this.#restResult.session;
		}
		getConnectorData() {
			return this.#restResult.openlines.connector;
		}
		getCrmData() {
			return this.#restResult.openlines.crm;
		}
		getCurrentSessionData() {
			return this.#restResult.openlines.currentSession;
		}
	}

	class LoadServiceOl extends im_v2_provider_service_chat.LoadService {
		getLoadRestMethodName() {
			return imopenlines_v2_const.RestMethod.linesV2ChatLoad;
		}
		updateChatCustomModels(restResult) {
			const extractor = new OpenLinesDataExtractor(restResult);
			const store = im_v2_application_core.Core.getStore();
			const dialogId = extractor.getDialogId();
			const actions = [{
				path: 'openLines/sessions/set',
				payload: extractor.getSession() || null
			}, {
				path: 'openLines/connector/set',
				payload: {
					dialogId,
					data: extractor.getConnectorData()
				}
			}, {
				path: 'openLines/crm/set',
				payload: {
					dialogId,
					data: extractor.getCrmData()
				}
			}, {
				path: 'openLines/currentSession/set',
				payload: {
					dialogId,
					data: extractor.getCurrentSessionData()
				}
			}];
			return actions.map(({
				path,
				payload
			}) => store.dispatch(path, payload));
		}
	}

	class ChatServiceOl extends im_v2_provider_service_chat.ChatService {
		createLoadService() {
			return new LoadServiceOl();
		}
	}

	class SilentModeService {
		set(dialogId, silentMode) {
			const data = {
				dialogId,
				silentMode
			};
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2SessionSetSilentMode, {
				data
			}).then(() => {
				void im_v2_application_core.Core.getStore().dispatch('openLines/currentSession/set', {
					dialogId,
					data: {
						silentMode
					}
				});
			}).catch(error => {
				im_v2_lib_notifier.Notifier.onDefaultError();
				im_v2_lib_logger.Logger.error('Imol.SilentMode.set: request error', error);
			});
		}
	}

	const SEARCH_CONFIG = {
		entityId: 'imol-chat',
		contextId: 'IM_OPENLINES_SEARCH',
		searchDialogId: 'im-openlines-search',
		searchRecentSection: im_v2_const.RecentType.openlines
	};
	class SearchService extends im_v2_provider_service_search.SearchService {
		#storeUpdater;
		constructor() {
			super(SEARCH_CONFIG);
			this.#storeUpdater = new imopenlines_v2_lib_search.StoreUpdater();
		}
		updateCustomStore(items) {
			return this.#storeUpdater.update(items);
		}
	}

	class CrmFormService {
		loadForms() {
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2CrmFormList).then(result => {
				const forms = result.forms ?? [];
				void im_v2_application_core.Core.getStore().dispatch('openLines/crmForm/set', forms);
				return forms;
			}).catch(error => {
				im_v2_lib_logger.Logger.error('Imol.CrmForm.loadForms: request error', error);
				im_v2_lib_notifier.Notifier.onDefaultError();
				return [];
			});
		}
		sendForm(dialogId, formId) {
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2CrmFormSend, {
				data: {
					dialogId,
					formId
				}
			}).catch(error => {
				im_v2_lib_logger.Logger.error('Imol.CrmForm.sendForm: request error', error);
				im_v2_lib_notifier.Notifier.onDefaultError();
			});
		}
	}

	class QuickReplyService {
		loadList(params) {
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2QuickReplyList, {
				data: params
			}).then(result => {
				return result;
			}).catch(error => {
				im_v2_lib_logger.Logger.error('Imol.QuickReply.loadList: request error', error);
				im_v2_lib_notifier.Notifier.onDefaultError();
				return {
					replies: [],
					sections: [],
					totalCount: 0,
					manageUrl: '',
					permissions: {
						canView: false,
						canCreate: false
					}
				};
			});
		}
		save(params) {
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2QuickReplySave, {
				data: params
			}).then(result => {
				return result.reply;
			}).catch(error => {
				im_v2_lib_logger.Logger.error('Imol.QuickReply.save: request error', error);
				im_v2_lib_notifier.Notifier.onDefaultError();
				return null;
			});
		}
		saveFromMessage(params) {
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2QuickReplySaveFromMessage, {
				data: params
			}).then(result => {
				return result?.result === true;
			}).catch(error => {
				im_v2_lib_logger.Logger.error('Imol.QuickReply.saveFromMessage: request error', error);
				im_v2_lib_notifier.Notifier.onDefaultError();
				return null;
			});
		}
		incrementRating(params) {
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2QuickReplyIncrementRating, {
				data: params
			}).then(() => true).catch(error => {
				im_v2_lib_logger.Logger.error('Imol.QuickReply.incrementRating: request error', error);
				im_v2_lib_notifier.Notifier.onDefaultError();
				return false;
			});
		}
		delete(params) {
			return im_v2_lib_rest.runAction(imopenlines_v2_const.RestMethod.linesV2QuickReplyDelete, {
				data: params
			}).then(() => true).catch(error => {
				im_v2_lib_logger.Logger.error('Imol.QuickReply.delete: request error', error);
				im_v2_lib_notifier.Notifier.onDefaultError();
				return false;
			});
		}
	}

	exports.AnswerService = AnswerService;
	exports.ChatServiceOl = ChatServiceOl;
	exports.CrmFormService = CrmFormService;
	exports.FinishService = FinishService;
	exports.InterceptService = InterceptService;
	exports.JoinService = JoinService;
	exports.MessageService = MessageService;
	exports.PinService = PinService;
	exports.QuickReplyService = QuickReplyService;
	exports.RecentService = RecentService;
	exports.SearchService = SearchService;
	exports.SilentModeService = SilentModeService;
	exports.SkipService = SkipService;
	exports.StartService = StartService;
	exports.TransferService = TransferService;

})(this.BX.OpenLines.v2.Provider.Service = this.BX.OpenLines.v2.Provider.Service || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.OpenLines.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Service, BX.OpenLines.v2.Lib);
//# sourceMappingURL=service.bundle.js.map
