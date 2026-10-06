import { Type } from 'main.core';
import {
	createBoundPicker,
	createDateFromText,
	formatDate,
	isPickerOpenKey,
	parseValue,
	serializeValue,
	VALUE_FORMATS,
	type ConstantTimezone,
} from 'bizproc.setup-template';
import { getTimezones } from './date';
import './datetime.css';

const TIME_PICKER_OPTIONS = Object.freeze({
	type: 'time',
	timePickerStyle: 'wheel',
	amPmMode: false,
	minuteStep: 5,
});

// @vue/component
export const ConstantValueDateTime = {
	name: 'ConstantValueDateTime',
	props: {
		modelValue: {
			type: String,
			default: '',
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
		 * A time picked with no date shows in the field but is not a value yet, so the form of the
		 * constant is told about it and asks for the date when the constant is saved.
		 */
		isDateMissing(): boolean
		{
			return !Type.isDate(this.pickedDate) && Type.isDate(this.pickedTime);
		},
	},
	// Unlike the same control of the launch form, `modelValue` is deliberately not watched here: the
	// default value of a constant is replaced only by a change of its type, and that change recreates
	// the control.
	watch: {
		isDateMissing: {
			handler(isDateMissing: boolean): void
			{
				this.$emit('dateMissingChange', isDateMissing);
			},
			immediate: true,
		},
	},
	created(): void
	{
		this.datePicker = null;
		this.timePicker = null;
		this.timezones = getTimezones();

		const { text, timezone } = parseValue(this.modelValue, this.timezones);
		const storedDateTime = createDateFromText(text);

		this.pickedDate = storedDateTime;
		this.pickedTime = storedDateTime;
		this.timezoneValue = timezone?.value ?? '';
	},
	beforeUnmount(): void
	{
		this.datePicker?.destroy();
		this.timePicker?.destroy();
		this.datePicker = null;
		this.timePicker = null;
	},
	methods: {
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
			if (!this.$refs.dateInput)
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
			if (!this.$refs.timeInput)
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
			// The callback is deferred, so by the time it runs the picker may be gone: the form was
			// closed or the value was replaced from outside.
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
		emitValue(): void
		{
			this.$emit('update:modelValue', serializeValue(this.pickedDateTime, {
				timezone: this.timezone,
				isDateTime: true,
			}));
		},
	},
	template: `
		<div
			class="bizproc-setuptemplateactivity-constant-value-datetime"
			role="group"
			:aria-label="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_VALUE')"
			data-testid="bizproc-setup-template-constant-value-datetime"
		>
			<div class="bizproc-setuptemplateactivity-constant-value-datetime__pickers">
				<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon ui-ctl-w100 ui-ctl-sm">
					<div class="ui-ctl-after ui-ctl-icon-calendar"></div>
					<input
						ref="dateInput"
						:value="dateText"
						type="text"
						class="ui-ctl-element"
						:placeholder="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_DATE_PLACEHOLDER')"
						readonly
						data-testid="bizproc-setup-template-constant-value-datetime-date"
						@click="openDatePicker"
						@keydown="handleDateInputKeydown"
					/>
				</div>
				<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon ui-ctl-w100 ui-ctl-sm">
					<div class="ui-ctl-after ui-ctl-icon-clock"></div>
					<input
						ref="timeInput"
						:value="timeText"
						type="text"
						class="ui-ctl-element"
						:placeholder="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_TIME_PLACEHOLDER')"
						readonly
						data-testid="bizproc-setup-template-constant-value-datetime-time"
						@click="openTimePicker"
						@keydown="handleTimeInputKeydown"
					/>
				</div>
			</div>
			<div
				v-if="timezones.length > 0"
				class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100 ui-ctl-sm"
			>
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				<select
					:value="timezoneValue"
					class="ui-ctl-element"
					:aria-label="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_TIMEZONE_LABEL')"
					data-testid="bizproc-setup-template-constant-value-datetime-timezone"
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
