/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
this.BX.Sign.V2.Grid = this.BX.Sign.V2.Grid || {};
(function (exports, main_core, ui_avatar, ui_dialogs_messagebox, sign_v2_api, ui_buttons, ui_notification, main_popup) {
	'use strict';

	const TestId = Object.freeze({
		popupContainer: 'sign-b2e-signers-list-popup',
		popup: 'sign-b2e-signers-list-popup-content',
		title: 'sign-b2e-signers-list-popup-title',
		description: 'sign-b2e-signers-list-popup-description',
		nameInput: 'sign-b2e-signers-list-title-input',
		submitButton: 'sign-b2e-signers-list-submit',
		cancelButton: 'sign-b2e-signers-list-cancel'
	});
	class CreateListPopup {
		async show(inputText = null) {
			return new Promise(resolve => {
				const isRenameMode = inputText !== null;
				const inputId = `listNameInput_${Date.now()}`;
				const input = main_core.Tag.render`
				<input
					type="text"
					id="${inputId}"
					class="ui-ctl-element"
					data-testid="${TestId.nameInput}"
					placeholder="${main_core.Loc.getMessage('SIGN_SIGNERS_GRID_CREATE_LIST_POPUP_INPUT_PLACEHOLDER')}"
					value="${isRenameMode ? main_core.Text.encode(inputText) : ''}"
				>
			`;
				const popup = new main_popup.Popup(`listNamePopup_${inputId}`, null, {
					draggable: false,
					overlay: true,
					width: 500,
					height: 280,
					padding: 0,
					closeByEsc: true,
					closeIcon: true,
					className: 'sign-signers-grid-create-list-popup',
					content: this.#renderContent(input, isRenameMode),
					buttons: [new ui_buttons.CreateButton({
						text: isRenameMode ? main_core.Loc.getMessage('SIGN_SIGNERS_GRID_CREATE_LIST_SAVE_BUTTON_TEXT') : main_core.Loc.getMessage('SIGN_SIGNERS_GRID_CREATE_LIST_CREATE_BUTTON_TEXT'),
						round: true,
						dataset: {
							testid: TestId.submitButton
						},
						events: {
							click: async () => {
								await this.#save(input, popup, resolve);
							}
						}
					}), new ui_buttons.CancelButton({
						text: main_core.Loc.getMessage('SIGN_SIGNERS_GRID_CREATE_LIST_CANCEL_BUTTON_TEXT'),
						dataset: {
							testid: TestId.cancelButton
						},
						events: {
							click() {
								popup.close();
							}
						}
					})],
					events: {
						onPopupShow() {
							this.popupContainer.dataset.testid = TestId.popupContainer;
							main_core.Dom.style(this.popupContainer, 'backgroundColor', 'rgba(255, 255, 255)');
						},
						onAfterShow: () => {
							input.focus();
							if (isRenameMode && inputText.length > 1) {
								input.setSelectionRange(input.value.length, input.value.length);
							}
							main_core.Event.bind(input, 'keydown', async event => {
								if (event.key === 'Enter') {
									await this.#save(input, popup, resolve);
								}
							});
						}
					}
				});
				popup.show();
			});
		}

		// The name is saved from two places — the submit button and Enter in the input — and both must
		// behave identically: report an empty name and keep the popup open, or resolve and close.
		async #save(input, popup, resolve) {
			try {
				const listName = await this.#handleSave(input);
				resolve(listName);
				popup.close();
			} catch (error) {
				this.#showError(error);
			}
		}
		#renderContent(input, isRenameMode) {
			const title = this.#getPopupTitle(isRenameMode);
			const description = this.#getPopupDescription(isRenameMode);
			return main_core.Tag.render`
			<div class="sign-create-list-popup-item-container-wrapper" data-testid="${TestId.popup}">
				<span class="sign-create-list-title-titlebar" data-testid="${TestId.title}">${title}</span>
				<div class="sign-create-list-popup-item-container">
					<div class="sign-create-list-title-input-container">
						${input}
					</div>
					<span style="text-align: left; width: 100%" data-testid="${TestId.description}">${description}</span>
				</div>
			</div>
		`;
		}
		#getPopupTitle(isRenameMode) {
			return isRenameMode ? main_core.Loc.getMessage('SIGN_SIGNERS_GRID_RENAME_LIST_POPUP_TITLE') : main_core.Loc.getMessage('SIGN_SIGNERS_GRID_CREATE_LIST_POPUP_TITLE');
		}
		#getPopupDescription(isRenameMode) {
			return isRenameMode ? main_core.Loc.getMessage('SIGN_SIGNERS_GRID_RENAME_LIST_DESCRIPTION') : main_core.Loc.getMessage('SIGN_SIGNERS_GRID_CREATE_LIST_DESCRIPTION');
		}
		async #handleSave(input) {
			const listName = input ? input.value : '';
			if (!listName) {
				throw new Error(main_core.Loc.getMessage('SIGN_SIGNERS_GRID_CREATE_LIST_HINT_TITLE_NOT_EMPTY_MSGVER_1'));
			}
			return listName;
		}
		#showError(error) {
			ui_notification.Center.notify({
				content: error.message
			});
		}
	}

	const GRID_SIGNERS_LISTS = 'SIGN_B2E_SIGNERS_LIST_GRID';
	const GRID_SIGNERS = 'SIGN_B2E_SIGNERS_LIST_GRID_EDIT';
	const EXPORT_IFRAME_ID = 'sign-b2e-signers-export-iframe';
	const EXPORT_IFRAME_NAME_PREFIX = 'sign-b2e-signers-export-';
	const TEMPLATE_SEND_PANEL_WIDTH = 1650;
	const FEED_RECIPIENTS_LIMIT_ERROR_CODE = 'FEED_RECIPIENTS_LIMIT_EXCEEDED';
	const WIZARD_PANEL_WIDTH = 1250;
	const RESPONSIBLE_AVATAR_SIZE = 26;
	const ADD_LIST_BUTTON_SELECTOR = '.sign-b2e-signers-list-add-button';
	class Signers {
		static #instance = null;
		#api = new sign_v2_api.Api();
		#isSliderCloseSubscribed = false;
		static getInstance() {
			Signers.#instance ??= new Signers();
			return Signers.#instance;
		}
		static renderResponsibleAvatar(container, userpicPath, userName) {
			new ui_avatar.AvatarRound({
				size: RESPONSIBLE_AVATAR_SIZE,
				userpicPath,
				userName
			}).renderTo(container);
		}

		/**
		 * Entry point of the groups screen: the page only calls this, so its markup declares no names and
		 * stays runnable when the section is substituted into a ready document. The subscription belongs to
		 * the instance and survives such a substitution, the nodes of the markup do not.
		 */
		initListsPage() {
			this.#reloadListsAfterSliderClose();
			main_core.Event.ready(() => {
				this.hidePinColumnInSettings();
				const addListButton = document.querySelector(ADD_LIST_BUTTON_SELECTOR);
				if (main_core.Type.isDomNode(addListButton)) {
					main_core.Event.bind(addListButton, 'click', () => this.createList());
				}
			});
		}

		/**
		 * Subscribes the instance to the closing of a side panel, once for its whole life: with a single
		 * instance per window a repeated call would double the reload of the grid, so the guard belongs
		 * here and not to whoever calls it.
		 */
		#reloadListsAfterSliderClose() {
			if (this.#isSliderCloseSubscribed) {
				return;
			}
			this.#isSliderCloseSubscribed = true;
			const context = window === top ? window : top;
			context.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', event => {
				const sliderUrl = event.getData()[0].getSlider().getUrl();
				const path = new main_core.Uri(sliderUrl).getPath();
				if (/^\/sign\/b2e\/signers\/\d+\/$/.test(path)) {
					this.reloadLists();
				}
			});
		}
		reloadSigners() {
			const gridManager = this.#getGridManager();
			main_core.Event.ready(() => {
				const grid = gridManager?.getById(GRID_SIGNERS)?.instance;
				if (main_core.Type.isObject(grid)) {
					grid.reload();
				}
			});
		}
		reloadLists() {
			const gridManager = this.#getGridManager();
			main_core.Event.ready(() => {
				const grid = gridManager?.getById(GRID_SIGNERS_LISTS)?.instance;
				if (main_core.Type.isObject(grid)) {
					grid.reload();
				}
			});
		}
		hidePinColumnInSettings() {
			const pinColumnSetting = document.querySelector(`#${GRID_SIGNERS_LISTS} .main-grid-settings-window-list-item[data-name="PIN"]`);
			if (main_core.Type.isDomNode(pinColumnSetting)) {
				main_core.Dom.style(pinColumnSetting, 'display', 'none');
			}
		}
		async deleteList(listId, listTitle = null) {
			const messageContent = main_core.Tag.render`
			<div>
				${this.#getDeleteListMessage(listTitle)}
			</div>
		`;
			main_core.Dom.style(messageContent, 'margin-top', '5%');
			main_core.Dom.style(messageContent, 'color', '#535c69');
			main_core.Dom.style(messageContent, 'overflow-wrap', 'anywhere');
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('SIGN_SIGNERS_DELETE_CONFIRMATION_TITLE_MSGVER_1'),
				message: messageContent.outerHTML,
				modal: true,
				buttons: [new BX.UI.Button({
					text: main_core.Loc.getMessage('SIGN_SIGNERS_GRID_DELETE_POPUP_YES'),
					color: BX.UI.Button.Color.PRIMARY,
					onclick: async button => {
						button.setDisabled(true);
						button.setState(BX.UI.Button.State.WAITING);
						try {
							const api = this.#api;
							const response = await api.signersList.deleteSignersList(listId, false);
							if (response.errors?.length > 0) {
								throw new Error(response.errors[0].message);
							}
							window.top.BX.UI.Notification.Center.notify({
								content: main_core.Loc.getMessage('SIGN_SIGNERS_GRID_DELETE_HINT_SUCCESS')
							});
						} catch {
							window.top.BX.UI.Notification.Center.notify({
								content: main_core.Loc.getMessage('SIGN_SIGNERS_GRID_DELETE_HINT_FAIL')
							});
						}
						await this.reloadLists();
						button.getContext().close();
					}
				}), new BX.UI.Button({
					text: main_core.Loc.getMessage('SIGN_SIGNERS_GRID_DELETE_POPUP_NO'),
					color: BX.UI.Button.Color.LINK,
					onclick: button => {
						button.getContext().close();
					}
				})]
			});
		}
		async copyList(listId) {
			try {
				const response = await this.#api.signersList.copySignersList(listId, false);
				if (response.errors?.length > 0) {
					throw new Error(response.errors[0].message);
				}
				await this.reloadLists();
				window.top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SIGN_SIGNERS_GRID_COPY_HINT_SUCCESS')
				});
			} catch (error) {
				console.error('Error copying list:', error);
				window.top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SIGN_SIGNERS_GRID_COPY_HINT_FAIL')
				});
			}
		}

		/**
		 * Pin cell action of a list row. Called by main.ui.grid with the list id and the pin
		 * state the row was rendered with, so isPinned is the state to return to on failure.
		 */
		async togglePin(listId, isPinned, event) {
			const button = event?.getData()?.button;
			const shouldBePinned = !isPinned;

			// react to the click immediately, the grid reload below brings the server state
			this.#setPinActive(button, shouldBePinned);
			try {
				const response = shouldBePinned ? await this.#api.signersList.pinList(listId, false) : await this.#api.signersList.unpinList(listId, false);
				// the api layer returns a rejection as a value when it is asked not to notify, so the
				// success of the call is the contract of its answer, not the absence of errors in it
				if (response?.errors?.length > 0 || response?.pinned !== shouldBePinned) {
					throw new Error(response?.errors?.[0]?.message ?? 'The pin state has not changed');
				}
			} catch {
				this.#setPinActive(button, isPinned);
				window.top.BX.UI.Notification.Center.notify({
					content: shouldBePinned ? main_core.Loc.getMessage('SIGN_SIGNERS_GRID_PIN_HINT_FAIL') : main_core.Loc.getMessage('SIGN_SIGNERS_GRID_UNPIN_HINT_FAIL')
				});
				return;
			}
			await this.reloadLists();
		}

		/**
		 * Opens the document wizard for a group. The address, including the group context, is built
		 * on the server: the client does not compose screen addresses.
		 */
		openWizard(url) {
			this.#openSidePanel(url, WIZARD_PANEL_WIDTH);
		}

		/**
		 * Opens the existing template send screen for a group. The address, including the group
		 * context, is built on the server: the client does not compose screen addresses.
		 */
		openTemplateSend(url) {
			this.#openSidePanel(url, TEMPLATE_SEND_PANEL_WIDTH);
		}
		#openSidePanel(url, width) {
			BX.SidePanel.Instance.open(url, {
				width,
				cacheable: false
			});
		}

		/**
		 * Post in the activity stream for a group. The recipients are picked by the server, the
		 * form and the publication belong to the feed: its post form extension is loaded at the
		 * moment of the action, so the groups screens do not depend on it statically.
		 */
		async writeToFeed(listId) {
			let recipients = [];
			try {
				const response = await this.#api.signersList.getFeedRecipients(listId, false);
				if (response?.errors?.length > 0) {
					this.#notifyWriteToFeedFailure(this.#getFeedRecipientsRefusal(response.errors));
					return;
				}

				// the api layer returns a rejection as a value when it is asked not to notify, so a
				// missing set is a failed request, not a group nobody of which can read the feed
				if (!main_core.Type.isArray(response?.recipients)) {
					this.#notifyWriteToFeedFailure();
					return;
				}

				// an empty set is a regular outcome: nobody of the group has access to the portal
				recipients = response.recipients;
			} catch {
				this.#notifyWriteToFeedFailure();
				return;
			}
			try {
				const {
					PostForm
				} = await top.BX.Runtime.loadExtension('socialnetwork.post-form');
				if (!main_core.Type.isFunction(PostForm)) {
					throw new TypeError('The post form of the activity stream is not available');
				}
				await new PostForm({
					preselectedRecipients: recipients
				}).show();
			} catch {
				this.#notifyWriteToFeedFailure();
			}
		}
		async deleteSelectedSigners(listId) {
			const gridManager = this.#getGridManager();
			const grid = gridManager?.getById(GRID_SIGNERS)?.instance;
			if (!grid) {
				return;
			}
			const selectedIds = grid.getRows().getSelectedIds();
			if (selectedIds.length === 0) {
				return;
			}
			await this.deleteSigners(listId, selectedIds);
		}
		exportToExcel(baseUrl, userIds = null) {
			const grid = this.#getGridManager()?.getById(GRID_SIGNERS)?.instance;
			const selectedIds = main_core.Type.isArray(userIds) ? userIds : grid ? grid.getRows().getSelectedIds() : [];
			const form = main_core.Tag.render`
			<form method="post" action="${baseUrl}" target="${this.#getExportTarget()}"></form>
		`;
			const fields = [['mode', 'excel'], ['ncc', '1'], ...selectedIds.map(userId => ['exportSelectedIds[]', userId])];
			for (const [name, value] of fields) {
				main_core.Dom.append(main_core.Tag.render`<input type="hidden" name="${name}" value="${value}">`, form);
			}
			main_core.Dom.append(form, document.body);
			form.submit();
			setTimeout(() => main_core.Dom.remove(form), 0);
		}
		async deleteSigners(listId, userIds) {
			BX.UI.Dialogs.MessageBox.show({
				message: main_core.Loc.getMessage('SIGN_SIGNERS_SIGNER_DELETE_CONFIRMATION_TITLE'),
				modal: true,
				buttons: [new BX.UI.Button({
					text: main_core.Loc.getMessage('SIGN_SIGNERS_GRID_DELETE_POPUP_YES'),
					color: BX.UI.Button.Color.PRIMARY,
					onclick: async button => {
						button.setDisabled(true);
						button.setState(BX.UI.Button.State.WAITING);
						const isSingle = userIds.length === 1;
						const successMsg = isSingle ? main_core.Loc.getMessage('SIGN_SIGNERS_SIGNER_GRID_DELETE_HINT_SUCCESS') : main_core.Loc.getMessage('SIGN_SIGNERS_SIGNERS_GRID_DELETE_HINT_SUCCESS');
						const failMsg = isSingle ? main_core.Loc.getMessage('SIGN_SIGNERS_SIGNER_GRID_DELETE_HINT_FAIL') : main_core.Loc.getMessage('SIGN_SIGNERS_SIGNERS_GRID_DELETE_HINT_FAIL');
						try {
							const response = await this.#api.signersList.deleteSignersFromList(listId, userIds, false);
							if (response.errors?.length > 0) {
								throw new Error(response.errors[0].message);
							}
							this.#updateCreateChatMenuItem(listId, response.hasSigners);
							window.top.BX.UI.Notification.Center.notify({
								content: successMsg
							});
						} catch {
							window.top.BX.UI.Notification.Center.notify({
								content: failMsg
							});
						}
						await this.reloadSigners();
						button.getContext().close();
					}
				}), new BX.UI.Button({
					text: main_core.Loc.getMessage('SIGN_SIGNERS_GRID_DELETE_POPUP_NO'),
					color: BX.UI.Button.Color.LINK,
					onclick: button => button.getContext().close()
				})]
			});
		}
		async createList() {
			try {
				const createListPopup = new CreateListPopup();
				const title = await createListPopup.show();
				const response = await this.#api.signersList.createList(title, false);
				if (response.errors?.length > 0) {
					throw new Error(response.errors[0].message);
				}
				window.top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SIGN_SIGNERS_GRID_LIST_CREATE_SUCCESS')
				});
			} catch {
				window.top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SIGN_SIGNERS_GRID_LIST_CREATE_FAIL')
				});
			}
			await this.reloadLists();
		}
		async renameList(listId, title) {
			try {
				const createListPopup = new CreateListPopup();
				const newTitle = await createListPopup.show(title);
				const response = await this.#api.signersList.renameList(listId, newTitle, false);
				if (response.errors?.length > 0) {
					throw new Error(response.errors[0].message);
				}
				window.top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SIGN_SIGNERS_GRID_LIST_RENAME_SUCCESS')
				});
			} catch {
				window.top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SIGN_SIGNERS_GRID_LIST_RENAME_FAIL')
				});
			}
			await this.reloadLists();
		}
		async addSigners(listId, entities, excludeRejected = true) {
			const members = entities.map(entity => ({
				...entity,
				party: 2
			}));
			// Errors are reported by the api layer: it shows the server message and rethrows
			const response = await this.#api.signersList.addSignersToList(listId, members, excludeRejected);
			const sliderManager = window.top.BX.SidePanel.Instance;
			const addingSlider = sliderManager.getSliderByWindow(window);
			const eventEmitter = window.top.BX.Event.EventEmitter;
			const handleCloseCompleted = async event => {
				const [sliderEvent] = event.getData();
				if (sliderEvent?.getSlider() !== addingSlider) {
					return;
				}
				eventEmitter.unsubscribe('SidePanel.Slider:onCloseComplete', handleCloseCompleted);
				this.#updateCreateChatMenuItem(listId, response.hasSigners);
			};
			eventEmitter.subscribe('SidePanel.Slider:onCloseComplete', handleCloseCompleted);
			addingSlider.close();
			await this.reloadSigners();
		}
		async createChat(listId) {
			const response = await this.#api.signersList.createChat(listId);
			const chatId = response.chatId;
			const warning = response.warning;
			if (warning) {
				window.top.BX.UI.Notification.Center.notify({
					content: warning
				});
			}
			await BX.Runtime.loadExtension('im.public.iframe');
			top.BX.Messenger.Public.openChat(`chat${chatId}`);
		}
		async handleAddSignersButtonClick(listId, userParty) {
			if (!userParty.validate()) {
				return;
			}
			const listGrid = new BX.Sign.V2.Grid.B2e.Signers();
			try {
				await listGrid.addSigners(listId, userParty.getEntities(), userParty.isRejectExcludedEnabled());
			} catch {
				// The user is already notified; keep the slider open so the selection can be fixed
			}
		}

		/**
		 * The refusal the author can act on comes with a known domain code and a localized message.
		 * Transport failures of the request layer carry technical text, so they get no message here.
		 */
		#getFeedRecipientsRefusal(errors) {
			const refusal = errors.find(error => error?.code === FEED_RECIPIENTS_LIMIT_ERROR_CODE);
			return refusal?.message ?? null;
		}
		#notifyWriteToFeedFailure(message = null) {
			window.top.BX.UI.Notification.Center.notify({
				content: main_core.Type.isStringFilled(message) ? main_core.Text.encode(message) : main_core.Loc.getMessage('SIGN_SIGNERS_GRID_WRITE_TO_FEED_HINT_FAIL')
			});
		}
		#setPinActive(button, isActive) {
			main_core.Dom.toggleClass(button, BX.Grid.CellActionState.ACTIVE, isActive);
		}
		#getDeleteListMessage(listTitle) {
			if (!main_core.Type.isStringFilled(listTitle)) {
				return main_core.Loc.getMessage('SIGN_SIGNERS_DELETE_CONFIRMATION_MESSAGE');
			}

			// The title comes from the grid row as is (the template only escapes it for the JS string),
			// and the message goes to MessageBox as an HTML string — encode before interpolation.
			return main_core.Loc.getMessage('SIGN_SIGNERS_DELETE_CONFIRMATION_MESSAGE_WITH_NAME', {
				'#TITLE#': main_core.Text.encode(listTitle)
			});
		}
		#getExportTarget() {
			const existingIframe = document.getElementById(EXPORT_IFRAME_ID);
			if (main_core.Type.isElementNode(existingIframe) && main_core.Type.isStringFilled(existingIframe.name)) {
				return existingIframe.name;
			}
			const iframeName = `${EXPORT_IFRAME_NAME_PREFIX}${main_core.Text.getRandom()}`;
			const iframe = main_core.Tag.render`
			<iframe
				id="${EXPORT_IFRAME_ID}"
				name="${iframeName}"
				hidden
				tabindex="-1"
				aria-hidden="true"
			></iframe>
		`;
			main_core.Dom.append(iframe, document.body);
			return iframeName;
		}
		#getGridManager() {
			if (BX.Main.gridManager) {
				return BX.Main.gridManager;
			}
			const previousSlider = BX.SidePanel.Instance.getPreviousSlider(BX.SidePanel.Instance.getSliderByWindow(window));
			const gridWindow = previousSlider ? previousSlider.getWindow() : window.top;
			return gridWindow?.BX.Main.gridManager;
		}
		#updateCreateChatMenuItem(listId, hasSigners) {
			const sliderWindow = window.top.BX.SidePanel.Instance.getTopSlider()?.getWindow();
			const toolbarSettingsButtonNode = sliderWindow?.document.querySelector(`[data-role="signers-settings-button-${listId}"]`);
			if (!main_core.Type.isDomNode(toolbarSettingsButtonNode)) {
				return;
			}
			const toolbar = sliderWindow?.BX.UI.ToolbarManager?.getDefaultToolbar();
			const toolbarSettingsButton = toolbar?.getButton(toolbarSettingsButtonNode.dataset.btnUniqid);
			const createChatMenuItem = toolbarSettingsButton?.getMenuWindow()?.getMenuItem(`sign-b2e-signers-create-chat-${listId}`);
			if (!createChatMenuItem) {
				return;
			}
			main_core.Dom.toggleClass(createChatMenuItem.getContainer(), '--hidden', !hasSigners);
		}
	}

	exports.Signers = Signers;

})(this.BX.Sign.V2.Grid.B2e = this.BX.Sign.V2.Grid.B2e || {}, BX, BX.UI, BX.UI.Dialogs, BX.Sign.V2, BX.UI, BX.UI.Notification, BX.Main);
//# sourceMappingURL=signers.bundle.js.map
