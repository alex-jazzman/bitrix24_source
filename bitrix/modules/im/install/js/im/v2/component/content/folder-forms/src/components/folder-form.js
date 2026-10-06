import { Type } from 'main.core';

import { TitleInput, ButtonPanel } from 'im.v2.component.content.chat-forms.elements';
import { FolderManager } from 'im.v2.lib.folder';

import { ChatSelector } from './chat-selector';

import '../css/folder-form.css';

// @vue/component
export const FolderForm = {
	name: 'FolderForm',
	components: { TitleInput, ChatSelector, ButtonPanel },
	props: {
		submitButtonTitle: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			default: '',
		},
		dialogIds: {
			type: Array,
			default: () => [],
		},
		isSubmitting: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:title', 'update:dialogIds', 'submit', 'cancel'],
	computed: {
		FOLDER_TITLE_MAX_LENGTH: () => FolderManager.getMaxTitleLength(),
		FOLDER_MAX_CHATS: () => FolderManager.getMaxChatsPerFolder(),
		isTitleFilled(): boolean
		{
			return Type.isStringFilled(this.title.trim());
		},
	},
	methods: {
		onTitleChange(title: string)
		{
			this.$emit('update:title', title);
		},
		onSelectionChange(dialogIds: string[])
		{
			this.$emit('update:dialogIds', dialogIds);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-content-folder-forms__container" data-testid="folder-form-container">
			<div class="bx-im-content-folder-forms__header">
				<div class="bx-im-content-folder-forms__icon"></div>
				<TitleInput
					:modelValue="title"
					:maxLength="FOLDER_TITLE_MAX_LENGTH"
					:placeholder="loc('IM_CREATE_FOLDER_TITLE_PLACEHOLDER')"
					data-testid="folder-form-title-input"
					@update:modelValue="onTitleChange"
				/>
			</div>
			<div class="bx-im-content-folder-forms__heading">
				{{ loc('IM_CREATE_FOLDER_HEADING_TITLE') }}
			</div>
			<div class="bx-im-content-folder-forms__members_container">
				<div class="bx-im-content-folder-forms__members_subtitle">
					{{ loc('IM_CREATE_FOLDER_MEMBERS_SUBTITLE') }}
				</div>
				<ChatSelector
					:chatLimit="FOLDER_MAX_CHATS"
					:selectedDialogIds="dialogIds"
					@selectionChange="onSelectionChange"
				/>
			</div>
		</div>
		<ButtonPanel
			:isCreating="isSubmitting"
			:createButtonDisabled="!isTitleFilled"
			:createButtonTitle="submitButtonTitle"
			data-testid="folder-form-button-panel"
			@create="$emit('submit')"
			@cancel="$emit('cancel')"
		/>
	`,
};
