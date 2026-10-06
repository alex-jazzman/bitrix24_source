import { ajax, Type } from 'main.core';
import {
	type MigrationPublicStatus,
	type MigrationStateChange,
	type MigrationStateListener,
	type MigrationStatusDto,
	type MigrationVisibility,
} from './types';

const StatusBatchSize = 100;
const ActiveStatuses = new Set<MigrationPublicStatus>([
	'running',
	'waiting',
	'switching',
	'blocked',
	'cancelling',
]);
const TerminalStatuses = new Set<MigrationPublicStatus>(['done', 'cancelled']);

type StatusResponse = {
	data?: {
		statuses?: Record<string, unknown>,
	},
};

type StatusRequest = {
	resolve: (status: unknown) => void,
	reject: (error: unknown) => void,
};

let pendingStatusRequests = new Map<number, StatusRequest[]>();
let statusBatchScheduled = false;

async function requestStatusChunk(ids: number[]): Promise<{ ids: number[], statuses: Record<string, unknown> }>
{
	const response: StatusResponse = await ajax.runAction('mail.Migration.getStatuses', {
		data: { mailboxIds: ids },
	});

	return {
		ids,
		statuses: response?.data?.statuses ?? {},
	};
}

function requestStatus(mailboxId: number): Promise<unknown>
{
	return new Promise((resolve, reject) => {
		const requests = pendingStatusRequests.get(mailboxId) ?? [];
		requests.push({ resolve, reject });
		pendingStatusRequests.set(mailboxId, requests);
		if (statusBatchScheduled)
		{
			return;
		}

		statusBatchScheduled = true;
		void Promise.resolve().then((): void => {
			statusBatchScheduled = false;
			const batch = pendingStatusRequests;
			pendingStatusRequests = new Map();
			const mailboxIds = [...batch.keys()];
			const chunks: number[][] = [];
			for (let offset = 0; offset < mailboxIds.length; offset += StatusBatchSize)
			{
				chunks.push(mailboxIds.slice(offset, offset + StatusBatchSize));
			}
			void Promise.all(chunks.map((ids) => requestStatusChunk(ids))).then((responses): void => {
				responses.forEach(({ ids, statuses }): void => {
					ids.forEach((id): void => {
						const listeners = batch.get(id) ?? [];
						if (!Object.prototype.hasOwnProperty.call(statuses, String(id)))
						{
							const error = new Error(`Migration status for mailbox ${id} is absent.`);
							listeners.forEach((request): void => request.reject(error));

							return;
						}

						listeners.forEach((request): void => request.resolve(statuses[String(id)]));
					});
				});
			}).catch((error: unknown): void => {
				batch.forEach((listeners): void => {
					listeners.forEach((request): void => request.reject(error));
				});
			});
		});
	});
}

function createHiddenStatus(mailboxId: number): MigrationStatusDto
{
	return {
		mailboxId,
		visibility: 'hidden',
		status: null,
		reason: null,
	};
}

function normalizeStatus(payload: unknown): MigrationStatusDto | null
{
	if (!Type.isObject(payload))
	{
		return null;
	}

	const value = payload as Record<string, unknown>;
	const mailboxId = Number(value.mailboxId ?? 0);
	const visibility = value.visibility as MigrationVisibility;
	const status = (value.status ?? null) as MigrationPublicStatus;

	if (!Number.isInteger(mailboxId) || mailboxId <= 0)
	{
		return null;
	}

	if (!['hidden', 'active', 'terminal'].includes(visibility))
	{
		return null;
	}

	if (visibility === 'hidden' && status !== null)
	{
		return null;
	}

	if (visibility === 'active' && !ActiveStatuses.has(status))
	{
		return null;
	}

	if (visibility === 'terminal' && !TerminalStatuses.has(status))
	{
		return null;
	}

	return {
		mailboxId,
		visibility,
		status,
		reason: Type.isString(value.reason) ? value.reason : null,
	};
}

export class MigrationState
{
	#mailboxId: number;
	#status: MigrationStatusDto;
	#active = false;
	#listeners = new Set<MigrationStateListener>();
	#listenerSubscriptions = new Map<MigrationStateListener, number>();
	#subscriptionCount = 0;
	#initialization: Promise<MigrationStatusDto> | null = null;
	#initialized = false;
	#fingerprint = '';
	#pullRevision = 0;
	#retryTimer: ReturnType<typeof setTimeout> | null = null;
	#retryAttempts = 0;
	#destroyed = false;
	#onUnused: (state: MigrationState) => void;

