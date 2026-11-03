/**
 * One message of a note: who wrote it, when, and the text itself. Its own message is the only
 * one that carries the actions of editing and of deletion - the server says so with `canEdit`, and an
 * administrator gets no such right over a message of somebody else (AC-021, AC-025).
 *
 * The text is drawn by the same extension the message was written in, with editing switched off. It is
 * never put into the markup of the page as a string: the stored markup (DTO-03) is parsed into the
 * nodes of a document by the editor itself, which is what keeps a written `<script>` a written one. The
 * same instance is what an edit types into, so what is read back is serialised exactly as the field of
 * a reply serialises it and nothing on the client has to agree with the server about the format twice.
 *
 * The note is gone with its last message by the word of the server alone (`noteRemoved`): the number of
 * messages of a note is never counted here, because a deletion made in another tab arrives as a live
 * signal and would be counted twice. The conversation is counted for one thing only - whether to ask
 * before deleting the message that would take the whole note with it. That count decides nothing about
 * the note itself: a wrong one asks a question too many or one too few, and the answer of the server
 * still says what became of the note.
 */

import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { DateTimeFormat } from 'main.date';
import { MessageBox } from 'ui.dialogs.messagebox';
import { Outline } from 'ui.icon-set.api.vue';
import { Text3Xs, TextXs } from 'ui.system.typography.vue';
import { TextEditor } from 'ui.text-editor';
import { Dom, Loc, Text, Type } from 'main.core';
import { defineComponent } from 'ui.vue3';

import {
	useNotesStore,
	type TemplateNoteMessage,
	type WrittenMessageOutcome,
} from '../../../../entities/notes';
import { useLoc } from '../../../../shared/composables';
import { useToastStore } from '../../../../shared/stores';
import { MenuButton } from '../../../../shared/ui';
import { formatRelativeTime } from '../../../../shared/utils';
import { createNoteEditorOptions } from '../../lib/editor-options';

import './note-message.css';

const MESSAGE_TEST_ID = 'bizprocdesigner-note-message';
const ACTIONS_TEST_ID = 'bizprocdesigner-note-message-actions';
const STATUS_TEST_ID = 'bizprocdesigner-note-message-status';
const SAVE_TEST_ID = 'bizprocdesigner-note-message-save';
const CANCEL_TEST_ID = 'bizprocdesigner-note-message-cancel';
const EDIT_ITEM_TEST_ID = 'bizprocdesigner-note-message-action-edit';
const DELETE_ITEM_TEST_ID = 'bizprocdesigner-note-message-action-delete';
const TEXT_TEST_ID = 'bizprocdesigner-note-message-text';
const AUTHOR_TEST_ID = 'bizprocdesigner-note-message-author';
const TIME_TEST_ID = 'bizprocdesigner-note-message-time';

const AUTHOR_UNKNOWN_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_AUTHOR_UNKNOWN';
const EDITED_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_EDITED';
const ACTIONS_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_ACTIONS_ARIA_LABEL';
const ACTION_EDIT_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_ACTION_EDIT';
const ACTION_DELETE_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_ACTION_DELETE';
const DELETE_CONFIRM_TITLE_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_DELETE_CONFIRM_TITLE';
const DELETE_CONFIRM_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_DELETE_CONFIRM_MESSAGE';
const DELETE_CONFIRM_OK_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_DELETE_CONFIRM_OK';
const DELETE_CONFIRM_CANCEL_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_DELETE_CONFIRM_CANCEL';
const EDIT_PLACEHOLDER_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_EDIT_PLACEHOLDER';
const EDIT_ARIA_LABEL_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_EDIT_ARIA_LABEL';
const EDIT_SAVE_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_EDIT_SAVE';
const EDIT_CANCEL_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_EDIT_CANCEL';
const EMPTY_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_ERROR_EMPTY';
const TOO_LONG_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_ERROR_TOO_LONG';
const MENTION_LIMIT_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_ERROR_MENTION_LIMIT';
const REVISION_MISMATCH_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_ERROR_REVISION_MISMATCH';
const ACCESS_DENIED_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_ERROR_ACCESS_DENIED';
const FEATURE_DISABLED_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_ERROR_FEATURE_DISABLED';
const SAVE_FAILED_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_ERROR_SAVE_COMMON';
const DELETE_FAILED_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_ERROR_DELETE_COMMON';
const UNAVAILABLE_MENTIONS_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_NOTICE_MENTIONS';
const NOTIFY_FAILED_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_NOTICE_NOTIFY_FAILED';

