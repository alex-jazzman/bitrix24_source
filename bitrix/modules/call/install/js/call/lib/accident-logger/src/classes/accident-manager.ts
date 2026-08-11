import { Type, Event } from 'main.core';
import { CallSettingsManager } from 'call.lib.settings-manager';
import { groupLogs } from '../utils/group-logs';
import { isStorageLimitError } from '../utils/is-storage-limit-error';
import { AccidentLoggerError } from './accident-logger-error';
import { type AccidentStorage } from './accident-storage';
import { LogEntryProvider, type LogEntry, type GroupedLog } from './log-entry-provider';

export class AccidentManager
{
	#logEntryProvider: LogEntryProvider;
	#storage: AccidentStorage;
	#isStorageWritingEnabled: boolean;
	#bufferedEntries: LogEntry[] = [];
	#bufferFlushTimeout: ReturnType<typeof setTimeout> | undefined;
	#isBufferFlushing: boolean = false;
	localStorageSendingSessionIdKey: string;
	minLogLifetime: number;
	sendInterval: number;
	maxLogLifetime: number;
	isEnabled: boolean;
	sendingLoopTimeout: ReturnType<typeof setTimeout> | undefined;

	/**
	 * @param {AccidentStorage} storage instance of AccidentStorage
	 * @param {LogEntryProvider} logEntryProvider builds LogEntry from raw error/message
	 * @param {number} sendIntervalSecs send interval in seconds
	 *   */
	constructor(storage: AccidentStorage, logEntryProvider: LogEntryProvider, sendIntervalSecs: number = 60)
	{
		this.localStorageSendingSessionIdKey = 'bx-call-accidentLogger-sendingSessionId';
		this.#storage = storage;
		this.#isStorageWritingEnabled = true;
		this.#logEntryProvider = logEntryProvider;
		this.#logEntryProvider.onSnapshotError = (error, message) => {
			void this.addLog(AccidentLoggerError.getByError(error), message);
		};
		this.minLogLifetime = 10 * 1000;
		this.sendInterval = sendIntervalSecs * 1000;
		this.maxLogLifetime = 30 * 60 * 1000;
		this.isEnabled = this.minLogLifetime <= this.sendInterval
			&& this.sendInterval <= this.maxLogLifetime
			&& this.minLogLifetime <= this.#storage.maxAge
			&& this.#storage.maxAge <= this.maxLogLifetime;
		if (!this.isEnabled)
		{

			return;
		}
		this.sendingLoop = this.sendingLoop.bind(this);
		this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
		void this.sendingLoop();
		this.#setupGlobalErrorHandlers();
	}

	get sessionId(): string
	{
		return this.#logEntryProvider.sessionId;
	}

	get isSending()
	{
		const storedSendingSessionId = localStorage.getItem(this.localStorageSendingSessionIdKey);

		return storedSendingSessionId === this.sessionId;
	}

	set isSending(value)
	{
		localStorage.setItem(this.localStorageSendingSessionIdKey, value ? this.sessionId : '');
	}

	async sendingLoop()
	{
		if (!this.isEnabled)
		{
			return;
		}
		const previousIsStorageWritingEnabled = this.#isStorageWritingEnabled;

		if (!this.isSending)
		{
			this.isSending = true;
			await this.#sendStorageLogs();
			this.isSending = false;
		}

		if (Type.isNumber(this.sendingLoopTimeout))
		{
			clearTimeout(this.sendingLoopTimeout);
		}

		if (!previousIsStorageWritingEnabled)
		{
			return;
		}

		this.sendingLoopTimeout = setTimeout(this.sendingLoop, this.sendInterval);
	}

	async addLog(error: Error | null = null, message: string = '')
	{
		if (!this.isEnabled)
		{
			return;
		}

		let entry: LogEntry | null = null;
		try
		{
			entry = await this.#logEntryProvider.createLogEntry(error, message);
		}
		catch (creationError)
		{
			console.error(message, error);
			console.error('[accident-logger] log entry creation error', creationError);

			return;
		}

		try
		{
			if (this.#isStorageWritingEnabled)
			{
				try
				{
					await this.#storage.addLog(entry);
				}
				catch (storageError)
				{
					if (storageError && isStorageLimitError(storageError as unknown as Error))
					{
						this.#isStorageWritingEnabled = false;
						await this.#enqueueBuffered(entry);

						return;
					}

					throw storageError;
				}
			}
			else
			{
				await this.#enqueueBuffered(entry);
			}
		}
		catch (storageError)
		{
			console.error(message, error);
			console.error('[accident-logger] log addition error', storageError);
		}
	}

	/**
	 * Disabled-storage transport: instead of firing one POST per addLog (which
	 * would flood the network on error bursts), accumulate entries in memory
	 * and flush when either the buffer reaches `selectLimit` or `sendInterval`
	 * elapses since the first buffered entry. handleBeforeUnload also flushes.
	 */
	async #enqueueBuffered(entry: LogEntry): Promise<void>
	{
		this.#bufferedEntries.push(entry);
		if (this.#bufferedEntries.length >= this.#storage.selectLimit)
		{
			if (this.#isBufferFlushing)
			{
				// stop parallel POST
				if (this.#bufferedEntries.length > this.#storage.selectLimit)
				{
					// #bufferedEntries equals or less this.#storage.selectLimit
					this.#bufferedEntries.shift();
				}
				this.#scheduleBufferFlush();

				return;
			}
			// Fire-and-forget: #isBufferFlushing is set synchronously inside
			// #flushBuffer before the first await, so subsequent enqueueBuffered
			// calls correctly observe the in-flight state. Avoids blocking
			// addLog's caller on the full network RTT.
			void this.#flushBuffer();
		}
		else
		{
			this.#scheduleBufferFlush();
		}
	}

	#scheduleBufferFlush(): void
	{
		if (Type.isNumber(this.#bufferFlushTimeout))
		{
			return;
		}
		this.#bufferFlushTimeout = setTimeout(() => {
			this.#bufferFlushTimeout = undefined;
			void this.#flushBuffer();
		}, this.sendInterval);
	}

	async #flushBuffer(): Promise<void>
	{
		if (Type.isNumber(this.#bufferFlushTimeout))
		{
			clearTimeout(this.#bufferFlushTimeout);
			this.#bufferFlushTimeout = undefined;
		}

		if (this.#bufferedEntries.length === 0)
		{
			return;
		}

		// Snapshot-and-clear
		const toSend = this.#bufferedEntries;
		this.#bufferedEntries = [];
		this.#isBufferFlushing = true;
		let batch: GroupedLog[] = [];

		try
		{
			const grouped = groupLogs(toSend);

			// Defensive chunking: respect the keepalive 64KB-per-request cap.
			for (batch of this.chunks(grouped, this.#storage.batchSize))
			{
				// eslint-disable-next-line no-await-in-loop
				await this.#postErrtrack(batch);
			}
		}
		catch (error)
		{
			console.error('[accident-logger] failed batch:', batch);
			if (error)
			{
				void this.addLog(AccidentLoggerError.getByError(error));
			}
		}
		finally
		{
			this.#isBufferFlushing = false;
		}
	}

	#setupGlobalErrorHandlers()
	{
		Event.bind(window, 'beforeunload', this.handleBeforeUnload);
	}

	#removeGlobalErrorHandlers()
	{
		Event.unbind(window, 'beforeunload', this.handleBeforeUnload);
	}

	async handleBeforeUnload()
	{
		if (!this.isEnabled)
		{
			return;
		}

		if (Type.isNumber(this.sendingLoopTimeout))
		{
			clearTimeout(this.sendingLoopTimeout);
			this.sendingLoopTimeout = undefined;
		}

		if (Type.isNumber(this.#bufferFlushTimeout))
		{
			clearTimeout(this.#bufferFlushTimeout);
			this.#bufferFlushTimeout = undefined;
		}

		try
		{
			if (!this.isSending)
			{
				await this.#sendStorageLogs(true);
			}

			if (!this.#isStorageWritingEnabled)
			{
				// Flush in-memory buffer (disabled-storage mode) before unload.
				// fetch(keepalive: true) keeps the request alive past page death.
				await this.#flushBuffer();
			}
		}
		finally
		{
			this.destroy();
		}
	}

	async #postErrtrack(logs: GroupedLog[]): Promise<Response>
	{
		// Strip `ids` from the wire payload: server only needs `count`
		const body = JSON.stringify(logs, (key, value) => (key === 'ids' ? undefined : value));
		const sizeKib = (new Blob([body]).size / 1024).toFixed(2);
		const url = `${CallSettingsManager.callBalancerUrl}/errtrack`;

		const { count, groupCount } = logs.reduce((acc, curr) => ({
			count: acc.count + curr.count,
			groupCount: acc.groupCount + 1,
		}), { count: 0, groupCount: 0 });

		try
		{
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body,
				keepalive: true,
				credentials: 'same-origin',
			});

			if (!response.ok)
			{
				throw new AccidentLoggerError(
					`Sending error, count ${count} (${groupCount} groups), size ${sizeKib} KiB, `
					+ `response [${response.status} ${response.statusText}]`,
				);
			}

			return response;
		}
		catch (rawError)
		{
			if (rawError instanceof AccidentLoggerError
				|| !(rawError instanceof Error)
				|| !rawError.message)
			{
				throw rawError;
			}

			const error = AccidentLoggerError.getByError(rawError);
			error.message = `Sending error, count ${count} (${groupCount} groups), size ${sizeKib} KiB, ${rawError.message}`;

			throw error;
		}
	}

	* chunks<T>(arr: T[], size: number): Generator<T[]>
	{
		for (let i = 0; i < arr.length; i += size)
		{
			yield arr.slice(i, i + size);
		}
	}

	async #sendStorageLogs(isBeforeUnload = false)
	{
		try
		{
			const logs = await this.#storage.getLogs(this.#isStorageWritingEnabled);

			if (logs.length === 0)
			{
				if (this.#isStorageWritingEnabled && !isBeforeUnload)
				{
					await this.#storage.deleteLogs();
				}
				else if (!this.#isStorageWritingEnabled)
				{
					void this.#storage.clearDatabase().catch((error) => {
						this.addLog(AccidentLoggerError.getByError(error));
					});
				}

				return;
			}

			// chunks() is needed only for the non-batch fallback path:
			// getLogs(true) already slices to batchSize (single chunk), but
			// getLogs(false) returns up to selectLimit groups — the last ~490
			// records pulled from IndexedDB right before the DB is cleared.
			for (const batch of this.chunks(logs, this.#storage.batchSize))
			{
				// eslint-disable-next-line no-await-in-loop
				await this.#postErrtrack(batch);
			}

			if (this.#isStorageWritingEnabled)
			{
				const idsToDelete = logs.flatMap(({ ids }) => ids);
				await this.#storage.deleteLogsBatch(idsToDelete);

				if (!isBeforeUnload)
				{
					await this.#storage.deleteLogs();
				}
			}
			else
			{
				void this.#storage.clearDatabase().catch((error) => {
					this.addLog(AccidentLoggerError.getByError(error));
				});
			}
		}
		catch (error)
		{
			if (!error)
			{
				return;
			}

			if (isStorageLimitError(error as unknown as Error))
			{
				if (this.#isStorageWritingEnabled)
				{
					this.#isStorageWritingEnabled = false;
				}
				else
				{
					console.error('[accident-logger] log sending error', error);
				}
			}
			else if (isBeforeUnload)
			{
				// destroy() follows; fire-and-forget would race against it.
				await this.addLog(AccidentLoggerError.getByError(error));
			}
			else
			{
				void this.addLog(AccidentLoggerError.getByError(error));
			}
		}
	}

	destroy()
	{
		clearTimeout(this.sendingLoopTimeout);
		this.sendingLoopTimeout = undefined;
		if (Type.isNumber(this.#bufferFlushTimeout))
		{
			clearTimeout(this.#bufferFlushTimeout);
			this.#bufferFlushTimeout = undefined;
		}
		this.#removeGlobalErrorHandlers();
		if (this.isSending)
		{
			this.isSending = false;
		}
		this.isEnabled = false;
		this.#storage.destroy();
		this.#logEntryProvider.destroy();
	}
}
