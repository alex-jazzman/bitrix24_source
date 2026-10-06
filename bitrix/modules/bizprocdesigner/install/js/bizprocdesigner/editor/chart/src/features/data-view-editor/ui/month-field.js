import { Type } from 'main.core';
import { DatePicker, createUtcDate } from 'ui.date-picker';

const MONTH_VALUE_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const DISPLAY_DATE_FORMAT = 'f Y';

function parseMonthValue(value: ?string): ?Date
{
	if (!MONTH_VALUE_REGEX.test(value ?? ''))
	{
		return null;
	}

	const [year, month] = value.split('-').map(Number);

	return createUtcDate(year, month - 1, 1);
}

function formatMonthValue(date: ?Date): string
{
	if (!Type.isDate(date))
	{
		return '';
	}

	const month = String(date.getUTCMonth() + 1).padStart(2, '0');

	return `${date.getUTCFullYear()}-${month}`;
}

/**
 * A read-only input backed by the ui.date-picker month picker. The input shows the localized
 * month name while the model keeps the DTO-01 period.month format (YYYY-MM).
 */
// @vue/component
export const MonthField = {
	name: 'BizprocDataViewMonthField',
	props: {
		modelValue: {
			type: String,
			default: '',
		},
	},
	emits: ['update:modelValue'],
	data(): Object
	{
		return {
			isOpen: false,
		};
	},
	watch: {
		modelValue(value: string): void
		{
			if (this.picker === null || value === formatMonthValue(this.picker.getSelectedDate()))
			{
				return;
			}

			const date = parseMonthValue(value);
			if (date === null)
			{
				const selected = this.picker.getSelectedDate();
				if (selected !== null)
				{
					this.picker.deselectDate(selected);
				}
				this.$refs.input.value = '';

				return;
			}

			this.picker.selectDate(date);
		},
	},
	created(): void
	{
		this.picker = null;
	},
	mounted(): void
	{
		const input = this.$refs.input;
		const selectedDate = parseMonthValue(this.modelValue);
		this.picker = new DatePicker({
			targetNode: input,
			inputField: input,
			type: 'month',
			dateFormat: DISPLAY_DATE_FORMAT,
			hideOnSelect: true,
			selectedDates: selectedDate === null ? [] : [selectedDate],
			events: {
				onSelectChange: (event) => {
					this.$emit('update:modelValue', formatMonthValue(event.getTarget().getSelectedDate()));
				},

				onShow: () => {
					this.isOpen = true;
				},
				onHide: () => {
					this.isOpen = false;
				},
			},
		});

		if (selectedDate !== null)
		{
			input.value = this.picker.formatDate(selectedDate);
		}
	},
	beforeUnmount(): void
	{
		this.picker?.destroy();
		this.picker = null;
	},
	methods: {
		openPicker(): void
		{
			this.picker?.show();
		},
	},
	template: `
		<input
			ref="input"
			type="text"
			readonly
			class="bizproc-dataview__input bizproc-dataview__input--picker"
			:placeholder="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_PERIOD_MONTH_PLACEHOLDER')"
			autocomplete="off"
			aria-haspopup="dialog"
			:aria-expanded="isOpen ? 'true' : 'false'"
			:data-test-id="$testId('dataViewPeriodMonth')"
			@click="openPicker"
			@keydown.enter.prevent="openPicker"
		>
	`,
};
