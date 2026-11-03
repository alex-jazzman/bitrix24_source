(function() {

	'use strict';

	// seconds; a connection held open by a proxy never reaches readyState 4, and without a limit
	// neither onsuccess nor onfailure is called, so the popup would stay loading until a page reload
	const AGREEMENTS_REQUEST_TIMEOUT = 30;

	BX.namespace('BX.Landing');

	/**
	 * Constructor.
	 * @param params
	 * @constructor
	 */
	BX.Landing.Cookies = function(params)
	{
		this.storageKey = 'bxCookies-v34';
		this.storage = window.localStorage;
		this.currentStorage = this.storage;

		this.enable = params.enable === true;
		this.onlyInformation = params.onlyInformation === true;
		this.siteId = parseInt(params.siteId);
		this.availableCodes = params.availableCodes || [];
		this.idButtonOpt = params.idButtonOpt || 'bx-landing-cookies-opt';
		this.idButtonOptLink = params.idButtonOptLink || 'bx-landing-cookies-opt-link';
		this.idButtonAccept = params.idButtonAccept || 'bx-landing-cookies-accept';
		this.idAgreementPopup = params.idAgreementPopup || 'bx-landing-cookies-popup';
		this.idCookiesNotice = params.idCookiesNotice || 'bx-landing-cookies-popup-notice';
		this.idAgreementSmallPopup = params.idAgreementSmallPopup || 'bx-landing-cookies-popup-warning';
		this.classNameMainAgreement = params.classNameMainAgreement || 'bx-landing-cookies-main-agreement';
		this.classNameAnalyticAgreements = params.classNameAnalyticAgreements || 'bx-landing-cookies-system-agreements';
		this.classNameTechnicalAgreements = params.classNameTechnicalAgreements || 'bx-landing-cookies-technical-agreements';
		this.classNameOtherAgreements = params.classNameOtherAgreements || 'bx-landing-cookies-other-agreements';
		this.classNameButtonSave = params.classNameButtonSave || 'bx-landing-cookies-button-save';
		this.classNameButtonCancel = params.classNameButtonCancel || 'bx-landing-cookies-button-cancel';
		this.classNameButtonCancelSmall = params.classNameButtonCancelSmall || 'bx-landing-cookies-button-cancel-second';
		this.classNameButtonClose = params.classNameButtonClose || 'bx-landing-cookies-button-close';
		this.classNameCookiesSwitcher = params.classNameCookiesSwitcher || 'bx-landing-cookies-switcher';
		this.messages = params.messages || {};
		this.agreementAjaxPath = params.agreementAjaxPath || '/';

		this.overlay = BX.create('div', {
			attrs: {className: 'bx-landing-cookies-popup-overlay'}
		});

		this.cookiesNotice = BX(this.idCookiesNotice);
		this.cookiesNoticeHovered = false;
		this.cookiesNoticeFocused = false;
		this.cookiesNoticeDismissed = false;

		// keys of the three maps are agreement codes of the site owner: a bare object would meet
		// an inherited member on a code like __proto__ and lose the agreement without a word
		this.acceptedAgreements = Object.create(null);
		this.agreementsChckRefs = Object.create(null);
		this.agreementTitleIds = Object.create(null);
		this.focusTrap = null;
		this.announcer = null;
		this.popupTrigger = null;
		this.escapeHandler = BX.delegate(this.onPopupKeyDown, this);
		this.popupModified = false;
		this.popupInited = false;
		this.popupOpened = false;
		this.dataLoaded = false;
		this.agreementsRequestActive = false;
		this.idMainAgreementContainer = null;
		this.idAnalyticAgreementsContainer = null;
		this.idTechnicalAgreementsContainer = null;
		this.idOtherAgreementsContainer = null;
		this.idButtonSave = null;
		this.idButtonCancel = null;
		this.idButtonClose = null;
		this.idButtonSwitcher = null;

		if (!this.enable)
		{
			this.enableAllCookies();
		}
		else
		{
			// bind buttons and initialize containers
			if (BX(this.idButtonOpt) && BX(this.idAgreementPopup))
			{
				BX.bind(BX(this.idButtonOpt), 'click', BX.delegate(this.openPopup, this));
			}
			if (BX(this.idButtonOptLink) && BX(this.idAgreementPopup))
			{
				BX.bind(BX(this.idButtonOptLink), 'click', BX.delegate(this.openPopup, this));
			}
			if (BX(this.idButtonAccept))
			{
				BX.bind(BX(this.idButtonAccept), 'click', BX.delegate(this.onClickAccept, this));
			}
			if (this.cookiesNotice)
			{
				BX.bind(this.cookiesNotice, 'mouseenter', BX.delegate(this.onCookiesNoticeHover, this));
				BX.bind(this.cookiesNotice, 'mouseleave', BX.delegate(this.onCookiesNoticeUnhover, this));
				BX.bind(this.cookiesNotice, 'focus', BX.delegate(this.onCookiesNoticeFocus, this));
				BX.bind(this.cookiesNotice, 'blur', BX.delegate(this.onCookiesNoticeBlur, this));
				BX.bind(this.cookiesNotice, 'keydown', BX.delegate(this.onCookiesNoticeKeyDown, this));
				BX.bind(this.cookiesNotice, 'click', BX.delegate(this.openPopup, this));
			}
			this.actualizeFromStorage();
		}
	};

	BX.Landing.Cookies.prototype =
	{
		/**
		 * Returns all available codes in system.
		 * @return {[]}
		 */
		getAvailableHooks: function()
		{
			let codes = [];
			this.availableCodes.map(function(code)
			{
				if (!BX.util.in_array(code, codes))
				{
					codes.push(code);
				}
			});
			return codes;
		},

		/**
		 * Enables all cookies to the site (hook is off).
		 */
		enableAllCookies: function()
		{
			let hooks = this.getAvailableHooks();
			this.setStorage(hooks);

			this.hideSmallPopup();
			this.showCookiesNotice();
		},

		/**
		 * Disables all cookies to the site (hook is off).
		 */
		disableAllCookies: function()
		{
			this.setStorage([]);
		},

		/**
		 * Gets saved data from storage and actualize cookies.
		 */
		actualizeFromStorage: function()
		{
			let storage = this.getStorage(true);
			if (storage !== null)
			{
				this.showCookiesNotice();
			}
			else
			{
				this.showSmallPopup();
				this.initializeSmallPopup();
			}
			this.fireEvent(storage || []);
		},

		initializeSmallPopup: function()
		{
			if (this.idAgreementSmallPopup)
			{
				this.idButtonCancelSecond = BX(this.idAgreementSmallPopup).querySelector(
					'.' + this.classNameButtonCancelSmall
				);
			}

			if (this.idButtonCancelSecond)
			{
				BX.bind(BX(this.idButtonCancelSecond), 'click', BX.delegate(this.cancelPopup, this));
			}

		},

		/**
		 * Initializes elements in the popup.
		 */
		initializePopup: function()
		{
			if (this.popupInited)
			{
				return;
			}
			this.popupInited = true;
			if (this.classNameMainAgreement)
			{
				if (BX(this.idAgreementPopup))
				{
					this.idMainAgreementContainer = BX(this.idAgreementPopup).querySelector(
						'.' + this.classNameMainAgreement
					);
					this.idAnalyticAgreementsContainer = BX(this.idAgreementPopup).querySelector(
						'.' + this.classNameAnalyticAgreements
					);
					this.idTechnicalAgreementsContainer = BX(this.idAgreementPopup).querySelector(
						'.' + this.classNameTechnicalAgreements
					);
					this.idOtherAgreementsContainer = BX(this.idAgreementPopup).querySelector(
						'.' + this.classNameOtherAgreements
					);
					this.idButtonClose = BX(this.idAgreementPopup).querySelector(
						'.' + this.classNameButtonClose
					);
					this.idButtonSave = BX(this.idAgreementPopup).querySelector(
						'.' + this.classNameButtonSave
					);
					this.idButtonCancel = BX(this.idAgreementPopup).querySelector(
						'.' + this.classNameButtonCancel
					);
					this.idButtonSwitcher = [].slice.call(BX(this.idAgreementPopup).querySelectorAll(
						'.' + this.classNameCookiesSwitcher
					));
					this.focusTrap = this.createFocusTrap(BX(this.idAgreementPopup));
					this.announcer = this.createAnnouncer(BX(this.idAgreementPopup));
				}
				if (this.idButtonClose)
				{
					BX.bind(BX(this.idButtonClose), 'click', BX.delegate(this.onClickCloseIcon, this));
				}
				if (this.idButtonSave)
				{
					BX.bind(BX(this.idButtonSave), 'click', BX.delegate(this.savePopup, this));
				}
				if (this.idButtonCancel)
				{
					BX.bind(BX(this.idButtonCancel), 'click', BX.delegate(this.cancelPopup, this));
				}
				if (this.idButtonSwitcher)
				{
					this.idButtonSwitcher.map(function(node)
					{
						BX.bind(BX(node), 'click', this.switchAgreements.bind(this, BX.data(BX(node), 'type')));
					}.bind(this));
				}
			}
		},

		/**
		 * Creates focus trap for the popup, if ui.a11y came to the page.
		 * @param {HTMLElement} popup Popup element.
		 * @return {?BX.UI.Accessibility.FocusTrap}
		 */
		createFocusTrap: function(popup)
		{
			if (!BX.UI || !BX.UI.Accessibility || !BX.UI.Accessibility.FocusTrap)
			{
				return null;
			}

			return new BX.UI.Accessibility.FocusTrap(popup, {
				// the name of the popup has to be heard before the keyboard reaches any of the answers
				initialFocus: 'container',
				restoreFocus: false,
				isolateOutside: true
			});
		},

		/**
		 * Creates the live region of the popup, if ui.a11y came to the page. The shared region of
		 * ui.a11y lives in the body, while aria-modal takes everything outside the popup away from
		 * the screen reader, so the popup speaks through a region standing inside itself.
		 * @param {HTMLElement} popup Popup element.
		 * @return {?BX.UI.Accessibility.LiveAnnouncer}
		 */
		createAnnouncer: function(popup)
		{
			if (!BX.UI || !BX.UI.Accessibility || !BX.UI.Accessibility.LiveAnnouncer)
			{
				return null;
			}

			return new BX.UI.Accessibility.LiveAnnouncer({container: popup});
		},

		/**
		 * Keeps the keyboard inside the opened popup and listens for Esc.
		 */
		enterModalMode: function()
		{
			if (this.focusTrap)
			{
				this.focusTrap.activate();
			}
			BX.bind(document, 'keydown', this.escapeHandler);
		},

		/**
		 * Releases the keyboard when the popup is closed.
		 */
		exitModalMode: function()
		{
			BX.unbind(document, 'keydown', this.escapeHandler);
			if (this.focusTrap)
			{
				this.focusTrap.deactivate();
			}
		},

		/**
		 * Closes the popup by Esc.
		 * @param {KeyboardEvent} event Keyboard event.
		 */
		onPopupKeyDown: function(event)
		{
			if (event.key === 'Escape')
			{
				this.closePopup();
			}
		},

		/**
		 * Marks the popup as loading while its agreements are not built yet.
		 * @param {bool} flag Flag.
		 */
		setPopupBusy: function(flag)
		{
			if (!BX(this.idAgreementPopup))
			{
				return;
			}

			if (flag)
			{
				BX(this.idAgreementPopup).setAttribute('aria-busy', 'true');
			}
			else
			{
				BX(this.idAgreementPopup).removeAttribute('aria-busy');
			}
		},

		/**
		 * Reports the popup is ready to work: the loading flag falls and the readiness
		 * is announced at the same moment, when the agreements are already built.
		 * A popup already closed by the visitor reports nothing.
		 */
		markPopupReady: function()
		{
			if (!this.popupOpened)
			{
				return;
			}

			this.setPopupBusy(false);
			this.announce(this.messages.agreementsReady);
		},

		/**
		 * Reports the agreements have not come: the loading stub would stay in the popup forever,
		 * and the screen reader would hear nothing at all.
		 * A popup already closed by the visitor reports nothing.
		 */
		markPopupFailed: function()
		{
			if (!this.popupOpened)
			{
				return;
			}

			if (this.idMainAgreementContainer)
			{
				this.idMainAgreementContainer.textContent = this.messages.agreementsError || '';
			}
			this.toggleAgreementsGroups(false);
			this.setPopupBusy(false);
			this.announce(this.messages.agreementsError, 'assertive');
		},

		/**
		 * Shows or hides the agreement groups as a whole: after a failed load the popup keeps
		 * neither empty group headings nor the group switcher living in the same block,
		 * and the next attempt brings them back.
		 * @param {boolean} visible Visibility flag.
		 */
		toggleAgreementsGroups: function(visible)
		{
			[
				this.idAnalyticAgreementsContainer,
				this.idTechnicalAgreementsContainer,
				this.idOtherAgreementsContainer
			].forEach(function(container)
			{
				if (!container || !container.parentNode)
				{
					return;
				}

				if (visible)
				{
					BX.show(container.parentNode);
				}
				else
				{
					this.hideAgreementsGroup(container);
				}
			}.bind(this));
		},

		/**
		 * Hides a single agreement group with its heading and its group switcher: the only way
		 * a group leaves the popup, so the keyboard is taken out of it wherever it happens.
		 * @param {HTMLElement} container Agreements container of the group.
		 */
		hideAgreementsGroup: function(container)
		{
			if (!container || !container.parentNode)
			{
				return;
			}

			this.keepFocusInsidePopup(container.parentNode);
			BX.hide(container.parentNode);
		},

		/**
		 * Takes the keyboard out of the node before it is hidden: the group switcher is reachable
		 * while the agreements are still loading, and the focus left in a display:none node
		 * falls to the body, so the position is lost until the next Tab.
		 * @param {HTMLElement} node Node about to be hidden.
		 */
		keepFocusInsidePopup: function(node)
		{
			if (!node.contains(document.activeElement))
			{
				return;
			}

			let popup = BX(this.idAgreementPopup);
			if (popup)
			{
				this.focusNode(popup);
			}
		},

		/**
		 * Speaks the message through ui.a11y, if it came to the page.
		 * @param {string} message Message to speak.
		 * @param {string} [politeness] Politeness of the live region.
		 */
		announce: function(message, politeness)
		{
			if (!message || !this.announcer)
			{
				return;
			}

			this.announcer.announce(message, politeness || 'polite');
		},

		/**
		 * Loads agreements from backend.
		 */
		loadAgreements: function()
		{
			if (!this.idMainAgreementContainer || this.dataLoaded)
			{
				this.initCheckboxes();
				this.setPopupBusy(false);
				return;
			}

			// the popup can be closed and opened again before the answer comes:
			// the second request would build the same agreements once more
			if (this.agreementsRequestActive)
			{
				return;
			}

			this.agreementsRequestActive = true;
			this.toggleAgreementsGroups(true);
			this.idMainAgreementContainer.innerHTML = '...';

			BX.ajax({
				url: this.agreementAjaxPath + '?action=landing.api.cookies.getAgreements',
				method: 'POST',
				dataType: 'json',
				timeout: AGREEMENTS_REQUEST_TIMEOUT,
				data: {
					siteId: this.siteId
				},
				onsuccess: function(result)
				{
					this.agreementsRequestActive = false;
					if (!result.data)
					{
						this.markPopupFailed();
						return;
					}
					if (result.data['main'])
					{
						this.idMainAgreementContainer.innerHTML = result.data['main']['AGREEMENT_TEXT'];
					}
					let agreementsLoaded = false;
					if (result.data['analytic'] && this.idAnalyticAgreementsContainer)
					{
						agreementsLoaded = true;
						this.buildAgreements(
							this.idAnalyticAgreementsContainer,
							result.data['analytic']
						);
					}
					else if (this.idAnalyticAgreementsContainer)
					{
						this.hideAgreementsGroup(this.idAnalyticAgreementsContainer);
					}
					if (result.data['technical'] && this.idTechnicalAgreementsContainer)
					{
						agreementsLoaded = true;
						this.buildAgreements(
							this.idTechnicalAgreementsContainer,
							result.data['technical']
						);
					}
					else if (this.idTechnicalAgreementsContainer)
					{
						this.hideAgreementsGroup(this.idTechnicalAgreementsContainer);
					}
					if (result.data['other'] && this.idOtherAgreementsContainer)
					{
						agreementsLoaded = true;
						this.buildAgreements(
							this.idOtherAgreementsContainer,
							result.data['other']
						);
					}
					else if (this.idOtherAgreementsContainer)
					{
						this.hideAgreementsGroup(this.idOtherAgreementsContainer);
					}
					if (agreementsLoaded)
					{
						this.initCheckboxes();
					}
					this.markPopupReady();
					// last of all: BX.ajax runs this handler inside a try and turns anything thrown
					// out of it into onfailure, so a flag raised earlier would leave the popup
					// reporting a failure it can never retry
					this.dataLoaded = true;
				}.bind(this),
				onfailure: function()
				{
					this.agreementsRequestActive = false;
					this.markPopupFailed();
				}.bind(this)
			});
		},

		/**
		 * Shows settings popup.
		 */
		openPopup: function(event)
		{
			// without ui.a11y nothing is isolated outside the popup, so the notice keeps its tab
			// stop behind the overlay and opens by the keyboard a popup that is already opened
			if (this.popupOpened)
			{
				return;
			}

			this.initializePopup();
			if (BX(this.idAgreementPopup))
			{
				this.popupTrigger = event ? event.currentTarget : null;
				this.popupOpened = true;
				this.setPopupBusy(true);
				BX.show(BX(this.idAgreementPopup));
				// the overlay is isolated together with the rest of the page, so it comes before the trap
				this.showOverlay();
				this.enterModalMode();
				this.hideSmallPopup();
				this.loadAgreements();
			}
		},

		/**
		 * Closes settings popup.
		 */
		closePopup: function()
		{
			this.popupOpened = false;
			this.setPopupModified(false);
			if (BX(this.idAgreementPopup))
			{
				this.exitModalMode();
				this.hideOverlay();
				BX.hide(BX(this.idAgreementPopup));
			}
			this.hideSmallPopup();
			this.showCookiesNotice();
			this.returnFocus(this.popupTrigger);
		},

		/**
		 * Saves accepted agreements and closes popup.
		 */
		savePopup: function()
		{
			if (this.popupModified)
			{
				let agreementCodes = this.getAcceptedAgreements();
				this.setStorage(agreementCodes);
			}
			else
			{
				this.enableAllCookies();
			}

			this.closePopup();
		},

		/**
		 * Declines agreements and closes popup.
		 */
		cancelPopup: function()
		{
			if (this.popupModified)
			{
				let agreementCodes = this.currentStorage;
				this.setStorage(agreementCodes);
			}
			else
			{
				this.disableAllCookies();
			}

			this.showSmallPopup();
			this.closePopup();
		},

		/**
		 * Declines agreements and closes popup.
		 */
		onClickCloseIcon: function()
		{
			this.closePopup();
		},

		/**
		 * Accepts all cookies right in the small popup.
		 * @param {Event} event Click event.
		 */
		onClickAccept: function(event)
		{
			this.enableAllCookies();
			this.returnFocus(event ? event.currentTarget : null);
		},

		/**
		 * Moves the focus to the element which is still on the page after the answer.
		 * @param {?HTMLElement} trigger Element the user has pressed.
		 */
		returnFocus: function(trigger)
		{
			let target = this.resolveFocusTarget(trigger);
			if (target)
			{
				this.focusNode(target);
			}
		},

		/**
		 * Returns the element to focus: any closing of the popup hides the small popup as well,
		 * so the trigger is taken only while it is still visible.
		 * @param {?HTMLElement} trigger Element the user has pressed.
		 * @return {?HTMLElement}
		 */
		resolveFocusTarget: function(trigger)
		{
			if (this.isVisible(trigger))
			{
				return trigger;
			}
			if (this.isVisible(this.cookiesNotice))
			{
				return this.cookiesNotice;
			}

			// nothing of the banner is left on the page, the neighbour landmark keeps the keyboard position;
			// the site template is unknown here, so the main landmark is taken as the page gives it
			return this.resolveMainLandmark() || document.body;
		},

		/**
		 * Returns the main area of the page seen on the screen. A template may carry more than one
		 * main landmark - a hidden one next to the printed one - and a hidden landmark takes the
		 * focus nowhere, so the first visible one is the answer and not the first one in the markup.
		 * @return {?HTMLElement}
		 */
		resolveMainLandmark: function()
		{
			let selectors = ['main', '[role="main"]'];
			for (let i = 0; i < selectors.length; i++)
			{
				let landmarks = document.querySelectorAll(selectors[i]);
				for (let j = 0; j < landmarks.length; j++)
				{
					if (this.isVisible(landmarks[j]))
					{
						return landmarks[j];
					}
				}
			}

			return null;
		},

		/**
		 * Checks that the node is seen on the page: a hidden node is no focus target,
		 * whichever way it is hidden.
		 * @param {?HTMLElement} node Node to check.
		 * @return {bool}
		 */
		isVisible: function(node)
		{
			if (!node || node.getClientRects().length === 0)
			{
				return false;
			}

			return window.getComputedStyle(node).visibility === 'visible';
		},

		/**
		 * Focuses the node, making it focusable for the time it keeps the focus.
		 * @param {HTMLElement} node Node to focus.
		 */
		focusNode: function(node)
		{
			if (node.tabIndex < 0 && !node.hasAttribute('tabindex'))
			{
				let dropTabIndex = function()
				{
					BX.unbind(node, 'blur', dropTabIndex);
					node.removeAttribute('tabindex');
				};
				node.setAttribute('tabindex', '-1');
				BX.bind(node, 'blur', dropTabIndex);
			}

			node.focus({preventScroll: true});
		},

		/**
		 * Sets flag popup modified and rename buttons.
		 * @param {bool} flag Flag.
		 */
		setPopupModified: function(flag)
		{
			this.popupModified = flag;

			if (this.idButtonSave)
			{
				this.idButtonSave.textContent = this.popupModified
					? this.messages.acceptModified
					: this.messages.acceptAll;
			}
			if (this.idButtonCancel)
			{
				this.idButtonCancel.textContent = this.popupModified
					? this.messages.declineModified
					: this.messages.declineAll;
			}
		},

		/**
		 * Returns data from local storage.
		 * @package {bool} asIs If true returns original value.
		 * @return {object}
		 */
		getStorage: function(asIs)
		{
			let store = this.storage.getItem(this.storageKey);
			if (store) {
				store = JSON.parse(store);
			}
			if (asIs === true)
			{
				return store;
			}
			return store || [];
		},

		/**
		 * Saves data to local storage.
		 * @param store
		 */
		setStorage: function(store)
		{
			this.fireEvent(store);
			this.storage.setItem(this.storageKey, JSON.stringify(store));

			BX.ajax({
				url: this.agreementAjaxPath + '?action=landing.api.cookies.acceptAgreements',
				method: 'POST',
				dataType: 'json',
				data: {
					siteId: this.siteId,
					accepted: store
				}
			});
		},

		/**
		 * Fires event.
		 * @param {mixed} params Params to fire.
		 */
		fireEvent: function(params)
		{
			BX.onCustomEvent('BX.Landing.Cookies:onAccept', [params]);
		},

		/**
		 * Sets all checkboxes to the one state.
		 */
		switchAgreements: function(type)
		{
			if (!this.idButtonSwitcher)
			{
				return;
			}

			let globalSwitchersState = {};
			this.idButtonSwitcher.map(function(node)
			{
				let type = BX(node).getAttribute('data-type');
				globalSwitchersState[type] = BX(node).getAttribute('data-state') === 'true';
			});
			let setToState = globalSwitchersState[type] === true;

			for (let key in this.agreementsChckRefs)
			{
				let switcher = BX.UI.Switcher.getById(key);
				if (switcher)
				{
					let switcherType = switcher.getNode().getAttribute('data-type');
					if (switcherType === type)
					{
						switcher.check(setToState);
						this.acceptAgreement(key, setToState);
						this.syncSwitcherState(key);
					}
				}
			}

			this.actualizeAgreementsSwitcher();
			this.setPopupModified(true);
		},

		/**
		 * Actualize agreements switcher title.
		 */
		actualizeAgreementsSwitcher: function()
		{
			if (this.idButtonSwitcher)
			{
				let typesChecked = {};
				for (let key in this.agreementsChckRefs)
				{
					let switcher = BX.UI.Switcher.getById(key);
					if (switcher)
					{
						let type = switcher.getNode().getAttribute('data-type');
						if (switcher.isChecked())
						{
							typesChecked[type] = true;
						}
					}
				}
				this.idButtonSwitcher.map(function(node)
				{
					let type = BX.data(BX(node), 'type');
					if (typesChecked[type] === true)
					{
						BX(node).textContent = this.messages.switcherOff;
						BX(node).setAttribute('data-state', false);
					}
					else
					{
						BX(node).textContent = this.messages.switcherOn;
						BX(node).setAttribute('data-state', true);
					}
				}.bind(this));
			}
		},

		/**
		 * Accepts one agreement.
		 * @param {string} code Agreement code.
		 * @param {bool} flag Checked flag.
		 */
		acceptAgreement: function(code, flag)
		{
			this.acceptedAgreements[code] = flag;
		},

		/**
		 * Returns all accepted agreements.
		 * @return {[]}
		 */
		getAcceptedAgreements: function()
		{
			let codes = [];

			for (let code in this.acceptedAgreements)
			{
				if (this.acceptedAgreements[code] === true)
				{
					codes.push(code);
				}
			}

			return codes;
		},

		/**
		 * Sets checked accepted agreements.
		 */
		initCheckboxes: function()
		{
			let codesFromStorage = this.getStorage();
			this.currentStorage = this.getStorage();

			for (let key in this.agreementsChckRefs)
			{
				let switcher = BX.UI.Switcher.getById(key);
				if (switcher)
				{
					let checked = BX.util.in_array(key, codesFromStorage) ||
								switcher.getNode().getAttribute('data-type') !== 'analytic';
					switcher.check(checked);
					this.acceptAgreement(key, checked);
					this.syncSwitcherState(key);
				}
			}

			this.actualizeAgreementsSwitcher();
		},

		/**
		 * Builds agreements div.
		 * @param {HTMLElement} node Root element.
		 * @param {object} agreements Agreements data.
		 */
		buildAgreements: function(node, agreements)
		{
			let agreementsNodes = [];

			for (let key in agreements)
			{
				this.agreementsChckRefs[key] = BX.create('span', {
					attrs: {
						className: 'ui-switcher ui-switcher-size-sm',
						'data-type': agreements[key]['TYPE'],
						'data-switcher': '{"id":"' + key + '"}'
					},
					events: {
						click: function(key, event)
						{
							if (this.rejectDisabledSwitcherActivation(key, event))
							{
								return;
							}

							this.acceptAgreement(
								key,
								!BX.UI.Switcher.getById(key).isChecked()
							);
							this.setPopupModified(true);
							// the switcher toggles itself by its own click handler, bound after this one
							setTimeout(function() {
								this.syncSwitcherState(key);
								this.actualizeAgreementsSwitcher();
							}.bind(this), 0);
						}.bind(this, key),
						keydown: this.onSwitcherKeyDown.bind(this, key)
					}
				});
				agreementsNodes.push(BX.create('div', {
					attrs: {
						className: 'bx-landing-cookies-analytics-block' +
							((agreements[key]['TYPE'] !== 'analytic') ? ' bx-landing-cookies-analytics-block-disabled' : '')
					},
					children: [
						BX.create('div', {
							attrs: {className: 'bx-landing-cookies-analytics-header'},
							children: [
								BX.create('div', {
									attrs: {
										className: 'bx-landing-cookies-analytics-title',
										id: this.getAgreementTitleId(key)
									},
									html: agreements[key]['TITLE']
								}),
								this.agreementsChckRefs[key],
							]
						}),
						BX.create('div', {
							attrs: {className: 'bx-landing-cookies-analytics-content'},
							html: agreements[key]['CONTENT']
						})
					]
				}));
			}

			node.appendChild(BX.create('div', {
				children: agreementsNodes
			}));

			BX.UI.Switcher.initByClassName();

			for (let key in agreements)
			{
				this.initSwitcherSemantics(key);
			}
		},

		/**
		 * Returns the identifier of the agreement title. The code is composed by the site owner and
		 * can carry anything, so the identifier keeps only what aria-labelledby reads as one token,
		 * and the number keeps two codes differing by the dropped characters apart: without it both
		 * switchers would be named by the same heading. The same code always gets the same identifier.
		 * @param {string} code Agreement code.
		 * @return {string}
		 */
		getAgreementTitleId: function(code)
		{
			if (!this.agreementTitleIds[code])
			{
				let index = Object.keys(this.agreementTitleIds).length + 1;
				this.agreementTitleIds[code] = 'bx-landing-cookies-agreement-title-'
					+ String(code).replace(/[^A-Za-z0-9_-]/g, '-') + '-' + index;
			}

			return this.agreementTitleIds[code];
		},

		/**
		 * ui.switcher gives the control without the semantics of a switch, so the role, the state,
		 * the tab stop and the keyboard live on its node here. Called after initByClassName:
		 * the initialization does not see the attributes set before it.
		 * @param {string} code Agreement code.
		 */
		initSwitcherSemantics: function(code)
		{
			let node = this.agreementsChckRefs[code];
			if (!node)
			{
				return;
			}

			node.setAttribute('role', 'switch');
			node.setAttribute('tabindex', '0');
			node.setAttribute('aria-labelledby', this.getAgreementTitleId(code));

			if (this.isAgreementSwitcherDisabled(code))
			{
				node.setAttribute('aria-disabled', 'true');
			}

			this.syncSwitcherState(code);
		},

		/**
		 * Agreements outside the analytic type are always accepted and their block is switched off
		 * by the design, so their switcher stays reachable by Tab, but not changeable: the keyboard
		 * repeats what the pointer can do, not more.
		 * @param {string} code Agreement code.
		 * @return {boolean}
		 */
		isAgreementSwitcherDisabled: function(code)
		{
			let node = this.agreementsChckRefs[code];

			return !!node && node.getAttribute('data-type') !== 'analytic';
		},

		/**
		 * Refuses the activation of a switcher the visitor may not change.
		 *
		 * Every way of activating it ends in a click on the node: the pointer is stopped by
		 * `pointer-events` before it gets that far, but a click dispatched from the code - and
		 * that is what assistive technology sends when it activates a switch - reaches the
		 * handlers all the same. So the refusal lives on the click itself and stops the event
		 * where it is: the own handler of `ui.switcher`, bound to the same node after this one,
		 * would otherwise toggle the node and leave the visitor with an agreement they cannot
		 * give and cannot take back.
		 *
		 * @param {string} code Agreement code.
		 * @param {Event} event Click event.
		 * @return {boolean} True if the activation was refused.
		 */
		rejectDisabledSwitcherActivation: function(code, event)
		{
			if (!this.isAgreementSwitcherDisabled(code))
			{
				return false;
			}

			event.preventDefault();
			event.stopImmediatePropagation();

			return true;
		},

		/**
		 * Projects the state of the switcher onto the accessible one: the switcher itself stays
		 * the only source of truth.
		 * @param {string} code Agreement code.
		 */
		syncSwitcherState: function(code)
		{
			let node = this.agreementsChckRefs[code];
			let switcher = BX.UI.Switcher.getById(code);
			if (node && switcher)
			{
				node.setAttribute('aria-checked', switcher.isChecked() ? 'true' : 'false');
			}
		},

		/**
		 * Toggles the switcher by Space and Enter through its own click: both the switcher
		 * and the acceptance of the agreement are already bound to it. A disabled switcher
		 * refuses the activation and leaves the key to the browser, which scrolls the list
		 * of the agreements by Space as it does anywhere else.
		 * @param {string} code Agreement code.
		 * @param {KeyboardEvent} event Keyboard event.
		 */
		onSwitcherKeyDown: function(code, event)
		{
			if (event.key !== ' ' && event.key !== 'Enter')
			{
				return;
			}

			if (this.isAgreementSwitcherDisabled(code))
			{
				return;
			}

			event.preventDefault();
			event.currentTarget.click();
		},

		//Popup parts below

		/**
		 * The notice is a part of the .default template alone: a site template of its own may leave
		 * it out, and closing the settings popup goes on to return the focus after this call.
		 */
		showCookiesNotice: function()
		{
			if (this.cookiesNotice && BX(this.idAgreementSmallPopup) && !this.onlyInformation)
			{
				this.cookiesNotice.style.display = 'flex';
			}
		},

		/**
		 * Hides the text opened by the focus, leaving the focus on the icon itself (WCAG 1.4.13).
		 * The popup listens for Esc on the document, but its focus trap keeps the icon out of reach
		 * while the popup is opened, so the icon never sees the same Esc as the popup.
		 *
		 * The dismissal holds until the pointer or the keyboard comes to the icon anew: the focus
		 * stays where it is, so without the flag the very next event over the icon would open the
		 * text the visitor has just closed.
		 * @param {KeyboardEvent} event Keyboard event.
		 */
		onCookiesNoticeKeyDown: function(event)
		{
			if (event.key !== 'Escape')
			{
				return;
			}

			this.cookiesNoticeDismissed = true;
			this.actualizeCookiesNoticeText();
		},

		onCookiesNoticeHover: function()
		{
			this.cookiesNoticeHovered = true;
			this.cookiesNoticeDismissed = false;
			this.actualizeCookiesNoticeText();
		},

		onCookiesNoticeUnhover: function()
		{
			this.cookiesNoticeHovered = false;
			this.actualizeCookiesNoticeText();
		},

		/**
		 * The focus comes back onto the icon after every answer, given by the pointer as well, so
		 * the text is held for the keyboard focus alone: unfolded for a pointer it would be opening
		 * itself in front of a visitor who never asked for it. The sign is the one the ring of the
		 * icon is already drawn from.
		 */
		onCookiesNoticeFocus: function()
		{
			this.cookiesNoticeFocused = this.isKeyboardFocus(this.cookiesNotice);
			this.cookiesNoticeDismissed = false;
			this.actualizeCookiesNoticeText();
		},

		/**
		 * Tells a keyboard focus from the one a pointer or a returned focus leaves behind.
		 * A browser that does not know the selector keeps the text it used to open.
		 * @param {HTMLElement} node Focused node.
		 * @return {bool}
		 */
		isKeyboardFocus: function(node)
		{
			try
			{
				return node.matches(':focus-visible');
			}
			catch (e)
			{
				return true;
			}
		},

		onCookiesNoticeBlur: function()
		{
			this.cookiesNoticeFocused = false;
			this.actualizeCookiesNoticeText();
		},

		/**
		 * The pointer and the keyboard hold the text of the notice independently, so it is opened
		 * and folded from both of them at once and not from the last event alone: content shown on
		 * hover and on focus stays until neither of the two keeps it (WCAG 1.4.13, persistent).
		 */
		actualizeCookiesNoticeText: function()
		{
			let held = !this.cookiesNoticeDismissed && (this.cookiesNoticeHovered || this.cookiesNoticeFocused);
			if (held)
			{
				this.showCookiesNoticeText();
			}
			else
			{
				this.hideCookiesNoticeText();
			}
		},

		/**
		 * The width grows from the current one, and the pointer and the keyboard open the notice
		 * independently: an already opened notice is left as it is instead of growing twice.
		 */
		showCookiesNoticeText: function()
		{
			if (this.isCookiesNoticeTextShown())
			{
				return;
			}

			this.cookiesNotice.classList.add('bx-landing-cookies-popup-notice-full');
			let textWidth = this.cookiesNotice.querySelector('.bx-landing-cookies-popup-notice-text').offsetWidth;
			this.cookiesNotice.style.width = this.cookiesNotice.offsetWidth + textWidth + 'px';
		},

		hideCookiesNoticeText: function()
		{
			if (!this.isCookiesNoticeTextShown())
			{
				return;
			}

			this.cookiesNotice.style.width = '27px';
			this.cookiesNotice.classList.remove('bx-landing-cookies-popup-notice-full');
		},

		isCookiesNoticeTextShown: function()
		{
			return this.cookiesNotice.classList.contains('bx-landing-cookies-popup-notice-full');
		},

		showOverlay: function()
		{
			document.body.append(this.overlay);
		},

		hideOverlay: function()
		{
			this.overlay.remove();
		},

		showSmallPopup: function()
		{
			if (BX(this.idAgreementSmallPopup))
			{
				BX(this.idAgreementSmallPopup).style.display = 'block';
			}
		},

		hideSmallPopup: function()
		{
			if (BX(this.idAgreementSmallPopup))
			{
				BX(this.idAgreementSmallPopup).style.display = 'none';
			}
		}
	};

})();
