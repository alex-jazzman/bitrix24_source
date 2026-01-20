import { BIcon as Icon, Outline } from 'ui.icon-set.api.vue';
import { EmptyRichLoc } from 'booking.component.help-desk-loc';
import { UiResourceWizardItem } from 'booking.component.ui-resource-wizard-item';
import { UiErrorMessage } from 'booking.component.ui-error-message';
import { Button as UiButton, ButtonColor, ButtonSize, ButtonIcon } from 'booking.component.button';
import { Model } from 'booking.const';

import './cabinet-link.css';

// @vue/component
export const YandexIntegrationWizardCabinetLink = {
	name: 'YandexIntegrationWizardCabinetLink',
	components: {
		UiResourceWizardItem,
		UiErrorMessage,
		EmptyRichLoc,
		UiButton,
		Icon,
	},
	setup(): Object
	{
		return {
			ButtonColor,
			ButtonSize,
			ButtonIcon,
			Outline,
		};
	},
	computed: {
		cabinetLink: {
			get(): string
			{
				return this.$store.getters[`${Model.YandexIntegrationWizard}/getCabinetLink`];
			},
			set(link: string): void
			{
				this.$store.dispatch(`${Model.YandexIntegrationWizard}/setCabinetLink`, { link });
			},
		},
		hasInvalidCabinetLink(): boolean
		{
			return this.$store.getters[`${Model.YandexIntegrationWizard}/hasInvalidCabinetLink`];
		},
		cabinetLinkImageUrl(): string
		{
			const languageId = this.loc('LANGUAGE_ID') ?? 'en';
			const imageLanguageId = languageId === 'ru' ? 'ru' : 'en';

			return `/bitrix/js/booking/application/yandex-integration-wizard/images/yandex-cabinet-link-guide-${imageLanguageId}.png`;
		},
		yandexBusinessLink(): string
		{
			const integrationSettings = this.$store.getters[`${Model.YandexIntegrationWizard}/getIntegrationSettings`];

			return integrationSettings.businessLink;
		},
		cabinetLinkPlaceholder(): string
		{
			const integrationSettings = this.$store.getters[`${Model.YandexIntegrationWizard}/getIntegrationSettings`];

			return integrationSettings.cabinetLinkPlaceholder;
		},
	},
	methods: {
		goToYandexBusiness(): void
		{
			window.open(this.yandexBusinessLink, '_blank');
		},
		validateCabinetLink(): void
		{
			this.$store.dispatch(`${Model.YandexIntegrationWizard}/validateCabinetLink`);
		},
		setInvalidCabinetLink(isInvalid: boolean): void
		{
			this.$store.dispatch(`${Model.YandexIntegrationWizard}/setInvalidCabinetLink`, isInvalid);
		},
	},
	template: `
		<UiResourceWizardItem
			:iconType="Outline.REGISTRATION_ON_SITE"
			:title="loc('YANDEX_WIZARD_CABINET_LINK_TITLE')"
			:description="loc('YANDEX_WIZARD_CABINET_LINK_DESCRIPTION')"
			helpDeskType="YandexIntegration"
		>
			<div class="booking-yiw-cabinet-link__content">
				<div class="booking-yiw-cabinet-link__input-container">
					<label for="yiw-settings-cabinet-link" class="booking-yiw-cabinet-link__input-label">
						{{ loc('YANDEX_WIZARD_CABINET_LINK_INPUT_LABEL') }}
					</label>
					<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
						<input
							type="url"
							data-id="yiw-settings-cabinet-link-input"
							id="yiw-settings-cabinet-link"
							v-model.trim="cabinetLink"
							class="ui-ctl-element"
							:class="{ '--error': hasInvalidCabinetLink }"
							:placeholder="cabinetLinkPlaceholder"
							@blur="validateCabinetLink"
							@focus="setInvalidCabinetLink(false)"
						/>
					</div>
					<UiErrorMessage
						v-if="hasInvalidCabinetLink"
						:message="loc('YANDEX_WIZARD_CABINET_LINK_INVALID_LINK')"
					/>
				</div>
				<div class="booking-yiw-cabinet-link__guide-container">
					<div class="booking-yiw-cabinet-link__guide-content">
						<div class="booking-yiw-cabinet-link__guide-title">
							{{ loc('YANDEX_WIZARD_CABINET_LINK_GUIDE_TITLE') }}
						</div>
						<div class="booking-yiw-cabinet-link__guide-steps">
							<div class="booking-yiw-cabinet-link__guide-step">
								<span class="booking-yiw-cabinet-link__guide-step-number">1</span>
								<div class="booking-yiw-cabinet-link__guide-step-text">
									<EmptyRichLoc
										:message="loc('YANDEX_WIZARD_CABINET_LINK_GUIDE_STEP_1')"
										:rules="['br']"
									/>
								</div>
							</div>
							<div class="booking-yiw-cabinet-link__guide-step">
								<span class="booking-yiw-cabinet-link__guide-step-number">2</span>
								<div class="booking-yiw-cabinet-link__guide-step-text">
									<EmptyRichLoc
										:message="loc('YANDEX_WIZARD_CABINET_LINK_GUIDE_STEP_2')"
										:rules="['br']"
									/>
								</div>
							</div>
						</div>
						<UiButton
							:text="loc('YANDEX_WIZARD_CABINET_LINK_BUTTON_TEXT')"
							:color="ButtonColor.PRIMARY"
							:size="ButtonSize.MEDIUM"
							noCaps
							useAirDesign
							@click="goToYandexBusiness"
						/>
					</div>
					<img 
						class="booking-yiw-cabinet-link__guide-image"
						:src="cabinetLinkImageUrl"
						:alt="loc('YANDEX_WIZARD_CABINET_LINK_GUIDE_TITLE')"
						draggable="false"
					/>
				</div>
			</div>
		</UiResourceWizardItem>
	`,
};
