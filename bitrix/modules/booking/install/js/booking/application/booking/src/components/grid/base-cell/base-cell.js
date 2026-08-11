import { Event, Text } from 'main.core';
import { DateTimeFormat } from 'main.date';

import { mapGetters } from 'ui.vue3.vuex';
import { BIcon as Icon, Set as IconSet } from 'ui.icon-set.api.vue';
import { Button as UiButton, ButtonSize, ButtonColor, ButtonIcon } from 'booking.component.button';

import { Model } from 'booking.const';
import type { DealData } from 'booking.model.bookings';
import type { ClientData } from 'booking.model.clients';
import { bookingService } from 'booking.provider.service.booking-service';
import { BookingAnalytics } from 'booking.lib.analytics';
import { limit } from 'booking.lib.limit';
import { gridFactory } from 'booking.lib.grid';
import './base-cell.css';

/**
 * @typedef {Object} Cell
 * @property {string} id
 * @property {number} fromTs
 * @property {number} toTs
 * @property {number} resourceId
 * @property {boolean} boundedToBottom
 */
export const BaseCell = {
	props: {
		/** @type {Cell} */
		cell: {
			type: Object,
			required: true,
		},
		className: {
			type: [String, Object],
			default: '',
		},
		fixed: {
			type: Boolean,
			default: true,
		},
		compact: {
			type: Boolean,
			default: false,
		},
	},
	components: {
		Icon,
		UiButton,
	},
	data(): Object
	{
		return {
			creatingBookingId: null,
		};
	},

	setup(): {
		IconSet: typeof IconSet,
		ButtonSize: typeof ButtonSize,
		ButtonColor: typeof ButtonColor,
		ButtonIcon: typeof ButtonIcon,
		}
	{
		return {
			IconSet,
			ButtonSize,
			ButtonColor,
			ButtonIcon,
		};
	},
	computed: {
		...mapGetters({
			selectedPlacementSlots: `${Model.Interface}/selectedPlacementSlots`,
			intersections: `${Model.Interface}/intersections`,
			timezone: `${Model.Interface}/timezone`,
			offset: `${Model.Interface}/offset`,
			isFeatureEnabled: `${Model.Interface}/isFeatureEnabled`,
			draggedDataTransfer: `${Model.Interface}/draggedDataTransfer`,
			embedItems: `${Model.Interface}/embedItems`,
		}),
		grid(): GridBase
		{
			return gridFactory.getGrid();
		},
		selected(): boolean
		{
			return this.cell.id in this.selectedPlacementSlots;
		},
		hasSelectedCells(): boolean
		{
			return Object.keys(this.selectedPlacementSlots).length > 0;
		},
		timeFormatted(): string
		{
			const timeFormat = DateTimeFormat.getFormat('SHORT_TIME_FORMAT');

			return this.loc('BOOKING_BOOKING_TIME_RANGE', {
				'#FROM#': DateTimeFormat.format(timeFormat, (this.cell.fromTs + this.offset) / 1000),
				'#TO#': DateTimeFormat.format(timeFormat, (this.cell.toTs + this.offset) / 1000),
			});
		},
		height(): number
		{
			return this.grid.calculateRealHeight(this.cell.fromTs, this.cell.toTs);
		},
		externalData(): DealData[]
		{
			return this.embedItems;
		},
		clients(): ClientData[]
		{
			const clients = this.embedItems.filter((item: DealData) => {
				return item.entityTypeId === 'CONTACT' || item.entityTypeId === 'COMPANY';
			});

			return clients.map((item: DealData) => {
				return {
					id: item.value,
					type: {
						code: item.entityTypeId,
						module: item.moduleId,
					},
				};
			});
		},
	},
	methods: {
		onCellSelected({ target: { checked } }): void
		{
			if (!this.isFeatureEnabled)
			{
				limit.show();

				return;
			}

			if (checked)
			{
				this.$store.dispatch(`${Model.Interface}/addSelectedCell`, this.cell);
			}
			else
			{
				this.$store.dispatch(`${Model.Interface}/removeSelectedCell`, this.cell);
			}
		},
		onMouseDown(): void
		{
			if (!this.isFeatureEnabled)
			{
				void limit.show();

				return;
			}

			void this.$store.dispatch(`${Model.Interface}/setHoveredPlacementSlot`, null);

			this.creatingBookingId = `tmp-id-${Date.now()}-${Text.getRandom(4)}`;

			void this.$store.dispatch(`${Model.Filter}/addQuickFilterIgnoredBookingId`, this.creatingBookingId);
			void this.$store.dispatch(`${Model.Bookings}/add`, {
				id: this.creatingBookingId,
				dateFromTs: this.cell.fromTs,
				dateToTs: this.cell.toTs,
				resourcesIds: [...new Set([
					this.cell.resourceId,
					...(this.intersections[0] ?? []),
					...(this.intersections[this.cell.resourceId] ?? []),
				])],
				timezoneFrom: this.timezone,
				timezoneTo: this.timezone,
				externalData: this.externalData,
				clients: this.clients,
			});

			Event.bind(window, 'mouseup', this.addBooking);
		},
		addBooking(): void
		{
			Event.unbind(window, 'mouseup', this.addBooking);

			if (!this.isFeatureEnabled)
			{
				void limit.show();

				return;
			}

			setTimeout(async (): Promise<void> => {
				const creatingBooking = this.$store.getters[`${Model.Bookings}/getById`](this.creatingBookingId);
				const result = await bookingService.add(creatingBooking);
				if (result.success && result.booking)
				{
					const overbookingMap = this.$store.getters[`${Model.Bookings}/overbookingMap`];
					BookingAnalytics.sendAddBooking({
						isOverbooking: Boolean(overbookingMap?.has?.(result.booking.id)),
					});
				}
			});
		},
	},
	template: `
		<div
			class="booking-booking-base-cell"
			:class="[className, {
				'--selected': selected,
				'--bounded-to-bottom': cell.boundedToBottom,
				'--height-is-less-than-40': height < 40,
				'--small': height <= 20,
			}]"
			:style="{
				'--height': height + 'px',
			}"
			data-element="booking-base-cell"
			:data-resource-id="cell.resourceId"
			:data-from="cell.fromTs"
			:data-to="cell.toTs"
			:data-selected="selected"
		>
			<div class="booking-booking-grid-cell-padding">
				<div class="booking-booking-grid-cell-inner">
					<label
						class="booking-booking-grid-cell-time"
						:class="{ '--hidden': !fixed }"
						data-element="booking-grid-cell-select-label"
					>
						<span class="booking-booking-grid-cell-time-inner">
							<input
								v-if="!draggedDataTransfer.id"
								class="booking-booking-grid-cell-checkbox"
								type="checkbox"
								:checked="selected"
								@change="onCellSelected"
							>
							<span data-element="booking-grid-cell-time">
								{{ timeFormatted }}
							</span>
						</span>
					</label>
					<div
						v-if="fixed && !hasSelectedCells && !draggedDataTransfer.id"
						class="booking-booking-grid-cell-select-button-container"
						ref="button"
						data-element="booking-grid-cell-add-button"
						@mousedown="onMouseDown"
					>
						<UiButton
							:text="(!isFeatureEnabled || compact) ? '' : loc('BOOKING_BOOKING_SELECT')"
							:icon="!isFeatureEnabled ? ButtonIcon.LOCK : (compact ? ButtonIcon.CHEVRON_RIGHT_S : null)"
							:size="compact ? ButtonSize.EXTRA_EXTRA_SMALL : ButtonSize.EXTRA_SMALL"
							:color="isFeatureEnabled ? ButtonColor.PRIMARY : ButtonColor.LIGHT_BORDER"
							:round="true"
							useAirDesign
						/>
					</div>
				</div>
			</div>
		</div>
	`,
};
