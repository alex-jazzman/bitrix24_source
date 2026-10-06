/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
(function (exports, main_core, sign_type, sign_v2_api, ui_analytics) {
	'use strict';

	class Context {
		#options = {};
		constructor(options = {}) {
			this.#options = options;
		}
		update(options) {
			this.#options = {
				...this.#options,
				...options
			};
		}
		getOptions() {
			return this.#options;
		}
	}

	class Analytics {
		#documentUidToIdCache = {};
		#context;
		#api = new sign_v2_api.Api();
		constructor(options = {}) {
			this.#context = new Context(options.contextOptions ?? {});
		}
		send(options) {
			ui_analytics.sendData({
				...this.#context.getOptions(),
				...options,
				tool: 'sign'
			});
		}
		setContext(context) {
			this.#context = context;
		}
		getContext() {
			return this.#context;
		}
		sendWithProviderTypeAndDocId(options, documentUidOrId, providerCode) {
			void this.#sendWithProviderType(options, documentUidOrId, providerCode);
		}
		sendWithDocId(options, documentUidOrId) {
			if (main_core.Type.isNumber(documentUidOrId)) {
				this.send({
					...options,
					p5: `docId_${documentUidOrId}`
				});
				return;
			}
			(async () => {
				const documentId = await this.#loadDocumentIdByUid(documentUidOrId);
				this.send({
					...options,
					p5: `docId_${documentId}`
				});
			})();
		}
		async #loadDocumentIdByUid(documentUid) {
			if (main_core.Type.isNumber(this.#documentUidToIdCache[documentUid])) {
				return this.#documentUidToIdCache[documentUid];
			}
			const document = await this.#api.loadDocument(documentUid);
			if (document) {
				this.#documentUidToIdCache[documentUid] = document.id;
				return document.id;
			}
			return null;
		}
		async #sendWithProviderType(options, documentUidOrId, providerCode) {
			let documentId = main_core.Type.isNumber(documentUidOrId) ? documentUidOrId : this.#documentUidToIdCache[documentUidOrId] ?? null;
			let providerType = providerCode;
			if (main_core.Type.isNull(documentId) || main_core.Type.isUndefined(providerCode)) {
				const document = main_core.Type.isString(documentUidOrId) ? await this.#api.loadDocument(documentUidOrId) : await this.#api.loadDocumentById(documentUidOrId);
				if (!document) {
					console.warn('Document not found by identifier', documentUidOrId);
					return;
				}
				documentId = document.id;
				providerType = document.providerCode;
			}
			this.send({
				...options,
				p1: this.#convertProviderCodeToP1IntegrationType(providerType),
				p5: `docId_${documentId}`
			});
		}
		#convertProviderCodeToP1IntegrationType(providerType) {
			switch (providerType) {
				case sign_type.ProviderCode.sesRu:
				case sign_type.ProviderCode.sesCom:
					return 'integration_bitrix24KEDO';
				case sign_type.ProviderCode.goskey:
					return 'integration_Goskluch';
				case sign_type.ProviderCode.goskeyLite:
					return 'integration_Goskluch_Light';
				case sign_type.ProviderCode.external:
					return 'integration_external';
				default:
					return 'integration_N';
			}
		}
	}

	exports.Analytics = Analytics;
	exports.Context = Context;

})(this.BX.Sign.V2 = this.BX.Sign.V2 || {}, BX, BX.Sign, BX.Sign.V2, BX.UI.Analytics);
//# sourceMappingURL=analytics.bundle.js.map
