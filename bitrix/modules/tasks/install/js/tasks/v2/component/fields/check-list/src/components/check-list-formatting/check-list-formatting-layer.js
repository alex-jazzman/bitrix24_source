import { GrowingTextArea } from 'tasks.v2.component.elements.growing-text-area';

import {
	ChecklistFormattingAction,
} from '../../lib/bb-code/const';
import { CheckListBbCode } from '../../lib/bb-code/check-list-bb-code';

import './check-list-formatting-layer.css';

const FORMATTING_SHORTCUT_ACTION_BY_CODE = Object.freeze({
	KeyB: ChecklistFormattingAction.Bold,
	KeyI: ChecklistFormattingAction.Italic,
	KeyU: ChecklistFormattingAction.Underline,
	KeyS: ChecklistFormattingAction.Strikethrough,
});

function getTextarea(growingTextArea: ?Object): ?HTMLTextAreaElement
{
	return growingTextArea?.$el?.querySelector('textarea') ?? null;
}

// @vue/component
export const CheckListFormattingLayer = {
	name: 'CheckListFormattingLayer',
	components: {
		GrowingTextArea,
	},
	props: {
		modelValue: {
			type: String,
			default: '',
		},
		placeholder: {
			type: String,
			default: '',
		},
		fontColor: {
			type: String,
			default: 'var(--ui-color-base-0)',
		},
		linkColor: {
			type: String,
			default: 'var(--ui-color-accent-main-link)',
		},
		fontSize: {
			type: Number,
			default: 21,
		},
		fontWeight: {
			type: [Number, String],
			default: 'inherit',
		},
		lineHeight: {
			type: Number,
			default: 29,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'update:modelValue',
		'input',
		'focus',
		'blur',
		'emptyFocus',
		'emptyBlur',
		'enterBlur',
		'linkClick',
		'click',
		'selectionChange',
	],
	computed: {
		hasTitle(): boolean
		{
			return this.modelValue.trim() !== '';
		},
		isReadonlyRender(): boolean
		{
			return this.readonly && this.hasTitle;
		},
		safeDisplayHtml(): string
		{
			return CheckListBbCode.formatHtml(this.modelValue, this.linkColor);
		},
		displayStyle(): Object
		{
			return {
				maxHeight: `${this.lineHeight * 3}px`,
				lineHeight: `${this.lineHeight}px`,
				color: this.fontColor,
				fontSize: `${this.fontSize}px`,
				fontWeight: this.fontWeight,
			};
		},
	},
	methods: {
		focusTextarea(): void
		{
			this.$refs.growingTextArea?.focusTextarea();
		},
		getActiveFormattingActions(): string[]
		{
			const textarea = getTextarea(this.$refs.growingTextArea);
			if (!textarea)
			{
				return [];
			}

			return CheckListBbCode.getActiveFormattingActions(
				this.modelValue,
				{
					start: textarea.selectionStart,
					end: textarea.selectionEnd,
				},
			);
		},
		getSelectedFormattingActions(): string[]
		{
			return this.getActiveFormattingActions();
		},
		applyFormatting(action: string, url: string = ''): void
		{
			const textarea = getTextarea(this.$refs.growingTextArea);
			if (!textarea)
			{
				return;
			}

			const result = (
				action === ChecklistFormattingAction.Link
					? CheckListBbCode.addUrlTag(this.modelValue, textarea, url)
					: CheckListBbCode.handleDecorationTag(this.modelValue, textarea, action)
			);

			this.$emit('update:modelValue', result.source);

			void this.$nextTick(() => {
				this.restoreTextareaSelection(result.selectionStart, result.selectionEnd);
			});
		},
		restoreTextareaSelection(selectionStart: number, selectionEnd: number): void
		{
			const textarea = getTextarea(this.$refs.growingTextArea);
			if (!textarea)
			{
				return;
			}

			const restoreSelection = () => {
				getTextarea(this.$refs.growingTextArea)?.setSelectionRange(selectionStart, selectionEnd);
				this.emitSelectionChange();
			};

			if (document.activeElement === textarea)
			{
				restoreSelection();

				return;
			}

			this.focusTextarea();
			void this.$nextTick(() => {
				requestAnimationFrame(restoreSelection);
			});
		},
		handleLayerClick(event: PointerEvent): void
		{
			if (
				event.target
				&& event.target.closest
				&& event.target.closest('.tasks-check-list-formatting-layer-link')
			)
			{
				this.$emit('linkClick', event);

				return;
			}

			this.$emit('click', event);
			this.emitSelectionChange();
		},
		handleFocus(event: FocusEvent): void
		{
			this.$emit('focus', event);
			this.emitSelectionChange();
		},
		handleInput(value: string): void
		{
			this.$emit('input', value);
			this.emitSelectionChange();
		},
		handleUpdateModelValue(value: string): void
		{
			this.$emit('update:modelValue', value);
			this.emitSelectionChange();
		},
		handleKeyDown(event: KeyboardEvent): void
		{
			const action = this.getFormattingShortcutAction(event);
			if (!action)
			{
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			this.applyFormatting(action);
		},
		getFormattingShortcutAction(event: KeyboardEvent): ?string
		{
			if (event.target !== getTextarea(this.$refs.growingTextArea))
			{
				return null;
			}

			const isModifierPressed = event.ctrlKey || event.metaKey;
			if (!isModifierPressed || event.altKey || event.shiftKey)
			{
				return null;
			}

			return FORMATTING_SHORTCUT_ACTION_BY_CODE[event.code] ?? null;
		},
		emitSelectionChange(): void
		{
			void this.$nextTick(() => {
				this.$emit('selectionChange', this.getActiveFormattingActions());
			});
		},
	},
	template: `
		<div
			class="tasks-check-list-formatting-layer"
			:class="{ '--readonly': isReadonlyRender }"
			data-testid="tasks-check-list-formatting-layer"
			@click="handleLayerClick"
			@keydown="handleKeyDown"
			@keyup="emitSelectionChange"
			@mouseup="emitSelectionChange"
		>
			<div
				v-if="isReadonlyRender"
				class="tasks-check-list-formatting-layer-display print-display-block"
				:style="displayStyle"
				v-html="safeDisplayHtml"
			></div>
			<GrowingTextArea
				v-else
				ref="growingTextArea"
				:modelValue="modelValue"
				:placeholder
				:readonly
				:fontColor
				:linkColor
				:fontSize
				:fontWeight
				:lineHeight
				@update:modelValue="handleUpdateModelValue"
				@input="handleInput"
				@focus="handleFocus"
				@blur="$emit('blur', $event)"
				@emptyBlur="$emit('emptyBlur')"
				@emptyFocus="$emit('emptyFocus')"
				@enterBlur="$emit('enterBlur', $event)"
				@linkClick="$emit('linkClick', $event)"
			/>
		</div>
	`,
};
