import { Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { lazyload } from 'ui.vue3.directives.lazyload';

import { AvatarSize, MessageAvatar } from 'im.v2.component.elements.avatar';
import { Timeline } from 'im.v2.component.elements.player';
import { ProgressBar } from 'im.v2.component.elements.progressbar';
import { EventType, FileStatus } from 'im.v2.const';
import 'im.v2.css.classes';
import 'im.v2.css.tokens';
import { Utils } from 'im.v2.lib.utils';

import '../css/video-note-detail-item.css';

import type { JsonObject } from 'main.core';
import type { EventEmitter } from 'main.core.events';
import type { ImModelFile, ImModelSidebarFileItem } from 'im.v2.model';

// The activatable element of the row, the one the roving set of the tab is built from. Exported so
// that the filter of the focus zone names the same element the template does.
export const VIDEO_NOTE_ROW_CLASS = 'bx-im-sidebar-file-video-note-detail-item__row';

const TYPE_ICON_SIZE = 22;

const PROCESSING_INDICATOR_SIZE = 'S';

// The transient statuses of an upload, listed one by one. `error` is not one of them: the record
// will not be processed any more, and the indicator of the design system spins without an end.
// A finished upload without an extracted frame is a missing preview, not processing either.
const PROCESSING_STATUSES: string[] = [
	FileStatus.upload,
	FileStatus.wait,
	FileStatus.progress,
	FileStatus.preparing,
];

/**
 * Row of a video note in the "Audio" tab. The tab offers no playback for it: the record has no
 * message model to feed a round player with, so a click goes to the message in the chat instead.
 * Having no player also keeps the row out of the tab playlist: the chain of voice records passes by.
 *
 * To the eye the row is the voice row of the same tab, and the block model below repeats the one of
 * `AudioPlayer` (`im.v2.component.elements.player`) element by element for that reason: the two are
 * meant to differ by the picture in the circle, by what a press does and by the items of the menu -
 * not by their metrics.
 */
// @vue/component
export const VideoNoteDetailItem = {
	name: 'VideoNoteDetailItem',
	components: { BIcon, MessageAvatar, ProgressBar, Timeline },
	directives: { lazyload },
	props: {
		fileItem: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		// the row carries no date of its own: it lives in the title of the date group above the row
		dateText: {
			type: String,
			required: true,
		},
		isTabActive: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['contextMenuClick'],
	data(): JsonObject
	{
		return {
			videoDuration: 0,
			isRowSeen: false,
		};
	},
	computed: {
		AvatarSize: () => AvatarSize,
		Outline: () => Outline,
		rowClass: () => VIDEO_NOTE_ROW_CLASS,
		TYPE_ICON_SIZE: () => TYPE_ICON_SIZE,
		PROCESSING_INDICATOR_SIZE: () => PROCESSING_INDICATOR_SIZE,
		sidebarFileItem(): ImModelSidebarFileItem
		{
			return this.fileItem;
		},
		file(): ImModelFile
		{
			return this.$store.getters['files/get'](this.sidebarFileItem.fileId, true);
		},
		isProcessing(): boolean
		{
			return PROCESSING_STATUSES.includes(this.file.status);
		},
		hasPreview(): boolean
		{
			return Type.isStringFilled(this.file.urlPreview);
		},
		// The metadata request is the whole cost of the duration, and the list of the tab is not
		// virtualised: a source handed to the browser right away is a request for every row of the page.
		// So it waits for the row to be seen and leaves once the value is in — the source has nothing
		// more to give.
		hasDurationSource(): boolean
		{
			return this.isRowSeen
				&& this.videoDuration === 0
				&& !this.isProcessing
				&& Type.isStringFilled(this.file.urlDownload);
		},
		fileSize(): string
		{
			return Utils.file.formatFileSize(this.file.size);
		},
		durationText(): string
		{
			return this.videoDuration > 0
				? Utils.date.formatMediaDurationTime(this.videoDuration)
				: '--:--';
		},
		metaInfo(): string
		{
			return `${this.fileSize}, ${this.durationText}`;
		},
		captionText(): string
		{
			return this.isProcessing ? this.file.authorName : this.metaInfo;
		},
		processingStatusMap(): Object
		{
			// the row has no cancel action, so the ring shows the record type instead of a cross
			return { [this.file.status]: { iconClass: Outline.VIDEO_RECORD } };
		},
		// the type of the record, the round shape of the preview and the ring of the indicator are all
		// visual: the name of the row is the only channel that carries them to a screen reader
		accessibleName(): string
		{
			const phraseCode = this.isProcessing
				? 'IM_SIDEBAR_VIDEO_NOTE_ITEM_PROCESSING_ARIA_LABEL'
				: 'IM_SIDEBAR_VIDEO_NOTE_ITEM_ARIA_LABEL';

			return this.loc(phraseCode, {
				'#AUTHOR_NAME#': this.file.authorName,
				'#DATE#': this.dateText,
			});
		},
	},
	watch: {
		// the record finishes processing on its own, with the focus never leaving where it is, so the
		// change has nothing to carry it but an announcement. The tab left for another one keeps its
		// rows mounted under KeepAlive, and what happens there is not on the screen to be announced.
		isProcessing(isProcessing: boolean)
		{
			if (isProcessing || !this.isTabActive)
			{
				return;
			}

			LiveAnnouncer.announce(this.accessibleName);
		},
	},
	mounted()
	{
		this.watchRowVisibility();
	},
	beforeUnmount()
	{
		this.stopWatchingRowVisibility();
	},
	methods: {
		watchRowVisibility()
		{
			// without the observer the row behaves as it did before: the source is mounted right away
			if (typeof IntersectionObserver === 'undefined')
			{
				this.isRowSeen = true;

				return;
			}

			this.rowObserver = new IntersectionObserver((entries) => {
				if (!entries.some((entry) => entry.isIntersecting))
				{
					return;
				}

				// the row is seen once and for good: the duration is read a single time
				this.isRowSeen = true;
				this.stopWatchingRowVisibility();
			});

			this.rowObserver.observe(this.$refs.row);
		},
		stopWatchingRowVisibility()
		{
			this.rowObserver?.disconnect();
			this.rowObserver = null;
		},
		getProcessingStatuses(): string[]
		{
			return PROCESSING_STATUSES;
		},
		onItemClick()
		{
			this.getEmitter().emit(EventType.dialog.goToMessageContext, {
				messageId: this.sidebarFileItem.messageId,
				dialogId: this.dialogId,
			});
		},
		onVideoMetadata()
		{
			const duration = this.$refs.durationSource?.duration;
			if (!Number.isFinite(duration) || duration <= 0)
			{
				return;
			}

			this.videoDuration = duration;
		},
		onRowKeydown(event: KeyboardEvent)
		{
			// a div with `role="button"` gets no native activation by Enter and Space
			if (event.key !== 'Enter' && event.key !== ' ')
			{
				return;
			}

			// Space would otherwise scroll the tab, Enter would otherwise leak into the chat input
			event.preventDefault();
			this.onItemClick();
		},
		onContextMenuClick(event)
		{
			this.$emit('contextMenuClick', {
				sidebarFile: this.sidebarFileItem,
				file: this.file,
				messageId: this.sidebarFileItem.messageId,
			}, event.currentTarget);
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div
			class="bx-im-sidebar-file-video-note-detail-item__container bx-im-sidebar-file-video-note-detail-item__scope"
		>
			<!-- The menu button is a sibling of the activatable element, not its child: a focusable
			     descendant of role="button" is presentational by ARIA (axe nested-interactive). -->
			<div
				ref="row"
				:class="rowClass"
				class="--focus-visible"
				data-testid="im-sidebar-video-note-item"
				role="button"
				tabindex="-1"
				:aria-label="accessibleName"
				@click.stop="onItemClick"
				@keydown="onRowKeydown"
			>
				<div class="bx-im-sidebar-file-video-note-detail-item__preview-wrap">
					<div class="bx-im-sidebar-file-video-note-detail-item__preview">
						<img
							v-if="hasPreview"
							v-lazyload
							data-lazyload-dont-hide
							:data-lazyload-src="file.urlPreview"
							class="bx-im-sidebar-file-video-note-detail-item__frame"
							data-testid="im-sidebar-video-note-item-preview"
							alt=""
						/>
						<div
							v-else
							class="bx-im-sidebar-file-video-note-detail-item__type-icon"
							data-testid="im-sidebar-video-note-item-type-icon"
						>
							<BIcon :name="Outline.VIDEO_RECORD" :size="TYPE_ICON_SIZE" />
						</div>
					</div>
					<!-- The ring of the indicator is wider than the circle it surrounds, so it lies beside
					     the clipped preview instead of inside it - the way the round message of the chat
					     layers the same indicator over its player. -->
					<div
						v-if="isProcessing"
						class="bx-im-sidebar-file-video-note-detail-item__processing"
						data-testid="im-sidebar-video-note-item-processing"
					>
						<ProgressBar
							:item="file"
							:size="PROCESSING_INDICATOR_SIZE"
							:handleStatus="getProcessingStatuses()"
							:statusMap="processingStatusMap"
						/>
					</div>
					<div class="bx-im-sidebar-file-video-note-detail-item__author-avatar">
						<MessageAvatar
							:messageId="sidebarFileItem.messageId"
							:authorId="sidebarFileItem.authorId"
							:size="AvatarSize.XS"
							aria-hidden="true"
						/>
					</div>
				</div>
				<video
					v-if="hasDurationSource"
					ref="durationSource"
					:src="file.urlDownload"
					class="bx-im-sidebar-file-video-note-detail-item__duration-source"
					preload="metadata"
					@durationchange="onVideoMetadata"
					@loadeddata="onVideoMetadata"
					@loadedmetadata="onVideoMetadata"
				></video>
				<div class="bx-im-sidebar-file-video-note-detail-item__content">
					<div class="bx-im-sidebar-file-video-note-detail-item__timeline">
						<!-- The waveform is a sprite of five drawings, not the spectrum of this record: the
						     row reads no samples and plays nothing. Being a picture, it stays away from a
						     screen reader, and the processing of the record is drawn on the preview alone,
						     so the shape of the row does not change under it. -->
						<div
							class="bx-im-sidebar-file-video-note-detail-item__waveform"
							data-testid="im-sidebar-video-note-item-waveform"
							aria-hidden="true"
						>
							<Timeline :timeCurrent="0" :timeTotal="0" :withSeeking="false" />
						</div>
						<div
							class="bx-im-sidebar-file-video-note-detail-item__caption-text --ellipsis"
							data-testid="im-sidebar-video-note-item-caption"
						>{{ captionText }}</div>
					</div>
				</div>
			</div>
			<button
				type="button"
				class="bx-im-messenger__context-menu-icon bx-im-sidebar-file-video-note-detail-item__context-menu"
				data-testid="im-sidebar-video-note-item-context-menu"
				:aria-label="loc('IM_SIDEBAR_VIDEO_NOTE_ITEM_MENU_ARIA_LABEL')"
				@click.stop="onContextMenuClick"
			></button>
		</div>
	`,
};
