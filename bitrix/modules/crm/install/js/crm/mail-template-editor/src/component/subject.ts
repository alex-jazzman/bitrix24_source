import { Dom, Loc, Text } from 'main.core';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { TextSm } from 'ui.system.typography.vue';

import { type EditorStore } from '../model/editor-store';
import { PlaceholderSelector, type PlaceholderSelectorInstance } from './placeholder-selector';

type InputComponent = { $el: HTMLElement; focus(): void };

export type EditorSubjectInstance = {
	focus(): void;
	getInput(): HTMLInputElement | null;
	cancelPlaceholder(): void;
};

type SubjectSelection = {
	input: HTMLInputElement;
	value: string;
	start: number;
	end: number;
	onInvalidated(): void;
};

type SubjectControl = {
	selection: SubjectSelection | null;
	disposed: boolean;
};

export const EditorSubject = defineComponent({
	name: 'CrmMailTemplateEditorSubject',
	components: { BInput, TextSm, PlaceholderSelector },
	props: {
		store: {
			type: Object as PropType<EditorStore>,
			required: true,
		},
	},
	emits: ['error'],
	expose: ['focus', 'getInput', 'cancelPlaceholder'],
	setup()
	{
		const control: SubjectControl = { selection: null, disposed: false };

		return {
			Loc,
			InputDesign,
			InputSize,
			fieldId: `crm-mail-template-subject-${Text.getRandom()}`,
			control: markRaw(control),
		};
	},
	computed: {
		isDisabled(): boolean
		{
			return !this.store.state.canEdit || this.store.state.busy;
		},
		error(): string
		{
			return this.store.state.errors
				.filter((error) => error.field === 'subject')
				.map((error) => error.message)
				.join('\n')
			;
		},
	},
	watch: {
		'store.state.subject': {
			flush: 'sync',
			handler(): void
			{
				this.control.selection?.onInvalidated();
			},
		},
		error(): void
		{
			this.updateAccessibility();
		},
	},
	mounted(): void
	{
		this.updateAccessibility();
	},
	beforeUnmount(): void
	{
		this.control.disposed = true;
		this.cancelPlaceholder();
	},
	methods: {
		getInput(): HTMLInputElement | null
		{
			return (this.$refs.input as InputComponent | undefined)?.$el.querySelector('input') ?? null;
		},
		focus(): void
		{
			this.cancelPlaceholder();
			const input = this.getInput();
			input?.scrollIntoView({ block: 'nearest' });
			input?.focus({ preventScroll: true });
		},
		rememberSelection(onInvalidated: () => void): boolean
		{
			const input = this.getInput();
			if (!input || this.control.disposed || this.isDisabled || !this.store.state.ready)
			{
				return false;
			}

			const start = input.selectionStart ?? input.value.length;
			this.control.selection = {
				input,
				value: input.value,
				start,
				end: input.selectionEnd ?? start,
				onInvalidated,
			};

			return true;
		},
		insertPlaceholder(marker: string): boolean
		{
			const selection = this.control.selection;
			this.clearSelection();
			if (
				!selection || this.control.disposed || this.isDisabled || !this.store.state.ready
				|| selection.input !== this.getInput() || !selection.input.isConnected
				|| selection.value !== this.store.state.subject || selection.value !== selection.input.value
			)
			{
				return false;
			}

			const { input, value, start, end } = selection;
			const subject = value.slice(0, start) + marker + value.slice(end);
			const cursor = start + marker.length;
			this.store.setField('subject', subject);
			void this.$nextTick(() => {
				if (
					!this.control.disposed && !this.isDisabled && this.store.state.ready
					&& this.getInput() === input && input.isConnected && this.store.state.subject === subject
				)
				{
					input.focus({ preventScroll: true });
					input.setSelectionRange(cursor, cursor);
				}
			});

			return true;
		},
		clearSelection(): void
		{
			this.control.selection = null;
		},
		cancelPlaceholder(): void
		{
			(this.$refs.placeholder as PlaceholderSelectorInstance | undefined)?.cancel();
			this.clearSelection();
		},
		updateAccessibility(): void
		{
			const input = this.getInput();
			if (input)
			{
				Dom.attr(input, {
					id: this.fieldId,
					'aria-invalid': this.error ? 'true' : null,
					'aria-describedby': this.error ? `${this.fieldId}-error` : null,
				});
			}
		},
		handleInput(value: string): void
		{
			this.store.setField('subject', value);
		},
	},
	template: `
		<div
			class="crm-mail-template-editor__field crm-mail-template-editor__subject"
			data-testid="crm-mail-template-editor-subject"
		>
			<TextSm class="crm-mail-template-editor__field-label" tag="label" :for="fieldId">
				{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SUBJECT') }}
			</TextSm>
			<div class="crm-mail-template-editor__field-content">
				<BInput
					ref="input"
					class="crm-mail-template-editor__input"
					:class="{ '--invalid': error, '--readonly': !store.state.canEdit }"
					:modelValue="store.state.subject"
					:ariaLabel="Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SUBJECT')"
					:design="store.state.busy ? InputDesign.Disabled : InputDesign.Naked"
					:size="InputSize.Md"
					:readonly="isDisabled"
					data-testid="crm-mail-template-subject"
					stretched
					@update:modelValue="handleInput"
				/>
				<PlaceholderSelector
					ref="placeholder"
					:store="store"
					:text="Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_INSERT_SUBJECT_FIELD')"
					testId="crm-mail-template-subject-placeholder"
					:rememberSelection="rememberSelection"
					:insertPlaceholder="insertPlaceholder"
					:clearSelection="clearSelection"
					@error="$emit('error', $event)"
				/>
				<TextSm
					v-if="error"
					:id="fieldId + '-error'"
					class="crm-mail-template-editor__field-error"
					wrap="break-words"
					role="alert"
				>{{ error }}</TextSm>
			</div>
		</div>
	`,
});
