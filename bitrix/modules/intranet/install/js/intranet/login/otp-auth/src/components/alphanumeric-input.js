const CHARACTER_CHANGE = 'char-change';
const VALUE_PASTE = 'value-paste';

// @vue/component
export const AlphanumericInput = {
	props: {
		charValue: {
			type: String,
			default: '',
		},
		error: {
			type: String,
			default: '',
		},
		isFocused: {
			type: Boolean,
			default: false,
		},
	},

	emits: [
		CHARACTER_CHANGE,
		VALUE_PASTE,
	],

	data(): Object
	{
		return {
			inputValue: this.charValue,
		};
	},
	computed: {
		inputClass(): string
		{
			return `intranet-char-input${this.error ? ' --error' : ''}`;
		},
	},

	watch: {
		charValue(newValue): void
		{
			this.inputValue = newValue;
		},

		isFocused(newValue): void
		{
			if (newValue)
			{
				this.$nextTick(() => {
					this.$refs.input?.focus();
					this.$refs.input?.select();
				});
			}
		},
	},

	methods: {
		onInput(event): void
		{
			const newValue = event.target.value;
			const lastChar = newValue.slice(-1);

			if (this.isValidCharacter(lastChar))
			{
				this.inputValue = lastChar;
				this.$emit(CHARACTER_CHANGE, this.inputValue);
			}
		},

		onPaste(event): void
		{
			event.preventDefault();
			const pastedValue = event.clipboardData.getData('text');
			this.$emit(VALUE_PASTE, pastedValue);
		},

		onKeyDown(event): void
		{
			if (!this.isAllowedKey(event))
			{
				event.preventDefault();

				return;
			}

			if (event.key === 'Backspace')
			{
				this.inputValue = '';
				this.$emit(CHARACTER_CHANGE, '');
			}
		},

		isValidCharacter(char): boolean
		{
			return /^[\dA-Za-z]$/.test(char);
		},

		isAllowedKey(event): boolean
		{
			const key = event.key;

			if (key === 'Backspace')
			{
				return true;
			}

			return this.isValidCharacter(key);
		},

		onClick(): void
		{
			this.$emit('click');
		},
	},

	template: `
		<input
		  ref="input"
		  type="text"
		  :class="inputClass"
		  :value="inputValue"
		  maxlength="1"
		  @input="onInput"
		  @paste="onPaste"
		  @keydown="onKeyDown"
		  @click="onClick"
		/>
	`,
};
