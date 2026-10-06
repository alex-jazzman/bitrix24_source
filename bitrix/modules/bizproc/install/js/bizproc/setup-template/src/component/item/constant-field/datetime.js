import { Type } from 'main.core';
import {
	createBoundPicker,
	createDateFromText,
	formatDate,
	getTimezones,
	isPickerOpenKey,
	parseValue,
	serializeValue,
	VALUE_FORMATS,
	type ConstantTimezone,
} from '../../../lib/constant-date/constant-date';

const TIME_PICKER_OPTIONS = Object.freeze({
	type: 'time',
	timePickerStyle: 'wheel',
	amPmMode: false,
	minuteStep: 5,
});

// A single date and time row: one value of the constant, whether the constant is multiple or not.
// @vue/component
export const ConstantDatetimeControl = {
	name: 'ConstantDatetimeControl',
	props: {
		/** @type ConstantItem */
		item: {
			type: Object,
			required: true,
		},
		modelValue: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		labelledbyId: {
			type: String,
			default: '',
		},
		describedbyId: {
			type: String,
			default: '',
		},
		invalid: {
			type: Boolean,
			default: false,
		},
		required: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue', 'dateMissingChange'],
	data(): Object
	{
		return {
			pickedDate: null,
			pickedTime: null,
			timezoneValue: '',
			timezones: [],
		};
	},
	computed: {
		dateText(): string
		{
			return formatDate(this.pickedDate);
		},
		timeText(): string
		{
			return formatDate(this.pickedTime, VALUE_FORMATS.TIME);
		},
		timezone(): ?ConstantTimezone
		{
			return this.timezones.find((zone: ConstantTimezone) => zone.value === this.timezoneValue) ?? null;
		},
		/**
		 * Date and time are picked separately, so they are merged here.
		 * A date without a time means midnight; a time without a date is not a value yet.
		 */
		pickedDateTime(): ?Date
		{
			if (!Type.isDate(this.pickedDate))
			{
				return null;
			}

			const dateTime = new Date(this.pickedDate.getTime());
			dateTime.setUTCHours(this.pickedTime?.getUTCHours() ?? 0, this.pickedTime?.getUTCMinutes() ?? 0, 0, 0);

			return dateTime;
		},
		/**
		 * A time picked with no date shows in the field but is not a value yet, so the row tells the
		 * form about it: on submit the form asks for the date instead of reporting an empty field.
		 */
		isDateMissing(): boolean
		{
			return !Type.isDate(this.pickedDate) && Type.isDate(this.pickedTime);
		},
	},
	watch: {
		isDateMissing: {
			handler(isDateMissing: boolean): void
			{
				this.$emit('dateMissingChange', isDateMissing);
			},
			immediate: true,
		},
		modelValue(): void
		{
			// The value may be replaced from outside: an edited default of the constant redraws the
			// row. The echo of the value the row has just published is skipped, so the entered date
			// and time are never rebuilt under the user.
			if (this.modelValue !== this.currentValue())
			{
				this.applyModelValue();
			}
		},
	},
	created(): void
	{
		this.datePicker = null;
		this.timePicker = null;
		this.timezones = getTimezones();
		this.applyModelValue();
	},
	beforeUnmount(): void
	{
		// A removed row takes its report with it: the field aggregates the rows it still has.
		this.$emit('dateMissingChange', false);
		this.datePicker?.destroy();
		this.timePicker?.destroy();
		this.datePicker = null;
		this.timePicker = null;
	},
	methods: {
		applyModelValue(): void
		{
			const { text, timezone } = parseValue(this.modelValue, this.timezones);
			const storedDateTime = createDateFromText(text);

			this.pickedDate = storedDateTime;
			this.pickedTime = storedDateTime;
			this.timezoneValue = timezone?.value ?? '';
			// The pickers hold the date they were created with, so they are rebuilt on the next opening.
			this.datePicker?.destroy();
			this.timePicker?.destroy();
			this.datePicker = null;
			this.timePicker = null;
		},
		handleDateInputKeydown(event: KeyboardEvent): void
		{
			if (isPickerOpenKey(event))
			{
				event.preventDefault();
				this.openDatePicker();
			}
		},
		handleTimeInputKeydown(event: KeyboardEvent): void
		{
			if (isPickerOpenKey(event))
			{
				event.preventDefault();
				this.openTimePicker();
			}
		},
		openDatePicker(): void
		{
			if (this.disabled || !this.$refs.dateInput)
			{
				return;
			}

			if (this.datePicker === null)
			{
				this.datePicker = createBoundPicker({
					input: this.$refs.dateInput,
					pickerId: 'day',
					onSelect: this.handleDateSelect,
					pickerOptions: {
						type: 'date',
						selectedDates: this.pickedDate === null ? [] : [this.pickedDate],
					},
				});
			}

			this.datePicker.show();
		},
		openTimePicker(): void
		{
			if (this.disabled || !this.$refs.timeInput)
			{
				return;
			}

			if (this.timePicker === null)
			{
				this.timePicker = createBoundPicker({
					input: this.$refs.timeInput,
					pickerId: 'time',
					onSelect: this.handleTimeSelect,
					pickerOptions: {
						...TIME_PICKER_OPTIONS,
						selectedDates: this.pickedTime === null ? [] : [this.pickedTime],
					},
				});
			}

			this.timePicker.show();
		},
		handleDateSelect(): void
		{
			// The callback is deferred, so by the time it runs the picker may be gone: the row was
			// unmounted or the value was replaced from outside.
			if (!this.datePicker)
			{
				return;
			}

			const selectedDate = this.datePicker.getSelectedDate();
			if (!Type.isDate(selectedDate))
			{
				return;
			}

			this.pickedDate = selectedDate;
			// A date picked with no time is midnight, and the time control shows it instead of staying empty.
			this.pickedTime ??= this.pickedDateTime;
			this.emitValue();
		},
		handleTimeSelect(): void
		{
			if (!this.timePicker)
			{
				return;
			}

			const selectedTime = this.timePicker.getSelectedDate() ?? this.timePicker.getFocusDate();
			if (!Type.isDate(selectedTime))
			{
				return;
			}

			this.pickedTime = selectedTime;
			this.emitValue();
		},
		handleTimezoneChange(event: Event): void
		{
			this.timezoneValue = event.target.value;
			this.emitValue();
		},
		currentValue(): string
		{
			return serializeValue(this.pickedDateTime, { timezone: this.timezone, isDateTime: true });
		},
		emitValue(): void
		{
			this.$emit('update:modelValue', this.currentValue());
		},
	},
	template: `
		<div
			class="bizproc-setup-template__date-row"
			data-test-id="bizproc-setup-template__form-datetime-control"
		>
			<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon ui-ctl-w100">
				<div class="ui-ctl-after ui-ctl-icon-calendar"></div>
				<input
					ref="dateInput"
					:value="dateText"
					type="text"
					class="ui-ctl-element"
					:disabled="disabled"
					:aria-labelledby="labelledbyId || null"
					:aria-describedby="describedbyId || null"
					:aria-invalid="invalid ? 'true' : null"
					:aria-required="required ? 'true' : null"
					:placeholder="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_DATE_PLACEHOLDER')"
					readonly
					data-test-id="bizproc-setup-template__form-datetime-date"
					@click="openDatePicker"
					@keydown="handleDateInputKeydown"
				>
			</div>
			<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon ui-ctl-w100">
				<div class="ui-ctl-after ui-ctl-icon-clock"></div>
				<input
					ref="timeInput"
					:value="timeText"
					type="text"
					class="ui-ctl-element"
					:disabled="disabled"
					:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_TIME')"
					:aria-describedby="describedbyId || null"
					:aria-invalid="invalid ? 'true' : null"
					:placeholder="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_TIME_PLACEHOLDER')"
					readonly
					data-test-id="bizproc-setup-template__form-datetime-time"
					@click="openTimePicker"
					@keydown="handleTimeInputKeydown"
				>
			</div>
			<div
				v-if="timezones.length > 0"
				class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100 --timezone"
			>
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				<select
					:value="timezoneValue"
					class="ui-ctl-element"
					:disabled="disabled"
					:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_TIMEZONE')"
					data-test-id="bizproc-setup-template__form-datetime-timezone"
					@change="handleTimezoneChange"
				>
					<option
						v-for="zone in timezones"
						:key="zone.value"
						:value="zone.value"
					>
						{{ zone.text }}
					</option>
				</select>
			</div>
		</div>
	`,
};
