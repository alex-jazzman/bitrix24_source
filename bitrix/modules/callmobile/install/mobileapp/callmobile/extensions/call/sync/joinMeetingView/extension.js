/**
 * @module call/sync/joinMeetingView
 */
jn.define('call/sync/joinMeetingView', (require, exports, module) => {
	const { Color } = require('tokens');
	const { BottomSheet } = require('bottom-sheet');
	const { StringInput, InputSize, InputMode, InputDesign } = require('ui-system/form/inputs/string');
	const { ButtonSize, ButtonDesign, Button } = require('ui-system/form/buttons/button');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { SyncAnalyticsController } = require('call/sync/analyticsController');
	const { inAppUrl } = require('in-app-url');

	const BACKDROP_DEFAULT_HEIGHT = 320;

	// Guest call link formats (see Bitrix\Im\V2\SharingLink\GuestChatLink):
	// deeplink https://b24.to/gi/{portalId}-{code} or fallback {publicDomain}/guest/{code}
	const GUEST_LINK_REGEXP = /^https?:\/\/(b24\.to\/gi\/|[^/]+\/guest\/)/i;

	const isGuestCallLink = (value) => GUEST_LINK_REGEXP.test((value || '').trim());

	class JoinMeetingViewComponent extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.state = {
				meetingCode: '',
			};
		}

		onCodeChange(value)
		{
			this.setState({ meetingCode: value });
		}

		onClose()
		{
			if (this.props.layout)
			{
				this.props.layout.close();
			}
		}

		onJoin()
		{
			const url = this.state.meetingCode.trim();
			if (!isGuestCallLink(url))
			{
				return;
			}

			SyncAnalyticsController.sendJoinCall();
			this.props.layout.close();
			inAppUrl.open(url);
		}

		isJoinEnabled()
		{
			return isGuestCallLink(this.state.meetingCode);
		}

		renderHeader()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						paddingVertical: 12,
					},
				},
				View({
					style: {
						width: 32,
						height: 32,
					},
				}),
				Text({
					text: BX.message('CALLMOBILE_SYNC_JOIN_MEETING_TITLE'),
					style: {
						fontSize: 17,
						fontWeight: '500',
						lineHeight: 21,
						color: Color.base1.toHex(),
						flex: 1,
						textAlign: 'center',
					},
				}),
				View(
					{
						style: {
							width: 32,
							height: 32,
							alignItems: 'center',
							justifyContent: 'center',
						},
						onClick: () => this.onClose(),
					},
					IconView({
						icon: Icon.CROSS,
						color: Color.base3,
						size: 28,
					}),
				),
			);
		}

		render()
		{
			return View(
				{
					style: {
						flex: 1,
						backgroundColor: Color.bgSecondary.toHex(),
						flexDirection: 'column',
						paddingHorizontal: 16,
					},
				},
				this.renderHeader(),
				View(
					{
						style: {
							paddingTop: 16,
							paddingBottom: 16,
						},
					},
					Text({
						text: BX.message('CALLMOBILE_SYNC_JOIN_MEETING_CODE_LABEL'),
						style: {
							fontSize: 13,
							color: Color.base3.toHex(),
							marginBottom: 8,
						},
					}),
					StringInput({
						testId: 'join-meeting-code-input',
						value: this.state.meetingCode,
						placeholder: BX.message('CALLMOBILE_SYNC_JOIN_MEETING_CODE_PLACEHOLDER'),
						size: InputSize.L,
						mode: InputMode.STROKE,
						design: InputDesign.GREY,
						leftContent: Icon.LINK,
						onChange: (value) => this.onCodeChange(value),
						onSubmit: () => this.onJoin(),
					}),
					Text({
						text: BX.message('CALLMOBILE_SYNC_JOIN_MEETING_CODE_HINT'),
						style: {
							fontSize: 12,
							color: Color.base3.toHex(),
							marginTop: 8,
						},
					}),
					View(
						{
							style: {
								marginTop: 24,
							},
						},
						Button({
							testId: 'join-meeting-button',
							text: BX.message('CALLMOBILE_SYNC_JOIN_MEETING_BUTTON'),
							size: ButtonSize.L,
							design: ButtonDesign.FILLED,
							stretched: true,
							disabled: !this.isJoinEnabled(),
							onClick: () => this.onJoin(),
						}),
					),
				),
			);
		}
	}

	function openJoinMeetingView(parentWidget = PageManager)
	{
		const component = (layout) => new JoinMeetingViewComponent({ layout });

		const bottomSheet = new BottomSheet({ component })
			.setParentWidget(parentWidget)
			.setBackgroundColor(Color.bgSecondary.toHex())
			.hideNavigationBar()
			.setMediumPositionHeight(BACKDROP_DEFAULT_HEIGHT, true)
			.disableOnlyMediumPosition()
			.disableSwipe()
			.enableResizeContent()
			.enableAdoptHeightByKeyboard();

		bottomSheet.open();
	}

	module.exports = {
		openJoinMeetingView,
	};
});
