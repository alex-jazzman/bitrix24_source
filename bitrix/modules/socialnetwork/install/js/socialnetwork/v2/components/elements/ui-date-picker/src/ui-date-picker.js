import { Runtime } from 'main.core';
import { DatePicker, DatePickerEvent } from 'ui.date-picker';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { BInput, InputDesign } from 'ui.system.input.vue';

import { Calendar } from 'socialnetwork.v2.lib.calendar';
import { Timezone } from 'socialnetwork.v2.lib.timezone';

// @vue/component
export const UiDatePicker = {
	name: 'UiDatePicker',
	components: {
		BInput,
	},
	props: {
		modelValue: {
			type: [Number, Date],
			default: null,
		},
		label: {
			type: String,
			default: '',
		},
		hideClear: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		targetContainer: {
			type: [HTMLElement, null],
			default: null,
		},
	},
	emits: ['update:modelValue'],
	setup(): { Outline: typeof Outline, InputDesign: typeof InputDesign }
	{
		return {
			Outline,
			InputDesign,
		};
	},
	data(): { isPickerShown: boolean }
	{
		return {
			isPickerShown: false,
		};
	},
	computed: {
		formattedDate(): string
		{
			if (!this.modelValue)
			{
				return '';
			}

			const ts = this.modelValue instanceof Date
				? this.modelValue.getTime()
				: this.modelValue;

			return this.formatDate(ts);
		},
		design(): string
		{
			return this.disabled ? InputDesign.Disabled : InputDesign.Grey;
		},
	},
	unmounted(): void
	{
		this.datePicker?.destroy();
	},
	methods: {
		formatDate(ts: number): string
		{
			return Calendar.formatDate(ts, { forceYear: true });
		},
		preparePickerTimestamp(date: ?Date): ?number
		{
			if (!date)
			{
				return null;
			}

			const dateTs = Calendar.createDateFromUtc(date).getTime();

			return dateTs - Timezone.getOffset(dateTs);
		},
		clearValue(): void
		{
			this.$emit('update:modelValue', null);
		},
		getDatePicker(): DatePicker
		{
			this.handlePickerChangedDebounced ??= Runtime.debounce(this.handlePickerChanged, 10, this);
			this.datePicker ??= new DatePicker({
				enableTime: false,
				selectionMode: 'single',
				defaultTime: Calendar.dayEndTime,
				popupOptions: {
					animation: 'fading',
					targetContainer: this.targetContainer || document.body,
				},
				events: {
					[DatePickerEvent.SELECT]: this.handlePickerChangedDebounced,
					[DatePickerEvent.DESELECT]: this.handlePickerChangedDebounced,
					onShow: (): void => {
						this.isPickerShown = true;
					},
					onHide: (): void => {
						this.isPickerShown = false;
					},
				},
			});

			return this.datePicker;
		},
		handlePickerChanged(): void
		{
			const ts = this.preparePickerTimestamp(this.datePicker.getSelectedDate());

			this.$emit('update:modelValue', ts);
		},
		handleDateClick({ currentTarget }: { currentTarget: HTMLElement }): void
		{
			const datePicker = this.getDatePicker();
			datePicker.setTargetNode(currentTarget);

			if (this.modelValue)
			{
				const ts = this.modelValue instanceof Date
					? this.modelValue.getTime()
					: this.modelValue;

				datePicker.setFocusDate(ts + Timezone.getOffset(ts));
			}

			datePicker.show();
		},
	},
	template: `
		<BInput
			:modelValue="formattedDate"
			:label
			:icon="Outline.CALENDAR_WITH_SLOTS"
			:design
			:active="isPickerShown"
			:withClear="!hideClear && Boolean(modelValue)"
			class="socialnetwork--project-wizard--field-shadow"
			clickable
			@clear="clearValue"
			@click="handleDateClick"
		/>
	`,
};
