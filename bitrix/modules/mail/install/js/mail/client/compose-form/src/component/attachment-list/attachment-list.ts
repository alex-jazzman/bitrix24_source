import { defineComponent } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { AttachmentCard } from '../attachment-card/attachment-card';
import { AttachmentAnchorTestId, Phrase } from '../../const';
import { useComposeEditor } from '../../infrastructure/adapter/editor/editor';
import { type EditorAttachment, type EditorUnsubscribe } from '../../infrastructure/adapter/editor/types';
import { loc } from '../../lib/loc/loc';
import { useComposeState } from '../../model/compose/compose';

import './attachment-list.css';

const UnfoldControlTestId = 'mail-compose-attachments-show';

/**
 * A card per file of the Disk uploader control. The control owns the file set and its hidden fields, so
 * this list keeps no set of its own and writes no field: it reads the control through the editor adapter
 * and follows its events.
 */
// @vue/component
export const AttachmentList = defineComponent({
	name: 'MailComposeAttachmentList',

	components: {
		AttachmentCard,
		UiButton,
	},

	setup()
	{
		return {
			state: useComposeState(),
			editor: useComposeEditor(),
			// Own subscriptions only: the editor adapter is shared with the rest of the form and outlives it.
			subscriptions: [] as EditorUnsubscribe[],
			anchorTestId: AttachmentAnchorTestId,
			unfoldTestId: UnfoldControlTestId,
			unfoldStyle: AirButtonStyle.PLAIN,
			unfoldSize: ButtonSize.SMALL,
		};
	},

	data()
	{
		return {
			files: [] as EditorAttachment[],
			/**
			 * Files the letter was opened with — the ones the fold stands for. The carried-over set reaches
			 * the uploader control file by file, so a count is what tells them from a file of the user; it
			 * only ever shrinks, because a removed file takes its place in the fold with it.
			 */
			carriedFileCount: 0,
		};
	},

	computed: {
		/** A reply opens with the carried-over attachments folded; with no file there is nothing to fold. */
		isFolded(): boolean
		{
			return this.state.attachments.folded && this.files.length > 0;
		},

		unfoldText(): string
		{
			return loc(Phrase.AttachmentsShow);
		},

		/** The node stays rendered as the hint anchor, so its padding comes with the content. */
		isFilled(): boolean
		{
			return this.files.length > 0;
		},
	},

	mounted(): void
	{
		this.carriedFileCount = this.state.attachments.files.length;

		// The initial files land in the control on editor readiness, so the set is read then and on every
		// change afterwards.
		this.subscriptions.push(
			this.editor.subscribeReady(this.readFiles),
			this.editor.subscribeFileAdd(this.readFiles),
			this.editor.subscribeFileRemove(this.readRemainingFiles),
		);
	},

	beforeUnmount(): void
	{
		this.subscriptions.forEach((unsubscribe: EditorUnsubscribe): void => {
			unsubscribe();
		});
		this.subscriptions.length = 0;
	},

	methods: {
		readFiles(): void
		{
			this.files = this.editor.getFiles();

			// A file attached on top of the carried-over set has to be seen: the uploader opens whatever the
			// fold does, so a card left behind the control would be a file the user cannot find.
			if (this.files.length > this.carriedFileCount)
			{
				this.state.attachments.folded = false;
			}
		},

		/** The fold shrinks with the set it stands for, so a file attached in place of a removed one shows. */
		readRemainingFiles(): void
		{
			this.readFiles();
			this.carriedFileCount = Math.min(this.carriedFileCount, this.files.length);
		},

		handleUnfoldClick(): void
		{
			this.state.attachments.folded = false;
		},
	},

	template: `
		<div
			class="mail-compose-attachment-list"
			:class="{ '--filled': isFilled }"
			:data-testid="anchorTestId"
		>
			<UiButton
				v-if="isFolded"
				:text="unfoldText"
				:style="unfoldStyle"
				:size="unfoldSize"
				:rightCounterValue="files.length"
				:dataset="{ testid: unfoldTestId }"
				@click="handleUnfoldClick"
			/>
			<template v-else>
				<AttachmentCard
					v-for="(file, index) in files"
					:key="file.fileId"
					:file="file"
					:index="index"
				/>
			</template>
		</div>
	`,
});
