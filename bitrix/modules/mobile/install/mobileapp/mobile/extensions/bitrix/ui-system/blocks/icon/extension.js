/**
 * @module ui-system/blocks/icon
 */
jn.define('ui-system/blocks/icon', (require, exports, module) => {
	const { Color } = require('tokens');
	const { PropTypes } = require('utils/validation');
	const { outline, Icon } = require('assets/icons');
	const { OutlineIconTypes } = require('assets/icons/types');
	const { mergeImmutable } = require('utils/object');

	const DEFAULT_ICON_SIZE = {
		width: 20,
		height: 20,
	};

	/**
	 * @class IconView
	 * @params {object} props
	 * @params {string} [props.testId]
	 * @params {Function} [props.forwardRef]
	 * @params {string | Icon} [props.icon]
	 * @params {Color} [props.color]
	 * @params {number} [props.opacity]
	 * @params {Object | number} [props.size]
	 * @params {number} [props.size.height]
	 * @params {number} [props.size.width]
	 * @params {boolean} [props.disabled]
	 * @params {Object} [props.style]
	 */
	class IconView extends LayoutComponent
	{
		render()
		{
			const { testId, forwardRef } = this.props;

			return Image({
				ref: forwardRef,
				testId,
				...this.getProps(),
			});
		}

		getProps()
		{
			const { icon, style = {}, onClick, onFailure, onSuccess, onSvgContentError, resizeMode } = this.props;

			let props = {
				style: this.getStyle(),
				tintColor: this.getColor(),
			};

			if (this.isIconContent())
			{
				props.svg = {
					content: this.getIconContent(),
				};

				if (Application.isBeta())
				{
					console.warn(`IconView: You are using an deprecated icon "<<${icon}>>" type, you need to use enums "Icon.<name your icon>", example "const { IconView, Icon } = require('ui-system/blocks/icon'); IconView({ icon: Icon.MOBILE })`);
				}
			}

			if (icon instanceof Icon)
			{
				props = {
					...props,
					...this.getEnumIconParams(),
				};
			}

			return mergeImmutable(props, {
				style,
				resizeMode,
				onClick,
				onFailure,
				onSuccess,
				onSvgContentError,
			});
		}

		getEnumIconParams()
		{
			const { icon } = this.props;

			const named = icon.getIconName();
			const path = icon.getPath();
			const svgContent = icon.getSvg();

			if (svgContent)
			{
				return {
					svg: {
						content: svgContent,
					},
				};
			}

			if (path)
			{
				return {
					svg: {
						uri: path,
					},
				};
			}

			if (named)
			{
				return {
					named: icon.getIconName(),
				};
			}

			return {};
		}

		getIconContent()
		{
			const {
				icon = null,
				iconParams = {},
			} = this.props;

			return outline[icon](iconParams);
		}

		isIconContent()
		{
			const { icon } = this.props;

			return typeof icon === 'string' && outline[icon];
		}

		getStyle()
		{
			const size = this.getIconSize();

			return {
				...size,
			};
		}

		getColor()
		{
			const { opacity, iconColor, color, disabled } = this.props;

			let colorToken = iconColor || color;

			if (disabled)
			{
				colorToken = Color.base6;
			}

			return colorToken.toHex(opacity);
		}

		getIconSize()
		{
			const { size, iconSize } = this.props;

			if (!size && !iconSize)
			{
				return DEFAULT_ICON_SIZE;
			}

			const iconViewSize = size || iconSize;

			return typeof iconViewSize === 'number' ? this.getBoxSize(iconViewSize) : iconViewSize;
		}

		getBoxSize(size)
		{
			return {
				width: size,
				height: size,
			};
		}
	}

	IconView.propTypes = {
		testId: PropTypes.string,
		forwardRef: PropTypes.func,
		icon: PropTypes.oneOfType([
			PropTypes.instanceOf(Icon),
			PropTypes.string,
		]),
		color: PropTypes.instanceOf(Color),
		opacity: PropTypes.number,
		size: PropTypes.oneOfType([
			PropTypes.number,
			PropTypes.exact({
				height: PropTypes.number,
				width: PropTypes.number,
			}),
		]),
		disabled: PropTypes.bool,
		style: PropTypes.object,
	};

	module.exports = {
		IconView: (props) => new IconView(props),
		Icon,
		iconTypes: {
			outline: OutlineIconTypes,
		},
	};
});
