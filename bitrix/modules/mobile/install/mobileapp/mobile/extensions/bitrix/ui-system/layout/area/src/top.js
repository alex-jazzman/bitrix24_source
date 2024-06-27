/**
 * @module ui-system/layout/area/src/top
 */
jn.define('ui-system/layout/area/src/top', (require, exports, module) => {
	const { Component, Color, Indent } = require('tokens');
	const { Text4 } = require('ui-system/typography/text');

	/**
	 * @function AreaTop
	 * @param {object} props
	 * @param {text} [props.title]
	 * @return AreaTop
	 */
	function AreaTop(props = {})
	{
		PropTypes.validate(AreaTop.propTypes, props, 'AreaTop');

		const { title } = props;

		return View(
			{
				style: {
					alignSelf: 'flex-start',
					paddingLeft: Component.areaPaddingLr,
					paddingVertical: Indent.L.toNumber(),
				},
			},
			Text4({
				text: title,
				color: Color.base4,
			}),
		);
	}

	AreaTop.propTypes = {
		title: PropTypes.string,
	};

	module.exports = { AreaTop };
});
