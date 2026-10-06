import { Extension, Loc, Type } from 'main.core';
import {
	createBoundPicker,
	createDateFromText,
	formatDate,
	isPickerOpenKey,
	parseValue,
	serializeValue,
	type ConstantTimezone,
} from 'bizproc.setup-template';

const EXTENSION_NAME = 'bizproc.setup-template-activity';

// A constant is filled in for the server or for the user, so the module-wide zone list is narrowed
// to these two and titled with the phrases of the constant form.
const TIMEZONE_TITLES = new Map([
	['', 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_TIMEZONE_SERVER'],
	['current', 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_TIMEZONE_USER'],
]);

let offeredTimezones: ?Array<ConstantTimezone> = null;

/**
 * Narrowing the module-wide zone list gives the same two zones for the whole page, so it is done
 * once: the constant form is reopened for every constant.
 */
export function getTimezones(): Array<ConstantTimezone>
{
	offeredTimezones ??= Object.freeze(
		Extension.getSettings(EXTENSION_NAME)
			.get('timezones', [])
			.filter((zone: ConstantTimezone) => TIMEZONE_TITLES.has(zone.value))
			.map((zone: ConstantTimezone) => ({ ...zone, text: Loc.getMessage(TIMEZONE_TITLES.get(zone.value)) })),
	);

	return offeredTimezones;
}

// @vue/component
export const ConstantValueDate = {
	name: 'ConstantValueDate',
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
			pickedDate: null,
		};
	},
	computed: {
		dateText(): string
		{
			return formatDate(this.pickedDate);
		},
	},
	// No `watch modelValue` here, unlike the same control of the launch form: the default value of a
	// constant is replaced only by a change of its type, and that change recreates the control.
	created(): void
	{
		this.datePicker = null;
		// A date has no timezone control, but a value saved with one still has to show its date.
		this.pickedDate = createDateFromText(parseValue(this.modelValue).text);
	},
	beforeUnmount(): void
	{
		this.datePicker?.destroy();
		this.datePicker = null;
	},
	methods: {
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
			const input = this.$refs.dateInput;
			if (!input)
			{
				return;
			}

			if (this.datePicker === null)
			{
				this.datePicker = createBoundPicker({
					input,
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
			this.$emit('update:modelValue', serializeValue(selectedDate));
		},
	},
	template: `
		<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon ui-ctl-w100 ui-ctl-sm">
			<div class="ui-ctl-after ui-ctl-icon-calendar"></div>
			<input
				ref="dateInput"
				:value="dateText"
				type="text"
				class="ui-ctl-element"
				:aria-label="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_VALUE')"
				:placeholder="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_DATE_PLACEHOLDER')"
				readonly
				data-testid="bizproc-setup-template-constant-value-date"
				@click="openDatePicker"
				@keydown="handleInputKeydown"
			/>
		</div>
	`,
};
