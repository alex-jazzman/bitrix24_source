import { BitrixVue } from 'ui.vue3';
import { DocumentEditorComponent } from '../components/note-editor';
import { cloneDocumentContent, createEmptyDocument } from './create-document-state';
import { extractErrorMessage } from '../utils/error-message';
import { showErrorToast } from '../utils/show-error-toast';

export class EditorMount
{
	#state: Object;
	#getDocumentId: () => mixed;
	#messages: Object;
	#editorApp: Object | null;
	#editorVm: Object | null;

	constructor({ state, getDocumentId, messages }: {
		state: Object,
		getDocumentId: () => mixed,
		messages: Object,
	})
	{
		this.#state = state;
		this.#getDocumentId = getDocumentId;
		this.#messages = messages;
		this.#editorApp = null;
		this.#editorVm = null;
	}

	get vm(): Object | null
	{
		return this.#editorVm;
	}

	async mount(editable: boolean, {
		provider = null,
		currentUser = {},
		readOnly = false,
		title = '',
		onRenameTitle = null,
		onOpenInternalLink = null,
	}: {
		provider?: Object | null,
		currentUser?: Object,
		readOnly?: boolean,
		title?: string,
		onRenameTitle?: Function | null,
		onOpenInternalLink?: Function | null,
	} = {}): Promise<boolean>
	{
		const target = document.getElementById(this.#state.editorMountId);
		if (!(target instanceof HTMLElement))
		{
			return false;
		}

		try
		{
			this.#editorApp = BitrixVue.createApp(DocumentEditorComponent, {
				modelValue: null,
				content: this.#state.content ?? null,
				editable,
				showToolbar: editable,
				documentId: Number(this.#getDocumentId()),
				collectionId: Number(this.#state.collectionId || 0),
				provider,
				currentUser,
				readOnly,
				title,
				onRenameTitle,
				onOpenInternalLink,
			});
			this.#editorVm = this.#editorApp.mount(`#${this.#state.editorMountId}`);

			return true;
		}
		catch (error)
		{
			showErrorToast(extractErrorMessage(error, this.#messages.loadError));

			return false;
		}
	}

	unmount(): void
	{
		if (this.#editorApp)
		{
			this.#editorVm?.editor?.off('update', this.handleEditorUpdate);
			this.#editorApp.unmount();
			this.#editorApp = null;
			this.#editorVm = null;
		}
	}

	isMounted(): boolean
	{
		return this.#editorVm !== null;
	}

	setEditable(value: boolean): void
	{
		this.#editorVm?.setEditable?.(value);
	}

	setShowToolbar(value: boolean): void
	{
		this.#editorVm?.setShowToolbar?.(value);
	}

	focusTitleAndSelectAll(): void
	{
		this.#editorVm?.focusTitleAndSelectAll?.();
	}

	readData(): Object | null
	{
		try
		{
			return cloneDocumentContent(this.#editorVm?.editor?.getJSON?.() || createEmptyDocument());
		}
		catch
		{
			return null;
		}
	}

	readMarkdown(): string | null
	{
		try
		{
			const markdown = this.#editorVm?.editor?.getMarkdown?.();

			return typeof markdown === 'string' ? markdown : null;
		}
		catch
		{
			return null;
		}
	}
}
