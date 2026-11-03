import { Dom, Text, Type } from 'main.core';
import { defineComponent } from 'ui.vue3';
import { hint, type HintParams } from 'ui.vue3.directives.hint';

const URL_REGEXP = /((https?:\/\/(www\.)?)|(www\.))[\w#%+.:=@~-]{1,256}\.[\d()A-Za-z]{1,6}\b([\w#%&()+./:=?@[\]~-]*)(?<![%()+.:\]-])/;
const EMAIL_REGEXP = /(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))/;
const PUNCTUATION_OR_SPACE = /[\s(),.;[\]]/;

function createLinkMatcherWithRegExp(regExp, urlTransformer = (text) => text): Function
{
	return (text) => {
		const match = regExp.exec(text);
		if (match === null)
		{
			return null;
		}

		return {
			index: match.index,
			length: match[0].length,
			text: match[0],
			url: urlTransformer(match[0]),
		};
	};
}

const LINK_MATCHERS = [
	createLinkMatcherWithRegExp(URL_REGEXP, (text) => (text.startsWith('http') ? text : `https://${text}`)),
	createLinkMatcherWithRegExp(EMAIL_REGEXP, (text) => `mailto:${text}`),
];

import './growing-text-area.css';

export const GrowingTextArea = defineComponent({
	name: 'GrowingTextArea',
	directives: { hint },
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
		maxLines: {
			type: Number,
			default: 3,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		ariaLabel: {
			type: String,
			default: '',
		},
		ariaDescribedby: {
			type: String,
			default: '',
		},
		editButtonLabel: {
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
		'linkClick',
	],
	data(): Object
	{
		return {
			focus: false,
			overflowing: false,
		};
	},
	computed: {
		isEmpty(): boolean
		{
			return this.modelValue.trim() === '';
		},
		isDisplay(): boolean
		{
			return !this.isEmpty && !this.focus && (this.overflowing || this.hasLinks);
		},
		hasEditButton(): boolean
		{
			return !this.readonly && this.hasLinks && Type.isStringFilled(this.editButtonLabel);
		},
		displayRole(): ?string
		{
			if (this.readonly || this.hasLinks)
			{
				return null;
			}

			return 'button';
		},
		displayAriaLabel(): ?string
		{
			if (this.displayRole !== 'button')
			{
				return null;
			}

			return this.ariaLabel || null;
		},
		linkMatches(): Array<Object>
		{
			return this.findLinkMatches(this.modelValue);
		},
		hasLinks(): boolean
		{
			return this.linkMatches.length > 0;
		},
		displayHtml(): string
		{
			return this.getLinkifiedHtml(this.modelValue, this.linkMatches);
		},
		tooltip(): ?Function
		{
			if (!this.overflowing)
			{
				return null;
			}

			return (): HintParams => ({
				html: this.displayHtml,
				interactivity: true,
				popupOptions: {
					className: 'b24-growing-text-area-popup',
					bindElement: this.$el,
					offsetLeft: 40,
					maxWidth: 440,
					maxHeight: 360,
					angle: {
						offset: 40,
					},
					darkMode: false,
					targetContainer: document.body,
				},
			});
		},
	},
	mounted(): void
	{
		requestAnimationFrame(() => {
			if (this.isEmpty)
			{
				this.focusToEnd();
			}

			this.overflowing = this.isOverflowing();

			void this.adjustTextareaHeight();
		});
	},
	methods: {
		getLinkifiedHtml(value: string, matches: Array<Object>): string
		{
			if (!Type.isStringFilled(value))
			{
				return '';
			}

			if (!Array.isArray(matches) || matches.length === 0)
			{
				return Text.encode(value);
			}

			let result = '';
			let lastIndex = 0;

			matches.forEach((match) => {
				result += Text.encode(value.slice(lastIndex, match.start));

				const safeHref = Text.encode(match.href);
				const safeText = Text.encode(match.text);

				result += `
					<a
						class="b24-growing-text-area-link"
						href="${safeHref}"
						target="_blank"
						rel="noopener noreferrer"
						style="color: ${this.linkColor};"
					>${safeText}</a>
				`.trim();

				lastIndex = match.end;
			});

			result += Text.encode(value.slice(lastIndex));

			return result;
		},
		findLinkMatches(value: string): Array<Object>
		{
			if (!Type.isStringFilled(value))
			{
				return [];
			}

			const matches = [];
			let text = value;
			let offset = 0;
			let match = this.getFirstLinkMatch(text);

			while (match)
			{
				const start = offset + match.index;
				const end = start + match.length;

				if (this.isMatchBoundariesValid(value, start, end))
				{
					matches.push({
						start,
						end,
						text: match.text,
						href: match.url,
					});
				}

				const sliceIndex = match.index + match.length;
				offset += sliceIndex;
				text = text.slice(sliceIndex);
				match = this.getFirstLinkMatch(text);
			}

			return matches;
		},
		getFirstLinkMatch(text: string): ?Object
		{
			if (!Type.isStringFilled(text))
			{
				return null;
			}

			for (const matcher of LINK_MATCHERS)
			{
				const match = matcher(text);
				if (match)
				{
					return match;
				}
			}

			return null;
		},
		isMatchBoundariesValid(text: string, start: number, end: number): boolean
		{
			const beforeChar = start > 0 ? text[start - 1] : '';
			const afterChar = end < text.length ? text[end] : '';

			return this.isSeparator(beforeChar) && this.isSeparator(afterChar);
		},
		isSeparator(char: string): boolean
		{
			if (!Type.isStringFilled(char))
			{
				return true;
			}

			return PUNCTUATION_OR_SPACE.test(char);
		},
		isOverflowing(): boolean
		{
			const textarea = this.$refs.textarea;
			const display = this.$refs.display;

			if (textarea)
			{
				const maxHeight = this.lineHeight * this.maxLines;

				return textarea.scrollHeight > maxHeight;
			}

			if (display)
			{
				return display.offsetHeight >= this.lineHeight * this.maxLines;
			}

			return false;
		},
		async adjustTextareaHeight(): Promise<void>
		{
			const textarea = this.$refs.textarea;
			if (!textarea)
			{
				return;
			}

			Dom.style(textarea, 'height', 'auto');

			const maxHeight = this.lineHeight * this.maxLines;
			const height = Math.min(textarea.scrollHeight, maxHeight);

			this.overflowing = this.isOverflowing();

			Dom.style(textarea, 'height', `${height}px`);
			Dom.style(textarea, 'maxHeight', `${maxHeight}px`);
		},
		focusToEnd(): void
		{
			const textarea = this.$refs.textarea;
			if (!textarea)
			{
				return;
			}

			if (this.readonly)
			{
				return;
			}

			textarea.focus({ preventScroll: true });
			textarea.setSelectionRange(textarea.value.length, textarea.value.length);
			this.scrollToBeginning();
			this.scrollToEnd();
		},
		focusTextarea(): void
		{
			if (this.readonly)
			{
				return;
			}

			if (this.focus)
			{
				void this.handleFocus();
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
		handleDisplayClick(event: PointerEvent): void
		{
			if (
				event
				&& event.target
				&& event.target.closest
				&& event.target.closest('.b24-growing-text-area-link')
			)
			{
				this.$emit('linkClick', event);
			}
			else if (!this.focus)
			{
				this.focusTextarea();
			}
		},
		handleDisplayKeyDown(event: KeyboardEvent): void
		{
			if (event.target?.closest?.('.b24-growing-text-area-link'))
			{
				return;
			}

			if (event.key === 'Enter' || event.key === ' ')
			{
				event.preventDefault();
				this.focusTextarea();
			}
		},
		handleInput(event): void
		{
			this.$emit('input', event.target.value);

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
				this.$emit('enterBlur', this.modelValue === '');

				event.target.blur();
				event.preventDefault();
			}

			if (event.key === 'Escape')
			{
				event.target.blur();
				event.stopPropagation();

				if (this.hasEditButton)
				{
					this.returnFocusToEditTrigger();
				}
			}
		},
		returnFocusToEditTrigger(): void
		{
			requestAnimationFrame(() => {
				if (document.activeElement !== document.body)
				{
					return;
				}

				const editTrigger = this.$refs.editTrigger;
				if (editTrigger?.isConnected)
				{
					editTrigger.focus();
				}
			});
		},
		async handleFocus(event?: FocusEvent): Promise<void>
		{
			this.focus = true;

			await this.adjustTextareaHeight();
			this.focusToEnd();

			if (this.modelValue === '')
			{
				this.$emit('emptyFocus');
			}

			this.$emit('focus', event);
		},
		async handleBlur(event: FocusEvent): Promise<void>
		{
			if (!this.$refs.textarea)
			{
				return;
			}

			if (!this.overflowing)
			{
				await this.adjustTextareaHeight();
				this.scrollToBeginning();
			}

			const value = this.$refs.textarea.value.trim();
			if (value !== this.modelValue)
			{
				this.$emit('update:modelValue', value);
			}

			this.$refs.textarea.value = value;

			if (value === '')
			{
				this.$emit('emptyBlur');
			}

			this.$emit('blur', event);

			this.focus = false;
		},
	},
	template: `
		<div class="b24-growing-text-area" :class="{ '--readonly': readonly }">
			<button
				ref="editTrigger"
				v-if="isDisplay && hasEditButton"
				type="button"
				class="b24-growing-text-area-edit-trigger"
				data-testid="tasks-growing-text-area-edit-trigger"
				:aria-label="editButtonLabel"
				@click="focusTextarea"
			></button>
			<div
				ref="display"
				v-if="isDisplay"
				v-hint="tooltip"
				class="b24-growing-text-area-display print-display-block"
				data-testid="tasks-growing-text-area-display"
				:role="displayRole"
				:tabindex="hasEditButton || readonly ? null : 0"
				:aria-label="displayAriaLabel"
				:style="{
					lineHeight: lineHeight + 'px',
					color: fontColor,
					fontSize: fontSize + 'px',
					fontWeight: fontWeight,
					'-webkit-line-clamp': maxLines,
				}"
				@click="handleDisplayClick"
				@keydown="handleDisplayKeyDown"
			>
				<span v-html="displayHtml"/>
			</div>
			<textarea
				v-else
				class="b24-growing-text-area-edit"
				data-testid="tasks-growing-text-area-input"
				rows="1"
				:value="modelValue"
				:placeholder
				:aria-label="ariaLabel || null"
				:aria-describedby="ariaDescribedby || null"
				:style="{
					lineHeight: lineHeight + 'px',
					color: fontColor,
					fontSize: fontSize + 'px',
					fontWeight: fontWeight,
				}"
				:readonly
				ref="textarea"
				@input="handleInput"
				@keydown="handleKeyDown"
				@focus="handleFocus"
				@blur="handleBlur"
			>{{ modelValue }}</textarea>
		</div>
	`,
});
