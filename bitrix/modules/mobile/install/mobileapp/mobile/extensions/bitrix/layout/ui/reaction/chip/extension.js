/**
 * @module layout/ui/reaction/chip
 */
jn.define('layout/ui/reaction/chip', (require, exports, module) => {
	const { Avatar } = require('ui-system/blocks/avatar');
	const { ChipButtonSize, ChipButtonDesign, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { DEFAULT_REACTION } = require('layout/ui/reaction/const');
	const { Ellipsize } = require('utils/enums/style');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Indent, Component } = require('tokens');
	const { Loc } = require('loc');
	const { PropTypes } = require('utils/validation');
	const { ReactionIcon } = require('ui-system/blocks/reaction/icon');
	const store = require('statemanager/redux/store');
	const { selectReactionMessageById } = require('statemanager/redux/slices/settings/selector');

	/**
	 * @typedef {Object} ChipReactionProps
	 * @property {String} testId
	 * @property {String} reactionId
	 * @property {Boolean} [isCompact]
	 * @property {Boolean} [isSelected=false]
	 * @property {Ellipsize} [ellipsize=Ellipsize.END]
	 * @property {Function} [forwardRef]
	 * @property {Number} [userId]
	 * @property {ChipButtonDesign} [design]
	 * @property {ChipButtonMode} [mode]
	 * @property {Function} [onClick]
	 * @property {Function} [onLongClick]
	 * @class ChipReaction
	 */
	class ChipReaction extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.#initStyle(props);

			this.animate = false;
		}

		componentDidMount()
		{
			this.animate = true;
		}

		componentWillReceiveProps(props)
		{
			this.#initStyle(props);
		}

		get #testId()
		{
			const { testId } = this.props;

			return testId;
		}

		get #reactionId()
		{
			const { reactionId } = this.props;

			return reactionId;
		}

		get #userId()
		{
			const { userId } = this.props;

			return userId;
		}

		get #isSelected()
		{
			const { isSelected } = this.props;

			return isSelected;
		}

		get #forwardRef()
		{
			const { forwardRef } = this.props;

			return forwardRef;
		}

		get #containerTestId()
		{
			return this.#isSelected ? `${this.#testId}-selected` : `${this.#testId}-default`;
		}

		#initStyle(props)
		{
			const { isCompact } = props;

			this.size = isCompact ? ChipButtonSize.S : ChipButtonSize.M;
		}

		#getTypography()
		{
			return this.size.getTypography();
		}

		#getDesign()
		{
			const { design, mode } = this.props;

			if (design === null)
			{
				return {};
			}

			const finalDesign = this.#isSelected
				? ChipButtonDesign.resolve(design, ChipButtonDesign.PRIMARY)
				: ChipButtonDesign.resolve(design, ChipButtonDesign.GREY);

			return finalDesign.getStyle(mode);
		}

		#getColor()
		{
			const design = this.#getDesign();

			return design?.color;
		}

		#getMessage(reactionId)
		{
			return selectReactionMessageById(store.getState(), reactionId);
		}

		#handleOnClick = () => {
			const { onClick } = this.props;

			if (onClick)
			{
				onClick();
			}
		};

		#getEllipsize()
		{
			const { ellipsize } = this.props;

			return Ellipsize.resolve(ellipsize, Ellipsize.END).toString();
		}

		#handleOnLongClick = () => {
			const { onLongClick } = this.props;

			if (onLongClick)
			{
				onLongClick();
			}
		};

		render()
		{
			return View(
				{
					testId: this.#containerTestId,
					style: this.#getBodyStyle(),
					onClick: this.#handleOnClick,
					onLongClick: this.#handleOnLongClick,
					ref: this.#forwardRef,
				},
				...this.#renderContentBasedOnSelection(),
			);
		}

		#renderContentBasedOnSelection()
		{
			if (this.#isSelected)
			{
				return [
					this.#renderLottieAnimation(),
					this.#renderAvatar(),
				];
			}

			return [
				this.#renderIcon(),
				this.#renderText(),
			];
		}

		#getBodyStyle()
		{
			const { backgroundColor, ...chipStyle } = this.#getDesign();

			return {
				flexShrink: 1,
				flexDirection: 'row',
				alignItems: 'center',
				height: this.size.getHeight(),
				borderRadius: Component.elementAccentCorner.toNumber(),
				paddingRight: Indent.S.toNumber(),
				paddingVertical: Indent.XS2.toNumber(),
				...chipStyle,
				backgroundColor: backgroundColor ? backgroundColor?.value : null,
			};
		}

		#renderLottieAnimation()
		{
			return LottieView(
				{
					testId: `${this.#testId}-animation-${this.#reactionId}`,
					style: {
						height: 28,
						width: 28,
					},
					data: {
						uri: ReactionIcon.getLottieAnimationById(this.#reactionId),
					},
					params: {
						loopMode: 'playOnce',
					},
					autoPlay: this.animate,
				},
			);
		}

		#renderIcon()
		{
			return IconView({
				color: this.#getColor(),
				icon: Icon.LIKE,
				size: 20,
				testId: `${this.#testId}-icon`,
				style: {
					marginLeft: Indent.S.toNumber(),
				},
			});
		}

		#renderText()
		{
			const reactionId = this.#reactionId;
			const text = Loc.getMessage(`M_RATING_LIKE_EMOTION_${reactionId.toUpperCase()}`);

			const Typography = this.#getTypography();

			return Typography({
				text: this.#getMessage(reactionId) ?? text,
				testId: `${this.#testId}-text`,
				color: this.#getColor(),
				ellipsize: this.#getEllipsize(),
				numberOfLines: 1,
				style: {
					flexShrink: 1,
					marginRight: Indent.XS.toNumber(),
					maxWidth: 130,
				},
			});
		}

		#renderAvatar()
		{
			return Avatar({
				id: this.#userId,
				testId: `${this.#testId}-user-avatar`,
				withRedux: true,
				size: 20,
			});
		}
	}

	ChipReaction.defaultProps = {
		testId: '',
		reactionId: DEFAULT_REACTION,
		isCompact: false,
		isSelected: false,
		ellipsize: Ellipsize.END,
		forwardRef: null,
		userId: null,
	};

	ChipReaction.propTypes = {
		testId: PropTypes.string.isRequired,
		reactionId: PropTypes.string.isRequired,
		isCompact: PropTypes.bool,
		isSelected: PropTypes.bool,
		ellipsize: PropTypes.oneOf(Object.values(Ellipsize)),
		forwardRef: PropTypes.func,
		userId: PropTypes.number,
		design: PropTypes.oneOf(Object.values(ChipButtonDesign)),
		mode: PropTypes.oneOf(Object.values(ChipButtonMode)),
		onClick: PropTypes.func,
		onLongClick: PropTypes.func,
	};

	module.exports = {
		/**
		 * @param {ChipReactionProps} props
		 * @returns {ChipReaction}
		 */
		ChipReaction: (props) => new ChipReaction(props),
	};
});
