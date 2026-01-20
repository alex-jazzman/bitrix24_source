const CLICK_EVENT = 'click';
const PASTE_EVENT = 'value-paste';
const CHANGE_EVENT = 'digit-change';

// @vue/component
export const DigitInput = {
	props: {
		digitValue: {
			type: String,
			default: '',
			validator: (value) => (/\d/.test(value) || value === ''),
		},

		isFocused: {
			type: Boolean,
			default: false,
		},
		error: {
			type: String,
			required: true,
		},
	},

	emits: [
		CLICK_EVENT,
		// Contains pasted value as a payload
		PASTE_EVENT,
		// Contains new digit value in form of numeric string as a payload
		CHANGE_EVENT,
	],

	computed: {
		inputExtraClasses(): Object
		{
			return {
				'intranet-digit-input--filled': this.digitValue !== '',
			};
		},
		inputClass(): string
		{
			return `intranet-digit-input${this.error ? ' --error' : ''}`;
		},
	},

	watch: {
		isFocused(needFocus)
		{
			if (needFocus)
			{
				this.$el.focus();
			}
			else
			{
				this.$el.blur();
			}
		},
	},

	methods: {
		onClick(): void
		{
			this.$emit(CLICK_EVENT);
		},

		deselectInputContent(): void
		{
			this.$el.selectionStart = this.$el.selectionEnd;
		},

		onPaste(event): void
		{
			const pastedValue = (event.clipboardData || window.clipboardData).getData('text');
			this.$emit(PASTE_EVENT, pastedValue);
		},

		onKeyDown(event): void
		{
			const isShortcutKey = event.ctrlKey || event.altKey || event.metaKey;

			if (!isShortcutKey)
			{
				event.preventDefault();
			}

			if (/\d/.test(event.key) || event.key === 'Backspace')
			{
				this.$emit(CHANGE_EVENT, event.key === 'Backspace' ? '' : event.key);
			}
		},
	},

	template: `
		<input
			type="text"
			maxlength="1"
			inputmode="numeric"
			:class="inputClass"
			:class="inputExtraClasses"
			:value="digitValue"
			@click="onClick"
			@keydown="onKeyDown"
			@paste.prevent="onPaste"
		>
	`,
};
