/* eslint-disable */
this.BX = this.BX || {};
this.BX.Calendar = this.BX.Calendar || {};
(function (exports, main_core_events) {
	'use strict';

	const MIN_QUERY_LENGTH = 3;
	class Filter extends main_core_events.EventEmitter {
		#filterId;
		#filter;
		constructor(filterId) {
			super();
			this.setEventNamespace('Calendar.OpenEvents.Filter');
			this.#filterId = filterId;
			this.#filter = BX.Main.filterManager.getById(this.#filterId);
			this.#bindEvents();
		}
		get id() {
			return this.#filterId;
		}
		get fields() {
			return this.#filter.getFilterFieldsValues();
		}
		isDateFieldApplied() {
			return this.fields.DATE_datesel && this.fields.DATE_datesel !== 'NONE';
		}
		getFilterFieldsKey() {
			return JSON.stringify(this.fields);
		}
		#bindEvents() {
			this.beforeApplyHandler = this.#beforeApplyHandler.bind(this);
			this.applyHandler = this.#applyHandler.bind(this);
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:beforeApply', this.beforeApplyHandler);
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', this.applyHandler);
		}
		#beforeApplyHandler(event) {
			const [filterId] = event.getData();
			if (filterId !== this.#filterId) {
				return;
			}
			this.emit('beforeApply');
		}
		#applyHandler(event) {
			const [filterId] = event.getData();
			if (filterId !== this.#filterId) {
				return;
			}
			if (this.#isFilterEmpty()) {
				this.emit('clear');
			} else {
				this.emit('apply');
			}
		}
		#isFilterEmpty() {
			return this.#arePresetsEmpty() && this.#isSearchEmpty();
		}
		#arePresetsEmpty() {
			return !this.#filter.getSearch().getLastSquare();
		}
		#isSearchEmpty() {
			return this.#filter.getSearch().getSearchString().length < MIN_QUERY_LENGTH;
		}
	}

	exports.Filter = Filter;

})(this.BX.Calendar.OpenEvents = this.BX.Calendar.OpenEvents || {}, BX.Event);
//# sourceMappingURL=filter.bundle.js.map
