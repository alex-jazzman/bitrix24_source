import { BitrixVue } from 'ui.vue3';
import { DocumentEditorComponent } from '../components/note-editor';
import { cloneDocumentContent, createEmptyDocument } from './create-document-state';
import { extractErrorMessage } from '../utils/error-message';
import { showErrorToast } from '../utils/show-error-toast';
import { exportMarkdown, hasAttachments as detectAttachments } from './export/export-markdown-serializer';

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
		initialViews = null,
		initialBacklinks = null,
		lastChange = null,
		createdAt = null,
		initialSubscription = null,
		initialFavorite = null,
		historyEnabled = false,
		notificationsEnabled = false,
		showActivityLine = true,
		onRenameTitle = null,
		onOpenInternalLink = null,
		onMentionClick = null,
		onOpenHistory = null,
	}: {
		provider?: Object | null,
		currentUser?: Object,
		readOnly?: boolean,
		title?: string,
		initialViews?: Object | null,
		initialBacklinks?: Object | null,
		lastChange?: Object | null,
		createdAt?: string | null,
		initialSubscription?: Object | null,
		initialFavorite?: boolean | null,
		historyEnabled?: boolean,
		notificationsEnabled?: boolean,
		showActivityLine?: boolean,
		onRenameTitle?: Function | null,
		onOpenInternalLink?: Function | null,
		onMentionClick?: Function | null,
		onOpenHistory?: Function | null,
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
				// [#6] Base snapshot for the views widget — see create-document-feature.js's
				// applyLoadedDocument(); null falls back to the widget's own getViews call.
				initialViews,
				// [DTO-01] Backlinks counter from the same bootstrap — see create-document-feature.js's
				// applyLoadedDocument(); null makes the chip read its own count.
				initialBacklinks,
				// [#2] `{ authors, time } | null` for the activity-line chip's default (non-preview)
				// state — see create-document-feature.js's applyLoadedDocument()/state.lastChange.
				lastChange,
				// [P8.T5] ISO creation timestamp for the chip's "Created …" fallback.
				createdAt,
				// Bell state bundled with the bootstrap — the bell adopts it instead of its own getState.
				initialSubscription,
				// [TPL-01] Star state from the same bootstrap - the star prefers it over the sidebar
				// store until the store reports a change of its own.
				initialFavorite,
				// [P8.T2/T3] UI feature flags — gate the chip's history-open affordance and the bell.
				historyEnabled,
				notificationsEnabled,
				showActivityLine,
				// [P1.T5 relocation] Activity line renders inside DocumentEditorComponent (right
				// under the title) and builds its own lang via note.ui.document-history's
				// createHistoryMessages() — it no longer needs this bundle's own messages. The
				// open-history bridge still crosses this createApp() boundary.
				onRenameTitle,
				onOpenInternalLink,
				onMentionClick,
				onOpenHistory,
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

	// [#11/NEW-A rework] Bridges document-page.js's version-preview state across the
	// BitrixVue.createApp() boundary — same pattern as setEditable/setShowToolbar above.
	// See DocumentEditorComponent.setPreview() for the merge semantics.
	setPreview(payload: Object): void
	{
		this.#editorVm?.setPreview?.(payload);
	}

	clearPreview(): void
	{
		this.#editorVm?.clearPreview?.();
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

	async exportMarkdown(mode: 'links' | 'zip'): Promise<string | null>
	{
		try
		{
			const editor = this.#editorVm?.editor;
			if (!editor)
			{
				return null;
			}

			return await exportMarkdown(editor, Number(this.#getDocumentId()), mode);
		}
		catch
		{
			return null;
		}
	}

	hasAttachments(): boolean
	{
		try
		{
			const editor = this.#editorVm?.editor;

			return editor ? detectAttachments(editor) : false;
		}
		catch
		{
			return false;
		}
	}
}
