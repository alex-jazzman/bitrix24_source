import { AccidentLoggerError } from './accident-logger-error';
import { Type } from 'main.core';

export class AccidentStorage
{
	/**
	 * @param {number} maxAgeSecs second count to clear by age
	 * @param {number} batchSize batch size to get
	 */
	constructor(maxAgeSecs = 60, batchSize = 100) {
		this.dbName = 'bx_call_accidentLogDB';
		this.storeName = 'bx_call_accidentLogs';

		// OPEN
		// function to open blocked indexedDB with progressive delay (100ms, 400ms, 900ms...)
		this.getDBOpeningDelay = (retryCount) => 100 * (retryCount + 1) ** 2;
		// max retry count to open blocked indexedDB
		this.maxDBOpeningRetryCount = 5;

		// GET
		// grouped record batch size
		this.batchSize = batchSize;
		// circle iteration limit to select record for grouping
		this.selectLimit = this.batchSize * 10;
		// property name for grouping
		this.groupHashProp = 'message';

		/** CLEAR */
		// time to clear by seconds
		this.maxAgeSecs = maxAgeSecs * 1000;
		// record limit to clear
		this.maxRecords = 1000;
		// interval to clear
		this.pruneInterval = 2 * 1000;
		// last clean time
		this.lastPruneTime = 0;
		// circle iteration limit to select deleted record
		this.scanLimit = 200;

		// MESSAGE
		this.maxMessageLength = 100;
		this.maxErrorMessageLength = 100;
		this.maxErrorStackLength = 500;
		this.storedSessionIdKey = 'call_accidentLogger_sessionId';

		this.#generateSessionId();
	}

	async openDB(retryCount = 0) {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, 1);

			request.onblocked = () => {
				if (retryCount < this.maxDBOpeningRetryCount)
				{
					const delay = this.getDBOpeningDelay(retryCount);
					clearTimeout(this.openDBRetryTimeout);
					this.openDBRetryTimeout = setTimeout(() => resolve(this.openDB(retryCount + 1)), delay);
				}
				else
				{
					reject(new AccidentLoggerError('Log storage connection attempt limit exceeded'));
				}
			};

			request.onupgradeneeded = (event) => {
				const db = event.target.result;
				if (!db.objectStoreNames.contains(this.storeName))
				{
					const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
					store.createIndex('timestamp', 'timestamp', { unique: false });
				}
			};

			request.onsuccess = (event) => {
				const db = event.target.result;

				db.onversionchange = () => {
					console.warn('Call: log storage connection closed...');
					db.close();
				};

				resolve(db);
			};
			request.onerror = (event) => reject(event.target.error);
		});
	}

	/**
	 *
	 * @param {Error|null} error
	 * @param {string} message
	 * @returns {Promise<void>}
	 */
	async addLog(errorToLog = null, message = '') {
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

			await store.add(this.#createLogEntry(errorToLog, message));

			await this.#pruneInTransaction(store, index, transaction);

			await transactionPromise;
			db.close();
		}
		catch (error)
		{
			await console.error('Call: log addition error', error);

			await this.#abort(transaction, transactionPromise);

			if (db)
			{
				db.close();
			}
		}
	}

	async deleteLogs() {
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

			await this.#pruneInTransaction(store, index, transaction);

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

	async getLogsBatch() {
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
			 * @see this.maxAgeSecs
			 * @see this.maxRecords
			 * @see this.scanLimit
			 * */
			const cutoff = new Date(Date.now() - this.maxAgeSecs).toISOString();
			const range = IDBKeyRange.lowerBound(cutoff, true);

			const logs = [];
			await this.#whileCursor(
				index,
				(readingCursor) => {
					logs.push(readingCursor.value);
				},
				range,
				() => logs.length < this.selectLimit,
			);

			await transactionPromise;
			db.close();

			const groupedLogs = this.#groupLogs(logs);
			return groupedLogs.slice(0, this.batchSize);
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

	#groupLogs(logs)
	{
		const groups = new Map();

		for (const log of logs)
		{
			const hash = log[this.groupHashProp];

			if (groups.has(hash))
			{
				const groupedLog = groups.get(hash);
				groupedLog.count++;
				groupedLog.ids.push(log.id);
			}
			else
			{
				groups.set(hash, {
					...log,
					ids: [log.id],
					count: 1,
				});
			}
		}

		return [...groups.values()];
	}

	async deleteLogsBatch(ids) {
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
				// eslint-disable-next-line no-await-in-loop
				await store.delete(id);
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

	#createLogEntry(error, message) {
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
				...this.#getMetadata(),
			},
		};
	}

	get sessionId() {
		return sessionStorage.getItem(this.storedSessionIdKey) || this.#generateSessionId();
	}

	#generateSessionId() {
		const id = new Date().toISOString() + Math.random().toString(36).slice(2, 11);
		sessionStorage.setItem(this.storedSessionIdKey, id);

		return id;
	}

	#getMetadata() {
		const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

		return {
			connectionType: connection?.effectiveType || 'unknown',
			online: navigator.onLine ? 'online' : 'offline',
			sessionId: this.sessionId,
		};
	}

	#truncate(str, maxLen) {
		if (!Type.isString(str) || str.length <= maxLen)
		{
			return str;
		}

		return `${str.slice(0, maxLen - 10)} [truncated]`;
	}

	async #pruneInTransaction(store, index, transaction) {
		const now = Date.now();
		if (now - this.lastPruneTime < this.pruneInterval)
		{
			return;
		}

		let deletedCount = 0;

		// Clear by age
		const cutoff = new Date(now - this.maxAgeSecs).toISOString();
		const ageRange = IDBKeyRange.upperBound(cutoff);
		const keysToDeleteByAge = [];
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
			await store.delete(range);
			deletedCount += keysToDeleteByAge.length;
		}

		// Clear by record limit
		const currentCount = await this.#promiseForRequest(store.count());
		if (currentCount > this.maxRecords)
		{
			const overLimit = currentCount - this.maxRecords;

			const keysToDeleteByLimit = [];
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
				await store.delete(range);
				deletedCount += keysToDeleteByLimit.length;
			}
		}

		if (deletedCount > 0)
		{
			this.lastPruneTime = now;
		}
	}

	#whileCursor(store, callback, range, condition = () => true, direction = 'next') {
		return new Promise((resolve, reject) => {
			const cursorRequest = store.openCursor(range, direction);

			cursorRequest.onsuccess = function(event) {
				try
				{
					const cursor = event.target.result;

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

			cursorRequest.onerror = function(event) {
				reject(event.target.error);
			};
		});
	}

	#promiseForRequest(request) {
		return new Promise((resolve, reject) => {
			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = () => {
				reject(request.error);
			};
		});
	}

	/**
	 * @param {IDBTransaction} transaction
	 * @returns {Promise}
	 */
	#complete(transaction) {
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line no-param-reassign
			transaction.oncomplete = () => {
				resolve();
			};

			// eslint-disable-next-line no-param-reassign
			transaction.onerror = (event) => {
				reject(event.target.error);
			};

			// eslint-disable-next-line no-param-reassign
			transaction.onabort = (event) => {
				reject(event.target.error);
			};
		});
	}

	/**
	 * @param {IDBTransaction} transaction
	 * @param {Promise} transactionPromise
	 */
	async #abort(transaction, transactionPromise) {
		if (transactionPromise && transaction)
		{
			transaction.abort();
			try
			{
				await transactionPromise;
			}
			catch
			{
				// skip, because #abort errors are caught in the calling function
			}
		}
	}

	destroy() {
		clearTimeout(this.openDBRetryTimeout);
	}
}
