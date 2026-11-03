import { Dom, Event, Extension, Runtime, Type } from 'main.core';
import { ZIndexManager } from 'main.core.z-index-manager';
import { FocusNavigator, LiveAnnouncer } from 'ui.a11y';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { Vue as CheckboxVue, CheckboxSize } from 'ui.system.checkbox';
import { Illustration as UiIllustration, IllustrationName } from 'ui.system.illustration.vue';
import { Text2Xs, TextMd, TextXs } from 'ui.system.typography.vue';
import { getFilesFromDataTransfer, isFilePasted } from 'ui.uploader.core';
import { markRaw } from 'ui.vue3';
import { mapState } from 'ui.vue3.vuex';

import { EventType, FileStatus, FileType, TextareaTarget } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { CopilotManager } from 'im.v2.lib.copilot';
import { DraftManager } from 'im.v2.lib.draft';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { isNewLineCombination, isSendMessageCombination, isTextDecorationCombination } from 'im.v2.lib.hotkey';
import { Logger } from 'im.v2.lib.logger';
import { Notifier } from 'im.v2.lib.notifier';
import { Textarea } from 'im.v2.lib.textarea';
import { makeChunks, UploadManager, type ResolvedValidationError } from 'im.v2.lib.uploading';
import { Utils } from 'im.v2.lib.utils';
import { UploadingService } from 'im.v2.provider.service.uploading';
import { LineLoader } from 'im.v2.component.elements.loader';
import { MediaGallery } from 'im.v2.component.elements.media-gallery';
import { SendButton } from 'im.v2.component.elements.send-button';

import { FormatToolbarManager, type BindPosition } from '../../classes/format-toolbar-manager';
import { MentionListEvents, type MentionActiveItemEvent } from '../../classes/mention-detector';
import { MentionDetector, MentionDetectorEvents } from '../../classes/mentions';
import { ResizeDirection, ResizeManager } from '../../classes/resize-manager';
import { GridFocusZone } from '../emote-selector/helpers/grid-focus';
import { FormatToolbar } from '../format-toolbar/format-toolbar';
import { MentionPopup } from '../mention/mention-popup';
import { AddMoreButton } from './add-more-button';
import { FileItem } from './file-item';
import { PreviewDropZone } from './preview-drop-zone';

import '../../css/upload-preview/upload-preview-content.css';

import type { JsonObject } from 'main.core';
import type { BaseEvent, EventEmitter } from 'main.core.events';
import type { UploaderFile } from 'ui.uploader.core';
import type { InsertMentionEvent } from 'im.v2.const';
import type { ImModelFile, ImModelMessage } from 'im.v2.model';

type PopupHeightMetrics = {
	availableHeight: number,
	containerHeight: number,
	clippedHeight: number,
	previewHeight: number,
	textareaHeight: number,
};

// a file still being read or on its way up has no id yet for the composition of a message
const UNSETTLED_STATUSES = new Set([
	FileStatus.preparing,
	FileStatus.progress,
	FileStatus.upload,
]);

// the mockup of the emptied edit sizes the illustration to the height of an attachment row
const EMPTY_ILLUSTRATION_SIZE = 44;
// mirrors MAX_FILES_COUNT of im.v2.lib.uploading, which owns the limit and enforces it;
// kept local on purpose: a stale cached lib bundle would silently turn the warning off
const MAX_FILES_COUNT = 100;
// the server owns this limit and refuses a composition above it; it is kept local as MAX_FILES_COUNT is
const MAX_FILES_COUNT_IN_MESSAGE = 10;
const LOCAL_SESSION_ORIGIN = 'local';
const REMOVE_BUTTON_SELECTOR = '.bx-im-upload-preview-file-item__remove';
const TEXT_LIMIT_COUNTER_SHOW_RANGE = 200;
// the height one row of the batch keeps for itself: MIN_PREVIEW_HEIGHT of the gallery rows
// (im.v2.component.elements.media-gallery, not exported) and the row height of a FileItem
const MIN_PREVIEW_HEIGHT = 58;
const WINDOW_RESIZE_DELAY = 100;
// the preview block is 364px wide inside the popup padding, minus the scrollbar gutter on both sides
const GALLERY_WIDTH = 352;
// the indeterminate line of the save, sized to stand beside its caption rather than span the window
const SAVING_LOADER_WIDTH = 56;
const SAVING_LOADER_HEIGHT = 16;
const TextareaHeight = {
	max: 208,
	min: 32,
};
const COMPRESS_CHECKBOX_ID = 'im-upload-preview-send-as-file';
const DELETE_HINT_ID = 'im-upload-preview-delete-hint';

// Roving focus over the preview collection: the dialog enters it with one Tab, then the arrows move a
// roving tabindex from tile to tile. The tile is the only stop - its remove cross stays out of the set
// (tabindex="-1") and mouse-only. Both branches are one ARIA grid of real role="row" markup, so a single
// GridFocusZone drives them: the media tiles in two dimensions, the file rows in a single column.
const FILE_ITEM_SELECTOR = '.bx-im-upload-preview-file-item__scope';
const MEDIA_ITEM_SELECTOR = '.bx-im-elements-media-gallery__item';
// A focused tile of either branch, so the zone and the Delete handler share one idea of what a cell is.
const CELL_SELECTOR = `${FILE_ITEM_SELECTOR}, ${MEDIA_ITEM_SELECTOR}`;

// Take the Vue component from the parent ui.system.checkbox extension: it creates
// the BX.UI.System.Checkbox namespace and re-exports the Vue component (export * as Vue).
// A direct import from ui.system.checkbox.vue crashes at runtime — it has an empty rel.
const Checkbox = CheckboxVue.Checkbox;

