import { type ComponentOptions } from 'ui.vue3';

import { TextEditorComponent } from '../text-editor-component';
import { BasicEditor } from './basic-editor';

export const BasicEditorComponent: ComponentOptions = {
	name: 'BasicEditorComponent',
	extends: TextEditorComponent,
	setup(): Object
	{
		return {
			editorClass: BasicEditor,
		};
	},
};
