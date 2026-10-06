/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core, main_core_events, main_popup, im_v2_lib_desktopApi, call_core, im_v2_lib_utils, ui_switcher, im_v2_lib_promo, call_lib_analytics, call_mapping, call_feature_pip, call_adapter_clipboard) {
	'use strict';

	function logPlaybackError(error) {
		console.error("Playback start error: ", error);
		call_core.Util.sendLog({
			description: 'Playback start error',
			error: error
		});
	}
	function checkAndEncodeURI(uri) {
		return decodeURI(uri) === uri ? encodeURI(uri) : uri;
	}

	const UserModelField = Object.freeze({
		id: 'id',
		name: 'name',
		avatar: 'avatar',
		gender: 'gender',
		state: 'state',
		talking: 'talking',
		cameraState: 'cameraState',
		prevCameraState: 'prevCameraState',
		microphoneState: 'microphoneState',
		screenState: 'screenState',
		videoPaused: 'videoPaused',
		floorRequestState: 'floorRequestState',
		permissionToSpeak: 'permissionToSpeak',
		localUser: 'localUser',
		centralUser: 'centralUser',
		pinned: 'pinned',
		presenter: 'presenter',
		order: 'order',
		prevOrder: 'prevOrder',
		allowRename: 'allowRename',
		wasRenamed: 'wasRenamed',
		renameRequested: 'renameRequested',
		direction: 'direction',
		prevScreenState: 'prevScreenState'
	});
	class UserModel {
		constructor(config) {
			this.data = {
				id: BX.prop.getInteger(config, "id", 0),
				name: BX.prop.getString(config, "name", ""),
				avatar: checkAndEncodeURI(BX.prop.getString(config, "avatar", "")),
				gender: BX.prop.getString(config, "gender", ""),
				state: BX.prop.getString(config, "state", call_core.UserState.Idle),
				talking: BX.prop.getBoolean(config, "talking", false),
				cameraState: BX.prop.getBoolean(config, "cameraState", true),
				prevCameraState: BX.prop.getBoolean(config, "cameraState", true),
				microphoneState: BX.prop.getBoolean(config, "microphoneState", true),
				screenState: BX.prop.getBoolean(config, "screenState", false),
				videoPaused: BX.prop.getBoolean(config, "videoPaused", false),
				floorRequestState: BX.prop.getBoolean(config, "floorRequestState", false),
				permissionToSpeak: BX.prop.getBoolean(config, "permissionToSpeak", false),
				localUser: BX.prop.getBoolean(config, "localUser", false),
				centralUser: BX.prop.getBoolean(config, "centralUser", false),
				pinned: BX.prop.getBoolean(config, "pinned", false),
				presenter: BX.prop.getBoolean(config, "presenter", false),
				order: BX.prop.getInteger(config, "order", false),
				prevOrder: BX.prop.getInteger(config, "prevOrder", false),
				allowRename: BX.prop.getBoolean(config, "allowRename", false),
				wasRenamed: BX.prop.getBoolean(config, "wasRenamed", false),
				renameRequested: BX.prop.getBoolean(config, "renameRequested", false),
				direction: BX.prop.getString(config, "direction", call_core.EndpointDirection.SendRecv),
				prevScreenState: BX.prop.getBoolean(config, "prevScreenState", false)
			};
			for (let fieldName in this.data) {
				if (this.data.hasOwnProperty(fieldName)) {
					Object.defineProperty(this, fieldName, {
						get: this._getField(fieldName).bind(this),
						set: this._setField(fieldName).bind(this)
					});
				}
			}
			this.onUpdate = {
				talking: this._onUpdateTalking.bind(this),
				state: this._onUpdateState.bind(this)
			};
			this.talkingStop = null;
			this.eventEmitter = new main_core_events.EventEmitter(this, 'UserModel');
		}
		_getField(fieldName) {
			return function () {
				return this.data[fieldName];
			};
		}
		_setField(fieldName) {
			return function (newValue) {
				var oldValue = this.data[fieldName];
				if (oldValue == newValue) {
					return;
				}
				this.data[fieldName] = newValue;
				if (this.onUpdate.hasOwnProperty(fieldName)) {
					this.onUpdate[fieldName](newValue, oldValue);
				}
				this.eventEmitter.emit("changed", {
					user: this,
					fieldName: fieldName,
					oldValue: oldValue,
					newValue: newValue
				});
			};
		}
		_onUpdateTalking(talking) {
			if (!talking) {
				this.talkingStop = new Date().getTime();
			}
		}
		_onUpdateState(newValue) {
			if (newValue != call_core.UserState.Connected) {
				this.talking = false;
				this.screenState = false;
			}
		}
		wasTalkingAgo() {
			if (this.state != call_core.UserState.Connected) {
				return +Infinity;
			}
			if (this.talking) {
				return 0;
			}
			if (!this.talkingStop) {
				return +Infinity;
			}
			return new Date().getTime() - this.talkingStop;
		}
		get isConnected() {
			return this.state === call_core.UserState.Connected;
		}
		subscribe(event, handler) {
			this.eventEmitter.subscribe(event, handler);
		}
		unsubscribe(event, handler) {
			this.eventEmitter.unsubscribe(event, handler);
		}
	}
	class UserRegistry extends main_core_events.EventEmitter {
		constructor() {
			super();
			this.setEventNamespace('BX.Call.UserRegistry');
			this.users = new Map();
		}
		/**
		 *
		 * @param {int} userId
		 * @returns {UserModel|null}
		 */
		get(userId) {
			return this.users.get(Number(userId)) || null;
		}
		push(user) {
			if (!(user instanceof UserModel)) {
				throw Error("user should be instance of UserModel");
			}
			this.users.set(Number(user.id), user);
			user.subscribe("changed", this._onUserChanged.bind(this));
			this.emit("userAdded", {
				user: user
			});
		}
		_onUserChanged(event) {
			if (event.data.fieldName === 'order') {
				this._sort();
			}
			this.emit("userChanged", event.data);
		}
		_sort() {
			this.users = new Map([...this.users].sort((a, b) => a[1].order - b[1].order));
		}
	}

	function createSVG(elementName, config) {
		let element = document.createElementNS('http://www.w3.org/2000/svg', elementName);
		if ("attrNS" in config && main_core.Type.isObject(config.attrNS)) {
			for (let key in config.attrNS) {
				if (config.attrNS.hasOwnProperty(key)) {
					element.setAttributeNS(null, key, config.attrNS[key]);
				}
			}
		}
		main_core.Dom.adjust(element, config);
		return element;
	}

	const createCssTooltip = (options = {}) => {
		const {
			width: tooltipWidth = 'max-content',
			position: tooltipPosition = 'top',
			getText: getTooltipText = () => ''
		} = options;
		const hasTooltip = Boolean(Object.keys(options).length);
		const tooltipText = getTooltipText();
		const tooltipPositionClass = tooltipPosition === 'bottom' ? '-bottom' : '-top';
		const tooltipClass = `bx-videocall-tooltip ${tooltipPositionClass}`;
		const tooltipTextVarName = '--data-tooltip-text';
		return {
			hasTooltip,
			tooltipClass: hasTooltip ? tooltipClass : '',
			tooltipText,
			tooltipStyle: `--data-tooltip-width:${tooltipWidth}; ${tooltipTextVarName}:'${tooltipText}'`,
			getTooltipText,
			tooltipTextVarName
		};
	};
	class TitleButton {
		constructor(config) {
			this.elements = {
				root: null
			};
			this.text = main_core.Type.isStringFilled(config.text) ? config.text : '';
			this.isGroupCall = config.isGroupCall;
		}
		render() {
			this.elements.root = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-panel-title"
				},
				html: this.getTitle()
			});
			return this.elements.root;
		}
		getTitle() {
			const prettyName = '<span class="bx-messenger-videocall-panel-title-name">' + main_core.Text.encode(this.text) + '</span>';
			if (this.isGroupCall) {
				return BX.message("IM_M_GROUP_CALL_WITH").replace("#CHAT_NAME#", prettyName);
			} else {
				return BX.message("IM_M_CALL_WITH").replace("#USER_NAME#", prettyName);
			}
		}
		update(config) {
			this.text = main_core.Type.isStringFilled(config.text) ? config.text : '';
			this.isGroupCall = config.isGroupCall;
			this.elements.root.innerHTML = this.getTitle();
		}
	}
	class SimpleButton {
		constructor(config) {
			this.class = config.class;
			this.backgroundClass = BX.prop.getString(config, "backgroundClass", "");
			this.backgroundClass = "bx-messenger-videocall-panel-icon-background" + (this.backgroundClass ? " " : "") + this.backgroundClass;
			this.blocked = config.blocked === true;
			this.tooltip = createCssTooltip(BX.prop.getObject(config, 'tooltip', {}));
			this.text = BX.prop.getString(config, "text", "");
			this.isActive = false;
			this.counter = BX.prop.getInteger(config, "counter", 0);
			this.isComingSoon = config.isComingSoon || false;
			this.elements = {
				root: null,
				counter: null,
				comingSoon: null
			};
			this.callbacks = {
				onClick: BX.prop.getFunction(config, "onClick", BX.DoNothing)
			};
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			let textNode;
			if (this.text !== '') {
				textNode = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-panel-text'
					},
					text: this.text,
					children: [main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-panel-text-content'
						},
						text: this.text
					})]
				});
			} else {
				textNode = null;
			}
			const {
				tooltipClass,
				tooltipStyle
			} = this.tooltip;
			this.elements.root = main_core.Dom.create('div', {
				props: {
					className: `bx-messenger-videocall-panel-item ${tooltipClass}${this.blocked ? ' blocked' : ''}${this.isComingSoon ? ' coming-soon' : ''}`
				},
				attrs: {
					style: tooltipStyle
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: this.backgroundClass
					},
					children: [main_core.Dom.create('div', {
						props: {
							className: `bx-messenger-videocall-panel-icon bx-messenger-videocall-panel-icon-${this.class}`
						}
					}), this.elements.counter = main_core.Dom.create('span', {
						props: {
							className: 'bx-messenger-videocall-panel-item-counter'
						},
						text: 0,
						dataset: {
							counter: 0,
							counterType: 'digits'
						}
					}), this.elements.comingSoon = main_core.Dom.create('span', {
						props: {
							className: 'bx-messenger-videocall-panel-item-coming-soon'
						},
						text: BX.message('CALL_FEATURES_COMING_SOON_MSGVER_1'),
						dataset: {
							visible: this.isComingSoon ? 'Y' : 'N'
						}
					})]
				}), textNode],
				events: {
					click: this.callbacks.onClick
				}
			});
			if (this.isActive) {
				this.elements.root.classList.add("active");
			}
			return this.elements.root;
		}
		setActive(isActive) {
			if (this.isActive == isActive) {
				return;
			}
			this.isActive = isActive;
			if (!this.elements.root) {
				return;
			}
			if (this.isActive) {
				this.elements.root.classList.add("active");
			} else {
				this.elements.root.classList.remove("active");
			}
			const {
				hasTooltip,
				getTooltipText,
				tooltipTextVarName
			} = this.tooltip;
			hasTooltip && this.elements.root.style.setProperty(tooltipTextVarName, `'${getTooltipText()}'`);
		}
		setBlocked(isBlocked) {
			if (this.blocked == isBlocked) {
				return;
			}
			this.blocked = isBlocked;
			if (this.blocked) {
				this.elements.root.classList.add("blocked");
			} else {
				this.elements.root.classList.remove("blocked");
			}
		}
		setCounter(counter) {
			this.counter = parseInt(counter, 10);
			if (Number.isNaN(this.counter)) {
				this.counter = 0;
				this.elements.counter.dataset.counter = 0;
				this.elements.counter.dataset.counterType = 'digits';
				this.elements.counter.innerText = 0;
				return;
			}
			let counterLabel = this.counter;
			const counterData = counterLabel;
			if (counterLabel > 99) {
				counterLabel = '99+';
			}
			let counterType = 'digits';
			if (counterLabel.toString().length === 2) {
				counterType = 'dozens';
			} else if (counterLabel.toString().length > 2) {
				counterType = 'hundreds';
			}
			this.elements.counter.dataset.counter = counterData;
			this.elements.counter.dataset.counterType = counterType;
			this.elements.counter.innerText = counterLabel;
		}
		setIsComingSoon(isActive) {
			this.isComingSoon = isActive;
			this.isComingSoon ? this.elements.comingSoon.dataset.visible = 'Y' : this.elements.comingSoon.dataset.visible = 'N';
			if (this.isComingSoon) {
				this.elements.root?.classList.add('coming-soon');
			} else {
				this.elements.root?.classList.remove('coming-soon');
			}
		}
	}
	class DeviceButton {
		constructor(config) {
			this.class = config.class;
			this.text = config.text;
			this.enabled = config.enabled === true;
			this.arrowEnabled = config.arrowEnabled === true;
			this.arrowHidden = config.arrowHidden === true;
			this.blocked = config.blocked === true;
			this.tooltip = createCssTooltip(BX.prop.getObject(config, 'tooltip', {}));
			this.backgroundClass = BX.prop.getString(config, "backgroundClass", "");
			this.showLevel = config.showLevel === true;
			this.level = config.level || 0;
			this.sideIcon = BX.prop.getString(config, "sideIcon", "");
			this.elements = {
				root: null,
				iconContainer: null,
				icon: null,
				arrow: null,
				levelMeter: null,
				pointer: null,
				ellipsis: null
			};
			this.callbacks = {
				onClick: BX.prop.getFunction(config, "onClick", BX.DoNothing),
				onArrowClick: BX.prop.getFunction(config, "onArrowClick", BX.DoNothing),
				onSideIconClick: BX.prop.getFunction(config, "onSideIconClick", BX.DoNothing)
			};
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			const {
				tooltipClass,
				tooltipStyle
			} = this.tooltip;
			this.elements.arrow = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-panel-item-with-arrow-right'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-panel-item-with-arrow-right-icon'
					}
				})],
				events: {
					click: function (e) {
						this.elements.arrow?.classList.add('rotate');
						this.callbacks.onArrowClick.apply(this, arguments);
						e.stopPropagation();
					}.bind(this)
				}
			});
			this.elements.root = main_core.Dom.create('div', {
				props: {
					id: `bx-messenger-videocall-panel-item-with-arrow-${this.class}`,
					className: `bx-messenger-videocall-panel-item-with-arrow ${tooltipClass}${this.blocked ? ' blocked' : ''}`
				},
				attrs: {
					style: tooltipStyle
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-panel-item-with-arrow-left'
					},
					children: [this.elements.iconContainer = main_core.Dom.create('div', {
						props: {
							className: this.getIconContainerClass()
						},
						children: [this.elements.icon = main_core.Dom.create('div', {
							props: {
								className: this.getIconClass()
							}
						})]
					}), ...(this.arrowHidden ? [] : [this.elements.arrow])]
				}), main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-panel-text'
					},
					text: this.text,
					children: [main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-panel-text-content'
						},
						text: this.text
					})]
				})],
				events: {
					click: this.callbacks.onClick
				}
			});
			if (this.showLevel) {
				this.elements.icon.appendChild(createSVG("svg", {
					attrNS: {
						class: "bx-messenger-videocall-panel-item-level-meter-container",
						width: "28",
						height: "28",
						viewBox: "0 0 28 28",
						fill: "none"
					},
					children: [createSVG("defs", {
						children: [createSVG("linearGradient", {
							attrNS: {
								id: "volumeGradient",
								x1: "0%",
								y1: "100%",
								x2: "0%",
								y2: "0%"
							},
							children: [this.elements.gradientStop1 = createSVG("stop", {
								attrNS: {
									offset: "0",
									id: "gradientStop1"
								}
							}), this.elements.gradientStop2 = createSVG("stop", {
								attrNS: {
									offset: "0",
									"stop-color": "transparent",
									id: "gradientStop2"
								}
							})]
						})]
					}), createSVG("path", {
						attrNS: {
							"fill-rule": "evenodd",
							"clip-rule": "evenodd",
							d: 'M7.01843 12.8394C7.46936 12.8492 7.82709 13.2234 7.81726 13.6743C7.76065 16.2837 9.9066 19.8267 13.9882 19.8267C18.0865 19.8265 20.3038 16.2334 20.1805 13.6987C20.1586 13.2483 20.5056 12.8654 20.9559 12.8433C21.4064 12.8213 21.7894 13.1682 21.8114 13.6187C21.9638 16.7444 19.4696 20.9702 14.8124 21.4204V23.1763H16.7714C17.2222 23.1765 17.5878 23.5427 17.5878 23.9937C17.5875 24.4443 17.2221 24.8099 16.7714 24.8101H11.2206C10.7699 24.8098 10.4044 24.4443 10.4042 23.9937C10.4042 23.5428 10.7698 23.1765 11.2206 23.1763H13.1796V21.4224C8.50848 20.9829 6.11622 16.768 6.18445 13.6382C6.1943 13.1874 6.56769 12.8297 7.01843 12.8394ZM13.9921 3.30518C16.1622 3.30518 17.9218 5.06469 17.9218 7.23486V13.5396C17.9218 15.7097 16.1622 17.4692 13.9921 17.4692C11.8221 17.469 10.0634 15.7096 10.0634 13.5396V7.23486C10.0634 5.06481 11.8221 3.30537 13.9921 3.30518ZM13.9921 4.93896C12.7241 4.93916 11.6962 5.96687 11.6962 7.23486V13.5396C11.6962 14.8075 12.7241 15.8353 13.9921 15.8354C15.2602 15.8354 16.2889 14.8077 16.2889 13.5396V7.23486C16.2889 5.96676 15.2602 4.93896 13.9921 4.93896Z',
							fill: "url(#volumeGradient)"
						}
					})]
				}));
			}
			this.elements.ellipsis = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-panel-icon-ellipsis"
				},
				events: {
					click: this.callbacks.onSideIconClick
				}
			});
			this.elements.pointer = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-panel-icon-pointer"
				},
				events: {
					click: this.callbacks.onSideIconClick
				}
			});
			if (this.sideIcon == "pointer") {
				BX.Dom.insertAfter(this.elements.pointer, this.elements.icon);
			} else if (this.sideIcon == "ellipsis") {
				BX.Dom.insertAfter(this.elements.ellipsis, this.elements.icon);
			}
			return this.elements.root;
		}
		getIconClass() {
			return "bx-messenger-videocall-panel-item-with-arrow-icon bx-messenger-videocall-panel-item-with-arrow-icon-" + this.class + (this.enabled ? "" : "-off");
		}
		getIconContainerClass() {
			return "bx-messenger-videocall-panel-item-with-arrow-icon-container" + " bx-messenger-videocall-panel-item-with-arrow-icon-container-" + this.class + (this.enabled ? "" : "-off") + (this.arrowHidden ? " bx-messenger-videocall-panel-item-with-arrow-icon-container-arrow-hidden" : "") + (this.backgroundClass ? ` ${this.backgroundClass}` : "");
		}
		enable() {
			if (this.enabled) {
				return;
			}
			this.enabled = true;
			this.elements.iconContainer.className = this.getIconContainerClass();
			this.elements.icon.className = this.getIconClass();
			if (this.elements.gradientStop1 && this.elements.gradientStop2) {
				this.elements.gradientStop1.setAttribute('offset', '0%');
				this.elements.gradientStop2.setAttribute('offset', '0%');
			} else if (this.elements.levelMeter) {
				this.elements.levelMeter.setAttribute('y', Math.round((1 - this.level) * 20));
			}
			const {
				hasTooltip,
				getTooltipText,
				tooltipTextVarName
			} = this.tooltip;
			hasTooltip && this.elements.root.style.setProperty(tooltipTextVarName, `'${getTooltipText()}'`);
		}
		disable() {
			if (!this.enabled) {
				return;
			}
			this.enabled = false;
			this.elements.iconContainer.className = this.getIconContainerClass();
			this.elements.icon.className = this.getIconClass();
			if (this.elements.gradientStop1 && this.elements.gradientStop2) {
				this.elements.gradientStop1.setAttribute('offset', '0%');
				this.elements.gradientStop2.setAttribute('offset', '0%');
			} else if (this.elements.levelMeter) {
				this.elements.levelMeter.setAttribute('y', Math.round((1 - this.level) * 20));
			}
			const {
				hasTooltip,
				getTooltipText,
				tooltipTextVarName
			} = this.tooltip;
			hasTooltip && this.elements.root.style.setProperty(tooltipTextVarName, `'${getTooltipText()}'`);
		}
		setBlocked(blocked) {
			if (this.blocked == blocked) {
				return;
			}
			this.blocked = blocked;
			this.elements.iconContainer.className = this.getIconContainerClass();
			this.elements.icon.className = this.getIconClass();
			if (this.blocked) {
				this.elements.root.classList.add("blocked");
			} else {
				this.elements.root.classList.remove("blocked");
			}
		}
		setSideIcon(sideIcon) {
			if (this.sideIcon == sideIcon) {
				return;
			}
			this.sideIcon = sideIcon;
			BX.Dom.remove(this.elements.pointer);
			BX.Dom.remove(this.elements.ellipsis);
			if (this.sideIcon == "pointer") {
				BX.Dom.insertAfter(this.elements.pointer, this.elements.icon);
			} else if (this.sideIcon == "ellipsis") {
				BX.Dom.insertAfter(this.elements.ellipsis, this.elements.icon);
			}
		}
		showArrow() {
			if (!this.arrowHidden) {
				return;
			}
			this.arrowHidden = false;
			this.elements.iconContainer.className = this.getIconContainerClass();
			if (!this.elements.root.querySelector('.bx-messenger-videocall-panel-item-with-arrow-right-icon')) {
				this.elements.root.children[0].appendChild(this.elements.arrow);
			}
		}
		hideArrow() {
			if (this.arrowHidden) {
				return;
			}
			this.arrowHidden = true;
			this.elements.iconContainer.className = this.getIconContainerClass();
			if (this.elements.root.querySelector('.bx-messenger-videocall-panel-item-with-arrow-right-icon')) {
				this.elements.root.children[0].removeChild(this.elements.arrow);
			}
		}
		setLevel(level) {
			this.level = level > 0 ? Math.max(0, Math.min(1, Math.log(level * 100) / 4.6)) : 0;
			if (this.showLevel && this.enabled) {
				const offset = `${100 - Math.round((1 - this.level) * 100)}%`;
				this.elements.gradientStop1.setAttribute('offset', offset);
				this.elements.gradientStop2.setAttribute('offset', offset);
			}
		}
	}
	class WaterMarkButton {
		constructor(config) {
			this.language = config.language;
			this.elements = {
				root: null
			};
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			this.elements.root = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-watermark'
				},
				children: [main_core.Dom.create('img', {
					props: {
						className: 'bx-messenger-videocall-watermark-img',
						src: this.getWatermarkUrl(this.language)
					}
				})]
			});
			return this.elements.root;
		}
		getWatermarkUrl(language) {
			switch (language) {
				case 'ru':
				case 'kz':
				case 'by':
					return '/bitrix/js/call/images/new-logo-white-ru.svg';
				default:
					return '/bitrix/js/call/images/new-logo-white-en.svg';
			}
		}
	}
	class TopButton {
		constructor(config) {
			this.iconClass = BX.prop.getString(config, 'iconClass', '');
			this.text = BX.prop.getString(config, 'text', '');
			this.elements = {
				root: null,
				icon: null,
				text: null
			};
			this.tooltip = createCssTooltip(BX.prop.getObject(config, 'tooltip', {}));
			this.callbacks = {
				onClick: BX.prop.getFunction(config, 'onClick', BX.DoNothing)
			};
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			const {
				tooltipClass,
				tooltipStyle
			} = this.tooltip;
			this.elements.root = main_core.Dom.create('div', {
				props: {
					className: `bx-messenger-videocall-top-button ${tooltipClass}`
				},
				attrs: {
					style: tooltipStyle
				},
				children: [this.elements.icon = main_core.Dom.create('div', {
					props: {
						className: `bx-messenger-videocall-top-button-icon ${this.iconClass}`
					}
				}), this.elements.text = main_core.Dom.create('div', {
					props: {
						className: `bx-messenger-videocall-top-button-text ${this.iconClass}`
					},
					text: this.text
				})],
				events: {
					click: this.callbacks.onClick
				}
			});
			return this.elements.root;
		}
		update(config) {
			const iconClass = BX.prop.getString(config, 'iconClass', this.iconClass);
			const text = BX.prop.getString(config, 'text', this.text);
			if (this.iconClass !== iconClass) {
				this.iconClass = iconClass;
				this.elements.icon.className = `bx-messenger-videocall-top-button-icon ${this.iconClass}`;
			}
			if (this.text !== text) {
				this.text = text;
				this.elements.text.innerText = this.text;
				this.elements.text.className = `bx-messenger-videocall-top-button-text ${this.iconClass}`;
			}
		}
		setBlocked(isBlocked) {
			if (this.blocked === isBlocked) {
				return;
			}
			this.blocked = isBlocked;
			if (this.blocked) {
				main_core.Dom.addClass(this.elements.root, 'blocked');
			} else {
				main_core.Dom.removeClass(this.elements.root, 'blocked');
			}
		}
	}
	class TopFramelessButton {
		constructor(config) {
			this.iconClass = BX.prop.getString(config, 'iconClass', '');
			this.textClass = BX.prop.getString(config, 'textClass', '');
			this.text = BX.prop.getString(config, 'text', '');
			this.tooltip = createCssTooltip(BX.prop.getObject(config, 'tooltip', {}));
			this.elements = {
				root: null
			};
			this.callbacks = {
				onClick: BX.prop.getFunction(config, 'onClick', BX.DoNothing)
			};
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			const {
				tooltipClass,
				tooltipStyle
			} = this.tooltip;
			this.elements.root = main_core.Dom.create('div', {
				props: {
					className: `bx-messenger-videocall-top-button-frameless ${tooltipClass}`
				},
				attrs: {
					style: tooltipStyle
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: `bx-messenger-videocall-top-button-icon ${this.iconClass}`
					}
				}), this.text === '' ? null : main_core.Dom.create('div', {
					props: {
						className: `bx-messenger-videocall-top-button-text ${this.textClass}`
					},
					text: this.text
				})],
				events: {
					click: this.callbacks.onClick
				}
			});
			return this.elements.root;
		}
	}
	class ParticipantsButton {
		constructor(config) {
			this.count = BX.prop.getInteger(config, "count", 0);
			this.foldButtonState = BX.prop.getString(config, "foldButtonState", ParticipantsButton.FoldButtonState.Hidden);
			this.allowAdding = BX.prop.getBoolean(config, "allowAdding", false);
			this.elements = {
				root: null,
				leftContainer: null,
				rightContainer: null,
				foldIcon: null,
				count: null,
				separator: null
			};
			this.callbacks = {
				onListClick: BX.prop.getFunction(config, "onListClick", BX.DoNothing),
				onAddClick: BX.prop.getFunction(config, "onAddClick", BX.DoNothing)
			};
		}
		static FoldButtonState = {
			Active: "active",
			Fold: "fold",
			Unfold: "unfold",
			Hidden: "hidden"
		};
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			this.elements.root = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-top-participants"
				},
				children: [this.elements.leftContainer = main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-top-participants-inner left" + (this.foldButtonState != ParticipantsButton.FoldButtonState.Hidden ? " active" : "")
					},
					children: [main_core.Dom.create("div", {
						props: {
							className: "bx-messenger-videocall-top-button-icon participants"
						}
					}), this.elements.count = main_core.Dom.create("div", {
						props: {
							className: "bx-messenger-videocall-top-participants-text-count"
						},
						text: this.count
					}), this.elements.foldIcon = main_core.Dom.create("div", {
						props: {
							className: "bx-messenger-videocall-top-participants-fold-icon " + this.foldButtonState
						}
					})],
					events: {
						click: this.callbacks.onListClick
					}
				})]
			});
			this.elements.separator = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-top-participants-separator"
				}
			});
			this.elements.rightContainer = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-top-participants-inner active"
				},
				children: [main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-top-participants-text"
					},
					text: BX.message("IM_M_CALL_BTN_ADD")
				}), main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-top-button-icon add"
					}
				})],
				events: {
					click: this.callbacks.onAddClick
				}
			});
			if (this.allowAdding) {
				this.elements.root.appendChild(this.elements.separator);
				this.elements.root.appendChild(this.elements.rightContainer);
			}
			return this.elements.root;
		}
		update(config) {
			this.count = BX.prop.getInteger(config, "count", this.count);
			this.foldButtonState = BX.prop.getString(config, "foldButtonState", this.foldButtonState);
			this.allowAdding = BX.prop.getBoolean(config, "allowAdding", this.allowAdding);
			this.elements.count.innerText = this.count;
			this.elements.foldIcon.className = "bx-messenger-videocall-top-participants-fold-icon " + this.foldButtonState;
			if (this.foldButtonState == ParticipantsButton.FoldButtonState.Hidden) {
				this.elements.leftContainer.classList.remove("active");
			} else {
				this.elements.leftContainer.classList.add("active");
			}
			if (this.allowAdding && !this.elements.separator.parentElement) {
				this.elements.root.appendChild(this.elements.separator);
				this.elements.root.appendChild(this.elements.rightContainer);
			}
			if (!this.allowAdding && this.elements.separator.parentElement) {
				BX.remove(this.elements.separator);
				BX.remove(this.elements.rightContainer);
			}
		}
		setBlocked(isBlocked) {
			if (this.blocked == isBlocked) {
				return;
			}
			this.blocked = isBlocked;
			if (this.blocked) {
				main_core.Dom.addClass(this.elements.root, 'blocked');
			} else {
				main_core.Dom.removeClass(this.elements.root, 'blocked');
			}
		}
	}
	class ParticipantsButtonMobile {
		constructor(config) {
			this.count = BX.prop.getInteger(config, "count", 0);
			this.elements = {
				root: null,
				icon: null,
				text: null,
				arrow: null
			};
			this.callbacks = {
				onClick: BX.prop.getFunction(config, "onClick", BX.DoNothing)
			};
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			this.elements.root = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-top-participants-mobile"
				},
				children: [this.elements.icon = main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-top-participants-mobile-icon"
					}
				}), this.elements.text = main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-top-participants-mobile-text"
					},
					text: BX.message("IM_M_CALL_PARTICIPANTS").replace("#COUNT#", this.count)
				}), this.elements.arrow = main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-top-participants-mobile-arrow"
					}
				})],
				events: {
					click: this.callbacks.onClick
				}
			});
			return this.elements.root;
		}
		setCount(count) {
			if (this.count == count || !this.elements.text) {
				return;
			}
			this.count = count;
			this.elements.text.innerText = BX.message("IM_M_CALL_PARTICIPANTS").replace("#COUNT#", this.count);
		}
	}
	class RecordStatusButton {
		constructor(config) {
			this.userId = config.userId;
			this.commonRecordState = config.commonRecordState;
			this.updateViewInterval = null;
			this.tooltip = createCssTooltip(BX.prop.getObject(config, 'tooltip', {}));
			this.elements = {
				root: null,
				timeText: null,
				stateText: null
			};
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			const {
				tooltipStyle
			} = this.tooltip;
			this.elements.root = main_core.Dom.create('div', {
				props: {
					className: `bx-messenger-videocall-top-recordstatus record-status-${this.commonRecordState.state}`
				},
				attrs: {
					style: tooltipStyle
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-top-recordstatus-status'
					},
					children: [main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-top-button-icon record-status'
						}
					})]
				}), main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-top-recordstatus-time'
					},
					children: [this.elements.timeText = main_core.Dom.create('span', {
						props: {
							className: 'bx-messenger-videocall-top-recordstatus-time-text'
						},
						text: call_core.Util.getRecordTimeText(this.commonRecordState)
					})]
				})]
			});
			return this.elements.root;
		}
		update(commonRecordState) {
			const prevState = this.commonRecordState?.state;
			if (prevState !== commonRecordState.state) {
				clearInterval(this.updateViewInterval);
				this.updateViewInterval = null;
				if (commonRecordState.state === call_core.CallCommonRecordState.Started) {
					this.updateViewInterval = setInterval(() => this.updateView(), 1000);
				}
			}
			this.commonRecordState = commonRecordState;
			this.updateView();
		}
		updateView() {
			const timeText = call_core.Util.getRecordTimeText(this.commonRecordState);
			if (this.elements.timeText.innerText !== timeText) {
				this.elements.timeText.innerText = timeText;
			}
			const currentClass = `record-status-${this.commonRecordState.state}`;
			if (!this.elements.root.classList.contains(currentClass)) {
				const {
					tooltipClass,
					hasTooltip,
					tooltipTextVarName,
					getTooltipText
				} = this.tooltip;
				const tooltipText = getTooltipText();
				if (hasTooltip && tooltipText) {
					this.elements.root.style.setProperty(tooltipTextVarName, `'${tooltipText}'`);
				}
				const classes = [tooltipText ? tooltipClass : '', 'bx-messenger-videocall-top-recordstatus', currentClass].filter(Boolean);
				this.elements.root.className = classes.join(' ');
			}
		}
		stopViewUpdate() {
			if (this.updateViewInterval) {
				clearInterval(this.updateViewInterval);
				this.updateViewInterval = null;
			}
		}
	}

	var Buttons = /*#__PURE__*/Object.freeze({
		__proto__: null,
		DeviceButton: DeviceButton,
		ParticipantsButton: ParticipantsButton,
		ParticipantsButtonMobile: ParticipantsButtonMobile,
		RecordStatusButton: RecordStatusButton,
		SimpleButton: SimpleButton,
		TitleButton: TitleButton,
		TopButton: TopButton,
		TopFramelessButton: TopFramelessButton,
		WaterMarkButton: WaterMarkButton
	});

	class CallUserMobile {
		constructor(config) {
			this.userModel = config.userModel;
			this.elements = {
				root: null,
				avatar: null,
				avatarOutline: null,
				userName: null,
				userStatus: null,
				menuArrow: null,
				floorRequest: null,
				mic: null,
				cam: null
			};
			this._onUserFieldChangeHandler = this._onUserFieldChange.bind(this);
			this.userModel.subscribe("changed", this._onUserFieldChangeHandler);
			this.callbacks = {
				onClick: BX.prop.getFunction(config, "onClick", BX.DoNothing)
			};
			this.avatarBackground = call_core.Util.getAvatarBackground();
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			this.elements.root = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-user-mobile"
				},
				children: [this.elements.avatar = main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-user-mobile-avatar" + (this.userModel.talking ? " talking" : "")
					},
					children: [this.elements.floorRequest = main_core.Dom.create("div", {
						props: {
							className: "bx-messenger-videocall-user-mobile-floor-request bx-messenger-videocall-floor-request-icon"
						}
					})]
				}), main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-user-mobile-body"
					},
					children: [main_core.Dom.create("div", {
						props: {
							className: "bx-messenger-videocall-user-mobile-text"
						},
						children: [this.elements.mic = main_core.Dom.create("div", {
							props: {
								className: "bx-messenger-videocall-user-mobile-icon" + (this.userModel.microphoneState ? "" : " bx-call-view-icon-red-microphone-off")
							}
						}), this.elements.cam = main_core.Dom.create("div", {
							props: {
								className: "bx-messenger-videocall-user-mobile-icon" + (this.userModel.cameraState ? "" : " bx-call-view-icon-red-camera-off")
							}
						}), this.elements.userName = main_core.Dom.create("div", {
							props: {
								className: "bx-messenger-videocall-user-mobile-username"
							},
							text: this.userModel.name
						}), main_core.Dom.create("div", {
							props: {
								className: "bx-messenger-videocall-user-mobile-menu-arrow"
							}
						})]
					}), this.elements.userStatus = main_core.Dom.create("div", {
						props: {
							className: "bx-messenger-videocall-user-mobile-user-status"
						},
						text: this.userModel.pinned ? BX.message("IM_M_CALL_PINNED_USER") : BX.message("IM_M_CALL_CURRENT_PRESENTER")
					})]
				})],
				events: {
					click: this.callbacks.onClick
				}
			});
			return this.elements.root;
		}
		update() {
			if (!this.elements.root) {
				return;
			}
			this.elements.userName.innerText = this.userModel.name;
			if (this.userModel.avatar !== '') {
				this.elements.root.style.setProperty("--avatar", "url('" + this.userModel.avatar + "')");
				this.elements.avatar.innerText = '';
				this.elements.root.style.removeProperty("--avatar-background");
			} else {
				this.elements.root.style.removeProperty("--avatar");
				this.elements.root.style.setProperty("--avatar-background", this.avatarBackground);
				this.elements.avatar.innerText = im_v2_lib_utils.Utils.text.getFirstLetters(this.userModel.name).toUpperCase();
			}
			this.elements.avatar.classList.toggle("talking", this.userModel.talking);
			this.elements.floorRequest.classList.toggle("active", this.userModel.floorRequestState);
			this.elements.mic.classList.toggle("bx-call-view-icon-red-microphone-off", !this.userModel.microphoneState);
			this.elements.cam.classList.toggle("bx-call-view-icon-red-camera-off", !this.userModel.cameraState);
			this.elements.userStatus.innerText = this.userModel.pinned ? BX.message("IM_M_CALL_PINNED_USER") : BX.message("IM_M_CALL_CURRENT_PRESENTER");
		}
		mount(parentElement) {
			parentElement.appendChild(this.render());
		}
		dismount() {
			if (!this.elements.root) {
				return;
			}
			main_core.Dom.remove(this.elements.root);
		}
		setUserModel(userModel) {
			this.userModel.unsubscribe("changed", this._onUserFieldChangeHandler);
			this.userModel = userModel;
			this.userModel.subscribe("changed", this._onUserFieldChangeHandler);
			this.update();
		}
		_onUserFieldChange(event) {
			this.update();
		}
	}
	class UserSelectorMobile {
		constructor(config) {
			this.userRegistry = config.userRegistry;
			this.userRegistry.subscribe("userAdded", this._onUserAdded.bind(this));
			this.userRegistry.subscribe("userChanged", this._onUserChanged.bind(this));
			this.elements = {
				root: null,
				users: {}
			};
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			this.elements.root = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-user-selector-mobile"
				}
			});
			this.updateUsers();
			return this.elements.root;
		}
		renderUser(userFields) {
			return createSVG("svg", {
				attrNS: {
					width: 14.5,
					height: 11.6
				},
				style: {
					order: userFields.order
				},
				children: [createSVG("circle", {
					attrNS: {
						class: "bx-messenger-videocall-user-selector-mobile-border" + (userFields.talking ? " talking" : ""),
						cx: 7.25,
						cy: 5.8,
						r: 4.6
					}
				}), createSVG("circle", {
					attrNS: {
						class: "bx-messenger-videocall-user-selector-mobile-dot" + (userFields.centralUser ? " pinned" : ""),
						cx: 7.25,
						cy: 5.8,
						r: 3.3
					}
				})]
			});
		}
		updateUsers() {
			this.userRegistry.users.forEach(function (userFields) {
				if (userFields.localUser || userFields.state != call_core.UserState.Connected) {
					if (this.elements.users[userFields.id]) {
						BX.remove(this.elements.users[userFields.id]);
						this.elements.users[userFields.id] = null;
					}
				} else {
					var newNode = this.renderUser(userFields);
					if (this.elements.users[userFields.id]) {
						BX.replace(this.elements.users[userFields.id], newNode);
					} else {
						this.elements.root.appendChild(newNode);
					}
					this.elements.users[userFields.id] = newNode;
				}
			}, this);
		}
		_onUserAdded(event) {
			this.updateUsers();
		}
		_onUserChanged(event) {
			this.updateUsers();
		}
		mount(parentElement) {
			parentElement.appendChild(this.render());
		}
		dismount() {
			if (!this.elements.root) {
				return;
			}
			BX.remove(this.elements.root);
		}
	}
	class MobileSlider {
		constructor(config) {
			this.parent = config.parent || null;
			this.content = config.content || null;
			this.elements = {
				background: null,
				root: null,
				handle: null,
				body: null
			};
			this.callbacks = {
				onClose: BX.prop.getFunction(config, "onClose", BX.DoNothing),
				onDestroy: BX.prop.getFunction(config, "onDestroy", BX.DoNothing)
			};
			this.touchStartY = 0;
			this.processedTouchId = 0;
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			this.elements.background = main_core.Dom.create("div", {
				props: {
					className: "bx-videocall-mobile-menu-background"
				},
				events: {
					click: this._onBackgroundClick.bind(this)
				}
			});
			this.elements.root = main_core.Dom.create("div", {
				props: {
					className: "bx-videocall-mobile-menu-container"
				},
				children: [this.elements.handle = main_core.Dom.create("div", {
					props: {
						className: "bx-videocall-mobile-menu-handle"
					}
				}), this.elements.body = main_core.Dom.create("div", {
					props: {
						className: "bx-videocall-mobile-menu"
					},
					children: [this.content]
				})],
				events: {
					touchstart: this._onTouchStart.bind(this),
					touchmove: this._onTouchMove.bind(this),
					touchend: this._onTouchEnd.bind(this)
				}
			});
			return this.elements.root;
		}
		show() {
			if (this.parent) {
				this.render();
				this.parent.appendChild(this.elements.root);
				this.parent.appendChild(this.elements.background);
			}
		}
		close() {
			BX.remove(this.elements.root);
			BX.remove(this.elements.background);
			this.callbacks.onClose();
		}
		closeWithAnimation() {
			if (!this.elements.root) {
				return;
			}
			this.elements.root.classList.add("closing");
			this.elements.background.classList.add("closing");
			this.elements.root.addEventListener("animationend", function () {
				this.close();
			}.bind(this));
		}
		_onTouchStart(e) {
			this.touchStartY = e.pageY;
			if (this.processedTouchId || e.touches.length > 1) {
				return;
			}
			if (e.target == this.elements.header || e.target == this.elements.root || this.elements.body.scrollTop === 0) {
				this.processedTouchId = e.touches[0].identifier;
			}
		}
		_onTouchMove(e) {
			if (e.touches.length > 1) {
				return;
			}
			if (e.touches[0].identifier != this.processedTouchId) {
				return;
			}
			var delta = this.touchStartY - e.pageY;
			if (delta > 0) {
				delta = 0;
			}
			this.elements.root.style.bottom = delta + "px";
			if (delta) {
				e.preventDefault();
			}
		}
		_onTouchEnd(e) {
			var allowProcessing = false;
			for (var i = 0; i < e.changedTouches.length; i++) {
				if (e.changedTouches[i].identifier == this.processedTouchId) {
					allowProcessing = true;
					break;
				}
			}
			if (!allowProcessing) {
				return;
			}
			var delta = e.pageY - this.touchStartY;
			if (delta > 100) {
				this.closeWithAnimation();
				e.preventDefault();
			} else {
				this.elements.root.style.removeProperty("bottom");
			}
			this.processedTouchId = 0;
			this.touchStartY = 0;
		}
		destroy() {
			this.callbacks.onDestroy();
			this.elements = {};
			this.callbacks = {};
			this.parent = null;
		}
		_onBackgroundClick() {
			this.closeWithAnimation();
		}
	}
	class MobileMenu {
		constructor(config) {
			this.parent = config.parent || null;
			this.header = BX.prop.getString(config, "header", "");
			this.largeIcons = BX.prop.getBoolean(config, "largeIcons", false);
			this.slider = null;
			var items = BX.prop.getArray(config, "items", []);
			if (items.length === 0) {
				throw Error("Items array should not be empty");
			}
			this.items = items.filter(item => typeof item === "object" && !!item).map(item => new MobileMenuItem(item));
			this.elements = {
				root: null,
				header: null,
				body: null
			};
			this.callbacks = {
				onClose: BX.prop.getFunction(config, "onClose", BX.DoNothing),
				onDestroy: BX.prop.getFunction(config, "onDestroy", BX.DoNothing)
			};
		}
		render() {
			this.elements.header = main_core.Dom.create("div", {
				props: {
					className: "bx-videocall-mobile-menu-header"
				},
				text: this.header
			});
			this.elements.body = main_core.Dom.create("div", {
				props: {
					className: "bx-videocall-mobile-menu-body" + (this.largeIcons ? " bx-videocall-mobile-menu-large" : "")
				}
			});
			this.items.forEach(item => {
				if (item) {
					this.elements.body.appendChild(item.render());
				}
			});
			return BX.createFragment([this.elements.header, this.elements.body]);
		}
		setHeader(header) {
			this.header = header;
			if (this.elements.header) {
				this.elements.header.innerText = header;
			}
		}
		show() {
			if (!this.slider) {
				this.slider = new MobileSlider({
					parent: this.parent,
					content: this.render(),
					onClose: this.onSliderClose.bind(this),
					onDestroy: this.onSliderDestroy.bind(this)
				});
			}
			this.slider.show();
		}
		close() {
			if (this.slider) {
				this.slider.close();
			}
		}
		onSliderClose() {
			this.slider.destroy();
		}
		onSliderDestroy() {
			this.slider = null;
			this.destroy();
		}
		destroy() {
			if (this.slider) {
				this.slider.destroy();
			}
			this.slider = null;
			this.items.forEach(function (item) {
				item.destroy();
			});
			this.items = [];
			this.callbacks.onDestroy();
			this.elements = {};
			this.callbacks = {};
			this.parent = null;
		}
	}
	class MobileMenuItem {
		constructor(config) {
			this.id = BX.prop.getString(config, "id", call_core.Util.getUuidv4());
			this.icon = BX.prop.getString(config, "icon", "");
			this.iconClass = BX.prop.getString(config, "iconClass", "");
			this.text = BX.prop.getString(config, "text", "");
			this.showSubMenu = BX.prop.getBoolean(config, "showSubMenu", false);
			this.separator = BX.prop.getBoolean(config, "separator", false);
			this.enabled = BX.prop.getBoolean(config, "enabled", true);
			this.userModel = BX.prop.get(config, "userModel", null);
			this.avatarBackground = call_core.Util.getAvatarBackground();
			if (this.userModel) {
				this._userChangeHandler = this._onUserChange.bind(this);
				this.subscribeUserEvents();
				this.text = this.userModel.name;
				this.icon = this.userModel.avatar;
				this.iconClass = "user-avatar";
				this.iconText = im_v2_lib_utils.Utils.text.getFirstLetters(this.userModel.name);
				this.iconBackground = call_core.Util.getAvatarBackground();
			}
			this.elements = {
				root: null,
				icon: null,
				content: null,
				submenu: null,
				separator: null,
				mic: null,
				cam: null
			};
			this.callbacks = {
				click: BX.prop.getFunction(config, "onClick", BX.DoNothing),
				clickSubMenu: BX.prop.getFunction(config, "onClickSubMenu", BX.DoNothing)
			};
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			if (this.separator) {
				this.elements.root = main_core.Dom.create("hr", {
					props: {
						className: "bx-videocall-mobile-menu-item-separator"
					}
				});
			} else {
				this.elements.root = main_core.Dom.create("div", {
					props: {
						className: "bx-videocall-mobile-menu-item" + (this.enabled ? "" : " disabled")
					},
					children: [this.elements.icon = main_core.Dom.create("div", {
						props: {
							className: "bx-videocall-mobile-menu-item-icon " + this.iconClass
						}
					}), this.elements.content = main_core.Dom.create("div", {
						props: {
							className: "bx-videocall-mobile-menu-item-content"
						},
						children: [main_core.Dom.create("span", {
							text: this.text
						})]
					})],
					events: {
						click: this.callbacks.click
					}
				});
				if (this.icon != "") {
					this.elements.icon.style.backgroundImage = "url(\"" + this.icon + "\")";
					this.elements.icon.innerText = '';
				} else if (this.iconText) {
					this.elements.icon.innerText = this.iconText;
					this.elements.root.style.setProperty("--avatar-background", this.avatarBackground);
				}
				if (this.showSubMenu) {
					this.elements.submenu = main_core.Dom.create("div", {
						props: {
							className: "bx-videocall-mobile-menu-item-submenu-icon"
						}
					});
					this.elements.root.appendChild(this.elements.submenu);
				}
				if (this.userModel) {
					this.elements.mic = main_core.Dom.create("div", {
						props: {
							className: "bx-videocall-mobile-menu-icon-user bx-call-view-icon-red-microphone-off"
						}
					});
					this.elements.cam = main_core.Dom.create("div", {
						props: {
							className: "bx-videocall-mobile-menu-icon-user bx-call-view-icon-red-camera-off"
						}
					});
					if (!this.userModel.cameraState) {
						this.elements.content.prepend(this.elements.cam);
					}
					if (!this.userModel.microphoneState) {
						this.elements.content.prepend(this.elements.mic);
					}
				}
			}
			return this.elements.root;
		}
		updateUserIcons() {
			if (!this.userModel) {
				return;
			}
			if (this.userModel.microphoneState) {
				BX.remove(this.elements.mic);
			} else {
				this.elements.content.prepend(this.elements.mic);
			}
			if (this.userModel.cameraState) {
				BX.remove(this.elements.cam);
			} else {
				this.elements.content.prepend(this.elements.cam);
			}
		}
		subscribeUserEvents() {
			this.userModel.subscribe("changed", this._userChangeHandler);
		}
		_onUserChange(event) {
			this.updateUserIcons();
		}
		destroy() {
			if (this.userModel) {
				this.userModel.unsubscribe("changed", this._userChangeHandler);
				this.userModel = null;
			}
			this.callbacks = null;
			this.elements = null;
		}
	}

	class VideoFrameKeeper {
		/** @type {HTMLCanvasElement|null} */
		#canvas = null;

		/** @type {CanvasRenderingContext2D|null} */
		#context = null;

		/** @type {string|null} */
		#lastFrameData = null;

		/** @type {HTMLDivElement|null} */
		#overlayElement = null;

		/** @type {HTMLVideoElement|null} */
		#videoElement = null;

		/** @type {boolean} */
		#isOverlayVisible = false;

		/** @type {(() => void)|null} */
		#onLoadedDataHandler = null;

		/** @type {number|null} */
		#captureIntervalId = null;

		/** @type {number} */
		#captureIntervalMs = 10000;
		attach(videoElement, options = {}) {
			this.detach();
			this.#videoElement = videoElement;
			this.#onLoadedDataHandler = this.#onLoadedData.bind(this);
			videoElement.addEventListener('loadeddata', this.#onLoadedDataHandler);
			if (options.captureInterval !== undefined) {
				this.#captureIntervalMs = options.captureInterval;
			}
			this.#startCaptureInterval();
		}
		detach() {
			this.#stopCaptureInterval();
			if (this.#videoElement && this.#onLoadedDataHandler) {
				this.#videoElement.removeEventListener('loadeddata', this.#onLoadedDataHandler);
				this.#onLoadedDataHandler = null;
			}
			this.#videoElement = null;
		}
		#startCaptureInterval() {
			this.#stopCaptureInterval();
			this.#captureIntervalId = setInterval(() => {
				this.#captureFrameInternal();
			}, this.#captureIntervalMs);
		}
		#stopCaptureInterval() {
			if (this.#captureIntervalId !== null) {
				clearInterval(this.#captureIntervalId);
				this.#captureIntervalId = null;
			}
		}
		#captureFrameInternal() {
			if (!this.#videoElement) {
				return;
			}
			const video = this.#videoElement;
			if (video.readyState < video.HAVE_CURRENT_DATA || video.videoWidth < 30 || video.videoHeight < 30) {
				return;
			}
			try {
				if (!this.#canvas) {
					this.#canvas = document.createElement('canvas');
					this.#context = this.#canvas.getContext('2d');
				}
				if (!this.#context) {
					return;
				}
				this.#canvas.width = video.videoWidth;
				this.#canvas.height = video.videoHeight;
				this.#context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
				this.#lastFrameData = this.#canvas.toDataURL('image/jpeg', 0.95);
			} catch (error) {
				console.error('[VideoFrameKeeper] Error capturing frame:', error);
			}
		}
		showLastFrame(containerElement) {
			if (!this.#lastFrameData || !containerElement) {
				return;
			}
			if (!this.#overlayElement) {
				this.#overlayElement = document.createElement('div');
				this.#overlayElement.className = 'video-frame-keeper-overlay';
				this.#overlayElement.style.cssText = `
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background-size: contain;
				background-position: center;
				background-repeat: no-repeat;
				z-index: 10;
				pointer-events: none;
			`;
			}
			this.#overlayElement.style.backgroundImage = `url('${this.#lastFrameData}')`;
			this.#overlayElement.style.display = 'block';
			this.#isOverlayVisible = true;
			if (!this.#overlayElement.parentElement) {
				containerElement.appendChild(this.#overlayElement);
			}
		}
		hideLastFrame() {
			if (this.#overlayElement) {
				this.#overlayElement.style.display = 'none';
				this.#isOverlayVisible = false;
			}
		}
		destroy() {
			this.detach();
			this.hideLastFrame();
			if (this.#overlayElement && this.#overlayElement.parentElement) {
				this.#overlayElement.parentElement.removeChild(this.#overlayElement);
			}
			this.#overlayElement = null;
			this.#canvas = null;
			this.#context = null;
			this.#lastFrameData = null;
		}
		#onLoadedData() {
			if (this.#videoElement && this.#videoElement.videoWidth > 0 && this.#videoElement.videoHeight > 0) {
				this.hideLastFrame();
			}
		}
	}

	class CallUser {
		elements = {};
		constructor(config = {}) {
			this._onUserFieldChangedHandler = this._onUserFieldChanged.bind(this);
			this.userModel = config.userModel;
			this.userModel.subscribe('changed', this._onUserFieldChangedHandler);
			this.parentContainer = config.parentContainer;
			this.screenSharingUser = main_core.Type.isBoolean(config.screenSharingUser) ? config.screenSharingUser : false;
			this.allowBackgroundItem = main_core.Type.isBoolean(config.allowBackgroundItem) ? config.allowBackgroundItem : true;
			this.allowMaskItem = main_core.Type.isBoolean(config.allowMaskItem) ? config.allowMaskItem : true;
			this._allowPinButton = main_core.Type.isBoolean(config.allowPinButton) ? config.allowPinButton : true;
			this.externalSpeakerManagement = config.externalSpeakerManagement || false;
			this._visible = true;
			this._audioTrack = config.audioTrack;
			this._screenAudioTrack = config.screenAudioTrack;
			this._audioStream = this._audioTrack ? new MediaStream([this._audioTrack]) : null;
			this._screenAudioStream = this._screenAudioTrack ? new MediaStream([this._screenAudioTrack]) : null;
			this._videoTrack = config.videoTrack;
			this._stream = this._videoTrack ? new MediaStream([this._videoTrack]) : null;
			this._videoRenderer = null;
			this._previewRenderer = null;
			this._flipVideo = config.flipVideo || false;
			this._tracksSubscriptionFailed = {};
			this._alwaysShowName = config.alwaysShowName;
			this._hiddenFloorRequest = config.hiddenFloorRequest;
			this._hiddenRemoteParticipantButtonMenu = config.hiddenRemoteParticipantButtonMenu;
			this.hidden = false;
			this.videoBlurState = false;
			this.isChangingName = false;
			this._badNetworkIndicator = false;
			this.incomingVideoConstraints = {
				width: 0,
				height: 0
			};
			if (config.audioElement) {
				this.elements.audio = config.audioElement;
			}
			if (config.screenAudioElement) {
				this.elements.screenAudio = config.screenAudioElement;
			}
			this.callBacks = {
				onClick: main_core.Type.isFunction(config.onClick) ? config.onClick : BX.DoNothing,
				onUserRename: main_core.Type.isFunction(config.onUserRename) ? config.onUserRename : BX.DoNothing,
				onUserRenameInputFocus: main_core.Type.isFunction(config.onUserRenameInputFocus) ? config.onUserRenameInputFocus : BX.DoNothing,
				onUserRenameInputBlur: main_core.Type.isFunction(config.onUserRenameInputBlur) ? config.onUserRenameInputBlur : BX.DoNothing,
				onPin: main_core.Type.isFunction(config.onPin) ? config.onPin : BX.DoNothing,
				onUnPin: main_core.Type.isFunction(config.onUnPin) ? config.onUnPin : BX.DoNothing,
				onTurnOffParticipantMic: main_core.Type.isFunction(config.onTurnOffParticipantMic) ? config.onTurnOffParticipantMic : BX.DoNothing,
				onTurnOffParticipantCam: main_core.Type.isFunction(config.onTurnOffParticipantCam) ? config.onTurnOffParticipantCam : BX.DoNothing,
				onTurnOffParticipantScreenshare: main_core.Type.isFunction(config.onTurnOffParticipantScreenshare) ? config.onTurnOffParticipantScreenshare : BX.DoNothing,
				onAudioElementCreated: main_core.Type.isFunction(config.onAudioElementCreated) ? config.onAudioElementCreated : BX.DoNothing,
				onAudioPlay: main_core.Type.isFunction(config.onAudioPlay) ? config.onAudioPlay : BX.DoNothing
			};
			this.checkAspectInterval = setInterval(this.checkVideoAspect.bind(this), 500);
			this.hintManager = BX.UI.Hint.createInstance({
				popupParameters: {
					targetContainer: document.body,
					className: `bx-messenger-videocall-panel-item-hotkey-hint ${this.userModel.id}`,
					bindOptions: {
						forceBindPosition: true
					}
				}
			});
			this.connectionStats = {};
			this.mediaServerId = null;
			this.connectionStatsVisible = false;
			this.avatarBackground = config.avatarBackground || call_core.Util.getAvatarBackground();
			this.removeAvatarPulseTimer = null;
			this.hideUserNameTimer = null;
			if (!this.userModel.localUser) {
				this.videoFrameKeeper = new VideoFrameKeeper();
			}
		}
		initUserNameState() {
			if (this._alwaysShowName) {
				this.toggleStateUserName(true);
			}
		}
		get id() {
			return this.userModel.id;
		}
		get allowPinButton() {
			return this._allowPinButton;
		}
		set allowPinButton(allowPinButton) {
			if (this._allowPinButton == allowPinButton) {
				return;
			}
			this._allowPinButton = allowPinButton;
			this.update();
		}
		get audioTrack() {
			return this._audioTrack;
		}
		set audioTrack(audioTrack) {
			if (this._audioTrack === audioTrack) {
				return;
			}
			this._audioTrack = audioTrack;
			if (!this._audioTrack) {
				call_core.Util.sendLog({
					description: 'trying to set not defined audioTrack!',
					userModelId: this.userModel?.id
				});
			}
			this._audioStream = this._audioTrack ? new MediaStream([this._audioTrack]) : null;
			this.playAudio();
		}
		get audioStream() {
			return this._audioStream;
		}
		get screenAudioTrack() {
			return this._screenAudioTrack;
		}
		set screenAudioTrack(screenAudioTrack) {
			if (this._screenAudioTrack === screenAudioTrack) {
				return;
			}
			this._screenAudioTrack = screenAudioTrack;
			this._screenAudioStream = this._screenAudioTrack ? new MediaStream([this._screenAudioTrack]) : null;
			this.playScreenAudio();
		}
		get screenAudioStream() {
			return this._screenAudioStream;
		}
		get flipVideo() {
			return this._flipVideo;
		}
		set flipVideo(flipVideo) {
			this._flipVideo = flipVideo;
			this.update();
		}
		get stream() {
			return this._stream;
		}
		get visible() {
			return this._visible;
		}
		set visible(visible) {
			if (this._visible !== visible) {
				this._visible = visible;
				this.update();
				this.updateRendererState();
			}
		}
		get videoRenderer() {
			return this._videoRenderer;
		}
		set videoRenderer(videoRenderer) {
			// we should to reset old video track after switching from a plain call
			// in order to properly check the camera video in hasCameraVideo
			if (this._videoTrack) {
				this._videoTrack = null;
			}
			if (this._badNetworkIndicator) {
				// Voximplant calls logic with support of streams disabling
				if (videoRenderer.stream) {
					this._tempVideoRenderer = videoRenderer;
					this._videoRenderer = null;
				} else {
					this._tempVideoRenderer = this._videoRenderer = null;
				}
			} else {
				// Bitrix calls logic with support of preview
				this._tempVideoRenderer = null;
				const currentVideoRendererKind = this._videoRenderer?.kind;
				const newVideoRendererKind = videoRenderer?.kind;
				if (videoRenderer?.stream) {
					if (newVideoRendererKind === 'sharing' && currentVideoRendererKind === 'video') {
						this._previewRenderer = this._videoRenderer;
						this._videoRenderer = videoRenderer;
					} else if (newVideoRendererKind === 'video' && currentVideoRendererKind === 'sharing') {
						this._previewRenderer = videoRenderer;
					} else {
						this._videoRenderer = videoRenderer;
					}
				} else {
					if (newVideoRendererKind === 'sharing') {
						if (currentVideoRendererKind === 'sharing') {
							this._videoRenderer = this._previewRenderer;
						}
						this._previewRenderer = null;
						delete this.connectionStats[call_core.MediaStreamsKinds.Screen];
					} else if (newVideoRendererKind === 'video') {
						if (currentVideoRendererKind === 'sharing') {
							this._previewRenderer = null;
						} else {
							this._videoRenderer = null;
						}
						delete this.connectionStats[call_core.MediaStreamsKinds.Camera];
					}
					this.showConnectionStats();
				}
			}
			this.update();
			this.updateRendererState();
		}
		get previewRenderer() {
			return this._previewRenderer;
		}
		get videoTrack() {
			return this._videoTrack;
		}
		set videoTrack(videoTrack) {
			if (this._videoTrack === videoTrack) {
				return;
			}
			this._videoTrack = videoTrack;
			if (this._videoTrack && this._stream) {
				this._stream.removeTrack(this._stream.getVideoTracks()[0]);
				this._stream.addTrack(this._videoTrack);
			} else {
				this._stream = this._videoTrack ? new MediaStream([this._videoTrack]) : null;
			}
			this.update();
		}
		set badNetworkIndicator(badNetworkIndicator) {
			if (this._badNetworkIndicator === badNetworkIndicator) {
				return;
			}
			this._badNetworkIndicator = badNetworkIndicator;
			if (this._badNetworkIndicator) {
				if (this._videoRenderer) {
					this._tempVideoRenderer = this._videoRenderer;
					this._videoRenderer = null;
				}
			} else {
				if (this._tempVideoRenderer) {
					this._videoRenderer = this._tempVideoRenderer;
					this._tempVideoRenderer = null;
				}
			}
			this.update();
		}
		set hasConnectionProblem(hasConnectionProblem) {
			this._hasConnectionProblem = hasConnectionProblem;
			if (this._hasConnectionProblem) {
				this.elements.connectionProblem.classList.add('connection-problem-visible');
			} else {
				this.elements.connectionProblem.classList.remove('connection-problem-visible');
			}
		}
		set connectionQuality(connectionQuality) {
			this._connectionQuality = connectionQuality;
			const connectionQualityIcons = {
				excellent: '--excellent-quality-icon',
				good: '--good-quality-icon',
				poor: '--poor-quality-icon',
				bad: '--bad-quality-icon'
			};
			if (this._connectionQuality !== undefined && this.elements.connectionQualityIcon) {
				let resultIcon = connectionQualityIcons.bad;
				if (this._connectionQuality >= 4) {
					resultIcon = connectionQualityIcons.excellent;
				}
				if (this._connectionQuality >= 3 && this._connectionQuality < 4) {
					resultIcon = connectionQualityIcons.good;
				}
				if (this._connectionQuality >= 2 && this._connectionQuality < 3) {
					resultIcon = connectionQualityIcons.poor;
				}
				if (this._connectionQuality < 2) {
					resultIcon = connectionQualityIcons.bad;
				}
				this.elements.connectionQualityIcon.style.setProperty('--connection-quality-icon', `var(${resultIcon})`);
			}
		}
		set audioElement(audioElement) {
			this.elements.audio = audioElement;
		}
		set screenAudioElement(screenAudioElement) {
			this.elements.screenAudio = screenAudioElement;
		}
		isVisibleMediaStateIcon(isActive) {
			return !isActive && this.userModel.state === call_core.UserState.Connected;
		}
		isVisibleCameraStateIcon() {
			return this.isVisibleMediaStateIcon(this.userModel.cameraState);
		}
		isVisibleMicStateIcon() {
			return this.isVisibleMediaStateIcon(this.userModel.microphoneState);
		}
		showStats(stats, mediaServerId) {
			this.connectionStats = stats;
			this.mediaServerId = mediaServerId;
			if (this.elements.statsOverlay && this.connectionStatsVisible) {
				this.showConnectionStats();
			}
		}
		showTrackSubscriptionFailed(track) {
			this._tracksSubscriptionFailed[track.sid] = track;
		}
		_formatFailedSubscribtionTracks() {
			let result = '';
			for (let track in this._tracksSubscriptionFailed) {
				result += this._tracksSubscriptionFailed[track].source + ` ` + track + `\n`;
			}
			return result;
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			this.elements.root = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-user'
				},
				dataset: {
					userId: this.userModel.id,
					order: this.userModel.order
				},
				children: [this.elements.videoBorder = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-user-border'
					}
				}), this.elements.container = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-user-inner'
					},
					children: [this.elements.avatarContainer = main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-user-avatar-border'
						},
						children: [this.elements.avatar = main_core.Dom.create('div', {
							props: {
								className: 'bx-messenger-videocall-user-avatar'
							},
							text: ''
						}), main_core.Dom.create('div', {
							props: {
								className: 'bx-messenger-videocall-user-avatar-overlay-border'
							}
						}), main_core.Dom.create('div', {
							props: {
								className: 'bx-messenger-videocall-user-avatar-pulse-element',
								style: 'animation-delay: -2s;'
							}
						}), main_core.Dom.create('div', {
							props: {
								className: 'bx-messenger-videocall-user-avatar-pulse-element',
								style: 'animation-delay: -1.5s;'
							}
						}), main_core.Dom.create('div', {
							props: {
								className: 'bx-messenger-videocall-user-avatar-pulse-element',
								style: 'animation-delay: -1s;'
							}
						}), main_core.Dom.create('div', {
							props: {
								className: 'bx-messenger-videocall-user-avatar-pulse-element',
								style: 'animation-delay: -0.5s;'
							}
						})]
					}), this.elements.panel = main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-user-panel'
						}
					}), this.elements.state = main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-user-status-text'
						},
						text: this.getStateMessage(this.userModel.state)
					}), main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-user-bottom-gradient'
						}
					}), this.elements.userBottomContainer = main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-user-bottom'
						},
						children: [this.elements.nameContainer = main_core.Dom.create('div', {
							props: {
								className: 'bx-messenger-videocall-user-name-container' + (this.userModel.allowRename && !this.userModel.wasRenamed ? ' hidden' : '')
							},
							children: [this.elements.name = main_core.Dom.create('span', {
								props: {
									className: 'bx-messenger-videocall-user-name',
									title: this.screenSharingUser ? BX.message('IM_CALL_USERS_SCREEN').replace('#NAME#', this.userModel.name) : this.userModel.name
								},
								text: this.screenSharingUser ? BX.message('IM_CALL_USERS_SCREEN').replace('#NAME#', this.userModel.name) : this.userModel.name
							}), this.elements.changeNameIcon = main_core.Dom.create('div', {
								props: {
									className: 'bx-messenger-videocall-user-name-icon bx-messenger-videocall-user-change-name-icon hidden'
								}
							})],
							events: {
								click: this.toggleNameInput.bind(this)
							}
						}), this.elements.changeNameContainer = main_core.Dom.create('div', {
							props: {
								className: 'bx-messenger-videocall-user-change-name-container hidden'
							},
							children: [this.elements.changeNameCancel = main_core.Dom.create('div', {
								props: {
									className: 'bx-messenger-videocall-user-change-name-cancel'
								},
								events: {
									click: this.toggleNameInput.bind(this)
								}
							}), this.elements.changeNameInput = main_core.Dom.create('input', {
								props: {
									className: 'bx-messenger-videocall-user-change-name-input'
								},
								attrs: {
									type: 'text',
									value: this.userModel.name,
									placeholder: BX.message('IM_CALL_GUEST_INPUT_NAME')
								},
								events: {
									keydown: this.onNameInputKeyDown.bind(this),
									focus: this.callBacks.onUserRenameInputFocus,
									blur: this.callBacks.onUserRenameInputBlur,
									click: function (event) {
										event.stopPropagation();
									}
								}
							}), this.elements.changeNameConfirm = main_core.Dom.create('div', {
								props: {
									className: 'bx-messenger-videocall-user-change-name-confirm'
								},
								events: {
									click: this.changeName.bind(this)
								}
							}), this.elements.changeNameLoader = main_core.Dom.create('div', {
								props: {
									className: 'bx-messenger-videocall-user-change-name-loader hidden'
								},
								children: [main_core.Dom.create('div', {
									props: {
										className: 'bx-messenger-videocall-user-change-name-loader-icon'
									}
								})]
							})]
						}), this.elements.introduceYourselfContainer = main_core.Dom.create('div', {
							props: {
								className: 'bx-messenger-videocall-user-introduce-yourself-container' + (!this.userModel.allowRename || this.userModel.wasRenamed ? ' hidden' : '')
							},
							children: [main_core.Dom.create('div', {
								props: {
									className: 'bx-messenger-videocall-user-introduce-yourself-text'
								},
								text: BX.message('IM_CALL_GUEST_INTRODUCE_YOURSELF')
							})],
							events: {
								click: this.toggleNameInput.bind(this)
							}
						})]
					}), this.elements.floorRequest = main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-user-floor-request bx-messenger-videocall-floor-request-icon'
						}
					}), this.elements.statsOverlay = main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-user-stats-overlay'
						}
					})]
				})],
				style: {
					order: this.userModel.order
				},
				events: {
					click: function (e) {
						e.stopPropagation();
						this.callBacks.onClick({
							userId: this.id
						});
					}.bind(this)
				}
			});
			if (this.userModel.talking) {
				this.updateAvatarPulseState();
			}
			this.elements.debugPanel = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-user-debug-panel'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-user-debug-panel-button connection-stats'
					},
					children: [this.elements.connectionQualityIcon = main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-user-debug-panel-button-icon connection-quality-icon',
							title: BX.message('IM_M_CALL_CONNECTION_QUALITY_HINT')
						}
					})],
					events: {
						click: e => {
							e.stopPropagation();
							this.connectionStatsVisible = !this.connectionStatsVisible;
							if (this.connectionStatsVisible) {
								this.showConnectionStats();
								this.elements.statsOverlay.classList.add('stats-overlay-visble');
							} else {
								this.elements.statsOverlay.classList.remove('stats-overlay-visble');
							}
						}
					}
				}), this.elements.connectionProblem = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-user-debug-panel-button connection-problem'
					},
					children: [main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-user-debug-panel-button-icon connection-problem-icon'
						},
						events: {
							mouseover: e => {
								this.hintManager.show(e.currentTarget, BX.message('IM_M_CALL_POOR_CONNECTION_WITH_USER'));
							},
							mouseout: e => {
								this.hintManager.hide();
							}
						}
					})]
				})]
			});
			if (this.userModel.localUser) {
				this.elements.root.classList.add('bx-messenger-videocall-user-self');
			}
			if (this.userModel.avatar !== '') {
				this.elements.root.style.setProperty('--avatar', `url('${this.userModel.avatar}')`);
				this.elements.avatar.innerText = '';
				this.elements.root.style.removeProperty('--avatar-background');
			} else {
				this.elements.root.style.removeProperty('--avatar');
				this.elements.root.style.setProperty('--avatar-background', this.avatarBackground);
				this.elements.avatar.innerText = this.getAvatarInnerText();
			}
			this.elements.videoContainer = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-video-container'
				},
				children: [this.elements.video = main_core.Dom.create('video', {
					props: {
						className: 'bx-messenger-videocall-video',
						volume: 0,
						autoplay: true
					},
					attrs: {
						playsinline: true,
						muted: true
					}
				}), main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-preview'
					},
					children: [main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-preview-container'
						},
						children: [this.elements.preview = main_core.Dom.create('video', {
							props: {
								className: 'bx-messenger-videocall-preview-video',
								volume: 0,
								autoplay: true
							},
							attrs: {
								playsinline: true,
								muted: true
							}
						})]
					})]
				})]
			});
			this.elements.container.appendChild(this.elements.videoContainer);
			if (this.videoFrameKeeper) {
				this.videoFrameKeeper.attach(this.elements.video, {
					captureInterval: 10000
				});
			}
			if (this.stream && this.stream.active) {
				this.elements.video.srcObject = this.stream;
			}
			if (this.flipVideo) {
				this.elements.video.classList.add('bx-messenger-videocall-video-flipped');
			}
			if (this.userModel.screenState) {
				this.elements.video.classList.add('bx-messenger-videocall-video-contain');
			}
			if (this.isVisibleCameraStateIcon() && this.isVisibleMicStateIcon()) {
				this.elements.nameContainer.classList.add('extra-padding');
			}

			//this.elements.nameContainer.appendChild(this.elements.micState);

			// todo: show button only if user have the permission to remove user
			/*this.elements.removeButton = Dom.create('div', {
				props: {className: 'bx-messenger-videocall-user-close'}
			});
				this.elements.container.appendChild(this.elements.removeButton);*/

			this.elements.buttonBackground = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-user-panel-button'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-user-panel-button-icon background'
					}
				}), main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-user-panel-button-text'
					},
					text: BX.message('IM_CALL_CHANGE_BACKGROUND')
				})],
				events: {
					click: e => {
						e.stopPropagation();
						call_core.BackgroundDialog.open();
					}
				}
			});
			this.elements.buttonMenu = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-user-panel-button'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-user-panel-button-icon menu'
					}
				})],
				events: {
					click: e => {
						e.stopPropagation();
						this.showMenu();
					}
				}
			});
			if (!this._hiddenRemoteParticipantButtonMenu) {
				this.elements.remoteParticipantButtonMenu = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-user-panel-button'
					},
					children: [main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-user-panel-button-icon menu'
						}
					})],
					events: {
						click: e => {
							e.stopPropagation();
							this.showRemoteParticipantMenu();
						}
					}
				});
			}
			this.elements.buttonPin = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-user-panel-button'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-user-panel-button-icon pin'
					}
				}), main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-user-panel-button-text'
					},
					text: BX.message('IM_CALL_PIN')
				})],
				events: {
					click: e => {
						e.stopPropagation();
						this.callBacks.onPin({
							userId: this.userModel.id
						});
					}
				}
			});
			this.elements.buttonUnPin = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-user-panel-button'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-user-panel-button-icon unpin'
					}
				}), main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-user-panel-button-text'
					},
					text: BX.message('IM_CALL_UNPIN')
				})],
				events: {
					click: e => {
						e.stopPropagation();
						this.callBacks.onUnPin();
					}
				}
			});
			this.elements.userBottomContainer.appendChild(main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-user-device-state-container'
				},
				children: [this.elements.micState = main_core.Dom.create('div', {
					props: {
						className: `bx-messenger-videocall-user-name-icon bx-messenger-videocall-user-device-state mic${this.isVisibleMicStateIcon() ? '' : ' hidden'}`
					}
				}), this.elements.cameraState = main_core.Dom.create('div', {
					props: {
						className: `bx-messenger-videocall-user-name-icon bx-messenger-videocall-user-device-state camera${this.isVisibleCameraStateIcon() ? '' : ' hidden'}`
					}
				})]
			}));
			this.updatePanelDeferred();
			return this.elements.root;
		}
		showConnectionStats() {
			if (!this.elements.statsOverlay) {
				return;
			}
			let statsString = '';
			const cameraStats = this.connectionStats?.[call_core.MediaStreamsKinds.Camera];
			const screenStats = this.connectionStats?.[call_core.MediaStreamsKinds.Screen];
			const audioStats = this.connectionStats?.[call_core.MediaStreamsKinds.Microphone];
			const failedTracksResult = this._formatFailedSubscribtionTracks();
			if (failedTracksResult) {
				statsString += 'Failed subscribe to:\n';
				statsString += failedTracksResult;
			}
			if (this.mediaServerId) {
				statsString += `Media server: #${this.mediaServerId}\n\n`;
			}
			if (cameraStats || !screenStats) {
				statsString += 'Video stats:\n';
				statsString += this._formatVideoStats(cameraStats);
			}
			if (screenStats) {
				statsString += '\n\nScreen share stats:\n';
				statsString += this._formatVideoStats(screenStats);
			}
			if (audioStats) {
				statsString += '\n\nAudio stats:\n';
				statsString += `Bitrate: ${audioStats?.bitrate || 0}\n`;
				statsString += `PacketsLost: ${audioStats?.packetsLostExtended || 0}\n`;
				statsString += `Codec: ${audioStats?.codecName || '-'}`;
			}
			this.elements.statsOverlay.innerText = statsString;
		}
		setIncomingVideoConstraints(width, height) {
			this.incomingVideoConstraints.width = typeof width === 'undefined' ? this.incomingVideoConstraints.width : width;
			this.incomingVideoConstraints.height = typeof height === 'undefined' ? this.incomingVideoConstraints.height : height;
			if (!this.videoRenderer) {
				return;
			}

			// vox low quality temporary workaround
			// (disabled to test quality)
			// if (this.incomingVideoConstraints.width >= 320 && this.incomingVideoConstraints.width <= 640)
			// {
			// 	this.incomingVideoConstraints.width = 640;
			// }
			// if (this.incomingVideoConstraints.height >= 180 && this.incomingVideoConstraints.height <= 360)
			// {
			// 	this.incomingVideoConstraints.height = 360;
			// }

			this.videoRenderer.requestVideoSize(this.incomingVideoConstraints.width, this.incomingVideoConstraints.height);
		}
		updateRendererState() {
			/*if (this.videoRenderer)
			{
				if (this.visible)
				{
					this.videoRenderer.enable();
				}
				else
				{
					this.videoRenderer.disable();
				}
			}*/

			/*if (this.elements.video && this.elements.video.srcObject)
			{
				if (this.visible)
				{
					this.elements.video.play();
				}
				else
				{
					this.elements.video.pause();
				}
			}*/
		}
		_onUserFieldChanged(event) {
			const eventData = event.data;
			switch (eventData.fieldName) {
				case 'id':
					return this.updateId();
				case 'name':
					return this.updateName();
				case 'avatar':
					return this.updateAvatar();
				case 'state':
					return this.updateState();
				case 'talking':
					return this.updateTalking();
				case 'microphoneState':
					return this.updateMicrophoneState();
				case 'cameraState':
					return this.updateCameraState();
				case 'videoPaused':
					return this.updateVideoPaused();
				case 'floorRequestState':
					return this.updateFloorRequestState();
				case 'screenState':
					return this.updateScreenState();
				case 'pinned':
					return this.updatePanel();
				case 'allowRename':
					return this.updateRenameAllowed();
				case 'wasRenamed':
					return this.updateWasRenamed();
				case 'renameRequested':
					return this.updateRenameRequested();
				case 'order':
					return this.updateOrder();
			}
		}
		toggleRenameIcon() {
			if (!this.userModel.allowRename) {
				return;
			}
			this.elements.changeNameIcon.classList.toggle('hidden');
		}
		toggleNameInput(event) {
			if (!this.userModel.allowRename || !this.elements.root) {
				return;
			}
			event.stopPropagation();
			if (this.isChangingName) {
				this.isChangingName = false;
				if (!this.userModel.wasRenamed) {
					this.elements.introduceYourselfContainer.classList.remove('hidden');
					this.elements.changeNameContainer.classList.add('hidden');
				} else {
					this.elements.changeNameContainer.classList.add('hidden');
					this.elements.nameContainer.classList.remove('hidden');
				}
			} else {
				if (!this.userModel.wasRenamed) {
					this.elements.introduceYourselfContainer.classList.add('hidden');
				}
				this.isChangingName = true;
				this.elements.nameContainer.classList.add('hidden');
				this.elements.changeNameContainer.classList.remove('hidden');
				this.elements.changeNameInput.value = this.userModel.name;
				this.elements.changeNameInput.focus();
				this.elements.changeNameInput.select();
			}
		}
		onNameInputKeyDown(event) {
			if (!this.userModel.allowRename) {
				return;
			}

			//enter
			if (event.keyCode === 13) {
				this.changeName(event);
			}
			//escape
			else if (event.keyCode === 27) {
				this.toggleNameInput(event);
			}
		}
		onNameInputFocus(event) {}
		onNameInputBlur(event) {}
		changeName(event) {
			event.stopPropagation();
			const inputValue = this.elements.changeNameInput.value;
			const newName = inputValue.trim();
			let needToUpdate = true;
			if (newName === this.userModel.name || newName === '') {
				needToUpdate = false;
			}
			if (needToUpdate) {
				this.elements.changeNameConfirm.classList.toggle('hidden');
				this.elements.changeNameLoader.classList.toggle('hidden');
				this.callBacks.onUserRename(newName);
			} else {
				this.toggleNameInput(event);
			}
		}
		showMenu() {
			const menuItems = [];
			if (this.userModel.localUser && this.allowBackgroundItem) {
				menuItems.push({
					text: this.allowMaskItem ? BX.message('IM_CALL_CHANGE_BG_MASK') : BX.message('IM_CALL_CHANGE_BACKGROUND'),
					onclick: () => {
						this.menu.close();
						call_core.BackgroundDialog.open();
					}
				});
			}
			if (menuItems.length === 0) {
				return;
			}
			let rect = main_core.Dom.getRelativePosition(this.elements.buttonMenu, this.parentContainer);
			this.menu = new main_popup.Menu({
				id: 'call-view-user-menu-' + this.userModel.id,
				className: 'bx-call-user-context-menu',
				background: '#00428F',
				contentBackground: '#00428F',
				darkMode: true,
				contentBorderRadius: '6px',
				borderRadius: '6px',
				bindElement: {
					left: rect.left,
					top: rect.top,
					bottom: rect.bottom
				},
				items: menuItems,
				targetContainer: this.parentContainer,
				autoHide: true,
				closeByEsc: true,
				offsetTop: 0,
				offsetLeft: 0,
				bindOptions: {
					position: 'bottom'
				},
				angle: true,
				overlay: {
					backgroundColor: 'white',
					opacity: 0
				},
				cacheable: false,
				events: {
					onPopupDestroy: () => this.menu = null
				}
			});
			this.menu.show();
		}
		showRemoteParticipantMenu() {
			if (this.remoteParticipantMenu) {
				this.remoteParticipantMenu.destroy();
				this.remoteParticipantMenu = null;
			}
			const menuItems = [];
			if (!this.userModel.localUser) {
				if (this.userModel.microphoneState) {
					menuItems.push({
						text: BX.message('CALL_REMOTE_USER_DROPDOWN_MENU_TURN_OFF_MIC'),
						className: 'bx-call-remote-user-turn-off-mic',
						disabled: !this.userModel.microphoneState,
						onclick: () => {
							this.remoteParticipantMenu.destroy();
							this.callBacks.onTurnOffParticipantMic({
								userId: this.userModel.id
							});
						}
					});
				}
				if (this.userModel.cameraState) {
					menuItems.push({
						text: BX.message('CALL_REMOTE_USER_DROPDOWN_MENU_TURN_OFF_CAM'),
						className: 'bx-call-remote-user-turn-off-cam',
						disabled: !this.userModel.cameraState,
						onclick: () => {
							this.remoteParticipantMenu.destroy();
							this.callBacks.onTurnOffParticipantCam({
								userId: this.userModel.id
							});
						}
					});
				}
				if (this.userModel.screenState) {
					menuItems.push({
						text: BX.message('CALL_REMOTE_USER_DROPDOWN_MENU_TURN_OFF_SCREENSHARE'),
						className: 'bx-call-remote-user-turn-off-screenshare',
						disabled: !this.userModel.screenState,
						onclick: () => {
							this.remoteParticipantMenu.destroy();
							this.callBacks.onTurnOffParticipantScreenshare({
								userId: this.userModel.id
							});
						}
					});
				}
			}
			if (menuItems.length === 0) {
				return;
			}
			let rect = main_core.Dom.getRelativePosition(this.elements.remoteParticipantButtonMenu, this.parentContainer);
			this.remoteParticipantMenu = new main_popup.Menu({
				id: 'call-view-user-menu-' + this.userModel.id,
				className: 'bx-call-remote-user-menu-container',
				background: '#00428F',
				contentBackground: '#00428F',
				contentBorderRadius: '6px',
				borderRadius: '6px',
				bindElement: {
					left: rect.left,
					top: rect.top,
					bottom: rect.bottom
				},
				items: menuItems,
				targetContainer: this.parentContainer,
				darkMode: true,
				autoHide: true,
				closeByEsc: true,
				angle: true,
				offsetTop: 0,
				bindOptions: {
					position: 'bottom'
				},
				overlay: {
					backgroundColor: 'white',
					opacity: 0
				},
				cacheable: false,
				events: {
					onShow: event => {
						const popup = event.getTarget();
						popup.adjustPosition();
						this.elements.root.classList.add('bx-messenger-videocall-user-dropdown-menu-opened');
					},
					onPopupDestroy: () => {
						this.elements.root.classList.remove('bx-messenger-videocall-user-dropdown-menu-opened');
						this.remoteParticipantMenu = null;
					}
				}
			});
			this.remoteParticipantMenu.show();
		}
		updateAvatar() {
			if (this.elements.root) {
				if (this.userModel.avatar !== '') {
					this.elements.root.style.setProperty('--avatar', `url('${this.userModel.avatar}')`);
					this.elements.avatar.innerText = '';
					this.elements.root.style.removeProperty('--avatar-background');
				} else {
					this.elements.root.style.removeProperty('--avatar');
					this.elements.root.style.setProperty('--avatar-background', this.avatarBackground);
					this.elements.avatar.innerText = this.getAvatarInnerText();
				}
			}
		}
		updateId() {
			if (this.elements.root) {
				this.elements.root.dataset.userId = this.userModel.id;
			}
		}
		updateName() {
			if (this.isChangingName) {
				this.isChangingName = false;
				this.elements.changeNameConfirm.classList.toggle('hidden');
				this.elements.changeNameLoader.classList.toggle('hidden');
				this.elements.changeNameContainer.classList.add('hidden');
				this.elements.nameContainer.classList.remove('hidden');
			}
			if (this.elements.name) {
				this.elements.name.innerText = this.screenSharingUser ? BX.message('IM_CALL_USERS_SCREEN').replace('#NAME#', this.userModel.name) : this.userModel.name;
			}
			if (this.userModel.avatar === '' && this.elements.avatar) {
				this.elements.avatar.innerText = this.getAvatarInnerText();
			}
		}
		getAvatarInnerText() {
			return im_v2_lib_utils.Utils.text.getFirstLetters(this.userModel.name).toUpperCase();
		}
		updateRenameAllowed() {
			if (this.userModel.allowRename && this.elements.nameContainer && this.elements.introduceYourselfContainer) {
				this.elements.nameContainer.classList.add('hidden');
				this.elements.introduceYourselfContainer.classList.remove('hidden');
			}
		}
		updateWasRenamed() {
			if (!this.elements.root) {
				return;
			}
			if (this.userModel.allowRename) {
				this.elements.introduceYourselfContainer.classList.add('hidden');
				this.elements.changeNameIcon.classList.remove('hidden');
				if (this.elements.changeNameContainer.classList.contains('hidden')) {
					this.elements.nameContainer.classList.remove('hidden');
				}
			}
		}
		updateRenameRequested() {
			if (this.userModel.allowRename) {
				this.elements.introduceYourselfContainer.classList.add('hidden');
			}
		}
		updateOrder() {
			if (this.elements.root) {
				this.elements.root.dataset.order = this.userModel.order;
				this.elements.root.style.order = this.userModel.order;
			}
		}
		updatePanelDeferred() {
			setTimeout(this.updatePanel.bind(this), 0);
		}
		updatePanel() {
			if (!this.isMounted()) {
				return;
			}
			const width = this.elements.root.offsetWidth;
			const initialUpdate = !this.elements.panel.hasChildNodes();
			const remoteControlBtn = this.elements.remoteParticipantButtonMenu;
			const hasRemoteControlBtn = Boolean(remoteControlBtn && remoteControlBtn.parentElement === this.elements.panel);
			const shouldShowRemoteControlBtn = this.#shouldShowRemoteParticipantButton() && Boolean(remoteControlBtn);
			const remoteBtnChanged = hasRemoteControlBtn !== shouldShowRemoteControlBtn;
			if (this.lastWIdth && this.lastWIdth === width && !initialUpdate && !remoteBtnChanged) {
				return;
			}
			const canChangeBackground = this.userModel.localUser && this.allowBackgroundItem;
			const needChangeBackgroundButton = this.lastWIdth || this.lastWIdth <= 300 && width > 300 || this.lastWIdth > 300 && width <= 300;
			const needChangePinButton = this.userModel.pinned && Boolean(this.elements.buttonPin.parentElement);
			const needChangeUnPinButton = !this.userModel.pinned && Boolean(this.elements.buttonUnPin.parentElement);
			const needToUpdate = initialUpdate || canChangeBackground && needChangeBackgroundButton || needChangePinButton || needChangeUnPinButton;
			this.lastWIdth = width;
			if (needToUpdate) {
				main_core.Dom.clean(this.elements.panel);
			}
			if (canChangeBackground && (needChangeBackgroundButton || initialUpdate)) {
				if (width > 300) {
					main_core.Dom.append(this.elements.buttonBackground, this.elements.panel);
				} else {
					main_core.Dom.append(this.elements.buttonMenu, this.elements.panel);
				}
			}
			if (this.allowPinButton) {
				if (initialUpdate || needChangePinButton || needChangeUnPinButton) {
					if (this.userModel.pinned) {
						main_core.Dom.append(this.elements.buttonUnPin, this.elements.panel);
					} else {
						main_core.Dom.append(this.elements.buttonPin, this.elements.panel);
					}
				}
				if (width > 250) {
					this.elements.buttonPin.classList.remove('no-text');
					this.elements.buttonUnPin.classList.remove('no-text');
				} else {
					this.elements.buttonPin.classList.add('no-text');
					this.elements.buttonUnPin.classList.add('no-text');
				}
			}
			if (remoteControlBtn) {
				const isInPanel = remoteControlBtn.parentElement === this.elements.panel;
				if (shouldShowRemoteControlBtn && !isInPanel) {
					main_core.Dom.append(remoteControlBtn, this.elements.panel);
				} else if (!shouldShowRemoteControlBtn && isInPanel) {
					main_core.Dom.remove(remoteControlBtn);
				}
			}
		}
		#shouldShowRemoteParticipantButton() {
			if (this.userModel.localUser) {
				return false;
			}
			const currentBitrixCall = call_core.Util.getCurrentBitrixCall();
			const isControllable = call_core.Util.isUserControlFeatureEnabled() && call_core.Util.canControlChangeSettings();
			const hasActiveMedia = this.userModel.microphoneState || this.userModel.cameraState || this.userModel.screenState;
			const isBitrixCall = currentBitrixCall && currentBitrixCall.provider !== call_core.Provider.Plain;
			return isControllable && hasActiveMedia && isBitrixCall;
		}
		playVideoElements(videoElement) {
			const hasVideoEl = Boolean(videoElement);
			const isCanPlaying = hasVideoEl && Boolean(videoElement.srcObject);
			const isReadyPlaying = hasVideoEl && videoElement.readyState >= videoElement.HAVE_CURRENT_DATA;
			const isEnded = hasVideoEl && videoElement.ended;
			if (isCanPlaying && isReadyPlaying && !isEnded) {
				videoElement.play().catch(logPlaybackError);
			}
			if (isCanPlaying && isEnded) {
				videoElement.load();
			}
			if (isCanPlaying && !isReadyPlaying && !isEnded && !videoElement.onloadeddata) {
				videoElement.onloadeddata = () => {
					this.playVideoElements(videoElement);
				};
			}
		}
		update() {
			if (!this.elements.root) {
				return;
			}
			if (this.hasVideo() /* && this.visible*/) {
				if (this.visible) {
					if (this.videoRenderer) {
						this.videoRenderer.render(this.elements.video);
						this.playVideoElements(this.elements.video);
						if (this._previewRenderer) {
							this._previewRenderer.render(this.elements.preview);
						} else {
							this.elements.preview.srcObject = null;
						}
					} else if (this.stream && this.elements.video.srcObject?.id !== this.stream?.id) {
						this.elements.video.srcObject = this.stream;
						this.playVideoElements(this.elements.video);
					}
					if (this.elements.avatarContainer) {
						this.elements.avatarContainer.classList.add('bx-messenger-videocall-hidden-avatar');
					}
				}
				if (this.videoRenderer?.kind === 'video' && this.flipVideo) {
					this.elements.video.classList.toggle('bx-messenger-videocall-video-flipped', this.flipVideo);
					this.elements.preview.classList.toggle('bx-messenger-videocall-video-flipped', !this.flipVideo);
				} else if (this.videoRenderer?.kind === 'sharing' && this.flipVideo) {
					this.elements.video.classList.toggle('bx-messenger-videocall-video-flipped', !this.flipVideo);
					this.elements.preview.classList.toggle('bx-messenger-videocall-video-flipped', this.flipVideo);
				} else {
					this.elements.video.classList.toggle('bx-messenger-videocall-video-flipped', this.flipVideo);
				}
				this.elements.video.classList.toggle('bx-messenger-videocall-video-contain', this.userModel.screenState);
			} else {
				this.elements.video.srcObject = null;
				this.elements.preview.srcObject = null;
				if (this.elements.avatarContainer) {
					this.elements.avatarContainer.classList.remove('bx-messenger-videocall-hidden-avatar');
				}
			}
			if (call_core.Util.isCallServerAllowed() && this.userModel.state === call_core.UserState.Connected && !this.elements.debugPanel.parentElement && !this.screenSharingUser) {
				this.elements.container.appendChild(this.elements.debugPanel);
			}
			this.updatePanelDeferred();
		}
		playAudio() {
			if (!this.audioStream) {
				this.elements.audio.srcObject = null;
				call_core.Util.sendLog({
					description: 'no audioStream to play',
					userModelId: this.userModel?.id
				});
				return;
			}
			if (this.externalSpeakerManagement) {
				this.elements.audio.srcObject = this.audioStream;
				this.callBacks.onAudioElementCreated(this.elements.audio);
				this.elements.audio.play().catch(logPlaybackError);
				this.callBacks.onAudioPlay(this.elements.audio);
				return;
			}
			if (this.speakerId && main_core.Type.isFunction(this.elements.audio.setSinkId)) {
				this.elements.audio.setSinkId(this.speakerId).then(function () {
					this.elements.audio.srcObject = this.audioStream;
					this.elements.audio.play().catch(logPlaybackError);
				}.bind(this)).catch(console.error);
			} else {
				this.elements.audio.srcObject = this.audioStream;
				this.elements.audio.play().catch(logPlaybackError);
			}
		}
		playScreenAudio() {
			if (!this.screenAudioStream) {
				this.elements.screenAudio.srcObject = null;
				return;
			}
			this.elements.screenAudio.srcObject = this.screenAudioStream;
			this.elements.screenAudio.play().catch(logPlaybackError);
		}
		playVideo() {
			this.playVideoElements(this.elements.video);
			this.playVideoElements(this.elements.preview);
		}
		blurVideo(blurState) {
			blurState = !!blurState;
			if (this.videoBlurState == blurState) {
				return;
			}
			this.videoBlurState = blurState;
			if (this.elements.video) {
				this.elements.video.classList.toggle('bx-messenger-videocall-video-blurred');
			}
		}
		getStateMessage(userState, videoPaused) {
			switch (userState) {
				case call_core.UserState.Idle:
					return '';
				case call_core.UserState.Calling:
					return BX.message('IM_M_CALL_STATUS_WAIT_ANSWER');
				case call_core.UserState.Declined:
					return BX.message('IM_M_CALL_STATUS_DECLINED');
				case call_core.UserState.Ready:
				case call_core.UserState.Connecting:
					return BX.message('IM_M_CALL_STATUS_WAIT_CONNECT');
				case call_core.UserState.Connected:
					return videoPaused ? BX.message('IM_M_CALL_STATUS_VIDEO_PAUSED') : '';
				case call_core.UserState.Failed:
					return BX.message('IM_M_CALL_STATUS_CONNECTION_ERROR');
				case call_core.UserState.Unavailable:
					return BX.message('IM_M_CALL_STATUS_UNAVAILABLE');
				default:
					return '';
			}
		}
		mount(parent, force) {
			force = force === true;
			if (!this.elements.root) {
				this.render();
				this.initUserNameState();
			}
			if (this.isMounted() && this.elements.root.parentElement == parent && !force) {
				this.updatePanelDeferred();
				return false;
			} else {
				this.checkAspectInterval = setInterval(this.checkVideoAspect.bind(this), 500);
			}
			parent.appendChild(this.elements.root);
			this.update();
		}
		dismount() {
			// this.visible = false;
			if (!this.isMounted()) {
				return false;
			}
			clearInterval(this.checkAspectInterval);
			this.elements.video.srcObject = null;
			this.elements.preview.srcObject = null;
			main_core.Dom.remove(this.elements.root);
		}
		isMounted() {
			return !!(this.elements.root && this.elements.root.parentElement);
		}
		updateState() {
			if (!this.elements.root) {
				return;
			}
			if (this.userModel.state == call_core.UserState.Calling || this.userModel.state == call_core.UserState.Connecting) {
				this.updateAvatarPulseState();
			} else {
				this.addAvatarPulseTimer();
			}
			if (this.userModel.state == call_core.UserState.Idle) {
				this._videoRenderer = null;
				this._previewRenderer = null;
				this._audioTrack = null;
				this._audioStream = null;
			}
			this.elements.state.innerText = this.getStateMessage(this.userModel.state, this.userModel.videoPaused);
			this.updateMicrophoneState();
			this.updateCameraState();
			this.update();
		}
		updateTalking() {
			if (!this.elements.root) {
				return;
			}
			if (this.userModel.talking) {
				this.updateAvatarPulseState();
			} else {
				this.addAvatarPulseTimer();
			}
		}
		updateMicrophoneState() {
			if (!this.elements.root) {
				return;
			}
			if (!this.isVisibleMicStateIcon()) {
				this.elements.micState.classList.add('hidden');
			} else {
				this.elements.micState.classList.remove('hidden');
				this.clearAvatarPulseTimer();
			}
			if (this.isVisibleCameraStateIcon() && this.isVisibleMicStateIcon()) {
				this.elements.nameContainer.classList.add('extra-padding');
			} else {
				this.elements.nameContainer.classList.remove('extra-padding');
			}
			this.updateRemoteParticipantMenuState();
		}
		updateCameraState() {
			if (!this.elements.root) {
				return;
			}
			if (!this.isVisibleCameraStateIcon()) {
				this.elements.cameraState.classList.add('hidden');
			} else {
				this.elements.cameraState.classList.remove('hidden');
			}
			if (this.isVisibleCameraStateIcon() && this.isVisibleMicStateIcon()) {
				this.elements.nameContainer.classList.add('extra-padding');
			} else {
				this.elements.nameContainer.classList.remove('extra-padding');
			}
			this.updateRemoteParticipantMenuState();
		}
		updateRemoteParticipantMenuState() {
			if (this.remoteParticipantMenu) {
				this.showRemoteParticipantMenu();
			}
			this.updatePanelDeferred();
		}
		updateVideoPaused() {
			if (!this.elements.root) {
				return;
			}
			if (this.stream && this.hasVideo()) {
				this.blurVideo(this.userModel.videoPaused);
			}
			this.updateState();
		}
		updateFloorRequestState() {
			if (!this.elements.floorRequest || this._hiddenFloorRequest) {
				return;
			}
			if (this.userModel.floorRequestState) {
				this.elements.floorRequest.classList.add('active');
			} else {
				this.elements.floorRequest.classList.remove('active');
			}
		}
		updateScreenState() {
			if (!this.elements.video) {
				return;
			}
			if (this.userModel.screenState) {
				this.elements.video.classList.add('bx-messenger-videocall-video-contain');
			} else {
				this.elements.video.classList.remove('bx-messenger-videocall-video-contain');
			}
		}
		hide() {
			if (!this.elements.root) {
				return;
			}
			this.elements.root.dataset.hidden = 1;
		}
		show() {
			if (!this.elements.root) {
				return;
			}
			delete this.elements.root.dataset.hidden;
		}
		hasAudio() {
			const isConnected = this.userModel.state === call_core.UserState.Connected;
			const hasAudioTrack = Boolean(this._audioTrack) || Boolean(this._screenAudioTrack);
			return isConnected && hasAudioTrack;
		}
		hasVideo() {
			if (call_core.Hardware.maxLocalStreamQualityHeight === call_core.LOCAL_STREAM_QUALITY_HEIGHT.NO_VIDEO) {
				return false;
			}
			return this.userModel.state == call_core.UserState.Connected && (!!this._videoTrack || !!this._videoRenderer);
		}
		hasCameraVideo() {
			return this.userModel.state == call_core.UserState.Connected && (!!this._videoTrack || this._videoRenderer?.kind === 'video' || this._previewRenderer?.kind === 'video');
		}
		checkVideoAspect() {
			if (!this.elements.video) {
				return;
			}
			if (this.elements.video.videoHeight > this.elements.video.videoWidth) {
				this.elements.video.classList.add('bx-messenger-videocall-video-vertical');
			} else {
				this.elements.video.classList.remove('bx-messenger-videocall-video-vertical');
			}
		}
		releaseStream() {
			if (this._videoRenderer && !this._previewRenderer) {
				if (this.elements.video) {
					this.elements.video.srcObject = null;
				}
				this._videoRenderer = null;
			} else {
				if (this.elements.video) {
					this.elements.video.srcObject = null;
				}
				this.videoTrack = null;
			}
		}
		_getVideoStats(videoStats) {
			let resultString = '';
			let limitationsString = '';
			resultString += `Bitrate: ${videoStats?.bitrate || 0}\n`;
			resultString += `Track ID: ${videoStats?.trackIdentifier || 'no track id!'}\n`;
			resultString += `PacketsLost: ${videoStats?.packetsLostExtended || 0}\n`;
			resultString += `Codec: ${videoStats?.codecName || '-'}\n`;
			resultString += `Resolution: ${videoStats?.frameWidth || 0}x${videoStats?.frameHeight || 0} \n`;
			resultString += `In Remote Tracks: ${videoStats?.inRemoteTracks || 'U'} \n`;
			if (videoStats?.qualityLimitationReason) {
				resultString += `(changes:${videoStats.qualityLimitationResolutionChanges}, FPS: ${videoStats?.framesPerSecond || 0})`;
				limitationsString = `Limitation: ${videoStats.qualityLimitationReason}`;
				limitationsString += ` (duration: ${Object.entries(videoStats.qualityLimitationDurations || {}).reduce((accumulator, value, index) => accumulator + `${index ? ', ' : ''}` + `${value[0]}: ${value[1]}`, '')})`;
			} else {
				resultString += `(${videoStats?.framesPerSecond || 0} FPS)`;
			}
			return {
				resultString,
				limitationsString
			};
		}
		_formatVideoStats(videoStats) {
			let result = '';
			let limitations = '';
			if (main_core.Type.isArray(videoStats)) {
				videoStats.forEach((stats, trackIndex) => {
					if (trackIndex) {
						result += `\n\n`;
					}
					if (videoStats.length > 1) {
						result += `Track ${trackIndex + 1}\n`;
					}
					const {
						resultString,
						limitationsString
					} = this._getVideoStats(stats);
					if (resultString) {
						result += resultString;
					}
					if (limitationsString) {
						limitations = limitationsString;
					}
				});
			} else {
				const {
					resultString,
					limitationsString
				} = this._getVideoStats(videoStats);
				if (resultString) {
					result += resultString;
				}
				if (limitationsString) {
					limitations = limitationsString;
				}
			}
			return limitations ? `${limitations}\n\n${result}` : result;
		}
		toggleStateUserName(isActive) {
			if (!this.elements.nameContainer) {
				return;
			}
			const activeClassName = 'active';
			const hasActiveClass = this.elements.nameContainer.classList.contains(activeClassName);
			if (hasActiveClass !== isActive) {
				this.elements.nameContainer.classList.toggle(activeClassName);
			}
		}
		showLastVideoFrame() {
			if (!this.videoFrameKeeper || !this.elements.videoContainer) {
				return;
			}
			this.videoFrameKeeper.showLastFrame(this.elements.videoContainer);
		}
		destroy() {
			if (this.hintManager) {
				this.hintManager.hide();
				this.hintManager = null;
			}
			this.userModel.unsubscribe('changed', this._onUserFieldChangedHandler);
			this.releaseStream();
			clearInterval(this.checkAspectInterval);
			if (this.videoFrameKeeper) {
				this.videoFrameKeeper.destroy();
				this.videoFrameKeeper = null;
			}
		}
		addAvatarPulseTimer() {
			if (this.removeAvatarPulseTimer) {
				clearTimeout(this.removeAvatarPulseTimer);
				this.removeAvatarPulseTimer = null;
			}
			this.removeAvatarPulseTimer = setTimeout(() => {
				this.elements.avatarContainer.classList.remove('bx-messenger-videocall-user-avatar-pulse');
				this.elements.root.classList.remove('bx-messenger-videocall-user-talking');
			}, 1000);
		}
		clearAvatarPulseTimer() {
			if (this.removeAvatarPulseTimer) {
				clearTimeout(this.removeAvatarPulseTimer);
				this.removeAvatarPulseTimer = null;
			}
			this.elements.avatarContainer.classList.remove('bx-messenger-videocall-user-avatar-pulse');
			this.elements.root.classList.remove('bx-messenger-videocall-user-talking');
		}
		updateAvatarPulseState() {
			if (this.removeAvatarPulseTimer) {
				clearTimeout(this.removeAvatarPulseTimer);
				this.removeAvatarPulseTimer = null;
			}
			this.elements.avatarContainer.classList.add('bx-messenger-videocall-user-avatar-pulse');
			if (this.userModel.talking) {
				this.elements.root.classList.add('bx-messenger-videocall-user-talking');
			}
		}
	}

	class FloorRequest extends main_core_events.EventEmitter {
		#onUserModelChangedHandler;
		constructor(config) {
			super();
			this.setEventNamespace('BX.Call.FloorRequest');
			this.userModel = config.userModel;
			this.isShowAllowPermissionButton = this.#canChangeSpeakPermission();
			this.elements = {
				root: null,
				avatar: null,
				button: null,
				close: null
			};
			this.callbacks = {
				onAllowSpeakPermissionClicked: main_core.Type.isFunction(config.onAllowSpeakPermissionClicked) ? config.onAllowSpeakPermissionClicked : BX.DoNothing,
				onDisallowSpeakPermissionClicked: main_core.Type.isFunction(config.onDisallowSpeakPermissionClicked) ? config.onDisallowSpeakPermissionClicked : BX.DoNothing,
				onDestroy: main_core.Type.isFunction(config.onDestroy) ? config.onDestroy : BX.DoNothing
			};
			this.container = null;
			this.#onUserModelChangedHandler = this.#onUserModelChanged.bind(this);
			this.userModel.subscribe('changed', this.#onUserModelChangedHandler);
		}
		static create(config) {
			return new FloorRequest(config);
		}
		#canChangeSpeakPermission() {
			return call_core.Util.isUserControlFeatureEnabled() && !this.userModel.localUser && !this.userModel.permissionToSpeak && !call_core.Util.getRoomPermissions().AudioEnabled && call_core.Util.canControlGiveSpeakPermission();
		}
		mount(container) {
			this.container = container;
			main_core.Dom.append(this.render(), this.container);
		}
		updatePermissionButtonState() {
			this.isShowAllowPermissionButton = this.#canChangeSpeakPermission();
			if (!this.elements?.root) {
				return;
			}
			if (this.isShowAllowPermissionButton && !this.elements.button) {
				this.elements.button = this.createAllowPermissionButton();
				main_core.Dom.insertBefore(this.elements.button, this.elements.close);
			} else if (!this.isShowAllowPermissionButton && this.elements.button) {
				main_core.Dom.remove(this.elements.button);
				this.elements.button = null;
			}
		}
		dismount() {
			if (this.elements) {
				main_core.Dom.remove(this.elements.root);
			}
			this.destroy();
		}
		#onCloseClicked(event) {
			event.stopPropagation();
			if (this.isShowAllowPermissionButton) {
				this.callbacks.onDisallowSpeakPermissionClicked(this.userModel);
			}
			this.dismount();
		}
		dismountWithAnimation() {
			if (!this.elements.root) {
				return;
			}
			main_core.Dom.addClass(this.elements.root, 'closing');
			main_core.Event.bind(this.elements.root, 'animationend', () => this.dismount());
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			this.elements.button = this.isShowAllowPermissionButton ? this.createAllowPermissionButton() : null;
			this.elements.close = main_core.Dom.create('div', {
				props: {
					className: 'bx-call-view-floor-request-notification-close'
				},
				events: {
					click: this.#onCloseClicked.bind(this)
				}
			});
			this.elements.root = main_core.Dom.create('div', {
				props: {
					className: 'bx-call-view-floor-request-notification'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-call-view-floor-request-notification-icon-container'
					},
					children: [this.elements.avatar = main_core.Dom.create('div', {
						props: {
							className: 'bx-call-view-floor-request-notification-avatar'
						},
						text: ''
					}), main_core.Dom.create('div', {
						props: {
							className: 'bx-call-view-floor-request-notification-icon bx-messenger-videocall-floor-request-icon'
						}
					})]
				}), this.elements.name = main_core.Dom.create('span', {
					props: {
						className: 'bx-call-view-floor-request-notification-text-container'
					},
					html: this.#buildNameHtml()
				}), this.elements.button, this.elements.close]
			});
			if (this.userModel.avatar) {
				main_core.Dom.style(this.elements.avatar, '--avatar', `url('${this.userModel.avatar}')`);
				this.elements.avatar.innerText = '';
			} else {
				main_core.Dom.style(this.elements.avatar, '--avatar-background', 'var(--call-view__floor-request-notification-avatar-background-color)');
				this.elements.avatar.innerText = im_v2_lib_utils.Utils.text.getFirstLetters(this.userModel.name).toUpperCase();
			}
			return this.elements.root;
		}
		#buildNameHtml() {
			const messageKey = this.userModel.gender === 'F' ? 'IM_CALL_WANTS_TO_SAY_F' : 'IM_CALL_WANTS_TO_SAY_M';
			const nameSpan = `<span class ="bx-call-view-floor-request-notification-text-name">${main_core.Text.encode(this.userModel.name)}</span>`;
			return main_core.Loc.getMessage(messageKey).replace('#NAME#', nameSpan);
		}
		createAllowPermissionButton() {
			return new BX.UI.Button({
				baseClass: 'ui-btn ui-btn-icon-mic',
				text: main_core.Loc.getMessage('CALL_RAISE_HAND_NOTIFY_ALLOW'),
				size: BX.UI.Button.Size.EXTRA_SMALL,
				color: BX.UI.Button.Color.LIGHT_BORDER,
				noCaps: true,
				round: true,
				events: {
					click: () => {
						this.#allowPermissionHandler();
					}
				}
			}).render();
		}
		#allowPermissionHandler() {
			this.callbacks.onAllowSpeakPermissionClicked(this.userModel);
			this.updatePermissionButtonState();
		}
		#onUserModelChanged(event) {
			const {
				fieldName
			} = event.data;
			if (fieldName === UserModelField.floorRequestState && !this.userModel.floorRequestState) {
				this.dismountWithAnimation();
			}
			if (fieldName === UserModelField.permissionToSpeak) {
				this.updatePermissionButtonState();
			}
			if (this.userModel.avatar === '' && this.elements.avatar) {
				this.elements.avatar.innerText = im_v2_lib_utils.Utils.text.getFirstLetters(this.userModel.name).toUpperCase();
			}
			if (this.elements.name) {
				this.elements.name.innerHtml = this.#buildNameHtml();
			}
		}
		destroy() {
			this.callbacks.onDestroy();
			this.elements = null;
			if (this.userModel) {
				this.userModel.unsubscribe('changed', this.#onUserModelChangedHandler);
				this.userModel = null;
			}
			this.emit('onDestroy', {});
		}
	}

	const MAX_NOTIFICATION_COUNT = 5;
	class FloorRequestNotificationManager {
		constructor() {
			this.notifications = [];
		}
		addNotification(notification) {
			const onDestroy = () => {
				notification.unsubscribe('onDestroy', onDestroy);
				this.#onNotificationDestroy(notification);
			};
			notification.subscribe('onDestroy', onDestroy);
			this.notifications.push(notification);
			if (this.notifications.length > MAX_NOTIFICATION_COUNT) {
				const firstNotification = this.notifications.shift();
				firstNotification.dismount();
			}
		}
		#onNotificationDestroy(notification) {
			const index = this.notifications.indexOf(notification);
			if (index !== -1) {
				this.notifications.splice(index, 1);
			}
		}
	}
	const NotificationManager = new FloorRequestNotificationManager();

	const DeviceSelectorEvents = {
		onMicrophoneSelect: 'onMicrophoneSelect',
		onMicrophoneSwitch: 'onMicrophoneSwitch',
		onCameraSelect: 'onCameraSelect',
		onCameraSwitch: 'onCameraSwitch',
		onSpeakerSelect: 'onSpeakerSelect',
		onSpeakerSwitch: 'onSpeakerSwitch',
		onChangeMicAutoParams: 'onChangeMicAutoParams',
		onChangeFaceImprove: 'onChangeFaceImprove',
		onChangeVideoQuality: 'onChangeVideoQuality',
		onAdvancedSettingsClick: 'onOpenAdvancedSettingsClick',
		onShow: 'onShow',
		onDestroy: 'onDestroy',
		onChangeNoiseSuppression: 'onChangeNoiseSuppression'
	};

	/**
	 * @param config
	 * @param {Node} config.parentElement
	 * @param {boolean} config.cameraEnabled
	 * @param {boolean} config.microphoneEnabled
	 * @param {boolean} config.speakerEnabled
	 * @param {boolean} config.faceImproveEnabled
	 * @param {object} config.events

	 * @returns {DeviceSelector}
	 */

	/**
	 * @param config
	 * @param {Node} config.parentElement
	 * @param {number} config.zIndex
	 * @param {boolean} config.cameraEnabled
	 * @param {boolean} config.microphoneEnabled
	 * @param {boolean} config.speakerEnabled
	 * @param {boolean} config.allowNoiseSuppression
	 * @param {boolean} config.faceImproveEnabled
	 * @constructor
	 */
	class DeviceSelector {
		static Events = DeviceSelectorEvents;
		constructor(config) {
			this.viewElement = config.viewElement || null;
			this.parentElement = config.parentElement;
			this.zIndex = config.zIndex;
			this.cameraEnabled = BX.prop.getBoolean(config, 'cameraEnabled', false);
			this.cameraId = BX.prop.getString(config, 'cameraId', false);
			this.microphoneEnabled = BX.prop.getBoolean(config, 'microphoneEnabled', false);
			this.microphoneId = BX.prop.getString(config, 'microphoneId', false);
			this.speakerEnabled = BX.prop.getBoolean(config, 'speakerEnabled', false);
			this.speakerId = BX.prop.getString(config, 'speakerId', false);
			this.allowNoiseSuppression = BX.prop.getBoolean(config, 'allowNoiseSuppression', false);
			this.faceImproveEnabled = BX.prop.getBoolean(config, 'faceImproveEnabled', false);
			this.allowFaceImprove = BX.prop.getBoolean(config, 'allowFaceImprove', false);
			this.allowBackground = BX.prop.getBoolean(config, 'allowBackground', true);
			this.allowMask = BX.prop.getBoolean(config, 'allowMask', true);
			this.allowAdvancedSettings = BX.prop.getBoolean(config, 'allowAdvancedSettings', false);
			this.switchCameraBlocked = config.switchCameraBlocked || false;
			this.switchMicrophoneBlocked = config.switchMicrophoneBlocked || false;
			this.isDestroying = false;
			this.isCameraWasEnabledBeforeQualityChanged = false;
			this.popup = null;
			this.eventEmitter = new BX.Event.EventEmitter(this, "DeviceSelector");
			this.elements = {
				root: null,
				micContainer: null,
				cameraContainer: null,
				speakerContainer: null
			};
			const eventListeners = BX.prop.getObject(config, "events", {});
			Object.values(DeviceSelectorEvents).forEach(eventName => {
				if (eventListeners[eventName]) {
					this.eventEmitter.subscribe(eventName, eventListeners[eventName]);
				}
			});
		}
		// static create(config)
		// {
		// 	return new DeviceSelector(config);
		// };

		show() {
			this.isCameraWasEnabledBeforeQualityChanged = call_core.Hardware.isCameraOn;
			if (this.popup) {
				this.popup.show();
				return;
			}
			this.popup = new main_popup.Popup({
				id: 'call-view-device-selector',
				className: 'call-view-device-selector-popup',
				background: '#00428F',
				contentBackground: '#00428F',
				darkMode: true,
				contentBorderRadius: '6px',
				borderRadius: '6px',
				bindElement: this.parentElement,
				targetContainer: this.viewElement,
				autoHide: true,
				zIndex: this.zIndex,
				closeByEsc: true,
				angle: false,
				overlay: {
					backgroundColor: '#22272B',
					opacity: 0
				},
				content: this.render(),
				events: {
					onPopupClose: () => this.popup.destroy(),
					onPopupDestroy: () => this.destroy()
				}
			});
			this.popup.show();
			this.eventEmitter.emit(DeviceSelectorEvents.onShow, {});
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			return main_core.Dom.create("div", {
				props: {
					className: "bx-call-view-device-selector"
				},
				children: [main_core.Dom.create("div", {
					props: {
						className: "bx-call-view-device-selector-top"
					},
					children: [(this.microphoneContainer = DeviceMenu.create({
						blocked: this.switchMicrophoneBlocked,
						deviceLabel: BX.message("IM_M_CALL_BTN_MIC"),
						deviceList: call_core.Hardware.getMicrophoneList(),
						selectedDevice: this.microphoneId,
						deviceEnabled: this.microphoneEnabled,
						icons: ["microphone", "microphone-off"],
						events: {
							onSwitch: this.onMicrophoneSwitch.bind(this),
							onSelect: this.onMicrophoneSelect.bind(this)
						}
					})).render(), (this.cameraContainer = DeviceMenu.create({
						blocked: this.switchCameraBlocked,
						deviceLabel: BX.message("IM_M_CALL_BTN_CAMERA"),
						deviceList: call_core.Hardware.getCameraList(),
						selectedDevice: this.cameraId,
						deviceEnabled: this.cameraEnabled,
						icons: ["camera", "camera-off"],
						events: {
							onSwitch: this.onCameraSwitch.bind(this),
							onSelect: this.onCameraSelect.bind(this),
							onChangeVideoQuality: this.onVideoQualityChanged.bind(this)
						}
					})).render(), call_core.Hardware.canSelectSpeaker() ? (this.speakerContainer = DeviceMenu.create({
						deviceLabel: BX.message("IM_M_CALL_BTN_SPEAKER"),
						deviceList: call_core.Hardware.getSpeakerList(),
						selectedDevice: this.speakerId,
						deviceEnabled: this.speakerEnabled,
						icons: ["speaker", "speaker-off"],
						events: {
							onSwitch: this.onSpeakerSwitch.bind(this),
							onSelect: this.onSpeakerSelect.bind(this)
						}
					})).render() : null]
				}), main_core.Dom.create("div", {
					props: {
						className: "bx-call-view-device-selector-bottom"
					},
					children: [main_core.Dom.create('div', {
						props: {
							className: 'bx-call-view-device-selector-bottom-item'
						},
						children: [main_core.Dom.create('input', {
							props: {
								id: 'device-selector-noise-suppression',
								className: 'bx-call-view-device-selector-bottom-item-checkbox'
							},
							attrs: {
								type: 'checkbox',
								checked: this.allowNoiseSuppression
							},
							events: {
								change: this.onAllowNoiseSuppression.bind(this)
							}
						}), main_core.Dom.create('div', {
							props: {
								className: 'bx-call-view-device-selector-bottom-item-checkbox-checked'
							}
						}), main_core.Dom.create('label', {
							props: {
								className: 'bx-call-view-device-selector-bottom-item-label'
							},
							attrs: {
								for: 'device-selector-noise-suppression'
							},
							text: BX.message('CALL_NOISE_SUPPRESSION')
						})]
					}), this.allowFaceImprove ? main_core.Dom.create("div", {
						props: {
							className: "bx-call-view-device-selector-bottom-item"
						},
						children: [main_core.Dom.create("input", {
							props: {
								id: "device-selector-mic-auto-params",
								className: "bx-call-view-device-selector-bottom-item-checkbox"
							},
							attrs: {
								type: "checkbox",
								checked: this.faceImproveEnabled
							},
							events: {
								change: this.onFaceImproveChange.bind(this)
							}
						}), main_core.Dom.create("label", {
							props: {
								className: "bx-call-view-device-selector-bottom-item-label"
							},
							attrs: {
								for: "device-selector-mic-auto-params"
							},
							text: BX.message("IM_SETTINGS_HARDWARE_CAMERA_FACE_IMPROVE")
						})]
					}) : null, this.allowBackground ? main_core.Dom.create("div", {
						props: {
							className: "bx-call-view-device-selector-bottom-item"
						},
						children: [main_core.Dom.create("span", {
							props: {
								className: "bx-call-view-device-selector-bottom-item-action"
							},
							text: this.allowMask ? BX.message("IM_M_CALL_BG_MASK_CHANGE") : BX.message("IM_M_CALL_BACKGROUND_CHANGE"),
							events: {
								click: () => {
									call_core.BackgroundDialog.open();
									this.popup.close();
								}
							}
						})]
					}) : null, main_core.Dom.create("div", {
						props: {
							className: "bx-call-view-device-selector-bottom-item"
						},
						children: [main_core.Dom.create("span", {
							props: {
								className: "bx-call-view-device-selector-bottom-item-action"
							},
							text: BX.message("CALL_RUN_SELF_TEST"),
							events: {
								click: () => {
									call_core.Util.startSelfTest();
									this.popup.close();
								}
							}
						})]
					}), this.allowAdvancedSettings && !!BX.MessengerCommon ? main_core.Dom.create("div", {
						props: {
							className: "bx-call-view-device-selector-bottom-item"
						},
						children: [main_core.Dom.create("span", {
							props: {
								className: "bx-call-view-device-selector-bottom-item-action"
							},
							text: BX.message("IM_M_CALL_ADVANCED_SETTINGS"),
							events: {
								click: e => {
									// to prevent BX.IM.autoHide
									e.stopPropagation();
									this.eventEmitter.emit(DeviceSelectorEvents.onAdvancedSettingsClick);
									this.popup.close();
								}
							}
						})]
					}) : null]
				})]
			});
		}
		toggleCameraAvailability(available) {
			if (available) {
				this.cameraContainer.unblock();
				return;
			}
			this.cameraContainer.block();
		}
		toggleMicrophoneAvailability(available) {
			if (available) {
				this.microphoneContainer.unblock();
				return;
			}
			this.microphoneContainer.block();
		}
		onMicrophoneSwitch() {
			this.microphoneEnabled = !this.microphoneEnabled;
			this.eventEmitter.emit(DeviceSelectorEvents.onMicrophoneSwitch, {
				microphoneEnabled: this.microphoneEnabled
			});
		}
		onMicrophoneSelect(e) {
			this.eventEmitter.emit(DeviceSelectorEvents.onMicrophoneSelect, {
				deviceId: e.data.deviceId
			});
		}
		onCameraSwitch() {
			this.cameraEnabled = !this.cameraEnabled;
			this.eventEmitter.emit(DeviceSelectorEvents.onCameraSwitch, {
				cameraEnabled: this.cameraEnabled
			});
		}
		onCameraSelect(e) {
			this.eventEmitter.emit(DeviceSelectorEvents.onCameraSelect, {
				deviceId: e.data.deviceId
			});
		}
		onVideoQualityChanged(e) {
			this.eventEmitter.emit(DeviceSelectorEvents.onChangeVideoQuality, {
				videoQuality: e.data.videoQuality,
				isCameraWasEnabledBeforeQualityChanged: this.isCameraWasEnabledBeforeQualityChanged
			});
		}
		onSpeakerSwitch() {
			this.speakerEnabled = !this.speakerEnabled;
			this.eventEmitter.emit(DeviceSelectorEvents.onSpeakerSwitch, {
				speakerEnabled: this.speakerEnabled
			});
		}
		onSpeakerSelect(e) {
			this.eventEmitter.emit(DeviceSelectorEvents.onSpeakerSelect, {
				deviceId: e.data.deviceId
			});
		}
		confirmSpeakerSelection(deviceId) {
			if (this.speakerContainer) {
				this.speakerContainer.confirmSelection(deviceId);
			}
		}
		onAllowNoiseSuppression(e) {
			this.allowNoiseSuppression = e.currentTarget.checked;
			this.eventEmitter.emit(DeviceSelectorEvents.onChangeNoiseSuppression, {
				allowNoiseSuppression: this.allowNoiseSuppression
			});
		}
		onAllowMirroringVideoChange(e) {
			call_core.Hardware.enableMirroring = e.target.checked;
		}
		onFaceImproveChange(e) {
			this.faceImproveEnabled = e.currentTarget.checked;
			this.eventEmitter.emit(DeviceSelectorEvents.onChangeFaceImprove, {
				faceImproveEnabled: this.faceImproveEnabled
			});
		}
		destroy() {
			if (this.isDestroying) {
				return;
			}
			this.isDestroying = true;
			if (this.popup) {
				this.popup.destroy();
				this.popup = null;
			}
			this.eventEmitter.emit(DeviceSelectorEvents.onDestroy, {});
		}
	}
	const DeviceMenuEvents = {
		onSelect: 'onSelect',
		onSwitch: 'onSwitch',
		onChangeVideoQuality: 'onChangeVideoQuality'
	};
	class DeviceMenu {
		constructor(config) {
			config = BX.type.isObject(config) ? config : {};
			this.menuBlocked = config.blocked || false;
			this.deviceList = BX.prop.getArray(config, 'deviceList', []);
			this.selectedDevice = BX.prop.getString(config, 'selectedDevice', '');
			this.deviceEnabled = BX.prop.getBoolean(config, 'deviceEnabled', false);
			this.deviceLabel = BX.prop.getString(config, 'deviceLabel', '');
			this.icons = BX.prop.getArray(config, 'icons', []);
			this.eventEmitter = new main_core_events.EventEmitter(this, 'DeviceMenu');
			this.elements = {
				root: null,
				switchIcon: null,
				menuInner: null,
				menuItems: {} // deviceId => {root: element, icon: element}
			};
			this.currentBitrixCall = call_core.Util.getCurrentBitrixCall();
			this.isShowVideoQuality = call_core.Util.isStreamQualityFeatureEnabled() && this.icons[0] === 'camera' && this.currentBitrixCall && this.currentBitrixCall.provider !== call_core.Provider.Plain;
			this.videoQualityController = this.#createVideoQualityController();
			var events = BX.prop.getObject(config, "events", {});
			for (var eventName in events) {
				if (!events.hasOwnProperty(eventName)) {
					continue;
				}
				this.eventEmitter.subscribe(eventName, events[eventName]);
			}
		}
		static create(config) {
			return new DeviceMenu(config);
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			this.elements.root = main_core.Dom.create("div", {
				props: {
					className: "bx-call-view-device-selector-menu-container"
				},
				children: [main_core.Dom.create("div", {
					props: {
						className: "bx-call-view-device-selector-switch-wrapper"
					},
					children: [this.elements.switchIcon = main_core.Dom.create("div", {
						props: {
							className: "bx-call-view-device-selector-device-icon " + this.getDeviceIconClass()
						}
					}), main_core.Dom.create("span", {
						props: {
							className: "bx-call-view-device-selector-device-text"
						},
						text: this.deviceLabel
					}), main_core.Dom.create("div", {
						props: {
							className: "bx-call-view-device-selector-device-switch"
						},
						children: [new BX.UI.Switcher({
							size: 'small',
							checked: this.deviceEnabled,
							handlers: {
								toggled: this.onSwitchToggled.bind(this)
							},
							disabled: this.menuBlocked
						}).getNode()]
					})]
				}), this.elements.menuInner = main_core.Dom.create("div", {
					props: {
						className: "bx-call-view-device-selector-menu-inner" + (this.menuBlocked ? ' inactive' : '')
					},
					children: this.deviceList.map(this.renderDevice.bind(this))
				}), this.videoQualityController.render()]
			});
			return this.elements.root;
		}
		renderDevice(deviceInfo) {
			var iconClass = this.selectedDevice === deviceInfo.deviceId ? "selected" : "";
			var deviceElements = {};
			deviceElements.root = main_core.Dom.create("div", {
				props: {
					className: "bx-call-view-device-selector-menu-item"
				},
				dataset: {
					deviceId: deviceInfo.deviceId
				},
				children: [deviceElements.icon = main_core.Dom.create("div", {
					props: {
						className: "bx-call-view-device-selector-menu-item-icon " + iconClass
					}
				}), main_core.Dom.create("div", {
					props: {
						className: "bx-call-view-device-selector-menu-item-text"
					},
					text: deviceInfo.label || "(" + BX.message("IM_M_CALL_DEVICE_NO_NAME") + ")"
				})],
				events: {
					click: this.onMenuItemClick.bind(this)
				}
			});
			this.elements.menuItems[deviceInfo.deviceId] = deviceElements;
			return deviceElements.root;
		}
		block() {
			this.menuBlocked = true;
			this.elements.root.classList.add("bx-call-view-device-selector-menu-container-blocked");
			this.videoQualityController.setDisabled(true);
		}
		unblock() {
			this.menuBlocked = false;
			this.elements.root.classList.remove("bx-call-view-device-selector-menu-container-blocked");
			this.videoQualityController.setDisabled(false);
		}
		getDeviceIconClass() {
			var result = "";
			if (this.deviceEnabled && this.icons.length > 0) {
				result = this.icons[0];
			} else if (!this.deviceEnabled && this.icons.length > 1) {
				result = this.icons[1];
			}
			return result;
		}
		onSwitchToggled() {
			if (this.menuBlocked) {
				return;
			}
			this.deviceEnabled = !this.deviceEnabled;
			this.elements.switchIcon.className = "bx-call-view-device-selector-device-icon " + this.getDeviceIconClass();
			this.eventEmitter.emit(DeviceMenuEvents.onSwitch, {
				deviceEnabled: this.deviceEnabled
			});
		}
		onMenuItemClick(e) {
			var currentDevice = this.selectedDevice;
			var selectedDevice = e.currentTarget.dataset.deviceId;
			this.selectedDevice = selectedDevice;
			if (this.elements.menuItems[currentDevice]) {
				this.elements.menuItems[currentDevice]['icon'].classList.remove('selected');
			}
			if (this.elements.menuItems[this.selectedDevice]) {
				this.elements.menuItems[this.selectedDevice]['icon'].classList.add('selected');
			}
			this.eventEmitter.emit(DeviceMenuEvents.onSelect, {
				deviceId: this.selectedDevice
			});
		}
		confirmSelection(deviceId) {
			var currentDevice = this.selectedDevice;
			this.selectedDevice = deviceId;
			if (this.elements.menuItems[currentDevice]) {
				this.elements.menuItems[currentDevice]['icon'].classList.remove('selected');
			}
			if (this.elements.menuItems[this.selectedDevice]) {
				this.elements.menuItems[this.selectedDevice]['icon'].classList.add('selected');
			}
		}

		// eslint-disable-next-line flowtype/require-return-type
		#createVideoQualityController() {
			let instance = null;
			let container = null;
			let pendingDisabled = null;
			return {
				render: () => {
					if (!this.isShowVideoQuality) {
						return null;
					}
					if (container) {
						return container;
					}
					container = main_core.Dom.create('div');
					BX.Runtime.loadExtension('call.component.video-quality-range').then(({
						VideoQualityRange
					}) => {
						if (container === null) {
							return;
						}
						instance = new VideoQualityRange({
							container,
							title: main_core.Loc.getMessage('CALL_VIDEO_QUALITY_TITLE'),
							videoQualityList: [{
								label: main_core.Loc.getMessage('CALL_VIDEO_QUALITY_WITHOUT_VIDEO'),
								height: 0,
								value: call_core.STREAM_QUALITY.NO_VIDEO
							}, {
								label: '180p',
								height: 180,
								value: call_core.STREAM_QUALITY.LOW
							}, {
								label: '360p',
								height: 360,
								value: call_core.STREAM_QUALITY.MEDIUM
							}, {
								label: '720p',
								height: 720,
								value: call_core.STREAM_QUALITY.HIGH
							}],
							disabled: this.menuBlocked,
							defaultHeight: call_core.Hardware.maxLocalStreamQualityHeight,
							onVideoQualityChanged: videoQuality => {
								this.eventEmitter.emit(DeviceMenuEvents.onChangeVideoQuality, {
									videoQuality
								});
							}
						});
						instance.init();
						if (pendingDisabled !== null) {
							instance.setDisabled(pendingDisabled);
							pendingDisabled = null;
						}
					}).catch(() => {
						container = null;
					});
					return container;
				},
				setDisabled: value => {
					if (instance) {
						instance.setDisabled(value);
					} else {
						pendingDisabled = value;
					}
				},
				destroy: () => {
					instance?.destroy();
					instance = null;
					container = null;
				}
			};
		}
	}

	const PIP_WINDOW_WIDTH = 370;
	const PIP_WINDOW_HEIGHT = 215;
	const PIP_MIN_HEIGHT = 80;
	const PIP_MIN_WIDTH = 310;
	const AVATAR_SIZE_RATIO = 0.45;
	const AVATAR_TEXT_SIZE_RATIO = 0.45;
	const FLOOR_REQUEST_HIDE_DELAY = 5000;
	const FLOOR_REQUEST_POPUP_WIDTH = 244;
	const POPUP_HORIZONTAL_OFFSET = 16;
	class PictureInPictureWindow {
		#isClosing = false;
		#isProgrammaticClose = false;
		#blockedButtonsKey = '';
		constructor(config) {
			this.pictureWindow = null;
			this.template = null;
			this.userPanel = null;
			this.actionsPanel = null;
			this.notificationPanel = null;
			this.hardwareState = config.hardwareState;
			this.buttonNames = config.buttons || [];
			this.buttonInstances = {
				microphone: null,
				camera: null,
				returnToCall: null,
				stopScreen: null,
				copilot: null
			};
			this.preferInitialWindowPlacement = config.preferInitialWindowPlacement;
			this.user = null;
			this.userData = config.currentUser;
			this.blockedButtons = config.blockedButtons || [];
			this.previousFloorRequestNotifications = config.floorRequestNotifications || [];
			this.callbacks = {
				onButtonClick: main_core.Type.isFunction(config.onButtonClick) ? config.onButtonClick : () => {},
				onClose: main_core.Type.isFunction(config.onClose) ? config.onClose : () => {}
			};
			this.isMinHeight = false;
			this.isMinWidth = false;
			this.floorRequestElements = {
				counter: null,
				mainNotification: null,
				popup: null,
				popupTemplate: null
			};
			this.floorRequestsList = [];
			this.floorRequestTimeout = null;
			this.onCloseHandler = this.onClose.bind(this);
			this.onResizeHandler = main_core.Runtime.throttle(this.onResize.bind(this), 100);
			this.onMouseMoveHandler = this.onMouseMove.bind(this);
			this.uiDeps = {
				Buttons: config.Buttons,
				CallUser: config.CallUser,
				FloorRequest: config.FloorRequest
			};
		}
		#isCurrentUserId(userId) {
			return Boolean(this.user) && Number(userId) === Number(this.user.userModel.id);
		}
		setStats(userId, stats) {
			if (!this.#isCurrentUserId(userId)) {
				return;
			}
			this.user.showStats(stats);
		}
		setVideoRenderer(userId, mediaRenderer) {
			if (!this.#isCurrentUserId(userId)) {
				return;
			}
			this.user.videoRenderer = mediaRenderer;
		}
		setCurrentUser(user) {
			if (!user) {
				return;
			}
			this.userData = user;
			const isCurrentUser = this.#isCurrentUserId(this.userData.userModel.id);
			if (this.user && !isCurrentUser) {
				this.destroyCurrentUser();
			}
			if (!this.user || !isCurrentUser) {
				this.renderUserPanel();
			}
		}
		destroyCurrentUser() {
			if (!this.user) {
				return;
			}
			this.user.dismount();
			this.user.destroy();
			this.user = null;
		}
		getCurrentUserId() {
			return this.user?.userModel.id ?? null;
		}
		isButtonBlocked(buttonName) {
			return this.blockedButtons.includes(buttonName);
		}
		syncBlockButtons(buttonsList) {
			const cacheKey = buttonsList.join(',');
			if (this.#blockedButtonsKey === cacheKey) {
				return;
			}
			this.#blockedButtonsKey = cacheKey;
			this.blockedButtons = buttonsList;
			this.updateButtons();
		}
		updateBlockButtons(buttonsList) {
			this.blockedButtons = buttonsList;
			return this;
		}
		setButtons(buttonsList) {
			this.buttonNames = buttonsList;
			return this;
		}
		updateButtons() {
			main_core.Dom.clean(this.actionsPanel);
			this.renderButtons();
		}
		getButtonTextBySizePictureWindow(text) {
			return this.isMinHeight || this.isMinWidth ? '' : text;
		}
		renderButtons() {
			if (!this.actionsPanel && this.buttonNames.length > 0) {
				this.actionsPanel = main_core.Dom.create('div', {
					props: {
						className: 'bx-call-picture-in-picture-window__actions'
					}
				});
			}
			for (const buttonName of this.buttonNames) {
				switch (buttonName) {
					case 'microphone':
						this.buttonInstances.microphone = new this.uiDeps.Buttons.DeviceButton({
							class: 'microphone',
							backgroundClass: 'bx-call-picture-in-picture-window__button-background',
							text: this.getButtonTextBySizePictureWindow(main_core.Loc.getMessage('IM_M_CALL_BTN_MIC')),
							enabled: !this.hardwareState.isMicrophoneMuted,
							arrowHidden: true,
							arrowEnabled: false,
							showPointer: true,
							blocked: this.isButtonBlocked('microphone'),
							showLevel: true,
							sideIcon: null,
							onClick: event => {
								event.stopPropagation();
								this.callbacks.onButtonClick({
									buttonName: 'microphone',
									event
								});
							}
						});
						main_core.Dom.append(this.buttonInstances.microphone.render(), this.actionsPanel);
						break;
					case 'camera':
						this.buttonInstances.camera = new this.uiDeps.Buttons.DeviceButton({
							class: 'camera',
							backgroundClass: 'bx-call-picture-in-picture-window__button-background',
							text: this.getButtonTextBySizePictureWindow(main_core.Loc.getMessage('IM_M_CALL_BTN_CAMERA')),
							enabled: this.hardwareState.isCameraOn,
							arrowHidden: true,
							blocked: this.isButtonBlocked('camera'),
							onClick: event => {
								event.stopPropagation();
								this.callbacks.onButtonClick({
									buttonName: 'camera',
									event
								});
							}
						});
						main_core.Dom.append(this.buttonInstances.camera.render(), this.actionsPanel);
						break;
					case 'returnToCall':
						this.buttonInstances.returnToCall = new this.uiDeps.Buttons.SimpleButton({
							class: 'go-to-call',
							backgroundClass: 'bx-call-picture-in-picture-window__button-background bx-messenger-videocall-panel-icon-background-go-to-call',
							text: this.getButtonTextBySizePictureWindow(main_core.Loc.getMessage('CALL_BUTTON_GO_TO_CALL')),
							onClick: event => {
								event.stopPropagation();
								this.callbacks.onButtonClick({
									buttonName: 'returnToCall',
									event
								});
								window.focus();
							}
						});
						main_core.Dom.append(this.buttonInstances.returnToCall.render(), this.actionsPanel);
						break;
					case 'stop-screen':
						this.buttonInstances.stopScreen = new this.uiDeps.Buttons.SimpleButton({
							class: 'stop-screen',
							backgroundClass: 'bx-call-picture-in-picture-window__button-background',
							text: this.getButtonTextBySizePictureWindow(main_core.Loc.getMessage('CALL_BUTTON_STOP_SCREEN')),
							blocked: this.isButtonBlocked('screen'),
							onClick: event => {
								event.stopPropagation();
								this.callbacks.onButtonClick({
									buttonName: 'stop-screen',
									event
								});
								window.focus();
							}
						});
						main_core.Dom.append(this.buttonInstances.stopScreen.render(), this.actionsPanel);
						break;
				}
			}
		}
		renderUserPanel() {
			if (!this.userPanel) {
				this.userPanel = main_core.Dom.create('div', {
					props: {
						className: 'bx-call-picture-in-picture-window__user'
					}
				});
			}
			if (!this.user) {
				this.user = new this.uiDeps.CallUser({
					parentContainer: this.userPanel,
					userModel: this.userData.userModel,
					avatarBackground: this.userData.avatarBackground,
					allowPinButton: false,
					allowBackgroundItem: false,
					allowMaskItem: false,
					alwaysShowName: true,
					flipVideo: this.userData.userModel.localUser,
					hiddenFloorRequest: true,
					hiddenRemoteParticipantButtonMenu: true,
					onClick: event => {
						this.callbacks.onButtonClick({
							buttonName: 'returnToCall',
							event
						});
						window.focus();
					}
				});
				this.user.mount(this.userPanel);
			}
			if (this.userData.previewRenderer) {
				this.user.videoRenderer = this.userData.previewRenderer;
			}
			if (this.userData.videoRenderer) {
				this.user.videoRenderer = this.userData.videoRenderer;
			}
		}
		renderNotificationPanel() {
			if (!this.notificationPanel) {
				this.notificationPanel = main_core.Dom.create('div', {
					props: {
						className: 'bx-call-picture-in-picture-window__notifications bx-messenger-videocall-notification-panel'
					}
				});
			}
		}
		updateFloorRequestsList({
			floorRequestsList,
			user
		}) {
			if (floorRequestsList) {
				this.floorRequestsList = floorRequestsList.map(floorRequestsListItem => {
					return {
						userModel: floorRequestsListItem.userModel,
						avatarBackgroundColor: floorRequestsListItem.avatarBackgroundColor,
						initials: im_v2_lib_utils.Utils.text.getFirstLetters(floorRequestsListItem.userModel.name).toUpperCase()
					};
				});
				this.updateFloorRequestCounter();
				return;
			}
			if (!user) {
				return;
			}
			const isSameUser = el => el.userModel.id === user.userModel.id;
			const userInFloorRequestsListIndex = this.floorRequestsList.findIndex(element => isSameUser(element));
			const hasUserInFloorRequestsList = userInFloorRequestsListIndex !== -1;
			const isActiveFloorRequestState = user.userModel.floorRequestState;
			if (hasUserInFloorRequestsList === isActiveFloorRequestState) {
				return;
			}
			if (isActiveFloorRequestState) {
				this.floorRequestsList.push({
					userModel: user.userModel,
					avatarBackgroundColor: user.avatarBackgroundColor,
					initials: im_v2_lib_utils.Utils.text.getFirstLetters(user.userModel.name).toUpperCase()
				});
			} else {
				this.floorRequestsList.splice(userInFloorRequestsListIndex, 1);
			}
			this.updateFloorRequestCounter();
		}
		updateFloorRequestCounter(withoutRenderTemplate = false) {
			if (this.floorRequestElements.counter) {
				this.floorRequestElements.counter.innerText = this.floorRequestsList.length;
				this.updateVisibilityFloorRequestCounter();
			}
			if (!withoutRenderTemplate) {
				this.updateTemplateForFloorRequestsPopup();
			}
		}
		getTemplateForFloorRequestsPopup() {
			const children = this.floorRequestsList.map((item, index) => {
				const avatarElement = main_core.Dom.create('div', {
					props: {
						className: 'bx-call-picture-in-picture-window__floor-request-avatar'
					}
				});
				if (item.userModel.avatar) {
					main_core.Dom.style(avatarElement, '--avatar', `url('${item.userModel.avatar}')`);
				} else {
					main_core.Dom.style(avatarElement, '--avatar-color', item.avatarBackgroundColor);
					avatarElement.innerText = item.initials;
				}
				return main_core.Dom.create('li', {
					props: {
						className: 'bx-call-picture-in-picture-window__floor-request-item'
					},
					children: [avatarElement, main_core.Dom.create('div', {
						props: {
							className: 'bx-call-picture-in-picture-window__floor-request-name'
						},
						text: item.userModel.name
					}), main_core.Dom.create('div', {
						props: {
							className: 'bx-call-picture-in-picture-window__floor-request-index'
						},
						text: index + 1
					})]
				});
			});
			return main_core.Dom.create('div', {
				props: {
					className: 'bx-call-picture-in-picture-window__popup-template'
				},
				children
			});
		}
		updateTemplateForFloorRequestsPopup() {
			this.floorRequestElements.popupTemplate = this.getTemplateForFloorRequestsPopup();
			if (!this.floorRequestElements.popup) {
				return;
			}
			if (this.floorRequestsList.length === 0) {
				this.floorRequestElements.popup.close();
				return;
			}
			this.floorRequestElements.popup.setContent(this.floorRequestElements.popupTemplate);
		}
		closeFloorRequestMainNotification({
			withoutAdditionInList,
			user,
			withoutDismount
		}) {
			if (this.floorRequestTimeout) {
				clearTimeout(this.floorRequestTimeout);
				this.floorRequestTimeout = null;
			}
			if (this.floorRequestElements.mainNotification && !withoutDismount) {
				this.floorRequestElements.mainNotification.dismount();
			}
			if (!withoutAdditionInList && user) {
				this.updateFloorRequestsList({
					user
				});
			}
		}
		updateFloorRequestState({
			userModel,
			avatarBackgroundColor
		}) {
			if (this.floorRequestElements.mainNotification && this.floorRequestElements.mainNotification.userModel && this.floorRequestElements.mainNotification.userModel.id === userModel.id && !userModel.floorRequestState) {
				this.floorRequestElements.mainNotification = null;
			}
			if (userModel.floorRequestState) {
				this.updateFloorRequestMainNotification({
					userModel,
					avatarBackgroundColor
				});
			} else {
				this.updateFloorRequestsList({
					user: {
						userModel,
						avatarBackgroundColor
					}
				});
			}
		}
		updateFloorRequestMainNotification({
			userModel,
			avatarBackgroundColor
		}) {
			if (!this.notificationPanel) {
				this.renderNotificationPanel();
			}
			if (this.floorRequestElements.mainNotification) {
				this.closeFloorRequestMainNotification({
					withoutAdditionInList: false,
					user: {
						userModel: this.floorRequestElements.mainNotification.userModel,
						avatarBackgroundColor: this.floorRequestElements.mainNotification.avatarBackgroundColor
					}
				});
			}
			this.floorRequestElements.mainNotification = this.uiDeps.FloorRequest.create({
				userModel,
				onDestroy: () => {
					this.closeFloorRequestMainNotification({
						withoutAdditionInList: !userModel.floorRequestState,
						user: {
							userModel,
							avatarBackgroundColor
						},
						withoutDismount: true
					});
					this.floorRequestElements.mainNotification = null;
				}
			});
			this.floorRequestElements.mainNotification.mount(this.notificationPanel);
			this.floorRequestTimeout = setTimeout(() => {
				this.closeFloorRequestMainNotification({
					withoutAdditionInList: false,
					user: {
						userModel,
						avatarBackgroundColor
					}
				});
			}, FLOOR_REQUEST_HIDE_DELAY);
		}
		updateVisibilityFloorRequestCounter() {
			const isHidden = this.floorRequestsList.length === 0;
			if (!this.floorRequestElements.counter) {
				this.renderFloorRequestCounter();
			}
			const hiddenClass = 'bx-call-picture-in-picture-window__floor-requests_hidden';
			const hasHiddenClass = main_core.Dom.hasClass(this.floorRequestElements.counter, hiddenClass);
			if (hasHiddenClass === isHidden) {
				return;
			}
			main_core.Dom.toggleClass(this.floorRequestElements.counter, hiddenClass);
		}
		onMouseMove(event) {
			if (!this.floorRequestElements.popup) {
				return;
			}
			const composedPath = event.composedPath();
			const hasClass = element => element.classList && (main_core.Dom.hasClass(element, 'bx-call-picture-in-picture-window__floor-requests') || main_core.Dom.hasClass(element, 'bx-call-picture-in-picture-window__popup'));
			if (composedPath.some(element => hasClass(element))) {
				return;
			}
			this.floorRequestElements.popup.close();
		}
		setNewSettingForPopup() {
			if (!this.pictureWindow.document.body || !this.floorRequestElements.popup || !this.floorRequestElements.counter) {
				return;
			}
			const {
				clientHeight,
				clientWidth
			} = this.pictureWindow.document.body;
			const bindElement = this.floorRequestElements.counter;
			const bindElementPos = bindElement.getBoundingClientRect();
			const {
				bottom
			} = bindElementPos;
			const baseOffsetVerticalPopup = POPUP_HORIZONTAL_OFFSET / 2;
			const maxWidthPopup = clientWidth - POPUP_HORIZONTAL_OFFSET * 2;
			const widthPopup = FLOOR_REQUEST_POPUP_WIDTH <= maxWidthPopup ? FLOOR_REQUEST_POPUP_WIDTH : maxWidthPopup;
			const maxHeightPopup = clientHeight - bottom - baseOffsetVerticalPopup * 2;
			this.floorRequestElements.popup.setOffset({
				offsetLeft: clientWidth - POPUP_HORIZONTAL_OFFSET - widthPopup,
				offsetTop: baseOffsetVerticalPopup
			});
			this.floorRequestElements.popup.setWidth(widthPopup);
			this.floorRequestElements.popup.setMaxHeight(maxHeightPopup);
		}
		renderFloorRequestCounter() {
			if (this.floorRequestElements.counter) {
				return;
			}
			this.floorRequestElements.counter = main_core.Dom.create('div', {
				props: {
					className: 'bx-call-picture-in-picture-window__floor-requests'
				},
				text: this.floorRequestsList.length,
				events: {
					mouseover: event => {
						event.stopPropagation();
						if (!this.floorRequestElements.popup && !this.isMinHeight) {
							this.updateTemplateForFloorRequestsPopup();
							this.floorRequestElements.popup = new main_popup.Popup({
								className: 'bx-call-picture-in-picture-window__popup',
								bindElement: this.floorRequestElements.counter,
								targetContainer: this.pictureWindow.document.body,
								content: this.floorRequestElements.popupTemplate,
								bindOptions: {
									position: 'top'
								},
								autoHide: true,
								closeByEsc: true,
								background: '#00428F',
								contentBackground: '#00428F',
								darkMode: true,
								contentNoPaddings: true,
								animation: 'fading',
								padding: 0,
								contentBorderRadius: '18px',
								zIndex: 11,
								events: {
									onPopupClose: () => {
										this.floorRequestElements.popup.destroy();
									},
									onPopupDestroy: () => {
										this.floorRequestElements.popup = null;
									}
								}
							});
						}
						if (this.floorRequestElements.popup) {
							this.setNewSettingForPopup();
							this.floorRequestElements.popup.show();
						}
					}
				}
			});
			this.updateFloorRequestCounter(true);
		}
		render() {
			this.renderButtons();
			this.renderUserPanel();
			this.renderNotificationPanel();
			this.renderFloorRequestCounter();
			this.updateFloorRequestsList({
				floorRequestsList: this.previousFloorRequestNotifications
			});
			this.template = main_core.Dom.create('div', {
				props: {
					className: 'bx-call-picture-in-picture-window'
				},
				events: {
					click: event => {
						this.callbacks.onButtonClick({
							buttonName: 'returnToCall',
							event
						});
					}
				}
			});
			[this.userPanel, this.actionsPanel, this.notificationPanel, this.floorRequestElements.counter].filter(Boolean).forEach(el => main_core.Dom.append(el, this.template));
		}
		setHeightPictureWindow() {
			if (!this.template) {
				return false;
			}
			const pictureWindowHeight = this.template.clientHeight;
			const isMinHeight = pictureWindowHeight <= PIP_MIN_HEIGHT;
			if (this.isMinHeight === isMinHeight) {
				return false;
			}
			if (isMinHeight && this.floorRequestElements.popup) {
				this.floorRequestElements.popup.close();
			}
			this.isMinHeight = isMinHeight;
			if (this.isMinHeight) {
				main_core.Dom.addClass(this.template, 'bx-call-picture-in-picture-window_min');
			} else {
				main_core.Dom.removeClass(this.template, 'bx-call-picture-in-picture-window_min');
			}
			return true;
		}
		setWidthPictureWindow() {
			if (!this.template) {
				return false;
			}
			const pictureWindowWidth = this.template.clientWidth;
			const isMinWidth = pictureWindowWidth <= PIP_MIN_WIDTH;
			if (this.isMinWidth === isMinWidth) {
				return false;
			}
			this.isMinWidth = isMinWidth;
			if (this.isMinWidth) {
				main_core.Dom.addClass(this.template, 'bx-call-picture-in-picture-window_thin');
			} else {
				main_core.Dom.removeClass(this.template, 'bx-call-picture-in-picture-window_thin');
			}
			return true;
		}
		setAvatarSettings() {
			if (!this.userPanel) {
				return;
			}
			const avatarSize = this.userPanel.clientHeight * AVATAR_SIZE_RATIO;
			const avatarTextSize = avatarSize * AVATAR_TEXT_SIZE_RATIO;
			main_core.Dom.style(this.userPanel, '--avatar-size', `${avatarSize}px`);
			main_core.Dom.style(this.userPanel, '--avatar-text-size', `${avatarTextSize}px`);
		}
		onResize() {
			this.setAvatarSettings();
			const isHeightUpdated = this.setHeightPictureWindow();
			const isWidthUpdated = this.setWidthPictureWindow();
			if (isHeightUpdated || isWidthUpdated) {
				this.updateButtons();
			}
			if (this.floorRequestElements.popup) {
				this.floorRequestElements.popup.close();
			}
		}
		toggleEvents(isActive) {
			const method = isActive ? 'addEventListener' : 'removeEventListener';
			if (this.pictureWindow) {
				this.pictureWindow[method]('pagehide', this.onCloseHandler);
				this.pictureWindow[method]('resize', this.onResizeHandler);
				this.pictureWindow[method]('mousemove', this.onMouseMoveHandler);
			}
		}
		async checkAvailableAndCreate() {
			if (this.pictureWindow) {
				return this.pictureWindow;
			}
			this.#isClosing = false;
			this.#isProgrammaticClose = false;
			if (window.documentPictureInPicture?.requestWindow) {
				this.render();
				try {
					this.pictureWindow = await window.documentPictureInPicture.requestWindow({
						disallowReturnToOpener: true,
						width: PIP_WINDOW_WIDTH,
						height: PIP_WINDOW_HEIGHT,
						preferInitialWindowPlacement: this.preferInitialWindowPlacement
					});
					this.toggleEvents(true);
					[...document.styleSheets].forEach(styleSheet => {
						try {
							const cssRules = [...styleSheet.cssRules].map(rule => rule.cssText).join('');
							const style = document.createElement('style');
							style.textContent = cssRules;
							main_core.Dom.append(style, this.pictureWindow.document.head);
						} catch {
							const link = document.createElement('link');
							link.rel = 'stylesheet';
							link.type = styleSheet.type;
							link.media = styleSheet.media;
							link.href = styleSheet.href;
							main_core.Dom.append(link, this.pictureWindow.document.head);
						}
					});
					this.pictureWindow.document.body.append(this.template);
				} catch {
					this.onClose();
				}
			} else {
				this.onClose();
			}
			return this.pictureWindow;
		}
		onClose() {
			if (this.#isClosing) {
				return;
			}
			this.#isClosing = true;
			this.callbacks.onClose(this.#isProgrammaticClose);
			if (this.template) {
				main_core.Dom.remove(this.template);
			}
			this.#destroyFloorRequests();
			this.destroyCurrentUser();
			this.toggleEvents(false);
			this.close();
			this.pictureWindow = null;
			this.template = null;
			this.userPanel = null;
			this.actionsPanel = null;
			this.notificationPanel = null;
			this.#isClosing = false;
			this.#isProgrammaticClose = false;
		}
		close() {
			if (this.pictureWindow) {
				this.#isProgrammaticClose = true;
				this.pictureWindow.close();
			}
		}
		#destroyFloorRequests() {
			if (this.floorRequestTimeout) {
				clearTimeout(this.floorRequestTimeout);
				this.floorRequestTimeout = null;
			}
			if (this.floorRequestElements.popup) {
				this.floorRequestElements.popup.destroy();
				this.floorRequestElements.popup = null;
			}
			if (this.floorRequestElements.mainNotification) {
				this.floorRequestElements.mainNotification.dismount();
				this.floorRequestElements.mainNotification = null;
			}
			this.floorRequestElements.counter = null;
			this.floorRequestElements.popupTemplate = null;
			this.floorRequestsList = [];
		}
	}

	class UserSelector {
		constructor(config) {
			this.userList = config.userList;
			this.current = config.current;
			this.parentElement = config.parentElement;
			this.zIndex = config.zIndex;
			this.menu = null;
			this.callbacks = {
				onSelect: main_core.Type.isFunction(config.onSelect) ? config.onSelect : BX.DoNothing
			};
		}
		static create(config) {
			return new UserSelector(config);
		}
		show() {
			let menuItems = [];
			this.userList.forEach(user => {
				menuItems.push({
					id: user.id,
					text: user.name || "unknown (" + user.id + ")",
					className: this.current == user.id ? "menu-popup-item-accept" : "device-selector-empty",
					onclick: () => {
						this.menu.close();
						this.callbacks.onSelect(user.id);
					}
				});
			});
			this.menu = new main_popup.Menu({
				id: 'call-view-select-user',
				bindElement: this.parentElement,
				items: menuItems,
				autoHide: true,
				zIndex: this.zIndex,
				closeByEsc: true,
				offsetTop: 0,
				offsetLeft: 0,
				bindOptions: {
					position: 'bottom'
				},
				angle: false,
				overlay: {
					backgroundColor: 'white',
					opacity: 0
				},
				events: {
					onPopupClose: () => {
						this.menu.popupWindow.destroy();
						main_popup.MenuManager.destroy('call-view-select-device');
					},
					onPopupDestroy: () => {
						this.menu = null;
					}
				}
			});
			this.menu.popupWindow.show();
		}
	}

	const SPOTLIGHT_ID_PREFIX = 'bx-call-aha-moment-notify_spotlight';
	class AhaMomentNotify {
		constructor(config) {
			this.popup = null;
			this.id = config.id || Math.random().toString(16).slice(2);
			this.notifyText = config.notifyText || '';
			this.notifyTitle = config.notifyTitle || '';
			this.promoId = config.promoId || '';
			this.popupTemplate = null;
			this.bindElement = config.bindElement;
			this.notifyColor = '#22272B';
			this.spotlight = null;
			this.targetContainer = config.bindElement || document.body;
			this.callbacks = {
				onClose: BX.type.isFunction(config.onClose) ? config.onClose : BX.DoNothing
			};
		}
		getPopupTemplate() {
			if (this.popupTemplate) {
				return;
			}
			this.popupTemplate = main_core.Dom.create('div', {
				props: {
					className: 'bx-call-aha-moment-notify__content'
				},
				children: [main_core.Dom.create("div", {
					props: {
						className: 'bx-call-aha-moment-line-top'
					}
				}), main_core.Dom.create("div", {
					props: {
						className: 'bx-call-aha-moment-notify__title'
					},
					text: this.notifyTitle
				}), main_core.Dom.create("div", {
					props: {
						className: 'bx-call-aha-moment-notify__message'
					},
					text: this.notifyText
				}), main_core.Dom.create("span", {
					props: {
						className: 'popup-window-close-icon'
					},
					events: {
						click: () => {
							if (this.promoId) {
								im_v2_lib_promo.PromoManager.getInstance().markAsWatched(this.promoId);
							}
							this.close();
						}
					}
				})]
			});
		}
		getSpotlight() {
			if (!this.bindElement) {
				return;
			}
			if (this.spotlight) {
				this.spotlight.close();
				this.spotlight = null;
			}
			const id = `${SPOTLIGHT_ID_PREFIX}_${this.id}`;
			this.spotlight = new BX.SpotLight({
				id,
				targetElement: this.bindElement,
				targetVertex: 'middle-center',
				lightMode: true,
				zIndex: 1500
			});
			return this.spotlight;
		}
		create() {
			const self = this;
			this.getPopupTemplate();
			if (!this.bindElement || !this.popupTemplate || this.popup) {
				return;
			}
			this.popup = new main_popup.Popup({
				className: 'bx-call-aha-moment-notify',
				bindElement: this.bindElement,
				targetContainer: this.targetContainer,
				content: this.popupTemplate,
				bindOptions: {
					position: 'bottom',
					forceBindPosition: true
				},
				offsetTop: 23,
				background: this.notifyColor,
				contentBackground: this.notifyColor,
				darkMode: true,
				animation: 'fading',
				autoHide: false,
				events: {
					onPopupClose: function () {
						self.callbacks.onClose();
						if (self.spotlight) {
							self.spotlight.close();
						}
						this.destroy();
					},
					onPopupDestroy: function () {
						self.popup = null;
					},
					onShow: () => {
						const popupWidth = this.popup.getPopupContainer().offsetWidth;
						const elementWidth = this.popup.bindElement.offsetWidth;
						const offsetFix = 0;
						this.popup.setOffset({
							offsetLeft: elementWidth - offsetFix - popupWidth / 2
						});
						this.popup.setAngle({
							offset: popupWidth / 2 - 33,
							position: 'top'
						});
						this.popup.adjustPosition();
					},
					onClose: () => {
						if (self.spotlight) {
							self.spotlight.close();
						}
					}
				}
			});
		}
		show() {
			this.create();
			if (!this.bindElement || !this.popupTemplate) {
				return;
			}
			if (!this.spotlight) {
				this.getSpotlight();
			}
			this.spotlight.show();
			this.spotlight.getTargetContainer().hidden = false;
			if (this.popup) {
				this.popup.show();
			}
		}
		close() {
			if (this.popup) {
				this.popup.close();
			}
			if (this.spotlight) {
				this.spotlight.close();
			}
		}
	}

	class CloudRecordInfoPopup {
		constructor(config) {
			this.popup = null;
			this.popupTemplate = null;
			this.isCloudRecordFeaturesEnabled = config.isCloudRecordFeaturesEnabled;
			this.callId = config.callId;
			this.targetContainer = config.targetContainer || document.body;
			this.callbacks = {
				turnOn: BX.type.isFunction(config.turnOn) ? config.turnOn : BX.DoNothing,
				onClose: BX.type.isFunction(config.onClose) ? config.onClose : BX.DoNothing
			};
		}
		#getTemplateButton() {
			if (!this.isCloudRecordFeaturesEnabled) {
				this.sendAnalytics('private_coming_soon');
				return main_core.Dom.create('span', {
					props: {
						className: 'call-cloud-record-info-popup__coming-soon'
					},
					text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_BUTTON_COMING_SOON')
				});
			}
			return main_core.Dom.create('button', {
				props: {
					className: 'call-cloud-record-info-popup__button --primary'
				},
				text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_BUTTON_TURN_ON'),
				events: {
					click: () => {
						this.callbacks.turnOn();
						this.close();
					}
				}
			});
		}
		#setTariffTemplate() {
			this.popupTemplate = main_core.Dom.create('div', {
				props: {
					className: 'call-cloud-record-info-popup'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'call-cloud-record-info-popup__wrapper'
					},
					children: [main_core.Dom.create('div', {
						props: {
							className: 'call-cloud-record-info-popup__icon'
						}
					}), main_core.Dom.create('div', {
						props: {
							className: 'call-cloud-record-info-popup__text'
						},
						children: [main_core.Dom.create('div', {
							props: {
								className: 'call-cloud-record-info-popup__title'
							},
							text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_TITLE')
						}), main_core.Dom.create('div', {
							props: {
								className: 'call-cloud-record-info-popup__subtitle'
							},
							text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_SUBTITLE')
						})]
					}), main_core.Dom.create('ul', {
						props: {
							className: 'call-cloud-record-info-popup__list'
						},
						children: [main_core.Dom.create('li', {
							props: {
								className: 'call-cloud-record-info-popup__list-item'
							},
							children: [main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-info-popup__list-item_icon --like'
								}
							}), main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-info-popup__list-item_text'
								},
								text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_ITEM_LIKE')
							})]
						}), main_core.Dom.create('li', {
							props: {
								className: 'call-cloud-record-info-popup__list-item'
							},
							children: [main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-info-popup__list-item_icon --devices'
								}
							}), main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-info-popup__list-item_text'
								},
								text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_ITEM_DEVICE')
							})]
						}), main_core.Dom.create('li', {
							props: {
								className: 'call-cloud-record-info-popup__list-item'
							},
							children: [main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-info-popup__list-item_icon --cloud'
								}
							}), main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-info-popup__list-item_text'
								},
								text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_ITEM_CLOUD')
							})]
						})]
					}), main_core.Dom.create('div', {
						props: {
							className: 'call-cloud-record-info-popup__action'
						},
						children: [main_core.Dom.create('button', {
							props: {
								className: 'call-cloud-record-info-popup__button --secondary'
							},
							children: [main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-info-popup__button_wrapper'
								},
								children: [main_core.Dom.create('div', {
									props: {
										className: 'call-cloud-record-info-popup__button_icon'
									}
								}), main_core.Dom.create('div', {
									props: {
										className: 'call-cloud-record-info-popup__button_text'
									},
									text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_BUTTON_BUY')
								})]
							})],
							events: {
								click: () => {
									call_core.Util.openArticle(call_core.CallCloudRecord.tariffSlider);
									this.close();
								}
							}
						})]
					})]
				})]
			});
			this.sendAnalytics('tariff_limit');
		}
		#setMainTemplate() {
			this.popupTemplate = main_core.Dom.create('div', {
				props: {
					className: 'call-cloud-record-info-popup'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'call-cloud-record-info-popup__wrapper'
					},
					children: [main_core.Dom.create('div', {
						props: {
							className: 'call-cloud-record-info-popup__icon'
						}
					}), main_core.Dom.create('div', {
						props: {
							className: 'call-cloud-record-info-popup__text'
						},
						children: [main_core.Dom.create('div', {
							props: {
								className: 'call-cloud-record-info-popup__title'
							},
							text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_MAIN_TITLE')
						}), main_core.Dom.create('div', {
							props: {
								className: 'call-cloud-record-info-popup__subtitle'
							},
							text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_MAIN_SUBTITLE')
						})]
					}), main_core.Dom.create('ul', {
						props: {
							className: 'call-cloud-record-info-popup__list'
						},
						children: [main_core.Dom.create('li', {
							props: {
								className: 'call-cloud-record-info-popup__list-item'
							},
							children: [main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-info-popup__list-item_icon --cloud'
								}
							}), main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-info-popup__list-item_text'
								},
								text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_MAIN_ITEM_CLOUD')
							})]
						}), main_core.Dom.create('li', {
							props: {
								className: 'call-cloud-record-info-popup__list-item'
							},
							children: [main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-info-popup__list-item_icon --like'
								}
							}), main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-info-popup__list-item_text'
								},
								text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_MAIN_ITEM_LIKE')
							})]
						}), main_core.Dom.create('li', {
							props: {
								className: 'call-cloud-record-info-popup__list-item'
							},
							children: [main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-info-popup__list-item_icon --devices'
								}
							}), main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-info-popup__list-item_text'
								},
								text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_MAIN_ITEM_DEVICE')
							})]
						})]
					}), main_core.Dom.create('div', {
						props: {
							className: 'call-cloud-record-info-popup__action'
						},
						children: [this.#getTemplateButton()]
					})]
				})]
			});
		}
		#create() {
			const bindElement = document.querySelector('.bx-messenger-videocall-panel-background-record');
			if (!bindElement) {
				return;
			}
			if (call_core.CallCloudRecord.tariffAvailable) {
				this.#setMainTemplate();
			} else {
				this.#setTariffTemplate();
			}
			this.popup = new main_popup.Popup({
				bindElement,
				className: 'call-cloud-record-info-popup',
				targetContainer: this.targetContainer,
				content: this.popupTemplate,
				bindOptions: {
					position: 'top'
				},
				autoHide: true,
				closeByEsc: true,
				background: '#1f51ae',
				borderRadius: '18px',
				contentBackground: '#0D2F70',
				darkMode: true,
				contentNoPaddings: true,
				animation: 'fading',
				width: 406,
				padding: 0,
				angle: {
					offset: 183,
					position: 'bottom'
				},
				offsetLeft: -139,
				contentBorderRadius: '18px',
				events: {
					onPopupClose: () => {
						this.callbacks.onClose();
						this.popup.destroy();
					},
					onPopupDestroy: () => {
						this.popup = null;
					}
				}
			});
		}
		show() {
			this.#create();
			this.popup.show();
		}
		close() {
			if (this.popup) {
				this.popup.close();
			}
		}
		toggle() {
			if (!this.popup) {
				this.show();
				return;
			}
			this.close();
		}
		sendAnalytics(popupType) {
			call_lib_analytics.Analytics.getInstance().onCloudRecordPopupShow({
				callId: this.callId,
				popupType
			});
		}
	}

	class CommonRecordMenuPopup {
		#popupType;
		#state;
		#isDesktopRecord;
		constructor(config) {
			this.popup = null;
			this.popupTemplate = null;
			this.targetContainer = config.targetContainer || document.body;
			this.#popupType = config.popupType || 'kind'; // kind || control
			this.#state = config.state;
			this.#isDesktopRecord = config.isDesktopRecord;
			this.callbacks = {
				onStart: BX.type.isFunction(config.onStart) ? config.onStart : BX.DoNothing,
				onStop: BX.type.isFunction(config.onStop) ? config.onStop : BX.DoNothing,
				onPause: BX.type.isFunction(config.onPause) ? config.onPause : BX.DoNothing,
				onDestroy: BX.type.isFunction(config.onDestroy) ? config.onDestroy : BX.DoNothing,
				onClose: BX.type.isFunction(config.onClose) ? config.onClose : BX.DoNothing
			};
		}
		#getKindButtons() {
			return [main_core.Dom.create('div', {
				props: {
					className: 'call-common-record-menu-popup__button'
				},
				children: [main_core.Dom.create('span', {
					props: {
						className: 'call-common-record-menu-popup__button_text'
					},
					text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_MENU_RECORD_AUDIO')
				})],
				events: {
					click: () => {
						this.callbacks.onStart('audio');
						this.close();
					}
				}
			}), main_core.Dom.create('div', {
				props: {
					className: 'call-common-record-menu-popup__button'
				},
				children: [main_core.Dom.create('span', {
					props: {
						className: 'call-common-record-menu-popup__button_text'
					},
					text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_MENU_RECORD_VIDEO')
				})],
				events: {
					click: () => {
						this.callbacks.onStart('video');
						this.close();
					}
				}
			})];
		}
		#getControlButtons() {
			const buttons = [];
			if (!this.#isDesktopRecord) {
				buttons.push(main_core.Dom.create('div', {
					props: {
						className: 'call-common-record-menu-popup__button  --destroy'
					},
					children: [main_core.Dom.create('span', {
						props: {
							className: 'call-common-record-menu-popup__button_text'
						},
						text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_MENU_DESTROY_RECORD')
					}), main_core.Dom.create('span', {
						props: {
							className: 'call-common-record-menu-popup__button_icon --destroy'
						}
					})],
					events: {
						click: () => {
							this.callbacks.onDestroy();
							this.close();
						}
					}
				}));
			}
			buttons.push(main_core.Dom.create('div', {
				props: {
					className: 'call-common-record-menu-popup__button'
				},
				children: [main_core.Dom.create('span', {
					props: {
						className: 'call-common-record-menu-popup__button_text'
					},
					text: this.#state === 'paused' ? main_core.Loc.getMessage('CALL_CLOUD_RECORD_MENU_RESUME_RECORD') : main_core.Loc.getMessage('CALL_CLOUD_RECORD_MENU_PAUSE_RECORD')
				}), main_core.Dom.create('span', {
					props: {
						className: `call-common-record-menu-popup__button_icon ${this.#state === 'paused' ? '--resume' : '--pause'}`
					}
				})],
				events: {
					click: () => {
						this.callbacks.onPause();
						this.close();
					}
				}
			}), main_core.Dom.create('div', {
				props: {
					className: 'call-common-record-menu-popup__button'
				},
				children: [main_core.Dom.create('span', {
					props: {
						className: 'call-common-record-menu-popup__button_text'
					},
					text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_MENU_STOP_RECORD')
				}), main_core.Dom.create('span', {
					props: {
						className: 'call-common-record-menu-popup__button_icon --stop'
					}
				})],
				events: {
					click: () => {
						this.callbacks.onStop();
						this.close();
					}
				}
			}));
			return buttons;
		}
		#getTemplateButtons() {
			if (this.#popupType === 'kind') {
				return this.#getKindButtons();
			}
			return this.#getControlButtons();
		}
		#getPopupTemplate() {
			this.popupTemplate = main_core.Dom.create('div', {
				props: {
					className: `call-common-record-menu-popup__wrapper --${this.#popupType}`
				},
				children: this.#getTemplateButtons()
			});
		}
		#create() {
			const copilotButton = document.querySelector('.bx-messenger-videocall-panel-background-record');
			if (!copilotButton) {
				return;
			}
			this.#getPopupTemplate();
			this.popup = new main_popup.Popup({
				className: 'call-common-record-menu-popup',
				bindElement: copilotButton,
				targetContainer: this.targetContainer,
				content: this.popupTemplate,
				bindOptions: {
					position: 'top'
				},
				autoHide: true,
				closeByEsc: true,
				background: '#00428F',
				contentBackground: '#00428F',
				darkMode: true,
				contentNoPaddings: true,
				animation: 'fading',
				padding: 0,
				angle: {
					position: 'bottom'
				},
				offsetLeft: 20,
				contentBorderRadius: '6px',
				events: {
					onPopupClose: () => {
						this.callbacks.onClose();
						this.popup.destroy();
					},
					onPopupDestroy: () => {
						this.popup = null;
					}
				}
			});
		}
		show() {
			this.#create();
			this.popup.show();
		}
		close() {
			if (this.popup) {
				this.popup.close();
			}
		}
		toggle() {
			if (!this.popup) {
				this.show();
				return;
			}
			this.close();
		}
	}

	class ConfirmModal {
		constructor(config) {
			this.popup = null;
			this.callbacks = {
				onClickYesButton: BX.type.isFunction(config.onClickYesButton) ? config.onClickYesButton : BX.DoNothing,
				onClickNoButton: BX.type.isFunction(config.onClickNoButton) ? config.onClickNoButton : BX.DoNothing,
				onClose: BX.type.isFunction(config.onClose) ? config.onClose : BX.DoNothing
			};
			this.title = BX.type.isString(config.title) ? config.title : '';
			this.message = BX.type.isString(config.message) ? config.message : '';
			this.yesButtonText = BX.type.isString(config.yesButtonText) ? config.yesButtonText : '';
			this.noButtonText = BX.type.isString(config.noButtonText) ? config.noButtonText : '';
			this.targetContainer = BX.type.isDomNode(config.targetContainer) ? config.targetContainer : document.body;
		}
		#getButtons() {
			const buttons = [];
			if (this.yesButtonText) {
				buttons.push(main_core.Dom.create('button', {
					props: {
						className: 'call-confirm-modal__button call-confirm-modal__button-yes'
					},
					text: this.yesButtonText,
					events: {
						click: () => {
							this.callbacks.onClickYesButton();
							this.popup.close();
						}
					}
				}));
			}
			if (this.noButtonText) {
				buttons.push(main_core.Dom.create('button', {
					props: {
						className: 'call-confirm-modal__button call-confirm-modal__button-no'
					},
					text: this.noButtonText,
					events: {
						click: () => {
							this.callbacks.onClickNoButton();
							this.popup.close();
						}
					}
				}));
			}
			return buttons;
		}
		create() {
			this.popup = BX.UI.Dialogs.MessageBox.create({
				modal: true,
				popupOptions: {
					content: main_core.Dom.create('div', {
						props: {
							className: 'call-confirm-modal__content'
						},
						children: [main_core.Dom.create('div', {
							props: {
								className: 'call-confirm-modal__title'
							},
							text: this.title
						}), main_core.Dom.create('div', {
							props: {
								className: 'call-confirm-modal__message'
							},
							text: this.message
						}), main_core.Dom.create('div', {
							props: {
								className: 'call-confirm-modal__actions'
							},
							children: this.#getButtons()
						})]
					}),
					className: 'call-confirm-modal',
					darkMode: true,
					contentBackground: '#22272B',
					contentBorderRadius: '10px',
					autoHide: false,
					closeByEsc: false,
					closeIcon: true,
					contentNoPaddings: true,
					width: 420,
					maxWidth: 420,
					animation: 'fading',
					targetContainer: this.targetContainer,
					events: {
						onPopupClose: () => {
							this.callbacks.onClose();
							this.popup = null;
						}
					}
				}
			});
		}
		show() {
			this.close();
			this.create();
			this.popup.show();
		}
		close() {
			if (this.popup) {
				this.popup.close();
			}
		}
	}

	class TalkingPopup {
		constructor(options) {
			this.popup = null;
			this.customClassName = BX.prop.getString(options, 'customClassName', '');
			this.bindElement = BX.prop.getElementNode(options, 'bindElement', null);
			this.targetContainer = BX.prop.getElementNode(options, 'targetContainer', null);
			this.content = options.content;
			this.closingDelay = 1500;
			this.closingDuration = 500;
			this.closingTimeout = null;
			this.callbacks = {
				onClose: BX.prop.getFunction(options, 'onClose', BX.DoNothing)
			};
		}
		show() {
			if (main_core.Type.isNumber(this.closingTimeout) || main_core.Dom.hasClass(this.popup?.getPopupContainer(), 'closing')) {
				this.clearClosingTimeout();
				if (main_core.Dom.hasClass(this.popup?.getPopupContainer(), 'closing')) {
					main_core.Dom.removeClass(this.popup?.getPopupContainer(), 'closing');
				}
			} else {
				window.requestAnimationFrame(() => {
					if (!main_core.Dom.hasClass(this.popup?.getPopupContainer(), 'opening')) {
						main_core.Dom.addClass(this.popup?.getPopupContainer(), 'opening');
					}
					window.requestAnimationFrame(() => {
						main_core.Dom.removeClass(this.popup?.getPopupContainer(), 'opening');
					});
				});
			}
			if (!this.popup) {
				this.popup = new main_popup.Popup({
					bindElement: this.bindElement,
					targetContainer: this.targetContainer,
					content: this.render(),
					padding: 0,
					contentPadding: 0,
					className: `bx-call-view-popup-talking ${this.customClassName} opening`,
					zIndexOptions: {
						alwaysOnTop: true
					},
					background: '#085DC1',
					contentBackground: '#085DC1',
					darkMode: true,
					contentBorderRadius: '18px',
					borderRadius: '18px',
					angle: false,
					events: {
						onClose: () => {
							this.destroy();
						},
						onDestroy: () => this.popup = null
					}
				});
			}
			this.popup.show();
		}
		render() {
			const avatarText = im_v2_lib_utils.Utils.text.getFirstLetters(this.content.name).toUpperCase();
			return main_core.Dom.create('div', {
				props: {
					className: 'bx-call-view-popup-talking-body'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: `bx-call-view-popup-talking-avatar ${this.content.avatar ? '' : 'no-photo'}`
					},
					style: {
						'background-image': `url("${this.content.avatar}")`
					},
					children: [main_core.Dom.create('div', {
						props: {
							className: 'bx-call-view-popup-talking-avatar-text'
						},
						text: this.content.avatar ? '' : avatarText
					})]
				}), main_core.Dom.create('div', {
					props: {
						className: 'bx-call-view-popup-talking-text'
					},
					text: main_core.Loc.getMessage('CALL_TALKING_POPUP_TEXT', {
						'#NAME#': this.content.name
					})
				})]
			});
		}
		setContent(content) {
			this.content = content;
			if (!this.popup) {
				return;
			}
			this.popup.setContent(this.render());
		}
		close(callback) {
			this.clearClosingTimeout();
			if (this.popup) {
				this.popup.close();
				this.callbacks.onClose();
			}
			if (callback) {
				callback();
			}
			this.destroy();
		}
		animatedClose(callback) {
			this.clearClosingTimeout();
			if (!main_core.Dom.hasClass(this.popup?.getPopupContainer(), 'closing')) {
				main_core.Dom.addClass(this.popup?.getPopupContainer(), 'closing');
			}
			this.closingTimeout = setTimeout(() => {
				this.close(callback);
			}, this.closingDuration);
		}
		clearClosingTimeout() {
			clearTimeout(this.closingTimeout);
			this.closingTimeout = null;
		}
		closeWithDelay(isForce, callback) {
			if (isForce) {
				this.close(callback);
			} else {
				this.clearClosingTimeout();
				if (main_core.Dom.hasClass(this.popup?.getPopupContainer(), 'closing')) {
					main_core.Dom.removeClass(this.popup?.getPopupContainer(), 'closing');
				}
				this.closingTimeout = setTimeout(() => {
					this.animatedClose(callback);
				}, this.closingDelay);
			}
		}
		destroy() {
			this.clearClosingTimeout();
			if (this.popup) {
				this.popup.destroy();
			}
		}
	}

	class TalkingService {
		constructor(config) {
			this.hasQueue = this.hasQueue.bind(this);
			this.refreshQueue = this.refreshQueue.bind(this);
			this.watchTalking = this.watchTalking.bind(this);
			this.deleteFromQueue = this.deleteFromQueue.bind(this);
			this.updateQueue = this.updateQueue.bind(this);
			this.showPopup = this.showPopup.bind(this);
			this.hidePopup = this.hidePopup.bind(this);
			this.root = config?.root ?? null;
			this.users = {};
			this.activeId = null;
			this.queue = [];
		}
		init(config) {
			this.root = config?.root ?? null;
		}
		hasQueue() {
			return this.queue.length > 0;
		}
		refreshQueue() {
			if (this.hasQueue()) {
				this.updateQueue();
			}
		}
		watchTalking(event) {
			const eventData = event.data;
			const userId = BX.prop.getInteger(eventData.user.data, 'id', 0);
			if (userId < 1) {
				return;
			}
			if (eventData.fieldName === 'talking') {
				if (eventData.newValue && !eventData.user.isConnected) {
					return;
				}
				this.updateQueue({
					user: eventData.user.data,
					isUserTalking: eventData.newValue
				});
			} else if (eventData.fieldName === 'order') {
				this.refreshQueue();
			}
		}
		deleteFromQueue(userId) {
			const index = this.queue.indexOf(userId);
			if (index > -1) {
				this.queue.splice(index, 1);
				delete this.users[userId];
			}
		}
		updateQueue(config) {
			let user = null;
			let isUserTalking = false;
			if (config) {
				user = config.user;
				isUserTalking = config.isUserTalking;
			}
			let mutedUserId = null;
			let newActiveId = null;
			const deleteUserFromQueue = () => {
				if (mutedUserId) {
					this.deleteFromQueue(mutedUserId);
				}
			};
			if (user) {
				if (isUserTalking) {
					if (!this.users[user.id]) {
						this.queue.push(user.id);
						this.users[user.id] = user;
					}
				} else {
					mutedUserId = user.id;
				}
			}
			let activeUserCard = null;
			if (this.activeId) {
				activeUserCard = this.root?.querySelector(`.bx-messenger-videocall-user[data-user-id="${this.activeId}"]`);
			}
			let canPopupClose = false;
			const userTalkAgain = user && user?.id === this.activeId && isUserTalking && this.talkingPopup?.closingTimeout;
			if (!this.activeId || activeUserCard || mutedUserId && mutedUserId === this.activeId) {
				canPopupClose = true;
				for (const userId of this.queue) {
					if (userId === mutedUserId || userId === this.activeId) {
						continue;
					}
					const userCard = this.root?.querySelector(`.bx-messenger-videocall-user[data-user-id="${userId}"]`);
					if (!userCard) {
						newActiveId = userId;
						break;
					}
				}
			} else if (!userTalkAgain) {
				deleteUserFromQueue();
				return;
			}
			if (this.activeId && !newActiveId && canPopupClose) {
				this.hidePopup(this.activeId !== mutedUserId, () => {
					deleteUserFromQueue();
					this.activeId = null;
				}, true);
			} else if (this.activeId && newActiveId && this.activeId !== newActiveId || !this.activeId && newActiveId) {
				this.showPopup(this.users[newActiveId]);
				deleteUserFromQueue();
				this.activeId = newActiveId;
			} else if (userTalkAgain) {
				this.showPopup(this.users[user?.id]);
				deleteUserFromQueue();
			} else {
				deleteUserFromQueue();
			}
		}
		showPopup(user) {
			if (!this.talkingPopup) {
				this.talkingPopup = new TalkingPopup({
					bindElement: document.body,
					targetContainer: this.root,
					content: user
				});
			} else if (this.talkingPopup && this.activeId !== user.id) {
				this.talkingPopup.setContent(user);
			}
			this.talkingPopup.show();
		}
		hidePopup(isForce, callback) {
			if (!this.talkingPopup) {
				return;
			}
			this.talkingPopup.closeWithDelay(isForce, callback);
		}
		destroy() {
			this.hidePopup(true);
			this.talkingPopup?.destroy();
			this.users = {};
			this.activeId = null;
			this.queue = [];
		}
	}

	const Layouts = call_mapping.ViewLayout;
	const UiState = call_mapping.ViewUiState;
	const Size = call_mapping.ViewSize;
	const RoomState = call_mapping.ViewRoomState;
	const EventName = call_mapping.ViewEvent;
	const RerenderReason = {
		VideoEnabled: 'videoEnabled',
		VideoDisabled: 'videoDisabled',
		UserDisconnected: 'userDisconnected',
		VoiceStarted: 'voiceStarted'
	};
	const SwapType = {
		Direct: 'direct',
		Replace: 'replace'
	};
	const beginingPosition = -1;
	const newUserPosition = 999;
	const addButtonPosition = 1001;
	const MIN_WIDTH = 250;
	const SIDE_USER_WIDTH = 160; // keep in sync with .bx-messenger-videocall-user-block .bx-messenger-videocall-user width
	const SIDE_USER_HEIGHT = 90; // keep in sync with .bx-messenger-videocall-user height

	const MAX_USERS_PER_PAGE = 19;
	const MIN_GRID_USER_WIDTH = 180;
	const MIN_GRID_USER_HEIGHT = 100;
	const CHANGE_VIDEO_RERENDER_DELAY = 3000;
	const WAITING_VIDEO_DELAY = 3000;
	const CALLCONTROL_PROMO_ID = 'call:callcontrol-notify-promo:07052025:all';
	const CLOUD_RECORD_PROMO_ID = 'call:cloud-record-info-popup:09092025:all';
	class View {
		#commonRecord;
		#confirmModal;
		#guestLink = null;
		constructor(config) {
			this.destroyed = false;
			this.title = config.title;
			this.container = config.container;
			this.baseZIndex = config.baseZIndex;
			this.cameraId = config.cameraId;
			this.microphoneId = config.microphoneId;
			this.speakerId = '';
			this.speakerMuted = false;
			this.externalSpeakerManagement = config.externalSpeakerManagement === true;
			this.showChatButtons = config.showChatButtons === true;
			this.showUsersButton = config.showUsersButton === true;
			this.showShareButton = config.showShareButton !== false;
			this.showRecordButton = config.showRecordButton !== false;
			this.showDocumentButton = config.showDocumentButton !== false;
			this.showCopilotButton = config.showCopilotButton !== false;
			this.showButtonPanel = config.showButtonPanel !== false;
			this.showAddUserButtonInList = config.showAddUserButtonInList || false;
			this.preferInitialWindowPlacementPictureInPicture = true;
			this.limitation = null;
			this.activeUsers = new Set();
			this.rerenderTimeout = null;
			this.waitingForUserMediaTimeouts = new Map();
			this.rerenderQueue = new Map();
			this.broadcastingMode = BX.prop.getBoolean(config, "broadcastingMode", false);
			this.broadcastingPresenters = BX.prop.getArray(config, "broadcastingPresenters", []);
			this.currentPage = 1;
			this.pagesCount = 1;
			this.usersPerPage = 0; // initializes after rendering and on resize

			this.language = config.language || '';
			this.lastPosition = 1;
			this.userData = {};
			if (config.userData) {
				this.updateUserData(config.userData);
			}
			this.userLimit = config.userLimit || 1;
			this.userId = BX.message('USER_ID');
			this.isIntranetOrExtranet = BX.prop.getBoolean(config, "isIntranetOrExtranet", true);
			this.users = {}; // Call participants. The key is the user id.
			this.screenUsers = {}; // Screen sharing participants. The key is the user id.
			this.userRegistry = new UserRegistry();
			this.talkingService = new TalkingService();
			this.userRegistry.subscribe('changed', this.talkingService.refreshQueue);
			let localUserModel = new UserModel({
				id: this.userId,
				state: BX.prop.getString(config, "localUserState", call_core.UserState.Connected),
				localUser: true,
				order: beginingPosition,
				name: this.userData[this.userId] ? this.userData[this.userId].name : '',
				avatar: this.userData[this.userId] ? this.userData[this.userId].avatar_hr : ''
			});
			if (this.userId) {
				this.userRegistry.push(localUserModel);
			}
			this.cache = new Map();
			this.localUser = new CallUser({
				parentContainer: this.container,
				userModel: localUserModel,
				allowBackgroundItem: call_core.BackgroundDialog.isAvailable() && this.isIntranetOrExtranet,
				allowMaskItem: call_core.BackgroundDialog.isMaskAvailable() && this.isIntranetOrExtranet,
				onUserRename: this._onUserRename.bind(this),
				onUserRenameInputFocus: this._onUserRenameInputFocus.bind(this),
				onUserRenameInputBlur: this._onUserRenameInputBlur.bind(this),
				onClick: this._onUserClick.bind(this),
				onTurnOffParticipantMic: this._onTurnOffParticipantMic.bind(this),
				onTurnOffParticipantCam: this._onTurnOffParticipantCam.bind(this),
				onTurnOffParticipantScreenshare: this._onTurnOffParticipantScreenshare.bind(this),
				onPin: this._onUserPin.bind(this),
				onUnPin: this._onUserUnPin.bind(this)
			});
			this.centralUser = this.localUser; //show local user until someone is connected
			this.centralUserMobile = null;
			this.pinnedUser = null;
			this.presenterId = null;
			this.localUserReceivedStats = false;
			this.returnToGridAfterScreenStopped = false;
			this.mediaSelectionBlocked = config.mediaSelectionBlocked === true;
			this.visible = false;
			this.elements = {
				root: null,
				wrap: null,
				watermark: null,
				container: null,
				overlay: null,
				topPanel: null,
				bottom: null,
				notificationPanel: null,
				panel: null,
				audioContainer: null,
				screenAudioContainer: null,
				audio: {
					// userId: <audio> for this user's stream
				},
				screenAudio: {
					// userId: <audio> for this user's stream
				},
				center: null,
				localUserMobile: null,
				userBlock: null,
				ear: {
					left: null,
					right: null
				},
				userList: {
					container: null,
					addButton: null
				},
				userSelectorContainer: null,
				pinnedUserContainer: null,
				renameSlider: {
					input: null,
					button: null
				},
				pageNavigatorLeft: null,
				pageNavigatorLeftCounter: null,
				pageNavigatorRight: null,
				pageNavigatorRightCounter: null
			};
			this.buttons = {
				title: null,
				grid: null,
				add: null,
				share: null,
				record: null,
				document: null,
				copilot: null,
				microphone: null,
				camera: null,
				speaker: null,
				screen: null,
				mobileMenu: null,
				chat: null,
				users: null,
				history: null,
				hangup: null,
				fullscreen: null,
				overlay: null,
				status: null,
				returnToCall: null,
				recordStatus: null,
				participants: null,
				participantsMobile: null,
				watermark: null,
				hd: null,
				protected: null,
				more: null,
				hangupOptions: null
			};
			this.previousTopButtonList = [];
			this.needToRerenderTopButtonList = false;
			this.previousButtonList = [];
			this.needToRerenderButtonList = false;
			this.size = Size.Full;
			this.maxWidth = null;
			this.isMuted = call_core.Hardware.isMicrophoneMuted;
			this.isCameraOn = call_core.Hardware.isCameraOn;
			this.isFullScreen = false;
			this.isUserBlockFolded = false;
			this.commonRecordState = this.getDefaultCommonRecordState();
			this.blockedButtons = {};
			let configBlockedButtons = BX.prop.getArray(config, "blockedButtons", []);
			configBlockedButtons.forEach(buttonCode => this.blockedButtons[buttonCode] = true);
			this.hiddenButtons = {};
			this.overflownButtons = {};
			if (!this.showUsersButton) {
				this.hiddenButtons['users'] = true;
			}
			let configHiddenButtons = BX.prop.getArray(config, "hiddenButtons", []);
			configHiddenButtons.forEach(buttonCode => this.hiddenButtons[buttonCode] = true);
			this.hiddenTopButtons = {};
			let configHiddenTopButtons = BX.prop.getArray(config, "hiddenTopButtons", []);
			configHiddenTopButtons.forEach(buttonCode => this.hiddenTopButtons[buttonCode] = true);
			this.uiState = config.uiState || UiState.Calling;
			this.layout = config.layout || Layouts.Centered;
			this.whiteSpaceInUserGrid = 0;
			this.roomState = RoomState.None;
			this.eventEmitter = new main_core_events.EventEmitter(this, 'BX.Call.View');
			this.scrollInterval = 0;

			// Event handlers
			this._onFullScreenChangeHandler = this._onFullScreenChange.bind(this);
			//this._onResizeHandler = BX.throttle(this._onResize.bind(this), 500);
			this._onResizeHandler = this._onResize.bind(this);
			this._onOrientationChangeHandler = BX.debounce(this._onOrientationChange.bind(this), 500);
			this._onKeyDownHandler = this._onKeyDown.bind(this);
			this._onKeyUpHandler = this._onKeyUp.bind(this);
			this._onAddUser = BX.throttle(() => {
				if (this.destroyed) {
					return;
				}
				this.updateUserList();
				this.updateButtons();
				this.updateUserButtons();
				this.muteSpeaker(this.speakerMuted);
			}, 500);
			this._onUserStateUpdated = BX.throttle(skippedElementsList => {
				if (this.destroyed) {
					return;
				}
				this.updateUserList();
				this.updateButtons(skippedElementsList);
				this.updateUserButtons();
			}, 500);
			this.resizeObserver = new BX.ResizeObserver(this._onResizeHandler);
			this.intersectionObserver = null;

			// timers
			this.switchPresenterTimeout = 0;
			this.deviceSelector = null;
			this.userSelector = null;
			this.pinnedUserContainer = null;
			this.renameSlider = null;
			this.userSize = {
				width: 0,
				height: 0
			};
			this.hintManager = BX.UI.Hint.createInstance({
				popupParameters: {
					targetContainer: document.body,
					className: 'bx-messenger-videocall-panel-item-hotkey-hint',
					bindOptions: {
						forceBindPosition: true
					},
					angle: false
				}
			});
			this.hotKey = {
				all: call_core.Util.isDesktop(),
				microphone: true,
				microphoneSpace: true,
				camera: true,
				screen: true,
				record: true,
				speaker: true,
				chat: true,
				users: true,
				floorRequest: true,
				muteSpeaker: true,
				grid: true
			};
			this.hotKeyTemporaryBlock = 0;
			this._isPreparing = false;
			this._videoRerenderDelay = 0;
			this.isWindowFocus = config.isWindowFocus || false;
			this._isActivePiPFromController = false;
			const pipUpdateButtons = () => {
				if (this.pictureInPictureCallWindow) {
					this.pictureInPictureCallWindow.setButtons(this.getPictureInPictureCallWindowGetButtonsList()).updateButtons();
				}
			};
			this.pipCoordinator = new call_feature_pip.PipCoordinator({
				togglePip: active => this.toggleStatePictureInPictureCallWindow(active),
				isScreenSharing: () => this.hasCurrentUserScreenSharing(),
				isFolded: () => this.size === View.Size.Folded,
				isVideoconf: () => this.isVideoconf,
				updateButtons: pipUpdateButtons,
				isConnected: () => this.uiState === UiState.Connected,
				isShown: () => this.visible,
				isMacDesktop: im_v2_lib_desktopApi.DesktopApi.isDesktop() && main_core.Browser.isMac()
			});
			this.init();
			this.subscribeEvents(config);
			if (main_core.Type.isPlainObject(config.userStates)) {
				this.appendUsers(config.userStates);
			}

			/*this.resizeCalled = 0;
			this.reportResizeCalled = BX.debounce(function()
			{
				console.log('resizeCalled ' + this.resizeCalled + ' times');
				this.resizeCalled = 0;
			}.bind(this), 100)*/

			this.hideEarTimer = null;
			this.isCopilotFeaturesEnabled = config.isCopilotFeaturesEnabled || false;
			this.isCopilotActive = config.isCopilotActive || false;
			this.copilotNotify = null;
			this.ahaMomentNotify = null;
			this.pictureInPictureCallWindow = null;
			this.floorRequestNotifications = [];
			this.currentPiPUserId = null;
			this.isVideoconf = config.isVideoconf || false;
			this.needToShowCallcontrolPromo = this.isVideoconf ? false : im_v2_lib_promo.PromoManager.getInstance().needToShow(CALLCONTROL_PROMO_ID);
			this.#commonRecord = {
				infoPopup: null,
				menuPopup: null,
				notify: null
			};
			this.#confirmModal = null;
		}
		get enableAutoPip() {
			return this.pipCoordinator?.enableAutoPip ?? false;
		}
		isHidden() {
			return this.pipCoordinator?.isHidden() ?? false;
		}
		openArticle(articleCode) {
			const infoHelper = BX.UI.InfoHelper;
			if (infoHelper.isOpen()) {
				infoHelper.close();
			}
			infoHelper.show(articleCode);
		}
		onClickButtonWithLimit(limitObj, handle) {
			const {
				enabled,
				articleCode
			} = limitObj;
			if (enabled && typeof handle === "function") {
				handle();
				return;
			}
			if (!enabled && articleCode) {
				if (this.size === View.Size.Folded) {
					this._onBodyClick();
				}
				this.openArticle(articleCode);
			}
		}
		getLimitation() {
			this.limitation = call_core.Util.getCallFeatures();
		}
		getLimitationByType(type) {
			const defaultLimitation = {
				enable: true
			};
			const currentLimitation = this.limitation?.[`call_${type}`];
			if (!currentLimitation) {
				return defaultLimitation;
			}
			return {
				enabled: currentLimitation.enable,
				articleCode: currentLimitation.articleCode
			};
		}
		getBackgroundLimitation() {
			return this.getLimitationByType('background');
		}
		getBackgroundBlurLimitation() {
			return this.getLimitationByType('background_blur');
		}
		getRecordLimitation() {
			return this.getLimitationByType('record');
		}
		getScreenSharingLimitation() {
			return this.getLimitationByType('screen_sharing');
		}
		isDesktopCall() {
			return im_v2_lib_desktopApi.DesktopApi.isDesktop();
		}
		checkAvailableBackgroundImage() {
			if (!this.isDesktopCall()) {
				return;
			}
			const {
				id: backgroundId
			} = im_v2_lib_desktopApi.DesktopApi.getBackgroundImage();
			if (!backgroundId || backgroundId === 'none') {
				im_v2_lib_desktopApi.DesktopApi.setCallBackground('none', 'none');
			}
		}
		toggleVisibilityEar() {
			if (this.hideEarTimer) {
				clearTimeout(this.hideEarTimer);
				this.hideEarTimer = null;
			}
			main_core.Dom.addClass(this.elements.root, 'on-mouse-move');
			this.elements.ear.top?.classList.add("force-visible");
			this.elements.ear.bottom?.classList.add("force-visible");
			this.elements.pageNavigatorLeft?.classList.add("force-visible");
			this.elements.pageNavigatorRight?.classList.add("force-visible");
			this.hideEarTimer = setTimeout(() => {
				main_core.Dom.removeClass(this.elements.root, 'on-mouse-move');
				this.elements.ear.top?.classList.remove("force-visible");
				this.elements.ear.bottom?.classList.remove("force-visible");
				this.elements.pageNavigatorLeft?.classList.remove("force-visible");
				this.elements.pageNavigatorRight?.classList.remove("force-visible");
			}, 5000);
		}
		init() {
			this.getLimitation();
			this.checkAvailableBackgroundImage();
			if (this.isFullScreenSupported()) {
				if (main_core.Browser.isChrome() || main_core.Browser.isSafari()) {
					window.addEventListener("fullscreenchange", this._onFullScreenChangeHandler);
					window.addEventListener("webkitfullscreenchange", this._onFullScreenChangeHandler);
				} else if (main_core.Browser.isFirefox()) {
					window.addEventListener("mozfullscreenchange", this._onFullScreenChangeHandler);
				}
			}
			if (main_core.Browser.isMobile()) {
				document.documentElement.style.setProperty('--view-height', window.innerHeight + 'px');
				window.addEventListener("orientationchange", this._onOrientationChangeHandler);
			}
			this.elements.audioContainer = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-audio-container"
				}
			});
			this.elements.screenAudioContainer = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-audio-container"
				}
			});
			if (!this.externalSpeakerManagement) {
				if (call_core.Hardware.initialized) {
					this.setSpeakerId(call_core.Hardware.defaultSpeaker);
				} else {
					call_core.Hardware.subscribe(call_core.Hardware.Events.initialized, function () {
						this.setSpeakerId(call_core.Hardware.defaultSpeaker);
					}.bind(this));
				}
			}
			call_core.Hardware.subscribe(call_core.Hardware.Events.onChangeMicrophoneMuted, this.setMuted);
			call_core.Hardware.subscribe(call_core.Hardware.Events.onChangeCameraOn, this.setCameraState);
			window.addEventListener("keydown", this._onKeyDownHandler);
			window.addEventListener("keyup", this._onKeyUpHandler);
			this.onMouseMoveHandler = this.toggleVisibilityEar.bind(this);
			document.addEventListener('mousemove', this.onMouseMoveHandler);
			this.keyModifierForCss = main_core.Browser.isMac() ? '\\2318 + Shift' : 'Ctrl + Shift';
			this.container.appendChild(this.elements.audioContainer);
			this.container.appendChild(this.elements.screenAudioContainer);
			this.pipCoordinator.start();
		}
		get isActivePiPFromController() {
			return this._isActivePiPFromController;
		}
		set isActivePiPFromController(isActive) {
			this._isActivePiPFromController = isActive;
		}
		get isPreparing() {
			return this._isPreparing;
		}
		set isPreparing(isPreparing) {
			this._isPreparing = !!isPreparing;
		}
		// for testing different delay values
		get videoRerenderDelay() {
			return this._videoRerenderDelay > 0 ? this._videoRerenderDelay : CHANGE_VIDEO_RERENDER_DELAY;
		}
		set videoRerenderDelay(videoRerenderDelay) {
			this._videoRerenderDelay = videoRerenderDelay;
		}
		subscribeEvents(config) {
			for (let event in EventName) {
				if (EventName.hasOwnProperty(event) && main_core.Type.isFunction(config[event])) {
					this.setCallback(event, config[event]);
				}
			}
		}
		setCallback(name, cb) {
			if (main_core.Type.isFunction(cb) && EventName.hasOwnProperty(name)) {
				this.eventEmitter.subscribe(name, function (event) {
					cb(event.data);
				});
			}
		}
		subscribe(eventName, listener) {
			return this.eventEmitter.subscribe(eventName, listener);
		}
		unsubscribe(eventName, listener) {
			return this.eventEmitter.unsubscribe(eventName, listener);
		}
		getNextPosition() {
			return this.lastPosition++;
		}
		/**
		 * @param {object} userStates {userId -> state}
		 */
		appendUsers(userStates) {
			if (!main_core.Type.isPlainObject(userStates)) {
				return;
			}
			let userIds = Object.keys(userStates);
			for (let i = 0; i < userIds.length; i++) {
				let userId = userIds[i];
				this.addUser(userId, userStates[userId] ? userStates[userId] : call_core.UserState.Idle);
			}
		}
		setCentralUser(userId) {
			if (this.centralUser.id == userId) {
				return;
			}
			if (!this.users[userId] && userId != this.userId) {
				return;
			}
			const previousCentralUser = this.centralUser;
			this.centralUser = userId == this.userId ? this.localUser : this.users[userId];
			if (this.layout === Layouts.Centered || this.layout === Layouts.Mobile) {
				if (this.layout === Layouts.Mobile) {
					previousCentralUser.dismount();
				}
				this.updateUserList();
				if (previousCentralUser.id != this.centralUser.id) {
					this.eventEmitter.emit(EventName.onHasMainStream, {
						userId: this.centralUser.id
					});
				}
			}
			if (this.layout === Layouts.Mobile) {
				if (this.centralUserMobile) {
					this.centralUserMobile.setUserModel(this.userRegistry.get(userId));
				} else {
					this.centralUserMobile = new CallUserMobile({
						userModel: this.userRegistry.get(userId),
						onClick: () => this.showUserMenu(this.centralUser.id)
					});
					this.centralUserMobile.mount(this.elements.pinnedUserContainer);
				}
			}
			this.userRegistry.get(previousCentralUser.id).centralUser = false;
			this.userRegistry.get(this.centralUser.id).centralUser = true;
			this.eventEmitter.emit(EventName.onSetCentralUser, {
				userId: userId,
				stream: userId == this.userId ? this.localUser.stream : this.users[userId].stream
			});
			this.talkingService.refreshQueue();
		}
		getLeftUser(userId) {
			let candidateUserId = null;
			const keys = [...this.userRegistry.users.keys()];
			const index = keys.indexOf(userId);
			if (index === -1) {
				return candidateUserId;
			}
			const userModels = [...this.userRegistry.users.values()].slice(0, index);
			const totalUserModels = userModels.length;
			for (let i = totalUserModels - 1; i >= 0; i--) {
				const userModel = userModels[i];
				if (!userModel.localUser && userModel.state === call_core.UserState.Connected) {
					candidateUserId = userModel.id;
					break;
				}
			}
			return candidateUserId;
		}
		getRightUser(userId) {
			let candidateUserId = null;
			const keys = [...this.userRegistry.users.keys()];
			const index = keys.indexOf(userId);
			if (index === -1) {
				return candidateUserId;
			}
			const userModels = [...this.userRegistry.users.values()].slice(index + 1);
			const totalUserModels = userModels.length;
			for (let i = 0; i < totalUserModels; i++) {
				const userModel = userModels[i];
				if (!userModel.localUser && userModel.state === call_core.UserState.Connected) {
					candidateUserId = userModel.id;
					break;
				}
			}
			return candidateUserId;
		}
		getUserCount() {
			return Object.keys(this.users).length;
		}
		getConnectedUserCount(withYou) {
			let count = this.getConnectedUsers().length;
			if (withYou) {
				const userId = parseInt(this.userId);
				if (!this.broadcastingMode || this.broadcastingPresenters.includes(userId)) {
					count += 1;
				}
			}
			return count;
		}
		getUsersWithVideo() {
			if (this.cache.has('usersWithVideo')) {
				return this.cache.get('usersWithVideo');
			}
			const users = Object.keys(this.users);
			const result = [];
			users.forEach(userId => {
				if (this.users[userId].hasVideo()) {
					result.push(userId);
				}
			});
			this.cache.set('usersWithVideo', result);
			return result;
		}
		getConnectedUsers() {
			if (this.cache.has('currentConnectedUser')) {
				return this.cache.get('currentConnectedUser');
			}
			const result = [];
			const userModels = [...this.userRegistry.users.values()];
			userModels.forEach(userModel => {
				if (userModel.id != this.userId && userModel.state === call_core.UserState.Connected) {
					result.push(userModel.id);
				}
			});
			this.cache.set('previousConnectedUserCount', 0);
			this.cache.set('currentConnectedUser', result);
			return result;
		}
		getDisplayedUsers() {
			const result = [];
			const userModels = [...this.userRegistry.users.values()];
			userModels.forEach(userModel => {
				if (userModel.id != this.userId && (userModel.id != this.centralUser.id && this.layout === Layouts.Centered || this.layout !== Layouts.Centered) && [call_core.UserState.Connected, call_core.UserState.Connecting, call_core.UserState.Calling].includes(userModel.state)) {
					result.push(userModel.id);
				}
			});
			return result;
		}
		getActiveUsers() {
			if (this.cache.has('activeUsers')) {
				return this.cache.get('activeUsers');
			}
			const result = [];
			const userModels = [...this.userRegistry.users.values()];
			userModels.forEach(userModel => {
				if (this.isUserHasActiveState(userModel) && Object.hasOwn(this.users, userModel.id)) {
					result.push(userModel.id);
				}
			});
			this.cache.set('activeUsers', result);
			return result;
		}
		getUsersWithCamera() {
			// since we don't receive streams from inactive pages
			// we can't use this.getUsersWithVideo() to get number of users with video
			return [...this.userRegistry.users.values()].filter(userModel => {
				return userModel.id != this.userId && userModel.cameraState && this.isUserHasActiveState(userModel) && userModel.state !== call_core.UserState.Calling;
			});
		}
		hasUserWithScreenSharing() {
			return [...this.userRegistry.users.values()].some(userModel => userModel.screenState);
		}
		hasCurrentUserScreenSharing() {
			const currentUser = this.userRegistry.get(this.userId);
			if (currentUser) {
				return currentUser.screenState;
			}
			return false;
		}
		getPresenterUserId() {
			let currentPresenterId = this.presenterId || 0;
			if (!this.getConnectedUserCount()) {
				return null;
			}
			if (currentPresenterId == this.localUser.id) {
				currentPresenterId = 0;
			}
			const currentPresenterModel = this.userRegistry.get(currentPresenterId);

			// 1. Current user, who is sharing screen has top priority
			if (currentPresenterModel?.screenState === true) {
				return currentPresenterId;
			}

			// 2. If current user is not sharing screen, but someone is sharing - he should become presenter
			const users = Object.keys(this.users);
			for (const userId of users) {
				if (Object.hasOwn(this.users, userId) && this.userRegistry.get(userId).screenState === true) {
					return parseInt(userId, 10);
				}
			}

			// 3. If current user is talking, or stopped talking less then one second ago - he should stay presenter
			if (currentPresenterModel && currentPresenterModel.wasTalkingAgo() < 1000) {
				return currentPresenterId;
			}

			// 4. Return currently talking user
			let minTalkingAgo = Infinity;
			let minTalkingAgoUserId = 0;
			for (const userId of users) {
				if (!Object.hasOwn(this.users, userId)) {
					continue;
				}
				const userWasTalkingAgo = this.userRegistry.get(userId).wasTalkingAgo();
				if (userWasTalkingAgo < 1000) {
					return parseInt(userId, 10);
				}
				if (userWasTalkingAgo < minTalkingAgo) {
					minTalkingAgo = userWasTalkingAgo;
					minTalkingAgoUserId = parseInt(userId, 10);
				}
			}

			// Return last talking user or current user in center
			return minTalkingAgoUserId || this.centralUser.id;
		}
		switchPresenter(presenterId) {
			const currentPresenterId = this.presenterId || 0;
			const newPresenterId = presenterId || this.getPresenterUserId();
			if (!newPresenterId) {
				return;
			}
			this.presenterId = newPresenterId;
			if (currentPresenterId) {
				this.userRegistry.get(currentPresenterId).presenter = false;
			}
			this.userRegistry.get(newPresenterId).presenter = true;
			if (this.pictureInPictureCallWindow) {
				this.pictureInPictureCallWindow.setCurrentUser(this.getPictureInPictureCallWindowUser());
			}
			if (this.pinnedUser === null) {
				this.setCentralUser(newPresenterId);
			} else if (currentPresenterId !== newPresenterId) {
				this.eventEmitter.emit(EventName.onHasMainStream, {
					userId: this.centralUser.id,
					otherUsers: [currentPresenterId]
				});
			}
		}
		switchPresenterDeferred() {
			clearTimeout(this.switchPresenterTimeout);
			this.switchPresenterTimeout = setTimeout(this.switchPresenter.bind(this), 1000);
		}
		cancelSwitchPresenter() {
			clearTimeout(this.switchPresenterTimeout);
		}
		setUiState(uiState) {
			if (this.uiState == uiState) {
				return;
			}
			this.uiState = uiState;
			if (this.uiState == UiState.Error && this.elements.container) {
				main_core.Dom.clean(this.elements.container);
				this.elements.container.appendChild(this.elements.overlay);
			}
			if (!this.elements.root) {
				return;
			}
			this.updateButtons();
		}
		setLayout(newLayout) {
			if (newLayout == this.layout) {
				return;
			}
			this.layout = newLayout;
			if (this.layout == Layouts.Centered || this.layout == Layouts.Mobile) {
				this.elements.root.classList.remove("bx-messenger-videocall-grid");
				this.elements.root.classList.add("bx-messenger-videocall-centered");
				this.centralUser.mount(this.elements.center);
				this.elements.container.appendChild(this.elements.userBlock);
				if (this.layout != Layouts.Mobile) {
					this.elements.userBlock.appendChild(this.elements.userList.container);
				}
				if (this.layout === Layouts.Centered) {
					this.eventEmitter.emit(EventName.onHasMainStream, {
						userId: this.centralUser.id
					});
				}
				this.centralUser.playVideo();
				//this.centralUser.updateAvatarWidth();
			}
			if (this.layout === Layouts.Grid) {
				this.elements.root.classList.remove('bx-messenger-videocall-centered');
				this.elements.root.classList.add('bx-messenger-videocall-grid');
				this.elements.container.appendChild(this.elements.userList.container);
				this.elements.container.removeChild(this.elements.userBlock);
				this.centralUser.dismount();
				if (this.isFullScreen && this.buttons.participants) {
					this.buttons.participants.update({
						foldButtonState: ParticipantsButton.FoldButtonState.Hidden
					});
				}
				this.unpinUser();
			}
			if (this.layout === Layouts.Centered && this.isFullScreen) {
				this.setUserBlockFolded(true);
			}
			this.elements.root.classList.toggle("bx-messenger-videocall-fullscreen-mobile", this.layout == Layouts.Mobile);
			this.updateUserList();
			this.toggleEars();
			this.updateButtons();
			this.talkingService.refreshQueue();
			this.eventEmitter.emit(EventName.onLayoutChange, {
				layout: this.layout
			});
		}
		setRoomState(roomState) {
			if (this.roomState === roomState) {
				return;
			}
			this.roomState = roomState;
			if (this.buttons.microphone) {
				this.buttons.microphone.setSideIcon(this.getMicrophoneSideIcon(this.roomState));
			}
		}
		getMicrophoneSideIcon(roomState) {
			switch (roomState) {
				case RoomState.Speaker:
					return 'ellipsis';
				case RoomState.NonSpeaker:
					return 'pointer';
				case RoomState.None:
				default:
					return null;
			}
		}
		setCurrentPage(pageNumber) {
			if (pageNumber < 1 || pageNumber > this.pagesCount || pageNumber == this.currentPage) {
				return;
			}
			this.currentPage = pageNumber;
			this.recalculateUsersPerPage();
			if (this.elements.root) {
				this.elements.pageNavigatorLeftCounter.innerHTML = this.currentPage - 1 + '&nbsp;/&nbsp;' + this.pagesCount;
				this.elements.pageNavigatorRightCounter.innerHTML = this.currentPage + 1 + '&nbsp;/&nbsp;' + this.pagesCount;
			}
			if (!(this.layout === Layouts.Grid || this.layout === Layouts.Centered)) {
				return;
			}
			this.renderUserList(true);
			this.toggleEars();
			this.talkingService.refreshQueue();
		}
		calculateUsersPerPage() {
			if (!this.elements.userList) {
				return 1000;
			}
			const containerSize = this.elements.userList.container.getBoundingClientRect();
			let columns = Math.floor(containerSize.width / MIN_GRID_USER_WIDTH) || 1;
			let rows = Math.floor(containerSize.height / MIN_GRID_USER_HEIGHT) || 1;
			if (this.layout === Layouts.Centered) {
				const rowsWithoutGap = Math.floor(containerSize.height / SIDE_USER_HEIGHT) || 1;
				const rowGap = 6;
				this.whiteSpaceInUserGrid = containerSize.height - rowsWithoutGap * SIDE_USER_HEIGHT + (rowsWithoutGap - 1) * rowGap;
				columns = 1;
				rows = this.whiteSpaceInUserGrid < 0 ? rowsWithoutGap - 1 : rowsWithoutGap;
			}
			let usersPerPage = columns * rows - 1;
			if (this.userId == this.centralUser.id && this.layout === Layouts.Centered) {
				usersPerPage += 1;
			}
			if (!usersPerPage) {
				return 1000;
			}
			if (usersPerPage >= MAX_USERS_PER_PAGE) {
				// check if the last row should be filled up
				const elementSize = call_core.Util.findBestElementSize(containerSize.width, containerSize.height, MAX_USERS_PER_PAGE + 1, MIN_GRID_USER_WIDTH, MIN_GRID_USER_HEIGHT);
				// console.log('Optimal element size: width '+elementSize.width+' height '+elementSize.height);
				columns = Math.floor(containerSize.width / elementSize.width);
				rows = Math.floor(containerSize.height / elementSize.height);
				usersPerPage = columns * rows - 1;
			}
			return usersPerPage;
		}
		calculatePagesCount(usersPerPage) {
			const pages = Math.ceil(this.getDisplayedUsers().length / usersPerPage);
			return pages > 0 ? pages : 1;
		}
		recalculateUsersPerPage() {
			this.usersPerPage = this.calculateUsersPerPage();
			if (this.currentPage < this.pagesCount && this.layout === Layouts.Centered && this.whiteSpaceInUserGrid > 0) {
				this.usersPerPage = this.usersPerPage + 1;
			}
		}
		recalculatePages() {
			this.usersPerPage = this.calculateUsersPerPage();
			this.pagesCount = this.calculatePagesCount(this.usersPerPage);
			if (this.currentPage > this.pagesCount) {
				this.currentPage = this.pagesCount;
			}
			this.recalculateUsersPerPage();
			if (this.elements.root) {
				this.elements.pageNavigatorLeftCounter.innerHTML = this.currentPage - 1 + '&nbsp;/&nbsp;' + this.pagesCount;
				this.elements.pageNavigatorRightCounter.innerHTML = this.currentPage + 1 + '&nbsp;/&nbsp;' + this.pagesCount;
			}
		}
		/**
		 * Returns page number, where the user is displayed, or 0 if user is not found
		 * @param {int} userId Id of the user
		 * @return {int}
		 */
		findUsersPage(userId) {
			if (userId == this.userId || this.usersPerPage === 0) {
				return 0;
			}
			const displayedUsers = this.getDisplayedUsers();
			let userPosition = 0;
			for (let i = 0; i < displayedUsers.length; i++) {
				if (displayedUsers[i] == userId) {
					userPosition = i + 1;
					break;
				}
			}
			return userPosition ? Math.ceil(userPosition / this.usersPerPage) : 0;
		}
		setCameraId(cameraId) {
			if (this.cameraId == cameraId) {
				return;
			}
			if (this.localUser.stream && this.localUser.stream.getVideoTracks().length > 0) {
				throw new Error("Can not set camera id while having active stream");
			}
			this.cameraId = cameraId;
		}
		setMicrophoneId(microphoneId) {
			if (this.microphoneId == microphoneId) {
				return;
			}
			if (this.localUser.stream && this.localUser.stream.getAudioTracks().length > 0) {
				throw new Error("Can not set microphone id while having active stream");
			}
			this.microphoneId = microphoneId;
		}
		setMicrophoneLevel(level) {
			this.microphoneLevel = level;
			this.buttons.microphone?.setLevel(level);
		}
		setGuestLink(link) {
			if (this.#guestLink === link) {
				return;
			}
			this.#guestLink = link;
			this.updateButtons();
		}
		setCameraState = event => {
			if (this.isCameraOn == event.data.isCameraOn) {
				return;
			}
			this.isCameraOn = event.data.isCameraOn;
			if (this.buttons.camera) {
				if (this.isCameraOn) {
					this.buttons.camera.enable();
				} else {
					this.buttons.camera.disable();
				}
			}
			if (this.pictureInPictureCallWindow) {
				this.pictureInPictureCallWindow.setButtons(this.getPictureInPictureCallWindowGetButtonsList()).updateButtons();
			}
		};
		setMuted = event => {
			if (this.isMuted == event.data.isMicrophoneMuted) {
				return;
			}
			this.isMuted = event.data.isMicrophoneMuted;
			if (this.buttons.microphone) {
				if (this.isMuted) {
					this.buttons.microphone.disable();
				} else {
					this.buttons.microphone.enable();
				}
			}
			this.userRegistry.get(this.userId).microphoneState = !this.isMuted;
			if (this.pictureInPictureCallWindow) {
				this.pictureInPictureCallWindow.setButtons(this.getPictureInPictureCallWindowGetButtonsList()).updateButtons();
			}
		};
		setLocalUserId(userId) {
			if (userId == this.userId) {
				return;
			}
			this.userId = parseInt(userId);
			this.localUser.userModel.id = this.userId;
			this.localUser.userModel.name = this.userData[this.userId] ? this.userData[this.userId].name : '';
			this.localUser.userModel.avatar = this.userData[this.userId] ? checkAndEncodeURI(this.userData[this.userId].avatar_hr) : '';
			this.userRegistry.push(this.localUser.userModel);
		}
		setUserBlockFolded(isUserBlockFolded) {
			this.isUserBlockFolded = isUserBlockFolded;
			this.elements.userBlock?.classList.toggle("folded", this.isUserBlockFolded);
			this.elements.root?.classList.toggle("bx-messenger-videocall-userblock-folded", this.isUserBlockFolded);
			if (this.isUserBlockFolded) {
				if (this.buttons.participants && this.layout == Layouts.Centered) {
					this.buttons.participants.update({
						foldButtonState: ParticipantsButton.FoldButtonState.Unfold
					});
				}
			} else {
				if (this.buttons.participants) {
					this.buttons.participants.update({
						foldButtonState: this.isFullScreen && this.layout == Layouts.Centered ? ParticipantsButton.FoldButtonState.Fold : ParticipantsButton.FoldButtonState.Hidden
					});
				}
			}
		}
		addUser(userId, state, direction) {
			userId = Number(userId);
			if (this.users[userId]) {
				return;
			}
			state = state || call_core.UserState.Idle;
			if (!direction) {
				if (this.broadcastingPresenters.length > 0 && !this.broadcastingPresenters.includes(userId)) {
					direction = call_core.EndpointDirection.RecvOnly;
				} else {
					direction = call_core.EndpointDirection.SendRecv;
				}
			}
			let userModel = new UserModel({
				id: userId,
				name: this.userData[userId] ? this.userData[userId].name : '',
				avatar: this.userData[userId] ? this.userData[userId].avatar_hr : '',
				state: state,
				order: state == call_core.UserState.Connected ? this.getNextPosition() : newUserPosition,
				direction: direction
			});
			this.userRegistry.push(userModel);
			this.users[userId] = new CallUser({
				userModel,
				parentContainer: this.container,
				allowPinButton: this.getConnectedUserCount() > 1,
				externalSpeakerManagement: this.externalSpeakerManagement,
				onClick: this._onUserClick.bind(this),
				onPin: this._onUserPin.bind(this),
				onUnPin: this._onUserUnPin.bind(this),
				onTurnOffParticipantMic: this._onTurnOffParticipantMic.bind(this),
				onTurnOffParticipantCam: this._onTurnOffParticipantCam.bind(this),
				onTurnOffParticipantScreenshare: this._onTurnOffParticipantScreenshare.bind(this),
				onAudioElementCreated: this.externalSpeakerManagement ? audioElement => {
					main_core.Dom.append(this.elements.audio[userId], this.elements.audioContainer);
					this.eventEmitter.emit(EventName.onAudioElementCreated, {
						userId,
						audioElement
					});
				} : null,
				onAudioPlay: this.externalSpeakerManagement ? audioElement => {
					this.eventEmitter.emit(EventName.onAudioPlay, {
						userId,
						audioElement
					});
				} : null
			});
			userModel.subscribe('changed', this.talkingService.watchTalking);
			this.screenUsers[userId] = new CallUser({
				parentContainer: this.container,
				userModel: userModel,
				allowPinButton: false,
				screenSharingUser: true
			});
			if (this.elements.root && state !== call_core.UserState.Idle) {
				if (state === call_core.UserState.Connected) {
					this.cache.set('previousConnectedUserCount', this.cache.get('currentConnectedUser')?.length || 0);
					this.cache.delete('currentConnectedUser');
					this.cache.delete('activeUsers');
				}
				this._onAddUser();
			}
		}
		setUserDirection(userId, direction) {
			const user = this.userRegistry.get(userId);
			if (!user || user.direction == direction) {
				return;
			}
			user.direction = direction;
			this.updateUserList();
		}
		setLocalUserDirection(direction) {
			if (this.localUser.userModel.direction != direction) {
				this.localUser.userModel.direction = direction;
				this.updateUserList();
			}
		}
		setUserState(userId, newState) {
			const user = this.userRegistry.get(userId);
			if (!user || user.state === newState) {
				return;
			}
			if (user.state === call_core.UserState.Connected || newState === call_core.UserState.Connected) {
				this.cache.set('previousConnectedUserCount', this.cache.get('currentConnectedUser')?.length || 0);
				this.cache.delete('currentConnectedUser');
				this.cache.delete('activeUsers');
			}
			user.state = newState;
			if (newState == call_core.UserState.Idle && user.screenState) {
				user.prevScreenState = user.screenState;
			}
			if (newState === call_core.UserState.Connected && this.uiState === UiState.Calling) {
				this.setUiState(UiState.Connected);
			}

			// maybe switch central user
			if (this.centralUser.id == this.userId && newState == call_core.UserState.Connected) {
				this.setCentralUser(userId);
			} else if (userId == this.centralUser.id) {
				if (newState == call_core.UserState.Connecting || newState == call_core.UserState.Failed) {
					this.centralUser.blurVideo();
				} else if (newState == call_core.UserState.Connected) {
					this.centralUser.blurVideo(false);
				} else if (newState == call_core.UserState.Idle) {
					const usersWithVideo = this.getUsersWithVideo();
					const connectedUsers = this.getConnectedUsers();
					if (connectedUsers.length === 0) {
						this.setCentralUser(this.userId);
					} else if (usersWithVideo.length > 0) {
						this.setCentralUser(usersWithVideo[0]);
					} else
						//if (connectedUsers.length > 0)
						{
							this.setCentralUser(connectedUsers[0]);
						}
				}
			}
			if (newState === call_core.UserState.Connected) {
				const timer = setTimeout(() => {
					this.waitingForUserMediaTimeouts.delete(userId);
				}, WAITING_VIDEO_DELAY);
				this.waitingForUserMediaTimeouts.set(userId, timer);
				if (user.prevScreenState && String(userId) !== String(this.userId)) {
					this.setUserScreenState(userId, user.prevScreenState);
					user.prevScreenState = false;
				}
			} else if (newState === call_core.UserState.Idle) {
				if (this.isVideoconf && this.pictureInPictureCallWindow && Number(this.currentPiPUserId) === Number(userId)) {
					this.currentPiPUserId = null;
					this.pictureInPictureCallWindow.setCurrentUser(this.getPictureInPictureCallWindowUser(this.centralUser.id));
				}
				this.setUserFloorRequestState(userId, false);
				this.setUserPermissionToSpeakState(userId, false);
				clearTimeout(this.waitingForUserMediaTimeouts.get(userId));
				this.waitingForUserMediaTimeouts.delete(userId);
				this.rerenderQueue.set(userId, {
					userId,
					reason: RerenderReason.UserDisconnected
				});
			}
			if (newState == call_core.UserState.Connected && user.order == newUserPosition) {
				user.order = this.getNextPosition();
			} else if (newState == call_core.UserState.Idle) {
				// reset user position to add them in the end after they reconnect
				user.prevOrder = user.order;
				user.order = newUserPosition;
				user.prevCameraState = user.cameraState;
				user.cameraState = false;
			}
			if (userId == this.localUser.id) {
				this.localUser.userModel.cameraState = this.localUser.hasCameraVideo();
			}
			const skippedElementsList = userId === this.localUser.id ? [] : ['panel'];
			if (userId == this.presenterId && newState !== call_core.UserState.Connected) {
				this.switchPresenter();
			}
			this._onUserStateUpdated(skippedElementsList);
		}
		setTitle(title) {
			this.title = title;
		}
		getUserTalking(userId) {
			const user = this.userRegistry.get(userId);
			if (!user) {
				return false;
			}
			return !!user.talking;
		}
		setUserTalking(userId, talking) {
			const user = this.userRegistry.get(userId);
			if (!user) {
				return;
			}
			user.talking = talking;
			if (userId == this.userId) {
				return;
			}
			if (userId == this.presenterId && !talking) {
				this.switchPresenterDeferred();
			} else {
				this.switchPresenter();
			}
		}
		setUserStats(userId, stats, mediaServerId) {
			this.pictureInPictureCallWindow?.setStats(userId, stats);
			if (userId == this.localUser.id) {
				this.localUser.showStats(stats, mediaServerId);
				this.localUserReceivedStats = true;
				this.updateButtons();
				return;
			}
			if (this.users[userId]?.isMounted()) {
				this.users[userId].showStats(stats, mediaServerId);
			}
			if (this.screenUsers[userId]?.isMounted()) {
				this.screenUsers[userId].showStats(stats, mediaServerId);
			}
		}
		setTrackSubscriptionFailed(data) {
			if (this.users[data.participant.userId]) {
				if (data.participant.userId && data.track) {
					this.users[data.participant.userId].showTrackSubscriptionFailed(data.track);
				}
			}
		}
		setUserMicrophoneState(userId, isMicrophoneOn) {
			const user = this.userRegistry.get(userId);
			if (user) {
				user.microphoneState = isMicrophoneOn;
			}
		}
		setUserCameraState(userId, cameraState) {
			const user = this.userRegistry.get(userId);
			if (user) {
				user.cameraState = cameraState;
			}
		}
		setUserVideoPaused(userId, videoPaused) {
			const user = this.userRegistry.get(userId);
			if (user) {
				user.videoPaused = videoPaused;
				user.cameraState = !videoPaused;
				if (!user.videoPaused !== videoPaused) {
					return;
				}
				videoPaused ? this.updateRerenderQueue(userId, RerenderReason.VideoDisabled) : this.updateRerenderQueue(userId, RerenderReason.VideoEnabled);
			}
		}
		getUserFloorRequestState(userId) {
			const user = this.userRegistry.get(userId);
			return user && user.floorRequestState;
		}
		setUserFloorRequestState(userId, userFloorRequestState) {
			const user = this.userRegistry.get(userId);
			if (!user) {
				return;
			}
			if (user.floorRequestState != userFloorRequestState) {
				const userState = user?.state;
				const userActive = userState !== call_core.UserState.Idle && userState !== call_core.UserState.Declined && userState !== call_core.UserState.Unavailable && userState !== call_core.UserState.Busy;
				if (userFloorRequestState && !userActive) {
					return;
				}
				user.floorRequestState = userFloorRequestState;
				this.updateFloorRequestNotifications(user, userFloorRequestState);
				if (userFloorRequestState) {
					this.showFloorRequestNotification(userId);
				}
			}
			if (userId == this.userId) {
				this.setButtonActive('floorRequest', userFloorRequestState);
			}
		}
		setUserPermissionToSpeakState(userId, permissionToSpeakState) {
			const user = this.userRegistry.get(userId);
			if (!user) {
				return;
			}
			if (user.permissionToSpeak !== permissionToSpeakState) {
				const userState = user?.state;
				const userActive = userState !== call_core.UserState.Idle && userState !== call_core.UserState.Declined && userState !== call_core.UserState.Unavailable && userState !== call_core.UserState.Busy;
				if (!userActive) {
					return;
				}
				user.permissionToSpeak = permissionToSpeakState;
			}
		}
		setAllUserPermissionToSpeakState(permissionToSpeakState) {
			this.userRegistry.users.forEach(userModel => {
				userModel.permissionToSpeak = permissionToSpeakState;
			});
		}
		pinUser(userId) {
			if (!(userId in this.users) && userId !== Number(this.userId)) {
				console.error(`User ${userId} is not known`);
				return;
			}
			if (this.pinnedUser && this.userRegistry.users.has(this.pinnedUser.userModel.id)) {
				this.userRegistry.get(this.pinnedUser.userModel.id).pinned = false;
			}
			this.pinnedUser = this.users[userId] || this.localUser;
			this.userRegistry.get(this.pinnedUser.userModel.id).pinned = true;
			this.setCentralUser(userId);
			this.eventEmitter.emit(EventName.onUserPinned, {
				userId
			});
			this.eventEmitter.emit(EventName.onHasMainStream, {
				userId: this.centralUser.id,
				otherUsers: [...this.activeUsers]
			});
		}
		unpinUser() {
			if (this.pinnedUser && this.userRegistry.users.has(this.pinnedUser.userModel.id)) {
				this.userRegistry.get(this.pinnedUser.userModel.id).pinned = false;
			}
			this.pinnedUser = null;
			this.eventEmitter.emit(EventName.onUserPinned, {
				userId: null
			});
			this.eventEmitter.emit(EventName.onHasMainStream, {
				userId: null,
				otherUsers: [...this.activeUsers]
			});
			this.switchPresenterDeferred();
		}
		updateFloorRequestNotifications(userModel, floorRequestState) {
			const indexFloorRequestInList = this.floorRequestNotifications.findIndex(req => req.userModel.id === userModel.id);
			const hasFloorRequestInList = indexFloorRequestInList !== -1;
			const currentUser = this.users[userModel.id];
			const currentUserData = {
				userModel,
				avatarBackgroundColor: currentUser?.avatarBackground || call_core.Util.getAvatarBackground()
			};
			if (floorRequestState && !hasFloorRequestInList) {
				this.floorRequestNotifications.push(currentUserData);
			}
			if (!floorRequestState && hasFloorRequestInList) {
				this.floorRequestNotifications.splice(indexFloorRequestInList, 1);
			}
			this.pictureInPictureCallWindow?.updateFloorRequestState(currentUserData);
		}
		showFloorRequestNotification(userId) {
			const userModel = this.userRegistry.get(userId);
			if (!userModel) {
				return;
			}
			const notification = FloorRequest.create({
				userModel,
				onAllowSpeakPermissionClicked: _userModel => {
					this._onAllowSpeakPermissionClickedHandler(_userModel);
				},
				onDisallowSpeakPermissionClicked: _userModel => {
					this._onDisallowSpeakPermissionClickedHandler(_userModel);
				}
			});
			notification.mount(this.elements.notificationPanel);
			NotificationManager.addNotification(notification);
		}
		updateFloorRequestNotification() {
			if (!NotificationManager.notifications.length) {
				return;
			}
			NotificationManager.notifications.forEach(notification => {
				notification.updatePermissionButtonState();
			});
		}
		_onAllowSpeakPermissionClickedHandler(_userModel) {
			this.setUserPermissionToSpeakState(_userModel.id, true);
			this.eventEmitter.emit(EventName.onAllowSpeakPermission, {
				userId: _userModel.id
			});
		}
		_onDisallowSpeakPermissionClickedHandler(_userModel) {
			this.eventEmitter.emit(EventName.onDisallowSpeakPermission, {
				userId: _userModel.id
			});
		}
		setUserScreenState(userId, screenState) {
			const user = this.userRegistry.get(userId);
			if (!user) {
				return;
			}
			user.screenState = screenState;
			if (userId != this.userId) {
				if (screenState === true && this.layout === View.Layout.Grid) {
					this.setLayout(Layouts.Centered);
					this.returnToGridAfterScreenStopped = true;
				}
				if (screenState === false && this.layout === Layouts.Centered && !this.hasUserWithScreenSharing() && !this.pinnedUser && this.returnToGridAfterScreenStopped) {
					this.returnToGridAfterScreenStopped = false;
					this.setLayout(Layouts.Grid);
				}
				const newPresenterId = screenState ? userId : null;
				this.switchPresenter(newPresenterId);
			}
		}
		flipLocalVideo(flipVideo) {
			this.localUser.flipVideo = !!flipVideo;
		}
		setLocalStream(streamData) {
			const mediaRenderer = streamData.mediaRenderer;
			const mediaStream = streamData.stream;
			const flipVideo = streamData.flipVideo;
			if (mediaRenderer)
				// for Bitrix calls
				{
					this.localUser.videoRenderer = mediaRenderer;
					this.pictureInPictureCallWindow?.setVideoRenderer(this.userId, mediaRenderer);
				} else {
				const videoTrack = mediaStream.getVideoTracks().length > 0 ? mediaStream.getVideoTracks()[0] : null;
				this.localUser.videoTrack = videoTrack;
				this.pictureInPictureCallWindow?.setVideoRenderer(this.userId, new call_core.MediaRenderer({
					kind: 'video',
					track: videoTrack
				}));
			}
			if (!main_core.Type.isUndefined(flipVideo)) {
				this.flipLocalVideo(flipVideo);
			}
			this.localUser.userModel.cameraState = this.localUser.hasCameraVideo();
			const videoTracks = mediaStream?.getVideoTracks();
			if (videoTracks?.length > 0) {
				const videoTrackSettings = videoTracks[0].getSettings();
				this.cameraId = videoTrackSettings.deviceId || '';
			} else if (!mediaRenderer) {
				this.cameraId = '';
			}
			const audioTracks = mediaStream?.getAudioTracks();
			if (audioTracks?.length > 0) {
				const audioTrackSettings = audioTracks[0].getSettings();
				this.microphoneId = audioTrackSettings.deviceId || '';
			}

			/*if(!this.localUser.hasVideo())
			{
				return false;
			}*/

			if (this.layout !== Layouts.Grid && this.centralUser.id == this.userId) {
				if (mediaRenderer)
					// for Bitrix ca;ls
					{
						this.centralUser.videoRenderer = mediaRenderer;
					} else if (videoTracks.length > 0 || Object.keys(this.users).length === 0) {
					this.centralUser.videoTrack = videoTracks[0];
				} else {
					this.setCentralUser(Object.keys(this.users)[0]);
				}
			} else {
				this.updateUserList();
			}
			this.updateButtons();
		}
		setLocalStreamVideoTrack(videoTrack) {
			this.localStreamVideoTrack = videoTrack;
			this.pictureInPictureCallWindow?.setVideoRenderer(this.userId, new call_core.MediaRenderer({
				kind: 'sharing',
				track: videoTrack
			}));
		}
		setSpeakerId(speakerId) {
			if (this.speakerId === speakerId && this.speakerId !== undefined) {
				return;
			}
			if (!('setSinkId' in HTMLMediaElement.prototype)) {
				console.error("Speaker selection is not supported");
			}
			this.speakerId = speakerId;
			for (const userId in this.elements.audio) {
				this.elements.audio[userId].setSinkId(this.speakerId);
			}
			for (const userId in this.elements.screenAudio) {
				this.elements.screenAudio[userId].setSinkId(this.speakerId);
			}
		}
		muteSpeaker(mute) {
			this.speakerMuted = Boolean(mute);
			const volume = this.speakerMuted ? 0 : 1;
			for (const userId in this.elements.audio) {
				this.elements.audio[userId].volume = volume;
			}
			for (const userId in this.elements.screenAudio) {
				this.elements.screenAudio[userId].volume = volume;
			}
			if (!this.buttons.speaker) {
				return;
			}
			if (this.speakerMuted) {
				this.buttons.speaker.disable();
				this.buttons.speaker.hideArrow();
			} else {
				this.buttons.speaker.enable();
				if (call_core.Hardware.canSelectSpeaker()) {
					this.buttons.speaker.showArrow();
				}
			}
		}
		updateRerenderQueue(userId, reason) {
			if (!this.users[userId]) {
				throw Error("User " + userId + " is not a part of this call");
			}
			if (reason === RerenderReason.VideoEnabled) {
				if (this.rerenderQueue.get(userId)?.reason === RerenderReason.VideoDisabled) {
					this.rerenderQueue.delete(userId);
					if (!this.rerenderQueue.size) {
						clearTimeout(this.rerenderTimeout);
						this.rerenderTimeout = null;
					}
				} else {
					if (this.waitingForUserMediaTimeouts.has(userId)) {
						clearTimeout(this.waitingForUserMediaTimeouts.get(userId));
						this.waitingForUserMediaTimeouts.delete(userId);
						this.rerenderQueue.set(userId, {
							userId,
							reason: RerenderReason.VideoEnabled
						});
						this.renderUserList();
					} else {
						if (!this.rerenderTimeout) {
							this.rerenderTimeout = setTimeout(() => {
								this.renderUserList();
							}, this.videoRerenderDelay);
						}
						this.rerenderQueue.set(userId, {
							userId,
							reason: RerenderReason.VideoEnabled
						});
					}
				}
			} else if (reason === RerenderReason.VideoDisabled) {
				if (this.rerenderQueue.get(userId)?.reason === RerenderReason.VideoEnabled) {
					this.rerenderQueue.delete(userId);
					if (!this.rerenderQueue.size) {
						clearTimeout(this.rerenderTimeout);
						this.rerenderTimeout = null;
					}
				} else {
					if (!this.rerenderTimeout) {
						this.rerenderTimeout = setTimeout(() => {
							this.renderUserList();
						}, this.videoRerenderDelay);
					}
					this.rerenderQueue.set(userId, {
						userId,
						reason: RerenderReason.VideoDisabled
					});
				}
			}
		}
		trackAvailabilityChanged(userId, kind, available) {
			const user = this.users[userId];
			if (!user) {
				console.warn(`User ${userId} is not a part of this call`);
				return;
			}
			const userModel = this.userRegistry.get(userId);
			if (kind === 'video' && available) {
				userModel.cameraState = true;
				this.updateRerenderQueue(userId, RerenderReason.VideoEnabled);
			} else if (kind === 'video' && !available) {
				userModel.cameraState = false;
				this.updateRerenderQueue(userId, RerenderReason.VideoDisabled);
			}
		}
		setVideoRenderer(userId, mediaRenderer) {
			const user = this.users[userId];
			if (!user) {
				throw Error(`User ${userId} is not a part of this call`);
			}
			this.cache.delete('usersWithVideo');
			const userModel = this.userRegistry.get(userId);
			const userHasCameraVideo = userModel.cameraState;
			if (!('render' in mediaRenderer) || !main_core.Type.isFunction(mediaRenderer.render)) {
				throw Error('mediaRenderer should have method render');
			}
			if (!('kind' in mediaRenderer) || mediaRenderer.kind !== 'video' && mediaRenderer.kind !== 'sharing') {
				throw Error('mediaRenderer should be of video kind');
			}
			user.videoRenderer = mediaRenderer;
			this.pictureInPictureCallWindow?.setVideoRenderer(userId, mediaRenderer);
			if (mediaRenderer.stream && mediaRenderer.kind === 'video' && !userHasCameraVideo) {
				userModel.cameraState = true;
				this.updateRerenderQueue(userId, RerenderReason.VideoEnabled);
			} else if (!mediaRenderer.stream && mediaRenderer.kind === 'video' && userHasCameraVideo) {
				userModel.cameraState = false;
				this.updateRerenderQueue(userId, RerenderReason.VideoDisabled);
			}
			if (this.centralUser.id == userId) {
				this.eventEmitter.emit(EventName.onHasMainStream, {
					userId: this.centralUser.id
				});
			}
		}
		setUserMedia(userId, kind, track) {
			const user = this.users[userId];
			if (!user) {
				return;
			}
			switch (kind) {
				case 'audio':
					if (!this.elements.audio[userId]) {
						this.elements.audio[userId] = main_core.Dom.create('audio');
						if (this.externalSpeakerManagement) {
							this.elements.audio[userId].playsInline = true;
						} else {
							main_core.Dom.append(this.elements.audio[userId], this.elements.audioContainer);
						}
						user.audioElement = this.elements.audio[userId];
					}
					this.elements.audio[userId].volume = this.speakerMuted ? 0 : 1;
					user.audioTrack = track;

					// todo: Check this logic later. For now it's disabled
					// to avoid conflicts with another render RerenderReason.VideoEnabled
					// this.rerenderQueue.set(userId, {
					// 	userId,
					// 	reason: RerenderReason.VoiceStarted,
					// });
					// this.renderUserList();
					break;
				case 'sharingAudio':
					if (!this.elements.screenAudio[userId]) {
						this.elements.screenAudio[userId] = main_core.Dom.create('audio');
						main_core.Dom.append(this.elements.screenAudio[userId], this.elements.audioContainer);
						user.screenAudioElement = this.elements.screenAudio[userId];
					}
					this.elements.screenAudio[userId].volume = this.speakerMuted ? 0 : 1;
					user.screenAudioTrack = track;
					break;
				case 'video':
					user.videoTrack = track;
					this.pictureInPictureCallWindow?.setVideoRenderer(userId, new call_core.MediaRenderer({
						track,
						kind: 'video'
					}));
					break;
				case 'screen':
					this.screenUsers[userId].videoTrack = track;
					this.pictureInPictureCallWindow?.setVideoRenderer(userId, new call_core.MediaRenderer({
						track,
						kind: 'sharing'
					}));
					this.updateUserList();
					this.setUserScreenState(userId, track !== null);
					break;
			}
		}
		removeScreenUsers() {
			for (let userId in this.screenUsers) {
				this.screenUsers[userId].videoTrack = null;
			}
			this.updateUserList();
		}
		setBadNetworkIndicator(userId, badNetworkIndicator) {
			if (this.users[userId]) {
				this.users[userId].badNetworkIndicator = badNetworkIndicator;
			}
		}
		setUserHasConnectionProblem(userId, hasConnectionProblem) {
			if (this.users[userId]) {
				this.users[userId].hasConnectionProblem = hasConnectionProblem;
			}
		}
		setUserConnectionQuality(userId, connectionQuality) {
			if (this.users[userId]) {
				this.users[userId].connectionQuality = connectionQuality;
			}
			if (this.localUser.id === userId) {
				this.localUser.connectionQuality = connectionQuality;
			}
		}
		applyIncomingVideoConstraints(activeUsers, inactiveUsers) {
			let users = [];
			let videoWidth = this.userSize.width;
			if (this.layout === Layouts.Grid) {
				users = activeUsers.map(userId => {
					return {
						userId,
						videoWidth
					};
				});
			} else if (this.layout === Layouts.Centered) {
				const containerSize = this.elements.center.getBoundingClientRect();
				users = [];
				activeUsers.forEach(userId => {
					videoWidth = this.centralUser.id == userId ? Math.floor(containerSize.width) : SIDE_USER_WIDTH;
					users.push({
						userId,
						videoWidth
					});
				});
			}
			this.toggleSubscribingVideoInRenderUserList(users, true);
			users = inactiveUsers.map(userId => {
				return {
					userId
				};
			});
			this.toggleSubscribingVideoInRenderUserList(users, false);
		}
		getDefaultCommonRecordState() {
			return {
				state: call_core.CallCommonRecordState.Stopped,
				type: call_core.CallCommonRecordType.None,
				userId: 0,
				date: {
					start: null,
					pause: []
				}
			};
		}
		setCommonRecordState(commonRecordState) {
			this.commonRecordState = commonRecordState;
			if (this.buttons.recordStatus) {
				this.buttons.recordStatus.update(this.commonRecordState);
			}
			if (this.commonRecordState.userId != this.userId) {
				if ([call_core.CallCommonRecordState.Stopped, call_core.CallCommonRecordState.Destroyed].includes(this.commonRecordState.state)) {
					this.unblockButtons(['record']);
				} else {
					this.blockButtons(['record']);
				}
			}
			if (this.elements.topPanel) {
				if ([call_core.CallCommonRecordState.Stopped, call_core.CallCommonRecordState.Destroyed].includes(this.commonRecordState.state)) {
					delete this.elements.topPanel.dataset.recordState;
				} else {
					this.elements.topPanel.dataset.recordState = commonRecordState.state;
				}
			}
		}
		show() {
			if (!this.elements.root) {
				this.render();
			}
			this.container.appendChild(this.elements.root);
			if (this.layout !== Layouts.Mobile) {
				this.startIntersectionObserver();
			}
			this.updateButtons();
			this.updateUserList();
			this.resumeVideo();
			this.toggleEars();
			this.visible = true;
			this.eventEmitter.emit(EventName.onShow);

			// We specifically disable the face improve feature to improve call quality.
			this.disableFaceImprove();
			this.checkPanelOverflow();
		}
		hide() {
			this.closeCopilotNotify();
			this.clearCallcontrolPromo();
			if (this.overflownButtonsPopup) {
				this.overflownButtonsPopup.close();
			}
			main_core.Dom.remove(this.elements.root);
			this.visible = false;
		}
		startIntersectionObserver() {
			if (!('IntersectionObserver' in window)) {
				return;
			}
			this.intersectionObserver = new IntersectionObserver(this._onIntersectionChange.bind(this), {
				root: this.elements.userList.container,
				threshold: 0.5
			});
		}
		/**
		 * @param {CallUser} callUser
		 */
		observeIntersections(callUser) {
			if (this.intersectionObserver && callUser.elements.root) {
				this.intersectionObserver.observe(callUser.elements.root);
			}
		}
		/**
		 * @param {CallUser} callUser
		 */
		unobserveIntersections(callUser) {
			if (this.intersectionObserver && callUser.elements.root) {
				this.intersectionObserver.unobserve(callUser.elements.root);
			}
		}
		showDeviceSelector(bindElement) {
			if (this.deviceSelector) {
				return;
			}
			this.deviceSelector = new DeviceSelector({
				viewElement: this.container,
				parentElement: bindElement,
				zIndex: this.baseZIndex + 500,
				microphoneEnabled: !call_core.Hardware.isMicrophoneMuted,
				microphoneId: this.microphoneId || call_core.Hardware.defaultMicrophone,
				cameraEnabled: call_core.Hardware.isCameraOn,
				cameraId: this.cameraId,
				speakerEnabled: !this.speakerMuted,
				speakerId: this.speakerId,
				allowNoiseSuppression: call_core.Hardware.enableNoiseSuppression,
				faceImproveEnabled: call_core.Util.isDesktop() && im_v2_lib_desktopApi.DesktopApi.isDesktop() && im_v2_lib_desktopApi.DesktopApi.getCameraSmoothingStatus(),
				allowFaceImprove: false,
				allowBackground: call_core.BackgroundDialog.isAvailable() && this.isIntranetOrExtranet,
				allowMask: call_core.BackgroundDialog.isMaskAvailable() && this.isIntranetOrExtranet,
				allowAdvancedSettings: typeof BXIM !== 'undefined' && this.isIntranetOrExtranet,
				switchCameraBlocked: this.blockedButtons['camera'],
				switchMicrophoneBlocked: this.blockedButtons['microphone'],
				events: {
					[DeviceSelector.Events.onMicrophoneSelect]: this._onMicrophoneSelected.bind(this),
					[DeviceSelector.Events.onMicrophoneSwitch]: this._onMicrophoneButtonClick.bind(this),
					[DeviceSelector.Events.onCameraSelect]: this._onCameraSelected.bind(this),
					[DeviceSelector.Events.onCameraSwitch]: this._onCameraButtonClick.bind(this),
					[DeviceSelector.Events.onSpeakerSelect]: this._onSpeakerSelected.bind(this),
					[DeviceSelector.Events.onSpeakerSwitch]: this._onSpeakerButtonClick.bind(this),
					[DeviceSelector.Events.onChangeNoiseSuppression]: this._onChangeNoiseSuppression.bind(this),
					[DeviceSelector.Events.onChangeMicAutoParams]: this._onChangeMicAutoParams.bind(this),
					[DeviceSelector.Events.onChangeFaceImprove]: this._onChangeFaceImprove.bind(this),
					[DeviceSelector.Events.onChangeVideoQuality]: this._onChangeVideoQuality.bind(this),
					[DeviceSelector.Events.onAdvancedSettingsClick]: () => this.eventEmitter.emit(EventName.onOpenAdvancedSettings),
					[DeviceSelector.Events.onDestroy]: () => {
						this.buttons?.microphone.elements.arrow?.classList.remove('rotate');
						this.buttons?.camera.elements.arrow?.classList.remove('rotate');
						this.deviceSelector = null;
					},
					[DeviceSelector.Events.onShow]: () => this.eventEmitter.emit(EventName.onDeviceSelectorShow, {})
				}
			});
			this.deviceSelector.show();
		}
		showCallMenu() {
			let menuItems = [{
				text: BX.message("IM_M_CALL_BTN_WANT_TO_SAY"),
				iconClass: "hand",
				onClick: this._onMobileCallMenuFloorRequestClick.bind(this)
			}, {
				text: BX.message("IM_M_CALL_MOBILE_MENU_PARTICIPANTS_LIST"),
				iconClass: "participants",
				onClick: this._onMobileCallMenShowParticipantsClick.bind(this)
			},
			// TODO:
			/*{
				text: "Add participant",
				iconClass: "add-participant",
				onClick: function() {}
			},*/

			/*{ //DEBUG: mobile audio
				text: "Enable audio",
				iconClass: "",
				onClick: function() {
					for (var userId in this.elements.audio)
					{
						if (this.users[userId].stream)
						{
							console.log('user ' + userId + ' stream found, trying to play');
							this.elements.audio[userId].srcObject = this.users[userId].stream;
							this.elements.audio[userId].play();
						}
					}
					this.callMenu.close();
				}.bind(this)
			},*/
			{
				text: BX.message("IM_M_CALL_MOBILE_MENU_COPY_INVITE"),
				iconClass: "add-participant",
				onClick: this._onMobileCallMenuCopyInviteClick.bind(this)
			}, !this.isIntranetOrExtranet ? {
				text: BX.message("IM_M_CALL_MOBILE_MENU_CHANGE_MY_NAME"),
				iconClass: "change-name",
				onClick: () => {
					this.callMenu.close();
					setTimeout(this.showRenameSlider.bind(this), 100);
				}
			} : null, {
				separator: true
			}, {
				text: BX.message("IM_M_CALL_MOBILE_MENU_CANCEL"),
				enabled: false,
				onClick: this._onMobileCallMenuCancelClick.bind(this)
			}];
			this.callMenu = new MobileMenu({
				parent: this.elements.root,
				items: menuItems,
				onClose: () => this.callMenu.destroy(),
				onDestroy: () => this.callMenu = null
			});
			this.callMenu.show();
		}
		showUserMenu(userId) {
			const userModel = this.userRegistry.get(userId);
			if (!userModel) {
				return false;
			}
			let pinItem = null;
			if (this.pinnedUser && this.pinnedUser.id == userId) {
				pinItem = {
					text: BX.message("IM_M_CALL_MOBILE_MENU_UNPIN"),
					iconClass: "unpin",
					onClick: () => {
						this.userMenu.close();
						this.unpinUser();
					}
				};
			} else if (this.userId != userId) {
				pinItem = {
					text: BX.message("IM_M_CALL_MOBILE_MENU_PIN"),
					iconClass: "pin",
					onClick: () => {
						this.userMenu.close();
						this.pinUser(userId);
					}
				};
			}
			let menuItems = [{
				userModel: userModel,
				enabled: false
			}, {
				separator: true
			}, pinItem, this.userId == userId && !this.isIntranetOrExtranet ? {
				text: BX.message("IM_M_CALL_MOBILE_MENU_CHANGE_MY_NAME"),
				iconClass: "change-name",
				onClick: () => {
					this.userMenu.close();
					setTimeout(this.showRenameSlider.bind(this), 100);
				}
			} : null,
			/*{
				text: BX.message("IM_M_CALL_MOBILE_MENU_WRITE_TO_PRIVATE_CHAT"),
				iconClass: "private-chat",
				onClick: function()
				{
					this.userMenu.close();
					this.eventEmitter.emit(EventName.onButtonClick, {
						})
				}.bind(this)
			},*/
			/*{
				// TODO:
				text: "Remove user",
				iconClass: "remove-user"
			},*/
			{
				separator: true
			}, {
				text: BX.message("IM_M_CALL_MOBILE_MENU_CANCEL"),
				enabled: false,
				onClick: () => this.userMenu.close()
			}];
			this.userMenu = new MobileMenu({
				parent: this.elements.root,
				items: menuItems,
				onClose: () => this.userMenu.destroy(),
				onDestroy: () => this.userMenu = null
			});
			this.userMenu.show();
		}
		showParticipantsMenu() {
			if (this.participantsMenu) {
				return;
			}
			const menuItems = [{
				userModel: this.localUser.userModel,
				showSubMenu: true,
				onClick: () => {
					this.participantsMenu.close();
					this.showUserMenu(this.localUser.userModel.id);
				}
			}];
			[...this.userRegistry.users.values()].forEach(userModel => {
				if (userModel.localUser || userModel.state !== call_core.UserState.Connected) {
					return;
				}
				if (menuItems.length > 0) {
					menuItems.push({
						separator: true
					});
				}
				menuItems.push({
					userModel,
					showSubMenu: true,
					onClick: () => {
						this.participantsMenu.close();
						this.showUserMenu(userModel.id);
					}
				});
			});
			if (menuItems.length === 0) {
				return false;
			}
			this.participantsMenu = new MobileMenu({
				parent: this.elements.root,
				items: menuItems,
				header: BX.message('IM_M_CALL_PARTICIPANTS').replace('#COUNT#', this.getConnectedUserCount(true)),
				largeIcons: true,
				onClose: () => {
					this.participantsMenu.destroy();
				},
				onDestroy: () => {
					this.participantsMenu = null;
				}
			});
			this.participantsMenu.show();
			return true;
		}

		/**
		 * @param {Object} params
		 * @param {string} params.text
		 * @param {string} [params.subText]
		 */
		showMessage(params) {
			const statusNode = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-user-status bx-messenger-videocall-user-status-wide'
				}
			});
			if (main_core.Type.isStringFilled(params.text)) {
				const textNode = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-status-text'
					},
					text: params.text
				});
				main_core.Dom.append(textNode, statusNode);
			}
			this.#showErrorLayout(statusNode);
		}
		hideMessage() {
			this.elements.overlay.textContent = '';
		}
		renderSelfTestCallLayout() {
			const errorContainer = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-error-container'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-error-container-icon-alert'
					}
				}), main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-error-message'
					},
					text: main_core.Loc.getMessage('CALL_CONNECTED_ERROR')
				}), main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-error-button-self-test'
					},
					text: main_core.Loc.getMessage('CALL_RUN_SELF_TEST'),
					events: {
						click: () => {
							call_core.Util.startSelfTest();
						}
					}
				})]
			});
			this.#showErrorLayout(errorContainer);
		}
		renderReloadPageLayout() {
			const errorContainer = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-error-container'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-error-container-icon-alert'
					}
				}), main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-error-message'
					},
					html: main_core.Loc.getMessage('CALL_SECURITY_KEY_CHANGED', {
						'[break]': '<br/>'
					})
				}), main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-error-button-self-test'
					},
					text: main_core.Loc.getMessage('CALL_RELOAD_PAGE'),
					events: {
						click: () => {
							this.destroy();
							location.reload();
						}
					}
				})]
			});
			this.#showErrorLayout(errorContainer);
		}
		#showErrorLayout(content) {
			if (!this.elements.root) {
				this.render();
				main_core.Dom.append(this.elements.root, this.container);
			}
			if (this.elements.overlay.childElementCount) {
				main_core.Dom.clean(this.elements.overlay);
			}
			main_core.Dom.append(content, this.elements.overlay);
		}

		/**
		 * @param {Object} params
		 * @param {string} params.text
		 * @param {string} [params.subText]
		 */
		showFatalError(params) {
			this.showMessage(params);
			this.#prepareErrorState();
		}
		showSecurityKeyError() {
			this.renderReloadPageLayout();
			this.#prepareErrorState();
		}
		showSelfTest() {
			this.renderSelfTestCallLayout();
			this.#prepareErrorState();
		}
		#prepareErrorState() {
			this.setUiState(UiState.Error);
			// in some cases video elements may still be shown on the error screen, let's hide them
			main_core.Dom.style(this.elements.userList.container, 'display', 'none');
		}
		close() {
			if (this.buttons.recordStatus) {
				this.buttons.recordStatus.stopViewUpdate();
			}
			this.commonRecordState = this.getDefaultCommonRecordState();
			if (this.elements.root) {
				BX.remove(this.elements.root);
			}
			if (this.pictureInPictureCallWindow) {
				this.toggleStatePictureInPictureCallWindow(false);
			}
			this.visible = false;
			this.eventEmitter.emit(EventName.onClose);
			this.clearCallcontrolPromo();
		}
		setSize(size) {
			if (this.size == size) {
				return;
			}
			this.size = size;
			if (this.size == Size.Folded) {
				this.clearCallcontrolPromo();
				if (this.overflownButtonsPopup) {
					this.overflownButtonsPopup.close();
				}
				if (this.elements.panel) {
					this.elements.panel.classList.add('bx-messenger-videocall-panel-folded');
				}
				main_core.Dom.remove(this.elements.container);
				main_core.Dom.remove(this.elements.topPanel);
				this.elements.root.style.removeProperty('max-width');
				this.updateButtons();
			} else {
				if (this.elements.panel) {
					this.elements.panel.classList.remove('bx-messenger-videocall-panel-folded');
				}
				this.elements.wrap.appendChild(this.elements.topPanel);
				this.elements.wrap.appendChild(this.elements.container);
				if (this.maxWidth > 0) {
					this.elements.root.style.maxWidth = Math.max(this.maxWidth, MIN_WIDTH) + 'px';
				}
				this.updateButtons();
				this.updateUserList();
				this.resumeVideo();
			}
			if (this.pictureInPictureCallWindow) {
				this.pictureInPictureCallWindow.setButtons(this.getPictureInPictureCallWindowGetButtonsList()).updateButtons();
			}
		}
		isButtonBlocked(buttonName) {
			switch (buttonName) {
				case 'camera':
					return this.#isCameraButtonBlocked();
				case 'chat':
					return !this.showChatButtons || this.blockedButtons[buttonName] === true;
				case 'microphone':
					return !call_core.Util.havePermissionToBroadcast('mic');
				case 'floorRequest':
					return this.uiState !== UiState.Connected || this.blockedButtons[buttonName] === true;
				case 'screen':
					return !this.showShareButton || !this.isScreenSharingSupported() || this.isFullScreen || this.blockedButtons[buttonName] === true || !call_core.Util.havePermissionToBroadcast('screenshare');
				case 'users':
					return !this.showUsersButton || this.blockedButtons[buttonName] === true;
				case 'record':
					return !this.showRecordButton || this.blockedButtons[buttonName] === true;
				case 'document':
					return !this.showDocumentButton || this.blockedButtons[buttonName] === true;
				case 'copilot':
					return !this.showCopilotButton || this.blockedButtons[buttonName] === true;
				default:
					return this.blockedButtons[buttonName] === true;
			}
		}
		isButtonHidden(buttonName) {
			return this.hiddenButtons[buttonName] === true;
		}
		showButton(buttonCode) {
			this.showButtons([buttonCode]);
		}
		hideButton(buttonCode) {
			this.hideButtons([buttonCode]);
		}
		#isCameraButtonBlocked() {
			const isForceBlock = this.blockedButtons.camera === true;
			const noCamPermission = !call_core.Util.havePermissionToBroadcast('cam');
			const isUserConnecting = this.localUser.userModel.state === call_core.UserState.Connecting;
			return isForceBlock || noCamPermission || isUserConnecting;
		}

		/**
		 * @return {bool} Returns true if buttons update is required
		 */
		checkPanelOverflow() {
			const delta = this.elements.panel.scrollWidth - this.elements.panel.offsetWidth;
			const mediumButtonMinWidth = this.layout === Layouts.Mobile ? 60 : 66; // todo: move to constants maybe? or maybe even calculate dynamically somehow?
			if (delta > 0) {
				let countOfButtonsToHide = Math.ceil(delta / mediumButtonMinWidth) + 1;
				const buttons = this.getButtonList();
				for (let i = buttons.length - 1; i >= 0; i--) {
					if (buttons[i] === 'hangupOptions' || buttons[i] === 'hangup' || buttons[i] === 'close' || buttons[i] === 'more') {
						continue;
					}
					this.overflownButtons[buttons[i]] = true;
					countOfButtonsToHide -= 1;
					if (!countOfButtonsToHide) {
						break;
					}
				}
				return true;
			} else {
				const hiddenButtonsCount = Object.keys(this.overflownButtons).length;
				if (hiddenButtonsCount > 0) {
					const unusedPanelSpace = this.calculateUnusedPanelSpace();
					if (unusedPanelSpace > 320) {
						let countOfButtonsToShow = Math.min(Math.floor(unusedPanelSpace / mediumButtonMinWidth), hiddenButtonsCount);
						let buttonsLeftHidden = hiddenButtonsCount - countOfButtonsToShow;
						if (buttonsLeftHidden === 1) {
							countOfButtonsToShow += 1;
						}
						if (countOfButtonsToShow == hiddenButtonsCount) {
							// show all buttons;
							this.overflownButtons = {};
						} else {
							for (let i = 0; i < countOfButtonsToShow; i++) {
								delete this.overflownButtons[Object.keys(this.overflownButtons)[0]];
							}
						}
						return true;
					}
				}
			}
			return false;
		}
		/**
		 * @param {string[]} buttons Array of buttons names to show
		 */
		showButtons(buttons) {
			if (!main_core.Type.isArray(buttons)) {
				console.error("buttons should be array");
			}
			buttons.forEach(buttonName => {
				if (this.hiddenButtons.hasOwnProperty(buttonName)) {
					delete this.hiddenButtons[buttonName];
				}
			});
			this.updateButtons();
		}
		/**
		 * @param {string[]} buttons Array of buttons names to hide
		 */
		hideButtons(buttons) {
			if (!main_core.Type.isArray(buttons)) {
				console.error("buttons should be array");
			}
			buttons.forEach(buttonName => this.hiddenButtons[buttonName] = true);
			this.updateButtons();
		}
		blockAddUser() {
			this.blockButtons(['add']);
			if (this.elements.userList.addButton) {
				main_core.Dom.remove(this.elements.userList.addButton);
			}
		}
		unblockAddUser() {
			this.unblockButtons(['add']);
			this.updateButtons();
		}
		blockUsersButton() {
			this.blockButtons(['users']);
			this.updateButtons();
		}
		unblockUsersButton() {
			this.unblockButtons(['users']);
			this.updateButtons();
		}
		blockSwitchCamera() {
			this.blockButtons(['camera']);
			if (this.deviceSelector) {
				this.deviceSelector.toggleCameraAvailability(false);
			}
		}
		unblockSwitchCamera() {
			this.unblockButtons(['camera']);
			if (this.deviceSelector) {
				this.deviceSelector.toggleCameraAvailability(true);
			}
		}
		blockSwitchMicrophone() {
			this.blockButtons(['microphone']);
			if (this.deviceSelector) {
				this.deviceSelector.toggleMicrophoneAvailability(false);
			}
		}
		unblockSwitchMicrophone() {
			this.unblockButtons(['microphone']);
			if (this.deviceSelector) {
				this.deviceSelector.toggleMicrophoneAvailability(true);
			}
		}
		blockScreenSharing() {
			this.blockButtons(['screen']);
		}
		blockHistoryButton() {
			this.blockButtons(['history']);
		}
		/**
		 * @param {string[]} buttons Array of buttons names to block
		 */

		blockButtons(buttons) {
			if (!main_core.Type.isArray(buttons)) {
				console.error("buttons should be array ");
			}
			buttons.forEach(buttonName => {
				this.blockedButtons[buttonName] = true;
				if (this.buttons[buttonName]) {
					this.buttons[buttonName].setBlocked(true);
				}
			});
			if (this.pictureInPictureCallWindow) {
				this.pictureInPictureCallWindow.updateBlockButtons(this.getBlockedButtonsListPictureInPictureCallWindow()).updateButtons();
			}
		}
		/**
		 * @param {string[]} buttons Array of buttons names to unblock
		 */
		unblockButtons(buttons) {
			if (!main_core.Type.isArray(buttons)) {
				console.error("buttons should be array");
			}
			buttons.forEach(buttonName => {
				delete this.blockedButtons[buttonName];
				if (this.buttons[buttonName]) {
					this.buttons[buttonName].setBlocked(this.isButtonBlocked(buttonName));
				}
			});
			if (this.pictureInPictureCallWindow) {
				this.pictureInPictureCallWindow.updateBlockButtons(this.getBlockedButtonsListPictureInPictureCallWindow()).updateButtons();
			}
		}
		disableMediaSelection() {
			this.mediaSelectionBlocked = true;
		}
		enableMediaSelection() {
			this.mediaSelectionBlocked = false;
			if (this.buttons.microphone && this.isMediaSelectionAllowed()) {
				this.buttons.microphone.showArrow();
			}
			if (this.buttons.camera && this.isMediaSelectionAllowed()) {
				this.buttons.camera.showArrow();
			}
		}
		isMediaSelectionAllowed() {
			return this.layout != Layouts.Mobile && (this.uiState == UiState.Preparing || this.uiState == UiState.Connected) && !this.mediaSelectionBlocked && !this.isFullScreen;
		}
		getButtonList() {
			let result = [];
			if (this.uiState === UiState.Error) {
				result.push('close');
			}
			if (this.uiState === UiState.Initializing) {
				result.push('hangup');
			}
			if (this.size === Size.Folded) {
				result.push('title', 'spacer', 'returnToCall', 'hangup');
			}
			if (result.length > 0) {
				this.needToRerenderButtonList = this.previousButtonList.toString() !== result.toString();
				this.previousButtonList = result;
				return result;
			}
			result.push('microphone', 'camera');
			if (this.layout != Layouts.Mobile) {
				result.push('speaker');
			} else {
				result.push('mobileMenu');
			}
			const bottomCenterMenuIsVisible = this.uiState === UiState.Initializing || this.uiState === UiState.Calling || this.uiState === UiState.Connected || this.uiState === UiState.Error;
			if (bottomCenterMenuIsVisible) {
				result.push('chat');
			}
			if (this.layout !== Layouts.Mobile) {
				result.push('users');
			}
			if (this.layout != Layouts.Mobile && bottomCenterMenuIsVisible) {
				result.push('floorRequest', 'screen', 'record', 'document');
			}
			if (this.layout !== Layouts.Mobile && call_core.CallAI.serviceEnabled && bottomCenterMenuIsVisible) {
				result.push('copilot');
			}
			result = result.filter(buttonCode => {
				return !Object.prototype.hasOwnProperty.call(this.hiddenButtons, buttonCode) && !Object.prototype.hasOwnProperty.call(this.overflownButtons, buttonCode);
			});
			if (Object.keys(this.overflownButtons).length > 0 && bottomCenterMenuIsVisible) {
				result.push('more');
			}
			if (this.uiState == UiState.Preparing) {
				result.push('close');
			} else {
				result.push('hangup');
			}
			if (!Object.prototype.hasOwnProperty.call(this.hiddenButtons, 'hangupOptions') && this.isIntranetOrExtranet) {
				result.push('hangupOptions');
			}
			this.needToRerenderButtonList = this.previousButtonList.toString() !== result.toString();
			this.previousButtonList = result;
			return result;
		}
		getTopButtonList() {
			let result = [];
			if (this.layout == Layouts.Mobile) {
				return ['participantsMobile'];
			}
			result.push('watermark');
			result.push('protected');
			result.push('recordStatus');
			result.push('spacer');
			if (this.uiState === UiState.Connected && this.layout != Layouts.Mobile) {
				result.push('grid');
			}
			if (this.uiState != UiState.Preparing && this.isFullScreenSupported() && this.layout != Layouts.Mobile) {
				result.push('fullscreen');
			}
			if (this.uiState === UiState.Connected && this.layout != Layouts.Mobile) {
				result.push('feedback');
			}
			if (this.uiState === UiState.Connected && this.layout !== Layouts.Mobile && this.#guestLink !== null) {
				result.push('link');
			}
			if (this.uiState === UiState.Connected && this.layout != Layouts.Mobile && call_core.Util.canControlChangeSettings() && call_core.Util.isUserControlFeatureEnabled()) {
				result.push('callcontrol');
			}
			if (this.uiState != UiState.Preparing) {
				result.push('participants');
			}
			let previousButtonCode = '';
			result = result.filter(buttonCode => {
				if (previousButtonCode === 'spacer' && buttonCode === 'separator') {
					return true;
				}
				previousButtonCode = buttonCode;
				return !this.hiddenTopButtons.hasOwnProperty(buttonCode);
			});
			this.needToRerenderTopButtonList = this.previousTopButtonList.toString() !== result.toString();
			this.previousTopButtonList = result;
			return result;
		}
		render() {
			this.elements.root = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall bx-messenger-videocall-scope"
				},
				children: [this.elements.wrap = main_core.Dom.create("div", {
					props: {
						className: `bx-messenger-videocall-wrap ${this.isCopilotActive ? 'bx-messenger-videocall-wrap-with-copilot' : ''}`
					},
					children: [this.elements.container = main_core.Dom.create("div", {
						props: {
							className: "bx-messenger-videocall-inner"
						},
						children: [this.elements.center = main_core.Dom.create("div", {
							props: {
								className: "bx-messenger-videocall-central-user"
							},
							events: {
								touchstart: this._onCenterTouchStart.bind(this),
								touchend: this._onCenterTouchEnd.bind(this)
							}
						}), this.elements.pageNavigatorLeft = main_core.Dom.create("div", {
							props: {
								className: "bx-messenger-videocall-page-navigator left"
							},
							children: [this.elements.pageNavigatorLeftCounter = main_core.Dom.create("div", {
								props: {
									className: "bx-messenger-videocall-page-navigator-counter left"
								},
								html: this.currentPage - 1 + '&nbsp;/&nbsp;' + this.pagesCount
							}), main_core.Dom.create("div", {
								props: {
									className: "bx-messenger-videocall-page-navigator-icon left"
								}
							})],
							events: {
								click: this._onLeftPageNavigatorClick.bind(this)
							}
						}), this.elements.pageNavigatorRight = main_core.Dom.create("div", {
							props: {
								className: "bx-messenger-videocall-page-navigator right"
							},
							children: [this.elements.pageNavigatorRightCounter = main_core.Dom.create("div", {
								props: {
									className: "bx-messenger-videocall-page-navigator-counter right"
								},
								html: this.currentPage + 1 + '&nbsp;/&nbsp;' + this.pagesCount
							}), main_core.Dom.create("div", {
								props: {
									className: "bx-messenger-videocall-page-navigator-icon right"
								}
							})],
							events: {
								click: this._onRightPageNavigatorClick.bind(this)
							}
						})]
					}), this.elements.topPanel = main_core.Dom.create("div", {
						props: {
							className: "bx-messenger-videocall-top-panel"
						}
					}), this.elements.notificationPanel = main_core.Dom.create("div", {
						props: {
							className: "bx-messenger-videocall-notification-panel"
						}
					}), this.elements.bottom = main_core.Dom.create("div", {
						props: {
							className: "bx-messenger-videocall-bottom"
						},
						children: [this.elements.userSelectorContainer = main_core.Dom.create("div", {
							props: {
								className: "bx-messenger-videocall-bottom-user-selector-container"
							}
						}), this.elements.pinnedUserContainer = main_core.Dom.create("div", {
							props: {
								className: "bx-messenger-videocall-bottom-pinned-user-container"
							}
						})]
					})]
				})],
				events: {
					click: this._onBodyClick.bind(this)
				}
			});
			this.talkingService.init({
				root: this.elements.root
			});
			this.talkingService.refreshQueue();
			if (this.showButtonPanel) {
				this.elements.panel = main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-panel"
					}
				});
				this.elements.bottom.appendChild(this.elements.panel);
			} else {
				this.elements.root.classList.add("bx-messenger-videocall-no-button-panel");
			}
			if (this.layout == Layouts.Mobile) {
				this.userSelector = new UserSelectorMobile({
					userRegistry: this.userRegistry
				});
				this.userSelector.mount(this.elements.userSelectorContainer);
				this.elements.ear.left = main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-mobile-ear left"
					},
					events: {
						click: this._onLeftEarClick.bind(this)
					}
				});
				this.elements.ear.right = main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-mobile-ear right"
					},
					events: {
						click: this._onRightEarClick.bind(this)
					}
				});
				this.elements.localUserMobile = main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-local-user-mobile"
					}
				});
				if (window.innerHeight < window.innerWidth) {
					this.elements.root.classList.add("orientation-landscape");
				}
				this.elements.wrap.appendChild(this.elements.ear.left);
				this.elements.wrap.appendChild(this.elements.ear.right);
				this.elements.wrap.appendChild(this.elements.localUserMobile);
			}
			this.centralUser.mount(this.elements.center);
			this.elements.overlay = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-overlay"
				}
			});
			this.elements.userBlock = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-user-block"
				},
				children: [this.elements.ear.top = main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-ear bx-messenger-videocall-ear-top"
					},
					children: [main_core.Dom.create("div", {
						props: {
							className: "bx-messenger-videocall-ear-icon"
						}
					})],
					events: {
						click: this._onTopPageNavigatorClick.bind(this)
					}
				}), this.elements.ear.bottom = main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-ear bx-messenger-videocall-ear-bottom"
					},
					children: [main_core.Dom.create("div", {
						props: {
							className: "bx-messenger-videocall-ear-icon"
						}
					})],
					events: {
						click: this._onBottomPageNavigatorClick.bind(this)
					}
				})]
			});
			this.elements.userList.container = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-user-list"
				},
				events: {
					scroll: main_core.Runtime.debounce(this.toggleEars.bind(this), 300),
					wheel: e => this.elements.userList.container.scrollTop += e.deltaY
				}
			});
			this.elements.userList.addButton = main_core.Dom.create("div", {
				props: {
					className: "bx-messenger-videocall-user-add"
				},
				children: [main_core.Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-user-add-inner"
					}
				})],
				style: {
					order: addButtonPosition
				},
				events: {
					click: this._onAddButtonClick.bind(this)
				}
			});
			if (this.layout == Layouts.Centered || this.layout == Layouts.Mobile) {
				this.centralUser.mount(this.elements.center);
				this.eventEmitter.emit(EventName.onHasMainStream, {
					userId: this.centralUser.id,
					otherUsers: [...this.activeUsers]
				});
				this.elements.root.classList.add('bx-messenger-videocall-centered');
				if (this.layout !== Layouts.Mobile) {
					this.elements.container.appendChild(this.elements.userBlock);
				}
			}
			if (this.layout == Layouts.Grid) {
				this.elements.root.classList.add("bx-messenger-videocall-grid");
			}
			if (this.layout == Layouts.Mobile) {
				this.elements.root.classList.add("bx-messenger-videocall-fullscreen-mobile");
			}
			this.resizeObserver.observe(this.elements.root);
			this.resizeObserver.observe(this.container);
			return this.elements.root;
		}
		toggleSubscribingVideoInRenderUserList(participants, showVideo) {
			if (participants.length > 0) {
				this.eventEmitter.emit(EventName.onToggleSubscribe, {
					participants,
					showVideo
				});
			}
		}
		getOrderingRules() {
			const rules = {
				[RerenderReason.VideoEnabled]: [],
				[RerenderReason.VideoDisabled]: [],
				[RerenderReason.VoiceStarted]: [],
				[RerenderReason.UserDisconnected]: null
			};
			this.rerenderQueue.forEach(el => {
				switch (el.reason) {
					case RerenderReason.UserDisconnected:
						rules[el.reason] = {
							id: el.userId,
							order: this.userRegistry.get(el.userId).prevOrder
						};
						break;
					case RerenderReason.VideoEnabled:
					case RerenderReason.VideoDisabled:
					case RerenderReason.VoiceStarted:
						rules[el.reason].push({
							id: el.userId,
							order: this.userRegistry.get(el.userId).order
						});
						break;
				}
			});
			this.rerenderQueue.clear();
			rules[RerenderReason.VideoEnabled].sort((a, b) => a.order - b.order);
			rules[RerenderReason.VideoDisabled].sort((a, b) => a.order - b.order);
			return rules;
		}
		applyOrderChanges(changes) {
			if (!main_core.Type.isArray(changes)) {
				return;
			}
			changes.forEach(change => {
				if (change.type === SwapType.Direct) {
					change.to.userModel.order = change.to.order;
					this.cache.delete('activeUsers');
				} else if (change.type === SwapType.Replace && change.to && change.from) {
					change.to.userModel.order = change.from.order;
					change.to.userModel.prevOrder = 0;
					change.from.userModel.order = change.to.order;
					this.cache.delete('activeUsers');
				}
			});
		}
		isUserHasActiveState(userModel) {
			return userModel.state !== call_core.UserState.Idle && userModel.state !== call_core.UserState.Declined && userModel.state !== call_core.UserState.Unavailable && userModel.state !== call_core.UserState.Busy && userModel.direction !== call_core.EndpointDirection.RecvOnly;
		}
		processVoiceRules(rules, params) {
			if (rules[RerenderReason.VoiceStarted].length === 0) {
				return;
			}
			params.activeUsers = this.getActiveUsers();
			const firstPageUsers = params.activeUsers.slice(0, this.usersPerPage).reverse();
			let firstPageUsersStartIndex = 0;
			rules[RerenderReason.VoiceStarted].forEach(rule => {
				const fromUser = this.userRegistry.get(rule.id);
				if (firstPageUsers.includes(fromUser)) {
					return;
				}
				let toUser;
				for (; firstPageUsersStartIndex < firstPageUsers.length; firstPageUsersStartIndex++) {
					toUser = this.userRegistry.get(firstPageUsers[firstPageUsersStartIndex]);
					if (toUser.wasTalkingAgo() > 60 * 1000) {
						break;
					}
					toUser = null;
				}
				if (toUser) {
					// todo: looks not optimal
					for (let i = 0; i < rules[RerenderReason.VideoDisabled].length; i++) {
						if (rules[RerenderReason.VideoDisabled][i].id === rule.id) {
							rules[RerenderReason.VideoDisabled].splice(i, 1);
							break;
						}
					}
					params.orderChanges.push({
						type: SwapType.Replace,
						to: {
							userModel: fromUser,
							order: fromUser.order
						},
						from: {
							userModel: toUser,
							order: toUser.order
						}
					});
				}
			});
			this.applyOrderChanges(params.orderChanges);
			params.orderChanges.length = 0;
		}
		processVideoRules(rules, params) {
			const diffBetweenChanges = rules[RerenderReason.VideoEnabled].length - rules[RerenderReason.VideoDisabled].length;
			const lessChangesField = diffBetweenChanges > 0 ? RerenderReason.VideoDisabled : RerenderReason.VideoEnabled;
			const moreChangesField = diffBetweenChanges > 0 ? RerenderReason.VideoEnabled : RerenderReason.VideoDisabled;
			if (rules[RerenderReason.VideoEnabled].length > 0 && rules[RerenderReason.VideoDisabled].length > 0) {
				rules[lessChangesField].forEach((el, index) => {
					const toUser = this.userRegistry.get(el.id);
					const fromUser = this.userRegistry.get(rules[moreChangesField][index].id);
					params.orderChanges.push({
						type: SwapType.Replace,
						to: {
							userModel: fromUser,
							order: fromUser.order
						},
						from: {
							userModel: toUser,
							order: toUser.order
						}
					});
				});
			}
			this.applyOrderChanges(params.orderChanges);
			params.orderChanges.length = 0;
			if (diffBetweenChanges === 0) {
				rules[RerenderReason.VideoEnabled].length = 0;
				rules[RerenderReason.VideoDisabled].length = 0;
			} else {
				rules[moreChangesField].splice(0, rules[moreChangesField].length - Math.abs(diffBetweenChanges));
				rules[lessChangesField].length = 0;
				if (moreChangesField === RerenderReason.VideoEnabled) {
					rules[moreChangesField].forEach(el => {
						params.orderChanges.push({
							type: SwapType.Replace,
							from: {
								userModel: this.userRegistry.get(el.id),
								order: this.userRegistry.get(el.id).order
							}
						});
						params.incompleteSwaps.push(params.orderChanges.length);
					});
				}
			}
		}
		processDisconnectRules(rules, params) {
			if (!rules[RerenderReason.UserDisconnected]) {
				return;
			}
			const userModel = this.userRegistry.get(rules[RerenderReason.UserDisconnected].id);
			if (userModel.prevCameraState) {
				params.disconnectedUserHadVideo = true;
			}
		}
		completeVideoEnableSwap(userModel, params) {
			const swapRemains = params.incompleteSwaps.length;
			if (userModel.state === call_core.UserState.Calling) {
				return;
			}
			const userAlreadyProcessed = params.usersToKeepActive.includes(userModel.id);
			if (params.usersWithEnabledVideo.includes(userModel.id) && !userAlreadyProcessed) {
				params.incompleteSwaps.shift();
				params.usersToKeepActive.push(userModel.id);
			} else if (!userModel.cameraState) {
				const index = params.incompleteSwaps[swapRemains - 1] - 1;
				const userEnabledVideo = params.orderChanges[index].from.userModel.id;
				const currenUserFromCurrentPage = params.possibleActiveUsers?.includes(userModel.id);
				const changedUserFromCurrentPage = params.possibleActiveUsers?.includes(userEnabledVideo);
				params.orderChanges[index].to = {
					userModel,
					order: userModel.order
				};
				if (currenUserFromCurrentPage && !changedUserFromCurrentPage) {
					params.currentPageUsers--;
					params.usersToDeactivate++;
				} else if (changedUserFromCurrentPage && !currenUserFromCurrentPage) {
					params.usersToForceDeactivation.push(userEnabledVideo);
				} else if (currenUserFromCurrentPage && changedUserFromCurrentPage) {
					params.usersToKeepActive.push(userEnabledVideo);
				}
				params.incompleteSwaps.pop();
			}
		}
		completeVideoDisabledSwap(rules, params) {
			let usersProcessed = 0;
			rules[RerenderReason.VideoDisabled].forEach(el => {
				const userWithoutVideo = this.userRegistry.get(el.id);
				const userWithoutVideoIndex = params.activeUsers.indexOf(el.id);
				const userWithoutVideoPage = Math.ceil((userWithoutVideoIndex + 1) / this.usersPerPage);
				const skipUsers = (userWithoutVideoPage - 1) * this.usersPerPage;
				const numberOfUsersWithVideoForSwap = params.usersWithVideo.length - skipUsers;
				const userToSwap = params.usersWithVideo[params.usersWithVideo.length - 1 - usersProcessed];
				// we should add '&& (userWithoutVideo.wasTalkingAgo() <= 60 * 1000)' below
				// to prevent speaking users swap
				const canCompleteVideoSwap = userToSwap && userToSwap.order > el.order;
				if (canCompleteVideoSwap && numberOfUsersWithVideoForSwap - usersProcessed >= 0) {
					usersProcessed++;
					params.orderChanges.push({
						type: SwapType.Replace,
						to: {
							userModel: userWithoutVideo,
							order: userWithoutVideo.order
						},
						from: {
							userModel: userToSwap,
							order: userToSwap.order
						}
					});
					const userToSwapIndex = params.activeUsers.indexOf(userToSwap.id);
					const userToSwapPage = Math.ceil((userToSwapIndex + 1) / this.usersPerPage);
					if (userWithoutVideoPage === this.currentPage && userToSwapPage > this.currentPage) {
						params.usersToKeepActive.push(userToSwap.id);
						params.usersToForceDeactivation.push(el.id);
						params.usersToDeactivate++;
					} else if (userToSwapPage === this.currentPage && userToSwapPage > userWithoutVideoPage) {
						params.usersToKeepActive.push(el.id);
						params.usersToForceDeactivation.push(userToSwap.id);
						params.usersToDeactivate++;
					}
				}
			});
			this.applyOrderChanges(params.orderChanges);
		}
		calculateUserActive(userId, currentStatus, userSkipped, params) {
			if (params.usersWithEnabledVideo.includes(userId) && !userSkipped && !params.possibleActiveUsers.includes(userId)) {
				params.currentPageUsers++;
				params.usersToDeactivate--;
				return true;
			}
			if (params.currentPageUsers + params.usersToDeactivate > this.usersPerPage) {
				params.currentPageUsers--;
				return false;
			}
			return currentStatus;
		}
		completeDisconnectSwap(rules, params) {
			const disconnectedUser = rules[RerenderReason.UserDisconnected];
			if (!disconnectedUser) {
				return;
			}
			const lowerOrderOnCurrentPage = this.userRegistry.get(params.possibleActiveUsers[0])?.order;
			const higherOrderOnCurrentPage = this.userRegistry.get(params.possibleActiveUsers[params.possibleActiveUsers.length - 1])?.order;
			let disconnectedUserFromCurrentPage = false;
			if (this.currentPage === 1) {
				disconnectedUserFromCurrentPage = disconnectedUser.order < lowerOrderOnCurrentPage || disconnectedUser.order > lowerOrderOnCurrentPage && disconnectedUser.order < higherOrderOnCurrentPage;
			} else {
				const skipUsers = (this.currentPage - 2) * this.usersPerPage;
				const activeUsersFromPreviousPage = params.activeUsers.slice(skipUsers, skipUsers + this.usersPerPage);
				const lastActiveUserFromPreviousPage = this.userRegistry.get(activeUsersFromPreviousPage[activeUsersFromPreviousPage.length - 1]);
				disconnectedUserFromCurrentPage = disconnectedUser.order > lowerOrderOnCurrentPage && disconnectedUser.order < higherOrderOnCurrentPage || disconnectedUser.order < lowerOrderOnCurrentPage && disconnectedUser.order > lastActiveUserFromPreviousPage?.order;
			}
			const userToSwap = params.disconnectedUserHadVideo ? params.usersWithVideo[params.usersWithVideo.length - 1] : this.userRegistry.get(params.activeUsers[params.activeUsers.length - 1]);
			if (!userToSwap || userToSwap.order <= disconnectedUser.order) {
				return;
			}
			params.orderChanges.push({
				type: SwapType.Direct,
				to: {
					userModel: userToSwap,
					order: disconnectedUser.order
				}
			});
			if (this.currentPage !== this.pagesCount && disconnectedUserFromCurrentPage && !params.possibleActiveUsers.includes(userToSwap.id)) {
				params.usersToKeepActive.push(userToSwap.id);
				params.usersToDeactivate++;
			}
			this.applyOrderChanges(params.orderChanges);
		}
		renderAddUserButtonInList() {
			const showAdd = this.showAddUserButtonInList && this.layout == Layouts.Centered && this.uiState === UiState.Connected && !this.isButtonBlocked("add") && this.getConnectedUserCount() < this.userLimit - 1 && !this.isFullScreen && this.elements.userList.addButton;
			if (showAdd) {
				this.elements.userList.container.appendChild(this.elements.userList.addButton);
				return;
			}
			main_core.Dom.remove(this.elements.userList.addButton);
		}
		renderUserList(pageChange) {
			clearTimeout(this.rerenderTimeout);
			this.rerenderTimeout = null;
			const prevActiveUsers = new Set(this.activeUsers);
			this.activeUsers.clear();
			const showLocalUser = this.shouldShowLocalUser();
			let userCount = 0;
			let skipUsers = 0;
			let skippedUsers = 0;
			let renderedUsers = 0;
			const orderingRules = this.getOrderingRules();
			const orderingParams = {
				usersWithVideo: [],
				usersWithEnabledVideo: [],
				usersWithDisabledVideo: [],
				possibleActiveUsers: null,
				usersToKeepActive: [],
				usersToForceDeactivation: [],
				currentPageUsers: 0,
				orderChanges: [],
				incompleteSwaps: [],
				disconnectedUserHadVideo: false,
				usersToDeactivate: 0,
				videoDisabledProceed: false
			};
			if ((this.layout === Layouts.Grid || this.layout === Layouts.Centered) && this.pagesCount > 1) {
				skipUsers = (this.currentPage - 1) * this.usersPerPage;
			}

			// this.processVoiceRules(orderingRules, orderingParams); // not ready to use
			this.processVideoRules(orderingRules, orderingParams);
			this.processDisconnectRules(orderingRules, orderingParams);
			orderingParams.usersWithEnabledVideo = orderingRules[RerenderReason.VideoEnabled].map(el => el.id);
			orderingParams.usersWithDisabledVideo = orderingRules[RerenderReason.VideoDisabled].map(el => el.id);
			orderingParams.activeUsers = this.getActiveUsers();
			orderingParams.possibleActiveUsers = orderingParams.activeUsers.slice(skipUsers, skipUsers + this.usersPerPage);
			orderingParams.usersWithVideo = this.getUsersWithCamera();
			this.completeVideoDisabledSwap(orderingRules, orderingParams);
			this.completeDisconnectSwap(orderingRules, orderingParams);
			orderingParams.activeUsers = this.getActiveUsers();
			orderingParams.possibleActiveUsers = orderingParams.activeUsers.slice(skipUsers, skipUsers + this.usersPerPage);
			const userModels = [...this.userRegistry.users.values()];
			for (const userModel of userModels) {
				const userId = userModel.id;
				if (!this.users.hasOwnProperty(userId)) {
					continue;
				}
				const user = this.users[userId];
				const screenUser = this.screenUsers[userId];
				if (userId == this.centralUser.id && (this.layout === Layouts.Centered || this.layout === Layouts.Mobile)) {
					if (this.layout === Layouts.Centered) {
						this.activeUsers.add(userId);
						if (orderingParams.usersWithEnabledVideo.includes(userId) && prevActiveUsers.has(userId)) {
							prevActiveUsers.delete(userId);
						}
					}
					this.unobserveIntersections(user);
					if (screenUser.hasVideo()) {
						screenUser.mount(this.elements.center);
						screenUser.visible = true;
						user.mount(this.elements.userList.container);
					} else {
						user.visible = true;
						user.mount(this.elements.center);
						screenUser.dismount();
					}
					continue;
				}
				let userActive = this.isUserHasActiveState(userModel);
				let userSkipped = false;
				if (userActive && skipUsers > 0 && skippedUsers < skipUsers) {
					// skip users on previous pages
					skippedUsers++;
					userActive = false;
					userSkipped = true;
				}
				if (userActive && this.layout === Layouts.Grid && this.usersPerPage > 0 && renderedUsers < this.usersPerPage) {
					orderingParams.currentPageUsers++;
				}
				if (this.layout === Layouts.Grid) {
					if (orderingRules[RerenderReason.VideoEnabled].length > 0) {
						if ((userActive || userSkipped) && orderingParams.incompleteSwaps.length > 0) {
							const previousIncompleteSwaps = orderingParams.incompleteSwaps.length;
							const index = orderingParams.incompleteSwaps[previousIncompleteSwaps - 1] - 1;
							const userEnabledVideo = orderingParams.orderChanges[index].from;
							const currentUserFromCurrentPage = orderingParams.possibleActiveUsers?.includes(userModel.id);
							const changedUserFromCurrentPage = orderingParams.possibleActiveUsers?.includes(userEnabledVideo.userModel.id);

							// code below should be wrapped in condition like
							// !(this.currentPage === 1 && userModel.wasTalkingAgo() <= 60 * 1000))
							// to prevent speaking users swap
							this.completeVideoEnableSwap(userModel, orderingParams);
							const swapCompleted = previousIncompleteSwaps !== orderingParams.incompleteSwaps.length;
							if (swapCompleted && userActive && !changedUserFromCurrentPage && !orderingParams.usersToKeepActive.includes(userModel.id)) {
								userActive = false;
							} else if (swapCompleted && (!userSkipped && !currentUserFromCurrentPage || userSkipped && changedUserFromCurrentPage)) {
								userActive = true;
							}
						}
						if (orderingParams.usersToDeactivate) {
							userActive = this.calculateUserActive(userModel.id, userActive, userSkipped, orderingParams);
						}
						if (orderingParams.usersToForceDeactivation.includes(userModel.id)) {
							userActive = false;
						}
					} else if (orderingRules[RerenderReason.VideoDisabled].length > 0) {
						if (orderingParams.usersToKeepActive.includes(userModel.id)) {
							userActive = true;
							orderingParams.usersToDeactivate--;
						} else if (orderingParams.usersToForceDeactivation.includes(userModel.id) || orderingParams.currentPageUsers + orderingParams.usersToDeactivate > this.usersPerPage) {
							userActive = false;
							orderingParams.currentPageUsers--;
						}
					} else if (orderingRules[RerenderReason.UserDisconnected]) {
						if (orderingParams.usersToKeepActive.includes(userModel.id)) {
							userActive = true;
							orderingParams.usersToDeactivate--;
						} else if (orderingParams.currentPageUsers + orderingParams.usersToDeactivate > this.usersPerPage) {
							userActive = false;
							orderingParams.currentPageUsers--;
						}
					}
				}
				if (userActive && (this.layout === Layouts.Grid || this.layout === Layouts.Centered) && this.usersPerPage > 0 && renderedUsers >= this.usersPerPage) {
					// skip users on following pages
					userActive = false;
				}
				if (userActive) {
					this.activeUsers.add(userId);
					if (orderingParams.usersWithEnabledVideo.includes(userId) && prevActiveUsers.has(userId)) {
						prevActiveUsers.delete(userId);
					}
				}
				if (!userActive) {
					user.dismount();
					this.unobserveIntersections(user);
					screenUser.dismount();
					continue;
				}
				if (screenUser.hasVideo()) {
					screenUser.mount(this.elements.userList.container);
					userCount++;
				} else {
					screenUser.dismount();
				}
				user.mount(this.elements.userList.container);
				if (!this.isPreparing) {
					this.observeIntersections(user);
				}
				renderedUsers++;
				userCount++;
			}
			this.applyOrderChanges(orderingParams.orderChanges);
			if (showLocalUser) {
				if (this.layout == Layouts.Centered && this.userId == this.centralUser.id || this.layout == Layouts.Mobile) {
					// this.unobserveIntersections(this.localUser);
					this.localUser.mount(this.elements.center, true);
					this.localUser.visible = true;
				} else {
					// using force true to always move self to the end of the list
					this.localUser.mount(this.elements.userList.container);
					if (this.layout == Layouts.Centered && this.intersectionObserver) ; else {
						this.localUser.visible = true;
					}
				}
				userCount++;
			} else {
				this.localUser.dismount();
				// this.unobserveIntersections(this.localUser);
			}
			const prevUserWidth = this.userSize.width;
			if (this.layout === Layouts.Grid) {
				this.updateGridUserSize(userCount);
			} else {
				this.elements.userList.container.classList.add("bx-messenger-videocall-user-list-small");
				this.elements.userList.container.style.removeProperty('--avatar-size');
				this.elements.userList.container.style.removeProperty('--avatar-text-size');
				this.updateCentralUserAvatarSize();
			}
			this.renderAddUserButtonInList();
			this.elements.root.classList.toggle("bx-messenger-videocall-user-list-empty", this.elements.userList.container.childElementCount === 0);
			this.localUser.updatePanelDeferred();
			const {
				usersToActivate,
				usersToDeactivate
			} = this.#getUserChangesAfterRendering(prevActiveUsers, prevUserWidth);
			this.applyIncomingVideoConstraints(usersToActivate, usersToDeactivate);
		}
		#getUserChangesAfterRendering(prevActiveUsers, prevVideoWidth) {
			const usersToDeactivate = [];
			const activeUsers = new Set(this.activeUsers);
			const videoWidth = this.userSize.width;
			if (this.currentPiPUserId && !activeUsers.has(this.currentPiPUserId)) {
				activeUsers.add(this.currentPiPUserId);
			}
			prevActiveUsers.forEach(userId => {
				if (activeUsers.has(userId)) {
					if (videoWidth === prevVideoWidth) {
						activeUsers.delete(userId);
					}
				} else {
					usersToDeactivate.push(userId);
				}
			});
			const usersToActivate = [...activeUsers];
			return {
				usersToActivate,
				usersToDeactivate
			};
		}
		shouldShowLocalUser() {
			return this.localUser.userModel.state != call_core.UserState.Idle && this.localUser.userModel.direction != call_core.EndpointDirection.RecvOnly;
		}
		updateGridUserSize(userCount) {
			const containerSize = this.elements.userList.container.getBoundingClientRect();
			this.userSize = call_core.Util.findBestElementSize(containerSize.width, containerSize.height, userCount, MIN_GRID_USER_WIDTH, MIN_GRID_USER_HEIGHT);

			//Change the size to make it possible to make indents between users
			let rows = Math.floor(containerSize.height / MIN_GRID_USER_HEIGHT) || 1;
			this.userSize.width -= 5 * rows;
			this.userSize.height -= 2.75 * rows;
			const avatarSize = Math.round(this.userSize.height * 0.45);
			const avatarTextSize = Math.round(avatarSize * 0.45);
			this.elements.userList.container.style.setProperty('--grid-user-width', this.userSize.width + 'px');
			this.elements.userList.container.style.setProperty('--grid-user-height', this.userSize.height + 'px');
			this.elements.userList.container.style.setProperty('--avatar-size', avatarSize + 'px');
			this.elements.userList.container.style.setProperty('--avatar-text-size', avatarTextSize + 'px');
			if (this.userSize.width < 220) {
				this.elements.userList.container.classList.add("bx-messenger-videocall-user-list-small");
			} else {
				this.elements.userList.container.classList.remove("bx-messenger-videocall-user-list-small");
			}
		}
		updateCentralUserAvatarSize() {
			let containerSize;
			let avatarSize;
			if (this.layout == Layouts.Mobile) {
				containerSize = this.elements.root.getBoundingClientRect();
				avatarSize = Math.round(containerSize.width * 0.55);
			} else if (this.layout == Layouts.Centered) {
				containerSize = this.elements.center.getBoundingClientRect();
				avatarSize = Math.min(Math.round(containerSize.height * 0.45), Math.round(containerSize.width * 0.45));
				this.centralUser.setIncomingVideoConstraints(Math.floor(containerSize.width), Math.floor(containerSize.height));
			}
			const avatarTextSize = Math.round(avatarSize * 0.45);
			this.elements.center.style.setProperty('--avatar-size', avatarSize + 'px');
			this.elements.center.style.setProperty('--avatar-text-size', avatarTextSize + 'px');
		}
		renderButtons(buttons, rerender) {
			let panelInner, left, center, right;
			if (rerender) {
				panelInner = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-panel-inner'
					}
				});
			}
			if (this.layout === Layouts.Mobile || this.size === Size.Folded) {
				left = panelInner;
				center = panelInner;
				right = panelInner;
			} else if (rerender) {
				left = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-panel-inner-left'
					}
				});
				center = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-panel-inner-center'
					}
				});
				right = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-panel-inner-right'
					}
				});
				main_core.Dom.append(left, panelInner);
				main_core.Dom.append(center, panelInner);
				main_core.Dom.append(right, panelInner);
			}
			for (let i = 0; i < buttons.length; i++) {
				switch (buttons[i]) {
					case 'title':
						if (this.buttons.title) {
							this.buttons.title.update({
								text: this.title,
								isGroupCall: Object.keys(this.users).length > 1
							});
						} else {
							this.buttons.title = new TitleButton({
								text: this.title,
								isGroupCall: Object.keys(this.users).length > 1
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.title.render(), left);
						}
						break;
					/*case "grid":
						this.buttons.grid = new SimpleButton({
							class: "grid",
							text: BX.message("IM_M_CALL_BTN_GRID"),
							onClick: this._onGridButtonClick.bind(this)
						});
						panelInner.appendChild(this.buttons.grid.render());
						break;*/
					/*case "add":
						this.buttons.add = new SimpleButton({
							class: "add",
							text: BX.message("IM_M_CALL_BTN_ADD"),
							onClick: this._onAddButtonClick.bind(this)
						});
						leftSubPanel.appendChild(this.buttons.add.render());
						break;*/
					case 'share':
						if (rerender) {
							this.buttons.share = new SimpleButton({
								class: 'share',
								text: BX.message('IM_M_CALL_BTN_LINK'),
								onClick: this._onShareButtonClick.bind(this)
							});
							main_core.Dom.append(this.buttons.share.render(), center);
						}
						break;
					case 'microphone':
						if (this.buttons.microphone) {
							this.buttons.microphone.setBlocked(this.isButtonBlocked('microphone'));
						} else {
							this.buttons.microphone = new DeviceButton({
								class: 'microphone',
								text: BX.message('IM_M_CALL_BTN_MIC'),
								enabled: !call_core.Hardware.isMicrophoneMuted,
								arrowHidden: this.layout === Layouts.Mobile,
								arrowEnabled: this.isMediaSelectionAllowed(),
								showPointer: true,
								//todo
								blocked: this.isButtonBlocked('microphone'),
								showLevel: true,
								sideIcon: this.getMicrophoneSideIcon(this.roomState),
								onClick: this._onMicrophoneButtonClick.bind(this),
								onArrowClick: this._onMicrophoneArrowClick.bind(this),
								onSideIconClick: this._onMicrophoneSideIconClick.bind(this),
								...(call_core.Util.isDesktop() ? {
									tooltip: {
										position: 'top',
										getText: () => call_core.Hardware.isMicrophoneMuted ? `${BX.message('IM_SPACE_HOTKEY')}\\A${' '}${this.keyModifierForCss} + A${' '}` : `${this.keyModifierForCss} + A`
									}
								} : {})
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.microphone.render(), left);
						}
						break;
					case 'camera':
						if (this.buttons.camera) {
							this.buttons.camera.setBlocked(this.isButtonBlocked('camera'));
						} else {
							this.buttons.camera = new DeviceButton({
								class: 'camera',
								text: BX.message('IM_M_CALL_BTN_CAMERA'),
								enabled: call_core.Hardware.isCameraOn,
								arrowHidden: this.layout === Layouts.Mobile,
								arrowEnabled: this.isMediaSelectionAllowed(),
								blocked: this.isButtonBlocked('camera'),
								onClick: this._onCameraButtonClick.bind(this),
								onArrowClick: this._onCameraArrowClick.bind(this),
								...(call_core.Util.isDesktop() ? {
									tooltip: {
										position: 'top',
										getText: () => `${this.keyModifierForCss} + V`
									}
								} : {})
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.camera.render(), left);
						}
						break;
					case 'screen':
						if (this.buttons.screen) {
							this.buttons.screen.setBlocked(this.isButtonBlocked('screen'));
						} else {
							this.buttons.screen = new SimpleButton({
								class: 'screen',
								backgroundClass: 'bx-messenger-videocall-panel-background-screen',
								text: BX.message('IM_M_CALL_BTN_SCREEN'),
								blocked: this.isButtonBlocked('screen'),
								onClick: this._onScreenButtonClick.bind(this),
								...(call_core.Util.isDesktop() ? {
									tooltip: {
										position: 'top',
										getText: () => `${this.keyModifierForCss} + S`
									}
								} : {})
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.screen.render(), center);
						}
						break;
					case 'record':
						if (this.buttons.record) {
							this.buttons.record.setBlocked(this.isButtonBlocked('record'));
						} else {
							this.buttons.record = new SimpleButton({
								class: 'record',
								backgroundClass: 'bx-messenger-videocall-panel-background-record',
								text: main_core.Loc.getMessage('IM_M_CALL_BTN_RECORD'),
								blocked: this.isButtonBlocked('record'),
								onClick: this.#onCommonRecordClick.bind(this),
								...(call_core.Util.isDesktop() ? {
									tooltip: {
										position: 'top',
										getText: () => `${this.keyModifierForCss} + R`
									}
								} : {})
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.record.render(), center);
						}
						break;
					case 'document':
						if (this.buttons.document) {
							this.buttons.document.setBlocked(this.isButtonBlocked('document'));
						} else {
							this.buttons.document = new SimpleButton({
								class: 'document',
								backgroundClass: 'bx-messenger-videocall-panel-background-document',
								text: BX.message('IM_M_CALL_BTN_DOCUMENT'),
								blocked: this.isButtonBlocked('document'),
								onClick: this._onDocumentButtonClick.bind(this)
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.document.render(), center);
						}
						break;
					case 'copilot':
						if (this.buttons.copilot) {
							this.buttons.copilot.setBlocked(this.isButtonBlocked('copilot'));
							this.buttons.copilot.setActive(this.isCopilotActive);
						} else {
							this.buttons.copilot = new SimpleButton({
								class: 'copilot',
								backgroundClass: 'bx-messenger-videocall-panel-background-copilot',
								text: BX.message('CALL_BUTTON_COPILOT_TITLE'),
								blocked: this.isButtonBlocked('copilot'),
								onClick: this._onCopilotButtonClick.bind(this),
								isComingSoon: !this.isCopilotFeaturesEnabled,
								...(call_core.Util.isDesktop() ? {
									tooltip: {
										position: 'top',
										getText: () => this.isCopilotActive ? main_core.Loc.getMessage('CALL_COPILOT_BUTTON_ON_HINT_V2') : main_core.Loc.getMessage('CALL_COPILOT_BUTTON_OFF_HINT')
									}
								} : {})
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.copilot.render(), center);
						}
						break;
					case 'returnToCall':
						if (rerender) {
							this.buttons.returnToCall = new SimpleButton({
								class: 'returnToCall',
								text: BX.message('IM_M_CALL_BTN_RETURN_TO_CALL'),
								onClick: this._onBodyClick.bind(this)
							});
							main_core.Dom.append(this.buttons.returnToCall.render(), right);
						}
						break;
					case 'hangup':
						if (rerender) {
							this.buttons.hangup = new SimpleButton({
								class: 'hangup',
								backgroundClass: 'bx-messenger-videocall-panel-icon-background-hangup',
								text: Object.keys(this.users).length > 1 ? BX.message('IM_M_CALL_BTN_DISCONNECT') : BX.message('IM_M_CALL_BTN_HANGUP'),
								onClick: this._onHangupButtonClick.bind(this)
							});
							main_core.Dom.append(this.buttons.hangup.render(), right);
						}
						break;
					case 'hangupOptions':
						if (rerender) {
							this.buttons.hangupOptions = new SimpleButton({
								class: 'hangup-options',
								backgroundClass: 'bx-messenger-videocall-panel-icon-background-hangup-options',
								onClick: this._onHangupOptionsButtonClick.bind(this)
							});
							main_core.Dom.append(this.buttons.hangupOptions.render(), right);
						}
						break;
					case 'close':
						if (rerender) {
							this.buttons.close = new SimpleButton({
								class: 'close',
								backgroundClass: 'bx-messenger-videocall-panel-icon-background-hangup',
								text: BX.message('IM_M_CALL_BTN_CLOSE'),
								onClick: this._onCloseButtonClick.bind(this)
							});
							main_core.Dom.append(this.buttons.close.render(), right);
						}
						break;
					case 'speaker':
						/*this.buttons.speaker = new Buttons.DeviceButton({
							class: "speaker",
							text: BX.message("IM_M_CALL_BTN_SPEAKER"),
							enabled: !this.speakerMuted,
							arrowEnabled: Hardware.canSelectSpeaker() && this.isMediaSelectionAllowed(),
							onClick: this._onSpeakerButtonClick.bind(this),
							onArrowClick: this._onSpeakerArrowClick.bind(this)
						});
						rightSubPanel.appendChild(this.buttons.speaker.render());*/
						break;
					case 'mobileMenu':
						if (rerender) {
							if (!this.buttons.mobileMenu) {
								this.buttons.mobileMenu = new SimpleButton({
									class: 'sandwich',
									text: BX.message('IM_M_CALL_BTN_MENU'),
									onClick: this._onMobileMenuButtonClick.bind(this)
								});
							}
							main_core.Dom.append(this.buttons.mobileMenu.render(), center);
						}
						break;
					case 'chat':
						if (this.buttons.chat) {
							this.buttons.chat.setBlocked(this.isButtonBlocked('chat'));
						} else {
							this.buttons.chat = new SimpleButton({
								class: 'chat',
								backgroundClass: 'bx-messenger-videocall-panel-background-chat',
								text: BX.message('IM_M_CALL_BTN_CHAT'),
								blocked: this.isButtonBlocked('chat'),
								onClick: this._onChatButtonClick.bind(this),
								...(call_core.Util.isDesktop() ? {
									tooltip: {
										position: 'top',
										getText: () => `${this.keyModifierForCss} + C`
									}
								} : {})
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.chat.render(), center);
						}
						break;
					case 'floorRequest':
						if (!this.buttons.floorRequest) {
							this.buttons.floorRequest = new SimpleButton({
								class: 'floor-request',
								backgroundClass: 'bx-messenger-videocall-panel-background-floor-request',
								text: BX.message('IM_M_CALL_BTN_WANT_TO_SAY'),
								blocked: this.isButtonBlocked('floorRequest'),
								onClick: this._onFloorRequestButtonClick.bind(this),
								...(call_core.Util.isDesktop() ? {
									tooltip: {
										position: 'top',
										getText: () => `${this.keyModifierForCss} + H`
									}
								} : {})
							});
						} else {
							this.buttons.floorRequest.setBlocked(this.isButtonBlocked('floorRequest'));
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.floorRequest.render(), center);
						}
						break;
					case 'more':
						if (rerender) {
							if (!this.buttons.more) {
								this.buttons.more = new SimpleButton({
									class: 'more',
									onClick: this._onMoreButtonClick.bind(this)
								});
							}
							main_core.Dom.append(this.buttons.more.render(), center);
						}
						break;
					case 'spacer':
						if (rerender) {
							panelInner.appendChild(main_core.Dom.create('div', {
								props: {
									className: 'bx-messenger-videocall-panel-spacer'
								}
							}));
						}
						break;
					/*case "history":
						this.buttons.history = new Buttons.SimpleButton({
							class: "history",
							text: BX.message("IM_M_CALL_BTN_HISTORY"),
							onClick: this._onHistoryButtonClick.bind(this)
						});
						rightSubPanel.appendChild(this.buttons.history.render());
						break;*/
				}
			}
			return panelInner;
		}
		renderTopButtons(buttons, rerender) {
			for (let i = 0; i < buttons.length; i++) {
				switch (buttons[i]) {
					case 'watermark':
						if (!this.buttons.waterMark) {
							this.buttons.waterMark = new WaterMarkButton({
								language: this.language
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.waterMark.render(), this.elements.topPanel);
						}
						break;
					case 'protected':
						if (!this.buttons.protected) {
							this.buttons.protected = new TopFramelessButton({
								iconClass: 'protected',
								textClass: 'protected',
								text: BX.message('IM_M_CALL_PROTECTED').toLowerCase(),
								tooltip: {
									width: '384px',
									position: 'bottom',
									getText: () => BX.message('IM_M_CALL_PROTECTED_HINT')
								}
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.protected.render(), this.elements.topPanel);
						}
						break;
					case 'recordStatus':
						if (this.buttons.recordStatus) {
							this.buttons.recordStatus.updateView();
						} else {
							this.buttons.recordStatus = new RecordStatusButton({
								userId: this.userId,
								commonRecordState: this.commonRecordState,
								tooltip: {
									position: 'bottom',
									getText: () => {
										const userData = this.userData[this.commonRecordState.userId];
										if (!userData) {
											return '';
										}
										const recordingUserName = main_core.Text.encode(userData.name);
										const gender = userData.gender || 'M';
										return main_core.Loc.getMessage(`CALL_COMMON_RECORD_INITIATOR_HINT_${gender}`).replace('#USER_NAME#', recordingUserName);
									}
								}
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.recordStatus.render(), this.elements.topPanel);
						}
						break;
					case 'grid':
						if (this.buttons.grid) {
							this.buttons.grid.update({
								iconClass: this.layout === Layouts.Grid ? 'speaker' : 'grid',
								text: this.layout === Layouts.Grid ? BX.message('IM_M_CALL_SPEAKER_MODE') : BX.message('IM_M_CALL_GRID_MODE_MSGVER_1')
							});
						} else {
							this.buttons.grid = new TopButton({
								iconClass: this.layout === Layouts.Grid ? 'speaker' : 'grid',
								text: this.layout === Layouts.Grid ? BX.message('IM_M_CALL_SPEAKER_MODE') : BX.message('IM_M_CALL_GRID_MODE_MSGVER_1'),
								onClick: this._onGridButtonClick.bind(this),
								...(call_core.Util.isDesktop() ? {
									tooltip: {
										position: 'bottom',
										getText: () => `${this.keyModifierForCss} + W`
									}
								} : {})
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.grid.render(), this.elements.topPanel);
						}
						break;
					case 'fullscreen':
						if (this.buttons.fullscreen) {
							this.buttons.fullscreen.update({
								iconClass: this.isFullScreen ? 'fullscreen-leave' : 'fullscreen-enter',
								text: this.isFullScreen ? BX.message('IM_M_CALL_WINDOW_MODE') : BX.message('IM_M_CALL_FULLSCREEN_MODE')
							});
						} else {
							this.buttons.fullscreen = new TopButton({
								iconClass: this.isFullScreen ? 'fullscreen-leave' : 'fullscreen-enter',
								text: this.isFullScreen ? BX.message('IM_M_CALL_WINDOW_MODE') : BX.message('IM_M_CALL_FULLSCREEN_MODE'),
								onClick: this._onFullScreenButtonClick.bind(this)
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.fullscreen.render(), this.elements.topPanel);
						}
						break;
					case 'feedback':
						if (!this.buttons.feedback) {
							this.buttons.feedback = new TopButton({
								iconClass: 'feedback',
								text: BX.message('IM_OL_COMMENT_HEAD_BUTTON_VOTE'),
								onClick: this._onFeedbackButtonClick.bind(this)
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.feedback.render(), this.elements.topPanel);
						}
						break;
					case 'link':
						if (!this.buttons.link) {
							this.buttons.link = new TopButton({
								iconClass: 'link',
								text: BX.message('CALL_VIEW_GUEST_LINK_BUTTON_LABEL'),
								onClick: this._onLinkButtonClick.bind(this)
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.link.render(), this.elements.topPanel);
						}
						break;
					case 'callcontrol':
						if (!this.buttons.callcontrol) {
							this.buttons.callcontrol = new TopButton({
								iconClass: 'callcontrol',
								text: BX.message('CALL_CALLCONTROL_BUTTON_LABEL'),
								onClick: this._onCallcontrolButtonClick.bind(this)
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.callcontrol.render(), this.elements.topPanel);
						}
						break;
					case 'participants':
						let foldButtonState = ParticipantsButton.FoldButtonState.Hidden;
						if (this.isFullScreen && this.layout === Layouts.Centered) {
							foldButtonState = this.isUserBlockFolded ? ParticipantsButton.FoldButtonState.Unfold : ParticipantsButton.FoldButtonState.Fold;
						} else if (this.showUsersButton) {
							foldButtonState = ParticipantsButton.FoldButtonState.Active;
						}
						if (this.buttons.participants) {
							this.buttons.participants.update({
								foldButtonState,
								allowAdding: !this.isButtonBlocked('add'),
								count: this.getConnectedUserCount(true)
							});
						} else {
							this.buttons.participants = new ParticipantsButton({
								foldButtonState,
								allowAdding: !this.isButtonBlocked('add'),
								count: this.getConnectedUserCount(true),
								onListClick: this._onParticipantsButtonListClick.bind(this),
								onAddClick: this._onAddButtonClick.bind(this)
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.participants.render(), this.elements.topPanel);
						}
						break;
					case 'participantsMobile':
						if (!this.buttons.participantsMobile) {
							this.buttons.participantsMobile = new ParticipantsButtonMobile({
								count: this.getConnectedUserCount(true),
								onClick: this._onParticipantsButtonMobileListClick.bind(this)
							});
						}
						if (rerender) {
							main_core.Dom.append(this.buttons.participantsMobile.render(), this.elements.topPanel);
						}
						break;
					case 'separator':
						if (rerender) {
							this.elements.topPanel.appendChild(main_core.Dom.create('div', {
								props: {
									className: 'bx-messenger-videocall-top-separator'
								}
							}));
						}
						break;
					case 'spacer':
						if (rerender) {
							this.elements.topPanel.appendChild(main_core.Dom.create('div', {
								props: {
									className: 'bx-messenger-videocall-top-panel-spacer'
								}
							}));
						}
						break;
				}
			}
		}
		updateCopilotState(isActive) {
			this.isCopilotActive = isActive;
			this.setButtonActive('copilot', this.isCopilotActive);
			if (this.elements.wrap) {
				this.elements.wrap.classList[this.isCopilotActive ? 'add' : 'remove']('bx-messenger-videocall-wrap-with-copilot');
			}
		}
		updateCopilotFeatureState(isEnabled) {
			this.isCopilotFeaturesEnabled = isEnabled;
			if (!this.buttons.copilot) {
				return;
			}
			this.buttons.copilot.setIsComingSoon(!this.isCopilotFeaturesEnabled);
		}
		showCopilotNotify(callId = 0, errorCode = '') {
			const notifyType = errorCode ? null : call_core.CopilotNotifyType[this.isCopilotActive ? 'COPILOT_ENABLED' : 'COPILOT_DISABLED'];
			if (notifyType) {
				this.#openCopilotNotify(notifyType, callId);
			}
		}
		closeCopilotNotify() {
			if (this.copilotNotify) {
				this.copilotNotify.close();
				this.copilotNotify = null;
			}
		}
		showCopilotResultNotify() {
			this.#openCopilotNotify(call_core.CopilotNotifyType.COPILOT_RESULT);
		}
		showCopilotErrorNotify(errorType) {
			const notifyType = call_core.CopilotNotifyType[errorType];
			this.#openCopilotNotify(notifyType);
		}
		createCopilotNotify(notifyType, callId) {
			if (!this.buttons.copilot) {
				return null;
			}
			return new call_core.CopilotNotify({
				type: notifyType,
				bindElement: this.buttons.copilot.elements.root,
				targetContainer: this.elements.root,
				onClose: () => {
					this.copilotNotify = null;
				},
				callId
			});
		}
		#openCopilotNotify(notifyType, callId = 0) {
			this.closeCopilotNotify();
			this.copilotNotify = this.createCopilotNotify(notifyType, callId);
			if (this.copilotNotify) {
				this.copilotNotify.show();
			}
		}
		createAhaMomentNotifyCallcontrol() {
			if (!this.buttons.callcontrol) {
				return;
			}
			if (this.ahaMomentNotifyCallcontrol) {
				this.ahaMomentNotifyCallcontrol.show();
				return this.ahaMomentNotifyCallcontrol;
			}
			this.ahaMomentNotifyCallcontrol = new AhaMomentNotify({
				notifyTitle: BX.message("CALL_CALLCONTROL_AXA_MOMENT_TITLE"),
				notifyText: BX.message("CALL_CALLCONTROL_AXA_MOMENT_TEXT"),
				bindElement: this.buttons.callcontrol.elements.root,
				promoId: CALLCONTROL_PROMO_ID,
				targetContainer: this.elements.root,
				onClose: () => {
					this.needToShowCallcontrolPromo = false;
					this.ahaMomentNotifyCallcontrol = null;
				}
			});
			this.ahaMomentNotifyCallcontrol.show();
			return this.ahaMomentNotifyCallcontrol;
		}
		calculateUnusedPanelSpace(buttonList) {
			if (!buttonList) {
				buttonList = this.getButtonList();
			}
			let totalButtonWidth = 0;
			for (let i = 0; i < buttonList.length; i++) {
				const button = this.buttons[buttonList[i]];
				if (!button) {
					continue;
				}
				const buttonWidth = button.elements.root ? button.elements.root.getBoundingClientRect().width : 0;
				totalButtonWidth += buttonWidth;
			}
			return this.elements.panel.scrollWidth - totalButtonWidth - 32;
		}
		setWindowFocusState(isActive) {
			if (isActive === this.isWindowFocus) {
				return;
			}
			this.isWindowFocus = isActive;
			if (this.pictureInPictureCallWindow) {
				this.pictureInPictureCallWindow.setButtons(this.getPictureInPictureCallWindowGetButtonsList()).updateButtons();
			}
		}
		getPictureInPictureCallWindowGetButtonsList() {
			const buttonsList = ["microphone", "camera"];
			if (this.getButtonActive('screen')) {
				buttonsList.push("stop-screen");
			}
			const isViewHidden = this.isHidden();
			if (this.size === View.Size.Folded || isViewHidden) {
				buttonsList.push("returnToCall");
			}

			// if (this.getButtonList().includes('copilot'))
			// {
			// 	buttonsList.push("copilot");
			// }

			return buttonsList;
		}
		getPictureInPictureCallWindowUser(targetUserId = null) {
			const isNotMe = id => id != null && +id !== +this.userId;
			const currentUserId = targetUserId ?? (isNotMe(this.presenterId) ? this.presenterId : null) ?? (isNotMe(this.centralUser?.userModel.id) ? this.centralUser?.userModel.id : null) ?? this.getAnyOtherUserId();
			const isLocalUser = +this.userId === +currentUserId;
			const currentUser = isLocalUser ? this.localUser : this.users[currentUserId];
			const isCurrentPiPUser = !!this.currentPiPUserId && currentUserId === this.currentPiPUserId;
			if (isCurrentPiPUser) {
				return;
			}
			if (!this.activeUsers.has(currentUserId) && !isLocalUser) {
				this.toggleSubscribingVideoInRenderUserList([{
					userId: currentUserId
				}], true);
			}
			if (this.currentPiPUserId && +this.userId !== +this.currentPiPUserId && !this.activeUsers.has(this.currentPiPUserId)) {
				this.toggleSubscribingVideoInRenderUserList([{
					userId: this.currentPiPUserId
				}], false);
			}
			this.currentPiPUserId = currentUserId;
			const modifiedCurrentUser = {
				userModel: this.userRegistry.get(currentUserId),
				avatarBackground: currentUser.avatarBackground,
				videoRenderer: currentUser.videoRenderer,
				previewRenderer: currentUser.previewRenderer
			};
			if (currentUser.videoTrack) {
				modifiedCurrentUser.videoRenderer = new call_core.MediaRenderer({
					kind: 'video',
					track: currentUser.videoTrack
				});
			}
			if (!isLocalUser && this.screenUsers[currentUserId]?.videoTrack) {
				modifiedCurrentUser.previewRenderer = new call_core.MediaRenderer({
					kind: 'sharing',
					track: this.screenUsers[currentUserId].videoTrack
				});
			}
			if (isLocalUser && this.localStreamVideoTrack) {
				modifiedCurrentUser.previewRenderer = new call_core.MediaRenderer({
					kind: 'sharing',
					track: this.localStreamVideoTrack
				});
			}
			return modifiedCurrentUser;
		}
		getAnyOtherUserId() {
			const myId = String(this.userId);
			const anyActiveUser = [...this.activeUsers].find(id => String(id) !== myId);
			if (anyActiveUser) {
				return anyActiveUser;
			}
			const users = this.users || {};
			const anyOtherUser = Object.keys(users).find(id => String(id) !== myId);
			if (anyOtherUser) {
				return anyOtherUser;
			}
			return this.userId;
		}
		getBlockedButtonsListPictureInPictureCallWindow() {
			const blockedButtons = [];
			if (this.isButtonBlocked('camera')) {
				blockedButtons.push('camera');
			}
			if (this.isButtonBlocked('microphone')) {
				blockedButtons.push('microphone');
			}
			if (this.isButtonBlocked('screen')) {
				blockedButtons.push('screen');
			}
			return blockedButtons;
		}
		_onPiPClose() {
			this.eventEmitter.emit(EventName.onPiPClose);
		}
		toggleStatePictureInPictureCallWindow(isActive) {
			const isPiPAvailable = call_core.UnsupportedBrowserFeatures.isPiPAvailable;
			if (isActive && !this.pictureInPictureCallWindow && isPiPAvailable && call_core.Util.isPictureInPictureFeatureEnabled()) {
				this.pictureInPictureCallWindow = new PictureInPictureWindow({
					currentUser: this.getPictureInPictureCallWindowUser(),
					isCopilotFeaturesEnabled: this.isCopilotFeaturesEnabled,
					buttons: this.getPictureInPictureCallWindowGetButtonsList(),
					blockedButtons: this.getBlockedButtonsListPictureInPictureCallWindow(),
					allowPinButton: false,
					allowBackgroundItem: call_core.BackgroundDialog.isAvailable() && this.isIntranetOrExtranet,
					allowMaskItem: call_core.BackgroundDialog.isMaskAvailable() && this.isIntranetOrExtranet,
					preferInitialWindowPlacement: this.preferInitialWindowPlacementPictureInPicture,
					floorRequestNotifications: this.floorRequestNotifications,
					hardwareState: call_core.Hardware,
					Buttons,
					CallUser,
					FloorRequest,
					onClose: isProgrammaticClose => {
						this.pictureInPictureCallWindow = null;
						this.currentPiPUserId = null;
						this._onPiPClose();
					},
					onButtonClick: ({
						buttonName,
						event
					}) => {
						switch (buttonName) {
							case "microphone":
								this._onMicrophoneButtonClick(event);
								break;
							case "camera":
								this._onCameraButtonClick(event);
								break;
							case "returnToCall":
								this.eventEmitter.emit(EventName.onPiPBodyClick);
								break;
							case "stop-screen":
								this._onScreenButtonClick(event);
								break;
						}
					}
				});
				this.pictureInPictureCallWindow.checkAvailableAndCreate().then(() => {
					this.preferInitialWindowPlacementPictureInPicture = false;
				});
			}
			if (!isActive && this.pictureInPictureCallWindow) {
				this.pipCoordinator?.deactivate();
				this.pictureInPictureCallWindow.close();
			}
		}
		setButtonActive(buttonName, isActive) {
			if (!this.buttons[buttonName]) {
				return;
			}
			this.buttons[buttonName].setActive(isActive);
			if (this.pictureInPictureCallWindow) {
				this.pictureInPictureCallWindow.setButtons(this.getPictureInPictureCallWindowGetButtonsList()).updateButtons();
			}
		}
		getButtonActive(buttonName) {
			if (!this.buttons || !this.buttons[buttonName]) {
				return false;
			}
			return this.buttons[buttonName].isActive;
		}
		setButtonCounter(buttonName, counter) {
			if (!this.buttons[buttonName]) {
				return;
			}
			this.buttons[buttonName].setCounter(counter);
		}
		updateUserList() {
			if (this.layout == Layouts.Mobile) {
				if (this.localUser != this.centralUser) {
					if (this.localUser.hasVideo()) {
						this.localUser.mount(this.elements.localUserMobile);
						this.localUser.visible = true;
					} else {
						this.localUser.dismount();
					}
					this.centralUser.mount(this.elements.center);
					this.eventEmitter.emit(EventName.onHasMainStream, {
						userId: this.centralUser.id,
						otherUsers: [...this.activeUsers]
					});
					this.centralUser.visible = true;
				}
				return;
			}
			/* if (this.layout == Layouts.Grid && this.size == Size.Full)
			{
				this.recalculatePages();
			} */

			if ((this.layout == Layouts.Grid || this.layout == Layouts.Centered) && this.size == Size.Full) {
				this.recalculatePages();
			}
			this.renderUserList();
			if (this.layout == Layouts.Centered) {
				if (!this.elements.userList.container.parentElement) {
					this.elements.userBlock.appendChild(this.elements.userList.container);
				}
				//this.centralUser.setFullSize(this.elements.userList.container.childElementCount === 0);
			} else if (this.layout == Layouts.Grid) {
				if (!this.elements.userList.container.parentElement) {
					this.elements.container.appendChild(this.elements.userList.container);
				}
			}
			this.toggleEars();
		}
		showOverflownButtonsPopup() {
			if (this.overflownButtonsPopup) {
				this.overflownButtonsPopup.show();
				return;
			}
			const bindElement = this.buttons.more && this.buttons.more.elements.root ? this.buttons.more.elements.root : this.elements.panel;
			this.overflownButtonsPopup = new main_popup.Popup({
				id: 'bx-call-buttons-popup',
				bindElement,
				targetContainer: this.elements.root,
				content: this.renderButtons(Object.keys(this.overflownButtons), true),
				cacheable: false,
				closeIcon: false,
				autoHide: true,
				overlay: {
					backgroundColor: 'white',
					opacity: 0
				},
				bindOptions: {
					position: 'top'
				},
				angle: {
					position: 'bottom',
					offset: 49
				},
				className: 'bx-call-buttons-popup',
				contentBackground: 'unset',
				events: {
					onPopupDestroy: () => {
						this.overflownButtonsPopup = null;
						this.buttons.more.setActive(false);
					}
				}
			});
			this.overflownButtonsPopup.show();
		}
		resumeVideo() {
			for (let userId in this.users) {
				const user = this.users[userId];
				user.playVideo();
				const screenUser = this.screenUsers[userId];
				screenUser.playVideo();
			}
			this.localUser.playVideo();
		}
		updateUserButtons() {
			const currentConnectedUserCount = this.getConnectedUserCount();
			const previousConnectedUserCount = this.cache.get('previousConnectedUserCount');
			if (currentConnectedUserCount > 1 && previousConnectedUserCount > 1) {
				return;
			}
			for (let userId in this.users) {
				if (this.users.hasOwnProperty(userId)) {
					this.users[userId].allowPinButton = currentConnectedUserCount > 1;
				}
			}
		}
		updateButtons(skippedElementsList = []) {
			if (!this.elements.panel) {
				return;
			}
			if (!skippedElementsList.includes('panel')) {
				const buttonList = this.getButtonList();
				if (this.needToRerenderButtonList) {
					main_core.Dom.clean(this.elements.panel);
					main_core.Dom.append(this.renderButtons(buttonList, this.needToRerenderButtonList), this.elements.panel);
					this.needToRerenderButtonList = false;
				} else {
					this.renderButtons(buttonList);
				}
			}
			if (this.elements.topPanel) {
				const topButtonList = this.getTopButtonList();
				if (this.needToRerenderTopButtonList) {
					main_core.Dom.clean(this.elements.topPanel);
				}
				this.renderTopButtons(topButtonList, this.needToRerenderTopButtonList);
				this.needToRerenderTopButtonList = false;
			}
			if (this.buttons.participantsMobile) {
				this.buttons.participantsMobile.setCount(this.getConnectedUserCount(true));
			}
			if (this.showCallcontrolPromoPopupTimeout) {
				clearTimeout(this.showCallcontrolPromoPopupTimeout);
			}
			if (this.needToShowCallcontrolPromo) {
				this.showCallcontrolPromoPopupTimeout = setTimeout(() => {
					if (this.size !== View.Size.Folded) {
						this.createAhaMomentNotifyCallcontrol();
					}
				}, 1500);
			}
			this.renderAddUserButtonInList();
			if (this.pictureInPictureCallWindow) {
				const blockedButtons = this.getBlockedButtonsListPictureInPictureCallWindow();
				this.pictureInPictureCallWindow.syncBlockButtons(blockedButtons);
			}
		}
		updateUserData(userData) {
			for (let userId in userData) {
				if (!this.userData[userId]) {
					this.userData[userId] = {
						name: '',
						avatar_hr: '',
						gender: 'M'
					};
				}
				if (userData[userId].name) {
					this.userData[userId].name = userData[userId].name;
				}
				if (userData[userId].avatar_hr) {
					this.userData[userId].avatar_hr = call_core.Util.isAvatarBlank(userData[userId].avatar_hr) ? '' : userData[userId].avatar_hr;
				} else if (userData[userId].avatar) {
					this.userData[userId].avatar_hr = call_core.Util.isAvatarBlank(userData[userId].avatar) ? '' : userData[userId].avatar;
				}
				if (userData[userId].gender) {
					this.userData[userId].gender = userData[userId].gender === 'F' ? 'F' : 'M';
				}
				const userModel = this.userRegistry.get(userId);
				if (userModel) {
					userModel.name = this.userData[userId].name;
					userModel.avatar = checkAndEncodeURI(this.userData[userId].avatar_hr);
				}
			}
		}
		isScreenSharingSupported() {
			return navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === "function" || typeof BXDesktopSystem !== "undefined";
		}
		isRecordingHotKeySupported() {
			return typeof BXDesktopSystem !== "undefined" && BXDesktopSystem.ApiVersion() >= 60;
		}
		isFullScreenSupported() {
			if (BX.browser.IsChrome() || BX.browser.IsSafari()) {
				return document.webkitFullscreenEnabled === true;
			} else if (BX.browser.IsFirefox()) {
				return document.fullscreenEnabled === true;
			} else {
				return false;
			}
		}
		toggleEars() {
			this.toggleTopEar();
			this.toggleBottomEar();
			if (this.layout == Layouts.Grid && this.pagesCount > 1 && this.currentPage > 1) {
				this.elements.pageNavigatorLeft.classList.add("active");
			} else {
				this.elements.pageNavigatorLeft.classList.remove("active");
			}
			if (this.layout == Layouts.Grid && this.pagesCount > 1 && this.currentPage < this.pagesCount) {
				this.elements.pageNavigatorRight.classList.add("active");
			} else {
				this.elements.pageNavigatorRight.classList.remove("active");
			}
		}
		toggleTopEar() {
			if (this.layout !== Layouts.Grid && this.pagesCount > 1) {
				this.elements.ear.top.classList.add("active");
			} else {
				this.elements.ear.top.classList.remove("active");
			}
		}
		toggleBottomEar() {
			if (this.layout !== Layouts.Grid && this.pagesCount > 1) {
				this.elements.ear.bottom.classList.add("active");
			} else {
				this.elements.ear.bottom.classList.remove("active");
			}
		}
		scrollUserListUp() {
			this.stopScroll();
			this.scrollInterval = setInterval(() => this.elements.userList.container.scrollTop -= 10, 20);
		}
		scrollUserListDown() {
			this.stopScroll();
			this.scrollInterval = setInterval(() => this.elements.userList.container.scrollTop += 10, 20);
		}
		stopScroll() {
			if (this.scrollInterval) {
				clearInterval(this.scrollInterval);
				this.scrollInterval = 0;
			}
		}
		toggleRenameSliderInputLoader() {
			this.elements.renameSlider.button.classList.add('ui-btn-wait');
		}
		setHotKeyTemporaryBlock(isActive, force) {
			if (!!isActive) {
				this.hotKeyTemporaryBlock++;
			} else {
				this.hotKeyTemporaryBlock--;
				if (this.hotKeyTemporaryBlock < 0 || force) {
					this.hotKeyTemporaryBlock = 0;
				}
			}
		}
		setHotKeyActive(name, isActive) {
			if (typeof this.hotKey[name] === 'undefined') {
				return;
			}
			this.hotKey[name] = !!isActive;
		}
		isHotKeyActive(name) {
			if (!this.hotKey['all']) {
				return false;
			}
			if (this.hotKeyTemporaryBlock > 0) {
				return false;
			}
			if (this.isButtonHidden(name)) {
				return false;
			}
			if (this.isButtonBlocked(name)) {
				return false;
			}
			return !!this.hotKey[name];
		}
		showCommonRecordMenuPopup(isDesktopRecord = false) {
			if (this.#commonRecord.menuPopup) {
				this.#commonRecord.menuPopup.close();
				return;
			}
			const popupType = [call_core.CallCommonRecordState.Stopped, call_core.CallCommonRecordState.Destroyed].includes(this.commonRecordState.state) ? 'kind' : 'control';
			this.#commonRecord.menuPopup = new CommonRecordMenuPopup({
				state: this.commonRecordState.state,
				popupType,
				isDesktopRecord,
				targetContainer: this.elements.root,
				onStart: kind => {
					this.eventEmitter.emit(EventName.onCommonRecordMenu, {
						state: call_core.CallCommonRecordState.Started,
						kind
					});
				},
				onStop: () => {
					this.eventEmitter.emit(EventName.onCommonRecordMenu, {
						state: call_core.CallCommonRecordState.Stopped
					});
				},
				onPause: () => {
					let commonRecordState;
					if (this.commonRecordState.state === call_core.CallCommonRecordState.Paused) {
						this.commonRecordState.state = call_core.CallCommonRecordState.Started;
						commonRecordState = call_core.CallCommonRecordState.Resumed;
					} else {
						this.commonRecordState.state = call_core.CallCommonRecordState.Paused;
						commonRecordState = this.commonRecordState.state;
					}
					this.buttons.recordStatus.update(this.commonRecordState);
					this.eventEmitter.emit(EventName.onCommonRecordMenu, {
						state: commonRecordState
					});
				},
				onDestroy: () => {
					if (!call_core.CallCloudRecord.serviceEnabled) {
						return;
					}
					this.eventEmitter.emit(EventName.onCommonRecordMenu, {
						state: call_core.CallCommonRecordState.Destroyed
					});
				},
				onClose: () => {
					this.#commonRecord.menuPopup = null;
				}
			});
			this.#commonRecord.menuPopup.toggle();
		}
		showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId) {
			if (this.#commonRecord.infoPopup) {
				this.#commonRecord.infoPopup.close();
				return;
			}
			this.#commonRecord.infoPopup = new CloudRecordInfoPopup({
				isCloudRecordFeaturesEnabled,
				callId,
				targetContainer: this.elements.root,
				onClose: () => {
					this.#commonRecord.infoPopup = null;
				},
				turnOn: () => {
					this.showCommonRecordMenuPopup();
				}
			});
			this.#commonRecord.infoPopup.toggle();
		}
		showCommonRecordStartNotify(userId, state = call_core.CallCommonRecordState.Started) {
			if (this.#commonRecord.notify) {
				this.#commonRecord.notify.close();
				this.#commonRecord.notify = null;
			}
			const userModel = this.userRegistry.get(userId);
			const userGender = userModel && userModel.data.gender ? userModel.data.gender.toUpperCase() : 'M';
			this.#commonRecord.notify = BX.UI.Notification.Center.notify({
				position: 'top-right',
				autoHideDelay: 8000,
				closeButton: true,
				render() {
					return main_core.Dom.create('div', {
						props: {
							className: 'ui-notification-balloon-content call-cloud-record-notify'
						},
						children: [main_core.Dom.create('div', {
							props: {
								className: 'ui-notification-balloon-message'
							},
							children: [main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-notify__icon'
								}
							}), main_core.Dom.create('div', {
								props: {
									className: 'call-cloud-record-notify__message'
								},
								text: main_core.Loc.getMessage(`CALL_CLOUD_RECORD_NOTIFY_${state.toUpperCase()}_${userGender}`, {
									'#INITIATOR_NAME#': userModel?.data?.name || ''
								})
							})]
						}), main_core.Dom.create('div', {
							props: {
								className: 'ui-notification-balloon-actions'
							}
						}), this.getCloseButton()]
					});
				}
			});
		}
		closeCommonRecordPopups() {
			if (this.#commonRecord.menuPopup) {
				this.#commonRecord.menuPopup.close();
				this.#commonRecord.menuPopup = null;
			}
			if (this.#commonRecord.infoPopup) {
				this.#commonRecord.infoPopup.close();
				this.#commonRecord.infoPopup = null;
			}
			if (this.#commonRecord.notify) {
				this.#commonRecord.notify.close();
				this.#commonRecord.notify = null;
			}
		}

		/**
		 * @param { Object } params
		 * @param { string } params.title
		 * @param { string } params.message
		 * @param { string } params.yesButtonText
		 * @param { string } params.noButtonText
		 * @returns {Promise}
		 */
		showConfirmModal(params) {
			if (this.#confirmModal) {
				this.#confirmModal.close();
				this.#confirmModal = null;
			}
			return new Promise(resolve => {
				let isResolved = false;
				const resolveOnce = choice => {
					if (isResolved) {
						return;
					}
					isResolved = true;
					resolve(choice);
				};
				this.#confirmModal = new ConfirmModal({
					...params,
					targetContainer: this.elements.root,
					onClose: () => {
						this.#confirmModal = null;
						resolveOnce('close');
					},
					onClickYesButton: () => resolveOnce('yes'),
					onClickNoButton: () => resolveOnce('no')
				});
				this.#confirmModal.show();
			});
		}
		showCommonRecordStartModal() {
			this.showConfirmModal({
				title: main_core.Loc.getMessage('CALL_CLOUD_RECORD_MODAL_START_TITLE'),
				message: main_core.Loc.getMessage('CALL_CLOUD_RECORD_MODAL_START_MESSAGE'),
				yesButtonText: main_core.Loc.getMessage('CALL_CLOUD_RECORD_MODAL_START_RESUME_BUTTON')
			});
		}
		showCloudRecordPromo(isCloudRecordFeaturesEnabled, callId) {
			// TODO: Remove once PromoManager is available for conferences
			if (this.isVideoconf) {
				return;
			}
			const promoRequired = im_v2_lib_promo.PromoManager.getInstance().needToShow(CLOUD_RECORD_PROMO_ID);
			if (promoRequired) {
				this.showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId);
				im_v2_lib_promo.PromoManager.getInstance().markAsWatched(CLOUD_RECORD_PROMO_ID);
			}
		}

		// event handlers

		_onBodyClick() {
			this.eventEmitter.emit(EventName.onBodyClick);
		}
		_onCenterTouchStart(e) {
			this.centerTouchX = e.pageX;
		}
		_onCenterTouchEnd(e) {
			const delta = e.pageX - this.centerTouchX;
			if (delta > 100) {
				this.pinUser(this.getRightUser(this.centralUser.id));
				e.preventDefault();
			}
			if (delta < -100) {
				this.pinUser(this.getLeftUser(this.centralUser.id));
				e.preventDefault();
			}
		}
		_onFullScreenChange() {
			if ('webkitFullscreenElement' in document) {
				this.isFullScreen = Boolean(document.webkitFullscreenElement);
			} else if ('fullscreenElement' in document) {
				this.isFullScreen = Boolean(document.fullscreenElement);
			} else {
				return;
			}

			// safari workaround
			setTimeout(() => {
				if (!this.elements.root) {
					return;
				}
				this.eventEmitter.emit(EventName.onFullScreenChange, {
					isFullScreen: this.isFullScreen
				});
				if (this.isFullScreen) {
					main_core.Dom.addClass(this.elements.root, 'bx-messenger-videocall-fullscreen');
				} else {
					main_core.Dom.removeClass(this.elements.root, 'bx-messenger-videocall-fullscreen');
				}
				this.updateUserList();
				this.updateButtons();
				this.setUserBlockFolded(this.isFullScreen);
			}, 0);
		}
		_onIntersectionChange(entries) {
			let t = {};
			entries.forEach(function (intersectionEntry) {
				t[intersectionEntry.target.dataset.userId] = intersectionEntry.isIntersecting;
			});
			for (let userId in t) {
				if (this.users[userId]) {
					this.users[userId].visible = t[userId];
				}
				if (userId == this.localUser.id) {
					this.localUser.visible = t[userId];
				}
			}
		}
		_onResize() {
			// this.resizeCalled++;
			// this.reportResizeCalled();

			if (!this.elements.root) {
				return;
			}
			if (this.centralUser) ;
			if (BX.browser.IsMobile()) {
				document.documentElement.style.setProperty('--view-height', window.innerHeight + 'px');
			}
			if (this.layout == Layouts.Grid || this.layout == Layouts.Centered) {
				this.updateUserList();
			} else {
				this.updateCentralUserAvatarSize();
				this.toggleEars();
			}
			const rootDimensions = this.elements.root.getBoundingClientRect();
			this.elements.root.classList.toggle("bx-messenger-videocall-width-lt-450", rootDimensions.width < 450);
			this.elements.root.classList.toggle("bx-messenger-videocall-width-lt-550", rootDimensions.width < 550);
			this.elements.root.classList.toggle("bx-messenger-videocall-width-lt-650", rootDimensions.width < 650);
			this.elements.root.classList.toggle("bx-messenger-videocall-width-lt-700", rootDimensions.width < 700);
			this.elements.root.classList.toggle("bx-messenger-videocall-width-lt-850", rootDimensions.width < 850);
			this.elements.root.classList.toggle("bx-messenger-videocall-width-lt-900", rootDimensions.width < 900);
			this.elements.root.classList.toggle("bx-messenger-videocall-width-lt-1050", rootDimensions.width < 1050);

			/*if (this.maxWidth === 0)
			{
				this.elements.root.style.maxWidth = this.container.clientWidth + 'px';
			}*/

			if (this.checkPanelOverflow()) {
				this.updateButtons();
				if (this.overflownButtonsPopup && !Object.keys(this.overflownButtons).length) {
					this.overflownButtonsPopup.close();
				}
			}
		}
		_onOrientationChange() {
			if (!this.elements.root) {
				return;
			}
			if (window.innerHeight > window.innerWidth) {
				this.elements.root.classList.remove("orientation-landscape");
			} else {
				this.elements.root.classList.add("orientation-landscape");
			}
		}
		_destroyHotKeyHint() {
			if (!call_core.Util.isDesktop()) {
				return;
			}
			if (!this.hintManager.popup) {
				return;
			}

			// we need to destroy, not .hide for onShow event handler (see method _showHotKeyHint).
			this.hintManager.hide();
			this.hintManager.popup.destroy();
			this.hintManager.popup = null;
		}
		_onKeyDown(e) {
			if (!call_core.Util.isDesktop()) {
				return;
			}
			if (!(e.shiftKey && (e.ctrlKey || e.metaKey)) && !(e.code === 'Space')) {
				return;
			}
			if (event.repeat) {
				return;
			}
			const callMinimized = this.size === View.Size.Folded;
			if (e.code === 'KeyA' && this.isHotKeyActive('microphone')) {
				e.preventDefault();
				if (this.deviceSelector) {
					this.deviceSelector.destroy();
				}
				this._onMicrophoneButtonClick(e);
			} else if (e.code === 'Space' && call_core.Hardware.isMicrophoneMuted && this.isHotKeyActive('microphoneSpace')) {
				if (!callMinimized) {
					e.preventDefault();
					this.pushToTalk = true;
					this.microphoneHotkeyTimerId = setTimeout(function () {
						if (this.deviceSelector) {
							this.deviceSelector.destroy();
						}
						this._onMicrophoneButtonClick(e);
					}.bind(this), 100);
				}
			} else if (e.code === 'KeyS' && this.isHotKeyActive('screen')) {
				e.preventDefault();
				this._onScreenButtonClick(e);
			} else if (e.code === 'KeyV' && this.isHotKeyActive('camera')) {
				e.preventDefault();
				if (this.deviceSelector) {
					this.deviceSelector.destroy();
				}
				this._onCameraButtonClick(e);
			} else if (e.code === 'KeyU' && this.isHotKeyActive('users')) {
				e.preventDefault();
				this._onUsersButtonClick(e);
			} else if (e.code === 'KeyR' && this.isRecordingHotKeySupported() && this.isHotKeyActive('record')) {
				e.preventDefault();
				this.#onCommonRecordHotkey();
			} else if (e.code === 'KeyH' && this.isHotKeyActive('floorRequest')) {
				e.preventDefault();
				this._onFloorRequestButtonClick(e);
			} else if (e.code === 'KeyC' && this.isHotKeyActive('chat')) {
				e.preventDefault();
				if (callMinimized) {
					this._onBodyClick(e);
				} else {
					this._onChatButtonClick(e);
					this._destroyHotKeyHint();
				}
			} else if (e.code === 'KeyM' && this.isHotKeyActive('muteSpeaker')) {
				e.preventDefault();
				this.eventEmitter.emit(EventName.onButtonClick, {
					buttonName: "toggleSpeaker",
					speakerMuted: this.speakerMuted,
					fromHotKey: true
				});
			} else if (e.code === 'KeyW' && this.isHotKeyActive('grid')) {
				e.preventDefault();
				this.setLayout(this.layout == Layouts.Centered ? Layouts.Grid : Layouts.Centered);
			}
		}
		_onKeyUp(e) {
			if (!call_core.Util.isDesktop()) {
				return;
			}
			clearTimeout(this.microphoneHotkeyTimerId);
			if (this.pushToTalk && !call_core.Hardware.isMicrophoneMuted && e.code === 'Space') {
				e.preventDefault();
				this.pushToTalk = false;
				if (this.deviceSelector) {
					this.deviceSelector.destroy();
				}
				this._onMicrophoneButtonClick(e);
			}
		}
		_onUserClick(event) {
			const userId = event.userId;
			if (userId == this.centralUser.id && this.layout !== Layouts.Grid && this.isFullScreen) {
				main_core.Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-hidden-panels');
			} else if (this.layout === Layouts.Centered && userId != this.centralUser.id) {
				this.pinUser(userId);
			} else {
				this.pinnedUser && this.pinnedUser.id === userId ? this._onUserUnPin() : this._onUserPin({
					userId
				});
			}
			this.eventEmitter.emit(EventName.onUserClick, {
				userId,
				stream: userId == this.userId ? this.localUser.stream : this.users[userId].stream,
				layout: this.layout
			});
		}
		_onUserRename(newName) {
			this.eventEmitter.emit(EventName.onUserRename, {
				newName: newName
			});
		}
		_onUserRenameInputFocus() {
			this.setHotKeyTemporaryBlock(true);
		}
		_onUserRenameInputBlur() {
			this.setHotKeyTemporaryBlock(false);
		}
		_onUserPin(e) {
			if (this.layout == Layouts.Grid) {
				this.setLayout(Layouts.Centered);
			}
			this.pinUser(e.userId);
		}
		_onUserUnPin() {
			if (this.layout === Layouts.Centered) {
				this.setLayout(Layouts.Grid);
			} else {
				this.unpinUser();
			}
		}
		_onTurnOffParticipantMic(e) {
			this.eventEmitter.emit(EventName.onTurnOffParticipantMic, {
				userId: e.userId
			});
		}
		_onTurnOffParticipantCam(e) {
			this.eventEmitter.emit(EventName.onTurnOffParticipantCam, {
				userId: e.userId
			});
		}
		_onTurnOffParticipantScreenshare(e) {
			this.eventEmitter.emit(EventName.onTurnOffParticipantScreenshare, {
				userId: e.userId
			});
		}
		#onCommonRecordClick() {
			const limitObj = this.getRecordLimitation();
			this.onClickButtonWithLimit(limitObj, () => {
				this.eventEmitter.emit(EventName.onButtonClick, {
					buttonName: 'record'
				});
			});
		}
		#onCommonRecordHotkey() {
			const limitObj = this.getRecordLimitation();
			this.onClickButtonWithLimit(limitObj, () => {
				const state = [call_core.CallCommonRecordState.Stopped, call_core.CallCommonRecordState.Destroyed].includes(this.commonRecordState.state) ? call_core.CallCommonRecordState.Started : call_core.CallCommonRecordState.Stopped;
				this.eventEmitter.emit(EventName.onCommonRecordMenu, {
					state,
					hotkey: true
				});
			});
		}
		_onDocumentButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'document',
				node: e.target
			});
		}
		_onCopilotButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'copilot',
				node: e.target
			});
		}
		_onGridButtonClick() {
			this.setLayout(this.layout == Layouts.Centered ? Layouts.Grid : Layouts.Centered);
		}
		_onAddButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: "inviteUser",
				node: e.currentTarget
			});
		}
		_onShareButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: "share",
				node: e.currentTarget
			});
		}
		_onMicrophoneButtonClick(e) {
			if (this.isButtonBlocked('microphone')) {
				return;
			}
			if ("stopPropagation" in e) {
				e.stopPropagation();
			}
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: "toggleMute",
				muted: !call_core.Hardware.isMicrophoneMuted
			});
		}
		_onMicrophoneArrowClick(e) {
			e.stopPropagation();
			this.showDeviceSelector(e.currentTarget);
		}
		_onMicrophoneSideIconClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: "microphoneSideIcon"
			});
		}
		_onMicrophoneSelected(e) {
			this.eventEmitter.emit(EventName.onReplaceMicrophone, {
				deviceId: e.data.deviceId
			});
		}
		_onCameraButtonClick(e) {
			if (this.isButtonBlocked('camera')) {
				return;
			}
			if ("stopPropagation" in e) {
				e.stopPropagation();
			}
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: "toggleVideo",
				video: !call_core.Hardware.isCameraOn
			});
		}
		_onCameraArrowClick(e) {
			e.stopPropagation();
			this.showDeviceSelector(e.currentTarget);
		}
		_onCameraSelected(e) {
			this.eventEmitter.emit(EventName.onReplaceCamera, {
				deviceId: e.data.deviceId
			});
		}
		_onSpeakerButtonClick() {
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: "toggleSpeaker",
				speakerMuted: this.speakerMuted
			});
		}
		_onChangeNoiseSuppression(e) {
			this.eventEmitter.emit(EventName.onChangeNoiseSuppression, e.data);
		}
		_onChangeMicAutoParams(e) {
			this.eventEmitter.emit(EventName.onChangeMicAutoParams, e.data);
		}
		_onChangeFaceImprove(e) {
			this.eventEmitter.emit(EventName.onChangeFaceImprove, e.data);
		}
		_onChangeVideoQuality(e) {
			this.eventEmitter.emit(EventName.onChangeVideoQuality, e.data);
		}
		disableFaceImprove() {
			if (call_core.Util.isDesktop() && im_v2_lib_desktopApi.DesktopApi.isDesktop() && im_v2_lib_desktopApi.DesktopApi.getCameraSmoothingStatus()) {
				this.eventEmitter.emit(EventName.onChangeFaceImprove, {
					faceImproveEnabled: false
				});
			}
		}
		_onSpeakerSelected(e) {
			if (!this.externalSpeakerManagement) {
				this.setSpeakerId(e.data.deviceId);
			}
			this.eventEmitter.emit(EventName.onReplaceSpeaker, {
				deviceId: e.data.deviceId
			});
		}
		confirmSpeakerSelection(deviceId) {
			this.speakerId = deviceId;
			if (this.deviceSelector) {
				this.deviceSelector.confirmSpeakerSelection(deviceId);
			}
		}
		_onScreenButtonClick(e) {
			e.stopPropagation();
			const limitObj = this.getScreenSharingLimitation();
			this.onClickButtonWithLimit(limitObj, () => {
				this.eventEmitter.emit(EventName.onButtonClick, {
					buttonName: 'toggleScreenSharing',
					node: e.target
				});
			});
		}
		_onChatButtonClick(e) {
			this.hintManager.hide();
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'showChat',
				node: e.target
			});
		}
		_onUsersButtonClick(e) {
			this.hintManager.hide();
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'toggleUsers',
				node: e.target
			});
		}
		_onMobileMenuButtonClick(e) {
			e.stopPropagation();
			this.showCallMenu();
		}
		_onFloorRequestButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'floorRequest',
				node: e.target
			});
		}
		_onMoreButtonClick(e) {
			e.stopPropagation();
			if (this.overflownButtonsPopup) {
				this.overflownButtonsPopup.close();
				this.buttons.more.setActive(false);
			} else {
				this.showOverflownButtonsPopup();
				this.buttons.more.setActive(true);
			}
		}
		_onHistoryButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'showHistory',
				node: e.target
			});
		}
		_onHangupButtonClick(e) {
			e.stopPropagation();
			this.clearNewLogicRules();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'hangup',
				node: e.target
			});
		}
		_onHangupOptionsButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'hangupOptions',
				node: e.target
			});
		}
		_onCloseButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'close',
				node: e.target
			});
		}
		_onFullScreenButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'fullscreen',
				node: e.target
			});
		}
		_onFeedbackButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'feedback',
				node: e.target
			});
		}
		_onLinkButtonClick() {
			if (!this.#guestLink) {
				return;
			}
			const notifyCopied = () => {
				BX.UI.Notification.Center.notify({
					content: BX.message('CALL_VIEW_GUEST_LINK_COPIED'),
					autoHideDelay: 5000,
					useAirDesign: true
				});
			};
			const notifyError = () => {
				BX.UI.Notification.Center.notify({
					content: BX.message('CALL_VIEW_GUEST_LINK_COPY_ERROR'),
					autoHideDelay: 5000,
					useAirDesign: true
				});
			};
			call_adapter_clipboard.Clipboard.copy(this.#guestLink).then(notifyCopied).catch(notifyError);
		}
		_onCallcontrolButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'callcontrol',
				node: e.target
			});
			if (this.ahaMomentNotifyCallcontrol) {
				im_v2_lib_promo.PromoManager.getInstance().markAsWatched(CALLCONTROL_PROMO_ID);
			}
			this.clearCallcontrolPromo();
		}
		_onParticipantsButtonListClick(event) {
			if (!this.isButtonBlocked('users')) {
				this._onUsersButtonClick(event);
				return;
			}
			if (!this.isFullScreen) {
				return;
			}
			this.setUserBlockFolded(!this.isUserBlockFolded);
		}
		_onParticipantsListButtonClick(e) {
			e.stopPropagation();
			const viewEvent = new main_core_events.BaseEvent({
				data: {
					buttonName: 'participantsList',
					node: e.target
				},
				compatData: ['participantsList', e.target]
			});
			this.eventEmitter.emit(EventName.onButtonClick, viewEvent);
			if (viewEvent.isDefaultPrevented()) {
				return;
			}
			UserSelector.create({
				parentElement: e.currentTarget,
				zIndex: this.baseZIndex + 500,
				userList: Object.values(this.users),
				current: this.centralUser.id,
				onSelect: userId => this.setCentralUser(userId)
			}).show();
		}
		_onParticipantsButtonMobileListClick() {
			this.showParticipantsMenu();
		}
		_onMobileCallMenuFloorRequestClick() {
			this.callMenu.close();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'floorRequest'
			});
		}
		_onMobileCallMenShowParticipantsClick() {
			this.callMenu.close();
			this.showParticipantsMenu();
		}
		_onMobileCallMenuCopyInviteClick() {
			this.callMenu.close();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: "share",
				node: null
			});
		}
		showRenameSlider() {
			if (!this.renameSlider) {
				this.renameSlider = new MobileSlider({
					parent: this.elements.root,
					content: this.renderRenameSlider(),
					onClose: () => this.renameSlider.destroy(),
					onDestroy: () => this.renameSlider = null
				});
			}
			this.renameSlider.show();
			setTimeout(() => {
				this.elements.renameSlider.input.focus();
				this.elements.renameSlider.input.select();
			}, 400);
		}
		renderRenameSlider() {
			return main_core.Dom.create("div", {
				props: {
					className: "bx-videocall-mobile-rename-slider-wrap"
				},
				children: [main_core.Dom.create("div", {
					props: {
						className: "bx-videocall-mobile-rename-slider-title"
					},
					text: BX.message("IM_M_CALL_MOBILE_MENU_CHANGE_MY_NAME")
				}), this.elements.renameSlider.input = main_core.Dom.create("input", {
					props: {
						className: "bx-videocall-mobile-rename-slider-input"
					},
					attrs: {
						type: "text",
						value: this.localUser.userModel.name
					}
				}), this.elements.renameSlider.button = main_core.Dom.create("button", {
					props: {
						className: "bx-videocall-mobile-rename-slider-button ui-btn ui-btn-md ui-btn-primary"
					},
					text: BX.message("IM_M_CALL_MOBILE_RENAME_CONFIRM"),
					events: {
						click: this._onMobileUserRename.bind(this)
					}
				})]
			});
		}
		_onMobileUserRename(event) {
			event.stopPropagation();
			const inputValue = this.elements.renameSlider.input.value;
			const newName = inputValue.trim();
			let needToUpdate = true;
			if (newName === this.localUser.userModel.name || newName === '') {
				needToUpdate = false;
			}
			if (needToUpdate) {
				this.toggleRenameSliderInputLoader();
				this._onUserRename(newName);
			} else {
				this.renameSlider.close();
			}
		}
		_onMobileCallMenuCancelClick() {
			this.callMenu.close();
		}
		_onLeftEarClick() {
			this.pinUser(this.getLeftUser(this.centralUser.id));
		}
		_onRightEarClick() {
			this.pinUser(this.getRightUser(this.centralUser.id));
		}
		_onLeftPageNavigatorClick(e) {
			e.stopPropagation();
			this.setCurrentPage(this.currentPage - 1);
		}
		_onRightPageNavigatorClick(e) {
			e.stopPropagation();
			this.setCurrentPage(this.currentPage + 1);
		}
		_onTopPageNavigatorClick(e) {
			e.stopPropagation();
			this.setCurrentPage(this.currentPage !== 1 ? this.currentPage - 1 : this.pagesCount);
		}
		_onBottomPageNavigatorClick(e) {
			e.stopPropagation();
			this.setCurrentPage(this.currentPage !== this.pagesCount ? this.currentPage + 1 : 1);
		}
		setMaxWidth(maxWidth) {
			if (this.maxWidth !== maxWidth) {
				const MAX_WIDTH_SPEAKER_MODE = 650;
				if (maxWidth < MAX_WIDTH_SPEAKER_MODE && (!this.maxWidth || this.maxWidth > MAX_WIDTH_SPEAKER_MODE) && this.layout === Layouts.Centered) {
					this.setLayout(Layouts.Grid);
				}
				const animateUnsetProperty = this.maxWidth === null;
				this.maxWidth = maxWidth;
				if (this.size !== View.Size.Folded) {
					this._applyMaxWidth(animateUnsetProperty);
				}
			}
		}
		removeMaxWidth() {
			this.setMaxWidth(null);
		}
		_applyMaxWidth(animateUnsetProperty) {
			const containerDimensions = this.container.getBoundingClientRect();
			if (this.maxWidth !== null) {
				if (!this.elements.root.style.maxWidth && animateUnsetProperty) {
					this.elements.root.style.maxWidth = containerDimensions.width + 'px';
				}
				setTimeout(() => this.elements.root.style.maxWidth = Math.max(this.maxWidth, MIN_WIDTH) + 'px', 0);
			} else {
				this.elements.root.style.maxWidth = containerDimensions.width + 'px';
				this.elements.root.addEventListener('transitionend', () => this.elements.root.style.removeProperty('max-width'), {
					once: true
				});
			}
		}
		releaseLocalMedia() {
			this.localUser.releaseStream();
			if (this.centralUser.id == this.userId) {
				this.centralUser.releaseStream();
			}
		}
		clearNewLogicRules() {
			clearTimeout(this.rerenderTimeout);
			this.rerenderTimeout = null;
			this.waitingForUserMediaTimeouts.forEach(timeout => clearTimeout(timeout));
			this.waitingForUserMediaTimeouts.clear();
			this.rerenderQueue.clear();
		}
		clearCallcontrolPromo() {
			if (this.showCallcontrolPromoPopupTimeout) {
				clearTimeout(this.showCallcontrolPromoPopupTimeout);
			}
			if (this.ahaMomentNotifyCallcontrol) {
				this.needToShowCallcontrolPromo = false;
				this.ahaMomentNotifyCallcontrol.close();
				this.ahaMomentNotifyCallcontrol = null;
			}
		}
		resetTalkingUsers() {
			this.userRegistry.users.forEach(userModel => {
				if (!userModel.localUser && userModel.talking) {
					this.setUserTalking(userModel.id, false);
				}
			});
		}
		destroy() {
			this.destroyed = true;
			this.closeCopilotNotify();
			this.closeCommonRecordPopups();
			if (this.overflownButtonsPopup) {
				this.overflownButtonsPopup.close();
			}
			this.preferInitialWindowPlacementPictureInPicture = true;
			if (this.elements.root) {
				main_core.Dom.remove(this.elements.root);
				this.elements.root = null;
			}
			this.visible = false;
			this.clearNewLogicRules();
			window.removeEventListener("webkitfullscreenchange", this._onFullScreenChangeHandler);
			window.removeEventListener("mozfullscreenchange", this._onFullScreenChangeHandler);
			window.removeEventListener("orientationchange", this._onOrientationChangeHandler);
			window.removeEventListener("keydown", this._onKeyDownHandler);
			window.removeEventListener("keyup", this._onKeyUpHandler);
			document.removeEventListener('mousemove', this.onMouseMoveHandler);
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
			if (this.intersectionObserver) {
				this.intersectionObserver.disconnect();
				this.intersectionObserver = null;
			}
			for (let userId in this.users) {
				if (this.users.hasOwnProperty(userId)) {
					this.users[userId].userModel.unsubscribe('changed', this.talkingService.watchTalking);
					this.users[userId].destroy();
				}
			}
			this.userData = null;
			this.centralUser.userModel.unsubscribe('changed', this.talkingService.watchTalking);
			this.userRegistry.unsubscribe('changed', this.talkingService.refreshQueue);
			this.talkingService.destroy();
			this.centralUser.destroy();
			this.hintManager.hide();
			this.hintManager = null;
			clearTimeout(this.switchPresenterTimeout);
			if (this.buttons.recordStatus) {
				this.buttons.recordStatus.stopViewUpdate();
			}
			this.commonRecordState = this.getDefaultCommonRecordState();
			this.buttons = null;
			this.eventEmitter.emit(EventName.onDestroy);
			this.eventEmitter.unsubscribeAll();
			call_core.Hardware.unsubscribe(call_core.Hardware.Events.onChangeMicrophoneMuted, this.setMuted);
			call_core.Hardware.unsubscribe(call_core.Hardware.Events.onChangeCameraOn, this.setCameraState);
			this.clearCallcontrolPromo();
			this.pipCoordinator?.stop();
			this.pipCoordinator = null;
			if (this.deviceSelector) {
				this.deviceSelector.destroy();
			}
		}
		static Event = call_mapping.ViewEvent;
		static Layout = call_mapping.ViewLayout;
		static UiState = call_mapping.ViewUiState;
		static Size = call_mapping.ViewSize;
		static RoomState = call_mapping.ViewRoomState;
		static RecordSource = call_mapping.ViewRecordSource;
		static DeviceSelector = DeviceSelector;
		static MIN_WIDTH = MIN_WIDTH;
	}

	class LegacyCallViewAdapter {
		constructor(view) {
			this.wrappedView = view;
		}

		// region Properties

		get speakerId() {
			return this.wrappedView.speakerId;
		}
		get speakerMuted() {
			return this.wrappedView.speakerMuted;
		}
		get visible() {
			return this.wrappedView.visible;
		}
		get size() {
			return this.wrappedView.size;
		}
		get isFullScreen() {
			return this.wrappedView.isFullScreen;
		}
		get isPreparing() {
			return this.wrappedView.isPreparing;
		}
		set isPreparing(value) {
			this.wrappedView.isPreparing = value;
		}
		get isActivePiPFromController() {
			return this.wrappedView.isActivePiPFromController;
		}
		set isActivePiPFromController(value) {
			this.wrappedView.isActivePiPFromController = value;
		}
		get microphoneId() {
			return this.wrappedView.microphoneId;
		}
		set microphoneId(value) {
			this.wrappedView.microphoneId = value;
		}
		get container() {
			return this.wrappedView.container;
		}
		get enableAutoPip() {
			return this.wrappedView.enableAutoPip;
		}
		get buttons() {
			return this.wrappedView.buttons;
		}
		get elements() {
			return this.wrappedView.elements;
		}
		get localUser() {
			return this.wrappedView.localUser;
		}
		get userRegistry() {
			return this.wrappedView.userRegistry;
		}
		get talkingService() {
			return this.wrappedView.talkingService;
		}
		isHidden() {
			return this.wrappedView.isHidden();
		}
		get renameSlider() {
			return this.wrappedView.renameSlider;
		}

		// endregion

		// region Lifecycle

		show() {
			this.wrappedView.show();
		}
		hide() {
			this.wrappedView.hide();
		}
		close() {
			this.wrappedView.close();
		}
		destroy() {
			this.wrappedView.destroy();
		}

		// endregion

		// region Users

		addUser(userId, state, direction) {
			this.wrappedView.addUser(userId, state, direction);
		}
		appendUsers(userStates) {
			this.wrappedView.appendUsers(userStates);
		}
		updateUserData(userData) {
			this.wrappedView.updateUserData(userData);
		}
		setLocalUserId(userId) {
			this.wrappedView.setLocalUserId(userId);
		}
		setLocalUserDirection(direction) {
			this.wrappedView.setLocalUserDirection(direction);
		}
		setUserState(userId, newState) {
			this.wrappedView.setUserState(userId, newState);
		}
		setUserMicrophoneState(userId, isMicrophoneOn) {
			this.wrappedView.setUserMicrophoneState(userId, isMicrophoneOn);
		}
		setUserCameraState(userId, cameraState) {
			this.wrappedView.setUserCameraState(userId, cameraState);
		}
		setUserVideoPaused(userId, videoPaused) {
			this.wrappedView.setUserVideoPaused(userId, videoPaused);
		}
		setUserMedia(userId, kind, track) {
			this.wrappedView.setUserMedia(userId, kind, track);
		}
		setUserConnectionQuality(userId, connectionQuality) {
			this.wrappedView.setUserConnectionQuality(userId, connectionQuality);
		}
		setUserFloorRequestState(userId, userFloorRequestState) {
			this.wrappedView.setUserFloorRequestState(userId, userFloorRequestState);
		}
		setUserTalking(userId, talking) {
			this.wrappedView.setUserTalking(userId, talking);
		}
		setUserPermissionToSpeakState(userId, permissionToSpeakState) {
			this.wrappedView.setUserPermissionToSpeakState(userId, permissionToSpeakState);
		}
		setAllUserPermissionToSpeakState(permissionToSpeakState) {
			this.wrappedView.setAllUserPermissionToSpeakState(permissionToSpeakState);
		}
		setUserScreenState(userId, screenState) {
			this.wrappedView.setUserScreenState(userId, screenState);
		}
		setUserStats(userId, stats, mediaServerId) {
			this.wrappedView.setUserStats(userId, stats, mediaServerId);
		}
		setUserDirection(userId, direction) {
			this.wrappedView.setUserDirection(userId, direction);
		}
		removeScreenUsers() {
			this.wrappedView.removeScreenUsers();
		}
		getUserFloorRequestState(userId) {
			return this.wrappedView.getUserFloorRequestState(userId);
		}
		getUserTalking(userId) {
			return this.wrappedView.getUserTalking(userId);
		}
		getConnectedUserCount(withYou) {
			return this.wrappedView.getConnectedUserCount(withYou);
		}
		pinUser(userId) {
			this.wrappedView.pinUser(userId);
		}
		unpinUser() {
			this.wrappedView.unpinUser();
		}
		resetTalkingUsers() {
			this.wrappedView.resetTalkingUsers();
		}
		notifyUserJoined(userId) {
			// no-op: legacy handles this internally
		}
		notifyUserLeft(userId) {
			// no-op: legacy handles this internally
		}

		// endregion

		// region Buttons

		setButtonActive(buttonName, isActive) {
			this.wrappedView.setButtonActive(buttonName, isActive);
		}
		setButtonCounter(buttonName, counter) {
			this.wrappedView.setButtonCounter(buttonName, counter);
		}
		blockButtons(buttons) {
			this.wrappedView.blockButtons(buttons);
		}
		unblockButtons(buttons) {
			this.wrappedView.unblockButtons(buttons);
		}
		blockAddUser() {
			this.wrappedView.blockAddUser();
		}
		unblockAddUser() {
			this.wrappedView.unblockAddUser();
		}
		blockSwitchCamera() {
			this.wrappedView.blockSwitchCamera();
		}
		unblockSwitchCamera() {
			this.wrappedView.unblockSwitchCamera();
		}
		blockSwitchMicrophone() {
			this.wrappedView.blockSwitchMicrophone();
		}
		unblockSwitchMicrophone() {
			this.wrappedView.unblockSwitchMicrophone();
		}
		blockScreenSharing() {
			this.wrappedView.blockScreenSharing();
		}
		blockHistoryButton() {
			this.wrappedView.blockHistoryButton();
		}
		disableMediaSelection() {
			this.wrappedView.disableMediaSelection();
		}
		enableMediaSelection() {
			this.wrappedView.enableMediaSelection();
		}
		showButtons(buttons) {
			this.wrappedView.showButtons(buttons);
		}
		hideButtons(buttons) {
			// Legacy View handles hidden buttons internally via constructor config — no-op
		}
		updateButtons(skippedElementsList) {
			this.wrappedView.updateButtons(skippedElementsList);
		}
		isButtonBlocked(buttonName) {
			return this.wrappedView.isButtonBlocked(buttonName);
		}
		getButtonElement(buttonId, elementType = 'root') {
			return this.wrappedView.buttons[buttonId]?.elements?.[elementType] ?? null;
		}
		setGuestLink(link) {
			this.wrappedView.setGuestLink(link);
		}

		// endregion

		// region UI State

		setUiState(uiState) {
			this.wrappedView.setUiState(uiState);
		}
		setLayout(newLayout) {
			this.wrappedView.setLayout(newLayout);
		}
		setSize(size) {
			this.wrappedView.setSize(size);
		}
		setTitle(title) {
			this.wrappedView.setTitle(title);
		}
		setMaxWidth(maxWidth) {
			this.wrappedView.setMaxWidth(maxWidth);
		}
		removeMaxWidth() {
			this.wrappedView.removeMaxWidth();
		}
		setWindowFocusState(isActive) {
			this.wrappedView.setWindowFocusState(isActive);
		}
		setRoomState(roomState) {
			this.wrappedView.setRoomState(roomState);
		}
		setHotKeyTemporaryBlock(isActive, force) {
			this.wrappedView.setHotKeyTemporaryBlock(isActive, force);
		}
		toggleStatePictureInPictureCallWindow(isActive) {
			this.wrappedView.toggleStatePictureInPictureCallWindow(isActive);
		}

		// endregion

		// region Media

		setLocalStream(streamData) {
			this.wrappedView.setLocalStream(streamData);
		}
		setLocalStreamVideoTrack(videoTrack) {
			this.wrappedView.setLocalStreamVideoTrack(videoTrack);
		}
		flipLocalVideo(flipVideo) {
			this.wrappedView.flipLocalVideo(flipVideo);
		}
		setMicrophoneId(microphoneId) {
			this.wrappedView.setMicrophoneId(microphoneId);
		}
		setSpeakerId(speakerId) {
			this.wrappedView.setSpeakerId(speakerId);
		}
		setCameraId(cameraId) {
			this.wrappedView.setCameraId(cameraId);
		}
		muteSpeaker(mute) {
			this.wrappedView.muteSpeaker(mute);
		}
		releaseLocalMedia() {
			this.wrappedView.releaseLocalMedia();
		}
		trackAvailabilityChanged(userId, kind, available) {
			this.wrappedView.trackAvailabilityChanged(userId, kind, available);
		}
		setVideoRenderer(userId, mediaRenderer) {
			this.wrappedView.setVideoRenderer(userId, mediaRenderer);
		}
		releaseVideoRenderer(userId) {
			// no-op: legacy View manages renderer lifecycle internally
		}
		setBadNetworkIndicator(userId, badNetworkIndicator) {
			this.wrappedView.setBadNetworkIndicator(userId, badNetworkIndicator);
		}
		setTrackSubscriptionFailed(data) {
			this.wrappedView.setTrackSubscriptionFailed(data);
		}
		setMicrophoneLevel(level) {
			this.wrappedView.setMicrophoneLevel(level);
		}
		confirmSpeakerSelection(deviceId) {
			this.wrappedView.confirmSpeakerSelection(deviceId);
		}

		// endregion

		// region Recording

		setCommonRecordState(commonRecordState) {
			this.wrappedView.setCommonRecordState(commonRecordState);
		}
		getDefaultCommonRecordState() {
			return this.wrappedView.getDefaultCommonRecordState();
		}

		// endregion

		// region Notifications & Popups

		showSelfTest() {
			this.wrappedView.showSelfTest();
		}
		showSecurityKeyError() {
			this.wrappedView.showSecurityKeyError();
		}
		showFatalError(params) {
			this.wrappedView.showFatalError(params);
		}
		showCloudRecordPromo(isCloudRecordFeaturesEnabled, callId) {
			this.wrappedView.showCloudRecordPromo(isCloudRecordFeaturesEnabled, callId);
		}
		showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId) {
			this.wrappedView.showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId);
		}
		showCommonRecordMenuPopup(isDesktopRecord) {
			this.wrappedView.showCommonRecordMenuPopup(isDesktopRecord);
		}
		showCommonRecordStartModal() {
			this.wrappedView.showCommonRecordStartModal();
		}
		showCommonRecordStartNotify(userId, state) {
			this.wrappedView.showCommonRecordStartNotify(userId, state);
		}
		showCopilotErrorNotify(errorType) {
			this.wrappedView.showCopilotErrorNotify(errorType);
		}
		showCopilotNotify(callId, errorCode) {
			this.wrappedView.showCopilotNotify(callId, errorCode);
		}
		showCopilotResultNotify() {
			this.wrappedView.showCopilotResultNotify();
		}
		closeCopilotNotify() {
			this.wrappedView.closeCopilotNotify();
		}
		updateCopilotState(isActive) {
			this.wrappedView.updateCopilotState(isActive);
		}
		updateCopilotFeatureState(isEnabled) {
			this.wrappedView.updateCopilotFeatureState(isEnabled);
		}
		updateFloorRequestNotification() {
			this.wrappedView.updateFloorRequestNotification();
		}

		// endregion

		// region Modals

		showConfirmModal(params) {
			return this.wrappedView.showConfirmModal(params);
		}

		// endregion

		// region Events

		subscribe(eventName, listener) {
			return this.wrappedView.subscribe(eventName, listener);
		}
		unsubscribe(eventName, listener) {
			return this.wrappedView.unsubscribe(eventName, listener);
		}
		setCallback(name, cb) {
			this.wrappedView.setCallback(name, cb);
		}
		removeCallback(name, cb) {
			this.wrappedView.removeCallback(name, cb);
		}

		// endregion
	}

	exports.DeviceSelector = DeviceSelector;
	exports.LegacyCallViewAdapter = LegacyCallViewAdapter;
	exports.View = View;

})(this.BX.Call.ViewExtension = this.BX.Call.ViewExtension || {}, BX, BX.Event, BX.Main, BX.Messenger.v2.Lib, BX.Call, BX.Messenger.v2.Lib, BX.UI, BX.Messenger.v2.Lib, BX.Call.Lib, BX.Call.Mapping, BX.Call.Feature, BX.Call.Adapter);
//# sourceMappingURL=call-view.bundle.js.map
