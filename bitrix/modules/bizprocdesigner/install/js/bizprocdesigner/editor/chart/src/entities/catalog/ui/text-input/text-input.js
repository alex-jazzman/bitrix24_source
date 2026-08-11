
import './text-input.css';

export type TextInputSetup = {
	getMessage: GetMessage,
};

// @vue/component
export const TextInput = {
	name: 'TextInput',
	props: {
		modelValue: {
			type: String,
			default: '',
		},
		focusable: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		placeholder(): string
		{
			return this.$bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_SEARCH_PLACEHOLDER');
		},
	},
	watch: {
		focusable(isFocus: boolean): void
		{
			if (isFocus)
			{
				this.$refs?.textInput?.focus();
			}
			else
			{
				this.$refs?.textInput?.blur();
			}
		},
	},
	mounted()
	{
		if (this.focusable)
		{
			this.$refs?.textInput?.focus();
		}
	},
	template: `
		<div class="editor-chart-catalog-input">
			<input
				ref="textInput"
				:value="modelValue"
				:placeholder="placeholder"
				:data-test-id="$testId('catalogSearchInput')"
				:class="{
					'editor-chart-catalog-input__input': true,
					'editor-chart-catalog-input__input--has-text': modelValue.length > 0
				}"
				type="text"
				@input="$emit('update:modelValue', $event.target.value)"
				@focus="$emit('focus', $event)"
				@blur="$emit('blur', $event)"
			/>
		</div>
	`,
};
