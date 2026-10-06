import { addCustomEvent, Reflection } from 'main.core';

import { type SignatureHtmlEditor } from './types';

type HtmlEditorInstance = {
	GetContent(): string,
	InsertHtml(html: string): void,
	Focus(): void,
	GetViewMode(): string,
	toolbar: {
		DisableWysiwygButtons(disabled: boolean): void,
	},
};

type HtmlEditorManager = {
	Get(id: string): HtmlEditorInstance,
};

export class HtmlEditorAdapter implements SignatureHtmlEditor
{
	#editorInstanceId: string;

	constructor(editorInstanceId: string)
	{
		this.#editorInstanceId = editorInstanceId;
	}

	getContent(): string
	{
		return this.#requireEditor().GetContent();
	}

	insertHtml(html: string): void
	{
		this.#requireEditor().InsertHtml(html);
	}

	focus(): void
	{
		this.#requireEditor().Focus();
	}

	syncToolbar(): void
	{
		const editor = this.#getEditor();
		if (!editor)
		{
			return;
		}

		editor.toolbar.DisableWysiwygButtons(editor.GetViewMode() === 'code');
	}

	subscribeToViewModeChanges(): void
	{
		const editor = this.#getEditor();
		if (editor)
		{
			addCustomEvent(editor, 'OnSetViewAfter', () => this.syncToolbar());
		}
	}

	#getEditor(): HtmlEditorInstance | null
	{
		const manager = Reflection.getClass('BXHtmlEditor') as unknown as HtmlEditorManager | null;

		return manager?.Get(this.#editorInstanceId) ?? null;
	}

	#requireEditor(): HtmlEditorInstance
	{
		const editor = this.#getEditor();
		if (!editor)
		{
			throw new Error(`HTML editor ${this.#editorInstanceId} is not initialized`);
		}

		return editor;
	}
}
