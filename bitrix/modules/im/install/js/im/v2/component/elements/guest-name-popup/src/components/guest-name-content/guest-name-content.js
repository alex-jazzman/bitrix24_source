import { Type, type JsonObject } from 'main.core';
import { BInput, InputDesign } from 'ui.system.input.vue';
import { Button as UiButton, ButtonColor, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';
import { RichLoc } from 'ui.vue3.components.rich-loc';

import { ChatAvatar, AvatarSize } from 'im.v2.component.elements.avatar';
import { ChatTitle } from 'im.v2.component.elements.chat-title';
import { GuestManager } from 'im.v2.lib.guest';
import { type ImModelChat } from 'im.v2.model';

import './guest-name-content.css';

// @vue/component
export const GuestNameContent = {
	name: 'GuestNameContent',
	components: { UiButton, ChatAvatar, ChatTitle, BInput, RichLoc },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		isLoading: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['submit', 'close'],
	data(): JsonObject
	{
		return {
			name: '',
		};
	},
	computed: {
		ButtonColor: () => ButtonColor,
		ButtonSize: () => ButtonSize,
		AirButtonStyle: () => AirButtonStyle,
		AvatarSize: () => AvatarSize,
		InputDesign: () => InputDesign,
		chat(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isSubmitDisabled(): boolean
		{
			return !Type.isStringFilled(this.name) || this.isLoading;
		},
		termsOfServiceUrl(): string
		{
			return GuestManager.getInstance().getTermsOfServiceUrl();
		},
	},
	mounted()
	{
		// Temporary workaround until BInput's "active" prop is fixed
		void this.$nextTick(() => {
			const root = this.$refs.input?.$el;
			const nativeInput = root?.querySelector('input');
			nativeInput?.focus();
		});
	},
	methods: {
		onSubmit()
		{
			if (this.isSubmitDisabled)
			{
				return;
			}

			this.$emit('submit', this.name);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-guest-name-modal__container">
			<div class="bx-im-guest-name-modal__avatar-section">
				<ChatAvatar
					:avatarDialogId="dialogId"
					:size="AvatarSize.XXXL"
					:withTooltip="false"
				/>
			</div>
			<div class="bx-im-guest-name-modal__title">
				{{ loc('IM_ELEMENTS_GUEST_NAME_MODAL_TITLE') }}
			</div>
			<div class="bx-im-guest-name-modal__subtitle">
				<ChatTitle :dialogId="dialogId" />
			</div>
			<div class="bx-im-guest-name-modal__input-section">
				<BInput
					v-model.trim="name"
					ref="input"
					:design="InputDesign.LightGrey"
					:active="true"
					:placeholder="loc('IM_ELEMENTS_GUEST_NAME_MODAL_NAME_PLACEHOLDER')"
					@enter="onSubmit"
					@keydown.enter="onSubmit"
				/>
				<div class="bx-im-guest-name-modal__buttons">
					<UiButton
						:size="ButtonSize.LARGE"
						:color="ButtonColor.Primary"
						:disabled="isSubmitDisabled"
						:text="loc('IM_ELEMENTS_GUEST_NAME_MODAL_CONTINUE')"
						@click="onSubmit"
					/>
					<UiButton
						:size="ButtonSize.EXTRA_LARGE"
						:style="AirButtonStyle.PLAIN_ACCENT"
						:text="loc('IM_ELEMENTS_GUEST_NAME_MODAL_SKIP')"
						@click="$emit('close')"
					/>
				</div>
			</div>
			<div class="bx-im-guest-name-modal__terms-of-service">
				<RichLoc
					:text="loc('IM_ELEMENTS_GUEST_NAME_MODAL_TOS')"
					placeholder="[url]"
				>
					<template #url="{ text }">
						<a 
							:href="termsOfServiceUrl"
							class="bx-im-guest-name-modal__terms-of-service-link"
							target="_blank"
						>
							{{ text }}
						</a>
					</template>
				</RichLoc>
			</div>
		</div>
	`,
};
