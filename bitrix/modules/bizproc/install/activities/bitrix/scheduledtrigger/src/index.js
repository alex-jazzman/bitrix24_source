// @flow
import { Dom, Event, Type, Text } from 'main.core';

const SCHEDULE_CONFIG = {
	weekly: { rows: ['Interval', 'WeekDays'], fields: ['Interval', 'WeekDays'] },
	monthly: { rows: ['Interval', 'MonthDay'], fields: ['Interval', 'MonthDay'] },
	yearly: { rows: ['Interval', 'YearMonth', 'MonthDay'], fields: ['Interval', 'YearMonth', 'MonthDay'] },
	daily: { rows: ['Interval'], fields: ['Interval'] },
	hourly: { rows: ['Interval'], fields: ['Interval'] },
	once: { rows: [], fields: [] },
};

const ALL_ROWS = ['Interval', 'WeekDays', 'MonthDay', 'YearMonth'];
const ALL_FIELDS = ['Interval', 'WeekDays', 'MonthDay', 'YearMonth'];

const TIMEZONE_OFFSET = /\s\[[\d-]+]$/;
const TIME_FORMAT = /(\d{1,2}:\d{2})(?::\d{2})?/;
export class ScheduledTriggerRenderer
{
	#form: ?HTMLFormElement = null;
	#timePicker: any = null;
	#runAtInput: ?HTMLInputElement = null;
	#runAtHidden: ?HTMLInputElement = null;
	#updateVisibilityBound: ?Function = null;
	#openTimePickerBound: ?Function = null;
	#activityFields: {[string]: any} = {};

	afterFormRender(form: HTMLFormElement, activityFields: {[string]: any} = {}): void
	{
		this.#form = form;
		this.#activityFields = activityFields;
		this.#updateVisibilityBound = this.#updateVisibility.bind(this);
		this.#openTimePickerBound = this.#openTimePicker.bind(this);
		this.#setupRunAtField();
		this.#bindEvents();
		this.#updateVisibility();
	}

