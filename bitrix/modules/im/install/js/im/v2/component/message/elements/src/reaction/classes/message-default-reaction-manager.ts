import { Text, Type } from 'main.core';

import { PullClient } from 'pull.client';

import { Core } from 'im.v2.application.core';
import { Settings, LocalStorageKey } from 'im.v2.const';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { Notifier } from 'im.v2.lib.notifier';
import { SettingsService } from 'im.v2.provider.service.settings';
import { type RunActionError } from 'im.v2.lib.rest';
import { singleFlight } from '../helpers/single-flight';

import { ReactionName } from 'ui.reaction.item';

type DefaultReactionPending = {
	id: string,
	value: string,
	baseValue: string,
};

export const ChangeStatus = {
	confirmed: 'confirmed',
	pending: 'pending',
	superseded: 'superseded',
} as const;

export type ChangeResult = {
	status: typeof ChangeStatus[keyof typeof ChangeStatus],
};

type OperationWaiter = {
	resolve: (result: ChangeResult) => void,
	reject: (error: RunActionError[]) => void,
};

const isKnownReaction = (value: unknown): value is string => (
	Type.isStringFilled(value)
	&& (Object.values(ReactionName) as string[]).includes(value)
);

const isValidPendingChange = (value: any): boolean => (
	Type.isPlainObject(value)
	&& Type.isStringFilled(value.id)
	&& isKnownReaction(value.value)
	&& isKnownReaction(value.baseValue)
);

export class MessageDefaultReactionManager
{
	static #instance: MessageDefaultReactionManager;

	#settingsService: SettingsService = new SettingsService();
	#operationWaiters: Map<string, OperationWaiter> = new Map();
	#pendingOperation: DefaultReactionPending | null = null;
	#unsubscribePullStatus: () => void = () => {};
	#unsubscribeSettingsUpdate: () => void = () => {};
	#inFlightRequest: Promise<void> | null = null;
	#isInitialized: boolean = false;
	#generation: number = 0;
	#serverAlignQueued: boolean = false;
	#alignWithServer: () => void = singleFlight(() => this.#pullServerValue());

	static getInstance(): MessageDefaultReactionManager
	{
		MessageDefaultReactionManager.#instance ??= new MessageDefaultReactionManager();

		return MessageDefaultReactionManager.#instance;
	}

	init(): void
	{
		if (this.#isInitialized)
		{
			return;
		}

		this.#isInitialized = true;
		this.#pendingOperation = this.#getPendingOperation();

		if (this.#pendingOperation)
		{
			this.#applyToStore(this.#pendingOperation.value);
			void this.#sync();
		}

		this.#subscribeToPullClient();
	}

	destroy(): void
	{
		this.#unsubscribeSettingsUpdate();
		this.#unsubscribeSettingsUpdate = () => {};

		this.#unsubscribePullStatus();
		this.#unsubscribePullStatus = () => {};

		this.#isInitialized = false;
	}

	changeDefaultReaction(reaction: string): Promise<ChangeResult>
	{
		this.init();
		this.#generation += 1;

		const baseValue = this.#supersedePreviousChange();
		const pendingChange = this.#stagePendingChange(reaction, baseValue);
		const result = this.#registerWaiter(pendingChange.id);

		this.#applyToStore(reaction);

		if (Core.isOnline())
		{
			void this.#sync();
		}
		else
		{
			this.#resolveWaiter(pendingChange.id, { status: ChangeStatus.pending });
		}

		return result;
	}

	#applyToStore(reaction: string): void
	{
		void Core.getStore().dispatch('application/settings/set', {
			[Settings.message.defaultReaction]: reaction,
		});
	}

	#supersedePreviousChange(): string
	{
		const previous = this.#pendingOperation;
		if (previous)
		{
			this.#resolveWaiter(previous.id, { status: ChangeStatus.superseded });
		}

		return previous?.baseValue
			?? Core.getStore().getters['application/settings/get'](Settings.message.defaultReaction);
	}

	#stagePendingChange(reaction: string, baseValue: string): DefaultReactionPending
	{
		const pendingChange = {
			id: Text.getRandom(16),
			value: reaction,
			baseValue,
		};

		this.#pendingOperation = pendingChange;
		this.#savePendingOperation();

		return pendingChange;
	}

	#registerWaiter(id: string): Promise<ChangeResult>
	{
		return new Promise((resolve, reject) => {
			this.#operationWaiters.set(id, { resolve, reject });
		});
	}

	onDefaultReactionPull(reaction: string): void
	{
		this.init();

		if (this.#pendingOperation || this.#inFlightRequest)
		{
			this.#serverAlignQueued = true;

			if (this.#pendingOperation)
			{
				this.#applyToStore(this.#pendingOperation.value);
			}

			return;
		}

		this.#generation += 1;
		this.#serverAlignQueued = false;
		this.#applyToStore(reaction);
	}

	onOnline(): void
	{
		void this.#sync();
	}

	#getPendingOperation(): DefaultReactionPending | null
	{
		let pending: any = null;

		try
		{
			pending = LocalStorageManager.getInstance().get(
				LocalStorageKey.defaultReactionPending,
			);
		}
		catch
		{
			return null;
		}

		if (!isValidPendingChange(pending))
		{
			LocalStorageManager.getInstance().remove(
				LocalStorageKey.defaultReactionPending,
			);

			return null;
		}

		return pending;
	}

	#subscribeToPullClient(): void
	{
		const pullClient = Core.getPullClient();
		if (!pullClient)
		{
			return;
		}

		this.#unsubscribePullStatus();
		this.#unsubscribeSettingsUpdate();

		this.#unsubscribePullStatus = pullClient.subscribe({
			type: PullClient.SubscriptionType.Status,
			callback: ({ status }: { status: string }) => {
				if (status === PullClient.PullStatus.Online)
				{
					this.onOnline();
				}
			},
		}) as () => void;

		this.#unsubscribeSettingsUpdate = pullClient.subscribe({
			type: PullClient.SubscriptionType.Server,
			moduleId: 'im',
			command: 'settingsUpdate',
			callback: (params: unknown) => {
				if (!Type.isPlainObject(params))
				{
					return;
				}

				const reaction = params[Settings.message.defaultReaction];
				if (!isKnownReaction(reaction))
				{
					return;
				}

				this.onDefaultReactionPull(reaction);
			},
		}) as () => void;
	}

