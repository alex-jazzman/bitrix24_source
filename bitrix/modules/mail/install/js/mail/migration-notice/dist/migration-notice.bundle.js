/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events) {
	'use strict';

	const CONTROL_PANEL_BUTTONS = new Set(['transfer_mail', 'create_company_mail']);
	const ENTRY_ACTION = 'mail.controlpanel.getEntryUrl';
	function leadsToControlPanel(buttonId) {
		return CONTROL_PANEL_BUTTONS.has(buttonId);
	}
	async function openControlPanel() {
		try {
			const {
				data
			} = await main_core.ajax.runAction(ENTRY_ACTION, {
				data: {}
			});
			const url = main_core.Type.isStringFilled(data?.url) ? String(data.url) : '';
			if (url === '') {
				await announceRefusal();
				return;
			}
			window.location.href = url;
		} catch (error) {
			await announceRefusal(refusalOf(error));
		}
	}
	function refusalOf(error) {
		const errors = error?.errors;
		if (!Array.isArray(errors)) {
			return '';
		}
		const spoken = errors.find(item => main_core.Type.isStringFilled(item?.message));
		return spoken === undefined ? '' : String(spoken.message);
	}
	async function announceRefusal(said = '') {
		try {
			const ui = await main_core.Runtime.loadExtension('ui.notification').then(exports => exports);
			const content = said === '' ? main_core.Loc.getMessage('MAIL_MIGRATION_NOTICE_CONTROL_PANEL_REFUSED') ?? '' : said;
			ui.Center.notify({
				content
			});
		} catch {
		}
	}
	class MigrationControlPanel {
		static open() {
			void openControlPanel();
		}
	}

	const CLOSE_ICON_SELECTOR = '.popup-window-close-icon';
	function markPopupNode(popup, selector, testId) {
		const node = popup.getPopupContainer().querySelector(selector);
		if (node === null) {
			console.error(`mail.migration-notice: nothing matches "${selector}", "${testId}" has nowhere to go`);
			return;
		}
		main_core.Dom.attr(node, 'data-testid', testId);
	}
	function markCloseIcon(popup, testId) {
		markPopupNode(popup, CLOSE_ICON_SELECTOR, testId);
	}

	function linkProps$2(url) {
		if (!main_core.Type.isStringFilled(url)) {
			return {};
		}
		return url.startsWith('/') ? {} : {
			target: '_blank'
		};
	}
	const ILLUSTRATION_SIZE$1 = 128;
	const POPUP_ID$1 = 'mail-migration-notice-announcement';
	const POPUP_CLOSE_TESTID$1 = 'mail-migration-notice-announcement-close';
	let uiPromise$4 = null;
	function loadUi$4() {
		uiPromise$4 ??= main_core.Runtime.loadExtension('main.popup', 'ui.banner-dispatcher', 'ui.buttons', 'ui.system.illustration').then(exports => exports);
		return uiPromise$4;
	}
	function currentSliderId() {
		return `${window.location.pathname}${window.location.search}`;
	}
	class MigrationAnnouncement {
		#options;
		#ui;
		#popup = null;
		#release = null;
		static async create(options) {
			return new MigrationAnnouncement(options, await loadUi$4());
		}
		constructor(options, ui) {
			this.#options = options;
			this.#ui = ui;
		}
		show() {
			const queueOptions = {
				context: {
					sliderId: currentSliderId()
				}
			};
			this.#ui.BannerDispatcher.high.toQueue(onDone => {
				this.#release = onDone;
				this.#popup = this.#createPopup();
				this.#popup.show();
				this.#options.onShown();
				return {};
			}, queueOptions);
		}
		destroy() {
			this.#popup?.destroy();
			this.#popup = null;
			this.#releaseQueue();
		}
		#releaseQueue() {
			const release = this.#release;
			this.#release = null;
			release?.();
		}
		#createPopup() {
			const titleId = `${POPUP_ID$1}-title`;
			const popup = this.#ui.PopupManager.create({
				id: POPUP_ID$1,
				className: 'mail-migration-notice-announcement',
				overlay: true,
				fixed: true,
				closeIcon: true,
				closeByEsc: true,
				autoHide: false,
				cacheable: false,
				role: 'dialog',
				ariaLabelledBy: titleId,
				focusTrap: true,
				content: this.#renderContent(titleId),
				buttons: this.#renderButtons(),
				events: {
					onClose: () => {
						this.#popup = null;
						this.#releaseQueue();
					}
				}
			});
			markCloseIcon(popup, POPUP_CLOSE_TESTID$1);
			return popup;
		}
		#renderContent(titleId) {
			return main_core.Tag.render`
			<div class="mail-migration-notice-announcement__content" data-testid="mail-migration-notice-announcement">
				${this.#renderIllustration()}
				<div id="${titleId}" class="mail-migration-notice-announcement__title">
					${main_core.Text.encode(this.#options.title)}
				</div>
				<div class="mail-migration-notice-announcement__text">${main_core.Text.encode(this.#options.text)}</div>
			</div>
		`;
		}
		#renderIllustration() {
			if (!main_core.Type.isStringFilled(this.#options.illustration)) {
				return '';
			}
			return new this.#ui.Illustration({
				name: this.#options.illustration,
				size: ILLUSTRATION_SIZE$1
			}).render();
		}
		#renderButtons() {
			return this.#options.actions.map((action, index) => new this.#ui.Button({
				text: action.label,
				link: leadsToControlPanel(action.id) ? '' : action.url,
				props: leadsToControlPanel(action.id) ? {} : linkProps$2(action.url),
				dataset: {
					testid: 'mail-migration-notice-announcement-btn'
				},
				className: 'mail-migration-notice-announcement__action',
				size: this.#ui.ButtonSize.LARGE,
				useAirDesign: true,
				style: index === 0 ? this.#ui.AirButtonStyle.FILLED : this.#ui.AirButtonStyle.PLAIN,
				onclick: () => {
					this.#answer(action);
					if (leadsToControlPanel(action.id)) {
						void openControlPanel();
					}
					return {};
				}
			}));
		}
		#answer(action) {
			if (action.answer === null) {
				return;
			}
			action.answer();
			this.#popup?.close();
		}
	}

	function linkProps$1(url) {
		if (!main_core.Type.isStringFilled(url)) {
			return {};
		}
		return url.startsWith('/') ? {} : {
			target: '_blank'
		};
	}
	let uiPromise$3 = null;
	function loadUi$3() {
		uiPromise$3 ??= main_core.Runtime.loadExtension('ui.alerts', 'ui.buttons').then(exports => exports);
		return uiPromise$3;
	}
	class MigrationBanner {
		#options;
		#ui;
		#alert = null;
		#container = null;
		static async create(options) {
			return new MigrationBanner(options, await loadUi$3());
		}
		constructor(options, ui) {
			this.#options = options;
			this.#ui = ui;
		}
		show() {
			if (this.#alert !== null) {
				return;
			}
			this.#alert = new this.#ui.Alert({
				text: main_core.Text.encode(this.#options.text),
				color: this.#ui.Alert.Color.PRIMARY,
				icon: this.#ui.Alert.Icon.INFO,
				size: this.#ui.Alert.Size.MD,
				closeBtn: true,
				customClass: 'mail-migration-notice-banner --ui-context-content-light',
				beforeMessageHtml: this.#renderTitle(),
				afterMessageHtml: this.#renderActions()
			});
			const container = this.#alert.render();
			this.#container = container;
			main_core.Dom.attr(container, {
				'data-testid': 'mail-migration-notice-banner',
				role: 'status'
			});
			this.#adjustCloseBtn(container);
			main_core.Dom.append(container, this.#options.container);
		}
		destroy() {
			this.#releaseFocus();
			this.#alert?.destroy();
			this.#alert = null;
			this.#container = null;
		}
		#adjustCloseBtn(container) {
			const closeBtn = this.#alert?.getCloseBtn();
			if (!main_core.Type.isDomNode(closeBtn)) {
				return;
			}
			main_core.Dom.attr(closeBtn, {
				role: 'button',
				tabindex: '0',
				'aria-label': main_core.Loc.getMessage('MAIL_MIGRATION_NOTICE_BANNER_CLOSE') ?? '',
				'data-testid': 'mail-migration-notice-banner-close'
			});
			main_core.Event.bind(closeBtn, 'keydown', event => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					closeBtn.click();
				}
			});
			main_core.Event.bind(container, 'click', event => {
				if (closeBtn.contains(event.target)) {
					this.#releaseFocus();
				}
			}, {
				capture: true
			});
			main_core.Event.bind(closeBtn, 'click', () => this.#options.onDismiss());
		}
		#releaseFocus() {
			if (this.#container?.contains(document.activeElement) !== true) {
				return;
			}
			const host = this.#options.container;
			if (!host.hasAttribute('tabindex')) {
				main_core.Dom.attr(host, 'tabindex', '-1');
			}
			host.focus();
		}
		#renderTitle() {
			return main_core.Tag.render`
			<span class="mail-migration-notice-banner__title">${main_core.Text.encode(this.#options.title)}</span>
		`;
		}
		#renderActions() {
			const actions = main_core.Tag.render`<div class="mail-migration-notice-banner__actions"></div>`;
			this.#options.actions.forEach(action => {
				new this.#ui.Button({
					text: action.label,
					link: leadsToControlPanel(action.id) ? '' : action.url,
					props: leadsToControlPanel(action.id) ? {} : linkProps$1(action.url),
					dataset: {
						testid: 'mail-migration-notice-banner-btn'
					},
					className: 'mail-migration-notice-banner__action',
					size: this.#ui.ButtonSize.SMALL,
					useAirDesign: true,
					style: this.#ui.AirButtonStyle.FILLED,
					onclick: () => {
						action.answer?.();
						if (leadsToControlPanel(action.id)) {
							void openControlPanel();
						}
						return {};
					}
				}).renderTo(actions);
			});
			return actions;
		}
	}

	const HINT_BLOCK$1 = 'mail-migration-notice-dismiss-hint';
	const HINT_CLOSE_TESTID$1 = 'mail-migration-notice-dismiss-hint-close';
	let uiPromise$2 = null;
	function loadUi$2() {
		uiPromise$2 ??= main_core.Runtime.loadExtension('ui.notification').then(exports => exports);
		return uiPromise$2;
	}
	function announce(message) {
		void main_core.Runtime.loadExtension('ui.a11y').then(exports => {
			exports.LiveAnnouncer?.announce(message);
		})
		.catch(() => {});
	}
	class MigrationDismissHint {
		#hint;
		#balloon = null;
		#closed = false;
		constructor(hint) {
			this.#hint = hint;
		}
		show() {
			void this.#draw();
			announce(this.#hint);
		}
		close() {
			this.#closed = true;
			this.#balloon?.close();
			this.#balloon = null;
		}
		async #draw() {
			const ui = await loadUi$2().catch(() => null);
			if (ui === null || this.#closed) {
				return;
			}
			const balloon = ui.Center.notify({
				content: main_core.Text.encode(this.#hint),
				autoHide: false,
				testId: HINT_BLOCK$1,
				width: 'auto'
			});
			if (balloon !== undefined) {
				this.#balloon = balloon;
				main_core.Dom.addClass(balloon.getContainer(), HINT_BLOCK$1);
				this.#adjustCloseBtn(balloon);
			}
		}
		#adjustCloseBtn(balloon) {
			const closeBtn = balloon.getCloseButton();
			const label = main_core.Loc.getMessage('MAIL_MIGRATION_NOTICE_DISMISS_HINT_CLOSE');
			main_core.Dom.attr(closeBtn, {
				role: 'button',
				tabindex: '0',
				'aria-label': main_core.Type.isStringFilled(label) ? label : null,
				'data-testid': HINT_CLOSE_TESTID$1
			});
			main_core.Event.bind(closeBtn, 'keydown', event => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					closeBtn.click();
				}
			});
		}
	}

	function linkProps(url) {
		if (!main_core.Type.isStringFilled(url)) {
			return {};
		}
		return url.startsWith('/') ? {} : {
			target: '_blank'
		};
	}
	const ILLUSTRATION_SIZE = 96;
	const DETAILS = 'details';
	const POPUP_ID = 'mail-migration-notice-popup';
	const POPUP_CLOSE_TESTID = 'mail-migration-notice-popup-close';
	let uiPromise$1 = null;
	function loadUi$1() {
		uiPromise$1 ??= main_core.Runtime.loadExtension('main.popup', 'ui.banner-dispatcher', 'ui.buttons', 'ui.system.illustration').then(exports => exports);
		return uiPromise$1;
	}
	class MigrationPopup {
		#options;
		#ui;
		#popup = null;
		#release = null;
		#answered = false;
		static async create(options) {
			return new MigrationPopup(options, await loadUi$1());
		}
		constructor(options, ui) {
			this.#options = options;
			this.#ui = ui;
		}
		show() {
			this.#ui.BannerDispatcher.normal.toQueue(onDone => {
				this.#release = onDone;
				this.#popup = this.#createPopup();
				this.#popup.show();
				this.#options.onShown();
				return {};
			});
		}
		destroy() {
			this.#popup?.destroy();
			this.#popup = null;
			this.#releaseQueue();
		}
		#releaseQueue() {
			const release = this.#release;
			this.#release = null;
			release?.();
		}
		#createPopup() {
			const titleId = `${POPUP_ID}-title`;
			const popup = this.#ui.PopupManager.create({
				id: POPUP_ID,
				className: 'mail-migration-notice-popup',
				overlay: true,
				closeIcon: true,
				closeByEsc: true,
				autoHide: false,
				cacheable: false,
				role: 'dialog',
				ariaLabelledBy: titleId,
				focusTrap: true,
				content: this.#renderContent(titleId),
				buttons: this.#renderButtons(),
				events: {
					onClose: () => {
						this.#handleClose();
						this.#releaseQueue();
					}
				}
			});
			markCloseIcon(popup, POPUP_CLOSE_TESTID);
			return popup;
		}
		#handleClose() {
			this.#popup = null;
			if (this.#answered) {
				return;
			}
			this.#answered = true;
			this.#options.onDismiss();
		}
		#renderContent(titleId) {
			return main_core.Tag.render`
			<div class="mail-migration-notice-popup__content" data-testid="mail-migration-notice-popup">
				${this.#renderIllustration()}
				<div id="${titleId}" class="mail-migration-notice-popup__title">
					${main_core.Text.encode(this.#options.title)}
				</div>
				<div class="mail-migration-notice-popup__text">${main_core.Text.encode(this.#options.text)}</div>
			</div>
		`;
		}
		#renderIllustration() {
			if (!main_core.Type.isStringFilled(this.#options.illustration)) {
				return '';
			}
			return new this.#ui.Illustration({
				name: this.#options.illustration,
				size: ILLUSTRATION_SIZE
			}).render();
		}
		#renderButtons() {
			return this.#options.actions.map((action, index) => new this.#ui.Button({
				text: action.label,
				link: leadsToControlPanel(action.id) ? '' : action.url,
				props: leadsToControlPanel(action.id) ? {} : linkProps(action.url),
				dataset: {
					testid: 'mail-migration-notice-popup-btn'
				},
				className: 'mail-migration-notice-popup__action',
				size: this.#ui.ButtonSize.MEDIUM,
				useAirDesign: true,
				style: this.#styleOf(action, index),
				onclick: () => {
					this.#answer(action);
					if (leadsToControlPanel(action.id)) {
						void openControlPanel();
					}
					return {};
				}
			}));
		}
		#styleOf(action, index) {
			if (action.id === DETAILS) {
				return this.#ui.AirButtonStyle.PLAIN_ACCENT;
			}
			return index === 0 ? this.#ui.AirButtonStyle.FILLED : this.#ui.AirButtonStyle.PLAIN;
		}
		#answer(action) {
			if (action.answer === null) {
				return;
			}
			this.#answered = true;
			action.answer();
			this.#popup?.close();
		}
	}

	const USER_OPTION_CATEGORY = 'mail.guide';
	const GUIDE_ID = 'mail-migration-notice-panel-hint';
	const HINT_BLOCK = 'mail-migration-notice-panel-hint';
	const LINK_PLACEHOLDER = '#';
	const HINT_LINK_TESTID = 'mail-migration-notice-panel-hint-link';
	const HINT_CLOSE_TESTID = 'mail-migration-notice-panel-hint-close';
	const HINT_BTN_TESTID = 'mail-migration-notice-panel-hint-btn';
	const HINT_BTN_SELECTOR = '.ui-tour-popup-btn-next';
	let uiPromise = null;
	function loadUi() {
		uiPromise ??= main_core.Runtime.loadExtension('ui.banner-dispatcher', 'ui.tour').then(exports => exports);
		return uiPromise;
	}
	class MigrationPanelHint {
		#options;
		#guide = null;
		#started = false;
		#destroyed = false;
		#visitRemembered = false;
		#release = null;
		constructor(options) {
			this.#options = options;
		}
		run() {
			const button = this.#findButton();
			if (button === null) {
				return;
			}
			this.#rememberVisitOnClick(button);
			if (this.#options.hintDue) {
				void this.#showHint(button);
			}
		}
		destroy() {
			this.#destroyed = true;
			this.#guide?.close();
			this.#guide = null;
			this.#releaseQueue();
		}
		#findButton() {
			if (!main_core.Type.isStringFilled(this.#options.buttonSelector)) {
				return null;
			}
			return document.querySelector(this.#options.buttonSelector);
		}
		#rememberVisitOnClick(button) {
			main_core.Event.bind(button, 'click', () => {
				if (this.#visitRemembered) {
					return;
				}
				this.#visitRemembered = true;
				this.#save(this.#options.visitOptionName);
			});
		}
		async #showHint(button) {
			if (this.#started) {
				return;
			}
			this.#started = true;
			const ui = await loadUi();
			if (this.#destroyed) {
				return;
			}
			ui.BannerDispatcher.normal.toQueue(onDone => {
				this.#release = onDone;
				this.#guide = this.#createGuide(button, ui);
				this.#guide.start();
				this.#adjustPopup(this.#guide.getPopup());
				const link = this.#guide.getLink();
				main_core.Dom.attr(link, 'data-testid', HINT_LINK_TESTID);
				this.#leadIntoThePanelOnClick(link);
				this.#save(this.#options.hintOptionName);
				return {};
			});
		}
		#createGuide(button, ui) {
			return new ui.Guide({
				id: GUIDE_ID,
				simpleMode: true,
				steps: [{
					target: button,
					title: this.#options.title,
					text: this.#options.text,
					link: LINK_PLACEHOLDER,
					linkTitle: this.#options.linkTitle,
					position: 'bottom'
				}],
				events: {
					onFinish: () => this.#releaseQueue()
				}
			});
		}
		#adjustPopup(popup) {
			const container = popup.getPopupContainer();
			popup.setClosingByEsc(true);
			main_core.Dom.attr(container, 'data-testid', HINT_BLOCK);
			main_core.Dom.addClass(container, HINT_BLOCK);
			popup.adjustPosition();
			markCloseIcon(popup, HINT_CLOSE_TESTID);
			markPopupNode(popup, HINT_BTN_SELECTOR, HINT_BTN_TESTID);
			const name = main_core.Type.isStringFilled(this.#options.title) ? this.#options.title : this.#options.text;
			if (main_core.Type.isStringFilled(name)) {
				main_core.Dom.attr(container, 'aria-label', name);
			}
		}
		#leadIntoThePanelOnClick(link) {
			main_core.Event.bind(link, 'click', event => {
				event.preventDefault();
				if (!this.#visitRemembered) {
					this.#visitRemembered = true;
					this.#save(this.#options.visitOptionName);
				}
				void openControlPanel();
			});
		}
		#releaseQueue() {
			const release = this.#release;
			this.#release = null;
			release?.();
		}
		#save(optionName) {
			if (!main_core.Type.isStringFilled(optionName)) {
				return;
			}
			BX.userOptions.save(USER_OPTION_CATEGORY, optionName, null, 'Y');
		}
	}

	const Code = Object.freeze({
		Announcement: 'ann_1',
		MigrationVariantA: 'mig_a',
		MigrationVariantB: 'mig_b',
		Banner: 'ban_1'
	});
	const ILLUSTRATION = Object.freeze({
		ann_1: 'announcement',
		mig_a: 'email--warning',
		mig_b: 'email--alert'
	});
	const Reaction = Object.freeze({
		Shown: 'shown',
		RemindLater: 'remind_later',
		Dismissed: 'dismissed'
	});
	const REACTIONS = Object.values(Reaction);
	const GET_ACTION = 'mail.MigrationNotice.get';
	const REACT_ACTION = 'mail.MigrationNotice.react';
	const PULL_EVENT = 'onPullEvent-mail';
	const PULL_COMMAND = 'mailbox_migration_status_changed';
	const PROBLEM_STATE_PULL_COMMAND = 'mailbox_grid_button_counter_refresh';
	const speakingSurfaces = new Set();
	class MigrationNotice {
		#surface;
		#container;
		#mailboxId;
		#decision;
		#message = null;
		#dismissHint = null;
		#drawings = 0;
		#watchedMailboxId = null;
		#speaking = false;
		constructor(options) {
			const {
				surface,
				container = null,
				mailboxId = null,
				decision = null
			} = options;
			this.#surface = surface;
			this.#container = container;
			this.#mailboxId = main_core.Type.isNumber(mailboxId) ? mailboxId : null;
			this.#decision = this.#normalizeDecision(decision);
		}
		show() {
			if (!this.#takeTheFloor()) {
				return;
			}
			if (this.#decision === null) {
				void this.#load();
				return;
			}
			void this.#draw(this.#decision);
		}
		destroy() {
			this.#drawings += 1;
			this.#erase();
			this.#closeDismissHint();
			main_core_events.EventEmitter.unsubscribe(PULL_EVENT, this.#handlePull);
			this.#watchedMailboxId = null;
			this.#decision = null;
			this.#leaveTheFloor();
		}
		#takeTheFloor() {
			if (this.#speaking) {
				return true;
			}
			if (speakingSurfaces.has(this.#surface)) {
				return false;
			}
			speakingSurfaces.add(this.#surface);
			this.#speaking = true;
			return true;
		}
		#leaveTheFloor() {
			if (!this.#speaking) {
				return;
			}
			speakingSurfaces.delete(this.#surface);
			this.#speaking = false;
		}
		async #load() {
			const data = {
				surface: this.#surface
			};
			if (this.#mailboxId !== null) {
				data.mailboxId = this.#mailboxId;
			}
			const decision = await this.#request(GET_ACTION, data);
			if (decision !== null) {
				this.#closeDismissHint();
				await this.#draw(decision);
			}
		}
		async #draw(decision) {
			const drawing = this.#drawings + 1;
			this.#drawings = drawing;
			const message = await this.#createMessage(decision);
			if (drawing !== this.#drawings) {
				return;
			}
			this.#erase();
			this.#decision = decision;
			this.#watch(decision.mailboxId);
			this.#message = message;
			message?.show();
		}
		async #createMessage(decision) {
			if (decision.code === Code.Announcement) {
				return MigrationAnnouncement.create({
					illustration: ILLUSTRATION[Code.Announcement],
					title: decision.title,
					text: decision.text,
					actions: this.#toActions(decision),
					onShown: () => {
						void this.#react(Reaction.Shown, false);
					}
				});
			}
			if (decision.code === Code.MigrationVariantA || decision.code === Code.MigrationVariantB) {
				return MigrationPopup.create({
					illustration: ILLUSTRATION[decision.code] ?? '',
					title: decision.title,
					text: decision.text,
					actions: this.#toActions(decision),
					onShown: () => {
						void this.#react(Reaction.Shown, false);
					},
					onDismiss: () => {
						this.#showDismissHint(decision.dismissHint);
						void this.#react(Reaction.Dismissed, true);
					}
				});
			}
			if (decision.code === Code.Banner && this.#container !== null) {
				return MigrationBanner.create({
					container: this.#container,
					title: decision.title,
					text: decision.text,
					actions: this.#toActions(decision),
					onDismiss: () => {
						void this.#react(Reaction.Dismissed, true);
					}
				});
			}
			return null;
		}
		#erase() {
			this.#message?.destroy();
			this.#message = null;
		}
		#showDismissHint(hint) {
			if (!main_core.Type.isStringFilled(hint)) {
				return;
			}
			this.#closeDismissHint();
			const dismissHint = new MigrationDismissHint(hint);
			this.#dismissHint = dismissHint;
			dismissHint.show();
		}
		#closeDismissHint() {
			this.#dismissHint?.close();
			this.#dismissHint = null;
		}
		async #react(reaction, draw) {
			const reactionToken = this.#decision?.reactionToken ?? '';
			if (!main_core.Type.isStringFilled(reactionToken)) {
				return;
			}
			const decision = await this.#request(REACT_ACTION, {
				reactionToken,
				reaction
			});
			if (draw && decision !== null) {
				await this.#draw(decision);
			}
		}
		#toActions(decision) {
			return decision.buttons.filter(button => this.#leadsSomewhere(button)).map(button => ({
				id: button.id,
				label: button.label,
				url: main_core.Type.isStringFilled(button.url) ? button.url : '',
				answer: this.#toAnswer(button)
			}));
		}
		#leadsSomewhere(button) {
			return main_core.Type.isStringFilled(button?.label) && (main_core.Type.isStringFilled(button?.url) || REACTIONS.includes(button?.id));
		}
		#toAnswer(button) {
			if (main_core.Type.isStringFilled(button.url)) {
				return null;
			}
			return () => {
				void this.#react(button.id, true);
			};
		}
		#watch(mailboxId) {
			if (mailboxId === null || this.#watchedMailboxId === mailboxId) {
				return;
			}
			if (this.#watchedMailboxId === null) {
				main_core_events.EventEmitter.subscribe(PULL_EVENT, this.#handlePull);
			}
			this.#watchedMailboxId = mailboxId;
			void this.#extendWatch(mailboxId);
		}
		async #extendWatch(mailboxId) {
			try {
				await main_core.Runtime.loadExtension('pull.client');
			} catch {
				return;
			}
			BX.PULL?.extendWatch(`mail_mailbox_migration_${mailboxId}`);
		}
		#handlePull = event => {
			const [command, payload] = event.getData() ?? [];
			if (command === PROBLEM_STATE_PULL_COMMAND) {
				void this.#load();
				return;
			}
			if (command !== PULL_COMMAND || !main_core.Type.isObject(payload)) {
				return;
			}
			if (Number(payload.mailboxId ?? 0) !== this.#watchedMailboxId) {
				return;
			}
			void this.#load();
		};
		async #request(action, data) {
			try {
				const response = await main_core.ajax.runAction(action, {
					data
				});
				return this.#normalizeDecision(response?.data?.decision);
			} catch {
				return null;
			}
		}
		#normalizeDecision(payload) {
			if (!main_core.Type.isPlainObject(payload)) {
				return null;
			}
			const value = payload;
			if (!main_core.Type.isStringFilled(value.code)) {
				return null;
			}
			return {
				code: value.code,
				mailboxId: main_core.Type.isNumber(value.mailboxId) ? value.mailboxId : null,
				title: main_core.Type.isString(value.title) ? value.title : '',
				text: main_core.Type.isString(value.text) ? value.text : '',
				buttons: main_core.Type.isArray(value.buttons) ? value.buttons : [],
				dismissHint: main_core.Type.isString(value.dismissHint) ? value.dismissHint : '',
				reactionToken: main_core.Type.isString(value.reactionToken) ? value.reactionToken : ''
			};
		}
	}

	exports.MigrationControlPanel = MigrationControlPanel;
	exports.MigrationNotice = MigrationNotice;
	exports.MigrationPanelHint = MigrationPanelHint;

})(this.BX.Mail = this.BX.Mail || {}, BX, BX.Event);
//# sourceMappingURL=migration-notice.bundle.js.map
