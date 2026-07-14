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
import { computeHeadingEntries } from '../utils/heading-slug';
import { headingAnchorPluginKey } from '../extensions/heading-anchor-plugin';
import { ProviderLifecycle } from './provider-lifecycle';
import { EditorMount } from './editor-mount';
import { saveDocument } from './document-persistence';
import { DocumentService } from '../application/document-service';
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

// Debounce window for ACL-driven capability refresh; jitter desynchronises
// reconnecting clients hitting REST after a burst of `documentCapabilities`.
const CAPABILITY_REFRESH_MIN_MS = 80;
const CAPABILITY_REFRESH_JITTER_MS = 220;

class DocumentFeatureController
{
	constructor({ state, getDocumentId, nextTick, messages, onOpenInternalLink = null, onHardDelete = null, onAccessRevoked = null })
	{
		this.state = state;
		this.getDocumentId = getDocumentId;
		this.nextTick = nextTick;
		this.messages = messages;
		this.onOpenInternalLink = typeof onOpenInternalLink === 'function' ? onOpenInternalLink : null;
		this.onHardDelete = typeof onHardDelete === 'function' ? onHardDelete : null;
		this.onAccessRevoked = typeof onAccessRevoked === 'function' ? onAccessRevoked : null;
		this.capabilityRefreshTimer = null;
		// When a lifecycle event (trash/archive) triggers the access re-check, its own toast
		// already explains the removal — suppress the redundant access-revoked toast.
		this.silentAccessRevoke = false;

		// Cleanup for the active anchor pinning session (see #keepTargetPinned).
		this.anchorPinCleanup = null;

		this.editorMount = new EditorMount({ state, getDocumentId, messages });
		this.providerLifecycle = new ProviderLifecycle({
			state,
			schema: getEditorSchema(),
			getEditorMarkdown: () => this.editorMount.readMarkdown(),
			messages,
			onHardDelete: this.onHardDelete,
			onRemoteRename: (title) => this.applyRemoteTitle(title),
			onCapabilities: () => this.scheduleCapabilityRefresh(),
			onLifecycleChange: (reason) => this.#handleLifecycleChange(reason),
			onRemoteContentOverwritten: (params) => { void this.#handleRemoteContentOverwritten(params); },
		});

		this.handleTitleRename = (newTitle) => {
			void this.renameTitleFromEditor(newTitle);
		};

		this.applyRemoteTitle = (title) => {
			if (typeof title !== 'string' || title === '')
			{
				return;
			}

			const changed = this.state.title !== title;
			this.state.title = title;
			this.state.titleDraft = title;
			this.editorMount.vm?.updateTitle?.(title);

			// Notify note-app/sidebar so the browser tab title (document.title) follows a push rename.
			// Guard against the twin push path (PULL_EVENT) re-emitting the same rename.
			if (changed)
			{
				this.#emitDocumentRenamed(title);
			}
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

		// Cross-route bus: react to push payloads handled by the sidebar so the editor's
		// breadcrumb/header stay in sync without an extra BX.PULL subscription.
		this.handlePullEvent = (event) => {
			const { command, params } = event.getData() || {};
			if (!command || !params)
			{
				return;
			}

			if (command === 'documentUpdate')
			{
				this.#applyDocumentRenameFromPull(params);
			}
			else if (command === 'collectionUpdate')
			{
				this.#applyCollectionRenameFromPull(params);
			}
		};

		EventEmitter.subscribe(NoteEvent.DOCUMENT_RENAMED, this.handleDocRenamed);
		EventEmitter.subscribe(NoteEvent.COLLECTION_RENAMED, this.handleCollectionRenamed);
		EventEmitter.subscribe(NoteEvent.PULL_EVENT, this.handlePullEvent);
	}

	#applyDocumentRenameFromPull(params: Object): void
	{
		const id = Number(params.documentId);
		const title = typeof params.title === 'string' ? params.title : '';
		if (!Number.isInteger(id) || id <= 0 || title === '')
		{
			return;
		}

		if (Number(this.getDocumentId()) === id)
		{
			const changed = this.state.title !== title;
			this.state.title = title;
			this.state.titleDraft = title;
			this.editorMount.vm?.updateTitle?.(title);

			// See applyRemoteTitle: keep document.title in sync; guard the twin provider path.
			if (changed)
			{
				this.#emitDocumentRenamed(title);
			}
		}

		// Patch ancestors list — breadcrumb of a child document reflects parent renames.
		if (Array.isArray(this.state.ancestors) && this.state.ancestors.length > 0)
		{
			const next = this.state.ancestors.map((ancestor) => (
				Number(ancestor?.id) === id ? { ...ancestor, title } : ancestor
			));
			this.state.ancestors = next;
		}
	}

	#emitDocumentRenamed(title: string): void
	{
		EventEmitter.emit(NoteEvent.DOCUMENT_RENAMED, new BaseEvent({
			data: {
				id: Number(this.getDocumentId()),
				title,
				collectionId: Number(this.state.collectionId),
			},
		}));
	}

	#applyCollectionRenameFromPull(params: Object): void
	{
		const id = Number(params.collectionId);
		const name = typeof params.name === 'string' ? params.name : '';
		if (!Number.isInteger(id) || id <= 0 || name === '')
		{
			return;
		}

		if (Number(this.state.collectionId) === id)
		{
			this.state.collectionTitle = name;
		}
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

	async #handleRemoteContentOverwritten(params: Object): Promise<void>
	{
		const documentId = Number(this.getDocumentId());
		if (documentId <= 0 || Number(params?.documentId) !== documentId)
		{
			return;
		}

		const requestId = this.state.loadRequestId + 1;
		this.state.loadRequestId = requestId;

		this.providerLifecycle.destroy();

		let response = null;
		try
		{
			response = await DocumentService.loadForCollaboration({ documentId });
		}
		catch (error)
		{
			showErrorToast(extractErrorMessage(error, this.messages.loadError));
			return;
		}

		if (this.state.loadRequestId !== requestId || Number(this.getDocumentId()) !== documentId)
		{
			return;
		}

		const data = response?.data ?? {};
		const contentFormat = String(data.contentFormat ?? 'md');
		const patches = Array.isArray(data.patches) ? data.patches : [];
		const lastPatchId = data.lastPatchId ?? null;

		const documentData = {
			markdown: data.markdown ?? null,
			contentFormat,
			collaboration: { patches, lastPatchId },
		};

		this.state.content = this.resolveDocumentContent(documentData);
		this.editorMount.unmount();
		await this.nextTick();
		await this.#mountEditorWithContext(this.isEditMode());

		if (contentFormat === 'md')
		{
			// Re-runs the genesis flow: PM JSON → Y.Doc → provider.connect with patches=[].
			await this.convertAndStartCollaboration(documentData);
		}
		else
		{
			const providerData = {
				yjsState: data.yjsState ?? null,
				markdown: data.markdown ?? null,
				patches,
				lastPatchId,
			};
			await this.providerLifecycle.initialize(documentId, this.state.currentUser, providerData);
			this.providerLifecycle.startIdleTracking();
			// The editor was mounted above with provider=null (just destroyed); remount so its
			// collaboration binding (ySync/flush/pull) attaches to the freshly created provider.
			this.editorMount.unmount();
			await this.nextTick();
			await this.#mountEditorWithContext(this.isEditMode());
			if (this.providerLifecycle.provider)
			{
				this.providerLifecycle.startCompaction();
			}
		}

		// convertAndStartCollaboration always remounts with editable=false; restore UI state from state.mode.
		this.#applyEditorState();

		this.#notifyContentOverwritten();
	}

	#notifyContentOverwritten(): void
	{
		const center = BX?.UI?.Notification?.Center;
		if (center && typeof center.notify === 'function')
		{
			center.notify({
				content: BX.message('NOTE_EDITOR_CONTENT_OVERWRITTEN'),
				position: 'top-right',
				autoHideDelay: 5000,
			});
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

	async scrollToAnchor(hash: mixed): Promise<void>
	{
		const slug = String(hash ?? '').replace(/^#/, '').trim();
		if (slug === '')
		{
			return;
		}

		const editor = this.editorMount.vm?.editor;
		const editorRoot = editor?.view?.dom;
		if (!editor || !(editorRoot instanceof HTMLElement))
		{
			return;
		}

		// Reveal the target if it sits inside one or more collapsed sections.
		this.#expandAncestorsForSlug(editor, slug);

		await this.nextTick();

		// `slug` comes straight from the URL hash, so it may contain characters
		// (`"`, `]`, `\`) that make an `[id="…"]` selector throw a SyntaxError.
		// CSS.escape keeps the lookup a safe no-match instead of an exception.
		const target = editorRoot.querySelector(`#${CSS.escape(slug)}`);
		if (!(target instanceof HTMLElement))
		{
			return;
		}

		const scrollContainer = this.#findScrollContainer(target);
		if (!scrollContainer)
		{
			target.scrollIntoView({ block: 'start' });

			return;
		}

		// Extend the scrollable area only as much as needed for this specific
		// target. Documents without anchor navigation keep their natural height
		// — no permanent empty void at the bottom.
		this.#ensureRoomToScrollTargetToTop(scrollContainer, target);

		this.#alignTargetToTop(scrollContainer, target);

		// Images above the target may still load later (browser prefetch, user
		// scrolls up). Keep the target visually pinned by re-aligning inside the
		// ResizeObserver callback, which fires after layout but before paint —
		// so the heading never drifts away on screen.
		this.#keepTargetPinned(scrollContainer, target, editorRoot);
	}

	#computeReservedTop(scrollContainer: HTMLElement): { containerTop: number, reservedTop: number }
	{
		const containerRect = scrollContainer.getBoundingClientRect();

		const stickyBar = scrollContainer.querySelector('.note-page-document-actions');
		const stickyOffset = stickyBar instanceof HTMLElement
			? stickyBar.getBoundingClientRect().height
			: 0;

		const pageHeader = document.querySelector('.note-page-header');
		const headerOverlayOffset = pageHeader instanceof HTMLElement
			&& getComputedStyle(pageHeader).position === 'fixed'
			? pageHeader.getBoundingClientRect().height
			: 0;

		return {
			containerTop: containerRect.top,
			reservedTop: Math.max(containerRect.top + stickyOffset, headerOverlayOffset),
		};
	}

	#alignTargetToTop(scrollContainer: HTMLElement, target: HTMLElement): void
	{
		// Land the heading where the document title normally sits — flush against
		// the sticky page actions bar (plus the mobile fixed page header).
		const { reservedTop } = this.#computeReservedTop(scrollContainer);
		const delta = target.getBoundingClientRect().top - reservedTop;

		scrollContainer.scrollTo({
			top: scrollContainer.scrollTop + delta,
			behavior: 'auto',
		});
	}

	#ensureRoomToScrollTargetToTop(scrollContainer: HTMLElement, target: HTMLElement): void
	{
		const { reservedTop } = this.#computeReservedTop(scrollContainer);
		const desiredScrollTop = scrollContainer.scrollTop
			+ (target.getBoundingClientRect().top - reservedTop);
		const missing = desiredScrollTop + scrollContainer.clientHeight - scrollContainer.scrollHeight;
		if (missing <= 0)
		{
			return;
		}

		const docContent = scrollContainer.querySelector('.note-editor-document-content');
		if (!(docContent instanceof HTMLElement))
		{
			return;
		}

		// Pad just enough — plus a small buffer — and accumulate across repeated
		// in-document anchor jumps. The padding is inline, so it vanishes with
		// the component when the user navigates to another document.
		const current = parseFloat(docContent.style.paddingBottom) || 0;
		docContent.style.paddingBottom = `${current + missing + 16}px`;
	}

	#keepTargetPinned(scrollContainer: HTMLElement, target: HTMLElement, editorRoot: HTMLElement): void
	{
		// Cancel a previous pinning session: rapidly jumping between anchors must
		// not leave an old session that re-aligns to a stale target for up to 5s.
		this.anchorPinCleanup?.();

		let active = true;
		let timerId = null;
		const cleanups = [];

		const realign = () => {
			if (!active)
			{
				return;
			}

			// Re-align synchronously so the same paint that shows the new image
			// also shows the corrected scroll position — no visible jump.
			this.#ensureRoomToScrollTargetToTop(scrollContainer, target);
			this.#alignTargetToTop(scrollContainer, target);
		};

		// Image `load` events don't bubble, but a capture-phase listener on the
		// editor root still receives them — including from Vue NodeViews that
		// mount their <img> after the initial scroll. This is the most direct
		// signal for layout shifts caused by late-loading images above the target.
		const onLoadCapture = (event) => {
			const img = event.target;
			if (!(img instanceof HTMLImageElement))
			{
				return;
			}
			if (!(target.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_PRECEDING))
			{
				return;
			}
			realign();
		};
		editorRoot.addEventListener('load', onLoadCapture, { capture: true });
		cleanups.push(() => editorRoot.removeEventListener('load', onLoadCapture, { capture: true }));

		// ResizeObserver as a fallback for anything else that resizes the editor
		// (videos, web fonts, late NodeView mounting, …).
		const observer = new ResizeObserver(() => realign());
		observer.observe(editorRoot);
		cleanups.push(() => observer.disconnect());

		const stop = () => {
			if (!active)
			{
				return;
			}
			active = false;
			if (this.anchorPinCleanup === stop)
			{
				this.anchorPinCleanup = null;
			}
			if (timerId !== null)
			{
				clearTimeout(timerId);
				timerId = null;
			}
			cleanups.forEach((fn) => fn());
		};

		this.anchorPinCleanup = stop;

		// Stop pinning the moment the user takes scroll into their own hands.
		// Listening for input events distinguishes user gestures from passive
		// scroll anchoring that browsers may apply on their own.
		scrollContainer.addEventListener('wheel', stop, { passive: true, once: true });
		scrollContainer.addEventListener('touchstart', stop, { passive: true, once: true });
		scrollContainer.addEventListener('pointerdown', stop, { passive: true, once: true });
		document.addEventListener('keydown', stop, { passive: true, once: true });
		cleanups.push(() => {
			scrollContainer.removeEventListener('wheel', stop);
			scrollContainer.removeEventListener('touchstart', stop);
			scrollContainer.removeEventListener('pointerdown', stop);
			document.removeEventListener('keydown', stop);
		});

		timerId = setTimeout(stop, 5000);
	}

	#findScrollContainer(el: HTMLElement): HTMLElement | null
	{
		let parent = el.parentElement;
		while (parent)
		{
			const style = getComputedStyle(parent);
			const overflowY = style.overflowY;
			// Don't gate on current overflow: a short document hasn't overflowed
			// yet, but #ensureRoomToScrollTargetToTop pads it so a bottom anchor
			// can still be aligned to the top. The scrollable ancestor is defined
			// by its overflow style, not by whether it happens to overflow now.
			if (overflowY === 'auto' || overflowY === 'scroll')
			{
				return parent;
			}
			parent = parent.parentElement;
		}

		return null;
	}

	#expandAncestorsForSlug(editor: Object, slug: string): void
	{
		const entries = computeHeadingEntries(editor.state.doc);
		const targetEntry = entries.find((entry) => entry.slug === slug);
		if (!targetEntry)
		{
			return;
		}

		const targetPos = targetEntry.pos;
		const docSize = editor.state.doc.content.size;
		const positionsToExpand = [];

		for (let i = 0; i < entries.length; i++)
		{
			const entry = entries[i];
			// Plain headings (table, blockquote, callout) neither collapse anything
			// nor terminate a range — same rules the collapse mask follows (see
			// heading-anchor-plugin).
			if (!entry.collapsed || entry.plain || entry.pos >= targetPos)
			{
				continue;
			}

			let rangeEnd = docSize;
			for (let j = i + 1; j < entries.length; j++)
			{
				if (!entries[j].plain && entries[j].level <= entry.level)
				{
					rangeEnd = entries[j].pos;
					break;
				}
			}

			if (targetPos < rangeEnd)
			{
				positionsToExpand.push(entry.pos);
			}
		}

		if (positionsToExpand.length === 0)
		{
			return;
		}

		// Edit mode: expanding is a deliberate change the user is allowed to make
		// and persist. Batch every ancestor into a single transaction so the
		// decoration set and editor are reconciled once, not once per level.
		if (editor.isEditable)
		{
			const tr = editor.state.tr;
			for (const pos of positionsToExpand)
			{
				const node = tr.doc.nodeAt(pos);
				if (node && node.attrs?.collapsed)
				{
					tr.setNodeMarkup(pos, undefined, { ...node.attrs, collapsed: false });
				}
			}

			if (tr.docChanged)
			{
				editor.view.dispatch(tr);
			}

			return;
		}

		// View mode: surfacing an anchor target must NOT mutate or persist the
		// shared document. A meta-only transaction (no document steps) tells the
		// anchor plugin to drop the collapse mask locally — FlushManager never
		// sees a non-remote update, so nothing is saved for read-only viewers.
		const tr = editor.state.tr;
		tr.setMeta(headingAnchorPluginKey, { reveal: positionsToExpand });
		tr.setMeta('addToHistory', false);
		editor.view.dispatch(tr);
	}

	async enterEditMode(): Promise<void>
	{
		if (this.state.isLoading || this.state.isSaving || this.isEditMode() || !this.canEdit())
		{
			return;
		}

		if (this.#isEditingLocked())
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

		this.#applyEditorState();
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

		this.#applyEditorState();
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

			if (!this.editorMount.isMounted())
			{
				await this.#mountEditorWithContext(false);
			}
			this.#applyEditorState();
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
		showErrorToast(extractErrorMessage(error, this.messages.saveError));
		this.#applyEditorState();
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

	scheduleCapabilityRefresh({ immediate = false, silentRevoke = false }: { immediate?: boolean, silentRevoke?: boolean } = {}): void
	{
		if (this.capabilityRefreshTimer)
		{
			clearTimeout(this.capabilityRefreshTimer);
			this.capabilityRefreshTimer = null;
		}

		if (silentRevoke)
		{
			this.silentAccessRevoke = true;
		}

		// Lifecycle-driven re-checks resolve the banner-vs-redirect verdict synchronously
		// (no jitter) so a lost-access user is redirected without a recyclebin/archive flash.
		if (immediate)
		{
			void this.#fetchAndApplyCapabilities();

			return;
		}

		const delay = CAPABILITY_REFRESH_MIN_MS + Math.floor(Math.random() * CAPABILITY_REFRESH_JITTER_MS);
		this.capabilityRefreshTimer = setTimeout(() => {
			this.capabilityRefreshTimer = null;
			void this.#fetchAndApplyCapabilities();
		}, delay);
	}

	async #fetchAndApplyCapabilities(): Promise<void>
	{
		const documentId = Number(this.getDocumentId());
		if (!Number.isInteger(documentId) || documentId <= 0)
		{
			return;
		}

		try
		{
			const response = await ajax.runAction('note.infrastructure.DocumentController.getMyAccess', {
				data: { id: documentId },
			});
			const access = response?.data ?? null;
			if (!Type.isPlainObject(access))
			{
				return;
			}

			if (!access.canView)
			{
				this.#handleAccessRevoked();

				return;
			}

			// Access retained — clear any pending lifecycle suppression so a later genuine revoke toasts.
			this.silentAccessRevoke = false;

			const wasInEditMode = this.isEditMode();
			const hadEditRights = Boolean(this.state.canEdit);
			const nextCanEdit = Boolean(access.canEdit);

			this.state.canEdit = nextCanEdit;
			this.state.canEditCollection = Boolean(access.canViewCollection) && Boolean(access.canEditCollection);
			this.state.canManagePermissions = Boolean(access.canManagePermissions);
			this.state.sharedAccess = Boolean(access.sharedAccess);

			// Trash-bookkeeping refetch path: when a cascade COLLECTION_DELETE arrived without
			// a map (requestRefetch), this is how the editor learns its recycleBinId so the
			// in-place restore button is wired.
			const remoteRecycleBinId = Number(access.recycleBinId);
			this.state.recycleBinId = Number.isFinite(remoteRecycleBinId) && remoteRecycleBinId > 0
				? remoteRecycleBinId
				: null;
			this.state.trashedAt = typeof access.trashedAt === 'string' && access.trashedAt !== ''
				? access.trashedAt
				: null;
			// Without these the more-menu's «Restore» / «Delete forever» items stay hidden
			// after a push-driven mode flip — they read state.canRestore/canHardDelete imperatively.
			this.state.canRestore = Boolean(access.canRestore);
			this.state.canHardDelete = Boolean(access.canHardDelete);
			this.state.isOrphan = Boolean(access.isOrphan);
			if (Number.isInteger(Number(access.collectionId)) && Number(access.collectionId) > 0)
			{
				const previousCollectionId = Number(this.state.collectionId) || 0;
				const nextCollectionId = Number(access.collectionId);
				this.state.collectionId = nextCollectionId;
				// documentMove flips state.collectionId — re-extend pull watch on the new
				// collection so cascade/ACL pushes land on this tab.
				if (nextCollectionId !== previousCollectionId)
				{
					const provider = this.providerLifecycle.provider;
					if (provider && typeof provider.refreshCollectionWatch === 'function')
					{
						provider.collectionId = nextCollectionId;
						provider.refreshCollectionWatch();
					}
				}
			}

			// EDIT → VIEW downgrade: yank the user out of edit mode, lock the mount.
			if (hadEditRights && !nextCanEdit)
			{
				this.#handleEditDowngraded(wasInEditMode);
			}

			// VIEW → EDIT upgrade: unlock writes so the user can re-enter edit-mode via the header button.
			if (!hadEditRights && nextCanEdit)
			{
				this.#handleEditUpgraded();
			}
		}
		catch (error)
		{
			console.warn('[NOTE PULL EDITOR] capability refresh failed', documentId, error);
		}
	}

	#handleEditDowngraded(wasInEditMode: boolean): void
	{
		this.#applyEditorState();

		if (wasInEditMode)
		{
			this.#showLifecycleToast(this.messages?.editRevokedRemote);
		}
	}

	#handleEditUpgraded(): void
	{
		this.#applyEditorState();
	}

	#handleLifecycleChange(reason: string): void
	{
		if (reason === 'restored')
		{
			this.providerLifecycle.startCompaction();
			// Capabilities may have shifted while the doc was archived/trashed — refetch to settle canEdit.
			this.scheduleCapabilityRefresh();
		}
		else if (reason === 'archived' || reason === 'trashed')
		{
			this.providerLifecycle.stopCompaction();
			// Trash/archive may strip access (e.g. collection delete cascade). Re-check now:
			// access kept → stay on the recyclebin/archive banner, lost → redirect, mirroring reload.
			// The lifecycle toast already explains the removal, so the revoke path stays silent.
			this.scheduleCapabilityRefresh({ immediate: true, silentRevoke: true });
		}

		this.#applyEditorState();
	}

	#isEditingLocked(): boolean
	{
		return Boolean(this.state.isArchived)
			|| Boolean(this.state.isTrashed)
			|| Boolean(this.state.recycleBinId)
			|| !this.state.canEdit;
	}

	// Single source of truth for editor UI state — recomputed from `state`, applied to
	// the mounted Vue editor and Yjs provider. All lifecycle / ACL handlers funnel here.
	#applyEditorState(): void
	{
		const locked = this.#isEditingLocked();

		if (locked && this.state.mode === 'edit')
		{
			this.state.mode = 'view';
			this.state.titleDraft = this.state.title;
		}

		this.state.readOnly = locked;

		const editable = this.state.mode === 'edit' && !locked;
		const showToolbar = editable;

		if (this.editorMount.isMounted())
		{
			this.editorMount.setEditable(editable);
			this.editorMount.setShowToolbar(showToolbar);
		}

		const provider = this.providerLifecycle.provider;
		if (provider)
		{
			if (locked)
			{
				provider.freezeWrites();
			}
			else
			{
				provider.unfreezeWrites();
			}
		}
	}

	#showLifecycleToast(content: ?string): void
	{
		if (!Type.isStringFilled(content))
		{
			return;
		}

		const center = BX?.UI?.Notification?.Center;
		if (center && typeof center.notify === 'function')
		{
			center.notify({
				content,
				position: 'top-right',
				autoHideDelay: 4000,
			});
		}
	}

	#handleAccessRevoked(): void
	{
		this.providerLifecycle.freezeForLostAccess();
		this.state.canEdit = false;
		this.state.canEditCollection = false;
		this.state.canManagePermissions = false;
		this.#applyEditorState();
		if (!this.silentAccessRevoke)
		{
			this.#showLifecycleToast(this.messages?.accessRevokedRemote);
		}
		this.silentAccessRevoke = false;

		if (this.onAccessRevoked)
		{
			this.onAccessRevoked({ documentId: Number(this.getDocumentId()) || 0 });
		}
	}

	destroy(): void
	{
		if (this.capabilityRefreshTimer)
		{
			clearTimeout(this.capabilityRefreshTimer);
			this.capabilityRefreshTimer = null;
		}

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

		if (this.handlePullEvent)
		{
			EventEmitter.unsubscribe(NoteEvent.PULL_EVENT, this.handlePullEvent);
			this.handlePullEvent = null;
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
		scrollToAnchor: (hash) => controller.scrollToAnchor(hash),
		destroy: () => controller.destroy(),
	};
}
