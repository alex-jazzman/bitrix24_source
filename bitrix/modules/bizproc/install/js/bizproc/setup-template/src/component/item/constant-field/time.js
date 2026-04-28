// @flow
import { Event, Extension, Type } from 'main.core';
import { DatePicker } from 'ui.date-picker';

const boundTimePickers = new WeakSet();

const REGEX_PATTERNS = {
	TIME_FORMAT: /(\d{1,2}:\d{2})(?::\d{2})?/,
	TIMEZONE_OFFSET: /\s\[[\d-]+]$/,
};

// @vue/component
export const ConstantTime = {
	name: 'ConstantTime',
	props: {
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
	},
	emits: ['update:modelValue'],
	data(): Object
	{
		return {
			timeValue: '',
			timezone: '',
			timezones: [],
			timePicker: null,
		};
	},
	mounted(): void
	{
		this.timezones = Extension.getSettings('bizproc.setup-template')?.timezones;
		this.syncFromModel();
	},
	beforeUnmount(): void
	{
		if (this.timePicker?.destroy)
		{
			this.timePicker.destroy();
			this.timePicker = null;
		}
	},
	methods: {
		syncFromModel(): void
		{
			this.applyValueFromModule();
			this.applyTimezoneFromModel();
		},
		getDefaultTimezone(): string
		{
			return 'current';
		},
		applyValueFromModule(): void
		{
			const model = this.modelValue;

			this.timeValue = this.extractTimeValue(Type.isString(model) ? model : '');
		},
		applyTimezoneFromModel(): void
		{
			const value = this.modelValue;

			const timezoneOffsetRegex = /\s\[[\d-]+]$/;
			const defaultValue = Type.isString(value) ? value : '';
			const match = defaultValue.match(timezoneOffsetRegex);
			const offset = (match?.[0] ?? '').replaceAll(/[\s[\]]/g, '');

			const timezones = this.timezones ?? [];

			this.timezone = timezones.find((zone) => String(zone.offset) === offset)?.value
				?? this.getDefaultTimezone();
		},
		extractTimeValue(value: string): string
		{
			if (!Type.isString(value))
			{
				return '';
			}

			const clean = value.replace(REGEX_PATTERNS.TIMEZONE_OFFSET, '');
			const match = clean.match(REGEX_PATTERNS.TIME_FORMAT);

			return match ? match[1] : '';
		},
		emitUpdate(value: string): void
		{
			this.$emit('update:modelValue', value);
		},
		onTimeChange(event: Event): void
		{
			const raw = event?.target?.value ?? '';
			const match = raw.match(REGEX_PATTERNS.TIME_FORMAT);
			const time = match ? match[1] : raw;
			this.timeValue = time;

			this.emitUpdate(this.prepareEventData(time, this.timezone));
		},
		onTimezoneChange(event: Event): void
		{
			const timezone = event?.target?.value ?? 0;
			this.timezone = timezone;
			this.applyValueFromModule();
			this.emitUpdate(this.prepareEventData(this.timeValue, timezone));
		},
		onSelect(): void
		{
			const input = this.$refs.timeInput;

			const selectedDate = this.timePicker.getSelectedDate() || this.timePicker.getFocusDate();
			if (!selectedDate)
			{
				return;
			}

			const timeString = this.timePicker.formatTime(selectedDate);
			if (timeString === this.timeValue)
			{
				return;
			}

			const timezoneOffsetRegex = /\s\[[\d-]+]$/;
			const rawValue = timeString;

			const normalizedValue = Type.isString(rawValue)
				? rawValue.replace(timezoneOffsetRegex, '')
				: rawValue;

			this.timeValue = timeString;
			this.emitUpdate(this.prepareEventData(normalizedValue, this.timezone));
			input.value = timeString;
		},
		openTimePicker(): void
		{
			if (this.disabled)
			{
				return;
			}

			const input = this.$refs.timeInput;
			if (!input)
			{
				return;
			}

			if (!this.timePicker)
			{
				this.timePicker = new DatePicker({
					targetNode: input,
					inputField: input,
					type: 'time',
					timePickerStyle: 'wheel',
					amPmMode: false,
					minuteStep: 5,
					popupOptions: {
						targetContainer: input.ownerDocument?.body || document.body,
					},
				});
			}
			const timeView = this.timePicker.getPicker('time');
			if (timeView?.subscribe && !boundTimePickers.has(this.timePicker))
			{
				// default DatePicker events do not work in the slider
				timeView.subscribe('onSelect', () => {
					setTimeout(this.onSelect, 0);
				});

				boundTimePickers.add(this.timePicker);
			}

			this.timePicker.show();
		},
		prepareEventData(time: number, timezone: string): string
		{
			let offset = timezone;
			if (!Type.isNumber(timezone))
			{
				offset = this.timezones.find((zone) => zone.value === timezone)?.offset ?? '0';
			}

			return `${time} [${offset}]`;
		},
	},
	template: `
		<div class="bizproc-setup-template__time-row">
		  <div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
		    <input
		        ref="timeInput"
		        :value="timeValue"
		        type="text"
		        class="ui-ctl-element"
		        :disabled="disabled"
		        placeholder="HH:MM"
		        readonly
		        @change="onTimeChange"
		        @click="openTimePicker"
		        style="cursor: pointer;"
		        data-test-id="bizproc-setup-template__form-time-value"
		    >
		  </div>
		  <div v-if="timezones.length > 0" class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
		    <div class="ui-ctl-after ui-ctl-icon-angle"></div>
		    <select
		        class="ui-ctl-element"
		        :value="timezone"
		        :disabled="disabled"
		        @change="onTimezoneChange"
		        data-test-id="bizproc-setup-template__form-time-timezone"
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
