/**
 * @module ui-system/layout/box
 */
jn.define('ui-system/layout/box', (require, exports, module) => {
	const { Component, Color } = require('tokens');
	const { mergeImmutable } = require('utils/object');

	/**
	 * @function Box
	 * @param {object} props
	 * @param {Color | Color.bgPrimary | Color.bgSecondary} [props.backgroundColor]
	 * @param {boolean} [props.withScroll = false]
	 * @param {boolean} [props.scrollProps = {}]
	 * @param {boolean} [props.withPaddingLeft = false]
	 * @param {boolean} [props.paddingRight = false]
	 * @param {boolean} [props.withPaddingHorizontal = false]
	 * @param {View[]} children
	 * @return Box
	 */
	function Box(props = {}, ...children)
	{
		PropTypes.validate(Box.propTypes, props, 'Box');

		const {
			backgroundColor,
			withScroll = false,
			withPaddingLeft = false,
			withPaddingRight = false,
			withPaddingHorizontal = false,
			scrollProps = {},
			...restProps
		} = props;

		const style = {
			paddingLeft: withPaddingLeft || withPaddingHorizontal ? Component.paddingLr.toNumber() : 0,
			paddingRight: withPaddingRight || withPaddingHorizontal ? Component.paddingLr.toNumber() : 0,
		};

		if (backgroundColor && (backgroundColor.equal(Color.bgPrimary) || backgroundColor.equal(Color.bgSecondary)))
		{
			style.backgroundColor = backgroundColor.toHex();
		}
		else
		{
			style.backgroundColor = null;
		}

		const render = View(
			mergeImmutable(restProps, { style }),
			...children,
		);

		if (withScroll)
		{
			return ScrollView(
				mergeImmutable(scrollProps, {
					style: {
						height: '100%',
					},
				}),
				render,
			);
		}

		return render;
	}

	Box.defaultProps = {
		withScroll: false,
		withPaddingLeft: false,
		withPaddingRight: false,
		withPaddingHorizontal: false,
	};

	Box.propTypes = {
		withScroll: PropTypes.bool,
		scrollProps: PropTypes.object,
		backgroundColor: PropTypes.object,
		withPaddingLeft: PropTypes.bool,
		withPaddingRight: PropTypes.bool,
		withPaddingHorizontal: PropTypes.bool,
	};

	module.exports = { Box };
});
