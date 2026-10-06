/**
 * @module im/messenger/lib/ui/search/input
 */
jn.define('im/messenger/lib/ui/search/input', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Theme } = require('im/lib/theme');
	const { transparent } = require('utils/color');
	const { Loc } = require('im/messenger/loc');

	class SearchInput extends LayoutComponent
	{
		/**
		 *
		 * @param {Object} props
		 * @param {Function} props.onChangeText
		 * @param {Function} props.onSearchShow
		 * @param {Function} [props.onSearchHide] blur hook (optional)
		 * @param {string} [props.placeholder]
		 * @param {number} [props.borderRadius] field corner radius (defaults to 8)
		 * @param {Function} [props.ref]
		 */
		constructor(props = {})
		{
			super(props);
			this.value = '';
			this.state.isTextEmpty = true;

			if (props.ref)
			{
				props.ref(this);
			}
		}

		render()
		{
			return View(
				{
					style: {
						backgroundColor: transparent(Theme.colors.base5, 0.25),
						flexDirection: 'row',
						padding: 8,
						borderRadius: this.props.borderRadius ?? 8,
						alignItems: 'center',
						justifyContent: 'space-between',
						flexGrow: 1,
					},
				},
				View(
					{},
					Image({
						style: {
							height: 21,
							width: 21,
						},
						tintColor: Theme.colors.base4,
						resizeMode: 'contain',
						named: Icon.SEARCH.getIconName(),
					}),
				),
				View(
					{
						style: {
							flexGrow: 2,
							paddingLeft: 5,
							paddingRight: 5,
						},
					},
					TextInput({
						testId: 'search_field',
						placeholder: this.props.placeholder ?? Loc.getMessage('IMMOBILE_MESSENGER_UI_SEARCH_INPUT_PLACEHOLDER_TEXT'),
						placeholderTextColor: Theme.colors.base4,
						multiline: false,
						style: {
							color: Theme.colors.base1,
							fontSize: 18,
							backgroundColor: '#00000000',
						},
						onChangeText: (text) => {
							if (text !== '' && this.state.isTextEmpty)
							{
								this.setState({ isTextEmpty: false });
							}

							if (text === '' && !this.state.isTextEmpty)
							{
								this.setState({ isTextEmpty: true });
							}

							clearTimeout(this.timeout);
							this.timeout = setTimeout(() => {
								this.props.onChangeText(text);
							}, 200);
						},
						onSubmitEditing: () => this.dismissKeyboard(),
						onFocus: () => this.props.onSearchShow(),
						onBlur: () => this.props.onSearchHide?.(),
						ref: (ref) => this.textRef = ref,
					}),
				),
				View(
					{
						testId: 'search_field_clear',
						clickable: true,
						onClick: () => this.clearText(),
					},
					Image({
						style: {
							height: 26,
							width: 26,
							opacity: this.state.isTextEmpty ? 0 : 1,
						},
						resizeMode: 'contain',
						tintColor: Theme.colors.base4,
						named: Icon.CROSS.getIconName(),
					}),
				),

			);
		}

		/**
		 * @desc Clearing the field via the cross is an explicit exit from search. The native
		 * TextInput.clear() does not emit onChangeText, so we explicitly notify the
		 * consumer with an empty query exactly once (first cancelling the
		 * pending debounce call so a stale non-empty text does not arrive),
		 * sync isTextEmpty, hide the keyboard via native Keyboard.dismiss()
		 * (on Android a bare blur does not hide it) and via an explicit onSearchHide notify the
		 * consumer about exiting search - it expands the header.
		 */
		clearText()
		{
			clearTimeout(this.timeout);

			this.textRef?.clear();
			this.textRef?.blur();
			Keyboard.dismiss();

			if (!this.state.isTextEmpty)
			{
				this.setState({ isTextEmpty: true });
			}

			this.props.onChangeText('');
			this.props.onSearchHide?.();
		}

		/**
		 * @public
		 * @desc Hides the keyboard and removes focus from the field. We remove the keyboard
		 * via native Keyboard.dismiss() - on Android blur({ hideKeyboard: true }) in
		 * a scroll context does not hide it. Blur emits onBlur -> the consumer decides itself
		 * whether to expand the header (with a non-empty query it keeps it collapsed).
		 */
		dismissKeyboard()
		{
			this.textRef?.blur();
			Keyboard.dismiss();
		}
	}

	module.exports = { SearchInput };
});
