import { mapGetters } from 'ui.vue3.vuex';
import { DatePicker, DatePickerEvent } from 'ui.date-picker';
import { DateTimeFormat } from 'main.date';

import { Model, DateFormat } from 'booking.const';
import { RequestRevisionGuard } from 'booking.lib.request-revision-guard';
import { bookingService } from 'booking.provider.service.booking-service';
import { calendarService } from 'booking.provider.service.calendar-service';
import { Popup } from 'booking.component.popup';
import { Button as UiButton, ButtonColor, ButtonIcon } from 'booking.component.button';
import type { BookingModel } from 'booking.model.bookings';

import './change-date-popup.css';

const FreeDayColor = 'rgba(var(--ui-color-background-success-rgb), 0.7)';

// @vue/component
export const ChangeDatePopup = {
	name: 'ChangeDatePopup',
	components: {
		Popup,
		UiButton,
	},
	props: {
		bookingId: {
			type: [Number, String],
			required: true,
		},
		resourceId: {
			type: Number,
			required: true,
		},
		targetNode: {
			type: HTMLElement,
			required: true,
		},
	},
	emits: ['close'],
	setup(): { ButtonColor: typeof ButtonColor, ButtonIcon: typeof ButtonIcon }
	{
		return {
			ButtonColor,
			ButtonIcon,
		};
	},
	data(): Object
	{
		return {
			selectedFromTs: 0,
			selectedToTs: 0,
			isAvailable: true,
		};
	},
	computed: {
		...mapGetters({
			offset: `${Model.Interface}/offset`,
		}),
		booking(): BookingModel
		{
			return this.$store.getters['bookings/getById'](this.bookingId);
		},
		isCheckingAvailability(): boolean
		{
			return this.isAvailable === null;
		},
		isDateUnavailable(): boolean
		{
			return this.isAvailable === false;
		},
		canSave(): boolean
		{
			return this.isAvailable === true;
		},
		hasChanges(): boolean
		{
			return this.booking.dateFromTs !== this.selectedFromTs
				|| this.booking.dateToTs !== this.selectedToTs;
		},
		popupId(): string
		{
			return `booking-date-popup-${this.bookingId}-${this.resourceId}`;
		},
		popupConfig(): Object
		{
			return {
				className: 'booking-booking-date-popup-wrapper',
				bindElement: this.targetNode,
				width: 272,
				fixed: true,
				bindOptions: {
					forceBindPosition: true,
				},
			};
		},
	},
	created(): void
	{
		this.datePicker = null;
		this.resizeObserver = null;
		this.loadFreeDayRevisionGuard = new RequestRevisionGuard();
		this.checkAvailabilityRevisionGuard = new RequestRevisionGuard();

		this.selectedFromTs = this.booking.dateFromTs;
		this.selectedToTs = this.booking.dateToTs;
	},
	mounted(): void
	{
		void this.initDatePicker();
		this.observePopupResize();
	},
	beforeUnmount(): void
	{
		this.destroyDatePicker();
		this.unobservePopupResize();
	},
	methods: {
		async initDatePicker(): Promise<void>
		{
			this.datePicker = new DatePicker({
				inline: true,
				selectionMode: 'range',
				enableTime: true,
				allowSeconds: false,
				selectedDates: [
					new Date(this.booking.dateFromTs + this.offset),
					new Date(this.booking.dateToTs + this.offset),
				],
				timePickerStyle: 'wheel',
			});

			this.datePicker.subscribe(DatePickerEvent.SELECT_CHANGE, this.onDateSelected);

			const originalSetViewDate = this.datePicker.setViewDate.bind(this.datePicker);
			this.datePicker.setViewDate = (...args) => {
				originalSetViewDate(...args);
				void this.loadFreeDayColors();
			};

			this.datePicker.setTargetNode(this.$refs.datePickerContainer);
			this.datePicker.show();

			this.$nextTick(() => {
				this.$refs.popup?.adjustPosition();
			});

			await this.loadFreeDayColors();
		},
		destroyDatePicker(): void
		{
			if (this.datePicker)
			{
				this.datePicker.destroy();
				this.datePicker = null;
			}
		},
		observePopupResize(): void
		{
			const container = this.$refs.datePickerContainer;

			this.resizeObserver = new ResizeObserver(() => {
				this.$refs.popup?.adjustPosition();
			});
			this.resizeObserver.observe(container);
		},
		unobservePopupResize(): void
		{
			if (this.resizeObserver)
			{
				this.resizeObserver.disconnect();
				this.resizeObserver = null;
			}
		},
		onDateSelected(): void
		{
			if (!this.datePicker)
			{
				return;
			}

			const rangeStart = this.datePicker.getRangeStart();
			const rangeEnd = this.datePicker.getRangeEnd();

			if (!rangeStart || !rangeEnd)
			{
				return;
			}

			this.selectedFromTs = this.pickerDateToTimestamp(rangeStart);
			this.selectedToTs = this.pickerDateToTimestamp(rangeEnd);

			this.isAvailable = null;
			void this.checkAvailability();
		},
		pickerDateToTimestamp(date: Date): number
		{
			const localDate = new Date(
				date.getUTCFullYear(),
				date.getUTCMonth(),
				date.getUTCDate(),
				date.getUTCHours(),
				date.getUTCMinutes(),
				date.getUTCSeconds(),
			);

			return localDate.getTime() - this.offset;
		},
		saveAndClose(): void
		{
			if (this.hasChanges && this.canSave)
			{
				void bookingService.update({
					id: this.booking.id,
					dateFromTs: this.selectedFromTs,
					dateToTs: this.selectedToTs,
					timezoneFrom: this.booking.timezoneFrom,
					timezoneTo: this.booking.timezoneTo,
				});
			}

			this.$emit('close');
		},
		close(): void
		{
			this.$emit('close');
		},
		async checkAvailability(): Promise<void>
		{
			if (!this.selectedFromTs || !this.selectedToTs)
			{
				this.isAvailable = false;

				return;
			}

			const revision = this.checkAvailabilityRevisionGuard.next(this.booking.id);

			const canChange = await bookingService.canChangeDate(
				this.booking.id,
				this.selectedFromTs,
				this.selectedToTs,
			);

			if (!this.checkAvailabilityRevisionGuard.isActual(this.booking.id, revision))
			{
				return;
			}

			this.isAvailable = canChange;
		},
		async loadFreeDayColors(): Promise<void>
		{
			if (!this.datePicker)
			{
				return;
			}

			const revision = this.loadFreeDayRevisionGuard.next(this.resourceId);

			const viewDate = this.datePicker.getViewDate();
			const dateTs = new Date(viewDate.getUTCFullYear(), viewDate.getUTCMonth(), 1).getTime();

			const freeDates = await calendarService.getFreeDatesForResource(
				this.resourceId,
				dateTs,
			);

			if (!this.loadFreeDayRevisionGuard.isActual(this.resourceId, revision) || !this.datePicker)
			{
				return;
			}

			const dateFormat = DateTimeFormat.getFormat('FORMAT_DATE');
			const formattedDates = freeDates
				.map((freeDate: string): string => {
					const date = DateTimeFormat.parse(freeDate, false, DateFormat.ServerParse);

					return DateTimeFormat.format(dateFormat, date.getTime() / 1000);
				});

			this.datePicker.setDayColors(formattedDates.length > 0
				? [{ matcher: formattedDates, bgColor: FreeDayColor }]
				: [],
			);
		},
	},
	template: `
		<Popup
			:id="popupId"
			:config="popupConfig"
			ref="popup"
			@close="close"
		>
			<div class="booking-booking-date-popup">
				<div ref="datePickerContainer"></div>
				<div v-if="isDateUnavailable" class="booking-booking-date-popup__error">
					{{ loc('BOOKING_BOOKING_TIME_IS_NOT_AVAILABLE') }}
				</div>
				<div class="booking-booking-date-popup__footer">
					<UiButton
						class="booking-booking-date-popup__button"
						:size="ButtonIcon.MEDIUM"
						:color="ButtonColor.PRIMARY"
						:disabled="!canSave"
						:waiting="isCheckingAvailability"
						@click="saveAndClose"
						:text="loc('BOOKING_BOOKING_BOOKING_DATE_SAVE')"
					/>
				</div>
			</div>
		</Popup>
	`,
};
