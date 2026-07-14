import { Type } from 'main.core';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { DocumentService } from '../application/document-service';
import { AwarenessManager } from './awareness-manager';
import { createYDoc } from './ydoc-factory';
import { FlushManager } from './flush-manager';
import { PullTransport } from './pull-transport';
import { CompactManager } from './compact-manager';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/binary';

export class PushPullYjsProvider
{
	documentId: number;
	collectionId: number;
	#userId: number;
	#userName: string;
	#userColor: string;
	#schema: Object;

	document: Object | null;
	awareness: Object | null;
	isConnected: boolean;
	lastPatchId: number | null;

	onStatus: Function | null;
	onSynced: Function | null;
	onDisconnect: Function | null;
	onConnectError: Function | null;
	onNeedReconnect: Function | null;
	onRemoteDocumentUpdate: Function | null;
	onRemoteArchive: Function | null;
	onRemoteRestore: Function | null;
	onRemoteDelete: Function | null;
	onRemoteHardDelete: Function | null;
	onRemoteContentOverwritten: Function | null;
	onRemoteCapabilities: Function | null;

	#flushManager: FlushManager;
	#pullTransport: PullTransport;
	#compactManager: CompactManager;
	#awarenessManager: Object | null;
	#isDestroyed: boolean;

	constructor({
		documentId,
		userId,
		userName,
		userColor,
		schema,
	}: {
		documentId: number,
		userId: number,
		userName: string,
		userColor: string,
		schema: Object,
	})
	{
		this.documentId = documentId;
		this.collectionId = 0;
		this.#userId = userId;
		this.#userName = userName;
		this.#userColor = userColor;
		this.#schema = schema;

		this.document = null;
		this.awareness = null;
		this.isConnected = false;
		this.lastPatchId = null;

		this.onStatus = null;
		this.onSynced = null;
		this.onDisconnect = null;
		this.onConnectError = null;
		this.onNeedReconnect = null;
		this.onRemoteDocumentUpdate = null;
		this.onRemoteArchive = null;
		this.onRemoteRestore = null;
		this.onRemoteDelete = null;
		this.onRemoteHardDelete = null;
		this.onRemoteContentOverwritten = null;
		this.onRemoteCapabilities = null;

		this.#flushManager = new FlushManager({ documentId });
		this.#pullTransport = new PullTransport({ documentId });
		this.#compactManager = new CompactManager({ documentId });
		this.#awarenessManager = null;
		this.#isDestroyed = false;
	}

	async connect(collaborationData: Object | null = null): Promise<void>
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#cleanupBeforeReconnect();
		this.#emitStatus('connecting');

