jn.define('call/calls/layout/gridview-grid', (require, exports, module) => {
	const { UserCard } = require('call/calls/layout/user-card');
	const { GridUserCount } = require('call/const');
	const Utils = require('src/util');
	const MobileUtils = require('utils/function');

	class GridViewGrid extends LayoutComponent
	{
		constructor(props = {})
		{
			super(props);
			this.gridViewRef = null;
			this.userRegistry = props.userRegistry;
			this.userId = env.userId;
			this.onUserClick = props.onUserClick;
			this.onLongTap = props.onLongTap;
			this.onReplaceCamera = props.onReplaceCamera;
			this.onViewableItemsChanged = props.onViewableItemsChanged;
			this.prevViewableIds = new Set(props.viewableIds || []);
			this.initialVisibilityFallbackEnabled = props.initialVisibilityFallbackEnabled !== false;
			this.rows = props.rows || this.getDefaultRowsCount();
			this.handleViewableItemsChangedDebounced = MobileUtils.debounce(
				this.handleViewableItemsChanged.bind(this),
				500,
			);

			this.state = {
				connectedUsers: props.connectedUsers || [],
				panelVisible: props.panelVisible,
				gridContainerHeight: props.gridContainerHeight,
				gridContainerWidth: props.gridContainerWidth,
				videoStreams: props.videoStreams,
				mirrorLocalVideo: props.mirrorLocalVideo,
				viewableIds: props.viewableIds || [],
				orientation: props.orientation || 'vertical',
				itemWidth: props.itemWidth || null,
				itemHeight: props.itemHeight || null,
				getConnectedUserCount: props.getConnectedUserCount,
			};
		}

		update(updatedProps)
		{
			const panelVisibleChanged = 'panelVisible' in updatedProps
				&& updatedProps.panelVisible !== this.state.panelVisible;

			const dimensionsChanged = ('itemWidth' in updatedProps && updatedProps.itemWidth !== this.state.itemWidth)
				|| ('itemHeight' in updatedProps && updatedProps.itemHeight !== this.state.itemHeight);

			const orientationChanged = 'orientation' in updatedProps
				&& updatedProps.orientation !== this.state.orientation;

			if ('rows' in updatedProps && updatedProps.rows !== this.rows)
			{
				this.rows = updatedProps.rows;
			}

			this.setState(updatedProps);

			if (dimensionsChanged || orientationChanged)
			{
				setTimeout(() => this.forceUpdateVisibleRows(), 0);
			}
		}

		forceUpdateVisibleRows(updatedProps = {})
		{
			if (!this.gridViewRef)
			{
				return;
			}

			const users = updatedProps.connectedUsers || this.state.connectedUsers || [];
			const items = this.prepareItems(users);

			this.gridViewRef.updateRows(items);
		}

		getDefaultRowsCount()
		{
			const isLandscape = Utils.getIsLandscapeOrientation();
			return isLandscape ? 4 : 2;
		}

		snapshotUserData(data)
		{
			return {
				id: data.id,
				name: data.name,
				firstName: data.firstName,
				lastName: data.lastName,
				avatar: data.avatar,
				state: data.state,
				cameraState: data.cameraState,
				microphoneState: data.microphoneState,
				screenState: data.screenState,
				floorRequestState: data.floorRequestState,
				talking: data.talking,
			};
		}

		prepareItems(users)
		{
			const viewableIds = this.prevViewableIds;
			// Native GridView may not emit onViewableItemsChanged before the first render
			// (or fires it with a 500ms debounce). Until that callback arrives, treat the
			// first-page users as viewable so video streams render immediately. Disabled
			// for pin/screenshare grids where the visible row is smaller.
			const fallbackActive = this.initialVisibilityFallbackEnabled && viewableIds.size === 0;

			return users.map((user, index) => ({
				key: user.data.id.toString(),
				type: 'user',
				data: this.snapshotUserData(user.data),
				index,
				isViewable: viewableIds.has(user.data.id)
					|| (fallbackActive && index < GridUserCount.fullFirstPageCount),
				panelVisible: this.state.panelVisible,
				mirrorLocalVideo: user.data.id === Number(this.userId)
					? this.state.mirrorLocalVideo
					: undefined,
			}));
		}

		renderItem = (item) =>
		{
			const streams = this.state.videoStreams;
			const isViewable = item.isViewable;
			const videoStream = isViewable
				&& streams.hasOwnProperty(item.data.id)
				&& streams[item.data.id];

			return new UserCard({
				userId: this.userId,
				avatarUri: this.userRegistry.get(item.data.id).avatar,
				gridContainerWidth: this.props.gridContainerWidth,
				gridContainerHeight: this.props.gridContainerHeight,
				panelVisible: item.panelVisible,
				videoStream,
				isGridView: true,
				gridOrientation: this.state.orientation,
				gridRows: this.rows,
				itemWidth: this.state.itemWidth,
				itemHeight: this.state.itemHeight,
				user: item,
				index: item.index,
				onUserClick: () => this.onUserClick(item.data.id),
				onLongTap: () => this.onLongTap?.(item.data.id),
				onReplaceCamera: this.props.onReplaceCamera,
				mirrorLocalVideo: item.mirrorLocalVideo,
				getConnectedUserCount: this.state.getConnectedUserCount,
			});
		};

		handleViewableItemsChanged(data)
		{
			const viewableIndices = data[0]?.items || [];
			const displayedUsers = this.state.connectedUsers || [];

			const newViewableIdSet = new Set(
				viewableIndices
					.filter((index) => index < displayedUsers.length)
					.map((index) => displayedUsers[index].data.id),
			);

			const changedItems = [];
			displayedUsers.forEach((user, index) => {
				const userId = user.data.id;
				const wasViewable = this.prevViewableIds.has(userId);
				const isNowViewable = newViewableIdSet.has(userId);

				if (wasViewable !== isNowViewable)
				{
					changedItems.push({
						key: userId.toString(),
						type: 'user',
						data: this.snapshotUserData(user.data),
						index,
						isViewable: isNowViewable,
						panelVisible: this.state.panelVisible,
						mirrorLocalVideo: userId === Number(this.userId)
							? this.state.mirrorLocalVideo
							: undefined,
					});
				}
			});

			this.prevViewableIds = newViewableIdSet;

			if (changedItems.length > 0 && this.gridViewRef)
			{
				this.gridViewRef.updateRows(changedItems);
			}

			this.onViewableItemsChanged?.([...newViewableIdSet]);
		}

		render()
		{
			const items = this.prepareItems(this.state.connectedUsers || []);

			return View(
				{
					style: {
						flex: 1,
					},
				},
				GridView({
					ref: (ref) => { this.gridViewRef = ref; },
					style: {
						flex: 1,
						padding: 0.5,
					},
					params: {
						orientation: this.state.orientation,
						rows: this.props.rows || this.getDefaultRowsCount(),
					},
					bounces: false,
					// for iOS
					showsHorizontalScrollIndicator: false,
					showsVerticalScrollIndicator: false,
					animateDataUpdates: false,
					// TOD0: change waitForInteraction to false after native iOS rework
					viewabilityConfig: { itemVisiblePercentThreshold: 70, waitForInteraction: false },
					onViewableItemsChanged: (data) => {
						this.handleViewableItemsChangedDebounced(data)
					},
					data: [{ items }],
					renderItem: (item) => View(
						{},
						this.renderItem(item),
					),
				}),
			);
		}
	}

	module.exports = { GridViewGrid };
});
