import { BIcon as Icon, Set as IconSet } from 'ui.icon-set.api.vue';
import 'ui.icon-set.crm';

import { Model } from 'booking.const';
import { limit } from 'booking.lib.limit';

import './crm-button.css';

// @vue/component
export const CrmButton = {
	name: 'CrmButton',
	components: {
		Icon,
	},
	inject: {
		/** @type{ AbstractCardDataService } */
		cardDataService: {},
	},
	setup(): Object
	{
		return {
			IconSet,
		};
	},
	computed: {
		isFeatureEnabled(): boolean
		{
			return this.$store.getters[`${Model.Interface}/isFeatureEnabled`];
		},
		dataAttributes(): Object
		{
			return this.cardDataService.buildDataAttributes('booking-booking-card-crm-button');
		},
		dealHelper(): DealHelper
		{
			return this.cardDataService.dealHelper;
		},
		hasDeal(): boolean
		{
			return this.dealHelper.hasDeal?.() ?? false;
		},
	},
	methods: {
		onClick(): void
		{
			if (!this.isFeatureEnabled)
			{
				void limit.show();

				return;
			}

			if (this.hasDeal)
			{
				this.dealHelper.openDeal?.();
			}
			else
			{
				this.dealHelper.createDeal?.();
			}
		},
	},
	template: `
		<Icon
			:name="IconSet.CRM_LETTERS"
			class="booking-booking-card__crm-button"
			:class="{'--no-deal': !hasDeal}"
			v-bind="dataAttributes"
			@click="onClick"
		/>
	`,
};
