/**
 * @module ui-system/popups/aha-moment/src/hint
 */
jn.define('ui-system/popups/aha-moment/src/hint', (require, exports, module) => {
	const { Color, Indent, Component } = require('tokens');
	const { H4 } = require('ui-system/typography/heading');
	const { Text4 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');
	const { AhaMomentDirection } = require('ui-system/popups/aha-moment/src/direction-enum');
	const { isEqual } = require('utils/object');
	const { transition, chain } = require('animation');

	const FIXED_WIDTH = 339;
	const FIXED_IMAGE_WIDTH = 98;
	const CLOSE_SIZE = 24;

	/**
	 * @typedef {object} HintProps
	 * @property {string} [testId]
	 * @property {object} [targetParams]
	 * @property {string} [title]
	 * @property {string} [description]
	 * @property {Function} [onClose]
	 * @property {Function} [onClick]
	 *
	 * @class Hint
	 */
	class Hint extends LayoutComponent
	{
		/**
		 * @param {HintProps} props
		 */
		constructor(props)
		{
			super(props);

			this.direction = this.getDirection();
			this.svgSize = this.direction.getSvgSize();
			this.state = {
				popupRect: {},
			};

			this.ref = null;
			this.earRef = null;
			this.state = {
				popupRect: {},
			};
		}

		getBackgroundColor()
		{
			return Color.bgContentInapp.toHex();
		}

		/**
		 * @returns {{position: 'top' | 'bottom', x: number, y: number, width: number, height: number}}
		 */
		getTargetParams()
		{
			const { targetParams = {} } = this.props;

			return targetParams;
		}

		shouldShowActionButton()
		{
			const { buttonText } = this.props;

			return Boolean(buttonText);
		}

		#hasTitle()
		{
			return Boolean(this.#getTitle());
		}

		#hasDescription()
		{
			return Boolean(this.#getDescription());
		}

		getEarPosition()
		{
			const { popupRect } = this.state;
			const { x: popupX = 0 } = popupRect;
			const { x: targetX = 0, width: targetWidth } = this.getTargetParams();
			const horizontalValue = Math.round(targetX - popupX + targetWidth / 2 - this.svgSize.width / 2);
			const position = this.direction.getPosition();

			return {
				left: horizontalValue,
				[position]: 1,
			};
		}

		getDirection()
		{
			const { position = 'top' } = this.getTargetParams();

			return AhaMomentDirection.resolve(
				AhaMomentDirection.getEnum(position.toUpperCase()),
				AhaMomentDirection.TOP,
			);
		}

		render()
		{
			return this.#renderWrapper(
				View(
					{
						testId: this.#getTestId(),
						style: {
							position: 'relative',
							padding: Indent.XL.toNumber(),
							borderRadius: Component.popupCorner.toNumber(),
							width: FIXED_WIDTH,
							backgroundColor: this.getBackgroundColor(),
						},
					},
					View(
						{
							style: {
								flexDirection: 'row',
							},
						},
						this.#renderImage(),
						this.#renderBody(),
					),
					this.#renderCloseButton(),
				),
			);
		}

		#renderBody()
		{
			return View(
				{
					style: {
						flex: 1,
						alignItems: 'flex-start',
						paddingLeft: Indent.XL.toNumber(),
					},
				},
				this.#renderTitle(),
				this.#renderDescription(),
				this.#renderButtons(),
			);
		}

		#renderButtons()
		{
			if (!this.shouldShowActionButton())
			{
				return null;
			}

			const { buttonText, onClick } = this.props;

			return Button({
				testId: this.#getTestId('action-button'),
				text: buttonText,
				stretched: true,
				size: ButtonSize.S,
				design: ButtonDesign.OUTLINE,
				color: Color.baseWhiteFixed,
				borderColor: Color.baseWhiteFixed,
				onClick,
				style: {
					marginVertical: Indent.XS.toNumber(),
				},
			});
		}

		#renderDescription()
		{
			if (!this.#hasDescription())
			{
				return null;
			}

			const style = {};

			if (this.#hasTitle())
			{
				style.marginTop = Indent.S.toNumber();
			}

			if (this.shouldShowActionButton())
			{
				style.marginBottom = Indent.S.toNumber();
			}

			if (this.#hasCloseButton() && !this.#hasTitle())
			{
				style.marginRight = Indent.XL2.toNumber();
			}

			return Text4({
				testId: this.#getTestId('description'),
				text: this.#getDescription(),
				color: Color.baseWhiteFixed,
				style,
			});
		}

		#renderTitle()
		{
			if (!this.#hasTitle())
			{
				return null;
			}

			const style = {};

			if (this.#hasCloseButton())
			{
				style.marginRight = Indent.XL2.toNumber();
			}

			return H4({
				testId: this.#getTestId('title'),
				text: this.#getTitle(),
				color: Color.baseWhiteFixed,
				style,
			});
		}

		#renderImage()
		{
			const { image, shouldShowImageBackgroundColor = true } = this.props;

			if (!image)
			{
				return null;
			}

			return View({
				style: {
					alignItems: 'center',
					justifyContent: 'center',
					width: FIXED_IMAGE_WIDTH,
					padding: Indent.L.toNumber(),
					borderRadius: Component.elementMCorner.toNumber(),
					backgroundColor: shouldShowImageBackgroundColor && Color.baseWhiteFixed.toHex(0.12),
				},
			}, image);
		}

		#renderWrapper(content)
		{
			const isTop = this.direction.isTop();
			const style = {
				opacity: 0,
				paddingTop: isTop ? this.svgSize.height : 0,
				paddingBottom: isTop ? 0 : this.svgSize.height,
			};

			return View(
				{
					ref: (ref) => {
						if (ref)
						{
							this.ref = ref;
						}
					},
					onLayout: this.handleOnLayout,
					style,
				},
				content,
				this.#renderEar(),
			);
		}

		handleOnLayout = () => {
			const popupRect = this.ref.getAbsolutePosition();

			if (popupRect && !isEqual(popupRect, this.state.popupRect))
			{
				const duration = this.props.fadeInDuration ?? 10;

				const animate = chain(
					transition(this.earRef, {
						duration,
						opacity: 1,
					}),
					transition(this.ref, {
						duration,
						opacity: 1,
					}),
				);

				this.setState(
					{ popupRect },
					() => {
						animate();
					},
				);
			}
		};

		#renderEar()
		{
			return Image({
				ref: (ref) => {
					this.earRef = ref;
				},
				style: {
					position: 'absolute',
					opacity: 0,
					...this.svgSize,
					...this.getEarPosition(),
				},
				resizeMode: 'contain',
				tintColor: this.getBackgroundColor(),
				svg: {
					content: this.direction.getSvg(this.getBackgroundColor()),
				},
			});
		}

		#renderCloseButton()
		{
			if (!this.#hasCloseButton())
			{
				return null;
			}

			const { onClose } = this.props;

			return View(
				{
					style: {
						opacity: 0.3,
						position: 'absolute',
						right: Indent.S.toNumber(),
						top: Indent.S.toNumber(),
					},
				},
				IconView({
					testId: this.#getTestId('close'),
					icon: Icon.CROSS,
					color: Color.baseWhiteFixed,
					size: CLOSE_SIZE,
					onClick: onClose,
				}),
			);
		}

		#getTestId(suffix = '')
		{
			const { testId } = this.props;

			return [testId, suffix].filter(Boolean).join('-');
		}

		#getTitle()
		{
			const { title } = this.props;

			return title;
		}

		#getDescription()
		{
			const { description } = this.props;

			return description;
		}

		#hasCloseButton()
		{
			const { closeButton } = this.props;

			return Boolean(closeButton);
		}
	}

	module.exports = {
		/**
		 * @param {HintProps} props
		 * @returns {Hint}
		 */
		Hint: (props) => new Hint(props),
	};
});
