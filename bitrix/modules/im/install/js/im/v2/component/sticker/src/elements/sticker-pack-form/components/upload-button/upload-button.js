import { Loc } from 'main.core';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { RichLoc } from 'ui.vue3.components.rich-loc';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';

import { openHelpdeskArticle } from 'im.v2.lib.helpdesk';

import './upload-button.css';

// @vue/component
export const UploadButton = {
	name: 'UploadButton',
	components: { UiButton, RichLoc },
	inject: ['uploader'],
	computed: {
		ButtonSize: () => ButtonSize,
		AirButtonStyle: () => AirButtonStyle,
		OutlineIcons: () => OutlineIcons,
		description(): string
		{
			return Loc.getMessage('IM_STICKER_PACK_FORM_DESCRIPTION');
		},
	},
	mounted()
	{
		this.uploader.assignBrowse(this.$refs.upload);
	},
	methods: {
		onHelpdeskLinkClick()
		{
			openHelpdeskArticle('26987270');
		},
		loc(phraseCode: string): string
		{
			return Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-sticker-pack-form-upload-button__container">
			<div class="bx-im-sticker-pack-form-upload-button__button" ref="upload">
				<UiButton
					:size="ButtonSize.MEDIUM"
					:leftIcon="OutlineIcons.PLUS_L"
					:text="loc('IM_STICKER_PACK_FORM_ADD_FILES_BUTTON')"
				/>
			</div>
			<div class="bx-im-sticker-pack-form-upload-button__description">
				<RichLoc
					:text="description"
					placeholder="[url]"
				>
					<template #url="{ text }">
						<span 
							class="bx-im-sticker-pack-form-upload-button__description-link" 
							@click="onHelpdeskLinkClick"
						>
							{{ text }}
						</span>
					</template>
				</RichLoc>
			</div>
		</div>
	`,
};
