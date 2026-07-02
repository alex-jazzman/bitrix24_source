import { ajax, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { NoteEvent } from 'note.sidebar';
import { createDocumentMessages } from './messages';
import { createEmptyDocument, cloneDocumentContent } from './create-document-state';
import { normalizeCurrentUser } from '../utils/normalize';
import { getEditorSchema } from '../utils/build-schema';
import { extractErrorMessage } from '../utils/error-message';
import { resolveFileNodes } from '../utils/resolve-file-nodes';
import { showErrorToast } from '../utils/show-error-toast';
import { ProviderLifecycle } from './provider-lifecycle';
import { EditorMount } from './editor-mount';
import { saveDocument } from './document-persistence';
import type { CollaborationContext, DocumentData } from '../type';

function extractCollaborationContext(documentData: DocumentData): CollaborationContext
{
	const collaboration = Type.isPlainObject(documentData?.collaboration)
		? documentData.collaboration
		: {};

	return {
		readOnly: Boolean(collaboration.readOnly),
		currentUser: normalizeCurrentUser(collaboration.currentUser),
	};
}

class DocumentFeatureController
{
	constructor({ state, getDocumentId, nextTick, messages, onOpenInternalLink = null })
	{
		this.state = state;
		this.getDocumentId = getDocumentId;
		this.nextTick = nextTick;
		this.messages = messages;
		this.onOpenInternalLink = typeof onOpenInternalLink === 'function' ? onOpenInternalLink : null;

		this.editorMount = new EditorMount({ state, getDocumentId, messages });
		this.providerLifecycle = new ProviderLifecycle({
			state,
			schema: getEditorSchema(),
			getEditorMarkdown: () => this.editorMount.readMarkdown(),
			messages,
		});

		this.handleTitleRename = (newTitle) => {
			void this.renameTitleFromEditor(newTitle);
		};

		this.handleDocRenamed = (event) => {
			const { id, title } = event.getData();
			if (Number(this.getDocumentId()) === id)
			{
				this.state.title = title;
				this.state.titleDraft = title;
				this.editorMount.vm?.updateTitle?.(title);
			}
		};

		this.handleCollectionRenamed = (event) => {
			const { id, name } = event.getData();
			if (Number(this.state.collectionId) === id)
			{
				this.state.collectionTitle = name;
			}
		};

		EventEmitter.subscribe(NoteEvent.DOCUMENT_RENAMED, this.handleDocRenamed);
		EventEmitter.subscribe(NoteEvent.COLLECTION_RENAMED, this.handleCollectionRenamed);
	}

	isEditMode(): boolean
	{
		return this.state.mode === 'edit';
	}

	canEdit(): boolean
	{
		return Boolean(this.state.canEdit);
	}

	getDocumentTitle(): string
	{
		return String(this.state.title || '');
	}

	headerDocumentTitle(): string
	{
		if (Type.isStringFilled(this.state.title))
		{
			return this.state.title;
		}

		if (this.state.isLoading)
		{
			// Empty string signals the header to render its inline loader in the title slot.
			return '';
		}

		return `${this.messages.document} #${Number(this.getDocumentId())}`;
	}

	collectionLabel(): string
	{
		if (this.state.isTrashed || this.state.isArchived)
		{
			return '';
		}

		if (this.state.sharedAccess || !this.state.collectionId)
		{
			return '';
		}

		if (Type.isStringFilled(this.state.collectionTitle))
		{
			return this.state.collectionTitle;
		}

		return '';
	}

	applyCollaborationContext(context: CollaborationContext): void
	{
		const normalizedContext = Type.isPlainObject(context) ? context : {};

		this.state.readOnly = Boolean(normalizedContext.readOnly);
		this.state.currentUser = normalizeCurrentUser(normalizedContext.currentUser ?? this.state.currentUser);
	}

	resolveDocumentContent(documentData: Object): Object | string
	{
		const markdown = documentData.markdown ?? null;

		if (documentData.contentFormat === 'md' && Type.isString(markdown))
		{
			return markdown;
		}

		if (Type.isPlainObject(markdown) && markdown.type === 'doc')
		{
			return cloneDocumentContent(markdown);
		}

		return createEmptyDocument();
	}

	async convertAndStartCollaboration(documentData: Object): Promise<void>
	{
		if (documentData?.contentFormat !== 'md')
		{
			return;
		}

		const editor = this.editorMount.vm?.editor;
		const documentId = Number(this.getDocumentId());
		if (!editor || documentId <= 0)
		{
			return;
		}

		try
		{
			await resolveFileNodes(editor, documentId);

			const json = this.editorMount.readData();
			if (!json)
			{
				return;
			}

			this.state.content = json;

			const collaboration = documentData?.collaboration ?? {};
			const genesisData = {
				patches: collaboration.patches ?? [],
				lastPatchId: collaboration.lastPatchId ?? null,
				markdown: json,
			};
			await this.providerLifecycle.initialize(
				documentId,
				this.state.currentUser,
				genesisData,
			);
			this.providerLifecycle.startIdleTracking();
			this.editorMount.unmount();
			await this.nextTick();
			await this.#mountEditorWithContext(false);

			if (this.providerLifecycle.provider)
			{
				this.providerLifecycle.startCompaction();
			}
		}
		catch (error)
		{
			this.providerLifecycle.destroy();
			if (!this.editorMount.vm)
			{
				await this.nextTick();
				await this.#mountEditorWithContext(false);
			}
			showErrorToast(extractErrorMessage(error, this.messages.loadError));
		}
	}

	applyLoadedDocument(documentData: DocumentData): void
	{
		this.state.collectionId = Number(documentData.collectionId || 0);
		this.state.collectionTitle = String(documentData.collectionTitle || '');
		this.state.ancestors = Array.isArray(documentData.ancestors) ? documentData.ancestors : [];
		this.state.canEdit = Boolean(documentData.canEdit);
		this.state.canEditCollection = Boolean(documentData.canEditCollection);
		this.state.canManagePermissions = Boolean(documentData.canManagePermissions);
		this.state.isArchived = Boolean(documentData.isArchived);
		this.state.archivedAt = documentData.archivedAt ?? null;
		this.state.isTrashed = Boolean(documentData.isTrashed);
		this.state.recycleBinId = documentData.recycleBinId == null ? null : Number(documentData.recycleBinId);
		this.state.trashedAt = documentData.trashedAt ?? null;
		this.state.isOrphan = Boolean(documentData.isOrphan);
		this.state.canRestore = Boolean(documentData.canRestore);
		this.state.canHardDelete = Boolean(documentData.canHardDelete);
		this.state.sharedAccess = Boolean(documentData.sharedAccess);
		this.state.title = String(documentData.title || '');
		this.state.titleDraft = this.state.title;
		this.state.content = this.resolveDocumentContent(documentData);
		const collaborationContext = extractCollaborationContext(documentData);
		if (!this.state.canEdit || this.state.isArchived || this.state.isTrashed)
		{
			collaborationContext.readOnly = true;
		}
		this.applyCollaborationContext(collaborationContext);
	}

	applyDocumentPreview(preview: mixed): void
	{
		if (!Type.isPlainObject(preview))
		{
			return;
		}

		const previewTitle = String(preview.title ?? '');
		if (Type.isStringFilled(previewTitle))
		{
			this.state.title = previewTitle;
			this.state.titleDraft = previewTitle;
		}

		const previewCollectionId = Number(preview.collectionId ?? 0);
		if (Number.isInteger(previewCollectionId) && previewCollectionId > 0)
		{
			this.state.collectionId = previewCollectionId;
			this.state.collectionTitle = String(preview.collectionTitle ?? '');
		}

		if (typeof preview.isArchived === 'boolean')
		{
			this.state.isArchived = preview.isArchived;
		}

		if (Array.isArray(preview.ancestors) && preview.ancestors.length > 0)
		{
			this.state.ancestors = preview.ancestors.map((ancestor) => ({
				id: Number(ancestor?.id) || 0,
				title: String(ancestor?.title ?? ''),
			})).filter((ancestor) => ancestor.id > 0);
		}
	}

	resetStateBeforeLoad(): void
	{
		this.providerLifecycle.destroy();
		this.state.isLoading = true;
		this.state.isSaving = false;
		this.state.mode = 'view';
		this.state.collectionTitle = '';
		this.state.ancestors = [];
		this.state.canEdit = false;
		this.state.canEditCollection = false;
		this.state.canManagePermissions = false;
		this.state.isArchived = false;
		this.state.archivedAt = null;
		this.state.isTrashed = false;
		this.state.recycleBinId = null;
		this.state.trashedAt = null;
		this.state.isOrphan = false;
		this.state.canRestore = false;
		this.state.canHardDelete = false;
		this.state.sharedAccess = false;
		this.state.readOnly = false;
		this.state.currentUser = {};
		this.editorMount.unmount();
	}

	async applyRouteDocumentContext(routeContext: mixed): Promise<void>
	{
		const status = String(routeContext?.status || '');
		if (status === 'loading')
		{
			this.providerLifecycle.destroy();
			this.state.loadRequestId += 1;
			this.state.isLoading = true;
			// Drop previous doc identity so the header renders the loader in place of the stale title.
			this.state.title = '';
			this.state.titleDraft = '';
			this.state.collectionId = 0;
			this.state.collectionTitle = '';
			this.state.ancestors = [];
			this.state.isArchived = false;
			this.applyDocumentPreview(routeContext?.preview);

			return;
		}

		const currentRequestId = this.state.loadRequestId + 1;
		this.state.loadRequestId = currentRequestId;
		this.resetStateBeforeLoad();

		if (status === 'idle' && Number(this.getDocumentId()) > 0 && Number(routeContext?.docId || 0) <= 0)
		{
			return;
		}

		if (status === 'ready' && Type.isPlainObject(routeContext?.document))
		{
			const shouldAutoEdit = Boolean(routeContext?.autoEdit);
			const isMdFormat = routeContext.document.contentFormat === 'md';

			this.applyLoadedDocument(routeContext.document);

			if (!isMdFormat)
			{
				const doc = routeContext.document;
				const collaboration = doc?.collaboration ?? {};
				const providerData = {
					yjsState: doc?.yjsState ?? null,
					markdown: doc?.markdown ?? null,
					patches: collaboration.patches ?? [],
					lastPatchId: collaboration.lastPatchId ?? null,
				};
				await this.providerLifecycle.initialize(
					Number(this.getDocumentId()),
					this.state.currentUser,
					providerData,
				);
				this.providerLifecycle.startIdleTracking();
			}

			await this.nextTick();
			if (currentRequestId !== this.state.loadRequestId)
			{
				return;
			}

			await this.#mountEditorWithContext(false);
			this.state.isLoading = false;

			if (!isMdFormat && this.providerLifecycle.provider)
			{
				this.providerLifecycle.startCompaction();
			}

			if (shouldAutoEdit && this.canEdit())
			{
				await this.enterEditMode();
				await this.nextTick();
				this.editorMount.focusTitleAndSelectAll();
			}

			if (isMdFormat)
			{
				void this.convertAndStartCollaboration(routeContext.document);
			}

			return;
		}

		// 'error' / 'not_found' statuses are surfaced by pages/document-page.js as a single toast + redirect.
		this.state.isLoading = false;
	}

	async enterEditMode(): Promise<void>
	{
		if (this.state.isLoading || this.state.isSaving || this.isEditMode() || !this.canEdit())
		{
			return;
		}

		this.state.mode = 'edit';
		this.state.titleDraft = this.state.title;

		if (!this.editorMount.isMounted())
		{
			await this.#mountEditorWithContext(true);

			return;
		}

		this.editorMount.setShowToolbar(true);
		this.editorMount.setEditable(true);
	}

	async finishEdit(): Promise<void>
	{
		if (!this.isEditMode() || this.state.isSaving)
		{
			return;
		}

		if (this.providerLifecycle.provider)
		{
			this.providerLifecycle.provider.clearCursor();
		}

		this.state.mode = 'view';
		this.state.titleDraft = this.state.title;

		if (!this.editorMount.isMounted())
		{
			await this.#mountEditorWithContext(false);

			return;
		}

		this.editorMount.setEditable(false);
		this.editorMount.setShowToolbar(false);
	}

	async cancelEdit(): Promise<void>
	{
		return this.finishEdit();
	}

	async saveDocumentAction(): Promise<void>
	{
		if (!this.isEditMode() || this.state.isSaving || this.state.isLoading || !this.canEdit())
		{
			return;
		}

		const title = String(this.state.titleDraft || '').trim();
		if (!title)
		{
			showErrorToast(this.messages.titleRequired);

			return;
		}

		const markdown = this.editorMount.readData();
		if (!markdown)
		{
			showErrorToast(this.messages.saveError);

			return;
		}

		this.state.isSaving = true;

		try
		{
			await saveDocument({
				documentId: Number(this.getDocumentId()),
				title,
				markdown,
				state: this.state,
			});
			this.state.mode = 'view';

			if (this.editorMount.isMounted())
			{
				this.editorMount.setEditable(false);
				this.editorMount.setShowToolbar(false);
			}
			else
			{
				await this.#mountEditorWithContext(false);
			}
		}
		catch (error)
		{
			if (this.#isTrashedError(error))
			{
				this.#handleTrashedDuringEdit(error);

				return;
			}
			showErrorToast(extractErrorMessage(error, this.messages.saveError));
		}
		finally
		{
			this.state.isSaving = false;
		}
	}

	#isTrashedError(error: mixed): boolean
	{
		if (!Type.isPlainObject(error))
		{
			return false;
		}

		const errors = Array.isArray(error?.errors) ? error.errors : [];
		for (const item of errors)
		{
			if (Type.isPlainObject(item) && String(item?.code || '') === 'DOCUMENT_TRASHED')
			{
				return true;
			}
		}

		return false;
	}

	#handleTrashedDuringEdit(error: mixed): void
	{
		this.state.isTrashed = true;
		this.state.canEdit = false;
		this.state.mode = 'view';
		this.state.readOnly = true;
		showErrorToast(extractErrorMessage(error, this.messages.saveError));

		if (this.editorMount.isMounted())
		{
			this.editorMount.setEditable(false);
			this.editorMount.setShowToolbar(false);
		}
	}

	async renameTitleFromEditor(newTitle: string): Promise<void>
	{
		const documentId = Number(this.getDocumentId());
		if (documentId <= 0 || !newTitle)
		{
			return;
		}

		try
		{
			await ajax.runAction('note.infrastructure.DocumentController.update', {
				data: {
					id: documentId,
					title: newTitle,
				},
			});

			this.state.title = newTitle;
			this.state.titleDraft = newTitle;

			EventEmitter.emit(NoteEvent.DOCUMENT_RENAMED, new BaseEvent({
				data: {
					id: documentId,
					title: newTitle,
					collectionId: Number(this.state.collectionId),
				},
			}));
		}
		catch
		{
			// Silently ignore — the title in the editor stays as typed
		}
	}

	destroy(): void
	{
		this.providerLifecycle.destroy();
		this.editorMount.unmount();

		if (this.handleDocRenamed)
		{
			EventEmitter.unsubscribe(NoteEvent.DOCUMENT_RENAMED, this.handleDocRenamed);
			this.handleDocRenamed = null;
		}

		if (this.handleCollectionRenamed)
		{
			EventEmitter.unsubscribe(NoteEvent.COLLECTION_RENAMED, this.handleCollectionRenamed);
			this.handleCollectionRenamed = null;
		}
	}

	async #mountEditorWithContext(editable: boolean): Promise<boolean>
	{
		return this.editorMount.mount(editable, {
			provider: this.providerLifecycle.provider,
			currentUser: this.state.currentUser,
			readOnly: this.state.readOnly,
			title: this.state.title,
			onRenameTitle: this.handleTitleRename,
			onOpenInternalLink: this.onOpenInternalLink,
		});
	}
}

export function createDocumentFeature(options)
{
	const messages = createDocumentMessages();
	const controller = new DocumentFeatureController({
		...options,
		messages,
	});

	return {
		messages,
		isEditMode: () => controller.isEditMode(),
		canEdit: () => controller.canEdit(),
		getDocumentTitle: () => controller.getDocumentTitle(),
		headerDocumentTitle: () => controller.headerDocumentTitle(),
		collectionLabel: () => controller.collectionLabel(),
		applyRouteDocumentContext: (context) => controller.applyRouteDocumentContext(context),
		enterEditMode: () => controller.enterEditMode(),
		cancelEdit: () => controller.cancelEdit(),
		finishEdit: () => controller.finishEdit(),
		saveDocument: () => controller.saveDocumentAction(),
		getEditorMarkdown: () => controller.editorMount.readMarkdown(),
		destroy: () => controller.destroy(),
	};
}
