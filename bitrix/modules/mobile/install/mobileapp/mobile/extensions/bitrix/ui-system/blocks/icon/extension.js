/**
 * @module ui-system/blocks/icon
 */
jn.define('ui-system/blocks/icon', (require, exports, module) => {
	const { Color } = require('tokens');
	const { PropTypes } = require('utils/validation');
	const { outline, Icon } = require('assets/icons');
	const { OutlineIconTypes } = require('assets/icons/types');
	const { mergeImmutable } = require('utils/object');
	const { isNil } = require('utils/type');
	const { withCurrentDomain } = require('utils/url');

	const DEFAULT_ICON_SIZE = {
		width: 20,
		height: 20,
	};

	/**
	 * @typedef IconViewProps
	 * @property {string} [testId]
	 * @property {Function} [forwardRef]
	 * @property {string | Icon} [icon]
	 * @property {Color} [color]
	 * @property {number} [opacity]
	 * @property {Object | number} [size]
	 * @property {number} [size.height]
	 * @property {number} [size.width]
	 * @property {boolean} [disabled]
	 * @property {boolean} [solid]
	 * @property {Object} [style]
	 * @property {Function} [onClick]
	 *
	 * @class IconView
	 */
	class IconView extends LayoutComponent
	{
		render()
		{
			const { testId, forwardRef } = this.props;

			if (!this.#hasIcon())
			{
				return null;
			}

			const imageProps = this.#removeEmptyValues({
				ref: forwardRef,
				testId,
				...this.getProps(),
			});

			return Image(imageProps);
		}

		getProps()
		{
			const { icon, style = {}, onClick, onSuccess, onSvgContentError, resizeMode } = this.props;

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
				onSuccess,
				onSvgContentError,
				onFailure: this.handleOnFailure,
			});
		}

		getEnumIconParams()
		{
			const { icon, solid } = this.props;
			const svgContent = icon.getSvg();

			let iconEnum = icon;

			if (svgContent)
			{
				return {
					svg: {
						content: svgContent,
					},
				};
			}

			if (solid)
			{
				const solidIconKey = this.#getSolidEnumKey();
				if (Icon.hasEnum(solidIconKey))
				{
					iconEnum = Icon.getEnum(solidIconKey);
				}
			}

			return {
				named: {
					named: iconEnum.getIconName(),
					fallbackUrl: withCurrentDomain(iconEnum.getPath()),
				},
			};
		}

		#getSolidEnumKey()
		{
			const icon = this.#getIcon();
			const iconName = icon.getIconName();

			return `solid_${iconName}`.toUpperCase();
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
			const icon = this.#getIcon();

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
			const { opacity, disabled } = this.props;

			const toHex = (token) => token.toHex(opacity);

			if (disabled)
			{
				return toHex(Color.base6);
			}

			const { iconColor, color } = this.props;

			let colorToken = iconColor || color;

			if (colorToken === null)
			{
				return null;
			}

			colorToken = colorToken || Color.base1;

			return toHex(colorToken);
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

		#getIcon()
		{
			const { icon } = this.props;

			return icon;
		}

		#hasIcon()
		{
			return this.#getIcon() && (this.isIconContent() || this.#getIcon() instanceof Icon);
		}

		handleOnFailure = () => {
			if (Application.isBeta())
			{
				console.warn(`IconView: The image with the parameters ${JSON.stringify(this.getEnumIconParams())} was not uploaded. The icon enum must be updated`);
			}
		};

		#removeEmptyValues(obj)
		{
			return Object.fromEntries(
				Object.entries(obj).filter(([_, value]) => !isNil(value)),
			);
		}
	}

	IconView.propTypes = {
		testId: PropTypes.string,
		forwardRef: PropTypes.func,
		icon: PropTypes.oneOfType([
			PropTypes.instanceOf(Icon),
			PropTypes.string,
		]),
		solid: PropTypes.bool,
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
		/**
		 * @param {IconViewProps} props
		 */
		IconView: (props) => new IconView(props),
		Icon,
		iconTypes: {
			outline: OutlineIconTypes,
		},
	};
});
