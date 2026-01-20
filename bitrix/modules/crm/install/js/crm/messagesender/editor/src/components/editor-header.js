import { Runtime, Type } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import { AirButtonStyle, Button as BButton } from 'ui.vue3.components.button';
import { mapGetters } from 'ui.vue3.vuex';
import { ChannelSelector } from './editor-header/channel-selector';
import { ReceiverSelector } from './editor-header/receiver-selector';
import { TemplateSelector } from './editor-header/template-selector';

// @vue/component
export const EditorHeader = {
	name: 'EditorHeader',
	components: {
		BButton,
		ChannelSelector,
		ReceiverSelector,
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
	},
	methods: {
		async openConnectionsSlider(): Promise<void>
		{
			const { Router } = await Runtime.loadExtension('crm.router');

			/** @see BX.Crm.Router.openMessageSenderConnectionsSlider */
			await Router.Instance.openMessageSenderConnectionsSlider(this.$store.state.analytics.analytics);

			this.$Bitrix.Data.get('locator').getAnalyticsService().onNoChannelsButtonClick();

			this.$Bitrix.eventEmitter.emit('crm:messagesender:editor:onConnectionsSliderClose');
		},
	},
	template: `
		<div class="crm-messagesender-editor__header">
			<div class="crm-messagesender-editor__header-left" data-role="header-left">
				<ChannelSelector v-if="hasChannels"/>
				<BButton
					v-else
					:style="AirButtonStyle.FILLED"
					:leftIcon="Outline.MESSAGES"
					:shimmer="true"
					:text="$Bitrix.Loc.getMessage('CRM_MESSAGESENDER_EDITOR_BUTTON_NO_CHANNELS')"
					@click="openConnectionsSlider"
				/>
				<ReceiverSelector v-if="hasChannels"/>
			</div>
			<div class="crm-messagesender-editor__header-right">
				<TemplateSelector v-if="isTemplatesSelectorShown"/>
			</div>
		</div>
	`,
};
