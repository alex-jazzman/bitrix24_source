import { AirButtonStyle, Button as UiButton, ButtonColor, ButtonSize, ButtonStyle } from 'booking.component.button';
import { Model } from 'booking.const';
import { Core } from 'booking.core';

import { IntegrationsPopup } from './integrations-popup/integrations-popup';

// @vue/component
export const IntegrationsButton = {
	name: 'IntegrationButton',
	components: {
		IntegrationsPopup,
		UiButton,
	},
	props: {
		container: {
			type: HTMLElement,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonColor,
			ButtonSize,
			ButtonStyle,
			Core,
		};
	},
	data(): {}
	{
		return {
			isPopupShown: false,
		};
	},
	computed: {
		storeState(): string
		{
			return this.Core.getStore()?.state;
		},
		counters(): string
		{
			return this.storeState.counters.counters;
		},
		newYandexMapsCounter(): number
		{
			return this.$store.state[Model.Counters].counters.newYandexMaps;
		},
		counterIntegrations(): string
		{
			return {
				id: 'counterIntegrationOpener',
				value: this.newYandexMapsCounter,
			};
		},
		label(): string
		{
			return this.loc('BOOKING_INTEGRATIONS_BUTTON_LABEL');
		},
	},
	mounted(): void
	{
		this.container.replaceWith(this.$refs.integrationsPopupOpener.$el);
	},
	methods: {
		togglePopup(): void
		{
			this.isPopupShown = !this.isPopupShown;
		},
	},
	template: `
		<UiButton
			ref="integrationsPopupOpener"
			:text="label"
			:rightCounter="counterIntegrations"
			:size="ButtonSize.SMALL"
			:style="AirButtonStyle.OUTLINE_NO_ACCENT"
			useAirDesign
			:color="ButtonColor.LIGHT_BORDER"
			@click="togglePopup"
		/>
		<IntegrationsPopup
			v-if="isPopupShown"
			:bindElement="$refs.integrationsPopupOpener.$el"
			@close="togglePopup"
		/>
	`,
};
