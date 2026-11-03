/**
 * @module intranet/cowork-meetup-promo/story/src/slide
 */
jn.define('intranet/cowork-meetup-promo/story/src/slide', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Indent } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');
	const { H2 } = require('ui-system/typography/heading');
	const { Text3 } = require('ui-system/typography/text');
	const { Button } = require('ui-system/form/buttons/button');
	const {
		BACKGROUND_GRADIENT,
		BUTTON_COLOR,
		TEXT_COLOR,
	} = require('intranet/cowork-meetup-promo/story/src/constants');

	const IMAGE_HORIZONTAL_INDENT = 6;
	// Artwork is drawn for a phone-sized layout, so it must not stretch to the full width of a tablet.
	const SLIDE_MAX_WIDTH = 440;

	/**
	 * @typedef {Object} CoworkMeetupPromoSlideProps
	 * @property {string} testId
	 * @property {{uri: string, heightRatio: number}} image
	 * @property {{uri: string, heightRatio: number}} glow
	 * @property {string} title
	 * @property {string} description
	 * @property {Object} position
	 * @property {number} position.top
	 * @property {number} position.horizontal
	 * @property {Function} onButtonClick
	 *
	 * @extends {LayoutComponent<CoworkMeetupPromoSlideProps>}
	 */
	class CoworkMeetupPromoSlide extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });
		}

		render()
		{
			const { position } = this.props;

			return View(
				{
					testId: this.getTestId(),
					style: {
						flex: 1,
						backgroundColorGradient: BACKGROUND_GRADIENT,
					},
				},
				this.#renderGlow(),
				View(
					{
						style: {
							flex: 1,
							justifyContent: 'space-between',
							marginTop: position.top,
							paddingTop: Indent.XL4.toNumber(),
							marginBottom: position.horizontal,
						},
					},
					View(
						{
							style: {
								marginTop: Indent.XL3.toNumber(),
							},
						},
						this.#renderImage(),
						this.#renderContent(),
					),
					this.#renderButton(),
				),
			);
		}

		#renderGlow()
		{
			const { glow } = this.props;
			const width = device.screen.width;

			// the glow is drawn around a phone-sized slide: on a wider screen it either stretches over
			// the whole slide or hangs as a band in the middle, so the plain background is left instead
			if (width > SLIDE_MAX_WIDTH)
			{
				return null;
			}

			return View(
				{
					testId: this.getTestId('glow'),
					style: {
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
					},
				},
				Image({
					style: {
						position: 'absolute',
						top: 0,
						left: 0,
						width,
						height: width * glow.heightRatio,
					},
					resizeMode: 'contain',
					uri: glow.uri,
				}),
			);
		}

		#renderImage()
		{
			const { image } = this.props;
			const width = Math.min(device.screen.width, SLIDE_MAX_WIDTH) - IMAGE_HORIZONTAL_INDENT * 2;

			return Image({
				style: {
					width,
					height: width * image.heightRatio,
					alignSelf: 'center',
				},
				resizeMode: 'contain',
				uri: image.uri,
			});
		}

		#renderContent()
		{
			const { title, description, position } = this.props;

			return View(
				{
					style: {
						paddingVertical: Indent.XL3.toNumber(),
						marginHorizontal: position.horizontal,
					},
				},
				H2({
					testId: this.getTestId('title'),
					text: title,
					color: TEXT_COLOR,
					accent: true,
					style: {
						textAlign: 'center',
						marginBottom: Indent.XL3.toNumber(),
					},
				}),
				Text3({
					testId: this.getTestId('description'),
					text: description,
					color: TEXT_COLOR,
					style: {
						textAlign: 'center',
					},
				}),
			);
		}

		#renderButton()
		{
			const { onButtonClick, position } = this.props;

			return View(
				{
					style: {
						marginHorizontal: position.horizontal,
					},
				},
				Button({
					testId: this.getTestId('button'),
					text: Loc.getMessage('M_INTRANET_COWORK_MEETUP_PROMO_BUTTON'),
					stretched: true,
					color: TEXT_COLOR,
					backgroundColor: BUTTON_COLOR,
					onClick: onButtonClick,
				}),
			);
		}
	}

	module.exports = {
		CoworkMeetupPromoSlide,
	};
});
