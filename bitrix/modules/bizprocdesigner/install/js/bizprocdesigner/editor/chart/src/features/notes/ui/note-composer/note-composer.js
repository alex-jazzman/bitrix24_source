/**
 * The form of the first message of a note (AC-007). The note is created by sending it and by nothing
 * else: until the message is sent, the draft lives in the form alone and the server hears nothing
 * of it.
 *
 * The field is the same editor with the same hint of mentions as a reply in a note, on the same
 * options (CFG-01): a mention belongs to the first message of a note as much as to an answer in it
 * (SC-002), and the server reads it out of the very call that creates the note. What became of the
 * notifications of that mention is told here too, because the note is written either way and the two
 * outcomes ask different things of the person at the keyboard (ERR-003, ERR-004). Until that is read
 * the form stays on the screen: the editor closes it by the event of a written note, and an
 * explanation nobody has seen would leave with it.
 */

import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Dom, Loc, Text, Type } from 'main.core';
import { TextEditor } from 'ui.text-editor';
import { TextXs } from 'ui.system.typography.vue';
import { defineComponent, nextTick } from 'ui.vue3';

import {
	useNotesStore,
	type NoteAnchor,
	type NotePoint,
	type WrittenMessageOutcome,
} from '../../../../entities/notes';
import { useLoc } from '../../../../shared/composables';
import { createNoteEditorOptions } from '../../lib/editor-options';
import { resolveThreadPlacement, type ThreadPlacement } from '../note-thread/note-thread-popup';

import './note-composer.css';

/** A note as the editor holds it before its first message exists: everything but the message. */
export type NoteDraft = {
	templateId: number,
	anchor: NoteAnchor,
	offset: NotePoint,
	position: NotePoint,
};

const COMPOSER_TEST_ID = 'bizprocdesigner-note-composer';
const INPUT_TEST_ID = 'bizprocdesigner-note-composer-input';
const STATUS_TEST_ID = 'bizprocdesigner-note-composer-status';
const SEND_TEST_ID = 'bizprocdesigner-note-composer-send';
const CANCEL_TEST_ID = 'bizprocdesigner-note-composer-cancel';
const CLOSE_TEST_ID = 'bizprocdesigner-note-composer-close';

const ESCAPE_KEY = 'Escape';

/**
 * The prompt of this field takes three lines at the width of the form, and it is drawn over the field
 * rather than inside it: left at the height of the field of a reply, whose prompt is shorter, it was
 * cut off and gave an empty field a scrollbar. Measured on the built extension at that width.
 */
const EDITOR_MIN_HEIGHT = 84;

const ARIA_LABEL_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPOSER_ARIA_LABEL';
const PLACEHOLDER_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPOSER_PLACEHOLDER';
const TOO_LONG_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPOSER_ERROR_TOO_LONG';
const MENTION_LIMIT_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPOSER_ERROR_MENTION_LIMIT';
const EMPTY_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPOSER_ERROR_EMPTY';
const FEATURE_DISABLED_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPOSER_ERROR_FEATURE_DISABLED';
const COMMON_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPOSER_ERROR_COMMON';
const UNAVAILABLE_MENTIONS_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPOSER_NOTICE_MENTIONS';
const NOTIFY_FAILED_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPOSER_NOTICE_NOTIFY_FAILED';

/**
 * The refusals of a creation whose whole explanation is one phrase. The two that name a number of
 * their own - the length of a message and the count of its mentions - are built apart, because a
 * limit that has not arrived from the server cannot be named.
 *
 * The quota of the messages of a note and the revision of a message answer a reply and an edit; a
 * creation has neither a note to fill nor a message to overwrite, and neither code reaches here.
 */
const REFUSAL_MESSAGE_IDS: { +[string]: string } = Object.freeze({
	NOTE_LIMIT_REACHED: 'BIZPROCDESIGNER_EDITOR_NOTE_COMPOSER_ERROR_NOTE_LIMIT',
	EMPTY_MESSAGE: EMPTY_MESSAGE_ID,
	ACCESS_DENIED: 'BIZPROCDESIGNER_EDITOR_NOTE_COMPOSER_ERROR_ACCESS_DENIED',
	FEATURE_DISABLED: FEATURE_DISABLED_MESSAGE_ID,
});

