import { Type } from 'main.core';
import { PullClient } from 'pull.client';
import { base64ToUint8Array } from '../utils/binary';

export class PullTransport
{
	#documentId: number;
	#pullHandler: Function | null;
	#pullUnsubscribers: Function[];
	#wasPullOffline: boolean;
	#callbacks: Object | null;

	constructor({ documentId }: { documentId: number })
	{
		this.#documentId = documentId;
		this.#pullHandler = null;
		this.#pullUnsubscribers = [];
		this.#wasPullOffline = false;
		this.#callbacks = null;
	}

	start({ onPatch, onAwareness, onOffline, onBackOnline }: {
		onPatch: (update: Uint8Array, params: Object) => void,
		onAwareness: (params: Object) => void,
		onOffline: () => void,
		onBackOnline: () => void,
	}): void
	{
		if (!Type.isFunction(BX?.PULL?.subscribe))
		{
			return;
		}

		this.stop();
		this.#callbacks = { onPatch, onAwareness, onOffline, onBackOnline };

		this.#pullHandler = (data) => {
			this.#handleCommand(data);
		};

		this.#pullUnsubscribers.push(
			BX.PULL.subscribe({
				type: PullClient.SubscriptionType.Server,
				moduleId: 'note',
				callback: this.#pullHandler,
			}),
			BX.PULL.subscribe({
				type: PullClient.SubscriptionType.Client,
				moduleId: 'note',
				callback: this.#pullHandler,
			}),
			BX.PULL.subscribe({
				type: PullClient.SubscriptionType.Status,
				callback: (data) => {
					this.#handleStatusChange(data);
				},
			}),
		);

		BX.PULL.extendWatch(`NOTE_DOC_${this.#documentId}`);
		BX.PULL.extendWatch(`NOTE_DOC_AWARE_${this.#documentId}`);
	}

	stop(): void
	{
		if (this.#pullUnsubscribers.length > 0)
		{
			for (const unsub of this.#pullUnsubscribers)
			{
				if (Type.isFunction(unsub))
				{
					unsub();
				}
			}
			this.#pullUnsubscribers = [];
		}

		this.#pullHandler = null;
	}

	destroy(): void
	{
		this.stop();
		this.#callbacks = null;
	}

	#handleCommand(data: Object): void
	{
		if (!this.#callbacks)
		{
			return;
		}

		const { command, params } = data;

		if (command === 'documentPatchReceived' && Number(params?.documentId) === this.#documentId)
		{
			const patchBase64 = params?.patch;
			if (Type.isStringFilled(patchBase64))
			{
				const update = base64ToUint8Array(patchBase64);
				this.#callbacks.onPatch(update, params);
			}
		}

		if (command === 'documentAwareness' && Number(params?.documentId) === this.#documentId)
		{
			this.#callbacks.onAwareness(params);
		}
	}

	#handleStatusChange(data: Object): void
	{
		if (!this.#callbacks)
		{
			return;
		}

		const { status } = data;

		if (status === 'offline')
		{
			this.#wasPullOffline = true;
			this.#callbacks.onOffline();
		}
		else if (status === 'online' && this.#wasPullOffline)
		{
			this.#wasPullOffline = false;
			this.#callbacks.onBackOnline();
		}
	}
}
