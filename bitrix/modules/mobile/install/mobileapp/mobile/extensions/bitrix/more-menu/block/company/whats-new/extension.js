/**
 * @module more-menu/block/company/whats-new
 */
jn.define('more-menu/block/company/whats-new', (require, exports, module) => {
	const { inAppUrl } = require('in-app-url');
	const { Loc } = require('loc');
	const { PureComponent } = require('layout/pure-component');
	const { connect } = require('statemanager/redux/connect');
	const { selectNewCount } = require('statemanager/redux/slices/whats-new');
	const { Indent, Color, Corner } = require('tokens');
	const { MoreMenuAnalytics } = require('more-menu/analytics');
	const { PropTypes } = require('utils/validation');
	const { Card } = require('ui-system/layout/card');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text3 } = require('ui-system/typography/text');
	const { BadgeCounter, BadgeCounterSize, BadgeCounterDesign } = require('ui-system/blocks/badges/counter');

	/**
	 * @class WhatsNewButton
	 */
	class WhatsNewButton extends PureComponent
	{
		componentDidUpdate(prevProps)
		{
			if (prevProps.counter !== this.props.counter && this.props.onCounterChange)
			{
				this.props.onCounterChange(this.props.counter);
			}
		}

		render()
		{
			const {
				testId,
				counter,
			} = this.props;

			return View(
				{
					testId: `${testId}-wrapper`,
					style: {
						paddingRight: Indent.XS.toNumber(),
						marginRight: Indent.XS.toNumber(),
						flexGrow: 2,
					},
				},
				Card(
					{
						testId,
						onClick: this.openWhatsNew,
						style: {
							borderRadius: Corner.XL.toNumber(),
							backgroundColor: Color.bgContentSecondaryInvert.toHex(),
						},
					},
					View(
						{
							style: {
								flexDirection: 'row',
							},
						},
						IconView({
							testId: `${testId}-icon`,
							size: 26,
							icon: Icon.FAVORITE,
							color: Color.accentMainPrimary,
							style: {
								marginRight: Indent.XS.toNumber(),
							},
						}),
						Text3({
							testId: `${testId}-text`,
							color: Color.base1,
							text: Loc.getMessage('MORE_MENU_COMPANY_WHATS_NEW'),
						}),
					),
				),
				counter && BadgeCounter({
					testId: `${testId}-counter`,
					value: counter,
					size: BadgeCounterSize.M,
					showRawValue: true,
					design: BadgeCounterDesign.ALERT,
					style: {
						position: 'absolute',
						top: 0,
						right: 0,
					},
				}),
			);
		}

		openWhatsNew = () => {
			inAppUrl.open('/whats-new/', {
				title: Loc.getMessage('MORE_MENU_COMPANY_WHATS_NEW'),
			});

			MoreMenuAnalytics.sendDrawerOpenEvent();
		};
	}

	WhatsNewButton.propTypes = {
		testId: PropTypes.string,
		counter: PropTypes.number,
		onCounterChange: PropTypes.func,
	};

	const mapStateToProps = (state) => {
		const counter = selectNewCount(state);

		return {
			counter,
		};
	};

	module.exports = {
		WhatsNewButton: connect(mapStateToProps)(WhatsNewButton),
	};
});
