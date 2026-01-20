import { Loc } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';
import { BIcon as UiIcon, Outline } from 'ui.icon-set.api.vue';

import { Model } from 'booking.const';
import { Button as UiButton, AirButtonStyle, ButtonColor, ButtonSize, ButtonStyle } from 'booking.component.button';
import { bookingService } from 'booking.provider.service.booking-service';

import { SkusInfoPopup } from './skus-info-popup';
import { SkusInfoSelector } from './skus-info-selector/skus-info-selector';

// @vue/component
export const SkusInfo = {
	name: 'SkusInfo',
	components: {
		UiButton,
		UiIcon,
		SkusInfoPopup,
		SkusInfoSelector,
	},
	props: {
		id: {
			type: [Number, String],
			required: true,
		},
		resourceId: {
			type: Number,
			required: true,
		},
	},
	emits: ['freeze', 'unfreeze'],
	data(): SkusInfoData
	{
		return {
			AirButtonStyle,
			ButtonColor,
			ButtonSize,
			ButtonStyle,
			Outline,
			shownSelector: false,
			showDialogInfo: false,
		};
	},
	computed: {
		...mapGetters({
			getResourceById: `${Model.Resources}/getById`,
			getBookingById: `${Model.Bookings}/getById`,
		}),
		skus(): Array
		{
			return this.getResourceById(this.resourceId).skus;
		},
		booking(): BookingModel
		{
			return this.getBookingById(this.id);
		},
		bookingSkus(): Array
		{
			return this.booking.skus;
		},
		subtitle(): string
		{
			if (this.hasSkus)
			{
				const count = this.bookingSkus.length;

				return Loc.getMessagePlural('BOOKING_ACTIONS_POPUP_SKUS_INFO_SUBTITLE', count, {
					'#COUNT#': count,
				});
			}

			return this.loc('BOOKING_ACTIONS_POPUP_SKUS_INFO_SUBTITLE_EMPTY');
		},
		hasSkus(): boolean
		{
			return this.bookingSkus.length > 0;
		},
		iconProductColor(): string
		{
			return this.hasSkus ? 'rgba(0, 117, 255, 1)' : 'rgba(201, 204, 208, 1)';
		},
	},
	methods: {
		toggleSkusInfo(): void
		{
			this.showDialogInfo = this.hasSkus ? !this.showDialogInfo : this.showDialogInfo;
		},
		toggleSkusSelector(): void
		{
			this.shownSelector = true;
			this.$emit('freeze');
		},
		hideSkusSelector(): void
		{
			this.shownSelector = false;
			this.$emit('unfreeze');
		},
		saveBookingSkus(selectSkus: number[]): void
		{
			this.hideSkusSelector();

			if (this.hasDiffsWithBookingSkus(new Set(selectSkus)))
			{
				void bookingService.update({
					id: this.id,
					skus: [...(new Set(selectSkus.map((id) => ({ id }))))],
				});
			}
		},
		hasDiffsWithBookingSkus(updatedSkusIds: Set<number>): boolean
		{
			const bookingSkusIds = new Set(this.bookingSkus.map(({ id }) => id));

			if (bookingSkusIds.size !== updatedSkusIds.size)
			{
				return true;
			}

			for (const id of bookingSkusIds)
			{
				if (!updatedSkusIds.has(id))
				{
					return true;
				}
			}

			return false;
		},
	},
	template: `
		<div class="booking-actions-popup__item booking--actions-popup--skus-info">
			<div class="booking-actions-popup__resources-info_row">
				<div class="booking-actions-popup__resources-info_row-wrapper">
					<div
						:class="[
							'booking-actions-popup-item-icon',
							'booking-actions-popup__resources-info_icon-product-bg',
							{
								'--active': hasSkus
							}
						]"
					>
						<UiIcon
							:name="Outline.THREE_PERSONS"
							:color="iconProductColor"
						/>
					</div>
					<div class="booking-actions-popup__resources-info_content">
						<div class="booking-actions-popup__resources-info_title">
							<span>{{ loc('BOOKING_ACTIONS_POPUP_SKUS_INFO_TITLE') }}</span>
						</div>
						<div class="booking-actions-popup__resources-info_subtitle">
							<span
								ref="button"
								data-element="amount-services"
								:class="{ '--fill': hasSkus }"
								@click="toggleSkusInfo"
							>
								{{ subtitle }}
							</span>
							<SkusInfoPopup
								v-if="showDialogInfo"
								v-model:visible="showDialogInfo"
								:bindElement="$refs.button"
								:skus="bookingSkus"
							/>
						</div>
					</div>
				</div>
				<div ref="edit" class="booking-actions-popup-item-buttons">
					<UiButton
						class="booking-actions-popup-button-with-chevron"
						buttonClass="ui-btn-shadow"
						:text="loc('BOOKING_ACTIONS_POPUP_EXTRA_RESOURCES_INFO_TEXT_BTN')"
						data-element="btn-toggle-skus-selector"
						:buttonClass="['--air', ButtonStyle.NO_CAPS, AirButtonStyle.OUTLINE_NO_ACCENT]"
						:color="ButtonColor.LIGHT"
						:size="ButtonSize.EXTRA_SMALL"
						round
						@click="toggleSkusSelector"
					>
						<UiIcon
							:name="Outline.EDIT_M"
						/>
					</UiButton>
				</div>
			</div>
			<SkusInfoSelector
				v-if="shownSelector"
				:id="id"
				:resourceId
				@save="saveBookingSkus"
			/>
		</div>
	`,
};

type SkusInfoData = {
	AirButtonStyle: typeof AirButtonStyle,
	ButtonColor: typeof ButtonColor,
	ButtonSize: typeof ButtonSize,
	ButtonStyle: typeof ButtonStyle,
	Outline: typeof Outline,
	shownSelector: Boolean,
	showDialogInfo: Boolean,
};
