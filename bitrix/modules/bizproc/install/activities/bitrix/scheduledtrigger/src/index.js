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

const TIMEZONE_OFFSET = /\s\[-?\d+]$/;
const TIME_WITH_MERIDIEM = /(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])\.?m\.?/i;
const TIME_PLAIN = /(\d{1,2}):(\d{2})(?::\d{2})?/;

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

		this.#ensureDateLib().then(() => {
			this.#setupRunAtField();
			this.#bindEvents();
			this.#updateVisibility();
		});
	}

	#ensureDateLib(): Promise<any>
	{
		if (this.#getFormatter())
		{
			return Promise.resolve();
		}

		if (BX?.Runtime?.loadExtension)
		{
			return BX.Runtime.loadExtension('main.date').catch(() => {});
		}

		return Promise.resolve();
	}

	#getFormatter(): ?any
	{
		return (typeof BX !== 'undefined' && BX.Main && BX.Main.DateTimeFormat) || null;
	}

	destroy(): void
	{
		this.#timePicker?.hide();
		this.#timePicker?.destroy();
		this.#timePicker = null;
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

		if (field.tagName === 'INPUT')
		{
			const input = Dom.create('input', {
				props: {
					type: 'text',
					autocomplete: 'off',
					value: this.#extractTimeValue(field.value),
					style: 'cursor: pointer; margin-right: 5px;',
				},
			});

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

		const time = this.#parseTimeToHM(timeValue);
		if (!time)
		{
			return;
		}

		const base = this.#getBaseDate();
		base.setHours(time.hours, time.minutes, 0, 0);

		this.#runAtHidden.value = this.#formatDateTime(base);
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

	#extractTimeValue(value: any): string
	{
		const date = this.#parseDateTime(value);

		return date ? this.#formatTime(date) : '';
	}

	#getBaseDate(): Date
	{
		return (
			this.#parseDateTime(this.#runAtHidden?.value)
			|| this.#parseDateTime(this.#getFieldSettings('RunAt')?.defaultDate)
			|| new Date()
		);
	}

	#parseDateTime(value: any): ?Date
	{
		if (!Type.isStringFilled(value))
		{
			return null;
		}

		const formatter = this.#getFormatter();
		const clean = value.replace(TIMEZONE_OFFSET, '').trim();
		if (!clean || !formatter)
		{
			return null;
		}

		try
		{
			return formatter.parse(clean) || null;
		}
		catch (e)
		{
			return null;
		}
	}

	#formatTime(date: Date): string
	{
		const formatter = this.#getFormatter();

		return formatter ? formatter.format(formatter.getFormat('SHORT_TIME_FORMAT'), date) : '';
	}

	#formatDateTime(date: Date): string
	{
		const formatter = this.#getFormatter();

		return formatter ? formatter.format(formatter.getFormat('FORMAT_DATETIME'), date) : '';
	}

	#parseTimeToHM(value: any): ?{ hours: number, minutes: number }
	{
		if (!Type.isString(value))
		{
			return null;
		}

		const meridiem = value.match(TIME_WITH_MERIDIEM);
		if (meridiem)
		{
			let hours = parseInt(meridiem[1], 10);
			const minutes = parseInt(meridiem[2], 10);
			const isPm = meridiem[3].toLowerCase() === 'p';

			if (isPm)
			{
				hours = hours === 12 ? 12 : hours + 12;
			}
			else
			{
				hours = hours === 12 ? 0 : hours;
			}

			return this.#normalizeHM(hours, minutes);
		}

		const plain = value.match(TIME_PLAIN);
		if (plain)
		{
			return this.#normalizeHM(parseInt(plain[1], 10), parseInt(plain[2], 10));
		}

		return null;
	}

	#normalizeHM(hours: number, minutes: number): ?{ hours: number, minutes: number }
	{
		if (
			Number.isNaN(hours)
			|| Number.isNaN(minutes)
			|| hours < 0 || hours > 23
			|| minutes < 0 || minutes > 59
		)
		{
			return null;
		}

		return { hours, minutes };
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