	constructor(mailboxId: number, onUnused: (state: MigrationState) => void = (): void => {})
	{
		if (!Number.isInteger(mailboxId) || mailboxId <= 0)
		{
			throw new TypeError('Mailbox id must be a positive integer.');
		}

		this.#mailboxId = mailboxId;
		this.#status = createHiddenStatus(mailboxId);
		this.#fingerprint = this.#getFingerprint(this.#status);
		this.#onUnused = onUnused;
	}

	initialize(): Promise<MigrationStatusDto>
	{
		if (this.#initialized)
		{
			return Promise.resolve(this.#status);
		}

		if (this.#initialization)
		{
			return this.#initialization;
		}

		const pullRevision = this.#pullRevision;
		const initialization = requestStatus(this.#mailboxId).then((status): MigrationStatusDto => {
			if (this.#destroyed)
			{
				return this.#status;
			}

			if (pullRevision === this.#pullRevision)
			{
				this.#apply(status ?? createHiddenStatus(this.#mailboxId), 'initial');
			}
			this.#initialized = true;
			this.#retryAttempts = 0;
			this.#clearRetry();

			return this.#status;
		}).catch((): MigrationStatusDto => {
			if (!this.#destroyed)
			{
				this.#scheduleRetry();
			}

			return this.#status;
		}).finally((): void => {
			this.#initialization = null;
		});
		this.#initialization = initialization;

		return initialization;
	}

	getStatus(): MigrationStatusDto
	{
		return { ...this.#status };
	}

	isActive(): boolean
	{
		return this.#active;
	}

	isInitialized(): boolean
	{
		return this.#initialized;
	}

	subscribe(listener: MigrationStateListener): () => void
	{
		this.#listeners.add(listener);
		this.#listenerSubscriptions.set(listener, (this.#listenerSubscriptions.get(listener) ?? 0) + 1);
		this.#subscriptionCount++;
		let subscribed = true;

		return (): void => {
			if (!subscribed)
			{
				return;
			}

			subscribed = false;
			this.#subscriptionCount--;
			const listenerSubscriptionCount = (this.#listenerSubscriptions.get(listener) ?? 1) - 1;
			if (listenerSubscriptionCount === 0)
			{
				this.#listenerSubscriptions.delete(listener);
				this.#listeners.delete(listener);
			}
			else
			{
				this.#listenerSubscriptions.set(listener, listenerSubscriptionCount);
			}

			if (this.#subscriptionCount === 0)
			{
				this.#listeners.clear();
				this.#listenerSubscriptions.clear();
				this.#onUnused(this);
			}
		};
	}

	destroy(): void
	{
		this.#destroyed = true;
		this.#clearRetry();
		this.#listeners.clear();
		this.#listenerSubscriptions.clear();
		this.#subscriptionCount = 0;
	}

	applyPull(payload: unknown): void
	{
		if (!this.#destroyed && this.#apply(payload, 'pull'))
		{
			this.#pullRevision++;
			this.#initialized = true;
			this.#retryAttempts = 0;
			this.#clearRetry();
		}
	}

	#apply(payload: unknown, source: 'initial' | 'pull'): boolean
	{
		const status = normalizeStatus(payload);
		if (!status || status.mailboxId !== this.#mailboxId)
		{
			return false;
		}

		const fingerprint = this.#getFingerprint(status);
		if (fingerprint === this.#fingerprint)
		{
			if (source === 'pull' && status.visibility === 'terminal' && status.status === 'done')
			{
				const change: MigrationStateChange = {
					status: { ...status },
					active: false,
					previousActive: this.#active,
					source,
				};
				this.#listeners.forEach((listener): void => listener(change));

				return true;
			}

			return false;
		}

		const previousActive = this.#active;
		this.#status = status;
		this.#fingerprint = fingerprint;

		if (status.visibility === 'hidden')
		{
			this.#active = false;

			return true;
		}

		const active = status.visibility === 'active';
		if (active)
		{
			this.#active = true;
		}

		const change: MigrationStateChange = { status: { ...status }, active, previousActive, source };
		this.#listeners.forEach((listener): void => listener(change));

		if (!active)
		{
			this.#active = false;
		}

		return true;
	}

	#scheduleRetry(): void
	{
		if (this.#retryTimer !== null || this.#retryAttempts >= 3)
		{
			return;
		}

		this.#retryAttempts++;
		this.#retryTimer = setTimeout((): void => {
			this.#retryTimer = null;
			void this.initialize();
		}, 5000 * this.#retryAttempts);
	}

	#clearRetry(): void
	{
		if (this.#retryTimer !== null)
		{
			clearTimeout(this.#retryTimer);
			this.#retryTimer = null;
		}
	}

	#getFingerprint(status: MigrationStatusDto): string
	{
		return [status.mailboxId, status.visibility, status.status, status.reason].join('|');
	}
}
