import { BIcon as Icon, Outline } from 'ui.icon-set.api.vue';

import { BookingSource } from 'booking.const';
import './source.css';

// @vue/component
export const Source = {
	name: 'BookingCardSource',
	components: {
		Icon,
	},
	inject: {
		/** @type{ AbstractCardDataService } */
		cardDataService: {},
	},
	setup(): { Outline: typeof Outline, BookingSource: typeof BookingSource }
	{
		return {
			Outline,
			BookingSource,
		};
	},
	computed: {
		source(): string
		{
			return this.cardDataService.item?.source ?? '';
		},
		isVisible(): boolean
		{
			return this.source === BookingSource.Yandex || this.source === BookingSource.Crm;
		},
	},
	template: `
		<div 
			v-if="isVisible" 
			class="booking-booking-card__source"
			:class="'--' + source"
		>
			<Icon
				v-if="source === BookingSource.Crm"
				:name="Outline.CRM_FORM"
				:size="14"
				:color="'var(--ui-color-bg-content-primary)'"
			/>
		</div>
	`,
};
