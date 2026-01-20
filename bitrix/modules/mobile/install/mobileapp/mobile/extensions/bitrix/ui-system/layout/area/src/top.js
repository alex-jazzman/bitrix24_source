/**
 * @module ui-system/layout/area/src/top
 */
jn.define('ui-system/layout/area/src/top', (require, exports, module) => {
	const { Component, Color, Indent } = require('tokens');
	const { mergeImmutable } = require('utils/object');
	const { PropTypes } = require('utils/validation');
	const { BBCodeText } = require('ui-system/typography/bbcodetext');

	/**
	 * @function AreaTop
	 * @param {object} props
	 * @param {string} [props.title]
	 * @param {Object} [props.excludePaddingSide]
	 * @return AreaTop
	 */
	function AreaTop(props = {})
	{
		PropTypes.validate(AreaTop.propTypes, props, 'AreaTop');

		const {
			title,
			excludePaddingSide = {},
			...restProps
		} = props;

		const { horizontal } = excludePaddingSide;

		const style = {
			paddingVertical: Indent.L.toNumber(),
			paddingLeft: horizontal ? 0 : Component.areaPaddingLr.toNumber(),
			paddingRight: horizontal ? 0 : Component.areaPaddingLr.toNumber(),
		};

		return View(
			mergeImmutable(restProps, { style }),
			BBCodeText({
				size: 4,
				value: title,
				color: Color.base4,
				ellipsize: 'end',
				numberOfLines: 1,
			}),
		);
	}

	AreaTop.propTypes = {
		title: PropTypes.string,
		excludePaddingSide: PropTypes.objectOf(PropTypes.bool),
	};

	module.exports = { AreaTop };
});
