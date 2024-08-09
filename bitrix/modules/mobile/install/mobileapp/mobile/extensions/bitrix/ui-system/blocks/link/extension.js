/**
 * @module ui-system/blocks/link
 */
jn.define('ui-system/blocks/link', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Text, Text1, Text2, Text3, Text4, Text5, Text6, Capital } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { LinkMode } = require('ui-system/blocks/link/src/mode-enum');
	const { LinkDesign } = require('ui-system/blocks/link/src/design-enum');
	const { PropTypes } = require('utils/validation');
	const { isValidLink } = require('utils/url');
	const { inAppUrl } = require('in-app-url');
	const { Ellipsize } = require('utils/enums/style');

	const ICON_SIZE = 20;

	/**
	 * @function Link
	 * @params {object} props
	 * @params {string} props.testId
	 * @params {string} props.text
	 * @params {number} props.size
	 * @params {string}[ props.href]
	 * @params {boolean} [props.useInAppLink=true]
	 * @params {Color} [props.color=Color.accentMainLink]
	 * @params {Ellipsize} [props.ellipsize=Ellipsize.END]
	 * @params {string} [props.leftIcon]
	 * @params {string} [props.rightIcon]
	 * @params {function} [props.forwardRef]
	 * @params {function} [props.onClick]
	 * @return Link
	 */
	class Link extends LayoutComponent
	{
		get mode()
		{
			const { mode } = this.props;

			return LinkMode.resolve(mode, LinkMode.PLAIN);
		}

		get design()
		{
			const { design } = this.props;

			return LinkDesign.resolve(design, LinkDesign.PRIMARY);
		}

		render()
		{
			const { testId, leftIcon, rightIcon, forwardRef, style = {} } = this.props;

			return View(
				{
					ref: forwardRef,
					testId,
					style: {
						flexDirection: 'row',
						flexShrink: 1,
						...style,
					},
				},
				View(
					{
						style: {
							alignItems: 'center',
							flexDirection: 'row',
							flexShrink: 1,
						},
						onClick: this.#handleOnClick,
					},
					this.#renderIcon(leftIcon, {
						marginRight: Indent.XS2.toNumber(),
					}),
					this.#renderText(),
					this.#renderIcon(rightIcon),
				),
			);
		}

		#renderIcon(icon, style = {})
		{
			if (!icon)
			{
				return null;
			}

			return IconView({
				color: this.getColor(),
				icon,
				size: ICON_SIZE,
				style,
			});
		}

		#renderText()
		{
			const { text, size = 4, accent = false, typography } = this.props;

			const TypographyText = typography || Text;

			return View(
				{
					style: {
						flexShrink: 1,
						...this.getBorderStyle(),
					},
				},
				TypographyText({
					text,
					size,
					accent,
					color: this.getColor(),
					ellipsize: this.#getEllipsize(),
					numberOfLines: 1,
					style: {
						flexShrink: 1,
					},
				}),
			);
		}

		#handleOnClick = () => {
			const { onClick, href, useInAppLink = true } = this.props;

			if (useInAppLink && href && isValidLink(href))
			{
				inAppUrl.open(href);
			}

			if (onClick)
			{
				onClick(href);
			}
		};

		getBorderStyle()
		{
			return {
				borderBottomColor: this.getColor().toHex(0.3),
				paddingBottom: 1,
				...this.mode.getStyle(),
			};
		}

		getColor()
		{
			const { color } = this.props;
			const { color: designColor } = this.design.getStyle();

			return Color.resolve(color, designColor);
		}

		#getEllipsize()
		{
			const { ellipsize } = this.props;

			if (typeof ellipsize === 'string')
			{
				return ellipsize;
			}

			return Ellipsize.resolve(ellipsize, Ellipsize.END).toString();
		}
	}

	const renderLinkBy = (typography = null) => (props) => new Link({ ...props, typography });

	Link.defaultProps = {
		useInAppLink: true,
	};

	Link.propTypes = {
		testId: PropTypes.string.isRequired,
		text: PropTypes.string.isRequired,
		useInAppLink: PropTypes.bool,
		size: PropTypes.number,
		accent: PropTypes.bool,
		href: PropTypes.string,
		leftIcon: PropTypes.object,
		rightIcon: PropTypes.object,
		color: PropTypes.object,
		ellipsize: PropTypes.object,
		mode: PropTypes.object,
		onClick: PropTypes.func,
		forwardRef: PropTypes.func,
	};

	module.exports = {
		Link: renderLinkBy(),
		Link1: renderLinkBy(Text1),
		Link2: renderLinkBy(Text2),
		Link3: renderLinkBy(Text3),
		Link4: renderLinkBy(Text4),
		Link5: renderLinkBy(Text5),
		Link6: renderLinkBy(Text6),
		LinkCapital: renderLinkBy(Capital),
		LinkMode,
		LinkDesign,
		Icon,
		Ellipsize,
	};
});
