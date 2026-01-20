/**
 * @module ui-system/blocks/banners/push-banner
 */
jn.define('ui-system/blocks/banners/push-banner', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { ShimmerView } = require('layout/polyfill');
	const { Color, Component, Indent } = require('tokens');
	const { IconView } = require('ui-system/blocks/icon');
	const { Ellipsize } = require('utils/enums/style');
	const { mergeImmutable } = require('utils/object');
	const { Text4, Text6 } = require('ui-system/typography/text');
	const { PropTypes } = require('utils/validation');

	/**
	 * @typedef {Object} PushBannerProps
	 * @property {string} testId
	 * @property {string} title
	 * @property {string} [description='']
	 * @property {Function} [onClick=null]
	 * @property {boolean} [accent=false]
	 * @property {boolean} [animated=true]
	 * @property {Object} [leftIcon=null]
	 * @property {number|null} [animationCount=null]
	 * @property {LayoutComponent} [rightIcon=Icon.CHEVRON_TO_THE_RIGHT_SIZE_M]
	 *
	 * @class PushBanner
	 */
	class PushBanner extends LayoutComponent
	{
		get title()
		{
			return this.props.title || '';
		}

		get description()
		{
			return this.props.description || '';
		}

		get testId()
		{
			return this.props.testId || '';
		}

		get onClick()
		{
			return this.props.onClick || null;
		}

		get accent()
		{
			return Boolean(this.props.accent);
		}

		get animated()
		{
			return this.props.animated ?? true;
		}

		get leftIcon()
		{
			return this.props.leftIcon || null;
		}

		get rightIcon()
		{
			return this.props.rightIcon ?? Icon.CHEVRON_TO_THE_RIGHT_SIZE_M;
		}

		get animationCount()
		{
			return this.props.animationCount || null;
		}

		get animationDuration()
		{
			return this.props.animationDuration || 1500;
		}

		render()
		{
			const { style } = this.props;

			return ShimmerView(
				mergeImmutable(
					{
						testId: `push-banner-${this.testId}`,
						animating: this.animated,
						animationCount: this.animationCount,
						animationDuration: this.animationDuration,
					},
					{ style },
				),
				this.renderContainer(),
			);
		}

		renderContainer()
		{
			return View(
				{
					style: {
						borderRadius: Component.elementAccentCorner.toNumber(),
						backgroundColor: this.accent ? Color.accentMainPrimary.toHex() : Color.accentSoftBlue2.toHex(),
						paddingLeft: Indent.XL3.toNumber(),
						paddingRight: Indent.XL2.toNumber(),
						paddingVertical: Indent.S.toNumber(),
					},
					onClick: this.onClick,
				},
				this.renderInnerContent(),
			);
		}

		renderInnerContent()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						paddingRight: Indent.XS.toNumber(),
						zIndex: 1,
					},
				},
				this.renderLeftIcon(),
				this.renderContent(),
				this.renderRightIcon(),
			);
		}

		renderLeftIcon()
		{
			return View(
				{
					style: {
						marginRight: Indent.XL.toNumber(),
					},
				},
				this.leftIcon,
			);
		}

		renderContent()
		{
			return View(
				{
					style: {
						flex: 1,
					},
				},
				this.renderTitle(),
				this.renderDescription(),
			);
		}

		renderTitle()
		{
			return Text4({
				text: String(this.title),
				color: this.accent ? Color.baseWhiteFixed : Color.accentMainLink,
				accent: true,
				numberOfLines: 1,
				ellipsize: Ellipsize.END.getValue(),
			});
		}

		renderDescription()
		{
			if (!this.description)
			{
				return null;
			}

			return Text6({
				text: String(this.description),
				color: this.accent ? Color.chatOverallBaseWhite2 : Color.base3,
				style: {
					marginTop: Indent.XS2.toNumber(),
				},
				numberOfLines: 2,
				ellipsize: Ellipsize.END.getValue(),
			});
		}

		renderRightIcon()
		{
			if (!this.rightIcon)
			{
				return null;
			}

			return View(
				{
					style: {
						justifyContent: 'center',
						alignItems: 'center',
						width: 24,
						height: 24,
						backgroundColor: this.accent ? Color.chatMyPrimary3.toHex() : Color.accentSoftBlue3.toHex(),
						borderRadius: Component.elementAccentCorner.toNumber(),
						marginLeft: Indent.XL.toNumber(),
					},
				},
				IconView({
					icon: this.rightIcon,
					color: this.accent ? Color.baseWhiteFixed : Color.accentMainPrimaryalt,
					size: 20,
				}),
			);
		}
	}

	PushBanner.propTypes = {
		title: PropTypes.string.isRequired,
		testId: PropTypes.string.isRequired,
		description: PropTypes.string,
		onClick: PropTypes.func,
		accent: PropTypes.bool,
		animated: PropTypes.bool,
		rightIcon: PropTypes.instanceOf(Icon),
		leftIcon: PropTypes.object,
	};

	module.exports = {
		/**
		 * @param {PushBannerProps} props
		 * @returns {PushBanner}
		 */
		PushBanner: (props) => new PushBanner(props),
	};
});
