/*
* @module call/calls/layout/floor-requests-list
*/
jn.define('call/calls/layout/scrollview-grid', (require, exports, module) => {
	const Utils = require('src/util');
	const { UserCard } = require('call/calls/layout/user-card');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { Color, Corner, Indent } = require('tokens');
	const { GridUserCount } = require('call/const');
	const { NameBadge } = require('call/calls/layout/name-badge');

	const styles = {
		userGrid: {
			display: 'flex',
			flexDirection: 'row',
			flexWrap: 'wrap',
			width: '100%',
			marginRight: -5,
		},
		gridItem: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: '#26FFFFFF',
			borderRadius: 10,
			zIndex: 10,
			position: 'relative',
			marginRight: 5,
			marginTop: 5,
			borderWidth: 2,
		},
		placeholder: {
			backgroundColor: '#26FFFFFF',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: 10,
			zIndex: 10,
			marginTop: 5,
			marginRight: 5,
			position: 'relative',
		},
	}

	const ITEMS_PER_PAGE = 8;

	class ScrollViewGrid extends LayoutComponent
	{
		constructor(props = {})
		{
			super(props);
			this.containerWidth = props.containerWidth;
			this.containerHeight = props.containerHeight;
			this.isLandscape = props.isLandscape;
			this.userRegistry = props.userRegistry;
			this.videoStreams = props.videoStreams;
			this.mirrorLocalVideo = props.mirrorLocalVideo;
			this.panelVisible = props.panelVisible;
			this.onUserClick = props.onUserClick;
			this.scrollManager = props.scrollManager;

			this.state = {
				gridContainerWidth: props.gridContainerWidth,
				gridContainerHeight: props.gridContainerHeight,
			}
		}

		getSortedUsers()
		{
			if (!this.props.connectedUsers)
			{
				return [];
			}

			const chunkedArray = [];

			// TODO: rework
			// const startCount = this.scrollManager.getCurrentGridPage() <= 1 ? 0 : ((this.scrollManager.getCurrentGridPage() - 2) * ITEMS_PER_PAGE);
			const endCount = this.scrollManager.getCurrentGridPage() * ITEMS_PER_PAGE + 4;

			const renderedUsers = this.props.connectedUsers.slice(0, endCount);

			for (let i = 0; i < renderedUsers.length; i += ITEMS_PER_PAGE)
			{
				chunkedArray.push(renderedUsers.slice(i, i + ITEMS_PER_PAGE));
			}

			return chunkedArray;
		}


		render()
		{
			const startCount = this.scrollManager.getCurrentGridPage() <= 1 ? 0 : ((this.scrollManager.getCurrentGridPage() - 1) * GridUserCount.fullFirstPageCount);
			const endCount = this.scrollManager.getCurrentGridPage() * GridUserCount.fullFirstPageCount - 1;
			const isOnlyOnePage = this.props.getConnectedUserCount <= GridUserCount.fullFirstPageCount;
			const alignItemsStyles = this.props.getConnectedUserCount <= GridUserCount.bottomSplittedRow && Utils.getIsLandscapeOrientation() ? 'center' : 'flex-start';

			const userGrid = this.getSortedUsers().map((chunk, userPageIndex) => (
				View(
					{
						style: {
							...styles.userGrid,
							height: this.props.gridContainerHeight,
							marginTop: (userPageIndex === 0 || Utils.getIsLandscapeOrientation()) && -5,
							marginBottom: 5,
							marginRight: -5,
							alignContent: alignItemsStyles,
							justifyContent: Utils.getIsLandscapeOrientation()
								? (this.props.getConnectedUserCount < GridUserCount.fullFirstPageCount
									? 'center'
									: this.props.getConnectedUserCount > GridUserCount.fullFirstPageCount
										? 'flex-start'
										: 'space-between')
								: 'space-between',
						},
						onLayout: () => {
							if (this.props.isScreenshareFullScreen)
							{
								this.setState({
									isScreenshareFullScreen: false,
								});
							}
						},
						onClick: () => {
							this.props.toggleUI();
						},
					},
					...chunk.map((user, userPositionInPageIndex) => {
						const globalIndex = userPageIndex * GridUserCount.fullFirstPageCount + userPositionInPageIndex;
						const videoStream = this.videoStreams.hasOwnProperty(user.data.id) && this.videoStreams[user.data.id];

						return (Utils.isVisible(globalIndex, startCount, endCount) || isOnlyOnePage)
							? new UserCard({
								avatarUri: this.userRegistry.get(user.data.id).avatar,
								gridContainerWidth: this.props.gridContainerWidth,
								gridContainerHeight: this.props.gridContainerHeight,
								panelVisible: this.props.panelVisible,
								mirrorLocalVideo: this.props.mirrorLocalVideo,
								isReconnecting: this.props.isReconnecting,
								videoStream,
								user,
								index: globalIndex,
								onUserClick: () => this.onUserClick(user.data.id),
								onLongTap: () => this.props.onLongTap(user.data.id),
								onReplaceCamera: this.props.onReplaceCamera,
								getConnectedUserCount: this.props.getConnectedUserCount,
							})
							: this.renderPlaceholder(user);
					}),
				)
			));

			return ScrollView(
				{
					ref: ref => {
						this.scrollView = ref;
						this.scrollManager.setScrollViewRef(ref);
					},
					style: {
						flex: 1,
					},
					bounces: false,
					onLayout: (layoutObj) => {
						if (layoutObj.y === 0 && this.scrollManager.getCurrentGridPage() !== 1)
						{
							this.scrollManager.setCurrentGridPage(1);
							this.props.subscribeOnNewPage();
						}
						this.props.resetActiveScreenId();
					},
					...this.props.onScrollViewLayout,
					onScroll: (props) => {
						this.scrollManager.setCurrentScrollPosition(props.contentOffset.y)
						if (Utils.getIsAndroid() && !this.gridHasScrolled)
						{
							setTimeout(() => {
								if (!this.gridHasScrolled)
								{
									this.scrollManager.handleScrollEnd();
								}
							}, 1000)
							this.gridHasScrolled = true;
						}
					},
					onScrollEndDrag: () => {
						if (!this.gridHasScrolled || !Utils.getIsAndroid())
						{
							this.scrollManager.handleScrollEnd();
							this.gridHasScrolled = true;
						}
					},
					onMomentumScrollEnd: () => {
						if (Utils.getIsAndroid())
						{
							this.scrollManager.handleScrollEnd();
							this.gridHasScrolled = true;
						}
					},
					onScrollBeginDrag: () => {
						this.scrollManager.beginDrag();
					},
				},
				View(
					{
						style: {
							minHeight: device.screen.height,
							// marginRight: this.getIsIos() ? -5 : 0,
							paddingLeft: 5,
						},
					},
					...userGrid,
				),
			);
		}

		renderFloorRequestBadge()
		{
			return View(
				{
					style: {
						height: 24,
						width: 24,
						flexDirection: 'row',
						borderRadius: 6,
						backgroundColor: Color.accentMainWarning.toHex(),
						alignItems: 'center',
						justifyContent: 'center',
						position: 'absolute',
						top: 8,
						right: 8,
						zIndex: 20,
					},
				},
				Image({
					style: {
						width: 20,
						height: 20,
					},
					svg: { content: Icons.floorRequest },
				}),
			);
		}

		renderPlaceholder(item)
		{
			const size = Utils.getIsLandscapeOrientation() ? { width: this.props.gridContainerWidth / 4 - 7, height: this.props.gridContainerHeight / 2 - 10 } : { width: this.props.gridContainerWidth / 2 - 8, height: this.props.gridContainerHeight / 4 - 10 };
			const avatar = View(
				{},
				Avatar({
					testId: 'userCallContainer-avatar',
					uri: this.userRegistry.get(item.data.id).avatar,
					name: BX.utils.html.htmlDecode(item.data.name),
					size: 90,
					backgroundColor: Utils.convertHexToColorEnum(CallUtil.userData[item.data.id]?.color),
				}),
			);
			return View(
				{
					style: {
						...styles.placeholder,
						...size,
					},
				},
				avatar,
				new NameBadge({ name: item.data.name, microphoneState: item.data.microphoneState }),
			);
		}


	}

	module.exports = {
		ScrollViewGrid,
	};
});
