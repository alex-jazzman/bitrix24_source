import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Button as UiButton, ButtonColor, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';

import { Core } from 'im.v2.application.core';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { openHelpdeskArticle } from 'im.v2.lib.helpdesk';
import { ScrollWithGradient } from 'im.v2.component.elements.scroll-with-gradient';

import { InviteLanguageSelector } from '../invite-language-selector/invite-language-selector';

import './css/add-guest-content.css';

const HELPDESK_SLIDER_CLOSE_EVENT = 'SidePanel.Slider:onClose';
const HELPDESK_SLIDER_ID = 'main:helper';

// @vue/component
export const AddGuestContent = {
	name: 'AddGuestsTab',
	components: { UiButton, ScrollWithGradient, InviteLanguageSelector },
	inject: ['enableAutoHide', 'disableAutoHide'],
	props: {
		chatId: {
			type: Number,
			required: true,
		},
		articleCode: {
			type: String,
			required: true,
		},
		guestTitle: {
			type: String,
			required: true,
		},
		guestDescription: {
			type: String,
			required: true,
		},
		isHideLangSelector: {
			type: Boolean,
			default: false,
		},
		isAddButtonDisabled: {
			type: Boolean,
			default: true,
		},
		isInvitingGuests: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'close',
		'addGuest',
		'inviteLanguageSelected',
	],
	computed: {
		ButtonSize: () => ButtonSize,
		ButtonColor: () => ButtonColor,
		ButtonStyle: () => AirButtonStyle,
		defaultLanguageCode(): string
		{
			return Core.getLanguageId();
		},
		isPhoneInviteAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.inviteByPhoneAvailable);
		},
		preparedInvitationTitle(): string
		{
			if (this.isPhoneInviteAvailable)
			{
				return Loc.getMessage('IM_ENTITY_SELECTOR_ADD_GUEST_INVITE_BY_PHONE_OR_EMAIL');
			}

			return Loc.getMessage('IM_ENTITY_SELECTOR_ADD_GUEST_INVITE_BY_EMAIL');
		},
		isChangeInviteLanguageAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.changeInviteLanguageAvailable) && !this.isHideLangSelector;
		},
	},
	created()
	{
		EventEmitter.subscribe(HELPDESK_SLIDER_CLOSE_EVENT, this.onCloseOpenHelpdeskSlider);
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(HELPDESK_SLIDER_CLOSE_EVENT, this.onCloseOpenHelpdeskSlider);
	},
	methods: {
		openHelpdesk()
		{
			this.disableAutoHide();
			openHelpdeskArticle(this.articleCode);
		},
		onCloseOpenHelpdeskSlider({ data })
		{
			const [event] = data;

			const sliderId = event.getSlider().getUrl().toString();
			if (sliderId === HELPDESK_SLIDER_ID)
			{
				this.enableAutoHide();
			}
		},
		loc(phraseCode: string): string
		{
			return Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-add-guest-content__container">
			<div class="bx-im-add-guest-content__invite-section">
				<ScrollWithGradient :gradientHeight="28" :withShadow="true">
					<div class="bx-im-add-guest-content__content">
						<div class="bx-im-add-guest-content__description">
							<div class="bx-im-add-guest-content__description_content">
								<div class="bx-im-add-guest-content__description_title">
									{{ guestTitle }}
								</div>
								<div class="bx-im-add-guest-content__description_text">
									{{ guestDescription }}
								</div>
								<a class="bx-im-add-guest-content__helpdesk-link" @click.prevent="openHelpdesk"> 
									{{ loc('IM_ENTITY_SELECTOR_ADD_GUEST_HELPDESK_LINK') }}
								</a>
							</div>
							<div class="bx-im-add-guest-content__description_icon"></div>
						</div>
						<InviteLanguageSelector
							v-if="isChangeInviteLanguageAvailable"
							:defaultLanguageCode="defaultLanguageCode"
							@selectLanguage="$emit('inviteLanguageSelected', $event)"
						/>
						<div class="bx-im-add-guest-content__actions">
							<slot name="copy-link"/>
							<div class="bx-im-add-guest-content__invite-block">
								<span class="bx-im-add-guest-content__invite-block-title --ellipsis">
									{{ preparedInvitationTitle }}
								</span>
								<slot name="invitation-input"/>
							</div>
						</div>
					</div>
				</ScrollWithGradient>
			</div>
			<div class="bx-im-add-guest-content__buttons">
				<UiButton
					:size="ButtonSize.LARGE"
					:loading="isInvitingGuests"
					:disabled="isAddButtonDisabled || isInvitingGuests"
					:text="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_INVITE_BUTTON')"
					@click="$emit('addGuest')"
				/>
				<UiButton
					:size="ButtonSize.LARGE"
					:loading="isInvitingGuests"
					:style="ButtonStyle.PLAIN"
					:text="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_CANCEL_BUTTON')"
					@click="$emit('close')"
				/>
			</div>
		</div>
	`,
};
