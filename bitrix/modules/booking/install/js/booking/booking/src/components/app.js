import { Loader } from 'main.loader';
import { mapGetters } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import { mainPageService } from 'booking.provider.service.main-page-service';
import { dictionaryService } from 'booking.provider.service.dictionary-service';
import { bookingService } from 'booking.provider.service.booking-service';
import { calendarService } from 'booking.provider.service.calendar-service';
import { resourceDialogService } from 'booking.provider.service.resource-dialog-service';
import { SectionAnalytics } from 'booking.lib.analytics';
import { mousePosition } from 'booking.lib.mouse-position';
import type { BookingModel } from 'booking.model.bookings';
import type { BookingUIFilter } from 'booking.lib.booking-filter';

import { expandOffHours } from '../lib/expand-off-hours/expand-off-hours';
import { Filter as BookingFilter, RequireAttention } from './filter/filter';
import { CountersPanel, CounterItem } from './counters-panel/counters-panel';
import { AfterTitle } from './after-title/after-title';
import { BaseComponent } from './base-component/base-component';
import { MultiBooking } from './multi-booking/multi-booking';
import { Banner } from './banner/banner';
import { Trial } from './trial/trial';
import { CrmFormsButton } from './crm-forms-button/crm-forms-button';

// @vue/component
export const App = {
	name: 'BookingApp',
	components: {
		BaseComponent,
		AfterTitle,
		BookingFilter,
		CountersPanel,
		MultiBooking,
		Banner,
		Trial,
		CrmFormsButton,
	},
	props: {
		afterTitleContainer: HTMLElement,
		counterPanelContainer: HTMLElement,
		settingsButtonContainer: HTMLElement,
		filterId: {
			type: String,
			required: true,
		},
	},
	data(): Object
	{
		return {
			loader: new Loader(),
		};
	},
	computed: {
		...mapGetters({
			selectedDateTs: `${Model.Interface}/selectedDateTs`,
			viewDateTs: `${Model.Interface}/viewDateTs`,
			isFilterMode: `${Model.Interface}/isFilterMode`,
			filteredBookingsIds: `${Model.Interface}/filteredBookingsIds`,
			selectedCells: `${Model.Interface}/selectedCells`,
			resourcesIds: `${Model.Favorites}/get`,
			extraResourcesIds: `${Model.Interface}/extraResourcesIds`,
			bookings: `${Model.Bookings}/get`,
			intersections: `${Model.Interface}/intersections`,
			editingBookingId: `${Model.Interface}/editingBookingId`,
		}),
		hasSelectedCells(): boolean
		{
			return Object.keys(this.selectedCells).length > 0;
		},
		editingBooking(): BookingModel | null
		{
			return this.$store.getters['bookings/getById'](this.editingBookingId) ?? null;
		},
	},
	watch: {
		selectedDateTs(): void
		{
			if (this.isFilterMode)
			{
				void this.applyFilter();
			}
			else
			{
				void this.fetchPage(this.selectedDateTs / 1000);
			}
		},
		filteredBookingsIds(): void
		{
			if (this.isFilterMode)
			{
				this.showResourcesWithBookings();
			}
		},
		isFilterMode(isFilterMode: boolean): void
		{
			if (!isFilterMode)
			{
				void this.fetchPage(this.selectedDateTs / 1000);
			}
		},
		viewDateTs(): void
		{
			void this.updateMarks();
		},
		resourcesIds(): void
		{
			void this.updateMarks();
		},
		intersections(): void
		{
			void this.updateMarks();
		},
		editingBooking(booking: BookingModel | null): void
		{
			const additionalResourcesIds = booking?.resourcesIds?.slice(1) ?? [];
			if (additionalResourcesIds.length > 0)
			{
				void this.$store.dispatch(`${Model.Interface}/setIntersections`, {
					0: additionalResourcesIds,
				});
			}
		},
	},
	beforeMount(): void
	{
		mousePosition.init();
	},
	async mounted(): Promise<void>
	{
		this.showLoader();
		expandOffHours.setExpanded(true);
		this.addAfterTitle();

		SectionAnalytics.sendOpenSection();

		await Promise.all([
			dictionaryService.fetchData(),
			this.fetchPage(this.editingBookingId > 0 ? 0 : this.selectedDateTs / 1000),
		]);

		void this.$store.dispatch(`${Model.Interface}/setIsLoaded`, true);
	},
	beforeUnmount(): void
	{
		mousePosition.destroy();
	},
	methods: {
		async fetchPage(dateTs: number = 0): Promise<void>
		{
			this.showLoader();

			await mainPageService.fetchData(dateTs);

			if (this.extraResourcesIds.length > 0)
			{
				await resourceDialogService.loadByIds(
					this.extraResourcesIds,
					this.selectedDateTs / 1000,
				);
			}

			this.hideLoader();
		},
		onActiveItem(counterItem: string | null): void
		{
			if (this.ignoreConterPanel)
			{
				return;
			}

			const fields = this.getFilterFieldsByCounterItem(counterItem);
			this.$refs.filter.setFields(fields);
		},
		async applyFilter(): Promise<void>
		{
			const fields = this.$refs.filter.getFields();

			this.setCounterItem(this.getCounterItemByFilterFields(fields));
			this.showLoader();

			await Promise.all([
				this.$store.dispatch(`${Model.Interface}/setFilterMode`, true),
				this.updateMarks(),
				// eslint-disable-next-line unicorn/no-array-callback-reference
				bookingService.filter(fields),
			]);

			this.hideLoader();
		},
		setCounterItem(item: string | null): void
		{
			this.ignoreConterPanel = true;
			setTimeout(() => {
				this.ignoreConterPanel = false;
			}, 0);

			this.$refs.countersPanel.setItem(item);
		},
		getCounterItemByFilterFields(filterFields: BookingUIFilter): string | null
		{
			return {
				[RequireAttention.AwaitConfirmation]: CounterItem.AwaitConfirmation,
				[RequireAttention.Delayed]: CounterItem.Delayed,
			}[filterFields.REQUIRE_ATTENTION];
		},
		getFilterFieldsByCounterItem(counterItem: string | null): BookingUIFilter
		{
			const fields = this.$refs.filter.getFields();

			fields.REQUIRE_ATTENTION = {
				[CounterItem.AwaitConfirmation]: RequireAttention.AwaitConfirmation,
				[CounterItem.Delayed]: RequireAttention.Delayed,
			}[counterItem];

			return fields;
		},
		async clearFilter(): Promise<void>
		{
			this.setCounterItem(null);

			calendarService.clearFilterCache();
			bookingService.clearFilterCache();

			void Promise.all([
				this.$store.dispatch(`${Model.Interface}/setResourcesIds`, this.resourcesIds),
				this.$store.dispatch(`${Model.Interface}/setFilterMode`, false),
				this.$store.dispatch(`${Model.Interface}/setFilteredBookingsIds`, []),
				this.$store.dispatch(`${Model.Interface}/setFilteredMarks`, []),
			]);

			this.hideLoader();
		},
		addAfterTitle(): void
		{
			this.afterTitleContainer.append(this.$refs.afterTitle.$el);
		},
		showResourcesWithBookings(): void
		{
			const resourcesIds = this.$store.getters[`${Model.Bookings}/getByDateAndIds`](
				this.selectedDateTs,
				this.filteredBookingsIds,
			)
				.map((booking: BookingModel) => booking.resourcesIds[0])
				.filter((value, index, array) => array.indexOf(value) === index)
			;

			void this.$store.dispatch(`${Model.Interface}/setResourcesIds`, resourcesIds);
		},
		async updateMarks(): Promise<void>
		{
			if (this.isFilterMode)
			{
				await this.updateFilterMarks();
			}
			else
			{
				await Promise.all([
					this.updateFreeMarks(),
					this.updateCounterMarks(),
				]);
			}
		},
		async updateFreeMarks(): Promise<void>
		{
			const resources = this.resourcesIds.map((id: number) => [
				id,
				...(this.intersections[0] ?? []),
				...(this.intersections[id] ?? []),
			]);

			await this.$store.dispatch(`${Model.Interface}/setFreeMarks`, []);

			await calendarService.loadMarks(this.viewDateTs, resources);
		},
		async updateFilterMarks(): Promise<void>
		{
			const fields = this.$refs.filter.getFields();

			await this.$store.dispatch(`${Model.Interface}/setFilteredMarks`, []);

			await calendarService.loadFilterMarks(fields);
		},
		async updateCounterMarks(): Promise<void>
		{
			await calendarService.loadCounterMarks(this.viewDateTs);
		},
		showLoader(): void
		{
			void this.loader.show(this.$refs.baseComponent.$el);
		},
		hideLoader(): void
		{
			void this.loader.hide();
		},
	},
	template: `
		<div>
			<MultiBooking v-if="hasSelectedCells"/>
			<AfterTitle ref="afterTitle"/>
			<CrmFormsButton :container="settingsButtonContainer"/>
			<BookingFilter
				:filterId="filterId"
				ref="filter"
				@apply="applyFilter"
				@clear="clearFilter"
			/>
			<CountersPanel
				:target="counterPanelContainer"
				ref="countersPanel"
				@activeItem="onActiveItem"
			/>
			<BaseComponent ref="baseComponent"/>
			<Banner/>
			<Trial/>
		</div>
	`,
};
