/**
 * The field a reply in a note is written in. The mentions of it are answered by the provider of
 * the template editors (TPL-01), and the value is sent exactly as the editor serialises it: the markup
 * a message may keep is decided by the server (DTO-03), and a second opinion on the client would only
 * disagree with it.
 *
 * The text written here survives every refusal - of the server, of the connection and of the limits
 * (ERR-002, ERR-011): the field is cleared by a saved message alone. A message that was saved while its
 * notifications were not is told apart from a refusal, because the two ask for different things from
 * the person at the keyboard (ERR-003, ERR-004).
 */

import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Dom, Loc, Text } from 'main.core';
import { TextEditor } from 'ui.text-editor';
import { TextXs } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import { useNotesStore, type WrittenMessageOutcome } from '../../../../entities/notes';
import { useLoc } from '../../../../shared/composables';
import { createNoteEditorOptions } from '../../lib/editor-options';

import './note-message-input.css';

const INPUT_TEST_ID = 'bizprocdesigner-note-message-input';
const EDITOR_TEST_ID = 'bizprocdesigner-note-message-input-editor';
const SEND_TEST_ID = 'bizprocdesigner-note-message-input-send';
const STATUS_TEST_ID = 'bizprocdesigner-note-message-input-status';
const COUNTER_TEST_ID = 'bizprocdesigner-note-message-input-counter';

const PLACEHOLDER_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_INPUT_PLACEHOLDER';
const ARIA_LABEL_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_INPUT_ARIA_LABEL';
const SEND_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_INPUT_SEND';
const COUNTER_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_INPUT_COUNTER';
const EMPTY_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_INPUT_ERROR_EMPTY';
const TOO_LONG_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_INPUT_ERROR_TOO_LONG';
const MENTION_LIMIT_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_INPUT_ERROR_MENTION_LIMIT';
const MESSAGE_LIMIT_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_INPUT_ERROR_MESSAGE_LIMIT';
const ACCESS_DENIED_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_INPUT_ERROR_ACCESS_DENIED';
const FEATURE_DISABLED_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_INPUT_ERROR_FEATURE_DISABLED';
const COMMON_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_INPUT_ERROR_COMMON';
const UNAVAILABLE_MENTIONS_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_INPUT_NOTICE_MENTIONS';
const NOTIFY_FAILED_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_MESSAGE_INPUT_NOTICE_NOTIFY_FAILED';

/**
 * The refusals whose whole explanation is one phrase. The two that name a number of their own - the
 * length of a message and the count of its mentions - are built apart, because a limit that has not
 * arrived from the server cannot be named.
 *
 * The quota of the notes of a template and the revision of a message answer a creation and an edit;
 * a reply creates no note and overwrites no message, and neither code reaches here.
 */
const REFUSAL_MESSAGE_IDS: { +[string]: string } = Object.freeze({
	EMPTY_MESSAGE: EMPTY_MESSAGE_ID,
	MESSAGE_LIMIT_REACHED: MESSAGE_LIMIT_MESSAGE_ID,
	ACCESS_DENIED: ACCESS_DENIED_MESSAGE_ID,
	FEATURE_DISABLED: FEATURE_DISABLED_MESSAGE_ID,
});

