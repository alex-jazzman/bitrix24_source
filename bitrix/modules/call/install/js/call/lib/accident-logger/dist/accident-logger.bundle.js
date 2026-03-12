/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports,call_lib_settingsManager,main_core) {
	'use strict';

	class AccidentLoggerError extends Error {
	  /**
	   * @param {string} message
	   */
	  constructor(message) {
	    super(message);
	    this.name = 'CallAccidentLoggerError';
	    this.originalError = null;
	  }

	  /**
	   * @param {Error} error
	   */
	  static getByError(error) {
	    if (error instanceof AccidentLoggerError) {
	      return error;
	    }
	    const newError = new AccidentLoggerError(error.message);
	    newError.stack = error.stack;
	    if (error.name) {
	      newError.name = `${newError.name}: ${error.name}`;
	    }
	    newError.originalError = error;
	    return newError;
	  }
	}

	var _setupGlobalErrorHandlers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setupGlobalErrorHandlers");
	var _removeGlobalErrorHandlers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("removeGlobalErrorHandlers");
	var _sendLogs = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendLogs");
	class AccidentManager {
	  /**
	   * @param {AccidentStorage} storage instance of AccidentStorage
	   * @param {number} sendIntervalSecs send interval in seconds
	   *   */
	  constructor(storage, sendIntervalSecs = 60) {
	    Object.defineProperty(this, _sendLogs, {
	      value: _sendLogs2
	    });
	    Object.defineProperty(this, _removeGlobalErrorHandlers, {
	      value: _removeGlobalErrorHandlers2
	    });
	    Object.defineProperty(this, _setupGlobalErrorHandlers, {
	      value: _setupGlobalErrorHandlers2
	    });
	    this.localStorageSendingSessionIdKey = 'bx-call-accidentLogger-sendingSessionId';
	    this.url = `${call_lib_settingsManager.CallSettingsManager.callBalancerUrl}/errtrack`;
	    this.storage = storage;
	    this.minLogLifetime = 10 * 1000;
	    this.sendInterval = sendIntervalSecs * 1000;
	    this.maxLogLifetime = 30 * 60 * 1000;
	    this.isEnabled = this.minLogLifetime <= this.sendInterval && this.sendInterval <= this.maxLogLifetime && this.minLogLifetime <= this.storage.maxAgeSecs && this.storage.maxAgeSecs <= this.maxLogLifetime;
	    this.sendingLoop = this.sendingLoop.bind(this);
	    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
	    this.sendingLoop();
	    babelHelpers.classPrivateFieldLooseBase(this, _setupGlobalErrorHandlers)[_setupGlobalErrorHandlers]();
	  }
	  get isSending() {
	    const storedSendingSessionId = localStorage.getItem(this.localStorageSendingSessionIdKey);
	    return storedSendingSessionId === this.storage.sessionId;
	  }
	  set isSending(value) {
	    localStorage.setItem(this.localStorageSendingSessionIdKey, value ? this.storage.sessionId : '');
	  }
	  async sendingLoop() {
	    if (!this.isEnabled) {
	      return;
	    }
	    if (!this.isSending) {
	      this.isSending = true;
	      await babelHelpers.classPrivateFieldLooseBase(this, _sendLogs)[_sendLogs]();
	      this.isSending = false;
	    }
	    if (main_core.Type.isNumber(this.sendingLoopTimeout)) {
	      clearTimeout(this.sendingLoopTimeout);
	    }
	    this.sendingLoopTimeout = setTimeout(this.sendingLoop, this.sendInterval);
	  }
	  async addLog(error = null, message = '') {
	    if (!this.isEnabled) {
	      return;
	    }
	    await this.storage.addLog(error, message);
	  }
	  async handleBeforeUnload() {
	    if (!this.isEnabled) {
	      return;
	    }
	    try {
	      const logs = await this.storage.getLogsBatch();
	      if (logs.length === 0) {
	        return;
	      }
	      const data = new Blob([JSON.stringify(logs)], {
	        type: 'application/json'
	      });
	      const sent = navigator.sendBeacon(this.url, data);
	      if (!sent) {
	        throw new AccidentLoggerError('Sending failed');
	      }
	      const idsToDelete = logs.flatMap(({
	        ids
	      }) => ids);
	      await this.storage.deleteLogsBatch(idsToDelete);
	    } catch (error) {
	      await this.storage.addLog(AccidentLoggerError.getByError(error));
	    } finally {
	      this.destroy();
	      this.storage.destroy();
	    }
	  }
	  destroy() {
	    clearTimeout(this.sendingLoopTimeout);
	    babelHelpers.classPrivateFieldLooseBase(this, _removeGlobalErrorHandlers)[_removeGlobalErrorHandlers]();
	    if (this.isSending) {
	      this.isSending = false;
	    }
	  }
	}
	function _setupGlobalErrorHandlers2() {
	  main_core.Event.bind(window, 'beforeunload', this.handleBeforeUnload);
	}
	function _removeGlobalErrorHandlers2() {
	  main_core.Event.unbind(window, 'beforeunload', this.handleBeforeUnload);
	}
	async function _sendLogs2() {
	  try {
	    const logs = await this.storage.getLogsBatch();
	    if (logs.length === 0) {
	      await this.storage.deleteLogs();
	      return;
	    }

	    // don't use BX.ajax because window.XMLHttpRequest doesn't have property keepalive
	    const response = await fetch(this.url, {
	      method: 'POST',
	      headers: {
	        'Content-Type': 'application/json'
	      },
	      body: JSON.stringify(logs),
	      keepalive: true
	    });
	    if (!response.ok) {
	      throw new AccidentLoggerError(`Sending error, response [${response.status} ${response.statusText}]`);
	    }
	    const idsToDelete = logs.flatMap(({
	      ids
	    }) => ids);
	    await this.storage.deleteLogsBatch(idsToDelete);
	    await this.storage.deleteLogs();
	  } catch (error) {
	    await this.storage.addLog(AccidentLoggerError.getByError(error));
	  }
	}

	var _groupLogs = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("groupLogs");
	var _createLogEntry = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createLogEntry");
	var _generateSessionId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("generateSessionId");
	var _getMetadata = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMetadata");
	var _truncate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("truncate");
	var _pruneInTransaction = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pruneInTransaction");
	var _whileCursor = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("whileCursor");
	var _promiseForRequest = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("promiseForRequest");
	var _complete = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("complete");
	var _abort = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("abort");
	class AccidentStorage {
	  /**
	   * @param {number} maxAgeSecs second count to clear by age
	   * @param {number} batchSize batch size to get
	   */
	  constructor(maxAgeSecs = 60, batchSize = 100) {
	    Object.defineProperty(this, _abort, {
	      value: _abort2
	    });
	    Object.defineProperty(this, _complete, {
	      value: _complete2
	    });
	    Object.defineProperty(this, _promiseForRequest, {
	      value: _promiseForRequest2
	    });
	    Object.defineProperty(this, _whileCursor, {
	      value: _whileCursor2
	    });
	    Object.defineProperty(this, _pruneInTransaction, {
	      value: _pruneInTransaction2
	    });
	    Object.defineProperty(this, _truncate, {
	      value: _truncate2
	    });
	    Object.defineProperty(this, _getMetadata, {
	      value: _getMetadata2
	    });
	    Object.defineProperty(this, _generateSessionId, {
	      value: _generateSessionId2
	    });
	    Object.defineProperty(this, _createLogEntry, {
	      value: _createLogEntry2
	    });
	    Object.defineProperty(this, _groupLogs, {
	      value: _groupLogs2
	    });
	    this.dbName = 'bx_call_accidentLogDB';
	    this.storeName = 'bx_call_accidentLogs';

	    // OPEN
	    // function to open blocked indexedDB with progressive delay (100ms, 400ms, 900ms...)
	    this.getDBOpeningDelay = retryCount => 100 * (retryCount + 1) ** 2;
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
	    babelHelpers.classPrivateFieldLooseBase(this, _generateSessionId)[_generateSessionId]();
	  }
	  async openDB(retryCount = 0) {
	    return new Promise((resolve, reject) => {
	      const request = indexedDB.open(this.dbName, 1);
	      request.onblocked = () => {
	        if (retryCount < this.maxDBOpeningRetryCount) {
	          const delay = this.getDBOpeningDelay(retryCount);
	          clearTimeout(this.openDBRetryTimeout);
	          this.openDBRetryTimeout = setTimeout(() => resolve(this.openDB(retryCount + 1)), delay);
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
	        db.onversionchange = () => {
	          console.warn('Call: log storage connection closed...');
	          db.close();
	        };
	        resolve(db);
	      };
	      request.onerror = event => reject(event.target.error);
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
	    try {
	      db = await this.openDB();
	      transaction = db.transaction(this.storeName, 'readwrite');
	      const store = transaction.objectStore(this.storeName);
	      const index = store.index('timestamp');
	      transactionPromise = babelHelpers.classPrivateFieldLooseBase(this, _complete)[_complete](transaction);
	      await store.add(babelHelpers.classPrivateFieldLooseBase(this, _createLogEntry)[_createLogEntry](errorToLog, message));
	      await babelHelpers.classPrivateFieldLooseBase(this, _pruneInTransaction)[_pruneInTransaction](store, index, transaction);
	      await transactionPromise;
	      db.close();
	    } catch (error) {
	      await console.error('Call: log addition error', error);
	      await babelHelpers.classPrivateFieldLooseBase(this, _abort)[_abort](transaction, transactionPromise);
	      if (db) {
	        db.close();
	      }
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
	      transactionPromise = babelHelpers.classPrivateFieldLooseBase(this, _complete)[_complete](transaction);
	      await babelHelpers.classPrivateFieldLooseBase(this, _pruneInTransaction)[_pruneInTransaction](store, index, transaction);
	      await transactionPromise;
	      db.close();
	    } catch (error) {
	      await babelHelpers.classPrivateFieldLooseBase(this, _abort)[_abort](transaction, transactionPromise);
	      if (db) {
	        db.close();
	      }
	      throw error;
	    }
	  }
	  async getLogsBatch() {
	    let db = null;
	    let transaction = null;
	    let transactionPromise = null;
	    try {
	      db = await this.openDB();
	      transaction = db.transaction(this.storeName, 'readonly');
	      const store = transaction.objectStore(this.storeName);
	      const index = store.index('timestamp');
	      transactionPromise = babelHelpers.classPrivateFieldLooseBase(this, _complete)[_complete](transaction);

	      /** get only fresh records, because there is old record deletion by limits
	       * @see this.maxAgeSecs
	       * @see this.maxRecords
	       * @see this.scanLimit
	       * */
	      const cutoff = new Date(Date.now() - this.maxAgeSecs).toISOString();
	      const range = IDBKeyRange.lowerBound(cutoff, true);
	      const logs = [];
	      await babelHelpers.classPrivateFieldLooseBase(this, _whileCursor)[_whileCursor](index, readingCursor => {
	        logs.push(readingCursor.value);
	      }, range, () => logs.length < this.selectLimit);
	      await transactionPromise;
	      db.close();
	      const groupedLogs = babelHelpers.classPrivateFieldLooseBase(this, _groupLogs)[_groupLogs](logs);
	      return groupedLogs.slice(0, this.batchSize);
	    } catch (error) {
	      await babelHelpers.classPrivateFieldLooseBase(this, _abort)[_abort](transaction, transactionPromise);
	      if (db) {
	        db.close();
	      }
	      throw error;
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
	      transactionPromise = babelHelpers.classPrivateFieldLooseBase(this, _complete)[_complete](transaction);
	      for (const id of ids) {
	        // eslint-disable-next-line no-await-in-loop
	        await store.delete(id);
	      }
	      await transactionPromise;
	      db.close();
	    } catch (error) {
	      await babelHelpers.classPrivateFieldLooseBase(this, _abort)[_abort](transaction, transactionPromise);
	      if (db) {
	        db.close();
	      }
	      throw error;
	    }
	  }
	  get sessionId() {
	    return sessionStorage.getItem(this.storedSessionIdKey) || babelHelpers.classPrivateFieldLooseBase(this, _generateSessionId)[_generateSessionId]();
	  }
	  destroy() {
	    clearTimeout(this.openDBRetryTimeout);
	  }
	}
	function _groupLogs2(logs) {
	  const groups = new Map();
	  for (const log of logs) {
	    const hash = log[this.groupHashProp];
	    if (groups.has(hash)) {
	      const groupedLog = groups.get(hash);
	      groupedLog.count++;
	      groupedLog.ids.push(log.id);
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
	function _createLogEntry2(error, message) {
	  let safeMessage = '';
	  if (message) {
	    safeMessage = message;
	  }
	  let safeError = null;
	  if (error) {
	    safeError = {
	      name: error.name,
	      message: babelHelpers.classPrivateFieldLooseBase(this, _truncate)[_truncate](error.message, this.maxErrorMessageLength),
	      stack: error.stack ? babelHelpers.classPrivateFieldLooseBase(this, _truncate)[_truncate](error.stack, this.maxErrorStackLength) : null
	    };
	    if (!safeMessage) {
	      safeMessage = `${safeError.name}: ${safeError.message}`;
	    }
	  }
	  if (safeMessage) {
	    safeMessage = babelHelpers.classPrivateFieldLooseBase(this, _truncate)[_truncate](safeMessage, this.maxMessageLength);
	  }
	  return {
	    id: new Date().toISOString() + Math.random().toString(36).slice(2, 11),
	    message: safeMessage,
	    timestamp: new Date().toISOString(),
	    data: {
	      ...safeError,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getMetadata)[_getMetadata]()
	    }
	  };
	}
	function _generateSessionId2() {
	  const id = new Date().toISOString() + Math.random().toString(36).slice(2, 11);
	  sessionStorage.setItem(this.storedSessionIdKey, id);
	  return id;
	}
	function _getMetadata2() {
	  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
	  return {
	    connectionType: (connection == null ? void 0 : connection.effectiveType) || 'unknown',
	    online: navigator.onLine ? 'online' : 'offline',
	    sessionId: this.sessionId
	  };
	}
	function _truncate2(str, maxLen) {
	  if (!main_core.Type.isString(str) || str.length <= maxLen) {
	    return str;
	  }
	  return `${str.slice(0, maxLen - 10)} [truncated]`;
	}
	async function _pruneInTransaction2(store, index, transaction) {
	  const now = Date.now();
	  if (now - this.lastPruneTime < this.pruneInterval) {
	    return;
	  }
	  let deletedCount = 0;

	  // Clear by age
	  const cutoff = new Date(now - this.maxAgeSecs).toISOString();
	  const ageRange = IDBKeyRange.upperBound(cutoff);
	  const keysToDeleteByAge = [];
	  await babelHelpers.classPrivateFieldLooseBase(this, _whileCursor)[_whileCursor](index, ageCursor => {
	    keysToDeleteByAge.push(ageCursor.primaryKey);
	  }, ageRange, () => keysToDeleteByAge.length < this.scanLimit);
	  if (keysToDeleteByAge.length > 0) {
	    const range = IDBKeyRange.bound(keysToDeleteByAge[0], keysToDeleteByAge[keysToDeleteByAge.length - 1]);
	    await store.delete(range);
	    deletedCount += keysToDeleteByAge.length;
	  }

	  // Clear by record limit
	  const currentCount = await babelHelpers.classPrivateFieldLooseBase(this, _promiseForRequest)[_promiseForRequest](store.count());
	  if (currentCount > this.maxRecords) {
	    const overLimit = currentCount - this.maxRecords;
	    const keysToDeleteByLimit = [];
	    await babelHelpers.classPrivateFieldLooseBase(this, _whileCursor)[_whileCursor](index, limitCursor => {
	      keysToDeleteByLimit.push(limitCursor.primaryKey);
	    }, undefined, () => keysToDeleteByLimit.length < Math.min(overLimit, this.scanLimit));
	    if (keysToDeleteByLimit.length > 0) {
	      const range = IDBKeyRange.bound(keysToDeleteByLimit[0], keysToDeleteByLimit[keysToDeleteByLimit.length - 1]);
	      await store.delete(range);
	      deletedCount += keysToDeleteByLimit.length;
	    }
	  }
	  if (deletedCount > 0) {
	    this.lastPruneTime = now;
	  }
	}
	function _whileCursor2(store, callback, range, condition = () => true, direction = 'next') {
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
	function _promiseForRequest2(request) {
	  return new Promise((resolve, reject) => {
	    request.onsuccess = () => {
	      resolve(request.result);
	    };
	    request.onerror = () => {
	      reject(request.error);
	    };
	  });
	}
	function _complete2(transaction) {
	  return new Promise((resolve, reject) => {
	    // eslint-disable-next-line no-param-reassign
	    transaction.oncomplete = () => {
	      resolve();
	    };

	    // eslint-disable-next-line no-param-reassign
	    transaction.onerror = event => {
	      reject(event.target.error);
	    };

	    // eslint-disable-next-line no-param-reassign
	    transaction.onabort = event => {
	      reject(event.target.error);
	    };
	  });
	}
	async function _abort2(transaction, transactionPromise) {
	  if (transactionPromise && transaction) {
	    transaction.abort();
	    try {
	      await transactionPromise;
	    } catch {
	      // skip, because #abort errors are caught in the calling function
	    }
	  }
	}

	function getUnknownErrorType(errorMsg) {
	  /**
	   * A map of error types to patterns for matching.
	   * Supports: strings (checked via .includes()), regular expressions (via .test()), and arrays of patterns.
	   */
	  const ERROR_PATTERNS = {
	    NULL_PROPERTY_READING: ['Cannot read properties of null', /Cannot read property.*of null/i],
	    UNDEFINED_PROPERTY_READING: 'Cannot read properties of undefined',
	    EMPTY_CALLTOKEN: 'Empty callToken',
	    UNKNOWN_JS_FUNCTION: 'BX JS Extension: Unknown JS function!',
	    NOT_FUNCTION: 'is not a function',
	    NULL_NOT_OBJECT: 'null is not an object',
	    UNDEFINED_NOT_OBJECT: 'undefined is not an object',
	    NULL_PROPERTY_ACCESS: /can't access property.*is null/i,
	    UNDEFINED_PROPERTY_ACCESS: /can't access property.*is undefined/i,
	    CALL_NOT_FOUND: 'Call not found',
	    IS_NULL: 'is null',
	    IS_UNDEFINED: 'is undefined',
	    NOT_CONSTRUCTOR: 'is not a constructor'
	  };

	  /**
	   * Checks if the error message matches the given pattern.
	   * @param {string} msg - the error message to check
	   * @param {string|RegExp|Array} pattern - the pattern to match against
	   * @returns {boolean} true if a match is found
	   */
	  function matchesPattern(msg, pattern) {
	    if (!main_core.Type.isString(msg)) {
	      return false;
	    }
	    if (main_core.Type.isString(pattern)) {
	      return msg.includes(pattern);
	    }
	    if (pattern instanceof RegExp) {
	      return pattern.test(msg);
	    }
	    if (Array.isArray(pattern)) {
	      return pattern.some(item => matchesPattern(msg, item));
	    }
	    return false;
	  }

	  // Iterate through all error types and check if the message matches any pattern
	  for (const [errorType, pattern] of Object.entries(ERROR_PATTERNS)) {
	    if (matchesPattern(errorMsg, pattern)) {
	      return errorType;
	    }
	  }

	  // If no pattern matches, return the default error type
	  return 'UNKNOWN_ERROR';
	}

	const sendIntervalSecs = call_lib_settingsManager.CallSettingsManager.accidentLogSendIntervalSecs || 0;
	const maxStorageAge = call_lib_settingsManager.CallSettingsManager.accidentLogGroupMaxAgeSecs || 0;
	const accidentStorage = new AccidentStorage(maxStorageAge, 100);
	const accidentLogger = new AccidentManager(accidentStorage, sendIntervalSecs);

	exports.accidentLogger = accidentLogger;
	exports.getUnknownErrorType = getUnknownErrorType;

}((this.BX.Call.Lib = this.BX.Call.Lib || {}),BX.Call.Lib,BX));
//# sourceMappingURL=accident-logger.bundle.js.map
