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
	#provider: Object | null;
	#isReconnecting: boolean;
	#isHandlingAuthFailure: boolean;
	#idleTracker: IdleTracker;
	#compactTimerId: number | null;

	constructor({ state, schema, getEditorMarkdown, messages, onHardDelete = null, onRemoteRename = null, onCapabilities = null, onLifecycleChange = null, onRemoteContentOverwritten = null }: {
		state: Object,
		schema: Object,
		getEditorMarkdown: () => string | null,
		messages: Object,
		onHardDelete?: ((params: Object) => void) | null,
		onRemoteRename?: ((title: string) => void) | null,
		onCapabilities?: ((params: Object) => void) | null,
		onLifecycleChange?: ((reason: string) => void) | null,
		onRemoteContentOverwritten?: ((params: Object) => void) | null,
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
		this.#provider = null;
		this.#isReconnecting = false;
		this.#isHandlingAuthFailure = false;
		this.#idleTracker = new IdleTracker();
		this.#compactTimerId = null;
	}

	get provider(): Object | null
	{
		return this.#provider;
	}

	async initialize(documentId: number, user: Object, collaborationData: Object | null = null): Promise<void>
	{
		if (documentId <= 0 || !user?.id)
		{
			return;
		}

		this.#state.collaborationStatus = CollaborationStatus.CONNECTING;

		this.#provider = markRaw(new PushPullYjsProvider({
			documentId,
			userId: Number(user.id),
			userName: String(user.name || ''),
			userColor: String(user.color || '#999999'),
			schema: this.#schema,
		}));
		this.#provider.collectionId = Number(this.#state.collectionId) || 0;

		this.#provider.onStatus = ({ status }) => {
			this.#state.collaborationStatus = Type.isStringFilled(status)
				? status
				: CollaborationStatus.UNKNOWN;
		};

		this.#provider.onSynced = () => {
			this.#state.collaborationStatus = CollaborationStatus.SYNCED;
		};

		this.#provider.onDisconnect = () => {
			this.#state.collaborationStatus = CollaborationStatus.DISCONNECTED;
		};

		this.#provider.onConnectError = () => {
			this.handleConnectError();
		};

		this.#provider.onNeedReconnect = () => {
			void this.softReconnect();
		};

		this.#provider.onRemoteDocumentUpdate = (params) => {
			this.handleRemoteDocumentUpdate(params);
		};

		this.#provider.onRemoteArchive = (params) => {
			this.handleRemoteArchive(params);
		};

		this.#provider.onRemoteRestore = (params) => {
			this.handleRemoteRestore(params);
		};

		this.#provider.onRemoteDelete = (params) => {
			this.handleRemoteDelete(params);
		};

		this.#provider.onRemoteHardDelete = (params) => {
			this.handleRemoteHardDelete(params);
		};

		this.#provider.onRemoteCapabilities = (params) => {
			this.handleRemoteCapabilities(params);
		};

		this.#provider.onRemoteContentOverwritten = (params) => {
			this.handleRemoteContentOverwritten(params);
		};

		await this.#provider.connect(collaborationData);
	}

	handleRemoteContentOverwritten(params: Object): void
	{
		if (this.#onRemoteContentOverwritten)
		{
			this.#onRemoteContentOverwritten(params || {});
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

	destroy(): void
	{
		this.stopCompaction();
		this.#idleTracker.stop();

		if (this.#provider)
		{
			this.#provider.destroy();
			this.#provider = null;
		}

		this.#state.collaborationStatus = CollaborationStatus.IDLE;
	}

	startIdleTracking(): void
	{
		if (!this.#provider)
		{
			return;
		}

		this.#idleTracker.start(
			() => {
				if (this.#provider?.isConnected)
				{
					this.#state.collaborationStatus = CollaborationStatus.DISCONNECTED;
					this.#provider.disconnect();
				}
			},
			() => {
				if (this.#provider && !this.#provider.isConnected)
				{
					void this.softReconnect();
				}
			},
		);
	}

	async softReconnect(): Promise<void>
	{
		if (this.#isReconnecting || !this.#provider)
		{
			return;
		}

		this.#isReconnecting = true;
		try
		{
			this.stopCompaction();
			this.#state.collaborationStatus = CollaborationStatus.CONNECTING;
			await this.#provider.sync();
			this.#state.collaborationStatus = CollaborationStatus.SYNCED;
			this.startIdleTracking();
			this.startCompaction();
		}
		catch
		{
			this.#state.collaborationStatus = CollaborationStatus.DISCONNECTED;
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

		this.destroy();
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

	handleConnectError(): void
	{
		if (this.#isHandlingAuthFailure)
		{
			return;
		}

		this.#isHandlingAuthFailure = true;
		this.destroy();
		this.#state.collaborationStatus = CollaborationStatus.DISCONNECTED;
		showErrorToast(this.#messages.loadError);
		this.#isHandlingAuthFailure = false;
	}
}
