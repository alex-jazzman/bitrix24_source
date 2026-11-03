import { Dom, Extension, Runtime, Type, Text, Event, type JsonObject } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { FileOrigin, getFilesFromDataTransfer, isFilePasted, type UploaderFile } from 'ui.uploader.core';
import { markRaw } from 'ui.vue3';

import { Core } from 'im.v2.application.core';
import { IconButton } from 'im.v2.component.elements.icon-button';
import { SendButton } from 'im.v2.component.elements.send-button';
import {
	ActionByRole,
	EventType,
	HotkeyCombination,
	LocalStorageKey,
	PlacementType,
	SoundType,
	TextareaPanelType as PanelType,
	TextareaTarget,
	ChatType,
	Color,
	type InsertTextEvent,
	type InsertMentionEvent,
} from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { showDeleteEmptyMessageConfirm } from 'im.v2.lib.confirm';
import { CopilotManager } from 'im.v2.lib.copilot';
import { DraftManager } from 'im.v2.lib.draft';
import { EscEventAction } from 'im.v2.lib.esc-manager';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { isSendMessageCombination, isNewLineCombination, isTextDecorationCombination } from 'im.v2.lib.hotkey';
import { InputAction } from 'im.v2.lib.input-action';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { Logger } from 'im.v2.lib.logger';
import { MarketManager } from 'im.v2.lib.market';
import { MessageManager } from 'im.v2.lib.message';
import { Notifier } from 'im.v2.lib.notifier';
import { Parser } from 'im.v2.lib.parser';
import { PermissionManager } from 'im.v2.lib.permission';
import { SoundNotificationManager } from 'im.v2.lib.sound-notification';
import { Textarea } from 'im.v2.lib.textarea';
import {
	UploadManager,
	type MultiUploadingResult,
	type ResolvedValidationError,
} from 'im.v2.lib.uploading';
import { Utils } from 'im.v2.lib.utils';
import {
	Capability,
	CapabilityResolver,
	UnsentVoiceRecords,
	type VoiceRecord,
} from 'im.v2.lib.voice-recorder';
import { type ImModelChat, type ImModelFile, type ImModelMessage } from 'im.v2.model';
import { MessageService, type EditMessageResult } from 'im.v2.provider.service.message';
import { SendingService, type PanelContextWithMultipleIds } from 'im.v2.provider.service.sending';
import {
	UploadingService,
	VoiceSendFailure,
	type DestroyUploaderOptions,
} from 'im.v2.provider.service.uploading';

import { FormatToolbarManager, type BindPosition } from './classes/format-toolbar-manager';
import { InputSenderService } from './classes/input-sender-service';
import { MentionListEvents, type MentionActiveItemEvent } from './classes/mention-detector';
import { MentionDetector, MentionDetectorEvents, MentionReplacementMap } from './classes/mentions';
import { ResizeDirection, ResizeManager } from './classes/resize-manager';
import { SlashCommandManager, SlashCommandManagerEvents, getCurrentLineText, isSlashLineStillOpen } from './classes/slash-command-manager';
import { AudioInput } from './components/audio-input/audio-input';
import { AutoDeleteSelector } from './components/auto-delete-selector/auto-delete-selector';
import { EmoteSelector } from './components/emote-selector/emote-selector';
import { FormatToolbar } from './components/format-toolbar/format-toolbar';
import { createMentionGridIds } from './components/mention/helpers/helpers';
import { MentionPopup } from './components/mention/mention-popup';
import { TextareaPanel } from './components/panel/panel';
import { SlashCommandItemsChangedEvent } from './components/slash-command/slash-command-content';
import { SlashCommandPopup } from './components/slash-command/slash-command-popup';
import { UploadMenu } from './components/upload-menu/upload-menu';
import { UploadPreviewPopup } from './components/upload-preview/upload-preview-popup';
import { VoiceRecorderButton } from './components/voice-recorder/voice-recorder-button';

import './css/textarea.css';

export { canAddToChat } from './components/mention/helpers/can-add-to-chat';
export { MentionAddUserService } from './components/mention/classes/add-user-service';
// re-exported for the recording panel: it is loaded apart from the field and draws this very button
export { VoiceRecorderButton };

type EditContext = {
	messageId: number,
	newText: string,
	dialogId: string,
	draftKey: string,
	isVideoNote: boolean,
};

export const BeforeSendMessageAction = {
	proceed: 'proceed',
	cancel: 'cancel',
	cancelKeepText: 'cancelKeepText',
};
const MESSAGE_ACTION_PANELS = new Set([PanelType.edit, PanelType.reply, PanelType.forward]);
// What became of the composition of the batch an edit is composing: the copies its files got in the chat
// folder are ours to delete only while it is unsent, and an answer that never came does not make it so.
const EditedCompositionFate = {
	unsent: 'unsent',
	sent: 'sent',
	applied: 'applied',
};
const TextareaHeight = {
	max: 400,
	min: 22,
};
const ICON_SIZE = 24;
// every send takes its own id, so it can only release the hold it took itself
let lastTypedTextHoldId = 0;

// loaded on the first press and not with the chat: only the user who pressed the microphone needs it
const VOICE_RECORDING_EXTENSION = 'im.v2.lib.voice-recorder.recording';

type VoiceRecordingExtension = {
	RecordingPanel: Object,
};

const VOICE_RECORD_NAME = 'voice-message';
// the storage reads the kind of a file from its extension: an mp4 container of audio has to arrive
// as m4a, or the chat would show a video
const VOICE_RECORD_EXTENSION_BY_SUBTYPE = { mp4: 'm4a' };
const VOICE_RECORD_DEFAULT_EXTENSION = 'm4a';

