import './text-input.css';
import { onMounted, useTemplateRef, toValue } from 'ui.vue3';
import { useLoc } from '../../../../shared/composables';
import type { GetMessage } from '../../../../shared/composables';

export type TextInputSetup = {
	getMessage: GetMessage,
};

// @vue/component
export const TextInput = {
	name: 'catalog-input',
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
	setup(props): {...}
	{
		const textInput = useTemplateRef('textInput');
		const { getMessage } = useLoc();

		onMounted(() => {
			if (props.focusable)
			{
				toValue(textInput)?.focus();
			}
		});

		return {
			getMessage,
		};
	},
	template: `
		<div class="editor-chart-catalog-input">
			<input
				ref="textInput"
				:value="modelValue"
				:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_SEARCH_PLACEHOLDER')"
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
