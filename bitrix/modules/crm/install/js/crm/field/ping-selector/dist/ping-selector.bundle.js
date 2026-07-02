/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_timeline_tools, main_core, main_core_events, main_date, main_popup, ui_notification) {
	'use strict';

	const MENU_ITEM_CLASS_ACTIVE = 'menu-popup-item-accept';
	const MENU_ITEM_CLASS_INACTIVE = 'menu-popup-item-none';
	const MENU_ITEM_CLASS_ARROW = 'crm-field-ping-selector-arrow';
	const MENU_ITEM_SHOW_CALENDAR_ID = 'item-selector-menu-id-custom-calendar';
	const CompactIcons = {
		NONE: null,
		BELL: 'bell'
	};
	const PingSelectorEvents = {
		EVENT_PINGSELECTOR_OPEN: 'crm.field.pingselector:open',
		EVENT_PINGSELECTOR_VALUE_CHANGE: 'crm.field.pingselector:change'
	};
	class PingSelector {
		#id;
		#target = null;
		#valuesList = [];
		#selectedValues = new Set();
		#readonlyMode = false;
		#icon = null;
		#deadline = null;
		#selectedValueWrapperEl = null;
		#valuesMenuPopup = null;
		#addButtonCompact = null;
		constructor(params) {
			this.#assertValidParams(params);
			this.#id = params.id || `ping-selector-${main_core.Text.getRandom()}`;
			this.#target = main_core.Type.isDomNode(params.target) ? params.target : null;
			this.#valuesList = main_core.Type.isArrayFilled(params.valuesList) ? params.valuesList.map(item => {
				return {
					...item,
					id: item.id.toString()
				};
			}) : [];
			if (main_core.Type.isArrayFilled(params.selectedValues)) {
				params.selectedValues.forEach(selectedValue => this.#selectedValues.add(selectedValue.toString()));
			}
			this.#readonlyMode = params.readonlyMode === true;
			this.#deadline = main_core.Type.isDate(params?.deadline) ? params.deadline : new Date();
			this.#deadline.setSeconds(0);
			if (main_core.Type.isStringFilled(params.icon) && Object.values(CompactIcons).includes(params.icon)) {
				this.#icon = params.icon;
			}
			this.#create();
			this.#bindEvents();
			this.#applyCurrentValue(100);
		}
		setDeadline(deadline) {
			this.#deadline = deadline;
		}
		getValue() {
			return [...this.#selectedValues.values()];
		}
		setValue(values, isEmitEvent = false) {
			this.clearAll();
			values.forEach(value => {
				this.#addValue(value, isEmitEvent);
			});
		}
		#addValue(value, isEmitEvent = false) {
			const rawValue = this.#valuesList.find(element => {
				return element?.id?.toString() === value?.toString();
			});
			if (!rawValue) {
				return;
			}
			this.#selectedValues.add(rawValue.id);
			this.#adjustAddButtonCompact();
			if (isEmitEvent) {
				this.#emitEvent();
			}
		}
		#removeValue(value, isEmitEvent = false) {
			this.#selectedValues.delete(value);
			this.#adjustAddButtonCompact();
			if (isEmitEvent) {
				this.#emitEvent();
			}
		}
		clearAll() {
			if (this.#selectedValues.size === 0) {
				return;
			}
			this.#selectedValues.forEach(value => this.#removeValue(value));
			this.#selectedValues = new Set();
			this.#adjustAddButtonCompact();
		}
		#create() {
			if (!this.#target) {
				return;
			}
			if (!this.#readonlyMode) {
				this.#addButtonCompact = main_core.Tag.render`
				<span 
					class="crm-field-ping-selector-compact-icon ${main_core.Type.isStringFilled(this.#icon) ? `--${this.#icon}` : ''}"
				></span>
			`;
				this.#adjustAddButtonCompact();
			}
			main_core.Dom.append(this.#getAddButtonEl(), this.#target);
		}
		#adjustAddButtonCompact() {
			if (this.#selectedValues.size > 0) {
				main_core.Dom.removeClass(this.#addButtonCompact, '--empty');
			} else {
				main_core.Dom.addClass(this.#addButtonCompact, '--empty');
			}
		}
		#getAddButtonEl() {
			return this.#addButtonCompact;
		}
		#bindEvents() {
			if (main_core.Type.isDomNode(this.#getAddButtonEl())) {
				main_core.Event.bind(this.#getAddButtonEl(), 'click', this.#onShowPopup.bind(this));
			}
			if (main_core.Type.isDomNode(this.#addButtonCompact)) {
				main_core.Event.bind(this.#addButtonCompact, 'click', this.#onShowPopup.bind(this));
			}
			if (main_core.Type.isDomNode(this.#selectedValueWrapperEl)) {
				main_core.Event.bind(this.#selectedValueWrapperEl, 'click', this.#onRemoveValue.bind(this));
			}
			main_core.Event.unbind(window, 'resize', this.#onWindowResize);
			main_core.Event.bind(window, 'resize', this.#onWindowResize.bind(this));
		}
		#onShowPopup() {
			const menuItems = this.#getPreparedMenuItems();

			// @todo temporary, need other fix
			const angle = {
				offset: 29,
				position: 'top'
			};
			const menuParams = {
				closeByEsc: true,
				autoHide: true,
				offsetLeft: this.#getAddButtonEl().offsetWidth - 16,
				angle,
				cacheable: false
			};
			this.#valuesMenuPopup = main_popup.MenuManager.create(this.#id, this.#getAddButtonEl(), menuItems, menuParams);
			this.#valuesMenuPopup.show();
			main_core_events.EventEmitter.emit(this, PingSelectorEvents.EVENT_PINGSELECTOR_OPEN);
		}
		#getPreparedMenuItems() {
			const items = this.#valuesList.map(item => this.#getPreparedMenuItem(item));
			items.push(this.#getCalendarMenuItem());
			return items;
		}
		#getPreparedMenuItem(item) {
			return {
				id: `ping-selector-menu-id-${item.id}`,
				className: this.#isValueSelected(item.id) ? MENU_ITEM_CLASS_ACTIVE : MENU_ITEM_CLASS_INACTIVE,
				onclick: this.#onMenuItemClick.bind(this, item.id),
				html: main_core.Text.encode(item.title)
			};
		}
		#getCalendarMenuItem() {
			return {
				id: MENU_ITEM_SHOW_CALENDAR_ID,
				className: MENU_ITEM_CLASS_ARROW,
				onclick: event => {
					this.#showCalendar(event.target);
				},
				html: main_core.Loc.getMessage('CRM_FIELD_PING_SELECTOR_OTHER_TIME')
			};
		}
		#showCalendar(target) {
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			BX.calendar({
				node: target,
				bTime: true,
				bHideTime: false,
				bSetFocus: false,
				value: main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateTimeFormat(), this.#deadline),
				callback: this.#addCustomValue.bind(this)
			});
		}
		#addCustomValue(date) {
			if (date.getTime() > this.#deadline.getTime()) {
				this.#close();
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CRM_FIELD_PING_SELECTOR_WRONG_TIME'),
					autoHideDelay: 3000
				});
				return;
			}
			const offset = Math.floor((this.#deadline.getTime() - date.getTime()) / 1000 / 60);
			this.#selectedValues.add(offset.toString());
			const customValue = {
				id: offset.toString(),
				title: this.#getOffsetTitle(offset)
			};
			this.#valuesList.push(customValue);
			this.#valuesList = this.#valuesList.sort((a, b) => {
				const offset1 = Number(a.id);
				const offset2 = Number(b.id);
				return offset1 < offset2 ? -1 : offset1 > offset2 ? 1 : 0;
			});
			this.#close();
			this.#adjustAddButtonCompact();
			this.#emitEvent();
		}
		#getOffsetTitle(offset) {
			const minutesInHour = 60;
			const days = Math.floor(offset / (minutesInHour * 24));
			let daysString = null;
			if (days > 0) {
				daysString = main_core.Loc.getMessagePlural('CRM_FIELD_PING_SELECTOR_DAY', days, {
					'#COUNT#': days
				});
			}
			const hours = Math.floor(offset % (minutesInHour * 24) / minutesInHour);
			let hoursString = null;
			if (hours > 0) {
				hoursString = main_core.Loc.getMessagePlural('CRM_FIELD_PING_SELECTOR_HOUR', hours, {
					'#COUNT#': hours
				});
			}
			const minutes = Math.floor(offset % minutesInHour);
			let minutesString = null;
			if (minutes > 0) {
				minutesString = main_core.Loc.getMessagePlural('CRM_FIELD_PING_SELECTOR_MINUTE', minutes, {
					'#COUNT#': minutes
				});
			}
			if (days > 0 && hours > 0 && minutes > 0) {
				return main_core.Loc.getMessage('CRM_FIELD_PING_SELECTOR_CUSTOM_OFFSET_DAY_HOUR_MINUTE_TITLE', {
					'#DAYS#': daysString,
					'#HOURS#': hoursString,
					'#MINUTES#': minutesString
				});
			}
			if (days > 0 && hours > 0) {
				return main_core.Loc.getMessage('CRM_FIELD_PING_SELECTOR_CUSTOM_OFFSET_DAY_HOUR_TITLE', {
					'#DAYS#': daysString,
					'#HOURS#': hoursString
				});
			}
			if (days > 0 && minutes > 0) {
				return main_core.Loc.getMessage('CRM_FIELD_PING_SELECTOR_CUSTOM_OFFSET_DAY_MINUTE_TITLE', {
					'#DAYS#': daysString,
					'#MINUTES#': minutesString
				});
			}
			if (days > 0) {
				return main_core.Loc.getMessage('CRM_FIELD_PING_SELECTOR_CUSTOM_OFFSET_DAY_TITLE', {
					'#DAYS#': daysString
				});
			}
			if (hours > 0 && minutes > 0) {
				return main_core.Loc.getMessage('CRM_FIELD_PING_SELECTOR_CUSTOM_OFFSET_HOUR_MINUTE_TITLE', {
					'#HOURS#': hoursString,
					'#MINUTES#': minutesString
				});
			}
			if (hours > 0) {
				return main_core.Loc.getMessage('CRM_FIELD_PING_SELECTOR_CUSTOM_OFFSET_HOUR_TITLE', {
					'#HOURS#': hoursString
				});
			}
			return main_core.Loc.getMessage('CRM_FIELD_PING_SELECTOR_CUSTOM_OFFSET_MINUTE_TITLE', {
				'#MINUTES#': minutesString
			});
		}
		#close() {
			this.#valuesMenuPopup.close();
			main_popup.MenuManager.destroy(this.#id);
		}
		#onRemoveValue(event) {
			const target = event.target || event.srcElement;
			const itemIdToRemove = target.getAttribute('data-ping-selector-id');
			if (main_core.Type.isNull(itemIdToRemove)) {
				return; // nothing to do
			}
			if (this.#isValueSelected(itemIdToRemove)) {
				this.#removeValue(itemIdToRemove, true);
			}
		}
		#onMenuItemClick(value, event, item) {
			if (this.#isValueSelected(value)) {
				this.#removeValue(value, true);
				main_core.Dom.removeClass(item.getContainer(), MENU_ITEM_CLASS_ACTIVE);
				main_core.Dom.addClass(item.getContainer(), MENU_ITEM_CLASS_INACTIVE);
			} else {
				this.#addValue(value, true);
				main_core.Dom.removeClass(item.getContainer(), MENU_ITEM_CLASS_INACTIVE);
				main_core.Dom.addClass(item.getContainer(), MENU_ITEM_CLASS_ACTIVE);
			}
		}
		#onWindowResize() {
			this.#applyCurrentValue(750);
		}
		#emitEvent() {
			main_core_events.EventEmitter.emit(this, PingSelectorEvents.EVENT_PINGSELECTOR_VALUE_CHANGE, {
				value: this.getValue()
			});
		}
		#assertValidParams(params) {
			if (!main_core.Type.isPlainObject(params)) {
				throw new TypeError('BX.Crm.Field.PingSelector: The "params" argument must be object');
			}
			if (!main_core.Type.isDomNode(params.target)) {
				throw new Error('BX.Crm.Field.PingSelector: The "target" argument must be DOM node');
			}
			if (!main_core.Type.isArrayFilled(params.valuesList)) {
				throw new Error('BX.Crm.Field.PingSelector: The "valuesList" argument must be filled');
			}
		}
		#applyCurrentValue(delay) {
			main_core.Runtime.debounce(() => {
				this.setValue([...this.#selectedValues] || []);
			}, delay, this)();
		}
		#isValueSelected(value) {
			return this.#selectedValues.has(value);
		}
	}

	exports.CompactIcons = CompactIcons;
	exports.PingSelector = PingSelector;
	exports.PingSelectorEvents = PingSelectorEvents;

})(this.BX.Crm.Field = this.BX.Crm.Field || {}, BX.Crm.Timeline, BX, BX.Event, BX.Main, BX.Main, BX);
//# sourceMappingURL=ping-selector.bundle.js.map
