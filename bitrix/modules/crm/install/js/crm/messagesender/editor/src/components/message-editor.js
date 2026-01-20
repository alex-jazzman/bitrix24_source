import { mapGetters, mapState } from 'ui.vue3.vuex';
import { type Layout } from '../editor';
import { CustomMessageContent } from './content/custom-message-content';
import { ContentContainer } from './content/layout/content-container';
import { NotificationMessageContent } from './content/notification-message-content';
import { TemplateMessageContent } from './content/template-message-content';
import { EditorAlert } from './editor-alert';
import { EditorFooter } from './editor-footer';
import { EditorHeader } from './editor-header';

// @vue/component
export const MessageEditor = {
	name: 'MessageEditor',
	components: {
		EditorHeader,
		ContentContainer,
		CustomMessageContent,
		TemplateMessageContent,
		NotificationMessageContent,
		EditorFooter,
		EditorAlert,
	},
	computed: {
		...mapGetters({
			/** @type Channel */
			currentChannel: 'channels/current',
		}),
		...mapState({
			/** @type Layout */
			layout: (state) => state.application.layout,
		}),
		contentComponent(): string
		{
			if (this.currentChannel?.backend.senderCode === 'bitrix24')
			{
				return 'NotificationMessageContent';
			}

			if (this.currentChannel?.isTemplatesBased)
			{
				return 'TemplateMessageContent';
			}

			return 'CustomMessageContent';
		},
		paddingStyle(): Object
		{
			return {
				paddingTop: this.layout.paddingTop ?? this.layout.padding,
				paddingBottom: this.layout.paddingBottom ?? this.layout.padding,
				paddingLeft: this.layout.paddingLeft ?? this.layout.padding,
				paddingRight: this.layout.paddingRight ?? this.layout.padding,
			};
		},
	},
	template: `
		<div class="crm-messagesender-editor" data-test-role="crm-messagesender-editor" :style="paddingStyle">
			<EditorHeader v-if="layout.isHeaderShown"/>
			<ContentContainer>
				<component :is="contentComponent"/>
			</ContentContainer>
			<EditorFooter v-if="layout.isFooterShown"/>
			<EditorAlert/>
		</div>
	`,
};
