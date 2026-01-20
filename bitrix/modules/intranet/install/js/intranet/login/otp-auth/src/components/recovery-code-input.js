import { AlphanumericInput } from './alphanumeric-input';

const CODE_CHANGE = 'code-change';
const CODE_COMPLETE = 'code-complete';

// @vue/component
export const RecoveryCodeInput = {
	components: {
		AlphanumericInput,
	},

	props: {
		code: {
			type: String,
			required: true,
		},
		codeLength: {
			type: Number,
			default: 8,
		},
		separatorPosition: {
			type: Number,
			default: 4,
		},
		separator: {
			type: String,
			default: '-',
		},
		error: {
			type: String,
			default: '',
		},
	},

	emits: [
		CODE_CHANGE,
		CODE_COMPLETE,
	],

	data(): Object
	{
		return {
			codeArray: [],
			focusIndex: -1,
		};
	},

	computed: {
		isCodeComplete(): boolean
		{
			return this.codeArray.length === this.codeLength
				&& this.codeArray.every((char) => char !== '');
		},
	},

	watch: {
		code(newValue): void {
			this.fillCodeArrayFromCode(newValue);
		},
	},

	created(): void
	{
		this.fillCodeArrayFromCode(this.code);
	},

	mounted(): void
	{
		this.focusIndex = 0;
	},

	methods: {
		fillCodeArrayFromCode(code): void
		{
			const cleanCode = code.replace(this.separator, '');

			for (let i = 0; i < this.codeLength; i++)
			{
				this.codeArray[i] = cleanCode.length > i ? cleanCode[i] : '';
			}
		},

		onCharacterChange(changedIndex, newValue): void
		{
			this.updateCodeCharacter(changedIndex, newValue);

			if (newValue === '')
			{
				this.focusPreviousInput(changedIndex);
			}
			else
			{
				this.focusNextInput(changedIndex);
			}

			const formattedCode = this.getFormattedCode();
			this.$emit(CODE_CHANGE, formattedCode);

			if (this.isCodeComplete)
			{
				this.$emit(CODE_COMPLETE, formattedCode);
			}
		},

		updateCodeCharacter(changedIndex, newValue): void
		{
			if (changedIndex >= 0 && changedIndex < this.codeArray.length)
			{
				this.codeArray[changedIndex] = newValue.toLowerCase();
			}
		},

		focusPreviousInput(changedIndex): void
		{
			const previousIndex = changedIndex - 1;

			if (previousIndex >= 0)
			{
				this.focusIndex = previousIndex;
			}
		},

		focusNextInput(changedIndex): void
		{
			const nextIndex = changedIndex + 1;

			if (nextIndex < this.codeLength)
			{
				this.focusIndex = nextIndex;
			}
		},

		getFormattedCode(): string
		{
			const code = this.codeArray.join('');
			if (code.length > this.separatorPosition)
			{
				return code.slice(0, Math.max(0, this.separatorPosition))
					+ this.separator
					+ code.slice(Math.max(0, this.separatorPosition));
			}

			return code;
		},

		onPaste(pastedValue): void
		{
			const cleanValue = pastedValue.replaceAll(/[^\dA-Za-z]/g, '').toLowerCase();

			if (this.isValidRecoveryCode(cleanValue))
			{
				this.fillCodeArrayFromCode(cleanValue);
			}
			else if (this.isSingleCharacter(pastedValue) && this.focusIndex >= 0)
			{
				this.codeArray[this.focusIndex] = pastedValue.toLowerCase();
			}

			const formattedCode = this.getFormattedCode();
			this.$emit(CODE_CHANGE, formattedCode);

			if (this.isCodeComplete)
			{
				this.$emit(CODE_COMPLETE, formattedCode);
			}
		},

		isValidRecoveryCode(someCode: string): boolean
		{
			const codeRegExp = new RegExp(`^[a-zA-Z0-9]{${this.codeLength}}$`);

			return codeRegExp.test(someCode);
		},

		isSingleCharacter(someValue: string): boolean
		{
			return /^[\dA-Za-z]$/.test(someValue);
		},

		onClick(inputIndex): void {
			this.focusIndex = inputIndex;
		},
	},

	template: `
		<div class="intranet-verification-code">
			<alphanumeric-input
				v-for="charPos in codeLength"
				class="intranet-verification-code__char"
				:key="charPos"
				:is-focused="focusIndex === (charPos - 1)"
				:error="error"
				:char-value="codeArray[charPos - 1] ?? ''"
				@value-paste="onPaste"
				@click="onClick(charPos - 1)"
				@char-change="onCharacterChange(charPos - 1, $event)"
			/>
		</div>
	`,
};
