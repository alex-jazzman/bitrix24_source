import { groupLogs } from '../utils/group-logs';
import { AccidentLoggerError } from './accident-logger-error';
import { type LogEntry, type GroupedLog } from './log-entry-provider';

export class AccidentStorage
{
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
	constructor(maxAgeSecs: number)
	{
		this.dbName = 'bx_call_accidentLogDB';
		this.storeName = 'bx_call_accidentLogs';

		// OPEN
		// function to open blocked indexedDB with progressive delay (100ms, 400ms, 900ms...)
		this.getDBOpeningDelay = (retryCount) => 100 * (retryCount + 1) ** 2;
		// max retry count to open blocked indexedDB
		this.maxDBOpeningRetryCount = 5;

		// GET
		// grouped record batch size — chosen so that JSON body of a single send
		// (consumed as fetch `keepalive: true` payload in handleBeforeUnload)
		// stays under the 64 KB per-request quota the spec imposes on keepalive
		this.batchSize = 49;
		// max raw records to scan when building a send batch — 10× headroom over
		// batchSize so that after grouping by `message` we still have enough
		// distinct groups to fill the batch even when most records collide
		this.selectLimit = this.batchSize * 10;

		/** CLEAR */
		// time to clear by milliseconds
		this.maxAge = maxAgeSecs * 1000;
		// record limit to clear
		this.maxRecords = 1000;
		// interval to clear
		this.pruneInterval = 2 * 1000;
		// last clean time
		this.lastPruneTime = 0;
		// circle iteration limit to select deleted record
		this.scanLimit = 200;

	}

	async openDB(retryCount: number = 0): Promise<IDBDatabase>
	{
		return this.#openDBInternal(retryCount, 0);
	}

