import { Type } from 'main.core';
import { markRaw } from 'ui.vue3';
import { CollaborationStatus } from '../collaboration/collaboration-status';
import { IdleTracker } from '../collaboration/idle-tracker';
import { PushPullYjsProvider } from '../collaboration/push-pull-provider';
import { showErrorToast } from '../utils/show-error-toast';

export class ProviderLifecycle
{
	#state: Object;
	#schema: Object;
	#getEditorMarkdown: () => string | null;
	#messages: Object;
	#onHardDelete: ((params: Object) => void) | null;
	#onRemoteRename: ((title: string) => void) | null;
	#onCapabilities: ((params: Object) => void) | null;
	#onLifecycleChange: ((reason: string) => void) | null;
	#onRemoteContentOverwritten: ((params: Object) => void) | null;
	#onGenesisRefused: ((params: Object) => void) | null;
	#onSaveRefused: ((params: Object) => void) | null;
	#onConnectionSettled: ((params: Object) => void) | null;
	#provider: Object | null;
	#isReconnecting: boolean;
	#isEndingConnectionAttempt: boolean;
	#isGoingIdle: boolean;
	#idleTracker: IdleTracker;
	#compactTimerId: number | null;
	#participantsTimer: number | null;

	constructor({
		state,
		schema,
		getEditorMarkdown,
		messages,
		onHardDelete = null,
		onRemoteRename = null,
		onCapabilities = null,
		onLifecycleChange = null,
		onRemoteContentOverwritten = null,
		onGenesisRefused = null,
		onSaveRefused = null,
		onConnectionSettled = null,
	}: {
		state: Object,
		schema: Object,
		getEditorMarkdown: () => string | null,
		messages: Object,
		onHardDelete?: ((params: Object) => void) | null,
		onRemoteRename?: ((title: string) => void) | null,
		onCapabilities?: ((params: Object) => void) | null,
		onLifecycleChange?: ((reason: string) => void) | null,
		onRemoteContentOverwritten?: ((params: Object) => void) | null,
		onGenesisRefused?: ((params: Object) => void) | null,
		onSaveRefused?: ((params: Object) => void) | null,
		onConnectionSettled?: ((params: Object) => void) | null,
	})
	{
		this.#state = state;
		this.#schema = schema;
		this.#getEditorMarkdown = getEditorMarkdown;
		this.#messages = messages;
		this.#onHardDelete = typeof onHardDelete === 'function' ? onHardDelete : null;
		this.#onRemoteRename = typeof onRemoteRename === 'function' ? onRemoteRename : null;
		this.#onCapabilities = typeof onCapabilities === 'function' ? onCapabilities : null;
		this.#onLifecycleChange = typeof onLifecycleChange === 'function' ? onLifecycleChange : null;
		this.#onRemoteContentOverwritten = typeof onRemoteContentOverwritten === 'function' ? onRemoteContentOverwritten : null;
		this.#onGenesisRefused = typeof onGenesisRefused === 'function' ? onGenesisRefused : null;
		this.#onSaveRefused = typeof onSaveRefused === 'function' ? onSaveRefused : null;
		this.#onConnectionSettled = typeof onConnectionSettled === 'function' ? onConnectionSettled : null;
		this.#provider = null;
		this.#isReconnecting = false;
		this.#isEndingConnectionAttempt = false;
		this.#isGoingIdle = false;
		this.#idleTracker = new IdleTracker();
		this.#compactTimerId = null;
		this.#participantsTimer = null;
	}

	get provider(): Object | null
	{
		return this.#provider;
	}

	setMode(mode: string): void
	{
		this.#provider?.setMode?.(mode);
	}

	materialize(): void
	{
		void this.#provider?.materialize?.();
	}

