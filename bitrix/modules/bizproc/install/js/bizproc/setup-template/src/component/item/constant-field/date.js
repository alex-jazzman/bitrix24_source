import { Type } from 'main.core';
import {
	createBoundPicker,
	createDateFromText,
	formatDate,
	isPickerOpenKey,
	parseValue,
	serializeValue,
} from '../../../lib/constant-date/constant-date';

// A single date row: one value of the constant, whether the constant is multiple or not.
// @vue/component
export const ConstantDateControl = {
	name: 'ConstantDateControl',
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
	emits: ['update:modelValue'],
	data(): Object
	{
		return {
			pickedDate: null,
		};
	},
	computed: {
		dateText(): string
		{
			return formatDate(this.pickedDate);
		},
	},
	watch: {
		modelValue(): void
		{
			// The value may be replaced from outside: an edited default of the constant redraws the
			// row. The echo of the value the row has just published is skipped, so the entered date
			// is never rebuilt under the user.
			if (this.modelValue !== this.currentValue())
			{
				this.applyModelValue();
			}
		},
	},
	created(): void
	{
		this.datePicker = null;
		this.applyModelValue();
	},
	beforeUnmount(): void
	{
		this.datePicker?.destroy();
		this.datePicker = null;
	},
	methods: {
		applyModelValue(): void
		{
			// A date has no timezone control, but a value saved with one still has to show its date.
			this.pickedDate = createDateFromText(parseValue(this.modelValue).text);
			// The picker holds the date it was created with, so it is rebuilt on the next opening.
			this.datePicker?.destroy();
			this.datePicker = null;
		},
		handleInputKeydown(event: KeyboardEvent): void
		{
			if (isPickerOpenKey(event))
			{
				event.preventDefault();
				this.openDatePicker();
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
			this.emitValue();
		},
		currentValue(): string
		{
			return serializeValue(this.pickedDate);
		},
		emitValue(): void
		{
			this.$emit('update:modelValue', this.currentValue());
		},
	},
	template: `
		<div
			class="bizproc-setup-template__date-row"
			data-test-id="bizproc-setup-template__form-date-control"
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
					data-test-id="bizproc-setup-template__form-date-value"
					@click="openDatePicker"
					@keydown="handleInputKeydown"
				>
			</div>
		</div>
	`,
};
