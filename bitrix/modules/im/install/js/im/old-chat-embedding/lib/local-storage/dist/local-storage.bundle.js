/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.Embedding = this.BX.Messenger.Embedding || {};
(function (exports, im_oldChatEmbedding_application_core) {
	'use strict';

	const KEY_PREFIX = 'im-v2';
	class LocalStorageManager {
		#siteId;
		#userId;
		static getInstance() {
			if (!this.instance) {
				this.instance = new this();
			}
			return this.instance;
		}
		constructor() {
			this.#siteId = im_oldChatEmbedding_application_core.Core.getSiteId();
			this.#userId = im_oldChatEmbedding_application_core.Core.getUserId();
		}
		set(key, value) {
			const preparedValue = JSON.stringify(value);
			if (localStorage.getItem(this.#buildKey(key)) === preparedValue) {
				return;
			}
			localStorage.setItem(this.#buildKey(key), preparedValue);
		}
		get(key, defaultValue = null) {
			const result = localStorage.getItem(this.#buildKey(key));
			if (result === null) {
				return defaultValue;
			}
			try {
				return JSON.parse(result);
			} catch {
				return defaultValue;
			}
		}
		remove(key) {
			localStorage.removeItem(this.#buildKey(key));
		}
		#buildKey(key) {
			return `${KEY_PREFIX}-${this.#siteId}-${this.#userId}-${key}`;
		}
	}

	exports.LocalStorageManager = LocalStorageManager;

})(this.BX.Messenger.Embedding.Lib = this.BX.Messenger.Embedding.Lib || {}, BX.Messenger.Embedding.Application);
//# sourceMappingURL=local-storage.bundle.js.map
