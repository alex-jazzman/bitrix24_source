/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Fields = this.BX.Bizproc.Fields || {};
(function (exports, ui_designTokens, ui_iconSet_outline, ui_iconSet_main, main_date, main_core, bizproc_fields, ui_datePicker) {
	'use strict';

	const NUMERIC_OFFSET = /^-?\d+$/;
	const EXPRESSION_VALUE = /^\s*[={]/;
	const TIMEZONE_SETTINGS_ID = 'bizproc.fields.date';
	const ROW_SELECTOR = '.bizproc-fields-date-row';
	const VALUE_INPUT_SELECTOR = '.bizproc-fields-date__input';
	const CALENDAR_BUTTON_SELECTOR = '.bizproc-fields-date__calendar';
	const TIMEZONE_SELECTOR = '.bizproc-type-control-date-lc';
	class DateField extends bizproc_fields.BaseField {
		#pickers = new Map();
		release() {
			this.#pickers.forEach(picker => picker.destroy());
			this.#pickers.clear();
		}
		getDefaultPlaceholder() {
			const mask = main_core.Extension.getSettings('main.date').get('formats.FORMAT_DATE');
			return main_core.Type.isStringFilled(mask) ? mask : main_core.Loc.getMessage('BIZPROC_FIELDS_DATE_PLACEHOLDER') ?? '';
		}
		renderControl(value) {
			const rawValue = main_core.Type.isArray(value) ? value[0] ?? '' : value ?? '';
			const {
				value: dateValue,
				offset
			} = this.splitOffset(rawValue);
			const readOnly = this.isReadOnly();
			const {
				root,
				control,
				valueNode
			} = this.renderTextControl({
				blockClass: 'bizproc-fields-date',
				value: dateValue,
				nonEditable: true,
				rowNodes: [this.#renderTimezone(offset)]
			});
			if (!readOnly) {
				const calendarButton = main_core.Tag.render`
				<button
					type="button"
					class="bizproc-fields-date__calendar"
					aria-label="${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_FIELDS_DATE_OPEN_CALENDAR') ?? '')}"
					data-testid="${main_core.Text.encode(`bizproc-field-calendar-${this.getFieldName()}`)}"
				>
					<div class="ui-icon-set --calendar-2" aria-hidden="true"></div>
				</button>
			`;
				main_core.Dom.append(calendarButton, control);
				this.#bindPickerTriggers(root);
			}
			return {
				root,
				valueNode
			};
		}
		getValue() {
			const nodes = this.getValueNodes();
			if (this.isMultiple()) {
				return nodes.map(node => this.#serializeValue(node)).filter(item => item !== '');
			}
			const node = nodes[0];
			return main_core.Type.isUndefined(node) ? '' : this.#serializeValue(node);
		}
		applyValue(value) {
			const nodes = this.getValueNodes();
			if (this.isMultiple()) {
				const values = main_core.Type.isArray(value) ? value : value.split(',');
				nodes.forEach((node, index) => this.#writeValue(node, values[index] ?? ''));
				return;
			}
			const node = nodes[0];
			if (!main_core.Type.isUndefined(node)) {
				this.#writeValue(node, main_core.Type.isArray(value) ? value[0] ?? '' : value);
			}
		}
		#bindPickerTriggers(row) {
			main_core.Event.bind(row, 'click', event => {
				const trigger = this.#closest(event.target, `${VALUE_INPUT_SELECTOR}, ${CALENDAR_BUTTON_SELECTOR}`);
				if (main_core.Type.isNull(trigger)) {
					return;
				}
				const input = row.querySelector(VALUE_INPUT_SELECTOR);
				if (!main_core.Type.isNull(input)) {
					this.#openPicker(input);
				}
			});
			main_core.Event.bind(row, 'keydown', event => {
				if (event.key !== 'Delete' && event.key !== 'Backspace') {
					return;
				}
				const input = this.#closest(event.target, VALUE_INPUT_SELECTOR);
				if (main_core.Type.isNull(input)) {
					return;
				}
				event.preventDefault();
				this.#clearValue(input);
			});
		}
		#closest(target, selector) {
			return main_core.Type.isElementNode(target) ? target.closest(selector) : null;
		}
		#openPicker(input) {
			const known = this.#pickers.get(input);
			if (!main_core.Type.isUndefined(known)) {
				known.show();
				return;
			}
			const picker = new ui_datePicker.DatePicker({
				targetNode: input,
				inputField: input,
				type: 'date',
				selectionMode: 'single',
				popupOptions: {
					targetContainer: input.ownerDocument?.body || document.body
				}
			});
			picker.subscribe('onSelectChange', () => this.emitChange());
			this.#pickers.set(input, picker);
			picker.show();
		}
		#clearValue(input) {
			input.value = '';
			this.#pickers.get(input)?.deselectAll({
				emitEvents: false
			});
			this.emitChange();
		}
		#renderTimezone(offset) {
			const timezones = this.getTimezones(TIMEZONE_SETTINGS_ID);
			return this.renderTimezoneSelect({
				timezones,
				selected: this.findTimezone(timezones, offset),
				ariaLabel: main_core.Loc.getMessage('BIZPROC_FIELDS_DATE_TIMEZONE') ?? ''
			});
		}
		#serializeValue(valueNode) {
			const value = valueNode.value ?? '';
			if (!main_core.Type.isStringFilled(value) || EXPRESSION_VALUE.test(value)) {
				return value;
			}
			const offset = this.#selectedOffset(valueNode);
			return main_core.Type.isNull(offset) ? value : `${value} [${offset}]`;
		}
		#writeValue(valueNode, value) {
			const {
				value: dateValue,
				offset
			} = this.splitOffset(value);
			valueNode.value = dateValue;
			this.#selectZone(valueNode, offset);
		}
		#selectedOffset(valueNode) {
			const select = this.#getTimezoneSelect(valueNode);
			if (main_core.Type.isNull(select)) {
				return null;
			}
			const zone = this.getTimezones(TIMEZONE_SETTINGS_ID).find(item => String(item.value) === select.value);
			if (main_core.Type.isUndefined(zone)) {
				return null;
			}
			const offset = String(zone.offset);
			return NUMERIC_OFFSET.test(offset) ? offset : null;
		}
		#selectZone(valueNode, offset) {
			const select = this.#getTimezoneSelect(valueNode);
			if (main_core.Type.isNull(select)) {
				return;
			}
			const zone = this.findTimezone(this.getTimezones(TIMEZONE_SETTINGS_ID), offset);
			if (!main_core.Type.isUndefined(zone)) {
				select.value = String(zone.value);
			}
		}
		#getTimezoneSelect(valueNode) {
			const row = valueNode.closest(ROW_SELECTOR);
			return main_core.Type.isNull(row) ? null : row.querySelector(TIMEZONE_SELECTOR);
		}
	}
	bizproc_fields.FieldRegistry.register('date', DateField);

	exports.DateField = DateField;

})(this.BX.Bizproc.Fields.Date = this.BX.Bizproc.Fields.Date || {}, window, window, window, BX.Main, BX, BX.Bizproc.Fields, BX.UI.DatePicker);
//# sourceMappingURL=date.bundle.js.map
