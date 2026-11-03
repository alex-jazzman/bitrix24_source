import { Type } from 'main.core';
import { type BitrixVueComponentProps } from 'ui.vue3';

import { TextEditor } from './text-editor';

export const TextEditorComponent: BitrixVueComponentProps = {
	name: 'TextEditorComponent',
	props: {
		editorOptions: {
			/** @type TextEditorOptions */
			type: Object,
		},
		editorInstance: {
			type: TextEditor,
			default: null,
		},
		events: {
			/** @type Record<string, (event: BaseEvent) => void> */
			type: Object,
			default: {},
		},
		editable: {
			type: Boolean,
			default: null,
		},
	},
	setup()
	{
		return {
			editorClass: TextEditor,
		};
	},
	provide(this: { editor: TextEditor }): { editor: TextEditor }
	{
		return {
			editor: this.editor,
		};
	},
	beforeCreate()
	{
		if (this.editorInstance === null)
		{
			this.hasOwnEditor = true;

			const EditorClass = this.editorClass;
			this.editor = new EditorClass(this.editorOptions);
		}
		else
		{
			this.hasOwnEditor = false;
			this.editor = this.editorInstance;
		}

		if (Type.isPlainObject(this.events))
		{
			for (const [eventName, fn] of Object.entries(this.events))
			{
				this.editor.subscribe(eventName, fn);
			}
		}
	},
	computed: {
		headerContainer(this: { editor: TextEditor }): HTMLElement
		{
			return this.editor.getHeaderContainer();
		},
		footerContainer(this: { editor: TextEditor }): HTMLElement
		{
			return this.editor.getFooterContainer();
		},
	},
	watch: {
		editable(this: { editor: TextEditor }, value: boolean): void
		{
			this.editor.setEditable(value);
		},
	},
	mounted(): void
	{
		this.editor.renderTo(this.$refs.container, true);
	},
	unmounted(): void
	{
		if (this.hasOwnEditor)
		{
			this.editor.destroy();
			this.editor = null;
		}
	},
	template: `
		<div ref="container"></div>
		<Teleport :to="headerContainer">
			<slot name="header"></slot>
		</Teleport>
		<Teleport :to="footerContainer">
			<slot name="footer"></slot>
		</Teleport>
	`,
};
