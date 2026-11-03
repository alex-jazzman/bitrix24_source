import { defineComponent, type PropType } from 'ui.vue3';

import { AttachmentsView, Phrase, TestId } from '../../const';
import { openMessage } from '../../feature/open-message/open-message';
import { type AttachmentsDecision, resolveAttachments } from '../../lib/attachments/attachments';
import { loc } from '../../lib/loc/loc';
import { type AttachmentIcon, type MessageRow } from '../../model/grid/types';
import { AttachmentChips } from '../attachment-chips/attachment-chips';

/**
 * The subject of a message and, under it, what the message carries. The paperclip shares the line
 * with the subject; the chips of the files keep a line of their own below it.
 */
// @vue/component
export const SubjectCell = defineComponent({
	name: 'MailMessageGridSubjectCell',

	components: {
		AttachmentChips,
	},

	props: {
		row: {
			type: Object as PropType<MessageRow>,
			required: true,
		},
		listImprovementsEnabled: {
			type: Boolean,
			required: true,
		},
	},

	setup()
	{
		return {
			subjectTestId: TestId.SubjectLink,
			attachIconTestId: TestId.AttachIcon,
		};
	},

	computed: {
		cellClass(): Record<string, boolean>
		{
			return {
				'mail-msg-list-subject-block': true,
				[`mail-msg-list-cell-${this.row.id}`]: true,
				'mail-msg-list-cell-old': this.row.isOld,
				'mail-msg-list-cell-unseen': this.row.unseen,
			};
		},

		attachments(): AttachmentsDecision
		{
			return resolveAttachments({
				count: this.row.attachments === null ? null : this.row.attachments.count,
				iconCount: this.row.attachments?.icons.length ?? 0,
				hasAttachments: this.row.hasAttachments,
				listImprovementsEnabled: this.listImprovementsEnabled,
			});
		},

		hasPaperclip(): boolean
		{
			return this.attachments.kind === AttachmentsView.Paperclip;
		},

		hasChips(): boolean
		{
			return this.attachments.kind === AttachmentsView.Chips;
		},

		isSummaryLoading(): boolean
		{
			return this.attachments.kind === AttachmentsView.Loading;
		},

		icons(): AttachmentIcon[]
		{
			return this.row.attachments?.icons ?? [];
		},

		totalCount(): number
		{
			return this.row.attachments?.count ?? 0;
		},

		attachHint(): string
		{
			return loc(Phrase.AttachIconHint);
		},
	},

	methods: {
		handleOpen(): void
		{
			openMessage(this.row.messageId, this.row.href);
		},
	},

	template: `
		<div :class="cellClass">
			<a
				v-if="!hasPaperclip"
				class="mail-msg-list-subject"
				:data-testid="subjectTestId"
				:title="row.subject"
				@click="handleOpen"
			>{{ row.subject }}</a>
			<span v-else class="mail-msg-list-subject-line mail-msg-list-cell-flex">
				<a
					class="mail-msg-list-subject"
					:data-testid="subjectTestId"
					:title="row.subject"
					@click="handleOpen"
				>{{ row.subject }}</a>
				<span
					class="mail-msg-list-attach-icon"
					role="img"
					:data-testid="attachIconTestId"
					:title="attachHint"
				></span>
			</span>
			<AttachmentChips
				v-if="hasChips || isSummaryLoading"
				:messageId="row.messageId"
				:icons="icons"
				:restCount="attachments.restCount"
				:totalCount="totalCount"
				:loading="isSummaryLoading"
			/>
		</div>
	`,
});
