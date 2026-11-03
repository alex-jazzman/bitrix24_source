/**
 * @module layout/ui/field-filter/filter/src/enums/saved-filter-error
 */
jn.define('layout/ui/field-filter/filter/src/enums/saved-filter-error', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseEnum } = require('utils/enums/base');

	/** What a code nobody documented is shown as: an error the user can still read. */
	const COMMON_PHRASE = 'M_FIELD_FILTER_SAVED_ERROR_COMMON';

	/**
	 * Error codes of the saved filter actions (CONTRACT-API-02), each with the wording the user sees:
	 * a code and its phrase are one answer, and a map standing next to the enum is that answer split
	 * in two places.
	 *
	 * @extends {BaseEnum<SavedFilterError>}
	 */
	class SavedFilterError extends BaseEnum
	{
		static UNSUPPORTED_LIST_TYPE = new SavedFilterError(
			'UNSUPPORTED_LIST_TYPE',
			'UNSUPPORTED_LIST_TYPE',
			'M_FIELD_FILTER_SAVED_ERROR_LIST_TYPE',
		);

		static ACCESS_DENIED = new SavedFilterError(
			'ACCESS_DENIED',
			'ACCESS_DENIED',
			'M_FIELD_FILTER_SAVED_ERROR_ACCESS_DENIED',
		);

		static INVALID_PRESET_ID = new SavedFilterError(
			'INVALID_PRESET_ID',
			'INVALID_PRESET_ID',
			'M_FIELD_FILTER_SAVED_ERROR_PRESET_ID',
		);

		static INVALID_FILTER_DATA = new SavedFilterError(
			'INVALID_FILTER_DATA',
			'INVALID_FILTER_DATA',
			'M_FIELD_FILTER_SAVED_ERROR_FILTER_DATA',
		);

		static PRESET_NOT_FOUND = new SavedFilterError(
			'PRESET_NOT_FOUND',
			'PRESET_NOT_FOUND',
			'M_FIELD_FILTER_SAVED_ERROR_NOT_FOUND',
		);

		/**
		 * @param {string} name
		 * @param {string} value the code as the server sends it
		 * @param {string} phraseId
		 */
		constructor(name, value, phraseId)
		{
			super(name, value);

			this.phraseId = phraseId;
		}

		/**
		 * @return {string}
		 */
		getMessage()
		{
			return Loc.getMessage(this.phraseId);
		}

		/**
		 * What the user is shown for a code of the server. A code this enum does not know still has to
		 * be shown, so an unknown one falls back to the common wording rather than to an empty string -
		 * and so does a failure that carries no code at all.
		 *
		 * @param {?string} code
		 * @return {string}
		 */
		static getMessageByCode(code)
		{
			const error = SavedFilterError.getEnums().find((entry) => entry.getValue() === code);

			return error === undefined ? Loc.getMessage(COMMON_PHRASE) : error.getMessage();
		}
	}

	module.exports = {
		SavedFilterError: SavedFilterError.export(),
	};
});
