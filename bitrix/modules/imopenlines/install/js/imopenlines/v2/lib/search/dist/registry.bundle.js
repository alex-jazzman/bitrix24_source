/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
(function (exports, im_v2_application_core, im_v2_const) {
	'use strict';

	class StoreUpdater {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		update(items) {
			const {
				chats
			} = this.#prepareDataForModels(items);
			return Promise.all([this.#store.dispatch('chats/set', chats)]);
		}
		#prepareDataForModels(items) {
			const result = {
				chats: []
			};
			items.forEach(item => {
				const chatData = item.customData.imChat;
				if (item.entityType !== im_v2_const.SearchEntityIdTypes.openLines) {
					return;
				}
				result.chats.push({
					...chatData,
					dialogId: item.id
				});
			});
			return result;
		}
	}

	exports.StoreUpdater = StoreUpdater;

})(this.BX.OpenLines.v2.Lib = this.BX.OpenLines.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Const);
//# sourceMappingURL=registry.bundle.js.map
