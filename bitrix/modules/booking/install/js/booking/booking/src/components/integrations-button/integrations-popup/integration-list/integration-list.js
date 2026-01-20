import { Button as UiButton, ButtonSize } from 'booking.component.button';
import { HelpDeskLoc } from 'booking.component.help-desk-loc';
import { Model } from 'booking.const';

import './integration-list.css';

// @vue/component
export const IntegrationList = {
	name: 'IntegrationList',
	components: {
		HelpDeskLoc,
		UiButton,
	},
	emits: ['update:view'],
	// eslint-disable-next-line flowtype/require-return-type
	setup()
	{
		return {
			ButtonSize,
		};
	},
	computed: {
		imageLanguageId(): string
		{
			const languageId = this.loc('LANGUAGE_ID') ?? 'en';

			return languageId === 'ru' ? 'ru' : 'en';
		},
		items(): IntegrationItem[]
		{
			const result = [];

			if (this.$store.state[Model.SaleChannels].integrations.length > 0)
			{
				result.push(
					{
						title: this.loc('BOOKING_INTEGRATIONS_POPUP_MAPS_TITLE'),
						description: this.loc('BOOKING_INTEGRATIONS_POPUP_MAPS_DESCRIPTION'),
						imageClass: `--integration-maps-${this.imageLanguageId}`,
						buttonLabel: this.loc('BOOKING_INTEGRATIONS_POPUP_MAPS_BUTTON_LABEL'),
						toView: 'IntegrationMapList',
					},
				);
			}

			result.push(
				{
					title: this.loc('BOOKING_INTEGRATIONS_POPUP_FORMS_TITLE'),
					description: this.loc('BOOKING_INTEGRATIONS_POPUP_FORMS_DESCRIPTION'),
					imageClass: `--integration-crm-forms-${this.imageLanguageId}`,
					buttonLabel: this.loc('BOOKING_INTEGRATIONS_POPUP_FORMS_BUTTON_LABEL'),
					toView: 'CrmFormsIntegration',
				},
			);

			return result;
		},
	},
	template: `
		<div class="booking--integration-popup--integration-list">
			<div class="booking--integration-popup--integration-list__header">
				<h5 class="booking--integration-popup--integration-list__title">
					{{ loc('BOOKING_INTEGRATIONS_POPUP_TITLE') }}
				</h5>
				<div class="booking--integration-popup--integration-list__description">
					<HelpDeskLoc :message="loc('BOOKING_INTEGRATIONS_POPUP_DESCRIPTION')" />
				</div>
			</div>
			<div class="booking--integration-popup--integration-list__list">
				<div
					class="booking--integration-popup--integration-list-item"
					v-for="item in items"
					:key="item.title"
				>
					<div class="booking--integration-popup--integration-list-item__data">
						<div class="booking--integration-popup--integration-list-item__title">
							{{ item.title }}
						</div>
						<div class="booking--integration-popup--integration-list-item__description">
							{{ item.description }}
						</div>
						<div class="booking--integration-popup--integration-list-item__button">
							<UiButton
								:text="item.buttonLabel"
								:size="ButtonSize.SMALL"
								noCaps
								useAirDesign
								@click="$emit('update:view', item.toView)"
							/>
						</div>
					</div>
					<div
						class="booking--integration-popup--integration-list-item__image"
						:class="item.imageClass"
					></div>
				</div>
			</div>
		</div>
	`,
};

type IntegrationItem = {
	title: string;
	description: string;
	imageClass: string;
	buttonLabel: string;
	toView: string;
}
