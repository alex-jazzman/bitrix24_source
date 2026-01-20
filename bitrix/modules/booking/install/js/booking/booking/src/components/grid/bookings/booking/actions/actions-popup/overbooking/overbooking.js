import { Text } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';
import { hint } from 'ui.vue3.directives.hint';
import { BIcon as Icon, Set as IconSet, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.main';
import 'ui.icon-set.outline';

import { Model, LimitFeatureId } from 'booking.const';
import { limit } from 'booking.lib.limit';
import { bookingService } from 'booking.provider.service.booking-service';
import { BookingAnalytics } from 'booking.lib.analytics';
import { ClientData } from 'booking.model.clients';
import type { BookingModel, DealData } from 'booking.model.bookings';

import './overbooking.css';

// @vue/component
export const Overbooking = {
	name: 'BookingActionsPopupOverbooking',
	components: {
		Icon,
	},
	directives: {
		hint,
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
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['close'],
	setup(): Object
	{
		return {
			Outline,
			IconSet,
		};
	},
	computed: {
		...mapGetters({
			getBookingById: `${Model.Bookings}/getById`,
			dictionary: `${Model.Dictionary}/getBookingVisitStatuses`,
			isFeatureEnabled: `${Model.Interface}/isFeatureEnabled`,
			timezone: `${Model.Interface}/timezone`,
			embedItems: `${Model.Interface}/embedItems`,
		}),
		booking(): BookingModel
		{
			return this.getBookingById(this.bookingId);
		},
		featureEnabled(): boolean
		{
			return this.$store.state[Model.Interface].enabledFeature.bookingOverbooking;
		},
		hasOverbookingHint(): Object | undefined
		{
			if (!this.disabled)
			{
				return undefined;
			}

			return {
				text: this.loc('BB_ACTIONS_POPUP_OVERBOOKING_DISABLED_HINT'),
			};
		},
		iconColor(): string
		{
			if (this.disabled)
			{
				return 'var(--ui-color-palette-gray-20)';
			}

			if (!this.featureEnabled)
			{
				return 'var(--ui-color-gray-40)';
			}

			return 'var(--ui-color-palette-gray-60)';
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
		async addOverbooking(): void
		{
			if (this.disabled)
			{
				return;
			}

			if (!this.featureEnabled || !this.isFeatureEnabled)
			{
				void limit.show(LimitFeatureId.Overbooking);

				return;
			}

			const overbooking: BookingModel = {
				...this.booking,
				id: Text.getRandom(10),
				clients: this.clients,
				counter: 0,
				counters: [],
				createdAt: Date.now(),
				externalData: this.embedItems,
				isConfirmed: false,
				name: null,
				note: null,
				resourcesIds: [this.resourceId],
				primaryClient: undefined,
				rrule: null,
				timezoneFrom: this.timezone,
				timezoneTo: this.timezone,
				updatedAt: Date.now(),
				visitStatus: this.dictionary.Unknown,
			};
			delete overbooking.name;

			const result = await bookingService.add(overbooking);
			if (result.success && result.booking)
			{
				BookingAnalytics.sendAddBooking({ isOverbooking: true });
			}

			this.$emit('close');
		},
	},
	template: `
		<div
			v-hint="hasOverbookingHint"
			class="booking-actions-popup__item-overbooking-button"
			:class="{
				'--disabled': disabled,
				'--locked': !featureEnabled,
			}"
			role="button"
			tabindex="0"
			@click="addOverbooking"
		>
			<Icon
				:name="featureEnabled ? IconSet.PLUS_20 : Outline.LOCK_S"
				:size="20"
				:color="iconColor"
			/>
			<div class="booking-actions-popup__item-overbooking-label">
				{{ loc('BB_ACTIONS_POPUP_OVERBOOKING_LABEL') }}
			</div>
		</div>
	`,
};
