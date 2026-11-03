/**
 * @module crm/in-app-url/routes/entity-list-target
 */
jn.define('crm/in-app-url/routes/entity-list-target', (require, exports, module) => {
	const { Type } = require('crm/type');

	const NUMERIC_TYPE_SEGMENT = 'type';

	/**
	 * Resolves the entity list a /crm/... link points at.
	 *
	 * A path segment is not an entity name: /crm/type/1054/ addresses the DYNAMIC_1054 tab,
	 * so the tab name comes from the resolved type id and never from the segment itself.
	 *
	 * @param {CrmEntityListPathParams} pathParams
	 * @return {CrmEntityListTarget}
	 */
	const resolveEntityListTarget = ({ typeName, typeId } = {}) => {
		const entityTypeId = typeName === NUMERIC_TYPE_SEGMENT && typeId
			? Number(typeId) || null
			: Type.resolveIdByName(typeName);

		return {
			entityTypeId,
			activeTabName: Type.resolveNameById(entityTypeId),
		};
	};

	module.exports = { resolveEntityListTarget };
});
