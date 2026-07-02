import { EventEmitter } from 'main.core.events';
import { DateTimeFormat } from 'main.date';
import { DatePicker, DatePickerEvent, getNextDate, createDate, floorDate, addDate } from 'ui.date-picker';
import { mapGetters } from 'ui.vue3.vuex';
import { BIcon as Icon, Set as IconSet } from 'ui.icon-set.api.vue';
import 'ui.icon-set.main';
import 'ui.icon-set.actions';

import { EventName, DateFormat, Model, Option, Grid, NavigationUnit, NavigationDirection } from 'booking.const';
import { optionService } from 'booking.provider.service.option-service';
import { CounterFloating } from 'booking.component.counter-floating';

import './calendar.css';

const MarkColors = {
	FREE: 'rgba(var(--ui-color-background-success-rgb), 0.7)',
	FILTER: 'rgba(var(--ui-color-primary-rgb), 0.20)',
	COUNTER: 'red',
};

// @vue/component
export const Calendar = {
	name: 'BookingSidebarCalendar',
	components: {
		Icon,
		CounterFloating,
	},
	props: {
		calendarClass: {
			type: [String, Object, Array],
			default: '',
		},
	},
	setup(): Object
	{
		return {
			IconSet,
			NavigationDirection,
		};
	},
	computed: {
		...mapGetters({
			calendarExpanded: `${Model.Interface}/calendarExpanded`,
			freeMarks: `${Model.Interface}/freeMarks`,
			getCounterMarks: `${Model.Interface}/getCounterMarks`,
			offset: `${Model.Interface}/offset`,
			firstWeekDay: `${Model.Interface}/firstWeekDay`,
			isWeekMode: `${Model.Interface}/isWeekMode`,
			datesCount: `${Model.Filter}/datesCount`,
			filteredMarks: `${Model.Filter}/filteredMarks`,
			isFilterMode: `${Model.Filter}/isFilterMode`,
			isDeletingResourceFilterMode: `${Model.Filter}/isDeletingResourceFilterMode`,
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
			if (this.isFilterMode || this.isDeletingResourceFilterMode)
			{
				return this.getCounterMarks(this.filteredMarks);
			}

			return this.getCounterMarks();
		},
		formattedDate(): string
		{
			const shouldUseMonthYearFormat = this.isWeekMode || this.calendarExpanded;

			const format = shouldUseMonthYearFormat
				? this.loc('BOOKING_MONTH_YEAR_FORMAT')
				: DateTimeFormat.getFormat('LONG_DATE_FORMAT');

			const timestampMs = shouldUseMonthYearFormat
				? this.viewDateTs
				: this.selectedDateTs;

			const timestampSeconds = timestampMs / 1000;

			return DateTimeFormat.format(format, timestampSeconds);
		},
		isShowCounterFloating(): boolean
		{
			return (this.isDeletingResourceFilterMode || this.isFilterMode) && (this.datesCount.count > 0);
		},
	},
	watch: {
		selectedDateTs(selectedDateTs: number): void
		{
			this.updateDateSelection(createDate(selectedDateTs));

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
	created(): void
	{
		this.datePicker = new DatePicker({
			inline: true,
			hideHeader: true,
			firstWeekDay: this.firstWeekDay,
			selectedDates: this.isWeekMode ? null : [this.selectedDateTs],
			selectionMode: this.isWeekMode ? 'range' : null,
		});

		this.datePicker.setViewDate(createDate(this.selectedDateTs));

		this.setViewDate();
		this.syncWeekRangeSelection();

		this.datePicker.subscribe(DatePickerEvent.BEFORE_DAY_SELECT, (event) => {
			const date = event.getData().date;
			const selectedDate = this.createDateFromUtc(date);
			void this.$store.dispatch(`${Model.Interface}/setSelectedDateTs`, selectedDate.getTime());

			this.setViewDate();
			this.syncWeekRangeSelection();

			event.preventDefault();
		});

		if (this.isWeekMode)
		{
			EventEmitter.subscribe(EventName.MultiBookingShowPreviousPeriod, this.previousWeek);
			EventEmitter.subscribe(EventName.MultiBookingShowNextPeriod, this.nextWeek);
		}
	},
	mounted(): void
	{
		this.datePicker.setTargetNode(this.$refs.datePicker);
		this.datePicker.show();
		this.updateMarks();
	},
	beforeUnmount(): void
	{
		EventEmitter.unsubscribe(EventName.MultiBookingShowPreviousPeriod, this.previousWeek);
		EventEmitter.unsubscribe(EventName.MultiBookingShowNextPeriod, this.nextWeek);

		this.datePicker.destroy();
	},
	methods: {
		previousWeek(): void
		{
			this.navigateByWeek(NavigationDirection.previous);
		},
		nextWeek(): void
		{
			this.navigateByWeek(NavigationDirection.next);
		},
		navigate(direction: number): void
		{
			const unit = this.getNavigationUnit();

			const navigationHandlers = {
				[NavigationUnit.day]: () => this.navigateByDay(direction),
				[NavigationUnit.week]: () => this.navigateByWeek(direction),
				[NavigationUnit.month]: () => this.navigateByMonth(direction),
			};

			navigationHandlers[unit]();
		},
		getNavigationUnit(): string
		{
			if (this.calendarExpanded)
			{
				return NavigationUnit.month;
			}

			return this.isWeekMode ? NavigationUnit.week : NavigationUnit.day;
		},
		navigateByDay(direction: $Values<typeof NavigationDirection>): void
		{
			const date = this.datePicker.getSelectedDate() || this.datePicker.getToday();
			const nextDate = getNextDate(date, NavigationUnit.day, direction);
			const selectedDate = this.createDateFromUtc(nextDate);

			void this.$store.dispatch(`${Model.Interface}/setSelectedDateTs`, selectedDate.getTime());

			this.updateDateSelection(nextDate);
			this.setViewDate();
		},
		navigateByWeek(direction: number): void
		{
			const daysOffset = direction * Grid.Duration.Week;
			const newDate = getNextDate(createDate(this.selectedDateTs), NavigationUnit.day, daysOffset);
			const selectedDate = this.createDateFromUtc(newDate);

			void this.$store.dispatch(`${Model.Interface}/setSelectedDateTs`, selectedDate.getTime());

			this.datePicker.setViewDate(newDate);
			this.setViewDate();
			this.syncWeekRangeSelection();
		},
		navigateByMonth(direction: number): void
		{
			const viewDate = this.datePicker.getViewDate();

			this.datePicker.setViewDate(getNextDate(viewDate, NavigationUnit.month, direction));
			this.setViewDate();
		},
		updateDateSelection(nextDate: Date): void
		{
			if (this.isWeekMode)
			{
				this.syncWeekRangeSelection();
			}
			else
			{
				this.datePicker.selectDate(nextDate);
			}
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
			if (this.isFilterMode || this.isDeletingResourceFilterMode)
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
			const dates = this.prepareDates(this.freeMarks);

			this.datePicker.setDayColors([
				{
					matcher: dates,
					bgColor: MarkColors.FREE,
				},
			]);
		},
		getFilterMarks(): string[]
		{
			if (!this.isDeletingResourceFilterMode)
			{
				return this.filteredMarks;
			}

			const today = new Date();
			const todayTs = today.setHours(0, 0, 0, 0);

			return this.filteredMarks.filter((freeMarkTs) => new Date(freeMarkTs).getTime() >= todayTs);
		},
		setFilterMarks(): void
		{
			const dates = this.prepareDates(this.getFilterMarks());

			this.datePicker.setDayColors([
				{
					matcher: dates,
					bgColor: MarkColors.FILTER,
				},
			]);
		},
		setCounterMarks(): void
		{
			const dates = this.prepareDates(this.counterMarks);

			this.datePicker.setDayMarks([
				{
					matcher: dates,
					bgColor: MarkColors.COUNTER,
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
		syncWeekRangeSelection(): void
		{
			if (!this.isWeekMode)
			{
				void this.$store.dispatch(`${Model.Interface}/setSelectedFirstDayPeriodTs`, null);

				return;
			}

			const firstWeekDateUtc = floorDate(createDate(this.selectedDateTs), 'week', this.firstWeekDay);
			const lastWeekDayUtc = addDate(firstWeekDateUtc, 'day', 6);
			const firstWeekDateLocal = new Date(
				firstWeekDateUtc.getUTCFullYear(),
				firstWeekDateUtc.getUTCMonth(),
				firstWeekDateUtc.getUTCDate(),
			);

			void this.$store.dispatch(
				`${Model.Interface}/setSelectedFirstDayPeriodTs`,
				firstWeekDateLocal.getTime(),
			);

			this.datePicker.selectRange(firstWeekDateUtc.getTime(), lastWeekDayUtc.getTime(), { emitEvents: false });
		},
	},
	template: `
		<div
			class="booking-sidebar-calendar-container"
			:class="[calendarClass, {
				'--expanded': calendarExpanded,
				'--counter': isShowCounterFloating,
			}].flat(1)"
		>
			<div class="booking-booking-sidebar-calendar">
				<div class="booking-booking-sidebar-calendar-header">
					<div class="booking-sidebar-button" @click="navigate(NavigationDirection.previous)">
						<div class="ui-icon-set --chevron-left"></div>
					</div>
					<div class="booking-booking-sidebar-calendar-title">
						{{ formattedDate }}
					</div>
					<div class="booking-sidebar-button --right" @click="navigate(NavigationDirection.next)">
						<div class="ui-icon-set --chevron-right"></div>
					</div>
					<div class="booking-sidebar-button" @click="collapseToggle">
						<Icon :name="calendarExpanded ? IconSet.COLLAPSE : IconSet.EXPAND_1"/>
					</div>
				</div>
				<div class="booking-booking-sidebar-calendar-date-picker" ref="datePicker"></div>
			</div>
			<CounterFloating
				v-if="isShowCounterFloating"
				:count="datesCount.count"
			/>
		</div>
	`,
};
