/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	class Collab {
		#id = null;
		#name = null;
		constructor(data) {
			this.updateData(data);
		}
		updateData(data) {
			this.#id = main_core.Text.toNumber(data.ID);
			this.#name = data.NAME?.toString();
		}
		getId() {
			return this.#id;
		}
		getName() {
			return this.#name;
		}
	}

	class CollabManager {
		constructor(data, config) {
			let dataCollabs = data.collabs || [];
			if (!dataCollabs.length) {
				const extensionConfig = main_core.Extension.getSettings('calendar.collabmanager');
				dataCollabs = extensionConfig.collabs || [];
			}
			this.updateCollabs(dataCollabs);
		}
		updateCollabs(collabs) {
			this.collabs = collabs.map(c => new Collab(c));
		}
		getById(id) {
			return this.collabs.find(c => c.getId() === main_core.Text.toNumber(id));
		}
	}

	exports.CollabManager = CollabManager;

})(this.BX.Calendar = this.BX.Calendar || {}, BX);
//# sourceMappingURL=collabmanager.bundle.js.map
