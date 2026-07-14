import { defineComponent } from 'vue';
import { Dom } from 'main.core';
import './ui-textarea.css';

// @vue/component
export const UiTextarea = defineComponent({
	name: 'UiTextarea',
	props: {
		modelValue: {
			type: String,
			default: '',
		},
		id: {
			type: String,
			default: '',
		},
		placeholder: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	watch: {
		modelValue(): void
		{
			void this.$nextTick(() => this.adjustHeight());
		},
	},
	mounted(): void
	{
		this.adjustHeight();
	},
	methods: {
		onInput(event: Event): void
		{
			const value = (event.target as HTMLTextAreaElement).value;
			this.$emit('update:modelValue', value);
			this.adjustHeight();
		},
		adjustHeight(): void
		{
			const textarea = this.$refs.textarea as HTMLTextAreaElement;
			if (!textarea)
			{
				return;
			}

			Dom.style(textarea, 'height', '');
			if (textarea.scrollHeight > textarea.clientHeight)
			{
				Dom.style(textarea, 'height', `${textarea.scrollHeight}px`);
			}
		},
	},
	template: `
		<div class="socialnetwork--ui-textarea">
			<textarea
				ref="textarea"
				:value="modelValue"
				:id
				class="socialnetwork--ui-textarea--textarea"
				:placeholder
				:disabled
				@input="onInput"
			></textarea>
		</div>
	`,
});