	async initialize(documentId: number, user: Object, collaborationData: Object | null = null): Promise<void>
	{
		if (documentId <= 0 || !user?.id)
		{
			return;
		}

		// One lifecycle never runs two providers. Callers tear the previous one down themselves, but they
		// do it before awaits of their own, and a path that gets in between would leave the predecessor
		// alive: undestroyed, still subscribed to pull and still flushing patches from a Y.Doc that has
		// been replaced.
		if (this.#provider)
		{
			await this.destroy();
		}

		this.#setStatus(CollaborationStatus.CONNECTING, null);

		// Held in a local for the callbacks below to close over: `this.#provider` is whoever is current
		// when a signal arrives, and that is exactly what a signal has to be checked against.
		const provider = markRaw(new PushPullYjsProvider({
			documentId,
			userId: Number(user.id),
			userName: String(user.name || ''),
			userColor: String(user.color || '#999999'),
			userAvatar: (typeof user.avatar === 'string' && user.avatar !== '') ? user.avatar : null,
			mode: this.#state.mode === 'edit' ? 'edit' : 'view',
			schema: this.#schema,
			// Persisted on the provider so timer/idle/teardown triggers can materialize without an
			// argument, unlike compact() which still receives it per call.
			getEditorMarkdown: () => this.#getEditorMarkdown(),
		}));
		this.#provider = provider;
		provider.collectionId = Number(this.#state.collectionId) || 0;

		provider.onParticipants = (participants) => {
			// Presence arrives as one pull message per peer (each answers our `join` independently),
			// so the initial fill trickles in over a window wider than a normal update.
			// Use a longer settle window while the list is still empty to gather everyone into one
			// batch, then a short debounce afterwards so mode/join changes stay responsive.
			const next = Array.isArray(participants) ? participants : [];
			const isInitialFill = this.#state.participants.length === 0 && next.length > 0;
			const settleMs = isInitialFill ? 500 : 180;
			if (this.#participantsTimer !== null)
			{
				clearTimeout(this.#participantsTimer);
			}
			this.#participantsTimer = setTimeout(() => {
				this.#participantsTimer = null;
				this.#state.participants = next;
			}, settleMs);
		};

		provider.onStatus = ({ status }) => {
			this.#setStatus(Type.isStringFilled(status) ? status : CollaborationStatus.UNKNOWN, provider);
		};

		provider.onSynced = () => {
			this.#setStatus(CollaborationStatus.SYNCED, provider);
		};

		provider.onDisconnect = () => {
			this.#setStatus(CollaborationStatus.DISCONNECTED, provider);
		};

		provider.onConnectError = () => {
			this.handleConnectError(provider);
		};

		provider.onNeedReconnect = () => {
			void this.softReconnect();
		};

		provider.onRemoteDocumentUpdate = (params) => {
			this.handleRemoteDocumentUpdate(params);
		};

		provider.onRemoteArchive = (params) => {
			this.handleRemoteArchive(params);
		};

		provider.onRemoteRestore = (params) => {
			this.handleRemoteRestore(params);
		};

		provider.onRemoteDelete = (params) => {
			this.handleRemoteDelete(params);
		};

		provider.onRemoteHardDelete = (params) => {
			this.handleRemoteHardDelete(params);
		};

		provider.onRemoteCapabilities = (params) => {
			this.handleRemoteCapabilities(params);
		};

		provider.onRemoteContentOverwritten = (params) => {
			this.handleRemoteContentOverwritten(params, provider);
		};

		provider.onGenesisRefused = (params) => {
			this.handleGenesisRefused(params, provider);
		};

		provider.onGenesisFailed = () => {
			this.handleGenesisFailed(provider);
		};

		provider.onSaveRefused = (params) => {
			this.handleSaveRefused(params, provider);
		};

		await provider.connect(collaborationData);
	}

	// `source` is the provider the signal came from, on the same terms as the status writes: a rebuild
	// belongs to whoever is running now, and a predecessor asking for one would throw away the state of
	// its successor. Every signal has a provider behind it, so the argument is not optional: a call
	// without one would pass the check it exists for.
	handleRemoteContentOverwritten(params: Object, source: Object): void
	{
		if (source !== this.#provider)
		{
			return;
		}

		if (this.#onRemoteContentOverwritten)
		{
			this.#onRemoteContentOverwritten(params || {});
		}
	}

	// Reported once per provider, from inside its own connect(): the server refused to write a
	// collaborative baseline for this document. Nothing is decided here - what to do with a document
	// that cannot be collaborative is the feature layer's call.
	handleGenesisRefused(params: Object, source: Object): void
	{
		if (source !== this.#provider)
		{
			return;
		}

		if (this.#onGenesisRefused)
		{
			this.#onGenesisRefused(params || {});
		}
	}

	// The server refused a patch this provider sent. Told apart from a refused genesis by when it happens:
	// the connection was up and working, and the document was taken out of the collaborative format under
	// it. The provider is left standing - it holds the text - and the feature layer decides.
	handleSaveRefused(params: Object, source: Object): void
	{
		if (source !== this.#provider)
		{
			return;
		}

		if (this.#onSaveRefused)
		{
			this.#onSaveRefused(params || {});
		}
	}

	startCompaction(): void
	{
		if (!this.#provider)
		{
			return;
		}

		const getMarkdown = () => this.#getEditorMarkdown();

		this.#compactTimerId = setTimeout(() => {
			void this.#provider?.compact(getMarkdown);
		}, 5000);

		this.#provider.startCompactInterval(getMarkdown);
	}

	stopCompaction(): void
	{
		if (this.#compactTimerId !== null)
		{
			clearTimeout(this.#compactTimerId);
			this.#compactTimerId = null;
		}

		this.#provider?.stopCompactInterval();
	}

	async destroy(options: Object = {}): Promise<void>
	{
		this.stopCompaction();
		this.#idleTracker.stop();

		if (this.#participantsTimer !== null)
		{
			clearTimeout(this.#participantsTimer);
			this.#participantsTimer = null;
		}

		// Detach the provider and reset reactive state synchronously so double-fire teardowns and the
		// status indicator behave exactly as before; only the provider's own async teardown materialize
		// is awaited, and only callers on the SPA-navigation path actually await this method.
		const provider = this.#provider;
		this.#provider = null;
		this.#state.participants = [];
		this.#setStatus(CollaborationStatus.IDLE, null);

		if (provider)
		{
			await provider.destroy(options);
		}
	}

	startIdleTracking(): void
	{
		const provider = this.#provider;
		if (!provider)
		{
			return;
		}

		this.#idleTracker.start(
			async () => {
				if (!provider.isConnected)
				{
					return;
				}

				// The intent to go idle is recorded BEFORE the await. The provider is still connected
				// while the request is in the air, so a user coming back right then would see a live
				// provider, skip the reconnect — and then get disconnected by this very handler once it
				// resumed. The resume callback clears the flag, and the disconnect below stands down.
				this.#isGoingIdle = true;
				this.#setStatus(CollaborationStatus.DISCONNECTED, provider);
				// Materialize before going silent for ~10 minutes so the last state still lands.
				await provider.materialize();

				if (!this.#isGoingIdle)
				{
					return; // activity resumed mid-flight — stay connected
				}

				this.#isGoingIdle = false;
				provider.disconnect();
			},
			() => {
				const wasGoingIdle = this.#isGoingIdle;
				this.#isGoingIdle = false;

				if (!provider.isConnected)
				{
					void this.softReconnect();

					return;
				}

				if (wasGoingIdle)
				{
					// Never actually disconnected — undo the status the idle handler set ahead of time.
					this.#setStatus(CollaborationStatus.SYNCED, provider);
				}
			},
		);
	}

	async softReconnect(): Promise<void>
	{
		const provider = this.#provider;
		if (this.#isReconnecting || !provider)
		{
			return;
		}

		this.#isReconnecting = true;
		try
		{
			this.stopCompaction();
			this.#setStatus(CollaborationStatus.CONNECTING, provider);
			await provider.sync();
			this.#setStatus(CollaborationStatus.SYNCED, provider);
			this.startIdleTracking();
			this.startCompaction();
			// State accumulated during the disconnect window materializes right after resync.
			void this.#provider?.materialize();
		}
		catch
		{
			this.#setStatus(CollaborationStatus.DISCONNECTED, provider);
		}
		finally
		{
			this.#isReconnecting = false;
		}
	}

	handleRemoteDocumentUpdate(params: Object): void
	{
		if (!params)
		{
			return;
		}

		if (typeof params.title !== 'string' || params.title === '')
		{
			return;
		}

		this.#state.title = params.title;

		// Vue app inside EditorMount was created with a fixed `title` prop and
		// won't observe state changes — feature owns the contenteditable sync.
		if (this.#onRemoteRename)
		{
			this.#onRemoteRename(params.title);
		}
	}

	handleRemoteArchive(params: Object): void
	{
		if (!params || !this.#provider)
		{
			return;
		}

		// Idempotent — backend fans out the same archive via both NOTE_DOC_{id} and NOTE_COLLECTION_{id}.
		if (this.#state.isArchived)
		{
			return;
		}

		this.#state.isArchived = true;
		if (typeof params.archivedAt === 'string' && params.archivedAt !== '')
		{
			this.#state.archivedAt = params.archivedAt;
		}

		this.#notifyLifecycle(this.#messages.archivedRemote);
		this.#emitLifecycleChange('archived');
	}

	handleRemoteHardDelete(params: Object): void
	{
		if (!params)
		{
			return;
		}

		// Backend may fan out hardDelete via two channels — destroy() makes #provider null
		// so the second arrival is short-circuited by the !this.#provider check below if added.
		if (!this.#provider)
		{
			return;
		}

		const mode = this.#state.recycleBinId ? 'recyclebin' : (this.#state.isArchived ? 'archive' : 'home');

		// Push teardown: the document is already gone remotely — nothing to materialize, and no await.
		void this.destroy({ materialize: false });
		this.#notifyLifecycle(this.#messages.hardDeletedRemote);

		if (this.#onHardDelete)
		{
			this.#onHardDelete({ documentId: Number(params.documentId) || 0, mode });
		}
	}

	handleRemoteDelete(params: Object): void
	{
		if (!params || !this.#provider)
		{
			return;
		}

		// Backend fans out documentDelete via both NOTE_DOC_{id} (sendToDocument) and
		// NOTE_COLLECTION_{id} (sendToCollection) — the first push has no recycleBinId,
		// so guard on isTrashed too, otherwise toast fires twice.
		// `isArchived` is NOT a guard here: archived → trashed is a legitimate transit
		// (initiator deletes an archived doc), and blocking it leaves the viewer stuck
		// in archive mode with buttons that hit a now-trashed backend.
		if (this.#state.isTrashed === true || this.#state.recycleBinId)
		{
			return;
		}

		const recycleBinId = Number(params.recycleBinId);
		if (Number.isFinite(recycleBinId) && recycleBinId > 0)
		{
			this.#state.recycleBinId = recycleBinId;
		}
		if (typeof params.trashedAt === 'string' && params.trashedAt !== '')
		{
			this.#state.trashedAt = params.trashedAt;
		}
		this.#state.isTrashed = true;

		this.#notifyLifecycle(this.#messages.trashedRemote);
		this.#emitLifecycleChange('trashed');
	}

	handleRemoteCapabilities(params: Object): void
	{
		if (this.#onCapabilities)
		{
			this.#onCapabilities(params || {});
		}
	}

	freezeForLostAccess(): void
	{
		if (!this.#provider)
		{
			return;
		}

		this.stopCompaction();
		this.#provider.freezeWrites();
		this.#state.readOnly = true;
	}

	handleRemoteRestore(params: Object): void
	{
		if (!params || !this.#provider)
		{
			return;
		}

		// Idempotent — receiver may already be in active state.
		if (!this.#state.isArchived && !this.#state.recycleBinId && !this.#state.isTrashed)
		{
			return;
		}

		this.#state.isArchived = false;
		this.#state.archivedAt = null;
		this.#state.recycleBinId = null;
		this.#state.trashedAt = null;
		this.#state.isTrashed = false;

		this.#notifyLifecycle(this.#messages.restoredRemote);
		this.#emitLifecycleChange('restored');
	}

	// The one place the lifecycle writes the indicator; terminal states after a server refusal are set by
	// the feature layer. `source` is the provider a status belongs to: a provider that has already been torn
	// down still has continuations in flight and callbacks the transport holds, and none of them may
	// overwrite the status of the provider that replaced it. Writes the lifecycle makes on its own behalf —
	// the pre-connect status and the teardown reset — pass `null`: at that moment there is no provider whose
	// word it would be. Guarding here rather than in each callback is deliberate.
	#setStatus(status: string, source: Object | null): void
	{
		if (source !== null && source !== this.#provider)
		{
			return;
		}

		this.#state.collaborationStatus = status;
	}

	#emitLifecycleChange(reason: string): void
	{
		if (this.#onLifecycleChange)
		{
			this.#onLifecycleChange(reason);
		}
	}

	#notifyLifecycle(content: string): void
	{
		if (typeof content !== 'string' || content === '')
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

	// `source` names the provider that lost its connection. The check stands before the teardown rather
	// than at the status write: a broken connection reported by a provider that has already been replaced
	// would dismantle its successor and complain about a connection nobody is using, and by the time the
	// status is written the field is null anyway.
	handleConnectError(source: Object): void
	{
		if (this.#endConnectionAttempt(source))
		{
			showErrorToast(this.#messages.loadError);
		}
	}

	// Writing the collaborative baseline failed for a reason the server never named: the text on screen
	// is the server's own and did not change, so the attempt ends on the indicator alone. The load error
	// of handleConnectError() would announce a failure to load the document the user is reading.
	handleGenesisFailed(source: Object): void
	{
		this.#endConnectionAttempt(source);
	}

	// Ends the connection attempt of `source` and answers whether this call is the one that ended it, so
	// that a caller which also speaks to the user does so once, and only for the provider it runs.
	#endConnectionAttempt(source: Object): boolean
	{
		if (source !== this.#provider)
		{
			return false;
		}

		if (this.#isEndingConnectionAttempt)
		{
			return false;
		}

		this.#isEndingConnectionAttempt = true;
		// Push teardown: the connection is broken, materialize has nowhere to go — fire and forget.
		// State reset runs synchronously inside destroy(), so the DISCONNECTED set below still wins.
		void this.destroy({ materialize: false });
		this.#setStatus(CollaborationStatus.DISCONNECTED, null);
		this.#isEndingConnectionAttempt = false;
		// The attempt is over and no provider is left: the caller decides what that means for editing.
		// Reported after the teardown so the caller sees the outcome, not the provider on its way out.
		if (this.#onConnectionSettled)
		{
			this.#onConnectionSettled({ documentId: Number(source?.documentId) || 0 });
		}

		return true;
	}
}
