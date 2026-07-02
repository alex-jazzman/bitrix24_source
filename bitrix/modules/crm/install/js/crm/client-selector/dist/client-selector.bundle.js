/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_entitySelector) {
	'use strict';

	const DEFAULT_TAB_ID = 'client';
	class ClientSelector {
		items = [];
		events = {};
		#multiple = false;
		static createFromCommunications({
			targetNode,
			context = null,
			communications,
			multiple = false,
			selected = [],
			events = {}
		}) {
			const instance = new ClientSelector({
				targetNode,
				multiple,
				context,
				events
			});
			instance.items = instance.getPhoneSelectorItems(communications);
			instance.setSelected(selected);
			return instance;
		}
		static createFromItems({
			targetNode,
			context = null,
			items,
			multiple = false,
			selected = [],
			events = {}
		}) {
			const instance = new ClientSelector({
				targetNode,
				multiple,
				context,
				events
			});
			instance.items = instance.prepareItems(items);
			instance.setSelected(selected);
			return instance;
		}
		constructor({
			targetNode,
			multiple = false,
			context = null,
			events = {}
		}) {
			this.targetNode = targetNode;
			this.#multiple = multiple;
			this.context = main_core.Type.isStringFilled(context) ? context : `crm-client-selector-${main_core.Text.getRandom()}`;
			this.events = main_core.Type.isObjectLike(events) ? events : {};
		}
		setSelected(ids) {
			// eslint-disable-next-line no-return-assign,no-param-reassign
			this.items.forEach(item => item.selected = ids.includes(item.id));
			return this;
		}
		setSelectedItemByEntityData(entityId, entityTypeId) {
			this.items.forEach(item => {
				if (item.customData.entityId === entityId && item.customData.entityTypeId === entityTypeId) {
					// eslint-disable-next-line no-param-reassign
					item.selected = true;
				}
			});
			return this;
		}
		getPhoneSelectorItems(communications) {
			const items = [];
			communications.forEach(communication => {
				const {
					phones,
					entityTypeName,
					entityId,
					entityTypeId,
					caption: title
				} = communication;
				if (!Array.isArray(phones)) {
					return;
				}
				phones.forEach(phone => {
					const {
						id,
						valueFormatted,
						typeLabel
					} = phone;
					items.push({
						id,
						title,
						subtitle: `${valueFormatted}, ${typeLabel}`,
						entityId: DEFAULT_TAB_ID,
						tabs: DEFAULT_TAB_ID,
						avatar: this.#getEntityAvatarPath(entityTypeName),
						customData: {
							entityId,
							entityTypeId
						}
					});
				});
			});
			return items;
		}
		prepareItems(items) {
			return items.map(item => {
				item.entityId = DEFAULT_TAB_ID;
				item.tabs = DEFAULT_TAB_ID;
				if (item.customData?.entityTypeId && !item.avatar) {
					const {
						entityTypeId
					} = item.customData;
					item.avatar = item.avatar ?? this.#getEntityAvatarPath(BX.CrmEntityType.resolveName(entityTypeId));
				}
				return item;
			});
		}
		#getEntityAvatarPath(entityTypeName) {
			// eslint-disable-next-line no-param-reassign
			entityTypeName = entityTypeName.toLowerCase();
			const whiteList = ['contact', 'company', 'lead'];
			if (!whiteList.includes(entityTypeName)) {
				return '';
			}
			return `/bitrix/images/crm/entity_provider_icons/${entityTypeName}.svg`;
		}
		show() {
			const {
				targetNode,
				context,
				items
			} = this;
			const events = this.#prepareEvents();
			const tabs = [{
				id: DEFAULT_TAB_ID,
				title: main_core.Loc.getMessage('CRM_CLIENT_SELECTOR_TAB_TITLE')
			}];
			this.clientSelectorDialog = new ui_entitySelector.Dialog({
				targetNode,
				id: 'client-phone-selector-dialog',
				context,
				multiple: this.#multiple,
				dropdownMode: true,
				showAvatars: true,
				enableSearch: true,
				width: 450,
				zIndex: 2500,
				items,
				tabs,
				events
			});
			this.clientSelectorDialog.show();
		}
		#prepareEvents() {
			const {
				events: {
					onSelect,
					onDeselect,
					onHide,
					onShow
				}
			} = this;
			const events = {};
			if (onSelect) {
				events['Item:onSelect'] = onSelect;
			}
			if (onDeselect) {
				events['Item:onDeselect'] = onDeselect;
			}
			if (onHide) {
				events.onHide = onHide;
			}
			if (onShow) {
				events.onShow = onShow;
			}
			return events;
		}
		hide() {
			if (this.isOpen()) {
				this.clientSelectorDialog.hide();
			}
		}
		isOpen() {
			return this.clientSelectorDialog && this.clientSelectorDialog.isOpen();
		}
	}

	exports.ClientSelector = ClientSelector;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.UI.EntitySelector);
//# sourceMappingURL=client-selector.bundle.js.map
