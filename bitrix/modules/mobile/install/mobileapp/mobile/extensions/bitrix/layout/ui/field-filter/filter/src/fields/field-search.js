/**
 * @module layout/ui/field-filter/filter/src/fields/field-search
 */
jn.define('layout/ui/field-filter/filter/src/fields/field-search', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * Fields the query names, in the order of the dictionary. Only the names are searched - the codes
	 * of the wire (`STAGE_ID`) are no words the user reads on the form, and a query matching one would
	 * offer a field nobody was looking for.
	 *
	 * @param {FieldDescriptor[]} descriptors
	 * @param {string} query
	 * @return {FieldDescriptor[]}
	 */
	const matchFields = (descriptors, query) => {
		const fields = Type.isArray(descriptors) ? descriptors : [];
		const needle = Type.isString(query) ? query.trim().toLowerCase() : '';

		if (needle === '')
		{
			return fields;
		}

		return fields.filter((descriptor) => (
			Type.isStringFilled(descriptor.name) && descriptor.name.toLowerCase().includes(needle)
		));
	};

	module.exports = { matchFields };
});