/**
 * The refusals whose whole explanation is one phrase. The two that name a number of their own - the
 * length of a message and the count of its mentions - are built apart, because a limit that has not
 * arrived from the server cannot be named.
 *
 * The quotas of the notes of a template and of the messages of a note answer a creation and a reply;
 * an edit and a deletion add nothing to either count, and neither code reaches here.
 */
const REFUSAL_MESSAGE_IDS: { +[string]: string } = Object.freeze({
	EMPTY_MESSAGE: EMPTY_MESSAGE_ID,
	REVISION_MISMATCH: REVISION_MISMATCH_MESSAGE_ID,
	ACCESS_DENIED: ACCESS_DENIED_MESSAGE_ID,
	FEATURE_DISABLED: FEATURE_DISABLED_MESSAGE_ID,
});

/**
 * A saved message is read, not filled in: the frame, the ground and the paddings of a field belong to
 * the editing of one and are drawn around the text by this component instead (`--editing`).
 */
const VISUAL_OPTIONS = Object.freeze({
	borderWidth: '0',
	colorBackground: 'transparent',
	blockSpaceInline: '0',
	blockSpaceStack: '0',
});

export const NoteMessage = defineComponent({
	name: 'BizprocdesignerNoteMessage',
	components: { MenuButton, Text3Xs, TextXs, UiButton },
	props: {
		message: {
			/** @type TemplateNoteMessage */
			type: Object,
			required: true,
		},
		// the hint of the mentions of an edit answers with the editors of this template and nobody else
		templateId: {
			type: Number,
			required: true,
		},
		// The name of the author is resolved for the whole thread at once: DTO-02 carries the identifier
		// alone, and a message asking for a name of its own would ask once per message.
		authorName: {
			type: String,
			default: '',
		},
		// the notes are read-only: the message is read and neither edited nor deleted from here
		readonly: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['edited', 'deleted'],
	setup(): Object
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			notesStore: useNotesStore(),
			toastStore: useToastStore(),
			AirButtonStyle,
			Outline,
			buttonSize: ButtonSize.SMALL,
			saveButtonStyle: AirButtonStyle.FILLED,
			cancelButtonStyle: AirButtonStyle.PLAIN_NO_ACCENT,
		};
	},
	data(): Object
	{
		return {
			isEditing: false,
			isSaving: false,
			refusal: '',
			notices: [],
			statusId: `editor-chart-note-message-status-${Text.getRandom().toLowerCase()}`,
		};
	},
	computed: {
		authorText(): string
		{
			return Type.isStringFilled(this.authorName)
				? this.authorName
				: this.getMessage(AUTHOR_UNKNOWN_MESSAGE_ID)
			;
		},
		writtenAt(): number
		{
			const written = Date.parse(this.message.createdAt);

			return Number.isNaN(written) ? 0 : written;
		},
		timeText(): string
		{
			return formatRelativeTime(this.writtenAt, this.getMessage);
		},
		// The relative label rounds the time off, so the exact one is kept within reach of a pointer.
		exactTime(): string
		{
			return this.writtenAt === 0
				? ''
				: DateTimeFormat.format(
					DateTimeFormat.getFormat('FORMAT_DATETIME'),
					new Date(this.writtenAt),
				)
			;
		},
		isEdited(): boolean
		{
			return Type.isStringFilled(this.message.modifiedAt);
		},
		editedText(): string
		{
			return this.getMessage(EDITED_MESSAGE_ID);
		},
		actionsLabel(): string
		{
			return this.getMessage(ACTIONS_MESSAGE_ID);
		},
		// The actions belong to the author of the message alone (`canEdit`), and to nobody at all while
		// the notes are read-only. Neither is the protection: the server refuses either way (AC-039).
		hasActions(): boolean
		{
			return this.message.canEdit === true && !this.readonly;
		},
		saveText(): string
		{
			return this.getMessage(EDIT_SAVE_MESSAGE_ID);
		},
		cancelText(): string
		{
			return this.getMessage(EDIT_CANCEL_MESSAGE_ID);
		},
		// A limit that has not arrived with the list of the notes holds nothing back.
		messageLimit(): number
		{
			return this.notesStore.limits.messageLength;
		},
		mentionLimit(): number
		{
			return this.notesStore.limits.mentionsPerMessage;
		},
		/**
		 * Whether this message is the whole of its note, so that deleting it takes the note off the
		 * schema with everything written in it. The conversation held by the store is what says it: a
		 * thread that is open has been read whole from the server (API-07), and it is the only reading
		 * of the note that is current at the moment of the click. The `messageCount` of the marker is
		 * not that reading - it only ever moves by an answer of the server (ALG-03) and lags behind an
		 * open thread by whatever was written into it since.
		 */
		isLastMessage(): boolean
		{
			const messages: TemplateNoteMessage[] = this.notesStore.messages[this.message.noteId] ?? [];

			return messages.length === 1 && messages[0].id === this.message.id;
		},
		menuOptions(): Object
		{
			return {
				items: [
					{
						title: this.getMessage(ACTION_EDIT_MESSAGE_ID),
						icon: Outline.EDIT_M,
						dataset: { testid: this.$testId(EDIT_ITEM_TEST_ID, String(this.message.id)) },
						onClick: () => this.startEditing(),
					},
					{
						title: this.getMessage(ACTION_DELETE_MESSAGE_ID),
						icon: Outline.TRASHCAN,
						design: 'alert',
						dataset: { testid: this.$testId(DELETE_ITEM_TEST_ID, String(this.message.id)) },
						onClick: () => this.handleDeleteClick(),
					},
				],
			};
		},
		messageTestId(): string
		{
			return this.$testId(MESSAGE_TEST_ID, String(this.message.id));
		},
		actionsTestId(): string
		{
			return this.$testId(ACTIONS_TEST_ID, String(this.message.id));
		},
		statusTestId(): string
		{
			return this.$testId(STATUS_TEST_ID, String(this.message.id));
		},
		// The dataset key is lower-case on purpose: `testid` renders as data-testid, the attribute
		// page.getByTestId() looks for, while a camel-cased `testId` would render data-test-id.
		saveButtonDataset(): { testid: string }
		{
			return { testid: this.$testId(SAVE_TEST_ID, String(this.message.id)) };
		},
		cancelButtonDataset(): { testid: string }
		{
			return { testid: this.$testId(CANCEL_TEST_ID, String(this.message.id)) };
		},
		// The body of the message, and the field an edit of it is written in: ui.text-editor renders
		// into this node either way, so one label reaches both.
		textTestId(): string
		{
			return this.$testId(TEXT_TEST_ID, String(this.message.id));
		},
		authorTestId(): string
		{
			return this.$testId(AUTHOR_TEST_ID, String(this.message.id));
		},
		timeTestId(): string
		{
			return this.$testId(TIME_TEST_ID, String(this.message.id));
		},
	},
	watch: {
		// The right may be taken away while an edit stands open. The edit is given up with it, and the
		// message is left as the server has it: saving it would only be refused now.
		readonly(isReadonly: boolean): void
		{
			if (isReadonly && this.isEditing)
			{
				this.handleCancel();
			}
		},
		/**
		 * The text of a message changes under this component whenever it is written elsewhere: an edit
		 * of another tab arrives as a live signal, and an edit of this one is answered by the server.
		 * An edit being typed here is the one case the incoming text does not replace - it would wipe
		 * out what is being written; the refusal by the revision puts the actual text in itself.
		 */
		'message.text': function(text: string): void
		{
			if (!this.isEditing)
			{
				this.editor?.setText(text);
			}
		},
	},
	created(): void
	{
		// Off data() on purpose: the editor keeps private fields and drops its own prototype in
		// destroy(), neither of which survives a reactive proxy, and nothing renders it.
		this.editor = null;
	},
	mounted(): void
	{
		this.editor = new TextEditor({
			...createNoteEditorOptions({
				templateId: this.templateId,
				placeholder: this.getMessage(EDIT_PLACEHOLDER_MESSAGE_ID),
			}),
			// The saved text is parsed into the nodes of a document by the editor; the heights of a
			// field of its own belong to one being typed into and not to a message being read.
			content: this.message.text,
			editable: false,
			minHeight: null,
			maxHeight: null,
			visualOptions: { ...VISUAL_OPTIONS },
		});

		this.editor.renderTo(this.$refs.container);
	},
	beforeUnmount(): void
	{
		this.editor?.destroy();
		this.editor = null;
	},
	methods: {
		/**
		 * ui.text-editor renders the input area as a bare contenteditable div, so a message being
		 * edited reaches the accessibility tree as a piece of text and not as a field. The semantics
		 * are put on for the edit and taken off with it: a message that is only read is not a field,
		 * and a div left claiming to be one would be announced as editable text nobody can edit.
		 */
		applyEditFieldSemantics(isEditing: boolean): void
		{
			Dom.attr(this.editor?.getEditableContainer() ?? null, {
				role: isEditing ? 'textbox' : null,
				'aria-multiline': isEditing ? 'true' : null,
				'aria-label': isEditing ? this.getMessage(EDIT_ARIA_LABEL_MESSAGE_ID) : null,
				'aria-describedby': isEditing ? this.statusId : null,
			});
		},
		startEditing(): void
		{
			this.isEditing = true;
			this.refusal = '';
			this.notices = [];
			this.editor?.setEditable(true);
			this.applyEditFieldSemantics(true);
			// the message as it stands now: the menu may have been opened over a text written elsewhere
			this.editor?.setText(this.message.text);
			// an edit continues a written message, so the caret stands after it and not before it
			this.editor?.focus(null, { defaultSelection: 'rootEnd' });
		},
		stopEditing(): void
		{
			this.isEditing = false;
			this.refusal = '';
			this.editor?.setEditable(false);
			this.applyEditFieldSemantics(false);
		},
		handleCancel(): void
		{
			this.stopEditing();
			this.editor?.setText(this.message.text);
		},
		tooLongText(): string
		{
			return this.getMessage(TOO_LONG_MESSAGE_ID, { '#LIMIT#': String(this.messageLimit) });
		},
		/**
		 * The code of the refusal is the whole contract of the server, so every one of them is named
		 * here. The two limits are told with their number only when the number is known; without it the
		 * refusal of the operation is left.
		 */
		refusalText(error: mixed, commonMessageId: string): string
		{
			const code: string | null = error?.code ?? null;

			if (code === 'MESSAGE_TOO_LONG')
			{
				return this.messageLimit > 0 ? this.tooLongText() : this.getMessage(commonMessageId);
			}

			if (code === 'MENTION_LIMIT_REACHED')
			{
				return this.mentionLimit > 0
					? this.getMessage(MENTION_LIMIT_MESSAGE_ID, { '#LIMIT#': String(this.mentionLimit) })
					: this.getMessage(commonMessageId)
				;
			}

			const isNamed = code !== null && Object.hasOwn(REFUSAL_MESSAGE_IDS, code);

			return this.getMessage(isNamed ? REFUSAL_MESSAGE_IDS[code] : commonMessageId);
		},
		/**
		 * The edit is saved either way, so what became of the notifications of the people it mentions is
		 * told beside it and not as a failure of the saving (ERR-003, ERR-004).
		 */
		noticesOf(outcome: WrittenMessageOutcome): string[]
		{
			const notices = [];
			const unavailableCount = outcome.unavailableMentions.length;

			if (unavailableCount > 0)
			{
				// The count governs the agreement of the phrase, and one mention out of reach is the
				// usual case, so the phrase is taken in the form of the number and not written once.
				notices.push(Loc.getMessagePlural(UNAVAILABLE_MENTIONS_MESSAGE_ID, unavailableCount, {
					'#COUNT#': String(unavailableCount),
				}));
			}

			if (outcome.notifyFailed)
			{
				notices.push(this.getMessage(NOTIFY_FAILED_MESSAGE_ID));
			}

			return notices;
		},
		/**
		 * The revision the edit was written over travels with it, so an edit made meanwhile is refused
		 * instead of overwritten. The answer of the refusal carries the message as it stands now: it is
		 * shown right here, and the edit is repeated over it knowingly (ERR-007). Reading the whole
		 * thread again for that is not needed - the actual text came with the refusal.
		 */
		async handleSave(): Promise<void>
		{
			if (this.isSaving)
			{
				return;
			}

			const text = this.editor?.getText() ?? '';
			const length = text.trim().length;

			// An empty message is refused where it was written, and so is one over the limit: neither
			// reaches the server, and what was typed stays in the field (ERR-001, ERR-013).
			if (length === 0)
			{
				this.refusal = this.getMessage(EMPTY_MESSAGE_ID);

				return;
			}

			if (this.messageLimit > 0 && length > this.messageLimit)
			{
				this.refusal = this.tooLongText();

				return;
			}

			if (text === this.message.text)
			{
				this.handleCancel();

				return;
			}

			this.isSaving = true;
			this.refusal = '';
			this.notices = [];
			try
			{
				const outcome: WrittenMessageOutcome = await this.notesStore.updateMessage(
					this.message.id,
					text,
					this.message.revision,
				);

				this.stopEditing();
				this.notices = this.noticesOf(outcome);
				this.$emit('edited', outcome);
			}
			catch (error)
			{
				this.refusal = this.refusalText(error, SAVE_FAILED_MESSAGE_ID);
				if (error?.code === 'REVISION_MISMATCH')
				{
					this.showActualText(error?.data?.actual ?? null);
				}
			}
			finally
			{
				this.isSaving = false;
			}
		},
		/**
		 * The message as the server has it now, taken from the refusal by the revision itself. The field
		 * keeps standing open over it: the edit was not applied, and it is this text it has to be made
		 * again.
		 */
		showActualText(actual: TemplateNoteMessage | null): void
		{
			if (Type.isStringFilled(actual?.text))
			{
				this.editor?.setText(actual.text);
			}
		},
		/**
		 * A message that is one of several is deleted by the click itself: it takes nothing but itself
		 * away. The last one takes the note and the whole of its conversation, and that is as final as
		 * the completion of a discussion - so the same dialog of the design system asks first, and
		 * closing it without an answer leaves everything as it was.
		 */
		handleDeleteClick(): void
		{
			if (!this.isLastMessage)
			{
				void this.handleDelete();

				return;
			}

			MessageBox.confirm(
				this.getMessage(DELETE_CONFIRM_MESSAGE_ID),
				this.getMessage(DELETE_CONFIRM_TITLE_MESSAGE_ID),
				(messageBox) => {
					messageBox.close();
					void this.handleDelete();
				},
				this.getMessage(DELETE_CONFIRM_OK_MESSAGE_ID),
				(messageBox) => {
					messageBox.close();
				},
				this.getMessage(DELETE_CONFIRM_CANCEL_MESSAGE_ID),
			);
		},
		/**
		 * The message leaves the thread with the click and comes back if the server refuses to take it,
		 * so a refusal has to outlive this component: it is told by the editor and not by a row that is
		 * no longer in the document. Whether the note itself is gone with the message is the answer of
		 * the server (`noteRemoved`) and never a count of the messages left here (ERR-012).
		 */
		async handleDelete(): Promise<void>
		{
			try
			{
				const noteRemoved: boolean = await this.notesStore.deleteMessage(this.message.id);

				this.$emit('deleted', noteRemoved);
			}
			catch (error)
			{
				this.toastStore.addWarning(this.refusalText(error, DELETE_FAILED_MESSAGE_ID));
			}
		},
	},
	template: `
		<article
			class="editor-chart-note-message"
			:class="{ '--editing': isEditing }"
			:data-testid="messageTestId"
		>
			<header class="editor-chart-note-message__head">
				<TextXs
					className="editor-chart-note-message__author"
					:data-testid="authorTestId"
				>{{ authorText }}</TextXs>
				<Text3Xs
					className="editor-chart-note-message__time"
					:title="exactTime"
					:data-testid="timeTestId"
				>{{ timeText }}</Text3Xs>
				<Text3Xs
					v-if="isEdited"
					className="editor-chart-note-message__edited"
				>{{ editedText }}</Text3Xs>
				<span
					v-if="hasActions"
					class="editor-chart-note-message__actions"
					:data-testid="actionsTestId"
				>
					<MenuButton
						:icon="Outline.MORE_M"
						:buttonStyle="AirButtonStyle.PLAIN_NO_ACCENT"
						:options="menuOptions"
						:ariaLabel="actionsLabel"
					/>
				</span>
			</header>
			<!-- ui.text-editor owns the children of this node; anything Vue renders stays its sibling -->
			<div
				class="editor-chart-note-message__text"
				:data-testid="textTestId"
				ref="container"
			></div>
			<div v-if="isEditing" class="editor-chart-note-message__form">
				<UiButton
					:text="cancelText"
					:size="buttonSize"
					:style="cancelButtonStyle"
					:dataset="cancelButtonDataset"
					:disabled="isSaving"
					@click="handleCancel"
				/>
				<UiButton
					:text="saveText"
					:size="buttonSize"
					:style="saveButtonStyle"
					:dataset="saveButtonDataset"
					:loading="isSaving"
					@click="handleSave"
				/>
			</div>
			<div
				:id="statusId"
				class="editor-chart-note-message__status"
				:data-testid="statusTestId"
				aria-live="polite"
			>
				<TextXs
					v-if="refusal !== ''"
					className="editor-chart-note-message__error"
				>{{ refusal }}</TextXs>
				<TextXs
					v-for="notice in notices"
					:key="notice"
					className="editor-chart-note-message__notice"
				>{{ notice }}</TextXs>
			</div>
		</article>
	`,
});
