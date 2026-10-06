/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_designTokens, ui_buttons, ui_fonts_opensans, main_core_events, main_core, mail_favoritesFilterState, ui_a11y) {
	'use strict';

	// mirrors Bitrix\Mail\Internal\Service\Attachment\FileIcon::FALLBACK for an answer without an icon
	const FALLBACK_ICON = 'empty';
	function buildAttachmentMenuItems(attachments) {
		if (!Array.isArray(attachments)) {
			return [];
		}
		return attachments.map(attachment => {
			const url = attachment && attachment.url ? attachment.url : null;
			return {
				name: attachment && attachment.name ? String(attachment.name) : '',
				size: attachment && attachment.size ? String(attachment.size) : '',
				url,
				viewerAttrs: attachment && attachment.viewerAttrs && typeof attachment.viewerAttrs === 'object' ? attachment.viewerAttrs : null,
				// the server resolves the file icon so the row and this window name the type the same way
				icon: attachment && attachment.icon ? String(attachment.icon) : FALLBACK_ICON,
				downloadable: url !== null
			};
		});
	}

	function resolveFavoriteTarget(star) {
		return star.getAttribute('aria-pressed') !== 'true';
	}
	function toggleFavoriteOnServer({
		star,
		ajax,
		applyToStar,
		announce,
		messages = {}
	}) {
		const id = star.getAttribute('data-favorite-id');
		if (!id) {
			return Promise.resolve();
		}
		const target = resolveFavoriteTarget(star);
		const say = text => {
			if (text) {
				announce(text);
			}
		};
		applyToStar(star, target);
		say(target ? messages.added : messages.removed);
		return ajax.runAction('mail.api.message.setFavoriteState', {
			data: {
				id,
				isFavorite: target ? 'Y' : 'N'
			}
		}).catch(() => {
			applyToStar(star, !target);
			say(messages.error);
		});
	}

	const ARCHIVE_MIN_FILES = 2;
	const originalMigrationActions = new WeakMap();

	// The side panel opens any same-origin link of the page in a slider of its own, the address of an
	// attachment included: a file belongs to the viewer and to the download, not to a slider.
	const SLIDER_IGNORE_ATTRIBUTE = 'data-slider-ignore-autobinding';
	function getRowMailboxId(row) {
		const mailboxId = Number(row.getData?.()?.MAILBOX_ID ?? 0);
		if (Number.isInteger(mailboxId) && mailboxId > 0) {
			return mailboxId;
		}
		const rowIdMailboxId = Number(String(row.getId?.() ?? '').split('-').pop());
		return Number.isInteger(rowIdMailboxId) && rowIdMailboxId > 0 ? rowIdMailboxId : 0;
	}
	function isMigrationDangerousAction(action) {
		return action?.dataset?.migrationDangerous === true;
	}
	function setRowMigrationActionsLocked(row, locked) {
		if (!main_core.Type.isFunction(row.getActions) || !main_core.Type.isFunction(row.setActions)) {
			return;
		}
		if (locked) {
			if (originalMigrationActions.has(row)) {
				return;
			}
			const actions = row.getActions();
			if (!main_core.Type.isArray(actions)) {
				return;
			}
			originalMigrationActions.set(row, actions);
			row.setActions(actions.map(action => isMigrationDangerousAction(action) ? {
				...action,
				disabled: true,
				onclick: null
			} : action));
			return;
		}
		const actions = originalMigrationActions.get(row);
		if (actions) {
			row.setActions(actions);
			originalMigrationActions.delete(row);
		}
	}
	function setRowsMigrationLocked(rows, lockedMailboxIds) {
		rows.forEach(row => {
			const node = row.getNode();
			if (!node) {
				return;
			}
			const locked = lockedMailboxIds.has(getRowMailboxId(row));
			if (locked) {
				if (node.dataset.mailMigrationLocked !== 'Y') {
					node.dataset.mailMigrationWasDisabled = main_core.Dom.hasClass(node, 'js-migration-disabled') ? 'Y' : 'N';
					setRowMigrationActionsLocked(row, true);
				}
				node.dataset.mailMigrationLocked = 'Y';
				main_core.Dom.addClass(node, 'js-migration-disabled');
				return;
			}
			if (node.dataset.mailMigrationLocked === 'Y' && node.dataset.mailMigrationWasDisabled !== 'Y') {
				main_core.Dom.removeClass(node, 'js-migration-disabled');
			}
			if (node.dataset.mailMigrationLocked === 'Y') {
				setRowMigrationActionsLocked(row, false);
			}
			delete node.dataset.mailMigrationLocked;
			delete node.dataset.mailMigrationWasDisabled;
		});
	}
	class MessageGrid {
		EXPAND_LICENSE_URL = '/settings/license_all.php';
		#loadingMessagesStubInGridWrapper;
		#loadingMessagesStubTimer = null;
		#gridWrapper;
		#gridStub;
		#id;
		#allRowsSelectedStatus = false;
		#panel;
		#checkboxNodeForCheckAll;
		#listHandlersBound = false;
		#viewerLoading = null;
		#viewerReady = false;
		#attachmentsPopup = null;
		#attachmentsMessageId = null;
		#attachmentsReposition = null;
		#listImprovementsEnabled = false;
		#archiveDownloadEnabled = false;
		#migrationLockedMailboxIds = new Set();
		constructor(mailboxIsAvailable = false) {
			this.mailboxIsAvailable = mailboxIsAvailable;
			if (typeof MessageGrid.instance === 'object') {
				return MessageGrid.instance;
			}
			MessageGrid.instance = this;
			this.#listImprovementsEnabled = BX.message('MAIL_LIST_IMPROVEMENTS_ENABLED') === 'Y';
			this.#archiveDownloadEnabled = BX.message('MAIL_LIST_ARCHIVE_DOWNLOAD_AVAILABLE') === 'Y';
			main_core_events.EventEmitter.subscribe('Grid::allRowsSelected', event => {
				if (this.#compareGrid(event)) this.#allRowsSelectedStatus = true;
			});
			main_core_events.EventEmitter.subscribe('Grid::allRowsUnselected', event => {
				if (this.#compareGrid(event)) this.#allRowsSelectedStatus = false;
			});
			main_core_events.EventEmitter.subscribe('Grid::updated', event => {
				if (this.#compareGrid(event) && this.#allRowsSelectedStatus) {
					if (this.#checkboxNodeForCheckAll !== undefined) {
						this.#checkboxNodeForCheckAll.checked = true;
					}
					this.selectAll();
				}
			});
			main_core_events.EventEmitter.subscribe('Mail::resetGridSelection', event => {
				this.#allRowsSelectedStatus = false;
			});
			main_core_events.EventEmitter.subscribe('Mail::directoryChanged', () => {
				this.#allRowsSelectedStatus = false;
			});
			main_core_events.EventEmitter.subscribe('Grid::thereSelectedRows', event => {
				if (this.#compareGrid(event)) this.#allRowsSelectedStatus = false;
			});
			main_core_events.EventEmitter.subscribe('Grid::updated', event => {
				const [grid] = event.getCompatData();
				if (grid !== undefined && main_core.Type.isFunction(grid.getId) && grid.getId() === this.getId()) {
					this.disableLoadingMessagesStub();
					this.#applyMigrationLock();
					this.replaceTheBlankEmailStub();
				}
			});
			this.replaceTheBlankEmailStub();
			if (this.#listImprovementsEnabled) {
				main_core_events.EventEmitter.subscribe('Grid::updated', event => {
					const [grid] = event.getCompatData();
					if (grid !== undefined && main_core.Type.isFunction(grid.getId) && grid.getId() === this.getId()) {
						this.#destroyAttachmentsPopup();
						this.#bindListHandlers();
						this.#announceFavoritesSection();
					}
				});
			}
			return MessageGrid.instance;
		}
		setGridStub(gridStub) {
			this.#gridStub = gridStub;
		}
		setGridWrapper(gridWrapper) {
			this.#gridWrapper = gridWrapper;
		}
		getGridWrapper() {
			return this.#gridWrapper;
		}
		getGridStub() {
			return this.#gridStub;
		}
		enableLoadingMessagesStub() {
			if (this.getGridWrapper() !== undefined && !this.#loadingMessagesStubInGridWrapper) {
				main_core.Dom.addClass(this.getGridWrapper(), 'mail-msg-list-grid-hidden');
				this.#loadingMessagesStubInGridWrapper = this.getGridStub().appendChild(main_core.Tag.render`
					<div class="mail-msg-list-grid-loader mail-msg-list-grid-loader-animate">
						<div class="mail-msg-list-grid-loader-inner">
							<img src="/bitrix/images/mail/mail-loader.svg" alt="Load...">
						</div>
					</div>`);
			}
			if (this.#loadingMessagesStubInGridWrapper && this.#loadingMessagesStubTimer === null) {
				this.#loadingMessagesStubTimer = setTimeout(() => {
					this.#loadingMessagesStubTimer = null;
					this.disableLoadingMessagesStub();
				}, 15000);
			}
		}
		disableLoadingMessagesStub() {
			if (this.#loadingMessagesStubTimer !== null) {
				clearTimeout(this.#loadingMessagesStubTimer);
				this.#loadingMessagesStubTimer = null;
			}
			if (this.#loadingMessagesStubInGridWrapper) {
				this.#loadingMessagesStubInGridWrapper.remove();
				this.#loadingMessagesStubInGridWrapper = null;
			}
			if (this.getGridWrapper()) {
				main_core.Dom.removeClass(this.getGridWrapper(), 'mail-msg-list-grid-hidden');
			}
		}
		setMigrationLocked(mailboxIds) {
			this.#migrationLockedMailboxIds = new Set(mailboxIds);
			this.#applyMigrationLock();
		}
		#applyMigrationLock() {
			if (!this.getGrid()) {
				return;
			}
			setRowsMigrationLocked(this.getRows(), this.#migrationLockedMailboxIds);
		}
		replaceTheBlankEmailStub() {
			const gridWrapper = this.getGridWrapper();
			if (!gridWrapper) {
				return;
			}
			const blankEmailStubs = gridWrapper.getElementsByClassName('main-grid-row main-grid-row-empty main-grid-row-body');
			if (blankEmailStubs.length > 0) {
				let blankEmailStub = blankEmailStubs[0];
				if (blankEmailStub.firstElementChild.firstElementChild) {
					if (this.mailboxIsAvailable) {
						blankEmailStub.firstElementChild.firstElementChild.replaceWith(main_core.Tag.render`
						<div class="mail-msg-list-grid-empty">
						<div class="mail-msg-list-grid-empty-inner">
						<div class="mail-msg-list-grid-empty-title">${main_core.Loc.getMessage("MAIL_MSG_LIST_GRID_EMPTY_TITLE")}</div>
						<p class="mail-msg-list-grid-empty-text">${main_core.Loc.getMessage("MAIL_MSG_LIST_GRID_EMPTY_TEXT_1")}</p>
						<p class="mail-msg-list-grid-empty-text">${main_core.Loc.getMessage("MAIL_MSG_LIST_GRID_EMPTY_TEXT_2")}</p>
						</div>
						</div>`);
					} else {
						let tariffButton = main_core.Tag.render`
					<button class="ui-btn ui-btn-round ui-btn-lg ui-btn-success">
						${main_core.Loc.getMessage("MAIL_MSG_LIST_MAILBOX_TARIFF_RESTRICTIONS_BUTTON")}
					</button>`;
						tariffButton.onclick = event => {
							event.preventDefault();
							window.open(this.EXPAND_LICENSE_URL, '_blank');
						};
						const tariffPlug = main_core.Tag.render`
					<div class="mail-msg-list-grid-empty">
						<div class="mail-msg-list-grid-empty-inner">
							<div class="mail-msg-list-grid-empty-title">${main_core.Loc.getMessage("MAIL_MSG_LIST_MAILBOX_TARIFF_RESTRICTIONS_TITLE")}</div>
							<p class="mail-msg-list-grid-empty-text">${main_core.Loc.getMessage("MAIL_MSG_LIST_MAILBOX_TARIFF_RESTRICTIONS_TEXT_1")}</p>
							<p class="mail-msg-list-grid-empty-text">${main_core.Loc.getMessage("MAIL_MSG_LIST_MAILBOX_TARIFF_RESTRICTIONS_TEXT_2")}</p>
						</div>
						<br/>
					</div>`;
						tariffPlug.append(tariffButton);
						blankEmailStub.firstElementChild.firstElementChild.replaceWith(tariffPlug);
					}
				}
			}
		}
		setCheckboxNodeForCheckAll(node) {
			this.#checkboxNodeForCheckAll = node;
		}
		setPanel(panel) {
			this.#panel = panel;
		}
		getPanel() {
			return this.#panel;
		}
		hidePanel() {
			const panel = this.getPanel();
			if (panel && main_core.Type.isFunction(panel.hidePanel())) {
				this.getPanel().hidePanel();
			}
		}
		#compareGrid(eventWithGrid, grid) {
			if (this.getId() !== undefined) {
				if (grid === undefined && eventWithGrid.getCompatData()) {
					[grid] = eventWithGrid.getCompatData();
				}
				if (grid !== undefined && main_core.Type.isFunction(grid.getId) && grid.getId() === this.getId()) return true;
			}
			return false;
		}
		setAllRowsSelectedStatus() {
			this.#allRowsSelectedStatus = true;
		}
		areAllRowsSelected() {
			return this.#allRowsSelectedStatus;
		}
		unsetAllRowsSelectedStatus() {
			this.#allRowsSelectedStatus = false;
		}
		reloadTable() {
			this.getGrid().reloadTable();
			this.getGrid().tableUnfade();
		}
		setGridId(gridId) {
			if (this.#id === gridId) {
				return;
			}
			this.#id = gridId;
			this.grid = BX.Main.gridManager.getInstanceById(gridId);
			this.#bindListHandlers();
		}
		selectAll() {
			this.getGrid().getRows().selectAll();
		}
		getId() {
			return this.#id;
		}
		getCountDisplayed() {
			if (this.getGrid()) {
				return this.getGrid().getRows().getCountDisplayed();
			}
		}
		getGrid() {
			return this.grid;
		}
		getRows() {
			return this.getGrid().getRows().getBodyChild();
		}
		getRowById(id) {
			return this.getGrid().getRows().getById(id);
		}
		getRowNodeById(id) {
			return this.getRowById(id).getNode();
		}
		getSelectedIds() {
			return this.getGrid().getRows().getSelectedIds();
		}
		hideRowByIds(ids) {
			for (let i = 0; i < ids.length; i++) {
				const rowNode = this.getRowNodeById(ids[i]);
				main_core.Dom.style(rowNode, 'display', 'none');
			}
		}
		resetGridSelection() {
			main_core_events.EventEmitter.emit(window, 'Mail::resetGridSelection');
			this.getGrid().getRows().unselectAll();
			this.getGrid().adjustCheckAllCheckboxes();
			this.hidePanel();
		}
		openGridSettingsWindow() {
			this.getGrid().getSettingsWindow()._onSettingsButtonClick();
		}
		#bindListHandlers() {
			const container = document.querySelector('[data-role="mail-msg-list-grid"]');
			if (!container) {
				return;
			}

			// attachment chips, the attachments popup and the favorite star belong to list improvements
			if (!this.#listImprovementsEnabled) {
				return;
			}
			if (this.#listHandlersBound) {
				return;
			}
			this.#listHandlersBound = true;
			main_core.Event.bind(container, 'pointerover', this.#onAttachmentsIntent.bind(this));
			main_core.Event.bind(container, 'focusin', this.#onAttachmentsIntent.bind(this));
			main_core.Event.bind(container, 'click', this.#onAttachmentsClick.bind(this));
			main_core.Event.bind(container, 'keydown', this.#onAttachmentsKeydown.bind(this));
			main_core.Event.bind(container, 'click', this.#onFavoriteClick.bind(this));
			main_core.Event.bind(container, 'keydown', this.#onFavoriteKeydown.bind(this));
		}

		/**
		 * Attachment chips are rendered with the server side viewer attributes, but the viewer starts
		 * intercepting clicks only once its extension is on the page - and that extension is weight no
		 * one who never opens a file has to carry. So it is fetched on the first sign that such a click
		 * is coming: a pointer over a chip or the focus landing on one. Both outrun the click itself by
		 * a wide margin; the click that outruns them anyway is held back in #openThroughViewer().
		 */
		#onAttachmentsIntent(event) {
			if (event.target.closest('[data-role="mail-list-attachment-chip"]')) {
				this.#loadViewer();
			}
		}
		#loadViewer() {
			if (!this.#viewerLoading) {
				this.#viewerLoading = main_core.Runtime.loadExtension('ui.viewer').then(() => this.#loadViewerInTopWindow()).then(() => {
					this.#viewerReady = true;
				}).catch(() => null);
			}
			return this.#viewerLoading;
		}

		/**
		 * The viewer shows itself in the top window, and the list lives in a slider of that window. Until
		 * the top window has the viewer too, its listener answers a click by loading the extension and
		 * handling the click from a promise - too late to call off the default, so the file opens in a tab
		 * of its own next to the viewer. So the click waits for the top window as well as for this one.
		 */
		#loadViewerInTopWindow() {
			try {
				if (window.top === window || main_core.Type.isObject(window.top.BX?.UI?.Viewer?.Instance)) {
					return Promise.resolve();
				}
				return window.top.BX.loadExt('ui.viewer');
			} catch {
				// a top window of another origin is not ours to load anything into
				return Promise.resolve();
			}
		}
		#onAttachmentsClick(event) {
			if (!event.target.closest('.mail-msg-list-attachment-chip')) {
				return;
			}

			// the file link and the download still work, but the row neither opens the message nor
			// changes its selection
			this.#cancelRowPick();
			const stack = event.target.closest('[data-role="mail-list-attachments-stack"]');
			if (!stack) {
				this.#openThroughViewer(event);
				return;
			}
			event.preventDefault();
			this.#openAttachmentsPopup(stack);
		}

		/**
		 * A click on a file the viewer is not loaded for yet would be followed by the browser and open
		 * the file in a tab of its own - a different thing from what the same click does a second later.
		 * Such a click is held back and repeated once the viewer is there to catch it by its own
		 * listener on the document.
		 */
		#openThroughViewer(event) {
			const link = event.target.closest('[data-role="mail-list-attachment-chip"]');
			if (!link || this.#viewerReady) {
				return;
			}
			event.preventDefault();
			return this.#loadViewer().then(() => {
				if (this.#viewerReady && link.isConnected) {
					link.click();
				}
			});
		}

		/**
		 * main.ui.grid picks the row not from the click itself but from a timer it starts on it, and the
		 * listener that starts that timer sits on the row - below this one. So the pick is called off by
		 * its own timer, and the click travels on: taking it away from the row would take it away from
		 * the whole page above the grid, where the open popups close by exactly such a click.
		 */
		#cancelRowPick() {
			clearTimeout(this.getGrid()?.clickTimer);
		}
		#onAttachmentsKeydown(event) {
			if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') {
				return;
			}
			const stack = event.target.closest('[data-role="mail-list-attachments-stack"]');
			if (!stack) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			this.#openAttachmentsPopup(stack);
		}
		#openAttachmentsPopup(stack) {
			const messageId = main_core.Text.toInteger(stack.getAttribute('data-message-id'));
			if (messageId <= 0) {
				return;
			}
			this.#destroyAttachmentsPopup();
			this.#attachmentsMessageId = stack.getAttribute('data-message-id');
			const menu = main_core.Tag.render`<div class="mail-msg-list-attachments-menu" data-testid="mail-list-attachments-menu"></div>`;
			main_core.Dom.append(this.#renderAttachmentsStatus(), menu);
			main_core.Event.bind(menu, 'click', event => {
				if (event.target.closest('.mail-msg-list-attachments-menu__download')) {
					this.#closeAttachmentsPopup();
				}
			});

			// BX.Main.Popup aligns the angle with the bind element's left edge; shift the popup
			// right by half the stack width so the angle points at the stack centre.
			const angleOffsetLeft = Math.round(stack.getBoundingClientRect().width / 2);
			this.#attachmentsPopup = new BX.Main.Popup({
				id: 'mail-msg-list-attachments-popup',
				bindElement: stack,
				content: menu,
				autoHide: true,
				closeByEsc: true,
				cacheable: false,
				angle: true,
				offsetLeft: angleOffsetLeft,
				padding: 0,
				className: 'mail-msg-list-attachments-popup',
				ariaLabel: stack.getAttribute('aria-label'),
				focusTrap: {
					initialFocus: ['first-tabbable', 'container'],
					restoreFocus: () => this.#getAttachmentsFocusTarget()
				},
				events: {
					onShow: () => {
						this.#setAttachmentsExpanded(true);
						this.#bindAttachmentsReposition();
					},
					onClose: () => {
						this.#setAttachmentsExpanded(false);
						this.#unbindAttachmentsReposition();
					},
					onDestroy: () => {
						this.#setAttachmentsExpanded(false);
						this.#unbindAttachmentsReposition();
						this.#attachmentsPopup = null;
					}
				}
			});
			this.#attachmentsPopup.show();
			this.#setAttachmentsStatus(menu, main_core.Loc.getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_LOADING'));
			this.#loadAttachments(messageId, menu);
		}
		#loadAttachments(messageId, menu) {
			Promise.all([main_core.ajax.runComponentAction('bitrix:mail.client.message.list', 'getAttachments', {
				mode: 'class',
				data: {
					messageId
				}
			}),
			// the files of the window lead to the viewer just like the chips of the row do
			this.#loadViewer()]).then(([response]) => {
				if (!menu.isConnected) {
					return;
				}
				const items = buildAttachmentMenuItems((response.data || {}).attachments);
				if (items.length === 0) {
					this.#setAttachmentsStatus(menu, main_core.Loc.getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_EMPTY'));
					return;
				}
				this.#fillAttachmentsMenu(menu, items);
			}).catch(() => {
				if (!menu.isConnected) {
					return;
				}
				this.#setAttachmentsStatus(menu, main_core.Loc.getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_ERROR'), true);
			});
		}
		#fillAttachmentsMenu(menu, items) {
			main_core.Dom.clean(menu);
			main_core.Dom.append(this.#renderAttachmentsList(items), menu);
			if (this.#archiveDownloadEnabled && items.length >= ARCHIVE_MIN_FILES) {
				main_core.Dom.append(this.#renderArchiveDownloadFooter(), menu);
			}
			if (this.#attachmentsPopup) {
				this.#attachmentsPopup.adjustPosition();
			}
			this.#focusAttachmentsMenu();
		}
		#focusAttachmentsMenu() {
			const focusTrap = this.#attachmentsPopup ? this.#attachmentsPopup.getFocusTrap() : null;
			if (!focusTrap || !focusTrap.contains(document.activeElement)) {
				return;
			}
			focusTrap.focusFirst();
		}
		#renderAttachmentsStatus() {
			return main_core.Tag.render`
			<div class="mail-msg-list-attachments-menu__status" role="status" aria-live="polite"
				data-testid="mail-list-attachments-menu-status"></div>
		`;
		}
		#setAttachmentsStatus(menu, text, isError = false) {
			this.#writeStatus(menu, '.mail-msg-list-attachments-menu__status', text, isError);
		}
		#writeStatus(menu, selector, text, isError) {
			const status = menu ? menu.querySelector(selector) : null;
			if (!status) {
				return;
			}
			status.textContent = text;
			if (isError) {
				main_core.Dom.addClass(status, '--error');
			} else {
				main_core.Dom.removeClass(status, '--error');
			}
		}
		#findAttachmentsStack() {
			if (!this.#attachmentsMessageId) {
				return null;
			}
			return document.querySelector(`[data-role="mail-list-attachments-stack"][data-message-id="${this.#attachmentsMessageId}"]`);
		}
		#setAttachmentsExpanded(expanded) {
			const stack = this.#findAttachmentsStack();
			if (stack) {
				stack.setAttribute('aria-expanded', expanded ? 'true' : 'false');
			}
		}
		#getAttachmentsFocusTarget() {
			return this.#findAttachmentsStack() || this.#getGridFocusFallback();
		}
		#getGridFocusFallback() {
			const container = document.querySelector('[data-role="mail-msg-list-grid"]');
			if (!container) {
				return null;
			}
			if (!container.hasAttribute('tabindex')) {
				container.setAttribute('tabindex', '-1');
			}
			return container;
		}
		#closeAttachmentsPopup() {
			if (this.#attachmentsPopup) {
				this.#attachmentsPopup.close();
			}
		}

		/**
		 * The popup lives in the body, while the chip it is bound to rides the horizontal scroll of the
		 * grid; on its own the popup follows only a window resize, so a scrolled row leaves it hanging
		 * away from its button. Scroll does not bubble, hence the capturing listener: it hears the grid
		 * container and every other scroller above it. adjustPosition() returns at once while the bind
		 * element stays put, so the listener costs nothing on scrolls that do not move the chip.
		 */
		#bindAttachmentsReposition() {
			if (this.#attachmentsReposition) {
				return;
			}
			this.#attachmentsReposition = () => {
				if (this.#attachmentsPopup) {
					this.#attachmentsPopup.adjustPosition();
				}
			};
			main_core.Event.bind(document, 'scroll', this.#attachmentsReposition, true);
		}
		#unbindAttachmentsReposition() {
			if (!this.#attachmentsReposition) {
				return;
			}
			main_core.Event.unbind(document, 'scroll', this.#attachmentsReposition, true);
			this.#attachmentsReposition = null;
		}
		#renderAttachmentsList(items) {
			const downloadLabel = main_core.Loc.getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_DOWNLOAD');
			const list = main_core.Tag.render`<div class="mail-msg-list-attachments-menu__list" data-testid="mail-list-attachments-menu-list"></div>`;
			items.forEach(item => {
				const row = main_core.Tag.render`<div class="mail-msg-list-attachments-menu__item"></div>`;
				// the icon repeats the extension the file name already shows, so it is decorative
				const name = main_core.Tag.render`
				<a class="mail-msg-list-attachments-menu__name" data-testid="mail-list-attachments-menu-item-view">
					<span class="mail-msg-list-attachments-menu__icon ui-icon ui-icon-file-${main_core.Text.encode(item.icon)}"
						data-testid="mail-list-attachments-menu-item-icon" aria-hidden="true"><i></i></span>
					<span class="mail-msg-list-attachments__name">${main_core.Text.encode(item.name)}</span>
					<span class="mail-msg-list-attachments__size">${main_core.Text.encode(item.size)}</span>
				</a>
			`;
				if (item.downloadable) {
					main_core.Dom.attr(name, 'href', item.url);
					main_core.Dom.attr(name, 'target', '_blank');
					main_core.Dom.attr(name, SLIDER_IGNORE_ATTRIBUTE, 'true');
					this.#applyViewerAttributes(name, item.viewerAttrs);
					main_core.Dom.append(name, row);
					const downloadFileLabel = item.name ? main_core.Loc.getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_DOWNLOAD_FILE', {
						'#NAME#': item.name
					}) : downloadLabel;
					const download = main_core.Tag.render`
					<a class="mail-msg-list-attachments-menu__download" data-testid="mail-list-attachments-menu-item-download"
						title="${main_core.Text.encode(downloadLabel)}" aria-label="${main_core.Text.encode(downloadFileLabel)}"></a>
				`;
					main_core.Dom.attr(download, 'href', item.url);
					main_core.Dom.attr(download, 'download', '');
					main_core.Dom.attr(download, SLIDER_IGNORE_ATTRIBUTE, 'true');
					main_core.Dom.append(download, row);
				} else {
					main_core.Dom.append(name, row);
				}
				main_core.Dom.append(row, list);
			});
			return list;
		}
		#renderArchiveDownloadFooter() {
			const label = main_core.Loc.getMessage('MAIL_DISK_FILE_DOWNLOAD_ARCHIVE');
			const footer = main_core.Tag.render`<div class="mail-msg-list-attachments-menu__footer"></div>`;
			const button = main_core.Tag.render`
			<button type="button" class="mail-msg-list-attachments-menu__archive" data-testid="mail-list-attachments-menu-archive">
				<span class="mail-msg-list-attachments-menu__archive-icon" aria-hidden="true"></span>
				<span class="mail-msg-list-attachments-menu__archive-text">${main_core.Text.encode(label)}</span>
			</button>
		`;
			const status = main_core.Tag.render`
			<span class="mail-msg-list-attachments-menu__archive-status" role="status" aria-live="polite"
				data-testid="mail-list-attachments-menu-archive-status"></span>
		`;
			main_core.Event.bind(button, 'click', () => this.#onArchiveDownloadClick(button));
			main_core.Dom.append(button, footer);
			main_core.Dom.append(status, footer);
			return footer;
		}
		#onArchiveDownloadClick(button) {
			if (button.getAttribute('aria-disabled') === 'true') {
				return;
			}
			const messageId = main_core.Text.toInteger(this.#attachmentsMessageId);
			if (messageId <= 0) {
				return;
			}
			this.#setArchiveButtonLoading(button, true);
			main_core.ajax.runComponentAction('bitrix:mail.client.message.list', 'getAttachmentsArchiveUrl', {
				mode: 'class',
				data: {
					messageId
				}
			}).then(response => {
				const data = response.data || {};
				if (data.available && main_core.Type.isStringFilled(data.archiveUrl)) {
					this.#startArchiveDownload(data.archiveUrl);
					this.#setArchiveButtonLoading(button, false);
				} else {
					this.#hideArchiveDownloadButton(button);
				}
			}).catch(() => {
				this.#setArchiveButtonLoading(button, false);
				this.#setArchiveStatus(button, main_core.Loc.getMessage('MAIL_MESSAGE_LIST_ARCHIVE_ERROR'), true);
			});
		}
		#setArchiveStatus(button, text, isError = false) {
			this.#writeStatus(button.closest('.mail-msg-list-attachments-menu'), '.mail-msg-list-attachments-menu__archive-status', text, isError);
		}
		#setArchiveButtonLoading(button, loading) {
			if (loading) {
				button.setAttribute('aria-disabled', 'true');
				button.setAttribute('aria-busy', 'true');
				main_core.Dom.addClass(button, '--loading');
				this.#setArchiveStatus(button, main_core.Loc.getMessage('MAIL_MESSAGE_LIST_ARCHIVE_PREPARING'));
			} else {
				button.removeAttribute('aria-disabled');
				button.removeAttribute('aria-busy');
				main_core.Dom.removeClass(button, '--loading');
				this.#setArchiveStatus(button, '');
			}
		}
		#hideArchiveDownloadButton(button) {
			this.#setArchiveButtonLoading(button, false);
			const footer = button.closest('.mail-msg-list-attachments-menu__footer') || button;
			const menu = footer.closest('.mail-msg-list-attachments-menu');
			const firstLink = menu ? menu.querySelector('.mail-msg-list-attachments-menu__name[href]') : null;
			const focusTarget = firstLink || this.#getAttachmentsFocusTarget();
			main_core.Dom.addClass(footer, '--hidden');
			if (focusTarget) {
				focusTarget.focus({
					preventScroll: true
				});
			}
		}
		#startArchiveDownload(url) {
			const anchor = main_core.Tag.render`<a></a>`;
			main_core.Dom.attr(anchor, 'href', url);
			main_core.Dom.attr(anchor, 'download', '');
			main_core.Dom.style(anchor, 'display', 'none');
			main_core.Dom.append(anchor, document.body);
			anchor.click();
			main_core.Dom.remove(anchor);
		}
		#applyViewerAttributes(target, attrs) {
			if (!attrs || typeof attrs !== 'object') {
				return;
			}
			Object.entries(attrs).forEach(([name, value]) => {
				main_core.Dom.attr(target, name, value === null ? '' : String(value));
			});
		}
		#destroyAttachmentsPopup() {
			if (!this.#attachmentsPopup) {
				return;
			}
			const popup = this.#attachmentsPopup;
			const content = popup.getContentContainer();
			if (content && content.contains(document.activeElement)) {
				const target = this.#getAttachmentsFocusTarget();
				if (target) {
					target.focus({
						preventScroll: true
					});
				}
			}
			popup.destroy();
			this.#attachmentsPopup = null;
		}

		/**
		 * The favorite column is declared with the default of the grid turned off, so the grid leaves the
		 * row alone on a click in it by itself. The star has nothing of its own to keep, and the click
		 * travels on to the page above the grid, where the open popups close by exactly such a click.
		 */
		#onFavoriteClick(event) {
			const star = event.target.closest('[data-role="mail-list-favorite"]');
			if (!star) {
				return;
			}
			event.preventDefault();
			this.#toggleFavorite(star);
		}
		#onFavoriteKeydown(event) {
			if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') {
				return;
			}
			const star = event.target.closest('[data-role="mail-list-favorite"]');
			if (!star) {
				return;
			}

			// the button answers a press with a click of its own, and the page scrolls by a space
			event.preventDefault();
			this.#toggleFavorite(star);
		}
		#toggleFavorite(star) {
			toggleFavoriteOnServer({
				star,
				ajax: main_core.ajax,
				applyToStar: (node, active) => this.#applyFavoriteToStar(node, active),
				announce: text => this.#setFavoritesStatus(text),
				messages: {
					added: main_core.Loc.getMessage('MAIL_MESSAGE_LIST_FAVORITE_ADDED'),
					removed: main_core.Loc.getMessage('MAIL_MESSAGE_LIST_FAVORITE_REMOVED'),
					error: main_core.Loc.getMessage('MAIL_MESSAGE_LIST_FAVORITE_ERROR')
				}
			});
		}
		#applyFavoriteToStar(star, active) {
			if (active) {
				main_core.Dom.addClass(star, '--active');
				star.setAttribute('aria-pressed', 'true');
			} else {
				main_core.Dom.removeClass(star, '--active');
				star.setAttribute('aria-pressed', 'false');
			}
		}
		#announceFavoritesSection() {
			// the address is the only carrier of the section, so it is also the only thing to ask
			if (!mail_favoritesFilterState.isFavoritesSectionUrl(window.location.href)) {
				return;
			}
			const count = this.getCountDisplayed() || 0;
			this.#setFavoritesStatus(count > 0 ? main_core.Loc.getMessagePlural('MAIL_MESSAGE_LIST_FAVORITES_SHOWN', count, {
				'#COUNT#': count
			}) : main_core.Loc.getMessage('MAIL_MESSAGE_LIST_FAVORITES_EMPTY'));
		}
		#setFavoritesStatus(text) {
			ui_a11y.LiveAnnouncer.announce(text);
		}
	}

	exports.MessageGrid = MessageGrid;
	exports.setRowsMigrationLocked = setRowsMigrationLocked;

})(this.BX.Mail = this.BX.Mail || {}, window, BX.UI, BX, BX.Event, BX, BX.Mail, BX.UI.Accessibility);
//# sourceMappingURL=messagegrid.bundle.js.map
