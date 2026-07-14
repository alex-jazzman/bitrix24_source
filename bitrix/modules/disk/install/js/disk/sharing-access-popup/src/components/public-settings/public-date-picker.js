import { Loc } from 'main.core';
import { markRaw } from 'ui.vue3';
import { DatePicker } from 'ui.date-picker';
import { BInput, InputSize, InputDesign } from 'ui.system.input.vue';
import { BMenu } from 'ui.system.menu.vue';
import { TextSm } from 'ui.system.typography.vue';

import { formatAccessUntilForInput } from '../../utils/access-date';

const DATE_PICKER_EVENT_SELECT_CHANGE = 'onSelectChange';
const DATE_PICKER_EVENT_BEFORE_SELECT = 'onBeforeSelect';
const DATE_PICKER_EVENT_BEFORE_DAY_SELECT = 'onBeforeDaySelect';

function createPickerDate(
	year,
	monthIndex = 0,
	day = 1,
	hours = 0,
	minutes = 0,
	seconds = 0,
	ms = 0,
)
{
	const date = new Date(Date.UTC(year, monthIndex, day, hours, minutes, seconds, ms));

	if (year < 100 && year >= 0)
	{
		date.setUTCFullYear(year);
	}

	date.__utc = true;

	return date;
}

function createPickerDateFromTimestamp(value)
{
	const date = new Date(value);
	if (Number.isNaN(date.getTime()))
	{
		return null;
	}

	return createPickerDate(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		date.getHours(),
		date.getMinutes(),
		date.getSeconds(),
		date.getMilliseconds(),
	);
}

