import { Button, AirButtonStyle, ButtonSize } from 'booking.component.button';
import { SkusSelector } from '../add-skus-button/skus-selector';

import './empty-state.css';

// @vue/component
export const EmptyState = {
	name: 'EmptyState',
	components: {
		SkusSelector,
		UiButton: Button,
	},
	props: {
		skuTitle: {
			type: String,
			default: null,
		},
	},
	setup(): { AirButtonStyle: typeof AirButtonStyle, ButtonSize: typeof ButtonSize }
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): { shown: boolean }
	{
		return {
			shown: false,
		};
	},
	computed: {
		buttonTitle(): string
		{
			return this.loc('BOOKING_SERVICES_SETTINGS_EMPTY_STATE_ADD_BUTTON');
		},
		title(): string
		{
			return this.skuTitle
				? this.loc('BOOKING_SERVICES_SETTINGS_EMPTY_STATE_SEARCH_TITLE')
				: this.loc('BOOKING_SERVICES_SETTINGS_EMPTY_STATE_TITLE');
		},
		description(): string
		{
			return this.skuTitle
				? this.loc('BOOKING_SERVICES_SETTINGS_EMPTY_STATE_SEARCH_DESCRIPTION', {
					'#SEARCH_TEXT#': this.skuTitle,
				})
				: this.loc('BOOKING_SERVICES_SETTINGS_EMPTY_STATE_DESCRIPTION');
		},
	},
	methods: {
		toggleShown(): void
		{
			this.shown = !this.shown;
		},
	},
	template: `
		<div class="booking-sre-app--skus-view_empty-state">
			<div class="booking-sre-app--skus-view_empty-state-icon"></div>
			<div class="booking-sre-app--skus-view_empty-state-title">
				{{ title }}
			</div>
			<div class="booking-sre-app--skus-view_empty-state-description">
				{{ description }}
			</div>
			<div class="booking-sre-app--skus-view_empty-state-button">
				<UiButton
					ref="btn"
					:text="buttonTitle"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.TINTED"
					icon="ui-btn-icon-add"
					iconPosition="left"
					noCaps
					useAirDesign
					@click="toggleShown"
				/>
				<SkusSelector
					v-if="shown"
					:targetNode="$refs.btn.$el"
					@close="shown = false"
				/>
			</div>
		</div>
	`,
};
