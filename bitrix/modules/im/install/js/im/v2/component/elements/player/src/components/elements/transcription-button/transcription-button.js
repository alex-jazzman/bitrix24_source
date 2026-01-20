import { BIcon, Outline as OutlineIcons, SmallOutline as SmallOutlineIcons } from 'ui.icon-set.api.vue';
import 'ui.icon-set.small-outline'; // temp fix, does not work without direct import

import { Spinner, SpinnerSize, SpinnerColor } from 'im.v2.component.elements.loader';
import { Color, TranscriptionStatus } from 'im.v2.const';
import { MessageService } from 'im.v2.provider.service.message';
import { Analytics } from 'im.v2.lib.analytics';

import './transcription-button.css';

import type { ImModelTranscription } from 'im.v2.model';

// @vue/component
export const TranscriptionButton = {
	name: 'TranscriptionButton',
	components: { Spinner, BIcon },
	props: {
		file: {
			type: Object,
			required: true,
		},
		isOpened: {
			type: Boolean,
			required: true,
		},
		messageId: {
			type: [String, Number],
			required: true,
		},
		isOverlay: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['transcriptionToggle'],
	computed:
	{
		SpinnerSize: () => SpinnerSize,
		SpinnerColor: () => SpinnerColor,
		fileId(): boolean
		{
			return this.file.id;
		},
		chatId(): boolean
		{
			return this.file.chatId;
		},
		transcription(): ?ImModelTranscription
		{
			return this.$store.getters['files/getTranscription'](this.fileId);
		},
		status(): TranscriptionStatus | null
		{
			return this.transcription ? this.transcription.status : null;
		},
		isPending(): boolean
		{
			return this.status === TranscriptionStatus.PENDING;
		},
		isSuccess(): boolean
		{
			return this.status === TranscriptionStatus.SUCCESS;
		},
		buttonIcon(): string
		{
			if (this.isOpened)
			{
				return OutlineIcons.CHEVRON_TOP_M;
			}

			return this.isOverlay ? SmallOutlineIcons.TRANSCRIPTION : OutlineIcons.TRANSCRIPTION;
		},
		iconColor(): string
		{
			return this.isOverlay ? Color.white : Color.accentBlue;
		},
	},
	watch:
	{
		status(newStatus: TranscriptionStatus | null, oldStatus: TranscriptionStatus | null)
		{
			if (oldStatus === TranscriptionStatus.PENDING)
			{
				Analytics.getInstance().player.onViewTranscription(this.file.id, newStatus);
				this.open();
			}
		},
	},
	methods:
	{
		async onButtonClick(): Promise<void>
		{
			if (this.isPending)
			{
				return;
			}

			if (this.isOpened)
			{
				this.close();

				return;
			}

			if (this.isSuccess)
			{
				Analytics.getInstance().player.onViewTranscription(this.file.id, TranscriptionStatus.SUCCESS);
				this.open();

				return;
			}

			const result = await this.transcribe();
			if (result)
			{
				this.open();
			}
		},
		async transcribe(): Promise<void>
		{
			const messageService = new MessageService({ chatId: this.chatId });

			return messageService.transcribe(this.fileId, this.messageId);
		},
		open(): void
		{
			this.$emit('transcriptionToggle', true);
		},
		close(): void
		{
			this.$emit('transcriptionToggle', false);
		},
	},
	template: `
		<div class="bx-im-transcription-button__container">
			<button
				class="bx-im-transcription-button__button"
				:class="{'--overlay': isOverlay}"
				@click="onButtonClick"
			>
				<Spinner v-if="isPending" :size="SpinnerSize.XXS" :color="SpinnerColor.white" />
				<BIcon
					v-else
					:name="buttonIcon"
					:color="iconColor"
					:size="20"
				/>
			</button>
		</div>
	`,
};
