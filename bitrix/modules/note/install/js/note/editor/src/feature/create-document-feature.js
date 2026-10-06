import { ajax, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { NoteEvent } from 'note.sidebar';
import { createDocumentMessages } from './messages';
import { createEmptyDocument, cloneDocumentContent } from './create-document-state';
import { normalizeCurrentUser } from '../utils/normalize';
import { getEditorSchema } from '../utils/build-schema';
import { extractErrorMessage } from '../utils/error-message';
import { crc32Utf8 } from '../utils/checksum';
import { createOperationId } from '../utils/operation-id';
import { resolveFileNodes } from '../utils/resolve-file-nodes';
import { showErrorToast } from '../utils/show-error-toast';
import { computeHeadingEntries } from '../utils/heading-slug';
import { headingAnchorPluginKey } from '../extensions/heading-anchor-plugin';
import { CollaborationStatus } from '../collaboration/collaboration-status';
import { PatchPersistence } from '../collaboration/patch-persistence';
import { ProviderLifecycle } from './provider-lifecycle';
import { EditorMount } from './editor-mount';
import { saveDocument } from './document-persistence';
import { applyImportedContent } from './import/apply-imported-content';
import { parseInternalNoteLink } from '../utils/internal-link';
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

// The server's collaboration-eligibility hint: `false` means this document was overwritten out-of-band
// and will never be collaborative again, `true` means an attempt is allowed. An absent or malformed key
// means the rule is unknown - a server without it has to keep working - so it reads as null and the
// caller falls back to the ordinary single attempt.
function readCollaborationEligibility(value: mixed): boolean | null
{
	return Type.isBoolean(value) ? value : null;
}

// Debounce window for ACL-driven capability refresh; jitter desynchronises
// reconnecting clients hitting REST after a burst of `documentCapabilities`.
const CAPABILITY_REFRESH_MIN_MS = 80;
const CAPABILITY_REFRESH_JITTER_MS = 220;

class DocumentFeatureController
{
	constructor({
		state,
		getDocumentId,
		nextTick,
		messages,
		onOpenInternalLink = null,
		onHardDelete = null,
		onAccessRevoked = null,
		onContentChange = null,
		onOpenHistory = null,
		historyEnabled = false,
		notificationsEnabled = false,
		showActivityLine = true,
	})
	{
		this.state = state;
		this.getDocumentId = getDocumentId;
		this.nextTick = nextTick;
		this.messages = messages;
		// [P8.T2/T3] Bootstrap-level UI flags. history_enabled gates the chip's history-open
		// affordance; notifications_enabled gates the subscription bell. Default off.
		this.historyEnabled = Boolean(historyEnabled);
		this.notificationsEnabled = Boolean(notificationsEnabled);
		// Embedded surfaces (the collection description) render the editor without the activity line.
		this.showActivityLine = showActivityLine !== false;
		this.onOpenInternalLink = typeof onOpenInternalLink === 'function' ? onOpenInternalLink : null;
		this.onHardDelete = typeof onHardDelete === 'function' ? onHardDelete : null;
		this.onAccessRevoked = typeof onAccessRevoked === 'function' ? onAccessRevoked : null;
		// Optional reporter of the editor's live emptiness so an embedding surface can react to
		// content becoming (non-)empty -- including remote edits -- without a mode/save/ACL flip.
		this.notifyContentEmpty = typeof onContentChange === 'function' ? onContentChange : null;
		// [P1.T5 relocation] Activity line chip lives inside DocumentEditorComponent now
		// (own createApp() instance) — bridge its "open history" click back to the page
		// component the same way onOpenInternalLink bridges mention clicks.
		this.onOpenHistory = typeof onOpenHistory === 'function' ? onOpenHistory : null;

		// Handles internal-link mention clicks (document/collection) from NodeView dispatcher.
		// NodeView dispatches by navKind: slider types open SidePanel directly;
		// internal-link types call this callback so the feature can emit open-internal-link.
		this.onMentionClick = ({ type, id, url }) => {
			void type;
			void id;

			if (!url || !this.onOpenInternalLink)
			{
				return;
			}

			const parsed = parseInternalNoteLink(url);
			if (parsed)
			{
				this.onOpenInternalLink(parsed);
			}
		};
		this.capabilityRefreshTimer = null;
		// Guards the overwrite handler against a parallel entry for the SAME document: the rebuild it
		// runs is a sequence of awaits, and a second signal landing mid-way would stand up a provider
		// next to the one the first pass is still building. Keyed by document rather than global: this
		// controller outlives SPA navigation, so a global latch held by a rebuild of the document the
		// user just left would silently drop the real overwrite of the one they just opened - and that
		// event is never sent twice.
		this.handledContentOverwriteDocumentId = 0;
		// The signal that arrived while the latch above was held. Held rather than dropped: a document
		// rebuilt back into the collaborative format can be overwritten again, so a second signal is a
		// second real change, and the server never repeats it. One slot is enough - the pass it queues
		// re-reads the document, so several signals waiting behind one rebuild describe the same state
		// by the time it runs.
		this.queuedContentOverwriteParams = null;
		// Set by the tab when it asks the server to replace the whole text itself (a version restore),
		// so the push that reports it is told apart from a rewrite that arrived from outside - see
		// expectContentOverwrite().
		this.expectedContentOverwriteOperationId = '';
		this.lastLifecycleToast = null;
		// When a lifecycle event (trash/archive) triggers the access re-check, its own toast
		// already explains the removal - suppress the redundant access-revoked toast.
		this.silentAccessRevoke = false;

		// Cleanup for the active anchor pinning session (see #keepTargetPinned).
		this.anchorPinCleanup = null;

		// Attached to the editor's `update` on every mount so local and remote content changes
		// report the current emptiness upward. Dropped automatically when the editor is destroyed.
		this.handleEditorContentChange = () => {
			this.notifyContentEmpty?.(this.#isEditorContentEmpty());
		};

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
			onGenesisRefused: (params) => this.#handleGenesisRefused(params),
			onSaveRefused: (params) => { void this.#handleSaveRefused(params); },
			onConnectionSettled: (params) => this.#settleCollaborationOutcome(Number(params?.documentId) || 0),
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

		// Patch ancestors list - breadcrumb of a child document reflects parent renames.
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

		// Shared access has no collectionId (the workspace is closed to this user), but the
		// container name is still shown — as plain text, see DocumentHeader.pathCrumbs.
		if (!this.state.sharedAccess && !this.state.collectionId)
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
			// Not "this document is not collaborative" but "the state is not ready yet" - the indicator
			// is left as it is, and the next open makes the attempt again.
			return;
		}

		// The local flag is read first and short-circuits the hint: it came from an authoritative
		// refusal, while the hint travels with a cached document and may still say `true` for a document
		// already demoted, so only its `false` adds anything. Both mean the same thing and share one
		// exit - which is what keeps every path out of here from stopping on the pre-connect status.
		const isCollaborationRefused = this.#isCollaborationUnavailable(documentId)
			|| readCollaborationEligibility(documentData?.collaboration?.canEnableCollaboration) === false;
		if (isCollaborationRefused)
		{
			this.state.collaborationUnavailableDocumentId = documentId;
			// Whatever is still queued for this document can never be sent: DocumentUpdateRepository::add
			// rejects a patch for a document that is not in a collaborative format, and the one thing that
			// brings it back - a baseline rebuilt from its own current text - is exactly what was refused
			// here. Left alone, the queue would stay in local storage forever.
			PatchPersistence.clear(documentId);
			this.state.collaborationStatus = CollaborationStatus.DISCONNECTED;
			this.#settleCollaborationOutcome(documentId);

			return;
		}

		try
		{
			await resolveFileNodes(editor, documentId);
			// Re-read after every wait: a refusal may have landed meanwhile, and the user may have left
			// and come back to a document already known not to be collaborative.
			if (this.#isCollaborationUnavailable(documentId))
			{
				return;
			}

			const json = this.editorMount.readData();
			if (!json)
			{
				// Reading the editor threw — the same dead end as the catch below, and the same reason not
				// to leave the indicator in the pre-connect status.
				this.state.collaborationStatus = CollaborationStatus.DISCONNECTED;

				return;
			}

			this.state.content = json;

			const collaboration = documentData?.collaboration ?? {};
			// This is the one place that rebuilds a baseline out of a text the server served: the markdown
			// above went through the editor and came back as the tree below. So the claim is made here, and
			// the checksum names the very string that produced it - the server weighs it against the
			// markdown it holds under the same lock it writes the baseline in, so a text replaced since the
			// response was served costs the claim nothing but its acceptance.
			const markdown = documentData?.markdown ?? null;
			const isRebuiltFromMarkdown = Type.isStringFilled(markdown);
			// The baseline is the markdown and nothing else. A document in the markdown format has an empty
			// journal by construction - the server refuses a patch for one - so a row that does arrive here
			// belongs to the text this rebuild replaces: the overwrite deleted the journal, and only the
			// narrow race in DocumentUpdateRepository::add can leave one behind it. Applying it would merge
			// the replaced text into the baseline built to replace it, which is the loop itself. Dropped for
			// the same reason the server drops them when it accepts the claim. The cursor still moves to the
			// journal head: everything below it is accounted for, exactly as the overwrite recorded.
			const genesisData = {
				patches: [],
				lastPatchId: collaboration.lastPatchId ?? null,
				// The lineage this session opens on. An accepted rebuild claim zeroes it on the server, and
				// the provider follows suit; carried here so a genesis that is not a rebuild keeps the
				// waterline the document actually has instead of reading as a lineage of unknown age.
				materializedUptoId: collaboration.materializedUptoId ?? null,
				markdown: json,
				rebuiltFromMarkdown: isRebuiltFromMarkdown,
				markdownChecksum: isRebuiltFromMarkdown ? crc32Utf8(markdown) : null,
			};
			await this.providerLifecycle.initialize(
				documentId,
				this.state.currentUser,
				genesisData,
			);
			// A provider is what everything below works on: idle tracking, the remount that binds the
			// editor to it, compaction. An attempt that ends without one - the server refused the
			// baseline, or writing it failed technically - is already torn down and reported by now, and
			// the editor mounted by the caller carries the converted content: still editable, but with
			// nowhere to save it (the finally below settles that). A half-built provider must never reach
			// the remount.
			if (!this.providerLifecycle.provider)
			{
				return;
			}
			this.providerLifecycle.startIdleTracking();
			this.editorMount.unmount();
			await this.nextTick();
			// Remount with the CURRENT mode, not a hardcoded false: genesis runs after isLoading is
			// cleared, so the user can enter edit mode while it is still in flight. Remounting
			// read-only then left state.mode = 'edit' with a read-only editor — header "Готово", no
			// toolbar, until the user toggled edit mode again.
			await this.#mountEditorWithContext(this.isEditMode());

			if (this.providerLifecycle.provider)
			{
				this.providerLifecycle.startCompaction();
			}
		}
		catch (error)
		{
			// Conversion failed — tear down without a teardown materialize (fire-and-forget).
			void this.providerLifecycle.destroy({ materialize: false });
			// The attempt is over, so the indicator has to end somewhere. The teardown leaves it in the
			// pre-connect status, which the header renders as "connecting", and nothing would move it
			// again. Unlike a refusal, a technical failure marks nothing: one lost attempt says nothing
			// about whether this document could be collaborative.
			this.state.collaborationStatus = CollaborationStatus.DISCONNECTED;
			if (!this.editorMount.vm)
			{
				await this.nextTick();
				await this.#mountEditorWithContext(false);
			}
			showErrorToast(extractErrorMessage(error, this.messages.loadError));
		}
		finally
		{
			// Convert always remounts read-only (#mountEditorWithContext(false) above), so reflect the
			// current state.mode once conversion settles: an edit session opened during the unawaited
			// reload path (applyRouteDocumentContext md branch, where `ready` -> enterEditMode races the
			// convert remount) -> editable editor, not a stuck read-only one. Idempotent for the awaited
			// caller (#handleRemoteContentOverwritten), which re-applies right after.
			this.#applyEditorState();
			this.#settleCollaborationOutcome(documentId);
		}
	}

	// The server broadcasts this event only for a document that WAS collaborative at the moment of the
	// overwrite (OverwriteDocumentContentCommand). A document rebuilt back into the collaborative format
	// can be overwritten again, so more than one event per document is possible - each one a real change,
	// and each handled. What is dropped is an event for a document this session knows cannot be
	// collaborative at all: that knowledge came from an authoritative refusal, and a document that cannot
	// hold a baseline cannot have been demoted from one.
	async #handleRemoteContentOverwritten(params: Object): Promise<void>
	{
		const documentId = Number(this.getDocumentId());
		if (documentId <= 0 || Number(params?.documentId) !== documentId)
		{
			return;
		}

		if (this.#isCollaborationUnavailable(documentId))
		{
			return;
		}

		if (this.handledContentOverwriteDocumentId === documentId)
		{
			// Kept for after the rebuild in flight, not dropped: it reports a change of its own, and the
			// server sends it once. The pass it earns runs below, once the latch is free.
			this.queuedContentOverwriteParams = params;

			return;
		}

		this.handledContentOverwriteDocumentId = documentId;
		try
		{
			await this.#rebuildAfterContentOverwritten(documentId, params);
		}
		finally
		{
			// Release only what this pass claimed: a rebuild of the previous document finishing late
			// must not free the claim of the rebuild running now.
			if (this.handledContentOverwriteDocumentId === documentId)
			{
				this.handledContentOverwriteDocumentId = 0;
			}
		}

		await this.#drainQueuedContentOverwrite();
	}

	// One pass for whatever arrived while the previous one was running. Not a loop of its own: the pass
	// goes through the handler above, so it takes the latch again and drains anything that lands during
	// it by the same route. The slot is emptied before the pass starts, so a signal it receives is a
	// signal about the state that pass reads - not the one it was waiting behind.
	async #drainQueuedContentOverwrite(): Promise<void>
	{
		const queued = this.queuedContentOverwriteParams;
		if (queued === null)
		{
			return;
		}

		this.queuedContentOverwriteParams = null;
		await this.#handleRemoteContentOverwritten(queued);
	}

	async #rebuildAfterContentOverwritten(documentId: number, params: Object): Promise<void>
	{
		// [NEW-B] PushNotificationService::sendDocumentContentOverwritten deliberately does NOT
		// exclude the initiator (unlike documentArchive/documentDelete) — an out-of-band overwrite
		// must reach even the initiator's own open tab so it rebuilds too. That means MY OWN
		// restore/overwrite arrives back at me as this same push. The rebuild below still has to
		// run (server state genuinely changed), but the "someone else changed it" toast is wrong when
		// byUserId is me — and just as wrong when the push names no author at all.
		const byUserId = Number(params?.byUserId);
		const isAuthorKnown = Number.isInteger(byUserId) && byUserId > 0;
		const isOwnAction = isAuthorKnown && byUserId === Number(this.state.currentUser?.id);

		// A rebuild puts the server's text on screen. That is right for someone reading the document and
		// destructive for someone typing into it: the overwrite deleted the journal and demoted the
		// document, so everything this session typed is already gone from the server - the editor holds
		// the only copy left, and the rebuild would be the moment it disappears. An open edit session
		// therefore keeps what it has.
		//
		// Unless this tab is the one that asked for the replacement: a version restore goes through the
		// same command and comes back as this same push, and there the old text is exactly what the user
		// chose to bring back. Told apart by the tab's own claim rather than by the author, because a
		// REST rewrite by an integration running under this very account is not this user's doing.
		// Consumed either way: a restore made outside an edit session takes the ordinary path anyway, and a
		// claim left standing for an operation already reported would be a claim on the next push.
		const wasAskedForHere = this.#consumeExpectedContentOverwrite(params?.operationId);
		if (this.isEditMode() && !wasAskedForHere)
		{
			await this.#keepLocalContentAfterOverwrite(documentId, isAuthorKnown && !isOwnAction);

			return;
		}

		const requestId = this.state.loadRequestId + 1;
		this.state.loadRequestId = requestId;

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

		// Read first, tear down second. A re-read that failed, was superseded by a newer load, or landed
		// after the user moved on leaves the editor exactly as it is, provider included: staying with the
		// current state beats dismantling the editor with nothing to put in its place.
		if (this.state.loadRequestId !== requestId || Number(this.getDocumentId()) !== documentId)
		{
			return;
		}

		const data = response?.data ?? {};
		const contentFormat = String(data.contentFormat ?? 'md');
		const patches = Array.isArray(data.patches) ? data.patches : [];
		const lastPatchId = data.lastPatchId ?? null;
		// Authoritative on this path: loadForCollaboration reads the document uncached.
		const canEnableCollaboration = readCollaborationEligibility(data.canEnableCollaboration);

		const documentData = {
			markdown: data.markdown ?? null,
			contentFormat,
			collaboration: {
				patches,
				lastPatchId,
				canEnableCollaboration,
				materializedUptoId: data.materializedUptoId ?? null,
			},
		};

		// Content was overwritten out-of-band, so the local Y.Doc is stale — do NOT materialize it back
		// over the fresh server state. Fire-and-forget; the state above is already in hand.
		//
		// Whatever the flush manager still held goes with it rather than being saved and sent. The queue
		// describes the text the overwrite replaced on every path out of here, not only on the two that
		// clear local storage below: it is refused while the document is out of the collaborative format
		// and taken the moment somebody rebuilds it onto the new text, and being taken is the worse of the
		// two - that is the replaced text merging back in.
		void this.providerLifecycle.destroy({ materialize: false, discardPending: true });

		// The editor app (which hosts the activity-line chip) is unmounted+remounted below, so its
		// live `content_changed` update is lost — refresh the bootstrap prop from this reload's
		// fresh lastChange, or the chip would revert to the pre-overwrite time (same normalization
		// as applyLoadedDocument).
		this.state.lastChange = Type.isPlainObject(data.lastChange) ? data.lastChange : null;
		// createdAt is immutable; only adopt a fresh value if the reload actually carried one,
		// otherwise keep the bootstrap value so the remounted chip's fallback stays correct.
		if (typeof data.createdAt === 'string' && data.createdAt !== '')
		{
			this.state.createdAt = data.createdAt;
		}
		this.state.content = this.resolveDocumentContent(documentData);
		this.editorMount.unmount();
		await this.nextTick();
		await this.#mountEditorWithContext(this.isEditMode());

		if (canEnableCollaboration === false)
		{
			this.state.collaborationUnavailableDocumentId = documentId;
			// Nothing still queued for this document can ever be sent: DocumentUpdateRepository::add
			// rejects a patch for a document that is no longer in a collaborative format. Left alone, the
			// queue would stay in local storage forever, unappliable at any future open.
			PatchPersistence.clear(documentId);
			this.state.collaborationStatus = CollaborationStatus.DISCONNECTED;
		}
		else if (contentFormat === 'md')
		{
			// The ordinary end of an overwrite for a session that was only reading: the document comes back
			// as plain markdown, and the genesis flow puts it back into the collaborative format on the new
			// text - PM JSON -> Y.Doc -> provider.connect with patches=[]. The baseline is a rebuild of the
			// text this very response carried, which is the claim the server accepts it under.
			await this.convertAndStartCollaboration(documentData);
		}
		else
		{
			// The document is collaborative again on a journal somebody has already rebuilt, and that is
			// the one state in which the queue left in local storage would be ACCEPTED - putting the
			// replaced text back into the text that replaced it. Emptied before the provider connects,
			// because connecting is what sends it.
			PatchPersistence.clear(documentId);
			const providerData = {
				yjsState: data.yjsState ?? null,
				markdown: data.markdown ?? null,
				patches,
				lastPatchId,
				materializedUptoId: data.materializedUptoId ?? null,
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

		// The yjs branch mounts with isEditMode() but still needs readOnly/toolbar/provider synced here;
		// for the md branch convertAndStartCollaboration already restored state from state.mode -> this is
		// an idempotent re-apply. All three branches above end an attempt, so the outcome is settled here
		// once instead of in each of them.
		this.#applyEditorState();
		this.#settleCollaborationOutcome(documentId);

		// One toast per handled event, and only when the overwrite has a named author who is not me: a
		// push without an author says nothing about who to point at.
		if (isAuthorKnown && !isOwnAction)
		{
			this.#notifyContentOverwritten();
		}
	}

	// Detaches an open edit session from a document that has been overwritten out of band: the provider
	// goes, the text stays. The Y.Doc dies with the provider (PushPullYjsProvider.destroy), so the editor
	// cannot keep its collaborative binding - it is remounted from a snapshot of what it shows right now,
	// plain and unconnected. Nothing is materialized on the way out: the local document is a fork of a
	// text the server has already replaced, and writing it back would overwrite the change that just
	// arrived. The document is not re-read either, which is the point - a re-read is what would bring the
	// replacing text here. The activity chip therefore keeps the time it was mounted with; the toast, not
	// the chip, is what tells the user the document has moved on without them.
	async #keepLocalContentAfterOverwrite(documentId: number, isForeignAuthor: boolean): Promise<void>
	{
		// Read before anything is torn down: this snapshot is the user's work. A read that fails leaves
		// the content as it was loaded - worse than the snapshot, but the remount below is not optional:
		// the editor cannot stay bound to a Y.Doc that is about to be destroyed.
		const rescued = this.editorMount.readData();
		// Where the caret was, for the same reason. The node holding it is about to be destroyed, and the
		// browser has nowhere to put focus but the body - which is the one place from which the text this
		// method just rescued cannot be selected or copied without reaching for the mouse.
		const caret = this.#readCaretPosition();

		// Whatever the flush manager still held describes the text the overwrite replaced, so it must not
		// travel to the server at all: DocumentUpdateRepository::add rejects it while the document is out
		// of the collaborative format, and the moment somebody rebuilds the document onto the new text it
		// would be accepted - merging the replaced text back in. Dropped on the way out for both reasons.
		void this.providerLifecycle.destroy({ materialize: false, discardPending: true });
		PatchPersistence.clear(documentId);
		this.state.collaborationStatus = CollaborationStatus.DISCONNECTED;
		// Before the awaits below, not after: the remount takes frames, and a press of Done inside them
		// would find saving still open and close the session without a word.
		this.#settleCollaborationOutcome(
			documentId,
			isForeignAuthor ? this.messages?.contentOverwrittenKept : null,
		);

		if (rescued)
		{
			this.state.content = rescued;
		}
		this.editorMount.unmount();
		await this.nextTick();
		// A navigation may have started while the tick resolved. Mounting here would then paint the text
		// of the document being left over the one being opened, and the navigation would mount again.
		if (Number(this.getDocumentId()) !== documentId)
		{
			return;
		}

		await this.#mountEditorWithContext(this.isEditMode());
		this.#applyEditorState();
		this.#restoreCaretPosition(caret);
	}

	// Null unless the caret was inside the editor body: focus that was somewhere else (the title, a
	// dialog, nothing at all) is not ours to move.
	#readCaretPosition(): ?number
	{
		const editor = this.editorMount.vm?.editor;
		if (!editor?.isFocused)
		{
			return null;
		}

		const position = editor.state?.selection?.from;

		return Number.isInteger(position) ? position : null;
	}

	#restoreCaretPosition(position: ?number): void
	{
		if (position === null)
		{
			return;
		}

		const editor = this.editorMount.vm?.editor;
		if (typeof editor?.commands?.focus !== 'function')
		{
			return;
		}

		// The rescued text is the same document, so the offset still points where it pointed - but it is
		// clamped by the editor anyway, and a mount that produced no editor simply leaves focus alone.
		editor.commands.focus(position);
	}

	// A patch came back refused: the document was taken out of the collaborative format while this session
	// was typing into it, and the queue that carried the text is gone with the refusal. The situation is
	// the same one the overwrite push describes, and it is handled the same way - the text on screen is
	// kept and saving closes - the difference being only which of the two arrives first. Whichever does,
	// the other finds the claim taken and stays out.
	//
	// The push is the ordinary path and this is the backstop: a session that never received it (pull down,
	// tab asleep, the push lost) otherwise learns nothing and goes on typing into a document that keeps
	// nothing.
	async #handleSaveRefused(params: Object): Promise<void>
	{
		const documentId = Number(this.getDocumentId());
		if (documentId <= 0 || Number(params?.documentId) !== documentId)
		{
			return;
		}

		if (this.handledContentOverwriteDocumentId === documentId)
		{
			return;
		}

		// Saving has already ended for this document, with the user told once. A second refusal - the next
		// queued patch, a persisted one sent on reconnect - says nothing new.
		if (this.#hasNoPersistencePath())
		{
			return;
		}

		this.handledContentOverwriteDocumentId = documentId;
		try
		{
			// Someone reading has nothing queued and nothing to rescue, so there is nothing to keep: the
			// provider goes and the outcome is settled without a word (a reader is told nothing - see
			// #settleCollaborationOutcome). The refusal came from a patch, so this is the rare case of a
			// session that left edit mode while its last patch was still in the air.
			if (!this.isEditMode())
			{
				void this.providerLifecycle.destroy({ materialize: false, discardPending: true });
				PatchPersistence.clear(documentId);
				this.state.collaborationStatus = CollaborationStatus.DISCONNECTED;
				this.#settleCollaborationOutcome(documentId);

				return;
			}

			// The author of the replacement is not known here - a refusal carries no author - so the notice
			// is the general one about saving being closed rather than the one naming someone else's change.
			await this.#keepLocalContentAfterOverwrite(documentId, false);
		}
		finally
		{
			if (this.handledContentOverwriteDocumentId === documentId)
			{
				this.handledContentOverwriteDocumentId = 0;
			}
		}

		// This path holds the same latch, so a push that arrived under it is waiting in the same slot.
		await this.#drainQueuedContentOverwrite();
	}

	// Claimed by the tab before it asks the server for a replacement of the whole text (a version
	// restore), and consumed by the push that reports THAT replacement. One-shot: an attempt that failed
	// releases it (cancelExpectedContentOverwrite), and reading the document again drops it
	// (applyLoadedDocument), so it cannot outlive the session it was made in.
	//
	// The claim is the identifier of the operation, and the caller has to carry it into the request: the
	// document number would not do. A rewrite from outside can land on the same document while the restore
	// is still in flight - the push travels faster than the answer to the request that caused it - and a
	// claim naming only the document would spend itself on that foreign write, applying somebody else's
	// text over an open edit session. Named, the tab recognises its own operation and treats every other
	// as what it is.
	//
	// Only a collaborative document is worth claiming: OverwriteDocumentContentCommand sends the push
	// for a document it demotes, and nothing is demoted when the text was plain markdown already. A claim
	// made there would find no push to spend itself on.
	//
	// @return the identifier to send with the request, or null when there is nothing to claim.
	expectContentOverwrite(): ?string
	{
		if (!this.providerLifecycle.provider)
		{
			return null;
		}

		this.expectedContentOverwriteOperationId = createOperationId();

		return this.expectedContentOverwriteOperationId;
	}

	cancelExpectedContentOverwrite(): void
	{
		this.expectedContentOverwriteOperationId = '';
	}

	// Spent only by the push that names the same operation. A push naming another, or naming none at all -
	// which is every REST overwrite - is somebody else's write and leaves the claim where it is: the
	// restore it belongs to has its own push still coming.
	#consumeExpectedContentOverwrite(operationId: mixed): boolean
	{
		const claimed = String(this.expectedContentOverwriteOperationId || '');
		if (claimed === '' || String(operationId ?? '') !== claimed)
		{
			return false;
		}

		this.expectedContentOverwriteOperationId = '';

		return true;
	}

	// The server refused to write a collaborative baseline. This session offered the one baseline the
	// server accepts for a document taken out of the collaborative format - a rebuild of its own current
	// text - and was still refused, so every further attempt from here would be refused the same way.
	// Unlike an incoming overwrite, nothing about the content changed - only our attempt to raise
	// collaboration failed. So the document is not re-read, no provider is built again, and the user is
	// told nothing here: the text on screen is the server's own and current. What it can no longer do is
	// travel back to the server - see #settleCollaborationOutcome, called by every path that ends an
	// attempt.
	#handleGenesisRefused(params: Object): void
	{
		const documentId = Number(this.getDocumentId());
		if (documentId <= 0 || Number(params?.documentId) !== documentId)
		{
			return;
		}

		this.state.collaborationUnavailableDocumentId = documentId;

		// Push teardown: the provider never connected, and its local Y.Doc must not be materialized over
		// the server's markdown. State reset runs synchronously inside destroy(), so the terminal status
		// set below still wins (same ordering as ProviderLifecycle.handleConnectError).
		// Pending updates go with it: the refusal is final, and the server rejects every patch for a
		// document that is not collaborative - a send would only put the queue back into local storage.
		void this.providerLifecycle.destroy({ materialize: false, discardPending: true });
		PatchPersistence.clear(documentId);
		this.state.collaborationStatus = CollaborationStatus.DISCONNECTED;
	}

	#isCollaborationUnavailable(documentId: number): boolean
	{
		return documentId > 0 && Number(this.state.collaborationUnavailableDocumentId) === documentId;
	}

	// Called by every path that ENDS an attempt to stand up collaborative editing - accepted, refused,
	// failed technically or torn down. The outcome answers a question beyond the indicator: a document
	// left without a provider has no path that persists text - the server rejects a patch for a document
	// that is not collaborative, finishEdit materializes through the provider that is not there, and no
	// ordinary save exists. A LIVE provider that merely lost its connection or went to sleep on idle is
	// the opposite case: what is typed waits in the local queue and leaves with the next connection.
	// Hence the test is the provider, not the indicator - the offline label is shown for both.
	//
	// What follows from it is that SAVING is over, not editing. The text already typed is the user's own
	// work and the only copy of it left, so the session stays open and the body editable: it is there to
	// be read, selected and carried somewhere else. Only the ways back to the server close - the Done
	// button (finishEdit), and an import that would replace the body with something else.
	//
	// A reload fixes the document but not the work: reopening the page rebuilds the collaborative format on
	// the server's text (CollaborationEligibility), and a connection that simply failed to come up comes up
	// again - but in both cases what is on screen right now is replaced by what the server holds. Hence the
	// wording: copy the text BEFORE reloading.
	#settleCollaborationOutcome(documentId: number, toast: ?string = null): void
	{
		if (!Number.isInteger(documentId) || documentId <= 0 || Number(this.getDocumentId()) !== documentId)
		{
			return;
		}

		if (this.providerLifecycle.provider)
		{
			// The flag holds one document at a time, so a provider standing for the one open now makes
			// whatever it held stale - the tab moved on to a document that persists text.
			this.state.collaborationSettledWithoutProviderDocumentId = 0;

			return;
		}

		// Already settled: stay silent. A second pass over the same outcome must not say the same thing
		// to the user twice.
		if (Number(this.state.collaborationSettledWithoutProviderDocumentId) === documentId)
		{
			return;
		}

		this.state.collaborationSettledWithoutProviderDocumentId = documentId;
		// Only someone who is mid-edit has anything to lose and anything to do about it. A reader has no
		// unsaved work and nothing to carry anywhere, so a notice would interrupt reading and ask for
		// nothing in return.
		if (this.isEditMode())
		{
			this.#showLifecycleToast(toast ?? this.messages?.saveBlocked);
		}
	}

	#hasNoPersistencePath(): boolean
	{
		const documentId = Number(this.getDocumentId());

		return documentId > 0
			&& Number(this.state.collaborationSettledWithoutProviderDocumentId) === documentId;
	}

	// Why saving is unavailable, or null when it is available. Reported outward so the surface that owns
	// the Done button can block it and say why: a button that finishes an edit session without saving it
	// would throw the text away silently.
	saveBlockedReason(): ?string
	{
		return this.#hasNoPersistencePath() ? (this.messages?.saveBlocked ?? null) : null;
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
		// A document read anew is a new baseline: an unspent claim from before it belongs to a text that
		// is no longer on screen.
		this.expectedContentOverwriteOperationId = '';
		this.state.collectionId = Number(documentData.collectionId || 0);
		this.state.collectionTitle = String(documentData.collectionTitle || '');
		this.state.ancestors = Array.isArray(documentData.ancestors) ? documentData.ancestors : [];
		this.state.canEdit = Boolean(documentData.canEdit);
		this.state.canEditCollection = Boolean(documentData.canEditCollection);
		this.state.canManagePermissions = Boolean(documentData.canManagePermissions);
		this.state.isMain = Boolean(documentData.isMain);
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
		// [#6] Base snapshot for the views widget — null falls back to its own getViews call.
		this.state.initialViews = Type.isPlainObject(documentData.views) ? documentData.views : null;
		// [DTO-01] Backlinks counter for the chip of incoming links. A payload without the key (an
		// older answer, or the feature switched off) stays null — the widget then reads the count
		// itself and gets a neutral zero, which renders no chip at all.
		this.state.initialBacklinks = Type.isPlainObject(documentData.backlinks) ? documentData.backlinks : null;
		// [#2] Bootstrap snapshot for the activity-line chip — already normalized upstream in
		// note.app's route-document-resolver.js (or null if the backend has nothing to report yet).
		this.state.lastChange = Type.isPlainObject(documentData.lastChange) ? documentData.lastChange : null;
		// [P8.T5] ISO creation timestamp — spread from the resolver payload (route-document-resolver's
		// ...row). Used for the chip's "Created …" fallback when there is no last-change info.
		this.state.createdAt = typeof documentData.createdAt === 'string' && documentData.createdAt !== ''
			? documentData.createdAt
			: null;
		// Bell state — null falls back to the bell's own getState call on mount.
		this.state.initialSubscription = Type.isPlainObject(documentData.subscription) ? documentData.subscription : null;
		// [TPL-01] Star state - bundled next to the bell. A payload without the key (an older answer)
		// stays null, which leaves the star exactly as it behaved before: sidebar store only.
		this.state.initialFavorite = typeof documentData.isFavorite === 'boolean' ? documentData.isFavorite : null;
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

	async resetStateBeforeLoad(): Promise<void>
	{
		// Loader goes up synchronously, before the teardown is awaited: the teardown hands its final
		// markdown off without waiting for the network, but it still resolves a tick later, and nothing
		// in between should render the outgoing document as if it were still live.
		this.state.isLoading = true;
		await this.providerLifecycle.destroy();
		this.state.isSaving = false;
		this.state.mode = 'view';
		this.state.collectionTitle = '';
		this.state.ancestors = [];
		this.state.canEdit = false;
		this.state.canEditCollection = false;
		this.state.canManagePermissions = false;
		this.state.isMain = false;
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
		this.state.initialViews = null;
		this.state.initialBacklinks = null;
		this.state.lastChange = null;
		this.state.createdAt = null;
		this.state.initialSubscription = null;
		this.state.initialFavorite = null;
		this.editorMount.unmount();
	}

	async applyRouteDocumentContext(routeContext: mixed): Promise<void>
	{
		const status = String(routeContext?.status || '');
		if (status === 'loading')
		{
			// Loader and request-id bump go first, synchronously (ALG-F4): the id has to be claimed
			// before anything below is awaited, or a newer navigation could claim it first.
			this.state.loadRequestId += 1;
			const loadingRequestId = this.state.loadRequestId;
			this.state.isLoading = true;
			// Drop previous doc identity so the header renders the loader in place of the stale title.
			this.state.title = '';
			this.state.titleDraft = '';
			this.state.collectionId = 0;
			this.state.collectionTitle = '';
			this.state.ancestors = [];
			this.state.isArchived = false;
			await this.providerLifecycle.destroy();

			// The teardown is awaited, and this method runs from a Vue watcher that nobody awaits, so it
			// can outlive its own navigation: with A -> B -> C in quick succession, C may claim the
			// request id while B is still suspended here. Painting B's preview then would overwrite the
			// live document.
			if (this.state.loadRequestId !== loadingRequestId)
			{
				return;
			}

			this.applyDocumentPreview(routeContext?.preview);

			return;
		}

		const currentRequestId = this.state.loadRequestId + 1;
		this.state.loadRequestId = currentRequestId;
		await this.resetStateBeforeLoad();

		// Same race as above: the reset is awaited, so a newer navigation can have taken over while it ran.
		if (this.state.loadRequestId !== currentRequestId)
		{
			return;
		}

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
					// Without this the ordinary open would adopt an unknown waterline, and the queue any
					// earlier session left behind would be weighed against it - a queue stored under a real
					// waterline against a document that reads as having none. That is the shape of a false
					// accusation: text nobody overwrote, dropped on the next open.
					materializedUptoId: collaboration.materializedUptoId ?? null,
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

			// Md genesis remounts the editor, so it must run BEFORE entering edit mode: otherwise the
			// toolbar flashes in and vanishes right after a drag-and-drop import. The remount itself
			// now carries the current mode over (see convertAndStartCollaboration), so a mode entered
			// while genesis is in flight survives it.
			if (isMdFormat)
			{
				await this.convertAndStartCollaboration(routeContext.document);
				if (currentRequestId !== this.state.loadRequestId)
				{
					return;
				}
			}

			// Both branches above have finished their attempt by now: the yjs one awaited initialize, the
			// md one awaited the conversion. Settled before the auto-edit below rather than after, so a
			// session opened here finds the Done button already carrying the reason instead of learning
			// it a tick later.
			this.#settleCollaborationOutcome(Number(this.getDocumentId()));

			if (shouldAutoEdit && this.canEdit())
			{
				// A new document is named first: the title owns the focus here, so edit mode must not
				// grab the body (see enterEditMode's focusContent).
				await this.enterEditMode({ focusContent: false });
				await this.nextTick();
				this.editorMount.focusTitleAndSelectAll();
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
		// (`"`, `]`, `\`) that make an `[id="..."]` selector throw a SyntaxError.
		// CSS.escape keeps the lookup a safe no-match instead of an exception.
		const target = editorRoot.querySelector(`#${CSS.escape(slug)}`);
		if (!(target instanceof HTMLElement))
		{
			return;
		}

		// Desktop: a bounded overflow:auto element (.content) is the scrollport. Mobile: the page
		// scrolls the native viewport, so #findScrollContainer returns null and we align the viewport
		// scroller instead. Both paths reuse the same room/align/pin logic so the heading lands under
		// the sticky actions bar / fixed mobile header (reservedTop), not at raw viewport top 0.
		const scroller = this.#findScrollContainer(target) ?? (document.scrollingElement || document.documentElement);
		if (!(scroller instanceof HTMLElement))
		{
			target.scrollIntoView({ block: 'start', behavior: this.#getAnchorScrollBehavior() });

			return;
		}

		// Extend the scrollable area only as much as needed for this specific
		// target. Documents without anchor navigation keep their natural height
		// - no permanent empty void at the bottom.
		this.#ensureRoomToScrollTargetToTop(scroller, target);

		// Initial alignment is smooth (unless the user prefers reduced motion);
		// every later `realign` inside #keepTargetPinned stays 'auto' - see there.
		this.#alignTargetToTop(scroller, target, this.#getAnchorScrollBehavior());

		// Images above the target may still load later (browser prefetch, user
		// scrolls up). Keep the target visually pinned by re-aligning inside the
		// ResizeObserver callback, which fires after layout but before paint -
		// so the heading never drifts away on screen.
		this.#keepTargetPinned(scroller, target, editorRoot);
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

	#getAnchorScrollBehavior(): 'smooth' | 'auto'
	{
		const prefersReducedMotion = typeof window.matchMedia === 'function'
			&& window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		return prefersReducedMotion ? 'auto' : 'smooth';
	}

	#alignTargetToTop(scrollContainer: HTMLElement, target: HTMLElement, behavior: 'smooth' | 'auto' = 'auto'): void
	{
		// Land the heading where the document title normally sits - flush against
		// the sticky page actions bar (plus the mobile fixed page header).
		const { reservedTop } = this.#computeReservedTop(scrollContainer);
		const delta = target.getBoundingClientRect().top - reservedTop;

		scrollContainer.scrollTo({
			top: scrollContainer.scrollTop + delta,
			behavior,
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

		// Pad just enough - plus a small buffer - and accumulate across repeated
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
			// also shows the corrected scroll position - no visible jump.
			this.#ensureRoomToScrollTargetToTop(scrollContainer, target);
			this.#alignTargetToTop(scrollContainer, target);
		};

		// Image `load` events don't bubble, but a capture-phase listener on the
		// editor root still receives them - including from Vue NodeViews that
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
		// (videos, web fonts, late NodeView mounting, ...).
		// ResizeObserver always fires once on observe() with the current size (no real change);
		// that spurious 'auto' realign would clobber the smooth scroll scrollToAnchor just started.
		let skipInitialResize = true;
		const observer = new ResizeObserver(() => {
			if (skipInitialResize)
			{
				skipInitialResize = false;

				return;
			}
			realign();
		});
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
				// On mobile the height chain is `height:auto` and the page scrolls the native
				// viewport, yet <body> still computes overflow-y:auto (mobile.css's overflow-x:hidden
				// coerces overflow-y to auto). Such a match isn't a real inner scrollport -
				// body.scrollTo() is a no-op - so treat it as "use the window" (return null; the
				// caller falls back to the viewport scroller).
				if (parent === document.body || parent === document.documentElement)
				{
					return null;
				}

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
			// nor terminate a range - same rules the collapse mask follows (see
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
		// anchor plugin to drop the collapse mask locally - FlushManager never
		// sees a non-remote update, so nothing is saved for read-only viewers.
		const tr = editor.state.tr;
		tr.setMeta(headingAnchorPluginKey, { reveal: positionsToExpand });
		tr.setMeta('addToHistory', false);
		editor.view.dispatch(tr);
	}

	/**
	 * `focusContent: false` keeps the caret where the caller wants it. Needed by the autoEdit path
	 * of a freshly created document, whose focus target is the title, not the body: tiptap's focus
	 * command lands through requestAnimationFrame, so a body focus started here would win a frame
	 * AFTER focusTitleAndSelectAll() and steal the title away.
	 */
	async enterEditMode({ focusContent = true }: { focusContent?: boolean } = {}): Promise<void>
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
		this.providerLifecycle.setMode('edit');

		if (!this.editorMount.isMounted())
		{
			await this.#mountEditorWithContext(true);
			if (focusContent)
			{
				await this.#focusEditorContent();
			}

			return;
		}

		this.#applyEditorState();
		if (focusContent)
		{
			await this.#focusEditorContent();
		}
	}

	async #focusEditorContent(): Promise<void>
	{
		// A11Y (WCAG 2.4.3 Focus Order): entering edit mode must move focus into the editor.
		// The edit-trigger button unmounts on the mode flip, so without this focus falls back to
		// <body>.
		await this.nextTick();
		const editor = this.editorMount.vm?.editor;
		if (!editor?.commands?.focus)
		{
			return;
		}

		// The caret lands where the reader is, and the view is left where it stands. Sent to the start
		// of the document it took the page with it - TipTap brings the caret into view - so pressing
		// "edit" halfway down a document threw the reader back to its beginning.
		editor.commands.focus(this.#firstVisiblePosition(editor) ?? 'start', { scrollIntoView: false });
	}

	// Position in the document under the top of what is on screen, or null when that cannot be resolved
	// (a document shorter than the viewport, coordinates outside the editor).
	#firstVisiblePosition(editor: Object): number | null
	{
		const dom = editor?.view?.dom;
		if (!(dom instanceof HTMLElement))
		{
			return null;
		}

		const scroller = this.#findScrollContainer(dom) ?? (document.scrollingElement || document.documentElement);
		if (!(scroller instanceof HTMLElement))
		{
			return null;
		}

		// Same reserved top the anchor navigation aligns to: what the sticky actions bar and the fixed
		// mobile header cover is not on screen, whatever the scroll position says.
		const { reservedTop } = this.#computeReservedTop(scroller);
		const box = dom.getBoundingClientRect();
		const found = editor.view.posAtCoords({
			left: box.left + (box.width / 2),
			top: Math.max(reservedTop, box.top) + 1,
		});

		return found ? found.pos : null;
	}

	#isEditorContentEmpty(): boolean
	{
		const editor = this.editorMount.vm?.editor;

		return editor ? Boolean(editor.isEmpty) : true;
	}

	async finishEdit(): Promise<void>
	{
		if (!this.isEditMode() || this.state.isSaving)
		{
			return;
		}

		// Enforced here rather than in the surface that owns the button, so every surface obeys it - the
		// document page and the embedded description share this controller but not that button. Leaving
		// edit mode would drop everything typed without a word: materialize below has no provider to go
		// through, and there is no ordinary save. So the session stays open, and the press is answered
		// with the reason instead of silence.
		if (this.#hasNoPersistencePath())
		{
			this.#showLifecycleToast(this.messages?.saveBlocked);

			return;
		}

		if (this.providerLifecycle.provider)
		{
			this.providerLifecycle.provider.clearCursor();
		}

		// Leaving edit mode is a work boundary: materialize now, so that a user who types, presses Done
		// and walks away does not leave the text sitting in the journal until the next compaction tick.
		this.providerLifecycle.materialize();

		this.state.mode = 'view';
		this.state.titleDraft = this.state.title;
		this.providerLifecycle.setMode('view');

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

	// Replaces the entire document content from a user-picked `.md` file. Gate duplicates the
	// menu-item visibility check (defence in depth) and guarantees edit mode is entered before
	// resolving the editor instance, since entering edit mode may remount it.
	async importMarkdown(file: File): Promise<{ degraded: boolean, droppedCount: number }>
	{
		// The no-persistence case is refused here even though editing itself is not: an import replaces
		// the whole body at once, so it would destroy the very text the open session exists to let the
		// user copy out - and put in its place content that can never be saved.
		if (this.#isEditingLocked() || this.#hasNoPersistencePath())
		{
			throw new Error('Document is not editable');
		}

		if (!this.isEditMode())
		{
			await this.enterEditMode();
		}

		const editor = this.editorMount.vm?.editor;
		if (!editor)
		{
			throw new Error('Editor is not mounted');
		}

		return applyImportedContent(editor, file);
	}

	async saveDocumentAction(): Promise<void>
	{
		if (!this.isEditMode() || this.state.isSaving || this.state.isLoading || !this.canEdit())
		{
			return;
		}

		// The only path that writes a whole body. Nothing calls it today and the server action does not
		// bind the content fields, but if it is ever revived it must not carry a local fork of a text the
		// server has already replaced.
		if (this.#hasNoPersistencePath())
		{
			this.#showLifecycleToast(this.messages?.saveBlocked);

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
			// Silently ignore - the title in the editor stays as typed
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

			// Access retained - clear any pending lifecycle suppression so a later genuine revoke toasts.
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
			// Without these the more-menu's "Restore" / "Delete forever" items stay hidden
			// after a push-driven mode flip - they read state.canRestore/canHardDelete imperatively.
			this.state.canRestore = Boolean(access.canRestore);
			this.state.canHardDelete = Boolean(access.canHardDelete);
			this.state.isOrphan = Boolean(access.isOrphan);
			if (Number.isInteger(Number(access.collectionId)) && Number(access.collectionId) > 0)
			{
				const previousCollectionId = Number(this.state.collectionId) || 0;
				const nextCollectionId = Number(access.collectionId);
				this.state.collectionId = nextCollectionId;
				// documentMove flips state.collectionId - re-extend pull watch on the new
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

			// EDIT -> VIEW downgrade: yank the user out of edit mode, lock the mount.
			if (hadEditRights && !nextCanEdit)
			{
				this.#handleEditDowngraded(wasInEditMode);
			}

			// VIEW -> EDIT upgrade: unlock writes so the user can re-enter edit-mode via the header button.
			if (!hadEditRights && nextCanEdit)
			{
				this.#handleEditUpgraded();
			}
		}
		catch
		{
			// Non-critical: background capability refresh failed; retried on the next tick.
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
			// Capabilities may have shifted while the doc was archived/trashed - refetch to settle canEdit.
			this.scheduleCapabilityRefresh();
		}
		else if (reason === 'archived' || reason === 'trashed')
		{
			this.providerLifecycle.stopCompaction();
			// Trash/archive may strip access (e.g. collection delete cascade). Re-check now:
			// access kept -> stay on the recyclebin/archive banner, lost -> redirect, mirroring reload.
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

	// Single source of truth for editor UI state - recomputed from `state`, applied to
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

		// Presence action reflects the real editable state (a lock forces 'view' even if mode is edit).
		this.providerLifecycle.setMode(editable ? 'edit' : 'view');
	}

	// [P1.T5 restore flow, SDD 455-468] Exposes the periodic auto-compact path (see
	// provider-lifecycle.js#startCompaction / compact-manager.js) for an on-demand call —
	// the client always compacts the pending patch window right before a version restore.
	async compactBeforeRestore(): Promise<void>
	{
		const provider = this.providerLifecycle.provider;
		if (!provider)
		{
			return;
		}

		await provider.compact(() => this.editorMount.readMarkdown());
	}

	// [#11/NEW-A rework] Bridges document-page.js's version-preview flow into the isolated
	// editor Vue app (EditorMount) — the caller (document-page.js) owns fetching the version
	// markdown (HistoryApi.getVersion) and the restore/compact/409-retry flow (SDD P1.T2); this
	// controller only pushes the resulting state across the createApp() boundary.
	showVersionPreview({ loading = false, markdown = null, meta = null, error = false, highlight = null, baseMarkdown = null }: {
		loading?: boolean,
		markdown?: string | null,
		meta?: Object | null,
		error?: boolean,
		highlight?: boolean | null,
		baseMarkdown?: string | null,
	} = {}): void
	{
		this.editorMount.setPreview({ loading, markdown, meta, error, highlight, baseMarkdown });
	}

	hideVersionPreview(): void
	{
		this.editorMount.clearPreview();
	}

	scrollToParticipant(userId: number): void
	{
		const id = Number(userId);
		if (!Number.isFinite(id) || id <= 0)
		{
			return;
		}

		const root = document.getElementById(this.state.editorMountId) ?? document;
		const caret = root.querySelector(`.collaboration-cursor__caret[data-user-id="${id}"]`);
		if (caret)
		{
			caret.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	// Reading time rather than one fixed window: the longest of these messages runs to 27 words, and four
	// seconds is about twice as fast as unhurried Russian reading - and for that one it is the only place
	// it is ever said. The floor keeps the short ones exactly as they were; the ceiling keeps even the
	// longest from outstaying a reader who has already moved on.
	#lifecycleToastDelay(content: string): number
	{
		const words = content.trim().split(/\s+/).length;

		return Math.min(9000, Math.max(4000, words * 400));
	}

	#showLifecycleToast(content: ?string): void
	{
		if (!Type.isStringFilled(content))
		{
			return;
		}

		const center = BX?.UI?.Notification?.Center;
		if (!center || typeof center.notify !== 'function')
		{
			return;
		}

		// A blocked Done button stays pressable on purpose, so the same question can be asked again and
		// again. While the answer is still on screen, repeating it adds nothing: what a second balloon
		// would give is a growing stack of identical sentences, not a second answer.
		const now = Date.now();
		if (this.lastLifecycleToast?.content === content && this.lastLifecycleToast.until > now)
		{
			return;
		}

		const autoHideDelay = this.#lifecycleToastDelay(content);
		this.lastLifecycleToast = { content, until: now + autoHideDelay };
		center.notify({
			content,
			position: 'top-right',
			autoHideDelay,
		});
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

		// Component unmount can't await; teardown materialize is best-effort here (Vue beforeUnmount).
		void this.providerLifecycle.destroy();
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
		const mounted = await this.editorMount.mount(editable, {
			provider: this.providerLifecycle.provider,
			currentUser: this.state.currentUser,
			readOnly: this.state.readOnly,
			title: this.state.title,
			initialViews: this.state.initialViews,
			initialBacklinks: this.state.initialBacklinks,
			lastChange: this.state.lastChange,
			createdAt: this.state.createdAt,
			initialSubscription: this.state.initialSubscription,
			initialFavorite: this.state.initialFavorite,
			historyEnabled: this.historyEnabled,
			notificationsEnabled: this.notificationsEnabled,
			showActivityLine: this.showActivityLine,
			onRenameTitle: this.handleTitleRename,
			onOpenInternalLink: this.onOpenInternalLink,
			onMentionClick: this.onMentionClick,
			onOpenHistory: this.onOpenHistory,
		});

		// A fresh editor instance is created on every mount; wire live emptiness reporting to it.
		// The listener is dropped when the editor is destroyed on unmount, so no manual off().
		if (mounted && this.notifyContentEmpty)
		{
			this.editorMount.vm?.editor?.on('update', this.handleEditorContentChange);
			this.notifyContentEmpty(this.#isEditorContentEmpty());
		}

		return mounted;
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
		saveBlockedReason: () => controller.saveBlockedReason(),
		expectContentOverwrite: () => controller.expectContentOverwrite(),
		cancelExpectedContentOverwrite: () => controller.cancelExpectedContentOverwrite(),
		isMain: () => Boolean(controller.state.isMain),
		getDocumentTitle: () => controller.getDocumentTitle(),
		headerDocumentTitle: () => controller.headerDocumentTitle(),
		collectionLabel: () => controller.collectionLabel(),
		applyRouteDocumentContext: (context) => controller.applyRouteDocumentContext(context),
		enterEditMode: () => controller.enterEditMode(),
		cancelEdit: () => controller.cancelEdit(),
		finishEdit: () => controller.finishEdit(),
		saveDocument: () => controller.saveDocumentAction(),
		getEditorMarkdown: () => controller.editorMount.readMarkdown(),
		importMarkdown: (file) => controller.importMarkdown(file),
		getExportMarkdown: (mode) => controller.editorMount.exportMarkdown(mode),
		hasAttachments: () => controller.editorMount.hasAttachments(),
		scrollToAnchor: (hash) => controller.scrollToAnchor(hash),
		compactBeforeRestore: () => controller.compactBeforeRestore(),
		showVersionPreview: (payload) => controller.showVersionPreview(payload),
		hideVersionPreview: () => controller.hideVersionPreview(),
		scrollToParticipant: (userId) => controller.scrollToParticipant(userId),
		destroy: () => controller.destroy(),
	};
}
