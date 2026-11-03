/**
 * @module layout/ui/field-filter/values/src/web-keys
 */
jn.define('layout/ui/field-filter/values/src/web-keys', (require, exports, module) => {
	/**
	 * Names the storage shared with the web filter goes by. Both are fixed by that storage and not by
	 * the mobile side, and both are needed before the drawer exists - a screen names them while it
	 * holds the stand-in of the filter alone - so they stand here together.
	 *
	 * The search string travels as a regular field: the serialized form is flat and knows no separate
	 * search slot (CONTRACT-DTO-01 invariant).
	 * @type {string}
	 */
	const SEARCH_FIELD_ID = 'FIND';

	/**
	 * The pseudo-preset the web filter keeps the form of the user in. It means "no preset selected",
	 * and `Options::getFilter()` answers an empty filter for it by definition, so a request naming it
	 * is a request under no preset at all.
	 * @type {string}
	 */
	const NO_PRESET_ID = 'default_filter';

	module.exports = { SEARCH_FIELD_ID, NO_PRESET_ID };
});
