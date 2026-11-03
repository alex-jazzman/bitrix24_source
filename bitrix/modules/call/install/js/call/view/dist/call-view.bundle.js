/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_polyfill_intersectionobserver, main_core, main_core_events, main_popup, ui_a11y, im_v2_lib_desktopApi, im_v2_lib_promo, call_adapter_clipboard, call_core, call_feature_pip, call_lib_a11y, call_lib_pushToTalk, call_lib_viewContract, call_mapping, im_v2_lib_utils, ui_switcher, call_lib_analytics, ui_system_menu) {
	'use strict';

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

	class TitleButton {
		constructor(config) {
			this.elements = {
				root: null
			};
			this.text = main_core.Type.isStringFilled(config.text) ? config.text : '';
			this.isGroupCall = config.isGroupCall;
		}
		render() {
			this.elements.root = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-panel-title'
				},
				html: this.getTitle()
			});
			return this.elements.root;
		}
		getTitle() {
			const prettyName = `<span class="bx-messenger-videocall-panel-title-name">${main_core.Text.encode(this.text)}</span>`;
			if (this.isGroupCall) {
				return main_core.Loc.getMessage('IM_M_GROUP_CALL_WITH').replace('#CHAT_NAME#', prettyName);
			}
			return main_core.Loc.getMessage('IM_M_CALL_WITH').replace('#USER_NAME#', prettyName);
		}
		update(config) {
			this.text = main_core.Type.isStringFilled(config.text) ? config.text : '';
			this.isGroupCall = config.isGroupCall;
			this.elements.root.innerHTML = this.getTitle();
		}
	}

	// ARIA popup type tokens for disclosure buttons (closed vocabulary from the ARIA spec)
	const AriaHasPopup = Object.freeze({
		Menu: 'menu',
		Dialog: 'dialog'
	});

	const createCssTooltip = (options = {}) => {
		const {
			width: tooltipWidth = 'max-content',
			position: tooltipPosition = 'top',
			getText: getTooltipText = () => ''
		} = options;
		const hasTooltip = Object.keys(options).length > 0;
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

	// Wrap a click handler so a blocked button swallows the click (keyboard/mouse) but stays focusable/announced.
	function guardedClick(button, fn) {
		return (...args) => button.blocked === true ? undefined : fn(...args);
	}

	/**
	 * Test hooks of the call control panel.
	 *
	 * The button class is the identity of a panel item, so both button families derive their
	 * hooks from it instead of taking one more config field: a hook cannot drift from the item
	 * it marks, and a new button gets its hook for free.
	 *
	 * The prefix names the panel the item belongs to. Panels reuse button classes, so the class
	 * alone is not unique in the document: the call panel keeps the default prefix, a panel that
	 * lives in its own window passes its own.
	 *
	 * Nested hooks are the item hook plus a suffix, e.g. `call-panel-chat-counter`.
	 */
	function panelTestId(buttonClass, prefix = 'call-panel') {
		// class tokens come in both spellings (`floor-request`, `returnToCall`), hooks stay kebab
		const name = buttonClass.replaceAll(/([\da-z])([A-Z])/g, '$1-$2').toLowerCase();
		return `${prefix}-${name}`;
	}

	// Popup kind of the view contract mapped onto the ARIA token: the two vocabularies coincide today
	// but are not the same thing. An unknown kind maps to nothing and announces no layer at all.
	const ariaHasPopupOfKind = new Map([['menu', AriaHasPopup.Menu], ['dialog', AriaHasPopup.Dialog]]);
	class SimpleButton {
		constructor(config) {
			this.class = config.class;
			// the panel the button belongs to names the hook namespace; the button itself does not know it
			this.testId = panelTestId(this.class, config.testIdPrefix);
			this.backgroundClass = config.backgroundClass ?? '';
			this.backgroundClass = `bx-messenger-videocall-panel-icon-background${this.backgroundClass ? ' ' : ''}${this.backgroundClass}`;
			this.blocked = config.blocked === true;
			this.tooltip = createCssTooltip(main_core.Type.isPlainObject(config.tooltip) ? config.tooltip : {});
			this.text = config.text ?? '';
			this.isActive = false;
			// render() always starts the badge at zero, so there is nothing to take from the config
			this.counter = 0;
			this.isComingSoon = config.isComingSoon || false;
			// per instance: the same class renders both in the panel and in the picture-in-picture window,
			// so a fixed id would end up duplicated in the DOM
			this.comingSoonId = `bx-messenger-videocall-panel-item-coming-soon-${main_core.Text.getRandom()}`;
			// what the counter means is known to the owner of the button, not to the button:
			// the phrase takes #COUNT#, so the key is passed in and not the ready text
			this.counterDescriptionMessageKey = config.counterDescriptionMessageKey ?? '';
			// a button whose owner named no phrase never gets a description, so it needs neither id nor node
			this.counterDescriptionId = this.counterDescriptionMessageKey === '' ? '' : `bx-messenger-videocall-panel-item-counter-description-${main_core.Text.getRandom()}`;
			// accessible name for icon-only buttons; buttons with a visible text label must not pass this (WCAG 2.5.3)
			this.ariaLabel = config.ariaLabel ?? '';
			// opt-in toggle semantics: only buttons with a persistent on/off state expose aria-pressed
			this.isToggle = config.isToggle === true;
			// opt-in disclosure semantics: buttons that open a popup/menu expose aria-haspopup + aria-expanded
			// setPopupKind() wins on a rendered button: this value is applied once, by the first render()
			this.ariaHasPopup = config.ariaHasPopup ?? '';
			// a kind written while the layer of this button is open is kept aside and applied on close
			this.isPopupOpen = false;
			this.deferredPopupKind = null;
			this.hasDeferredPopupKind = false;
			// opt-in state description: the button carries the state of its feature as a description,
			// which keeps the state readable under Tab without touching the name of the button
			this.stateDescriptionId = config.hasStateDescription === true ? `bx-messenger-videocall-panel-item-state-description-${main_core.Text.getRandom()}` : '';
			this.stateDescriptionText = '';
			this.elements = {
				root: null,
				counter: null,
				counterDescription: null,
				stateDescription: null,
				comingSoon: null
			};
			this.callbacks = {
				onClick: guardedClick(this, main_core.Type.isFunction(config.onClick) ? config.onClick : () => {})
			};
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			const textNode = this.text === '' ? null : main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-panel-text'
				},
				attrs: {
					'data-testid': `${this.testId}-text`
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-panel-text-content'
					},
					text: this.text
				})]
			});
			this.elements.counterDescription = this.#createDescriptionNode(this.counterDescriptionId, 'counter-description');
			this.elements.stateDescription = this.#createDescriptionNode(this.stateDescriptionId, 'state-description', this.stateDescriptionText);
			const {
				tooltipClass,
				tooltipStyle
			} = this.tooltip;
			this.elements.root = main_core.Dom.create('button', {
				props: {
					type: 'button',
					className: `bx-messenger-videocall-panel-item ${tooltipClass}${this.blocked ? ' blocked' : ''}${this.isComingSoon ? ' coming-soon' : ''}`
				},
				attrs: {
					style: tooltipStyle,
					'data-testid': this.testId
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: this.backgroundClass
					},
					children: [main_core.Dom.create('div', {
						props: {
							className: `bx-messenger-videocall-panel-icon bx-messenger-videocall-panel-icon-${this.class}`
						},
						attrs: {
							'aria-hidden': 'true'
						}
					}), this.elements.counter = main_core.Dom.create('span', {
						props: {
							className: 'bx-messenger-videocall-panel-item-counter'
						},
						attrs: {
							'aria-hidden': 'true',
							'data-testid': `${this.testId}-counter`
						},
						text: '0',
						dataset: {
							counter: '0',
							counterType: 'digits'
						}
					}), this.elements.counterDescription, this.elements.stateDescription, this.elements.comingSoon = main_core.Dom.create('span', {
						props: {
							className: 'bx-messenger-videocall-panel-item-coming-soon'
						},
						attrs: {
							id: this.comingSoonId,
							'aria-hidden': 'true',
							'data-testid': `${this.testId}-coming-soon`
						},
						text: main_core.Loc.getMessage('CALL_FEATURES_COMING_SOON_MSGVER_1'),
						dataset: {
							visible: this.isComingSoon ? 'Y' : 'N'
						}
					})]
				}), textNode],
				events: {
					click: this.callbacks.onClick
				}
			});
			this.#applyInitialState();
			this.syncDescribedBy();
			return this.elements.root;
		}
		#applyInitialState() {
			if (this.isActive) {
				main_core.Dom.addClass(this.elements.root, 'active');
			}
			if (this.isToggle) {
				this.elements.root.setAttribute('aria-pressed', this.isActive ? 'true' : 'false');
			}
			if (this.blocked) {
				this.elements.root.setAttribute('aria-disabled', 'true');
			}
			if (this.ariaLabel) {
				this.elements.root.setAttribute('aria-label', this.ariaLabel);
			}
			if (this.ariaHasPopup) {
				this.elements.root.setAttribute('aria-haspopup', this.ariaHasPopup);
				this.elements.root.setAttribute('aria-expanded', 'false');
			}
		}

		// A description node exists only for a button whose owner opted into that description: for the
		// rest it would stay empty forever, and an empty custom element still costs an upgrade.
		#createDescriptionNode(id, testIdSuffix, text = '') {
			if (id === '') {
				return null;
			}
			return main_core.Dom.create('visually-hidden', {
				attrs: {
					id,
					// the description lives inside the button, so aria-hidden keeps its text
					// out of the accessible name; aria-describedby still resolves it
					'aria-hidden': 'true',
					'data-testid': `${this.testId}-${testIdSuffix}`
				},
				text
			});
		}

		// single point that assembles aria-describedby out of the currently active description sources
		syncDescribedBy() {
			if (!this.elements.root) {
				return;
			}
			const describedBy = [this.isComingSoon ? this.comingSoonId : '', this.hasCounterDescription() ? this.counterDescriptionId : '', this.stateDescriptionText === '' ? '' : this.stateDescriptionId].filter(Boolean);
			if (describedBy.length === 0) {
				this.elements.root.removeAttribute('aria-describedby');
				return;
			}
			this.elements.root.setAttribute('aria-describedby', describedBy.join(' '));
		}

		// the badge caps at 99+, so the description is the only place carrying the exact number
		getCounterDescriptionText() {
			if (this.counter <= 0 || this.counterDescriptionMessageKey === '') {
				return '';
			}

			// a lost phrase leaves nothing to say: getMessage returns nothing for an unknown key
			return main_core.Loc.getMessage(this.counterDescriptionMessageKey, {
				'#COUNT#': this.counter
			}) ?? '';
		}

		// an empty description reads worse than no description, so the text decides, not the key
		hasCounterDescription() {
			return this.getCounterDescriptionText() !== '';
		}
		syncCounterDescription() {
			if (!this.elements.counterDescription) {
				return;
			}
			this.elements.counterDescription.textContent = this.getCounterDescriptionText();
			this.syncDescribedBy();
		}

		// Spoken after the name of the button and never as part of it: the name of the element the user
		// is focused on must not change under them (WCAG 2.5.3). Empty text takes the description away.
		setStateDescription(text) {
			const stateText = main_core.Type.isString(text) ? text : '';
			if (this.stateDescriptionText === stateText) {
				return;
			}
			this.stateDescriptionText = stateText;
			if (!this.elements.stateDescription) {
				return;
			}
			this.elements.stateDescription.textContent = stateText;
			this.syncDescribedBy();
		}
		setActive(isActive) {
			if (this.isActive === isActive) {
				return;
			}
			this.isActive = isActive;
			if (!this.elements.root) {
				return;
			}
			if (this.isActive) {
				main_core.Dom.addClass(this.elements.root, 'active');
			} else {
				main_core.Dom.removeClass(this.elements.root, 'active');
			}
			if (this.isToggle) {
				this.elements.root.setAttribute('aria-pressed', this.isActive ? 'true' : 'false');
			}
			const {
				hasTooltip,
				getTooltipText,
				tooltipTextVarName
			} = this.tooltip;
			if (hasTooltip) {
				main_core.Dom.style(this.elements.root, tooltipTextVarName, `'${getTooltipText()}'`);
			}
		}

		// Safe on a button that has not been rendered yet: the caller synchronises again after render.
		setPopupKind(kind) {
			if (this.isPopupOpen) {
				this.deferredPopupKind = kind;
				this.hasDeferredPopupKind = true;
				return;
			}
			this.#applyPopupKind(kind);
		}

		// Told by the owner of the layer, not guessed from the DOM: while it lives the layer owns
		// aria-expanded of the trigger and puts its own snapshot back on destroy.
		setPopupOpen(isOpen) {
			if (this.isPopupOpen === isOpen) {
				return;
			}
			this.isPopupOpen = isOpen;
			if (this.isPopupOpen || !this.hasDeferredPopupKind) {
				return;
			}
			const kind = this.deferredPopupKind;
			this.deferredPopupKind = null;
			this.hasDeferredPopupKind = false;
			this.#applyPopupKind(kind);
		}
		#applyPopupKind(kind) {
			if (!this.elements.root) {
				return;
			}
			const ariaHasPopup = ariaHasPopupOfKind.get(kind) ?? '';
			if (ariaHasPopup === '') {
				this.elements.root.removeAttribute('aria-haspopup');
				this.elements.root.removeAttribute('aria-expanded');
				return;
			}
			this.elements.root.setAttribute('aria-haspopup', ariaHasPopup);

			// aria-expanded belongs to the menu pattern; a dialog is not an expanded state of its
			// trigger, and a "false" left over from a previous kind would freeze into a lie
			if (ariaHasPopup === AriaHasPopup.Menu) {
				this.elements.root.setAttribute('aria-expanded', 'false');
				return;
			}
			this.elements.root.removeAttribute('aria-expanded');
		}
		setBlocked(isBlocked) {
			if (this.blocked === isBlocked) {
				return;
			}
			this.blocked = isBlocked;
			if (this.blocked) {
				main_core.Dom.addClass(this.elements.root, 'blocked');
				this.elements.root.setAttribute('aria-disabled', 'true');
			} else {
				main_core.Dom.removeClass(this.elements.root, 'blocked');
				this.elements.root.removeAttribute('aria-disabled');
			}
		}
		setCounter(counter) {
			this.counter = parseInt(counter, 10);
			if (Number.isNaN(this.counter)) {
				this.counter = 0;
				this.elements.counter.dataset.counter = 0;
				this.elements.counter.dataset.counterType = 'digits';
				this.elements.counter.innerText = 0;
				this.syncCounterDescription();
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
			this.syncCounterDescription();
		}
		setIsComingSoon(isActive) {
			this.isComingSoon = isActive;
			if (this.isComingSoon) {
				this.elements.comingSoon.dataset.visible = 'Y';
			} else {
				this.elements.comingSoon.dataset.visible = 'N';
			}
			if (this.isComingSoon) {
				main_core.Dom.addClass(this.elements.root, 'coming-soon');
			} else {
				main_core.Dom.removeClass(this.elements.root, 'coming-soon');
			}
			this.syncDescribedBy();
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

	class DeviceButton {
		constructor(config) {
			this.class = config.class;
			// the panel the button belongs to names the hook namespace; the button itself does not know it
			this.testId = panelTestId(this.class, config.testIdPrefix);
			this.text = config.text;
			this.enabled = config.enabled === true;
			this.arrowHidden = config.arrowHidden === true;
			this.blocked = config.blocked === true;
			this.tooltip = createCssTooltip(main_core.Type.isPlainObject(config.tooltip) ? config.tooltip : {});
			this.backgroundClass = config.backgroundClass ?? '';
			this.showLevel = config.showLevel === true;
			this.level = config.level || 0;
			this.sideIcon = config.sideIcon ?? '';

			// accessible name for the main toggle; a button with a visible caption must not pass this (WCAG 2.5.3)
			this.ariaLabel = config.ariaLabel ?? '';
			// accessible name for the device selection arrow button (icon-only, no visible text)
			this.arrowAriaLabel = config.arrowAriaLabel ?? '';
			// disclosure semantics for the arrow: it opens the DeviceSelector popup
			this.arrowHasPopup = config.arrowHasPopup ?? '';
			this.elements = {
				root: null,
				button: null,
				iconContainer: null,
				icon: null,
				arrow: null,
				levelMeter: null,
				pointer: null,
				ellipsis: null
			};

			// only the main toggle is click-guarded: the arrow opens the device selector,
			// which stays available while broadcasting is forbidden
			this.callbacks = {
				onClick: guardedClick(this, main_core.Type.isFunction(config.onClick) ? config.onClick : () => {}),
				onArrowClick: main_core.Type.isFunction(config.onArrowClick) ? config.onArrowClick : () => {},
				onSideIconClick: main_core.Type.isFunction(config.onSideIconClick) ? config.onSideIconClick : () => {}
			};
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			const {
				tooltipClass,
				tooltipStyle,
				tooltipText
			} = this.tooltip;
			this.elements.arrow = this.buildArrow();

			// main toggle: its accessible name comes from the visible caption, or from ariaLabel where
			// the caption is dropped, so glyphs are aria-hidden.
			// DeviceButton is only used for microphone/camera device toggles, hence role="switch" is unconditional.
			this.elements.button = main_core.Dom.create('button', {
				props: {
					type: 'button',
					className: 'bx-messenger-videocall-panel-item-with-arrow-main'
				},
				attrs: {
					role: 'switch',
					'aria-checked': this.enabled ? 'true' : 'false',
					'data-testid': this.testId
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
							},
							attrs: {
								'aria-hidden': 'true'
							}
						})]
					})]
				}), main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-panel-text'
					},
					attrs: {
						'data-testid': `${this.testId}-text`
					},
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

			// root is a non-interactive container hosting two sibling buttons (no button-in-button)
			this.elements.root = main_core.Dom.create('div', {
				props: {
					id: `bx-messenger-videocall-panel-item-with-arrow-${this.class}`,
					className: `bx-messenger-videocall-panel-item-with-arrow ${tooltipText ? tooltipClass : ''}${this.blocked ? ' blocked' : ''}`
				},
				attrs: {
					style: tooltipStyle,
					// the id above repeats across panels; the hook is the only locator unique per panel
					'data-testid': `${this.testId}-container`
				},
				children: [this.elements.button, ...(this.arrowHidden ? [] : [this.elements.arrow])]
			});
			if (this.blocked) {
				this.elements.button.setAttribute('aria-disabled', 'true');
			}
			if (this.ariaLabel) {
				this.elements.button.setAttribute('aria-label', this.ariaLabel);
			}
			this.appendLevelMeter();
			this.elements.ellipsis = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-panel-icon-ellipsis'
				},
				attrs: {
					'aria-hidden': 'true',
					'data-testid': `${this.testId}-ellipsis`
				},
				events: {
					click: this.callbacks.onSideIconClick
				}
			});
			this.elements.pointer = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-panel-icon-pointer'
				},
				attrs: {
					'aria-hidden': 'true',
					'data-testid': `${this.testId}-pointer`
				},
				events: {
					click: this.callbacks.onSideIconClick
				}
			});
			if (this.sideIcon === 'pointer') {
				BX.Dom.insertAfter(this.elements.pointer, this.elements.icon);
			} else if (this.sideIcon === 'ellipsis') {
				BX.Dom.insertAfter(this.elements.ellipsis, this.elements.icon);
			}
			return this.elements.root;
		}
		buildArrow() {
			// device selector opener: sibling <button>, does not toggle the device
			const arrow = main_core.Dom.create('button', {
				props: {
					type: 'button',
					className: 'bx-messenger-videocall-panel-item-with-arrow-right'
				},
				attrs: {
					'data-testid': `${this.testId}-arrow`
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-panel-item-with-arrow-right-icon'
					},
					attrs: {
						'aria-hidden': 'true'
					}
				})],
				events: {
					click: function (...args) {
						const [e] = args;
						main_core.Dom.addClass(this.elements.arrow, 'rotate');
						this.callbacks.onArrowClick.apply(this, args);
						// keep the click from reaching the view body handler (onBodyClick)
						e.stopPropagation();
					}.bind(this)
				}
			});
			if (this.arrowAriaLabel) {
				arrow.setAttribute('aria-label', this.arrowAriaLabel);
			}
			if (this.arrowHasPopup) {
				arrow.setAttribute('aria-haspopup', this.arrowHasPopup);
				arrow.setAttribute('aria-expanded', 'false');
			}
			return arrow;
		}
		appendLevelMeter() {
			if (!this.showLevel) {
				return;
			}
			main_core.Dom.append(createSVG('svg', {
				attrNS: {
					class: 'bx-messenger-videocall-panel-item-level-meter-container',
					'aria-hidden': 'true',
					width: '28',
					height: '28',
					viewBox: '0 0 28 28',
					fill: 'none'
				},
				children: [createSVG('defs', {
					children: [createSVG('linearGradient', {
						attrNS: {
							id: 'volumeGradient',
							x1: '0%',
							y1: '100%',
							x2: '0%',
							y2: '0%'
						},
						children: [this.elements.gradientStop1 = createSVG('stop', {
							attrNS: {
								offset: '0',
								id: 'gradientStop1'
							}
						}), this.elements.gradientStop2 = createSVG('stop', {
							attrNS: {
								offset: '0',
								'stop-color': 'transparent',
								id: 'gradientStop2'
							}
						})]
					})]
				}), createSVG('path', {
					attrNS: {
						'fill-rule': 'evenodd',
						'clip-rule': 'evenodd',
						d: 'M7.01843 12.8394C7.46936 12.8492 7.82709 13.2234 7.81726 13.6743C7.76065 16.2837 9.9066 19.8267 13.9882 19.8267C18.0865 19.8265 20.3038 16.2334 20.1805 13.6987C20.1586 13.2483 20.5056 12.8654 20.9559 12.8433C21.4064 12.8213 21.7894 13.1682 21.8114 13.6187C21.9638 16.7444 19.4696 20.9702 14.8124 21.4204V23.1763H16.7714C17.2222 23.1765 17.5878 23.5427 17.5878 23.9937C17.5875 24.4443 17.2221 24.8099 16.7714 24.8101H11.2206C10.7699 24.8098 10.4044 24.4443 10.4042 23.9937C10.4042 23.5428 10.7698 23.1765 11.2206 23.1763H13.1796V21.4224C8.50848 20.9829 6.11622 16.768 6.18445 13.6382C6.1943 13.1874 6.56769 12.8297 7.01843 12.8394ZM13.9921 3.30518C16.1622 3.30518 17.9218 5.06469 17.9218 7.23486V13.5396C17.9218 15.7097 16.1622 17.4692 13.9921 17.4692C11.8221 17.469 10.0634 15.7096 10.0634 13.5396V7.23486C10.0634 5.06481 11.8221 3.30537 13.9921 3.30518ZM13.9921 4.93896C12.7241 4.93916 11.6962 5.96687 11.6962 7.23486V13.5396C11.6962 14.8075 12.7241 15.8353 13.9921 15.8354C15.2602 15.8354 16.2889 14.8077 16.2889 13.5396V7.23486C16.2889 5.96676 15.2602 4.93896 13.9921 4.93896Z',
						fill: 'url(#volumeGradient)'
					}
				})]
			}), this.elements.icon);
		}
		getIconClass() {
			return `bx-messenger-videocall-panel-item-with-arrow-icon bx-messenger-videocall-panel-item-with-arrow-icon-${this.class}${this.enabled ? '' : '-off'}`;
		}
		getIconContainerClass() {
			const off = this.enabled ? '' : '-off';
			const arrowHidden = this.arrowHidden ? ' bx-messenger-videocall-panel-item-with-arrow-icon-container-arrow-hidden' : '';
			const background = this.backgroundClass ? ` ${this.backgroundClass}` : '';
			return `bx-messenger-videocall-panel-item-with-arrow-icon-container bx-messenger-videocall-panel-item-with-arrow-icon-container-${this.class}${off}${arrowHidden}${background}`;
		}
		enable() {
			if (this.enabled) {
				return;
			}
			this.enabled = true;
			this.refreshIconState();
		}
		disable() {
			if (!this.enabled) {
				return;
			}
			this.enabled = false;
			this.refreshIconState();
		}
		refreshIconState() {
			this.elements.iconContainer.className = this.getIconContainerClass();
			this.elements.icon.className = this.getIconClass();
			// single sync point for both enable() and disable(): state arrives async, not on click
			this.elements.button.setAttribute('aria-checked', this.enabled ? 'true' : 'false');
			if (this.elements.gradientStop1 && this.elements.gradientStop2) {
				this.elements.gradientStop1.setAttribute('offset', '0%');
				this.elements.gradientStop2.setAttribute('offset', '0%');
			} else if (this.elements.levelMeter) {
				this.elements.levelMeter.setAttribute('y', Math.round((1 - this.level) * 20));
			}
			this.syncTooltip();
		}

		/**
		 * The plate is drawn by the class and filled by the variable, so both follow the text: a tooltip
		 * whose text depends on the state of the button says nothing in some of them, and an empty string
		 * still hovers as a blank plate.
		 */
		syncTooltip() {
			const {
				hasTooltip,
				getTooltipText,
				tooltipTextVarName,
				tooltipClass
			} = this.tooltip;
			if (!hasTooltip) {
				return;
			}
			const tooltipText = getTooltipText();
			main_core.Dom.style(this.elements.root, tooltipTextVarName, `'${tooltipText}'`);
			if (tooltipText) {
				main_core.Dom.addClass(this.elements.root, tooltipClass);
			} else {
				main_core.Dom.removeClass(this.elements.root, tooltipClass);
			}
		}
		setBlocked(blocked) {
			if (this.blocked === blocked) {
				return;
			}
			this.blocked = blocked;
			this.elements.iconContainer.className = this.getIconContainerClass();
			this.elements.icon.className = this.getIconClass();
			if (this.blocked) {
				main_core.Dom.addClass(this.elements.root, 'blocked');
				this.elements.button.setAttribute('aria-disabled', 'true');
			} else {
				main_core.Dom.removeClass(this.elements.root, 'blocked');
				this.elements.button.removeAttribute('aria-disabled');
			}
		}
		setSideIcon(sideIcon) {
			if (this.sideIcon === sideIcon) {
				return;
			}
			this.sideIcon = sideIcon;
			BX.Dom.remove(this.elements.pointer);
			BX.Dom.remove(this.elements.ellipsis);
			if (this.sideIcon === 'pointer') {
				BX.Dom.insertAfter(this.elements.pointer, this.elements.icon);
			} else if (this.sideIcon === 'ellipsis') {
				BX.Dom.insertAfter(this.elements.ellipsis, this.elements.icon);
			}
		}
		showArrow() {
			if (!this.arrowHidden) {
				return;
			}
			this.arrowHidden = false;
			this.elements.iconContainer.className = this.getIconContainerClass();
			if (!this.elements.arrow.parentElement) {
				main_core.Dom.append(this.elements.arrow, this.elements.root);
			}
		}
		hideArrow() {
			if (this.arrowHidden) {
				return;
			}
			this.arrowHidden = true;
			this.elements.iconContainer.className = this.getIconContainerClass();
			if (this.elements.arrow.parentElement) {
				main_core.Dom.remove(this.elements.arrow);
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
				attrs: {
					'aria-hidden': 'true'
				},
				children: [main_core.Dom.create('img', {
					props: {
						className: 'bx-messenger-videocall-watermark-img',
						src: this.getWatermarkUrl(this.language),
						alt: ''
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
			this.iconClass = config.iconClass ?? '';
			this.text = config.text ?? '';
			this.elements = {
				root: null,
				icon: null,
				text: null
			};
			this.tooltip = createCssTooltip(main_core.Type.isPlainObject(config.tooltip) ? config.tooltip : {});
			this.callbacks = {
				onClick: guardedClick(this, main_core.Type.isFunction(config.onClick) ? config.onClick : () => {})
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
			this.elements.root = main_core.Dom.create('button', {
				props: {
					type: 'button',
					className: `bx-messenger-videocall-top-button ${tooltipClass}`
				},
				attrs: {
					style: tooltipStyle
				},
				children: [this.elements.icon = main_core.Dom.create('div', {
					props: {
						className: `bx-messenger-videocall-top-button-icon ${this.iconClass}`
					},
					attrs: {
						'aria-hidden': 'true'
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
			const iconClass = config.iconClass ?? this.iconClass;
			const text = config.text ?? this.text;
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
				this.elements.root.setAttribute('aria-disabled', 'true');
			} else {
				main_core.Dom.removeClass(this.elements.root, 'blocked');
				this.elements.root.removeAttribute('aria-disabled');
			}
		}
	}

	class TopFramelessButton {
		constructor(config) {
			this.iconClass = config.iconClass ?? '';
			this.textClass = config.textClass ?? '';
			this.text = config.text ?? '';
			this.tooltip = createCssTooltip(main_core.Type.isPlainObject(config.tooltip) ? config.tooltip : {});
			this.elements = {
				root: null
			};
			this.callbacks = {
				onClick: main_core.Type.isFunction(config.onClick) ? config.onClick : () => {}
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
			this.elements.root = main_core.Dom.create('button', {
				props: {
					type: 'button',
					className: `bx-messenger-videocall-top-button-frameless ${tooltipClass}`
				},
				attrs: {
					style: tooltipStyle
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: `bx-messenger-videocall-top-button-icon ${this.iconClass}`
					},
					attrs: {
						'aria-hidden': 'true'
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
			this.count = config.count ?? 0;
			this.foldButtonState = config.foldButtonState ?? ParticipantsButton.FoldButtonState.Hidden;
			this.allowAdding = config.allowAdding ?? false;
			this.elements = {
				root: null,
				leftContainer: null,
				rightContainer: null,
				foldIcon: null,
				count: null,
				separator: null
			};
			this.callbacks = {
				onListClick: guardedClick(this, main_core.Type.isFunction(config.onListClick) ? config.onListClick : () => {}),
				onAddClick: guardedClick(this, main_core.Type.isFunction(config.onAddClick) ? config.onAddClick : () => {})
			};
		}
		static FoldButtonState = {
			Active: 'active',
			Fold: 'fold',
			Unfold: 'unfold',
			Hidden: 'hidden'
		};
		getListAriaLabel() {
			return main_core.Loc.getMessage('CALL_VIEW_PARTICIPANTS_LIST_ARIA').replace('#COUNT#', this.count);
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			this.elements.root = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-top-participants'
				},
				children: [this.elements.leftContainer = main_core.Dom.create('button', {
					props: {
						type: 'button',
						className: `bx-messenger-videocall-top-participants-inner left${this.foldButtonState === ParticipantsButton.FoldButtonState.Hidden ? '' : ' active'}`
					},
					attrs: {
						'aria-label': this.getListAriaLabel()
					},
					children: [main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-top-button-icon participants'
						},
						attrs: {
							'aria-hidden': 'true'
						}
					}), this.elements.count = main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-top-participants-text-count'
						},
						text: String(this.count)
					}), this.elements.foldIcon = main_core.Dom.create('div', {
						props: {
							className: `bx-messenger-videocall-top-participants-fold-icon ${this.foldButtonState}`
						},
						attrs: {
							'aria-hidden': 'true'
						}
					})],
					events: {
						click: this.callbacks.onListClick
					}
				})]
			});
			this.elements.separator = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-top-participants-separator'
				}
			});
			this.elements.rightContainer = main_core.Dom.create('button', {
				props: {
					type: 'button',
					className: 'bx-messenger-videocall-top-participants-inner active'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-top-participants-text'
					},
					text: main_core.Loc.getMessage('IM_M_CALL_BTN_ADD')
				}), main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-top-button-icon add'
					},
					attrs: {
						'aria-hidden': 'true'
					}
				})],
				events: {
					click: this.callbacks.onAddClick
				}
			});
			if (this.allowAdding) {
				main_core.Dom.append(this.elements.separator, this.elements.root);
				main_core.Dom.append(this.elements.rightContainer, this.elements.root);
			}
			return this.elements.root;
		}
		update(config) {
			this.count = config.count ?? this.count;
			this.foldButtonState = config.foldButtonState ?? this.foldButtonState;
			this.allowAdding = config.allowAdding ?? this.allowAdding;
			this.elements.count.innerText = this.count;
			this.elements.leftContainer.setAttribute('aria-label', this.getListAriaLabel());
			this.elements.foldIcon.className = `bx-messenger-videocall-top-participants-fold-icon ${this.foldButtonState}`;
			if (this.foldButtonState === ParticipantsButton.FoldButtonState.Hidden) {
				main_core.Dom.removeClass(this.elements.leftContainer, 'active');
			} else {
				main_core.Dom.addClass(this.elements.leftContainer, 'active');
			}
			if (this.allowAdding && !this.elements.separator.parentElement) {
				main_core.Dom.append(this.elements.separator, this.elements.root);
				main_core.Dom.append(this.elements.rightContainer, this.elements.root);
			}
			if (!this.allowAdding && this.elements.separator.parentElement) {
				main_core.Dom.remove(this.elements.separator);
				main_core.Dom.remove(this.elements.rightContainer);
			}
		}
		setBlocked(isBlocked) {
			if (this.blocked === isBlocked) {
				return;
			}
			this.blocked = isBlocked;
			if (this.blocked) {
				main_core.Dom.addClass(this.elements.root, 'blocked');
				this.elements.leftContainer.setAttribute('aria-disabled', 'true');
				this.elements.rightContainer.setAttribute('aria-disabled', 'true');
			} else {
				main_core.Dom.removeClass(this.elements.root, 'blocked');
				this.elements.leftContainer.removeAttribute('aria-disabled');
				this.elements.rightContainer.removeAttribute('aria-disabled');
			}
		}
	}

	class ParticipantsButtonMobile {
		constructor(config) {
			this.count = config.count ?? 0;
			this.elements = {
				root: null,
				icon: null,
				text: null,
				arrow: null
			};
			this.callbacks = {
				onClick: guardedClick(this, main_core.Type.isFunction(config.onClick) ? config.onClick : () => {})
			};
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			this.elements.root = main_core.Dom.create('button', {
				props: {
					type: 'button',
					className: 'bx-messenger-videocall-top-participants-mobile'
				},
				children: [this.elements.icon = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-top-participants-mobile-icon'
					},
					attrs: {
						'aria-hidden': 'true'
					}
				}), this.elements.text = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-top-participants-mobile-text'
					},
					text: main_core.Loc.getMessage('IM_M_CALL_PARTICIPANTS').replace('#COUNT#', this.count)
				}), this.elements.arrow = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-top-participants-mobile-arrow'
					},
					attrs: {
						'aria-hidden': 'true'
					}
				})],
				events: {
					click: this.callbacks.onClick
				}
			});
			return this.elements.root;
		}
		setCount(count) {
			if (this.count === count || !this.elements.text) {
				return;
			}
			this.count = count;
			this.elements.text.innerText = main_core.Loc.getMessage('IM_M_CALL_PARTICIPANTS').replace('#COUNT#', this.count);
		}
	}

	class RecordStatusButton {
		constructor(config) {
			this.userId = config.userId;
			this.commonRecordState = config.commonRecordState;
			this.updateViewInterval = null;
			this.tooltip = createCssTooltip(main_core.Type.isPlainObject(config.tooltip) ? config.tooltip : {});
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
						attrs: {
							'aria-hidden': 'true'
						},
						text: call_core.Util.getRecordTimeText(this.commonRecordState)
					})]
				})]
			});
			this.applyStatusA11y(this.commonRecordState.state);
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
				this.announceStateChange(commonRecordState.state);
				this.applyStatusA11y(commonRecordState.state);
			}
			this.commonRecordState = commonRecordState;
			this.updateView();
		}
		announceStateChange(state) {
			// Build the map lazily: CallCommonRecordState (call.core) is not yet
			// initialized at module-eval time, so referencing it at top level throws.
			const messageKey = {
				[call_core.CallCommonRecordState.Started]: 'CALL_VIEW_RECORD_ANNOUNCE_STARTED',
				[call_core.CallCommonRecordState.Resumed]: 'CALL_VIEW_RECORD_ANNOUNCE_RESUMED',
				[call_core.CallCommonRecordState.Paused]: 'CALL_VIEW_RECORD_ANNOUNCE_PAUSED',
				[call_core.CallCommonRecordState.Stopped]: 'CALL_VIEW_RECORD_ANNOUNCE_STOPPED'
			}[state];
			if (!messageKey) {
				return;
			}
			const phrase = main_core.Loc.getMessage(messageKey);
			if (!phrase) {
				return;
			}

			// nothing the call window announces interrupts the screen reader: "call ended"
			// and "connection lost" do not reach this live region at all
			ui_a11y.LiveAnnouncer.announce(phrase, 'polite');
		}
		getStatusAriaLabel(state) {
			return {
				[call_core.CallCommonRecordState.Started]: main_core.Loc.getMessage('CALL_VIEW_RECORD_STATUS_ARIA_ACTIVE'),
				[call_core.CallCommonRecordState.Resumed]: main_core.Loc.getMessage('CALL_VIEW_RECORD_STATUS_ARIA_ACTIVE'),
				[call_core.CallCommonRecordState.Paused]: main_core.Loc.getMessage('CALL_VIEW_RECORD_STATUS_ARIA_PAUSED')
			}[state] || '';
		}
		applyStatusA11y(state) {
			// role="img" (not role="status"): a live region here would double-announce with LiveAnnouncer.
			const label = this.getStatusAriaLabel(state);
			if (label) {
				main_core.Dom.attr(this.elements.root, {
					role: 'img',
					'aria-label': label
				});
			} else {
				main_core.Dom.attr(this.elements.root, 'role', null);
				main_core.Dom.attr(this.elements.root, 'aria-label', null);
			}
		}
		updateView() {
			const timeText = call_core.Util.getRecordTimeText(this.commonRecordState);
			if (this.elements.timeText.innerText !== timeText) {
				this.elements.timeText.innerText = timeText;
			}
			const currentClass = `record-status-${this.commonRecordState.state}`;
			if (!main_core.Dom.hasClass(this.elements.root, currentClass)) {
				const {
					tooltipClass,
					hasTooltip,
					tooltipTextVarName,
					getTooltipText
				} = this.tooltip;
				const tooltipText = getTooltipText();
				if (hasTooltip && tooltipText) {
					main_core.Dom.style(this.elements.root, tooltipTextVarName, `'${tooltipText}'`);
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
		AriaHasPopup: AriaHasPopup,
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

	// Every known ui state but Preparing. The list is spelled out on purpose: uiState comes from the
	// outside unchecked, and a value outside the enum must hide the menu rather than show it.
	function isBottomCenterMenuVisible(uiState) {
		return uiState === call_mapping.ViewUiState.Initializing || uiState === call_mapping.ViewUiState.Calling || uiState === call_mapping.ViewUiState.Connected || uiState === call_mapping.ViewUiState.Error;
	}

	// The room state decides which side icon the microphone button carries.
	function getMicrophoneSideIcon(roomState) {
		switch (roomState) {
			case call_mapping.ViewRoomState.Speaker:
				return 'ellipsis';
			case call_mapping.ViewRoomState.NonSpeaker:
				return 'pointer';
			case call_mapping.ViewRoomState.None:
			default:
				return null;
		}
	}

	class CallPopupQueue {
		#pending = [];
		#showing = false;
		add(place, callback) {
			this.#pending.push({
				place,
				callback
			});
			this.#pending.sort((a, b) => a.place - b.place);
			if (!this.#showing) {
				this.#next();
			}
		}
		#next() {
			if (this.#pending.length === 0) {
				this.#showing = false;
				return;
			}
			this.#showing = true;
			const {
				callback
			} = this.#pending.shift();
			callback(() => this.#next());
		}
		destroy() {
			this.#pending = [];
			this.#showing = false;
		}
	}

	// Marks the emptied event that our own assignment of srcObject causes. The release of a track is
	// already written by playAudio, and a reattachment is not an event of its own; what the watcher of
	// the element must not miss is an emptied nobody asked for.
	const EXPECTED_EMPTIED = 'bxExpectedEmptied';

	// Marks the volumechange event that our own assignment of the volume causes. Muting the speaker
	// walks every element of the call at once and is written by one record of the whole walk; what the
	// watcher of the element must not miss is a volume change nobody asked for.
	const EXPECTED_VOLUME_CHANGE = 'bxExpectedVolumeChange';

	/* eslint-disable no-param-reassign -- writing on the element given is the whole job of these helpers */
	// Assigned and not raised: on a freshly created element the assignment queues no emptied at all,
	// because its networkState is still empty, and a second assignment before the event is delivered
	// cancels the one the first assignment queued. Reading the current srcObject answers both.
	function setSrcObject(element, srcObject) {
		element[EXPECTED_EMPTIED] = element.srcObject !== null;
		element.srcObject = srcObject;
	}

	// Assigned by the fact of the change and not raised unconditionally: an assignment of the value the
	// element already holds queues no volumechange at all, and a mark left standing would swallow the
	// next change, an alien one.
	function setVolume(element, volume) {
		element[EXPECTED_VOLUME_CHANGE] = volume !== element.volume;
		element.volume = volume;
	}
	/* eslint-enable no-param-reassign */

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

	// The kind of video a card shows is known only to the card itself: screen sharing is told apart
	// from a camera by the role the card was created with and by the kind of renderer it was given.
	// Deciding by the track is not an option, because on the bare-track path screen sharing arrives as
	// an equally bare track and would be turned off together with the camera.
	//
	// So the camera state gates the camera alone, in all three forms it reaches a card: a renderer, a
	// bare track (which brings no renderer kind at all) and the preview next to screen sharing.
	function shouldShowVideo({
		isScreenSharingCard,
		videoRendererKind,
		cameraState
	}) {
		if (isScreenSharingCard) {
			return true;
		}
		if (videoRendererKind === 'sharing') {
			return true;
		}

		// the state reaches the model straight out of a pull payload, uncoerced, so a truthy
		// non-boolean must not pass for a camera that is on
		return Boolean(cameraState);
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

		/** @type {number|null} */
		#hideTimeoutId = null;

		/** @type {number} */
		#hideTimeoutMs = 3000;
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
			this.#stopHideTimeout();
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
		#startHideTimeout() {
			this.#stopHideTimeout();
			this.#hideTimeoutId = setTimeout(() => {
				// The frozen frame is a bridge for a temporary video gap on reconnect.
				// If the video does not come back within this window (e.g. the camera
				// was turned off during the reconnect, so no 'loadeddata' arrives),
				// hide the overlay so the avatar and camera-off state become visible.
				this.hideLastFrame();
			}, this.#hideTimeoutMs);
		}
		#stopHideTimeout() {
			if (this.#hideTimeoutId !== null) {
				clearTimeout(this.#hideTimeoutId);
				this.#hideTimeoutId = null;
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
			}
			this.#overlayElement.style.backgroundImage = `url('${this.#lastFrameData}')`;
			this.#overlayElement.style.display = 'block';
			this.#isOverlayVisible = true;
			if (!this.#overlayElement.parentElement) {
				containerElement.appendChild(this.#overlayElement);
			}
			this.#startHideTimeout();
		}
		hideLastFrame() {
			this.#stopHideTimeout();
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
		#videoDecision = null;
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
					order: this.userModel.order,
					testid: `call-participant-${this.userModel.id}`
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
						dataset: {
							testid: 'call-participant-avatar'
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
								dataset: {
									testid: 'call-participant-name'
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
					dataset: {
						testid: 'call-participant-video'
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
					},
					dataset: {
						testid: 'call-participant-camera-state'
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
					if (!this.userModel.cameraState) {
						this.hideLastVideoFrame();
					}
					this.updateCameraState();

					// the avatar comes back at the redraw of the card and nowhere else: the rerender
					// queue of the grid leaves an already mounted card alone
					return this.update();
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
				const name = this.screenSharingUser ? BX.message('IM_CALL_USERS_SCREEN').replace('#NAME#', this.userModel.name) : this.userModel.name;
				this.elements.name.innerText = name;
				this.elements.name.title = name;
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
			const showVideo = this.hasVideo() && this.#showsVideoOfKind(this.videoRenderer?.kind);
			if (showVideo) {
				if (this.visible) {
					if (this.videoRenderer) {
						this.videoRenderer.render(this.elements.video);
						this.playVideoElements(this.elements.video);
						// the preview renderer is always the camera, so an off camera empties it while
						// the main element goes on showing the screen
						if (this._previewRenderer && this.#showsVideoOfKind(this._previewRenderer.kind)) {
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
				// the blur of a paused video is latched: the class is toggled without an explicit value,
				// so only a call that gets this far takes it off the element the video will come back to
				this.blurVideo(false);
				if (this.elements.avatarContainer) {
					this.elements.avatarContainer.classList.remove('bx-messenger-videocall-hidden-avatar');
				}
			}
			if (call_core.Util.isCallServerAllowed() && this.userModel.state === call_core.UserState.Connected && !this.elements.debugPanel.parentElement && !this.screenSharingUser) {
				this.elements.container.appendChild(this.elements.debugPanel);
			}
			this.updatePanelDeferred();
			this.#logVideoDecision(showVideo);
		}
		// The camera state gates the camera alone; hasVideo() stays the wider question the grid asks.
		#showsVideoOfKind(videoRendererKind) {
			return shouldShowVideo({
				isScreenSharingCard: this.screenSharingUser,
				videoRendererKind,
				cameraState: this.userModel.cameraState
			});
		}

		// A card redraws in a stream on an active grid, so only a change of the decision goes to the
		// call log: next to the mute signals of the media layer it tells an unhandled signal from a
		// wrong condition when a complaint is taken apart. One participant has more than one card --
		// the tile of the participant and the tile of the screen are given the same model -- so the
		// record names the role of the card that wrote it.
		#logVideoDecision(showVideo) {
			const decision = showVideo ? 'video' : 'avatar';
			const previousDecision = this.#videoDecision;
			this.#videoDecision = decision;
			if (previousDecision === null || previousDecision === decision) {
				return;
			}
			call_core.Util.sendLog({
				description: 'video decision changed',
				userModelId: this.userModel?.id,
				screenSharingUser: this.screenSharingUser,
				decision,
				reason: this.#videoDecisionReason(showVideo)
			});
		}
		#videoDecisionReason(showVideo) {
			if (showVideo) {
				return 'videoShown';
			}
			if (call_core.Hardware.maxLocalStreamQualityHeight === call_core.LOCAL_STREAM_QUALITY_HEIGHT.NO_VIDEO) {
				return 'videoQualityOff';
			}
			if (this.userModel.state !== call_core.UserState.Connected) {
				return 'notConnected';
			}
			if (!this.videoTrack && !this.videoRenderer) {
				return 'noMedia';
			}
			return 'cameraOff';
		}
		playAudio() {
			if (!this.audioStream) {
				setSrcObject(this.elements.audio, null);
				call_core.Util.sendLog({
					description: 'no audioStream to play',
					userModelId: this.userModel?.id
				});
				return;
			}
			if (this.externalSpeakerManagement) {
				setSrcObject(this.elements.audio, this.audioStream);
				this.callBacks.onAudioElementCreated(this.elements.audio);
				this.elements.audio.play().catch(logPlaybackError);
				this.callBacks.onAudioPlay(this.elements.audio);
				return;
			}
			if (this.speakerId && main_core.Type.isFunction(this.elements.audio.setSinkId)) {
				// the value the selection was made with: the handlers run later, when the field may have moved on
				const requestedSpeakerId = this.speakerId;
				this.elements.audio.setSinkId(requestedSpeakerId).then(() => {
					setSrcObject(this.elements.audio, this.audioStream);
					this.elements.audio.play().catch(logPlaybackError);
				}, error => {
					// the second handler of then() and not a catch: only the refusal of the selection
					// belongs to this record, not a failure of the attachment below it. The stream is
					// attached in the first handler alone, so a refused device leaves the element silent.
					call_core.Util.sendLog({
						description: 'speaker selection failed',
						scope: 'callUser',
						userModelId: this.userModel?.id,
						speakerId: requestedSpeakerId,
						errorName: error?.name,
						errorMessage: error?.message
					});
				});
			} else {
				setSrcObject(this.elements.audio, this.audioStream);
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

			// the bridge repeats the terms of the redraw except the gap it exists for: missing media and
			// a participant on the way back are what the saved frame covers, while an off camera and the
			// local "no video" quality give the card an avatar the frame must not come back over
			if (call_core.Hardware.maxLocalStreamQualityHeight === call_core.LOCAL_STREAM_QUALITY_HEIGHT.NO_VIDEO || !this.#showsVideoOfKind(this.videoRenderer?.kind)) {
				return;
			}
			this.videoFrameKeeper.showLastFrame(this.elements.videoContainer);
		}
		hideLastVideoFrame() {
			this.videoFrameKeeper?.hideLastFrame();
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
					attrs: {
						'data-testid': 'call-confirm-modal-yes-btn'
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

	/**
	 * Radio group semantics over the device list of a single column.
	 * Owns the selected state and the only entry point of its change:
	 * a user pick notifies the owner, an external confirmation stays silent.
	 *
	 * Focus movement inside the group belongs to the accessibility facade: the owner passes
	 * a factory, the group never sets tabindex on its items by itself.
	 *
	 * Blocking is not its concern: picking a device is not the same as turning it on, so the list
	 * stays alive while the column is blocked and the block stops at the switch and the slider.
	 *
	 * The name is a required input: the visible column label already names the switch, and one label
	 * cannot name two different controls. A group left unnamed is reported and still rendered - a
	 * nameless list is an accessibility defect, a missing device list is a broken call screen.
	 */
	class DeviceRadioGroup {
		constructor({
			deviceList = [],
			selectedDevice = '',
			ariaLabel,
			createFocusZone = null,
			onSelect = null
		}) {
			if (!ariaLabel) {
				console.error('DeviceRadioGroup: ariaLabel is required, the device list stays unnamed without it');
			}
			this.deviceList = deviceList;
			this.selectedDevice = selectedDevice;
			this.ariaLabel = ariaLabel ?? '';
			this.createFocusZone = createFocusZone;
			this.callbacks = {
				onSelect
			};
			this.itemClickHandler = this.onItemClick.bind(this);
			this.container = null;
			this.items = [];
			this.focusZone = null;
		}
		render() {
			if (this.container) {
				return this.container;
			}
			this.container = main_core.Dom.create('div', {
				props: {
					className: 'bx-call-view-device-selector-menu-inner'
				},
				attrs: {
					role: 'radiogroup',
					'aria-label': this.ariaLabel,
					'data-testid': 'device-selector-device-list'
				},
				children: this.deviceList.map(deviceInfo => this.renderDevice(deviceInfo))
			});
			return this.container;
		}
		renderDevice(deviceInfo) {
			const checked = deviceInfo.deviceId === this.selectedDevice;
			const icon = main_core.Dom.create('div', {
				props: {
					className: `bx-call-view-device-selector-menu-item-icon ${checked ? 'selected' : ''}`
				},
				attrs: {
					'aria-hidden': 'true'
				}
			});
			const root = main_core.Dom.create('button', {
				props: {
					className: 'bx-call-view-device-selector-menu-item'
				},
				attrs: {
					type: 'button',
					role: 'radio',
					'aria-checked': String(checked),
					'data-testid': 'device-selector-device-item'
				},
				dataset: {
					deviceId: deviceInfo.deviceId
				},
				children: [icon, main_core.Dom.create('div', {
					props: {
						className: 'bx-call-view-device-selector-menu-item-text'
					},
					text: deviceInfo.label || `(${main_core.Loc.getMessage('IM_M_CALL_DEVICE_NO_NAME')})`
				})],
				events: {
					click: this.itemClickHandler
				}
			});
			this.items.push({
				deviceId: deviceInfo.deviceId,
				root,
				icon
			});
			return root;
		}
		onItemClick(event) {
			this.onUserPick(event.currentTarget.dataset.deviceId);
		}
		onUserPick(deviceId) {
			this.setChecked(deviceId, true);
		}
		confirmSelection(deviceId) {
			this.setChecked(deviceId, false);
		}
		setChecked(deviceId, notifyOutside) {
			if (deviceId === this.selectedDevice) {
				return;
			}
			this.selectedDevice = deviceId;
			this.items.forEach(item => {
				const checked = item.deviceId === this.selectedDevice;
				main_core.Dom.attr(item.root, 'aria-checked', String(checked));
				if (checked) {
					main_core.Dom.addClass(item.icon, 'selected');
				} else {
					main_core.Dom.removeClass(item.icon, 'selected');
				}
			});
			if (notifyOutside) {
				this.callbacks.onSelect?.(this.selectedDevice);
			}
		}
		getFocusEntryPoint() {
			const selected = this.items.find(item => item.deviceId === this.selectedDevice);
			return (selected ?? this.items[0])?.root ?? null;
		}
		activateFocusZone() {
			if (this.items.length === 0 || !this.createFocusZone) {
				return;
			}
			if (!this.focusZone) {
				this.focusZone = this.createFocusZone(this.container, () => this.getFocusEntryPoint());
			}
			this.focusZone.activate();
		}
		deactivateFocusZone() {
			this.focusZone?.deactivate();
		}
		destroy() {
			this.items.forEach(item => main_core.Event.unbind(item.root, 'click', this.itemClickHandler));
			this.deactivateFocusZone();
			this.focusZone = null;
			this.items = [];
			this.container = null;
			this.callbacks = null;
		}
	}

	/**
	 * Switch semantics over the node of a third-party switcher widget: role, state, keyboard.
	 * The widget instance is owned by the column and comes in ready: the adapter neither creates
	 * nor looks it up. Keyboard activation goes through the same public method as a mouse click.
	 */
	class DeviceSwitch {
		constructor({
			switcher,
			labelId = '',
			blocked = false
		}) {
			this.switcher = switcher;
			this.node = switcher.getNode();
			this.keydownHandler = this.onKeydown.bind(this);
			main_core.Dom.attr(this.node, {
				role: 'switch',
				tabindex: '0',
				'aria-checked': String(this.switcher.isChecked()),
				'aria-disabled': String(blocked),
				'aria-labelledby': labelId,
				'data-testid': 'device-selector-switcher'
			});
			main_core.Event.bind(this.node, 'keydown', this.keydownHandler);
		}
		getNode() {
			return this.node;
		}
		onKeydown(event) {
			const isEnter = event.key === 'Enter';
			const isSpace = event.key === ' ';
			if (!isEnter && !isSpace) {
				return;
			}
			if (isSpace) {
				// Prevent page scroll on Space activation
				event.preventDefault();
			}

			// toggle() self-guards isDisabled(); no extra check needed
			this.switcher.toggle(event);
		}
		syncChecked() {
			if (!this.node) {
				return;
			}
			main_core.Dom.attr(this.node, 'aria-checked', String(this.switcher.isChecked()));
		}
		setBlocked(value) {
			if (!this.node) {
				return;
			}
			main_core.Dom.attr(this.node, 'aria-disabled', String(value));

			// Soft state only: the widget must stay reachable by keyboard, so its second argument
			// is silenced: by default disable() fires a lock event nobody listens to
			this.switcher.disable(value, false);
		}
		destroy() {
			if (!this.node) {
				return;
			}
			main_core.Event.unbind(this.node, 'keydown', this.keydownHandler);
			this.node = null;
			this.switcher = null;
		}
	}

	/**
	 * Lazily loads the video quality slider extension and renders it inside a device menu column.
	 * Everything it needs is passed explicitly by the owning DeviceMenu: whether the quality
	 * control should be shown at all, the initial blocked state of the column, and a callback
	 * invoked when the quality changes.
	 */
	class VideoQualityController {
		constructor({
			isShowVideoQuality,
			menuBlocked,
			onChangeVideoQuality
		}) {
			this.isShowVideoQuality = isShowVideoQuality;
			this.menuBlocked = menuBlocked;
			this.callbacks = {
				onChangeVideoQuality
			};
			this.instance = null;
			this.container = null;
			this.pendingDisabled = null;
			this.pendingDefaultHeight = null;

			// The height can change while the extension is still loading, so the controller listens
			// from the start and replays the last value onto the slider it builds
			this.handleDefaultHeightChange = this.handleDefaultHeightChange.bind(this);
			call_core.Hardware.subscribe(call_core.Hardware.Events.onChangeMaxLocalStreamQualityHeight, this.handleDefaultHeightChange);
		}
		handleDefaultHeightChange() {
			this.setDefaultHeight(call_core.Hardware.maxLocalStreamQualityHeight);
		}
		render() {
			if (!this.isShowVideoQuality) {
				return null;
			}
			if (this.container) {
				return this.container;
			}
			this.container = main_core.Dom.create('div', {
				props: {
					className: 'bx-call-view-device-selector-quality'
				},
				attrs: {
					'data-testid': 'device-selector-quality'
				}
			});

			// The container is returned right away, so the load runs unawaited: the tail catch is
			// what keeps an escaped error a reported one instead of an unhandled rejection
			this.loadSlider().catch(error => console.error(error));
			return this.container;
		}

		// The load and the build fail apart from each other, and each stage recovers on its own:
		// a missing extension leaves the column without a place for the slider, a broken build
		// drops the instance and keeps the place. Keep the try around the await alone - widening it
		// back over the build is what made a broken slider look like a missing extension
		async loadSlider() {
			let exports = null;
			try {
				exports = await main_core.Runtime.loadExtension('call.legacy.component.video-quality-range');
			} catch (error) {
				void console.error(error);
				this.container = null;
				return;
			}
			this.buildSlider(exports);
		}
		buildSlider(exports) {
			// A null container means the controller was released while the extension was loading
			if (this.container === null) {
				return;
			}
			try {
				const {
					VideoQualityRange
				} = exports;
				this.instance = new VideoQualityRange({
					container: this.container,
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
						this.callbacks?.onChangeVideoQuality?.(videoQuality);
					}
				});
				this.instance.init();
				if (this.pendingDisabled !== null) {
					this.instance.setDisabled(this.pendingDisabled);
					this.pendingDisabled = null;
				}
				if (this.pendingDefaultHeight !== null) {
					this.instance.setDefaultHeight(this.pendingDefaultHeight);
					this.pendingDefaultHeight = null;
				}
			} catch (error) {
				void console.error(error);
				this.releaseInstance();
			}
		}

		// A slider that threw midway still owns a mounted Vue app, and its own release may throw too:
		// dropping the reference without this leaves that app in the DOM until the page reloads
		releaseInstance() {
			try {
				this.instance?.destroy();
			} catch (error) {
				void console.error(error);
			}
			this.instance = null;
		}
		setDisabled(value) {
			this.menuBlocked = value;
			if (this.instance) {
				this.instance.setDisabled(value);
			} else {
				this.pendingDisabled = value;
			}
		}
		setDefaultHeight(value) {
			if (this.instance) {
				this.instance.setDefaultHeight(value);
			} else {
				this.pendingDefaultHeight = value;
			}
		}
		destroy() {
			call_core.Hardware.unsubscribe(call_core.Hardware.Events.onChangeMaxLocalStreamQualityHeight, this.handleDefaultHeightChange);
			this.releaseInstance();
			this.container = null;
			this.pendingDisabled = null;
			this.pendingDefaultHeight = null;
			this.callbacks = null;
		}
	}

	const CONTAINER_CLASS = 'bx-call-view-device-selector-menu-container';
	const CONTAINER_BLOCKED_CLASS = `${CONTAINER_CLASS}-blocked`;
	class DeviceMenu {
		constructor({
			testId = '',
			blocked = false,
			deviceList = [],
			selectedDevice = '',
			deviceEnabled = false,
			deviceLabel = '',
			deviceListLabel = '',
			icons = [],
			showVideoQuality = false,
			onSwitch,
			onSelect,
			onChangeVideoQuality
		}) {
			this.testId = testId;
			this.menuBlocked = blocked;
			this.deviceEnabled = deviceEnabled;
			this.deviceLabel = deviceLabel;
			this.icons = icons;
			this.callbacks = {
				onSwitch,
				onSelect,
				onChangeVideoQuality
			};
			this.isDestroyed = false;
			this.labelId = `bx-call-view-device-selector-label-${main_core.Text.getRandom()}`;
			this.elements = {
				root: null,
				switchIcon: null
			};
			this.switcher = new ui_switcher.Switcher({
				size: 'small',
				checked: this.deviceEnabled,
				handlers: {
					toggled: this.onSwitchToggled.bind(this)
				},
				disabled: this.menuBlocked
			});
			this.deviceSwitch = new DeviceSwitch({
				switcher: this.switcher,
				labelId: this.labelId,
				blocked: this.menuBlocked
			});
			this.deviceRadioGroup = new DeviceRadioGroup({
				deviceList,
				selectedDevice,
				ariaLabel: deviceListLabel,
				createFocusZone: (container, focusInStrategy) => new ui_a11y.FocusZone(container, {
					bindKeys: ui_a11y.FocusKeys.ArrowAll | ui_a11y.FocusKeys.HomeAndEnd,
					focusOutBehavior: 'wrap',
					focusInStrategy
				}),
				onSelect: deviceId => this.callbacks?.onSelect?.(deviceId)
			});
			this.videoQualityController = new VideoQualityController({
				isShowVideoQuality: showVideoQuality,
				menuBlocked: this.menuBlocked,
				onChangeVideoQuality: videoQuality => this.callbacks?.onChangeVideoQuality?.(videoQuality)
			});
		}
		static create(config) {
			return new DeviceMenu(config);
		}
		render() {
			if (this.elements.root) {
				return this.elements.root;
			}
			this.elements.root = main_core.Dom.create('div', {
				props: {
					className: this.getRootClassName()
				},
				attrs: {
					'data-testid': this.testId
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-call-view-device-selector-switch-wrapper'
					},
					children: [this.elements.switchIcon = main_core.Dom.create('div', {
						props: {
							className: `bx-call-view-device-selector-device-icon ${this.getDeviceIconClass()}`
						}
					}), main_core.Dom.create('span', {
						props: {
							className: 'bx-call-view-device-selector-device-text'
						},
						attrs: {
							id: this.labelId
						},
						text: this.deviceLabel
					}), main_core.Dom.create('div', {
						props: {
							className: 'bx-call-view-device-selector-device-switch'
						},
						attrs: {
							'data-testid': 'device-selector-device-switch'
						},
						children: [this.deviceSwitch.getNode()]
					})]
				}), this.deviceRadioGroup.render(), this.videoQualityController.render()]
			});
			return this.elements.root;
		}

		// Every public method below is a no-op once the column is released: destroy() nulls the
		// fields they work with, so without the guard a late call would throw instead of doing nothing
		activateFocusManagement() {
			if (this.isDestroyed) {
				return;
			}
			this.deviceRadioGroup.activateFocusZone();
		}
		block() {
			if (this.isDestroyed || this.menuBlocked) {
				return;
			}
			this.menuBlocked = true;
			main_core.Dom.addClass(this.elements.root, CONTAINER_BLOCKED_CLASS);
			this.deviceSwitch.setBlocked(true);
			this.videoQualityController.setDisabled(true);
		}
		unblock() {
			if (this.isDestroyed || !this.menuBlocked) {
				return;
			}
			this.menuBlocked = false;
			main_core.Dom.removeClass(this.elements.root, CONTAINER_BLOCKED_CLASS);
			this.deviceSwitch.setBlocked(false);
			this.videoQualityController.setDisabled(false);
		}
		getRootClassName() {
			return this.menuBlocked ? `${CONTAINER_CLASS} ${CONTAINER_BLOCKED_CLASS}` : CONTAINER_CLASS;
		}
		getDeviceIconClass() {
			let result = '';
			if (this.deviceEnabled && this.icons.length > 0) {
				result = this.icons[0];
			} else if (!this.deviceEnabled && this.icons.length > 1) {
				result = this.icons[1];
			}
			return result;
		}
		onSwitchToggled() {
			// The widget cannot fire this after the release: its handler is unbound and its node
			// is detached. The guard covers a call made in bypass of the widget
			if (this.isDestroyed || this.menuBlocked) {
				return;
			}
			this.deviceEnabled = !this.deviceEnabled;
			this.elements.switchIcon.className = `bx-call-view-device-selector-device-icon ${this.getDeviceIconClass()}`;
			this.deviceSwitch.syncChecked();
			this.callbacks.onSwitch?.(this.deviceEnabled);
		}
		confirmSelection(deviceId) {
			if (this.isDestroyed) {
				return;
			}
			this.deviceRadioGroup.confirmSelection(deviceId);
		}
		destroy() {
			if (this.isDestroyed) {
				return;
			}
			this.isDestroyed = true;
			this.deviceSwitch.destroy();
			this.deviceRadioGroup.destroy();
			this.videoQualityController.destroy();

			// The widget stays in the static registry of the switcher forever, so the column
			// lets go of everything itself: otherwise the registry keeps the call screen too
			this.switcher = null;
			this.deviceSwitch = null;
			this.deviceRadioGroup = null;
			this.videoQualityController = null;
			this.callbacks = null;
			this.elements.root = null;
			this.elements.switchIcon = null;
		}
	}

	class DeviceSelector {
		constructor(config) {
			this.viewElement = config.viewElement || null;
			this.parentElement = config.parentElement;
			// An explicitly passed call wins over the global one, including an explicit null:
			// the lobby and ServerPlainCall have no current Bitrix call to fall back to
			this.hasCurrentCall = Object.prototype.hasOwnProperty.call(config, 'currentCall');
			this.currentCall = config.currentCall ?? null;
			this.zIndex = config.zIndex;
			this.cameraEnabled = config.cameraEnabled ?? false;
			this.cameraId = config.cameraId ?? '';
			this.microphoneEnabled = config.microphoneEnabled ?? false;
			this.microphoneId = config.microphoneId ?? '';
			this.speakerEnabled = config.speakerEnabled ?? false;
			this.speakerId = config.speakerId ?? '';
			this.allowNoiseSuppression = config.allowNoiseSuppression ?? false;
			this.faceImproveEnabled = config.faceImproveEnabled ?? false;
			this.allowFaceImprove = config.allowFaceImprove ?? false;
			this.allowBackground = config.allowBackground ?? true;
			this.allowMask = config.allowMask ?? true;
			this.allowAdvancedSettings = config.allowAdvancedSettings ?? false;
			this.switchCameraBlocked = config.switchCameraBlocked || false;
			this.switchMicrophoneBlocked = config.switchMicrophoneBlocked || false;
			this.isDestroyed = false;
			this.isCameraWasEnabledBeforeQualityChanged = false;
			this.popup = null;

			// Two consumers instantiate the selector, so checkbox ids are per instance:
			// a static id would break the label-to-checkbox link of the second one
			this.noiseSuppressionId = `bx-call-view-device-selector-noise-suppression-${main_core.Text.getRandom()}`;
			this.faceImproveId = `bx-call-view-device-selector-face-improve-${main_core.Text.getRandom()}`;
			const callbacks = config.callbacks ?? {};
			this.callbacks = {
				onShow: callbacks.onShow,
				onMicrophoneSwitch: callbacks.onMicrophoneSwitch,
				onMicrophoneSelect: callbacks.onMicrophoneSelect,
				onCameraSwitch: callbacks.onCameraSwitch,
				onCameraSelect: callbacks.onCameraSelect,
				onChangeVideoQuality: callbacks.onChangeVideoQuality,
				onSpeakerSwitch: callbacks.onSpeakerSwitch,
				onSpeakerSelect: callbacks.onSpeakerSelect,
				onChangeNoiseSuppression: callbacks.onChangeNoiseSuppression,
				onChangeFaceImprove: callbacks.onChangeFaceImprove,
				onAdvancedSettingsClick: callbacks.onAdvancedSettingsClick,
				onDestroy: callbacks.onDestroy
			};
			this.elements = {
				root: null
			};
		}
		show() {
			// Destruction is terminal: the columns are released and never rebuilt,
			// so a second life of the instance would leak everything it creates here
			if (this.isDestroyed) {
				return;
			}
			this.isCameraWasEnabledBeforeQualityChanged = call_core.Hardware.isCameraOn;
			if (this.popup) {
				this.popup.show();
				return;
			}
			this.popup = new main_popup.Popup({
				id: 'call-view-device-selector',
				className: 'call-view-device-selector-popup',
				ariaLabel: main_core.Loc.getMessage('CALL_DEVICE_SELECTOR_POPUP_ARIA'),
				// The platform keeps the focus trap off by default, so the popup enables it
				// explicitly: nothing else moves keyboard focus into a non-modal dialog.
				// Looping is switched off - Tab must leave the popup back to the call screen
				focusTrap: {
					isolateOutside: false,
					looped: false
				},
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
					onAfterPopupShow: () => this.onAfterPopupShow(),
					onPopupClose: () => this.popup.destroy(),
					onPopupDestroy: () => this.destroy()
				}
			});
			this.popup.show();
			this.callbacks.onShow?.();
		}

		// Focus management is activated only after the popup is shown: before that the columns
		// live in a hidden subtree and the focusable set comes out empty
		onAfterPopupShow() {
			this.microphoneContainer?.activateFocusManagement();
			this.cameraContainer?.activateFocusManagement();
			this.speakerContainer?.activateFocusManagement();
		}
		render() {
			// The columns are built as a side effect of the markup, so the result is cached:
			// a second render would replace them with a fresh set and drop the previous one unreleased
			if (this.elements.root) {
				return this.elements.root;
			}
			this.elements.root = main_core.Dom.create('div', {
				props: {
					className: 'bx-call-view-device-selector'
				},
				attrs: {
					'data-testid': 'device-selector-popup'
				},
				children: [this.renderDeviceColumns(), this.renderBottomPanel()]
			});
			return this.elements.root;
		}
		renderDeviceColumns() {
			this.microphoneContainer = DeviceMenu.create({
				testId: 'device-selector-column-microphone',
				blocked: this.switchMicrophoneBlocked,
				deviceLabel: main_core.Loc.getMessage('IM_M_CALL_BTN_MIC'),
				deviceListLabel: main_core.Loc.getMessage('CALL_VIEW_MIC_DEVICE_ARIA'),
				deviceList: call_core.Hardware.getMicrophoneList(),
				selectedDevice: this.microphoneId,
				deviceEnabled: this.microphoneEnabled,
				icons: ['microphone', 'microphone-off'],
				onSwitch: this.onMicrophoneSwitch.bind(this),
				onSelect: this.onMicrophoneSelect.bind(this)
			});
			this.cameraContainer = DeviceMenu.create({
				testId: 'device-selector-column-camera',
				blocked: this.switchCameraBlocked,
				deviceLabel: main_core.Loc.getMessage('IM_M_CALL_BTN_CAMERA'),
				deviceListLabel: main_core.Loc.getMessage('CALL_VIEW_CAMERA_DEVICE_ARIA'),
				deviceList: call_core.Hardware.getCameraList(),
				selectedDevice: this.cameraId,
				deviceEnabled: this.cameraEnabled,
				icons: ['camera', 'camera-off'],
				showVideoQuality: this.isVideoQualityAvailable(),
				onSwitch: this.onCameraSwitch.bind(this),
				onSelect: this.onCameraSelect.bind(this),
				onChangeVideoQuality: this.onVideoQualityChanged.bind(this)
			});
			return main_core.Dom.create('div', {
				props: {
					className: 'bx-call-view-device-selector-top'
				},
				children: [this.microphoneContainer.render(), this.cameraContainer.render(), this.renderSpeakerColumn()]
			});
		}

		// The slider lives in the camera column, but whether it is offered at all depends on the
		// current call: a column knows nothing about that and must be told
		isVideoQualityAvailable() {
			const currentCall = this.hasCurrentCall ? this.currentCall : call_core.Util.getCurrentBitrixCall();

			// A Plain call carries the slider only through the media server: peer-to-peer
			// has no server side to apply the chosen quality on
			const supportsVideoQuality = currentCall?.provider === call_core.Provider.Bitrix || currentCall?.provider === call_core.Provider.Plain && currentCall.useMediaServer === true;
			return call_core.Util.isStreamQualityFeatureEnabled() && supportsVideoQuality;
		}
		renderSpeakerColumn() {
			if (!call_core.Hardware.canSelectSpeaker()) {
				return null;
			}
			this.speakerContainer = DeviceMenu.create({
				testId: 'device-selector-column-speaker',
				deviceLabel: main_core.Loc.getMessage('IM_M_CALL_BTN_SPEAKER'),
				deviceListLabel: main_core.Loc.getMessage('CALL_VIEW_SPEAKER_DEVICE_ARIA'),
				deviceList: call_core.Hardware.getSpeakerList(),
				selectedDevice: this.speakerId,
				deviceEnabled: this.speakerEnabled,
				icons: ['speaker', 'speaker-off'],
				onSwitch: this.onSpeakerSwitch.bind(this),
				onSelect: this.onSpeakerSelect.bind(this)
			});
			return this.speakerContainer.render();
		}
		renderBottomPanel() {
			return main_core.Dom.create('div', {
				props: {
					className: 'bx-call-view-device-selector-bottom'
				},
				children: [this.renderNoiseSuppressionItem(), this.renderFaceImproveItem(), this.renderBackgroundItem(), this.renderSelfTestItem(), this.renderAdvancedSettingsItem()]
			});
		}
		renderNoiseSuppressionItem() {
			return main_core.Dom.create('div', {
				props: {
					className: 'bx-call-view-device-selector-bottom-item'
				},
				children: [main_core.Dom.create('input', {
					props: {
						id: this.noiseSuppressionId,
						className: 'bx-call-view-device-selector-bottom-item-checkbox'
					},
					attrs: {
						type: 'checkbox',
						checked: this.allowNoiseSuppression,
						'data-testid': 'device-selector-noise-suppression'
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
						for: this.noiseSuppressionId
					},
					text: main_core.Loc.getMessage('CALL_NOISE_SUPPRESSION')
				})]
			});
		}
		renderFaceImproveItem() {
			if (!this.allowFaceImprove) {
				return null;
			}
			return main_core.Dom.create('div', {
				props: {
					className: 'bx-call-view-device-selector-bottom-item'
				},
				children: [main_core.Dom.create('input', {
					props: {
						id: this.faceImproveId,
						className: 'bx-call-view-device-selector-bottom-item-checkbox'
					},
					attrs: {
						type: 'checkbox',
						checked: this.faceImproveEnabled,
						'data-testid': 'device-selector-face-improve'
					},
					events: {
						change: this.onFaceImproveChange.bind(this)
					}
				}), main_core.Dom.create('label', {
					props: {
						className: 'bx-call-view-device-selector-bottom-item-label'
					},
					attrs: {
						for: this.faceImproveId
					},
					text: main_core.Loc.getMessage('IM_SETTINGS_HARDWARE_CAMERA_FACE_IMPROVE')
				})]
			});
		}
		renderBackgroundItem() {
			if (!this.allowBackground) {
				return null;
			}
			return main_core.Dom.create('div', {
				props: {
					className: 'bx-call-view-device-selector-bottom-item'
				},
				children: [main_core.Dom.create('button', {
					props: {
						className: 'bx-call-view-device-selector-bottom-item-action'
					},
					attrs: {
						type: 'button',
						'data-testid': 'device-selector-background'
					},
					text: this.allowMask ? main_core.Loc.getMessage('IM_M_CALL_BG_MASK_CHANGE') : main_core.Loc.getMessage('IM_M_CALL_BACKGROUND_CHANGE'),
					events: {
						click: () => {
							call_core.BackgroundDialog.open();
							this.popup?.close();
						}
					}
				})]
			});
		}
		renderSelfTestItem() {
			return main_core.Dom.create('div', {
				props: {
					className: 'bx-call-view-device-selector-bottom-item'
				},
				children: [main_core.Dom.create('button', {
					props: {
						className: 'bx-call-view-device-selector-bottom-item-action'
					},
					attrs: {
						type: 'button',
						'data-testid': 'device-selector-self-test'
					},
					text: main_core.Loc.getMessage('CALL_RUN_SELF_TEST'),
					events: {
						click: () => {
							call_core.Util.startSelfTest();
							this.popup?.close();
						}
					}
				})]
			});
		}
		renderAdvancedSettingsItem() {
			// BX.MessengerCommon is required by the handler itself: BX.IM.openSettings() calls
			// isPage()/isDesktop() on it, so without the legacy bundle the action just throws
			const isAdvancedSettingsAvailable = this.allowAdvancedSettings && Boolean(BX.MessengerCommon);
			if (!isAdvancedSettingsAvailable) {
				return null;
			}
			return main_core.Dom.create('div', {
				props: {
					className: 'bx-call-view-device-selector-bottom-item'
				},
				children: [main_core.Dom.create('button', {
					props: {
						className: 'bx-call-view-device-selector-bottom-item-action'
					},
					attrs: {
						type: 'button',
						'data-testid': 'device-selector-advanced-settings'
					},
					text: main_core.Loc.getMessage('IM_M_CALL_ADVANCED_SETTINGS'),
					events: {
						click: e => {
							// to prevent BX.IM.autoHide
							e.stopPropagation();
							this.callbacks?.onAdvancedSettingsClick?.();
							this.popup?.close();
						}
					}
				})]
			});
		}
		toggleCameraAvailability(available) {
			if (available) {
				this.cameraContainer?.unblock();
				return;
			}
			this.cameraContainer?.block();
		}
		toggleMicrophoneAvailability(available) {
			if (available) {
				this.microphoneContainer?.unblock();
				return;
			}
			this.microphoneContainer?.block();
		}

		// The columns report to the methods below, and destroy() drops the callbacks they read,
		// so each of them is a no-op after the release: the same rule the columns follow
		onMicrophoneSwitch() {
			if (this.isDestroyed) {
				return;
			}
			this.microphoneEnabled = !this.microphoneEnabled;
			this.callbacks.onMicrophoneSwitch?.(this.microphoneEnabled);
		}
		onMicrophoneSelect(deviceId) {
			if (this.isDestroyed) {
				return;
			}
			this.callbacks.onMicrophoneSelect?.(deviceId);
		}
		onCameraSwitch() {
			if (this.isDestroyed) {
				return;
			}
			this.cameraEnabled = !this.cameraEnabled;
			this.callbacks.onCameraSwitch?.(this.cameraEnabled);
		}
		onCameraSelect(deviceId) {
			if (this.isDestroyed) {
				return;
			}
			this.callbacks.onCameraSelect?.(deviceId);
		}
		onVideoQualityChanged(videoQuality) {
			if (this.isDestroyed) {
				return;
			}
			this.callbacks.onChangeVideoQuality?.({
				videoQuality,
				isCameraWasEnabledBeforeQualityChanged: this.isCameraWasEnabledBeforeQualityChanged
			});
		}
		onSpeakerSwitch() {
			if (this.isDestroyed) {
				return;
			}
			this.speakerEnabled = !this.speakerEnabled;
			this.callbacks.onSpeakerSwitch?.(this.speakerEnabled);
		}
		onSpeakerSelect(deviceId) {
			if (this.isDestroyed) {
				return;
			}
			this.callbacks.onSpeakerSelect?.(deviceId);
		}
		confirmSpeakerSelection(deviceId) {
			this.speakerContainer?.confirmSelection(deviceId);
		}
		onAllowNoiseSuppression(e) {
			if (this.isDestroyed) {
				return;
			}
			this.allowNoiseSuppression = e.currentTarget.checked;
			this.callbacks.onChangeNoiseSuppression?.(this.allowNoiseSuppression);
		}
		onFaceImproveChange(e) {
			if (this.isDestroyed) {
				return;
			}
			this.faceImproveEnabled = e.currentTarget.checked;
			this.callbacks.onChangeFaceImprove?.(this.faceImproveEnabled);
		}
		destroy() {
			if (this.isDestroyed) {
				return;
			}
			this.isDestroyed = true;
			this.microphoneContainer?.destroy();
			this.cameraContainer?.destroy();
			this.speakerContainer?.destroy();
			if (this.popup) {
				this.popup.destroy();
				this.popup = null;
			}
			this.callbacks.onDestroy?.();

			// The callbacks are closed over the call screen, so they are dropped only after
			// the owner has been notified: a column left here would keep that screen alive
			this.microphoneContainer = null;
			this.cameraContainer = null;
			this.speakerContainer = null;
			this.callbacks = null;

			// The detached popup subtree outlives the release, so the nodes it was bound to are
			// dropped as well: the call screen root is one of them
			this.viewElement = null;
			this.parentElement = null;
			this.elements.root = null;
		}
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
		moveTo(order) {
			this.order = order;
		}

		/**
		 * Takes over the position of another user, so the position held before the swap no longer applies.
		 */
		takeOrderOf(order) {
			this.order = order;
			this.prevOrder = 0;
		}

		/**
		 * Steps aside keeping the current position, so the user returns to it after reconnecting.
		 */
		moveAsideTo(order) {
			this.prevOrder = this.order;
			this.order = order;
		}
		get isConnected() {
			return this.state === call_core.UserState.Connected;
		}

		/**
		 * Still holds a place in the call: has not left, declined or turned out unavailable,
		 * and is not a receive-only viewer.
		 */
		get hasActiveState() {
			return this.state !== call_core.UserState.Idle && this.state !== call_core.UserState.Declined && this.state !== call_core.UserState.Unavailable && this.state !== call_core.UserState.Busy && this.direction !== call_core.EndpointDirection.RecvOnly;
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

	const PIP_WINDOW_WIDTH = 370;
	const PIP_WINDOW_HEIGHT = 215;
	const PIP_MIN_HEIGHT = 80;
	const PIP_MIN_WIDTH = 310;
	const AVATAR_SIZE_RATIO = 0.45;
	const AVATAR_TEXT_SIZE_RATIO = 0.45;
	const FLOOR_REQUEST_HIDE_DELAY = 5000;
	const FLOOR_REQUEST_POPUP_WIDTH = 244;
	const POPUP_HORIZONTAL_OFFSET = 16;
	// the window runs its own panel, so its items live in their own hook namespace
	const PIP_TEST_ID_PREFIX = 'call-pip';
	const FLOOR_REQUESTS_TEST_ID = `${PIP_TEST_ID_PREFIX}-floor-requests`;
	const LIVE_REGION_TEST_ID = `${PIP_TEST_ID_PREFIX}-live-region`;
	// the pause the emptied region is held for before the text lands, and the one the text is held for
	// before the next message takes its place
	const ANNOUNCEMENT_WRITE_DELAY = 100;
	const ANNOUNCEMENT_HOLD_DELAY = 1500;
	// a burst of raised hands outruns the region: one message takes 1.6 s, so a longer queue would still
	// be naming people whose hand is already down. Past this length the names give way to a count.
	const ANNOUNCEMENT_QUEUE_LIMIT = 4;
	// the popup lives outside the root of the window, so the root is told about it by a class of
	// its own: without it the panel collapses as soon as the focus enters the list
	const POPUP_OPEN_CLASS = 'bx-call-picture-in-picture-window_popup-open';

	// The order of an announced enumeration belongs to this table, not to the list that arrives: the
	// list is assembled in the order the main window happens to check its buttons in. The names are
	// phrases of their own: the captions of the buttons are capitalised, and the screen button of this
	// window is captioned with a single word that says nothing inside a list of what is unavailable.
	const BLOCKABLE_CONTROLS = [{
		name: 'microphone',
		messageId: 'CALL_VIEW_PIP_CONTROL_MICROPHONE'
	}, {
		name: 'camera',
		messageId: 'CALL_VIEW_PIP_CONTROL_CAMERA'
	}, {
		name: 'screen',
		messageId: 'CALL_VIEW_PIP_CONTROL_SCREEN'
	}];
	const CONTROLS_SEPARATOR = ', ';

	// a custom element of ui.a11y stays unupgraded in the document of the window: the registry of
	// custom elements belongs to the window that declared them, so the hiding is done by styles
	const VISUALLY_HIDDEN_STYLE = {
		position: 'absolute',
		width: '1px',
		height: '1px',
		margin: '-1px',
		padding: '0',
		overflow: 'hidden',
		clip: 'rect(0 0 0 0)',
		whiteSpace: 'nowrap',
		border: '0'
	};

	/**
	 * The document of a freshly requested window carries neither a language nor a name of its own.
	 * Both are values of the opener, so they are put in from the outside and nothing else about the
	 * window is known here.
	 */
	function applyPipDocumentAttributes(targetDocument, {
		lang,
		title
	} = {}) {
		if (!targetDocument) {
			return;
		}
		if (main_core.Type.isStringFilled(lang)) {
			targetDocument.documentElement?.setAttribute('lang', lang);
		}
		if (main_core.Type.isStringFilled(title)) {
			// the document of the window has no <title> node at all: the browser creates one by the
			// assignment itself, and building the node by hand would leave the window unnamed
			// eslint-disable-next-line no-param-reassign -- naming the document given is the whole job
			targetDocument.title = title;
		}
	}
	class PictureInPictureWindow {
		#isClosing = false;
		#isProgrammaticClose = false;
		#blockedButtonsKey = '';
		#liveRegion = null;
		#announcementQueue = [];
		#announcementTimeoutId = null;
		constructor(config) {
			this.pictureWindow = null;
			this.template = null;
			this.userPanel = null;
			this.actionsPanel = null;
			this.notificationPanel = null;
			this.focusedButtonTestId = null;
			this.hardwareState = config.hardwareState;
			this.buttonNames = config.buttons || [];
			this.preferInitialWindowPlacement = config.preferInitialWindowPlacement;
			this.user = null;
			this.userData = config.currentUser;

			// the name of the call is read once, at the moment the window opens, and never followed
			this.accessibleName = config.accessibleName || '';
			this.blockedButtons = config.blockedButtons || [];
			// the state the window opened with is not an event of the window: seeding the key here is
			// what keeps the first sync from announcing a blocking that was already in place
			this.#blockedButtonsKey = this.blockedButtons.join(',');
			this.previousFloorRequestNotifications = config.floorRequestNotifications || [];
			this.callbacks = {
				onButtonClick: main_core.Type.isFunction(config.onButtonClick) ? config.onButtonClick : () => {},
				onClose: main_core.Type.isFunction(config.onClose) ? config.onClose : () => {}
			};
			this.isMinHeight = false;
			this.isMinWidth = false;
			this.floorRequestElements = {
				counter: null,
				counterValue: null,
				counterDescription: null,
				mainNotification: null,
				popup: null,
				popupTemplate: null
			};
			this.floorRequestsList = [];
			this.floorRequestTimeout = null;
			// tells whether the focus has to be led into the list on opening, and keeps a stray mouse
			// move from collapsing a list the user works with from the keyboard
			this.floorRequestsOpenedFromKeyboard = false;
			this.floorRequestsFocusWasInside = false;
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

		// The only way the blocking of the panel enters this window, and the only record of what has
		// already been announced - the key is the list the window last synced with. A change the caller
		// asks to keep quiet moves the key too, so the state and the record never drift apart.
		syncBlockButtons(buttonsList, {
			announce = true
		} = {}) {
			const cacheKey = buttonsList.join(',');
			if (this.#blockedButtonsKey === cacheKey) {
				return;
			}
			const previousList = this.#blockedButtonsKey === '' ? [] : this.#blockedButtonsKey.split(',');
			this.#blockedButtonsKey = cacheKey;
			this.blockedButtons = buttonsList;
			if (announce) {
				this.#announceBlockedButtonsChange(previousList, buttonsList);
			}
			this.updateButtons();
		}

		// what has just changed is spoken, not what the state is: the whole list arrives on every update,
		// and naming everything blocked each time would repeat what the user has already heard. A change
		// in both directions is two announcements, and the queue of the region holds them apart.
		#announceBlockedButtonsChange(previousList, currentList) {
			this.#announceControls('CALL_VIEW_PIP_CONTROLS_BLOCKED', currentList.filter(name => !previousList.includes(name)));
			this.#announceControls('CALL_VIEW_PIP_CONTROLS_UNBLOCKED', previousList.filter(name => !currentList.includes(name)));
		}
		#announceControls(messageId, names) {
			const controls = BLOCKABLE_CONTROLS.filter(control => names.includes(control.name)).map(control => main_core.Loc.getMessage(control.messageId)).filter(name => main_core.Type.isStringFilled(name)).join(CONTROLS_SEPARATOR);

			// nothing to name: an unchanged half of the list, or a button this window cannot speak of
			if (controls === '') {
				return;
			}
			this.#announce(main_core.Loc.getMessage(messageId, {
				'#CONTROLS#': controls
			}));
		}
		setButtons(buttonsList) {
			this.buttonNames = buttonsList;
			return this;
		}

		// the panel is rebuilt from scratch, so the focus is carried across the rebuild by the only
		// anchor that survives it: the test hook of the button
		captureFocusedButton() {
			this.focusedButtonTestId = null;
			const doc = this.pictureWindow?.document;
			// activeElement answers even for a document that holds no focus: without hasFocus() an
			// update would tear the focus out of whatever the user is typing in the main window
			if (!doc?.hasFocus()) {
				return;
			}
			const active = doc.activeElement;
			if (!active || !this.actionsPanel?.contains(active)) {
				return;
			}
			this.focusedButtonTestId = active.getAttribute('data-testid');
		}
		restoreFocusedButton() {
			const testId = this.focusedButtonTestId;
			this.focusedButtonTestId = null;
			if (!testId) {
				return false;
			}
			const node = this.actionsPanel?.querySelector(`[data-testid="${testId}"]`);
			if (!node) {
				return false;
			}
			node.focus();

			// focus() stays silent on a node that cannot take it, a button the mode change brought
			// back hidden for one, so the verdict is read back from the document
			return this.pictureWindow?.document?.activeElement === node;
		}
		updateButtons() {
			this.captureFocusedButton();
			main_core.Dom.clean(this.actionsPanel);
			this.renderButtons();
			this.restoreFocusedButton();
		}
		getButtonTextBySizePictureWindow(text) {
			return this.isMinHeight || this.isMinWidth ? '' : text;
		}

		// a small window drops the visible caption and leaves the button with no accessible name;
		// naming a button that still shows its caption would break SC 2.5.3 instead
		getButtonLabels(message) {
			const text = this.getButtonTextBySizePictureWindow(message);
			return text === '' ? {
				text,
				ariaLabel: message
			} : {
				text
			};
		}

		// Single entry point for the panel of this window: the namespace belongs to the window,
		// so it is bound here once instead of at every button
		#mountButton(ButtonClass, config) {
			const button = new ButtonClass({
				...config,
				testIdPrefix: PIP_TEST_ID_PREFIX
			});
			main_core.Dom.append(button.render(), this.actionsPanel);
			return button;
		}
		renderButtons() {
			if (!this.actionsPanel && this.buttonNames.length > 0) {
				// The buttons repeat the panel of the call screen down to their classes, so the
				// namespace is what tells the two panels apart, both here and in the buttons
				this.actionsPanel = main_core.Dom.create('div', {
					props: {
						className: 'bx-call-picture-in-picture-window__actions'
					},
					attrs: {
						'data-testid': `${PIP_TEST_ID_PREFIX}-panel`
					}
				});
			}
			for (const buttonName of this.buttonNames) {
				switch (buttonName) {
					case 'microphone':
						this.#mountButton(this.uiDeps.Buttons.DeviceButton, {
							class: 'microphone',
							backgroundClass: 'bx-call-picture-in-picture-window__button-background',
							...this.getButtonLabels(main_core.Loc.getMessage('IM_M_CALL_BTN_MIC')),
							enabled: !this.hardwareState.isMicrophoneMuted,
							arrowHidden: true,
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
						break;
					case 'camera':
						this.#mountButton(this.uiDeps.Buttons.DeviceButton, {
							class: 'camera',
							backgroundClass: 'bx-call-picture-in-picture-window__button-background',
							...this.getButtonLabels(main_core.Loc.getMessage('IM_M_CALL_BTN_CAMERA')),
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
						break;
					case 'returnToCall':
						this.#mountButton(this.uiDeps.Buttons.SimpleButton, {
							class: 'go-to-call',
							backgroundClass: 'bx-call-picture-in-picture-window__button-background bx-messenger-videocall-panel-icon-background-go-to-call',
							...this.getButtonLabels(main_core.Loc.getMessage('CALL_BUTTON_GO_TO_CALL')),
							onClick: event => {
								event.stopPropagation();
								this.callbacks.onButtonClick({
									buttonName: 'returnToCall',
									event
								});
								window.focus();
							}
						});
						break;
					case 'stop-screen':
						this.#mountButton(this.uiDeps.Buttons.SimpleButton, {
							class: 'stop-screen',
							backgroundClass: 'bx-call-picture-in-picture-window__button-background',
							...this.getButtonLabels(main_core.Loc.getMessage('CALL_BUTTON_STOP_SCREEN')),
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
				this.#announceFloorRequest(user.userModel);
			} else {
				this.floorRequestsList.splice(userInFloorRequestsListIndex, 1);
			}
			this.updateFloorRequestCounter();
		}

		// the phrase is shared with the visible notification, so what is heard matches what is shown
		#announceFloorRequest(userModel) {
			const messageKey = userModel.gender === 'F' ? 'IM_CALL_WANTS_TO_SAY_F' : 'IM_CALL_WANTS_TO_SAY_M';

			// the name goes in as plain text: the notification wraps it into a span, and a reader would
			// pronounce both the markup and the escaped entities of an encoded name
			this.#announce(main_core.Loc.getMessage(messageKey, {
				'#NAME#': userModel.name
			}), {
				floorRequest: true
			});
		}
		updateFloorRequestCounter(withoutRenderTemplate = false) {
			if (this.floorRequestElements.counter) {
				const count = this.floorRequestsList.length;
				this.floorRequestElements.counterValue.innerText = count;
				// the digit is hidden from the reader, so the name of the button is the only place
				// carrying both the number and what it counts
				this.floorRequestElements.counterDescription.innerText = main_core.Loc.getMessage('CALL_VIEW_PIP_FLOOR_REQUESTS_COUNT', {
					'#COUNT#': count
				});
				this.updateVisibilityFloorRequestCounter();
			}
			if (!withoutRenderTemplate) {
				this.updateTemplateForFloorRequestsPopup();
			}
		}
		getTemplateForFloorRequestsPopup() {
			const children = this.floorRequestsList.map((item, index) => {
				// initials and the ordinal repeat what the name node already says
				const avatarElement = main_core.Dom.create('div', {
					props: {
						className: 'bx-call-picture-in-picture-window__floor-request-avatar'
					},
					attrs: {
						'aria-hidden': 'true'
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
						attrs: {
							'aria-hidden': 'true'
						},
						text: index + 1
					})]
				});
			});
			return main_core.Dom.create('ul', {
				props: {
					className: 'bx-call-picture-in-picture-window__popup-template'
				},
				attrs: {
					'data-testid': `${FLOOR_REQUESTS_TEST_ID}-list`
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
			this.onFloorRequestsContentReplaced();
		}

		// setContent() raises no popup event, so the focus that sat on the replaced content has to be
		// carried over to the new one by hand
		onFloorRequestsContentReplaced() {
			const popup = this.floorRequestElements.popup;
			if (!popup?.isShown()) {
				return;
			}
			const wasInside = this.focusIsInsideContent();
			popup.setContent(this.floorRequestElements.popupTemplate);
			const content = popup.getContentContainer();
			content.setAttribute('tabindex', '-1');
			content.setAttribute('data-testid', `${FLOOR_REQUESTS_TEST_ID}-popup`);
			if (wasInside) {
				content.focus();
			}
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
			// a list opened from the keyboard belongs to the keyboard: a mouse crossing the window
			// must not take it away
			if (!this.floorRequestElements.popup || this.floorRequestsOpenedFromKeyboard) {
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

		// both ways into the list build the popup, so the mouse no longer owns its creation
		ensureFloorRequestsPopup() {
			if (this.floorRequestElements.popup) {
				return this.floorRequestElements.popup;
			}
			if (this.isMinHeight) {
				return null;
			}
			this.updateTemplateForFloorRequestsPopup();
			this.floorRequestElements.popup = new main_popup.Popup({
				className: 'bx-call-picture-in-picture-window__popup',
				bindElement: this.floorRequestElements.counter,
				targetContainer: this.pictureWindow.document.body,
				content: this.floorRequestElements.popupTemplate,
				// the counter promises aria-haspopup="dialog"; main.popup already gives its container
				// that role, and the name is the only half of the promise still missing
				ariaLabel: main_core.Loc.getMessage('CALL_VIEW_PIP_FLOOR_REQUESTS_POPUP_ARIA'),
				bindOptions: {
					position: 'top'
				},
				autoHide: true,
				closeByEsc: true,
				// the focus cycle of the list belongs to this class alone: the trap of the popup
				// activates after onPopupShow and would overrule the focus set there
				focusTrap: false,
				background: '#00428F',
				contentBackground: '#00428F',
				darkMode: true,
				contentNoPaddings: true,
				animation: 'fading',
				padding: 0,
				contentBorderRadius: '18px',
				zIndex: 11,
				events: {
					onPopupShow: () => this.onFloorRequestsPopupShow(),
					onPopupClose: () => this.onFloorRequestsPopupClose(),
					onPopupDestroy: () => this.onFloorRequestsPopupDestroy()
				}
			});
			return this.floorRequestElements.popup;
		}
		openFloorRequestsPopup({
			fromKeyboard
		} = {}) {
			const popup = this.ensureFloorRequestsPopup();
			if (!popup) {
				return;
			}
			const wasShown = popup.isShown();

			// what the keyboard has claimed stays with it until the list closes: a mouse crossing the
			// counter of a list the user works with must not hand it back to the pointer
			this.floorRequestsOpenedFromKeyboard = this.floorRequestsOpenedFromKeyboard || fromKeyboard === true;
			this.setNewSettingForPopup();
			popup.show();
			this.setFloorRequestsExpanded(true);

			// show() returns at once on a popup that already stands open, and onPopupShow with it: the
			// keyboard would be left on the counter, with the list it just opened out of the tab order
			if (wasShown && fromKeyboard === true) {
				this.onFloorRequestsPopupShow();
			}
		}
		setFloorRequestsExpanded(isExpanded) {
			this.floorRequestElements.counter?.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
			if (!this.template) {
				return;
			}
			if (isExpanded) {
				main_core.Dom.addClass(this.template, POPUP_OPEN_CLASS);
			} else {
				main_core.Dom.removeClass(this.template, POPUP_OPEN_CLASS);
			}
		}
		onFloorRequestsPopupShow() {
			const content = this.floorRequestElements.popup?.getContentContainer();
			if (!content) {
				return;
			}

			// the list takes the focus only when it is asked to: it never joins the tab order
			content.setAttribute('tabindex', '-1');
			// the container is built by main.popup, so the hook of the list is put on it from here
			content.setAttribute('data-testid', `${FLOOR_REQUESTS_TEST_ID}-popup`);
			if (this.floorRequestsOpenedFromKeyboard) {
				content.focus();
			}
		}
		onFloorRequestsPopupClose() {
			// the fading animation defers the removal of the nodes, so where the focus was has to be
			// settled before the content is torn down
			this.floorRequestsFocusWasInside = this.focusIsInsideContent();
			this.floorRequestElements.popup.destroy();
		}
		onFloorRequestsPopupDestroy() {
			this.setFloorRequestsExpanded(false);
			const wasInside = this.floorRequestsFocusWasInside;
			this.floorRequestsFocusWasInside = false;
			this.floorRequestsOpenedFromKeyboard = false;
			this.floorRequestElements.popup = null;
			if (!wasInside) {
				return;
			}
			if (this.focusIfPossible(this.floorRequestElements.counter)) {
				return;
			}

			// the last raised hand may have been lowered while the list was open, and then the counter
			// is gone together with it
			this.focusIfPossible(this.actionsPanel?.querySelector('button'));
		}
		focusIsInsideContent() {
			const content = this.floorRequestElements.popup?.getContentContainer();
			return content?.contains(this.pictureWindow?.document?.activeElement) === true;
		}

		// the counter is hidden by display: none and stays in the document, so being connected says
		// nothing about being able to take the focus: only the document knows
		focusIfPossible(node) {
			if (!node?.isConnected) {
				return false;
			}
			node.focus();
			return this.pictureWindow?.document?.activeElement === node;
		}
		renderFloorRequestCounter() {
			if (this.floorRequestElements.counter) {
				return;
			}

			// the digit alone names nothing, so it is left to the eye only
			this.floorRequestElements.counterValue = main_core.Dom.create('span', {
				attrs: {
					'aria-hidden': 'true'
				}
			});

			// the accessible name of the counter, hidden from the eye the same way the live region is
			this.floorRequestElements.counterDescription = main_core.Dom.create('span', {
				attrs: {
					'data-testid': `${FLOOR_REQUESTS_TEST_ID}-description`
				},
				style: VISUALLY_HIDDEN_STYLE
			});
			this.floorRequestElements.counter = main_core.Dom.create('button', {
				props: {
					type: 'button',
					className: 'bx-call-picture-in-picture-window__floor-requests'
				},
				attrs: {
					'data-testid': FLOOR_REQUESTS_TEST_ID,
					'aria-haspopup': AriaHasPopup.Dialog,
					'aria-expanded': 'false'
				},
				children: [this.floorRequestElements.counterValue, this.floorRequestElements.counterDescription],
				events: {
					mouseover: event => {
						event.stopPropagation();
						this.openFloorRequestsPopup({
							fromKeyboard: false
						});
					},
					// the root of the window returns to the call on a click, and the counter sits
					// inside it: without this the keyboard would close the window instead of opening
					// the list
					click: event => {
						event.stopPropagation();
						this.openFloorRequestsPopup({
							fromKeyboard: event.detail === 0
						});
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

		// A live region of its own instead of the announcer of ui.a11y: that one moves its queue by
		// animation frames of the opener, and the tab this window stands in for gets none while hidden.
		#createLiveRegion() {
			const container = this.pictureWindow?.document?.body;
			if (this.#isClosing || !container) {
				return;
			}
			this.#liveRegion = main_core.Dom.create('div', {
				attrs: {
					'aria-live': 'polite',
					'aria-atomic': 'true',
					'data-testid': LIVE_REGION_TEST_ID
				},
				style: VISUALLY_HIDDEN_STYLE
			});
			main_core.Dom.append(this.#liveRegion, container);
		}

		/**
		 * The way in for what the view has to say while this window is open: a reader following a window
		 * of its own never gets the live region of the opener. Blocking of the panel does not come this
		 * way - it goes through syncBlockButtons(), which keeps the record of what has been spoken.
		 *
		 * @param {string} message
		 * @returns {boolean} Whether the window took the message. A window whose region is not up yet
		 * leaves the announcement to the caller instead of swallowing it.
		 */
		announceMessage(message) {
			return this.#announce(message);
		}
		#announce(message, {
			floorRequest = false
		} = {}) {
			if (!this.#liveRegion || !main_core.Type.isStringFilled(message)) {
				return false;
			}
			this.#announcementQueue.push({
				text: message,
				floorRequest
			});
			if (this.#announcementQueue.length > ANNOUNCEMENT_QUEUE_LIMIT) {
				this.#collapseFloorRequestAnnouncements();
			}
			this.#processAnnouncements();
			return true;
		}

		// only the enumeration of names gives way, never a control that has just been taken away: by the
		// time a queued name sounds, the count of raised hands says more about the call than the name does
		#collapseFloorRequestAnnouncements() {
			const kept = this.#announcementQueue.filter(item => !item.floorRequest);
			if (kept.length === this.#announcementQueue.length) {
				return;
			}
			const summary = main_core.Loc.getMessage('CALL_VIEW_PIP_FLOOR_REQUESTS_COUNT', {
				'#COUNT#': this.floorRequestsList.length
			});
			this.#announcementQueue = main_core.Type.isStringFilled(summary) ? [...kept, {
				text: summary,
				floorRequest: true
			}] : kept;
		}
		#processAnnouncements() {
			if (this.#announcementTimeoutId !== null || !this.#liveRegion) {
				return;
			}

			// a reader speaks the change of the text, not the text itself: the node is emptied first and
			// filled a tick later, and an emptied node is also what the last message leaves behind
			this.#liveRegion.textContent = '';
			if (this.#announcementQueue.length === 0) {
				return;
			}
			const {
				text
			} = this.#announcementQueue.shift();
			this.#scheduleAnnouncement(() => this.#writeAnnouncement(text), ANNOUNCEMENT_WRITE_DELAY);
		}
		#writeAnnouncement(message) {
			if (!this.#liveRegion) {
				return;
			}
			this.#liveRegion.textContent = message;
			this.#scheduleAnnouncement(() => this.#processAnnouncements(), ANNOUNCEMENT_HOLD_DELAY);
		}

		// the queue is moved by the timers of the window: they are the only source of ticks that keeps
		// running while the tab of the opener is hidden
		#scheduleAnnouncement(action, delay) {
			this.#announcementTimeoutId = this.pictureWindow?.setTimeout(() => {
				this.#announcementTimeoutId = null;
				action();
			}, delay) ?? null;
		}
		#destroyLiveRegion() {
			if (this.#announcementTimeoutId !== null) {
				this.pictureWindow?.clearTimeout(this.#announcementTimeoutId);
				this.#announcementTimeoutId = null;
			}
			this.#announcementQueue = [];
			if (this.#liveRegion) {
				main_core.Dom.remove(this.#liveRegion);
				this.#liveRegion = null;
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

					// the order of the three is fixed: the markup goes first because the live region
					// needs a body to live in, and the language is set before anything is announced
					this.pictureWindow.document.body.append(this.template);
					applyPipDocumentAttributes(this.pictureWindow.document, {
						lang: document.documentElement?.lang,
						title: this.accessibleName
					});
					this.#createLiveRegion();
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
			// the region is torn down while the window is still alive: its timers are the ones holding
			// the queue, and after close() there is nothing left to clear them with
			this.#destroyLiveRegion();
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
			this.floorRequestElements.counterValue = null;
			this.floorRequestElements.counterDescription = null;
			this.floorRequestElements.popupTemplate = null;
			this.floorRequestsList = [];
			this.floorRequestsOpenedFromKeyboard = false;
			this.floorRequestsFocusWasInside = false;
		}
	}

	const CloudRecordInfoPopupSource = Object.freeze({
		User: 'user',
		Promo: 'promo'
	});
	class CloudRecordInfoPopup {
		#source;
		#titleCode = null;
		constructor(config) {
			this.popup = null;
			this.popupTemplate = null;
			this.isCloudRecordFeaturesEnabled = config.isCloudRecordFeaturesEnabled;
			this.tariffAvailable = Boolean(config.tariffAvailable);
			this.callId = config.callId;
			this.bindElement = config.bindElement;
			this.targetContainer = config.targetContainer || document.body;
			this.#source = config.source === CloudRecordInfoPopupSource.Promo ? CloudRecordInfoPopupSource.Promo : CloudRecordInfoPopupSource.User;
			this.callbacks = {
				turnOn: BX.type.isFunction(config.turnOn) ? config.turnOn : BX.DoNothing,
				onClose: BX.type.isFunction(config.onClose) ? config.onClose : BX.DoNothing,
				onDestroy: BX.type.isFunction(config.onDestroy) ? config.onDestroy : BX.DoNothing
			};
		}
		#getTemplateButton() {
			if (!this.isCloudRecordFeaturesEnabled) {
				this.sendAnalytics('private_coming_soon');
				return main_core.Dom.create('span', {
					props: {
						className: 'call-cloud-record-info-popup__coming-soon'
					},
					attrs: {
						'data-testid': 'call-cloud-record-info-popup-coming-soon'
					},
					text: main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_BUTTON_COMING_SOON')
				});
			}
			return main_core.Dom.create('button', {
				props: {
					type: 'button',
					className: 'call-cloud-record-info-popup__button --primary'
				},
				attrs: {
					'data-testid': 'call-cloud-record-info-popup-turn-on'
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
		#createBuyButton() {
			return main_core.Dom.create('button', {
				props: {
					type: 'button',
					className: 'call-cloud-record-info-popup__button --secondary'
				},
				attrs: {
					'data-testid': 'call-cloud-record-info-popup-buy'
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
			});
		}
		#createTextBlock(titleCode, subtitleCode) {
			return main_core.Dom.create('div', {
				props: {
					className: 'call-cloud-record-info-popup__text'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'call-cloud-record-info-popup__title'
					},
					text: main_core.Loc.getMessage(titleCode)
				}), main_core.Dom.create('div', {
					props: {
						className: 'call-cloud-record-info-popup__subtitle'
					},
					text: main_core.Loc.getMessage(subtitleCode)
				})]
			});
		}
		#createListItem({
			iconModifier,
			messageCode
		}) {
			return main_core.Dom.create('li', {
				props: {
					className: 'call-cloud-record-info-popup__list-item'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: `call-cloud-record-info-popup__list-item_icon ${iconModifier}`
					}
				}), main_core.Dom.create('div', {
					props: {
						className: 'call-cloud-record-info-popup__list-item_text'
					},
					text: main_core.Loc.getMessage(messageCode)
				})]
			});
		}
		#createTemplate({
			titleCode,
			subtitleCode,
			items,
			action
		}) {
			return main_core.Dom.create('div', {
				props: {
					className: 'call-cloud-record-info-popup'
				},
				attrs: {
					'data-testid': 'call-cloud-record-info-popup'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'call-cloud-record-info-popup__wrapper'
					},
					children: [main_core.Dom.create('div', {
						props: {
							className: 'call-cloud-record-info-popup__icon'
						}
					}), this.#createTextBlock(titleCode, subtitleCode), main_core.Dom.create('ul', {
						props: {
							className: 'call-cloud-record-info-popup__list'
						},
						children: items.map(item => this.#createListItem(item))
					}), main_core.Dom.create('div', {
						props: {
							className: 'call-cloud-record-info-popup__action'
						},
						children: [action]
					})]
				})]
			});
		}
		#setTariffTemplate() {
			this.#titleCode = 'CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_TITLE';
			this.popupTemplate = this.#createTemplate({
				titleCode: this.#titleCode,
				subtitleCode: 'CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_SUBTITLE',
				items: [{
					iconModifier: '--like',
					messageCode: 'CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_ITEM_LIKE'
				}, {
					iconModifier: '--devices',
					messageCode: 'CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_ITEM_DEVICE'
				}, {
					iconModifier: '--cloud',
					messageCode: 'CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_ITEM_CLOUD'
				}],
				action: this.#createBuyButton()
			});
			this.sendAnalytics('tariff_limit');
		}
		#setMainTemplate() {
			this.#titleCode = 'CALL_CLOUD_RECORD_INFO_POPUP_MAIN_TITLE';
			this.popupTemplate = this.#createTemplate({
				titleCode: this.#titleCode,
				subtitleCode: 'CALL_CLOUD_RECORD_INFO_POPUP_MAIN_SUBTITLE',
				items: [{
					iconModifier: '--cloud',
					messageCode: 'CALL_CLOUD_RECORD_INFO_POPUP_MAIN_ITEM_CLOUD'
				}, {
					iconModifier: '--like',
					messageCode: 'CALL_CLOUD_RECORD_INFO_POPUP_MAIN_ITEM_LIKE'
				}, {
					iconModifier: '--devices',
					messageCode: 'CALL_CLOUD_RECORD_INFO_POPUP_MAIN_ITEM_DEVICE'
				}],
				action: this.#getTemplateButton()
			});
		}
		#create() {
			// a second build would leave the first popup in the DOM with its listeners and focus trap,
			// and the only reference to it lost
			if (this.popup || !this.bindElement) {
				return;
			}
			if (this.tariffAvailable) {
				this.#setMainTemplate();
			} else {
				this.#setTariffTemplate();
			}
			this.popup = new main_popup.Popup({
				bindElement: this.bindElement,
				className: 'call-cloud-record-info-popup',
				targetContainer: this.targetContainer,
				content: this.popupTemplate,
				ariaLabel: main_core.Loc.getMessage(this.#titleCode),
				// The platform keeps the focus trap off by default, so the layer enables it
				// explicitly. Looping is switched off - the layer is not modal and Tab must
				// leave it back into the call window. A promo nobody asked for takes no focus
				// at all: it is announced instead.
				focusTrap: {
					looped: false,
					initialFocus: this.#source === CloudRecordInfoPopupSource.User
				},
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
				// +7px against the former anchor: the icon background sits inside the button left padding
				offsetLeft: -132,
				contentBorderRadius: '18px',
				events: {
					onAfterPopupShow: () => this.onAfterPopupShow(),
					onPopupClose: () => {
						this.callbacks.onClose();
						this.popup.destroy();
					},
					onPopupDestroy: () => {
						this.popup = null;
						// the owner learns the layer is gone for good, which a close event alone does
						// not say: a popup destroyed without being closed emits no close at all
						this.callbacks.onDestroy();
					}
				}
			});
		}
		getPopupContainer() {
			return this.popup?.getPopupContainer() ?? null;
		}
		isShown() {
			return this.popup?.isShown() === true;
		}
		onAfterPopupShow() {
			this.#announcePromo();
		}

		// A layer the user did not ask for gets no focus, so the only way it reaches a screen
		// reader is a live region.
		#announcePromo() {
			if (this.#source !== CloudRecordInfoPopupSource.Promo) {
				return;
			}

			// LiveAnnouncer holds a shared queue: by the time this runs the layer may be gone
			// and the announcement would name something no longer on the screen
			if (!this.isShown()) {
				return;
			}
			const phrase = main_core.Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_PROMO_ANNOUNCE');
			if (!phrase) {
				return;
			}

			// nothing the call window announces interrupts the screen reader
			ui_a11y.LiveAnnouncer.announce(phrase, 'polite');
		}
		show() {
			this.#create();
			if (!this.popup) {
				// nothing was built, so no close event will ever come: the owner learns here that
				// the layer is done with the screen, or a queue waiting on it stalls forever
				this.callbacks.onClose();
				return;
			}
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

	const POPUP_BACKGROUND = '#00428F';

	// The menu puts the icon in a container of its own, next to the title and outside it, so the
	// colour comes from the item and not from the title: it is set per item design in the theme.
	const RecordMenuIcon = {
		destroy: () => main_core.Tag.render`
		<svg width="24" height="24" viewBox="0 0 22 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
			<path fill-rule="evenodd" clip-rule="evenodd" d="M14.2892 5.04883H17.5775C17.9319 5.04883 18.2192 5.33611 18.2192 5.69049C18.2192 6.04488 17.9319 6.33216 17.5775 6.33216H4.4234C4.06902 6.33216 3.78174 6.04488 3.78174 5.69049C3.78174 5.33611 4.06902 5.04883 4.4234 5.04883H7.688L7.88867 4.10205C8.1221 3.00069 9.09438 2.21289 10.2202 2.21289H11.7383C12.8477 2.21289 13.8104 2.9784 14.0604 4.05931L14.2892 5.04883ZM9.14411 4.36814L9.02101 4.94893H12.9489L12.81 4.34842C12.6947 3.84954 12.2503 3.49622 11.7383 3.49622H10.2202C9.70059 3.49622 9.25185 3.85982 9.14411 4.36814Z"/>
			<path d="M10.1711 10.7295C10.1711 10.3751 9.88386 10.0878 9.52947 10.0878C9.17509 10.0878 8.88781 10.3751 8.88781 10.7295V14.7619C8.88781 15.1163 9.17509 15.4036 9.52947 15.4036C9.88386 15.4036 10.1711 15.1163 10.1711 14.7619V10.7295Z"/>
			<path d="M12.476 10.0878C12.8303 10.0878 13.1176 10.3751 13.1176 10.7295V14.7619C13.1176 15.1163 12.8303 15.4036 12.476 15.4036C12.1216 15.4036 11.8343 15.1163 11.8343 14.7619V10.7295C11.8343 10.3751 12.1216 10.0878 12.476 10.0878Z"/>
			<path fill-rule="evenodd" clip-rule="evenodd" d="M5.83532 7.45239C5.29522 7.45239 4.8722 7.91698 4.92266 8.4547L5.69489 16.6838C5.78329 17.6258 6.57404 18.3459 7.52021 18.3459H14.436C15.3776 18.3459 16.1661 17.6326 16.2602 16.6957L17.0871 8.46065C17.1413 7.92089 16.7175 7.45239 16.175 7.45239H5.83532ZM6.238 8.73573L6.97261 16.5639C6.99913 16.8465 7.23636 17.0625 7.52021 17.0625H14.436C14.7185 17.0625 14.955 16.8485 14.9832 16.5675L15.7697 8.73573H6.238Z"/>
		</svg>
	`,
		pause: () => main_core.Tag.render`
		<svg width="24" height="24" viewBox="0 0 28 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
			<path fill-rule="evenodd" clip-rule="evenodd" d="M10.9667 5.83331H8.86667C7.83574 5.83331 7 6.66905 7 7.69998V20.3C7 21.3309 7.83574 22.1666 8.86667 22.1666H10.9667C11.9976 22.1666 12.8333 21.3309 12.8333 20.3V7.69998C12.8333 6.66905 11.9976 5.83331 10.9667 5.83331ZM8.86667 7.46665H10.9667C11.0955 7.46665 11.2 7.57111 11.2 7.69998V20.3C11.2 20.4288 11.0955 20.5333 10.9667 20.5333H8.86667C8.7378 20.5333 8.63333 20.4288 8.63333 20.3V7.69998C8.63333 7.57111 8.7378 7.46665 8.86667 7.46665Z"/>
			<path fill-rule="evenodd" clip-rule="evenodd" d="M19.1333 5.83331H17.0333C16.0024 5.83331 15.1667 6.66905 15.1667 7.69998V20.3C15.1667 21.3309 16.0024 22.1666 17.0333 22.1666H19.1333C20.1643 22.1666 21 21.3309 21 20.3V7.69998C21 6.66905 20.1643 5.83331 19.1333 5.83331ZM17.0333 7.46665H19.1333C19.2622 7.46665 19.3667 7.57111 19.3667 7.69998V20.3C19.3667 20.4288 19.2622 20.5333 19.1333 20.5333H17.0333C16.9045 20.5333 16.8 20.4288 16.8 20.3V7.69998C16.8 7.57111 16.9045 7.46665 17.0333 7.46665Z"/>
		</svg>
	`,
		resume: () => main_core.Tag.render`
		<svg width="24" height="24" viewBox="0 0 28 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
			<path fill-rule="evenodd" clip-rule="evenodd" d="M22.0731 11.8956C23.6534 12.8481 23.6534 15.1396 22.0731 16.0921L10.8383 22.8643C9.12769 23.8955 6.94664 22.6635 6.94664 20.6661L6.94664 7.32162C6.94664 5.32422 9.12769 4.09227 10.8383 5.12343L22.0731 11.8956ZM21.2299 14.6933C21.7567 14.3758 21.7567 13.612 21.2299 13.2944L9.99514 6.52228C9.37308 6.14731 8.57997 6.59529 8.57997 7.32162L8.57997 20.6661C8.57997 21.3924 9.37308 21.8404 9.99514 21.4655L21.2299 14.6933Z"/>
		</svg>
	`,
		stop: () => main_core.Tag.render`
		<svg width="24" height="24" viewBox="0 0 28 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
			<path fill-rule="evenodd" clip-rule="evenodd" d="M8.74984 6.41663C7.46117 6.41663 6.4165 7.46129 6.4165 8.74996V19.2522C6.4165 20.5409 7.46117 21.5856 8.74984 21.5856H19.2521C20.5408 21.5856 21.5854 20.5409 21.5854 19.2522V8.74996C21.5854 7.46129 20.5408 6.41663 19.2521 6.41663H8.74984ZM19.2521 8.04996H8.74984C8.36324 8.04996 8.04984 8.36336 8.04984 8.74996V19.2522C8.04984 19.6388 8.36324 19.9522 8.74984 19.9522H19.2521C19.6387 19.9522 19.9521 19.6388 19.9521 19.2522V8.74996C19.9521 8.36336 19.6387 8.04996 19.2521 8.04996Z"/>
		</svg>
	`
	};
	class CommonRecordMenuPopup {
		#popupType;
		#state;
		#isDesktopRecord;
		#isServiceEnabled;
		#menu = null;
		constructor(config) {
			this.bindElement = config.bindElement;
			this.targetContainer = config.targetContainer || document.body;
			this.#popupType = config.popupType || 'kind'; // kind || control
			this.#state = config.state;
			this.#isDesktopRecord = config.isDesktopRecord;
			// the service is off: the item stays in the menu but is announced unavailable
			this.#isServiceEnabled = config.isServiceEnabled !== false;
			this.callbacks = {
				onStart: BX.type.isFunction(config.onStart) ? config.onStart : BX.DoNothing,
				onStop: BX.type.isFunction(config.onStop) ? config.onStop : BX.DoNothing,
				onPause: BX.type.isFunction(config.onPause) ? config.onPause : BX.DoNothing,
				onDestroy: BX.type.isFunction(config.onDestroy) ? config.onDestroy : BX.DoNothing,
				onClose: BX.type.isFunction(config.onClose) ? config.onClose : BX.DoNothing,
				onOpenStateChange: BX.type.isFunction(config.onOpenStateChange) ? config.onOpenStateChange : BX.DoNothing
			};
		}
		#getKindItems() {
			return [{
				id: 'call-record-menu-audio',
				title: main_core.Loc.getMessage('CALL_CLOUD_RECORD_MENU_RECORD_AUDIO'),
				onClick: () => this.callbacks.onStart('audio')
			}, {
				id: 'call-record-menu-video',
				title: main_core.Loc.getMessage('CALL_CLOUD_RECORD_MENU_RECORD_VIDEO'),
				onClick: () => this.callbacks.onStart('video')
			}];
		}
		#getControlItems() {
			const items = [];
			if (!this.#isDesktopRecord) {
				items.push({
					id: 'call-record-menu-destroy',
					title: main_core.Loc.getMessage('CALL_CLOUD_RECORD_MENU_DESTROY_RECORD'),
					design: ui_system_menu.MenuItemDesign.Alert,
					disabled: !this.#isServiceEnabled,
					svg: RecordMenuIcon.destroy(),
					onClick: () => this.callbacks.onDestroy()
				});
			}
			const isPaused = this.#state === call_core.CallCommonRecordState.Paused;
			items.push({
				id: isPaused ? 'call-record-menu-resume' : 'call-record-menu-pause',
				title: isPaused ? main_core.Loc.getMessage('CALL_CLOUD_RECORD_MENU_RESUME_RECORD') : main_core.Loc.getMessage('CALL_CLOUD_RECORD_MENU_PAUSE_RECORD'),
				svg: isPaused ? RecordMenuIcon.resume() : RecordMenuIcon.pause(),
				onClick: () => this.callbacks.onPause()
			}, {
				id: 'call-record-menu-stop',
				title: main_core.Loc.getMessage('CALL_CLOUD_RECORD_MENU_STOP_RECORD'),
				svg: RecordMenuIcon.stop(),
				onClick: () => this.callbacks.onStop()
			});
			return items;
		}
		#getItems() {
			if (this.#popupType === 'kind') {
				return this.#getKindItems();
			}
			return this.#getControlItems();
		}
		#create() {
			if (this.#menu || !this.bindElement) {
				return;
			}
			this.#menu = new ui_system_menu.Menu({
				className: 'call-record-menu',
				bindElement: this.bindElement,
				targetContainer: this.targetContainer,
				items: this.#getItems(),
				bindOptions: {
					position: 'top'
				},
				autoHide: true,
				closeByEsc: true,
				background: POPUP_BACKGROUND,
				contentBackground: POPUP_BACKGROUND,
				darkMode: true,
				contentNoPaddings: true,
				animation: 'fading',
				padding: 0,
				angle: {
					position: 'bottom'
				},
				// +7px against the former anchor: the icon background sits inside the button left padding
				offsetLeft: 27,
				contentBorderRadius: '6px',
				events: {
					onShow: () => this.callbacks.onOpenStateChange(true),
					onClose: () => this.callbacks.onClose(),
					onDestroy: () => this.#handleMenuDestroyed()
				}
			});
		}

		// The menu tears itself down when its popup is destroyed past destroy() of this wrapper, and that
		// destruction emits no closing: the owner of the trigger would keep a layer that is already gone.
		#handleMenuDestroyed() {
			if (!this.#menu) {
				return;
			}
			this.#menu = null;
			this.callbacks.onOpenStateChange(false);
			this.callbacks.onClose();
		}
		getPopupContainer() {
			return this.#menu?.getPopup()?.getPopupContainer() ?? null;
		}
		isShown() {
			return this.#menu?.getPopup()?.isShown() === true;
		}
		show() {
			this.#create();
			if (!this.#menu) {
				return;
			}
			this.#menu.show(this.bindElement);
		}
		close() {
			this.#menu?.close();
		}

		// The menu owns the ARIA of the trigger while it lives and puts the snapshot back here, so the
		// owner of the trigger learns that the layer is gone only now, not when the menu merely closed.
		destroy() {
			const menu = this.#menu;
			// dropped before the menu goes down: destroying it emits the destruction handled above, and
			// the owner of the trigger must hear about the layer once
			this.#menu = null;
			if (!menu) {
				return;
			}
			menu.destroy();
			this.callbacks.onOpenStateChange(false);
		}
		toggle() {
			if (this.isShown()) {
				this.close();
				return;
			}
			this.show();
		}
	}

	// A fresh object on every call: the record menu edits the state in place while it waits for the
	// server, so a shared one would leak between the call window and the picture-in-picture window.
	function createDefaultCommonRecordState() {
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
		#isTalking(userId) {
			return this.users[userId]?.talking === true;
		}

		// A queue record is valid only while the participant still talks: the delayed close that used to
		// carry the cleanup belongs to one updateQueue call and is lost when the next one interrupts it.
		#dropSilentUsers() {
			this.queue.filter(userId => !this.#isTalking(userId)).forEach(userId => this.deleteFromQueue(userId));
		}
		updateQueue(config) {
			this.#dropSilentUsers();
			let user = null;
			let isUserTalking = false;
			if (config) {
				user = config.user;
				isUserTalking = config.isUserTalking;
			}
			let mutedUserId = null;
			let newActiveId = null;
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
			const popupClosing = Boolean(this.talkingPopup?.closingTimeout);
			const userTalkAgain = user && user?.id === this.activeId && isUserTalking && popupClosing;
			const activeUserSilent = !this.#isTalking(this.activeId);
			const canPopupClose = Boolean(!this.activeId || activeUserCard || mutedUserId && mutedUserId === this.activeId || activeUserSilent && !popupClosing);

			// A silent activeId opens the scan below too, so the popup can pass to somebody who really talks
			// even while its close is already running. `!popupClosing` sits on the silence alone: once that
			// close runs, silence no longer opens canPopupClose, while a returned card or an explicit mute do.
			if (canPopupClose || activeUserSilent) {
				for (const userId of this.queue) {
					if (userId === mutedUserId || userId === this.activeId || !this.#isTalking(userId)) {
						continue;
					}
					const userCard = this.root?.querySelector(`.bx-messenger-videocall-user[data-user-id="${userId}"]`);
					if (!userCard) {
						newActiveId = userId;
						break;
					}
				}
			} else if (!userTalkAgain) {
				return;
			}
			if (this.activeId && !newActiveId && canPopupClose) {
				this.hidePopup(this.activeId !== mutedUserId, () => {
					this.activeId = null;
				});
			} else if (this.activeId && newActiveId && this.activeId !== newActiveId || !this.activeId && newActiveId) {
				this.showPopup(this.users[newActiveId]);
				this.activeId = newActiveId;
			} else if (userTalkAgain) {
				this.showPopup(this.users[user?.id]);
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

	// Deliberately not hasActiveState: a local tile stays on screen in states that hide a remote
	// participant. Only someone who has not joined yet, or who came in to watch, shows nothing.
	function shouldShowLocalUser(userModel) {
		return userModel.state !== call_core.UserState.Idle && userModel.direction !== call_core.EndpointDirection.RecvOnly;
	}

	// Ids reach the view in both forms: numbers from the call engine, strings from server payloads and
	// from the DOM. A participant told apart by the form of the id would be treated as a stranger by
	// half of the view, so the whole file asks this one question instead of comparing ids directly.
	//
	// Comparison is by textual form, which is not the same as the loose == this replaced. Two absent
	// values are different (null is not undefined), two NaN are the same, and a numeric string written
	// differently ('01') is not the number it parses to. The test next to this file pins all three.
	function isSameUser(userId, otherUserId) {
		return String(userId) === String(otherUserId);
	}

	// An empty list means the call is not a broadcast at all, not that no presenter has been picked:
	// an ordinary call always carries an empty list, and everyone in it sends and receives.
	function getNewUserDirection(userId, broadcastingPresenters) {
		if (broadcastingPresenters.length === 0) {
			return call_core.EndpointDirection.SendRecv;
		}

		// A presenter told apart by the form of the id would silently lose the right to speak.
		const isPresenter = broadcastingPresenters.some(presenterId => isSameUser(presenterId, userId));
		return isPresenter ? call_core.EndpointDirection.SendRecv : call_core.EndpointDirection.RecvOnly;
	}

	/**
	 * Mutable state of a single user list ordering pass.
	 *
	 * Built by View.#prepareUserOrdering and refined by the rule processors it calls. A plain
	 * container, not an encapsulated object: the counters and the queues that outlive a single
	 * statement have methods, the rest is written by the caller directly. That is a deliberate
	 * choice for state that lives no longer than one pass through the grid.
	 */
	class UserOrderingState {
		constructor() {
			this.usersWithVideo = [];
			this.usersWithEnabledVideo = [];
			this.usersWithDisabledVideo = [];
			this.unpairedVideoEnabled = [];
			this.unpairedVideoDisabled = [];
			this.activeUsers = null;
			this.possibleActiveUsers = null;
			this.usersToKeepActive = [];
			this.usersToForceDeactivation = [];
			this.currentPageUsers = 0;
			this.orderChanges = [];
			this.incompleteSwaps = [];
			this.disconnectedUserHadVideo = false;
			this.usersToDeactivate = 0;
			this.videoDisabledProceed = false;
		}

		/**
		 * Video changes left after the enabled ones were paired off against the disabled ones.
		 * What remains is the queue the grid ordering still has to resolve.
		 */
		setUnpairedVideoChanges(videoEnabled, videoDisabled) {
			this.unpairedVideoEnabled = videoEnabled;
			this.unpairedVideoDisabled = videoDisabled;
		}
		addUserToCurrentPage() {
			this.currentPageUsers++;
		}
		removeUserFromCurrentPage() {
			this.currentPageUsers--;
		}
		requestUserDeactivation() {
			this.usersToDeactivate++;
		}
		cancelUserDeactivation() {
			this.usersToDeactivate--;
		}
		clearOrderChanges() {
			this.orderChanges.length = 0;
		}
		setOrderChangeTarget(index, target) {
			this.orderChanges[index].to = target;
		}
		markDisconnectedUserHadVideo() {
			this.disconnectedUserHadVideo = true;
		}
	}

	const Layouts = call_mapping.ViewLayout;
	const UiState = call_mapping.ViewUiState;
	const Size = call_mapping.ViewSize;
	const RoomState = call_mapping.ViewRoomState;
	const EventName = call_mapping.ViewEvent;
	const ARIA_KEY_BY_CALL_TYPE = {
		[call_lib_viewContract.CallWindowNameType.Private]: 'CALL_VIEW_WINDOW_ARIA_PRIVATE',
		[call_lib_viewContract.CallWindowNameType.Group]: 'CALL_VIEW_WINDOW_ARIA_GROUP',
		[call_lib_viewContract.CallWindowNameType.Conference]: 'CALL_VIEW_WINDOW_ARIA_CONFERENCE'
	};
	const RerenderReason = {
		VideoEnabled: 'videoEnabled',
		VideoDisabled: 'videoDisabled',
		UserDisconnected: 'userDisconnected'
	};
	const SwapType = {
		Direct: 'direct',
		Replace: 'replace'
	};
	const AUDIO_ELEMENT_EVENTS = ['pause', 'play', 'volumechange', 'emptied'];
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

	// source of a microphone command; the hold policy names its own, an absent field reads as this one
	const MICROPHONE_SOURCE_BUTTON = 'mic_button';

	// the microphone change caused by a command confirms it. A command the controller drops (no
	// microphone, no room speaker) and a command that changed nothing get no confirmation at all,
	// so the memory of it has to expire on its own.
	const MICROPHONE_COMMAND_CONFIRM_TIMEOUT = 1000;
	const BrowserClock = {
		now: () => Date.now(),
		after: (ms, callback) => setTimeout(callback, ms),
		cancel: timerId => clearTimeout(timerId)
	};

	// Closing alone is not enough: the layer owns the ARIA of the trigger and puts the snapshot back on
	// destroy only. close() comes first, it is what keeps the onDone chain of the promo queue intact.
	function closeCommonRecordPopupLayer(layer) {
		layer?.close();
		layer?.destroy?.();
		return null;
	}

	/**
	 * @typedef {object} ViewUserData
	 * @property {string} [name]
	 * @property {string} [avatar]
	 * @property {string} [avatar_hr] - preferred over avatar when both are given
	 * @property {string} [gender] - 'M' or 'F', anything else is read as 'M'
	 */

	/**
	 * @typedef {object} ViewOptions
	 * @property {?string} title
	 * @property {HTMLElement} container
	 * @property {number} baseZIndex
	 * @property {string} cameraId
	 * @property {string} microphoneId
	 * @property {boolean} [externalSpeakerManagement]
	 * @property {boolean} showChatButtons
	 * @property {boolean} showUsersButton
	 * @property {boolean} showShareButton
	 * @property {boolean} showRecordButton
	 * @property {boolean} showDocumentButton
	 * @property {boolean} [showCopilotButton]
	 * @property {boolean} showButtonPanel
	 * @property {boolean} broadcastingMode
	 * @property {number[]} broadcastingPresenters
	 * @property {string} language
	 * @property {Object<string, ViewUserData>} userData - keyed by user id
	 * @property {number} userLimit
	 * @property {boolean} isIntranetOrExtranet
	 * @property {boolean} mediaSelectionBlocked
	 * @property {string[]} blockedButtons
	 * @property {string[]} hiddenButtons
	 * @property {string[]} hiddenTopButtons
	 * @property {string} uiState
	 * @property {string} layout
	 * @property {Object<string, string>} userStates - UserState keyed by user id
	 * @property {string} [localUserState] - initial UserState of the local user
	 * @property {boolean} [showAddUserButtonInList]
	 * @property {boolean} isCopilotFeaturesEnabled
	 * @property {boolean} isCopilotActive
	 * @property {boolean} [isWindowFocus]
	 * @property {boolean} isVideoconf
	 * @property {function(): ?object} [getCurrentCall]
	 * @property {?HTMLElement} [focusOpener]
	 */

	class View {
		#commonRecord;
		#confirmModal;
		#callPopupQueue;
		#onFullScreenChangeHandler;
		#onResizeHandler;
		#onOrientationChangeHandler;
		#onKeyDownHandler;
		#onAddUser;
		#onUserStateUpdated;
		#isPreparing;
		#isActivePiPFromController;
		#guestLink = null;
		#pendingMicrophoneCommand = null;
		// The record state the layers on screen were drawn for. Only setCommonRecordState moves it: the
		// record menu edits commonRecordState in place while it waits for the server, so that object
		// alone no longer tells which state the layers were built for.
		#appliedRecordState = null;

		/**
		 * @param {ViewOptions} config
		 */
		constructor(config) {
			this.destroyed = false;
			this.title = config.title;
			this.container = config.container;
			this.baseZIndex = config.baseZIndex;
			this.cameraId = config.cameraId;
			this.microphoneId = config.microphoneId;
			this.getCurrentCall = main_core.Type.isFunction(config.getCurrentCall) ? config.getCurrentCall : null;
			this.speakerId = '';
			this.speakerMuted = false;
			this.#applyDisplayConfig(config);
			this.limitation = null;
			this.activeUsers = new Set();
			this.rerenderTimeout = null;
			this.waitingForUserMediaTimeouts = new Map();
			this.rerenderQueue = new Map();
			this.cameraTrackWatchers = new Map();
			this.audioElementWatchers = new Map();
			this.broadcastingMode = config.broadcastingMode === true;
			this.broadcastingPresenters = main_core.Type.isArray(config.broadcastingPresenters) ? config.broadcastingPresenters : [];
			this.currentPage = 1;
			this.pagesCount = 1;
			this.usersPerPage = 0; // initializes after rendering and on resize

			this.language = config.language || '';
			this.lastPosition = 1;
			const localUserModel = this.#initUsers(config);
			this.cache = new Map();
			this.#initLocalUser(localUserModel);
			this.centralUser = this.localUser; // show local user until someone is connected
			this.centralUserMobile = null;
			this.pinnedUser = null;
			this.presenterId = null;
			this.returnToGridAfterScreenStopped = false;
			this.mediaSelectionBlocked = config.mediaSelectionBlocked === true;
			this.visible = false;
			this.#initElementRefs();
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
			this.#resetCommonRecordState();
			this.#initButtonRestrictions(config);
			this.uiState = config.uiState || UiState.Calling;
			this.layout = config.layout || Layouts.Centered;
			this.whiteSpaceInUserGrid = 0;
			this.roomState = RoomState.None;
			this.eventEmitter = new main_core_events.EventEmitter(this, 'BX.Call.View');
			this.#initEventHandlers();
			this.resizeObserver = new BX.ResizeObserver(this.#onResizeHandler);
			this.intersectionObserver = null;

			// timers
			this.switchPresenterTimeout = 0;
			this.accessibleName = '';
			this.focusScope = new call_lib_a11y.WindowFocusScope();
			this.focusScope.captureOpener(config.focusOpener ?? null);
			this.deviceSelector = null;
			this.deviceSelectorInitiator = null;
			this.userSelector = null;
			this.renameSlider = null;
			this.userSize = {
				width: 0,
				height: 0
			};
			this.#initHotKeys();
			this.#isPreparing = false;
			this.isWindowFocus = config.isWindowFocus || false;
			this.#isActivePiPFromController = false;
			this.#initPipCoordinator();
			this.#initPushToTalkCoordinator();
			this.init();
			this.subscribeEvents(config);
			if (main_core.Type.isPlainObject(config.userStates)) {
				this.appendUsers(config.userStates);
			}
			this.hideEarTimer = null;
			this.isCopilotFeaturesEnabled = config.isCopilotFeaturesEnabled || false;
			this.isCopilotActive = config.isCopilotActive || false;
			this.copilotNotify = null;
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
			this.#callPopupQueue = new CallPopupQueue();
		}
		#applyDisplayConfig(config) {
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
		}
		#initUsers(config) {
			this.userData = {};
			if (config.userData) {
				this.updateUserData(config.userData);
			}
			this.userLimit = config.userLimit || 1;
			this.userId = main_core.Loc.getMessage('USER_ID');
			this.isIntranetOrExtranet = config.isIntranetOrExtranet !== false;
			this.users = {}; // Call participants. The key is the user id.
			this.screenUsers = {}; // Screen sharing participants. The key is the user id.
			this.userRegistry = new UserRegistry();
			this.talkingService = new TalkingService();
			this.userRegistry.subscribe('changed', this.talkingService.refreshQueue);
			const localUserModel = new UserModel({
				id: this.userId,
				state: main_core.Type.isString(config.localUserState) ? config.localUserState : call_core.UserState.Connected,
				localUser: true,
				order: beginingPosition,
				name: this.userData[this.userId] ? this.userData[this.userId].name : '',
				avatar: this.userData[this.userId] ? this.userData[this.userId].avatar_hr : ''
			});
			if (this.userId) {
				this.userRegistry.push(localUserModel);
			}
			return localUserModel;
		}
		#initLocalUser(localUserModel) {
			this.localUser = new CallUser({
				parentContainer: this.container,
				userModel: localUserModel,
				allowBackgroundItem: call_core.BackgroundDialog.isAvailable() && this.isIntranetOrExtranet,
				allowMaskItem: call_core.BackgroundDialog.isMaskAvailable() && this.isIntranetOrExtranet,
				onUserRename: this.#onUserRename.bind(this),
				onUserRenameInputFocus: this.#onUserRenameInputFocus.bind(this),
				onUserRenameInputBlur: this.#onUserRenameInputBlur.bind(this),
				onClick: this.#onUserClick.bind(this),
				onTurnOffParticipantMic: this.#onTurnOffParticipantMic.bind(this),
				onTurnOffParticipantCam: this.#onTurnOffParticipantCam.bind(this),
				onTurnOffParticipantScreenshare: this.#onTurnOffParticipantScreenshare.bind(this),
				onPin: this.#onUserPin.bind(this),
				onUnPin: this.#onUserUnPin.bind(this)
			});
		}
		#initElementRefs() {
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
		}
		#initButtonRestrictions(config) {
			this.blockedButtons = {};
			const configBlockedButtons = main_core.Type.isArray(config.blockedButtons) ? config.blockedButtons : [];
			configBlockedButtons.forEach(buttonCode => {
				this.blockedButtons[buttonCode] = true;
			});
			this.hiddenButtons = {};
			this.overflownButtons = {};
			if (!this.showUsersButton) {
				this.hiddenButtons.users = true;
			}
			const configHiddenButtons = main_core.Type.isArray(config.hiddenButtons) ? config.hiddenButtons : [];
			configHiddenButtons.forEach(buttonCode => {
				this.hiddenButtons[buttonCode] = true;
			});
			this.hiddenTopButtons = {};
			const configHiddenTopButtons = main_core.Type.isArray(config.hiddenTopButtons) ? config.hiddenTopButtons : [];
			configHiddenTopButtons.forEach(buttonCode => {
				this.hiddenTopButtons[buttonCode] = true;
			});
		}
		#initEventHandlers() {
			this.#onFullScreenChangeHandler = this.#onFullScreenChange.bind(this);
			this.#onResizeHandler = this.#onResize.bind(this);
			this.#onOrientationChangeHandler = main_core.Runtime.debounce(this.#onOrientationChange.bind(this), 500);
			this.#onKeyDownHandler = this.#onKeyDown.bind(this);
			this.#onAddUser = main_core.Runtime.throttle(() => {
				if (this.destroyed) {
					return;
				}
				this.updateUserList();
				this.updateButtons();
				this.updateUserButtons();
				this.muteSpeaker(this.speakerMuted);
			}, 500);
			this.#onUserStateUpdated = main_core.Runtime.throttle(skippedElementsList => {
				if (this.destroyed) {
					return;
				}
				this.updateUserList();
				this.updateButtons(skippedElementsList);
				this.updateUserButtons();
			}, 500);
		}
		#initHotKeys() {
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
			this.recordPopupHotKeyGuard = {
				container: null,
				isBlocked: false,
				onFocusIn: null,
				onFocusOut: null
			};
		}
		#initPipCoordinator() {
			const pipUpdateButtons = () => {
				if (this.pictureInPictureCallWindow) {
					this.pictureInPictureCallWindow.setButtons(this.getPictureInPictureCallWindowGetButtonsList()).updateButtons();
				}
			};
			this.pipCoordinator = new call_feature_pip.PipCoordinator({
				togglePip: active => this.toggleStatePictureInPictureCallWindow(active),
				isScreenSharing: () => this.hasCurrentUserScreenSharing(),
				isFolded: () => this.size === Size.Folded,
				isVideoconf: () => this.isVideoconf,
				updateButtons: pipUpdateButtons,
				isConnected: () => this.uiState === UiState.Connected,
				isShown: () => this.visible,
				isMacDesktop: im_v2_lib_desktopApi.DesktopApi.isDesktop() && main_core.Browser.isMac()
			});
		}
		#initPushToTalkCoordinator() {
			this.pushToTalkCoordinator = new call_lib_pushToTalk.PushToTalkCoordinator({
				isAvailable: () => call_core.Util.isPushToTalkAvailable(),
				callWindowDocument: () => document,
				isMicrophoneMuted: () => call_core.Hardware.isMicrophoneMuted,
				isFolded: () => this.size === Size.Folded,
				// the signals the microphone button itself is drawn from: the right to broadcast and the
				// transport hold on publishing both arrive through them
				isMicrophoneActionable: () => !this.isButtonHidden('microphone') && !this.isButtonBlocked('microphone'),
				isModalBlocked: () => this.hotKeyTemporaryBlock > 0,
				setMicrophone: (muted, source) => {
					// the device chooser takes the state of the microphone once, when it opens, so a
					// microphone the hold policy moves under it would go on being drawn as it was
					this.deviceSelector?.destroy();
					this.#rememberMicrophoneCommand(muted);
					this.#emitToggleMute(muted, source);
				},
				// the window takes no decision of its own here: whether the hint is due is for the
				// notification service to say, and only the controller can reach it
				onShortPress: () => this.eventEmitter.emit(EventName.onPushToTalkShortPress),
				localUserId: () => Number(this.userId),
				clock: BrowserClock
			});
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
			if (enabled && main_core.Type.isFunction(handle)) {
				handle();
				return;
			}
			if (!enabled && articleCode) {
				if (this.size === Size.Folded) {
					this.#onBodyClick();
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
			main_core.Dom.addClass(this.elements.ear.top, 'force-visible');
			main_core.Dom.addClass(this.elements.ear.bottom, 'force-visible');
			main_core.Dom.addClass(this.elements.pageNavigatorLeft, 'force-visible');
			main_core.Dom.addClass(this.elements.pageNavigatorRight, 'force-visible');
			this.hideEarTimer = setTimeout(() => {
				main_core.Dom.removeClass(this.elements.root, 'on-mouse-move');
				main_core.Dom.removeClass(this.elements.ear.top, 'force-visible');
				main_core.Dom.removeClass(this.elements.ear.bottom, 'force-visible');
				main_core.Dom.removeClass(this.elements.pageNavigatorLeft, 'force-visible');
				main_core.Dom.removeClass(this.elements.pageNavigatorRight, 'force-visible');
			}, 5000);
		}
		init() {
			this.getLimitation();
			this.checkAvailableBackgroundImage();
			if (this.isFullScreenSupported()) {
				if (main_core.Browser.isChrome() || main_core.Browser.isSafari()) {
					// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
					window.addEventListener('fullscreenchange', this.#onFullScreenChangeHandler);
					main_core.Event.bind(window, 'webkitfullscreenchange', this.#onFullScreenChangeHandler);
				} else if (main_core.Browser.isFirefox()) {
					main_core.Event.bind(window, 'mozfullscreenchange', this.#onFullScreenChangeHandler);
				}
			}
			if (main_core.Browser.isMobile()) {
				main_core.Dom.style(document.documentElement, '--view-height', `${window.innerHeight}px`);
				main_core.Event.bind(window, 'orientationchange', this.#onOrientationChangeHandler);
			}
			this.elements.audioContainer = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-audio-container'
				}
			});
			this.elements.screenAudioContainer = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-audio-container'
				}
			});
			if (!this.externalSpeakerManagement) {
				if (call_core.Hardware.initialized) {
					this.setSpeakerId(call_core.Hardware.defaultSpeaker);
				} else {
					call_core.Hardware.subscribe(call_core.Hardware.Events.initialized, () => {
						this.setSpeakerId(call_core.Hardware.defaultSpeaker);
					});
				}
			}
			call_core.Hardware.subscribe(call_core.Hardware.Events.onChangeMicrophoneMuted, this.setMuted);
			call_core.Hardware.subscribe(call_core.Hardware.Events.onChangeCameraOn, this.setCameraState);
			main_core.Event.bind(window, 'keydown', this.#onKeyDownHandler);
			this.onMouseMoveHandler = this.toggleVisibilityEar.bind(this);
			main_core.Event.bind(document, 'mousemove', this.onMouseMoveHandler);
			this.keyModifierForCss = main_core.Browser.isMac() ? '\\2318 + Shift' : 'Ctrl + Shift';
			main_core.Dom.append(this.elements.audioContainer, this.container);
			main_core.Dom.append(this.elements.screenAudioContainer, this.container);
			this.pipCoordinator.start();
			this.pushToTalkCoordinator.start();
		}
		get isActivePiPFromController() {
			return this.#isActivePiPFromController;
		}
		set isActivePiPFromController(isActive) {
			this.#isActivePiPFromController = isActive;
		}
		get isPreparing() {
			return this.#isPreparing;
		}
		set isPreparing(isPreparing) {
			this.#isPreparing = Boolean(isPreparing);
		}
		subscribeEvents(config) {
			for (const event of Object.keys(EventName)) {
				if (main_core.Type.isFunction(config[event])) {
					this.setCallback(event, config[event]);
				}
			}
		}
		setCallback(name, cb) {
			if (main_core.Type.isFunction(cb) && Object.hasOwn(EventName, name)) {
				this.eventEmitter.subscribe(name, event => {
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
			const userIds = Object.keys(userStates);
			for (const userId of userIds) {
				this.addUser(userId, userStates[userId] || call_core.UserState.Idle);
			}
		}
		setCentralUser(userId) {
			if (isSameUser(this.centralUser.id, userId)) {
				return;
			}
			if (!this.users[userId] && !isSameUser(userId, this.userId)) {
				return;
			}
			const previousCentralUser = this.centralUser;
			this.centralUser = isSameUser(userId, this.userId) ? this.localUser : this.users[userId];
			if (this.layout === Layouts.Centered || this.layout === Layouts.Mobile) {
				if (this.layout === Layouts.Mobile) {
					previousCentralUser.dismount();
				}
				this.updateUserList();
				if (!isSameUser(previousCentralUser.id, this.centralUser.id)) {
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
				userId,
				stream: isSameUser(userId, this.userId) ? this.localUser.stream : this.users[userId].stream
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
				const userId = parseInt(this.userId, 10);
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
				if (!isSameUser(userModel.id, this.userId) && userModel.state === call_core.UserState.Connected) {
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
				if (!isSameUser(userModel.id, this.userId) && (
				// Both sides are the id of a UserModel here (CallUser.id returns userModel.id), so the
				// strict comparison needs no isSameUser: the local user is already filtered out above.
				userModel.id !== this.centralUser.id && this.layout === Layouts.Centered || this.layout !== Layouts.Centered) && [call_core.UserState.Connected, call_core.UserState.Connecting, call_core.UserState.Calling].includes(userModel.state)) {
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
				if (userModel.hasActiveState && Object.hasOwn(this.users, userModel.id)) {
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
				return !isSameUser(userModel.id, this.userId) && userModel.cameraState && userModel.hasActiveState && userModel.state !== call_core.UserState.Calling;
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
			if (isSameUser(currentPresenterId, this.localUser.id)) {
				currentPresenterId = 0;
			}
			const currentPresenterModel = this.userRegistry.get(currentPresenterId);

			// 1. Current user, who is sharing screen has top priority
			if (currentPresenterModel?.screenState === true) {
				return currentPresenterId;
			}
			const users = Object.keys(this.users);

			// 2. If current user is not sharing screen, but someone is sharing - he should become presenter
			const screenSharingUserId = this.#findScreenSharingUserId(users);
			if (screenSharingUserId !== null) {
				return screenSharingUserId;
			}

			// 3. If current user is talking, or stopped talking less then one second ago - he should stay presenter
			if (currentPresenterModel && currentPresenterModel.wasTalkingAgo() < 1000) {
				return currentPresenterId;
			}

			// 4. Return currently or last talking user, or current user in center
			return this.#findTalkingUserId(users) || this.centralUser.id;
		}
		#findScreenSharingUserId(users) {
			for (const userId of users) {
				if (Object.hasOwn(this.users, userId) && this.userRegistry.get(userId).screenState === true) {
					return parseInt(userId, 10);
				}
			}
			return null;
		}
		#findTalkingUserId(users) {
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
			return minTalkingAgoUserId;
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
		setUiState(uiState) {
			if (this.uiState === uiState) {
				return;
			}
			this.uiState = uiState;
			if (this.uiState === UiState.Error && this.elements.container) {
				main_core.Dom.clean(this.elements.container);
				main_core.Dom.append(this.elements.overlay, this.elements.container);
			}
			if (!this.elements.root) {
				return;
			}
			this.updateButtons();
		}
		setLayout(newLayout) {
			if (newLayout === this.layout) {
				return;
			}
			this.layout = newLayout;
			if (this.layout === Layouts.Centered || this.layout === Layouts.Mobile) {
				main_core.Dom.removeClass(this.elements.root, 'bx-messenger-videocall-grid');
				main_core.Dom.addClass(this.elements.root, 'bx-messenger-videocall-centered');
				this.centralUser.mount(this.elements.center);
				main_core.Dom.append(this.elements.userBlock, this.elements.container);
				if (this.layout !== Layouts.Mobile) {
					main_core.Dom.append(this.elements.userList.container, this.elements.userBlock);
				}
				if (this.layout === Layouts.Centered) {
					this.eventEmitter.emit(EventName.onHasMainStream, {
						userId: this.centralUser.id
					});
				}
				this.centralUser.playVideo();
			}
			if (this.layout === Layouts.Grid) {
				main_core.Dom.removeClass(this.elements.root, 'bx-messenger-videocall-centered');
				main_core.Dom.addClass(this.elements.root, 'bx-messenger-videocall-grid');
				main_core.Dom.append(this.elements.userList.container, this.elements.container);
				main_core.Dom.remove(this.elements.userBlock);
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
			main_core.Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-fullscreen-mobile', this.layout === Layouts.Mobile);
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
				this.buttons.microphone.setSideIcon(getMicrophoneSideIcon(this.roomState));
			}
		}

		/**
		 * Two lines with two conditions of their own: holding space works wherever the mode is available,
		 * while the letter shortcut is bound in the desktop application alone. In the web that leaves an
		 * open microphone with nothing to say, and the button drops the plate for that state.
		 *
		 * @return {string}
		 */
		#getMicrophoneTooltipText() {
			const hotkey = call_core.Util.isDesktop() ? `${this.keyModifierForCss} + A` : '';
			if (!call_core.Hardware.isMicrophoneMuted || !call_core.Util.isPushToTalkAvailable()) {
				return hotkey;
			}
			const spaceHint = main_core.Loc.getMessage('IM_SPACE_HOTKEY');
			return hotkey === '' ? spaceHint : `${spaceHint}\\A${' '}${hotkey}${' '}`;
		}
		setCurrentPage(pageNumber) {
			if (pageNumber < 1 || pageNumber > this.pagesCount || pageNumber === this.currentPage) {
				return;
			}
			this.currentPage = pageNumber;
			this.recalculateUsersPerPage();
			if (this.elements.root) {
				this.elements.pageNavigatorLeftCounter.innerHTML = `${this.currentPage - 1}&nbsp;/&nbsp;${this.pagesCount}`;
				this.elements.pageNavigatorRightCounter.innerHTML = `${this.currentPage + 1}&nbsp;/&nbsp;${this.pagesCount}`;
			}
			if (!(this.layout === Layouts.Grid || this.layout === Layouts.Centered)) {
				return;
			}
			this.renderUserList();
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
			if (isSameUser(this.userId, this.centralUser.id) && this.layout === Layouts.Centered) {
				usersPerPage += 1;
			}
			if (!usersPerPage) {
				return 1000;
			}
			if (usersPerPage >= MAX_USERS_PER_PAGE) {
				// check if the last row should be filled up
				const elementSize = call_core.Util.findBestElementSize(containerSize.width, containerSize.height, MAX_USERS_PER_PAGE + 1, MIN_GRID_USER_WIDTH, MIN_GRID_USER_HEIGHT);
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
				this.usersPerPage += 1;
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
				this.elements.pageNavigatorLeftCounter.innerHTML = `${this.currentPage - 1}&nbsp;/&nbsp;${this.pagesCount}`;
				this.elements.pageNavigatorRightCounter.innerHTML = `${this.currentPage + 1}&nbsp;/&nbsp;${this.pagesCount}`;
			}
		}
		setCameraId(cameraId) {
			if ((this.cameraId ?? null) === (cameraId ?? null)) {
				return;
			}
			if (this.localUser.stream && this.localUser.stream.getVideoTracks().length > 0) {
				throw new Error('Can not set camera id while having active stream');
			}
			this.cameraId = cameraId;
		}
		setMicrophoneId(microphoneId) {
			if ((this.microphoneId ?? null) === (microphoneId ?? null)) {
				return;
			}
			if (this.localUser.stream && this.localUser.stream.getAudioTracks().length > 0) {
				throw new Error('Can not set microphone id while having active stream');
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
			if (this.isCameraOn === event.data.isCameraOn) {
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
			if (this.isMuted === event.data.isMicrophoneMuted) {
				return;
			}
			this.isMuted = event.data.isMicrophoneMuted;
			this.#publishMicrophoneChange(this.isMuted);
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
			if (isSameUser(userId, this.userId)) {
				return;
			}
			this.userId = parseInt(userId, 10);
			this.localUser.userModel.id = this.userId;
			this.localUser.userModel.name = this.userData[this.userId] ? this.userData[this.userId].name : '';
			this.localUser.userModel.avatar = this.userData[this.userId] ? checkAndEncodeURI(this.userData[this.userId].avatar_hr) : '';
			this.userRegistry.push(this.localUser.userModel);
		}
		setUserBlockFolded(isUserBlockFolded) {
			this.isUserBlockFolded = isUserBlockFolded;
			main_core.Dom.toggleClass(this.elements.userBlock, 'folded', this.isUserBlockFolded);
			main_core.Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-userblock-folded', this.isUserBlockFolded);
			if (this.isUserBlockFolded) {
				if (this.buttons.participants && this.layout === Layouts.Centered) {
					this.buttons.participants.update({
						foldButtonState: ParticipantsButton.FoldButtonState.Unfold
					});
				}
			} else if (this.buttons.participants) {
				this.buttons.participants.update({
					foldButtonState: this.isFullScreen && this.layout === Layouts.Centered ? ParticipantsButton.FoldButtonState.Fold : ParticipantsButton.FoldButtonState.Hidden
				});
			}
		}
		addUser(rawUserId, rawState, rawDirection) {
			const userId = Number(rawUserId);
			if (this.users[userId]) {
				return;
			}
			const state = rawState || call_core.UserState.Idle;
			const direction = rawDirection || getNewUserDirection(userId, this.broadcastingPresenters);
			const userModel = new UserModel({
				id: userId,
				name: this.userData[userId] ? this.userData[userId].name : '',
				avatar: this.userData[userId] ? this.userData[userId].avatar_hr : '',
				state,
				order: state === call_core.UserState.Connected ? this.getNextPosition() : newUserPosition,
				direction
			});
			this.userRegistry.push(userModel);
			this.users[userId] = this.#createCallUser(userId, userModel);
			userModel.subscribe('changed', this.talkingService.watchTalking);
			this.screenUsers[userId] = new CallUser({
				parentContainer: this.container,
				userModel,
				allowPinButton: false,
				screenSharingUser: true
			});
			if (this.elements.root && state !== call_core.UserState.Idle) {
				if (state === call_core.UserState.Connected) {
					this.cache.set('previousConnectedUserCount', this.cache.get('currentConnectedUser')?.length || 0);
					this.cache.delete('currentConnectedUser');
					this.cache.delete('activeUsers');
				}
				this.#onAddUser();
			}
		}
		#createCallUser(userId, userModel) {
			return new CallUser({
				userModel,
				parentContainer: this.container,
				allowPinButton: this.getConnectedUserCount() > 1,
				externalSpeakerManagement: this.externalSpeakerManagement,
				onClick: this.#onUserClick.bind(this),
				onPin: this.#onUserPin.bind(this),
				onUnPin: this.#onUserUnPin.bind(this),
				onTurnOffParticipantMic: this.#onTurnOffParticipantMic.bind(this),
				onTurnOffParticipantCam: this.#onTurnOffParticipantCam.bind(this),
				onTurnOffParticipantScreenshare: this.#onTurnOffParticipantScreenshare.bind(this),
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
		}
		setUserDirection(userId, direction) {
			const user = this.userRegistry.get(userId);
			if (!user || user.direction === direction) {
				return;
			}
			user.direction = direction;
			this.updateUserList();
		}
		setLocalUserDirection(direction) {
			if (this.localUser.userModel.direction !== direction) {
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
			if (newState === call_core.UserState.Idle && user.screenState) {
				user.prevScreenState = user.screenState;
			}
			if (newState === call_core.UserState.Connected && this.uiState === UiState.Calling) {
				this.setUiState(UiState.Connected);
			}
			this.#updateCentralUser(userId, newState);
			this.#applyUserConnectionState(userId, newState);
			this.#updateUserPosition(userId, newState);
			if (isSameUser(userId, this.localUser.id)) {
				this.localUser.userModel.cameraState = this.localUser.hasCameraVideo();
			}

			// Deliberately strict, unlike the isSameUser above: an id that arrives in another form than the one
			// the local user holds keeps the panel in the redraw. Aligning the two changes what is redrawn, so
			// it belongs to a separate task, not to this refactoring.
			const skippedElementsList = userId === this.localUser.id ? [] : ['panel'];
			if (isSameUser(userId, this.presenterId) && newState !== call_core.UserState.Connected) {
				this.switchPresenter();
			}
			this.#onUserStateUpdated(skippedElementsList);
		}
		#updateCentralUser(userId, newState) {
			if (isSameUser(this.centralUser.id, this.userId) && newState === call_core.UserState.Connected) {
				this.setCentralUser(userId);
			} else if (isSameUser(userId, this.centralUser.id)) {
				switch (newState) {
					case call_core.UserState.Connecting:
					case call_core.UserState.Failed:
						this.centralUser.blurVideo();
						break;
					case call_core.UserState.Connected:
						this.centralUser.blurVideo(false);
						break;
					case call_core.UserState.Idle:
						{
							const usersWithVideo = this.getUsersWithVideo();
							const connectedUsers = this.getConnectedUsers();
							if (connectedUsers.length === 0) {
								this.setCentralUser(this.userId);
							} else if (usersWithVideo.length > 0) {
								this.setCentralUser(usersWithVideo[0]);
							} else {
								this.setCentralUser(connectedUsers[0]);
							}
							break;
						}
				}
			}
		}
		#applyUserConnectionState(userId, newState) {
			const user = this.userRegistry.get(userId);
			if (newState === call_core.UserState.Connected) {
				const timer = setTimeout(() => {
					this.waitingForUserMediaTimeouts.delete(userId);
				}, WAITING_VIDEO_DELAY);
				this.waitingForUserMediaTimeouts.set(userId, timer);
				if (user.prevScreenState && !isSameUser(userId, this.userId)) {
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
		}
		#updateUserPosition(userId, newState) {
			const user = this.userRegistry.get(userId);
			if (newState === call_core.UserState.Connected && user.order === newUserPosition) {
				user.moveTo(this.getNextPosition());
			} else if (newState === call_core.UserState.Idle) {
				user.moveAsideTo(newUserPosition);
				user.prevCameraState = user.cameraState;
				user.cameraState = false;
			}
		}
		setTitle(title) {
			this.title = title;
		}
		setAccessibleName(name, type) {
			if (!main_core.Type.isStringFilled(name)) {
				return;
			}
			const ariaKey = ARIA_KEY_BY_CALL_TYPE[type] ?? ARIA_KEY_BY_CALL_TYPE[call_lib_viewContract.CallWindowNameType.Private];
			const accessibleName = main_core.Loc.getMessage(ariaKey, {
				'#CALL_NAME#': name
			});

			// A portal the phrase has not reached yet must keep the seeded fallback name instead of an empty one.
			if (!main_core.Type.isStringFilled(accessibleName)) {
				return;
			}
			this.accessibleName = accessibleName;
			this.elements.root?.setAttribute('aria-label', this.accessibleName);
		}

		// An empty result makes Dom drop the attribute: a region with no name is better than a region
		// named "undefined" on a portal the phrase has not reached yet.
		getRootAccessibleName() {
			const accessibleName = main_core.Type.isStringFilled(this.accessibleName) ? this.accessibleName : main_core.Loc.getMessage('CALL_VIEW_WINDOW_ARIA_FALLBACK');
			return main_core.Type.isStringFilled(accessibleName) ? accessibleName : '';
		}
		focusWindow(options = {}) {
			this.focusScope?.focusWindow(this.elements.root, options);
		}
		releaseFocusBeforeHide() {
			return this.focusScope?.releaseBeforeDetach(this.elements.root) ?? false;
		}
		restoreFocusAfterHide() {
			this.focusScope?.restoreAfterDetach();
		}
		getUserTalking(userId) {
			const user = this.userRegistry.get(userId);
			if (!user) {
				return false;
			}
			return Boolean(user.talking);
		}
		setUserTalking(userId, talking) {
			const user = this.userRegistry.get(userId);
			if (!user) {
				return;
			}
			user.talking = talking;
			if (isSameUser(userId, this.userId)) {
				return;
			}
			if (isSameUser(userId, this.presenterId) && !talking) {
				this.switchPresenterDeferred();
			} else {
				this.switchPresenter();
			}
		}
		setUserStats(userId, stats, mediaServerId) {
			this.pictureInPictureCallWindow?.setStats(userId, stats);
			if (isSameUser(userId, this.localUser.id)) {
				this.localUser.showStats(stats, mediaServerId);
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
			const user = this.users[data.participant.userId];
			if (user && data.participant.userId && data.track) {
				user.showTrackSubscriptionFailed(data.track);
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
				this.updateRerenderQueue(userId, videoPaused ? RerenderReason.VideoDisabled : RerenderReason.VideoEnabled);
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
			if (user.floorRequestState !== userFloorRequestState) {
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
			if (isSameUser(userId, this.userId)) {
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
			for (const userModel of this.userRegistry.users.values()) {
				userModel.permissionToSpeak = permissionToSpeakState;
			}
		}
		pinUser(userId) {
			if (!(userId in this.users) && userId !== Number(this.userId)) {
				void console.error(`User ${userId} is not known`);
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
					this.#onAllowSpeakPermissionClickedHandler(_userModel);
				},
				onDisallowSpeakPermissionClicked: _userModel => {
					this.#onDisallowSpeakPermissionClickedHandler(_userModel);
				}
			});
			notification.mount(this.elements.notificationPanel);
			NotificationManager.addNotification(notification);
		}
		updateFloorRequestNotification() {
			if (NotificationManager.notifications.length === 0) {
				return;
			}
			NotificationManager.notifications.forEach(notification => {
				notification.updatePermissionButtonState();
			});
		}
		#onAllowSpeakPermissionClickedHandler(_userModel) {
			this.setUserPermissionToSpeakState(_userModel.id, true);
			this.eventEmitter.emit(EventName.onAllowSpeakPermission, {
				userId: _userModel.id
			});
		}
		#onDisallowSpeakPermissionClickedHandler(_userModel) {
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
			if (!isSameUser(userId, this.userId)) {
				if (screenState === true && this.layout === Layouts.Grid) {
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
			this.localUser.flipVideo = Boolean(flipVideo);
		}
		setLocalStream(streamData) {
			const mediaRenderer = streamData.mediaRenderer;
			const mediaStream = streamData.stream;
			const flipVideo = streamData.flipVideo;
			this.#applyLocalVideoSource(mediaRenderer, mediaStream, flipVideo);
			const videoTracks = mediaStream?.getVideoTracks();
			this.#rememberStreamDevices(mediaStream, mediaRenderer, videoTracks);
			this.#updateCentralUserVideo(mediaRenderer, videoTracks);
			this.updateButtons();
		}
		#applyLocalVideoSource(mediaRenderer, mediaStream, flipVideo) {
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
		}
		#rememberStreamDevices(mediaStream, mediaRenderer, videoTracks) {
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
		}
		#updateCentralUserVideo(mediaRenderer, videoTracks) {
			if (this.layout !== Layouts.Grid && isSameUser(this.centralUser.id, this.userId)) {
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
				void console.error('Speaker selection is not supported');
			}
			this.speakerId = speakerId;
			const audioElements = Object.values(this.elements.audio);
			let refusalReported = false;
			audioElements.forEach(element => {
				element.setSinkId(speakerId).catch(error => {
					// one record per selection and not per element: the walk calls setSinkId on every
					// participant, so an unavailable device would write one identical record per card.
					// The first refusal writes it, so an element whose promise never settles holds nothing up
					if (refusalReported) {
						return;
					}
					refusalReported = true;
					call_core.Util.sendLog({
						description: 'speaker selection failed',
						scope: 'view',
						elementCount: audioElements.length,
						// the argument and not the field: a later selection may already have overwritten it
						speakerId,
						errorName: error?.name,
						errorMessage: error?.message
					});
				});
			});
			for (const userId of Object.keys(this.elements.screenAudio)) {
				void this.elements.screenAudio[userId].setSinkId(this.speakerId);
			}
		}
		muteSpeaker(mute) {
			const muted = Boolean(mute);
			const stateChanged = this.speakerMuted !== muted;
			this.speakerMuted = muted;
			const volume = this.speakerMuted ? 0 : 1;
			const audioElements = Object.values(this.elements.audio);
			audioElements.forEach(element => setVolume(element, volume));
			for (const userId of Object.keys(this.elements.screenAudio)) {
				this.elements.screenAudio[userId].volume = volume;
			}
			if (stateChanged) {
				// one record per change and not per element: the walk touches every participant, so a record
				// of the element would give as many as there are cards. The state is re-applied on a timer
				// with the value it already holds, and such a walk changes nothing worth writing
				call_core.Util.sendLog({
					description: 'speaker mute changed',
					muted: this.speakerMuted,
					elementCount: audioElements.length
				});
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
				throw new Error(`User ${userId} is not a part of this call`);
			}
			if (reason === RerenderReason.VideoEnabled) {
				if (this.rerenderQueue.get(userId)?.reason === RerenderReason.VideoDisabled) {
					this.#cancelQueuedRerender(userId);
				} else if (this.waitingForUserMediaTimeouts.has(userId)) {
					this.#renderAwaitedUserMedia(userId);
				} else {
					this.#enqueueRerender(userId, RerenderReason.VideoEnabled);
				}
			} else if (reason === RerenderReason.VideoDisabled) {
				if (this.rerenderQueue.get(userId)?.reason === RerenderReason.VideoEnabled) {
					this.#cancelQueuedRerender(userId);
				} else {
					this.#enqueueRerender(userId, RerenderReason.VideoDisabled);
				}
			}
		}
		#cancelQueuedRerender(userId) {
			this.rerenderQueue.delete(userId);
			if (this.rerenderQueue.size === 0) {
				clearTimeout(this.rerenderTimeout);
				this.rerenderTimeout = null;
			}
		}
		#renderAwaitedUserMedia(userId) {
			clearTimeout(this.waitingForUserMediaTimeouts.get(userId));
			this.waitingForUserMediaTimeouts.delete(userId);
			this.rerenderQueue.set(userId, {
				userId,
				reason: RerenderReason.VideoEnabled
			});
			this.renderUserList();
		}
		#enqueueRerender(userId, reason) {
			if (!this.rerenderTimeout) {
				this.rerenderTimeout = setTimeout(() => {
					this.renderUserList();
				}, CHANGE_VIDEO_RERENDER_DELAY);
			}
			this.rerenderQueue.set(userId, {
				userId,
				reason
			});
		}
		trackAvailabilityChanged(userId, kind, available) {
			const user = this.users[userId];
			if (!user) {
				// A track update for a user who already left: keep it in the client console only,
				// the race is expected and floods the log on large conferences.
				// eslint-disable-next-line no-console
				void console.warn(`User ${userId} is not a part of this call`);
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
				throw new Error(`User ${userId} is not a part of this call`);
			}
			this.cache.delete('usersWithVideo');
			const userModel = this.userRegistry.get(userId);
			const userHasCameraVideo = userModel.cameraState;
			if (!('render' in mediaRenderer) || !main_core.Type.isFunction(mediaRenderer.render)) {
				throw new Error('mediaRenderer should have method render');
			}
			if (!('kind' in mediaRenderer) || mediaRenderer.kind !== 'video' && mediaRenderer.kind !== 'sharing') {
				throw new Error('mediaRenderer should be of video kind');
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
			if (isSameUser(this.centralUser.id, userId)) {
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
						this.#watchAudioElement(userId, this.elements.audio[userId]);
					}
					setVolume(this.elements.audio[userId], this.speakerMuted ? 0 : 1);
					user.audioTrack = track;

					// A voice start deliberately queues no rerender of its own: it collides with the one
					// the grid already does for RerenderReason.VideoEnabled.
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
					this.#watchCameraTrack(userId, track);
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

		// On the bare-track path the camera state reaches the model only as an event of its own, so a
		// single lost event would leave an avatar over a live camera once the card starts obeying that
		// state. The media corrects the model both ways here, the way setVideoRenderer() already does on
		// the renderer path.
		//
		// The correction cannot be one read of track.muted at arrival: a freshly received track is muted
		// until its first frames, so it would look like a camera that is off. What the correction listens
		// to is the change of that flag. Whichever source writes the state last wins, media or signal;
		// the guarantee is narrower -- a muted track is never counted as a camera, so a track arriving
		// while the camera is off cannot bring the frozen frame back.
		#watchCameraTrack(userId, track) {
			this.#forgetCameraTrack(userId);
			if (!track) {
				this.#applyCameraStateFromMedia(userId, false);
				return;
			}
			const onCameraGone = () => this.#applyCameraStateFromMedia(userId, false);
			const onCameraLive = () => this.#applyCameraStateFromMedia(userId, true);
			main_core.Event.bind(track, 'mute', onCameraGone);
			main_core.Event.bind(track, 'ended', onCameraGone);
			main_core.Event.bind(track, 'unmute', onCameraLive);
			this.cameraTrackWatchers.set(userId, {
				track,
				onCameraGone,
				onCameraLive
			});
			if (track.readyState === 'ended') {
				onCameraGone();
			} else if (!track.muted) {
				// a track that is already flowing sends no unmute of its own
				onCameraLive();
			}
		}
		#forgetCameraTrack(userId) {
			const watcher = this.cameraTrackWatchers.get(userId);
			if (!watcher) {
				return;
			}
			main_core.Event.unbind(watcher.track, 'mute', watcher.onCameraGone);
			main_core.Event.unbind(watcher.track, 'ended', watcher.onCameraGone);
			main_core.Event.unbind(watcher.track, 'unmute', watcher.onCameraLive);
			this.cameraTrackWatchers.delete(userId);
		}

		// The element outlives every track of the participant -- it is created once, reused until the call
		// ends and never taken out of elements.audio -- so the watcher is put on it at creation, once per
		// participant, and not on each change of the track the way the camera one is.
		#watchAudioElement(userId, element) {
			const onElementEvent = event => this.#logAudioElementState(userId, event.type);
			AUDIO_ELEMENT_EVENTS.forEach(eventName => main_core.Event.bind(element, eventName, onElementEvent));
			this.audioElementWatchers.set(userId, {
				element,
				onElementEvent
			});
		}
		#logAudioElementState(userId, eventName) {
			const watcher = this.audioElementWatchers.get(userId);
			if (!watcher) {
				return;
			}
			const {
				element
			} = watcher;
			if (eventName === 'volumechange' && element[EXPECTED_VOLUME_CHANGE]) {
				// our own assignment of the volume: muting the speaker already has a record of the whole
				// walk. The first volumechange spends the mark, one nobody asked for is written
				element[EXPECTED_VOLUME_CHANGE] = false;
				return;
			}
			if (eventName === 'emptied' && element[EXPECTED_EMPTIED]) {
				// our own assignment of srcObject: the release already has its record, and a reattachment
				// is not an event of its own. The first emptied spends the mark, an unasked one is written
				element[EXPECTED_EMPTIED] = false;
				return;
			}
			call_core.Util.sendLog({
				description: 'audio element state changed',
				userModelId: this.users[userId]?.userModel?.id,
				event: eventName,
				paused: element.paused,
				volume: element.volume,
				readyState: element.readyState,
				srcObjectPresent: element.srcObject !== null
			});
		}
		#forgetAudioElement(userId) {
			const watcher = this.audioElementWatchers.get(userId);
			if (!watcher) {
				return;
			}
			AUDIO_ELEMENT_EVENTS.forEach(eventName => main_core.Event.unbind(watcher.element, eventName, watcher.onElementEvent));
			this.audioElementWatchers.delete(userId);
		}
		#forgetAudioElements() {
			for (const userId of this.audioElementWatchers.keys()) {
				this.#forgetAudioElement(userId);
			}
		}
		#forgetCameraTracks() {
			for (const userId of this.cameraTrackWatchers.keys()) {
				this.#forgetCameraTrack(userId);
			}
		}
		#applyCameraStateFromMedia(userId, cameraState) {
			if (this.destroyed || !this.users[userId]) {
				return;
			}
			const userModel = this.userRegistry.get(userId);
			if (!userModel || userModel.cameraState === cameraState) {
				return;
			}
			userModel.cameraState = cameraState;
			this.updateRerenderQueue(userId, cameraState ? RerenderReason.VideoEnabled : RerenderReason.VideoDisabled);
		}
		removeScreenUsers() {
			for (const userId of Object.keys(this.screenUsers)) {
				this.screenUsers[userId].videoTrack = null;
			}
			this.updateUserList();
		}
		setBadNetworkIndicator(userId, badNetworkIndicator) {
			if (this.users[userId]) {
				this.users[userId].badNetworkIndicator = badNetworkIndicator;
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
					videoWidth = isSameUser(this.centralUser.id, userId) ? Math.floor(containerSize.width) : SIDE_USER_WIDTH;
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
			return createDefaultCommonRecordState();
		}

		// The state, the mirror the layers are compared against and the description of the button belong
		// together: the call may end while the recording runs, and a description left behind outlives it.
		#resetCommonRecordState() {
			this.commonRecordState = this.getDefaultCommonRecordState();
			this.#appliedRecordState = this.commonRecordState.state;
			this.#syncRecordButtonStateDescription();
		}
		setCommonRecordState(commonRecordState) {
			const previousState = this.#appliedRecordState;
			this.commonRecordState = commonRecordState;
			this.#appliedRecordState = this.commonRecordState?.state;
			if (this.buttons.recordStatus) {
				this.buttons.recordStatus.update(this.commonRecordState);
			}
			this.#syncRecordButtonStateDescription();
			if (!isSameUser(this.commonRecordState.userId, this.userId)) {
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
			if (previousState !== this.#appliedRecordState) {
				this.#closeStaleCommonRecordPopups();
			}
		}

		// the record state is a description of the record button, never part of its name (WCAG 2.5.3)
		#syncRecordButtonStateDescription() {
			if (!this.buttons.record) {
				return;
			}
			const messageKey = {
				[call_core.CallCommonRecordState.Started]: 'CALL_VIEW_RECORD_STATUS_ARIA_ACTIVE',
				[call_core.CallCommonRecordState.Resumed]: 'CALL_VIEW_RECORD_STATUS_ARIA_ACTIVE',
				[call_core.CallCommonRecordState.Paused]: 'CALL_VIEW_RECORD_STATUS_ARIA_PAUSED'
			}[this.commonRecordState?.state];
			this.buttons.record.setStateDescription(messageKey ? main_core.Loc.getMessage(messageKey) ?? '' : '');
		}
		show() {
			if (!this.elements.root) {
				this.render();
			}
			main_core.Dom.append(this.elements.root, this.container);
			if (this.layout !== Layouts.Mobile) {
				this.startIntersectionObserver();
			}
			this.updateButtons();
			this.updateUserList();
			this.resumeVideo();
			this.toggleEars();
			this.visible = true;
			this.eventEmitter.emit(EventName.onShow);
			this.focusScope?.focusWindow(this.elements.root);

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
			const needsHistoryRestore = this.focusScope?.releaseBeforeDetach(this.elements.root) ?? false;
			main_core.Dom.remove(this.elements.root);

			// History restore runs only after the root left the document (ALG-02).
			if (needsHistoryRestore) {
				this.focusScope?.restoreAfterDetach();
			}
			this.visible = false;
		}
		startIntersectionObserver() {
			this.intersectionObserver = new IntersectionObserver(this.#onIntersectionChange.bind(this), {
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
			this.deviceSelectorInitiator = bindElement;
			this.deviceSelector = new DeviceSelector({
				viewElement: this.container,
				parentElement: bindElement,
				...(this.getCurrentCall ? {
					currentCall: this.getCurrentCall()
				} : {}),
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
				allowAdvancedSettings: !main_core.Type.isUndefined(window.BXIM) && this.isIntranetOrExtranet,
				switchCameraBlocked: this.isButtonBlocked('camera'),
				switchMicrophoneBlocked: this.isButtonBlocked('microphone'),
				callbacks: {
					onMicrophoneSelect: deviceId => this.#onMicrophoneSelected(deviceId),
					onMicrophoneSwitch: () => this.#onMicrophoneButtonClick(),
					onCameraSelect: deviceId => this.#onCameraSelected(deviceId),
					onCameraSwitch: () => this.#onCameraButtonClick(),
					onSpeakerSelect: deviceId => this.#onSpeakerSelected(deviceId),
					onSpeakerSwitch: () => this.#onSpeakerButtonClick(),
					onChangeNoiseSuppression: allowNoiseSuppression => this.#onChangeNoiseSuppression(allowNoiseSuppression),
					onChangeFaceImprove: faceImproveEnabled => this.#onChangeFaceImprove(faceImproveEnabled),
					onChangeVideoQuality: params => this.onChangeVideoQuality(params),
					onAdvancedSettingsClick: () => this.eventEmitter.emit(EventName.onOpenAdvancedSettings),
					onDestroy: () => {
						main_core.Dom.removeClass(this.buttons?.microphone.elements.arrow, 'rotate');
						main_core.Dom.removeClass(this.buttons?.camera.elements.arrow, 'rotate');
						this.deviceSelector = null;
						this.deviceSelectorInitiator?.setAttribute('aria-expanded', 'false');
						if (!document.activeElement || document.activeElement === document.body) {
							this.deviceSelectorInitiator?.focus();
						}
						this.deviceSelectorInitiator = null;
					},
					onShow: () => {
						// the chevron follows the popup, not the intent to open it: a throw while
						// building or showing the selector must not leave the button expanded
						this.deviceSelectorInitiator?.setAttribute('aria-expanded', 'true');
						this.eventEmitter.emit(EventName.onDeviceSelectorShow, {});
					}
				}
			});
			this.deviceSelector.show();
		}
		showCallMenu() {
			const menuItems = [{
				text: main_core.Loc.getMessage('IM_M_CALL_BTN_WANT_TO_SAY'),
				iconClass: 'hand',
				onClick: this.#onMobileCallMenuFloorRequestClick.bind(this)
			}, {
				text: main_core.Loc.getMessage('IM_M_CALL_MOBILE_MENU_PARTICIPANTS_LIST'),
				iconClass: 'participants',
				onClick: this.#onMobileCallMenShowParticipantsClick.bind(this)
			}, {
				text: main_core.Loc.getMessage('IM_M_CALL_MOBILE_MENU_COPY_INVITE'),
				iconClass: 'add-participant',
				onClick: this.#onMobileCallMenuCopyInviteClick.bind(this)
			},
			// eslint-disable-next-line unicorn/no-negated-condition
			!this.isIntranetOrExtranet ? {
				text: main_core.Loc.getMessage('IM_M_CALL_MOBILE_MENU_CHANGE_MY_NAME'),
				iconClass: 'change-name',
				onClick: () => {
					this.callMenu.close();
					setTimeout(this.showRenameSlider.bind(this), 100);
				}
			} : null, {
				separator: true
			}, {
				text: main_core.Loc.getMessage('IM_M_CALL_MOBILE_MENU_CANCEL'),
				enabled: false,
				onClick: this.#onMobileCallMenuCancelClick.bind(this)
			}];
			this.callMenu = new MobileMenu({
				parent: this.elements.root,
				items: menuItems,
				onClose: () => this.callMenu.destroy(),
				onDestroy: () => {
					this.callMenu = null;
				}
			});
			this.callMenu.show();
		}
		showUserMenu(userId) {
			const userModel = this.userRegistry.get(userId);
			if (!userModel) {
				return;
			}
			let pinItem = null;
			if (this.pinnedUser && isSameUser(this.pinnedUser.id, userId)) {
				pinItem = {
					text: main_core.Loc.getMessage('IM_M_CALL_MOBILE_MENU_UNPIN'),
					iconClass: 'unpin',
					onClick: () => {
						this.userMenu.close();
						this.unpinUser();
					}
				};
			} else if (!isSameUser(this.userId, userId)) {
				pinItem = {
					text: main_core.Loc.getMessage('IM_M_CALL_MOBILE_MENU_PIN'),
					iconClass: 'pin',
					onClick: () => {
						this.userMenu.close();
						this.pinUser(userId);
					}
				};
			}
			const menuItems = [{
				userModel,
				enabled: false
			}, {
				separator: true
			}, pinItem, isSameUser(this.userId, userId) && !this.isIntranetOrExtranet ? {
				text: main_core.Loc.getMessage('IM_M_CALL_MOBILE_MENU_CHANGE_MY_NAME'),
				iconClass: 'change-name',
				onClick: () => {
					this.userMenu.close();
					setTimeout(this.showRenameSlider.bind(this), 100);
				}
			} : null, {
				separator: true
			}, {
				text: main_core.Loc.getMessage('IM_M_CALL_MOBILE_MENU_CANCEL'),
				enabled: false,
				onClick: () => this.userMenu.close()
			}];
			this.userMenu = new MobileMenu({
				parent: this.elements.root,
				items: menuItems,
				onClose: () => this.userMenu.destroy(),
				onDestroy: () => {
					this.userMenu = null;
				}
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
			this.participantsMenu = new MobileMenu({
				parent: this.elements.root,
				items: menuItems,
				header: main_core.Loc.getMessage('IM_M_CALL_PARTICIPANTS').replace('#COUNT#', String(this.getConnectedUserCount(true))),
				largeIcons: true,
				onClose: () => {
					this.participantsMenu.destroy();
				},
				onDestroy: () => {
					this.participantsMenu = null;
				}
			});
			this.participantsMenu.show();
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
			// the window closes for good, and the conference does not destroy it afterwards: a microphone
			// the hold policy still holds is handed back here, while the subscribers of the window are
			// there to carry the command
			this.pushToTalkCoordinator?.stop();
			if (this.buttons.recordStatus) {
				this.buttons.recordStatus.stopViewUpdate();
			}

			// removing the root below takes the layers with it, but neither the document listeners of
			// main.popup nor the focus trap; the window is going away, so a block the guard holds goes too
			this.closeCommonRecordPopups();
			this.stopRecordPopupHotKeyGuard(true);
			this.#resetCommonRecordState();
			if (this.elements.root) {
				main_core.Dom.remove(this.elements.root);
			}
			if (this.pictureInPictureCallWindow) {
				this.toggleStatePictureInPictureCallWindow(false);
			}
			this.visible = false;
			this.eventEmitter.emit(EventName.onClose);
			this.clearCallcontrolPromo();
		}
		setSize(size) {
			if (this.size === size) {
				return;
			}
			this.size = size;
			// folding takes the container out of the DOM without any focus event of the browser window,
			// so this is the only moment the zone learns that the call window left it
			this.pushToTalkCoordinator?.onFoldChanged();
			if (this.size === Size.Folded) {
				this.clearCallcontrolPromo();
				if (this.overflownButtonsPopup) {
					this.overflownButtonsPopup.close();
				}
				if (this.elements.panel) {
					main_core.Dom.addClass(this.elements.panel, 'bx-messenger-videocall-panel-folded');
				}
				main_core.Dom.remove(this.elements.container);
				main_core.Dom.remove(this.elements.topPanel);
				main_core.Dom.style(this.elements.root, 'maxWidth', null);
				this.updateButtons();
			} else {
				if (this.elements.panel) {
					main_core.Dom.removeClass(this.elements.panel, 'bx-messenger-videocall-panel-folded');
				}
				main_core.Dom.append(this.elements.topPanel, this.elements.wrap);
				main_core.Dom.append(this.elements.container, this.elements.wrap);
				if (this.maxWidth > 0) {
					main_core.Dom.style(this.elements.root, 'maxWidth', `${Math.max(this.maxWidth, MIN_WIDTH)}px`);
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
					return !call_core.Util.havePermissionToBroadcast('mic') || this.blockedButtons[buttonName] === true;
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
		checkPanelOverflow() {
			const delta = this.elements.panel.scrollWidth - this.elements.panel.offsetWidth;
			const mediumButtonMinWidth = this.layout === Layouts.Mobile ? 60 : 66; // todo: move to constants maybe? or maybe even calculate dynamically somehow?

			if (delta > 0) {
				this.#hideOverflownButtons(delta, mediumButtonMinWidth);
				return true;
			}
			return this.#restoreOverflownButtons(mediumButtonMinWidth);
		}
		#hideOverflownButtons(delta, mediumButtonMinWidth) {
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
		}
		#restoreOverflownButtons(mediumButtonMinWidth) {
			const hiddenButtonsCount = Object.keys(this.overflownButtons).length;
			if (hiddenButtonsCount > 0) {
				const unusedPanelSpace = this.calculateUnusedPanelSpace();
				if (unusedPanelSpace > 320) {
					this.#restoreButtonsForSpace(unusedPanelSpace, hiddenButtonsCount, mediumButtonMinWidth);
					return true;
				}
			}
			return false;
		}
		#restoreButtonsForSpace(unusedPanelSpace, hiddenButtonsCount, mediumButtonMinWidth) {
			let countOfButtonsToShow = Math.min(Math.floor(unusedPanelSpace / mediumButtonMinWidth), hiddenButtonsCount);
			const buttonsLeftHidden = hiddenButtonsCount - countOfButtonsToShow;
			if (buttonsLeftHidden === 1) {
				countOfButtonsToShow += 1;
			}
			if (countOfButtonsToShow === hiddenButtonsCount) {
				// show all buttons;
				this.overflownButtons = {};
			} else {
				for (let i = 0; i < countOfButtonsToShow; i++) {
					delete this.overflownButtons[Object.keys(this.overflownButtons)[0]];
				}
			}
		}

		/**
		 * @param {string[]} buttons Array of buttons names to show
		 */
		showButtons(buttons) {
			if (!main_core.Type.isArray(buttons)) {
				void console.error('buttons should be array');
			}
			buttons.forEach(buttonName => {
				if (Object.hasOwn(this.hiddenButtons, buttonName)) {
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
				void console.error('buttons should be array');
			}
			buttons.forEach(buttonName => {
				this.hiddenButtons[buttonName] = true;
			});
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
		blockSwitchCamera(options) {
			this.blockButtons(['camera'], options);
		}
		unblockSwitchCamera(options) {
			this.unblockButtons(['camera'], options);
		}
		blockSwitchMicrophone(options) {
			this.blockButtons(['microphone'], options);
		}
		unblockSwitchMicrophone(options) {
			this.unblockButtons(['microphone'], options);
		}
		blockScreenSharing() {
			this.blockButtons(['screen']);
		}
		blockHistoryButton() {
			this.blockButtons(['history']);
		}

		/**
		 * @param {string[]} buttons Array of buttons names to block
		 * @param {object} [options]
		 * @param {boolean} [options.announce=true] Whether the picture-in-picture window speaks the change
		 */
		blockButtons(buttons, options) {
			if (!main_core.Type.isArray(buttons)) {
				void console.error('buttons should be array');
			}
			buttons.forEach(buttonName => {
				this.blockedButtons[buttonName] = true;
				if (this.buttons[buttonName]) {
					this.buttons[buttonName].setBlocked(true);
				}
			});
			this.#syncDeviceSelectorAvailability();
			this.syncPictureInPictureBlockedButtons(options);
		}

		/**
		 * @param {string[]} buttons Array of buttons names to unblock
		 * @param {object} [options]
		 * @param {boolean} [options.announce=true] Whether the picture-in-picture window speaks the change
		 */
		unblockButtons(buttons, options) {
			if (!main_core.Type.isArray(buttons)) {
				void console.error('buttons should be array');
			}
			buttons.forEach(buttonName => {
				delete this.blockedButtons[buttonName];
				if (this.buttons[buttonName]) {
					this.buttons[buttonName].setBlocked(this.isButtonBlocked(buttonName));
				}
			});
			this.#syncDeviceSelectorAvailability();
			this.syncPictureInPictureBlockedButtons(options);
		}

		/**
		 * Keeps the open device selector on the same blocking predicate as the panel buttons.
		 *
		 * The predicate reads more than the blocked list - the camera also follows uiState - so both
		 * columns are re-read on every button update, not only when the blocked list itself changes.
		 */
		#syncDeviceSelectorAvailability() {
			if (!this.deviceSelector) {
				return;
			}
			this.deviceSelector.toggleMicrophoneAvailability(!this.isButtonBlocked('microphone'));
			this.deviceSelector.toggleCameraAvailability(!this.isButtonBlocked('camera'));
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
			return this.layout !== Layouts.Mobile && (this.uiState === UiState.Preparing || this.uiState === UiState.Connected) && !this.mediaSelectionBlocked && !this.isFullScreen;
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
			result = this.#getMainButtonList();
			result = result.filter(buttonCode => {
				return !Object.prototype.hasOwnProperty.call(this.hiddenButtons, buttonCode) && !Object.prototype.hasOwnProperty.call(this.overflownButtons, buttonCode);
			});
			if (Object.keys(this.overflownButtons).length > 0 && isBottomCenterMenuVisible(this.uiState)) {
				result.push('more');
			}
			if (this.uiState === UiState.Preparing) {
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
		#getMainButtonList() {
			const result = [];
			result.push('microphone', 'camera');
			if (this.layout === Layouts.Mobile) {
				result.push('mobileMenu');
			} else {
				result.push('speaker');
			}
			const bottomCenterMenuIsVisible = isBottomCenterMenuVisible(this.uiState);
			if (bottomCenterMenuIsVisible) {
				result.push('chat');
			}
			if (this.layout !== Layouts.Mobile) {
				result.push('users');
			}
			if (this.layout !== Layouts.Mobile && bottomCenterMenuIsVisible) {
				result.push('floorRequest', 'screen', 'record', 'document');
			}
			if (this.layout !== Layouts.Mobile && call_core.CallAI.serviceEnabled && bottomCenterMenuIsVisible) {
				result.push('copilot');
			}
			return result;
		}
		getTopButtonList() {
			let result = [];
			if (this.layout === Layouts.Mobile) {
				return ['participantsMobile'];
			}
			result.push('watermark', 'protected', 'recordStatus', 'spacer');
			if (this.uiState === UiState.Connected && this.layout !== Layouts.Mobile) {
				result.push('grid');
			}
			if (this.uiState !== UiState.Preparing && this.isFullScreenSupported() && this.layout !== Layouts.Mobile) {
				result.push('fullscreen');
			}
			if (this.uiState === UiState.Connected && this.layout !== Layouts.Mobile) {
				result.push('feedback');
			}
			if (this.uiState === UiState.Connected && this.layout !== Layouts.Mobile && this.#guestLink !== null) {
				result.push('link');
			}
			if (this.uiState === UiState.Connected && this.layout !== Layouts.Mobile && call_core.Util.canControlChangeSettings() && call_core.Util.isUserControlFeatureEnabled()) {
				result.push('callcontrol');
			}
			if (this.uiState !== UiState.Preparing) {
				result.push('participants');
			}
			result = result.filter(buttonCode => !Object.hasOwn(this.hiddenTopButtons, buttonCode));
			this.needToRerenderTopButtonList = this.previousTopButtonList.toString() !== result.toString();
			this.previousTopButtonList = result;
			return result;
		}
		render() {
			this.#createRootLayout();
			this.talkingService.init({
				root: this.elements.root
			});
			this.talkingService.refreshQueue();
			this.#createCallPanel();
			if (this.layout === Layouts.Mobile) {
				this.#createMobileElements();
			}
			this.centralUser.mount(this.elements.center);
			this.#createUserBlock();
			this.#createUserListElements();
			this.#applyLayoutSetup();
			this.resizeObserver.observe(this.elements.root);
			this.resizeObserver.observe(this.container);
			return this.elements.root;
		}
		#createRootLayout() {
			this.elements.root = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall bx-messenger-videocall-scope'
				},
				attrs: {
					role: 'region',
					tabindex: '-1',
					// Seeded from the accessible name only: this.title is a bare, HTML-encoded person name
					// and would name the region "Ivan" instead of one of the four allowed forms.
					'aria-label': this.getRootAccessibleName()
				},
				children: [this.elements.wrap = main_core.Dom.create('div', {
					props: {
						className: `bx-messenger-videocall-wrap ${this.isCopilotActive ? 'bx-messenger-videocall-wrap-with-copilot' : ''}`
					},
					attrs: {
						'data-testid': 'call-window-wrap'
					},
					children: [this.elements.container = main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-inner'
						},
						children: [this.elements.center = main_core.Dom.create('div', {
							props: {
								className: 'bx-messenger-videocall-central-user'
							},
							events: {
								touchstart: this.#onCenterTouchStart.bind(this),
								touchend: this.#onCenterTouchEnd.bind(this)
							}
						}), this.elements.pageNavigatorLeft = main_core.Dom.create('div', {
							props: {
								className: 'bx-messenger-videocall-page-navigator left'
							},
							children: [this.elements.pageNavigatorLeftCounter = main_core.Dom.create('div', {
								props: {
									className: 'bx-messenger-videocall-page-navigator-counter left'
								},
								html: `${this.currentPage - 1}&nbsp;/&nbsp;${this.pagesCount}`
							}), main_core.Dom.create('div', {
								props: {
									className: 'bx-messenger-videocall-page-navigator-icon left'
								}
							})],
							events: {
								click: this.#onLeftPageNavigatorClick.bind(this)
							}
						}), this.elements.pageNavigatorRight = main_core.Dom.create('div', {
							props: {
								className: 'bx-messenger-videocall-page-navigator right'
							},
							children: [this.elements.pageNavigatorRightCounter = main_core.Dom.create('div', {
								props: {
									className: 'bx-messenger-videocall-page-navigator-counter right'
								},
								html: `${this.currentPage + 1}&nbsp;/&nbsp;${this.pagesCount}`
							}), main_core.Dom.create('div', {
								props: {
									className: 'bx-messenger-videocall-page-navigator-icon right'
								}
							})],
							events: {
								click: this.#onRightPageNavigatorClick.bind(this)
							}
						})]
					}), this.elements.topPanel = main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-top-panel'
						}
					}), this.elements.notificationPanel = main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-notification-panel'
						}
					}), this.elements.bottom = main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-bottom'
						},
						children: [this.elements.userSelectorContainer = main_core.Dom.create('div', {
							props: {
								className: 'bx-messenger-videocall-bottom-user-selector-container'
							}
						}), this.elements.pinnedUserContainer = main_core.Dom.create('div', {
							props: {
								className: 'bx-messenger-videocall-bottom-pinned-user-container'
							}
						})]
					})]
				})],
				events: {
					click: this.#onBodyClick.bind(this)
				}
			});
		}
		#createCallPanel() {
			if (this.showButtonPanel) {
				this.elements.panel = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-panel'
					},
					attrs: {
						'data-testid': 'call-panel'
					}
				});
				main_core.Dom.append(this.elements.panel, this.elements.bottom);
			} else {
				main_core.Dom.addClass(this.elements.root, 'bx-messenger-videocall-no-button-panel');
			}
		}
		#createMobileElements() {
			this.userSelector = new UserSelectorMobile({
				userRegistry: this.userRegistry
			});
			this.userSelector.mount(this.elements.userSelectorContainer);
			this.elements.ear.left = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-mobile-ear left'
				},
				events: {
					click: this.#onLeftEarClick.bind(this)
				}
			});
			this.elements.ear.right = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-mobile-ear right'
				},
				events: {
					click: this.#onRightEarClick.bind(this)
				}
			});
			this.elements.localUserMobile = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-local-user-mobile'
				}
			});
			if (window.innerHeight < window.innerWidth) {
				main_core.Dom.addClass(this.elements.root, 'orientation-landscape');
			}
			main_core.Dom.append(this.elements.ear.left, this.elements.wrap);
			main_core.Dom.append(this.elements.ear.right, this.elements.wrap);
			main_core.Dom.append(this.elements.localUserMobile, this.elements.wrap);
		}
		#createUserBlock() {
			this.elements.overlay = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-overlay'
				}
			});
			this.elements.userBlock = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-user-block'
				},
				children: [this.elements.ear.top = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-ear bx-messenger-videocall-ear-top'
					},
					children: [main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-ear-icon'
						}
					})],
					events: {
						click: this.#onTopPageNavigatorClick.bind(this)
					}
				}), this.elements.ear.bottom = main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-ear bx-messenger-videocall-ear-bottom'
					},
					children: [main_core.Dom.create('div', {
						props: {
							className: 'bx-messenger-videocall-ear-icon'
						}
					})],
					events: {
						click: this.#onBottomPageNavigatorClick.bind(this)
					}
				})]
			});
		}
		#createUserListElements() {
			this.elements.userList.container = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-user-list'
				},
				events: {
					scroll: main_core.Runtime.debounce(this.toggleEars.bind(this), 300),
					wheel: e => {
						this.elements.userList.container.scrollTop += e.deltaY;
					}
				}
			});
			this.elements.userList.addButton = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-user-add'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-messenger-videocall-user-add-inner'
					}
				})],
				style: {
					order: addButtonPosition
				},
				events: {
					click: this.#onAddButtonClick.bind(this)
				}
			});
		}
		#applyLayoutSetup() {
			if (this.layout === Layouts.Centered || this.layout === Layouts.Mobile) {
				this.centralUser.mount(this.elements.center);
				this.eventEmitter.emit(EventName.onHasMainStream, {
					userId: this.centralUser.id,
					otherUsers: [...this.activeUsers]
				});
				main_core.Dom.addClass(this.elements.root, 'bx-messenger-videocall-centered');
				if (this.layout !== Layouts.Mobile) {
					main_core.Dom.append(this.elements.userBlock, this.elements.container);
				}
			}
			if (this.layout === Layouts.Grid) {
				main_core.Dom.addClass(this.elements.root, 'bx-messenger-videocall-grid');
			}
			if (this.layout === Layouts.Mobile) {
				main_core.Dom.addClass(this.elements.root, 'bx-messenger-videocall-fullscreen-mobile');
			}
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
					change.to.userModel.moveTo(change.to.order);
					this.cache.delete('activeUsers');
				} else if (change.type === SwapType.Replace && change.to && change.from) {
					change.to.userModel.takeOrderOf(change.from.order);
					change.from.userModel.moveTo(change.to.order);
					this.cache.delete('activeUsers');
				}
			});
		}

		// Pure with respect to `rules`: the caller keeps its arrays untouched and reads the leftovers
		// from the returned value.
		#processVideoRules(rules, params) {
			const videoEnabled = rules[RerenderReason.VideoEnabled];
			const videoDisabled = rules[RerenderReason.VideoDisabled];
			const diffBetweenChanges = videoEnabled.length - videoDisabled.length;
			const lessChanges = diffBetweenChanges > 0 ? videoDisabled : videoEnabled;
			const moreChanges = diffBetweenChanges > 0 ? videoEnabled : videoDisabled;
			if (videoEnabled.length > 0 && videoDisabled.length > 0) {
				lessChanges.forEach((el, index) => {
					const toUser = this.userRegistry.get(el.id);
					const fromUser = this.userRegistry.get(moreChanges[index].id);
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
			params.clearOrderChanges();
			if (diffBetweenChanges === 0) {
				return {
					videoEnabled: [],
					videoDisabled: []
				};
			}
			const unpaired = moreChanges.slice(moreChanges.length - Math.abs(diffBetweenChanges));
			if (diffBetweenChanges < 0) {
				return {
					videoEnabled: [],
					videoDisabled: unpaired
				};
			}
			unpaired.forEach(el => {
				params.orderChanges.push({
					type: SwapType.Replace,
					from: {
						userModel: this.userRegistry.get(el.id),
						order: this.userRegistry.get(el.id).order
					}
				});
				params.incompleteSwaps.push(params.orderChanges.length);
			});
			return {
				videoEnabled: unpaired,
				videoDisabled: []
			};
		}
		processDisconnectRules(rules, params) {
			if (!rules[RerenderReason.UserDisconnected]) {
				return;
			}
			const userModel = this.userRegistry.get(rules[RerenderReason.UserDisconnected].id);
			if (userModel.prevCameraState) {
				params.markDisconnectedUserHadVideo();
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
				params.setOrderChangeTarget(index, {
					userModel,
					order: userModel.order
				});
				if (currenUserFromCurrentPage && !changedUserFromCurrentPage) {
					params.removeUserFromCurrentPage();
					params.requestUserDeactivation();
				} else if (changedUserFromCurrentPage && !currenUserFromCurrentPage) {
					params.usersToForceDeactivation.push(userEnabledVideo);
				} else if (currenUserFromCurrentPage && changedUserFromCurrentPage) {
					params.usersToKeepActive.push(userEnabledVideo);
				}
				params.incompleteSwaps.pop();
			}
		}
		completeVideoDisabledSwap(params) {
			let usersProcessed = 0;
			params.unpairedVideoDisabled.forEach(el => {
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
						params.requestUserDeactivation();
					} else if (userToSwapPage === this.currentPage && userToSwapPage > userWithoutVideoPage) {
						params.usersToKeepActive.push(el.id);
						params.usersToForceDeactivation.push(userToSwap.id);
						params.requestUserDeactivation();
					}
				}
			});
			this.applyOrderChanges(params.orderChanges);
		}
		calculateUserActive(userId, currentStatus, userSkipped, params) {
			if (params.usersWithEnabledVideo.includes(userId) && !userSkipped && !params.possibleActiveUsers.includes(userId)) {
				params.addUserToCurrentPage();
				params.cancelUserDeactivation();
				return true;
			}
			if (params.currentPageUsers + params.usersToDeactivate > this.usersPerPage) {
				params.removeUserFromCurrentPage();
				return false;
			}
			return currentStatus;
		}
		completeDisconnectSwap(rules, params) {
			const disconnectedUser = rules[RerenderReason.UserDisconnected];
			if (!disconnectedUser) {
				return;
			}
			const disconnectedUserFromCurrentPage = this.#isDisconnectedUserOnCurrentPage(disconnectedUser, params);
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
				params.requestUserDeactivation();
			}
			this.applyOrderChanges(params.orderChanges);
		}
		#isDisconnectedUserOnCurrentPage(disconnectedUser, params) {
			const lowerOrderOnCurrentPage = this.userRegistry.get(params.possibleActiveUsers[0])?.order;
			const higherOrderOnCurrentPage = this.userRegistry.get(params.possibleActiveUsers[params.possibleActiveUsers.length - 1])?.order;
			if (this.currentPage === 1) {
				return disconnectedUser.order < lowerOrderOnCurrentPage || disconnectedUser.order > lowerOrderOnCurrentPage && disconnectedUser.order < higherOrderOnCurrentPage;
			}
			const skipUsers = (this.currentPage - 2) * this.usersPerPage;
			const activeUsersFromPreviousPage = params.activeUsers.slice(skipUsers, skipUsers + this.usersPerPage);
			const lastActiveUserFromPreviousPage = this.userRegistry.get(activeUsersFromPreviousPage[activeUsersFromPreviousPage.length - 1]);
			return disconnectedUser.order > lowerOrderOnCurrentPage && disconnectedUser.order < higherOrderOnCurrentPage || disconnectedUser.order < lowerOrderOnCurrentPage && disconnectedUser.order > lastActiveUserFromPreviousPage?.order;
		}
		renderAddUserButtonInList() {
			const showAdd = this.showAddUserButtonInList && this.layout === Layouts.Centered && this.uiState === UiState.Connected && !this.isButtonBlocked('add') && this.getConnectedUserCount() < this.userLimit - 1 && !this.isFullScreen && this.elements.userList.addButton;
			if (showAdd) {
				main_core.Dom.append(this.elements.userList.addButton, this.elements.userList.container);
				return;
			}
			main_core.Dom.remove(this.elements.userList.addButton);
		}
		renderUserList() {
			clearTimeout(this.rerenderTimeout);
			this.rerenderTimeout = null;
			const prevActiveUsers = new Set(this.activeUsers);
			this.activeUsers.clear();
			const showLocalUser = shouldShowLocalUser(this.localUser.userModel);
			let userCount = 0;
			let skippedUsers = 0;
			let renderedUsers = 0;
			const {
				orderingRules,
				orderingParams,
				skipUsers
			} = this.#prepareUserOrdering();
			const userModels = [...this.userRegistry.users.values()];
			for (const userModel of userModels) {
				const userId = userModel.id;
				if (!Object.hasOwn(this.users, userId)) {
					continue;
				}
				if (isSameUser(userId, this.centralUser.id) && (this.layout === Layouts.Centered || this.layout === Layouts.Mobile)) {
					this.#renderCentralUserInList(userId, orderingParams, prevActiveUsers);
					continue;
				}
				const state = this.#resolveUserActiveState(userModel, skipUsers, skippedUsers, renderedUsers, orderingRules, orderingParams);
				skippedUsers = state.skippedUsers;
				const mounted = this.#mountUserInList(userId, state.userActive, orderingParams, prevActiveUsers);
				renderedUsers += mounted.renderedUsersDelta;
				userCount += mounted.userCountDelta;
			}
			this.applyOrderChanges(orderingParams.orderChanges);
			userCount += this.#renderLocalUserInList(showLocalUser);
			const prevUserWidth = this.userSize.width;
			this.#updateUserListSizes(userCount);
			this.renderAddUserButtonInList();
			main_core.Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-user-list-empty', this.elements.userList.container.childElementCount === 0);
			this.localUser.updatePanelDeferred();
			const {
				usersToActivate,
				usersToDeactivate
			} = this.#getUserChangesAfterRendering(prevActiveUsers, prevUserWidth);
			this.applyIncomingVideoConstraints(usersToActivate, usersToDeactivate);
		}
		#resolveUserActiveState(userModel, skipUsers, initialSkippedUsers, renderedUsers, orderingRules, orderingParams) {
			let skippedUsers = initialSkippedUsers;
			let userActive = userModel.hasActiveState;
			let userSkipped = false;
			if (userActive && skipUsers > 0 && skippedUsers < skipUsers) {
				// skip users on previous pages
				skippedUsers++;
				userActive = false;
				userSkipped = true;
			}
			if (userActive && this.layout === Layouts.Grid && this.usersPerPage > 0 && renderedUsers < this.usersPerPage) {
				orderingParams.addUserToCurrentPage();
			}
			if (this.layout === Layouts.Grid) {
				userActive = this.#applyGridOrderingRules(userModel, userActive, userSkipped, orderingRules, orderingParams);
			}
			if (userActive && (this.layout === Layouts.Grid || this.layout === Layouts.Centered) && this.usersPerPage > 0 && renderedUsers >= this.usersPerPage) {
				// skip users on following pages
				userActive = false;
			}
			return {
				userActive,
				skippedUsers
			};
		}
		#mountUserInList(userId, userActive, orderingParams, prevActiveUsers) {
			const user = this.users[userId];
			const screenUser = this.screenUsers[userId];
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
				return {
					renderedUsersDelta: 0,
					userCountDelta: 0
				};
			}
			let userCountDelta = 0;
			if (screenUser.hasVideo()) {
				screenUser.mount(this.elements.userList.container);
				userCountDelta++;
			} else {
				screenUser.dismount();
			}
			user.mount(this.elements.userList.container);
			if (!this.isPreparing) {
				this.observeIntersections(user);
			}
			return {
				renderedUsersDelta: 1,
				userCountDelta: userCountDelta + 1
			};
		}
		#prepareUserOrdering() {
			const orderingRules = this.getOrderingRules();
			const orderingParams = new UserOrderingState();
			let skipUsers = 0;
			if ((this.layout === Layouts.Grid || this.layout === Layouts.Centered) && this.pagesCount > 1) {
				skipUsers = (this.currentPage - 1) * this.usersPerPage;
			}
			const unpairedVideo = this.#processVideoRules(orderingRules, orderingParams);
			orderingParams.setUnpairedVideoChanges(unpairedVideo.videoEnabled, unpairedVideo.videoDisabled);
			this.processDisconnectRules(orderingRules, orderingParams);
			orderingParams.usersWithEnabledVideo = orderingParams.unpairedVideoEnabled.map(el => el.id);
			orderingParams.usersWithDisabledVideo = orderingParams.unpairedVideoDisabled.map(el => el.id);
			orderingParams.activeUsers = this.getActiveUsers();
			orderingParams.possibleActiveUsers = orderingParams.activeUsers.slice(skipUsers, skipUsers + this.usersPerPage);
			orderingParams.usersWithVideo = this.getUsersWithCamera();
			this.completeVideoDisabledSwap(orderingParams);
			this.completeDisconnectSwap(orderingRules, orderingParams);
			orderingParams.activeUsers = this.getActiveUsers();
			orderingParams.possibleActiveUsers = orderingParams.activeUsers.slice(skipUsers, skipUsers + this.usersPerPage);
			return {
				orderingRules,
				orderingParams,
				skipUsers
			};
		}
		#renderCentralUserInList(userId, orderingParams, prevActiveUsers) {
			const user = this.users[userId];
			const screenUser = this.screenUsers[userId];
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
		}
		#applyGridOrderingRules(userModel, initialUserActive, userSkipped, orderingRules, orderingParams) {
			if (orderingParams.unpairedVideoEnabled.length > 0) {
				return this.#applyVideoEnabledOrdering(userModel, initialUserActive, userSkipped, orderingParams);
			}
			if (orderingParams.unpairedVideoDisabled.length > 0) {
				return this.#applyVideoDisabledOrdering(userModel, initialUserActive, orderingParams);
			}
			if (orderingRules[RerenderReason.UserDisconnected]) {
				return this.#applyUserDisconnectedOrdering(userModel, initialUserActive, orderingParams);
			}
			return initialUserActive;
		}
		#applyVideoEnabledOrdering(userModel, initialUserActive, userSkipped, orderingParams) {
			let userActive = this.#resolveVideoEnabledSwap(userModel, initialUserActive, userSkipped, orderingParams);
			if (orderingParams.usersToDeactivate) {
				userActive = this.calculateUserActive(userModel.id, userActive, userSkipped, orderingParams);
			}
			if (orderingParams.usersToForceDeactivation.includes(userModel.id)) {
				userActive = false;
			}
			return userActive;
		}
		#resolveVideoEnabledSwap(userModel, initialUserActive, userSkipped, orderingParams) {
			let userActive = initialUserActive;
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
			return userActive;
		}
		#applyVideoDisabledOrdering(userModel, initialUserActive, orderingParams) {
			if (orderingParams.usersToKeepActive.includes(userModel.id)) {
				orderingParams.cancelUserDeactivation();
				return true;
			}
			if (orderingParams.usersToForceDeactivation.includes(userModel.id) || orderingParams.currentPageUsers + orderingParams.usersToDeactivate > this.usersPerPage) {
				orderingParams.removeUserFromCurrentPage();
				return false;
			}
			return initialUserActive;
		}
		#applyUserDisconnectedOrdering(userModel, initialUserActive, orderingParams) {
			if (orderingParams.usersToKeepActive.includes(userModel.id)) {
				orderingParams.cancelUserDeactivation();
				return true;
			}
			if (orderingParams.currentPageUsers + orderingParams.usersToDeactivate > this.usersPerPage) {
				orderingParams.removeUserFromCurrentPage();
				return false;
			}
			return initialUserActive;
		}
		#renderLocalUserInList(showLocalUser) {
			if (!showLocalUser) {
				this.localUser.dismount();
				return 0;
			}
			if (this.layout === Layouts.Centered && isSameUser(this.userId, this.centralUser.id) || this.layout === Layouts.Mobile) {
				this.localUser.mount(this.elements.center, true);
				this.localUser.visible = true;
			} else {
				// using force true to always move self to the end of the list
				this.localUser.mount(this.elements.userList.container);
				if (this.layout !== Layouts.Centered || !this.intersectionObserver) {
					this.localUser.visible = true;
				}
			}
			return 1;
		}
		#updateUserListSizes(userCount) {
			if (this.layout === Layouts.Grid) {
				this.updateGridUserSize(userCount);
			} else {
				main_core.Dom.addClass(this.elements.userList.container, 'bx-messenger-videocall-user-list-small');
				main_core.Dom.style(this.elements.userList.container, '--avatar-size', null);
				main_core.Dom.style(this.elements.userList.container, '--avatar-text-size', null);
				this.updateCentralUserAvatarSize();
			}
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
		updateGridUserSize(userCount) {
			const containerSize = this.elements.userList.container.getBoundingClientRect();
			this.userSize = call_core.Util.findBestElementSize(containerSize.width, containerSize.height, userCount, MIN_GRID_USER_WIDTH, MIN_GRID_USER_HEIGHT);

			// Change the size to make it possible to make indents between users
			const rows = Math.floor(containerSize.height / MIN_GRID_USER_HEIGHT) || 1;
			this.userSize.width -= 5 * rows;
			this.userSize.height -= 2.75 * rows;
			const avatarSize = Math.round(this.userSize.height * 0.45);
			const avatarTextSize = Math.round(avatarSize * 0.45);
			main_core.Dom.style(this.elements.userList.container, '--grid-user-width', `${this.userSize.width}px`);
			main_core.Dom.style(this.elements.userList.container, '--grid-user-height', `${this.userSize.height}px`);
			main_core.Dom.style(this.elements.userList.container, '--avatar-size', `${avatarSize}px`);
			main_core.Dom.style(this.elements.userList.container, '--avatar-text-size', `${avatarTextSize}px`);
			if (this.userSize.width < 220) {
				main_core.Dom.addClass(this.elements.userList.container, 'bx-messenger-videocall-user-list-small');
			} else {
				main_core.Dom.removeClass(this.elements.userList.container, 'bx-messenger-videocall-user-list-small');
			}
		}
		updateCentralUserAvatarSize() {
			if (this.layout === Layouts.Mobile) {
				const containerSize = this.elements.root.getBoundingClientRect();
				this.#applyCentralUserAvatarSize(Math.round(containerSize.width * 0.55));
				return;
			}
			if (this.layout === Layouts.Centered) {
				const containerSize = this.elements.center.getBoundingClientRect();
				const avatarSize = Math.min(Math.round(containerSize.height * 0.45), Math.round(containerSize.width * 0.45));
				this.centralUser.setIncomingVideoConstraints(Math.floor(containerSize.width), Math.floor(containerSize.height));
				this.#applyCentralUserAvatarSize(avatarSize);
			}
		}
		#applyCentralUserAvatarSize(avatarSize) {
			const avatarTextSize = Math.round(avatarSize * 0.45);
			main_core.Dom.style(this.elements.center, '--avatar-size', `${avatarSize}px`);
			main_core.Dom.style(this.elements.center, '--avatar-text-size', `${avatarTextSize}px`);
		}
		renderButtons(buttons, rerender) {
			const containers = this.#createButtonPanelContainers(rerender);
			for (const buttonCode of buttons) {
				const button = this.#preparePanelButton(buttonCode, rerender);
				if (!rerender) {
					continue;
				}
				const element = button ? button.render() : this.#createPanelSpacer(buttonCode);
				if (element) {
					main_core.Dom.append(element, this.#getPanelButtonContainer(buttonCode, containers));
				}
			}
			return containers.panelInner;
		}
		#createButtonPanelContainers(rerender) {
			const panelInner = rerender ? main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-panel-inner'
				}
			}) : null;
			if (this.layout === Layouts.Mobile || this.size === Size.Folded) {
				return {
					panelInner,
					left: panelInner,
					center: panelInner,
					right: panelInner
				};
			}
			if (!rerender) {
				return {
					panelInner,
					left: null,
					center: null,
					right: null
				};
			}
			const left = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-panel-inner-left'
				}
			});
			const center = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-panel-inner-center'
				}
			});
			const right = main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-panel-inner-right'
				}
			});
			main_core.Dom.append(left, panelInner);
			main_core.Dom.append(center, panelInner);
			main_core.Dom.append(right, panelInner);
			return {
				panelInner,
				left,
				center,
				right
			};
		}
		#preparePanelButton(buttonCode, rerender) {
			switch (buttonCode) {
				case 'title':
					return this.#prepareTitleButton();
				case 'share':
					return rerender ? this.#createShareButton() : null;
				case 'microphone':
					return this.#prepareMicrophoneButton();
				case 'camera':
					return this.#prepareCameraButton();
				case 'screen':
					return this.#prepareScreenButton();
				case 'record':
					return this.#prepareRecordButton();
				case 'document':
					return this.#prepareDocumentButton();
				case 'copilot':
					return this.#prepareCopilotButton();
				case 'returnToCall':
					return rerender ? this.#createReturnToCallButton() : null;
				case 'hangup':
					return rerender ? this.#createHangupButton() : null;
				case 'hangupOptions':
					return rerender ? this.#createHangupOptionsButton() : null;
				case 'close':
					return rerender ? this.#createCloseButton() : null;
				case 'mobileMenu':
					return rerender ? this.#prepareMobileMenuButton() : null;
				case 'chat':
					return this.#prepareChatButton();
				case 'floorRequest':
					return this.#prepareFloorRequestButton();
				case 'more':
					return rerender ? this.#prepareMoreButton() : null;
				// getButtonList() yields 'speaker', which has no button of its own in the panel
				case 'speaker':
				default:
					return null;
			}
		}
		#getPanelButtonContainer(buttonCode, containers) {
			switch (buttonCode) {
				case 'title':
				case 'microphone':
				case 'camera':
					return containers.left;
				case 'returnToCall':
				case 'hangup':
				case 'hangupOptions':
				case 'close':
					return containers.right;
				case 'spacer':
					return containers.panelInner;
				default:
					return containers.center;
			}
		}
		#createPanelSpacer(buttonCode) {
			if (buttonCode !== 'spacer') {
				return null;
			}
			return main_core.Dom.create('div', {
				props: {
					className: 'bx-messenger-videocall-panel-spacer'
				}
			});
		}
		#prepareTitleButton() {
			if (this.buttons.title) {
				this.buttons.title.update({
					text: this.title,
					isGroupCall: Object.keys(this.users).length > 1
				});
				return this.buttons.title;
			}
			this.buttons.title = new TitleButton({
				text: this.title,
				isGroupCall: Object.keys(this.users).length > 1
			});
			return this.buttons.title;
		}
		#prepareMicrophoneButton() {
			if (this.buttons.microphone) {
				this.buttons.microphone.setBlocked(this.isButtonBlocked('microphone'));
				return this.buttons.microphone;
			}
			this.buttons.microphone = new DeviceButton({
				class: 'microphone',
				text: main_core.Loc.getMessage('IM_M_CALL_BTN_MIC'),
				enabled: !call_core.Hardware.isMicrophoneMuted,
				arrowHidden: this.layout === Layouts.Mobile,
				blocked: this.isButtonBlocked('microphone'),
				showLevel: true,
				sideIcon: getMicrophoneSideIcon(this.roomState),
				arrowAriaLabel: main_core.Loc.getMessage('CALL_VIEW_MIC_DEVICE_ARIA'),
				arrowHasPopup: AriaHasPopup.Dialog,
				onClick: this.#onMicrophoneButtonClick.bind(this),
				onArrowClick: this.#onMicrophoneArrowClick.bind(this),
				onSideIconClick: this.#onMicrophoneSideIconClick.bind(this),
				// no client check here: the text below is the one place that decides which of
				// the two lines applies, and the button shows no plate for an empty one
				tooltip: {
					position: 'top',
					getText: () => this.#getMicrophoneTooltipText()
				}
			});
			return this.buttons.microphone;
		}
		#prepareCameraButton() {
			if (this.buttons.camera) {
				this.buttons.camera.setBlocked(this.isButtonBlocked('camera'));
				return this.buttons.camera;
			}
			this.buttons.camera = new DeviceButton({
				class: 'camera',
				text: main_core.Loc.getMessage('IM_M_CALL_BTN_CAMERA'),
				enabled: call_core.Hardware.isCameraOn,
				arrowHidden: this.layout === Layouts.Mobile,
				blocked: this.isButtonBlocked('camera'),
				arrowAriaLabel: main_core.Loc.getMessage('CALL_VIEW_CAMERA_DEVICE_ARIA'),
				arrowHasPopup: AriaHasPopup.Dialog,
				onClick: this.#onCameraButtonClick.bind(this),
				onArrowClick: this.#onCameraArrowClick.bind(this),
				...(call_core.Util.isDesktop() ? {
					tooltip: {
						position: 'top',
						getText: () => `${this.keyModifierForCss} + V`
					}
				} : {})
			});
			return this.buttons.camera;
		}
		#prepareScreenButton() {
			if (this.buttons.screen) {
				this.buttons.screen.setBlocked(this.isButtonBlocked('screen'));
				return this.buttons.screen;
			}
			this.buttons.screen = new SimpleButton({
				class: 'screen',
				backgroundClass: 'bx-messenger-videocall-panel-background-screen',
				text: main_core.Loc.getMessage('IM_M_CALL_BTN_SCREEN'),
				blocked: this.isButtonBlocked('screen'),
				isToggle: true,
				onClick: this.#onScreenButtonClick.bind(this),
				...(call_core.Util.isDesktop() ? {
					tooltip: {
						position: 'top',
						getText: () => `${this.keyModifierForCss} + S`
					}
				} : {})
			});
			return this.buttons.screen;
		}
		#prepareRecordButton() {
			if (this.buttons.record) {
				this.buttons.record.setBlocked(this.isButtonBlocked('record'));
				return this.buttons.record;
			}
			this.buttons.record = new SimpleButton({
				class: 'record',
				backgroundClass: 'bx-messenger-videocall-panel-background-record',
				text: main_core.Loc.getMessage('IM_M_CALL_BTN_RECORD'),
				blocked: this.isButtonBlocked('record'),
				// deliberately not a toggle: the button opens a layer, and the state of the
				// recording is told by its state description and by RecordStatusButton
				hasStateDescription: true,
				onClick: this.#onCommonRecordClick.bind(this),
				...(call_core.Util.isDesktop() ? {
					tooltip: {
						position: 'top',
						getText: () => `${this.keyModifierForCss} + R`
					}
				} : {})
			});

			// the recording may already be running by the time the panel gets its button
			this.#syncRecordButtonStateDescription();
			return this.buttons.record;
		}
		#prepareDocumentButton() {
			if (this.buttons.document) {
				this.buttons.document.setBlocked(this.isButtonBlocked('document'));
				return this.buttons.document;
			}
			this.buttons.document = new SimpleButton({
				class: 'document',
				backgroundClass: 'bx-messenger-videocall-panel-background-document',
				text: main_core.Loc.getMessage('IM_M_CALL_BTN_DOCUMENT'),
				blocked: this.isButtonBlocked('document'),
				isToggle: true,
				onClick: this.#onDocumentButtonClick.bind(this)
			});
			return this.buttons.document;
		}
		#prepareCopilotButton() {
			if (this.buttons.copilot) {
				this.buttons.copilot.setBlocked(this.isButtonBlocked('copilot'));
				this.buttons.copilot.setActive(this.isCopilotActive);
				return this.buttons.copilot;
			}
			this.buttons.copilot = new SimpleButton({
				class: 'copilot',
				backgroundClass: 'bx-messenger-videocall-panel-background-copilot',
				text: main_core.Loc.getMessage('CALL_BUTTON_COPILOT_TITLE_MSGVER_1'),
				blocked: this.isButtonBlocked('copilot'),
				isToggle: true,
				onClick: this.#onCopilotButtonClick.bind(this),
				isComingSoon: !this.isCopilotFeaturesEnabled,
				...(call_core.Util.isDesktop() ? {
					tooltip: {
						position: 'top',
						getText: () => this.isCopilotActive ? main_core.Loc.getMessage('CALL_COPILOT_BUTTON_ON_HINT_V2_MSGVER_1') : main_core.Loc.getMessage('CALL_COPILOT_BUTTON_OFF_HINT')
					}
				} : {})
			});
			return this.buttons.copilot;
		}
		#prepareChatButton() {
			if (this.buttons.chat) {
				this.buttons.chat.setBlocked(this.isButtonBlocked('chat'));
				return this.buttons.chat;
			}
			this.buttons.chat = new SimpleButton({
				class: 'chat',
				backgroundClass: 'bx-messenger-videocall-panel-background-chat',
				text: main_core.Loc.getMessage('IM_M_CALL_BTN_CHAT'),
				blocked: this.isButtonBlocked('chat'),
				isToggle: true,
				counterDescriptionMessageKey: 'CALL_VIEW_CHAT_UNREAD_COUNT',
				onClick: this.#onChatButtonClick.bind(this),
				...(call_core.Util.isDesktop() ? {
					tooltip: {
						position: 'top',
						getText: () => `${this.keyModifierForCss} + C`
					}
				} : {})
			});
			return this.buttons.chat;
		}
		#prepareFloorRequestButton() {
			if (this.buttons.floorRequest) {
				this.buttons.floorRequest.setBlocked(this.isButtonBlocked('floorRequest'));
				return this.buttons.floorRequest;
			}
			this.buttons.floorRequest = new SimpleButton({
				class: 'floor-request',
				backgroundClass: 'bx-messenger-videocall-panel-background-floor-request',
				text: main_core.Loc.getMessage('IM_M_CALL_BTN_WANT_TO_SAY'),
				blocked: this.isButtonBlocked('floorRequest'),
				isToggle: true,
				onClick: this.#onFloorRequestButtonClick.bind(this),
				...(call_core.Util.isDesktop() ? {
					tooltip: {
						position: 'top',
						getText: () => `${this.keyModifierForCss} + H`
					}
				} : {})
			});
			return this.buttons.floorRequest;
		}
		#createShareButton() {
			this.buttons.share = new SimpleButton({
				class: 'share',
				text: main_core.Loc.getMessage('IM_M_CALL_BTN_LINK'),
				onClick: this.#onShareButtonClick.bind(this)
			});
			return this.buttons.share;
		}
		#createReturnToCallButton() {
			this.buttons.returnToCall = new SimpleButton({
				class: 'returnToCall',
				text: main_core.Loc.getMessage('IM_M_CALL_BTN_RETURN_TO_CALL'),
				onClick: this.#onBodyClick.bind(this)
			});
			return this.buttons.returnToCall;
		}
		#createHangupButton() {
			this.buttons.hangup = new SimpleButton({
				class: 'hangup',
				backgroundClass: 'bx-messenger-videocall-panel-icon-background-hangup',
				text: Object.keys(this.users).length > 1 ? main_core.Loc.getMessage('IM_M_CALL_BTN_DISCONNECT') : main_core.Loc.getMessage('IM_M_CALL_BTN_HANGUP'),
				onClick: this.#onHangupButtonClick.bind(this)
			});
			return this.buttons.hangup;
		}
		#createHangupOptionsButton() {
			this.buttons.hangupOptions = new SimpleButton({
				class: 'hangup-options',
				backgroundClass: 'bx-messenger-videocall-panel-icon-background-hangup-options',
				ariaLabel: main_core.Loc.getMessage('CALL_VIEW_HANGUP_OPTIONS_ARIA'),
				ariaHasPopup: AriaHasPopup.Menu,
				onClick: this.#onHangupOptionsButtonClick.bind(this)
			});
			return this.buttons.hangupOptions;
		}
		#createCloseButton() {
			this.buttons.close = new SimpleButton({
				class: 'close',
				backgroundClass: 'bx-messenger-videocall-panel-icon-background-hangup',
				text: main_core.Loc.getMessage('IM_M_CALL_BTN_CLOSE'),
				onClick: this.#onCloseButtonClick.bind(this)
			});
			return this.buttons.close;
		}
		#prepareMobileMenuButton() {
			if (!this.buttons.mobileMenu) {
				this.buttons.mobileMenu = new SimpleButton({
					class: 'sandwich',
					text: main_core.Loc.getMessage('IM_M_CALL_BTN_MENU'),
					onClick: this.#onMobileMenuButtonClick.bind(this)
				});
			}
			return this.buttons.mobileMenu;
		}
		#prepareMoreButton() {
			if (!this.buttons.more) {
				this.buttons.more = new SimpleButton({
					class: 'more',
					ariaLabel: main_core.Loc.getMessage('CALL_VIEW_MORE_ARIA'),
					ariaHasPopup: AriaHasPopup.Dialog,
					onClick: this.#onMoreButtonClick.bind(this)
				});
			}
			return this.buttons.more;
		}
		renderTopButtons(buttons, rerender) {
			for (const buttonCode of buttons) {
				const button = this.#prepareTopButton(buttonCode);
				if (!rerender) {
					continue;
				}
				const element = button ? button.render() : this.#createTopPanelDivider(buttonCode);
				if (element) {
					main_core.Dom.append(element, this.elements.topPanel);
				}
			}
		}
		#prepareTopButton(buttonCode) {
			switch (buttonCode) {
				case 'watermark':
					return this.#prepareWaterMarkButton();
				case 'protected':
					return this.#prepareProtectedButton();
				case 'recordStatus':
					return this.#prepareRecordStatusButton();
				case 'grid':
					return this.#prepareGridButton();
				case 'fullscreen':
					return this.#prepareFullScreenButton();
				case 'feedback':
					return this.#prepareFeedbackButton();
				case 'link':
					return this.#prepareLinkButton();
				case 'callcontrol':
					return this.#prepareCallcontrolButton();
				case 'participants':
					return this.#prepareParticipantsButton();
				case 'participantsMobile':
					return this.#prepareParticipantsMobileButton();
				default:
					return null;
			}
		}
		#prepareWaterMarkButton() {
			if (!this.buttons.waterMark) {
				this.buttons.waterMark = new WaterMarkButton({
					language: this.language
				});
			}
			return this.buttons.waterMark;
		}
		#prepareProtectedButton() {
			if (!this.buttons.protected) {
				this.buttons.protected = new TopFramelessButton({
					iconClass: 'protected',
					textClass: 'protected',
					text: main_core.Loc.getMessage('IM_M_CALL_PROTECTED').toLowerCase(),
					tooltip: {
						width: '384px',
						position: 'bottom',
						getText: () => main_core.Loc.getMessage('IM_M_CALL_PROTECTED_HINT')
					}
				});
			}
			return this.buttons.protected;
		}
		#prepareRecordStatusButton() {
			if (this.buttons.recordStatus) {
				this.buttons.recordStatus.updateView();
				return this.buttons.recordStatus;
			}
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
			return this.buttons.recordStatus;
		}
		#prepareGridButton() {
			const gridButtonState = {
				iconClass: this.layout === Layouts.Grid ? 'speaker' : 'grid',
				text: this.layout === Layouts.Grid ? main_core.Loc.getMessage('IM_M_CALL_SPEAKER_MODE') : main_core.Loc.getMessage('IM_M_CALL_GRID_MODE_MSGVER_1')
			};
			if (this.buttons.grid) {
				this.buttons.grid.update(gridButtonState);
				return this.buttons.grid;
			}
			this.buttons.grid = new TopButton({
				...gridButtonState,
				onClick: this.#onGridButtonClick.bind(this),
				...(call_core.Util.isDesktop() ? {
					tooltip: {
						position: 'bottom',
						getText: () => `${this.keyModifierForCss} + W`
					}
				} : {})
			});
			return this.buttons.grid;
		}
		#prepareFullScreenButton() {
			const fullScreenButtonState = {
				iconClass: this.isFullScreen ? 'fullscreen-leave' : 'fullscreen-enter',
				text: this.isFullScreen ? main_core.Loc.getMessage('IM_M_CALL_WINDOW_MODE') : main_core.Loc.getMessage('IM_M_CALL_FULLSCREEN_MODE')
			};
			if (this.buttons.fullscreen) {
				this.buttons.fullscreen.update(fullScreenButtonState);
				return this.buttons.fullscreen;
			}
			this.buttons.fullscreen = new TopButton({
				...fullScreenButtonState,
				onClick: this.#onFullScreenButtonClick.bind(this)
			});
			return this.buttons.fullscreen;
		}
		#prepareFeedbackButton() {
			if (!this.buttons.feedback) {
				this.buttons.feedback = new TopButton({
					iconClass: 'feedback',
					text: main_core.Loc.getMessage('IM_OL_COMMENT_HEAD_BUTTON_VOTE'),
					onClick: this.#onFeedbackButtonClick.bind(this)
				});
			}
			return this.buttons.feedback;
		}
		#prepareLinkButton() {
			if (!this.buttons.link) {
				this.buttons.link = new TopButton({
					iconClass: 'link',
					text: main_core.Loc.getMessage('CALL_VIEW_GUEST_LINK_BUTTON_LABEL'),
					onClick: this.#onLinkButtonClick.bind(this)
				});
			}
			return this.buttons.link;
		}
		#prepareCallcontrolButton() {
			if (!this.buttons.callcontrol) {
				this.buttons.callcontrol = new TopButton({
					iconClass: 'callcontrol',
					text: main_core.Loc.getMessage('CALL_CALLCONTROL_BUTTON_LABEL'),
					onClick: this.#onCallcontrolButtonClick.bind(this)
				});
			}
			return this.buttons.callcontrol;
		}
		#prepareParticipantsButton() {
			const participantsButtonState = {
				foldButtonState: this.#getParticipantsFoldButtonState(),
				allowAdding: !this.isButtonBlocked('add'),
				count: this.getConnectedUserCount(true)
			};
			if (this.buttons.participants) {
				this.buttons.participants.update(participantsButtonState);
				return this.buttons.participants;
			}
			this.buttons.participants = new ParticipantsButton({
				...participantsButtonState,
				onListClick: this.#onParticipantsButtonListClick.bind(this),
				onAddClick: this.#onAddButtonClick.bind(this)
			});
			return this.buttons.participants;
		}
		#getParticipantsFoldButtonState() {
			if (this.isFullScreen && this.layout === Layouts.Centered) {
				return this.isUserBlockFolded ? ParticipantsButton.FoldButtonState.Unfold : ParticipantsButton.FoldButtonState.Fold;
			}
			if (this.showUsersButton) {
				return ParticipantsButton.FoldButtonState.Active;
			}
			return ParticipantsButton.FoldButtonState.Hidden;
		}
		#prepareParticipantsMobileButton() {
			if (!this.buttons.participantsMobile) {
				this.buttons.participantsMobile = new ParticipantsButtonMobile({
					count: this.getConnectedUserCount(true),
					onClick: this.#onParticipantsButtonMobileListClick.bind(this)
				});
			}
			return this.buttons.participantsMobile;
		}
		#createTopPanelDivider(buttonCode) {
			const dividerClassNames = {
				separator: 'bx-messenger-videocall-top-separator',
				spacer: 'bx-messenger-videocall-top-panel-spacer'
			};
			if (!Object.hasOwn(dividerClassNames, buttonCode)) {
				return null;
			}
			return main_core.Dom.create('div', {
				props: {
					className: dividerClassNames[buttonCode]
				}
			});
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
		showCopilotNotify(callId = 0, errorCode = '', notifyText = null) {
			if (errorCode) {
				this.#openCopilotNotify(call_core.CopilotNotifyType[errorCode], callId);
				return;
			}
			const notifyType = this.isCopilotActive ? call_core.CopilotNotifyType.COPILOT_ENABLED : call_core.CopilotNotifyType.COPILOT_DISABLED;
			const promoId = this.isCopilotActive ? 'call:copilot-notify-warning:21112024:all' : 'call:copilot-notify-promo:21112024:all';
			const promoManager = im_v2_lib_promo.PromoManager.getInstance();
			this.#callPopupQueue.add(1, onDone => {
				if (!promoManager.needToShow(promoId)) {
					onDone();
					return;
				}
				this.#openCopilotNotify(notifyType, callId, onDone, notifyText);
			});
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
		createCopilotNotify(notifyType, callId, onDone = null, notifyText = null) {
			if (!this.buttons.copilot) {
				return null;
			}
			return new call_core.CopilotNotify({
				type: notifyType,
				bindElement: this.buttons.copilot.elements.root,
				targetContainer: this.elements.root,
				notifyText: notifyText ?? '',
				onClose: () => {
					this.copilotNotify = null;
					onDone?.();
				},
				callId
			});
		}
		#openCopilotNotify(notifyType, callId = 0, onDone = null, notifyText = null) {
			this.closeCopilotNotify();
			this.copilotNotify = this.createCopilotNotify(notifyType, callId, onDone, notifyText);
			if (this.copilotNotify) {
				this.copilotNotify.show();
				if (!this.copilotNotify.popup) {
					this.copilotNotify = null;
					onDone?.();
				}
			} else {
				onDone?.();
			}
		}
		#showCallControlPromo(onDone = null) {
			if (!this.buttons.callcontrol) {
				onDone?.();
				return;
			}
			if (this.ahaMomentNotifyCallcontrol) {
				this.ahaMomentNotifyCallcontrol.show();
				onDone?.();
				return;
			}
			this.ahaMomentNotifyCallcontrol = new AhaMomentNotify({
				notifyTitle: main_core.Loc.getMessage('CALL_CALLCONTROL_AXA_MOMENT_TITLE'),
				notifyText: main_core.Loc.getMessage('CALL_CALLCONTROL_AXA_MOMENT_TEXT'),
				bindElement: this.buttons.callcontrol.elements.root,
				promoId: CALLCONTROL_PROMO_ID,
				targetContainer: this.elements.root,
				onClose: () => {
					this.needToShowCallcontrolPromo = false;
					this.ahaMomentNotifyCallcontrol = null;
					onDone?.();
				}
			});
			this.ahaMomentNotifyCallcontrol.show();
		}
		calculateUnusedPanelSpace(buttonList) {
			const buttons = buttonList || this.getButtonList();
			const totalButtonWidth = buttons.map(buttonName => this.buttons[buttonName]).filter(Boolean).reduce((total, button) => total + (button.elements.root?.getBoundingClientRect().width ?? 0), 0);
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
			const buttonsList = ['microphone', 'camera'];
			if (this.getButtonActive('screen')) {
				buttonsList.push('stop-screen');
			}
			const isViewHidden = this.isHidden();
			if (this.size === Size.Folded || isViewHidden) {
				buttonsList.push('returnToCall');
			}

			// if (this.getButtonList().includes('copilot'))
			// {
			// 	buttonsList.push("copilot");
			// }

			return buttonsList;
		}
		getPictureInPictureCallWindowUser(targetUserId = null) {
			const isNotMe = id => !main_core.Type.isNil(id) && Number(id) !== Number(this.userId);
			const currentUserId = targetUserId ?? (isNotMe(this.presenterId) ? this.presenterId : null) ?? (isNotMe(this.centralUser?.userModel.id) ? this.centralUser?.userModel.id : null) ?? this.getAnyOtherUserId();
			const isLocalUser = Number(this.userId) === Number(currentUserId);
			const currentUser = isLocalUser ? this.localUser : this.users[currentUserId];
			const isCurrentPiPUser = Boolean(this.currentPiPUserId) && currentUserId === this.currentPiPUserId;
			if (isCurrentPiPUser) {
				return null;
			}
			if (!this.activeUsers.has(currentUserId) && !isLocalUser) {
				this.toggleSubscribingVideoInRenderUserList([{
					userId: currentUserId
				}], true);
			}
			if (this.currentPiPUserId && Number(this.userId) !== Number(this.currentPiPUserId) && !this.activeUsers.has(this.currentPiPUserId)) {
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

		/**
		 * The single way the blocking of the panel reaches the picture-in-picture window. That window
		 * keeps the record of what it has already announced, and a second way in would let the record
		 * and the state drift apart - which is how a blocking gets applied and never spoken.
		 *
		 * @param {object} [options]
		 * @param {boolean} [options.announce=true] Whether the window speaks the change
		 */
		syncPictureInPictureBlockedButtons(options) {
			if (!this.pictureInPictureCallWindow) {
				return;
			}
			this.pictureInPictureCallWindow.syncBlockButtons(this.getBlockedButtonsListPictureInPictureCallWindow(), options);
		}
		#onPiPClose() {
			this.eventEmitter.emit(EventName.onPiPClose);
		}
		toggleStatePictureInPictureCallWindow(isActive) {
			const isPiPAvailable = call_core.UnsupportedBrowserFeatures.isPiPAvailable;
			if (isActive && !this.pictureInPictureCallWindow && isPiPAvailable && call_core.Util.isPictureInPictureFeatureEnabled()) {
				this.pictureInPictureCallWindow = new PictureInPictureWindow({
					currentUser: this.getPictureInPictureCallWindowUser(),
					accessibleName: this.getRootAccessibleName(),
					buttons: this.getPictureInPictureCallWindowGetButtonsList(),
					blockedButtons: this.getBlockedButtonsListPictureInPictureCallWindow(),
					preferInitialWindowPlacement: this.preferInitialWindowPlacementPictureInPicture,
					floorRequestNotifications: this.floorRequestNotifications,
					hardwareState: call_core.Hardware,
					Buttons,
					CallUser,
					FloorRequest,
					onClose: () => {
						// first of all: the document of a dead window must not stay in the zone, and
						// every way the window can close - the user, another tab taking it over - lands here
						this.pushToTalkCoordinator?.setPipDocument(null);
						this.pictureInPictureCallWindow = null;
						this.currentPiPUserId = null;
						this.#onPiPClose();
					},
					onButtonClick: ({
						buttonName,
						event
					}) => {
						switch (buttonName) {
							case 'microphone':
								this.#onMicrophoneButtonClick(event);
								break;
							case 'camera':
								this.#onCameraButtonClick(event);
								break;
							case 'returnToCall':
								this.eventEmitter.emit(EventName.onPiPBodyClick);
								break;
							case 'stop-screen':
								this.#onScreenButtonClick(event);
								break;
						}
					}
				});
				this.pictureInPictureCallWindow.checkAvailableAndCreate().then(pictureWindow => {
					this.preferInitialWindowPlacementPictureInPicture = false;
					// the keyboard and the focus of this document are listened to by the extension;
					// a subscription of the window itself would deliver every press twice
					this.pushToTalkCoordinator?.setPipDocument(pictureWindow?.document ?? null);
				}).catch(console.error);
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

		// A button is created lazily and not every panel button announces a layer, so both misses are a
		// silent skip: the caller synchronises again once the panel is rendered.
		setButtonPopupKind(buttonName, kind) {
			const button = this.buttons[buttonName];
			if (!button || !main_core.Type.isFunction(button.setPopupKind)) {
				return;
			}
			button.setPopupKind(kind);
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
			if (this.layout === Layouts.Mobile) {
				if (this.localUser !== this.centralUser) {
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
			if ((this.layout === Layouts.Grid || this.layout === Layouts.Centered) && this.size === Size.Full) {
				this.recalculatePages();
			}
			this.renderUserList();
			if (!this.elements.userList.container.parentElement) {
				if (this.layout === Layouts.Centered) {
					main_core.Dom.append(this.elements.userList.container, this.elements.userBlock);
				} else if (this.layout === Layouts.Grid) {
					main_core.Dom.append(this.elements.userList.container, this.elements.container);
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
				ariaLabel: main_core.Loc.getMessage('CALL_VIEW_MORE_POPUP_ARIA'),
				closeByEsc: true,
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
						const moreRoot = this.buttons.more?.elements?.root;
						if (moreRoot) {
							moreRoot.setAttribute('aria-expanded', 'false');
							if (!document.activeElement || document.activeElement === document.body) {
								moreRoot.focus();
							}
						}
					}
				}
			});
			this.overflownButtonsPopup.show();
			this.buttons.more?.elements?.root?.setAttribute('aria-expanded', 'true');
		}
		resumeVideo() {
			for (const userId of Object.keys(this.users)) {
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
			for (const userId of Object.keys(this.users)) {
				this.users[userId].allowPinButton = currentConnectedUserCount > 1;
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
			if (this.needToShowCallcontrolPromo && this.buttons.callcontrol) {
				this.needToShowCallcontrolPromo = false;
				void Promise.resolve(true).then(() => {
					if (this.destroyed) {
						return;
					}
					this.#callPopupQueue.add(3, onDone => {
						if (this.size === Size.Folded) {
							onDone();
						} else {
							this.#showCallControlPromo(onDone);
						}
					});
				});
			}
			this.renderAddUserButtonInList();
			this.#syncDeviceSelectorAvailability();
			this.syncPictureInPictureBlockedButtons();
		}
		updateUserData(userData) {
			for (const userId of Object.keys(userData)) {
				this.#applyUserData(userId, userData[userId]);
			}
		}
		#applyUserData(userId, data) {
			if (!this.userData[userId]) {
				this.userData[userId] = {
					name: '',
					avatar_hr: '',
					gender: 'M'
				};
			}
			const target = this.userData[userId];
			if (data.name) {
				target.name = data.name;
			}
			const avatar = data.avatar_hr || data.avatar;
			if (avatar) {
				target.avatar_hr = call_core.Util.isAvatarBlank(avatar) ? '' : avatar;
			}
			if (data.gender) {
				target.gender = data.gender === 'F' ? 'F' : 'M';
			}
			const userModel = this.userRegistry.get(userId);
			if (userModel) {
				userModel.name = target.name;
				userModel.avatar = checkAndEncodeURI(target.avatar_hr);
			}
		}
		isScreenSharingSupported() {
			return navigator.mediaDevices && main_core.Type.isFunction(navigator.mediaDevices.getDisplayMedia) || !main_core.Type.isUndefined(window.BXDesktopSystem);
		}
		isRecordingHotKeySupported() {
			return !main_core.Type.isUndefined(window.BXDesktopSystem) && window.BXDesktopSystem.ApiVersion() >= 60;
		}
		isFullScreenSupported() {
			if (BX.browser.IsChrome() || BX.browser.IsSafari()) {
				return document.webkitFullscreenEnabled === true;
			}
			if (BX.browser.IsFirefox()) {
				return document.fullscreenEnabled === true;
			}
			return false;
		}
		toggleEars() {
			this.toggleTopEar();
			this.toggleBottomEar();
			if (this.layout === Layouts.Grid && this.pagesCount > 1 && this.currentPage > 1) {
				main_core.Dom.addClass(this.elements.pageNavigatorLeft, 'active');
			} else {
				main_core.Dom.removeClass(this.elements.pageNavigatorLeft, 'active');
			}
			if (this.layout === Layouts.Grid && this.pagesCount > 1 && this.currentPage < this.pagesCount) {
				main_core.Dom.addClass(this.elements.pageNavigatorRight, 'active');
			} else {
				main_core.Dom.removeClass(this.elements.pageNavigatorRight, 'active');
			}
		}
		toggleTopEar() {
			if (this.layout !== Layouts.Grid && this.pagesCount > 1) {
				main_core.Dom.addClass(this.elements.ear.top, 'active');
			} else {
				main_core.Dom.removeClass(this.elements.ear.top, 'active');
			}
		}
		toggleBottomEar() {
			if (this.layout !== Layouts.Grid && this.pagesCount > 1) {
				main_core.Dom.addClass(this.elements.ear.bottom, 'active');
			} else {
				main_core.Dom.removeClass(this.elements.ear.bottom, 'active');
			}
		}
		toggleRenameSliderInputLoader() {
			main_core.Dom.addClass(this.elements.renameSlider.button, 'ui-btn-wait');
		}
		setHotKeyTemporaryBlock(isActive, force) {
			if (isActive) {
				this.hotKeyTemporaryBlock++;
			} else {
				this.hotKeyTemporaryBlock--;
				if (this.hotKeyTemporaryBlock < 0 || force) {
					this.hotKeyTemporaryBlock = 0;
				}
			}
		}
		isHotKeyActive(name) {
			if (!this.hotKey.all) {
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
			return Boolean(this.hotKey[name]);
		}

		// The three below carry what only the controller sees down to the hold policy. The coordinator is
		// assembled here, so the controller reaches it through the view contract and gets no channel of
		// its own into the extension.

		notifyConnectionLost() {
			this.pushToTalkCoordinator?.onConnectionLost();
		}
		notifyBroadcastRightLost() {
			this.pushToTalkCoordinator?.onBroadcastRightLost();
		}
		notifySpeechSignal(signal, speaking) {
			this.pushToTalkCoordinator?.onSpeechSignal(signal, speaking);
		}

		// While the focus sits inside the record informer, the keys of the call window stay quiet: Space
		// on a native button of the layer is indistinguishable from push-to-talk.
		startRecordPopupHotKeyGuard(container) {
			this.stopRecordPopupHotKeyGuard();
			if (!container) {
				return;
			}
			const guard = this.recordPopupHotKeyGuard;
			guard.container = container;
			guard.onFocusIn = () => this.setRecordPopupHotKeyBlock(true);
			guard.onFocusOut = e => {
				// focusout also fires while the focus travels between the buttons of the layer
				if (container.contains(e.relatedTarget)) {
					return;
				}
				this.setRecordPopupHotKeyBlock(false);
			};
			main_core.Event.bind(container, 'focusin', guard.onFocusIn);
			main_core.Event.bind(container, 'focusout', guard.onFocusOut);
		}

		// Belongs to the destruction of the layer, not to its closing: Popup.destroy() emits no close
		// event, and a layer torn down while focused would leave the block raised for the whole call.
		stopRecordPopupHotKeyGuard(force = false) {
			const guard = this.recordPopupHotKeyGuard;
			if (guard.container) {
				main_core.Event.unbind(guard.container, 'focusin', guard.onFocusIn);
				main_core.Event.unbind(guard.container, 'focusout', guard.onFocusOut);
			}
			guard.container = null;
			guard.onFocusIn = null;
			guard.onFocusOut = null;
			this.setRecordPopupHotKeyBlock(false, force);
		}

		// The counter is shared with the participant selector and the conference, so the guard moves it
		// once per state change and keeps its own flag: a stray decrement would drop someone else's block.
		setRecordPopupHotKeyBlock(isBlocked, force = false) {
			const guard = this.recordPopupHotKeyGuard;
			if (guard.isBlocked === isBlocked) {
				return;
			}
			guard.isBlocked = isBlocked;
			this.setHotKeyTemporaryBlock(isBlocked, force);
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
				isServiceEnabled: call_core.CallCloudRecord.serviceEnabled,
				bindElement: this.buttons.record?.elements?.root,
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
					const isPaused = this.commonRecordState.state === call_core.CallCommonRecordState.Paused;
					this.commonRecordState.state = isPaused ? call_core.CallCommonRecordState.Started : call_core.CallCommonRecordState.Paused;
					const commonRecordState = isPaused ? call_core.CallCommonRecordState.Resumed : this.commonRecordState.state;

					// the indicator and the description say the same state, so the optimistic redraw carries both
					this.buttons.recordStatus?.update(this.commonRecordState);
					this.#syncRecordButtonStateDescription();
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
					// the layer owns the ARIA of the trigger until destroy, so a closed menu is torn down here
					this.#commonRecord.menuPopup?.destroy();
					this.#commonRecord.menuPopup = null;
				},
				onOpenStateChange: isOpen => {
					this.buttons.record?.setPopupOpen(isOpen);
				}
			});
			this.#commonRecord.menuPopup.toggle();

			// a menu built without a trigger reports no closing back, and a field left taken by it would send
			// every next click into the early return above: the record menu would stay dead until the call ends
			if (!this.#commonRecord.menuPopup?.isShown()) {
				this.#commonRecord.menuPopup = null;
			}
		}
		showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId, options = {}) {
			const {
				onDone = null,
				source = CloudRecordInfoPopupSource.User
			} = options;
			if (this.#commonRecord.infoPopup) {
				this.#commonRecord.infoPopup.close();
				onDone?.();
				return;
			}
			this.#commonRecord.infoPopup = new CloudRecordInfoPopup({
				isCloudRecordFeaturesEnabled,
				tariffAvailable: call_core.CallCloudRecord.tariffAvailable,
				source,
				callId,
				bindElement: this.buttons.record?.elements?.root,
				targetContainer: this.elements.root,
				onClose: () => {
					this.#commonRecord.infoPopup = null;
					onDone?.();
				},
				onDestroy: () => {
					this.stopRecordPopupHotKeyGuard();
				},
				turnOn: () => {
					this.showCommonRecordMenuPopup();
				}
			});
			this.#commonRecord.infoPopup.toggle();
			// a layer built without a trigger reports itself closed right away, so the field can be empty here
			this.startRecordPopupHotKeyGuard(this.#commonRecord.infoPopup?.getPopupContainer());
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

		// A layer that outlived its record state is torn down, not refilled in place: the items would
		// change under the hand of the user, and the focus would be left on an item that is gone.
		#closeStaleCommonRecordPopups() {
			this.#commonRecord.menuPopup = closeCommonRecordPopupLayer(this.#commonRecord.menuPopup);
			this.#commonRecord.infoPopup = closeCommonRecordPopupLayer(this.#commonRecord.infoPopup);
		}
		closeCommonRecordPopups() {
			this.#closeStaleCommonRecordPopups();
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
			void this.showConfirmModal({
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
			const promoManager = im_v2_lib_promo.PromoManager.getInstance();
			if (!promoManager.needToShow(CLOUD_RECORD_PROMO_ID)) {
				return;
			}
			this.#callPopupQueue.add(2, onDone => {
				void promoManager.markAsWatched(CLOUD_RECORD_PROMO_ID);
				this.showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId, {
					onDone,
					source: CloudRecordInfoPopupSource.Promo
				});
			});
		}

		// event handlers

		#onBodyClick() {
			this.eventEmitter.emit(EventName.onBodyClick);
		}
		#onCenterTouchStart(e) {
			this.centerTouchX = e.pageX;
		}
		#onCenterTouchEnd(e) {
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
		#onFullScreenChange() {
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
		#onIntersectionChange(entries) {
			const t = {};
			entries.forEach(intersectionEntry => {
				t[intersectionEntry.target.dataset.userId] = intersectionEntry.isIntersecting;
			});
			for (const userId of Object.keys(t)) {
				if (this.users[userId]) {
					this.users[userId].visible = t[userId];
				}
				if (isSameUser(userId, this.localUser.id)) {
					this.localUser.visible = t[userId];
				}
			}
		}
		#onResize() {
			if (!this.elements.root) {
				return;
			}
			if (BX.browser.IsMobile()) {
				main_core.Dom.style(document.documentElement, '--view-height', `${window.innerHeight}px`);
			}
			if (this.layout === Layouts.Grid || this.layout === Layouts.Centered) {
				this.updateUserList();
			} else {
				this.updateCentralUserAvatarSize();
				this.toggleEars();
			}
			const rootDimensions = this.elements.root.getBoundingClientRect();
			main_core.Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-width-lt-450', rootDimensions.width < 450);
			main_core.Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-width-lt-550', rootDimensions.width < 550);
			main_core.Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-width-lt-650', rootDimensions.width < 650);
			main_core.Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-width-lt-700', rootDimensions.width < 700);
			main_core.Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-width-lt-850', rootDimensions.width < 850);
			main_core.Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-width-lt-900', rootDimensions.width < 900);
			main_core.Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-width-lt-1050', rootDimensions.width < 1050);
			if (this.checkPanelOverflow()) {
				this.updateButtons();
				if (this.overflownButtonsPopup && Object.keys(this.overflownButtons).length === 0) {
					this.overflownButtonsPopup.close();
				}
			}
		}
		#onOrientationChange() {
			if (!this.elements.root) {
				return;
			}
			if (window.innerHeight > window.innerWidth) {
				main_core.Dom.removeClass(this.elements.root, 'orientation-landscape');
			} else {
				main_core.Dom.addClass(this.elements.root, 'orientation-landscape');
			}
		}
		#destroyHotKeyHint() {
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
		#onKeyDown(e) {
			if (!call_core.Util.isDesktop()) {
				return;
			}

			// a layer with a keyboard of its own has already acted on this event
			if (e.defaultPrevented) {
				return;
			}
			if (!(e.shiftKey && (e.ctrlKey || e.metaKey))) {
				return;
			}
			if (e.repeat) {
				return;
			}
			const hotKey = this.#getHotKeyByCode(e.code);
			if (!hotKey || hotKey.isSupported?.() === false || !this.isHotKeyActive(hotKey.name)) {
				return;
			}
			e.preventDefault();
			hotKey.run(e);
		}
		#getHotKeyByCode(code) {
			const hotKeys = {
				KeyA: {
					name: 'microphone',
					run: e => {
						this.#destroyDeviceSelector();
						this.#onMicrophoneButtonClick(e);
					}
				},
				KeyS: {
					name: 'screen',
					run: e => this.#onScreenButtonClick(e)
				},
				KeyV: {
					name: 'camera',
					run: e => {
						this.#destroyDeviceSelector();
						this.#onCameraButtonClick(e);
					}
				},
				KeyU: {
					name: 'users',
					run: e => this.#onUsersButtonClick(e)
				},
				KeyR: {
					name: 'record',
					isSupported: () => this.isRecordingHotKeySupported(),
					run: () => this.#onCommonRecordHotkey()
				},
				KeyH: {
					name: 'floorRequest',
					run: e => this.#onFloorRequestButtonClick(e)
				},
				KeyC: {
					name: 'chat',
					run: e => this.#onChatHotKey(e)
				},
				KeyM: {
					name: 'muteSpeaker',
					run: () => this.eventEmitter.emit(EventName.onButtonClick, {
						buttonName: 'toggleSpeaker',
						speakerMuted: this.speakerMuted,
						fromHotKey: true
					})
				},
				KeyW: {
					name: 'grid',
					run: () => this.setLayout(this.layout === Layouts.Centered ? Layouts.Grid : Layouts.Centered)
				}
			};
			return hotKeys[code] ?? null;
		}
		#onChatHotKey(e) {
			if (this.size === Size.Folded) {
				this.#onBodyClick(e);
				return;
			}
			this.#onChatButtonClick(e);
			this.#destroyHotKeyHint();
		}
		#destroyDeviceSelector() {
			if (this.deviceSelector) {
				this.deviceSelector.destroy();
			}
		}
		#onUserClick(event) {
			const userId = event.userId;
			if (isSameUser(userId, this.centralUser.id) && this.layout !== Layouts.Grid && this.isFullScreen) {
				main_core.Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-hidden-panels');
			} else if (this.layout === Layouts.Centered && !isSameUser(userId, this.centralUser.id)) {
				this.pinUser(userId);
			} else if (this.pinnedUser && this.pinnedUser.id === userId) {
				this.#onUserUnPin();
			} else {
				this.#onUserPin({
					userId
				});
			}
			this.eventEmitter.emit(EventName.onUserClick, {
				userId,
				stream: isSameUser(userId, this.userId) ? this.localUser.stream : this.users[userId].stream,
				layout: this.layout
			});
		}
		#onUserRename(newName) {
			this.eventEmitter.emit(EventName.onUserRename, {
				newName
			});
		}
		#onUserRenameInputFocus() {
			this.setHotKeyTemporaryBlock(true);
		}
		#onUserRenameInputBlur() {
			this.setHotKeyTemporaryBlock(false);
		}
		#onUserPin(e) {
			if (this.layout === Layouts.Grid) {
				this.setLayout(Layouts.Centered);
			}
			this.pinUser(e.userId);
		}
		#onUserUnPin() {
			if (this.layout === Layouts.Centered) {
				this.setLayout(Layouts.Grid);
			} else {
				this.unpinUser();
			}
		}
		#onTurnOffParticipantMic(e) {
			this.eventEmitter.emit(EventName.onTurnOffParticipantMic, {
				userId: e.userId
			});
		}
		#onTurnOffParticipantCam(e) {
			this.eventEmitter.emit(EventName.onTurnOffParticipantCam, {
				userId: e.userId
			});
		}
		#onTurnOffParticipantScreenshare(e) {
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
		#onDocumentButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'document',
				node: e.target
			});
		}
		#onCopilotButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'copilot',
				node: e.target
			});
		}
		#onGridButtonClick() {
			this.setLayout(this.layout === Layouts.Centered ? Layouts.Grid : Layouts.Centered);
		}
		#onAddButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'inviteUser',
				node: e.currentTarget
			});
		}
		#onShareButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'share',
				node: e.currentTarget
			});
		}
		#onMicrophoneButtonClick(e = {}) {
			if (this.isButtonBlocked('microphone')) {
				return;
			}
			if ('stopPropagation' in e) {
				e.stopPropagation();
			}

			// a click is not remembered as a command of the hold policy: for the policy it is somebody
			// else's doing, and the microphone it opens must not be released by the next key up
			this.#emitToggleMute(!call_core.Hardware.isMicrophoneMuted, MICROPHONE_SOURCE_BUTTON);
		}
		#emitToggleMute(muted, source) {
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'toggleMute',
				muted,
				source
			});
		}
		#rememberMicrophoneCommand(muted) {
			this.#forgetMicrophoneCommand();
			this.#pendingMicrophoneCommand = {
				muted,
				timerId: BrowserClock.after(MICROPHONE_COMMAND_CONFIRM_TIMEOUT, () => this.#forgetMicrophoneCommand())
			};
		}
		#forgetMicrophoneCommand() {
			if (this.#pendingMicrophoneCommand === null) {
				return;
			}
			BrowserClock.cancel(this.#pendingMicrophoneCommand.timerId);
			this.#pendingMicrophoneCommand = null;
		}

		// the device library reports no source, so everything except the confirmation of the last command
		// of the hold policy counts as somebody else's doing. The memory is one-shot: the first change
		// spends it, otherwise a dropped command would make the next unmute of the same value look ours.
		#publishMicrophoneChange(muted) {
			const isOwnCommand = this.#pendingMicrophoneCommand?.muted === muted;
			this.#forgetMicrophoneCommand();
			if (!isOwnCommand) {
				this.pushToTalkCoordinator?.onExternalMicrophoneChange(muted);
				return;
			}
			this.#announceMicrophoneState(muted);
		}

		/**
		 * A microphone moved by the hold policy is moved with the focus elsewhere, and aria-checked of a
		 * button nobody stands on is not spoken. A click needs no announcement of its own - the reader
		 * says the new state of the control the user has just operated.
		 *
		 * This is also the only voice the automatic closes have: the silence limit, leaving the zone, a
		 * lost connection and a right taken away all reach the window as a command of the policy.
		 */
		#announceMicrophoneState(muted) {
			const phrase = main_core.Loc.getMessage(muted ? 'CALL_VIEW_MIC_ANNOUNCE_OFF' : 'CALL_VIEW_MIC_ANNOUNCE_ON');
			if (!phrase) {
				return;
			}

			// the picture-in-picture window is a window of its own, with a document and a focus of its
			// own, and a reader following it is not told about a region of the opener. The reader stands
			// where the focus is, so that window is addressed only while the main document holds none -
			// one document at a time, and the one the user is not in would be talking to nobody
			if (!document.hasFocus() && this.pictureInPictureCallWindow?.announceMessage(phrase)) {
				return;
			}

			// polite: an announcement of the call window never interrupts the screen reader
			ui_a11y.LiveAnnouncer.announce(phrase, 'polite');
		}
		#onMicrophoneArrowClick(e) {
			e.stopPropagation();
			this.showDeviceSelector(e.currentTarget);
		}
		#onMicrophoneSideIconClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'microphoneSideIcon'
			});
		}
		#onMicrophoneSelected(deviceId) {
			this.eventEmitter.emit(EventName.onReplaceMicrophone, {
				deviceId
			});
		}
		#onCameraButtonClick(e = {}) {
			if (this.isButtonBlocked('camera')) {
				return;
			}
			if ('stopPropagation' in e) {
				e.stopPropagation();
			}
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'toggleVideo',
				video: !call_core.Hardware.isCameraOn
			});
		}
		#onCameraArrowClick(e) {
			e.stopPropagation();
			this.showDeviceSelector(e.currentTarget);
		}
		#onCameraSelected(deviceId) {
			this.eventEmitter.emit(EventName.onReplaceCamera, {
				deviceId
			});
		}
		#onSpeakerButtonClick() {
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'toggleSpeaker',
				speakerMuted: this.speakerMuted
			});
		}
		#onChangeNoiseSuppression(allowNoiseSuppression) {
			this.eventEmitter.emit(EventName.onChangeNoiseSuppression, {
				allowNoiseSuppression
			});
		}
		#onChangeFaceImprove(faceImproveEnabled) {
			this.eventEmitter.emit(EventName.onChangeFaceImprove, {
				faceImproveEnabled
			});
		}

		// The only handler kept public on purpose: it decides what the quality event carries, and the unit
		// test pins that decision directly. Hiding it behind # would leave the rule covered only through the
		// device selector, whose callback the test would then have to build.
		onChangeVideoQuality(params) {
			const data = {
				...params
			};
			if (this.layout === Layouts.Centered) {
				data.userId = this.centralUser?.id;
			}
			this.eventEmitter.emit(EventName.onChangeVideoQuality, data);
		}
		disableFaceImprove() {
			if (call_core.Util.isDesktop() && im_v2_lib_desktopApi.DesktopApi.isDesktop() && im_v2_lib_desktopApi.DesktopApi.getCameraSmoothingStatus()) {
				this.eventEmitter.emit(EventName.onChangeFaceImprove, {
					faceImproveEnabled: false
				});
			}
		}
		#onSpeakerSelected(deviceId) {
			if (!this.externalSpeakerManagement) {
				this.setSpeakerId(deviceId);
			}
			this.eventEmitter.emit(EventName.onReplaceSpeaker, {
				deviceId
			});
		}
		confirmSpeakerSelection(deviceId) {
			this.speakerId = deviceId;
			if (this.deviceSelector) {
				this.deviceSelector.confirmSpeakerSelection(deviceId);
			}
		}
		#onScreenButtonClick(e) {
			e.stopPropagation();
			const limitObj = this.getScreenSharingLimitation();
			this.onClickButtonWithLimit(limitObj, () => {
				this.eventEmitter.emit(EventName.onButtonClick, {
					buttonName: 'toggleScreenSharing',
					node: e.target
				});
			});
		}
		#onChatButtonClick(e) {
			this.hintManager.hide();
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'showChat',
				node: e.target
			});
		}
		#onUsersButtonClick(e) {
			this.hintManager.hide();
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'toggleUsers',
				node: e.target
			});
		}
		#onMobileMenuButtonClick(e) {
			e.stopPropagation();
			this.showCallMenu();
		}
		#onFloorRequestButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'floorRequest',
				node: e.target
			});
		}
		#onMoreButtonClick(e) {
			e.stopPropagation();
			if (this.overflownButtonsPopup) {
				this.overflownButtonsPopup.close();
				this.buttons.more.setActive(false);
			} else {
				this.showOverflownButtonsPopup();
				this.buttons.more.setActive(true);
			}
		}
		#onHangupButtonClick(e) {
			e.stopPropagation();
			this.clearNewLogicRules();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'hangup',
				node: e.target
			});
		}
		#onHangupOptionsButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'hangupOptions',
				node: e.target
			});
		}
		#onCloseButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'close',
				node: e.target
			});
		}
		#onFullScreenButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'fullscreen',
				node: e.target
			});
		}
		#onFeedbackButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'feedback',
				node: e.target
			});
		}
		#onLinkButtonClick() {
			if (!this.#guestLink) {
				return;
			}
			const notifyCopied = () => {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CALL_VIEW_GUEST_LINK_COPIED'),
					autoHideDelay: 5000,
					useAirDesign: true
				});
			};
			const notifyError = () => {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CALL_VIEW_GUEST_LINK_COPY_ERROR'),
					autoHideDelay: 5000,
					useAirDesign: true
				});
			};
			call_adapter_clipboard.Clipboard.copy(this.#guestLink).then(notifyCopied).catch(notifyError);
		}
		#onCallcontrolButtonClick(e) {
			e.stopPropagation();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'callcontrol',
				node: e.target
			});
			if (this.ahaMomentNotifyCallcontrol) {
				void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(CALLCONTROL_PROMO_ID);
			}
			this.clearCallcontrolPromo();
		}
		#onParticipantsButtonListClick(event) {
			if (!this.isButtonBlocked('users')) {
				this.#onUsersButtonClick(event);
				return;
			}
			if (!this.isFullScreen) {
				return;
			}
			this.setUserBlockFolded(!this.isUserBlockFolded);
		}
		#onParticipantsButtonMobileListClick() {
			this.showParticipantsMenu();
		}
		#onMobileCallMenuFloorRequestClick() {
			this.callMenu.close();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'floorRequest'
			});
		}
		#onMobileCallMenShowParticipantsClick() {
			this.callMenu.close();
			this.showParticipantsMenu();
		}
		#onMobileCallMenuCopyInviteClick() {
			this.callMenu.close();
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'share',
				node: null
			});
		}
		showRenameSlider() {
			if (!this.renameSlider) {
				this.renameSlider = new MobileSlider({
					parent: this.elements.root,
					content: this.renderRenameSlider(),
					onClose: () => this.renameSlider.destroy(),
					onDestroy: () => {
						this.renameSlider = null;
					}
				});
			}
			this.renameSlider.show();
			setTimeout(() => {
				this.elements.renameSlider.input.focus();
				this.elements.renameSlider.input.select();
			}, 400);
		}
		renderRenameSlider() {
			this.elements.renameSlider.input = main_core.Dom.create('input', {
				props: {
					className: 'bx-videocall-mobile-rename-slider-input'
				},
				attrs: {
					type: 'text',
					value: this.localUser.userModel.name
				}
			});
			this.elements.renameSlider.button = main_core.Dom.create('button', {
				props: {
					className: 'bx-videocall-mobile-rename-slider-button ui-btn ui-btn-md ui-btn-primary'
				},
				text: main_core.Loc.getMessage('IM_M_CALL_MOBILE_RENAME_CONFIRM'),
				events: {
					click: this.#onMobileUserRename.bind(this)
				}
			});
			return main_core.Dom.create('div', {
				props: {
					className: 'bx-videocall-mobile-rename-slider-wrap'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'bx-videocall-mobile-rename-slider-title'
					},
					text: main_core.Loc.getMessage('IM_M_CALL_MOBILE_MENU_CHANGE_MY_NAME')
				}), this.elements.renameSlider.input, this.elements.renameSlider.button]
			});
		}
		#onMobileUserRename(event) {
			event.stopPropagation();
			const inputValue = this.elements.renameSlider.input.value;
			const newName = inputValue.trim();
			let needToUpdate = true;
			if (newName === this.localUser.userModel.name || newName === '') {
				needToUpdate = false;
			}
			if (needToUpdate) {
				this.toggleRenameSliderInputLoader();
				this.#onUserRename(newName);
			} else {
				this.renameSlider.close();
			}
		}
		#onMobileCallMenuCancelClick() {
			this.callMenu.close();
		}
		#onLeftEarClick() {
			this.pinUser(this.getLeftUser(this.centralUser.id));
		}
		#onRightEarClick() {
			this.pinUser(this.getRightUser(this.centralUser.id));
		}
		#onLeftPageNavigatorClick(e) {
			e.stopPropagation();
			this.setCurrentPage(this.currentPage - 1);
		}
		#onRightPageNavigatorClick(e) {
			e.stopPropagation();
			this.setCurrentPage(this.currentPage + 1);
		}
		#onTopPageNavigatorClick(e) {
			e.stopPropagation();
			this.setCurrentPage(this.currentPage === 1 ? this.pagesCount : this.currentPage - 1);
		}
		#onBottomPageNavigatorClick(e) {
			e.stopPropagation();
			this.setCurrentPage(this.currentPage === this.pagesCount ? 1 : this.currentPage + 1);
		}
		setMaxWidth(maxWidth) {
			if (this.maxWidth !== maxWidth) {
				const MAX_WIDTH_SPEAKER_MODE = 650;
				if (maxWidth < MAX_WIDTH_SPEAKER_MODE && (!this.maxWidth || this.maxWidth > MAX_WIDTH_SPEAKER_MODE) && this.layout === Layouts.Centered) {
					this.setLayout(Layouts.Grid);
				}
				const animateUnsetProperty = this.maxWidth === null;
				this.maxWidth = maxWidth;
				if (this.size !== Size.Folded) {
					this.#applyMaxWidth(animateUnsetProperty);
				}
			}
		}
		removeMaxWidth() {
			this.setMaxWidth(null);
		}
		#applyMaxWidth(animateUnsetProperty) {
			const containerDimensions = this.container.getBoundingClientRect();
			if (this.maxWidth === null) {
				main_core.Dom.style(this.elements.root, 'maxWidth', `${containerDimensions.width}px`);
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
				this.elements.root.addEventListener('transitionend', () => main_core.Dom.style(this.elements.root, 'maxWidth', null), {
					once: true
				});
				return;
			}

			// Reads the inline value, which Dom.style() cannot do: without a value it returns the computed style.
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-style
			if (!this.elements.root.style.maxWidth && animateUnsetProperty) {
				main_core.Dom.style(this.elements.root, 'maxWidth', `${containerDimensions.width}px`);
			}
			setTimeout(() => {
				main_core.Dom.style(this.elements.root, 'maxWidth', `${Math.max(this.maxWidth, MIN_WIDTH)}px`);
			}, 0);
		}
		releaseLocalMedia() {
			this.localUser.releaseStream();
			if (isSameUser(this.centralUser.id, this.userId)) {
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
			// before anything is taken apart: the release the hold policy sends leaves through the event
			// emitter and lands on the microphone button on its way back, and both are gone below
			this.pushToTalkCoordinator?.stop();
			this.pushToTalkCoordinator = null;
			this.destroyed = true;
			this.closeCopilotNotify();
			this.closeCommonRecordPopups();
			// the call is over: a block the guard still holds is dropped even if no layer reported it
			this.stopRecordPopupHotKeyGuard(true);
			if (this.overflownButtonsPopup) {
				this.overflownButtonsPopup.close();
			}
			this.preferInitialWindowPlacementPictureInPicture = true;
			const needsHistoryRestore = this.focusScope?.restoreBeforeDetach(this.elements.root) ?? false;
			if (this.elements.root) {
				main_core.Dom.remove(this.elements.root);
				this.elements.root = null;
			}

			// History restore runs only after the root left the document (ALG-02).
			if (needsHistoryRestore) {
				this.focusScope?.restoreAfterDetach();
			}
			this.visible = false;
			this.clearNewLogicRules();
			main_core.Event.unbind(window, 'webkitfullscreenchange', this.#onFullScreenChangeHandler);
			main_core.Event.unbind(window, 'mozfullscreenchange', this.#onFullScreenChangeHandler);
			main_core.Event.unbind(window, 'orientationchange', this.#onOrientationChangeHandler);
			main_core.Event.unbind(window, 'keydown', this.#onKeyDownHandler);
			main_core.Event.unbind(document, 'mousemove', this.onMouseMoveHandler);
			this.#forgetCameraTracks();
			this.#forgetAudioElements();
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
			if (this.intersectionObserver) {
				this.intersectionObserver.disconnect();
				this.intersectionObserver = null;
			}
			for (const userId of Object.keys(this.users)) {
				this.users[userId].userModel.unsubscribe('changed', this.talkingService.watchTalking);
				this.users[userId].destroy();
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
			this.#resetCommonRecordState();
			this.buttons = null;
			this.eventEmitter.emit(EventName.onDestroy);
			this.eventEmitter.unsubscribeAll();
			call_core.Hardware.unsubscribe(call_core.Hardware.Events.onChangeMicrophoneMuted, this.setMuted);
			call_core.Hardware.unsubscribe(call_core.Hardware.Events.onChangeCameraOn, this.setCameraState);
			this.clearCallcontrolPromo();
			this.#callPopupQueue.destroy();
			this.pipCoordinator?.stop();
			this.pipCoordinator = null;
			this.#forgetMicrophoneCommand();
			if (this.deviceSelector) {
				this.deviceSelector.destroy();
			}
			this.focusScope?.destroy();
			this.focusScope = null;
		}
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
		setButtonPopupKind(buttonName, kind) {
			this.wrappedView.setButtonPopupKind(buttonName, kind);
		}
		setButtonCounter(buttonName, counter) {
			this.wrappedView.setButtonCounter(buttonName, counter);
		}
		blockButtons(buttons, options) {
			this.wrappedView.blockButtons(buttons, options);
		}
		unblockButtons(buttons, options) {
			this.wrappedView.unblockButtons(buttons, options);
		}
		blockAddUser() {
			this.wrappedView.blockAddUser();
		}
		unblockAddUser() {
			this.wrappedView.unblockAddUser();
		}
		blockSwitchCamera(options) {
			this.wrappedView.blockSwitchCamera(options);
		}
		unblockSwitchCamera(options) {
			this.wrappedView.unblockSwitchCamera(options);
		}
		blockSwitchMicrophone(options) {
			this.wrappedView.blockSwitchMicrophone(options);
		}
		unblockSwitchMicrophone(options) {
			this.wrappedView.unblockSwitchMicrophone(options);
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
		setAccessibleName(name, type) {
			this.wrappedView.setAccessibleName(name, type);
		}
		focusWindow(options) {
			this.wrappedView.focusWindow(options);
		}
		releaseFocusBeforeHide() {
			return this.wrappedView.releaseFocusBeforeHide();
		}
		restoreFocusAfterHide() {
			this.wrappedView.restoreFocusAfterHide();
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

		// region Call environment

		notifyConnectionLost() {
			this.wrappedView.notifyConnectionLost();
		}
		notifyBroadcastRightLost() {
			this.wrappedView.notifyBroadcastRightLost();
		}
		notifySpeechSignal(signal, speaking) {
			this.wrappedView.notifySpeechSignal(signal, speaking);
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
		showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId, options) {
			this.wrappedView.showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId, options);
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
		showCopilotNotify(callId, errorCode, notifyText) {
			this.wrappedView.showCopilotNotify(callId, errorCode, notifyText);
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

})(this.BX.Call.ViewExtension = this.BX.Call.ViewExtension || {}, BX, BX, BX.Event, BX.Main, BX.UI.Accessibility, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Call.Adapter, BX.Call, BX.Call.Feature, BX.Call.Lib, BX.Call.Lib, BX.Call.Lib.ViewContract, BX.Call.Mapping, BX.Messenger.v2.Lib, BX.UI, BX.Call.Lib, BX.UI.System);
//# sourceMappingURL=call-view.bundle.js.map
