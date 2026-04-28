import { type PopupOptions } from 'main.popup';
import { type EventEmitter } from 'main.core.events';

import { MessengerPopup } from 'im.v2.component.elements.popup';
import { ChatType, EventType } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { type ImModelChat } from 'im.v2.model';

import { MentionPopupContent } from './mention-content';

import './css/mention-popup.css';

const POPUP_ID = 'im-mention-popup';

// @vue/component
export const MentionPopup = {
	name: 'MentionPopup',
	components: { MessengerPopup, MentionPopupContent },
	props:
	{
		bindElement: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		query: {
			type: String,
			default: '',
		},
	},
	emits: ['close', 'onFocusTextarea'],
	computed:
	{
		POPUP_ID: () => POPUP_ID,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isCopilotType(): boolean
		{
			return this.dialog.type === ChatType.copilot;
		},
		isGroupCopilotChat(): boolean
		{
			return (new CopilotManager()).isGroupCopilotChat(this.dialogId);
		},
		needToShowMentionPopup(): boolean
		{
			if (this.isCopilotType)
			{
				return this.isGroupCopilotChat;
			}

			return true;
		},
		searchChats(): boolean
		{
			return !this.isCopilotType;
		},
		config(): PopupOptions
		{
			return {
				height: 200,
				width: 426,
				padding: 0,
				bindElement: this.bindElement,
				offsetTop: 2,
				offsetLeft: 0,
				fixed: true,
				bindOptions: {
					position: 'top',
				},
				className: 'bx-im-mention-popup__scope',
			};
		},
	},
	created()
	{
		this.getEmitter().subscribe(EventType.mention.onNestedMenuClosed, this.onFocusTextarea);
	},
	beforeUnmount()
	{
		this.getEmitter().unsubscribe(EventType.mention.onNestedMenuClosed, this.onFocusTextarea);
	},
	methods: {
		onFocusTextarea()
		{
			this.$emit('onFocusTextarea');
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<MessengerPopup
			v-if="needToShowMentionPopup"
			:config="config"
			@close="$emit('close');"
			:id="POPUP_ID"
			v-slot="{adjustPosition}"
		>
			<MentionPopupContent 
				:dialogId="dialogId"
				:query="query"
				:searchChats="searchChats"
				@close="$emit('close');"
				@adjustPosition="adjustPosition()"
			/>
		</MessengerPopup>
	`,
};
