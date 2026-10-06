/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core, ui_buttons) {
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
		})(SDKEvents || (SDKEvents = {}));

		class WebSDK {
			constructor(params) {
				var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
				this.params = params;
				this.expectedOrigin = WebSDK.resolveExpectedOrigin(params.appUrl);
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
				this.boardParams = {
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
				this.iframeEl = document.createElement('iframe');
				this.iframeEl.allow = 'clipboard-read; clipboard-write; fullscreen';
				this.boundListenBoardEvents = this.listenBoardEvents.bind(this);
			}
			static resolveExpectedOrigin(appUrl) {
				let origin;
				try {
					origin = new URL(appUrl).origin;
				} catch (e) {
					throw new Error('WebSDK: invalid appUrl');
				}
				if (!/^https?:$/.test(new URL(appUrl).protocol)) {
					throw new Error('WebSDK: unsupported appUrl scheme');
				}
				return origin;
			}
			isTrustedMessage(event) {
				return event.source === this.iframeEl.contentWindow && event.origin === this.expectedOrigin;
			}
			init() {
				const container = document.getElementById(this.params.containerId);
				if (!container) {
					console.error(`Элемент с id "${this.params.containerId}" не найден.`);
					return;
				}
				this.iframeEl.src = this.createUrl();
				this.iframeEl.style.width = '100%';
				this.iframeEl.style.height = '100%';
				this.iframeEl.style.border = 'none';
				container.appendChild(this.iframeEl);
				this.addEventListener();
				window.FlipBoard = this.getBoardMethods();
			}
			getBoardMethods() {
				return {
					tryToCloseBoard: () => new Promise((resolve, reject) => {
						var _a;
						const handler = event => {
							if (!this.isTrustedMessage(event)) {
								return;
							}
							var _a, _b;
							if (((_a = event.data) === null || _a === void 0 ? void 0 : _a.event) === SDKEvents.successCloseApp) {
								window.removeEventListener('message', handler);
								resolve();
							}
							if (((_b = event.data) === null || _b === void 0 ? void 0 : _b.event) === SDKEvents.errorCloseApp) {
								window.removeEventListener('message', handler);
								reject();
							}
						};
						window.addEventListener('message', handler);
						(_a = this.iframeEl.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage({
							event: SDKEvents.tryToCloseApp
						}, this.expectedOrigin);
					}),
					renameBoard: name => new Promise((resolve, reject) => {
						var _a;
						const handler = event => {
							if (!this.isTrustedMessage(event)) {
								return;
							}
							var _a, _b;
							if (((_a = event.data) === null || _a === void 0 ? void 0 : _a.event) === SDKEvents.successBoardRenamed) {
								window.removeEventListener('message', handler);
								resolve();
							}
							if (((_b = event.data) === null || _b === void 0 ? void 0 : _b.event) === SDKEvents.errorBoardRenamed) {
								window.removeEventListener('message', handler);
								reject();
							}
						};
						window.addEventListener('message', handler);
						(_a = this.iframeEl.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage({
							event: SDKEvents.renameBoard,
							data: {
								name
							}
						}, this.expectedOrigin);
					})
					// Другие методы можно добавить здесь
				};
			}
			createUrl() {
				const url = new URL(`${this.params.appUrl}${this.boardParams.partnerId === '0' ? '/sdkBoard' : ''}`);
				url.searchParams.set('fromSDK', 'true');
				if (this.boardParams.ui.openTemplatesModal) url.searchParams.set('openTemplates', 'true');
				if (this.boardParams.ui.spinner && this.boardParams.ui.spinner !== 'default') url.searchParams.set('spinner', this.boardParams.ui.spinner);
				url.searchParams.set('dt', Date.now().toString());
				if (this.boardParams.ui.scrollToElement) url.searchParams.set('elementId', this.boardParams.ui.scrollToElement);
				return url.toString();
			}
			addEventListener() {
				window.addEventListener('message', this.boundListenBoardEvents);
			}
			listenBoardEvents(event) {
				if (!this.isTrustedMessage(event)) {
					return;
				}
				var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16;
				if (((_a = event.data) === null || _a === void 0 ? void 0 : _a.event) === SDKEvents.waitParams) {
					// @ts-ignore
					(_b = this.iframeEl.contentWindow) === null || _b === void 0 ? void 0 : _b.postMessage({
						event: SDKEvents.setParams,
						data: this.boardParams
					}, this.expectedOrigin);
				}
				if (((_c = event.data) === null || _c === void 0 ? void 0 : _c.event) === SDKEvents.boardChanged) {
					if ((_e = (_d = this.params) === null || _d === void 0 ? void 0 : _d.events) === null || _e === void 0 ? void 0 : _e.onBoardChanged) {
						this.params.events.onBoardChanged();
					}
				}
				if (((_f = event.data) === null || _f === void 0 ? void 0 : _f.event) === SDKEvents.successBoardRenamed) {
					if ((_h = (_g = this.params) === null || _g === void 0 ? void 0 : _g.events) === null || _h === void 0 ? void 0 : _h.onBoardRenamed) {
						this.params.events.onBoardRenamed(((_k = (_j = event.data) === null || _j === void 0 ? void 0 : _j.data) === null || _k === void 0 ? void 0 : _k.name) || '');
					}
				}
				if (((_l = event.data) === null || _l === void 0 ? void 0 : _l.event) === SDKEvents.userIsKicked) {
					if ((_o = (_m = this.params) === null || _m === void 0 ? void 0 : _m.events) === null || _o === void 0 ? void 0 : _o.onUserKicked) {
						(_q = (_p = this.params) === null || _p === void 0 ? void 0 : _p.events) === null || _q === void 0 ? void 0 : _q.onUserKicked();
					}
				}
				if (((_r = event.data) === null || _r === void 0 ? void 0 : _r.event) === SDKEvents.userConfirmKickFromBoard) {
					if ((_t = (_s = this.params) === null || _s === void 0 ? void 0 : _s.events) === null || _t === void 0 ? void 0 : _t.onUserKickConfirmed) {
						(_v = (_u = this.params) === null || _u === void 0 ? void 0 : _u.events) === null || _v === void 0 ? void 0 : _v.onUserKickConfirmed();
					}
				}
				if (((_w = event.data) === null || _w === void 0 ? void 0 : _w.event) === SDKEvents.shareElementWithSocials) {
					if ((_y = (_x = this.params) === null || _x === void 0 ? void 0 : _x.events) === null || _y === void 0 ? void 0 : _y.onShareElementWithSocials) {
						(_0 = (_z = this.params) === null || _z === void 0 ? void 0 : _z.events) === null || _0 === void 0 ? void 0 : _0.onShareElementWithSocials(((_2 = (_1 = event.data) === null || _1 === void 0 ? void 0 : _1.data) === null || _2 === void 0 ? void 0 : _2.link) || '', ((_4 = (_3 = event.data) === null || _3 === void 0 ? void 0 : _3.data) === null || _4 === void 0 ? void 0 : _4.social) || 'telegram');
					}
				}
				if (((_5 = event.data) === null || _5 === void 0 ? void 0 : _5.event) === SDKEvents.shareElementWithBitrix) {
					if ((_7 = (_6 = this.params) === null || _6 === void 0 ? void 0 : _6.events) === null || _7 === void 0 ? void 0 : _7.onShareElementWithBitrix) {
						(_9 = (_8 = this.params) === null || _8 === void 0 ? void 0 : _8.events) === null || _9 === void 0 ? void 0 : _9.onShareElementWithBitrix(event.data.data);
					}
				}
				if (((_10 = event.data) === null || _10 === void 0 ? void 0 : _10.event) === SDKEvents.aiTextRequest) {
					const requestData = event.data.data;
					if ((_12 = (_11 = this.params) === null || _11 === void 0 ? void 0 : _11.events) === null || _12 === void 0 ? void 0 : _12.onAITextRequest) {
						this.params.events.onAITextRequest(requestData).then(response => {
							var _a, _b;
							if ('result' in response) {
								(_a = this.iframeEl.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage({
									event: SDKEvents.aiTextResponse,
									data: {
										requestId: requestData.requestId,
										result: response.result
									}
								}, this.expectedOrigin);
							} else {
								(_b = this.iframeEl.contentWindow) === null || _b === void 0 ? void 0 : _b.postMessage({
									event: SDKEvents.aiTextError,
									data: Object.assign({
										requestId: requestData.requestId
									}, response.error)
								}, this.expectedOrigin);
							}
						}).catch(() => {
							var _a;
							(_a = this.iframeEl.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage({
								event: SDKEvents.aiTextError,
								data: {
									requestId: requestData.requestId,
									code: 'UNKNOWN'
								}
							}, this.expectedOrigin);
						});
					} else {
						(_13 = this.iframeEl.contentWindow) === null || _13 === void 0 ? void 0 : _13.postMessage({
							event: SDKEvents.aiTextError,
							data: {
								requestId: requestData.requestId,
								code: 'NOT_SUPPORTED'
							}
						}, this.expectedOrigin);
					}
				}
				if (((_14 = event.data) === null || _14 === void 0 ? void 0 : _14.event) === SDKEvents.aiTextCancel) {
					if ((_16 = (_15 = this.params) === null || _15 === void 0 ? void 0 : _15.events) === null || _16 === void 0 ? void 0 : _16.onAITextCancel) {
						this.params.events.onAITextCancel(event.data.data);
					}
				}
			}
			// Teardown is explicit only: unsubscribing on beforeunload would leave the sdk deaf when the
			// navigation is cancelled or the page comes back from bfcache.
			destroy() {
				window.removeEventListener('message', this.boundListenBoardEvents);
			}
		}

		class Board {
			setupSharingButton = null;
			data = null;
			constructor(options) {
				this.setupSharingButton = ui_buttons.ButtonManager.createByUniqId(options.panelButtonUniqIds.setupSharing);
				this.data = options.boardData;
				this.bindEvents();
			}
			bindEvents() {
				if (this.setupSharingButton) {
					this.setupSharingButton.bindEvent('click', this.handleClickSharingAccessPopup.bind(this));
				}
			}
			handleClickSharingAccessPopup() {
				const buttonContainer = this.setupSharingButton?.getContainer();
				const shouldBlockExternalLinkFeature = buttonContainer?.dataset?.shouldBlockExternalLinkFeature === 'true';
				const blockerExternalLinkFeature = buttonContainer?.dataset?.blockerExternalLinkFeature;
				if (shouldBlockExternalLinkFeature && blockerExternalLinkFeature) {
					eval(blockerExternalLinkFeature);
					return;
				}
				const popupParams = {
					objectId: this.data.id,
					...(this.data.uniqueCode ? {
						uniqueCode: this.data.uniqueCode
					} : {})
				};
				main_core.Runtime.loadExtension('disk.sharing-access-popup').then(({
					SharingPopupDialog
				}) => {
					const popup = new SharingPopupDialog();
					popup.open(popupParams);
				});
			}
		}

		const SDK = WebSDK;

		exports.Board = Board;
		exports.SDK = SDK;

})(this.BX.Disk.Flipchart = this.BX.Disk.Flipchart || {}, BX, BX.UI);
//# sourceMappingURL=script.js.map
