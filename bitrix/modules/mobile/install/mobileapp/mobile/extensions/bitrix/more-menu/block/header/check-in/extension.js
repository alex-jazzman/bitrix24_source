/**
 * @module more-menu/block/header/check-in
 */
jn.define('more-menu/block/header/check-in', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { Loc } = require('loc');
	const { Indent, Color } = require('tokens');
	const { inAppUrl } = require('in-app-url');

	const { Text3, Text4 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');
	const { PropTypes } = require('utils/validation');
	const { Moment } = require('utils/date/moment');
	const { FriendlyDate } = require('layout/ui/friendly-date');
	const { FormatterTypes } = require('layout/ui/friendly-date/formatter-factory');
	const { shortTime } = require('utils/date/formats');
	const { capitalize } = require('utils/string');
	const { createTestIdGenerator } = require('utils/test');
	const { isEqual } = require('utils/object');

	let StatusEnum = null;
	let store = null;
	let selectCurrentUserManualCount = null;

	try
	{
		StatusEnum = require('stafftrack/model/shift').StatusEnum;
		store = require('statemanager/redux/store');
		selectCurrentUserManualCount = require('stafftrack/statemanager/redux/slices/check-in')?.selectCurrentUserManualCount;
	}
	catch (error)
	{
		console.warn(error);

		return;
	}

	/**
	 * @class CheckIn
	 */
	class CheckIn extends LayoutComponent
	{
		/**
		 * @param {object} props
		 * @param {string} props.testId
		 * @param {object} props.currentShift
		 * @param {boolean} props.isNewCheckInEnabled
		 */
		constructor(props)
		{
			super(props);
			this.state = {
				currentShift: props.currentShift,
				isNewCheckInEnabled: props.isNewCheckInEnabled,
				checkInAmount: props.isNewCheckInEnabled ? this.readManualCount() : 0,
			};

			this.subscribeToPullEvent = this.subscribeToPullEvent.bind(this);
			this.handleStoreChange = this.handleStoreChange.bind(this);
			this.timeUpdateInterval = null;
			this.unsubscribeStore = null;

			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});
		}

		componentDidMount()
		{
			BX.addCustomEvent('onPullEvent-stafftrack', this.subscribeToPullEvent);
			this.startTimeUpdateInterval();
			if (this.state.isNewCheckInEnabled)
			{
				this.unsubscribeStore = store.subscribe(this.handleStoreChange);
			}
		}

		componentWillReceiveProps(props)
		{
			if (!isEqual(props?.currentShift, this.state.currentShift))
			{
				this.setState({ currentShift: props?.currentShift });
			}

			if (props?.isNewCheckInEnabled !== this.state.isNewCheckInEnabled)
			{
				if (props?.isNewCheckInEnabled)
				{
					if (!this.unsubscribeStore)
					{
						this.unsubscribeStore = store.subscribe(this.handleStoreChange);
					}
					this.setState({
						isNewCheckInEnabled: true,
						checkInAmount: this.readManualCount(),
					});
				}
				else
				{
					this.unsubscribeStore?.();
					this.unsubscribeStore = null;
					this.setState({
						isNewCheckInEnabled: false,
						checkInAmount: 0,
					});
				}
			}
		}

		componentWillUnmount()
		{
			BX.removeCustomEvent('onPullEvent-stafftrack', this.subscribeToPullEvent);
			this.stopTimeUpdateInterval();
			this.unsubscribeStore?.();
			this.unsubscribeStore = null;
		}

		readManualCount()
		{
			return selectCurrentUserManualCount(store.getState(), Math.floor(Date.now() / 1000));
		}

		handleStoreChange()
		{
			const count = this.readManualCount();
			if (count !== this.state.checkInAmount)
			{
				this.setState({ checkInAmount: count });
			}
		}

		startTimeUpdateInterval()
		{
			this.timeUpdateInterval = setInterval(() => {
				this.setState({});
			}, 60000);
		}

		stopTimeUpdateInterval()
		{
			if (this.timeUpdateInterval)
			{
				clearInterval(this.timeUpdateInterval);
				this.timeUpdateInterval = null;
			}
		}

		/**
		 * @param {string} command
		 * @param params
		 * @param extra
		 * @param {string} moduleId
		 */
		subscribeToPullEvent(command, params, extra, moduleId)
		{
			const shift = params?.shift;

			if (shift?.userId === Number(env.userId))
			{
				if (command === 'shift_delete')
				{
					this.setState({
						currentShift: null,
					});
				}
				else
				{
					this.setState({
						currentShift: shift,
					});
				}
			}
		}

		render()
		{
			const { isNewCheckInEnabled } = this.state;

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						flexGrow: 2,
						justifyContent: 'space-between',
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							flexShrink: 2,
						},
					},
					this.renderIcon(),
					View(
						{
							testId: this.getTestId('content'),
							style: {
								flexShrink: 2,
								marginRight: Indent.XS.toNumber(),
							},
							onClick: () => {
								inAppUrl.open('/check-in', {});
							},
						},
						this.renderHeader(),
						!isNewCheckInEnabled && this.renderStatus(),
						isNewCheckInEnabled && this.renderAmount(),
					),
				),
				View(
					{},
					this.renderActions(),
				),
			);
		}

		renderIcon()
		{
			if (device.screen.width <= 360)
			{
				return null;
			}

			return View(
				{
					style: {
						width: 40,
						height: 40,
						marginRight: Indent.XS.toNumber(),
					},
					onClick: () => {
						inAppUrl.open('/check-in', {});
					},
				},
				Image({
					testId: this.getTestId('image'),
					uri: makeLibraryImagePath('location.png', 'more-menu'),
					style: {
						width: 44,
						height: 44,
						position: 'absolute',
						top: -2,
						right: -3,
					},
					resizeMode: 'cover',
				}),
			);
		}

		renderHeader()
		{
			return View(
				{
					testId: this.getTestId('header'),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						flexShrink: 2,
					},
				},
				Text3({
					testId: this.getTestId('title'),
					text: Loc.getMessage('MORE_MENU_HEADER_CHECK_IN_TITLE_MSGVER_1'),
					color: Color.base1,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						flexShrink: 2,
					},
				}),
				IconView({
					testId: this.getTestId('chevron'),
					size: 20,
					icon: Icon.CHEVRON_TO_THE_RIGHT,
					color: Color.base1,
					resizeMode: 'cover',
					style: {
						marginTop: 2,
						width: 10,
						height: 16,
						marginLeft: Indent.XS.toNumber(),
					},
				}),
			);
		}

		renderAmount()
		{
			const { checkInAmount } = this.state;
			const textProps = {
				color: Color.base3,
				numberOfLines: 1,
				ellipsize: 'end',
				style: {
					flexShrink: 2,
				},
			};

			if (!checkInAmount || checkInAmount <= 0)
			{
				return Text4({
					testId: this.getTestId('no-check-in'),
					text: Loc.getMessage('MORE_MENU_HEADER_CHECK_IN_CLOSED'),
					...textProps,
				});
			}

			return Text4({
				testId: this.getTestId(`check-in-amount-${checkInAmount}`),
				text: Loc.getMessage('MORE_MENU_HEADER_CHECK_IN_AMOUNT', {
					'#AMOUNT#': checkInAmount,
				}),
				...textProps,
			});
		}

		renderStatus()
		{
			const { currentShift } = this.state;

			const status = currentShift?.status || StatusEnum.CLOSED;

			if (
				!currentShift
				|| status === StatusEnum.NOT_WORKING.getValue()
			)
			{
				return Text4({
					testId: this.getTestId('closed'),
					text: Loc.getMessage('MORE_MENU_HEADER_CHECK_IN_CLOSED'),
					color: Color.base3,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						flexShrink: 2,
					},
				});
			}

			if (status === StatusEnum.CANCEL_WORKING.toNumber())
			{
				const dateCancel = currentShift?.dateCancel || '';

				return Text4({
					testId: this.getTestId('cancel-time'),
					text: capitalize(this.getCancelTime(new Date(dateCancel))),
					color: Color.base3,
					numberOfLines: 1,
					ellipsize: 'middle',
					style: {
						flexShrink: 2,
					},
				});
			}

			const dateCreate = currentShift?.dateCreate || '';

			return new FriendlyDate({
				moment: Moment.createFromTimestamp(new Date(dateCreate) / 1000),
				defaultTimeFormat: (moment) => moment.format(shortTime()),
				formatType: FormatterTypes.HUMAN_DATE,
				renderContent: ({ state }) => Text4({
					testId: this.getTestId('create-time'),
					text: state.text,
					color: Color.accentMainPrimary,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						flexShrink: 2,
					},
				}),
				showTime: true,
			});
		}

		renderActions()
		{
			const { currentShift, isNewCheckInEnabled } = this.state;

			if (currentShift && !isNewCheckInEnabled)
			{
				return Button({
					testId: 'MORE_MENU_HEADER_CHECK_IN_BUTTON',
					text: Loc.getMessage('MORE_MENU_HEADER_CHECK_IN_BUTTON_DEFAULT'),
					size: ButtonSize.M,
					design: ButtonDesign.OUTLINE_ACCENT_2,
					onClick: () => {
						inAppUrl.open('/check-in', {});
					},
				});
			}

			return Button({
				testId: 'MORE_MENU_HEADER_CHECK_IN_BUTTON_START',
				text: Loc.getMessage('MORE_MENU_HEADER_CHECK_IN_BUTTON_START'),
				leftIcon: Icon.LOCATION,
				size: ButtonSize.M,
				design: ButtonDesign.OUTLINE_ACCENT_2,
				onClick: () => {
					inAppUrl.open('/check-in', {});
				},
			});
		}

		getCancelTime(time)
		{
			const moment = Moment.createFromTimestamp(time / 1000);
			const timeString = moment.format(shortTime());

			return Loc.getMessage(
				'MORE_MENU_HEADER_CHECK_IN_CANCEL_MSGVER_1',
				{
					'#TIME#': timeString,
				},
			);
		}
	}

	CheckIn.propTypes = {
		testId: PropTypes.string,
		currentShift: PropTypes.object,
		isNewCheckInEnabled: PropTypes.bool,
	};

	module.exports = {
		CheckIn,
	};
});
