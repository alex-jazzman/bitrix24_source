import { FeaturePromoter } from 'ui.info-helper';
import { RichLoc } from 'ui.vue3.components.rich-loc';

import { ExpandAnimation } from 'im.v2.component.animation';
import { TranscriptionStatus, FileType, SliderCode } from 'im.v2.const';
import { Parser } from 'im.v2.lib.parser';

import './transcription-text.css';

import type { ImModelMessage, ImModelTranscription } from 'im.v2.model';

const ErrorMessageByType = {
	[FileType.video]: 'IM_MESSAGE_FILE_AUDIO_TRANSCRIPTION_ERROR_VIDEO',
	[FileType.audio]: 'IM_MESSAGE_FILE_AUDIO_TRANSCRIPTION_ERROR',
};

const LIMIT_ERROR_CODE = 'LIMIT_IS_EXCEEDED_BAAS';

// @vue/component
export const TranscriptionText = {
	name: 'TranscriptionText',
	components: { ExpandAnimation, RichLoc },
	props: {
		file: {
			type: Object,
			required: true,
		},
		messageId: {
			type: [String, Number],
			required: true,
		},
		isOpened: {
			type: Boolean,
			required: true,
		},
	},
	computed: {
		transcription(): ?ImModelTranscription
		{
			return this.$store.getters['files/getTranscription'](this.file.id);
		},
		text(): string
		{
			return Parser.decode({ text: this.transcription.transcriptText });
		},
		isError(): boolean
		{
			return this.transcription && this.transcription.status === TranscriptionStatus.ERROR;
		},
		isLimitError(): boolean
		{
			return this.transcription && this.transcription.errorCode === LIMIT_ERROR_CODE;
		},
		errorText(): string
		{
			if (this.isLimitError)
			{
				return this.loc('IM_MESSAGE_FILE_TRANSCRIPTION_LIMIT_ERROR');
			}

			const code = ErrorMessageByType[this.file.type];

			return this.loc(code);
		},
		showDivider(): boolean
		{
			return this.isOpened && Boolean(this.message.text);
		},
		message(): ImModelMessage
		{
			return this.$store.getters['messages/getById'](this.messageId);
		},
	},
	methods: {
		loc(code: string): string
		{
			return this.$Bitrix.Loc.getMessage(code);
		},
		onLimitErrorLinkClick()
		{
			const promoter = new FeaturePromoter({ code: SliderCode.buyMarketPlus });
			promoter.show();
		},
	},
	template: `
		<div class="bx-im-transcription-text__container">
			<ExpandAnimation>
				<div
					v-if="isOpened"
					class="bx-im-transcription-text__content"
				>
					<div v-if="!isError" v-html="text"></div>
					<RichLoc
						v-else
						:text="errorText"
						class="--error"
						placeholder="[url]"
					>
						<template #url="{ text }">
							<span class="bx-im-transcription-text__error-link" @click="onLimitErrorLinkClick">
								{{ text }}
							</span>
						</template>
					</RichLoc>
				</div>
			</ExpandAnimation>
			<div v-if="showDivider" class="bx-im-transcription-text__divider"></div>
		</div>
	`,
};