		let data = collaborationData;
		if (data === null || data === undefined)
		{
			try
			{
				const response = await DocumentService.loadForCollaboration({
					documentId: this.documentId,
				});
				data = response?.data ?? {};
			}
			catch (error)
			{
				this.#emitStatus('disconnected');
				if (this.onConnectError)
				{
					this.onConnectError(error);
				}

				return;
			}

			if (this.#isDestroyed)
			{
				return;
			}
		}

		const yjsState = data?.yjsState ?? null;
		const markdown = data?.markdown ?? null;
		const patches = Array.isArray(data?.patches) ? data.patches : [];
		this.lastPatchId = data?.lastPatchId ?? null;

		this.document = createYDoc({
			yjsState,
			markdown,
			patches,
			schema: this.#schema,
		});

		// Skip genesis save when server holds raw markdown — ydoc-factory has no MD parser,
		// so the Y.Doc would be empty and would clobber the real content in DB.
		if (yjsState === null && this.document && !Type.isString(markdown))
		{
			await this.#saveGenesisState();
		}

		this.#initializeAwareness();
		await this.#flushManager.sendPersistedPatches(this.document);
		this.#startPullTransport();
		this.#flushManager.start({
			document: this.document,
			getCursorPosition: () => this.#getCursorPosition(),
		});
		this.#flushManager.registerBeforeUnload();

		this.isConnected = true;
		this.#emitStatus('connected');

		if (this.onSynced)
		{
			this.onSynced();
		}
	}

	async sync(): Promise<void>
	{
		if (this.#isDestroyed || !this.document)
		{
			return;
		}

		await this.#flushManager.sendPersistedPatches(this.document);
		await this.#flushManager.flush();

		try
		{
			const response = await DocumentService.loadForCollaboration({
				documentId: this.documentId,
			});

			const data = response?.data ?? {};
			const yjsState = data?.yjsState ?? null;
			const patches = Array.isArray(data?.patches) ? data.patches : [];
			this.lastPatchId = data?.lastPatchId ?? this.lastPatchId;

			if (Type.isStringFilled(yjsState))
			{
				Y.applyUpdate(this.document, base64ToUint8Array(yjsState), 'remote');
			}

			for (const patch of patches)
			{
				const raw = String(patch.PATCH || patch.patch || '');
				if (raw.length > 0)
				{
					Y.applyUpdate(this.document, base64ToUint8Array(raw), 'remote');
				}
			}
		}
		catch
		{
			// sync failed, will retry on next reconnect
		}

		this.#startPullTransport();
		this.#flushManager.start({
			document: this.document,
			getCursorPosition: () => this.#getCursorPosition(),
		});
		this.#flushManager.unregisterBeforeUnload();
		this.#flushManager.registerBeforeUnload();

		if (this.awareness)
		{
			this.awareness.setLocalStateField('user', {
				id: this.#userId,
				name: this.#userName,
				color: this.#userColor,
			});
		}

		if (this.#awarenessManager)
		{
			this.#awarenessManager.start();
		}

		this.isConnected = true;
		this.#emitStatus('connected');
	}

	clearCursor(): void
	{
		if (this.#awarenessManager)
		{
			this.#awarenessManager.clearCursor();
		}

		if (this.awareness)
		{
			this.awareness.setLocalStateField('cursor', null);
		}
	}

	disconnect(): void
	{
		this.#flushManager.unregisterBeforeUnload();
		this.#pullTransport.stop();
		this.#flushManager.stop();
		this.#compactManager.stopInterval();

		if (this.#awarenessManager)
		{
			this.#awarenessManager.leave();
		}

		const wasConnected = this.isConnected;
		this.isConnected = false;

		if (wasConnected && this.onDisconnect)
		{
			this.onDisconnect();
		}
	}

	destroy(): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#isDestroyed = true;
		this.disconnect();

		this.#flushManager.destroy();
		this.#pullTransport.destroy();
		this.#compactManager.destroy();

		if (this.#awarenessManager)
		{
			this.#awarenessManager.destroy();
			this.#awarenessManager = null;
		}

		if (this.awareness)
		{
			this.awareness.destroy();
			this.awareness = null;
		}

		if (this.document)
		{
			this.document.destroy();
			this.document = null;
		}
	}

	freezeWrites(): void
	{
		this.#flushManager.unregisterBeforeUnload();
		this.#flushManager.stop();
		this.#compactManager.stopInterval();

		if (this.#awarenessManager)
		{
			this.#awarenessManager.leave();
		}
	}

	refreshCollectionWatch(): void
	{
		this.#pullTransport.refreshCollectionWatch();
	}

	unfreezeWrites(): void
	{
		if (this.#isDestroyed || !this.document)
		{
			return;
		}

		this.#flushManager.start({
			document: this.document,
			getCursorPosition: () => this.#getCursorPosition(),
		});
		this.#flushManager.registerBeforeUnload();

		if (this.#awarenessManager)
		{
			this.#awarenessManager.start();
		}
	}

	async compact(getEditorMarkdown: () => string | null): Promise<void>
	{
		if (this.#isDestroyed || !this.document)
		{
			return;
		}

		await this.#compactManager.compact({
			document: this.document,
			getEditorMarkdown,
		});
	}

	startCompactInterval(getEditorMarkdown: () => string | null): void
	{
		this.#compactManager.startInterval({
			document: this.document,
			getEditorMarkdown,
		});
	}

	stopCompactInterval(): void
	{
		this.#compactManager.stopInterval();
	}

	#cleanupBeforeReconnect(): void
	{
		if (this.#awarenessManager)
		{
			this.#awarenessManager.destroy();
			this.#awarenessManager = null;
		}

		if (this.awareness)
		{
			this.awareness.destroy();
			this.awareness = null;
		}

		if (this.document)
		{
			this.document.destroy();
			this.document = null;
		}
	}

	async #saveGenesisState(): Promise<void>
	{
		if (!this.document)
		{
			return;
		}

		try
		{
			const fullState = Y.encodeStateAsUpdate(this.document);
			const yjsState = uint8ArrayToBase64(fullState);

			const response = await DocumentService.saveYjsState({
				documentId: this.documentId,
				yjsState,
			});

			const applied = response?.data?.applied;
			const serverState = response?.data?.yjsState ?? null;
			if (applied === false && Type.isStringFilled(serverState))
			{
				// Lost the genesis race: discard our orphan baseline and rebuild from the
				// authoritative server state so transport/awareness/flush/editor bind to it.
				this.document = createYDoc({
					yjsState: serverState,
					markdown: null,
					patches: [],
					schema: this.#schema,
				});
			}
		}
		catch
		{
			// Genesis state save failed — will be recreated on next connect
		}
	}

	#initializeAwareness(): void
	{
		this.awareness = new Awareness(this.document);
		this.awareness.setLocalStateField('user', {
			id: this.#userId,
			name: this.#userName,
			color: this.#userColor,
		});

		this.#awarenessManager = new AwarenessManager({
			awareness: this.awareness,
			documentId: this.documentId,
			userId: this.#userId,
			userName: this.#userName,
			userColor: this.#userColor,
			hasPendingUpdates: () => this.#flushManager.hasPendingUpdates(),
		});
		this.#awarenessManager.start();
	}

	#startPullTransport(): void
	{
		this.#pullTransport.start({
			onPatch: (update, params) => {
				if (!this.document || this.#isDestroyed)
				{
					return;
				}

				Y.applyUpdate(this.document, update, 'remote');

				if (this.#awarenessManager)
				{
					this.#awarenessManager.refreshAllCursors();
				}

				if (params?.cursor && this.#awarenessManager)
				{
					let cursorData = params.cursor;
					if (Type.isString(cursorData))
					{
						try
						{
							cursorData = JSON.parse(cursorData);
						}
						catch
						{
							cursorData = null;
						}
					}

					if (cursorData)
					{
						this.#awarenessManager.handleRemoteAwareness({
							type: 'cursor',
							userId: params.userId,
							position: cursorData,
						});
					}
				}
			},
			onAwareness: (params) => {
				if (this.#awarenessManager)
				{
					this.#awarenessManager.handleRemoteAwareness(params);
				}
			},
			onOffline: () => {
				if (this.isConnected)
				{
					this.#emitStatus('disconnected');
				}
			},
			onBackOnline: () => {
				if (this.onNeedReconnect)
				{
					this.onNeedReconnect();
				}
			},
			onDocumentUpdate: (params) => {
				if (this.onRemoteDocumentUpdate)
				{
					this.onRemoteDocumentUpdate(params);
				}
			},
			onArchive: (params) => {
				if (this.onRemoteArchive)
				{
					this.onRemoteArchive(params);
				}
			},
			onRestore: (params) => {
				if (this.onRemoteRestore)
				{
					this.onRemoteRestore(params);
				}
			},
			onDelete: (params) => {
				if (this.onRemoteDelete)
				{
					this.onRemoteDelete(params);
				}
			},
			onHardDelete: (params) => {
				if (this.onRemoteHardDelete)
				{
					this.onRemoteHardDelete(params);
				}
			},
			onContentOverwritten: (params) => {
				this.#handleContentOverwritten(params);
			},
			onCapabilities: (params) => {
				if (this.onRemoteCapabilities)
				{
					this.onRemoteCapabilities(params);
				}
			},
			getCollectionId: () => Number(this.collectionId) || 0,
		});
	}

	#handleContentOverwritten(params: Object): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		if (Number(params?.documentId) !== this.documentId)
		{
			return;
		}

		// Provider only dispatches — feature layer owns the rebuild. Going through connect(null)
		// here pipes raw markdown into ydoc-factory, which has no parser and clobbers the doc
		// with an empty Y.Doc via saveGenesisState.
		if (this.onRemoteContentOverwritten)
		{
			this.onRemoteContentOverwritten(params);
		}
	}

	#getCursorPosition(): Object | null
	{
		if (!this.awareness)
		{
			return null;
		}

		const localState = this.awareness.getLocalState();

		return localState?.cursor ?? null;
	}

	#emitStatus(status: string): void
	{
		if (this.onStatus)
		{
			this.onStatus({ status });
		}
	}
}
