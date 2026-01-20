/**
 * @module call/callList/createConferenceView
 */
jn.define('call/callList/createConferenceView', (require, exports, module) => {
	const { Color } = require('tokens');
	const { BottomSheet } = require('bottom-sheet');
	const { StringInput, InputSize, InputMode, InputDesign } = require('ui-system/form/inputs/string');
	const { ButtonSize, ButtonDesign, Button } = require('ui-system/form/buttons/button');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { DialogOpener } = require('im/messenger/api/dialog-opener');
	const { restCall } = require('call/callList/utils');

	const BACKDROP_DEFAULT_HEIGHT = 238;

	class CreateConferenceViewComponent extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.state = {
				conferenceName: '',
				isCreating: false,
			};
		}

		onNameChange(value)
		{
			this.setState({ conferenceName: value });
		}

		onNameErase()
		{
			this.setState({ conferenceName: '' });
		}

		onClose()
		{
			if (this.props.layout)
			{
				this.props.layout.close();
			}
		}

		async createConference()
		{
			const { conferenceName } = this.state;

			this.setState({ isCreating: true });

			try
			{
				const title = conferenceName.trim();

				const userId = env.userId;
				const result = await restCall('im.v2.Chat.add', {
					fields: {
						entityType: 'VIDEOCONF',
						title,
						users: [userId],
					},
				});

				const chatId = result.chatId;
				if (chatId)
				{
					const dialogId = `chat${chatId}`;

					if (this.props.layout)
					{
						this.props.layout.close(() => {
							DialogOpener.open({ dialogId });
						});
					}
					else
					{
						DialogOpener.open({ dialogId });
					}
				}
			}
			catch (error)
			{
				console.error('[CallList][CreateConferenceView][createConference][error]', error);
			}
			finally
			{
				this.setState({ isCreating: false });
			}
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
					text: BX.message('MOBILEAPP_CALL_CONFERENCE_CREATE_TITLE'),
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
			const { conferenceName, isCreating } = this.state;

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
					StringInput({
						testId: 'conference-name-input',
						value: conferenceName,
						placeholder: BX.message('MOBILEAPP_CALL_CONFERENCE_CREATE_NAME_PLACEHOLDER'),
						size: InputSize.L,
						mode: InputMode.STROKE,
						design: InputDesign.GREY,
						erase: true,
						onChange: (value) => this.onNameChange(value),
						onErase: () => this.onNameErase(),
						onSubmit: () => this.createConference(),
					}),
					View(
						{
							style: {
								marginTop: 35,
							},
						},
						Button({
							testId: 'conference-create-button',
							text: BX.message('MOBILEAPP_CALL_CONFERENCE_CREATE_BUTTON'),
							size: ButtonSize.L,
							design: ButtonDesign.FILLED,
							stretched: true,
							disabled: isCreating,
							loading: isCreating,
							onClick: () => this.createConference(),
						}),
					),
				),
			);
		}
	}

	function openCreateConferenceView(parentWidget = PageManager)
	{
		const component = (layout) => new CreateConferenceViewComponent({ layout });

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
		CreateConferenceViewComponent,
		openCreateConferenceView,
	};
});
