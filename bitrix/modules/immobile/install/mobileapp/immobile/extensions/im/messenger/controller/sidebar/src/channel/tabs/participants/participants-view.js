/**
 * @module im/messenger/controller/sidebar/channel/tabs/participants/participants-view
 */
jn.define('im/messenger/controller/sidebar/channel/tabs/participants/participants-view', (require, exports, module) => {
	const { SidebarParticipantsView } = require(
		'im/messenger/controller/sidebar/chat/tabs/participants/participants-view',
	);
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const { Loc } = require('loc');
	const { ChannelParticipantsService } = require('im/messenger/controller/sidebar/channel/tabs/participants/participants-service');

	/**
	 * @class ChannelParticipantsView
	 * @typedef {LayoutComponent<SidebarParticipantsViewProps, SidebarParticipantsViewState>} ChannelParticipantsView
	 */
	class ChannelParticipantsView extends SidebarParticipantsView
	{
		/**
		 * @return {ChannelParticipantsService}
		 */
		getParticipantsService()
		{
			return new ChannelParticipantsService(this.props);
		}

		/**
		 * @param {object} item
		 * @param {number} index
		 * @return object
		 */
		setStyleItem(item, index)
		{
			const chatStyleItem = super.setStyleItem(item, index);

			delete chatStyleItem.isCopilot;
			chatStyleItem.isManager = item.isManager;

			return chatStyleItem;
		}

		/**
		 * @param {object} item
		 * @return object
		 */
		setItemEntity(item)
		{
			return { isYou: item.isYou, isManager: item.isManager };
		}

		/**
		 * @desc Handler leave chat
		 * @void
		 * @private
		 */
		onClickLeaveChannel()
		{
			setTimeout(() => {
				navigator.notification.confirm(
					'',
					(buttonId) => {
						if (buttonId === 2)
						{
							this.participantsService.onClickLeaveChat();
						}
					},
					Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_LEAVE_CHANNEL_CONFIRM_TITLE'),
					[
						Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_LEAVE_CHAT_CONFIRM_NO'),
						Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_LEAVE_CHANNEL_CONFIRM_YES'),
					],
				);
			}, 10);
		}

		/**
		 * @desc Handler long click item
		 * @param {string} key
		 * @param {number} userId
		 * @param {object} isEntity
		 * @param {boolean} isEntity.isYou
		 * @param {boolean} isEntity.isManager
		 * @private
		 */
		onLongClickItem(key, userId, isEntity)
		{
			const actions = [];
			const actionsIcon = [];
			const callbacks = {};

			if (isEntity.isYou)
			{
				actions.push('notes');
				actionsIcon.push('notes');
				callbacks.notes = this.participantsService.onClickGetNotes;
				if (this.state.permissions.isCanLeave)
				{
					actions.push('channel_leave');
					actionsIcon.push('leave');
					callbacks.channel_leave = this.onClickLeaveChannel.bind(this);
				}
			}
			else
			{
				if (ChatPermission.isCanMention(this.props.dialogId))
				{
					actions.push('mention');
					actionsIcon.push('mention');
					callbacks.mention = this.participantsService.onClickPingUser.bind(this, userId);
				}

				actions.push('send');
				actionsIcon.push('send');
				callbacks.send = this.participantsService.onClickSendMessage.bind(this, userId);

				if (ChatPermission.isOwner())
				{
					if (isEntity.isManager)
					{
						actions.push('channel_remove_manager');
						actionsIcon.push('cancel');
						callbacks.channel_remove_manager = this.participantsService.onClickRemoveManager.bind(this, userId);
					}
					else
					{
						actions.push('channel_add_manager');
						actionsIcon.push('crown');
						callbacks.channel_add_manager = this.participantsService.onClickAddManager.bind(this, userId);
					}
				}

				const isCanDelete = this.state.permissions.isCanRemoveParticipants;
				if (isCanDelete && ChatPermission.isCanRemoveUserById(userId, this.props.dialogId))
				{
					actions.push('channel_remove');
					actionsIcon.push('remove');
					callbacks.channel_remove = this.onClickRemoveParticipant.bind(this, { key });
				}
			}

			return this.openParticipantManager(actions, callbacks, actionsIcon);
		}

		getUserAddWidgetTitle()
		{
			return Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_PARTICIPANTS_ADD_TITLE_CHANNEL');
		}
	}

	module.exports = { ChannelParticipantsView };
});