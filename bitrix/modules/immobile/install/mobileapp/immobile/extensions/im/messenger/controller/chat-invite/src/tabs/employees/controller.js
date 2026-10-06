/**
 * @module im/messenger/controller/chat-invite/tabs/employees/controller
 */
jn.define('im/messenger/controller/chat-invite/tabs/employees/controller', (require, exports, module) => {
	const { Notify } = require('notify');
	const { Haptics } = require('haptics');
	const { Type } = require('type');
	const { unique } = require('utils/array');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { MemberSelector } = require('im/messenger/controller/selector/member');

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

			// Native tabs widget tears down the nested selector on tab deactivation,
			// so we just drop the stale reference — calling close() here would close
			// the parent layout, since the selector is integrated into it.
			this.memberSelector = null;

			try
			{
				this.memberSelector = new MemberSelector({
					integrateSelectorToParentLayout: true,
					excludeGuests: true,
					// The integrated selector cannot report its own teardown: the nested
					// tabs widget delivers no close callback on Android, so the invite
					// must start right on selection instead of waiting for onWidgetClosed.
					onSelectMembers: (membersIds) => this.#onSelectMembers(membersIds),
				});
				this.memberSelector.open(layout);
			}
			catch (e)
			{
				this.logger.warn('MemberSelector init error', e);
				Haptics.notifyWarning();
				showGenericErrorToast();
			}
		}

		/**
		 * @desc Releases the stale selector reference. The integrated selector is torn down
		 * by the parent widget; we don't call close() on it to avoid closing the host layout.
		 */
		close()
		{
			this.memberSelector = null;
		}

		/**
		 * @param {Array<number>} membersIds
		 */
		#onSelectMembers = async (membersIds) => {
			if (this.isInviteInProgress)
			{
				return;
			}

			// No-op branches below still close the widget explicitly: on Android the
			// integrated selector cannot dismiss its host, unlike iOS.
			if (!Type.isArrayFilled(membersIds))
			{
				this.onCloseWidget?.();

				return;
			}

			const dialog = this.store.getters['dialoguesModel/getById'](this.dialogId);
			if (!dialog)
			{
				this.logger.warn('dialog is not in store', this.dialogId);
				this.onCloseWidget?.();

				return;
			}

			const currentParticipantIds = unique(dialog.participants.filter(Boolean));
			const uniqueIds = membersIds.filter((id) => !currentParticipantIds.includes(id));

			if (uniqueIds.length === 0)
			{
				this.onCloseWidget?.();

				return;
			}

			const chatSettings = Application.storage.getObject('settings.chat', {
				historyShow: true,
			});

			this.isInviteInProgress = true;
			await Notify.showIndicatorLoading();

			let isSuccess = false;
			try
			{
				await this.chatService.addToChat(dialog.chatId, uniqueIds, chatSettings.historyShow);
				isSuccess = true;
			}
			catch (error)
			{
				Haptics.notifyWarning();
				this.logger.error('onSelectMembers error', error);
				showGenericErrorToast();
			}
			finally
			{
				Notify.hideCurrentIndicator();
				this.isInviteInProgress = false;
			}

			if (!isSuccess)
			{
				return;
			}

			this.onCloseWidget?.();
			showSuccessInvitationToast({
				dialogId: this.dialogId,
				multipleInvitation: uniqueIds.length > 1,
				isTextForInvite: false,
			});
		};
	}

	module.exports = { EmployeesTabController };
});