	async #pullServerValue(): Promise<void>
	{
		if (this.#pendingOperation || this.#inFlightRequest)
		{
			return;
		}

		const generation = ++this.#generation;

		let defaultReaction: string = '';
		try
		{
			defaultReaction = await this.#settingsService.getDefaultReaction();
		}
		catch
		{
			return;
		}

		if (
			generation !== this.#generation
			|| this.#pendingOperation
			|| this.#inFlightRequest
		)
		{
			return;
		}

		void Core.getStore().dispatch('application/settings/set', {
			[Settings.message.defaultReaction]: defaultReaction,
		});
	}

	#savePendingOperation(): void
	{
		LocalStorageManager.getInstance().set(
			LocalStorageKey.defaultReactionPending,
			this.#pendingOperation,
		);
	}

	#resolveWaiter(operationId: string, result: ChangeResult): void
	{
		const waiter = this.#operationWaiters.get(operationId);
		if (!waiter)
		{
			return;
		}

		this.#operationWaiters.delete(operationId);
		waiter.resolve(result);
	}

	#rejectWaiter(operationId: string, error: RunActionError[]): boolean
	{
		const waiter = this.#operationWaiters.get(operationId);
		if (!waiter)
		{
			return false;
		}

		this.#operationWaiters.delete(operationId);
		waiter.reject(error);

		return true;
	}

	async #sync(): Promise<void>
	{
		if (!this.#pendingOperation || this.#inFlightRequest)
		{
			return;
		}

		if (!Core.isOnline())
		{
			this.#resolveWaiter(this.#pendingOperation.id, { status: ChangeStatus.pending });

			return;
		}

		const operation = this.#pendingOperation;
		this.#inFlightRequest = this.#settingsService.updateDefaultReaction(operation.value);

		try
		{
			await this.#inFlightRequest;
			this.#handleSuccess(operation);
		}
		catch (error)
		{
			if (!Core.isOnline())
			{
				this.#resolveWaiter(operation.id, { status: ChangeStatus.pending });

				return;
			}

			await this.#finalizeFailure(operation, error as RunActionError[]);
		}
		finally
		{
			this.#inFlightRequest = null;

			if (this.#pendingOperation && this.#pendingOperation.id !== operation.id)
			{
				void this.#sync();
			}
			else if (!this.#pendingOperation && this.#serverAlignQueued)
			{
				this.#serverAlignQueued = false;
				this.#alignWithServer();
			}
		}
	}

	#handleSuccess(operation: DefaultReactionPending): void
	{
		if (!this.#pendingOperation)
		{
			return;
		}

		if (this.#pendingOperation?.id !== operation.id)
		{
			this.#pendingOperation.baseValue = operation.value;

			LocalStorageManager.getInstance().set(
				LocalStorageKey.defaultReactionPending,
				this.#pendingOperation,
			);

			return;
		}

		this.#pendingOperation = null;
		this.#resolveWaiter(operation.id, { status: ChangeStatus.confirmed });

		LocalStorageManager.getInstance().remove(
			LocalStorageKey.defaultReactionPending,
		);
	}

	async #finalizeFailure(operation: DefaultReactionPending, error: RunActionError[]): Promise<void>
	{
		if (operation.id !== this.#pendingOperation?.id)
		{
			return;
		}

		const generation = ++this.#generation;
		let confirmedReaction = operation.baseValue;

		try
		{
			confirmedReaction = await this.#settingsService.getDefaultReaction();
		}
		catch
		{
			confirmedReaction = operation.baseValue;
		}

		if (operation.id !== this.#pendingOperation?.id || generation !== this.#generation)
		{
			return;
		}

		this.#pendingOperation = null;

		LocalStorageManager.getInstance().remove(
			LocalStorageKey.defaultReactionPending,
		);

		void Core.getStore().dispatch('application/settings/set', {
			[Settings.message.defaultReaction]: confirmedReaction,
		});

		if (!this.#rejectWaiter(operation.id, error))
		{
			Notifier.onDefaultError();
		}
	}
}
