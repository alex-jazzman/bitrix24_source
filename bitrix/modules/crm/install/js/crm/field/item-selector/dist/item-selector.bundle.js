/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, main_core_events, main_popup, ui_buttons) {
	'use strict';

	const DEFAULT_CLASS = 'crm-field-item-selector__add-btn';
	const ItemSelectorButtonState = Object.freeze({
		ADD: 'add',
		MORE_ADD: 'more-add',
		COUNTER_ADD: 'counter-add'
	});
	class ItemSelectorButton extends ui_buttons.Button {
		constructor(options) {
			super(options);
			main_core.Dom.addClass(this.getContainer(), DEFAULT_CLASS);
		}
		getDefaultOptions() {
			return {
				id: `item-selector-button-${main_core.Text.getRandom()}`,
				text: main_core.Loc.getMessage('CRM_FIELD_ITEM_SELECTOR_DEFAULT_ADD_BUTTON_LABEL'),
				tag: ui_buttons.Button.Tag.SPAN,
				size: ui_buttons.Button.Size.EXTRA_SMALL,
				color: ui_buttons.Button.Color.LIGHT,
				round: true,
				dropdown: true
			};
		}
		applyState(state, counter = 0) {
			switch (state) {
				case ItemSelectorButtonState.MORE_ADD:
					this.setText(main_core.Loc.getMessage('CRM_FIELD_ITEM_SELECTOR_DEFAULT_MORE_BUTTON_LABEL'));
					break;
				case ItemSelectorButtonState.COUNTER_ADD:
					this.setText(main_core.Loc.getMessage('CRM_FIELD_ITEM_SELECTOR_DEFAULT_MORE_COUNTER_BUTTON_LABEL')?.replace('#COUNTER#', counter));
					break;
				case ItemSelectorButtonState.ADD:
				default:
					this.setText(main_core.Loc.getMessage('CRM_FIELD_ITEM_SELECTOR_DEFAULT_ADD_BUTTON_LABEL'));
					break;
			}
		}
	}

	const MENU_ITEM_CLASS_ACTIVE = 'menu-popup-item-accept';
	const MENU_ITEM_CLASS_INACTIVE = 'menu-popup-item-none';
	const CompactIcons = {
		NONE: null,
		BELL: 'bell'
	};
	const Events = {
		EVENT_ITEMSELECTOR_OPEN: 'crm.field.itemselector:open',
		EVENT_ITEMSELECTOR_VALUE_CHANGE: 'crm.field.itemselector:change'
	};
	class ItemSelector {
		// options
		#id;
		#target = null;
		#valuesList = [];
		#selectedValues = [];
		#readonlyMode = false;
		#compactMode = false;
		#icon = null;
		#htmlItemCallback = null;
		#multiple = true;

		// local
		#containerEl = null;
		#selectedElementList = {};
		#selectedHiddenElementList = {};
		#selectedValueWrapperEl = null;
		#valuesMenuPopup = null;
		#addButton = null;
		#addButtonCompact = null;
		constructor(params) {
			this.#assertValidParams(params);
			this.#id = params.id || `item-selector-${main_core.Text.getRandom()}`;
			this.#target = main_core.Type.isDomNode(params.target) ? params.target : null;
			this.#valuesList = main_core.Type.isArrayFilled(params.valuesList) ? params.valuesList : [];
			this.#selectedValues = main_core.Type.isArrayFilled(params.selectedValues) ? params.selectedValues : [];
			this.#readonlyMode = params.readonlyMode === true;
			this.#compactMode = params.compactMode === true;
			if (main_core.Type.isStringFilled(params.icon) && Object.values(CompactIcons).includes(params.icon)) {
				this.#icon = params.icon;
			}
			this.#htmlItemCallback = main_core.Type.isFunction(params.htmlItemCallback) ? params.htmlItemCallback : null;
			this.#multiple = Boolean(params.multiple ?? true);
			this.#create();
			this.#bindEvents();
			this.#applyCurrentValue(100);
		}

		// region Data management
		getValue() {
			return this.#selectedValues;
		}
		setValue(values, isEmitEvent = false) {
			this.clearAll();
			values.forEach(value => {
				this.addValue(value, isEmitEvent);
			});
		}
		addValue(value, isEmitEvent = false) {
			const rawValue = this.#valuesList.find(element => {
				return element?.id?.toString() === value?.toString();
			});
			if (!rawValue) {
				return;
			}
			if (!this.#compactMode) {
				const itemEl = main_core.Tag.render`
			<span class="crm-field-item-selector__value">
				<span class="crm-field-item-selector__value-title">
					${main_core.Text.encode(rawValue.title)}
				</span>
			</span>
		`;
				if (!this.#readonlyMode) {
					main_core.Dom.append(main_core.Tag.render`
					<span class="crm-field-item-selector__value-clear-icon" data-item-selector-id="${rawValue.id}"/>
					</span>
				`, itemEl);
				}
				main_core.Dom.append(itemEl, this.#selectedValueWrapperEl);
				const itemElWidth = itemEl.offsetWidth;
				main_core.Dom.addClass(itemEl, '--hidden');
				if (this.#isTargetOverflown(itemElWidth)) {
					this.#selectedHiddenElementList[rawValue.id] = itemEl;
				} else {
					this.#animateAdd(itemEl); // add animation
				}
				this.#selectedElementList[rawValue.id] = itemEl;
				this.#applyAddButtonState(itemElWidth);
			}
			this.#selectedValues.push(rawValue.id);
			this.#adjustAddButtonCompact();
			if (isEmitEvent) {
				this.#emitEvent();
			}
		}
		removeValue(value, isEmitEvent = false) {
			if (!this.#compactMode) {
				if (this.#selectedElementList[value] && main_core.Type.isDomNode(this.#selectedElementList[value])) {
					this.#animateRemove(this.#selectedElementList[value]);
					main_core.Dom.remove(this.#selectedElementList[value]);
					delete this.#selectedElementList[value];
				}
				const isHiddenElementNeedApply = this.#selectedHiddenElementList[value] && main_core.Type.isDomNode(this.#selectedHiddenElementList[value]);
				if (isHiddenElementNeedApply) {
					delete this.#selectedHiddenElementList[value];
				}
				if (!this.#isTargetOverflown() || isHiddenElementNeedApply) {
					const itemEl = Object.values(this.#selectedHiddenElementList)[0];
					if (main_core.Type.isDomNode(itemEl) && !this.#isTargetOverflown(itemEl.offsetWidth)) {
						this.#animateAdd(itemEl);
						delete this.#selectedHiddenElementList[Object.keys(this.#selectedHiddenElementList)[0]];
					}
				}
				this.#applyAddButtonState();
			}
			this.#selectedValues = this.#selectedValues?.filter(item => {
				return item?.toString() !== value?.toString();
			});
			this.#adjustAddButtonCompact();
			if (isEmitEvent) {
				this.#emitEvent();
			}
		}
		clearAll() {
			if (!main_core.Type.isArrayFilled(this.#selectedValues)) {
				return;
			}
			this.#selectedValues.forEach(value => this.removeValue(value));
			this.#selectedValues = [];
			this.#selectedElementList = {};
			this.#selectedHiddenElementList = {};
			this.#adjustAddButtonCompact();
		}
		// endregion

		// region DOM management
		#create() {
			if (!this.#target) {
				return;
			}
			if (!this.#compactMode) {
				this.#containerEl = main_core.Tag.render`<div class="crm-field-item-selector crm-field-item-selector__scope"></div>`;
				this.#selectedValueWrapperEl = main_core.Tag.render`<span class="crm-field-item-selector__values"></span>`;
				main_core.Dom.append(this.#selectedValueWrapperEl, this.#containerEl);
			}
			if (!this.#readonlyMode) {
				if (this.#compactMode) {
					this.#addButtonCompact = main_core.Tag.render`
					<span 
						class="crm-field-item-selector-compact-icon ${main_core.Type.isStringFilled(this.#icon) ? `--${this.#icon}` : ''}"
					></span>
				`;
					this.#adjustAddButtonCompact();
				} else {
					this.#addButton = new ItemSelectorButton({});
					main_core.Dom.append(this.#getAddButtonEl(), this.#containerEl);
				}
			}
			if (this.#compactMode) {
				main_core.Dom.append(this.#getAddButtonEl(), this.#target);
			} else {
				main_core.Dom.append(this.#containerEl, this.#target);
			}
		}
		#adjustAddButtonCompact() {
			if (!this.#compactMode) {
				return;
			}
			if (main_core.Type.isArrayFilled(this.#selectedValues)) {
				main_core.Dom.removeClass(this.#addButtonCompact, '--empty');
			} else {
				main_core.Dom.addClass(this.#addButtonCompact, '--empty');
			}
		}
		#getAddButtonEl() {
			return this.#compactMode ? this.#addButtonCompact : this.#addButton?.getContainer();
		}
		#animateAdd(element) {
			main_core.Dom.removeClass(element, ['--hidden', '--removing']);
			main_core.Dom.addClass(element, '--adding');
		}
		#animateRemove(element) {
			main_core.Dom.removeClass(element, '--adding');
			main_core.Dom.addClass(element, '--removing');
		}
		#applyAddButtonState(portion = 0) {
			if (!main_core.Type.isDomNode(this.#getAddButtonEl())) {
				return;
			}
			const hiddenElementsCnt = Object.keys(this.#selectedHiddenElementList).length;
			if (this.#selectedValues.length === 0) {
				this.#addButton.applyState(ItemSelectorButtonState.ADD);
			} else if (this.#isTargetOverflown(portion) && hiddenElementsCnt > 0) {
				this.#addButton.applyState(ItemSelectorButtonState.COUNTER_ADD, hiddenElementsCnt);
			} else {
				this.#addButton.applyState(ItemSelectorButtonState.MORE_ADD);
			}
		}
		// endregion

		// region Event handlers
		#bindEvents() {
			if (main_core.Type.isDomNode(this.#addButtonCompact)) {
				main_core.Event.bind(this.#addButtonCompact, 'click', this.#onShowPopup.bind(this));
			} else if (main_core.Type.isDomNode(this.#getAddButtonEl())) {
				main_core.Event.bind(this.#getAddButtonEl(), 'click', this.#onShowPopup.bind(this));
			}
			if (main_core.Type.isDomNode(this.#selectedValueWrapperEl)) {
				main_core.Event.bind(this.#selectedValueWrapperEl, 'click', this.#onRemoveValue.bind(this));
			}
			main_core.Event.unbind(window, 'resize', this.#onWindowResize);
			main_core.Event.bind(window, 'resize', this.#onWindowResize.bind(this));
		}
		#onShowPopup(event) {
			const menuItems = this.#getPreparedMenuItems();

			// @todo temporary, need other fix
			const angle = this.#compactMode ? {
				offset: 29,
				position: 'top'
			} : true;
			const menuParams = {
				closeByEsc: true,
				autoHide: true,
				offsetLeft: this.#getAddButtonEl().offsetWidth - 16,
				angle,
				cacheable: false
			};
			this.#valuesMenuPopup = main_popup.MenuManager.create(this.#id, this.#getAddButtonEl(), menuItems, menuParams);
			this.#valuesMenuPopup.show();
			main_core_events.EventEmitter.emit(this, Events.EVENT_ITEMSELECTOR_OPEN);
		}
		#getPreparedMenuItems() {
			return this.#valuesList.map(item => this.#getPreparedMenuItem(item));
		}
		#getPreparedMenuItem(item) {
			const menuItem = {
				id: `item-selector-menu-id-${item.id}`,
				className: this.#isValueSelected(item.id) ? MENU_ITEM_CLASS_ACTIVE : MENU_ITEM_CLASS_INACTIVE,
				onclick: this.#onMenuItemClick.bind(this, item.id)
			};
			if (this.#htmlItemCallback) {
				menuItem.html = this.#htmlItemCallback(item);
			} else {
				menuItem.html = main_core.Text.encode(item.title);
			}
			return menuItem;
		}
		#onRemoveValue(event) {
			const target = event.target || event.srcElement;
			const itemIdToRemove = target.getAttribute('data-item-selector-id');
			if (main_core.Type.isNull(itemIdToRemove)) {
				return; // nothing to do
			}
			if (this.#isValueSelected(itemIdToRemove)) {
				this.removeValue(itemIdToRemove, true);
			}
		}
		#onMenuItemClick(value, event, item) {
			if (!this.#multiple) {
				this.clearAll();
				this.#valuesMenuPopup.menuItems.forEach(menuItem => {
					main_core.Dom.removeClass(menuItem.getContainer(), MENU_ITEM_CLASS_ACTIVE);
				});
				this.#valuesMenuPopup.close();
			}
			if (this.#isValueSelected(value)) {
				this.removeValue(value, true);
				main_core.Dom.removeClass(item.getContainer(), MENU_ITEM_CLASS_ACTIVE);
				main_core.Dom.addClass(item.getContainer(), MENU_ITEM_CLASS_INACTIVE);
			} else {
				this.addValue(value, true);
				main_core.Dom.removeClass(item.getContainer(), MENU_ITEM_CLASS_INACTIVE);
				main_core.Dom.addClass(item.getContainer(), MENU_ITEM_CLASS_ACTIVE);
			}
		}
		#onWindowResize() {
			this.#applyCurrentValue(750);
		}
		#emitEvent() {
			main_core_events.EventEmitter.emit(this, Events.EVENT_ITEMSELECTOR_VALUE_CHANGE, {
				value: this.getValue()
			});
		}
		// endregion

		// region Utils
		#assertValidParams(params) {
			if (!main_core.Type.isPlainObject(params)) {
				throw new TypeError('BX.Crm.Field.ItemSelector: The "params" argument must be object');
			}
			if (!main_core.Type.isDomNode(params.target)) {
				throw new Error('BX.Crm.Field.ItemSelector: The "target" argument must be DOM node');
			}
			if (!main_core.Type.isArrayFilled(params.valuesList)) {
				throw new Error('BX.Crm.Field.ItemSelector: The "valuesList" argument must be filled');
			}
		}
		#applyCurrentValue(delay) {
			main_core.Runtime.debounce(() => {
				this.setValue(this.#selectedValues || []);
			}, delay, this)();
		}
		#isValueSelected(value) {
			return !main_core.Type.isUndefined(this.#selectedValues.find(item => item.toString() === value.toString()));
		}
		#isTargetOverflown(portion = 0) {
			if (this.#readonlyMode || this.#compactMode) {
				return false;
			}
			const targetWidth = this.#target.offsetWidth;
			const selectedValuesWidth = this.#selectedValueWrapperEl.offsetWidth;
			const addBtnWidth = this.#getAddButtonEl().offsetWidth;
			const result = targetWidth - (selectedValuesWidth + addBtnWidth + portion);
			return result <= 20;
		}
		// endregion
	}

	exports.CompactIcons = CompactIcons;
	exports.Events = Events;
	exports.ItemSelector = ItemSelector;

})(this.BX.Crm.Field = this.BX.Crm.Field || {}, BX, BX.Event, BX.Main, BX.UI);
//# sourceMappingURL=item-selector.bundle.js.map
