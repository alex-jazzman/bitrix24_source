/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core, call_lib_settingsManager) {
	'use strict';

	function groupLogs(logs, hashProp = 'message') {
		const groups = new Map();
		for (const log of logs) {
			const hash = log[hashProp];
			const existing = groups.get(hash);
			if (existing) {
				existing.count++;
				existing.ids.push(log.id);
			} else {
				groups.set(hash, {
					...log,
					ids: [log.id],
					count: 1
				});
			}
		}
		return [...groups.values()];
	}

	function isStorageLimitError(error) {
		if (!(error instanceof DOMException)) {
			return false;
		}
		if (error.name === 'QuotaExceededError') {
			return true;
		}
		if (error.name === 'AbortError') {
			return true;
		}
		if (error.name === 'DataError' && /ioerror|blobs/i.test(error.message)) {
			return true;
		}
		return Boolean(error.name === 'UnknownError' && error.message.includes('The operation failed for reasons unrelated'));
	}

	class AccidentLoggerError extends Error {
		originalError;
		constructor(message) {
			super(message);
			this.name = 'CallAccidentLoggerError';
			this.originalError = null;
		}
		static getByError(error) {
			if (error instanceof AccidentLoggerError) {
				return error;
			}
			if (error instanceof Error) {
				const newError = new AccidentLoggerError(error.message);
				newError.stack = error.stack;
				if (error.name) {
					newError.name = `${newError.name}: ${error.name}`;
				}
				newError.originalError = error;
				return newError;
			}
			return new AccidentLoggerError(String(error));
		}
	}

	class AccidentManager {
		#logEntryProvider;
		#storage;
		#isStorageWritingEnabled;
		#bufferedEntries = [];
		#bufferFlushTimeout;
		#isBufferFlushing = false;
		localStorageSendingSessionIdKey;
		minLogLifetime;
		sendInterval;
		maxLogLifetime;
		isEnabled;
		sendingLoopTimeout;
		constructor(storage, logEntryProvider, sendIntervalSecs = 60) {
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
			this.isEnabled = this.minLogLifetime <= this.sendInterval && this.sendInterval <= this.maxLogLifetime && this.minLogLifetime <= this.#storage.maxAge && this.#storage.maxAge <= this.maxLogLifetime;
			if (!this.isEnabled) {
				return;
			}
			this.sendingLoop = this.sendingLoop.bind(this);
			this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
			void this.sendingLoop();
			this.#setupGlobalErrorHandlers();
		}
		get sessionId() {
			return this.#logEntryProvider.sessionId;
		}
		get isSending() {
			const storedSendingSessionId = localStorage.getItem(this.localStorageSendingSessionIdKey);
			return storedSendingSessionId === this.sessionId;
		}
		set isSending(value) {
			localStorage.setItem(this.localStorageSendingSessionIdKey, value ? this.sessionId : '');
		}
		async sendingLoop() {
			if (!this.isEnabled) {
				return;
			}
			const previousIsStorageWritingEnabled = this.#isStorageWritingEnabled;
			if (!this.isSending) {
				this.isSending = true;
				await this.#sendStorageLogs();
				this.isSending = false;
			}
			if (main_core.Type.isNumber(this.sendingLoopTimeout)) {
				clearTimeout(this.sendingLoopTimeout);
			}
			if (!previousIsStorageWritingEnabled) {
				return;
			}
			this.sendingLoopTimeout = setTimeout(this.sendingLoop, this.sendInterval);
		}
		async addLog(error = null, message = '') {
			if (!this.isEnabled) {
				return;
			}
			let entry = null;
			try {
				entry = await this.#logEntryProvider.createLogEntry(error, message);
			} catch (creationError) {
				console.error(message, error);
				console.error('[accident-logger] log entry creation error', creationError);
				return;
			}
			try {
				if (this.#isStorageWritingEnabled) {
					try {
						await this.#storage.addLog(entry);
					} catch (storageError) {
						if (storageError && isStorageLimitError(storageError)) {
							this.#isStorageWritingEnabled = false;
							await this.#enqueueBuffered(entry);
							return;
						}
						throw storageError;
					}
				} else {
					await this.#enqueueBuffered(entry);
				}
			} catch (storageError) {
				console.error(message, error);
				console.error('[accident-logger] log addition error', storageError);
			}
		}
		async #enqueueBuffered(entry) {
			this.#bufferedEntries.push(entry);
			if (this.#bufferedEntries.length >= this.#storage.selectLimit) {
				if (this.#isBufferFlushing) {
					if (this.#bufferedEntries.length > this.#storage.selectLimit) {
						this.#bufferedEntries.shift();
					}
					this.#scheduleBufferFlush();
					return;
				}
				void this.#flushBuffer();
			} else {
				this.#scheduleBufferFlush();
			}
		}
		#scheduleBufferFlush() {
			if (main_core.Type.isNumber(this.#bufferFlushTimeout)) {
				return;
			}
			this.#bufferFlushTimeout = setTimeout(() => {
				this.#bufferFlushTimeout = undefined;
				void this.#flushBuffer();
			}, this.sendInterval);
		}
		async #flushBuffer() {
			if (main_core.Type.isNumber(this.#bufferFlushTimeout)) {
				clearTimeout(this.#bufferFlushTimeout);
				this.#bufferFlushTimeout = undefined;
			}
			if (this.#bufferedEntries.length === 0) {
				return;
			}
			const toSend = this.#bufferedEntries;
			this.#bufferedEntries = [];
			this.#isBufferFlushing = true;
			let batch = [];
			try {
				const grouped = groupLogs(toSend);
				for (batch of this.chunks(grouped, this.#storage.batchSize)) {
					await this.#postErrtrack(batch);
				}
			} catch (error) {
				console.error('[accident-logger] failed batch:', batch);
				if (error) {
					void this.addLog(AccidentLoggerError.getByError(error));
				}
			} finally {
				this.#isBufferFlushing = false;
			}
		}
		#setupGlobalErrorHandlers() {
			main_core.Event.bind(window, 'beforeunload', this.handleBeforeUnload);
		}
		#removeGlobalErrorHandlers() {
			main_core.Event.unbind(window, 'beforeunload', this.handleBeforeUnload);
		}
		async handleBeforeUnload() {
			if (!this.isEnabled) {
				return;
			}
			if (main_core.Type.isNumber(this.sendingLoopTimeout)) {
				clearTimeout(this.sendingLoopTimeout);
				this.sendingLoopTimeout = undefined;
			}
			if (main_core.Type.isNumber(this.#bufferFlushTimeout)) {
				clearTimeout(this.#bufferFlushTimeout);
				this.#bufferFlushTimeout = undefined;
			}
			try {
				if (!this.isSending) {
					await this.#sendStorageLogs(true);
				}
				if (!this.#isStorageWritingEnabled) {
					await this.#flushBuffer();
				}
			} finally {
				this.destroy();
			}
		}
		async #postErrtrack(logs) {
			const body = JSON.stringify(logs, (key, value) => key === 'ids' ? undefined : value);
			const sizeKib = (new Blob([body]).size / 1024).toFixed(2);
			const url = `${call_lib_settingsManager.CallSettingsManager.callBalancerUrl}/errtrack`;
			const {
				count,
				groupCount
			} = logs.reduce((acc, curr) => ({
				count: acc.count + curr.count,
				groupCount: acc.groupCount + 1
			}), {
				count: 0,
				groupCount: 0
			});
			try {
				const response = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body,
					keepalive: true,
					credentials: 'same-origin'
				});
				if (!response.ok) {
					throw new AccidentLoggerError(`Sending error, count ${count} (${groupCount} groups), size ${sizeKib} KiB, ` + `response [${response.status} ${response.statusText}]`);
				}
				return response;
			} catch (rawError) {
				if (rawError instanceof AccidentLoggerError || !(rawError instanceof Error) || !rawError.message) {
					throw rawError;
				}
				const error = AccidentLoggerError.getByError(rawError);
				error.message = `Sending error, count ${count} (${groupCount} groups), size ${sizeKib} KiB, ${rawError.message}`;
				throw error;
			}
		}
		*chunks(arr, size) {
			for (let i = 0; i < arr.length; i += size) {
				yield arr.slice(i, i + size);
			}
		}
		async #sendStorageLogs(isBeforeUnload = false) {
			try {
				const logs = await this.#storage.getLogs(this.#isStorageWritingEnabled);
				if (logs.length === 0) {
					if (this.#isStorageWritingEnabled && !isBeforeUnload) {
						await this.#storage.deleteLogs();
					} else if (!this.#isStorageWritingEnabled) {
						void this.#storage.clearDatabase().catch(error => {
							this.addLog(AccidentLoggerError.getByError(error));
						});
					}
					return;
				}
				for (const batch of this.chunks(logs, this.#storage.batchSize)) {
					await this.#postErrtrack(batch);
				}
				if (this.#isStorageWritingEnabled) {
					const idsToDelete = logs.flatMap(({
						ids
					}) => ids);
					await this.#storage.deleteLogsBatch(idsToDelete);
					if (!isBeforeUnload) {
						await this.#storage.deleteLogs();
					}
				} else {
					void this.#storage.clearDatabase().catch(error => {
						this.addLog(AccidentLoggerError.getByError(error));
					});
				}
			} catch (error) {
				if (!error) {
					return;
				}
				if (isStorageLimitError(error)) {
					if (this.#isStorageWritingEnabled) {
						this.#isStorageWritingEnabled = false;
					} else {
						console.error('[accident-logger] log sending error', error);
					}
				} else if (isBeforeUnload) {
					await this.addLog(AccidentLoggerError.getByError(error));
				} else {
					void this.addLog(AccidentLoggerError.getByError(error));
				}
			}
		}
		destroy() {
			clearTimeout(this.sendingLoopTimeout);
			this.sendingLoopTimeout = undefined;
			if (main_core.Type.isNumber(this.#bufferFlushTimeout)) {
				clearTimeout(this.#bufferFlushTimeout);
				this.#bufferFlushTimeout = undefined;
			}
			this.#removeGlobalErrorHandlers();
			if (this.isSending) {
				this.isSending = false;
			}
			this.isEnabled = false;
			this.#storage.destroy();
			this.#logEntryProvider.destroy();
		}
	}

	class AccidentStorage {
		dbName;
		storeName;
		getDBOpeningDelay;
		maxDBOpeningRetryCount;
		batchSize;
		selectLimit;
		maxAge;
		maxRecords;
		pruneInterval;
		lastPruneTime;
		scanLimit;
		openDBRetryTimeout;
		constructor(maxAgeSecs) {
			this.dbName = call_lib_settingsManager.AccidentLogStorageKeys.dbName;
			this.storeName = call_lib_settingsManager.AccidentLogStorageKeys.storeName;
			this.getDBOpeningDelay = retryCount => 100 * (retryCount + 1) ** 2;
			this.maxDBOpeningRetryCount = 5;
			this.batchSize = 49;
			this.selectLimit = this.batchSize * 10;
			this.maxAge = maxAgeSecs * 1000;
			this.maxRecords = 1000;
			this.pruneInterval = 2 * 1000;
			this.lastPruneTime = 0;
			this.scanLimit = 200;
		}
		async openDB(retryCount = 0) {
			return this.#openDBInternal(retryCount, 0);
		}
		async #openDBInternal(retryCount, schemaFixAttempts, requestedVersion) {
			return new Promise((resolve, reject) => {
				const request = requestedVersion === undefined ? indexedDB.open(this.dbName) : indexedDB.open(this.dbName, requestedVersion);
				request.onblocked = () => {
					if (retryCount < this.maxDBOpeningRetryCount) {
						const delay = this.getDBOpeningDelay(retryCount);
						clearTimeout(this.openDBRetryTimeout);
						this.openDBRetryTimeout = setTimeout(() => resolve(this.#openDBInternal(retryCount + 1, schemaFixAttempts, requestedVersion)), delay);
					} else {
						reject(new AccidentLoggerError('Log storage connection attempt limit exceeded'));
					}
				};
				request.onupgradeneeded = event => {
					const db = event.target.result;
					if (!db.objectStoreNames.contains(this.storeName)) {
						const store = db.createObjectStore(this.storeName, {
							keyPath: 'id'
						});
						store.createIndex('timestamp', 'timestamp', {
							unique: false
						});
					}
				};
				request.onsuccess = event => {
					const db = event.target.result;
					if (!db.objectStoreNames.contains(this.storeName)) {
						const nextVersion = db.version + 1;
						db.close();
						if (schemaFixAttempts >= 2) {
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
				request.onerror = event => reject(event.target.error);
			});
		}
		clearDatabase() {
			clearTimeout(this.openDBRetryTimeout);
			return new Promise((resolve, reject) => {
				const request = indexedDB.deleteDatabase(this.dbName);
				request.onsuccess = () => resolve(true);
				request.onerror = event => reject(event.target.error);
				request.onblocked = () => {
					console.warn(`[accident-logger] log storage ${this.dbName} deletion blocked`);
					resolve(false);
				};
			});
		}
		async addLog(entry) {
			let db = null;
			let transaction = null;
			let transactionPromise = null;
			try {
				db = await this.openDB();
				transaction = db.transaction(this.storeName, 'readwrite');
				const store = transaction.objectStore(this.storeName);
				const index = store.index('timestamp');
				transactionPromise = this.#complete(transaction);
				store.add(entry);
				await this.#pruneInTransaction(store, index);
				await transactionPromise;
				db.close();
			} catch (error) {
				await this.#abort(transaction, transactionPromise);
				if (db) {
					db.close();
				}
				throw error;
			}
		}
		async deleteLogs() {
			let db = null;
			let transaction = null;
			let transactionPromise = null;
			try {
				db = await this.openDB();
				transaction = db.transaction(this.storeName, 'readwrite');
				const store = transaction.objectStore(this.storeName);
				const index = store.index('timestamp');
				transactionPromise = this.#complete(transaction);
				await this.#pruneInTransaction(store, index);
				await transactionPromise;
				db.close();
			} catch (error) {
				await this.#abort(transaction, transactionPromise);
				if (db) {
					db.close();
				}
				throw error;
			}
		}
		async getLogs(isBatch = false) {
			let db = null;
			let transaction = null;
			let transactionPromise = null;
			try {
				db = await this.openDB();
				transaction = db.transaction(this.storeName, 'readonly');
				const store = transaction.objectStore(this.storeName);
				const index = store.index('timestamp');
				transactionPromise = this.#complete(transaction);
				const cutoff = new Date(Date.now() - this.maxAge).toISOString();
				const range = IDBKeyRange.lowerBound(cutoff, true);
				const logs = [];
				await this.#whileCursor(index, readingCursor => {
					logs.push(readingCursor.value);
				}, range, () => logs.length < this.selectLimit, isBatch ? 'next' : 'prev');
				await transactionPromise;
				const groupedLogs = groupLogs(logs);
				return isBatch ? groupedLogs.slice(0, this.batchSize) : groupedLogs;
			} catch (error) {
				await this.#abort(transaction, transactionPromise);
				throw error;
			} finally {
				db?.close();
			}
		}
		async deleteLogsBatch(ids) {
			let db = null;
			let transaction = null;
			let transactionPromise = null;
			try {
				db = await this.openDB();
				transaction = db.transaction(this.storeName, 'readwrite');
				const store = transaction.objectStore(this.storeName);
				transactionPromise = this.#complete(transaction);
				for (const id of ids) {
					store.delete(id);
				}
				await transactionPromise;
				db.close();
			} catch (error) {
				await this.#abort(transaction, transactionPromise);
				if (db) {
					db.close();
				}
				throw error;
			}
		}
		async #pruneInTransaction(store, index) {
			const now = Date.now();
			if (now - this.lastPruneTime < this.pruneInterval) {
				return;
			}
			let deletedCount = 0;
			const cutoff = new Date(now - this.maxAge).toISOString();
			const ageRange = IDBKeyRange.upperBound(cutoff);
			const keysToDeleteByAge = [];
			await this.#whileCursor(index, ageCursor => {
				keysToDeleteByAge.push(ageCursor.primaryKey);
			}, ageRange, () => keysToDeleteByAge.length < this.scanLimit);
			if (keysToDeleteByAge.length > 0) {
				const range = IDBKeyRange.bound(keysToDeleteByAge[0], keysToDeleteByAge[keysToDeleteByAge.length - 1]);
				store.delete(range);
				deletedCount += keysToDeleteByAge.length;
			}
			const currentCount = await this.#promiseForRequest(store.count());
			if (currentCount > this.maxRecords) {
				const overLimit = currentCount - this.maxRecords;
				const keysToDeleteByLimit = [];
				await this.#whileCursor(index, limitCursor => {
					keysToDeleteByLimit.push(limitCursor.primaryKey);
				}, undefined, () => keysToDeleteByLimit.length < Math.min(overLimit, this.scanLimit));
				if (keysToDeleteByLimit.length > 0) {
					const range = IDBKeyRange.bound(keysToDeleteByLimit[0], keysToDeleteByLimit[keysToDeleteByLimit.length - 1]);
					store.delete(range);
					deletedCount += keysToDeleteByLimit.length;
				}
			}
			if (deletedCount > 0) {
				this.lastPruneTime = now;
			}
		}
		#whileCursor(store, callback, range, condition = () => true, direction = 'next') {
			return new Promise((resolve, reject) => {
				const cursorRequest = store.openCursor(range, direction);
				cursorRequest.onsuccess = function (event) {
					try {
						const cursor = event.target.result;
						if (cursor && condition()) {
							callback(cursor);
							cursor.continue();
						} else {
							resolve();
						}
					} catch (error) {
						reject(error);
					}
				};
				cursorRequest.onerror = function (event) {
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
		#complete(transaction) {
			return new Promise((resolve, reject) => {
				transaction.oncomplete = () => {
					resolve();
				};
				transaction.onerror = event => {
					reject(event.target.error);
				};
				transaction.onabort = event => {
					reject(event.target.error);
				};
			});
		}
		async #abort(transaction, transactionPromise) {
			if (!transactionPromise || !transaction) {
				return;
			}
			try {
				transaction.abort();
			} catch {
			}
			try {
				await transactionPromise;
			} catch {
			}
		}
		destroy() {
			clearTimeout(this.openDBRetryTimeout);
		}
	}

	class LogEntryProvider {
		#browserMetadataSnapshotPromise = null;
		#userId;
		#storedSessionIdKey = 'call_accidentLogger_sessionId';
		onSnapshotError = null;
		maxMessageLength = 100;
		maxErrorMessageLength = 100;
		maxErrorStackLength = 500;
		constructor(userId) {
			this.#userId = userId;
			this.#generateSessionId();
		}
		get sessionId() {
			return sessionStorage.getItem(this.#storedSessionIdKey) || this.#generateSessionId();
		}
		async createLogEntry(error, message) {
			const metadata = await this.#getMetadata();
			let safeMessage = '';
			if (message) {
				safeMessage = message;
			}
			let safeError = null;
			if (error) {
				safeError = {
					name: error.name,
					message: this.#truncate(error.message, this.maxErrorMessageLength),
					stack: error.stack ? this.#truncate(error.stack, this.maxErrorStackLength) : null
				};
				if (!safeMessage) {
					safeMessage = `${safeError.name}: ${safeError.message}`;
				}
			}
			if (safeMessage) {
				safeMessage = this.#truncate(safeMessage, this.maxMessageLength);
			}
			return {
				id: new Date().toISOString() + Math.random().toString(36).slice(2, 11),
				message: safeMessage,
				timestamp: new Date().toISOString(),
				data: {
					...safeError,
					...metadata
				}
			};
		}
		destroy() {
			this.#browserMetadataSnapshotPromise = null;
			this.onSnapshotError = null;
		}
		#generateSessionId() {
			const id = new Date().toISOString() + Math.random().toString(36).slice(2, 11);
			sessionStorage.setItem(this.#storedSessionIdKey, id);
			return id;
		}
		async #getMetadata() {
			const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
			const browserSnapshot = await this.#getOrCreateBrowserMetadataSnapshot();
			return {
				connectionType: connection?.effectiveType || 'unknown',
				online: navigator.onLine ? 'online' : 'offline',
				sessionId: this.sessionId,
				userId: this.#userId,
				...browserSnapshot
			};
		}
		async #getOrCreateBrowserMetadataSnapshot() {
			if (this.#browserMetadataSnapshotPromise === null) {
				this.#browserMetadataSnapshotPromise = this.#buildBrowserMetadataSnapshot().catch(error => {
					if (this.onSnapshotError) {
						this.onSnapshotError(error, 'Call: browser metadata snapshot failed');
					}
					return {};
				});
			}
			return this.#browserMetadataSnapshotPromise;
		}
		async #buildBrowserMetadataSnapshot() {
			const meta = {};
			const uaData = navigator.userAgentData;
			if (!uaData) {
				return meta;
			}
			if (main_core.Type.isBoolean(uaData.mobile)) {
				meta.mobile = uaData.mobile;
			}
			if (main_core.Type.isArrayFilled(uaData.brands)) {
				meta.brands = uaData.brands.map(({
					brand,
					version
				}) => ({
					brand,
					version
				}));
			}
			if (main_core.Type.isFunction(uaData.getHighEntropyValues)) {
				try {
					const hints = await uaData.getHighEntropyValues(['fullVersionList', 'platform', 'platformVersion', 'architecture', 'model', 'uaFullVersion']);
					meta.clientHints = {
						fullVersionList: hints.fullVersionList?.map(({
							brand,
							version
						}) => ({
							brand,
							version
						})),
						platform: hints.platform,
						platformVersion: hints.platformVersion,
						architecture: hints.architecture,
						model: hints.model,
						uaFullVersion: hints.uaFullVersion
					};
					if (main_core.Type.isArrayFilled(meta.clientHints.fullVersionList)) {
						delete meta.brands;
					}
				} catch {
				}
			}
			return meta;
		}
		#truncate(str, maxLen) {
			if (!main_core.Type.isString(str) || str.length <= maxLen) {
				return str;
			}
			return `${str.slice(0, maxLen - 10)} [truncated]`;
		}
	}

	const sendIntervalSecs = call_lib_settingsManager.CallSettingsManager.accidentLogSendIntervalSecs || 0;
	const maxStorageAgeSecs = call_lib_settingsManager.CallSettingsManager.accidentLogGroupMaxAgeSecs || 0;
	const userId = main_core.Loc.getMessage('USER_ID');
	const accidentStorage = new AccidentStorage(maxStorageAgeSecs);
	const logEntryProvider = new LogEntryProvider(userId);
	const accidentLogger = new AccidentManager(accidentStorage, logEntryProvider, sendIntervalSecs);
	window.accidentLogger = accidentLogger;

	exports.accidentLogger = accidentLogger;

})(this.BX.Call.Lib = this.BX.Call.Lib || {}, BX, BX.Call.Lib);
//# sourceMappingURL=accident-logger.bundle.js.map
