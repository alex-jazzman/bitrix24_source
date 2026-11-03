import { type PopupOptions } from 'main.popup';
import { ref, type Ref } from 'ui.vue3';

import { MessengerPopup } from 'im.v2.component.elements.popup';

import { ForwardContent } from './forward-content';

const POPUP_ID = 'im-forward-popup';
const AFTER_SHOW_EVENT = 'onAfterShow';

// @vue/component
export const ForwardPopup = {
	name: 'ForwardPopup',
	components: { MessengerPopup, ForwardContent },
	provide(): { isForwardContentVisible: Ref<boolean> }
	{
		// provide() runs before created(), so the signal is born here and kept on the instance.
		this.contentVisibleRef = ref(false);

		return { isForwardContentVisible: this.contentVisibleRef };
	},
	props:
	{
		messagesIds: {
			type: Array,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		directForward: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['close'],
	computed:
	{
		POPUP_ID: () => POPUP_ID,
		config(): PopupOptions
		{
			return {
				titleBar: this.popupTitle,
				closeIcon: true,
				targetContainer: document.body,
				fixed: true,
				draggable: true,
				padding: 0,
				autoHide: false,
				contentPadding: 0,
				contentBackground: '#fff',
				overlay: true,
				className: 'bx-im-entity-selector-forward__scope',
				// Popup.shouldUseFocusTrapByDefault() answers false while the opener focus sits in a text
				// input - the usual way of forwarding - so the trap is asked for explicitly. No restore
				// target: an explicit one would disable the trap's own "keep the live outside focus" path.
				focusTrap: { looped: true },
			};
		},
		popupTitle(): string
		{
			return this.messagesIds.length > 1
				? this.loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_FORWARD_TITLE_SEVERAL_MESSAGES')
				: this.loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_FORWARD_TITLE');
		},
	},
	created()
	{
		this.popupInstance = null;
	},
	mounted()
	{
		this.popupInstance = this.$refs.popup.getPopupInstance();
		this.popupInstance.subscribe(AFTER_SHOW_EVENT, this.onPopupAfterShow);
	},
	beforeUnmount()
	{
		// Cached instance only: MessengerPopup nulls its own on close, so getPopupInstance() here would
		// construct a second Popup and leave it hanging in PopupManager after every close.
		this.popupInstance?.unsubscribe(AFTER_SHOW_EVENT, this.onPopupAfterShow);
		this.popupInstance = null;
	},
	methods:
	{
		onPopupAfterShow()
		{
			this.contentVisibleRef.value = true;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<MessengerPopup
			ref="popup"
			:id="POPUP_ID"
			:config="config"
			@close="$emit('close')"
		>
			<ForwardContent
				:dialogId="dialogId"
				:messagesIds="messagesIds"
				:directForward="directForward"
				@close="$emit('close')"
			/>
		</MessengerPopup>
	`,
};
