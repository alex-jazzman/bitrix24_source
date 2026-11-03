/**
 * @module crm/entity-tab/unified-filter/entity-selectors
 */
jn.define('crm/entity-tab/unified-filter/entity-selectors', (require, exports, module) => {
	/**
	 * Pickers of the entities the CRM filter names (CONTRACT-DTO-01). One entry per entity the
	 * server actually names (CrmMobile\Filter\FieldDescriptorNormalizer::getEntityMap): a picker
	 * for an entity that never arrives reads as a supported case and is not one. Every one of them
	 * is a selector the module already ships - nothing here is written for the filter.
	 * @type {EntitySelectorMap}
	 */
	const CRM_ENTITY_SELECTORS = {
		user: 'user',
		'crm-contact': 'contact',
		'crm-company': 'company',
		product: 'product',
	};

	module.exports = { CRM_ENTITY_SELECTORS };
});
