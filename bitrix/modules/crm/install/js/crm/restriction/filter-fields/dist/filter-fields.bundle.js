/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core) {
	'use strict';

	class FilterFieldsRestriction {
		constructor(options) {
			this.options = options;
			this.bindAddFilterItemEvent();
			this.bindGridSortEvent();
			this.bindCheckboxListOptionClick();
		}
		bindAddFilterItemEvent() {
			const filterId = this.options.filterId ?? null;
			if (filterId && BX.Main.filterManager) {
				const filter = BX.Main.filterManager.getById(filterId);
				if (filter) {
					filter.getEmitter().subscribe('onBeforeChangeFilterItems', event => {
						const eventData = event.getData();
						const {
							fields,
							oldFields
						} = eventData;
						const newFields = fields.filter(field => !oldFields.includes(field));
						const hasRestrictions = newFields.some(field => this.isRestrictedFilterField(field));
						if (hasRestrictions) {
							event.preventDefault();
							this.callRestrictionCallback();
						}
					});
				}
			}
		}
		bindGridSortEvent() {
			const gridId = this.options.gridId ?? null;
			if (gridId && BX.Main.gridManager) {
				main_core.Event.EventEmitter.subscribe('BX.Main.grid:onBeforeSort', event => {
					const {
						grid,
						columnName
					} = event.getData();
					if (grid.getId() === gridId && this.isRestrictedGridField(columnName)) {
						event.preventDefault();
						this.callRestrictionCallback();
					}
				});
			}
		}
		bindCheckboxListOptionClick() {
			main_core.Event.EventEmitter.subscribe('ui:checkbox-list:check-option', event => {
				const {
					id,
					context
				} = event.getData();
				if (!main_core.Type.isPlainObject(context) || !main_core.Type.isStringFilled(context.parentType)) {
					return;
				}
				if (context.parentType === 'filter' && this.isRestrictedFilterField(id)) {
					event.preventDefault();
					this.callRestrictionCallback();
				}
				if (context.parentType === 'grid' && this.isRestrictedGridField(id)) {
					event.preventDefault();
					this.callRestrictionCallback();
				}
			});
		}
		isRestrictedFilterField(fieldName) {
			const fields = this.options.filterFields ?? [];
			return main_core.Type.isArray(fields) && fields.includes(fieldName);
		}
		isRestrictedGridField(fieldName) {
			const fields = this.options.gridFields ?? [];
			return main_core.Type.isArray(fields) && fields.includes(fieldName);
		}
		callRestrictionCallback() {
			if (main_core.Type.isStringFilled(this.options.callback)) {
				eval(this.options.callback);
			}
		}
	}

	exports.FilterFieldsRestriction = FilterFieldsRestriction;

})(this.BX.Crm.Restriction = this.BX.Crm.Restriction || {}, BX);
//# sourceMappingURL=filter-fields.bundle.js.map
