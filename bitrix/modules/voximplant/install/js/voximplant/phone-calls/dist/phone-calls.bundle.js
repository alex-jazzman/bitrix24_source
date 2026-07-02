/* eslint-disable */
this.BX = this.BX || {};
(function (exports, voximplant, main_core, main_core_events, im_v2_lib_desktopApi, intranet_desktopDownload, main_popup, ui_dialogs_messagebox) {
	'use strict';

	const baseZIndex = 15000;
	const nop$1 = function () {};

	const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
	class Keypad {
		constructor(params) {
			if (!main_core.Type.isPlainObject(params)) {
				params = {};
			}
			this.bindElement = params.bindElement || null;
			this.offsetTop = params.offsetTop || 0;
			this.offsetLeft = params.offsetLeft || 0;
			this.anglePosition = params.anglePosition || '';
			this.angleOffset = params.angleOffset || 0;
			this.history = params.history || [];
			this.selectedLineId = params.defaultLineId;
			this.lines = params.lines || {};
			this.availableLines = params.availableLines || [];
			this.callInterceptAllowed = params.callInterceptAllowed === true;
			this.zIndex = baseZIndex + 200;

			//flags
			this.hideDial = params.hideDial === true;
			this.plusEntered = false;
			this.callbacks = {
				onButtonClick: main_core.Type.isFunction(params.onButtonClick) ? params.onButtonClick : nop$1,
				onDial: main_core.Type.isFunction(params.onDial) ? params.onDial : nop$1,
				onIntercept: main_core.Type.isFunction(params.onIntercept) ? params.onIntercept : nop$1,
				onClose: main_core.Type.isFunction(params.onClose) ? params.onClose : nop$1
			};
			this.elements = {
				inputContainer: null,
				input: null,
				lineSelector: null,
				lineName: null,
				interceptButton: null,
				historyButton: null
			};
			this.plusKeyTimeout = null;
			this.popup = this.createPopup();
		}
		createPopup() {
			let popupOptions = {
				id: 'phone-call-view-popup-keypad',
				bindElement: this.bindElement,
				targetContainer: document.body,
				darkMode: true,
				closeByEsc: true,
				autoHide: true,
				zIndex: this.zIndex,
				content: this.render(),
				noAllPaddings: true,
				offsetTop: this.offsetTop,
				offsetLeft: this.offsetLeft,
				overlay: {
					backgroundColor: 'white',
					opacity: 0
				},
				events: {
					onPopupClose: this.onPopupClose.bind(this)
				}
			};
			if (this.anglePosition !== '') {
				popupOptions.angle = {
					position: this.anglePosition,
					offset: this.angleOffset
				};
			}
			return new main_popup.Popup(popupOptions);
		}
		onPopupClose() {
			this.callbacks.onClose();
			if (this.popup) {
				this.popup.destroy();
			}
		}
		canSelectLine() {
			return this.availableLines.length > 1;
		}
		setSelectedLineId(lineId) {
			this.selectedLineId = lineId;
			if (this.elements.lineName) {
				this.elements.lineName.innerText = this.getLineName(lineId);
			}
		}
		getLineName(lineId) {
			return this.lines.hasOwnProperty(lineId) ? this.lines[lineId].SHORT_NAME : '';
		}
		render() {
			return main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-calc-wrap"
				},
				children: [main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-calc-body"
					},
					children: [this.elements.inputContainer = main_core.Dom.create("div", {
						props: {
							className: 'bx-messenger-calc-panel'
						},
						children: [main_core.Dom.create("span", {
							props: {
								className: "bx-messenger-calc-panel-delete"
							},
							events: {
								click: this._onDeleteButtonClick.bind(this)
							}
						}), this.elements.input = main_core.Dom.create("input", {
							attrs: {
								'readonly': this.hideDial,
								type: "text",
								value: '',
								placeholder: main_core.Loc.getMessage(this.hideDial ? 'IM_PHONE_PUT_DIGIT' : 'IM_PHONE_PUT_NUMBER')
							},
							props: {
								className: "bx-messenger-calc-panel-input"
							},
							events: {
								keydown: this._onInputKeydown.bind(this),
								keyup: () => this._onAfterNumberChanged()
							}
						})]
					}), main_core.Dom.create("div", {
						props: {
							className: "bx-messenger-calc-btns-block"
						},
						children: digits.map(digit => renderNumber(digit, this._onKeyMouseDown.bind(this), this._onKeyMouseUp.bind(this)))
					})]
				}), this.hideDial ? null : main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-call-btn-wrap"
					},
					children: [this.elements.lineSelector = !this.canSelectLine() ? null : main_core.Dom.create("div", {
						props: {
							className: "im-phone-select-line"
						},
						children: [this.elements.lineName = main_core.Dom.create("span", {
							props: {
								className: "im-phone-select-line-name"
							},
							text: this.getLineName(this.selectedLineId)
						}), main_core.Dom.create("span", {
							props: {
								className: "im-phone-select-line-select"
							}
						})],
						events: {
							click: this._onLineSelectClick.bind(this)
						}
					}), main_core.Dom.create("span", {
						props: {
							className: "bx-messenger-call-btn-separate"
						},
						children: [main_core.Dom.create("span", {
							props: {
								className: "bx-messenger-call-btn"
							},
							children: [main_core.Dom.create("span", {
								props: {
									className: "bx-messenger-call-btn-text"
								},
								text: main_core.Loc.getMessage('IM_PHONE_CALL')
							})],
							events: {
								click: this._onDialButtonClick.bind(this)
							}
						}), this.elements.historyButton = main_core.Dom.create("span", {
							props: {
								className: "bx-messenger-call-btn-arrow"
							},
							events: {
								click: this._onShowHistoryButtonClick.bind(this)
							}
						})]
					}), this.elements.interceptButton = main_core.Dom.create("span", {
						props: {
							className: "im-phone-intercept-button" + (this.callInterceptAllowed ? "" : " im-phone-intercept-button-locked")
						},
						text: main_core.Loc.getMessage("IM_PHONE_CALL_VIEW_INTERCEPT"),
						events: {
							click: this._onInterceptButtonClick.bind(this)
						}
					})]
				})]
			});
		}
		_onInputKeydown(e) {
			if (e.keyCode == 13) {
				this.callbacks.onDial({
					phoneNumber: this.elements.input.value,
					lineId: this.selectedLineId
				});
			} else if (e.keyCode == 37 || e.keyCode == 39 || e.keyCode == 8 || e.keyCode == 107 || e.keyCode == 46 || e.keyCode == 35 || e.keyCode == 36)
				// left, right, backspace, num plus, home, end
				; else if (e.key === '+' || e.key === '#' || e.key === '*')
				// +
				; else if ((e.keyCode == 67 || e.keyCode == 86 || e.keyCode == 65 || e.keyCode == 88) && (e.metaKey || e.ctrlKey))
				// ctrl+v/c/a/x
				; else if (e.keyCode >= 48 && e.keyCode <= 57 && !e.shiftKey)
				// 0-9
				{
					insertAtCursor(this.elements.input, e.key);
					e.preventDefault();
					this.callbacks.onButtonClick({
						key: e.key
					});
				} else if (e.keyCode >= 96 && e.keyCode <= 105 && !e.shiftKey)
				// extra 0-9
				{
					insertAtCursor(this.elements.input, e.key);
					e.preventDefault();
					this.callbacks.onButtonClick({
						key: e.key
					});
				} else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
				e.preventDefault();
			}
		}
		_onAfterNumberChanged() {
			this.elements.inputContainer.classList.toggle('bx-messenger-calc-panel-active', this.elements.input.value.length > 0);
			this.elements.input.focus();
		}
		_onDeleteButtonClick() {
			this.elements.input.value = this.elements.input.value.substr(0, this.elements.input.value.length - 1);
			this._onAfterNumberChanged();
		}
		_onDialButtonClick() {
			this.callbacks.onDial({
				phoneNumber: this.elements.input.value,
				lineId: this.selectedLineId
			});
		}
		_onInterceptButtonClick() {
			this.callbacks.onIntercept({
				interceptButton: this.elements.interceptButton
			});
		}
		_onKeyMouseDown(key) {
			if (key === '0') {
				this.plusEntered = false;
				this.plusKeyTimeout = setTimeout(() => {
					if (!this.elements.input.value.startsWith('+')) {
						this.plusEntered = true;
						this.elements.input.value = '+' + this.elements.input.value;
					}
				}, 500);
			}
		}
		_onKeyMouseUp(key) {
			if (key === '0') {
				clearTimeout(this.plusKeyTimeout);
				if (!this.plusEntered) {
					insertAtCursor(this.elements.input, '0');
				}
				this.plusEntered = false;
			} else {
				insertAtCursor(this.elements.input, key);
			}
			this._onAfterNumberChanged();
			this.callbacks.onButtonClick({
				key: key
			});
		}
		_onShowHistoryButtonClick() {
			let menuItems = [];
			if (!main_core.Type.isArray(this.history) || this.history.length === 0) {
				return;
			}
			this.history.forEach((phoneNumber, index) => {
				menuItems.push({
					id: "history_" + index,
					text: main_core.Text.encode(phoneNumber),
					onclick: () => {
						this.historySelectMenu.close();
						this.callbacks.onDial({
							phoneNumber: phoneNumber,
							lineId: this.selectedLineId
						});
					}
				});
			});
			this.historySelectMenu = new main_popup.Menu('phoneCallViewDialHistory', this.elements.historyButton, menuItems, {
				autoHide: true,
				offsetTop: 0,
				offsetLeft: 0,
				zIndex: baseZIndex + 300,
				bindOptions: {
					position: 'top'
				},
				angle: {
					offset: 33
				},
				closeByEsc: true,
				overlay: {
					backgroundColor: 'white',
					opacity: 0
				},
				events: {
					onPopupClose: () => this.historySelectMenu.destroy(),
					onPopupDestroy: () => this.historySelectMenu = null
				}
			});
			this.historySelectMenu.show();
		}
		_onLineSelectClick(e) {
			let menuItems = [];
			this.availableLines.forEach(lineId => {
				menuItems.push({
					id: "selectLine_" + lineId,
					text: main_core.Text.encode(this.getLineName(lineId)),
					onclick: () => {
						this.lineSelectMenu.close();
						this.setSelectedLineId(lineId);
					}
				});
			});
			this.lineSelectMenu = new main_popup.Menu('phoneCallViewSelectLine', this.elements.lineSelector, menuItems, {
				autoHide: true,
				zIndex: this.zIndex + 100,
				closeByEsc: true,
				bindOptions: {
					position: 'top'
				},
				offsetLeft: 35,
				angle: {
					offset: 33
				},
				overlay: {
					backgroundColor: 'white',
					opacity: 0
				},
				maxHeight: 600,
				events: {
					onPopupClose: () => this.lineSelectMenu.destroy(),
					onPopupDestroy: () => this.lineSelectMenu = null
				}
			});
			this.lineSelectMenu.show();
		}
		show() {
			if (this.popup) {
				this.popup.show();
				this.elements.input.focus();
			}
		}
		close() {
			if (this.lineSelectMenu) {
				this.lineSelectMenu.destroy();
			}
			if (this.historySelectMenu) {
				this.historySelectMenu.destroy();
			}
			if (this.popup) {
				this.popup.close();
			}
		}
		destroy() {
			if (this.lineSelectMenu) {
				this.lineSelectMenu.destroy();
			}
			if (this.historySelectMenu) {
				this.historySelectMenu.destroy();
			}
			if (this.popup) {
				this.popup.destroy();
			}
			this.popup = null;
		}
	}
	function renderNumber(number, onMouseDown, onMouseUp) {
		let classSuffix;
		if (number == '*') {
			classSuffix = '10';
		} else if (number == '#') {
			classSuffix = '11';
		} else {
			classSuffix = number;
		}
		return main_core.Dom.create("span", {
			dataset: {
				'digit': number
			},
			props: {
				className: "bx-messenger-calc-btn bx-messenger-calc-btn-" + classSuffix
			},
			children: [main_core.Dom.create("span", {
				props: {
					className: 'bx-messenger-calc-btn-num'
				}
			})],
			events: {
				mousedown: e => onMouseDown(e.currentTarget.dataset.digit),
				mouseup: e => onMouseUp(e.currentTarget.dataset.digit)
			}
		});
	}
	function insertAtCursor(inputElement, value) {
		if (inputElement.selectionStart || inputElement.selectionStart == '0') {
			var startPos = inputElement.selectionStart;
			var endPos = inputElement.selectionEnd;
			inputElement.value = inputElement.value.substring(0, startPos) + value + inputElement.value.substring(endPos, inputElement.value.length);
			inputElement.selectionStart = startPos + value.length;
			inputElement.selectionEnd = startPos + value.length;
		} else {
			inputElement.value += value;
		}
	}

	const callCardEvents = {
		addCommentButtonClick: 'addCommentButtonClick',
		muteButtonClick: 'muteButtonClick',
		holdButtonClick: 'holdButtonClick',
		transferButtonClick: 'transferButtonClick',
		cancelTransferButtonClick: 'cancelTransferButtonClick',
		completeTransferButtonClick: 'completeTransferButtonClick',
		hangupButtonClick: 'hangupButtonClick',
		nextButtonClick: 'nextButtonClick',
		skipButtonClick: 'skipButtonClick',
		answerButtonClick: 'answerButtonClick',
		entityChanged: 'entityChanged',
		qualityMeterClick: 'qualityMeterClick',
		dialpadButtonClick: 'dialpadButtonClick',
		makeCallButtonClick: 'makeCallButtonClick',
		notifyAdminButtonClick: 'notifyAdminButtonClick',
		closeButtonClick: 'closeButtonClick'
	};
	const UndefinedCallCard = {
		result: 'error',
		errorCode: 'Call card is undefined'
	};

	/** @abstract */
	class BaseWorker {
		isExternalCall = false;
		used = false;
		/** @abstract */
		initializePlacement() {
			throw new Error('You have to implement the method initializePlacement!');
		}

		/** @abstract */
		initializeInterface(placement) {
			throw new Error('You have to implement the method initializeInterface!');
		}

		/** @abstract */
		emitInitializeEvent(params) {
			throw new Error('You have to implement the method emitInitializeEvent!');
		}

		/** @abstract */
		emitEvent(name, params) {
			throw new Error('You have to implement the method emitEvent!');
		}
		setCallCard(callCard) {
			this.CallCard = callCard;
			return this;
		}
		setIsExternalCall(isExternalCall) {
			this.isExternalCall = isExternalCall;
			return this;
		}
		isCardActive() {
			return this.CallCard instanceof PhoneCallView;
		}
		isUsed() {
			return this.used;
		}
		initializeInterfaceEvents(placement) {
			placement.prototype.events.push('BackgroundCallCard::initialized');
			placement.prototype.events.push('BackgroundCallCard::addCommentButtonClick');
			placement.prototype.events.push('BackgroundCallCard::muteButtonClick');
			placement.prototype.events.push('BackgroundCallCard::holdButtonClick');
			placement.prototype.events.push('BackgroundCallCard::closeButtonClick');
			placement.prototype.events.push('BackgroundCallCard::transferButtonClick');
			placement.prototype.events.push('BackgroundCallCard::cancelTransferButtonClick');
			placement.prototype.events.push('BackgroundCallCard::completeTransferButtonClick');
			placement.prototype.events.push('BackgroundCallCard::hangupButtonClick');
			placement.prototype.events.push('BackgroundCallCard::nextButtonClick');
			placement.prototype.events.push('BackgroundCallCard::skipButtonClick');
			placement.prototype.events.push('BackgroundCallCard::answerButtonClick');
			placement.prototype.events.push('BackgroundCallCard::entityChanged');
			placement.prototype.events.push('BackgroundCallCard::qualityMeterClick');
			placement.prototype.events.push('BackgroundCallCard::dialpadButtonClick');
			placement.prototype.events.push('BackgroundCallCard::makeCallButtonClick');
			placement.prototype.events.push('BackgroundCallCard::notifyAdminButtonClick');
			return this;
		}
		getEvents() {
			return callCardEvents;
		}
		getListUiStates(params, callback) {
			this.used = true;
			callback(Object.keys(UiState).filter(state => {
				switch (state) {
					case 'sipPhoneError':
						return false;
					case 'idle':
						return false;
					case 'externalCard':
						return false;
					default:
						return true;
				}
			}));
		}
		setUiState(params, callback) {
			this.used = true;
			if (!this.isCardActive() || !this.isExternalCall) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			if (params && params.uiState && UiState[params.uiState]) {
				this.CallCard.setUiState(UiState[params.uiState]);
				// BX.onCustomEvent(window, "CallCard::CallStateChanged", [callState, additionalParams]);
				// this.setOnSlave(desktopEvents.setCallState, [callState, additionalParams]);
			} else {
				callback([{
					result: 'error',
					errorCode: 'Invalid ui state'
				}]);
				return;
			}
			if (params.uiState === 'connected') {
				if (params.disableAutoStartTimer) {
					this.CallCard.stopTimer();
					this.hideTimer();
				} else {
					this.showTimer();
				}
			}
			if (params.uiState !== 'connected' && !this.CallCard.isTimerStarted()) {
				this.hideTimer();
			}
			callback([]);
		}
		setMute(params, callback) {
			this.used = true;
			if (!this.isCardActive() || !this.isExternalCall) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			if (this.CallCard.isMuted() === !!params.muted) {
				callback([]);
				return;
			}
			if (params.muted) {
				this.CallCard.setMuted(params.muted);
				BX.addClass(this.CallCard.elements.buttons.mute, 'active');
				if (this.CallCard.isDesktop() && this.CallCard.slave) {
					BX.desktop.onCustomEvent(desktopEvents.onMute, []);
				} else {
					this.CallCard.callbacks.mute();
				}
			} else {
				this.CallCard.setMuted(params.muted);
				BX.removeClass(this.CallCard.elements.buttons.mute, 'active');
				if (this.CallCard.isDesktop() && this.CallCard.slave) {
					BX.desktop.onCustomEvent(desktopEvents.onUnMute, []);
				} else {
					this.CallCard.callbacks.unmute();
				}
			}
			callback([]);
		}
		setHold(params, callback) {
			this.used = true;
			if (!this.isCardActive() || !this.isExternalCall) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			if (this.CallCard.isHeld() === !!params.held) {
				callback([]);
				return;
			}
			if (params.held) {
				this.CallCard.setHeld(params.held);
				BX.addClass(this.CallCard.elements.buttons.hold, 'active');
				if (this.CallCard.isDesktop() && this.CallCard.slave) {
					BX.desktop.onCustomEvent(desktopEvents.onHold, []);
				} else {
					this.CallCard.callbacks.hold();
				}
			} else {
				this.CallCard.setHeld(params.held);
				BX.removeClass(this.CallCard.elements.buttons.hold, 'active');
				if (this.CallCard.isDesktop() && this.CallCard.slave) {
					BX.desktop.onCustomEvent(desktopEvents.onUnHold, []);
				} else {
					this.CallCard.callbacks.unhold();
				}
			}
			callback([]);
		}
		startTimer(params, callback) {
			this.used = true;
			if (!this.isCardActive() || !this.isExternalCall) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			this.showTimer();
			this.CallCard.startTimer();
		}
		stopTimer(params, callback) {
			this.used = true;
			if (!this.isCardActive() || !this.isExternalCall) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			this.CallCard.stopTimer();
		}
		close(params, callback) {
			this.used = true;
			if (!this.isCardActive() || !this.isExternalCall) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			this.CallCard.close();
			callback([]);
			this.CallCard = false;
		}
		setCardTitle(params, callback) {
			this.used = true;
			if (!this.isCardActive() || !this.isExternalCall) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			this.CallCard.setTitle(params.title);
			callback([]);
		}
		setStatusText(params, callback) {
			this.used = true;
			if (!this.isCardActive() || !this.isExternalCall) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			this.CallCard.setStatusText(params.statusText);
			callback([]);
		}
		showTimer() {
			if (!this.CallCard.elements.timer.visible) {
				this.CallCard.sections.timer.visible = true;
				this.CallCard.elements.timer.style.display = '';
				if (this.CallCard.isFolded()) {
					this.CallCard.unfoldedElements.timer.style.display = '';
				}
			}
		}
		hideTimer() {
			if (this.CallCard.sections.timer) {
				this.CallCard.sections.timer.visible = false;
			}
			if (this.CallCard.elements.timer) {
				this.CallCard.elements.timer.style.display = 'none';
			}
			this.CallCard.initialTimestamp = 0;
		}
		getUndefinedCallCardError() {
			return UndefinedCallCard;
		}
	}

	const desktopMethodEvents = {
		setUiState: 'DesktopCallCardSetUiState',
		setMute: 'DesktopCallCardSetMute',
		setHold: 'DesktopCallCardSetHold',
		getListUiState: 'DesktopCallCardGetListUiState',
		setCardTitle: 'DesktopCallCardSetCardTitle',
		setStatusText: 'DesktopCallCardSetStatusText',
		close: 'DesktopCallCardClose',
		startTimer: 'DesktopCallCardStartTimer',
		stopTimer: 'DesktopCallCardStopTimer'
	};
	const corporatePortalPageEvents = {
		addCommentButtonClick: 'DesktopCallCardAddCommentButtonClick',
		muteButtonClick: 'DesktopCallCardMuteButtonClick',
		holdButtonClick: 'DesktopCallCardHoldButtonClick',
		transferButtonClick: 'DesktopCallCardTransferButtonClick',
		cancelTransferButtonClick: 'DesktopCallCardCancelTransferButtonClick',
		completeTransferButtonClick: 'DesktopCallCardCompleteTransferButtonClick',
		hangupButtonClick: 'DesktopCallCardHangupButtonClick',
		nextButtonClick: 'DesktopCallCardNextButtonClick',
		skipButtonClick: 'DesktopCallCardSkipButtonClick',
		answerButtonClick: 'DesktopCallCardAnswerButtonClick',
		entityChanged: 'DesktopCallCardEntityChanged',
		qualityMeterClick: 'DesktopCallCardQualityMeterClick',
		dialpadButtonClick: 'DesktopCallCardDialpadButtonClick',
		makeCallButtonClick: 'DesktopCallCardMakeCallButtonClick',
		notifyAdminButtonClick: 'DesktopCallCardNotifyAdminButtonClick'
	};
	class DesktopWorker extends BaseWorker {
		constructor() {
			super();
			this.eventHandlers = [];
		}
		isCardActive() {
			return super.isCardActive() || this.CallCard !== null;
		}
		initializePlacement() {
			const placement = BX.rest.AppLayout.initializePlacement('PAGE_BACKGROUND_WORKER');
			this.initializeInterfaceMethods(placement);
			this.initializeInterfaceEvents(placement);
			this.addEventHandlersForEventsFromCallCard();
		}
		initializeInterface(placement) {
			this.initializeInterfaceMethods(placement);
			this.addTransmitEventHandlers();
		}
		initializeInterfaceMethods(placement) {
			placement.prototype.CallCardGetListUiStates = (params, callback) => this.getListUiStates(params, callback);
			placement.prototype.CallCardSetMute = (params, callback) => this.transmitSetMute(params, callback);
			placement.prototype.CallCardSetHold = (params, callback) => this.transmitSetHold(params, callback);
			placement.prototype.CallCardSetUiState = (params, callback) => this.transmitSetUiState(params, callback);
			placement.prototype.CallCardSetCardTitle = (params, callback) => this.transmitSetCardTitle(params, callback);
			placement.prototype.CallCardSetStatusText = (params, callback) => this.transmitSetStatusText(params, callback);
			placement.prototype.CallCardClose = (params, callback) => this.transmitClose(params, callback);
			placement.prototype.CallCardStartTimer = (params, callback) => this.transmitStartTimer(params, callback);
			placement.prototype.CallCardStopTimer = (params, callback) => this.transmitStopTimer(params, callback);
		}
		emitInitializeEvent(params) {
			if (!this.isExternalCall) {
				return;
			}
			if (this.isCallCardPage()) {
				BXDesktopSystem.BroadcastEvent('DesktopCallCardInitialized', [params]);
				return;
			}
			BX.onCustomEvent(window, "BackgroundCallCard::initialized", [params]);
		}
		emitEvent(name, params) {
			if (!this.isExternalCall) {
				return;
			}
			if (this.isCallCardPage()) {
				const desktopEventName = 'DesktopCallCard' + (name[0].toUpperCase() + name.slice(1));
				BXDesktopSystem.BroadcastEvent(desktopEventName, [params]);
			}
			BX.onCustomEvent(window, 'BackgroundCallCard::' + name, [params]);
		}
		removeDesktopEventHandlers() {
			for (const event in this.getEvents()) {
				this.removeCustomEvents('DesktopCallCard' + (event[0].toUpperCase() + event.slice(1)));
			}
			this.removeCustomEvents('DesktopCallCardInitialized');
			this.removeCustomEvents('DesktopCallCardCloseButtonClick');
		}
		/*
		 Transmit an event about changing the call card by calling methods
		 from the rest application from the corporate portal window
		 */
		//region Transmit events

		addTransmitEventHandlers() {
			this.addCustomEvent(desktopMethodEvents.getListUiState, (params, callback) => this.onTransmitHandler(params, callback, this.getListUiStates)).addCustomEvent(desktopMethodEvents.setUiState, (params, callback) => this.onTransmitHandler(params, callback, this.getCallCardPlatformWorker().setUiState)).addCustomEvent(desktopMethodEvents.setMute, (params, callback) => this.onTransmitHandler(params, callback, this.getCallCardPlatformWorker().setMute)).addCustomEvent(desktopMethodEvents.setHold, (params, callback) => this.onTransmitHandler(params, callback, this.getCallCardPlatformWorker().setHold)).addCustomEvent(desktopMethodEvents.setCardTitle, (params, callback) => this.onTransmitHandler(params, callback, this.getCallCardPlatformWorker().setCardTitle)).addCustomEvent(desktopMethodEvents.setStatusText, (params, callback) => this.onTransmitHandler(params, callback, this.getCallCardPlatformWorker().setStatusText)).addCustomEvent(desktopMethodEvents.close, (params, callback) => this.onTransmitHandler(params, callback, this.getCallCardPlatformWorker().close)).addCustomEvent(desktopMethodEvents.startTimer, (params, callback) => this.onTransmitHandler(params, callback, this.getCallCardPlatformWorker().startTimer)).addCustomEvent(desktopMethodEvents.stopTimer, (params, callback) => this.onTransmitHandler(params, callback, this.getCallCardPlatformWorker().stopTimer));
		}
		onTransmitHandler(params, callback, handler) {
			if (this.isCorporatePortalPage()) {
				return;
			}
			this.used = true;
			callback = typeof callback === 'function' ? callback : BX.DoNothing;
			handler(params, callback);
		}
		transmitSetUiState(params, callback) {
			if (!this.isCardActive()) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			if (!params.hasOwnProperty('uiState') || !UiState[params.uiState]) {
				callback([{
					result: 'error',
					errorCode: 'Invalid ui state'
				}]);
				return;
			}
			BXDesktopSystem.BroadcastEvent(desktopMethodEvents.setUiState, [params, BX.DoNothing]);
			callback([]);
		}
		transmitSetMute(params, callback) {
			if (!this.isCardActive()) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			if (!params.hasOwnProperty('muted')) {
				callback({
					result: 'error',
					errorCode: 'missing field muted'
				});
				return;
			}
			BXDesktopSystem.BroadcastEvent(desktopMethodEvents.setMute, [params, BX.DoNothing]);
			callback([]);
		}
		transmitSetHold(params, callback) {
			if (!this.isCardActive()) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			if (!params.hasOwnProperty('held')) {
				callback([{
					result: 'error',
					errorCode: 'missing field held'
				}]);
			}
			BXDesktopSystem.BroadcastEvent(desktopMethodEvents.setHold, [params, BX.DoNothing]);
			callback([]);
		}
		transmitStartTimer(params, callback) {
			if (!this.isCardActive()) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			BXDesktopSystem.BroadcastEvent(desktopMethodEvents.startTimer, [params, BX.DoNothing]);
			callback([]);
		}
		transmitStopTimer(params, callback) {
			if (!this.isCardActive()) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			BXDesktopSystem.BroadcastEvent(desktopMethodEvents.stopTimer, [params, BX.DoNothing]);
			callback([]);
		}
		transmitClose(params, callback) {
			if (!this.isCardActive()) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			this.CallCard = null;
			BXDesktopSystem.BroadcastEvent(desktopMethodEvents.close, [params, BX.DoNothing]);
			callback([]);
		}
		transmitSetCardTitle(params, callback) {
			if (!this.isCardActive()) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			if (!params.hasOwnProperty('title')) {
				callback([{
					result: 'error',
					errorCode: 'missing field title'
				}]);
				return;
			}
			BXDesktopSystem.BroadcastEvent(desktopMethodEvents.setCardTitle, [params, BX.DoNothing]);
			callback([]);
		}
		transmitSetStatusText(params, callback) {
			if (!this.isCardActive()) {
				callback([this.getUndefinedCallCardError()]);
				return;
			}
			if (!params.hasOwnProperty('statusText')) {
				callback([{
					result: 'error',
					errorCode: 'missing field statusText'
				}]);
				return;
			}
			BXDesktopSystem.BroadcastEvent(desktopMethodEvents.setStatusText, [params, BX.DoNothing]);
			callback([]);
		}
		//endregion

		addEventHandlersForEventsFromCallCard() {
			if (!this.isCorporatePortalPage()) {
				return;
			}
			for (const event in this.getEvents()) {
				this.addCustomEvent(corporatePortalPageEvents[event], (params, callback) => {
					BX.onCustomEvent(window, 'BackgroundCallCard::' + event, [params, callback]);
				});
			}
			this.addCustomEvent('DesktopCallCardInitialized', (params, callback) => {
				if (!this.CallCard) {
					this.CallCard = true;
				}
				BX.onCustomEvent(window, 'BackgroundCallCard::initialized', [params, callback]);
			});
			this.addCustomEvent('DesktopCallCardCloseButtonClick', (params, callback) => {
				this.CallCard = null;
				BX.onCustomEvent(window, 'BackgroundCallCard::closeButtonClick', [params, callback]);
			});
		}
		addCustomEvent(eventName, eventHandler) {
			const realHandler = function (e) {
				const arEventParams = [];
				for (const i in e.detail) {
					arEventParams.push(e.detail[i]);
				}
				eventHandler.apply(window, arEventParams);
			};
			if (!this.eventHandlers[eventName]) {
				this.eventHandlers[eventName] = [];
			}
			this.eventHandlers[eventName].push(realHandler);
			window.addEventListener(eventName, realHandler);
			return this;
		}
		removeCustomEvents(eventName) {
			if (!this.eventHandlers[eventName]) {
				return false;
			}
			this.eventHandlers[eventName].forEach(eventHandler => window.removeEventListener(eventName, eventHandler));
			this.eventHandlers[eventName] = [];
		}
		isCallCardPage() {
			return BXDesktopWindow.GetWindowId() !== BXDesktopSystem.GetMainWindow().GetWindowId();
		}
		isCorporatePortalPage() {
			return typeof BXDesktopSystem == "undefined" && typeof BXDesktopWindow == "undefined";
		}
		getCallCardWindow() {
			return BXWindows.find(element => element.name === 'callWindow');
		}
		getCallCardPlatformWorker() {
			const callWindow = this.getCallCardWindow();
			return callWindow.PCW.backgroundWorker.platformWorker;
		}
	}

	class BrowserWorker extends BaseWorker {
		initializePlacement() {
			const placement = BX.rest.AppLayout.initializePlacement('PAGE_BACKGROUND_WORKER');
			this.initializeInterface(placement);
			this.initializeInterfaceEvents(placement);
		}
		initializeInterface(placement) {
			placement.prototype.CallCardSetMute = (params, callback) => this.setMute(params, callback);
			placement.prototype.CallCardSetHold = (params, callback) => this.setHold(params, callback);
			placement.prototype.CallCardSetUiState = (params, callback) => this.setUiState(params, callback);
			placement.prototype.CallCardGetListUiStates = (params, callback) => this.getListUiStates(params, callback);
			placement.prototype.CallCardSetCardTitle = (params, callback) => this.setCardTitle(params, callback);
			placement.prototype.CallCardSetStatusText = (params, callback) => this.setStatusText(params, callback);
			placement.prototype.CallCardClose = (params, callback) => this.close(params, callback);
			placement.prototype.CallCardStartTimer = (params, callback) => this.startTimer(params, callback);
			placement.prototype.CallCardStopTimer = (params, callback) => this.stopTimer(params, callback);
		}
		emitEvent(name, params) {
			if (!this.isExternalCall) {
				return;
			}
			BX.onCustomEvent(window, 'BackgroundCallCard::' + name, [params]);
		}
		emitInitializeEvent(params) {
			if (!this.isExternalCall) {
				return;
			}
			BX.onCustomEvent(window, "BackgroundCallCard::initialized", [params]);
		}
	}

	const backgroundWorkerEvents = callCardEvents;
	class BackgroundWorker {
		constructor() {
			this.initializePlacement();
		}
		setCallCard(callCard) {
			this.platformWorker.CallCard = callCard;
		}
		initializePlacement() {
			if (this.isDesktop()) {
				this.platformWorker = new DesktopWorker();
			} else {
				this.platformWorker = new BrowserWorker();
			}
			this.platformWorker.initializePlacement();
		}
		emitEvent(name, params) {
			this.platformWorker.emitEvent(name, params);
		}
		removeDesktopEventHandlers() {
			this.platformWorker.removeDesktopEventHandlers();
		}
		isDesktop() {
			return typeof BXDesktopSystem !== 'undefined';
		}
		isUsed() {
			return this.platformWorker.isUsed();
		}
		isActiveIntoCurrentCall() {
			return this.isExternalCall && this.isUsed();
		}
		setExternalCall(isExternalCall) {
			this.platformWorker.setIsExternalCall(isExternalCall);
		}
	}

	const nop = function () {};
	class FormManager {
		constructor(params) {
			this.node = params.node;
			this.currentForm = null;
			this.callbacks = {
				onFormLoad: main_core.Type.isFunction(params.onFormLoad) ? params.onFormLoad : nop,
				onFormUnLoad: main_core.Type.isFunction(params.onFormUnLoad) ? params.onFormUnLoad : nop,
				onFormSend: main_core.Type.isFunction(params.onFormSend) ? params.onFormSend : nop
			};
		}

		/**
		 * @param {object} params
		 * @param {int} params.id
		 * @param {string} params.secCode
		 */
		load(params) {
			let formData = this.getFormData(params);
			window.Bitrix24FormLoader.load(formData);
			this.currentForm = formData;
		}
		unload() {
			if (this.currentForm) {
				window.Bitrix24FormLoader.unload(this.currentForm);
				this.currentForm = null;
			}
		}
		/**
		 * @param {object} params
		 * @param {int} params.id
		 * @param {string} params.secCode
		 * @returns {object}
		 */
		getFormData(params) {
			return {
				id: params.id,
				sec: params.secCode,
				type: 'inline',
				lang: 'ru',
				ref: window.location.href,
				node: this.node,
				handlers: {
					'load': this._onFormLoad.bind(this),
					'unload': this._onFormUnLoad.bind(this),
					'send': this.onFormSend.bind(this)
				},
				options: {
					'borders': false,
					'logo': false
				}
			};
		}
		_onFormLoad(form) {
			this.callbacks.onFormLoad(form);
		}
		_onFormUnLoad(form) {
			this.callbacks.onFormUnLoad(form);
		}
		onFormSend(form) {
			this.callbacks.onFormSend(form);
		}
	}

	class CallList {
		constructor(params) {
			this.node = params.node;
			this.id = params.id;
			this.isDesktop = params.isDesktop;
			this.entityType = '';
			this.statuses = new Map(); // {STATUS_ID (string): { STATUS_NAME; string, CLASS: string, ITEMS: []}
			this.elements = {};
			this.currentStatusId = params.callListStatusId || 'IN_WORK';
			this.currentItemIndex = params.itemIndex || 0;
			this.callingStatusId = null;
			this.callingItemIndex = null;
			this.selectionLocked = false;

			// this.itemActionMenu = null;
			this.callbacks = {
				onError: main_core.Type.isFunction(params.onError) ? params.onError : nop$1,
				onSelectedItem: main_core.Type.isFunction(params.onSelectedItem) ? params.onSelectedItem : nop$1
			};
			this.showLimit = 10;
			this.showDelta = 10;
		}
		init(next) {
			if (!main_core.Type.isFunction(next)) {
				next = nop$1;
			}
			this.load(() => {
				const currentStatus = this.statuses.get(this.currentStatusId);
				if (currentStatus && currentStatus.ITEMS.length > 0) {
					this.update();
					this.selectItem(this.currentStatusId, this.currentItemIndex);
					next();
				} else {
					BX.debug('empty call list. don\'t know what to do');
				}
			});
		}
		/**
		 * @param {object} params
		 * @param {Node} params.node DOM node to render call list.
		 */
		reinit(params) {
			if (main_core.Type.isDomNode(params.node)) {
				this.node = params.node;
			}
			this.update();
			this.selectItem(this.currentStatusId, this.currentItemIndex);
			if (this.callingStatusId !== null && this.callingItemIndex !== null) {
				this.setCallingElement(this.callingStatusId, this.callingItemIndex);
			}
		}
		load(next) {
			const params = {
				'sessid': BX.bitrix_sessid(),
				'ajax_action': 'GET_CALL_LIST',
				'callListId': this.id
			};
			BX.ajax({
				url: CallList.getAjaxUrl(),
				method: 'POST',
				dataType: 'json',
				data: params,
				onsuccess: data => {
					if (!data.ERROR) {
						if (main_core.Type.isArray(data.STATUSES)) {
							//this.statuses = data.STATUSES;
							data.STATUSES.forEach(statusRecord => {
								statusRecord.ITEMS = [];
								this.statuses.set(statusRecord.STATUS_ID, statusRecord);
							});
							data.ITEMS.forEach(item => {
								let itemStatus = this.statuses.get(item.STATUS_ID);
								if (itemStatus) {
									itemStatus.ITEMS.push(item);
								}
							});
						}
						this.entityType = data.ENTITY_TYPE;
						let currentStatus = this.statuses.get(this.currentStatusId);
						if (currentStatus && currentStatus.ITEMS.length === 0) {
							this.currentStatusId = this.getNonEmptyStatusId();
							this.currentItemIndex = 0;
						}
						next();
					} else {
						console.log(data);
					}
				}
			});
		}
		selectItem(statusId, newIndex) {
			let currentNode = this.statuses.get(this.currentStatusId).ITEMS[this.currentItemIndex]._node;
			BX.removeClass(currentNode, 'im-phone-call-list-customer-block-active');
			if (this.itemActionMenu) {
				this.itemActionMenu.close();
			}
			this.currentStatusId = statusId;
			this.currentItemIndex = newIndex;
			currentNode = this.statuses.get(this.currentStatusId).ITEMS[this.currentItemIndex]._node;
			BX.addClass(currentNode, 'im-phone-call-list-customer-block-active');
			const newEntity = this.statuses.get(statusId).ITEMS[newIndex];
			if ((this.entityType == 'DEAL' || this.entityType == 'QUOTE' || this.entityType == 'INVOICE') && newEntity.ASSOCIATED_ENTITY) {
				this.callbacks.onSelectedItem({
					type: newEntity.ASSOCIATED_ENTITY.TYPE,
					id: newEntity.ASSOCIATED_ENTITY.ID,
					bindings: [{
						type: this.entityType,
						id: newEntity.ELEMENT_ID
					}],
					phones: newEntity.ASSOCIATED_ENTITY.PHONES,
					statusId: statusId,
					index: newIndex
				});
			} else {
				this.callbacks.onSelectedItem({
					type: this.entityType,
					id: newEntity.ELEMENT_ID,
					phones: newEntity.PHONES,
					statusId: statusId,
					index: newIndex
				});
			}
		}
		moveToNextItem() {
			var newIndex = this.currentItemIndex + 1;
			if (newIndex >= this.statuses.get(this.currentStatusId).ITEMS.length) {
				newIndex = 0;
			}
			this.selectItem(this.currentStatusId, newIndex);
		}
		setCallingElement(statusId, index) {
			this.callingStatusId = statusId;
			this.callingItemIndex = index;
			const currentNode = this.statuses.get(this.callingStatusId).ITEMS[this.callingItemIndex]._node;
			BX.addClass(currentNode, 'im-phone-call-list-customer-block-calling');
			this.selectionLocked = true;
		}
		resetCallingElement() {
			if (this.callingStatusId === null || this.callingItemIndex === null) {
				return;
			}
			const currentNode = this.statuses.get(this.callingStatusId).ITEMS[this.callingItemIndex]._node;
			BX.removeClass(currentNode, 'im-phone-call-list-customer-block-calling');
			this.callingStatusId = null;
			this.callingItemIndex = null;
			this.selectionLocked = false;
		}
		update() {
			main_core.Dom.clean(this.node);
			this.node.append(this.render());
		}
		render() {
			return main_core.Dom.create("div", {
				props: {
					className: 'im-phone-call-list-container'
				},
				children: this.renderStatusBlocks()
			});
		}
		renderStatusBlocks() {
			let result = [];
			for (let [statusId, status] of this.statuses) {
				if (!status || status.ITEMS.length === 0) {
					continue;
				}
				status._node = this.renderStatusBlock(status);
				result.push(status._node);
			}
			return result;
		}
		renderCallListItems(statusId) {
			let result = [];
			const status = this.statuses.get(statusId);
			if (status._shownCount > 0) {
				if (status._shownCount > status.ITEMS.length) {
					status._shownCount = status.ITEMS.length;
				}
			} else {
				status._shownCount = Math.min(this.showLimit, status.ITEMS.length);
			}
			for (let i = 0; i < status._shownCount; i++) {
				result.push(this.renderCallListItem(status.ITEMS[i], statusId, i));
			}
			if (status.ITEMS.length > status._shownCount) {
				status._showMoreNode = main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-list-show-more-wrap'
					},
					children: [main_core.Dom.create("span", {
						props: {
							className: 'im-phone-call-list-show-more-button'
						},
						dataset: {
							statusId: statusId
						},
						text: main_core.Loc.getMessage('IM_PHONE_CALL_LIST_MORE').replace('#COUNT#', status.ITEMS.length - status._shownCount),
						events: {
							click: this.onShowMoreClick.bind(this)
						}
					})]
				});
				result.push(status._showMoreNode);
			} else {
				status._showMoreNode = null;
			}
			return result;
		}
		renderCallListItem(itemDescriptor, statusId, itemIndex) {
			const statusName = this.statuses.get(statusId).NAME;
			let phonesText = '';
			if (main_core.Type.isArray(itemDescriptor.PHONES)) {
				itemDescriptor.PHONES.forEach((phone, index) => {
					if (index !== 0) {
						phonesText += '; ';
					}
					phonesText += main_core.Text.encode(phone.VALUE);
				});
			}
			itemDescriptor._node = main_core.Dom.create("div", {
				props: {
					className: this.currentStatusId == statusId && this.currentItemIndex == itemIndex ? 'im-phone-call-list-customer-block im-phone-call-list-customer-block-active' : 'im-phone-call-list-customer-block'
				},
				children: [main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-list-customer-block-action'
					},
					children: [main_core.Dom.create("span", {
						text: statusName
					})],
					events: {
						click: e => {
							e.preventDefault();
							if (this.itemActionMenu) {
								this.itemActionMenu.close();
							} else {
								this.showItemMenu(itemDescriptor, e.target);
							}
						}
					}
				}), main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-list-item-customer-name' + (itemDescriptor.ASSOCIATED_ENTITY ? ' im-phone-call-list-connection-line' : '')
					},
					children: [main_core.Dom.create("a", {
						attrs: {
							href: itemDescriptor.EDIT_URL,
							target: '_blank'
						},
						props: {
							className: 'im-phone-call-list-item-customer-link'
						},
						text: itemDescriptor.NAME,
						events: {
							click: e => {
								e.preventDefault();
								window.open(itemDescriptor.EDIT_URL);
							}
						}
					})]
				}), itemDescriptor.POST ? main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-list-item-customer-info'
					},
					text: itemDescriptor.POST
				}) : null, itemDescriptor.COMPANY_TITLE ? main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-list-item-customer-info'
					},
					text: itemDescriptor.COMPANY_TITLE
				}) : null, phonesText ? main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-list-item-customer-info'
					},
					text: phonesText
				}) : null, itemDescriptor.ASSOCIATED_ENTITY ? this.renderAssociatedEntity(itemDescriptor.ASSOCIATED_ENTITY) : null],
				events: {
					click: () => {
						if (!this.selectionLocked && (this.currentStatusId != itemDescriptor.STATUS_ID || this.currentItemIndex != itemIndex)) {
							this.selectItem(itemDescriptor.STATUS_ID, itemIndex);
						}
					}
				}
			});
			return itemDescriptor._node;
		}
		renderAssociatedEntity(associatedEntity) {
			let phonesText = '';
			if (main_core.Type.isArray(associatedEntity.PHONES)) {
				associatedEntity.PHONES.forEach((phone, index) => {
					if (index !== 0) {
						phonesText += '; ';
					}
					phonesText += main_core.Text.encode(phone.VALUE);
				});
			}
			return main_core.Dom.create("div", {
				props: {
					className: 'im-phone-call-list-item-customer-entity im-phone-call-list-connection-line-item'
				},
				children: [main_core.Dom.create("a", {
					attrs: {
						href: associatedEntity.EDIT_URL,
						target: '_blank'
					},
					props: {
						className: 'im-phone-call-list-item-customer-link'
					},
					text: associatedEntity.NAME,
					events: {
						click: e => {
							e.preventDefault();
							window.open(associatedEntity.EDIT_URL);
						}
					}
				}), main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-list-item-customer-info'
					},
					text: associatedEntity.POST
				}), main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-list-item-customer-info'
					},
					text: associatedEntity.COMPANY_TITLE
				}), phonesText ? main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-list-item-customer-info'
					},
					text: phonesText
				}) : null]
			});
		}
		onShowMoreClick(e) {
			var statusId = e.target.dataset.statusId;
			var status = this.statuses.get(statusId);
			status._shownCount += this.showDelta;
			if (status._shownCount > status.ITEMS.length) {
				status._shownCount = status.ITEMS.length;
			}
			const newStatusNode = this.renderStatusBlock(status);
			status._node.parentNode.replaceChild(newStatusNode, status._node);
			status._node = newStatusNode;
		}
		showItemMenu(callListItem, node) {
			let menuItems = [];
			let menuItem;
			for (let [statusId, status] of this.statuses) {
				menuItem = {
					id: "setStatus_" + statusId,
					text: status.NAME,
					onclick: this.actionMenuItemClickHandler(callListItem.ELEMENT_ID, statusId).bind(this)
				};
				menuItems.push(menuItem);
			}
			menuItems.push({
				id: 'callListItemActionMenu_delimiter',
				delimiter: true
			});
			menuItems.push({
				id: "defer15min",
				text: main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_CALL_LIST_DEFER_15_MIN'),
				onclick: () => {
					this.itemActionMenu.close();
					this.setElementRank(callListItem.ELEMENT_ID, callListItem.RANK + 35);
				}
			});
			menuItems.push({
				id: "defer1hour",
				text: main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_CALL_LIST_DEFER_HOUR'),
				onclick: () => {
					this.itemActionMenu.close();
					this.setElementRank(callListItem.ELEMENT_ID, callListItem.RANK + 185);
				}
			});
			menuItems.push({
				id: "moveToEnd",
				text: main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_CALL_LIST_TO_END'),
				onclick: () => {
					this.itemActionMenu.close();
					this.setElementRank(callListItem.ELEMENT_ID, callListItem.RANK + 5100);
				}
			});
			this.itemActionMenu = new main_popup.Menu('callListItemActionMenu', node, menuItems, {
				autoHide: true,
				offsetTop: 0,
				offsetLeft: 0,
				angle: {
					position: "top"
				},
				zIndex: baseZIndex + 200,
				events: {
					onPopupClose: () => this.itemActionMenu.destroy(),
					onPopupDestroy: () => this.itemActionMenu = null
				}
			});
			this.itemActionMenu.show();
		}
		actionMenuItemClickHandler(elementId, statusId) {
			return () => {
				this.itemActionMenu.close();
				this.setElementStatus(elementId, statusId);
			};
		}
		setElementRank(elementId, rank) {
			this.executeItemAction({
				action: 'SET_ELEMENT_RANK',
				parameters: {
					callListId: this.id,
					elementId: elementId,
					rank: rank
				},
				successCallback: data => {
					if (data.ITEMS) {
						this.repopulateItems(data.ITEMS);
						this.update();
					}
				}
			});
		}
		setElementStatus(elementId, statusId) {
			this.executeItemAction({
				action: 'SET_ELEMENT_STATUS',
				parameters: {
					callListId: this.id,
					elementId: elementId,
					statusId: statusId
				},
				successCallback: data => {
					this.repopulateItems(data.ITEMS);
					this.update();
				}
			});
		}
		/**
		 * @param {int} elementId
		 * @param {int} webformResultId
		 */
		setWebformResult(elementId, webformResultId) {
			this.executeItemAction({
				action: 'SET_WEBFORM_RESULT',
				parameters: {
					callListId: this.id,
					elementId: elementId,
					webformResultId: webformResultId
				}
			});
		}
		executeItemAction(params) {
			if (!main_core.Type.isPlainObject(params)) {
				params = {};
			}
			if (!main_core.Type.isFunction(params.successCallback)) {
				params.successCallback = nop$1;
			}
			var requestParams = {
				'sessid': BX.bitrix_sessid(),
				'ajax_action': params.action,
				'parameters': params.parameters
			};
			BX.ajax({
				url: CallList.getAjaxUrl(),
				method: 'POST',
				dataType: 'json',
				data: requestParams,
				onsuccess: data => params.successCallback(data)
			});
		}
		repopulateItems(items) {
			for (let [statusId, status] of this.statuses) {
				status.ITEMS = [];
			}
			items.forEach(item => this.statuses.get(item.STATUS_ID).ITEMS.push(item));
			if (this.statuses.get(this.currentStatusId).ITEMS.length === 0) {
				this.currentStatusId = this.getNonEmptyStatusId();
				this.currentItemIndex = 0;
			} else {
				if (this.currentItemIndex >= this.statuses.get(this.currentStatusId).ITEMS.length) {
					this.currentItemIndex = 0;
				}
			}
			this.selectItem(this.currentStatusId, this.currentItemIndex);
		}
		getNonEmptyStatusId() {
			let foundStatusId = false;
			for (let [statusId, status] of this.statuses) {
				if (status.ITEMS.length > 0) {
					foundStatusId = statusId;
					break;
				}
			}
			return foundStatusId;
		}
		getCurrentElement() {
			return this.statuses.get(this.currentStatusId).ITEMS[this.currentItemIndex];
		}
		getStatusTitle(statusId) {
			const count = this.statuses.get(statusId).ITEMS.length;
			return main_core.Text.encode(this.statuses.get(statusId).NAME) + ' (' + count.toString() + ')';
		}
		renderStatusBlock(status) {
			let animationTimeout;
			let itemsNode;
			let measuringNode;
			const statusId = status.STATUS_ID;
			if (!status.hasOwnProperty('_folded')) {
				status._folded = false;
			}
			let className = 'im-phone-call-list-block';
			if (status.CLASS != '') {
				className = className + ' ' + status.CLASS;
			}
			return main_core.Dom.create("div", {
				props: {
					className: className
				},
				children: [main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-list-block-title' + (status._folded ? '' : ' active')
					},
					children: [main_core.Dom.create("span", {
						text: this.getStatusTitle(statusId)
					}), main_core.Dom.create("div", {
						props: {
							className: 'im-phone-call-list-block-title-arrow'
						}
					})],
					events: {
						click: e => {
							e.preventDefault();
							clearTimeout(animationTimeout);
							status._folded = !status._folded;
							if (status._folded) {
								BX.removeClass(e.target, 'active');
								itemsNode.style.height = measuringNode.clientHeight.toString() + 'px';
								animationTimeout = setTimeout(function () {
									itemsNode.style.height = 0;
								}, 50);
							} else {
								BX.addClass(e.target, 'active');
								itemsNode.style.height = 0;
								animationTimeout = setTimeout(function () {
									itemsNode.style.height = measuringNode.clientHeight + 'px';
								}, 50);
							}
						}
					}
				}), itemsNode = main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-list-items-block'
					},
					children: [measuringNode = main_core.Dom.create("div", {
						props: {
							className: 'im-phone-call-list-items-measuring'
						},
						children: this.renderCallListItems(statusId)
					})],
					events: {
						transitionend: () => {
							if (!status._folded) {
								itemsNode.style.removeProperty('height');
							}
						}
					}
				})]
			});
		}
		static getAjaxUrl() {
			return this.isDesktop ? '/desktop_app/call_list.ajax.php' : '/bitrix/components/bitrix/crm.activity.call_list/ajax.php';
		}
	}

	let avatars = {};
	const Events$1 = {
		onUnfold: "onUnfold"
	};
	class FoldedCallView extends main_core_events.EventEmitter {
		constructor(params) {
			super();
			this.setEventNamespace("BX.VoxImplant.FoldedCallView");
			this.subscribeFromOptions(params.events);
			this.currentItem = {};
			this.callListParams = {
				id: 0,
				webformId: 0,
				webformSecCode: '',
				itemIndex: 0,
				itemStatusId: '',
				statusList: {},
				entityType: ''
			};
			this.node = null;
			this.elements = {
				avatar: null,
				callButton: null,
				nextButton: null,
				unfoldButton: null
			};
			this._lsKey = 'bx-im-folded-call-view-data';
			this._lsTtl = 86400;
			this.init();
		}
		init() {
			this.load();
			if (this.callListParams.id > 0) {
				this.currentItem = this.callListParams.statusList[this.callListParams.itemStatusId].ITEMS[this.callListParams.itemIndex];
				this.render();
			}
		}
		load() {
			var savedData = BX.localStorage.get(this._lsKey);
			if (main_core.Type.isPlainObject(savedData)) {
				this.callListParams = savedData;
			}
		}
		destroy() {
			if (this.node) {
				main_core.Dom.remove(this.node);
				this.node = null;
			}
			BX.localStorage.remove(this._lsKey);
		}
		store() {
			BX.localStorage.set(this._lsKey, this.callListParams, this._lsTtl);
		}
		fold(params, animation) {
			animation = animation === true;
			this.callListParams.id = params.callListId;
			this.callListParams.webformId = params.webformId;
			this.callListParams.webformSecCode = params.webformSecCode;
			this.callListParams.itemIndex = params.currentItemIndex;
			this.callListParams.itemStatusId = params.currentItemStatusId;
			this.callListParams.statusList = Object.fromEntries(params.statusList);
			this.callListParams.entityType = params.entityType;
			this.currentItem = this.callListParams.statusList[this.callListParams.itemStatusId].ITEMS[this.callListParams.itemIndex];
			this.store();
			this.render(animation);
		}
		unfold(makeCall) {
			main_core.Dom.addClass(this.node, "im-phone-folded-call-view-unfold");
			this.node.addEventListener('animationend', () => {
				if (this.node) {
					main_core.Dom.remove(this.node);
					this.node = null;
				}
				BX.localStorage.remove(this._lsKey);
				if (this.callListParams.id === 0) {
					return false;
				}
				let restoredParams = {};
				if (this.callListParams.webformId > 0 && this.callListParams.webformSecCode !== '') {
					restoredParams.webformId = this.callListParams.webformId;
					restoredParams.webformSecCode = this.callListParams.webformSecCode;
				}
				restoredParams.callListStatusId = this.callListParams.itemStatusId;
				restoredParams.callListItemIndex = this.callListParams.itemIndex;
				restoredParams.makeCall = makeCall;
				this.emit(Events$1.onUnfold, {
					callListId: this.callListParams.id,
					callListParams: restoredParams
				});
			});
		}
		moveToNext() {
			this.callListParams.itemIndex++;
			if (this.callListParams.itemIndex >= this.callListParams.statusList[this.callListParams.itemStatusId].ITEMS.length) {
				this.callListParams.itemIndex = 0;
			}
			this.currentItem = this.callListParams.statusList[this.callListParams.itemStatusId].ITEMS[this.callListParams.itemIndex];
			this.store();
			this.render();
		}
		render(animation) {
			animation = animation === true;
			if (this.node === null) {
				this.node = main_core.Dom.create("div", {
					props: {
						id: 'im-phone-folded-call-view',
						className: 'im-phone-call-wrapper im-phone-call-wrapper-fixed im-phone-call-panel'
					},
					events: {
						dblclick: this._onViewDblClick.bind(this)
					}
				});
				document.body.appendChild(this.node);
			} else {
				main_core.Dom.clean(this.node);
			}
			this.node.appendChild(main_core.Dom.create("div", {
				props: {
					className: 'im-phone-call-wrapper-fixed-left'
				},
				style: animation ? {
					bottom: '-90px'
				} : {},
				children: [main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-wrapper-fixed-user'
					},
					children: [main_core.Dom.create("div", {
						props: {
							className: 'im-phone-call-wrapper-fixed-user-image'
						},
						children: [this.elements.avatar = main_core.Dom.create("div", {
							props: {
								className: 'im-phone-call-wrapper-fixed-user-image-item'
							}
						})]
					}), main_core.Dom.create("div", {
						props: {
							className: 'im-phone-call-wrapper-fixed-user-info'
						},
						children: this.renderUserInfo()
					})]
				})]
			}));
			this.node.appendChild(main_core.Dom.create("div", {
				props: {
					className: 'im-phone-call-wrapper-fixed-right'
				},
				children: [main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-wrapper-fixed-btn-container'
					},
					children: [this.elements.callButton = main_core.Dom.create("span", {
						props: {
							className: 'im-phone-call-btn im-phone-call-btn-green'
						},
						text: main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_FOLDED_BUTTON_CALL'),
						events: {
							click: this._onDialButtonClick.bind(this)
						}
					}), this.elements.nextButton = main_core.Dom.create("span", {
						props: {
							className: 'im-phone-call-btn im-phone-call-btn-gray im-phone-call-btn-arrow'
						},
						text: main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_FOLDED_BUTTON_NEXT'),
						events: {
							click: this._onNextButtonClick.bind(this)
						}
					})]
				})]
			}));
			this.node.appendChild(main_core.Dom.create("div", {
				props: {
					className: 'im-phone-btn-block'
				},
				children: [this.elements.unfoldButton = main_core.Dom.create("div", {
					props: {
						className: 'im-phone-btn-arrow'
					},
					children: [main_core.Dom.create("div", {
						props: {
							className: 'im-phone-btn-arrow-inner'
						},
						text: main_core.Loc.getMessage("IM_PHONE_CALL_VIEW_UNFOLD")
					})],
					events: {
						click: this._onUnfoldButtonClick.bind(this)
					}
				})]
			}));
			if (avatars[this.currentItem.ELEMENT_ID]) {
				this.elements.avatar.style.backgroundImage = 'url(\'' + main_core.Text.encode(avatars[this.currentItem.ELEMENT_ID]) + '\')';
			} else {
				this.loadAvatar(this.callListParams.entityType, this.currentItem.ELEMENT_ID);
			}
			if (animation) {
				main_core.Dom.addClass(this.node, 'im-phone-folded-call-view-fold');
				this.node.addEventListener('animationend', function () {
					BX.removeClass(this.node, 'im-phone-folded-call-view-fold');
				});
			}
		}
		renderUserInfo() {
			var result = [];
			result.push(main_core.Dom.create("div", {
				props: {
					className: 'im-phone-call-wrapper-fixed-user-name'
				},
				text: this.currentItem.NAME
			}));
			if (this.currentItem.POST) {
				result.push(main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-wrapper-fixed-user-item'
					},
					text: this.currentItem.POST
				}));
			}
			if (this.currentItem.COMPANY_TITLE) {
				result.push(main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-wrapper-fixed-user-item'
					},
					text: this.currentItem.COMPANY_TITLE
				}));
			}
			return result;
		}
		loadAvatar(entityType, entityId) {
			BX.ajax({
				url: CallList.getAjaxUrl(),
				method: 'POST',
				dataType: 'json',
				data: {
					'sessid': BX.bitrix_sessid(),
					'ajax_action': 'GET_AVATAR',
					'entityType': entityType,
					'entityId': entityId
				},
				onsuccess: data => {
					if (!data.avatar) {
						return;
					}
					avatars[entityId] = data.avatar;
					if (this.currentItem.ELEMENT_ID == entityId && this.elements.avatar) {
						this.elements.avatar.style.backgroundImage = 'url(\'' + main_core.Text.encode(data.avatar) + '\')';
					}
				}
			});
		}
		_onViewDblClick(e) {
			e.preventDefault();
			this.unfold(false);
		}
		_onDialButtonClick(e) {
			e.preventDefault();
			this.unfold(true);
		}
		_onNextButtonClick(e) {
			e.preventDefault();
			this.moveToNext();
		}
		_onUnfoldButtonClick(e) {
			e.preventDefault();
			this.unfold(false);
		}
		static Events = Events$1;
	}

	const desktopFeatureMap = {
		'iframe': 39
	};
	class Desktop {
		constructor(params) {
			this.parentPhoneCallView = params.parentPhoneCallView;
			this.closable = params.closable;
			this.title = params.title || '';
			this.window = null;
		}
		openCallWindow(content, js, params) {
			params = params || {};
			if (params.minSettingsWidth) {
				this.minSettingsWidth = params.minSettingsWidth;
			}
			if (params.minSettingsHeight) {
				this.minSettingsHeight = params.minSettingsHeight;
			}
			params.resizable = params.resizable === true;
			im_v2_lib_desktopApi.DesktopApi.createWindow("callWindow", callWindow => {
				callWindow.SetProperty("clientSize", {
					Width: params.width,
					Height: params.height
				});
				callWindow.SetProperty("resizable", params.resizable);
				if (params.resizable && params.hasOwnProperty('minWidth') && params.hasOwnProperty('minHeight')) {
					callWindow.SetProperty("minClientSize", {
						Width: params.minWidth,
						Height: params.minHeight
					});
				}
				callWindow.SetProperty("title", this.title);
				callWindow.SetProperty("closable", true);

				//callWindow.OpenDeveloperTools();
				let html = this.#getHtmlPage(content, js, {});
				callWindow.ExecuteCommand("html.load", html);
				this.window = callWindow;
			});
		}
		setClosable(closable) {
			this.closable = closable === true;
			if (this.window) {
				this.window.SetProperty("closable", this.closable);
			}
		}
		setTitle(title) {
			this.title = title;
			if (this.window) {
				this.window.SetProperty("title", title);
			}
		}
		#getHtmlPage(content, jsContent, initImJs, bodyClass) {
			content = content || '';
			jsContent = jsContent || '';
			bodyClass = bodyClass || '';
			if (this.htmlWrapperHead == null) {
				this.htmlWrapperHead = document.head.outerHTML.replace(/BX\.PULL\.start\([^)]*\);/g, '');
			}
			if (main_core.Type.isDomNode(content)) {
				content = content.outerHTML;
			}
			if (main_core.Type.isDomNode(jsContent)) {
				jsContent = jsContent.outerHTML;
			}
			if (main_core.Type.isStringFilled(jsContent)) {
				jsContent = `<script>
					BX.ready(function() {
						${jsContent}
					});
				</script>`;
			}
			let initJs = '';
			if (initImJs) {
				initJs = `
				<script>
					BX.ready(function() {
							const backgroundWorker = new BX.Voximplant.BackgroundWorker();
							
							window.PCW = new BX.Voximplant.PhoneCallView({
								isDesktop: true,
								slave: true, 
								skipOnResize: true, 
								callId: '${this.parentPhoneCallView.callId}',
								uiState: ${this.parentPhoneCallView._uiState},
								phoneNumber: '${this.parentPhoneCallView.phoneNumber}',
								companyPhoneNumber: '${this.parentPhoneCallView.companyPhoneNumber}',
								direction: '${this.parentPhoneCallView.direction}',
								fromUserId: '${this.parentPhoneCallView.fromUserId}',
								toUserId: '${this.parentPhoneCallView.toUserId}',
								crm: ${this.parentPhoneCallView.crm},
								hasSipPhone: ${this.parentPhoneCallView.hasSipPhone},
								deviceCall: ${this.parentPhoneCallView.deviceCall},
								transfer: ${this.parentPhoneCallView.transfer},
								crmEntityType: '${this.parentPhoneCallView.crmEntityType}',
								crmEntityId: '${this.parentPhoneCallView.crmEntityId}',
								crmActivityId: '${this.parentPhoneCallView.crmActivityId}',
								crmActivityEditUrl: '${this.parentPhoneCallView.crmActivityEditUrl}',
								callListId: ${this.parentPhoneCallView.callListId},
								callListStatusId: '${this.parentPhoneCallView.callListStatusId}',
								callListItemIndex: ${this.parentPhoneCallView.callListItemIndex},
								config: ${this.parentPhoneCallView.config ? JSON.stringify(this.parentPhoneCallView.config) : '{}'},
								portalCall: ${this.parentPhoneCallView.portalCall ? 'true' : 'false'},
								portalCallData: ${this.parentPhoneCallView.portalCallData ? JSON.stringify(this.parentPhoneCallView.portalCallData) : '{}'},
								portalCallUserId: ${this.parentPhoneCallView.portalCallUserId},
								webformId: ${this.parentPhoneCallView.webformId},
								webformSecCode: '${this.parentPhoneCallView.webformSecCode}',
								backgroundWorker: backgroundWorker,
								restApps: ${this.parentPhoneCallView.restApps ? JSON.stringify(this.parentPhoneCallView.restApps) : '[]'},
							});
					});
				</script>`;
			}
			return `
			<!DOCTYPE html>
			<html lang="${document.documentElement.lang}">
				${this.htmlWrapperHead}
				<body class="im-desktop im-desktop-popup ${bodyClass}">
					<div id="placeholder-messanger">${content}</div>
					${initJs}
					${jsContent}
				</body>
			</html>
		`;
		}
		addCustomEvent(eventName, eventHandler) {
			BX.desktop.addCustomEvent(eventName, eventHandler);
		}
		onCustomEvent(windowTarget, eventName, arEventParams) {
			BX.desktop.onCustomEvent(windowTarget, eventName, arEventParams);
		}
		resize(width, height) {
			BXDesktopWindow.SetProperty("clientSize", {
				Width: width,
				Height: height
			});
		}
		setResizable(resizable) {
			resizable = resizable === true;
			BXDesktopWindow.SetProperty("resizable", resizable);
		}
		setMinSize(width, height) {
			BXDesktopWindow.SetProperty("minClientSize", {
				Width: width,
				Height: height
			});
		}
		setWindowPosition(params) {
			BXDesktopWindow.SetProperty("position", params);
		}
		center() {
			BXDesktopWindow.ExecuteCommand("center");
		}
		getVersion(full) {
			if (typeof BXDesktopSystem == 'undefined') {
				return 0;
			}
			if (!this.clientVersion) {
				this.clientVersion = BXDesktopSystem.GetProperty('versionParts');
			}
			return full ? this.clientVersion.join('.') : this.clientVersion[3];
		}
		isFeatureSupported(featureName) {
			if (!desktopFeatureMap.hasOwnProperty(featureName)) {
				return false;
			}
			return this.getVersion() >= desktopFeatureMap[featureName];
		}
	}

	/**
	 * @bxjs_lang_path js_phone_call_view.php
	 */

	const Direction = {
		incoming: 'incoming',
		outgoing: 'outgoing',
		callback: 'callback'
	};
	const UiState = {
		incoming: 1,
		transferIncoming: 2,
		outgoing: 3,
		connectingIncoming: 4,
		connectingOutgoing: 5,
		connected: 6,
		transferring: 7,
		transferFailed: 8,
		transferConnected: 9,
		idle: 10,
		error: 11,
		moneyError: 12,
		sipPhoneError: 13,
		redial: 14,
		externalCard: 15
	};
	const CallState = {
		idle: 'idle',
		connecting: 'connecting',
		connected: 'connected'
	};
	const CallProgress = {
		connect: 'connect',
		error: 'error',
		offline: 'offline',
		online: 'online',
		wait: 'wait'
	};
	const ButtonLayouts = {
		centered: 'centered',
		spaced: 'spaced'
	};

	/* Phone Call UI */
	const layouts = {
		simple: 'simple',
		crm: 'crm'
	};
	const initialSize = {
		simple: {
			width: 550,
			height: 492
		},
		crm: {
			width: 550,
			height: 650
		}
	};
	const lsKeys$1 = {
		height: 'im-phone-call-view-height',
		width: 'im-phone-call-view-width',
		callView: 'bx-vox-call-view',
		callInited: 'viInitedCall',
		externalCall: 'viExternalCard',
		currentCall: 'bx-vox-current-call'
	};
	const desktopEvents = {
		setTitle: 'phoneCallViewSetTitle',
		setStatus: 'phoneCallViewSetStatus',
		setUiState: 'phoneCallViewSetUiState',
		setDeviceCall: 'phoneCallViewSetDeviceCall',
		setCrmEntity: 'phoneCallViewSetCrmEntity',
		setPortalCall: 'phoneCallViewSetPortalCall',
		setPortalCallUserId: 'phoneCallViewSetPortalCallUserId',
		setPortalCallQueueName: 'phoneCallViewSetPortalCallQueueName',
		setPortalCallData: 'phoneCallViewSetPortalCallData',
		setConfig: 'phoneCallViewSetConfig',
		setCallState: 'phoneCallViewSetCallState',
		reloadCrmCard: 'phoneCallViewReloadCrmCard',
		setCallId: 'phoneCallViewSetCallId',
		setLineNumber: 'phoneCallViewSetLineNumber',
		setPhoneNumber: 'phoneCallViewSetPhoneNumber',
		setCompanyPhoneNumber: 'phoneCallViewSetCompanyPhoneNumber',
		setTransfer: 'phoneCallViewSetTransfer',
		closeWindow: 'phoneCallViewCloseWindow',
		onHold: 'phoneCallViewOnHold',
		onUnHold: 'phoneCallViewOnUnHold',
		onMute: 'phoneCallViewOnMute',
		onUnMute: 'phoneCallViewOnUnMute',
		onMakeCall: 'phoneCallViewOnMakeCall',
		onCallListMakeCall: 'phoneCallViewOnCallListMakeCall',
		onAnswer: 'phoneCallViewOnAnswer',
		onSkip: 'phoneCallViewOnSkip',
		onHangup: 'phoneCallViewOnHangup',
		onClose: 'phoneCallViewOnClose',
		onStartTransfer: 'phoneCallViewOnStartTransfer',
		onCompleteTransfer: 'phoneCallViewOnCompleteTransfer',
		onCancelTransfer: 'phoneCallViewOnCancelTransfer',
		onBeforeUnload: 'phoneCallViewOnBeforeUnload',
		onSwitchDevice: 'phoneCallViewOnSwitchDevice',
		onQualityGraded: 'phoneCallViewOnQualityGraded',
		onDialpadButtonClicked: 'phoneCallViewOnDialpadButtonClicked',
		onCommentShown: 'phoneCallViewOnCommentShown',
		onSaveComment: 'phoneCallViewOnSaveComment',
		onSetAutoClose: 'phoneCallViewOnSetAutoClose'
	};
	const blankAvatar = '/bitrix/js/im/images/blank.gif';
	class PhoneCallView {
		constructor(params) {
			this.id = 'im-phone-call-view';
			this.darkMode = params.darkMode === true;

			//params
			this.phoneNumber = params.phoneNumber || 'hidden';
			this.lineNumber = params.lineNumber || '';
			this.companyPhoneNumber = params.companyPhoneNumber || '';
			this.direction = params.direction || Direction.incoming;
			this.fromUserId = params.fromUserId;
			this.toUserId = params.toUserId;
			this.config = params.config || {};
			this.callId = params.callId || '';
			this.callState = CallState.idle;

			//associated crm entities
			this.crmEntityType = BX.prop.getString(params, 'crmEntityType', '');
			this.crmEntityId = BX.prop.getInteger(params, 'crmEntityId', 0);
			this.crmActivityId = BX.prop.getInteger(params, 'crmActivityId', 0);
			this.crmActivityEditUrl = BX.prop.getString(params, 'crmActivityEditUrl', '');
			this.crmData = BX.prop.getObject(params, 'crmData', {});
			this.crmBindings = BX.prop.getArray(params, 'crmBindings', []);
			this.externalRequests = {};

			//portal call
			this.portalCallData = params.portalCallData;
			this.portalCallUserId = params.portalCallUserId;
			this.portalCallQueueName = params.portalCallQueueName;

			//flags
			this.hasSipPhone = params.hasSipPhone === true;
			this.deviceCall = params.deviceCall === true;
			this.portalCall = params.portalCall === true;
			this.crm = params.crm === true;
			this.held = false;
			this.muted = false;
			this.recording = params.recording === true;
			this.makeCall = params.makeCall === true; // emulate pressing on "dial" button right after showing call view
			this.closable = false;
			this.allowAutoClose = true;
			this.folded = params.folded === true;
			this.autoFold = params.autoFold === true;
			this.transfer = params.transfer === true;
			this.title = '';
			this._uiState = params.uiState || UiState.idle;
			this.statusText = params.statusText || '';
			this.progress = '';
			this.quality = 0;
			this.qualityPopup = null;
			this.qualityGrade = 0;
			this.comment = '';
			this.commentShown = false;

			//timer
			this.initialTimestamp = params.initialTimestamp || 0;
			this.timerInterval = null;
			this.autoCloseTimer = null;
			this.autoCloseTimeout = 65000;
			this.elements = this.getInitialElements();
			this.sections = this.getInitialSections();
			var uiStateButtons = this.getUiStateButtons(this._uiState);
			this.buttonLayout = uiStateButtons.layout;
			this.buttons = uiStateButtons.buttons;
			this.restApps = params.restApps || [];
			if (!main_core.Type.isPlainObject(params.events)) {
				params.events = {};
			}
			this.callbacks = {
				hold: main_core.Type.isFunction(params.events.hold) ? params.events.hold : nop$1,
				unhold: main_core.Type.isFunction(params.events.unhold) ? params.events.unhold : nop$1,
				mute: main_core.Type.isFunction(params.events.mute) ? params.events.mute : nop$1,
				unmute: main_core.Type.isFunction(params.events.unmute) ? params.events.unmute : nop$1,
				makeCall: main_core.Type.isFunction(params.events.makeCall) ? params.events.makeCall : nop$1,
				callListMakeCall: main_core.Type.isFunction(params.events.callListMakeCall) ? params.events.callListMakeCall : nop$1,
				answer: main_core.Type.isFunction(params.events.answer) ? params.events.answer : nop$1,
				skip: main_core.Type.isFunction(params.events.skip) ? params.events.skip : nop$1,
				hangup: main_core.Type.isFunction(params.events.hangup) ? params.events.hangup : nop$1,
				close: main_core.Type.isFunction(params.events.close) ? params.events.close : nop$1,
				transfer: main_core.Type.isFunction(params.events.transfer) ? params.events.transfer : nop$1,
				completeTransfer: main_core.Type.isFunction(params.events.completeTransfer) ? params.events.completeTransfer : nop$1,
				cancelTransfer: main_core.Type.isFunction(params.events.cancelTransfer) ? params.events.cancelTransfer : nop$1,
				switchDevice: main_core.Type.isFunction(params.events.switchDevice) ? params.events.switchDevice : nop$1,
				qualityGraded: main_core.Type.isFunction(params.events.qualityGraded) ? params.events.qualityGraded : nop$1,
				dialpadButtonClicked: main_core.Type.isFunction(params.events.dialpadButtonClicked) ? params.events.dialpadButtonClicked : nop$1,
				saveComment: main_core.Type.isFunction(params.events.saveComment) ? params.events.saveComment : nop$1,
				notifyAdmin: main_core.Type.isFunction(params.events.notifyAdmin) ? params.events.notifyAdmin : nop$1
			};
			this.popup = null;

			// event handlers
			this._onBeforeUnloadHandler = this._onBeforeUnload.bind(this);
			this._onDblClickHandler = this._onDblClick.bind(this);
			this._onHoldButtonClickHandler = this._onHoldButtonClick.bind(this);
			this._onMuteButtonClickHandler = this._onMuteButtonClick.bind(this);
			this._onTransferButtonClickHandler = this._onTransferButtonClick.bind(this);
			this._onTransferCompleteButtonClickHandler = this._onTransferCompleteButtonClick.bind(this);
			this._onTransferCancelButtonClickHandler = this._onTransferCancelButtonClick.bind(this);
			this._onDialpadButtonClickHandler = this._onDialpadButtonClick.bind(this);
			this._onHangupButtonClickHandler = this._onHangupButtonClick.bind(this);
			this._onCloseButtonClickHandler = this._onCloseButtonClick.bind(this);
			this._onMakeCallButtonClickHandler = this._onMakeCallButtonClick.bind(this);
			this._onNextButtonClickHandler = this._onNextButtonClick.bind(this);
			this._onRedialButtonClickHandler = this._onRedialButtonClick.bind(this);
			this._onFoldButtonClickHandler = this._onFoldButtonClick.bind(this);
			this._onAnswerButtonClickHandler = this._onAnswerButtonClick.bind(this);
			this._onSkipButtonClickHandler = this._onSkipButtonClick.bind(this);
			this._onSwitchDeviceButtonClickHandler = this._onSwitchDeviceButtonClick.bind(this);
			this._onQualityMeterClickHandler = this._onQualityMeterClick.bind(this);
			this._onPullEventCrmHandler = this._onPullEventCrm.bind(this);

			// tabs
			this.hiddenTabs = [];
			this.currentTabName = '';
			this.moreTabsMenu = null;

			//customTabs
			this.customTabs = {};

			// callList
			this.callListId = params.callListId || 0;
			this.callListStatusId = params.callListStatusId || null;
			this.callListItemIndex = params.callListItemIndex || null;
			this.callListView = null;
			this.currentEntity = null;
			this.callingEntity = null;
			this.numberSelectMenu = null;

			// webform
			this.webformId = params.webformId || 0;
			this.webformSecCode = params.webformSecCode || '';
			this.webformLoaded = false;

			// partner data
			this.restAppLayoutLoaded = false;
			this.restAppLayoutLoading = false;
			this.restAppInterface = null;

			// desktop integration
			this.callWindow = null;
			this.slave = params.slave === true;
			this.skipOnResize = params.skipOnResize === true;
			this.desktop = new Desktop({
				parentPhoneCallView: this,
				closable: this.callListId > 0 ? true : this.closable
			});
			this.currentLayout = this.callListId > 0 ? layouts.crm : layouts.simple;
			this.backgroundWorker = params.backgroundWorker;
			this.backgroundWorker.setCallCard(this);
			this.backgroundWorker.setExternalCall(!!params.isExternalCall);
			this._isDesktop = params.messengerFacade ? params.messengerFacade.isDesktop() : params.isDesktop === true;
			this.messengerFacade = params.messengerFacade;
			this.foldedCallView = params.foldedCallView;
			this.init(params?.skipCheckChatWindow);
			if (this.backgroundWorker.isDesktop()) {
				this.backgroundWorker.removeDesktopEventHandlers();
			}
			this.backgroundWorker.platformWorker.emitInitializeEvent(this.getPlacementOptions());
			this.createTitle().then(title => this.setTitle(title));
			if (params.hasOwnProperty('uiState')) {
				this.setUiState(params['uiState']);
			}
		}
		getInitialElements() {
			return {
				main: null,
				title: null,
				sections: {
					status: null,
					timer: null,
					crmButtons: null
				},
				avatar: null,
				progress: null,
				timer: null,
				status: null,
				commentEditorContainer: null,
				commentEditor: null,
				qualityMeter: null,
				crmCard: null,
				crmButtonsContainer: null,
				crmButtons: {},
				buttonsContainer: null,
				topLevelButtonsContainer: null,
				topButtonsContainer: null,
				//well..
				buttons: {},
				sidebarContainer: null,
				tabsContainer: null,
				tabsBodyContainer: null,
				tabs: {
					callList: null,
					webform: null,
					app: null,
					custom: null
				},
				tabsBody: {
					callList: null,
					webform: null,
					app: null
				},
				moreTabs: null
			};
		}
		getInitialSections() {
			return {
				status: {
					visible: false
				},
				timer: {
					visible: false
				},
				crmButtons: {
					visible: false
				},
				commentEditor: {
					visible: false
				}
			};
		}
		init(skipCheckChatWindow = false) {
			if ((im_v2_lib_desktopApi.DesktopApi.isChatWindow() || skipCheckChatWindow) && !this.slave) {
				console.log('Init phone call view window:', location.href);
				this.desktop.openCallWindow('', null, {
					width: this.getInitialWidth(),
					height: this.getInitialHeight(),
					resizable: this.currentLayout == layouts.crm,
					minWidth: this.elements.sidebarContainer ? 950 : 550,
					minHeight: 650
				});
				this.bindMasterDesktopEvents();
				window.addEventListener('beforeunload', this.#onWindowUnload); //master window unload
				return;
			}
			this.elements.main = this.createLayout();
			this.updateView();
			if (this.isDesktop() && this.slave) {
				document.body.appendChild(this.elements.main);
				this.bindSlaveDesktopEvents();
			} else if (!this.isDesktop() && this.isFolded()) {
				document.body.appendChild(this.elements.main);
			} else if (!this.isDesktop()) {
				this.popup = this.createPopup();
				BX.addCustomEvent(window, "onLocalStorageSet", this.#onExternalEvent);
			}
			if (this.callListId > 0) {
				if (this.callListView) {
					this.callListView.reinit({
						node: this.elements.tabsBody.callList
					});
				} else {
					this.callListView = new CallList({
						node: this.elements.tabsBody.callList,
						id: this.callListId,
						statusId: this.callListStatusId,
						itemIndex: this.callListItemIndex,
						makeCall: this.makeCall,
						isDesktop: this.isDesktop,
						onSelectedItem: this.onCallListSelectedItem.bind(this)
					});
					this.callListView.init(() => {
						if (this.makeCall) {
							this._onMakeCallButtonClick();
						}
					});
					this.setUiState(UiState.outgoing);
				}
			} else if (this.crm && !this.isFolded()) {
				this.loadCrmCard(this.crmEntityType, this.crmEntityId);
			}
			BX.addCustomEvent("onPullEvent-crm", this._onPullEventCrmHandler);
			if (!this.isDesktop()) {
				window.addEventListener('beforeunload', this._onBeforeUnloadHandler);
			}
		}
		reinit() {
			this.elements = this.getInitialElements();
			let unloadHandler = this.isDesktop() ? this.#onWindowUnload : this._onBeforeUnloadHandler;
			window.removeEventListener('beforeunload', unloadHandler);
			BX.removeCustomEvent(window, "onLocalStorageSet", this.#onExternalEvent);
			BX.removeCustomEvent("onPullEvent-crm", this._onPullEventCrmHandler);
			this.init();
		}
		show() {
			if (!this.popup && this.isDesktop()) {
				return;
			}
			if (!this.popup) {
				this.reinit();
			}
			if (!this.isDesktop() && !this.isFolded()) {
				this.disableDocumentScroll();
			}
			this.popup.show();
			BX.localStorage.set(lsKeys$1.callView, this.callId, 86400);
			return this;
		}
		createPopup() {
			return new main_popup.Popup({
				id: this.getId(),
				bindElement: null,
				targetContainer: document.body,
				content: this.elements.main,
				closeIcon: false,
				noAllPaddings: true,
				zIndex: baseZIndex,
				offsetLeft: 0,
				offsetTop: 0,
				closeByEsc: false,
				draggable: {
					restrict: false
				},
				overlay: {
					backgroundColor: 'black',
					opacity: 30
				},
				events: {
					onPopupClose: () => {
						if (this.isFolded()) ; else {
							this.callbacks.close();
						}
					},
					onPopupDestroy: () => this.popup = null
				}
			});
		}
		createLayout() {
			if (this.isFolded()) {
				return this.createLayoutFolded();
			} else if (this.currentLayout == layouts.crm) {
				return this.createLayoutCrm();
			} else {
				return this.createLayoutSimple();
			}
		}
		createLayoutCrm() {
			var result = main_core.Dom.create("div", {
				props: {
					className: 'im-phone-call-top-level'
				},
				events: {
					dblclick: this._onDblClickHandler
				},
				children: [this.elements.topLevelButtonsContainer = main_core.Dom.create("div"), this.elements.phoneCallWrapper = main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-wrapper' + (this.hasSideBar() ? '' : ' im-phone-call-wrapper-without-sidebar')
					},
					children: [main_core.Dom.create("div", {
						props: {
							className: 'im-phone-call-container' + (this.hasSideBar() ? '' : ' im-phone-call-container-without-sidebar')
						},
						children: [main_core.Dom.create("div", {
							props: {
								className: 'im-phone-call-header-container'
							},
							children: [main_core.Dom.create("div", {
								props: {
									className: 'im-phone-call-header'
								},
								children: [this.elements.title = main_core.Dom.create('div', {
									props: {
										className: 'im-phone-call-title-text'
									},
									html: this.renderTitle()
								})]
							})]
						}), this.elements.crmCard = main_core.Dom.create("div", {
							props: {
								className: 'im-phone-call-crm-card'
							}
						}), this.elements.sections.status = main_core.Dom.create("div", {
							props: {
								className: 'im-phone-call-section'
							},
							style: this.sections.status.visible ? {} : {
								display: 'none'
							},
							children: [main_core.Dom.create("div", {
								props: {
									className: 'im-phone-call-status-description'
								},
								children: [this.elements.status = main_core.Dom.create("div", {
									props: {
										className: 'im-phone-call-status-description-item'
									},
									text: this.statusText
								})]
							})]
						}), this.elements.sections.timer = main_core.Dom.create("div", {
							props: {
								className: 'im-phone-call-section'
							},
							style: this.sections.timer.visible ? {} : {
								display: 'none'
							},
							children: [main_core.Dom.create("div", {
								props: {
									className: 'im-phone-call-status-timer'
								},
								children: [main_core.Dom.create("div", {
									props: {
										className: 'im-phone-call-status-timer-item'
									},
									children: [this.elements.timer = main_core.Dom.create("span")]
								})]
							})]
						}), this.elements.commentEditorContainer = main_core.Dom.create("div", {
							props: {
								className: 'im-phone-call-section'
							},
							style: this.commentShown ? {} : {
								display: 'none'
							},
							children: [main_core.Dom.create("div", {
								props: {
									className: 'im-phone-call-comments'
								},
								children: [this.elements.commentEditor = main_core.Dom.create("textarea", {
									props: {
										className: 'im-phone-call-comments-textarea',
										value: this.comment,
										placeholder: main_core.Loc.getMessage('IM_PHONE_CALL_COMMENT_PLACEHOLDER')
									},
									events: {
										bxchange: this._onCommentChanged.bind(this)
									}
								})]
							})]
						}), this.elements.sections.crmButtons = main_core.Dom.create("div", {
							props: {
								className: 'im-phone-call-section'
							},
							style: this.sections.crmButtons.visible ? {} : {
								display: 'none'
							},
							children: [this.elements.crmButtonsContainer = main_core.Dom.create("div", {
								props: {
									className: 'im-phone-call-crm-buttons'
								}
							})]
						}), this.elements.buttonsContainer = main_core.Dom.create("div", {
							props: {
								className: 'im-phone-call-buttons-container'
							}
						}), this.elements.topButtonsContainer = main_core.Dom.create("div", {
							props: {
								className: 'im-phone-call-buttons-container-top'
							}
						})]
					})]
				})]
			});
			if (this.hasSideBar()) {
				this.createSidebarLayout();
				if (this.elements.sidebarContainer) {
					result.appendChild(this.elements.sidebarContainer);
				}
				setTimeout(() => this.checkMoreButton(), 0);
			}
			if (this.isDesktop()) {
				result.style.position = 'fixed';
				result.style.top = 0;
				result.style.bottom = 0;
				result.style.left = 0;
				result.style.right = 0;
			} else {
				result.style.width = this.getInitialWidth() + 'px';
				result.style.height = this.getInitialHeight() + 'px';
			}
			return result;
		}
		/**
		 * @return boolean
		 */
		hasSideBar() {
			if (this.isDesktop() && !this.desktop.isFeatureSupported('iframe')) {
				return this.callListId > 0;
			} else {
				return this.callListId > 0 || this.webformId > 0 || this.restApps.length > 0 || Object.keys(this.customTabs).length > 0;
			}
		}
		getInitialWidth() {
			const storedWidth = window.localStorage ? parseInt(window.localStorage.getItem(lsKeys$1.width)) : 0;
			if (this.currentLayout == layouts.simple) {
				return initialSize.simple.width;
			} else if (this.hasSideBar()) {
				if (storedWidth > 0) {
					return storedWidth;
				} else {
					return Math.min(Math.floor(screen.width * 0.8), 1200);
				}
			} else {
				return initialSize.crm.width;
			}
		}
		getInitialHeight() {
			const storedHeight = window.localStorage ? parseInt(window.localStorage.getItem(lsKeys$1.height)) : 0;
			if (this.currentLayout == layouts.simple) {
				return initialSize.simple.height;
			} else if (storedHeight > 0) {
				return storedHeight;
			} else {
				return initialSize.crm.height;
			}
		}
		saveInitialSize(width, height) {
			if (!window.localStorage) {
				return false;
			}
			if (this.currentLayout == layouts.crm) {
				window.localStorage.setItem(lsKeys$1.height, height.toString());
				if (this.hasSideBar()) {
					window.localStorage.setItem(lsKeys$1.width, width);
				}
			}
		}
		showSections(sections) {
			if (!main_core.Type.isArray(sections)) {
				return;
			}
			sections.forEach(sectionName => {
				if (this.elements.sections[sectionName]) {
					this.elements.sections[sectionName].style.removeProperty('display');
				}
				if (this.sections[sectionName]) {
					this.sections[sectionName].visible = true;
				}
			});
		}
		hideSections(sections) {
			if (!main_core.Type.isArray(sections)) {
				return;
			}
			sections.forEach(sectionName => {
				if (this.elements.sections[sectionName]) {
					this.elements.sections[sectionName].style.display = 'none';
				}
				if (this.sections[sectionName]) {
					this.sections[sectionName].visible = false;
				}
			});
		}
		showOnlySections(sections) {
			if (!main_core.Type.isArray(sections)) {
				return;
			}
			let sectionsIndex = {};
			sections.forEach(sectionName => sectionsIndex[sectionName] = true);
			for (var sectionName in this.elements.sections) {
				if (!this.elements.sections.hasOwnProperty(sectionName) || !main_core.Type.isDomNode(this.elements.sections[sectionName])) {
					continue;
				}
				if (sectionsIndex[sectionName]) {
					this.elements.sections[sectionName].style.removeProperty('display');
					if (this.sections.hasOwnProperty(sectionName)) {
						this.sections[sectionName].visible = true;
					}
				} else {
					this.elements.sections[sectionName].style.display = 'none';
					if (this.sections.hasOwnProperty(sectionName)) {
						this.sections[sectionName].visible = false;
					}
				}
			}
		}
		createSidebarLayout() {
			let tabs = [];
			let tabsBody = [];
			if (Object.keys(this.customTabs).length > 0) {
				Object.keys(this.customTabs).forEach(tabKey => {
					const customTabId = this.customTabs[tabKey].id;
					const tabTitle = this.customTabs[tabKey].title;
					const tabId = `custom${customTabId}`;
					this.elements.tabs[tabId] = main_core.Dom.create("span", {
						props: {
							className: 'im-phone-sidebar-tab'
						},
						dataset: {
							tabId: tabId,
							tabBodyId: `custom${customTabId}`
						},
						text: main_core.Text.encode(tabTitle),
						events: {
							click: this._onTabHeaderClick.bind(this)
						}
					});
					tabs.push(this.elements.tabs[tabId]);
					if (!this.elements.tabsBody[tabId]) {
						this.elements.tabsBody[tabId] = main_core.Dom.create('div', {
							props: {
								className: `voximplant-phone-call-${tabId}-container`
							},
							children: [main_core.Dom.create('div', {
								props: {
									className: `voximplant-phone-call-${tabId}-tab-content voximplant-phone-call-custom-container`
								}
							})]
						});
					}
					tabsBody.push(this.elements.tabsBody[tabId]);
				});
			}
			if (this.callListId > 0) {
				this.elements.tabs.callList = main_core.Dom.create("span", {
					props: {
						className: 'im-phone-sidebar-tab'
					},
					dataset: {
						tabId: 'callList',
						tabBodyId: 'callList'
					},
					text: main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_CALL_LIST_TITLE'),
					events: {
						click: this._onTabHeaderClick.bind(this)
					}
				});
				tabs.push(this.elements.tabs.callList);
				if (!this.elements.tabsBody.callList) {
					this.elements.tabsBody.callList = main_core.Dom.create('div');
				}
				tabsBody.push(this.elements.tabsBody.callList);
			}
			if (this.webformId > 0 && this.isWebformSupported()) {
				this.elements.tabs.webform = main_core.Dom.create("span", {
					props: {
						className: 'im-phone-sidebar-tab'
					},
					dataset: {
						tabId: 'webform',
						tabBodyId: 'webform'
					},
					text: main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_WEBFORM_TITLE'),
					events: {
						click: this._onTabHeaderClick.bind(this)
					}
				});
				tabs.push(this.elements.tabs.webform);
				if (!this.elements.tabsBody.webform) {
					this.elements.tabsBody.webform = main_core.Dom.create('div', {
						props: {
							className: 'im-phone-call-form-container'
						}
					});
				}
				tabsBody.push(this.elements.tabsBody.webform);
				if (!this.formManager) {
					this.formManager = new FormManager({
						node: this.elements.tabsBody.webform,
						onFormSend: this._onFormSend.bind(this)
					});
				}
			}
			if (this.restApps.length > 0 && this.isRestAppsSupported()) {
				this.restApps.forEach(restApp => {
					const restAppId = restApp.id;
					const tabId = 'restApp' + restAppId;
					this.elements.tabs[tabId] = main_core.Dom.create("span", {
						props: {
							className: 'im-phone-sidebar-tab'
						},
						dataset: {
							tabId: tabId,
							tabBodyId: 'app',
							restAppId: restAppId
						},
						text: main_core.Text.encode(restApp.name),
						events: {
							click: this._onTabHeaderClick.bind(this)
						}
					});
					tabs.push(this.elements.tabs[tabId]);
				});
				if (!this.elements.tabsBody.app) {
					this.elements.tabsBody.app = main_core.Dom.create('div', {
						props: {
							className: 'im-phone-call-app-container'
						}
					});
				}
				tabsBody.push(this.elements.tabsBody.app);
			}
			this.elements.tabsTitleListContainer = main_core.Dom.create("div", {
				props: {
					className: 'im-phone-sidebar-tabs-container'
				},
				children: [this.elements.tabsContainer = main_core.Dom.create("div", {
					props: {
						className: 'im-phone-sidebar-tabs-left'
					},
					children: tabs
				}), main_core.Dom.create("div", {
					props: {
						className: 'im-phone-sidebar-tabs-right'
					},
					children: [this.elements.moreTabs = main_core.Dom.create("span", {
						props: {
							className: 'im-phone-sidebar-tab im-phone-sidebar-tab-more'
						},
						style: {
							display: 'none'
						},
						dataset: {},
						text: main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_MORE'),
						events: {
							click: this._onTabMoreClick.bind(this)
						}
					})]
				})]
			});
			this.elements.tabsBodyContainer = main_core.Dom.create("div", {
				props: {
					className: 'im-phone-sidebar-tabs-body-container'
				},
				children: tabsBody
			});
			if (this.elements.sidebarContainer) {
				this.elements.sidebarContainer.replaceChild(this.elements.tabsTitleListContainer, this.elements.sidebarContainer.firstChild);
				this.elements.sidebarContainer.replaceChild(this.elements.tabsBodyContainer, this.elements.sidebarContainer.lastChild);
				setTimeout(() => this.checkMoreButton(), 0);
			} else {
				this.elements.sidebarContainer = main_core.Dom.create("div", {
					props: {
						className: 'im-phone-sidebar-wrap'
					},
					children: [this.elements.tabsTitleListContainer, this.elements.tabsBodyContainer]
				});
			}
			if (Object.keys(this.customTabs).length > 0) {
				const selectedCustomTab = Object.keys(this.customTabs)[0];
				this.setActiveTab({
					tabId: `custom${this.customTabs[selectedCustomTab].id}`,
					tabBodyId: `custom${this.customTabs[selectedCustomTab].id}`,
					hidden: this.customTabs[selectedCustomTab].visible
				});
			} else if (this.callListId > 0) {
				this.setActiveTab({
					tabId: 'callList',
					tabBodyId: 'callList'
				});
			} else if (this.webformId > 0 && this.isWebformSupported()) {
				this.setActiveTab({
					tabId: 'webform',
					tabBodyId: 'webform'
				});
			} else if (this.restApps.length > 0 && this.isRestAppsSupported()) {
				this.setActiveTab({
					tabId: 'restApp' + this.restApps[0].id,
					tabBodyId: 'app',
					restAppId: this.restApps[0].id
				});
			}
		}
		createLayoutSimple() {
			var portalCallUserImage = '';
			if (this.isPortalCall() && this.portalCallData.hrphoto && this.portalCallData.hrphoto[this.portalCallUserId] && this.portalCallData.hrphoto[this.portalCallUserId] != blankAvatar) {
				portalCallUserImage = this.portalCallData.hrphoto[this.portalCallUserId];
			}
			var result = main_core.Dom.create("div", {
				props: {
					className: 'im-phone-call-wrapper'
				},
				children: [main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-container'
					},
					children: [main_core.Dom.create("div", {
						props: {
							className: 'im-phone-calling-section'
						},
						children: [this.elements.title = main_core.Dom.create("div", {
							props: {
								className: 'im-phone-calling-text'
							}
						})]
					}), main_core.Dom.create("div", {
						props: {
							className: 'im-phone-call-section im-phone-calling-progress-section'
						},
						children: [main_core.Dom.create("div", {
							props: {
								className: 'im-phone-calling-progress-container'
							},
							children: [main_core.Dom.create("div", {
								props: {
									className: 'im-phone-calling-progress-container-block-l'
								},
								children: [main_core.Dom.create("div", {
									props: {
										className: 'im-phone-calling-progress-phone'
									}
								})]
							}), this.elements.progress = main_core.Dom.create("div", {
								props: {
									className: 'im-phone-calling-progress-container-block-c'
								}
							}), main_core.Dom.create("div", {
								props: {
									className: 'im-phone-calling-progress-container-block-r'
								},
								children: [this.elements.avatar = main_core.Dom.create("div", {
									props: {
										className: 'im-phone-calling-progress-customer'
									},
									style: main_core.Type.isStringFilled(portalCallUserImage) ? {
										'background-image': 'url(\'' + portalCallUserImage + '\')'
									} : {}
								})]
							})]
						})]
					}), main_core.Dom.create("div", {
						props: {
							className: 'im-phone-call-section'
						},
						children: [this.elements.status = main_core.Dom.create("div", {
							props: {
								className: 'im-phone-calling-process-status'
							}
						})]
					}), this.elements.buttonsContainer = main_core.Dom.create("div", {
						props: {
							className: 'im-phone-call-buttons-container'
						}
					}), this.elements.topButtonsContainer = main_core.Dom.create("div", {
						props: {
							className: 'im-phone-call-buttons-container-top'
						}
					})]
				})]
			});
			result.style.width = this.getInitialWidth() + 'px';
			result.style.height = this.getInitialHeight() + 'px';
			return result;
		}
		createLayoutFolded() {
			return main_core.Dom.create("div", {
				props: {
					className: "im-phone-call-panel-mini"
				},
				style: {
					zIndex: baseZIndex
				},
				children: [this.elements.sections.timer = this.elements.timer = main_core.Dom.create("div", {
					props: {
						className: "im-phone-call-panel-mini-time"
					},
					style: this.sections.timer.visible ? {} : {
						display: 'none'
					}
				}), this.elements.buttonsContainer = main_core.Dom.create("div", {
					props: {
						className: 'im-phone-call-panel-mini-buttons'
					}
				}), main_core.Dom.create("div", {
					props: {
						className: "im-phone-call-panel-mini-expand"
					},
					events: {
						click: () => this.unfold()
					}
				})]
			});
		}
		addTab(tabName, tabId = '') {
			if (!tabId) {
				tabId = Math.random().toString(36).substr(2, 9);
			}
			return new Promise(resolve => {
				const tab = {
					title: tabName,
					id: tabId,
					callId: this.callId,
					contentContainerId: `voximplant-phone-call-${tabId}-container`,
					visible: true,
					visibilityChangeCallback: null,
					getContentContainerId: () => {
						return this.elements.tabsBody[`custom${tabId}`];
					},
					setContent: content => {
						this.elements.tabsBody[`custom${tabId}`].replaceChild(content, this.elements.tabsBody[`custom${tabId}`].firstChild);
					},
					setVisibilityChangeCallback(callback) {
						this.visibilityChangeCallback = callback;
					},
					setTitle: newTitle => {
						this.customTabs[tabId].title = newTitle;
						this.elements.tabs[`custom${tabId}`].innerText = newTitle;
					},
					setVisibility: newValue => {
						this.customTabs[tabId].visible = newValue;
						this.createSidebarLayout();
					},
					remove: () => {
						delete this.customTabs[tabId];
						if (!this.hasSideBar()) {
							this.elements.main.removeChild(this.elements.sidebarContainer);
							this.elements.sidebarContainer = null;
							this.resizeCallCard();
							return;
						}
						this.createSidebarLayout();
					}
				};
				this.customTabs[tabId] = tab;
				if (this.elements.sidebarContainer) {
					this.createSidebarLayout();
				} else {
					this.createSidebarLayout();
					this.elements.main.appendChild(this.elements.sidebarContainer);
					this.elements.phoneCallWrapper.classList.remove('im-phone-call-wrapper-without-sidebar');
					this.resizeCallCard();
				}
				resolve(tab);
			});
		}
		resizeCallCard() {
			if (this.isDesktop()) {
				this.elements.main.style.position = 'fixed';
				this.elements.main.style.top = 0;
				this.elements.main.style.bottom = 0;
				this.elements.main.style.left = 0;
				this.elements.main.style.right = 0;
			} else {
				this.elements.main.style.width = this.getInitialWidth() + 'px';
				this.elements.main.style.height = this.getInitialHeight() + 'px';
			}
			if (this.isDesktop()) {
				this.resizeWindow(this.getInitialWidth(), this.getInitialHeight());
			}
			this.adjust();
		}
		setActiveTab(params) {
			const tabId = params.tabId;
			const tabBodyId = params.tabBodyId;
			const restAppId = params.restAppId || '';
			params.hidden = params.hidden === true;
			for (let tab in this.elements.tabs) {
				if (this.elements.tabs.hasOwnProperty(tab) && main_core.Type.isDomNode(this.elements.tabs[tab])) {
					this.elements.tabs[tab].classList.toggle('im-phone-sidebar-tab-active', tab == tabId);
				}
			}
			this.elements.moreTabs.classList.toggle('im-phone-sidebar-tab-active', params.hidden);
			for (let tab in this.elements.tabsBody) {
				if (this.elements.tabsBody.hasOwnProperty(tab) && main_core.Type.isDomNode(this.elements.tabsBody[tab])) {
					if (tab == tabBodyId) {
						this.elements.tabsBody[tab].style.removeProperty('display');
					} else {
						this.elements.tabsBody[tab].style.display = 'none';
					}
				}
			}
			this.currentTabName = tabId;
			if (tabId === 'webform' && !this.webformLoaded) {
				this.loadForm({
					id: this.webformId,
					secCode: this.webformSecCode
				});
			}
			if (restAppId !== '') {
				this.loadRestApp({
					id: restAppId,
					callId: this.callId,
					node: this.elements.tabsBody.app
				});
			}
		}
		isCurrentTabHidden() {
			let result = false;
			for (let i = 0; i < this.hiddenTabs.length; i++) {
				if (this.hiddenTabs[i].dataset.tabId == this.currentTabName) {
					result = true;
					break;
				}
			}
			return result;
		}
		checkMoreButton() {
			if (!this.elements.tabsContainer) {
				return;
			}
			var tabs = this.elements.tabsContainer.children;
			var currentTab;
			this.hiddenTabs = [];
			for (var i = 0; i < tabs.length; i++) {
				currentTab = tabs.item(i);
				if (currentTab.offsetTop > 7) {
					this.hiddenTabs.push(currentTab);
				}
			}
			if (this.hiddenTabs.length > 0) {
				this.elements.moreTabs.style.removeProperty('display');
			} else {
				this.elements.moreTabs.style.display = 'none';
			}
			if (this.isCurrentTabHidden()) {
				main_core.Dom.addClass(this.elements.moreTabs, 'im-phone-sidebar-tab-active');
			} else {
				main_core.Dom.removeClass(this.elements.moreTabs, 'im-phone-sidebar-tab-active');
			}
		}
		_onTabHeaderClick(e) {
			if (this.moreTabsMenu) {
				this.moreTabsMenu.close();
			}
			this.setActiveTab({
				tabId: e.target.dataset.tabId,
				tabBodyId: e.target.dataset.tabBodyId,
				restAppId: e.target.dataset.restAppId || '',
				hidden: false
			});
		}
		_onTabMoreClick() {
			if (this.hiddenTabs.length === 0) {
				return;
			}
			if (this.moreTabsMenu) {
				this.moreTabsMenu.close();
				return;
			}
			var menuItems = [];
			this.hiddenTabs.forEach(tabElement => {
				menuItems.push({
					id: "selectTab_" + tabElement.dataset.tabId,
					text: tabElement.innerText,
					onclick: () => {
						this.moreTabsMenu.close();
						this.setActiveTab({
							tabId: tabElement.dataset.tabId,
							tabBodyId: tabElement.dataset.tabBodyId,
							restAppId: tabElement.dataset.restAppId || '',
							hidden: true
						});
					}
				});
			});
			this.moreTabsMenu = new main_popup.Menu('phoneCallViewMoreTabs', this.elements.moreTabs, menuItems, {
				autoHide: true,
				offsetTop: 0,
				offsetLeft: 0,
				angle: {
					position: "top"
				},
				zIndex: baseZIndex + 100,
				events: {
					onPopupClose: () => this.moreTabsMenu.destroy(),
					onPopupDestroy: () => this.moreTabsMenu = null
				}
			});
			this.moreTabsMenu.show();
		}
		getId() {
			return this.id;
		}
		createTitle() {
			let callTitle = '';
			return new Promise(resolve => {
				BX.PhoneNumberParser.getInstance().parse(this.phoneNumber).then(parsedNumber => {
					if (this.phoneNumber == 'unknown') {
						resolve(main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_NUMBER_UNKNOWN'));
						return;
					}
					if (this.phoneNumber == 'hidden') {
						callTitle = main_core.Loc.getMessage('IM_PHONE_HIDDEN_NUMBER');
					} else {
						callTitle = this.phoneNumber.toString();
						if (parsedNumber.isValid()) {
							callTitle = parsedNumber.format();
							if (parsedNumber.isInternational() && callTitle.charAt(0) != '+') {
								callTitle = '+' + callTitle;
							}
						} else {
							callTitle = this.phoneNumber.toString();
						}
					}
					if (this.isCallback()) {
						callTitle = main_core.Loc.getMessage('IM_PHONE_CALLBACK_TO').replace('#PHONE#', callTitle);
					} else if (this.isPortalCall()) {
						switch (this.direction) {
							case Direction.incoming:
								if (this.portalCallUserId) {
									callTitle = main_core.Loc.getMessage("IM_M_CALL_VOICE_FROM").replace('#USER#', this.portalCallData.users[this.portalCallUserId].name);
								}
								break;
							case Direction.outgoing:
								if (this.portalCallUserId) {
									callTitle = main_core.Loc.getMessage("IM_M_CALL_VOICE_TO").replace('#USER#', this.portalCallData.users[this.portalCallUserId].name);
								} else {
									callTitle = main_core.Loc.getMessage("IM_M_CALL_VOICE_TO").replace('#USER#', this.portalCallQueueName) + ' (' + this.phoneNumber + ')';
								}
								break;
						}
					} else {
						callTitle = main_core.Loc.getMessage(this.direction === Direction.incoming ? 'IM_PHONE_CALL_VOICE_FROM' : 'IM_PHONE_CALL_VOICE_TO').replace('#PHONE#', callTitle);
						if (this.direction === Direction.incoming && this.companyPhoneNumber) {
							callTitle = callTitle + ', ' + main_core.Loc.getMessage('IM_PHONE_CALL_TO_PHONE').replace('#PHONE#', this.companyPhoneNumber);
						}
						if (this.isTransfer()) {
							callTitle = callTitle + ' ' + main_core.Loc.getMessage('IM_PHONE_CALL_TRANSFERED');
						}
					}
					resolve(callTitle);
				});
			});
		}
		renderTitle() {
			return main_core.Text.encode(this.title);
		}
		renderAvatar() {
			let portalCallUserImage = '';
			if (this.isPortalCall() && this.elements.avatar && this.portalCallData.hrphoto && this.portalCallData.hrphoto[this.portalCallUserId] && this.portalCallData.hrphoto[this.portalCallUserId] != blankAvatar) {
				portalCallUserImage = this.portalCallData.hrphoto[this.portalCallUserId];
				main_core.Dom.adjust(this.elements.avatar, {
					style: portalCallUserImage === '' ? {} : {
						'background-image': 'url(\'' + portalCallUserImage + '\')'
					}
				});
			}
		}
		_getCrmEditUrl(entityTypeName, entityId) {
			if (!main_core.Type.isStringFilled(entityTypeName)) {
				return '';
			}
			entityId = Number(entityId);
			return '/crm/' + entityTypeName.toLowerCase() + '/edit/' + entityId.toString() + '/';
		}
		_generateExternalContext() {
			return this._getRandomString(16);
		}
		_getRandomString(len) {
			const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
			let randomString = '';
			for (let i = 0; i < len; i++) {
				const randomPoz = Math.floor(Math.random() * charSet.length);
				randomString += charSet.substring(randomPoz, randomPoz + 1);
			}
			return randomString;
		}
		setPhoneNumber(phoneNumber) {
			this.phoneNumber = phoneNumber;
			this.setOnSlave(desktopEvents.setPhoneNumber, [phoneNumber]);
		}
		setTitle(title) {
			this.title = title;
			if (this.isDesktop()) {
				if (this.slave) {
					BXDesktopWindow.SetProperty('title', title);
				} else {
					im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.setTitle, [title]);
				}
			}
			if (this.elements.title) {
				this.elements.title.innerHTML = this.renderTitle();
			}
		}
		getTitle() {
			return this.title;
		}
		setQuality(quality) {
			this.quality = quality;
			if (this.elements.qualityMeter) {
				this.elements.qualityMeter.style.width = this.getQualityMeterWidth();
			}
		}
		getQualityMeterWidth() {
			if (this.quality > 0 && this.quality <= 5) {
				return this.quality * 20 + '%';
			} else {
				return '0';
			}
		}
		setProgress(progress) {
			if (this.progress === progress) {
				return;
			}
			this.progress = progress;
			if (!this.elements.progress) {
				return;
			}
			main_core.Dom.clean(this.elements.progress);
			this.elements.progress.appendChild(this.renderProgress(this.progress));
		}
		setStatusText(statusText) {
			if (this.isDesktop() && !this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.setStatus, [statusText]);
				return;
			}
			this.statusText = statusText;
			if (this.elements.status) {
				this.elements.status.innerText = this.statusText;
			}
		}
		setConfig(config) {
			if (!main_core.Type.isPlainObject(config)) {
				return;
			}
			this.config = config;
			if (!this.isDesktop() || this.slave) {
				this.renderCrmButtons();
			}
			this.setOnSlave(desktopEvents.setConfig, [config]);
		}
		setCallId(callId) {
			this.callId = callId;
			this.setOnSlave(desktopEvents.setCallId, [callId]);
		}
		setLineNumber(lineNumber) {
			this.lineNumber = lineNumber;
			this.setOnSlave(desktopEvents.setLineNumber, [lineNumber]);
		}
		setCompanyPhoneNumber(companyPhoneNumber) {
			this.companyPhoneNumber = companyPhoneNumber;
			this.setOnSlave(desktopEvents.setCompanyPhoneNumber, [companyPhoneNumber]);
		}
		setButtons(buttons, layout) {
			if (!ButtonLayouts[layout]) {
				layout = ButtonLayouts.centered;
			}
			this.buttonLayout = layout;
			this.buttons = buttons;
			this.renderButtons();
		}
		setUiState(uiState) {
			this._uiState = uiState;
			var stateButtons = this.getUiStateButtons(uiState);
			this.buttons = stateButtons.buttons;
			this.buttonLayout = stateButtons.layout;
			switch (uiState) {
				case UiState.incoming:
					this.setClosable(false);
					this.showOnlySections(['status']);
					this.renderCrmButtons();
					this.stopTimer();
					break;
				case UiState.transferIncoming:
					this.setClosable(false);
					this.showOnlySections(['status']);
					this.renderCrmButtons();
					this.stopTimer();
					break;
				case UiState.outgoing:
					this.setClosable(true);
					this.showOnlySections(['status']);
					this.renderCrmButtons();
					this.stopTimer();
					this.hideCallIcon();
					break;
				case UiState.connectingIncoming:
					this.setClosable(false);
					this.showOnlySections(['status']);
					this.renderCrmButtons();
					this.stopTimer();
					break;
				case UiState.connectingOutgoing:
					this.setClosable(false);
					this.showOnlySections(['status']);
					this.renderCrmButtons();
					this.showCallIcon();
					this.stopTimer();
					break;
				case UiState.connected:
					if (this.deviceCall) {
						this.setClosable(true);
					} else {
						this.setClosable(false);
					}
					this.showSections(['status', 'timer']);
					this.renderCrmButtons();
					this.showCallIcon();
					this.startTimer();
					break;
				case UiState.transferring:
					this.setClosable(false);
					this.showSections(['status', 'timer']);
					this.renderCrmButtons();
					break;
				case UiState.idle:
					this.setClosable(true);
					this.stopTimer();
					this.hideCallIcon();
					this.showOnlySections(['status']);
					this.renderCrmButtons();
					break;
				case UiState.error:
					this.setClosable(true);
					this.stopTimer();
					this.hideCallIcon();
					break;
				case UiState.moneyError:
					this.setClosable(true);
					this.stopTimer();
					this.hideCallIcon();
					break;
				case UiState.sipPhoneError:
					this.setClosable(true);
					this.stopTimer();
					this.hideCallIcon();
					break;
				case UiState.redial:
					this.setClosable(true);
					this.stopTimer();
					this.hideCallIcon();
					break;
			}
			if (this.isDesktop() && !this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.setUiState, [uiState]);
				return;
			}
			this.renderButtons();
		}
		/**
		 * @param {string} callState
		 * @param {object} additionalParams
		 * @see CallState
		 */
		setCallState(callState, additionalParams) {
			if (this.callState === callState) {
				return;
			}
			this.callState = callState;
			if (!main_core.Type.isPlainObject(additionalParams)) {
				additionalParams = {};
			}
			this.renderButtons();
			if (callState === CallState.connected && this.isAutoFoldAllowed()) {
				this.fold();
			}
			BX.onCustomEvent(window, "CallCard::CallStateChanged", [callState, additionalParams]);
			this.setOnSlave(desktopEvents.setCallState, [callState, additionalParams]);
		}
		isAutoFoldAllowed() {
			return this.autoFold === true && !this.isDesktop() && !this.isFolded() && this.restApps.length === 0;
		}
		isHeld() {
			return this.held;
		}
		setHeld(held) {
			this.held = held;
		}
		setRecording(recording) {
			this.recording = recording;
		}
		isRecording() {
			return this.recording;
		}
		isMuted() {
			return this.muted;
		}
		setMuted(muted) {
			this.muted = muted;
		}
		isTransfer() {
			return this.transfer;
		}
		setTransfer(transfer) {
			transfer = transfer === true;
			if (this.transfer == transfer) {
				return;
			}
			this.transfer = transfer;
			this.setOnSlave(desktopEvents.setTransfer, [transfer]);
			this.setUiState(this._uiState);
		}
		isCallback() {
			return this.direction === Direction.callback;
		}
		isPortalCall() {
			return this.portalCall;
		}
		setCallback(eventName, callback) {
			if (!this.callbacks.hasOwnProperty(eventName)) {
				return false;
			}
			this.callbacks[eventName] = main_core.Type.isFunction(callback) ? callback : nop$1;
		}
		setDeviceCall(deviceCall) {
			this.deviceCall = deviceCall;
			if (this.elements.buttons.sipPhone) {
				if (deviceCall) {
					main_core.Dom.addClass(this.elements.buttons.sipPhone, 'active');
				} else {
					main_core.Dom.removeClass(this.elements.buttons.sipPhone, 'active');
				}
			}
			if (this.isDesktop() && !this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.setDeviceCall, [deviceCall]);
			}
		}
		setCrmEntity(params) {
			this.crmEntityType = params.type;
			this.crmEntityId = params.id;
			this.crmActivityId = params.activityId || '';
			this.crmActivityEditUrl = params.activityEditUrl || '';
			this.crmBindings = main_core.Type.isArray(params.bindings) ? params.bindings : [];
			if (this.isDesktop() && !this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.setCrmEntity, [params]);
			}
		}
		setCrmData(crmData) {
			if (!main_core.Type.isPlainObject(crmData)) {
				return;
			}
			this.crm = true;
			this.crmData = crmData;
		}
		loadCrmCard(entityType, entityId) {
			BX.onCustomEvent(window, 'CallCard::EntityChanged', [{
				'CRM_ENTITY_TYPE': entityType,
				'CRM_ENTITY_ID': entityId,
				'PHONE_NUMBER': this.phoneNumber
			}]);
			this.backgroundWorker.emitEvent(backgroundWorkerEvents.entityChanged, {
				'CRM_ENTITY_TYPE': entityType,
				'CRM_ENTITY_ID': entityId,
				'PHONE_NUMBER': this.phoneNumber
			});
			let enableCopilotReplacement = 'Y';
			if (this.isCallListMode()) {
				enableCopilotReplacement = 'N';
			}
			BX.ajax.runAction("voximplant.callview.getCrmCard", {
				data: {
					entityType: entityType,
					entityId: entityId,
					isEnableCopilotReplacement: enableCopilotReplacement
				}
			}).then(response => {
				if (this.currentLayout == layouts.simple) {
					this.currentLayout = layouts.crm;
					this.crm = true;
					var newMainElement = this.createLayoutCrm();
					this.elements.main.parentNode.replaceChild(newMainElement, this.elements.main);
					this.elements.main = newMainElement;
					this.setUiState(this._uiState);
					this.setStatusText(this.statusText);
				}
				if (this.elements.crmCard) {
					BX.html(this.elements.crmCard, response.data.html);
					setTimeout(() => {
						if (this.isDesktop()) {
							this.resizeWindow(this.getInitialWidth(), this.getInitialHeight());
						}
						this.adjust();
						this.bindCrmCardEvents();
					}, 100);
				}
				this.renderCrmButtons();
			}).catch(response => console.error("Could not load crm card: ", response.errors[0]));
		}
		reloadCrmCard() {
			if (this.isDesktop() && !this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.reloadCrmCard, []);
			} else {
				this.loadCrmCard(this.crmEntityType, this.crmEntityId);
			}
		}
		bindCrmCardEvents() {
			if (!this.elements.crmCard) {
				return;
			}
			if (!BX.Crm || !BX.Crm.Page) {
				return;
			}
			var anchors = this.elements.crmCard.querySelectorAll('a[data-use-slider=Y]');
			for (var i = 0; i < anchors.length; i++) {
				BX.bind(anchors[i], 'click', this.onCrmAnchorClick.bind(this));
			}
		}
		onCrmAnchorClick(e) {
			if (BX.Crm.Page.isSliderEnabled(e.currentTarget.href)) {
				if (!this.isFolded()) {
					this.fold();
				}
			}
		}
		setPortalCallUserId(userId) {
			this.portalCallUserId = userId;
			this.setOnSlave(desktopEvents.setPortalCallUserId, [userId]);
			if (this.portalCallData && this.portalCallData.users[this.portalCallUserId]) {
				this.renderAvatar();
				this.createTitle().then(title => this.setTitle(title));
			}
		}
		setPortalCallQueueName(queueName) {
			this.portalCallQueueName = queueName;
			this.setOnSlave(desktopEvents.setPortalCallQueueName, [queueName]);
			this.createTitle().then(title => this.setTitle(title));
		}
		setPortalCall(portalCall) {
			this.portalCall = portalCall === true;
			this.setOnSlave(desktopEvents.setPortalCall, [portalCall]);
		}
		setPortalCallData(data) {
			this.portalCallData = data;
			this.setOnSlave(desktopEvents.setPortalCallData, [data]);
		}
		setOnSlave(message, parameters) {
			if (this.isDesktop() && !this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(message, parameters);
			}
		}
		updateView() {
			if (this.elements.title) {
				this.elements.title.innerHTML = this.renderTitle();
			}
			if (this.elements.progress) {
				main_core.Dom.clean(this.elements.progress);
				this.elements.progress.appendChild(this.renderProgress(this.progress));
			}
			if (this.elements.status) {
				this.elements.status.innerText = this.statusText;
			}
			this.renderButtons();
			this.renderTimer();
		}
		renderProgress(progress) {
			let result;
			switch (progress) {
				case CallProgress.connect:
					result = main_core.Dom.create("div", {
						props: {
							className: 'bx-messenger-call-overlay-progress'
						},
						children: [main_core.Dom.create("img", {
							props: {
								className: 'bx-messenger-call-overlay-progress-status bx-messenger-call-overlay-progress-status-anim-1'
							}
						}), main_core.Dom.create("img", {
							props: {
								className: 'bx-messenger-call-overlay-progress-status bx-messenger-call-overlay-progress-status-anim-2'
							}
						})]
					});
					break;
				case CallProgress.online:
					result = main_core.Dom.create("div", {
						props: {
							className: 'bx-messenger-call-overlay-progress bx-messenger-call-overlay-progress-online'
						},
						children: [main_core.Dom.create("img", {
							props: {
								className: 'bx-messenger-call-overlay-progress-status bx-messenger-call-overlay-progress-status-anim-3'
							}
						})]
					});
					break;
				case CallProgress.error:
					progress = CallProgress.offline;
				// fallthrough to default
				default:
					result = main_core.Dom.create("div", {
						props: {
							className: 'bx-messenger-call-overlay-progress bx-messenger-call-overlay-progress-' + progress
						}
					});
			}
			return result;
		}
		/**
		 * @param uiState UiState
		 * @returns object {buttons: string[], layout: string}
		 */
		getUiStateButtons(uiState) {
			var result = {
				buttons: [],
				layout: ButtonLayouts.centered
			};
			switch (uiState) {
				case UiState.incoming:
					result.buttons = ['answer', 'skip'];
					break;
				case UiState.transferIncoming:
					result.buttons = ['answer', 'skip'];
					break;
				case UiState.outgoing:
					result.buttons = ['call'];
					if (this.callListId > 0) {
						result.buttons.push('next');
						result.buttons.push('fold');
						if (!this.isDesktop()) {
							result.buttons.push('topClose');
						}
					}
					break;
				case UiState.connectingIncoming:
					result.buttons = ['hangup'];
					break;
				case UiState.connectingOutgoing:
					if (this.hasSipPhone) {
						result.buttons.push('sipPhone');
					}
					result.buttons.push('hangup');
					break;
				case UiState.error:
					if (this.hasSipPhone) {
						result.buttons.push('sipPhone');
					}
					if (this.callListId > 0) {
						result.buttons.push('redial', 'next', 'topClose');
					} else {
						result.buttons.push('close');
					}
					break;
				case UiState.moneyError:
					result.buttons = ['notifyAdmin', 'close'];
					break;
				case UiState.sipPhoneError:
					result.buttons = ['sipPhone', 'close'];
					break;
				case UiState.connected:
					result.buttons = this.isTransfer() ? [] : ['hold'];
					if (!this.deviceCall) {
						result.buttons.push('mute', 'qualityMeter');
					}
					result.buttons.push('fold');
					if (!this.callListId && !this.isTransfer()) {
						result.buttons.push('transfer');
					}
					if (this.deviceCall) {
						result.buttons.push('close');
					} else {
						result.buttons.push('dialpad', 'hangup');
					}
					result.layout = ButtonLayouts.spaced;
					break;
				case UiState.transferring:
					result.buttons = ['transferComplete', 'transferCancel'];
					break;
				case UiState.transferFailed:
					result.buttons = ['transferCancel'];
					break;
				case UiState.transferConnected:
					result.buttons = ['hangup'];
					break;
				case UiState.idle:
					if (this.hasSipPhone) {
						result.buttons = ['close'];
					} else if (this.direction == Direction.incoming) {
						result.buttons = ['close'];
					} else if (this.direction == Direction.outgoing) {
						result.buttons = ['redial'];
						if (this.callListId > 0) {
							result.buttons.push('next');
							result.buttons.push('fold');
						} else {
							result.buttons.push('close');
						}
					}
					if (this.callListId > 0 && !this.isDesktop()) {
						result.buttons.push('topClose');
					}
					break;
				case UiState.redial:
					result.buttons = ['redial'];
					break;
				case UiState.externalCard:
					result.buttons = ['close'];
					result.buttons.push('fold');
					break;
			}
			return result;
		}
		renderButtons() {
			if (this.isFolded()) {
				this.renderButtonsFolded();
			} else {
				this.renderButtonsDefault();
			}
		}
		renderButtonsDefault() {
			var buttonsFragment = document.createDocumentFragment();
			var topButtonsFragment = document.createDocumentFragment();
			var topLevelButtonsFragment = document.createDocumentFragment();
			var subContainers = {
				left: null,
				right: null
			};
			this.elements.buttons = {};
			if (this.buttonLayout == ButtonLayouts.spaced) {
				subContainers.left = main_core.Dom.create('div', {
					props: {
						className: 'im-phone-call-buttons-container-left'
					}
				});
				subContainers.right = main_core.Dom.create('div', {
					props: {
						className: 'im-phone-call-buttons-container-right'
					}
				});
				buttonsFragment.appendChild(subContainers.left);
				buttonsFragment.appendChild(subContainers.right);
			}
			this.buttons.forEach(buttonName => {
				let buttonNode;
				switch (buttonName) {
					case 'hold':
						buttonNode = renderSimpleButton('', 'im-phone-call-btn-hold', this._onHoldButtonClickHandler);
						if (this.isHeld()) {
							main_core.Dom.addClass(buttonNode, 'active');
						}
						if (this.buttonLayout == ButtonLayouts.spaced) {
							subContainers.left.appendChild(buttonNode);
						} else {
							buttonsFragment.appendChild(buttonNode);
						}
						break;
					case 'mute':
						buttonNode = renderSimpleButton('', 'im-phone-call-btn-mute', this._onMuteButtonClickHandler);
						if (this.isMuted()) {
							main_core.Dom.addClass(buttonNode, 'active');
						}
						if (this.buttonLayout == ButtonLayouts.spaced) {
							subContainers.left.appendChild(buttonNode);
						} else {
							buttonsFragment.appendChild(buttonNode);
						}
						break;
					case 'transfer':
						buttonNode = renderSimpleButton('', 'im-phone-call-btn-transfer', this._onTransferButtonClickHandler);
						if (this.buttonLayout == ButtonLayouts.spaced) {
							subContainers.left.appendChild(buttonNode);
						} else {
							buttonsFragment.appendChild(buttonNode);
						}
						break;
					case 'transferComplete':
						buttonNode = renderSimpleButton(main_core.Loc.getMessage('IM_M_CALL_BTN_TRANSFER'), 'im-phone-call-btn im-phone-call-btn-blue im-phone-call-btn-arrow', this._onTransferCompleteButtonClickHandler);
						buttonsFragment.appendChild(buttonNode);
						break;
					case 'transferCancel':
						buttonNode = renderSimpleButton(main_core.Loc.getMessage('IM_M_CALL_BTN_RETURN'), 'im-phone-call-btn im-phone-call-btn-red', this._onTransferCancelButtonClickHandler);
						buttonsFragment.appendChild(buttonNode);
						break;
					case 'dialpad':
						buttonNode = renderSimpleButton('', 'im-phone-call-btn-dialpad', this._onDialpadButtonClickHandler);
						if (this.buttonLayout == ButtonLayouts.spaced) {
							subContainers.left.appendChild(buttonNode);
						} else {
							buttonsFragment.appendChild(buttonNode);
						}
						break;
					case 'call':
						buttonNode = renderSimpleButton(main_core.Loc.getMessage('IM_PHONE_CALL'), 'im-phone-call-btn im-phone-call-btn-green', this._onMakeCallButtonClickHandler);
						buttonsFragment.appendChild(buttonNode);
						break;
					case 'answer':
						buttonNode = renderSimpleButton(main_core.Loc.getMessage('IM_PHONE_BTN_ANSWER'), 'im-phone-call-btn im-phone-call-btn-green', this._onAnswerButtonClickHandler);
						buttonsFragment.appendChild(buttonNode);
						break;
					case 'skip':
						buttonNode = renderSimpleButton(main_core.Loc.getMessage('IM_PHONE_BTN_BUSY'), 'im-phone-call-btn im-phone-call-btn-red', this._onSkipButtonClickHandler);
						buttonsFragment.appendChild(buttonNode);
						break;
					case 'hangup':
						buttonNode = renderSimpleButton(main_core.Loc.getMessage('IM_M_CALL_BTN_HANGUP'), 'im-phone-call-btn im-phone-call-btn-red  im-phone-call-btn-tube', this._onHangupButtonClickHandler);
						if (this.buttonLayout == ButtonLayouts.spaced) {
							subContainers.right.appendChild(buttonNode);
						} else {
							buttonsFragment.appendChild(buttonNode);
						}
						break;
					case 'close':
						buttonNode = renderSimpleButton(main_core.Loc.getMessage('IM_M_CALL_BTN_CLOSE'), 'im-phone-call-btn im-phone-call-btn-red', this._onCloseButtonClickHandler);
						if (this.buttonLayout == ButtonLayouts.spaced) {
							subContainers.right.appendChild(buttonNode);
						} else {
							buttonsFragment.appendChild(buttonNode);
						}
						break;
					case 'topClose':
						if (!this.isDesktop()) {
							buttonNode = main_core.Dom.create("div", {
								props: {
									className: 'im-phone-call-top-close-btn'
								},
								events: {
									click: this._onCloseButtonClickHandler
								}
							});
							topLevelButtonsFragment.appendChild(buttonNode);
						}
						break;
					case 'notifyAdmin':
						buttonNode = renderSimpleButton(main_core.Loc.getMessage('IM_M_CALL_BTN_NOTIFY_ADMIN'), 'im-phone-call-btn im-phone-call-btn-blue im-phone-call-btn-arrow', () => {
							this.backgroundWorker.isUsed ? this.backgroundWorker.emitEvent(backgroundWorkerEvents.notifyAdminButtonClick) : this.callbacks.notifyAdmin();
						});
						buttonsFragment.appendChild(buttonNode);
						break;
					case 'sipPhone':
						buttonNode = renderSimpleButton('', this.deviceCall ? 'im-phone-call-btn-phone active' : 'im-phone-call-btn-phone', this._onSwitchDeviceButtonClickHandler);
						if (this.buttonLayout == ButtonLayouts.spaced) {
							subContainers.left.appendChild(buttonNode);
						} else {
							buttonsFragment.appendChild(buttonNode);
						}
						break;
					case 'qualityMeter':
						buttonNode = main_core.Dom.create("span", {
							props: {
								className: 'im-phone-call-btn-signal'
							},
							events: {
								click: this._onQualityMeterClickHandler
							},
							children: [main_core.Dom.create("span", {
								props: {
									className: 'im-phone-call-btn-signal-icon-container'
								},
								children: [main_core.Dom.create("span", {
									props: {
										className: 'im-phone-call-btn-signal-background'
									}
								}), this.elements.qualityMeter = main_core.Dom.create("span", {
									props: {
										className: 'im-phone-call-btn-signal-active'
									},
									style: {
										width: this.getQualityMeterWidth()
									}
								})]
							})]
						});
						buttonsFragment.appendChild(buttonNode);
						break;
					case 'settings':
						// todo
						break;
					case 'next':
						buttonNode = renderSimpleButton(main_core.Loc.getMessage('IM_M_CALL_BTN_NEXT'), 'im-phone-call-btn im-phone-call-btn-gray im-phone-call-btn-arrow', this._onNextButtonClickHandler);
						buttonsFragment.appendChild(buttonNode);
						break;
					case 'redial':
						buttonNode = renderSimpleButton(main_core.Loc.getMessage('IM_M_CALL_BTN_RECALL'), 'im-phone-call-btn im-phone-call-btn-green', this._onMakeCallButtonClickHandler);
						buttonsFragment.appendChild(buttonNode);
						break;
					case 'fold':
						if (!this.isDesktop() && this.canBeFolded()) {
							buttonNode = main_core.Dom.create("div", {
								props: {
									className: 'im-phone-btn-arrow'
								},
								text: main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_FOLD'),
								events: {
									click: this._onFoldButtonClickHandler
								}
							});
							topButtonsFragment.appendChild(buttonNode);
						}
						break;
					default:
						throw "Unknown button " + buttonName;
				}
				if (buttonNode) {
					this.elements.buttons[buttonName] = buttonNode;
				}
			});
			if (this.elements.buttonsContainer) {
				main_core.Dom.clean(this.elements.buttonsContainer);
				this.elements.buttonsContainer.appendChild(buttonsFragment);
			}
			if (this.elements.topButtonsContainer) {
				main_core.Dom.clean(this.elements.topButtonsContainer);
				this.elements.topButtonsContainer.appendChild(topButtonsFragment);
			}
			if (this.elements.topLevelButtonsContainer) {
				main_core.Dom.clean(this.elements.topLevelButtonsContainer);
				this.elements.topLevelButtonsContainer.appendChild(topLevelButtonsFragment);
			}
		}
		renderButtonsFolded() {
			let buttonsFragment = document.createDocumentFragment();
			let buttonNode;
			this.elements.buttons = {};
			this.buttons.forEach(buttonName => {
				switch (buttonName) {
					case 'hangup':
						buttonNode = renderSimpleButton(main_core.Loc.getMessage('IM_M_CALL_BTN_HANGUP'), 'im-phone-call-panel-mini-cancel', this._onHangupButtonClickHandler);
						buttonsFragment.appendChild(buttonNode);
						break;
					case 'close':
						buttonNode = renderSimpleButton(main_core.Loc.getMessage('IM_M_CALL_BTN_CLOSE'), 'im-phone-call-panel-mini-cancel', this._onCloseButtonClickHandler);
						buttonsFragment.appendChild(buttonNode);
						break;
				}
			});
			if (this.elements.buttonsContainer) {
				main_core.Dom.clean(this.elements.buttonsContainer);
				this.elements.buttonsContainer.appendChild(buttonsFragment);
			}
		}
		renderCrmButtons() {
			let buttonsFragment = document.createDocumentFragment();
			this.elements.crmButtons = {};
			if (!this.elements.crmButtonsContainer) {
				return;
			}
			let buttons = ['addComment'];
			if (this.crmEntityType == 'CONTACT') {
				buttons.push('addDeal');
				buttons.push('addInvoice');
			} else if (this.crmEntityType == 'COMPANY') {
				buttons.push('addDeal');
				buttons.push('addInvoice');
			} else if (!this.crmEntityType && this.config.CRM_CREATE == 'none') {
				buttons.push('addLead');
				buttons.push('addContact');
			}
			if (buttons.length > 0) {
				buttons.forEach(buttonName => {
					let buttonNode;
					switch (buttonName) {
						case 'addComment':
							buttonNode = main_core.Dom.create("div", {
								props: {
									className: 'im-phone-call-crm-button im-phone-call-crm-button-comment' + (this.commentShown ? ' im-phone-call-crm-button-active' : '')
								},
								children: [this.elements.crmButtons.addCommentLabel = main_core.Dom.create("div", {
									props: {
										className: 'im-phone-call-crm-button-item'
									},
									text: this.commentShown ? main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_SAVE') : main_core.Loc.getMessage('IM_PHONE_ACTION_CRM_COMMENT')
								})],
								events: {
									click: this._onAddCommentButtonClick.bind(this)
								}
							});
							break;
						case 'addDeal':
							buttonNode = main_core.Dom.create("div", {
								props: {
									className: 'im-phone-call-crm-button'
								},
								children: [main_core.Dom.create("div", {
									props: {
										className: 'im-phone-call-crm-button-item'
									},
									text: main_core.Loc.getMessage('IM_PHONE_ACTION_CRM_DEAL')
								})],
								events: {
									click: this._onAddDealButtonClick.bind(this)
								}
							});
							break;
						case 'addInvoice':
							buttonNode = main_core.Dom.create("div", {
								props: {
									className: 'im-phone-call-crm-button'
								},
								children: [main_core.Dom.create("div", {
									props: {
										className: 'im-phone-call-crm-button-item'
									},
									text: main_core.Loc.getMessage('IM_PHONE_ACTION_CRM_INVOICE')
								})],
								events: {
									click: this._onAddInvoiceButtonClick.bind(this)
								}
							});
							break;
						case 'addLead':
							buttonNode = main_core.Dom.create("div", {
								props: {
									className: 'im-phone-call-crm-button'
								},
								children: [main_core.Dom.create("div", {
									props: {
										className: 'im-phone-call-crm-button-item'
									},
									text: main_core.Loc.getMessage('IM_CRM_BTN_NEW_LEAD')
								})],
								events: {
									click: this._onAddLeadButtonClick.bind(this)
								}
							});
							break;
						case 'addContact':
							buttonNode = main_core.Dom.create("div", {
								props: {
									className: 'im-phone-call-crm-button'
								},
								children: [main_core.Dom.create("div", {
									props: {
										className: 'im-phone-call-crm-button-item'
									},
									text: main_core.Loc.getMessage('IM_CRM_BTN_NEW_CONTACT')
								})],
								events: {
									click: this._onAddContactButtonClick.bind(this)
								}
							});
							break;
					}
					if (buttonNode) {
						buttonsFragment.appendChild(buttonNode);
						this.elements.crmButtons[buttonName] = buttonNode;
					}
				});
				main_core.Dom.clean(this.elements.crmButtonsContainer);
				this.elements.crmButtonsContainer.appendChild(buttonsFragment);
				this.showSections(['crmButtons']);
			} else {
				main_core.Dom.clean(this.elements.crmButtonsContainer);
				this.hideSections(['crmButtons']);
			}
		}
		loadForm(params) {
			if (!this.formManager) {
				return;
			}
			this.formManager.load({
				id: params.id,
				secCode: params.secCode
			});
		}
		unloadForm() {
			if (!this.formManager) {
				return;
			}
			this.formManager.unload();
			main_core.Dom.clean(this.elements.tabsBody.webform);
		}
		_onFormSend(e) {
			if (!this.callListView) {
				return;
			}
			var currentElement = this.callListView.getCurrentElement();
			this.callListView.setWebformResult(currentElement.ELEMENT_ID, e.resultId);
		}
		loadRestApp(params) {
			var restAppId = params.id;
			var node = params.node;
			if (this.restAppLayoutLoaded) {
				BX.rest.AppLayout.getPlacement('CALL_CARD').load(restAppId, this.getPlacementOptions());
				return;
			}
			if (this.restAppLayoutLoading) {
				return;
			}
			this.restAppLayoutLoading = true;
			BX.ajax.runAction("voximplant.callView.loadRestApp", {
				data: {
					'appId': restAppId,
					'placementOptions': this.getPlacementOptions()
				}
			}).then(response => {
				if (!this.popup && !this.isDesktop()) {
					return;
				}
				main_core.Runtime.html(node, response.data.html);
				this.restAppLayoutLoaded = true;
				this.restAppLayoutLoading = false;
				this.restAppInterface = BX.rest.AppLayout.initializePlacement('CALL_CARD');
				this.initializeAppInterface(this.restAppInterface);
			});
		}
		unloadRestApps() {
			if (!BX.rest || !BX.rest.AppLayout) {
				return false;
			}
			var placement = BX.rest.AppLayout.getPlacement('CALL_CARD');
			if (this.restAppLayoutLoaded && placement) {
				placement.destroy();
				this.restAppLayoutLoaded = false;
			}
		}
		initializeAppInterface(appInterface) {
			appInterface.prototype.events.push('CallCard::EntityChanged');
			appInterface.prototype.events.push('CallCard::BeforeClose');
			appInterface.prototype.events.push('CallCard::CallStateChanged');
			appInterface.prototype.getStatus = (params, cb) => {
				cb(this.getPlacementOptions());
			};
			appInterface.prototype.disableAutoClose = (params, cb) => {
				this.disableAutoClose();
				cb([]);
			};
			appInterface.prototype.enableAutoClose = (params, cb) => {
				this.enableAutoClose();
				cb([]);
			};
		}
		getPlacementOptions() {
			return {
				'CALL_ID': this.callId,
				'PHONE_NUMBER': this.phoneNumber === "unknown" ? undefined : this.phoneNumber,
				'LINE_NUMBER': this.lineNumber,
				'LINE_NAME': this.companyPhoneNumber,
				'CRM_ENTITY_TYPE': this.crmEntityType,
				'CRM_ENTITY_ID': this.crmEntityId,
				'CRM_ACTIVITY_ID': this.crmActivityId === 0 ? undefined : this.crmActivityId,
				'CRM_BINDINGS': this.crmBindings,
				'CALL_DIRECTION': this.direction,
				'CALL_STATE': this.callState,
				'CALL_LIST_MODE': this.callListId > 0
			};
		}
		isUnloadAllowed() {
			if (this.backgroundWorker.isActiveIntoCurrentCall()) {
				return false;
			}
			return this.folded && (this.deviceCall || this._uiState === UiState.idle || this._uiState === UiState.error || this._uiState === UiState.externalCard);
		}
		_onBeforeUnload(e) {
			if (!this.isUnloadAllowed()) {
				e.returnValue = main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_DONT_LEAVE');
				return main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_DONT_LEAVE');
			}
		}
		_onDblClick(e) {
			e.preventDefault();
			if (!this.isFolded() && this.canBeFolded()) {
				this.fold();
			}
		}
		_onHoldButtonClick() {
			if (this.isHeld()) {
				this.held = false;
				main_core.Dom.removeClass(this.elements.buttons.hold, 'active');
				if (this.isDesktop() && this.slave) {
					im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onUnHold, []);
				} else {
					this.callbacks.unhold();
				}
			} else {
				this.held = true;
				main_core.Dom.addClass(this.elements.buttons.hold, 'active');
				if (this.isDesktop() && this.slave) {
					im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onHold, []);
				} else {
					this.callbacks.hold();
				}
			}
			this.backgroundWorker.emitEvent(backgroundWorkerEvents.holdButtonClick, this.isHeld());
		}
		_onMuteButtonClick() {
			if (this.isMuted()) {
				this.muted = false;
				main_core.Dom.removeClass(this.elements.buttons.mute, 'active');
				if (this.isDesktop() && this.slave) {
					im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onUnMute, []);
				} else {
					this.callbacks.unmute();
				}
			} else {
				this.muted = true;
				main_core.Dom.addClass(this.elements.buttons.mute, 'active');
				if (this.isDesktop() && this.slave) {
					im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onMute, []);
				} else {
					this.callbacks.mute();
				}
			}
			this.backgroundWorker.emitEvent(backgroundWorkerEvents.muteButtonClick, this.isMuted());
		}
		_onTransferButtonClick() {
			this.selectTransferTarget(result => {
				this.backgroundWorker.emitEvent(backgroundWorkerEvents.transferButtonClick, result);
				if (this.isDesktop() && this.slave) {
					im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onStartTransfer, [result]);
				} else {
					this.callbacks.transfer(result);
				}
			});
		}
		_onTransferCompleteButtonClick() {
			this.backgroundWorker.emitEvent(backgroundWorkerEvents.completeTransferButtonClick);
			if (this.isDesktop() && this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onCompleteTransfer, []);
			} else {
				this.callbacks.completeTransfer();
			}
		}
		_onTransferCancelButtonClick() {
			this.backgroundWorker.emitEvent(backgroundWorkerEvents.cancelTransferButtonClick);
			if (this.isDesktop() && this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onCancelTransfer, []);
			} else {
				this.callbacks.cancelTransfer();
			}
		}
		_onDialpadButtonClick() {
			this.keypad = new Keypad({
				bindElement: this.elements.buttons.dialpad,
				hideDial: true,
				onButtonClick: e => {
					var key = e.key;
					if (this.isDesktop() && this.slave) {
						im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onDialpadButtonClicked, [key]);
					} else {
						this.callbacks.dialpadButtonClicked(key);
					}
					this.backgroundWorker.emitEvent(backgroundWorkerEvents.dialpadButtonClick, key);
				},
				onClose: () => {
					this.keypad.destroy();
					this.keypad = null;
				}
			});
			this.keypad.show();
		}
		_onHangupButtonClick() {
			this.backgroundWorker.emitEvent(backgroundWorkerEvents.hangupButtonClick);
			if (this.isDesktop() && this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onHangup, []);
			} else {
				this.callbacks.hangup();
			}
		}
		_onCloseButtonClick() {
			this.backgroundWorker.emitEvent(backgroundWorkerEvents.closeButtonClick);
			if (this.isDesktop() && this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onClose, []);
			} else {
				this.close();
			}
		}
		_onMakeCallButtonClick() {
			this.backgroundWorker.emitEvent(backgroundWorkerEvents.makeCallButtonClick);
			var event = {};
			if (this.callListId > 0) {
				this.callingEntity = this.currentEntity;
				if (this.currentEntity.phones.length === 0) {
					// show keypad and dial entered number
					this.keypad = new Keypad({
						bindElement: this.elements.buttons.call ? this.elements.buttons.call : null,
						onClose: () => {
							this.keypad.destroy();
							this.keypad = null;
						},
						onDial: e => {
							this.keypad.close();
							this.phoneNumber = e.phoneNumber;
							this.createTitle().then(title => this.setTitle(title));
							event = {
								phoneNumber: e.phoneNumber,
								crmEntityType: this.crmEntityType,
								crmEntityId: this.crmEntityId,
								callListId: this.callListId
							};
							if (this.isDesktop() && this.slave) {
								im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onCallListMakeCall, [event]);
							} else {
								this.callbacks.callListMakeCall(event);
							}
						}
					});
					this.keypad.show();
				} else if (this.currentEntity.phones.length == 1) {
					// just dial the number
					event.phoneNumber = this.currentEntity.phones[0].VALUE;
					event.crmEntityType = this.crmEntityType;
					event.crmEntityId = this.crmEntityId;
					event.callListId = this.callListId;
					if (this.isDesktop() && this.slave) {
						im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onCallListMakeCall, [event]);
					} else {
						this.callbacks.callListMakeCall(event);
					}
				} else {
					// allow user to select the number
					this.showNumberSelectMenu({
						bindElement: this.elements.buttons.call ? this.elements.buttons.call : null,
						phoneNumbers: this.currentEntity.phones,
						onSelect: e => {
							this.closeNumberSelectMenu();
							this.phoneNumber = e.phoneNumber;
							this.createTitle().then(title => this.setTitle(title));
							event = {
								phoneNumber: e.phoneNumber,
								crmEntityType: this.crmEntityType,
								crmEntityId: this.crmEntityId,
								callListId: this.callListId
							};
							if (this.isDesktop() && this.slave) {
								im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onCallListMakeCall, [event]);
							} else {
								this.callbacks.callListMakeCall(event);
							}
						}
					});
				}
			} else {
				if (this.isDesktop() && this.slave) {
					im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onMakeCall, [this.phoneNumber]);
				} else {
					this.callbacks.makeCall(this.phoneNumber);
				}
			}
		}
		_onNextButtonClick() {
			if (!this.callListView) {
				return;
			}
			this.backgroundWorker.emitEvent(backgroundWorkerEvents.nextButtonClick);
			this.setUiState(UiState.outgoing);
			this.callListView.moveToNextItem();
			this.setStatusText('');
		}
		_onRedialButtonClick(e) {}
		_onCommentChanged() {
			this.comment = this.elements.commentEditor.value;
			//Update callView close timer when printing a comment
			this.updateAutoCloseTimer();
		}
		_onAddCommentButtonClick() {
			this.commentShown = !this.commentShown;
			if (this.isDesktop() && this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onCommentShown, [this.commentShown]);
			}
			if (this.commentShown) {
				if (this.elements.crmButtons.addComment) {
					main_core.Dom.addClass(this.elements.crmButtons.addComment, 'im-phone-call-crm-button-active');
					this.elements.crmButtons.addCommentLabel.innerText = main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_SAVE');
				}
				if (this.elements.commentEditor) {
					this.elements.commentEditor.value = this.comment;
					this.elements.commentEditor.focus();
				}
				if (this.elements.commentEditorContainer) {
					this.elements.commentEditorContainer.style.removeProperty('display');
				}
			} else {
				if (this.elements.crmButtons.addComment) {
					main_core.Dom.removeClass(this.elements.crmButtons.addComment, 'im-phone-call-crm-button-active');
					this.elements.crmButtons.addCommentLabel.innerText = main_core.Loc.getMessage('IM_PHONE_ACTION_CRM_COMMENT');
				}
				if (this.elements.commentEditorContainer) {
					this.elements.commentEditorContainer.style.display = 'none';
				}
				if (this.isDesktop() && this.slave) {
					im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onSaveComment, [this.comment]);
				} else {
					this.saveComment();
				}
				this.backgroundWorker.emitEvent(backgroundWorkerEvents.addCommentButtonClick, this.comment);
			}
		}
		_onAddDealButtonClick() {
			var url = this._getCrmEditUrl('DEAL', 0);
			var externalContext = this._generateExternalContext();
			if (this.crmEntityType === 'CONTACT') {
				url = main_core.Uri.addParam(url, {
					contact_id: this.crmEntityId
				});
			} else if (this.crmEntityType === 'COMPANY') {
				url = main_core.Uri.addParam(url, {
					company_id: this.crmEntityId
				});
			}
			url = main_core.Uri.addParam(url, {
				external_context: externalContext
			});
			if (this.callListId > 0) {
				url = main_core.Uri.addParam(url, {
					call_list_id: this.callListId
				});
				url = main_core.Uri.addParam(url, {
					call_list_element: this.currentEntity.id
				});
			}
			this.externalRequests[externalContext] = {
				type: 'add',
				context: externalContext,
				window: window.open(url)
			};
		}
		_onAddInvoiceButtonClick() {
			let url = this._getCrmEditUrl('INVOICE', 0);
			const externalContext = this._generateExternalContext();
			url = main_core.Uri.addParam(url, {
				redirect: "y"
			});
			if (this.crmEntityType === 'CONTACT') {
				url = main_core.Uri.addParam(url, {
					contact: this.crmEntityId
				});
			} else if (this.crmEntityType === 'COMPANY') {
				url = main_core.Uri.addParam(url, {
					company: this.crmEntityId
				});
			}
			url = main_core.Uri.addParam(url, {
				external_context: externalContext
			});
			if (this.callListId > 0) {
				url = main_core.Uri.addParam(url, {
					call_list_id: this.callListId
				});
				url = main_core.Uri.addParam(url, {
					call_list_element: this.currentEntity.id
				});
			}
			this.externalRequests[externalContext] = {
				type: 'add',
				context: externalContext,
				window: window.open(url)
			};
		}
		_onAddLeadButtonClick() {
			let url = this._getCrmEditUrl('LEAD', 0);
			url = main_core.Uri.addParam(url, {
				phone: this.phoneNumber,
				origin_id: 'VI_' + this.callId
			});
			window.open(url);
		}
		_onAddContactButtonClick() {
			let url = this._getCrmEditUrl('CONTACT', 0);
			url = main_core.Uri.addParam(url, {
				phone: this.phoneNumber,
				origin_id: 'VI_' + this.callId
			});
			window.open(url);
		}
		_onFoldButtonClick() {
			this.fold();
		}
		_onAnswerButtonClick() {
			this.backgroundWorker.emitEvent(backgroundWorkerEvents.answerButtonClick);
			if (this.isDesktop() && this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onAnswer, []);
			} else {
				this.callbacks.answer();
			}
		}
		_onSkipButtonClick() {
			this.backgroundWorker.emitEvent(backgroundWorkerEvents.skipButtonClick);
			if (this.isDesktop() && this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onSkip, []);
			} else {
				this.callbacks.skip();
			}
		}
		_onSwitchDeviceButtonClick() {
			if (this.isDesktop() && this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onSwitchDevice, [{
					phoneNumber: this.phoneNumber
				}]);
			} else {
				this.callbacks.switchDevice({
					phoneNumber: this.phoneNumber
				});
			}
		}
		_onQualityMeterClick() {
			this.showQualityPopup({
				onSelect: qualityGrade => {
					this.backgroundWorker.emitEvent(backgroundWorkerEvents.qualityMeterClick, qualityGrade);
					this.qualityGrade = qualityGrade;
					this.closeQualityPopup();
					if (this.isDesktop() && this.slave) {
						im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onQualityGraded, [qualityGrade]);
					} else {
						this.callbacks.qualityGraded(qualityGrade);
					}
				}
			});
		}
		#onExternalEvent = params => {
			console.warn('#onExternalEvent', params);
			return;
		};
		_onPullEventCrm(command, params) {
			if (command === 'external_event') {
				if (params.NAME === 'onCrmEntityCreate' && params.IS_CANCELED == false) {
					var eventParams = params.PARAMS;
					if (this.externalRequests[eventParams.context]) {
						eventParams.entityTypeName;
						eventParams.entityInfo.id;
						if (this.callListView) {
							this.callListView.getCurrentElement();
						}
					}
				}
			}
		}
		onCallListSelectedItem(entity) {
			this.currentEntity = entity;
			this.crmEntityType = entity.type;
			this.crmEntityId = entity.id;
			this.comment = "";
			if (main_core.Type.isArray(entity.bindings)) {
				this.crmBindings = entity.bindings.map(value => {
					return {
						'ENTITY_TYPE': value.type,
						'ENTITY_ID': value.id
					};
				});
			} else {
				this.crmBindings = [];
			}
			if (entity.phones.length > 0) {
				this.phoneNumber = entity.phones[0].VALUE;
			} else {
				this.phoneNumber = 'unknown';
			}
			this.createTitle().then(title => this.setTitle(title));
			this.loadCrmCard(entity.type, entity.id);
			if (this.currentTabName === 'webform') {
				this.formManager.unload();
				this.formManager.load({
					id: this.webformId,
					secCode: this.webformSecCode,
					lang: main_core.Loc.getMessage("LANGUAGE_ID")
				});
			}
			if (this._uiState === UiState.redial) {
				this.setUiState(UiState.outgoing);
			}
			this.updateView();
		}
		#onWindowUnload = () => {
			console.log('onWindowUnload call view event', location.href, im_v2_lib_desktopApi.DesktopApi.isChatWindow());
			this.close();
		};
		showCallIcon() {
			if (!this.callListView) {
				return;
			}
			if (!this.callingEntity) {
				return;
			}
			this.callListView.setCallingElement(this.callingEntity.statusId, this.callingEntity.index);
		}
		hideCallIcon() {
			if (!this.callListView) {
				return;
			}
			this.callListView.resetCallingElement();
		}
		isTimerStarted() {
			return !!this.timerInterval;
		}
		startTimer() {
			if (this.isTimerStarted()) {
				return;
			}
			if (this.initialTimestamp === 0) {
				this.initialTimestamp = new Date().getTime();
			}
			this.timerInterval = setInterval(this.renderTimer.bind(this), 1000);
			this.renderTimer();
		}
		renderTimer() {
			if (!this.elements.timer) {
				return;
			}
			let currentTimestamp = new Date().getTime();
			let elapsedMilliSeconds = currentTimestamp - this.initialTimestamp;
			let elapsedSeconds = Math.floor(elapsedMilliSeconds / 1000);
			let minutes = Math.floor(elapsedSeconds / 60).toString();
			if (minutes.length < 2) {
				minutes = '0' + minutes;
			}
			let seconds = (elapsedSeconds % 60).toString();
			if (seconds.length < 2) {
				seconds = '0' + seconds;
			}
			const template = this.isRecording() ? main_core.Loc.getMessage('IM_PHONE_TIMER_WITH_RECORD') : main_core.Loc.getMessage('IM_PHONE_TIMER_WITHOUT_RECORD');
			if (this.isFolded()) {
				this.elements.timer.innerText = minutes + ':' + seconds;
			} else {
				this.elements.timer.innerText = template.replace('#MIN#', minutes).replace('#SEC#', seconds);
			}
		}
		stopTimer() {
			if (!this.isTimerStarted()) {
				return;
			}
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
		showQualityPopup(params) {
			if (!main_core.Type.isPlainObject(params)) {
				params = {};
			}
			if (!main_core.Type.isFunction(params.onSelect)) {
				params.onSelect = nop$1;
			}
			const elements = {
				'1': null,
				'2': null,
				'3': null,
				'4': null,
				'5': null
			};
			this.qualityPopup = new main_popup.Popup({
				id: 'PhoneCallViewQualityGrade',
				bindElement: this.elements.qualityMeter,
				targetContainer: document.body,
				darkMode: true,
				closeByEsc: true,
				autoHide: true,
				zIndex: baseZIndex + 200,
				noAllPaddings: true,
				overlay: {
					backgroundColor: 'white',
					opacity: 0
				},
				bindOptions: {
					position: 'top'
				},
				angle: {
					position: 'bottom',
					offset: 30
				},
				cacheable: false,
				content: main_core.Dom.create("div", {
					props: {
						className: 'im-phone-popup-rating'
					},
					children: [main_core.Dom.create("div", {
						props: {
							className: 'im-phone-popup-rating-title'
						},
						text: main_core.Loc.getMessage('IM_PHONE_CALL_VIEW_RATE_QUALITY')
					}), main_core.Dom.create("div", {
						props: {
							className: 'im-phone-popup-rating-stars'
						},
						children: [elements['1'] = createStar(1, this.qualityGrade == '1', params.onSelect), elements['2'] = createStar(2, this.qualityGrade == '2', params.onSelect), elements['3'] = createStar(3, this.qualityGrade == '3', params.onSelect), elements['4'] = createStar(4, this.qualityGrade == '4', params.onSelect), elements['5'] = createStar(5, this.qualityGrade == '5', params.onSelect)],
						events: {
							mouseover: () => {
								if (elements[this.qualityGrade]) {
									main_core.Dom.removeClass(elements[this.qualityGrade], 'im-phone-popup-rating-stars-item-active');
								}
							},
							mouseout: () => {
								if (elements[this.qualityGrade]) {
									main_core.Dom.addClass(elements[this.qualityGrade], 'im-phone-popup-rating-stars-item-active');
								}
							}
						}
					})]
				}),
				events: {
					onPopupClose: () => this.qualityPopup = null
				}
			});
			this.qualityPopup.show();
		}
		closeQualityPopup() {
			if (this.qualityPopup) {
				this.qualityPopup.close();
			}
		}
		saveComment() {
			this.callbacks.saveComment({
				callId: this.callId,
				comment: this.comment
			});
		}
		showNumberSelectMenu(params) {
			var menuItems = [];
			if (!main_core.Type.isPlainObject(params)) {
				params = {};
			}
			if (!main_core.Type.isArray(params.phoneNumbers)) {
				return;
			}
			params.onSelect = main_core.Type.isFunction(params.onSelect) ? params.onSelect : BX.DoNothing;
			params.phoneNumbers.forEach(phoneNumber => {
				menuItems.push({
					id: 'number-select-' + BX.util.getRandomString(10),
					text: phoneNumber.VALUE,
					onclick: () => {
						params.onSelect({
							phoneNumber: phoneNumber.VALUE
						});
					}
				});
			});
			this.numberSelectMenu = new main_popup.Menu('im-phone-call-view-number-select', params.bindElement, menuItems, {
				autoHide: true,
				offsetTop: 0,
				offsetLeft: 40,
				angle: {
					position: "top"
				},
				zIndex: baseZIndex + 200,
				closeByEsc: true,
				overlay: {
					backgroundColor: 'white',
					opacity: 0
				},
				events: {
					onPopupClose: () => this.numberSelectMenu.destroy(),
					onPopupDestroy: () => this.numberSelectMenu = null
				}
			});
			this.numberSelectMenu.show();
		}
		closeNumberSelectMenu() {
			if (this.numberSelectMenu) {
				this.numberSelectMenu.close();
			}
		}
		fold() {
			if (!this.canBeFolded()) {
				return false;
			}
			if (this.callListId > 0 && this.callState === CallState.idle) {
				this.foldCallView();
			} else {
				this.foldCall();
			}
		}
		unfold() {
			if (!this.isDesktop() && this.isFolded()) {
				main_core.Dom.remove(this.elements.main);
				this.folded = false;
				this.elements = this.unfoldedElements;
				this.show();
			}
		}
		foldCall() {
			if (this.isDesktop() || !this.popup) {
				return;
			}
			let popupNode = this.popup.getPopupContainer();
			let overlayNode = this.popup.overlay.element;
			main_core.Dom.addClass(popupNode, 'im-phone-call-view-folding');
			main_core.Dom.addClass(overlayNode, 'popup-window-overlay-im-phone-call-view-folding');
			setTimeout(() => {
				this.folded = true;
				this.popup.close();
				this.unfoldedElements = this.elements;
				main_core.Dom.removeClass(popupNode, 'im-phone-call-view-folding');
				main_core.Dom.removeClass(overlayNode, 'popup-window-overlay-im-phone-call-view-folding');
				this.reinit();
				this.enableDocumentScroll();
			}, 300);
		}
		foldCallView() {
			const popupNode = this.popup.getPopupContainer();
			const overlayNode = this.popup.overlay.element;
			main_core.Dom.addClass(popupNode, 'im-phone-call-view-folding');
			main_core.Dom.addClass(overlayNode, 'popup-window-overlay-im-phone-call-view-folding');
			setTimeout(() => {
				this.close();
				this.foldedCallView.fold({
					callListId: this.callListId,
					webformId: this.webformId,
					webformSecCode: this.webformSecCode,
					currentItemIndex: this.callListView.currentItemIndex,
					currentItemStatusId: this.callListView.currentStatusId,
					statusList: this.callListView.statuses,
					entityType: this.callListView.entityType
				}, true);
			}, 300);
		}
		bindSlaveDesktopEvents() {
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setTitle, this.setTitle.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setStatus, this.setStatusText.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setUiState, this.setUiState.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setDeviceCall, this.setDeviceCall.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setCrmEntity, this.setCrmEntity.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.reloadCrmCard, this.reloadCrmCard.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setPortalCall, this.setPortalCall.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setPortalCallUserId, this.setPortalCallUserId.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setPortalCallQueueName, this.setPortalCallQueueName.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setPortalCallData, this.setPortalCallData.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setConfig, this.setConfig.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setCallId, this.setCallId.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setLineNumber, this.setLineNumber.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setCompanyPhoneNumber, this.setCompanyPhoneNumber.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setPhoneNumber, this.setPhoneNumber.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setTransfer, this.setTransfer.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.setCallState, this.setCallState.bind(this));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.closeWindow, () => window.close());
			BX.bind(window, "beforeunload", () => {
				BX.unbindAll(window, "beforeunload");
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onBeforeUnload, []);
			});
			BX.bind(window, "resize", main_core.Runtime.debounce(() => {
				if (this.skipOnResize) {
					this.skipOnResize = false;
					return;
				}
				this.saveInitialSize(window.innerWidth, window.innerHeight);
			}, 100));
			BX.addCustomEvent("SidePanel.Slider:onOpen", event => {
				if (!event.getSlider().isSelfContained()) {
					event.denyAction();
					window.open(event.slider.url);
				}
			});

			/*BX.bind(window, "keydown", function(e)
			{
				if(e.keyCode === 27)
				{
					DesktopApi.emit(desktopEvents.onBeforeUnload, []);
				}
			}.bind(this));*/
		}
		bindMasterDesktopEvents() {
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onHold, () => this.callbacks.hold());
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onUnHold, () => this.callbacks.unhold());
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onMute, () => this.callbacks.mute());
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onUnMute, () => this.callbacks.unmute());
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onMakeCall, phoneNumber => this.callbacks.makeCall(phoneNumber));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onCallListMakeCall, e => this.callbacks.callListMakeCall(e));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onAnswer, () => this.callbacks.answer());
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onSkip, () => this.callbacks.skip());
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onHangup, () => this.callbacks.hangup());
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onClose, () => this.close());
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onStartTransfer, e => this.callbacks.transfer(e));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onCompleteTransfer, () => this.callbacks.completeTransfer());
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onCancelTransfer, () => this.callbacks.cancelTransfer());
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onSwitchDevice, e => this.callbacks.switchDevice(e));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onBeforeUnload, () => {
				this.desktop.window = null;
				this.callbacks.hangup();
				this.callbacks.close();
			}); //slave window unload
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onQualityGraded, grade => this.callbacks.qualityGraded(grade));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onDialpadButtonClicked, grade => this.callbacks.dialpadButtonClicked(grade));
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onCommentShown, commentShown => this.commentShown = commentShown);
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onSaveComment, comment => {
				this.comment = comment;
				this.saveComment();
			});
			im_v2_lib_desktopApi.DesktopApi.subscribe(desktopEvents.onSetAutoClose, autoClose => this.autoClose = autoClose);
		}
		unbindDesktopEvents() {
			for (let eventId in desktopEvents) {
				if (desktopEvents.hasOwnProperty(eventId)) {
					im_v2_lib_desktopApi.DesktopApi.unsubscribe(desktopEvents[eventId]);
				}
			}
		}
		isDesktop() {
			return this._isDesktop;
		}
		isFolded() {
			return this.folded;
		}
		canBeFolded() {
			return this.allowAutoClose && (this.callState === CallState.connected || this.callState === CallState.idle && this.callListId > 0);
		}
		getFoldedHeight() {
			if (!this.folded) {
				return 0;
			}
			if (!this.elements.main) {
				return 0;
			}
			return this.elements.main.clientHeight + (this.elements.sections.status ? this.elements.sections.status.clientHeight : 0);
		}
		isWebformSupported() {
			return !this.isDesktop() || this.desktop.isFeatureSupported('iframe');
		}
		isRestAppsSupported() {
			return !this.isDesktop() || this.desktop.isFeatureSupported('iframe');
		}
		setClosable(closable) {
			closable = closable === true;
			this.closable = closable;
			if (this.isDesktop()) ; else if (this.popup) {
				this.popup.setClosingByEsc(closable);
				//this.popup.setAutoHide(closable);
			}
		}
		isClosable() {
			return this.closable;
		}
		adjust() {
			if (this.popup) {
				this.popup.adjustPosition();
			}
			if (this.isDesktop() && this.slave) {
				if (this.currentLayout == layouts.simple) {
					this.desktop.setResizable(false);
				} else {
					this.desktop.setResizable(true);
					this.desktop.setMinSize(this.elements.sidebarContainer ? 900 : 550, 650);
				}
				this.desktop.center();
			}
		}
		resizeWindow(width, height) {
			if (!this.isDesktop() || !this.slave) {
				return false;
			}
			this.skipOnResize = true;
			this.desktop.resize(width, height);
		}
		close() {
			BX.onCustomEvent(window, 'CallCard::BeforeClose', []);
			if (this.isFolded() && this.elements.main) {
				main_core.Dom.addClass(this.elements.main, 'im-phone-call-panel-mini-closing');
				setTimeout(() => {
					main_core.Dom.remove(this.elements.main);
					this.elements = this.getInitialElements();
				}, 300);
			}
			if (this.popup) {
				this.popup.close();
			}
			if (this.desktop.window) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.closeWindow, []);
				//this.desktop.window.ExecuteCommand('close');
				//this.desktop.window = null;
			}
			this.enableDocumentScroll();
			this.callbacks.close();
			BX.onCustomEvent(window, 'CallCard::AfterClose', []);
		}
		disableAutoClose() {
			this.allowAutoClose = false;
			if (this.isDesktop() && this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onSetAutoClose, [this.allowAutoClose]);
			}
			this.renderButtons();

			//Update callView close timer on every call disableAutoClose()
			this.updateAutoCloseTimer();
		}
		enableAutoClose() {
			this.allowAutoClose = true;
			if (this.isDesktop() && this.slave) {
				im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.onSetAutoClose, [this.allowAutoClose]);
			}
			this.renderButtons();
			if (this.autoCloseTimer) {
				clearTimeout(this.autoCloseTimer);
				this.autoCloseTimer = null;
				this.autoCloseAfterTimeout();
			}
		}
		autoClose() {
			if (this.allowAutoClose && !this.commentShown) {
				this.close();
			} else {
				BX.onCustomEvent(window, 'CallCard::BeforeClose', []);
				this.autoCloseTimer = setTimeout(() => this.autoCloseAfterTimeout(), this.autoCloseTimeout);
			}
		}
		autoCloseAfterTimeout() {
			console.log('Auto close after timeout', this.commentShown, this.autoCloseTimer, BX.localStorage.get(lsKeys$1.currentCall));
			if (this.commentShown) {
				this._onAddCommentButtonClick();
			}
			if (!BX.localStorage.get(lsKeys$1.currentCall)) {
				this.close();
			}
			this.autoCloseTimer = null;
		}
		updateAutoCloseTimer() {
			if (this.autoCloseTimer) {
				clearTimeout(this.autoCloseTimer);
				this.autoCloseTimer = setTimeout(() => this.autoCloseAfterTimeout(), this.autoCloseTimeout);
			}
		}
		disableDocumentScroll() {
			const scrollWidth = window.innerWidth - document.documentElement.clientWidth;
			document.body.style.setProperty('padding-right', scrollWidth + "px");
			document.body.classList.add('im-phone-call-disable-scroll');
			const imBar = document.getElementById('bx-im-bar');
			if (imBar) {
				imBar.style.setProperty('right', scrollWidth + "px");
			}
		}
		enableDocumentScroll() {
			document.body.classList.remove('im-phone-call-disable-scroll');
			document.body.style.removeProperty('padding-right');
			const imBar = document.getElementById('bx-im-bar');
			if (imBar) {
				imBar.style.removeProperty('right');
			}
		}
		dispose() {
			window.removeEventListener('beforeunload', this._onBeforeUnloadHandler);
			BX.removeCustomEvent("onPullEvent-crm", this._onPullEventCrmHandler);
			this.unloadRestApps();
			this.unloadForm();
			if (this.isFolded() && this.elements.main) {
				main_core.Dom.addClass(this.elements.main, 'im-phone-call-panel-mini-closing');
				setTimeout(() => main_core.Dom.remove(this.elements.main), 300);
			}
			if (this.backgroundWorker) {
				this.backgroundWorker.setCallCard(null);
				this.backgroundWorker = null;
			}
			if (this.popup) {
				this.popup.destroy();
				this.popup = null;
			}
			if (this.qualityPopup) {
				this.qualityPopup.close();
			}
			if (this.keypad) {
				this.keypad.close();
			}
			if (this.numberSelectMenu) {
				this.closeNumberSelectMenu();
			}
			this.enableDocumentScroll();
			if (this.isDesktop()) {
				this.unbindDesktopEvents();
				if (this.desktop.window) {
					im_v2_lib_desktopApi.DesktopApi.emit(desktopEvents.closeWindow, []);
					//this.desktop.window.ExecuteCommand('close');
					this.desktop.window = null;
				}
				if (!this.slave) {
					window.removeEventListener('beforeunload', this.#onWindowUnload); //master window unload
				}
			} else {
				window.removeEventListener('beforeunload', this._onBeforeUnloadHandler);
			}
			if (!BX.localStorage.get(lsKeys$1.callInited) && !BX.localStorage.get(lsKeys$1.externalCall)) {
				BX.localStorage.remove(lsKeys$1.callView);
			}
		}
		canBeUnloaded() {
			if (this.backgroundWorker.isUsed()) {
				return false;
			}
			return this.allowAutoClose && this.isFolded();
		}
		isCallListMode() {
			return this.callListId > 0;
		}
		getState() {
			return {
				callId: this.callId,
				folded: this.folded,
				uiState: this._uiState,
				phoneNumber: this.phoneNumber,
				companyPhoneNumber: this.companyPhoneNumber,
				direction: this.direction,
				fromUserId: this.fromUserId,
				toUserId: this.toUserId,
				statusText: this.statusText,
				crm: this.crm,
				hasSipPhone: this.hasSipPhone,
				deviceCall: this.deviceCall,
				transfer: this.transfer,
				crmEntityType: this.crmEntityType,
				crmEntityId: this.crmEntityId,
				crmActivityId: this.crmActivityId,
				crmActivityEditUrl: this.crmActivityEditUrl,
				callListId: this.callListId,
				callListStatusId: this.callListStatusId,
				callListItemIndex: this.callListItemIndex,
				config: this.config ? this.config : '{}',
				portalCall: this.portalCall ? 'true' : 'false',
				portalCallData: this.portalCallData ? this.portalCallData : '{}',
				portalCallUserId: this.portalCallUserId,
				webformId: this.webformId,
				webformSecCode: this.webformSecCode,
				initialTimestamp: this.initialTimestamp,
				crmData: this.crmData
			};
		}
		selectTransferTarget(resultCallback) {
			resultCallback = main_core.Type.isFunction(resultCallback) ? resultCallback : BX.DoNothing;
			main_core.Runtime.loadExtension('ui.entity-selector').then(exports$1 => {
				const config = this.backgroundWorker.isUsed() ? this.getDialogConfigForBackgroundApp(resultCallback) : this.getDefaultDialogConfig(resultCallback);
				const Dialog = exports$1.Dialog;
				const transferDialog = new Dialog(config);
				transferDialog.show();
			});
		}
		getDialogConfigForBackgroundApp(resultCallback) {
			return {
				targetNode: this.elements.buttons.transfer,
				multiple: false,
				cacheable: false,
				hideOnSelect: false,
				enableSearch: true,
				entities: [{
					id: 'user',
					options: {
						inviteEmployeeLink: false,
						selectFields: ['personalPhone', 'personalMobile', 'workPhone']
					}
				}, {
					id: 'department'
				}],
				events: {
					'Item:onSelect': event => {
						event.target.deselectAll();
						const item = event.data.item;
						if (item.getEntityId() === 'user') {
							var customData = item.getCustomData();
							if (customData.get('personalPhone') || customData.get('personalMobile') || customData.get('workPhone')) {
								this.showTransferToUserMenu({
									userId: item.getId(),
									customData: Object.fromEntries(customData),
									darkMode: this.darkMode,
									onSelect: result => {
										event.target.hide();
										resultCallback({
											phoneNumber: this.phoneNumber,
											target: result.target
										});
									}
								});
							} else {
								event.target.hide();
								resultCallback({
									phoneNumber: this.phoneNumber,
									target: item.getId()
								});
							}
						}
					}
				}
			};
		}
		getDefaultDialogConfig(resultCallback) {
			return {
				targetNode: this.elements.buttons.transfer,
				multiple: false,
				cacheable: false,
				hideOnSelect: false,
				enableSearch: true,
				entities: [{
					id: 'user',
					options: {
						inviteEmployeeLink: false,
						selectFields: ['personalPhone', 'personalMobile', 'workPhone']
					}
				}, {
					id: 'department'
				}, {
					id: 'voximplant_group'
				}],
				events: {
					'Item:onSelect': event => {
						event.target.deselectAll();
						var item = event.data.item;
						if (item.getEntityId() === 'user') {
							var customData = item.getCustomData();
							if (customData.get('personalPhone') || customData.get('personalMobile') || customData.get('workPhone')) {
								this.showTransferToUserMenu({
									userId: item.getId(),
									customData: Object.fromEntries(customData),
									darkMode: this.darkMode,
									onSelect: result => {
										event.target.hide();
										resultCallback(result);
									}
								});
							} else {
								event.target.hide();
								resultCallback({
									type: 'user',
									target: item.getId()
								});
							}
						} else if (item.getEntityId() === 'voximplant_group') {
							event.target.hide();
							resultCallback({
								type: 'queue',
								target: item.getId()
							});
						}
					}
				}
			};
		}
		showTransferToUserMenu(options = {}) {
			const userId = main_core.Type.isInteger(options.userId) ? options.userId : 0;
			const userCustomData = main_core.Type.isPlainObject(options.customData) ? options.customData : {};
			const darkMode = options.darkMode === true;
			const onSelect = main_core.Type.isFunction(options.onSelect) ? options.onSelect : nop$1;
			let popup;
			const onMenuItemClick = e => {
				const type = e.currentTarget.dataset["type"];
				const target = e.currentTarget.dataset["target"];
				onSelect({
					type: type,
					target: target
				});
				popup.close();
			};
			let menuItems = [{
				icon: 'bx-messenger-menu-call-voice',
				text: main_core.Loc.getMessage('IM_PHONE_INNER_CALL'),
				dataset: {
					type: 'user',
					target: userId
				},
				onclick: onMenuItemClick
			}, {
				delimiter: true
			}];
			if (userCustomData["personalMobile"]) {
				menuItems.push({
					html: renderTransferMenuItem(main_core.Loc.getMessage("IM_PHONE_PERSONAL_MOBILE"), main_core.Text.encode(userCustomData["personalMobile"])),
					dataset: {
						type: 'pstn',
						target: userCustomData["personalMobile"]
					},
					onclick: onMenuItemClick
				});
			}
			if (userCustomData["personalPhone"]) {
				menuItems.push({
					type: "call",
					html: renderTransferMenuItem(main_core.Loc.getMessage("IM_PHONE_PERSONAL_PHONE"), main_core.Text.encode(userCustomData["personalPhone"])),
					dataset: {
						type: 'pstn',
						target: userCustomData["personalPhone"]
					},
					onclick: onMenuItemClick
				});
			}
			if (userCustomData["workPhone"]) {
				menuItems.push({
					html: renderTransferMenuItem(main_core.Loc.getMessage("IM_PHONE_WORK_PHONE"), main_core.Text.encode(userCustomData["workPhone"])),
					dataset: {
						type: 'pstn',
						target: userCustomData["workPhone"]
					},
					onclick: onMenuItemClick
				});
			}
			popup = new main_popup.Menu({
				id: "bx-messenger-phone-transfer-menu",
				bindElement: null,
				targetContainer: document.body,
				darkMode: darkMode,
				lightShadow: true,
				autoHide: true,
				closeByEsc: true,
				cacheable: false,
				overlay: {
					backgroundColor: '#FFFFFF',
					opacity: 0
				},
				items: menuItems
			});
			popup.show();
		}
	}
	function renderTransferMenuItem(surTitle, text) {
		return `<div class="transfer-menu-item-surtitle">${main_core.Text.encode(surTitle)}</div><div class="transfer-menu-item-text">${main_core.Text.encode(text)}</div>`;
	}
	function renderSimpleButton(text, className, clickCallback) {
		let params = {};
		if (main_core.Type.isStringFilled(text)) {
			params.text = text;
		}
		if (main_core.Type.isStringFilled(className)) {
			params.props = {
				className: className
			};
		}
		if (main_core.Type.isFunction(clickCallback)) {
			params.events = {
				click: clickCallback
			};
		}
		return main_core.Dom.create('span', params);
	}
	function createStar(grade, active, onSelect) {
		return main_core.Dom.create("div", {
			props: {
				className: 'im-phone-popup-rating-stars-item ' + (active ? 'im-phone-popup-rating-stars-item-active' : '')
			},
			dataset: {
				grade: grade
			},
			events: {
				click: e => {
					e.preventDefault();
					const grade = e.currentTarget.dataset.grade;
					onSelect(grade);
				}
			}
		});
	}

	const lsKeys = {
		callInited: 'viInitedCall',
		externalCall: 'viExternalCard',
		vite: 'vite',
		dialHistory: 'vox-dial-history',
		foldedView: 'vox-folded-call-card',
		callView: 'bx-vox-call-view',
		currentCall: 'bx-vox-current-call'
	};
	const Events = {
		onCallCreated: 'onCallCreated',
		onCallConnected: 'onCallConnected',
		onCallDestroyed: 'onCallDestroyed',
		onDeviceCallStarted: 'onDeviceCallStarted'
	};
	const DeviceType = {
		Webrtc: 'WEBRTC',
		Phone: 'PHONE'
	};
	class PhoneCallsController extends main_core_events.EventEmitter {
		/** @see DeviceType */

		constructor(options) {
			super();
			this.setEventNamespace('BX.Voximplant.PhoneCallsControllerOptions');
			this.subscribeFromOptions(options.events);
			this.debug = false;
			this.phoneEnabled = main_core.Type.isBoolean(options.phoneEnabled) ? options.phoneEnabled : false;
			this.userId = options.userId;
			this.userEmail = options.userEmail;
			this.isAdmin = options.isAdmin;
			const history = BX.localStorage.get(lsKeys.dialHistory);
			this.dialHistory = main_core.Type.isArray(history) ? history : [];
			this.availableLines = main_core.Type.isArray(options.availableLines) ? options.availableLines : [];
			this.defaultLineId = main_core.Type.isString(options.defaultLineId) ? options.defaultLineId : '';
			this.callInterceptAllowed = options.canInterceptCall || false;
			this.restApps = options.restApps;
			this.hasSipPhone = options.deviceActive === true;
			this.skipIncomingCallTimer = null;
			this.hasActiveCallView = false;
			this.readDefaults();
			if (main_core.Browser.isLocalStorageSupported()) {
				BX.addCustomEvent(window, "onLocalStorageSet", this.storageSet.bind(this));
			}
			BX.addCustomEvent("onPullEvent-voximplant", this.#onPullEvent.bind(this));

			// call event handlers
			this.onCallConnectedHandler = this.#onCallConnected.bind(this);
			this.onCallDisconnectedHandler = this.#onCallDisconnected.bind(this);
			this.onCallFailedHandler = this.#onCallFailed.bind(this);
			this.onProgressToneStartHandler = this.#onProgressToneStart.bind(this);
			this.onProgressToneStopHandler = this.#onProgressToneStop.bind(this);
			this.messengerFacade = options.messengerFacade;
			this.backgroundWorker = new BackgroundWorker();
			this.foldedCallView = new FoldedCallView({
				events: {
					[FoldedCallView.Events.onUnfold]: event => {
						const data = event.getData();
						this.startCallList(data.callListId, data.callListParams);
					}
				}
			});
			this.restoreFoldedCallView();
			BX.garbage(() => {
				if (this.hasActiveCall() && this.callView && this.callView.canBeUnloaded() && (this.hasExternalCall || this.deviceType === 'PHONE')) {
					BX.localStorage.set(lsKeys.foldedView, {
						callId: this.callId,
						phoneCrm: this.phoneCrm,
						deviceType: this.deviceType,
						hasExternalCall: this.hasExternalCall,
						callView: this.callView.getState()
					}, 15);
				}
			});
		}
		hasActiveCall() {
			return Boolean(this._currentCall || this.callView);
		}
		get currentCall() {
			return this._currentCall;
		}
		set currentCall(call) {
			if (this._currentCall) {
				this.#removeCallEventListeners(this._currentCall);
				this.emit(Events.onCallDestroyed, {
					call: this._currentCall
				});
			}
			call?.id() ? BX.localStorage.set(lsKeys.currentCall, call?.id(), 86400) : BX.localStorage.remove(lsKeys.currentCall);
			this._currentCall = call;
			this.hasActiveCallView = Boolean(this._currentCall);
			if (this._currentCall) {
				this.#setCallEventListeners(call);
				this.emit(Events.onCallCreated, {
					call: call
				});
			}
		}
		#setCallEventListeners(call) {
			call.addEventListener(VoxImplant.CallEvents.Connected, this.onCallConnectedHandler);
			call.addEventListener(VoxImplant.CallEvents.Disconnected, this.onCallDisconnectedHandler);
			call.addEventListener(VoxImplant.CallEvents.Failed, this.onCallFailedHandler);
			call.addEventListener(VoxImplant.CallEvents.ProgressToneStart, this.onProgressToneStartHandler);
			call.addEventListener(VoxImplant.CallEvents.ProgressToneStop, this.onProgressToneStopHandler);
		}
		#removeCallEventListeners(call) {
			call.removeEventListener(VoxImplant.CallEvents.Connected, this.onCallConnectedHandler);
			call.removeEventListener(VoxImplant.CallEvents.Disconnected, this.onCallDisconnectedHandler);
			call.removeEventListener(VoxImplant.CallEvents.Failed, this.onCallFailedHandler);
			call.removeEventListener(VoxImplant.CallEvents.ProgressToneStart, this.onProgressToneStartHandler);
			call.removeEventListener(VoxImplant.CallEvents.ProgressToneStop, this.onProgressToneStopHandler);
		}
		ready() {
			return true; // TODO ??
		}
		async readDefaults() {
			if (!localStorage) {
				return;
			}
			this.defaultMicrophone = localStorage.getItem('bx-im-settings-default-microphone');
			this.defaultCamera = localStorage.getItem('bx-im-settings-default-camera');
			this.defaultSpeaker = localStorage.getItem('bx-im-settings-default-speaker');
			this.enableMicAutoParameters = localStorage.getItem('bx-im-settings-enable-mic-auto-parameters') !== 'N';
			if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices || !this.defaultMicrophone) {
				return;
			}
			const deviceList = await navigator.mediaDevices.enumerateDevices();
			const result = deviceList.filter(device => device.kind === 'audioinput' && device.deviceId === this.defaultMicrophone);
			this.defaultMicrophone = result.length ? this.defaultMicrophone : null;
		}
		#onPullEvent(command, params) {
			const handlers = {
				'invite': this.#onPullInvite,
				'answer_self': this.#onPullAnswerSelf,
				'timeout': this.#onPullTimeout,
				'outgoing': this.#onPullOutgoing,
				'start': this.#onPullStart,
				'hold': this.#onPullHold,
				'unhold': this.#onPullUnhold,
				'update_crm': this.#onPullUpdateCrm,
				'updatePortalUser': this.#onPullUpdatePortalUser,
				'completeTransfer': this.#onPullCompleteTransfer,
				'phoneDeviceActive': this.#onPullPhoneDeviceActive,
				'changeDefaultLineId': this.#onPullChangeDefaultLineId,
				'replaceCallerId': this.#onPullReplaceCallerId,
				'showExternalCall': this.#onPullShowExternalCall,
				'hideExternalCall': this.#onPullHideExternalCall
			};
			if (handlers.hasOwnProperty(command)) {
				handlers[command].apply(this, [params]);
			}
		}
		#onPullInvite(params) {
			if (!this.phoneSupport()) {
				return false;
			}
			const popupConditions = this.callView?.popup && !this.callView?.commentShown && !this.callView?.autoCloseTimer && !this.hasActiveCallView;
			if (this.callView && !this.callView?.popup && !this.currentCall || popupConditions && !this.currentCall || this.callView && this.callView?.isFolded() && !this.currentCall || this.callView && !this.voximplantClient || this.callView && this.voximplantClient && !this.voximplantClient.connected()) {
				console.log('Close a stuck call view');
				this.#onCallViewClose();
			}
			if (BX.localStorage.get(lsKeys.callView) && this.callView?.popup && !Boolean(this._currentCall) && !this.isCallListMode() && !this.messengerFacade.hasActiveCall()) {
				this.showCallViewBalloon();
			}
			if (this.hasActiveCall() || this.isCallListMode() || this.messengerFacade.hasActiveCall()) {
				BX.rest.callMethod('voximplant.call.busy', {
					CALL_ID: params.callId,
					DEBUG_INFO: this.getDebugInfo()
				});
				return false;
			}
			if (BX.localStorage.get(lsKeys.callInited) || BX.localStorage.get(lsKeys.externalCall)) {
				return false;
			}
			this.checkDesktop().then(() => {
				this.prepareCallParams(params);
			}).catch(() => {});
		}
		prepareCallParams(params, skipCheckChatWindow = false) {
			if (params.CRM && params.CRM.FOUND) {
				this.phoneCrm = params.CRM;
			} else {
				this.phoneCrm = {};
			}
			this.phonePortalCall = !!params.portalCall;
			if (this.phonePortalCall && params.portalCallData) {
				const userData = params.portalCallData[params.portalCallUserId];
				if (userData) {
					params.callerId = userData.name;
				}
				params.phoneNumber = '';
			}
			this.phoneCallConfig = params.config ? params.config : {};
			this.phoneCallTime = 0;
			this.messengerFacade.repeatSound('ringtone', 5000, true);
			BX.rest.callMethod('voximplant.call.sendWait', {
				'CALL_ID': params.callId,
				'DEBUG_INFO': this.getDebugInfo()
			});
			this.isCallTransfer = !!params.isTransfer;
			this.displayIncomingCall({
				chatId: params.chatId,
				callId: params.callId,
				callerId: params.callerId,
				lineNumber: params.lineNumber,
				companyPhoneNumber: params.phoneNumber,
				isCallback: params.isCallback,
				showCrmCard: params.showCrmCard,
				crmEntityType: params.crmEntityType,
				crmEntityId: params.crmEntityId,
				crmActivityId: params.crmActivityId,
				crmActivityEditUrl: params.crmActivityEditUrl,
				portalCall: params.portalCall,
				portalCallUserId: params.portalCallUserId,
				portalCallData: params.portalCallData,
				config: params.config
			}, skipCheckChatWindow);
		}
		#onPullAnswerSelf(params) {
			this.clearSkipIncomingCallTimer();
			if (this.callSelfDisabled || this.callId != params.callId) {
				return false;
			}
			this.messengerFacade.stopRepeatSound('ringtone');
			this.messengerFacade.stopRepeatSound('dialtone');
			this.phoneCallFinish();
			this.callAbort();
			this.callView.close();
			this.callId = params.callId;
		}
		#onPullTimeout(params) {
			this.clearSkipIncomingCallTimer();
			if (this.phoneTransferCallId === params.callId) {
				return this.errorInviteTransfer(params.failedCode, params.failedReason);
			} else if (this.callId != params.callId) {
				return false;
			}
			clearInterval(this.phoneConnectedInterval);
			BX.localStorage.remove(lsKeys.callInited);
			var external = this.hasExternalCall;
			this.messengerFacade.stopRepeatSound('ringtone');
			this.messengerFacade.stopRepeatSound('dialtone');
			this.phoneCallFinish();
			this.callAbort();
			if (!this.callView) {
				return;
			}
			this.showCallViewBalloon();
			this.callView.setCallState(CallState.idle, {
				failedCode: params.failedCode
			});
			if (external && params.failedCode == 486) {
				this.callView.setProgress(CallProgress.offline);
				this.callView.setStatusText(main_core.Loc.getMessage('IM_PHONE_ERROR_BUSY_PHONE'));
				this.callView.setUiState(UiState.sipPhoneError);
			} else if (external && params.failedCode == 480) {
				this.callView.setProgress(CallProgress.error);
				this.callView.setStatusText(main_core.Loc.getMessage('IM_PHONE_ERROR_NA_PHONE'));
				this.callView.setUiState(UiState.sipPhoneError);
			} else {
				if (this.isCallListMode()) {
					this.callView.setStatusText('');
					this.callView.setUiState(UiState.outgoing);
				} else {
					this.callView.setStatusText(main_core.Loc.getMessage('IM_PHONE_END'));
					this.callView.setUiState(UiState.idle);
					this.callView.autoClose();
				}
			}
		}
		#onPullOutgoing(params) {
			if (this.phoneNumber && (this.phoneNumber === params.phoneNumber || params.phoneNumber.indexOf(this.phoneNumber) >= 0)) {
				this.deviceType = params.callDevice == DeviceType.Phone ? DeviceType.Phone : DeviceType.Webrtc;
				this.phonePortalCall = !!params.portalCall;
				this.phoneNumber = params.phoneNumber;
				if (this.hasExternalCall && this.deviceType == DeviceType.Phone) {
					this.callView.setProgress(CallProgress.connect);
					this.callView.setStatusText(main_core.Loc.getMessage('IM_PHONE_WAIT_ANSWER'));
				}
				this.phoneCallConfig = params.config ? params.config : {};
				this.callId = params.callId;
				this.phoneCallTime = 0;
				this.phoneCrm = params.CRM;
				if (this.callView && params.showCrmCard) {
					this.callView.setCrmData(params.CRM);
					this.callView.setCrmEntity({
						type: params.crmEntityType,
						id: params.crmEntityId,
						activityId: params.crmActivityId,
						activityEditUrl: params.crmActivityEditUrl,
						bindings: params.crmBindings
					});
					this.callView.setConfig(params.config);
					this.callView.setCallId(params.callId);
					if (params.lineNumber) {
						this.callView.setLineNumber(params.lineNumber);
					}
					if (params.lineName) {
						this.callView.setCompanyPhoneNumber(params.lineName);
					}
					this.callView.reloadCrmCard();
				}
				if (this.callView && this.phonePortalCall) {
					this.callView.setPortalCall(true);
					this.callView.setPortalCallData(params.portalCallData);
					this.callView.setPortalCallUserId(params.portalCallUserId);
					this.callView.setPortalCallQueueName(params.portalCallQueueName);
				}
			} else if (!this.hasActiveCall() && params.callDevice === DeviceType.Phone) {
				this.checkDesktop().then(() => {
					this.prepareOutgoingExternalCall(params);
				}).catch(() => {});
			}
		}
		prepareOutgoingExternalCall(params, skipCheckChatWindow = false) {
			this.deviceType = params.callDevice === DeviceType.Phone ? DeviceType.Phone : DeviceType.Webrtc;
			this.phonePortalCall = !!params.portalCall;
			this.callId = params.callId;
			this.phoneCallTime = 0;
			this.phoneCallConfig = params.config ? params.config : {};
			this.phoneCrm = params.CRM;
			this.phoneDisplayExternal({
				callId: params.callId,
				config: params.config ? params.config : {},
				phoneNumber: params.phoneNumber,
				portalCall: params.portalCall,
				portalCallUserId: params.portalCallUserId,
				portalCallData: params.portalCallData,
				portalCallQueueName: params.portalCallQueueName,
				showCrmCard: params.showCrmCard,
				crmEntityType: params.crmEntityType,
				crmEntityId: params.crmEntityId
			}, skipCheckChatWindow);
		}
		#onPullStart(params) {
			this.clearSkipIncomingCallTimer();
			if (this.phoneTransferCallId === params.callId) {
				this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_TRANSFER_CONNECTED'));
				return;
			}
			if (this.callId != params.callId) {
				return;
			}
			this.callOverlayTimer('start');
			this.messengerFacade.stopRepeatSound('ringtone');
			if (this.callId == params.callId && this.deviceType == DeviceType.Phone && (this.deviceType == params.callDevice || this.phonePortalCall)) {
				this.#onCallConnected();
			} else if (this.callId == params.callId && params.callDevice == DeviceType.Phone && this.phoneIncoming) {
				this.deviceType = DeviceType.Phone;
				if (this.callView) {
					this.callView.setDeviceCall(true);
				}
				this.#onCallConnected();
			}
			if (params.CRM) {
				this.phoneCrm = params.CRM;
			}
			if (this.phoneNumber !== '') {
				this.phoneNumberLast = this.phoneNumber;
				this.messengerFacade.setLocalConfig('phone_last', this.phoneNumber);
			}
		}
		#onPullHold(params) {
			if (this.callId == params.callId) {
				this.isCallHold = true;
			}
		}
		#onPullUnhold(params) {
			if (this.callId == params.callId) {
				this.isCallHold = false;
			}
		}
		#onPullUpdateCrm(params) {
			if (this.callId == params.callId && params.CRM && params.CRM.FOUND) {
				this.phoneCrm = params.CRM;
				if (this.callView) {
					this.callView.setCrmData(params.CRM);
					if (params.showCrmCard) {
						this.callView.setCrmEntity({
							type: params.crmEntityType,
							id: params.crmEntityId,
							activityId: params.crmActivityId,
							activityEditUrl: params.crmActivityEditUrl,
							bindings: params.crmBindings
						});
						this.callView.reloadCrmCard();
					}
				}
			}
		}
		#onPullUpdatePortalUser(params) {
			if (this.callId == params.callId && this.callView) {
				this.callView.setPortalCall(true);
				this.callView.setPortalCallData(params.portalCallData);
				this.callView.setPortalCallUserId(params.portalCallUserId);
			}
		}
		#onPullCompleteTransfer(params) {
			if (this.callId != params.callId) {
				return false;
			}
			this.callId = params.newCallId;
			this.phoneTransferTargetId = 0;
			this.phoneTransferTargetType = '';
			this.phoneTransferCallId = '';
			this.phoneTransferEnabled = false;
			BX.localStorage.set(lsKeys.vite, false, 1);
			this.deviceType = params.callDevice == DeviceType.Phone ? DeviceType.Phone : DeviceType.Webrtc;
			if (this.deviceType == DeviceType.Phone) {
				this.callView.setDeviceCall(true);
			}
			this.callView.setTransfer(false);
			this.#onCallConnected();
		}
		#onPullPhoneDeviceActive(params) {
			this.hasSipPhone = params.active == 'Y';
		}
		#onPullChangeDefaultLineId(params) {
			this.defaultLineId = params.defaultLineId;
		}
		#onPullReplaceCallerId(params) {
			var callTitle = main_core.Loc.getMessage('IM_PHONE_CALL_TRANSFER').replace('#PHONE#', params.callerId);
			this.setCallOverlayTitle(callTitle);
			this.callView.setPhoneNumber(params.callerId);
			if (params.CRM) {
				this.phoneCrm = params.CRM;
				this.callView.setCrmData(params.CRM);
				if (params.showCrmCard) {
					this.callView.setCrmEntity({
						type: params.crmEntityType,
						id: params.crmEntityId,
						activityId: params.crmActivityId,
						activityEditUrl: params.crmActivityEditUrl,
						bindings: params.crmBindings
					});
					this.callView.reloadCrmCard();
				}
			}
		}
		#onPullShowExternalCall(params) {
			if (this.messengerFacade.hasActiveCall()) {
				return false;
			}
			if (BX.localStorage.get(lsKeys.callInited) || BX.localStorage.get(lsKeys.externalCall)) {
				return false;
			}
			this.checkDesktop().then(() => {
				this.prepareExternalCall(params);
			}).catch(() => {});
		}
		prepareExternalCall(params, skipCheckChatWindow = false) {
			if (params.CRM && params.CRM.FOUND) {
				this.phoneCrm = params.CRM;
			} else {
				this.phoneCrm = {};
			}
			this.showExternalCall({
				callId: params.callId,
				fromUserId: params.fromUserId,
				toUserId: params.toUserId,
				isCallback: params.isCallback,
				phoneNumber: params.phoneNumber,
				lineNumber: params.lineNumber,
				companyPhoneNumber: params.companyPhoneNumber,
				showCrmCard: params.showCrmCard,
				crmEntityType: params.crmEntityType,
				crmEntityId: params.crmEntityId,
				crmBindings: params.crmBindings,
				crmActivityId: params.crmActivityId,
				crmActivityEditUrl: params.crmActivityEditUrl,
				config: params.config,
				portalCall: params.portalCall,
				portalCallData: params.portalCallData,
				portalCallUserId: params.portalCallUserId
			}, skipCheckChatWindow);
		}
		#onPullHideExternalCall(params) {
			if (this.hasActiveCall() && this.hasExternalCall && this.callId == params.callId) {
				this.hideExternalCall();
			}
		}
		correctPhoneNumber(number) {
			return number.toString().replace(/[^0-9+#*;,]/g, '');
		}
		#onIncomingCall(params) {
			// we can't use hasActiveCall here because the call view is open
			if (this.currentCall) {
				return false;
			}
			this.currentCall = params.call;
			this.currentCall.answer();
		}
		getCallParams() {
			let result = main_core.Type.isPlainObject(this.phoneParams) ? main_core.Runtime.clone(this.phoneParams) : {};
			if (this.phoneFullNumber != this.phoneNumber) {
				result['FULL_NUMBER'] = this.phoneFullNumber;
			}
			return JSON.stringify(result);
		}
		#startCall() {
			this.phoneParams['CALLER_ID'] = '';
			this.phoneParams['USER_ID'] = this.userId;
			this.phoneLog('Call params: ', this.phoneNumber, this.phoneParams);
			if (!this.voximplantClient.connected()) {
				this.#phoneOnSDKReady();
				return false;
			}
			this.currentCall = this.voximplantClient.call(this.phoneNumber, false, this.getCallParams());
			const initParams = {
				'NUMBER': this.phoneNumber,
				'NUMBER_USER': main_core.Text.decode(this.phoneNumberUser),
				'IM_AJAX_CALL': 'Y'
			};
			BX.rest.callMethod('voximplant.call.init', initParams).then(response => {
				const data = response.data();
				if (!(data.HR_PHOTO.length === 0)) {
					this.callOverlayUserId = data.DIALOG_ID;
				} else {
					this.callOverlayChatId = data.DIALOG_ID.substring(4);
				}
			});
		}
		phoneCallFinish() {
			clearInterval(this.phoneConnectedInterval);
			clearInterval(this.phoneCallTimeInterval);
			BX.localStorage.remove(lsKeys.callInited);
			this.callOverlayTimer('pause');
			this.showCallViewBalloon();
			if (this.currentCall) {
				try {
					this.currentCall.hangup({
						"X-Disconnect-Code": 200,
						"X-Disconnect-Reason": "Normal hangup"
					});
				} catch (e) {}
				this.currentCall = null;
				this.phoneLog('Call hangup call');
			} else {
				this.scheduleApiDisconnect();
			}
			if (this.keypad) {
				this.keypad.close();
			}
			BX.localStorage.set(lsKeys.vite, false, 1);
			this.phoneRinging = 0;
			this.phoneIncoming = false;
			this.callActive = false;
			this.callId = '';
			this.hasExternalCall = false;
			this.deviceType = DeviceType.Webrtc;
			//this.phonePortalCall = false;
			this.phoneNumber = '';
			this.phoneNumberUser = '';
			this.phoneParams = {};
			this.callOverlayOptions = {};
			this.callSelfDisabled = false;
			//this.phoneCrm = {};
			this.isMuted = false;
			this.isCallHold = false;
			this.isCallTransfer = false;
			this.phoneMicAccess = false;
			this.phoneTransferTargetType = '';
			this.phoneTransferTargetId = 0;
			this.phoneTransferCallId = '';
			this.phoneTransferEnabled = false;
		}
		phoneOnAuthResult() {
			if (this.deviceType == DeviceType.Phone) {
				return false;
			}
			if (this.phoneIncoming) {
				BX.rest.callMethod('voximplant.call.sendReady', {
					'CALL_ID': this.callId
				});
			} else if (this.callInitUserId == this.userId) {
				this.#startCall();
			}
		}
		#onCallFailed(e) {
			const headers = e.headers || {};
			this.phoneLog('Call failed', e.code, e.reason);
			var reason = main_core.Loc.getMessage('IM_PHONE_END');
			if (e.code == 603) {
				reason = main_core.Loc.getMessage('IM_PHONE_DECLINE');
			} else if (e.code == 380) {
				reason = main_core.Loc.getMessage('IM_PHONE_ERR_SIP_LICENSE');
			} else if (e.code == 436) {
				reason = main_core.Loc.getMessage('IM_PHONE_ERR_NEED_RENT');
			} else if (e.code == 438) {
				reason = main_core.Loc.getMessage('IM_PHONE_ERR_BLOCK_RENT');
			} else if (e.code == 400) {
				reason = main_core.Loc.getMessage('IM_PHONE_ERR_LICENSE');
			} else if (e.code == 401) {
				reason = main_core.Loc.getMessage('IM_PHONE_401');
			} else if (e.code == 480 || e.code == 503) {
				if (this.phoneNumber == 911 || this.phoneNumber == 112) {
					reason = main_core.Loc.getMessage('IM_PHONE_NO_EMERGENCY');
				} else {
					reason = main_core.Loc.getMessage('IM_PHONE_UNAVAILABLE');
				}
			} else if (e.code == 484 || e.code == 404) {
				if (this.phoneNumber == 911 || this.phoneNumber == 112) {
					reason = main_core.Loc.getMessage('IM_PHONE_NO_EMERGENCY');
				} else {
					reason = main_core.Loc.getMessage('IM_PHONE_INCOMPLETED');
				}
			} else if (e.code == 402) {
				if (headers.hasOwnProperty('X-Reason') && headers['X-Reason'] === "SIP_PAYMENT_REQUIRED") {
					reason = main_core.Loc.getMessage('IM_PHONE_ERR_SIP_LICENSE');
				} else {
					reason = main_core.Loc.getMessage('IM_PHONE_NO_MONEY') + (this.isAdmin ? ' ' + main_core.Loc.getMessage('IM_PHONE_PAY_URL_NEW') : '');
				}
			} else if (e.code == 486 && this.phoneRinging > 1) {
				reason = main_core.Loc.getMessage('IM_M_CALL_ST_DECLINE');
			} else if (e.code == 486) {
				reason = main_core.Loc.getMessage('IM_PHONE_ERROR_BUSY');
			} else if (e.code == 403) {
				reason = main_core.Loc.getMessage('IM_PHONE_403');
				this.phoneServer = '';
				this.phoneLogin = '';
				this.phoneCheckBalance = true;
			} else if (e.code == 504) {
				reason = main_core.Loc.getMessage('IM_PHONE_ERROR_CONNECT');
			} else {
				reason = main_core.Loc.getMessage('IM_PHONE_ERROR');
			}
			if (e.code == 408 || e.code == 403) {
				this.scheduleApiDisconnect();
			}
			this.callOverlayProgress('offline');
			this.callAbort(reason);
			this.callView.setUiState(UiState.error);
			this.callView.setCallState(CallState.idle);
		}
		scheduleApiDisconnect() {
			if (this.voximplantClient && this.voximplantClient.connected()) {
				setTimeout(() => {
					if (this.voximplantClient && this.voximplantClient.connected()) {
						this.voximplantClient.disconnect();
					}
				}, 500);
			}
		}
		#onCallDisconnected(e) {
			this.phoneLog('Call disconnected', this.currentCall ? this.currentCall.id() : '-', this.currentCall ? this.currentCall.state() : '-');
			if (this.currentCall) {
				this.phoneCallFinish();
				this.callOverlayDeleteEvents();
				this.callOverlayStatus(main_core.Loc.getMessage('IM_M_CALL_ST_END'));
				this.messengerFacade.playSound('stop');
				this.callView.setCallState(CallState.idle);
				if (this.isCallListMode()) {
					this.callView.setUiState(UiState.outgoing);
				} else {
					this.callView.setStatusText(main_core.Loc.getMessage('IM_PHONE_END'));
					this.callView.setUiState(UiState.idle);
					this.callView.autoClose();
				}
			}
			this.scheduleApiDisconnect();
		}
		#onProgressToneStart(e) {
			if (!this.currentCall) {
				return false;
			}
			this.phoneLog('Progress tone start', this.currentCall.id());
			this.phoneRinging++;
			this.callOverlayStatus(main_core.Loc.getMessage('IM_PHONE_WAIT_ANSWER'));
		}
		#onProgressToneStop(e) {
			if (!this.currentCall) {
				return false;
			}
			this.phoneLog('Progress tone stop', this.currentCall.id());
		}
		#onConnectionEstablished(e) {
			this.phoneLog('Connection established', this.voximplantClient.connected());
		}
		#onConnectionFailed(e) {
			this.phoneLog('Connection failed');
			this.phoneCallFinish();
			this.callAbort(main_core.Loc.getMessage('IM_M_CALL_ERR'));
		}
		#onConnectionClosed(e) {
			this.phoneLog('Connection closed');
		}
		#onMicResult(e) {
			this.phoneMicAccess = e.result;
			this.phoneLog('Mic Access Allowed', e.result);
			if (e.result) {
				this.callOverlayProgress('connect');
				this.callOverlayStatus(main_core.Loc.getMessage('IM_M_CALL_ST_CONNECT'));
			} else {
				this.phoneCallFinish();
				this.callOverlayProgress('offline');
				this.callAbort(main_core.Loc.getMessage('IM_M_CALL_ST_NO_ACCESS'));
				this.callView.setUiState(UiState.error);
				this.callView.setCallState(CallState.idle);
			}
		}
		#onNetStatsReceived(e) {
			if (!this.currentCall || this.currentCall.state() != "CONNECTED") {
				return false;
			}
			const percent = 100 - parseInt(e.stats.packetLoss);
			const grade = this.displayCallQuality(percent);
			this.currentCall.sendMessage(JSON.stringify({
				'COMMAND': 'meter',
				'PACKETLOSS': e.stats.packetLoss,
				'PERCENT': percent,
				'GRADE': grade
			}));
		}
		holdCall() {
			this.toggleCallHold(true);
		}
		unholdCall() {
			this.toggleCallHold(false);
		}
		toggleCallHold(state) {
			if (!this.currentCall && this.deviceType == DeviceType.Webrtc) {
				return false;
			}
			if (typeof state != 'undefined') {
				this.isCallHold = !state;
			}
			if (this.isCallHold) {
				if (this.deviceType === DeviceType.Webrtc) {
					this.currentCall.sendMessage(JSON.stringify({
						'COMMAND': 'unhold'
					}));
				} else {
					BX.rest.callMethod('voximplant.call.unhold', {
						'CALL_ID': this.callId
					});
				}
			} else {
				if (this.deviceType === DeviceType.Webrtc) {
					this.currentCall.sendMessage(JSON.stringify({
						'COMMAND': 'hold'
					}));
				} else {
					BX.rest.callMethod('voximplant.call.hold', {
						'CALL_ID': this.callId
					});
				}
			}
			this.isCallHold = !this.isCallHold;
		}
		sendDTMF(key) {
			if (!this.currentCall) {
				return false;
			}
			this.phoneLog('Send DTMF code', this.currentCall.id(), key);
			this.currentCall.sendTone(key);
		}
		startCallViaRestApp(number, lineId, params) {
			BX.rest.callMethod('voximplant.call.startViaRest', {
				'NUMBER': number,
				'LINE_ID': lineId,
				'PARAMS': params,
				'SHOW': 'Y'
			});
		}
		phoneSupport() {
			return this.phoneEnabled && (this.hasSipPhone || this.ready());
		}
		muteCall() {
			if (!this.currentCall) {
				return false;
			}
			this.isMuted = true;
			this.currentCall.muteMicrophone();
		}
		unmuteCall() {
			if (!this.currentCall) {
				return false;
			}
			this.isMuted = false;
			this.currentCall.unmuteMicrophone();
		}
		toggleCallAudio() {
			if (!this.currentCall) {
				return false;
			}
			if (this.isMuted) {
				this.currentCall.unmuteMicrophone();
				this.callView.setMuted(false);
			} else {
				this.currentCall.muteMicrophone();
			}
			this.isMuted = !this.isMuted;
		}
		phoneDeviceCall(status) {
			let result = true;
			if (typeof status == 'boolean') {
				this.messengerFacade.setLocalConfig('viDeviceCallBlock', !status);
				BX.localStorage.set('viDeviceCallBlock', !status, 86400);
				if (this.callView) {
					this.callView.setDeviceCall(status);
				}
			} else {
				let deviceCallBlock = this.messengerFacade.getLocalConfig('viDeviceCallBlock');
				if (!deviceCallBlock) {
					deviceCallBlock = BX.localStorage.get('viDeviceCallBlock');
				}
				result = this.hasSipPhone && !deviceCallBlock;
			}
			return result;
		}
		openKeyPad(e = {}) {
			if (main_core.Loc.getMessage["voximplantCanMakeCalls"] == "N") {
				main_core.Runtime.loadExtension("voximplant.common").then(() => BX.Voximplant.openLimitSlider());
				return;
			}
			this.loadPhoneLines().then(() => this.#doOpenKeyPad(e));
		}
		#doOpenKeyPad(e) {
			if (!this.phoneSupport() && !this.isRestLine(this.defaultLineId)) {
				this.showUnsupported();
				return false;
			}
			if (this.hasActiveCall() || BX.localStorage.get(lsKeys.callInited) || BX.localStorage.get(lsKeys.externalCall)) {
				return false;
			}
			if (this.keypad) {
				this.keypad.close();
				return false;
			}
			this.keypad = new Keypad({
				bindElement: e.bindElement,
				offsetTop: e.offsetTop,
				offsetLeft: e.offsetLeft,
				anglePosition: e.anglePosition,
				angleOffset: e.angleOffset,
				defaultLineId: this.defaultLineId,
				lines: this.phoneLines,
				availableLines: this.availableLines,
				history: this.dialHistory,
				callInterceptAllowed: this.callInterceptAllowed,
				onDial: this.onKeyPadDial.bind(this),
				onIntercept: this.onKeyPadIntercept.bind(this),
				onClose: () => {
					this.onKeyPadClose();
					if (main_core.Type.isFunction(e.onClose)) {
						e.onClose();
					}
				}
			});
			this.keypad.show();
		}
		onKeyPadDial(e) {
			let params = {};
			this.closeKeyPad();
			if (e.lineId) {
				params['LINE_ID'] = e.lineId;
			}
			this.phoneCall(e.phoneNumber, params);
		}
		onKeyPadIntercept(e) {
			if (!this.callInterceptAllowed) {
				this.keypad.close();
				if ('UI' in BX && 'InfoHelper' in BX.UI) {
					BX.UI.InfoHelper.show('limit_contact_center_telephony_intercept');
				}
				return;
			}
			BX.rest.callMethod('voximplant.call.intercept').then(response => {
				const data = response.data();
				if (!data.FOUND || data.FOUND == 'Y') {
					this.keypad.close();
				} else {
					if (data.ERROR) {
						this.interceptErrorPopup = new main_popup.Popup({
							id: 'intercept-call-error',
							bindElement: e.interceptButton,
							targetContainer: document.body,
							content: main_core.Text.encode(data.ERROR),
							autoHide: true,
							closeByEsc: true,
							cacheable: false,
							bindOptions: {
								position: 'bottom'
							},
							angle: {
								offset: 40
							},
							events: {
								onPopupClose: e => this.interceptErrorPopup = null
							}
						});
						this.interceptErrorPopup.show();
					}
				}
			});
		}
		onKeyPadClose() {
			this.keypad = null;
		}
		closeKeyPad() {
			if (this.keypad) {
				this.keypad.close();
			}
		}
		phoneDisplayExternal(params, skipCheckChatWindow = false) {
			var number = params.phoneNumber;
			this.phoneLog(number, params);
			this.phoneNumberUser = main_core.Text.encode(number);
			number = this.correctPhoneNumber(number);
			if (typeof params != 'object') {
				params = {};
			}
			if (this.callActive) {
				return;
			}
			if (this.callView) {
				return;
			}
			this.initiator = true;
			this.callInitUserId = this.userId;
			this.callActive = false;
			this.callUserId = 0;
			this.phoneNumber = number;
			this.callView = new PhoneCallView({
				callId: params.callId,
				config: params.config,
				direction: Direction.outgoing,
				phoneNumber: this.phoneNumber,
				statusText: main_core.Loc.getMessage('IM_M_CALL_ST_CONNECT'),
				hasSipPhone: true,
				deviceCall: true,
				portalCall: params.portalCall,
				portalCallUserId: params.portalCallUserId,
				portalCallData: params.portalCallData,
				portalCallQueueName: params.portalCallQueueName,
				crm: params.showCrmCard,
				crmEntityType: params.crmEntityType,
				crmEntityId: params.crmEntityId,
				crmData: this.phoneCrm,
				foldedCallView: this.foldedCallView,
				backgroundWorker: this.backgroundWorker,
				messengerFacade: this.messengerFacade,
				restApps: this.restApps,
				skipCheckChatWindow
			});
			this.#bindPhoneViewCallbacks(this.callView);
			this.callView.setUiState(UiState.idle);
			this.callView.setCallState(CallState.connected);
			this.callView.show();
		}
		loadPhoneLines() {
			const cachedLines = BX.localStorage.get('bx-im-phone-lines');
			if (cachedLines) {
				this.phoneLines = cachedLines;
				return Promise.resolve(cachedLines);
			}
			return new Promise((resolve, reject) => {
				if (this.phoneLines) {
					return resolve(this.phoneLines);
				}
				BX.ajax.runAction("voximplant.callView.getLines").then(response => {
					this.phoneLines = response.data;
					BX.localStorage.set('bx-im-phone-lines', this.phoneLines, 86400);
					{
						resolve(this.phoneLines);
					}
				}).catch(err => {
					console.error(err);
					reject(err);
				});
			});
		}
		isRestLine(lineId) {
			if (!this.phoneLines) {
				throw new Error("Phone lines are not loaded. Call PhoneCallsController.loadPhoneLines prior to using this method");
			}
			if (this.phoneLines.hasOwnProperty(lineId)) {
				return this.phoneLines[lineId].TYPE === 'REST';
			} else {
				return false;
			}
		}
		setPhoneNumber(phoneNumber) {
			const matches = /(\+?\d+)([;#]*)([\d,]*)/.exec(phoneNumber);
			this.phoneFullNumber = phoneNumber;
			if (matches) {
				this.phoneNumber = matches[1];
			}
		}
		phoneCall(number, params) {
			this.loadPhoneLines().then(() => this.#doPhoneCall(number, params));
		}
		#doPhoneCall(number, params = {}) {
			if (BX.localStorage.get(lsKeys.callInited) || this.callView || this.hasActiveCall()) {
				return false;
			}
			if (!this.phoneSupport()) {
				this.showUnsupported();
				return false;
			}
			if (this.keypad) {
				this.keypad.close();
			}
			if (main_core.Type.isStringFilled(number)) {
				this.addToHistory(number);
			}
			const lineId = main_core.Type.isStringFilled(params['LINE_ID']) ? params['LINE_ID'] : this.defaultLineId;
			if (this.isRestLine(lineId)) {
				this.startCallViaRestApp(number, lineId, params);
				return true;
			}
			this.phoneLog(number, params);
			this.phoneNumberUser = main_core.Text.encode(number);
			let numberOriginal = number;
			if (typeof params != 'object') {
				params = {};
			}
			const internationalNumber = this.correctPhoneNumber(number);
			if (internationalNumber.length <= 0) {
				ui_dialogs_messagebox.MessageBox.alert(main_core.Loc.getMessage('IM_PHONE_WRONG_NUMBER_DESC'), main_core.Loc.getMessage('IM_PHONE_WRONG_NUMBER'));
				return false;
			}
			this.setPhoneNumber(internationalNumber);
			this.initiator = true;
			this.callInitUserId = this.userId;
			this.callActive = false;
			this.callUserId = 0;
			this.hasExternalCall = this.phoneDeviceCall();
			this.phoneParams = params;
			this.callView = new PhoneCallView({
				darkMode: this.messengerFacade.isThemeDark(),
				phoneNumber: this.phoneFullNumber,
				callTitle: this.phoneNumberUser,
				fromUserId: this.userId,
				direction: Direction.outgoing,
				uiState: UiState.connectingOutgoing,
				status: main_core.Loc.getMessage('IM_M_CALL_ST_CONNECT'),
				hasSipPhone: this.hasSipPhone,
				deviceCall: this.hasExternalCall,
				crmData: this.phoneCrm,
				autoFold: params['AUTO_FOLD'] === true,
				foldedCallView: this.foldedCallView,
				backgroundWorker: this.backgroundWorker,
				messengerFacade: this.messengerFacade,
				restApps: this.restApps,
				skipCheckChatWindow: im_v2_lib_desktopApi.DesktopApi.isDesktop()
			});
			this.#bindPhoneViewCallbacks(this.callView);
			this.callView.show();
			this.messengerFacade.playSound("start");
			if (this.hasExternalCall) {
				this.deviceType = DeviceType.Phone;
				this.callView.setProgress(CallProgress.wait);
				this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_PHONE_NOTICE'));
				const callStartParams = {
					'NUMBER': numberOriginal.toString().replace(/[^0-9+*#,;]/g, ''),
					'PARAMS': params
				};
				BX.rest.callMethod('voximplant.call.startWithDevice', callStartParams).then(response => {
					const data = response.data();
					this.callId = data.CALL_ID;
					this.hasExternalCall = data.EXTERNAL === true;
					this.phoneCallConfig = data.CONFIG;
					this.callView.setProgress(CallProgress.wait);
					this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_WAIT_PHONE'));
					this.callView.setUiState(UiState.connectingOutgoing);
					this.callView.setCallState(CallState.connecting);
					this.emit(Events.onDeviceCallStarted, {
						callId: data.CALL_ID,
						config: data.CONFIG
					});
				}).catch(err => {
					this.callView.setProgress(CallProgress.error);
					this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_PHONE_ERROR'));
					this.callView.setUiState(UiState.error);
					this.callView.setCallState(CallState.idle);
				});
			} else {
				this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_CALL_INIT'));
				this.phoneApiInit().then(() => this.#phoneOnSDKReady());
			}
		}
		showUnsupported() {
			const messageBox = new ui_dialogs_messagebox.MessageBox({
				message: main_core.Loc.getMessage('IM_CALL_NO_WEBRT'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('IM_M_CALL_BTN_DOWNLOAD'),
				cancelCaption: main_core.Loc.getMessage('IM_NOTIFY_CONFIRM_CLOSE'),
				onOk: () => {
					const url = intranet_desktopDownload.DesktopDownload.getLinkForCurrentUser();
					window.open(url, "desktopApp");
					return true;
				}
			});
			messageBox.show();
		}
		addToHistory(phoneNumber) {
			let oldHistory = this.dialHistory;
			const phoneIndex = oldHistory.indexOf(phoneNumber);
			if (phoneIndex === 0) ; else if (phoneIndex > 0) {
				//moving number to the top
				oldHistory.splice(phoneIndex, phoneIndex);
				this.dialHistory = [phoneNumber].concat(oldHistory);
			} else {
				//adding as the top element of history
				this.dialHistory = [phoneNumber].concat(oldHistory.slice(0, 4));
			}
			BX.localStorage.set(lsKeys.dialHistory, this.dialHistory, 31536000);
			this.messengerFacade.setLocalConfig('phone-history', this.dialHistory);
		}
		startCallList(callListId, params) {
			callListId = Number(callListId);
			if (callListId === 0 || this.currentCall || this.callView || this.isCallListMode()) {
				return false;
			}
			this.foldedCallView.destroy();
			this.callListId = callListId;
			this.callView = new PhoneCallView({
				crm: true,
				callListId: callListId,
				callListStatusId: params.callListStatusId,
				callListItemIndex: params.callListItemIndex,
				direction: Direction.outgoing,
				makeCall: params.makeCall === true,
				uiState: UiState.outgoing,
				webformId: params.webformId || 0,
				webformSecCode: params.webformSecCode || '',
				hasSipPhone: this.hasSipPhone,
				deviceCall: this.phoneDeviceCall(),
				crmData: this.phoneCrm,
				foldedCallView: this.foldedCallView,
				backgroundWorker: this.backgroundWorker,
				messengerFacade: this.messengerFacade,
				restApps: this.restApps,
				skipCheckChatWindow: im_v2_lib_desktopApi.DesktopApi.isDesktop()
			});
			this.#bindPhoneViewCallbacks(this.callView);
			this.callView.show();
			return true;
		}
		isCallListMode() {
			return this.callListId > 0;
		}
		callListMakeCall(e) {
			this.loadPhoneLines().then(() => this.#doCallListMakeCall(e));
		}
		#doCallListMakeCall(e) {
			if (this.isRestLine(this.defaultLineId)) {
				this.startCallViaRestApp(e.phoneNumber, this.defaultLineId, {
					'ENTITY_TYPE': 'CRM_' + e.crmEntityType,
					'ENTITY_ID': e.crmEntityId,
					'CALL_LIST_ID': e.callListId
				});
				return true;
			}
			if (BX.localStorage.get(lsKeys.callInited)) {
				return false;
			}
			if (this.callActive) {
				return false;
			}
			if (!this.callView) {
				return false;
			}
			this.lastCallListCallParams = e;
			if (!this.phoneSupport()) {
				this.callView.setStatusText(main_core.Loc.getMessage('IM_CALL_NO_WEBRT'));
				this.callView.setUiState(UiState.error);
				this.callView.setCallState(CallState.idle);
				return false;
			}
			const number = e.phoneNumber;
			const numberOriginal = number;
			const internationalNumber = this.correctPhoneNumber(number);
			if (internationalNumber.length <= 0) {
				this.callView.setStatusText(main_core.Loc.getMessage('IM_PHONE_WRONG_NUMBER_DESC').replace("<br/>", "\n"));
				return false;
			}
			this.initiator = true;
			this.callInitUserId = this.userId;
			this.callActive = false;
			this.callUserId = 0;
			this.hasExternalCall = this.phoneDeviceCall();
			this.setPhoneNumber(internationalNumber);
			this.phoneParams = {
				'ENTITY_TYPE': 'CRM_' + e.crmEntityType,
				'ENTITY_ID': e.crmEntityId,
				'CALL_LIST_ID': e.callListId
			};
			this.messengerFacade.playSound("start");
			if (this.hasExternalCall) {
				this.deviceType = DeviceType.Phone;
				this.callView.setProgress(CallProgress.wait);
				this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_PHONE_NOTICE'));
				this.callView.setUiState(UiState.connectingOutgoing);
				this.callView.setCallState(CallState.connecting);
				const callStartParams = {
					'NUMBER': numberOriginal.toString().replace(/[^0-9+*#,;]/g, ''),
					'PARAMS': this.phoneParams
				};
				BX.rest.callMethod('voximplant.call.startWithDevice', callStartParams).then(response => {
					const data = response.data();
					this.callId = data.CALL_ID;

					// TODO: is this necessary? It did not work previously
					this.hasExternalCall = data.EXTERNAL === true;
					this.phoneCallConfig = data.CONFIG;
					this.callView.setProgress(CallProgress.wait);
					this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_WAIT_PHONE'));
					this.callView.setUiState(UiState.connectingOutgoing);
					this.callView.setCallState(CallState.connecting);
					this.emit(Events.onDeviceCallStarted, {
						callId: data.CALL_ID,
						config: data.CONFIG
					});
				}).catch(err => {
					this.callView.setProgress(CallProgress.error);
					this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_PHONE_ERROR'));
					this.callView.setUiState(UiState.error);
					this.callView.setCallState(CallState.idle);
				});
			} else {
				this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_CALL_INIT'));
				this.callView.setUiState(UiState.connectingOutgoing);
				this.callView.setCallState(CallState.connecting);
				this.phoneApiInit().then(() => this.#phoneOnSDKReady());
			}
		}
		phoneIncomingAnswer() {
			this.clearSkipIncomingCallTimer();
			this.messengerFacade.stopRepeatSound('ringtone');
			this.callSelfDisabled = true;
			BX.rest.callMethod('voximplant.call.answer', {
				'CALL_ID': this.callId
			});
			if (this.keypad) {
				this.keypad.close();
			}
			this.callView.setUiState(UiState.connectingIncoming);
			this.callView.setCallState(CallState.connecting);
			this.phoneApiInit().then(() => BX.rest.callMethod('voximplant.call.sendReady', {
				'CALL_ID': this.callId
			}));
		}
		phoneApiInit() {
			if (!this.phoneSupport()) {
				return Promise.reject('Telephony is not supported');
			}
			if (this.voximplantClient && this.voximplantClient.connected()) {
				if (this.defaultMicrophone) {
					this.voximplantClient.useAudioSource(this.defaultMicrophone);
				}
				if (this.defaultSpeaker) {
					VoxImplant.Hardware.AudioDeviceManager.get().setDefaultAudioSettings({
						outputId: this.defaultSpeaker
					});
				}
				return Promise.resolve();
			}
			let phoneApiParameters = {
				useRTCOnly: true,
				micRequired: true,
				videoSupport: false,
				progressTone: false
			};
			if (this.enableMicAutoParameters === false) {
				phoneApiParameters.audioConstraints = {
					optional: [{
						echoCancellation: false
					}, {
						googEchoCancellation: false
					}, {
						googEchoCancellation2: false
					}, {
						googDAEchoCancellation: false
					}, {
						googAutoGainControl: false
					}, {
						googAutoGainControl2: false
					}, {
						mozAutoGainControl: false
					}, {
						googNoiseSuppression: false
					}, {
						googNoiseSuppression2: false
					}, {
						googHighpassFilter: false
					}, {
						googTypingNoiseDetection: false
					}, {
						googAudioMirroring: false
					}]
				};
			}
			return new Promise((resolve, reject) => {
				BX.Voximplant.getClient({
					debug: this.debug,
					apiParameters: phoneApiParameters
				}).then(client => {
					this.voximplantClient = client;
					if (this.defaultMicrophone) {
						this.voximplantClient.useAudioSource(this.defaultMicrophone);
					}
					if (this.defaultSpeaker) {
						VoxImplant.Hardware.AudioDeviceManager.get().setDefaultAudioSettings({
							outputId: this.defaultSpeaker
						});
					}
					if (this.messengerFacade.isDesktop() && main_core.Type.isFunction(this.voximplantClient.setLoggerCallback)) {
						this.voximplantClient.enableSilentLogging();
						this.voximplantClient.setLoggerCallback(e => this.phoneLog(e.label + ": " + e.message));
					}
					this.voximplantClient.addEventListener(VoxImplant.Events.ConnectionFailed, this.#onConnectionFailed.bind(this));
					this.voximplantClient.addEventListener(VoxImplant.Events.ConnectionClosed, this.#onConnectionClosed.bind(this));
					this.voximplantClient.addEventListener(VoxImplant.Events.IncomingCall, this.#onIncomingCall.bind(this));
					this.voximplantClient.addEventListener(VoxImplant.Events.MicAccessResult, this.#onMicResult.bind(this));
					this.voximplantClient.addEventListener(VoxImplant.Events.SourcesInfoUpdated, this.phoneOnInfoUpdated.bind(this));
					this.voximplantClient.addEventListener(VoxImplant.Events.NetStatsReceived, this.#onNetStatsReceived.bind(this));
					resolve();
				}).catch(e => {
					BX.rest.callMethod('voximplant.call.onConnectionError', {
						'CALL_ID': this.callId,
						'ERROR': e
					});
					this.phoneCallFinish();
					this.messengerFacade.playSound('error');
					this.callOverlayProgress('offline');
					this.callAbort(main_core.Loc.getMessage('IM_PHONE_ERROR'));
					this.callView.setUiState(UiState.error);
					this.callView.setCallState(CallState.idle);
					reject('Could not connect to Voximplant cloud');
				});
			});
		}
		#phoneOnSDKReady(params) {
			this.phoneLog('SDK ready');
			params = params || {};
			params.delay = params.delay || false;
			if (!params.delay && this.hasSipPhone) {
				if (!this.phoneIncoming && !this.phoneDeviceCall()) {
					this.callOverlayProgress('wait');
					this.callDialogAllowTimeout = setTimeout(() => this.#phoneOnSDKReady({
						delay: true
					}), 5000);
					return false;
				}
			}
			this.phoneLog('Connection exists');
			this.callView.setProgress(CallProgress.connect);
			this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_CONNECT'));
			this.phoneOnAuthResult({
				result: true
			});
			this.callView.setCallState(CallState.connecting);
			if (this.phoneIncoming) {
				this.callView.setUiState(UiState.connectingIncoming);
			} else {
				this.callView.setUiState(UiState.connectingOutgoing);
			}
		}
		phoneOnInfoUpdated(e) {
			this.phoneLog('Info updated', this.voximplantClient.audioSources(), this.voximplantClient.videoSources());
		}
		#onCallConnected(e) {
			this.clearSkipIncomingCallTimer();
			this.messengerFacade.stopRepeatSound('ringtone', 5000);
			BX.localStorage.set(lsKeys.callInited, true, 7);
			clearInterval(this.phoneConnectedInterval);
			this.phoneConnectedInterval = setInterval(() => BX.localStorage.set(lsKeys.callInited, true, 7), 5000);

			// this.desktop.closeTopmostWindow();

			this.phoneLog('Call connected', e);
			if (this.callView) {
				BX.localStorage.set(lsKeys.callView, this.callView.callId, 86400);
				this.callView.setUiState(UiState.connected);
				this.callView.setCallState(CallState.connected);
				this.callView.setProgress(CallProgress.online);
				this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_ONLINE'));
			}
			this.callActive = true;
			this.emit(Events.onCallConnected, {
				call: this.currentCall,
				isIncoming: this.phoneIncoming,
				isDeviceCall: this.phoneDeviceCall()
			});
		}
		#bindPhoneViewCallbacks(callView) {
			if (!callView instanceof PhoneCallView) {
				return false;
			}
			callView.setCallback('mute', this.#onCallViewMute.bind(this));
			callView.setCallback('unmute', this.#onCallViewUnmute.bind(this));
			callView.setCallback('hold', this.#onCallViewHold.bind(this));
			callView.setCallback('unhold', this.#onCallViewUnhold.bind(this));
			callView.setCallback('answer', this.#onCallViewAnswer.bind(this));
			callView.setCallback('skip', this.#onCallViewSkip.bind(this));
			callView.setCallback('hangup', this.#onCallViewHangup.bind(this));
			callView.setCallback('transfer', this.#onCallViewTransfer.bind(this));
			callView.setCallback('cancelTransfer', this.#onCallViewCancelTransfer.bind(this));
			callView.setCallback('completeTransfer', this.#onCallViewCompleteTransfer.bind(this));
			callView.setCallback('callListMakeCall', this.#onCallViewCallListMakeCall.bind(this));
			callView.setCallback('close', this.#onCallViewClose.bind(this));
			callView.setCallback('switchDevice', this.#onCallViewSwitchDevice.bind(this));
			callView.setCallback('qualityGraded', this.#onCallViewQualityGraded.bind(this));
			callView.setCallback('dialpadButtonClicked', this.#onCallViewDialpadButtonClicked.bind(this));
			callView.setCallback('saveComment', this.#onCallViewSaveComment.bind(this));
		}
		#onCallViewMute() {
			this.muteCall();
		}
		#onCallViewUnmute() {
			this.unmuteCall();
		}
		#onCallViewHold() {
			this.holdCall();
		}
		#onCallViewUnhold() {
			this.unholdCall();
		}
		#onCallViewAnswer() {
			this.phoneIncomingAnswer();
		}
		#onCallViewSkip() {
			BX.rest.callMethod('voximplant.call.skip', {
				'CALL_ID': this.callId
			});
			this.phoneCallFinish();
			this.callAbort();
			this.callView.close();
		}
		#onCallViewHangup() {
			if (this.hasExternalCall && this.callId) {
				BX.rest.callMethod('voximplant.call.hangupDevice', {
					'CALL_ID': this.callId
				});
			}
			this.phoneCallFinish();
			this.messengerFacade.playSound('stop');
			if (!this.callView) {
				return;
			}
			this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_FINISHED'));
			this.callView.setCallState(CallState.idle);
			if (this.isCallListMode()) {
				this.callView.setUiState(UiState.outgoing);
				if (this.callView.isFolded()) {
					this.callView.unfold();
				}
			} else {
				this.callView.close();
			}
		}
		#onCallViewTransfer(e) {
			if (e.type == 'user' || e.type == 'pstn' || e.type == 'queue') {
				this.phoneTransferTargetType = e.type;
				this.phoneTransferTargetId = e.target;
				this.sendInviteTransfer();
			} else {
				console.error('Unknown transfer type', e);
			}
		}
		#onCallViewCancelTransfer(e) {
			this.cancelInviteTransfer(e);
		}
		#onCallViewCompleteTransfer(e) {
			this.completeTransfer(e);
		}
		#onCallViewCallListMakeCall(e) {
			this.callListMakeCall(e);
		}
		#onCallViewClose() {
			this.clearSkipIncomingCallTimer();
			this.messengerFacade.stopRepeatSound('ringtone');
			this.messengerFacade.stopRepeatSound('dialtone');
			this.callListId = 0;
			if (this.callView) {
				this.callView.dispose();
				this.closeCallViewBalloon();
				this.callView = null;
			}
			this.hasActiveCallView = false;
			if (this.deviceType == DeviceType.Phone) {
				this.callId = '';
				this.callActive = false;
				this.hasExternalCall = false;
				this.callSelfDisabled = false;
				clearInterval(this.phoneConnectedInterval);
				BX.localStorage.set(lsKeys.externalCall, false);
			}
		}
		#onCallViewSwitchDevice(e) {
			var phoneNumber = e.phoneNumber;
			var lastCallListCallParams = this.lastCallListCallParams;
			if (this.hasExternalCall && this.callId) {
				BX.rest.callMethod('voximplant.call.hangupDevice', {
					'CALL_ID': this.callId
				});
			}
			this.phoneCallFinish();
			this.callAbort();
			this.phoneDeviceCall(!this.phoneDeviceCall());
			this.callView.setDeviceCall(this.phoneDeviceCall());
			if (this.isCallListMode()) {
				this.callListMakeCall(lastCallListCallParams);
			} else {
				this.callView.close();
				this.phoneCall(phoneNumber);
			}
		}
		#onCallViewQualityGraded(grade) {
			var message = {
				COMMAND: 'gradeQuality',
				grade: grade
			};
			if (this.currentCall) {
				this.currentCall.sendMessage(JSON.stringify(message));
			}
		}
		#onCallViewDialpadButtonClicked(key) {
			this.sendDTMF(key);
		}
		#onCallViewSaveComment(e) {
			BX.rest.callMethod("voximplant.call.saveComment", {
				'CALL_ID': e.callId,
				'COMMENT': e.comment
			});
		}
		displayIncomingCall(params, skipCheckChatWindow = false) {
			/*chatId, callId, callerId, lineNumber, companyPhoneNumber, isCallback*/
			params.isCallback = !!params.isCallback;
			this.phoneLog('incoming call', params);
			if (!this.phoneSupport()) {
				this.showUnsupported();
				return false;
			}
			this.phoneNumberUser = main_core.Text.encode(params.callerId);
			params.callerId = params.callerId.replace(/[^a-zA-Z0-9\.]/g, '');
			if (this.callActive) {
				return false;
			}
			this.initiator = true;
			this.callInitUserId = 0;
			this.callActive = false;
			this.callUserId = 0;
			this.phoneIncoming = true;
			this.callId = params.callId;
			this.phoneNumber = params.callerId;
			this.phoneParams = {};
			const direction = params.isCallback ? Direction.callback : Direction.incoming;
			this.callView = new PhoneCallView({
				userId: this.userId,
				phoneNumber: this.phoneNumber,
				lineNumber: params.lineNumber,
				companyPhoneNumber: params.companyPhoneNumber,
				callTitle: this.phoneNumberUser,
				direction: direction,
				transfer: this.isCallTransfer,
				statusText: params.isCallback ? main_core.Loc.getMessage('IM_PHONE_INVITE_CALLBACK') : main_core.Loc.getMessage('IM_PHONE_INVITE'),
				crm: params.showCrmCard,
				crmEntityType: params.crmEntityType,
				crmEntityId: params.crmEntityId,
				crmActivityId: params.crmActivityId,
				crmActivityEditUrl: params.crmActivityEditUrl,
				callId: this.callId,
				crmData: this.phoneCrm,
				foldedCallView: this.foldedCallView,
				backgroundWorker: this.backgroundWorker,
				messengerFacade: this.messengerFacade,
				restApps: this.restApps,
				skipCheckChatWindow
			});
			this.#bindPhoneViewCallbacks(this.callView);
			this.callView.setUiState(UiState.incoming);
			this.callView.setCallState(CallState.connecting);
			if (params.config) {
				this.callView.setConfig(params.config);
			}
			this.callView.show();
			if (params.portalCall) {
				this.callView.setPortalCall(true);
				this.callView.setPortalCallData(params.portalCallData);
				this.callView.setPortalCallUserId(params.portalCallUserId);
			}
			this.hasActiveCallView = true;
			this.skipIncomingCallTimer = setTimeout(() => {
				console.log('Skip phone call by timer');
				if (!this.currentCall) {
					this.callView?._onSkipButtonClick();
				}
				this.skipIncomingCallTimer = null;
			}, 40000);
		}
		sendInviteTransfer() {
			if (!this.currentCall && this.deviceType == DeviceType.Webrtc) {
				return false;
			}
			if (!this.phoneTransferTargetType || !this.phoneTransferTargetId) {
				return false;
			}
			const transferParams = {
				'CALL_ID': this.callId,
				'TARGET_TYPE': this.phoneTransferTargetType,
				'TARGET_ID': this.phoneTransferTargetId
			};
			BX.rest.callMethod('voximplant.call.startTransfer', transferParams).then(response => {
				const data = response.data();
				if (data.SUCCESS == 'Y') {
					this.phoneTransferEnabled = true;
					BX.localStorage.set(lsKeys.vite, true, 1);
					this.phoneTransferCallId = data.DATA.CALL.CALL_ID;
					this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_TRANSFER'));
					this.callView.setUiState(UiState.transferring);
				} else {
					console.error("Could not start call transfer. Error: ", data.ERRORS);
				}
			});
		}
		cancelInviteTransfer() {
			if (!this.currentCall && this.deviceType == DeviceType.Webrtc) {
				return false;
			}
			this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_ONLINE'));
			this.callView.setUiState(UiState.connected);
			if (this.phoneTransferCallId !== '') {
				BX.rest.callMethod('voximplant.call.cancelTransfer', {
					'CALL_ID': this.phoneTransferCallId
				});
			}
			this.phoneTransferTargetId = 0;
			this.phoneTransferTargetType = '';
			this.phoneTransferCallId = '';
			this.phoneTransferEnabled = false;
			BX.localStorage.set(lsKeys.vite, false, 1);
		}
		errorInviteTransfer(code, reason) {
			if (code == '403' || code == '410' || code == '486') {
				this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_TRANSFER_' + code));
			} else {
				this.callView.setStatusText(main_core.Loc.getMessage('IM_M_CALL_ST_TRANSFER_1'));
			}
			this.messengerFacade.playSound('error', true);
			this.callView.setUiState(UiState.transferFailed);
			this.phoneTransferTargetId = 0;
			this.phoneTransferTargetType = '';
			this.phoneTransferCallId = '';
			this.phoneTransferEnabled = false;
			BX.localStorage.set(lsKeys.vite, false, 1);
		}
		completeTransfer() {
			BX.rest.callMethod('voximplant.call.completeTransfer', {
				'CALL_ID': this.phoneTransferCallId
			});
		}
		showExternalCall(params, skipCheckChatWindow = false) {
			var direction;
			if (this.callView) {
				return;
			}
			setTimeout(() => BX.localStorage.set(lsKeys.externalCall, true, 5), 100);
			clearInterval(this.phoneConnectedInterval);
			this.phoneConnectedInterval = setInterval(() => {
				if (this.hasExternalCall) {
					BX.localStorage.set(lsKeys.externalCall, true, 5);
				}
			}, 5000);
			this.callId = params.callId;
			this.callActive = true;
			this.hasExternalCall = true;
			if (params.isCallback) {
				direction = Direction.callback;
			} else if (params.fromUserId > 0) {
				direction = Direction.outgoing;
			} else {
				direction = Direction.incoming;
			}
			this.callView = new PhoneCallView({
				callId: params.callId,
				direction: direction,
				phoneNumber: params.phoneNumber,
				lineNumber: params.lineNumber,
				companyPhoneNumber: params.companyPhoneNumber,
				fromUserId: params.fromUserId,
				toUserId: params.toUserId,
				crm: params.showCrmCard,
				crmEntityType: params.crmEntityType,
				crmEntityId: params.crmEntityId,
				crmBindings: params.crmBindings,
				crmActivityId: params.crmActivityId,
				crmActivityEditUrl: params.crmActivityEditUrl,
				crmData: this.phoneCrm,
				isExternalCall: true,
				foldedCallView: this.foldedCallView,
				backgroundWorker: this.backgroundWorker,
				messengerFacade: this.messengerFacade,
				restApps: this.restApps,
				skipCheckChatWindow
			});
			this.bindPhoneViewCallbacksExternalCall(this.callView);
			this.callView.setUiState(UiState.externalCard);
			this.callView.setCallState(CallState.connected);
			this.callView.setConfig(params.config);
			this.callView.show();
			if (params.portalCall) {
				this.callView.setPortalCall(true);
				this.callView.setPortalCallData(params.portalCallData);
				this.callView.setPortalCallUserId(params.portalCallUserId);
			}
		}
		bindPhoneViewCallbacksExternalCall(callView) {
			callView.setCallback('close', () => {
				if (this.callView) {
					this.callView.dispose();
					this.closeCallViewBalloon();
					this.callView = null;
				}
				this.hasActiveCallView = false;
				this.callId = '';
				this.callActive = false;
				this.hasExternalCall = false;
				this.callSelfDisabled = false;
				clearInterval(this.phoneConnectedInterval);
				BX.localStorage.set(lsKeys.externalCall, false);
			});
			callView.setCallback('saveComment', this.#onCallViewSaveComment.bind(this));
		}
		hideExternalCall(clearFlag) {
			if (this.callView && !this.callView.isCallListMode()) {
				this.callView.autoClose();
			}
		}
		phoneLog() {
			if (this.messengerFacade.isDesktop()) {
				let text = '';
				for (let i = 0; i < arguments.length; i++) {
					if (BX.type.isPlainObject(arguments[i])) {
						try {
							text = text + ' | ' + JSON.stringify(arguments[i]);
						} catch (e) {
							text = text + ' | (circular structure)';
						}
					} else {
						text = text + ' | ' + arguments[i];
					}
				}
				im_v2_lib_desktopApi.DesktopApi.writeToLogFile('phone.' + this.userEmail + '.log', text.substring(3));
			}
			if (this.debug) {
				if (console) {
					try {
						console.log('Phone Log', JSON.stringify(arguments));
					} catch (e) {
						console.log('Phone Log', arguments[0]);
					}
				}
			}
		}

		/**
		 * Returns promise which will be resolved if
		 *  - either Bitrix Desktop is found and this code is running inside it
		 *  - or no Bitrix Desktop found
		 * @returns {Promise}
		 */
		checkDesktop() {
			if (main_core.Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager')) {
				return new Promise(resolve => {
					const desktop = BX.Messenger.v2.Lib.DesktopManager.getInstance();
					desktop.checkStatusInDifferentContext().then(result => {
						if (result === false) {
							resolve();
						}
					});
				});
			}
			if (main_core.Reflection.getClass('BX.desktopUtils')) {
				return new Promise(resolve => {
					BX.desktopUtils.runningCheck(() => {}, () => resolve());
				});
			}
			return Promise.resolve();
		}
		restoreFoldedCallView() {
			const callProperties = BX.localStorage.get(lsKeys.foldedView);
			if (!main_core.Type.isPlainObject(callProperties)) {
				return;
			}
			this.callActive = true;
			this.callId = callProperties.callId;
			this.phoneCrm = callProperties.phoneCrm;
			this.deviceType = callProperties.phoneCallDevice;
			this.hasExternalCall = callProperties.hasExternalCall;
			let callViewProperties = callProperties.callView;
			callViewProperties.foldedCallView = this.foldedCallView;
			callViewProperties.backgroundWorker = this.backgroundWorker;
			callViewProperties.messengerFacade = this.messengerFacade;
			this.callView = new PhoneCallView(callProperties.callView);
			if (this.hasExternalCall) {
				this.callView.setUiState(UiState.externalCard);
				this.callView.setCallState(CallState.connected);
				this.bindPhoneViewCallbacksExternalCall(this.callView);
			} else {
				this.#bindPhoneViewCallbacks(this.callView);
			}
			if (this.hasExternalCall) {
				BX.localStorage.set(lsKeys.externalCall, true, 5);
				this.phoneConnectedInterval = setInterval(() => {
					if (this.hasExternalCall) {
						BX.localStorage.set(lsKeys.externalCall, true, 5);
					}
				}, 5000);
			}
			BX.rest.callMethod('voximplant.call.get', {
				'CALL_ID': this.callId
			}).catch(() => {
				// call is not found

				this.callId = '';
				this.callActive = false;
				this.hasExternalCall = false;
				this.callSelfDisabled = false;
				clearInterval(this.phoneConnectedInterval);
				BX.localStorage.set(lsKeys.externalCall, false);
				if (this.callView) {
					this.callView.dispose();
					this.closeCallViewBalloon();
					this.callView = null;
				}
				this.hasActiveCallView = false;
			});
		}
		displayCallQuality(percent) {
			if (!this.currentCall || this.currentCall.state() != "CONNECTED") {
				return false;
			}
			let grade = 5;
			if (100 == percent) {
				grade = 5;
			} else if (percent >= 99) {
				grade = 4;
			} else if (percent >= 97) {
				grade = 3;
			} else if (percent >= 95) {
				grade = 2;
			} else {
				grade = 1;
			}
			this.callView.setQuality(grade);
			return grade;
		}
		callOverlayProgress(progress) {
			if (this.callView) {
				this.callView.setProgress(progress);
				if (progress === 'offline') {
					this.messengerFacade.playSound('error');
				}
			}
		}
		callOverlayStatus(status) {
			if (!main_core.Type.isStringFilled(status)) {
				return false;
			}
			if (this.callView) {
				this.callView.setStatusText(status);
			}
		}
		setCallOverlayTitle(title) {
			if (this.callView) {
				this.callView.setTitle(title);
			}
		}
		callOverlayTimer(state)
		// TODO not ready yet
		{
			state = typeof state == 'undefined' ? 'start' : state;
			if (state == 'start') {
				this.phoneCallTimeInterval = setInterval(() => this.phoneCallTime++, 1000);
			} else {
				clearInterval(this.phoneCallTimeInterval);
			}
		}
		callAbort(reason) {
			this.callOverlayDeleteEvents();
			if (reason && this.callView) {
				if (this.callView) {
					this.callView.setStatusText(reason);
				}
			}
		}
		callOverlayDeleteEvents() {
			// this.desktop.closeTopmostWindow();

			this.phoneCallFinish();
			this.clearSkipIncomingCallTimer();
			this.messengerFacade.stopRepeatSound('ringtone');
			this.messengerFacade.stopRepeatSound('dialtone');
			clearTimeout(this.callDialogAllowTimeout);
			if (this.callDialogAllow) {
				this.callDialogAllow.close();
			}
		}
		storageSet(params) {
			if (params.key == lsKeys.vite) {
				if (params.value === true || !this.callSelfDisabled) {
					this.phoneTransferEnabled = params.value;
				}
			} else if (params.key == lsKeys.externalCall) {
				if (params.value === false) {
					this.hideExternalCall();
				}
			}
		}
		getDebugInfo() {
			return {
				vInitedCall: BX.localStorage.get('vInitedCall') ? 'Y' : 'N',
				isDesktop: this.messengerFacade.isDesktop() ? 'Y' : 'N',
				appVersion: navigator.appVersion,
				hasActiveCall: this.messengerFacade.hasActiveCall() ? 'Y' : 'N',
				isCallListMode: this.isCallListMode() ? this.callListId : 'N',
				currentCall: this.currentCall ? this.currentCall.id() : 'N',
				callView: this.callView ? this.callView.callId : 'N',
				callViewPopup: this.callView?.popup ? 'Y' : 'N',
				hasActiveCallView: this.hasActiveCallView ? 'Y' : 'N',
				isFoldedCallView: this.callView?.isFolded() ? 'Y' : 'N',
				voximplantClient: this.voximplantClient ? this.voximplantClient?.connected() : 'N'
			};
		}
		showNotification(notificationText, actions, params = {}) {
			if (!actions) {
				actions = [];
			}
			const options = {
				content: main_core.Text.encode(notificationText),
				position: "top-right",
				closeButton: true,
				actions: actions
			};
			if (params.autoHideDelay) {
				options.autoHideDelay = params.autoHideDelay;
			} else {
				options.autoHide = false;
			}
			return BX.UI.Notification.Center.notify(options);
		}
		showCallViewBalloon() {
			if (!this.openedCallViewBalloon && this.callView) {
				this.openedCallViewBalloon = this.showNotification(main_core.Loc.getMessage('VOXIMPLANT_WARN_CLOSE_CALL_VIEW'));
			}
		}
		closeCallViewBalloon() {
			if (this.openedCallViewBalloon) {
				this.openedCallViewBalloon.close();
				this.openedCallViewBalloon = null;
			}
		}
		clearSkipIncomingCallTimer() {
			if (this.skipIncomingCallTimer) {
				console.log('Clear skip incoming call timer: ' + this.skipIncomingCallTimer);
				clearTimeout(this.skipIncomingCallTimer);
				this.skipIncomingCallTimer = null;
			}
		}
		testSimple() {
			const callId = 'test-call';
			this.callView = new PhoneCallView({
				callId,
				restApps: this.restApps,
				foldedCallView: this.foldedCallView,
				backgroundWorker: this.backgroundWorker,
				messengerFacade: this.messengerFacade,
				darkMode: this.messengerFacade.isThemeDark(),
				events: {
					close: () => {
						console.trace('close');
						this.callView?.dispose();
						this.callView = null;
					},
					hangup: () => this.callView.close(),
					transfer: e => console.log('transfer', e),
					dialpadButtonClicked: e => console.log('dialpadButtonClicked', e),
					hold: () => console.log('hold'),
					unhold: () => console.log('unhold'),
					mute: () => console.log('mute'),
					unmute: () => console.log('unmute')
				}
			});
			this.callView.show();
		}
		testCrm() {}
		testUser() {
			this.callView = new PhoneCallView({
				messengerFacade: this.messengerFacade
			});
		}
		static Events = Events;
	}

	// legacy compat
	BX.FoldedCallView = FoldedCallView;

	exports.BackgroundWorker = BackgroundWorker;
	exports.PhoneCallView = PhoneCallView;
	exports.PhoneCallsController = PhoneCallsController;

})(this.BX.Voximplant = this.BX.Voximplant || {}, BX, BX, BX.Event, BX.Messenger.v2.Lib, BX.Intranet, BX.Main, BX.UI.Dialogs);
//# sourceMappingURL=phone-calls.bundle.js.map
