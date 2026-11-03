/**
 * @module ui-system/form/inputs/otp/src/value
 */
jn.define('ui-system/form/inputs/otp/src/value', (require, exports, module) => {
	// zero-width space keeps the active field non-empty: backspace on it is the only observable delete event
	const FILLER = '\u200B';
	const NON_DIGIT = /\D/g;

	class OtpValue
	{
		/**
		 * Keeps digits only and cuts off everything that does not fit into the code.
		 * @param {string|number} [raw]
		 * @param {number} length
		 * @return {string}
		 */
		static normalize(raw, length)
		{
			return String(raw ?? '').replace(NON_DIGIT, '').slice(0, length);
		}

		/**
		 * @param {string} code
		 * @param {number} length
		 * @return {number}
		 */
		static activeIndex(code, length)
		{
			return code.length >= length ? length - 1 : code.length;
		}

		/**
		 * @param {string} code
		 * @param {number} length
		 * @return {boolean}
		 */
		static isComplete(code, length)
		{
			return code.length === length;
		}

		/**
		 * Text the cell field shows: the active cell always holds the filler.
		 * @param {string} code
		 * @param {number} length
		 * @param {number} index
		 * @param {number} activeIndex active cell of the component, -1 when input is not allowed
		 * @return {string}
		 */
		static cellText(code, length, index, activeIndex)
		{
			if (index !== activeIndex)
			{
				return code.charAt(index);
			}

			return OtpValue.isComplete(code, length) ? FILLER + code.charAt(index) : FILLER;
		}

		/**
		 * Answer to a text change of the active cell field: the only way user input changes the code.
		 * @param {string} code
		 * @param {string} text
		 * @param {number} length
		 * @return {string}
		 */
		static applyCellText(code, text, length)
		{
			if (text === '')
			{
				// the filler is gone, so backspace erased the last digit
				return code.slice(0, -1);
			}

			const digits = text.replace(NON_DIGIT, '');
			// the field already held the digit of the active cell when the code is complete
			const held = OtpValue.isComplete(code, length) ? 1 : 0;

			if (held === 1 && digits.length === 0)
			{
				// only the filler is left, so backspace erased the digit of the active cell
				return code.slice(0, -1);
			}

			const inserted = digits.slice(held);

			if (inserted.length === 0)
			{
				return code;
			}

			// whatever came over the digit the field held is appended, however many digits it is: the text
			// of a cell carries no paste (its limit is the filler plus one digit), and laying more than one
			// digit out from the first cell would have replaced the whole code the user already has
			return OtpValue.normalize(code + inserted, length);
		}

		/**
		 * Answer to a text change of a cell that is not the active one: the cell holds the digit the
		 * component wrote there, so digits over that one are keystrokes that landed in a field the focus
		 * had not left yet.
		 * @param {string} code
		 * @param {string} text
		 * @param {number} length
		 * @param {number} index cell whose field reported the text
		 * @return {string}
		 */
		static applyInactiveCellText(code, text, length, index)
		{
			const digits = text.replace(NON_DIGIT, '');
			const held = code.charAt(index);
			// where the native puts a typed character inside the text is up to it, so the digit of the
			// cell is taken out of the text instead of being cut off its beginning
			const inserted = held === '' ? digits : digits.replace(held, '');

			if (inserted === '')
			{
				// nothing over what the cell was given: the text is the echo of it, an empty text
				// included - a cell the shortened value no longer reaches legitimately holds nothing
				return code;
			}

			return OtpValue.normalize(code + inserted, length);
		}
	}

	module.exports = { OtpValue };
});
