import { Runtime, Type } from 'main.core';
import { TextEditor, TextEditorComponent } from 'ui.text-editor';

export const TextEditorWrapperComponent = {
	components: {
		TextEditorComponent,
	},

	emits: [
		'change',
	],

	props: {
		textEditor: TextEditor,
	},

	data(): Object
	{
		return {
			textEditorEvents: {
				onChange: this.emitChangeData,
			},
		};
	},

	methods: {
		emitChangeData(): void
		{
			if (!Type.isFunction(this.onChangeDebounce))
			{
				this.onChangeDebounce = Runtime.debounce(this.onChange, 100, this);
			}

			this.onChangeDebounce();
		},
		onChange(): void
		{
			this.$emit('change', {
				prompt: this.textEditor.getText(),
			});
		},
	},

	// language=Vue
	template: `
		<TextEditorComponent
			:events="textEditorEvents"
			:editor-instance="textEditor"
		/>
	`,
};