	// Recovers from a "version N without store" state: if the page died between
	// indexedDB.open() and the onupgradeneeded callback (e.g. async
	// handleBeforeUnload), Firefox can commit the version bump without
	// running createObjectStore. We detect that in onsuccess and re-open at
	// version+1 to force upgrade.
	//
	// `requestedVersion` is undefined on first attempt — per IDB spec, this
	// opens the DB at its current version if it exists, or creates it at v1
	// if not. We avoid hard-coding `1`, because a previous schema fix may
	// have bumped the stored DB above v1, and requesting a lower version
	// throws VersionError.
	async #openDBInternal(
		retryCount: number,
		schemaFixAttempts: number,
		requestedVersion?: number,
	): Promise<IDBDatabase>
	{
		return new Promise((resolve, reject) => {
			const request = requestedVersion === undefined
				? indexedDB.open(this.dbName)
				: indexedDB.open(this.dbName, requestedVersion);

			request.onblocked = () => {
				if (retryCount < this.maxDBOpeningRetryCount)
				{
					const delay = this.getDBOpeningDelay(retryCount);
					clearTimeout(this.openDBRetryTimeout);
					this.openDBRetryTimeout = setTimeout(
						() => resolve(this.#openDBInternal(retryCount + 1, schemaFixAttempts, requestedVersion)),
						delay,
					);
				}
				else
				{
					reject(new AccidentLoggerError('Log storage connection attempt limit exceeded'));
				}
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(this.storeName))
				{
					const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
					store.createIndex('timestamp', 'timestamp', { unique: false });
				}
			};

			request.onsuccess = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				if (!db.objectStoreNames.contains(this.storeName))
				{
					const nextVersion = db.version + 1;
					db.close();
					if (schemaFixAttempts >= 2)
					{
						reject(new AccidentLoggerError('Log storage schema fix failed'));

						return;
					}

					resolve(this.#openDBInternal(retryCount, schemaFixAttempts + 1, nextVersion));

					return;
				}

				db.onversionchange = () => {
					console.warn('[accident-logger] log storage connection closed...');
					db.close();
				};

				resolve(db);
			};

			request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
		});
	}

	/**
	 * Drops the entire database. Uses `indexedDB.deleteDatabase()` which is a
	 * top-level operation (not a transaction), so it doesn't need free quota for
	 * an undo journal — works even when the store is at the storage limit, where
	 * `clear()` / `delete(range)` would themselves throw QuotaExceededError.
	 */
	clearDatabase(): Promise<boolean>
	{
		clearTimeout(this.openDBRetryTimeout);

		return new Promise((resolve, reject) => {
			const request = indexedDB.deleteDatabase(this.dbName);
			request.onsuccess = () => resolve(true);
			request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
			request.onblocked = () => {
				console.warn(`[accident-logger] log storage ${this.dbName} deletion blocked`);
				resolve(false);
			};
		});
	}

	async addLog(entry: LogEntry)
	{
		let db = null;
		let transaction = null;
		let transactionPromise = null;
		try
		{
			db = await this.openDB();
			transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);
			const index = store.index('timestamp');
			transactionPromise = this.#complete(transaction);

			store.add(entry);

			await this.#pruneInTransaction(store, index);

			await transactionPromise;
			db.close();
		}
		catch (error)
		{
			await this.#abort(transaction, transactionPromise);

			if (db)
			{
				db.close();
			}
			throw error;
		}
	}

	async deleteLogs()
	{
		let db = null;
		let transaction = null;
		let transactionPromise = null;
		try
		{
			db = await this.openDB();
			transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);
			const index = store.index('timestamp');
			transactionPromise = this.#complete(transaction);

			await this.#pruneInTransaction(store, index);

			await transactionPromise;
			db.close();
		}
		catch (error)
		{
			await this.#abort(transaction, transactionPromise);

			if (db)
			{
				db.close();
			}
			throw error;
		}
	}

	async getLogs(isBatch = false) : Promise<GroupedLog[]>
	{
		let db = null;
		let transaction = null;
		let transactionPromise = null;

		try
		{
			db = await this.openDB();
			transaction = db.transaction(this.storeName, 'readonly');
			const store = transaction.objectStore(this.storeName);
			const index = store.index('timestamp');
			transactionPromise = this.#complete(transaction);

			/** get only fresh records, because there is old record deletion by limits
			 * @see this.maxAge
			 * @see this.maxRecords
			 * @see this.scanLimit
			 * */
			const cutoff = new Date(Date.now() - this.maxAge).toISOString();
			const range = IDBKeyRange.lowerBound(cutoff, true);

			const logs: LogEntry[] = [];
			// Scan direction:
			//  - isBatch=true (persistent storage): 'next' walks oldest→newest within
			//    the fresh window — FIFO send, oldest go out first.
			//  - isBatch=false (fallback before the IndexedDB is wiped): 'prev' walks
			//    newest→oldest so we grab the LAST ~selectLimit records from
			//    IndexedDB before the database is cleared.
			await this.#whileCursor(
				index,
				(readingCursor) => {
					logs.push(readingCursor.value);
				},
				range,
				() => logs.length < this.selectLimit,
				isBatch ? 'next' : 'prev',
			);

			await transactionPromise;

			const groupedLogs = groupLogs(logs);

			return isBatch ? groupedLogs.slice(0, this.batchSize) : groupedLogs;
		}
		catch (error)
		{
			await this.#abort(transaction, transactionPromise);

			throw error;
		}
		finally
		{
			db?.close();
		}
	}

	async deleteLogsBatch(ids: string[])
	{
		let db = null;
		let transaction = null;
		let transactionPromise = null;
		try
		{
			db = await this.openDB();
			transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);
			transactionPromise = this.#complete(transaction);

			for (const id of ids)
			{
				store.delete(id);
			}

			await transactionPromise;
			db.close();
		}
		catch (error)
		{
			await this.#abort(transaction, transactionPromise);

			if (db)
			{
				db.close();
			}
			throw error;
		}
	}

	async #pruneInTransaction(store: IDBObjectStore, index: IDBIndex): Promise<void>
	{
		const now = Date.now();
		if (now - this.lastPruneTime < this.pruneInterval)
		{
			return;
		}

		let deletedCount = 0;

		// Clear by age
		const cutoff = new Date(now - this.maxAge).toISOString();
		const ageRange = IDBKeyRange.upperBound(cutoff);
		const keysToDeleteByAge: IDBValidKey[] = [];
		await this.#whileCursor(
			index,
			(ageCursor) => {
				keysToDeleteByAge.push(ageCursor.primaryKey);
			},
			ageRange,
			() => keysToDeleteByAge.length < this.scanLimit,
		);

		if (keysToDeleteByAge.length > 0)
		{
			const range = IDBKeyRange.bound(keysToDeleteByAge[0], keysToDeleteByAge[keysToDeleteByAge.length - 1]);
			store.delete(range);
			deletedCount += keysToDeleteByAge.length;
		}

		// Clear by record limit
		const currentCount = await this.#promiseForRequest(store.count());
		if (currentCount > this.maxRecords)
		{
			const overLimit = currentCount - this.maxRecords;

			const keysToDeleteByLimit: IDBValidKey[] = [];
			await this.#whileCursor(
				index,
				(limitCursor) => {
					keysToDeleteByLimit.push(limitCursor.primaryKey);
				},
				undefined,
				() => keysToDeleteByLimit.length < Math.min(overLimit, this.scanLimit),
			);

			if (keysToDeleteByLimit.length > 0)
			{
				const range = IDBKeyRange.bound(keysToDeleteByLimit[0], keysToDeleteByLimit[keysToDeleteByLimit.length - 1]);
				store.delete(range);
				deletedCount += keysToDeleteByLimit.length;
			}
		}

		if (deletedCount > 0)
		{
			this.lastPruneTime = now;
		}
	}

	#whileCursor(
		store: IDBObjectStore | IDBIndex,
		callback: (cursor: IDBCursorWithValue) => void,
		range?: IDBKeyRange,
		condition: () => boolean = () => true,
		direction: IDBCursorDirection = 'next',
	): Promise<void>
	{
		return new Promise((resolve, reject) => {
			const cursorRequest = store.openCursor(range, direction);

			cursorRequest.onsuccess = function(event)
			{
				try
				{
					const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

					if (cursor && condition())
					{
						callback(cursor);
						cursor.continue();
					}
					else
					{
						resolve();
					}
				}
				catch (error)
				{
					reject(error);
				}
			};

			cursorRequest.onerror = function(event)
			{
				reject((event.target as IDBRequest).error);
			};
		});
	}

	#promiseForRequest<T>(request: IDBRequest<T>): Promise<T>
	{
		return new Promise((resolve, reject) => {
			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = () => {
				reject(request.error);
			};
		});
	}

	#complete(transaction: IDBTransaction): Promise<void>
	{
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line no-param-reassign
			transaction.oncomplete = () => {
				resolve();
			};

			// eslint-disable-next-line no-param-reassign
			transaction.onerror = (event) => {
				reject((event.target as IDBTransaction).error);
			};

			// eslint-disable-next-line no-param-reassign
			transaction.onabort = (event) => {
				reject((event.target as IDBTransaction).error);
			};
		});
	}

	async #abort(transaction: IDBTransaction | null, transactionPromise: Promise<void> | null): Promise<void>
	{
		if (!transactionPromise || !transaction)
		{
			return;
		}

		// if the transaction is already finished, abort() throws InvalidStateError
		try
		{
			transaction.abort();
		}
		catch
		{
			// ignore: already committed/aborted or inactive
		}

		try
		{
			await transactionPromise;
		}
		catch
		{
			// skip, because #abort errors are caught in the calling function
		}
	}

	destroy()
	{
		clearTimeout(this.openDBRetryTimeout);
	}
}
