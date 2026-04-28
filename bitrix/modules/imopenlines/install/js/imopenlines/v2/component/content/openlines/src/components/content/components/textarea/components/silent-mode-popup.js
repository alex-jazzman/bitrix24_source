import { MessengerPopup } from 'im.v2.component.elements.popup';

import './../css/silent-mode-popup.css';

import type { PopupOptions } from 'main.popup';

const POPUP_ID = 'imol-silent-mode-popup';
const POPUP_CLASSNAME = 'bx-imol-silent-mode-popup__container';

// @vue/component
export const SilentModePopup = {
	name: 'SilentModePopup',
	components: { MessengerPopup },
	props: {
		bindElement: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	computed: {
		POPUP_ID: () => POPUP_ID,
		popupConfig(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				className: POPUP_CLASSNAME,
				offsetTop: -5,
				width: 340,
				overlay: false,
				autoHide: true,
				bindOptions: { position: 'top' },
				angle: {
					offset: 35,
					position: 'bottom',
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
			:id="POPUP_ID"
			@close="$emit('close')"
		>
			<div class="bx-imol-silent-mode-popup__title">
				{{ loc('IMOL_CONTENT_TEXTAREA_HIDDEN_MODE_POPUP_TITLE') }}
			</div>
			<div class="bx-imol-silent-mode-popup__description">
				{{ loc('IMOL_CONTENT_TEXTAREA_HIDDEN_MODE_POPUP_DESCRIPTION') }}
			</div>
		</MessengerPopup>
	`,
};
