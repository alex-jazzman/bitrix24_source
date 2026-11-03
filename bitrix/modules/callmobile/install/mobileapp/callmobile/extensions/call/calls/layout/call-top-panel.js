/**
 * @module call/calls/layout/call-top-panel
 */
jn.define('call/calls/layout/call-top-panel', (require, exports, module) => {
	const { Avatar, AvatarShape, AvatarEntityType } = require('ui-system/blocks/avatar');
	const { Color } = require('tokens');
	const Utils = require('src/util');
	const Icons = require('icons/icons').Icons;

	const Gradients = {
		top: `
			<svg xmlns="http://www.w3.org/2000/svg" width="50" height="60" fill="none">
						<path fill="url(#a)" d="M0 0h375v116H0V0Z"/>
						<defs>
							<linearGradient id="a" x1="0" x2="0" y1="60" y2="0" gradientUnits="userSpaceOnUse">
								<stop offset="0" stop-opacity="0"/>
								<stop offset="1" stop-opacity="0.36"/>
							</linearGradient>
						</defs>
					</svg>
		`,
	};

	const styles = {
		topRow: {
			paddingLeft: 18,
			paddingRight: 18,
			flexDirection: 'row',
			width: '100%',
			alignItems: 'center',
		},
		backChatCounter: {
			position: 'absolute',
			top: 0,
			right: 0,
			height: 14,
			minWidth: 14,
			borderRadius: 7,
			backgroundColor: Color.accentMainAlert.toHex(),
			color: Color.baseWhiteFixed.toHex(),
			textAlign: 'center',
			fontSize: 10,
			fontWeight: 500,
			lineHeight: 12,
			zIndex: 20,
		},
		getHeaderLandscapeStyles() {
			return {
				paddingLeft: device.screen.safeArea.left / 4,
				paddingRight: device.screen.safeArea.right / 4,
				paddingTop: device.screen.safeArea.top + 14,
				paddingBottom: 14,
			};
		},
	};

	class CallTopPanel extends LayoutComponent
	{
		constructor(props = {})
		{
			super(props);
		}

		render()
		{
			const {
				associatedEntityAvatar,
				associatedEntityName,
				associatedEntityAvatarColor,
				statusText,
				statusIcon,
				chatCounter,
				recordState,
				showCopilot,
				copilotEnabled,
				showViewToggle,
				viewToggleTargetsGrid,
				viewToggleDisabled,
				onViewToggleClick,
				showFullHeader,
				onClick,
				isGroupCall,
				onChatClick,
				onCopilotClick,
				styles: customStyles,
			} = this.props;

			const avatar = this.renderAvatar(
				associatedEntityAvatar,
				associatedEntityName,
				associatedEntityAvatarColor,
				onClick,
			);

			const isLandscape = Utils.getIsLandscapeOrientation();

			return View(
				{
					style: {
						backgroundImageSvg: Gradients.top,
						backgroundResizeMode: 'stretch',
						width: '100%',
						paddingTop: device.screen.safeArea.top + 4,
						display: 'flex',
						...customStyles,
						...(isLandscape && Utils.getIsIos() && styles.getHeaderLandscapeStyles()),
					},
				},
				View(
					{
						style: styles.topRow,
					},
					this.renderBackButton(onChatClick, chatCounter),
					showFullHeader && avatar,
					showFullHeader && this.renderEntityInfo(
						associatedEntityName,
						statusText,
						statusIcon,
						recordState,
						onClick,
						isGroupCall,
					),
					showViewToggle && this.renderViewToggleButton(viewToggleTargetsGrid, onViewToggleClick, viewToggleDisabled),
					showCopilot && this.renderCopilotButton(copilotEnabled, onCopilotClick),
				),
				!showFullHeader && this.renderCollapsedHeader(
					associatedEntityAvatar,
					associatedEntityName,
					associatedEntityAvatarColor,
					statusText,
					statusIcon,
				),
			);
		}

		renderBackButton(onClick, chatCounter)
		{
			return View(
				{
					style: {
						paddingTop: 8,
						paddingBottom: 8,
						paddingRight: 8,
						marginRight: -8,
						overflow: 'visible',
					},
					onClick,
				},
				Image({
					testId: 'call-button-backToChat',
					style: { width: 24, height: 24 },
					svg: { content: Icons.arrowBack },
				}),
				chatCounter > 0 && Text({
					style: styles.backChatCounter,
					text: chatCounter.toString(),
				}),
			);
		}

		renderAvatar(uri, name, color, onClick)
		{
			return View(
				{
					style: {
						marginLeft: 12,
					},
					onClick,
				},
				Avatar({
					testId: 'top-avatar',
					uri: Utils.isAvatarBlank(uri) ? '' : encodeURI(uri),
					name: Utils.htmlDecode(name),
					size: 32,
					backgroundColor: Utils.convertHexToColorEnum(color),
				}),
			);
		}

		renderEntityInfo(name, statusText, statusIcon, recordState, onClick, isGroupCall)
		{
			return View(
				{
					style: { flex: 1, flexDirection: 'column', marginLeft: 12 },
				},
				View(
					{
						testId: 'callTopPanel-userName',
						style: { alignSelf: 'flex-start' },
						onClick,
					},
					Text({
						style: { fontSize: 16, fontWeight: 500, color: '#FFFFFF' },
						numberOfLines: 1,
						ellipsize: 'end',
						text: Utils.htmlDecode(name),
					}),
				),
				View(
					{
						style: { flexDirection: 'row', width: '100%', marginRight: 10 },
					},
					(isGroupCall || !recordState) && View(
						{
							style: { flexDirection: 'row' },
							onClick,
						},
						statusIcon && Image({
							style: { width: 15, height: 14 },
							svg: { content: statusIcon },
						}),
						Text({
							style: { fontSize: 12, fontWeight: 400, marginLeft: 4, color: '#F0F0F0' },
							text: statusText,
						}),
					),
					recordState && this.renderRecordIndicator(),
				),
			);
		}

		renderRecordIndicator()
		{
			return View(
				{
					style: { flexDirection: 'row', alignItems: 'center', marginLeft: this.props.isGroupCall ? 6 : 0 },
				},
				Image({
					style: { width: 13, height: 13 },
					svg: { content: Icons.record },
				}),
				Text({
					style: { fontSize: 12, fontWeight: 400, marginLeft: 4, color: Color.baseWhiteFixed.toHex() },
					ellipsize: 'end',
					text: BX.message('MOBILE_CALL_RECORD'),
				}),
			);
		}

		renderCopilotButton(copilotEnabled, onClick)
		{
			return View(
				{
					style: { justifyContent: 'center', marginLeft: 12 },
				},
				Image({
					style: { width: 32, height: 32 },
					svg: { content: copilotEnabled ? Icons.buttonCopilotOn : Icons.buttonCopilotOff },
					onClick,
				}),
			);
		}

		renderViewToggleButton(targetsGrid, onClick, disabled = false)
		{
			return View(
				{
					style: { justifyContent: 'center', marginLeft: 12, opacity: disabled ? 0.4 : 1 },
				},
				Image({
					testId: 'call-button-viewToggle',
					style: { width: 32, height: 32 },
					svg: { content: targetsGrid ? Icons.buttonViewGrid : Icons.buttonViewFeatured },
					onClick: disabled ? undefined : onClick,
				}),
			);
		}

		renderCollapsedHeader(avatar, name, color, statusText, statusIcon)
		{
			return View(
				{
					style: { flexDirection: 'column', alignItems: 'center', width: '100%' },
				},
				View(
					{
						style: { marginTop: 28, flexDirection: 'row' },
					},
					statusIcon && Image({
						style: { width: 15, height: 14 },
						svg: { content: statusIcon },
					}),
					Text({
						style: { fontSize: 12, fontWeight: 400, marginLeft: 4, color: '#F0F0F0' },
						text: statusText,
					}),
				),
				View(
					{
						testId: 'callTopPanel-userName',
						style: { minHeight: 58 },
					},
					Text({
						style: { fontSize: 25, fontWeight: 500, color: '#FFFFFF', maxWidth: '90%' },
						numberOfLines: 2,
						ellipsize: 'end',
						text: Utils.htmlDecode(name),
					}),
				),
				this.renderCenterAvatar(avatar, name, color),
			);
		}

		renderCenterAvatar(uri, text, color)
		{
			return View(
				{
					style: {
						alignItems: 'center',
						justifyContent: 'center',
						flexGrow: 1,
					},
				},
				Avatar({
					testId: 'center-avatar',
					uri: Utils.isAvatarBlank(uri) ? '' : uri,
					name: text,
					entityType: AvatarEntityType.OTHER,
					size: 180,
					useLetterImage: true,
					backgroundColor: Utils.convertHexToColorEnum(color),
					shape: AvatarShape.NONE,
				}),
			);
		}
	}

	module.exports = {
		CallTopPanel,
	};
});
