import { type PopupOptions } from 'main.popup';

import { MessengerPopup } from 'im.v2.component.elements.popup';
import { PopupType } from 'im.v2.const';

import '../css/task-card-promo.css';

const POPUP_CLASSNAME = 'bx-im-task-card-promo-popup__container --line-clamp-3 --ui-context-content-dark';

// @vue/component
export const TaskCardPromo = {
	name: 'TaskCardPromo',
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
				width: 460,
				padding: 0,
				overlay: false,
				offsetTop: 8,
				offsetLeft: 17,
				bindOptions: { position: 'bottom' },
				closeIcon: true,
				angle: { position: 'top' },
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
			:id="PopupType.taskSideCardPromo"
			@close="$emit('close')"
		>
			<div class="bx-im-task-card-promo-popup__image"></div>
			<div class="bx-im-task-card-promo-popup__info">
				<div class="bx-im-task-card-promo-popup__title">
					{{ loc('IM_CONTENT_TASK_SIDE_CARD_PROMO_TITLE') }}
				</div>
				<div class="bx-im-task-card-promo-popup__text">
					{{ loc('IM_CONTENT_TASK_SIDE_CARD_PROMO_TEXT') }}
				</div>
			</div>
		</MessengerPopup>
	`,
};
