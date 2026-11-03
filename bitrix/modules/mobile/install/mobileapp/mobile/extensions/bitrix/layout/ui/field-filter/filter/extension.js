/**
 * @module layout/ui/field-filter/filter
 */
jn.define('layout/ui/field-filter/filter', (require, exports, module) => {
	const { FieldFilter } = require('layout/ui/field-filter/filter/src/component');
	const {
		loadFilterFields,
		loadFilterFieldItems,
		saveFilterFieldSet,
	} = require('layout/ui/field-filter/filter/src/fields/service');

	/**
	 * The filter itself: the drawer with its form, controls, field pickers, sorting and saved
	 * filters. A screen whose lifecycle does not fit `ListFilter` takes this component and drives
	 * it on its own.
	 *
	 * The dictionary of the list is loaded here as well - the fields and the values of a field are
	 * what the form is built from, so the requests for them belong to the extension that owns the
	 * form, not to its consumer.
	 *
	 * Bundle files stay private: a consumer reaching into `src/*` binds itself to the layout of the
	 * extension and trips `deps-external-bundle`, so everything a consumer legitimately needs is
	 * re-exported here.
	 */
	module.exports = {
		FieldFilter,
		loadFilterFields,
		loadFilterFieldItems,
		saveFilterFieldSet,
	};
});
