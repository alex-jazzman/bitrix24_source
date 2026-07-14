import { type PopupOptions } from 'main.popup';

import { MessengerPopup } from 'im.v2.component.elements.popup';
import { PopupType } from 'im.v2.const';

import '../css/create-chat-promo.css';

const POPUP_CLASSNAME = 'bx-im-collab-create-chat-promo-popup__container --line-clamp-3 --ui-context-content-dark';

// @vue/component
export const CreateChatPromo = {
	name: 'CreateChatPromo',
	components: { MessengerPopup },
	props: {
		bindElement: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	computed: {
		PopupType: () => PopupType,
		popupConfig(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				targetContainer: document.body,
				className: POPUP_CLASSNAME,
				width: 400,
				height: 121,
				padding: 0,
				overlay: false,
				offsetLeft: 58,
				offsetTop: -77,
				autoHide: true,
				bindOptions: { position: 'bottom' },
				closeIcon: true,
				angle: {
					offset: 45,
					position: 'left',
				},
				animation: 'fading',
			};
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<MessengerPopup
			:config="popupConfig"
			:id="PopupType.collabCreateChatPromo"
			@close="$emit('close')"
		>
			<div class="bx-im-collab-create-chat-promo-popup__cover"></div>
			<div class="bx-im-collab-create-chat-promo-popup__info">
				<div class="bx-im-collab-create-chat-promo-popup__title">
					{{ loc('IM_LIST_CONTAINER_COLLAB_CREATE_CHAT_PROMO_TITLE') }}
				</div>
			</div>
		</MessengerPopup>
	`,
};
