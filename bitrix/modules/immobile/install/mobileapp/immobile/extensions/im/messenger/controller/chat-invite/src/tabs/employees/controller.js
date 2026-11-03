/**
 * @module im/messenger/controller/chat-invite/tabs/employees/controller
 */
jn.define('im/messenger/controller/chat-invite/tabs/employees/controller', (require, exports, module) => {
	const { Notify } = require('notify');
	const { Haptics } = require('haptics');
	const { Type } = require('type');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { MemberEntitySelector } = require('im/messenger/controller/selector/member-entity');

	const {
		showSuccessInvitationToast,
		showGenericErrorToast,
	} = require('im/messenger/controller/chat-invite/feedback');

	/**
	 * @class EmployeesTabController
	 */
	class EmployeesTabController
	{
		/**
		 * @param {EmployeesTabControllerProps} props
		 */
		constructor(props)
		{
			this.dialogId = props.dialogId;
			this.store = props.store;
			this.onCloseWidget = props.onCloseWidget;
			this.logger = getLoggerWithContext('chat-invite--employees-tab-controller', this);
			this.chatService = new ChatService();
			this.memberSelector = null;
			this.isInviteInProgress = false;
		}

		/**
		 * @param {LayoutWidget} layout
		 */
		init(layout)
		{
			if (!layout)
			{
				return;
			}

			// The construction is under the guard together with the opening: it builds the services
			// of the selector and can fail before there is a promise to take the refusal by.
			try
			{
				// Native tabs widget tears down the nested selector on tab deactivation, so the
				// stale instance is replaced instead of being closed: calling close() on it would
				// close the parent layout, since the selector is integrated into it.
				const selector = new MemberEntitySelector({
					dialogId: this.dialogId,
					integrateSelectorToParentLayout: true,
					// The integrated selector cannot report its own teardown: the nested
					// tabs widget delivers no close callback on Android, so the invite
					// must start right on selection instead of waiting for the view removal.
					onSelectMemberEntities: this.#onSelectMemberEntities,
				});

				this.memberSelector = selector;

				selector.open(layout).catch(this.#onInitFailed);
			}
			catch (error)
			{
				this.#onInitFailed(error);
			}
		}

		/**
		 * @desc Tells the user the tab has nothing to offer: a selector that never opened leaves
		 * the tab empty, and without a word the emptiness reads as a chat with nobody to add.
		 * @param {Error} error
		 */
		#onInitFailed = (error) => {
			this.memberSelector = null;
			this.logger.warn('MemberEntitySelector init error', error);
			Haptics.notifyWarning();
			showGenericErrorToast();
		};

		/**
		 * @desc Releases the stale selector reference. The integrated selector is torn down
		 * by the parent widget; we don't call close() on it to avoid closing the host layout.
		 */
		close()
		{
			this.memberSelector = null;
		}

		/**
		 * @param {Array<MemberEntity>} addedEntities the part of the selection the chat does not have yet
		 */
		#onSelectMemberEntities = async (addedEntities) => {
			// The selector hands the selection over and does not wait for the handler, so a failure
			// left here would become an unhandled rejection and the user would learn nothing of it.
			try
			{
				await this.#inviteEntities(addedEntities);
			}
			catch (error)
			{
				this.logger.error('onSelectMemberEntities error', error);
				Haptics.notifyWarning();
				showGenericErrorToast();
			}
		};

		/**
		 * @param {Array<MemberEntity>} addedEntities the part of the selection the chat does not have yet
		 * @return {Promise<void>}
		 */
		async #inviteEntities(addedEntities)
		{
			if (this.isInviteInProgress)
			{
				return;
			}

			const dialog = this.store.getters['dialoguesModel/getById'](this.dialogId);
			if (!dialog)
			{
				this.logger.warn('dialog is not in store', this.dialogId);
				this.onCloseWidget?.();

				return;
			}

			// The two calls take people and nodes and nothing else, so an element of any other type
			// never reaches the server. It is reported instead of being dropped: silence here reads
			// as "the whole selection went through".
			const {
				userIds,
				structureNodes,
				unsupportedEntities,
			} = MemberEntitySelector.splitEntities(addedEntities);

			// The no-op branch below still closes the widget explicitly: on Android the
			// integrated selector cannot dismiss its host, unlike iOS. The alert follows the
			// closing: an alert shown while the host widget is being dismissed is auto-dismissed
			// by the platform.
			if (!Type.isArrayFilled(userIds) && !Type.isArrayFilled(structureNodes))
			{
				this.onCloseWidget?.();
				await MemberEntitySelector.showUnsupportedEntitiesError(unsupportedEntities);

				return;
			}

			// The flag is taken before the confirmation and not after it: the confirmation waits for
			// the user, and a second selection arriving meanwhile would start a parallel send. It is
			// released before the alerts below, so that an alert left unanswered locks nothing.
			this.isInviteInProgress = true;

			let usersErrors = null;
			let nodesErrors = null;
			try
			{
				const isConfirmed = await MemberEntitySelector.confirmAdditionToProjectChildChat(dialog, addedEntities);
				if (!isConfirmed)
				{
					return;
				}

				const chatSettings = Application.storage.getObject('settings.chat', {
					historyShow: true,
				});

				await Notify.showIndicatorLoading();

				const sendResult = await MemberEntitySelector.sendEntities({
					chatService: this.chatService,
					chatId: dialog.chatId,
					userIds,
					structureNodes,
					historyShow: chatSettings.historyShow,
				}).finally(() => Notify.hideCurrentIndicator());

				usersErrors = sendResult.usersErrors;
				nodesErrors = sendResult.nodesErrors;

				// The selection is kept on a refusal: the same choice is safe to confirm again, and
				// the part that went through is skipped by the server the second time.
				if (usersErrors || nodesErrors)
				{
					Haptics.notifyWarning();
				}
				else
				{
					this.onCloseWidget?.();
				}

				// A linked node adds nobody at once: its employees arrive with the next pass of the org
				// structure sync, so the linking gets a confirmation of its own. It is the one shown for
				// a mixed selection too: added people are already there to be seen in the chat, while
				// the automatic joining is told about nowhere else.
				if (Type.isArrayFilled(structureNodes) && !nodesErrors)
				{
					MemberEntitySelector.showStructureNodesLinkedToast(structureNodes.length);
				}
				else if (Type.isArrayFilled(userIds) && !usersErrors)
				{
					showSuccessInvitationToast({
						dialogId: this.dialogId,
						multipleInvitation: userIds.length > 1,
						isTextForInvite: false,
					});
				}
			}
			finally
			{
				this.isInviteInProgress = false;
			}

			// Each call is told about on its own: they are independent, and a message about the whole
			// selection would name a part that is in the chat already. The alerts wait for the user,
			// so they follow the confirmation instead of holding it back.
			await MemberEntitySelector.showCallError(usersErrors);
			await MemberEntitySelector.showCallError(nodesErrors);
			await MemberEntitySelector.showUnsupportedEntitiesError(unsupportedEntities);
		}
	}

	module.exports = { EmployeesTabController };
});
