import { Type } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { DocumentEditorComponent } from './components/note-editor';
import { NoteDocumentPageComponent } from './components/document/document-page';
import { NoteDocumentEmbedComponent } from './components/document/document-embed';

export class NoteEditorApp
{
	#app: Object | null = null;
	#vm: Object | null = null;

	mount(target: string, props?: Object): NoteEditorApp
	{
		if (!Type.isStringFilled(target))
		{
			throw new Error('Target selector is required');
		}

		this.unmount();
		this.#app = BitrixVue.createApp(DocumentEditorComponent, props);
		this.#vm = this.#app.mount(target);

		return this;
	}

	getData(): Object | null
	{
		return this.#vm?.editor?.getJSON?.() ?? null;
	}

	unmount(): void
	{
		if (this.#app)
		{
			this.#app.unmount();
			this.#app = null;
			this.#vm = null;
		}
	}
}

export { DocumentEditorComponent, NoteDocumentPageComponent, NoteDocumentEmbedComponent };
