/**
 * @module ui-system/form/buttons/floating-action-button
 */
jn.define('ui-system/form/buttons/floating-action-button', (require, exports, module) => {
	const { Component } = require('tokens');
	const { Feature } = require('feature');
	const { PropTypes } = require('utils/validation');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { FloatingActionButtonMode } = require('ui-system/form/buttons/floating-action-button/src/mode-enum');

	const BUTTON_SIZE = 58;

	/**
	 * @class FloatingActionButton
	 * @param {string} testId
	 * @param {boolean} accent
	 * @param {object} parentLayout
	 * @param {Function} onClick
	 * @param {Function} onLongClick
	 */
	class FloatingActionButton extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.#initNativeButton();
		}

		static supportNative(layout)
		{
			return typeof layout?.setFloatingButton === 'function' && Feature.isAirStyleSupported();
		}

		/**
		 * @returns {FloatingActionButtonMode}
		 */
		getMode()
		{
			return this.isAccentButton()
				? FloatingActionButtonMode.ACCENT
				: FloatingActionButtonMode.BASE;
		}

		/**
		 * @returns {Object}
		 */
		getButtonColor()
		{
			return this.getMode().getButtonColor();
		}

		getIconColor()
		{
			return this.getMode().getIconColor();
		}

		getLayout()
		{
			const { parentLayout } = this.props;

			return parentLayout;
		}

		isAccentButton()
		{
			const { accent } = this.props;

			return Boolean(accent);
		}

		shouldSafeArea()
		{
			const { safeArea } = this.props;

			return Boolean(safeArea);
		}

		render()
		{
			if (FloatingActionButton.supportNative(this.getLayout()))
			{
				return null;
			}

			const { testId } = this.props;

			return View(
				{
					ref: (ref) => {
						this.ref = ref;
					},
					testId,
					style: {
						width: BUTTON_SIZE,
						height: BUTTON_SIZE,
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: this.getButtonColor(),
						borderRadius: Component.popupCorner.toNumber(),
					},
					onClick: this.#handleOnClick,
					onLongClick: this.#handleOnLongClick,
				},
				IconView({
					size: 32,
					icon: Icon.PLUS,
					color: this.getIconColor(),
				}),
			);
		}

		#handleOnClick = () => {
			const { onClick } = this.props;

			if (onClick)
			{
				onClick();
			}
		};

		#handleOnLongClick = () => {
			const { onLongClick } = this.props;

			if (onLongClick)
			{
				onLongClick();
			}
		};

		#initNativeButton()
		{
			if (!FloatingActionButton.supportNative(this.getLayout()))
			{
				return;
			}

			this.setFloatingButton({
				safeArea: this.shouldSafeArea(),
				accent: this.isAccentButton(),
			});

			this.#initListeners();
		}

		#initListeners()
		{
			this.getLayout().removeAllListeners('floatingButtonTap');
			this.getLayout().removeAllListeners('floatingButtonLongTap');

			this.getLayout().on('floatingButtonTap', this.#handleOnClick);
			this.getLayout().on('floatingButtonLongTap', this.#handleOnLongClick);
		}

		/**
		 * @param {Object} params
		 * @param {boolean} params.accent
		 * @param {boolean} params.hide
		 */
		setFloatingButton(params = {})
		{
			const { testId } = this.props;
			const { accent = false, hide = false } = params;
			const floatingActionButtonParams = hide
				? {}
				: {
					testId,
					accentByDefault: accent,
					callback: () => {},
				};

			this.getLayout().setFloatingButton(floatingActionButtonParams);
		}
	}

	FloatingActionButton.defaultProps = {
		accent: false,
		safeArea: false,
	};

	FloatingActionButton.propTypes = {
		safeArea: PropTypes.bool,
		testId: PropTypes.string.isRequired,
		accent: PropTypes.bool,
		onLongClick: PropTypes.func,
		onClick: PropTypes.func,
		parentLayout: PropTypes.object,
	};

	module.exports = {
		FloatingActionButton: (props) => new FloatingActionButton(props),
		FloatingActionButtonSupportNative: FloatingActionButton.supportNative,
	};
});
