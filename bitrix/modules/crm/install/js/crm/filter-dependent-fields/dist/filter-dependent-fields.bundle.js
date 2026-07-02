/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_notification) {
	'use strict';

	/**
	 * if the filter contains any activity fast search fields and, if the "CREATED" field is not already present,
	 * add it to the filter.
	 */
	class ActivityFastSearchMutator {
		#notifyFn = main_core.Runtime.throttle(() => {
			ui_notification.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('CRM_ACTIVITY_FASTSEARCH_CREATED_ADDED'),
				autoHideDelay: 5000
			});
		}, 4000);
		mutate(fields, oldFields) {
			const isOldFilterHasCreatedField = Boolean(oldFields.ACTIVITY_FASTSEARCH_CREATED);
			let isFilterHasActivityFields = false;
			for (const fieldName of Object.keys(fields)) {
				if (!Object.prototype.hasOwnProperty.call(fields, fieldName)) {
					continue;
				}
				if (this.#checkActivityFields(fields, fieldName)) {
					isFilterHasActivityFields = true;
					break;
				}
			}
			if (isFilterHasActivityFields && !fields.ACTIVITY_FASTSEARCH_CREATED) {
				if (isOldFilterHasCreatedField) {
					this.#notifyFn();
				}
				return [{
					...fields,
					ACTIVITY_FASTSEARCH_CREATED: '365'
				}, true];
			}
			return [fields, false];
		}
		#checkActivityFields(fields, fieldName) {
			if (fieldName.indexOf('ACTIVITY_FASTSEARCH_') !== 0) {
				return false;
			}
			if (!fields[fieldName]) {
				return false;
			}
			if (fields[fieldName] === 'NONE') {
				return false;
			}
			return !(main_core.Type.isArray(fields[fieldName]) && fields[fieldName].length === 0);
		}
	}

	/**
	 * FilterDependentFields extension provide functionality to manipulate filter fields before then send to the backend.
	 * You can create your own mutator and add it to the list. Just implement the FilterFieldMutator interface and
	 * add instance to the #mutators array.
	 */
	class FilterDependentFields {
		#mutators = [];
		#oldFields = '';
		initialize() {
			BX.Event.EventEmitter.subscribe('BX.Main.Filter:beforeApply', this.#onBeforeApply.bind(this));
			this.#mutators = [new ActivityFastSearchMutator()];
			const filterManager = this.getFilterManager();
			if (filterManager) {
				this.#oldFields = filterManager.getFilterFieldsValues();
			}
		}
		#onBeforeApply(event) {
			const filterManager = this.getFilterManager();
			if (!filterManager) {
				return;
			}
			const api = filterManager.getApi();
			let currentFields = filterManager.getFilterFieldsValues();
			let isFilterModified = false;
			for (const mutator of this.#mutators) {
				let hasChanges = false;
				[currentFields, hasChanges] = mutator.mutate(currentFields, this.#oldFields);
				if (hasChanges) {
					isFilterModified = true;
				}
			}
			if (!isFilterModified) {
				return;
			}
			api.setFields(currentFields);
			this.#oldFields = currentFields;
		}
		getFilterManager() {
			if (!main_core.Type.isObject(BX.Main.filterManager || !main_core.Type.isFunction(BX.Main.filterManager))) {
				return null;
			}
			const filters = Object.prototype.hasOwnProperty.call(BX.Main.filterManager, 'getList') ? BX.Main.filterManager.getList() : Object.values(BX.Main.filterManager.data);
			return main_core.Type.isArray(filters) && filters.length > 0 ? filters[0] : null;
		}
	}

	exports.FilterDependentFields = FilterDependentFields;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX);
//# sourceMappingURL=filter-dependent-fields.bundle.js.map
