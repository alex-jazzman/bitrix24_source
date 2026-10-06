/* eslint-disable */
this.BX = this.BX || {};
(function (exports) {
	'use strict';

	const REVISION = 19; // api revision - check module/pull/include.php

	const ConnectionType = {
		WebSocket: 'webSocket',
		LongPolling: 'longPolling'
	};
	const PullStatus = {
		Online: 'online',
		Offline: 'offline',
		Connecting: 'connect'
	};
	const CloseReasons = {
		CONFIG_REPLACED: 3000,
		SERVER_RESTARTED: 3002,
		STUCK: 3005,
		WRONG_CHANNEL_ID: 4010
	};
	const SystemCommands = {
		CHANNEL_EXPIRE: 'CHANNEL_EXPIRE',
		CONFIG_EXPIRE: 'CONFIG_EXPIRE',
		SERVER_RESTART: 'SERVER_RESTART'
	};
	const ServerMode = {
		Shared: 'shared'};
	const RpcMethod = {
		Publish: 'publish',
		GetUsersLastSeen: 'getUsersLastSeen',
		Ping: 'ping',
		ListChannels: 'listChannels',
		SubscribeStatusChange: 'subscribeStatusChange',
		UnsubscribeStatusChange: 'unsubscribeStatusChange'
	};

	/* eslint-disable @bitrix24/bitrix24-rules/no-typeof */

	const browser = {
		IsChrome() {
			return navigator.userAgent.toLowerCase().includes('chrome');
		},
		IsFirefox() {
			return navigator.userAgent.toLowerCase().includes('firefox');
		},
		IsIe() {
			return navigator.userAgent.match(/(Trident\/|MSIE\/)/) !== null;
		}
	};
	function getTimestamp() {
		return Date.now();
	}
	function isString(item) {
		return item === '' ? true : item ? typeof item === 'string' || item instanceof String : false;
	}
	function isArray(item) {
		return item && Object.prototype.toString.call(item) === '[object Array]';
	}
	function isFunction(item) {
		return item === null ? false : typeof item === 'function' || item instanceof Function;
	}
	function isPlainObject(item) {
		return Boolean(item) && typeof item === 'object' && item.constructor === Object;
	}
	function isNotEmptyString(item) {
		return isString(item) ? item.length > 0 : false;
	}
	function isJsonRpcRequest(item) {
		return typeof item === 'object' && item && 'jsonrpc' in item && isNotEmptyString(item.jsonrpc) && 'method' in item && isNotEmptyString(item.method);
	}
	function isJsonRpcResponse(item) {
		return typeof item === 'object' && item && 'jsonrpc' in item && isNotEmptyString(item.jsonrpc) && 'id' in item && ('result' in item || 'error' in item);
	}
	function buildQueryString(params) {
		let result = '';
		for (const key of Object.keys(params)) {
			const value = params[key];
			if (isArray(value)) {
				for (const [index, valueElement] of value.entries()) {
					const left = encodeURIComponent(`${key}[${index}]`);
					const right = `${encodeURIComponent(valueElement)}&`;
					result += `${left}=${right}`;
				}
			} else {
				result += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
			}
		}
		if (result.length > 0) {
			result = result.slice(0, Math.max(0, result.length - 1));
		}
		return result;
	}
	function getDateForLog() {
		const d = new Date();
		return `${d.getFullYear()}-${lpad(d.getMonth(), 2, '0')}-${lpad(d.getDate(), 2, '0')} ${lpad(d.getHours(), 2, '0')}:${lpad(d.getMinutes(), 2, '0')}`;
	}
	function lpad(str, length, chr = ' ') {
		if (str.length > length) {
			return str;
		}
		let result = '';
		for (let i = 0; i < length - result.length; i++) {
			result += chr;
		}
		return result + str;
	}

	class ErrorNotConnected extends Error {
		constructor(message) {
			super(message);
			this.name = 'ErrorNotConnected';
		}
	}

	class ErrorTimeout extends Error {
		constructor(message) {
			super(message);
			this.name = 'ErrorTimeout';
		}
	}

	const JSON_RPC_VERSION = '2.0';
	const RpcError = {
		InvalidRequest: {
			code: -32600,
			message: 'Invalid Request'
		},
		MethodNotFound: {
			code: -32601,
			message: 'Method not found'
		}};
	class JsonRpc extends EventTarget {
		idCounter = 0;
		handlers = {};
		rpcResponseAwaiters = new Map();
		constructor(options) {
			super();
			this.sender = options.sender;
			for (const method of Object.keys(options.handlers || {})) {
				this.handle(method, options.handlers[method]);
			}
			for (const eventType of Object.keys(options.events || {})) {
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
				this.addEventListener(eventType, options.events[eventType]);
			}
		}

		/**
		 * @param {string} method
		 * @param {function} handler
		 */
		handle(method, handler) {
			this.handlers[method] = handler;
		}

		/**
		 * Sends RPC command to the server.
		 *
		 * @param {string} method Method name
		 * @param {object} params
		 * @param {int} timeout
		 * @returns {Promise}
		 */
		executeOutgoingRpcCommand(method, params, timeout = 5) {
			return new Promise((resolve, reject) => {
				const request = this.createRequest(method, params);
				if (this.sender.send(JSON.stringify(request)) === false) {
					reject(new ErrorNotConnected('send failed'));
				}
				if (timeout > 0) {
					const t = setTimeout(() => {
						this.rpcResponseAwaiters.delete(request.id);
						reject(new ErrorTimeout('no response'));
					}, timeout * 1000);
					this.rpcResponseAwaiters.set(request.id, {
						resolve,
						reject,
						timeout: t
					});
				} else {
					resolve();
				}
			});
		}

		/**
		 * Executes array or rpc commands. Returns array of promises, each promise will be resolved individually.
		 *
		 * @param {JsonRpcRequest[]} batch
		 * @returns {Promise[]}
		 */
		executeOutgoingRpcBatch(batch) {
			const requests = [];
			const promises = [];
			batch.forEach(({
				method,
				params,
				id
			}) => {
				const request = this.createRequest(method, params, id);
				requests.push(request);
				promises.push(new Promise((resolve, reject) => {
					this.rpcResponseAwaiters.set(request.id, {
						resolve,
						reject
					});
				}));
			});
			this.sender.send(JSON.stringify(requests));
			return promises;
		}
		processRpcResponse(response) {
			if ('id' in response && this.rpcResponseAwaiters.has(response.id)) {
				const awaiter = this.rpcResponseAwaiters.get(response.id);
				if ('result' in response) {
					awaiter.resolve(response.result);
				} else if ('error' in response) {
					awaiter.reject(response.error);
				} else {
					awaiter.reject(new Error('wrong response structure'));
				}
				clearTimeout(awaiter.timeout);
				this.rpcResponseAwaiters.delete(response.id);
			} else {
				this.dispatchEvent(new CustomEvent('error', {
					error: new Error(`received rpc response with unknown id ${response}`)
				}));
			}
		}
		async handleIncomingMessage(message) {
			let decoded = {};
			try {
				decoded = JSON.parse(message);
			} catch (e) {
				throw new Error(`could not decode json rpc message: ${e}`);
			}
			if (isArray(decoded)) {
				this.executeIncomingRpcBatch(decoded);
			} else if (isJsonRpcRequest(decoded)) {
				const commandResult = await this.executeIncomingRpcCommand(decoded);
				if (commandResult !== null && commandResult !== undefined) {
					const response = commandResult.error ? this.createErrorResponse(decoded.id, commandResult.error) : this.createResponse(decoded.id, commandResult);
					this.sender.send(JSON.stringify(response));
				} else {
					this.sender.send(JSON.stringify(this.createResponse(decoded.id, null)));
				}
			} else if (isJsonRpcResponse(decoded)) {
				this.processRpcResponse(decoded);
			} else {
				throw new Error(`unknown rpc packet: ${decoded}`);
			}
		}

		/**
		 * Executes RPC command, received from the server
		 *
		 * @param {string} method
		 * @param {object} params
		 * @returns {object}
		 */
		async executeIncomingRpcCommand({
			method,
			params
		}) {
			if (method in this.handlers) {
				try {
					return this.handlers[method].call(this, params);
				} catch (e) {
					return {
						jsonrpc: '2.0',
						error: e.toString()
					};
				}
			}
			return {
				error: RpcError.MethodNotFound
			};
		}
		async executeIncomingRpcBatch(batch) {
			const result = [];
			for (const command of batch) {
				if ('jsonrpc' in command) {
					if ('method' in command) {
						const commandResult = this.executeIncomingRpcCommand(command);
						if (commandResult) {
							commandResult.jsonrpc = JSON_RPC_VERSION;
							commandResult.id = command.id;
							result.push(commandResult);
						}
					} else {
						this.processRpcResponse(command);
					}
				} else {
					this.dispatchEvent(new CustomEvent('error', {
						error: new Error(`unknown rpc command in batch: ${command}`)
					}));
					result.push({
						jsonrpc: '2.0',
						error: RpcError.InvalidRequest
					});
				}
			}
			return result;
		}
		nextId() {
			this.idCounter++;
			return this.idCounter;
		}
		createPublishRequest(messageBatch) {
			const result = messageBatch.map(message => this.createRequest('publish', message));
			if (result.length === 0) {
				return result[0];
			}
			return result;
		}
		createRequest(method, params, id) {
			return {
				jsonrpc: JSON_RPC_VERSION,
				method,
				params,
				id: id ?? this.nextId()
			};
		}
		createResponse(id, result) {
			return {
				jsonrpc: JSON_RPC_VERSION,
				id,
				result
			};
		}
		createErrorResponse(id, error) {
			return {
				jsonrpc: JSON_RPC_VERSION,
				id,
				error
			};
		}
	}

	class ChannelManager {
		constructor(params) {
			this.publicIds = {};
			this.restClient = params.restClient ?? BX.rest;
			this.getPublicListMethod = params.getPublicListMethod;
		}

		/**
		 *
		 * @param {Array} users Array of user ids.
		 * @return {Promise}
		 */
		getPublicIds(users) {
			const now = new Date();
			const result = {};
			const unknownUsers = [];
			for (const userId of users) {
				if (this.publicIds[userId] && this.publicIds[userId].end > now) {
					result[userId] = this.publicIds[userId];
				} else {
					unknownUsers.push(userId);
				}
			}
			if (unknownUsers.length === 0) {
				return Promise.resolve(result);
			}
			return new Promise((resolve, reject) => {
				this.restClient.callMethod(this.getPublicListMethod, {
					users: unknownUsers
				}).then(response => {
					if (response.error()) {
						resolve({});
					} else {
						const data = response.data();
						this.setPublicIds(Object.values(data));
						for (const userId of unknownUsers) {
							result[userId] = this.publicIds[userId];
						}
						resolve(result);
					}
				}).catch(e => reject(e));
			});
		}

		/**
		 *
		 * @param {object[]} publicIds
		 * @param {integer} publicIds.user_id
		 * @param {string} publicIds.public_id
		 * @param {string} publicIds.signature
		 * @param {Date} publicIds.start
		 * @param {Date} publicIds.end
		 */
		setPublicIds(publicIds) {
			for (const publicIdDescriptor of publicIds) {
				const userId = publicIdDescriptor.user_id;
				this.publicIds[userId] = {
					userId,
					publicId: publicIdDescriptor.public_id,
					signature: publicIdDescriptor.signature,
					start: new Date(publicIdDescriptor.start),
					end: new Date(publicIdDescriptor.end)
				};
			}
		}
	}

	/* eslint-disable @bitrix24/bitrix24-rules/no-pseudo-private */
	/* eslint-disable no-underscore-dangle */
	// noinspection ES6PreferShortImport

	class AbstractConnector {
		_connected = false;
		connectionType = '';
		disconnectCode = '';
		disconnectReason = '';
		constructor(config) {
			this.pathGetter = config.pathGetter;
			this.callbacks = {
				onOpen: isFunction(config.onOpen) ? config.onOpen : function () {},
				onDisconnect: isFunction(config.onDisconnect) ? config.onDisconnect : function () {},
				onError: isFunction(config.onError) ? config.onError : function () {},
				onMessage: isFunction(config.onMessage) ? config.onMessage : function () {}
			};
		}
		get connected() {
			return this._connected;
		}
		set connected(value) {
			if (value === this._connected) {
				return;
			}
			this._connected = value;
			if (this._connected) {
				this.callbacks.onOpen();
			} else {
				this.callbacks.onDisconnect({
					code: this.disconnectCode,
					reason: this.disconnectReason
				});
			}
		}
		get path() {
			return this.pathGetter();
		}
	}

	/* eslint-disable @bitrix24/bitrix24-rules/no-native-events-binding */

	class WebSocketConnector extends AbstractConnector {
		connectionType = ConnectionType.WebSocket;
		onSocketOpenHandler = this.onSocketOpen.bind(this);
		onSocketCloseHandler = this.onSocketClose.bind(this);
		onSocketErrorHandler = this.onSocketError.bind(this);
		onSocketMessageHandler = this.onSocketMessage.bind(this);
		connect() {
			if (this.socket) {
				if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
					return;
				}
				this.socket.removeEventListener('open', this.onSocketOpenHandler);
				this.socket.removeEventListener('close', this.onSocketCloseHandler);
				this.socket.removeEventListener('error', this.onSocketErrorHandler);
				this.socket.removeEventListener('message', this.onSocketMessageHandler);
				this.socket.close();
				this.socket = null;
			}
			this.createSocket();
		}
		disconnect(code, message) {
			if (this.socket !== null) {
				this.socket.removeEventListener('open', this.onSocketOpenHandler);
				this.socket.removeEventListener('close', this.onSocketCloseHandler);
				this.socket.removeEventListener('error', this.onSocketErrorHandler);
				this.socket.removeEventListener('message', this.onSocketMessageHandler);
				this.socket.close(code, message);
			}
			this.socket = null;
			this.disconnectCode = code;
			this.disconnectReason = message;
			this.connected = false;
		}
		createSocket() {
			if (this.socket) {
				throw new Error('Socket already exists');
			}
			if (!this.path) {
				throw new Error('Websocket connection path is not defined');
			}
			this.socket = new WebSocket(this.path);
			this.socket.binaryType = 'arraybuffer';
			this.socket.addEventListener('open', this.onSocketOpenHandler);
			this.socket.addEventListener('close', this.onSocketCloseHandler);
			this.socket.addEventListener('error', this.onSocketErrorHandler);
			this.socket.addEventListener('message', this.onSocketMessageHandler);
		}

		/**
		 * Sends some data to the server via websocket connection.
		 * @param {ArrayBuffer} buffer Data to send.
		 */
		send(buffer) {
			if (!this.socket || this.socket.readyState !== 1) {
				console.error(`${getDateForLog()}: Pull: WebSocket is not connected`);
				return false;
			}
			this.socket.send(buffer);
			return true;
		}
		onSocketOpen() {
			this.connected = true;
		}
		onSocketClose(e) {
			this.socket = null;
			this.disconnectCode = e.code;
			this.disconnectReason = e.reason;
			this.connected = false;
		}
		onSocketError(e) {
			this.callbacks.onError(e);
		}
		onSocketMessage(e) {
			this.callbacks.onMessage(e.data);
		}
		destroy() {
			if (this.socket) {
				this.socket.close();
				this.socket = null;
			}
		}
	}

	/* eslint-disable @bitrix24/bitrix24-rules/no-native-events-binding */

	const LONG_POLLING_TIMEOUT = 60;
	class LongPollingConnector extends AbstractConnector {
		connectionType = ConnectionType.LongPolling;
		active = false;
		requestTimeout = null;
		failureTimeout = null;
		requestAborted = false;
		constructor(config) {
			super(config);
			this.xhr = this.createXhr();
			this.isBinary = config.isBinary;
		}
		createXhr() {
			const result = new XMLHttpRequest();
			if (this.isBinary) {
				result.responseType = 'arraybuffer';
			}
			result.addEventListener('readystatechange', this.onXhrReadyStateChange.bind(this));
			return result;
		}
		connect() {
			this.active = true;
			this.performRequest();
		}
		disconnect(code, reason) {
			this.active = false;
			if (this.failureTimeout) {
				clearTimeout(this.failureTimeout);
				this.failureTimeout = null;
			}
			if (this.requestTimeout) {
				clearTimeout(this.requestTimeout);
				this.requestTimeout = null;
			}
			if (this.xhr) {
				this.requestAborted = true;
				this.xhr.abort();
			}
			this.disconnectCode = code;
			this.disconnectReason = reason;
			this.connected = false;
		}
		performRequest() {
			if (!this.active) {
				return;
			}
			if (!this.path) {
				throw new Error('Long polling connection path is not defined');
			}
			if (this.xhr.readyState !== 0 && this.xhr.readyState !== 4) {
				return;
			}
			clearTimeout(this.failureTimeout);
			clearTimeout(this.requestTimeout);
			this.failureTimeout = setTimeout(() => {
				this.connected = true;
			}, 5000);
			this.requestTimeout = setTimeout(this.onRequestTimeout.bind(this), LONG_POLLING_TIMEOUT * 1000);
			this.xhr.open('GET', this.path);
			this.xhr.send();
		}
		onRequestTimeout() {
			this.requestAborted = true;
			this.xhr.abort();
			this.performRequest();
		}
		onXhrReadyStateChange() {
			if (this.xhr.readyState === 4) {
				if (!this.requestAborted || this.xhr.status === 200) {
					this.onResponse(this.xhr.response);
				}
				this.requestAborted = false;
			}
		}

		/**
		 * Sends some data to the server via http request.
		 */
		send(buffer) {
			const path = this.parent.getPublicationPath();
			if (!path) {
				console.error(`${getDateForLog()}: Pull: publication path is empty`);
				return;
			}
			const xhr = new XMLHttpRequest();
			xhr.open('POST', path);
			xhr.send(buffer);
		}
		onResponse(response) {
			if (this.failureTimeout) {
				clearTimeout(this.failureTimeout);
				this.failureTimeout = 0;
			}
			if (this.requestTimeout) {
				clearTimeout(this.requestTimeout);
				this.requestTimeout = 0;
			}
			if (this.xhr.status === 200) {
				this.connected = true;
				if (isNotEmptyString(response) || response instanceof ArrayBuffer) {
					this.callbacks.onMessage(response);
				} else {
					this.parent.session.mid = null;
				}
				this.performRequest();
			} else if (this.xhr.status === 304) {
				this.connected = true;
				if (this.xhr.getResponseHeader('Expires') === 'Thu, 01 Jan 1973 11:11:01 GMT') {
					const lastMessageId = this.xhr.getResponseHeader('Last-Message-Id');
					if (isNotEmptyString(lastMessageId)) {
						this.parent.setLastMessageId(lastMessageId);
					}
				}
				this.performRequest();
			} else {
				this.callbacks.onError('Could not connect to the server');
				this.connected = false;
			}
		}
	}

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	var protobuf$1 = {};

	/*!
	 * protobuf.js v7.6.5 (c) 2016, daniel wirtz
	 * compiled sat, 04 jul 2026 01:13:07 utc
	 * licensed under the bsd-3-clause license
	 * see: https://github.com/dcodeio/protobuf.js for details
	 *
	 * Modify list for integration with Bitrix Framework:
	 * - removed integration with RequireJS and AMD package builders;
	 * - removed the source map reference, the map file is not shipped;
	 */

	var hasRequiredProtobuf;

	function requireProtobuf () {
		if (hasRequiredProtobuf) return protobuf$1;
		hasRequiredProtobuf = 1;
		(function (undefined$1) {

			(function prelude(modules, cache, entries) {
				// This is the prelude used to bundle protobuf.js for the browser. Wraps up the CommonJS
				// sources through a conflict-free require shim and is again wrapped within an iife that
				// provides a minification-friendly `undefined` var plus a global "use strict" directive
				// so that minification can remove the directives of each module.

				function $require(name) {
					var $module = cache[name];
					if (!$module) modules[name][0].call($module = cache[name] = {
						exports: {}
					}, $require, $module, $module.exports);
					return $module.exports;
				}
				var protobuf = $require(entries[0]);

				// Expose globally
				protobuf.util.global.protobuf = protobuf;

				// Be nice to AMD
				/*if (typeof define === "function" && define.amd)
						define(["long"], function(Long) {
								if (Long && Long.isLong) {
										protobuf.util.Long = Long;
										protobuf.configure();
								}
								return protobuf;
						});*/

				// Be nice to CommonJS
				/*if (typeof module === "object" && module && module.exports)
						module.exports = protobuf;*/
			} /* end of prelude */)({
				1: [function (require, module, exports) {

					module.exports = asPromise;

					/**
					 * Callback as used by {@link util.asPromise}.
					 * @typedef asPromiseCallback
					 * @type {function}
					 * @param {Error|null} error Error, if any
					 * @param {...*} params Additional arguments
					 * @returns {undefined}
					 */

					/**
					 * Returns a promise from a node-style callback function.
					 * @memberof util
					 * @param {asPromiseCallback} fn Function to call
					 * @param {*} ctx Function context
					 * @param {...*} params Function arguments
					 * @returns {Promise<*>} Promisified function
					 */
					function asPromise(fn, ctx /*, varargs */) {
						var params = new Array(arguments.length - 1),
							offset = 0,
							index = 2,
							pending = true;
						while (index < arguments.length) params[offset++] = arguments[index++];
						return new Promise(function executor(resolve, reject) {
							params[offset] = function callback(err /*, varargs */) {
								if (pending) {
									pending = false;
									if (err) reject(err);else {
										var params = new Array(arguments.length - 1),
											offset = 0;
										while (offset < params.length) params[offset++] = arguments[offset];
										resolve.apply(null, params);
									}
								}
							};
							try {
								fn.apply(ctx || null, params);
							} catch (err) {
								if (pending) {
									pending = false;
									reject(err);
								}
							}
						});
					}
				}, {}],
				2: [function (require, module, exports) {

					/**
					 * A minimal base64 implementation for number arrays.
					 * @memberof util
					 * @namespace
					 */
					var base64 = exports;

					/**
					 * Calculates the byte length of a base64 encoded string.
					 * @param {string} string Base64 encoded string
					 * @returns {number} Byte length
					 */
					base64.length = function length(string) {
						var p = string.length;
						if (!p) return 0;
						var n = 0;
						while (--p % 4 > 1 && string.charAt(p) === "=") ++n;
						return Math.ceil(string.length * 3) / 4 - n;
					};

					// Base64 encoding table
					var b64 = new Array(64);

					// Base64 decoding table
					var s64 = new Array(123);

					// 65..90, 97..122, 48..57, 43, 47
					for (var i = 0; i < 64;) s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;

					/**
					 * Encodes a buffer to a base64 encoded string.
					 * @param {Uint8Array} buffer Source buffer
					 * @param {number} start Source start
					 * @param {number} end Source end
					 * @returns {string} Base64 encoded string
					 */
					base64.encode = function encode(buffer, start, end) {
						var parts = null,
							chunk = [];
						var i = 0,
							// output index
							j = 0,
							// goto index
							t; // temporary
						while (start < end) {
							var b = buffer[start++];
							switch (j) {
								case 0:
									chunk[i++] = b64[b >> 2];
									t = (b & 3) << 4;
									j = 1;
									break;
								case 1:
									chunk[i++] = b64[t | b >> 4];
									t = (b & 15) << 2;
									j = 2;
									break;
								case 2:
									chunk[i++] = b64[t | b >> 6];
									chunk[i++] = b64[b & 63];
									j = 0;
									break;
							}
							if (i > 8191) {
								(parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
								i = 0;
							}
						}
						if (j) {
							chunk[i++] = b64[t];
							chunk[i++] = 61;
							if (j === 1) chunk[i++] = 61;
						}
						if (parts) {
							if (i) parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
							return parts.join("");
						}
						return String.fromCharCode.apply(String, chunk.slice(0, i));
					};
					var invalidEncoding = "invalid encoding";

					/**
					 * Decodes a base64 encoded string to a buffer.
					 * @param {string} string Source string
					 * @param {Uint8Array} buffer Destination buffer
					 * @param {number} offset Destination offset
					 * @returns {number} Number of bytes written
					 * @throws {Error} If encoding is invalid
					 */
					base64.decode = function decode(string, buffer, offset) {
						var start = offset;
						var j = 0,
							// goto index
							t; // temporary
						for (var i = 0; i < string.length;) {
							var c = string.charCodeAt(i++);
							if (c === 61 && j > 1) break;
							if ((c = s64[c]) === undefined$1) throw Error(invalidEncoding);
							switch (j) {
								case 0:
									t = c;
									j = 1;
									break;
								case 1:
									buffer[offset++] = t << 2 | (c & 48) >> 4;
									t = c;
									j = 2;
									break;
								case 2:
									buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
									t = c;
									j = 3;
									break;
								case 3:
									buffer[offset++] = (t & 3) << 6 | c;
									j = 0;
									break;
							}
						}
						if (j === 1) throw Error(invalidEncoding);
						return offset - start;
					};

					/**
					 * Tests if the specified string appears to be base64 encoded.
					 * @param {string} string String to test
					 * @returns {boolean} `true` if probably base64 encoded, otherwise false
					 */
					base64.test = function test(string) {
						return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string);
					};
				}, {}],
				3: [function (require, module, exports) {

					module.exports = EventEmitter;

					/**
					 * Constructs a new event emitter instance.
					 * @classdesc A minimal event emitter.
					 * @memberof util
					 * @constructor
					 */
					function EventEmitter() {
						/**
						 * Registered listeners.
						 * @type {Object.<string,*>}
						 * @private
						 */
						this._listeners = Object.create(null);
					}

					/**
					 * Event listener as used by {@link util.EventEmitter}.
					 * @typedef EventEmitterListener
					 * @type {function}
					 * @param {...*} args Arguments
					 * @returns {undefined}
					 */

					/**
					 * Registers an event listener.
					 * @param {string} evt Event name
					 * @param {EventEmitterListener} fn Listener
					 * @param {*} [ctx] Listener context
					 * @returns {this} `this`
					 */
					EventEmitter.prototype.on = function on(evt, fn, ctx) {
						(this._listeners[evt] || (this._listeners[evt] = [])).push({
							fn: fn,
							ctx: ctx || this
						});
						return this;
					};

					/**
					 * Removes an event listener or any matching listeners if arguments are omitted.
					 * @param {string} [evt] Event name. Removes all listeners if omitted.
					 * @param {EventEmitterListener} [fn] Listener to remove. Removes all listeners of `evt` if omitted.
					 * @returns {this} `this`
					 */
					EventEmitter.prototype.off = function off(evt, fn) {
						if (evt === undefined$1) this._listeners = Object.create(null);else {
							if (fn === undefined$1) this._listeners[evt] = [];else {
								var listeners = this._listeners[evt];
								if (!listeners) return this;
								for (var i = 0; i < listeners.length;) if (listeners[i].fn === fn) listeners.splice(i, 1);else ++i;
							}
						}
						return this;
					};

					/**
					 * Emits an event by calling its listeners with the specified arguments.
					 * @param {string} evt Event name
					 * @param {...*} args Arguments
					 * @returns {this} `this`
					 */
					EventEmitter.prototype.emit = function emit(evt) {
						var listeners = this._listeners[evt];
						if (listeners) {
							var args = [],
								i = 1;
							for (; i < arguments.length;) args.push(arguments[i++]);
							for (i = 0; i < listeners.length;) listeners[i].fn.apply(listeners[i++].ctx, args);
						}
						return this;
					};
				}, {}],
				4: [function (require, module, exports) {

					module.exports = factory(factory);

					/**
					 * Reads / writes floats / doubles from / to buffers.
					 * @name util.float
					 * @namespace
					 */

					/**
					 * Writes a 32 bit float to a buffer using little endian byte order.
					 * @name util.float.writeFloatLE
					 * @function
					 * @param {number} val Value to write
					 * @param {Uint8Array} buf Target buffer
					 * @param {number} pos Target buffer offset
					 * @returns {undefined}
					 */

					/**
					 * Writes a 32 bit float to a buffer using big endian byte order.
					 * @name util.float.writeFloatBE
					 * @function
					 * @param {number} val Value to write
					 * @param {Uint8Array} buf Target buffer
					 * @param {number} pos Target buffer offset
					 * @returns {undefined}
					 */

					/**
					 * Reads a 32 bit float from a buffer using little endian byte order.
					 * @name util.float.readFloatLE
					 * @function
					 * @param {Uint8Array} buf Source buffer
					 * @param {number} pos Source buffer offset
					 * @returns {number} Value read
					 */

					/**
					 * Reads a 32 bit float from a buffer using big endian byte order.
					 * @name util.float.readFloatBE
					 * @function
					 * @param {Uint8Array} buf Source buffer
					 * @param {number} pos Source buffer offset
					 * @returns {number} Value read
					 */

					/**
					 * Writes a 64 bit double to a buffer using little endian byte order.
					 * @name util.float.writeDoubleLE
					 * @function
					 * @param {number} val Value to write
					 * @param {Uint8Array} buf Target buffer
					 * @param {number} pos Target buffer offset
					 * @returns {undefined}
					 */

					/**
					 * Writes a 64 bit double to a buffer using big endian byte order.
					 * @name util.float.writeDoubleBE
					 * @function
					 * @param {number} val Value to write
					 * @param {Uint8Array} buf Target buffer
					 * @param {number} pos Target buffer offset
					 * @returns {undefined}
					 */

					/**
					 * Reads a 64 bit double from a buffer using little endian byte order.
					 * @name util.float.readDoubleLE
					 * @function
					 * @param {Uint8Array} buf Source buffer
					 * @param {number} pos Source buffer offset
					 * @returns {number} Value read
					 */

					/**
					 * Reads a 64 bit double from a buffer using big endian byte order.
					 * @name util.float.readDoubleBE
					 * @function
					 * @param {Uint8Array} buf Source buffer
					 * @param {number} pos Source buffer offset
					 * @returns {number} Value read
					 */

					// Factory function for the purpose of node-based testing in modified global environments
					function factory(exports) {
						// float: typed array
						if (typeof Float32Array !== "undefined") (function () {
							var f32 = new Float32Array([-0]),
								f8b = new Uint8Array(f32.buffer),
								le = f8b[3] === 128;
							function writeFloat_f32_cpy(val, buf, pos) {
								f32[0] = val;
								buf[pos] = f8b[0];
								buf[pos + 1] = f8b[1];
								buf[pos + 2] = f8b[2];
								buf[pos + 3] = f8b[3];
							}
							function writeFloat_f32_rev(val, buf, pos) {
								f32[0] = val;
								buf[pos] = f8b[3];
								buf[pos + 1] = f8b[2];
								buf[pos + 2] = f8b[1];
								buf[pos + 3] = f8b[0];
							}

							/* istanbul ignore next */
							exports.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
							/* istanbul ignore next */
							exports.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;
							function readFloat_f32_cpy(buf, pos) {
								f8b[0] = buf[pos];
								f8b[1] = buf[pos + 1];
								f8b[2] = buf[pos + 2];
								f8b[3] = buf[pos + 3];
								return f32[0];
							}
							function readFloat_f32_rev(buf, pos) {
								f8b[3] = buf[pos];
								f8b[2] = buf[pos + 1];
								f8b[1] = buf[pos + 2];
								f8b[0] = buf[pos + 3];
								return f32[0];
							}

							/* istanbul ignore next */
							exports.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
							/* istanbul ignore next */
							exports.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;

							// float: ieee754
						})();else (function () {
							function writeFloat_ieee754(writeUint, val, buf, pos) {
								var sign = val < 0 ? 1 : 0;
								if (sign) val = -val;
								if (val === 0) writeUint(1 / val > 0 ? /* positive */0 : /* negative 0 */2147483648, buf, pos);else if (isNaN(val)) writeUint(2143289344, buf, pos);else if (val > 3.4028234663852886e+38)
									// +-Infinity
									writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);else if (val < 1.1754943508222875e-38)
									// denormal
									writeUint((sign << 31 | Math.round(val / 1.401298464324817e-45)) >>> 0, buf, pos);else {
									var exponent = Math.floor(Math.log(val) / Math.LN2),
										mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
									writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
								}
							}
							exports.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
							exports.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);
							function readFloat_ieee754(readUint, buf, pos) {
								var uint = readUint(buf, pos),
									sign = (uint >> 31) * 2 + 1,
									exponent = uint >>> 23 & 255,
									mantissa = uint & 8388607;
								return exponent === 255 ? mantissa ? NaN : sign * Infinity : exponent === 0 // denormal
								? sign * 1.401298464324817e-45 * mantissa : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
							}
							exports.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
							exports.readFloatBE = readFloat_ieee754.bind(null, readUintBE);
						})();

						// double: typed array
						if (typeof Float64Array !== "undefined") (function () {
							var f64 = new Float64Array([-0]),
								f8b = new Uint8Array(f64.buffer),
								le = f8b[7] === 128;
							function writeDouble_f64_cpy(val, buf, pos) {
								f64[0] = val;
								buf[pos] = f8b[0];
								buf[pos + 1] = f8b[1];
								buf[pos + 2] = f8b[2];
								buf[pos + 3] = f8b[3];
								buf[pos + 4] = f8b[4];
								buf[pos + 5] = f8b[5];
								buf[pos + 6] = f8b[6];
								buf[pos + 7] = f8b[7];
							}
							function writeDouble_f64_rev(val, buf, pos) {
								f64[0] = val;
								buf[pos] = f8b[7];
								buf[pos + 1] = f8b[6];
								buf[pos + 2] = f8b[5];
								buf[pos + 3] = f8b[4];
								buf[pos + 4] = f8b[3];
								buf[pos + 5] = f8b[2];
								buf[pos + 6] = f8b[1];
								buf[pos + 7] = f8b[0];
							}

							/* istanbul ignore next */
							exports.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
							/* istanbul ignore next */
							exports.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;
							function readDouble_f64_cpy(buf, pos) {
								f8b[0] = buf[pos];
								f8b[1] = buf[pos + 1];
								f8b[2] = buf[pos + 2];
								f8b[3] = buf[pos + 3];
								f8b[4] = buf[pos + 4];
								f8b[5] = buf[pos + 5];
								f8b[6] = buf[pos + 6];
								f8b[7] = buf[pos + 7];
								return f64[0];
							}
							function readDouble_f64_rev(buf, pos) {
								f8b[7] = buf[pos];
								f8b[6] = buf[pos + 1];
								f8b[5] = buf[pos + 2];
								f8b[4] = buf[pos + 3];
								f8b[3] = buf[pos + 4];
								f8b[2] = buf[pos + 5];
								f8b[1] = buf[pos + 6];
								f8b[0] = buf[pos + 7];
								return f64[0];
							}

							/* istanbul ignore next */
							exports.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
							/* istanbul ignore next */
							exports.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;

							// double: ieee754
						})();else (function () {
							function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
								var sign = val < 0 ? 1 : 0;
								if (sign) val = -val;
								if (val === 0) {
									writeUint(0, buf, pos + off0);
									writeUint(1 / val > 0 ? /* positive */0 : /* negative 0 */2147483648, buf, pos + off1);
								} else if (isNaN(val)) {
									writeUint(0, buf, pos + off0);
									writeUint(2146959360, buf, pos + off1);
								} else if (val > 1.7976931348623157e+308) {
									// +-Infinity
									writeUint(0, buf, pos + off0);
									writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
								} else {
									var mantissa;
									if (val < 2.2250738585072014e-308) {
										// denormal
										mantissa = val / 5e-324;
										writeUint(mantissa >>> 0, buf, pos + off0);
										writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
									} else {
										var exponent = Math.floor(Math.log(val) / Math.LN2);
										if (exponent === 1024) exponent = 1023;
										mantissa = val * Math.pow(2, -exponent);
										writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
										writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
									}
								}
							}
							exports.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
							exports.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);
							function readDouble_ieee754(readUint, off0, off1, buf, pos) {
								var lo = readUint(buf, pos + off0),
									hi = readUint(buf, pos + off1);
								var sign = (hi >> 31) * 2 + 1,
									exponent = hi >>> 20 & 2047,
									mantissa = 4294967296 * (hi & 1048575) + lo;
								return exponent === 2047 ? mantissa ? NaN : sign * Infinity : exponent === 0 // denormal
								? sign * 5e-324 * mantissa : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
							}
							exports.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
							exports.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);
						})();
						return exports;
					}

					// uint helpers

					function writeUintLE(val, buf, pos) {
						buf[pos] = val & 255;
						buf[pos + 1] = val >>> 8 & 255;
						buf[pos + 2] = val >>> 16 & 255;
						buf[pos + 3] = val >>> 24;
					}
					function writeUintBE(val, buf, pos) {
						buf[pos] = val >>> 24;
						buf[pos + 1] = val >>> 16 & 255;
						buf[pos + 2] = val >>> 8 & 255;
						buf[pos + 3] = val & 255;
					}
					function readUintLE(buf, pos) {
						return (buf[pos] | buf[pos + 1] << 8 | buf[pos + 2] << 16 | buf[pos + 3] << 24) >>> 0;
					}
					function readUintBE(buf, pos) {
						return (buf[pos] << 24 | buf[pos + 1] << 16 | buf[pos + 2] << 8 | buf[pos + 3]) >>> 0;
					}
				}, {}],
				5: [function (require, module, exports) {

					module.exports = pool;

					/**
					 * An allocator as used by {@link util.pool}.
					 * @typedef PoolAllocator
					 * @type {function}
					 * @param {number} size Buffer size
					 * @returns {Uint8Array} Buffer
					 */

					/**
					 * A slicer as used by {@link util.pool}.
					 * @typedef PoolSlicer
					 * @type {function}
					 * @param {number} start Start offset
					 * @param {number} end End offset
					 * @returns {Uint8Array} Buffer slice
					 * @this {Uint8Array}
					 */

					/**
					 * A general purpose buffer pool.
					 * @memberof util
					 * @function
					 * @param {PoolAllocator} alloc Allocator
					 * @param {PoolSlicer} slice Slicer
					 * @param {number} [size=8192] Slab size
					 * @returns {PoolAllocator} Pooled allocator
					 */
					function pool(alloc, slice, size) {
						var SIZE = size || 8192;
						var MAX = SIZE >>> 1;
						var slab = null;
						var offset = SIZE;
						return function pool_alloc(size) {
							if (size < 1 || size > MAX) return alloc(size);
							if (offset + size > SIZE) {
								slab = alloc(SIZE);
								offset = 0;
							}
							var buf = slice.call(slab, offset, offset += size);
							if (offset & 7)
								// align to 32 bit
								offset = (offset | 7) + 1;
							return buf;
						};
					}
				}, {}],
				6: [function (require, module, exports) {

					/**
					 * A minimal UTF8 implementation for number arrays.
					 * @memberof util
					 * @namespace
					 */
					var utf8 = exports,
						replacementChar = "\ufffd";

					/**
					 * Calculates the UTF8 byte length of a string.
					 * @param {string} string String
					 * @returns {number} Byte length
					 */
					utf8.length = function utf8_length(string) {
						var len = 0,
							c = 0;
						for (var i = 0; i < string.length; ++i) {
							c = string.charCodeAt(i);
							if (c < 128) len += 1;else if (c < 2048) len += 2;else if ((c & 0xFC00) === 0xD800 && (string.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
								++i;
								len += 4;
							} else len += 3;
						}
						return len;
					};

					/**
					 * Reads UTF8 bytes as a string.
					 * @param {Uint8Array} buffer Source buffer
					 * @param {number} start Source start
					 * @param {number} end Source end
					 * @returns {string} String read
					 */
					utf8.read = function utf8_read(buffer, start, end) {
						if (end - start < 1) {
							return "";
						}
						var str = "";
						for (var i = start; i < end;) {
							var t = buffer[i++];
							if (t <= 0x7F) {
								str += String.fromCharCode(t);
							} else if (t >= 0xC0 && t < 0xE0) {
								var c2 = (t & 0x1F) << 6 | buffer[i++] & 0x3F;
								str += c2 >= 0x80 ? String.fromCharCode(c2) : replacementChar;
							} else if (t >= 0xE0 && t < 0xF0) {
								var c3 = (t & 0xF) << 12 | (buffer[i++] & 0x3F) << 6 | buffer[i++] & 0x3F;
								str += c3 >= 0x800 ? String.fromCharCode(c3) : replacementChar;
							} else if (t >= 0xF0) {
								var t2 = (t & 7) << 18 | (buffer[i++] & 0x3F) << 12 | (buffer[i++] & 0x3F) << 6 | buffer[i++] & 0x3F;
								if (t2 < 0x10000 || t2 > 0x10FFFF) str += replacementChar;else {
									t2 -= 0x10000;
									str += String.fromCharCode(0xD800 + (t2 >> 10));
									str += String.fromCharCode(0xDC00 + (t2 & 0x3FF));
								}
							}
						}
						return str;
					};

					/**
					 * Writes a string as UTF8 bytes.
					 * @param {string} string Source string
					 * @param {Uint8Array} buffer Destination buffer
					 * @param {number} offset Destination offset
					 * @returns {number} Bytes written
					 */
					utf8.write = function utf8_write(string, buffer, offset) {
						var start = offset,
							c1,
							// character 1
							c2; // character 2
						for (var i = 0; i < string.length; ++i) {
							c1 = string.charCodeAt(i);
							if (c1 < 128) {
								buffer[offset++] = c1;
							} else if (c1 < 2048) {
								buffer[offset++] = c1 >> 6 | 192;
								buffer[offset++] = c1 & 63 | 128;
							} else if ((c1 & 0xFC00) === 0xD800 && ((c2 = string.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
								c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
								++i;
								buffer[offset++] = c1 >> 18 | 240;
								buffer[offset++] = c1 >> 12 & 63 | 128;
								buffer[offset++] = c1 >> 6 & 63 | 128;
								buffer[offset++] = c1 & 63 | 128;
							} else {
								buffer[offset++] = c1 >> 12 | 224;
								buffer[offset++] = c1 >> 6 & 63 | 128;
								buffer[offset++] = c1 & 63 | 128;
							}
						}
						return offset - start;
					};
				}, {}],
				7: [function (require, module, exports) {

					var protobuf = exports;

					/**
					 * Build type, one of `"full"`, `"light"` or `"minimal"`.
					 * @name build
					 * @type {string}
					 * @const
					 */
					protobuf.build = "minimal";

					// Serialization
					protobuf.Writer = require(15);
					protobuf.BufferWriter = require(16);
					protobuf.Reader = require(8);
					protobuf.BufferReader = require(9);

					// Utility
					protobuf.util = require(14);
					protobuf.rpc = require(11);
					protobuf.roots = require(10);
					protobuf.configure = configure;

					/* istanbul ignore next */
					/**
					 * Reconfigures the library according to the environment.
					 * @returns {undefined}
					 */
					function configure() {
						protobuf.util._configure();
						protobuf.Writer._configure(protobuf.BufferWriter);
						protobuf.Reader._configure(protobuf.BufferReader);
					}

					// Set up buffer utility according to the environment
					configure();
				}, {
					"10": 10,
					"11": 11,
					"14": 14,
					"15": 15,
					"16": 16,
					"8": 8,
					"9": 9
				}],
				8: [function (require, module, exports) {

					module.exports = Reader;
					var util = require(14);
					var BufferReader; // cyclic

					var LongBits = util.LongBits,
						utf8 = util.utf8;

					/* istanbul ignore next */
					function indexOutOfRange(reader, writeLength) {
						return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
					}

					/**
					 * Constructs a new reader instance using the specified buffer.
					 * @classdesc Wire format reader using `Uint8Array` if available, otherwise `Array`.
					 * @constructor
					 * @param {Uint8Array} buffer Buffer to read from
					 */
					function Reader(buffer) {
						/**
						 * Read buffer.
						 * @type {Uint8Array}
						 */
						this.buf = buffer;

						/**
						 * Read buffer position.
						 * @type {number}
						 */
						this.pos = 0;

						/**
						 * Read buffer length.
						 * @type {number}
						 */
						this.len = buffer.length;
					}
					var create_array = typeof Uint8Array !== "undefined" ? function create_typed_array(buffer) {
						if (buffer instanceof Uint8Array || Array.isArray(buffer)) return new Reader(buffer);
						throw Error("illegal buffer");
					}
					/* istanbul ignore next */ : function create_array(buffer) {
						if (Array.isArray(buffer)) return new Reader(buffer);
						throw Error("illegal buffer");
					};
					var create = function create() {
						return util.Buffer ? function create_buffer_setup(buffer) {
							return (Reader.create = function create_buffer(buffer) {
								return util.Buffer.isBuffer(buffer) ? new BufferReader(buffer)
								/* istanbul ignore next */ : create_array(buffer);
							})(buffer);
						}
						/* istanbul ignore next */ : create_array;
					};

					/**
					 * Creates a new reader using the specified buffer.
					 * @function
					 * @param {Uint8Array|Buffer} buffer Buffer to read from
					 * @returns {Reader|BufferReader} A {@link BufferReader} if `buffer` is a Buffer, otherwise a {@link Reader}
					 * @throws {Error} If `buffer` is not a valid buffer
					 */
					Reader.create = create();
					Reader.prototype._slice = util.Array.prototype.subarray || /* istanbul ignore next */util.Array.prototype.slice;

					/**
					 * Reads a varint as an unsigned 32 bit value.
					 * @function
					 * @returns {number} Value read
					 */
					Reader.prototype.uint32 = function read_uint32_setup() {
						var value = 4294967295; // optimizer type-hint, tends to deopt otherwise (?!)
						return function read_uint32() {
							value = (this.buf[this.pos] & 127) >>> 0;
							if (this.buf[this.pos++] < 128) return value;
							value = (value | (this.buf[this.pos] & 127) << 7) >>> 0;
							if (this.buf[this.pos++] < 128) return value;
							value = (value | (this.buf[this.pos] & 127) << 14) >>> 0;
							if (this.buf[this.pos++] < 128) return value;
							value = (value | (this.buf[this.pos] & 127) << 21) >>> 0;
							if (this.buf[this.pos++] < 128) return value;
							value = (value | (this.buf[this.pos] & 15) << 28) >>> 0;
							if (this.buf[this.pos++] < 128) return value;

							/* istanbul ignore if */
							if ((this.pos += 5) > this.len) {
								this.pos = this.len;
								throw indexOutOfRange(this, 10);
							}
							return value;
						};
					}();

					/**
					 * Reads a varint as a signed 32 bit value.
					 * @returns {number} Value read
					 */
					Reader.prototype.int32 = function read_int32() {
						return this.uint32() | 0;
					};

					/**
					 * Reads a zig-zag encoded varint as a signed 32 bit value.
					 * @returns {number} Value read
					 */
					Reader.prototype.sint32 = function read_sint32() {
						var value = this.uint32();
						return value >>> 1 ^ -(value & 1) | 0;
					};

					/* eslint-disable no-invalid-this */

					function readLongVarint() {
						// tends to deopt with local vars for octet etc.
						var bits = new LongBits(0, 0);
						var i = 0;
						if (this.len - this.pos > 4) {
							// fast route (lo)
							for (; i < 4; ++i) {
								// 1st..4th
								bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
								if (this.buf[this.pos++] < 128) return bits;
							}
							// 5th
							bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
							bits.hi = (bits.hi | (this.buf[this.pos] & 127) >> 4) >>> 0;
							if (this.buf[this.pos++] < 128) return bits;
							i = 0;
						} else {
							for (; i < 3; ++i) {
								/* istanbul ignore if */
								if (this.pos >= this.len) throw indexOutOfRange(this);
								// 1st..3th
								bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
								if (this.buf[this.pos++] < 128) return bits;
							}
							// 4th
							bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
							return bits;
						}
						if (this.len - this.pos > 4) {
							// fast route (hi)
							for (; i < 5; ++i) {
								// 6th..10th
								bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
								if (this.buf[this.pos++] < 128) return bits;
							}
						} else {
							for (; i < 5; ++i) {
								/* istanbul ignore if */
								if (this.pos >= this.len) throw indexOutOfRange(this);
								// 6th..10th
								bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
								if (this.buf[this.pos++] < 128) return bits;
							}
						}
						/* istanbul ignore next */
						throw Error("invalid varint encoding");
					}

					/* eslint-enable no-invalid-this */

					/**
					 * Reads a varint as a signed 64 bit value.
					 * @name Reader#int64
					 * @function
					 * @returns {Long} Value read
					 */

					/**
					 * Reads a varint as an unsigned 64 bit value.
					 * @name Reader#uint64
					 * @function
					 * @returns {Long} Value read
					 */

					/**
					 * Reads a zig-zag encoded varint as a signed 64 bit value.
					 * @name Reader#sint64
					 * @function
					 * @returns {Long} Value read
					 */

					/**
					 * Reads a varint as a boolean.
					 * @returns {boolean} Value read
					 */
					Reader.prototype.bool = function read_bool() {
						return this.uint32() !== 0;
					};
					function readFixed32_end(buf, end) {
						// note that this uses `end`, not `pos`
						return (buf[end - 4] | buf[end - 3] << 8 | buf[end - 2] << 16 | buf[end - 1] << 24) >>> 0;
					}

					/**
					 * Reads fixed 32 bits as an unsigned 32 bit integer.
					 * @returns {number} Value read
					 */
					Reader.prototype.fixed32 = function read_fixed32() {
						/* istanbul ignore if */
						if (this.pos + 4 > this.len) throw indexOutOfRange(this, 4);
						return readFixed32_end(this.buf, this.pos += 4);
					};

					/**
					 * Reads fixed 32 bits as a signed 32 bit integer.
					 * @returns {number} Value read
					 */
					Reader.prototype.sfixed32 = function read_sfixed32() {
						/* istanbul ignore if */
						if (this.pos + 4 > this.len) throw indexOutOfRange(this, 4);
						return readFixed32_end(this.buf, this.pos += 4) | 0;
					};

					/* eslint-disable no-invalid-this */

					function readFixed64(/* this: Reader */
					) {
						/* istanbul ignore if */
						if (this.pos + 8 > this.len) throw indexOutOfRange(this, 8);
						return new LongBits(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
					}

					/* eslint-enable no-invalid-this */

					/**
					 * Reads fixed 64 bits.
					 * @name Reader#fixed64
					 * @function
					 * @returns {Long} Value read
					 */

					/**
					 * Reads zig-zag encoded fixed 64 bits.
					 * @name Reader#sfixed64
					 * @function
					 * @returns {Long} Value read
					 */

					/**
					 * Reads a float (32 bit) as a number.
					 * @function
					 * @returns {number} Value read
					 */
					Reader.prototype.float = function read_float() {
						/* istanbul ignore if */
						if (this.pos + 4 > this.len) throw indexOutOfRange(this, 4);
						var value = util.float.readFloatLE(this.buf, this.pos);
						this.pos += 4;
						return value;
					};

					/**
					 * Reads a double (64 bit float) as a number.
					 * @function
					 * @returns {number} Value read
					 */
					Reader.prototype.double = function read_double() {
						/* istanbul ignore if */
						if (this.pos + 8 > this.len) throw indexOutOfRange(this, 4);
						var value = util.float.readDoubleLE(this.buf, this.pos);
						this.pos += 8;
						return value;
					};

					/**
					 * Reads a sequence of bytes preceeded by its length as a varint.
					 * @returns {Uint8Array} Value read
					 */
					Reader.prototype.bytes = function read_bytes() {
						var length = this.uint32(),
							start = this.pos,
							end = this.pos + length;

						/* istanbul ignore if */
						if (end > this.len) throw indexOutOfRange(this, length);
						this.pos += length;
						if (Array.isArray(this.buf))
							// plain array
							return this.buf.slice(start, end);
						if (start === end) {
							// fix for IE 10/Win8 and others' subarray returning array of size 1
							var nativeBuffer = util.Buffer;
							return nativeBuffer ? nativeBuffer.alloc(0) : new this.buf.constructor(0);
						}
						return this._slice.call(this.buf, start, end);
					};

					/**
					 * Reads a string preceeded by its byte length as a varint.
					 * @returns {string} Value read
					 */
					Reader.prototype.string = function read_string() {
						var bytes = this.bytes();
						return utf8.read(bytes, 0, bytes.length);
					};

					/**
					 * Skips the specified number of bytes if specified, otherwise skips a varint.
					 * @param {number} [length] Length if known, otherwise a varint is assumed
					 * @returns {Reader} `this`
					 */
					Reader.prototype.skip = function skip(length) {
						if (typeof length === "number") {
							/* istanbul ignore if */
							if (this.pos + length > this.len) throw indexOutOfRange(this, length);
							this.pos += length;
						} else {
							do {
								/* istanbul ignore if */
								if (this.pos >= this.len) throw indexOutOfRange(this);
							} while (this.buf[this.pos++] & 128);
						}
						return this;
					};

					/**
					 * Recursion limit.
					 * @type {number}
					 */
					Reader.recursionLimit = util.recursionLimit;

					/**
					 * Skips the next element of the specified wire type.
					 * @param {number} wireType Wire type received
					 * @param {number} [depth] Depth of recursion to control nested calls; 0 if omitted
					 * @returns {Reader} `this`
					 */
					Reader.prototype.skipType = function (wireType, depth) {
						if (depth === undefined$1) depth = 0;
						if (depth > Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
						switch (wireType) {
							case 0:
								this.skip();
								break;
							case 1:
								this.skip(8);
								break;
							case 2:
								this.skip(this.uint32());
								break;
							case 3:
								while ((wireType = this.uint32() & 7) !== 4) {
									this.skipType(wireType, depth + 1);
								}
								break;
							case 5:
								this.skip(4);
								break;

							/* istanbul ignore next */
							default:
								throw Error("invalid wire type " + wireType + " at offset " + this.pos);
						}
						return this;
					};
					Reader._configure = function (BufferReader_) {
						BufferReader = BufferReader_;
						Reader.create = create();
						BufferReader._configure();
						var fn = util.Long ? "toLong" : /* istanbul ignore next */"toNumber";
						util.merge(Reader.prototype, {
							int64: function read_int64() {
								return readLongVarint.call(this)[fn](false);
							},
							uint64: function read_uint64() {
								return readLongVarint.call(this)[fn](true);
							},
							sint64: function read_sint64() {
								return readLongVarint.call(this).zzDecode()[fn](false);
							},
							fixed64: function read_fixed64() {
								return readFixed64.call(this)[fn](true);
							},
							sfixed64: function read_sfixed64() {
								return readFixed64.call(this)[fn](false);
							}
						});
					};
				}, {
					"14": 14
				}],
				9: [function (require, module, exports) {

					module.exports = BufferReader;

					// extends Reader
					var Reader = require(8);
					(BufferReader.prototype = Object.create(Reader.prototype)).constructor = BufferReader;
					var util = require(14);

					/**
					 * Constructs a new buffer reader instance.
					 * @classdesc Wire format reader using node buffers.
					 * @extends Reader
					 * @constructor
					 * @param {Buffer} buffer Buffer to read from
					 */
					function BufferReader(buffer) {
						Reader.call(this, buffer);

						/**
						 * Read buffer.
						 * @name BufferReader#buf
						 * @type {Buffer}
						 */
					}
					BufferReader._configure = function () {
						/* istanbul ignore else */
						if (util.Buffer) BufferReader.prototype._slice = util.Buffer.prototype.slice;
					};

					/**
					 * @override
					 */
					BufferReader.prototype.string = function read_string_buffer() {
						var len = this.uint32(); // modifies pos
						return this.buf.utf8Slice ? this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + len, this.len)) : this.buf.toString("utf-8", this.pos, this.pos = Math.min(this.pos + len, this.len));
					};

					/**
					 * Reads a sequence of bytes preceeded by its length as a varint.
					 * @name BufferReader#bytes
					 * @function
					 * @returns {Buffer} Value read
					 */

					BufferReader._configure();
				}, {
					"14": 14,
					"8": 8
				}],
				10: [function (require, module, exports) {

					module.exports = Object.create(null);

					/**
					 * Named roots.
					 * This is where pbjs stores generated structures (the option `-r, --root` specifies a name).
					 * Can also be used manually to make roots available across modules.
					 * @name roots
					 * @type {Object.<string,Root>}
					 * @example
					 * // pbjs -r myroot -o compiled.js ...
					 *
					 * // in another module:
					 * require("./compiled.js");
					 *
					 * // in any subsequent module:
					 * var root = protobuf.roots["myroot"];
					 */
				}, {}],
				11: [function (require, module, exports) {

					/**
					 * Streaming RPC helpers.
					 * @namespace
					 */
					var rpc = exports;

					/**
					 * RPC implementation passed to {@link Service#create} performing a service request on network level, i.e. by utilizing http requests or websockets.
					 * @typedef RPCImpl
					 * @type {function}
					 * @param {Method|rpc.ServiceMethod<Message<{}>,Message<{}>>} method Reflected or static method being called
					 * @param {Uint8Array} requestData Request data
					 * @param {RPCImplCallback} callback Callback function
					 * @returns {undefined}
					 * @example
					 * function rpcImpl(method, requestData, callback) {
					 *     if (protobuf.util.lcFirst(method.name) !== "myMethod") // compatible with static code
					 *         throw Error("no such method");
					 *     asynchronouslyObtainAResponse(requestData, function(err, responseData) {
					 *         callback(err, responseData);
					 *     });
					 * }
					 */

					/**
					 * Node-style callback as used by {@link RPCImpl}.
					 * @typedef RPCImplCallback
					 * @type {function}
					 * @param {Error|null} error Error, if any, otherwise `null`
					 * @param {Uint8Array|null} [response] Response data or `null` to signal end of stream, if there hasn't been an error
					 * @returns {undefined}
					 */

					rpc.Service = require(12);
				}, {
					"12": 12
				}],
				12: [function (require, module, exports) {

					module.exports = Service;
					var util = require(14);

					// Extends EventEmitter
					(Service.prototype = Object.create(util.EventEmitter.prototype)).constructor = Service;

					/**
					 * A service method callback as used by {@link rpc.ServiceMethod|ServiceMethod}.
					 *
					 * Differs from {@link RPCImplCallback} in that it is an actual callback of a service method which may not return `response = null`.
					 * @typedef rpc.ServiceMethodCallback
					 * @template TRes extends Message<TRes>
					 * @type {function}
					 * @param {Error|null} error Error, if any
					 * @param {TRes} [response] Response message
					 * @returns {undefined}
					 */

					/**
					 * A service method part of a {@link rpc.Service} as created by {@link Service.create}.
					 * @typedef rpc.ServiceMethod
					 * @template TReq extends Message<TReq>
					 * @template TRes extends Message<TRes>
					 * @type {function}
					 * @param {TReq|Properties<TReq>} request Request message or plain object
					 * @param {rpc.ServiceMethodCallback<TRes>} [callback] Node-style callback called with the error, if any, and the response message
					 * @returns {Promise<Message<TRes>>} Promise if `callback` has been omitted, otherwise `undefined`
					 */

					/**
					 * Constructs a new RPC service instance.
					 * @classdesc An RPC service as returned by {@link Service#create}.
					 * @exports rpc.Service
					 * @extends util.EventEmitter
					 * @constructor
					 * @param {RPCImpl} rpcImpl RPC implementation
					 * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
					 * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
					 */
					function Service(rpcImpl, requestDelimited, responseDelimited) {
						if (typeof rpcImpl !== "function") throw TypeError("rpcImpl must be a function");
						util.EventEmitter.call(this);

						/**
						 * RPC implementation. Becomes `null` once the service is ended.
						 * @type {RPCImpl|null}
						 */
						this.rpcImpl = rpcImpl;

						/**
						 * Whether requests are length-delimited.
						 * @type {boolean}
						 */
						this.requestDelimited = Boolean(requestDelimited);

						/**
						 * Whether responses are length-delimited.
						 * @type {boolean}
						 */
						this.responseDelimited = Boolean(responseDelimited);
					}

					/**
					 * Calls a service method through {@link rpc.Service#rpcImpl|rpcImpl}.
					 * @param {Method|rpc.ServiceMethod<TReq,TRes>} method Reflected or static method
					 * @param {Constructor<TReq>} requestCtor Request constructor
					 * @param {Constructor<TRes>} responseCtor Response constructor
					 * @param {TReq|Properties<TReq>} request Request message or plain object
					 * @param {rpc.ServiceMethodCallback<TRes>} callback Service callback
					 * @returns {undefined}
					 * @template TReq extends Message<TReq>
					 * @template TRes extends Message<TRes>
					 */
					Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {
						if (!request) throw TypeError("request must be specified");
						var self = this;
						if (!callback) return util.asPromise(rpcCall, self, method, requestCtor, responseCtor, request);
						if (!self.rpcImpl) {
							setTimeout(function () {
								callback(Error("already ended"));
							}, 0);
							return undefined$1;
						}
						try {
							return self.rpcImpl(method, requestCtor[self.requestDelimited ? "encodeDelimited" : "encode"](request).finish(), function rpcCallback(err, response) {
								if (err) {
									self.emit("error", err, method);
									return callback(err);
								}
								if (response === null) {
									self.end(/* endedByRPC */true);
									return undefined$1;
								}
								if (!(response instanceof responseCtor)) {
									try {
										response = responseCtor[self.responseDelimited ? "decodeDelimited" : "decode"](response);
									} catch (err) {
										self.emit("error", err, method);
										return callback(err);
									}
								}
								self.emit("data", response, method);
								return callback(null, response);
							});
						} catch (err) {
							self.emit("error", err, method);
							setTimeout(function () {
								callback(err);
							}, 0);
							return undefined$1;
						}
					};

					/**
					 * Ends this service and emits the `end` event.
					 * @param {boolean} [endedByRPC=false] Whether the service has been ended by the RPC implementation.
					 * @returns {rpc.Service} `this`
					 */
					Service.prototype.end = function end(endedByRPC) {
						if (this.rpcImpl) {
							if (!endedByRPC)
								// signal end to rpcImpl
								this.rpcImpl(null, null, null);
							this.rpcImpl = null;
							this.emit("end").off();
						}
						return this;
					};
				}, {
					"14": 14
				}],
				13: [function (require, module, exports) {

					module.exports = LongBits;
					var util = require(14);

					/**
					 * Constructs new long bits.
					 * @classdesc Helper class for working with the low and high bits of a 64 bit value.
					 * @memberof util
					 * @constructor
					 * @param {number} lo Low 32 bits, unsigned
					 * @param {number} hi High 32 bits, unsigned
					 */
					function LongBits(lo, hi) {
						// note that the casts below are theoretically unnecessary as of today, but older statically
						// generated converter code might still call the ctor with signed 32bits. kept for compat.

						/**
						 * Low bits.
						 * @type {number}
						 */
						this.lo = lo >>> 0;

						/**
						 * High bits.
						 * @type {number}
						 */
						this.hi = hi >>> 0;
					}

					/**
					 * Zero bits.
					 * @memberof util.LongBits
					 * @type {util.LongBits}
					 */
					var zero = LongBits.zero = new LongBits(0, 0);
					zero.toNumber = function () {
						return 0;
					};
					zero.zzEncode = zero.zzDecode = function () {
						return this;
					};
					zero.length = function () {
						return 1;
					};

					/**
					 * Zero hash.
					 * @memberof util.LongBits
					 * @type {string}
					 */
					var zeroHash = LongBits.zeroHash = "\0\0\0\0\0\0\0\0";

					/**
					 * Constructs new long bits from the specified number.
					 * @param {number} value Value
					 * @returns {util.LongBits} Instance
					 */
					LongBits.fromNumber = function fromNumber(value) {
						if (value === 0) return zero;
						var sign = value < 0;
						if (sign) value = -value;
						var lo = value >>> 0,
							hi = (value - lo) / 4294967296 >>> 0;
						if (sign) {
							hi = ~hi >>> 0;
							lo = ~lo >>> 0;
							if (++lo > 4294967295) {
								lo = 0;
								if (++hi > 4294967295) hi = 0;
							}
						}
						return new LongBits(lo, hi);
					};

					/**
					 * Constructs new long bits from a number, long or string.
					 * @param {Long|number|string} value Value
					 * @returns {util.LongBits} Instance
					 */
					LongBits.from = function from(value) {
						if (typeof value === "number") return LongBits.fromNumber(value);
						if (util.isString(value)) {
							/* istanbul ignore else */
							if (util.Long) value = util.Long.fromString(value);else return LongBits.fromNumber(parseInt(value, 10));
						}
						return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : zero;
					};

					/**
					 * Converts this long bits to a possibly unsafe JavaScript number.
					 * @param {boolean} [unsigned=false] Whether unsigned or not
					 * @returns {number} Possibly unsafe number
					 */
					LongBits.prototype.toNumber = function toNumber(unsigned) {
						if (!unsigned && this.hi >>> 31) {
							var lo = ~this.lo + 1 >>> 0,
								hi = ~this.hi >>> 0;
							if (!lo) hi = hi + 1 >>> 0;
							return -(lo + hi * 4294967296);
						}
						return this.lo + this.hi * 4294967296;
					};

					/**
					 * Converts this long bits to a long.
					 * @param {boolean} [unsigned=false] Whether unsigned or not
					 * @returns {Long} Long
					 */
					LongBits.prototype.toLong = function toLong(unsigned) {
						return util.Long ? new util.Long(this.lo | 0, this.hi | 0, Boolean(unsigned))
						/* istanbul ignore next */ : {
							low: this.lo | 0,
							high: this.hi | 0,
							unsigned: Boolean(unsigned)
						};
					};
					var charCodeAt = String.prototype.charCodeAt;

					/**
					 * Constructs new long bits from the specified 8 characters long hash.
					 * @param {string} hash Hash
					 * @returns {util.LongBits} Bits
					 */
					LongBits.fromHash = function fromHash(hash) {
						if (hash === zeroHash) return zero;
						return new LongBits((charCodeAt.call(hash, 0) | charCodeAt.call(hash, 1) << 8 | charCodeAt.call(hash, 2) << 16 | charCodeAt.call(hash, 3) << 24) >>> 0, (charCodeAt.call(hash, 4) | charCodeAt.call(hash, 5) << 8 | charCodeAt.call(hash, 6) << 16 | charCodeAt.call(hash, 7) << 24) >>> 0);
					};

					/**
					 * Converts this long bits to a 8 characters long hash.
					 * @returns {string} Hash
					 */
					LongBits.prototype.toHash = function toHash() {
						return String.fromCharCode(this.lo & 255, this.lo >>> 8 & 255, this.lo >>> 16 & 255, this.lo >>> 24, this.hi & 255, this.hi >>> 8 & 255, this.hi >>> 16 & 255, this.hi >>> 24);
					};

					/**
					 * Zig-zag encodes this long bits.
					 * @returns {util.LongBits} `this`
					 */
					LongBits.prototype.zzEncode = function zzEncode() {
						var mask = this.hi >> 31;
						this.hi = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
						this.lo = (this.lo << 1 ^ mask) >>> 0;
						return this;
					};

					/**
					 * Zig-zag decodes this long bits.
					 * @returns {util.LongBits} `this`
					 */
					LongBits.prototype.zzDecode = function zzDecode() {
						var mask = -(this.lo & 1);
						this.lo = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
						this.hi = (this.hi >>> 1 ^ mask) >>> 0;
						return this;
					};

					/**
					 * Calculates the length of this longbits when encoded as a varint.
					 * @returns {number} Length
					 */
					LongBits.prototype.length = function length() {
						var part0 = this.lo,
							part1 = (this.lo >>> 28 | this.hi << 4) >>> 0,
							part2 = this.hi >>> 24;
						return part2 === 0 ? part1 === 0 ? part0 < 16384 ? part0 < 128 ? 1 : 2 : part0 < 2097152 ? 3 : 4 : part1 < 16384 ? part1 < 128 ? 5 : 6 : part1 < 2097152 ? 7 : 8 : part2 < 128 ? 9 : 10;
					};
				}, {
					"14": 14
				}],
				14: [function (require, module, exports) {

					var util = exports;

					// used to return a Promise where callback is omitted
					util.asPromise = require(1);

					// converts to / from base64 encoded strings
					util.base64 = require(2);

					// base class of rpc.Service
					util.EventEmitter = require(3);

					// float handling accross browsers
					util.float = require(4);

					// converts to / from utf8 encoded strings
					util.utf8 = require(6);

					// provides a node-like buffer pool in the browser
					util.pool = require(5);

					// utility to work with the low and high bits of a 64 bit value
					util.LongBits = require(13);

					/**
					 * Tests if the specified key can affect object prototypes.
					 * @memberof util
					 * @param {string} key Key to test
					 * @returns {boolean} `true` if the key is unsafe
					 */
					function isUnsafeProperty(key) {
						return key === "__proto__" || key === "prototype" || key === "constructor";
					}
					util.isUnsafeProperty = isUnsafeProperty;

					/**
					 * Whether running within node or not.
					 * @memberof util
					 * @type {boolean}
					 */
					util.isNode = Boolean(typeof commonjsGlobal !== "undefined" && commonjsGlobal && commonjsGlobal.process && commonjsGlobal.process.versions && commonjsGlobal.process.versions.node);

					/**
					 * Global object reference.
					 * @memberof util
					 * @type {Object}
					 */
					util.global = util.isNode && commonjsGlobal || typeof window !== "undefined" && window || typeof self !== "undefined" && self || this; // eslint-disable-line no-invalid-this

					/**
					 * An immuable empty array.
					 * @memberof util
					 * @type {Array.<*>}
					 * @const
					 */
					util.emptyArray = Object.freeze ? Object.freeze([]) : /* istanbul ignore next */[]; // used on prototypes

					/**
					 * An immutable empty object.
					 * @type {Object}
					 * @const
					 */
					util.emptyObject = Object.freeze ? Object.freeze({}) : /* istanbul ignore next */{}; // used on prototypes

					/**
					 * Tests if the specified value is an integer.
					 * @function
					 * @param {*} value Value to test
					 * @returns {boolean} `true` if the value is an integer
					 */
					util.isInteger = Number.isInteger || /* istanbul ignore next */function isInteger(value) {
						return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
					};

					/**
					 * Tests if the specified value is a string.
					 * @param {*} value Value to test
					 * @returns {boolean} `true` if the value is a string
					 */
					util.isString = function isString(value) {
						return typeof value === "string" || value instanceof String;
					};

					/**
					 * Tests if the specified value is a non-null object.
					 * @param {*} value Value to test
					 * @returns {boolean} `true` if the value is a non-null object
					 */
					util.isObject = function isObject(value) {
						return value && typeof value === "object";
					};

					/**
					 * Checks if a property on a message is considered to be present.
					 * This is an alias of {@link util.isSet}.
					 * @function
					 * @param {Object} obj Plain object or message instance
					 * @param {string} prop Property name
					 * @returns {boolean} `true` if considered to be present, otherwise `false`
					 */
					util.isset =
					/**
					 * Checks if a property on a message is considered to be present.
					 * @param {Object} obj Plain object or message instance
					 * @param {string} prop Property name
					 * @returns {boolean} `true` if considered to be present, otherwise `false`
					 */
					util.isSet = function isSet(obj, prop) {
						var value = obj[prop];
						if (value != null && Object.hasOwnProperty.call(obj, prop))
							// eslint-disable-line eqeqeq
							return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
						return false;
					};

					/**
					 * Any compatible Buffer instance.
					 * This is a minimal stand-alone definition of a Buffer instance. The actual type is that exported by node's typings.
					 * @interface Buffer
					 * @extends Uint8Array
					 */

					/**
					 * Node's Buffer class if available.
					 * @type {Constructor<Buffer>}
					 */
					util.Buffer = function () {
						try {
							var Buffer = util.global.Buffer;
							// refuse to use non-node buffers if not explicitly assigned (perf reasons):
							return Buffer.prototype.utf8Write ? Buffer : /* istanbul ignore next */null;
						} catch (e) {
							/* istanbul ignore next */
							return null;
						}
					}();

					// Internal alias of or polyfull for Buffer.from.
					util._Buffer_from = null;

					// Internal alias of or polyfill for Buffer.allocUnsafe.
					util._Buffer_allocUnsafe = null;

					/**
					 * Creates a new buffer of whatever type supported by the environment.
					 * @param {number|number[]} [sizeOrArray=0] Buffer size or number array
					 * @returns {Uint8Array|Buffer} Buffer
					 */
					util.newBuffer = function newBuffer(sizeOrArray) {
						/* istanbul ignore next */
						return typeof sizeOrArray === "number" ? util.Buffer ? util._Buffer_allocUnsafe(sizeOrArray) : new util.Array(sizeOrArray) : util.Buffer ? util._Buffer_from(sizeOrArray) : typeof Uint8Array === "undefined" ? sizeOrArray : new Uint8Array(sizeOrArray);
					};

					/**
					 * Array implementation used in the browser. `Uint8Array` if supported, otherwise `Array`.
					 * @type {Constructor<Uint8Array>}
					 */
					util.Array = typeof Uint8Array !== "undefined" ? Uint8Array /* istanbul ignore next */ : Array;

					/**
					 * Any compatible Long instance.
					 * This is a minimal stand-alone definition of a Long instance. The actual type is that exported by long.js.
					 * @interface Long
					 * @property {number} low Low bits
					 * @property {number} high High bits
					 * @property {boolean} unsigned Whether unsigned or not
					 */

					/**
					 * Long.js's Long class if available.
					 * @type {Constructor<Long>}
					 */
					util.Long = /* istanbul ignore next */util.global.dcodeIO && /* istanbul ignore next */util.global.dcodeIO.Long || /* istanbul ignore next */util.global.Long || function () {
						try {
							var Long = require("long");
							return Long && Long.isLong ? Long : null;
						} catch (e) {
							/* istanbul ignore next */
							return null;
						}
					}();

					/**
					 * Regular expression used to verify 2 bit (`bool`) map keys.
					 * @type {RegExp}
					 * @const
					 */
					util.key2Re = /^true|false|0|1$/;

					/**
					 * Regular expression used to verify 32 bit (`int32` etc.) map keys.
					 * @type {RegExp}
					 * @const
					 */
					util.key32Re = /^-?(?:0|[1-9][0-9]*)$/;

					/**
					 * Regular expression used to verify 64 bit (`int64` etc.) map keys.
					 * @type {RegExp}
					 * @const
					 */
					util.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/;

					/**
					 * Converts a number or long to an 8 characters long hash string.
					 * @param {Long|number} value Value to convert
					 * @returns {string} Hash
					 */
					util.longToHash = function longToHash(value) {
						return value ? util.LongBits.from(value).toHash() : util.LongBits.zeroHash;
					};

					/**
					 * Converts an 8 characters long hash string to a long or number.
					 * @param {string} hash Hash
					 * @param {boolean} [unsigned=false] Whether unsigned or not
					 * @returns {Long|number} Original value
					 */
					util.longFromHash = function longFromHash(hash, unsigned) {
						var bits = util.LongBits.fromHash(hash);
						if (util.Long) return util.Long.fromBits(bits.lo, bits.hi, unsigned);
						return bits.toNumber(Boolean(unsigned));
					};

					/**
					 * Merges the properties of the source object into the destination object.
					 * @memberof util
					 * @param {Object.<string,*>} dst Destination object
					 * @param {...(Object.<string,*>|boolean)} src Source objects, optionally followed by an `ifNotSet` flag
					 * @returns {Object.<string,*>} Destination object
					 */
					function merge(dst) {
						// used by converters
						var ifNotSet = typeof arguments[arguments.length - 1] === "boolean",
							limit = ifNotSet ? arguments.length - 1 : arguments.length;
						ifNotSet = ifNotSet && arguments[arguments.length - 1];
						for (var a = 1; a < limit; ++a) {
							var src = arguments[a];
							if (!src) continue;
							for (var keys = Object.keys(src), i = 0; i < keys.length; ++i) if (!isUnsafeProperty(keys[i]) && (dst[keys[i]] === undefined$1 || !ifNotSet)) dst[keys[i]] = src[keys[i]];
						}
						return dst;
					}
					util.merge = merge;

					/**
					 * Schema declaration nesting limit.
					 * @memberof util
					 * @type {number}
					 */
					util.nestingLimit = 32; // protoc: MaxMessageDeclarationNestingDepth

					/**
					 * Recursion limit.
					 * @memberof util
					 * @type {number}
					 */
					util.recursionLimit = 100; // protoc: CodedInputStream::default_recursion_limit_

					/**
					 * Makes a property safe for assignment as an own property.
					 * @memberof util
					 * @param {Object.<string,*>} obj Object
					 * @param {string} key Property key
					 * @returns {undefined}
					 */
					util.makeProp = function makeProp(obj, key) {
						Object.defineProperty(obj, key, {
							enumerable: true,
							configurable: true,
							writable: true
						});
					};

					/**
					 * Converts the first character of a string to lower case.
					 * @param {string} str String to convert
					 * @returns {string} Converted string
					 */
					util.lcFirst = function lcFirst(str) {
						return str.charAt(0).toLowerCase() + str.substring(1);
					};

					/**
					 * Creates a custom error constructor.
					 * @memberof util
					 * @param {string} name Error name
					 * @returns {Constructor<Error>} Custom error constructor
					 */
					function newError(name) {
						function CustomError(message, properties) {
							if (!(this instanceof CustomError)) return new CustomError(message, properties);

							// Error.call(this, message);
							// ^ just returns a new error instance because the ctor can be called as a function

							Object.defineProperty(this, "message", {
								get: function () {
									return message;
								}
							});

							/* istanbul ignore next */
							if (Error.captureStackTrace)
								// node
								Error.captureStackTrace(this, CustomError);else Object.defineProperty(this, "stack", {
								value: new Error().stack || ""
							});
							if (properties) merge(this, properties);
						}
						CustomError.prototype = Object.create(Error.prototype, {
							constructor: {
								value: CustomError,
								writable: true,
								enumerable: false,
								configurable: true
							},
							name: {
								get: function get() {
									return name;
								},
								set: undefined$1,
								enumerable: false,
								// configurable: false would accurately preserve the behavior of
								// the original, but I'm guessing that was not intentional.
								// For an actual error subclass, this property would
								// be configurable.
								configurable: true
							},
							toString: {
								value: function value() {
									return this.name + ": " + this.message;
								},
								writable: true,
								enumerable: false,
								configurable: true
							}
						});
						return CustomError;
					}
					util.newError = newError;

					/**
					 * Constructs a new protocol error.
					 * @classdesc Error subclass indicating a protocol specifc error.
					 * @memberof util
					 * @extends Error
					 * @template T extends Message<T>
					 * @constructor
					 * @param {string} message Error message
					 * @param {Object.<string,*>} [properties] Additional properties
					 * @example
					 * try {
					 *     MyMessage.decode(someBuffer); // throws if required fields are missing
					 * } catch (e) {
					 *     if (e instanceof ProtocolError && e.instance)
					 *         console.log("decoded so far: " + JSON.stringify(e.instance));
					 * }
					 */
					util.ProtocolError = newError("ProtocolError");

					/**
					 * So far decoded message instance.
					 * @name util.ProtocolError#instance
					 * @type {Message<T>}
					 */

					/**
					 * A OneOf getter as returned by {@link util.oneOfGetter}.
					 * @typedef OneOfGetter
					 * @type {function}
					 * @returns {string|undefined} Set field name, if any
					 */

					/**
					 * Builds a getter for a oneof's present field name.
					 * @param {string[]} fieldNames Field names
					 * @returns {OneOfGetter} Unbound getter
					 */
					util.oneOfGetter = function getOneOf(fieldNames) {
						var fieldMap = {};
						for (var i = 0; i < fieldNames.length; ++i) fieldMap[fieldNames[i]] = 1;

						/**
						 * @returns {string|undefined} Set field name, if any
						 * @this Object
						 * @ignore
						 */
						return function () {
							// eslint-disable-line consistent-return
							for (var keys = Object.keys(this), i = keys.length - 1; i > -1; --i) if (fieldMap[keys[i]] === 1 && this[keys[i]] !== undefined$1 && this[keys[i]] !== null) return keys[i];
						};
					};

					/**
					 * A OneOf setter as returned by {@link util.oneOfSetter}.
					 * @typedef OneOfSetter
					 * @type {function}
					 * @param {string|undefined} value Field name
					 * @returns {undefined}
					 */

					/**
					 * Builds a setter for a oneof's present field name.
					 * @param {string[]} fieldNames Field names
					 * @returns {OneOfSetter} Unbound setter
					 */
					util.oneOfSetter = function setOneOf(fieldNames) {
						/**
						 * @param {string} name Field name
						 * @returns {undefined}
						 * @this Object
						 * @ignore
						 */
						return function (name) {
							for (var i = 0; i < fieldNames.length; ++i) if (fieldNames[i] !== name) delete this[fieldNames[i]];
						};
					};

					/**
					 * Default conversion options used for {@link Message#toJSON} implementations.
					 *
					 * These options are close to proto3's JSON mapping with the exception that internal types like Any are handled just like messages. More precisely:
					 *
					 * - Longs become strings
					 * - Enums become string keys
					 * - Bytes become base64 encoded strings
					 * - (Sub-)Messages become plain objects
					 * - Maps become plain objects with all string keys
					 * - Repeated fields become arrays
					 * - NaN and Infinity for float and double fields become strings
					 *
					 * @type {IConversionOptions}
					 * @see https://developers.google.com/protocol-buffers/docs/proto3?hl=en#json
					 */
					util.toJSONOptions = {
						longs: String,
						enums: String,
						bytes: String,
						json: true
					};

					// Sets up buffer utility according to the environment (called in index-minimal)
					util._configure = function () {
						var Buffer = util.Buffer;
						/* istanbul ignore if */
						if (!Buffer) {
							util._Buffer_from = util._Buffer_allocUnsafe = null;
							return;
						}
						// because node 4.x buffers are incompatible & immutable
						// see: https://github.com/dcodeIO/protobuf.js/pull/665
						util._Buffer_from = Buffer.from !== Uint8Array.from && Buffer.from || /* istanbul ignore next */
						function Buffer_from(value, encoding) {
							return new Buffer(value, encoding);
						};
						util._Buffer_allocUnsafe = Buffer.allocUnsafe || /* istanbul ignore next */
						function Buffer_allocUnsafe(size) {
							return new Buffer(size);
						};
					};
				}, {
					"1": 1,
					"13": 13,
					"2": 2,
					"3": 3,
					"4": 4,
					"5": 5,
					"6": 6,
					"long": "long"
				}],
				15: [function (require, module, exports) {

					module.exports = Writer;
					var util = require(14);
					var BufferWriter; // cyclic

					var LongBits = util.LongBits,
						base64 = util.base64,
						utf8 = util.utf8;

					/**
					 * Constructs a new writer operation instance.
					 * @classdesc Scheduled writer operation.
					 * @constructor
					 * @param {function(*, Uint8Array, number)} fn Function to call
					 * @param {number} len Value byte length
					 * @param {*} val Value to write
					 * @ignore
					 */
					function Op(fn, len, val) {
						/**
						 * Function to call.
						 * @type {function(Uint8Array, number, *)}
						 */
						this.fn = fn;

						/**
						 * Value byte length.
						 * @type {number}
						 */
						this.len = len;

						/**
						 * Next operation.
						 * @type {Writer.Op|undefined}
						 */
						this.next = undefined$1;

						/**
						 * Value to write.
						 * @type {*}
						 */
						this.val = val; // type varies
					}

					/* istanbul ignore next */
					function noop() {} // eslint-disable-line no-empty-function

					/**
					 * Constructs a new writer state instance.
					 * @classdesc Copied writer state.
					 * @memberof Writer
					 * @constructor
					 * @param {Writer} writer Writer to copy state from
					 * @ignore
					 */
					function State(writer) {
						/**
						 * Current head.
						 * @type {Writer.Op}
						 */
						this.head = writer.head;

						/**
						 * Current tail.
						 * @type {Writer.Op}
						 */
						this.tail = writer.tail;

						/**
						 * Current buffer length.
						 * @type {number}
						 */
						this.len = writer.len;

						/**
						 * Next state.
						 * @type {State|null}
						 */
						this.next = writer.states;
					}

					/**
					 * Constructs a new writer instance.
					 * @classdesc Wire format writer using `Uint8Array` if available, otherwise `Array`.
					 * @constructor
					 */
					function Writer() {
						/**
						 * Current length.
						 * @type {number}
						 */
						this.len = 0;

						/**
						 * Operations head.
						 * @type {Object}
						 */
						this.head = new Op(noop, 0, 0);

						/**
						 * Operations tail
						 * @type {Object}
						 */
						this.tail = this.head;

						/**
						 * Linked forked states.
						 * @type {Object|null}
						 */
						this.states = null;

						// When a value is written, the writer calculates its byte length and puts it into a linked
						// list of operations to perform when finish() is called. This both allows us to allocate
						// buffers of the exact required size and reduces the amount of work we have to do compared
						// to first calculating over objects and then encoding over objects. In our case, the encoding
						// part is just a linked list walk calling operations with already prepared values.
					}
					var create = function create() {
						return util.Buffer ? function create_buffer_setup() {
							return (Writer.create = function create_buffer() {
								return new BufferWriter();
							})();
						}
						/* istanbul ignore next */ : function create_array() {
							return new Writer();
						};
					};

					/**
					 * Creates a new writer.
					 * @function
					 * @returns {BufferWriter|Writer} A {@link BufferWriter} when Buffers are supported, otherwise a {@link Writer}
					 */
					Writer.create = create();

					/**
					 * Allocates a buffer of the specified size.
					 * @param {number} size Buffer size
					 * @returns {Uint8Array} Buffer
					 */
					Writer.alloc = function alloc(size) {
						return new util.Array(size);
					};

					// Use Uint8Array buffer pool in the browser, just like node does with buffers
					/* istanbul ignore else */
					if (util.Array !== Array) Writer.alloc = util.pool(Writer.alloc, util.Array.prototype.subarray);

					/**
					 * Pushes a new operation to the queue.
					 * @param {function(Uint8Array, number, *)} fn Function to call
					 * @param {number} len Value byte length
					 * @param {number} val Value to write
					 * @returns {Writer} `this`
					 * @private
					 */
					Writer.prototype._push = function push(fn, len, val) {
						this.tail = this.tail.next = new Op(fn, len, val);
						this.len += len;
						return this;
					};
					function writeByte(val, buf, pos) {
						buf[pos] = val & 255;
					}
					function writeVarint32(val, buf, pos) {
						while (val > 127) {
							buf[pos++] = val & 127 | 128;
							val >>>= 7;
						}
						buf[pos] = val;
					}

					/**
					 * Constructs a new varint writer operation instance.
					 * @classdesc Scheduled varint writer operation.
					 * @extends Op
					 * @constructor
					 * @param {number} len Value byte length
					 * @param {number} val Value to write
					 * @ignore
					 */
					function VarintOp(len, val) {
						this.len = len;
						this.next = undefined$1;
						this.val = val;
					}
					VarintOp.prototype = Object.create(Op.prototype);
					VarintOp.prototype.fn = writeVarint32;

					/**
					 * Writes an unsigned 32 bit value as a varint.
					 * @param {number} value Value to write
					 * @returns {Writer} `this`
					 */
					Writer.prototype.uint32 = function write_uint32(value) {
						// here, the call to this.push has been inlined and a varint specific Op subclass is used.
						// uint32 is by far the most frequently used operation and benefits significantly from this.
						this.len += (this.tail = this.tail.next = new VarintOp((value = value >>> 0) < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : value < 268435456 ? 4 : 5, value)).len;
						return this;
					};

					/**
					 * Writes a signed 32 bit value as a varint.
					 * @function
					 * @param {number} value Value to write
					 * @returns {Writer} `this`
					 */
					Writer.prototype.int32 = function write_int32(value) {
						return (value |= 0) < 0 ? this._push(writeVarint64, 10, LongBits.fromNumber(value)) // 10 bytes per spec
						: this.uint32(value);
					};

					/**
					 * Writes a 32 bit value as a varint, zig-zag encoded.
					 * @param {number} value Value to write
					 * @returns {Writer} `this`
					 */
					Writer.prototype.sint32 = function write_sint32(value) {
						return this.uint32((value << 1 ^ value >> 31) >>> 0);
					};
					function writeVarint64(val, buf, pos) {
						var lo = val.lo,
							hi = val.hi;
						while (hi) {
							buf[pos++] = lo & 127 | 128;
							lo = (lo >>> 7 | hi << 25) >>> 0;
							hi >>>= 7;
						}
						while (lo > 127) {
							buf[pos++] = lo & 127 | 128;
							lo = lo >>> 7;
						}
						buf[pos++] = lo;
					}

					/**
					 * Writes an unsigned 64 bit value as a varint.
					 * @param {Long|number|string} value Value to write
					 * @returns {Writer} `this`
					 * @throws {TypeError} If `value` is a string and no long library is present.
					 */
					Writer.prototype.uint64 = function write_uint64(value) {
						var bits = LongBits.from(value);
						return this._push(writeVarint64, bits.length(), bits);
					};

					/**
					 * Writes a signed 64 bit value as a varint.
					 * @function
					 * @param {Long|number|string} value Value to write
					 * @returns {Writer} `this`
					 * @throws {TypeError} If `value` is a string and no long library is present.
					 */
					Writer.prototype.int64 = Writer.prototype.uint64;

					/**
					 * Writes a signed 64 bit value as a varint, zig-zag encoded.
					 * @param {Long|number|string} value Value to write
					 * @returns {Writer} `this`
					 * @throws {TypeError} If `value` is a string and no long library is present.
					 */
					Writer.prototype.sint64 = function write_sint64(value) {
						var bits = LongBits.from(value).zzEncode();
						return this._push(writeVarint64, bits.length(), bits);
					};

					/**
					 * Writes a boolish value as a varint.
					 * @param {boolean} value Value to write
					 * @returns {Writer} `this`
					 */
					Writer.prototype.bool = function write_bool(value) {
						return this._push(writeByte, 1, value ? 1 : 0);
					};
					function writeFixed32(val, buf, pos) {
						buf[pos] = val & 255;
						buf[pos + 1] = val >>> 8 & 255;
						buf[pos + 2] = val >>> 16 & 255;
						buf[pos + 3] = val >>> 24;
					}

					/**
					 * Writes an unsigned 32 bit value as fixed 32 bits.
					 * @param {number} value Value to write
					 * @returns {Writer} `this`
					 */
					Writer.prototype.fixed32 = function write_fixed32(value) {
						return this._push(writeFixed32, 4, value >>> 0);
					};

					/**
					 * Writes a signed 32 bit value as fixed 32 bits.
					 * @function
					 * @param {number} value Value to write
					 * @returns {Writer} `this`
					 */
					Writer.prototype.sfixed32 = Writer.prototype.fixed32;

					/**
					 * Writes an unsigned 64 bit value as fixed 64 bits.
					 * @param {Long|number|string} value Value to write
					 * @returns {Writer} `this`
					 * @throws {TypeError} If `value` is a string and no long library is present.
					 */
					Writer.prototype.fixed64 = function write_fixed64(value) {
						var bits = LongBits.from(value);
						return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
					};

					/**
					 * Writes a signed 64 bit value as fixed 64 bits.
					 * @function
					 * @param {Long|number|string} value Value to write
					 * @returns {Writer} `this`
					 * @throws {TypeError} If `value` is a string and no long library is present.
					 */
					Writer.prototype.sfixed64 = Writer.prototype.fixed64;

					/**
					 * Writes a float (32 bit).
					 * @function
					 * @param {number} value Value to write
					 * @returns {Writer} `this`
					 */
					Writer.prototype.float = function write_float(value) {
						return this._push(util.float.writeFloatLE, 4, value);
					};

					/**
					 * Writes a double (64 bit float).
					 * @function
					 * @param {number} value Value to write
					 * @returns {Writer} `this`
					 */
					Writer.prototype.double = function write_double(value) {
						return this._push(util.float.writeDoubleLE, 8, value);
					};
					var writeBytes = util.Array.prototype.set ? function writeBytes_set(val, buf, pos) {
						buf.set(val, pos); // also works for plain array values
					}
					/* istanbul ignore next */ : function writeBytes_for(val, buf, pos) {
						for (var i = 0; i < val.length; ++i) buf[pos + i] = val[i];
					};

					/**
					 * Writes a sequence of bytes.
					 * @param {Uint8Array|string} value Buffer or base64 encoded string to write
					 * @returns {Writer} `this`
					 */
					Writer.prototype.bytes = function write_bytes(value) {
						var len = value.length >>> 0;
						if (!len) return this._push(writeByte, 1, 0);
						if (util.isString(value)) {
							var buf = Writer.alloc(len = base64.length(value));
							base64.decode(value, buf, 0);
							value = buf;
						}
						return this.uint32(len)._push(writeBytes, len, value);
					};

					/**
					 * Writes a string.
					 * @param {string} value Value to write
					 * @returns {Writer} `this`
					 */
					Writer.prototype.string = function write_string(value) {
						var len = utf8.length(value);
						return len ? this.uint32(len)._push(utf8.write, len, value) : this._push(writeByte, 1, 0);
					};

					/**
					 * Forks this writer's state by pushing it to a stack.
					 * Calling {@link Writer#reset|reset} or {@link Writer#ldelim|ldelim} resets the writer to the previous state.
					 * @returns {Writer} `this`
					 */
					Writer.prototype.fork = function fork() {
						this.states = new State(this);
						this.head = this.tail = new Op(noop, 0, 0);
						this.len = 0;
						return this;
					};

					/**
					 * Resets this instance to the last state.
					 * @returns {Writer} `this`
					 */
					Writer.prototype.reset = function reset() {
						if (this.states) {
							this.head = this.states.head;
							this.tail = this.states.tail;
							this.len = this.states.len;
							this.states = this.states.next;
						} else {
							this.head = this.tail = new Op(noop, 0, 0);
							this.len = 0;
						}
						return this;
					};

					/**
					 * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
					 * @returns {Writer} `this`
					 */
					Writer.prototype.ldelim = function ldelim() {
						var head = this.head,
							tail = this.tail,
							len = this.len;
						this.reset().uint32(len);
						if (len) {
							this.tail.next = head.next; // skip noop
							this.tail = tail;
							this.len += len;
						}
						return this;
					};

					/**
					 * Finishes the write operation.
					 * @returns {Uint8Array} Finished buffer
					 */
					Writer.prototype.finish = function finish() {
						var head = this.head.next,
							// skip noop
							buf = this.constructor.alloc(this.len),
							pos = 0;
						while (head) {
							head.fn(head.val, buf, pos);
							pos += head.len;
							head = head.next;
						}
						// this.head = this.tail = null;
						return buf;
					};
					Writer._configure = function (BufferWriter_) {
						BufferWriter = BufferWriter_;
						Writer.create = create();
						BufferWriter._configure();
					};
				}, {
					"14": 14
				}],
				16: [function (require, module, exports) {

					module.exports = BufferWriter;

					// extends Writer
					var Writer = require(15);
					(BufferWriter.prototype = Object.create(Writer.prototype)).constructor = BufferWriter;
					var util = require(14);

					/**
					 * Constructs a new buffer writer instance.
					 * @classdesc Wire format writer using node buffers.
					 * @extends Writer
					 * @constructor
					 */
					function BufferWriter() {
						Writer.call(this);
					}
					BufferWriter._configure = function () {
						/**
						 * Allocates a buffer of the specified size.
						 * @function
						 * @param {number} size Buffer size
						 * @returns {Buffer} Buffer
						 */
						BufferWriter.alloc = util._Buffer_allocUnsafe;
						BufferWriter.writeBytesBuffer = util.Buffer && util.Buffer.prototype instanceof Uint8Array && util.Buffer.prototype.set.name === "set" ? function writeBytesBuffer_set(val, buf, pos) {
							buf.set(val, pos); // faster than copy (requires node >= 4 where Buffers extend Uint8Array and set is properly inherited)
							// also works for plain array values
						}
						/* istanbul ignore next */ : function writeBytesBuffer_copy(val, buf, pos) {
							if (val.copy)
								// Buffer values
								val.copy(buf, pos, 0, val.length);else for (var i = 0; i < val.length;)
							// plain array values
							buf[pos++] = val[i++];
						};
					};

					/**
					 * @override
					 */
					BufferWriter.prototype.bytes = function write_bytes_buffer(value) {
						if (util.isString(value)) value = util._Buffer_from(value, "base64");
						var len = value.length >>> 0;
						this.uint32(len);
						if (len) this._push(BufferWriter.writeBytesBuffer, len, value);
						return this;
					};
					function writeStringBuffer(val, buf, pos) {
						if (val.length < 40)
							// plain js is faster for short strings (probably due to redundant assertions)
							util.utf8.write(val, buf, pos);else if (buf.utf8Write) buf.utf8Write(val, pos);else buf.write(val, pos);
					}

					/**
					 * @override
					 */
					BufferWriter.prototype.string = function write_string_buffer(value) {
						var len = util.Buffer.byteLength(value);
						this.uint32(len);
						if (len) this._push(writeStringBuffer, len, value);
						return this;
					};

					/**
					 * Finishes the write operation.
					 * @name BufferWriter#finish
					 * @function
					 * @returns {Buffer} Finished buffer
					 */

					BufferWriter._configure();
				}, {
					"14": 14,
					"15": 15
				}]
			}, {}, [7]);
		})();
		return protobuf$1;
	}

	requireProtobuf();

	var model = {};

	/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/

	var hasRequiredModel;

	function requireModel () {
		if (hasRequiredModel) return model;
		hasRequiredModel = 1;
		// Generated by: pbjs -t static-module -w default -r push-server --no-verify --no-convert --no-delimited -p pull/dev/protobuf -o model.js request.proto response.proto (protobufjs-cli 1.3.3, protobufjs 7.6.5)
		// Local modification (reapply after regenerating): the UMD wrapper pbjs emits is replaced with
		// the global runtime lookup at the end of this file, so the model finds the protobuf runtime
		// without AMD/CommonJS and also works in SharedWorker.
		(function ($protobuf) {

			// Common aliases
			var $Reader = $protobuf.Reader,
				$Writer = $protobuf.Writer,
				$util = $protobuf.util;

			// Exported root namespace
			var $root = $protobuf.roots["push-server"] || ($protobuf.roots["push-server"] = {});
			$root.RequestBatch = function () {
				/**
				 * Properties of a RequestBatch.
				 * @exports IRequestBatch
				 * @interface IRequestBatch
				 * @property {Array.<IRequest>|null} [requests] RequestBatch requests
				 */

				/**
				 * Constructs a new RequestBatch.
				 * @exports RequestBatch
				 * @classdesc Represents a RequestBatch.
				 * @implements IRequestBatch
				 * @constructor
				 * @param {IRequestBatch=} [properties] Properties to set
				 */
				function RequestBatch(properties) {
					this.requests = [];
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * RequestBatch requests.
				 * @member {Array.<IRequest>} requests
				 * @memberof RequestBatch
				 * @instance
				 */
				RequestBatch.prototype.requests = $util.emptyArray;

				/**
				 * Creates a new RequestBatch instance using the specified properties.
				 * @function create
				 * @memberof RequestBatch
				 * @static
				 * @param {IRequestBatch=} [properties] Properties to set
				 * @returns {RequestBatch} RequestBatch instance
				 */
				RequestBatch.create = function create(properties) {
					return new RequestBatch(properties);
				};

				/**
				 * Encodes the specified RequestBatch message. Does not implicitly {@link RequestBatch.verify|verify} messages.
				 * @function encode
				 * @memberof RequestBatch
				 * @static
				 * @param {IRequestBatch} message RequestBatch message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				RequestBatch.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.requests != null && message.requests.length) for (var i = 0; i < message.requests.length; ++i) $root.Request.encode(message.requests[i], writer.uint32(/* id 1, wireType 2 =*/10).fork(), q + 1).ldelim();
					return writer;
				};

				/**
				 * Decodes a RequestBatch message from the specified reader or buffer.
				 * @function decode
				 * @memberof RequestBatch
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {RequestBatch} RequestBatch
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				RequestBatch.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.RequestBatch();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									if (!(message.requests && message.requests.length)) message.requests = [];
									message.requests.push($root.Request.decode(reader, reader.uint32(), undefined, long + 1));
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for RequestBatch
				 * @function getTypeUrl
				 * @memberof RequestBatch
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				RequestBatch.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/RequestBatch";
				};
				return RequestBatch;
			}();
			$root.Request = function () {
				/**
				 * Properties of a Request.
				 * @exports IRequest
				 * @interface IRequest
				 * @property {IIncomingMessagesRequest|null} [incomingMessages] Request incomingMessages
				 * @property {IChannelStatsRequest|null} [channelStats] Request channelStats
				 * @property {IServerStatsRequest|null} [serverStats] Request serverStats
				 * @property {IRegisterRequest|null} [registration] Request registration
				 */

				/**
				 * Constructs a new Request.
				 * @exports Request
				 * @classdesc Represents a Request.
				 * @implements IRequest
				 * @constructor
				 * @param {IRequest=} [properties] Properties to set
				 */
				function Request(properties) {
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * Request incomingMessages.
				 * @member {IIncomingMessagesRequest|null|undefined} incomingMessages
				 * @memberof Request
				 * @instance
				 */
				Request.prototype.incomingMessages = null;

				/**
				 * Request channelStats.
				 * @member {IChannelStatsRequest|null|undefined} channelStats
				 * @memberof Request
				 * @instance
				 */
				Request.prototype.channelStats = null;

				/**
				 * Request serverStats.
				 * @member {IServerStatsRequest|null|undefined} serverStats
				 * @memberof Request
				 * @instance
				 */
				Request.prototype.serverStats = null;

				/**
				 * Request registration.
				 * @member {IRegisterRequest|null|undefined} registration
				 * @memberof Request
				 * @instance
				 */
				Request.prototype.registration = null;

				// OneOf field names bound to virtual getters and setters
				var $oneOfFields;

				/**
				 * Request command.
				 * @member {"incomingMessages"|"channelStats"|"serverStats"|"registration"|undefined} command
				 * @memberof Request
				 * @instance
				 */
				Object.defineProperty(Request.prototype, "command", {
					get: $util.oneOfGetter($oneOfFields = ["incomingMessages", "channelStats", "serverStats", "registration"]),
					set: $util.oneOfSetter($oneOfFields)
				});

				/**
				 * Creates a new Request instance using the specified properties.
				 * @function create
				 * @memberof Request
				 * @static
				 * @param {IRequest=} [properties] Properties to set
				 * @returns {Request} Request instance
				 */
				Request.create = function create(properties) {
					return new Request(properties);
				};

				/**
				 * Encodes the specified Request message. Does not implicitly {@link Request.verify|verify} messages.
				 * @function encode
				 * @memberof Request
				 * @static
				 * @param {IRequest} message Request message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				Request.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.incomingMessages != null && Object.hasOwnProperty.call(message, "incomingMessages")) $root.IncomingMessagesRequest.encode(message.incomingMessages, writer.uint32(/* id 1, wireType 2 =*/10).fork(), q + 1).ldelim();
					if (message.channelStats != null && Object.hasOwnProperty.call(message, "channelStats")) $root.ChannelStatsRequest.encode(message.channelStats, writer.uint32(/* id 2, wireType 2 =*/18).fork(), q + 1).ldelim();
					if (message.serverStats != null && Object.hasOwnProperty.call(message, "serverStats")) $root.ServerStatsRequest.encode(message.serverStats, writer.uint32(/* id 3, wireType 2 =*/26).fork(), q + 1).ldelim();
					if (message.registration != null && Object.hasOwnProperty.call(message, "registration")) $root.RegisterRequest.encode(message.registration, writer.uint32(/* id 4, wireType 2 =*/34).fork(), q + 1).ldelim();
					return writer;
				};

				/**
				 * Decodes a Request message from the specified reader or buffer.
				 * @function decode
				 * @memberof Request
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {Request} Request
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				Request.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.Request();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									message.incomingMessages = $root.IncomingMessagesRequest.decode(reader, reader.uint32(), undefined, long + 1);
									break;
								}
							case 2:
								{
									message.channelStats = $root.ChannelStatsRequest.decode(reader, reader.uint32(), undefined, long + 1);
									break;
								}
							case 3:
								{
									message.serverStats = $root.ServerStatsRequest.decode(reader, reader.uint32(), undefined, long + 1);
									break;
								}
							case 4:
								{
									message.registration = $root.RegisterRequest.decode(reader, reader.uint32(), undefined, long + 1);
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for Request
				 * @function getTypeUrl
				 * @memberof Request
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				Request.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/Request";
				};
				return Request;
			}();
			$root.IncomingMessagesRequest = function () {
				/**
				 * Properties of an IncomingMessagesRequest.
				 * @exports IIncomingMessagesRequest
				 * @interface IIncomingMessagesRequest
				 * @property {Array.<IIncomingMessage>|null} [messages] IncomingMessagesRequest messages
				 */

				/**
				 * Constructs a new IncomingMessagesRequest.
				 * @exports IncomingMessagesRequest
				 * @classdesc Represents an IncomingMessagesRequest.
				 * @implements IIncomingMessagesRequest
				 * @constructor
				 * @param {IIncomingMessagesRequest=} [properties] Properties to set
				 */
				function IncomingMessagesRequest(properties) {
					this.messages = [];
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * IncomingMessagesRequest messages.
				 * @member {Array.<IIncomingMessage>} messages
				 * @memberof IncomingMessagesRequest
				 * @instance
				 */
				IncomingMessagesRequest.prototype.messages = $util.emptyArray;

				/**
				 * Creates a new IncomingMessagesRequest instance using the specified properties.
				 * @function create
				 * @memberof IncomingMessagesRequest
				 * @static
				 * @param {IIncomingMessagesRequest=} [properties] Properties to set
				 * @returns {IncomingMessagesRequest} IncomingMessagesRequest instance
				 */
				IncomingMessagesRequest.create = function create(properties) {
					return new IncomingMessagesRequest(properties);
				};

				/**
				 * Encodes the specified IncomingMessagesRequest message. Does not implicitly {@link IncomingMessagesRequest.verify|verify} messages.
				 * @function encode
				 * @memberof IncomingMessagesRequest
				 * @static
				 * @param {IIncomingMessagesRequest} message IncomingMessagesRequest message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				IncomingMessagesRequest.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.messages != null && message.messages.length) for (var i = 0; i < message.messages.length; ++i) $root.IncomingMessage.encode(message.messages[i], writer.uint32(/* id 1, wireType 2 =*/10).fork(), q + 1).ldelim();
					return writer;
				};

				/**
				 * Decodes an IncomingMessagesRequest message from the specified reader or buffer.
				 * @function decode
				 * @memberof IncomingMessagesRequest
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {IncomingMessagesRequest} IncomingMessagesRequest
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				IncomingMessagesRequest.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.IncomingMessagesRequest();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									if (!(message.messages && message.messages.length)) message.messages = [];
									message.messages.push($root.IncomingMessage.decode(reader, reader.uint32(), undefined, long + 1));
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for IncomingMessagesRequest
				 * @function getTypeUrl
				 * @memberof IncomingMessagesRequest
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				IncomingMessagesRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/IncomingMessagesRequest";
				};
				return IncomingMessagesRequest;
			}();
			$root.IncomingMessage = function () {
				/**
				 * Properties of an IncomingMessage.
				 * @exports IIncomingMessage
				 * @interface IIncomingMessage
				 * @property {Array.<IReceiver>|null} [receivers] IncomingMessage receivers
				 * @property {ISender|null} [sender] IncomingMessage sender
				 * @property {string|null} [body] IncomingMessage body
				 * @property {number|null} [expiry] IncomingMessage expiry
				 * @property {string|null} [type] IncomingMessage type
				 */

				/**
				 * Constructs a new IncomingMessage.
				 * @exports IncomingMessage
				 * @classdesc Represents an IncomingMessage.
				 * @implements IIncomingMessage
				 * @constructor
				 * @param {IIncomingMessage=} [properties] Properties to set
				 */
				function IncomingMessage(properties) {
					this.receivers = [];
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * IncomingMessage receivers.
				 * @member {Array.<IReceiver>} receivers
				 * @memberof IncomingMessage
				 * @instance
				 */
				IncomingMessage.prototype.receivers = $util.emptyArray;

				/**
				 * IncomingMessage sender.
				 * @member {ISender|null|undefined} sender
				 * @memberof IncomingMessage
				 * @instance
				 */
				IncomingMessage.prototype.sender = null;

				/**
				 * IncomingMessage body.
				 * @member {string} body
				 * @memberof IncomingMessage
				 * @instance
				 */
				IncomingMessage.prototype.body = "";

				/**
				 * IncomingMessage expiry.
				 * @member {number} expiry
				 * @memberof IncomingMessage
				 * @instance
				 */
				IncomingMessage.prototype.expiry = 0;

				/**
				 * IncomingMessage type.
				 * @member {string} type
				 * @memberof IncomingMessage
				 * @instance
				 */
				IncomingMessage.prototype.type = "";

				/**
				 * Creates a new IncomingMessage instance using the specified properties.
				 * @function create
				 * @memberof IncomingMessage
				 * @static
				 * @param {IIncomingMessage=} [properties] Properties to set
				 * @returns {IncomingMessage} IncomingMessage instance
				 */
				IncomingMessage.create = function create(properties) {
					return new IncomingMessage(properties);
				};

				/**
				 * Encodes the specified IncomingMessage message. Does not implicitly {@link IncomingMessage.verify|verify} messages.
				 * @function encode
				 * @memberof IncomingMessage
				 * @static
				 * @param {IIncomingMessage} message IncomingMessage message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				IncomingMessage.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.receivers != null && message.receivers.length) for (var i = 0; i < message.receivers.length; ++i) $root.Receiver.encode(message.receivers[i], writer.uint32(/* id 1, wireType 2 =*/10).fork(), q + 1).ldelim();
					if (message.sender != null && Object.hasOwnProperty.call(message, "sender")) $root.Sender.encode(message.sender, writer.uint32(/* id 2, wireType 2 =*/18).fork(), q + 1).ldelim();
					if (message.body != null && Object.hasOwnProperty.call(message, "body")) writer.uint32(/* id 3, wireType 2 =*/26).string(message.body);
					if (message.expiry != null && Object.hasOwnProperty.call(message, "expiry")) writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.expiry);
					if (message.type != null && Object.hasOwnProperty.call(message, "type")) writer.uint32(/* id 5, wireType 2 =*/42).string(message.type);
					return writer;
				};

				/**
				 * Decodes an IncomingMessage message from the specified reader or buffer.
				 * @function decode
				 * @memberof IncomingMessage
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {IncomingMessage} IncomingMessage
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				IncomingMessage.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.IncomingMessage();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									if (!(message.receivers && message.receivers.length)) message.receivers = [];
									message.receivers.push($root.Receiver.decode(reader, reader.uint32(), undefined, long + 1));
									break;
								}
							case 2:
								{
									message.sender = $root.Sender.decode(reader, reader.uint32(), undefined, long + 1);
									break;
								}
							case 3:
								{
									message.body = reader.string();
									break;
								}
							case 4:
								{
									message.expiry = reader.uint32();
									break;
								}
							case 5:
								{
									message.type = reader.string();
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for IncomingMessage
				 * @function getTypeUrl
				 * @memberof IncomingMessage
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				IncomingMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/IncomingMessage";
				};
				return IncomingMessage;
			}();
			$root.ChannelStatsRequest = function () {
				/**
				 * Properties of a ChannelStatsRequest.
				 * @exports IChannelStatsRequest
				 * @interface IChannelStatsRequest
				 * @property {Array.<IChannelId>|null} [channels] ChannelStatsRequest channels
				 */

				/**
				 * Constructs a new ChannelStatsRequest.
				 * @exports ChannelStatsRequest
				 * @classdesc Represents a ChannelStatsRequest.
				 * @implements IChannelStatsRequest
				 * @constructor
				 * @param {IChannelStatsRequest=} [properties] Properties to set
				 */
				function ChannelStatsRequest(properties) {
					this.channels = [];
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * ChannelStatsRequest channels.
				 * @member {Array.<IChannelId>} channels
				 * @memberof ChannelStatsRequest
				 * @instance
				 */
				ChannelStatsRequest.prototype.channels = $util.emptyArray;

				/**
				 * Creates a new ChannelStatsRequest instance using the specified properties.
				 * @function create
				 * @memberof ChannelStatsRequest
				 * @static
				 * @param {IChannelStatsRequest=} [properties] Properties to set
				 * @returns {ChannelStatsRequest} ChannelStatsRequest instance
				 */
				ChannelStatsRequest.create = function create(properties) {
					return new ChannelStatsRequest(properties);
				};

				/**
				 * Encodes the specified ChannelStatsRequest message. Does not implicitly {@link ChannelStatsRequest.verify|verify} messages.
				 * @function encode
				 * @memberof ChannelStatsRequest
				 * @static
				 * @param {IChannelStatsRequest} message ChannelStatsRequest message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				ChannelStatsRequest.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.channels != null && message.channels.length) for (var i = 0; i < message.channels.length; ++i) $root.ChannelId.encode(message.channels[i], writer.uint32(/* id 1, wireType 2 =*/10).fork(), q + 1).ldelim();
					return writer;
				};

				/**
				 * Decodes a ChannelStatsRequest message from the specified reader or buffer.
				 * @function decode
				 * @memberof ChannelStatsRequest
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {ChannelStatsRequest} ChannelStatsRequest
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				ChannelStatsRequest.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.ChannelStatsRequest();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									if (!(message.channels && message.channels.length)) message.channels = [];
									message.channels.push($root.ChannelId.decode(reader, reader.uint32(), undefined, long + 1));
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for ChannelStatsRequest
				 * @function getTypeUrl
				 * @memberof ChannelStatsRequest
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				ChannelStatsRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/ChannelStatsRequest";
				};
				return ChannelStatsRequest;
			}();
			$root.ChannelId = function () {
				/**
				 * Properties of a ChannelId.
				 * @exports IChannelId
				 * @interface IChannelId
				 * @property {Uint8Array|null} [id] ChannelId id
				 * @property {boolean|null} [isPrivate] ChannelId isPrivate
				 * @property {Uint8Array|null} [signature] ChannelId signature
				 */

				/**
				 * Constructs a new ChannelId.
				 * @exports ChannelId
				 * @classdesc Represents a ChannelId.
				 * @implements IChannelId
				 * @constructor
				 * @param {IChannelId=} [properties] Properties to set
				 */
				function ChannelId(properties) {
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * ChannelId id.
				 * @member {Uint8Array} id
				 * @memberof ChannelId
				 * @instance
				 */
				ChannelId.prototype.id = $util.newBuffer([]);

				/**
				 * ChannelId isPrivate.
				 * @member {boolean} isPrivate
				 * @memberof ChannelId
				 * @instance
				 */
				ChannelId.prototype.isPrivate = false;

				/**
				 * ChannelId signature.
				 * @member {Uint8Array} signature
				 * @memberof ChannelId
				 * @instance
				 */
				ChannelId.prototype.signature = $util.newBuffer([]);

				/**
				 * Creates a new ChannelId instance using the specified properties.
				 * @function create
				 * @memberof ChannelId
				 * @static
				 * @param {IChannelId=} [properties] Properties to set
				 * @returns {ChannelId} ChannelId instance
				 */
				ChannelId.create = function create(properties) {
					return new ChannelId(properties);
				};

				/**
				 * Encodes the specified ChannelId message. Does not implicitly {@link ChannelId.verify|verify} messages.
				 * @function encode
				 * @memberof ChannelId
				 * @static
				 * @param {IChannelId} message ChannelId message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				ChannelId.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.id);
					if (message.isPrivate != null && Object.hasOwnProperty.call(message, "isPrivate")) writer.uint32(/* id 2, wireType 0 =*/16).bool(message.isPrivate);
					if (message.signature != null && Object.hasOwnProperty.call(message, "signature")) writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.signature);
					return writer;
				};

				/**
				 * Decodes a ChannelId message from the specified reader or buffer.
				 * @function decode
				 * @memberof ChannelId
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {ChannelId} ChannelId
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				ChannelId.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.ChannelId();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									message.id = reader.bytes();
									break;
								}
							case 2:
								{
									message.isPrivate = reader.bool();
									break;
								}
							case 3:
								{
									message.signature = reader.bytes();
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for ChannelId
				 * @function getTypeUrl
				 * @memberof ChannelId
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				ChannelId.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/ChannelId";
				};
				return ChannelId;
			}();
			$root.ServerStatsRequest = function () {
				/**
				 * Properties of a ServerStatsRequest.
				 * @exports IServerStatsRequest
				 * @interface IServerStatsRequest
				 */

				/**
				 * Constructs a new ServerStatsRequest.
				 * @exports ServerStatsRequest
				 * @classdesc Represents a ServerStatsRequest.
				 * @implements IServerStatsRequest
				 * @constructor
				 * @param {IServerStatsRequest=} [properties] Properties to set
				 */
				function ServerStatsRequest(properties) {
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * Creates a new ServerStatsRequest instance using the specified properties.
				 * @function create
				 * @memberof ServerStatsRequest
				 * @static
				 * @param {IServerStatsRequest=} [properties] Properties to set
				 * @returns {ServerStatsRequest} ServerStatsRequest instance
				 */
				ServerStatsRequest.create = function create(properties) {
					return new ServerStatsRequest(properties);
				};

				/**
				 * Encodes the specified ServerStatsRequest message. Does not implicitly {@link ServerStatsRequest.verify|verify} messages.
				 * @function encode
				 * @memberof ServerStatsRequest
				 * @static
				 * @param {IServerStatsRequest} message ServerStatsRequest message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				ServerStatsRequest.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					return writer;
				};

				/**
				 * Decodes a ServerStatsRequest message from the specified reader or buffer.
				 * @function decode
				 * @memberof ServerStatsRequest
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {ServerStatsRequest} ServerStatsRequest
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				ServerStatsRequest.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.ServerStatsRequest();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for ServerStatsRequest
				 * @function getTypeUrl
				 * @memberof ServerStatsRequest
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				ServerStatsRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/ServerStatsRequest";
				};
				return ServerStatsRequest;
			}();
			$root.RegisterRequest = function () {
				/**
				 * Properties of a RegisterRequest.
				 * @exports IRegisterRequest
				 * @interface IRegisterRequest
				 * @property {string|null} [verificationQuery] RegisterRequest verificationQuery
				 * @property {string|null} [host] RegisterRequest host
				 */

				/**
				 * Constructs a new RegisterRequest.
				 * @exports RegisterRequest
				 * @classdesc Represents a RegisterRequest.
				 * @implements IRegisterRequest
				 * @constructor
				 * @param {IRegisterRequest=} [properties] Properties to set
				 */
				function RegisterRequest(properties) {
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * RegisterRequest verificationQuery.
				 * @member {string} verificationQuery
				 * @memberof RegisterRequest
				 * @instance
				 */
				RegisterRequest.prototype.verificationQuery = "";

				/**
				 * RegisterRequest host.
				 * @member {string} host
				 * @memberof RegisterRequest
				 * @instance
				 */
				RegisterRequest.prototype.host = "";

				/**
				 * Creates a new RegisterRequest instance using the specified properties.
				 * @function create
				 * @memberof RegisterRequest
				 * @static
				 * @param {IRegisterRequest=} [properties] Properties to set
				 * @returns {RegisterRequest} RegisterRequest instance
				 */
				RegisterRequest.create = function create(properties) {
					return new RegisterRequest(properties);
				};

				/**
				 * Encodes the specified RegisterRequest message. Does not implicitly {@link RegisterRequest.verify|verify} messages.
				 * @function encode
				 * @memberof RegisterRequest
				 * @static
				 * @param {IRegisterRequest} message RegisterRequest message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				RegisterRequest.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.verificationQuery != null && Object.hasOwnProperty.call(message, "verificationQuery")) writer.uint32(/* id 1, wireType 2 =*/10).string(message.verificationQuery);
					if (message.host != null && Object.hasOwnProperty.call(message, "host")) writer.uint32(/* id 2, wireType 2 =*/18).string(message.host);
					return writer;
				};

				/**
				 * Decodes a RegisterRequest message from the specified reader or buffer.
				 * @function decode
				 * @memberof RegisterRequest
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {RegisterRequest} RegisterRequest
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				RegisterRequest.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.RegisterRequest();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									message.verificationQuery = reader.string();
									break;
								}
							case 2:
								{
									message.host = reader.string();
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for RegisterRequest
				 * @function getTypeUrl
				 * @memberof RegisterRequest
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				RegisterRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/RegisterRequest";
				};
				return RegisterRequest;
			}();
			$root.Sender = function () {
				/**
				 * Properties of a Sender.
				 * @exports ISender
				 * @interface ISender
				 * @property {SenderType|null} [type] Sender type
				 * @property {Uint8Array|null} [id] Sender id
				 */

				/**
				 * Constructs a new Sender.
				 * @exports Sender
				 * @classdesc Represents a Sender.
				 * @implements ISender
				 * @constructor
				 * @param {ISender=} [properties] Properties to set
				 */
				function Sender(properties) {
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * Sender type.
				 * @member {SenderType} type
				 * @memberof Sender
				 * @instance
				 */
				Sender.prototype.type = 0;

				/**
				 * Sender id.
				 * @member {Uint8Array} id
				 * @memberof Sender
				 * @instance
				 */
				Sender.prototype.id = $util.newBuffer([]);

				/**
				 * Creates a new Sender instance using the specified properties.
				 * @function create
				 * @memberof Sender
				 * @static
				 * @param {ISender=} [properties] Properties to set
				 * @returns {Sender} Sender instance
				 */
				Sender.create = function create(properties) {
					return new Sender(properties);
				};

				/**
				 * Encodes the specified Sender message. Does not implicitly {@link Sender.verify|verify} messages.
				 * @function encode
				 * @memberof Sender
				 * @static
				 * @param {ISender} message Sender message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				Sender.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.type != null && Object.hasOwnProperty.call(message, "type")) writer.uint32(/* id 1, wireType 0 =*/8).int32(message.type);
					if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.id);
					return writer;
				};

				/**
				 * Decodes a Sender message from the specified reader or buffer.
				 * @function decode
				 * @memberof Sender
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {Sender} Sender
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				Sender.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.Sender();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									message.type = reader.int32();
									break;
								}
							case 2:
								{
									message.id = reader.bytes();
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for Sender
				 * @function getTypeUrl
				 * @memberof Sender
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				Sender.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/Sender";
				};
				return Sender;
			}();

			/**
			 * SenderType enum.
			 * @exports SenderType
			 * @enum {number}
			 * @property {number} UNKNOWN=0 UNKNOWN value
			 * @property {number} CLIENT=1 CLIENT value
			 * @property {number} BACKEND=2 BACKEND value
			 */
			$root.SenderType = function () {
				var valuesById = {},
					values = Object.create(valuesById);
				values[valuesById[0] = "UNKNOWN"] = 0;
				values[valuesById[1] = "CLIENT"] = 1;
				values[valuesById[2] = "BACKEND"] = 2;
				return values;
			}();
			$root.Receiver = function () {
				/**
				 * Properties of a Receiver.
				 * @exports IReceiver
				 * @interface IReceiver
				 * @property {Uint8Array|null} [id] Receiver id
				 * @property {boolean|null} [isPrivate] Receiver isPrivate
				 * @property {Uint8Array|null} [signature] Receiver signature
				 */

				/**
				 * Constructs a new Receiver.
				 * @exports Receiver
				 * @classdesc Represents a Receiver.
				 * @implements IReceiver
				 * @constructor
				 * @param {IReceiver=} [properties] Properties to set
				 */
				function Receiver(properties) {
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * Receiver id.
				 * @member {Uint8Array} id
				 * @memberof Receiver
				 * @instance
				 */
				Receiver.prototype.id = $util.newBuffer([]);

				/**
				 * Receiver isPrivate.
				 * @member {boolean} isPrivate
				 * @memberof Receiver
				 * @instance
				 */
				Receiver.prototype.isPrivate = false;

				/**
				 * Receiver signature.
				 * @member {Uint8Array} signature
				 * @memberof Receiver
				 * @instance
				 */
				Receiver.prototype.signature = $util.newBuffer([]);

				/**
				 * Creates a new Receiver instance using the specified properties.
				 * @function create
				 * @memberof Receiver
				 * @static
				 * @param {IReceiver=} [properties] Properties to set
				 * @returns {Receiver} Receiver instance
				 */
				Receiver.create = function create(properties) {
					return new Receiver(properties);
				};

				/**
				 * Encodes the specified Receiver message. Does not implicitly {@link Receiver.verify|verify} messages.
				 * @function encode
				 * @memberof Receiver
				 * @static
				 * @param {IReceiver} message Receiver message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				Receiver.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.id);
					if (message.isPrivate != null && Object.hasOwnProperty.call(message, "isPrivate")) writer.uint32(/* id 2, wireType 0 =*/16).bool(message.isPrivate);
					if (message.signature != null && Object.hasOwnProperty.call(message, "signature")) writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.signature);
					return writer;
				};

				/**
				 * Decodes a Receiver message from the specified reader or buffer.
				 * @function decode
				 * @memberof Receiver
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {Receiver} Receiver
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				Receiver.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.Receiver();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									message.id = reader.bytes();
									break;
								}
							case 2:
								{
									message.isPrivate = reader.bool();
									break;
								}
							case 3:
								{
									message.signature = reader.bytes();
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for Receiver
				 * @function getTypeUrl
				 * @memberof Receiver
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				Receiver.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/Receiver";
				};
				return Receiver;
			}();
			$root.ResponseBatch = function () {
				/**
				 * Properties of a ResponseBatch.
				 * @exports IResponseBatch
				 * @interface IResponseBatch
				 * @property {Array.<IResponse>|null} [responses] ResponseBatch responses
				 */

				/**
				 * Constructs a new ResponseBatch.
				 * @exports ResponseBatch
				 * @classdesc Represents a ResponseBatch.
				 * @implements IResponseBatch
				 * @constructor
				 * @param {IResponseBatch=} [properties] Properties to set
				 */
				function ResponseBatch(properties) {
					this.responses = [];
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * ResponseBatch responses.
				 * @member {Array.<IResponse>} responses
				 * @memberof ResponseBatch
				 * @instance
				 */
				ResponseBatch.prototype.responses = $util.emptyArray;

				/**
				 * Creates a new ResponseBatch instance using the specified properties.
				 * @function create
				 * @memberof ResponseBatch
				 * @static
				 * @param {IResponseBatch=} [properties] Properties to set
				 * @returns {ResponseBatch} ResponseBatch instance
				 */
				ResponseBatch.create = function create(properties) {
					return new ResponseBatch(properties);
				};

				/**
				 * Encodes the specified ResponseBatch message. Does not implicitly {@link ResponseBatch.verify|verify} messages.
				 * @function encode
				 * @memberof ResponseBatch
				 * @static
				 * @param {IResponseBatch} message ResponseBatch message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				ResponseBatch.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.responses != null && message.responses.length) for (var i = 0; i < message.responses.length; ++i) $root.Response.encode(message.responses[i], writer.uint32(/* id 1, wireType 2 =*/10).fork(), q + 1).ldelim();
					return writer;
				};

				/**
				 * Decodes a ResponseBatch message from the specified reader or buffer.
				 * @function decode
				 * @memberof ResponseBatch
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {ResponseBatch} ResponseBatch
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				ResponseBatch.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.ResponseBatch();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									if (!(message.responses && message.responses.length)) message.responses = [];
									message.responses.push($root.Response.decode(reader, reader.uint32(), undefined, long + 1));
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for ResponseBatch
				 * @function getTypeUrl
				 * @memberof ResponseBatch
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				ResponseBatch.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/ResponseBatch";
				};
				return ResponseBatch;
			}();
			$root.Response = function () {
				/**
				 * Properties of a Response.
				 * @exports IResponse
				 * @interface IResponse
				 * @property {IOutgoingMessagesResponse|null} [outgoingMessages] Response outgoingMessages
				 * @property {IChannelStatsResponse|null} [channelStats] Response channelStats
				 * @property {IJsonResponse|null} [serverStats] Response serverStats
				 * @property {string|null} [json] Response json
				 */

				/**
				 * Constructs a new Response.
				 * @exports Response
				 * @classdesc Represents a Response.
				 * @implements IResponse
				 * @constructor
				 * @param {IResponse=} [properties] Properties to set
				 */
				function Response(properties) {
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * Response outgoingMessages.
				 * @member {IOutgoingMessagesResponse|null|undefined} outgoingMessages
				 * @memberof Response
				 * @instance
				 */
				Response.prototype.outgoingMessages = null;

				/**
				 * Response channelStats.
				 * @member {IChannelStatsResponse|null|undefined} channelStats
				 * @memberof Response
				 * @instance
				 */
				Response.prototype.channelStats = null;

				/**
				 * Response serverStats.
				 * @member {IJsonResponse|null|undefined} serverStats
				 * @memberof Response
				 * @instance
				 */
				Response.prototype.serverStats = null;

				/**
				 * Response json.
				 * @member {string|null|undefined} json
				 * @memberof Response
				 * @instance
				 */
				Response.prototype.json = null;

				// OneOf field names bound to virtual getters and setters
				var $oneOfFields;

				/**
				 * Response command.
				 * @member {"outgoingMessages"|"channelStats"|"serverStats"|"json"|undefined} command
				 * @memberof Response
				 * @instance
				 */
				Object.defineProperty(Response.prototype, "command", {
					get: $util.oneOfGetter($oneOfFields = ["outgoingMessages", "channelStats", "serverStats", "json"]),
					set: $util.oneOfSetter($oneOfFields)
				});

				/**
				 * Creates a new Response instance using the specified properties.
				 * @function create
				 * @memberof Response
				 * @static
				 * @param {IResponse=} [properties] Properties to set
				 * @returns {Response} Response instance
				 */
				Response.create = function create(properties) {
					return new Response(properties);
				};

				/**
				 * Encodes the specified Response message. Does not implicitly {@link Response.verify|verify} messages.
				 * @function encode
				 * @memberof Response
				 * @static
				 * @param {IResponse} message Response message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				Response.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.outgoingMessages != null && Object.hasOwnProperty.call(message, "outgoingMessages")) $root.OutgoingMessagesResponse.encode(message.outgoingMessages, writer.uint32(/* id 1, wireType 2 =*/10).fork(), q + 1).ldelim();
					if (message.channelStats != null && Object.hasOwnProperty.call(message, "channelStats")) $root.ChannelStatsResponse.encode(message.channelStats, writer.uint32(/* id 2, wireType 2 =*/18).fork(), q + 1).ldelim();
					if (message.serverStats != null && Object.hasOwnProperty.call(message, "serverStats")) $root.JsonResponse.encode(message.serverStats, writer.uint32(/* id 3, wireType 2 =*/26).fork(), q + 1).ldelim();
					if (message.json != null && Object.hasOwnProperty.call(message, "json")) writer.uint32(/* id 4, wireType 2 =*/34).string(message.json);
					return writer;
				};

				/**
				 * Decodes a Response message from the specified reader or buffer.
				 * @function decode
				 * @memberof Response
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {Response} Response
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				Response.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.Response();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									message.outgoingMessages = $root.OutgoingMessagesResponse.decode(reader, reader.uint32(), undefined, long + 1);
									break;
								}
							case 2:
								{
									message.channelStats = $root.ChannelStatsResponse.decode(reader, reader.uint32(), undefined, long + 1);
									break;
								}
							case 3:
								{
									message.serverStats = $root.JsonResponse.decode(reader, reader.uint32(), undefined, long + 1);
									break;
								}
							case 4:
								{
									message.json = reader.string();
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for Response
				 * @function getTypeUrl
				 * @memberof Response
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				Response.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/Response";
				};
				return Response;
			}();
			$root.OutgoingMessagesResponse = function () {
				/**
				 * Properties of an OutgoingMessagesResponse.
				 * @exports IOutgoingMessagesResponse
				 * @interface IOutgoingMessagesResponse
				 * @property {Array.<IOutgoingMessage>|null} [messages] OutgoingMessagesResponse messages
				 */

				/**
				 * Constructs a new OutgoingMessagesResponse.
				 * @exports OutgoingMessagesResponse
				 * @classdesc Represents an OutgoingMessagesResponse.
				 * @implements IOutgoingMessagesResponse
				 * @constructor
				 * @param {IOutgoingMessagesResponse=} [properties] Properties to set
				 */
				function OutgoingMessagesResponse(properties) {
					this.messages = [];
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * OutgoingMessagesResponse messages.
				 * @member {Array.<IOutgoingMessage>} messages
				 * @memberof OutgoingMessagesResponse
				 * @instance
				 */
				OutgoingMessagesResponse.prototype.messages = $util.emptyArray;

				/**
				 * Creates a new OutgoingMessagesResponse instance using the specified properties.
				 * @function create
				 * @memberof OutgoingMessagesResponse
				 * @static
				 * @param {IOutgoingMessagesResponse=} [properties] Properties to set
				 * @returns {OutgoingMessagesResponse} OutgoingMessagesResponse instance
				 */
				OutgoingMessagesResponse.create = function create(properties) {
					return new OutgoingMessagesResponse(properties);
				};

				/**
				 * Encodes the specified OutgoingMessagesResponse message. Does not implicitly {@link OutgoingMessagesResponse.verify|verify} messages.
				 * @function encode
				 * @memberof OutgoingMessagesResponse
				 * @static
				 * @param {IOutgoingMessagesResponse} message OutgoingMessagesResponse message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				OutgoingMessagesResponse.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.messages != null && message.messages.length) for (var i = 0; i < message.messages.length; ++i) $root.OutgoingMessage.encode(message.messages[i], writer.uint32(/* id 1, wireType 2 =*/10).fork(), q + 1).ldelim();
					return writer;
				};

				/**
				 * Decodes an OutgoingMessagesResponse message from the specified reader or buffer.
				 * @function decode
				 * @memberof OutgoingMessagesResponse
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {OutgoingMessagesResponse} OutgoingMessagesResponse
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				OutgoingMessagesResponse.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.OutgoingMessagesResponse();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									if (!(message.messages && message.messages.length)) message.messages = [];
									message.messages.push($root.OutgoingMessage.decode(reader, reader.uint32(), undefined, long + 1));
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for OutgoingMessagesResponse
				 * @function getTypeUrl
				 * @memberof OutgoingMessagesResponse
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				OutgoingMessagesResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/OutgoingMessagesResponse";
				};
				return OutgoingMessagesResponse;
			}();
			$root.OutgoingMessage = function () {
				/**
				 * Properties of an OutgoingMessage.
				 * @exports IOutgoingMessage
				 * @interface IOutgoingMessage
				 * @property {Uint8Array|null} [id] OutgoingMessage id
				 * @property {string|null} [body] OutgoingMessage body
				 * @property {number|null} [expiry] OutgoingMessage expiry
				 * @property {number|null} [created] OutgoingMessage created
				 * @property {ISender|null} [sender] OutgoingMessage sender
				 */

				/**
				 * Constructs a new OutgoingMessage.
				 * @exports OutgoingMessage
				 * @classdesc Represents an OutgoingMessage.
				 * @implements IOutgoingMessage
				 * @constructor
				 * @param {IOutgoingMessage=} [properties] Properties to set
				 */
				function OutgoingMessage(properties) {
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * OutgoingMessage id.
				 * @member {Uint8Array} id
				 * @memberof OutgoingMessage
				 * @instance
				 */
				OutgoingMessage.prototype.id = $util.newBuffer([]);

				/**
				 * OutgoingMessage body.
				 * @member {string} body
				 * @memberof OutgoingMessage
				 * @instance
				 */
				OutgoingMessage.prototype.body = "";

				/**
				 * OutgoingMessage expiry.
				 * @member {number} expiry
				 * @memberof OutgoingMessage
				 * @instance
				 */
				OutgoingMessage.prototype.expiry = 0;

				/**
				 * OutgoingMessage created.
				 * @member {number} created
				 * @memberof OutgoingMessage
				 * @instance
				 */
				OutgoingMessage.prototype.created = 0;

				/**
				 * OutgoingMessage sender.
				 * @member {ISender|null|undefined} sender
				 * @memberof OutgoingMessage
				 * @instance
				 */
				OutgoingMessage.prototype.sender = null;

				/**
				 * Creates a new OutgoingMessage instance using the specified properties.
				 * @function create
				 * @memberof OutgoingMessage
				 * @static
				 * @param {IOutgoingMessage=} [properties] Properties to set
				 * @returns {OutgoingMessage} OutgoingMessage instance
				 */
				OutgoingMessage.create = function create(properties) {
					return new OutgoingMessage(properties);
				};

				/**
				 * Encodes the specified OutgoingMessage message. Does not implicitly {@link OutgoingMessage.verify|verify} messages.
				 * @function encode
				 * @memberof OutgoingMessage
				 * @static
				 * @param {IOutgoingMessage} message OutgoingMessage message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				OutgoingMessage.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.id);
					if (message.body != null && Object.hasOwnProperty.call(message, "body")) writer.uint32(/* id 2, wireType 2 =*/18).string(message.body);
					if (message.expiry != null && Object.hasOwnProperty.call(message, "expiry")) writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.expiry);
					if (message.created != null && Object.hasOwnProperty.call(message, "created")) writer.uint32(/* id 4, wireType 5 =*/37).fixed32(message.created);
					if (message.sender != null && Object.hasOwnProperty.call(message, "sender")) $root.Sender.encode(message.sender, writer.uint32(/* id 5, wireType 2 =*/42).fork(), q + 1).ldelim();
					return writer;
				};

				/**
				 * Decodes an OutgoingMessage message from the specified reader or buffer.
				 * @function decode
				 * @memberof OutgoingMessage
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {OutgoingMessage} OutgoingMessage
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				OutgoingMessage.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.OutgoingMessage();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									message.id = reader.bytes();
									break;
								}
							case 2:
								{
									message.body = reader.string();
									break;
								}
							case 3:
								{
									message.expiry = reader.uint32();
									break;
								}
							case 4:
								{
									message.created = reader.fixed32();
									break;
								}
							case 5:
								{
									message.sender = $root.Sender.decode(reader, reader.uint32(), undefined, long + 1);
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for OutgoingMessage
				 * @function getTypeUrl
				 * @memberof OutgoingMessage
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				OutgoingMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/OutgoingMessage";
				};
				return OutgoingMessage;
			}();
			$root.ChannelStatsResponse = function () {
				/**
				 * Properties of a ChannelStatsResponse.
				 * @exports IChannelStatsResponse
				 * @interface IChannelStatsResponse
				 * @property {Array.<IChannelStats>|null} [channels] ChannelStatsResponse channels
				 */

				/**
				 * Constructs a new ChannelStatsResponse.
				 * @exports ChannelStatsResponse
				 * @classdesc Represents a ChannelStatsResponse.
				 * @implements IChannelStatsResponse
				 * @constructor
				 * @param {IChannelStatsResponse=} [properties] Properties to set
				 */
				function ChannelStatsResponse(properties) {
					this.channels = [];
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * ChannelStatsResponse channels.
				 * @member {Array.<IChannelStats>} channels
				 * @memberof ChannelStatsResponse
				 * @instance
				 */
				ChannelStatsResponse.prototype.channels = $util.emptyArray;

				/**
				 * Creates a new ChannelStatsResponse instance using the specified properties.
				 * @function create
				 * @memberof ChannelStatsResponse
				 * @static
				 * @param {IChannelStatsResponse=} [properties] Properties to set
				 * @returns {ChannelStatsResponse} ChannelStatsResponse instance
				 */
				ChannelStatsResponse.create = function create(properties) {
					return new ChannelStatsResponse(properties);
				};

				/**
				 * Encodes the specified ChannelStatsResponse message. Does not implicitly {@link ChannelStatsResponse.verify|verify} messages.
				 * @function encode
				 * @memberof ChannelStatsResponse
				 * @static
				 * @param {IChannelStatsResponse} message ChannelStatsResponse message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				ChannelStatsResponse.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.channels != null && message.channels.length) for (var i = 0; i < message.channels.length; ++i) $root.ChannelStats.encode(message.channels[i], writer.uint32(/* id 1, wireType 2 =*/10).fork(), q + 1).ldelim();
					return writer;
				};

				/**
				 * Decodes a ChannelStatsResponse message from the specified reader or buffer.
				 * @function decode
				 * @memberof ChannelStatsResponse
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {ChannelStatsResponse} ChannelStatsResponse
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				ChannelStatsResponse.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.ChannelStatsResponse();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									if (!(message.channels && message.channels.length)) message.channels = [];
									message.channels.push($root.ChannelStats.decode(reader, reader.uint32(), undefined, long + 1));
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for ChannelStatsResponse
				 * @function getTypeUrl
				 * @memberof ChannelStatsResponse
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				ChannelStatsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/ChannelStatsResponse";
				};
				return ChannelStatsResponse;
			}();
			$root.ChannelStats = function () {
				/**
				 * Properties of a ChannelStats.
				 * @exports IChannelStats
				 * @interface IChannelStats
				 * @property {Uint8Array|null} [id] ChannelStats id
				 * @property {boolean|null} [isPrivate] ChannelStats isPrivate
				 * @property {boolean|null} [isOnline] ChannelStats isOnline
				 */

				/**
				 * Constructs a new ChannelStats.
				 * @exports ChannelStats
				 * @classdesc Represents a ChannelStats.
				 * @implements IChannelStats
				 * @constructor
				 * @param {IChannelStats=} [properties] Properties to set
				 */
				function ChannelStats(properties) {
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * ChannelStats id.
				 * @member {Uint8Array} id
				 * @memberof ChannelStats
				 * @instance
				 */
				ChannelStats.prototype.id = $util.newBuffer([]);

				/**
				 * ChannelStats isPrivate.
				 * @member {boolean} isPrivate
				 * @memberof ChannelStats
				 * @instance
				 */
				ChannelStats.prototype.isPrivate = false;

				/**
				 * ChannelStats isOnline.
				 * @member {boolean} isOnline
				 * @memberof ChannelStats
				 * @instance
				 */
				ChannelStats.prototype.isOnline = false;

				/**
				 * Creates a new ChannelStats instance using the specified properties.
				 * @function create
				 * @memberof ChannelStats
				 * @static
				 * @param {IChannelStats=} [properties] Properties to set
				 * @returns {ChannelStats} ChannelStats instance
				 */
				ChannelStats.create = function create(properties) {
					return new ChannelStats(properties);
				};

				/**
				 * Encodes the specified ChannelStats message. Does not implicitly {@link ChannelStats.verify|verify} messages.
				 * @function encode
				 * @memberof ChannelStats
				 * @static
				 * @param {IChannelStats} message ChannelStats message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				ChannelStats.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.id);
					if (message.isPrivate != null && Object.hasOwnProperty.call(message, "isPrivate")) writer.uint32(/* id 2, wireType 0 =*/16).bool(message.isPrivate);
					if (message.isOnline != null && Object.hasOwnProperty.call(message, "isOnline")) writer.uint32(/* id 3, wireType 0 =*/24).bool(message.isOnline);
					return writer;
				};

				/**
				 * Decodes a ChannelStats message from the specified reader or buffer.
				 * @function decode
				 * @memberof ChannelStats
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {ChannelStats} ChannelStats
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				ChannelStats.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.ChannelStats();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									message.id = reader.bytes();
									break;
								}
							case 2:
								{
									message.isPrivate = reader.bool();
									break;
								}
							case 3:
								{
									message.isOnline = reader.bool();
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for ChannelStats
				 * @function getTypeUrl
				 * @memberof ChannelStats
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				ChannelStats.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/ChannelStats";
				};
				return ChannelStats;
			}();
			$root.JsonResponse = function () {
				/**
				 * Properties of a JsonResponse.
				 * @exports IJsonResponse
				 * @interface IJsonResponse
				 * @property {string|null} [json] JsonResponse json
				 */

				/**
				 * Constructs a new JsonResponse.
				 * @exports JsonResponse
				 * @classdesc Represents a JsonResponse.
				 * @implements IJsonResponse
				 * @constructor
				 * @param {IJsonResponse=} [properties] Properties to set
				 */
				function JsonResponse(properties) {
					if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
				}

				/**
				 * JsonResponse json.
				 * @member {string} json
				 * @memberof JsonResponse
				 * @instance
				 */
				JsonResponse.prototype.json = "";

				/**
				 * Creates a new JsonResponse instance using the specified properties.
				 * @function create
				 * @memberof JsonResponse
				 * @static
				 * @param {IJsonResponse=} [properties] Properties to set
				 * @returns {JsonResponse} JsonResponse instance
				 */
				JsonResponse.create = function create(properties) {
					return new JsonResponse(properties);
				};

				/**
				 * Encodes the specified JsonResponse message. Does not implicitly {@link JsonResponse.verify|verify} messages.
				 * @function encode
				 * @memberof JsonResponse
				 * @static
				 * @param {IJsonResponse} message JsonResponse message or plain object to encode
				 * @param {$protobuf.Writer} [writer] Writer to encode to
				 * @returns {$protobuf.Writer} Writer
				 */
				JsonResponse.encode = function encode(message, writer, q) {
					if (!writer) writer = $Writer.create();
					if (q === undefined) q = 0;
					if (q > $util.recursionLimit) throw Error("max depth exceeded");
					if (message.json != null && Object.hasOwnProperty.call(message, "json")) writer.uint32(/* id 1, wireType 2 =*/10).string(message.json);
					return writer;
				};

				/**
				 * Decodes a JsonResponse message from the specified reader or buffer.
				 * @function decode
				 * @memberof JsonResponse
				 * @static
				 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
				 * @param {number} [length] Message length if known beforehand
				 * @returns {JsonResponse} JsonResponse
				 * @throws {Error} If the payload is not a reader or valid buffer
				 * @throws {$protobuf.util.ProtocolError} If required fields are missing
				 */
				JsonResponse.decode = function decode(reader, length, error, long) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					if (long === undefined) long = 0;
					if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.JsonResponse();
					while (reader.pos < end) {
						var tag = reader.uint32();
						if (tag === error) break;
						switch (tag >>> 3) {
							case 1:
								{
									message.json = reader.string();
									break;
								}
							default:
								reader.skipType(tag & 7, long);
								break;
						}
					}
					return message;
				};

				/**
				 * Gets the default type url for JsonResponse
				 * @function getTypeUrl
				 * @memberof JsonResponse
				 * @static
				 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
				 * @returns {string} The default type url
				 */
				JsonResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
					if (typeUrlPrefix === undefined) {
						typeUrlPrefix = "type.googleapis.com";
					}
					return typeUrlPrefix + "/JsonResponse";
				};
				return JsonResponse;
			}();
			return $root;
		})(typeof window === "object" && typeof window.protobuf === 'object' && window.protobuf || typeof self === "object" && typeof self.protobuf === 'object' && self.protobuf || typeof protobuf === 'object' && protobuf);
		return model;
	}

	requireModel();

	// Protobuf message models

	// globalThis, not window: this module is also bundled into the SharedWorker
	globalThis.protobuf.roots['push-server'].Response;
	const ResponseBatch = globalThis.protobuf.roots['push-server'].ResponseBatch;
	globalThis.protobuf.roots['push-server'].Request;
	const RequestBatch = globalThis.protobuf.roots['push-server'].RequestBatch;
	globalThis.protobuf.roots['push-server'].IncomingMessagesRequest;
	const IncomingMessage = globalThis.protobuf.roots['push-server'].IncomingMessage;
	const Receiver = globalThis.protobuf.roots['push-server'].Receiver;

	class ProtobufCodec {
		constructor(options) {
			this.channelManager = options.channelManager;
		}
		extractMessages(pullEvent) {
			const result = [];
			try {
				const responseBatch = ResponseBatch.decode(new Uint8Array(pullEvent));
				for (let i = 0; i < responseBatch.responses.length; i++) {
					const response = responseBatch.responses[i];
					if (response.command !== 'outgoingMessages') {
						continue;
					}
					const messages = response.outgoingMessages.messages;
					for (const message of messages) {
						let messageFields = {};
						try {
							messageFields = JSON.parse(message.body);
						} catch (e) {
							console.error(`${getDateForLog()}: Pull: Could not parse message body`, e);
							continue;
						}
						if (!messageFields.extra) {
							messageFields.extra = {};
						}
						messageFields.extra.sender = {
							type: message.sender.type
						};
						if (message.sender.id instanceof Uint8Array) {
							messageFields.extra.sender.id = decodeId(message.sender.id);
						}
						const compatibleMessage = {
							mid: decodeId(message.id),
							text: messageFields
						};
						result.push(compatibleMessage);
					}
				}
			} catch (e) {
				console.error(`${getDateForLog()}: Pull: Could not parse message`, e);
			}
			return result;
		}
		async encodeMessageBatch(messageBatch) {
			const userIds = {};
			for (const element of messageBatch) {
				if (element.userList) {
					for (let j = 0; j < element.userList.length; j++) {
						userIds[element.userList[j]] = true;
					}
				}
			}
			const publicIds = await this.channelManager.getPublicIds(Object.keys(userIds));
			return this.encodeMessageBatchInternal(messageBatch, publicIds);
		}
		encodeMessageBatchInternal(messageBatch, publicIds) {
			const messages = [];
			messageBatch.forEach(messageFields => {
				const messageBody = messageFields.body;
				let receivers = [];
				if (messageFields.userList) {
					receivers = this.createMessageReceivers(messageFields.userList, publicIds);
				}
				if (messageFields.channelList) {
					if (!isArray(messageFields.channelList)) {
						throw new TypeError('messageFields.publicChannels must be an array');
					}
					messageFields.channelList.forEach(publicChannel => {
						let publicId = '';
						let signature = '';
						if (typeof publicChannel === 'string' && publicChannel.includes('.')) {
							const fields = publicChannel.toString().split('.');
							publicId = fields[0];
							signature = fields[1];
						} else if (typeof publicChannel === 'object' && 'publicId' in publicChannel && 'signature' in publicChannel) {
							publicId = publicChannel.publicId;
							signature = publicChannel.signature;
						} else {
							throw new Error('Public channel MUST be either a string, formatted like "{publicId}.{signature}" or an object with fields \'publicId\' and \'signature\'');
						}
						receivers.push(Receiver.create({
							id: this.encodeId(publicId),
							signature: this.encodeId(signature)
						}));
					});
				}
				const message = IncomingMessage.create({
					receivers,
					body: JSON.stringify(messageBody),
					expiry: messageFields.expiry || 0
				});
				messages.push(message);
			});
			const requestBatch = RequestBatch.create({
				requests: [{
					incomingMessages: {
						messages
					}
				}]
			});
			return RequestBatch.encode(requestBatch).finish();
		}
		createMessageReceivers(users, publicIds) {
			const result = [];
			for (const userId of users) {
				if (!publicIds[userId] || !publicIds[userId].publicId) {
					throw new Error(`Could not determine public id for user ${userId}`);
				}
				result.push(Receiver.create({
					id: this.encodeId(publicIds[userId].publicId),
					signature: this.encodeId(publicIds[userId].signature)
				}));
			}
			return result;
		}

		/**
		 * Converts message id from hex-encoded string to byte[]
		 * @param {string} id Hex-encoded string.
		 * @return {Uint8Array}
		 */
		encodeId(id) {
			if (!id) {
				return new Uint8Array();
			}
			const result = [];
			for (let i = 0; i < id.length; i += 2) {
				result.push(parseInt(id.slice(i, i + 2), 16));
			}
			return new Uint8Array(result);
		}
	}

	/**
	 * Converts message id from byte[] to string
	 */
	function decodeId(encodedId) {
		if (!(encodedId instanceof Uint8Array)) {
			throw new TypeError('encodedId should be an instance of Uint8Array');
		}
		let result = '';
		for (const element of encodedId) {
			const hexByte = element.toString(16);
			if (hexByte.length === 1) {
				result += '0';
			}
			result += hexByte;
		}
		return result;
	}

	class LegacyCodec {
		async encodeMessageBatch(messageBatch) {
			return null;
		}
		extractMessages(pullEvent) {
			const result = [];
			const dataArray = pullEvent.match(/#!NGINXNMS!#(.*?)#!NGINXNME!#/gm);
			if (dataArray === null) {
				const text = '\n========= PULL ERROR ===========\n' + 'Error type: parseResponse error parsing message\n' + '\n' + `Data string: ${pullEvent}\n` + '================================\n\n';
				console.error(text);
				return result;
			}
			for (let i = 0; i < dataArray.length; i++) {
				dataArray[i] = dataArray[i].slice(12, -12);
				if (dataArray[i].length <= 0) {
					continue;
				}
				let data = {};
				try {
					data = JSON.parse(dataArray[i]);
				} catch {
					continue;
				}
				result.push(data);
			}
			return result;
		}
	}

	/* eslint-disable no-param-reassign */
	/* eslint-disable @bitrix24/bitrix24-rules/no-typeof */
	/* eslint-disable @bitrix24/bitrix24-rules/no-native-events-binding */
	/* eslint-disable @bitrix24/bitrix24-rules/no-pseudo-private */
	/* eslint-disable no-underscore-dangle */
	// noinspection ES6PreferShortImport

	const RESTORE_WEBSOCKET_TIMEOUT = 30 * 60;
	const MAX_IDS_TO_STORE = 10;
	const PING_TIMEOUT = 10;
	const JSON_RPC_PING = 'ping';
	const JSON_RPC_PONG = 'pong';
	const LS_SESSION = 'bx-pull-session';

	// const LS_SESSION_CACHE_TIME = 20;

	const ConnectorEvents = {
		Message: 'message',
		RevisionChanged: 'revisionChanged',
		ChannelReplaced: 'channelReplaced',
		ConfigExpired: 'configExpired',
		ConnectionStatus: 'connectionStatus',
		ConnectionError: 'connectionError'
	};
	class Connector extends EventTarget {
		connectors = {
			webSocket: null,
			longPolling: null
		};
		connectPromises = [];
		pingWaitTimeout = null;
		reconnectTimeout = null;
		isWebsocketBlocked = false;
		isLongPollingBlocked = false;
		isManualDisconnect = false;
		_status = PullStatus.Offline;
		connectionAttempt = 0;
		constructor(options = {}) {
			super();
			this.config = options.config;
			this.logger = options.logger;
			this.storage = options.storage;
			this.restClient = options.restClient;
			this.isSecure = globalThis.location.protocol === 'https:';
			this.connectors.webSocket = new WebSocketConnector({
				pathGetter: () => this.getConnectionPathByType(ConnectionType.WebSocket),
				onOpen: this.onWebSocketOpen.bind(this),
				onMessage: this.onIncomingMessage.bind(this),
				onDisconnect: this.onWebSocketDisconnect.bind(this),
				onError: this.onWebSocketError.bind(this)
			});
			this.connectors.longPolling = new LongPollingConnector({
				pathGetter: () => this.getConnectionPathByType(ConnectionType.LongPolling),
				isBinary: this.isProtobufSupported() && !this.isJsonRpc(),
				onOpen: this.onLongPollingOpen.bind(this),
				onMessage: this.onIncomingMessage.bind(this),
				onDisconnect: this.onLongPollingDisconnect.bind(this),
				onError: this.onLongPollingError.bind(this)
			});
			this.connectionType = this.isWebSocketAllowed() ? ConnectionType.WebSocket : ConnectionType.LongPolling;
			for (const eventName of Object.keys(options.events || {})) {
				this.addEventListener(eventName, options.events[eventName]);
			}
			this.channelManager = new ChannelManager({
				restClient: options.restClient,
				getPublicListMethod: options.getPublicListMethod
			});
			this.jsonRpcAdapter = this.createRpcAdapter();
			this.codec = this.createCodec();
			this.session = {
				mid: null,
				tag: null,
				time: null,
				history: {},
				lastMessageIds: [],
				messageCount: 0
			};
			if (options.restoreSession && this.storage) {
				const oldSession = this.storage.get(LS_SESSION);
				const now = new Date();
				if (isPlainObject(oldSession) && 'ttl' in oldSession && oldSession.ttl >= now) {
					this.session.mid = oldSession.mid;
				}
			}
		}
		get status() {
			return this._status;
		}
		set status(status) {
			if (this._status === status) {
				return;
			}
			this._status = status;
			this.dispatchEvent(new CustomEvent(ConnectorEvents.ConnectionStatus, {
				detail: {
					status,
					connectionType: this.connector.connectionType
				}
			}));
		}
		createRpcAdapter() {
			return new JsonRpc({
				sender: this.connectors.webSocket,
				handlers: {
					'incoming.message': this.handleRpcIncomingMessage.bind(this)
				},
				events: {
					error: this.onRpcError.bind(this)
				}
			});
		}
		createCodec() {
			if (this.isProtobufSupported()) {
				return new ProtobufCodec({
					channelManager: this.channelManager
				});
			}
			return new LegacyCodec();
		}
		get connector() {
			return this.connectors[this.connectionType];
		}
		disconnect(disconnectCode, disconnectReason) {
			if (this.connector) {
				this.isManualDisconnect = true;
				this.connector.disconnect(disconnectCode, disconnectReason);
			}
		}
		stop(disconnectCode, disconnectReason) {
			this.disconnect(disconnectCode, disconnectReason);
			this.stopCheckConfig();
		}
		resetSession() {
			this.session.mid = null;
			this.session.tag = null;
			this.session.time = null;
		}
		setConfig(config) {
			const wasConnected = this.isConnected();
			if (wasConnected) {
				this.disconnect(CloseReasons.CONFIG_REPLACED, 'config was replaced');
			}
			this.config = config;
			if (config.publicChannels) {
				this.channelManager.setPublicIds(Object.values(config.publicChannels));
			}
			if (wasConnected) {
				this.connect();
			}
		}
		connect() {
			if (this.connector.connected) {
				return Promise.resolve();
			}
			if (this.reconnectTimeout) {
				clearTimeout(this.reconnectTimeout);
			}
			this.isManualDisconnect = false;
			this.status = PullStatus.Connecting;
			this.connectionAttempt++;
			return new Promise((resolve, reject) => {
				this.connectPromises.push({
					resolve,
					reject
				});
				this.connector.connect();
			});
		}
		reconnect(disconnectCode, disconnectReason, delay = 1) {
			this.disconnect(disconnectCode, disconnectReason);
			this.scheduleReconnect(delay);
		}
		restoreWebSocketConnection() {
			if (this.connectionType === ConnectionType.WebSocket) {
				return;
			}
			this.connectors.webSocket.connect();
		}
		scheduleReconnect(connectionDelay) {
			const delay = connectionDelay ?? this.getConnectionAttemptDelay(this.connectionAttempt);
			if (this.reconnectTimeout) {
				clearTimeout(this.reconnectTimeout);
			}
			this.logger?.log(`Pull: scheduling reconnection in ${delay} seconds; attempt # ${this.connectionAttempt}`);
			this.reconnectTimeout = setTimeout(() => {
				this.connect().catch(error => {
					console.error(error);
				});
			}, delay * 1000);
		}
		scheduleRestoreWebSocketConnection() {
			this.logger?.log(`Pull: scheduling restoration of websocket connection in ${RESTORE_WEBSOCKET_TIMEOUT} seconds`);
			if (this.restoreWebSocketTimeout) {
				return;
			}
			this.restoreWebSocketTimeout = setTimeout(() => {
				this.restoreWebSocketTimeout = 0;
				this.restoreWebSocketConnection();
			}, RESTORE_WEBSOCKET_TIMEOUT * 1000);
		}
		handleInternalPullEvent(command, message) {
			switch (command.toUpperCase()) {
				case SystemCommands.CHANNEL_EXPIRE:
					{
						if (message.params.action === 'reconnect' && 'new_channel' in message.params) {
							this.dispatchEvent(new CustomEvent(ConnectorEvents.ChannelReplaced), {
								detail: {
									type: message.params.channel.type,
									newChannel: message.params.new_channel
								}
							});
						} else {
							this.dispatchEvent(new CustomEvent(ConnectorEvents.ConfigExpired));
						}
						break;
					}
				case SystemCommands.CONFIG_EXPIRE:
					{
						this.dispatchEvent(new CustomEvent(ConnectorEvents.ConfigExpired));
						break;
					}
				case SystemCommands.SERVER_RESTART:
					{
						this.reconnect(CloseReasons.SERVER_RESTARTED, 'server was restarted', 15);
						break;
					}
			}
		}
		getConnectionBasePath(connectionType) {
			switch (connectionType) {
				case ConnectionType.WebSocket:
					return this.isSecure ? this.config.server.websocket_secure : this.config.server.websocket;
				case ConnectionType.LongPolling:
					return this.isSecure ? this.config.server.long_pooling_secure : this.config.server.long_polling;
				default:
					throw new Error(`Unknown connection type ${connectionType}`);
			}
		}
		getConnectionChannels() {
			const channels = [];
			for (const channelType of ['private', 'shared']) {
				if (channelType in this.config.channels) {
					channels.push(this.config.channels[channelType].id);
				}
			}
			if (channels.length === 0) {
				throw new Error('Empty channel list');
			}
			return channels.join('/');
		}
		getConnectionPath() {
			return this.getConnectionPathByType(this.connectionType);
		}
		getConnectionPathByType(connectionType) {
			const params = {};
			const path = this.getConnectionBasePath(connectionType);
			if (isNotEmptyString(this.config.jwt)) {
				params.token = this.config.jwt;
			} else {
				params.CHANNEL_ID = this.getConnectionChannels();
			}
			if (this.isJsonRpc()) {
				params.jsonRpc = 'true';
			} else if (this.isProtobufSupported()) {
				params.binaryMode = 'true';
			}
			if (this.isSharedMode()) {
				if (!this.config.clientId) {
					throw new Error('Push-server is in shared mode, but clientId is not set');
				}
				params.clientId = this.config.clientId;
			}
			if (this.config.server && this.config.server.hostname) {
				params.hostname = this.config.server.hostname;
			}
			if (this.session.mid) {
				params.mid = this.session.mid;
			}
			if (this.session.tag) {
				params.tag = this.session.tag;
			}
			if (this.session.time) {
				params.time = this.session.time;
			}
			params.revision = REVISION;
			return `${path}?${buildQueryString(params)}`;
		}
		getPublicationPath() {
			const path = this.isSecure ? this.config.server.publish_secure : this.config.server.publish;
			if (!path) {
				return '';
			}
			const channels = [];
			for (const type of Object.keys(this.config.channels)) {
				channels.push(this.config.channels[type].id);
			}
			const params = {
				CHANNEL_ID: channels.join('/')
			};
			return `${path}?${buildQueryString(params)}`;
		}
		emitMessage(message) {
			if (!isPlainObject(message.extra)) {
				message.extra = {};
			}
			if (message.extra.server_time_unix) {
				const timeShift = this.config.server.timeShift ?? 0;
				const timeAgo = (getTimestamp() - message.extra.server_time_unix * 1000) / 1000 - timeShift;
				message.extra.server_time_ago = timeAgo > 0 ? timeAgo : 0;
			}
			this.dispatchEvent(new CustomEvent(ConnectorEvents.Message, {
				detail: message
			}));
		}

		/**
		 * Returns reconnect delay in seconds
		 * @param attemptNumber
		 * @return {number}
		 */
		getConnectionAttemptDelay(attemptNumber) {
			let result = 60;
			if (attemptNumber < 1) {
				result = 0.5;
			} else if (attemptNumber < 3) {
				result = 5;
			} else if (attemptNumber < 5) {
				result = 25;
			} else if (attemptNumber < 10) {
				result = 45;
			}
			return result + result * Math.random() * 0.2;
		}
		onLongPollingOpen() {
			this.unloading = false;
			this.starting = false;
			this.connectionAttempt = 0;
			this.isManualDisconnect = false;
			this.status = PullStatus.Online;
			this.logger?.log('Pull: Long polling connection with push-server opened');
			if (this.isWebSocketEnabled()) {
				this.scheduleRestoreWebSocketConnection();
			}
			this.connectPromises.forEach(resolver => {
				resolver.resolve();
			});
			this.connectPromises = [];
		}
		onWebSocketOpen() {
			this.status = PullStatus.Online;
			this.isWebsocketBlocked = false;
			this.connectionAttempt = 0;

			// to prevent fallback to long polling in case of networking problems
			this.isLongPollingBlocked = true;
			if (this.connectionType === ConnectionType.LongPolling) {
				this.connectionType = ConnectionType.WebSocket;
				this.connectors.longPolling.disconnect();
			}
			if (this.restoreWebSocketTimeout) {
				clearTimeout(this.restoreWebSocketTimeout);
				this.restoreWebSocketTimeout = null;
			}
			this.logger?.log('Pull: Websocket connection with push-server opened');
			this.connectPromises.forEach(resolver => {
				resolver.resolve();
			});
			this.connectPromises = [];
		}
		onWebSocketDisconnect(e = {}) {
			if (this.connectionType === ConnectionType.WebSocket) {
				this.status = PullStatus.Offline;
			}
			if (this.isManualDisconnect) {
				this.logger?.logForce('Pull: Websocket connection with push-server manually closed');
			} else {
				this.logger?.logForce(`Pull: Websocket connection with push-server closed. Code: ${e.code}, reason: ${e.reason}`);
				if (e.code === CloseReasons.WRONG_CHANNEL_ID) {
					this.dispatchEvent(new CustomEvent(ConnectorEvents.ConnectionError, {
						detail: {
							code: e.code,
							reason: 'wrong channel signature'
						}
					}));
				} else {
					this.scheduleReconnect();
				}
			}

			// to prevent fallback to long polling in case of networking problems
			this.isLongPollingBlocked = true;
			this.isManualDisconnect = false;
			this.clearPingWaitTimeout();
		}
		onWebSocketError(e) {
			this.starting = false;
			if (this.connectionType === ConnectionType.WebSocket) {
				this.status = PullStatus.Offline;
			}
			console.error(`${getDateForLog()}: Pull: WebSocket connection error`, e);
			this.scheduleReconnect();
			this.connectPromises.forEach(resolver => {
				resolver.reject();
			});
			this.connectPromises = [];
			this.clearPingWaitTimeout();
		}
		onWebSocketBlockChanged(e) {
			const isWebSocketBlocked = e.isWebSocketBlocked;
			if (isWebSocketBlocked && this.connectionType === ConnectionType.WebSocket && !this.isConnected()) {
				clearTimeout(this.reconnectTimeout);
				this.connectionAttempt = 0;
				this.connectionType = ConnectionType.LongPolling;
				this.scheduleReconnect(1);
			} else if (!isWebSocketBlocked && this.connectionType === ConnectionType.LongPolling) {
				clearTimeout(this.reconnectTimeout);
				clearTimeout(this.restoreWebSocketTimeout);
				this.connectionAttempt = 0;
				this.connectionType = ConnectionType.WebSocket;
				this.scheduleReconnect(1);
			}
		}
		onLongPollingDisconnect(e = {}) {
			if (this.connectionType === ConnectionType.LongPolling) {
				this.status = PullStatus.Offline;
			}
			this.logger?.log(`Pull: Long polling connection with push-server closed. Code: ${e.code}, reason: ${e.reason}`);
			if (!this.isManualDisconnect) {
				this.scheduleReconnect();
			}
			this.isManualDisconnect = false;
			this.clearPingWaitTimeout();
		}
		onLongPollingError(e) {
			this.starting = false;
			if (this.connectionType === ConnectionType.LongPolling) {
				this.status = PullStatus.Offline;
			}
			console.error(`${getDateForLog()}: Pull: Long polling connection error`, e);
			this.scheduleReconnect();
			this.connectPromises.forEach(resolver => {
				resolver.reject();
			});
			this.connectPromises = [];
			this.clearPingWaitTimeout();
		}
		onIncomingMessage(message) {
			if (this.isJsonRpc()) {
				if (message === JSON_RPC_PING) {
					this.onJsonRpcPing();
				} else {
					this.jsonRpcAdapter.handleIncomingMessage(message);
				}
			} else {
				const events = this.codec.extractMessages(message);
				this.handleIncomingEvents(events);
			}
		}
		handleRpcIncomingMessage(messageFields) {
			this.session.mid = messageFields.mid;
			const body = messageFields.body;
			if (!messageFields.body.extra) {
				body.extra = {};
			}
			body.extra.sender = messageFields.sender;
			if ('user_params' in messageFields && isPlainObject(messageFields.user_params)) {
				Object.assign(body.params, messageFields.user_params);
			}
			if ('dictionary' in messageFields && isPlainObject(messageFields.dictionary)) {
				Object.assign(body.params, messageFields.dictionary);
			}
			if (this.checkDuplicate(messageFields.mid)) {
				this.addMessageToStat(body);
				this.trimDuplicates();
				if (body.module_id === 'pull') {
					this.handleInternalPullEvent(body.command, body);
				} else {
					this.emitMessage(body);
				}
				if (body.extra && body.extra.revision_web) {
					this.checkRevision(body.extra.revision_web);
				}
			}
			this.connector.send(`mack:${messageFields.mid}`);
			return {};
		}
		onRpcError(event) {
			// probably, fire event
		}
		onJsonRpcPing() {
			this.updatePingWaitTimeout();
			this.connector.send(JSON_RPC_PONG);
		}
		handleIncomingEvents(events) {
			const messages = [];
			if (events.length === 0) {
				this.session.mid = null;
				return;
			}
			for (const event of events) {
				this.updateSessionFromEvent(event);
				if (event.mid && !this.checkDuplicate(event.mid)) {
					continue;
				}
				this.addMessageToStat(event.text);
				messages.push(event.text);
			}
			this.trimDuplicates();
			messages.forEach(message => {
				if (message.module_id === 'pull') {
					this.handleInternalPullEvent(message.command, message);
				} else {
					this.emitMessage(message);
				}
				if (message.extra && message.extra.revision_web) {
					this.checkRevision(message.extra.revision_web);
				}
			});
		}
		checkRevision(serverRevision) {
			if (serverRevision > 0 && serverRevision !== REVISION) {
				this.logger?.log(`Pull revision changed from ${REVISION} to ${serverRevision}. Reload required`);
				this.dispatchEvent(new CustomEvent(ConnectorEvents.RevisionChanged, {
					detail: {
						revision: serverRevision
					}
				}));
			}
		}
		updateSessionFromEvent(event) {
			this.session.mid = event.mid || null;
			this.session.tag = event.tag || null;
			this.session.time = event.time || null;
		}
		checkDuplicate(mid) {
			if (this.session.lastMessageIds.includes(mid)) {
				// eslint-disable-next-line no-console
				console.warn(`Duplicate message ${mid} skipped`);
				return false;
			}
			this.session.lastMessageIds.push(mid);
			return true;
		}
		trimDuplicates() {
			if (this.session.lastMessageIds.length > MAX_IDS_TO_STORE) {
				this.session.lastMessageIds = this.session.lastMessageIds.slice(-MAX_IDS_TO_STORE);
			}
		}
		addMessageToStat(message) {
			if (!this.session.history[message.module_id]) {
				this.session.history[message.module_id] = {};
			}
			if (!this.session.history[message.module_id][message.command]) {
				this.session.history[message.module_id][message.command] = 0;
			}
			this.session.history[message.module_id][message.command]++;
			this.session.messageCount++;
		}
		getRevision() {
			return this.config && this.config.api ? this.config.api.revision_web : null;
		}
		getServerVersion() {
			return this.config && this.config.server ? this.config.server.version : 0;
		}
		getServerMode() {
			return this.config && this.config.server ? this.config.server.mode : null;
		}
		isConnected() {
			return this.connector.connected;
		}
		isWebSocketConnected() {
			return this.connector.connected && this.connector.connectionType === ConnectionType.WebSocket;
		}
		isWebSocketAllowed() {
			return !this.isWebsocketBlocked && this.isWebSocketEnabled();
		}
		isWebSocketEnabled() {
			return this.config && this.config.server && this.config.server.websocket_enabled === true;
		}
		isPublishingSupported() {
			return this.getServerVersion() > 3;
		}
		isPublishingEnabled() {
			if (!this.isPublishingSupported()) {
				return false;
			}
			return this.config && this.config.server && this.config.server.publish_enabled === true;
		}
		isProtobufSupported() {
			return this.getServerVersion() === 4 && !browser.IsIe();
		}
		isJsonRpc() {
			return this.getServerVersion() >= 5;
		}
		isSharedMode() {
			return this.getServerMode() === ServerMode.Shared;
		}
		setPublicIds(publicIds) {
			this.channelManager.setPublicIds(publicIds);
		}

		/**
		 * Sends batch of messages to the multiple public channels.
		 *
		 * @param {object[]} messageBatch Array of messages to send.
		 * @param  {int[]} messageBatch.userList User ids the message receivers.
		 * @param  {string[]|object[]} messageBatch.channelList Public ids of the channels to send messages.
		 * @param {string} messageBatch.moduleId Name of the module to receive message,
		 * @param {string} messageBatch.command Command name.
		 * @param {object} messageBatch.params Command parameters.
		 * @param {integer} [messageBatch.expiry] Message expiry time in seconds.
		 * @return void
		 */
		async sendMessageBatch(messageBatch) {
			if (!this.isPublishingEnabled()) {
				throw new Error('Client publishing is not supported or is disabled');
			}
			try {
				const packet = await this.codec.encodeMessageBatch(messageBatch);
				this.connector.send(packet);
			} catch (e) {
				console.error('sendMessageBatch error:', e);
				throw e;
			}
		}

		/**
		 * Send single message to the specified users.
		 *
		 * @param {integer[]} users User ids of the message receivers.
		 * @param {string} moduleId Name of the module to receive message,
		 * @param {string} command Command name.
		 * @param {object} params Command parameters.
		 * @param {integer} [expiry] Message expiry time in seconds.
		 */
		async sendMessage(users, moduleId, command, params, expiry) {
			const message = {
				userList: users,
				body: {
					module_id: moduleId,
					command,
					params
				},
				expiry
			};
			if (this.isJsonRpc()) {
				return this.jsonRpcAdapter.executeOutgoingRpcCommand(RpcMethod.Publish, message);
			}
			return this.sendMessageBatch([message]);
		}

		/**
		 * Send single message to the specified public channels.
		 *
		 * @param {string[]} publicChannels Public ids of the channels to receive message.
		 * @param {string} moduleId Name of the module to receive message,
		 * @param {string} command Command name.
		 * @param {object} params Command parameters.
		 * @param {integer} [expiry] Message expiry time in seconds.
		 * @return {Promise}
		 */
		sendMessageToChannels(publicChannels, moduleId, command, params, expiry) {
			const message = {
				channelList: publicChannels,
				body: {
					module_id: moduleId,
					command,
					params
				},
				expiry
			};
			if (this.isJsonRpc()) {
				return this.jsonRpcAdapter.executeOutgoingRpcCommand(RpcMethod.Publish, message);
			}
			return this.sendMessageBatch([message]);
		}

		/**
		 * @param userId {number}
		 */
		async subscribeUserStatusChange(userId) {
			if (typeof userId !== 'number') {
				throw new TypeError('userId must be a number');
			}
			await this.jsonRpcAdapter.executeOutgoingRpcCommand(RpcMethod.SubscribeStatusChange, {
				userId
			});
		}

		/**
		 * @param userId {number}
		 * @returns {Promise}
		 */
		async unsubscribeUserStatusChange(userId) {
			if (typeof userId !== 'number') {
				throw new TypeError('userId must be a number');
			}
			await this.jsonRpcAdapter.executeOutgoingRpcCommand(RpcMethod.UnsubscribeStatusChange, {
				userId
			});
		}

		/**
		 * Returns "last seen" time in seconds for the users. Result format: Object{userId: int}
		 * If the user is currently connected - will return 0.
		 * If the user if offline - will return diff between current timestamp and last seen timestamp in seconds.
		 * If the user was never online - the record for user will be missing from the result object.
		 *
		 * @param {integer[]} userList List of user ids.
		 * @returns {Promise}
		 */
		async getUsersLastSeen(userList) {
			if (!isArray(userList) || !userList.every(item => typeof item === 'number')) {
				throw new Error('userList must be an array of numbers');
			}
			const result = {};
			const response = await this.jsonRpcAdapter.executeOutgoingRpcCommand(RpcMethod.GetUsersLastSeen, {
				userList
			});
			const unresolved = [];
			for (const userId of userList) {
				if (!(userId in response)) {
					unresolved.push(userId);
				}
				result[userId] = response[userId];
			}
			if (unresolved.length === 0) {
				return result;
			}
			const params = {
				userIds: unresolved,
				sendToQueueSever: true
			};
			const restResponse = await this.restClient.callMethod('pull.api.user.getLastSeen', params);
			const restData = restResponse.data();
			for (const userId of Object.keys(restData)) {
				result[userId] = restData[userId];
			}
			return result;
		}

		/**
		 * Pings server. In case of success promise will be resolved, otherwise - rejected.
		 *
		 * @param {int} timeout Request timeout in seconds
		 * @returns {Promise}
		 */
		ping(timeout) {
			return this.jsonRpcAdapter.executeOutgoingRpcCommand(RpcMethod.Ping, {}, timeout);
		}

		/**
		 * Returns list channels that the connection is subscribed to.
		 *
		 * @returns {Promise}
		 */
		listChannels() {
			return this.jsonRpcAdapter.executeOutgoingRpcCommand(RpcMethod.ListChannels, {});
		}
		updatePingWaitTimeout() {
			clearTimeout(this.pingWaitTimeout);
			this.pingWaitTimeout = setTimeout(this.onPingTimeout.bind(this), PING_TIMEOUT * 2 * 1000);
		}
		clearPingWaitTimeout() {
			clearTimeout(this.pingWaitTimeout);
			this.pingWaitTimeout = null;
		}
		onPingTimeout() {
			this.pingWaitTimeout = null;
			if (!this.isConnected()) {
				return;
			}

			// eslint-disable-next-line no-console
			console.warn(`No pings are received in ${PING_TIMEOUT * 2} seconds. Reconnecting`);
			this.disconnect(CloseReasons.STUCK, 'connection stuck');
			this.scheduleReconnect();
		}
	}

	exports.Connector = Connector;
	exports.ConnectorEvents = ConnectorEvents;

})(this.BX.Pull = this.BX.Pull || {});
//# sourceMappingURL=connector.bundle.js.map
