import { Button as UiButton, ButtonSize } from 'booking.component.button';
import { IntegrationMapItemStatus } from 'booking.const';
import { ItemMenu } from '../item-menu/item-menu';

import type { IntegrationMapItem } from '../../integration-map-list';

import './status-control.css';

// @vue/component
export const StatusControl = {
	name: 'IntegrationMapItemStatusControl',
	components: {
		UiButton,
		MapIntegrationItemMenu: ItemMenu,
	},
	props: {
		item: {
			type: Object,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			UiButton,
			ButtonSize,
			IntegrationMapItemStatus,
		};
	},
	computed: {
		getItem(): IntegrationMapItem
		{
			return this.item;
		},
	},
	methods: {
		handleClick(): void
		{
			if (this.getItem.click)
			{
				this.getItem.click();
			}
		},
	},
	template: `
		<div class="booking--integration-popup--integration-map-list-item__action">
			<template v-if="this.getItem.status === IntegrationMapItemStatus.CONNECTED">
				<span class="booking--integration-popup--integration-map-list-item__connected">
					{{ loc('BOOKING_INTEGRATIONS_MAPS_LIST_CONNECTED_LABEL') }}
				</span>
				<MapIntegrationItemMenu :item="getItem" />
			</template>
			<template v-else-if="this.getItem.status === IntegrationMapItemStatus.IN_PROGRESS">
				<span class="booking--integration-popup--integration-map-list-item__pending">
					{{ loc('BOOKING_INTEGRATIONS_MAPS_LIST_PENDING_LABEL') }}
				</span>
				<MapIntegrationItemMenu :item="getItem" />
			</template>
			<template v-else-if="this.getItem.status === IntegrationMapItemStatus.NOT_CONNECTED">
				<UiButton
					class="booking--integration-popup--integration-map-list-item__available"
					:text="loc('BOOKING_INTEGRATIONS_MAPS_LIST_CONNECT_BUTTON_LABEL')"
					:size="ButtonSize.SMALL"
					noCaps
					useAirDesign
					@click="handleClick"
				/>
			</template>
			<template v-else>
				<span class="booking--integration-popup--integration-map-list-item__unavailable">
					{{ loc('BOOKING_INTEGRATIONS_MAPS_LIST_SOON_LABEL') }}
				</span>
			</template>
		</div>
	`,
};
