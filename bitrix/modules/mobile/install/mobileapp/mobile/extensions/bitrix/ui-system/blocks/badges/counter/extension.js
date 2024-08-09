/**
 * @module ui-system/blocks/badges/counter
 */
jn.define('ui-system/blocks/badges/counter', (require, exports, module) => {
	const { PropTypes } = require('utils/validation');
	const { Component, Indent } = require('tokens');
	const { mergeImmutable } = require('utils/object');
	const { Text5 } = require('ui-system/typography/text');
	const { BadgeCounterDesign } = require('ui-system/blocks/badges/counter/src/design-enum');

	/**
	 * @param {object} props
	 * @param {number} props.testId
	 * @param {number | string} [props.value=0]
	 * @param {boolean} [props.showRawValue]
	 * @param {BadgeCounterDesign} props.design=BadgeCounterDesign.SUCCESS
	 * @param {Color} [props.color=Color.baseWhiteFixed]
	 * @param {Color} [props.backgroundColor=Color.accentMainPrimary]
	 * @function BadgeCounter
	 */
	function BadgeCounter(props = {})
	{
		PropTypes.validate(BadgeCounter.propTypes, props, 'BadgeCounter');

		const {
			testId = '',
			value = 0,
			showRawValue = false,
			design = BadgeCounterDesign.SUCCESS,
			...restProps
		} = props;

		if (!BadgeCounterDesign.has(design))
		{
			console.warn('BadgeCounterDesign: counter design not selected');

			return null;
		}

		const counterText = !showRawValue && value > 99 ? '99+' : String(value);

		const viewProps = mergeImmutable({
			testId: `${testId}_${design.getName()}`,
			style: {
				height: 18,
				flexShrink: 1,
				alignItems: 'flex-start',
			},
		}, restProps);

		return View(
			viewProps,
			View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: Indent.S.toNumber(),
						borderRadius: Component.elementAccentCorner.toNumber(),
						backgroundColor: design.getBackgroundColor().toHex(),
					},
				},
				Text5({
					accent: true,
					text: counterText,
					color: design.getColor(),
				}),
			),
		);
	}

	BadgeCounter.defaultProps = {
		value: 0,
		showRawValue: false,
	};

	BadgeCounter.propTypes = {
		testId: PropTypes.string.isRequired,
		showRawValue: PropTypes.bool,
		design: PropTypes.instanceOf(BadgeCounterDesign),
		value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	};

	module.exports = { BadgeCounter, BadgeCounterDesign };
});