// @vue/component
export const UploadPreviewContent = {
	name: 'UploadPreviewContent',
	inject: ['mentionGridIds'],
	components: {
		AddMoreButton,
		BIcon,
		Checkbox,
		FileItem,
		FormatToolbar,
		LineLoader,
		MentionPopup,
		PreviewDropZone,
		SendButton,
		MediaGallery,
		Text2Xs,
		TextMd,
		TextXs,
		UiIllustration,
	},
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		sessionId: {
			type: String,
			required: true,
		},
		textareaValue: {
			type: String,
			required: false,
			default: '',
		},
		draftKey: {
			type: String,
			required: true,
		},
		mentionReplacementMap: {
			/** @type MentionReplacementMap | null */
			type: Object,
			default: null,
		},
		withCopilot: {
			type: Boolean,
			default: true,
		},
		// the message whose attachments are being edited; without it the batch is a new message
		editedMessageId: {
			type: [Number, null],
			default: null,
		},
		// the save of the composition is under way: the batch has been taken and cannot be changed
		isSaving: {
			type: Boolean,
			default: false,
		},
		// a file leaving the batch takes the copy it got in the chat folder with it - unless the composition
		// of this batch has reached the server already, and the message may be carrying that copy now
		canRemoveFilesFromServer: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['sendFiles', 'saveFiles', 'close', 'update:filesCount'],
	setup(): JsonObject
	{
		return { CheckboxSize, EMPTY_ILLUSTRATION_SIZE, IllustrationName, OutlineIcons };
	},
	data(): JsonObject
	{
		return {
			text: '',
			showMention: false,
			mentionQuery: '',
			mentionActiveItemId: null,
			showFormatToolbar: false,
			formatToolbarPosition: {},
			sendAsFile: false,
			// the label is tied to the checkbox by id, and two mounted textareas must not share one
			compressCheckboxId: `${COMPRESS_CHECKBOX_ID}-${Utils.text.getUuidV4()}`,
			// every cell of the collection describes itself by this id, so it is per-instance for the same reason
			deleteHintId: `${DELETE_HINT_ID}-${Utils.text.getUuidV4()}`,
			order: [],
			// the caption field holds focus: what the ring of its wrapper is drawn from (see the stylesheet)
			isCaptionFocused: false,
			textareaHeight: TextareaHeight.min,
			textareaResizedHeight: 0,
			draggedItemEvent: null,
			lastTargetItem: null,
			lastTargetPosition: null,
			highlightDropzone: {},
			draggedFile: null,
			axis: 'x',
			insertPosition: null,
			dropZoneContainer: null,
		};
	},
	computed:
	{
		GALLERY_WIDTH: () => GALLERY_WIDTH,
		SAVING_LOADER_WIDTH: () => SAVING_LOADER_WIDTH,
		SAVING_LOADER_HEIGHT: () => SAVING_LOADER_HEIGHT,
		TextareaTarget: () => TextareaTarget,
		isEditMode(): boolean
		{
			return this.editedMessageId !== null;
		},
		// an emptied edit keeps the window open, and the window says so instead of showing a blank list;
		// a send with nothing left closes itself, so the state belongs to the edit alone
		isEmptyComposition(): boolean
		{
			return this.isEditMode && this.filesCount === 0;
		},
		isMentionAvailable(): boolean
		{
			// without the dialog map the mention would be sent as plain text, so both are required
			if (!this.mentionReplacementMap)
			{
				return false;
			}

			return FeatureManager.isFeatureAvailable(Feature.isUploadCaptionMentionsFormatAvailable);
		},
		mentionComboboxAttrs(): JsonObject
		{
			if (!this.isMentionAvailable || !this.showMention)
			{
				return {};
			}

			const gridRendered = this.mentionActiveItemId !== null;

			return {
				'aria-haspopup': 'grid',
				'aria-autocomplete': 'list',
				'aria-controls': gridRendered ? this.mentionGridIds.gridId : null,
				'aria-activedescendant': this.mentionActiveItemId,
			};
		},
		isFormatAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isUploadCaptionMentionsFormatAvailable);
		},
		isMarkdownInputAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isMarkdownAvailable);
		},
		// the session keeps its files outside Vue reactivity, so the store keys are what
		// makes the batch composition reactive: a file joining it adds a key here
		...mapState({
			storeFileIds: (state) => Object.keys(state.files.collection),
		}),
		sessionFiles(): Array<UploaderFile>
		{
			const knownFileIds: Set<string> = new Set(this.storeFileIds);

			return this.getUploadingService().getPreviewSessionFiles(this.sessionId)
				.filter((file: UploaderFile) => knownFileIds.has(file.getId()));
		},
		// a disk batch is never composed in the popup, so files can only be added to a local one, and a
		// batch taken for the save is not composed any more
		canComposeFiles(): boolean
		{
			if (this.isSaving)
			{
				return false;
			}

			return this.getUploadingService().getPreviewSessionOrigin(this.sessionId) === LOCAL_SESSION_ORIGIN;
		},
		// a batch at its limit takes no more - a message older than the feature may hold more than the limit
		canAddFiles(): boolean
		{
			return this.canComposeFiles && !this.isAtMaxFilesLimit;
		},
		// The limit of an edit is the one of the message, and the way in stays in sight when it is reached:
		// the button goes out and tells why, instead of leaving the window without a word. A send is left as
		// it was - its limit is a hundred, and the plate below the batch is what names it there.
		showAddMoreButton(): boolean
		{
			return this.isEditMode ? this.canComposeFiles : this.canAddFiles;
		},
		isAddMoreDisabled(): boolean
		{
			return !this.canAddFiles;
		},
		// the plate belongs to the send: in an edit the same words are the reason of the button that went out
		showFilesLimitMessage(): boolean
		{
			return this.isAtMaxFilesLimit && !this.isEditMode;
		},
		canChangeComposition(): boolean
		{
			return !this.isSaving;
		},
		isExternalDropDisabled(): boolean
		{
			// reordering an item is a drag over the same container, but not a file coming from outside
			return !this.canAddFiles || Boolean(this.draggedFile);
		},
		orderedFiles(): Array<ImModelFile>
		{
			return this.order
				.map((fileId: string) => this.$store.getters['files/get'](fileId))
				.filter(Boolean);
		},
		filesCount(): number
		{
			return this.orderedFiles.length;
		},
		chunks(): Array<Array<ImModelFile>>
		{
			return makeChunks({ files: this.orderedFiles });
		},
		files(): Array<ImModelFile>
		{
			return this.chunks.flat();
		},
		// The batch as the grid is built from it: which files are in it and in which order. Every derived
		// array is rebuilt whenever a file model is handed out anew, so only this value tells a change of
		// the composition from a model of the same batch being refreshed.
		fileIdsKey(): string
		{
			return this.files.map((file: ImModelFile) => file.id).join(',');
		},
		uploaderFiles(): Array<UploaderFile>
		{
			const sessionFilesById: Map<string, UploaderFile> = new Map(
				this.sessionFiles.map((file: UploaderFile) => [file.getId(), file]),
			);

			return this.files
				.map((file: ImModelFile) => sessionFilesById.get(file.id))
				.filter(Boolean);
		},
		// the batch is not allowed to grow past the limit, so being at it means the next add is refused
		isAtMaxFilesLimit(): boolean
		{
			return this.orderedFiles.length >= this.maxFilesCount;
		},
		// the server refuses a composition that grew past the limit of a message and its uploaded copies would
		// be left in the chat folder; a message older than the feature carries more and is saved all the same
		hasCompositionGrownPastLimit(): boolean
		{
			return this.filesCount > this.maxFilesCount && this.filesCount > this.restoredFileIds.size;
		},
		// an edit changes one message, so the limit is that of a message; a send splits a larger batch in two
		maxFilesCount(): number
		{
			return this.isEditMode ? MAX_FILES_COUNT_IN_MESSAGE : MAX_FILES_COUNT;
		},
		filesLimitMessage(): string
		{
			return this.isEditMode
				? this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_EDIT_FILES_LIMIT_MESSAGE_10')
				: this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILES_LIMIT_MESSAGE_100');
		},
		// in an edit the field holds the text of the message and not a caption to the files, so it is
		// named after what it holds; the field has no visible label, so the same words are its aria-label
		captionPlaceholder(): string
		{
			return this.isEditMode
				? this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_EDIT_INPUT_PLACEHOLDER')
				: this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_INPUT_PLACEHOLDER_2');
		},
		// the name of the field outlives the placeholder, which goes on the first character typed. A send
		// names the caption of the files; an edit names the text of the message the field actually holds
		captionAriaLabel(): string
		{
			return this.isEditMode
				? this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_EDIT_INPUT_PLACEHOLDER')
				: this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_INPUT_ARIA');
		},
		hasValidationErrors(): boolean
		{
			return this.files.some((file: ImModelFile) => {
				return Boolean(file.validationError);
			});
		},
		isMediaOnly(): boolean
		{
			if (this.hasValidationErrors)
			{
				return false;
			}

			return this.files.every((file: ImModelFile) => {
				return (file.type === FileType.image || file.type === FileType.video);
			});
		},
		// which collection the batch is shown as: gallery tiles or a list of file rows.
		// an edit reads the mode off the composition it shows, through the very predicate the feed draws
		// the saved message by; a new message keeps the choice the author makes with the compression switch
		isGalleryMode(): boolean
		{
			// the error and the reason a file was refused are written out in a row and nowhere else
			if (this.hasFailedFiles || this.hasValidationErrors)
			{
				return false;
			}

			if (this.isEditMode)
			{
				return Utils.file.isGallery(this.files);
			}

			return this.isMediaOnly && !this.sendAsFile;
		},
		inputMaxLength(): number
		{
			const settings = Extension.getSettings('im.v2.component.textarea');

			return settings.get('maxLength');
		},
		allowedTextLimit(): number
		{
			return this.inputMaxLength - this.text.length;
		},
		showInputLengthCounter(): boolean
		{
			return this.allowedTextLimit <= TEXT_LIMIT_COUNTER_SHOW_RANGE;
		},
		// what the live region says instead of the bare number, which on its own tells nothing about
		// what is running out
		charsLeftLabel(): string
		{
			return this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_CHARS_LEFT', {
				'#COUNT#': String(this.allowedTextLimit),
			});
		},
		textareaHeightStyle(): number | string
		{
			return this.textareaHeight === 'auto' ? 'auto' : `${this.textareaHeight}px`;
		},
		// the state of the batch is read from the store, where the uploading service mirrors it: the status
		// an UploaderFile keeps is outside Vue reactivity, and a window built on it would never catch up
		hasFailedFiles(): boolean
		{
			return this.files.some((file: ImModelFile) => file.status === FileStatus.error);
		},
		hasUnsettledFiles(): boolean
		{
			return this.files.some((file: ImModelFile) => UNSETTLED_STATUSES.has(file.status));
		},
		isSendDisabled(): boolean
		{
			// a second press would send the very same request a second time
			if (this.isSaving)
			{
				return true;
			}

			if (this.hasFailedFiles || this.hasValidationErrors)
			{
				return true;
			}

			if (this.isEditMode)
			{
				// the composition is saved by the ids of its files, so a file still on its way has none to give.
				// An empty composition is a legitimate save: the message may be left with its text alone
				return this.hasUnsettledFiles || this.hasCompositionGrownPastLimit;
			}

			return this.files.length === 0;
		},
		isStopGenerationState(): boolean
		{
			return this.copilotManager.isStopGenerationAvailable(this.dialogId);
		},
	},
	watch:
	{
		async text()
		{
			await this.adjustTextareaHeight();
		},
		sendAsFile(newValue: boolean)
		{
			this.uploaderFiles.forEach((file: UploaderFile) => {
				file.setCustomData('sendAsFile', newValue);
			});
		},
		sessionFiles(sessionFiles: Array<UploaderFile>)
		{
			this.syncOrder(sessionFiles);
		},
		// the composition lives here: the session alone would count only the files added in this edit
		filesCount: {
			handler(filesCount: number)
			{
				this.$emit('update:filesCount', filesCount);
			},
			immediate: true,
		},
		// the message about the limit appears where nothing was, and a reader outside it learns no other way
		isAtMaxFilesLimit(isAtMaxFilesLimit: boolean)
		{
			if (isAtMaxFilesLimit)
			{
				LiveAnnouncer.announce(this.filesLimitMessage);
			}
		},
		// the row of the error and the button it disabled have to reach the one who cannot see them, and the
		// hint is what says how to get out of it: repeat the upload or take the file away
		hasFailedFiles(hasFailedFiles: boolean)
		{
			if (hasFailedFiles)
			{
				LiveAnnouncer.announce(this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILE_UPLOAD_HINT'), 'assertive');
			}
		},
		// the window locks up for the whole of the save, and a reader outside it is told of that nowhere else
		isSaving(isSaving: boolean)
		{
			if (isSaving)
			{
				LiveAnnouncer.announce(this.loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_SAVING'));
			}
		},
		// The way in closes while it may be holding the focus, and it goes both ways: in a send the button
		// leaves the window, in an edit it stays and takes the disabled attribute, which drops the focus to
		// the body just the same. Where the button stayed, its wrapper is the stop that took its place.
		canAddFiles(canAddFiles: boolean)
		{
			if (!canAddFiles)
			{
				void this.keepFocusInWindow(() => this.$refs.addMore?.$el ?? null);
			}
		},
		isGalleryMode()
		{
			// The compress toggle swaps the whole collection between gallery tiles and file rows, so every
			// cell of the zone is replaced - rebind it once Vue has rendered the other branch.
			void this.$nextTick(() => {
				this.initFocusZone();
				this.syncCaptionFocusOutline();
			});
		},
		fileIdsKey()
		{
			// A file removed, added or reordered replaces the tiles of the collection: rebind the zone to the
			// ones on screen now, and land the focus the removal asked for. A file model refreshed under the
			// same batch keeps every tile in place, and a zone raised anew would drop the moving focus point.
			void this.$nextTick(() => {
				this.initFocusZone();
				this.syncCaptionFocusOutline();
			});
		},
		isMentionAvailable()
		{
			this.initMentionDetector();
		},
	},
	created()
	{
		this.focusZone = null;
		this.pendingFocusIndex = null;
		this.uploadManager = new UploadManager();
		this.copilotManager = new CopilotManager();
		this.mentionDetector = null;
		this.toolbarManager = null;
		// the snapshot of the composition the message came with, kept out of reactivity: `order` rules the batch
		this.restoredFileIds = new Set();
		this.initResizeManager();
		this.initEditedComposition();
		this.syncOrder(this.sessionFiles);

		this.getEmitter().subscribe(EventType.textarea.insertMention, this.onInsertMention);
		this.getEmitter().subscribe(MentionListEvents.activeItemChanged, this.onMentionActiveItemChanged);
	},
	async mounted()
	{
		this.text = this.textareaValue;
		this.insertText('');
		this.dropZoneContainer = this.$refs.container;
		this.initWindowResizeListener();

		// the caret must be placed after Vue has flushed the moved text into the element
		await this.$nextTick();

		// the popup may already be closed by now, so there is nothing left to set up
		if (!this.$refs.messageText)
		{
			return;
		}

		this.focusTextarea();
		this.moveCaretToTextEnd();
		this.initMentionDetector();
		this.initFocusZone();
	},
	beforeUnmount()
	{
		// the caption of an edit is the text of the message: handing it to the field would leave it in the draft
		if (!this.isEditMode)
		{
			// the text goes back to the main field first: its watcher writes the draft text, and the
			// replacements join the same draft before it is flushed to the storage
			this.insertText(this.text);
			this.saveMentionsWithText();
		}

		this.getEmitter().unsubscribe(EventType.textarea.insertMention, this.onInsertMention);
		this.getEmitter().unsubscribe(MentionListEvents.activeItemChanged, this.onMentionActiveItemChanged);

		this.resizeManager.destroy();
		this.mentionDetector?.destroy();
		this.toolbarManager?.destroy();
		Event.unbind(window, 'resize', this.onWindowResize);
		this.destroyFocusZone();
		this.isCaptionFocused = false;
	},
	methods:
	{
		// the two sources of the batch share only their ids, so the order below is the whole truth about it
		initEditedComposition()
		{
			const restoredFiles: Array<ImModelFile> = this.getRestoredFiles();
			const restoredFileIds: Array<string> = restoredFiles.map((file: ImModelFile) => file.id);

			this.restoredFileIds = new Set(restoredFileIds);
			this.order = restoredFileIds;
			// the mode is inherited from the message as it is drawn now; nothing to inherit means the batch decides
			this.sendAsFile = restoredFiles.length > 0 && !Utils.file.isGallery(restoredFiles);
		},
		getRestoredFiles(): Array<ImModelFile>
		{
			if (!this.isEditMode)
			{
				return [];
			}

			const message: ImModelMessage = this.$store.getters['messages/getById'](this.editedMessageId);

			return (message?.files ?? [])
				.map((fileId: string) => this.$store.getters['files/get'](fileId))
				.filter(Boolean);
		},
		getMentionPopupTargetContainer(): ?HTMLElement
		{
			const targetContainer = this.$refs.container?.closest('[aria-modal="true"]') ?? null;
			if (!targetContainer)
			{
				return null;
			}

			const modalZIndex = Number.parseInt(window.getComputedStyle(targetContainer).zIndex, 10);
			const nestedStack = ZIndexManager.getOrAddStack(targetContainer);
			if (nestedStack && Type.isNumber(modalZIndex) && nestedStack.getBaseIndex() <= modalZIndex)
			{
				nestedStack.setBaseIndex(modalZIndex + 1);
			}

			return targetContainer;
		},
		syncOrder(sessionFiles: Array<UploaderFile>)
		{
			const sessionIds: Array<string> = sessionFiles.map((file: UploaderFile) => file.getId());
			// a file of the batch either still belongs to the session or is one the message already held
			const nextOrder: Array<string> = [
				...this.order.filter((fileId: string) => {
					return sessionIds.includes(fileId) || this.restoredFileIds.has(fileId);
				}),
				...sessionIds.filter((fileId: string) => !this.order.includes(fileId)),
			];

			// the store keys of any chat signal the composition, so most syncs bring nothing new:
			// keeping the same order spares the gallery a rebuild
			if (this.isSameOrder(nextOrder))
			{
				return;
			}

			this.order = nextOrder;
		},
		isSameOrder(order: Array<string>): boolean
		{
			return order.length === this.order.length
				&& order.every((fileId: string, index: number) => fileId === this.order[index]);
		},
		async adjustTextareaHeight()
		{
			this.textareaHeight = 'auto';
			await this.$nextTick();

			if (!this.$refs.messageText)
			{
				return;
			}

			const TEXTAREA_BORDERS_WIDTH = 2;
			const contentHeight = this.$refs.messageText.scrollHeight + TEXTAREA_BORDERS_WIDTH;
			const wantedHeight = Math.max(contentHeight, this.resizedTextareaHeight ?? TextareaHeight.min);

			this.textareaHeight = Math.min(wantedHeight, this.getMaxTextareaHeight());
		},
		// the single place the caption height is bounded: typing, the drag handle and a window resize
		// all ask here. The popup clips what does not fit and has no scroll of its own, so the caption
		// may only take the pixels the preview can spare above its last visible row
		getMaxTextareaHeight(): number
		{
			const metrics = this.getPopupHeightMetrics();
			if (!metrics)
			{
				return TextareaHeight.max;
			}

			const unusedHeight = metrics.availableHeight - metrics.containerHeight;
			const spareHeight = metrics.previewHeight - MIN_PREVIEW_HEIGHT;
			const allowedGrowth = unusedHeight + spareHeight - metrics.clippedHeight;
			const maxHeight = metrics.textareaHeight + allowedGrowth;

			return Math.min(TextareaHeight.max, Math.max(TextareaHeight.min, maxHeight));
		},
		// every height comes from one layout state, so growing the caption by what the preview
		// gives up keeps the sum unchanged
		getPopupHeightMetrics(): PopupHeightMetrics | null
		{
			const { container, preview, messageText } = this.$refs;
			if (!container || !preview || !messageText)
			{
				return null;
			}

			// the window bounds the popup through the max-height of the container, and nothing else
			const availableHeight = Number.parseFloat(Dom.style(container, 'maxHeight'));

			return {
				availableHeight: Type.isNumber(availableHeight) ? availableHeight : window.innerHeight,
				containerHeight: container.offsetHeight,
				clippedHeight: container.scrollHeight - container.clientHeight,
				previewHeight: preview.offsetHeight,
				textareaHeight: messageText.offsetHeight,
			};
		},
		getUploadingService(): UploadingService
		{
			if (!this.uploadingService)
			{
				this.uploadingService = UploadingService.getInstance();
			}

			return this.uploadingService;
		},
		onCancel()
		{
			this.$emit('close', { text: this.text });
		},
		onStopGeneration()
		{
			Analytics.getInstance().copilot.onClickStopGeneration(this.dialogId);
			void this.copilotManager.stopGeneration(this.dialogId);
		},
		onSend()
		{
			if (this.isStopGenerationState || this.isSendDisabled)
			{
				return;
			}

			if (this.isEditMode)
			{
				this.saveEditedFiles();

				return;
			}

			this.$emit('sendFiles', {
				sessionId: this.sessionId,
				text: this.text,
				files: this.uploaderFiles,
				sendAsFile: this.applySendAsFile(),
			});

			this.text = '';
		},
		// the files added in this edit still carry temporary ids, so the uploader files travel with the order
		saveEditedFiles()
		{
			this.$emit('saveFiles', {
				sessionId: this.sessionId,
				messageId: this.editedMessageId,
				text: this.text,
				fileIds: this.orderedFiles.map((file: ImModelFile) => file.id),
				files: this.uploaderFiles,
				sendAsFile: this.applySendAsFile(),
			});
		},
		// a batch drawn as a list goes as files, and an image sent so keeps no preview or original
		applySendAsFile(): boolean
		{
			if (this.isGalleryMode)
			{
				return false;
			}

			this.uploaderFiles.forEach((file: UploaderFile) => {
				this.removePreviewParams(file);
				file.setTreatImageAsFile(true);
				file.setCustomData('sendAsFile', true);
			});

			return true;
		},
		onKeyDownHandler(event: KeyboardEvent)
		{
			// Escape belongs to the popup it is pressed over: of the popups asking for the key only the
			// topmost one gets it (main.popup, checkEscPressed), and hiding the toolbar here would hand it over
			if (Utils.key.isCombination(event, 'Escape'))
			{
				return;
			}

			this.toolbarManager?.hide();

			if (this.showMention)
			{
				this.mentionDetector.onActiveMentionKeyDown(event);

				return;
			}

			const sendMessageCombination = isSendMessageCombination(event);
			const newLineCombination = isNewLineCombination(event);
			if (sendMessageCombination && !newLineCombination)
			{
				event.preventDefault();
				this.onSend();

				return;
			}

			if (newLineCombination)
			{
				event.preventDefault();
				this.text = Textarea.addNewLine(this.$refs.messageText);

				return;
			}

			if (this.isFormatAvailable && isTextDecorationCombination(event))
			{
				event.preventDefault();
				this.text = Textarea.handleDecorationTag(this.$refs.messageText, event.code, this.isMarkdownInputAvailable);

				return;
			}

			this.mentionDetector?.onKeyDown(event);
		},
		onMouseUp(event: MouseEvent)
		{
			if (!this.isFormatAvailable)
			{
				return;
			}

			this.getToolbarManager().handleTextSelect(event, this.$refs.messageText);
		},
		getToolbarManager(): FormatToolbarManager
		{
			if (!this.toolbarManager)
			{
				this.toolbarManager = new FormatToolbarManager();
				this.toolbarManager.subscribe(FormatToolbarManager.events.show, this.onShowFormatToolbar);
				this.toolbarManager.subscribe(FormatToolbarManager.events.hide, this.onHideFormatToolbar);
			}

			return this.toolbarManager;
		},
		onShowFormatToolbar(event: BaseEvent<{ bindPosition: BindPosition }>)
		{
			const { bindPosition } = event.getData();
			this.formatToolbarPosition = bindPosition;
			this.showFormatToolbar = true;
		},
		onHideFormatToolbar()
		{
			this.showFormatToolbar = false;
		},
		onFormatToolbarUpdateText(newText: string)
		{
			this.text = newText;
		},
		initMentionDetector()
		{
			// the map comes from the owner asynchronously, so mount is not the only moment
			// the detector becomes possible
			if (this.mentionDetector || !this.isMentionAvailable || !this.$refs.messageText)
			{
				return;
			}

			this.mentionDetector = new MentionDetector({
				textareaElement: this.$refs.messageText,
				context: { emitter: this.getEmitter() },
				gridIds: this.mentionGridIds,
			});

			this.mentionDetector.subscribe(MentionDetectorEvents.showMentionPopup, (event) => {
				const { mentionQuery } = event.getData();
				this.showMentionPopup(mentionQuery);
			});

			this.mentionDetector.subscribe(MentionDetectorEvents.hideMentionPopup, () => {
				this.closeMentionPopup();
			});

			this.mentionDetector.refresh();
		},
		showMentionPopup(mentionQuery: string)
		{
			this.mentionQuery = mentionQuery;
			this.showMention = true;
		},
		closeMentionPopup()
		{
			this.showMention = false;
			this.mentionQuery = '';
			this.mentionActiveItemId = null;
			this.mentionDetector.onMentionPopupClose();
		},
		onMentionActiveItemChanged(event: BaseEvent<MentionActiveItemEvent>)
		{
			this.mentionActiveItemId = event.getData().nodeId;
		},
		onInsertMention(event: BaseEvent<InsertMentionEvent>)
		{
			const { mentionText, mentionReplacement, isMentionSymbol = true, dialogId, target } = event.getData();
			let { textToReplace = '' } = event.getData();
			// no detector means no dialog map either: such a mention must not reach the caption
			if (!this.mentionDetector || dialogId !== this.dialogId || target !== TextareaTarget.uploadCaption)
			{
				return;
			}

			// the draft gets the replacement only together with the text holding it, on unmount:
			// a map outliving its own text turns the same name typed by hand into a real mention
			this.mentionReplacementMap.add(mentionText, mentionReplacement);

			const mentionSymbol = isMentionSymbol ? this.mentionDetector.getMentionSymbol() : '';
			textToReplace = `${mentionSymbol}${textToReplace}`;
			this.text = Textarea.insertMention(this.$refs.messageText, {
				textToInsert: mentionText,
				textToReplace,
			});
			this.mentionDetector.clearMentionSymbol();
		},
		saveMentionsWithText()
		{
			const mentions = this.mentionReplacementMap?.getAll() ?? {};
			// an empty map means nothing to keep: a send has already cleared both map and draft
			if (Object.keys(mentions).length === 0)
			{
				return;
			}

			this.getDraftManager().setDraftMentions(this.draftKey, mentions);
		},
		focusTextarea()
		{
			this.$refs.messageText?.focus({ preventScroll: true });
		},
		moveCaretToTextEnd()
		{
			const textarea = this.$refs.messageText;
			textarea.selectionStart = textarea.value.length;
			textarea.selectionEnd = textarea.value.length;
		},
		getDraftManager(): DraftManager
		{
			if (!this.draftManager)
			{
				this.draftManager = DraftManager.getInstance();
			}

			return this.draftManager;
		},
		onCaptionFocus()
		{
			this.isCaptionFocused = true;
		},
		onCaptionBlur()
		{
			this.isCaptionFocused = false;
		},
		// The ring of the wrapper stands for the focus of the caption alone, so it must not outlive it: a
		// rebuilt collection can move the focus into a cell, and a field detached that way fires no blur.
		// Reading the flag back from the live focus after every rebuild keeps the two in step either way.
		syncCaptionFocusOutline()
		{
			this.isCaptionFocused = document.activeElement === this.$refs.messageText;
		},
		removePreviewParams(file: UploaderFile)
		{
			this.$store.dispatch('files/update', {
				id: file.getId(),
				fields: {
					image: false,
				},
			});
		},
		insertText(text: string)
		{
			this.getEmitter().emit(EventType.textarea.insertText, {
				text,
				dialogId: this.dialogId,
				replace: true,
			});
		},
		initResizeManager()
		{
			this.resizeManager = new ResizeManager({
				direction: ResizeDirection.down,
				minHeight: TextareaHeight.min,
				maxHeight: TextareaHeight.max,
			});
			this.resizeManager.subscribe(ResizeManager.events.onHeightChange, ({ data: { newHeight } }) => {
				this.textareaHeight = Math.min(newHeight, this.getMaxTextareaHeight());
			});
			this.resizeManager.subscribe(ResizeManager.events.onResizeStop, () => {
				this.resizedTextareaHeight = this.textareaHeight;
			});
		},
		initWindowResizeListener()
		{
			// a window shrinking under an open popup takes the pixels back from the caption
			this.onWindowResize = Runtime.throttle(this.adjustTextareaHeight, WINDOW_RESIZE_DELAY);
			Event.bind(window, 'resize', this.onWindowResize);
		},
		// Rebuilt rather than kept in step with the markup: the primitive resyncs its own set a frame after
		// the DOM changes, and the focus a removal owes the user cannot wait for that frame.
		initFocusZone()
		{
			const container = this.$refs.itemsContainer;
			if (!container)
			{
				return;
			}

			this.destroyFocusZone();

			// The zone holds DOM nodes and has private fields, so it stays out of reactive state (markRaw).
			// Only the cell selector is ours - the grid the zone reads is the role="row" markup itself.
			this.focusZone = markRaw(new GridFocusZone(container, CELL_SELECTOR));
			this.focusZone.activate();
			this.applyPendingFocus();
		},
		destroyFocusZone()
		{
			this.focusZone?.deactivate();
			this.focusZone = null;
		},
		onResizeStart(event)
		{
			this.resizeManager.onResizeStart(event, this.textareaHeight);
		},
		onRemoveItem(event: { file: ImModelFile })
		{
			if (!this.canChangeComposition)
			{
				return;
			}

			const removedIndex: number = this.order.indexOf(event.file.id);

			// the file leaves the session too, otherwise the next sync brings it back
			this.getUploadingService().removeFileFromPreviewSession({
				sessionId: this.sessionId,
				fileId: event.file.id,
				removeFromServer: this.canRemoveFilesFromServer,
			});

			this.order = this.order.filter((fileId: string) => fileId !== event.file.id);

			// an emptied edit stays open: the message may be left with its text alone
			if (this.order.length === 0 && !this.isEditMode)
			{
				this.onCancel();

				return;
			}

			void this.keepFocusInWindow(() => this.getRemoveButtonAt(removedIndex));
		},
		// a control that removes itself takes the focus with it, and focus left on nothing goes to the body,
		// where the window is no longer the context anything is read in
		async keepFocusInWindow(getTarget: () => ?HTMLElement): Promise<void>
		{
			if (!this.holdsFocus())
			{
				return;
			}

			await this.$nextTick();

			if (!this.$refs.container || this.holdsFocus())
			{
				return;
			}

			FocusNavigator.focusTarget(getTarget() ?? this.$refs.messageText);
		},
		holdsFocus(): boolean
		{
			return Boolean(this.$refs.container?.contains(document.activeElement));
		},
		// the row that took the place of the removed one, and the last row when the removed one was last
		getRemoveButtonAt(index: number): ?HTMLElement
		{
			const buttons = this.$refs.container?.querySelectorAll(REMOVE_BUTTON_SELECTOR) ?? [];

			return buttons[Math.min(index, buttons.length - 1)] ?? null;
		},
		// the repeat is a new file of the batch, and it takes the place its failed original held
		onRetryItem(event: { file: ImModelFile })
		{
			if (!this.canChangeComposition)
			{
				return;
			}

			const repeatedFile: ?UploaderFile = this.getUploadingService().retryPreviewSessionFile({
				sessionId: this.sessionId,
				fileId: event.file.id,
			});

			if (!repeatedFile)
			{
				Notifier.onDefaultError();

				return;
			}

			this.order = this.order.map((fileId: string) => {
				return fileId === event.file.id ? repeatedFile.getId() : fileId;
			});
		},
		onItemsKeyDown(event: KeyboardEvent)
		{
			if (event.key !== 'Delete' && event.key !== 'Backspace')
			{
				return;
			}

			const cell = event.target;
			if (!(cell instanceof HTMLElement) || !cell.matches(CELL_SELECTOR))
			{
				return;
			}

			event.preventDefault();
			this.removeFocusedCell(cell);
		},
		removeFocusedCell(cell: HTMLElement)
		{
			const index = this.getFocusCells().indexOf(cell);
			const file: ImModelFile = this.files[index];
			if (!file)
			{
				return;
			}

			// Where focus lands once the tile is gone: the tile that shifts into the gap, or the one before it
			// if the last tile was removed. -1 means the batch is now empty - the dialog closes and the focus
			// trap returns focus to the composer, so nothing is refocused here.
			this.pendingFocusIndex = index < this.files.length - 1 ? index : index - 1;
			this.onRemoveItem({ file });
		},
		getFocusCells(): Array<HTMLElement>
		{
			const container = this.$refs.itemsContainer;

			return container ? [...container.querySelectorAll(CELL_SELECTOR)] : [];
		},
		applyPendingFocus()
		{
			const index = this.pendingFocusIndex;
			this.pendingFocusIndex = null;
			if (index === null || index < 0)
			{
				return;
			}

			// preventScroll is the contract of the zone: revealing the cell is the job of its focusin handler,
			// which scrolls the collection itself instead of every ancestor up to the page.
			this.getFocusCells()[index]?.focus({ preventScroll: true });
		},
		onItemDragStart(event)
		{
			if (!this.canChangeComposition)
			{
				return;
			}

			this.draggedItemEvent = event;
			this.draggedFile = event.file;
			// where the previous drag landed must not decide where this one does
			this.lastTargetItem = null;
			this.lastTargetPosition = null;
			this.axis = event.axis || this.axis;
			// eslint-disable-next-line no-param-reassign
			event.event.dataTransfer.effectAllowed = 'move';
		},
		onItemDragEnd(event)
		{
			event.event.preventDefault();

			delete this.highlightDropzone.fileId;
			delete this.highlightDropzone.position;

			// a dragend can come without a dragstart behind it, or twice: there is nothing to reorder then
			if (!this.draggedFile)
			{
				return;
			}

			// a drag that never hovered an item of the batch has no target: the order stays as it was
			if (!this.lastTargetItem)
			{
				this.draggedFile = null;

				return;
			}

			const order: Array<string> = [...this.order];
			const currentFileIndex = order.indexOf(this.draggedFile.id);
			// the dragged file left the batch during the gesture: splicing at -1 would drop a stranger
			if (currentFileIndex === -1)
			{
				this.draggedFile = null;

				return;
			}

			// the gap the drop mark points at, counted in the order the drag started from
			const dropIndex = (() => {
				const index = order.indexOf(this.lastTargetItem?.id);
				if (this.lastTargetPosition === 'before')
				{
					return index;
				}

				return index + 1;
			})();

			order.splice(currentFileIndex, 1);
			// taking the dragged file out moves every gap behind it one position left
			const insertIndex = dropIndex > currentFileIndex ? dropIndex - 1 : dropIndex;
			order.splice(insertIndex, 0, this.draggedFile.id);

			this.order = order;
			this.draggedFile = null;
		},
		onItemDragOver(event)
		{
			if (this.draggedFile)
			{
				event.event.preventDefault();

				const currentTarget = event.file;
				const currentTargetPosition = (() => {
					const targetRect = event.event.currentTarget.getBoundingClientRect();
					const targetCenter = (() => {
						if (this.axis === 'x')
						{
							return targetRect.left + (targetRect.width / 2);
						}

						return targetRect.top + (targetRect.height / 2);
					})();

					if (
						(this.axis === 'x' && event.event.x > targetCenter)
						|| (this.axis === 'y' && event.event.y > targetCenter)
					)
					{
						return 'after';
					}

					return 'before';
				})();

				if (
					currentTarget !== this.lastTargetItem
					|| (
						currentTarget === this.lastTargetItem
						&& currentTargetPosition !== this.lastTargetPosition
					)
				)
				{
					this.lastTargetPosition = currentTargetPosition;
					this.lastTargetItem = currentTarget;

					this.highlightDropzone = {
						fileId: currentTarget.id,
						position: currentTargetPosition,
					};
				}
			}
		},
		onFilesSelected(files: File[])
		{
			void this.addFiles(files);
		},
		onFilesDropped(files: File[])
		{
			void this.addFiles(files);
		},
		async onPaste(event: ClipboardEvent)
		{
			if (!this.canAddFiles || !event.clipboardData || !isFilePasted(event.clipboardData))
			{
				return;
			}

			event.preventDefault();

			await this.addFiles(await getFilesFromDataTransfer(event.clipboardData));
		},
		// the single add path of the batch: the input selection, an external drop and a paste all come here
		async addFiles(files: File[])
		{
			if (!this.canChangeComposition || !Type.isArrayFilled(files))
			{
				return;
			}

			try
			{
				// the display mode travels with the add: the uploader decides on compression while loading
				const { errors, overLimitCount } = await this.uploadManager.addFilesToPreview({
					files,
					dialogId: this.dialogId,
					messageId: this.editedMessageId,
					sendAsFile: this.sendAsFile,
					// the composition lives here, so the limit of the add is counted on what is shown
					compositionCount: this.filesCount,
				});

				errors.forEach((error: ResolvedValidationError) => {
					Notifier.file.showValidationError(error.text);
				});

				// the limit message below the batch is a state hint; this add needs an answer of its own
				if (overLimitCount > 0)
				{
					Notifier.file.showValidationError(this.filesLimitMessage);
				}
			}
			catch (error)
			{
				// the add can fail before a single file joins the batch, and then the pick looks ignored
				Logger.error('UploadPreviewContent: adding files to the batch failed', error);
				Notifier.onDefaultError();
			}
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
			ref="container"
			class="bx-im-upload-preview__container"
			data-testid="im-upload-preview-container"
			:data-edit-mode="isEditMode"
			:aria-busy="isSaving"
			@paste="onPaste"
		>
			<!-- One hint for the whole collection: Delete removes the focused cell in either branch, so a
			     media tile has to be told about the key on the same terms as a file row. -->
			<span :id="deleteHintId" class="bx-im-textarea__sr-only">{{
				loc('IM_TEXTAREA_UPLOAD_PREVIEW_DELETE_ARIA')
			}}</span>
			<div ref="preview" class="bx-im-upload-preview__preview">
				<!-- One grid over the whole batch, not one per chunk: a batch above ten files is split into
				     several chunks, and the arrows have to cross that split. The chunks and the gallery roots
				     inside them are presentational, so every row belongs to this grid. -->
				<div
					ref="itemsContainer"
					class="bx-im-upload-preview__items-container"
					role="grid"
					:aria-label="loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_ITEMS_ARIA')"
					data-testid="im-upload-preview-items"
					@keydown="onItemsKeyDown"
				>
					<div
						v-if="isEmptyComposition"
						class="bx-im-upload-preview__empty"
						data-testid="im-upload-preview-empty"
					>
						<UiIllustration
							:name="IllustrationName.DOCUMENT"
							:size="EMPTY_ILLUSTRATION_SIZE"
						/>
						<div class="bx-im-upload-preview__empty-body">
							<TextXs className="bx-im-upload-preview__empty-title">
								{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_EMPTY_TITLE') }}
							</TextXs>
							<Text2Xs className="bx-im-upload-preview__empty-hint">
								{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_EMPTY_HINT') }}
							</Text2Xs>
						</div>
					</div>
					<div
						v-if="isGalleryMode"
						v-for="chunk in chunks"
						class="bx-im-upload-preview__items-chunk"
						role="presentation"
					>
						<MediaGallery
							:files="chunk"
							:width="GALLERY_WIDTH"
							:allowRemoveItem="canChangeComposition"
							:removeItemLabel="loc('IM_TEXTAREA_UPLOAD_PREVIEW_REMOVE_FILE_ARIA')"
							:allowSorting="canChangeComposition"
							:handleLoading="isSaving"
							:allowCancelItem="false"
							:gridNavigation="true"
							:describedById="deleteHintId"
							:viewerGroupBy="sessionId"
							@removeItem="onRemoveItem"
							@itemDragStart="onItemDragStart"
							@itemDragEnd="onItemDragEnd"
							@itemDragOver="onItemDragOver"
							:highlightDropzone="highlightDropzone"
						/>
					</div>
					<div
						v-else
						v-for="chunk in chunks"
						class="bx-im-upload-preview__items-chunk"
						role="presentation"
					>
						<div v-for="fileItem in chunk" :key="fileItem.id" role="row">
							<FileItem
								:file="fileItem"
								:isEditMode="isEditMode"
								:removable="canChangeComposition"
								:allowSorting="canChangeComposition"
								:handleLoading="isSaving"
								:viewerGroupBy="sessionId"
								:describedById="deleteHintId"
								@removeItem="onRemoveItem"
								@retryItem="onRetryItem"
								@itemDragStart="onItemDragStart"
								@itemDragEnd="onItemDragEnd"
								@itemDragOver="onItemDragOver"
								:highlightDropzone="highlightDropzone"
							/>
						</div>
					</div>
				</div>
				<PreviewDropZone
					:container="dropZoneContainer"
					:disabled="isExternalDropDisabled"
					@filesDropped="onFilesDropped"
				/>
			</div>
			<div class="bx-im-upload-preview__controls-container">
				<div
					v-if="isSaving"
					class="bx-im-upload-preview__saving"
					data-testid="im-upload-preview-saving"
				>
					<LineLoader :width="SAVING_LOADER_WIDTH" :height="SAVING_LOADER_HEIGHT" />
					<TextMd className="bx-im-upload-preview__saving-text">
						{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_SAVING') }}
					</TextMd>
				</div>
				<AddMoreButton
					v-if="showAddMoreButton"
					ref="addMore"
					:dialogId="dialogId"
					:disabled="isAddMoreDisabled"
					:disabledReason="filesLimitMessage"
					@filesSelected="onFilesSelected"
				/>
				<!-- The batch reaching its limit answers what the user just did, so it is spoken and not only
				     drawn: role="status" announces it politely, without taking the focus away. -->
				<div
					v-if="showFilesLimitMessage"
					class="bx-im-upload-preview__controls-files-limit-message"
					role="status"
					data-testid="im-upload-preview-files-limit-message"
				>
					<span>{{ filesLimitMessage }}</span>
				</div>
				<div
					v-if="hasFailedFiles"
					class="bx-im-upload-preview__controls-upload-error-message"
					data-testid="im-upload-preview-upload-error-message"
				>
					<BIcon
						v-if="isEditMode"
						:name="OutlineIcons.EXCLAMATION_CIRCLE"
						class="bx-im-upload-preview__controls-upload-error-message-icon"
					/>
					<TextXs v-if="isEditMode" className="bx-im-upload-preview__controls-upload-error-message-text">
						{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILE_UPLOAD_HINT') }}
					</TextXs>
					<span v-else>{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILE_UPLOAD_HINT') }}</span>
				</div>
				<div v-if="isMediaOnly && !isEditMode" class="bx-im-upload-preview__control-compress-image">
					<!-- The Tab stop is stated here for the same reason the buttons of the area state theirs:
					     WebKit keeps a bare checkbox out of the Tab order until full keyboard access is turned
					     on in the OS. The checkbox of the design system declares inheritAttrs: false and binds
					     $attrs on its native <input>, so the attribute lands on the focusable node itself. -->
					<Checkbox
						:id="compressCheckboxId"
						v-model="sendAsFile"
						:size="CheckboxSize.Lg"
						tabindex="0"
						data-testid="im-upload-preview-send-as-file-checkbox"
					/>
					<TextMd
						tag="label"
						:for="compressCheckboxId"
						className="bx-im-upload-preview__control-compress-image-label"
					>
						{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_SEND_WITHOUT_COMPRESSION') }}
					</TextMd>
				</div>
				<!-- The ring of this wrapper belongs to the caption field, not to everything inside it: the
				     send button is the other focusable child, and it carries a ring of its own. -->
				<div
					ref="messageTextWrapper"
					class="bx-im-upload-preview__message-text__wrapper"
					:class="{ '--focus-outline': isCaptionFocused }"
				>
					<!-- The name of the field is a label of its own, not the placeholder: the placeholder is a
					     call to act and disappears with the first character typed, while the name has to keep
					     telling what the field holds once there is something in it. -->
					<textarea
						ref="messageText"
						v-model="text"
						v-bind="mentionComboboxAttrs"
						:placeholder="captionPlaceholder"
						:aria-label="captionAriaLabel"
						:maxlength="inputMaxLength"
						:style="{'height': textareaHeightStyle}"
						class="bx-im-upload-preview__message-text"
						data-testid="im-upload-preview-input"
						rows="1"
						@keydown="onKeyDownHandler"
						@focus="onCaptionFocus"
						@blur="onCaptionBlur"
						@mouseup="onMouseUp"
					></textarea>
					<div class="bx-im-upload-preview__message-text__actions">
						<div
							v-if="showInputLengthCounter"
							class="bx-im-upload-preview__message-text__counter"
							data-testid="im-upload-preview-input-counter"
						>
							<!-- The bare number is for the eye only: aria-hidden keeps it out of the live
							     region below, otherwise the count is spoken twice on every keystroke. -->
							<span aria-hidden="true">{{ allowedTextLimit }}</span>
							<span class="bx-im-textarea__sr-only" role="status">{{ charsLeftLabel }}</span>
						</div>
						<SendButton
							:dialogId="dialogId"
							:editMode="isEditMode"
							:isDisabled="isSendDisabled"
							:isLoading="isSaving"
							:isStopGenerationState="isStopGenerationState"
							:data-testid="isEditMode ? 'im-upload-preview-save-btn' : 'im-upload-preview-send-btn'"
							@click="onSend"
							@stop="onStopGeneration"
						/>
					</div>
					<div @mousedown="onResizeStart" class="bx-im-upload-preview__message-text__drag-handle"></div>
				</div>
			</div>
			<MentionPopup
				v-if="showMention"
				:bindElement="$refs.messageTextWrapper"
				:dialogId="dialogId"
				:query="mentionQuery"
				:targetContainer="getMentionPopupTargetContainer()"
				:withCopilot="withCopilot"
				:target="TextareaTarget.uploadCaption"
				@close="closeMentionPopup"
				@onFocusTextarea="focusTextarea"
			/>
			<FormatToolbar
				v-if="showFormatToolbar"
				:dialogId="dialogId"
				:textarea="$refs.messageText"
				:targetPosition="formatToolbarPosition"
				:useMarkdown="isMarkdownInputAvailable"
				@updateText="onFormatToolbarUpdateText"
				@close="onHideFormatToolbar"
			/>
		</div>
	`,
};
