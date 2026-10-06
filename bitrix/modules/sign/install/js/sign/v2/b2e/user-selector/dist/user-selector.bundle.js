/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core_events, ui_entitySelector, sign_type) {
	'use strict';

	const UserSelectorEvent = Object.freeze({
		onShow: 'onShow',
		onHide: 'onHide',
		onItemSelect: 'onItemSelect',
		onItemDeselect: 'onItemDeselect'
	});
	class UserSelector extends main_core_events.EventEmitter {
		#container = null;
		#dialog = null;
		#isRoleEnabled = false;
		#cacheable = true;
		#excludedEntityList = [];
		#options;
		#preselectedEntityList = [];
		constructor(options) {
			super();
			this.setEventNamespace('BX.Sign.V2.B2e.UserSelector');
			this.#options = options;
			this.#isRoleEnabled = options.roleEnabled ?? false;
			this.#excludedEntityList = options.excludedEntityList ?? [];
			this.#cacheable = options.cacheable ?? true;
			this.#dialog = this.#createDialog();
		}
		#createDialog() {
			const preselectedEntityList = this.#preselectedEntityList.length > 0 ? this.#preselectedEntityList.map(entity => [entity.type, entity.id]) : this.#options.preselectedIds?.map(id => [sign_type.EntityType.USER, id]);
			return new ui_entitySelector.Dialog({
				cacheable: this.#cacheable,
				width: 425,
				height: 363,
				multiple: this.#options.multiple ?? true,
				targetNode: this.#container,
				context: this.#options.context ?? 'sign_b2e_user_selector',
				entities: this.#getEntities(),
				dropdownMode: false,
				enableSearch: true,
				preselectedItems: preselectedEntityList,
				hideOnDeselect: true,
				events: {
					onHide: event => {
						const dialog = event.getTarget();
						if (!dialog.isCacheable()) {
							// Flush before destruction, otherwise the debounced save loses pending recent items.
							dialog.saveRecentItems();
						}
						this.emit(UserSelectorEvent.onHide, {
							items: dialog.getSelectedItems()
						});
					},
					'Item:onSelect': event => this.emit(UserSelectorEvent.onItemSelect, {
						items: event.getTarget().getSelectedItems()
					}),
					'Item:onDeselect': event => this.emit(UserSelectorEvent.onItemSelect, {
						items: event.getTarget().getSelectedItems()
					})
				}
			});
		}
		setExcludedEntityList(excludedEntityList) {
			this.#excludedEntityList = excludedEntityList;
		}
		setPreselectedEntityList(preselectedEntityList) {
			this.#preselectedEntityList = preselectedEntityList;
		}
		#getEntities() {
			const entities = [{
				id: sign_type.EntityType.USER,
				options: {
					intranetUsersOnly: true,
					'!userId': this.#getExcludedIdListByEntityType(sign_type.EntityType.USER)
				},
				dynamicLoad: true
			}];
			if (this.#isRoleEnabled) {
				entities.push({
					id: sign_type.EntityType.STRUCTURE_NODE_ROLE,
					options: {
						excludedRoleIdList: this.#getExcludedIdListByEntityType(sign_type.EntityType.STRUCTURE_NODE_ROLE)
					},
					dynamicLoad: true,
					dynamicSearch: true
				});
			}
			return entities;
		}
		#getExcludedIdListByEntityType(entityType) {
			const excludedEntityList = this.#excludedEntityList.filter(entity => entity.entityType === entityType);
			return excludedEntityList.map(entity => entity.entityId);
		}
		toggle() {
			this.getDialog().show();
		}
		getDialog() {
			if (this.#cacheable === false) {
				this.#dialog = this.#createDialog();
			}
			return this.#dialog;
		}
	}

	exports.UserSelector = UserSelector;
	exports.UserSelectorEvent = UserSelectorEvent;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX.Event, BX.UI.EntitySelector, BX.Sign);
//# sourceMappingURL=user-selector.bundle.js.map