// @vue/component
export const ChatTextarea = {
	components: {
		BIcon,
		UploadMenu,
		EmoteSelector,
		SendButton,
		UploadPreviewPopup,
		MentionPopup,
		SlashCommandPopup,
		TextareaPanel,
		AudioInput,
		AutoDeleteSelector,
		IconButton,
		FormatToolbar,
		VoiceRecorderButton,
	},
	props: {
		dialogId: {
			type: String,
			default: '',
		},
		placeholder: {
			type: String,
			default: '',
		},
		withMarket: {
			type: Boolean,
			default: true,
		},
		withEdit: {
			type: Boolean,
			default: true,
		},
		withDraft: {
			/** @type boolean | { draftDialogId: string } */
			type: [Boolean, Object],
			default: true,
		},
		withUploadMenu: {
			type: Boolean,
			default: true,
		},
		withSmileSelector: {
			type: Boolean,
			default: true,
		},
		withAutoFocus: {
			type: Boolean,
			default: true,
		},
		withMention: {
			type: Boolean,
			default: true,
		},
		withSlashCommand: {
			type: Boolean,
			default: true,
		},
		withCopilot: {
			type: Boolean,
			default: true,
		},
		// default off: untouched surfaces keep their existing input behavior; enabling surfaces opt in
		withKeyboardNavigation: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		deferredDialogPromise: {
			type: Object,
			default: null,
		},
		// Opt-in for a local AI-assistant temp whose readiness request has failed.
		// The attempt can only reach onBeforeSendMessage; it never reaches a transport.
		allowBeforeSendOnUninitedTemp: {
			type: Boolean,
			default: false,
		},
		heightConfig: {
			/** @type {{ storageKey?: string, minHeight?: number }} */
			type: Object,
			default: () => ({}),
		},
	},
	emits: ['mounted', 'textChange'],
	// The ids of the mention grid belong to this composer, not to the module: the field points at them
	// with aria-controls and aria-activedescendant, the grid renders them, and the manager resolves the
	// action cell of the active row by them. Built here, where the field lives, and handed to the grid
	// subtree - `provide` runs before `created`, so the set exists before any child asks for it.
	provide()
	{
		this.mentionGridIds = createMentionGridIds();

		return { mentionGridIds: this.mentionGridIds };
	},
	data(): JsonObject
	{
		return {
			text: '',
			textareaHeight: this.heightConfig.minHeight ?? TextareaHeight.min,

			showMention: false,
			mentionQuery: '',
			mentionActiveItemId: null,
			mentionReplacementMap: null,

			showSlashCommand: false,
			slashCommandQuery: '',
			slashCommandHasItems: false,

			showUploadPreviewPopup: false,
			previewPopupUploaderIds: [],
			previewPopupUploadingId: null,
			previewPopupSourceFilesCount: 0,
			previewSessionId: null,
			previewSessionMessageId: null,
			isSavingEditedFiles: false,
			editedCompositionFate: EditedCompositionFate.unsent,
			typedTextHoldId: 0,

			panelType: PanelType.none,
			panelContext: {
				messageId: 0,
			},

			showFormatToolbar: false,
			formatToolbarPosition: {},

			voiceCapability: null,
			recordingPanel: null,
			isVoiceRecording: false,
			isVoiceRecordingLocked: false,
			// whether a pointer stood behind the press that opened the panel: the panel answers by it
			// where the focus of the start goes
			isVoiceStartedFromPointer: false,
			// the record shown by this field stays reactive; the queues and blobs behind it do not
			shownVoiceRecord: null,
			isAudioInputActive: false,

			dialogReady: !this.deferredDialogPromise,

		};
	},
	computed:
	{
		OutlineIcons: () => OutlineIcons,
		ICON_SIZE: () => ICON_SIZE,
		heightStorageKey(): string
		{
			return this.heightConfig.storageKey ?? LocalStorageKey.textareaHeight;
		},
		minHeight(): number
		{
			return this.heightConfig.minHeight ?? TextareaHeight.min;
		},
		draftKey(): string
		{
			if (Type.isPlainObject(this.withDraft))
			{
				return this.withDraft.draftDialogId || this.dialogId;
			}

			return this.dialogId;
		},
		isMarkdownInputAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isMarkdownAvailable);
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		dialogInited(): boolean
		{
			return this.dialog.inited || !this.dialogReady;
		},
		replyMode(): boolean
		{
			return this.panelType === PanelType.reply;
		},
		replyIdForContent(): number | void
		{
			// media/file replies bind to the original only when the server feature is enabled
			if (!this.replyMode || !FeatureManager.isFeatureAvailable(Feature.isReplyWithMediaAvailable))
			{
				return undefined;
			}

			return this.panelContext.messageId;
		},
		forwardMode(): boolean
		{
			return this.panelType === PanelType.forward;
		},
		editMode(): boolean
		{
			return this.panelType === PanelType.edit;
		},
		// a voice message is one lone file the server marked as recorded voice, the way it reads it itself
		isEditingVoiceMessage(): boolean
		{
			const message: ?ImModelMessage = this.$store.getters['messages/getById'](this.panelContext.messageId);
			if (!message || message.files.length !== 1)
			{
				return false;
			}

			const file: ?ImModelFile = this.$store.getters['files/get'](message.files[0], true);

			return file?.isVoiceNote === true;
		},
		// a file attached while the edit panel is open belongs to the message being edited, not to a
		// new one: without the scope the batch joins the draft and leaves as separate messages
		panelEditedMessageId(): ?number
		{
			if (!this.editMode || !FeatureManager.isFeatureAvailable(Feature.isEditMessageFilesAvailable))
			{
				return null;
			}

			// where the product keeps files out of an edit the whole scope goes, and files fall back to the draft
			if (this.isOpenLinesChat || this.isCopilotOrAiAssistantChat || this.isEditingVoiceMessage)
			{
				return null;
			}

			// the panel context is restored from the drafts of the client, and nothing there promises a number
			const messageId = Number(this.panelContext.messageId);

			return Number.isInteger(messageId) && messageId > 0 ? messageId : null;
		},
		isEditingAttachments(): boolean
		{
			return Boolean(this.previewSessionMessageId);
		},
		// the copies of the files may be part of a published edit once the composition left the client. The
		// window is bound to this rule and not to the held-batch one: a draft window always took the copy
		// of a removed file with it, and there is no batch of an edit to ask about
		isEditedCompositionSent(): boolean
		{
			return this.editedCompositionFate !== EditedCompositionFate.unsent;
		},
		// the batch this textarea holds gives up its copies in the chat folder only while the composition
		// is unsent: the window stays closable for the whole of the save
		canRemoveHeldFilesFromServer(): boolean
		{
			return this.isEditingAttachments && !this.isEditedCompositionSent;
		},
		marketMode(): boolean
		{
			return this.panelType === PanelType.market;
		},
		isDisabled(): boolean
		{
			if (this.disabled)
			{
				return true;
			}

			return this.text.trim() === '' && !this.editMode && !this.forwardMode;
		},
		isAudioInputDisabled(): boolean
		{
			if (!this.dialogReady)
			{
				return true;
			}

			return Boolean(Utils.dialog.isTempAiAssistantDialogId(this.dialogId));
		},
		isVoiceRecorderDisabled(): boolean
		{
			// the dictation holds the microphone while it runs, and both cannot have the device at once
			return this.disabled || !this.dialogReady || this.isAudioInputActive;
		},
		// the panel is given the record it opened on and nothing else: a refusal that arrives while it
		// stands there waits in the queue instead of replacing what the user is looking at
		voiceRecordReturned(): ?VoiceRecord
		{
			return this.shownVoiceRecord?.record ?? null;
		},
		voiceSendFailure(): string
		{
			return this.shownVoiceRecord?.failure ?? '';
		},
		isVoiceRecordingAllowedInChat(): boolean
		{
			if (this.isOpenLinesChat || this.dialog.type === ChatType.copilot)
			{
				return false;
			}

			if (Utils.dialog.isTempAiAssistantDialogId(this.dialogId))
			{
				return false;
			}

			// a bot among the members of a group chat blocks nothing: only a dialog whose counterpart
			// is a bot has nobody on the other side to listen to a voice message
			const isBotDialog = this.dialog.type === ChatType.user
				&& Boolean(this.$store.getters['users/bots/getByUserId'](this.dialogId));

			return !isBotDialog;
		},
		showVoiceRecorderButton(): boolean
		{
			if (this.voiceCapability === null || this.voiceCapability === Capability.unavailable)
			{
				return false;
			}

			// the microphone takes the place of the send button while there is nothing to send;
			// an edit and a forward keep their own send button whatever the field holds
			if (!this.isEmptyText || this.editMode || this.forwardMode)
			{
				return false;
			}

			// an open upload preview owns the send flow: a record started here would make a second batch
			if (this.previewSessionId)
			{
				return false;
			}

			return this.isVoiceRecordingAllowedInChat
				&& PermissionManager.getInstance().canPerformActionByRole(ActionByRole.send, this.dialogId);
		},
		isStopGenerationState(): boolean
		{
			return !this.editMode && this.copilotManager.isStopGenerationAvailable(this.dialogId);
		},
		baseTextareaPlaceholder(): string
		{
			if (FeatureManager.isFeatureAvailable(Feature.copilotActive))
			{
				return this.loc('IM_TEXTAREA_PLACEHOLDER_MSGVER_1');
			}

			return this.loc('IM_TEXTAREA_PLACEHOLDER_WITHOUT_AI');
		},
		textareaPlaceholder(): string
		{
			// the window of the edit holds the text of the message, so the field of the panel is out of the
			// edit while it is open - and the placeholder is what says so, the field having no other label
			if (this.isEditingAttachments)
			{
				return this.loc('IM_TEXTAREA_PLACEHOLDER_EDITING_ATTACHMENTS');
			}

			if (!this.placeholder)
			{
				return this.baseTextareaPlaceholder;
			}

			return this.placeholder;
		},
		textareaStyle(): Object
		{
			let height = `${this.textareaHeight}px`;
			if (this.textareaHeight === 'auto')
			{
				height = 'auto';
			}

			return {
				height,
				maxHeight: height,
			};
		},
		textareaMaxLength(): number
		{
			const settings = Extension.getSettings('im.v2.component.textarea');

			return settings.get('maxLength');
		},
		isEmptyText(): boolean
		{
			return this.text === '';
		},
		showAreaFocusOutline(): boolean
		{
			// only the opt-in half of the condition: the area holds focus itself here, so :focus-visible in
			// the stylesheet supplies the other half - including keeping the ring off a mouse click.
			return this.withKeyboardNavigation;
		},
		isAutoDeleteEnabled(): boolean
		{
			return this.$store.getters['chats/autoDelete/isEnabled'](this.dialog.chatId);
		},
		marketIconColor(): string
		{
			if (this.marketMode)
			{
				return Color.accentBlue;
			}

			return Color.gray40;
		},
		slashCommandIconColor(): string
		{
			// match the attach icon (UploadMenu): accent while the popup is open, resting otherwise
			if (this.showSlashCommand)
			{
				return Color.accentBlue;
			}

			return Color.gray40;
		},
		// while the mention list is open the field points at it, but stays a multiline text box: ARIA in
		// HTML allows no role on <textarea>, and aria-expanded is not among the attributes a text box may
		// carry, so neither may be put here. What is left is enough - aria-activedescendant is valid on a
		// text box and is what actually voices the walk over the list, while aria-haspopup and
		// aria-controls are global. With the list closed every reference is dropped in one go, so no
		// attribute is ever left pointing at a grid that is no longer rendered.
		mentionComboboxAttrs(): JsonObject
		{
			if (!this.withMention || !this.showMention)
			{
				return {};
			}

			// the grid renders only while it has items, so both references to it appear together:
			// pointing either of them at a missing node would be a broken relation for a screen reader
			const gridRendered = this.mentionActiveItemId !== null;

			return {
				'aria-haspopup': 'grid',
				'aria-autocomplete': 'list',
				'aria-controls': gridRendered ? this.mentionGridIds.gridId : null,
				'aria-activedescendant': this.mentionActiveItemId,
			};
		},
		isGuest(): boolean
		{
			return this.$store.getters['users/isGuest'](Core.getUserId());
		},
		showMarketIcon(): boolean
		{
			return this.withMarket && !this.isGuest;
		},
		isOpenLinesChat(): boolean
		{
			// Both id forms are checked next to the type: an open line can be addressed by its
			// external id before the chat entity is in the store, and then the type is not known yet
			return this.dialog.type === ChatType.lines
				|| Utils.dialog.isLinesExternalId(this.dialogId)
				|| Utils.dialog.isLinesHistoryId(this.dialogId);
		},
		isCopilotOrAiAssistantChat(): boolean
		{
			return (new CopilotManager()).isCopilotChatOrBot(this.dialogId)
				|| this.$store.getters['users/bots/isAiAssistant'](this.dialogId)
				|| Utils.dialog.isTempAiAssistantDialogId(this.dialogId);
		},
		slashCommandEnabled(): boolean
		{
			// im.v2.Chat.Command.list is not in the guest controller allowlist, so the trigger,
			// the popup and the button stay hidden for a guest instead of opening a popup whose
			// only possible outcome is ACCESS_DENIED
			return this.withSlashCommand
				&& !this.isGuest
				&& FeatureManager.isFeatureAvailable(Feature.isChatBotCommandsAvailable)
				&& !this.isOpenLinesChat
				&& !this.isCopilotOrAiAssistantChat;
		},
		showSlashCommandButton(): boolean
		{
			return this.slashCommandEnabled
				&& this.dialog.type === ChatType.user
				&& Boolean(this.$store.getters['users/bots/getByUserId'](this.dialogId));
		},
	},
	watch:
	{
		dialogId()
		{
			// a record shown in the chat the field is leaving goes back into the queue of that chat:
			// it is offered again when the user comes back, and it exists nowhere else
			this.queueShownVoiceRecord();
			// the field is reused between chats: a recording left running would be sent to the chat
			// the user has already left. The panel frees the microphone stream as it goes.
			this.isVoiceRecording = false;
			void this.showReturnedVoiceRecord();
		},
		// the panel closes the same way whatever ended the recording, so the flag gives both edges
		isVoiceRecording(isRecording: boolean)
		{
			if (isRecording)
			{
				this.getInputActionService().startAction(InputAction.recordingVoice);

				return;
			}

			this.getInputActionService().stopAction(InputAction.recordingVoice);
			// a refusal that arrived over a recording of its own has been waiting for the panel to be free
			void this.showReturnedVoiceRecord();
		},
		text(newValue)
		{
			// the caret saved on leaving the field belongs to the text that was there then; once the text
			// changes, those offsets point into a document that no longer exists
			this.savedSelection = null;

			this.adjustTextareaHeight();
			if (!this.dialogReady)
			{
				return;
			}

			// the window of an edit took the text as its caption: writing the empty field over the draft loses it
			if (this.isEditingAttachments)
			{
				return;
			}

			if (this.withDraft)
			{
				this.getDraftManager().setDraftText(this.draftKey, newValue);
			}

			if (Type.isStringFilled(newValue))
			{
				this.getInputActionService().startAction(InputAction.writing);
			}

			this.$emit('textChange', newValue);
		},
		panelType(newValue: $Values<typeof PanelType>, oldValue: $Values<typeof PanelType>)
		{
			if (newValue === PanelType.market)
			{
				LocalStorageManager.getInstance().set(LocalStorageKey.textareaMarketOpened, true);

				return;
			}

			// only a real close unpins the panel; a message action panel borrowing the slot does not
			if (oldValue === PanelType.market && newValue === PanelType.none)
			{
				LocalStorageManager.getInstance().set(LocalStorageKey.textareaMarketOpened, false);
			}
		},
	},
	created()
	{
		this.savedSelection = null;

		this.fieldDescriptionId = `bx-im-textarea-field-nav-${Text.getRandom(8)}`;

		this.isUnmounted = false;
		this.initUnsentVoiceRecords();
		this.previewSessionOwnerId = Utils.text.getUuidV4();
		this.copilotManager = new CopilotManager();
		this.initResizeManager();
		this.restoreTextareaHeight();
		this.initSendingService();
		void this.resolveVoiceCapability();

		EventEmitter.subscribe(EventType.dialog.onMessageDeleted, this.onMessageDeleted);
		EventEmitter.subscribe(EventType.textarea.insertText, this.onInsertText);
		EventEmitter.subscribe(EventType.textarea.getText, this.onGetText);
		EventEmitter.subscribe(EventType.textarea.closePanel, this.onClosePanelRequest);
		EventEmitter.subscribe(EventType.textarea.closeSlashCommandPopup, this.onCloseSlashCommandPopupRequest);

		this.getEmitter().subscribe(SlashCommandItemsChangedEvent, this.onSlashCommandItemsChanged);
		this.getEmitter().subscribe(EventType.textarea.sendMessage, this.onSendMessage);
		this.getEmitter().subscribe(EventType.textarea.insertText, this.onInsertText);
		this.getEmitter().subscribe(EventType.textarea.insertMention, this.onInsertMention);
		this.getEmitter().subscribe(EventType.textarea.insertForward, this.onInsertForward);
		this.getEmitter().subscribe(EventType.textarea.editMessage, this.onEditMessage);
		this.getEmitter().subscribe(EventType.textarea.replyMessage, this.onReplyMessage);
		this.getEmitter().subscribe(EventType.dialog.closeComments, this.onCloseComments);
		this.getEmitter().subscribe(EventType.textarea.openUploadPreview, this.onOpenUploadPreview);
		this.getEmitter().subscribe(EventType.textarea.focusInput, this.onFocusInput);
		this.getEmitter().subscribe(EventType.key.onBeforeEscape, this.onBeforeEscape);
		this.getEmitter().subscribe(MentionListEvents.activeItemChanged, this.onMentionActiveItemChanged);
	},
	async mounted()
	{
		if (this.withAutoFocus)
		{
			this.focus();
		}

		this.$emit('mounted');

		if (Type.isPlainObject(this.withDraft))
		{
			void this.restoreOwnDraft();
		}

		await this.getDialogReadyPromise();
	},
	beforeUnmount()
	{
		this.isUnmounted = true;
		this.destroyUnsentVoiceRecords();
		this.resizeManager.destroy();
		this.mentionDetector?.destroy();
		this.getToolbarManager().destroy();
		this.releasePreviewSession(this.previewSessionId, {
			removeFilesFromServer: this.canRemoveHeldFilesFromServer,
		});
		this.unbindUploadingService();

		EventEmitter.unsubscribe(EventType.dialog.onMessageDeleted, this.onMessageDeleted);
		EventEmitter.unsubscribe(EventType.textarea.insertText, this.onInsertText);
		EventEmitter.unsubscribe(EventType.textarea.getText, this.onGetText);
		EventEmitter.unsubscribe(EventType.textarea.closePanel, this.onClosePanelRequest);
		EventEmitter.unsubscribe(EventType.textarea.closeSlashCommandPopup, this.onCloseSlashCommandPopupRequest);

		this.getEmitter().unsubscribe(SlashCommandItemsChangedEvent, this.onSlashCommandItemsChanged);
		this.getEmitter().unsubscribe(EventType.textarea.sendMessage, this.onSendMessage);
		this.getEmitter().unsubscribe(EventType.textarea.insertMention, this.onInsertMention);
		this.getEmitter().unsubscribe(EventType.textarea.insertText, this.onInsertText);
		this.getEmitter().unsubscribe(EventType.textarea.insertForward, this.onInsertForward);
		this.getEmitter().unsubscribe(EventType.textarea.editMessage, this.onEditMessage);
		this.getEmitter().unsubscribe(EventType.textarea.replyMessage, this.onReplyMessage);
		this.getEmitter().unsubscribe(EventType.dialog.closeComments, this.onCloseComments);
		this.getEmitter().unsubscribe(EventType.textarea.openUploadPreview, this.onOpenUploadPreview);
		this.getEmitter().unsubscribe(EventType.textarea.focusInput, this.onFocusInput);
		this.getEmitter().unsubscribe(EventType.key.onBeforeEscape, this.onBeforeEscape);
		this.getEmitter().unsubscribe(MentionListEvents.activeItemChanged, this.onMentionActiveItemChanged);
	},
	methods:
	{
		stopGeneration()
		{
			Analytics.getInstance().copilot.onClickStopGeneration(this.dialogId);
			void this.copilotManager.stopGeneration(this.dialogId);
		},
		onGetText(event: BaseEvent<{ dialogId: string }>): string
		{
			const { dialogId } = event.getData();

			if (this.dialogId !== dialogId)
			{
				return '';
			}

			return this.text;
		},
		async sendMessage()
		{
			this.text = this.text.trim();
			const beforeSendOnlyDialogId = this.allowBeforeSendOnUninitedTemp
				&& !this.dialogInited
				&& Utils.dialog.isTempAiAssistantDialogId(this.dialogId)
				? this.dialogId
				: null
			;
			if (this.isDisabled || (!this.dialogInited && !beforeSendOnlyDialogId))
			{
				return;
			}

			// the send button acts as a stop button while BitrixGPT is generating: sending is unavailable
			if (this.isStopGenerationState)
			{
				return;
			}

			// the window took the text of the edit, so the panel path would read the empty field as a blank
			if (this.isEditingAttachments)
			{
				return;
			}

			// the hold is taken until the field is cleared, so a second Enter cannot send the same text
			if (this.typedTextHoldId !== 0)
			{
				return;
			}

			lastTypedTextHoldId += 1;
			const holdId = lastTypedTextHoldId;
			this.typedTextHoldId = holdId;
			try
			{
				await this.sendCurrentText(beforeSendOnlyDialogId);
			}
			finally
			{
				if (this.typedTextHoldId === holdId)
				{
					this.typedTextHoldId = 0;
				}
			}
		},
		async sendCurrentText(beforeSendOnlyDialogId: ?string = null)
		{
			await this.getDialogReadyPromise();
			if (beforeSendOnlyDialogId && (
				this.isUnmounted
				|| this.dialogId !== beforeSendOnlyDialogId
				|| !this.allowBeforeSendOnUninitedTemp
				|| !Utils.dialog.isTempAiAssistantDialogId(this.dialogId)
			))
			{
				return;
			}

			const sentText = this.text;
			const eventResult = await EventEmitter.emitAsync(EventType.textarea.onBeforeSendMessage, {
				dialogId: this.dialogId,
				text: sentText,
			});

			if (eventResult.includes(BeforeSendMessageAction.cancel))
			{
				if (this.text === sentText)
				{
					this.resetTextarea();
				}

				return;
			}

			if (eventResult.includes(BeforeSendMessageAction.cancelKeepText))
			{
				return;
			}

			// A before-send-only attempt stays bound to its original temp even if an
			// async listener changes live props/models. Only a cancellation action may
			// consume it; it must never fall through to the ordinary transport path.
			if (beforeSendOnlyDialogId)
			{
				return;
			}

			const text = this.mentionReplacementMap
				? this.mentionReplacementMap.apply(this.text)
				: this.text;
			// the send goes on asynchronously, so its chat and mode are taken before the prop moves on
			const { dialogId, editMode } = this;

			if (this.hasActiveMessageAction())
			{
				if (editMode)
				{
					this.handlePanelAction(text);
					this.closePanel();
					this.resetTextarea();
					this.completeOptimisticSend();
				}
				else
				{
					this.resetTextarea();
					this.completeOptimisticSend();

					this.handlePanelAction(text);
					this.closePanel();
				}
			}
			else
			{
				this.resetTextarea();
				SoundNotificationManager.getInstance().playOnce(SoundType.send);
				this.completeOptimisticSend();

				this.getSendingService().sendMessage({ text, dialogId });
			}
		},
		// ALG-01 optimistic part: nothing here waits for the send to reach the server
		completeOptimisticSend()
		{
			this.typedTextHoldId = 0;
			this.getEmitter().emit(EventType.textarea.onAfterSendMessage);
		},
		resetTextarea()
		{
			this.getInputActionService().stopAction(InputAction.writing);
			this.clear();
			this.getDraftManager().clearDraft(this.draftKey);
			this.focus();
		},
		handlePanelAction(text: string)
		{
			if (this.editMode)
			{
				void this.handleEditAction(text);
			}
			else if (this.forwardMode)
			{
				void this.getSendingService().forwardMessages({
					text,
					dialogId: this.dialogId,
					forwardIds: this.panelContext.messagesIds,
				});
				SoundNotificationManager.getInstance().playOnce(SoundType.send);
			}
			else if (this.replyMode)
			{
				this.getSendingService().sendMessage({
					text,
					dialogId: this.dialogId,
					replyId: this.panelContext.messageId,
				});
				SoundNotificationManager.getInstance().playOnce(SoundType.send);
			}
		},
		async handleEditAction(text: string): Promise<void>
		{
			const { messageId } = this.panelContext;
			if (text === '' && !this.messageHasFiles(messageId))
			{
				this.getMessageService().deleteMessages([messageId]);

				return;
			}

			const editContext: EditContext = {
				messageId,
				newText: text,
				dialogId: this.dialogId,
				draftKey: this.draftKey,
				// the type is taken now: by the time the answer comes the message may be gone from the store
				isVideoNote: this.$store.getters['messages/isVideoNote'](messageId),
			};
			const outcome: EditMessageResult = await this.getMessageService().editMessageText(messageId, text);

			this.handleEditOutcome(editContext, outcome);
		},
		handleEditOutcome(editContext: EditContext, outcome: EditMessageResult): void
		{
			// the answer of a superseded attempt must not overwrite the result of the newest one
			if (outcome.success || !outcome.isLatestAttempt)
			{
				return;
			}

			const { messageId, newText, isVideoNote } = editContext;
			if (!isVideoNote)
			{
				Logger.error('ChatTextarea: editing the message failed', outcome.reason);

				return;
			}

			const message: ?ImModelMessage = this.$store.getters['messages/getById'](messageId);
			// a newer update or a delete wins: only the text this attempt wrote may be rolled back
			if (message?.text === newText)
			{
				const { textBeforeEdit, isEditedBeforeEdit } = outcome;
				this.getMessageService().rollbackMessage(messageId, textBeforeEdit, isEditedBeforeEdit);
			}

			this.recoverEditedText(editContext, message);

			Notifier.message.onEditError(outcome.reason);
		},
		recoverEditedText(editContext: EditContext, message: ?ImModelMessage): void
		{
			const { messageId, newText, dialogId, draftKey } = editContext;
			// the user may have moved on while the answer was on its way: another chat, another
			// edit or freshly typed text; whatever they are doing now wins over the return
			const sameDialogOpened = !this.isUnmounted && this.dialogId === dialogId;
			// a reply or a forward is as much what the user is doing now as an edit is, and the panel
			// of the edit is what the recovery would silently replace: only the edit of this very
			// message is a panel it may write into
			const editPanelOfThisMessage = this.editMode && this.panelContext.messageId === messageId;
			const otherActionPanelOpened = this.hasActiveMessageAction() && !editPanelOfThisMessage;

			// the draft is keyed by chat, so a textarea busy with something else owns the draft too:
			// the text of a failed edit may not overwrite what the user is typing or editing now
			if (sameDialogOpened && (otherActionPanelOpened || !this.isEmptyText))
			{
				return;
			}

			// a message deleted by now has no edit panel to return to, whether it is gone from the
			// collection or only marked deleted; its caption goes to the draft
			if (sameDialogOpened && message && !message.isDeleted)
			{
				this.openEditPanel(messageId, newText);

				return;
			}

			// a textarea without a draft has nowhere to keep the caption: the notification is all
			// the user gets back
			if (!this.withDraft)
			{
				return;
			}

			// mentions live in the draft as a replacement map: prepareEdit leaves plain names in the
			// text, and only that map turns them back into bbcode when the draft is sent
			const mentions = this.mentionReplacementMap.extract(newText);

			this.getDraftManager().setDraftText(draftKey, Parser.prepareEdit({ ...message, text: newText }));
			this.getDraftManager().setDraftMentions(draftKey, mentions);
		},
		messageHasFiles(messageId: number): boolean
		{
			const message = this.$store.getters['messages/getById'](messageId);
			if (!message)
			{
				return false;
			}

			return message.files.length > 0;
		},
		clear()
		{
			this.text = '';
			this.mentionReplacementMap?.clear();
		},
		hasActiveMessageAction(): boolean
		{
			return MESSAGE_ACTION_PANELS.has(this.panelType);
		},
		onPanelClose()
		{
			this.focus();
			this.closePanel();
		},
		closePanel()
		{
			if (this.editMode)
			{
				this.clear();
			}

			// the window of the attachments is the edit shown in the panel: the batch cannot outlive it
			if (this.isEditingAttachments)
			{
				this.discardPreviewSession();
			}

			this.panelType = PanelType.none;
			this.panelContext = {
				messageId: 0,
			};

			this.getDraftManager().setDraftPanel(this.draftKey, this.panelType, this.panelContext);
		},
		openEditPanel(messageId: number, rawText: ?string = null)
		{
			if (!this.withEdit)
			{
				return;
			}

			const message: ImModelMessage = this.$store.getters['messages/getById'](messageId);
			if (message.isDeleted)
			{
				return;
			}

			// rawText replaces the stored text when the panel reopens with text the model does
			// not hold: the caption of an edit that failed to save
			const messageToEdit = rawText === null ? message : { ...message, text: rawText };

			this.panelType = PanelType.edit;
			this.panelContext.messageId = messageId;

			const mentions = this.mentionReplacementMap.extract(messageToEdit.text);
			this.mentionReplacementMap.set(mentions);

			this.text = Parser.prepareEdit(messageToEdit);
			this.focus();

			this.getDraftManager().setDraftText(this.draftKey, this.text);
			this.getDraftManager().setDraftPanel(this.draftKey, this.panelType, this.panelContext);
			this.getDraftManager().setDraftMentions(this.draftKey, mentions);

			if (this.panelEditedMessageId && this.messageHasFiles(messageId))
			{
				void this.openEditAttachmentsPreview();
			}
		},
		// the batch starts out empty: the window fills it with the files the message already carries
		async openEditAttachmentsPreview(): Promise<void>
		{
			const messageId = this.panelEditedMessageId;
			const uploadingService = this.getUploadingService();

			try
			{
				const sessionId = await uploadingService.createPreviewSession({
					dialogId: this.dialogId,
					messageId,
				});

				uploadingService.leasePreviewSession(sessionId, this.previewSessionOwnerId);

				if (this.isUnmounted || this.panelEditedMessageId !== messageId)
				{
					this.releasePreviewSession(sessionId);

					return;
				}

				this.openUploadPreview(sessionId, messageId);
			}
			catch (error)
			{
				// without the window the attachments cannot be reached at all
				Logger.error('ChatTextarea: opening the attachments of the edited message failed', error);
				Notifier.onDefaultError();
			}
		},
		openReplyPanel(messageId: number)
		{
			if (this.editMode)
			{
				this.clear();
			}
			this.panelType = PanelType.reply;
			this.panelContext.messageId = messageId;
			this.focus();

			this.getDraftManager().setDraftPanel(this.draftKey, this.panelType, this.panelContext);
		},
		openForwardPanel(messagesIds: number[])
		{
			this.panelType = PanelType.forward;
			this.panelContext.messageId = 0;
			this.panelContext.messagesIds = messagesIds;
			this.clear();
			this.focus();

			this.getDraftManager().setDraftPanel(this.draftKey, this.panelType, this.panelContext);
		},
		toggleMarketPanel()
		{
			const shouldOpenMarket = !this.marketMode;
			if (shouldOpenMarket)
			{
				this.panelContext.messageId = 0;
			}

			this.panelType = shouldOpenMarket ? PanelType.market : PanelType.none;
		},
		restoreMarketPanel()
		{
			if (!this.showMarketIcon || this.panelType !== PanelType.none)
			{
				return;
			}

			if (!LocalStorageManager.getInstance().get(LocalStorageKey.textareaMarketOpened, false))
			{
				return;
			}

			const availableApps = MarketManager.getInstance()
				.getAvailablePlacementsByType(PlacementType.textarea, this.dialogId);
			if (!Type.isArrayFilled(availableApps))
			{
				return;
			}

			this.panelType = PanelType.market;
		},
		async adjustTextareaHeight()
		{
			// the watcher of the text runs before the render, so text put into the field by the code
			// is not in the element yet: measure after the render.
			await this.$nextTick();

			const textarea = this.$refs.textarea;
			if (!textarea)
			{
				return;
			}

			const floorHeight = Math.max(this.resizedTextareaHeight ?? 0, this.minHeight);

			const fitsCurrentHeight = textarea.scrollHeight <= textarea.clientHeight;
			if (fitsCurrentHeight && this.textareaHeight === floorHeight)
			{
				return;
			}

			// Pin the wrapper height (and opt the textarea out of the flex stretch) so the
			// auto-measure collapse below cannot leak into the message list layout — the input
			// panel height only changes on the final assignment. See ERR-007.
			const wrapper = textarea.closest('.bx-im-textarea__top');
			if (!wrapper)
			{
				return;
			}
			Dom.style(wrapper, 'height', `${wrapper.offsetHeight}px`);
			Dom.style(textarea, 'align-self', 'flex-start');

			this.textareaHeight = 'auto';
			await this.$nextTick();
			const contentHeight = Math.min(TextareaHeight.max, textarea.scrollHeight);
			this.textareaHeight = Math.max(contentHeight, floorHeight);

			await this.$nextTick();
			Dom.style(wrapper, 'height', '');
			Dom.style(textarea, 'align-self', '');
		},
		saveTextareaHeight()
		{
			const WRITE_TO_STORAGE_TIMEOUT = 200;
			clearTimeout(this.saveTextareaTimeout);
			this.saveTextareaTimeout = setTimeout(() => {
				LocalStorageManager.getInstance().set(this.heightStorageKey, this.resizedTextareaHeight);
			}, WRITE_TO_STORAGE_TIMEOUT);
		},
		restoreTextareaHeight()
		{
			const rawSavedHeight = LocalStorageManager.getInstance().get(this.heightStorageKey);
			const savedHeight = Number.parseInt(rawSavedHeight, 10);
			if (!savedHeight)
			{
				return;
			}

			const clampedHeight = Math.max(savedHeight, this.minHeight);
			this.resizedTextareaHeight = clampedHeight;
			this.textareaHeight = clampedHeight;
		},
		checkMessageExists(messageId: number): boolean
		{
			return this.$store.getters['messages/isExists'](messageId);
		},
		verifyPanelContext(panelContext: PanelContextWithMultipleIds): boolean
		{
			if (panelContext.messagesIds)
			{
				return panelContext.messagesIds.every((messageId) => this.checkMessageExists(messageId));
			}

			return this.checkMessageExists(panelContext.messageId);
		},
		async restorePanel()
		{
			const {
				text = '',
				panelType = PanelType.none,
				panelContext = {
					messageId: 0,
				},
			} = await this.getDraftManager().getDraft(this.draftKey);

			const noPanel = this.panelType === PanelType.none;

			if (!noPanel && !this.verifyPanelContext(panelContext))
			{
				return;
			}

			this.text = text;
			if (noPanel)
			{
				this.panelType = panelType;
			}
			this.panelContext = panelContext;
		},
		async restorePanels(): Promise<void>
		{
			// the object form of withDraft owns both restores in restoreOwnDraft()
			if (Type.isPlainObject(this.withDraft))
			{
				return;
			}

			// draft panels have priority, market is restored only into a free panel slot
			if (this.text === '' && this.withDraft)
			{
				await this.restorePanel();
			}

			this.restoreMarketPanel();
		},
		onBeforeEscape(): $Values<typeof EscEventAction>
		{
			// the recording leaves before anything else the field holds. Esc is delegated to
			// `cancelRecording()` of the panel, which drops the record, frees the microphone and names
			// the cancel, and its way out comes back here as a close; the branch lives in the
			// subscriber of the field, because a subscription of the panel would take the Esc of the
			// reply panel standing behind it
			if (this.isVoiceRecording)
			{
				// the panel closes on the key whether its ref is there or not: unmounting it cancels
				// the session all the same, and an Esc reported as handled has to reach the recording
				if (this.$refs.voiceRecordingPanel)
				{
					this.$refs.voiceRecordingPanel.cancelRecording();
				}
				else
				{
					this.closeVoiceRecording();
				}

				return EscEventAction.handled;
			}

			// opt-in gate: with the prop off (imopenlines operator console) Esc leaves the market panel alone.
			// The focus check keeps this global subscriber local: outside the input zone Esc neither closes the
			// panel nor counts as handled, so the general Esc chain runs as it did before keyboard navigation.
			if (this.withKeyboardNavigation && this.marketMode && this.isFocusInsideInputZone())
			{
				this.closePanel();
				this.returnFocusToMarketIcon();

				return EscEventAction.handled;
			}

			if (this.hasActiveMessageAction())
			{
				this.closePanel();

				return EscEventAction.handled;
			}

			// keyboard navigation: Esc steps out of typing by moving focus from the field to the input area,
			// which carries the visible ring. A second Esc (focus already on the area) is ignored so the
			// general Esc chain closes the chat.
			// onBeforeEscape is a global subscriber, so every branch that reads focus asks the DOM. That is
			// why isFieldFocused is a method: document.activeElement is not reactive, so a computed would
			// cache its first answer for good and every later Esc would see the focus state of the first.
			if (this.withKeyboardNavigation)
			{
				if (this.isFieldFocused())
				{
					this.focusInputArea();

					return EscEventAction.handled;
				}

				return EscEventAction.ignored;
			}

			// legacy behavior (prop off): swallow Esc while the focused field still has text
			if (this.isFieldFocused() && !this.isEmptyText)
			{
				return EscEventAction.handled;
			}

			return EscEventAction.ignored;
		},
		// a method, so the answer is read from the DOM on every call - see the note in onBeforeEscape
		isFieldFocused(): boolean
		{
			return this.$refs.textarea === document.activeElement;
		},
		returnFocusToMarketIcon()
		{
			this.$refs.marketIcon?.$el?.focus({ preventScroll: true });
		},
		isFocusInsideInputZone(): boolean
		{
			return Boolean(this.$el?.contains(document.activeElement));
		},
		onMouseUp(event: MouseEvent)
		{
			this.getToolbarManager().handleTextSelect(event, this.$refs.textarea);
		},
		async onKeyDown(event: KeyboardEvent)
		{
			Analytics.getInstance().onTypeMessage(this.dialog);

			this.getToolbarManager().hide();

			if (this.showSlashCommand && this.slashCommandEnabled)
			{
				const handledBySlashCommand = this.slashCommandManager.onActiveSlashCommandKeyDown(event);
				if (handledBySlashCommand)
				{
					return;
				}
			}

			if (this.showMention && this.withMention)
			{
				this.mentionDetector.onActiveMentionKeyDown(event);

				return;
			}

			const sendMessageCombination = isSendMessageCombination(event);
			const newLineCombination = isNewLineCombination(event);
			if (sendMessageCombination && !newLineCombination)
			{
				event.preventDefault();
				void this.sendMessage();

				return;
			}

			if (newLineCombination)
			{
				this.handleNewLine();

				return;
			}

			const tabCombination = Utils.key.isCombination(event, 'Tab');
			if (tabCombination)
			{
				this.handleTab(event);

				return;
			}

			if (isTextDecorationCombination(event))
			{
				event.preventDefault();
				this.text = Textarea.handleDecorationTag(this.$refs.textarea, event.code, this.isMarkdownInputAvailable);

				return;
			}

			if (this.text === '' && Utils.key.isCombination(event, HotkeyCombination.editMessage.lastOwn))
			{
				this.handleLastOwnMessageEdit(event);

				return;
			}

			this.mentionDetector?.onKeyDown(event);
			this.slashCommandManager?.onKeyDown(event);
		},
		handleNewLine()
		{
			this.text = Textarea.addNewLine(this.$refs.textarea);
		},
		handleTab(event: KeyboardEvent)
		{
			event.preventDefault();
			if (event.shiftKey)
			{
				this.text = Textarea.removeTab(this.$refs.textarea);

				return;
			}
			this.text = Textarea.addTab(this.$refs.textarea);
		},
		isTextInputKey(event: KeyboardEvent): boolean
		{
			const isAltGraph = event.getModifierState?.('AltGraph') === true;
			if (event.isComposing || event.metaKey || (event.ctrlKey && !isAltGraph) || (event.altKey && !isAltGraph))
			{
				return false;
			}

			// a single-character key produces text (letters, digits, punctuation); Shift is allowed
			return event.key.length === 1;
		},
		isNativeTextInputStart(event: KeyboardEvent): boolean
		{
			return event.isComposing || event.key === 'Dead' || event.key === 'Process' || event.keyCode === 229;
		},
		// Esc leaves typing by moving focus from the field to the input area, which is the composer's own Tab
		// stop. The field is out of the Tab order (tabindex="-1"), so nothing ever has to carry focus out of
		// it with Tab - which is what lets Tab keep inserting a tab character while typing. Entering the
		// field is always explicit: Enter, Space, a printable key or a click.
		focusInputArea()
		{
			const field = this.$refs.textarea;
			if (field)
			{
				this.savedSelection = { start: field.selectionStart, end: field.selectionEnd };
			}

			this.$refs['textarea-content']?.focus({ preventScroll: true });
		},
		// The other moment the caret is worth writing down: focus leaving the field. A caret the user moved
		// with the mouse changes no text, so the watcher that drops a stale one never fires for it - without
		// this, returning to the area and typing would put the character back where Esc once found it.
		rememberSelection()
		{
			const field = this.$refs.textarea;
			if (!field)
			{
				return;
			}

			this.savedSelection = { start: field.selectionStart, end: field.selectionEnd };
		},
		resumeTyping(character: string = '')
		{
			const field = this.$refs.textarea;
			if (!field)
			{
				return;
			}

			field.focus({ preventScroll: true });
			this.restoreSelection();

			if (character === '')
			{
				return;
			}

			// the area is not a text input, so the keystroke that resumed typing cannot be delivered by the
			// default action - it is inserted at the restored caret instead
			field.setRangeText(character, field.selectionStart, field.selectionEnd, 'end');
			this.text = field.value;
		},
		restoreSelection()
		{
			if (!this.savedSelection)
			{
				this.moveCaretToEnd();

				return;
			}

			this.$refs.textarea.setSelectionRange(this.savedSelection.start, this.savedSelection.end);
		},
		moveCaretToEnd()
		{
			const field = this.$refs.textarea;
			if (!field)
			{
				return;
			}

			const position = field.value.length;
			field.setSelectionRange(position, position);
		},
		handleLastOwnMessageEdit(event: KeyboardEvent)
		{
			event.preventDefault();
			const lastOwnMessage = this.$store.getters['messages/getLastOwnMessage'](this.dialog.chatId);
			if (this.isMessageSending(lastOwnMessage))
			{
				return;
			}

			const lastOwnMessageId = this.$store.getters['messages/getLastOwnMessageId'](this.dialog.chatId);
			const isEditable = MessageManager.isEditable(lastOwnMessageId);
			if (isEditable)
			{
				this.openEditPanel(lastOwnMessageId);
			}
		},
		isMessageSending(message: ?ImModelMessage): boolean
		{
			return message?.sending === true && message.error !== true;
		},
		async onSendMessage(event: BaseEvent<{ text: string, dialogId: string }>)
		{
			const { text, dialogId } = event.getData();
			if (this.dialogId !== dialogId)
			{
				return;
			}

			await this.getDialogReadyPromise();

			this.getSendingService().sendMessage({ text, dialogId: this.dialogId });
		},
		onResizeStart(event)
		{
			this.resizeManager.onResizeStart(event, this.textareaHeight);
		},
		async onFileSelect({ event, sendAsFile }: Event)
		{
			await this.addFilesToPreviewSession(Object.values(event.target.files), sendAsFile);
		},
		async onDiskFileSelect({ files })
		{
			const messageId = this.panelEditedMessageId;

			// the batch of a draft never mixes sources, and the disk one replaces it inside the service; the
			// batch of an edit holds both sources at once, so the pick joins it and it is kept
			if (messageId === null)
			{
				this.discardPreviewSession();
			}

			const multiUploadingResult: MultiUploadingResult = await this.getUploadManager().addDiskFiles({
				files,
				dialogId: this.dialogId,
				messageId,
			});

			this.notifyValidationErrors(multiUploadingResult.errors);
			this.notifyBatchLimitRefusal(multiUploadingResult.overLimitCount, messageId);

			const [sessionId] = multiUploadingResult.uploaderIds;
			if (sessionId)
			{
				this.getUploadingService().leasePreviewSession(sessionId, this.previewSessionOwnerId);

				if (this.isUnmounted)
				{
					this.releasePreviewSession(sessionId);

					return;
				}

				this.openUploadPreview(sessionId, messageId);
			}
		},
		async addFilesToPreviewSession(files: File[], sendAsFile: boolean = false)
		{
			const messageId = this.panelEditedMessageId;

			try
			{
				const { sessionId, errors, overLimitCount } = await this.getUploadManager().addFilesToPreview({
					files,
					dialogId: this.dialogId,
					messageId,
					sendAsFile,
				});

				const uploadingService = this.getUploadingService();
				uploadingService.leasePreviewSession(sessionId, this.previewSessionOwnerId);

				this.notifyValidationErrors(errors);
				this.notifyBatchLimitRefusal(overLimitCount, messageId);

				if (this.isUnmounted)
				{
					this.releasePreviewSession(sessionId);

					return;
				}

				if (uploadingService.getPreviewSessionFiles(sessionId).length === 0)
				{
					uploadingService.destroyPreviewSession(sessionId);

					return;
				}

				// an already opened popup keeps its session: the files just joined the batch
				this.openUploadPreview(sessionId, messageId);
			}
			catch (error)
			{
				// the add can fail before a single file joins the batch, and then the pick looks ignored
				Logger.error('ChatTextarea: adding files to the batch failed', error);
				Notifier.onDefaultError();
			}
		},
		// the scope comes in with the batch: only the batch of an edit puts the window into the edit mode
		openUploadPreview(sessionId: string, messageId: ?number = null)
		{
			// the text moves into the caption, so a popup left here would keep a query of erased text
			if (this.showMention)
			{
				this.closeMentionPopup();
			}
			// the toolbar shares its popup id with the caption one, so it has to go the same way
			this.getToolbarManager().hide();

			// a batch this textarea stops pointing at is one nothing will ever free: releases go by previewSessionId
			if (this.previewSessionId && this.previewSessionId !== sessionId)
			{
				this.releasePreviewSession(this.previewSessionId, {
					removeFilesFromServer: this.canRemoveHeldFilesFromServer,
				});
			}

			// the save lock and the fate of the composition belong to one batch: another must not inherit them
			if (this.previewSessionId !== sessionId)
			{
				this.isSavingEditedFiles = false;
				this.editedCompositionFate = EditedCompositionFate.unsent;
			}

			this.previewSessionId = sessionId;
			this.previewSessionMessageId = messageId;
		},
		onUploadPreviewClose()
		{
			const wasEditingAttachments = this.isEditingAttachments;
			this.discardPreviewSession();

			// closing the window leaves the edit as a whole: an abandoned edit must not stay in the field
			if (wasEditingAttachments)
			{
				this.closePanel();
			}
		},
		// closing the popup ends the composing for this textarea only, so the batch is released and
		// not destroyed: another textarea of the same dialog may still be composing into it
		discardPreviewSession()
		{
			// an edit given up takes its uploaded files with it: their copies belong to no message
			this.releasePreviewSession(this.previewSessionId, {
				removeFilesFromServer: this.canRemoveHeldFilesFromServer,
			});
			this.previewSessionId = null;
			this.previewSessionMessageId = null;
			// the lock and the fate go with the window: the next one would open locked over a batch that is gone
			this.isSavingEditedFiles = false;
			this.editedCompositionFate = EditedCompositionFate.unsent;
		},
		// the batch can be shared with another textarea of the same dialog, so this gives up the lease
		// of this component only, and the holder dies with its last owner. The id comes in explicitly
		// because a session that arrives after beforeUnmount never reaches previewSessionId.
		releasePreviewSession(sessionId: ?string, { removeFilesFromServer = false }: DestroyUploaderOptions = {})
		{
			if (!sessionId)
			{
				return;
			}

			this.getUploadingService().releasePreviewSession(sessionId, this.previewSessionOwnerId, {
				removeFilesFromServer,
			});
		},
		notifyValidationErrors(errors: ResolvedValidationError[])
		{
			errors.forEach((error: ResolvedValidationError) => {
				Notifier.file.showValidationError(error.text);
			});
		},
		// the batch limit refuses files without a validation error behind it, and the popup message
		// about it needs a popup: the very first portion over the limit has none yet
		notifyBatchLimitRefusal(overLimitCount: number, messageId: ?number = null)
		{
			if (overLimitCount > 0)
			{
				Notifier.file.showValidationError(this.loc(messageId === null
					? 'IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_FILES_LIMIT_MESSAGE_100'
					: 'IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_EDIT_FILES_LIMIT_MESSAGE_10'));
			}
		},
		isOwnInsertEvent(payload: InsertTextEvent | InsertMentionEvent): boolean
		{
			if (this.dialogId !== payload.dialogId)
			{
				return false;
			}

			return (payload.target ?? TextareaTarget.main) === TextareaTarget.main;
		},
		onInsertMention(event: BaseEvent<InsertMentionEvent>)
		{
			const {
				mentionText,
				mentionReplacement,
				mentionedUserId = null,
				isMentionSymbol = true,
				registerReplacement = true,
			} = event.getData();

			let { textToReplace = '' } = event.getData();
			if (!this.isOwnInsertEvent(event.getData()))
			{
				return;
			}

			if (this.isCopilotBotAlreadyMentioned(mentionedUserId))
			{
				this.dropMentionQuery(textToReplace, isMentionSymbol);
				this.focus();

				return;
			}

			if (registerReplacement)
			{
				const mentions = this.mentionReplacementMap.add(
					mentionText,
					mentionReplacement,
					mentionedUserId,
				);
				this.getDraftManager().setDraftMentions(this.draftKey, mentions);
			}

			const mentionSymbol = isMentionSymbol ? this.mentionDetector.getMentionSymbol() : '';
			textToReplace = `${mentionSymbol}${textToReplace}`;
			this.text = Textarea.insertMention(this.$refs.textarea, {
				textToInsert: mentionText,
				textToReplace,
			});
			this.mentionDetector.clearMentionSymbol();
		},
		// the pick is suppressed, but the query typed in the field is not the popup's to keep: left in
		// place it travels into the message, and the symbol it was opened with would skew the next insert
		dropMentionQuery(textToReplace: string, isMentionSymbol: boolean)
		{
			const mentionSymbol = isMentionSymbol ? this.mentionDetector.getMentionSymbol() : '';
			const textToRemove = `${mentionSymbol}${textToReplace}`;

			if (textToRemove.length > 0)
			{
				this.text = Textarea.removeTextBeforeCursor(this.$refs.textarea, textToRemove);
			}

			this.mentionDetector.clearMentionSymbol();
		},
		isCopilotBotAlreadyMentioned(mentionedUserId: string | number | null): boolean
		{
			if (mentionedUserId === null)
			{
				return false;
			}

			if (!this.copilotManager.isCopilotBot(mentionedUserId))
			{
				return false;
			}

			// the rendered draft text is the source of truth, not the user-id registry:
			// a restored draft rehydrates replacements via set(), which drops the user ids
			return this.mentionReplacementMap.apply(this.text).includes(`[USER=${mentionedUserId}]`);
		},
		onInsertText(event: BaseEvent<InsertTextEvent>)
		{
			if (!this.isOwnInsertEvent(event.getData()))
			{
				return;
			}
			this.text = Textarea.insertText(this.$refs.textarea, event.getData());
		},
		onEditMessage(event: BaseEvent<{ messageId: number, dialogId: string }>)
		{
			const { messageId, dialogId } = event.getData();
			if (this.dialogId !== dialogId)
			{
				return;
			}
			this.openEditPanel(messageId);
		},
		onReplyMessage(event: BaseEvent<{ messageId: number, dialogId: string }>)
		{
			const { messageId, dialogId } = event.getData();
			if (this.dialogId !== dialogId)
			{
				return;
			}
			this.openReplyPanel(messageId);
		},
		onClosePanelRequest(event: BaseEvent<{ dialogId: string }>)
		{
			const { dialogId } = event.getData();
			if (this.dialogId !== dialogId)
			{
				return;
			}
			this.closePanel();
		},
		onFocusInput(event: BaseEvent<{ dialogId: string }>)
		{
			const { dialogId } = event.getData();
			if (this.dialogId !== dialogId)
			{
				return;
			}

			this.focus();
		},
		onInsertForward(event: BaseEvent<{ messagesIds: number[], dialogId: string }>)
		{
			const { messagesIds, dialogId } = event.getData();
			if (this.dialogId !== dialogId)
			{
				return;
			}

			this.openForwardPanel(messagesIds);
		},
		async onPaste(event: ClipboardEvent)
		{
			this.text = Textarea.handlePasteUrl(this.$refs.textarea, event, this.isMarkdownInputAvailable);

			if (!this.withUploadMenu || !this.dialogReady)
			{
				return;
			}

			if (!event.clipboardData || !isFilePasted(event.clipboardData))
			{
				return;
			}

			event.preventDefault();

			await this.addFilesToPreviewSession(await getFilesFromDataTransfer(event.clipboardData));
		},
		async onOpenUploadPreview(event: BaseEvent<{ dialogId: string, files: File[] }>)
		{
			const { dialogId, files } = event.getData();
			if (this.dialogId !== dialogId)
			{
				return;
			}

			await this.addFilesToPreviewSession(files);
		},
		onMarketIconClick()
		{
			this.toggleMarketPanel();
		},
		onMessageDeleted(event: BaseEvent<{ messageId: number }>)
		{
			const { messageId } = event.getData();

			if (this.panelContext.messageId === messageId)
			{
				this.closePanel();
			}

			if (this.panelContext.messagesIds && this.panelContext.messagesIds.includes(messageId))
			{
				this.closePanel();
			}
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
		initResizeManager()
		{
			this.resizeManager = new ResizeManager({
				direction: ResizeDirection.up,
				maxHeight: TextareaHeight.max,
				minHeight: this.minHeight,
			});

			this.resizeManager.subscribe(ResizeManager.events.onHeightChange, ({ data: { newHeight } }) => {
				Logger.warn('Textarea: Resize height change', newHeight);
				this.textareaHeight = newHeight;
			});
			this.resizeManager.subscribe(ResizeManager.events.onResizeStop, () => {
				Logger.warn('Textarea: Resize stop');
				this.resizedTextareaHeight = this.textareaHeight;
				this.saveTextareaHeight();
			});
		},
		initSendingService()
		{
			if (this.sendingService)
			{
				return;
			}

			this.sendingService = SendingService.getInstance();
		},
		// the browser is probed once per page, and only where the feature is switched on at all
		async resolveVoiceCapability(): Promise<void>
		{
			if (!FeatureManager.isFeatureAvailable(Feature.isVoiceMessageRecordingAvailable))
			{
				return;
			}

			this.voiceCapability = await CapabilityResolver.resolve();
		},
		async loadRecordingPanel(): Promise<boolean>
		{
			if (this.recordingPanel)
			{
				return true;
			}

			try
			{
				const { RecordingPanel } = (
					await Runtime.loadExtension(VOICE_RECORDING_EXTENSION): VoiceRecordingExtension
				);
				this.recordingPanel = markRaw(RecordingPanel);

				return true;
			}
			catch (error)
			{
				Logger.error('ChatTextarea: the interface of the voice recording did not load', error);
				Notifier.onDefaultError();

				return false;
			}
		},
		// isLocked says how the recording is held: a hold ends with its release, a keyboard start does
		// not. isStartedFromPointer says whether a pointer stood behind the press at all
		async startVoiceRecording(
			{ isLocked, isStartedFromPointer }: { isLocked: boolean, isStartedFromPointer: boolean },
		): Promise<void>
		{
			// recording over a record that came back gives it up
			this.forgetReturnedVoiceRecord();

			const pressedInDialogId = this.dialogId;

			// a gesture that ended inside this wait held nothing by the time the panel opened: such a
			// press is a click, and a click leaves the recording running without a hold
			this.isVoiceHoldOver = false;
			this.isVoiceHoldCancelled = false;
			Event.bind(document, 'pointerup', this.onVoiceHoldOver);
			Event.bind(document, 'pointercancel', this.onVoiceHoldCancelled);

			const isPanelReady = await this.loadRecordingPanel();

			Event.unbind(document, 'pointerup', this.onVoiceHoldOver);
			Event.unbind(document, 'pointercancel', this.onVoiceHoldCancelled);

			// the press belongs to the field and to the chat it was made in, and an interrupted
			// gesture is no press at all
			const isPressStillStanding = !this.isUnmounted
				&& this.dialogId === pressedInDialogId
				&& (isLocked || !this.isVoiceHoldCancelled);

			if (!isPanelReady || !isPressStillStanding)
			{
				return;
			}

			this.isVoiceRecordingLocked = isLocked || this.isVoiceHoldOver;
			this.isVoiceStartedFromPointer = isStartedFromPointer;
			this.isVoiceRecording = true;
		},
		onVoiceHoldOver()
		{
			this.isVoiceHoldOver = true;
		},
		onVoiceHoldCancelled()
		{
			this.isVoiceHoldCancelled = true;
		},
		// the actions of the panel leave with it, so focus standing on one of them lands in the field
		closeVoiceRecording(): void
		{
			// the record goes before the panel it stood in: a queue read while it is still shown would
			// find the very same record and put it right back on the screen
			this.forgetReturnedVoiceRecord();
			this.isVoiceRecording = false;
			void this.$nextTick(() => this.focus());
		},
		// the record on the screen is given up by the user; whatever came back after it takes its place
		forgetReturnedVoiceRecord(): void
		{
			this.shownVoiceRecord = null;
		},
		initUnsentVoiceRecords(): void
		{
			this.unsentVoiceRecords = UnsentVoiceRecords.getInstance();
			this.unsentVoiceRecords.subscribe(
				UnsentVoiceRecords.event.onRecordReturned,
				this.onVoiceRecordReturned,
			);
			void this.showReturnedVoiceRecord();
		},
		destroyUnsentVoiceRecords(): void
		{
			this.unsentVoiceRecords.unsubscribe(
				UnsentVoiceRecords.event.onRecordReturned,
				this.onVoiceRecordReturned,
			);
			this.queueShownVoiceRecord();
			if (this.isVoiceRecording)
			{
				this.getInputActionService().stopAction(InputAction.recordingVoice);
			}
		},
		// the record leaves the screen with the panel but not the field: it goes back to the head of
		// the queue of its own chat, ahead of anything that came back later
		queueShownVoiceRecord(): void
		{
			if (!this.shownVoiceRecord)
			{
				return;
			}

			const { dialogId, record, failure } = this.shownVoiceRecord;
			this.shownVoiceRecord = null;
			this.getUnsentVoiceRecords().unshift(dialogId, record, failure);
		},
		onVoiceRecordReturned(event: BaseEvent<{ dialogId: string }>): void
		{
			if (event.getData().dialogId !== this.dialogId)
			{
				return;
			}

			if (this.isVoiceRecording)
			{
				Notifier.onDefaultError();

				return;
			}

			void this.showReturnedVoiceRecord();
		},
		// the queue outlives this field, and its panel is loaded only when the queue has something to show
		async showReturnedVoiceRecord(): Promise<void>
		{
			const dialogId = this.dialogId;
			const unsentVoiceRecords = this.getUnsentVoiceRecords();
			if (this.isVoiceRecording || this.shownVoiceRecord || !unsentVoiceRecords.hasFor(dialogId))
			{
				return;
			}

			const isPanelReady = await this.loadRecordingPanel();
			if (
				!isPanelReady
				|| this.isUnmounted
				|| this.dialogId !== dialogId
				|| this.isVoiceRecording
				|| this.shownVoiceRecord
			)
			{
				return;
			}

			const returnedRecord = unsentVoiceRecords.takeNext(dialogId);
			if (!returnedRecord)
			{
				return;
			}

			const { record, failure } = returnedRecord;
			this.shownVoiceRecord = { dialogId, record: markRaw(record), failure };
			// there is neither a hold nor a pointer behind a record that came back
			this.isVoiceRecordingLocked = true;
			this.isVoiceStartedFromPointer = false;
			this.isVoiceRecording = true;
		},
		// a record is the whole message: no caption, and a reply keeps the quote of the panel
		async onVoiceRecorded(record: VoiceRecord): Promise<void>
		{
			const recordDialogId = this.dialogId;
			const recordPanelType = this.panelType;
			const recordPanelContext = this.panelContext;
			const hasActiveMessageAction = this.hasActiveMessageAction();
			const replyId = this.replyMode ? recordPanelContext.messageId : undefined;

			if (!record.isTargetFormat)
			{
				this.returnVoiceRecord(recordDialogId, record, VoiceSendFailure.unknown);

				return;
			}

			const uploadingService = this.getUploadingService();
			const unsentVoiceRecords = this.getUnsentVoiceRecords();
			let registeredUploaderId = null;

			try
			{
				const { uploaderIds, loadAllComplete } = await this.getUploadManager().upload({
					files: [this.createVoiceRecordFile(record)],
					dialogId: recordDialogId,
					fileParams: {
						isVoiceNote: true,
						// transcribed whichever way it reached the target format, server conversion included
						isTranscribable: true,
						durationSeconds: record.durationSeconds,
					},
				});

				const [uploaderId] = uploaderIds;
				if (!uploaderId)
				{
					throw new Error('the record was not taken into the batch');
				}

				unsentVoiceRecords.hold(uploaderId, recordDialogId, record);
				registeredUploaderId = uploaderId;

				await loadAllComplete;

				uploadingService.sendMessageWithFiles({ uploaderId, text: '', replyId });
				if (
					hasActiveMessageAction
					&& this.dialogId === recordDialogId
					&& this.panelType === recordPanelType
					&& this.panelContext === recordPanelContext
				)
				{
					this.closePanel();
				}
			}
			catch (error)
			{
				// nothing of the record is in the chat, so it belongs back in the panel
				Logger.error('ChatTextarea: sending the voice record failed', error);
				if (registeredUploaderId && !unsentVoiceRecords.release(registeredUploaderId))
				{
					return;
				}

				this.returnVoiceRecord(recordDialogId, record, VoiceSendFailure.unknown);
			}
		},
		returnVoiceRecord(dialogId: string, record: VoiceRecord, failure: string): void
		{
			this.getUnsentVoiceRecords().push(dialogId, record, failure);
		},
		createVoiceRecordFile(record: VoiceRecord): File
		{
			const [, subtype] = record.blob.type.split(';')[0].split('/');
			const extension = VOICE_RECORD_EXTENSION_BY_SUBTYPE[subtype] ?? subtype;

			return new File(
				[record.blob],
				`${VOICE_RECORD_NAME}.${extension || VOICE_RECORD_DEFAULT_EXTENSION}`,
				{ type: record.blob.type },
			);
		},
		getDialogReadyPromise(): Promise<void>
		{
			if (!this.dialogReadyPromise)
			{
				this.dialogReadyPromise = this.initDialogReadyPromise();
			}

			return this.dialogReadyPromise;
		},
		async initDialogReadyPromise(): Promise<void>
		{
			if (this.deferredDialogPromise)
			{
				try
				{
					await this.deferredDialogPromise;
				}
				catch (error)
				{
					Logger.error('ChatTextarea: deferredDialogPromise rejected', error);
				}
				// wait for parent to finish flushing prop updates (withMention/dialogId)
				await this.$nextTick();
			}

			void this.restorePanels();

			if (this.withMention || this.slashCommandEnabled)
			{
				await this.initMentionReplacementMap();
				this.initMentionDetector();
			}

			if (this.slashCommandEnabled)
			{
				this.initSlashCommandManager();
			}

			this.dialogReady = true;
		},
		async restoreOwnDraft(): Promise<void>
		{
			// re-read storage first so a draft sent in another tab does not resurface
			await this.getDraftManager().reloadDraftFromStorage(this.draftKey);

			if (this.text === '')
			{
				await this.restorePanel();
			}

			this.restoreMarketPanel();
		},
		async initMentionReplacementMap()
		{
			const {
				mentions = {},
			} = await this.getDraftManager().getDraft(this.draftKey);

			// markRaw keeps the private fields of the map reachable: a reactive proxy would break them
			this.mentionReplacementMap = markRaw(new MentionReplacementMap());
			this.mentionReplacementMap.set(mentions);
		},
		initMentionDetector()
		{
			this.mentionDetector = new MentionDetector({
				textareaElement: this.$refs.textarea,
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
		},
		initSlashCommandManager()
		{
			this.slashCommandManager = new SlashCommandManager({
				textareaElement: this.$refs.textarea,
				context: { emitter: this.getEmitter() },
				getHasItems: () => this.slashCommandHasItems,
			});

			this.slashCommandManager.subscribe(SlashCommandManagerEvents.showSlashCommandPopup, (event) => {
				const { query } = event.getData();
				this.showSlashCommandPopup(query);
			});

			this.slashCommandManager.subscribe(SlashCommandManagerEvents.hideSlashCommandPopup, () => {
				this.closeSlashCommandPopup();
			});
		},
		getSendingService(): SendingService
		{
			return this.sendingService;
		},
		getInputActionService(): InputSenderService
		{
			if (!this.inputSenderService)
			{
				this.inputSenderService = new InputSenderService(this.dialogId);
			}

			return this.inputSenderService;
		},
		getDraftManager(): DraftManager
		{
			if (!this.draftManager)
			{
				this.draftManager = DraftManager.getInstance();
			}

			return this.draftManager;
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
		getMessageService(): MessageService
		{
			if (!this.messageService)
			{
				this.messageService = new MessageService({ chatId: this.dialog.chatId });
			}

			return this.messageService;
		},
		getUploadingService(): UploadingService
		{
			if (!this.uploadingService)
			{
				this.initUploadingService();
			}

			return this.uploadingService;
		},
		getUnsentVoiceRecords(): UnsentVoiceRecords
		{
			this.unsentVoiceRecords ??= UnsentVoiceRecords.getInstance();

			return this.unsentVoiceRecords;
		},
		initUploadingService()
		{
			this.uploadingService = UploadingService.getInstance();

			// freeing an orphaned session reaches the service after beforeUnmount unsubscribed:
			// a textarea already gone must not subscribe again, nothing would unsubscribe it
			if (this.isUnmounted)
			{
				return;
			}

			this.startFileUploadAction = () => {
				this.getInputActionService().startAction(InputAction.sendingFile);
			};

			this.stopFileUploadAction = () => {
				this.getInputActionService().stopAction(InputAction.sendingFile);
			};
			this.uploadingService.subscribe(UploadingService.event.uploadStart, this.startFileUploadAction);
			this.uploadingService.subscribe(UploadingService.event.uploadComplete, this.stopFileUploadAction);
			this.uploadingService.subscribe(UploadingService.event.uploadCancel, this.stopFileUploadAction);
			this.uploadingService.subscribe(UploadingService.event.uploadError, this.stopFileUploadAction);
		},
		unbindUploadingService()
		{
			if (!this.uploadingService)
			{
				return;
			}

			this.uploadingService.unsubscribe(UploadingService.event.uploadStart, this.startFileUploadAction);
			this.uploadingService.unsubscribe(UploadingService.event.uploadComplete, this.stopFileUploadAction);
			this.uploadingService.unsubscribe(UploadingService.event.uploadCancel, this.stopFileUploadAction);
			this.uploadingService.unsubscribe(UploadingService.event.uploadError, this.stopFileUploadAction);
		},
		getUploadManager(): UploadManager
		{
			if (!this.uploadManager)
			{
				this.uploadManager = new UploadManager();
			}

			return this.uploadManager;
		},
		// the window is locked for the whole of the save: the composition was taken when the save began, and
		// a file leaving it now would be sent under an id that belongs to nothing
		async onSaveFilesFromPreviewPopup(event)
		{
			if (this.isSavingEditedFiles)
			{
				return;
			}

			const { sessionId, messageId, text, fileIds } = event;

			// the question is asked outside the lock: a confirmation dismissed by Escape or by its cross
			// never answers its promise, and a lock held across it would never come off
			if (fileIds.length === 0 && text.trim() === '')
			{
				await this.deleteEmptiedMessage(messageId, sessionId);

				return;
			}

			this.isSavingEditedFiles = true;

			try
			{
				await this.saveEditedFiles(event);
			}
			finally
			{
				this.isSavingEditedFiles = false;
			}
		},
		// the save of an edit does not go through the send path: that one gives the batch away and clears the
		// field before any branching, and a refused save has to leave the window as it was
		async saveEditedFiles(event)
		{
			const { sessionId, messageId, text, fileIds } = event;

			const uploadedFileIds: ?Map<string, string> = await this.getUploadingService()
				.uploadPreviewSession(sessionId)
				.catch((error) => {
					// a file that failed is marked in the window and repeated from there: nothing closes here
					Logger.error('ChatTextarea: uploading the batch of the edited message failed', error);

					// a window the author closed takes its batch down, and that refusal is not a failure
					if (this.previewSessionId === sessionId)
					{
						Notifier.onDefaultError();
					}

					return null;
				});

			if (!uploadedFileIds)
			{
				return;
			}

			// files added in this edit carry temporary ids; the ones the message already had are server ids
			const composition = fileIds.map((fileId: number | string) => uploadedFileIds.get(fileId) ?? fileId);

			// from here the copies stop being ours to delete: the window stays closable while the answer travels
			this.setEditedCompositionFate(EditedCompositionFate.sent);

			const { saved, isApplied, isEditTargetGone } = await this.getMessageService().editMessageFiles(
				messageId,
				{
					fileIds: composition,
					text: this.mentionReplacementMap?.apply(text) ?? text,
				},
			);

			// the window may be gone by now - closed by hand, or moved on to a batch of its own
			if (this.previewSessionId !== sessionId)
			{
				return;
			}

			// an edit that found no message was refused before anything could be saved, so its copies go. No
			// other code tells a composition the server never saved from one it saved and failed to sync
			if (isApplied)
			{
				this.setEditedCompositionFate(EditedCompositionFate.applied);
			}
			else if (isEditTargetGone)
			{
				this.setEditedCompositionFate(EditedCompositionFate.unsent);
			}

			if (saved)
			{
				this.finishSavedEdit(sessionId);

				return;
			}

			if (isEditTargetGone)
			{
				this.discardPreviewSession();
				this.closePanel();
			}
		},
		// a composition the server applied owns the copies for good, so that fate is never given back
		setEditedCompositionFate(fate: $Values<typeof EditedCompositionFate>)
		{
			if (this.editedCompositionFate === EditedCompositionFate.applied)
			{
				return;
			}

			this.editedCompositionFate = fate;
		},
		// an emptied composition on a message without text is a deletion: no update call is made at all
		async deleteEmptiedMessage(messageId: number, sessionId: string): Promise<void>
		{
			const confirmed = await this.confirmMessageDeletion();

			// the answer takes as long as the author needs, and the window may be gone by then
			if (!confirmed || this.previewSessionId !== sessionId)
			{
				return;
			}

			this.getMessageService().deleteMessages([messageId]);
			this.discardPreviewSession();
			this.closePanel();
		},
		confirmMessageDeletion(): Promise<boolean>
		{
			return showDeleteEmptyMessageConfirm();
		},
		// the batch leaves the registry before the window goes, or the lease given up on the way out would
		// take the holder down mid-save. The copies stay where they are - the message owns them now
		finishSavedEdit(sessionId: string)
		{
			const uploadingService = this.getUploadingService();
			uploadingService.unregisterPreviewSession(sessionId);

			this.previewSessionId = null;
			this.previewSessionMessageId = null;

			this.closePanel();
			this.resetTextarea();

			uploadingService.destroyPreviewSession(sessionId);
		},
		// The caret goes back to the field on every way out of the preview dialog, and the move belongs to
		// the focus trap of the dialog, which is handed this field as its restore target. Moving focus from
		// here would be a second move - and a late one: it would land after the upload has finished and take
		// focus from wherever the user has gone by then.
		async onSendFilesFromPreviewPopup(event)
		{
			const { sessionId, text, files, sendAsFile } = event;
			// the send flow owns the session from now on: closing the popup must not destroy it, and
			// the service must stop handing it out, otherwise files picked while the batch is being
			// sent would join a holder about to die
			this.previewSessionId = null;
			this.previewSessionMessageId = null;
			this.getUploadingService().unregisterPreviewSession(sessionId);

			const replyId = this.replyIdForContent;
			const panel = { type: this.panelType, context: this.panelContext };
			let textWithMentions = text;
			let sentSomething = false;

			try
			{
				textWithMentions = this.mentionReplacementMap?.apply(text) ?? text;

				// the caption is handed over to the sending pipeline right away, so the whole state goes
				// down before the upload await: afterwards the field may hold the next typed message
				this.closePanel();
				this.resetTextarea();

				// the upload is asynchronous, so its chat is taken before the prop moves on
				const { dialogId } = this;

				const diskFiles = files.filter((file: UploaderFile) => file.getOrigin() === FileOrigin.SERVER);
				const localFiles = files.filter((file: UploaderFile) => file.getOrigin() !== FileOrigin.SERVER);

				if (Type.isArrayFilled(diskFiles))
				{
					this.getUploadingService().sendDiskFilesFromPreview({
						files: diskFiles,
						dialogId,
						text: textWithMentions,
						replyId,
						sendAsFile,
					});
					sentSomething = true;
				}

				if (Type.isArrayFilled(localFiles))
				{
					const policy = this.getUploadManager().getPolicy(dialogId);
					const multiUploadingResult = await this.getUploadManager().upload({
						files: localFiles,
						dialogId,
						autoUpload: false,
						sendAsFile,
						maxFilesCount: policy?.maxFilesPerMessage,
					});

					await multiUploadingResult.loadAllComplete;

					multiUploadingResult.uploaderIds.forEach((uploaderId: string, index) => {
						this.getUploadingService().sendMessageWithFiles({
							uploaderId,
							text: index === 0 && diskFiles.length === 0 ? textWithMentions : '',
							replyId,
						});
					});

					sentSomething = sentSomething || Type.isArrayFilled(multiUploadingResult.uploaderIds);
				}
			}
			catch (error)
			{
				// the batch itself cannot be handed back: part of it may already be on its way, so its
				// holder dies with the send. What comes back is the caption, to be sent again as is,
				// but only while nothing left with it, otherwise it would be sent twice
				Logger.error('ChatTextarea: sending the batch from the preview popup failed', error);
				Notifier.onDefaultError();

				if (!sentSomething)
				{
					this.restoreUnsentCaption({ text, textWithMentions, panel });
				}

				return;
			}
			finally
			{
				// the holder outlives the send: its files are read while the batch is being re-added
				this.getUploadingService().destroyPreviewSession(sessionId);
			}

			// the control is already closed and the files went with it, so a silent return would
			// read as "nothing happened" - a mix of disk and local files may lose only one half.
			// A send that went through needs nothing here: the dialog has already returned the focus
			// to the element it was opened from (see restoreFocusTarget), and a move of its own would
			// take the focus from wherever the user has put it while the files were uploading
			if (!sentSomething)
			{
				Notifier.onDefaultError();
				this.restoreUnsentCaption({ text, textWithMentions, panel });
			}
		},
		restoreUnsentCaption({ text, textWithMentions, panel })
		{
			// the user may have started the next message while the files were uploading: their input wins
			if (this.text !== '' || this.panelType !== PanelType.none)
			{
				return;
			}

			if (this.mentionReplacementMap)
			{
				const mentions = this.mentionReplacementMap.extract(textWithMentions);
				this.mentionReplacementMap.set(mentions);
				this.getDraftManager().setDraftMentions(this.draftKey, mentions);
			}

			// the text goes back through the field, so its own watcher restores the draft text
			this.text = text;

			if (this.canRestorePanel(panel))
			{
				this.panelType = panel.type;
				this.panelContext = panel.context;
				this.getDraftManager().setDraftPanel(this.draftKey, panel.type, panel.context);
			}

			if (this.canRestoreFocus())
			{
				this.focus();
			}
		},
		canRestorePanel(panel: { type: string, context: PanelContextWithMultipleIds }): boolean
		{
			if (panel.type === PanelType.none)
			{
				return false;
			}

			// only a message-bound panel can go stale: its message may be deleted during the upload
			if (!MESSAGE_ACTION_PANELS.has(panel.type))
			{
				return true;
			}

			return this.verifyPanelContext(panel.context);
		},
		canRestoreFocus(): boolean
		{
			// the closed control leaves the focus on the body, but an element the user moved to keeps it
			const { activeElement } = document;

			return !activeElement || activeElement === document.body || activeElement === this.$refs.textarea;
		},
		closeMentionPopup()
		{
			this.showMention = false;
			this.mentionQuery = '';
			this.mentionActiveItemId = null;
			this.mentionDetector.onMentionPopupClose();
		},
		getInputElement(): ?HTMLTextAreaElement
		{
			return this.$refs.textarea;
		},
		getText(): string
		{
			return this.text;
		},
		hasMentionOfUser(userId: string | number): boolean
		{
			return this.mentionReplacementMap?.hasMentionOfUser(this.text, userId) ?? false;
		},
		showMentionPopup(mentionQuery: string)
		{
			this.mentionQuery = mentionQuery;
			this.showMention = true;
		},
		onMentionActiveItemChanged(event: BaseEvent<MentionActiveItemEvent>)
		{
			// the list owns the active item, the field only mirrors the id it must point at
			this.mentionActiveItemId = event.getData().nodeId;
		},
		closeSlashCommandPopup()
		{
			this.showSlashCommand = false;
			this.slashCommandQuery = '';
			this.slashCommandHasItems = false;
			this.slashCommandManager?.onSlashCommandPopupClose();
		},
		onSlashCommandItemsChanged(event: BaseEvent<{ dialogId: string, hasItems: boolean }>)
		{
			const { dialogId, hasItems } = event.getData();
			if (this.dialogId !== dialogId)
			{
				return;
			}
			this.slashCommandHasItems = hasItems;
		},
		showSlashCommandPopup(query: string)
		{
			this.slashCommandQuery = query;
			this.showSlashCommand = true;
		},
		onCloseSlashCommandPopupRequest(event: BaseEvent<{ dialogId: string }>)
		{
			const { dialogId } = event.getData();
			if (this.dialogId !== dialogId || !this.showSlashCommand)
			{
				return;
			}
			this.closeSlashCommandPopup();
		},
		onSlashCommandButtonClick()
		{
			if (!this.slashCommandManager)
			{
				return;
			}

			const textarea = this.$refs.textarea;
			textarea.focus({ preventScroll: true });

			const textareaLike = { value: textarea.value, selectionEnd: textarea.selectionEnd };

			if (this.showSlashCommand || isSlashLineStillOpen(textareaLike))
			{
				const line = getCurrentLineText(textareaLike);
				const slashIndex = line.indexOf('/');
				if (slashIndex >= 0)
				{
					// place the caret at the end of the slash fragment so the whole command (e.g. "/help")
					// becomes the query and is replaced on select - otherwise only the "/" would be replaced
					const lineStart = textarea.value.lastIndexOf('\n', textarea.selectionEnd - 1) + 1;
					const nextLineBreak = textarea.value.indexOf('\n', lineStart);
					const caretPosition = nextLineBreak === -1 ? textarea.value.length : nextLineBreak;

					textarea.selectionStart = caretPosition;
					textarea.selectionEnd = caretPosition;
				}

				this.slashCommandManager.openSlashCommandPopup();

				return;
			}

			// "/" is inserted only into a completely empty line: a command must reach the server at the
			// line start (^\/), so we never place it after a mention, existing text or whitespace.
			const lineStart = textarea.value.lastIndexOf('\n', textarea.selectionEnd - 1) + 1;
			const nextLineBreak = textarea.value.indexOf('\n', lineStart);
			const lineEnd = nextLineBreak === -1 ? textarea.value.length : nextLineBreak;
			if (textarea.value.slice(lineStart, lineEnd) !== '')
			{
				return;
			}

			const caretPosition = lineStart + 1;
			const newValue = `${textarea.value.slice(0, lineStart)}/${textarea.value.slice(lineStart)}`;

			textarea.value = newValue;
			textarea.selectionStart = caretPosition;
			textarea.selectionEnd = caretPosition;
			this.text = newValue;

			this.slashCommandManager.openSlashCommandPopup();
		},
		// the lock of the window is taken off by a render, and the save asks for the focus before that
		// render has run: a field still carrying the disabled attribute would take no focus at all
		async focus(): Promise<void>
		{
			if (this.$refs.textarea?.disabled)
			{
				await this.$nextTick();
			}

			this.$refs.textarea?.focus({ preventScroll: true });
		},
		onContentClick(event: MouseEvent)
		{
			// a synthetic click from activating a nested button via keyboard has detail 0 and a nested
			// target; do not pull focus back to the field then (it would break navigation over the buttons)
			if (event.detail === 0 && event.target !== event.currentTarget)
			{
				return;
			}

			this.focus();
		},
		onContentKeyDown(event: KeyboardEvent)
		{
			// the handler sits on the input area, so keys from the field and from the buttons bubble here
			// too: only the area's own keystrokes drive it
			if (!this.withKeyboardNavigation || event.target !== event.currentTarget)
			{
				return;
			}

			if (Utils.key.isCombination(event, 'Enter') || Utils.key.isCombination(event, 'Space'))
			{
				event.preventDefault();
				this.resumeTyping();

				return;
			}

			if (this.isNativeTextInputStart(event))
			{
				// Dead keys and IME need the browser's composition pipeline: move focus before it starts,
				// but do not cancel or synthesize the input.
				this.resumeTyping();

				return;
			}

			if (this.isTextInputKey(event))
			{
				event.preventDefault();
				this.resumeTyping(event.key);
			}

			// Tab and Shift+Tab stay with the browser, Esc with the global chain: neither is handled here
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
		onAudioInputStart()
		{
			if (this.isEmptyText)
			{
				return;
			}

			this.text += ' ';
		},
		onAudioInputResult(inputText: string)
		{
			this.text += inputText;
		},
		onCloseComments()
		{
			this.restoreTextareaHeight();
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<div
			class="bx-im-send-panel__scope bx-im-send-panel__container --ui-context-content-light"
			data-testid="im-textarea-panel"
		>
			<div class="bx-im-textarea__container">
				<div
					@mousedown="onResizeStart"
					class="bx-im-textarea__drag-handle"
					data-testid="im-textarea-drag-handle"
				></div>
				<TextareaPanel
					:type="panelType"
					:context="panelContext"
					:dialogId="dialogId"
					@close="onPanelClose"
				/>
				<component
					:is="recordingPanel"
					v-if="isVoiceRecording && recordingPanel"
					:dialogId="dialogId"
					:isLockedOnStart="isVoiceRecordingLocked"
					:isStartedFromPointer="isVoiceStartedFromPointer"
					:initialRecord="voiceRecordReturned"
					:sendFailure="voiceSendFailure"
					ref="voiceRecordingPanel"
					@recorded="onVoiceRecorded"
					@close="closeVoiceRecording"
				/>
				<!-- the field is hidden, not unmounted: the recording is over in seconds and the
					 detectors bound to its element outlive it -->
				<div
					v-show="!isVoiceRecording"
					class="bx-im-textarea__content"
					:class="{ '--locked': isEditingAttachments, '--focus-outline': showAreaFocusOutline }"
					ref="textarea-content"
					:tabindex="withKeyboardNavigation ? 0 : null"
					:role="withKeyboardNavigation ? 'region' : null"
					:aria-label="withKeyboardNavigation ? loc('IM_TEXTAREA_AREA_ARIA') : null"
					@click="onContentClick"
					@keydown="onContentKeyDown"
					data-testid="im-textarea-area"
				>
					<div class="bx-im-textarea__top">
						<div
							:class="{
								'bx-im-textarea__upload-menu-wrapper': true,
								'bx-im-textarea__upload-menu-wrapper--muted': !dialogReady,
							}"
							v-if="withUploadMenu"
							data-testid="im-textarea-upload-menu-wrapper"
						>
							<UploadMenu
								:dialogId="dialogId"
								:disabled="!dialogReady"
								@fileSelect="onFileSelect"
								@diskFileSelect="onDiskFileSelect"
							/>
						</div>
						<BIcon
							v-if="showSlashCommandButton"
							:name="OutlineIcons.COMMANDS"
							:title="loc('IM_TEXTAREA_ICON_SLASH_COMMAND')"
							:size="ICON_SIZE"
							:color="slashCommandIconColor"
							class="bx-im-textarea__slash-command-icon"
							data-testid="im-textarea-slash-command-btn"
							@click="onSlashCommandButtonClick"
						/>
						<textarea
							v-model="text"
							v-bind="mentionComboboxAttrs"
							:style="textareaStyle"
							:placeholder="textareaPlaceholder"
							:disabled="isEditingAttachments"
							:aria-label="loc('IM_TEXTAREA_INPUT_ARIA')"
							:aria-describedby="withKeyboardNavigation ? fieldDescriptionId : null"
							:tabindex="withKeyboardNavigation ? -1 : null"
							:maxlength="textareaMaxLength"
							@keydown="onKeyDown"
							@mouseup="onMouseUp"
							@blur="rememberSelection"
							@paste="onPaste"
							class="bx-im-textarea__element"
							ref="textarea"
							rows="1"
							data-testid="im-textarea-input"
						></textarea>
					</div>
					<div class="bx-im-textarea__bottom">
						<slot name="bottom-panel-buttons"></slot>
						<AutoDeleteSelector
							v-if="isAutoDeleteEnabled"
							:dialogId="dialogId"
						/>
						<IconButton
							v-if="showMarketIcon"
							ref="marketIcon"
							:iconName="OutlineIcons.APPS"
							:label="loc('IM_TEXTAREA_ICON_APPLICATION')"
							:iconSize="ICON_SIZE"
							:iconColor="marketIconColor"
							:expanded="marketMode"
							class="bx-im-textarea__icon"
							data-testid="im-textarea-market-btn"
							@click="onMarketIconClick"
						/>
						<EmoteSelector
							v-if="withSmileSelector"
							:dialogId="dialogId"
						/>
						<AudioInput
							:dialogId="dialogId"
							:isDisabled="isAudioInputDisabled"
							@inputStart="onAudioInputStart"
							@inputResult="onAudioInputResult"
							@activeChange="isAudioInputActive = $event"
						/>
						<VoiceRecorderButton
							v-if="showVoiceRecorderButton"
							:isDisabled="isVoiceRecorderDisabled"
							:isAudioInputActive="isAudioInputActive"
							@press="startVoiceRecording"
						/>
						<SendButton
							v-else
							:dialogId="dialogId"
							:editMode="editMode"
							:isDisabled="isDisabled"
							:isStopGenerationState="isStopGenerationState"
							:data-testid="isStopGenerationState ? 'copilot-generation-stop-btn' : 'im-textarea-send-btn'"
							@click="sendMessage"
							@stop="stopGeneration"
						/>
					</div>
				</div>
				<!-- outside the input area on purpose: aria-describedby resolves by id from anywhere, while a
					node left inside the area becomes part of what a screen reader replays on entering it. -->
				<span
					v-if="withKeyboardNavigation"
					:id="fieldDescriptionId"
					class="bx-im-textarea__sr-only"
				>{{ loc('IM_TEXTAREA_KEYBOARD_NAV_ARIA') }}</span>
			</div>
			<UploadPreviewPopup
				v-if="previewSessionId"
				:dialogId="dialogId"
				:sessionId="previewSessionId"
				:textareaValue="text"
				:restoreFocusTarget="getInputElement"
				:draftKey="draftKey"
				:mentionReplacementMap="mentionReplacementMap"
				:withCopilot="withCopilot"
				:editedMessageId="previewSessionMessageId"
				:isSaving="isSavingEditedFiles"
				:canRemoveFilesFromServer="!isEditedCompositionSent"
				@close="onUploadPreviewClose"
				@sendFiles="onSendFilesFromPreviewPopup"
				@saveFiles="onSaveFilesFromPreviewPopup"
			/>
			<MentionPopup
				v-if="withMention && showMention"
				:bindElement="$refs['textarea-content']"
				:dialogId="dialogId"
				:query="mentionQuery"
				:withCopilot="withCopilot"
				@close="closeMentionPopup"
				@onFocusTextarea="focus"
			/>
			<SlashCommandPopup
				v-if="slashCommandEnabled && showSlashCommand"
				:bindElement="$refs['textarea-content']"
				:dialogId="dialogId"
				:query="slashCommandQuery"
				@close="closeSlashCommandPopup"
			/>
			<FormatToolbar
				v-if="showFormatToolbar"
				:dialogId="dialogId"
				:textarea="$refs.textarea"
				:targetPosition="formatToolbarPosition"
				:useMarkdown="isMarkdownInputAvailable"
				@updateText="onFormatToolbarUpdateText"
				@close="showFormatToolbar = false"
			/>
		</div>
	`,
};