	#bindEvents(): void
	{
		const typeField = this.#getField('ScheduleType');
		if (typeField)
		{
			Event.bind(typeField, 'change', this.#updateVisibilityBound);
		}

		const runAtField = this.#getField('RunAt');
		if (runAtField)
		{
			Event.bind(runAtField, 'click', this.#openTimePickerBound);
		}

		const runAtTextField = this.#getField('RunAt_text');
		if (runAtTextField)
		{
			Event.bind(runAtTextField, 'input', () => this.#clearRunAt());
			Event.bind(runAtTextField, 'change', () => this.#clearRunAt());
		}
	}

	#openTimePicker(): void
	{
		const input = this.#getField('RunAt');
		if (!input)
		{
			return;
		}

		const openPicker = () => {
			if (!this.#timePicker)
			{
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
						},
					},
				});
			}

			this.#timePicker.show();
		};

		if (BX?.Runtime?.loadExtension)
		{
			BX.Runtime.loadExtension('ui.date-picker')
				.then(openPicker)
				.catch(() => {});
		}
		else
		{
			openPicker();
		}
	}

	#setupRunAtField(): void
	{
		const field = this.#form?.querySelector('[name="RunAt"]');
		if (!field)
		{
			return;
		}

		const MAX_TIME_VALUE_LENGTH = 100;
		const extractTimeValue = (value) => {
			if (!Type.isString(value))
			{
				return '';
			}

			if (value.length > MAX_TIME_VALUE_LENGTH)
			{
				return '';
			}

			const clean = value.replace(TIMEZONE_OFFSET, '');
			const match = clean.match(TIME_FORMAT);

			return match ? match[1] : '';
		};

		const createTimeInput = (initialValue) => {
			return Dom.create('input', {
				props: {
					type: 'text',
					autocomplete: 'off',
					value: extractTimeValue(initialValue),
					style: 'cursor: pointer; margin-right: 5px;',
				},
			});
		};

		if (field.tagName === 'INPUT')
		{
			const input = createTimeInput(field.value);

			const calendarInput = field.parentNode.querySelector('.calendar-icon');
			Dom.style(field, 'display', 'none');
			Dom.style(calendarInput, 'display', 'none');

			Dom.insertBefore(input, field);

			Event.bind(input, 'input', () => this.#syncHidden());
			Event.bind(input, 'change', () => this.#syncHidden());

			this.#runAtInput = input;
			this.#runAtHidden = field;
		}
	}

	#syncHidden(): void
	{
		if (!this.#runAtInput || !this.#runAtHidden)
		{
			return;
		}

		const timeValue = this.#runAtInput.value;
		if (!timeValue)
		{
			this.#clearRunAt();

			return;
		}

		this.#runAtHidden.value = this.#setTimeInDateTime(
			this.#runAtHidden.value,
			timeValue,
		);
	}

	#clearRunAt(): void
	{
		if (this.#runAtInput)
		{
			this.#runAtInput.value = '';
		}

		if (this.#runAtHidden)
		{
			this.#runAtHidden.value = '';
		}
	}

	#setTimeInDateTime(value, time): string
	{
		const TIME_WITH_SECONDS = /^\d{1,2}:\d{2}:\d{2}$/;
		const TIME_IN_DATETIME = /\d{1,2}:\d{2}(:\d{2})?/;

		if (!time)
		{
			return value;
		}

		const offsetMatch = Type.isString(value) ? value.match(TIMEZONE_OFFSET) : null;
		const offset = offsetMatch ? offsetMatch[0] : '';
		const clean = Type.isString(value) ? value.replace(TIMEZONE_OFFSET, '') : '';
		const timeWithSeconds = TIME_WITH_SECONDS.test(time) ? time : `${time}:00`;

		let base = clean;
		if (!base)
		{
			base = this.#buildBaseDateTime(time);
		}
		else if (TIME_IN_DATETIME.test(base))
		{
			base = base.replace(TIME_IN_DATETIME, timeWithSeconds);
		}
		else
		{
			base = `${base} ${timeWithSeconds}`;
		}

		return `${base}${offset}`;
	}

	#buildBaseDateTime(time): string
	{
		const runAtSettings = this.#getFieldSettings('RunAt');
		const baseDate = Type.isString(runAtSettings?.defaultDate) ? runAtSettings.defaultDate : '';
		if (!baseDate)
		{
			return '';
		}

		const [hoursStr = '00', minutesStr = '00'] = time.split(':');
		const hours = Math.max(0, Math.min(23, parseInt(hoursStr, 10) || 0));
		const minutes = Math.max(0, Math.min(59, parseInt(minutesStr, 10) || 0));

		const hoursPadded = hours.toString().padStart(2, '0');
		const minutesPadded = minutes.toString().padStart(2, '0');
		const timeWithSeconds = `${hoursPadded}:${minutesPadded}:00`;

		return TIME_FORMAT.test(baseDate)
			? baseDate.replace(TIME_FORMAT, timeWithSeconds)
			: `${baseDate} ${timeWithSeconds}`;
	}

	#updateVisibility(): void
	{
		const type = this.#getField('ScheduleType')?.value;
		const currentConfig = SCHEDULE_CONFIG[type] || SCHEDULE_CONFIG.once;

		ALL_ROWS.forEach((rowName) => {
			const row = this.#getRow(rowName);
			if (row)
			{
				if (currentConfig.rows.includes(rowName))
				{
					Dom.show(row);
				}
				else
				{
					Dom.hide(row);
				}
			}
		});

		ALL_FIELDS.forEach((fieldName) => {
			const field = this.#getField(fieldName);
			if (field)
			{
				const shouldEnable = currentConfig.fields.includes(fieldName);
				field.disabled = !shouldEnable;

				if (!shouldEnable)
				{
					if (fieldName === 'WeekDays')
					{
						this.#clearWeekDays();
					}
					else
					{
						field.value = '';
					}
				}
			}
		});
	}

	#getField(name: string): ?HTMLElement
	{
		if (name === 'RunAt' && this.#runAtInput)
		{
			return this.#runAtInput;
		}

		const safeName = Text.encode(name);

		return (
			this.#form?.[`id_${name}`]
			|| this.#form?.elements?.[name]
			|| this.#form?.querySelector(`[name="${safeName}"]`)
		);
	}

	#getFieldSettings(name: string): {[string]: any}
	{
		const field = this.#activityFields?.[name];

		return Type.isPlainObject(field?.property?.Settings) ? field.property.Settings : {};
	}

	#getRow(name: string): ?HTMLElement
	{
		const safeName = Text.encode(name);

		return this.#form?.querySelector(`#row_${safeName}`);
	}

	#clearWeekDays(): void
	{
		const weekField = this.#getField('WeekDays');
		if (!weekField)
		{
			return;
		}

		weekField.disabled = true;
		if (!weekField.options)
		{
			weekField.value = '';

			return;
		}

		for (const option of weekField.options)
		{
			option.selected = false;
		}
	}
}
