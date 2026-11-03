/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, ui_notification, ui_system_dialog, im_public, im_v2_lib_opener, ui_buttons, ui_iconSet_api_core, ui_iconSet_outline, ui_system_typography, ui_entitySelector) {
	'use strict';

	const SelfDeletePopupScenario = Object.freeze({
		NotLastAdmin: 'NotLastAdmin',
		LastAdminPayedLicense: 'LastAdminPayedLicense',
		LastAdminFreeLicense: 'LastAdminFreeLicense',
		LastAdmin: 'LastAdmin'
	});
	const SelfDeletePopupElementId = Object.freeze({
		Popup: 'intranet-self-delete-popup',
		CloseButton: 'intranet-self-delete-popup-close-button',
		Participants: 'intranet-self-delete-popup-participants',
		ParticipantsInput: 'intranet-self-delete-popup-participants-input',
		ParticipantsPopup: 'intranet-self-delete-popup-participants-popup',
		CreateChatButton: 'intranet-self-delete-popup-create-chat-button',
		CancelButton: 'intranet-self-delete-popup-cancel-button',
		OpenSettingsButton: 'intranet-self-delete-popup-open-settings-button',
		TransferRightsButton: 'intranet-self-delete-popup-transfer-rights-button',
		ContinueButton: 'intranet-self-delete-popup-continue-button',
		SupportEmailLink: 'intranet-self-delete-popup-support-email-link'
	});
	const DefaultSupportEmail = main_core.Extension.getSettings('intranet.user.self-delete-popup').supportEmail || 'privacy@bitrix24.com';
	const PortalDeleteUrl = '/settings/configs/?page=configuration&option=settings-configuration-section-delete-portal';
	const TransferRightsHelpdeskCode = 'redirect=detail&code=26764700';

	class BaseScreen {
		#options = {};
		#actions = {};
		constructor(options, actions) {
			this.#options = options;
			this.#actions = actions;
		}
		render() {
			const closeIcon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.CROSS_L,
				size: 24,
				hoverMode: ui_iconSet_api_core.IconHoverMode.DEFAULT
			});
			const descriptionNode = main_core.Tag.render`
			<div class="intranet-self-delete-popup__description">
				${ui_system_typography.Headline.render(this.getTitle(), {
			size: 'lg',
			className: 'intranet-self-delete-popup__title'
		})}
			</div>
		`;
			const contentNode = main_core.Tag.render`
			<div class="intranet-self-delete-popup__content"></div>
		`;
			const content = main_core.Tag.render`
			<div class="intranet-self-delete-popup">
				<button
					id="${SelfDeletePopupElementId.CloseButton}"
					type="button"
					class="intranet-self-delete-popup__close-btn"
					aria-label="${main_core.Text.encode(main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_CANCEL') ?? 'INTRANET_SELF_DELETE_POPUP_CANCEL')}"
					data-testid="${SelfDeletePopupElementId.CloseButton}"
					onclick="${() => this.getActions().cancel()}"
				>
					${closeIcon.render()}
				</button>
				<div class="intranet-self-delete-popup__hero">
					${descriptionNode}
				</div>
				${contentNode}
			</div>
		`;
			const buttons = this.getButtons();
			this.renderDescription().forEach(descriptionItem => descriptionNode?.append(descriptionItem));
			const body = this.renderBody();
			if (body) {
				contentNode?.append(body);
			} else if (contentNode) {
				main_core.Dom.addClass(contentNode, '--empty');
			}
			if (buttons.length > 0) {
				const footerButtonsNode = main_core.Tag.render`
				<div class="intranet-self-delete-popup__footer-buttons" data-role="footer-buttons"></div>
			`;
				const footer = main_core.Tag.render`
				<div class="intranet-self-delete-popup__footer">
					${footerButtonsNode}
				</div>
			`;
				buttons.forEach(button => {
					main_core.Dom.append(button.render(), footerButtonsNode);
				});
				main_core.Dom.append(footer, content);
			}
			return {
				content
			};
		}
		getOptions() {
			return this.#options;
		}
		getActions() {
			return this.#actions;
		}
		createParagraph(message) {
			return ui_system_typography.Text.render(message, {
				tag: 'p',
				size: 'md',
				className: 'intranet-self-delete-popup__paragraph'
			});
		}
		createButton(config) {
			const className = ['intranet-self-delete-popup__button', config.className ?? ''].filter(Boolean).join(' ');
			const button = new ui_buttons.Button({
				text: config.text,
				useAirDesign: true,
				style: config.style,
				size: ui_buttons.ButtonSize.MEDIUM,
				className,
				noCaps: true,
				disabled: config.disabled ?? false,
				props: config.id ? {
					id: config.id
				} : {},
				dataset: config.id ? {
					testid: config.id
				} : {},
				onclick: () => config.onClick(button)
			});
			return button;
		}
		renderDescription() {
			return this.getDescriptionMessages().map(message => this.createParagraph(message));
		}
		renderBody() {
			return null;
		}
		getTitle() {
			throw new Error('BaseScreen.getTitle must be implemented');
		}
		getDescriptionMessages() {
			throw new Error('BaseScreen.getDescriptionMessages must be implemented');
		}
		getButtons() {
			throw new Error('BaseScreen.getButtons must be implemented');
		}
		getFilledButtonStyle() {
			return ui_buttons.AirButtonStyle.FILLED;
		}
		getOutlineButtonStyle() {
			return ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT;
		}
	}

	class FreeLicenseScreen extends BaseScreen {
		getTitle() {
			return main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_TITLE_CANNOT_DELETE');
		}
		getDescriptionMessages() {
			return [main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_MESSAGE_FREE_LICENSE_FIRST'), main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_MESSAGE_FREE_LICENSE_SECOND')];
		}
		getButtons() {
			return [this.createButton({
				id: SelfDeletePopupElementId.OpenSettingsButton,
				text: main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_BUTTON_OPEN_SETTINGS'),
				style: this.getFilledButtonStyle(),
				onClick: button => this.getActions().openPortalDelete(button)
			}), this.createButton({
				id: SelfDeletePopupElementId.TransferRightsButton,
				text: main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_BUTTON_TRANSFER_RIGHTS'),
				style: this.getOutlineButtonStyle(),
				onClick: button => this.getActions().openTransferRights(button)
			})];
		}
	}

	class PaidLicenseScreen extends BaseScreen {
		getTitle() {
			return main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_TITLE_TRANSFER_RIGHTS');
		}
		getDescriptionMessages() {
			return [main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_MESSAGE_PAID_LICENSE_FIRST')];
		}
		renderDescription() {
			const paidLicenseMessage = main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_MESSAGE_PAID_LICENSE_SECOND', this.#createSupportEmailLinkReplacements());
			return [...super.renderDescription(), main_core.Tag.render`
				<p class="intranet-self-delete-popup__paragraph">
					<span class="ui-text --md">
						${paidLicenseMessage}
					</span>
				</p>
			`];
		}
		#createSupportEmailLinkReplacements() {
			return {
				'[EMAIL]': `
				<a
					href="mailto:${this.getOptions().supportEmail}"
					class="ui-text -md intranet-self-delete-popup__accent"
					data-testid="${SelfDeletePopupElementId.SupportEmailLink}"
				>${this.getOptions().supportEmail}
			`,
				'[/EMAIL]': '</a>'
			};
		}
		getButtons() {
			return [this.createButton({
				id: SelfDeletePopupElementId.TransferRightsButton,
				text: main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_BUTTON_TRANSFER_RIGHTS'),
				style: this.getFilledButtonStyle(),
				onClick: button => this.getActions().openTransferRights(button)
			}), this.createButton({
				id: SelfDeletePopupElementId.CancelButton,
				text: main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_CANCEL'),
				style: this.getOutlineButtonStyle(),
				onClick: () => this.getActions().cancel()
			})];
		}
	}

	class PortalDeleteScreen extends BaseScreen {
		getTitle() {
			return main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_TITLE_PROFILE_DELETE');
		}
		getDescriptionMessages() {
			return [main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_MESSAGE_LAST_ADMIN'), main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_MESSAGE_LAST_ADMIN_PORTAL_DELETE')];
		}
		getButtons() {
			return [this.createButton({
				id: SelfDeletePopupElementId.ContinueButton,
				text: main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_BUTTON_CONTINUE'),
				style: this.getFilledButtonStyle(),
				onClick: button => this.getActions().openPortalDelete(button)
			}), this.createButton({
				id: SelfDeletePopupElementId.CancelButton,
				text: main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_CANCEL'),
				style: this.getOutlineButtonStyle(),
				onClick: () => this.getActions().cancel()
			})];
		}
	}

	class RequestChatScreen extends BaseScreen {
		#createChatButton = null;
		#participantSelector = null;
		getTitle() {
			return main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_TITLE_PROFILE_DELETE');
		}
		getDescriptionMessages() {
			return [main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_MESSAGE_REQUEST_CHAT')];
		}
		renderBody() {
			const participantsNode = main_core.Tag.render`
			<div
				class="intranet-self-delete-popup__participant-box"
				data-testid="${SelfDeletePopupElementId.Participants}"
			></div>
		`;
			const content = main_core.Tag.render`
			<div class="intranet-self-delete-popup__card">
				${ui_system_typography.Headline.render(main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_CHAT_CARD_TITLE'), {
			size: 'sm',
			className: 'intranet-self-delete-popup__card-title'
		})}
				${ui_system_typography.Text.render(main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_CHAT_CARD_DESCRIPTION'), {
			tag: 'div',
			size: 'md',
			className: 'intranet-self-delete-popup__card-description'
		})}
				${participantsNode}
			</div>
		`;
			this.#participantSelector = this.#createParticipantSelector();
			this.getActions().setParticipants([]);
			this.#participantSelector.renderTo(participantsNode);
			return content;
		}
		getButtons() {
			this.#createChatButton = this.createButton({
				id: SelfDeletePopupElementId.CreateChatButton,
				text: main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_BUTTON_CREATE_CHAT'),
				style: this.getFilledButtonStyle(),
				disabled: true,
				onClick: button => this.getActions().createChat(button)
			});
			return [this.#createChatButton, this.createButton({
				id: SelfDeletePopupElementId.CancelButton,
				text: main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_CANCEL'),
				style: this.getOutlineButtonStyle(),
				onClick: () => this.getActions().cancel()
			})];
		}
		#createParticipantSelector() {
			const participantSelector = new ui_entitySelector.TagSelector({
				id: SelfDeletePopupElementId.Participants,
				textBoxAutoHide: true,
				textBoxWidth: 350,
				maxHeight: 99,
				showAddButton: true,
				showCreateButton: false,
				placeholder: main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_ADD_PARTICIPANT'),
				multiple: true,
				events: {
					onTagAdd: this.handleSelectorChange.bind(this),
					onTagRemove: this.handleSelectorChange.bind(this)
				},
				dialogOptions: {
					id: SelfDeletePopupElementId.ParticipantsPopup,
					context: 'intranet-self-delete-popup',
					width: 390,
					height: 320,
					compactView: true,
					dropdownMode: true,
					enableSearch: true,
					cacheable: true,
					showAvatars: true,
					multiple: true,
					hideOnDeselect: false,
					entities: [{
						id: 'user',
						options: {
							intranetUsersOnly: true,
							userId: this.getOptions().adminIds,
							inviteEmployeeLink: false
						}
					}]
				}
			});
			participantSelector.getTextBox().id = SelfDeletePopupElementId.ParticipantsInput;
			participantSelector.getTextBox().dataset.testid = SelfDeletePopupElementId.ParticipantsInput;
			return participantSelector;
		}
		handleSelectorChange() {
			const participants = this.#mapSelectedItemsToParticipants(this.#participantSelector?.getTags() ?? []);
			this.getActions().setParticipants(participants);
			this.#createChatButton?.setDisabled(participants.length === 0);
		}
		#mapSelectedItemsToParticipants(selectedItems) {
			return selectedItems.filter(participant => this.#filterSelectedItemParticipant(participant)).map(participant => this.#mapSelectedItemToParticipant(participant));
		}
		#filterSelectedItemParticipant(participant) {
			if (!main_core.Type.isObjectLike(participant) || !main_core.Type.isFunction(participant.getEntityId) || !main_core.Type.isFunction(participant.getId) || !main_core.Type.isFunction(participant.getTitle)) {
				return false;
			}
			const participantId = Number(participant.getId());
			return participant.getEntityId() === 'user' && main_core.Type.isInteger(participantId) && participantId > 0 && main_core.Type.isStringFilled(participant.getTitle());
		}
		#mapSelectedItemToParticipant(participant) {
			const avatarUrl = main_core.Type.isFunction(participant.getAvatar) ? participant.getAvatar() : null;
			return {
				id: Number(participant.getId()),
				name: participant.getTitle().trim(),
				avatarUrl: main_core.Type.isStringFilled(avatarUrl) ? avatarUrl.trim() : null
			};
		}
	}

	let currentPopup = null;
	let currentPopupPromise = null;
	class SelfDeletePopup {
		#dialog = null;
		#options = {};
		static async show(options = {}) {
			if (main_core.Type.isObject(options) && options.scenario) {
				const popup = new this(options);
				popup.show();
				return popup;
			}
			if (!currentPopupPromise) {
				currentPopupPromise = this.#showCurrentUserPopup().finally(() => {
					currentPopupPromise = null;
				});
			}
			return currentPopupPromise;
		}
		static async #getCurrentUserOptions() {
			const currentUserOptionsResult = await main_core.ajax.runAction('intranet.v2.SelfDelete.getOptionsForCurrentUser');
			return currentUserOptionsResult.data;
		}
		static async #showCurrentUserPopup() {
			const popupOptions = await this.#getCurrentUserOptions();
			if (currentPopup) {
				currentPopup.update(popupOptions);
			} else {
				currentPopup = new this(popupOptions);
			}
			currentPopup.show();
			return currentPopup;
		}
		constructor(options = {}) {
			this.#options = this.#normalizeOptions(options);
		}
		show() {
			if (!this.#dialog) {
				const view = this.#renderView();
				this.#dialog = this.#createDialog(view);
			}
			this.#dialog.show();
		}
		close() {
			this.#dialog?.hide();
		}
		destroy() {
			this.close();
			if (currentPopup === this) {
				currentPopup = null;
			}
		}
		update(options = {}) {
			this.#options = this.#normalizeOptions({
				...this.#options,
				...options
			});
			if (this.#dialog) {
				this.#applyView(this.#renderView());
			}
		}
		#createDialog(view) {
			return new ui_system_dialog.Dialog({
				content: view.content,
				closeByClickOutside: false,
				hasOverlay: true,
				closeByEsc: true,
				hasCloseButton: false,
				hasHorizontalPadding: false,
				hasVerticalPadding: false,
				events: {
					onAfterHide: () => {
						this.#dialog = null;
					}
				}
			});
		}
		#applyView(view) {
			this.#dialog.setContent(view.content);
		}
		#renderView() {
			let view = null;
			switch (this.#options.scenario) {
				case SelfDeletePopupScenario.NotLastAdmin:
					view = new RequestChatScreen(this.#options, this.#getScreenActions()).render();
					break;
				case SelfDeletePopupScenario.LastAdminFreeLicense:
					view = new FreeLicenseScreen(this.#options, this.#getScreenActions()).render();
					break;
				case SelfDeletePopupScenario.LastAdminPayedLicense:
					view = new PaidLicenseScreen(this.#options, this.#getScreenActions()).render();
					break;
				case SelfDeletePopupScenario.LastAdmin:
					view = new PortalDeleteScreen(this.#options, this.#getScreenActions()).render();
					break;
				default:
					throw new TypeError(`Unsupported self delete popup scenario: ${this.#options.scenario}`);
			}
			view.content.id = SelfDeletePopupElementId.Popup;
			view.content.dataset.testid = SelfDeletePopupElementId.Popup;
			return view;
		}
		#getScreenActions() {
			return {
				cancel: this.close.bind(this),
				createChat: button => {
					this.#runAction(() => this.#createRequestChat(), button);
				},
				openTransferRights: this.#openTransferRightsHelpdesk.bind(this),
				openPortalDelete: this.#openPortalDelete.bind(this),
				setParticipants: participants => {
					this.#options.participants = this.#normalizeParticipants(participants, this.#options.adminIds);
				}
			};
		}
		#runAction(callback, button = null) {
			if (!main_core.Type.isFunction(callback)) {
				return;
			}
			try {
				const result = callback();
				if (result) {
					button?.setWaiting(true);
					Promise.resolve(result).then(() => {
						button?.setWaiting(false);
					}).catch(error => {
						this.#handleActionError(error);
						button?.setWaiting(false);
					});
				}
			} catch (error) {
				this.#handleActionError(error);
				button?.setWaiting(false);
			}
		}
		async #createRequestChat() {
			const {
				data
			} = await main_core.ajax.runAction('intranet.v2.SelfDelete.createRequestChat', {
				data: {
					userIds: this.#options.participants.map(participant => participant.id)
				}
			});
			const {
				chatId,
				messageId,
				alreadyExists
			} = this.#normalizeCreatedChatData(data);
			if (chatId <= 0 || !alreadyExists && messageId <= 0) {
				throw new Error('Self delete request chat was not created');
			}
			await im_public.Messenger.openChat(`chat${chatId}`);
			this.close();
		}
		#normalizeCreatedChatData(data) {
			if (main_core.Type.isObjectLike(data)) {
				return {
					chatId: Number(data.chatId ?? data.CHAT_ID),
					messageId: Number(data.messageId ?? data.MESSAGE_ID) || 0,
					alreadyExists: data.alreadyExists === true || data.ALREADY_EXISTS === true
				};
			}
			return {
				chatId: Number(data),
				messageId: 0,
				alreadyExists: false
			};
		}
		#openTransferRightsHelpdesk() {
			BX.Helper.show(TransferRightsHelpdeskCode);
		}
		#openPortalDelete() {
			this.#openUrl(PortalDeleteUrl);
		}
		#openUrl(url) {
			if (!main_core.Type.isStringFilled(url)) {
				return;
			}
			const sidePanel = top.BX?.SidePanel?.Instance;
			if (sidePanel) {
				sidePanel.open(url);
				return;
			}
			top.window.location.href = url;
		}
		#handleActionError(error) {
			console.error(error);
			const message = main_core.Loc.getMessage('INTRANET_SELF_DELETE_POPUP_CREATE_CHAT_ERROR');
			if (main_core.Type.isStringFilled(message)) {
				const notificationCenter = top.BX?.UI?.Notification?.Center ?? ui_notification.UI.Notification.Center;
				if (main_core.Type.isFunction(notificationCenter?.notify)) {
					notificationCenter.notify({
						content: message,
						autoHide: true,
						useAirDesign: true
					});
				}
			}
		}
		#normalizeOptions(options = {}) {
			const supportEmail = options.supportEmail;
			const adminIds = this.#normalizeAdminIds(options.adminIds);
			const participants = this.#normalizeParticipants(options.participants, adminIds);
			return {
				scenario: this.#normalizeScenario(options.scenario),
				adminIds,
				participants,
				supportEmail: main_core.Type.isStringFilled(supportEmail) ? supportEmail.trim() : DefaultSupportEmail
			};
		}
		#normalizeScenario(scenario) {
			const availableScenarios = Object.values(SelfDeletePopupScenario);
			if (main_core.Type.isStringFilled(scenario) && availableScenarios.includes(scenario)) {
				return scenario;
			}
			throw new TypeError(`Unsupported self delete popup scenario: ${String(scenario)}`);
		}
		#normalizeParticipants(participants, adminIds = null) {
			if (!main_core.Type.isArray(participants)) {
				return [];
			}
			const hasAdminFilter = main_core.Type.isArray(adminIds) && adminIds.length > 0;
			return participants.map(participant => this.#normalizeParticipant(participant)).filter(participant => !main_core.Type.isNil(participant)).filter((participant, index, list) => {
				if (hasAdminFilter && !adminIds.includes(participant.id)) {
					return false;
				}
				return list.findIndex(item => item.id === participant.id) === index;
			});
		}
		#normalizeParticipant(participant) {
			if (!main_core.Type.isObjectLike(participant)) {
				return null;
			}
			const id = this.#getParticipantId(participant);
			const name = this.#getParticipantName(participant);
			if (!main_core.Type.isInteger(id) || id <= 0 || !main_core.Type.isStringFilled(name)) {
				return null;
			}
			return {
				id,
				name: name.trim(),
				avatarUrl: this.#getParticipantAvatarUrl(participant)
			};
		}
		#getParticipantId(participant) {
			const id = main_core.Type.isFunction(participant.getId) ? participant.getId() : participant.id;
			return Number(id);
		}
		#getParticipantName(participant) {
			if (main_core.Type.isFunction(participant.getTitle)) {
				return participant.getTitle();
			}
			if (main_core.Type.isString(participant.name)) {
				return participant.name;
			}
			return main_core.Type.isString(participant.title) ? participant.title : '';
		}
		#getParticipantAvatarUrl(participant) {
			const avatarUrl = main_core.Type.isFunction(participant.getAvatar) ? participant.getAvatar() : participant.avatarUrl ?? participant.avatar;
			return main_core.Type.isStringFilled(avatarUrl) ? avatarUrl.trim() : null;
		}
		#normalizeAdminIds(adminIds) {
			const ids = main_core.Type.isArray(adminIds) ? adminIds : [];
			return ids.map(id => Number(id)).filter((id, index, list) => Number.isInteger(id) && id > 0 && list.indexOf(id) === index);
		}
	}

	exports.SelfDeletePopup = SelfDeletePopup;
	exports.SelfDeletePopupScenario = SelfDeletePopupScenario;

})(this.BX.Intranet.User = this.BX.Intranet.User || {}, BX, BX.UI.Notification, BX.UI.System, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.UI, BX.UI.IconSet, window, BX.UI.System.Typography, BX.UI.EntitySelector);
//# sourceMappingURL=self-delete-popup.bundle.js.map
