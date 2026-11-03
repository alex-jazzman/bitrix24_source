/**
 * @module more-menu/block/header
 */
jn.define('more-menu/block/header', (require, exports, module) => {
	const { Feature } = require('feature');
	const { Color, Indent } = require('tokens');
	const { isModuleInstalled } = require('module');
	const { PureComponent } = require('layout/pure-component');
	const { Card, CardDesign, CardCorner } = require('ui-system/layout/card');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { MoreMenuAnalytics } = require('more-menu/analytics');

	let WorkdayPanel;
	try
	{
		({ WorkdayPanel } = require('timeman/layout/workday-panel'));
	}
	catch (error)
	{
		console.error(error);
	}

	const { CheckIn } = require('more-menu/block/header/check-in');
	const { UserCard } = require('more-menu/block/header/user-card');

	/**
	 * @class MoreMenuHeader
	 */
	class MoreMenuHeader extends PureComponent
	{
		/**
		 * @param {object} props
		 * @param {string} props.testId
		 * @param {object} props.currentShift
		 * @param {number} props.userId
		 * @param {object} props.currentTheme
		 * @param {boolean} props.canOpenProfile
		 * @param {boolean} props.canEditProfile
		 * @param {boolean} props.canUseTimeMan
		 * @param {boolean} props.canUseCheckIn
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});

			this.handleTabsSelected = null;

			this.handleWorkdayPanelMount = this.handleWorkdayPanelMount.bind(this);
			this.handleWorkdayPanelUnmount = this.handleWorkdayPanelUnmount.bind(this);
			this.handleStartWorkDay = this.handleStartWorkDay.bind(this);
			this.handleResumeWorkDay = this.handleResumeWorkDay.bind(this);
			this.handlePauseWorkDay = this.handlePauseWorkDay.bind(this);
			this.handleFinishWorkDay = this.handleFinishWorkDay.bind(this);
		}

		handleStartWorkDay()
		{
			MoreMenuAnalytics.sendStartWorkDay();
		}

		handleResumeWorkDay()
		{
			MoreMenuAnalytics.sendResumeWorkDay();
		}

		handlePauseWorkDay()
		{
			MoreMenuAnalytics.sendPauseWorkDay();
		}

		handleFinishWorkDay()
		{
			MoreMenuAnalytics.sendFinishWorkDay();
		}

		handleWorkdayPanelMount({ refetch })
		{
			this.handleTabsSelected = (tabId) => {
				if (tabId === 'menu')
				{
					refetch();
				}
			};

			BX.addCustomEvent('onTabsSelected', this.handleTabsSelected);
		}

		handleWorkdayPanelUnmount()
		{
			if (this.handleTabsSelected)
			{
				BX.removeCustomEvent('onTabsSelected', this.handleTabsSelected);
				this.handleTabsSelected = null;
			}
		}

		render()
		{
			const {
				canOpenProfile,
				canEditProfile,
				canUseTimeMan,
				currentShift,
				userId,
				currentTheme,
				isNewCheckInEnabled,
			} = this.props;

			return View(
				{
					style: {
						padding: Indent.XL3.toNumber(),
						paddingTop: Indent.L.toNumber(),
						backgroundColor: Color.bgContentPrimary.toHex(Feature.canUseWidgetBackground() ? 0 : 1),
					},
				},
				UserCard({
					testId: this.getTestId('person-info'),
					userId,
					canEditProfile,
					currentTheme,
					clickable: canOpenProfile,
				}),
				(this.shouldShowCheckIn() || canUseTimeMan) && Card(
					{
						testId: this.getTestId('day-info'),
						style: {
							marginTop: Indent.XL.toNumber(),
							borderColor: Color.cardStrokeGradient1.toHex(),
							backgroundColor: Color.accentSoftBlue2.toHex(),
						},
						corner: CardCorner.XL,
						border: true,
						design: CardDesign.PRIMARY,
					},
					canUseTimeMan && WorkdayPanel && WorkdayPanel({
						testId: this.getTestId('work-time'),
						onComponentMount: this.handleWorkdayPanelMount,
						onComponentWillUnmount: this.handleWorkdayPanelUnmount,
						onStartWorkDay: this.handleStartWorkDay,
						onResumeWorkDay: this.handleResumeWorkDay,
						onPauseWorkDay: this.handlePauseWorkDay,
						onFinishWorkDay: this.handleFinishWorkDay,
					}),
					this.shouldShowCheckIn() && canUseTimeMan && this.renderSeparator(),
					this.shouldShowCheckIn() && new CheckIn({
						testId: this.getTestId('check-in'),
						currentShift,
						isNewCheckInEnabled,
					}),
				),
			);
		}

		renderSeparator()
		{
			return View(
				{
					style: {
						width: '100%',
						height: 1,
						backgroundColor: Color.accentSoftBlue1.toHex(),
						marginVertical: Indent.M.toNumber(),
					},
				},
			);
		}

		shouldShowCheckIn()
		{
			const { canUseCheckIn } = this.props;

			return isModuleInstalled('stafftrack') && canUseCheckIn;
		}
	}

	MoreMenuHeader.propTypes = {
		testId: PropTypes.string.isRequired,
		currentShift: PropTypes.object,
		userId: PropTypes.number,
		currentTheme: PropTypes.object,

		canEditProfile: PropTypes.bool,
		canUseTimeMan: PropTypes.bool,
		canUseCheckIn: PropTypes.bool,
	};

	module.exports = {
		MoreMenuHeader,
	};
});
