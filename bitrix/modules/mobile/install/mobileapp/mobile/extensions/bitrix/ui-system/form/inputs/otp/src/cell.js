/**
 * @module ui-system/form/inputs/otp/src/cell
 */
jn.define('ui-system/form/inputs/otp/src/cell', (require, exports, module) => {
	const { Color, Component, Indent } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { TextField } = require('ui-system/typography/text-field');

	const CELL_SIZE = 46;
	const CELL_BORDER_WIDTH = 1.5;

	// the field keeps its own height and the row centers it, the way the base Input centers its field:
	// a field stretched to the whole cell has nothing left to center, and Android drew the digit at
	// the top of it
	const FIELD_STYLE = {
		flex: 1,
		textAlign: 'center',
	};

	/**
	 * @extends {PureComponent<OtpCellProps>}
	 */
	class OtpCell extends PureComponent
	{
		render()
		{
			const { testId, text, editable, maxLength, forwardRef, onChangeText, onFocus, onBlur } = this.props;

			return View(
				{
					style: this.#getCellStyle(),
				},
				TextField({
					testId,
					ref: forwardRef,
					// size 3 with header renders H3 typography
					size: 3,
					header: true,
					color: Color.base1,
					value: text,
					forcedValue: text,
					// every cell of an editable input stays enabled: turning off the field that holds
					// the focus makes the native drop the keyboard while the active cell moves along
					enable: editable,
					maxLength,
					keyboardType: 'number-pad',
					style: FIELD_STYLE,
					onChangeText,
					onFocus,
					onBlur,
				}),
			);
		}

		#getCellStyle()
		{
			const { index } = this.props;

			return {
				width: CELL_SIZE,
				height: CELL_SIZE,
				flexDirection: 'row',
				alignItems: 'center',
				backgroundColor: this.#getBackgroundColor().toHex(),
				borderWidth: CELL_BORDER_WIDTH,
				borderColor: this.#getBorderColor().toHex(),
				borderRadius: Component.inputLCorner.toNumber(),
				marginLeft: index === 0 ? 0 : Indent.M.toNumber(),
			};
		}

		#getBorderColor()
		{
			const { focused, error } = this.props;

			if (error)
			{
				return Color.accentMainAlert;
			}

			return focused ? Color.accentMainPrimary : Color.base5;
		}

		#getBackgroundColor()
		{
			const { disabled } = this.props;

			return disabled ? Color.base7 : Color.bgContentPrimary;
		}
	}

	module.exports = {
		/**
		 * @param {OtpCellProps} props
		 * @return {OtpCell}
		 */
		OtpCell: (props) => new OtpCell(props),
	};
});
