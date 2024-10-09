/**
 * @module ui-system/layout/dialog-footer
 */
jn.define('ui-system/layout/dialog-footer', (require, exports, module) => {
	const { isEmpty } = require('utils/object');
	const { Color, Component, Indent } = require('tokens');
	const { Button, ButtonSize, ButtonClass } = require('ui-system/form/buttons/button');

	const IS_IOS = Application.getPlatform() === 'ios';
	const SAFE_AREA_HEIGHT = 34;

	/**
	 * @typedef {Object} DialogFooterProps
	 * @property {boolean} safeArea
	 * @property {Function} onLayoutFooterHeight
	 * @property {ButtonProps} keyboardButton
	 * @property {Color} backgroundColor
	 * @property {Object} children
	 *
	 * @class DialogFooter
	 */
	class DialogFooter extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.buttonRef = null;

			this.#initialKeyboardHandlers();

			this.state = {
				footerHeight: 0,
				focusButtonHeight: 0,
				isShowKeyboard: false,
			};
		}

		#initialKeyboardHandlers()
		{
			Keyboard.on(Keyboard.Event.WillHide, () => {
				this.updateFooter(false);
			});

			Keyboard.on(Keyboard.Event.WillShow, () => {
				this.updateFooter(true);
			});
		}

		render()
		{
			const { isShowKeyboard } = this.state;
			const { safeArea = true } = this.props;
			const footer = isShowKeyboard
				? this.renderKeyboardButton()
				: this.renderFooterButton();

			return View(
				{
					safeArea: {
						bottom: IS_IOS && safeArea,
					},
					style: {
						position: 'absolute',
						bottom: 0,
						paddingHorizontal: !isShowKeyboard && footer ? Component.paddingLrMore.toNumber() : 0,
						backgroundColor: this.#getBackgroundColor(),
						paddingBottom: this.#getPaddingBottom(),
					},
				},
				footer,
			);
		}

		renderKeyboardButton()
		{
			const { keyboardButton } = this.props;

			if (isEmpty(keyboardButton))
			{
				return null;
			}

			return Button({
				forwardRef: (ref) => {
					this.buttonRef = ref;
				},
				testId: 'OPEN_BUTTON_SHEET',
				size: ButtonSize.XL,
				stretched: true,
				borderRadius: 0,
				...keyboardButton,
			});
		}

		renderFooterButton()
		{
			const { children } = this.props;

			if (!Array.isArray(children) || isEmpty(children))
			{
				return null;
			}

			return View(
				{
					style: {
						marginVertical: this.#getPaddingVertical(),
					},
					onLayout: this.#handleOnLayoutFooterHeight,
				},
				...children,
			);
		}

		updateFooter(isShowKeyboard)
		{
			if (isShowKeyboard)
			{
				this.#handleOnLayoutFocusButtonHeight({ isShowKeyboard });
			}
			else
			{
				this.#handleOnLayoutFooterHeight({ isShowKeyboard });
			}
		}

		/**
		 * @returns {number}
		 */
		#getPaddingBottom()
		{
			const { isShowKeyboard } = this.state;
			const { safeArea = true } = this.props;

			if (isShowKeyboard || IS_IOS || !safeArea || !device.isGestureNavigation)
			{
				return 0;
			}

			return SAFE_AREA_HEIGHT;
		}

		#handleOnLayoutFocusButtonHeight = ({ isShowKeyboard }) => {
			const { onLayoutFooterHeight } = this.props;
			const focusButtonHeight = 48;

			this.setState({ focusButtonHeight, isShowKeyboard });

			onLayoutFooterHeight({
				height: focusButtonHeight,
			});
		};

		#handleOnLayoutFooterHeight = ({ height, width, isShowKeyboard }) => {
			const { footerHeight: stateFooterHeight } = this.state;
			const { onLayoutFooterHeight } = this.props;
			const footerHeight = height > 0 ? this.#getFooterHeight(height) : stateFooterHeight;

			this.setState({
				footerHeight,
				isShowKeyboard,
			});

			onLayoutFooterHeight({
				height: footerHeight,
				width,
			});
		};

		#getFooterHeight(height)
		{
			return height + (this.#getPaddingVertical() * 2) + this.#getPaddingBottom();
		}

		#getPaddingVertical()
		{
			return Indent.XL.toNumber();
		}

		#getBackgroundColor()
		{
			const { backgroundColor } = this.props;

			return Color.resolve(backgroundColor, Color.bgPrimary).toHex();
		}
	}

	DialogFooter.defaultProps = {
		safeArea: true,
	};

	DialogFooter.propTypes = {
		safeArea: PropTypes.bool,
		keyboardButton: PropTypes.shape(ButtonClass.propTypes),
		onLayoutFooterHeight: PropTypes.func,
		backgroundColor: PropTypes.instanceOf(Color),
		children: PropTypes.arrayOf(PropTypes.object),
	};

	module.exports = {
		/**
		 * @param {DialogFooterProps} props
		 * @param {View} children
		 * @returns {DialogFooter}
		 */
		DialogFooter: (props, ...children) => new DialogFooter({ ...props, children }),
		/**
		 * @param {DialogFooterProps} props
		 * @param {View} children
		 * @returns {function(*): DialogFooter}
		 */
		BoxFooter: (props, ...children) => (boxProps) => new DialogFooter({ ...props, ...boxProps, children }),
	};
});
