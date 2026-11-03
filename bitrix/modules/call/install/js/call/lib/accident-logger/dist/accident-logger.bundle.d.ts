/* eslint-disable */
interface LogEntry {
	id: string;
	message: string;
	timestamp: string;
	data: Record<string, unknown>;
}

interface GroupedLog extends LogEntry {
	ids: string[];
	count: number;
}

type SnapshotErrorReporter = (error: unknown, message: string) => void;

type CallLogContextFields = {
	roomId?: string;
	callId?: number;
	chatId?: number;
	source?: string;
};

declare namespace BX.Call.Lib {
	const accidentLogger: AccidentManager;

	class AccidentManager {
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
		constructor(storage: AccidentStorage, logEntryProvider: LogEntryProvider, sendIntervalSecs?: number);
		get sessionId(): string;
		get isSending(): boolean;
		set isSending(value: boolean);
		sendingLoop(): Promise<void>;
		/**
		 * @param {?Error} error the error itself, when there is one
		 * @param {string} message text of the entry
		 * @param {string} source subsystem the entry comes from, so that entries of different subsystems
		 *   with the same message stay apart. Known values: 'copilot_record'. Empty means unset.
		 */
		addLog(error?: Error | null, message?: string, source?: string): Promise<void>;
		handleBeforeUnload(): Promise<void>;
		chunks<T>(arr: T[], size: number): Generator<T[]>;
		destroy(): void;
	}

	class AccidentStorage {
		dbName: string;
		storeName: string;
		getDBOpeningDelay: (retryCount: number) => number;
		maxDBOpeningRetryCount: number;
		batchSize: number;
		selectLimit: number;
		maxAge: number;
		maxRecords: number;
		pruneInterval: number;
		lastPruneTime: number;
		scanLimit: number;
		openDBRetryTimeout: ReturnType<typeof setTimeout> | undefined;
		/**
		 * @param {number} maxAgeSecs second count to clear by age
		 */
		constructor(maxAgeSecs: number);
		openDB(retryCount?: number): Promise<IDBDatabase>;
		/**
		 * Drops the entire database. Uses `indexedDB.deleteDatabase()` which is a
		 * top-level operation (not a transaction), so it doesn't need free quota for
		 * an undo journal — works even when the store is at the storage limit, where
		 * `clear()` / `delete(range)` would themselves throw QuotaExceededError.
		 */
		clearDatabase(): Promise<boolean>;
		addLog(entry: LogEntry): Promise<void>;
		deleteLogs(): Promise<void>;
		getLogs(isBatch?: boolean): Promise<GroupedLog[]>;
		deleteLogsBatch(ids: string[]): Promise<void>;
		destroy(): void;
	}

	class LogEntryProvider {
		onSnapshotError: SnapshotErrorReporter | null;
		maxMessageLength: number;
		maxErrorMessageLength: number;
		maxErrorStackLength: number;
		/**
		 * @param {string} userId current user id
		 */
		constructor(userId: string);
		get sessionId(): string;
		createLogEntry(error: Error | null, message: string, callContext?: CallLogContextFields): Promise<LogEntry>;
		destroy(): void;
	}
}
