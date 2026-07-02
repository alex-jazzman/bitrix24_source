import { Editor } from '@tiptap/core';
import { markRaw } from 'ui.vue3';

export function createEditorInstance(config: Object): Object
{
	return markRaw(new Editor(config));
}
