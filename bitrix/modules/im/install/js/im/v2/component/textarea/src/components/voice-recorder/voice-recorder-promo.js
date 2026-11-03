import { PopupManager, type PopupOptions } from 'main.popup';
import { LiveAnnouncer } from 'ui.a11y';
import { TextMd, TextSm } from 'ui.system.typography.vue';

import { MessengerPopup } from 'im.v2.component.elements.popup';
import { PromoId } from 'im.v2.const';
import { PromoManager } from 'im.v2.lib.promo';

import './css/voice-recorder-promo.css';

const POPUP_ID = 'im-voice-recorder-promo';
const POPUP_WIDTH = 320;
// the distance from the left edge of the arrow box to the tip of the arrow inside it
const ARROW_TIP_OFFSET = 17;

// @vue/component
export const VoiceRecorderPromo = {
	name: 'VoiceRecorderPromo',
	components: { MessengerPopup, TextMd, TextSm },
	props:
	{
		bindElement: {
			/** @type HTMLElement */
			type: Object,
			required: true,
		},
	},
	data(): Object
	{
		return {
			// who gets the promo is counted on the server; the client only asks whether this user is among them
			isVisible: PromoManager.getInstance().needToShow(PromoId.voiceMessageRecording),
		};
	},
	computed:
	{
		POPUP_ID: () => POPUP_ID,
		popupConfig(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				bindOptions: { position: 'top' },
				className: 'bx-im-voice-recorder-promo-popup',
				width: POPUP_WIDTH,
				padding: 0,
				background: 'var(--ui-color-accent-soft-element-blue)',
				designSystemContext: '--ui-context-content-dark',
				angle: true,
				closeIcon: { top: '6px', right: '6px' },
				overlay: false,
				ariaLabel: this.loc('IM_TEXTAREA_VOICE_RECORDER_PROMO_TITLE'),
				// a hint nobody asked for must neither take focus nor trap it
				focusTrap: false,
			};
		},
	},
	mounted()
	{
		if (!this.isVisible)
		{
			return;
		}

		this.pointArrowAtButton();
		// the promo takes no focus, so a screen reader would pass it over: it is announced once instead
		LiveAnnouncer.announce(this.loc('IM_TEXTAREA_VOICE_RECORDER_PROMO_ANNOUNCE'));
		// the showing itself spends the promo: nothing that closes the popup brings it back
		void PromoManager.getInstance().markAsWatched(PromoId.voiceMessageRecording);
	},
	methods:
	{
		// the popup keeps its arrow near its own left edge, and a popup wider than the place left of
		// the button gets moved away from it: the arrow is put back over the button it belongs to
		pointArrowAtButton()
		{
			const popup = PopupManager.getPopupById(POPUP_ID);
			if (!popup)
			{
				return;
			}

			const buttonRect = this.bindElement.getBoundingClientRect();
			const popupRect = popup.getPopupContainer().getBoundingClientRect();

			popup.setAngle({
				offset: Math.round(buttonRect.left + (buttonRect.width / 2) - popupRect.left - ARROW_TIP_OFFSET),
			});
		},
		close()
		{
			this.isVisible = false;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<MessengerPopup
			v-if="isVisible"
			:id="POPUP_ID"
			:config="popupConfig"
			@close="close"
		>
			<div class="bx-im-voice-recorder-promo" data-testid="im-textarea-voice-recorder-promo">
				<TextMd accent tag="div">{{ loc('IM_TEXTAREA_VOICE_RECORDER_PROMO_TITLE') }}</TextMd>
				<TextSm
					tag="div"
					class="bx-im-voice-recorder-promo__text"
				>{{ loc('IM_TEXTAREA_VOICE_RECORDER_PROMO_TEXT') }}</TextSm>
			</div>
		</MessengerPopup>
	`,
};
