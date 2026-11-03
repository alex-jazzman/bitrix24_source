import { Text, Type } from 'main.core';
import { hint, type HintParams } from 'ui.vue3.directives.hint';

import { GrowingTextArea } from 'tasks.v2.component.elements.growing-text-area';
import {
	CheckListBbCode,
	ChecklistFormattingAction,
} from 'tasks.v2.lib.check-list-bb-code';

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
	directives: { hint },
	components: {
		GrowingTextArea,
	},
	inject: {
		checkListEditor: { default: null },
		checkListEditorItem: { default: null },
		checkListKeyboardRouter: { default: null },
	},
	props: {
		preserveShiftTab: {
			type: Boolean,
			default: false,
		},
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
		maxLines: {
			type: Number,
			default: 3,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		keyboardInstructions: {
			type: String,
			default: '',
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
		'escapeBlur',
		'linkClick',
		'click',
		'selectionChange',
		'indent',
		'outdent',
		'panelTab',
	],
	data(): Object
	{
		return {
			isEditorActive: false,
			readonlyOverflowing: false,
			readonlyResizeObserver: null,
			keyboardInstructionsId: `tasks-check-list-item-keyboard-instructions-${Text.getRandom()}`,
		};
	},
	computed: {
		editorDescribedby(): ?string
		{
			if (this.readonly || !Type.isStringFilled(this.keyboardInstructions))
			{
				return null;
			}

			return this.keyboardInstructionsId;
		},
		editorAria(): Object
		{
			return {
				label: this.placeholder,
				describedby: this.editorDescribedby,
			};
		},
		hasTitle(): boolean
		{
			return this.modelValue.trim() !== '';
		},
		isReadonlyRender(): boolean
		{
			return this.readonly && this.hasTitle;
		},
		isEditableDisplay(): boolean
		{
			return !this.readonly && !this.isEditorActive;
		},
		safeDisplayHtml(): string
		{
			return CheckListBbCode.formatHtml(this.modelValue, this.linkColor);
		},
		displayStyle(): Object
		{
			return {
				maxHeight: `${this.lineHeight * this.maxLines}px`,
				'--check-list-editor-max-height': `${this.lineHeight * this.maxLines}px`,
				lineHeight: `${this.lineHeight}px`,
				color: this.fontColor,
				fontSize: `${this.fontSize}px`,
				fontWeight: this.fontWeight,
				'-webkit-line-clamp': this.maxLines,
			};
		},
		readonlyTooltip(): ?Function
		{
			if (!this.readonlyOverflowing)
			{
				return null;
			}

			return (): HintParams => ({
				html: this.safeDisplayHtml,
				interactivity: true,
				popupOptions: {
					className: 'b24-growing-text-area-popup',
					bindElement: this.$refs.readonlyDisplay,
					offsetLeft: 40,
					maxWidth: 440,
					maxHeight: 360,
					angle: {
						offset: 40,
					},
					darkMode: false,
					targetContainer: this.$refs.readonlyDisplay.closest('.tasks-full-card-content') ?? document.body,
				},
			});
		},
	},
	created(): void
	{
		this.activationPoint = null;
	},
	mounted(): void
	{
		requestAnimationFrame(() => {
			this.updateReadonlyOverflowing();
		});

		this.observeReadonlyOverflow();
	},
	unmounted(): void
	{
		if (this.checkListEditor?.isActive(this.checkListEditorItem?.getId()))
		{
			const session = this.checkListEditor.deactivate?.('layer-unmount');
			this.commitEditorSession(session);
		}
		this.unobserveReadonlyOverflow();
	},
	watch: {
		readonly(value: boolean): void
		{
			if (!value || !this.isEditorActive)
			{
				return;
			}

			const session = this.checkListEditor?.deactivate?.('readonly');
			this.isEditorActive = false;
			this.commitEditorSession(session);
		},
		isReadonlyRender(): void
		{
			this.scheduleReadonlyOverflowCheck();

			void this.$nextTick(() => {
				this.observeReadonlyOverflow();
			});
		},
		modelValue(): void
		{
			if (this.isReadonlyRender)
			{
				this.scheduleReadonlyOverflowCheck();
			}
		},
		maxLines(): void
		{
			if (this.isReadonlyRender)
			{
				this.scheduleReadonlyOverflowCheck();
			}
		},
	},
	methods: {
		updateReadonlyOverflowing(): void
		{
			if (!this.isReadonlyRender)
			{
				this.readonlyOverflowing = false;

				return;
			}

			const display = this.$refs.readonlyDisplay;
			if (!display)
			{
				this.readonlyOverflowing = false;

				return;
			}

			this.readonlyOverflowing = display.scrollHeight > this.lineHeight * this.maxLines;
		},
		scheduleReadonlyOverflowCheck(): void
		{
			void this.$nextTick(() => {
				requestAnimationFrame(() => {
					this.updateReadonlyOverflowing();
				});
			});
		},
		observeReadonlyOverflow(): void
		{
			this.unobserveReadonlyOverflow();

			const display = this.$refs.readonlyDisplay;
			if (!this.isReadonlyRender || !display)
			{
				return;
			}

			this.readonlyResizeObserver = new ResizeObserver(() => {
				this.updateReadonlyOverflowing();
			});
			this.readonlyResizeObserver.observe(display);
		},
		unobserveReadonlyOverflow(): void
		{
			this.readonlyResizeObserver?.disconnect();
			this.readonlyResizeObserver = null;
		},
		focusTextarea(): void
		{
			if (this.readonly || !this.checkListEditor)
			{
				this.$refs.growingTextArea?.focusTextarea();

				return;
			}
			if (this.checkListEditor.isActive(this.checkListEditorItem?.getId()))
			{
				this.checkListEditor.focus();

				return;
			}

			this.activateEditor(true);
		},
		async selectAllText(): Promise<void>
		{
			if (this.checkListEditor)
			{
				this.focusTextarea();
				await this.$nextTick();
				await this.$nextTick();
				this.checkListEditor.selectAll();

				return;
			}

			const textarea = getTextarea(this.$refs.growingTextArea);
			if (!textarea)
			{
				return;
			}

			this.focusTextarea();
			await this.$nextTick();
			await this.$nextTick();
			textarea.setSelectionRange(0, textarea.value.length);
		},
		getActiveFormattingActions(): string[]
		{
			if (!this.checkListEditor)
			{
				const textarea = getTextarea(this.$refs.growingTextArea);

				return textarea
					? CheckListBbCode.getActiveFormattingActions(this.modelValue, {
						start: textarea.selectionStart,
						end: textarea.selectionEnd,
					})
					: []
				;
			}

			if (!this.isEditorActive)
			{
				return [];
			}

			return this.checkListEditor.getActiveFormattingActions();
		},
		getSelectedFormattingActions(): string[]
		{
			return this.getActiveFormattingActions();
		},
		getTextareaSelectionRange(): Object | null
		{
			if (this.checkListEditor)
			{
				return this.checkListEditor.captureSelection();
			}

			const textarea = getTextarea(this.$refs.growingTextArea);

			return textarea ? { start: textarea.selectionStart, end: textarea.selectionEnd } : null;
		},
		setTextareaSelectionRange(selection, legacyEnd: ?number = null): void
		{
			if (this.checkListEditor)
			{
				this.checkListEditor.restoreSelection(selection);

				return;
			}

			const start = typeof selection === 'object' ? selection.start : selection;
			const end = typeof selection === 'object' ? selection.end : legacyEnd;
			getTextarea(this.$refs.growingTextArea)?.setSelectionRange(start, end);
		},
		applyFormatting(action: string, url: string = ''): void
		{
			if (this.readonly)
			{
				return;
			}
			if (!this.checkListEditor)
			{
				const textarea = getTextarea(this.$refs.growingTextArea);
				if (!textarea)
				{
					return;
				}
				const result = action === ChecklistFormattingAction.Link
					? CheckListBbCode.addUrlTag(this.modelValue, textarea, url)
					: CheckListBbCode.handleDecorationTag(this.modelValue, textarea, action)
				;
				this.$emit('update:modelValue', result.source);
				void this.$nextTick(() => this.setTextareaSelectionRange({
					start: result.selectionStart,
					end: result.selectionEnd,
				}));

				return;
			}

			if (!this.isEditorActive)
			{
				return;
			}

			this.checkListEditor.dispatchFormatting(action, url);
			this.emitSelectionChange();
		},
		restoreTextareaSelection(selection): void
		{
			this.setTextareaSelectionRange(selection);
			this.emitSelectionChange();
		},
		activateEditor(focus: boolean = false, point: ?{ x: number, y: number } = null): void
		{
			if (this.readonly || !this.checkListEditor || !this.checkListEditorItem)
			{
				return;
			}

			this.isEditorActive = true;
			void this.$nextTick(() => {
				this.checkListEditor.activate({
					itemId: this.checkListEditorItem.getId(),
					source: this.modelValue,
					container: this.$refs.editorHost,
					aria: this.editorAria,
					layer: this,
					handlers: {
						onEnter: (event) => {
							this.$emit('enterBlur', event);
							event.target?.blur?.();

							return true;
						},
						onEscape: (event) => this.handleEditorEscape(event),
						onTab: (event) => this.handleEditorTab(event),
					},
				});
				if (focus)
				{
					this.checkListEditor.focus(point);
				}
			});
		},
		activateEditorView(): void
		{
			this.isEditorActive = true;
		},
		deactivateEditorView(): void
		{
			this.isEditorActive = false;
		},
		handleActivationPointerDown(event: PointerEvent): void
		{
			this.activationPoint = { x: event.clientX, y: event.clientY };
		},
		handleActivationFocus(event: FocusEvent): void
		{
			// A focus event carries no coordinates, and only the press right before it may have some:
			// a title focused by Tab or by the component keeps the caret at the end of the text.
			const point = this.activationPoint;
			this.activationPoint = null;

			this.activateEditor(true, point);
			if (!this.hasTitle)
			{
				this.$emit('emptyFocus');
			}
		},
		handleEditorFocus(event: FocusEvent): void
		{
			if (event.target !== this.$refs.editorHost && !this.$refs.editorHost?.contains(event.target))
			{
				return;
			}

			this.handleFocus(event);
		},
		handleEditorBlur(event: FocusEvent): void
		{
			if (this.$refs.editorHost?.contains(event.relatedTarget))
			{
				return;
			}

			const session = this.checkListEditor.finalizeBlur(this.checkListEditorItem.getId(), event);
			this.commitEditorSession(session, event);
		},
		commitEditorSession(session: ?Object, event: ?FocusEvent = null): void
		{
			if (!session)
			{
				return;
			}

			const value = session.source.trim();
			if (value !== this.modelValue)
			{
				this.$emit('update:modelValue', value);
			}
			if (!value)
			{
				this.$emit('emptyBlur');
			}
			this.$emit('blur', event);
		},
		handleEditorTab(event: KeyboardEvent): boolean
		{
			return this.routeKeyboardEvent('routeTab', event);
		},
		handleEditorEscape(event: KeyboardEvent): boolean
		{
			if (event.isComposing)
			{
				event.stopPropagation();

				return false;
			}

			return this.routeKeyboardEvent('routeEscape', event);
		},
		handleTextareaEscapeCapture(event: KeyboardEvent): void
		{
			if (event.target !== getTextarea(this.$refs.growingTextArea))
			{
				return;
			}

			if (event.isComposing)
			{
				event.stopPropagation();

				return;
			}

			this.routeKeyboardEvent('routeEscape', event);
		},
		routeKeyboardEvent(method: 'routeTab' | 'routeEscape', event: KeyboardEvent): boolean
		{
			const route = this.checkListKeyboardRouter?.[method];
			const handled = Type.isFunction(route)
				&& route.call(this.checkListKeyboardRouter, this.checkListEditorItem?.getId(), event) === true
			;
			if (handled)
			{
				event.preventDefault();
				event.stopPropagation();
			}

			return handled;
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
			if (this.isEditorActive)
			{
				return;
			}
			if (this.handleIndentationShortcut(event))
			{
				return;
			}

			const action = this.getFormattingShortcutAction(event);
			if (!action)
			{
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			this.applyFormatting(action);
		},
		handleIndentationShortcut(event: KeyboardEvent): boolean
		{
			if (
				event.key !== 'Tab'
				|| event.target !== getTextarea(this.$refs.growingTextArea)
			)
			{
				return false;
			}

			return this.routeKeyboardEvent('routeTab', event);
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
		getVisibleState(): Object | null
		{
			return this.checkListEditor?.getVisibleState() ?? null;
		},
		captureVisibleRange(start: number, end: number): Object | null
		{
			return this.checkListEditor?.captureVisibleRange(start, end) ?? null;
		},
		removeVisibleRange(range): boolean
		{
			return this.checkListEditor?.removeVisibleRange(range) ?? false;
		},
		setEditorAria(aria): void
		{
			this.checkListEditor?.setAria(
				Type.isPlainObject(aria) ? { ...this.editorAria, ...aria } : aria,
			);
		},
	},
	template: `
		<div
			class="tasks-check-list-formatting-layer"
			:class="{ '--readonly': isReadonlyRender, '--active': isEditorActive }"
			data-testid="tasks-check-list-formatting-layer"
			@click="handleLayerClick"
			@keydown.esc.capture="handleTextareaEscapeCapture"
			@keydown="handleKeyDown"
			@keyup="emitSelectionChange"
			@mouseup="emitSelectionChange"
		>
			<span v-if="editorDescribedby" :id="editorDescribedby" hidden>
				{{ keyboardInstructions }}
			</span>
			<div
				v-if="isReadonlyRender"
				ref="readonlyDisplay"
				v-hint="readonlyTooltip"
				class="tasks-check-list-formatting-layer-display print-display-block"
				data-testid="tasks-check-list-formatting-layer-display"
				:style="displayStyle"
				v-html="safeDisplayHtml"
			></div>
			<GrowingTextArea
				v-else-if="readonly || !checkListEditor"
				ref="growingTextArea"
				:modelValue="modelValue"
				:placeholder
				:readonly
				:ariaDescribedby="editorDescribedby"
				:fontColor
				:linkColor
				:fontSize
				:fontWeight
				:lineHeight
				:maxLines
				@update:modelValue="handleUpdateModelValue"
				@input="handleInput"
				@focus="handleFocus"
				@blur="$emit('blur', $event)"
				@emptyBlur="$emit('emptyBlur')"
				@emptyFocus="$emit('emptyFocus')"
				@enterBlur="$emit('enterBlur', $event)"
				@linkClick="$emit('linkClick', $event)"
			/>
			<div
				v-else-if="isEditorActive"
				ref="editorHost"
				class="tasks-check-list-formatting-layer-editor"
				:class="{ '--empty': !hasTitle }"
				:data-placeholder="placeholder"
				:style="displayStyle"
				@focusin="handleEditorFocus"
				@focusout="handleEditorBlur"
			></div>
			<div
				v-else
				ref="editableDisplay"
				class="tasks-check-list-formatting-layer-display --editable"
				:class="{ '--empty': !hasTitle }"
				data-testid="tasks-check-list-formatting-layer-display"
				:data-placeholder="placeholder"
				:style="displayStyle"
				:aria-label="placeholder"
				:aria-describedby="editorDescribedby"
				aria-multiline="true"
				role="textbox"
				tabindex="0"
				v-html="safeDisplayHtml"
				@pointerdown="handleActivationPointerDown"
				@focus="handleActivationFocus"
			></div>
		</div>
	`,
};
