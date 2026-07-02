import { Button as UiButton, ButtonSize, ButtonColor } from 'booking.component.button';

import { ChannelMenu } from '../../channel-menu/channel-menu';
import { ChooseTemplatePopup } from '../../choose-template-popup/choose-template-popup';
import { TemplateEmpty } from '../../template-empty/template-empty';
import { MessageTemplate } from './message-tempalte';

// @vue/component
export const MessageBlock = {
	name: 'MessageBlock',
	components: {
		UiButton,
		ChannelMenu,
		ChooseTemplatePopup,
		TemplateEmpty,
		MessageTemplate,
	},
	props: {
		messenger: {
			type: String,
			required: true,
		},
		messageTemplate: {
			type: String,
			required: true,
		},
		hasTemplate: {
			type: Boolean,
			required: true,
		},
		checked: {
			type: Boolean,
			required: true,
		},
		model: {
			type: Object,
			required: true,
		},
		currentTemplateType: {
			type: String,
			required: true,
		},
	},
	emits: ['updateChannel', 'templateTypeSelected'],
	setup(): Object
	{
		return {
			ButtonSize,
			ButtonColor,
		};
	},
	data(): Object
	{
		return {
			showTemplatePopup: false,
		};
	},
	methods: {
		getChooseTemplateButton(): HTMLElement | null
		{
			return this.$refs.chooseTemplateBtn || null;
		},
	},
	template: `
		<div class="resource-creation-wizard__form-notification-info --message">
			<div class="resource-creation-wizard__form-notification-info-text-row">
				{{ loc('BRCW_NOTIFICATION_CARD_MESSAGE_TEXT') }}
				<ChannelMenu
					:current-channel="messenger"
					@updateChannel="$emit('updateChannel', $event)"
				/>
			</div>
			<template v-if="hasTemplate">
				<MessageTemplate :text="messageTemplate"/>
				<div class="resource-creation-wizard__form-notification-info-template-choose-buttons">
					<div class="booking-resource-creation-wizard-choose-template-button" ref="chooseTemplateBtn">
						<UiButton
							:disabled="!checked"
							:text="loc('BRCW_NOTIFICATION_CARD_CHOOSE_TEMPLATE_TYPE')"
							:size="ButtonSize.EXTRA_SMALL"
							:color="ButtonColor.LIGHT_BORDER"
							:round
							@click="showTemplatePopup = true"
						/>
					</div>
				</div>
			</template>
			<TemplateEmpty v-else/>
			<ChooseTemplatePopup
				v-if="showTemplatePopup"
				:bindElement="$refs.chooseTemplateBtn"
				:model="model"
				:current-channel="messenger"
				:currentTemplateType="currentTemplateType"
				@templateTypeSelected="$emit('templateTypeSelected', $event)"
				@close="showTemplatePopup = false"
			/>
		</div>
	`,
};
