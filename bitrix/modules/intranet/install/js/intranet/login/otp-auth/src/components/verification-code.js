import { DigitInput } from './digit-input';

const CODE_CHANGE = 'code-change';
const CODE_COMPLETE = 'code-complete';

// @vue/component
export const VerificationCode = {
	components: {
		DigitInput,
	},

	props: {
		code: {
			type: String,
			required: true,
		},
		error: {
			type: String,
			required: true,
		},
		// Specifies whether it should be short (4-digit) or long (6-digit) code
		isPhoneCode: {
			type: Boolean,
			default: false,
		},
	},

	emits: [
		// Contains changed code in form of numeric string value as a payload
		CODE_CHANGE,
		// Emitted when the code is fully filled
		CODE_COMPLETE,
	],

	data(): object
	{
		return {
			codeArray: [],
			// Indicates what digit input component is currently focused
			focusIndex: -1,
		};
	},

	computed: {
		codeLength(): number
		{
			return this.isPhoneCode ? 6 : 8;
		},
		isCodeComplete(): boolean
		{
			return this.codeArray.length === this.codeLength
				&& this.codeArray.every((digit) => digit !== '');
		},
	},

	watch: {
		code(newValue): void
		{
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
			for (let i = 0; i < this.codeLength; i++)
			{
				this.codeArray[i] = code.length > i ? code[i] : '';
			}
		},

		onDigitChange(changedDigitIndex, newValue): void
		{
			this.updateCodeDigit(changedDigitIndex, newValue);

			if (newValue === '')
			{
				this.focusPreviousDigitInput(changedDigitIndex);
			}
			else
			{
				this.focusNextDigitInput(changedDigitIndex);
			}

			const fullCode = this.codeArray.join('');
			this.$emit(CODE_CHANGE, fullCode);

			if (this.isCodeComplete)
			{
				this.$emit(CODE_COMPLETE, fullCode);
			}
		},

		updateCodeDigit(changedDigitIndex, newValue): void
		{
			if (changedDigitIndex >= 0 && changedDigitIndex < this.codeArray.length)
			{
				this.codeArray[changedDigitIndex] = newValue;
			}
		},

		focusPreviousDigitInput(changedDigitIndex): void
		{
			const previousIndex = changedDigitIndex - 1;

			if (previousIndex >= 0 && this.isNextDigitEmpty(changedDigitIndex))
			{
				this.focusIndex = previousIndex;
			}
		},

		isNextDigitEmpty(currentIndex: number): boolean
		{
			let nextIndex = currentIndex + 1;

			if (nextIndex >= this.codeLength)
			{
				nextIndex = this.codeLength - 1;
			}

			return this.codeArray[nextIndex] === '';
		},

		focusNextDigitInput(changedDigitIndex): void
		{
			const nextIndex = changedDigitIndex + 1;

			if (this.isPreviousDigitEmpty(changedDigitIndex))
			{
				this.focusIndex = this.calculateLastEmptyDigitIndex();
			}
			else if (nextIndex < this.codeLength)
			{
				this.focusIndex = nextIndex;
			}
		},

		isPreviousDigitEmpty(currentDigitIndex: number): boolean
		{
			let previousIndex = currentDigitIndex - 1;

			if (previousIndex < 0)
			{
				previousIndex = 0;
			}

			return this.codeArray[previousIndex] === '';
		},

		calculateLastEmptyDigitIndex(): number
		{
			const lastNonEmptyDigitIndex = this.findLastNonEmptyDigitIndex();

			if (lastNonEmptyDigitIndex < 0)
			{
				return 1;
			}

			const lastEmptyDigitIndex = lastNonEmptyDigitIndex + 1;

			return lastEmptyDigitIndex < (this.codeLength - 1)
				? lastEmptyDigitIndex + 1
				: lastEmptyDigitIndex
			;
		},

		findLastNonEmptyDigitIndex(): number
		{
			if (this.codeArray[0] === '')
			{
				return -1;
			}

			for (let i = 0; i < this.codeLength; i++)
			{
				if (this.codeArray[i] === '')
				{
					return i > 0 ? i - 1 : 0;
				}
			}

			return this.codeLength - 1;
		},

		isShiftedInput(inputIndex: number): boolean
		{
			return this.isPhoneCode && inputIndex === this.codeLength / 2;
		},

		onPaste(pastedValue): void
		{
			if (this.isValidNumericCode(pastedValue))
			{
				this.fillCodeArrayFromCode(pastedValue);
			}
			else if (this.isSingleDigit(pastedValue) && this.focusIndex >= 0)
			{
				this.codeArray[this.focusIndex] = pastedValue;
			}

			const fullCode = this.codeArray.join('');
			this.$emit(CODE_CHANGE, fullCode);

			if (this.isCodeComplete)
			{
				this.$emit(CODE_COMPLETE, fullCode);
			}
		},

		isValidNumericCode(someCode: string): boolean
		{
			const codeRegExp = new RegExp(`^[0-9]{${this.codeLength}}$`);

			return codeRegExp.test(someCode);
		},

		isSingleDigit(someValue: string): boolean
		{
			return /^\d$/.test(someValue);
		},

		onClick(inputIndex): void
		{
			this.focusIndex = inputIndex;
		},
	},

	template: `
		<div class="intranet-verification-code">
			<digit-input
				v-for="digitPos in codeLength"
				class="intranet-verification-code__digit"
				:class="{ 'intranet-verification-code__digit--shifted': isShiftedInput(digitPos - 1) }"
				:key="digitPos"
				:is-focused="focusIndex === (digitPos - 1)"
				:digit-value="codeArray[digitPos - 1] ?? ''"
				:error="error"
				@value-paste="onPaste"
				@click="onClick(digitPos - 1)"
				@digit-change="onDigitChange(digitPos - 1, $event)"
			></digit-input>
		</div>
	`,
};
