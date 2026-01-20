import { BIcon as Icon } from 'ui.icon-set.api.vue';

import { HelpDesk } from 'booking.const';
import { EmptyRichLoc, HelpDeskLoc } from 'booking.component.help-desk-loc';

import './ui-resource-wizard-item.css';

// @vue/component
export const UiResourceWizardItem = {
	name: 'UiResourceWizardItem',
	components: {
		Icon,
		EmptyRichLoc,
		HelpDeskLoc,
	},
	props: {
		title: {
			type: String,
			required: true,
		},
		iconType: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: null,
		},
		helpDeskType: {
			type: String,
			default: null,
		},
	},
	computed: {
		code(): string
		{
			return HelpDesk[`Resource${this.helpDeskType}`].code;
		},
		anchorCode(): string
		{
			return HelpDesk[`Resource${this.helpDeskType}`].anchorCode;
		},
	},
	template: `
		<div class="booking-resource-wizard-item">
			<div class="booking-resource-wizard-item__row-title">
				<Icon
					:name="iconType"
					:color="'var(--ui-color-primary)'"
					:size="24"
				/>
				<div class="booking-resource-wizard-item__title">
					{{ title }}
				</div>
			</div>
			<div
				v-if="description"
				class="booking-resource-wizard-item__row-description"
			>
				<HelpDeskLoc
					v-if="helpDeskType"
					:message="description"
					:code="code"
					:anchor="anchorCode"
					:rules="['br']"
					class="booking-resource-wizard-item__help-desk"
				/>
				<div
					v-else
					class="booking-resource-wizard-item__description"
				>
					<EmptyRichLoc
						:message="description"
						:rules="['br']"
					/>
				</div>
			</div>
			<slot />
		</div>
	`,
};
