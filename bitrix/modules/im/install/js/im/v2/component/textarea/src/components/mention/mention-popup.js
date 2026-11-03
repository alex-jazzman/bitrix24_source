import { type PopupOptions } from 'main.popup';
import { type EventEmitter } from 'main.core.events';

import { MessengerPopup } from 'im.v2.component.elements.popup';
import { ChatType, EventType, TextareaTarget } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
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
		withCopilot: {
			type: Boolean,
			default: true,
		},
		targetContainer: {
			type: Object,
			default: null,
		},
		target: {
			type: String,
			default: TextareaTarget.main,
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
			if (this.isCopilotType && !FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available))
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
			const config: PopupOptions = {
				height: 200,
				width: 426,
				padding: 0,
				bindElement: this.bindElement,
				offsetTop: 2,
				offsetLeft: 0,
				fixed: !this.targetContainer || this.targetContainer === document.body,
				bindOptions: {
					position: 'top',
				},
				className: 'bx-im-mention-popup__scope',
				// the list is opened from the message field and typing goes on in it, so the trap only
				// remembers the field and gives the focus back when the popup closes: it takes no initial
				// focus and does not loop Tab inside the popup
				focusTrap: {
					initialFocus: false,
					looped: false,
				},
			};

			if (this.targetContainer)
			{
				config.targetContainer = this.targetContainer;
			}

			return config;
		},
	},
	created()
	{
		this.getEmitter().subscribe(EventType.mention.onNestedMenuClosed, this.onFocusTextarea);
	},
	mounted()
	{
		// the owner swallows the keys while it counts the popup as open,
		// so a popup that renders nothing has to report itself closed
		if (!this.needToShowMentionPopup)
		{
			this.$emit('close');
		}
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
				:withCopilot="withCopilot"
				:target="target"
				@close="$emit('close');"
				@adjustPosition="adjustPosition()"
				@focusTextarea="onFocusTextarea"
			/>
		</MessengerPopup>
	`,
};
