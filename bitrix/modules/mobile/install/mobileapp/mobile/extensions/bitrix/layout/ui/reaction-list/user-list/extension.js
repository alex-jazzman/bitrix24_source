/**
 * @module layout/ui/reaction-list/user-list
 */
jn.define('layout/ui/reaction-list/user-list', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Component } = require('tokens');
	const { StatefulList } = require('layout/ui/stateful-list');
	const { ListItemType, ListItemsFactory } = require('layout/ui/reaction-list/user-list/src/reaction-items-factory');
	const { openUserProfile } = require('user/profile/src/backdrop-profile');
	const { usersUpserted, usersAdded } = require('statemanager/redux/slices/users');
	const { batchActions } = require('statemanager/redux/batched-actions');
	const { fetchUsersIfNotLoaded } = require('statemanager/redux/slices/users/thunk');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	const PullCommand = {
		RATING_VOTE: 'rating_vote',
	};
	const PullTypes = {
		ADD: 'ADD',
		CHANGE: 'CHANGE',
		CANCEL: 'CANCEL',
	};

	class UserList extends LayoutComponent
	{
		static constants = Object.freeze({
			ALL: 'all',
		});

		constructor(props)
		{
			super(props);

			this.statefulList = null;
			this.parentWidget = props.layout ?? layout;
			this.itemDetailOpenHandler = this.itemDetailOpenHandler.bind(this);
		}

		componentDidUpdate(prevProps, prevState)
		{
			if (prevProps !== this.props.selectedTab)
			{
				this.reloadStatefulList();
			}
		}

		reloadStatefulList()
		{
			this.statefulList.reload();
		}

		render()
		{
			const { voteSignToken, entityId, entityType, selectedTab, withRedux } = this.props;

			return new StatefulList({
				testId: 'reaction-list',
				showAirStyle: true,
				shouldReloadDynamically: true,
				layout: this.parentWidget,
				actions: {
					loadItems: 'mobile.Reaction.getUserList',
				},
				actionParams: {
					loadItems: {
						params: {
							VOTE_SIGN_TOKEN: voteSignToken,
							ENTITY_ID: entityId,
							ENTITY_TYPE: entityType,
							SELECTED_TAB: selectedTab,
						},
					},
				},
				actionCallbacks: {
					loadItems: this.onItemsLoaded,
				},
				getEmptyListComponent: this.renderEmptyWidget,
				itemType: withRedux ? ListItemType.REDUX_REACTION : ListItemType.REACTION,
				itemFactory: ListItemsFactory,
				itemsLoadLimit: 20,
				isShowFloatingButton: false,
				useCache: true,
				pull: {
					moduleId: 'main',
					callback: this.onPullCallback,
					shouldReloadDynamically: true,
				},
				itemDetailOpenHandler: this.itemDetailOpenHandler,
				onBeforeItemsRender: this.onBeforeItemsRender,
				ref: this.bindRef,
			});
		}

		renderEmptyWidget()
		{
			return Text({
				style: {
					marginHorizontal: Component.paddingLr.toNumber(),
					textAlign: 'center',
					fontSize: 20,
				},
				text: Loc.getMessage('REACTION_LIST_WIDGET_NO_REACTIONS'),
			});
		}

		onPullCallback = async ({ params = {}, command }) => {
			const {
				ENTITY_ID: entityId,
				ENTITY_TYPE_ID: entityTypeId,
				USER_ID: userId,
				REACTION: reaction,
				TYPE: type,
			} = params ?? {};

			if (!entityId || !entityTypeId || !userId || !reaction || !type || !command)
			{
				throw new Error('Missing required parameters');
			}

			if (
				Number(entityId) === Number(this.props.entityId)
				&& entityTypeId === this.props.entityType
				&& command === PullCommand.RATING_VOTE
			)
			{
				const newReaction = {
					id: Number(userId),
					entityId: Number(entityId),
					entityType: entityTypeId,
					reactionId: reaction,
				};

				await dispatch(fetchUsersIfNotLoaded({ userIds: [Number(userId)] }));

				if (type === PullTypes.CANCEL)
				{
					this.statefulList.deleteItem([newReaction.id]);
				}
				else if (
					this.props.selectedTab === UserList.constants.ALL
					|| this.props.selectedTab === reaction
				)
				{
					this.statefulList.updateItemsData([newReaction]);
				}

				return { params: { eventName: command } };
			}

			return { params: { eventName: null, items: [] } };
		};

		onBeforeItemsRender = (items) => {
			return items.map((item, index) => ({
				...item,
				showBorder: index > 0,
				showIcon: this.props.selectedTab === UserList.constants.ALL,
				parentWidget: this.parentWidget,
			}));
		};

		itemDetailOpenHandler(userId)
		{
			void openUserProfile({ parentWidget: this.parentWidget, userId, isBackdrop: true });
		}

		bindRef = (ref) => {
			if (ref)
			{
				this.statefulList = ref;
			}
		};

		onItemsLoaded = (responseData, context) => {
			const { users } = responseData || {};
			const isCache = context === 'cache';

			const actions = [];

			if (users && users.length > 0)
			{
				actions.push(isCache ? usersAdded(users) : usersUpserted(users));
			}

			if (actions.length > 0)
			{
				dispatch(batchActions(actions));
			}
		};
	}

	module.exports = { UserList };
});
