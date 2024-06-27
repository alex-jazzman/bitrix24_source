/**
 * @module ui-system/blocks/status-block
 */
jn.define('ui-system/blocks/status-block', (require, exports, module) => {
	const { mergeImmutable } = require('utils/object');
	const { Color, Indent, Component } = require('tokens');
	const { BBCodeText } = require('ui-system/typography/bbcodetext');
	const { makeLibraryImagePath } = require('asset-manager');
	const { PropTypes } = require('utils/validation');

	/**
	 * @class StatusBlock
	 * @param {Object} props
	 * @param {string} props.testId
	 * @param {string} [props.title]
	 * @param {Color} [props.titleColor]
	 * @param {string} [props.description]
	 * @param {Color} [props.descriptionColor]
	 * @param {string} [props.footnote]
	 * @param {Color} [props.footnoteColor]
	 * @param {Array<Button>} [props.buttons]
	 * @param {boolean} [props.emptyScreen]
	 * @params {Function} [props.forwardRef]
	 * @params {Object} [props.style]
	 * @returns {StatusBlock}
	 */
	class StatusBlock extends LayoutComponent
	{
		render()
		{
			const { forwardRef, emptyScreen } = this.props;

			return emptyScreen
				? this.renderEmptyScreen(forwardRef)
				: this.renderStatusContent(forwardRef);
		}

		renderEmptyScreen(forwardRef)
		{
			const { style = {} } = this.props;

			return View(
				{
					ref: forwardRef,
					style: mergeImmutable(
						{
							width: '100%',
							height: '100%',
						},
						style,
					),
					safeArea: {
						bottom: true,
					},
				},
				RefreshView(
					{
						style: {
							flexDirection: 'column',
							flexGrow: 1,
						},
						refreshing: false,
						enabled: this.isRefreshable,
						onRefresh: this.handleOnRefresh,
					},
					this.renderStatusContent(),
				),
			);
		}

		renderStatusContent(forwardRef)
		{
			const { testId } = this.props;

			return View(
				{
					ref: forwardRef,
					testId,
					style: {
						flexGrow: 1,
						justifyContent: 'center',
						alignItems: 'center',
						flexDirection: 'column',
						paddingVertical: Indent.XL4.toNumber(),
					},
				},
				this.renderImage(),
				this.renderTextBlock(),
				this.renderButtons(),
			);
		}

		renderImage()
		{
			const { image } = this.props;

			if (!image)
			{
				return null;
			}

			return image;
		}

		renderTextBlock()
		{
			return View(
				{
					style: {
						alignItems: 'center',
						paddingVertical: Indent.XL3.toNumber(),
						paddingHorizontal: Component.paddingLrMore.toNumber(),
					},
				},
				this.renderTitle(),
				this.renderDescription(),
				this.renderFootNote(),
			);
		}

		renderTitle()
		{
			const { title, titleColor } = this.props;

			if (!this.shouldRenderText(title))
			{
				return null;
			}

			return BBCodeText({
				value: title,
				size: 3,
				accent: true,
				header: true,
				color: Color.resolve(titleColor, Color.base1),
				style: this.getTextStyle(false),
			});
		}

		renderDescription()
		{
			const { description, descriptionColor } = this.props;

			if (!this.shouldRenderText(description))
			{
				return null;
			}

			return BBCodeText({
				size: 3,
				value: description,
				color: Color.resolve(descriptionColor, Color.base2),
				style: this.getTextStyle(),
			});
		}

		renderFootNote()
		{
			const { footnote, footnoteColor } = this.props;

			if (!this.shouldRenderText(footnote))
			{
				return null;
			}

			return BBCodeText({
				size: 4,
				value: footnote,
				color: Color.resolve(footnoteColor, Color.base4),
				style: this.getTextStyle(),
			});
		}

		renderButtons()
		{
			const { buttons = [] } = this.props;

			if (buttons.length === 0)
			{
				return null;
			}

			return View(
				{
					style: {
						flexDirection: 'row',
						paddingTop: Indent.S.toNumber(),
					},
				},
				...buttons.map((button, i) => {
					const isFirst = i === 0;

					return View(
						{
							style: {
								marginLeft: isFirst ? 0 : Indent.L.toNumber(),
							},
						},
						button,
					);
				}),
			);
		}

		/**
		 * @param {boolean} shouldMargin
		 */
		getTextStyle(shouldMargin = true)
		{
			const style = {
				textAlign: 'center',
			};

			if (shouldMargin)
			{
				style.marginTop = Indent.L.toNumber();
			}

			return style;
		}

		/**
		 * @param {any} value
		 * @returns {boolean}
		 */
		shouldRenderText(value)
		{
			return typeof value === 'string' && value !== '';
		}

		handleOnRefresh = () => {
			const { onRefresh } = this.props;

			if (onRefresh)
			{
				onRefresh();
			}
		};

		isRefreshable()
		{
			const { onRefresh } = this.props;

			return typeof onRefresh === 'function';
		}
	}

	StatusBlock.defaultProps = {
		emptyScreen: false,
	};

	StatusBlock.propTypes = {
		testId: PropTypes.string.isRequired,
		title: PropTypes.string,
		titleColor: PropTypes.string,
		description: PropTypes.string,
		descriptionColor: PropTypes.string,
		footnote: PropTypes.string,
		footnoteColor: PropTypes.string,
		emptyScreen: PropTypes.bool,
		forwardRef: PropTypes.func,
		style: PropTypes.object,
	};

	module.exports = {
		StatusBlock: (props) => new StatusBlock(props),
		makeLibraryImagePath,
	};
});
