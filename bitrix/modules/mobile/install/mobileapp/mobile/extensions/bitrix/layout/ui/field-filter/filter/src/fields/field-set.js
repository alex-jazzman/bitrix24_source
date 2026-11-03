/**
 * @module layout/ui/field-filter/filter/src/fields/field-set
 */
jn.define('layout/ui/field-filter/filter/src/fields/field-set', (require, exports, module) => {
	const { Type } = require('type');
	const { isFieldActive } = require('layout/ui/field-filter/values');

	/**
	 * The one group of a list the server does not group. Its id is no section id of any server, so it
	 * cannot collide with one.
	 * @type {string}
	 */
	const FLAT_GROUP_ID = '';

	const toDescriptors = (descriptors) => (Type.isArray(descriptors) ? descriptors : []);
	const toIds = (ids) => (Type.isArray(ids) ? ids.filter((id) => Type.isStringFilled(id)) : []);
	const toValues = (values) => (Type.isPlainObject(values) ? values : {});

	/**
	 * Fields the provider puts on a filter that names no preset - the set the web shows for its own
	 * "no preset" state.
	 *
	 * @param {FieldDescriptor[]} descriptors
	 * @return {string[]} in the order of the dictionary
	 */
	const getDefaultFieldIds = (descriptors) => toDescriptors(descriptors)
		.filter((descriptor) => descriptor.default === true)
		.map((descriptor) => descriptor.id);

	/**
	 * The fields the form is composed of: the rows of the current filter, in the order the user put
	 * them in, or the fields of the provider while the filter names none. A row naming no field of the
	 * dictionary is dropped - `FIND` travels among the rows of the web filter and has no row to draw.
	 *
	 * @param {FieldDescriptor[]} descriptors
	 * @param {string[]} rows
	 * @return {string[]}
	 */
	const getFieldSetIds = (descriptors, rows) => {
		const known = new Set(toDescriptors(descriptors).map((descriptor) => descriptor.id));
		const named = toIds(rows).filter((row) => known.has(row));

		return named.length > 0 ? named : getDefaultFieldIds(descriptors);
	};

	/**
	 * What the form draws: the whole set, filled in or not, and after it the fields carrying a value
	 * the set does not name. Such a field is shown so that an active condition is never hidden - the
	 * server keeps values of fields the current filter has taken off the form.
	 *
	 * @param {FieldDescriptor[]} descriptors
	 * @param {string[]} rows
	 * @param {FilterValues} values
	 * @return {FieldDescriptor[]}
	 */
	const getVisibleFields = (descriptors, rows, values) => {
		const setIds = getFieldSetIds(descriptors, rows);
		const inSet = new Set(setIds);
		const byId = new Map(toDescriptors(descriptors).map((descriptor) => [descriptor.id, descriptor]));

		const filledOutside = toDescriptors(descriptors).filter((descriptor) => (
			!inSet.has(descriptor.id) && isFieldActive(descriptor, toValues(values)[descriptor.id])
		));

		return [...setIds.map((id) => byId.get(id)), ...filledOutside];
	};

	/**
	 * Ids of the fields the form draws, in its own order - the set of the filter and the fields
	 * carrying a value outside it.
	 *
	 * This and not the set alone is what the screen the set is composed on opens chosen: a field the
	 * form shows would otherwise arrive there unchosen, and the next apply would take it off
	 * the form together with its value. The lists where the two answers differ are the usual ones -
	 * the task dashboard marks `ROLEID` default and nothing else, so a status filled in by the
	 * current filter is on the form and is named by no row.
	 *
	 * @param {FieldDescriptor[]} descriptors
	 * @param {string[]} rows
	 * @param {FilterValues} values
	 * @return {string[]}
	 */
	const getVisibleFieldIds = (descriptors, rows, values) => getVisibleFields(descriptors, rows, values)
		.map((descriptor) => descriptor.id);

	/**
	 * Whether the set is the one the reset gives back: the answer the "back to the default fields"
	 * action is offered by. The order of the rows is not part of it - the same fields arranged
	 * differently are still that set, and there is nothing to give back.
	 *
	 * `defaultRows` names the set a filter of its own asks for - the rows of the selected preset -
	 * and an empty one leaves the question to the fields the provider marks `default`.
	 *
	 * @param {FieldDescriptor[]} descriptors
	 * @param {string[]} rows
	 * @param {string[]} [defaultRows]
	 * @return {boolean}
	 */
	const isDefaultFieldSet = (descriptors, rows, defaultRows = []) => {
		const current = getFieldSetIds(descriptors, rows);
		const defaults = new Set(
			toIds(defaultRows).length > 0
				? getFieldSetIds(descriptors, defaultRows)
				: getDefaultFieldIds(descriptors),
		);

		return current.length === defaults.size && current.every((id) => defaults.has(id));
	};

	/**
	 * The set as the form is to keep it after a choice of fields: the ones already on the form keep
	 * their places, the newly chosen go after them in the order of the dictionary. The user arranges
	 * the fields of the form in the web, and that arrangement must survive a field being added here.
	 *
	 * "Already on the form" is read the way the form reads it, so a filter that names no rows keeps the
	 * fields of the provider ahead of the new one: taken literally, an empty set would let a field the
	 * dictionary lists earlier jump above the row the user was looking at.
	 *
	 * @param {FieldDescriptor[]} descriptors
	 * @param {string[]} rows the set the form is showing now
	 * @param {string[]} selectedIds
	 * @return {string[]}
	 */
	const orderFieldSet = (descriptors, rows, selectedIds) => {
		const selected = new Set(toIds(selectedIds));
		const kept = getFieldSetIds(descriptors, rows).filter((id) => selected.has(id));
		const keptIds = new Set(kept);
		const added = toDescriptors(descriptors)
			.filter((descriptor) => selected.has(descriptor.id) && !keptIds.has(descriptor.id))
			.map((descriptor) => descriptor.id);

		return [...kept, ...added];
	};

	/**
	 * Values of the fields the set holds. A field taken off the form loses its value: left behind, it
	 * would narrow the list by a condition nothing on the screen shows.
	 *
	 * @param {FieldDescriptor[]} descriptors
	 * @param {string[]} rows
	 * @param {FilterValues} values
	 * @return {FilterValues} a new map; the given one is left as it was
	 */
	const dropValuesOutsideSet = (descriptors, rows, values) => {
		const inSet = new Set(getFieldSetIds(descriptors, rows));
		const kept = {};

		Object.entries(toValues(values)).forEach(([fieldId, value]) => {
			if (inSet.has(fieldId))
			{
				kept[fieldId] = value;
			}
		});

		return kept;
	};

	/**
	 * The fields of the dictionary split into the groups of the server, in its order. A field naming no
	 * group - or a group the server did not describe - belongs to the first one, the way the web reads
	 * its own default section. A list the web does not group comes back as one flat group.
	 *
	 * @param {FieldDescriptor[]} descriptors
	 * @param {FieldSection[]} sections
	 * @return {Array<{id: string, name: string|null, descriptors: FieldDescriptor[]}>}
	 */
	const groupFields = (descriptors, sections) => {
		const fields = toDescriptors(descriptors);
		const groups = Type.isArrayFilled(sections) ? sections : [];

		if (groups.length === 0)
		{
			return [{ id: FLAT_GROUP_ID, name: null, descriptors: fields }];
		}

		const buckets = new Map(groups.map((section) => [section.id, []]));
		const defaultId = groups[0].id;

		fields.forEach((descriptor) => {
			const id = buckets.has(descriptor.sectionId) ? descriptor.sectionId : defaultId;
			buckets.get(id).push(descriptor);
		});

		return groups
			.map((section) => ({
				id: section.id,
				name: section.name,
				descriptors: buckets.get(section.id),
			}))
			.filter((group) => group.descriptors.length > 0);
	};

	module.exports = {
		FLAT_GROUP_ID,
		groupFields,
		getDefaultFieldIds,
		getFieldSetIds,
		getVisibleFields,
		getVisibleFieldIds,
		isDefaultFieldSet,
		orderFieldSet,
		dropValuesOutsideSet,
	};
});
