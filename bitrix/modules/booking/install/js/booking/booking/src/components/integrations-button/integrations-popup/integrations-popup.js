import type { PopupOptions } from 'main.popup';

import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { Popup } from 'booking.component.popup';
import { IntegrationMapItemCode, IntegrationMapItemStatus, Model } from 'booking.const';
import { Loader, LoaderType } from 'booking.component.loader';

import { MapsBlock } from './maps-block/maps-block';
import { OptionCard } from '../../option-card/option-card';
import './integrations-popup.css';

// @vue/component
export const IntegrationsPopup = {
	name: 'IntegrationsPopup',
	components: {
		BIcon,
		Popup,
		OptionCard,
		Loader,
		MapsBlock,
	},
	props: {
		bindElement: {
			type: HTMLElement,
			required: true,
		},
	},
	emits: ['close'],
	setup(): Object
	{
		return {
			Outline,
			IntegrationMapItemStatus,
			IntegrationMapItemCode,
			LoaderType,
		};
	},
	data(): {}
	{
		return {
			imgSrcVisual: '',
			imgSrcGrad: '',
			imgIconPopup: '',
		};
	},
	computed: {
		saleChannels(): any
		{
			return this.$store.state[Model.SaleChannels];
		},
		formsMenu(): any
		{
			return this.saleChannels?.formsMenu;
		},
		formsListLink(): any
		{
			return this.formsMenu.formsListLink;
		},
		formsCount(): any
		{
			return this.formsMenu?.formsCount || 0;
		},
		presets(): any
		{
			return this.formsMenu?.presets || [];
		},
		integrations(): Array
		{
			return this.saleChannels?.integrations || [];
		},
		allFormsText(): string
		{
			if (this.formsCount > 0)
			{
				return this.loc('BOOKING_INTEGRATIONS_POPUP_FORMS_ACTION_WITH_COUNT', { '#COUNT#': this.formsCount });
			}

			return this.loc('BOOKING_INTEGRATIONS_POPUP_FORMS_ACTION');
		},
		optionsForms(): Array<{ id: string, [key: string]: any }>
		{
			return this.presets.map((preset) => {
				return {
					id: preset.id,
					link: preset.link,
					head: preset.title,
					description: preset.description,
					imgSrc: this.imgIconPopup,
					footer: {
						action: this.loc('BOOKING_INTEGRATIONS_POPUP_FORMS_BUTTON_LABEL'),
					},
				};
			});
		},
		config(): PopupOptions
		{
			return {
				className: 'booking-integrations-popup',
				bindElement: this.bindElement,
				offsetTop: 10,
				padding: 0,
				minHeight: 344,
				minWidth: 659,
				maxWidth: 660,
				background: 'var(--ui-color-accent-main-primary-alt)',
				closeByEsc: true,
				bindOptions: {
					forceBindPosition: true,
					position: 'bottom',
				},
			};
		},
		description(): string
		{
			return this.loc(
				this.integrations.some(
					(integration) => integration.code === IntegrationMapItemCode.YANDEX,
				)
					? 'BOOKING_INTEGRATIONS_POPUP_DESCRIPTION_WITH_YANDEX'
					: 'BOOKING_INTEGRATIONS_POPUP_DESCRIPTION_MSGVER_1',
			);
		},
	},
	async mounted(): void
	{
		this.imgSrcVisual = (await import('../../../images/calendar_geo_message_pads_2.png')).default;
		this.imgSrcGrad = (await import('../../../images/gradient_copilot_complex_2.png')).default;
		this.imgIconPopup = (await import('../../../images/icon_popup_checked_square_rounded.svg')).default;
	},
	methods: {
		freezePopup(): void
		{
			this.$refs.popup.freeze();
		},
		unfreezePopup(): void
		{
			this.$refs.popup.unfreeze();
		},
	},
	template: `
		<Popup
			ref="popup"
			id="booking-integrations-popup"
			:config
			@close="$emit('close', $event)"
		>
			<div class="booking-integrations">
				<div class="booking-integrations__bg">
					<img :src="imgSrcGrad" alt="Bg" class="booking-integrations__bg-grad"/>
				</div>
				<div class="booking-integrations__content">
					<div class="booking-integrations__info">
						<div class="booking-integrations__info-text">
							<p class="booking-integrations__info-text-head">
								{{ loc('BOOKING_INTEGRATIONS_POPUP_TITLE') }}
							</p>
							<p class="booking-integrations__info-text-description">
								{{ description }}
							</p>
						</div>
						<div class="booking-integrations__info-visual">
							<img :src="imgSrcVisual" alt="Integrations" class="booking-integrations__info-visual-img"/>
						</div>
					</div>
					<template v-if="optionsForms.length > 0 || integrations.length > 0">
						<div class="booking-integrations__options">
							<div class="booking-integrations__options-header">
								<p class="booking-integrations__options-header-head">
									{{ loc('BOOKING_INTEGRATIONS_POPUP_FORMS_TITLE') }}
								</p>
								<a
									v-if="formsListLink"
									:href="formsListLink"
									target="_blank"
									class="booking-integrations__options-header-action"
									data-id="booking-integrations-all-forms-link"
								>
									<span class="booking-integrations__options-header-action-text">
										{{ allFormsText }}
									</span>
									<BIcon
										class="booking-integrations__options-header-action-icon"
										:size="16"
										:name="Outline.CHEVRON_RIGHT_M"
									/>
								</a>
							</div>
							<ul v-if="optionsForms.length > 0"
								class="booking-integrations__options-list"
							>
								<li v-for="option in optionsForms" :key="option" class="booking-integrations__option">
									<OptionCard
										:id="option.id"
										v-bind="option"
										@click="option.click"
									/>
								</li>
							</ul>
						</div>
						<MapsBlock
							v-if="integrations.length > 0"
							:integrations
							@freeze="freezePopup"
							@unfreeze="unfreezePopup"
						/>
					</template>
					<template v-else>
						<Loader
							class="booking-integrations__loader"
							:options="{ type: LoaderType.DEFAULT }"
						/>
					</template>
				</div>
			</div>
		</Popup>
	`,
};
