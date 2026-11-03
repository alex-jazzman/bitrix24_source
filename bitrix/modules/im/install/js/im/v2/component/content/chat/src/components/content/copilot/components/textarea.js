import { ChatTextarea } from 'im.v2.component.textarea';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { ReasoningButton } from './textarea-toolbar/components/reasoning-button';
import { ToolbarButtons } from './textarea-toolbar/toolbar-buttons';

// @vue/component
export const CopilotTextarea = {
	name: 'CopilotTextarea',
	components: { ChatTextarea, ToolbarButtons, ReasoningButton },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		isFileUploadEnabled: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		withDraft: {
			/** @type boolean | { draftDialogId: string } */
			type: [Boolean, Object],
			default: true,
		},
		// pass-through only: this wrapper serves both the messenger and the embeddable widget
		withKeyboardNavigation: {
			type: Boolean,
			default: false,
		},
		deferredDialogPromise: {
			type: Object,
			default: null,
		},
		allowBeforeSendOnUninitedTemp: {
			type: Boolean,
			default: false,
		},
		heightConfig: {
			/** @type {{ storageKey?: string, minHeight?: number }} */
			type: Object,
			default: undefined,
		},
	},
	computed: {
		isToolbarButtonsEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);
		},
		isTempChat(): boolean
		{
			return this.$store.getters['copilot/chats/isTempChat'](this.dialogId);
		},
		hasUploadMenu(): boolean
		{
			return this.isFileUploadEnabled;
		},
		hasWithMention(): boolean
		{
			return !this.isTempChat;
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<ChatTextarea
			:dialogId="dialogId"
			:placeholder="loc('IM_CONTENT_COPILOT_TEXTAREA_PLACEHOLDER')"
			:withMarket="false"
			:withEdit="false"
			:withUploadMenu="hasUploadMenu"
			:withMention="hasWithMention"
			:withSmileSelector="false"
			:disabled="disabled"
			:withDraft="withDraft"
			:withKeyboardNavigation="withKeyboardNavigation"
			:deferredDialogPromise="deferredDialogPromise"
			:allowBeforeSendOnUninitedTemp="allowBeforeSendOnUninitedTemp"
			:heightConfig="heightConfig"
		>
			<template #bottom-panel-buttons>
				<ToolbarButtons
					v-if="isToolbarButtonsEnabled"
					:dialogId="dialogId"
				/>
				<ReasoningButton
					v-else
					:dialogId="dialogId"
				/>
			</template>
		</ChatTextarea>
	`,
};
