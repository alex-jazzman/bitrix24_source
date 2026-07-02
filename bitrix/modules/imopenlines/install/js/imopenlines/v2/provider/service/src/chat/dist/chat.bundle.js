/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
(function (exports, im_v2_provider_service_chat, im_v2_application_core, imopenlines_v2_const) {
	'use strict';

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

	exports.ChatServiceOl = ChatServiceOl;

})(this.BX.OpenLines.v2.Service = this.BX.OpenLines.v2.Service || {}, BX.Messenger.v2.Service, BX.Messenger.v2.Application, BX.OpenLines.v2.Const);
//# sourceMappingURL=chat.bundle.js.map
