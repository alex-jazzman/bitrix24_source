import { type Popup } from 'main.popup';
import { FocusTrap } from 'ui.a11y';
import { type UploaderFile } from 'ui.uploader.core';
import { mapState } from 'ui.vue3.vuex';

import { Spinner } from 'im.v2.component.elements.loader';
import { MessengerAirPopup } from 'im.v2.component.elements.air-popup';
import { DraftManager } from 'im.v2.lib.draft';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelFile } from 'im.v2.model';
import { UploadingService } from 'im.v2.provider.service.uploading';

import { UploadPreviewContent } from './upload-preview-content';

import '../../css/upload-preview/upload-preview-popup.css';

const POPUP_ID = 'im-chat-upload-preview-popup';
const POPUP_WIDTH = 400;

// @vue/component
export const UploadPreviewPopup = {
	name: 'UploadPreviewPopup',
	components: { MessengerAirPopup, UploadPreviewContent, Spinner },
	props:
	{
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
		// Where the focus trap puts focus when it lets go: the composer owns the answer.
		restoreFocusTarget: {
			type: Function,
			default: null,
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
	emits: ['close', 'sendFiles', 'saveFiles'],
	data()
	{
		return {
			isContentReady: false,
			batchFilesCount: null,
			// a shared DOM id would collide the teleport targets of two mounted textareas
			popupId: `${POPUP_ID}-${Utils.text.getUuidV4()}`,
		};
	},
	computed:
	{
		POPUP_ID: () => POPUP_ID,
		POPUP_WIDTH: () => POPUP_WIDTH,
		// the session keeps its files outside Vue reactivity, so the store keys are what makes the batch
		// reactive: a file joining it adds a key here
		...mapState({
			storeFileIds: (state) => Object.keys(state.files.collection),
		}),
		files(): Array<ImModelFile>
		{
			const knownFileIds: Set<string> = new Set(this.storeFileIds);

			return this.getUploadingService().getPreviewSessionFiles(this.sessionId)
				.filter((file: UploaderFile) => knownFileIds.has(file.getId()))
				.map((file: UploaderFile) => this.$store.getters['files/get'](file.getId()));
		},
		isEditMode(): boolean
		{
			return this.editedMessageId !== null;
		},
		// the count belongs to the send alone: an edit names the message it changes, and the composition
		// of that message is what the window itself shows
		title(): string
		{
			if (this.isEditMode)
			{
				return this.$Bitrix.Loc.getMessage('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_EDIT_TITLE');
			}

			return this.$Bitrix.Loc.getMessage(
				'IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_COMPUTED_TITLE',
				{ '#COUNT#': this.titleFilesCount },
			);
		},
		// the batch is composed in the content: the session alone knows only what has just been added
		titleFilesCount(): number
		{
			return this.batchFilesCount ?? this.files.length;
		},
		// only the files of the session are waited for: a preview the server never sent would keep the spinner
		// forever, as isContentReady latches on the first true and is never taken back
		isReady(): boolean
		{
			return this.files.every((file: ImModelFile) => {
				return file.image !== null;
			});
		},
	},
	watch:
	{
		isReady(isReady: boolean)
		{
			if (isReady)
			{
				this.isContentReady = true;
			}
		},
	},
	created()
	{
		// once shown, the content stays: a file joining later must not swap it back to the spinner and
		// lose the caption being edited
		this.isContentReady = this.isReady;
		// a class with private fields: Vue's reactive proxy would break them
		this.focusTrap = null;
	},
	mounted()
	{
		// the wrapper owns the markup of the popup and builds it while being created, so its getPopup
		// already has the popup to hand over here
		const popup = this.$refs.airPopup?.getPopup?.();
		if (!popup)
		{
			return;
		}

		this.markAsModalDialog(popup.getPopupContainer());
		this.holdFocusInside(popup);
	},
	beforeUnmount()
	{
		this.destroyFocusTrap();
	},
	methods:
	{
		onSendFiles(event)
		{
			this.$emit('sendFiles', event);
			this.onClose();
		},
		// every way out of the dialog comes through here, and the trap has to let go while the popup is
		// still in the document: the wrapper destroys it right after the close, and the trap drops the
		// isolation of the page by walking the ancestors of the container - a detached one has none
		onClose()
		{
			this.destroyFocusTrap();
			if (this.isEditMode)
			{
				DraftManager.getInstance().setDraftText(this.draftKey, '');
			}

			this.$emit('close');
		},
		markAsModalDialog(container: HTMLElement)
		{
			// main.popup already gives its containers the dialog role and marks an overlay popup modal: this
			// states both on the container of this dialog instead of leaning on those defaults
			container.setAttribute('role', 'dialog');
			container.setAttribute('aria-modal', 'true');
		},
		// main.popup builds a focus trap of its own once the accessibility setting is on. Two traps over one
		// container fight over the isolation: the second leaves inert where the first put it, and its
		// restore then finds its own target inert and gives up. So an existing trap is handed the target.
		holdFocusInside(popup: Popup)
		{
			const popupFocusTrap = popup.getFocusTrap();
			if (popupFocusTrap)
			{
				popupFocusTrap.setRestoreFocus(this.restoreFocusTarget);

				return;
			}

			this.focusTrap = new FocusTrap(popup.getPopupContainer(), {
				// real modality: everything outside goes under inert
				isolateOutside: true,
				looped: true,
				restoreFocus: this.restoreFocusTarget,
				// the content puts the caret in the caption field itself, and it mounts only once the files
				// are ready
				initialFocus: false,
			});
			this.focusTrap.activate();
		},
		destroyFocusTrap()
		{
			this.focusTrap?.destroy();
			this.focusTrap = null;
		},
		getUploadingService(): UploadingService
		{
			return UploadingService.getInstance();
		},
	},
	template: `
		<MessengerAirPopup
			ref="airPopup"
			:id="popupId"
			:testId="POPUP_ID"
			:title="title"
			:width="POPUP_WIDTH"
			className="bx-im-upload-preview__scope"
			hasOverlay
			:hasHorizontalPadding="false"
			:hasVerticalPadding="false"
			:closeByEsc="true"
			@close="onClose"
		>
			<UploadPreviewContent
				v-if="isContentReady"
				:dialogId="dialogId"
				:sessionId="sessionId"
				:textareaValue="textareaValue"
				:draftKey="draftKey"
				:mentionReplacementMap="mentionReplacementMap"
				:withCopilot="withCopilot"
				:editedMessageId="editedMessageId"
				:isSaving="isSaving"
				:canRemoveFilesFromServer="canRemoveFilesFromServer"
				@update:filesCount="batchFilesCount = $event"
				@close="onClose"
				@sendFiles="onSendFiles"
				@saveFiles="$emit('saveFiles', $event)"
			/>
			<div v-else class="bx-im-upload-preview-popup-preparing" data-testid="im-upload-preview-preparing">
				<Spinner></Spinner>
			</div>
		</MessengerAirPopup>
	`,
};
