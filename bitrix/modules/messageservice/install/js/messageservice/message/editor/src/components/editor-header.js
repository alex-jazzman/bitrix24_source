import { Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Outline } from 'ui.icon-set.api.vue';
import { AirButtonStyle, Button as BButton } from 'ui.vue3.components.button';
import { mapGetters, mapState } from 'ui.vue3.vuex';
import { openContactCenter } from '../utils';
import { ChannelSelector } from './editor-header/channel-selector';
import { NotificationTemplateSelector } from './editor-header/notification-template-selector';
import { TemplateSelector } from './editor-header/template-selector';
import { ToSelector } from './editor-header/to-selector';

// @vue/component
export const EditorHeader = {
	name: 'EditorHeader',
	components: {
		BButton,
		ChannelSelector,
		NotificationTemplateSelector,
		ToSelector,
		TemplateSelector,
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			Outline,
		};
	},
	computed: {
		...mapGetters({
			/** @type Channel */
			currentChannel: 'channels/current',
			hasMultipleNotificationTemplates: 'notificationTemplates/hasMultiple',
		}),
		...mapState({
			/** @type {Layout} */
			layout: (state) => state.application.layout,
		}),
		hasChannels(): boolean
		{
			return !Type.isNil(this.currentChannel);
		},
		isTemplatesSelectorShown(): boolean
		{
			// todo templates for custom text
			return Boolean(this.currentChannel?.isTemplatesBased);
		},
		isNotificationTemplateSelectorShown(): boolean
		{
			return this.currentChannel?.backend.senderCode === 'bitrix24'
				&& this.hasMultipleNotificationTemplates;
		},
	},
	methods: {
		openConnectionsSlider(): void
		{
			this.$Bitrix.Data.get('locator').getAnalyticsService().onNoChannelsButtonClick();

			const event = new BaseEvent();
			this.$Bitrix.Data.get('locator').getEventEmitter().emit('onBeforeAddChannelOpen', event);
			if (event.isDefaultPrevented())
			{
				return;
			}

			void openContactCenter().then(() => {
				this.$Bitrix.Data.get('locator').getEventEmitter().emit('onAfterAddChannelClose');
			});
		},
	},
	template: `
		<div class="messageservice-message-editor__header">
			<div class="messageservice-message-editor__header-left" data-role="header-left">
				<template v-if="layout.isChannelSelectorShown">
					<ChannelSelector v-if="hasChannels"/>
					<BButton
						v-else
						:style="AirButtonStyle.FILLED"
						:leftIcon="Outline.MESSAGES"
						:shimmer="true"
						:text="$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_BUTTON_NO_CHANNELS')"
						@click="openConnectionsSlider"
					/>
				</template>
				<ToSelector v-if="hasChannels && layout.isToSelectorShown"/>
			</div>
			<div class="messageservice-message-editor__header-right">
				<TemplateSelector v-if="isTemplatesSelectorShown"/>
				<NotificationTemplateSelector v-if="isNotificationTemplateSelectorShown"/>
			</div>
		</div>
	`,
};
