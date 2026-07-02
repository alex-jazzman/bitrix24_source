/* eslint-disable */
this.BX = this.BX || {};
this.BX.CRM = this.BX.CRM || {};
(function (exports, main_core) {
	'use strict';

	let instance = null;
	/**
	 * @memberOf BX.CRM.Kanban
	 */
	class Restriction {
		#options;
		static get Instance() {
			if (window.top !== window && main_core.Reflection.getClass('top.BX.CRM.Kanban.Restriction')) {
				return window.top.BX.CRM.Kanban.Restriction;
			}
			if (!instance) {
				throw new Error('Restriction must be inited before use');
			}
			return instance;
		}
		static init(options) {
			if (instance) {
				console.warn('Attempt to re-init Restriction');
				return;
			}
			instance = new Restriction(options);
		}
		constructor(options) {
			if (instance) {
				throw new Error('Restriction is a singleton, another instance exists already. Use Instance to access it');
			}
			this.#options = main_core.Type.isPlainObject(options) ? options : {};
		}
		isSortTypeChangeAvailable() {
			return this.#isUniversalActivityScenarioEnabled() && this.#isLastActivityEnabled();
		}
		isLastActivityInfoInKanbanItemAvailable() {
			return this.#isUniversalActivityScenarioEnabled() && this.#isLastActivityEnabled();
		}
		isTodoActivityCreateAvailable() {
			return this.#isUniversalActivityScenarioEnabled();
		}
		#isUniversalActivityScenarioEnabled() {
			if (main_core.Type.isBoolean(this.#options.isUniversalActivityScenarioEnabled)) {
				return this.#options.isUniversalActivityScenarioEnabled;
			}
			return true;
		}
		#isLastActivityEnabled() {
			if (main_core.Type.isBoolean(this.#options.isLastActivityEnabled)) {
				return this.#options.isLastActivityEnabled;
			}
			return true;
		}
	}

	const namespace = main_core.Reflection.namespace('BX.CRM.Kanban');
	namespace.Restriction = Restriction;

	exports.Restriction = Restriction;

})(this.BX.CRM.Kanban = this.BX.CRM.Kanban || {}, BX);
//# sourceMappingURL=restriction.bundle.js.map
