import { Loc, Dom } from 'main.core';
import { defineComponent, type PropType } from 'ui.vue3';

import { CallPopupContainer } from 'call.legacy.component.elements';
import { CallAI } from 'call.core';

export const CallButtonPromo = defineComponent({
	name: 'CallButtonPromo',
	components: { CallPopupContainer },
	props: {
		bindElement: {
			type: Object as PropType<HTMLElement>,
			required: true,
		},
	},
	emits: ['close'],
	data()
	{
		return {
			isAIConsentAccepted: CallAI.agreementAccepted,
		};
	},
	computed: {
		getId()
		{
			return 'call-ai-user-list-popup';
		},
		config()
		{
			return {
				width: 380,
				padding: 0,
				overlay: false,
				autoHide: false,
				closeByEsc: false,
				angle: {
					offset: Dom.getPosition(this.bindElement).width / 2,
					position: 'top',
				},
				closeIcon: true,
				bindElement: this.bindElement,
				offsetTop: 28,
			};
		},
		callButtonPromoText(): string
		{
			return this.isAIConsentAccepted
				? this.loc('CALL_CHAT_HEADER_BUTTON_PROMO_TEXT_MSGVER_1')
				: this.loc('CALL_CHAT_HEADER_BUTTON_PROMO_TEXT_WITHOUT_TOS_MSGVER_1')
			;
		},
	},
	methods: {
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return Loc.getMessage(phraseCode, replacements) ?? '';
		},
	},
	template: `
		<CallPopupContainer
			:config="config"
			@close="$emit('close')"
			:id="getId"
		>
			<div class='bx-call-chat-header-call-button__promo-container'>
				<div class='bx-call-chat-header-call-button__promo-title'>
					{{ loc('CALL_CHAT_HEADER_BUTTON_PROMO_TITLE_MSGVER_1') }}
				</div>
				<div class='bx-call-chat-header-call-button__promo-text'>
					{{ callButtonPromoText }}
				</div>
			</div>
		</CallPopupContainer>
	`,
});
