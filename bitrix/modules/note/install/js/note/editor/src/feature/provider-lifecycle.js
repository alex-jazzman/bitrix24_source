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
	#provider: Object | null;
	#isReconnecting: boolean;
	#isHandlingAuthFailure: boolean;
	#idleTracker: IdleTracker;
	#compactTimerId: number | null;

	constructor({ state, schema, getEditorMarkdown, messages }: {
		state: Object,
		schema: Object,
		getEditorMarkdown: () => string | null,
		messages: Object,
	})
	{
		this.#state = state;
		this.#schema = schema;
		this.#getEditorMarkdown = getEditorMarkdown;
		this.#messages = messages;
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

		await this.#provider.connect(collaborationData);
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
