/**
 * @module timeman/layout/status-box
 */
jn.define('timeman/layout/status-box', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { H3 } = require('ui-system/typography/heading');
	const { Component, Indent } = require('tokens');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { ReportBanner } = require('timeman/ui/report-banner');
	const { makeLibraryImagePath } = require('asset-manager');

	const BOX_BASE_HEIGHT = 380;
	const IMAGE_SIZE = 224;
	const BANNER_HEIGHT = 82;

	class StatusBox extends PureComponent
	{
		static getContentHeight({ hasAutoReport, hasGpt, hasTitle })
		{
			let height = StatusBox.getBaseContentHeight();
			if (hasAutoReport || hasGpt)
			{
				height += StatusBox.getBannerHeight();
			}

			if (hasTitle)
			{
				height += 42;
			}

			return height;
		}

		static getBaseContentHeight()
		{
			return BOX_BASE_HEIGHT;
		}

		static getBannerHeight()
		{
			return BANNER_HEIGHT;
		}

		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				context: this,
				prefix: 'status-box',
			});
		}

		fadeIn()
		{
			this.boxRef?.animate({ opacity: 1, duration: 300 });
		}

		render()
		{
			const { buttons, style = {} } = this.props;

			const boxProps = {
				style,
				testId: this.getTestId('container'),
				ref: (ref) => {
					this.boxRef = ref;
				},
			};

			if (buttons?.length > 0)
			{
				boxProps.footer = BoxFooter(
					{
						testId: this.getTestId('footer'),
					},
					...buttons,
				);
			}

			return Box(
				boxProps,
				this.#renderConfetti(),
				View(
					{
						style: {
							marginHorizontal: Component.paddingLrMore.toNumber(),
						},
					},
					this.#renderHeader(),
					this.#renderImage(),
					this.#renderTitle(),
					this.#renderBanner(),
				),
			);
		}

		#renderConfetti()
		{
			const { showConfetti } = this.props;

			if (showConfetti === false)
			{
				return null;
			}

			return Image({
				style: {
					position: 'absolute',
					width: '100%',
					height: 126,
					top: -20,
				},
				resizeMode: 'stretch',
				svg: {
					uri: makeLibraryImagePath('confetti.svg', 'graphic'),
				},
			});
		}

		#renderHeader()
		{
			const { header } = this.props;

			if (!header)
			{
				return View({
					style: {
						height: 59,
					},
				});
			}

			return H3({
				style: {
					height: 59,
					textAlign: 'center',
				},
				text: header,
				testId: this.getTestId('header-field'),
			});
		}

		#renderImage()
		{
			const { imageUri } = this.props;

			return Image({
				style: {
					width: IMAGE_SIZE,
					height: IMAGE_SIZE,
					alignSelf: 'center',
					marginVertical: Indent.L.toNumber(),
				},
				uri: imageUri,
				testId: this.getTestId('image'),
			});
		}

		#renderTitle()
		{
			const { title } = this.props;

			return H3({
				style: {
					textAlign: 'center',
				},
				text: title,
				testId: this.getTestId('title-field'),
			});
		}

		#renderBanner()
		{
			const { banner } = this.props;

			if (!banner?.text)
			{
				return null;
			}

			const bannerProps = {
				testId: this.getTestId('banner'),
				text: banner.text,
				hasAutoReport: banner.hasAutoReport,
				hasGpt: banner.hasGpt,
				style: {
					marginTop: Indent.XL3.toNumber(),
				},
			};

			if (banner.imageUri)
			{
				bannerProps.imageUri = banner.imageUri;
			}

			return ReportBanner(bannerProps);
		}
	}

	StatusBox.defaultProps = {
		showConfetti: true,
	};

	StatusBox.propTypes = {
		testId: PropTypes.string.isRequired,
		header: PropTypes.string,
		title: PropTypes.string.isRequired,
		imageUri: PropTypes.string.isRequired,
		showConfetti: PropTypes.bool,
		style: PropTypes.object,
		buttons: PropTypes.array,
		banner: PropTypes.shape({
			text: PropTypes.string.isRequired,
			imageUri: PropTypes.string,
			hasAutoReport: PropTypes.bool,
			hasGpt: PropTypes.bool,
		}),
	};

	module.exports = { StatusBox };
});
