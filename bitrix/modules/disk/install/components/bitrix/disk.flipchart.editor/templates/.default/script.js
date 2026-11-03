/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core, disk_documentHeader) {
		'use strict';

		class InvalidTokenError extends Error {}
		InvalidTokenError.prototype.name = "InvalidTokenError";
		function b64DecodeUnicode(str) {
			return decodeURIComponent(atob(str).replace(/(.)/g, (m, p) => {
				let code = p.charCodeAt(0).toString(16).toUpperCase();
				if (code.length < 2) {
					code = "0" + code;
				}
				return "%" + code;
			}));
		}
		function base64UrlDecode(str) {
			let output = str.replace(/-/g, "+").replace(/_/g, "/");
			switch (output.length % 4) {
				case 0:
					break;
				case 2:
					output += "==";
					break;
				case 3:
					output += "=";
					break;
				default:
					throw new Error("base64 string is not of the correct length");
			}
			try {
				return b64DecodeUnicode(output);
			} catch (err) {
				return atob(output);
			}
		}
		function jwtDecode(token, options) {
			if (typeof token !== "string") {
				throw new InvalidTokenError("Invalid token specified: must be a string");
			}
			options || (options = {});
			const pos = options.header === true ? 0 : 1;
			const part = token.split(".")[pos];
			if (typeof part !== "string") {
				throw new InvalidTokenError(`Invalid token specified: missing part #${pos + 1}`);
			}
			let decoded;
			try {
				decoded = base64UrlDecode(part);
			} catch (e) {
				throw new InvalidTokenError(`Invalid token specified: invalid base64 for part #${pos + 1} (${e.message})`);
			}
			try {
				return JSON.parse(decoded);
			} catch (e) {
				throw new InvalidTokenError(`Invalid token specified: invalid json for part #${pos + 1} (${e.message})`);
			}
		}

		/**
		 * Owns the message channel to the board iframe.
		 *
		 * Every incoming message is checked against both the iframe window and the origin derived from
		 * `appUrl`, and every outgoing message is addressed to that exact origin. Keeping the channel behind
		 * this class is what prevents a `targetOrigin` of `'*'` — and the JWT leak it enables — from coming
		 * back through an unrelated refactor.
		 */
		class BoardMessenger {
			constructor(iframeEl, appUrl) {
				this._iframeEl = iframeEl;
				this._expectedOrigin = BoardMessenger.resolveExpectedOrigin(appUrl);
			}
			/**
			 * A message is trusted only when it comes from the iframe window **and** from the expected origin.
			 * The window check alone is not enough: `contentWindow` survives a navigation to a foreign
			 * document, so the origin check is what stops a redirected iframe from continuing the exchange.
			 */
			isTrusted(event) {
				return event.source === this._iframeEl.contentWindow && event.origin === this._expectedOrigin;
			}
			post(event, data) {
				var _a;
				const message = data === undefined ? {
					event
				} : {
					event,
					data
				};
				(_a = this._iframeEl.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage(message, this._expectedOrigin);
			}
			static resolveExpectedOrigin(appUrl) {
				let url;
				try {
					url = new URL(appUrl);
				} catch (e) {
					throw new Error('WebSDK: invalid appUrl');
				}
				if (url.protocol !== 'http:' && url.protocol !== 'https:') {
					throw new Error('WebSDK: unsupported appUrl scheme');
				}
				return url.origin;
			}
		}

		/**
		 * Single `message` listener for the whole SDK.
		 *
		 * Handlers are registered per event and never see an untrusted message: the trust check happens once
		 * here instead of being repeated — and eventually forgotten — in every temporary handler.
		 */
		class SdkEventBus {
			constructor(messenger) {
				this._handlers = new Map();
				this._isListening = false;
				this.handleMessage = event => {
					if (!this._messenger.isTrusted(event)) {
						return;
					}
					const message = event.data;
					if (!message || typeof message.event !== 'string') {
						return;
					}
					const handlers = this._handlers.get(message.event);
					if (!handlers) {
						return;
					}
					// Copy first: a handler may unsubscribe itself or a sibling while we are dispatching.
					Array.from(handlers).forEach(handler => handler(message.data));
				};
				this._messenger = messenger;
			}
			start() {
				if (this._isListening) {
					return;
				}
				window.addEventListener('message', this.handleMessage);
				this._isListening = true;
			}
			stop() {
				if (!this._isListening) {
					return;
				}
				window.removeEventListener('message', this.handleMessage);
				this._isListening = false;
			}
			/** Several handlers may listen to the same event; returns the unsubscribe for this one. */
			on(event, handler) {
				var _a;
				const handlers = (_a = this._handlers.get(event)) !== null && _a !== void 0 ? _a : new Set();
				handlers.add(handler);
				this._handlers.set(event, handlers);
				return () => {
					handlers.delete(handler);
				};
			}
			/** Resolves on `successEvent`, rejects on `errorEvent`, and drops both subscriptions either way. */
			waitFor(successEvent, errorEvent) {
				return new Promise((resolve, reject) => {
					const unsubscribes = [];
					const stopWaiting = () => unsubscribes.forEach(unsubscribe => unsubscribe());
					unsubscribes.push(this.on(successEvent, () => {
						stopWaiting();
						resolve();
					}), this.on(errorEvent, () => {
						stopWaiting();
						reject();
					}));
				});
			}
		}

		var AccessLevel;
		(function (AccessLevel) {
			AccessLevel["private"] = "private";
			AccessLevel["readonly"] = "readonly";
			AccessLevel["editable"] = "editable";
		})(AccessLevel || (AccessLevel = {}));
		var DashboardFlow;
		(function (DashboardFlow) {
			DashboardFlow["short"] = "short";
		})(DashboardFlow || (DashboardFlow = {}));

		var SDKEvents;
		(function (SDKEvents) {
			SDKEvents["waitParams"] = "waitSDKParams";
			SDKEvents["setParams"] = "setParams";
			SDKEvents["boardChanged"] = "boardChanged";
			SDKEvents["tryToCloseApp"] = "tryToCloseApp";
			SDKEvents["successCloseApp"] = "successCloseApp";
			SDKEvents["errorCloseApp"] = "errorCloseApp";
			SDKEvents["renameBoard"] = "renameBoard";
			SDKEvents["successBoardRenamed"] = "successBoardRenamed";
			SDKEvents["errorBoardRenamed"] = "errorBoardRenamed";
			SDKEvents["userIsKicked"] = "userIsKicked";
			SDKEvents["userConfirmKickFromBoard"] = "userConfirmKickFromBoard";
			SDKEvents["shareElementWithSocials"] = "shareElementWithSocials";
			SDKEvents["shareElementWithBitrix"] = "shareElementWithBitrix";
			SDKEvents["aiTextRequest"] = "aiTextRequest";
			SDKEvents["aiTextResponse"] = "aiTextResponse";
			SDKEvents["aiTextError"] = "aiTextError";
			SDKEvents["aiTextCancel"] = "aiTextCancel";
			SDKEvents["mentionMembersRequest"] = "mentionMembersRequest";
			SDKEvents["mentionMembersResponse"] = "mentionMembersResponse";
			SDKEvents["mentionMembersError"] = "mentionMembersError";
			SDKEvents["mentionMembersCancel"] = "mentionMembersCancel";
		})(SDKEvents || (SDKEvents = {}));

		class WebSDK {
			constructor(params) {
				var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
				this._params = params;
				this._iframeEl = document.createElement('iframe');
				this._iframeEl.allow = 'clipboard-read; clipboard-write; fullscreen';
				// Throws on a malformed or non-http(s) appUrl before anything else is set up.
				this._messenger = new BoardMessenger(this._iframeEl, params.appUrl);
				this._bus = new SdkEventBus(this._messenger);
				let accessLevel;
				let canEditBoard;
				const boardData = {};
				let jwtParams = {
					user_id: '',
					username: '',
					avatar_url: '',
					access_level: 'read',
					can_edit_board: false,
					webhook_url: '',
					document_id: '',
					download_link: '',
					session_id: '',
					file_name: ''
				};
				if (params.token) {
					try {
						jwtParams = jwtDecode(params.token);
						accessLevel = jwtParams.access_level === 'read' ? AccessLevel.readonly : AccessLevel.editable;
						canEditBoard = jwtParams.can_edit_board;
						boardData.documentId = jwtParams.document_id;
						boardData.fileUrl = jwtParams.download_link;
						boardData.sessionId = jwtParams.session_id;
						boardData.fileName = jwtParams.file_name;
					} catch (e) {
						console.error('invalid token');
					}
				}
				this._boardParams = {
					appUrl: encodeURIComponent(params.appUrl),
					accessLevel,
					canEditBoard,
					token: params.token,
					lang: params.lang || 'ru',
					// bitrix partnerId by default
					partnerId: params.partnerId || '0',
					boardUrl: params.boardUrl && encodeURIComponent(params.boardUrl),
					ui: {
						colorTheme: ((_a = params.ui) === null || _a === void 0 ? void 0 : _a.colorTheme) || 'flipOriginLight',
						openTemplatesModal: !!((_b = params.ui) === null || _b === void 0 ? void 0 : _b.openTemplatesModal),
						compactHeader: !!((_c = params.ui) === null || _c === void 0 ? void 0 : _c.compactHeader),
						showCloseButton: !!((_d = params.ui) === null || _d === void 0 ? void 0 : _d.showCloseButton),
						dashboardFlow: ((_e = params.ui) === null || _e === void 0 ? void 0 : _e.dashboardFlow) || undefined,
						exportAsFile: ((_f = params.ui) === null || _f === void 0 ? void 0 : _f.exportAsFile) !== false,
						spinner: (_g = params.ui) === null || _g === void 0 ? void 0 : _g.spinner,
						userKickable: (_h = params.ui) === null || _h === void 0 ? void 0 : _h.userKickable,
						confirmUserKick: (_j = params.ui) === null || _j === void 0 ? void 0 : _j.confirmUserKick,
						scrollToElement: (_k = params.ui) === null || _k === void 0 ? void 0 : _k.scrollToElement,
						features: (_l = params.ui) === null || _l === void 0 ? void 0 : _l.features,
						shareElementInBitrix: (_m = params.ui) === null || _m === void 0 ? void 0 : _m.shareElementInBitrix
					},
					appContainerDomain: window.location.origin,
					boardData
				};
				this.registerEventHandlers();
			}
			init() {
				const container = document.getElementById(this._params.containerId);
				if (!container) {
					console.error(`Элемент с id "${this._params.containerId}" не найден.`);
					return;
				}
				this._iframeEl.src = this.createUrl();
				this._iframeEl.style.width = '100%';
				this._iframeEl.style.height = '100%';
				this._iframeEl.style.border = 'none';
				container.appendChild(this._iframeEl);
				this._bus.start();
				window.FlipBoard = this.getBoardMethods();
			}
			// Teardown is explicit only: unsubscribing on beforeunload would leave the sdk deaf when the
			// navigation is cancelled or the page comes back from bfcache.
			destroy() {
				this._bus.stop();
			}
			// Local shim: page-level handlers reuse the SDK trust check (source + origin).
			isTrustedMessage(event) {
				return this._messenger.isTrusted(event);
			}
			registerEventHandlers() {
				this._bus.on(SDKEvents.waitParams, () => {
					this._messenger.post(SDKEvents.setParams, this._boardParams);
				});
				this._bus.on(SDKEvents.boardChanged, () => {
					var _a, _b;
					(_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onBoardChanged) === null || _b === void 0 ? void 0 : _b.call(_a);
				});
				this._bus.on(SDKEvents.successBoardRenamed, data => {
					var _a, _b;
					(_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onBoardRenamed) === null || _b === void 0 ? void 0 : _b.call(_a, (data === null || data === void 0 ? void 0 : data.name) || '');
				});
				this._bus.on(SDKEvents.userIsKicked, () => {
					var _a, _b;
					(_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onUserKicked) === null || _b === void 0 ? void 0 : _b.call(_a);
				});
				this._bus.on(SDKEvents.userConfirmKickFromBoard, () => {
					var _a, _b;
					(_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onUserKickConfirmed) === null || _b === void 0 ? void 0 : _b.call(_a);
				});
				this._bus.on(SDKEvents.shareElementWithSocials, data => {
					var _a, _b;
					const shareData = data;
					(_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onShareElementWithSocials) === null || _b === void 0 ? void 0 : _b.call(_a, (shareData === null || shareData === void 0 ? void 0 : shareData.link) || '', (shareData === null || shareData === void 0 ? void 0 : shareData.social) || 'telegram');
				});
				this._bus.on(SDKEvents.shareElementWithBitrix, data => {
					var _a, _b;
					(_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onShareElementWithBitrix) === null || _b === void 0 ? void 0 : _b.call(_a, data);
				});
				this._bus.on(SDKEvents.aiTextRequest, data => {
					this.handleAITextRequest(data);
				});
				this._bus.on(SDKEvents.aiTextCancel, data => {
					var _a, _b;
					(_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onAITextCancel) === null || _b === void 0 ? void 0 : _b.call(_a, data);
				});
				this._bus.on(SDKEvents.mentionMembersRequest, data => {
					this.handleMentionMembersRequest(data);
				});
				this._bus.on(SDKEvents.mentionMembersCancel, data => {
					var _a, _b;
					(_b = (_a = this._params.events) === null || _a === void 0 ? void 0 : _a.onMentionMembersCancel) === null || _b === void 0 ? void 0 : _b.call(_a, data);
				});
			}
			handleAITextRequest(requestData) {
				var _a;
				const events = this._params.events;
				this.respondToBoard(requestData, SDKEvents.aiTextResponse, SDKEvents.aiTextError, (_a = events === null || events === void 0 ? void 0 : events.onAITextRequest) === null || _a === void 0 ? void 0 : _a.bind(events));
			}
			handleMentionMembersRequest(requestData) {
				var _a;
				const events = this._params.events;
				this.respondToBoard(requestData, SDKEvents.mentionMembersResponse, SDKEvents.mentionMembersError, (_a = events === null || events === void 0 ? void 0 : events.onMentionMembersRequest) === null || _a === void 0 ? void 0 : _a.bind(events));
			}
			/**
			 * Runs one host handler and answers the board on the matching event pair. A host that did not
			 * subscribe gets `NOT_SUPPORTED` rather than silence, so the board can stop waiting instead of
			 * hanging on a request nobody will ever answer. Shared so a new request event costs a
			 * subscription rather than another copy of this flow.
			 */
			respondToBoard(request, successEvent, errorEvent, handler) {
				const {
					requestId
				} = request;
				if (!handler) {
					this._messenger.post(errorEvent, {
						requestId,
						code: 'NOT_SUPPORTED'
					});
					return;
				}
				handler(request).then(response => {
					if ('error' in response) {
						this._messenger.post(errorEvent, Object.assign({
							requestId
						}, response.error));
						return;
					}
					this._messenger.post(successEvent, Object.assign({
						requestId
					}, response));
				}).catch(() => {
					this._messenger.post(errorEvent, {
						requestId,
						code: 'UNKNOWN'
					});
				});
			}
			getBoardMethods() {
				return {
					tryToCloseBoard: () => {
						const closed = this._bus.waitFor(SDKEvents.successCloseApp, SDKEvents.errorCloseApp);
						this._messenger.post(SDKEvents.tryToCloseApp);
						return closed;
					},
					renameBoard: name => {
						const renamed = this._bus.waitFor(SDKEvents.successBoardRenamed, SDKEvents.errorBoardRenamed);
						this._messenger.post(SDKEvents.renameBoard, {
							name
						});
						return renamed;
					}
					// Другие методы можно добавить здесь
				};
			}
			createUrl() {
				const url = new URL(`${this._params.appUrl}${this._boardParams.partnerId === '0' ? '/sdkBoard' : ''}`);
				url.searchParams.set('fromSDK', 'true');
				if (this._boardParams.ui.openTemplatesModal) url.searchParams.set('openTemplates', 'true');
				if (this._boardParams.ui.spinner && this._boardParams.ui.spinner !== 'default') url.searchParams.set('spinner', this._boardParams.ui.spinner);
				url.searchParams.set('dt', Date.now().toString());
				if (this._boardParams.ui.scrollToElement) url.searchParams.set('elementId', this._boardParams.ui.scrollToElement);
				return url.toString();
			}
		}

		/** The states of saving as the header of the document knows them; the board reports one of them. */

		/** The board never reports a refusal of its own, so the status it publishes carries no message. */

		/** The board saves by itself and says so from the moment it is opened. */
		const AutosaveStatus = Object.freeze({
			state: 'autosave'
		});

		/**
		 * State of saving of a board, put into the states of the editor adapter contract.
		 *
		 * A board is saved entirely by the server. The platform of the board reports a change over the
		 * webhook, and Disk downloads the board and writes a new version - right away when the board is
		 * ready, and from the queue when it is not: half a minute later, up to ten times
		 * (`BoardService::saveDocument()`). None of that result comes back to the browser: the module
		 * notifies no participant of a written version, and the page of the board holds no channel of its
		 * own, so a save could only ever be reported as still running and never as done.
		 *
		 * The header therefore shows the mode instead of the outcome: the board is autosaved, and the label
		 * of it is put up at once and never taken back. Nothing here depends on whether the board was
		 * touched, so there is no event of the board to listen to and nothing to publish afterwards.
		 */
		class SaveAdapter {
			subscribeToSaveStatus(listener) {
				if (main_core.Type.isFunction(listener)) {
					listener(AutosaveStatus);
				}

				// the label never changes, so there is nothing to stop telling; the contract stays callable
				return () => {};
			}

			/**
			 * A save of a board cannot be reached from the page: it is started by the platform of the board
			 * and finished by the server, which repeats a save the board was not ready for by itself. The
			 * interface of the board offers the page no save either, and no refusal of a save ever reaches
			 * the page to be repeated. The header draws no retry.
			 */
			canRetrySave() {
				return false;
			}
			retrySave() {
				// nothing to start, see canRetrySave(); the contract stays callable all the same
				return Promise.resolve();
			}
		}

		/** The container of the boost button the header expects; the board carries no boosts, so it stays empty. */
		const BOOST_BUTTON_CONTAINER_ID = 'flipchart-boost-button-container';

		/** The node the board is opened in: the SDK puts the frame of the board inside it. */
		const DEFAULT_BOARD_CONTAINER_ID = 'flipchart-editor';

		/** Messages the board posts to the page it is opened on. */
		const BoardMessage = Object.freeze({
			Renamed: 'successBoardRenamed'
		});
		class Board {
			saveAdapter = null;
			documentHeader = null;
			documentSessionHash = '';
			boardContainerId = DEFAULT_BOARD_CONTAINER_ID;
			constructor(options) {
				this.saveAdapter = new SaveAdapter();
				this.mountDocumentHeader(options);
			}

			/**
			 * The header of the opened board. It draws itself from the composition the server describes, and
			 * the page has nothing to do after the mount. Until the shell of the page renders the container,
			 * the page works without a header - and keeps the name synchronisation of the board it has today,
			 * which the same phase of the page takes away together with the old markup.
			 */
			mountDocumentHeader(options) {
				if (!main_core.Type.isElementNode(options.headerContainerNode)) {
					return;
				}
				this.documentSessionHash = main_core.Type.isStringFilled(options.documentSessionHash) ? options.documentSessionHash : '';
				if (main_core.Type.isStringFilled(options.boardContainerId)) {
					this.boardContainerId = options.boardContainerId;
				}
				this.documentHeader = this.createDocumentHeader(options.headerContainerNode, {
					documentSessionHash: this.documentSessionHash,
					adapter: this.saveAdapter,
					boostContainerId: BOOST_BUTTON_CONTAINER_ID,
					logoUrl: main_core.Type.isString(options.logoUrl) ? options.logoUrl : '',
					// the board is opened in the mode it was opened in: there is no transition to editing
					editUrl: '',
					sessionBoost: null,
					shouldShowPromoImmediately: false,
					composition: options.headerComposition ?? null
				});

				// a header which was not given the opening it belongs to reports so itself and draws nothing;
				// what the board says would then have nowhere to go
				if (this.documentSessionHash !== '') {
					main_core.Event.bind(window, 'message', this.handleBoardMessage);
					main_core.Event.bind(window, 'beforeunload', this.destroy);
				}
			}

			/** Which header the opening gets is decided in one place of its own. */
			createDocumentHeader(container, context) {
				return new disk_documentHeader.DocumentHeader(container, context);
			}

			/**
			 * The page of the board is left behind together with the board: the header is unmounted and what
			 * the board says is no longer listened to, the way both neighbouring shells take themselves down.
			 */
			destroy = () => {
				main_core.Event.unbind(window, 'message', this.handleBoardMessage);
				main_core.Event.unbind(window, 'beforeunload', this.destroy);
				const header = this.documentHeader;
				this.documentHeader = null;
				header?.unmount();
			};

			/**
			 * The board talks to the page from its own frame, and anything else on the page can post the very
			 * same message: what the board says is accepted only from the frame it was opened in.
			 */
			handleBoardMessage = event => {
				if (!this.isSentByBoard(event)) {
					return;
				}
				if (event.data?.event === BoardMessage.Renamed) {
					void this.applyNameFromBoard(event.data?.data?.name);
				}
			};
			isSentByBoard(event) {
				const frame = document.getElementById(this.boardContainerId)?.querySelector('iframe');
				return Boolean(frame) && event.source === frame.contentWindow;
			}

			/**
			 * The board was renamed on its own side, so the object is renamed after it: the name goes to the
			 * server through the header, which renames by the same action and shows what was stored. The
			 * extension of the object is none of the concern of the board - the server keeps it.
			 */
			async applyNameFromBoard(name) {
				if (!main_core.Type.isStringFilled(name)) {
					return;
				}
				await this.documentHeader?.rename(name);
			}
		}

		/** The board offers the users of the portal for a mention, and nothing else. */
		const SEARCH_ENTITY_ID = 'user';

		/** Names the caller of the selector; the recent items of the mention picker are kept under it. */
		const DIALOG_CONTEXT = 'DISK_FLIPCHART_COMMENT_MENTION';
		const ERROR_SEARCH_FAILED = 'SEARCH_FAILED';
		const ERROR_CANCELLED = 'CANCELLED';

		/**
		 * The people the board may offer for a mention, looked up through the entity selector of the portal.
		 *
		 * The board asks over the SDK and waits for exactly one answer per request: the SDK turns what this
		 * returns into the success or the error event the board listens for. So every request has to end -
		 * a search that failed is answered as an error, and a search the board no longer waits for is
		 * ended by the cancel it sent, instead of being left for a reply that would never come.
		 *
		 * The selector is asked headlessly: the dialog it searches under is described in the request itself,
		 * and nothing of it is rendered. The search itself is a seam - tests stand it in, production keeps
		 * the action of the portal.
		 */
		class MentionMembers {
			#pending = new Map();
			#search;
			constructor(options = {}) {
				this.#search = main_core.Type.isFunction(options.search) ? options.search : MentionMembers.runSearch;
			}

			/**
			 * Answers one request of the board. The search and the cancel of the very same request race each
			 * other, and whichever comes first ends it.
			 */
			request = data => {
				const requestId = MentionMembers.readRequestId(data);
				const query = main_core.Type.isString(data?.query) ? data.query : '';
				let cancel = null;
				const cancelled = new Promise(resolve => {
					cancel = resolve;
				});
				this.#pending.set(requestId, cancel);
				const searched = Promise.resolve().then(() => this.#search(query)).then(response => ({
					members: MentionMembers.toMembers(response)
				})).catch(error => ({
					error: {
						code: ERROR_SEARCH_FAILED,
						message: MentionMembers.readErrorMessage(error)
					}
				}));
				return Promise.race([searched, cancelled]).then(result => {
					this.#pending.delete(requestId);
					return result;
				});
			};

			/**
			 * The board stopped waiting for an answer, so the request is ended right away instead of hanging
			 * on a search whose result nobody reads any more.
			 */
			cancel = data => {
				const requestId = MentionMembers.readRequestId(data);
				const pending = this.#pending.get(requestId);
				this.#pending.delete(requestId);
				pending?.({
					error: {
						code: ERROR_CANCELLED
					}
				});
			};
			static runSearch(query) {
				const normalized = query.trim().replaceAll(/\s\s+/g, ' ');
				return main_core.ajax.runAction('ui.entityselector.doSearch', {
					json: {
						dialog: {
							context: DIALOG_CONTEXT,
							entities: [{
								id: SEARCH_ENTITY_ID
							}]
						},
						searchQuery: {
							query: normalized,
							// the selector searches nothing without the words of the query
							queryWords: normalized === '' ? [] : normalized.split(' '),
							dynamicSearchEntities: [SEARCH_ENTITY_ID]
						}
					}
				});
			}

			/**
			 * @return {Array} The users of the answer, in the order the selector ranked them; a result that
			 *     names nobody is an empty list rather than a refusal.
			 */
			static toMembers(response) {
				const items = response?.data?.dialog?.items;
				if (!main_core.Type.isArrayFilled(items)) {
					return [];
				}
				return items.filter(item => item?.entityId === SEARCH_ENTITY_ID).map(item => MentionMembers.toMember(item)).filter(member => member !== null);
			}

			/**
			 * The user as the board knows one. `id` is what the backend stores the mention by, so an item
			 * without one is left out; `email` and `avatarUrl` are told only when the portal has them, and
			 * are never made up.
			 */
			static toMember(item) {
				const id = main_core.Type.isStringFilled(item?.id) || main_core.Type.isNumber(item?.id) ? String(item.id) : '';
				if (id === '') {
					return null;
				}
				const member = {
					id,
					name: MentionMembers.readText(item?.title)
				};
				const email = item?.customData?.email;
				if (main_core.Type.isStringFilled(email)) {
					member.email = email;
				}
				const avatarUrl = MentionMembers.toAbsoluteUrl(item?.avatar);
				if (avatarUrl !== null) {
					member.avatarUrl = avatarUrl;
				}
				return member;
			}

			/** A node of the selector is a plain string or the text with the type it is drawn in. */
			static readText(node) {
				if (main_core.Type.isStringFilled(node)) {
					return node;
				}
				return main_core.Type.isStringFilled(node?.text) ? node.text : '';
			}

			/**
			 * The board is opened in a frame of another origin, so a path of the portal reaches it only in
			 * full; an address that is already absolute is kept as it is.
			 */
			static toAbsoluteUrl(avatar) {
				if (!main_core.Type.isStringFilled(avatar)) {
					return null;
				}
				try {
					return new URL(avatar, window.location.origin).href;
				} catch {
					return null;
				}
			}
			static readRequestId(data) {
				return main_core.Type.isStringFilled(data?.requestId) ? data.requestId : '';
			}
			static readErrorMessage(error) {
				const message = main_core.Type.isStringFilled(error?.message) ? error.message : error?.errors?.[0]?.message;
				return main_core.Type.isStringFilled(message) ? message : undefined;
			}
		}

		const SDK = WebSDK;

		exports.Board = Board;
		exports.MentionMembers = MentionMembers;
		exports.SDK = SDK;

})(this.BX.Disk.Flipchart = this.BX.Disk.Flipchart || {}, BX, BX.Disk);
//# sourceMappingURL=script.js.map
