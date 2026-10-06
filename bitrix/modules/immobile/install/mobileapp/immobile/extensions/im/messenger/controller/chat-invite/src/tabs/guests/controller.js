/**
 * @module im/messenger/controller/chat-invite/tabs/guests/controller
 */
jn.define('im/messenger/controller/chat-invite/tabs/guests/controller', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { getFormattedNumber } = require('utils/phone');
	const { createTestIdGenerator } = require('utils/test');
	const { Notify } = require('notify');
	const { Haptics } = require('haptics');
	const { Alert, makeCancelButton, makeDestructiveButton } = require('alert');
	const { Indent } = require('tokens');
	const { makeLibraryImagePath } = require('im/messenger/assets');
	const { Avatar, AvatarEntityType } = require('ui-system/blocks/avatar');
	const { UIMenu } = require('layout/ui/menu');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { SharingLinkService } = require('im/messenger/provider/services/sharing-link');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	const { GuestInviteImage } = require('im/messenger/controller/chat-invite/const');
	const { GuestsTabView } = require('im/messenger/controller/chat-invite/tabs/guests/view');
	const { buildInviteCasesMenuItems } = require('im/messenger/controller/chat-invite/tabs/guests/menu');
	const {
		showSuccessInvitationToast,
		showRegenerateLinkSuccessToast,
		showGenericErrorToast,
	} = require('im/messenger/controller/chat-invite/feedback');
	const { buildDismissAlertConfig } = require('im/messenger/controller/chat-invite/dismiss-alert');

	const ErrorCode = {
		ACCESS_DENIED: 'ACCESS_DENIED',
	};

	/**
	 * @class GuestsTabController
	 */
	class GuestsTabController
	{
		/**
		 * @param {GuestsTabControllerProps} props
		 */
		constructor(props)
		{
			this.props = props;
			this.logger = getLoggerWithContext('chat-invite--guests-tab-controller', this);
			this.sharingLinkService = new SharingLinkService();
			this.view = null;
			this.inviteByEmailBoxRef = null;
			this.nameCheckerInstance = null;
			this.onClose = null;
			this.getTestId = createTestIdGenerator({
				prefix: 'guest-chat-invite-guests-tab',
			});
		}

		/**
		 * @return {GuestsTabView}
		 */
		createView()
		{
			this.view = new GuestsTabView({
				getTestId: this.getTestId,
				onInviteByLink: this.#handleInviteByLink,
				onRegenerateLink: this.#handleRegenerateLink,
				onOpenCasesMenu: this.#openOtherInviteCasesMenu,
			});

			return this.view;
		}

		/**
		 * @param {RestErrors|Error} errors
		 * @param {string} context short description of the failed operation for logs
		 */
		#onApiError = (errors, context) => {
			const errorCode = errors?.[0]?.code;

			switch (errorCode)
			{
				case ErrorCode.ACCESS_DENIED:
					Haptics.notifyWarning();
					Alert.alert(
						Loc.getMessage('IMMOBILE_CHAT_INVITE_PERMISSIONS_ALERT_TITLE'),
						Loc.getMessage('IMMOBILE_CHAT_INVITE_PERMISSIONS_ALERT_DESCRIPTION'),
						() => {},
						Loc.getMessage('IMMOBILE_CHAT_INVITE_PERMISSIONS_ALERT_CONTINUE_BUTTON'),
					);

					return;

				default:
					Haptics.notifyWarning();
					this.logger.error(context, errors);
					showGenericErrorToast();
			}
		};

		/**
		 * @returns {number}
		 */
		#getChatId = () => {
			const { dialogId, store } = this.props;
			const dialog = store.getters['dialoguesModel/getById'](dialogId);
			if (!dialog?.chatId)
			{
				throw new Error('GuestsTabController: chatId not found for dialog');
			}

			return dialog.chatId;
		};

		/**
		 * @desc "Invite by link" flow: generate link, open native share sheet.
		 */
		#handleInviteByLink = async () => {
			await Notify.showIndicatorLoading();

			let link = null;
			try
			{
				const guestLink = await this.sharingLinkService.generateGuestLink(this.#getChatId());
				link = guestLink?.url ?? null;
			}
			catch (errors)
			{
				this.#onApiError(errors, 'generateGuestLink error');
			}
			finally
			{
				Notify.hideCurrentIndicator();
			}

			if (link)
			{
				dialogs.showSharingDialog({ message: link }, this.props.boxLayout);
				AnalyticsService.getInstance().sendCopyGuestLink(this.props.dialogId);
			}
		};

		/**
		 * @desc "Regenerate link" flow: show confirm, regenerate link, toast on success.
		 */
		#handleRegenerateLink = () => {
			Alert.confirm(
				Loc.getMessage('IMMOBILE_CHAT_INVITE_TAB_GUESTS_REGENERATE_CONFIRM_TITLE'),
				Loc.getMessage('IMMOBILE_CHAT_INVITE_TAB_GUESTS_REGENERATE_CONFIRM_DESCRIPTION'),
				[
					makeDestructiveButton(
						Loc.getMessage('IMMOBILE_CHAT_INVITE_TAB_GUESTS_REGENERATE_CONFIRM_OK_BUTTON'),
						this.#doRegenerateLink,
					),
					makeCancelButton(
						() => {},
						Loc.getMessage('IMMOBILE_CHAT_INVITE_TAB_GUESTS_REGENERATE_CONFIRM_CANCEL_BUTTON'),
					),
				],
			);
		};

		#doRegenerateLink = async () => {
			await Notify.showIndicatorLoading();

			let newLinkUrl = null;
			try
			{
				const guestLink = await this.sharingLinkService.regenerateGuestLink(this.#getChatId());
				newLinkUrl = guestLink?.url ?? null;
			}
			catch (errors)
			{
				this.#onApiError(errors, 'regenerateGuestLink error');
			}
			finally
			{
				Notify.hideCurrentIndicator();
			}

			if (newLinkUrl)
			{
				Application.copyToClipboard(newLinkUrl);
				Haptics.notifySuccess();
				AnalyticsService.getInstance().sendCopyGuestLink(this.props.dialogId);
				await this.#closeInviteBox();
				showRegenerateLinkSuccessToast();
			}
		};

		/**
		 * @param {any} targetRef ref of the button UIMenu should anchor to
		 */
		#openOtherInviteCasesMenu = async (targetRef) => {
			const menu = new UIMenu(buildInviteCasesMenuItems({
				getTestId: this.getTestId,
				onSelectContacts: () => this.#openSmartphoneContactsList(),
				onSelectEmail: async () => { await this.#openEmailInputBox(); },
				onSelectQR: async () => { await this.#openQRInviteBox(); },
			}));
			menu.show({ target: targetRef });
		};

		/**
		 * @desc Opens native smartphone contacts picker for phone-based invitations.
		 */
		async #openSmartphoneContactsList()
		{
			const { SmartphoneContactSelector } = await requireLazy('layout/ui/smartphone-contact-selector');
			const controlInstance = new SmartphoneContactSelector({
				avatarType: AvatarEntityType.DEFAULT,
				allowMultipleSelection: true,
				parentLayout: this.props.layout,
				closeAfterSendButtonClick: false,
				onSendButtonClickHandler: this.#processContacts,
				dismissAlert: buildDismissAlertConfig(),
			});

			void controlInstance.open();
		}

		/**
		 * @param {Array<SmartphoneContact>} selectedContacts
		 * @param {object} selectorInstance SmartphoneContactSelector instance
		 */
		#processContacts = async (selectedContacts, selectorInstance) => {
			if (!Type.isArrayFilled(selectedContacts))
			{
				return;
			}

			selectorInstance.close(() => {
				this.#openNameCheckerForPhones(
					selectedContacts.map((contact) => ({
						phone: contact.phone,
						firstName: contact.name || null,
						formattedPhone: getFormattedNumber(contact.phone),
						id: contact.phone,
					})),
				)
					.then((instance) => {
						this.nameCheckerInstance = instance;
					})
					.catch((error) => {
						this.logger.error('processContacts: openNameCheckerForPhones error', error);
					});
			});
		};

		/**
		 * @param {Array<NameCheckerPhoneUser>} usersToInvite
		 * @return {Promise<object>} name-checker box instance
		 */
		#openNameCheckerForPhones = async (usersToInvite) => {
			const { openNameChecker } = await requireLazy('layout/ui/name-checker-box');

			return openNameChecker({
				parentLayout: this.props.layout,
				usersToInvite,
				alreadyInvitedUsers: [],
				inviteButtonText: Loc.getMessage('IMMOBILE_CHAT_INVITE_NAME_CHECKER_INVITE_BUTTON_TEXT'),
				boxTitle: Loc.getMessage('IMMOBILE_CHAT_INVITE_NAME_CHECKER_TITLE_PHONE'),
				description: Loc.getMessage('IMMOBILE_CHAT_INVITE_NAME_CHECKER_DESCRIPTION_PHONE'),
				subdescription: '',
				renderAvatar: this.#renderNameCheckerAvatar,
				infoAreaGraphicsUri: makeLibraryImagePath(GuestInviteImage.name, GuestInviteImage.library),
				getItemFormattedSubDescription: this.#getPhoneItemFormattedSubDescription,
				getAlreadyInvitedUsersStringForSubtitle: () => '',
				onSendInviteButtonClick: this.#onSendPhoneInviteButtonClick,
				avatarEntityType: AvatarEntityType.DEFAULT,
				dismissAlert: buildDismissAlertConfig(),
			});
		};

		/**
		 * @param {Array<NameCheckerPhoneUser>} usersToInvite
		 */
		#onSendPhoneInviteButtonClick = async (usersToInvite) => {
			const invitations = usersToInvite.map((user) => ({
				phone: user.phone,
				name: user.firstName || null,
			}));

			await Notify.showIndicatorLoading();
			try
			{
				await this.sharingLinkService.inviteGuestsByPhone(this.#getChatId(), invitations);
				await this.#closeInviteBox();
				showSuccessInvitationToast({
					dialogId: this.props.dialogId,
					multipleInvitation: invitations.length > 1,
					isTextForInvite: true,
				});
			}
			catch (errors)
			{
				this.nameCheckerInstance?.enableSendButtonLoadingIndicator(false);
				this.#onApiError(errors, 'inviteGuestsByPhone error');
			}
			finally
			{
				Notify.hideCurrentIndicator();
			}
		};

		/**
		 * @desc Opens email-input box for email-based invitations.
		 */
		#openEmailInputBox = async () => {
			const { openEmailInputBox } = await requireLazy('layout/ui/email-input-box');
			this.inviteByEmailBoxRef = await openEmailInputBox({
				testId: this.getTestId(),
				parentLayout: this.props.layout,
				title: Loc.getMessage('IMMOBILE_CHAT_INVITE_EMAIL_BOX_TITLE'),
				bottomButtonText: Loc.getMessage('IMMOBILE_CHAT_INVITE_EMAIL_BOX_INVITE_BUTTON_TEXT'),
				inputPlaceholder: Loc.getMessage('IMMOBILE_CHAT_INVITE_EMAIL_BOX_INPUT_PLACEHOLDER'),
				onButtonClick: this.#processEmails,
				dismissAlert: buildDismissAlertConfig(),
			});
		};

		/**
		 * @param {Array<string>} emails
		 */
		#processEmails = async (emails) => {
			if (!Type.isArrayFilled(emails))
			{
				return;
			}

			const seenEmails = new Set();
			const uniqueEmails = emails.filter((email) => {
				const key = email.toLowerCase();
				if (seenEmails.has(key))
				{
					return false;
				}
				seenEmails.add(key);

				return true;
			});
			const usersToInvite = uniqueEmails.map((email) => ({
				email,
				id: email,
			}));

			this.inviteByEmailBoxRef?.close(async () => {
				this.nameCheckerInstance = await this.#openNameCheckerForEmails(usersToInvite);
			});
		};

		/**
		 * @param {Array<NameCheckerEmailUser>} usersToInvite
		 * @return {Promise<object>} name-checker box instance
		 */
		#openNameCheckerForEmails = async (usersToInvite) => {
			const { openNameChecker } = await requireLazy('layout/ui/name-checker-box');

			return openNameChecker({
				parentLayout: this.props.layout,
				usersToInvite,
				alreadyInvitedUsers: [],
				inviteButtonText: Loc.getMessage('IMMOBILE_CHAT_INVITE_NAME_CHECKER_INVITE_BUTTON_TEXT'),
				boxTitle: Loc.getMessage('IMMOBILE_CHAT_INVITE_NAME_CHECKER_TITLE_EMAIL'),
				description: Loc.getMessage('IMMOBILE_CHAT_INVITE_NAME_CHECKER_DESCRIPTION_EMAIL'),
				subdescription: '',
				renderAvatar: this.#renderNameCheckerAvatar,
				infoAreaGraphicsUri: makeLibraryImagePath(GuestInviteImage.name, GuestInviteImage.library),
				onSendInviteButtonClick: this.#onSendEmailInviteButtonClick,
				getItemFormattedSubDescription: this.#getEmailItemFormattedSubDescription,
				getAlreadyInvitedUsersStringForSubtitle: () => '',
				avatarEntityType: AvatarEntityType.DEFAULT,
				dismissAlert: buildDismissAlertConfig(),
			});
		};

		/**
		 * @param {Array<NameCheckerEmailUser>} usersToInvite
		 */
		#onSendEmailInviteButtonClick = async (usersToInvite) => {
			const invitations = usersToInvite.map((user) => ({
				email: user.email,
				name: user.firstName || null,
			}));

			await Notify.showIndicatorLoading();
			try
			{
				await this.sharingLinkService.inviteGuestsByEmail(this.#getChatId(), invitations);
				await this.#closeInviteBox();
				showSuccessInvitationToast({
					dialogId: this.props.dialogId,
					multipleInvitation: invitations.length > 1,
					isTextForInvite: true,
				});
			}
			catch (errors)
			{
				this.nameCheckerInstance?.enableSendButtonLoadingIndicator(false);
				this.#onApiError(errors, 'inviteGuestsByEmail error');
			}
			finally
			{
				Notify.hideCurrentIndicator();
			}
		};

		/**
		 * @desc Opens QR-code box with the freshly generated guest link.
		 */
		#openQRInviteBox = async () => {
			const { QRInvite, QrEntity } = await requireLazy('layout/ui/qr-invite');

			await Notify.showIndicatorLoading();

			let link = null;
			try
			{
				const guestLink = await this.sharingLinkService.generateGuestLink(this.#getChatId());
				link = guestLink?.url ?? null;
			}
			catch (errors)
			{
				this.#onApiError(errors, 'QR generateGuestLink error');
			}
			finally
			{
				Notify.hideCurrentIndicator();
			}

			if (!link)
			{
				return;
			}

			await QRInvite.open({
				entityType: QrEntity.GROUP_CHAT,
				parentWidget: this.props.layout,
				loadUri: async () => link,
				entityName: '',
				avatarUri: null,
			});
		};

		/**
		 * @desc Closes the whole invite widget. Memoizes the close promise for parallel callers.
		 * @return {Promise<void>}
		 */
		#closeInviteBox = async () => {
			const { boxLayout } = this.props;
			if (!this.onClose)
			{
				this.onClose = new Promise((resolve) => {
					if (boxLayout?.close)
					{
						boxLayout.close(resolve);
					}
					else
					{
						resolve();
					}
				});
			}

			return this.onClose;
		};

		/**
		 * @return {LayoutComponent} default avatar element for name-checker rows
		 */
		#renderNameCheckerAvatar = () => {
			return Avatar({
				testId: 'chat-invite-empty-avatar',
				entityType: AvatarEntityType.DEFAULT,
				size: 36,
				style: { marginRight: Indent.L.toNumber() },
			});
		};

		/**
		 * @param {NameCheckerPhoneUser} user
		 * @return {string}
		 */
		#getPhoneItemFormattedSubDescription = (user) => {
			return Loc.getMessage('IMMOBILE_CHAT_INVITE_NAME_CHECKER_PHONE_ITEM_SUBDESCRIPTION_TEXT', {
				'#phone#': getFormattedNumber(user.formattedPhone),
			});
		};

		/**
		 * @param {NameCheckerEmailUser} user
		 * @return {string}
		 */
		#getEmailItemFormattedSubDescription = (user) => {
			return Loc.getMessage('IMMOBILE_CHAT_INVITE_NAME_CHECKER_EMAIL_ITEM_SUBDESCRIPTION_TEXT', {
				'#email#': user.email?.toLowerCase(),
			});
		};
	}

	module.exports = { GuestsTabController };
});
