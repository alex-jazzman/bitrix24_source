/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, main_core, ui_designTokens, main_popup, main_core_events, ui_dialogs_messagebox, ui_iconSet_api_core, ui_iconSet_outline, ui_iconSet_solid, ui_notification, ui_buttons, landing_metrika) {
	'use strict';

	class EditableTitle {
		constructor(options) {
			this.title = options.title;
			this.phone = options.phone;
			this.type = options.type;
			this.item = options.item;
			this.url = options.url;
			this.disabled = options.disabled || false;
			this.isEditMode = false;
			this.$container = null;
			this.$containerInput = null;
			this.$containerTitle = null;
			this.$containerEditIcon = null;
			this.adjustCloseEditByClick = this.adjustCloseEditByClick.bind(this);
			this.adjustCloseEditByKeyDown = this.adjustCloseEditByKeyDown.bind(this);
		}
		static get getTitle() {
			return this.title;
		}
		getContainerEdit() {
			if (!this.$containerEditIcon) {
				const iconColor = this.type === 'url' ? 'var(--ui-color-design-outline-a1-content)' : 'var(--ui-color-base-80)';
				const iconEdit = new ui_iconSet_api_core.Icon({
					icon: ui_iconSet_api_core.Outline.EDIT_M,
					color: iconColor,
					size: 18
				});
				this.$containerEditIcon = iconEdit.render();
				this.$containerEditIcon.classList.add('landing-sites__title-edit');
				// Event.bind(this.$containerEditIcon, 'click', this.adjustEditMode.bind(this));
			}
			return this.$containerEditIcon;
		}
		adjustEditMode() {
			this.isEditMode ? this.closeEdit() : this.openEdit();
		}
		openEdit() {
			this.isEditMode = true;
			this.getContainer().classList.add('--edit');
			this.getContainerInput().select();
			this.getContainerInput().focus();
			this.getContainerInput().value = this.title;
			main_core.Event.bind(document.body, 'click', this.adjustCloseEditByClick);
			main_core.Event.bind(document.body, 'keydown', this.adjustCloseEditByKeyDown);
		}
		adjustCloseEditByClick(ev) {
			if (ev.type !== 'click') {
				return;
			}
			if (ev.target !== this.getContainerInput() && ev.target !== this.$containerEditIcon) {
				this.closeEdit();
			}
		}
		adjustCloseEditByKeyDown(ev) {
			if (ev.type !== 'keydown') {
				return;
			}
			if (ev.keyCode === 27)
				// close by Escape
				{
					this.closeEdit();
					return;
				}
			if (ev.keyCode === 13)
				// close by Enter
				{
					this.closeEdit();
					this.updateTitle(this.getContainerInput().value);
				}
		}
		closeEdit() {
			this.isEditMode = false;
			this.getContainer().classList.remove('--edit');
			main_core.Event.unbind(document.body, 'click', this.adjustCloseEditByClick);
			main_core.Event.unbind(document.body, 'keydown', this.adjustCloseEditByKeyDown);
		}
		updateTitle(title) {
			if (this.getContainerInput().value !== this.getContainerTitle().innerText && this.getContainerInput().value !== '') {
				this.title = title;
				this.getContainerTitle().innerText = title;
				let type = this.type[0].toUpperCase() + this.type.slice(1);
				main_core_events.EventEmitter.emit('BX.Landing.SiteTile:update' + type, {
					item: this.item,
					title: this.title
				});
			}
		}
		getContainerInput() {
			if (!this.$containerInput) {
				this.$containerInput = main_core.Tag.render`<input
				value="${main_core.Text.encode(this.title)}"
				type="text"
				class="landing-sites__title-input">
			`;
			}
			return this.$containerInput;
		}
		getContainerTitle() {
			if (!this.$containerTitle) {
				let value;
				if (this.phone) {
					value = this.phone;
				}
				if (this.title) {
					value = this.title;
				}
				this.$containerTitle = main_core.Tag.render`
				<div class="landing-sites__title-text --sub">
					${main_core.Text.encode(value)}
				</div>`;
			}
			return this.$containerTitle;
		}
		getContainer() {
			if (!this.$container) {
				if (this.disabled) {
					this.$container = main_core.Tag.render`
					<span class="landing-sites__title">
						${this.getContainerTitle()}
					</span>
				`;
				} else {
					this.$container = main_core.Tag.render`
					<span class="landing-sites__title">
						${this.getContainerInput()}
						<a href="${this.url}" class="landing-sites__title-link">
							${this.getContainerTitle()}
							${this.getContainerEdit()}
						</a>
					</span>
				`;
				}
			}
			return this.$container;
		}
	}

	let extensionPromise = null;
	const loadA11y = () => {
		if (!extensionPromise) {
			extensionPromise = main_core.Runtime.loadExtension('ui.a11y').catch(error => {
				extensionPromise = null;
				throw error;
			});
		}
		return extensionPromise;
	};
	const A11y = {
		load() {
			return loadA11y();
		},
		createFocusTrap(container, options = {}) {
			if (!container) {
				return Promise.resolve(null);
			}
			return loadA11y().then(({
				FocusTrap
			}) => new FocusTrap(container, options));
		},
		announce(message, politeness = 'polite') {
			if (!message) {
				return Promise.resolve();
			}
			return loadA11y().then(({
				LiveAnnouncer
			}) => {
				LiveAnnouncer.announce(message, politeness);
			}).catch(() => {});
		},
		setHidden(container, hidden) {
			if (!container) {
				return;
			}
			container.setAttribute('aria-hidden', hidden ? 'true' : 'false');
			if (hidden) {
				container.setAttribute('inert', '');
				return;
			}
			container.removeAttribute('inert');
		}
	};

	class LeaderShip {
		constructor(options) {
			this.id = options.id;
			this.item = options.item;
			this.articles = options.articles || [];
			this.$container = null;
			this.$containerClose = null;
			this.focusTrap = null;
			this.focusTrapPromise = null;
			this.isShown = false;
			this.adjustCloseEditByClick = this.adjustCloseEditByClick.bind(this);
			this.adjustCloseEditByKeyDown = this.adjustCloseEditByKeyDown.bind(this);
		}
		show() {
			this.isShown = true;
			A11y.setHidden(this.getContainer(), false);
			this.getContainer().classList.add('--show');
			this.activateFocusTrap();
			main_core.Event.bind(document.body, 'click', this.adjustCloseEditByClick);
			main_core.Event.bind(document.body, 'keydown', this.adjustCloseEditByKeyDown);
			main_core_events.EventEmitter.emit('BX.Landing.SiteTile:showLeadership', this.item);
		}
		hide() {
			this.isShown = false;
			this.deactivateFocusTrap();
			A11y.setHidden(this.getContainer(), true);
			this.getContainer().classList.remove('--show');
			main_core.Event.unbind(document.body, 'click', this.adjustCloseEditByClick);
			main_core.Event.unbind(document.body, 'keydown', this.adjustCloseEditByKeyDown);
			main_core_events.EventEmitter.emit('BX.Landing.SiteTile:hideLeadership', this.item);
		}
		activateFocusTrap() {
			if (this.focusTrap) {
				this.focusTrap.activate({
					initialFocus: true
				});
				return;
			}
			if (!this.focusTrapPromise) {
				this.focusTrapPromise = A11y.createFocusTrap(this.getContainer(), {
					initialFocus: 'first-tabbable',
					restoreFocus: true,
					isolateOutside: true
				});
			}
			this.focusTrapPromise.then(focusTrap => {
				this.focusTrap = focusTrap;
				if (this.isShown && this.focusTrap) {
					this.focusTrap.activate({
						initialFocus: true
					});
				}
			}).catch(() => {});
		}
		deactivateFocusTrap() {
			this.focusTrap?.deactivate();
		}
		adjustCloseEditByClick(ev) {
			if (ev.type !== 'click') {
				return;
			}
			if (!ev.target.closest('.landing-sites__helper-' + this.id) && !ev.target.closest('.landing-sites__preview-leadership-text')) {
				this.hide();
			}
		}
		adjustCloseEditByKeyDown(ev) {
			if (ev.type !== 'keydown') {
				return;
			}
			if (ev.keyCode === 27)
				// close by Escape
				{
					this.hide();
				}
		}
		getContainerClose() {
			if (!this.$containerClose) {
				this.$containerClose = main_core.Tag.render`
				<button type="button" class="landing-sites__helper-close-toggler">
					${main_core.Loc.getMessage('LANDING_SITE_TILE_HIDE')}
				</button>
			`;
				main_core.Event.bind(this.$containerClose, 'click', this.hide.bind(this));
			}
			return this.$containerClose;
		}
		getContainer() {
			if (!this.$container) {
				let articlesNode = main_core.Tag.render`<div class="landing-sites__helper-list"></div>`;
				for (let i = 0; i < this.articles.length; i++) {
					let item = this.articles[i];
					articlesNode.appendChild(main_core.Tag.render`
					<div class="landing-sites__helper-item ${item.read ? '--read' : ''}">
						<div class="landing-sites__helper-item-title">${item.title}</div>
						<div class="landing-sites__helper-item-container">
							<div class="landing-sites__helper-item-text">${item.text}</div>
							<div class="landing-sites__helper-item-button ${item.read ? '--read' : ''}"">
								${item.read ? main_core.Loc.getMessage('LANDING_SITE_TILE_READ') : main_core.Loc.getMessage('LANDING_SITE_TILE_TO_READ')}
							</div>
						</div>
					</div>
				`);
				}
				const titleId = `landing-sites__helper-title-${this.id}`;
				this.$container = main_core.Tag.render`
				<div
					class="landing-sites__helper landing-sites__helper-${this.id}"
					role="dialog"
					aria-modal="true"
					aria-labelledby="${titleId}"
					aria-hidden="true"
					inert
				>
					<div class="landing-sites__helper-title">
						<div id="${titleId}" class="landing-sites__helper-title-text">
							${main_core.Loc.getMessage('LANDING_SITE_TILE_LEADERSHIP_TITLE')}
						</div>
						${this.getContainerClose()}
					</div>
					<div class="landing-sites__helper-container">
						${articlesNode}
					</div>
				</div>
			`;
			}
			return this.$container;
		}
	}

	class PopupHelper {
		constructor(options) {
			this.id = options.id;
			this.url = options.url;
			this.itemObj = options.itemObj;
			this.fullUrl = options.fullUrl;
			this.ordersUrl = options.ordersUrl;
			this.indexEditUrl = options.indexEditUrl;
			this.notPublishedText = options.notPublishedText;
			this.qr = null;
			this.$container = null;
			this.$containerClose = null;
			this.$containerFirstStep = null;
			this.$containerSecondStep = null;
			this.$containerQr = null;
			this.$containerQrimage = null;
			this.$containerInputUrl = null;
			this.$containerCopyLink = null;
			this.$containerTestOrder = null;
			this.focusTrap = null;
			this.focusTrapPromise = null;
			this.isShown = false;
			this.adjustCloseEditByClick = this.adjustCloseEditByClick.bind(this);
			this.adjustCloseEditByKeyDown = this.adjustCloseEditByKeyDown.bind(this);
		}
		hide() {
			this.isShown = false;
			this.deactivateFocusTrap();
			A11y.setHidden(this.getContainer(), true);
			this.getContainer().classList.remove('--show');
			main_core.Event.unbind(document.body, 'click', this.adjustCloseEditByClick);
			main_core.Event.unbind(document.body, 'keydown', this.adjustCloseEditByKeyDown);
			main_core_events.EventEmitter.emit(this, 'BX.Landing.SiteTile.Popup:onHide', this);
		}
		show(param) {
			this.isShown = true;
			A11y.setHidden(this.getContainer(), false);
			this.getContainer().classList.add('--show');
			if (param === 'link') {
				this.getContainerFirstStep().style.display = 'none';
				this.getContainerSecondStep().style.display = 'none';
				this.getContainerNotPublished().style.display = 'none';
				this.getContainerQr().style.display = null;
			} else if (param === 'notPublished') {
				this.getContainerFirstStep().style.display = 'none';
				this.getContainerSecondStep().style.display = 'none';
				this.getContainerQr().style.display = 'none';
				this.getContainerNotPublished().style.display = null;
			} else {
				this.getContainerQr().style.display = 'none';
				this.getContainerNotPublished().style.display = 'none';
				this.getContainerFirstStep().style.display = null;
				this.getContainerSecondStep().style.display = null;
			}
			this.syncContainersVisibility(param);
			this.activateFocusTrap();
			main_core.Event.bind(document.body, 'click', this.adjustCloseEditByClick);
			main_core.Event.bind(document.body, 'keydown', this.adjustCloseEditByKeyDown);
			main_core_events.EventEmitter.emit(this, 'BX.Landing.SiteTile.Popup:onShow', this);
		}
		syncContainersVisibility(param) {
			const isQr = param === 'link';
			const isNotPublished = param === 'notPublished';
			const isFirstStep = !isQr && !isNotPublished && !this.getContainerFirstStep().classList.contains('--hide-right');
			const isSecondStep = !isQr && !isNotPublished && !this.getContainerSecondStep().classList.contains('--hide-left');
			A11y.setHidden(this.getContainerQr(), !isQr);
			A11y.setHidden(this.getContainerNotPublished(), !isNotPublished);
			A11y.setHidden(this.getContainerFirstStep(), !isFirstStep);
			A11y.setHidden(this.getContainerSecondStep(), !isSecondStep);
			this.syncDialogLabel(param);
		}
		syncDialogLabel(param) {
			if (param === 'link') {
				const label = this.indexEditUrl.startsWith('/shop/') ? main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_SHOP') : main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_SITE');
				this.getContainer().setAttribute('aria-label', label);
				return;
			}
			if (param === 'notPublished') {
				this.getContainer().setAttribute('aria-label', this.notPublishedText ? this.notPublishedText.title : main_core.Loc.getMessage('LANDING_SITE_TILE_NOT_PUBLISHED_TITLE'));
				return;
			}
			const label = this.getContainerFirstStep().classList.contains('--hide-right') ? main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER') : main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_CREATE_TEST_ORDER');
			this.getContainer().setAttribute('aria-label', label);
		}
		activateFocusTrap() {
			if (this.focusTrap) {
				this.focusTrap.activate({
					initialFocus: true
				});
				return;
			}
			if (!this.focusTrapPromise) {
				this.focusTrapPromise = A11y.createFocusTrap(this.getContainer(), {
					initialFocus: 'first-tabbable',
					restoreFocus: true,
					isolateOutside: true
				});
			}
			this.focusTrapPromise.then(focusTrap => {
				this.focusTrap = focusTrap;
				if (this.isShown && this.focusTrap) {
					this.focusTrap.activate({
						initialFocus: true
					});
				}
			}).catch(() => {});
		}
		deactivateFocusTrap() {
			this.focusTrap?.deactivate();
		}
		adjustCloseEditByClick(ev) {
			if (ev.type !== 'click') {
				return;
			}
			if (ev.target.closest('.landing-sites__popup') || ev.target.closest('.landing-sites__container-link-' + this.id) || ev.target.closest('.landing-sites__status-' + this.id)) {
				return;
			}
			this.hide();
		}
		adjustCloseEditByKeyDown(ev) {
			if (ev.type !== 'keydown') {
				return;
			}
			if (ev.keyCode === 27)
				// close by Escape
				{
					this.hide();
				}
		}
		showSecondStep() {
			this.getContainerFirstStep().classList.add('--hide-right');
			this.getContainerSecondStep().classList.remove('--hide-left');
			this.syncContainersVisibility();
			this.getContainerSecondStep().querySelector('.landing-sites__popup-prev')?.focus({
				preventScroll: true
			});
		}
		showFirstStep() {
			this.getContainerFirstStep().classList.remove('--hide-right');
			this.getContainerSecondStep().classList.add('--hide-left');
			this.syncContainersVisibility();
			this.getContainerTestOrder().focus({
				preventScroll: true
			});
		}
		getContainerInputUrl() {
			if (!this.$containerInputUrl) {
				this.$containerInputUrl = main_core.Tag.render`
				<input
					type="text"
					style="position: absolute; left: 0; top: 0; width: 1px; height: 1px; padding: 0; border: 0; opacity: 0; pointer-events: none"
					value="${this.fullUrl}">
			`;
			}
			return this.$containerInputUrl;
		}
		getContainerCopyLink() {
			if (!this.$containerCopyLink) {
				this.$containerCopyLink = main_core.Tag.render`
				<button type="button" class="landing-sites__popup-copy">
					${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_COPY_LINK')}
				</button>
			`;
				main_core.Event.bind(this.$containerCopyLink, 'click', () => {
					this.getContainerInputUrl().select();
					let isCopied = false;
					try {
						isCopied = document.execCommand('copy');
					} catch (error) {
						isCopied = false;
					}
					if (isCopied) {
						BX.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_COPY_LINK_COMPLETE'),
							autoHideDelay: 2000
						});
						A11y.announce(main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_COPY_LINK_COMPLETE'));
						return;
					}
					A11y.announce(main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_COPY_LINK_ERROR'), 'assertive');
				});
			}
			return this.$containerCopyLink;
		}
		getContainerQrImage() {
			let node = main_core.Tag.render`
			<div class="landing-sites__popup-image"></div>
		`;
			new QRCode(node, {
				text: this.fullUrl,
				width: 250,
				height: 250
			});
			return node;
		}
		getContainerQr() {
			if (!this.$containerQr) {
				let closeIcon = main_core.Tag.render`
				<button
					type="button"
					class="landing-sites__popup-close"
					aria-label="${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_CLOSE')}"
				></button>
			`;
				main_core.Event.bind(closeIcon, 'click', this.hide.bind(this));
				const isShop = this.indexEditUrl.startsWith('/shop/');
				const popupText = isShop ? main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER_ACTION_3') : main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_SITE_TEXT');
				const popupButtonText = isShop ? main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_SHOP') : main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_SITE');
				this.$containerQr = main_core.Tag.render`
				<div class="landing-sites__popup-container --qr">
					${closeIcon}
					<div class="landing-sites__popup-wrapper">
						<div class="landing-sites__popup-content">
							<div class="landing-sites__popup-text">
								${popupText}
							</div>
							${this.getContainerQrImage()}
							<div class="landing-sites__popup-buttons">
								<a href="${this.fullUrl}" target="_blank" class="ui-btn ui-btn-light-border ui-btn-round">
									${popupButtonText}
								</a>
							</div>
						</div>
						<div class="landing-sites__popup-bottom">
							<a href="${this.fullUrl}" target="_blank" class="landing-sites__popup-url">
								${this.url}
								${this.getContainerInputUrl()}
							</a>
							${this.getContainerCopyLink()}
						</div>
					</div>
				</div>
			`;
			}
			return this.$containerQr;
		}
		getContainerTestOrder() {
			if (!this.$containerTestOrder) {
				this.$containerTestOrder = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-success ui-btn-round">
					${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_CREATE_TEST_ORDER')}
				</button>
			`;
				main_core.Event.bind(this.$containerTestOrder, 'click', this.showSecondStep.bind(this));
			}
			return this.$containerTestOrder;
		}
		getContainerFirstStep() {
			if (!this.$containerFirstStep) {
				let closeIcon = main_core.Tag.render`
				<button
					type="button"
					class="landing-sites__popup-close"
					aria-label="${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_CLOSE')}"
				></button>
			`;
				main_core.Event.bind(closeIcon, 'click', this.hide.bind(this));
				this.$containerFirstStep = main_core.Tag.render`
				<div class="landing-sites__popup-container">
					${closeIcon}
					<div class="landing-sites__popup-wrapper">
						<div class="landing-sites__popup-title">
							<span class="landing-sites__popup-title-text">
								${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_CREATE_TEST_ORDER')}
							</span>
						</div>
						<div class="landing-sites__popup-content">
							<div class="landing-sites__popup-text">
								${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER_TEXT')}
							</div>
							<div class="landing-sites__popup-image --first-order"></div>
							<div class="landing-sites__popup-buttons">
								${this.getContainerTestOrder()}
								<a href="${this.ordersUrl}" class="ui-btn ui-btn-light-border ui-btn-round">
									${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_CRM')}
								</a>
							</div>
						</div>
					</div>
				</div>
			`;
			}
			return this.$containerFirstStep;
		}
		getContainerSecondStep() {
			if (!this.$containerSecondStep) {
				let closeIcon = main_core.Tag.render`
				<button
					type="button"
					class="landing-sites__popup-close"
					aria-label="${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_CLOSE')}"
				></button>
			`;
				let prevIcon = main_core.Tag.render`
				<button
					type="button"
					class="landing-sites__popup-prev"
					aria-label="${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_BACK')}"
				></button>
			`;
				main_core.Event.bind(closeIcon, 'click', this.hide.bind(this));
				main_core.Event.bind(prevIcon, 'click', this.showFirstStep.bind(this));
				this.$containerSecondStep = main_core.Tag.render`
				<div class="landing-sites__popup-container --hide-left">
					${closeIcon}
					${prevIcon}
					<div class="landing-sites__popup-wrapper">
						<div class="landing-sites__popup-title">
							<span class="landing-sites__popup-title-text">${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER')}</span>
						</div>
						<div class="landing-sites__popup-content">
							<div class="landing-sites__popup-text">
								<div class="landing-sites__popup-text --list"><span>1</span> ${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER_ACTION_1')}</div>
								<div class="landing-sites__popup-text --list"><span>2</span> ${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER_ACTION_2')}</div>
							</div>
							${this.getContainerQrImage()}
							<div class="landing-sites__popup-buttons">
								<a href="${this.ordersUrl}" class="ui-btn ui-btn-success ui-btn-round">
									${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_CRM')}
								</a>
							</div>
						</div>
					</div>
				</div>
			`;
			}
			return this.$containerSecondStep;
		}
		getContainerNotPublished() {
			if (!this.$containerNotPublished) {
				const closeIcon = main_core.Tag.render`
				<button
					type="button"
					class="landing-sites__popup-close"
					aria-label="${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_CLOSE')}"
				></button>
			`;
				main_core.Event.bind(closeIcon, 'click', this.hide.bind(this));
				let buttPublish = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-success ui-btn-round">
					${main_core.Loc.getMessage('LANDING_SITE_TILE_NOT_PUBLISHED_BUTTON_PUBLISH')}
				</button>
			`;
				if (this.itemObj.access.publication === false && this.itemObj.error.publication) {
					const code = this.itemObj.error.publication.code || '';
					const hint = this.itemObj.error.publication.hint || '';
					const url = this.itemObj.error.publication.url || '';
					const link = this.itemObj.error.publication.link || '';
					if (code === 'shop1c') {
						buttPublish = main_core.Tag.render`
					<button 
						type="button"
						class="ui-btn ui-btn-success ui-btn-round ui-btn-disabled ui-btn-icon-lock"
						aria-disabled="true"
						data-hint="${hint}<br><a href='${url}'>${link}</a>"
						data-hint-no-icon
						data-hint-html
						data-hint-interactivity
					>
						${main_core.Loc.getMessage('LANDING_SITE_TILE_NOT_PUBLISHED_BUTTON_PUBLISH')}
					</button>
				`;
					}
				}
				if (buttPublish.getAttribute('aria-disabled') !== 'true') {
					main_core.Event.bind(buttPublish, 'click', () => {
						this.itemObj.markUserPublicationAction();
						main_core_events.EventEmitter.emit('BX.Landing.SiteTile:publish', this.itemObj);
						this.hide();
					});
				}
				const buttOpen = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-light-border ui-btn-round">
					${main_core.Loc.getMessage('LANDING_SITE_TILE_NOT_PUBLISHED_BUTTON_OPEN')}
				</button>
			`;
				main_core.Event.bind(buttOpen, 'click', () => {
					if (this.indexEditUrl) {
						main_core.Dom.addClass(buttOpen, 'ui-btn-wait');
						window.location.href = this.indexEditUrl;
					}
				});
				this.$containerNotPublished = main_core.Tag.render`
				<div class="landing-sites__popup-container --not-published" aria-hidden="true" inert>
					${closeIcon}
					<div class="landing-sites__popup-wrapper">
						<div class="landing-sites__popup-title">
							<span class="landing-sites__popup-title-text">
								${this.notPublishedText ? this.notPublishedText.title : 'title'}
							</span>
						</div>
						<div class="landing-sites__popup-content">
							<div class="landing-sites__popup-text">
								${this.notPublishedText ? this.notPublishedText.message : 'message'}
							</div>
							<div class="landing-sites__popup-buttons">
								${buttPublish}
								${buttOpen}
							</div>
						</div>
					</div>
				</div>
			`;
			}
			return this.$containerNotPublished;
		}
		getContainer() {
			if (!this.$container) {
				this.$container = main_core.Tag.render`
				<div
					class="landing-sites__popup"
					role="dialog"
					aria-modal="true"
					aria-label="${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_CREATE_TEST_ORDER')}"
					aria-hidden="true"
					inert
				>
					${this.getContainerFirstStep()}
					${this.getContainerSecondStep()}
					${this.getContainerQr()}
					${this.getContainerNotPublished()}
				</div>
			`;
			}
			return this.$container;
		}
	}

	class Item {
		constructor(options) {
			this.id = options.id;
			this.grid = options.grid;
			this.title = options.title;
			this.url = options.url;
			this.fullUrl = options.fullUrl;
			this.domainProvider = options.domainProvider;
			this.pagesUrl = options.pagesUrl;
			this.ordersUrl = options.ordersUrl;
			this.domainUrl = options.domainUrl;
			this.contactsUrl = options.contactsUrl;
			this.indexEditUrl = options.indexEditUrl;
			this.ordersCount = options.ordersCount;
			this.phone = options.phone;
			this.preview = options.preview;
			this.cloudPreview = options.cloudPreview;
			this.published = options.published;
			this.deleted = options.deleted;
			this.domainStatus = options.domainStatus;
			this.domainStatusMessage = options.domainStatusMessage;
			this.menuItems = options.menuItems || [];
			this.menuBottomItems = options.menuBottomItems || [];
			this.notPublishedText = options.notPublishedText || null;
			this.access = options.access || {};
			this.error = options.error || {};
			this.articles = options.articles || [];
			this.editableTitle = null;
			this.editableUrl = null;
			this.leadership = null;
			this.popupHelper = null;
			this.popupStatus = null;
			this.popupConfig = null;
			this.loader = null;
			this.copilotProcess = main_core.Type.isBoolean(options.copilotProcess) ? options.copilotProcess : null;
			this.isCreatedByAiScenario = options.isCreatedByAiScenario === true;
			this.createByCopilotText = options.createByCopilotText ?? '';
			this.copilotGeneratedText = options.copilotGeneratedText ?? '';
			this.shouldAnnouncePublication = false;
			this.$container = null;
			this.$containerWrapper = null;
			this.$containerPreviewImage = null;
			this.$containerPreviewStatus = null;
			this.$containerPreviewShowPages = null;
			this.$containerPreviewInstruction = null;
			this.$containerPreviewInstructionButton = null;
			this.$containerInfo = null;
			this.$containerPhone = null;
			this.$containerTitle = null;
			this.$containerDomain = null;
			this.$containerDomainLink = null;
			this.$containerDomainStatus = null;
			this.$containerDomainStatusIcon = null;
			this.$containerDomainStatusTitle = null;
			this.$containerDomainStatusMessage = null;
			this.$containerSiteStatus = null;
			this.$containerSiteStatusRound = null;
			this.$containerSiteStatusTitle = null;
			this.$containerSiteMore = null;
			this.$containerLinks = null;
			this.bindEvents();
			this.lazyLoadCloudPreview = this.lazyLoadCloudPreview.bind(this);
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('BX.Landing.SiteTile:showLeadership', options => {
				if (this === options.data) {
					this.active();
					this.setContainerPosition();
					this.getContainerPreviewInstructionButton()?.setAttribute('aria-expanded', 'true');
				}
				if (this !== options.data) {
					this.fade();
				}
			});
			main_core_events.EventEmitter.subscribe('BX.Landing.SiteTile:hideLeadership', options => {
				if (this === options.data) {
					this.unActive();
					this.unSetContainerPosition();
					this.getContainerPreviewInstructionButton()?.setAttribute('aria-expanded', 'false');
				}
				this.unFade();
			});
			main_core_events.EventEmitter.subscribe(this.getPopupHelper(), 'BX.Landing.SiteTile.Popup:onShow', () => {
				this.getContainerWrapper().classList.add('--fade');
				this.getContainerDomainLink().setAttribute('aria-expanded', 'true');
			});
			main_core_events.EventEmitter.subscribe(this.getPopupHelper(), 'BX.Landing.SiteTile.Popup:onHide', () => {
				this.getContainerWrapper().classList.remove('--fade');
				this.getContainerDomainLink().setAttribute('aria-expanded', 'false');
			});

			// close open dialogs while still attached so their focus trap releases inert before the grid is replaced
			main_core_events.EventEmitter.subscribe('BX.Landing.SiteTile:beforeGridRefresh', () => {
				if (this.popupHelper?.isShown) {
					this.popupHelper.hide();
				}
				if (this.leadership?.isShown) {
					this.leadership.hide();
				}
			});
		}
		setContainerPosition() {
			let offsetRight = window.innerWidth - this.getContainer().getBoundingClientRect().right;
			let leaderShipWidth = this.getLeadership().getContainer().offsetWidth;
			let previousItem = this.getContainer().previousSibling;
			if (offsetRight > leaderShipWidth) {
				return;
			}
			this.getContainer().style.transform = 'translateX(-' + (leaderShipWidth + 40 - offsetRight) + 'px)';
			if (previousItem && previousItem.offsetTop === this.getContainer().offsetTop) {
				previousItem.style.transform = 'translateX(-10px)';
			}
		}
		unSetContainerPosition() {
			this.getContainer().style.transform = null;
			let previousItem = this.getContainer().previousSibling;
			if (previousItem && previousItem.offsetTop === this.getContainer().offsetTop) {
				previousItem.style.transform = null;
			}
		}
		markUserPublicationAction() {
			this.shouldAnnouncePublication = true;
		}
		consumeUserPublicationAction() {
			const shouldAnnounce = this.shouldAnnouncePublication === true;
			this.shouldAnnouncePublication = false;
			return shouldAnnounce;
		}
		announcePublishedStatus(status) {
			A11y.announce(status ? main_core.Loc.getMessage('LANDING_SITE_TILE_PUBLICATION_PUBLISHED') : main_core.Loc.getMessage('LANDING_SITE_TILE_PUBLICATION_UNPUBLISHED'));
		}
		announcePublicationError(message) {
			if (!this.consumeUserPublicationAction()) {
				return;
			}
			A11y.announce(message || main_core.Loc.getMessage('LANDING_SITE_TILE_PUBLICATION_ERROR'), 'assertive');
		}
		updatePublishedStatus(status, options = {}) {
			const shouldAnnounce = options.announce === true || this.consumeUserPublicationAction();
			if (this.published === status) {
				return;
			}
			if (this.popupStatus) {
				this.popupStatus.destroy();
			}
			this.popupStatus = null;
			if (status) {
				this.published = true;
				this.getContainerSiteStatus().className = 'landing-sites__status --success';
				this.getContainerSiteStatusTitle().innerText = main_core.Loc.getMessage('LANDING_SITE_TILE_STATUS_PUBLISHED');
				this.getContainerPreviewImage().classList.remove('--not-published');
				this.getContainerPreviewStatus().classList.add('--hide');
				if (shouldAnnounce) {
					this.announcePublishedStatus(true);
				}
				return;
			}
			this.published = false;
			this.getContainerSiteStatus().className = 'landing-sites__status --alert';
			this.getContainerSiteStatusTitle().innerText = main_core.Loc.getMessage('LANDING_SITE_TILE_STATUS_NOT_PUBLISHED');
			this.getContainerPreviewImage().classList.add('--not-published');
			this.getContainerPreviewStatus().classList.remove('--hide');
			if (shouldAnnounce) {
				this.announcePublishedStatus(false);
			}
		}
		updateTitle(param) {
			if (param) {
				this.title = param;
			}
		}
		updateUrl(param) {
			if (param) {
				this.url = param;
			}
		}
		getContainerTitle() {
			if (!this.$containerTitle) {
				const iconEdit = new ui_iconSet_api_core.Icon({
					icon: ui_iconSet_api_core.Outline.EDIT_M,
					color: 'var(--ui-color-base-70)',
					size: 21
				});
				const iconEditNode = iconEdit.render();
				iconEditNode.classList.add('landing-sites__title-edit');
				this.$containerTitle = main_core.Tag.render`
				<div class="landing-sites__title">
					<div class="landing-sites__title-text">${this.title}</div>
					${iconEditNode}
				</div>
			`;
			}
			return this.$containerTitle;
		}
		mergeMenuItems(items) {
			const addMenu = [{
				text: this.deleted ? main_core.Loc.getMessage('LANDING_SITE_TILE_RESTORE') : main_core.Loc.getMessage('LANDING_SITE_TILE_REMOVE'),
				access: 'delete',
				onclick: () => {
					if (!this.deleted) {
						const messageBox = new ui_dialogs_messagebox.MessageBox({
							title: main_core.Loc.getMessage('LANDING_SITE_TILE_DELETE_ALERT_TITLE'),
							message: main_core.Loc.getMessage('LANDING_SITE_TILE_DELETE_ALERT_MESSAGE'),
							useAirDesign: true,
							buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
							onOk: () => {
								main_core_events.EventEmitter.emit('BX.Landing.SiteTile:remove', [this, messageBox]);
								messageBox.close();
							},
							popupOptions: {
								autoHide: true,
								closeByEsc: true,
								minHeight: false,
								minWidth: 260,
								maxWidth: 300,
								width: false,
								animation: 'fading-slide'
							}
						});
						messageBox.show();
					} else {
						main_core_events.EventEmitter.emit('BX.Landing.SiteTile:restore', this);
						this.getPopupConfig().close();
					}
				}
			}];
			items.map((item, i) => {
				if (item.delimiter === true) ;
				if (this.deleted) {
					item.disabled = true;
				}
			});
			addMenu.reverse().map(item => {
				items.push(item);
			});
			return items;
		}
		disableMenuItems(items) {
			items = items.map(item => {
				if (item.access && this.access[item.access] !== true) {
					item.disabled = true;
				}
				return item;
			});
			return items;
		}
		getPopupConfig() {
			if (!this.popupConfig) {
				const items = this.disableMenuItems(this.mergeMenuItems(this.menuItems));
				items.forEach(item => {
					if (item.access === 'settings' && main_core.Type.isString(item.onclick)) {
						item.onclick = item.onclick.replace('#ID#', this.id);
					}
				});
				this.popupConfig = new main_popup.Menu({
					className: 'landing-sites__status-popup',
					bindElement: this.getContainerSiteMore(),
					offsetLeft: -61,
					minWidth: 220,
					closeByEsc: true,
					autoHide: true,
					angle: {
						offset: 97
					},
					items,
					events: {
						onPopupClose: () => {
							this.getContainerSiteMore().classList.remove('--hover');
							this.getContainerSiteMore().setAttribute('aria-expanded', 'false');
						},
						onPopupShow: () => {
							this.getContainerSiteMore().classList.add('--hover');
							this.getContainerSiteMore().setAttribute('aria-expanded', 'true');
						}
					},
					animation: 'fading-slide'
				});
			}
			return this.popupConfig;
		}
		getPopupStatus() {
			if (!this.popupStatus) {
				this.popupStatus = new main_popup.Menu({
					className: 'landing-sites__status-popup',
					bindElement: this.getContainerSiteStatus(),
					minWidth: 220,
					closeByEsc: true,
					autoHide: true,
					angle: {
						offset: 97
					},
					items: [{
						text: this.published ? main_core.Loc.getMessage('LANDING_SITE_TILE_UNPUBLISH') : main_core.Loc.getMessage('LANDING_SITE_TILE_PUBLISH'),
						onclick: () => {
							this.popupStatus.close();
							this.markUserPublicationAction();
							this.published ? main_core_events.EventEmitter.emit('BX.Landing.SiteTile:unPublish', this) : main_core_events.EventEmitter.emit('BX.Landing.SiteTile:publish', this);
						}
					}],
					events: {
						onPopupClose: () => {
							this.getContainerSiteStatus().classList.remove('--hover');
							this.getContainerSiteStatus().setAttribute('aria-expanded', 'false');
						},
						onPopupShow: () => {
							this.getContainerSiteStatus().classList.add('--hover');
							this.getContainerSiteStatus().setAttribute('aria-expanded', 'true');
						}
					},
					animation: 'fading-slide'
				});
			}
			return this.popupStatus;
		}
		getContainerSiteStatus() {
			if (!this.$containerSiteStatus) {
				if (this.access.publication) {
					const status = this.published ? '--success' : '--alert';
					this.$containerSiteStatus = main_core.Tag.render`
					<button
						type="button"
						class="landing-sites__status ${status}"
						aria-haspopup="menu"
						aria-expanded="false"
						data-testid="landing-sites-item-status-btn"
					>
						${this.getContainerSiteStatusTitle()}
						<div class="landing-sites__status-arrow"></div>
					</button>
				`;
					main_core.Event.bind(this.$containerSiteStatus, 'click', ev => {
						this.getPopupStatus().layout.menuContainer.style.left = this.$containerSiteStatus.getBoundingClientRect().left + 'px';
						this.getPopupStatus().show();
						ev.stopPropagation();
					});
				} else {
					this.$containerSiteStatus = main_core.Tag.render`
					<div class="landing-sites__status_disabled">
						${this.getContainerSiteStatusRound()}
						${this.getContainerSiteStatusTitle()}
					</div>
				`;
					if (this.error.publication) {
						const code = this.error.publication.code || '';
						const hint = this.error.publication.hint || '';
						const url = this.error.publication.url || '';
						const link = this.error.publication.link || '';
						if (code === 'shop1c') {
							this.$containerSiteStatus = main_core.Tag.render`
							<div 
								class="landing-sites__status_disabled"
								data-hint="${hint}<br><a href='${url}'>${link}</a>"
								data-hint-no-icon
								data-hint-html
								data-hint-interactivity
							>
								${this.getContainerSiteStatusRound()}
								${this.getContainerSiteStatusTitle()}
							</div>
						`;
						}
					}
				}
			}
			return this.$containerSiteStatus;
		}
		getContainerSiteMore() {
			if (!this.$containerSiteMore) {
				const iconMore = new ui_iconSet_api_core.Icon({
					icon: ui_iconSet_api_core.Outline.MORE_M,
					color: 'var(--ui-color-base-70)',
					size: 21
				});
				this.$containerSiteMore = main_core.Tag.render`
				<button
					type="button"
					class="landing-sites__more"
					aria-label="${main_core.Text.encode(main_core.Loc.getMessage('LANDING_SITE_TILE_MORE_ACTIONS'))}"
					aria-haspopup="menu"
					aria-expanded="false"
					data-testid="landing-sites-item-more-btn"
				>${iconMore.render()}</button>
			`;
				main_core.Event.bind(this.$containerSiteMore, 'click', ev => {
					this.getPopupConfig().show();
					ev.stopPropagation();
				});
			}
			return this.$containerSiteMore;
		}
		getContainerSiteStatusRound() {
			if (!this.$containerSiteStatusRound) {
				this.$containerSiteStatusRound = main_core.Tag.render`<div class="landing-sites__status-round"></div>`;
			}
			return this.$containerSiteStatusRound;
		}
		getContainerSiteStatusTitle() {
			if (!this.$containerSiteStatusTitle) {
				let title = this.published ? main_core.Loc.getMessage('LANDING_SITE_TILE_STATUS_PUBLISHED') : main_core.Loc.getMessage('LANDING_SITE_TILE_STATUS_NOT_PUBLISHED');
				this.$containerSiteStatusTitle = main_core.Tag.render`<div class="landing-sites__status-title">${title}</div>`;
			}
			return this.$containerSiteStatusTitle;
		}
		publush() {
			this.published = true;
			this.getContainerSiteStatus().className = 'landing-sites__status --success';
			this.getContainerSiteStatusTitle().innerText = main_core.Loc.getMessage('LANDING_SITE_TILE_STATUS_PUBLISHED');
			this.getContainerPreviewStatus().classList.add('--hide');
		}
		unPublish() {
			this.published = false;
			this.getContainerSiteStatus().className = 'landing-sites__status --alert';
			this.getContainerSiteStatusTitle().innerText = main_core.Loc.getMessage('LANDING_SITE_TILE_STATUS_NOT_PUBLISHED');
			this.getContainerPreviewStatus().classList.remove('--hide');
		}
		getEditableTitle() {
			if (!this.editableTitle) {
				this.editableTitle = new EditableTitle({
					phone: this.phone,
					type: 'title',
					item: this,
					url: this.contactsUrl,
					disabled: !this.access.settings
				});
			}
			return this.editableTitle;
		}
		getContainerInfo() {
			if (!this.$containerInfo) {
				this.$containerInfo = main_core.Tag.render`
				<div class="landing-sites__container --white-bg">
					<div class="landing-sites__container-left">
						<div class="landing-sites__title">
							<div class="landing-sites__title-text" title="${main_core.Text.encode(this.title)}">${main_core.Text.encode(this.title)}</div>
						</div>
						${this.phone ? this.getEditableTitle().getContainer() : ''}
					</div>
					<div class="landing-sites__container-right">
						${this.getContainerSiteStatus()}
						${this.getContainerSiteMore()}
					</div>
				</div>
			`;
			}
			return this.$containerInfo;
		}
		announceDomainStatus(statusText) {
			const message = statusText || main_core.Loc.getMessage('LANDING_SITE_TILE_DOMAIN_STATUS_UPDATED_FALLBACK');
			const template = main_core.Loc.getMessage('LANDING_SITE_TILE_DOMAIN_STATUS_UPDATED') || '#STATUS#';
			A11y.announce(template.replace('#STATUS#', message));
		}
		updateDomainStatus(status, statusText, options = {}) {
			// success
			// alert
			// danger
			// clock
			const previousStatus = this.domainStatus || '';
			const previousStatusText = this.domainStatusMessage || '';
			!status ? status = '' : null;
			this.domainStatus = status;
			this.updateContainerDomainStatus();
			!statusText ? statusText = '' : null;
			this.updateDomainStatusMessage(statusText);
			if (options.announce === true && (previousStatus !== status || previousStatusText !== statusText)) {
				this.announceDomainStatus(statusText);
			}
		}
		getDomainStatusIconByStatus(status) {
			switch (status) {
				case 'alert':
				case 'danger':
					return ui_iconSet_api_core.Solid.ALERT_ACCENT;
				case 'clock':
					return ui_iconSet_api_core.Outline.CLOCK;
				case 'success':
				case 'unknow':
				default:
					return ui_iconSet_api_core.Outline.LINK;
			}
		}
		getDomainStatusIconColorByStatus(status) {
			switch (status) {
				case 'alert':
					return 'var(--ui-color-background-primary)';
				case 'danger':
					return 'var(--ui-color-background-primary)';
				case 'clock':
					return 'var(--ui-color-design-outline-a1-content)';
				case 'success':
					return 'var(--ui-color-background-primary)';
				case 'unknow':
				default:
					return 'var(--ui-color-design-outline-a1-content)';
			}
		}
		createContainerDomainStatusIcon() {
			const iconStatus = new ui_iconSet_api_core.Icon({
				icon: this.getDomainStatusIconByStatus(this.domainStatus),
				color: this.getDomainStatusIconColorByStatus(this.domainStatus),
				size: 20
			});
			const iconNode = iconStatus.render();
			iconNode.classList.add('landing-sites__container-status-icon');
			return iconNode;
		}
		updateContainerDomainStatus() {
			const statusClass = this.domainStatus ? ` --${this.domainStatus}` : '';
			const container = this.getContainerDomainStatus();
			container.className = `landing-sites__container-status${statusClass}`;
			main_core.Dom.clean(container);
			container.appendChild(this.createContainerDomainStatusIcon());
		}
		getContainerDomainStatus() {
			if (!this.$containerDomainStatus) {
				this.$containerDomainStatus = main_core.Tag.render`<div class="landing-sites__container-status"></div>`;
				this.updateContainerDomainStatus();
			}
			return this.$containerDomainStatus;
		}
		getEditableUrl() {
			if (!this.editableUrl) {
				this.editableUrl = new EditableTitle({
					title: this.url,
					type: 'url',
					item: this,
					url: this.domainUrl,
					disabled: !this.access.settings
				});
			}
			return this.editableUrl;
		}
		getContainerDomainStatusIcon() {
			if (!this.$containerDomainStatusIcon) {
				const iconQrCode = new ui_iconSet_api_core.Icon({
					icon: ui_iconSet_api_core.Outline.QR_CODE,
					color: 'var(--ui-color-design-outline-a1-content)',
					size: 20
				});
				this.$containerDomainStatusIcon = iconQrCode.render();
				this.$containerDomainStatusIcon.classList.add('landing-sites__status-icon');
				if (this.domainStatus) {
					this.$containerDomainStatusIcon.classList.add(`--${this.domainStatus}`);
				}
			}
			return this.$containerDomainStatusIcon;
		}
		getContainerDomainStatusTitle() {
			if (!this.$containerDomainStatusTitle) {
				let title = main_core.Loc.getMessage('LANDING_SITE_TILE_OPEN');
				this.$containerDomainStatusTitle = main_core.Tag.render`
				<div class="landing-sites__status-title">
					${title}
				</div>`;
			}
			return this.$containerDomainStatusTitle;
		}
		updateDomainStatusMessage(text) {
			!text ? text = '' : null;
			this.getContainerDomainStatusMessage().innerText = text;
			this.domainStatusMessage = text;
		}
		getContainerDomainStatusMessage() {
			if (!this.$containerDomainStatusMessage) {
				!this.domainStatusMessage ? this.domainStatusMessage = '' : null;
				this.$containerDomainStatusMessage = main_core.Tag.render`
				<div class="landing-sites__sub-title">${this.domainStatusMessage}</div>
			`;
			}
			return this.$containerDomainStatusMessage;
		}
		getContainerDomainLink() {
			if (!this.$containerDomainLink) {
				this.$containerDomainLink = main_core.Tag.render`
				<button
					type="button"
					class="landing-sites__status landing-sites__status-${this.id}"
					aria-label="${main_core.Text.encode(main_core.Loc.getMessage('LANDING_SITE_TILE_OPEN_SITE_LINK'))}"
					aria-haspopup="dialog"
					aria-expanded="false"
					data-testid="landing-sites-item-domain-btn"
				>
					${this.getContainerDomainStatusIcon()}
					${this.getContainerDomainStatusTitle()}
				</button>
			`;
				main_core.Event.bind(this.$containerDomainLink, 'click', () => {
					this.getPopupHelper().show(this.published ? 'link' : 'notPublished');
				});
			}
			return this.$containerDomainLink;
		}
		getContainerDomain() {
			if (!this.$containerDomain) {
				this.$containerDomain = main_core.Tag.render`
				<div class="landing-sites__container --white-bg --white-bg--alpha --domain">
					${this.getContainerDomainStatus()}
					<div class="landing-sites__container-left">
						${this.getEditableUrl().getContainer()}
						${this.getContainerDomainStatusMessage()}
					</div>
					<div class="landing-sites__container-right">
						${this.getContainerDomainLink()}
					</div>
				</div>
			`;
			}
			return this.$containerDomain;
		}
		getContainerPreviewImage() {
			if (!this.$containerPreviewImage) {
				this.$containerPreviewImage = main_core.Tag.render`<div class="landing-sites__preview-image ${this.published ? '' : '--not-published'}"></div>`;
				this.$containerPreviewImage.style.backgroundImage = 'url(' + this.preview + ')';
				this.$containerPreviewImage.style.backgroundSize = 'cover';
				if (this.published && this.cloudPreview && this.cloudPreview !== this.preview) {
					this.lazyLoadCloudPreview();
				}
				if (this.copilotProcess === false) {
					const copilotLabel = main_core.Tag.render`
					<div class="landing-sites__preview-copilot-label">
						<div class="">${this.createByCopilotText}</div>
					</div>
				`;
					this.$containerPreviewImage.appendChild(copilotLabel);
				}
			}
			return this.$containerPreviewImage;
		}
		lazyLoadCloudPreview() {
			try {
				const previewUrl = this.cloudPreview + (this.cloudPreview.indexOf('?') > 0 ? '&' : '?') + 'refreshed' + (Date.now() / 86400000 | 0);
				const xhr = new XMLHttpRequest();
				xhr.open("HEAD", previewUrl);
				xhr.onload = () => {
					const expires = xhr.getResponseHeader("expires");
					if (expires && new Date(expires) <= new Date()) {
						setTimeout(this.lazyLoadCloudPreview, 3000);
					} else {
						this.$containerPreviewImage.style.backgroundImage = 'url(' + previewUrl + ')';
					}
				};
				xhr.send();
			} catch (error) {}
		}
		getContainerPreviewStatus() {
			if (!this.$containerPreviewStatus) {
				this.$containerPreviewStatus = main_core.Tag.render`
				<div class="landing-sites__preview-status --not-published ${this.published ? '--hide' : ''}">
					<div class="landing-sites__preview-status-wrapper">
						<div class="landing-sites__preview-status-icon"></div>
						<div class="landing-sites__preview-status-text">
							${main_core.Loc.getMessage('LANDING_SITE_TILE_STATUS_NOT_PUBLISHED')}
						</div>
					</div>
				</div>
			`;
				main_core.Event.bind(this.$containerPreviewStatus, 'mouseenter', () => {
					this.$containerPreviewStatus.style.width = this.$containerPreviewStatus.firstElementChild.offsetWidth + 'px';
				});
				main_core.Event.bind(this.$containerPreviewStatus, 'mouseleave', () => {
					this.$containerPreviewStatus.style.width = null;
				});
			}
			return this.$containerPreviewStatus;
		}
		getContainerPreviewShowPages() {
			if (!this.$containerPreviewShowPages) {
				const previewShowText = this.isCreatedByAiScenario ? main_core.Loc.getMessage('LANDING_SITE_TILE_GO_TO_COMBO_MODE') || main_core.Loc.getMessage('LANDING_SITE_TILE_SHOW_PAGES') : main_core.Loc.getMessage('LANDING_SITE_TILE_SHOW_PAGES');
				this.$containerPreviewShowPages = main_core.Tag.render`
				<div class="landing-sites__preview-show">
					${previewShowText}
				</div>
			`;
			}
			return this.$containerPreviewShowPages;
		}
		getContainerPreviewInstruction() {
			if (!this.$containerPreviewInstruction) {
				this.$containerPreviewInstructionButton = main_core.Tag.render`
				<button
					type="button"
					class="landing-sites__preview-leadership-text"
					aria-haspopup="dialog"
					aria-expanded="false"
					data-testid="landing-sites-item-leadership-btn"
				>
					${main_core.Loc.getMessage('LANDING_SITE_TILE_INSTRUCTION')}
				</button>
			`;
				this.$containerPreviewInstruction = main_core.Tag.render`
				<div class="landing-sites__preview-leadership">
					${this.$containerPreviewInstructionButton}
				</div>
			`;
				main_core.Event.bind(this.$containerPreviewInstructionButton, 'click', event => {
					event.preventDefault();
					event.stopPropagation();
					this.getLeadership().show();
				});
			}
			return this.$containerPreviewInstruction;
		}
		getContainerPreviewInstructionButton() {
			if (!this.$containerPreviewInstructionButton && this.articles.length > 0) {
				this.getContainerPreviewInstruction();
			}
			return this.$containerPreviewInstructionButton;
		}
		getContainerLinks() {
			if (!this.$containerLinks) {
				this.$containerLinks = main_core.Tag.render`<div class="landing-sites__container --without-bg --auto-height --flex"></div>`;
				this.menuBottomItems.map(menuItem => {
					this.$containerLinks.appendChild(this.getContainerLinksItem(menuItem.code, menuItem.href, menuItem.text));
				});
			}
			return this.$containerLinks;
		}
		getContainerLinkIconByType(type) {
			switch (type) {
				case 'orders':
					return ui_iconSet_api_core.Outline.CRM;
				case 'marketing':
					return ui_iconSet_api_core.Outline.ROCKET;
				case 'cookies':
					return ui_iconSet_api_core.Outline.COOKIES;
				case 'pages':
					return ui_iconSet_api_core.Outline.PAGES;
				case 'products':
					return ui_iconSet_api_core.Outline.SHOPPING_CART;
				default:
					return null;
			}
		}
		getContainerLinksItem(type, link, title) {
			const iconType = this.getContainerLinkIconByType(type);
			let iconNode;
			if (iconType) {
				const icon = new ui_iconSet_api_core.Icon({
					icon: iconType,
					color: 'var(--ui-color-design-outline-a1-content)',
					size: 24
				});
				iconNode = icon.render();
				iconNode.classList.add('landing-sites__container-link-icon', `--${type}`);
				iconNode.setAttribute('aria-hidden', 'true');
			} else {
				iconNode = main_core.Tag.render`<div class="landing-sites__container-link-icon --${type}"></div>`;
				iconNode.setAttribute('aria-hidden', 'true');
			}
			const container = main_core.Tag.render`
			<a
				href="${link}"
				class="landing-sites__container-link landing-sites__container-link-${this.id}"
				aria-label="${main_core.Text.encode(title)}"
			>
				${iconNode}
				<div class="landing-sites__container-link-text">${title}</div>
			</a>
		`;
			main_core.Event.bind(container, 'click', event => {
				main_core_events.EventEmitter.emit('BX.Landing.SiteTile:onBottomMenuClick', [type, event, this]);
			});
			return container;
		}
		getLeadership() {
			if (!this.leadership) {
				this.leadership = new LeaderShip({
					id: this.id,
					item: this,
					articles: this.articles
				});
			}
			return this.leadership;
		}
		getRemoveFocusTarget() {
			const items = this.grid.getItems();
			const index = items.indexOf(this);
			const item = items[index + 1] || items[index - 1] || null;
			if (item && item.getContainer) {
				const container = item.getContainer();
				container.tabIndex = -1;
				return container;
			}
			const gridContainer = this.grid.getContainer();
			gridContainer.tabIndex = -1;
			return gridContainer;
		}
		restoreFocusAfterRemove() {
			const activeElement = document.activeElement;
			if (!activeElement || !this.getContainer().contains(activeElement)) {
				return;
			}
			const target = this.getRemoveFocusTarget();
			requestAnimationFrame(() => {
				target.focus({
					preventScroll: true
				});
			});
		}
		remove(options = {}) {
			const container = this.getContainer();
			let isRemoved = false;
			this.restoreFocusAfterRemove();
			if (options.announce === true) {
				A11y.announce(main_core.Loc.getMessage('LANDING_SITE_TILE_REMOVE_ANNOUNCE'));
			}
			container.classList.add('--remove');
			main_core.Event.bind(container, 'transitionend', () => {
				if (isRemoved) {
					return;
				}
				isRemoved = true;
				let items = this.grid.getItems();
				const index = items.indexOf(this);
				if (index !== -1) {
					items.splice(index, 1);
				}
				main_core.Dom.remove(container);
			});
		}
		lock() {
			this.getContainer().classList.add('--lock');
			if (!this.loader) {
				this.loader = new BX.Loader({
					target: this.getContainer(),
					size: 100
				});
			}
			this.loader.show();
		}
		unLock() {
			this.getContainer().classList.remove('--lock');
			if (this.loader) {
				this.loader.hide();
			}
		}
		fade() {
			this.getContainer().classList.add('--fade');
		}
		unFade() {
			this.getContainer().classList.remove('--fade');
		}
		active() {
			this.getContainer().classList.add('--active');
		}
		unActive() {
			this.getContainer().classList.remove('--active');
		}
		getPopupHelper() {
			if (!this.popupHelper) {
				this.popupHelper = new PopupHelper({
					id: this.id,
					url: this.url,
					itemObj: this,
					fullUrl: this.fullUrl,
					ordersUrl: this.ordersUrl,
					indexEditUrl: this.indexEditUrl,
					notPublishedText: this.notPublishedText
				});
			}
			return this.popupHelper;
		}
		getContainerWrapper() {
			if (!this.$containerWrapper) {
				this.$containerWrapper = main_core.Tag.render`
				<div class="landing-sites__item-container">
					<div class="landing-sites__preview-container">
						<a href="${this.pagesUrl}" class="landing-sites__preview">
							${this.getContainerPreviewImage()}
							${this.getContainerPreviewStatus()}
							${this.getContainerPreviewShowPages()}
						</a>
						${this.articles.length > 0 ? this.getContainerPreviewInstruction() : ''}
					</div>
					${this.getContainerInfo()}
					${this.getContainerDomain()}
					${this.getContainerLinks()}
				</div>
			`;
			}
			return this.$containerWrapper;
		}
		getContainer() {
			if (!this.$container) {
				const containerClasses = ['landing-sites__grid-item', this.deleted ? '--deleted' : '', this.copilotProcess === true ? '--generating' : ''].join(' ').trim();
				const copilotLabel = this.copilotProcess === true ? main_core.Tag.render`
					<div class="landing-sites__preview-show copilot-label">
							<i class="ui-icon-set --bitrix-gpt"></i>
							${this.copilotGeneratedText}
					</div>
				` : '';
				this.$container = main_core.Tag.render`
				<div class="${containerClasses}" role="listitem">
						<div class="landing-sites__item" id="landing-sites__grid-item--${this.id}">
								${this.getLeadership().getContainer()}
								${this.getContainerWrapper()}
								${this.getPopupHelper().getContainer()}
						</div>
						${copilotLabel}
				</div>
			`;
			}
			return this.$container;
		}
	}

	class ItemMarketing {
		constructor(options) {
			this.id = options.id;
			this.grid = options.grid;
			this.title = options.title;
			this.text = options.text;
			this.buttonText = options.buttonText;
			this.url = options.url;
			this.onClick = options.onClick;
			this.$container = null;
		}
		getButton() {
			const button = new ui_buttons.Button({
				text: this.buttonText,
				useAirDesign: true,
				style: ui_buttons.Button.AirStyle.FILLED
			});
			const buttonNode = button.render();
			buttonNode.setAttribute('aria-label', this.buttonText);
			if (this.onClick) {
				main_core.Event.bind(buttonNode, 'click', this.onClick);
			}
			return buttonNode;
		}
		getContainer() {
			if (!this.$container) {
				this.$container = main_core.Tag.render`
				<div class="landing-sites__grid-item" role="listitem">
					<div class="landing-sites__item --marketing">
						<div class="landing-sites__item-container --flex">
							<div class="landing-sites__item-marketing--title">${this.title}</div>						
							<div class="landing-sites__item-marketing--icon"></div>
							<div class="landing-sites__item-marketing--text">${this.text}</div>
							<div class="landing-sites__item-marketing--buttons">
								${this.getButton()}
							</div>
						</div>
					</div>
				</div>
			`;
			}
			return this.$container;
		}
	}

	class Scroller {
		constructor(options) {
			this.grid = options.grid;
			this.scrollerText = options.scrollerText;
			this.$container = null;
			this.$containerButton = null;
			this.$lastItem = null;
			this.bindEvents();
			this.init();
		}
		bindEvents() {
			main_core.Event.bind(window, 'scroll', this.adjustPosition.bind(this));
		}
		show() {
			if (!this.getContainer().classList.contains('--show')) {
				this.getContainer().classList.remove('--hide');
				this.getContainer().classList.add('--show');
			}
		}
		hide() {
			if (!this.getContainer().classList.contains('--hide')) {
				this.getContainer().classList.remove('--show');
				this.getContainer().classList.add('--hide');
			}
		}
		adjustPosition() {
			if (!this.$lastItem) {
				this.$lastItem = this.grid.getItems()[this.grid.getItems().length - 1].getContainer();
			}
			this.$lastItem.getBoundingClientRect().top > document.documentElement.clientHeight ? this.show() : this.hide();
		}
		getContainer() {
			if (!this.$container) {
				const text = this.scrollerText ? this.scrollerText : main_core.Loc.getMessage('LANDING_SITE_TILE_SCROLLER_SITES');
				this.$containerButton = main_core.Tag.render`
				<button
					type="button"
					class="landing-sites__scroller-button"
					aria-label="${main_core.Text.encode(text)}"
				>
					<div class="landing-sites__scroller-icon" aria-hidden="true"></div>
					<div class="landing-sites__scroller-text">
						${text}
					</div>
				</button>
			`;
				this.$container = main_core.Tag.render`
				<div class="landing-sites__scroller landing-sites__scope">
					${this.$containerButton}
				</div>
			`;
				main_core.Event.bind(this.$containerButton, 'click', () => {
					let offsetY = window.pageYOffset;
					let timer = setInterval(() => {
						if (window.pageYOffset + 30 >= this.$lastItem.getBoundingClientRect().top + window.pageYOffset - document.body.clientTop || window.pageYOffset + window.innerHeight >= document.body.scrollHeight) {
							clearInterval(timer);
						}
						offsetY = offsetY + 10;
						window.scrollTo(0, offsetY);
					}, 10);
				});
			}
			return this.$container;
		}
		init() {
			document.body.appendChild(this.getContainer());
			this.adjustPosition();
		}
	}

	// where the popup goes when the caller passes no address: the same page the template opens, marked by
	// the sites section - st_section is the wire name Bitrix\Landing\Metrika\Sections::URL_PARAM holds
	const DEFAULT_AI_URL = '/sites/ai/?st_section=sites';
	class PopupCopilot {
		constructor(options) {
			this.id = options.id;
			this.videoSrc = options.videoSrc;
			this.zone = options.zone ?? null;
			this.aiUrl = options.aiUrl ?? DEFAULT_AI_URL;
			this.container = null;
			this.content = null;
			this.popup = this.getPopup();
		}
		getContent() {
			if (!this.content) {
				this.content = main_core.Tag.render`
				<div class="landing-site_title-popup-content" data-testid="landing-sites-copilot-popup">
					<div class="landing-site_title-popup-main">
						<div class="landing-site_title-popup-title">
							${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_COPILOT_TITLE')}
						</div>
						<div class="landing-site_title-popup-list">
							<div class="landing-site_title-popup-list-item --about">
								<div class="landing-site_title-popup-list-icon"></div>
								<div class="landing-site_title-popup-list-text">
									${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_COPILOT_LIST_TEXT_1')}
								</div>
							</div>
							<div class="landing-site_title-popup-list-item --ai">
								<div class="landing-site_title-popup-list-icon"></div>
								<div class="landing-site_title-popup-list-text">
									${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_COPILOT_LIST_TEXT_2')}
								</div>
							</div>
							<div class="landing-site_title-popup-list-item --rocket">
								<div class="landing-site_title-popup-list-icon"></div>
								<div class="landing-site_title-popup-list-text">
									${main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_COPILOT_LIST_TEXT_3')}
								</div>
							</div>
						</div>
					</div>
					${this.renderVideo()}
				</div>
			`;
			}
			return this.content;
		}
		getPopup() {
			if (!this.container) {
				this.container = new main_popup.Popup({
					darkMode: true,
					bindElement: window,
					content: this.getContent(),
					width: 670,
					closeIcon: {
						top: '12px',
						right: '13px'
					},
					padding: 0,
					className: 'landing-site_title-popup',
					borderRadius: '24px',
					background: '#853af5',
					cacheable: true,
					animation: 'fading-slide',
					overlay: true,
					events: {
						onShow: () => {
							const button = this.container.buttonsContainer.children[0];
							const icon = document.querySelector('.landing-site_title-popup-list-icon');
							const video = document.querySelector('.landing-site_title-popup-video');
							main_core.Dom.addClass(this.container.popupContainer, '--animation-first-step');
							main_core.Event.bind(button, 'animationend', event => {
								if (event.animationName === 'landing-site_title-popup-btn-animation') {
									main_core.Dom.addClass(this.container.popupContainer, '--animation-second-step');
								}
							});
							main_core.Event.bind(icon, 'animationend', event => {
								if (event.animationName === 'landing-site_title-popup-list-icon') {
									main_core.Dom.addClass(this.container.popupContainer, '--animation-third-step');
								}
							});
							main_core.Event.bind(video, 'animationend', event => {
								if (event.animationName === 'landing-site_title-popup-video') {
									this.videoElement.play();
								}
							});
						}
					},
					buttons: [new ui_buttons.Button({
						text: main_core.Loc.getMessage('LANDING_SITE_TILE_POPUP_COPILOT_BUTTON'),
						color: ui_buttons.Button.Color.SUCCESS,
						size: ui_buttons.Button.Size.EXTRA_LARGE,
						useAirDesign: true,
						style: ui_buttons.Button.AirStyle.FILLED_SUCCESS,
						dataset: {
							testid: 'landing-sites-copilot-popup-create-btn'
						},
						onclick: button => {
							button.setWaiting();
							window.location.href = this.aiUrl;
						}
					})]
				});
			}
			return this.container;
		}
		renderVideo() {
			this.videoElement = main_core.Tag.render`
			<video
				src="${this.videoSrc}"
				autoplay
				preload
				loop
				muted
				class="landing-site_title-popup-video"
			></video>
		`;
			main_core.Event.bind(this.videoElement, 'canplay', () => {
				this.videoElement.muted = true;
			});
			return this.videoElement;
		}
		showPopup(timeout = 0) {
			if (!this.popup) {
				this.popup = this.getPopup();
			}
			setTimeout(() => {
				this.popup.show();
			}, timeout);
		}
	}

	class LandingSitesAiInput {
		static instance = null;
		static init(options) {
			this.instance = new this(options);
			return this.instance;
		}
		static setActive(active, options) {
			this.instance?.setActive(active, options);
		}
		static activate() {
			this.setActive(true);
		}
		static deactivate() {
			this.setActive(false);
		}
		static toggle() {
			this.instance?.toggle();
		}
		static getValue() {
			return this.instance?.getValue() || '';
		}
		static setValue(value) {
			this.instance?.setValue(value);
		}
		static getState() {
			return this.instance?.getState() || {
				isActive: false,
				isInactive: true,
				isAnimating: false,
				isMultiline: false,
				isNoticeVisible: true,
				isControlVisible: false,
				value: ''
			};
		}
		static get isActive() {
			return this.getState().isActive;
		}
		static get isInactive() {
			return this.getState().isInactive;
		}
		static get isAnimating() {
			return this.getState().isAnimating;
		}
		static get isMultiline() {
			return this.getState().isMultiline;
		}
		static get isNoticeVisible() {
			return this.getState().isNoticeVisible;
		}
		static get isControlVisible() {
			return this.getState().isControlVisible;
		}
		constructor(options) {
			this.box = options.box || null;
			this.frame = options.frame || null;
			this.notice = options.notice || null;
			this.control = options.control || null;
			this.input = options.input || null;
			this.inputDescriptionId = this.input?.getAttribute('aria-describedby') || '';
			this.valueInput = options.valueInput || null;
			this.icon = options.icon || null;
			this.isActive = false;
			this.isInactive = true;
			this.isAnimating = false;
			this.isMultiline = false;
			this.isLoading = false;
			this.resizeObserver = null;
			this.handleInput = this.handleInput.bind(this);
			this.handlePaste = this.handlePaste.bind(this);
			this.handleKeyDown = this.handleKeyDown.bind(this);
			this.handleFocus = this.handleFocus.bind(this);
			this.handleBlur = this.handleBlur.bind(this);
			this.handlePointerInteraction = this.handlePointerInteraction.bind(this);
			this.handleIconClick = this.handleIconClick.bind(this);
			this.handleTransitionEnd = this.handleTransitionEnd.bind(this);
			this.updateRowsState = this.updateRowsState.bind(this);
			this.updateIconOffset = this.updateIconOffset.bind(this);
			this.updateHeight = this.updateHeight.bind(this);
			this.initEvents();
			this.renderState();
			requestAnimationFrame(() => {
				this.updateRowsState();
				this.updateIconOffset();
				this.updateHeight();
			});
		}
		initEvents() {
			if (!this.box || !this.input) {
				return;
			}
			this.input.addEventListener('input', this.handleInput);
			this.input.addEventListener('paste', this.handlePaste);
			this.input.addEventListener('keydown', this.handleKeyDown);
			main_core.Event.bind(this.input, 'focus', this.handleFocus);
			main_core.Event.bind(this.input, 'blur', this.handleBlur);
			if (this.control) {
				main_core.Event.bind(this.control, 'pointerdown', this.handlePointerInteraction);
				main_core.Event.bind(this.control, 'mousedown', this.handlePointerInteraction);
				main_core.Event.bind(this.control, 'touchstart', this.handlePointerInteraction);
			}
			this.box.addEventListener('transitionend', this.handleTransitionEnd);
			this.icon?.addEventListener('click', this.handleIconClick);
			window.addEventListener('resize', this.updateHeight);
			if (window.ResizeObserver) {
				this.resizeObserver = new ResizeObserver(() => {
					this.updateRowsState();
					this.updateIconOffset();
					this.updateHeight();
				});
				this.resizeObserver.observe(this.input);
			}
		}
		handleInput() {
			if (this.input.innerText.trim() === '') {
				this.input.innerHTML = '';
			}
			this.syncValue();
			this.updateRowsState();
			this.updateIconOffset();
			this.updateHeight();
		}
		handlePaste(event) {
			event.preventDefault();
			const text = event.clipboardData.getData('text/plain');
			document.execCommand('insertText', false, text);
		}
		handleKeyDown(event) {
			if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
				return;
			}
			if (event.isComposing || event.keyCode === 229) {
				return;
			}
			event.preventDefault();
			if (event.repeat || this.isInactive || this.isLoading) {
				return;
			}
			this.submitInitialPrompt();
		}
		handleFocus() {
			if (!this.input) {
				return;
			}
			const isKeyboardFocus = document.documentElement.dataset.inputModality === 'keyboard';
			if (isKeyboardFocus) {
				main_core.Dom.addClass(this.input, '--keyboard-focused');
			} else {
				main_core.Dom.removeClass(this.input, '--keyboard-focused');
			}
		}
		handleBlur() {
			this.removeKeyboardFocus();
		}
		handlePointerInteraction() {
			this.removeKeyboardFocus();
		}
		removeKeyboardFocus() {
			if (this.input) {
				main_core.Dom.removeClass(this.input, '--keyboard-focused');
			}
		}
		handleIconClick(event) {
			if (this.isInactive || this.isLoading) {
				event.preventDefault();
				return;
			}
			event.preventDefault();
			this.submitInitialPrompt();
		}
		submitInitialPrompt() {
			const initialPrompt = this.getValue();
			if (!initialPrompt) {
				A11y.announce(main_core.Loc.getMessage('LANDING_SITE_TILE_AI_INPUT_EMPTY_ANNOUNCE'));
				return;
			}
			if (!this.icon) {
				return;
			}
			const action = this.icon.dataset.action || this.icon.getAttribute('href');
			if (!action) {
				return;
			}
			this.setLoading(true);
			const form = document.createElement('form');
			form.method = 'post';
			form.action = action;
			form.acceptCharset = 'UTF-8';
			form.style.display = 'none';
			form.appendChild(this.createHiddenInput('initial_prompt', initialPrompt));
			const sessid = this.getSessid();
			if (sessid) {
				form.appendChild(this.createHiddenInput('sessid', sessid));
			}
			document.body.appendChild(form);
			form.submit();
		}
		setLoading(loading) {
			this.isLoading = loading === true;
			this.icon?.classList.toggle('--loading', this.isLoading);
			this.icon?.setAttribute('aria-busy', this.isLoading ? 'true' : 'false');
			this.box?.classList.toggle('--loading', this.isLoading);
			if (this.input) {
				this.input.contentEditable = this.isLoading ? 'false' : 'true';
			}
		}
		createHiddenInput(name, value) {
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = name;
			input.value = value || '';
			return input;
		}
		getSessid() {
			if (typeof BX !== 'undefined' && typeof BX.bitrix_sessid === 'function') {
				return BX.bitrix_sessid();
			}
			if (typeof BX !== 'undefined' && typeof BX.message === 'function') {
				return BX.message('bitrix_sessid') || '';
			}
			return '';
		}
		handleTransitionEnd(event) {
			if (event.target !== this.box || event.propertyName !== 'height') {
				return;
			}
			this.isAnimating = false;
			this.frame?.classList.remove('--animating');
			this.box.classList.remove('--animating');
			this.box.style.height = 'auto';
		}
		setActive(active, options = {}) {
			const nextState = active === true;
			if (this.isActive === nextState) {
				return;
			}
			this.isActive = nextState;
			this.isInactive = !nextState;
			this.isAnimating = true;
			const previousHeight = this.box?.offsetHeight || 0;
			this.renderState();
			this.updateRowsState();
			this.updateIconOffset();
			this.updateHeight(previousHeight);
			if (this.isActive && options.focus === true) {
				this.input?.focus();
			}
		}
		toggle() {
			this.setActive(!this.isActive);
		}
		getValue() {
			return this.input ? this.input.innerText.trim() : '';
		}
		setValue(value) {
			if (!this.input) {
				return;
			}
			this.input.innerText = value || '';
			this.syncValue();
			this.updateRowsState();
			this.updateIconOffset();
			this.updateHeight();
		}
		getState() {
			return {
				isActive: this.isActive,
				isInactive: this.isInactive,
				isAnimating: this.isAnimating,
				isMultiline: this.isMultiline,
				isNoticeVisible: this.isInactive,
				isControlVisible: this.isActive,
				value: this.getValue()
			};
		}
		syncValue() {
			if (this.valueInput) {
				this.valueInput.value = this.getValue();
			}
		}
		renderState() {
			if (!this.box) {
				return;
			}
			this.frame?.classList.toggle('--active', this.isActive);
			this.frame?.classList.toggle('--inactive', this.isInactive);
			this.frame?.classList.toggle('--animating', this.isAnimating);
			this.box.classList.toggle('--active', this.isActive);
			this.box.classList.toggle('--inactive', this.isInactive);
			this.box.classList.toggle('--animating', this.isAnimating);
			this.notice?.classList.toggle('--active', this.isInactive);
			this.control?.classList.toggle('--active', this.isActive);

			// Only one half of the pair is on the screen: the other one is faded out to opacity 0, which
			// leaves it readable and reachable, so it is taken out of the accessibility tree as well.
			A11y.setHidden(this.notice, this.isActive);
			A11y.setHidden(this.control, this.isInactive);
			if (this.frame) {
				this.frame.tabIndex = -1;
			}
			if (this.input) {
				this.input.contentEditable = this.isActive ? 'true' : 'false';
				this.input.setAttribute('aria-disabled', this.isActive ? 'false' : 'true');
				this.input.tabIndex = this.isActive ? 0 : -1;

				// The notice describes the inactive state only; in the active one it is hidden above.
				if (this.isActive || !this.inputDescriptionId) {
					this.input.removeAttribute('aria-describedby');
				} else {
					this.input.setAttribute('aria-describedby', this.inputDescriptionId);
				}
			}
			if (this.icon) {
				this.icon.setAttribute('aria-disabled', this.isActive ? 'false' : 'true');
				this.icon.tabIndex = this.isActive ? 0 : -1;
			}
		}
		updateRowsState() {
			if (!this.box || !this.input) {
				return;
			}
			const lineHeight = parseFloat(getComputedStyle(this.input).lineHeight);
			this.isMultiline = Number.isFinite(lineHeight) && this.input.scrollHeight > lineHeight * 1.5;
			this.box.classList.toggle('--multiline', this.isMultiline);
		}
		updateIconOffset() {
			if (!this.input || !this.icon) {
				return;
			}
			const iconOffset = Math.max(0, this.input.offsetHeight - this.icon.offsetHeight);
			this.icon.style.setProperty('--landing-sites-ai-input-icon-offset', `${iconOffset}px`);
		}
		updateHeight(previousHeight = null) {
			if (!this.box) {
				return;
			}
			if (this.isAnimating && previousHeight === null) {
				return;
			}
			const fromHeight = Number.isFinite(previousHeight) ? previousHeight : this.box.offsetHeight;
			this.box.style.height = 'auto';
			const nextHeight = this.box.offsetHeight;
			if (fromHeight === nextHeight) {
				this.box.style.height = `${nextHeight}px`;
				this.isAnimating = false;
				this.frame?.classList.remove('--animating');
				this.box.classList.remove('--animating');
				return;
			}
			this.box.style.height = `${fromHeight}px`;
			// Commit the starting height. Without a layout read the browser goes straight to the target
			// height, the transition never starts and its transitionend never releases the box.
			void this.box.offsetHeight;
			requestAnimationFrame(() => {
				this.box.style.height = `${nextHeight}px`;
			});
		}
	}

	class LandingSitesAiSlider {
		static init(options = {}) {
			const renderTo = typeof options.renderTo === 'string' ? document.querySelector(options.renderTo) : options.renderTo;
			if (!renderTo) {
				return null;
			}
			const items = options.items || LandingSitesAiSlider.getDefaultItems(options.templateFolder, options.lang);
			const root = LandingSitesAiSlider.render(items);
			main_core.Dom.clean(renderTo);
			main_core.Dom.append(root, renderTo);
			const slider = new LandingSitesAiSlider(root);
			slider.init();
			return slider;
		}
		static getDefaultItems(templateFolder = '/bitrix/components/bitrix/landing.site_tile/templates/.default', lang = 'en') {
			const imageLang = lang === 'ru' ? 'ru' : 'en';
			return [1, 2, 3].map(number => ({
				title: `Desktop ${number}`,
				preview: `${templateFolder}/images/desktop-blured-${number}.png`,
				center: `${templateFolder}/images/desktop-${number}-${imageLang}.jpg`
			}));
		}
		static render(items) {
			const root = main_core.Tag.render`<div class="landing-sites-ai"></div>`;
			const slider = main_core.Tag.render`<div class="landing-sites-ai__slider" data-landing-sites-ai-slider></div>`;
			const viewport = main_core.Tag.render`<div class="landing-sites-ai__viewport"></div>`;
			const previewLayer = main_core.Tag.render`<div class="landing-sites-ai__preview-layer"></div>`;
			const centerLayer = main_core.Tag.render`<div class="landing-sites-ai__center-layer"></div>`;
			items.forEach((item, index) => {
				main_core.Dom.append(LandingSitesAiSlider.renderSlide(item, index, 'preview'), previewLayer);
			});
			items.forEach((item, index) => {
				main_core.Dom.append(LandingSitesAiSlider.renderSlide(item, index, 'center'), centerLayer);
			});
			main_core.Dom.append(previewLayer, viewport);
			main_core.Dom.append(centerLayer, viewport);
			main_core.Dom.append(viewport, slider);
			main_core.Dom.append(slider, root);
			return root;
		}
		static renderSlide(item, index, type) {
			const src = type === 'preview' ? item.preview : item.center;
			const slide = main_core.Tag.render`
			<button
				class="landing-sites-ai__slide landing-sites-ai__slide--${main_core.Text.encode(type)}"
				type="button"
				data-index="${main_core.Text.encode(String(index))}"
				aria-label="${main_core.Text.encode(item.title || '')}"
				aria-hidden="true"
				tabindex="-1"
			>
				<img
					class="landing-sites-ai__slide-image"
					src="${main_core.Text.encode(src)}"
					alt=""
					draggable="false"
				>
			</button>
		`;
			main_core.Dom.attr(slide, type === 'preview' ? 'data-landing-sites-ai-preview-slide' : 'data-landing-sites-ai-center-slide', '');
			return slide;
		}
		constructor(root) {
			this.root = root;
			this.previewSlides = Array.from(this.root.querySelectorAll('[data-landing-sites-ai-preview-slide]'));
			this.centerSlides = Array.from(this.root.querySelectorAll('[data-landing-sites-ai-center-slide]'));
			this.activeIndex = 0;
			this.visibleIndexes = null;
			this.isTransitioning = false;
			this.transition = null;
			this.transitionTimeout = null;
			this.interval = null;
			this.delay = 3200;
			this.transitionDuration = 860;
		}
		init() {
			if (this.previewSlides.length < 2 || this.previewSlides.length !== this.centerSlides.length) {
				return;
			}
			this.initVisibleIndexes();
			this.bindEvents();
			this.update();
			this.start();
		}
		initVisibleIndexes() {
			const total = this.previewSlides.length;
			this.visibleIndexes = [(this.activeIndex - 1 + total) % total, this.activeIndex, (this.activeIndex + 1) % total];
		}
		bindEvents() {
			[...this.previewSlides, ...this.centerSlides].forEach(slide => {
				main_core.Event.bind(slide, 'click', () => {
					this.goTo(Number(slide.dataset.index));
				});
			});
			main_core.Event.bind(this.root, 'mouseenter', () => {
				this.stop();
			});
			main_core.Event.bind(this.root, 'mouseleave', () => {
				this.start();
			});
			main_core.Event.bind(document, 'visibilitychange', () => {
				if (document.hidden) {
					this.stop();
					return;
				}
				this.start();
			});
		}
		start() {
			if (this.isTransitioning) {
				return;
			}
			this.stop();
			this.interval = window.setInterval(() => {
				this.next();
			}, this.delay);
		}
		stop() {
			if (this.interval) {
				window.clearInterval(this.interval);
				this.interval = null;
			}
		}
		next() {
			if (!this.visibleIndexes) {
				this.initVisibleIndexes();
			}
			this.goTo(this.visibleIndexes[0]);
		}
		goTo(index) {
			const total = this.centerSlides.length;
			const nextIndex = (index + total) % total;
			if (nextIndex === this.activeIndex || this.isTransitioning) {
				return;
			}
			if (!this.visibleIndexes || !this.visibleIndexes.includes(nextIndex)) {
				this.activeIndex = nextIndex;
				this.initVisibleIndexes();
				this.update();
				this.start();
				return;
			}
			if (nextIndex !== this.visibleIndexes[0] && nextIndex !== this.visibleIndexes[2]) {
				this.activeIndex = nextIndex;
				this.update();
				this.start();
				return;
			}
			this.runTransition(nextIndex, nextIndex === this.visibleIndexes[0] ? 'left' : 'right');
		}
		runTransition(nextIndex, direction) {
			this.stop();
			this.clearTransitionTimeout();
			this.isTransitioning = true;
			this.transition = {
				from: this.activeIndex,
				to: nextIndex,
				direction: direction
			};
			this.activeIndex = nextIndex;
			this.root.dataset.transition = direction;
			this.root.dataset.transitionStage = 'start';
			this.update();
			this.applyPreviewMotionFrame('start');
			this.applyCenterOverlayFrame('start');
			window.requestAnimationFrame(() => {
				window.requestAnimationFrame(() => {
					if (this.isTransitioning) {
						this.root.dataset.transitionStage = 'active';
						this.applyPreviewMotionFrame('active');
						this.applyCenterOverlayFrame('active');
					}
				});
			});
			this.transitionTimeout = window.setTimeout(() => {
				this.isTransitioning = false;
				delete this.root.dataset.transition;
				delete this.root.dataset.transitionStage;
				this.rotateVisibleIndexes();
				this.transition = null;
				this.clearPreviewMotionStyles(true);
				this.clearCenterOverlayStyles(true);
				this.update();
				window.requestAnimationFrame(() => {
					window.requestAnimationFrame(() => {
						this.clearPreviewMotionTransitionLocks();
						this.clearCenterOverlayTransitionLocks();
						this.start();
					});
				});
			}, this.transitionDuration);
		}
		update() {
			if (this.isTransitioning) {
				this.updateTransition();
				return;
			}
			if (!this.visibleIndexes) {
				this.initVisibleIndexes();
			}
			const [leftIndex, centerIndex, rightIndex] = this.visibleIndexes;
			this.previewSlides.forEach((slide, index) => {
				let state = 'hidden';
				if (index === centerIndex) {
					state = 'preview-center';
				} else if (index === leftIndex) {
					state = 'left';
				} else if (index === rightIndex) {
					state = 'right';
				}
				this.applySlideState(slide, state);
			});
			this.centerSlides.forEach((slide, index) => {
				this.applySlideState(slide, index === centerIndex ? 'center' : 'hidden');
			});
			this.activeIndex = centerIndex;
		}
		updateTransition() {
			const currentIndex = this.transition.from;
			const nextIndex = this.transition.to;
			const direction = this.transition.direction;
			const oldSideIndex = direction === 'left' ? this.visibleIndexes[2] : this.visibleIndexes[0];
			this.previewSlides.forEach((slide, index) => {
				let state = 'hidden';
				if (index === currentIndex) {
					state = direction === 'left' ? 'preview-center-to-right' : 'preview-center-to-left';
				} else if (index === nextIndex) {
					state = 'preview-to-center';
				} else if (index === oldSideIndex) {
					state = direction === 'left' ? 'preview-right-to-left' : 'preview-left-to-right';
				}
				this.applySlideState(slide, state);
			});
			this.centerSlides.forEach((slide, index) => {
				let state = 'hidden';
				if (index === currentIndex) {
					state = 'center-out';
				} else if (index === nextIndex) {
					state = 'center-in';
				}
				this.applySlideState(slide, state);
			});
		}
		applySlideState(slide, state) {
			main_core.Dom.attr(slide, 'data-state', state);
			main_core.Dom.attr(slide, 'aria-hidden', 'true');
			slide.tabIndex = -1;
		}
		rotateVisibleIndexes() {
			if (!this.visibleIndexes || !this.transition) {
				return;
			}
			const [leftIndex, centerIndex, rightIndex] = this.visibleIndexes;
			this.visibleIndexes = this.transition.direction === 'left' ? [rightIndex, leftIndex, centerIndex] : [centerIndex, rightIndex, leftIndex];
			this.activeIndex = this.visibleIndexes[1];
		}
		applyPreviewMotionFrame(stage) {
			if (!this.transition) {
				return;
			}
			const currentIndex = this.transition.from;
			const nextIndex = this.transition.to;
			const direction = this.transition.direction;
			const oldSideIndex = direction === 'left' ? this.visibleIndexes[2] : this.visibleIndexes[0];
			const motionMap = new Map();
			if (direction === 'left') {
				motionMap.set(nextIndex, stage === 'start' ? 'left' : 'center');
				motionMap.set(currentIndex, stage === 'start' ? 'center' : 'right');
				motionMap.set(oldSideIndex, stage === 'start' ? 'right' : 'left');
			} else {
				motionMap.set(nextIndex, stage === 'start' ? 'right' : 'center');
				motionMap.set(currentIndex, stage === 'start' ? 'center' : 'left');
				motionMap.set(oldSideIndex, stage === 'start' ? 'left' : 'right');
			}
			motionMap.forEach((position, index) => {
				this.applyPreviewMotionStyle(this.previewSlides[index], position, stage);
			});
		}
		applyPreviewMotionStyle(slide, position, stage) {
			if (!slide) {
				return;
			}
			const styles = this.getPreviewMotionStyles(position);
			Object.entries(styles).forEach(([property, value]) => {
				slide.style[property] = value;
			});
			slide.style.transition = stage === 'start' ? 'none' : 'width var(--landing-sites-ai-fan-duration) var(--landing-sites-ai-fan-easing), height var(--landing-sites-ai-fan-duration) var(--landing-sites-ai-fan-easing), transform var(--landing-sites-ai-fan-duration) var(--landing-sites-ai-fan-easing), opacity var(--landing-sites-ai-fan-duration) ease';
			slide.style.animation = 'none';
		}
		applyCenterOverlayFrame(stage) {
			if (!this.transition) {
				return;
			}
			const currentSlide = this.centerSlides[this.transition.from];
			const nextSlide = this.centerSlides[this.transition.to];
			const currentPosition = this.transition.direction === 'left' ? 'right' : 'left';
			const nextPosition = this.transition.direction === 'left' ? 'left' : 'right';
			this.applyCenterOverlayStyle(currentSlide, stage === 'start' ? 'center' : currentPosition, stage === 'start' ? 'visible' : 'hidden', stage, '6');
			this.applyCenterOverlayStyle(nextSlide, stage === 'start' ? nextPosition : 'center', stage === 'start' ? 'hidden' : 'visible', stage, '7');
		}
		applyCenterOverlayStyle(slide, position, state, stage, zIndex) {
			if (!slide) {
				return;
			}
			const styles = this.getCenterOverlayMotionStyles(position, state);
			Object.entries(styles).forEach(([property, value]) => {
				slide.style[property] = value;
			});
			slide.style.visibility = 'visible';
			slide.style.zIndex = zIndex;
			slide.style.pointerEvents = state === 'visible' && position === 'center' ? 'auto' : 'none';
			slide.style.transition = stage === 'start' ? 'none' : 'width var(--landing-sites-ai-fan-duration) var(--landing-sites-ai-fan-easing), height var(--landing-sites-ai-fan-duration) var(--landing-sites-ai-fan-easing), transform var(--landing-sites-ai-fan-duration) var(--landing-sites-ai-fan-easing), opacity var(--landing-sites-ai-fan-duration) ease, filter var(--landing-sites-ai-fan-duration) ease';
		}
		getPreviewMotionStyles(position) {
			if (position === 'center') {
				return {
					width: 'var(--landing-sites-ai-slide-width)',
					height: 'var(--landing-sites-ai-slide-height)',
					opacity: '.45',
					transform: 'translateX(-50%) scale(1)',
					transformOrigin: '50% 100%',
					zIndex: '3'
				};
			}
			const isLeft = position === 'left';
			return {
				width: 'var(--landing-sites-ai-side-width)',
				height: 'var(--landing-sites-ai-side-height)',
				opacity: '.45',
				transform: isLeft ? 'translateX(calc(-50% - var(--landing-sites-ai-side-shift))) translateY(var(--landing-sites-ai-side-drop)) scale(var(--landing-sites-ai-side-scale)) rotate(var(--landing-sites-ai-side-rotate-left))' : 'translateX(calc(-50% + var(--landing-sites-ai-side-shift))) translateY(var(--landing-sites-ai-side-drop)) scale(var(--landing-sites-ai-side-scale)) rotate(var(--landing-sites-ai-side-rotate-right))',
				transformOrigin: isLeft ? '82% 100%' : '18% 100%',
				zIndex: position === 'center' ? '5' : '2'
			};
		}
		getCenterOverlayMotionStyles(position, state) {
			const isVisible = state === 'visible';
			if (position === 'center') {
				return {
					width: 'var(--landing-sites-ai-slide-width)',
					height: 'var(--landing-sites-ai-slide-height)',
					opacity: isVisible ? '1' : '0',
					filter: 'none',
					transform: 'translateX(-50%) scale(1)',
					transformOrigin: '50% 100%'
				};
			}
			const isLeft = position === 'left';
			return {
				width: 'var(--landing-sites-ai-side-width)',
				height: 'var(--landing-sites-ai-side-height)',
				opacity: isVisible ? '1' : '0',
				filter: 'blur(10px)',
				transform: isLeft ? 'translateX(calc(-50% - var(--landing-sites-ai-side-shift))) translateY(var(--landing-sites-ai-side-drop)) scale(var(--landing-sites-ai-side-scale)) rotate(var(--landing-sites-ai-side-rotate-left))' : 'translateX(calc(-50% + var(--landing-sites-ai-side-shift))) translateY(var(--landing-sites-ai-side-drop)) scale(var(--landing-sites-ai-side-scale)) rotate(var(--landing-sites-ai-side-rotate-right))',
				transformOrigin: isLeft ? '82% 100%' : '18% 100%'
			};
		}
		clearPreviewMotionStyles(lockTransitions) {
			this.previewSlides.forEach(slide => {
				if (lockTransitions) {
					slide.style.transition = 'none';
				}
				['width', 'height', 'opacity', 'filter', 'transform', 'transformOrigin', 'zIndex', 'animation'].forEach(property => {
					slide.style[property] = '';
				});
			});
		}
		clearPreviewMotionTransitionLocks() {
			this.previewSlides.forEach(slide => {
				slide.style.transition = '';
			});
		}
		clearCenterOverlayStyles(lockTransitions) {
			this.centerSlides.forEach(slide => {
				if (lockTransitions) {
					slide.style.transition = 'none';
				}
				['width', 'height', 'opacity', 'visibility', 'filter', 'transform', 'transformOrigin', 'zIndex', 'pointerEvents'].forEach(property => {
					slide.style[property] = '';
				});
			});
		}
		clearCenterOverlayTransitionLocks() {
			this.centerSlides.forEach(slide => {
				slide.style.transition = '';
			});
		}
		clearTransitionTimeout() {
			if (this.transitionTimeout) {
				window.clearTimeout(this.transitionTimeout);
				this.transitionTimeout = null;
			}
		}
	}

	const SHOW_DELAY = 3000;
	const POPUP_WIDTH = 420;
	const ARROW_OFFSET = 30;
	const ARROW_WIDTH = 36;
	const ARROW_HEIGHT = 13;
	const ARROW_ANCHOR_HORIZONTAL_RATIO = 0.15;
	const ARROW_ANCHOR_VERTICAL_OFFSET = 15;
	class LandingSitesAiFirstVisitTooltip {
		static instance = null;
		static init(options) {
			this.instance = new this(options);
			this.instance.scheduleShow();
			return this.instance;
		}
		constructor(options) {
			this.options = options || {};
			this.anchor = this.options.bindElement || null;
			this.popup = null;
			this.content = null;
			this.hasShown = false;
			this.hasSeenRequestSent = false;
			this.isPositionUpdateEventsBound = false;
			this.showTimeout = null;
			this.handleAnchorTransitionEnd = this.handleAnchorTransitionEnd.bind(this);
		}
		scheduleShow() {
			if (!this.shouldShow()) {
				return;
			}
			this.showTimeout = window.setTimeout(() => {
				this.showTimeout = null;
				this.show();
			}, SHOW_DELAY);
		}
		show() {
			if (!this.shouldShow()) {
				return;
			}
			const popup = this.getPopup();
			this.updateArrowOffset();
			popup.show();
			this.hasShown = true;
			this.bindPositionUpdateEvents();
			this.scheduleAdjustPosition();
			this.markSeen();
		}
		shouldShow() {
			return this.options.shouldShow === true && this.anchor instanceof HTMLElement && !this.hasShown;
		}
		getPopup() {
			if (!this.popup) {
				this.popup = new main_popup.Popup({
					id: 'landing-sites-ai-first-visit-tooltip',
					bindElement: this.anchor,
					content: this.getContent(),
					className: 'landing-sites-ai-first-visit-tooltip-popup ui-hint-popup ui-hint-popup-interactivity',
					darkMode: true,
					width: POPUP_WIDTH,
					minWidth: POPUP_WIDTH,
					maxWidth: POPUP_WIDTH,
					autoHide: true,
					closeByEsc: true,
					closeIcon: true,
					noAllPaddings: true,
					bindOptions: {
						forceTop: true,
						forceLeft: true
					},
					angle: {
						position: 'top',
						offset: ARROW_OFFSET
					},
					contentBackground: 'transparent',
					background: 'var(--ui-color-accent-soft-element-blue, #0056BF)'
				});
			}
			return this.popup;
		}
		getContent() {
			if (!this.content) {
				this.content = main_core.Tag.render`
				<div class="landing-sites-ai-first-visit-tooltip" data-testid="landing-sites-ai-first-visit-tooltip">
					<div class="landing-sites-ai-first-visit-tooltip__image" aria-hidden="true"></div>
					<div class="landing-sites-ai-first-visit-tooltip__content">
						<div class="landing-sites-ai-first-visit-tooltip__title">
							${this.options.title || ''}
						</div>
						<div class="landing-sites-ai-first-visit-tooltip__text">
							${this.options.text || ''}
						</div>
					</div>
				</div>
			`;
			}
			return this.content;
		}
		bindPositionUpdateEvents() {
			if (this.isPositionUpdateEventsBound) {
				return;
			}
			this.anchor.addEventListener('transitionend', this.handleAnchorTransitionEnd);
			this.anchor.querySelector('[data-landing-sites-ai-input-box]')?.addEventListener('transitionend', this.handleAnchorTransitionEnd);
			this.isPositionUpdateEventsBound = true;
		}
		handleAnchorTransitionEnd() {
			this.scheduleAdjustPosition();
		}
		scheduleAdjustPosition() {
			this.adjustPosition();
			requestAnimationFrame(() => {
				this.adjustPosition();
				requestAnimationFrame(() => {
					this.adjustPosition();
				});
			});
		}
		adjustPosition() {
			if (!this.popup || !main_core.Type.isFunction(this.popup.adjustPosition)) {
				return;
			}
			this.updateArrowOffset();
			this.popup.adjustPosition({
				forceTop: true,
				forceLeft: true,
				forceBindPosition: true
			});
		}
		updateArrowOffset() {
			if (!main_core.Type.isFunction(this.popup.setOffset) || !this.anchor) {
				return;
			}
			const anchorWidth = this.anchor.offsetWidth;
			const anchorHeight = this.anchor.offsetHeight;
			const angleLeftOffset = main_popup.Popup.getOption('angleLeftOffset');
			const angleHeight = main_popup.Popup.getOption('angleTopOffset');
			this.popup.setOffset({
				offsetLeft: Math.round(anchorWidth * ARROW_ANCHOR_HORIZONTAL_RATIO - ARROW_OFFSET - ARROW_WIDTH / 2 + (main_core.Type.isNumber(angleLeftOffset) ? angleLeftOffset : 40)),
				offsetTop: Math.round(ARROW_HEIGHT - anchorHeight / 2 + ARROW_ANCHOR_VERTICAL_OFFSET - (main_core.Type.isNumber(angleHeight) ? angleHeight : 10))
			});
		}
		markSeen() {
			if (this.hasSeenRequestSent || !this.options.component || !this.options.action || !main_core.ajax || !main_core.Type.isFunction(main_core.ajax.runComponentAction)) {
				return;
			}
			this.hasSeenRequestSent = true;
			main_core.ajax.runComponentAction(this.options.component, this.options.action, {
				mode: 'class',
				data: {}
			}).catch(() => {});
		}
	}

	class SiteTile {
		constructor(options) {
			this.renderTo = options.renderTo || null;
			this.items = options.items || [];
			this.scrollerText = options.scrollerText || null;
			this.notPublishedText = options.notPublishedText || null;
			this.siteTileItems = [];
			this.$container = null;
			this.scroller = null;
			this.createByCopilotText = options.createByCopilotText || null;
			this.copilotGeneratedText = options.copilotGeneratedText || null;
			this.copilotPopupAiUrl = options.copilotPopupAiUrl || DEFAULT_AI_URL;
			let videoSrc = '/bitrix/components/bitrix/landing.site_tile/templates/.default/video/en/siteWithCopilot.webm';
			this.zone = options.zone || null;
			if (options.lang === 'ru') {
				videoSrc = '/bitrix/components/bitrix/landing.site_tile/templates/.default/video/ru/siteWithCopilot.webm';
			}
			if (options.isNeedCreateCopilotPopup) {
				main_core.Runtime.loadExtension(['ui.banner-dispatcher']).then(exports => {
					const {
						BannerDispatcher
					} = exports;
					BannerDispatcher.high.toQueue(onDone => {
						const metrika = new landing_metrika.Metrika(true);
						metrika.sendData({
							category: 'site',
							event: 'creating_scenario_hint_show',
							type: 'preset'
						});
						this.popupCopilot = new PopupCopilot({
							id: 'popupCopilot',
							videoSrc,
							zone: this.zone,
							aiUrl: this.copilotPopupAiUrl
						});
						this.popupCopilot.showPopup(1000);
						this.popupCopilot.getPopup().subscribe('onAfterClose', () => {
							onDone();
						});
					});
				}).catch(() => {});
			}
			this.setData(this.items);
			this.init();
		}
		getItems() {
			return this.siteTileItems;
		}
		setData(data) {
			this.siteTileItems = data.map(item => {
				if (item.type === 'itemMarketing') {
					return new ItemMarketing({
						id: item.id || null,
						title: item.title || null,
						text: item.text || null,
						buttonText: item.buttonText || null,
						onClick: item.onClick || null
					});
				}
				return new Item({
					id: item.id || null,
					title: item.title || null,
					url: item.url || null,
					fullUrl: item.fullUrl || null,
					domainProvider: item.domainProvider || null,
					pagesUrl: item.pagesUrl || null,
					ordersUrl: item.ordersUrl || null,
					domainUrl: item.domainUrl || null,
					contactsUrl: item.contactsUrl || null,
					indexEditUrl: item.indexEditUrl || null,
					ordersCount: parseInt(item.ordersCount) || null,
					phone: item.phone || null,
					preview: item.preview || null,
					cloudPreview: item.cloudPreview || null,
					published: item.published || null,
					deleted: item.deleted || null,
					domainStatus: item.domainStatus || null,
					domainStatusMessage: item.domainStatusMessage || null,
					menuItems: item.menuItems || null,
					menuBottomItems: item.menuBottomItems || null,
					notPublishedText: this.notPublishedText || null,
					access: item.access || {},
					error: item.error || {},
					articles: item.articles || null,
					grid: this,
					copilotProcess: item.copilotProcess,
					isCreatedByAiScenario: item.isCreatedByAiScenario === true,
					createByCopilotText: this.createByCopilotText,
					copilotGeneratedText: this.copilotGeneratedText
				});
			});
			return this.siteTileItems;
		}
		getContainer() {
			if (!this.$container) {
				this.$container = main_core.Tag.render`
				<div class="landing-sites__grid landing-sites__scope" role="list"></div>
			`;
				for (let i = 0; i < this.siteTileItems.length; i++) {
					this.$container.appendChild(this.siteTileItems[i].getContainer());
				}
			}
			return this.$container;
		}
		draw() {
			if (this.renderTo) {
				this.renderTo.appendChild(this.getContainer());
			}
			this.afterDraw();
		}
		afterDraw() {
			if (this.getItems().length > 4) {
				if (!this.scroller) {
					this.scroller = new Scroller({
						grid: this,
						scrollerText: this.scrollerText
					});
				}
			}
		}
		init() {
			this.draw();
		}
	}

	exports.LandingSitesAiFirstVisitTooltip = LandingSitesAiFirstVisitTooltip;
	exports.LandingSitesAiInput = LandingSitesAiInput;
	exports.LandingSitesAiSlider = LandingSitesAiSlider;
	exports.SiteTile = SiteTile;

})(this.BX.Landing.Component = this.BX.Landing.Component || {}, BX, window, BX.Main, BX.Event, BX.UI.Dialogs, BX.UI.IconSet, window, window, BX.UI.Notification, BX.UI, BX.Landing);
//# sourceMappingURL=script.js.map
