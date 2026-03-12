/**
 * @module ui-system/form/buttons/floating-action-button
 */
jn.define('ui-system/form/buttons/floating-action-button', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { FloatingActionButtonType } = require('ui-system/form/buttons/floating-action-button/src/type-enum');
	const { Type } = require('type');
	const { PropTypes } = require('utils/validation');

	const DEFAULT_TEST_ID = 'floating-action-button';

	/**
	 * @class FloatingActionButton
	 * @param {string} testId
	 * @param {boolean} accentByDefault
	 * @param {boolean} showLoader
	 * @param {Icon} icon
	 * @param {FloatingActionButtonType} type
	 * @param {object} layout
	 * @param {Function} onClick
	 * @param {Function} onLongClick
	 *
	 * @see mobile/install/mobileapp/mobile/extensions/bitrix/testing/tests/floating-action-button/extension.js
	 */
	class FloatingActionButton
	{
		#options = {};

		constructor(props = {})
		{
			if (!props.layout)
			{
				throw new Error('FloatingActionButton: props.layout is required');
			}

			PropTypes.validate(FloatingActionButton.propTypes, props, 'FloatingActionButton');

			this.props = props;
			this.setOptions(props);

			this.#subscribeEventListeners();
		}

		get #layout()
		{
			return this.props.layout;
		}

		get #type()
		{
			return this.#options.type;
		}

		get #accentByDefault()
		{
			return this.#options.accentByDefault;
		}

		get #showLoader()
		{
			return this.#options.showLoader;
		}

		get #icon()
		{
			return this.#options.icon;
		}

		get #onClick()
		{
			return this.props.onClick ?? null;
		}

		get #onLongClick()
		{
			return this.props.onLongClick ?? null;
		}

		setOptions(props = {}, forceUpdate = false)
		{
			this.#options = {
				testId: props.testId || DEFAULT_TEST_ID,
				type: props.type ?? FloatingActionButtonType.COMMON,
				accentByDefault: props.accentByDefault ?? false,
				showLoader: props.showLoader ?? false,
				icon: props.icon ?? null,
				spotlightIds: props.spotlightIds ?? null,
			};

			if (forceUpdate)
			{
				this.update();
			}

			return this;
		}

		updateOption(key, value, forceUpdate = false)
		{
			this.#options[key] = value;

			if (forceUpdate)
			{
				this.update();
			}

			return this;
		}

		/**
		 * @public
		 * @param {boolean} accent
		 * @param {boolean} forceUpdate
		 * @return {FloatingActionButton}
		 */
		setAccentByDefault(accent = false, forceUpdate = false)
		{
			if (Type.isBoolean(accent) && this.#accentByDefault !== accent)
			{
				this.updateOption('accentByDefault', accent, forceUpdate);
			}

			return this;
		}

		/**
		 * @public
		 * @param {boolean} showLoader
		 * @param {boolean} forceUpdate
		 * @return {FloatingActionButton}
		 */
		setShowLoader(showLoader = false, forceUpdate = false)
		{
			if (Type.isBoolean(showLoader) && this.#showLoader !== showLoader)
			{
				this.updateOption('showLoader', showLoader, forceUpdate);
			}

			return this;
		}

		/**
		 * @public
		 * @param {Icon} newIcon
		 * @param {boolean} forceUpdate
		 * @return {FloatingActionButton}
		 */
		setIcon(newIcon, forceUpdate = false)
		{
			if (Icon.hasIcon(newIcon) && !newIcon.equal(this.#icon))
			{
				this.updateOption('icon', Icon.resolve(newIcon, Icon.PLUS), forceUpdate);
			}

			return this;
		}

		/**
		 * @public
		 * @param {FloatingActionButtonType} newType
		 * @param {boolean} forceUpdate
		 */
		setType(newType = FloatingActionButtonType.COMMON, forceUpdate = false)
		{
			if (FloatingActionButtonType.has(newType) && !newType.equal(this.#type))
			{
				this.updateOption('type', newType, forceUpdate);
			}

			return this;
		}

		#subscribeEventListeners()
		{
			this.#layout.removeAllListeners('floatingButtonTap');
			this.#layout.removeAllListeners('floatingButtonLongTap');

			if (this.#onClick)
			{
				this.#layout.on('floatingButtonTap', this.#onClick);
			}

			if (this.#onLongClick)
			{
				this.#layout.on('floatingButtonLongTap', this.#onLongClick);
			}
		}

		#getNativeProps()
		{
			return {
				...this.#options,
				icon: this.#icon?.getIconName(),
				type: this.#type?.getValue(),
			};
		}

		/**
		 * @public
		 */
		show()
		{
			this.#layout.setFloatingButton(this.#getNativeProps());
		}

		/**
		 * @public
		 */
		update()
		{
			this.#layout.setFloatingButton(this.#getNativeProps());
		}

		/**
		 * @public
		 */
		hide()
		{
			this.#layout.setFloatingButton({});
		}
	}

	FloatingActionButton.propTypes = {
		testId: PropTypes.string.isRequired,
		layout: PropTypes.object.isRequired,
		accentByDefault: PropTypes.bool,
		showLoader: PropTypes.bool,
		icon: PropTypes.instanceOf(Icon),
		type: PropTypes.instanceOf(FloatingActionButtonType),
		onClick: PropTypes.func,
		onLongClick: PropTypes.func,
		spotlightIds: PropTypes.object,
	};

	module.exports = {
		FloatingActionButton,
		FloatingActionButtonType,
	};
});
