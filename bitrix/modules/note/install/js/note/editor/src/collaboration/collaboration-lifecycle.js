import { Type } from 'main.core';
import { markRaw } from 'ui.vue3';
import { DocumentService } from '../application/document-service';
import { createCollaborationProvider } from './collaboration-manager';
import { CollaborationStatus } from './collaboration-status';

type CollabCallbacks = {
	onDisconnect?: (hadSynced: boolean) => void,
	onAuthFailed?: () => void,
};

function hasCollaborationConnectionData(context: mixed): boolean
{
	return (
		Type.isStringFilled(context?.url)
		&& Type.isStringFilled(context?.docKey)
		&& Type.isStringFilled(context?.token)
	);
}

export class CollaborationLifecycle
{
	state: Object;
	getDocumentId: () => mixed;
	provider: Object | null;
	providerHasSynced: boolean;
	isReconnectingAfterIdle: boolean;

	constructor({ state, getDocumentId }: { state: Object, getDocumentId: () => mixed })
	{
		this.state = state;
		this.getDocumentId = getDocumentId;
		this.provider = null;
		this.providerHasSynced = false;
		this.isReconnectingAfterIdle = false;
	}

	initialize(callbacks: CollabCallbacks): void
	{
		const connectionData = {
			url: this.state.collaborationUrl,
			token: this.state.collaborationToken,
			docKey: this.state.docKey,
		};
		if (!hasCollaborationConnectionData(connectionData))
		{
			return;
		}

		this.state.collaborationStatus = CollaborationStatus.CONNECTING;
		this.providerHasSynced = false;
		this.provider = markRaw(createCollaborationProvider({
			url: connectionData.url,
			name: connectionData.docKey,
			token: connectionData.token,
			onStatus: ({ status }) => {
				this.state.collaborationStatus = Type.isStringFilled(status)
					? status
					: CollaborationStatus.UNKNOWN;
			},
			onSynced: () => {
				this.state.collaborationStatus = CollaborationStatus.SYNCED;
				this.providerHasSynced = true;
			},
			onDisconnect: () => {
				this.state.collaborationStatus = CollaborationStatus.DISCONNECTED;
				if (callbacks?.onDisconnect)
				{
					callbacks.onDisconnect(this.providerHasSynced);
				}
			},
			onClose: ({ event }) => {
				if (
					!this.providerHasSynced
					&& event?.code !== 1000
					&& callbacks?.onAuthFailed
				)
				{
					callbacks.onAuthFailed();
				}
			},
			onAuthenticationFailed: () => {
				this.state.collaborationStatus = CollaborationStatus.AUTH_FAILED;
				if (callbacks?.onAuthFailed)
				{
					callbacks.onAuthFailed();
				}
			},
		}));
		this.provider.connect();
	}

	destroy(): void
	{
		if (this.provider)
		{
			this.provider.destroy();
			this.provider = null;
		}
		this.providerHasSynced = false;
		this.state.collaborationStatus = CollaborationStatus.IDLE;
	}

	reconnect(callbacks: CollabCallbacks): void
	{
		this.destroy();
		this.initialize(callbacks);
	}

	async reconnectAfterIdle(): Promise<void>
	{
		if (this.isReconnectingAfterIdle)
		{
			return;
		}

		this.isReconnectingAfterIdle = true;
		try
		{
			if (this.isTokenExpired())
			{
				await this.refreshToken();
			}

			if (this.provider && !this.provider.isConnected)
			{
				this.state.collaborationStatus = CollaborationStatus.CONNECTING;
				this.provider.connect();
			}
		}
		finally
		{
			this.isReconnectingAfterIdle = false;
		}
	}

	isTokenExpired(): boolean
	{
		try
		{
			const token = this.state.collaborationToken;
			if (!Type.isStringFilled(token))
			{
				return true;
			}

			const parts = token.split('.');
			if (parts.length !== 3)
			{
				return true;
			}

			const payload = JSON.parse(atob(parts[1].replaceAll('-', '+').replaceAll('_', '/')));
			if (!payload.exp)
			{
				return true;
			}

			const nowSeconds = Math.floor(Date.now() / 1000);

			return payload.exp - 60 <= nowSeconds;
		}
		catch
		{
			return true;
		}
	}

	async refreshToken(): Promise<void>
	{
		try
		{
			const documentId = Number(this.getDocumentId());
			if (!Number.isInteger(documentId) || documentId <= 0)
			{
				return;
			}

			const result = await DocumentService.getCollaborationToken({ documentId });
			const token = result?.data?.token;
			if (Type.isStringFilled(token))
			{
				this.state.collaborationToken = token;
				if (this.provider)
				{
					this.provider.configuration.token = token;
				}
			}
		}
		catch
		{
			// Token refresh failed — connect will use old token.
			// If it's truly expired, onAuthenticationFailed will handle graceful degradation.
		}
	}
}
