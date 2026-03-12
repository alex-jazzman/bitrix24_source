/**
 * @module call/callList/createGroupCallView
 */
jn.define('call/callList/createGroupCallView', (require, exports, module) => {
	const { NotifyManager } = require('notify-manager');
	const { SocialNetworkUserSelector } = require('selector/widget/entity/socialnetwork/user');
	const { restCall } = require('call/callList/utils');
	const { CallListAnalyticsController } = require('call/callList/analyticsController');

	const CONTEXT_PROVIDER = 'IMMOBILE_UPDATE_GROUP_CHAT_PARTICIPANT';

	class CreateGroupCall
	{
		constructor()
		{
			this.participants = [];
			this.selectorWidget = null;
		}

		async open(parentWidget = PageManager)
		{
			this.parentWidget = parentWidget;
			const currentUserId = env.userId;

			this.selector = SocialNetworkUserSelector.make({
				initSelectedIds: [currentUserId],
				undeselectableIds: [currentUserId],
				widgetParams: {
					title: BX.message('MOBILEAPP_CALL_LIST_CREATE_GROUP_CALL_TITLE'),
					sendButtonName: BX.message('MOBILEAPP_CALL_LIST_CREATE_GROUP_CALL_BUTTON'),
				},
				leftButtons: [
					{
						type: 'back',
						callback: () => {
							if (this.selectorWidget)
							{
								this.selectorWidget.back();
							}
						},
					},
				],
				allowMultipleSelection: true,
				closeOnSelect: true,
				events: {
					onClose: (selectedEntity) => {
						this.onCloseParticipantSelector(selectedEntity);
					},
				},
				createOptions: {
					enableCreation: false,
				},
				selectOptions: {
					canUnselectLast: true,
				},
				canUseRecent: false,
				provider: {
					context: CONTEXT_PROVIDER,
					options: {
						useLettersForEmptyAvatar: true,
					},
				},
			});

			this.selector.show({}, parentWidget)
				.then((selectorWidget) => {
					this.selectorWidget = selectorWidget;
				})
				.catch((error) => {
					console.error('[CreateGroupCallView] selector.show() Error:', error);
				});
		}

		onCloseParticipantSelector(selectedEntity)
		{
			this.participants = selectedEntity;

			this.createAndCall()
				.catch((error) => {
					NotifyManager.hideLoadingIndicator(false);
					console.error('[CreateGroupCallView] onCloseParticipantSelector Error:', error);
				});
		}

		async createAndCall()
		{
			NotifyManager.showLoadingIndicator();
			try
			{
				const memberEntities = this.getMemberEntities();

				const result = await restCall('im.v2.Chat.add', {
					fields: {
						memberEntities,
						type: 'CHAT',
						title: '',
					},
				});

				NotifyManager.hideLoadingIndicatorWithoutFallback();

				const chatId = result.chatId;
				const dialogId = `chat${chatId}`;

				const eventData = {
					dialogId,
					video: false,
					chatData: {
						dialogId,
						chatId,
						name: BX.message('MOBILEAPP_CALL_LIST_CREATE_GROUP_CALL_TITLE'),
						userCounter: this.getUserCounter(),
					},
					userData: this.getUserDataMap(),
				};

				CallListAnalyticsController.sendGroupCallCreation();
				BX.postComponentEvent('onCallInvite', [eventData], 'calls');

				if (this.parentWidget?.close)
				{
					this.parentWidget.close();
				}
			}
			catch (error)
			{
				NotifyManager.hideLoadingIndicator(false);

				console.error('[CreateGroupCallView] createAndCall Error:', error);
			}
		}

		getMemberEntities()
		{
			const currentUserId = Number(env.userId);
			const memberEntities = this.participants.map((participant) => {
				return ['user', Number(participant.id)];
			});

			const isCurrentUserInMembers = memberEntities.some(
				([type, id]) => Number(id) === currentUserId,
			);

			if (!isCurrentUserInMembers)
			{
				memberEntities.push(['user', currentUserId]);
			}

			return memberEntities;
		}

		getUserCounter()
		{
			return this.participants.length;
		}

		getUserDataMap()
		{
			const userDataMap = {};

			this.participants.forEach((participant) => {
				userDataMap[participant.id] = {
					id: participant.id,
					name: participant.title || '',
					avatar: participant.avatar || '',
				};
			});

			return userDataMap;
		}
	}

	function openCreateGroupCallView(parentWidget = PageManager)
	{
		const creator = new CreateGroupCall();
		creator.open(parentWidget);
	}

	module.exports = {
		CreateGroupCall,
		openCreateGroupCallView,
	};
});