export const NoteMessageInput = defineComponent({
	name: 'BizprocdesignerNoteMessageInput',
	components: { TextXs, UiButton },
	props: {
		noteId: {
			type: Number,
			required: true,
		},
		// the hint of the mentions answers with the editors of this template and with nobody else
		templateId: {
			type: Number,
			required: true,
		},
		// The notes are read-only: the field stays where it is, holding whatever was typed into it,
		// and nothing is written or sent from it. It is not taken off the screen, because a field that
		// comes and goes takes the reply typed into it along (AC-037d).
		readonly: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['sent'],
	setup(): Object
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			notesStore: useNotesStore(),
			buttonSize: ButtonSize.SMALL,
			sendButtonStyle: AirButtonStyle.FILLED,
		};
	},
	data(): Object
	{
		return {
			// the value as the editor serialises it, kept here so the length and the button follow it
			text: '',
			refusal: '',
			notices: [],
			isSending: false,
			statusId: `editor-chart-note-message-input-status-${Text.getRandom().toLowerCase()}`,
		};
	},
	computed: {
		// The length is measured the way the server measures it: on the value as it is sent, trimmed.
		length(): number
		{
			return this.text.trim().length;
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
		isTooLong(): boolean
		{
			return this.messageLimit > 0 && this.length > this.messageLimit;
		},
		isEmpty(): boolean
		{
			return this.length === 0;
		},
		canSend(): boolean
		{
			return !this.readonly && !this.isSending && !this.isEmpty && !this.isTooLong;
		},
		// The limit is told before the server is called; its refusal by the same reason is a backstop.
		errorText(): string
		{
			return this.isTooLong ? this.tooLongText() : this.refusal;
		},
		counterText(): string
		{
			return this.getMessage(COUNTER_MESSAGE_ID, {
				'#LENGTH#': String(this.length),
				'#LIMIT#': String(this.messageLimit),
			});
		},
		counterClasses(): string[]
		{
			const classes = ['editor-chart-note-message-input__counter'];

			return this.isTooLong ? [...classes, '--over'] : classes;
		},
		sendText(): string
		{
			return this.getMessage(SEND_MESSAGE_ID);
		},
		inputTestId(): string
		{
			return this.$testId(INPUT_TEST_ID);
		},
		// ui.text-editor renders the area a reply is typed into as a child of this node, so the label
		// of the area is the one of its host: the editor owns everything below it.
		editorTestId(): string
		{
			return this.$testId(EDITOR_TEST_ID);
		},
		statusTestId(): string
		{
			return this.$testId(STATUS_TEST_ID);
		},
		counterTestId(): string
		{
			return this.$testId(COUNTER_TEST_ID);
		},
		// The dataset key is lower-case on purpose: `testid` renders as data-testid, the attribute
		// page.getByTestId() looks for, while a camel-cased `testId` would render data-test-id.
		sendButtonDataset(): { testid: string }
		{
			return { testid: this.$testId(SEND_TEST_ID) };
		},
	},
	watch: {
		// The right may be taken away while the field stands open, and given back with a restore of
		// the template: what was typed stays either way, and only the typing itself is turned off.
		readonly(isReadonly: boolean): void
		{
			this.editor?.setEditable(!isReadonly);
			this.applyReadonlyState(isReadonly);
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
				placeholder: this.getMessage(PLACEHOLDER_MESSAGE_ID),
			}),
			editable: !this.readonly,
			events: {
				onChange: this.handleChange,
				onMetaEnter: this.handleSend,
			},
		});

		this.editor.renderTo(this.$refs.container);
		this.applyTextFieldSemantics();
	},
	beforeUnmount(): void
	{
		this.editor?.destroy();
		this.editor = null;
	},
	methods: {
		/**
		 * The editor reports its own rendering as a change too - of the empty initial state, and of the
		 * emptying that follows a sent message. Neither is an edit, and the answer of the server about
		 * the message just sent has to outlive the second one.
		 */
		handleChange(): void
		{
			const text = this.editor?.getText() ?? '';
			if (text === this.text)
			{
				return;
			}

			// What the server said about the previous message no longer describes the one being written.
			this.text = text;
			this.refusal = '';
			this.notices = [];
		},
		tooLongText(): string
		{
			return this.getMessage(TOO_LONG_MESSAGE_ID, { '#LIMIT#': String(this.messageLimit) });
		},
		/**
		 * The code of the refusal is the whole contract of the server, so every one of them is named
		 * here. The two limits are told with their number only when the number is known; without it the
		 * plain refusal is left.
		 */
		refusalText(error: mixed): string
		{
			const code: string | null = error?.code ?? null;

			if (code === 'MESSAGE_TOO_LONG')
			{
				return this.messageLimit > 0 ? this.tooLongText() : this.getMessage(COMMON_MESSAGE_ID);
			}

			if (code === 'MENTION_LIMIT_REACHED')
			{
				return this.mentionLimit > 0
					? this.getMessage(MENTION_LIMIT_MESSAGE_ID, { '#LIMIT#': String(this.mentionLimit) })
					: this.getMessage(COMMON_MESSAGE_ID)
				;
			}

			const isNamed = code !== null && Object.hasOwn(REFUSAL_MESSAGE_IDS, code);

			return this.getMessage(isNamed ? REFUSAL_MESSAGE_IDS[code] : COMMON_MESSAGE_ID);
		},
		/**
		 * The message is saved either way, so what became of its notifications is told beside it and not
		 * as a failure of the sending (ERR-003, ERR-004).
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
		async handleSend(): Promise<void>
		{
			// Ctrl+Enter reaches this the same way the button does, so the write lock stops it here too.
			if (this.readonly || this.isSending || this.isTooLong)
			{
				return;
			}

			// An empty message is refused where it was written: the field stays as it is and says what
			// it is waiting for (ERR-001).
			if (this.isEmpty)
			{
				this.refusal = this.getMessage(EMPTY_MESSAGE_ID);

				return;
			}

			this.isSending = true;
			this.refusal = '';
			this.notices = [];
			try
			{
				const outcome: WrittenMessageOutcome = await this.notesStore.replyToNote(
					this.noteId,
					this.text,
				);

				// Only a saved message empties the field; everything else leaves what was written in it.
				// The text is dropped here as well so the change the emptying reports is not read as one.
				this.editor?.clear(false);
				this.text = '';
				this.notices = this.noticesOf(outcome);
				this.$emit('sent', outcome);
			}
			catch (error)
			{
				this.refusal = this.refusalText(error);
			}
			finally
			{
				this.isSending = false;
			}
		},
		/**
		 * ui.text-editor renders the input area as a bare contenteditable div and puts its placeholder in
		 * a node of its own, so the area reaches the accessibility tree without the role and without the
		 * name a textarea used to give it. The status line is pointed at once and for good: it is a live
		 * region, and an announcement of it is a change of its text rather than a change of the link.
		 */
		applyTextFieldSemantics(): void
		{
			Dom.attr(this.editor?.getEditableContainer() ?? null, {
				role: 'textbox',
				'aria-multiline': 'true',
				'aria-label': this.getMessage(ARIA_LABEL_MESSAGE_ID),
				'aria-describedby': this.statusId,
			});
			this.applyReadonlyState(this.readonly);
		},
		/**
		 * The field stays on the screen under the write lock and holds whatever was typed into it
		 * (AC-037d), so it has to say for itself that nothing more is written here: a field announced
		 * as one that takes text while it takes none says the opposite of what is true.
		 */
		applyReadonlyState(isReadonly: boolean): void
		{
			Dom.attr(
				this.editor?.getEditableContainer() ?? null,
				'aria-readonly',
				isReadonly ? 'true' : null,
			);
		},
	},
	template: `
		<div class="editor-chart-note-message-input" :data-testid="inputTestId">
			<!-- ui.text-editor owns the children of this node; anything Vue renders stays its sibling -->
			<div
				class="editor-chart-note-message-input__editor"
				:data-testid="editorTestId"
				ref="container"
			></div>
			<div class="editor-chart-note-message-input__footer">
				<TextXs
					v-if="messageLimit > 0"
					:className="counterClasses"
					:data-testid="counterTestId"
				>{{ counterText }}</TextXs>
				<UiButton
					:text="sendText"
					:size="buttonSize"
					:style="sendButtonStyle"
					:dataset="sendButtonDataset"
					:disabled="!canSend"
					:loading="isSending"
					@click="handleSend"
				/>
			</div>
			<div
				:id="statusId"
				class="editor-chart-note-message-input__status"
				:data-testid="statusTestId"
				aria-live="polite"
			>
				<TextXs
					v-if="errorText !== ''"
					className="editor-chart-note-message-input__error"
				>{{ errorText }}</TextXs>
				<TextXs
					v-for="notice in notices"
					:key="notice"
					className="editor-chart-note-message-input__notice"
				>{{ notice }}</TextXs>
			</div>
		</div>
	`,
});
