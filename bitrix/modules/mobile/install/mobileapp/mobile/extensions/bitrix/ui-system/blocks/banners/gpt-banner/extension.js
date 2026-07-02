/**
 * @module ui-system/blocks/banners/gpt-banner
 */
jn.define('ui-system/blocks/banners/gpt-banner', (require, exports, module) => {
	const { Corner, Indent, Typography, Color } = require('tokens');
	const { BBCodeText } = require('ui-system/typography/bbcodetext');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { makeLibraryImagePath } = require('asset-manager');

	const DEFAULT_IMAGE_URI = makeLibraryImagePath('bitrix-gpt.png', 'graphic');

	const IMAGE_SIZE = 78;

	/**
	 * @param {GptBannerProps} props
	 */
	class GptBannerClass extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				context: this,
				prefix: this.getTestIdPrefix(),
			});
		}

		render()
		{
			const { testId, onClick, style = {} } = this.props;

			return View(
				{
					testId,
					style,
				},
				View(
					{
						onClick,
						style: {
							minHeight: this.getMinHeight(),
						},
					},
					this.#renderImage(),
					this.#renderCard(),
				),
			);
		}

		#renderImage()
		{
			return Image({
				testId: this.getTestId('image'),
				uri: this.getImageUri(),
				style: {
					position: 'absolute',
					left: 0,
					bottom: 0,
					width: this.getImageWidth(),
					height: this.getImageHeight(),
					zIndex: 1,
				},
			});
		}

		#renderCard()
		{
			const { text, numberOfLines } = this.props;

			return View(
				{
					style: {
						flex: 1,
						justifyContent: 'flex-end',
					},
				},
				View(
					{
						testId: this.getTestId('card'),
						style: {
							justifyContent: 'center',
							paddingVertical: Indent.S.toNumber(),
							paddingRight: Indent.L.toNumber(),
							paddingLeft: this.getImageWidth() + Indent.S.toNumber(),
							borderWidth: 1,
							borderRadius: Corner.L.toNumber(),
							borderColor: this.getCardBorderColor().toHex(),
							...this.getCardBackgroundStyle(),
						},
					},
					BBCodeText({
						testId: this.getTestId('text'),
						text,
						typography: this.getTypography(),
						numberOfLines,
						ellipsize: 'end',
					}),
				),
			);
		}

		getTestIdPrefix()
		{
			return 'gpt-banner';
		}

		getImageUri()
		{
			return this.props.imageUri ?? DEFAULT_IMAGE_URI;
		}

		getImageWidth()
		{
			return IMAGE_SIZE;
		}

		getImageHeight()
		{
			return IMAGE_SIZE;
		}

		getMinHeight()
		{
			return this.getImageHeight();
		}

		/**
		 * @returns {Color}
		 */
		getCardBorderColor()
		{
			return Color.accentSoftViolet1;
		}

		getCardBackgroundStyle()
		{
			return {
				backgroundColorGradient: {
					angle: 190,
					start: Color.bgBitrixGptLightGradient2.toHex(),
					middle: Color.bgBitrixGptLightGradient3.toHex(),
					end: Color.bgBitrixGptLightGradient4.toHex(),
				},
			};
		}

		getTypography()
		{
			return this.props.typography ?? Typography.text4;
		}
	}

	GptBannerClass.defaultProps = {
		numberOfLines: 3,
	};

	GptBannerClass.propTypes = {
		testId: PropTypes.string.isRequired,
		text: PropTypes.string.isRequired,
		imageUri: PropTypes.string,
		typography: PropTypes.instanceOf(Typography),
		numberOfLines: PropTypes.number,
		onClick: PropTypes.func,
		style: PropTypes.object,
	};

	module.exports = {
		GptBanner: (props) => new GptBannerClass(props),
		GptBannerClass,
	};
});