export const NoteComposer = defineComponent({
	name: 'BizprocdesignerNoteComposer',
	components: { TextXs, UiButton },
	props: {
		draft: {
			/** @type NoteDraft */
			type: Object,
			required: true,
		},
		// the point of the screen the draft stands at, as the marker of a saved note gets it
		x: {
			type: Number,
			required: true,
		},
		y: {
			type: Number,
			required: true,
		},
		// the drawn area of the canvas: the window of the form has to stay whole inside it
		viewportWidth: {
			type: Number,
			default: 0,
		},
		viewportHeight: {
			type: Number,
			default: 0,
		},
	},
	emits: ['created', 'cancel'],
	setup(): Object
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			notesStore: useNotesStore(),
			buttonSize: ButtonSize.SMALL,
			sendButtonStyle: AirButtonStyle.FILLED,
			cancelButtonStyle: AirButtonStyle.PLAIN_NO_ACCENT,
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
			// the answer about the note that was written, and the sign that it was: WrittenMessageOutcome
			writtenOutcome: null,
			statusId: `editor-chart-note-composer-status-${Text.getRandom().toLowerCase()}`,
			width: 0,
			height: 0,
			// The side is chosen by the size of the window, and the size is only known once it is in
			// the document. It is therefore drawn once without being shown, and never in the wrong place.
			isMeasured: false,
		};
	},
	computed: {
		// The note exists: what is left of the form is what the server said about it.
		isWritten(): boolean
		{
			return this.writtenOutcome !== null;
		},
		// The length is measured the way the server measures it: on the value as it is sent, trimmed.
		length(): number
		{
			return this.text.trim().length;
		},
		// The length is the one the server tells; a limit that has not arrived holds nothing back.
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
		// An empty message creates nothing, so there is nothing to send until something is written.
		canSend(): boolean
		{
			return !this.isSending && !this.isWritten && this.length > 0 && !this.isTooLong;
		},
		errorText(): string
		{
			if (this.isTooLong)
			{
				return this.tooLongText();
			}

			return this.refusal;
		},
		ariaLabel(): string
		{
			return this.getMessage(ARIA_LABEL_MESSAGE_ID);
		},
		/**
		 * The window of the form opens beside its pin and stands whole inside the drawn area, the way
		 * the popup of a thread does (AC-014): the arithmetic of the side is that very one, and the
		 * form only measures itself for it.
		 */
		placement(): ThreadPlacement
		{
			return resolveThreadPlacement(
				{ x: this.x, y: this.y },
				{ width: this.width, height: this.height },
				{ width: this.viewportWidth, height: this.viewportHeight },
			);
		},
		// A translation rather than left/top, as the markers of the layer above the same canvas.
		pinStyle(): { transform: string }
		{
			return { transform: `translate(${this.x}px, ${this.y}px)` };
		},
		formStyle(): { transform: string, visibility?: string }
		{
			const style = { transform: `translate(${this.placement.x}px, ${this.placement.y}px)` };

			return this.isMeasured ? style : { ...style, visibility: 'hidden' };
		},
		composerTestId(): string
		{
			return this.$testId(COMPOSER_TEST_ID);
		},
		inputTestId(): string
		{
			return this.$testId(INPUT_TEST_ID);
		},
		statusTestId(): string
		{
			return this.$testId(STATUS_TEST_ID);
		},
		// The dataset key is lower-case on purpose: `testid` renders as data-testid, the attribute
		// page.getByTestId() looks for, while a camel-cased `testId` would render data-test-id.
		sendButtonDataset(): { testid: string }
		{
			return { testid: this.$testId(SEND_TEST_ID) };
		},
		cancelButtonDataset(): { testid: string }
		{
			return { testid: this.$testId(CANCEL_TEST_ID) };
		},
		closeButtonDataset(): { testid: string }
		{
			return { testid: this.$testId(CLOSE_TEST_ID) };
		},
	},
	created(): void
	{
		// Off data() on purpose: the editor keeps private fields and drops its own prototype in
		// destroy(), neither of which survives a reactive proxy, and nothing renders it. The observer
		// is not rendered either.
		this.editor = null;
		this.sizeObserver = null;
	},
	mounted(): void
	{
		this.editor = new TextEditor({
			...createNoteEditorOptions({
				templateId: this.draft.templateId,
				placeholder: this.getMessage(PLACEHOLDER_MESSAGE_ID),
				minHeight: EDITOR_MIN_HEIGHT,
			}),
			events: {
				onChange: this.handleChange,
				onMetaEnter: this.handleSend,
			},
		});

		this.editor.renderTo(this.$refs.container);
		this.applyTextFieldSemantics();
		this.measure();
		this.observeSize();
		void this.focusEditor();
	},
	beforeUnmount(): void
	{
		this.sizeObserver?.disconnect();
		this.sizeObserver = null;
		this.editor?.destroy();
		this.editor = null;
	},
	methods: {
		/**
		 * The form is opened by a click on the schema and exists to be written in, so the caret stands
		 * in it from the start: the keyboard reaches the note without hunting for the field first.
		 *
		 * The side of the window is only known once it has been measured, so until then it stands
		 * hidden - and a hidden field takes no caret. The wait is for that hiding to be lifted.
		 */
		async focusEditor(): Promise<void>
		{
			await nextTick();

			this.editor?.focus();
		},
		/**
		 * The size the window takes with what is written in it. It changes with the form itself - a
		 * refusal appears, a written note leaves the field out of the way - and every change may turn
		 * the window to the other side of its pin.
		 */
		measure(): void
		{
			const form = this.$refs.form ?? null;

			if (form === null)
			{
				return;
			}

			const box = form.getBoundingClientRect();

			if (box.width !== this.width || box.height !== this.height)
			{
				this.width = box.width;
				this.height = box.height;
			}

			this.isMeasured = true;
		},
		observeSize(): void
		{
			if (!Type.isFunction(ResizeObserver) || !Type.isDomNode(this.$refs.form))
			{
				return;
			}

			this.sizeObserver = new ResizeObserver(() => this.measure());
			this.sizeObserver.observe(this.$refs.form);
		},
		/**
		 * The editor reports its own rendering as a change too - of the empty initial state - and that
		 * is not an edit of anything.
		 */
		handleChange(): void
		{
			const text = this.editor?.getText() ?? '';
			if (text === this.text)
			{
				return;
			}

			// What the server said about the previous attempt no longer describes what is being written.
			this.text = text;
			this.refusal = '';
		},
		tooLongText(): string
		{
			return this.getMessage(TOO_LONG_MESSAGE_ID, { '#LIMIT#': String(this.messageLimit) });
		},
		/**
		 * The code of the refusal is the whole contract of the server, so the text of every one of
		 * them is named here. The two limits are told with their number only when the number is known;
		 * without it the plain refusal is left.
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
		 * The note is created either way, so what became of the notifications of its mentions is told
		 * beside it and not as a failure of the creation (ERR-003, ERR-004).
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
			// Ctrl+Enter reaches this the same way the button does, so it is stopped here as well.
			if (this.isSending || this.isWritten || this.isTooLong)
			{
				return;
			}

			// An empty message is refused where it was written: the form stays open and says what it
			// is waiting for (ERR-001).
			if (this.length === 0)
			{
				this.refusal = this.getMessage(EMPTY_MESSAGE_ID);

				return;
			}

			this.isSending = true;
			this.refusal = '';
			try
			{
				const outcome: WrittenMessageOutcome = await this.notesStore.createNote({
					...this.draft,
					message: this.text.trim(),
				});

				this.notices = this.noticesOf(outcome);
				this.writtenOutcome = outcome;

				// The mode stays on after a note is written, so the editor is the one who decides what
				// becomes of the form; it only learns here that the note exists. A notification that
				// went wrong holds the form open until it is read - and holds this event with it.
				if (this.notices.length === 0)
				{
					this.$emit('created', outcome);
				}
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
		/** The note is written and its answer is read: the form has nothing left to do. */
		handleClose(): void
		{
			this.$emit('created', this.writtenOutcome);
		},
		handleCancel(): void
		{
			this.$emit('cancel');
		},
		/**
		 * The keys of the form stop at the form: Escape drops the draft instead of leaving the mode,
		 * and the shortcuts of the canvas do not fire over a message being written. A note that is
		 * already written is not dropped by it - there is nothing left to give up.
		 */
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key !== ESCAPE_KEY)
			{
				return;
			}

			if (this.isWritten)
			{
				this.handleClose();

				return;
			}

			this.handleCancel();
		},
		/**
		 * ui.text-editor renders the input area as a bare contenteditable div and puts its placeholder
		 * in a node of its own, so the area reaches the accessibility tree without the role and without
		 * the name a textarea used to give it. The status line is pointed at once and for good: it is a
		 * live region, and an announcement of it is a change of its text rather than of the link.
		 */
		applyTextFieldSemantics(): void
		{
			Dom.attr(this.editor?.getEditableContainer() ?? null, {
				role: 'textbox',
				'aria-multiline': 'true',
				'aria-label': this.ariaLabel,
				'aria-describedby': this.statusId,
			});
		},
	},
	template: `
		<div class="editor-chart-note-composer">
			<span class="editor-chart-note-composer__pin" :style="pinStyle" aria-hidden="true"></span>
			<!-- The pin marks the place of the note and the window stands beside it: the two are
			     placed apart, because a window pulled inside the drawn area no longer touches its pin. -->
			<div
				class="editor-chart-note-composer__form"
				:style="formStyle"
				ref="form"
				role="group"
				:aria-label="ariaLabel"
				:data-testid="composerTestId"
				@keydown.stop="handleKeydown"
			>
				<!-- ui.text-editor owns the children of this node; anything Vue renders stays its
				     sibling. A written note leaves the field out of the way instead of out of the
				     document: the editor is destroyed by the form alone. -->
				<div
					class="editor-chart-note-composer__editor"
					:class="{ '--hidden': isWritten }"
					:data-testid="inputTestId"
					ref="container"
				></div>
				<div class="editor-chart-note-composer__actions">
					<UiButton
						v-if="isWritten"
						:text="getMessage('BIZPROCDESIGNER_EDITOR_NOTE_COMPOSER_CLOSE')"
						:size="buttonSize"
						:style="sendButtonStyle"
						:dataset="closeButtonDataset"
						@click="handleClose"
					/>
					<template v-else>
						<UiButton
							:text="getMessage('BIZPROCDESIGNER_EDITOR_NOTE_COMPOSER_CANCEL')"
							:size="buttonSize"
							:style="cancelButtonStyle"
							:dataset="cancelButtonDataset"
							:disabled="isSending"
							@click="handleCancel"
						/>
						<UiButton
							:text="getMessage('BIZPROCDESIGNER_EDITOR_NOTE_COMPOSER_SEND')"
							:size="buttonSize"
							:style="sendButtonStyle"
							:dataset="sendButtonDataset"
							:disabled="!canSend"
							:loading="isSending"
							@click="handleSend"
						/>
					</template>
				</div>
				<!-- A refusal and a notice are drawn beside the field, so they are read out where they
				     appear as well. -->
				<div
					:id="statusId"
					class="editor-chart-note-composer__status"
					:data-testid="statusTestId"
					aria-live="polite"
				>
					<TextXs
						v-if="errorText !== ''"
						className="editor-chart-note-composer__error"
					>{{ errorText }}</TextXs>
					<TextXs
						v-for="notice in notices"
						:key="notice"
						className="editor-chart-note-composer__notice"
					>{{ notice }}</TextXs>
				</div>
			</div>
		</div>
	`,
});
