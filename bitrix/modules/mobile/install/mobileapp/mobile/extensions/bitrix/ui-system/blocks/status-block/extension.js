/**
 * @module ui-system/blocks/status-block
 */

jn.define('ui-system/blocks/status-block', (require, exports, module) => {
	const { Area } = require('ui-system/layout/area');
	const { mergeImmutable } = require('utils/object');
	const { Color, Indent, Component } = require('tokens');
	const { BBCodeText } = require('ui-system/typography/bbcodetext');
	const { Text2 } = require('ui-system/typography/text');
	const { IconView } = require('ui-system/blocks/icon');
	const { Feature } = require('feature');
	const { makeLibraryImagePath } = require('asset-manager');
	const { PropTypes } = require('utils/validation');
	const { Align } = require('utils/enums/style');

	class StatusBlock extends LayoutComponent
	{
		/** @param {StatusBlockProps} props */
		constructor(props)
		{
			super(props);

			this.testId = props.testId ?? 'status-block';
		}

		get containerStyle()
		{
			const { style = {} } = this.props;

			return mergeImmutable(
				{
					width: '100%',
					height: '100%',
				},
				style,
			);
		}

		render()
		{
			const { emptyScreen } = this.props;

			return emptyScreen
				? this.renderEmptyScreen()
				: this.renderStatusContent();
		}

		renderEmptyScreen()
		{
			const { forwardRef } = this.props;

			if (Feature.isRefreshViewFixEnabled())
			{
				return View(
					{
						ref: forwardRef,
						style: this.containerStyle,
						safeArea: { bottom: true },
					},
					this.renderRefreshView(
						View({
							style: {
								flex: 1,
							},
						}),
					),
					View(
						{
							style: {
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								flexDirection: 'column',
								justifyContent: 'center',
								alignItems: 'center',
							},
							clickable: false,
						},
						this.renderStatusContent(),
					),
				);
			}

			return View(
				{
					ref: forwardRef,
					style: this.containerStyle,
					safeArea: { bottom: true },
				},
				this.renderRefreshView(this.renderStatusContent()),
			);
		}

		renderRefreshView(content)
		{
			const { preventRefresh } = this.props;

			return RefreshView(
				{
					style: {
						flexDirection: 'column',
						flexGrow: 1,
					},
					refreshing: false,
					enabled: preventRefresh ? false : this.isRefreshable(),
					onRefresh: this.handleOnRefresh,
				},
				content,
			);
		}

		renderStatusContent()
		{
			const { forwardRef, verticalAlign, style = {} } = this.props;

			return Area(
				{
					ref: forwardRef,
					testId: this.testId,
					clickable: false,
					style: mergeImmutable(
						{
							flexGrow: 1,
							justifyContent: Align.resolve(verticalAlign, Align.CENTER).toString(),
							alignItems: 'center',
						},
						style,
					),
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

			return View(
				{
					clickable: false,
				},
				image,
			);
		}

		renderTextBlock()
		{
			return View(
				{
					style: {
						clickable: false,
						alignItems: 'center',
						paddingVertical: Indent.XL3.toNumber(),
						paddingHorizontal: Component.paddingLrMore.toNumber(),
					},
				},
				this.renderTitle(),
				this.renderDescription(),
				this.renderList(),
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
				testId: `${this.testId}-title`,
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
			const { description, descriptionColor, onDescriptionLinkClick } = this.props;

			if (!this.shouldRenderText(description))
			{
				return null;
			}

			return BBCodeText({
				testId: `${this.testId}-description`,
				size: 3,
				value: description,
				color: Color.resolve(descriptionColor, Color.base2),
				style: this.getTextStyle(),
				onLinkClick: onDescriptionLinkClick,
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
				testId: `${this.testId}-footnote`,
				size: 4,
				value: footnote,
				color: Color.resolve(footnoteColor, Color.base4),
				style: this.getTextStyle(),
			});
		}

		renderList()
		{
			const { list = [] } = this.props;

			if (list.length === 0)
			{
				return null;
			}

			return View(
				{
					testId: `${this.testId}-list`,
					style: {
						width: '100%',
						marginTop: Indent.L.toNumber(),
						paddingTop: Indent.XL.toNumber(),
					},
				},
				...list.map((item, index) => this.renderListItem(item, index)),
			);
		}

		renderListItem(item, index)
		{
			return View(
				{
					testId: `${this.testId}-list-item-${index}`,
					style: {
						width: '100%',
						flexDirection: 'row',
						alignItems: 'flex-start',
						marginTop: index === 0 ? 0 : Indent.L.toNumber(),
					},
				},
				IconView({
					testId: `${this.testId}-list-item-${index}-icon`,
					icon: item.icon,
					size: 26,
					color: Color.accentMainPrimary,
					style: {
						marginRight: Indent.M.toNumber(),
					},
				}),
				Text2({
					testId: `${this.testId}-list-item-${index}-text`,
					text: item.text,
					color: Color.base2,
					style: {
						flexShrink: 1,
					},
				}),
			);
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
		preventRefresh: false,
	};

	StatusBlock.propTypes = {
		testId: PropTypes.string.isRequired,
		title: PropTypes.string,
		titleColor: PropTypes.instanceOf(Color),
		description: PropTypes.string,
		descriptionColor: PropTypes.instanceOf(Color),
		list: PropTypes.arrayOf(PropTypes.shape({
			icon: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
			text: PropTypes.string.isRequired,
		})),
		footnote: PropTypes.string,
		footnoteColor: PropTypes.instanceOf(Color),
		emptyScreen: PropTypes.bool,
		forwardRef: PropTypes.func,
		verticalAlign: PropTypes.instanceOf(Align),
		style: PropTypes.object,
		image: PropTypes.object,
		preventRefresh: PropTypes.bool,
	};

	module.exports = {
		/**
		 * @param {StatusBlockProps} props
		 * @returns {StatusBlock}
		 */
		StatusBlock: (props) => new StatusBlock(props),
		VerticalAlign: Align,
		makeLibraryImagePath,
	};
});
