import { defineComponent, type PropType } from 'ui.vue3';

import { DataRole, Phrase, TestId } from '../../const';
import { openThroughViewer, prefetchViewer } from '../../feature/attachment-viewer/attachment-viewer';
import { AttachmentsPopup } from '../../feature/attachments-popup/attachments-popup';
import { prepareViewerAttributes } from '../../lib/attachments/attachments';
import { loc, locPlural } from '../../lib/loc/loc';
import { type AttachmentIcon } from '../../model/grid/types';

// The side panel opens any same-origin link of the page in a slider of its own, the address of an
// attachment included: a file belongs to the viewer and to the download, not to a slider.
const SliderIgnoreAttribute = 'data-slider-ignore-autobinding';

/**
 * One file of the row with everything the markup asks of it already answered. Built once per page
 * rather than once per redraw: a row is redrawn whenever it is selected or read.
 */
type PreparedChip = {
	file: AttachmentIcon,
	/** A file no longer downloadable keeps its chip and loses its link, so the tag changes with it. */
	tag: string,
	/** The icon of the type is drawn by the icon set of the disk, by the name the server resolved. */
	typeIconClass: string,
	attributes: Record<string, string>,
	/** `null` for a file with nothing to download, which is the same file that has no link. */
	download: Record<string, string> | null,
	downloadLabel: string,
};

/**
 * The files of a message in the cell of the subject: up to two named chips and, when the message
 * carries more, a chip that counts the rest and opens the window of them all.
 *
 * The whole row of chips listens once rather than chip by chip: the chips are replaced with every
 * page of the list, and the intent that matters belongs to the row of them.
 */
// @vue/component
export const AttachmentChips = defineComponent({
	name: 'MailMessageGridAttachmentChips',

	props: {
		messageId: {
			type: Number,
			required: true,
		},
		/** Up to two files the summary named; empty while the summary is still on its way. */
		icons: {
			type: Array as PropType<AttachmentIcon[]>,
			default: () => [],
		},
		/** How many files the "+N" chip stands for; zero when every file has a chip of its own. */
		restCount: {
			type: Number,
			default: 0,
		},
		/** Total number of files the message carries, as the summary counted them. */
		totalCount: {
			type: Number,
			default: 0,
		},
		/** The summary has not arrived, so the row holds its place with a chip that leads nowhere. */
		loading: {
			type: Boolean,
			default: false,
		},
	},

	setup()
	{
		return {
			blockTestId: TestId.Attachments,
			chipTestId: TestId.AttachmentChip,
			chipLoadingTestId: TestId.AttachmentChipLoading,
			chipTypeTestId: TestId.AttachmentChipType,
			chipDownloadTestId: TestId.AttachmentChipDownload,
			stackTestId: TestId.AttachmentsStack,
			chipRole: DataRole.AttachmentChip,
			stackRole: DataRole.AttachmentsStack,
		};
	},

	computed: {
		loadingText(): string
		{
			return loc(Phrase.AttachmentLoading);
		},

		moreText(): string
		{
			return loc(Phrase.AttachmentsMore, { '#COUNT#': String(this.restCount) });
		},

		/**
		 * The name of the "+N" chip extends its visible text instead of replacing it, so what is read
		 * out and what is seen do not diverge.
		 */
		moreLabel(): string
		{
			const label = locPlural(Phrase.AttachmentsMoreLabel, this.totalCount, {
				'#MORE#': this.moreText,
				'#COUNT#': String(this.totalCount),
			});

			return label === '' ? this.moreText : label;
		},

		downloadTitle(): string
		{
			return loc(Phrase.AttachmentsDownload);
		},

		chips(): PreparedChip[]
		{
			return this.icons.map((file: AttachmentIcon): PreparedChip => this.prepareChip(file));
		},
	},

	methods: {
		prepareChip(file: AttachmentIcon): PreparedChip
		{
			return {
				file,
				tag: file.url === null ? 'span' : 'a',
				typeIconClass: `ui-icon ui-icon-file-${file.icon}`,
				attributes: this.chipAttributes(file),
				download: file.url === null ? null : this.downloadAttributes(file.url),
				downloadLabel: this.downloadLabel(file),
			};
		},

		chipAttributes(file: AttachmentIcon): Record<string, string>
		{
			if (file.url === null)
			{
				return {};
			}

			return {
				href: file.url,
				target: '_blank',
				rel: 'noopener',
				'data-role': this.chipRole,
				'data-testid': TestId.AttachmentChipOpen,
				[SliderIgnoreAttribute]: 'true',
				// the viewer builds these itself and they arrive ready to be hung on a node
				...prepareViewerAttributes(file.viewerAttrs),
			};
		},

		downloadLabel(file: AttachmentIcon): string
		{
			return file.name === ''
				? this.downloadTitle
				: loc(Phrase.AttachmentsDownloadFile, { '#NAME#': file.name })
			;
		},

		downloadAttributes(url: string): Record<string, string>
		{
			return {
				href: url,
				download: '',
				[SliderIgnoreAttribute]: 'true',
			};
		},

		handleIntent(event: Event): void
		{
			if ((event.target as HTMLElement).closest(`[data-role="${this.chipRole}"]`))
			{
				void prefetchViewer();
			}
		},

		handleClick(event: MouseEvent): void
		{
			const target = event.target as HTMLElement;
			if (target.closest(`[data-role="${this.stackRole}"]`))
			{
				return;
			}

			const link = target.closest(`[data-role="${this.chipRole}"]`) as HTMLElement | null;
			if (link)
			{
				openThroughViewer(event, link);
			}
		},

		handleStack(event: Event): void
		{
			event.preventDefault();
			AttachmentsPopup.open(event.currentTarget as HTMLElement);
		},
	},

	template: `
		<div
			class="mail-msg-list-attachments"
			:data-testid="blockTestId"
			@pointerover="handleIntent"
			@focusin="handleIntent"
			@click="handleClick"
		>
			<span
				v-if="loading"
				class="mail-msg-list-attachment-chip --loading"
				:data-testid="chipLoadingTestId"
			>{{ loadingText }}</span>
			<template v-else>
				<span
					v-for="(chip, index) in chips"
					:key="index"
					class="mail-msg-list-attachment-chip"
					:data-testid="chipTestId"
				>
					<component
						:is="chip.tag"
						class="mail-msg-list-attachment-chip__open"
						v-bind="chip.attributes"
					>
						<span
							class="mail-msg-list-attachment-chip__type"
							:class="chip.typeIconClass"
							:data-testid="chipTypeTestId"
							aria-hidden="true"
						><i></i></span>
						<span class="mail-msg-list-attachment-chip__name" :title="chip.file.name">{{ chip.file.name }}</span>
						<span v-if="chip.file.size" class="mail-msg-list-attachment-chip__size">{{ chip.file.size }}</span>
					</component>
					<a
						v-if="chip.download"
						class="mail-msg-list-attachment-chip__download"
						:data-testid="chipDownloadTestId"
						v-bind="chip.download"
						:title="downloadTitle"
						:aria-label="chip.downloadLabel"
					><span class="mail-msg-list-attachment-chip__download-icon" aria-hidden="true"></span></a>
				</span>
				<button
					v-if="restCount > 0"
					type="button"
					class="mail-msg-list-attachment-chip --more"
					:data-message-id="messageId"
					:data-role="stackRole"
					:data-testid="stackTestId"
					:title="moreLabel"
					:aria-label="moreLabel"
					aria-haspopup="dialog"
					aria-expanded="false"
					@click="handleStack"
					@keydown.space.prevent="handleStack"
				>{{ moreText }}</button>
			</template>
		</div>
	`,
});
