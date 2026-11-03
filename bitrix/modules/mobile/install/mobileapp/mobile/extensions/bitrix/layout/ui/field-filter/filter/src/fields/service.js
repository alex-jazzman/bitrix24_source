/**
 * @module layout/ui/field-filter/filter/src/fields/service
 */
jn.define('layout/ui/field-filter/filter/src/fields/service', (require, exports, module) => {
	const { callFilterAction } = require('layout/ui/field-filter/filter/src/action');
	const store = require('statemanager/redux/store');
	const { selectFilterDictionary } = require('statemanager/redux/slices/field-filter/selector');
	const { filterFieldItemsLoaded } = require('statemanager/redux/slices/field-filter');
	const { parseFilterFields, parseFieldItems } = require('layout/ui/field-filter/filter/src/fields/parser');

	/**
	 * Method name is fixed by CONTRACT-DTO-01, the namespace belongs to the consumer.
	 * @type {string}
	 */
	const FIELDS_METHOD = 'getFilterFields';

	/**
	 * Values of one field of the list, for a field whose reference book the dictionary left on the
	 * server (CONTRACT-DTO-01, DeferredItems).
	 * @type {string}
	 */
	const FIELD_ITEMS_METHOD = 'getFilterFieldItems';

	/**
	 * The field list of the form, written where the web filter keeps its own (CONTRACT-API-02).
	 * @type {string}
	 */
	const FIELD_SET_METHOD = 'saveFieldSet';

	/**
	 * Reads the field dictionary of a list. Every consumer of the filter needs the same three
	 * things out of it - the grid id, the descriptors and the preset the server considers
	 * current - so the request lives here rather than being retyped per list.
	 *
	 * How the list is addressed is the business of the consumer: its context is sent verbatim.
	 *
	 * @param {FilterFieldsParams} params
	 * @return {Promise<FilterFields|null>} null when the answer carries no usable dictionary
	 */
	const loadFilterFields = async (params) => {
		const { actionPrefix, context } = params;

		// the words of the controls are the same for every list and are kept in the store, so the
		// request says which language of them the client holds and the server sends them only when
		// that is no longer the language of the portal
		const response = await callFilterAction(actionPrefix, FIELDS_METHOD, {
			context,
			dictionaryLangId: getKeptDictionaryLangId(),
		});

		return parseFilterFields(response?.status === 'success' ? response.data : null);
	};

	/**
	 * Reads the values of one field and keeps them next to the list they belong to: the picker of that
	 * field is opened again from the store, and the row of the field words its value out of the same
	 * answer. A list read anew drops them (filterFieldItemsReset) - the values are as old as the
	 * dictionary they belong to.
	 *
	 * @param {FilterFieldItemsParams} params
	 * @return {Promise<?FieldItem[]>} null when the answer could not be read
	 */
	const loadFilterFieldItems = async (params) => {
		const { actionPrefix, context, gridId, fieldId } = params;

		const response = await callFilterAction(actionPrefix, FIELD_ITEMS_METHOD, { context, fieldId });

		const items = parseFieldItems(response?.status === 'success' ? response.data : null, fieldId);
		if (items === null)
		{
			return null;
		}

		store.dispatch(filterFieldItemsLoaded({ gridId, fieldId, items }));

		return items;
	};

	/**
	 * Keeps the fields the form shows on the server: the set belongs to the user and not to the
	 * session of the app, and the web form of the same list reads the very same answer.
	 *
	 * The form does not wait for it - the set is already on the screen, the same way the web applies
	 * its own field list before saving it - so the request is not allowed to hold the drawer. A write
	 * that never arrived leaves the set where it was before, and the next opening of the list says so.
	 *
	 * @param {FilterFieldSetParams} params
	 * @return {Promise<boolean>} whether the server took the set
	 */
	const saveFilterFieldSet = async (params) => {
		const { actionPrefix, context, rows } = params;

		const response = await callFilterAction(actionPrefix, FIELD_SET_METHOD, { context, rows });

		return response?.status === 'success';
	};

	/**
	 * @return {string} empty while the client holds no vocabulary at all
	 */
	const getKeptDictionaryLangId = () => selectFilterDictionary(store.getState())?.langId ?? '';

	module.exports = { loadFilterFields, loadFilterFieldItems, saveFilterFieldSet };
});