// @vue/component
export const PublicAccessDateRange = {
	name: 'PublicAccessDateRange',
	components: { TextSm, BMenu, BInput },
	props: {
		modelValue: { type: [Number, Boolean], default: false },
	},
	emits: ['update:modelValue'],
	data()
	{
		return {
			isMenuShown: false,
			datePicker: null,
		};
	},
	watch: {
		modelValue()
		{
			this.syncDatePickerValue();
		},
	},
	computed: {
		InputSize: () => InputSize,
		InputDesign: () => InputDesign,
		foreverTitle()
		{
			return Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_DATE_PICKER_FOREVER_OPTION');
		},
		hasSelectedDate()
		{
			return this.isTimestampValue(this.modelValue);
		},
		displayValue()
		{
			if (!this.hasSelectedDate)
			{
				return this.foreverTitle;
			}

			const label = formatAccessUntilForInput(this.modelValue);

			return label || '';
		},
	},
	mounted()
	{
		this.initDatePicker();
	},
	beforeUnmount()
	{
		this.destroyDatePicker();
	},
	methods: {
		isTimestampValue(value)
		{
			return Number.isFinite(value) && value > 0;
		},
		getDateFromModelValue()
		{
			if (!this.hasSelectedDate)
			{
				return null;
			}

			return createPickerDateFromTimestamp(this.modelValue * 1000);
		},
		getInputElement()
		{
			return this.$refs.dateInputWrap?.querySelector('input');
		},
		getTodayStart()
		{
			const today = new Date();

			return createPickerDate(
				today.getFullYear(),
				today.getMonth(),
				today.getDate(),
			);
		},
		formatTime(hours, minutes = 0)
		{
			return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
		},
		getRoundedDefaultTime()
		{
			const nextHour = new Date();

			nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

			return this.formatTime(nextHour.getHours(), nextHour.getMinutes());
		},
		getNextAvailableTodayTimestamp()
		{
			const now = new Date();
			const nextHour = new Date(now);

			nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

			const isSameDay = (
				nextHour.getFullYear() === now.getFullYear()
				&& nextHour.getMonth() === now.getMonth()
				&& nextHour.getDate() === now.getDate()
			);

			return isSameDay ? Math.floor(nextHour.getTime() / 1000) : false;
		},
		getDateWithTime(date, timeSource)
		{
			if (!(date instanceof Date) || !(timeSource instanceof Date))
			{
				return null;
			}

			return createPickerDate(
				date.getUTCFullYear(),
				date.getUTCMonth(),
				date.getUTCDate(),
				timeSource.getUTCHours(),
				timeSource.getUTCMinutes(),
				timeSource.getUTCSeconds(),
			);
		},
		getTimestampFromSelectedDate(date)
		{
			if (!(date instanceof Date))
			{
				return false;
			}

			const localDate = new Date(
				date.getUTCFullYear(),
				date.getUTCMonth(),
				date.getUTCDate(),
				date.getUTCHours(),
				date.getUTCMinutes(),
				date.getUTCSeconds(),
			);

			const timestamp = Math.floor(localDate.getTime() / 1000);

			return timestamp > 0 ? timestamp : false;
		},
		isSamePickerDay(firstDate, secondDate)
		{
			return (
				firstDate.getUTCFullYear() === secondDate.getUTCFullYear()
				&& firstDate.getUTCMonth() === secondDate.getUTCMonth()
				&& firstDate.getUTCDate() === secondDate.getUTCDate()
			);
		},
		isTodayPickerDate(date)
		{
			const today = new Date();

			return (
				date.getUTCFullYear() === today.getFullYear()
				&& date.getUTCMonth() === today.getMonth()
				&& date.getUTCDate() === today.getDate()
			);
		},
		initDatePicker()
		{
			const input = this.getInputElement();
			if (this.datePicker || !input)
			{
				return;
			}

			const todayStart = this.getTodayStart();

			this.datePicker = markRaw(new DatePicker({
				targetNode: input,
				selectionMode: 'single',
				defaultTime: this.getRoundedDefaultTime(),
				enableTime: true,
				autoHide: true,
				minDate: todayStart,
				dayColors: [
					{
						matcher: (date) => {
							const compareDate = createPickerDate(
								date.getUTCFullYear(),
								date.getUTCMonth(),
								date.getUTCDate(),
							);

							return compareDate < todayStart;
						},
						textColor: '#A6ABB8',
						bgColor: 'transparent',
					},
				],
				popupOptions: {
					bindOptions: {
						position: 'top',
						forceBindPosition: true,
						forceTop: true,
					},
					offsetTop: 5,
				},
				events: {
					[DATE_PICKER_EVENT_SELECT_CHANGE]: (event) => this.handleDateChange(event),
					[DATE_PICKER_EVENT_BEFORE_DAY_SELECT]: (event) => this.handleBeforeDaySelect(event),
					[DATE_PICKER_EVENT_BEFORE_SELECT]: (event) => this.handleBeforeSelect(event),
				},
			}));

			this.syncDatePickerValue();
		},
		destroyDatePicker()
		{
			if (!this.datePicker)
			{
				return;
			}

			this.datePicker.destroy();
			this.datePicker = null;
		},
		getMenuOptions()
		{
			const foreverTitle = Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_DATE_PICKER_FOREVER_OPTION');
			const selectTitle = Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_DATE_PICKER_SELECT_OPEN');
			const isDateSelected = this.hasSelectedDate;
			const isForeverSelected = !isDateSelected;
			const bindElement = this.$refs.dateInputWrap ?? this.getInputElement();

			return {
				bindElement,
				closeOnItemClick: false,
				targetContainer: document.body,
				items: [
					{
						title: foreverTitle,
						isSelected: isForeverSelected,
						onClick: () => {
							this.selectForever();
							this.isMenuShown = false;
						},
					},
					{
						title: selectTitle,
						isSelected: isDateSelected,
						onClick: () => {
							this.isMenuShown = false;
							this.openDatePicker();
						},
					},
				],
			};
		},
		openMenu()
		{
			if (!this.getInputElement())
			{
				return;
			}

			if (this.datePicker?.isOpen())
			{
				this.datePicker.hide();
			}

			this.isMenuShown = true;
		},
		selectForever()
		{
			if (this.datePicker)
			{
				this.datePicker.deselectAll({ updateInputs: false, emitEvents: false, render: true });
			}

			this.$emit('update:modelValue', false);
		},
		syncDatePickerValue()
		{
			if (!this.datePicker)
			{
				return;
			}

			const selectedDate = this.getDateFromModelValue();
			const currentDate = this.datePicker.getSelectedDate();

			if (!selectedDate)
			{
				if (currentDate)
				{
					this.datePicker.deselectAll({ updateInputs: false, emitEvents: false, render: true });
				}

				return;
			}

			if (currentDate && currentDate.getTime() === selectedDate.getTime())
			{
				return;
			}

			this.datePicker.selectDate(selectedDate, { updateInputs: false, emitEvents: false, render: true });
		},
		openDatePicker()
		{
			if (!this.datePicker)
			{
				this.initDatePicker();
			}

			if (!this.datePicker)
			{
				return;
			}

			this.syncDatePickerValue();
			this.datePicker.setDefaultTime(this.getRoundedDefaultTime());

			this.$nextTick(() => {
				if (this.datePicker)
				{
					this.datePicker.show();
				}
			});
		},
		handleDateChange(event)
		{
			const date = event.getTarget().getSelectedDate();
			const value = this.getTimestampFromSelectedDate(date);
			if (value === false)
			{
				return;
			}

			this.$emit('update:modelValue', value);
		},
		handleBeforeDaySelect(event)
		{
			if (!this.datePicker)
			{
				return;
			}

			const { date } = event.getData();
			const currentDate = this.datePicker.getSelectedDate();
			if (!(date instanceof Date) || !(currentDate instanceof Date))
			{
				return;
			}

			if (this.isSamePickerDay(currentDate, date) || !this.isTodayPickerDate(date))
			{
				return;
			}

			const dateWithCurrentTime = this.getDateWithTime(date, currentDate);
			const selectedTimestamp = this.getTimestampFromSelectedDate(dateWithCurrentTime);
			if (selectedTimestamp === false || selectedTimestamp > Math.floor(Date.now() / 1000))
			{
				return;
			}

			const nextAvailableTodayTimestamp = this.getNextAvailableTodayTimestamp();
			if (nextAvailableTodayTimestamp === false)
			{
				event.preventDefault();

				return;
			}

			const nextAvailableToday = new Date(nextAvailableTodayTimestamp * 1000);
			this.datePicker.setDefaultTime(
				this.formatTime(nextAvailableToday.getHours(), nextAvailableToday.getMinutes()),
			);
			this.datePicker.deselectAll({ updateInputs: false, emitEvents: false, render: false });
		},
		handleBeforeSelect(event)
		{
			const { date } = event.getData();
			if (!(date instanceof Date))
			{
				return;
			}

			const selectedTimestamp = this.getTimestampFromSelectedDate(date);
			if (selectedTimestamp !== false && selectedTimestamp <= Math.floor(Date.now() / 1000))
			{
				event.preventDefault();
			}
		},
	},
	template: `
		<div class="access-public-block__date-picker-wrapper">
			<TextSm
				tag="label"
				className="access-public-block__date-picker-label"
				for="access-public-block__date-picker"
			>
				${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_DATE_PICKER_LABEL')}
			</TextSm>
			<div class="access-public-block__input-date-picker" ref="dateInputWrap">
				<BInput
					:modelValue="displayValue"
					readonly
					clickable
					dropdown
					:stretched="true"
					:size="InputSize.Md"
					:design="InputDesign.Primary"
					:active="isMenuShown"
					placeholder="${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_DATE_PICKER_PLACEHOLDER')}"
					@click="openMenu"
				/>
			</div>
			<BMenu
				v-if="isMenuShown"
				:options="getMenuOptions()"
				@close="isMenuShown = false"
			/>
		</div>
	`,
};
