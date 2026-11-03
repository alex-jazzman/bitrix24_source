/**
 * The switch of the note mode in the toolbar of the canvas. While the mode is on, a click on the
 * schema starts a note; the note itself is only created by the form of its first message (AC-007),
 * so this button writes nothing of its own.
 *
 * The state of the mode belongs to the editor - a click on the schema and the tools that switch the
 * mode off live there - so the button is driven by `v-model` and holds nothing but its own listener.
 */

import { Event } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { defineComponent } from 'ui.vue3';
import { hint } from 'ui.vue3.directives.hint';

import { useNotesStore } from '../../../../entities/notes';
import { useLoc } from '../../../../shared/composables';
import { isTemplateId } from '../../../../shared/utils/template-id';

import './notes-mode-button.css';

const BUTTON_TEST_ID = 'bizprocdesigner-notes-mode-button';
const ICON_SIZE = 20;
const HINT_TIMEOUT_MS = 2000;
const ESCAPE_KEY = 'Escape';

type NotesModeButtonHint = {
	text: string,
	timeout: number,
	popupOptions: { closeByEsc: boolean, ariaLabel: string, role: string },
};

export const NotesModeButton = defineComponent({
	name: 'BizprocdesignerNotesModeButton',
	components: { BIcon },
	directives: { hint },
	props: {
		modelValue: {
			type: Boolean,
			default: false,
		},
		// the write lock of the diagram: a template that may not be changed is not discussed either
		readonly: {
			type: Boolean,
			default: false,
		},
		// a template that has not been saved yet has no identifier to pin a note to
		templateId: {
			type: Number,
			default: 0,
		},
	},
	emits: ['update:modelValue'],
	setup(): Object
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			notesStore: useNotesStore(),
			iconName: Outline.MESSAGE,
			iconSize: ICON_SIZE,
		};
	},
	computed: {
		isTemplateSaved(): boolean
		{
			return isTemplateId(this.templateId);
		},
		// The server refuses a note over the limit (ERR-014). The notes already written stay readable
		// and open - only writing a new one is what the limit takes away.
		isLimitReached(): boolean
		{
			return this.notesStore.isNoteLimitReached;
		},
		// ERR-005. The right to the template was taken away from this tab while it stood open, and the
		// refusal of the list of the notes confirmed it. The notes on the screen are left as they are;
		// a new one is not started here any more.
		isAccessLost(): boolean
		{
			return this.notesStore.isAccessLost;
		},
		isDisabled(): boolean
		{
			return this.readonly
				|| this.isAccessLost
				|| !this.isTemplateSaved
				|| this.isLimitReached
			;
		},
		accessibleName(): string
		{
			return this.getMessage(
				this.modelValue
					? 'BIZPROCDESIGNER_EDITOR_NOTES_MODE_EXIT'
					: 'BIZPROCDESIGNER_EDITOR_NOTES_MODE_ADD',
			);
		},
		// Why the mode is out of reach is worth more than the name of the button: an unsaved template
		// and a template full of notes are both fixable, and the text says how; a template whose
		// access is closed is not, and the text says that instead.
		hintText(): string
		{
			if (this.isAccessLost)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NOTES_MODE_HINT_ACCESS_DENIED');
			}

			if (!this.isTemplateSaved)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NOTES_MODE_HINT_UNSAVED');
			}

			if (this.isLimitReached)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NOTES_MODE_HINT_LIMIT', {
					'#LIMIT#': String(this.notesStore.limits.notesPerTemplate),
				});
			}

			return this.accessibleName;
		},
		buttonHint(): NotesModeButtonHint
		{
			return {
				text: this.hintText,
				timeout: HINT_TIMEOUT_MS,
				popupOptions: { closeByEsc: true, ariaLabel: this.hintText, role: 'tooltip' },
			};
		},
		buttonTestId(): string
		{
			return this.$testId(BUTTON_TEST_ID);
		},
	},
	watch: {
		// The template may fill up or lock itself while the mode is on, and a mode that may no longer
		// create anything only collects clicks the server would refuse.
		isDisabled(isDisabled: boolean): void
		{
			if (isDisabled && this.modelValue)
			{
				this.$emit('update:modelValue', false);
			}
		},
	},
	mounted(): void
	{
		Event.bind(document, 'keydown', this.handleDocumentKeydown);
	},
	beforeUnmount(): void
	{
		Event.unbind(document, 'keydown', this.handleDocumentKeydown);
	},
	methods: {
		handleClick(): void
		{
			if (this.isDisabled)
			{
				return;
			}

			this.$emit('update:modelValue', !this.modelValue);
		},
		/**
		 * Escape leaves the mode from anywhere on the schema. The form of a draft stops the key on its
		 * own root, so a draft being written is dropped by Escape and the mode stays on.
		 */
		handleDocumentKeydown(event: KeyboardEvent): void
		{
			if (event.key === ESCAPE_KEY && this.modelValue)
			{
				this.$emit('update:modelValue', false);
			}
		},
	},
	template: `
		<div class="editor-chart-notes-mode-button" v-hint="buttonHint">
			<button
				type="button"
				class="editor-chart-notes-mode-button__control"
				:class="{ '--active': modelValue }"
				:disabled="isDisabled"
				:aria-pressed="modelValue"
				:aria-label="accessibleName"
				:data-testid="buttonTestId"
				@click="handleClick"
			>
				<BIcon :name="iconName" :size="iconSize"/>
			</button>
		</div>
	`,
});
