import { Button, AirButtonStyle, ButtonSize } from 'booking.component.button';
import { ResourcesSelector } from '../add-resources-button/resources-selector';

import './empty-state.css';

// @vue/component
export const EmptyState = {
	name: 'EmptyState',
	components: {
		ResourcesSelector,
		UiButton: Button,
	},
	props: {
		resourceTitle: {
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
	data(): { shownSelector: boolean }
	{
		return {
			shownSelector: false,
		};
	},
	computed: {
		buttonTitle(): string
		{
			return this.loc('BOOKING_RESOURCES_SETTINGS_EMPTY_STATE_ADD_BUTTON');
		},
		title(): string
		{
			return this.resourceTitle
				? this.loc('BOOKING_RESOURCES_SETTINGS_EMPTY_STATE_SEARCH_TITLE')
				: this.loc('BOOKING_RESOURCES_SETTINGS_EMPTY_STATE_TITLE');
		},
		description(): string
		{
			return this.resourceTitle
				? this.loc('BOOKING_RESOURCES_SETTINGS_EMPTY_STATE_SEARCH_DESCRIPTION', {
					'#SEARCH_TEXT#': this.resourceTitle,
				})
				: this.loc('BOOKING_RESOURCES_SETTINGS_EMPTY_STATE_DESCRIPTION');
		},
	},
	methods: {
		toggleShownSelector(): void
		{
			this.shownSelector = !this.shownSelector;
		},
	},
	template: `
		<div class="booking-resources-settings__resources-view_empty-state">
				<div class="booking-resources-settings__resources-view_empty-state-icon"></div>
				<div class="booking-resources-settings__resources-view_empty-state-title">
					{{ title }}
				</div>
				<div class="booking-resources-settings__resources-view_empty-state-description">
					{{ description }}
				</div>
				<div class="booking-resources-settings__resources-view_empty-state-button">
					<UiButton
						ref="btn"
						:text="buttonTitle"
						:size="ButtonSize.SMALL"
						:style="AirButtonStyle.TINTED"
						icon="ui-btn-icon-add"
						iconPosition="left"
						noCaps
						useAirDesign
						@click="toggleShownSelector"
					/>
					<ResourcesSelector
						v-if="shownSelector"
						:targetNode="$refs.btn.$el"
						@close="shownSelector = false"
					/>
				</div>
		</div>
	`,
};
