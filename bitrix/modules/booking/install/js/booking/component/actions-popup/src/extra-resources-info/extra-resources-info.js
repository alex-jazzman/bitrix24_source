import { Loc } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';
import { BIcon as UiIcon, Outline, Set as IconSet } from 'ui.icon-set.api.vue';

import { LimitFeatureId, Model } from 'booking.const';
import { Button as UiButton, AirButtonStyle, ButtonColor, ButtonSize, ButtonStyle } from 'booking.component.button';
import { limit } from 'booking.lib.limit';
import { bookingService } from 'booking.provider.service.booking-service';

import { ExtraResourcesDialog } from './extra-resources-dialog';
import { ExtraResourcesInfoPopup } from './extra-resources-info-popup';
import './extra-resources-info.css';

// @vue/component
export const ExtraResourcesInfo = {
	name: 'ExtraResourceInfo',
	components: {
		UiButton,
		UiIcon,
		ExtraResourcesDialog,
		ExtraResourcesInfoPopup,
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
	setup(): ExtraResourcesInfoData
	{
		const iconProductName = Outline.PRODUCT;
		const iconBtnName = Outline.EDIT_M;
		const iconEditName = Outline.EDIT_M;
		const iconHelpName = IconSet.HELP;

		return {
			iconProductName,
			iconBtnName,
			iconEditName,
			iconHelpName,
			AirButtonStyle,
			ButtonColor,
			ButtonSize,
			ButtonStyle,
			Outline,
		};
	},
	data(): Object
	{
		return {
			shownResourcesSelector: false,
			showDialogInfo: false,
		};
	},
	computed: {
		...mapGetters({
			getBookingById: `${Model.Bookings}/getById`,
		}),
		booking(): BookingModel
		{
			return this.getBookingById(this.id);
		},
		subtitle(): string
		{
			if (this.hasExtraResources)
			{
				const count = this.extraResourcesIds.length;

				return Loc.getMessagePlural('BOOKING_ACTIONS_POPUP_EXTRA_RESOURCES_INFO_SUBTITLE', count, {
					'#COUNT#': count,
				});
			}

			return this.loc('BOOKING_ACTIONS_POPUP_EXTRA_RESOURCES_INFO_SUBTITLE_EMPTY');
		},
		extraResourcesIds(): number[]
		{
			return this.booking.resourcesIds.slice(1);
		},
		hasExtraResources(): boolean
		{
			return this.extraResourcesIds.length > 0;
		},
		iconProductColor(): string
		{
			return this.hasExtraResources ? 'rgba(0, 117, 255, 1)' : 'rgba(201, 204, 208, 1)';
		},
		featureEnabled(): boolean
		{
			return this.$store.state[Model.Interface].enabledFeature.bookingMulti;
		},
	},
	methods: {
		toggleResourcesSelector(): void
		{
			if (!this.featureEnabled)
			{
				void limit.show(LimitFeatureId.MultiResources);

				return;
			}

			this.shownResourcesSelector = true;
			this.$emit('freeze');
		},
		toggleResourcesInfo(): void
		{
			this.showDialogInfo = this.hasExtraResources ? !this.showDialogInfo : this.showDialogInfo;
		},
		hideResourcesSelector(): void
		{
			this.shownResourcesSelector = false;
			this.$emit('unfreeze');
		},
		saveBookingExtraResources(extraResources: number[]): void
		{
			this.hideResourcesSelector();

			if (!this.hasExtraResourcesChanged(extraResources))
			{
				return;
			}

			const resourcesIds = new Set([this.booking.resourcesIds[0], ...extraResources]);

			void bookingService.update({
				id: this.booking.id,
				resourcesIds: [...resourcesIds],
			});
		},
		hasExtraResourcesChanged(extraResources: number[]): boolean
		{
			const bookingExtraResources = this.booking.resourcesIds.slice(1).sort();
			if (bookingExtraResources.length !== extraResources.length)
			{
				return true;
			}

			return [...bookingExtraResources].sort().join(',') !== [...extraResources].sort().join(',');
		},
	},
	template: `
		<div class="booking-actions-popup__item booking--actions-popup--extra-resources-info">
			<div class="booking-actions-popup__resources-info_row">
				<div class="booking-actions-popup__resources-info_row-wrapper">
					<div
						:class="[
							'booking-actions-popup-item-icon',
							'booking-actions-popup__resources-info_icon-product-bg',
							{
								'--active': hasExtraResources
							}
						]"
					>
						<UiIcon
							:name="iconProductName"
							:color="iconProductColor"
						/>
					</div>
					<div class="booking-actions-popup__resources-info_content">
						<div class="booking-actions-popup__resources-info_title">
							<span>{{ loc('BOOKING_ACTIONS_POPUP_EXTRA_RESOURCES_INFO_TITLE_MSGVER_1') }}</span>
						</div>
						<div class="booking-actions-popup__resources-info_subtitle">
							<span
								ref="button"
								data-element="amount-additional-resources"
								:class="{ '--fill': hasExtraResources }"
								@click="toggleResourcesInfo"
							>
								{{ subtitle }}
							</span>
							<ExtraResourcesInfoPopup
								v-if="showDialogInfo"
								v-model:visible="showDialogInfo"
								:bindElement="$refs.button"
								:booking
								:resourceId
							/>
						</div>
					</div>
				</div>
				<div ref="edit" class="booking-actions-popup-item-buttons">
					<UiButton
						class="booking-actions-popup-button-with-chevron"
						buttonClass="ui-btn-shadow"
						:text="loc('BOOKING_ACTIONS_POPUP_EXTRA_RESOURCES_INFO_TEXT_BTN')"
						data-element="btn-toggle-resources-selector"
						:buttonClass="['--air', ButtonStyle.NO_CAPS, AirButtonStyle.OUTLINE_NO_ACCENT]"
						:color="ButtonColor.LIGHT"
						:size="ButtonSize.EXTRA_SMALL"
						round
						@click="toggleResourcesSelector"
					>
						<UiIcon
							:name="featureEnabled ? Outline.EDIT_M : Outline.LOCK_L"
							:color="featureEnabled ? '' : 'var(--ui-color-base-5)'"
						/>
					</UiButton>
				</div>
			</div>
			<ExtraResourcesDialog
				v-if="shownResourcesSelector && featureEnabled"
				:booking
				:resourceId
				@save="saveBookingExtraResources"
			/>
		</div>
	`,
};

type ExtraResourcesInfoData = {
	iconProductName: string;
	iconBtnName: string;
	iconEditName: string;
	iconHelpName: string;
}
