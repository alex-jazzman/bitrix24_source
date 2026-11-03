/**
 * The completion of a note: the discussion is over, and the note leaves the schema with every
 * message it holds. The action is irreversible, so it is never done by a single click - the dialog of
 * the design system asks first and says what is about to be lost.
 *
 * Who may complete a note is the word of the server alone (`canComplete` of DTO-01): besides its author
 * an administrator of the portal may do it, and the client has no way of knowing who that is. The
 * identifier of the author is never compared with the current user here.
 *
 * The note is dropped from the store before the server answers, so this button leaves the document
 * together with the thread it stands in: a refusal has to outlive it and is told by a toast, not by a
 * row of a thread that is no longer rendered. A repeat of the completion of a note that is already gone
 * is answered by the server with the same success (ALG-04, API-06), so nothing here treats it as a
 * failure (AC-042).
 */

import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { MessageBox } from 'ui.dialogs.messagebox';
import { Outline } from 'ui.icon-set.api.vue';
import { defineComponent } from 'ui.vue3';

import { useNotesStore } from '../../../../entities/notes';
import { useLoc } from '../../../../shared/composables';
import { useToastStore } from '../../../../shared/stores';

const ACTION_TEST_ID = 'bizprocdesigner-note-complete';

const ACTION_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPLETE_ACTION';
const CONFIRM_TITLE_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPLETE_CONFIRM_TITLE';
const CONFIRM_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPLETE_CONFIRM_MESSAGE';
const CONFIRM_OK_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPLETE_CONFIRM_OK';
const CONFIRM_CANCEL_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPLETE_CONFIRM_CANCEL';
const COMMON_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_COMPLETE_ERROR_COMMON';

/** The phrase of every refusal API-06 answers with; anything else is told by the common one. */
const REFUSAL_MESSAGE_IDS: { +[string]: string } = Object.freeze({
	ACCESS_DENIED: 'BIZPROCDESIGNER_EDITOR_NOTE_COMPLETE_ERROR_ACCESS_DENIED',
	FEATURE_DISABLED: 'BIZPROCDESIGNER_EDITOR_NOTE_COMPLETE_ERROR_FEATURE_DISABLED',
});

export const NoteCompleteAction = defineComponent({
	name: 'BizprocdesignerNoteCompleteAction',
	components: { UiButton },
	props: {
		note: {
			/** @type TemplateNote (DTO-01) */
			type: Object,
			required: true,
		},
	},
	emits: ['completed'],
	setup(): Object
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			notesStore: useNotesStore(),
			toastStore: useToastStore(),
			buttonSize: ButtonSize.SMALL,
			buttonStyle: AirButtonStyle.PLAIN_NO_ACCENT,
			buttonIcon: Outline.CHECK_M,
		};
	},
	data(): Object
	{
		return {
			isCompleting: false,
		};
	},
	computed: {
		// The right to complete comes with the note itself and is never worked out from its author.
		isAvailable(): boolean
		{
			return this.note.canComplete === true;
		},
		actionText(): string
		{
			return this.getMessage(ACTION_MESSAGE_ID);
		},
		// The dataset key is lower-case on purpose: `testid` renders as data-testid, the attribute
		// page.getByTestId() looks for, while a camel-cased `testId` would render data-test-id.
		buttonDataset(): { testid: string }
		{
			return { testid: this.$testId(ACTION_TEST_ID, String(this.note.id)) };
		},
	},
	methods: {
		/**
		 * Nothing is completed by this click on its own: the dialog is what does it, and closing it
		 * without an answer leaves the note as it was.
		 */
		handleClick(): void
		{
			if (this.isCompleting)
			{
				return;
			}

			MessageBox.confirm(
				this.getMessage(CONFIRM_MESSAGE_ID),
				this.getMessage(CONFIRM_TITLE_MESSAGE_ID),
				(messageBox) => {
					messageBox.close();
					void this.complete();
				},
				this.getMessage(CONFIRM_OK_MESSAGE_ID),
				(messageBox) => {
					messageBox.close();
				},
				this.getMessage(CONFIRM_CANCEL_MESSAGE_ID),
			);
		},
		async complete(): Promise<void>
		{
			this.isCompleting = true;
			try
			{
				await this.notesStore.completeNote(this.note.id);

				this.$emit('completed');
			}
			catch (error)
			{
				const code: string | null = error?.code ?? null;
				const isNamed = code !== null && Object.hasOwn(REFUSAL_MESSAGE_IDS, code);

				this.toastStore.addWarning(
					this.getMessage(isNamed ? REFUSAL_MESSAGE_IDS[code] : COMMON_MESSAGE_ID),
				);
			}
			finally
			{
				this.isCompleting = false;
			}
		},
	},
	template: `
		<UiButton
			v-if="isAvailable"
			:text="actionText"
			:size="buttonSize"
			:style="buttonStyle"
			:leftIcon="buttonIcon"
			:dataset="buttonDataset"
			:loading="isCompleting"
			@click="handleClick"
		/>
	`,
});
