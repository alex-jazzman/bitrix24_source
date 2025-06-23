import { DateTimeFormat } from 'main.date';
import { DatePicker, DatePickerEvent, getNextDate, createDate } from 'ui.date-picker';
import { createNamespacedHelpers, mapGetters } from 'ui.vue3.vuex';
import { BIcon as Icon, Set as IconSet } from 'ui.icon-set.api.vue';
import 'ui.icon-set.main';
import 'ui.icon-set.actions';

import { DateFormat, Model, Option } from 'booking.const';
import { optionService } from 'booking.provider.service.option-service';

import './calendar.css';

const { mapGetters: mapInterfaceGetters } = createNamespacedHelpers(Model.Interface);

export const Calendar = {
	data(): Object
	{
		return {
			IconSet,
		};
	},
	created(): void
	{
		this.datePicker = new DatePicker({
			selectedDates: [this.selectedDateTs],
			inline: true,
			hideHeader: true,
		});

		this.setViewDate();

		this.datePicker.subscribe(DatePickerEvent.SELECT, (event) => {
			const date = event.getData().date;
			const selectedDate = this.createDateFromUtc(date);
			void this.$store.dispatch(`${Model.Interface}/setSelectedDateTs`, selectedDate.getTime());
			this.setViewDate();
		});
	},
	mounted(): void
	{
		this.datePicker.setTargetNode(this.$refs.datePicker);
		this.datePicker.show();
	},
	beforeUnmount(): void
	{
		this.datePicker.destroy();
	},
	computed: {
		...mapGetters({
			calendarExpanded: `${Model.Interface}/calendarExpanded`,
		}),
		...mapInterfaceGetters({
			filteredMarks: 'filteredMarks',
			freeMarks: 'freeMarks',
			isFilterMode: 'isFilterMode',
			getCounterMarks: 'getCounterMarks',
			offset: 'offset',
		}),
		selectedDateTs(): number
		{
			return this.$store.getters[`${Model.Interface}/selectedDateTs`] + this.offset;
		},
		viewDateTs(): number
		{
			return this.$store.getters[`${Model.Interface}/viewDateTs`] + this.offset;
		},
		counterMarks(): string[]
		{
			if (this.isFilterMode)
			{
				return this.getCounterMarks(this.filteredMarks);
			}

			return this.getCounterMarks();
		},
		formattedDate(): string
		{
			const format = this.calendarExpanded
				? this.loc('BOOKING_MONTH_YEAR_FORMAT')
				: DateTimeFormat.getFormat('LONG_DATE_FORMAT')
			;

			const timestamp = this.calendarExpanded
				? this.viewDateTs / 1000
				: this.selectedDateTs / 1000
			;

			return DateTimeFormat.format(format, timestamp);
		},
	},
	methods: {
		onPreviousClick(): void
		{
			if (this.calendarExpanded)
			{
				this.previousMonth();
			}
			else
			{
				this.previousDate();
			}
		},
		onNextClick(): void
		{
			if (this.calendarExpanded)
			{
				this.nextMonth();
			}
			else
			{
				this.nextDate();
			}
		},
		previousDate(): void
		{
			const selectedDate = this.datePicker.getSelectedDate() || this.datePicker.getToday();
			this.datePicker.selectDate(getNextDate(selectedDate, 'day', -1));
			this.setViewDate();
		},
		nextDate(): void
		{
			const selectedDate = this.datePicker.getSelectedDate() || this.datePicker.getToday();
			this.datePicker.selectDate(getNextDate(selectedDate, 'day'));
			this.setViewDate();
		},
		previousMonth(): void
		{
			const viewDate = this.datePicker.getViewDate();
			this.datePicker.setViewDate(getNextDate(viewDate, 'month', -1));
			this.setViewDate();
		},
		nextMonth(): void
		{
			const viewDate = this.datePicker.getViewDate();
			this.datePicker.setViewDate(getNextDate(viewDate, 'month'));
			this.setViewDate();
		},
		setViewDate(): void
		{
			const viewDate = this.createDateFromUtc(this.datePicker.getViewDate());
			const viewDateTs = viewDate.setDate(1);

			void this.$store.dispatch(`${Model.Interface}/setViewDateTs`, viewDateTs);
		},
		createDateFromUtc(date: Date): Date
		{
			return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
		},
		updateMarks(): void
		{
			if (this.isFilterMode)
			{
				this.setFilterMarks();
			}
			else
			{
				this.setFreeMarks();
			}

			this.setCounterMarks();
		},
		setFreeMarks(): void
		{
			const bgColorFree = 'rgba(var(--ui-color-background-success-rgb), 0.7)';
			const dates = this.prepareDates(this.freeMarks);

			this.datePicker.setDayColors([
				{
					matcher: dates,
					bgColor: bgColorFree,
				},
			]);
		},
		setFilterMarks(): void
		{
			const bgColorFilter = 'rgba(var(--ui-color-primary-rgb), 0.20)';
			const dates = this.prepareDates(this.filteredMarks);

			this.datePicker.setDayColors([
				{
					matcher: dates,
					bgColor: bgColorFilter,
				},
			]);
		},
		setCounterMarks(): void
		{
			const dates = this.prepareDates(this.counterMarks);

			this.datePicker.setDayMarks([
				{
					matcher: dates,
					bgColor: 'red',
				},
			]);
		},
		prepareDates(dates: string[]): string[]
		{
			return dates.map((markDate: string): string => {
				const date = DateTimeFormat.parse(markDate, false, DateFormat.ServerParse);

				return this.prepareTimestamp(date.getTime());
			});
		},
		prepareTimestamp(timestamp: number): string
		{
			const dateFormat = DateTimeFormat.getFormat('FORMAT_DATE');

			return DateTimeFormat.format(dateFormat, timestamp / 1000);
		},
		async collapseToggle(): Promise<void>
		{
			await Promise.all([
				this.$store.dispatch(`${Model.Interface}/setCalendarExpanded`, !this.calendarExpanded),
				optionService.setBool(Option.CalendarExpanded, this.calendarExpanded),
			]);
		},
	},
	watch: {
		selectedDateTs(selectedDateTs: number): void
		{
			this.datePicker.selectDate(createDate(selectedDateTs));
			this.updateMarks();
		},
		filteredMarks(): void
		{
			this.updateMarks();
		},
		freeMarks(): void
		{
			this.updateMarks();
		},
		counterMarks(): void
		{
			this.setCounterMarks();
		},
		isFilterMode(): void
		{
			this.updateMarks();
		},
	},
	components: {
		Icon,
	},
	template: `
		<div class="booking-sidebar-calendar-container" :class="{'--expanded': calendarExpanded}">
			<div class="booking-booking-sidebar-calendar">
				<div class="booking-booking-sidebar-calendar-header">
					<div class="booking-sidebar-button" @click="onPreviousClick">
						<div class="ui-icon-set --chevron-left"></div>
					</div>
					<div class="booking-booking-sidebar-calendar-title">
						{{ formattedDate }}
					</div>
					<div class="booking-sidebar-button --right" @click="onNextClick">
						<div class="ui-icon-set --chevron-right"></div>
					</div>
					<div class="booking-sidebar-button" @click="collapseToggle">
						<Icon :name="calendarExpanded ? IconSet.COLLAPSE : IconSet.EXPAND_1"/>
					</div>
				</div>
				<div class="booking-booking-sidebar-calendar-date-picker" ref="datePicker"></div>
			</div>
		</div>
	`,
};
