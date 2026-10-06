import { mapGetters } from 'ui.vue3.vuex';
import { Model, Communication } from 'booking.const';

import { BIcon as Icon, Outline } from 'ui.icon-set.api.core';

import { UiResourceWizardItem } from 'booking.component.ui-resource-wizard-item';
import { IconBlock } from './icon-block';
import './style.css';

// @vue/component
export const MethodsCommunication = {
	name: 'MethodsCommunication',
	components: {
		UiResourceWizardItem,
		Icon,
		IconBlock,
	},
	props: {
		senders: {
			type: Array,
			required: true,
		},
	},
	setup(): { Outline: typeof Outline, Communication: typeof Communication }
	{
		return {
			Outline,
			Communication,
		};
	},
	computed: {
		...mapGetters({
			resource: `${Model.ResourceCreationWizard}/getResource`,
		}),
	},
	methods: {
		selectSender(code: string): void
		{
			void this.$store.dispatch(`${Model.ResourceCreationWizard}/updateResource`, { senderCode: code });
		},
		getTitle(code: string): string
		{
			return code === Communication.AiCall
				? this.loc('BRCW_METHODS_COMMUNICATION_AI_TITLE')
				: this.loc('BRCW_METHODS_COMMUNICATION_TEXT_CHANNEL_TITLE')
			;
		},
		getDescription(code: string): string
		{
			return code === Communication.AiCall
				? this.loc('BRCW_METHODS_COMMUNICATION_AI_DESCRIPTION')
				: this.loc('BRCW_METHODS_COMMUNICATION_TEXT_CHANNEL_DESCRIPTION')
			;
		},
	},
	template: `
		<UiResourceWizardItem
			:title="loc('BRCW_METHODS_COMMUNICATION_TITLE')"
			:iconType="Outline.SPEAKER"
			:description="loc('BRCW_METHODS_COMMUNICATION_DESCRIPTION')"
		>
			<div class="resource-notification-card-communication-box" >
				<div
					v-for="sender in senders"
					:key="sender.code"
					class="resource-notification-card-communication-item"
					:class="{ '--active': sender.code === resource.senderCode, '--ai-call': sender.code === Communication.AiCall }"
					:data-testid="'booking-resource-wizard-communication-item-' + sender.code"
					@click="selectSender(sender.code)"
				>
					<IconBlock
						:senderCode="sender.code"
						:isActive="sender.code === resource.senderCode"
					/>
					<div class="resource-notification-card-communication-item-content">
						<div class="resource-notification-card-communication-item-title">
							{{ getTitle(sender.code) }}
						</div>
						<div class="resource-notification-card-communication-item-description">
							{{ getDescription(sender.code) }}
						</div>
					</div>
				</div>
			</div>
		</UiResourceWizardItem>
	`,
};
