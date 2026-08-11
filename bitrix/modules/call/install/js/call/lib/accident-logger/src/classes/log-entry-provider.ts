import { Type } from 'main.core';

export interface LogEntry
{
	id: string;
	message: string;
	timestamp: string;
	data: Record<string, unknown>;
}

export interface GroupedLog extends LogEntry
{
	ids: string[];
	count: number;
}

interface BrowserMetadata
{
	mobile?: boolean;
	brands?: { brand: string; version: string }[];
	clientHints?: {
		fullVersionList?: { brand: string; version: string }[];
		platform?: string;
		platformVersion?: string;
		architecture?: string;
		model?: string;
		uaFullVersion?: string;
	};
}

type LogMetadata = {
	connectionType: string;
	online: string;
	sessionId: string;
	userId: string;
} & BrowserMetadata;

export type SnapshotErrorReporter = (error: unknown, message: string) => void;

export class LogEntryProvider
{
	#browserMetadataSnapshotPromise: null | Promise<BrowserMetadata> = null;
	#userId: string;
	#storedSessionIdKey: string = 'call_accidentLogger_sessionId';

	onSnapshotError: SnapshotErrorReporter | null = null;
	maxMessageLength: number = 100;
	maxErrorMessageLength: number = 100;
	maxErrorStackLength: number = 500;

	/**
	 * @param {string} userId current user id
	 */
	constructor(userId: string)
	{
		this.#userId = userId;
		this.#generateSessionId();
	}

	get sessionId(): string
	{
		return sessionStorage.getItem(this.#storedSessionIdKey) || this.#generateSessionId();
	}

	async createLogEntry(error: Error | null, message: string): Promise<LogEntry>
	{
		const metadata = await this.#getMetadata();

		let safeMessage = '';
		if (message)
		{
			safeMessage = message;
		}

		let safeError = null;
		if (error)
		{
			safeError = {
				name: error.name,
				message: this.#truncate(error.message, this.maxErrorMessageLength),
				stack: error.stack ? this.#truncate(error.stack, this.maxErrorStackLength) : null,
			};

			if (!safeMessage)
			{
				safeMessage = `${safeError.name}: ${safeError.message}`;
			}
		}

		if (safeMessage)
		{
			safeMessage = this.#truncate(safeMessage, this.maxMessageLength);
		}

		return {
			id: new Date().toISOString() + Math.random().toString(36).slice(2, 11),
			message: safeMessage,
			timestamp: new Date().toISOString(),
			data: {
				...safeError,
				...metadata,
			},
		};
	}

	destroy(): void
	{
		this.#browserMetadataSnapshotPromise = null;
		this.onSnapshotError = null;
	}

	#generateSessionId(): string
	{
		const id = new Date().toISOString() + Math.random().toString(36).slice(2, 11);
		sessionStorage.setItem(this.#storedSessionIdKey, id);

		return id;
	}

	async #getMetadata(): Promise<LogMetadata>
	{
		// @ts-expect-error [call-ts] Network Information API is not in DOM types
		const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
		const browserSnapshot = await this.#getOrCreateBrowserMetadataSnapshot();

		return {
			connectionType: connection?.effectiveType || 'unknown',
			online: navigator.onLine ? 'online' : 'offline',
			sessionId: this.sessionId,
			userId: this.#userId,
			...browserSnapshot,
		};
	}

	async #getOrCreateBrowserMetadataSnapshot(): Promise<BrowserMetadata>
	{
		if (this.#browserMetadataSnapshotPromise === null)
		{
			this.#browserMetadataSnapshotPromise = this.#buildBrowserMetadataSnapshot().catch((error) => {
				if (this.onSnapshotError)
				{
					this.onSnapshotError(error, 'Call: browser metadata snapshot failed');
				}

				return {};
			});
		}

		return this.#browserMetadataSnapshotPromise;
	}

	async #buildBrowserMetadataSnapshot(): Promise<BrowserMetadata>
	{
		const meta: Partial<BrowserMetadata> = {};
		// @ts-expect-error [call-ts]
		const uaData = navigator.userAgentData;

		if (!uaData)
		{
			return meta;
		}

		if (Type.isBoolean(uaData.mobile))
		{
			meta.mobile = uaData.mobile;
		}

		if (Type.isArrayFilled(uaData.brands))
		{
			meta.brands = uaData.brands.map(({ brand, version }: { brand: string, version: string }) => ({ brand, version }));
		}

		if (Type.isFunction(uaData.getHighEntropyValues))
		{
			try
			{
				const hints = await uaData.getHighEntropyValues([
					'fullVersionList',
					'platform',
					'platformVersion',
					'architecture',
					'model',
					'uaFullVersion',
				]);

				meta.clientHints = {
					fullVersionList: hints.fullVersionList
						?.map(({ brand, version }: { brand: string, version: string }) => ({ brand, version })),
					platform: hints.platform,
					platformVersion: hints.platformVersion,
					architecture: hints.architecture,
					model: hints.model,
					uaFullVersion: hints.uaFullVersion,
				};

				if (Type.isArrayFilled(meta.clientHints.fullVersionList))
				{
					delete meta.brands;
				}
			}
			catch
			{
				// denied, iframe, or unsupported hints
			}
		}

		return meta;
	}

	#truncate(str: string, maxLen: number): string
	{
		if (!Type.isString(str) || str.length <= maxLen)
		{
			return str;
		}

		return `${str.slice(0, maxLen - 10)} [truncated]`;
	}
}
