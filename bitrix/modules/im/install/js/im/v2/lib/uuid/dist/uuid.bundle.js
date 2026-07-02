/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_lib_utils) {
	'use strict';

	class UuidManager {
		#actionIds = new Set();
		static getInstance() {
			if (!this.instance) {
				this.instance = new this();
			}
			return this.instance;
		}
		getActionUuid() {
			const uuid = im_v2_lib_utils.Utils.text.getUuidV4();
			this.#actionIds.add(uuid);
			return uuid;
		}
		hasActionUuid(uuid) {
			return this.#actionIds.has(uuid);
		}
		removeActionUuid(uuid) {
			this.#actionIds.delete(uuid);
		}
	}

	exports.UuidManager = UuidManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Lib);
//# sourceMappingURL=uuid.bundle.js.map
