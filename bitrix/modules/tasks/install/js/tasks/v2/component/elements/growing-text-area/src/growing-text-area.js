import type { PopupOptions } from 'main.popup';
import { Popup } from 'ui.vue3.components.popup';
import { Dom, Text } from 'main.core';
import './growing-text-area.css';

// @vue/component
export const GrowingTextArea = {
	name: 'GrowingTextArea',
	components: {
		Popup,
	},
	props: {
		initialValue: {
			type: String,
			default: '',
		},
		placeholderValue: {
			type: String,
			default: '',
		},
		fontColor: {
			type: String,
			default: 'var(--ui-color-base-1)',
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
		'update',
		'input',
		'focus',
		'blur',
		'emptyFocus',
		'emptyBlur',
		'enterBlur',
	],
	data(): Object
	{
		return {
			areaId: Text.getRandom(),
			editableValue: this.initialValue,
			focus: false,
			mouseover: false,
			isOverflowing: false,
		};
	},
	computed: {
		value: {
			get(): string
			{
				if (this.readonlyPlaceholder)
				{
					return this.placeholderValue.trim();
				}

				return this.editableValue.trim();
			},
			set(name: string): void
			{
				this.editableValue = name;

				this.$emit('input', this.value);
			},
		},
		isEmpty(): boolean
		{
			return this.value.trim() === '';
		},
		isDisplay(): boolean
		{
			return this.readonly || (this.isOverflowing && !this.isEmpty && !this.focus);
		},
		popupId(): string
		{
			return `growing-text-area-value-hint-${this.areaId}`;
		},
		popupOptions(): PopupOptions
		{
			return {
				bindElement: this.$refs.container,
				offsetLeft: 40,
				maxWidth: 440,
				angle: {
					offset: 40,
				},
				targetContainer: document.body,
			};
		},
		showHint(): boolean
		{
			return (
				this.focus === false
				&& this.mouseover === true
				&& this.isOverflowing === true
			);
		},
		readonlyPlaceholder(): boolean
		{
			return this.readonly === true && this.initialValue === '';
		},
		color(): string
		{
			if (this.readonlyPlaceholder)
			{
				return 'var(--ui-color-base-4)';
			}

			return this.fontColor;
		},
	},
	watch: {
		initialValue(): void
		{
			this.editableValue = this.initialValue;
			this.value = this.editableValue;
		},
	},
	mounted(): void
	{
		requestAnimationFrame(() => {
			if (this.isEmpty)
			{
				this.focusToEnd();
			}

			void this.adjustTextareaHeight();
		});
	},
	methods: {
		async adjustTextareaHeight(): Promise<void>
		{
			const textarea = this.$refs.textarea;
			if (!textarea)
			{
				return;
			}

			Dom.style(textarea, 'height', 'auto');

			const maxHeight = this.lineHeight * 3;
			const height = Math.min(textarea.scrollHeight, maxHeight);

			this.isOverflowing = textarea.scrollHeight > maxHeight;

			Dom.style(textarea, 'height', `${height}px`);
			Dom.style(textarea, 'maxHeight', `${maxHeight}px`);
		},
		async focusToTextarea(): Promise<void>
		{
			this.focusToEnd();
		},
		clearValue(): void
		{
			this.$refs.textarea.value = '';
			this.value = '';

			void this.adjustTextareaHeight();
		},
		focusToEnd(): void
		{
			if (this.readonly === true)
			{
				return;
			}

			const textarea = this.$refs.textarea;
			textarea.focus({ preventScroll: true });
			textarea.setSelectionRange(textarea.value.length, textarea.value.length);
			this.scrollToBeginning();
			this.scrollToEnd();
		},
		focusTextarea(): void
		{
			if (this.readonly === true)
			{
				return;
			}

			this.focus = true;

			void this.$nextTick(() => {
				this.$refs.textarea.focus();
			});
		},
		scrollToBeginning(): void
		{
			if (!this.$refs.textarea)
			{
				return;
			}

			this.$refs.textarea.scrollTop = 0;
		},
		scrollToEnd(): void
		{
			const textarea = this.$refs.textarea;
			textarea.scrollTo({
				top: textarea.scrollHeight,
				behavior: 'smooth',
			});
		},
		handleInput(event): void
		{
			this.value = event.target.value;

			this.$emit('update', this.value);

			void this.adjustTextareaHeight();
		},
		handleKeyDown(event: KeyboardEvent): void
		{
			if (event.key === 'Enter' && (event.ctrlKey || event.metaKey))
			{
				event.stopPropagation();

				return;
			}

			if (event.key === 'Enter')
			{
				this.$refs.textarea.dataset.enterBlur = 'true';

				event.target.blur();
				event.preventDefault();
			}

			if (event.key === 'Escape')
			{
				event.target.blur();
				event.stopPropagation();
			}
		},
		async handleFocus(event: FocusEvent): Promise<void>
		{
			this.focus = true;

			await this.adjustTextareaHeight();
			this.focusToEnd();

			if (this.value === '')
			{
				this.$emit('emptyFocus');
			}

			this.$emit('focus', event);
		},
		async handleBlur(event: FocusEvent): Promise<void>
		{
			const wasEnterBlur = this.$refs.textarea?.dataset.enterBlur === 'true';
			delete this.$refs.textarea?.dataset.enterBlur;

			this.focus = false;
			this.mouseover = false;

			if (!this.isOverflowing)
			{
				await this.adjustTextareaHeight();
				this.scrollToBeginning();
			}

			if (this.value === '')
			{
				this.$emit('emptyBlur');
			}

			if (wasEnterBlur)
			{
				this.$emit('enterBlur', this.value === '');
			}

			this.$emit('blur', event);
		},
	},
	template: `
		<div ref="container" class="b24-growing-text-area-content">
			<div
				v-if="isDisplay"
				class="b24-growing-text-area-display"
				:class="{ '--readonly': readonly }"
				:data-id="'b24-growing-text-area-display-' + areaId"
				:style="{
					lineHeight: lineHeight + 'px',
					color: color,
					fontSize: fontSize + 'px',
					fontWeight: fontWeight,
				}"
				@click="focusTextarea"
				@mouseover="mouseover = true"
				@mouseleave="mouseover = false"
			>
				{{ value }}
			</div>
			<textarea
				v-else
				v-model="editableValue"
				ref="textarea"
				class="b24-growing-text-area-edit"
				:placeholder="placeholderValue"
				:data-id="'b24-growing-text-area-edit-' + areaId"
				:style="{
					lineHeight: lineHeight + 'px',
					color: fontColor,
					fontSize: fontSize + 'px',
					fontWeight: fontWeight,
				}"
				rows="1"
				@input="handleInput"
				@keydown="handleKeyDown"
				@focus="handleFocus"
				@blur="handleBlur"
			></textarea>
			<Popup
				v-if="showHint"
				ref="hint"
				:id="popupId"
				:options="popupOptions"
			>
				<div class="b24-growing-text-area-popup-content">
					{{ value }}
				</div>
			</Popup>
		</div>
	`,
};
