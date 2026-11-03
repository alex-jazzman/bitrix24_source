import { Dom, Text } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { TextEditor } from 'ui.text-editor';
import { markRaw } from 'ui.vue3';

import './style.css';

// Settings of the AI assistant as the screen hands them over; the editor passes them
// through to ai.copilot, so their shape belongs to that extension and not here.
export type DescriptionCopilotOptions = { [string]: mixed };

type TemplateDescriptionFieldData = {
	editor: TextEditor | null,
	errorId: string,
	errorText: string,
};

const EDITOR_MIN_HEIGHT = 96;
const EDITOR_MAX_HEIGHT = 320;

// DTO-01: plugins and toolbar buttons are listed in full on purpose. The presets of
// ui.text-editor bring images, video, files and mentions along, and none of them is part
// of the contract the server accepts for a template description.
const EDITOR_PLUGINS = [
	'RichText',
	'Paragraph',
	'Clipboard',
	'Bold',
	'Italic',
	'Underline',
	'Strikethrough',
	'List',
	'Link',
	'AutoLink',
	'History',
	'Toolbar',
	'Placeholder',
];

const TOOLBAR_BUTTONS = [
	'bold',
	'italic',
	'underline',
	'strikethrough',
	'|',
	'numbered-list',
	'bulleted-list',
	'|',
	'link',
];

const COPILOT_PLUGIN = 'Copilot';
const COPILOT_BUTTON = 'copilot';

// @vue/component
export const TemplateDescriptionField = {
	name: 'TemplateDescriptionField',
	props: {
		text: {
			type: String,
			default: '',
		},
		copilotOptions: {
			/** @type DescriptionCopilotOptions | null */
			type: Object,
			default: null,
		},
		placeholder: {
			type: String,
			default: '',
		},
	},
	emits: ['update:text'],
	data(): TemplateDescriptionFieldData
	{
		return {
			editor: null,
			errorId: `editor-chart-template-description-error-${Text.getRandom().toLowerCase()}`,
			errorText: '',
		};
	},
	computed: {
		isCopilotEnabled(): boolean
		{
			return this.copilotOptions !== null;
		},
	},
	watch: {
		// A controlled field follows the value it is given. The comparison keeps the editor from
		// re-reading the value it has just emitted itself: setText() re-imports the whole text and
		// drops the caret. lastSyncedText holds the value both sides last agreed on, so it is written
		// on this side too: an editor left empty reports its first setText() as initial and never
		// reaches handleChange(), and a stale value here would swallow the next external one.
		// Comparing with it instead of with getText() costs one export per keystroke instead of two
		// and holds even for the editor updates that are merged into history and never reported.
		text(value: string): void
		{
			if (this.editor !== null && value !== this.lastSyncedText)
			{
				this.lastSyncedText = value;
				this.editor.setText(value);
			}
		},
	},
	created(): void
	{
		// Off data() on purpose: only the watcher and the change handler read it, so reactivity
		// here would only add a dependency nothing renders.
		this.lastSyncedText = null;
	},
	mounted(): void
	{
		// markRaw: the editor keeps private fields and drops its own prototype in destroy(),
		// neither of which survives a reactive proxy
		this.editor = markRaw(new TextEditor({
			content: this.text,
			placeholder: this.placeholder,
			minHeight: EDITOR_MIN_HEIGHT,
			maxHeight: EDITOR_MAX_HEIGHT,
			plugins: this.isCopilotEnabled ? [...EDITOR_PLUGINS, COPILOT_PLUGIN] : EDITOR_PLUGINS,
			toolbar: this.isCopilotEnabled ? [...TOOLBAR_BUTTONS, COPILOT_BUTTON] : TOOLBAR_BUTTONS,
			copilot: this.isCopilotEnabled ? { copilotOptions: this.copilotOptions } : undefined,
			events: {
				onChange: this.handleChange,
			},
		}));

		this.editor.renderTo(this.$refs.container);
		this.applyTextFieldSemantics();
	},
	beforeUnmount(): void
	{
		this.editor?.destroy();
		this.editor = null;
	},
	methods: {
		handleChange(event: BaseEvent): void
		{
			// The editor reports its own rendering of the initial value as a change. Emitting it
			// would push a normalised copy of the prop back into the parent before the user typed.
			if (event.getData()?.isInitialChange === true)
			{
				return;
			}

			const text = this.editor?.getText() ?? '';

			// The setText() of the watcher above is reported as a change as well, and it carries the
			// value both sides already agreed on. That is not an edit: the parent has nothing to
			// learn from it, and the invalid mark stays put - only the user is allowed to drop it by
			// changing the text the server refused.
			if (text === this.lastSyncedText)
			{
				return;
			}

			this.clearError();
			this.lastSyncedText = text;
			this.$emit('update:text', text);
		},
		// ui.text-editor renders the input area as a bare contenteditable div and puts its
		// placeholder in a node of its own, so the area reaches the accessibility tree without
		// the role and without the name a textarea used to give it.
		applyTextFieldSemantics(): void
		{
			Dom.attr(this.getEditableContainer(), {
				role: 'textbox',
				'aria-multiline': 'true',
				'aria-label': this.placeholder === '' ? null : this.placeholder,
			});
		},
		focus(): void
		{
			this.editor?.focus();
		},
		showError(message: string): void
		{
			// Without a text there is nothing to render and nothing to point aria-describedby at:
			// the field would only look broken. The focus still belongs in the field, and the
			// caller brings it back with focus() instead.
			const errorText = message.trim();
			if (errorText === '')
			{
				return;
			}

			this.errorText = errorText;

			// the node the field points at is rendered by the template, so the link can only be
			// made once it exists
			this.$nextTick(() => {
				Dom.attr(this.getEditableContainer(), {
					'aria-invalid': 'true',
					'aria-describedby': this.errorId,
				});

				this.focus();
			});
		},
		clearError(): void
		{
			if (this.errorText === '')
			{
				return;
			}

			this.errorText = '';

			Dom.attr(this.getEditableContainer(), {
				'aria-invalid': null,
				'aria-describedby': null,
			});
		},
		getEditableContainer(): HTMLElement | null
		{
			return this.editor?.getEditableContainer() ?? null;
		},
	},
	template: `
		<div
			class="editor-chart-template-description-field"
			data-testid="bizprocdesigner-template-description-field"
		>
			<!-- ui.text-editor owns the children of this node; anything Vue renders stays its sibling -->
			<div
				class="editor-chart-template-description-field__editor"
				ref="container"
			></div>
			<div
				v-if="errorText !== ''"
				:id="errorId"
				class="editor-chart-template-description-field__error"
				data-testid="bizprocdesigner-template-description-error"
			>
				{{ errorText }}
			</div>
		</div>
	`,
};
