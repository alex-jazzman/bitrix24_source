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
	const MAX_PROGRESS_DOTS = 10;

	/**
	 * Contract of the hint body, built by AhaMoment. Internal to the extension: consumers
	 * configure it through the props of AhaMoment.show(), which carry the same names.
	 *
	 * Nothing is strictly required, but a hint without title and description renders empty,
	 * and targetParams is what the ear offset is computed from — without it the offset is NaN.
	 *
	 * @typedef {object} HintProps
	 * @property {string} [testId]
	 * @property {object} [targetParams] measured target: {position, x, y, width, height};
	 *   position picks the direction, the rest centers the ear on the target
	 * @property {string} [title]
	 * @property {string} [description]
	 * @property {object} [image]
	 * @property {boolean} [shouldShowImageBackgroundColor=true] applies only with image
	 * @property {number} [fadeInDuration=10] entrance fade of the popup and the ear
	 * @property {string} [buttonText] renders the action button; the three props below apply only with it
	 * @property {Icon} [buttonIcon]
	 * @property {boolean} [buttonStretched=true]
	 * @property {Function} [onClick]
	 * @property {boolean} [closeButton] renders the close button, which is what calls onClose
	 * @property {Function} [onClose]
	 *
	 * The button props above are a closed set. Design, size and color stay owned by the
	 * design system, and onClick stays owned by AhaMoment, so they are not exposed one by
	 * one: a fourth button prop is the point to replace all of them with a single
	 * buttonProps merged over the defaults, not to extend the list.
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
			const centeredLeft = Math.round(targetX - popupX + targetWidth / 2 - this.svgSize.width / 2);
			const position = this.direction.getPosition();

			return {
				left: this.#clampEarLeft(centeredLeft),
				[position]: 1,
			};
		}

		/**
		 * The ear has to stand on the straight part of the popup edge: beyond the corner radius its
		 * base lies on the rounding. Only a target close to the screen edge, where the popup itself
		 * cannot move any further, gets clamped — for the rest the centered position already fits.
		 */
		#clampEarLeft(left)
		{
			const minLeft = Component.popupCorner.toNumber();
			const maxLeft = FIXED_WIDTH - minLeft - this.svgSize.width;

			return Math.min(Math.max(left, minLeft), maxLeft);
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
				this.#renderProgress(),
			);
		}

		#renderProgress()
		{
			const { progress } = this.props;

			if (!progress || progress.total <= 1)
			{
				return null;
			}

			const { current, total } = progress;

			if (total > MAX_PROGRESS_DOTS)
			{
				return View(
					{
						style: {
							alignSelf: 'center',
							marginTop: Indent.XS.toNumber(),
						},
					},
					Text4({
						testId: this.#getTestId('progress'),
						text: `${current}/${total}`,
						color: Color.baseWhiteFixed,
					}),
				);
			}

			const DOT_SIZE = 8;
			const DOT_SPACING = 4;

			const dots = [];
			for (let i = 1; i <= total; i++)
			{
				const isActive = i === current;
				dots.push(
					View({
						style: {
							width: DOT_SIZE,
							height: DOT_SIZE,
							borderRadius: DOT_SIZE / 2,
							backgroundColor: isActive
								? Color.baseWhiteFixed.toHex()
								: Color.baseWhiteFixed.toHex(0.3),
							marginRight: i < total ? DOT_SPACING : 0,
						},
					}),
				);
			}

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						alignSelf: 'center',
						marginTop: Indent.XS.toNumber(),
					},
				},
				...dots,
			);
		}

		#renderButtons()
		{
			if (!this.shouldShowActionButton())
			{
				return null;
			}

			const { buttonText, buttonIcon = null, buttonStretched = true, onClick } = this.props;

			const buttonProps = {
				testId: this.#getTestId('action-button'),
				text: buttonText,
				stretched: buttonStretched,
				size: ButtonSize.S,
				design: ButtonDesign.OUTLINE,
				color: Color.baseWhiteFixed,
				borderColor: Color.baseWhiteFixed,
				onClick,
				style: {
					marginVertical: Indent.XS.toNumber(),
				},
			};

			if (buttonIcon)
			{
				buttonProps.leftIcon = buttonIcon;
				buttonProps.leftIconColor = Color.baseWhiteFixed;
			}

			return Button(buttonProps);
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
