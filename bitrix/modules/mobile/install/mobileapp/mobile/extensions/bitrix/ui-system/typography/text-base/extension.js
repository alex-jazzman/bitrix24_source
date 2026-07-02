/**
 * @module ui-system/typography/text-base
 */
jn.define('ui-system/typography/text-base', (require, exports, module) => {
	const { PropTypes } = require('utils/validation');
	const { mergeImmutable } = require('utils/object');
	const { Typography, Color } = require('tokens');

	/**
	 * @param {TextBaseProps} props
	 * @return {object}
	 */
	const TextBase = (props) => {
		const {
			nativeElement,
			size = 4,
			accent,
			header,
			typography,
			color,
			colorGradient,
			...restProps
		} = props;
		const typographyToken = Typography.resolve(
			Typography.getToken({ token: typography, accent }),
			Typography.getTokenBySize({ size, header, accent }),
		);

		let style = typographyToken.getStyle();

		if (Color.has(color))
		{
			style = { color: color.toHex(), ...style };
		}

		if (colorGradient?.colors)
		{
			style = {
				...style,
				colorGradient: {
					colors: colorGradient.colors.map((gradient) => Color.has(gradient) ? gradient.toHex() : gradient),
					angle: colorGradient.angle,
				},
			};
		}

		return nativeElement(mergeImmutable({ style }, restProps));
	};

	TextBase.defaultProps = {
		size: 4,
		accent: false,
		header: false,
		typography: null,
	};

	TextBase.propTypes = {
		typography: PropTypes.object,
		size: PropTypes.oneOfType([
			PropTypes.number,
			PropTypes.string,
		]),
		accent: PropTypes.bool,
		header: PropTypes.bool,
		colorGradient: PropTypes.shape({
			colors: PropTypes.array.isRequired,
			angle: PropTypes.number,
		}),
	};

	module.exports = { TextBase };
});
