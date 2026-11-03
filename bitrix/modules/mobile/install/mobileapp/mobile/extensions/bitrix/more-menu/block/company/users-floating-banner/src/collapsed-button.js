/**
 * @module more-menu/block/company/users-floating-banner/src/collapsed-button
 */
jn.define('more-menu/block/company/users-floating-banner/src/collapsed-button', (require, exports, module) => {
	const { Color, Component } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { PropTypes } = require('utils/validation');

	const SIZE = 58;
	const ICON_SIZE = 28;

	/**
	 * @function CollapsedInviteButton
	 * @param {CollapsedInviteButtonProps} props
	 * @returns {object}
	 */
	function CollapsedInviteButton(props)
	{
		PropTypes.validate(CollapsedInviteButton.propTypes, props, 'CollapsedInviteButton');

		const { testId, onClick } = props;
		const borderRadius = Component.popupCorner.toNumber();

		return View(
			{
				testId,
				onClick,
				style: {
					// the size comes from the floating layer: the button has to follow the growth animation
					flex: 1,
					alignSelf: 'stretch',
					borderRadius,
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: Color.accentSoftBlue1.withPressed(),
				},
			},
			IconView({
				testId: `${testId}-icon`,
				icon: Icon.ADD_PERSON,
				size: ICON_SIZE,
				color: Color.baseWhiteFixed,
			}),
		);
	}

	CollapsedInviteButton.propTypes = {
		testId: PropTypes.string.isRequired,
		onClick: PropTypes.func.isRequired,
	};

	module.exports = { CollapsedInviteButton, COLLAPSED_BUTTON_SIZE: SIZE };
});
