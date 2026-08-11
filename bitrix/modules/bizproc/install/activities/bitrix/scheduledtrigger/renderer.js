/* eslint-disable */
(function (exports, main_core) {
	'use strict';

	const SCHEDULE_CONFIG = {
		weekly: {
			rows: ['Interval', 'WeekDays'],
			fields: ['Interval', 'WeekDays']
		},
		monthly: {
			rows: ['Interval', 'MonthDay'],
			fields: ['Interval', 'MonthDay']
		},
		yearly: {
			rows: ['Interval', 'YearMonth', 'MonthDay'],
			fields: ['Interval', 'YearMonth', 'MonthDay']
		},
		daily: {
			rows: ['Interval'],
			fields: ['Interval']
		},
		hourly: {
			rows: ['Interval'],
			fields: ['Interval']
		},
		once: {
			rows: [],
			fields: []
		}
	};
	const ALL_ROWS = ['Interval', 'WeekDays', 'MonthDay', 'YearMonth'];
	const ALL_FIELDS = ['Interval', 'WeekDays', 'MonthDay', 'YearMonth'];
	const TIMEZONE_OFFSET = /\s\[-?\d+]$/;
	const TIME_WITH_MERIDIEM = /(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])\.?m\.?/i;
	const TIME_PLAIN = /(\d{1,2}):(\d{2})(?::\d{2})?/;
	class ScheduledTriggerRenderer {
		#form = null;
		#timePicker = null;
		#runAtInput = null;
		#runAtHidden = null;
		#updateVisibilityBound = null;
		#openTimePickerBound = null;
		#activityFields = {};
		afterFormRender(form, activityFields = {}) {
			this.#form = form;
			this.#activityFields = activityFields;
			this.#updateVisibilityBound = this.#updateVisibility.bind(this);
			this.#openTimePickerBound = this.#openTimePicker.bind(this);
			this.#ensureDateLib().then(() => {
				this.#setupRunAtField();
				this.#bindEvents();
				this.#updateVisibility();
			});
		}
		#ensureDateLib() {
			if (this.#getFormatter()) {
				return Promise.resolve();
			}
			if (BX?.Runtime?.loadExtension) {
				return BX.Runtime.loadExtension('main.date').catch(() => {});
			}
			return Promise.resolve();
		}
		#getFormatter() {
			return typeof BX !== 'undefined' && BX.Main && BX.Main.DateTimeFormat || null;
		}
		destroy() {
			this.#timePicker?.hide();
			this.#timePicker?.destroy();
			this.#timePicker = null;
		}
		#bindEvents() {
			const typeField = this.#getField('ScheduleType');
			if (typeField) {
				main_core.Event.bind(typeField, 'change', this.#updateVisibilityBound);
			}
			const runAtField = this.#getField('RunAt');
			if (runAtField) {
				main_core.Event.bind(runAtField, 'click', this.#openTimePickerBound);
			}
			const runAtTextField = this.#getField('RunAt_text');
			if (runAtTextField) {
				main_core.Event.bind(runAtTextField, 'input', () => this.#clearRunAt());
				main_core.Event.bind(runAtTextField, 'change', () => this.#clearRunAt());
			}
		}
		#openTimePicker() {
			const input = this.#getField('RunAt');
			if (!input) {
				return;
			}
			const openPicker = () => {
				if (!this.#timePicker) {
					this.#timePicker = new BX.UI.DatePicker.DatePicker({
						targetNode: input,
						inputField: input,
						type: 'time',
						timePickerStyle: 'wheel',
						minuteStep: 5,
						events: {
							onSelectChange: () => {
								this.#syncHidden();
							}
						}
					});
				}
				this.#timePicker.show();
			};
			if (BX?.Runtime?.loadExtension) {
				BX.Runtime.loadExtension('ui.date-picker').then(openPicker).catch(() => {});
			} else {
				openPicker();
			}
		}
		#setupRunAtField() {
			const field = this.#form?.querySelector('[name="RunAt"]');
			if (!field) {
				return;
			}
			if (field.tagName === 'INPUT') {
				const input = main_core.Dom.create('input', {
					props: {
						type: 'text',
						autocomplete: 'off',
						value: this.#extractTimeValue(field.value),
						style: 'cursor: pointer; margin-right: 5px;'
					}
				});
				const calendarInput = field.parentNode.querySelector('.calendar-icon');
				main_core.Dom.style(field, 'display', 'none');
				main_core.Dom.style(calendarInput, 'display', 'none');
				main_core.Dom.insertBefore(input, field);
				main_core.Event.bind(input, 'input', () => this.#syncHidden());
				main_core.Event.bind(input, 'change', () => this.#syncHidden());
				this.#runAtInput = input;
				this.#runAtHidden = field;
			}
		}
		#syncHidden() {
			if (!this.#runAtInput || !this.#runAtHidden) {
				return;
			}
			const timeValue = this.#runAtInput.value;
			if (!timeValue) {
				this.#clearRunAt();
				return;
			}
			const time = this.#parseTimeToHM(timeValue);
			if (!time) {
				return;
			}
			const base = this.#getBaseDate();
			base.setHours(time.hours, time.minutes, 0, 0);
			this.#runAtHidden.value = this.#formatDateTime(base);
		}
		#clearRunAt() {
			if (this.#runAtInput) {
				this.#runAtInput.value = '';
			}
			if (this.#runAtHidden) {
				this.#runAtHidden.value = '';
			}
		}
		#extractTimeValue(value) {
			const date = this.#parseDateTime(value);
			return date ? this.#formatTime(date) : '';
		}
		#getBaseDate() {
			return this.#parseDateTime(this.#runAtHidden?.value) || this.#parseDateTime(this.#getFieldSettings('RunAt')?.defaultDate) || new Date();
		}
		#parseDateTime(value) {
			if (!main_core.Type.isStringFilled(value)) {
				return null;
			}
			const formatter = this.#getFormatter();
			const clean = value.replace(TIMEZONE_OFFSET, '').trim();
			if (!clean || !formatter) {
				return null;
			}
			try {
				return formatter.parse(clean) || null;
			} catch (e) {
				return null;
			}
		}
		#formatTime(date) {
			const formatter = this.#getFormatter();
			return formatter ? formatter.format(formatter.getFormat('SHORT_TIME_FORMAT'), date) : '';
		}
		#formatDateTime(date) {
			const formatter = this.#getFormatter();
			return formatter ? formatter.format(formatter.getFormat('FORMAT_DATETIME'), date) : '';
		}
		#parseTimeToHM(value) {
			if (!main_core.Type.isString(value)) {
				return null;
			}
			const meridiem = value.match(TIME_WITH_MERIDIEM);
			if (meridiem) {
				let hours = parseInt(meridiem[1], 10);
				const minutes = parseInt(meridiem[2], 10);
				const isPm = meridiem[3].toLowerCase() === 'p';
				if (isPm) {
					hours = hours === 12 ? 12 : hours + 12;
				} else {
					hours = hours === 12 ? 0 : hours;
				}
				return this.#normalizeHM(hours, minutes);
			}
			const plain = value.match(TIME_PLAIN);
			if (plain) {
				return this.#normalizeHM(parseInt(plain[1], 10), parseInt(plain[2], 10));
			}
			return null;
		}
		#normalizeHM(hours, minutes) {
			if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
				return null;
			}
			return {
				hours,
				minutes
			};
		}
		#updateVisibility() {
			const type = this.#getField('ScheduleType')?.value;
			const currentConfig = SCHEDULE_CONFIG[type] || SCHEDULE_CONFIG.once;
			ALL_ROWS.forEach(rowName => {
				const row = this.#getRow(rowName);
				if (row) {
					if (currentConfig.rows.includes(rowName)) {
						main_core.Dom.show(row);
					} else {
						main_core.Dom.hide(row);
					}
				}
			});
			ALL_FIELDS.forEach(fieldName => {
				const field = this.#getField(fieldName);
				if (field) {
					const shouldEnable = currentConfig.fields.includes(fieldName);
					field.disabled = !shouldEnable;
					if (!shouldEnable) {
						if (fieldName === 'WeekDays') {
							this.#clearWeekDays();
						} else {
							field.value = '';
						}
					}
				}
			});
		}
		#getField(name) {
			if (name === 'RunAt' && this.#runAtInput) {
				return this.#runAtInput;
			}
			const safeName = main_core.Text.encode(name);
			return this.#form?.[`id_${name}`] || this.#form?.elements?.[name] || this.#form?.querySelector(`[name="${safeName}"]`);
		}
		#getFieldSettings(name) {
			const field = this.#activityFields?.[name];
			return main_core.Type.isPlainObject(field?.property?.Settings) ? field.property.Settings : {};
		}
		#getRow(name) {
			const safeName = main_core.Text.encode(name);
			return this.#form?.querySelector(`#row_${safeName}`);
		}
		#clearWeekDays() {
			const weekField = this.#getField('WeekDays');
			if (!weekField) {
				return;
			}
			weekField.disabled = true;
			if (!weekField.options) {
				weekField.value = '';
				return;
			}
			for (const option of weekField.options) {
				option.selected = false;
			}
		}
	}

	exports.ScheduledTriggerRenderer = ScheduledTriggerRenderer;

})(this.window = this.window || {}, BX);
//# sourceMappingURL=renderer.js.map
