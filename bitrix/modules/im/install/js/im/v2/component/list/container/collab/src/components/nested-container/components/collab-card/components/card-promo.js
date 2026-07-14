import { type PopupOptions } from 'main.popup';

import { MessengerPopup } from 'im.v2.component.elements.popup';
import { PopupType } from 'im.v2.const';

import '../css/card-promo.css';

const POPUP_CLASSNAME = 'bx-im-collab-card-promo-popup__container --line-clamp-3 --ui-context-content-dark';

// @vue/component
export const CardPromo = {
	name: 'CardPromo',
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
				offsetLeft: this.bindElement.offsetWidth + 15,
				offsetTop: -129,
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
		title(): string
		{
			return this.loc('IM_LIST_CONTAINER_COLLAB_CARD_PROMO_TITLE', {
				'#BR#': '\n',
			});
		},
	},
	methods: {
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<MessengerPopup
			:config="popupConfig"
			:id="PopupType.collabCardPromo"
			@close="$emit('close')"
		>
			<div class="bx-im-collab-card-promo-popup__cover"></div>
			<div class="bx-im-collab-card-promo-popup__info">
				<div class="bx-im-collab-card-promo-popup__title">
					{{ title }}
				</div>
			</div>
		</MessengerPopup>
	`,
};
