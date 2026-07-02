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
	const TIMEZONE_OFFSET = /\s\[[\d-]+]$/;
	const TIME_FORMAT = /(\d{1,2}:\d{2})(?::\d{2})?/;
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
			this.#setupRunAtField();
			this.#bindEvents();
			this.#updateVisibility();
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
						amPmMode: false,
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
			const MAX_TIME_VALUE_LENGTH = 100;
			const extractTimeValue = value => {
				if (!main_core.Type.isString(value)) {
					return '';
				}
				if (value.length > MAX_TIME_VALUE_LENGTH) {
					return '';
				}
				const clean = value.replace(TIMEZONE_OFFSET, '');
				const match = clean.match(TIME_FORMAT);
				return match ? match[1] : '';
			};
			const createTimeInput = initialValue => {
				return main_core.Dom.create('input', {
					props: {
						type: 'text',
						autocomplete: 'off',
						value: extractTimeValue(initialValue),
						style: 'cursor: pointer; margin-right: 5px;'
					}
				});
			};
			if (field.tagName === 'INPUT') {
				const input = createTimeInput(field.value);
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
			this.#runAtHidden.value = this.#setTimeInDateTime(this.#runAtHidden.value, timeValue);
		}
		#clearRunAt() {
			if (this.#runAtInput) {
				this.#runAtInput.value = '';
			}
			if (this.#runAtHidden) {
				this.#runAtHidden.value = '';
			}
		}
		#setTimeInDateTime(value, time) {
			const TIME_WITH_SECONDS = /^\d{1,2}:\d{2}:\d{2}$/;
			const TIME_IN_DATETIME = /\d{1,2}:\d{2}(:\d{2})?/;
			if (!time) {
				return value;
			}
			const offsetMatch = main_core.Type.isString(value) ? value.match(TIMEZONE_OFFSET) : null;
			const offset = offsetMatch ? offsetMatch[0] : '';
			const clean = main_core.Type.isString(value) ? value.replace(TIMEZONE_OFFSET, '') : '';
			const timeWithSeconds = TIME_WITH_SECONDS.test(time) ? time : `${time}:00`;
			let base = clean;
			if (!base) {
				base = this.#buildBaseDateTime(time);
			} else if (TIME_IN_DATETIME.test(base)) {
				base = base.replace(TIME_IN_DATETIME, timeWithSeconds);
			} else {
				base = `${base} ${timeWithSeconds}`;
			}
			return `${base}${offset}`;
		}
		#buildBaseDateTime(time) {
			const runAtSettings = this.#getFieldSettings('RunAt');
			const baseDate = main_core.Type.isString(runAtSettings?.defaultDate) ? runAtSettings.defaultDate : '';
			if (!baseDate) {
				return '';
			}
			const [hoursStr = '00', minutesStr = '00'] = time.split(':');
			const hours = Math.max(0, Math.min(23, parseInt(hoursStr, 10) || 0));
			const minutes = Math.max(0, Math.min(59, parseInt(minutesStr, 10) || 0));
			const hoursPadded = hours.toString().padStart(2, '0');
			const minutesPadded = minutes.toString().padStart(2, '0');
			const timeWithSeconds = `${hoursPadded}:${minutesPadded}:00`;
			return TIME_FORMAT.test(baseDate) ? baseDate.replace(TIME_FORMAT, timeWithSeconds) : `${baseDate} ${timeWithSeconds}`;
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
