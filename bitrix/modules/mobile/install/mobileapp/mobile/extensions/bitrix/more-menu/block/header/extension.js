/**
 * @module more-menu/block/header
 */
jn.define('more-menu/block/header', (require, exports, module) => {
	const { Color, Indent, Component } = require('tokens');
	const { isModuleInstalled } = require('module');
	const { PureComponent } = require('layout/pure-component');
	const { Card, CardDesign, CardCorner } = require('ui-system/layout/card');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');

	const { WorkTime } = require('more-menu/block/header/worktime');
	const { CheckIn } = require('more-menu/block/header/check-in');
	const { UserCard } = require('layout/ui/user/card');

	/**
	 * @class MoreMenuHeader
	 */
	class MoreMenuHeader extends PureComponent
	{
		/**
		 * @param {object} props
		 * @param {string} props.testId
		 * @param {object} props.currentShift
		 * @param {object} props.workTime
		 * @param {number} props.userId
		 * @param {object} props.currentTheme
		 * @param {boolean} props.canEditProfile
		 * @param {boolean} props.canUseTimeMan
		 * @param {boolean} props.canUseCheckIn
		 * @param {boolean} props.canManageWorkTimeOnMobile
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});
		}

		render()
		{
			const {
				canEditProfile,
				canUseTimeMan,
				currentShift,
				userId,
				workTime,
				currentTheme,
				canManageWorkTimeOnMobile,
			} = this.props;

			return View(
				{
					style: {
						padding: Indent.XL3.toNumber(),
						paddingTop: Indent.L.toNumber(),
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				UserCard({
					testId: this.getTestId('person-info'),
					userId,
					canEditProfile,
					currentTheme,
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
					canUseTimeMan && new WorkTime({
						testId: this.getTestId('work-time'),
						workTime,
						canManageWorkTimeOnMobile,
					}),
					this.shouldShowCheckIn() && canUseTimeMan && this.renderSeparator(),
					this.shouldShowCheckIn() && new CheckIn({
						testId: this.getTestId('check-in'),
						currentShift,
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
		workTime: PropTypes.object,
		userId: PropTypes.number,
		currentTheme: PropTypes.object,

		canEditProfile: PropTypes.bool,
		canUseTimeMan: PropTypes.bool,
		canUseCheckIn: PropTypes.bool,
		canManageWorkTimeOnMobile: PropTypes.bool,
	};

	module.exports = {
		MoreMenuHeader,
	};
});
