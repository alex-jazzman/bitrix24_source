/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core) {
	'use strict';

	const MENU_ITEM_CLASS_ACTIVE = 'menu-popup-item-accept';
	const MENU_ITEM_CLASS_INACTIVE = 'menu-popup-item-none';
	const SAVE_OFFSETS_REQUEST_DELAY = 750;
	class TodoPingSettingsMenu {
		#entityTypeId = null;
		#settings = null;
		#selectedOffsets = null;
		#isLoadingMenuItem = false;
		constructor(params) {
			this.#entityTypeId = params.entityTypeId;
			this.#settings = params.settings;
			if (!main_core.Type.isStringFilled(this.#settings.optionName)) {
				throw new Error('Option name are not defined.');
			}
			this.#selectedOffsets = this.#settings.currentOffsets || [];
			this.#selectedOffsets = this.#selectedOffsets.map(element => parseInt(element, 10));
			if (!main_core.Type.isArrayFilled(this.#settings.currentOffsets)) {
				throw new Error('Offsets are not defined.');
			}
		}
		setSelectedValues(values) {
			this.#selectedOffsets = values.map(element => parseInt(element, 10));
		}
		getItems() {
			const items = [];
			items.push({
				id: 'askForSetupTodoPing',
				text: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_PING_SETTINGS_MENU_ITEM'),
				className: MENU_ITEM_CLASS_INACTIVE,
				items: this.#getPintSettingsMenuItems()
			});
			return items;
		}
		#getPintSettingsMenuItems() {
			if (main_core.Type.isNull(this.#settings.offsetList) || !main_core.Type.isArrayFilled(this.#settings.offsetList)) {
				return [];
			}
			const items = [];
			this.#settings.offsetList.forEach(item => {
				items.push({
					id: item.id,
					text: item.title,
					className: this.#getMenuItemClass(parseInt(item.offset, 10)),
					disabled: this.#isLoading(),
					onclick: this.#onMenuItemClick.bind(this, parseInt(item.offset, 10))
				});
			});
			return items;
		}
		#getMenuItemClass(offset) {
			return this.#selectedOffsets.includes(offset) ? MENU_ITEM_CLASS_ACTIVE : MENU_ITEM_CLASS_INACTIVE;
		}
		#isLoading() {
			return this.#isLoadingMenuItem;
		}
		#onMenuItemClick(offset, event, item) {
			this.#isLoadingMenuItem = true;
			if (this.#selectedOffsets.includes(offset)) {
				if (this.#selectedOffsets.length === 1) {
					BX.UI.Hint.show(item.getContainer(), main_core.Loc.getMessage('CRM_ACTIVITY_TODO_PING_SETTINGS_MENU_ITEM_TOOLTIP'));
					this.#isLoadingMenuItem = false;
					return;
				}
				this.#selectedOffsets = this.#selectedOffsets.filter(value => value !== offset);
				main_core.Dom.removeClass(item.getContainer(), MENU_ITEM_CLASS_ACTIVE);
				main_core.Dom.addClass(item.getContainer(), MENU_ITEM_CLASS_INACTIVE);
			} else {
				this.#selectedOffsets.push(offset);
				main_core.Dom.removeClass(item.getContainer(), MENU_ITEM_CLASS_INACTIVE);
				main_core.Dom.addClass(item.getContainer(), MENU_ITEM_CLASS_ACTIVE);
			}
			if (this.#selectedOffsets.length === 0) {
				throw new Error('Offsets are not defined.');
			}
			setTimeout(() => {
				BX.userOptions.save('crm', this.#settings.optionName, 'offsets', this.#selectedOffsets.join(','));
				this.#isLoadingMenuItem = false;
			}, SAVE_OFFSETS_REQUEST_DELAY);
		}
	}

	exports.TodoPingSettingsMenu = TodoPingSettingsMenu;

})(this.BX.Crm.Activity = this.BX.Crm.Activity || {}, BX);
//# sourceMappingURL=todo-ping-settings-menu.bundle.js.map
