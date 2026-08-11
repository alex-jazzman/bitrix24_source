/*
* @module call/calls/layout/user-card
*/
jn.define('call/calls/layout/user-card', (require, exports, module) => {
	const { Color } = require('tokens');
	const { UserVideo } = require('call/calls/layout/user-video');
	const Utils = require('src/util');
	const { Avatar } = require('ui-system/blocks/avatar');
	const Icons = require('icons/icons').Icons;
	const { NameBadge } = require('call/calls/layout/name-badge');
	const { GridUserCount } = require('call/const');

	const MARGIN = 5;

	const styles = {
		gridItem: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: '#26FFFFFF',
			borderRadius: 10,
			zIndex: 10,
			position: 'relative',
			marginRight: MARGIN,
			marginTop: MARGIN,
			borderWidth: 2,
		},
		screenShareBadge: {
			position: 'absolute',
			width: 24,
			height: 24,
			top: 8,
			right: 8,
			backgroundColor: '#1BCE7B',
			zIndex: 20,
			borderRadius: 8,
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
		},
	};

	class UserCard extends LayoutComponent
	{
		constructor(props = {})
		{
			super(props);
			this.userId = env.userId;
			this.onUserClick = props.onUserClick;
		}

		getItemWidth(index) {
			const countConnectedUsers = this.props.getConnectedUserCount;

			if (!this.props.gridContainerWidth)
			{
				return;
			}

			if (Utils.getIsLandscapeOrientation())
			{
				return countConnectedUsers <= GridUserCount.minimalGrid
					? { width: '30%', height: '48%' }
					: { width: this.props.gridContainerWidth / 4 - 7, height: this.props.gridContainerHeight / 2 - 5 };
			}

			if (countConnectedUsers <= GridUserCount.minimalGrid)
			{
				return { width: this.props.gridContainerWidth - 10, height: this.props.gridContainerHeight / 3 - 5 };
			}

			if (countConnectedUsers === GridUserCount.bottomSplittedRow
				|| countConnectedUsers === GridUserCount.middleSplittedRow)
			{
				return index >= (countConnectedUsers === GridUserCount.bottomSplittedRow ? 2 : 1)
					? { width: this.props.gridContainerWidth / 2 - 8, height: '33%' }
					: {
						width: this.props.gridContainerWidth - 10,
						height: countConnectedUsers === GridUserCount.bottomSplittedRow ? '32%' : '33%',
					};
			}

			if (countConnectedUsers === GridUserCount.equalTiles)
			{
				return { width: this.props.gridContainerWidth / 2 - 8, height: this.props.gridContainerHeight / 3 - 5 };
			}

			if (countConnectedUsers > GridUserCount.equalTiles)
			{
				return Utils.getIsLandscapeOrientation()
					? { width: this.props.gridContainerWidth / 4 - 7, height: this.props.gridContainerHeight / 2 - 5 }
					: { width: this.props.gridContainerWidth / 2 - 8, height: this.props.gridContainerHeight / 4 - 5 };
			}


			return Utils.getIsLandscapeOrientation()
				? { width: this.props.gridContainerWidth / 4 - 5, height: '48%' }
				: { width: document.device.screen.width / 2 - 20, height: document.device.screen.width / 4 };
		}

		getGridViewItemSize()
		{
			if (this.props.itemWidth && this.props.itemHeight)
			{
				return {
					width: this.props.itemWidth,
					height: this.props.itemHeight,
				};
			}

			const orientation = this.props.gridOrientation || 'vertical';
			const rows = this.props.gridRows || 2;
			const containerWidth = this.props.gridContainerWidth || document.device.screen.width;
			const containerHeight = this.props.gridContainerHeight || document.device.screen.height;

			if (orientation === 'horizontal')
			{
				const height = (containerHeight / rows) - MARGIN;

				return {
					width: height,
					height,
				};
			}

			const width = (containerWidth / rows) - MARGIN;

			return {
				width,
				height: width,
			};
		}

		render()
		{
			const { user } = this.props;
			const isCameraOff = !user.data.cameraState || !this.props.videoStream;
			const id = user.data.id;
			const isThisUser = id === Number(this.userId);
			const isReconnecting = user.data.state === BX.Call.UserState.Connecting || (this.props.isReconnecting && !isThisUser);

			const switchCamera = View(
				{
					style: {
						position: 'absolute',
						top: 8,
						right: 8,
						zIndex: 20,
					},
					onClick: () => {
						this.props.onReplaceCamera?.();
					},
				},
				Image({
					style: { width: 24, height: 24 },
					svg: { content: Icons.rotateIcon },
				}),
			);

			// TODO: take out
			const connectingBadge = View(
				{
					style: {
						position: 'absolute',
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'center',
						alignItems: 'center',
						width: '100%',
						height: '100%',
						backgroundColor: '#99000000',
					},
				},
				Loader({
					style: {
						width: 24,
						height: 24,
					},
					tintColor: '#fff',
					animating: true,
					size: 'small',
				}),
			);
			const avatar = View(
				{},
				Avatar({
					testId: 'userCallContainer-avatar',
					uri: this.props.avatarUri,
					name: BX.utils.html.htmlDecode(user.data.name),
					size: 90,
					backgroundColor: Utils.convertHexToColorEnum(CallUtil.userData[user.data.id]?.color),
				}),
			);

			const hasVideo = this.props.videoStream;

			const video = hasVideo ? new UserVideo({
				id: user.data.id,
				isLocal: isThisUser && this.props.mirrorLocalVideo,
				stream: this.props.videoStream,
			}) : null;

			const size = this.props.isGridView
				? this.getGridViewItemSize()
				: this.getItemWidth(this.props.index);

			return View(
				{
					style: {
						...size,
						...styles.gridItem,
						...(user.data.talking && { borderColor: '#1BCE7B' }),
					},
					onClick: () => {
						this.onUserClick();
					},
					onLongClick: () => {
						this.props.onLongTap?.();
					},
				},
				this.props.panelVisible && new NameBadge({ name: user.data.name, microphoneState: user.data.microphoneState }),
				user.data.state === BX.Call.UserState.Connecting && connectingBadge,
				user.data.floorRequestState && this.renderFloorRequestBadge(),
				user.data.screenState && View(
					{
						style: {
							...styles.screenShareBadge,
						},
					},
					Image({
						style: { width: 13, height: 13 },
						svg: { content: Icons.screenshareIcon },
					}),
				),
				(isCameraOff || isReconnecting || !hasVideo) ? avatar : video,
				isThisUser && !isCameraOff && switchCamera,
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
	}

	module.exports = {
		UserCard,
	};
});
